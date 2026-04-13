import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';

function parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
        } else cur += char;
    }
    result.push(cur.trim());
    return result;
}

async function compare() {
    try {
        // 1. Get unique colleges from CSV
        const csvPath = 'c:\\Users\\balak\\OneDrive\\Desktop\\admission predictor\\jee_mains cutoffs.csv';
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const csvLines = csvContent.split('\n');
        const csvColleges = new Set();
        for (let i = 1; i < csvLines.length; i++) {
            const line = csvLines[i].trim();
            if (!line) continue;
            const cols = parseCSVLine(line);
            if (cols[1]) csvColleges.add(cols[1].replace(/^"(.*)"$/, '$1'));
        }
        const csvList = Array.from(csvColleges).sort();

        // 2. Get colleges from DB
        await mongoose.connect(MONGODB_URI);
        const College = mongoose.model('College', new mongoose.Schema({name: String, examTypes: [String]}, {collection: 'colleges'}));
        const dbColleges = await College.find({examTypes: 'JEE Main'});
        const dbNames = dbColleges.map(c => c.name);
        
        console.log(`CSV Count: ${csvList.length}`);
        console.log(`DB Count: ${dbNames.length}`);

        // Compare
        console.log('\n--- Missing in DB ---');
        csvList.forEach(name => {
            if (!dbNames.includes(name)) console.log(name);
        });

        console.log('\n--- Extra in DB (not in this CSV) ---');
        dbNames.forEach(name => {
            if (!csvList.includes(name)) console.log(name);
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

compare();
