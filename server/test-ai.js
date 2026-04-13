import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, './.env') });

async function listAllModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // This might not work on older SDKs, but let's try
  try {
     // Fetching model list manually if needed, but let's try the library way
     // Note: There is no direct "listModels" on GenAI in standard web/node SDK sometimes
     // Instead, let's try a very specific one: "gemini-1.5-flash-latest"
     console.log("Testing gemini-1.5-flash-latest...");
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
     const result = await model.generateContent("ping");
     console.log("Success with latest:", result.response.text());
  } catch (err) {
     console.log("Failed with latest:", err.message);
     
     // Maybe it's not a google key?
     if(apiKey.startsWith("AIza")) {
        console.log("Key looks like a valid GCP/AI Studio key.");
     } else {
        console.log("Key looks unusual.");
     }
  }
}

listAllModels();
