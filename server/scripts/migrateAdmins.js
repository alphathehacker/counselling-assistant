import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const migrateAdmins = async () => {
  try {
    console.log('Starting admin migration...');

    // Find all users with userType: 'admin'
    const adminUsers = await User.find({ userType: 'admin' });
    console.log(`Found ${adminUsers.length} admin users to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of adminUsers) {
      try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: user.email });
        if (existingAdmin) {
          console.log(`Admin ${user.email} already exists, skipping...`);
          skippedCount++;
          continue;
        }

        // Create new admin
        const adminData = {
          name: user.name,
          email: user.email,
          password: user.password, // Password hash is already hashed
          role: 'super-admin', // First admin gets super-admin role
          permissions: {
            canManageColleges: true,
            canManageUsers: true,
            canViewAnalytics: true,
            canImportData: true,
          },
          isActive: user.isActive,
          lastLogin: user.lastLogin,
        };

        const admin = await Admin.create(adminData);
        console.log(`Migrated admin: ${admin.email} (ID: ${admin._id})`);

        // Remove from User collection
        await User.findByIdAndDelete(user._id);
        console.log(`Removed from User collection: ${user.email}`);

        migratedCount++;

      } catch (error) {
        console.error(`Error migrating admin ${user.email}:`, error.message);
      }
    }

    console.log(`Migration completed:`);
    console.log(`- Migrated: ${migratedCount} admins`);
    console.log(`- Skipped: ${skippedCount} admins`);

    // Verify migration
    const remainingAdminUsers = await User.find({ userType: 'admin' });
    const totalAdmins = await Admin.find({});

    console.log(`Verification:`);
    console.log(`- Admin users in User collection: ${remainingAdminUsers.length}`);
    console.log(`- Admins in Admin collection: ${totalAdmins.length}`);

  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateAdmins();
  console.log('Migration script completed');
  process.exit(0);
};

runMigration();
