# kc-spineguard

> [!IMPORTANT]
> **Medical Disclaimer & Early Pre-Release Notice:**
> - **Not Medical Advice:** kc-spineguard is a personal health tracking tool and **does not replace professional medical advice, diagnosis, or treatment**. Always consult your physician, physical therapist, or qualified healthcare provider regarding any spine, nerve, or musculoskeletal condition. Seek urgent emergency care immediately for "red flag" symptoms such as sudden progressive leg weakness, saddle anesthesia (numbness in the groin/buttocks), or loss of bowel/bladder control.
> - **Early Release:** This application is in an early stage of release and may contain bugs or undergo rapid feature iterations. Please report issues and feedback on [GitHub Discussions](https://github.com/genidma/kc-spineguard/discussions).

A personal sciatica management web app built with React, Vite, TypeScript, Tailwind CSS, and Firebase (Auth, Cloud Firestore with offline persistence, Cloud Functions, Hosting) — matching the architecture and profile settings patterns of `kc-rhythm`.

- **Live Production App:** [https://kc-spineguard.web.app](https://kc-spineguard.web.app)
- **Latest Release:** [v1.1.0](https://github.com/genidma/kc-spineguard/releases/tag/v1.1.0)

## Features

- **9 Log Types:** Pain (0–10 NRS, personal threshold, chronic/flare/acute, left/right body map, qualities, triggers), Pain Meds (medication class/kind, rolling-24h max & min-gap warnings), Pain Management (heat, ice, TENS, physio, etc.), Stretches, Posture, Weight, Mood, Cognition (focus, brain fog, memory), and Falls.
- **Today Dashboard:** Quick-log tiles, daily goals progress, 24h medication usage bars, and today's timeline.
- **Trends:** Pain vs. medications, weekly stretch minutes, weight, mood & cognition, and falls timeline across 7d / 30d / 90d.
- **Library:** Medication list with max daily dose, min hours between doses, and schedules; guided sciatica stretch library with built-in hold/rep timer and custom stretches.
- **Profile & Settings:** Medical profile, personal pain threshold, units (`kg`/`lb`, `cm`/`in`), week start (`Monday`/`Sunday`), quiet hours & auto dark mode, browser notifications & reminders, filterable CSV export, MFA (TOTP + backup codes), password change, and on-demand IP security log.

## Local Development

### With Firebase Emulators (no cloud credentials needed)
```bash
npm install
npm run emulators   # in terminal 1 (requires Java)
npm run dev:emu     # in terminal 2
```

### With a Live Firebase Project
Create `.env.local`:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
Then run `npm run dev`.

## Scripts

- `npm run lint` — TypeScript typecheck (`tsc --noEmit`)
- `npm run test:unit` — Vitest unit tests
- `npm run build` — Production build (`vite build`)
- `npm run test` — Playwright E2E tests