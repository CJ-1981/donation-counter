const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src/locales/en.json');
const koPath = path.join(__dirname, 'src/locales/ko.json');

try {
  const enContent = fs.readFileSync(enPath, 'utf8');
  const koContent = fs.readFileSync(koPath, 'utf8');

  const enJson = JSON.parse(enContent);
  const koJson = JSON.parse(koContent);

  if (!enJson.tracker) {
    console.error("en.json missing 'tracker' property");
    process.exit(1);
  }
  if (!koJson.tracker) {
    console.error("ko.json missing 'tracker' property");
    process.exit(1);
  }

  enJson.tracker.ok = 'OK';
  koJson.tracker.ok = '확인';

  fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
  fs.writeFileSync(koPath, JSON.stringify(koJson, null, 2));

  console.log("Added OK translation!");
} catch (error) {
  console.error("Failed to update translation files:", error.message);
  process.exit(1);
}
