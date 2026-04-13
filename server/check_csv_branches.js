import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

async function check() {
  const filePath = path.join(process.cwd(), '..', 'sample colleges.csv');
  const branches = new Set();
  const reader = fs.createReadStream(filePath).pipe(csv());
  
  for await (const row of reader) {
    if (row.branch) branches.add(row.branch.trim());
  }
  
  console.log('Branches in CSV:');
  console.log([...branches].sort().join(', '));
}
check();
