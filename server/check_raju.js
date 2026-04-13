import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const College = mongoose.model('College', new mongoose.Schema({}, { strict: false }));

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const cols = await College.find({ 
    $or: [
      { name: /RAJU INSTITUTE/i },
      { name: /N S RAJU/i },
      { name: /NADIMPALLI/i }
    ]
  }).lean();
  
  console.log('--- FOUND COLLEGES ---');
  cols.forEach(cl => {
    console.log(`- ID: ${cl._id}, Name: ${cl.name}, Code: ${cl.code}, Cutoffs: ${(cl.cutoffs || []).length}`);
  });
  
  await mongoose.disconnect();
}
check();
