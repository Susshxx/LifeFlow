const mongoose = require('mongoose');
const https = require('https');
require('dotenv').config();

const User = require('./models/User');

async function geocodeAddress(lat, lon) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;
    
    https.get(url, {
      headers: { 'User-Agent': 'LifeFlow Blood Donation App' },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const a = json.address || {};
          const parts = [
            a.neighbourhood || a.suburb || a.quarter || a.village || a.hamlet || a.road,
            a.city || a.town || a.municipality || a.county,
          ].filter(Boolean);
          
          if (parts.length) {
            resolve(parts.join(', '));
          } else {
            resolve(json.display_name?.split(',').slice(0, 2).join(',').trim() || '');
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function updateUserAddresses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');
    
    const users = await User.find({
      'tempLocation.lat': { $ne: null },
      'tempLocation.lng': { $ne: null },
    });
    
    console.log(`Found ${users.length} users with coordinates`);
    
    for (const user of users) {
      try {
        console.log(`\nGeocoding for ${user.name}...`);
        const address = await geocodeAddress(user.tempLocation.lat, user.tempLocation.lng);
        
        if (address) {
          user.tempLocation.address = address;
          await user.save();
          console.log(`✓ Updated: ${address}`);
        }
        
        // Wait 1 second between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`✗ Failed for ${user.name}:`, err.message);
      }
    }
    
    console.log('\n✓ Address update complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateUserAddresses();
