import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

async function findInCollections() {
    try {
        await mongoose.connect(MONGODB_URI);
        const colNames = await mongoose.connection.db.listCollections().toArray();
        
        for (const col of colNames) {
            const colName = col.name;
            const collection = mongoose.connection.db.collection(colName);
            const count = await collection.countDocuments({ 
                $or: [
                    { collegeName: { $regex: /Bilaspur/i } },
                    { name: { $regex: /Bilaspur/i } },
                    { college: { $regex: /Bilaspur/i } },
                    { "location.city": { $regex: /Bilaspur/i } }
                ] 
            });
            
            if (count > 0) {
                console.log(`Found ${count} records in ${colName}`);
                if (colName === 'colleges') {
                    const items = await collection.find({ $or: [{ name: /Bilaspur/i }, { "location.city": /Bilaspur/i }] }).toArray();
                    items.forEach(c => console.log(`  - ${c.name} (${c.location?.city})`));
                }
            }
        }
        
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

findInCollections();
