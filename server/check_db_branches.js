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
  const colleges = await College.find({ examTypes: { $in: ['AP EAPCET'] } }).limit(20);
  
  const branches = [...new Set(colleges.flatMap(c => c.cutoffs.map(ct => ct.branch)))].filter(Boolean).sort();
  console.log('Branches in DB for AP EAPCET:');
  console.log(branches.join(', '));
  
  await mongoose.disconnect();
}
check();
