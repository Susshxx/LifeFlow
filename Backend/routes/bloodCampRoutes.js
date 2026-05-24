const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const BloodCamp = require('../models/BloodCamp');
const User = require('../models/User');
const BloodDonationHistory = require('../models/BloodDonationHistory');
const { updateCampStatuses } = require('../utils/campStatusUpdater');

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

// ── POST / — Create blood camp (hospital only) ─────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ error: 'Only hospitals can create blood camps' });
    }
    const { title, description, expectedDonors, bloodGroups, location, startTime, duration } = req.body;
    if (!title || !expectedDonors || !location || !startTime || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const bloodCamp = new BloodCamp({
      hospitalId: req.user.id,
      title,
      description,
      expectedDonors,
      bloodGroups: bloodGroups || ['All'],
      location,
      startTime: new Date(startTime),
      duration,
      status: 'pending',
    });
    await bloodCamp.save();
    res.status(201).json(bloodCamp);
  } catch (error) {
    console.error('Create blood camp error:', error);
    res.status(500).json({ error: 'Failed to create blood camp' });
  }
});

// ── GET /approved — Approved camps (MUST be before /:id to prevent route conflict)
router.get('/approved', protect, async (req, res) => {
  try {
    // Update camp statuses before fetching
    await updateCampStatuses();

    const camps = await BloodCamp.find({ status: 'approved' })
      .populate('hospitalId', 'hospitalName name email tempLocation')
      .populate('registeredDonors.userId', 'name bloodGroup email phone')
      .sort({ startTime: 1 });
    res.json(camps);
  } catch (error) {
    console.error('Get approved camps error:', error);
    res.status(500).json({ error: 'Failed to fetch approved blood camps' });
  }
});

// ── GET / — List blood camps ───────────────────────────────────────────────
//   admin  → all camps
//   hospital → own camps (all statuses)
//   user/donor → approved camps only (excluding completed)
router.get('/', protect, async (req, res) => {
  try {
    // Update camp statuses before fetching
    await updateCampStatuses();

    let query = {};
    if (req.user.role === 'hospital') {
      query.hospitalId = req.user.id;
    } else if (req.user.role === 'user') {
      // Users only see approved camps that are not completed
      query.status = 'approved';
    }
    // admin: no filter → all camps

    const camps = await BloodCamp.find(query)
      .populate('hospitalId', 'hospitalName name email tempLocation')
      .populate('registeredDonors.userId', 'name bloodGroup email phone')
      .sort({ startTime: -1 });
    res.json(camps);
  } catch (error) {
    console.error('Get blood camps error:', error);
    res.status(500).json({ error: 'Failed to fetch blood camps' });
  }
});

// ── PUT /:id/cancel — Hospital cancels a pending camp request ─────────────
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ error: 'Only hospitals can cancel their blood camp requests' });
    }

    const camp = await BloodCamp.findById(req.params.id);
    if (!camp) return res.status(404).json({ error: 'Blood camp not found' });

    if (camp.hospitalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own blood camp requests' });
    }

    if (camp.status !== 'pending') {
      return res.status(400).json({ error: `Cannot cancel a camp with status "${camp.status}". Only pending camps can be cancelled.` });
    }

    camp.status = 'cancelled';
    await camp.save();
    res.json({ message: 'Blood camp request cancelled successfully', camp });
  } catch (error) {
    console.error('Cancel blood camp error:', error);
    res.status(500).json({ error: 'Failed to cancel blood camp request' });
  }
});

// ── PUT /:id/status — Admin approves or rejects a camp ────────────────────
router.put('/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update blood camp status' });
    }

    const { status, rejectionReason } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }
    if (status === 'rejected' && !rejectionReason?.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const camp = await BloodCamp.findById(req.params.id);
    if (!camp) return res.status(404).json({ error: 'Blood camp not found' });

    camp.status = status;
    if (status === 'rejected') camp.rejectionReason = rejectionReason.trim();
    await camp.save();

    const populated = await BloodCamp.findById(camp._id)
      .populate('hospitalId', 'hospitalName name email tempLocation');
    res.json({ message: `Blood camp ${status} successfully`, camp: populated });
  } catch (error) {
    console.error('Update blood camp status error:', error);
    res.status(500).json({ error: 'Failed to update blood camp status' });
  }
});

