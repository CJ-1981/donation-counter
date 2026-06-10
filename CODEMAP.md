# Donation Counter - Code Map

> **Last updated**: 2026-06-04
> **Live URL**: https://cj-1981.github.io/donation-counter/
> **Repo**: https://github.com/CJ-1981/donation-counter

---

## Architecture Overview

Single-page application (SPA) with two main views, built as a **monolithic `index.html`** containing:
- React 19 + ReactDOM 19 (minified, inlined via `<script type="module">`)
- Tailwind CSS (CDN)
- CryptoJS AES (CDN)
- i18next library (CDN)
- shadcn/ui + Radix UI primitives (bundled inline)
- Vanilla JS donation tracker (embedded `<script>` block)
- Dark mode CSS overrides for Radix Select dropdowns

The app has **NO build step for the frontend** — the only build step (`build.js`) is for encrypting member names.

---

## File Structure

```
donation-counter/
├── index.html              ← THE ENTIRE APP (source of truth)
├── build.js                ← Node.js build script: encrypts members, outputs dist/
├── package.json            ← Only crypto-js dependency (for build.js)
├── package-lock.json
├── .github/
│   └── workflows/
│       └── deploy.yml      ← GitHub Actions CI/CD → GitHub Pages
└── CODEMAP.md              ← This file
```

**No `dist/` in repo** — it's generated during CI/CD from `index.html`.

---

## index.html — Section Map (Line Numbers)

| Lines | Section | Description |
|-------|---------|-------------|
| 1-14 | `localStorage` interceptor | Patches `localStorage.setItem` to dispatch `localstorage-change` CustomEvent for cross-component communication |
| 16-19 | `<head>` meta & CDN | CryptoJS 4.2.0, viewport meta (zoom disabled) |
| 20-87 | `<style>` — Dark mode fixes | CSS overrides for Radix Select dropdowns in dark mode (`bg-white` → `#1e293b` slate-800). Targets `[data-radix-popper-content-wrapper]`, `[data-slot="select-trigger"]`, `[role="listbox"]`, `[role="option"]` |
| 88-133 | `<script>` — Runtime dark patcher | JS MutationObserver + 500ms interval that force-patches Radix dropdown elements' inline styles when dark mode is active |
| 134-380 | **React 19 bundle (minified)** | Full React 19.2.4 + ReactDOM 19.2.4 + i18next + shadcn/ui components (Select, Tabs, etc.) — all inlined. The Cash Counter page renders here via React. |
| 388-389 | HTML — `</div>` trackers | End of tracker-app-container div |
| 370-386 | HTML — Custom modal | `#customModal` — reusable alert/confirm dialog with icon, title, description, cancel/confirm buttons |
| 391-393 | Global vars | `window.CURRENT_CURRENCY = '€'`, `window.CURRENT_LANG = 'ko'` |
| 395-456 | **i18n translation map** | `i18nMap.en` — Korean→English translations (60+ entries). Keys are Korean strings, values are English equivalents. |
| 458-467 | `t()` helper function | Translation function: checks `window.CURRENT_LANG`, looks up `i18nMap.en[text]`, falls back to original Korean text |
| 469-1182 | **Donation Tracker (vanilla JS)** | Complete donation tracking logic — see detailed map below |
| 1183-1253 | **Tab switching + swipe** | `switchTab()`, touch gesture handler (swipe left/right between Cash Counter and Donation Tracker) |
| 1256-1353 | **Cross-component sync** | `applyTranslations()`, `applyCurrency()`, `applyZoom()`, localStorage change event listeners |
| 1357-1378 | **Key Unlock Modal** | `#keyUnlockOverlay` — modal for entering AES decryption key |

---

## Donation Tracker Script (Lines 469-1182) — Detailed Map

### State & Constants
| Lines | Item | Description |
|-------|------|-------------|
| 472 | `ENCRYPTED_MEMBERS` | AES-encrypted JSON string; placeholder `__ENCRYPTED_MEMBERS_PLACEHOLDER__` replaced by `build.js` during CI/CD |
| 475 | `DEFAULT_MEMBERS` | Decrypted members array (populated after successful key unlock) |
| 478 | `membersUnlocked` | Boolean flag — controls auto-suggestion availability |
| 480-493 | `decryptMembers(key)` | Attempts CryptoJS.AES.decrypt, parses JSON, returns array or null |
| 496 | `DEFAULT_TYPES_KO` | `["십일조", "주일", "감사", "특별", "선교", "주일학교"]` — donation type names in Korean |
| 497 | `DEFAULT_TYPES` | `DEFAULT_TYPES_KO.map(x => t(x))` — translated donation types |
| 500-506 | `state` object | `{ members, donationTypes, selectedType, logs, focusedSearchIndex }` |
| 509-528 | DOM element refs | `memberInput`, `searchDropdown`, `amountInput`, `logsTableBody`, `typeSelectorGrid`, `customTypeInput`, `displaySum`, `displayCount`, `typeBreakdownList`, `clearAllBtn`, `exportCSVBtn`, `copyClipboardBtn`, `customModal`, `modalTitle`, `modalDescription`, `modalConfirmBtn`, `modalCancelBtn`, `modalIconContainer` |

