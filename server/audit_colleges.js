import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const collegeSchema = new mongoose.Schema({
  name: String,
  code: String,
  examTypes: [String],
  location: Object,
  cutoffs: Array,
}, { strict: false, timestamps: true });

const College = mongoose.model('College', collegeSchema);

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  const total = await College.countDocuments();
  console.log(`Total: ${total}`);
  // 1043 + 271 + 104 + 23 = 1441, but actual is 1602 → 161 extra

  // Find single-exam colleges by type
  const singleNEET = await College.countDocuments({ examTypes: ['NEET'] });
  const singleAPE = await College.countDocuments({ examTypes: ['AP EAPCET'] });
  const singleAPC = await College.countDocuments({ examTypes: ['AP ECET'] });
  const singleJEE = await College.countDocuments({ examTypes: ['JEE Main'] });
  const singleAdv = await College.countDocuments({ examTypes: ['JEE Advanced'] });
  const dualAP = await College.countDocuments({ examTypes: ['AP EAPCET', 'AP ECET'] });
  const dualAPRev = await College.countDocuments({ examTypes: ['AP ECET', 'AP EAPCET'] });

  console.log(`\nSingle exam types:`);
  console.log(`  NEET only: ${singleNEET}`);
  console.log(`  AP EAPCET only: ${singleAPE}`);
  console.log(`  AP ECET only: ${singleAPC}`);
  console.log(`  JEE Main only: ${singleJEE}`);
  console.log(`  JEE Advanced only: ${singleAdv}`);
  console.log(`  AP EAPCET+AP ECET: ${dualAP}`);
  console.log(`  AP ECET+AP EAPCET: ${dualAPRev}`);

  const total2 = singleNEET + singleAPE + singleAPC + singleJEE + singleAdv + dualAP + dualAPRev;
  console.log(`\nSum above: ${total2}`);
  console.log(`Unexplained: ${total - total2}`);

  // Find colleges with 0 exam types
  const noExam = await College.countDocuments({ examTypes: { $size: 0 } });
  console.log(`Colleges with 0 exam types: ${noExam}`);

  // Count all exam combos
  const combos = await College.aggregate([
    { $group: { _id: '$examTypes', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log('\nAll exam type combinations:');
  combos.forEach(c => console.log(`  ${JSON.stringify(c._id)} -> ${c.count}`));

  await mongoose.disconnect();
}

audit().catch(console.error);
