import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const bookmarkSchema = new mongoose.Schema({}, { strict: false });
const Bookmark = mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const bs = await Bookmark.find({}).limit(2);
    console.log(JSON.stringify(bs, null, 2));
    mongoose.disconnect();
}
check();
