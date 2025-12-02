const express = require('express');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const auth = require('../middleware/auth');

const router = express.Router();

// Send friend request
router.post('/request', auth, async (req, res) => {
  try {
    const { toUserId } = req.body;

    if (!toUserId) {
      return res.status(400).json({ error: 'Recipient user ID is required' });
    }

    if (toUserId === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if target user exists
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already friends
    const currentUser = await User.findById(req.userId);
    if (currentUser.friends.includes(toUserId)) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: req.userId, to: toUserId },
        { from: toUserId, to: req.userId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }

    // Create friend request
    const friendRequest = new FriendRequest({
      from: req.userId,
      to: toUserId
    });

    await friendRequest.save();

    // Populate for response
    await friendRequest.populate('from', 'username email');
    await friendRequest.populate('to', 'username email');

    res.status(201).json({
      message: 'Friend request sent',
      friendRequest
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending friend requests (received)
router.get('/requests/pending', auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      to: req.userId,
      status: 'pending'
    })
      .populate('from', 'username email online lastSeen')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get sent friend requests
router.get('/requests/sent', auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      from: req.userId,
      status: 'pending'
    })
      .populate('to', 'username email online lastSeen')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept friend request
router.put('/request/:requestId/accept', auth, async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.requestId);

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendRequest.to.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    // Update request status
    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Add to friends list for both users
    await User.findByIdAndUpdate(friendRequest.from, {
      $addToSet: { friends: friendRequest.to }
    });

    await User.findByIdAndUpdate(friendRequest.to, {
      $addToSet: { friends: friendRequest.from }
    });

    await friendRequest.populate('from', 'username email');

    res.json({
      message: 'Friend request accepted',
      friendRequest
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject friend request
router.put('/request/:requestId/reject', auth, async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.requestId);

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (friendRequest.to.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Request already processed' });
    }

    friendRequest.status = 'rejected';
    await friendRequest.save();

    res.json({
      message: 'Friend request rejected',
      friendRequest
    });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get friends list
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username email online lastSeen publicKey');

    res.json({ friends: user.friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove friend
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;

    // Remove from both users' friends lists
    await User.findByIdAndUpdate(req.userId, {
      $pull: { friends: friendId }
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: req.userId }
    });

    // Delete friend request if exists
    await FriendRequest.deleteOne({
      $or: [
        { from: req.userId, to: friendId },
        { from: friendId, to: req.userId }
      ]
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;