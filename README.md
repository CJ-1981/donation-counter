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

```
donation-counter/
├── index.html          # Entire application (React 19 + vanilla JS)
├── build.js            # Encrypts member names, outputs dist/
├── package.json        # crypto-js dependency (for build only)
├── CODEMAP.md          # Detailed code reference with line numbers
├── .github/
│   └── workflows/
│       └── deploy.yml  # CI/CD → GitHub Pages
└── README.md           # This file
```

### Tech Stack
- **Frontend**: React 19, Tailwind CSS, shadcn/ui, Radix UI, i18next
- **Tracker**: Vanilla JavaScript
- **Encryption**: CryptoJS AES
- **CD**: GitHub Actions → GitHub Pages

### How It Works
- `index.html` is the source file containing both the React Cash Counter and the vanilla JS Donation Tracker
- `build.js` encrypts member names using `MEMBERS` and `MEMBER_KEY` environment variables
- GitHub Actions runs `build.js`, producing `dist/index.html` with the encrypted data
- The built `dist/index.html` is deployed to GitHub Pages
- Users enter the decryption key in the app to unlock member auto-suggestion

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
# Install dependencies (for build script only)
npm install

# Build with local env vars (optional)
MEMBERS='["name1","name2"]' MEMBER_KEY='your-key' node build.js

# Or simply open index.html directly in a browser
# (auto-suggestion will be disabled without encrypted data)
```

### Deployment
Push to `main` branch — GitHub Actions automatically builds and deploys to GitHub Pages.

## Development Reference

See [CODEMAP.md](./CODEMAP.md) for a detailed code map with:
- Line-by-line section breakdown of `index.html`
- All function signatures and locations
- localStorage key documentation
- i18n translation map
- Cross-component communication patterns
- Known issues and design decisions
