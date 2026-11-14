import { useEffect, useState } from 'react';
import {
  BookOpen,
  Clock,
  Home,
  Key,
  Loader2,
  Lock,
  Mail,
  Plus,
  ShieldCheck,
  TrendingUp,
  User,
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { AppDataProvider, applyTheme, cachedTheme } from './hooks/useAppData';
import { LogEditorProvider, useOpenLog } from './hooks/useLogEditor';
import { getUserProfile, updateUserProfileMfa } from './lib/profileService';
import { logSignInOnce } from './lib/securityLog';
import { LOG_META, LOG_ORDER } from './lib/logMeta';
import SyncStatus from './components/SyncStatus';
import { TodayView } from './components/TodayView';
import { HistoryView } from './components/HistoryView';
import { TrendsView } from './components/TrendsView';
import { LibraryView } from './components/LibraryView';
import { ProfileView } from './components/ProfileView';
import { SecurityLogView } from './components/SecurityLogView';
import { Field, Modal, TextInput, btnPrimary, card } from './components/ui';

type View = 'today' | 'history' | 'trends' | 'library' | 'profile' | 'security-log';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [mfaChecked, setMfaChecked] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    applyTheme(cachedTheme());
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setMfaChecked(true);
      setMfaVerified(false);
      setMfaSecret('');
      setMfaBackupCodes([]);
      return;
    }
    setMfaChecked(false);
    getUserProfile(user.uid)
      .then((profile) => {
        if (profile?.mfaEnabled) {
          setMfaSecret(profile.mfaSecret || '');
          setMfaBackupCodes(profile.mfaBackupCodes || []);
          setMfaVerified(localStorage.getItem(`mfa_verified_${user.uid}`) === 'true');
        } else {
          setMfaVerified(true);
        }
      })
      .catch(() => setMfaVerified(true))
      .finally(() => setMfaChecked(true));
  }, [user, loading]);

  useEffect(() => {
    if (user && mfaChecked && mfaVerified) {
      void logSignInOnce(user);
    }
  }, [user, mfaChecked, mfaVerified]);

  if (loading || (user && !mfaChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0051ae]" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <SyncStatus signedIn={false} />
        <AuthScreen />
      </>
    );
  }

  if (!mfaVerified) {
    return (
      <MfaGate
        uid={user.uid}
        secret={mfaSecret}
        backupCodes={mfaBackupCodes}
        onVerified={() => setMfaVerified(true)}
        onCancel={logout}
      />
    );
  }

  return (
    <AppDataProvider uid={user.uid}>
      <LogEditorProvider>
        <SyncStatus signedIn />
        <Shell />
      </LogEditorProvider>
    </AppDataProvider>
  );
}

