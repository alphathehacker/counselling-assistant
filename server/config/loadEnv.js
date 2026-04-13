import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This module ensures environment variables are loaded relative to the server folder
// It must be imported before any other module that depends on process.env
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

console.log('✓ Environment variables loaded from:', envPath);
export default process.env;
