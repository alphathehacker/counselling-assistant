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

async function finalSync() {
  try {
    console.log('Connecting to MongoDB (FINAL SYNC)...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // 1. STEP: CLEAR OLD DATA BUT KEEP COLLEGES IF THEY HAVE OTHER DATA
    console.log('Deleting cutoffs for AP exams and removing examType tags (EAPCET/ECET)...');
    await College.updateMany(
      {},
      { 
        $pull: { 
          examTypes: { $in: ['AP EAPCET', 'AP ECET'] },
          cutoffs: { examType: { $in: ['AP EAPCET', 'AP ECET'] } } 
        } 
      }
    );

    // 2. STEP: DELETE COLLEGES CREATED TODAY THAT NOW HAVE NO EXAM TYPES
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deleteResult = await College.deleteMany({
      examTypes: { $size: 0 },
      createdAt: { $gte: today }
    });
    console.log(`Removed ${deleteResult.deletedCount} temporary/empty colleges created today.`);

    // 3. STEP: LOAD AND MERGE CSV DATA LOCALLY
    const files = [
      { name: 'sample colleges.csv', exam: 'AP EAPCET' },
      { name: 'ap_ecet.csv', exam: 'AP ECET' }
    ];

    const localCollegesMap = new Map(); // key normalized name

    for (const fileInfo of files) {
      const filePath = path.join(process.cwd(), '..', fileInfo.name);
      if (!fs.existsSync(filePath)) {
          console.warn(`File not found: ${filePath}`);
          continue;
      }
      console.log(`Reading ${fileInfo.name}...`);
      const content = fs.readFileSync(filePath);
      
      const rows = [];
      const headers = await new Promise((resolve) => {
          let h = [];
          const stream = Readable.from([content]);
          stream.pipe(csv())
            .on('headers', (headers) => { h = headers; })
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve(h));
      });

      console.log(`Processing ${rows.length} rows for ${fileInfo.exam}...`);

      for (const row of rows) {
          const collegeData = parseCSVRow(row, headers, fileInfo.exam);
          if (!collegeData.name) continue;

          const key = collegeData.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          
          if (!localCollegesMap.has(key)) {
              localCollegesMap.set(key, {
                  ...collegeData,
                  examTypes: [fileInfo.exam],
                  branches: collegeData.branches || [],
                  cutoffs: collegeData.cutoffs || []
              });
          } else {
              const existing = localCollegesMap.get(key);
              if (!existing.examTypes.includes(fileInfo.exam)) {
                  existing.examTypes.push(fileInfo.exam);
              }
              // Merge branches accurately
              (collegeData.branches || []).forEach(nb => {
                  if (!existing.branches.find(eb => eb.name === nb.name || eb.code === nb.code)) {
                      existing.branches.push(nb);
                  }
              });
              // Merge cutoffs
              (collegeData.cutoffs || []).forEach(nc => {
                  existing.cutoffs.push(nc);
              });
          }
      }
    }

    console.log(`\nFinal set of unique AP colleges to sync: ${localCollegesMap.size}`);

    // 4. STEP: INSERT/UPDATE COLLEGES IN DB
    const finalOps = [];
    const newColleges = [];
    
    // Fetch remaining colleges from DB after wipe
    const currentDbColleges = await College.find({}).lean();
    const dbMap = new Map();
    currentDbColleges.forEach(c => {
       dbMap.set(c.name.toLowerCase().trim().replace(/[^a-z0-9]/g, ''), c);
    });

    for (const [key, data] of localCollegesMap.entries()) {
        const dbCollege = dbMap.get(key);
        if (dbCollege) {
            finalOps.push({
                updateOne: {
                    filter: { _id: dbCollege._id },
                    update: {
                        $addToSet: { 
                            examTypes: { $each: data.examTypes },
                            branches: { $each: data.branches }
                        },
                        $push: { cutoffs: { $each: data.cutoffs } }
                    }
                }
            });
        } else {
            newColleges.push({
                ...data,
                isActive: true,
                location: {
                    city: data.location.city || data.location.district || 'AP',
                    state: 'Andhra Pradesh',
                    district: data.location.district || ''
                }
            });
        }
    }

    if (newColleges.length > 0) {
        await College.insertMany(newColleges);
        console.log(`Inserted ${newColleges.length} brand new AP colleges.`);
    }

    if (finalOps.length > 0) {
        console.log(`Updating ${finalOps.length} existing colleges with AP exam data...`);
        const chunkSize = 200;
        for (let i = 0; i < finalOps.length; i += chunkSize) {
            await College.bulkWrite(finalOps.slice(i, i + chunkSize));
            process.stdout.write('.');
        }
    }

    console.log('\n\nFinal Report:');
    const finalCount = await College.countDocuments({ examTypes: { $in: ['AP EAPCET', 'AP ECET'] } });
    console.log(`Colleges with AP Exam tags: ${finalCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Final sync failed:', error);
    process.exit(1);
  }
}

finalSync();
