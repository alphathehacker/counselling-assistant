import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({}, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        const countUrl = await College.countDocuments({ imageUrl: { $exists: true, $ne: null } });
        const totalCounts = await College.countDocuments({});

        console.log("Colleges with imageUrl:", countUrl);
        console.log("Total colleges:", totalCounts);

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
});
