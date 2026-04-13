/**
 * Script to fix the code field index in MongoDB
 * This drops the existing non-sparse unique index and allows mongoose to recreate it as sparse
 * 
 * Run this once: node server/scripts/fix-code-index.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

const fixIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('colleges');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Find the code_1 index (non-sparse unique index)
    const codeIndex = indexes.find(idx => idx.name === 'code_1');
    
    if (codeIndex) {
      console.log('Found code_1 index, dropping it...');
      await collection.dropIndex('code_1');
      console.log('✓ Dropped code_1 index');
    } else {
      console.log('No code_1 index found (may have been dropped already)');
    }

    // Mongoose will automatically recreate the index as sparse when the app starts
    // But we can manually create it here if needed
    console.log('\nIndex will be recreated automatically when the app restarts.');
    console.log('Or you can restart the Node.js server now to recreate it.');

    await mongoose.disconnect();
    console.log('\n✓ Done! You can now restart your server.');
  } catch (error) {
    console.error('Error fixing index:', error);
    process.exit(1);
  }
};

fixIndex();

