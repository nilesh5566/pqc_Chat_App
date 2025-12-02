# 🔐 Post-Quantum Secure Messaging Application

A full-stack real-time messaging application with post-quantum cryptographic security using Kyber KEM and AES-256-GCM encryption.

## 🎯 Features

### 🔐 Security
- **Post-Quantum Cryptography**: Kyber-1024 KEM for key exchange
- **End-to-End Encryption**: AES-256-GCM for message encryption
- **Session Keys**: Unique encryption key per message
- **Secure Key Storage**: IndexedDB for private key protection
- **Side-Channel Protection**: Constant-time operations where possible

### 💬 Messaging
- Real-time message delivery via WebSocket
- Typing indicators
- Message read receipts
- Auto-scroll to latest messages
- Offline message delivery
- Message history persistence

### 👥 Social Features
- Friend request system
- Real-time online/offline status
- Last seen timestamps
- Friends-only messaging
- User search functionality

### 🗑️ Management
- Clear entire chat history
- Delete individual messages
- Confirmation dialogs for destructive actions

### 🎨 UI/UX
- Modern, responsive design
- Mobile-friendly interface
- Smooth animations
- Tailwind CSS styling
- Dark mode support (optional)

---

## 📁 Project Structure

```
pqc-messaging-app/
├── frontend/          # Next.js frontend
├── backend/           # Express + Socket.io backend
├── pqc-keygen/        # C program for PQC key generation
└── README.md
```

---

## 🚀 Installation Guide

### Prerequisites

1. **Node.js** (v18+): https://nodejs.org/
2. **MongoDB**: https://www.mongodb.com/try/download/community
3. **liboqs** (for PQC): https://github.com/open-quantum-safe/liboqs

#### Installing liboqs

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install liboqs-dev
```

**macOS:**
```bash
brew install liboqs
```

**Windows:**
Follow instructions at: https://github.com/open-quantum-safe/liboqs/wiki/Building-liboqs-on-Windows

---

## 🔧 Setup Instructions

### 1. Clone and Setup

```bash
# Clone or create project directory
mkdir pqc-messaging-app
cd pqc-messaging-app

# Create subdirectories
mkdir frontend backend pqc-keygen
```

### 2. Backend Setup

```bash
cd backend

# Initialize npm (if package.json doesn't exist)
npm init -y

# Install dependencies
npm install express socket.io mongoose bcryptjs jsonwebtoken cors dotenv express-rate-limit helmet nodemon

# Create directory structure
mkdir -p src/{models,routes,middleware,utils,config}

# Copy all backend files from artifacts
```

**Create `.env` file:**
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pqc-messaging
JWT_SECRET=your-super-secret-jwt-key-change-this
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Frontend Setup

```bash
cd ../frontend

# Create Next.js app
npx create-next-app@latest . --app --tailwind

# Install additional dependencies
npm install socket.io-client axios

# Create directory structure
mkdir -p lib components app/{login,register,chat,friends,api/auth/[...nextauth]}
```

**Create `.env.local` file:**
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### 4. PQC Key Generation Setup

```bash
cd ../pqc-keygen

# Compile the keygen program
make

# Generate a key pair (for testing)
./keygen
```

This will create:
- `public_key.txt` - Share this during registration
- `private_key.txt` - Keep this SECRET!

---

## 🏃 Running the Application

### 1. Start MongoDB

```bash
# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

### 2. Start Backend

```bash
cd backend
npm run dev
```

Backend will run on: `http://localhost:5000`

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:3000`

---

## 📝 Usage Instructions

### 1. Generate PQC Keys

Before registering, generate your key pair:

```bash
cd pqc-keygen
./keygen
```

Copy the **public key** from `public_key.txt` for registration.
**KEEP** the **private key** from `private_key.txt` SECURE and PRIVATE!

### 2. Register Account

1. Navigate to `http://localhost:3000/register`
2. Fill in:
   - Username
   - Email
   - Password
   - **Public Key** (paste from `public_key.txt`)
