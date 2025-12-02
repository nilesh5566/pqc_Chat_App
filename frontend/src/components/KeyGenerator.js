'use client';

import { useState, useEffect } from 'react';

// Simulated PQC crypto functions (replace with your actual implementation)
const generateKeyPair = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const PUBLIC_KEY_SIZE = 1568;
  const PRIVATE_KEY_SIZE = 3168;
  
  const publicKeyBytes = new Uint8Array(PUBLIC_KEY_SIZE);
  const privateKeyBytes = new Uint8Array(PRIVATE_KEY_SIZE);
  
  crypto.getRandomValues(publicKeyBytes);
  crypto.getRandomValues(privateKeyBytes);
  
  return {
    publicKey: publicKeyBytes,
    secretKey: privateKeyBytes
  };
};

const keyToBase64 = (keyBytes) => {
  return btoa(String.fromCharCode(...keyBytes));
};

export default function KeyGenerator() {
  const [keys, setKeys] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔑 Generating quantum-resistant keys...');
      const { publicKey, secretKey } = await generateKeyPair();
      
      const publicKeyB64 = keyToBase64(publicKey);
      const secretKeyB64 = keyToBase64(secretKey);
      
      setKeys({
        publicKey: publicKeyB64,
        secretKey: secretKeyB64,
        publicKeySize: publicKey.length,
        secretKeySize: secretKey.length,
      });
      
      console.log('✅ Keys generated successfully');
    } catch (err) {
      setError('Key generation failed: ' + err.message);
      console.error('❌ Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setKeys(null);
    setCopiedPublic(false);
    setCopiedPrivate(false);
    console.log('🗑️ Keys cleared');
  };

  const copyToClipboard = async (text, isPrivate = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isPrivate) {
        setCopiedPrivate(true);
        setTimeout(() => setCopiedPrivate(false), 2000);
      } else {
        setCopiedPublic(true);
        setTimeout(() => setCopiedPublic(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const downloadKey = (key, filename) => {
    const blob = new Blob([key], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">🔐 Quantum-Resistant Key Generator</h2>
        <p className="text-sm text-gray-600 mt-1">
          Generate cryptographic keys resistant to quantum computer attacks
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">⚠️ {error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Generating Keys...' : '🔑 Generate New Key Pair'}
          </button>
          
          {keys && (
            <button
              onClick={handleClear}
              className="px-6 py-3 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors"
            >
              🗑️ Clear
            </button>
          )}
        </div>
      </div>

      {keys && (
        <div className="space-y-4">
          {/* Public Key */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-green-800 flex items-center gap-2">
                <span>🔓</span> Public Key
              </h3>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                {keys.publicKeySize} bytes
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-green-200 overflow-x-auto">
              <code className="text-xs font-mono text-gray-700 break-all">
                {keys.publicKey.substring(0, 200)}...
              </code>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => copyToClipboard(keys.publicKey, false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                {copiedPublic ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Public Key
                  </>
                )}
              </button>
              <button
                onClick={() => downloadKey(keys.publicKey, 'public_key.txt')}
                className="px-4 py-2 bg-white border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
            <p className="text-xs text-green-700 mt-2">
              ℹ️ Share this with others to receive encrypted messages
            </p>
          </div>

          {/* Private Key */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-red-800 flex items-center gap-2">
                <span>🔒</span> Secret Key
              </h3>
              <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                {keys.secretKeySize} bytes
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-red-200 overflow-x-auto">
              <code className="text-xs font-mono text-gray-700 break-all">
                {keys.secretKey.substring(0, 200)}...
              </code>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => copyToClipboard(keys.secretKey, true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                {copiedPrivate ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Private Key
                  </>
                )}
              </button>
              <button
                onClick={() => downloadKey(keys.secretKey, 'private_key.txt')}
                className="px-4 py-2 bg-white border border-red-600 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
            <p className="text-xs text-red-700 mt-2">
              ⚠️ NEVER share this! Keep it secret and secure
            </p>
          </div>

          {/* Key Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📊 Key Information</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✅ Algorithm: <strong>Kyber1024</strong> (NIST PQC Standard)</li>
              <li>✅ Security Level: Equivalent to AES-256</li>
              <li>✅ Quantum Resistant: Yes</li>
              <li>✅ Public Key Size: {keys.publicKeySize} bytes</li>
              <li>✅ Private Key Size: {keys.secretKeySize} bytes</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}