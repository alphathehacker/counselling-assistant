import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({ name: String, location: Object, imageUrl: String }, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        const userSchema = new mongoose.Schema({ bookmarks: Array }, { strict: false });
        const User = mongoose.model('User', userSchema);

        console.log("Analyzing User Bookmarks for image URLs...");

        let collegesUpdated = 0;
        let imagesFound = new Map();

        const users = await User.find({ 'bookmarks': { $exists: true, $not: { $size: 0 } } });

        for (const user of users) {
            if (!user.bookmarks) continue;

            for (const b of user.bookmarks) {
                // Bookmarks store some predictionData which could contain an image URL
                if (b.predictionData && b.predictionData.imageUrl && b.collegeName) {
                    const key = b.collegeName.trim();
                    if (!imagesFound.has(key)) {
                        imagesFound.set(key, { url: b.predictionData.imageUrl, name: key });
                    }
                } else if (b.imageUrl && b.collegeName) {
                    const key = b.collegeName.trim();
                    if (!imagesFound.has(key)) {
                        imagesFound.set(key, { url: b.imageUrl, name: key });
                    }
                }
            }
        }

        console.log(`Discovered ${imagesFound.size} images from User bookmarks.`);

        for (const [key, data] of imagesFound) {
            let college = await College.findOne({
                name: { $regex: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i') }
            });

            if (college) {
                if (!college.imageUrl) {
                    college.imageUrl = data.url;
                    await college.save();
                    collegesUpdated++;
                }
            } else {
                college = await College.findOne({
                    name: { $regex: new RegExp(data.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'i') }
                });
                if (college && !college.imageUrl) {
                    college.imageUrl = data.url;
                    await college.save();
                    collegesUpdated++;
                }
            }
        }

        console.log(`SUCCESS: Restored ${collegesUpdated} college images from bookmarks!`);

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
});
