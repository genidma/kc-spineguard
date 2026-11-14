import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Bell,
  Calendar,
  Download,
  Key,
  Loader2,
  Lock,
  LogOut,
  Moon,
  Ruler,
  Scale,
  Shield,
  ShieldCheck,
  Stethoscope,
  Target,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppData } from '../hooks/useAppData';
import { fetchAllLogs } from '../lib/db';
import { buildCsv, downloadCsv } from '../lib/export';
import { LOG_META, LOG_ORDER } from '../lib/logMeta';
import { getUserProfile, updateUserProfileMfa, type UserProfile } from '../lib/profileService';
import { notificationPermission, prefs, requestNotificationPermission, sendNotification } from '../lib/reminders';
import { generateBackupCodes, generateSecret, hashBackupCode, verifyTOTP } from '../lib/totp';
import type { LogType, Side, StretchData } from '../lib/types';
import { Chips, Field, Modal, Scale as ScaleSlider, SectionTitle, SettingItem, TextInput, btnGhost, btnPrimary, card, inputCls } from './ui';

export function ProfileView({ onOpenSecurityLog }: { onOpenSecurityLog: () => void }) {
  const { user, logout, changePassword } = useAuth();
  const { settings, saveSettings, logs, meds, effectiveTheme, toggleTheme } = useAppData();

  // Notification & sound prefs (localStorage, as in kc-rhythm)
  const [sounds, setSounds] = useState(() => prefs.sounds);
  const [alerts, setAlerts] = useState(() => prefs.alerts);
  const [notifPerm, setNotifPerm] = useState(() => notificationPermission());
  const [notifGuideOpen, setNotifGuideOpen] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  // Modals
  const [medicalOpen, setMedicalOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [mfaOpen, setMfaOpen] = useState(false);

  // MFA state (ported from kc-rhythm)
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [savingMfa, setSavingMfa] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    if (user) void getUserProfile(user.uid).then(setProfile);
  }, [user]);

  const stretchMinTotal = Math.round(
    logs.filter((l) => l.type === 'stretch').reduce((s, l) => s + ((l.data as StretchData).durationSec ?? 0) / 60, 0),
  );

  const toggleSounds = () => {
    const next = !sounds;
    prefs.sounds = next;
    setSounds(next);
  };

  const toggleAlerts = async () => {
    if (!alerts) {
      const perm = await requestNotificationPermission();
      setNotifPerm(perm);
      if (perm === 'granted') {
        prefs.alerts = true;
        setAlerts(true);
      } else if (perm === 'denied') {
        setNotifGuideOpen(true);
      }
    } else {
      prefs.alerts = false;
      setAlerts(false);
    }
  };

  const handleTestNotif = async () => {
    setTestFeedback(null);
    if (notifPerm === 'default') {
      const perm = await requestNotificationPermission();
      setNotifPerm(perm);
    }
    const ok = await sendNotification('🔔 SpineGuard Test', 'Background reminders are working.');
    setTestFeedback(ok ? 'Sent! Check your notification tray.' : 'Blocked or unsupported in this browser.');
    setTimeout(() => setTestFeedback(null), 4000);
  };

  return (
    <div>
      {/* Header card (kc-rhythm style) */}
      <div className="bg-gradient-to-br from-[#0051ae] to-[#0969da] rounded-3xl p-6 text-white mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black truncate">{user?.email || 'kc-spineguard'}</h2>
            <p className="text-sm opacity-80">
              {settings.medical.diagnosis || 'Managing sciatica daily'}
              {settings.medical.affectedSide ? ` · ${settings.medical.affectedSide} side` : ''}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-xl font-black tabular-nums">{logs.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Logs (30d+)</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-xl font-black tabular-nums">{stretchMinTotal}m</div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Stretched</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-xl font-black tabular-nums">{meds.filter((m) => m.active).length}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Active meds</div>
          </div>
        </div>
      </div>

      {/* Sciatica & Goals */}
      <SectionTitle>Sciatica &amp; goals</SectionTitle>
      <div className="space-y-2">
        <div className={`${card} p-4`}>
          <ScaleSlider
            label="Personal pain threshold"
            value={settings.painThreshold}
            onChange={(v) => saveSettings({ painThreshold: v })}
            lowLabel="Low"
            highLabel="Severe"
          />
          <p className="text-xs text-[#88909f] mt-1">Pain entries above {settings.painThreshold}/10 are flagged on your dashboard.</p>
        </div>

        <SettingItem
          icon={Stethoscope}
          label="Medical profile"
          value={settings.medical.affectedSide ? `${settings.medical.affectedSide} side` : 'Set up'}
          onClick={() => setMedicalOpen(true)}
        />
        <SettingItem
          icon={Target}
          label="Health goals"
          value={`${settings.goals.stretchMinutesPerDay}m stretch · ${settings.goals.postureChecksPerDay} posture`}
          onClick={() => setGoalsOpen(true)}
        />
      </div>

      {/* Units & Calendar */}
      <SectionTitle>Units &amp; calendar</SectionTitle>
      <div className="space-y-2">
        <SettingItem
          icon={Scale}
          label="Weight unit"
          value={settings.weightUnit}
          onClick={() => saveSettings({ weightUnit: settings.weightUnit === 'kg' ? 'lb' : 'kg' })}
        />
        <SettingItem
          icon={Ruler}
          label="Height unit"
          value={settings.heightUnit}
          onClick={() => saveSettings({ heightUnit: settings.heightUnit === 'cm' ? 'in' : 'cm' })}
        />
        <SettingItem
          icon={Calendar}
          label="Week starts on"
          value={settings.weekStart === 'monday' ? 'Monday' : 'Sunday'}
          onClick={() => saveSettings({ weekStart: settings.weekStart === 'monday' ? 'sunday' : 'monday' })}
        />
      </div>

      {/* Appearance & Quiet Hours (from kc-rhythm) */}
      <SectionTitle>Appearance &amp; quiet hours</SectionTitle>
      <div className="space-y-2">
        <SettingItem icon={Moon} label="Dark mode" toggle toggleValue={effectiveTheme === 'dark'} onClick={toggleTheme} />
        <SettingItem
          icon={Activity}
          label="Auto dark mode & mute reminders"
          toggle
          toggleValue={settings.themeSchedule}
          onClick={() => saveSettings({ themeSchedule: !settings.themeSchedule })}
        />
        <div className={`${card} p-4 flex items-center justify-between gap-4`}>
          <div>
            <div className="font-medium text-sm">Quiet hours</div>
            <div className="text-xs text-[#88909f]">Mutes reminders (and switches theme if auto is on)</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="time"
              value={settings.quietStart}
              onChange={(e) => saveSettings({ quietStart: e.target.value })}
              className="bg-[#f0f4fc] dark:bg-gray-700 rounded-xl px-2.5 py-1.5 text-sm font-bold"
              aria-label="Quiet start"
            />
            <span className="text-xs text-[#88909f]">to</span>
            <input
              type="time"
              value={settings.quietEnd}
              onChange={(e) => saveSettings({ quietEnd: e.target.value })}
              className="bg-[#f0f4fc] dark:bg-gray-700 rounded-xl px-2.5 py-1.5 text-sm font-bold"
              aria-label="Quiet end"
            />
          </div>
        </div>
      </div>

      {/* Reminders & Notifications (from kc-rhythm) */}
      <SectionTitle>Reminders &amp; notifications</SectionTitle>
      <div className="space-y-2">
        <SettingItem icon={sounds ? Volume2 : VolumeX} label="Notification sounds" toggle toggleValue={sounds} onClick={toggleSounds} />
        <SettingItem
          icon={Bell}
          label={
            <>
              Background alerts{' '}
              {notifPerm === 'denied' && (
                <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full ml-1">
                  BLOCKED
                </span>
              )}
            </>
          }
          toggle
          toggleValue={alerts}
          onClick={toggleAlerts}
        />
        <SettingItem
          icon={Bell}
          label="Medication schedule reminders"
          toggle
          toggleValue={settings.reminders.meds}
          onClick={() => saveSettings({ reminders: { ...settings.reminders, meds: !settings.reminders.meds } })}
        />
        <div className={`${card} p-4 flex items-center justify-between gap-4`}>
          <div>
            <div className="font-medium text-sm">Posture check interval</div>
            <div className="text-xs text-[#88909f]">Nudge if no posture log in N minutes</div>
          </div>
          <select
            className="bg-[#f0f4fc] dark:bg-gray-700 rounded-xl px-3 py-2 text-sm font-bold"
            value={settings.reminders.postureIntervalMin}
            onChange={(e) => saveSettings({ reminders: { ...settings.reminders, postureIntervalMin: Number(e.target.value) } })}
            aria-label="Posture check interval"
          >
            <option value={0}>Off</option>
            <option value={30}>Every 30m</option>
            <option value={45}>Every 45m</option>
            <option value={60}>Every 60m</option>
            <option value={90}>Every 90m</option>
          </select>
        </div>
        <div className={`${card} p-4 space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Stretch reminder times (HH:MM)</span>
            <button type="button" onClick={handleTestNotif} className="text-xs font-bold text-[#0051ae] hover:underline">
              Send test notification
            </button>
          </div>
          <TextInput
            value={settings.reminders.stretchTimes.join(', ')}
            placeholder="09:00, 15:00, 20:00"
            onChange={(e) => {
              const stretchTimes = e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter((s) => /^\d{2}:\d{2}$/.test(s));
              saveSettings({ reminders: { ...settings.reminders, stretchTimes } });
            }}
          />
          {testFeedback && <p className="text-xs font-semibold text-[#0051ae]">{testFeedback}</p>}
        </div>
      </div>

      {/* Data & Security (from kc-rhythm) */}
      <SectionTitle>Data &amp; security</SectionTitle>
      <div className="space-y-2">
        <SettingItem icon={Download} label="Export data (CSV)" value="Filterable" onClick={() => setExportOpen(true)} />
        <SettingItem icon={Lock} label="Change password" onClick={() => setPasswordOpen(true)} />
        <SettingItem
          icon={ShieldCheck}
          label="Multi-factor authentication"
          value={
            profile?.mfaEnabled ? (
              <span className="text-emerald-600 font-bold text-xs">ENABLED</span>
            ) : (
              <span className="text-[#88909f] text-xs">OFF</span>
            )
          }
          onClick={() => {
            setMfaError('');
            setMfaSuccess('');
            setMfaCode('');
            if (!profile?.mfaEnabled) setMfaSecret(generateSecret());
            setMfaOpen(true);
          }}
        />
        <SettingItem icon={Shield} label="IP security log" onClick={onOpenSecurityLog} />
        <SettingItem icon={LogOut} label="Sign out" danger onClick={logout} />
      </div>

      {/* ---- Modals ---- */}
      <MedicalModal open={medicalOpen} onClose={() => setMedicalOpen(false)} />
      <GoalsModal open={goalsOpen} onClose={() => setGoalsOpen(false)} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <PasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} onSave={changePassword} />

      {/* Notification Blocked Guidance Modal (from kc-rhythm) */}
      <Modal open={notifGuideOpen} onClose={() => setNotifGuideOpen(false)} title="Enable notifications">
        <p className="text-sm text-[#424753] dark:text-gray-300 mb-4">
          Browser notifications are currently blocked for this site. Click the lock/tune icon in your address bar, allow{' '}
          <b>Notifications</b>, reload the tab, and toggle Background Alerts back on.
        </p>
        <button type="button" className={btnPrimary + ' w-full'} onClick={() => setNotifGuideOpen(false)}>
          Got it
        </button>
      </Modal>

      {/* MFA Modal (ported from kc-rhythm) */}
      <Modal
        open={mfaOpen}
        onClose={() => {
          setMfaOpen(false);
          setShowBackupCodes(false);
        }}
        title={showBackupCodes ? 'MFA backup codes' : profile?.mfaEnabled ? 'Disable MFA' : 'Set up MFA'}
      >
        {showBackupCodes ? (
          <div className="space-y-4">
            <p className="text-sm text-[#424753] dark:text-gray-300">
              Save these one-time recovery codes somewhere safe. Each code can be used once if you lose your authenticator app.
            </p>
            <div className="grid grid-cols-2 gap-2 bg-[#f0f4fc] dark:bg-gray-700 p-4 rounded-2xl font-mono text-sm font-bold text-center">
              {backupCodes.map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
            <button
              type="button"
              className={btnPrimary + ' w-full'}
              onClick={() => {
                setMfaOpen(false);
                setShowBackupCodes(false);
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {!profile?.mfaEnabled && (
              <>
                <p className="text-sm text-[#424753] dark:text-gray-300">
                  Add this secret key to your authenticator app (Google Authenticator, 1Password, Authy):
                </p>
                <div className="bg-[#f0f4fc] dark:bg-gray-700 p-3 rounded-xl font-mono font-bold text-center tracking-widest select-all">
                  {mfaSecret}
                </div>
              </>
            )}
            <Field label="6-digit code from authenticator">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88909f]" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={inputCls + ' pl-11 font-mono tracking-widest text-center text-lg'}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                />
              </div>
            </Field>
            {mfaError && (
              <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {mfaError}
              </p>
            )}
            {mfaSuccess && <p className="text-xs font-bold text-emerald-600">{mfaSuccess}</p>}
            <button
              type="button"
              disabled={savingMfa || mfaCode.length !== 6}
              className={btnPrimary + ' w-full'}
              onClick={async () => {
                if (!user) return;
                setMfaError('');
                setSavingMfa(true);
                try {
                  if (profile?.mfaEnabled) {
                    const ok = await verifyTOTP(mfaCode, profile.mfaSecret || '');
                    if (!ok) return setMfaError('Invalid code.');
                    await updateUserProfileMfa(user.uid, false);
                    setProfile((p) => (p ? { ...p, mfaEnabled: false, mfaSecret: '' } : p));
                    setMfaSuccess('MFA disabled.');
                  } else {
                    const ok = await verifyTOTP(mfaCode, mfaSecret);
                    if (!ok) return setMfaError('Invalid code. Check your authenticator clock.');
                    const codes = generateBackupCodes();
                    const hashes = await Promise.all(codes.map(hashBackupCode));
                    await updateUserProfileMfa(user.uid, true, mfaSecret, hashes);
                    localStorage.setItem(`mfa_verified_${user.uid}`, 'true');
                    setProfile((p) => (p ? { ...p, mfaEnabled: true, mfaSecret } : p));
                    setBackupCodes(codes);
                    setShowBackupCodes(true);
                  }
                } finally {
                  setSavingMfa(false);
                }
              }}
            >
              {savingMfa ? <Loader2 className="w-4 h-4 animate-spin" /> : profile?.mfaEnabled ? 'Disable MFA' : 'Verify & Enable'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MedicalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, saveSettings } = useAppData();
  const [side, setSide] = useState<Side | ''>(settings.medical.affectedSide ?? '');
  const [onset, setOnset] = useState(settings.medical.onsetDate ?? '');
  const [diagnosis, setDiagnosis] = useState(settings.medical.diagnosis ?? '');
  const [clinician, setClinician] = useState(settings.medical.clinician ?? '');

  useEffect(() => {
    if (!open) return;
    setSide(settings.medical.affectedSide ?? '');
    setOnset(settings.medical.onsetDate ?? '');
    setDiagnosis(settings.medical.diagnosis ?? '');
    setClinician(settings.medical.clinician ?? '');
  }, [open, settings.medical]);

  return (
    <Modal open={open} onClose={onClose} title="Medical profile">
      <div className="space-y-4">
        <Field label="Affected side">
          <Chips
            options={[
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
              { value: 'both', label: 'Both' },
            ]}
            value={side}
            onChange={(v) => setSide(v)}
          />
        </Field>
        <Field label="Sciatica onset date">
          <TextInput type="date" value={onset} onChange={(e) => setOnset(e.target.value)} />
        </Field>
        <Field label="Diagnosis / notes">
          <TextInput value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. L5-S1 disc herniation" />
        </Field>
        <Field label="Clinician / physio">
          <TextInput value={clinician} onChange={(e) => setClinician(e.target.value)} placeholder="Optional" />
        </Field>
        <button
          type="button"
          className={btnPrimary + ' w-full'}
          onClick={() => {
            saveSettings({ medical: { affectedSide: side, onsetDate: onset, diagnosis, clinician } });
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

function GoalsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, saveSettings } = useAppData();
  const [weight, setWeight] = useState(settings.goals.targetWeight ? String(settings.goals.targetWeight) : '');
  const [stretch, setStretch] = useState(String(settings.goals.stretchMinutesPerDay));
  const [posture, setPosture] = useState(String(settings.goals.postureChecksPerDay));

  useEffect(() => {
    if (!open) return;
    setWeight(settings.goals.targetWeight ? String(settings.goals.targetWeight) : '');
    setStretch(String(settings.goals.stretchMinutesPerDay));
    setPosture(String(settings.goals.postureChecksPerDay));
  }, [open, settings.goals]);

  return (
    <Modal open={open} onClose={onClose} title="Health goals">
      <div className="space-y-4">
        <Field label={`Target weight (${settings.weightUnit}, optional)`}>
          <TextInput type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
        <Field label="Daily stretch minutes">
          <TextInput type="number" min="1" value={stretch} onChange={(e) => setStretch(e.target.value)} />
        </Field>
        <Field label="Daily posture checks">
          <TextInput type="number" min="1" value={posture} onChange={(e) => setPosture(e.target.value)} />
        </Field>
        <button
          type="button"
          className={btnPrimary + ' w-full'}
          onClick={() => {
            saveSettings({
              goals: {
                targetWeight: weight ? Number(weight) : null,
                stretchMinutesPerDay: Math.max(1, Number(stretch) || 15),
                postureChecksPerDay: Math.max(1, Number(posture) || 6),
              },
            });
            onClose();
          }}
        >
          Save goals
        </button>
      </div>
    </Modal>
  );
}

function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { uid } = useAppData();
  const [type, setType] = useState<LogType | 'all'>('all');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const rows = await fetchAllLogs(uid, type === 'all' ? {} : { type });
      const csv = buildCsv(rows);
      downloadCsv(`kc-spineguard-${type}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Export data (CSV)">
      <div className="space-y-4">
        <Field label="What to export">
          <Chips
            options={[{ value: 'all', label: 'All logs' }, ...LOG_ORDER.map((t) => ({ value: t, label: LOG_META[t].label }))]}
            value={type}
            onChange={setType}
          />
        </Field>
        <button type="button" disabled={busy} onClick={run} className={btnPrimary + ' w-full'}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download CSV
        </button>
      </div>
    </Modal>
  );
}

function PasswordModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (p: string) => Promise<void> }) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (p1.length < 6) return setErr('Password must be at least 6 characters.');
    if (p1 !== p2) return setErr('Passwords do not match.');
    setBusy(true);
    try {
      await onSave(p1);
      setP1('');
      setP2('');
      onClose();
    } catch (ex: any) {
      setErr(ex.message || 'Failed to update password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Change password">
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password">
          <TextInput type="password" value={p1} onChange={(e) => setP1(e.target.value)} required />
        </Field>
        <Field label="Confirm password">
          <TextInput type="password" value={p2} onChange={(e) => setP2(e.target.value)} required />
        </Field>
        {err && <p className="text-xs font-bold text-red-600">{err}</p>}
        <button type="submit" disabled={busy} className={btnPrimary + ' w-full'}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update password'}
        </button>
      </form>
    </Modal>
  );
}
