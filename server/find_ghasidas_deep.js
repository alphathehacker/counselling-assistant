import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

async function findInCollections() {
    try {
        await mongoose.connect(MONGODB_URI);
        const collections = ['csvdatas', 'predictionresults', 'exams'];
        
        for (const colName of collections) {
            const collection = mongoose.connection.db.collection(colName);
            const items = await collection.find({ 
                $or: [
                    { collegeName: { $regex: /Ghasidas/i } },
                    { name: { $regex: /Ghasidas/i } },
                    { college: { $regex: /Ghasidas/i } }
                ] 
            }).toArray();
            
            if (items.length > 0) {
                console.log(`Found ${items.length} records in ${colName}`);
                // Print the first one for sanity
                // console.log(items[0]);
            } else {
                console.log(`No records found in ${colName}`);
            }
        }
        
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

findInCollections();
