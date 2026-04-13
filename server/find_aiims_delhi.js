import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

// Use a schema that includes name, location and other details
const collegeSchema = new mongoose.Schema({
    name: String,
    shortName: String,
    code: String,
    location: {
        city: String,
        state: String,
        district: String
    },
    examTypes: [String]
}, { collection: 'colleges' });

const College = mongoose.model('College', collegeSchema);

async function findAIIMS() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Search for anything with AIIMS or New Delhi
        const colleges = await College.find({
            $or: [
                { name: { $regex: /AIIMS/i } },
                { name: { $regex: /All India Institute/i } },
                { "location.city": { $regex: /Delhi/i } }
            ]
        });

        console.log(`Found ${colleges.length} potential matches:\n`);
        colleges.forEach(c => {
            console.log(`ID: ${c._id}`);
            console.log(`Name: ${c.name}`);
            console.log(`Short Name: ${c.shortName}`);
            console.log(`Code: ${c.code}`);
            console.log(`Location: ${c.location?.city || 'N/A'}, ${c.location?.state || 'N/A'}`);
            console.log(`Exam Types: ${c.examTypes.join(', ')}`);
            console.log('-------------------');
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

findAIIMS();
