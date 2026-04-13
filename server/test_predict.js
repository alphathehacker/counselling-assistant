import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

const collegeSchema = new mongoose.Schema({
    name: String,
    code: String,
    isActive: Boolean
}, { collection: 'colleges' });

const College = mongoose.model('College', collegeSchema);

async function testPredictionMapping() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Load mapping
        let mapping = {};
        const mappingPath = path.join(__dirname, 'college_mapping.json');
        if (fs.existsSync(mappingPath)) {
            mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
            console.log(`Loaded mapping with ${Object.keys(mapping).length} entries`);
        }

        // Simulate prediction output
        const predictions = [
            { name: "ANIL NEERUKONDA INSTITUTE OF TECHNOLOGY AND SCI", district: "VSP" },
        ];

        for (const pred of predictions) {
            console.log(`\nTesting CSV Name: "${pred.name}"`);
            const csvNameLower = pred.name.toLowerCase().trim();
            const mappedAdminName = mapping[csvNameLower];
            
            console.log(`  -> Mapped Admin Name: "${mappedAdminName}"`);
            
            let college = null;
            if (mappedAdminName) {
                college = await College.findOne({ name: mappedAdminName }).lean();
                if (!college) {
                    college = await College.findOne({ 
                        name: { $regex: new RegExp('^' + mappedAdminName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } 
                    }).lean();
                }
            }
            
            if (college) {
                console.log(`  [SUCCESS] Found corresponding DB record: "${college.name}" (ID: ${college._id})`);
            } else {
                console.log(`  [FAILED] Could not find DB record for "${mappedAdminName}"`);
            }
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testPredictionMapping();
