import {
  Scale as ScaleIcon,
  StretchHorizontal,
  Armchair,
  Activity,
  HeartPulse,
  Pill,
  Smile,
  Brain,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { AnyLog, LogType } from './types';

export const LOG_META: Record<LogType, { label: string; icon: LucideIcon; color: string; bg: string }> = {
  pain: { label: 'Pain', icon: Activity, color: '#dc2626', bg: 'bg-red-50 dark:bg-red-900/20' },
  med: { label: 'Pain meds', icon: Pill, color: '#7c3aed', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  painMgmt: { label: 'Pain relief', icon: HeartPulse, color: '#db2777', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  stretch: { label: 'Stretch', icon: StretchHorizontal, color: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  posture: { label: 'Posture', icon: Armchair, color: '#0891b2', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  weight: { label: 'Weight', icon: ScaleIcon, color: '#0051ae', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  mood: { label: 'Mood', icon: Smile, color: '#d97706', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  cognition: { label: 'Cognition', icon: Brain, color: '#4f46e5', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  fall: { label: 'Fall', icon: TriangleAlert, color: '#b91c1c', bg: 'bg-rose-50 dark:bg-rose-900/20' },
};

export const LOG_ORDER: LogType[] = ['pain', 'med', 'painMgmt', 'stretch', 'posture', 'weight', 'mood', 'cognition', 'fall'];

export const BODY_REGIONS = [
  { value: 'lowerBack', label: 'Lower back' },
  { value: 'buttock', label: 'Buttock' },
  { value: 'hip', label: 'Hip' },
  { value: 'thigh', label: 'Back of thigh' },
  { value: 'knee', label: 'Knee' },
  { value: 'calf', label: 'Calf / shin' },
  { value: 'foot', label: 'Foot / toes' },
];

export const PAIN_QUALITIES = ['shooting', 'burning', 'electric', 'aching', 'stabbing', 'numbness', 'tingling', 'weakness', 'stiffness'].map(
  (v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }),
);

export const PAIN_TRIGGERS = ['sitting', 'standing', 'bending', 'lifting', 'walking', 'coughing/sneezing', 'driving', 'sleep', 'stress', 'weather'].map(
  (v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }),
);

export const MGMT_METHODS = ['heat', 'ice', 'TENS', 'massage', 'physio', 'walking', 'rest', 'bath', 'foam roller', 'acupuncture', 'meditation', 'other'].map(
  (v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }),
);

export const MOOD_TAGS = ['calm', 'hopeful', 'grateful', 'tired', 'anxious', 'low', 'irritable', 'frustrated', 'overwhelmed'].map((v) => ({
  value: v,
  label: v[0].toUpperCase() + v.slice(1),
}));

export const MOOD_FACES = ['😞', '🙁', '😐', '🙂', '😄'];

export const FALL_CAUSES = ['leg gave way', 'numbness', 'pain spike', 'tripped', 'dizziness', 'slipped', 'other'].map((v) => ({
  value: v,
  label: v[0].toUpperCase() + v.slice(1),
}));

export const POSTURE_AIDS = ['lumbar roll', 'standing desk', 'cushion', 'brace', 'footrest', 'pillow between knees', 'exercise ball'].map((v) => ({
  value: v,
  label: v[0].toUpperCase() + v.slice(1),
}));

const regionLabel = (v: string) => {
  const [r, side] = v.split(':');
  const name = BODY_REGIONS.find((b) => b.value === r)?.label ?? r;
  return side ? `${name} (${side[0].toUpperCase()})` : name;
};

/** One-line human summary of an entry. */
export function summarize(l: AnyLog): string {
  switch (l.type) {
    case 'weight':
      return `${l.data.value} ${l.data.unit}`;
    case 'stretch': {
      const d = l.data;
      const parts = [d.stretchName];
      if (d.sets && d.reps) parts.push(`${d.sets}×${d.reps}`);
      if (d.durationSec) parts.push(`${Math.round(d.durationSec / 60)} min`);
      if (d.painBefore != null && d.painAfter != null) parts.push(`pain ${d.painBefore}→${d.painAfter}`);
      return parts.join(' · ');
    }
    case 'posture':
      return `${cap(l.data.position)} · ${l.data.quality}${l.data.durationMin ? ` · ${l.data.durationMin} min` : ''}`;
    case 'pain':
      return `${l.data.intensity}/10 ${l.data.painType}${l.data.locations.length ? ' · ' + l.data.locations.map(regionLabel).join(', ') : ''}`;
    case 'painMgmt':
      return `${cap(l.data.method)}${l.data.durationMin ? ` · ${l.data.durationMin} min` : ''}${
        l.data.effectiveness != null ? ` · helped ${l.data.effectiveness}/10` : ''
      }`;
    case 'med':
      return `${l.data.medicationName} ${l.data.dose} ${l.data.unit}${l.data.kind ? ` · ${l.data.kind}` : ''}`;
    case 'mood':
      return `${MOOD_FACES[l.data.score - 1] ?? ''} ${l.data.score}/5${l.data.tags.length ? ' · ' + l.data.tags.join(', ') : ''}`;
    case 'cognition':
      return `Focus ${l.data.focus}/5 · Fog ${l.data.brainFog}/5 · Memory ${l.data.memory}/5`;
    case 'fall':
      return `${cap(l.data.cause)}${l.data.injury ? ' · injured' : ''}${l.data.neededHelp ? ' · needed help' : ''}`;
  }
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
