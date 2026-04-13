const fs = require('fs');
const path = require('path');

const csvFile = 'neet_colleges_full_details_FINAL_v7.csv';
const filePath = path.join('c:\\Users\\balak\\OneDrive\\Desktop\\admission predictor', csvFile);

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');
const header = lines[0].split(',');

// Normalize the college name
function normalize(name) {
    if (!name) return "";
    return name.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

const records = [];
for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Naive CSV parser for this case (splitting by comma, ignoring quotes for simplistic analysis)
    // For more accuracy we should handle quotes but let's see
    const cols = lines[i].split(',');
    if (cols.length < 5) continue;
    
    const record = {
        name: cols[0],
        shortName: cols[1],
        code: cols[2],
        type: cols[3],
        city: cols[4],
        state: cols[5],
        normalized: normalize(cols[0])
    };
    records.push(record);
}

const nameMap = {};
const normalizedMap = {};
const potentialDuplicates = [];

records.forEach(r => {
    // Exact match
    if (!nameMap[r.name]) nameMap[r.name] = [];
    nameMap[r.name].push(r);
    
    // Normalized match
    if (!normalizedMap[r.normalized]) normalizedMap[r.normalized] = [];
    normalizedMap[r.normalized].push(r);
});

console.log('--- NEET Dataset Analysis ---');
console.log('Total records:', records.length);
console.log('Unique college names (exact):', Object.keys(nameMap).length);
console.log('Unique college names (normalized):', Object.keys(normalizedMap).length);
console.log('----------------------------');

console.log('\n--- Exact Duplicate Names Found ---');
let exactDupCount = 0;
for (const name in nameMap) {
    if (nameMap[name].length > 1) {
        console.log(`"${name}" is repeated ${nameMap[name].length} times:`);
        nameMap[name].forEach(r => console.log(`  - ${r.city}, ${r.state} (${r.type})`));
        exactDupCount++;
    }
}
if (exactDupCount === 0) console.log('None');

console.log('\n--- Hidden Duplicates (Similar Names / Normalized) ---');
let hiddenDupCount = 0;
for (const norm in normalizedMap) {
    if (normalizedMap[norm].length > 1) {
        const uniqueOriginals = new Set(normalizedMap[norm].map(r => r.name));
        if (uniqueOriginals.size > 1) {
            console.log(`Normalized name "${norm}" represents these variations:`);
            normalizedMap[norm].forEach(r => console.log(`  - "${r.name}" (${r.city}, ${r.state})`));
            hiddenDupCount++;
        }
    }
}
if (hiddenDupCount === 0) console.log('None');

console.log('\n--- Duplicate College Codes ---');
const codeMap = {};
records.forEach(r => {
    if(r.code && r.code !== '#NAME?') {
        if (!codeMap[r.code]) codeMap[r.code] = [];
        codeMap[r.code].push(r);
    }
});
let codeDupCount = 0;
for (const code in codeMap) {
    if (codeMap[code].length > 1) {
        console.log(`Code "${code}" is used by multiple entries:`);
        codeMap[code].forEach(r => console.log(`  - "${r.name}" (${r.city})`));
        codeDupCount++;
    }
}
if (codeDupCount === 0) console.log('None');
