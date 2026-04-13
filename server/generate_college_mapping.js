import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_PATH = path.join('c:', 'Users', 'balak', 'OneDrive', 'Desktop', 'admission predictor', 'colleges list.xlsx');
const OUTPUT_PATH = path.join(__dirname, 'college_mapping.json');

try {
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Read rows
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  const mapping = {};
  
  rows.forEach(row => {
    // Expected format: Column 0 = Admin Panel Name, Column 1 = CSV Name
    if (row[0] && row[1]) {
      // Clean names by removing numbering like "1. ", "47. "
      const adminName = row[0].toString().replace(/^\d+\.\s*/, '').trim();
      const csvNameOrig = row[1].toString().replace(/^\d+\.\s*/, '').trim();
      
      // We store the mapping using lowercase CSV name for robust matching
      const csvNameLower = csvNameOrig.toLowerCase();
      
      if (adminName && csvNameLower) {
        mapping[csvNameLower] = adminName;
      }
    }
  });
  
  const keysCount = Object.keys(mapping).length;
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2), 'utf8');
  console.log(`Successfully generated college_mapping.json with ${keysCount} entries.`);
} catch (error) {
  console.error("Error generating mapping:", error);
}
