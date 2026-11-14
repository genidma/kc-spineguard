import { useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, Trash2, Pill } from 'lucide-react';
import type {
  AnyLog,
  CognitionData,
  FallData,
  LogDataMap,
  LogType,
  MedData,
  MoodData,
  PainData,
  PainMgmtData,
  PostureData,
  StretchData,
  WeightData,
} from '../lib/types';
import { useAppData } from '../hooks/useAppData';
import { saveLog, deleteLog } from '../lib/db';
import { checkDose } from '../lib/meds';
import { fromLocalInput, toLocalInput } from '../lib/time';
import {
  BODY_REGIONS,
  FALL_CAUSES,
  LOG_META,
  MGMT_METHODS,
  MOOD_FACES,
  MOOD_TAGS,
  PAIN_QUALITIES,
  PAIN_TRIGGERS,
  POSTURE_AIDS,
} from '../lib/logMeta';
import { Chips, Field, Modal, Scale, TextInput, btnGhost, btnPrimary, inputCls } from './ui';

type Draft<T extends LogType> = LogDataMap[T];

function defaults(type: LogType, ctx: ReturnType<typeof useAppData>): Draft<LogType> {
  const { settings, stretches, meds, logs } = ctx;
  switch (type) {
    case 'weight': {
      const last = logs.find((l) => l.type === 'weight');
      return { value: last ? (last.data as WeightData).value : 0, unit: settings.weightUnit } satisfies WeightData;
    }
    case 'stretch':
      return {
        stretchId: stretches[0]?.id ?? '',
        stretchName: stretches[0]?.name ?? '',
        reps: stretches[0]?.reps,
        sets: stretches[0]?.sets,
        durationSec: undefined,
      } satisfies StretchData;
    case 'posture':
      return { position: 'sitting', quality: 'fair', durationMin: 30, aids: [] } satisfies PostureData;
    case 'pain': {
      const side = settings.medical.affectedSide;
      return {
        intensity: 3,
        painType: 'chronic',
        locations: side && side !== 'both' ? [`lowerBack:${side}`] : [],
        qualities: [],
        triggers: [],
      } satisfies PainData;
    }
    case 'painMgmt':
      return { method: 'heat', durationMin: 20, effectiveness: 5 } satisfies PainMgmtData;
    case 'med': {
      const m = meds.find((x) => x.active);
      return {
        medicationId: m?.id ?? '',
        medicationName: m?.name ?? '',
        kind: m?.kind ?? '',
        dose: m?.typicalDose ?? 0,
        unit: m?.unit ?? 'mg',
      } satisfies MedData;
    }
    case 'mood':
      return { score: 3, tags: [] } satisfies MoodData;
    case 'cognition':
      return { focus: 3, brainFog: 2, memory: 3 } satisfies CognitionData;
    case 'fall':
      return { cause: 'leg gave way', injury: false, neededHelp: false } satisfies FallData;
  }
}

export interface LogEditorProps {
  open: boolean;
  onClose: () => void;
  type: LogType;
  existing?: AnyLog;
  /** Prefill data (e.g. stretch timer completion). */
  prefill?: Partial<Draft<LogType>>;
}

export function LogEditor(props: LogEditorProps) {
  // Remount the inner form whenever the target changes so state resets cleanly.
  const key = `${props.type}-${props.existing?.id ?? 'new'}-${props.open}`;
  return (
    <Modal open={props.open} onClose={props.onClose} title={`${props.existing ? 'Edit' : 'Log'} ${LOG_META[props.type].label.toLowerCase()}`}>
      {props.open && <LogForm key={key} {...props} />}
    </Modal>
  );
}

