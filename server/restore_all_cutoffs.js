import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({ name: String }, { strict: false }));

const eapcetCsv = 'c:/Users/balak/OneDrive/Desktop/admission predictor/sample colleges.csv';
const ecetCsv = 'c:/Users/balak/OneDrive/Desktop/admission predictor/ap_ecet.csv';

const categories = [
  'OC_BOYS', 'OC_GIRLS', 'SC_BOYS', 'SC_GIRLS', 'ST_BOYS', 'ST_GIRLS',
  'BCA_BOYS', 'BCA_GIRLS', 'BCB_BOYS', 'BCB_GIRLS', 'BCC_BOYS', 'BCC_GIRLS',
  'BCD_BOYS', 'BCD_GIRLS', 'BCE_BOYS', 'BCE_GIRLS', 'OC_EWS_BOYS', 'OC_EWS_GIRLS'
];

function parseCutoffs(values, examType, branch) {
  return categories.map((cat, i) => {
    const val = values[i + 5] ? values[i + 5].trim() : '';
    const rank = parseFloat(val);
    if (isNaN(rank) || rank === 0) return null;
    return {
      examType,
      branch,
      category: cat,
      year: 2025,
      closingRank: rank
    };
  }).filter(c => c !== null);
}

async function restore() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const allCollegesInDb = await College.find({}).lean();
  console.log(`Found ${allCollegesInDb.length} colleges in DB.`);

  // Create mappings of cutoffs from CSVs
  const csvData = new Map(); // Name -> { cutoffs: [], branches: Set }

  console.log('Reading EAPCET CSV...');
  const eapcetLines = fs.readFileSync(eapcetCsv, 'utf8').split('\n');
  eapcetLines.forEach(line => {
    const parts = line.split(',');
    if (parts.length < 6) return;
    const name = parts[0].trim();
    const branch = parts[1] ? parts[1].trim() : '';
    if (!csvData.has(name)) csvData.set(name, { cutoffs: [], branches: new Set() });
    const entry = csvData.get(name);
    entry.branches.add(branch);
    entry.cutoffs.push(...parseCutoffs(parts, 'AP EAPCET', branch));
  });

  console.log('Reading ECET CSV...');
  const ecetLines = fs.readFileSync(ecetCsv, 'utf8').split('\n');
  ecetLines.forEach(line => {
    const parts = line.split(',');
    if (parts.length < 6) return;
    const name = parts[0].trim();
    const branch = parts[1] ? parts[1].trim() : '';
    if (!csvData.has(name)) csvData.set(name, { cutoffs: [], branches: new Set() });
    const entry = csvData.get(name);
    entry.branches.add(branch);
    entry.cutoffs.push(...parseCutoffs(parts, 'AP ECET', branch));
  });

  console.log('Starting restoration of cutoffs for empty colleges...');
  let count = 0;
  for (const col of allCollegesInDb) {
    if ((!col.cutoffs || col.cutoffs.length === 0) && csvData.has(col.name)) {
      const data = csvData.get(col.name);
      if (data.cutoffs.length > 0) {
        await College.updateOne(
          { _id: col._id },
          { 
            $set: { 
              cutoffs: data.cutoffs,
              branches: Array.from(data.branches).map(b => ({ name: b, code: b }))
            } 
          }
        );
        console.log(`- Restored ${data.cutoffs.length} cutoffs for: ${col.name}`);
        count++;
      }
    }
  }

  console.log(`Restoration complete. Updated ${count} colleges.`);
  await mongoose.disconnect();
}
restore();
