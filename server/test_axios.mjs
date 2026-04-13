import axios from 'axios';

async function test() {
    try {
        const searchName = "Indian Institute of Technology Kharagpur";

        const response = await axios.post('http://localhost:5000/api/prediction/colleges/details', {
            collegeNames: [searchName]
        });

        const fullDetails = response?.data?.colleges?.[searchName] || Object.values(response?.data?.colleges || {})[0] || {};

        console.log("Keys in full details:", Object.keys(fullDetails).length);
        console.log("Established:", fullDetails.established);
    } catch (e) {
        console.error(e.message);
    }
}
test();
