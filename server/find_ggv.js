import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

async function findGGV() {
    try {
        await mongoose.connect(MONGODB_URI);
        const col = mongoose.connection.db.collection('colleges');
        const list = await col.find({ 
            $or: [
                { name: { $regex: /GGV/i } },
                { shortName: { $regex: /GGV/i } }
            ] 
        }).toArray();
        console.log(list.map(c => c.name));
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

findGGV();
