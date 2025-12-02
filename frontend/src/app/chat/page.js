'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { initializeSocket, disconnectSocket } from '@/lib/socket';
import { friendAPI, userAPI, messageAPI } from '@/lib/api';
import {
  generateSessionKey,
  exportSessionKey,
  encryptMessage,
  decryptMessage,
  encapsulateSessionKey,
  decapsulateSessionKey,
  SecureKeyStorage
} from '@/lib/encryption';

export default function ChatPage() {
  const router = useRouter();
  
  // User & Friends
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  
  // Messages
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // Refs
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const keyStorage = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!storedUser || !token) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Initialize key storage
        keyStorage.current = new SecureKeyStorage();

        // Initialize socket
        const socket = initializeSocket(token);
        socketRef.current = socket;

        // Setup socket listeners BEFORE emitting user_online
        setupSocketListeners(socket, userData.id);

        // Register user as online
        socket.emit('user_online', { userId: userData.id });

        // Load friends
        await loadFriends();

        setLoading(false);
      } catch (error) {
        console.error('Initialize error:', error);
        router.push('/login');
      }
    };

    initialize();

    return () => {
      if (socketRef.current) {
        disconnectSocket();
      }
    };
  }, [router]);

  // Load friends
  const loadFriends = async () => {
    try {
      const response = await friendAPI.getFriends();
      const friendsList = response.data.friends || [];
      setFriends(friendsList);

      // Set online status for friends
      const onlineSet = new Set();
      friendsList.forEach(friend => {
        if (friend.online) {
          onlineSet.add(friend._id);
        }
      });
      setOnlineUsers(onlineSet);

    } catch (error) {
      console.error('Load friends error:', error);
    }
  };

  // Setup socket listeners
  const setupSocketListeners = (socket, userId) => {
    // Receive message
    socket.on('receive_message', async (data) => {
      console.log('📨 Received message:', data);
      
      try {
        const { message } = data;
        
        // Decrypt message
        const privateKey = await keyStorage.current.getPrivateKey(userId);
        
        if (!privateKey) {
          console.error('Private key not found');
          return;
        }

        const sessionKey = await decapsulateSessionKey(
          message.encapsulatedKey,
          privateKey
        );
        
        const decryptedText = await decryptMessage(
          {
            ciphertext: message.encryptedContent,
            iv: message.iv,
            authTag: message.authTag
          },
          sessionKey
        );

        const decryptedMessage = {
          ...message,
          text: decryptedText,
          decrypted: true
        };

        // Add to messages if chat is open
        if (selectedFriend && message.sender._id === selectedFriend._id) {
          setMessages(prev => [...prev, decryptedMessage]);
          
          // Mark as read
          socket.emit('mark_read', { 
            messageId: message._id, 
            userId: userId 
          });
        } else {
          // Update unread count
          setUnreadCounts(prev => ({
            ...prev,
            [message.sender._id]: (prev[message.sender._id] || 0) + 1
          }));
        }
      } catch (error) {
        console.error('Decrypt error:', error);
      }
    });

    // Message sent confirmation
    socket.on('message_sent', (data) => {
      console.log('✅ Message sent confirmation:', data);
      setSending(false);
      
      // Update temp message with real ID
      setMessages(prev => prev.map(msg => 
        msg._id === data.tempId 
          ? { ...data.message, text: msg.text, decrypted: true, pending: false }
          : msg
      ));
    });

    // Typing indicator
    socket.on('user_typing', ({ userId: typingUserId, typing }) => {
      console.log('⌨️ Typing:', typingUserId, typing);
      
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (typing) {
          newSet.add(typingUserId);
        } else {
          newSet.delete(typingUserId);
        }
        return newSet;
      });
    });

    // Online status
    socket.on('friend_online', ({ userId: friendUserId, online }) => {
      console.log('🟢 Status update:', friendUserId, online);
      
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (online) {
          newSet.add(friendUserId);
        } else {
          newSet.delete(friendUserId);
        }
        return newSet;
      });

      // Update friend in list
      setFriends(prev => prev.map(f => 
        f._id === friendUserId 
          ? { ...f, online, lastSeen: online ? null : new Date() }
          : f
      ));
    });

    // Friend request notification
    socket.on('friend_request_received', (data) => {
      console.log('👥 Friend request:', data);
      alert(`New friend request from ${data.from.username}!`);
    });

    // Message read receipt
    socket.on('message_read', ({ messageId, readAt }) => {
      console.log('👁️ Message read:', messageId);
      
      setMessages(prev => prev.map(msg =>
        msg._id === messageId 
          ? { ...msg, read: true, readAt }
          : msg
      ));
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(`Error: ${error.message || 'Something went wrong'}`);
    });
  };

  // Load chat history
  const loadChatHistory = async (friendId) => {
    setLoadingMessages(true);
    
    try {
      const res = await messageAPI.getHistory(friendId, { limit: 50 });
      const encryptedMessages = res.data.messages || [];

      if (encryptedMessages.length === 0) {
        setMessages([]);
        setLoadingMessages(false);
        return;
      }

      // Get private key
      const privateKey = await keyStorage.current.getPrivateKey(user.id);
      
      if (!privateKey) {
        console.error('Private key not found in storage');
        alert('Private key not found. Please re-register or import your key.');
        setLoadingMessages(false);
        return;
      }

      // Decrypt messages
      const decryptedMessages = [];

      for (const msg of encryptedMessages) {
        try {
          const sessionKey = await decapsulateSessionKey(
            msg.encapsulatedKey,
            privateKey
          );

          const decryptedText = await decryptMessage(
            {
              ciphertext: msg.encryptedContent,
              iv: msg.iv,
              authTag: msg.authTag
            },
            sessionKey
          );

          decryptedMessages.push({
            ...msg,
            text: decryptedText,
            decrypted: true
          });
        } catch (error) {
          console.error('Failed to decrypt message:', msg._id, error);
          decryptedMessages.push({
            ...msg,
            text: '[Message could not be decrypted]',
            decrypted: false
          });
        }
      }

      setMessages(decryptedMessages);

      // Mark as read
      await messageAPI.markAsRead(friendId);
      setUnreadCounts(prev => ({ ...prev, [friendId]: 0 }));

    } catch (error) {
      console.error('Load history error:', error);
      alert('Failed to load chat history');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Select friend
  const handleSelectFriend = async (friend) => {
    console.log('Selecting friend:', friend.username);
    setSelectedFriend(friend);
    setMessages([]);
    setTypingUsers(new Set());
    await loadChatHistory(friend._id);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!messageInput.trim() || !selectedFriend || sending) {
      return;
    }

    const text = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      // Stop typing
      if (socketRef.current) {
        socketRef.current.emit('typing_stop', {
          senderId: user.id,
          receiverId: selectedFriend._id
        });
      }

      // Generate session key
      const sessionKey = await generateSessionKey();
      const sessionKeyRaw = await exportSessionKey(sessionKey);

      // Encrypt message
      const encrypted = await encryptMessage(text, sessionKey);

      // Get receiver's public key
      const pubKeyRes = await userAPI.getPublicKey(selectedFriend._id);
      const receiverPublicKey = pubKeyRes.data.publicKey;

      // Encapsulate session key
      const encapsulatedKey = await encapsulateSessionKey(
        sessionKeyRaw,
        receiverPublicKey
      );

      // Create temp ID
      const tempId = `temp_${Date.now()}_${Math.random()}`;

      // Optimistic update
      const optimisticMessage = {
        _id: tempId,
        sender: { _id: user.id, username: user.username },
        receiver: { _id: selectedFriend._id, username: selectedFriend.username },
        text,
        decrypted: true,
        createdAt: new Date().toISOString(),
        pending: true,
        read: false
      };
      
      setMessages(prev => [...prev, optimisticMessage]);

      // Send via socket
      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          tempId,
          senderId: user.id,
          receiverId: selectedFriend._id,
          encryptedContent: encrypted.ciphertext,
          encapsulatedKey,
          iv: encrypted.iv,
          authTag: encrypted.authTag
        });
      }

    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message: ' + error.message);
      setSending(false);
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setMessageInput(e.target.value);

    if (!selectedFriend || !socketRef.current) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing start
    socketRef.current.emit('typing_start', {
      senderId: user.id,
      receiverId: selectedFriend._id
    });

    // Auto-stop after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('typing_stop', {
          senderId: user.id,
          receiverId: selectedFriend._id
        });
      }
    }, 3000);
  };

  // Clear chat
  const handleClearChat = async () => {
    if (!selectedFriend) return;

    if (!confirm('Clear all messages with ' + selectedFriend.username + '? This cannot be undone!')) {
      return;
    }

    try {
      await messageAPI.clearChat(selectedFriend._id);
      setMessages([]);
      alert('Chat cleared successfully');
    } catch (error) {
      console.error('Clear chat error:', error);
      alert('Failed to clear chat');
    }
  };

  // Logout
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      disconnectSocket();
      router.push('/login');
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              <p className="text-sm opacity-90">{user?.username}</p>
            </div>
            <button
              onClick={() => router.push('/friends')}
              className="p-2 bg-blue-500 hover:bg-blue-400 rounded-lg transition"
              title="Friends"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-4">No friends yet</p>
              <button
                onClick={() => router.push('/friends')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Find Friends
              </button>
            </div>
          ) : (
            friends.map(friend => {
              const isOnline = onlineUsers.has(friend._id);
              const isSelected = selectedFriend?._id === friend._id;
              const unread = unreadCounts[friend._id] || 0;
              
              return (
                <div
                  key={friend._id}
                  onClick={() => handleSelectFriend(friend)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {friend.username[0].toUpperCase()}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-800">
                          {friend.username}
                        </div>
                        {unread > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {isOnline ? (
                          <span className="text-green-600">● Online</span>
                        ) : (
                          'Offline'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedFriend.username[0].toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <div className="font-bold text-gray-800">
                      {selectedFriend.username}
                    </div>
                    <div className="text-sm text-gray-500">
                      {onlineUsers.has(selectedFriend._id) ? (
                        <span className="text-green-600">● Online</span>
                      ) : (
                        'Offline'
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClearChat}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-semibold"
                >
                  Clear Chat
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => {
                    const isMine = msg.sender._id === user.id;
                    
                    return (
                      <div
                        key={msg._id || index}
                        className={`flex mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isMine
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-800'
                        } ${msg.pending ? 'opacity-60' : ''}`}>
                          <p className="break-words">{msg.text}</p>
                          <div className={`text-xs mt-1 ${
                            isMine ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(msg.createdAt)}
                            {msg.pending && ' • Sending...'}
                            {msg.read && isMine && ' • Read'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {typingUsers.has(selectedFriend._id) && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-white px-4 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                🔒 All messages are end-to-end encrypted
              </p>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">
                Select a friend to start chatting
              </h2>
              <p className="text-gray-500">
                🔒 All messages are end-to-end encrypted with post-quantum cryptography
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}