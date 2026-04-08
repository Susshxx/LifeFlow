const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const BloodCamp = require('../models/BloodCamp');
const User = require('../models/User');

const SECRET = process.env.JWT_SECRET || 'lifeflow_Secret_2026';

// Middleware to protect routes
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

// ── POST /:campId — Donor registers for a blood camp ──────────────────────
router.post('/:campId', protect, async (req, res) => {
  try {
    console.log('Registration request received for camp:', req.params.campId);
    console.log('User role:', req.user.role);
    console.log('Request body:', req.body);

    if (req.user.role !== 'user') {
      return res.status(403).json({ error: 'Only donors can register for blood camps' });
    }

    const camp = await BloodCamp.findById(req.params.campId);
    if (!camp) {
      console.log('Camp not found:', req.params.campId);
      return res.status(404).json({ error: 'Blood camp not found' });
    }

    console.log('Camp found:', camp.title, 'Status:', camp.status);

    if (camp.status !== 'approved') {
      return res.status(400).json({ error: 'Can only register for approved blood camps' });
    }

    // Check if already registered
    const alreadyRegistered = camp.registeredDonors.some(
      donor => donor.userId.toString() === req.user.id
    );
    if (alreadyRegistered) {
      return res.status(400).json({ error: 'You are already registered for this camp' });
    }

    // Check capacity
    if (camp.registeredDonors.length >= camp.expectedDonors) {
      return res.status(400).json({ error: 'This camp is fully booked' });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { fullName, email, phone, age, weight, lastDonationMonth, lastDonationYear } = req.body;

    // Add donor to camp
    camp.registeredDonors.push({
      userId: req.user.id,
      fullName: fullName || user.name,
      email: email || user.email,
      phone: phone || user.phone,
      age: age || null,
      weight: weight || null,
      lastDonationMonth: lastDonationMonth || '',
      lastDonationYear: lastDonationYear || '',
      registeredAt: new Date(),
    });

    await camp.save();
    console.log('Registration successful. Total registered:', camp.registeredDonors.length);

    const populated = await BloodCamp.findById(camp._id)
      .populate('hospitalId', 'hospitalName name email tempLocation')
      .populate('registeredDonors.userId', 'name bloodGroup email phone');

    res.json({ 
      message: 'Successfully registered for blood camp', 
      camp: populated 
    });
  } catch (error) {
    console.error('Register for blood camp error:', error);
    res.status(500).json({ error: 'Failed to register for blood camp', details: error.message });
  }
});

// ── GET /:campId — Get registrations for a specific camp ──────────────────
router.get('/:campId', protect, async (req, res) => {
  try {
    const camp = await BloodCamp.findById(req.params.campId)
      .populate('registeredDonors.userId', 'name bloodGroup email phone');
    
    if (!camp) {
      return res.status(404).json({ error: 'Blood camp not found' });
    }

    // Only hospital that owns the camp or admin can view registrations
    if (req.user.role === 'hospital' && camp.hospitalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only view registrations for your own camps' });
    }

    res.json({ 
      registrations: camp.registeredDonors,
      total: camp.registeredDonors.length,
      capacity: camp.expectedDonors
    });
  } catch (error) {
    console.error('Get camp registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch camp registrations' });
  }
});

// ── DELETE /:campId — Donor cancels their registration ────────────────────
router.delete('/:campId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ error: 'Only donors can cancel their registration' });
    }

    const camp = await BloodCamp.findById(req.params.campId);
    if (!camp) {
      return res.status(404).json({ error: 'Blood camp not found' });
    }

    const registrationIndex = camp.registeredDonors.findIndex(
      donor => donor.userId.toString() === req.user.id
    );

    if (registrationIndex === -1) {
      return res.status(404).json({ error: 'You are not registered for this camp' });
    }

    camp.registeredDonors.splice(registrationIndex, 1);
    await camp.save();

    res.json({ 
      message: 'Registration cancelled successfully',
      remainingRegistrations: camp.registeredDonors.length
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
});

module.exports = router;
