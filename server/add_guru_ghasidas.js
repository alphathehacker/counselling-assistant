import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

const collegeSchema = new mongoose.Schema({
    name: String,
    shortName: String,
    code: String,
    collegeType: String,
    examTypes: [String],
    location: {
        city: String,
        state: String,
        district: String,
        pincode: String,
        address: String
    },
    establishedYear: Number,
    affiliation: String,
    website: String,
    phone: String,
    email: String,
    facilities: [String]
}, { collection: 'colleges' });

const College = mongoose.model('College', collegeSchema);

async function addCollege() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const newCollege = new College({
            name: "School of Studies of Engineering and Technology, Guru Ghasidas Vishwavidyalaya, Bilaspur",
            shortName: "SoS E&T Guru Ghasidas",
            code: "GGV-BIL",
            collegeType: "Government (GFTI)",
            examTypes: ["JEE Main"],
            location: {
                city: "Bilaspur",
                state: "Chhattisgarh",
                district: "Bilaspur",
                pincode: "495009",
                address: "Guru Ghasidas Vishwavidyalaya, Koni, Bilaspur, Chhattisgarh 495009"
            },
            establishedYear: 1997,
            affiliation: "Central University",
            website: "https://www.ggu.ac.in",
            phone: "07752-260007",
            email: "centraluniv@ggu.ac.in",
            facilities: ["Hostel", "Library", "Laboratories", "WiFi", "Sports", "Cafeteria"]
        });

        const saved = await newCollege.save();
        console.log('Success! College added with ID:', saved._id);

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error adding college:', err);
    }
}

addCollege();
