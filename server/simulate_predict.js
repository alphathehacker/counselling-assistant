import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const collegeSchema = new mongoose.Schema({
  name: String,
  examTypes: [String],
  location: { district: String },
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

  const rank = 10000;
  const exam = 'AP EAPCET';
  const cat = 'OC_BOYS';

  const colleges = await College.find({ examTypes: exam }).limit(10);
  console.log(`Found ${colleges.length} colleges for ${exam}`);

  for (const c of colleges) {
    const matches = c.cutoffs.filter(ct => 
      ct.examType === exam && 
      ct.category === cat && 
      rank <= ct.closingRank
    );
    if (matches.length > 0) {
      console.log(`MATCH FOUND: ${c.name} - ${matches.length} branches`);
      console.log(`  Branches: ${matches.map(m => m.branch).join(', ')}`);
    } else {
      // console.log(`No match for ${c.name}`);
    }
  }

  await mongoose.disconnect();
}
check();
