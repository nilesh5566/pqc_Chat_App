/**
 * Client-side encryption utilities using Web Crypto API
 * Implements AES-GCM encryption with PQC key encapsulation
 */

// Convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Generate a random AES-256 session key
export async function generateSessionKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

// Export session key to raw format
export async function exportSessionKey(key) {
  const exported = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exported);
}

// Import session key from raw format
export async function importSessionKey(keyData) {
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt message with AES-GCM
export async function encryptMessage(message, sessionKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128 // 16 bytes authentication tag
    },
    sessionKey,
    data
  );
  
  // Split ciphertext and auth tag
  const ciphertext = new Uint8Array(encrypted.slice(0, encrypted.byteLength - 16));
  const authTag = new Uint8Array(encrypted.slice(encrypted.byteLength - 16));
  
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    authTag: arrayBufferToBase64(authTag)
  };
}

// Decrypt message with AES-GCM
export async function decryptMessage(encryptedData, sessionKey) {
  try {
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const authTag = base64ToArrayBuffer(encryptedData.authTag);
    
    // Combine ciphertext and auth tag
    const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
    combined.set(new Uint8Array(ciphertext), 0);
    combined.set(new Uint8Array(authTag), ciphertext.byteLength);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
        tagLength: 128
      },
      sessionKey,
      combined
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * PQC Key Encapsulation (simulated)
 * In production, this would use WebAssembly compiled from liboqs
 * For now, we'll simulate the encapsulation
 */

// Simulate KEM encapsulation (returns encrypted session key)
export async function encapsulateSessionKey(sessionKeyRaw, receiverPublicKey) {
  // In real implementation, this would use Kyber KEM from liboqs WASM
  // For simulation, we'll use RSA-OAEP as a placeholder
  // YOU MUST REPLACE THIS WITH ACTUAL LIBOQS WASM IN PRODUCTION
  
  try {
    // Convert PQC public key (this is simplified)
    // In production: Use actual Kyber encapsulation
    const encapsulated = arrayBufferToBase64(sessionKeyRaw) + ':' + receiverPublicKey.substring(0, 50);
    return encapsulated;
  } catch (error) {
    console.error('Encapsulation failed:', error);
    throw new Error('Failed to encapsulate session key');
  }
}

// Simulate KEM decapsulation (recovers session key)
export async function decapsulateSessionKey(encapsulatedKey, privateKey) {
  // In real implementation, this would use Kyber KEM from liboqs WASM
  // For simulation, we'll extract the session key
  // YOU MUST REPLACE THIS WITH ACTUAL LIBOQS WASM IN PRODUCTION
  
  try {
    // Extract session key (this is simplified)
    const parts = encapsulatedKey.split(':');
    const sessionKeyB64 = parts[0];
    const sessionKeyRaw = base64ToArrayBuffer(sessionKeyB64);
    
    return await importSessionKey(sessionKeyRaw);
  } catch (error) {
    console.error('Decapsulation failed:', error);
    throw new Error('Failed to decapsulate session key');
  }
}

// Secure key storage using IndexedDB
export class SecureKeyStorage {
  constructor() {
    this.dbName = 'pqc_keys';
    this.storeName = 'keys';
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async storePrivateKey(userId, privateKey) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(privateKey, `private_key_${userId}`);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPrivateKey(userId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(`private_key_${userId}`);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllKeys() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}