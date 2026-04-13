import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const resultSchema = new mongoose.Schema({}, { strict: false });
        const PredictionResult = mongoose.model('PredictionResult', resultSchema);

        const recent = await PredictionResult.findOne({ 'predictions.imageUrl': { $exists: true, $ne: null } });

        if (recent && recent.predictions && recent.predictions.length > 0) {
            console.log("Found prediction result with images!");
            const withImage = recent.predictions.filter(p => p.imageUrl);
            console.log(`It has ${withImage.length} predictions with images.`);
            console.log("First image URL:", withImage[0].imageUrl);
        } else {
            console.log("No prediction results have images saved.");
        }

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
});
