// Test if the API endpoint is returning correct token data
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lifeflow';

async function testAPIEndpoint() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a donor
    const donor = await User.findOne({ role: 'user' });
    
    if (!donor) {
      console.log('❌ No donor found');
      process.exit(1);
    }

    console.log('👤 Donor:', donor.name);
    console.log('🪙 Tokens in database:', donor.tokens || 0);
    console.log('🩸 Blood group:', donor.bloodGroup || 'Not set');
    console.log('\n📋 What the API SHOULD return:');
    console.log('   tokens:', donor.tokens || 0);
    console.log('\n⚠️  If the frontend shows 0 tokens, the backend server needs to be restarted!');
    console.log('\n🔄 To restart the backend:');
    console.log('   1. Stop the current server (Ctrl+C in the terminal running it)');
    console.log('   2. Run: npm start');
    console.log('   3. Refresh the frontend in your browser');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAPIEndpoint();
