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
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Auto-expire after expiresAt passes
bloodRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
bloodRequestSchema.index({ isActive: 1, isEmergency: -1, createdAt: -1 });
bloodRequestSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);
