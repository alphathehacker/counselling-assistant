import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({ name: String }, { strict: false }));

const csvPath = 'c:/Users/balak/OneDrive/Desktop/admission predictor/neet_master_cutoff_properly_mapped.csv';

function normalize(name) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const csvContent = fs.readFileSync(csvPath, 'utf8').split('\n');
  const headers = csvContent[0].split(',');
  const institutesInCsv = new Set(csvContent.slice(1).map(line => line.split(',')[0].trim()).filter(Boolean));
  
  console.log(`Unique Institutes in CSV: ${institutesInCsv.size}`);

  const dbColleges = await College.find({}).lean();
  const dbNamesNormalizedMap = new Map();
  dbColleges.forEach(c => {
    dbNamesNormalizedMap.set(normalize(c.name), c.name);
  });

  const missing = Array.from(institutesInCsv).filter(name => !dbNamesNormalizedMap.has(normalize(name)));
  
  console.log('--- MISSING NEET COLLEGES ---');
  console.log(JSON.stringify(missing, null, 2));
  console.log('Total Missing:', missing.length);

  await mongoose.disconnect();
}
run();
