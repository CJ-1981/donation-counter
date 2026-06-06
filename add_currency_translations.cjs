const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src/locales/en.json');
const koPath = path.join(__dirname, 'src/locales/ko.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const koJson = JSON.parse(fs.readFileSync(koPath, 'utf8'));

enJson.cashCounter.confirmCurrencyChange = 'Confirm Currency Change';
enJson.cashCounter.currencyChangeWarning = 'You have denomination counts in the current currency. Changing currency will reset all denomination counts to zero.';
enJson.cashCounter.changeCurrencyAndReset = 'Change Currency & Reset';

koJson.cashCounter.confirmCurrencyChange = '화폐 변경 확인';
koJson.cashCounter.currencyChangeWarning = '현재 화폐 단위로 계수된 데이터가 있습니다. 화폐 단위를 변경하면 모든 계수 데이터가 0으로 초기화됩니다.';
koJson.cashCounter.changeCurrencyAndReset = '화폐 변경 및 초기화';

fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
fs.writeFileSync(koPath, JSON.stringify(koJson, null, 2));

console.log("Added currency change translations!");
