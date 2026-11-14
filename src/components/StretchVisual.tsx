// Biomechanical clinical SVG illustrations & animations for guided sciatica stretches.
import React from 'react';

export function StretchVisual({ stretchId, active = false }: { stretchId: string; active?: boolean }) {
  const stroke = 'currentColor';
  const accent = '#0051ae';
  
  // Stretches requested for matrix-style 360 horizontal rotation:
  // 'deep-squat' (Malasana) and 'seated-twist' (Spinal twist)
  const isMatrixSpin = stretchId === 'deep-squat' || stretchId === 'seated-twist';
  
  const animClass = isMatrixSpin
    ? 'matrix-360-anim'
    : active
      ? 'stretch-active-anim'
      : 'stretch-ambient-anim';

  switch (stretchId) {
    case 'deep-squat':
      return (
        <svg viewBox="0 0 100 100" className={`w-full h-full text-slate-700 dark:text-slate-200 ${animClass}`}>
          {/* Ground level */}
          <line x1="15" y1="90" x2="85" y2="90" stroke={stroke} strokeWidth="2" strokeDasharray="3 3" opacity="0.4" />
          {/* Feet flat on floor */}
          <line x1="24" y1="90" x2="38" y2="90" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <line x1="62" y1="90" x2="76" y2="90" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          {/* Legs & knees bent wide in deep squat */}
          <path d="M 28 90 L 22 65 L 42 75" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 72 90 L 78 65 L 58 75" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Pelvis & elongated spine */}
          <path d="M 42 75 Q 50 78 58 75" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          <path d="M 50 76 L 50 44" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          {/* Head & neck */}
          <circle cx="50" cy="34" r="7" fill="none" stroke={stroke} strokeWidth="3" />
          {/* Hands together in prayer/balance */}
          <path d="M 50 50 L 44 58 L 50 60 L 56 58 Z" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      );

    case 'knee-to-chest':
      return (
        <svg viewBox="0 0 100 100" className={`w-full h-full text-slate-700 dark:text-slate-200 ${animClass}`}>
          <line x1="10" y1="80" x2="90" y2="80" stroke={stroke} strokeWidth="2" opacity="0.3" />
          {/* Supine body */}
          <circle cx="22" cy="74" r="6" fill="none" stroke={stroke} strokeWidth="3" />
          <path d="M 28 75 L 58 75" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          {/* Extended/relaxed leg */}
          <path d="M 58 75 L 85 78" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          {/* Knee hugged to chest */}
          <path d="M 58 75 L 54 52 L 44 60" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Arms pulling knee */}
          <path d="M 38 75 L 46 60" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'piriformis':
      return (
        <svg viewBox="0 0 100 100" className={`w-full h-full text-slate-700 dark:text-slate-200 ${animClass}`}>
          <line x1="10" y1="80" x2="90" y2="80" stroke={stroke} strokeWidth="2" opacity="0.3" />
          <circle cx="20" cy="74" r="6" fill="none" stroke={stroke} strokeWidth="3" />
          <path d="M 26 75 L 52 75" fill="none" stroke={stroke} strokeWidth="3.5" />
          {/* Raised thigh */}
          <path d="M 52 75 L 62 50 L 78 52" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {/* Crossed ankle figure-4 */}
          <path d="M 52 75 L 46 55 L 63 50" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Arms holding under thigh */}
          <path d="M 36 75 L 58 55" fill="none" stroke={stroke} strokeWidth="2" strokeDasharray="3 2" />
        </svg>
      );

    case 'nerve-glide':
      return (
        <svg viewBox="0 0 100 100" className={`w-full h-full text-slate-700 dark:text-slate-200 ${animClass}`}>
          {/* Chair */}
          <path d="M 35 60 L 55 60 L 55 90 M 35 40 L 35 90" fill="none" stroke={stroke} strokeWidth="2" opacity="0.4" />
          {/* Seated torso */}
          <circle cx="45" cy="28" r="6" fill="none" stroke={stroke} strokeWidth="3" />
          <path d="M 45 34 L 46 60" fill="none" stroke={stroke} strokeWidth="3.5" />
          {/* Gliding leg straightened */}
          <path d="M 46 60 L 68 59 L 88 56" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 88 56 L 90 48" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'childs-pose':
      return (
        <svg viewBox="0 0 100 100" className={`w-full h-full text-slate-700 dark:text-slate-200 ${animClass}`}>
          <line x1="10" y1="85" x2="90" y2="85" stroke={stroke} strokeWidth="2" opacity="0.3" />
          {/* Knees folded under hips */}
          <path d="M 28 85 L 24 75 L 38 75 L 42 85" fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
          {/* Spine rounded forward */}
          <path d="M 28 75 Q 45 60 65 78" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="70" cy="80" r="5" fill="none" stroke={stroke} strokeWidth="3" />
          {/* Arms outstretched forward */}
          <path d="M 55 70 L 88 84" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'cat-cow':
      return (
        <svg viewBox="0 0 100 100" className={`w-full h-full text-slate-700 dark:text-slate-200 ${animClass}`}>
          <line x1="10" y1="85" x2="90" y2="85" stroke={stroke} strokeWidth="2" opacity="0.3" />
          {/* Arms & knees down */}
          <path d="M 70 85 L 70 55" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M 30 85 L 30 65" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          {/* Articulating spine arch */}
          <path d="M 30 65 Q 50 48 70 55" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="76" cy="50" r="5" fill="none" stroke={stroke} strokeWidth="3" />
        </svg>
      );

    case 'hamstring':
      return (
        <svg viewBox="0 0 100 100" className={`w-full h-full text-slate-700 dark:text-slate-200 ${animClass}`}>
          <line x1="10" y1="85" x2="90" y2="85" stroke={stroke} strokeWidth="2" opacity="0.3" />
          <circle cx="20" cy="79" r="6" fill="none" stroke={stroke} strokeWidth="3" />
          <path d="M 26 80 L 55 80" fill="none" stroke={stroke} strokeWidth="3.5" />
          {/* Elevated leg with towel */}
          <path d="M 55 80 L 62 40 L 66 38" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
          {/* Hands holding towel strap */}
          <path d="M 36 80 L 62 40" fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      );

    case 'pelvic-tilt':
      return (
        <svg viewBox="0 0 100 100" className={`w-full h-full text-slate-700 dark:text-slate-200 ${animClass}`}>
          <line x1="10" y1="85" x2="90" y2="85" stroke={stroke} strokeWidth="2" opacity="0.3" />
          <circle cx="22" cy="79" r="6" fill="none" stroke={stroke} strokeWidth="3" />
          <path d="M 28 80 L 56 80" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
          {/* Bent knees, feet flat */}
          <path d="M 56 80 L 70 58 L 80 84" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'prone-press-up':
      return (
        <svg viewBox="0 0 100 100" className={`w-full h-full text-slate-700 dark:text-slate-200 ${animClass}`}>
          <line x1="10" y1="85" x2="90" y2="85" stroke={stroke} strokeWidth="2" opacity="0.3" />
          {/* Lower body on floor */}
          <path d="M 85 85 L 50 85" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
          {/* Lumbar extension arch */}
          <path d="M 50 85 Q 40 70 30 55" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="28" cy="45" r="5" fill="none" stroke={stroke} strokeWidth="3" />
          {/* Press-up arms */}
          <path d="M 32 60 L 30 85" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'seated-twist':
    default:
      return (
        <svg viewBox="0 0 100 100" className={`w-full h-full text-slate-700 dark:text-slate-200 ${animClass}`}>
          <line x1="15" y1="88" x2="85" y2="88" stroke={stroke} strokeWidth="2" opacity="0.3" />
          <circle cx="50" cy="30" r="6" fill="none" stroke={stroke} strokeWidth="3" />
          <path d="M 50 36 L 50 75" fill="none" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
          {/* Crossed seated legs */}
          <path d="M 30 85 L 50 75 L 70 85" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M 42 55 L 65 65" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
}
