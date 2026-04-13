import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const College = mongoose.model('College', new mongoose.Schema({
            name: String,
            examTypes: [String],
            cutoffs: Array,
            location: Object
        }, { collection: 'colleges' }));

        // Find all colleges that have BOTH JEE Main AND AP EAPCET
        const list = await College.find({
            examTypes: { $all: ['JEE Main', 'AP EAPCET'] }
        });

        console.log(`Found ${list.length} colleges with conflicting JEE Main + AP EAPCET tags.`);

        for (const college of list) {
            // Keep both only if it's actually in Andhra Pradesh (sometimes NIT AP might have local state code)
            // But if it's in Delhi, Chhattisgarh, etc., it's definitely wrong.
            if (college.location?.state && college.location.state !== 'Andhra Pradesh') {
                console.log(`Cleaning ${college.name} (State: ${college.location.state})...`);
                college.examTypes = college.examTypes.filter(et => et !== 'AP EAPCET');
                college.cutoffs = college.cutoffs.filter(c => c.examType !== 'AP EAPCET');
                await college.save();
            } else {
                console.log(`Keeping ${college.name} (State: ${college.location.state || 'Unknown'}).`);
            }
        }

        console.log('Cleanup complete.');
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

run();
