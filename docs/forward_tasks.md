# Forward Engineering Task Tracker (kc-spineguard)

> [!TIP]
> ### ❤️ THE WHY: Purpose, Humanity & Impact
> Empowering individuals living with sciatica to reclaim control, prevent debilitating flare-ups, and track progress with dignified, reliable personal health data.

---

## 🎯 Current Operational Focus

```diff
+ ╔════════════════════════════════════════════════════════════════════════════╗
+ ║  ┌──────────────────────────────────────────────────────────────────────┐  ║
+ ║  │ ⏰ TIMESTAMP: 2026-11-14 12:25 EST / 17:25 UTC                       │  ║
+ ║  │ 🎯 PRIMARY TARGET: #6 — Add Deep Flat-Foot Squat (Malasana) Stretch  │  ║
+ ║  │    Branch Context: main                                              │  ║
+ ║  │    Active Repo: https://github.com/genidma/kc-spineguard             │  ║
+ ║  └──────────────────────────────────────────────────────────────────────┘  ║
+ ╚════════════════════════════════════════════════════════════════════════════╝
+ ╔═════════════════════════════════════════════════╗
+ ║  ┌───────────────────────────────────────────────┐  ║
+ ║  │ 🎯 NEXT PRIORITY 1: #2 — Weight & Ratio Target │  ║
+ ║  └───────────────────────────────────────────────┘  ║
+ ╚═════════════════════════════════════════════════╝
+ ╔═════════════════════════════════════════════════╗
+ ║  ┌───────────────────────────────────────────────┐  ║
+ ║  │ 🎯 NEXT PRIORITY 2: #3 — MFA Hardening (Med)  │  ║
+ ║  └───────────────────────────────────────────────┘  ║
+ ╚═════════════════════════════════════════════════╝
```

### 📋 High-Level Action Checklist

| Priority | Issue / Task | Description | Status | Target / Destination |
| :---: | :--- | :--- | :--- | :--- |
| 🥇 | **#6 (Highest)** | Add deep flat-foot squat (Malasana / Asian squat) to stretch library | 🟢 Ready | `src/lib/stretches.ts`, Library & Log |
| 🥈 | **#2 (High)** | Track logged weight against height & gender ratio (BMI / IBW) | 🟡 Backlog | Profile, Weight Log & Trends View |
| 🥉 | **#3 (Medium)** | Multi-factor authentication (MFA) server-side enforcement | 🟡 Backlog | Firebase Identity Platform / Functions |
| 4️⃣ | **#1 (Low / Nice-to-have)** | IP Security Log Cloud Function & Blaze deployment | ⏸️ On Hold | Cloud Functions (`logUserIP`) on Blaze |

---

### 🏆 Recently Completed Milestones

- [x] **v1.1.0-Cycle: Issue #5 (Mood & Cognition Intraday Points)**: Render individual timestamped points for mood and cognition on 1d, 2d, and 3d views (`7377bd8`) ✅
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
  - Include hold timer and step-by-step lumbar decompress instructions
  - Ensure it appears in stretch logging dropdown and Library

### 2. #2 — Track Weight Against Height & Gender Ratio
- **In-Issue Search String ➡️ :** `'[TRACK-WEIGHT-RATIO]'`
- **Assignee:** `@genidma` (Lead) / `AGY` (Antigravity)
- **Status:** 🟡 Backlog
- **Key Deliverables:**
  - Gender selector in Profile (`Female`, `Male`, `Other / Prefer not to say`)
  - Height editor in Profile (`cm` / `in`)
  - Gender-adjusted healthy target weight calculation (Devine/Robinson IBW + BMI band)
  - Visual target band on the Weight Trends chart
  - Distance-to-target indicator on the Weight quick-log modal

### 3. #3 — Multi-Factor Authentication (MFA) Hardening
- **In-Issue Search String ➡️ :** `'[MFA-HARDENING]'`
- **Assignee:** `@genidma` (Lead) / `AGY` (Antigravity)
- **Status:** 🟡 Backlog (Medium Priority)
- **Key Deliverables:**
  - Audit client-side TOTP session tokens
  - Evaluate Firebase Identity Platform native MFA options
  - Refine recovery code redemption flow

### 4. #1 — IP Security Log Cloud Function Deployment
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
