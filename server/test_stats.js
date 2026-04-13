import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const users = await User.find({}, 'name email statistics').lean();

    const PredictionResult = mongoose.model('PredictionResult', new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, isActive: Boolean }, { strict: false }));

    for (const user of users) {
        const totalPredictions = await PredictionResult.countDocuments({ user: user._id, isActive: true });
        console.log(`User ${user.email} -> totalPredictions in DB: ${user.statistics?.totalPredictions}, counted from DB explicitly: ${totalPredictions}`);
    }

    process.exit(0);
}).catch(console.error);
