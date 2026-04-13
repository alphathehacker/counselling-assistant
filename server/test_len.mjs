import fs from 'fs';

const p = "c:\\Users\\balak\\OneDrive\\Desktop\\admission predictor\\src\\pages\\bookmarks-saved-colleges\\index.jsx";

const data = fs.readFileSync(p, 'utf8');
console.log(data.length);
