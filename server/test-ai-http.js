import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, './.env') });

async function checkDirectHttp() {
  const apiKey = process.env.GEMINI_API_KEY;
  const urlV1 = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const urlV1Beta = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: "ping" }] }]
  };
  
  console.log("Checking v1...");
  try {
    const res = await axios.post(urlV1, payload);
    console.log("Success v1! Response:", res.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.log("Failed v1:", err.response?.data?.error?.message || err.message);
  }

  console.log("Checking v1beta...");
  try {
    const res = await axios.post(urlV1Beta, payload);
    console.log("Success v1beta! Response:", res.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.log("Failed v1beta:", err.response?.data?.error?.message || err.message);
  }
}

checkDirectHttp();
