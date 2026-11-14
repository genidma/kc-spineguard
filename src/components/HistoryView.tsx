import { useMemo, useState } from 'react';
import { ClipboardList, AlertTriangle } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useOpenLog } from '../hooks/useLogEditor';
import { LOG_META, LOG_ORDER, summarize } from '../lib/logMeta';
import type { AnyLog, LogType } from '../lib/types';
import { dayKey, fmtDate, fmtTime } from '../lib/time';
import { Chips, Empty, PageHeader, card, btnGhost } from './ui';

export function LogRow({ log, threshold }: { log: AnyLog; threshold: number }) {
  const openLog = useOpenLog();
  const M = LOG_META[log.type];
  const flag =
    (log.type === 'pain' && log.data.intensity > threshold) || (log.type === 'med' && log.data.overrideWarning) || log.type === 'fall';
  return (
    <button
      type="button"
      onClick={() => openLog(log.type, log)}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#f7f9ff] dark:hover:bg-gray-700/50 text-left transition-colors"
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
  );
}

export function HistoryView() {
  const { logs, settings, rangeDays, ensureRange } = useAppData();
  const [filter, setFilter] = useState<LogType | 'all'>('all');

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
                  <LogRow key={l.id} log={l} threshold={settings.painThreshold} />
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
    </div>
  );
}
