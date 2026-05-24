// Fix missing donation history entries
require('dotenv').config();
const mongoose = require('mongoose');
const BloodCamp = require('./models/BloodCamp');
const BloodDonationHistory = require('./models/BloodDonationHistory');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lifeflow';

async function fixDonationHistory() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all camps with completed donations
    const camps = await BloodCamp.find()
      .populate('hospitalId', 'name hospitalName')
      .populate('registeredDonors.userId', 'name bloodGroup');
    
    let created = 0;
    let skipped = 0;

    for (const camp of camps) {
      for (const donor of camp.registeredDonors) {
        if (donor.donationCompleted) {
          const donorUser = donor.userId;
          
          if (!donorUser) {
            console.log(`⚠️  Skipping: Donor user not found for ${donor.fullName}`);
            skipped++;
            continue;
          }

          // Check if history already exists
          const existingHistory = await BloodDonationHistory.findOne({
            donorId: donorUser._id,
            campId: camp._id,
          });

          if (existingHistory) {
            console.log(`⏭️  Skipping: History already exists for ${donorUser.name} at ${camp.title}`);
            skipped++;
            continue;
          }

          // Create donation history
          const donationHistory = new BloodDonationHistory({
            donorId: donorUser._id,
            hospitalId: camp.hospitalId._id,
            campId: camp._id,
            donorName: donorUser.name,
            hospitalName: camp.hospitalId.hospitalName || camp.hospitalId.name || 'Hospital',
            campTitle: camp.title,
            bloodGroup: donorUser.bloodGroup || 'Unknown',
            donationDate: donor.completedAt || new Date(),
            tokensAwarded: 10,
            location: typeof camp.location === 'object' ? camp.location.label : camp.location || '',
            notes: `Donation completed at ${camp.title}`,
          });

          await donationHistory.save();
          console.log(`✅ Created history: ${donorUser.name} at ${camp.title} (${donationHistory._id})`);
          created++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('\n✅ Fix completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixDonationHistory();
