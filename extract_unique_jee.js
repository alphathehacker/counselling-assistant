const fs = require('fs');
const path = require('path');

const csvFile = 'jee_mains cutoffs.csv';
const filePath = path.join('c:\\Users\\balak\\OneDrive\\Desktop\\admission predictor', csvFile);

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Simple CSV parser that handles quotes
function parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += char;
        }
    }
    result.push(cur.trim());
    return result;
}

const colleges = new Set();
// Skip header (i=0)
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = parseCSVLine(line);
    // Index 1 is "Institute" based on the header: Institute_Group,Institute,Academic Program Name,...
    if (columns.length > 1) {
        let name = columns[1];
        if (name) {
            // Remove wrapping quotes if any
            name = name.replace(/^"(.*)"$/, '$1');
            colleges.add(name);
        }
    }
}

console.log('--- Unique Colleges in JEE Mains Cutoffs ---');
console.log('Total unique colleges found:', colleges.size);
console.log('-------------------------------------------');
const sortedColleges = Array.from(colleges).sort();
sortedColleges.forEach(name => console.log(name));
