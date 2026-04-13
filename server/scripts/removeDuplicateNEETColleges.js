import mongoose from 'mongoose';
import dotenv from 'dotenv';
import College from '../models/College.js';

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

const removeDuplicates = async () => {
  try {
    await connectDB();

    // Find all colleges that have NEET in examTypes or cutoffs
    const neetColleges = await College.find({
      $or: [
        { examTypes: 'NEET' },
        { 'cutoffs.examType': 'NEET' }
      ]
    });

    console.log(`\nFound ${neetColleges.length} colleges with NEET data\n`);

    // Group by name, state, and branch to find duplicates
    const grouped = {};
    const duplicates = [];

    for (const college of neetColleges) {
      // Get all NEET branches from cutoffs
      const neetBranches = college.cutoffs
        .filter(c => c.examType === 'NEET')
        .map(c => c.branch);

      // Create a key based on name (normalized), state, and branches
      const normalizedName = college.name.trim().toLowerCase();
      const state = college.location?.state || 'Unknown';
      const branchesKey = neetBranches.sort().join('|');

      const key = `${normalizedName}::${state}::${branchesKey}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(college);
    }

    // Find groups with duplicates
    for (const [key, colleges] of Object.entries(grouped)) {
      if (colleges.length > 1) {
        duplicates.push({
          key,
          colleges,
          count: colleges.length
        });
      }
    }

    console.log(`Found ${duplicates.length} groups with duplicates\n`);

    if (duplicates.length === 0) {
      console.log('No duplicates found!');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Display duplicates
    let totalToRemove = 0;
    for (const dup of duplicates) {
      const [name, state, branches] = dup.key.split('::');
      console.log(`\nDuplicate Group: ${name} (${state})`);
      console.log(`  Branches: ${branches || 'N/A'}`);
      console.log(`  Count: ${dup.count}`);
      
      // Sort by creation date (keep the oldest) or by data completeness
      dup.colleges.sort((a, b) => {
        // Prefer the one with more cutoffs
        const aCutoffs = a.cutoffs?.filter(c => c.examType === 'NEET').length || 0;
        const bCutoffs = b.cutoffs?.filter(c => c.examType === 'NEET').length || 0;
        if (bCutoffs !== aCutoffs) return bCutoffs - aCutoffs;
        
        // If same, keep the one created first
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      // Keep the first one (most complete or oldest), remove the rest
      const toKeep = dup.colleges[0];
      const toRemove = dup.colleges.slice(1);

      console.log(`  Keeping: ${toKeep._id} (created: ${toKeep.createdAt})`);
      for (const college of toRemove) {
        console.log(`  Removing: ${college._id} (created: ${college.createdAt})`);
        totalToRemove++;
      }
    }

    console.log(`\n\nTotal duplicates to remove: ${totalToRemove}`);
    console.log('\nStarting removal...\n');

    // Remove duplicates
    let removed = 0;
    for (const dup of duplicates) {
      const toRemove = dup.colleges.slice(1);
      for (const college of toRemove) {
        await College.findByIdAndDelete(college._id);
        removed++;
        console.log(`Removed: ${college.name} (${college._id})`);
      }
    }

    console.log(`\n✅ Successfully removed ${removed} duplicate colleges`);
    
    // Final count
    const finalCount = await College.countDocuments({
      $or: [
        { examTypes: 'NEET' },
        { 'cutoffs.examType': 'NEET' }
      ]
    });
    console.log(`\nFinal NEET colleges count: ${finalCount}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error removing duplicates:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
removeDuplicates();

