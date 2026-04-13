import 'dotenv/config';
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const PredictionResult = mongoose.model('PredictionResult', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, isActive: Boolean }, { strict: false }));

    const userEmail = 'sankarkorlapati@gmail.com'; // User has 27 predictions actively
    // Assuming the user is this one, let's just count total active predictions for all users

    const activePredictions = await PredictionResult.find({ isActive: true }).sort({ createdAt: -1 }).lean();

    console.log(`Total Active Predictions: ${activePredictions.length}`);

    // Group by user
    const byUser = {};
    activePredictions.forEach(p => {
        const uid = p.user.toString();
        byUser[uid] = (byUser[uid] || 0) + 1;
    });
    console.log('Active predictions by user:', byUser);

    process.exit(0);
}).catch(console.error);
