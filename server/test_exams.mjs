import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({ name: String, examTypes: [String] }, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        const exams = ['AP EAPCET', 'AP ECET', 'NEET', 'JEE Main', 'JEE Advanced'];

        for (const exam of exams) {
            const count = await College.countDocuments({ examTypes: { $in: [exam] } });
            console.log(`${exam} matches: ${count}`);
        }

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
});
