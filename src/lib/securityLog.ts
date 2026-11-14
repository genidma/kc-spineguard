// Lightweight security log: at most ONE write per browser session per user.
import type { User } from 'firebase/auth';

const KEY = (uid: string) => `kc-spineguard-iplogged-${uid}`;

export async function logSignInOnce(user: User) {
  if (sessionStorage.getItem(KEY(user.uid))) return;
  sessionStorage.setItem(KEY(user.uid), '1');
  try {
    const idToken = await user.getIdToken();
    await fetch('/api/log-ip', { method: 'POST', headers: { Authorization: `Bearer ${idToken}` } });
  } catch (e) {
    // Non-critical: the app works without it (e.g. function not deployed yet).
    console.warn('[security-log] skipped', e);
  }
}
