import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const collegeSchema = new mongoose.Schema({
  name: String,
  code: String,
  examTypes: [String],
  cutoffs: [{
    examType: String,
    category: String,
    branch: String,
    closingRank: Number
  }]
});

const College = mongoose.model('College', collegeSchema);

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  const res = await College.aggregate([
    { $unwind: '$cutoffs' },
    { $match: { 'cutoffs.category': /_AU|_SVU|_OU|_UR/i } },
    { $group: { _id: '$cutoffs.category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  console.log(JSON.stringify(res, null, 2));
  await mongoose.disconnect();
}
check();
