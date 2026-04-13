import 'dotenv/config';
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const PredictionResult = mongoose.model('PredictionResult', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, isActive: Boolean }, { strict: false }));

    const activePredictions = await PredictionResult.find({ isActive: true }).sort({ createdAt: -1 });
    let count = 0;

    // Wipe all but the most recent 3 predictions for every user to clean up their DB test data
    const userCounts = {};
    for (const p of activePredictions) {
        const uid = p.user.toString();
        userCounts[uid] = (userCounts[uid] || 0) + 1;
        if (userCounts[uid] > 3) {
            p.isActive = false;
            await p.save();
            count++;
        }
    }

    console.log(`Soft deleted ${count} older predictions to clean up test data.`);
    process.exit(0);
}).catch(console.error);
