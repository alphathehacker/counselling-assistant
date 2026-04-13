import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({}, { strict: false }));

const cutoffCsv = 'c:/Users/balak/OneDrive/Desktop/admission predictor/neet_master_cutoff_properly_mapped.csv';
const detailsCsv = 'c:/Users/balak/OneDrive/Desktop/admission predictor/neet_colleges_full_details_FINAL_v7.csv';

function normalize(n) { return n ? n.toUpperCase().replace(/[^A-Z0-9]/g, '') : ''; }

function parseCsvLine(line) {
  let parts = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inQuotes = !inQuotes;
    else if (line[i] === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else current += line[i];
  }
  parts.push(current.trim());
  return parts;
}

async function restore() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // 1. Load details map from detailsCsv
  console.log('Loading details...');
  const detailsMap = new Map();
  const detailsLines = fs.readFileSync(detailsCsv, 'utf8').split('\n');
  const detailsHeaders = parseCsvLine(detailsLines[0]);
  detailsLines.slice(1).forEach(l => {
    const parts = parseCsvLine(l);
    if (!parts[0]) return;
    detailsMap.set(normalize(parts[0]), parts);
  });

  // 2. Load cutoff categories from headers
  const cutoffLines = fs.readFileSync(cutoffCsv, 'utf8').split('\n');
  const cutoffHeaders = parseCsvLine(cutoffLines[0]);
  // Round categories: starting from index 4
  const cutoffCats = cutoffHeaders.slice(4);

  // 3. Get existing NEET colleges from DB
  const dbColleges = await College.find({ examTypes: 'NEET' }).select('name').lean();
  const dbNamesNormalized = new Set(dbColleges.map(c => normalize(c.name)));

  console.log(`Already have ${dbNamesNormalized.size} NEET colleges in DB.`);

  let restoredCount = 0;
  for (const l of cutoffLines.slice(1)) {
    const parts = parseCsvLine(l);
    const name = parts[0];
    if (!name || name === 'Institute') continue;
    
    // Check if missing
    if (!dbNamesNormalized.has(normalize(name))) {
      // Find details
      const details = detailsMap.get(normalize(name)) || [];
      
      // Parse cutoffs
      let cutoffs = [];
      cutoffCats.forEach((cat, i) => {
        const rank = parseFloat(parts[i + 4]);
        if (!isNaN(rank) && rank > 0) {
          cutoffs.push({
            examType: 'NEET',
            branch: 'MBBS',
            category: cat, // e.g., "EWS_R1"
            year: 2024, // Assuming 2024 for NEET
            closingRank: rank
          });
        }
      });

      if (cutoffs.length > 0) {
        const college = new College({
          name,
          shortName: details[1] || name,
          code: details[2] || name.slice(0, 4).toUpperCase(),
          collegeType: details[3] || 'Private',
          examTypes: ['NEET'],
          location: {
            city: details[4] || parts[1] || '',
            state: details[5] || parts[2] || '',
            district: details[6] || '',
            pincode: details[7] || ''
          },
          website: details[14] || '',
          contact: { phone: details[15] || '', email: details[16] || '' },
          fees: { annualTuitionFee: parseFloat(details[17]) || 0 },
          placements: { averagePackage: parseFloat(details[21]) || 0 },
          facilities: details[26] ? details[26].split(',') : [],
          cutoffs,
          branches: [{ name: 'MBBS', code: 'MBBS' }],
          isActive: true
        });
        await college.save();
        restoredCount++;
        if (restoredCount % 50 === 0) console.log(`Restored ${restoredCount} colleges...`);
      }
    }
  }

  console.log(`Total Restored: ${restoredCount}`);
  await mongoose.disconnect();
}
restore();
