import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({}, { strict: false }));

const eapcetCsv = 'c:/Users/balak/OneDrive/Desktop/admission predictor/sample colleges.csv';
const ecetCsv = 'c:/Users/balak/OneDrive/Desktop/admission predictor/ap_ecet.csv';

const categories = [
  'OC_BOYS', 'OC_GIRLS', 'SC_BOYS', 'SC_GIRLS', 'ST_BOYS', 'ST_GIRLS',
  'BCA_BOYS', 'BCA_GIRLS', 'BCB_BOYS', 'BCB_GIRLS', 'BCC_BOYS', 'BCC_GIRLS',
  'BCD_BOYS', 'BCD_GIRLS', 'BCE_BOYS', 'BCE_GIRLS', 'OC_EWS_BOYS', 'OC_EWS_GIRLS'
];

function parseCutoffs(values, examType, branch) {
  return categories.map((cat, i) => {
    const rank = parseFloat(values[i + 5]);
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
  
  const missingColleges = [
    "AU COLLEGE OF ENGG.SCHOOL OF PHARMACY-SELF FINANCE",
    "CHAITANYA INST. OF SCI. AND TECHNOLOGY"
  ];

  for (const name of missingColleges) {
    let cutoffs = [];
    let branchesSet = new Set();
    
    // Read EAPCET from sample colleges.csv
    const eapcetLines = fs.readFileSync(eapcetCsv, 'utf8').split('\n');
    eapcetLines.forEach(line => {
      const parts = line.split(',');
      if (parts[0] === name) {
        const branch = parts[1];
        branchesSet.add(branch);
        cutoffs.push(...parseCutoffs(parts, 'AP EAPCET', branch));
      }
    });

    // Read ECET from ap_ecet.csv
    const ecetLines = fs.readFileSync(ecetCsv, 'utf8').split('\n');
    ecetLines.forEach(line => {
      const parts = line.split(',');
      if (parts[0] === name) {
        const branch = parts[1];
        branchesSet.add(branch);
        cutoffs.push(...parseCutoffs(parts, 'AP ECET', branch));
      }
    });

    if (cutoffs.length > 0) {
      const branches = Array.from(branchesSet).map(b => ({ name: b, code: b }));
      const college = new College({
        name,
        shortName: name === missingColleges[0] ? 'AU Pharmacy SF' : 'CIST Kakinada',
        location: {
          city: name === missingColleges[0] ? 'VSP' : 'EG',
          state: 'Andhra Pradesh',
          district: name === missingColleges[0] ? 'Visakhapatnam' : 'East Godavari'
        },
        collegeType: name === missingColleges[0] ? 'Government' : 'Private',
        examTypes: ['AP EAPCET', 'AP ECET'],
        cutoffs,
        branches,
        isActive: true
      });
      await college.save();
      console.log(`Restored: ${name} with ${cutoffs.length} cutoffs.`);
    } else {
      console.log(`No data found for: ${name}`);
    }
  }

  await mongoose.disconnect();
}
restore();
