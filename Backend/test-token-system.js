// Quick test script to verify token system
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const BloodDonationHistory = require('./models/BloodDonationHistory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lifeflow';

async function testTokenSystem() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a user with role 'user' (donor)
    const donor = await User.findOne({ role: 'user' });
    
    if (!donor) {
      console.log('❌ No donor found in database');
      process.exit(1);
    }

    console.log('👤 Found donor:', donor.name);
    console.log('🪙 Current tokens:', donor.tokens || 0);
    console.log('🩸 Blood group:', donor.bloodGroup || 'Not set');
    
    // Check donation history
    const donations = await BloodDonationHistory.find({ donorId: donor._id });
    console.log('\n📊 Donation History:');
    console.log('   Total donations:', donations.length);
    
    if (donations.length > 0) {
      console.log('\n   Recent donations:');
      donations.slice(0, 3).forEach((d, i) => {
        console.log(`   ${i + 1}. ${d.campTitle} - ${d.tokensAwarded} tokens (${new Date(d.donationDate).toLocaleDateString()})`);
      });
      
      const totalTokensFromHistory = donations.reduce((sum, d) => sum + d.tokensAwarded, 0);
      console.log('\n   Total tokens from history:', totalTokensFromHistory);
      console.log('   Tokens in user record:', donor.tokens || 0);
      
      if (totalTokensFromHistory !== (donor.tokens || 0)) {
        console.log('\n⚠️  WARNING: Token mismatch detected!');
        console.log('   Fixing token count...');
        donor.tokens = totalTokensFromHistory;
        await donor.save();
        console.log('✅ Token count fixed:', donor.tokens);
      } else {
        console.log('\n✅ Token count is correct!');
      }
    } else {
      console.log('   No donations found');
    }

    console.log('\n✅ Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testTokenSystem();