// ── POST /:id/register — Donor registers for a blood camp ─────────────────
router.post('/:id/register', protect, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ error: 'Only donors can register for blood camps' });
    }

    const camp = await BloodCamp.findById(req.params.id);
    if (!camp) return res.status(404).json({ error: 'Blood camp not found' });

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
    if (!user) return res.status(404).json({ error: 'User not found' });

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

    const populated = await BloodCamp.findById(camp._id)
      .populate('hospitalId', 'hospitalName name email tempLocation')
      .populate('registeredDonors.userId', 'name bloodGroup email phone');

    res.json({ 
      message: 'Successfully registered for blood camp', 
      camp: populated 
    });
  } catch (error) {
    console.error('Register for blood camp error:', error);
    res.status(500).json({ error: 'Failed to register for blood camp' });
  }
});

// ── POST /:id/complete-donation — Hospital marks donation as completed ────
router.post('/:id/complete-donation', protect, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ error: 'Only hospitals can mark donations as completed' });
    }

    const { donorUserId } = req.body;
    if (!donorUserId) {
      return res.status(400).json({ error: 'Donor user ID is required' });
    }

    const camp = await BloodCamp.findById(req.params.id);
    if (!camp) return res.status(404).json({ error: 'Blood camp not found' });

    // Verify hospital owns this camp
    if (camp.hospitalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only complete donations for your own camps' });
    }

    // Find the donor in registered donors
    const donorIndex = camp.registeredDonors.findIndex(
      donor => donor.userId.toString() === donorUserId
    );

    if (donorIndex === -1) {
      return res.status(404).json({ error: 'Donor not found in this camp' });
    }

    // Check if already completed
    if (camp.registeredDonors[donorIndex].donationCompleted) {
      return res.status(400).json({ error: 'Donation already marked as completed' });
    }

    // Mark donation as completed
    camp.registeredDonors[donorIndex].donationCompleted = true;
    camp.registeredDonors[donorIndex].completedAt = new Date();
    await camp.save();

    // Award tokens to donor and create history entry
    const TOKENS_PER_DONATION = 10;
    const donor = await User.findById(donorUserId);
    if (donor) {
      const previousTokens = donor.tokens || 0;
      donor.tokens = previousTokens + TOKENS_PER_DONATION;
      await donor.save();
      
      console.log(`✅ Tokens awarded to ${donor.name}: ${previousTokens} → ${donor.tokens}`);

      // Get hospital info
      const hospital = await User.findById(req.user.id);
      
      // Create donation history entry
      const donationHistory = new BloodDonationHistory({
        donorId: donorUserId,
        hospitalId: req.user.id,
        campId: req.params.id,
        donorName: donor.name,
        hospitalName: hospital?.hospitalName || hospital?.name || 'Hospital',
        campTitle: camp.title,
        bloodGroup: donor.bloodGroup || 'Unknown',
        donationDate: new Date(),
        tokensAwarded: TOKENS_PER_DONATION,
        location: typeof camp.location === 'object' ? camp.location.label : camp.location || '',
        notes: `Donation completed at ${camp.title}`,
      });
      
      await donationHistory.save();
      
      console.log(`✅ Donation history created: ${donationHistory._id}`);

      res.json({ 
        message: `Donation completed successfully! ${TOKENS_PER_DONATION} tokens awarded to donor.`,
        tokensAwarded: TOKENS_PER_DONATION,
        donorNewBalance: donor.tokens,
        historyId: donationHistory._id
      });
    } else {
      console.error(`❌ Donor not found: ${donorUserId}`);
      res.json({ 
        message: 'Donation marked as completed but donor not found for token award',
      });
    }
  } catch (error) {
    console.error('Complete donation error:', error);
    res.status(500).json({ error: 'Failed to complete donation' });
  }
});

// ── DELETE /:id — Delete a blood camp ────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const camp = await BloodCamp.findById(req.params.id);
    if (!camp) return res.status(404).json({ error: 'Blood camp not found' });

    if (req.user.role === 'hospital' && camp.hospitalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own blood camps' });
    }
    if (req.user.role !== 'hospital' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only hospitals and admins can delete blood camps' });
    }

    await BloodCamp.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blood camp deleted successfully' });
  } catch (error) {
    console.error('Delete blood camp error:', error);
    res.status(500).json({ error: 'Failed to delete blood camp' });
  }
});

module.exports = router;
