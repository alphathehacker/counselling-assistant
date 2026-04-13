import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const collegeSchema = new mongoose.Schema({
  name: String,
  examTypes: [String],
  location: { city: String, district: String, state: String },
  cutoffs: Array,
  branches: Array,
  isActive: Boolean,
}, { strict: false, timestamps: true });

const College = mongoose.model('College', collegeSchema);

async function removeDuplicates() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const total = await College.countDocuments();
  console.log(`Total colleges before cleanup: ${total}`);

  // Find all colleges grouped by name
  const groups = await College.aggregate([
    {
      $group: {
        _id: '$name',
        count: { $sum: 1 },
        ids: { $push: '$_id' },
        cutoffCounts: { $push: { $size: { $ifNull: ['$cutoffs', []] } } }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  console.log(`\nFound ${groups.length} college names with duplicates`);
  
  let totalDeleted = 0;
  const toDelete = [];

  for (const group of groups) {
    // Fetch full docs to determine which to keep
    const docs = await College.find({ _id: { $in: group.ids } }).lean();

    // Keep the one with the most cutoffs (most data), break tie by updatedAt
    docs.sort((a, b) => {
      const aCutoffs = (a.cutoffs || []).length;
      const bCutoffs = (b.cutoffs || []).length;
      if (bCutoffs !== aCutoffs) return bCutoffs - aCutoffs;
      // Prefer older (original) record
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const [keep, ...dupes] = docs;
    for (const dupe of dupes) {
      toDelete.push(dupe._id);
    }
    
    console.log(`  "${group._id}" - keep ${keep._id} (${(keep.cutoffs||[]).length} cutoffs), delete ${dupes.length} dupes`);
  }

  if (toDelete.length > 0) {
    console.log(`\nDeleting ${toDelete.length} duplicate records...`);
    const result = await College.deleteMany({ _id: { $in: toDelete } });
    totalDeleted = result.deletedCount;
    console.log(`Deleted ${totalDeleted} duplicate colleges`);
  } else {
    console.log('\nNo duplicates found to delete');
  }

  const finalTotal = await College.countDocuments();
  console.log(`\nTotal colleges after cleanup: ${finalTotal}`);
  console.log(`Removed ${total - finalTotal} duplicates`);

  await mongoose.disconnect();
  console.log('Done!');
}

removeDuplicates().catch(console.error);
