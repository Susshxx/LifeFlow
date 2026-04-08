const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const BloodInventory = require('../models/BloodInventory');

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

// ── GET /api/blood-inventory/all/hospitals (STATIC — must be before /:hospitalId)
router.get('/all/hospitals', protect, async (req, res) => {
  try {
    const inventories = await BloodInventory.find()
      .populate('hospitalId', 'hospitalName name tempLocation')
      .lean()
      .limit(100);
    res.json(inventories);
  } catch (error) {
    console.error('Get all inventories error:', error);
    res.status(500).json({ error: 'Failed to fetch inventories' });
  }
});

// ── GET /api/blood-inventory (own hospital inventory) ───────────────────────
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'hospital' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only hospitals can access inventory' });
    }

    const hospitalId = req.user.role === 'hospital' ? req.user.id : req.query.hospitalId;
    if (!hospitalId) {
      return res.status(400).json({ error: 'Hospital ID required' });
    }

    let inventory = await BloodInventory.findOne({ hospitalId });
    if (!inventory) {
      inventory = new BloodInventory({ hospitalId });
      await inventory.save();
    }
    res.json(inventory);
  } catch (error) {
    console.error('Get blood inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch blood inventory' });
  }
});

// ── PUT /api/blood-inventory/bulk (STATIC — must be before /:hospitalId) ────
router.put('/bulk', protect, async (req, res) => {
  try {
    console.log('Bulk update request from user:', req.user.id, 'role:', req.user.role);

    if (req.user.role !== 'hospital') {
      return res.status(403).json({ error: 'Only hospitals can update inventory' });
    }

    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' });
    }

    let inventory = await BloodInventory.findOne({ hospitalId: req.user.id });
    if (!inventory) {
      inventory = new BloodInventory({ hospitalId: req.user.id });
    }

    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    for (const update of updates) {
      const { bloodGroup, units, capacity } = update;
      if (!validBloodGroups.includes(bloodGroup)) continue;

      if (capacity !== undefined && capacity !== null) {
        inventory.inventory[bloodGroup].capacity = Math.max(1, Number(capacity));
      }
      if (units !== undefined && units !== null) {
        const maxUnits = inventory.inventory[bloodGroup].capacity;
        inventory.inventory[bloodGroup].units = Math.max(0, Math.min(Number(units), maxUnits));
      }
    }

    inventory.lastUpdated = new Date();
    inventory.markModified('inventory');
    const savedInventory = await inventory.save();
    console.log('Bulk inventory saved successfully');
    res.json(savedInventory);
  } catch (error) {
    console.error('Bulk update blood inventory error:', error);
    res.status(500).json({ error: 'Failed to update blood inventory', detail: error.message });
  }
});

// ── PUT /api/blood-inventory (single blood group update) ────────────────────
router.put('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({ error: 'Only hospitals can update inventory' });
    }

    const { bloodGroup, units, capacity } = req.body;
    if (!bloodGroup) return res.status(400).json({ error: 'Blood group is required' });

    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({ error: 'Invalid blood group' });
    }

    let inventory = await BloodInventory.findOne({ hospitalId: req.user.id });
    if (!inventory) {
      inventory = new BloodInventory({ hospitalId: req.user.id });
    }

    if (capacity !== undefined && capacity !== null) {
      inventory.inventory[bloodGroup].capacity = Math.max(1, Number(capacity));
    }
    if (units !== undefined && units !== null) {
      const maxUnits = inventory.inventory[bloodGroup].capacity;
      inventory.inventory[bloodGroup].units = Math.max(0, Math.min(Number(units), maxUnits));
    }

    inventory.lastUpdated = new Date();
    inventory.markModified('inventory');
    const savedInventory = await inventory.save();
    res.json(savedInventory);
  } catch (error) {
    console.error('Update blood inventory error:', error);
    res.status(500).json({ error: 'Failed to update blood inventory', detail: error.message });
  }
});

// ── GET /api/blood-inventory/:hospitalId (PARAMETERIZED — must be last) ─────
router.get('/:hospitalId', protect, async (req, res) => {
  try {
    let inventory = await BloodInventory.findOne({ hospitalId: req.params.hospitalId })
      .select('-__v');

    if (!inventory) {
      inventory = new BloodInventory({ hospitalId: req.params.hospitalId });
      await inventory.save();
    }
    res.json(inventory);
  } catch (error) {
    console.error('Get hospital inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch hospital inventory' });
  }
});

module.exports = router;
