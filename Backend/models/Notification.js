const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    recipients: {
      type: String,
      enum: ['users', 'hospitals', 'all'],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ recipients: 1, createdAt: -1 });
notificationSchema.index({ readBy: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
