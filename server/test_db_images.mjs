import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({}, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        const c1 = await College.findOne({ image: { $exists: true, $ne: null } });
        const c2 = await College.findOne({ imageUrl: { $exists: true, $ne: null } });
        const c3 = await College.findOne({ coverImage: { $exists: true, $ne: null } });
        const c4 = await College.findOne({ logo: { $exists: true, $ne: null } });

        console.log("image exists:", c1 ? 'yes' : 'no', c1 ? c1.image : '');
        console.log("imageUrl exists:", c2 ? 'yes' : 'no', c2 ? c2.imageUrl : '');
        console.log("coverImage exists:", c3 ? 'yes' : 'no', c3 ? c3.coverImage : '');
        console.log("logo exists:", c4 ? 'yes' : 'no', c4 ? c4.logo : '');

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
});
