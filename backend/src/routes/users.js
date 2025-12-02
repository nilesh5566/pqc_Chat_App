const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all users (excluding current user)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('username email online lastSeen publicKey')
      .sort({ username: 1 });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID or username
router.get('/:identifier', auth, async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is ObjectId or username
    const query = identifier.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: identifier }
      : { username: identifier };

    const user = await User.findOne(query)
      .select('username email online lastSeen publicKey');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's public key (for encryption)
router.get('/:userId/public-key', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('publicKey username');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user._id,
      username: user.username,
      publicKey: user.publicKey
    });
  } catch (error) {
    console.error('Get public key error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users by username
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    
    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.userId }
    })
      .select('username email online lastSeen')
      .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;