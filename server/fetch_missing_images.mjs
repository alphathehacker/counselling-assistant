import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const searchCollegeImagesWeb = async (query) => {
    try {
        const serpApiKey = process.env.SERP_API_KEY;
        const serpUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&safe=active`;
        const response = await axios.get(serpUrl, { timeout: 10000 });
        if (response.data && response.data.images_results && response.data.images_results.length > 0) {
            return response.data.images_results[0].original || response.data.images_results[0].link;
        }
    } catch (e) {
        console.error("SerpAPI Error:", e.response?.data?.error || e.message);
    }
    return null;
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({ name: String, location: Object, imageUrl: String, examTypes: Array }, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        // Prioritize JEE colleges that don't have images
        const collegesToUpdate = await College.find({
            isActive: true,
            $or: [{ imageUrl: null }, { imageUrl: { $exists: false } }],
            $or: [{ examTypes: 'JEE Main' }, { examTypes: 'JEE Advanced' }]
        }).limit(60); // fetch up to 60 to avoid hitting the 100 max SerpAPI quota quickly

        console.log(`Found ${collegesToUpdate.length} JEE colleges without images. Fetching...`);
        let updated = 0;

        for (const college of collegesToUpdate) {
            const locPart = typeof college.location === 'string' ? college.location : (college.location?.city || '');
            const query = `${college.name} ${locPart} campus building`.trim();

            console.log(`Searching: ${query}`);
            const imageUrl = await searchCollegeImagesWeb(query);

            if (imageUrl) {
                college.imageUrl = imageUrl;
                await college.save();
                updated++;
                console.log(` ✓ Got image: ${imageUrl}`);
            } else {
                console.log(` ✗ Failed to get image for: ${college.name}`);
            }

            // Wait 1 second to avoid rate limiting
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log(`\n======================================`);
        console.log(`SUCCESS: Fetched and updated ${updated} new college images!`);
        console.log(`======================================\n`);

        mongoose.connection.close();
    } catch (e) {
        console.error(e);
        mongoose.connection.close();
    }
});
