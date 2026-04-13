import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({ name: String, location: Object, imageUrl: String }, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        const predictionResultSchema = new mongoose.Schema({ predictions: Array }, { strict: false });
        const PredictionResult = mongoose.model('PredictionResult', predictionResultSchema);

        console.log("Analyzing PredictionResults for image URLs...");

        let collegesUpdated = 0;
        let imagesFound = new Map(); // Store by college name mapping to URL

        // Find all prediction results that have at least one prediction with an image URL
        const results = await PredictionResult.find({
            'predictions.imageUrl': { $exists: true, $ne: null }
        });

        console.log(`Found ${results.length} historical prediction sets with images.`);

        for (const result of results) {
            if (!result.predictions) continue;

            for (const prediction of result.predictions) {
                if (prediction.imageUrl && prediction.collegeName) {

                    // The CSV re-uploads generated new _ids, so we MUST match by name.
                    const key = prediction.collegeName.trim();

                    if (!imagesFound.has(key)) {
                        imagesFound.set(key, {
                            url: prediction.imageUrl,
                            name: key
                        });
                    }
                }
            }
        }

        console.log(`Discovered ${imagesFound.size} unique colleges with images from history.`);
        console.log("Beginning backup to main Colleges collection...");

        for (const [key, data] of imagesFound) {
            // Because names can have slight differences, try exact match first
            let college = await College.findOne({
                name: { $regex: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') }
            });

            if (college) {
                // Assign image if it doesnt have one
                if (!college.imageUrl) {
                    college.imageUrl = data.url;
                    await college.save();
                    collegesUpdated++;
                    // console.log(`✓ Restored image for: ${data.name}`);
                }
            } else {
                // Trying a loose contains match
                college = await College.findOne({
                    name: { $regex: new RegExp(data.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'i') }
                });
                if (college && !college.imageUrl) {
                    college.imageUrl = data.url;
                    await college.save();
                    collegesUpdated++;
                    // console.log(`✓ Restored loosely for: ${data.name} -> DB: ${college.name}`);
                }
            }
        }

        console.log(`\n======================================`);
        console.log(`SUCCESS: Successfully backed up and restored ${collegesUpdated} college images!`);
        console.log(`======================================\n`);

        mongoose.connection.close();
    } catch (e) {
        console.error("Error migrating images:", e);
        mongoose.connection.close();
    }
});
