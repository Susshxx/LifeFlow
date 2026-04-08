const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token." });
  }
};

// Get dashboard stats for logged-in user
router.get("/dashboard/stats", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });

    // TODO: Replace with actual donation tracking when implemented
    // For now, return user data with placeholder stats
    const stats = {
      bloodGroup: user.bloodGroup || "Not Set",
      totalDonations: 0, // TODO: Count from blood donation records
      lastDonation: null, // TODO: Get from last blood donation record
      tokens: 0, // TODO: Calculate from donation rewards
      recentActivity: [], // TODO: Get from activity log
      eligibleToDonate: true, // TODO: Calculate based on last donation date
      nextEligibleDate: null, // TODO: Calculate 3 months from last donation
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard stats.", detail: err.message });
  }
});

// Simple list all users (admin use)
router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -__v")
      .lean()
      .limit(1000);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

module.exports = router;