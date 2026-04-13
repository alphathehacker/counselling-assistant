import axios from 'axios';

(async () => {
    try {
        const res = await axios.get('http://localhost:5000/api/prediction/colleges', {
            params: {
                examType: 'AP ECET',
                limit: 1000,
                page: 1
            },
            headers: {
                // Need to skip auth if it's not protected, but wait, the endpoint '/api/prediction/colleges' is protected
                // Let's just create a token or bypass it
            }
        });
        console.log('Success:', res.data.colleges.length);
    } catch (e) {
        console.error('API Error:', e.response ? e.response.status : e.message);
    }
})();
