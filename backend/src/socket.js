const User = require('./models/User');
const Message = require('./models/Message');

// Store online users: { userId: socketId }
const onlineUsers = new Map();

// Store typing status: { userId: { targetUserId: timeout } }
const typingUsers = new Map();

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // User authentication and registration
    socket.on('user_online', async ({ userId }) => {
      try {
        // Store socket mapping
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;

        // Update user status in database
        await User.findByIdAndUpdate(userId, {
          online: true,
          socketId: socket.id,
          lastSeen: new Date()
        });

        // Broadcast to all friends that this user is online
        const user = await User.findById(userId).populate('friends', '_id');
        user.friends.forEach(friend => {
          const friendSocketId = onlineUsers.get(friend._id.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit('friend_online', {
              userId,
              online: true
            });
          }
        });

        console.log(`✅ User ${userId} is online`);
      } catch (error) {
        console.error('User online error:', error);
      }
    });

    // Send private message
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, encryptedContent, encapsulatedKey, iv, authTag } = data;

        // Validate that users are friends
        const sender = await User.findById(senderId);
        if (!sender.friends.includes(receiverId)) {
          socket.emit('error', { message: 'Can only message friends' });
          return;
        }

        // Save message to database
        const message = new Message({
          sender: senderId,
          receiver: receiverId,
          encryptedContent,
          encapsulatedKey,
          iv,
          authTag
        });

        await message.save();
        await message.populate('sender', 'username');
        await message.populate('receiver', 'username');

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', {
            message: message.toObject()
          });
        }

        // Confirm to sender
        socket.emit('message_sent', {
          tempId: data.tempId, // For client-side message tracking
          message: message.toObject()
        });

        console.log(`📨 Message sent from ${senderId} to ${receiverId}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing_start', async ({ senderId, receiverId }) => {
      try {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('user_typing', {
            userId: senderId,
            typing: true
          });
        }

        // Clear existing timeout
        if (typingUsers.has(senderId)) {
          const userTyping = typingUsers.get(senderId);
          if (userTyping[receiverId]) {
            clearTimeout(userTyping[receiverId]);
          }
        }

        // Set timeout to auto-stop typing after 3 seconds
        if (!typingUsers.has(senderId)) {
          typingUsers.set(senderId, {});
        }

        typingUsers.get(senderId)[receiverId] = setTimeout(() => {
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('user_typing', {
              userId: senderId,
              typing: false
            });
          }
        }, 3000);
      } catch (error) {
        console.error('Typing start error:', error);
      }
    });

    socket.on('typing_stop', async ({ senderId, receiverId }) => {
      try {
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('user_typing', {
            userId: senderId,
            typing: false
          });
        }

        // Clear timeout
        if (typingUsers.has(senderId) && typingUsers.get(senderId)[receiverId]) {
          clearTimeout(typingUsers.get(senderId)[receiverId]);
          delete typingUsers.get(senderId)[receiverId];
        }
      } catch (error) {
        console.error('Typing stop error:', error);
      }
    });

    // Mark message as read
    socket.on('mark_read', async ({ messageId, userId }) => {
      try {
        const message = await Message.findByIdAndUpdate(
          messageId,
          { read: true, readAt: new Date() },
          { new: true }
        );

        if (message) {
          const senderSocketId = onlineUsers.get(message.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_read', {
              messageId,
              readBy: userId,
              readAt: message.readAt
            });
          }
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Friend request notification
    socket.on('send_friend_request', async ({ fromUserId, toUserId }) => {
      try {
        const toSocketId = onlineUsers.get(toUserId);
        if (toSocketId) {
          const fromUser = await User.findById(fromUserId).select('username email');
          io.to(toSocketId).emit('friend_request_received', {
            from: fromUser
          });
        }
      } catch (error) {
        console.error('Friend request notification error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        if (socket.userId) {
          // Remove from online users
          onlineUsers.delete(socket.userId);

          // Update database
          await User.findByIdAndUpdate(socket.userId, {
            online: false,
            lastSeen: new Date(),
            socketId: null
          });

          // Notify friends
          const user = await User.findById(socket.userId).populate('friends', '_id');
          if (user) {
            user.friends.forEach(friend => {
              const friendSocketId = onlineUsers.get(friend._id.toString());
              if (friendSocketId) {
                io.to(friendSocketId).emit('friend_online', {
                  userId: socket.userId,
                  online: false
                });
              }
            });
          }

          // Clear typing timeouts
          if (typingUsers.has(socket.userId)) {
            const userTyping = typingUsers.get(socket.userId);
            Object.values(userTyping).forEach(timeout => clearTimeout(timeout));
            typingUsers.delete(socket.userId);
          }

          console.log(`❌ User ${socket.userId} disconnected`);
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
};

module.exports = setupSocket;