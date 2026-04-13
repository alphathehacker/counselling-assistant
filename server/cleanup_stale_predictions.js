import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const PredictionResult = mongoose.connection.db.collection('predictionresults');

        // Find all prediction results for School of Planning and Architecture that are for AP EAPCET
        const list = await PredictionResult.find({
            $or: [
                { collegeName: /School of Planning/i },
                { college: /School of Planning/i }
            ],
            examType: 'AP EAPCET'
        }).toArray();

        console.log(`Found ${list.length} stale AP EAPCET prediction results for SPA.`);

        for (const res of list) {
            console.log(`Deleting stale result: ${res._id} (${res.collegeName || res.college})`);
            await PredictionResult.deleteOne({ _id: res._id });
        }

        // Also check if there's any GGV stale results
        const ggvList = await PredictionResult.find({
            $or: [
                { collegeName: /Guru Ghasidas/i },
                { college: /Guru Ghasidas/i }
            ],
            examType: 'AP EAPCET'
        }).toArray();

        console.log(`Found ${ggvList.length} stale AP EAPCET prediction results for GGV.`);

        for (const res of ggvList) {
            console.log(`Deleting stale result: ${res._id} (${res.collegeName || res.college})`);
            await PredictionResult.deleteOne({ _id: res._id });
        }

        console.log('Cleanup complete.');
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

run();
