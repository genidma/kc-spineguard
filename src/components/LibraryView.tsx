import { useEffect, useState } from 'react';
import { Pill, Plus, Play, Pause, RotateCcw, Check, Trash2, StretchHorizontal, Archive, Pencil } from 'lucide-react';
import { useAppData } from '../hooks/useAppData';
import { useOpenLog } from '../hooks/useLogEditor';
import { deleteCustomStretch, deleteMedication, saveCustomStretch, saveMedication } from '../lib/db';
import { chime } from '../lib/reminders';
import { MED_KINDS, type Medication, type Stretch } from '../lib/types';
import { Chips, Empty, Field, Modal, PageHeader, TextInput, btnGhost, btnPrimary, card, inputCls } from './ui';

export function LibraryView() {
  const [tab, setTab] = useState<'meds' | 'stretches'>('meds');
  return (
    <div>
      <PageHeader
        title="Library"
        subtitle="Your medications and guided sciatica stretches"
        right={
          <Chips
            options={[
              { value: 'meds', label: 'Medications' },
              { value: 'stretches', label: 'Stretches' },
            ]}
            value={tab}
            onChange={(v) => setTab(v)}
          />
        }
      />
      {tab === 'meds' ? <MedicationsTab /> : <StretchesTab />}
    </div>
  );
}

