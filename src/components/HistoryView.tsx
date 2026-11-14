import { useMemo, useState } from 'react';
import { ClipboardList, AlertTriangle, Trash2 } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useOpenLog } from '../hooks/useLogEditor';
import { LOG_META, LOG_ORDER, summarize } from '../lib/logMeta';
import type { AnyLog, LogType } from '../lib/types';
import { dayKey, fmtDate, fmtTime } from '../lib/time';
import { deleteLog } from '../lib/db';
import { Chips, Empty, PageHeader, card, btnGhost, btnPrimary, Modal } from './ui';

export function LogRow({
  log,
  threshold,
  onDelete,
}: {
  log: AnyLog;
  threshold: number;
  onDelete?: (log: AnyLog) => void;
}) {
  const openLog = useOpenLog();
  const M = LOG_META[log.type];
  const flag =
    (log.type === 'pain' && log.data.intensity > threshold) || (log.type === 'med' && log.data.overrideWarning) || log.type === 'fall';
  return (
    <div className="w-full flex items-center gap-2 p-1 rounded-xl hover:bg-[#f7f9ff] dark:hover:bg-gray-700/50 transition-colors group">
      <button
        type="button"
        onClick={() => openLog(log.type, log)}
        className="flex-1 flex items-center gap-3 p-2 text-left min-w-0"
      >
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${M.bg}`}>
          <M.icon className="w-5 h-5" style={{ color: M.color }} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#424753] dark:text-gray-400">
            {M.label}
            {flag && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
          </span>
          <span className="block text-sm font-semibold truncate text-[#171c22] dark:text-white">{summarize(log)}</span>
          {log.notes && <span className="block text-xs text-[#88909f] truncate">{log.notes}</span>}
        </span>
        <span className="text-xs font-bold text-[#88909f] tabular-nums shrink-0">{fmtTime(log.at)}</span>
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(log);
          }}
          title="Delete entry"
          aria-label="Delete entry"
          className="p-2.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function HistoryView() {
  const { uid, logs, settings, rangeDays, ensureRange } = useAppData();
  const [filter, setFilter] = useState<LogType | 'all'>('all');
  const [pendingDelete, setPendingDelete] = useState<AnyLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteLog(uid, pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const grouped = useMemo(() => {
    const m = new Map<string, AnyLog[]>();
    for (const l of logs) {
      if (filter !== 'all' && l.type !== filter) continue;
      const k = dayKey(l.at);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(l);
    }
    return [...m.entries()];
  }, [logs, filter]);

  return (
    <div>
      <PageHeader title="History" subtitle={`Last ${rangeDays} days · tap an entry to edit`} />
      <div className="mb-5 overflow-x-auto -mx-1 px-1">
        <Chips
          options={[{ value: 'all', label: 'All' }, ...LOG_ORDER.map((t) => ({ value: t, label: LOG_META[t].label }))]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      {grouped.length === 0 ? (
        <div className={card}>
          <Empty icon={ClipboardList} title="No entries" hint="Use the + button to log something." />
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([day, items]) => (
            <section key={day}>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#424753] dark:text-gray-400 mb-2 ml-1">
                {fmtDate(items[0].at)} <span className="text-[#88909f]">· {items.length}</span>
              </h3>
              <div className={`${card} p-2`}>
                {items.map((l) => (
                  <LogRow
                    key={l.id}
                    log={l}
                    threshold={settings.painThreshold}
                    onDelete={(item) => setPendingDelete(item)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {rangeDays < 365 && (
        <button type="button" className={`${btnGhost} w-full mt-6`} onClick={() => ensureRange(rangeDays < 90 ? 90 : 365)}>
          Load older entries ({rangeDays < 90 ? 90 : 365} days)
        </button>
      )}

      {/* Direct Delete Confirmation Modal */}
      {pendingDelete && (
        <Modal open={true} onClose={() => setPendingDelete(null)} title="Delete Entry">
          <div className="space-y-4">
            <p className="text-sm text-[#424753] dark:text-gray-300">
              Are you sure you want to delete this <strong>{LOG_META[pendingDelete.type].label}</strong> entry ({summarize(pendingDelete)})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className={btnGhost}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
