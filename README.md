# Jharkhand Sahyog Setu

**PS ID:** SIH26043 · **Organization:** Government of Jharkhand · **Theme:** MedTech/BioTech/HealthTech · **Category:** Software

A societal innovation collaboration portal where citizens report local problems — health, education, water, farming, sanitation, infrastructure — and an AI classification engine automatically routes each report to the best-matched university. University teams then work on it with industry/CSR support, tracked through to resolution on a public analytics dashboard.

This is a **frontend-only prototype** — no backend, no database, no login. All data is seeded/mocked in the browser session.

---

## Features

- **Submit Challenge** — citizens report a problem with title, description, district, and photo. AI predicts the domain, routes it to a matched university, and flags likely duplicates.
- **University Dashboard** — review challenges routed to an institution, move them through a status pipeline (New → Under Review → Team Assigned → In Progress → Resolved), assign student-faculty teams, invite industry/CSR partners.
- **Analytics Dashboard** — charts for submissions by domain, district, and institutional participation, plus a Before/After impact comparison.
- **Light/Dark theme** toggle.
- Realistic seeded Indian mock data (names, districts, dates).

## Tech stack

- React (functional components + hooks)
- Tailwind CSS
- Recharts (charts)
- lucide-react (icons)
- Vite (dev server / build tool)

---

## Project structure

This repo ships the core `App.jsx`. To run it, it needs to sit inside a small Vite scaffold like this:

```
jharkhand-sahyog-setu/
├── index.html
├── package.json
├── vite.config.js
├── postcss.config.js
├── tailwind.config.js
└── src/
    ├── main.jsx
    ├── index.css
    └── App.jsx        ← the file from this repo
```

If your repo currently only contains `App.jsx`, place it at `src/App.jsx` after creating the scaffold files below (ask for them if you don't have them yet).

---

## Prerequisites (all platforms)

Install **Node.js** (v18 or later, which includes `npm`):

- Download from [nodejs.org](https://nodejs.org/) (choose the **LTS** version), or
- Verify an existing install by running `node -v` and `npm -v` in a terminal.

---

## Setup & run — Windows

1. Install [Node.js LTS](https://nodejs.org/) using the Windows installer (`.msi`). Accept the default options.
2. Open **Command Prompt** or **PowerShell**.
3. Clone the repo:
   ```
   git clone https://github.com/<your-username>/jharkhand-sahyog-setu.git
   cd jharkhand-sahyog-setu
   ```
4. Install dependencies:
   ```
   npm install
   ```
5. Start the dev server:
   ```
   npm run dev
   ```
6. Open the URL shown in the terminal (usually `http://localhost:5173`) in your browser.

> If `npm` isn't recognized, restart your terminal after installing Node.js so your `PATH` updates, or reboot your machine.

---

## Setup & run — macOS

1. Install Node.js either via the [official installer](https://nodejs.org/) or with [Homebrew](https://brew.sh/):
   ```
   brew install node
   ```
2. Open **Terminal**.
3. Clone the repo:
   ```
   git clone https://github.com/<your-username>/jharkhand-sahyog-setu.git
   cd jharkhand-sahyog-setu
   ```
4. Install dependencies:
   ```
   npm install
   ```
5. Start the dev server:
   ```
   npm run dev
   ```
6. Open the URL shown in the terminal (usually `http://localhost:5173`) in your browser.

---

## Setup & run — Linux

1. Install Node.js via your package manager, or [nvm](https://github.com/nvm-sh/nvm) (recommended for version control):
   ```
   # Debian/Ubuntu
   sudo apt update
   sudo apt install nodejs npm

   # Or via nvm (any distro)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   nvm install --lts
   ```
2. Open a terminal.
3. Clone the repo:
   ```
   git clone https://github.com/<your-username>/jharkhand-sahyog-setu.git
   cd jharkhand-sahyog-setu
   ```
4. Install dependencies:
   ```
   npm install
   ```
5. Start the dev server:
   ```
   npm run dev
   ```
6. Open the URL shown in the terminal (usually `http://localhost:5173`) in your browser.

---

## Building for production (all platforms)

```
npm run build
```

This generates a `dist/` folder with static files you can deploy to any static host (Vercel, Netlify, GitHub Pages, etc.).

To preview the production build locally:
```
npm run preview
```

---

## Notes

- The AI classification feature calls an LLM API for domain classification and university routing. If the API call fails or is unavailable, the app automatically falls back to a local keyword-based classifier — no functionality is lost offline.
- No environment variables, API keys, or database setup are required to run this prototype.

---

## License

Prototype built for Smart India Hackathon (SIH26043), Government of Jharkhand.
