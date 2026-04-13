import mongoose from 'mongoose';
import dotenv from 'dotenv';
import College from '../models/College.js';

// Load environment variables
dotenv.config({ path: '.env' });

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/admissionpredictor';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const checkJEEMainColleges = async () => {
  try {
    await connectDB();

    // Find all colleges that have JEE Main in examTypes or cutoffs
    const collegesWithJEEMain = await College.find({
      $or: [
        { examTypes: 'JEE Main' },
        { 'cutoffs.examType': 'JEE Main' }
      ]
    }).select('name examTypes cutoffs location');

    console.log(`\n📊 Total colleges with JEE Main data: ${collegesWithJEEMain.length}\n`);

    // Get unique college names
    const uniqueNames = [...new Set(collegesWithJEEMain.map(c => c.name))];
    console.log(`📌 Unique college names: ${uniqueNames.length}\n`);

    // Check for duplicates
    const nameCounts = {};
    collegesWithJEEMain.forEach(college => {
      nameCounts[college.name] = (nameCounts[college.name] || 0) + 1;
    });

    const duplicates = Object.entries(nameCounts).filter(([name, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate college names:\n`);
      duplicates.forEach(([name, count]) => {
        console.log(`  - "${name}": ${count} entries`);
      });
      console.log('');
    }

    // Show sample colleges
    console.log('📋 Sample colleges (first 30):\n');
    uniqueNames.slice(0, 30).forEach((name, idx) => {
      const colleges = collegesWithJEEMain.filter(c => c.name === name);
      const examTypes = [...new Set(colleges.flatMap(c => c.examTypes || []))];
      const cutoffCount = colleges.reduce((sum, c) => sum + (c.cutoffs?.filter(cf => cf.examType === 'JEE Main').length || 0), 0);
      console.log(`${idx + 1}. ${name}`);
      console.log(`   Exam Types: ${examTypes.join(', ') || 'None'}`);
      console.log(`   JEE Main Cutoffs: ${cutoffCount}`);
      console.log(`   Duplicate entries: ${nameCounts[name]}`);
      console.log('');
    });

    // Check for suspicious names (might be branch names)
    const suspicious = uniqueNames.filter(name => {
      const lower = name.toLowerCase();
      return lower.includes('engineering') && 
             (lower.includes('bachelor') || lower.includes('master') || lower.includes('technology'));
    });

    if (suspicious.length > 0) {
      console.log(`\n⚠️  Suspicious college names (might be branches): ${suspicious.length}\n`);
      suspicious.slice(0, 20).forEach(name => {
        console.log(`  - ${name}`);
      });
    }

    // Group by examTypes
    const byExamType = {};
    collegesWithJEEMain.forEach(college => {
      (college.examTypes || []).forEach(et => {
        if (!byExamType[et]) byExamType[et] = [];
        byExamType[et].push(college.name);
      });
    });

    console.log('\n📊 Colleges by Exam Type:\n');
    Object.entries(byExamType).forEach(([examType, names]) => {
      const unique = [...new Set(names)];
      console.log(`  ${examType}: ${unique.length} unique colleges`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

checkJEEMainColleges();
