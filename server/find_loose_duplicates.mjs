import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({ name: String, location: Object, examTypes: Array }, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        console.log("Analyzing database for loose duplicate colleges...");

        const allColleges = await College.find({ isActive: true });

        const collegeMap = new Map();
        const duplicates = [];

        for (const college of allColleges) {
            const rawName = college.name || '';
            // Very loose normalization: remove Dr, Sri, Smt, spaces, brackets, autonomous, commas
            const looseKey = rawName
                .toLowerCase()
                .replace(/dr\.?\s*/g, '')
                .replace(/sri\s+/g, '')
                .replace(/smt\.?\s*/g, '')
                .replace(/\(autonomous\)/g, '')
                .replace(/\(.*\)/g, '')
                .replace(/[^a-z0-9]/g, '');

            if (collegeMap.has(looseKey)) {
                collegeMap.get(looseKey).push(college);
            } else {
                collegeMap.set(looseKey, [college]);
            }
        }

        let duplicateCount = 0;
        let totalDuplicateRecords = 0;

        for (const [key, collegesList] of collegeMap) {
            if (collegesList.length > 1) {
                duplicateCount++;
                totalDuplicateRecords += collegesList.length;

                duplicates.push({
                    key: key,
                    names: collegesList.map(c => c.name),
                    count: collegesList.length,
                    ids: collegesList.map(c => c._id.toString()),
                    exams: collegesList.map(c => c.examTypes.join(', ')),
                    cities: collegesList.map(c => c.location?.city || 'No City')
                });
            }
        }

        duplicates.sort((a, b) => b.count - a.count);

        console.log(`\n======================================`);
        console.log(`LOOSE DUPLICATE ANALYSIS REPORT`);
        console.log(`======================================`);
        console.log(`Total Active Colleges Scanned: ${allColleges.length}`);
        console.log(`Duplicates Groups Identified: ${duplicateCount}`);
        console.log(`Total Duplicate Records: ${totalDuplicateRecords}`);
        console.log(`\nTop Duplicates Found:\n`);

        for (let i = 0; i < Math.min(duplicates.length, 30); i++) {
            const dup = duplicates[i];
            console.log(`${i + 1}. [${dup.key}] -> ${dup.count} instances`);
            dup.names.forEach((name, idx) => {
                console.log(`   - ${name} (${dup.exams[idx]}) in [${dup.cities[idx]}]`);
            });
            console.log(`--------------------------------------`);
        }

        if (duplicates.length > 30) {
            console.log(`... and ${duplicates.length - 30} more duplicate groups.\n`);
        }

        mongoose.connection.close();
    } catch (e) {
        console.error("Script error:", e);
        mongoose.connection.close();
    }
});