// ============================================================================
// Medications
// ============================================================================
function MedicationsTab() {
  const { uid, meds } = useAppData();
  const [editing, setEditing] = useState<Medication | 'new' | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const visible = meds.filter((m) => showArchived || m.active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className={btnPrimary} onClick={() => setEditing('new')} data-testid="add-med-btn">
          <Plus className="w-4 h-4" /> Add medication
        </button>
        {meds.some((m) => !m.active) && (
          <button type="button" className={btnGhost} onClick={() => setShowArchived((s) => !s)}>
            <Archive className="w-4 h-4" /> {showArchived ? 'Hide archived' : 'Show archived'}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className={card}>
          <Empty
            icon={Pill}
            title="No medications added"
            hint="Add your medications with max daily dose and minimum hours between doses so SpineGuard can warn you before you log."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((m) => (
            <div key={m.id} className={`${card} p-4 flex items-start justify-between gap-3 ${!m.active ? 'opacity-60' : ''}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-base">{m.name}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                    {m.kind}
                  </span>
                  {!m.active && <span className="text-[10px] font-bold uppercase text-[#88909f]">Archived</span>}
                </div>
                <p className="text-xs text-[#424753] dark:text-gray-400 mt-1">
                  {[
                    m.strength,
                    m.typicalDose ? `Typical: ${m.typicalDose} ${m.unit}` : null,
                    m.maxDailyDose ? `Max 24h: ${m.maxDailyDose} ${m.unit}` : null,
                    m.minHoursBetween ? `Min gap: ${m.minHoursBetween}h` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || `Unit: ${m.unit}`}
                </p>
                {m.scheduleTimes && m.scheduleTimes.length > 0 && (
                  <p className="text-xs text-[#88909f] mt-1">Schedule: {m.scheduleTimes.join(', ')}</p>
                )}
              </div>
              <button type="button" onClick={() => setEditing(m)} className={btnGhost + ' py-2 px-3'} aria-label={`Edit ${m.name}`}>
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <MedEditorModal
        open={editing !== null}
        existing={editing && editing !== 'new' ? editing : undefined}
        onClose={() => setEditing(null)}
        onSave={async (m) => {
          await saveMedication(uid, m);
          setEditing(null);
        }}
        onDelete={async (id) => {
          await deleteMedication(uid, id);
          setEditing(null);
        }}
      />
    </div>
  );
}

function MedEditorModal({
  open,
  existing,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  existing?: Medication;
  onClose: () => void;
  onSave: (m: Omit<Medication, 'id'> & { id?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<string>(MED_KINDS[0]);
  const [strength, setStrength] = useState('');
  const [unit, setUnit] = useState('mg');
  const [typicalDose, setTypicalDose] = useState('');
  const [maxDailyDose, setMaxDailyDose] = useState('');
  const [minHoursBetween, setMinHoursBetween] = useState('');
  const [scheduleText, setScheduleText] = useState('');
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? '');
    setKind(existing?.kind ?? MED_KINDS[0]);
    setStrength(existing?.strength ?? '');
    setUnit(existing?.unit ?? 'mg');
    setTypicalDose(existing?.typicalDose != null ? String(existing.typicalDose) : '');
    setMaxDailyDose(existing?.maxDailyDose != null ? String(existing.maxDailyDose) : '');
    setMinHoursBetween(existing?.minHoursBetween != null ? String(existing.minHoursBetween) : '');
    setScheduleText((existing?.scheduleTimes ?? []).join(', '));
    setActive(existing?.active ?? true);
    setNotes(existing?.notes ?? '');
  }, [open, existing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const scheduleTimes = scheduleText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^\d{2}:\d{2}$/.test(s));
    await onSave({
      id: existing?.id,
      createdAt: existing?.createdAt,
      name: name.trim(),
      kind,
      strength: strength.trim() || undefined,
      unit: unit.trim() || 'mg',
      typicalDose: typicalDose ? Number(typicalDose) : null,
      maxDailyDose: maxDailyDose ? Number(maxDailyDose) : null,
      minHoursBetween: minHoursBetween ? Number(minHoursBetween) : null,
      scheduleTimes,
      active,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? 'Edit medication' : 'Add medication'}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ibuprofen" required data-testid="med-form-name" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kind / class">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)} data-testid="med-form-kind">
              {MED_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dose unit">
            <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="mg, tablet, ml" data-testid="med-form-unit" />
          </Field>
        </div>
        <Field label="Strength (optional)">
          <TextInput value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="e.g. 200 mg tablet" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Typical dose">
            <TextInput type="number" step="any" min="0" value={typicalDose} onChange={(e) => setTypicalDose(e.target.value)} data-testid="med-form-typical" />
          </Field>
          <Field label="Max 24h dose">
            <TextInput type="number" step="any" min="0" value={maxDailyDose} onChange={(e) => setMaxDailyDose(e.target.value)} data-testid="med-form-max" />
          </Field>
          <Field label="Min hours gap">
            <TextInput type="number" step="any" min="0" value={minHoursBetween} onChange={(e) => setMinHoursBetween(e.target.value)} data-testid="med-form-gap" />
          </Field>
        </div>
        <Field label="Reminder times (HH:MM, comma-separated)">
          <TextInput value={scheduleText} onChange={(e) => setScheduleText(e.target.value)} placeholder="08:00, 20:00" />
        </Field>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active medication
        </label>
        <Field label="Notes">
          <TextInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Take with food..." />
        </Field>
        <div className="flex gap-3 pt-2">
          {existing && (
            <button
              type="button"
              onClick={() => confirm(`Delete ${existing.name}?`) && onDelete(existing.id)}
              className={btnGhost + ' text-red-600'}
              aria-label="Delete medication"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button type="submit" className={btnPrimary + ' flex-1'} data-testid="med-form-save">
            Save medication
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================================
// Stretches + Guided Timer
// ============================================================================
function StretchesTab() {
  const { uid, stretches } = useAppData();
  const [active, setActive] = useState<Stretch | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-4">
      <button type="button" className={btnPrimary} onClick={() => setAdding(true)}>
        <Plus className="w-4 h-4" /> Add custom stretch
      </button>

      <div className="grid sm:grid-cols-2 gap-3">
        {stretches.map((s) => (
          <div key={s.id} className={`${card} p-4 flex flex-col justify-between gap-3`}>
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-black text-base flex items-center gap-2">
                  <StretchHorizontal className="w-4 h-4 text-emerald-600 shrink-0" />
                  {s.name}
                </h3>
                {!s.builtIn && (
                  <button
                    type="button"
                    onClick={() => confirm(`Delete ${s.name}?`) && deleteCustomStretch(uid, s.id)}
                    className="text-[#88909f] hover:text-red-600"
                    aria-label={`Delete ${s.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {s.target && <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">{s.target}</p>}
              <p className="text-xs text-[#424753] dark:text-gray-400 mt-1">
                {[s.sets ? `${s.sets} sets` : null, s.reps ? `${s.reps} reps` : null, s.holdSeconds ? `${s.holdSeconds}s hold` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {s.steps && s.steps.length > 0 && (
                <ol className="text-xs text-[#424753] dark:text-gray-300 mt-2 space-y-1 list-decimal list-inside">
                  {s.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              )}
            </div>
            <button type="button" className={btnGhost + ' w-full py-2.5'} onClick={() => setActive(s)}>
              <Play className="w-4 h-4" /> Start timer
            </button>
          </div>
        ))}
      </div>

      <StretchTimerModal stretch={active} onClose={() => setActive(null)} />
      <CustomStretchModal
        open={adding}
        onClose={() => setAdding(false)}
        onSave={async (s) => {
          await saveCustomStretch(uid, s);
          setAdding(false);
        }}
      />
    </div>
  );
}

function StretchTimerModal({ stretch, onClose }: { stretch: Stretch | null; onClose: () => void }) {
  const openLog = useOpenLog();
  const hold = stretch?.holdSeconds ?? 30;
  const [secondsLeft, setSecondsLeft] = useState(hold);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [repDone, setRepDone] = useState(0);

  useEffect(() => {
    setSecondsLeft(stretch?.holdSeconds ?? 30);
    setRunning(false);
    setElapsed(0);
    setRepDone(0);
  }, [stretch]);

  useEffect(() => {
    if (!running || !stretch) return;
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      setSecondsLeft((s) => {
        if (s <= 1) {
          chime();
          setRepDone((r) => r + 1);
          setRunning(false);
          return hold;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, stretch, hold]);

  if (!stretch) return null;

  const finishAndLog = () => {
    const s = stretch;
    onClose();
    openLog('stretch', undefined, {
      stretchId: s.id,
      stretchName: s.name,
      durationSec: Math.max(elapsed, repDone * hold, 30),
      reps: repDone || s.reps,
      sets: s.sets ?? 1,
    });
  };

  return (
    <Modal open={!!stretch} onClose={onClose} title={stretch.name}>
      <div className="space-y-5">
        <div className="text-center py-4 bg-[#f0f4fc] dark:bg-gray-700 rounded-2xl">
          <div className="text-5xl font-black tabular-nums text-[#0051ae] dark:text-white">{secondsLeft}s</div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#424753] dark:text-gray-300 mt-1">
            Completed holds: {repDone}
            {stretch.reps ? ` / ${stretch.reps}` : ''}
          </div>
        </div>

        <div className="flex gap-2">
          <button type="button" className={btnPrimary + ' flex-1'} onClick={() => setRunning((r) => !r)}>
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? 'Pause' : 'Start hold'}
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setRunning(false);
              setSecondsLeft(hold);
            }}
            aria-label="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {stretch.steps && stretch.steps.length > 0 && (
          <ol className="text-sm text-[#424753] dark:text-gray-300 space-y-1.5 list-decimal list-inside">
            {stretch.steps.map((st, i) => (
              <li key={i}>{st}</li>
            ))}
          </ol>
        )}

        <button type="button" className={btnPrimary + ' w-full'} onClick={finishAndLog}>
          <Check className="w-4 h-4" /> Finish &amp; log stretch
        </button>
      </div>
    </Modal>
  );
}

function CustomStretchModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (s: Omit<Stretch, 'id' | 'builtIn'>) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [holdSeconds, setHoldSeconds] = useState('30');
  const [reps, setReps] = useState('3');
  const [sets, setSets] = useState('1');
  const [stepsText, setStepsText] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const steps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    await onSave({
      name: name.trim(),
      target: target.trim() || undefined,
      holdSeconds: holdSeconds ? Number(holdSeconds) : undefined,
      reps: reps ? Number(reps) : undefined,
      sets: sets ? Number(sets) : undefined,
      steps: steps.length ? steps : undefined,
    });
    setName('');
    setTarget('');
    setStepsText('');
  };

  return (
    <Modal open={open} onClose={onClose} title="Add custom stretch">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Cobra pose" />
        </Field>
        <Field label="Target area">
          <TextInput value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. Lower back" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Hold (sec)">
            <TextInput type="number" min="1" value={holdSeconds} onChange={(e) => setHoldSeconds(e.target.value)} />
          </Field>
          <Field label="Reps">
            <TextInput type="number" min="1" value={reps} onChange={(e) => setReps(e.target.value)} />
          </Field>
          <Field label="Sets">
            <TextInput type="number" min="1" value={sets} onChange={(e) => setSets(e.target.value)} />
          </Field>
        </div>
        <Field label="Steps (one per line)">
          <textarea className={inputCls + ' min-h-[90px]'} value={stepsText} onChange={(e) => setStepsText(e.target.value)} />
        </Field>
        <button type="submit" className={btnPrimary + ' w-full'}>
          Save stretch
        </button>
      </form>
    </Modal>
  );
}
