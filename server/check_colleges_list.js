import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({}, { strict: false }));

const names = [
  'BONAM VENKATA CHALAMAIAH INST. OF TECH AND SCI.',
  'BRINDAVAN INST OF TECHNOLOGY AND SCI',
  'BVC COLLEGE OF ENGINEERING',
];

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const name of names) {
    const col = await College.findOne({ name }).lean();
    if (col) {
      console.log(`FOUND | "${col.name}" | cutoffs: ${(col.cutoffs||[]).length} | city: ${col.location?.city} | district: ${col.location?.district}`);
    } else {
      console.log(`NOT FOUND | "${name}"`);
    }
  }
  await mongoose.disconnect();
}
check();