### Initialization
| Lines | Function | Description |
|-------|----------|-------------|
| 531-577 | `window.onload` | Sets up unlock UI, restores members/types from localStorage, renders UI, attaches click-outside listener for dropdown |

### Member Auto-Complete
| Lines | Function | Description |
|-------|----------|-------------|
| 580-584 | `setAnonymous()` | Sets member name to "무명" (Anonymous), hides dropdown, focuses amount |
| 587-608 | `filterMemberSearch(value)` | Filters `state.members` by search term, calls `renderSearchDropdown()` |
| 610-643 | `renderSearchDropdown(matched, query)` | Renders dropdown with matched members or "register new" option |
| 645-675 | `handleSearchKeydown(event)` | Arrow up/down navigation, Enter to select, Escape to close |
| 678-687 | `highlightSearchItem(items)` | Visual highlight for focused dropdown item |
| 689-693 | `selectMember(name)` | Sets input value, hides dropdown, focuses amount |
| 696-704 | `addAndSelectMember(name)` | Adds new member to list, saves to localStorage, selects it |

### Key Unlock System
| Lines | Function | Description |
|-------|----------|-------------|
| 707-713 | `showKeyUnlockModal()` | Shows unlock overlay, focuses key input, hides error |
| 715-717 | `closeKeyUnlockModal()` | Hides unlock overlay |
| 719-758 | `submitKeyUnlock()` | Validates key, calls `decryptMembers()`, populates members, merges with localStorage, updates UI. On failure: shows error + shake animation |
| 761-778 | `updateUnlockUI(unlocked)` | Updates badge (ON/OFF) and lock icon (Heroicons lock-closed / lock-open outline) |
| 781-796 | `reopenKeyModal()` + Enter handler | Re-opens modal; DOMContentLoaded attaches Enter key listener to key input |

### Donation Type Selection
| Lines | Function | Description |
|-------|----------|-------------|
| 817-842 | `renderDonationTypeSelection()` | Renders grid of donation type buttons with active state styling |
| 845-851 | `selectType(type)` | Sets `state.selectedType`, syncs with custom input, re-renders |
| 854-864 | `handleTypeButtonKeydown(event, type)` | Space → select type, Enter → select + submit form |
| 867-871 | `handleCustomTypeInput(val)` | Handles free-text type input, live-updates button states |

### Form & Data Entry
| Lines | Function | Description |
|-------|----------|-------------|
| 874-921 | `handleFormSubmit(e)` | Validates name/amount/type, creates record with `crypto.randomUUID()`, pushes to `state.logs`, registers new members, re-renders, clears inputs, refocuses name field |

### Rendering
| Lines | Function | Description |
|-------|----------|-------------|
| 924-967 | `renderLogsTable()` | Renders reversed log entries in table with name, type badge, formatted amount (€), delete button per row |
| 970-1018 | `renderBreakdowns()` | Calculates total sum, per-type subtotals, percentages; updates display counters and breakdown list |

### Data Operations
| Lines | Function | Description |
|-------|----------|-------------|
| 1022-1038 | `deleteRow(recordId)` | Shows confirm modal, then splices log entry and re-renders |
| 1041-1054 | `clearAllEntriesWithWarning()` | Shows confirm modal, then clears all logs and re-renders |
| 1057-1059 | `saveMembersStateToStorage()` | Saves `state.members` to `localStorage('church_members_db')` |
| 1062-1108 | `copyToClipboard()` | Generates TSV, copies via `execCommand('copy')`, shows success/failure modal |
| 1112-1151 | `exportToCSV()` | Generates CSV with UTF-8 BOM, triggers download as `헌금_집계표_YYYY-MM-DD.csv` |

### Modal System
| Lines | Function | Description |
|-------|----------|-------------|
| 1154-1176 | `showCustomModal(title, text, showCancel, confirmAction, confirmText)` | Configures and shows the custom dialog |
| 1179-1181 | `closeModal()` | Hides the custom dialog |

---

## Tab Switching & Swipe (Lines 1183-1253)

| Lines | Function | Description |
|-------|----------|-------------|
| 1185 | `currentTab` | Tracks active tab: `'cash-counter'` or `'donation-tracker'` |
| 1187-1210 | `switchTab(tab)` | Toggles visibility of `#cash-counter-container` / `#tracker-app-container`, updates tab button styles |
| 1213-1253 | Swipe IIFE | Touch event listeners on document: `touchstart` → `touchend` → `handleSwipe()`. Threshold: 60px horizontal, 40% max vertical ratio. Swipe left → Donation Tracker, Swipe right → Cash Counter |

---

## Cross-Component Sync (Lines 1256-1353)

