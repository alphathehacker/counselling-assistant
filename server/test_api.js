import 'dotenv/config';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/User.js';

async function testFetch() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'sankarkorlapati@gmail.com' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    try {
        const statsRes = await axios.get('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Stats from /me:', JSON.stringify(statsRes.data.user.statistics));

        const resultsRes = await axios.get('http://localhost:5000/api/prediction/results', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Results array length:', resultsRes.data.predictionResults.length);
    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
    process.exit(0);
}

testFetch();
