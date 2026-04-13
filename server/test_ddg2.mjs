import axios from 'axios';
import * as cheerio from 'cheerio';

const reqHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

const test = async () => {
    try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('Stanford University campus building')}`;
        const response = await axios.get(ddgUrl, { timeout: 8000, headers: reqHeaders });

        const $ = cheerio.load(response.data);
        const imgs = [];
        $('img').each((i, elem) => {
            imgs.push($(elem).attr('src'));
        });

        console.log("Images found in HTML:");
        console.log(imgs.filter(s => s && s.includes('external-content')));

    } catch (e) {
        console.error(e.message);
    }
}

test();
