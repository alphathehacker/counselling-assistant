import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({ name: String, code: String }, { strict: false }));

const eapcetCsv = 'c:/Users/balak/OneDrive/Desktop/admission predictor/sample colleges.csv';
const ecetCsv = 'c:/Users/balak/OneDrive/Desktop/admission predictor/ap_ecet.csv';

const categories = [
  'OC_BOYS', 'OC_GIRLS', 'SC_BOYS', 'SC_GIRLS', 'ST_BOYS', 'ST_GIRLS',
  'BCA_BOYS', 'BCA_GIRLS', 'BCB_BOYS', 'BCB_GIRLS', 'BCC_BOYS', 'BCC_GIRLS',
  'BCD_BOYS', 'BCD_GIRLS', 'BCE_BOYS', 'BCE_GIRLS', 'OC_EWS_BOYS', 'OC_EWS_GIRLS'
];

function normalize(n) { return n ? n.toUpperCase().replace(/[^A-Z0-9]/g, '') : ''; }

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

async function syncAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const csvData = new Map(); // NormalizedName -> { cutoffs: [], branches: Set, originalName: String }

  console.log('Reading EAPCET CSV...');
  const eapcetLines = fs.readFileSync(eapcetCsv, 'utf8').split('\n');
  eapcetLines.forEach(line => {
    const parts = line.split(',');
    if (parts.length < 6) return;
    const name = parts[0].trim();
    const norm = normalize(name);
    const branch = parts[1] ? parts[1].trim() : '';
    if (!csvData.has(norm)) csvData.set(norm, { cutoffs: [], branches: new Set(), originalName: name });
    const entry = csvData.get(norm);
    entry.branches.add(branch);
    entry.cutoffs.push(...parseCutoffs(parts, 'AP EAPCET', branch));
  });

  console.log('Reading ECET CSV...');
  const ecetLines = fs.readFileSync(ecetCsv, 'utf8').split('\n');
  ecetLines.forEach(line => {
    const parts = line.split(',');
    if (parts.length < 6) return;
    const name = parts[0].trim();
    const norm = normalize(name);
    const branch = parts[1] ? parts[1].trim() : '';
    if (!csvData.has(norm)) csvData.set(norm, { cutoffs: [], branches: new Set(), originalName: name });
    const entry = csvData.get(norm);
    entry.branches.add(branch);
    entry.cutoffs.push(...parseCutoffs(parts, 'AP ECET', branch));
  });

  console.log(`Found ${csvData.size} colleges in CSVs.`);

  const dbColleges = await College.find({}).lean();
  let updateCount = 0;

  for (const col of dbColleges) {
    const norm = normalize(col.name);
    if (csvData.has(norm)) {
      const data = csvData.get(norm);
      if (data.cutoffs.length > 0) {
        // ALWAYS update the cutoffs and branches from CSV
        await College.updateOne(
          { _id: col._id },
          { 
            $set: { 
              cutoffs: data.cutoffs,
              branches: Array.from(data.branches).map(b => ({ name: b, code: b })),
              examTypes: Array.from(new Set([...(col.examTypes || []), 'AP EAPCET', 'AP ECET'].filter(t => t !== 'NEET' && (t === 'AP EAPCET' || t === 'AP ECET'))))
            } 
          }
        );
        updateCount++;
        if (updateCount % 50 === 0) console.log(`Updated ${updateCount} colleges...`);
      }
    }
  }

  console.log(`Bulk sync complete. Updated ${updateCount} colleges.`);
  await mongoose.disconnect();
}
syncAll();
