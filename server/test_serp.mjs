import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const testSerp = async () => {
    try {
        const query = 'IIT Madras college';
        const apiKey = process.env.SERP_API_KEY;
        console.log("Using API KEY:", apiKey);
        const serpUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${apiKey}&safe=active`;
        const response = await axios.get(serpUrl, { timeout: 10000 });
        console.log("SerpAPI Success! Retrieved", response.data.images_results?.length, "images");
    } catch (e) {
        console.log("SerpAPI Failed:", e.response?.data || e.message);
    }
}
testSerp();
