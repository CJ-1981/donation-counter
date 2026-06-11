# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Donation Counter is a church donation tracking web app with two main features: **Cash Counter** (React 19) and **Donation Tracker** (vanilla JavaScript). The entire application is built as a **single-page application in one `index.html` file** with no frontend build step—only a Node.js build script for encrypting member names.

**Live**: https://cj-1981.github.io/donation-counter/

## Common Development Commands

### Local Development
```bash
# Install dependencies (build script only)
npm install

# Open the app directly in browser (no build required for frontend)
# Just open index.html in a browser - auto-suggestion will be disabled without encrypted data

# Build with local environment variables (optional, for testing encryption)
MEMBERS='["name1","name2"]' MEMBER_KEY='your-key' node build.js
```

### Build and Deployment
```bash
# Production build (requires GitHub Actions secrets)
npm run build    # Runs: node build.js

# Deploy
git push origin main    # GitHub Actions automatically builds and deploys
```

### Required Environment Variables
Build requires `MEMBERS` (JSON array) and `MEMBER_KEY` (AES encryption key) to be set. In production, these are GitHub Secrets.

## Architecture

### Single-File Architecture
The entire application exists in `index.html` (1381 lines). There is **no frontend build step**—React, Tailwind CSS, CryptoJS, and i18next are loaded via CDN and inlined.

```
index.html structure:
├── Lines 1-14:    localStorage interceptor for cross-component events
├── Lines 16-87:   Dark mode CSS fixes for Radix UI dropdowns  
├── Lines 88-133:  Runtime MutationObserver for dark mode patching
├── Lines 134-380: React 19 bundle + Cash Counter app (minified, inlined)
├── Lines 391-456: i18n translation map (Korean ↔ English)
├── Lines 469-1182: Donation Tracker (vanilla JavaScript)
├── Lines 1183-1253: Tab switching + swipe gesture handling
└── Lines 1256-1353: Cross-component synchronization
```

### Two Separate Systems

**Cash Counter (React 19)**:
- Lines 134-380 in `index.html`
- Uses React 19, Tailwind CSS, shadcn/ui Select, Tabs components
- Multi-currency support (EUR, USD, GBP, KRW, JPY)
- Dark mode toggle and font size adjustment
- Language switching (Korean/English)

**Donation Tracker (Vanilla JavaScript)**:
- Lines 469-1182 in `index.html`  
- Pure DOM manipulation with no framework
- Member name auto-suggestion (requires unlock key)
- Predefined donation types (Tithe, Sunday, Thanksgiving, Special, Mission, Sunday School)
- CSV export with UTF-8 BOM for Excel compatibility
- TSV clipboard copy for direct Excel paste

### Cross-Component Communication

The two systems communicate via **CustomEvent dispatch on localStorage.setItem**:

```javascript
// Lines 1-14: localStorage interceptor
localStorage.setItem = function(key, value) {
    const event = new CustomEvent('localstorage-change', { detail: { key, value } });
    window.dispatchEvent(event);
    originalSetItem.apply(this, arguments);
};
```

React Cash Counter writes to localStorage; vanilla JS Donation Tracker listens for `localstorage-change` events to sync language, currency, and zoom settings.

### Tab Switching with Swipe Gestures

Users can switch between Cash Counter and Donation Tracker via:
- Tab buttons at the top
- **Swipe left/right** touch gestures (60px threshold, 40% max vertical ratio)

See `switchTab()` function and swipe gesture handler (lines 1183-1253).

### Security Architecture

Member names are encrypted with **CryptoJS AES**:

1. `build.js` reads `MEMBERS` JSON array and `MEMBER_KEY` from environment
2. Encrypts using CryptoJS.AES.encrypt()
3. Replaces `__ENCRYPTED_MEMBERS_PLACEHOLDER__` in `index.html`
4. Outputs `dist/index.html` with encrypted data
5. App prompts user for decryption key at runtime
6. Auto-suggestion unlocks only after successful key entry

The `ENCRYPTED_MEMBERS` placeholder is at **line 472** of `index.html`.

