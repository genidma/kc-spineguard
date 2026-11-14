import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found.');
const root = createRoot(rootEl);

function renderError(message: string) {
  root.render(
    <StrictMode>
      <div className="min-h-screen bg-[#f7f9ff] px-6 py-16 text-[#171c22]">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-[#e4e8f0] bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-red-700">Startup Error</p>
          <h1 className="mt-2 text-2xl font-black">Missing Firebase app configuration</h1>
          <p className="mt-3 text-sm text-[#424753]">
            Set the <code>VITE_FIREBASE_*</code> environment variables (or run with <code>VITE_USE_EMULATORS=true</code> for local testing).
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-[#171c22] p-4 text-xs text-white">{message}</pre>
        </div>
      </div>
    </StrictMode>,
  );
}

async function bootstrap() {
  try {
    const { default: App } = await import('./App.tsx');
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('SW registration skipped:', e));
    }
  } catch (err) {
    renderError(err instanceof Error ? err.message : 'Unknown startup error');
  }
}

void bootstrap();
