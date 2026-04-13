import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const reqHeaders = { 'User-Agent': 'AdmissionPredictor/1.0 (contact@admissionpredictor.com)' };

const searchWikipediaImageREST = async (query) => {
    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=1`;
        const searchResponse = await axios.get(searchUrl, { timeout: 10000, headers: reqHeaders });

        if (searchResponse.data.query.search.length > 0) {
            const title = searchResponse.data.query.search[0].title;

            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
            const summaryResponse = await axios.get(summaryUrl, { timeout: 10000, headers: reqHeaders });

            if (summaryResponse.data && summaryResponse.data.originalimage && summaryResponse.data.originalimage.source) {
                return summaryResponse.data.originalimage.source;
            }
        }
    } catch (e) {
        if (e.response?.status !== 404) {
            console.error("Wiki search failed for", query);
        }
    }
    return null;
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({ name: String, location: Object, imageUrl: String }, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        const collegesToUpdate = await College.find({
            isActive: true,
            $or: [{ imageUrl: null }, { imageUrl: { $exists: false } }]
        }).limit(200); // Only do 200 in this batch so it doesn't take hours

        console.log(`Pinging Wikipedia API for ${collegesToUpdate.length} colleges missing images...`);
        let updated = 0;

        for (const college of collegesToUpdate) {
            const query = `${college.name} college university india`.trim();
            // console.log(`Searching Wiki: ${query}`);
            const imageUrl = await searchWikipediaImageREST(query);

            if (imageUrl) {
                college.imageUrl = imageUrl;
                await college.save();
                updated++;
                console.log(` ✓ Got WIKI image for ${college.name}: ${imageUrl}`);
            }

            // Wait slightly to respect Wikipedia server etiquette
            await new Promise(r => setTimeout(r, 200));
        }

        console.log(`\n======================================`);
        console.log(`SUCCESS: Fetched and saved ${updated} new college photos from Wikipedia!`);
        console.log(`======================================\n`);

        mongoose.connection.close();
    } catch (e) {
        console.error("Script error:", e);
        mongoose.connection.close();
    }
});
