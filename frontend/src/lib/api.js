import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

// User endpoints
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getPublicKey: (userId) => api.get(`/users/${userId}/public-key`),
  search: (query) => api.get(`/users/search/${query}`)
};

// Friend endpoints
export const friendAPI = {
  sendRequest: (toUserId) => api.post('/friends/request', { toUserId }),
  getPendingRequests: () => api.get('/friends/requests/pending'),
  getSentRequests: () => api.get('/friends/requests/sent'),
  acceptRequest: (requestId) => api.put(`/friends/request/${requestId}/accept`),
  rejectRequest: (requestId) => api.put(`/friends/request/${requestId}/reject`),
  getFriends: () => api.get('/friends'),
  removeFriend: (friendId) => api.delete(`/friends/${friendId}`)
};

// Message endpoints
export const messageAPI = {
  getHistory: (userId, params) => api.get(`/messages/history/${userId}`, { params }),
  markAsRead: (userId) => api.put(`/messages/read/${userId}`),
  getUnreadCount: () => api.get('/messages/unread/count'),
  clearChat: (userId) => api.delete(`/messages/clear/${userId}`),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`)
};

export default api;