import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

const collegeSchema = new mongoose.Schema({
    name: String,
    shortName: String,
    code: String,
}, { collection: 'colleges' });

const College = mongoose.model('College', collegeSchema);

async function removeDuplicate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Keeping ID: 69a50f31e46835cc867ae5ab (AIIMS, New Delhi)
        // Removing ID: 69a50fa1e46835cc867ae6bc (AIIMS New Delhi)
        const duplicateId = '69a50fa1e46835cc867ae6bc';
        
        const college = await College.findById(duplicateId);
        if (college) {
            console.log(`Found duplicate: ${college.name} (${college.code})`);
            
            const result = await College.findByIdAndDelete(duplicateId);
            if (result) {
                console.log('Successfully removed duplicate college.');
            } else {
                console.log('Failed to remove duplicate college.');
            }
        } else {
            console.log('Duplicate college not found by ID (already removed?).');
            
            // Check by name just in case
            const byName = await College.find({ name: 'AIIMS New Delhi' });
            if (byName.length > 0) {
                 console.log(`Found ${byName.length} variation(s) by name. Deleting them...`);
                 for (const c of byName) {
                     await College.findByIdAndDelete(c._id);
                     console.log(`Deleted ${c.name} (${c.code})`);
                 }
            } else {
                console.log('No more duplicates of "AIIMS New Delhi" found.');
            }
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

removeDuplicate();
