import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const user = await User.findOne({ email: { $exists: true } });

        if (!user) {
            console.error("No user found in DB to test with");
            process.exit(1);
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

        const reqUrl = 'http://localhost:5000/api/prediction/colleges';

        try {
            const res = await axios.get(reqUrl, {
                params: { examType: 'JEE Advanced', limit: 1000, page: 1 },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("JEE Advanced Colleges returned:", res.data.colleges.length);

            const res2 = await axios.get(reqUrl, {
                params: { examType: 'JEE Main', limit: 1000, page: 1 },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("JEE Main Colleges returned:", res2.data.colleges.length);
        } catch (err) {
            console.error("API request failed:", err.message);
        }
        mongoose.connection.close();

    } catch (e) {
        console.error('Script Error:', e.message);
        mongoose.connection.close();
    }
})();
