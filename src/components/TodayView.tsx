import { useMemo } from 'react';
import { Activity, Pill, StretchHorizontal, Smile, ShieldAlert, Info } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useOpenLog } from '../hooks/useLogEditor';
import { LOG_META, LOG_ORDER } from '../lib/logMeta';
import { dayKey } from '../lib/time';
import { checkDose } from '../lib/meds';
import type { AnyLog, MoodData, PainData, StretchData } from '../lib/types';
import { MOOD_FACES } from '../lib/logMeta';
import { PageHeader, SectionTitle, card, painColor } from './ui';
import { LogRow } from './HistoryView';

export function TodayView() {
  const { logs, settings, meds } = useAppData();
  const openLog = useOpenLog();
  const today = dayKey(new Date());
  const todays = useMemo(() => logs.filter((l) => dayKey(l.at) === today), [logs, today]);

  const lastPain = logs.find((l) => l.type === 'pain') as AnyLog & { data: PainData } | undefined;
  const lastMood = todays.find((l) => l.type === 'mood') as AnyLog & { data: MoodData } | undefined;
  const stretchMin = todays
    .filter((l) => l.type === 'stretch')
    .reduce((s, l) => s + ((l.data as StretchData).durationSec ?? 0) / 60, 0);
  const stretchCount = todays.filter((l) => l.type === 'stretch').length;
  const postureChecks = todays.filter((l) => l.type === 'posture').length;

  const nowIso = new Date().toISOString();
  const medStatus = meds
    .filter((m) => m.active)
    .map((m) => ({ m, c: checkDose(m, 0, nowIso, logs) }))
    .filter(({ c }) => c.takenLast24h > 0 || c.remaining !== null);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <div>
      <PageHeader title={greeting} subtitle={new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Activity}
          label="Last pain"
          value={lastPain ? `${lastPain.data.intensity}/10` : '-'}
          color={lastPain ? painColor(lastPain.data.intensity) : undefined}
          sub={lastPain ? (lastPain.data.intensity > settings.painThreshold ? 'Above threshold' : lastPain.data.painType) : 'Not logged yet'}
          onClick={() => openLog('pain')}
        />
        <StatCard
          icon={StretchHorizontal}
          label="Stretches"
          value={`${Math.round(stretchMin)}/${settings.goals.stretchMinutesPerDay}m`}
          sub={`${stretchCount} logged today`}
          progress={stretchMin / Math.max(1, settings.goals.stretchMinutesPerDay)}
          onClick={() => openLog('stretch')}
        />
        <StatCard
          icon={ShieldAlert}
          label="Posture checks"
          value={`${postureChecks}/${settings.goals.postureChecksPerDay}`}
          progress={postureChecks / Math.max(1, settings.goals.postureChecksPerDay)}
          sub="today"
          onClick={() => openLog('posture')}
        />
        <StatCard
          icon={Smile}
          label="Mood"
          value={lastMood ? MOOD_FACES[lastMood.data.score - 1] : '-'}
          sub={lastMood ? lastMood.data.tags.slice(0, 2).join(', ') || `${lastMood.data.score}/5` : 'How are you?'}
          onClick={() => openLog('mood')}
        />
      </div>

      {medStatus.length > 0 && (
        <>
          <SectionTitle>Medications · last 24h</SectionTitle>
          <div className={`${card} p-4 space-y-3`}>
            {medStatus.map(({ m, c }) => {
              const pct = m.maxDailyDose ? Math.min(1, c.takenLast24h / m.maxDailyDose) : 0;
              return (
                <div key={m.id}>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-violet-500" />
                      {m.name}
                    </span>
                    <span className="tabular-nums text-[#424753] dark:text-gray-300">
                      {c.takenLast24h}
                      {m.maxDailyDose ? ` / ${m.maxDailyDose}` : ''} {m.unit}
                    </span>
                  </div>
                  {m.maxDailyDose ? (
                    <div className="h-2 rounded-full bg-[#f0f4fc] dark:bg-gray-700 mt-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: pct >= 1 ? '#dc2626' : pct > 0.75 ? '#f97316' : '#7c3aed' }} />
                    </div>
                  ) : null}
                  {c.nextAllowedAt && new Date(c.nextAllowedAt) > new Date() && (
                    <p className="text-[11px] text-[#88909f] mt-1">
                      Next dose allowed after {new Date(c.nextAllowedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <SectionTitle>Quick log</SectionTitle>
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
        {LOG_ORDER.map((t) => {
          const M = LOG_META[t];
          return (
            <button
              key={t}
              type="button"
              data-testid={`quick-${t}`}
              onClick={() => openLog(t)}
              className={`${card} p-3 flex flex-col items-center gap-2 hover:scale-[1.03] active:scale-95 transition-transform`}
            >
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${M.bg}`}>
                <M.icon className="w-5 h-5" style={{ color: M.color }} />
              </span>
              <span className="text-xs font-bold text-center leading-tight">{M.label}</span>
            </button>
          );
        })}
      </div>

      <SectionTitle>Today's timeline</SectionTitle>
      <div className={`${card} p-2`}>
        {todays.length === 0 ? (
          <p className="text-sm text-center text-[#88909f] py-8">Nothing logged yet today. Tap a tile above to start.</p>
        ) : (
          todays.map((l) => <LogRow key={l.id} log={l} threshold={settings.painThreshold} />)
        )}
      </div>

      <p className="mt-8 text-[11px] text-[#88909f] flex gap-1.5 items-start">
        <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
        kc-spineguard is a personal tracking tool, not medical advice. Medication limits are the ones you entered. Seek urgent care for new leg weakness,
        saddle numbness, or bladder/bowel changes.
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  progress,
  onClick,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  progress?: number;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`${card} p-4 text-left hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#424753] dark:text-gray-400">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-2xl font-black mt-2 tabular-nums" style={color ? { color } : undefined}>
        {value}
      </div>
      {progress !== undefined && (
        <div className="h-1.5 rounded-full bg-[#f0f4fc] dark:bg-gray-700 mt-2 overflow-hidden">
          <div className="h-full rounded-full bg-[#0051ae]" style={{ width: `${Math.min(1, progress) * 100}%` }} />
        </div>
      )}
      {sub && <div className="text-xs text-[#88909f] mt-1 truncate capitalize">{sub}</div>}
    </button>
  );
}
