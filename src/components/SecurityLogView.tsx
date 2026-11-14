import { useEffect, useState } from 'react';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { ArrowLeft, Calendar, HardDrive, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchSecurityLog } from '../lib/db';
import { card, btnGhost } from './ui';

interface LogEntry {
  id: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: any;
}

export function SecurityLogView({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = async (first: boolean) => {
    if (!user) return;
    if (first) setLoading(true);
    else setLoadingMore(true);
    try {
      const snap = await fetchSecurityLog(user.uid, first ? null : lastDoc);
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ipAddress: (d.data().ipAddress as string) || 'Unknown IP',
        userAgent: d.data().userAgent as string | undefined,
        timestamp: d.data().timestamp,
      }));
      setLogs((prev) => (first ? rows : [...prev, ...rows]));
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === 20);
    } catch (e) {
      console.error('Error fetching security log:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return (
    <div>
      <header className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to profile"
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border border-[#e4e8f0] dark:border-gray-700 hover:bg-[#f0f4fc] dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0051ae]" /> IP Security Log
          </h1>
          <p className="text-xs text-[#424753] dark:text-gray-400 font-medium">
            Read on demand only. One entry recorded per sign-in session.
          </p>
        </div>
      </header>

      <div className={`${card} p-6`}>
        <div className="flex items-center gap-3 border-b border-[#e4e8f0] dark:border-gray-700 pb-4 mb-4">
          <div className="w-10 h-10 bg-[#f0f4fc] dark:bg-gray-700 rounded-2xl flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-[#0051ae]" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Recorded Sign-Ins</h3>
            <p className="text-[10px] uppercase font-bold tracking-wider text-[#88909f]">20 per page</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-7 h-7 animate-spin text-[#0051ae]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10">
            <Shield className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#424753] dark:text-gray-400">No login records yet.</p>
          </div>
        ) : (
          <div>
            <div className="divide-y divide-[#e4e8f0] dark:divide-gray-700">
              {logs.map((l) => (
                <div key={l.id} className="flex justify-between items-center py-3 text-sm gap-3">
                  <span className="font-mono font-bold truncate">{l.ipAddress}</span>
                  <span className="flex items-center gap-1.5 text-xs text-[#424753] dark:text-gray-400 shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    {l.timestamp?.toDate ? l.timestamp.toDate().toLocaleString() : 'Recording...'}
                  </span>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="pt-4 text-center">
                <button type="button" onClick={() => load(false)} disabled={loadingMore} className={btnGhost + ' mx-auto'}>
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
