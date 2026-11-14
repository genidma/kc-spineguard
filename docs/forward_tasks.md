# Forward Engineering Task Tracker (kc-spineguard)

> [!TIP]
> ### ❤️ THE WHY: Purpose, Humanity & Impact
> Empowering individuals living with sciatica to reclaim control, prevent debilitating flare-ups, and track progress with dignified, reliable personal health data.

---

## 🎯 Current Operational Focus

```diff
+ ╔════════════════════════════════════════════════════════════════════════════╗
+ ║  ┌──────────────────────────────────────────────────────────────────────┐  ║
+ ║  │ ⏰ TIMESTAMP: 2026-11-14 13:40 EST / 18:40 UTC                       │  ║
+ ║  │ 🎯 BREAK CHECKPOINT: Review #6 & #8 (Stretch->Hold->Release + Prone) │  ║
+ ║  │ 🎯 NEXT TARGET: #7 — Cognition Tracker & Trends Redesign             │  ║
+ ║  │    Branch Context: main                                              │  ║
+ ║  │    Active Repo: https://github.com/genidma/kc-spineguard             │  ║
+ ║  └──────────────────────────────────────────────────────────────────────┘  ║
+ ╚════════════════════════════════════════════════════════════════════════════╝
+ ╔═════════════════════════════════════════════════╗
+ ║  ┌───────────────────────────────────────────────┐  ║
+ ║  │ 🎯 NEXT PRIORITY 1: #2 — Height-Weight Ratio  │  ║
+ ║  └───────────────────────────────────────────────┘  ║
+ ╚═════════════════════════════════════════════════╝
+ ╔═════════════════════════════════════════════════╗
+ ║  ┌───────────────────────────────────────────────┐  ║
+ ║  │ 🎯 NEXT PRIORITY 2: #9 — 3D Body Map & Agents │  ║
+ ║  └───────────────────────────────────────────────┘  ║
+ ╚═════════════════════════════════════════════════╝
```

> [!IMPORTANT]
> **Post-Break Review Reminder:**
> 1. **Malasana (`deep-squat`)**: Fixed pelvis/butt lateral shift (`hipZ = 0` centered on vertical axis) and eliminated camera double-take (pure one-way quintic $0^\circ \to 90^\circ$ camera orbit during Step 4 hold).
> 2. **All 10 Stretches — Stretch Gently $\to$ Hold $\to$ Release + 4-Step Sync**: Weaved **Setup $\to$ Gentle Stretch $\to$ Sustained Hold $\to$ Gentle Release** into both animations and instructions across all 10 stretches (including Cat-Cow alternating holds, Nerve Glide 2s pauses, and redesigned 4-step Seated Spinal Twist).
> 3. **Prone Press-Up (McKenzie)**: Added unmistakable face-down (prone) visual cues (downward nose/chin/gaze profile, bent elbows with flat palms under shoulders, anchored pelvis arrow, and prone feet with heels up / toes on mat).
> 4. **End-of-Session Release Guardrail:** The `v1.1.0` release will be cut at the conclusion of today's working session when the agent receives explicit user approval (or provides a wrapping reminder).

---

### 📋 High-Level Action Checklist

| Priority | Issue / Task | Description | Status | Target / Destination |
| :---: | :--- | :--- | :--- | :--- |
| 🔍 | **#6 & #8 (Review)** | Review sequential motion $\to$ slow 90° camera orbit/tilt & deep hip flexion | 🟢 Ready for Review | `src/components/StretchVisual.tsx`, Library |
| 🥇 | **#7 (Highest)** | Redesign cognition tracker & trends (memory metric & brain fog scale) | 🟢 Ready | LogEditor, TrendsView (relates to #5) |
| 🥈 | **#2 (High)** | Track logged weight against height & gender ratio (BMI / IBW) | 🟡 Backlog | Profile, Weight Log & Trends View |
| 🥉 | **#9 (High / New)** | 3D anatomical body map with pinpoint pain & clinical agent supervision | 💡 Queued | Profile 3D Body Map, Multi-Agent Engine |
| 4️⃣ | **#3 (Medium)** | Multi-factor authentication (MFA) server-side enforcement | 🟡 Backlog | Firebase Identity Platform / Functions |
| 5️⃣ | **#5 (Under Review)** | Mood & cognition intraday points & 1–5 emoji labels | 🟡 Under Review | Closed candidate pending user testing |
| 6️⃣ | **#1 (Low / Nice-to-have)** | IP Security Log Cloud Function & Blaze deployment | ⏸️ On Hold | Cloud Functions (`logUserIP`) on Blaze |

---

### 🏆 Recently Completed Milestones

