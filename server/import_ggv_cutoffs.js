import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGODB_URI = 'mongodb+srv://sankar:Sankar%402003@cluster0.reglozh.mongodb.net/admissionpredictor?retryWrites=true&w=majority';
const COLLEGE_NAME = 'School of Studies of Engineering and Technology, Guru Ghasidas Vishwavidyalaya, Bilaspur';
const CSV_FILE = 'c:\\Users\\balak\\OneDrive\\Desktop\\admission predictor\\jee_mains cutoffs.csv';

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
        } else {
            cur += char;
        }
    }
    result.push(cur.trim());
    return result;
}

async function run() {
    try {
        const content = fs.readFileSync(CSV_FILE, 'utf8');
        const lines = content.split('\n');
        const headers = parseCSVLine(lines[0]);

        const cutoffs = [];
        const branches = new Set();
        const year = 2023; // Default for this dataset based on my earlier exploration

        const jeeMainCategoryColumns = {
            General: ['OPEN (CRL) Round 1', 'OPEN (CRL) Round 2', 'OPEN (CRL) Round 3', 'OPEN (CRL) Round 4', 'OPEN (CRL) Round 5', 'OPEN (CRL) Round 6'],
            EWS: ['EWS (Category Rank) Round 1', 'EWS (Category Rank) Round 2', 'EWS (Category Rank) Round 3', 'EWS (Category Rank) Round 4', 'EWS (Category Rank) Round 5', 'EWS (Category Rank) Round 6'],
            OBC: ['OBC-NCL (Category Rank) Round 1', 'OBC-NCL (Category Rank) Round 2', 'OBC-NCL (Category Rank) Round 3', 'OBC-NCL (Category Rank) Round 4', 'OBC-NCL (Category Rank) Round 5', 'OBC-NCL (Category Rank) Round 6'],
            SC: ['SC (Category Rank) Round 1', 'SC (Category Rank) Round 2', 'SC (Category Rank) Round 3', 'SC (Category Rank) Round 4', 'SC (Category Rank) Round 5', 'SC (Category Rank) Round 6'],
            ST: ['ST (Category Rank) Round 1', 'ST (Category Rank) Round 2', 'ST (Category Rank) Round 3', 'ST (Category Rank) Round 4', 'ST (Category Rank) Round 5', 'ST (Category Rank) Round 6'],
        };

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = parseCSVLine(line);
            if (cols.length < 3) continue;

            // Institute is index 1
            const csvInst = cols[1].replace(/^"(.*)"$/, '$1');
            if (csvInst === COLLEGE_NAME) {
                const branchRaw = cols[2].replace(/^"(.*)"$/, '$1');
                // Clean branch name to remove (4 Years, Bachelor of Technology) if present
                const branch = branchRaw.split(' (')[0].trim();
                branches.add(branch);

                Object.entries(jeeMainCategoryColumns).forEach(([categoryName, colHeaders]) => {
                    const ranks = [];
                    colHeaders.forEach(h => {
                        const idx = headers.indexOf(h);
                        if (idx !== -1 && cols[idx]) {
                            const val = parseFloat(cols[idx].replace(/,/g, '').trim());
                            if (!isNaN(val) && val > 0) {
                                ranks.push(val);
                            }
                        }
                    });

                    if (ranks.length > 0) {
                        const closingRank = Math.max(...ranks);
                        const openingRank = Math.min(...ranks);

                        cutoffs.push({
                            examType: 'JEE Main',
                            branch: branch,
                            category: categoryName,
                            year: year,
                            openingRank,
                            closingRank
                        });
                    }
                });
            }
        }

        console.log(`Extracted ${cutoffs.length} cutoffs for ${branches.size} branches.`);

        await mongoose.connect(MONGODB_URI);
        const College = mongoose.model('College', new mongoose.Schema({
            name: String,
            cutoffs: Array,
            branches: Array
        }, { collection: 'colleges' }));

        const college = await College.findOne({ name: COLLEGE_NAME });
        if (!college) {
            console.error('College not found in DB!');
        } else {
            college.cutoffs = cutoffs;
            college.branches = Array.from(branches).map(b => ({ name: b }));
            await college.save();
            console.log('Successfully updated college in DB.');
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

run();
