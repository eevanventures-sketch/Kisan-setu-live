import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Register self-contained PWA service worker & clean up any broken legacy Workbox SW
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  (async () => {
    try {
      const res = await fetch('./sw.js', { cache: 'no-store' });
      const text = res.ok ? await res.text() : '';
      if (!text.includes('KISAN_SETU_SW_V')) {
        // Legacy Workbox SW detected (e.g. broken /index.html fallback on GitHub Pages) -> unregister cleanly
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        return;
      }

      const hadController = Boolean(navigator.serviceWorker.controller);
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || reloaded) return;
        const guardKey = 'kisan_setu_sw_reloaded_v10';
        try {
          if (sessionStorage.getItem(guardKey)) return;
          sessionStorage.setItem(guardKey, '1');
        } catch {
          // ignore storage restrictions
        }
        reloaded = true;
        window.location.reload();
      });

      const reg = await navigator.serviceWorker.register('./sw.js', {
        scope: './',
        updateViaCache: 'none',
      });
      reg.update().catch(() => {});
    } catch (e) {
      console.warn('PWA serviceWorker setup:', e);
    }
  })();
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || String(error) };
  }

  componentDidCatch(error: any, info: any) {
    console.error('Kisan Setu ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-emerald-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl mb-4">🌾</div>
          <h1 className="text-2xl font-black mb-2">किसान सेतु लोड हो रहा है...</h1>
          <p className="text-sm opacity-90 mb-4 max-w-sm">
            पेज को ताज़ा करने के लिए नीचे दिए गए बटन को दबाएं।
          </p>
          <button
            onClick={() => {
              try {
                localStorage.clear();
              } catch (e) {
                // ignore
              }
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-xl bg-amber-400 text-emerald-950 font-black text-sm shadow-md active:scale-95 cursor-pointer"
          >
            🔄 ऐप पुनः लोड करें
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
