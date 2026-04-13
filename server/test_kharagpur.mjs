import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const collegeSchema = new mongoose.Schema({}, { strict: false });
const College = mongoose.models.College || mongoose.model('College', collegeSchema);

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const college = await College.findOne({ name: { $regex: /Kharagpur/i } });
    console.log(JSON.stringify(college, null, 2));
    mongoose.disconnect();
}
check();
