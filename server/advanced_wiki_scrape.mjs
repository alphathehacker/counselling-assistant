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
        // ignore
    }
    return null;
}

const cleanCollegeName = (name) => {
    return name
        .replace(/Dr\.?\s*/g, '')
        .replace(/Sri\s+/g, '')
        .replace(/Smt\.?\s*/g, '')
        .replace(/Mahatma Gandhi/g, 'MG')
        .replace(/\(.*\)/g, '')
        .trim();
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({ name: String, location: Object, imageUrl: String }, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        const collegesToUpdate = await College.find({
            isActive: true,
            $or: [{ imageUrl: null }, { imageUrl: { $exists: false } }]
        });

        console.log(`Starting Advanced Wikipedia scraping for ${collegesToUpdate.length} remaining colleges...`);
        let updated = 0;

        for (const college of collegesToUpdate) {
            let imageUrl = null;
            const coreName = cleanCollegeName(college.name);
            const city = college.location?.city || '';
            const district = college.location?.district || '';

            const queriesToTry = [
                college.name, // 1: Exact Name
                `${coreName}`, // 2: Cleaned Name
                `${coreName} ${city}`, // 3: Cleaned Name + City
                `${college.name.split(' ').slice(0, 3).join(' ')} ${city}`, // 4: First 3 words + City
                `${city} medical college`, // 5: Fallback to general city medical college if it is one
                `${district} engineering college` // 6: Fallback to general district engineering college
            ];

            // Deduplicate queries
            const uniqueQueries = [...new Set(queriesToTry.filter(q => q && q.trim() !== ''))];

            for (const query of uniqueQueries) {
                if (!imageUrl) {
                    imageUrl = await searchWikipediaImageREST(query);
                }
            }

            if (imageUrl) {
                college.imageUrl = imageUrl;
                await college.save();
                updated++;
                console.log(`[${updated}] ✓ Found image for ${college.name} using Advanced Search: ${imageUrl}`);
            } else {
                console.log(`[${updated}] ✗ Failed entirely for ${college.name}`);
            }

            // Wait to avoid rate limiting
            await new Promise(r => setTimeout(r, 300));
        }

        console.log(`\n======================================`);
        console.log(`SUCCESS: Deep scraped and saved ${updated} new college photos!`);
        console.log(`======================================\n`);

        mongoose.connection.close();
    } catch (e) {
        console.error("Script error:", e);
        mongoose.connection.close();
    }
});
