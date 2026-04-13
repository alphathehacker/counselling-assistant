import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({ name: String, code: String }, { strict: false }));

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
  detailsLines.slice(1).forEach(l => {
    const parts = parseCsvLine(l);
    if (!parts[0]) return;
    detailsMap.set(normalize(parts[0]), parts);
  });

  // 2. Load cutoff categories from headers
  const cutoffLines = fs.readFileSync(cutoffCsv, 'utf8').split('\n');
  const cutoffHeaders = parseCsvLine(cutoffLines[0]);
  const cutoffCats = cutoffHeaders.slice(4);

  // 3. Load all colleges from DB for fuzzy matching and checking
  const dbColleges = await College.find({}).lean();
  const dbNamesNormalizedMap = new Map();
  const dbCodes = new Set(dbColleges.map(c => c.code).filter(Boolean));
  dbColleges.forEach(c => dbNamesNormalizedMap.set(normalize(c.name), c));

  console.log(`Loaded ${dbColleges.length} colleges from DB.`);

  let restoredCount = 0;
  let updatedCount = 0;

  for (const l of cutoffLines.slice(1)) {
    const parts = parseCsvLine(l);
    const name = parts[0];
    if (!name || name === 'Institute') continue;
    
    // Parse cutoffs for this college
    let cutoffs = [];
    cutoffCats.forEach((cat, i) => {
      const rank = parseFloat(parts[i + 4]);
      if (!isNaN(rank) && rank > 0) {
        cutoffs.push({
          examType: 'NEET',
          branch: 'MBBS',
          category: cat,
          year: 2024,
          closingRank: rank
        });
      }
    });

    if (cutoffs.length === 0) continue; // Skip colleges with no data

    const existing = dbNamesNormalizedMap.get(normalize(name));

    if (existing) {
      // If it exists but has 0 cutoffs, update it
      if (!existing.cutoffs || existing.cutoffs.length === 0) {
        await College.updateOne(
          { _id: existing._id },
          { $set: { cutoffs, examTypes: Array.from(new Set([...(existing.examTypes || []), 'NEET'])) } }
        );
        updatedCount++;
      }
    } else {
      // Restore missing college
      const details = detailsMap.get(normalize(name)) || [];
      
      let baseCode = details[2] || name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
      let finalCode = baseCode;
      let suffix = 1;
      while (dbCodes.has(finalCode)) {
        finalCode = `${baseCode}-${suffix++}`;
      }
      dbCodes.add(finalCode);

      const college = new College({
        name,
        shortName: details[1] || name,
        code: finalCode,
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

  console.log(`Summary: Restored ${restoredCount} missing colleges, Updated ${updatedCount} colleges with new cutoffs.`);
  await mongoose.disconnect();
}
restore();