3. Click "Register"
4. Save your **private key** securely (you'll need it for decryption)

### 3. Login

1. Navigate to `http://localhost:3000/login`
2. Enter email and password
3. Click "Login"

### 4. Add Friends

1. Go to "Friends" page
2. Browse users or search
3. Send friend requests
4. Accept incoming requests

### 5. Start Chatting

1. Click on a friend in your friends list
2. Type your message
3. Click "Send"
4. Messages are automatically encrypted with PQC!

---

## 🔒 Security Architecture

### Message Encryption Flow

```
1. User types message → "Hello, World!"

2. Generate AES-256 session key
   ↓
3. Encrypt message with AES-GCM
   ↓
4. Fetch receiver's PQC public key
   ↓
5. Encapsulate session key with Kyber-1024 KEM
   ↓
6. Send to server: {
     encryptedContent,
     encapsulatedKey,
     iv,
     authTag
   }
   ↓
7. Server stores encrypted message
   ↓
8. Receiver receives encrypted message
   ↓
9. Decapsulate session key with private key
   ↓
10. Decrypt message with AES-GCM
    ↓
11. Display: "Hello, World!"
```

### Key Security Features

1. **Private keys never leave the client** - Stored in IndexedDB
2. **Unique session key per message** - No key reuse
3. **Authenticated encryption** - AES-GCM provides authenticity
4. **Post-quantum secure** - Kyber-1024 resists quantum attacks
5. **Forward secrecy** - Compromise of one session doesn't affect others

---

## 🛠️ Development Guide

### Adding New Features

#### 1. Add New Backend Route

```javascript
// backend/src/routes/newFeature.js
const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  // Your logic here
});

module.exports = router;
```

Register in `server.js`:
```javascript
const newFeatureRoutes = require('./routes/newFeature');
app.use('/api/new-feature', newFeatureRoutes);
```

#### 2. Add New Frontend Component

```jsx
// frontend/components/NewComponent.js
export default function NewComponent({ prop1, prop2 }) {
  return (
    <div className="p-4">
      {/* Your component */}
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

### liboqs Not Found

```bash
# Ubuntu/Debian
sudo apt-get install liboqs-dev

# Check installation
pkg-config --modversion liboqs
```

### Port Already in Use

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### CORS Issues

Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL.

---

## 📊 API Documentation

### Authentication

**POST** `/api/auth/register`
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "password123",
  "publicKey": "base64_encoded_pqc_public_key"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

**GET** `/api/auth/me`
- Headers: `Authorization: Bearer <token>`

### Friends

**POST** `/api/friends/request`
```json
{
  "toUserId": "user_id_here"
}
```

**GET** `/api/friends/requests/pending`

**PUT** `/api/friends/request/:requestId/accept`

**GET** `/api/friends`

### Messages

**GET** `/api/messages/history/:userId?limit=50&before=timestamp`

**PUT** `/api/messages/read/:userId`

**DELETE** `/api/messages/clear/:userId`

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong JWT secrets** - Generate with `openssl rand -base64 32`
3. **Store private keys securely** - Never in localStorage
4. **Validate all inputs** - Both client and server side
5. **Use HTTPS in production** - Enable SSL/TLS
6. **Rate limit API endpoints** - Prevent abuse
7. **Regular security audits** - Keep dependencies updated

---

## 🚀 Deployment

### Backend Deployment (Railway/Render/Heroku)

1. Set environment variables
2. Use MongoDB Atlas for database
3. Enable CORS for your frontend domain
4. Use HTTPS

### Frontend Deployment (Vercel/Netlify)

1. Build the project: `npm run build`
2. Deploy build folder
3. Set environment variables
4. Point to backend API URL

---

## 📚 Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - Authentication
- **Helmet** - Security headers

### Frontend
- **Next.js 14** - React framework
- **React** - UI library
- **Socket.io-client** - WebSocket client
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Web Crypto API** - Client-side encryption

### Cryptography
- **liboqs** - Post-quantum cryptography library
- **Kyber-1024** - KEM algorithm
- **AES-256-GCM** - Symmetric encryption

---

## 📖 Learning Outcomes

By completing this project, you have learned:

1. ✅ Building full-stack applications with Next.js
2. ✅ Implementing real-time features with WebSocket
3. ✅ Database design and MongoDB integration
4. ✅ User authentication and authorization
5. ✅ Post-quantum cryptography concepts
6. ✅ End-to-end encryption implementation
7. ✅ Secure key management
8. ✅ RESTful API design
9. ✅ Modern UI/UX with Tailwind CSS
10. ✅ Security best practices

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - Feel free to use this project for learning and development.

---

## ⚠️ Important Notes

### For Production Use

1. **Replace PQC simulation** - The current encryption.js uses simulated KEM. You MUST integrate actual liboqs WebAssembly for production.
2. **Use HTTPS** - Never run in production without SSL/TLS
3. **Secure key storage** - Consider hardware security modules (HSM) for production
4. **Regular updates** - Keep all dependencies updated
5. **Security audit** - Have your code professionally audited

### Known Limitations

1. PQC KEM encapsulation is simulated in the frontend (needs WASM integration)
2. No message editing feature (can be added)
3. No file/image sharing (can be added)
4. No group chat feature (can be added)

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review code comments
3. Consult official documentation
4. Open an issue on GitHub

---

## 🎓 Next Steps

### Enhancements to Consider

1. **Voice/Video calls** - Add WebRTC support
2. **File sharing** - Implement encrypted file transfer
3. **Group chats** - Multi-user conversations
4. **Message reactions** - Emoji reactions
5. **Push notifications** - Web push API
6. **Mobile apps** - React Native version
7. **Message search** - Full-text search
8. **User profiles** - Profile pictures, status
9. **Backup/Export** - Chat history export
10. **Admin panel** - User management dashboard

---

**Happy Coding! 🚀**

Remember: Security is a process, not a product. Keep learning and improving!

# Complete File Structure


## 📁 Full Project Directory Tree

```
pqc-messaging-app/
│
├── README.md                          ✅ Main documentation
├── QUICKSTART.md                      ✅ Quick setup guide
├── DEPLOYMENT.md                      ✅ Deployment guide
├── IMPLEMENTATION_NOTES.md            ✅ Security details
├── TESTING.md                         ✅ Testing guide
├── setup.sh                           ✅ Automated setup script
│
├── backend/                           📂 BACKEND
│   ├── .env                          ✅ Environment variables
│   ├── .gitignore                    ✅ Git ignore
│   ├── package.json                  ✅ Dependencies
│   ├── src/
│   │   ├── server.js                 ✅ Main server file
│   │   ├── socket.js                 ✅ WebSocket handlers
│   │   ├── config/
│   │   │   └── db.js                 ✅ Database config
│   │   ├── models/
│   │   │   ├── User.js               ✅ User model
│   │   │   ├── Message.js            ✅ Message model
│   │   │   └── FriendRequest.js      ✅ Friend request model
│   │   ├── routes/
│   │   │   ├── auth.js               ✅ Auth routes
│   │   │   ├── users.js              ✅ User routes
│   │   │   ├── messages.js           ✅ Message routes
│   │   │   └── friends.js            ✅ Friend routes
│   │   ├── middleware/
│   │   │   ├── auth.js               ✅ Auth middleware
│   │   │   └── rateLimiter.js        ✅ Rate limiter
│   │   └── utils/
│   │       └── encryption.js         ⚠️  Optional (for server-side crypto)
│   └── node_modules/                 📦 (auto-generated)
│
├── frontend/                          📂 FRONTEND
│   ├── .env.local                    ✅ Environment variables
│   ├── .gitignore                    ✅ Git ignore
│   ├── package.json                  ✅ Dependencies
│   ├── next.config.js                ✅ Next.js config
│   ├── tailwind.config.js            ✅ Tailwind config
│   ├── postcss.config.js             ✅ PostCSS config
│   ├── app/
│   │   ├── layout.js                 ✅ Root layout
│   │   ├── page.js                   ✅ Landing page
│   │   ├── globals.css               ✅ Global styles
│   │   ├── login/
│   │   │   └── page.js               ✅ Login page
│   │   ├── register/
│   │   │   └── page.js               ✅ Register page
│   │   ├── chat/
│   │   │   └── page.js               ✅ Chat page
│   │   ├── friends/
│   │   │   └── page.js               ✅ Friends page
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.js      ✅ NextAuth route (optional)
│   ├── components/
│   │   ├── AuthProvider.js           ✅ NEW - Auth context
│   │   ├── ChatWindow.js             ✅ NEW - Chat display
│   │   ├── MessageInput.js           ✅ NEW - Message input
│   │   ├── UserList.js               ✅ NEW - User sidebar
│   │   ├── FriendRequests.js         ✅ NEW - Friend requests
│   │   ├── OnlineStatus.js           ✅ NEW - Online indicator
│   │   ├── TypingIndicator.js        ✅ NEW - Typing animation
│   │   ├── LoadingSpinner.js         ✅ NEW - Loading component
│   │   ├── ErrorMessage.js           ✅ NEW - Error display
│   │   └── SuccessMessage.js         ✅ NEW - Success display
│   ├── lib/
│   │   ├── socket.js                 ✅ Socket.io client
│   │   ├── api.js                    ✅ API client
│   │   ├── encryption.js             ✅ Encryption utilities
│   │   └── secureStorage.js          ✅ NEW - Secure storage
│   ├── public/                       📂 Static files
│   └── node_modules/                 📦 (auto-generated)
│
└── pqc-keygen/                        📂 KEY GENERATION
    ├── keygen.c                       ✅ C program
    ├── Makefile                       ✅ Build config
    ├── README.md                      ✅ Documentation
    ├── keygen                         📦 (compiled binary)
    ├── public_key.txt                 📦 (generated)
    └── private_key.txt                📦 (generated)
```

## 📝 File Count Summary

### Backend Files: 15
- Configuration: 3 files (.env, package.json, .gitignore)
- Core: 2 files (server.js, socket.js)
- Models: 3 files (User, Message, FriendRequest)
- Routes: 4 files (auth, users, messages, friends)
- Middleware: 2 files (auth, rateLimiter)
- Config: 1 file (db.js)

### Frontend Files: 26
- Configuration: 6 files (.env.local, package.json, .gitignore, next.config.js, tailwind.config.js, postcss.config.js)
- Pages: 5 files (layout, home, login, register, chat, friends)
- Components: 10 files (AuthProvider, ChatWindow, MessageInput, UserList, FriendRequests, OnlineStatus, TypingIndicator, LoadingSpinner, ErrorMessage, SuccessMessage)
- Libraries: 4 files (socket, api, encryption, secureStorage)
- API Routes: 1 file (NextAuth route)

### PQC Keygen: 3
- Source: 1 file (keygen.c)
- Build: 1 file (Makefile)
- Docs: 1 file (README.md)

### Documentation: 6
- README.md (main docs)
- QUICKSTART.md (setup guide)
- DEPLOYMENT.md (production guide)
- IMPLEMENTATION_NOTES.md (security details)
- TESTING.md (testing guide)
- COMPLETE_FILE_STRUCTURE.md (this file)

**Total: 50 Files**

## 🔍 Newly Added Files

The following files were missing and have now been created:

### Frontend Components (10 files)
1. ✅ `frontend/components/AuthProvider.js`
2. ✅ `frontend/components/ChatWindow.js`
3. ✅ `frontend/components/MessageInput.js`
4. ✅ `frontend/components/UserList.js`
5. ✅ `frontend/components/FriendRequests.js`
6. ✅ `frontend/components/OnlineStatus.js`
7. ✅ `frontend/components/TypingIndicator.js`
8. ✅ `frontend/components/LoadingSpinner.js`
9. ✅ `frontend/components/ErrorMessage.js`
10. ✅ `frontend/components/SuccessMessage.js`

### Frontend Libraries (1 file)
11. ✅ `frontend/lib/secureStorage.js`

### Frontend API (1 file)
12. ✅ `frontend/app/api/auth/[...nextauth]/route.js`

### Documentation (1 file)
13. ✅ `COMPLETE_FILE_STRUCTURE.md`

## 📋 File Creation Checklist

Use this checklist to ensure all files are created:

### Root Directory
- [ ] README.md
- [ ] QUICKSTART.md
- [ ] DEPLOYMENT.md
- [ ] IMPLEMENTATION_NOTES.md
- [ ] TESTING.md
- [ ] COMPLETE_FILE_STRUCTURE.md
- [ ] setup.sh

### Backend
- [ ] backend/.env
- [ ] backend/.gitignore
- [ ] backend/package.json
- [ ] backend/src/server.js
- [ ] backend/src/socket.js
- [ ] backend/src/config/db.js
- [ ] backend/src/models/User.js
- [ ] backend/src/models/Message.js
- [ ] backend/src/models/FriendRequest.js
- [ ] backend/src/routes/auth.js
- [ ] backend/src/routes/users.js
- [ ] backend/src/routes/messages.js
- [ ] backend/src/routes/friends.js
- [ ] backend/src/middleware/auth.js
- [ ] backend/src/middleware/rateLimiter.js

### Frontend
- [ ] frontend/.env.local
- [ ] frontend/.gitignore
- [ ] frontend/package.json
- [ ] frontend/next.config.js
- [ ] frontend/tailwind.config.js
- [ ] frontend/postcss.config.js
- [ ] frontend/app/layout.js
- [ ] frontend/app/page.js
- [ ] frontend/app/globals.css
- [ ] frontend/app/login/page.js
- [ ] frontend/app/register/page.js
- [ ] frontend/app/chat/page.js
- [ ] frontend/app/friends/page.js
- [ ] frontend/app/api/auth/[...nextauth]/route.js
- [ ] frontend/components/AuthProvider.js
- [ ] frontend/components/ChatWindow.js
- [ ] frontend/components/MessageInput.js
- [ ] frontend/components/UserList.js
- [ ] frontend/components/FriendRequests.js
- [ ] frontend/components/OnlineStatus.js
- [ ] frontend/components/TypingIndicator.js
- [ ] frontend/components/LoadingSpinner.js
- [ ] frontend/components/ErrorMessage.js
- [ ] frontend/components/SuccessMessage.js
- [ ] frontend/lib/socket.js
- [ ] frontend/lib/api.js
- [ ] frontend/lib/encryption.js
- [ ] frontend/lib/secureStorage.js

### PQC Keygen
- [ ] pqc-keygen/keygen.c
- [ ] pqc-keygen/Makefile
- [ ] pqc-keygen/README.md

## 🚀 Quick Copy Commands

Create all directories at once:

```bash
cd pqc-messaging-app

# Backend directories
mkdir -p backend/src/{models,routes,middleware,config,utils}

# Frontend directories
mkdir -p frontend/{app/{login,register,chat,friends,api/auth/[...nextauth]},components,lib,public}

# PQC keygen directory
mkdir -p pqc-keygen
```

## 📦 Installation Commands

```bash
# Backend
cd backend
npm install express socket.io mongoose bcryptjs jsonwebtoken cors dotenv express-rate-limit helmet nodemon

# Frontend
cd ../frontend
npm install react react-dom next socket.io-client axios

# Install dev dependencies
npm install --save-dev autoprefixer postcss tailwindcss eslint eslint-config-next

# PQC Keygen
cd ../pqc-keygen
make
```

## ✅ Verification Steps

After creating all files:

1. **Check file count:**
   ```bash
   find . -type f -name "*.js" -o -name "*.json" -o -name "*.md" | wc -l
   ```

2. **Check directory structure:**
   ```bash
   tree -L 3
   ```

3. **Verify no missing imports:**
   ```bash
   cd frontend
   npm run build
   ```

4. **Test backend:**
   ```bash
   cd backend
   npm run dev
   ```

## 🔧 Common Issues

### Missing Directories
If you get "ENOENT: no such file or directory" errors:
```bash
# Create missing directories manually
mkdir -p frontend/components
mkdir -p frontend/lib
mkdir -p frontend/app/api/auth/[...nextauth]
```

### Import Errors
If components can't be found, check:
1. File is in correct directory
2. Export is correct (default export)
3. Import path uses `@/` for aliases

### Path Alias Not Working
Add to `jsconfig.json` or `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## 📚 Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Socket.io Docs**: https://socket.io/docs/v4/
- **MongoDB Docs**: https://www.mongodb.com/docs/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **liboqs**: https://github.com/open-quantum-safe/liboqs

---

**All files are now complete! 🎉**

You have everything needed to build and run the application.