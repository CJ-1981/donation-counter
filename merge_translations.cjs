const fs = require('fs');
const path = require('path');

try {
  const enPath = path.join(__dirname, 'src/locales/en.json');
  const koPath = path.join(__dirname, 'src/locales/ko.json');

  const enContent = fs.readFileSync(enPath, 'utf8');
  const koContent = fs.readFileSync(koPath, 'utf8');

  const enJson = JSON.parse(enContent);
  const koJson = JSON.parse(koContent);

  const translations = {
    "유효하지 않은 키입니다. 자동완성이 잠금 상태로 유지됩니다.": { key: "invalidKey", en: "Invalid key. Autocomplete remains locked." },
    "알림": { key: "notification", en: "Notification" },
    "성명을 입력해 주십시오.": { key: "enterName", en: "Please enter a name." },
    "금액을 올바르게 입력해 주십시오.": { key: "enterAmount", en: "Please enter a valid amount." },
    "헌금 종류를 입력해 주십시오.": { key: "enterType", en: "Please enter a donation type." },
    "기록 삭제": { key: "deleteRecord", en: "Delete Record" },
    "전체 삭제": { key: "deleteAll", en: "Delete All" },
    "전체삭제": { key: "deleteAllShort", en: "Delete All" },
    "기록된 모든 데이터가 삭제됩니다. 진행하시겠습니까?": { key: "confirmDeleteAll", en: "All recorded data will be deleted. Proceed?" },
    "헌금_집계표_": { key: "exportFilenamePrefix", en: "Donation_Report_" },
    "복사 완료": { key: "copySuccess", en: "Copy Success" },
    "클립보드에 복사되었습니다. 엑셀 등 스프레드시트 프로그램의 원하는 셀을 선택하고 붙여넣기(Ctrl+V)를 하시면 됩니다.": { key: "copySuccessDesc", en: "Copied to clipboard. You can paste it (Ctrl+V) into Excel or any spreadsheet." },
    "복사 실패": { key: "copyFailed", en: "Copy Failed" },
    "브라우저 정책상 복사가 차단되었습니다. 다운로드 기능을 이용해 주십시오.": { key: "copyFailedDesc", en: "Copy blocked by browser policy. Please use the download feature." },
    "자동완성 ON": { key: "autoCompleteOn", en: "Autocomplete ON" },
    "자동완성 OFF": { key: "autoCompleteOff", en: "Autocomplete OFF" },
    "👤 무명": { key: "anonymous", en: "👤 Anonymous" },
    "무명": { key: "anonymousRaw", en: "Anonymous" },
    "헌금 종류 선택 및 입력": { key: "selectDonationType", en: "Select Donation Type" },
    "직접 입력:": { key: "customInput", en: "Custom:" },
    "종류 직접 입력": { key: "customInputPlaceholder", en: "Enter custom type" },
    "입력 완료": { key: "submit", en: "Submit" },
    "계수 완료 총액": { key: "totalAmount", en: "Total Amount Counted" },
    "총 건수": { key: "totalCount", en: "Total Transactions" },
    "단위 화폐": { key: "currencyUnit", en: "Currency" },
    "분류별 소계": { key: "subtotals", en: "Subtotals by Type" },
    "금일 계수 명단": { key: "todayRecords", en: "Today's Records" },
    "기록이 없습니다.": { key: "noRecords", en: "No records." },
    "클립보드 복사": { key: "copyClipboard", en: "Copy to Clipboard" },
    "(엑셀 붙여넣기용)": { key: "forExcelPaste", en: "(For Excel Paste)" },
    "엑셀 다운로드": { key: "downloadExcel", en: "Download Excel" },
    "액세스 키 필요": { key: "accessKeyRequired", en: "Access Key Required" },
    "회원명 자동완성을 잠금 해제하려면 키를 입력하세요.": { key: "enterKeyToUnlock", en: "Enter the key to unlock member autocomplete." },
    "키 없이도 일반 텍스트 입력을 사용할 수 있습니다.": { key: "canUseWithoutKey", en: "You can still use plain text input without a key." },
    "취소": { key: "cancel", en: "Cancel" },
    "잠금 해제": { key: "unlock", en: "Unlock" },
    "주일": { key: "sunday", en: "Sunday" },
    "십일조": { key: "tithe", en: "Tithe" },
    "감사": { key: "thanksgiving", en: "Thanksgiving" },
    "선교/구제": { key: "missions", en: "Missions/Relief" },
    "특별헌금": { key: "special", en: "Special Offering" },
    "주일학교": { key: "sundaySchool", en: "Sunday School" },
    "성명": { key: "name", en: "Name" },
    "금액": { key: "amount", en: "Amount" },
    "종류": { key: "type", en: "Type" },
    "회원 검색 (이름 또는 초성)...": { key: "searchMember", en: "Search member (name or initial)..." },
    "회원 이름을 입력하세요": { key: "enterMemberName", en: "Enter member name" }
  };

  let enTracker = {};
  let koTracker = {};

  for (const [koString, mapping] of Object.entries(translations)) {
    enTracker[mapping.key] = mapping.en;
    koTracker[mapping.key] = koString;
  }

  enJson.tracker = { ...enJson.tracker, ...enTracker };
  koJson.tracker = { ...koJson.tracker, ...koTracker };

  fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
  fs.writeFileSync(koPath, JSON.stringify(koJson, null, 2));

  console.log("Merged translations into en.json and ko.json!");
} catch (error) {
  console.error("Failed to merge translations:", error.message);
  process.exit(1);
}