- [x] **v1.1.0-Cycle: Issue #8 & #6 (Sequential Motion $\to$ Slow 90° Calculus Camera Orbit/Tilt & Deep Hip Joint)**: Full step-synced motion followed by slow $0^\circ \to -12^\circ \to 90^\circ$ camera orbit/tilt & stretch-zone zoom for Malasana and Seated Spinal Twist, plus $>138^\circ$ ball-and-socket hip flexion for Knee-to-Chest (`Argon High` & `gemini-3.8-flash-low`) ✅
- [x] **v1.1.0-Cycle: Issue #6 (Deep Flat-Foot Squat / Malasana)**: Added clinical Malasana stretch with 30s hold and step-by-step form guidance (`75eebe5`) ✅
- [x] **v1.1.0-Cycle: Issue #5 (Mood & Cognition Intraday Points & Emojis)**: Numerical 1–5 labels under emojis in modal and exact matching emojis on Trends Y-axis (`7377bd8`, `278ca6f`) ✅
- [x] **v1.1.0-Cycle: Dependabot Vulnerability Zero**: Resolved 28 dependencies to 0 vulnerabilities (`fa86bfb`) ✅
- [x] **v1.1.0-Cycle: Issue #4 (Trends Date Ranges & UI Layout)**: Added 1d, 2d, 3d, 7d, 30d, 90d, 180d date ranges and streamlined header layout (`e88fc9f`, `7ca6bb3`) ✅
- [x] **v1.0.0 Initial Production Release**: Full app scaffolding, 9 log types, dose safety engine, guided sciatica stretches + timer, profile settings, offline Firestore sync, and live Firebase Hosting deployment (`75cdfb6`, `v1.0.0`) ✅
- [x] **v1.1.0 Inception**: Draft release notes initialized with start timestamp 11:56 AM EST / 16:56 UTC (`c3adf19`) ✅

---

## 📋 Task Matrix

### 1. #6 — Add Deep Flat-Foot Squat (Malasana) Stretch
- **In-Issue Search String ➡️ :** `'[DEEP-SQUAT-STRETCH]'`
- **Assignee:** `@genidma` (Lead) / `AGY` (`gemini-3.8-flash-low` & `Argon High`)
- **Status:** 🟢 Implemented (Closed Candidate — awaiting user sign-off)
- **Key Deliverables:**
  - Added "Deep flat-foot squat (Malasana)" to `BUILT_IN_STRETCHES` in `src/lib/stretches.ts`
  - Includes hold timer and 4-step lumbar decompression instructions with synchronized highlights

### 2. #7 — Redesign Cognition Tracker & Trends
- **In-Issue Search String ➡️ :** `'[COGNITION-REDESIGN]'`
- **Assignee:** `@genidma` (Lead) / `AGY` (Antigravity)
- **Status:** 🟢 Ready for implementation (relates to #5)
- **Key Deliverables:**
  - Add missing `memory` line to Trends chart
  - Address scale inversion dilemma for brain fog (clear vs foggy polarity)
  - Prevent visual overlap between mood and 3 cognitive metrics

### 3. #8 — Animated SVG & CSS Stretch Illustrations
- **In-Issue Search String ➡️ :** `'[STRETCH-ANIMATIONS]'`
- **Assignee:** `@genidma` (Lead) / `AGY` (`Argon High` & `gemini-3.8-flash-low`)
- **Status:** 🟢 Implemented (Closed Candidate — awaiting user sign-off)
- **Key Deliverables:**
  - Reference architecture documented in `docs/stretch_animations_design.md`
  - Realistic contoured anatomical figures and 60fps joint kinematics for all 10 stretches in `src/components/StretchVisual.tsx`

### 4. #2 — Track Weight Against Height & Gender Ratio
- **In-Issue Search String ➡️ :** `'[TRACK-WEIGHT-RATIO]'`
- **Assignee:** `@genidma` (Lead) / `AGY` (Antigravity)
- **Status:** 🟡 Backlog
- **Key Deliverables:**
  - Gender selector in Profile (`Female`, `Male`, `Other / Prefer not to say`)
  - Height editor in Profile (`cm` / `in`)
  - Gender-adjusted healthy target weight calculation (Devine/Robinson IBW + BMI band)
  - Visual target band on the Weight Trends chart
  - Distance-to-target indicator on the Weight quick-log modal

---

## 📌 Initiative Metadata & Lineage

- **Initiative:** `kc-spineguard` Production Release & Lifecycle Roadmap
- **Status:** Active (v1.1.0 Cycle)
- **Repository:** `genidma/kc-spineguard`
- **Production URL:** [https://kc-spineguard.web.app](https://kc-spineguard.web.app)
- **Active Release:** [v1.0.0](https://github.com/genidma/kc-spineguard/releases/tag/v1.0.0)
- **Target Release:** `v1.1.0` (In Progress)
