import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const apiKeys = [
    'dd0dd36d4e059b948ec8a534be439c50fec3bdabacee997518271f80429944a8',
    '9b02a21c80948384ffebc2aaf9717c696d0d68dbaad719fdb8e422f781a85e7f'
];
let currentKeyIndex = 0;

const searchCollegeImagesWeb = async (query) => {
    while (currentKeyIndex < apiKeys.length) {
        try {
            const serpApiKey = apiKeys[currentKeyIndex];
            const serpUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${serpApiKey}&safe=active`;
            const response = await axios.get(serpUrl, { timeout: 10000 });
            if (response.data && response.data.images_results && response.data.images_results.length > 0) {
                return response.data.images_results[0].original || response.data.images_results[0].link;
            }
            return null; // Return null if successful request but no images
        } catch (e) {
            const errorMsg = e.response?.data?.error || e.message;
            if (errorMsg.includes('run out of searches') || e.response?.status === 429) {
                console.log(`\nAPI Key ${currentKeyIndex + 1} exhausted. Switching to next key...`);
                currentKeyIndex++;
            } else {
                console.error("SerpAPI Error:", errorMsg);
                return null;
            }
        }
    }

    console.log("\nALL API KEYS EXHAUSTED!");
    return 'EXHAUSTED';
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({ name: String, location: Object, imageUrl: String, examTypes: Array }, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        // Fetch all colleges lacking images
        const collegesToUpdate = await College.find({
            isActive: true,
            $or: [{ imageUrl: null }, { imageUrl: { $exists: false } }]
        });

        console.log(`Found ${collegesToUpdate.length} total colleges across the DB without images.`);
        console.log(`We will process as many as we can using your remaining free SerpAPI credits!\n`);

        let updated = 0;

        for (const college of collegesToUpdate) {
            const locPart = typeof college.location === 'string' ? college.location : (college.location?.city || '');
            const query = `${college.name} ${locPart} campus building`.trim();

            console.log(`Searching: ${query}`);
            const imageUrl = await searchCollegeImagesWeb(query);

            if (imageUrl === 'EXHAUSTED') {
                break; // Stop completely if all keys run out
            }

            if (imageUrl) {
                college.imageUrl = imageUrl;
                await college.save();
                updated++;
                console.log(` ✓ Got image: ${imageUrl}`);
            } else {
                console.log(` ✗ Failed to get image for: ${college.name}`);
            }

            // Wait 1.5 seconds to avoid sudden rate limiting errors
            await new Promise(r => setTimeout(r, 1500));
        }

        console.log(`\n======================================`);
        console.log(`SUCCESS: Fetched and permanently saved ${updated} new college photos before hitting API constraints!`);
        console.log(`======================================\n`);

        mongoose.connection.close();
    } catch (e) {
        console.error("Script error:", e);
        mongoose.connection.close();
    }
});
