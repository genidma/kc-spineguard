// Domain types for kc-spineguard

export type LogType =
  | 'weight'
  | 'stretch'
  | 'posture'
  | 'pain'
  | 'painMgmt'
  | 'med'
  | 'mood'
  | 'cognition'
  | 'fall';

export type Side = 'left' | 'right' | 'both';

export interface WeightData { value: number; unit: 'kg' | 'lb' }

export interface StretchData {
  stretchId: string;
  stretchName: string;
  durationSec?: number;
  reps?: number;
  sets?: number;
  painBefore?: number;
  painAfter?: number;
}

export type PostureKind = 'sitting' | 'standing' | 'lying' | 'walking' | 'driving' | 'bending' | 'lifting';
export interface PostureData {
  position: PostureKind;
  durationMin?: number;
  quality: 'good' | 'fair' | 'poor';
  aids?: string[];
  painDuring?: number;
}

export type PainType = 'acute' | 'chronic' | 'flare';
export interface PainData {
  intensity: number; // 0-10 NRS
  painType: PainType;
  locations: string[]; // e.g. 'lowerBack:left'
  qualities: string[];
  triggers?: string[];
  aboveThreshold?: boolean; // computed at save time against profile threshold
}

export interface PainMgmtData {
  method: string;
  durationMin?: number;
  effectiveness?: number; // 0-10
}

export interface MedData {
  medicationId: string;
  medicationName: string;
  kind: string;
  dose: number;
  unit: string;
  reason?: string;
  reliefAfter?: number; // 0-10
  overrideWarning?: boolean;
}

export interface MoodData { score: number; tags: string[] } // 1-5

export interface CognitionData {
  focus: number; // 1-5 (5 = sharp)
  brainFog: number; // 1-5 (5 = very foggy)
  memory: number; // 1-5 (5 = sharp)
}

export interface FallData {
  cause: string;
  injury: boolean;
  injuryDetails?: string;
  neededHelp: boolean;
  location?: string;
}

export interface LogDataMap {
  weight: WeightData;
  stretch: StretchData;
  posture: PostureData;
  pain: PainData;
  painMgmt: PainMgmtData;
  med: MedData;
  mood: MoodData;
  cognition: CognitionData;
  fall: FallData;
}

export interface LogEntry<T extends LogType = LogType> {
  id: string;
  type: T;
  at: string; // ISO timestamp of the event
  data: LogDataMap[T];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AnyLog = { [K in LogType]: LogEntry<K> }[LogType];

export const MED_KINDS = [
  'NSAID',
  'Acetaminophen',
  'Gabapentinoid',
  'Muscle relaxant',
  'Opioid',
  'Steroid',
  'Antidepressant (SNRI/TCA)',
  'Topical',
  'Supplement',
  'Other',
] as const;

export interface Medication {
  id: string;
  name: string;
  kind: string;
  strength?: string; // free text, e.g. "300 mg capsule"
  unit: string; // unit of a dose: mg, tablet, ml, patch...
  typicalDose?: number | null;
  maxDailyDose?: number | null; // in `unit`, rolling 24h
  minHoursBetween?: number | null;
  scheduleTimes?: string[]; // "08:00"
  active: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stretch {
  id: string;
  name: string;
  target?: string;
  steps?: string[];
  holdSeconds?: number;
  reps?: number;
  sets?: number;
  builtIn?: boolean;
}

export interface Settings {
  theme: 'light' | 'dark';
  themeSchedule: boolean;
  quietStart: string; // "22:00"
  quietEnd: string; // "07:00"
  weightUnit: 'kg' | 'lb';
  heightUnit: 'cm' | 'in';
  height?: number | null;
  weekStart: 'monday' | 'sunday';
  painThreshold: number; // 0-10
  goals: {
    targetWeight?: number | null;
    stretchMinutesPerDay: number;
    postureChecksPerDay: number;
  };
  medical: {
    affectedSide?: Side | '';
    onsetDate?: string;
    diagnosis?: string;
    clinician?: string;
  };
  reminders: {
    meds: boolean;
    stretchTimes: string[];
    postureIntervalMin: number; // 0 = off
  };
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  themeSchedule: false,
  quietStart: '22:00',
  quietEnd: '07:00',
  weightUnit: 'kg',
  heightUnit: 'cm',
  height: null,
  weekStart: 'monday',
  painThreshold: 5,
  goals: { targetWeight: null, stretchMinutesPerDay: 15, postureChecksPerDay: 6 },
  medical: { affectedSide: '', onsetDate: '', diagnosis: '', clinician: '' },
  reminders: { meds: false, stretchTimes: [], postureIntervalMin: 0 },
};
