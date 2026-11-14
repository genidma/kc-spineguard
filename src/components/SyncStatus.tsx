import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToSyncStatus, type SyncState } from '../lib/db';

export default function SyncStatus({ signedIn }: { signedIn: boolean }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState<SyncState>('idle');

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const unsub = subscribeToSyncStatus(setSyncState);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      unsub();
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] pointer-events-none">
      <AnimatePresence mode="wait">
        {!isOnline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-50/90 dark:bg-red-950/90 backdrop-blur-md border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm"
          >
            <CloudOff className="w-3.5 h-3.5" />
            <span>Offline (Saved locally)</span>
          </motion.div>
        ) : syncState === 'syncing' ? (
          <motion.div
            key="syncing"
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/90 dark:bg-amber-950/90 backdrop-blur-md border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing...</span>
          </motion.div>
        ) : signedIn ? (
          <motion.div
            key="synced"
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/90 dark:bg-emerald-950/90 backdrop-blur-md border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Synced</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
