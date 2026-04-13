import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const CollegeSchema = new mongoose.Schema({ name: String, location: Object, examTypes: Array }, { strict: false });
        const College = mongoose.model('College', CollegeSchema);

        console.log("Analyzing database for duplicate colleges...");

        // Find all active colleges
        const allColleges = await College.find({ isActive: true });

        const collegeMap = new Map();
        const duplicates = [];

        for (const college of allColleges) {
            // Create a normalized key mapping for the college
            // Convert to lowercase, remove extra spaces
            const rawName = college.name || '';
            const normalizedName = rawName.toLowerCase().replace(/\s+/g, ' ').trim();
            const city = college.location?.city ? college.location.city.toLowerCase().trim() : '';
            const state = college.location?.state ? college.location.state.toLowerCase().trim() : '';

            // First check: Exact normalized name match
            const exactKey = normalizedName;

            if (collegeMap.has(exactKey)) {
                collegeMap.get(exactKey).push(college);
            } else {
                collegeMap.set(exactKey, [college]);
            }
        }

        // Find all keys with more than 1 entry
        let duplicateCount = 0;
        let totalDuplicateRecords = 0;

        for (const [key, collegesList] of collegeMap) {
            if (collegesList.length > 1) {
                duplicateCount++;
                totalDuplicateRecords += collegesList.length;

                duplicates.push({
                    name: collegesList[0].name,
                    count: collegesList.length,
                    ids: collegesList.map(c => c._id.toString()),
                    exams: collegesList.map(c => c.examTypes.join(', ')),
                    cities: collegesList.map(c => c.location?.city || 'No City')
                });
            }
        }

        // Sort duplicates by count (highest first)
        duplicates.sort((a, b) => b.count - a.count);

        console.log(`\n======================================`);
        console.log(`DUPLICATE ANALYSIS REPORT`);
        console.log(`======================================`);
        console.log(`Total Active Colleges Scanned: ${allColleges.length}`);
        console.log(`Unique College Names Identified: ${duplicateCount}`);
        console.log(`Total Duplicate Records: ${totalDuplicateRecords}`);
        console.log(`\nTop Duplicates Found:\n`);

        for (let i = 0; i < Math.min(duplicates.length, 30); i++) {
            const dup = duplicates[i];
            console.log(`${i + 1}. ${dup.name} (${dup.count} instances)`);
            console.log(`   Cities: ${[...new Set(dup.cities)].join(' | ')}`);
            console.log(`   Exams: ${[...new Set(dup.exams)].filter(x => x).join(' | ')}`);
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
