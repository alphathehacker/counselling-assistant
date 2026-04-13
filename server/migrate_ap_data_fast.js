import mongoose from 'mongoose';
import dotenv from 'dotenv';
import College from './models/College.js';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { parseCSVRow } from './utils/csvParser.js';

dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGODB_URI;

async function migrateDataPermanently() {
  try {
    console.log('Connecting to MongoDB (Bulk Mode)...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const files = [
      { name: 'sample colleges.csv', exam: 'AP EAPCET' },
      { name: 'ap_ecet.csv', exam: 'AP ECET' }
    ];

    // Pre-fetch all colleges for faster matching
    console.log('Fetching all existing colleges...');
    const allColleges = await College.find({}).lean();
    const collegeMap = new Map();
    allColleges.forEach(c => {
      if (c.name) collegeMap.set(c.name.toLowerCase().trim(), c);
      if (c.code) collegeMap.set(c.code.toLowerCase().trim(), c);
    });
    console.log(`Cached ${allColleges.length} colleges.`);

    for (const fileInfo of files) {
      const filePath = path.join(process.cwd(), '..', fileInfo.name);
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}. Trying root dir...`);
        const rootPath = path.join(process.cwd(), fileInfo.name); // Maybe it's in server dir
        if (!fs.existsSync(rootPath)) {
            console.log(`File STILL not found skipping ${fileInfo.name}`);
            continue;
        }
      }
      
      console.log(`\n--- Processing ${fileInfo.exam} from ${fileInfo.name} ---`);
      
      const content = fs.readFileSync(filePath);
      const rows = [];
      const stream = Readable.from([content]);
      
      const headers = await new Promise((resolve) => {
          let h = [];
          stream.pipe(csv())
            .on('headers', (headers) => { h = headers; })
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve(h));
      });

      console.log(`Rows: ${rows.length}. Headers: ${headers.slice(0, 10).join(', ')}...`);
      if (rows.length > 0) {
          console.log(`Sample Row Keys: ${Object.keys(rows[0]).slice(0, 10).join(', ')}...`);
      }


      const operations = [];
      const createdColleges = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const collegeData = parseCSVRow(row, headers, fileInfo.exam);
        
        if (!collegeData.name) continue;

        // Find existing college in cache
        const nameKey = collegeData.name.toLowerCase().trim();
        const codeKey = collegeData.code?.toLowerCase().trim();
        
        let targetId = collegeMap.get(nameKey)?._id || (codeKey ? collegeMap.get(codeKey)?._id : null);

        if (targetId) {
          // Prepare update operation
          // We'll collect all branches and cutoffs for this row first
          // Actually, since multiple rows can refer to the same college, we should handle uniqueness.
          
          const bulkOp = {
            updateOne: {
              filter: { _id: targetId },
              update: {
                $addToSet: { 
                  examTypes: fileInfo.exam,
                  branches: { $each: collegeData.branches || [] }
                }
              }
            }
          };
          operations.push(bulkOp);
          
          // Cutoffs need more complex merge logic ($push with uniqueness is harder in bulk)
          // For now, let's just push them all and we can clean up or rely on prediction logic using the latest.
          // Better: push everything then we can use $addToSet if we define sub-doc ID logic.
          // Actually, let's just push them.
          if (collegeData.cutoffs && collegeData.cutoffs.length > 0) {
              operations.push({
                  updateOne: {
                      filter: { _id: targetId },
                      update: { $push: { cutoffs: { $each: collegeData.cutoffs } } }
                  }
              });
          }
        } else {
          // Add to create list (to avoid duplicates in same run, we temporarily cache)
          if (!collegeMap.has(nameKey)) {
              collegeMap.set(nameKey, { name: collegeData.name }); // placeholder
              createdColleges.push({
                  ...collegeData,
                  isActive: true,
                  examTypes: [fileInfo.exam],
                  location: {
                      city: collegeData.location.city || collegeData.location.district || 'Andhra Pradesh',
                      state: 'Andhra Pradesh',
                      district: collegeData.location.district || ''
                  }
              });
          }
        }
      }

      console.log(`Operations to execute: ${operations.length}. New colleges to insert: ${createdColleges.length}`);

      if (createdColleges.length > 0) {
          await College.insertMany(createdColleges);
          console.log(`Inserted ${createdColleges.length} new colleges.`);
      }

      if (operations.length > 0) {
          // Split bulk into chunks to avoid too large payload
          const chunkSize = 500;
          for (let j = 0; j < operations.length; j += chunkSize) {
              const chunk = operations.slice(j, j + chunkSize);
              await College.bulkWrite(chunk);
              process.stdout.write('.');
          }
      }
      console.log(`\nFinished ${fileInfo.exam}`);
    }

    console.log('\nMigration/Sync completed successfully.');
    
    // Clear old cutoffs if needed? No, user wants to ADD them.
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateDataPermanently();
