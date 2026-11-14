// Realistic biomechanical & anatomical SVG illustrations with:
// - Gentle Stretch -> Sustained Hold -> Gentle Release cadence across all 10 stretches
// - Synchronized 4-step highlighting for all 10 stretches
// - Pure one-way smooth calculus camera orbit (0° -> 90°, zero double-take, zero butt drift)
// - Unmistakable face-down (prone) vs face-up (supine) anatomical landmarks
import React, { useEffect, useState } from 'react';

// Smooth cubic easing
function easeInOut(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

// Quintic C2-continuous calculus smoothstep (zero jerk at endpoints)
function quinticSmooth(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Pure one-way calculus camera orbit (0° -> +90° horizontally to figure's right):
// No reverse dip, no double-take! Smooth quintic acceleration & deceleration,
// holds at 90° focusing on the stretch target zone, then smoothly returns to 0°.
function oneWayCalculusCameraOrbit(u: number): { angleDeg: number; focusZoom: number } {
  const c = Math.max(0, Math.min(1, u));
  if (c < 0.58) {
    // Slow, single-direction quintic sweep from 0° to 90°
    const p = c / 0.58;
    const s = quinticSmooth(p);
    return {
      angleDeg: 90 * s,
      focusZoom: quinticSmooth(Math.max(0, (p - 0.15) / 0.85)),
    };
  }
  if (c < 0.84) {
    // Steady hold at 90° side profile focusing on the target stretch zone
    return { angleDeg: 90, focusZoom: 1 };
  }
  // Smooth return from 90° to 0° during release
  const p = (c - 0.84) / 0.16;
  const reset = 1 - quinticSmooth(p);
  return { angleDeg: 90 * reset, focusZoom: reset };
}

// Projects a 3D anatomical point (x, y, z) around the vertical spine/pelvis axis (cx, cy, z=0)
// Because pelvis & spine sit at z=0, the figure's butt NEVER drifts sideways when rotating!
function project3D(
  x: number,
  y: number,
  z: number,
  angleDeg: number,
  cx = 60,
  cy = 72
): { x: number; y: number; depth: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const elevRad = Math.sin(rad) * 0.11; // Gentle camera tilt
  const dx = x - cx;
  const dy = y - cy;

  const rx = dx * Math.cos(rad) + z * Math.sin(rad);
  const rz = -dx * Math.sin(rad) + z * Math.cos(rad);
  const ry = dy * Math.cos(elevRad) - rz * Math.sin(elevRad);

  return {
    x: cx + rx,
    y: cy + ry,
    depth: rz,
  };
}

// Standard 16-second Stretch -> Hold -> Release envelope:
// Step 0 (0.0s - 2.6s): Starting setup (progress = 0)
// Step 1 (2.6s - 6.2s): Gentle movement into stretch (0 -> 1)
// Step 2 (6.2s - 12.6s): Sustained hold (progress = 1, isHolding = true)
// Step 3 (12.6s - 16.0s): Gentle release back to start (1 -> 0)
function stretchHoldReleaseEnvelope(tMs: number): {
  stretch: number;
  isHolding: boolean;
  breath: number;
  stepIndex: number;
} {
  const t = ((tMs % 16000) + 16000) % 16000;
  if (t < 2600) {
    return { stretch: 0, isHolding: false, breath: 0, stepIndex: 0 };
  }
  if (t < 6200) {
    return {
      stretch: easeInOut((t - 2600) / 3600),
      isHolding: false,
      breath: 0,
      stepIndex: 1,
    };
  }
  if (t < 12600) {
    const breath = Math.sin(((t - 6200) / 2100) * Math.PI * 2);
    return { stretch: 1, isHolding: true, breath, stepIndex: 2 };
  }
  const rel = t < 15200 ? 1 - easeInOut((t - 12600) / 2600) : 0;
  return { stretch: rel, isHolding: false, breath: 0, stepIndex: 3 };
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

export const STRETCH_CYCLE_MS = 16000;

export function getMalasanaStepFromCycle(cycleMs: number): number {
  const t = ((cycleMs % STRETCH_CYCLE_MS) + STRETCH_CYCLE_MS) % STRETCH_CYCLE_MS;
  if (t < 2500) return 0; // Step 1: Stand tall
  if (t < 5600) return 1; // Step 2: Lower hips into deep squat
  if (t < 8600) return 2; // Step 3: Palms together, elbows press inner knees
  return 3; // Step 4: Hold with elongated spine + smooth 0°->90° camera orbit & release
}

// Returns the active step index (0..3) for ANY of the 10 stretches so instructions highlight in sync
export function getStretchActiveStep(stretchId: string, cycleMs: number): number {
  const t = ((cycleMs % STRETCH_CYCLE_MS) + STRETCH_CYCLE_MS) % STRETCH_CYCLE_MS;
  if (stretchId === 'deep-squat') {
    return getMalasanaStepFromCycle(cycleMs);
  }
  if (stretchId === 'seated-twist') {
    if (t < 3200) return 0; // Step 1: Sit tall, bend one knee & step foot outside opposite knee
    if (t < 6200) return 1; // Step 2: Support hand behind hip & hook opposite elbow outside knee
    if (t < 9200) return 2; // Step 3: Gently rotate torso toward bent knee
    return 3; // Step 4: Hold twist + smooth camera orbit & release
  }
  if (stretchId === 'cat-cow') {
    if (t < 2200) return 0; // Step 1: Neutral tabletop
    if (t < 7600) return 1; // Step 2: Inhale into Cow, hold gently, release to neutral
    if (t < 13200) return 2; // Step 3: Exhale into Cat, hold gently, release to neutral
    return 3; // Step 4: Repeat rhythmically
  }
  if (stretchId === 'nerve-glide') {
    if (t < 2400) return 0; // Step 1: Sit tall on chair
    if (t < 7200) return 1; // Step 2: Straighten knee & tilt head back, pause 2s
    if (t < 12400) return 2; // Step 3: Bend knee & nod chin to chest, pause 2s
    return 3; // Step 4: Release to neutral
  }
  // Standard 4-step Stretch -> Hold -> Release envelope for all other stretches
  return stretchHoldReleaseEnvelope(t).stepIndex;
}

function HoldBadge({ visible, label = 'HOLD & BREATHE' }: { visible: boolean; label?: string }) {
  if (!visible) return null;
  return (
    <g>
      <rect x="30" y="5" width="60" height="12" rx="6" fill="#10b981" fillOpacity="0.18" stroke="#10b981" strokeWidth="0.9" />
      <text x="60" y="13" textAnchor="middle" className="text-[6.2px] font-black tracking-wider fill-emerald-700 dark:fill-emerald-300">
        {label}
      </text>
    </g>
  );
}

export function StretchVisual({
  stretchId,
  active = false,
  progressPhase,
}: {
  stretchId: string;
  active?: boolean;
  progressPhase?: number;
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

  const t =
    progressPhase !== undefined
      ? progressPhase * STRETCH_CYCLE_MS
      : ((nowMs % STRETCH_CYCLE_MS) + STRETCH_CYCLE_MS) % STRETCH_CYCLE_MS;

  const bodyFill = 'currentColor';
  const bodySubtle = 'rgba(0, 81, 174, 0.14)';
  const accent = '#0051ae';
  const emerald = '#10b981';
  const amberFocus = '#f59e0b';

  // ==========================================================================
  // 1. DEEP FLAT-FOOT SQUAT (MALASANA)
  //    Pelvis & spine stay 100% centered on x=60, z=0 (zero butt shift!).
  //    At Step 4, camera orbits in one smooth direction (0° -> 90°, zero double-take).
  // ==========================================================================
  if (stretchId === 'deep-squat') {
    let squat = 0;
    if (t < 2400) {
      squat = 0;
    } else if (t < 5400) {
      squat = easeInOut((t - 2400) / 3000);
    } else if (t < 14400) {
      squat = 1;
    } else {
      squat = 1 - easeInOut((t - 14400) / 1400);
    }

    let prayer = 0;
    if (t >= 5200 && t < 7800) {
      prayer = easeInOut((t - 5200) / 2600);
    } else if (t >= 7800 && t < 14300) {
      prayer = 1;
    } else if (t >= 14300) {
      prayer = 1 - easeInOut((t - 14300) / 1200);
    }

    // Step 4 (8800ms -> 14400ms): Pure one-way smooth camera orbit (0° -> 90°)
    let cameraAngleDeg = 0;
    let focusZoom = 0;
    if (t >= 8800 && t < 14400) {
      const orbit = oneWayCalculusCameraOrbit((t - 8800) / 5600);
      cameraAngleDeg = orbit.angleDeg;
      focusZoom = orbit.focusZoom;
    }

    const isHolding = t >= 7800 && t < 14400;
    const holdBreath = isHolding ? Math.sin(((t - 7800) / 2000) * Math.PI * 2) * 0.9 : 0;

    // Crucial fix: Pelvis and Spine stay at Z = 0 so the butt NEVER shifts left or right!
    // Knees and toes project forward (+Z) as the squat deepens.
    const hipZ = 0;
    const shoulderZ = 0;
    const headZ = lerp(0, 1.5, squat);
    const kneeZ = lerp(0, 21, squat);
    const ankleZ = lerp(0, 6, squat);
    const toeZ = lerp(8, 19, squat);
    const elbowZ = lerp(0, 16, prayer * squat);
    const handZ = lerp(2, 20, prayer * squat);

    const ankleR = project3D(42, 102, ankleZ, cameraAngleDeg);
    const ankleL = project3D(78, 102, ankleZ, cameraAngleDeg);
    const toeR = project3D(34, 103, toeZ, cameraAngleDeg);
    const toeL = project3D(86, 103, toeZ, cameraAngleDeg);

    const kneeR = project3D(lerp(43, 26, squat), lerp(76, 68, squat), kneeZ, cameraAngleDeg);
    const kneeL = project3D(lerp(77, 94, squat), lerp(76, 68, squat), kneeZ, cameraAngleDeg);

    const hipR = project3D(lerp(49, 46, squat), lerp(53, 85, squat) + holdBreath * 0.35, hipZ, cameraAngleDeg);
    const hipL = project3D(lerp(71, 74, squat), lerp(53, 85, squat) + holdBreath * 0.35, hipZ, cameraAngleDeg);
    const pelvisC = project3D(60, lerp(54, 86, squat) + holdBreath * 0.35, hipZ, cameraAngleDeg);
    const lumbarMid = project3D(60, lerp(40, 68, squat), hipZ, cameraAngleDeg);

    const shoulderR = project3D(45, lerp(27, 50, squat) - holdBreath * 0.45, shoulderZ, cameraAngleDeg);
    const shoulderL = project3D(75, lerp(27, 50, squat) - holdBreath * 0.45, shoulderZ, cameraAngleDeg);
    const shoulderC = project3D(60, lerp(27, 50, squat) - holdBreath * 0.45, shoulderZ, cameraAngleDeg);
    const neckC = project3D(60, lerp(23, 45, squat) - holdBreath * 0.45, headZ, cameraAngleDeg);
    const headC = project3D(60, lerp(15, 37, squat) - holdBreath * 0.45, headZ, cameraAngleDeg);

    const elbowR = project3D(
      lerp(40, 31, prayer * squat),
      lerp(41, 68, squat * 0.85 + prayer * 0.15),
      elbowZ,
      cameraAngleDeg
    );
    const elbowL = project3D(
      lerp(80, 89, prayer * squat),
      lerp(41, 68, squat * 0.85 + prayer * 0.15),
      elbowZ,
      cameraAngleDeg
    );

    const handR = project3D(lerp(39, 58, prayer), lerp(55, 61, squat) - prayer * 2, handZ, cameraAngleDeg);
    const handL = project3D(lerp(81, 62, prayer), lerp(55, 61, squat) - prayer * 2, handZ, cameraAngleDeg);
    const prayerC = project3D(60, lerp(55, 59, squat), handZ + 1, cameraAngleDeg);

    const zoomScale = 1 + focusZoom * 0.22;
    const focusOriginX = 60;
    const focusOriginY = pelvisC.y - 6;
    const sideFactor = Math.sin((cameraAngleDeg * Math.PI) / 180);
    const torsoDepthHalf = lerp(2, 7.5, sideFactor);

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <defs>
          <linearGradient id="matGradMalasana" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0051ae" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0051ae" stopOpacity="0.12" />
          </linearGradient>
          <radialGradient id="stretchFocusGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.65" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0051ae" stopOpacity="0" />
          </radialGradient>
        </defs>

        <HoldBadge visible={isHolding} label={cameraAngleDeg > 15 ? 'HOLD · 90° FOCUS' : 'HOLD & BREATHE'} />

        <g
          style={{
            transform: `translate(${focusOriginX}px, ${focusOriginY}px) scale(${zoomScale.toFixed(3)}) translate(${-focusOriginX}px, ${-focusOriginY}px)`,
          }}
        >
          <ellipse
            cx="60"
            cy="104"
            rx={lerp(48, 38, sideFactor)}
            ry={lerp(6.5, 8.5, sideFactor)}
            fill="url(#matGradMalasana)"
            stroke={accent}
            strokeWidth="0.8"
            strokeOpacity="0.35"
          />

          {/* Stretch Target Focus Zone Aura (Lumbar L4-S1 + Deep Hip Capsule) */}
          {squat > 0.5 && (
            <>
              <circle
                cx={pelvisC.x}
                cy={pelvisC.y - 4}
                r={14 + focusZoom * 6 + holdBreath * 1.5}
                fill="url(#stretchFocusGlow)"
                opacity={(squat - 0.5) * 1.85}
              />
              {focusZoom > 0.35 && (
                <circle
                  cx={pelvisC.x}
                  cy={pelvisC.y - 3}
                  r={11 + holdBreath}
                  fill="none"
                  stroke={amberFocus}
                  strokeWidth="1.2"
                  strokeDasharray="2.5 2"
                  opacity={focusZoom * 0.85}
                />
              )}
            </>
          )}

          {/* Far-side (Left) Leg */}
          <path d={anatomicalLimbPath(hipL.x, hipL.y, kneeL.x, kneeL.y, 6.0, 4.2, 0.22)} fill={bodyFill} opacity={lerp(0.88, 0.42, sideFactor)} />
          <path d={anatomicalLimbPath(kneeL.x, kneeL.y, ankleL.x, ankleL.y, 4.1, 2.6, 0.2)} fill={bodyFill} opacity={lerp(0.92, 0.42, sideFactor)} />
          <path d={anatomicalLimbPath(ankleL.x, ankleL.y, toeL.x, toeL.y, 2.7, 2.0, 0.05)} fill={squat > 0.35 ? accent : bodyFill} opacity={lerp(0.95, 0.48, sideFactor)} />

          {/* Contoured 3D Torso & Pelvis Silhouette */}
          <path
            d={`M ${shoulderR.x - torsoDepthHalf} ${shoulderR.y}
                Q ${shoulderC.x} ${shoulderC.y - 2} ${shoulderL.x + torsoDepthHalf} ${shoulderL.y}
                L ${hipL.x + torsoDepthHalf} ${hipL.y}
                Q ${pelvisC.x} ${pelvisC.y + 7} ${hipR.x - torsoDepthHalf} ${hipR.y} Z`}
            fill={bodySubtle}
            stroke={bodyFill}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Pelvis / Sacroiliac Anatomical Bowl */}
          <ellipse
            cx={pelvisC.x}
            cy={pelvisC.y}
            rx={lerp(13, 8.5, sideFactor)}
            ry="6"
            fill={focusZoom > 0.2 ? emerald : bodyFill}
            opacity={lerp(0.24, 0.48, focusZoom)}
          />

          {/* Articulated Lumbar & Thoracic Spine Curve */}
          <path
            d={`M ${shoulderC.x} ${shoulderC.y + 2} Q ${lumbarMid.x} ${lumbarMid.y} ${pelvisC.x} ${pelvisC.y + 1}`}
            fill="none"
            stroke={squat > 0.7 ? emerald : accent}
            strokeWidth={lerp(3.2, 4.0, focusZoom)}
            strokeLinecap="round"
            strokeDasharray="2.5 2"
          />

          {/* Near-side (Right) Leg */}
          <path d={anatomicalLimbPath(hipR.x, hipR.y, kneeR.x, kneeR.y, 6.2, 4.4, 0.22)} fill={bodyFill} opacity="0.92" />
          <path d={anatomicalLimbPath(kneeR.x, kneeR.y, ankleR.x, ankleR.y, 4.3, 2.7, 0.2)} fill={bodyFill} opacity="0.95" />
          <path d={anatomicalLimbPath(ankleR.x, ankleR.y, toeR.x, toeR.y, 2.8, 2.1, 0.06)} fill={squat > 0.35 ? accent : bodyFill} />

          {/* Highlighted Hip Socket, Knee & Ankle Dorsiflexion Joints */}
          <circle cx={hipR.x} cy={hipR.y} r={lerp(3.5, 4.8, focusZoom)} fill={emerald} opacity={lerp(0.35, 0.85, focusZoom)} />
          <circle cx={kneeR.x} cy={kneeR.y} r="3.8" fill={accent} opacity="0.45" />
          <circle cx={ankleR.x} cy={ankleR.y} r={lerp(2.6, 3.6, focusZoom)} fill={emerald} opacity={lerp(0.35, 0.8, focusZoom)} />

          {/* Far-side & Near-side Arms */}
          <path d={anatomicalLimbPath(shoulderL.x, shoulderL.y, elbowL.x, elbowL.y, 3.4, 2.6, 0.14)} fill={bodyFill} opacity={lerp(0.88, 0.42, sideFactor)} />
          <path d={anatomicalLimbPath(elbowL.x, elbowL.y, handL.x, handL.y, 2.6, 1.9, 0.12)} fill={bodyFill} opacity={lerp(0.92, 0.42, sideFactor)} />

          <path d={anatomicalLimbPath(shoulderR.x, shoulderR.y, elbowR.x, elbowR.y, 3.6, 2.8, 0.14)} fill={bodyFill} opacity="0.94" />
          <path d={anatomicalLimbPath(elbowR.x, elbowR.y, handR.x, handR.y, 2.7, 2.0, 0.12)} fill={bodyFill} opacity="0.96" />

          {/* Prayer Hands (Anjali Mudra) */}
          {prayer > 0.6 ? (
            <path
              d={`M ${prayerC.x} ${prayerC.y - 6} L ${prayerC.x - 3.5} ${prayerC.y + 1} L ${prayerC.x} ${prayerC.y + 3} L ${prayerC.x + 3.5} ${prayerC.y + 1} Z`}
              fill={emerald}
              stroke={bodyFill}
              strokeWidth="1.2"
            />
          ) : (
            <>
              <circle cx={handR.x} cy={handR.y} r="2.3" fill={bodyFill} />
              <circle cx={handL.x} cy={handL.y} r="2.3" fill={bodyFill} opacity={lerp(1, 0.42, sideFactor)} />
            </>
          )}

          {/* Neck & Sculpted 3D Head */}
          <path d={anatomicalLimbPath(shoulderC.x, shoulderC.y, neckC.x, neckC.y, 3.2, 2.8, 0)} fill={bodyFill} />
          <ellipse cx={headC.x} cy={headC.y} rx="7.2" ry="8.4" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.4" />
          <circle cx={headC.x + Math.sin((cameraAngleDeg * Math.PI) / 180) * 4.5} cy={headC.y - 1} r="1.3" fill={accent} opacity="0.7" />
        </g>
      </svg>
    );
  }

  // ==========================================================================
  // 2. SEATED SPINAL TWIST — Clear 4-Step Setup -> Hand & Elbow -> Twist -> Hold
  //    Shows how to get into the seated position clearly from an oblique-front view,
  //    then holds while the camera smoothly orbits 0° -> 90° without double-take.
  // ==========================================================================
  if (stretchId === 'seated-twist') {
    // Step 0 (0..3200ms): Sit tall on mat with both legs extended, then bend left knee & step foot over right thigh
    const legCross =
      t < 800
        ? 0
        : t < 3000
          ? easeInOut((t - 800) / 2200)
          : t < 14400
            ? 1
            : 1 - easeInOut((t - 14400) / 1400);

    // Step 1 (3200..6200ms): Place left support hand behind hip & hook right elbow outside raised left knee
    const armHook =
      t < 3200
        ? 0
        : t < 5800
          ? easeInOut((t - 3200) / 2600)
          : t < 14400
            ? 1
            : 1 - easeInOut((t - 14400) / 1400);

    // Step 2 (6200..9200ms): Gently rotate torso, shoulders & head toward bent knee
    const twist =
      t < 6200
        ? 0
        : t < 8800
          ? easeInOut((t - 6200) / 2600)
          : t < 14400
            ? 1
            : 1 - easeInOut((t - 14400) / 1400);

    // Step 3 (9200..14400ms): Hold tall spinal twist while camera smoothly orbits 0° -> 90°
    let cameraAngleDeg = 0;
    let focusZoom = 0;
    if (t >= 9200 && t < 14400) {
      const orbit = oneWayCalculusCameraOrbit((t - 9200) / 5200);
      cameraAngleDeg = orbit.angleDeg;
      focusZoom = orbit.focusZoom;
    }

    const isHolding = t >= 8800 && t < 14400;
    const baseViewDeg = 24 + cameraAngleDeg * 0.72; // Starts at clear 24° oblique-front view so both legs are visible!

    // Pelvis stays centered at (56, 90, z=0) so it never shifts sideways
    const pelvisC = project3D(56, 90, 0, baseViewDeg, 56, 75);
    const shoulderC = project3D(56, 52, 0, baseViewDeg, 56, 75);
    const headC = project3D(56 + twist * 2, 38, 0, baseViewDeg, 56, 75);

    // Bottom (Right) leg stays extended straight along the mat (+Z / +X)
    const extKnee = project3D(66, 91, 14, baseViewDeg, 56, 75);
    const extFoot = project3D(78, 93, 28, baseViewDeg, 56, 75);

    // Top (Left) leg starts extended alongside right leg, then bends knee up & steps foot outside right knee!
    const activeKnee = project3D(
      lerp(68, 62, legCross),
      lerp(91, 67, legCross),
      lerp(14, 10, legCross),
      baseViewDeg,
      56,
      75
    );
    const activeFoot = project3D(
      lerp(80, 62, legCross),
      lerp(93, 93, legCross),
      lerp(28, 17, legCross),
      baseViewDeg,
      56,
      75
    );

    // Support arm (planted on mat behind hip) & hooking elbow (outside raised knee)
    const shBack = project3D(48, 53, -twist * 8, baseViewDeg, 56, 75);
    const shFront = project3D(64, 53, twist * 8, baseViewDeg, 56, 75);

    const supportElbow = project3D(lerp(46, 40, armHook), lerp(72, 73, armHook), lerp(0, -10, armHook), baseViewDeg, 56, 75);
    const supportHand = project3D(lerp(48, 37, armHook), 92, lerp(4, -14, armHook), baseViewDeg, 56, 75);

    const hookElbow = project3D(
      lerp(66, activeKnee.x - 1, armHook),
      lerp(72, activeKnee.y + 2, armHook),
      lerp(4, 12, armHook),
      baseViewDeg,
      56,
      75
    );
    const hookHand = project3D(
      lerp(70, activeKnee.x + 2, armHook),
      lerp(84, activeKnee.y - 10, armHook),
      lerp(8, 14, armHook),
      baseViewDeg,
      56,
      75
    );

    const zoomScale = 1 + focusZoom * 0.2;

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <HoldBadge visible={isHolding} label={cameraAngleDeg > 15 ? 'HOLD · SPINE FOCUS' : 'HOLD TALL TWIST'} />
        <g
          style={{
            transform: `translate(${pelvisC.x}px, ${pelvisC.y - 12}px) scale(${zoomScale.toFixed(3)}) translate(${-pelvisC.x}px, ${-(pelvisC.y - 12)}px)`,
          }}
        >
          {/* Grounded Mat */}
          <ellipse cx="60" cy="96" rx="46" ry="6.5" fill={bodySubtle} stroke={accent} strokeWidth="0.7" strokeOpacity="0.3" />

          {/* Lumbar & Outer Hip Stretch Focus Glow */}
          {twist > 0.3 && (
            <circle
              cx={pelvisC.x}
              cy={pelvisC.y - 10}
              r={14 + focusZoom * 5}
              fill={emerald}
              opacity={0.18 + twist * 0.22}
            />
          )}

          {/* Support Arm planted behind hip */}
          <path d={anatomicalLimbPath(shBack.x, shBack.y, supportElbow.x, supportElbow.y, 3.3, 2.5, 0.12)} fill={bodyFill} opacity="0.82" />
          <path d={anatomicalLimbPath(supportElbow.x, supportElbow.y, supportHand.x, supportHand.y, 2.5, 2.0, 0.1)} fill={bodyFill} opacity="0.82" />

          {/* Extended Right Leg on Mat */}
          <path d={anatomicalLimbPath(pelvisC.x, pelvisC.y, extKnee.x, extKnee.y, 5.6, 4.0, 0.18)} fill={bodyFill} opacity="0.72" />
          <path d={anatomicalLimbPath(extKnee.x, extKnee.y, extFoot.x, extFoot.y, 3.9, 2.6, 0.16)} fill={bodyFill} opacity="0.72" />
          <path d={`M ${extFoot.x} ${extFoot.y} L ${extFoot.x + 3} ${extFoot.y - 7}`} stroke={bodyFill} strokeWidth="3" strokeLinecap="round" opacity="0.72" />

          {/* Contoured Upright Torso */}
          <path
            d={`M ${shBack.x - 3} ${shBack.y} Q ${shoulderC.x} ${shoulderC.y - 2} ${shFront.x + 3} ${shFront.y} L ${pelvisC.x + 8} ${pelvisC.y} Q ${pelvisC.x} ${pelvisC.y + 5} ${pelvisC.x - 8} ${pelvisC.y} Z`}
            fill={bodySubtle}
            stroke={bodyFill}
            strokeWidth="2.2"
          />

          {/* Tall Helical Spine Highlight */}
          <path
            d={`M ${pelvisC.x} ${pelvisC.y} Q ${pelvisC.x + twist * 3} 71 ${shoulderC.x} ${shoulderC.y}`}
            fill="none"
            stroke={twist > 0.5 ? emerald : accent}
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeDasharray="3 2"
          />

          {/* Bending & Crossed Left Leg (steps outside opposite knee) */}
          <path d={anatomicalLimbPath(pelvisC.x - 2, pelvisC.y, activeKnee.x, activeKnee.y, 5.8, 4.1, 0.22)} fill={legCross > 0.5 ? accent : bodyFill} />
          <path d={anatomicalLimbPath(activeKnee.x, activeKnee.y, activeFoot.x, activeFoot.y, 4.0, 2.6, 0.18)} fill={bodyFill} />
          <path d={`M ${activeFoot.x - 2} ${activeFoot.y + 1} L ${activeFoot.x + 7} ${activeFoot.y + 1}`} stroke={accent} strokeWidth="3.5" strokeLinecap="round" />

          {/* Front Arm Hooking Elbow Outside Bent Knee */}
          <path d={anatomicalLimbPath(shFront.x, shFront.y, hookElbow.x, hookElbow.y, 3.5, 2.6, 0.14)} fill={bodyFill} />
          <path d={anatomicalLimbPath(hookElbow.x, hookElbow.y, hookHand.x, hookHand.y, 2.5, 2.0, 0.12)} fill={armHook > 0.5 ? emerald : bodyFill} />

          {/* Sculpted Head turning into twist */}
          <ellipse cx={headC.x} cy={headC.y} rx="6.8" ry="8" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.3" />
          <circle cx={headC.x - 2 - twist * 2.5} cy={headC.y - 1} r="1.2" fill={accent} />
        </g>
      </svg>
    );
  }

  // ==========================================================================
  // 3. KNEE-TO-CHEST — Slow Gentle Pull -> 6.4s Sustained Hold -> Gentle Release
  //    With articulated ball-and-socket hip joint bringing knee closely to chest
  // ==========================================================================
  if (stretchId === 'knee-to-chest') {
    const env = stretchHoldReleaseEnvelope(t);
    const pull = env.stretch;
    const holdMicro = env.breath * 0.6;

    const hipX = lerp(63, 59, pull);
    const hipY = lerp(87, 84, pull);
    const kneeX = lerp(64, 36, pull) - holdMicro * 0.4;
    const kneeY = lerp(64, 67, pull);
    const ankleX = lerp(80, 52, pull);
    const ankleY = lerp(76, 74, pull);

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <HoldBadge visible={env.isHolding} />
        <rect x="10" y="92" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
        <ellipse cx={hipX - 6} cy="88" rx={14 + pull * 6 + holdMicro} ry="5.5" fill={emerald} opacity={0.18 + pull * 0.35} />

        {/* Supine Head on Pillow (Face-Up Profile: nose & chin point UP toward ceiling) */}
        <rect x="11" y="86" width="15" height="6" rx="3" fill={accent} opacity="0.2" />
        <ellipse cx="20" cy="81" rx="7" ry="6.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <path d="M 21 75 L 23 72 L 25 76" fill="none" stroke={bodyFill} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

        {/* Supine Contoured Torso */}
        <path d={`M 28 81 Q 44 79 ${hipX + 3} ${hipY - 2} L ${hipX + 4} 92 L 28 92 Z`} fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <line x1="30" y1="89" x2={hipX + 1} y2={hipY + 3} stroke={emerald} strokeWidth="3.2" strokeDasharray="3 2" />

        {/* Relaxed Anchor Leg */}
        <path d={anatomicalLimbPath(63, 88, 84, 69, 5.4, 3.8, 0.18)} fill={bodyFill} opacity="0.42" />
        <path d={anatomicalLimbPath(84, 69, 98, 91, 3.6, 2.4, 0.16)} fill={bodyFill} opacity="0.42" />
        <path d="M 96 92 L 106 92" stroke={bodyFill} strokeWidth="3.5" strokeLinecap="round" opacity="0.42" />

        {/* Articulated Hip Ball-and-Socket Joint Capsule */}
        <circle cx={hipX} cy={hipY} r="5.6" fill={emerald} opacity="0.35" stroke={accent} strokeWidth="1.2" strokeDasharray="2 1.5" />
        <circle cx={hipX} cy={hipY} r="2.8" fill={accent} />

        {/* Active Thigh & Calf drawn snugly to chest */}
        <path d={anatomicalLimbPath(hipX, hipY, kneeX, kneeY, 6.0, 4.2, 0.24)} fill={bodyFill} />
        <path d={anatomicalLimbPath(kneeX, kneeY, ankleX, ankleY, 4.1, 2.6, 0.18)} fill={bodyFill} />
        <path d={anatomicalLimbPath(ankleX, ankleY, ankleX + 6, ankleY + 4, 2.5, 1.8, 0.05)} fill={accent} />
        <circle cx={kneeX} cy={kneeY} r="3.8" fill={emerald} opacity="0.6" />

        {/* Arms gently clasping shin */}
        <path d={anatomicalLimbPath(33, 83, lerp(46, 34, pull), lerp(74, 62, pull), 3.3, 2.5, 0.12)} fill={bodyFill} />
        <path d={anatomicalLimbPath(lerp(46, 34, pull), lerp(74, 62, pull), kneeX + 4, kneeY + 2, 2.5, 2.0, 0.1)} fill={accent} />
      </svg>
    );
  }

  // ==========================================================================
  // 4. SUPINE PIRIFORMIS (FIGURE-4) — Slow Stretch -> Sustained Hold -> Release
  // ==========================================================================
  if (stretchId === 'piriformis') {
    const env = stretchHoldReleaseEnvelope(t);
    const pull = env.stretch;
    const thighX = lerp(67, 45, pull);
    const thighY = lerp(64, 54, pull);

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <HoldBadge visible={env.isHolding} />
        <rect x="10" y="92" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
        <circle cx="59" cy="86" r={10 + pull * 5 + env.breath} fill={emerald} opacity={0.2 + pull * 0.32} />

        {/* Face-up head on pillow */}
        <rect x="11" y="86" width="15" height="6" rx="3" fill={accent} opacity="0.2" />
        <ellipse cx="20" cy="81" rx="7" ry="6.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <path d="M 21 75 L 23 72 L 25 76" fill="none" stroke={bodyFill} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M 28 82 Q 44 80 61 84 L 62 92 L 28 92 Z" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <circle cx="59" cy="87" r="4.5" fill={emerald} opacity="0.4" />

        {/* Support Leg drawn toward chest */}
        <path d={anatomicalLimbPath(60, 88, thighX, thighY, 5.6, 4.0, 0.2)} fill={bodyFill} opacity="0.75" />
        <path d={anatomicalLimbPath(thighX, thighY, thighX + 20, thighY + 3, 3.8, 2.5, 0.16)} fill={bodyFill} opacity="0.75" />

        {/* Crossed Figure-4 Leg */}
        <path d={anatomicalLimbPath(58, 87, thighX - 8, thighY + 13, 5.8, 4.1, 0.22)} fill={accent} />
        <path d={anatomicalLimbPath(thighX - 8, thighY + 13, thighX + 2, thighY + 1, 3.9, 2.5, 0.16)} fill={accent} />

        {/* Hands clasping behind thigh */}
        <path d={anatomicalLimbPath(34, 84, thighX - 1, thighY + 6, 3.0, 2.2, 0.1)} fill={bodyFill} />
      </svg>
    );
  }

  // ==========================================================================
  // 5. SCIATIC NERVE GLIDE (FLOSSING) — Controlled Glide + 2s Pause at Each End
  // ==========================================================================
  if (stretchId === 'nerve-glide') {
    // Step 0 (0..2400): Neutral seated
    // Step 1 (2400..7200): Extend knee & tilt head back (2400..4800), pause 2.4s (4800..7200)
    // Step 2 (7200..12400): Flex knee & nod chin to chest (7200..9800), pause 2.6s (9800..12400)
    // Step 3 (12400..16000): Smooth release to neutral
    let glide = 0.35; // neutral baseline
    let pauseLabel = '';
    if (t >= 2400 && t < 4800) {
      glide = lerp(0.35, 1, easeInOut((t - 2400) / 2400));
    } else if (t >= 4800 && t < 7200) {
      glide = 1;
      pauseLabel = 'PAUSE 2s · EXTEND';
    } else if (t >= 7200 && t < 9800) {
      glide = lerp(1, 0, easeInOut((t - 7200) / 2600));
    } else if (t >= 9800 && t < 12400) {
      glide = 0;
      pauseLabel = 'PAUSE 2s · FLEX';
    } else if (t >= 12400 && t < 14600) {
      glide = lerp(0, 0.35, easeInOut((t - 12400) / 2200));
    }

    const footX = lerp(66, 98, glide);
    const footY = lerp(97, 68, glide);
    const headTiltX = lerp(53, 46, glide);
    const headTiltY = lerp(31, 25, glide);

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <HoldBadge visible={pauseLabel !== ''} label={pauseLabel} />
        <path d="M 34 38 L 34 102 M 34 72 L 64 72 L 64 102" fill="none" stroke={bodyFill} strokeWidth="3" opacity="0.3" strokeLinecap="round" />
        <path d="M 42 38 L 55 38 L 57 70 L 41 70 Z" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <path d={`M 48 42 L 49 69 L 68 69 L ${footX} ${footY}`} fill="none" stroke={emerald} strokeWidth="2.8" strokeDasharray="3 2" />
        <path d={anatomicalLimbPath(49, 69, 69, 69, 5.6, 4.1, 0.18)} fill={bodyFill} />
        <path d={anatomicalLimbPath(69, 69, footX, footY, 4.0, 2.6, 0.18)} fill={bodyFill} />
        <path d={`M ${footX} ${footY} L ${footX + 4} ${footY - 8}`} stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx={headTiltX} cy={headTiltY} rx="6.8" ry="7.6" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
      </svg>
    );
  }

  // ==========================================================================
  // 6. CAT-COW — Neutral -> Cow Pose + Hold -> Release -> Cat Pose + Hold -> Release
  // ==========================================================================
  if (stretchId === 'cat-cow') {
    let arch = 0; // -1 = Cow (belly dip), 0 = Neutral tabletop, +1 = Cat (rounded spine)
    let holdLabel = '';

    if (t >= 2200 && t < 4000) {
      arch = -easeInOut((t - 2200) / 1800);
    } else if (t >= 4000 && t < 6400) {
      arch = -1;
      holdLabel = 'HOLD COW (3s)';
    } else if (t >= 6400 && t < 7600) {
      arch = -1 + easeInOut((t - 6400) / 1200);
    } else if (t >= 7600 && t < 9400) {
      arch = easeInOut((t - 7600) / 1800);
    } else if (t >= 9400 && t < 11800) {
      arch = 1;
      holdLabel = 'HOLD CAT (3s)';
    } else if (t >= 11800 && t < 13200) {
      arch = 1 - easeInOut((t - 11800) / 1400);
    }

    const spineCtrlY = 60 - arch * 16;
    const headY = 55 + arch * 9;

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <HoldBadge visible={holdLabel !== ''} label={holdLabel} />
        <rect x="14" y="96" width="92" height="4" rx="2" fill={accent} opacity="0.22" />
        <path d={anatomicalLimbPath(34, 64, 32, 95, 5.2, 3.5, 0.16)} fill={bodyFill} />
        <path d={anatomicalLimbPath(32, 95, 18, 96, 3.2, 2.2, 0.1)} fill={bodyFill} />
        <path d={anatomicalLimbPath(80, 62, 82, 95, 3.6, 2.4, 0.12)} fill={bodyFill} />
        <path
          d={`M 33 64 Q 57 ${spineCtrlY} 80 62 Q 57 ${spineCtrlY + 11} 33 68 Z`}
          fill={bodySubtle}
          stroke={bodyFill}
          strokeWidth="2.2"
        />
        <path
          d={`M 33 64 Q 57 ${spineCtrlY - 2} 80 62`}
          fill="none"
          stroke={Math.abs(arch) > 0.7 ? emerald : accent}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="3 2"
        />
        <ellipse cx="90" cy={headY} rx="6.5" ry="7.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
      </svg>
    );
  }

  // ==========================================================================
  // 7. CHILD'S POSE — Kneel Upright -> Fold Forward -> Sustained Hold -> Release
  // ==========================================================================
  if (stretchId === 'childs-pose') {
    const env = stretchHoldReleaseEnvelope(t);
    const fold = env.stretch;
    const breath = env.breath * 2.2;

    const shoulderX = lerp(36, 70, fold);
    const shoulderY = lerp(52, 82, fold);
    const headX = lerp(37, 79, fold);
    const headY = lerp(39, 87, fold);
    const handX = lerp(44, 102, fold);
    const handY = lerp(74, 92, fold);
    const spineMidX = lerp(33, 48, fold);
    const spineMidY = lerp(67, 62 - breath, fold);

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <HoldBadge visible={env.isHolding} />
        <rect x="10" y="94" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
        {fold > 0.5 && (
          <ellipse cx="48" cy={72 - breath * 0.5} rx="18" ry="8" fill={emerald} opacity={(fold - 0.5) * 0.55} />
        )}
        {/* Folded thighs & shins resting on heels */}
        <path d={anatomicalLimbPath(30, 82, 54, 92, 5.8, 3.8, 0.2)} fill={bodyFill} opacity="0.9" />
        <path d={anatomicalLimbPath(54, 92, 24, 93, 3.8, 2.5, 0.15)} fill={bodyFill} opacity="0.85" />
        {/* Folding & Decompressing Torso */}
        <path
          d={`M 28 82 Q ${spineMidX} ${spineMidY} ${shoulderX} ${shoulderY} L ${shoulderX - 2} ${shoulderY + 6} Q ${spineMidX} ${spineMidY + 12} 28 86 Z`}
          fill={bodySubtle}
          stroke={bodyFill}
          strokeWidth="2.2"
        />
        <path d={`M 29 81 Q ${spineMidX} ${spineMidY - 1} ${shoulderX} ${shoulderY}`} fill="none" stroke={emerald} strokeWidth="3.2" strokeDasharray="3 2" />
        {/* Reaching Arms */}
        <path d={anatomicalLimbPath(shoulderX, shoulderY, handX, handY, 3.2, 2.0, 0.1)} fill={bodyFill} />
        <ellipse cx={headX} cy={headY} rx="6" ry="5.8" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
      </svg>
    );
  }

  // ==========================================================================
  // 8. SUPINE HAMSTRING STRETCH — Setup -> Slow Lift -> Sustained Hold -> Release
  // ==========================================================================
  if (stretchId === 'hamstring') {
    const env = stretchHoldReleaseEnvelope(t);
    const lift = env.stretch;
    const footX = lerp(84, 62, lift);
    const footY = lerp(66, 32, lift);
    const kneeX = lerp(72, 61, lift);
    const kneeY = lerp(74, 60, lift);

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <HoldBadge visible={env.isHolding} />
        <rect x="10" y="92" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
        <rect x="11" y="86" width="15" height="6" rx="3" fill={accent} opacity="0.2" />
        <ellipse cx="20" cy="81" rx="7" ry="6.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <path d="M 21 75 L 23 72 L 25 76" fill="none" stroke={bodyFill} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M 29 82 Q 45 80 61 84 L 62 92 L 29 92 Z" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <path d={anatomicalLimbPath(60, 89, 98, 90, 5.2, 2.8, 0.15)} fill={bodyFill} opacity="0.45" />
        <path d={anatomicalLimbPath(58, 87, kneeX, kneeY, 5.8, 4.1, 0.2)} fill={bodyFill} />
        <path d={anatomicalLimbPath(kneeX, kneeY, footX, footY, 4.0, 2.6, 0.18)} fill={bodyFill} />
        <path d={`M 60 88 L ${kneeX + 2} ${kneeY} L ${footX + 2} ${footY}`} fill="none" stroke={emerald} strokeWidth="2.8" strokeDasharray="3 2" />
        <line x1="42" y1="76" x2={footX} y2={footY} stroke={accent} strokeWidth="2" strokeDasharray="3 2" />
        <path d={anatomicalLimbPath(34, 84, 44, 75, 3.2, 2.2, 0.1)} fill={bodyFill} />
      </svg>
    );
  }

  // ==========================================================================
  // 9. PELVIC TILT — Neutral Curve -> Flatten Into Mat -> 5s Hold -> Release
  // ==========================================================================
  if (stretchId === 'pelvic-tilt') {
    const env = stretchHoldReleaseEnvelope(t);
    const tilt = env.stretch;
    const lumbarY = lerp(82, 89.5, tilt);

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <HoldBadge visible={env.isHolding} label="HOLD 5s · CORE FLAT" />
        <rect x="10" y="92" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
        <ellipse cx="50" cy="89" rx={12 + tilt * 6} ry="5" fill={emerald} opacity={0.12 + tilt * 0.38} />
        <rect x="11" y="86" width="15" height="6" rx="3" fill={accent} opacity="0.2" />
        <ellipse cx="20" cy="81" rx="7" ry="6.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <path d="M 21 75 L 23 72 L 25 76" fill="none" stroke={bodyFill} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

        <path d={`M 29 82 Q 46 ${lumbarY - 5} 62 85 L 62 91 Q 46 ${lumbarY + 2} 29 91 Z`} fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <path d={`M 30 87 Q 46 ${lumbarY} 61 88`} fill="none" stroke={emerald} strokeWidth="3.4" strokeLinecap="round" />
        <path d={anatomicalLimbPath(61, 88, 79, 64, 5.6, 4.0, 0.2)} fill={bodyFill} />
        <path d={anatomicalLimbPath(79, 64, 95, 91, 3.9, 2.5, 0.16)} fill={bodyFill} />
      </svg>
    );
  }

  // ==========================================================================
  // 10. PRONE PRESS-UP (MCKENZIE) — Unmistakable Face-Down (Prone) Signifiers
  //     + Slow Press-Up -> Sustained Extension Hold -> Gentle Release to Mat
  // ==========================================================================
  const env = stretchHoldReleaseEnvelope(t);
  const press = env.stretch;

  // At press=0 (Step 0), chest (84) and face-down forehead/nose (78) rest right on the mat!
  // Elbows wing up/back (46, 74) while palms stay planted flat at (32, 91).
  const shoulderX = lerp(35, 34, press);
  const shoulderY = lerp(83, 56, press);
  const elbowX = lerp(47, 36, press);
  const elbowY = lerp(73, 75, press);
  const headX = lerp(23, 28, press);
  const headY = lerp(82, 43, press);

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
      <HoldBadge visible={env.isHolding} label="HOLD EXTENSION" />
      {/* Floor Mat */}
      <rect x="8" y="92" width="104" height="4" rx="2" fill={accent} opacity="0.24" />

      {/* Unmistakable Prone / Face-Down Orientation Badge & Pelvis Floor Anchor */}
      <g opacity="0.85">
        <text x="84" y="75" textAnchor="middle" className="text-[5.8px] font-bold fill-[#0051ae] dark:fill-blue-300">
          FACE DOWN · HIPS ON MAT
        </text>
        {/* Downward anchor arrow pressing pelvis to floor */}
        <line x1="60" y1="77" x2="60" y2="85" stroke={emerald} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 57.5 83 L 60 86 L 62.5 83" fill="none" stroke={emerald} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Lumbar Extension Decompression Glow */}
      {press > 0.3 && (
        <ellipse cx="48" cy="82" rx={11 + press * 5} ry="6" fill={emerald} opacity={(press - 0.3) * 0.45} />
      )}

      {/* Anchored Pelvis, Thighs, Calves & Prone Feet (heels UP, toes pointing DOWN into mat!) */}
      <path d={anatomicalLimbPath(57, 89, 82, 89, 5.6, 4.0, 0.18)} fill={bodyFill} />
      <path d={anatomicalLimbPath(82, 89, 102, 89, 3.9, 2.5, 0.16)} fill={bodyFill} />
      {/* Prone Foot: Heel on top (y=86), dorsal foot sloping down to toes on mat (y=92) */}
      <path d="M 101 86 L 109 92 L 100 92 Z" fill={accent} />

      {/* Extending Lumbar & Thoracic Torso (chest lifts while pelvis stays anchored at 58,89) */}
      <path
        d={`M 59 88 Q 46 86 ${shoulderX} ${shoulderY} L ${shoulderX + 6} ${shoulderY + 5} Q 48 91 59 92 Z`}
        fill={bodySubtle}
        stroke={bodyFill}
        strokeWidth="2.2"
      />
      <path d={`M 58 89 Q 45 85 ${shoulderX + 2} ${shoulderY + 2}`} fill="none" stroke={emerald} strokeWidth="3.4" strokeDasharray="3 2" />

      {/* Articulated Upper Arm, Bent Elbow & Forearm with Palm Planted Flat on Mat */}
      <path d={anatomicalLimbPath(shoulderX, shoulderY + 1, elbowX, elbowY, 3.4, 2.6, 0.12)} fill={bodyFill} />
      <path d={anatomicalLimbPath(elbowX, elbowY, 33, 91, 2.5, 2.0, 0.1)} fill={bodyFill} />
      {/* Flat planted hand & fingers pointing forward on mat */}
      <path d="M 35 91.5 L 25 91.5" stroke={accent} strokeWidth="3.2" strokeLinecap="round" />

      {/* Sculpted Prone Head with Nose/Chin Profile Pointing DOWN toward the Mat */}
      <ellipse cx={headX} cy={headY} rx="6.8" ry="6.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
      {/* Nose & chin facing down/forward (opposite of supine!) */}
      <path
        d={`M ${headX - 6} ${headY + 1} L ${headX - 9} ${headY + 4} L ${headX - 4} ${headY + 5}`}
        fill="none"
        stroke={bodyFill}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Downward eye/gaze line toward floor */}
      <line
        x1={headX - 4}
        y1={headY + 3}
        x2={headX - 8}
        y2={Math.min(91, headY + 11)}
        stroke={accent}
        strokeWidth="1.1"
        strokeDasharray="1.5 1.5"
        opacity="0.7"
      />
    </svg>
  );
}
