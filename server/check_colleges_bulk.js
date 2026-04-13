import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({}, { strict: false }));

const names = [
  'CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT',
  'CHAITANYA BHARATHI INSTITUTE OF TECHNOLOGY',
  'CHAITANYA INST. OF SCI. AND TECHNOLOGY',
  'CHALAPATHI INST OF ENGG AND TECHNOLOGY',
  'CHALAPATHI INST OF TECHNOLOGY',
  'CHALAPATHI INSTITUTE OF PHARMACEUTICAL SCI.',
  'CHIRANJEEVI REDDY INST OF ENGG AND TECHNOLOGY FOR WOMEN',
  'COLLEGE OF AGRICULTURAL ENGINEERING',
  'COLLEGE OF ENGINEERING BR AMBEDKAR UNIV SELF FINANCE',
];

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const name of names) {
    const col = await College.findOne({ name: new RegExp(name.split(' ').join('.*'), 'i') }).lean();
    if (col) {
      console.log(`FOUND | "${col.name}" | cutoffs: ${(col.cutoffs||[]).length} | city: ${col.location?.city} | district: ${col.location?.district}`);
    } else {
      console.log(`NOT FOUND | "${name}"`);
    }
  }
  await mongoose.disconnect();
}
check();