function LogForm({ type, existing, onClose, prefill }: LogEditorProps) {
  const ctx = useAppData();
  const { uid, settings, meds, logs, stretches } = ctx;
  const [at, setAt] = useState(toLocalInput(existing?.at ?? new Date()));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [data, setData] = useState<any>(() => ({ ...defaults(type, ctx), ...(existing?.data ?? {}), ...(prefill ?? {}) }));
  const [ack, setAck] = useState(false);
  const set = (patch: object) => setData((d: any) => ({ ...d, ...patch }));

  // Medication safety check
  const med = type === 'med' ? meds.find((m) => m.id === data.medicationId) : undefined;
  const doseCheck = useMemo(
    () => (med ? checkDose(med, Number(data.dose) || 0, fromLocalInput(at), logs, existing?.id) : null),
    [med, data.dose, at, logs, existing?.id],
  );
  const hasWarning = !!doseCheck?.warnings.length;

  const valid = (() => {
    switch (type) {
      case 'weight':
        return Number(data.value) > 0;
      case 'stretch': {
        const mins = data.durationSec !== undefined ? data.durationSec / 60 : 0;
        return !!data.stretchId && mins >= 0.5 && mins <= 999;
      }
      case 'med':
        return !!data.medicationId && Number(data.dose) > 0 && (!hasWarning || ack);
      default:
        return true;
    }
  })();

  const submit = async () => {
    const payload: any = { ...data };
    if (type === 'pain') payload.aboveThreshold = payload.intensity > settings.painThreshold;
    if (type === 'med' && hasWarning) payload.overrideWarning = true;
    if (type === 'weight') payload.value = Number(payload.value);
    if (type === 'med') payload.dose = Number(payload.dose);
    await saveLog(uid, {
      id: existing?.id,
      createdAt: existing?.createdAt,
      type,
      at: fromLocalInput(at),
      data: payload,
      notes,
    });
    onClose();
  };

  const remove = async () => {
    if (existing && confirm('Delete this entry?')) {
      await deleteLog(uid, existing.id);
      onClose();
    }
  };

  let body: ReactNode = null;
  switch (type) {
    case 'weight':
      body = (
        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <Field label="Weight">
            <TextInput
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              data-testid="weight-value"
              value={data.value || ''}
              onChange={(e) => set({ value: e.target.value })}
              autoFocus
            />
          </Field>
          <Chips options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} value={data.unit} onChange={(u) => set({ unit: u })} />
        </div>
      );
      break;

    case 'stretch':
      body = (
        <>
          <Field label="Stretch">
            <select
              className={inputCls}
              value={data.stretchId}
              onChange={(e) => {
                const s = stretches.find((x) => x.id === e.target.value);
                set({ stretchId: e.target.value, stretchName: s?.name ?? '', reps: s?.reps, sets: s?.sets });
              }}
            >
              {stretches.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sets">
              <TextInput type="number" min="0" value={data.sets ?? ''} onChange={(e) => set({ sets: num(e.target.value) })} />
            </Field>
            <Field label="Reps">
              <TextInput type="number" min="0" value={data.reps ?? ''} onChange={(e) => set({ reps: num(e.target.value) })} />
            </Field>
            <Field label="Minutes (required, 0.5 – 999)">
              <TextInput
                type="number"
                inputMode="decimal"
                min="0.5"
                max="999"
                step="any"
                placeholder="e.g. 1.5"
                required
                value={data.durationSec ? data.durationSec / 60 : ''}
                onChange={(e) => set({ durationSec: e.target.value !== '' ? Math.round(Number(e.target.value) * 60) : undefined })}
              />
            </Field>
          </div>
          <Scale label="Pain before" value={data.painBefore ?? 0} onChange={(v) => set({ painBefore: v })} />
          <Scale label="Pain after" value={data.painAfter ?? 0} onChange={(v) => set({ painAfter: v })} />
        </>
      );
      break;

    case 'posture':
      body = (
        <>
          <Field label="Position">
            <Chips
              options={['sitting', 'standing', 'lying', 'walking', 'driving', 'bending', 'lifting'].map((v) => ({ value: v, label: cap(v) }))}
              value={data.position}
              onChange={(v) => set({ position: v })}
            />
          </Field>
          <Field label="Quality">
            <Chips
              options={[
                { value: 'good', label: '✅ Good' },
                { value: 'fair', label: '➖ Fair' },
                { value: 'poor', label: '⚠️ Poor' },
              ]}
              value={data.quality}
              onChange={(v) => set({ quality: v })}
            />
          </Field>
          <Field label="Duration (minutes)">
            <TextInput type="number" min="0" value={data.durationMin ?? ''} onChange={(e) => set({ durationMin: num(e.target.value) })} />
          </Field>
          <Field label="Aids used">
            <Chips multi options={POSTURE_AIDS} value={data.aids ?? []} onChange={(v) => set({ aids: v })} />
          </Field>
          <Scale label="Pain during" value={data.painDuring ?? 0} onChange={(v) => set({ painDuring: v })} />
        </>
      );
      break;

    case 'pain':
      body = (
        <>
          <Scale
            label="Intensity"
            value={data.intensity}
            onChange={(v) => set({ intensity: v })}
            marker={settings.painThreshold}
            lowLabel="No pain"
            highLabel="Worst imaginable"
            testId="pain-intensity"
          />
          {data.intensity > settings.painThreshold && (
            <p className="text-xs font-bold text-red-600 -mt-2">Above your threshold of {settings.painThreshold}/10</p>
          )}
          <Field label="Type">
            <Chips
              options={[
                { value: 'chronic', label: 'Chronic (baseline)' },
                { value: 'flare', label: 'Flare-up' },
                { value: 'acute', label: 'Acute / new' },
              ]}
              value={data.painType}
              onChange={(v) => set({ painType: v })}
            />
          </Field>
          <BodyMap value={data.locations} onChange={(v) => set({ locations: v })} />
          <Field label="What does it feel like?">
            <Chips multi options={PAIN_QUALITIES} value={data.qualities} onChange={(v) => set({ qualities: v })} />
          </Field>
          <Field label="Triggers">
            <Chips multi options={PAIN_TRIGGERS} value={data.triggers ?? []} onChange={(v) => set({ triggers: v })} />
          </Field>
        </>
      );
      break;

    case 'painMgmt':
      body = (
        <>
          <Field label="Method">
            <Chips options={MGMT_METHODS} value={data.method} onChange={(v) => set({ method: v })} />
          </Field>
          <Field label="Duration (minutes)">
            <TextInput type="number" min="0" value={data.durationMin ?? ''} onChange={(e) => set({ durationMin: num(e.target.value) })} />
          </Field>
          <Scale label="How much did it help?" value={data.effectiveness ?? 0} onChange={(v) => set({ effectiveness: v })} lowLabel="Not at all" highLabel="Completely" />
        </>
      );
      break;

    case 'med':
      body =
        meds.filter((m) => m.active).length === 0 ? (
          <div className="text-center py-6">
            <Pill className="w-10 h-10 mx-auto text-violet-400 mb-2" />
            <p className="font-bold">No medications yet</p>
            <p className="text-sm text-[#424753] dark:text-gray-400">Add your meds in Library → Medications first, with max daily dose limits.</p>
          </div>
        ) : (
          <>
            <Field label="Medication">
              <select
                className={inputCls}
                data-testid="med-select"
                value={data.medicationId}
                onChange={(e) => {
                  const m = meds.find((x) => x.id === e.target.value);
                  set({ medicationId: m?.id, medicationName: m?.name, kind: m?.kind, unit: m?.unit, dose: m?.typicalDose ?? data.dose });
                  setAck(false);
                }}
              >
                {meds
                  .filter((m) => m.active || m.id === data.medicationId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.kind})
                    </option>
                  ))}
              </select>
            </Field>
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <Field label={`Dose (${data.unit})`}>
                <TextInput
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  data-testid="med-dose"
                  value={data.dose || ''}
                  onChange={(e) => {
                    set({ dose: e.target.value });
                    setAck(false);
                  }}
                />
              </Field>
              <span className="pb-3 text-sm font-bold text-[#424753] dark:text-gray-300">{data.unit}</span>
            </div>
            {doseCheck && (
              <div className="text-xs font-medium text-[#424753] dark:text-gray-300 bg-[#f0f4fc] dark:bg-gray-700 rounded-xl p-3 space-y-1">
                <div>
                  Last 24h: <b>{doseCheck.takenLast24h} {data.unit}</b>
                  {med?.maxDailyDose != null && (
                    <>
                      {' '}
                      of {med.maxDailyDose} max · <b>{doseCheck.remaining}</b> left
                    </>
                  )}
                </div>
                {doseCheck.lastDoseAt && <div>Last dose: {new Date(doseCheck.lastDoseAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>}
              </div>
            )}
            {hasWarning && (
              <div role="alert" className="rounded-xl border-2 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300 space-y-2">
                {doseCheck!.warnings.map((w) => (
                  <p key={w} className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    {w}
                  </p>
                ))}
                <label className="flex items-center gap-2 font-bold">
                  <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} data-testid="med-ack" />
                  I understand. Log it anyway (e.g. as advised by my clinician).
                </label>
              </div>
            )}
            <Field label="Reason">
              <TextInput value={data.reason ?? ''} onChange={(e) => set({ reason: e.target.value })} placeholder="e.g. flare-up after sitting" />
            </Field>
            <Scale label="Relief after (fill in later)" value={data.reliefAfter ?? 0} onChange={(v) => set({ reliefAfter: v })} lowLabel="None" highLabel="Full" />
          </>
        );
      break;

    case 'mood':
      body = (
        <>
          <Field label="How are you feeling?">
            <div className="flex justify-between gap-2">
              {MOOD_FACES.map((f, i) => (
                <button
                  type="button"
                  key={f}
                  aria-label={`Mood ${i + 1}`}
                  aria-pressed={data.score === i + 1}
                  onClick={() => set({ score: i + 1 })}
                  className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all ${
                    data.score === i + 1 ? 'bg-amber-100 dark:bg-amber-900/40 scale-105 ring-2 ring-amber-400' : 'bg-[#f0f4fc] dark:bg-gray-700'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl">{f}</span>
                  <span className="text-[10px] font-black uppercase text-[#88909f] mt-1">{i + 1}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tags">
            <Chips multi options={MOOD_TAGS} value={data.tags} onChange={(v) => set({ tags: v })} />
          </Field>
        </>
      );
      break;

    case 'cognition':
      body = (
        <>
          <Scale label="Focus" min={1} max={5} value={data.focus} onChange={(v) => set({ focus: v })} lowLabel="Scattered" highLabel="Sharp" />
          <Scale label="Brain fog" min={1} max={5} value={data.brainFog} onChange={(v) => set({ brainFog: v })} lowLabel="Clear" highLabel="Very foggy" />
          <Scale label="Memory" min={1} max={5} value={data.memory} onChange={(v) => set({ memory: v })} lowLabel="Forgetful" highLabel="Sharp" />
          <p className="text-xs text-[#88909f]">Tip: tracking this alongside meds can help spot side effects (e.g. gabapentinoids).</p>
        </>
      );
      break;

    case 'fall':
      body = (
        <>
          <Field label="What caused it?">
            <Chips options={FALL_CAUSES} value={data.cause} onChange={(v) => set({ cause: v })} />
          </Field>
          <Field label="Where?">
            <TextInput value={data.location ?? ''} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. stairs, bathroom" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => set({ injury: !data.injury })} className={`${btnGhost} ${data.injury ? 'ring-2 ring-red-400' : ''}`} aria-pressed={data.injury}>
              {data.injury ? '✔ ' : ''}Injured
            </button>
            <button type="button" onClick={() => set({ neededHelp: !data.neededHelp })} className={`${btnGhost} ${data.neededHelp ? 'ring-2 ring-red-400' : ''}`} aria-pressed={data.neededHelp}>
              {data.neededHelp ? '✔ ' : ''}Needed help
            </button>
          </div>
          {data.injury && (
            <Field label="Injury details">
              <TextInput value={data.injuryDetails ?? ''} onChange={(e) => set({ injuryDetails: e.target.value })} />
            </Field>
          )}
          <p className="text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
            New leg weakness, numbness in the groin/saddle area, or loss of bladder/bowel control needs urgent medical care.
          </p>
        </>
      );
      break;
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void submit();
      }}
    >
      {body}
      <Field label="When">
        <TextInput type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
      </Field>
      <Field label="Notes">
        <textarea className={inputCls + ' min-h-[70px]'} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} />
      </Field>
      <div className="flex gap-3">
        {existing && (
          <button type="button" onClick={remove} className={btnGhost + ' text-red-600'} aria-label="Delete entry">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button type="submit" disabled={!valid} className={btnPrimary + ' flex-1'} data-testid="log-save">
          Save
        </button>
      </div>
    </form>
  );
}

function BodyMap({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (k: string) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <Field label="Where? (tap left / right)">
      <div className="rounded-2xl bg-[#f0f4fc] dark:bg-gray-700 p-3 space-y-1.5">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-[10px] font-bold uppercase tracking-wider text-[#88909f] px-1">
          <span />
          <span className="w-14 text-center">Left</span>
          <span className="w-14 text-center">Right</span>
        </div>
        {BODY_REGIONS.map((r) => (
          <div key={r.value} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
            <span className="text-sm font-semibold px-1">{r.label}</span>
            {(['left', 'right'] as const).map((side) => {
              const k = `${r.value}:${side}`;
              const on = value.includes(k);
              return (
                <button
                  type="button"
                  key={k}
                  aria-label={`${r.label} ${side}`}
                  aria-pressed={on}
                  onClick={() => toggle(k)}
                  className={`w-14 h-8 rounded-lg font-bold text-xs transition-colors ${
                    on ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-800 text-[#88909f]'
                  }`}
                >
                  {on ? '●' : '○'}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </Field>
  );
}

const num = (v: string) => (v === '' ? undefined : Number(v));
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
