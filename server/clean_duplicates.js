import 'dotenv/config';
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const PredictionResult = mongoose.model('PredictionResult', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, predictionParams: Object, isActive: Boolean }, { strict: false }));

    const activePredictions = await PredictionResult.find({ isActive: true }).sort({ createdAt: -1 });
    console.log(`Initial active: ${activePredictions.length}`);

    const seen = new Set();
    let deletedCount = 0;

    for (const p of activePredictions) {
        // Determine uniqueness by user + params stringified
        const key = `${p.user}_${JSON.stringify(p.predictionParams)}`;
        if (seen.has(key)) {
            p.isActive = false;
            await p.save();
            deletedCount++;
        } else {
            seen.add(key);
        }
    }

    console.log(`Soft deleted ${deletedCount} identical duplicate predictions.`);
    process.exit(0);
}).catch(console.error);
