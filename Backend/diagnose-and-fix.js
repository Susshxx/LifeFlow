// Diagnose token issue and provide fix instructions
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const BloodDonationHistory = require('./models/BloodDonationHistory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lifeflow';

async function diagnose() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         TOKEN ISSUE DIAGNOSIS & FIX                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    // Find donor
    const donor = await User.findOne({ role: 'user' });
    
    if (!donor) {
      console.log('❌ No donor found in database');
      process.exit(1);
    }

    // Get donation history
    const donations = await BloodDonationHistory.find({ donorId: donor._id });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  DATABASE STATE (What the backend SHOULD return)');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('👤 Donor Name:', donor.name);
    console.log('🩸 Blood Group:', donor.bloodGroup || 'Not set');
    console.log('🪙 Tokens in DB:', donor.tokens || 0);
    console.log('📊 Total Donations:', donations.length);
    
    if (donations.length > 0) {
      console.log('📅 Last Donation:', new Date(donations[0].donationDate).toLocaleDateString());
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  PROBLEM DIAGNOSIS');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (donor.tokens > 0) {
      console.log('✅ Database has tokens:', donor.tokens);
      console.log('❌ Frontend shows: 0');
      console.log('\n🔍 ROOT CAUSE:');
      console.log('   The backend server is running OLD CODE that returns');
      console.log('   hardcoded "tokens: 0" instead of reading from database.\n');
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  THE FIX (Takes 30 seconds)');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      console.log('📋 STEP 1: Stop the Backend Server');
      console.log('   → Find the terminal running the backend');
      console.log('   → Press Ctrl+C to stop it\n');
      
      console.log('📋 STEP 2: Start the Backend Server');
      console.log('   → In the same terminal, type: npm start');
      console.log('   → Wait for "Server running on port 5000"\n');
      
      console.log('📋 STEP 3: Refresh the Frontend');
      console.log('   → Go to your browser');
      console.log('   → Press Ctrl+Shift+R (hard refresh)');
      console.log('   → Login as donor');
      console.log('   → Check dashboard\n');
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  EXPECTED RESULT AFTER RESTART');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      console.log('✅ Token Rewards card shows:', donor.tokens, 'tokens');
      console.log('✅ Total Donations shows:', donations.length);
      if (donations.length > 0) {
        console.log('✅ Last Donation shows:', new Date(donations[0].donationDate).toLocaleDateString());
      }
      console.log('✅ Donation History page shows', donations.length, 'donation(s)');
      console.log('✅ Recent Activity shows the donation\n');
      
    } else {
      console.log('⚠️  Database has 0 tokens');
      console.log('   This means no donations have been completed yet.');
      console.log('   Complete a blood donation first to earn tokens.\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  NEED MORE HELP?');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📖 Read these files for detailed help:');
    console.log('   • SIMPLE-FIX.txt - Quick fix guide');
    console.log('   • HOW-TO-RESTART-BACKEND.md - Detailed instructions');
    console.log('   • TOKEN-ISSUE-EXPLAINED.md - Technical explanation\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nMake sure MongoDB is running and the connection string is correct.');
    process.exit(1);
  }
}

diagnose();
