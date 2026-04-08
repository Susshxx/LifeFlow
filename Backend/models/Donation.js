const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    transaction_uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    donorName: {
      type: String,
      default: "Anonymous",
    },
    message: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETE", "FAILED", "FULL_REFUND", "PARTIAL_REFUND", "AMBIGUOUS", "NOT_FOUND", "CANCELED"],
      default: "PENDING",
    },
    esewa_ref_id: {
      type: String,
      default: null,
    },
    esewa_transaction_code: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
