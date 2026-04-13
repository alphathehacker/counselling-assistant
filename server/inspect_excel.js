import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_PATH = path.join('c:', 'Users', 'balak', 'OneDrive', 'Desktop', 'admission predictor', 'colleges list.xlsx');

try {
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log("Excel Rows Inspection:");
  for (let i = 0; i < 50; i++) {
    if (rows[i]) {
      const colA = rows[i][0] ? rows[i][0].toString().trim() : 'EMPTY';
      const colB = rows[i][1] ? rows[i][1].toString().trim() : 'EMPTY';
      console.log(`Row ${i + 1}: [Admin] ${colA}  <==>  [CSV] ${colB}`);
    }
  }
} catch (error) {
  console.error(error);
}
