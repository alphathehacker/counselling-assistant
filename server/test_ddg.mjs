import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';
dotenv.config();

const reqHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const searchDuckDuckGoImage = async (query) => {
    try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await axios.get(ddgUrl, { timeout: 8000, headers: reqHeaders });

        const $ = cheerio.load(response.data);

        // Find external content images in results
        let imageUrl = null;
        // DuckDuckGo HTML version puts images in .result__thumbnail img
        $('.result__thumbnail img').each((i, elem) => {
            let src = $(elem).attr('src');
            if (src && src.startsWith('//')) {
                src = 'https:' + src;
            }
            if (src && src.includes('external-content')) {
                try {
                    // Try to extract original URL if present
                    const urlObj = new URL(src.startsWith('http') ? src : `https:${src}`);
                    const originalImageUrl = urlObj.searchParams.get('u');
                    if (originalImageUrl) {
                        imageUrl = decodeURIComponent(originalImageUrl);
                        return false; // break loop
                    }
                } catch (e) { }

                // fallback to the proxy URL
                if (!imageUrl) {
                    imageUrl = src;
                    return false;
                }
            }
        });

        return imageUrl;
    } catch (e) {
        // ignore
    }
    return null;
}

const test = async () => {
    console.log("Testing DDG HTML Image Scraping...");
    let url = await searchDuckDuckGoImage("Stanford University campus building");
    console.log("Stanford:", url);

    url = await searchDuckDuckGoImage("Grant Medical College campus building");
    console.log("Grant Med:", url);
}

test();
