const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname);
const filePath = path.join(base, 'AP_EAPCET_Colleges_Details.xlsx');
const outPath = path.join(base, 'xlsx_parsed.txt');

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const lines = [];
lines.push('SHEETS: ' + JSON.stringify(workbook.SheetNames));
lines.push('');

// Dump ALL sheets - headers + first 3 rows each
workbook.SheetNames.forEach(name => {
  const sh = workbook.Sheets[name];
  const data = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' });
  lines.push('=== ' + name + ' ===');
  lines.push('rows: ' + data.length + ' cols: ' + Math.max(...data.map(r => r.length || 0)));
  data.slice(0, 4).forEach((row, i) => {
    lines.push(i + ': ' + JSON.stringify(row));
  });
  lines.push('');
});

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('Wrote ' + lines.length + ' lines to ' + outPath);
