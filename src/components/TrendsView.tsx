import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TrendingUp, TriangleAlert } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { dayKey, daysAgoIso, fmtDate, fmtTime } from '../lib/time';
import { summarize } from '../lib/logMeta';
import type { CognitionData, FallData, MoodData, PainData, StretchData, WeightData } from '../lib/types';
import { Chips, Empty, PageHeader, SectionTitle, card } from './ui';

type Range = 1 | 2 | 3 | 7 | 30 | 90 | 180;

export function TrendsView() {
  const { logs, settings, ensureRange } = useAppData();
  const [days, setDays] = useState<Range>(30);

  useEffect(() => {
    ensureRange(days);
  }, [days, ensureRange]);

  const cutoff = useMemo(() => daysAgoIso(days), [days]);
  const windowLogs = useMemo(() => logs.filter((l) => l.at >= cutoff), [logs, cutoff]);

  // Build daily buckets in chronological order
  const daily = useMemo(() => {
    const keys: string[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      keys.push(dayKey(d));
    }
    const map = new Map<
      string,
      {
        day: string;
        label: string;
        painSum: number;
        painMax: number | null;
        painCount: number;
        medCount: number;
        stretchMin: number;
        weight: number | null;
        moodSum: number;
        moodCount: number;
        fogSum: number;
        focusSum: number;
        cogCount: number;
      }
    >();
    for (const k of keys) {
      map.set(k, {
        day: k,
        label: k.slice(5),
        painSum: 0,
        painMax: null,
        painCount: 0,
        medCount: 0,
        stretchMin: 0,
        weight: null,
        moodSum: 0,
        moodCount: 0,
        fogSum: 0,
        focusSum: 0,
        cogCount: 0,
      });
    }

    // Iterate oldest -> newest so latest weight of day wins
    for (let i = windowLogs.length - 1; i >= 0; i--) {
      const l = windowLogs[i];
      const b = map.get(dayKey(l.at));
      if (!b) continue;
      if (l.type === 'pain') {
        const v = (l.data as PainData).intensity;
        b.painSum += v;
        b.painCount += 1;
        b.painMax = b.painMax === null ? v : Math.max(b.painMax, v);
      } else if (l.type === 'med') {
        b.medCount += 1;
      } else if (l.type === 'stretch') {
        b.stretchMin += ((l.data as StretchData).durationSec ?? 0) / 60;
      } else if (l.type === 'weight') {
        const w = l.data as WeightData;
        // Normalize to user's display unit
        const val =
          w.unit === settings.weightUnit
            ? w.value
            : settings.weightUnit === 'kg'
              ? w.value * 0.45359237
              : w.value / 0.45359237;
        b.weight = Math.round(val * 10) / 10;
      } else if (l.type === 'mood') {
        b.moodSum += (l.data as MoodData).score;
        b.moodCount += 1;
      } else if (l.type === 'cognition') {
        const c = l.data as CognitionData;
        b.fogSum += c.brainFog;
        b.focusSum += c.focus;
        b.cogCount += 1;
      }
    }

    return keys.map((k) => {
      const b = map.get(k)!;
      return {
        day: b.day,
        label: b.label,
        avgPain: b.painCount ? Math.round((b.painSum / b.painCount) * 10) / 10 : null,
        maxPain: b.painMax,
        medCount: b.medCount,
        stretchMin: Math.round(b.stretchMin),
        weight: b.weight,
        mood: b.moodCount ? Math.round((b.moodSum / b.moodCount) * 10) / 10 : null,
        brainFog: b.cogCount ? Math.round((b.fogSum / b.cogCount) * 10) / 10 : null,
        focus: b.cogCount ? Math.round((b.focusSum / b.cogCount) * 10) / 10 : null,
      };
    });
  }, [windowLogs, days, settings.weightUnit]);

  const daysAboveThreshold = useMemo(
    () => daily.filter((d) => d.maxPain !== null && d.maxPain > settings.painThreshold).length,
    [daily, settings.painThreshold],
  );

  const avgPain = useMemo(() => {
    const ps = windowLogs.filter((l) => l.type === 'pain').map((l) => (l.data as PainData).intensity);
    return ps.length ? (ps.reduce((a, b) => a + b, 0) / ps.length).toFixed(1) : '-';
  }, [windowLogs]);

  const falls = useMemo(() => windowLogs.filter((l) => l.type === 'fall') as Array<typeof windowLogs[number] & { data: FallData }>, [windowLogs]);
  const hasWeight = daily.some((d) => d.weight !== null);
  const hasMoodOrCog = daily.some((d) => d.mood !== null || d.brainFog !== null || d.focus !== null);

  // Map stretch ID/name to a recognizable clinical emoji
  const getStretchEmoji = (id?: string, name?: string) => {
    const s = `${id || ''} ${name || ''}`.toLowerCase();
    if (s.includes('squat') || s.includes('malasana')) return '🧘';
    if (s.includes('knee') && s.includes('chest')) return '🦵';
    if (s.includes('piriformis')) return '🎯';
    if (s.includes('nerve') || s.includes('glide') || s.includes('floss')) return '⚡';
    if (s.includes('twist')) return '🔄';
    if (s.includes('cat') || s.includes('cow')) return '🐈';
    if (s.includes('child')) return '🙇';
    if (s.includes('hamstring')) return '🎗️';
    if (s.includes('pelvic') || s.includes('tilt')) return '⚖️';
    if (s.includes('press') || s.includes('mckenzie')) return '🦭';
    return '🤸';
  };

  // Adaptive stretch chart data:
  // For short views (<= 7 days): Group by day (or intraday for 1d)
  // For longer views (> 7 days): Group by week
  const isWeeklyGroup = days > 7;
  const stretchTimeline = useMemo(() => {
    if (isWeeklyGroup) {
      const weeks = new Map<string, number>();
      for (const d of daily) {
        const dt = new Date(d.day + 'T00:00:00');
        const offset = settings.weekStart === 'monday' ? (dt.getDay() + 6) % 7 : dt.getDay();
        dt.setDate(dt.getDate() - offset);
        const wk = dayKey(dt).slice(5);
        weeks.set(wk, (weeks.get(wk) ?? 0) + d.stretchMin);
      }
      return [...weeks.entries()].map(([label, minutes]) => ({ label, minutes }));
    }

    if (days === 1) {
      // 1-day intraday stretch entries
      const stretchLogs = windowLogs
        .filter((l) => l.type === 'stretch')
        .slice()
        .reverse();
      if (stretchLogs.length === 0) return [{ label: 'Today', minutes: 0 }];
      return stretchLogs.map((l) => {
        const dt = new Date(l.at);
        const sd = l.data as StretchData;
        const emoji = getStretchEmoji(sd.stretchId, sd.stretchName);
        return {
          label: `${emoji} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          minutes: Math.round(((sd.durationSec ?? 0) / 60) * 10) / 10,
          name: sd.stretchName || 'Stretch',
        };
      });
    }

    // 2d, 3d, 7d: Daily breakdown
    return daily.map((d) => ({
      label: d.label,
      minutes: d.stretchMin,
    }));
  }, [daily, days, isWeeklyGroup, settings.weekStart, windowLogs]);

  // Stretches performed in the past 24 hours for the Daily Stretches card & graph
  const past24hStretches = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 3600 * 1000;
    return windowLogs
      .filter((l) => l.type === 'stretch' && new Date(l.at).getTime() >= oneDayAgo)
      .map((l) => {
        const sd = l.data as StretchData;
        const mins = Math.round(((sd.durationSec ?? 0) / 60) * 10) / 10;
        return {
          id: l.id,
          at: l.at,
          emoji: getStretchEmoji(sd.stretchId, sd.stretchName),
          name: sd.stretchName || 'Custom Stretch',
          minutes: mins,
          durationSec: sd.durationSec ?? 0,
          reps: sd.reps,
          sets: sd.sets,
        };
      });
  }, [windowLogs]);

  // Visual breakdown graph data for the 24h daily stretches (by stretch type)
  const dailyStretchChartData = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string; minutes: number; count: number }>();
    for (const s of past24hStretches) {
      const existing = map.get(s.name) || { name: s.name, emoji: s.emoji, minutes: 0, count: 0 };
      existing.minutes = Math.round((existing.minutes + s.minutes) * 10) / 10;
      existing.count += 1;
      map.set(s.name, existing);
    }
    return [...map.values()].map((item) => ({
      label: `${item.emoji} ${item.name}`,
      name: item.name,
      emoji: item.emoji,
      minutes: item.minutes,
      count: item.count,
    }));
  }, [past24hStretches]);

  // For short granular views (1d, 2d, 3d), render individual timestamped entries
  // so entries at 12:00 vs 12:20 don't overwrite or compress each other into a single day dot.
  const moodCogTimeline = useMemo(() => {
    if (days > 3) return daily;
    const items = windowLogs
      .filter((l) => l.type === 'mood' || l.type === 'cognition')
      .slice()
      .reverse(); // chronological (oldest to newest)
    
    if (items.length === 0) return daily;

    return items.map((l) => {
      const dt = new Date(l.at);
      const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const label = days === 1 ? timeStr : `${dt.getMonth() + 1}/${dt.getDate()} ${timeStr}`;
      const isMood = l.type === 'mood';
      const m = isMood ? (l.data as MoodData) : null;
      const c = !isMood ? (l.data as CognitionData) : null;
      return {
        label,
        mood: m ? m.score : null,
        focus: c ? c.focus : null,
        brainFog: c ? c.brainFog : null,
      };
    });
  }, [days, daily, windowLogs]);

  // Similarly for weight: on short ranges (1d, 2d, 3d), render each timestamped weight log
  // so multiple entries in a day don't overwrite each other.
  const weightTimeline = useMemo(() => {
    if (days > 3) return daily;
    const items = windowLogs
      .filter((l) => l.type === 'weight')
      .slice()
      .reverse(); // chronological (oldest to newest)

    if (items.length === 0) return daily;

    return items.map((l) => {
      const dt = new Date(l.at);
      const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const label = days === 1 ? timeStr : `${dt.getMonth() + 1}/${dt.getDate()} ${timeStr}`;
      const w = l.data as WeightData;
      const val =
        w.unit === settings.weightUnit
          ? w.value
          : settings.weightUnit === 'kg'
            ? w.value * 0.45359237
            : w.value / 0.45359237;
      return {
        day: dt.toISOString().slice(0, 10),
        label,
        avgPain: null,
        maxPain: null,
        medCount: 0,
        stretchMin: 0,
        weight: Math.round(val * 10) / 10,
        mood: null,
        brainFog: null,
        focus: null,
      };
    });
  }, [days, daily, windowLogs, settings.weightUnit]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pr-28 sm:pr-32">
        <div className="text-xs font-black uppercase tracking-widest text-[#424753] dark:text-gray-400">
          {days === 1 ? 'Last 24 hours · Today' : `Last ${days} days`}
        </div>
      </div>

      <div className="mb-6 overflow-x-auto -mx-1 px-1 pb-1">
        <Chips
          options={[
            { value: '1', label: '1d' },
            { value: '2', label: '2d' },
            { value: '3', label: '3d' },
            { value: '7', label: '7d' },
            { value: '30', label: '30d' },
            { value: '90', label: '90d' },
            { value: '180', label: '180d' },
          ]}
          value={String(days)}
          onChange={(v) => setDays(Number(v) as Range)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`${card} p-4`}>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#88909f]">Avg pain</div>
          <div className="text-2xl font-black mt-1 tabular-nums">{avgPain}</div>
        </div>
        <div className={`${card} p-4`}>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#88909f]">Days &gt; {settings.painThreshold}/10</div>
          <div className="text-2xl font-black mt-1 tabular-nums text-red-600">{daysAboveThreshold}</div>
        </div>
        <div className={`${card} p-4`}>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#88909f]">Falls</div>
          <div className="text-2xl font-black mt-1 tabular-nums">{falls.length}</div>
        </div>
      </div>

      {windowLogs.length === 0 ? (
        <div className={card}>
          <Empty icon={TrendingUp} title="No data in this range" hint="Log a few entries to see your trends." />
        </div>
      ) : (
        <div className="space-y-6">
          <div className={`${card} p-5`}>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#424753] dark:text-gray-300 mb-3">
              Pain vs. medications taken
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="pain" domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="meds" orientation="right" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine
                    yAxisId="pain"
                    y={settings.painThreshold}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    label={{ value: `Threshold (${settings.painThreshold})`, position: 'insideTopRight', fontSize: 10, fill: '#dc2626' }}
                  />
                  <Bar yAxisId="meds" dataKey="medCount" name="Med doses" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="pain" type="monotone" dataKey="maxPain" name="Peak pain" stroke="#dc2626" strokeWidth={2.5} connectNulls dot={{ r: 3 }} />
                  <Line yAxisId="pain" type="monotone" dataKey="avgPain" name="Avg pain" stroke="#0051ae" strokeWidth={2} connectNulls dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${card} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#424753] dark:text-gray-300">
                Stretch minutes
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {isWeeklyGroup ? 'Weekly total' : days === 1 ? 'Intraday' : 'Daily'}
              </span>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stretchTimeline}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="minutes" name="Minutes" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {past24hStretches.length > 0 && (
            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#424753] dark:text-gray-300">
                  Daily Stretches (Past 24h)
                </h3>
                <span className="text-xs font-bold text-[#88909f]">
                  {past24hStretches.length} {past24hStretches.length === 1 ? 'session' : 'sessions'}
                </span>
              </div>

              {/* Graphical Visual Breakdown for Past 24h Stretches */}
              <div className="h-44 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStretchChartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                    <XAxis type="number" unit="m" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any, _name: any, item: any) => [
                        `${val} min (${item.payload.count} ${item.payload.count === 1 ? 'session' : 'sessions'})`,
                        'Duration',
                      ]}
                    />
                    <Bar dataKey="minutes" name="Minutes" fill="#059669" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {past24hStretches.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#f0f4fc]/60 dark:bg-gray-800/50 border border-[#e4e8f0]/60 dark:border-gray-700/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg shrink-0" role="img" aria-label={s.name}>
                        {s.emoji}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">
                          {s.name}
                        </div>
                        <div className="text-xs text-[#88909f]">
                          {[
                            s.durationSec ? `${s.minutes} min (${s.durationSec}s)` : null,
                            s.reps ? `${s.reps} reps` : null,
                            s.sets ? `${s.sets} sets` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#88909f] shrink-0">
                      {fmtDate(s.at)} · {fmtTime(s.at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasWeight && (
            <div className={`${card} p-5`}>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#424753] dark:text-gray-300 mb-3">
                Weight ({settings.weightUnit})
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightTimeline}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    {settings.goals.targetWeight ? (
                      <ReferenceLine
                        y={settings.goals.targetWeight}
                        stroke="#059669"
                        strokeDasharray="4 4"
                        label={{ value: `Goal (${settings.goals.targetWeight})`, position: 'insideTopRight', fontSize: 10, fill: '#059669' }}
                      />
                    ) : null}
                    <Line type="monotone" dataKey="weight" name={`Weight (${settings.weightUnit})`} stroke="#0051ae" strokeWidth={2.5} connectNulls dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {hasMoodOrCog && (
            <div className={`${card} p-5`}>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#424753] dark:text-gray-300 mb-3">
                Mood &amp; cognition (1–5)
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodCogTimeline}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val: number) => {
                        const faces = ['😞', '🙁', '😐', '🙂', '😄'];
                        return faces[val - 1] ? `${faces[val - 1]} ${val}` : String(val);
                      }}
                      width={38}
                    />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="mood" name="Mood" stroke="#d97706" strokeWidth={2} connectNulls dot={{ r: 4, fill: '#d97706' }} />
                    <Line type="monotone" dataKey="focus" name="Focus" stroke="#4f46e5" strokeWidth={2} connectNulls dot={{ r: 3, fill: '#4f46e5' }} />
                    <Line type="monotone" dataKey="brainFog" name="Brain fog" stroke="#dc2626" strokeWidth={2} strokeDasharray="3 3" connectNulls dot={{ r: 3, fill: '#dc2626' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {falls.length > 0 && (
            <>
              <SectionTitle>Falls timeline</SectionTitle>
              <div className={`${card} p-4 space-y-2`}>
                {falls.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 py-2 border-b last:border-b-0 border-[#e4e8f0] dark:border-gray-700">
                    <TriangleAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold">{summarize(f)}</div>
                      {f.data.injuryDetails && <div className="text-xs text-red-600">{f.data.injuryDetails}</div>}
                      {f.notes && <div className="text-xs text-[#88909f]">{f.notes}</div>}
                    </div>
                    <div className="text-xs text-[#88909f] shrink-0">
                      {fmtDate(f.at)} · {fmtTime(f.at)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
