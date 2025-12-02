/**
 * Post-Quantum Cryptography wrapper for WebAssembly module
 */

let pqcModule = null;
let modulePromise = null;

/**
 * Load the WASM script dynamically using script tag
 */
function loadWasmScript() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.createPQCModule) {
      resolve(window.createPQCModule);
      return;
    }

    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined - must run in browser'));
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src="/pqc_keygen.js"]');
    if (existingScript) {
      // Wait for it to load
      if (window.createPQCModule) {
        resolve(window.createPQCModule);
      } else {
        existingScript.addEventListener('load', () => {
          if (window.createPQCModule) {
            resolve(window.createPQCModule);
          } else {
            reject(new Error('createPQCModule not found after load'));
          }
        });
      }
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = '/pqc_keygen.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ WASM script loaded');
      if (window.createPQCModule) {
        resolve(window.createPQCModule);
      } else {
        reject(new Error('createPQCModule not found on window'));
      }
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load WASM script:', error);
      reject(new Error('Failed to load pqc_keygen.js - check if file exists in public folder'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Initialize the PQC WASM module
 */
export async function initPQC() {
  if (pqcModule) {
    console.log('✅ PQC Module already initialized');
    return pqcModule;
  }

  // Prevent multiple simultaneous initializations
  if (modulePromise) return modulePromise;

  modulePromise = (async () => {
    try {
      console.log('🔄 Loading PQC WASM module...');
      
      // Load the script
      const createPQCModule = await loadWasmScript();
      
      console.log('🔄 Initializing WASM module...');
      
      // Initialize the module
      pqcModule = await createPQCModule({
        locateFile: (path) => {
          // Ensure WASM file is loaded from public folder
          if (path.endsWith('.wasm')) {
            return '/' + path;
          }
          return path;
        },
        onRuntimeInitialized: () => {
          console.log('✅ WASM runtime initialized');
        }
      });
      
      console.log('✅ PQC Module initialized successfully');
      return pqcModule;
    } catch (error) {
      console.error('❌ Failed to initialize PQC module:', error);
      modulePromise = null; // Reset so we can retry
      throw error;
    }
  })();

  return modulePromise;
}

/**
 * Generate a new key pair
 * @returns {Promise<{publicKey: Uint8Array, secretKey: Uint8Array}>}
 */
export async function generateKeyPair() {
  if (!pqcModule) {
    console.log('🔄 Module not initialized, initializing now...');
    await initPQC();
  }

  try {
    console.log('🔑 Generating key pair...');
    
    // Call the C function to generate keys
    const result = pqcModule._generate_keypair();
    
    if (result !== 1) {
      throw new Error('Key generation failed in C code (returned ' + result + ')');
    }

    // Get the key lengths
    const publicKeyLen = pqcModule._get_public_key_length();
    const secretKeyLen = pqcModule._get_secret_key_length();

    console.log(`📏 Key lengths - Public: ${publicKeyLen}, Secret: ${secretKeyLen}`);

    // Get pointers to the keys
    const publicKeyPtr = pqcModule._get_public_key();
    const secretKeyPtr = pqcModule._get_secret_key();

    // Copy keys from WASM memory to JavaScript
    const publicKey = new Uint8Array(
      pqcModule.HEAPU8.buffer,
      publicKeyPtr,
      publicKeyLen
    ).slice(); // .slice() creates a copy

    const secretKey = new Uint8Array(
      pqcModule.HEAPU8.buffer,
      secretKeyPtr,
      secretKeyLen
    ).slice();

    console.log(`✅ Generated keys - Public: ${publicKeyLen} bytes, Secret: ${secretKeyLen} bytes`);

    return {
      publicKey,
      secretKey,
    };
  } catch (error) {
    console.error('❌ Key generation error:', error);
    throw error;
  }
}

/**
 * Convert Uint8Array to Base64 string (for storage/transmission)
 */
export function keyToBase64(key) {
  return btoa(String.fromCharCode(...key));
}

/**
 * Convert Base64 string back to Uint8Array
 */
export function base64ToKey(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encapsulate (create shared secret using public key)
 */
export async function encapsulate(publicKey) {
  if (!pqcModule) await initPQC();

  const ciphertextLen = 1568; // Kyber1024 ciphertext length
  const sharedSecretLen = 32; // 256-bit shared secret

  // Allocate memory in WASM
  const publicKeyPtr = pqcModule._malloc(publicKey.length);
  const ciphertextPtr = pqcModule._malloc(ciphertextLen);
  const sharedSecretPtr = pqcModule._malloc(sharedSecretLen);

  try {
    // Copy public key to WASM memory
    pqcModule.HEAPU8.set(publicKey, publicKeyPtr);

    // Call encapsulation function
    const result = pqcModule._encapsulate(
      publicKeyPtr,
      ciphertextPtr,
      sharedSecretPtr
    );

    if (result !== 1) {
      throw new Error('Encapsulation failed');
    }

    // Copy results back
    const ciphertext = new Uint8Array(
      pqcModule.HEAPU8.buffer,
      ciphertextPtr,
      ciphertextLen
    ).slice();

    const sharedSecret = new Uint8Array(
      pqcModule.HEAPU8.buffer,
      sharedSecretPtr,
      sharedSecretLen
    ).slice();

    return { ciphertext, sharedSecret };
  } finally {
    // Free WASM memory
    pqcModule._free(publicKeyPtr);
    pqcModule._free(ciphertextPtr);
    pqcModule._free(sharedSecretPtr);
  }
}

/**
 * Decapsulate (retrieve shared secret using secret key)
 */
export async function decapsulate(secretKey, ciphertext) {
  if (!pqcModule) await initPQC();

  const sharedSecretLen = 32;

  const secretKeyPtr = pqcModule._malloc(secretKey.length);
  const ciphertextPtr = pqcModule._malloc(ciphertext.length);
  const sharedSecretPtr = pqcModule._malloc(sharedSecretLen);

  try {
    pqcModule.HEAPU8.set(secretKey, secretKeyPtr);
    pqcModule.HEAPU8.set(ciphertext, ciphertextPtr);

    const result = pqcModule._decapsulate(
      secretKeyPtr,
      ciphertextPtr,
      sharedSecretPtr
    );

    if (result !== 1) {
      throw new Error('Decapsulation failed');
    }

    const sharedSecret = new Uint8Array(
      pqcModule.HEAPU8.buffer,
      sharedSecretPtr,
      sharedSecretLen
    ).slice();

    return sharedSecret;
  } finally {
    pqcModule._free(secretKeyPtr);
    pqcModule._free(ciphertextPtr);
    pqcModule._free(sharedSecretPtr);
  }
}

/**
 * Clean up (optional, for memory management)
 */
export function cleanup() {
  if (pqcModule) {
    pqcModule._cleanup();
  }
}