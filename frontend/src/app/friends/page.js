'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { friendAPI, userAPI } from '@/lib/api';
import { initializeSocket, getSocket } from '@/lib/socket';

export default function FriendsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!storedUser || !token) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Initialize socket for real-time notifications
        const socket = initializeSocket(token);
        
        // Listen for friend request notifications
        socket.on('friend_request_received', () => {
          loadPendingRequests();
        });

        // Load data
        await Promise.all([
          loadUsers(),
          loadFriends(),
          loadPendingRequests(),
          loadSentRequests()
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        router.push('/login');
      }
    };

    initializeApp();
  }, [router]);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Load users error:', error);
      setUsers([]);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await friendAPI.getFriends();
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Load friends error:', error);
      setFriends([]);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await friendAPI.getPendingRequests();
      setPendingRequests(response.data.requests || []);
    } catch (error) {
      console.error('Load pending requests error:', error);
      setPendingRequests([]);
    }
  };

  const loadSentRequests = async () => {
    try {
      const response = await friendAPI.getSentRequests();
      setSentRequests(response.data.requests || []);
    } catch (error) {
      console.error('Load sent requests error:', error);
      setSentRequests([]);
    }
  };

  const handleSendRequest = async (userId) => {
    setActionLoading({ ...actionLoading, [userId]: true });
    try {
      await friendAPI.sendRequest(userId);
      
      // Notify via socket
      const socket = getSocket();
      if (socket) {
        socket.emit('send_friend_request', {
          fromUserId: user.id,
          toUserId: userId
        });
      }

      alert('Friend request sent!');
      await loadSentRequests();
    } catch (error) {
      console.error('Send request error:', error);
      alert(error.response?.data?.error || 'Failed to send friend request');
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false });
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setActionLoading({ ...actionLoading, [requestId]: true });
    try {
      await friendAPI.acceptRequest(requestId);
      alert('Friend request accepted!');
      await Promise.all([loadFriends(), loadPendingRequests()]);
    } catch (error) {
      console.error('Accept request error:', error);
      alert('Failed to accept friend request');
    } finally {
      setActionLoading({ ...actionLoading, [requestId]: false });
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActionLoading({ ...actionLoading, [requestId]: true });
    try {
      await friendAPI.rejectRequest(requestId);
      alert('Friend request rejected');
      await loadPendingRequests();
    } catch (error) {
      console.error('Reject request error:', error);
      alert('Failed to reject friend request');
    } finally {
      setActionLoading({ ...actionLoading, [requestId]: false });
    }
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    if (!confirm(`Remove ${friendName} from your friends?`)) {
      return;
    }

    setActionLoading({ ...actionLoading, [friendId]: true });
    try {
      await friendAPI.removeFriend(friendId);
      alert('Friend removed');
      await loadFriends();
    } catch (error) {
      console.error('Remove friend error:', error);
      alert('Failed to remove friend');
    } finally {
      setActionLoading({ ...actionLoading, [friendId]: false });
    }
  };

  const getFilteredUsers = () => {
    // Safely extract IDs with null checks
    const friendIds = new Set(
      friends.filter(f => f && f._id).map(f => f._id)
    );
    
    const sentIds = new Set(
      sentRequests.filter(r => r && r.to && r.to._id).map(r => r.to._id)
    );
    
    const pendingIds = new Set(
      pendingRequests.filter(r => r && r.from && r.from._id).map(r => r.from._id)
    );

    return users.filter(u => {
      if (!u || !u._id) return false;
      
      // Don't show if already friend or has pending request
      if (friendIds.has(u._id) || sentIds.has(u._id) || pendingIds.has(u._id)) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          u.username?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = getFilteredUsers();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/chat" className="text-blue-600 hover:text-blue-700 flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Chat
              </Link>
              <h1 className="text-2xl font-bold">Friends</h1>
            </div>
            <div className="text-gray-600">
              {user?.username}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === 'all'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                All Users
                <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded">
                  {filteredUsers.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === 'friends'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                My Friends
                <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded">
                  {friends.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Requests
                {pendingRequests.length > 0 && (
                  <span className="ml-2 text-sm bg-red-500 text-white px-2 py-1 rounded">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 px-6 py-4 font-semibold transition ${
                  activeTab === 'sent'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Sent
                <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded">
                  {sentRequests.length}
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar (for All Users tab) */}
          {activeTab === 'all' && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <input
                type="text"
                placeholder="Search users by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-lg shadow">
            {/* All Users Tab */}
            {activeTab === 'all' && (
              <div className="divide-y">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>{searchQuery ? 'No users found matching your search' : 'No new users to add'}</p>
                  </div>
                ) : (
                  filteredUsers.map(u => (
                    <div key={u._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {u.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="font-semibold">{u.username || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{u.email || 'No email'}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSendRequest(u._id)}
                        disabled={actionLoading[u._id]}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {actionLoading[u._id] ? 'Sending...' : 'Add Friend'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div className="divide-y">
                {friends.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="mb-4">You don't have any friends yet</p>
                    <button
                      onClick={() => setActiveTab('all')}
                      className="text-blue-600 hover:underline"
                    >
                      Find friends
                    </button>
                  </div>
                ) : (
                  friends.map(friend => (
                    <div key={friend._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center">
                        <div className="relative">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {friend.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                              friend.online ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="font-semibold">{friend.username || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">
                            {friend.online ? (
                              <span className="text-green-600">● Online</span>
                            ) : friend.lastSeen ? (
                              `Last seen: ${new Date(friend.lastSeen).toLocaleString()}`
                            ) : (
                              'Offline'
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href="/chat"
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                          Message
                        </Link>
                        <button
                          onClick={() => handleRemoveFriend(friend._id, friend.username)}
                          disabled={actionLoading[friend._id]}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Pending Requests Tab */}
            {activeTab === 'pending' && (
              <div className="divide-y">
                {pendingRequests.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No pending friend requests
                  </div>
                ) : (
                  pendingRequests.map(request => (
                    <div key={request._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {request.from?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="font-semibold">{request.from?.username || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{request.from?.email || 'No email'}</div>
                          <div className="text-xs text-gray-400">
                            {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Just now'}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(request._id)}
                          disabled={actionLoading[request._id]}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request._id)}
                          disabled={actionLoading[request._id]}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sent Requests Tab */}
            {activeTab === 'sent' && (
              <div className="divide-y">
                {sentRequests.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No sent friend requests
                  </div>
                ) : (
                  sentRequests.map(request => (
                    <div key={request._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {request.to?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="font-semibold">{request.to?.username || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{request.to?.email || 'No email'}</div>
                          <div className="text-xs text-gray-400">
                            Sent: {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Just now'}
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded font-semibold">
                        Pending
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}