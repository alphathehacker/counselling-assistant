import mongoose from 'mongoose';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';
const EXCEL_PATH = path.join('c:', 'Users', 'balak', 'OneDrive', 'Desktop', 'admission predictor', 'colleges list.xlsx');
const OUTPUT_PATH = path.join(__dirname, 'college_mapping.json');

const collegeSchema = new mongoose.Schema({
    name: String,
    isActive: Boolean
}, { collection: 'colleges' });

const College = mongoose.model('College', collegeSchema);

function getBigrams(string) {
  const s = string.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.length < 2) return [s];
  const v = new Array(s.length - 1);
  for (let i = 0; i < v.length; i++) {
    v[i] = s.slice(i, i + 2);
  }
  return v;
}

function stringSimilarity(str1, str2) {
  if (str1.length > 0 && str2.length > 0) {
    if (str1 === str2) return 1;
    
    let pairs1 = getBigrams(str1);
    let pairs2 = getBigrams(str2);
    let union = pairs1.length + pairs2.length;
    let hitCount = 0;

    for (let x = 0; x < pairs1.length; x++) {
      for (let y = 0; y < pairs2.length; y++) {
        if (pairs1[x] === pairs2[y]) {
          hitCount++;
          pairs2[y] = null;
          break;
        }
      }
    }
    return (2.0 * hitCount) / union;
  }
  return 0;
}

async function generateDBMapping() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get DB Names
        const colleges = await College.find({ isActive: true }, 'name').lean();
        const dbNames = colleges.map(c => c.name);
        console.log(`Loaded ${dbNames.length} names from Database.`);

        // Get Excel CSV Names
        const workbook = XLSX.readFile(EXCEL_PATH);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const csvNames = [];
        rows.forEach(row => {
            if (row[1]) csvNames.push(row[1].toString().replace(/^\d+\.\s*/, '').trim());
        });

        console.log(`Loaded ${csvNames.length} CSV names from Excel.`);

        const mapping = {};
        
        csvNames.forEach(csvName => {
            let bestMatch = null;
            let bestScore = -1;
            
            dbNames.forEach(dbName => {
                const normCsv = csvName.toLowerCase().replace(/[^a-z0-9]/g, '');
                const normDb = dbName.toLowerCase().replace(/[^a-z0-9]/g, '');
                
                if (normCsv === normDb) {
                     bestScore = 999;
                     bestMatch = dbName;
                     return;
                }
                
                const score = stringSimilarity(csvName, dbName);
                const substringBonus = (normCsv.includes(normDb) || normDb.includes(normCsv)) ? 0.3 : 0;
                
                const totalScore = score + substringBonus;

                if (totalScore > bestScore && bestScore !== 999) {
                    bestScore = totalScore;
                    bestMatch = dbName;
                }
            });

            if (bestMatch && bestScore > 0) {
                const csvNameLower = csvName.toLowerCase().trim();
                mapping[csvNameLower] = bestMatch;
            }
        });
        
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2), 'utf8');
        console.log(`Successfully generated direct DB mapping with ${Object.keys(mapping).length} entries.`);
        
        // Log a few to verify
        console.log("Samples:");
        console.log(`CSV 'COLLEGE OF FOOD SCIENCE AND TECHNOLOGY' -> ${mapping['college of food science and technology']}`);
        console.log(`CSV 'ADITYA COLLEGE OF ENGINEERING' -> ${mapping['aditya college of engineering']}`);

        await mongoose.connection.close();
    } catch (err) {
        console.error("Mapping generation failed:", err);
    }
}

generateDBMapping();
