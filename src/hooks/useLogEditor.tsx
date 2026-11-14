import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AnyLog, LogType } from '../lib/types';
import { LogEditor } from '../components/LogEditor';

type Open = (type: LogType, existing?: AnyLog, prefill?: Record<string, unknown>) => void;
const Ctx = createContext<Open>(() => {});

export function LogEditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; type: LogType; existing?: AnyLog; prefill?: Record<string, unknown> }>({
    open: false,
    type: 'pain',
  });
  return (
    <Ctx.Provider value={(type, existing, prefill) => setState({ open: true, type, existing, prefill })}>
      {children}
      <LogEditor
        open={state.open}
        type={state.type}
        existing={state.existing}
        prefill={state.prefill as any}
        onClose={() => setState((s) => ({ ...s, open: false }))}
      />
    </Ctx.Provider>
  );
}

export const useOpenLog = () => useContext(Ctx);
