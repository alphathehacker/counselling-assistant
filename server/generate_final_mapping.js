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

// Standard Levenshtein distance
function levenshtein(a, b) {
    if(a.length === 0) return b.length; 
    if(b.length === 0) return a.length; 

    var matrix = [];

    let i;
    for(i = 0; i <= b.length; i++){
        matrix[i] = [i];
    }

    let j;
    for(j = 0; j <= a.length; j++){
        matrix[0][j] = j;
    }

    for(i = 1; i <= b.length; i++){
        for(j = 1; j <= a.length; j++){
            if(b.charAt(i-1) == a.charAt(j-1)){
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                        Math.min(matrix[i][j-1] + 1, // insertion
                                                 matrix[i-1][j] + 1)); // deletion
            }
        }
    }

    return matrix[b.length][a.length];
}

async function generateFinalMapping() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Load 272 actual Database records
        const colleges = await College.find({ isActive: true }).lean();
        const dbNames = colleges.map(c => c.name);
        
        // Load Excel File
        const workbook = XLSX.readFile(EXCEL_PATH);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const mapping = {};
        let successCount = 0;

        for (const row of rows) {
            if (row[0] && row[1]) {
                const adminName = row[0].toString().replace(/^\d+\.\s*/, '').trim();
                const csvName = row[1].toString().replace(/^\d+\.\s*/, '').trim();
                
                let bestMatch = adminName;
                let lowestDistance = Infinity;
                
                for (const dbName of dbNames) {
                    // Try pure normalized comparison first
                    const normAdmin = adminName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const normDb = dbName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    
                    if (normAdmin === normDb || normDb.includes(normAdmin) || normAdmin.includes(normDb)) {
                         lowestDistance = 0;
                         bestMatch = dbName;
                         break;
                    }
                    
                    const dist = levenshtein(adminName.toLowerCase(), dbName.toLowerCase());
                    if (dist < lowestDistance) {
                        lowestDistance = dist;
                        bestMatch = dbName;
                    }
                }

                
                // Always create a lowercase mapping for the CSV Name to the Best Matched DB Name
                mapping[csvName.toLowerCase()] = bestMatch;
                successCount++;
            }
        }
        
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2), 'utf8');
        console.log(`Successfully mapped ${successCount} side-by-side rows to true Database records.`);
        
        // Verification output
        console.log("\n--- SAMPLES ---");
        console.log(`'COLLEGE OF FOOD SCIENCE AND TECHNOLOGY' -> ${mapping['college of food science and technology']}`);
        console.log(`'ADITYA COLLEGE OF ENGINEERING' -> ${mapping['aditya college of engineering']}`);
        console.log(`'D M S S V H COLLEGE OF ENGINEERING' -> ${mapping['d m s s v h college of engineering']}`);

        await mongoose.connection.close();
    } catch (err) {
        console.error("Mapping generation failed:", err);
    }
}

generateFinalMapping();
