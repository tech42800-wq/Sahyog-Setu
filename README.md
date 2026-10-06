# Jharkhand Sahyog Setu

**Bridging citizens, campuses and industry to solve Jharkhand's local challenges together.**

A prototype built for **SIH26043 — Societal Innovation Collaboration Portal**, proposed by the Government of Jharkhand. It gives citizens a single place to report a local problem, automatically routes that report to the university best equipped to research it, and lets institutions bring in CSR/industry partners to fund and implement the fix — with a state-wide analytics view over the whole pipeline.

## The problem

Civic complaints in India typically die in silos: there's no single channel connecting a citizen's report to a research institution with relevant expertise, and no visibility into whether anyone even saw it. Sahyog Setu's goal is to turn an isolated grievance into a tracked, routed, resourced project.

## Features

- **Citizen challenge submission** — a simple form (title, description, district, optional name and photo) that logs a new challenge in seconds.
- **AI-assisted classification** — each submission is classified into one of seven domains (Healthcare, Education, Agriculture, Water Management, Sanitation, Environment, Infrastructure) and routed to the best-matched university, via a call to the Claude API.
- **Offline fallback classifier** — if the AI call fails or is unavailable, a deterministic keyword-matching classifier (`localClassify`) takes over automatically, so the app never blocks a citizen from submitting.
- **Duplicate detection** — new reports are checked for title-word overlap against existing open reports and flagged as possible duplicates so institutions don't duplicate effort.
- **University dashboard** — per-institution view of routed challenges with search, status filtering, a five-stage status pipeline (`New → Under Review → Team Assigned → In Progress → Resolved`), automatic research-team assignment, and the ability to invite or remove CSR/industry partners per project.
- **Analytics dashboard** — submissions by domain, by district, by university and status, a submissions trend line, and a "before vs. after" impact comparison panel.
- **Light / dark theme** — a full design-token-based theme switch, not just a CSS class toggle.
- **Toast notifications** for every state-changing action.

## Tech stack

| Layer | Choice |
|---|---|
| UI framework | React (hooks + Context API, no external state library) |
| Charts | [Recharts](https://recharts.org/) |
| Icons | [lucide-react](https://lucide.dev/) |
| Styling | Tailwind CSS utility classes + inline design tokens |
| Fonts | Google Fonts — Fraunces (display) and Inter (body) |
| AI classification | Anthropic Claude API (`claude-sonnet-4-6`), called client-side with a keyword-based offline fallback |
| Data | In-memory only — seeded with 14 realistic mock challenges on load, no backend or persistence yet |

## Project structure

This prototype currently lives as a single component tree in `App.jsx`:

```
App.jsx
├── design tokens (LIGHT / DARK themes, ThemeContext)
├── mock data (districts, domains, universities, CSR partners, seed challenges)
├── classification (localClassify, aiClassify)
├── shared UI (SectionCard, Chip, StatusPill, EmptyState, Field, toasts)
├── Header / tab navigation
├── SubmitChallenge   → citizen-facing submission form + routing result
├── UniversityDashboard → per-institution challenge queue & status pipeline
├── AnalyticsDashboard  → charts + impact summary
└── AppShell / App      → top-level state, theming, routing between tabs
```

As the project grows, the natural next step is to split this into `src/components/`, `src/lib/classify.js`, `src/data/seed.js`, etc., and move state from `useState` into a backend-backed data layer (see **Roadmap**).

## Getting started

```bash
npm install
npm run dev
```

Requires a React + Vite (or equivalent) project scaffold with Tailwind CSS configured, and these dependencies:

```bash
npm install react react-dom recharts lucide-react
```

### AI classification

The app calls `https://api.anthropic.com/v1/messages` directly from the browser. This works inside the Claude.ai artifact sandbox, where the request is proxied and authenticated automatically, but **will not work as-is in a standalone deployment** — browsers can't safely hold an Anthropic API key, and the request has no auth header. For a real deployment:

1. Move `aiClassify` behind your own backend endpoint (e.g. `/api/routing/classify`).
2. Hold the Anthropic API key server-side only.
3. Keep `localClassify` as the client-visible fallback when the backend/API is unreachable — this resilience behavior is already built in and should be preserved.

## Known limitations

- **No persistence** — all challenges live in React state and reset on page reload.
- **No authentication or real roles** — anyone can act as "a university" by picking it from a dropdown.
- **No backend** — AI classification is called directly from the client, which is not production-safe (see above).
- **Duplicate detection is title-only** — it doesn't yet consider description text or district/domain context.
- **No SLA tracking or escalation** — a challenge can sit in any status indefinitely with no alert.

## Roadmap

- Backend API (Node/FastAPI) + database (PostgreSQL) to replace in-memory state
- Real authentication and role-based access per institution/partner
- SMS/WhatsApp status notifications for citizens
- Government oversight dashboard and funding accountability trail
- Multi-language support (Hindi and regional languages)

## Context

Built as a hackathon prototype (Smart India Hackathon, problem statement SIH26043) for the Government of Jharkhand's proposed Societal Innovation Collaboration Portal.
