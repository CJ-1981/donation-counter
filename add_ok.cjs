const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src/locales/en.json');
const koPath = path.join(__dirname, 'src/locales/ko.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const koJson = JSON.parse(fs.readFileSync(koPath, 'utf8'));

enJson.tracker.ok = 'OK';
koJson.tracker.ok = '확인';

fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
fs.writeFileSync(koPath, JSON.stringify(koJson, null, 2));

console.log("Added OK translation!");
