import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function testApi() {
    try {
        const searchName = "Indian Institute of Technology Kharagpur";

        // Simulate the POST payload that predictionAPI.getCollegesByNames sends
        const response = await fetch('http://localhost:5000/api/prediction/colleges/details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collegeNames: [searchName] })
        });

        if (!response.ok) {
            console.log('HTTP error', response.status);
            return;
        }

        const responseData = await response.json();
        console.log("Success:", responseData.success);

        if (responseData.colleges && responseData.colleges[searchName]) {
            console.log('Found full details length:', JSON.stringify(responseData.colleges[searchName]).length);
            console.log('Established Year:', responseData.colleges[searchName].established);
            console.log('Campus Area:', responseData.colleges[searchName].campusArea);
        } else {
            console.log('College not found in map:', Object.keys(responseData.colleges || {}));
        }
    } catch (e) {
        console.error(e);
    }
}
testApi();
