import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({}, { strict: false }));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const cols = await College.find({ 'cutoffs.0': { $exists: true } }).lean();
  console.log(JSON.stringify(cols.map(c => ({ name: c.name, cutoffs: (c.cutoffs||[]).length })).filter(c => c.name.includes('PHARMACY')), null, 2));
  await mongoose.disconnect();
}
run();
