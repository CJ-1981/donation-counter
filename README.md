# Donation Counter

Church donation tracking web app with two main features: **Cash Counter** and **Donation Tracker**. Built as a single-page application deployed to GitHub Pages.

**Live**: https://cj-1981.github.io/donation-counter/

## Features

### Cash Counter
- Count cash denominations with + / - buttons
- Real-time total calculation
- Multi-currency support (EUR, USD, GBP, KRW, JPY)
- Dark mode toggle
- Font size adjustment (Normal / Large / Extra Large)
- Language switching (Korean / English)
- Swipe left/right to navigate to Donation Tracker

### Donation Tracker
- Add donation entries with member name, amount, and type
- Member name auto-suggestion (requires unlock key)
- Predefined donation types: Tithe, Sunday, Thanksgiving, Special, Mission, Sunday School
- Custom donation type input
- Per-type breakdown with percentages
- Export to CSV (Excel-compatible with UTF-8 BOM)
- Copy to clipboard as TSV (paste directly into Excel)
- Delete individual entries or clear all

### Security
- Member database encrypted with AES (CryptoJS)
- Encryption key stored as GitHub Secret
- Key input required at runtime to unlock auto-suggestion
- Plain text input works without the key

## Architecture

```text
donation-counter/
├── src/                # React source code
│   ├── components/     # Reusable UI components
│   ├── config/         # App configuration (currency, types)
│   ├── contexts/       # React contexts (FontSize, Theme)
│   ├── locales/        # i18next JSON translations
│   ├── pages/          # CashCounterPage, DonationTrackerPage
│   └── App.tsx         # Main entry component
├── package.json        # Dependencies (React, Vite, Tailwind, crypto-js)
├── build.cjs           # Encrypts member names, injects into index.html
├── vite.config.ts      # Vite configuration
└── index.html          # HTML entry point template
```

### Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, shadcn/ui, Radix UI, i18next
- **Encryption**: CryptoJS AES
- **CD**: GitHub Actions → GitHub Pages

### How It Works
- The entire application is a modular React SPA built with Vite.
- Local storage is heavily utilized to persist states, logs, and settings across sessions.
- `build.cjs` acts as a pre-deploy hook: it pulls the compiled `dist/index.html` from Vite, reads `MEMBERS` and `MEMBER_KEY` environment variables, encrypts the database, and injects it back into the production index file.
- Users must provide the decryption key at runtime inside the tracker tab to unlock the member auto-completion database.

## Setup

### Prerequisites
- Node.js 20+
- GitHub account with repository secrets configured

### GitHub Secrets
Set these in your repository settings (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `MEMBERS` | JSON array of member names, e.g. `["김철수","이영희","박민수"]` |
| `MEMBER_KEY` | AES encryption key (shared with app users) |

### Local Development
```bash
# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Build for production and inject encrypted members
MEMBERS='["John"]' MEMBER_KEY='secret' npm run build

# Preview production build locally
npm run preview
```

### Deployment
Push to `main` branch — GitHub Actions automatically triggers `npm run build` and deploys the `dist/` directory to GitHub Pages.

## Development Reference

See [CODEMAP.md](./CODEMAP.md) for a detailed code map with:
- Line-by-line section breakdown of `index.html`
- All function signatures and locations
- localStorage key documentation
- i18n translation map
- Cross-component communication patterns
- Known issues and design decisions
