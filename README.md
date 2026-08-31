# BeWell

A calm period tracking web app: see your cycle phase, log days on a calendar, and browse history by year.

## Features

- **Home** — circular cycle view with current phase and a center button to update tracking
- **Calendar** — month view to mark period days and flow
- **History** — past cycles in collapsible year sections

Data is stored on the server per account (login session + cycle logs). Local cache is kept for faster loads and offline fallback.

## Account storage

- Sign up / log in creates a secure session tied to your account
- Cycle data saves to your account on the server
- On Vercel production, set `AUTH_SECRET` and connect a Redis store (Upstash) — see `.env.example`

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Built for Vercel (`npm run build`).
