import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({}, { strict: false }));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const duplicates = await College.aggregate([
    { $group: { _id: '$name', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  console.log(JSON.stringify(duplicates, null, 2));
  await mongoose.disconnect();
}
run();
