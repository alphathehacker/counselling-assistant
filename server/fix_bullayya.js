import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({}, { strict: false }));

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const csvPath = 'c:/Users/balak/OneDrive/Desktop/admission predictor/sample colleges.csv';
  const lines = fs.readFileSync(csvPath, 'utf8').split('\n');
  const cats = [
    'OC_BOYS', 'OC_GIRLS', 'SC_BOYS', 'SC_GIRLS', 'ST_BOYS', 'ST_GIRLS',
    'BCA_BOYS', 'BCA_GIRLS', 'BCB_BOYS', 'BCB_GIRLS', 'BCC_BOYS', 'BCC_GIRLS',
    'BCD_BOYS', 'BCD_GIRLS', 'BCE_BOYS', 'BCE_GIRLS', 'OC_EWS_BOYS', 'OC_EWS_GIRLS'
  ];

  let cutoffs = [];
  let branchesSet = new Set();

  lines.forEach(line => {
    const parts = line.split(',');
    if (parts[0].includes('BULLAYYA')) {
      const branch = parts[1];
      branchesSet.add(branch);
      cats.forEach((cat, i) => {
        const val = parts[i + 5] ? parts[i + 5].trim() : '';
        const rank = parseFloat(val);
        if (!isNaN(rank) && rank > 0) {
          cutoffs.push({
            examType: 'AP EAPCET',
            branch,
            category: cat,
            year: 2025,
            closingRank: rank
          });
        }
      });
    }
  });

  const update = {
    $set: {
      cutoffs,
      branches: Array.from(branchesSet).map(b => ({ name: b, code: b })),
      examTypes: ['AP EAPCET', 'AP ECET']
    }
  };

  const result = await College.updateOne({ name: 'DR L BULLAYYA COLL EGE OF ENGINEERING' }, update);
  console.log(`Updated Bullayya. matchedCount: ${result.matchedCount}, modifiedCount: ${result.modifiedCount}, cutoffs: ${cutoffs.length}`);
  await mongoose.disconnect();
}
fix();
