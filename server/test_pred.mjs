import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const predictionSchema = new mongoose.Schema({}, { strict: false });
const Prediction = mongoose.models.PredictionResult || mongoose.model('PredictionResult', predictionSchema);

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const p = await Prediction.findOne({});
    console.log(JSON.stringify(p?.results?.colleges?.slice(0, 1), null, 2));
    mongoose.disconnect();
}
check();
