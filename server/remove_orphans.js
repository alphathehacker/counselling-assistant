import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const collegeSchema = new mongoose.Schema({
  name: String,
  examTypes: [String],
}, { strict: false, timestamps: true });

const College = mongoose.model('College', collegeSchema);

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  // Preview orphan records
  const orphans = await College.find({ examTypes: { $size: 0 } }).lean();
  console.log(`Found ${orphans.length} colleges with no exam type:`);
  orphans.slice(0, 10).forEach(c => console.log(`  "${c.name}" [${c._id}]`));
  if (orphans.length > 10) console.log(`  ...and ${orphans.length - 10} more`);

  // Delete them
  const result = await College.deleteMany({ examTypes: { $size: 0 } });
  console.log(`\nDeleted ${result.deletedCount} orphan college records`);

  const finalTotal = await College.countDocuments();
  console.log(`Total colleges remaining: ${finalTotal}`);

  await mongoose.disconnect();
  console.log('Done!');
}

cleanup().catch(console.error);
