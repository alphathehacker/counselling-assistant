import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, './.env') });

async function listAuthorizedModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  console.log("Fetching authorized models for this key...");
  try {
    const res = await axios.get(url);
    if(res.data.models) {
      console.log("Authorized models:");
      res.data.models.forEach(m => console.log(` - ${m.name}`));
    } else {
      console.log("No models returned.");
    }
  } catch (err) {
    if(err.response?.status === 403) {
      console.log("Error 403: Permission Denied. This usually means the API key is restricted or the 'Generative Language API' is NOT enabled for the project.");
    } else {
      console.log("Failed to list models:", err.response?.data?.error?.message || err.message);
    }
  }
}

listAuthorizedModels();
