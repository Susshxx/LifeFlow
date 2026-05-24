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

    // Import BloodDonationHistory model to get actual donation data
    const BloodDonationHistory = require("../models/BloodDonationHistory");
    
    // Get total donations count
    const totalDonations = await BloodDonationHistory.countDocuments({ donorId: req.user.id });
    
    // Get last donation
    const lastDonationRecord = await BloodDonationHistory.findOne({ donorId: req.user.id })
      .sort({ donationDate: -1 })
      .limit(1);
    
    // Calculate eligibility (must wait 90 days / 3 months between donations)
    let eligibleToDonate = true;
    let nextEligibleDate = null;
    let daysSinceLastDonation = null;
    
    if (lastDonationRecord) {
      daysSinceLastDonation = Math.floor(
        (new Date().getTime() - new Date(lastDonationRecord.donationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastDonation < 90) {
        eligibleToDonate = false;
        const nextDate = new Date(lastDonationRecord.donationDate);
        nextDate.setDate(nextDate.getDate() + 90);
        nextEligibleDate = nextDate.toISOString();
      }
    }

    const stats = {
      bloodGroup: user.bloodGroup || "Not Set",
      totalDonations: totalDonations,
      lastDonation: lastDonationRecord ? lastDonationRecord.donationDate : null,
      daysSinceLastDonation: daysSinceLastDonation,
      tokens: user.tokens || 0, // Get actual tokens from user model
      recentActivity: [], // TODO: Get from activity log if needed
      eligibleToDonate: eligibleToDonate,
      nextEligibleDate: nextEligibleDate,
    };

    res.json(stats);
  } catch (err) {
    console.error("Dashboard stats error:", err);
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

// ── POST /:userId/redeem-tokens — Redeem tokens for a donor ──────────────────
router.post("/:userId/redeem-tokens", auth, async (req, res) => {
  try {
    // Only hospitals can redeem tokens for donors
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ error: 'Only hospitals can redeem tokens for donors' });
    }

    const { tokensToRedeem } = req.body;
    
    if (!tokensToRedeem || tokensToRedeem <= 0) {
      return res.status(400).json({ error: 'Invalid token amount' });
    }

    const donor = await User.findById(req.params.userId);
    
    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    if (donor.role !== 'user') {
      return res.status(400).json({ error: 'Can only redeem tokens for donors' });
    }

    const currentTokens = donor.tokens || 0;
    
    if (currentTokens < tokensToRedeem) {
      return res.status(400).json({ 
        error: `Insufficient tokens. Donor has ${currentTokens} tokens, but ${tokensToRedeem} are required.` 
      });
    }

    // Deduct tokens
    donor.tokens = currentTokens - tokensToRedeem;
    await donor.save();

    console.log(`✅ Tokens redeemed for ${donor.name}: ${currentTokens} → ${donor.tokens} (-${tokensToRedeem})`);

    res.json({
      message: `Successfully redeemed ${tokensToRedeem} tokens for ${donor.name}`,
      previousBalance: currentTokens,
      newBalance: donor.tokens,
      tokensRedeemed: tokensToRedeem,
    });
  } catch (err) {
    console.error('Redeem tokens error:', err);
    res.status(500).json({ error: 'Failed to redeem tokens', detail: err.message });
  }
});

// ── PUT /:userId/verify — Verify a user or hospital (admin only) ──────────────
router.put("/:userId/verify", auth, async (req, res) => {
  try {
    // Only admins can verify users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can verify users' });
    }

    const { verified } = req.body;
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.verified = verified === true;
    await user.save();

    console.log(`✅ User ${user.name} (${user.role}) verified status updated to: ${user.verified}`);

    res.json({
      message: `User ${verified ? 'verified' : 'unverified'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
      },
    });
  } catch (err) {
    console.error('Verify user error:', err);
    res.status(500).json({ error: 'Failed to verify user', detail: err.message });
  }
});

// ── PUT /:userId/reject — Reject a user or hospital (admin only) ──────────────
router.put("/:userId/reject", auth, async (req, res) => {
  try {
    // Only admins can reject users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can reject users' });
    }

    const { rejectionReason } = req.body;
    
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.verified = false;
    user.rejectionReason = rejectionReason.trim();
    await user.save();

    console.log(`❌ User ${user.name} (${user.role}) rejected. Reason: ${rejectionReason}`);

    res.json({
      message: 'User rejected successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        rejectionReason: user.rejectionReason,
      },
    });
  } catch (err) {
    console.error('Reject user error:', err);
    res.status(500).json({ error: 'Failed to reject user', detail: err.message });
  }
});

module.exports = router;