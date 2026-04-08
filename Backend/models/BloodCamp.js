const mongoose = require('mongoose');

const bloodCampSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  expectedDonors: {
    type: Number,
    required: true,
    min: 1,
  },
  location: {
    type: {
      type: String,
      enum: ['saved', 'custom'],
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  },
  startTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // in hours
    required: true,
    min: 1,
  },
  bloodGroups: {
    type: [String],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'All'],
    default: ['All'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  registeredDonors: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: String,
    email: String,
    phone: String,
    age: Number,
    weight: Number,
    lastDonationMonth: String,
    lastDonationYear: String,
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Index for efficient queries
bloodCampSchema.index({ hospitalId: 1, status: 1 });
bloodCampSchema.index({ status: 1, startTime: 1 });
bloodCampSchema.index({ 'location.lat': 1, 'location.lng': 1 });
bloodCampSchema.index({ startTime: 1 });

module.exports = mongoose.model('BloodCamp', bloodCampSchema);
