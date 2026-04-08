const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LifeFlow';

async function updateAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Update or create admin user
    const result = await User.findOneAndUpdate(
      { email: 'admin@lifeflow' },
      {
        email: 'admin@lifeflow',
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
        isVerified: true,
      },
      { upsert: true, new: true }
    );

    console.log('Admin user updated successfully!');
    console.log('Email: admin@lifeflow');
    console.log('Password: admin');
    console.log('User ID:', result._id);

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin:', error);
    process.exit(1);
  }
}

updateAdmin();
