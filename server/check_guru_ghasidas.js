import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

const collegeSchema = new mongoose.Schema({
    name: String,
    code: String,
    examTypes: [String],
    location: {
        city: String,
        state: String
    }
}, { collection: 'colleges' });

const College = mongoose.model('College', collegeSchema);

async function checkCollege() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Broader search
        const colleges = await College.find({
            $or: [
                { name: { $regex: /Bilaspur/i } },
                { "location.city": { $regex: /Bilaspur/i } }
            ]
        });

        console.log(`Found ${colleges.length} matches for "Bilaspur":`);
        colleges.forEach(c => {
            console.log(`- ${c.name} (${c.location?.city || 'N/A'}, ${c.location?.state || 'N/A'}) - Exams: ${c.examTypes.join(', ')}`);
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkCollege();
