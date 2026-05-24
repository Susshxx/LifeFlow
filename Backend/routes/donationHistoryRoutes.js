const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const BloodDonationHistory = require('../models/BloodDonationHistory');

const SECRET = process.env.JWT_SECRET || 'lifeflow_Secret_2026';

function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── GET / — Get donation history ──────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'user') {
      // Donors see their own donation history
      query.donorId = req.user.id;
    } else if (req.user.role === 'hospital') {
      // Hospitals see donations at their camps
      query.hospitalId = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admins see all donation history
      // No filter needed
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const donations = await BloodDonationHistory.find(query)
      .populate('donorId', 'name bloodGroup avatar')
      .populate('hospitalId', 'hospitalName name')
      .populate('campId', 'title startTime location')
      .sort({ donationDate: -1 })
      .limit(100); // Limit to last 100 donations

    res.json(donations);
  } catch (error) {
    console.error('Get donation history error:', error);
    res.status(500).json({ error: 'Failed to fetch donation history' });
  }
});

// ── GET /stats — Get donation statistics ──────────────────────────────────
router.get('/stats', protect, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'user') {
      query.donorId = req.user.id;
    } else if (req.user.role === 'hospital') {
      query.hospitalId = req.user.id;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const totalDonations = await BloodDonationHistory.countDocuments(query);
    const totalTokensEarned = await BloodDonationHistory.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$tokensAwarded' } } }
    ]);

    const lastDonation = await BloodDonationHistory.findOne(query)
      .sort({ donationDate: -1 });

    // Blood group breakdown (for hospitals and admins)
    let bloodGroupStats = [];
    if (req.user.role !== 'user') {
      bloodGroupStats = await BloodDonationHistory.aggregate([
        { $match: query },
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    }

    res.json({
      totalDonations,
      totalTokensEarned: totalTokensEarned[0]?.total || 0,
      lastDonation: lastDonation ? {
        date: lastDonation.donationDate,
        campTitle: lastDonation.campTitle,
        hospitalName: lastDonation.hospitalName
      } : null,
      bloodGroupStats
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({ error: 'Failed to fetch donation statistics' });
  }
});

// ── POST /tokens-by-hospital — Get tokens earned by donors from this hospital ──
router.post('/tokens-by-hospital', protect, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ error: 'Only hospitals can access this endpoint' });
    }

    const { donorIds } = req.body;
    
    if (!Array.isArray(donorIds) || donorIds.length === 0) {
      return res.status(400).json({ error: 'donorIds array is required' });
    }

    console.log('[Tokens By Hospital] Fetching tokens for donors:', donorIds);
    console.log('[Tokens By Hospital] Hospital ID:', req.user.id);

    const mongoose = require('mongoose');
    const User = require('../models/User');

    // Get actual token counts from User model
    const users = await User.find({
      _id: { $in: donorIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).select('_id tokens').lean();

    console.log('[Tokens By Hospital] Found users:', users);

    // Convert to object format { donorId: tokens }
    const tokensMap = {};
    users.forEach(user => {
      tokensMap[user._id.toString()] = user.tokens || 0;
    });

    // Ensure all requested donors are in the response (with 0 if not found)
    donorIds.forEach(id => {
      if (!(id in tokensMap)) {
        tokensMap[id] = 0;
      }
    });

    console.log('[Tokens By Hospital] Returning tokens map:', tokensMap);

    res.json(tokensMap);
  } catch (error) {
    console.error('[Tokens By Hospital] Error:', error);
    res.status(500).json({ error: 'Failed to fetch donor tokens' });
  }
});

module.exports = router;