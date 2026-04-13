import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';
const COLLEGE_NAME = 'School of Studies of Engineering and Technology, Guru Ghasidas Vishwavidyalaya, Bilaspur';

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const College = mongoose.model('College', new mongoose.Schema({
            name: String,
            examTypes: [String],
            cutoffs: Array,
            location: Object
        }, { collection: 'colleges' }));

        const college = await College.findOne({ name: COLLEGE_NAME });
        if (!college) {
            console.error('College not found in DB!');
        } else {
            // 1. Remove AP EAPCET from examTypes
            college.examTypes = college.examTypes.filter(et => et !== 'AP EAPCET');
            
            // 2. Remove AP EAPCET cutoffs
            college.cutoffs = college.cutoffs.filter(c => c.examType !== 'AP EAPCET');
            
            // 3. Fix location state (Bilaspur is in Chhattisgarh)
            if (college.location) {
                college.location.state = 'Chhattisgarh';
            }
            
            await college.save();
            console.log(`Successfully fixed metadata for ${COLLEGE_NAME}`);
            console.log('Fixed State: Chhattisgarh');
            console.log('Removed AP EAPCET from examTypes and cutoffs.');
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

run();
