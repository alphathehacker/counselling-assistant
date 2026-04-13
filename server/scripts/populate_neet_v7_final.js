import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import College from '../models/College.js';

const csvFilePath = path.join(__dirname, '../../neet_colleges_full_details_FINAL_v7.csv');

async function importData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const results = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`CSV Loaded: ${results.length} rows`);

        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;
        let duplicateMatches = 0;

        for (const row of results) {
          try {
            const name = row['College Name *']?.trim();
            const code = row['College Code']?.trim();
            const city = row['City *']?.trim();
            let state = row['State *']?.trim();

            if (!name) continue;

            // Simple cleaning for matching names
            const cleanName = (n) => n.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
            const targetCleanName = cleanName(name);

            // Search for existing college
            let college = null;
            if (code && code !== '.' && code.length > 2) {
              college = await College.findOne({ code });
            }
            
            if (!college) {
              // Priority: Try to find by exact name (case-insensitive)
              const matchedColleges = await College.find({
                name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
              });

              if (matchedColleges.length === 1) {
                college = matchedColleges[0];
              } else if (matchedColleges.length > 1) {
                // Too many matches, take the one that is already NEET if available
                const neetOnly = matchedColleges.filter(c => c.examTypes.includes('NEET'));
                college = neetOnly.length > 0 ? neetOnly[0] : matchedColleges[0];
                duplicateMatches++;
              }
            }

            // Fallback: If still not found, try a very simple name check (remove dots/spaces)
            if (!college) {
                // Find all colleges and'll' search locally (since there are only ~1500)
                // Actually, I won't do that for every row to be safe.
                // But wait, the name match above is already case-insensitive.
            }

            // Fix state if empty
            if (!state) {
              if (city === 'Virudhunagar') state = 'Tamil Nadu';
              else if (college && college.location && college.location.state && college.location.state !== 'Andhra Pradesh') {
                state = college.location.state;
              } else {
                state = 'Tamil Nadu'; // Default for medical focus
              }
            }

            const collegeData = {
              name,
              shortName: row['Short Name']?.trim(),
              code: (code && code !== '.') ? code : undefined,
              location: {
                city: city || 'Unknown City',
                state: state || 'Andhra Pradesh',
                district: row['District']?.trim(),
                pincode: row['Pincode']?.trim(),
                address: row['Address']?.trim(),
                nearestRailway: row['Nearest Railway Station']?.trim(),
                nearestBusStand: row['Nearest Bus Stand']?.trim(),
              },
              campusArea: parseFloat(row['Campus Area (Acres)']) || 0,
              established: parseInt(row['Established Year']) || undefined,
              affiliation: row['Affiliation']?.trim(),
              website: row['Website']?.trim(),
              contact: {
                phone: row['Phone']?.trim(),
                email: row['Email']?.trim(),
              },
              fees: {
                annualTuitionFee: parseFloat(row['Annual Tuition Fee']) || 0,
                annualHostelFee: parseFloat(row['Annual Hostel Fee']) || 0,
                annualMessFee: parseFloat(row['Annual Mess Fee']) || 0,
                totalFirstYearFee: parseFloat(row['Total First Year Fee']) || 0,
              },
              placements: {
                averagePackage: parseFloat(row['Average Package (LPA)']) || 0,
                highestPackage: parseFloat(row['Highest Package (LPA)']) || 0,
                placementRate: parseFloat(row['Placement Rate (%)']) || 0,
                topRecruiters: row['Top Recruiters (comma-separated)'] 
                  ? row['Top Recruiters (comma-separated)'].split(',').map(s => s.trim()).filter(Boolean)
                  : [],
              },
              rankings: {
                nirf: parseInt(row['NIRF Rank']) || undefined,
              },
              facilities: row['Facilities (comma-separated)']
                ? row['Facilities (comma-separated)'].split(',').map(s => s.trim()).filter(Boolean)
                : [],
              isActive: true,
            };

            // College Type Mapping
            const typeVal = (row['College Type *'] || '').toLowerCase();
            if (typeVal.includes('govt')) collegeData.collegeType = 'Government';
            else if (typeVal.includes('deemed')) collegeData.collegeType = 'Deemed University';
            else if (typeVal.includes('privat')) collegeData.collegeType = 'Private';
            else if (typeVal.includes('autonomo')) collegeData.collegeType = 'Autonomous';
            else collegeData.collegeType = 'Government';

            if (college) {
              // Update
              if (college.examTypes && !college.examTypes.includes('NEET')) {
                college.examTypes.push('NEET');
              }
              
              // Apply fields carefully to avoid location.coordinates issues
              college.name = collegeData.name;
              college.shortName = collegeData.shortName;
              if (collegeData.code) college.code = collegeData.code;
              college.collegeType = collegeData.collegeType;
              
              // Merge location subfields explicitly
              college.location.city = collegeData.location.city;
              college.location.state = collegeData.location.state;
              college.location.district = collegeData.location.district;
              college.location.pincode = collegeData.location.pincode;
              college.location.address = collegeData.location.address;
              college.location.nearestRailway = collegeData.location.nearestRailway;
              college.location.nearestBusStand = collegeData.location.nearestBusStand;
              // Leave location.coordinates alone
              
              college.campusArea = collegeData.campusArea;
              college.established = collegeData.established;
              college.affiliation = collegeData.affiliation;
              college.website = collegeData.website;
              college.contact = collegeData.contact;
              college.fees = collegeData.fees;
              college.placements = collegeData.placements;
              college.rankings = collegeData.rankings;
              college.facilities = collegeData.facilities;

              await college.save();
              updatedCount++;
            } else {
              // Create
              collegeData.examTypes = ['NEET'];
              await College.create(collegeData);
              createdCount++;
            }

            if ((createdCount + updatedCount) % 100 === 0) {
              console.log(`Processed ${createdCount + updatedCount} colleges...`);
            }
          } catch (err) {
            console.error(`Error processing row: ${row['College Name *']}`, err.message);
            errorCount++;
          }
        }

        console.log('\n--- Final Summary ---');
        console.log(`Total rows in CSV: ${results.length}`);
        console.log(`Existing colleges updated: ${updatedCount}`);
        console.log(`New colleges created: ${createdCount}`);
        console.log(`Duplicate matches resolved: ${duplicateMatches}`);
        console.log(`Errors encountered: ${errorCount}`);
        
        await mongoose.connection.close();
        process.exit(0);
      });
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

importData();
