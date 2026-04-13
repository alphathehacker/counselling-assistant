import mongoose from 'mongoose';
import dotenv from 'dotenv';
import College from './models/College.js';

dotenv.config({ path: './.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const colleges = await College.find({ examTypes: { $in: ['AP EAPCET', 'AP ECET'] } }).select('name code examTypes cutoffs');
  console.log('Total AP Exam Colleges:', colleges.length);
  
  const nullCodes = colleges.filter(c => !c.code).length;
  console.log('Colleges with NULL code:', nullCodes);
  
  const noCutoffs = colleges.filter(c => !c.cutoffs || c.cutoffs.length === 0).length;
  console.log('Colleges with NO cutoffs:', noCutoffs);
  
  const normalize = (n) => n.toLowerCase().replace(/[^a-z0-9]/g, '');

  const normalizedMap = new Map();
  colleges.forEach(c => {
     const kn = normalize(c.name);
     if (!normalizedMap.has(kn)) normalizedMap.set(kn, []);
     normalizedMap.get(kn).push(c);
  });
  console.log('Distinct normalized names:', normalizedMap.size);

  // Group by code
  const codeMap = new Map();
  colleges.forEach(c => {
     if (c.code) {
        const n = c.code.toLowerCase().trim();
        if (!codeMap.has(n)) codeMap.set(n, []);
        codeMap.get(n).push(c);
     }
  });
  console.log('Distinct college codes:', codeMap.size);
  console.log('Sample codes:', [...codeMap.keys()].slice(0, 20).join(', '));


  process.exit(0);
}

check();
