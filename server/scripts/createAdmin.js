import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';

// Load environment variables
dotenv.config({ path: './.env' });

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create admin user
    // Default credentials (change these!)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admissionpredictor.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists with this email:');
      console.log(`Email: ${existingAdmin.email}`);
      console.log('If you want to create a new admin, please use a different email or delete the existing one first.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await Admin.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      permissions: {
        manageColleges: true,
        manageUsers: true,
        manageDatasets: true,
        viewAnalytics: true,
      },
    });

    console.log('✅ Admin created successfully in admins collection!');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.error('Email already exists. Please use a different email.');
    }
    process.exit(1);
  }
};

createAdmin();
