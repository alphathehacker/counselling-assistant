import mongoose from 'mongoose';
import dotenv from 'dotenv';
import College from './models/College.js';

dotenv.config({ path: './.env' });

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  const college = await College.findOne({ 'cutoffs.category': 'OC_BOYS' });
  if (college) {
    console.log('College:', college.name);
    console.log('Districts:', college.location.district);
    console.log('Specific Cutoff:', JSON.stringify(college.cutoffs.filter(c => c.category === 'OC_BOYS')[0], null, 2));
  } else {
    console.log('No college found with OC_BOYS');
  }
  process.exit(0);
}

debug();
