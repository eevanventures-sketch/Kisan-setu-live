/**
 * Helper to resolve API endpoints seamlessly across:
 * 1. Full-stack Render / Railway / Cloud Run / localhost origin (relative `/api/...`)
 * 2. Static GitHub Pages or installed APK/PWA wrapper (custom `?api=` backend or fallback)
 */
const DEFAULT_CLOUD_BACKEND =
  'https://ais-pre-vjfknnajfcq5ocgopdiad7-746994231965.asia-northeast1.run.app';

const STORAGE_BACKEND_KEY = 'kisan_setu_backend_url';

function readCustomBackendUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = (params.get('api') || params.get('backend') || '').trim();
    if (paramUrl && /^https?:\/\//i.test(paramUrl)) {
      const cleaned = paramUrl.replace(/\/$/, '');
      localStorage.setItem(STORAGE_BACKEND_KEY, cleaned);
      return cleaned;
    }
    const stored = (localStorage.getItem(STORAGE_BACKEND_KEY) || '').trim();
    if (stored && /^https?:\/\//i.test(stored)) {
      return stored.replace(/\/$/, '');
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function isStaticHostedApp(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return (
    host.endsWith('github.io') ||
    (host === 'localhost' && window.location.port !== '3000') ||
    window.location.protocol === 'file:'
  );
}

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const customBackend = readCustomBackendUrl();
  if (customBackend) {
    return `${customBackend}${normalizedPath}`;
  }
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (envBase && envBase.trim()) {
    return `${envBase.replace(/\/$/, '')}${normalizedPath}`;
  }
  if (isStaticHostedApp()) {
    return `${DEFAULT_CLOUD_BACKEND}${normalizedPath}`;
  }
  return normalizedPath;
}

export async function fetchApi(path: string, init?: RequestInit, timeoutMs = 20000): Promise<Response> {
  const url = getApiUrl(path);
  const controller = new AbortController();
  let didTimeout = false;

  const abortWithReason = (reason: string) => {
    try {
      controller.abort(new Error(reason));
    } catch {
      controller.abort();
    }
  };

  const timer = setTimeout(() => {
    didTimeout = true;
    abortWithReason('REQUEST_TIMEOUT');
  }, timeoutMs);

  const externalSignal = init?.signal;
  const onExternalAbort = () => abortWithReason('REQUEST_CANCELLED');
  if (externalSignal) {
    if (externalSignal.aborted) {
      abortWithReason('REQUEST_CANCELLED');
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (didTimeout) {
      throw new Error('नेटवर्क धीमा होने के कारण सर्वर से समय पर जवाब नहीं मिला। कृपया पुनः प्रयास करें।');
    }
    const msg = String(err?.message || err || '');
    if (err?.name === 'AbortError' || /signal is aborted|aborted/i.test(msg)) {
      throw new Error('अनुरोध बीच में रुक गया। कृपया अपना इंटरनेट जाँचकर दोबारा प्रयास करें।');
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}
