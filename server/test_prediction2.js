import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    const loginRes = await axios.post(`${API_URL}/auth/admin/login`, {
        email: 'admin@admin.com',
        password: 'adminpassword123'
    });
    const token = loginRes.data.token;

    const res = await axios.post(`${API_URL}/prediction2/predict`, {
        examType: 'AP EAPCET',
        rank: 1000,
        category: 'OC_BOYS',
        districts: ['West Godavari'],
        preferredBranches: ['CSE']
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Result count:', res.data.count);
    if (res.data.predictions.length > 0) {
        console.log('First prediction:', res.data.predictions[0].college_name, '-', res.data.predictions[0].branch);
    }
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

test();
