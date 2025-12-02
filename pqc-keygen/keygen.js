#!/usr/bin/env node

/**
 * PQC Key Generation Tool (JavaScript Version)
 * 
 * This is a simplified key generator that works on Windows without liboqs.
 * For production, integrate actual Kyber-1024 implementation via WASM.
 * 
 * This generates mock keys for DEVELOPMENT/TESTING purposes only.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     Post-Quantum Cryptography Key Generation Tool          ║');
console.log('║     Algorithm: Kyber1024 (Simulated for Development)      ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// Kyber-1024 specifications (real sizes)
const PUBLIC_KEY_SIZE = 1568;  // bytes
const PRIVATE_KEY_SIZE = 3168; // bytes

console.log('⚠️  DEVELOPMENT MODE');
console.log('   This generates mock keys for testing purposes.');
console.log('   For production, use actual Kyber-1024 implementation.');
console.log('');

console.log('✅ KEM Configuration: Kyber1024');
console.log(`   Public key size:  ${PUBLIC_KEY_SIZE} bytes`);
console.log(`   Private key size: ${PRIVATE_KEY_SIZE} bytes`);
console.log('');

console.log('🔑 Generating key pair...');

// Generate random bytes (simulating PQC keys)
// In production, this would be actual Kyber key generation
const publicKey = crypto.randomBytes(PUBLIC_KEY_SIZE);
const privateKey = crypto.randomBytes(PRIVATE_KEY_SIZE);

// Convert to Base64 for storage
const publicKeyB64 = publicKey.toString('base64');
const privateKeyB64 = privateKey.toString('base64');

console.log('✅ Key pair generated successfully!');
console.log('');

// Save to files
try {
  fs.writeFileSync(path.join(__dirname, 'public_key.txt'), publicKeyB64);
  fs.writeFileSync(path.join(__dirname, 'private_key.txt'), privateKeyB64);
  
  console.log('📁 Keys saved to files:');
  console.log('   Public key:  public_key.txt');
  console.log('   Private key: private_key.txt');
  console.log('');
} catch (error) {
  console.error('❌ Error saving keys:', error.message);
  process.exit(1);
}

// Display public key
console.log('📋 Public Key (Base64):');
console.log('════════════════════════════════════════════════════════════');
console.log(publicKeyB64.substring(0, 100) + '...');
console.log('════════════════════════════════════════════════════════════');
console.log('');

// Display first part of private key
console.log('🔒 Private Key (Base64) - KEEP THIS SECRET:');
console.log('════════════════════════════════════════════════════════════');
console.log(privateKeyB64.substring(0, 100) + '...');
console.log('════════════════════════════════════════════════════════════');
console.log('');

console.log('⚠️  SECURITY NOTICE:');
console.log('   • Store the private key securely');
console.log('   • Never share your private key');
console.log('   • Use the public key during registration');
console.log('   • Private key stays on YOUR device only');
console.log('');

console.log('💡 DEVELOPMENT NOTE:');
console.log('   These are mock keys for testing.');
console.log('   For production deployment:');
console.log('   1. Integrate liboqs via WebAssembly');
console.log('   2. Use actual Kyber-1024 implementation');
console.log('   3. See IMPLEMENTATION_NOTES.md for details');
console.log('');

console.log('✅ Key generation completed successfully!');
console.log('');

// Create a summary file
const summary = {
  generated: new Date().toISOString(),
  algorithm: 'Kyber1024 (Simulated)',
  publicKeySize: PUBLIC_KEY_SIZE,
  privateKeySize: PRIVATE_KEY_SIZE,
  mode: 'development',
  publicKey: publicKeyB64,
  warning: 'Mock keys for development only. Use actual PQC in production.'
};

fs.writeFileSync(
  path.join(__dirname, 'key_info.json'),
  JSON.stringify(summary, null, 2)
);

console.log('📄 Key information saved to: key_info.json');
console.log('');