import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_PATH = path.join('c:', 'Users', 'balak', 'OneDrive', 'Desktop', 'admission predictor', 'colleges list.xlsx');
const OUTPUT_PATH = path.join(__dirname, 'college_mapping.json');

// Advanced normalizer: removes punctuation, common filler words, and returns an array of core tokens
function tokenize(str) {
  if (!str) return [];
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w && !['of', 'and', 'the', 'for', 'institutes', 'institute', 'college', 'colleges', 'engineering', 'technology', 'sciences', 'science', 'university', 'school'].includes(w));
}

function calculateScore(tokens1, tokens2) {
  let score = 0;
  for (const t1 of tokens1) {
    if (tokens2.includes(t1)) score++;
    else {
      // Partial match boost
      for (const t2 of tokens2) {
        if (t1.length > 3 && t2.length > 3 && (t1.includes(t2) || t2.includes(t1))) {
          score += 0.5;
          break;
        }
      }
    }
  }
  return score / Math.max(tokens1.length, tokens2.length);
}

try {
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const adminNames = [];
  const csvNames = [];
  
  rows.forEach(row => {
    if (row[0]) adminNames.push(row[0].toString().replace(/^\d+\.\s*/, '').trim());
    if (row[1]) csvNames.push(row[1].toString().replace(/^\d+\.\s*/, '').trim());
  });

  console.log(`Extracted ${adminNames.length} Admin names and ${csvNames.length} CSV names.`);

  const mapping = {};
  
  csvNames.forEach(csvName => {
    const csvTokens = tokenize(csvName);
    let bestMatch = null;
    let bestScore = -1;
    
    adminNames.forEach(adminName => {
      const adminTokens = tokenize(adminName);
      const score = calculateScore(csvTokens, adminTokens);
      
      // Bonus if one is a straight substring of the other
      const normCsv = csvName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normAdmin = adminName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const substringBonus = (normCsv.includes(normAdmin) || normAdmin.includes(normCsv)) ? 0.3 : 0;
      
      const totalScore = score + substringBonus;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMatch = adminName;
      }
    });

    if (bestMatch && bestScore > 0) {
      mapping[csvName.toLowerCase()] = bestMatch;
    } else {
      // Fallback
      mapping[csvName.toLowerCase()] = csvName; 
    }
  });
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`Successfully generated intelligent college_mapping.json with ${Object.keys(mapping).length} entries.`);
  
  // Log a few to verify
  console.log("Samples:");
  console.log(`CSV 'COLLEGE OF FOOD SCIENCE AND TECHNOLOGY' -> ${mapping['college of food science and technology']}`);
  console.log(`CSV 'ADITYA COLLEGE OF ENGINEERING' -> ${mapping['aditya college of engineering']}`);

} catch (error) {
  console.error("Error generating mapping:", error);
}
