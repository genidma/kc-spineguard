// Shared UI primitives in kc-rhythm's visual language.
import type { ReactNode, ComponentType, InputHTMLAttributes } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const card = 'bg-white dark:bg-gray-800 rounded-[1.5rem] border border-[#e4e8f0] dark:border-gray-700 shadow-sm';
export const inputCls =
  'w-full bg-[#f0f4fc] dark:bg-gray-700 border-2 border-transparent rounded-2xl py-3 px-4 text-[#171c22] dark:text-white focus:border-[#0969da] focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-medium placeholder:text-[#88909f]';
export const labelCls = 'block text-[10px] font-bold text-[#424753] dark:text-gray-300 uppercase tracking-wider mb-2 ml-1';
export const btnPrimary =
  'bg-gradient-to-r from-[#0051ae] to-[#0969da] hover:opacity-90 text-white font-bold py-3.5 px-5 rounded-2xl transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50';
export const btnGhost =
  'bg-[#f0f4fc] dark:bg-gray-700 hover:bg-[#e4e8f0] dark:hover:bg-gray-600 text-[#0051ae] dark:text-white font-bold py-3 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2';

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#171c22] dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-[#424753] dark:text-gray-400 font-medium mt-1">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-black uppercase tracking-widest text-[#424753] dark:text-gray-300 mb-3 mt-6">{children}</h3>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}

export function painColor(v: number) {
  if (v <= 2) return '#10b981';
  if (v <= 4) return '#84cc16';
  if (v <= 6) return '#eab308';
  if (v <= 8) return '#f97316';
  return '#dc2626';
}

export function Scale({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  marker,
  lowLabel,
  highLabel,
  testId,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  marker?: number;
  lowLabel?: string;
  highLabel?: string;
  testId?: string;
}) {
  const color = max === 10 ? painColor(value) : '#0051ae';
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={labelCls + ' mb-0'}>{label}</label>
        <span className="text-2xl font-black tabular-nums" style={{ color }}>
          {value}
          <span className="text-xs text-[#88909f] font-bold">/{max}</span>
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          data-testid={testId}
          onChange={(e) => onChange(Number(e.target.value))}
          className={max === 10 ? 'pain-range w-full' : 'w-full accent-[#0051ae]'}
          aria-label={label}
        />
        {marker !== undefined && (
          <div
            className="absolute -top-1 h-5 w-0.5 bg-[#171c22] dark:bg-white pointer-events-none"
            style={{ left: `calc(${((marker - min) / (max - min)) * 100}% )` }}
            title={`Threshold ${marker}`}
          />
        )}
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-[#88909f] mt-1">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
  multi,
}: {
  options: { value: T; label: string }[];
  value: T[] | T;
  onChange: (v: any) => void;
  multi?: boolean;
}) {
  const selected = Array.isArray(value) ? value : [value];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            type="button"
            key={o.value}
            aria-pressed={on}
            onClick={() => {
              if (multi) onChange(on ? selected.filter((x) => x !== o.value) : [...selected, o.value]);
              else onChange(o.value);
            }}
            className={`px-3.5 py-2 rounded-full text-sm font-bold transition-colors border ${
              on
                ? 'bg-[#0051ae] text-white border-[#0051ae]'
                : 'bg-white dark:bg-gray-800 text-[#424753] dark:text-gray-300 border-[#e4e8f0] dark:border-gray-600 hover:border-[#0969da]'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`w-10 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-[#0051ae]' : 'bg-[#e4e8f0] dark:bg-gray-600'}`}>
      <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
    </div>
  );
}

/** Settings row, ported from kc-rhythm ProfileView's SettingItem. */
export function SettingItem({
  icon: Icon,
  label,
  value,
  onClick,
  toggle,
  toggleValue,
  danger,
}: {
  icon: ComponentType<{ className?: string }>;
  label: ReactNode;
  value?: ReactNode;
  onClick?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl hover:bg-[#f0f4fc] dark:hover:bg-gray-700 transition-colors text-left"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 bg-[#f0f4fc] dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
          <Icon className={`w-5 h-5 ${danger ? 'text-red-600' : 'text-[#424753] dark:text-gray-300'}`} />
        </div>
        <span className={`font-medium truncate ${danger ? 'text-red-600' : 'text-[#171c22] dark:text-white'}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {toggle && <Toggle on={!!toggleValue} />}
        {value !== undefined && <span className="text-sm text-[#424753] dark:text-gray-300">{value}</span>}
      </div>
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label={title}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white dark:bg-gray-800 w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-[#171c22] dark:text-white">{title}</h3>
              <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-[#f0f4fc] dark:bg-gray-700 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Empty({ icon: Icon, title, hint }: { icon: ComponentType<{ className?: string }>; title: string; hint?: string }) {
  return (
    <div className="text-center py-10">
      <Icon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p className="text-sm font-semibold text-[#424753] dark:text-gray-400">{title}</p>
      {hint && <p className="text-xs text-[#88909f] mt-1">{hint}</p>}
    </div>
  );
}
