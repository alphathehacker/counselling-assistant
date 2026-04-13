import axios from 'axios';

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
        console.error("Wiki search failed:", e.message);
    }
    return null;
}

const test = async () => {
    const url = await searchWikipediaImageREST("Indian Institute of Technology Madras"); // IIT Madras
    console.log("IIT Madras URL:", url);

    const url2 = await searchWikipediaImageREST("Andhra University");
    console.log("Andhra University URL:", url2);
}

test();
