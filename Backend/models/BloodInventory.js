const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One inventory per hospital
  },
  inventory: {
    'A+': {
      units: { type: Number, default: 0, min: 0 },
      capacity: { type: Number, default: 50, min: 1 },
    },
    'A-': {
      units: { type: Number, default: 0, min: 0 },
      capacity: { type: Number, default: 30, min: 1 },
    },
    'B+': {
      units: { type: Number, default: 0, min: 0 },
      capacity: { type: Number, default: 50, min: 1 },
    },
    'B-': {
      units: { type: Number, default: 0, min: 0 },
      capacity: { type: Number, default: 30, min: 1 },
    },
    'AB+': {
      units: { type: Number, default: 0, min: 0 },
      capacity: { type: Number, default: 30, min: 1 },
    },
    'AB-': {
      units: { type: Number, default: 0, min: 0 },
      capacity: { type: Number, default: 20, min: 1 },
    },
    'O+': {
      units: { type: Number, default: 0, min: 0 },
      capacity: { type: Number, default: 60, min: 1 },
    },
    'O-': {
      units: { type: Number, default: 0, min: 0 },
      capacity: { type: Number, default: 40, min: 1 },
    },
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Method to get status for a blood group
bloodInventorySchema.methods.getBloodGroupStatus = function(bloodGroup) {
  const stock = this.inventory[bloodGroup];
  if (!stock) return 'unavailable';
  
  const percentage = (stock.units / stock.capacity) * 100;
  
  if (stock.units === 0) return 'critical';
  if (percentage < 20) return 'critical';
  if (percentage < 50) return 'low';
  return 'good';
};

// Method to update blood units
bloodInventorySchema.methods.updateBloodUnits = function(bloodGroup, units) {
  if (!this.inventory[bloodGroup]) {
    throw new Error(`Invalid blood group: ${bloodGroup}`);
  }
  
  const newUnits = Math.max(0, Math.min(units, this.inventory[bloodGroup].capacity));
  this.inventory[bloodGroup].units = newUnits;
  this.lastUpdated = new Date();
  
  return this.save();
};

module.exports = mongoose.model('BloodInventory', bloodInventorySchema);
