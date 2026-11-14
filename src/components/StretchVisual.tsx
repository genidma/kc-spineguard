// Realistic biomechanical & anatomical SVG illustrations with 3D joint projection,
// slow calculus-curve camera orbit (0° -> -12° -> 90°), target stretch focus zoom,
// and deep ball-and-socket hip articulation.
import React, { useEffect, useState } from 'react';

// Smooth cubic easing
function easeInOut(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Calculus-inspired camera orbit function:
// Starts at 0°, dips gently back (-12° anticipation), then sweeps smoothly along
// an inflection/sigmoid curve to +90° (side profile of the figure's right side),
// holds on the stretch focus zone, and resets smoothly.
function calculusCameraOrbit(u: number): { angleDeg: number; focusZoom: number } {
  const c = Math.max(0, Math.min(1, u));
  if (c < 0.18) {
    // Gentle reverse dip (-12°) before sweeping forward
    const p = c / 0.18;
    const angleDeg = -12 * Math.sin(p * Math.PI);
    return { angleDeg, focusZoom: 0 };
  }
  if (c < 0.72) {
    // Slow sigmoidal integral sweep from 0° to 90°
    const p = (c - 0.18) / 0.54;
    const s = p * p * (3 - 2 * p); // smoothstep polynomial integral
    const angleDeg = 90 * s;
    const focusZoom = Math.max(0, (p - 0.25) / 0.75);
    return { angleDeg, focusZoom: easeInOut(focusZoom) };
  }
  if (c < 0.88) {
    // Hold at 90° side profile while focusing on the stretch target zone
    return { angleDeg: 90, focusZoom: 1 };
  }
  // Smooth reset from 90° back to 0°
  const p = (c - 0.88) / 0.12;
  const reset = 1 - easeInOut(p);
  return { angleDeg: 90 * reset, focusZoom: reset };
}

// Projects a 3D anatomical point (x, y, z) around center (cx, cy, 0)
// as the camera orbits horizontally by angleDeg and elevates slightly along a calculus arc
function project3D(
  x: number,
  y: number,
  z: number,
  angleDeg: number,
  cx = 60,
  cy = 72
): { x: number; y: number; depth: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const elevRad = Math.sin(rad) * 0.14; // Subtle camera elevation arc
  const dx = x - cx;
  const dy = y - cy;

  const rx = dx * Math.cos(rad) + z * Math.sin(rad);
  const rz = -dx * Math.sin(rad) + z * Math.cos(rad);
  const ry = dy * Math.cos(elevRad) - rz * Math.sin(elevRad);

  // Subtle perspective foreshortening
  const persp = 1 + rz * 0.0022;
  return {
    x: cx + rx * persp,
    y: cy + ry * persp,
    depth: rz,
  };
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

export const MALASANA_CYCLE_MS = 16000;
export const SEATED_TWIST_CYCLE_MS = 16000;

export function getMalasanaStepFromCycle(cycleMs: number): number {
  const t = ((cycleMs % MALASANA_CYCLE_MS) + MALASANA_CYCLE_MS) % MALASANA_CYCLE_MS;
  if (t < 2500) return 0; // Step 1: Stand with feet shoulder-width apart
  if (t < 5500) return 1; // Step 2: Lower hips into deep squat, heels flat
  if (t < 8500) return 2; // Step 3: Palms together at heart center, elbows press inner knees
  return 3; // Step 4: Spine elongated, breathe & hold + slow 0°->90° camera orbit & stretch focus
}

export function getStretchActiveStep(stretchId: string, cycleMs: number): number {
  if (stretchId === 'deep-squat') {
    return getMalasanaStepFromCycle(cycleMs);
  }
  if (stretchId === 'seated-twist') {
    const t = ((cycleMs % SEATED_TWIST_CYCLE_MS) + SEATED_TWIST_CYCLE_MS) % SEATED_TWIST_CYCLE_MS;
    if (t < 3200) return 0; // Step 1: Sit with legs extended, bend one knee & cross foot outside opposite knee
    if (t < 6800) return 1; // Step 2: Place opposite elbow outside bent knee and gently rotate toward it
    return 2; // Step 3: Keep spine tall, hold + slow 0°->90° camera orbit & stretch focus
  }
  return -1;
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

  const wave = (Math.sin((nowMs / 1000) * (active ? 2.1 : 1.35)) + 1) * 0.5; // 0..1 smooth oscillation

  const bodyFill = 'currentColor';
  const bodySubtle = 'rgba(0, 81, 174, 0.14)';
  const accent = '#0051ae';
  const emerald = '#10b981';
  const amberFocus = '#f59e0b';

  // ==========================================================================
  // 1. DEEP FLAT-FOOT SQUAT (MALASANA)
  //    16-second cycle with true 3D joint projection, slow calculus camera orbit
  //    (0° -> -12° -> 90° to figure's right), and zoom focus on hip/lumbar stretch
  // ==========================================================================
  if (stretchId === 'deep-squat') {
    const t =
      progressPhase !== undefined
        ? progressPhase * MALASANA_CYCLE_MS
        : ((nowMs % MALASANA_CYCLE_MS) + MALASANA_CYCLE_MS) % MALASANA_CYCLE_MS;

    // Squat depth: 0 = standing tall, 1 = deep flat-foot Malasana squat
    let squat = 0;
    if (t < 2300) {
      squat = 0;
    } else if (t < 5300) {
      squat = easeInOut((t - 2300) / 3000);
    } else if (t < 14800) {
      squat = 1;
    } else {
      squat = 1 - easeInOut((t - 14800) / 1200);
    }

    // Prayer hands & elbow abduction engagement (Step 3: 5300ms -> 8200ms)
    let prayer = 0;
    if (t >= 4800 && t < 7200) {
      prayer = easeInOut((t - 4800) / 2400);
    } else if (t >= 7200 && t < 14700) {
      prayer = 1;
    } else if (t >= 14700) {
      prayer = 1 - easeInOut((t - 14700) / 1000);
    }

    // Slow calculus-curve camera orbit during Step 4 (8500ms -> 14800ms)
    let cameraAngleDeg = 0;
    let focusZoom = 0;
    if (t >= 8500 && t < 14800) {
      const orbit = calculusCameraOrbit((t - 8500) / 6300);
      cameraAngleDeg = orbit.angleDeg;
      focusZoom = orbit.focusZoom;
    }

    // Diaphragmatic breath during hold
    const holdBreath = t >= 7500 && t < 14800 ? Math.sin(((t - 7500) / 1800) * Math.PI * 2) * 1.0 : 0;

    // 3D Joint Coordinates (X: left/right, Y: up/down, Z: front/back)
    // In standing (squat=0), body is in the Z=0 plane.
    // In deep squat (squat=1):
    // - Pelvis/hips drop low (Y=85) and sit back (Z=-13)
    // - Knees flare wide (X=26/94) and track forward over toes (Z=+14)
    // - Ankles stay planted at Y=102, Z=-3, toes reach forward Z=+11
    // - Shoulders stay lifted upright over mid-foot (Y=50, Z=+1)
    const hipZ = lerp(0, -13, squat);
    const kneeZ = lerp(1, 14, squat);
    const ankleZ = -3;
    const toeZ = 10;
    const shoulderZ = lerp(0, 1, squat);
    const headZ = lerp(0, 2, squat);
    const elbowZ = lerp(0, 12, prayer * squat);
    const handZ = lerp(2, 16, prayer * squat);

    // Project 3D joints with current camera orbit angle
    const ankleR = project3D(41, 102, ankleZ, cameraAngleDeg);
    const ankleL = project3D(79, 102, ankleZ, cameraAngleDeg);
    const toeR = project3D(33, 103, toeZ, cameraAngleDeg);
    const toeL = project3D(87, 103, toeZ, cameraAngleDeg);

    const kneeR = project3D(lerp(43, 25, squat), lerp(76, 69, squat), kneeZ, cameraAngleDeg);
    const kneeL = project3D(lerp(77, 95, squat), lerp(76, 69, squat), kneeZ, cameraAngleDeg);

    const hipR = project3D(lerp(49, 45, squat), lerp(53, 85, squat) + holdBreath * 0.4, hipZ, cameraAngleDeg);
    const hipL = project3D(lerp(71, 75, squat), lerp(53, 85, squat) + holdBreath * 0.4, hipZ, cameraAngleDeg);
    const pelvisC = project3D(60, lerp(54, 86, squat) + holdBreath * 0.4, hipZ, cameraAngleDeg);
    const lumbarMid = project3D(60, lerp(40, 68, squat), lerp(0, -6, squat), cameraAngleDeg);

    const shoulderR = project3D(lerp(45, 45, squat), lerp(27, 50, squat) - holdBreath * 0.5, shoulderZ, cameraAngleDeg);
    const shoulderL = project3D(lerp(75, 75, squat), lerp(27, 50, squat) - holdBreath * 0.5, shoulderZ, cameraAngleDeg);
    const shoulderC = project3D(60, lerp(27, 50, squat) - holdBreath * 0.5, shoulderZ, cameraAngleDeg);
    const neckC = project3D(60, lerp(23, 45, squat) - holdBreath * 0.5, headZ, cameraAngleDeg);
    const headC = project3D(60, lerp(15, 37, squat) - holdBreath * 0.5, headZ, cameraAngleDeg);

    const elbowR = project3D(
      lerp(40, 30, prayer * squat),
      lerp(41, 68, squat * 0.85 + prayer * 0.15),
      elbowZ,
      cameraAngleDeg
    );
    const elbowL = project3D(
      lerp(80, 90, prayer * squat),
      lerp(41, 68, squat * 0.85 + prayer * 0.15),
      elbowZ,
      cameraAngleDeg
    );

    const handR = project3D(lerp(39, 58, prayer), lerp(55, 61, squat) - prayer * 2, handZ, cameraAngleDeg);
    const handL = project3D(lerp(81, 62, prayer), lerp(55, 61, squat) - prayer * 2, handZ, cameraAngleDeg);
    const prayerC = project3D(60, lerp(55, 59, squat), handZ + 1, cameraAngleDeg);

    // Camera zoom onto the lumbar/hip/ankle stretch zone as camera approaches 90°
    const zoomScale = 1 + focusZoom * 0.26;
    const focusOriginX = pelvisC.x;
    const focusOriginY = pelvisC.y - 6;

    // Torso width narrows naturally as camera orbits from front (0°) to side profile (90°)
    const sideFactor = Math.sin((Math.abs(cameraAngleDeg) * Math.PI) / 180);
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

        <g
          style={{
            transform: `translate(${focusOriginX}px, ${focusOriginY}px) scale(${zoomScale.toFixed(3)}) translate(${-focusOriginX}px, ${-focusOriginY}px)`,
          }}
        >
          {/* 3D Perspective Yoga Mat */}
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

          {/* Far-side (Left) Leg rendered behind torso when rotated toward 90° */}
          <path d={anatomicalLimbPath(hipL.x, hipL.y, kneeL.x, kneeL.y, 6.0, 4.2, 0.22)} fill={bodyFill} opacity={lerp(0.88, 0.45, sideFactor)} />
          <path d={anatomicalLimbPath(kneeL.x, kneeL.y, ankleL.x, ankleL.y, 4.1, 2.6, 0.2)} fill={bodyFill} opacity={lerp(0.92, 0.45, sideFactor)} />
          <path d={anatomicalLimbPath(ankleL.x, ankleL.y, toeL.x, toeL.y, 2.7, 2.0, 0.05)} fill={squat > 0.35 ? accent : bodyFill} opacity={lerp(0.95, 0.5, sideFactor)} />

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
            opacity={lerp(0.24, 0.45, focusZoom)}
          />

          {/* Articulated Lumbar & Thoracic Spine Curve (visible in 3D & side profile) */}
          <path
            d={`M ${shoulderC.x} ${shoulderC.y + 2} Q ${lumbarMid.x} ${lumbarMid.y} ${pelvisC.x} ${pelvisC.y + 1}`}
            fill="none"
            stroke={squat > 0.7 ? emerald : accent}
            strokeWidth={lerp(3.2, 4.0, focusZoom)}
            strokeLinecap="round"
            strokeDasharray="2.5 2"
          />

          {/* Near-side (Right) Leg — Primary biomechanical view as camera orbits to 90° */}
          <path d={anatomicalLimbPath(hipR.x, hipR.y, kneeR.x, kneeR.y, 6.2, 4.4, 0.22)} fill={bodyFill} opacity="0.92" />
          <path d={anatomicalLimbPath(kneeR.x, kneeR.y, ankleR.x, ankleR.y, 4.3, 2.7, 0.2)} fill={bodyFill} opacity="0.95" />
          <path d={anatomicalLimbPath(ankleR.x, ankleR.y, toeR.x, toeR.y, 2.8, 2.1, 0.06)} fill={squat > 0.35 ? accent : bodyFill} />

          {/* Highlighted Hip Socket, Knee & Ankle Dorsiflexion Joints */}
          <circle cx={hipR.x} cy={hipR.y} r={lerp(3.5, 4.8, focusZoom)} fill={emerald} opacity={lerp(0.35, 0.85, focusZoom)} />
          <circle cx={kneeR.x} cy={kneeR.y} r="3.8" fill={accent} opacity="0.45" />
          <circle cx={ankleR.x} cy={ankleR.y} r={lerp(2.6, 3.6, focusZoom)} fill={emerald} opacity={lerp(0.35, 0.8, focusZoom)} />

          {/* Far-side & Near-side Arms */}
          <path d={anatomicalLimbPath(shoulderL.x, shoulderL.y, elbowL.x, elbowL.y, 3.4, 2.6, 0.14)} fill={bodyFill} opacity={lerp(0.88, 0.45, sideFactor)} />
          <path d={anatomicalLimbPath(elbowL.x, elbowL.y, handL.x, handL.y, 2.6, 1.9, 0.12)} fill={bodyFill} opacity={lerp(0.92, 0.45, sideFactor)} />

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
              <circle cx={handL.x} cy={handL.y} r="2.3" fill={bodyFill} opacity={lerp(1, 0.45, sideFactor)} />
            </>
          )}

          {/* Neck & Sculpted 3D Head */}
          <path d={anatomicalLimbPath(shoulderC.x, shoulderC.y, neckC.x, neckC.y, 3.2, 2.8, 0)} fill={bodyFill} />
          <ellipse cx={headC.x} cy={headC.y} rx="7.2" ry="8.4" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.4" />
          {/* Gaze direction indicator (faces observer at 0°, shifts to profile at 90°) */}
          <circle cx={headC.x + Math.sin((cameraAngleDeg * Math.PI) / 180) * 4.5} cy={headC.y - 1} r="1.3" fill={accent} opacity="0.7" />
        </g>

        {/* Subtle Camera Orbit Angle Badge during Step 4 */}
        {Math.abs(cameraAngleDeg) > 1 && (
          <text x="114" y="14" textAnchor="end" className="text-[7px] font-bold fill-[#0051ae] dark:fill-blue-300 opacity-75">
            {Math.round(cameraAngleDeg)}°
          </text>
        )}
      </svg>
    );
  }

  // ==========================================================================
  // 2. SEATED SPINAL TWIST — Sequential motion (Step 1: bend & cross leg ->
  //    Step 2: hook elbow & rotate torso -> Step 3: hold + slow 0°->90° camera orbit & tilt)
  // ==========================================================================
  if (stretchId === 'seated-twist') {
    const t = ((nowMs % SEATED_TWIST_CYCLE_MS) + SEATED_TWIST_CYCLE_MS) % SEATED_TWIST_CYCLE_MS;

    // Step 1 (0..3200ms): Bend knee & cross foot outside opposite knee
    const legCrossPhase =
      t < 700
        ? 0
        : t < 3000
          ? easeInOut((t - 700) / 2300)
          : t < 14800
            ? 1
            : 1 - easeInOut((t - 14800) / 1200);

    // Step 2 (3200..6800ms): Place opposite elbow outside bent knee & rotate torso
    const twistPhase =
      t < 3200
        ? 0
        : t < 6400
          ? easeInOut((t - 3200) / 3200)
          : t < 14800
            ? 1
            : 1 - easeInOut((t - 14800) / 1200);

    // Step 3 (6800..14800ms): Hold tall spine while camera performs slow calculus orbit (0° -> -12° -> 90°) + tilt
    let cameraAngleDeg = 0;
    let focusZoom = 0;
    if (t >= 6800 && t < 14800) {
      const orbit = calculusCameraOrbit((t - 6800) / 8000);
      cameraAngleDeg = orbit.angleDeg;
      focusZoom = orbit.focusZoom;
    }

    const sideFactor = Math.sin((Math.abs(cameraAngleDeg) * Math.PI) / 180);
    const pelvisC = project3D(58, 92, -4, cameraAngleDeg);
    const spineMid = project3D(58 + twistPhase * 3, 70, -3, cameraAngleDeg);
    const shoulderC = project3D(58, 49, -2, cameraAngleDeg);
    const headC = project3D(58, 36, -1, cameraAngleDeg);

    // Extended right leg & crossing left leg (animates from extended to crossed in Step 1)
    const extFoot = project3D(46, 98, 28, cameraAngleDeg);
    const crossKnee = project3D(
      lerp(66, 56, legCrossPhase),
      lerp(94, 69, legCrossPhase),
      lerp(18, 10, legCrossPhase),
      cameraAngleDeg
    );
    const crossFoot = project3D(
      lerp(68, 44, legCrossPhase),
      lerp(98, 96, legCrossPhase),
      lerp(28, 8, legCrossPhase),
      cameraAngleDeg
    );

    // Twisting shoulders & arms (animates in Step 2)
    const shR = project3D(46, 50, -twistPhase * 9, cameraAngleDeg);
    const shL = project3D(70, 50, twistPhase * 9, cameraAngleDeg);
    const backHand = project3D(lerp(42, 58, twistPhase), 95, lerp(4, -16, twistPhase), cameraAngleDeg);
    const hookElbow = project3D(
      lerp(74, 53, twistPhase),
      lerp(72, 68, twistPhase),
      lerp(4, 12, twistPhase),
      cameraAngleDeg
    );

    const zoomScale = 1 + focusZoom * 0.25;

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <g
          style={{
            transform: `translate(${pelvisC.x}px, ${pelvisC.y - 12}px) scale(${zoomScale.toFixed(3)}) translate(${-pelvisC.x}px, ${-(pelvisC.y - 12)}px)`,
          }}
        >
          <ellipse cx="60" cy="100" rx={lerp(44, 36, sideFactor)} ry="6.5" fill={bodySubtle} />

          {/* Stretch Focus Glow on Rotating Lumbar Spine & Outer Hip */}
          {twistPhase > 0.5 && (
            <circle
              cx={pelvisC.x}
              cy={pelvisC.y - 10}
              r={15 + focusZoom * 5}
              fill={emerald}
              opacity={0.18 + focusZoom * 0.22}
            />
          )}

          {/* Extended bottom leg */}
          <path d={anatomicalLimbPath(pelvisC.x - 4, pelvisC.y, extFoot.x, extFoot.y, 5.5, 3.2, 0.18)} fill={bodyFill} opacity="0.82" />

          {/* Contoured Rotating Torso */}
          <path
            d={`M ${shR.x - 4} ${shR.y} Q ${shoulderC.x} ${shoulderC.y - 2} ${shL.x + 4} ${shL.y} L ${pelvisC.x + 9} ${pelvisC.y} Q ${pelvisC.x} ${pelvisC.y + 5} ${pelvisC.x - 9} ${pelvisC.y} Z`}
            fill={bodySubtle}
            stroke={bodyFill}
            strokeWidth="2.2"
          />

          {/* Helical Rotating Spine Highlight */}
          <path
            d={`M ${pelvisC.x} ${pelvisC.y} Q ${spineMid.x} ${spineMid.y} ${shoulderC.x} ${shoulderC.y}`}
            fill="none"
            stroke={emerald}
            strokeWidth={lerp(3.2, 4.0, focusZoom)}
            strokeLinecap="round"
            strokeDasharray="3 2"
          />

          {/* Crossed bent leg (Piriformis & glute stretch focus) */}
          <path d={anatomicalLimbPath(pelvisC.x + 3, pelvisC.y, crossKnee.x, crossKnee.y, 5.8, 4.1, 0.22)} fill={focusZoom > 0.3 ? accent : bodyFill} />
          <path d={anatomicalLimbPath(crossKnee.x, crossKnee.y, crossFoot.x, crossFoot.y, 3.9, 2.6, 0.18)} fill={bodyFill} />

          {/* Supporting back arm & front elbow hooking knee */}
          <path d={anatomicalLimbPath(shR.x, shR.y, backHand.x, backHand.y, 3.2, 2.0, 0.1)} fill={bodyFill} opacity="0.8" />
          <path d={anatomicalLimbPath(shL.x, shL.y, hookElbow.x, hookElbow.y, 3.4, 2.5, 0.14)} fill={accent} />

          {/* Sculpted Head */}
          <ellipse cx={headC.x} cy={headC.y} rx="6.8" ry="8" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.3" />
        </g>
        {Math.abs(cameraAngleDeg) > 1 && (
          <text x="114" y="14" textAnchor="end" className="text-[7px] font-bold fill-[#0051ae] dark:fill-blue-300 opacity-75">
            {Math.round(cameraAngleDeg)}°
          </text>
        )}
      </svg>
    );
  }

  // ==========================================================================
  // 3. KNEE-TO-CHEST — Articulated ball-and-socket hip joint with deep hip flexion
  //    (>138° angle) bringing the knee closely and comfortably to the chest
  // ==========================================================================
  if (stretchId === 'knee-to-chest') {
    const pull = easeInOut(wave); // 0 = gentle start (~85°), 1 = deep knee-to-chest hug (~142° hip flexion)

    // Hip socket (acetabulum) shifts slightly with posterior pelvic tilt as knee hugs chest
    const hipX = lerp(63, 59, pull);
    const hipY = lerp(87, 84, pull);

    // Knee arcs past 90° all the way over the ribcage/chest (x=36, y=67)
    const kneeX = lerp(61, 36, pull);
    const kneeY = lerp(61, 67, pull);

    // Calf folds snugly near the posterior thigh as the hands pull the shin
    const ankleX = lerp(78, 52, pull);
    const ankleY = lerp(71, 74, pull);

    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        {/* Floor Mat */}
        <rect x="10" y="92" width="100" height="4" rx="2" fill={accent} opacity="0.22" />

        {/* Lumbar & Gluteal Stretch Decompression Glow */}
        <ellipse cx={hipX - 6} cy="88" rx={14 + pull * 6} ry="5.5" fill={emerald} opacity={0.22 + pull * 0.35} />

        {/* Supine Head & Neck on pillow */}
        <rect x="12" y="86" width="14" height="6" rx="3" fill={accent} opacity="0.2" />
        <ellipse cx="20" cy="81" rx="7" ry="6.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />

        {/* Supine Contoured Torso & Posteriorly Tilting Pelvis */}
        <path
          d={`M 28 81 Q 44 79 ${hipX + 3} ${hipY - 2} L ${hipX + 4} 92 L 28 92 Z`}
          fill={bodySubtle}
          stroke={bodyFill}
          strokeWidth="2.2"
        />
        {/* Flattening Lumbar Spine Curve */}
        <line x1="30" y1="89" x2={hipX + 1} y2={hipY + 3} stroke={emerald} strokeWidth="3.2" strokeDasharray="3 2" />

        {/* Relaxed Anchor Leg (bent with foot flat on mat) */}
        <path d={anatomicalLimbPath(63, 88, 84, 69, 5.4, 3.8, 0.18)} fill={bodyFill} opacity="0.42" />
        <path d={anatomicalLimbPath(84, 69, 98, 91, 3.6, 2.4, 0.16)} fill={bodyFill} opacity="0.42" />
        <path d="M 96 92 L 106 92" stroke={bodyFill} strokeWidth="3.5" strokeLinecap="round" opacity="0.42" />

        {/* Articulated Hip Ball-and-Socket Joint Capsule (Acetabulum + Femoral Head) */}
        <circle cx={hipX} cy={hipY} r="5.6" fill={emerald} opacity="0.35" stroke={accent} strokeWidth="1.2" strokeDasharray="2 1.5" />
        <circle cx={hipX} cy={hipY} r="2.8" fill={accent} />

        {/* Active Thigh (Femur rotating deeply toward chest) */}
        <path d={anatomicalLimbPath(hipX, hipY, kneeX, kneeY, 6.0, 4.2, 0.24)} fill={bodyFill} />
        {/* Active Calf folded snugly */}
        <path d={anatomicalLimbPath(kneeX, kneeY, ankleX, ankleY, 4.1, 2.6, 0.18)} fill={bodyFill} />
        {/* Relaxed Foot */}
        <path d={anatomicalLimbPath(ankleX, ankleY, ankleX + 6, ankleY + 4, 2.5, 1.8, 0.05)} fill={accent} />

        {/* Knee Joint Capsule */}
        <circle cx={kneeX} cy={kneeY} r="3.8" fill={emerald} opacity="0.6" />

        {/* Shoulder, Upper Arm & Forearm wrapping around shin to draw knee to chest */}
        <path d={anatomicalLimbPath(33, 83, lerp(44, 34, pull), lerp(70, 62, pull), 3.3, 2.5, 0.12)} fill={bodyFill} />
        <path d={anatomicalLimbPath(lerp(44, 34, pull), lerp(70, 62, pull), kneeX + 4, kneeY + 2, 2.5, 2.0, 0.1)} fill={accent} />
      </svg>
    );
  }

  // ==========================================================================
  // 4. SUPINE PIRIFORMIS (FIGURE-4) — Realistic anatomical glute/piriformis stretch
  // ==========================================================================
  if (stretchId === 'piriformis') {
    const pull = easeInOut(wave);
    const thighX = lerp(65, 46, pull);
    const thighY = lerp(62, 54, pull);
    return (
      <svg viewBox="0 0 120 120" className="w-full h-full text-slate-700 dark:text-slate-200 select-none">
        <rect x="10" y="92" width="100" height="4" rx="2" fill={accent} opacity="0.22" />
        {/* Piriformis / Glute Decompression Glow */}
        <circle cx="59" cy="86" r={10 + pull * 5} fill={emerald} opacity={0.22 + pull * 0.3} />
        <ellipse cx="20" cy="81" rx="7" ry="6.2" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        <path d="M 28 82 Q 44 80 61 84 L 62 92 L 28 92 Z" fill={bodySubtle} stroke={bodyFill} strokeWidth="2.2" />
        {/* Hip socket */}
        <circle cx="59" cy="87" r="4.5" fill={emerald} opacity="0.4" />
        {/* Support Leg drawn up toward chest */}
        <path d={anatomicalLimbPath(60, 88, thighX, thighY, 5.6, 4.0, 0.2)} fill={bodyFill} opacity="0.75" />
        <path d={anatomicalLimbPath(thighX, thighY, thighX + 20, thighY + 3, 3.8, 2.5, 0.16)} fill={bodyFill} opacity="0.75" />
        {/* Crossed Figure-4 Leg (externally rotated hip) */}
        <path d={anatomicalLimbPath(58, 87, thighX - 8, thighY + 13, 5.8, 4.1, 0.22)} fill={accent} />
        <path d={anatomicalLimbPath(thighX - 8, thighY + 13, thighX + 2, thighY + 1, 3.9, 2.5, 0.16)} fill={accent} />
        {/* Arms pulling behind hamstring */}
        <path d={anatomicalLimbPath(34, 84, thighX - 1, thighY + 6, 3.0, 2.2, 0.1)} fill={bodyFill} />
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
