const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Encrypted message (AES encrypted with session key)
  encryptedContent: {
    type: String,
    required: true
  },
  // Session key encrypted with receiver's PQC public key
  encapsulatedKey: {
    type: String,
    required: true
  },
  // IV for AES encryption
  iv: {
    type: String,
    required: true
  },
  // Authentication tag for AES-GCM
  authTag: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);