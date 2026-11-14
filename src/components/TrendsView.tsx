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

  const weeklyStretches = useMemo(() => {
    const weeks = new Map<string, number>();
    for (const d of daily) {
      const dt = new Date(d.day + 'T00:00:00');
      const offset = settings.weekStart === 'monday' ? (dt.getDay() + 6) % 7 : dt.getDay();
      dt.setDate(dt.getDate() - offset);
      const wk = dayKey(dt).slice(5);
      weeks.set(wk, (weeks.get(wk) ?? 0) + d.stretchMin);
    }
    return [...weeks.entries()].map(([week, minutes]) => ({ week, minutes }));
  }, [daily, settings.weekStart]);

  const falls = useMemo(() => windowLogs.filter((l) => l.type === 'fall') as Array<typeof windowLogs[number] & { data: FallData }>, [windowLogs]);
  const hasWeight = daily.some((d) => d.weight !== null);
  const hasMoodOrCog = daily.some((d) => d.mood !== null || d.brainFog !== null || d.focus !== null);

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
            <h3 className="text-sm font-black uppercase tracking-wider text-[#424753] dark:text-gray-300 mb-3">
              Stretch minutes per week
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyStretches}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="minutes" name="Minutes" fill="#059669" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {hasWeight && (
            <div className={`${card} p-5`}>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#424753] dark:text-gray-300 mb-3">
                Weight ({settings.weightUnit})
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={daily}>
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
                  <LineChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="mood" name="Mood" stroke="#d97706" strokeWidth={2} connectNulls />
                    <Line type="monotone" dataKey="focus" name="Focus" stroke="#4f46e5" strokeWidth={2} connectNulls />
                    <Line type="monotone" dataKey="brainFog" name="Brain fog" stroke="#dc2626" strokeWidth={2} strokeDasharray="3 3" connectNulls />
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
