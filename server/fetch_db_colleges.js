const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

const collegeSchema = new mongoose.Schema({
    name: String,
    examTypes: [String]
}, { collection: 'colleges' });

const College = mongoose.model('College', collegeSchema);

async function getUpdatedCollegeList() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const ecetColleges = await College.find({ examTypes: 'AP ECET' }, 'name').sort({ name: 1 });
        const eapcetColleges = await College.find({ examTypes: 'AP EAPCET' }, 'name').sort({ name: 1 });

        console.log('--- DB: AP ECET COLLEGES ---');
        ecetColleges.forEach(c => console.log(c.name));

        console.log('\n--- DB: AP EAPCET COLLEGES ---');
        eapcetColleges.forEach(c => console.log(c.name));

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

getUpdatedCollegeList();
