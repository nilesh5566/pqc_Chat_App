'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/chat');
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
            <span className="text-white font-bold text-xl">PQC Messenger</span>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-opacity-90 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-white mb-16 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Secure Messaging for the
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
              Quantum Era
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            Experience military-grade encryption with post-quantum cryptography. 
            Your messages are protected against future quantum computers.
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-opacity-90 transition transform hover:scale-105 shadow-2xl"
            >
              Start Chatting Free →
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-purple-600 bg-opacity-30 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-opacity-40 transition border-2 border-white border-opacity-30"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Hero Image/Demo */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-2 border border-white border-opacity-20">
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              {/* Mock Chat Interface */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Alice</div>
                    <div className="text-white text-xs opacity-80">● Online</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xl">🔒</span>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4 bg-gray-800">
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
                    Hey! How secure is this? 🤔
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-white px-4 py-2 rounded-lg max-w-xs">
                    Super secure! Protected by Kyber-1024 PQC 🔐
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
                    Even quantum computers can't break it? 🤯
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-700 text-white px-4 py-2 rounded-lg max-w-xs">
                    Exactly! That's the future of encryption! 🚀
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose PQC Messenger?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge technology to keep your conversations private and secure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl hover:shadow-xl transition">
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Post-Quantum Secure</h3>
              <p className="text-gray-600">
                Protected with Kyber-1024, a NIST-approved algorithm that resists quantum computer attacks. Your messages are safe for decades.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl hover:shadow-xl transition">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">End-to-End Encrypted</h3>
              <p className="text-gray-600">
                Only you and your recipient can read messages. Not even we can decrypt them. True privacy guaranteed.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-pink-50 to-red-50 p-8 rounded-2xl hover:shadow-xl transition">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Real-Time Messaging</h3>
              <p className="text-gray-600">
                Instant message delivery with WebSocket technology. See typing indicators and online status in real-time.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-green-50 to-teal-50 p-8 rounded-2xl hover:shadow-xl transition">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Friend System</h3>
              <p className="text-gray-600">
                Send friend requests and build your secure network. Only chat with people you trust.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-2xl hover:shadow-xl transition">
              <div className="text-5xl mb-4">🔔</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Smart Notifications</h3>
              <p className="text-gray-600">
                Get notified of new messages, friend requests, and when friends come online. Never miss a conversation.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl hover:shadow-xl transition">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Cross-Platform</h3>
              <p className="text-gray-600">
                Works seamlessly on desktop, tablet, and mobile. Modern responsive design that adapts to any screen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Section */}
      <div className="bg-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-12">
              Military-Grade Encryption Stack
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <span className="text-2xl mr-2">🔐</span>
                  Post-Quantum Crypto
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>Kyber-1024 KEM Algorithm</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>NIST Standardized (2022)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>Quantum-Resistant Security</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>Future-Proof Protection</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <span className="text-2xl mr-2">🛡️</span>
                  Message Encryption
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>AES-256-GCM Encryption</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>Unique Session Keys</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>Forward Secrecy</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>Authenticated Encryption</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-xl text-white">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Open Source & Academic</h3>
                <p className="text-lg mb-6 opacity-90">
                  Built as an academic project demonstrating post-quantum cryptography in real-world applications. 
                  Perfect for learning, research, and secure communication.
                </p>
                <div className="flex justify-center gap-4">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-opacity-90 transition"
                  >
                    View on GitHub →
                  </a>
                  <Link
                    href="/register"
                    className="px-6 py-3 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition"
                  >
                    Try It Now →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-12">
              How It Works
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Generate Your Keys</h3>
                  <p className="text-gray-600">
                    Run the key generator to create your unique Kyber-1024 key pair. Your private key stays on your device forever.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Register Your Account</h3>
                  <p className="text-gray-600">
                    Sign up with your username, email, and public key. Your public key is shared with others to send you encrypted messages.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Add Friends</h3>
                  <p className="text-gray-600">
                    Search for users and send friend requests. Once accepted, you can start secure conversations.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Chat Securely</h3>
                  <p className="text-gray-600">
                    Send messages that are automatically encrypted with post-quantum cryptography. Only your friend can decrypt them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Experience Quantum-Safe Messaging?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8 max-w-2xl mx-auto">
            Join now and be part of the future of secure communication. 
            It's free, open source, and quantum-resistant.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-5 bg-white text-purple-600 rounded-xl font-bold text-xl hover:bg-opacity-90 transition transform hover:scale-105 shadow-2xl"
          >
            Get Started Now - It's Free! →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🔐</span>
                <span className="font-bold text-xl">PQC Messenger</span>
              </div>
              <p className="text-gray-400">
                Post-quantum secure messaging for everyone. Built with Kyber-1024 and AES-256-GCM.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/register" className="hover:text-white transition">Register</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Login</Link></li>
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="https://github.com" className="hover:text-white transition">GitHub</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Technology</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Next.js 14</li>
                <li>Socket.io</li>
                <li>MongoDB</li>
                <li>Kyber-1024 PQC</li>
                <li>AES-256-GCM</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2025 PQC Messenger. Academic Project - ITC Lab Assignment 3</p>
            <p className="mt-2">Built with ❤️ for secure communication</p>
          </div>
        </div>
      </footer>
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