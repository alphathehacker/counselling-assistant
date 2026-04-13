import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';
dotenv.config();

const reqHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' };

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

// Scrape DuckDuckGo HTML version for the first image thumbnail
const searchDuckDuckGoImage = async (query) => {
    try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await axios.get(ddgUrl, { timeout: 8000, headers: reqHeaders });

        const $ = cheerio.load(response.data);

        // Find external content images in results
        let imageUrl = null;
        $('img.result__icon__img').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src && src.includes('external-content')) {
                // duckduckgo proxy url looks like "//external-content.duckduckgo.com/iu/?u=URL&f=1"
                try {
                    const uParam = src.split('u=')[1].split('&')[0];
                    imageUrl = decodeURIComponent(uParam);
                    return false; // break loop
                } catch (e) { }
            }
        });

        return imageUrl;
    } catch (e) {
        // ignore
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
        });

        console.log(`Starting aggressive image scraping for ${collegesToUpdate.length} remaining colleges...`);
        let updated = 0;

        for (const college of collegesToUpdate) {
            const loc = college.location?.city || '';
            let imageUrl = null;

            // Strategy 1: Accurate Wikipedia Search
            // console.log(`Wiki: ${college.name}`);
            imageUrl = await searchWikipediaImageREST(college.name);

            if (!imageUrl) {
                // Strategy 2: DuckDuckGo scraping (College Name + Building/Campus)
                const ddgQuery = `${college.name} ${loc} campus building`.trim();
                // console.log(`DDG: ${ddgQuery}`);
                imageUrl = await searchDuckDuckGoImage(ddgQuery);
            }

            if (!imageUrl) {
                // Strategy 3: DuckDuckGo Logo scraping
                const ddgQueryLogo = `${college.name} logo`.trim();
                imageUrl = await searchDuckDuckGoImage(ddgQueryLogo);
            }

            if (imageUrl) {
                college.imageUrl = imageUrl;
                await college.save();
                updated++;
                console.log(`[${updated}] ✓ Found image for ${college.name}: ${imageUrl}`);
            } else {
                console.log(`[${updated}] ✗ Failed to find image for ${college.name}`);
            }

            // Wait to avoid rate limiting
            await new Promise(r => setTimeout(r, 600));
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
