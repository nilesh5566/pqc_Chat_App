const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get chat history between two users
router.get('/history/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if users are friends
    const currentUser = await User.findById(req.userId);
    if (!currentUser.friends.includes(userId)) {
      return res.status(403).json({ error: 'Can only view messages with friends' });
    }

    const query = {
      $or: [
        { sender: req.userId, receiver: userId },
        { sender: userId, receiver: req.userId }
      ]
    };

    // Pagination: get messages before a certain timestamp
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'username')
      .populate('receiver', 'username');

    // Reverse to get chronological order
    messages.reverse();

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark messages as read
router.put('/read/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Message.updateMany(
      {
        sender: userId,
        receiver: req.userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({
      message: 'Messages marked as read',
      count: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unread message count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.userId,
      read: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete all messages in a conversation
router.delete('/clear/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if users are friends
    const currentUser = await User.findById(req.userId);
    if (!currentUser.friends.includes(userId)) {
      return res.status(403).json({ error: 'Can only clear messages with friends' });
    }

    const result = await Message.deleteMany({
      $or: [
        { sender: req.userId, receiver: userId },
        { sender: userId, receiver: req.userId }
      ]
    });

    res.json({
      message: 'Chat history cleared',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a specific message (sender only)
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await message.deleteOne();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;