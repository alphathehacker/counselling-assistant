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

        // Find all colleges that HAVE AP EAPCET but are also known National Institutes
        const list = await College.find({
            examTypes: 'AP EAPCET',
            $or: [
                { name: /NIT/i },
                { name: /IIIT/i },
                { name: /SPA/i },
                { name: /School of Planning/i },
                { name: /National Institute of Technology/i },
                { name: /Indian Institute of Information/i },
                { name: /GFTI/i },
                { name: /BIT/i }
            ]
        });

        console.log(`Found ${list.length} national institutes with AP EAPCET tag.`);

        for (const college of list) {
            // If it's NOT in Andhra Pradesh, it shouldn't have AP EAPCET
            if (college.location?.state && college.location.state !== 'Andhra Pradesh') {
                console.log(`Cleaning ${college.name} (State: ${college.location.state})...`);
                college.examTypes = college.examTypes.filter(et => et !== 'AP EAPCET');
                college.cutoffs = college.cutoffs.filter(c => c.examType !== 'AP EAPCET');
                await college.save();
            }
        }

        console.log('Cleanup complete.');
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

run();
