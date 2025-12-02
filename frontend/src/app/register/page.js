'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { SecureKeyStorage } from '@/lib/encryption';
import KeyGenerator from '@/components/KeyGenerator';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    publicKey: '',
    privateKey: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.publicKey) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!formData.publicKey.trim()) {
      setError('Public key is required. Please generate keys first.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Register user
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        publicKey: formData.publicKey.trim()
      });

      const { token, user } = response.data;

      // Store private key securely in IndexedDB
      if (formData.privateKey.trim()) {
        const keyStorage = new SecureKeyStorage();
        await keyStorage.storePrivateKey(user.id, formData.privateKey.trim());
        console.log('✅ Private key stored securely');
      }

      // Store token and user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Success - redirect to chat
      alert('Registration successful! Welcome to PQC Secure Messaging.');
      router.push('/chat');
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.error || 
        'Registration failed. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 my-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Join the post-quantum secure messaging platform</p>
        </div>

        {/* Key Generation Help */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-2xl mr-3">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Generate Your PQC Keys First!
              </h3>
              <p className="text-sm text-yellow-700 mb-2">
                Before registering, you must generate your post-quantum cryptographic key pair.
              </p>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-sm text-yellow-600 hover:text-yellow-800 underline"
              >
                {showHelp ? 'Hide Instructions' : 'Show Instructions'}
              </button>
              
              {showHelp && (
                <div className="mt-3 p-3 bg-white rounded border border-yellow-300">
                  <p className="text-sm text-gray-700 mb-2 font-semibold">Steps:</p>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Open terminal and navigate to <code className="bg-gray-100 px-1">pqc-keygen/</code> folder</li>
                    <li>Run: <code className="bg-gray-100 px-1">make</code> (compile)</li>
                    <li>Run: <code className="bg-gray-100 px-1">./keygen</code> (generate keys)</li>
                    <li>Copy content from <code className="bg-gray-100 px-1">public_key.txt</code></li>
                    <li>Paste it in the Public Key field below</li>
                    <li><strong>IMPORTANT:</strong> Save <code className="bg-gray-100 px-1">private_key.txt</code> securely!</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="Choose a username (min 3 characters)"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Password */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="Min 6 characters"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="Confirm password"
                required
              />
            </div>
          </div>


          <div className="max-w-4xl mx-auto">
          <KeyGenerator />
         </div>

          {/* Public Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Public Key (Base64) * <span className="text-xs text-gray-500">- Share this during registration</span>
            </label>
            <textarea
              name="publicKey"
              value={formData.publicKey}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-mono text-sm"
              placeholder="Paste your public key from public_key.txt here..."
              required
            />
          </div>

          {/* Private Key (Optional for auto-storage) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Key (Base64) - Optional <span className="text-xs text-red-600">- For secure storage only, NEVER share!</span>
            </label>
            <textarea
              name="privateKey"
              value={formData.privateKey}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-mono text-sm"
              placeholder="Optional: Paste your private key here to store it securely in your browser..."
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Your private key will be stored securely in IndexedDB (not localStorage). You can also store it manually later.
            </p>
          </div>



          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="px-4 text-sm text-gray-500">OR</div>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              Sign In
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Home
          </Link>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            🔒 Your private key never leaves your device. All messages are end-to-end encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}













// import KeyGenerator from '@/components/KeyGenerator';

// export default function Home() {
//   return (
//     <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
//       <div className="max-w-4xl mx-auto">
//         <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
//           🔐 Post-Quantum Secure Messaging
//         </h1>
//         <p className="text-center text-gray-600 mb-8">
//           Quantum-resistant encryption using Kyber1024
//         </p>
//         <KeyGenerator />
//       </div>
//     </main>
//   );
// }









// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { authAPI } from '@/lib/api';
// import { SecureKeyStorage } from '@/lib/encryption';

// export default function RegisterPage() {
//   const router = useRouter();
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     publicKey: '',
//     privateKey: ''
//   });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [generating, setGenerating] = useState(false);
//   const [keysGenerated, setKeysGenerated] = useState(false);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//     setError('');
//   };

//   // Generate PQC Keys (simulated Kyber-1024)
//   const generateKeys = async () => {
//     setGenerating(true);
//     setError('');

//     try {
//       // Simulate key generation delay for UX
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Kyber-1024 key sizes
//       const PUBLIC_KEY_SIZE = 1568;  // bytes
//       const PRIVATE_KEY_SIZE = 3168; // bytes

//       // Generate random bytes (simulating Kyber-1024)
//       const publicKeyBytes = new Uint8Array(PUBLIC_KEY_SIZE);
//       const privateKeyBytes = new Uint8Array(PRIVATE_KEY_SIZE);

//       // Fill with random values
//       crypto.getRandomValues(publicKeyBytes);
//       crypto.getRandomValues(privateKeyBytes);

//       // Convert to Base64
//       const publicKeyB64 = btoa(String.fromCharCode(...publicKeyBytes));
//       const privateKeyB64 = btoa(String.fromCharCode(...privateKeyBytes));

//       // Set in form
//       setFormData(prev => ({
//         ...prev,
//         publicKey: publicKeyB64,
//         privateKey: privateKeyB64
//       }));

//       setKeysGenerated(true);
      
//       // Show success message
//       alert('✅ Keys generated successfully!\n\n⚠️ Your private key will be stored securely in your browser.');

//     } catch (error) {
//       console.error('Key generation error:', error);
//       setError('Failed to generate keys. Please try again.');
//     } finally {
//       setGenerating(false);
//     }
//   };

//   // Download private key as file
//   const downloadPrivateKey = () => {
//     if (!formData.privateKey) {
//       alert('No private key to download');
//       return;
//     }

//     const blob = new Blob([formData.privateKey], { type: 'text/plain' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `${formData.username || 'user'}_private_key.txt`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
    
//     alert('✅ Private key downloaded!\n\n⚠️ Keep this file safe and never share it with anyone!');
//   };

//   const validateForm = () => {
//     if (!formData.username || !formData.email || !formData.password || !formData.publicKey) {
//       setError('Please fill in all required fields');
//       return false;
//     }

//     if (formData.username.length < 3) {
//       setError('Username must be at least 3 characters');
//       return false;
//     }

//     if (formData.password.length < 6) {
//       setError('Password must be at least 6 characters');
//       return false;
//     }

//     if (formData.password !== formData.confirmPassword) {
//       setError('Passwords do not match');
//       return false;
//     }

//     if (!formData.publicKey.trim()) {
//       setError('Please generate your encryption keys first');
//       return false;
//     }

//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (!validateForm()) {
//       return;
//     }

//     setLoading(true);

//     try {
//       // Register user
//       const response = await authAPI.register({
//         username: formData.username,
//         email: formData.email,
//         password: formData.password,
//         publicKey: formData.publicKey.trim()
//       });

//       const { token, user } = response.data;

//       // Store private key securely in IndexedDB
//       if (formData.privateKey.trim()) {
//         const keyStorage = new SecureKeyStorage();
//         await keyStorage.storePrivateKey(user.id, formData.privateKey.trim());
//         console.log('✅ Private key stored securely in IndexedDB');
//       }

//       // Store token and user
//       localStorage.setItem('token', token);
//       localStorage.setItem('user', JSON.stringify(user));

//       // Success
//       alert('🎉 Registration successful!\n\n✅ Your private key is stored securely.\n🔒 You can now send encrypted messages!');
//       router.push('/chat');
      
//     } catch (err) {
//       console.error('Registration error:', err);
//       setError(
//         err.response?.data?.error || 
//         'Registration failed. Please try again.'
//       );
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 my-8">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="text-5xl mb-4">🔐</div>
//           <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
//           <p className="text-gray-600">Join the post-quantum secure messaging platform</p>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start">
//             <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//             </svg>
//             <p className="text-sm">{error}</p>
//           </div>
//         )}

//         {/* Registration Form */}
//         <form onSubmit={handleSubmit} className="space-y-4">
//           {/* Username */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Username *
//             </label>
//             <input
//               type="text"
//               name="username"
//               value={formData.username}
//               onChange={handleChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
//               placeholder="Choose a username (min 3 characters)"
//               required
//             />
//           </div>

//           {/* Email */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Email Address *
//             </label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
//               placeholder="your@email.com"
//               required
//             />
//           </div>

//           {/* Password */}
//           <div className="grid md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Password *
//               </label>
//               <input
//                 type="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
//                 placeholder="Min 6 characters"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Confirm Password *
//               </label>
//               <input
//                 type="password"
//                 name="confirmPassword"
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
//                 placeholder="Confirm password"
//                 required
//               />
//             </div>
//           </div>

//           {/* Key Generation Section */}
//           <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
//             <div className="flex items-start justify-between mb-4">
//               <div>
//                 <h3 className="text-lg font-bold text-gray-800 flex items-center">
//                   <span className="text-2xl mr-2">🔑</span>
//                   Encryption Keys
//                 </h3>
//                 <p className="text-sm text-gray-600 mt-1">
//                   Generate your post-quantum cryptographic key pair
//                 </p>
//               </div>
//               {keysGenerated && (
//                 <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
//                   ✓ Generated
//                 </span>
//               )}
//             </div>

//             {!keysGenerated ? (
//               <button
//                 type="button"
//                 onClick={generateKeys}
//                 disabled={generating}
//                 className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//               >
//                 {generating ? (
//                   <>
//                     <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Generating Keys...
//                   </>
//                 ) : (
//                   <>
//                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                     </svg>
//                     Generate Keys
//                   </>
//                 )}
//               </button>
//             ) : (
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
//                   <div className="flex items-center">
//                     <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                     <span className="text-sm font-semibold text-gray-700">Public Key</span>
//                   </div>
//                   <span className="text-xs text-gray-500">{formData.publicKey.length} chars</span>
//                 </div>
//                 <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
//                   <div className="flex items-center">
//                     <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                     <span className="text-sm font-semibold text-gray-700">Private Key</span>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={downloadPrivateKey}
//                     className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center"
//                   >
//                     <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//                     </svg>
//                     Download
//                   </button>
//                 </div>
                
//                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
//                   <p className="text-xs text-yellow-800 flex items-start">
//                     <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                     </svg>
//                     <span>Your private key will be stored securely in your browser. We recommend downloading a backup copy.</span>
//                   </p>
//                 </div>
//               </div>
//             )}

//             <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
//               <p className="text-xs text-blue-800">
//                 <strong>🔒 About Your Keys:</strong>
//               </p>
//               <ul className="text-xs text-blue-700 mt-2 space-y-1">
//                 <li>• <strong>Public Key:</strong> Shared with others to send you encrypted messages</li>
//                 <li>• <strong>Private Key:</strong> Stays on your device, used to decrypt messages</li>
//                 <li>• <strong>Kyber-1024:</strong> Post-quantum secure algorithm (NIST approved)</li>
//               </ul>
//             </div>
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             disabled={loading || !keysGenerated}
//             className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
//           >
//             {loading ? (
//               <span className="flex items-center justify-center">
//                 <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                 </svg>
//                 Creating Account...
//               </span>
//             ) : !keysGenerated ? (
//               'Generate Keys First ↑'
//             ) : (
//               'Create Account'
//             )}
//           </button>
//         </form>

//         {/* Divider */}
//         <div className="my-6 flex items-center">
//           <div className="flex-1 border-t border-gray-300"></div>
//           <div className="px-4 text-sm text-gray-500">OR</div>
//           <div className="flex-1 border-t border-gray-300"></div>
//         </div>

//         {/* Login Link */}
//         <div className="text-center">
//           <p className="text-gray-600">
//             Already have an account?{' '}
//             <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
//               Sign In
//             </Link>
//           </p>
//         </div>

//         {/* Back to Home */}
//         <div className="mt-6 text-center">
//           <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
//             ← Back to Home
//           </Link>
//         </div>

//         {/* Security Notice */}
//         <div className="mt-8 p-4 bg-blue-50 rounded-lg">
//           <p className="text-xs text-blue-800 text-center">
//             🔒 Your private key never leaves your device. All messages are end-to-end encrypted.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

