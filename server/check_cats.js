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
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in environment');
    process.exit(1);
  }
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const colleges = await College.find({ examTypes: { $in: ['AP EAPCET', 'AP ECET'] } }).limit(5);
  
  colleges.forEach(c => {
    console.log(`College: ${c.name} (${c.code})`);
    const cats = [...new Set(c.cutoffs.map(ct => ct.category))];
    const subcats = c.cutoffs.slice(0, 3).map(ct => `${ct.category}: ${ct.branch} -> ${ct.closingRank}`);
    console.log(`  Categories: ${cats.join(', ')}`);
    // console.log(`  Sample: ${subcats.join(' | ')}`);
  });

  const allCats = await College.aggregate([
    { $match: { examTypes: { $in: ['AP EAPCET', 'AP ECET'] } } },
    { $unwind: '$cutoffs' },
    { $group: { _id: '$cutoffs.category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  console.log('\nTop Categories in DB:');
  allCats.slice(0, 20).forEach(cat => console.log(`${cat._id}: ${cat.count}`));

  await mongoose.disconnect();
}

check();
