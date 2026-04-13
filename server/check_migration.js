import mongoose from 'mongoose';
import dotenv from 'dotenv';
import College from './models/College.js';

dotenv.config({ path: './.env' });

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const withCutoffs = await College.countDocuments({ 'cutoffs.0': { $exists: true } });
    const withBranches = await College.countDocuments({ 'branches.0': { $exists: true } });
    console.log(`Colleges with cutoffs: ${withCutoffs}`);
    console.log(`Colleges with branches: ${withBranches}`);
    
    const apEapcetColleges = await College.find({ 'cutoffs.examType': 'AP EAPCET' }).limit(1).select('name cutoffs');
    if (apEapcetColleges.length > 0) {
        console.log('\n--- AP EAPCET Sample ---');
        console.log('College:', apEapcetColleges[0].name);
        console.log('Sample Cutoffs:', JSON.stringify(apEapcetColleges[0].cutoffs.slice(0, 5), null, 2));
    }

    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
