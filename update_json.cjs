const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src/locales/en.json');
const koPath = path.join(__dirname, 'src/locales/ko.json');

try {
  const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const koJson = JSON.parse(fs.readFileSync(koPath, 'utf8'));

  if (!enJson.tracker) enJson.tracker = {};
  if (!koJson.tracker) koJson.tracker = {};

  enJson.tracker.countUnit = '';
  koJson.tracker.countUnit = '건';

  fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
  fs.writeFileSync(koPath, JSON.stringify(koJson, null, 2));

  console.log("Added countUnit!");
} catch (error) {
  console.error("Failed to update JSON files:", error.message);
  process.exit(1);
}
