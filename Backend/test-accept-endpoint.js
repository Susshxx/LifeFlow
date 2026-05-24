// Test script to verify the accept blood request endpoint
const mongoose = require('mongoose');
require('dotenv').config();

const BloodRequest = require('./models/BloodRequest');

async function testAcceptEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Find a blood request with status 'open'
    const openRequest = await BloodRequest.findOne({ status: 'open', isActive: true });
    
    if (!openRequest) {
      console.log('No open blood requests found. Creating a test request...');
      
      // Create a test request
      const testRequest = await BloodRequest.create({
        userId: new mongoose.Types.ObjectId(),
        name: 'Test Donor',
        phone: '1234567890',
        email: 'test@example.com',
        bloodGroup: 'O+',
        isEmergency: false,
        location: {
          lat: 27.7172,
          lng: 85.3240,
          label: 'Test Location'
        },
        status: 'open',
        isActive: true
      });
      
      console.log('✓ Created test blood request:', testRequest._id);
      console.log('  Status:', testRequest.status);
      console.log('  Blood Group:', testRequest.bloodGroup);
    } else {
      console.log('✓ Found open blood request:', openRequest._id);
      console.log('  Status:', openRequest.status);
      console.log('  Blood Group:', openRequest.bloodGroup);
    }

    console.log('\n✓ The accept endpoint should be available at:');
    console.log('  POST /api/blood-requests/:id/accept');
    console.log('\n✓ Make sure to restart your backend server to load the new routes!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

testAcceptEndpoint();