function Shell() {
  const [view, setView] = useState<View>('today');
  const [pickerOpen, setPickerOpen] = useState(false);
  const openLog = useOpenLog();

  const navItems: { id: View; label: string; icon: any }[] = [
    { id: 'today', label: 'Today', icon: Home },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 bg-white dark:bg-gray-900 border-r border-[#e4e8f0] dark:border-gray-800 p-5 justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-8 px-2">
            <img src="/favicon.svg" alt="" className="w-8 h-8" />
            <div>
              <div className="font-black text-lg tracking-tight leading-none">kc-spineguard</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#88909f] mt-0.5">Sciatica log</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={`${btnPrimary} w-full mb-6`}
            data-testid="desktop-log-btn"
          >
            <Plus className="w-5 h-5" /> Log entry
          </button>
          <nav className="space-y-1">
            {navItems.map((n) => {
              const active = view === n.id || (n.id === 'profile' && view === 'security-log');
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setView(n.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                    active
                      ? 'bg-[#f0f4fc] dark:bg-gray-800 text-[#0051ae] dark:text-white'
                      : 'text-[#424753] dark:text-gray-400 hover:bg-[#f7f9ff] dark:hover:bg-gray-800/50'
                  }`}
                >
                  <n.icon className="w-5 h-5" />
                  {n.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 px-4 pt-6 pb-28 md:pb-12 max-w-4xl mx-auto w-full">
        {view === 'today' && <TodayView />}
        {view === 'history' && <HistoryView />}
        {view === 'trends' && <TrendsView />}
        {view === 'library' && <LibraryView />}
        {view === 'profile' && <ProfileView onOpenSecurityLog={() => setView('security-log')} />}
        {view === 'security-log' && <SecurityLogView onBack={() => setView('profile')} />}
      </main>

      {/* Mobile bottom bar with center Log (+) button */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#f7f9ff]/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-[#e4e8f0] dark:border-gray-800 px-2 pt-2"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around">
          {navItems.slice(0, 2).map((n) => (
            <MobileTab key={n.id} item={n} active={view === n.id} onClick={() => setView(n.id)} />
          ))}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label="Log entry"
            data-testid="mobile-log-btn"
            className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-r from-[#0051ae] to-[#0969da] text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
          {navItems.slice(2, 4).map((n) => (
            <MobileTab key={n.id} item={n} active={view === n.id} onClick={() => setView(n.id)} />
          ))}
          <MobileTab
            item={navItems[4]}
            active={view === 'profile' || view === 'security-log'}
            onClick={() => setView('profile')}
          />
        </div>
      </nav>

      {/* Log type picker modal */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="What would you like to log?">
        <div className="grid grid-cols-3 gap-2.5">
          {LOG_ORDER.map((t) => {
            const M = LOG_META[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  openLog(t);
                }}
                className={`${card} p-3 flex flex-col items-center gap-2 hover:bg-[#f0f4fc] dark:hover:bg-gray-700 transition-colors`}
              >
                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${M.bg}`}>
                  <M.icon className="w-5 h-5" style={{ color: M.color }} />
                </span>
                <span className="text-xs font-bold text-center">{M.label}</span>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}

function MobileTab({ item, active, onClick }: { item: { label: string; icon: any }; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold ${
        active ? 'text-[#0051ae] dark:text-white' : 'text-[#88909f]'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{item.label}</span>
    </button>
  );
}

// ============================================================================
// Auth & MFA screens (ported from kc-rhythm)
// ============================================================================
function AuthScreen() {
  const { login, signup, sendPasswordReset, error, setError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMsg('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else if (mode === 'signup') await signup(email, password);
      else {
        await sendPasswordReset(email);
        setResetMsg('Password reset email sent. Check your inbox.');
      }
    } catch {
      /* error set by hook */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className={`${card} w-full max-w-md p-8`}>
        <div className="flex items-center gap-3 mb-6">
          <img src="/favicon.svg" alt="" className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-black tracking-tight">kc-spineguard</h1>
            <p className="text-xs text-[#424753] dark:text-gray-400">
              {mode === 'login' ? 'Sign in to sync your logs' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88909f]" />
              <TextInput
                type="email"
                required
                className="pl-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                data-testid="auth-email"
              />
            </div>
          </Field>

          {mode !== 'reset' && (
            <Field label="Password">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88909f]" />
                <TextInput
                  type="password"
                  required
                  minLength={6}
                  className="pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  data-testid="auth-password"
                />
              </div>
            </Field>
          )}

          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          {resetMsg && <p className="text-xs font-bold text-emerald-600">{resetMsg}</p>}

          <button type="submit" disabled={busy} className={btnPrimary + ' w-full'} data-testid="auth-submit">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center text-xs font-bold">
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => { setMode('signup'); setError(null); }} className="text-[#0051ae] hover:underline" data-testid="switch-to-signup">
                Need an account? Sign up
              </button>
              <button type="button" onClick={() => { setMode('reset'); setError(null); }} className="text-[#88909f] hover:underline">
                Forgot password?
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button type="button" onClick={() => { setMode('login'); setError(null); }} className="text-[#0051ae] hover:underline">
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MfaGate({
  uid,
  secret,
  backupCodes,
  onVerified,
  onCancel,
}: {
  uid: string;
  secret: string;
  backupCodes: string[];
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [useBackup, setUseBackup] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (useBackup) {
        const { hashBackupCode } = await import('./lib/totp');
        const h = await hashBackupCode(code);
        const idx = backupCodes.indexOf(h);
        if (idx === -1) return setError('Invalid backup code.');
        const remaining = backupCodes.filter((_, i) => i !== idx);
        await updateUserProfileMfa(uid, false, undefined, remaining);
        localStorage.setItem(`mfa_verified_${uid}`, 'true');
        onVerified();
      } else {
        const { verifyTOTP } = await import('./lib/totp');
        const ok = await verifyTOTP(code, secret);
        if (!ok) return setError('Invalid verification code.');
        localStorage.setItem(`mfa_verified_${uid}`, 'true');
        onVerified();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={`${card} w-full max-w-md p-8 text-center`}>
        <ShieldCheck className="w-12 h-12 text-[#0051ae] mx-auto mb-3" />
        <h2 className="text-xl font-black mb-1">Two-Factor Authentication</h2>
        <p className="text-xs text-[#424753] dark:text-gray-400 mb-6">
          {useBackup ? 'Enter one of your backup recovery codes.' : 'Enter the 6-digit code from your authenticator app.'}
        </p>
        <form onSubmit={submit} className="space-y-4 text-left">
          <Field label={useBackup ? 'Backup code' : 'Verification code'}>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88909f]" />
              <TextInput
                className="pl-11 text-center font-mono tracking-widest text-lg"
                value={code}
                onChange={(e) => setCode(useBackup ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ''))}
                maxLength={useBackup ? 12 : 6}
                placeholder={useBackup ? 'XXXX-XXXX' : '000000'}
              />
            </div>
          </Field>
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className={btnPrimary + ' w-full'}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-2 text-xs font-bold">
          <button type="button" onClick={() => { setUseBackup((b) => !b); setCode(''); setError(''); }} className="text-[#0051ae]">
            {useBackup ? 'Use authenticator code' : 'Lost device? Use a backup code'}
          </button>
          <button type="button" onClick={onCancel} className="text-[#88909f]">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
