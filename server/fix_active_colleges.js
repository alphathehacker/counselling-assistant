import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

async function fix() {
    try {
        await mongoose.connect(MONGODB_URI);
        const result = await mongoose.connection.db.collection('colleges').updateMany(
            { isActive: { $ne: true } },
            { $set: { isActive: true } }
        );
        console.log(`Updated ${result.modifiedCount} colleges to isActive: true`);
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

fix();
