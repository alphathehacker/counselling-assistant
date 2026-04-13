import mongoose from 'mongoose';
import dotenv from 'dotenv';
import College from '../models/College.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Simple string similarity (Levenshtein distance based)
const similarity = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  // Check if one contains the other
  if (longer.includes(shorter)) return 0.8;
  
  // Simple word-based similarity
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  const similarityScore = (commonWords.length * 2) / (words1.length + words2.length);
  
  return similarityScore;
};

const checkNearDuplicates = async () => {
  try {
    await connectDB();

    const neetColleges = await College.find({
      $or: [
        { examTypes: 'NEET' },
        { 'cutoffs.examType': 'NEET' }
      ]
    }).select('name location cutoffs createdAt _id');

    console.log(`\nChecking ${neetColleges.length} NEET colleges for near-duplicates...\n`);

    const potentialDuplicates = [];
    
    // Compare each college with every other college
    for (let i = 0; i < neetColleges.length; i++) {
      for (let j = i + 1; j < neetColleges.length; j++) {
        const college1 = neetColleges[i];
        const college2 = neetColleges[j];
        
        const name1 = college1.name.trim();
        const name2 = college2.name.trim();
        const state1 = college1.location?.state || '';
        const state2 = college2.location?.state || '';
        
        // Check if same state
        if (state1 && state2 && state1 === state2) {
          const sim = similarity(name1, name2);
          
          // If similarity is high (>= 0.7), consider them potential duplicates
          if (sim >= 0.7) {
            potentialDuplicates.push({
              college1: { id: college1._id, name: name1, state: state1, createdAt: college1.createdAt },
              college2: { id: college2._id, name: name2, state: state2, createdAt: college2.createdAt },
              similarity: sim
            });
          }
        }
      }
    }

    if (potentialDuplicates.length === 0) {
      console.log('✅ No near-duplicates found!');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`\nFound ${potentialDuplicates.length} potential near-duplicates:\n`);
    
    for (const dup of potentialDuplicates.sort((a, b) => b.similarity - a.similarity)) {
      console.log(`Similarity: ${(dup.similarity * 100).toFixed(1)}%`);
      console.log(`  1. ${dup.college1.name} (${dup.college1.state}) - ID: ${dup.college1.id}`);
      console.log(`  2. ${dup.college2.name} (${dup.college2.state}) - ID: ${dup.college2.id}`);
      console.log('');
    }

    console.log('\n⚠️  Review these manually to determine if they are actual duplicates.');
    console.log('If they are duplicates, you can remove them using the MongoDB _id.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error checking near-duplicates:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

checkNearDuplicates();

