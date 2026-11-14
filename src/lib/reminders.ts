// Notifications + reminder scheduling (adapted from kc-rhythm's audioService notification logic).
import type { Medication, Settings } from './types';
import { isInWindow, dayKey, minutesOfDay } from './time';

const SOUND_KEY = 'kc-spineguard-sounds';
const ALERTS_KEY = 'kc-spineguard-alerts';
const FIRED_KEY = 'kc-spineguard-fired';

export const prefs = {
  get sounds() {
    return localStorage.getItem(SOUND_KEY) !== 'false';
  },
  set sounds(v: boolean) {
    localStorage.setItem(SOUND_KEY, String(v));
  },
  get alerts() {
    return localStorage.getItem(ALERTS_KEY) === 'true';
  },
  set alerts(v: boolean) {
    localStorage.setItem(ALERTS_KEY, String(v));
  },
};

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported' as const;
  if (Notification.permission === 'granted') return 'granted' as const;
  return Notification.requestPermission();
}

/** Short, gentle chime via WebAudio (no asset needed). */
export function chime() {
  if (!prefs.sounds) return;
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = 'sine';
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    /* audio blocked until user gesture */
  }
}

export async function sendNotification(title: string, body: string): Promise<boolean> {
  chime();
  if (notificationPermission() !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, { body, icon: '/favicon.svg', tag: title });
    } else {
      new Notification(title, { body, icon: '/favicon.svg' });
    }
    return true;
  } catch (e) {
    console.warn('Notification failed', e);
    return false;
  }
}

export interface DueReminder {
  key: string;
  title: string;
  body: string;
}

/**
 * Pure: which reminders are due at `now`. A reminder is due when the current minute
 * is within 5 minutes after its scheduled time, and it hasn't already fired today.
 */
export function dueReminders(
  now: Date,
  settings: Settings,
  meds: Medication[],
  fired: Set<string>,
  lastPostureAt: number | null,
): DueReminder[] {
  if (isInWindow(now, settings.quietStart, settings.quietEnd)) return [];
  const out: DueReminder[] = [];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = dayKey(now);
  const inSlot = (t: string) => {
    const diff = nowMin - minutesOfDay(t);
    return diff >= 0 && diff < 5;
  };

  if (settings.reminders.meds) {
    for (const m of meds) {
      if (!m.active) continue;
      for (const t of m.scheduleTimes ?? []) {
        const key = `${today}|med|${m.id}|${t}`;
        if (inSlot(t) && !fired.has(key)) {
          out.push({ key, title: `💊 Time for ${m.name}`, body: m.typicalDose ? `${m.typicalDose} ${m.unit}` : 'Scheduled dose' });
        }
      }
    }
  }
  for (const t of settings.reminders.stretchTimes) {
    const key = `${today}|stretch|${t}`;
    if (inSlot(t) && !fired.has(key)) {
      out.push({ key, title: '🧘 Stretch break', body: 'A few gentle stretches can ease sciatic tension.' });
    }
  }
  const iv = settings.reminders.postureIntervalMin;
  if (iv > 0) {
    const since = lastPostureAt == null ? Infinity : (now.getTime() - lastPostureAt) / 60000;
    if (since >= iv) {
      out.push({ key: `posture|${now.getTime()}`, title: '🪑 Posture check', body: 'How are you sitting or standing? Shift position if needed.' });
    }
  }
  return out;
}

export function loadFired(): Set<string> {
  try {
    const today = dayKey(new Date());
    const arr: string[] = JSON.parse(localStorage.getItem(FIRED_KEY) || '[]');
    return new Set(arr.filter((k) => k.startsWith(today)));
  } catch {
    return new Set();
  }
}

export function saveFired(s: Set<string>) {
  localStorage.setItem(FIRED_KEY, JSON.stringify([...s].filter((k) => !k.startsWith('posture|'))));
}
