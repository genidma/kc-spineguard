# Forward Engineering Task Tracker (kc-spineguard)

> [!TIP]
> ### ❤️ THE WHY: Purpose, Humanity & Impact
> Empowering individuals living with sciatica to reclaim control, prevent debilitating flare-ups, and track progress with dignified, reliable personal health data.

---

## 🎯 Current Operational Focus

```diff
+ ╔════════════════════════════════════════════════════════════════════════════╗
+ ║  ┌──────────────────────────────────────────────────────────────────────┐  ║
+ ║  │ ⏰ TIMESTAMP: 2026-11-14 12:38 EST / 17:38 UTC                       │  ║
+ ║  │ 🎯 PRIMARY TARGET: #6 — Add Deep Flat-Foot Squat (Malasana) Stretch  │  ║
+ ║  │    Branch Context: main                                              │  ║
+ ║  │    Active Repo: https://github.com/genidma/kc-spineguard             │  ║
+ ║  └──────────────────────────────────────────────────────────────────────┘  ║
+ ╚════════════════════════════════════════════════════════════════════════════╝
+ ╔═════════════════════════════════════════════════╗
+ ║  ┌───────────────────────────────────────────────┐  ║
+ ║  │ 🎯 NEXT PRIORITY 1: #7 — Cognition Redesign   │  ║
+ ║  └───────────────────────────────────────────────┘  ║
+ ╚═════════════════════════════════════════════════╝
+ ╔═════════════════════════════════════════════════╗
+ ║  ┌───────────────────────────────────────────────┐  ║
+ ║  │ 🎯 NEXT PRIORITY 2: #2 — Weight & Ratio Target │  ║
+ ║  └───────────────────────────────────────────────┘  ║
+ ╚═════════════════════════════════════════════════╝
```

### 📋 High-Level Action Checklist

| Priority | Issue / Task | Description | Status | Target / Destination |
| :---: | :--- | :--- | :--- | :--- |
| 🥇 | **#6 (Highest)** | Add deep flat-foot squat (Malasana / Asian squat) to stretch library | 🟢 Ready | `src/lib/stretches.ts`, Library & Log |
| 🥈 | **#7 (High)** | Redesign cognition tracker & trends (memory metric & brain fog scale) | 🟡 Backlog | LogEditor, TrendsView (relates to #5) |
| 🥉 | **#2 (High)** | Track logged weight against height & gender ratio (BMI / IBW) | 🟡 Backlog | Profile, Weight Log & Trends View |
| 4️⃣ | **#5 (Under Review)** | Investigate mood & cognition multiple entries per day behavior | 🟡 Under Review | Closed candidate pending user testing |
| 5️⃣ | **#3 (Medium)** | Multi-factor authentication (MFA) server-side enforcement | 🟡 Backlog | Firebase Identity Platform / Functions |
| 6️⃣ | **#1 (Low / Nice-to-have)** | IP Security Log Cloud Function & Blaze deployment | ⏸️ On Hold | Cloud Functions (`logUserIP`) on Blaze |

---

### 🏆 Recently Completed Milestones

- [x] **v1.1.0-Cycle: Issue #5 (Mood & Cognition Intraday Points & Emojis)**: Numerical 1–5 labels under emojis in modal and exact matching emojis on Trends Y-axis (`7377bd8`, `278ca6f`) ✅
- [x] **v1.1.0-Cycle: Dependabot Vulnerability Zero**: Resolved 28 dependencies to 0 vulnerabilities (`fa86bfb`) ✅
- [x] **v1.1.0-Cycle: Issue #4 (Trends Date Ranges & UI Layout)**: Added 1d, 2d, 3d, 7d, 30d, 90d, 180d date ranges and streamlined header layout (`e88fc9f`, `7ca6bb3`) ✅
- [x] **v1.0.0 Initial Production Release**: Full app scaffolding, 9 log types, dose safety engine, guided sciatica stretches + timer, profile settings, offline Firestore sync, and live Firebase Hosting deployment (`75cdfb6`, `v1.0.0`) ✅
- [x] **v1.1.0 Inception**: Draft release notes initialized with start timestamp 11:56 AM EST / 16:56 UTC (`c3adf19`) ✅

---

## 📋 Task Matrix

### 1. #6 — Add Deep Flat-Foot Squat (Malasana) Stretch
- **In-Issue Search String ➡️ :** `'[DEEP-SQUAT-STRETCH]'`
- **Assignee:** `@genidma` (Lead) / `AGY` (Antigravity)
- **Status:** 🟢 Ready for implementation
- **Key Deliverables:**
  - Add "Deep squat (Malasana / flat-foot squat)" to `BUILT_IN_STRETCHES` in `src/lib/stretches.ts`
  - Include hold timer and step-by-step lumbar decompression instructions
  - Ensure it appears in stretch logging dropdown and Library

### 2. #7 — Redesign Cognition Tracker & Trends
- **In-Issue Search String ➡️ :** `'[COGNITION-REDESIGN]'`
- **Assignee:** `@genidma` (Lead) / `AGY` (Antigravity)
- **Status:** 🟡 Backlog (relates to #5)
- **Key Deliverables:**
  - Add missing `memory` line to Trends chart
  - Address scale inversion dilemma for brain fog (clear vs foggy polarity)
  - Prevent visual overlap between mood and 3 cognitive metrics

### 3. #2 — Track Weight Against Height & Gender Ratio
- **In-Issue Search String ➡️ :** `'[TRACK-WEIGHT-RATIO]'`
- **Assignee:** `@genidma` (Lead) / `AGY` (Antigravity)
- **Status:** 🟡 Backlog
- **Key Deliverables:**
  - Gender selector in Profile (`Female`, `Male`, `Other / Prefer not to say`)
  - Height editor in Profile (`cm` / `in`)
  - Gender-adjusted healthy target weight calculation (Devine/Robinson IBW + BMI band)
  - Visual target band on the Weight Trends chart
  - Distance-to-target indicator on the Weight quick-log modal

### 4. #3 — Multi-Factor Authentication (MFA) Hardening
- **In-Issue Search String ➡️ :** `'[MFA-HARDENING]'`
- **Assignee:** `@genidma` (Lead) / `AGY` (Antigravity)
- **Status:** 🟡 Backlog (Medium Priority)
- **Key Deliverables:**
  - Audit client-side TOTP session tokens
  - Evaluate Firebase Identity Platform native MFA options
  - Refine recovery code redemption flow

### 5. #1 — IP Security Log Cloud Function Deployment
- **In-Issue Search String ➡️ :** `'[IP-SECURITY-LOG]'`
- **Assignee:** `@genidma` (Lead)
- **Status:** ⏸️ On Hold (Waiting for Firebase Blaze plan upgrade)
- **Key Deliverables:**
  - Upgrade Firebase project to Blaze
  - Deploy `logUserIP` Cloud Function via `firebase deploy --only functions`

---

## 📌 Initiative Metadata & Lineage

- **Initiative:** `kc-spineguard` Production Release & Lifecycle Roadmap
- **Status:** Active (v1.1.0 Cycle)
- **Repository:** `genidma/kc-spineguard`
- **Production URL:** [https://kc-spineguard.web.app](https://kc-spineguard.web.app)
- **Active Release:** [v1.0.0](https://github.com/genidma/kc-spineguard/releases/tag/v1.0.0)
- **Target Release:** `v1.1.0` (In Progress)
