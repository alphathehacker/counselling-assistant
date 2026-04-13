import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

async function removeAkulaFromCSV() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all CSVData documents that contain Akula
    const csvDatas = await mongoose.connection.collection('csvdatas').find({
      csvContent: { $regex: /Akula/i }
    }).toArray();
    
    console.log(`Found ${csvDatas.length} documents containing Akula.`);

    for (const doc of csvDatas) {
      const originalContent = doc.csvContent;
      
      // Split by newline, filter out rows containing Akula, rejoin by newline
      const lines = originalContent.split(/\r?\n/);
      const filteredLines = lines.filter(line => !/Akula/i.test(line));
      
      const newContent = filteredLines.join('\n');
      
      // Update the document
      await mongoose.connection.collection('csvdatas').updateOne(
        { _id: doc._id },
        { $set: { csvContent: newContent } }
      );
      
      const removedCount = lines.length - filteredLines.length;
      console.log(`Removed ${removedCount} rows from CSVData Document [${doc.examType} - ${doc.category} - ${doc.gender}]`);
    }
    
    console.log('Successfully purged Akula Sreeramulu from all raw cutoff datasets.');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

removeAkulaFromCSV();
