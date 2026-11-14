import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  connectFirestoreEmulator,
  Firestore,
} from 'firebase/firestore';

export const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

function env(name: keyof ImportMetaEnv, fallback?: string): string {
  const value = import.meta.env[name] as string | undefined;
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`[firebase] Missing required environment variable: ${name}`);
}

// When running against local emulators, a demo-* project needs no real credentials.
const demo = useEmulators ? 'demo' : undefined;

const firebaseConfig = {
  apiKey: env('VITE_FIREBASE_API_KEY', demo && 'demo-key'),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN', demo && 'localhost'),
  projectId: env('VITE_FIREBASE_PROJECT_ID', demo && 'demo-kc-spineguard'),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET', demo && ''),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID', demo && ''),
  appId: env('VITE_FIREBASE_APP_ID', demo && 'demo-app'),
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let db: Firestore;
try {
  // Offline-first: writes queue locally and sync when back online (as kc-rhythm).
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch (error) {
  console.error('[firebase] Persistence unavailable, using memory cache:', error);
  db = initializeFirestore(app, { localCache: memoryLocalCache() });
}

if (useEmulators) {
  const host = window.location.hostname || '127.0.0.1';
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
}

export { db };
