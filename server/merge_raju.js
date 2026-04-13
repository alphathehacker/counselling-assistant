import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({}, { strict: false }));

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // 1. Delete the "N S RAJU" short name record (fewer cutoffs)
  const del = await College.deleteOne({ name: 'N S RAJU INSTITUTE OF ENGG AND TECHNOLOGY' });
  
  // 2. Update the full name record with the correct code
  const upd = await College.updateOne(
    { name: 'NADIMPALLI SATYANARAYANA RAJU INSTITUTE OF TECHNOLOGY' },
    { $set: { code: 'NSRV', examTypes: ['AP EAPCET', 'AP ECET'] } }
  );
  
  console.log(`Merge Complete! Deleted redundant: ${del.deletedCount}, Updated main: ${upd.modifiedCount}`);
  
  await mongoose.disconnect();
}
fix();
