import axios from 'axios';

const keys = [
    'dd0dd36d4e059b948ec8a534be439c50fec3bdabacee997518271f80429944a8',
    '9b02a21c80948384ffebc2aaf9717c696d0d68dbaad719fdb8e422f781a85e7f',
    '61f8763d21e5efeb5a79cab730f18b95f2df4bfb3823eff25360901af17c3af1',
    '0bf9ac496ce8843627cfaea7c4fd73f26b732b09d42eba45ff3c1ea20b1c57dc'
];

const testSerp = async () => {
    for (const key of keys) {
        try {
            const query = 'IIT Madras college';
            console.log("Testing API KEY:", key);
            const serpUrl = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${key}&safe=active`;
            const response = await axios.get(serpUrl, { timeout: 10000 });
            console.log(" -> SerpAPI Success! Retrieved", response.data.images_results?.length, "images");
            console.log(" -> This key works!");
        } catch (e) {
            console.log(" -> SerpAPI Failed:", e.response?.data?.error || e.message);
        }
    }
}
testSerp();
