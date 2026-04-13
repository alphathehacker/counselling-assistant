import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({ name: String, examTypes: [String], isActive: Boolean }, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        const counts = {
            'JEE Main': await College.countDocuments({ isActive: true, examTypes: { $in: ['JEE Main'] } }),
            'JEE Advanced': await College.countDocuments({ isActive: true, examTypes: { $in: ['JEE Advanced'] } })
        };

        console.log("Database direct counts:");
        console.log(JSON.stringify(counts, null, 2));

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
});
