const mongoose = require('mongoose');

const bloodDonationHistorySchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  campId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodCamp',
    required: true,
  },
  donorName: {
    type: String,
    required: true,
  },
  hospitalName: {
    type: String,
    required: true,
  },
  campTitle: {
    type: String,
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
  },
  donationDate: {
    type: Date,
    required: true,
  },
  tokensAwarded: {
    type: Number,
    default: 10,
  },
  location: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
bloodDonationHistorySchema.index({ donorId: 1, donationDate: -1 });
bloodDonationHistorySchema.index({ hospitalId: 1, donationDate: -1 });
bloodDonationHistorySchema.index({ campId: 1 });

module.exports = mongoose.model('BloodDonationHistory', bloodDonationHistorySchema);