### Build Process

**`build.js`** is the only build tool:

- Encrypts member names using CryptoJS AES
- Reads `index.html` source
- Replaces placeholder with encrypted data
- Outputs `dist/index.html` for deployment

No bundling, no transpilation, no frontend build step.

### GitHub Actions CI/CD

`.github/workflows/deploy.yml`:

1. Triggers on push to `main` branch
2. Runs `npm ci` and `node build.js` with GitHub Secrets
3. Uploads `dist/` as GitHub Pages artifact
4. Deploys to GitHub Pages

## Important Implementation Details

### Dark Mode Fixes for Radix Select

Radix UI Select dropdowns escape React's dark mode context, requiring:

1. **CSS overrides** (lines 20-87): Target `[data-radix-popper-content-wrapper]` with `!important` rules
2. **Runtime patcher** (lines 88-133): MutationObserver + 500ms interval that force-patches escaped elements

When adding new Radix components, you may need to extend these fixes.

### i18n Translation System

Translation map at **lines 395-456** (`i18nMap.en`):

```javascript
i18nMap.en = {
    "십일조": "Tithe",
    "주일": "Sunday",
    "감사": "Thanksgiving",
    // ... 60+ entries
};
```

The `t()` function (lines 458-467) checks `window.CURRENT_LANG` and returns translated text or falls back to Korean.

### Donation Type System

**Predefined types** (line 496): `["십일조", "주일", "감사", "특별", "선교", "주일학교"]`

These are the only donation types supported. New types require extending:
1. `DEFAULT_TYPES_KO` array
2. `i18nMap.en` translations
3. Type button grid in HTML

### localStorage Keys

```javascript
'church_members_db'      // Member names array
'church_donation_types'  // Custom donation types
'donation_logs'          // Donation entries
```

See CODEMAP.md for complete localStorage documentation.

## When Working with This Codebase

### Editing index.html

- **Line numbers are critical** — Use CODEMAP.md as reference (each section has documented line ranges)
- **Search before editing** — The file is 1381 lines with mixed React (minified) and vanilla JS
- **Test both tabs** — Changes to one system may break the other via cross-component events
- **Check dark mode** — Verify Radix dropdown styling in both light and dark modes

### Adding New Features

- **Cash Counter changes**: Edit React bundle section (lines 134-380) — requires understanding minified React code
- **Donation Tracker changes**: Edit vanilla JS section (lines 469-1182) — more straightforward DOM manipulation
- **Cross-component changes**: Update both sections and ensure localStorage events are dispatched correctly

### Debugging

- **Cash Counter**: Check React component state, localStorage writes, and Radix Select rendering
- **Donation Tracker**: Check vanilla JS console logs, DOM element references, and event listeners
- **Sync issues**: Verify localStorage CustomEvent is firing and listeners are registered
- **Dark mode**: Open browser DevTools, inspect Radix dropdowns, check if CSS overrides are applying

### Extending Donation Types

To add new donation types:
1. Add Korean name to `DEFAULT_TYPES_KO` (line 496)
2. Add English translation to `i18nMap.en` (lines 395-456)
3. Update type button grid HTML (search for existing type buttons)
4. Test in both Korean and English modes

### Security Considerations

- **Never commit unencrypted member names** to `index.html`
- **Never commit `MEMBER_KEY`** to repository — use GitHub Secrets
- **Test key unlock flow** before deploying — verify encrypt/decrypt works end-to-end
- **Validate MEMBERS format** — must be valid JSON array string

## Reference Documentation

- **CODEMAP.md**: Detailed line-by-line breakdown of `index.html`, function signatures, localStorage keys, i18n map, and cross-component patterns
- **README.md**: User-facing features, setup instructions, and deployment overview

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, shadcn/ui, Radix UI, i18next
- **Tracker**: Vanilla JavaScript (DOM manipulation)
- **Encryption**: CryptoJS AES
- **CD/CI**: GitHub Actions → GitHub Pages
- **Runtime**: Browser-only (no backend server)
