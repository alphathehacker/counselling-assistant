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
  const college = await College.findOne({ examTypes: { $in: ['AP EAPCET'] } });
  if (college) {
    console.log(JSON.stringify(college.cutoffs.slice(0, 10), null, 2));
  }
  await mongoose.disconnect();
}
check();
