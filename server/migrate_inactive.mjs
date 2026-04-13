import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({ name: String, location: Object, imageUrl: String, isActive: Boolean }, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        const inactiveCollegesWithImages = await College.find({ isActive: false, imageUrl: { $exists: true, $ne: null, $ne: '' } });

        console.log(`Found ${inactiveCollegesWithImages.length} inactive colleges with images.`);

        let restored = 0;

        for (const c of inactiveCollegesWithImages) {
            // Find an active college without an image that matches the same name
            const activeMatch = await College.findOne({
                name: c.name,
                isActive: true,
                $or: [{ imageUrl: null }, { imageUrl: { $exists: false } }]
            });

            if (activeMatch) {
                activeMatch.imageUrl = c.imageUrl;
                await activeMatch.save();
                restored++;
            }
        }

        console.log(`Successfully migrated ${restored} images from inactive to active colleges.`);

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
});
