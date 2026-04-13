import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({}, { strict: false }));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const cols = await College.find({ 'cutoffs.0': { $exists: true } }).lean();
  console.log('Total colleges with cutoffs:', cols.length);
  cols.forEach(c => {
    if (c.cutoffs.length > 0) {
      // console.log(`- ${c.name}: ${c.cutoffs.length}`);
    }
  });
  await mongoose.disconnect();
}
run();