| Lines | Function | Description |
|-------|----------|-------------|
| 1257-1286 | `applyTranslations()` | Updates all `[data-i18n]` elements, `[data-i18n-placeholder]` elements, tab labels, re-renders donation types/logs/breakdowns |
| 1288-1307 | `applyCurrency(currencyCode)` | Maps currency code to symbol (EUR→€, USD→$, GBP→£, KRW→₩, JPY→¥), updates all `.currency-sym` elements |
| 1309-1320 | `applyZoom()` | Applies CSS zoom based on `localStorage('fontSize')`: normal=1, large=1.1, extraLarge=1.25 |
| 1322-1334 | `localstorage-change` listener | Listens for `i18nextLng` (language), `cashcounter_config` (currency), `fontSize` (zoom) changes |
| 1336-1353 | `DOMContentLoaded` init | Reads stored language, currency config; calls `applyTranslations()` + `applyZoom()` |

---

## i18n Translation Map (Lines 395-456)

All keys are Korean; English translations are in `i18nMap.en`:
- UI labels: Cash Counter, Donation Tracker, Name, Amount, Type, Submit, etc.
- Donation types: 십일조→Tithe, 주일→Sunday, 감사→Thanksgiving, 특별→Special, 선교→Mission, 주일학교→Sunday School
- Messages: validation errors, confirmations, copy success/failure
- Special: "Please enter the access key." / "Invalid key..." are reverse-mapped (English key → Korean value) for consistency

**`t(text)` function** (line 458): Only translates when `window.CURRENT_LANG === 'en'`. Default language is Korean.

---

## Key Unlock Modal HTML (Lines 1357-1378)

- `#keyUnlockOverlay` — fixed full-screen overlay with backdrop blur
- Password input with `autocomplete="off"`, centered monospace font, wide letter-spacing
- Error display (`#keyError`) — hidden by default
- Skip / Unlock buttons

---

## Build Pipeline (`build.js`)

| Step | Description |
|------|-------------|
| 1 | Read `MEMBERS` env var (JSON array) and `MEMBER_KEY` env var |
| 2 | Validate MEMBERS is non-empty JSON array |
| 3 | `CryptoJS.AES.encrypt(JSON.stringify(members), key)` → encrypted string |
| 4 | Read `index.html`, replace `__ENCRYPTED_MEMBERS_PLACEHOLDER__` with encrypted string |
| 5 | Write result to `dist/index.html` |

**GitHub Secrets used**: `MEMBERS`, `MEMBER_KEY`

---

## CI/CD (`.github/workflows/deploy.yml`)

| Step | Description |
|------|-------------|
| Trigger | Push to `main` or manual `workflow_dispatch` |
| Checkout | `actions/checkout@v4` |
| Node.js | `actions/setup-node@v4` with Node 20 |
| Install | `npm ci` (uses cached dependencies) |
| Build | `node build.js` with secrets `MEMBERS` + `MEMBER_KEY` → produces `dist/index.html` |
| Deploy | `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` → GitHub Pages |

---

## localStorage Keys

| Key | Value | Used By |
|-----|-------|---------|
| `i18nextLng` | `'ko'` or `'en'` | React Cash Counter sets this; vanilla JS reads it via `localstorage-change` event |
| `cashcounter_config` | JSON `{"currency":"EUR"}` | React Cash Counter sets this; vanilla JS reads for currency symbol |
| `fontSize` | `'normal'`, `'large'`, or `'extraLarge'` | Zoom control in Cash Counter |
| `church_members_db` | JSON array of member names | Donation Tracker — saved after unlock or new member registration |
| `church_donation_types` | JSON array of donation type names | Donation Tracker — persists custom types |

---

## Known Issues / TODOs

| Issue | Status | Notes |
|-------|--------|-------|
| Language dropdown white bg in dark mode | **Partial fix** | CSS overrides + runtime patcher applied, but Radix portal elements may still flash white on initial render |
| Mixed-language translations | Pending | Some UI strings appear in Korean even when English is selected (e.g., "Access Key Required" is hardcoded English in modal) |
| Swipe navigation between tabs | Implemented | Lines 1213-1253. 60px threshold, 40% vertical ratio tolerance |

---

## Key Design Decisions

1. **Monolithic index.html** — No framework build step. React + Tailwind loaded from CDN. The Cash Counter is a React app; the Donation Tracker is vanilla JS — both coexist in one file.
2. **AES-encrypted member names** — Member database is encrypted at build time using CryptoJS. The key is stored as a GitHub Secret. Users enter the key at runtime to unlock auto-suggestion.
3. **No date/time in records** — Donation records contain only: `id`, `name`, `amount`, `type`. Timestamps were intentionally removed per user request.
4. **Euro (€) default currency** — Configurable via Cash Counter settings. Currency symbol uses `.currency-sym` CSS class for easy replacement.
5. **localStorage bridge** — React (Cash Counter) and vanilla JS (Donation Tracker) communicate via a patched `localStorage.setItem` that fires custom events.
6. **Radix UI portal dark mode** — Required both CSS `!important` overrides and a runtime JS patcher because Radix renders dropdowns outside the DOM tree, missing the `dark` class context.
