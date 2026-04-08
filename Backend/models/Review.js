const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    role: { type: String, default: "user" },
    bloodGroup: { type: String, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true, trim: true },
    location: { type: String, default: "" },
    approved: { type: Boolean, default: true }, // auto-approve for now
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
