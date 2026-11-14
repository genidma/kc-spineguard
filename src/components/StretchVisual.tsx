// Realistic biomechanical & anatomical SVG illustrations with articulated joint kinematics
// and Matrix-style 360° horizontal orbital rotation.
import React, { useEffect, useState } from 'react';

// Smooth cubic easing
function easeInOut(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Renders an anatomically contoured, tapered limb segment between two joints (x1,y1) -> (x2,y2)
function anatomicalLimbPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r1: number,
  r2: number,
  muscleBulge = 0.15
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 0.001;
  const nx = -dy / len;
  const ny = dx / len;

  const p1Lx = x1 + nx * r1;
  const p1Ly = y1 + ny * r1;
  const p1Rx = x1 - nx * r1;
  const p1Ry = y1 - ny * r1;

  const p2Lx = x2 + nx * r2;
  const p2Ly = y2 + ny * r2;
  const p2Rx = x2 - nx * r2;
  const p2Ry = y2 - ny * r2;

  const midR = (r1 + r2) * 0.5 + len * muscleBulge * 0.18;
  const midX = (x1 + x2) * 0.5;
  const midY = (y1 + y2) * 0.5;
  const cLx = midX + nx * midR;
  const cLy = midY + ny * midR;
  const cRx = midX - nx * midR;
  const cRy = midY - ny * midR;

  return [
    `M ${p1Lx.toFixed(2)} ${p1Ly.toFixed(2)}`,
    `Q ${cLx.toFixed(2)} ${cLy.toFixed(2)} ${p2Lx.toFixed(2)} ${p2Ly.toFixed(2)}`,
    `A ${r2.toFixed(2)} ${r2.toFixed(2)} 0 0 1 ${p2Rx.toFixed(2)} ${p2Ry.toFixed(2)}`,
    `Q ${cRx.toFixed(2)} ${cRy.toFixed(2)} ${p1Rx.toFixed(2)} ${p1Ry.toFixed(2)}`,
    `A ${r1.toFixed(2)} ${r1.toFixed(2)} 0 0 1 ${p1Lx.toFixed(2)} ${p1Ly.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export function getMalasanaStepFromCycle(cycleMs: number): number {
  const t = ((cycleMs % 10000) + 10000) % 10000;
  if (t < 2000) return 0; // Step 1: Stand with feet shoulder-width apart
  if (t < 4300) return 1; // Step 2: Lower hips into deep squat, heels flat
  if (t < 6400) return 2; // Step 3: Palms together at heart center, elbows press inner knees
  return 3; // Step 4: Spine elongated, chest lifted, breathe & hold (+ 360 view)
}

export function StretchVisual({
  stretchId,
  active = false,
  progressPhase,
}: {
  stretchId: string;
  active?: boolean;
  progressPhase?: number; // Optional external 0..1 cycle override
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let rafId: number;
    let lastUpdate = 0;
    const tick = (ts: number) => {
      if (ts - lastUpdate >= 33) {
        setNowMs(Date.now());
        lastUpdate = ts;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const cycle10s = progressPhase !== undefined ? progressPhase * 10000 : nowMs % 10000;
  const wave = (Math.sin((nowMs / 1000) * (active ? 2.4 : 1.5)) + 1) * 0.5; // 0..1 smooth oscillation

  const bodyFill = 'currentColor';
  const bodySubtle = 'rgba(0, 81, 174, 0.14)';
  const accent = '#0051ae';
  const emerald = '#10b981';

  // ==========================================================================
  // 1. DEEP FLAT-FOOT SQUAT (MALASANA) — Realistic multi-joint articulated squat
  //    with synchronized step kinematics + Matrix 360° horizontal spin in hold
  // ==========================================================================
  if (stretchId === 'deep-squat') {
    const t = cycle10s; // 0..10000ms
    // Squat depth: 0 = standing tall, 1 = deep flat-foot Malasana squat
    let squat = 0;
    if (t < 1800) {
      squat = 0;
    } else if (t < 4200) {
      squat = easeInOut((t - 1800) / 2400);
    } else if (t < 9000) {
      squat = 1;
    } else {
      squat = 1 - easeInOut((t - 9000) / 1000);
    }

    // Prayer hands & elbow abduction engagement (Step 3: 4200ms -> 6200ms)
    let prayer = 0;
    if (t >= 3400 && t < 5200) {
      prayer = easeInOut((t - 3400) / 1800);
    } else if (t >= 5200 && t < 8900) {
      prayer = 1;
    } else if (t >= 8900) {
      prayer = 1 - easeInOut((t - 8900) / 900);
    }

    // Diaphragmatic breath during hold (Step 4: 6200ms -> 9000ms)
    const holdBreath = t >= 5800 && t < 9000 ? Math.sin(((t - 5800) / 1500) * Math.PI * 2) * 1.1 : 0;

    // Matrix-style 360° horizontal orbital spin during deep hold (6400ms -> 8800ms)
    let rotYDeg = 0;
    if (t >= 6400 && t <= 8800) {
      rotYDeg = easeInOut((t - 6400) / 2400) * 360;
    }

    // Joint coordinates (viewBox 0 0 120 120)
    // Ankles stay 100% planted flat on the mat!
    const ankleLX = 41;
    const ankleRX = 79;
    const ankleY = 102;

    // Knees track outward as hips sink into Malasana
    const kneeLX = lerp(43, 25, squat);
    const kneeRX = lerp(77, 95, squat);
    const kneeY = lerp(76, 70, squat);

    // Hips descend from standing (52) down below knee crease (85) in deep squat
    const hipLX = lerp(49, 44, squat);
    const hipRX = lerp(71, 76, squat);
    const hipY = lerp(53, 85, squat) + holdBreath * 0.4;
    const pelvisCenterY = hipY + 1;

    // Shoulders & elongated upright torso
    const shoulderLX = lerp(45, 44, squat);
    const shoulderRX = lerp(75, 76, squat);
    const shoulderY = lerp(27, 50, squat) - holdBreath * 0.6;
    const neckY = shoulderY - 4;
    const headY = shoulderY - 12;

    // Elbows & Wrists (transition from relaxed sides to prayer hands pressing inner knees)
    const elbowLX = lerp(40, 31, prayer * squat);
    const elbowRX = lerp(80, 89, prayer * squat);
    const elbowY = lerp(41, 69, squat * 0.85 + prayer * 0.15);

    const handLX = lerp(39, 58, prayer);
    const handRX = lerp(81, 62, prayer);
    const handY = lerp(55, 62, squat) - prayer * 2;

    return (
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full text-slate-700 dark:text-slate-200 select-none"
        style={{
          transform: `perspective(650px) rotateY(${rotYDeg.toFixed(1)}deg)`,
          transformOrigin: '50% 60%',
        }}
      >
        <defs>
          <linearGradient id="matGradMalasana" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0051ae" stopOpacity="0.10" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#0051ae" stopOpacity="0.10" />
          </linearGradient>
          <radialGradient id="lumbarGlowMalasana" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0051ae" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Grounded Clinical Yoga Mat */}
        <ellipse cx="60" cy="105" rx="48" ry="6.5" fill="url(#matGradMalasana)" stroke={accent} strokeWidth="0.8" strokeOpacity="0.3" />

        {/* Lumbar & Hip Decompression Aura (intensifies in deep squat hold) */}
        {squat > 0.5 && (
          <circle
            cx="60"
            cy={pelvisCenterY - 4}
            r={14 + holdBreath * 2}
            fill="url(#lumbarGlowMalasana)"
            opacity={(squat - 0.5) * 1.8}
          />
        )}

        {/* Contoured Upper Body / Torso Silhouette */}
        <path
          d={`M ${shoulderLX} ${shoulderY}
              Q 60 ${shoulderY - 2} ${shoulderRX} ${shoulderY}
              L ${hipRX + 2} ${hipY}
              Q 60 ${hipY + 7} ${hipLX - 2} ${hipY} Z`}
          fill={bodySubtle}
          stroke={bodyFill}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* Pelvis / Glute Anatomical Bowl */}
        <ellipse cx="60" cy={pelvisCenterY} rx="13.5" ry="6" fill={bodyFill} opacity="0.22" />

        {/* Articulated Spine & Vertebral Decompression Line (Elongated Spine) */}
        <line
          x1="60"
          y1={shoulderY + 2}
          x2="60"
          y2={pelvisCenterY + 1}
          stroke={squat > 0.7 ? emerald : accent}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="2.5 2"
        />

        {/* Left & Right Thighs (Femur + Quadriceps/Adductors volume) */}
        <path d={anatomicalLimbPath(hipLX, hipY, kneeLX, kneeY, 6.2, 4.4, 0.22)} fill={bodyFill} opacity="0.88" />
        <path d={anatomicalLimbPath(hipRX, hipY, kneeRX, kneeY, 6.2, 4.4, 0.22)} fill={bodyFill} opacity="0.88" />

        {/* Left & Right Calves (Tibia/Gastrocnemius volume) */}
        <path d={anatomicalLimbPath(kneeLX, kneeY, ankleLX, ankleY, 4.3, 2.7, 0.2)} fill={bodyFill} opacity="0.92" />
        <path d={anatomicalLimbPath(kneeRX, kneeY, ankleRX, ankleY, 4.3, 2.7, 0.2)} fill={bodyFill} opacity="0.92" />

        {/* Knee Joint Capsules */}
        <circle cx={kneeLX} cy={kneeY} r="4.2" fill={accent} opacity="0.35" />
        <circle cx={kneeRX} cy={kneeY} r="4.2" fill={accent} opacity="0.35" />

        {/* Flat Planted Feet (Heels anchored flat on floor, toes slightly turned out) */}
        <path
          d={`M ${ankleLX + 4} ${ankleY + 2} L ${ankleLX - 11} ${ankleY + 3} Q ${ankleLX - 14} ${ankleY + 1} ${ankleLX - 10} ${ankleY - 1.5} L ${ankleLX + 3} ${ankleY - 1} Z`}
          fill={sqlFootColor(squat, accent, bodyFill)}
        />
        <path
          d={`M ${ankleRX - 4} ${ankleY + 2} L ${ankleRX + 11} ${ankleY + 3} Q ${ankleRX + 14} ${ankleY + 1} ${ankleRX + 10} ${ankleY - 1.5} L ${ankleRX - 3} ${ankleY - 1} Z`}
          fill={sqlFootColor(squat, accent, bodyFill)}
        />

        {/* Upper Arms */}
        <path d={anatomicalLimbPath(shoulderLX, shoulderY, elbowLX, elbowY, 3.6, 2.8, 0.14)} fill={bodyFill} opacity="0.9" />
        <path d={anatomicalLimbPath(shoulderRX, shoulderY, elbowRX, elbowY, 3.6, 2.8, 0.14)} fill={bodyFill} opacity="0.9" />

        {/* Forearms */}
        <path d={anatomicalLimbPath(elbowLX, elbowY, handLX, handY, 2.7, 2.0, 0.12)} fill={bodyFill} opacity="0.95" />
        <path d={anatomicalLimbPath(elbowRX, elbowY, handRX, handY, 2.7, 2.0, 0.12)} fill={bodyFill} opacity="0.95" />

        {/* Prayer Hands (Anjali Mudra) & Knee-Opening Cue */}
        {prayer > 0.6 ? (
          <>
            <path
              d={`M 60 ${handY - 6} L 56.5 ${handY + 1} L 60 ${handY + 3} L 63.5 ${handY + 1} Z`}
              fill={emerald}
              stroke={bodyFill}
              strokeWidth="1.2"
            />
            {/* Outward hip-opening arrows at inner knees */}
            <path d={`M ${elbowLX - 1} ${elbowY} L ${kneeLX - 3} ${kneeY}`} stroke={emerald} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
            <path d={`M ${elbowRX + 1} ${elbowY} L ${kneeRX + 3} ${kneeY}`} stroke={emerald} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
          </>
        ) : (
          <>
            <circle cx={handLX} cy={handY} r="2.4" fill={bodyFill} />
            <circle cx={handRX} cy={handY} r="2.4" fill={bodyFill} />
          </>
        )}

        {/* Neck & Sculpted Anatomical Head */}
        <path d={anatomicalLimbPath(60, shoulderY, 60, neckY, 3.2, 2.8, 0)} fill={bodyFill} />
        <ellipse cx="60" cy={headY} rx="7.2" ry="8.4" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.4" />
        {/* Subtle facial/posture alignment line */}
        <line x1="60" y1={headY - 4} x2="60" y2={headY + 3} stroke={accent} strokeWidth="1.3" opacity="0.5" strokeLinecap="round" />
      </svg>
    );
  }

  // ==========================================================================
  // 2. SEATED SPINAL TWIST — Realistic anatomical seated figure + Matrix 360°
  // ==========================================================================
  if (stretchId === 'seated-twist') {
    const rotY = ((nowMs % 7500) / 7500) * 360;
    const twistOffset = Math.sin((nowMs / 1600) * Math.PI) * 3.5;
    return (
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full text-slate-700 dark:text-slate-200 select-none"
        style={{
          transform: `perspective(650px) rotateY(${rotY.toFixed(1)}deg)`,
          transformOrigin: '50% 60%',
        }}
      >
        <ellipse cx="60" cy="100" rx="44" ry="6" fill={bodySubtle} />
        {/* Pelvis anchored on mat */}
        <ellipse cx="56" cy="92" rx="12" ry="5.5" fill={bodyFill} opacity="0.3" />
        {/* Extended bottom leg */}
        <path d={anatomicalLimbPath(52, 93, 24, 98, 5.5, 3.2, 0.18)} fill={bodyFill} opacity="0.85" />
        {/* Crossed bent leg over opposite knee */}
        <path d={anatomicalLimbPath(60, 92, 48, 70, 5.6, 4.0, 0.2)} fill={bodyFill} opacity="0.92" />
        <path d={anatomicalLimbPath(48, 70, 38, 97, 3.9, 2.6, 0.18)} fill={bodyFill} opacity="0.92" />
        {/* Rotating Contoured Torso */}
        <path
          d={`M ${46 + twistOffset * 0.4} 50 Q 58 47 ${68 + twistOffset * 0.4} 51 L 66 91 Q 56 95 47 91 Z`}
          fill={bodySubtle}
          stroke={bodyFill}
          strokeWidth="2.2"
        />
        {/* Helical Rotating Spine Highlight */}
        <path
          d={`M 56 91 Q ${56 + twistOffset} 70 ${57 + twistOffset * 0.6} 49`}
          fill="none"
          stroke={emerald}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray="3 2"
        />
        {/* Supporting back arm & twisting front arm hooking knee */}
        <path d={anatomicalLimbPath(66, 53, 76, 76, 3.3, 2.4, 0.12)} fill={bodyFill} opacity="0.8" />
        <path d={anatomicalLimbPath(76, 76, 78, 97, 2.4, 1.9, 0.1)} fill={bodyFill} opacity="0.8" />
        <path d={anatomicalLimbPath(48, 52, 42, 69, 3.4, 2.6, 0.15)} fill={bodyFill} />
        <path d={anatomicalLimbPath(42, 69, 53, 75, 2.5, 2.0, 0.12)} fill={ accent } />
        {/* Sculpted Head turning into twist */}
        <ellipse cx={57 + twistOffset * 0.7} cy="37" rx="6.8" ry="8" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.3" />
      </svg>
    );
  }

  // ==========================================================================
  // 3. KNEE-TO-CHEST — Realistic supine figure drawing knee to chest
  // ==========================================================================
  if (stretchId === 'knee-to-chest') {
    const pull = wave; // 0..1 knee flexion toward chest
    const kneeX = lerp(58, 43, pull);
    const kneeY = lerp(64, 54, pull);
    const ankleX = lerp(74, 59, pull);
    const ankleY = lerp(76, 66, pull);

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        {/* Floor Mat */}
        <rect x="10" y="92" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
        {/* Lumbar Decompression Glow */}
        <ellipse cx="52" cy="89" rx={14 + pull * 4} ry="4.5" fill={emerald} opacity={0.2 + pull * 0.25} />
        {/* Supine Head & Neck on pillow */}
        <rect x="13" y="86" width="14" height="6" rx="3" fill={accent} opacity="0.2" />
        <ellipse cx="21" cy="81" rx="7" ry="6.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        {/* Supine Contoured Torso & Pelvis */}
        <path d="M 29 82 Q 45 80 62 84 L 63 92 L 29 92 Z" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <line x1="31" y1="89" x2="62" y2="89" stroke={emerald} strokeWidth="3" strokeDasharray="3 2" />
        {/* Relaxed Anchor Leg (bent with foot flat on mat) */}
        <path d={anatomicalLimbPath(61, 88, 82, 68, 5.4, 3.8, 0.18)} fill={bodyFill} opacity="0.5" />
        <path d={anatomicalLimbPath(82, 68, 97, 91, 3.6, 2.4, 0.16)} fill={bodyFill} opacity="0.5" />
        <path d="M 95 92 L 105 92" stroke={bodyFill} strokeWidth="3.5" strokeLinecap="round" opacity="0.5" />
        {/* Active Leg Hugged to Chest */}
        <path d={anatomicalLimbPath(59, 87, kneeX, kneeY, 5.8, 4.1, 0.22)} fill={bodyFill} />
        <path d={anatomicalLimbPath(kneeX, kneeY, ankleX, ankleY, 4.0, 2.6, 0.18)} fill={bodyFill} />
        {/* Arms clasping shin/knee */}
        <path d={anatomicalLimbPath(35, 84, 44, 68, 3.2, 2.4, 0.12)} fill={bodyFill} />
        <path d={anatomicalLimbPath(44, 68, kneeX + 2, kneeY + 1, 2.4, 2.0, 0.1)} fill={accent} />
      </svg>
    );
  }

  // ==========================================================================
  // 4. SUPINE PIRIFORMIS (FIGURE-4) — Realistic anatomical glute/piriformis stretch
  // ==========================================================================
  if (stretchId === 'piriformis') {
    const pull = wave;
    const thighX = lerp(66, 53, pull);
    const thighY = lerp(60, 52, pull);
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <rect x="10" y="92" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
        {/* Piriformis / Glute Decompression Glow */}
        <circle cx="60" cy="86" r={9 + pull * 4} fill={emerald} opacity={0.22 + pull * 0.25} />
        <ellipse cx="20" cy="81" rx="7" ry="6.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <path d="M 28 82 Q 44 80 61 84 L 62 92 L 28 92 Z" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        {/* Support Leg drawn up */}
        <path d={anatomicalLimbPath(60, 88, thighX, thighY, 5.6, 4.0, 0.2)} fill={bodyFill} opacity="0.75" />
        <path d={anatomicalLimbPath(thighX, thighY, thighX + 20, thighY + 3, 3.8, 2.5, 0.16)} fill={bodyFill} opacity="0.75" />
        {/* Crossed Figure-4 Leg (externally rotated hip) */}
        <path d={anatomicalLimbPath(58, 87, thighX - 9, thighY + 12, 5.8, 4.1, 0.22)} fill={accent} />
        <path d={anatomicalLimbPath(thighX - 9, thighY + 12, thighX + 2, thighY + 1, 3.9, 2.5, 0.16)} fill={accent} />
        {/* Arms pulling behind hamstring */}
        <path d={anatomicalLimbPath(35, 84, thighX - 2, thighY + 6, 3.0, 2.2, 0.1)} fill={bodyFill} />
      </svg>
    );
  }

  // ==========================================================================
  // 5. SCIATIC NERVE GLIDE (FLOSSING) — Seated knee extension + cervical glide
  // ==========================================================================
  if (stretchId === 'nerve-glide') {
    const glide = wave; // 0 = knee bent & chin nodded; 1 = knee extended & head tilted gently back
    const footX = lerp(68, 98, glide);
    const footY = lerp(96, 68, glide);
    const headTiltX = lerp(52, 46, glide);
    const headTiltY = lerp(29, 25, glide);

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        {/* Clinical Chair */}
        <path d="M 34 38 L 34 102 M 34 72 L 64 72 L 64 102" fill="none" stroke={bodyFill} strokeWidth="3" opacity="0.3" strokeLinecap="round" />
        {/* Seated Contoured Torso */}
        <path d="M 42 38 L 55 38 L 57 70 L 41 70 Z" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        {/* Continuous Sciatic Nerve Pathway (Lumbar -> Glute -> Hamstring -> Tibial) */}
        <path
          d={`M 48 42 L 49 69 L 68 69 L ${footX} ${footY}`}
          fill="none"
          stroke={emerald}
          strokeWidth="2.8"
          strokeDasharray="3 2"
        />
        {/* Thigh on chair */}
        <path d={anatomicalLimbPath(49, 69, 69, 69, 5.6, 4.1, 0.18)} fill={bodyFill} />
        {/* Gliding Lower Leg + Dorsiflexed Foot */}
        <path d={anatomicalLimbPath(69, 69, footX, footY, 4.0, 2.6, 0.18)} fill={bodyFill} />
        <path d={`M ${footX} ${footY} L ${footX + 4} ${footY - 8}`} stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
        {/* Articulating Head & Cervical Spine */}
        <ellipse cx={headTiltX} cy={headTiltY} rx="6.8" ry="7.6" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
      </svg>
    );
  }

  // ==========================================================================
  // 6. CAT-COW — Quadruped spinal flexion (Cat) & extension (Cow)
  // ==========================================================================
  if (stretchId === 'cat-cow') {
    const arch = (wave - 0.5) * 2; // -1 (Cow belly drop) to +1 (Cat rounded arch)
    const spineCtrlY = 58 - arch * 16;
    const headY = 56 + arch * 9;

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <rect x="14" y="96" width="92" height="4" rx="2" fill={accent} opacity="0.22" />
        {/* Thighs & Shins kneeling on mat */}
        <path d={anatomicalLimbPath(34, 64, 32, 95, 5.2, 3.5, 0.16)} fill={bodyFill} />
        <path d={anatomicalLimbPath(32, 95, 18, 96, 3.2, 2.2, 0.1)} fill={bodyFill} />
        {/* Arms planted under shoulders */}
        <path d={anatomicalLimbPath(80, 62, 82, 95, 3.6, 2.4, 0.12)} fill={bodyFill} />
        {/* Articulating Ribcage / Torso Volume */}
        <path
          d={`M 33 64 Q 57 ${spineCtrlY} 80 62 Q 57 ${spineCtrlY + 11} 33 68 Z`}
          fill={bodySubtle}
          stroke={bodyFill}
          strokeWidth="2.2"
        />
        {/* Glowing Articulating Spine */}
        <path
          d={`M 33 64 Q 57 ${spineCtrlY - 2} 80 62`}
          fill="none"
          stroke={emerald}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="3 2"
        />
        {/* Head tilting with Cat/Cow */}
        <ellipse cx="90" cy={headY} rx="6.5" ry="7.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
      </svg>
    );
  }

  // ==========================================================================
  // 7. CHILD'S POSE — Kneeling lumbar flexion & deep dorsal breathing
  // ==========================================================================
  if (stretchId === 'childs-pose') {
    const breath = wave * 3.5;
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <rect x="10" y="94" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
        <ellipse cx="45" cy={74 - breath * 0.5} rx="18" ry="8" fill={emerald} opacity={0.18 + wave * 0.2} />
        {/* Folded thighs & shins resting on heels */}
        <path d={anatomicalLimbPath(30, 82, 54, 92, 5.8, 3.8, 0.2)} fill={bodyFill} opacity="0.9" />
        <path d={anatomicalLimbPath(54, 92, 24, 93, 3.8, 2.5, 0.15)} fill={bodyFill} opacity="0.85" />
        {/* Rounded Decompressing Torso */}
        <path
          d={`M 28 82 Q 48 ${62 - breath} 74 84 Q 52 88 28 84 Z`}
          fill={bodySubtle}
          stroke={bodyFill}
          strokeWidth="2.2"
        />
        <path d={`M 29 80 Q 48 ${60 - breath} 73 83`} fill="none" stroke={emerald} strokeWidth="3.2" strokeDasharray="3 2" />
        {/* Outstretched Arms on Mat */}
        <path d={anatomicalLimbPath(70, 82, 102, 92, 3.2, 2.0, 0.1)} fill={bodyFill} />
        <ellipse cx="79" cy="87" rx="6" ry="5.5" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
      </svg>
    );
  }

  // ==========================================================================
  // 8. SUPINE HAMSTRING STRETCH — Towel/strap-assisted active leg elevation
  // ==========================================================================
  if (stretchId === 'hamstring') {
    const lift = wave;
    const footX = lerp(76, 62, lift);
    const footY = lerp(42, 32, lift);
    const kneeX = lerp(68, 61, lift);
    const kneeY = lerp(66, 60, lift);
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <rect x="10" y="92" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
        <ellipse cx="21" cy="81" rx="7" ry="6.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <path d="M 29 82 Q 45 80 61 84 L 62 92 L 29 92 Z" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        {/* Grounded opposite leg */}
        <path d={anatomicalLimbPath(60, 89, 98, 90, 5.2, 2.8, 0.15)} fill={bodyFill} opacity="0.45" />
        {/* Elevated Hamstring Stretch Leg */}
        <path d={anatomicalLimbPath(58, 87, kneeX, kneeY, 5.8, 4.1, 0.2)} fill={bodyFill} />
        <path d={anatomicalLimbPath(kneeX, kneeY, footX, footY, 4.0, 2.6, 0.18)} fill={bodyFill} />
        {/* Posterior Hamstring Stretch Highlight */}
        <path d={`M 60 88 L ${kneeX + 2} ${kneeY} L ${footX + 2} ${footY}`} fill="none" stroke={emerald} strokeWidth="2.8" strokeDasharray="3 2" />
        {/* Strap / Towel Loop held by hands */}
        <line x1="42" y1="76" x2={footX} y2={footY} stroke={accent} strokeWidth="2" strokeDasharray="3 2" />
        <path d={anatomicalLimbPath(34, 84, 44, 75, 3.2, 2.2, 0.1)} fill={bodyFill} />
      </svg>
    );
  }

  // ==========================================================================
  // 9. PELVIC TILT — Core engagement flattening lumbar curve into mat
  // ==========================================================================
  if (stretchId === 'pelvic-tilt') {
    const tilt = wave; // 0 = slight lumbar arch, 1 = flattened into mat with core engaged
    const lumbarY = lerp(83, 89, tilt);
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <rect x="10" y="92" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
        <ellipse cx="50" cy="89" rx={12 + tilt * 5} ry="5" fill={emerald} opacity={0.15 + tilt * 0.35} />
        <ellipse cx="21" cy="81" rx="7" ry="6.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        {/* Torso & tilting lumbar spine */}
        <path d={`M 29 82 Q 46 ${lumbarY - 5} 62 85 L 62 91 Q 46 ${lumbarY + 2} 29 91 Z`} fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <path d={`M 30 87 Q 46 ${lumbarY} 61 88`} fill="none" stroke={emerald} strokeWidth="3.4" strokeLinecap="round" />
        {/* Bent knees with feet flat */}
        <path d={anatomicalLimbPath(61, 88, 79, 64, 5.6, 4.0, 0.2)} fill={bodyFill} />
        <path d={anatomicalLimbPath(79, 64, 95, 91, 3.9, 2.5, 0.16)} fill={bodyFill} />
      </svg>
    );
  }

  // ==========================================================================
  // 10. PRONE PRESS-UP (MCKENZIE) — Prone lumbar extension with pelvis anchored
  // ==========================================================================
  const press = wave;
  const chestY = lerp(74, 54, press);
  const headY = lerp(65, 42, press);
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
      <rect x="10" y="92" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
      {/* Anchored pelvis & legs on mat */}
      <path d={anatomicalLimbPath(56, 89, 102, 90, 5.6, 2.8, 0.16)} fill={bodyFill} />
      {/* Extending Lumbar & Thoracic Torso */}
      <path
        d={`M 58 89 Q 44 82 32 ${chestY} L 38 ${chestY + 6} Q 48 88 58 92 Z`}
        fill={bodySubtle}
        stroke={bodyFill}
        strokeWidth="2.2"
      />
      <path d={`M 57 89 Q 43 81 33 ${chestY + 2}`} fill="none" stroke={emerald} strokeWidth="3.4" strokeDasharray="3 2" />
      {/* Pressing Arms */}
      <path d={anatomicalLimbPath(35, chestY + 2, 34, 91, 3.4, 2.3, 0.12)} fill={bodyFill} />
      <ellipse cx="30" cy={headY} rx="6.5" ry="7.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
    </svg>
  );
}

function sqlFootColor(squat: number, accent: string, bodyFill: string): string {
  return squat > 0.35 ? accent : bodyFill;
}
