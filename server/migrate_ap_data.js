import mongoose from 'mongoose';
import dotenv from 'dotenv';
import College from './models/College.js';
import CSVData from './models/CSVData.js';
import { parseCSVRow } from './utils/csvParser.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGODB_URI;

async function migrateData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const examTypes = ['AP EAPCET', 'AP ECET'];

    for (const examType of examTypes) {
      console.log(`\n--- Processing ${examType} ---`);
      
      const csvRecord = await CSVData.findOne({ examType, isActive: true }).sort({ uploadedAt: -1 });
      
      if (!csvRecord) {
        console.log(`No active CSV data found for ${examType} in CSVData model. Skipping.`);
        continue;
      }

      console.log(`Found CSV: ${csvRecord.filename}. Parsing ${csvRecord.csvContent.length} bytes...`);
      
      const rows = [];
      const stream = Readable.from([csvRecord.csvContent]);
      
      await new Promise((resolve) => {
        stream.pipe(csv()).on('data', (row) => rows.push(row)).on('end', resolve);
      });

      console.log(`Total rows to process: ${rows.length}`);

      let createdCount = 0;
      let updatedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const collegeData = parseCSVRow(row, csvRecord.headers, examType);
        
        if (!collegeData.name) continue;

        // Find existing college by name (case-insensitive)
        const nameRegex = new RegExp(`^${collegeData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        let college = await College.findOne({ name: nameRegex });

        if (!college && collegeData.code) {
           college = await College.findOne({ code: collegeData.code });
        }

        if (college) {
          // UPDATE Existing
          // Ensure examType is in list
          if (!college.examTypes.includes(examType)) {
            college.examTypes.push(examType);
          }
          
          // Merge branches
          if (collegeData.branches) {
            collegeData.branches.forEach(newBranch => {
              const existingBranch = college.branches.find(b => b.name === newBranch.name || b.code === newBranch.code);
              if (!existingBranch) {
                college.branches.push(newBranch);
              }
            });
          }

          // Merge cutoffs
          if (collegeData.cutoffs) {
            collegeData.cutoffs.forEach(newCutoff => {
              const existingIdx = college.cutoffs.findIndex(c => 
                c.examType === newCutoff.examType && 
                c.branch === newCutoff.branch && 
                c.category === newCutoff.category &&
                c.year === newCutoff.year
              );

              if (existingIdx !== -1) {
                college.cutoffs[existingIdx].closingRank = newCutoff.closingRank;
              } else {
                college.cutoffs.push(newCutoff);
              }
            });
          }
          
          await college.save();
          updatedCount++;
        } else {
          // CREATE New
          const newCollege = new College({
            ...collegeData,
            isActive: true,
            examTypes: [examType],
            location: {
               city: collegeData.location.city || collegeData.location.district || 'AP',
               state: 'Andhra Pradesh',
               district: collegeData.location.district || '',
            }
          });
          await newCollege.save();
          createdCount++;
        }
        
        if (i % 100 === 0) process.stdout.write('.');
      }
      console.log(`\nFinished ${examType}. Created: ${createdCount}, Updated: ${updatedCount}`);
    }

    console.log('\nMigration/Sync completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
