// Check blood camps and registrations
require('dotenv').config();
const mongoose = require('mongoose');
const BloodCamp = require('./models/BloodCamp');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lifeflow';

async function checkCamps() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all camps
    const camps = await BloodCamp.find()
      .populate('hospitalId', 'name hospitalName')
      .populate('registeredDonors.userId', 'name bloodGroup');
    
    console.log(`📋 Total camps: ${camps.length}\n`);

    camps.forEach((camp, index) => {
      console.log(`${index + 1}. ${camp.title}`);
      console.log(`   Status: ${camp.status}`);
      console.log(`   Hospital: ${camp.hospitalId?.hospitalName || camp.hospitalId?.name || 'Unknown'}`);
      console.log(`   Registered donors: ${camp.registeredDonors.length}`);
      
      if (camp.registeredDonors.length > 0) {
        console.log('   Donors:');
        camp.registeredDonors.forEach((donor, i) => {
          const donorName = donor.fullName || donor.userId?.name || 'Unknown';
          const completed = donor.donationCompleted ? '✅ COMPLETED' : '⏳ Pending';
          console.log(`      ${i + 1}. ${donorName} - ${completed}`);
          if (donor.donationCompleted) {
            console.log(`         Completed at: ${donor.completedAt}`);
          }
        });
      }
      console.log('');
    });

    // Check users with tokens
    const usersWithTokens = await User.find({ tokens: { $gt: 0 } }).select('name role tokens bloodGroup');
    console.log(`\n💰 Users with tokens: ${usersWithTokens.length}`);
    usersWithTokens.forEach(user => {
      console.log(`   ${user.name} (${user.role}): ${user.tokens} tokens`);
    });

    console.log('\n✅ Check completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCamps();
