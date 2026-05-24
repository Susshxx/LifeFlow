const mongoose = require("mongoose");

const bloodRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    location: {
      lat:   { type: Number, required: true },
      lng:   { type: Number, required: true },
      label: { type: String, default: "" },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["open", "pending", "fulfilled", "closed"],
      default: "open",
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
bloodRequestSchema.index({ isActive: 1, isEmergency: -1, createdAt: -1 });
bloodRequestSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);
