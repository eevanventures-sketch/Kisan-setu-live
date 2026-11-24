import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const PORT =
  process.env.NODE_ENV === 'production' && process.env.PORT
    ? Number(process.env.PORT)
    : 3000;

// Security headers (iframe-compatible for AI Studio preview & Play Store TWA)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
  next();
});

app.use(express.json({ limit: '35mb' }));

// Lightweight in-memory sliding-window IP rate limiter
function createRateLimiter(maxRequests: number, windowMs: number, message: string) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = String(req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 64);
    const now = Date.now();

    if (hits.size > 5000) {
      for (const [k, v] of hits.entries()) {
        if (v.resetAt <= now) hits.delete(k);
      }
    }

    const current = hits.get(ip);
    if (!current || current.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterSeconds: retryAfterSec,
      });
    }

    current.count += 1;
    return next();
  };
}

const aiRateLimiter = createRateLimiter(
  25,
  60 * 1000,
  'बहुत अधिक AI अनुरोध आ रहे हैं। कृपया 1 मिनट बाद पुनः प्रयास करें।'
);

const uploadRateLimiter = createRateLimiter(
  15,
  5 * 60 * 1000,
  'बहुत जल्दी-जल्दी पोस्ट अपलोड हो रही हैं। कृपया कुछ मिनट बाद पुनः प्रयास करें।'
);

// Play Store Digital Asset Links endpoint for TWA (Trusted Web Activity)
app.get('/.well-known/assetlinks.json', (_req, res) => {
  const packageName = (process.env.ANDROID_PACKAGE_NAME || '').trim();
  const sha256Fingerprint = (process.env.TWA_SHA256_FINGERPRINT || '').trim();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!packageName || !sha256Fingerprint) {
    return res.json([]);
  }
  return res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: [sha256Fingerprint],
      },
    },
  ]);
});

// CORS headers so installed PWA / GitHub Pages builds can call live /api/* endpoints
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  const isAllowedOrigin =
    !origin ||
    origin === 'https://eevanventures-sketch.github.io' ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    /^https:\/\/[a-z0-9-]+\.asia-northeast1\.run\.app$/i.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.a\.run\.app$/i.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.onrender\.com$/i.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/i.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.koyeb\.app$/i.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin) ||
    /^https:\/\/[a-z0-9-]+\.web\.app$/i.test(origin);

  if (isAllowedOrigin && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Mobile-friendly download page using authenticated fetch + Blob URL
// Solves Android Chrome DownloadManager failing on auth-gated proxy URLs
app.get('/dl', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html lang="hi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>किसान सेतु - फ़ाइल डाउनलोड</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f0fdf4; color: #052e16; margin: 0; padding: 20px; }
    .card { max-width: 460px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #bbf7d0; }
    h1 { font-size: 20px; margin: 0 0 8px; color: #166534; }
    p { font-size: 14px; line-height: 1.5; color: #374151; margin: 0 0 16px; }
    .btn { display: block; width: 100%; box-sizing: border-box; border: none; border-radius: 12px; padding: 14px 16px; font-size: 16px; font-weight: 700; cursor: pointer; text-align: center; text-decoration: none; margin-bottom: 12px; }
    .btn-green { background: #166534; color: #fff; }
    .btn-amber { background: #f59e0b; color: #052e16; }
    .btn-dark { background: #111827; color: #fff; }
    .btn:disabled { opacity: 0.6; }
    .status { font-size: 13px; font-weight: 600; color: #15803d; margin: -6px 0 12px; min-height: 18px; }
    .step { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; font-size: 13px; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🌾 किसान सेतु — GitHub फ़ाइलें</h1>
    <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:10px;padding:10px 12px;font-size:13px;color:#78350f;margin-bottom:14px;">
      <b>⚠️ बहुत ज़रूरी नियम:</b> डाउनलोड करने से पहले अपने फोन के <b>Downloads</b> फ़ोल्डर से पुरानी <b>index.html, index.js, index.css, sw.js</b> फ़ाइलें <b>डिलीट</b> कर दें! वरना Chrome नई फ़ाइल का नाम <b>index (1).js</b> रख देता है और वेबसाइट पर पुराना ऐप ही चलता रहता है।
    </div>
    <p>नीचे दिए चारों बटन दबाकर फ़ाइलें अपने फोन में सेव करें, फिर GitHub पर अपलोड करें:</p>

    <button id="btnHtml" class="btn btn-green" onclick="downloadBlob('/dl/index.html', 'index.html', 'btnHtml', 'statusHtml')">
      ⬇️ 1. index.html डाउनलोड करें (ज़रूरी!)
    </button>
    <div id="statusHtml" class="status"></div>

    <button id="btnJs" class="btn btn-green" onclick="downloadBlob('/dl/index.js', 'index.js', 'btnJs', 'statusJs')">
      ⬇️ 2. index.js डाउनलोड करें
    </button>
    <div id="statusJs" class="status"></div>

    <button id="btnCss" class="btn btn-green" onclick="downloadBlob('/dl/index.css', 'index.css', 'btnCss', 'statusCss')">
      ⬇️ 3. index.css डाउनलोड करें
    </button>
    <div id="statusCss" class="status"></div>

    <button id="btnSw" class="btn btn-green" onclick="downloadBlob('/dl/sw.js', 'sw.js', 'btnSw', 'statusSw')">
      ⬇️ 4. sw.js डाउनलोड करें (ऑफ़लाइन/ऐप के लिए)
    </button>
    <div id="statusSw" class="status"></div>

    <a class="btn btn-amber" href="https://github.com/eevanventures-sketch/Kisan-setu/upload/main" target="_blank" rel="noopener">
      📤 5. GitHub पर अपलोड करें
    </a>

    <div class="step">
      <strong>निर्देश:</strong><br/>
      1. Downloads से पुरानी index फ़ाइलें डिलीट करें।<br/>
      2. ऊपर के चारों हरे बटन दबाकर <b>index.html, index.js, index.css, sw.js</b> डाउनलोड करें (किसी के नाम में <b>(1)</b> न हो)।<br/>
      3. पीला बटन दबाकर GitHub खोलें और चारों फ़ाइलें चुनकर नीचे हरा <b>Commit changes</b> बटन दबा दें।
    </div>
  </div>

  <script>
    async function downloadBlob(url, filename, btnId, statusId) {
      const btn = document.getElementById(btnId);
      const status = document.getElementById(statusId);
      const origText = btn.innerText;
      try {
        btn.disabled = true;
        btn.innerText = '⏳ डाउनलोड हो रहा है...';
        status.style.color = '#1d4ed8';
        status.innerText = 'फ़ाइल तैयार की जा रही है...';
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
        status.style.color = '#15803d';
        status.innerText = '✅ ' + filename + ' आपके Downloads में सेव हो गई!';
      } catch (err) {
        status.style.color = '#dc2626';
        status.innerText = '⚠️ त्रुटि: ' + err.message + ' — कृपया ऊपर दाहिने 3 बिंदी से "Open in Chrome" चुनें।';
      } finally {
        btn.disabled = false;
        btn.innerText = origText;
      }
    }
  </script>
</body>
</html>`);
});

// Force browser download (instead of opening code inline) for mobile users
// Must be registered BEFORE express.static('public') so static middleware doesn't serve it inline
app.get('/dl/:filename', (req, res) => {
  const allowedFiles: Record<string, string> = {
    'index.html': path.resolve('.', 'public', 'dl', 'index.html'),
    'index.js': path.resolve('.', 'public', 'dl', 'index.js'),
    'index.css': path.resolve('.', 'public', 'dl', 'index.css'),
    'sw.js': path.resolve('.', 'public', 'sw.js'),
    'kisan-setu-app.zip': path.resolve('.', 'public', 'kisan-setu-app.zip'),
  };

  const filePath = allowedFiles[req.params.filename];
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const stat = fs.statSync(filePath);
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', stat.size.toString());
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(filePath).pipe(res);
});

app.use(express.static(path.resolve('.', 'public')));

// Health check endpoint for uptime monitors and service worker
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Kisan Setu',
    time: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Official Government Portals metadata & live sync status
app.get('/api/mandi/sources', (_req, res) => {
  res.json({
    state: 'मध्य प्रदेश',
    sources: [
      {
        name: 'मध्य प्रदेश राज्य कृषि विपणन (मंडी) बोर्ड, भोपाल',
        portal: 'mpmandiboard.gov.in',
        url: 'https://mpmandiboard.gov.in',
        description: 'प्रदेश की समस्त 259 कृषि उपज मंडियों एवं उपमंडियों के आधिकारिक दैनिक आवक एवं भाव पत्रक।',
        updateCycle: 'प्रतिदिन सायं 5:30 बजे (नीलामी समाप्ति उपरांत)',
        isOfficial: true,
      },
      {
        name: 'राष्ट्रीय कृषि विपणन सूचना तंत्र (Agmarknet)',
        portal: 'agmarknet.gov.in',
        url: 'https://agmarknet.gov.in',
        description: 'कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार का आधिकारिक दैनिक थोक भाव डेटाबेस।',
        updateCycle: 'दैनिक आवक अनुसार रियल-टाइम',
        isOfficial: true,
      },
      {
        name: 'ई-मंडी एवं सौदा पत्रक पोर्टल (e-Krishi Mandi)',
        portal: 'ekrishimandi.mp.gov.in',
        url: 'https://ekrishimandi.mp.gov.in',
        description: 'मध्य प्रदेश शासन का ऑनलाइन अनुबंध एवं डिजिटल तौल पर्ची सिस्टम।',
        updateCycle: 'प्रत्येक नीलामी लॉट अनुसार',
        isOfficial: true,
      },
    ],
    lastSyncTime: 'स्थानीय सत्यापित रिकॉर्ड सक्रिय',
    syncStatus: 'READY',
  });
});

// Shared server-side patrak storage so 1 photo upload updates all users connected to this server
const SHARED_PATRAK_DIR = path.resolve('.', 'data');
const SHARED_PATRAK_FILE = path.join(SHARED_PATRAK_DIR, 'shared-patraks.json');

function readSharedPatraks(): Record<string, any> {
  try {
    if (!fs.existsSync(SHARED_PATRAK_FILE)) return {};
    const raw = fs.readFileSync(SHARED_PATRAK_FILE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function isServerRichPatrak(p: any): boolean {
  if (!p || !Array.isArray(p.rows) || p.rows.length === 0) return false;
  const cStr = String(p.totalContracts ?? '').trim();
  const hasContracts = cStr !== '' && cStr !== '-' && cStr !== '0';
  const rel = String(p.releaseTime || '');
  const isScannedOrOfficial =
    rel.includes('स्कैन') || rel.includes('कार्यालय') || rel.includes('सत्यापित') || rel.includes('मंडी समिति');
  const hasRowContracts = p.rows.some(
    (r: any) =>
      r &&
      r.contracts !== undefined &&
      r.contracts !== null &&
      String(r.contracts).trim() !== '-' &&
      Number(r.contracts) > 0
  );
  return hasContracts || isScannedOrOfficial || hasRowContracts;
}

function isEmbeddedOfficialPatrakKey(mandiId?: string, date?: string): boolean {
  return mandiId === 'mp-vidisha-ganjbasoda' && (date === '16-11-2026' || date === '23-11-2026');
}

function writeSharedPatrak(key: string, entry: any): boolean {
  try {
    if (!fs.existsSync(SHARED_PATRAK_DIR)) {
      fs.mkdirSync(SHARED_PATRAK_DIR, { recursive: true });
    }
    const all = readSharedPatraks();
    const existing = all[key];
    const incomingRich = isServerRichPatrak(entry);

    // Never allow a sparse Agmarknet scrape (totalContracts: '-') to overwrite a rich photo-scanned
    // or complete embedded official 18-crop Mandi Samiti sheet.
    if (!incomingRich) {
      if (isEmbeddedOfficialPatrakKey(entry?.mandiId, entry?.date)) {
        return false;
      }
      if (existing && isServerRichPatrak(existing)) {
        return false;
      }
    }

    all[key] = entry;
    fs.writeFileSync(SHARED_PATRAK_FILE, JSON.stringify(all, null, 2), 'utf-8');
    return true;
  } catch (err: any) {
    console.warn('Could not persist shared patrak:', err?.message);
    return false;
  }
}

app.get('/api/mandi/shared-patraks', (_req, res) => {
  const raw = readSharedPatraks();
  const filtered: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v && !isServerRichPatrak(v) && isEmbeddedOfficialPatrakKey(v.mandiId, v.date)) {
      continue;
    }
    filtered[k] = v;
  }
  res.json({ patraks: filtered });
});

// Shared server-side Kisan Bazaar listings & Reels media persistence
// Ensures every farmer/shopkeeper sees submitted ads & videos across devices even without Google Sign-In
const SHARED_BAZAAR_FILE = path.join(SHARED_PATRAK_DIR, 'bazaar-listings.json');
const SHARED_BAZAAR_MEDIA_DIR = path.join(SHARED_PATRAK_DIR, 'bazaar-media');

function ensureBazaarStorage(): void {
  if (!fs.existsSync(SHARED_PATRAK_DIR)) {
    fs.mkdirSync(SHARED_PATRAK_DIR, { recursive: true });
  }
  if (!fs.existsSync(SHARED_BAZAAR_MEDIA_DIR)) {
    fs.mkdirSync(SHARED_BAZAAR_MEDIA_DIR, { recursive: true });
  }
}

function readSharedBazaarListings(): any[] {
  try {
    if (!fs.existsSync(SHARED_BAZAAR_FILE)) return [];
    const raw = fs.readFileSync(SHARED_BAZAAR_FILE, 'utf-8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSharedBazaarListings(items: any[]): void {
  ensureBazaarStorage();
  fs.writeFileSync(SHARED_BAZAAR_FILE, JSON.stringify(items.slice(0, 80), null, 2), 'utf-8');
}

function getExtForMime(mimeType: string): string {
  const m = (mimeType || '').toLowerCase();
  if (m.includes('webm')) return 'webm';
  if (m.includes('quicktime') || m.includes('mov')) return 'mov';
  if (m.includes('3gpp') || m.includes('3gp')) return '3gp';
  if (m.includes('x-matroska') || m.includes('mkv')) return 'mkv';
  if (m.includes('mp4')) return 'mp4';
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
  if (m.startsWith('video/')) return 'mp4';
  if (m.startsWith('image/')) return 'jpg';
  return 'mp4';
}

function getMimeForExt(file: string): string {
  const ext = path.extname(file).toLowerCase();
  switch (ext) {
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.mov':
      return 'video/quicktime';
    case '.3gp':
      return 'video/3gpp';
    case '.mkv':
      return 'video/x-matroska';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}

app.get('/api/bazaar/listings', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ listings: readSharedBazaarListings() });
});

function saveBazaarMediaBuffer(buffer: Buffer, mimeType: string) {
  ensureBazaarStorage();
  const ext = getExtForMime(String(mimeType || 'video/mp4'));
  const fileName = `med_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const mediaRoot = path.resolve(SHARED_BAZAAR_MEDIA_DIR);
  const targetPath = path.resolve(mediaRoot, fileName);
  if (!targetPath.startsWith(mediaRoot + path.sep)) {
    throw new Error('INVALID_MEDIA_TARGET');
  }
  fs.writeFileSync(targetPath, buffer);
  return {
    mediaId: fileName,
    url: `/api/bazaar/media/${fileName}`,
    mimeType: getMimeForExt(fileName),
    size: buffer.length,
  };
}

app.post('/api/bazaar/media', uploadRateLimiter, (req, res) => {
  try {
    const { base64, mimeType } = req.body || {};
    if (!base64 || typeof base64 !== 'string') {
      return res.status(400).json({ error: 'Media payload is required' });
    }
    const cleanB64 = base64.includes(',') ? base64.split(',')[1] : base64;
    const buffer = Buffer.from(cleanB64, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Empty media file' });
    }
    if (buffer.length > 22 * 1024 * 1024) {
      return res.status(413).json({
        error: 'MEDIA_TOO_LARGE',
        message: 'वीडियो साइज 22 MB से कम रखें (लगभग 30-45 सेकंड की रील)।',
      });
    }

    return res.json(saveBazaarMediaBuffer(buffer, String(mimeType || 'video/mp4')));
  } catch (err: any) {
    console.error('Bazaar media upload error:', err?.message || err);
    return res.status(500).json({ error: 'वीडियो सेव करने में त्रुटि आई।' });
  }
});

app.post(
  '/api/bazaar/media-raw',
  uploadRateLimiter,
  express.raw({ type: ['video/*', 'image/*', 'application/octet-stream'], limit: '24mb' }),
  (req, res) => {
    try {
      const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      if (buffer.length === 0) {
        return res.status(400).json({
          error: 'EMPTY_MEDIA',
          message: 'वीडियो फ़ाइल खाली प्राप्त हुई। कृपया पुनः प्रयास करें।',
        });
      }
      if (buffer.length > 22 * 1024 * 1024) {
        return res.status(413).json({
          error: 'MEDIA_TOO_LARGE',
          message: 'वीडियो साइज 22 MB से कम रखें (लगभग 30-45 सेकंड की रील)।',
        });
      }
      const mimeType = String(req.query.mimeType || req.headers['content-type'] || 'video/mp4');
      return res.json(saveBazaarMediaBuffer(buffer, mimeType));
    } catch (err: any) {
      console.error('Bazaar raw media upload error:', err?.message || err);
      return res.status(500).json({
        error: 'UPLOAD_FAILED',
        message: 'वीडियो सर्वर पर सेव करने में त्रुटि आई।',
      });
    }
  }
);

app.get('/api/bazaar/media/:file', (req, res) => {
  const file = String(req.params.file || '');
  if (!/^[a-zA-Z0-9_.-]+$/.test(file) || file.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const mediaRoot = path.resolve(SHARED_BAZAAR_MEDIA_DIR);
  const filePath = path.resolve(mediaRoot, file);
  if (!filePath.startsWith(mediaRoot + path.sep)) {
    return res.status(400).json({ error: 'Invalid media path' });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Media not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const contentType = getMimeForExt(file);
  const range = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    if (isNaN(start) || isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
      return res.end();
    }
    const chunkSize = end - start + 1;
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize.toString());
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.status(200);
    res.setHeader('Content-Length', fileSize.toString());
    fs.createReadStream(filePath).pipe(res);
  }
});

const ALLOWED_BAZAAR_TYPES = new Set([
  'sell_crop',
  'rent_equipment',
  'seeds_fertilizer',
  'dairy_livestock',
  'farm_experience',
  'company_promo',
]);

function stripAngleBrackets(val: unknown): string {
  return String(val ?? '').replace(/[<>]/g, '').trim();
}

function isAllowedVideoUrl(url: string): boolean {
  return (
    /^https?:\/\/.+/i.test(url) ||
    /^\/api\/bazaar\/media\/[a-zA-Z0-9_.-]+$/.test(url)
  );
}

function isAllowedImageUrl(url: string): boolean {
  return (
    url === '' ||
    /^data:image\/(png|jpeg|jpg|webp|svg\+xml)[;,]/i.test(url) ||
    /^https?:\/\/.+/i.test(url)
  );
}

app.post('/api/bazaar/listings', uploadRateLimiter, (req, res) => {
  try {
    const body = req.body || {};
    const titleStr = stripAngleBrackets(
      typeof body.title === 'string' ? body.title : body.title?.hi || ''
    );
    const sellerStr = stripAngleBrackets(body.sellerName || '');
    const phoneStr = stripAngleBrackets(body.phone || body.contactPhone || '');
    if (!titleStr || !sellerStr || !phoneStr) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'शीर्षक, नाम और मोबाइल नंबर अनिवार्य हैं।',
      });
    }

    const rawExtUrl =
      typeof body.externalVideoUrl === 'string' ? body.externalVideoUrl.trim() : '';
    const rawVideoUrl = typeof body.videoUrl === 'string' ? body.videoUrl.trim() : '';
    const rawImageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';

    if (rawExtUrl && !/^https?:\/\/.+/i.test(rawExtUrl)) {
      return res.status(400).json({
        error: 'INVALID_URL_SCHEME',
        message: 'वीडियो लिंक हमेशा https:// या http:// से शुरू होना चाहिए।',
      });
    }
    if (rawVideoUrl && !isAllowedVideoUrl(rawVideoUrl)) {
      return res.status(400).json({
        error: 'INVALID_VIDEO_URL',
        message: 'अमान्य वीडियो URL प्रारूप।',
      });
    }
    if (rawImageUrl && !isAllowedImageUrl(rawImageUrl)) {
      return res.status(400).json({
        error: 'INVALID_IMAGE_URL',
        message: 'अमान्य फोटो URL प्रारूप।',
      });
    }

    const cleanId =
      typeof body.id === 'string' && /^[a-zA-Z0-9_-]{3,100}$/.test(body.id)
        ? body.id
        : `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const safeType = ALLOWED_BAZAAR_TYPES.has(String(body.type || ''))
      ? String(body.type)
      : 'sell_crop';

    const locText = stripAngleBrackets(
      typeof body.location === 'string'
        ? body.location
        : body.location?.hi || 'विदिशा, मध्य प्रदेश'
    );
    const stateText = stripAngleBrackets(
      typeof body.state === 'string' ? body.state : body.state?.hi || 'मध्य प्रदेश'
    );
    const unitText = stripAngleBrackets(
      typeof body.priceUnit === 'string' ? body.priceUnit : body.priceUnit?.hi || '₹'
    );
    const descText = stripAngleBrackets(
      typeof body.description === 'string'
        ? body.description
        : body.description?.hi || 'संपर्क करें।'
    );

    const entry = {
      id: cleanId,
      authorUid:
        typeof body.authorUid === 'string' && /^[a-zA-Z0-9_-]{5,128}$/.test(body.authorUid)
          ? body.authorUid
          : undefined,
      title: { hi: titleStr.slice(0, 150), en: titleStr.slice(0, 150) },
      type: safeType,
      price: Math.max(0, Math.min(100000000, Number(body.price) || 0)),
      priceUnit: { hi: unitText.slice(0, 60) || '₹', en: unitText.slice(0, 60) || '₹' },
      quantity: stripAngleBrackets(body.quantity || 'उपलब्ध').slice(0, 80) || 'उपलब्ध',
      location: {
        hi: locText.slice(0, 120) || 'विदिशा, मध्य प्रदेश',
        en: locText.slice(0, 120) || 'Vidisha, MP',
      },
      state: {
        hi: stateText.slice(0, 60) || 'मध्य प्रदेश',
        en: stateText.slice(0, 60) || 'MP',
      },
      sellerName: sellerStr.slice(0, 100),
      phone: phoneStr.slice(0, 25),
      date:
        typeof body.date === 'string' && body.date
          ? stripAngleBrackets(body.date).slice(0, 40)
          : new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' }),
      imageUrl: rawImageUrl.slice(0, 350000),
      mediaType: body.mediaType === 'video' ? 'video' : 'image',
      videoUrl: rawVideoUrl ? rawVideoUrl.slice(0, 500) : undefined,
      videoMediaId:
        typeof body.videoMediaId === 'string' && /^[a-zA-Z0-9_-]{2,128}$/.test(body.videoMediaId)
          ? body.videoMediaId
          : undefined,
      videoChunkCount: Math.max(0, Math.min(20, Number(body.videoChunkCount) || 0)),
      videoMimeType:
        typeof body.videoMimeType === 'string'
          ? stripAngleBrackets(body.videoMimeType).slice(0, 60)
          : undefined,
      externalVideoUrl: rawExtUrl ? rawExtUrl.slice(0, 500) : undefined,
      description: {
        hi: descText.slice(0, 1000) || 'संपर्क करें।',
        en: descText.slice(0, 1000) || 'Contact seller.',
      },
      verified: true,
      isCompanyPromo: safeType === 'company_promo',
      companyName: body.companyName ? stripAngleBrackets(body.companyName).slice(0, 120) : undefined,
      discountOffer: body.discountOffer
        ? stripAngleBrackets(body.discountOffer).slice(0, 120)
        : undefined,
      targetPestOrCrop: body.targetPestOrCrop
        ? stripAngleBrackets(body.targetPestOrCrop).slice(0, 150)
        : undefined,
      likes: Math.max(0, Math.min(1000000, Number(body.likes) || 1)),
      isCloudPost: true,
      isDemo: false,
      createdAtMs: Number(body.createdAtMs) || Date.now(),
    };

    const existing = readSharedBazaarListings().filter((x) => x.id !== entry.id);
    const updated = [entry, ...existing];
    writeSharedBazaarListings(updated);
    return res.json({ listing: entry });
  } catch (err: any) {
    console.error('Bazaar post save error:', err?.message || err);
    return res.status(500).json({ error: 'पोस्ट सेव करने में त्रुटि आई।' });
  }
});

app.post('/api/bazaar/listings/:id/like', (req, res) => {
  const id = String(req.params.id || '');
  const list = readSharedBazaarListings();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  list[idx].likes = (Number(list[idx].likes) || 0) + 1;
  writeSharedBazaarListings(list);
  return res.json({ likes: list[idx].likes });
});

app.delete('/api/bazaar/listings/:id', (req, res) => {
  const id = String(req.params.id || '');
  const list = readSharedBazaarListings();
  const target = list.find((x) => x.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  const remaining = list.filter((x) => x.id !== id);
  writeSharedBazaarListings(remaining);

  if (
    typeof target.videoUrl === 'string' &&
    target.videoUrl.startsWith('/api/bazaar/media/')
  ) {
    const file = target.videoUrl.replace('/api/bazaar/media/', '');
    if (/^[a-zA-Z0-9_.-]+$/.test(file)) {
      const fPath = path.join(SHARED_BAZAAR_MEDIA_DIR, file);
      if (fs.existsSync(fPath)) {
        try {
          fs.unlinkSync(fPath);
        } catch {
          // ignore cleanup failure
        }
      }
    }
  }
  return res.json({ deleted: true });
});

function getServerIndianNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
}

function formatServerDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function ddmmyyyyToSortable(d: string): string {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(d || '').trim());
  if (!m) return '';
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function normalizeSlashOrDashToDDMMYYYY(raw: string): string {
  const s = String(raw || '').trim();
  const dm = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s);
  if (dm) {
    return `${dm[1].padStart(2, '0')}-${dm[2].padStart(2, '0')}-${dm[3]}`;
  }
  const ym = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s);
  if (ym) {
    return `${ym[3].padStart(2, '0')}-${ym[2].padStart(2, '0')}-${ym[1]}`;
  }
  return '';
}

function lookupMspForCrop(cropName: string): number | string {
  const c = String(cropName || '').toLowerCase();
  if (c.includes('सोयाबीन') || c.includes('soybean') || c.includes('soya')) return 5708;
  if (c.includes('सरसों') || c.includes('mustard') || c.includes('sarson')) return 6200;
  if (c.includes('चना') || c.includes('chana') || c.includes('gram')) return 5958;
  if (c.includes('मसूर') || c.includes('masoor') || c.includes('lentil')) return 7000;
  if (c.includes('शरवती') || c.includes('शरबती') || c.includes('गेहू') || c.includes('गेहूं') || c.includes('wheat') || c.includes('मालवा')) return 2625;
  if (c.includes('मूंग') || c.includes('मुंग') || c.includes('moong')) return 8780;
  if (c.includes('उड़द') || c.includes('urad')) return 8200;
  if (c.includes('मक्का') || c.includes('maize')) return 2410;
  if (c.includes('धान') || c.includes('paddy')) return 2441;
  return '-';
}

function getLatestSavedPatrakForMandi(mandiId: string, beforeDateStr?: string): any | null {
  const all = readSharedPatraks();
  const targetSort = beforeDateStr ? ddmmyyyyToSortable(beforeDateStr) : '';
  const matches = Object.values(all).filter((p: any) => {
    if (!p || p.mandiId !== mandiId || !Array.isArray(p.rows) || p.rows.length === 0) return false;
    if (!targetSort) return true;
    const pSort = ddmmyyyyToSortable(p.date);
    return pSort && pSort < targetSort;
  });
  if (matches.length === 0) return null;
  matches.sort((a: any, b: any) => ddmmyyyyToSortable(b.date).localeCompare(ddmmyyyyToSortable(a.date)));
  return matches[0];
}

function matchPreviousPrice(cropName: string, prevPatrak: any): number {
  if (!prevPatrak || !Array.isArray(prevPatrak.rows)) return 0;
  const clean = String(cropName || '').toLowerCase().replace(/\(.*?\)/g, '').trim();
  if (!clean) return 0;
  const hit = prevPatrak.rows.find((r: any) => {
    const rClean = String(r.cropName || '').toLowerCase().replace(/\(.*?\)/g, '').trim();
    return rClean && (rClean === clean || rClean.includes(clean) || clean.includes(rClean));
  });
  return hit && Number(hit.modalPrice) > 0 ? Number(hit.modalPrice) : 0;
}

function stateToEnglishForGov(state: string): string {
  const s = String(state || '').trim();
  if (!s || s.includes('मध्य प्रदेश') || /madhya pradesh/i.test(s)) return 'Madhya Pradesh';
  if (s.includes('उत्तर प्रदेश') || /uttar pradesh/i.test(s)) return 'Uttar Pradesh';
  if (s.includes('राजस्थान') || /rajasthan/i.test(s)) return 'Rajasthan';
  if (s.includes('महाराष्ट्र') || /maharashtra/i.test(s)) return 'Maharashtra';
  if (s.includes('गुजरात') || /gujarat/i.test(s)) return 'Gujarat';
  if (s.includes('पंजाब') || /punjab/i.test(s)) return 'Punjab';
  if (s.includes('हरियाणा') || /haryana/i.test(s)) return 'Haryana';
  return s;
}

const HINDI_MONTH_NUM: Record<string, string> = {
  'जनवरी': '01',
  'फ़रवरी': '02',
  'फरवरी': '02',
  'मार्च': '03',
  'अप्रैल': '04',
  'मई': '05',
  'जून': '06',
  'जुलाई': '07',
  'अगस्त': '08',
  'सितंबर': '09',
  'सितम्बर': '09',
  'अक्टूबर': '10',
  'अक्तूबर': '10',
  'नवंबर': '11',
  'नवम्बर': '11',
  'दिसंबर': '12',
  'दिसम्बर': '12',
};

function parseHindiDateToDDMMYYYY(raw: string): string {
  const clean = String(raw || '').replace(/\s+/g, ' ').trim();
  const m = clean.match(/^(\d{1,2})\s+([^\s]+)\s+(\d{4})$/);
  if (!m) return '';
  const mm = HINDI_MONTH_NUM[m[2].trim()];
  if (!mm) return '';
  return `${m[1].padStart(2, '0')}-${mm}-${m[3]}`;
}

function normalizeHindiGeo(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/तहसील:|मुख्य मंडी|उपमंडी|कृषि उपज मंडी|संभागीय मंडी|मंडी/g, ' ')
    .replace(/[ौो]/g, 'ो')
    .replace(/[ैे]/g, 'े')
    .replace(/[ीि]/g, 'ि')
    .replace(/[ूु]/g, 'ु')
    .replace(/[ँं]/g, 'ं')
    .replace(/[ढ़]/g, 'ड')
    .replace(/[^a-z0-9\u0900-\u097f]/g, '')
    .trim();
}

function stateToKisanSamadhanSlug(state: string): string {
  const s = String(state || '').trim();
  if (!s || s.includes('मध्य प्रदेश') || /madhya pradesh/i.test(s)) return 'madhya-pradesh';
  if (s.includes('उत्तर प्रदेश') || /uttar pradesh/i.test(s)) return 'uttar-pradesh';
  if (s.includes('राजस्थान') || /rajasthan/i.test(s)) return 'rajasthan';
  if (s.includes('महाराष्ट्र') || /maharashtra/i.test(s)) return 'maharashtra';
  if (s.includes('गुजरात') || /gujarat/i.test(s)) return 'gujarat';
  if (s.includes('पंजाब') || /punjab/i.test(s)) return 'punjab';
  if (s.includes('हरियाणा') || /haryana/i.test(s)) return 'haryana';
  if (s.includes('छत्तीसगढ़') || /chhattisgarh/i.test(s)) return 'chhattisgarh';
  if (s.includes('बिहार') || /bihar/i.test(s)) return 'bihar';
  return 'madhya-pradesh';
}

const LIVE_SCRAPE_CROPS: Array<{ label: string; slug: string }> = [
  { label: 'सोयाबीन', slug: 'soyabean' },
  { label: 'गेहूं', slug: 'wheat' },
  { label: 'चना', slug: 'chana-bengal-gram' },
  { label: 'सरसों', slug: 'mustard' },
  { label: 'मसूर', slug: 'masur' },
  { label: 'मक्का', slug: 'maize' },
  { label: 'धान', slug: 'paddy' },
  { label: 'मूंग', slug: 'moong' },
  { label: 'उड़द', slug: 'urad-black-gram' },
  { label: 'ज्वार', slug: 'jowar' },
  { label: 'धनिया', slug: 'coriander-seed' },
  { label: 'तुअर / अरहर', slug: 'tuar-arhar' },
  { label: 'मूंगफली', slug: 'groundnut' },
  { label: 'लहसुन', slug: 'garlic' },
  { label: 'प्याज', slug: 'onion' },
];

interface ScrapedMandiRow {
  cropLabel: string;
  variety: string;
  mandiRaw: string;
  mandiNorm: string;
  districtRaw: string;
  districtNorm: string;
  dateStr: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  sourceUrl: string;
}

const stateRatesCache = new Map<string, { fetchedAt: number; rows: ScrapedMandiRow[] }>();

async function fetchStateAgmarknetMirror(stateSlug: string): Promise<ScrapedMandiRow[]> {
  const cached = stateRatesCache.get(stateSlug);
  if (cached && Date.now() - cached.fetchedAt < 20 * 60 * 1000 && cached.rows.length > 0) {
    return cached.rows;
  }

  const allRows: ScrapedMandiRow[] = [];
  await Promise.all(
    LIVE_SCRAPE_CROPS.map(async ({ label, slug }) => {
      const pageUrl = `https://kisansamadhan.com/mandi-bhav/${slug}/${stateSlug}/`;
      try {
        const resp = await fetch(pageUrl, {
          signal: AbortSignal.timeout(7000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KisanSetu/1.0)' },
        });
        if (!resp.ok) return;
        const html = await resp.text();
        const trMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
        for (const tr of trMatches) {
          const cols = Array.from(tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((c) =>
            c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          );
          if (cols.length < 7) continue;
          const dateStr = parseHindiDateToDDMMYYYY(cols[1]);
          if (!dateStr) continue;
          const parseRs = (v: string) => Math.round(Number(String(v || '').replace(/[₹,\s]/g, '')) || 0);
          const minP = parseRs(cols[4]);
          const maxP = parseRs(cols[5]);
          const modP = parseRs(cols[6]) || Math.round(((minP || maxP) + (maxP || minP)) / 2);
          if (modP < 100 || modP > 100000) continue;

          const mandiRaw = stripAngleBrackets(cols[0]);
          const districtPart = stripAngleBrackets(cols[2].split(',')[0] || cols[2]);
          const variety = stripAngleBrackets(cols[3]);

          allRows.push({
            cropLabel: label,
            variety,
            mandiRaw,
            mandiNorm: normalizeHindiGeo(mandiRaw),
            districtRaw: districtPart,
            districtNorm: normalizeHindiGeo(districtPart),
            dateStr,
            minPrice: minP || modP,
            maxPrice: maxP || modP,
            modalPrice: modP,
            sourceUrl: pageUrl,
          });
        }
      } catch {
        // skip transient single-crop fetch failures
      }
    })
  );

  if (allRows.length > 0) {
    stateRatesCache.set(stateSlug, { fetchedAt: Date.now(), rows: allRows });
  }
  return allRows;
}

const inFlightAutoSyncs = new Map<string, Promise<any>>();
const negativeSyncCooldown = new Map<string, number>();

async function performMandiAutoSync(params: {
  mandiId: string;
  mandiName: string;
  district: string;
  state: string;
  date: string;
  arrivalUnit: 'बोरी' | 'क्विंटल';
  force?: boolean;
}): Promise<{
  synced: boolean;
  cached?: boolean;
  foundToday: boolean;
  date: string;
  source?: string;
  sourceUrls?: Array<{ title: string; uri: string }>;
  patrak?: any;
  message: string;
}> {
  const { mandiId, mandiName, district, state, date, arrivalUnit, force } = params;
  const cacheKey = `${mandiId}__${date}`;

  const allStored = readSharedPatraks();
  const existingToday = allStored[cacheKey];
  if (existingToday && isServerRichPatrak(existingToday)) {
    return {
      synced: true,
      cached: true,
      foundToday: true,
      date,
      source: existingToday.sourceLabel || 'सत्यापित मंडी समिति पत्रक',
      sourceUrls: Array.isArray(existingToday.sourceUrls) ? existingToday.sourceUrls : [],
      patrak: existingToday,
      message: `आज (${date}) का पूर्ण सत्यापित मंडी समिति पत्रक पहले से सुरक्षित है।`,
    };
  }
  if (
    !force &&
    existingToday &&
    Array.isArray(existingToday.rows) &&
    existingToday.rows.length > 0 &&
    existingToday.updatedAt &&
    Date.now() - new Date(existingToday.updatedAt).getTime() < 3 * 60 * 60 * 1000
  ) {
    return {
      synced: true,
      cached: true,
      foundToday: true,
      date,
      source: existingToday.sourceLabel || 'shared_cache',
      sourceUrls: Array.isArray(existingToday.sourceUrls) ? existingToday.sourceUrls : [],
      patrak: existingToday,
      message: `आज (${date}) के ताज़ा मंडी भाव सर्वर पर पहले से अद्यतित हैं।`,
    };
  }

  const negUntil = negativeSyncCooldown.get(cacheKey) || 0;
  if (!force && negUntil > Date.now()) {
    return {
      synced: false,
      foundToday: false,
      date,
      message: `आज (${date}) का नया पत्रक अभी ऑनलाइन पोर्टल पर जारी नहीं हुआ है (कुछ देर बाद पुनः जाँच होगी)।`,
    };
  }

  if (inFlightAutoSyncs.has(cacheKey)) {
    return inFlightAutoSyncs.get(cacheKey)!;
  }

  const job = (async () => {
    const prevPatrak = getLatestSavedPatrakForMandi(mandiId, date);
    const prevLatestAny = getLatestSavedPatrakForMandi(mandiId);

    // Source 1: Official data.gov.in Agmarknet API (when DATA_GOV_API_KEY is configured and reachable)
    const govKey = (process.env.DATA_GOV_API_KEY || '').trim();
    if (govKey) {
      try {
        const engState = stateToEnglishForGov(state);
        const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${encodeURIComponent(govKey)}&format=json&filters%5Bstate.keyword%5D=${encodeURIComponent(engState)}&limit=100`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (resp.ok) {
          const payload = await resp.json();
          const records: any[] = Array.isArray(payload?.records) ? payload.records : [];
          const cleanMandiName = mandiName.toLowerCase();
          const cleanDistrict = district.toLowerCase();

          const matched = records.filter((rec) => {
            const mkt = String(rec.market || '').toLowerCase();
            const dist = String(rec.district || '').toLowerCase();
            return (
              (mkt && (cleanMandiName.includes(mkt) || mkt.includes('basoda') && cleanMandiName.includes('गंजबासौदा'))) ||
              (dist && cleanDistrict && (cleanDistrict.includes(dist) || dist.includes('vidisha') && cleanDistrict.includes('विदिशा')))
            );
          });

          if (matched.length > 0) {
            const recDate = normalizeSlashOrDashToDDMMYYYY(matched[0].arrival_date || '') || date;
            const grouped = new Map<string, any>();
            for (const r of matched) {
              const comm = stripAngleBrackets(r.commodity || r.variety || '');
              if (!comm) continue;
              const minP = Number(r.min_price) || 0;
              const maxP = Number(r.max_price) || 0;
              const modP = Number(r.modal_price) || Math.round(((minP || maxP) + (maxP || minP)) / 2);
              if (modP <= 0) continue;
              grouped.set(comm, {
                cropName: comm,
                minPrice: minP || modP,
                maxPrice: maxP || modP,
                modalPrice: modP,
              });
            }

            if (grouped.size > 0) {
              const rows = Array.from(grouped.values()).map((item, idx) => {
                const yPrice = matchPreviousPrice(item.cropName, prevPatrak);
                return {
                  sNo: idx + 1,
                  cropName: item.cropName,
                  contracts: '-',
                  arrival: '-',
                  arrivalUnit,
                  minPrice: item.minPrice,
                  maxPrice: item.maxPrice,
                  modalPrice: item.modalPrice,
                  yesterdayPrice: yPrice,
                  priceChange: yPrice > 0 ? item.modalPrice - yPrice : 0,
                  msp: lookupMspForCrop(item.cropName),
                };
              });

              const entry = {
                mandiId,
                date: recDate,
                totalContracts: '-',
                totalArrival: '-',
                arrivalUnit,
                releaseTime: `सरकारी Agmarknet लाइव ऑटो-सिंक (${recDate})`,
                sourceLabel: 'data.gov.in (Agmarknet)',
                sourceUrls: [{ title: 'Agmarknet / data.gov.in', uri: 'https://agmarknet.gov.in' }],
                rows,
                updatedAt: new Date().toISOString(),
              };
              const targetKey = `${mandiId}__${recDate}`;
              const existingRec = readSharedPatraks()[targetKey];
              if (isEmbeddedOfficialPatrakKey(mandiId, recDate) || (existingRec && isServerRichPatrak(existingRec))) {
                return {
                  synced: Boolean(existingRec && isServerRichPatrak(existingRec)),
                  foundToday: recDate === date,
                  date: recDate,
                  source: existingRec?.sourceLabel || 'सत्यापित मंडी समिति पत्रक',
                  sourceUrls: existingRec?.sourceUrls || entry.sourceUrls,
                  patrak: existingRec && isServerRichPatrak(existingRec) ? existingRec : undefined,
                  message: `📌 ${recDate} का पूर्ण सत्यापित मंडी समिति पत्रक सुरक्षित है — आंशिक वेब सूची से इसे बदला नहीं गया।`,
                };
              }
              writeSharedPatrak(targetKey, entry);
              return {
                synced: true,
                foundToday: recDate === date,
                date: recDate,
                source: 'data.gov.in',
                sourceUrls: entry.sourceUrls,
                patrak: entry,
                message: `✅ सरकारी पोर्टल Agmarknet से ${recDate} के ${rows.length} प्रमुख जिंसों के भाव स्वतः प्राप्त हुए!`,
              };
            }
          }
        }
      } catch (err: any) {
        console.warn('data.gov.in auto-sync skipped:', err?.message || err);
      }
    }

    // Source 2: Live Agmarknet Hindi Mirror (KisanSamadhan) — zero quota limit, global reachability
    try {
      const stateSlug = stateToKisanSamadhanSlug(state);
      const stateRows = await fetchStateAgmarknetMirror(stateSlug);
      if (stateRows.length > 0) {
        const targetMandiNorm = normalizeHindiGeo(mandiName);
        const targetDistrictNorm = normalizeHindiGeo(district);

        const isExactMandi = (r: ScrapedMandiRow) =>
          Boolean(
            r.mandiNorm &&
              targetMandiNorm &&
              (r.mandiNorm === targetMandiNorm ||
                targetMandiNorm.includes(r.mandiNorm) ||
                r.mandiNorm.includes(targetMandiNorm))
          );

        const isDistrictMandi = (r: ScrapedMandiRow) =>
          Boolean(
            r.districtNorm &&
              targetDistrictNorm &&
              (r.districtNorm === targetDistrictNorm ||
                r.districtNorm.includes(targetDistrictNorm) ||
                targetDistrictNorm.includes(r.districtNorm))
          );

        const directMatches = stateRows.filter(isExactMandi);
        const districtMatches = stateRows.filter((r) => !isExactMandi(r) && isDistrictMandi(r));

        const targetDateRowsDirect = directMatches.filter((r) => r.dateStr === date);
        const targetDateRowsDistrict = districtMatches.filter((r) => r.dateStr === date);

        // Choose best date: today if either direct mandi or district has today's live bulletin, else latest date in direct/district
        let chosenDate = '';
        if (targetDateRowsDirect.length > 0 || targetDateRowsDistrict.length > 0) {
          chosenDate = date;
        } else {
          const allDates = [...directMatches, ...districtMatches]
            .map((r) => r.dateStr)
            .filter((d) => Boolean(ddmmyyyyToSortable(d)));
          allDates.sort((a, b) => ddmmyyyyToSortable(b).localeCompare(ddmmyyyyToSortable(a)));
          chosenDate = allDates[0] || '';
        }

        if (chosenDate) {
          const directForDate = directMatches.filter((r) => r.dateStr === chosenDate);
          const districtForDate = districtMatches.filter((r) => r.dateStr === chosenDate);

          // Also gather earlier rows for real yesterday price diff when available
          const earlierRows = [...directMatches, ...districtMatches].filter(
            (r) => ddmmyyyyToSortable(r.dateStr) < ddmmyyyyToSortable(chosenDate)
          );

          const byCrop = new Map<
            string,
            {
              cropName: string;
              minPrice: number;
              maxPrice: number;
              modalPrice: number;
              yesterdayPrice: number;
              sourceUrl: string;
              isDirect: boolean;
            }
          >();

          // First insert direct mandi rows for exact requested market
          for (const r of directForDate) {
            const key = r.cropLabel;
            const prevMatch = earlierRows.find((e) => e.cropLabel === r.cropLabel && isExactMandi(e))
              || earlierRows.find((e) => e.cropLabel === r.cropLabel);
            const yPrice = prevMatch ? prevMatch.modalPrice : matchPreviousPrice(r.cropLabel, prevPatrak || prevLatestAny);
            if (!byCrop.has(key)) {
              byCrop.set(key, {
                cropName: r.cropLabel,
                minPrice: r.minPrice,
                maxPrice: r.maxPrice,
                modalPrice: r.modalPrice,
                yesterdayPrice: yPrice,
                sourceUrl: r.sourceUrl,
                isDirect: true,
              });
            }
          }

          // Then add same-district neighboring mandi live rates clearly tagged with actual market name
          for (const r of districtForDate) {
            const key = r.cropLabel;
            if (byCrop.has(key)) continue;
            const prevMatch = earlierRows.find((e) => e.cropLabel === r.cropLabel);
            const yPrice = prevMatch ? prevMatch.modalPrice : matchPreviousPrice(r.cropLabel, prevPatrak || prevLatestAny);
            byCrop.set(key, {
              cropName: `${r.cropLabel} (${r.mandiRaw} मंडी)`,
              minPrice: r.minPrice,
              maxPrice: r.maxPrice,
              modalPrice: r.modalPrice,
              yesterdayPrice: yPrice,
              sourceUrl: r.sourceUrl,
              isDirect: false,
            });
          }

          if (byCrop.size > 0) {
            const istNow = getServerIndianNow();
            const timeStr = `${String(istNow.getHours()).padStart(2, '0')}:${String(istNow.getMinutes()).padStart(2, '0')} IST`;
            const unitOut: 'बोरी' | 'क्विंटल' = 'क्विंटल';
            const finalRows = Array.from(byCrop.values()).map((item, idx) => ({
              sNo: idx + 1,
              cropName: item.cropName,
              contracts: '-',
              arrival: '-',
              arrivalUnit: unitOut,
              minPrice: item.minPrice,
              maxPrice: item.maxPrice,
              modalPrice: item.modalPrice,
              yesterdayPrice: item.yesterdayPrice,
              priceChange: item.yesterdayPrice > 0 ? item.modalPrice - item.yesterdayPrice : 0,
              msp: lookupMspForCrop(item.cropName),
            }));

            const uniqueSources: Array<{ title: string; uri: string }> = [];
            const seenUris = new Set<string>();
            for (const item of byCrop.values()) {
              if (!seenUris.has(item.sourceUrl)) {
                seenUris.add(item.sourceUrl);
                uniqueSources.push({
                  title: `${item.cropName.split('(')[0].trim()} — Agmarknet लाइव`,
                  uri: item.sourceUrl,
                });
                if (uniqueSources.length >= 5) break;
              }
            }

            const directCount = Array.from(byCrop.values()).filter((x) => x.isDirect).length;
            const labelDetail =
              directCount > 0
                ? `${directCount} सीधी मंडी + ${finalRows.length - directCount} जिला मंडी`
                : `जिला ${district} मंडी संकलन`;

            const entry = {
              mandiId,
              date: chosenDate,
              totalContracts: '-',
              totalArrival: '-',
              arrivalUnit: unitOut,
              releaseTime: `स्वतः लाइव Agmarknet सिंक (${chosenDate} • ${labelDetail} • ${timeStr})`,
              sourceLabel: 'Agmarknet / KisanSamadhan लाइव',
              sourceUrls: uniqueSources,
              rows: finalRows,
              updatedAt: new Date().toISOString(),
            };

            const targetKey = `${mandiId}__${chosenDate}`;
            const existingChosen = readSharedPatraks()[targetKey];
            if (isEmbeddedOfficialPatrakKey(mandiId, chosenDate) || (existingChosen && isServerRichPatrak(existingChosen))) {
              negativeSyncCooldown.set(cacheKey, Date.now() + 10 * 60 * 1000);
              return {
                synced: Boolean(existingChosen && isServerRichPatrak(existingChosen)),
                foundToday: chosenDate === date,
                date: chosenDate,
                source: existingChosen?.sourceLabel || 'सत्यापित मंडी समिति पत्रक',
                sourceUrls: existingChosen?.sourceUrls || uniqueSources,
                patrak: existingChosen && isServerRichPatrak(existingChosen) ? existingChosen : undefined,
                message:
                  chosenDate === date
                    ? `📌 आज (${chosenDate}) का पूर्ण सत्यापित मंडी समिति पत्रक सुरक्षित है।`
                    : `📌 ${chosenDate} का पूर्ण 18-फसल मंडी समिति पत्रक सुरक्षित है (आज ${date} की नई सूची अभी ऑनलाइन नहीं आई है)।`,
              };
            }

            writeSharedPatrak(targetKey, entry);
            negativeSyncCooldown.delete(cacheKey);

            return {
              synced: true,
              foundToday: chosenDate === date,
              date: chosenDate,
              source: 'Agmarknet लाइव वेब सिंक',
              sourceUrls: uniqueSources,
              patrak: entry,
              message:
                chosenDate === date
                  ? `✅ आज (${chosenDate}) के ${finalRows.length} प्रमुख जिंसों के ऑनलाइन भाव स्वतः अद्यतित हो गए!`
                  : `✅ ऑनलाइन पोर्टल पर उपलब्ध ${chosenDate} की ${finalRows.length} प्रमुख जिंसें अद्यतित (पूर्ण ब्यौरे हेतु पत्रक फोटो स्कैन करें)।`,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('KisanSamadhan mirror sync skipped:', err?.message || err);
    }

    // Source 3: Gemini Google Search Grounding (works globally, retrieves real published daily bulletins)
    if (!process.env.GEMINI_API_KEY) {
      negativeSyncCooldown.set(cacheKey, Date.now() + 5 * 60 * 1000);
      return {
        synced: false,
        foundToday: false,
        date,
        message: 'सर्वर पर लाइव सर्च सेवा (GEMINI_API_KEY) सेट नहीं है। फोटो स्कैन या त्वरित एडिट उपयोग करें।',
      };
    }

    try {
      const ai = getAiClient();
      const istNow = getServerIndianNow();
      const [dd, mm, yyyy] = date.split('-');
      const slashDate = `${dd}/${mm}/${yyyy}`;

      const searchPrompt = `आज की भारतीय तारीख ${date} (${slashDate}) है। कृपया Google Search का उपयोग करके "${mandiName}, जिला ${district}, ${state}" (उदा. MP Mandi Board, Agmarknet, e-NAM, Krishi Jagran, MandiBhavToday, KisanDeals, TractorJunction आदि विश्वसनीय कृषि पोर्टल) के **ताज़ा आधिकारिक मंडी भाव** खोजें।

अत्यंत महत्वपूर्ण नियम:
1. प्राथमिकता आज दिनांक ${date} के भाव को दें। यदि आज (${date}) का भाव पत्रक अभी इंटरनेट पर उपलब्ध न हो, तो इस मंडी का **सबसे नया (नवीनतम)** वास्तविक प्रकाशित भाव दें, परंतु "publishedDate" में बिल्कुल सही वास्तविक तारीख (DD-MM-YYYY) लिखें।
2. कोई भी भाव या नंबर मन से / अनुमान से न बनाएं। केवल वही असली फसलें व भाव (₹ प्रति क्विंटल में) लिखें जो सर्च परिणामों में वास्तव में मिले हों।
3. यदि किसी स्रोत में अनुबंध संख्या (contracts) या आवक (arrival) न दी हो तो वहाँ "-" लिखें।
4. यदि आपको इस मंडी या जिले के हालिया वास्तविक मंडी भाव इंटरनेट पर बिल्कुल न मिलें, तो "found": false लौटाएँ।

केवल नीचे दिए सटीक JSON प्रारूप में उत्तर दें (कोई अतिरिक्त टेक्स्ट या समझाइश बाहर न लिखें):
{
  "found": true,
  "publishedDate": "${date}",
  "isTodayExact": true,
  "sourceName": "स्रोत पोर्टल का नाम (जैसे MP Mandi Board / Agmarknet / MandiBhavToday)",
  "totalContracts": "-",
  "totalArrival": "-",
  "arrivalUnit": "${arrivalUnit}",
  "rows": [
    {
      "cropName": "सोयाबीन",
      "minPrice": 4200,
      "maxPrice": 4850,
      "modalPrice": 4650,
      "contracts": "-",
      "arrival": "-"
    }
  ]
}`;

      const { result: response, model: usedModel } = await generateWithModelFallback(
        (model) =>
          ai.models.generateContent({
            model,
            contents: searchPrompt,
            config: {
              tools: [{ googleSearch: {} }],
              ...(model === 'gemini-4-hydrogen'
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
            },
          }),
        ['gemini-3.1-flash-lite', 'gemini-4-hydrogen']
      );

      const rawText = (response.text ?? '').trim();
      const cleanedJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      let parsed: any = null;
      const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          parsed = null;
        }
      }

      // If grounded response included prose or markdown instead of strict JSON, convert that grounded text cleanly via responseSchema
      if (!parsed && rawText.length > 10) {
        try {
          const { result: structRes } = await generateWithModelFallback(
            (model) =>
              ai.models.generateContent({
                model,
                contents: `नीचे दिए गए सर्च परिणाम टेक्स्ट से मंडी भाव JSON निकालें। कोई भी संख्या मन से न जोड़ें।\n\nटेक्स्ट:\n${rawText.slice(0, 6000)}`,
                config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      found: { type: Type.BOOLEAN },
                      publishedDate: { type: Type.STRING },
                      isTodayExact: { type: Type.BOOLEAN },
                      sourceName: { type: Type.STRING },
                      totalContracts: { type: Type.STRING },
                      totalArrival: { type: Type.STRING },
                      arrivalUnit: { type: Type.STRING },
                      rows: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            cropName: { type: Type.STRING },
                            minPrice: { type: Type.NUMBER },
                            maxPrice: { type: Type.NUMBER },
                            modalPrice: { type: Type.NUMBER },
                            contracts: { type: Type.STRING },
                            arrival: { type: Type.STRING },
                          },
                          required: ['cropName', 'minPrice', 'maxPrice', 'modalPrice'],
                        },
                      },
                    },
                    required: ['found', 'publishedDate', 'rows'],
                  },
                },
              }),
            ['gemini-3.1-flash-lite', 'gemini-4-hydrogen']
          );
          parsed = JSON.parse((structRes.text ?? '{}').trim());
        } catch {
          parsed = null;
        }
      }

      if (!parsed) {
        negativeSyncCooldown.set(cacheKey, Date.now() + 10 * 60 * 1000);
        return {
          synced: false,
          foundToday: false,
          date,
          message: `आज (${date}) का नया भाव पत्रक अभी ऑनलाइन उपलब्ध नहीं हो सका।`,
        };
      }

      const publishedDate = normalizeSlashOrDashToDDMMYYYY(parsed.publishedDate || '') || '';
      const rawRows: any[] = Array.isArray(parsed.rows) ? parsed.rows : [];

      const validRows = rawRows
        .map((r: any, idx: number) => {
          const cropName = stripAngleBrackets(r.cropName || '').slice(0, 80);
          const minP = Math.max(0, Math.round(Number(r.minPrice) || 0));
          const maxP = Math.max(0, Math.round(Number(r.maxPrice) || 0));
          let modP = Math.max(0, Math.round(Number(r.modalPrice) || 0));
          if (modP === 0 && (minP > 0 || maxP > 0)) {
            modP = Math.round(((minP || maxP) + (maxP || minP)) / 2);
          }
          const finalMin = minP > 0 ? minP : modP;
          const finalMax = maxP > 0 ? maxP : modP;
          const yPrice = matchPreviousPrice(cropName, prevPatrak || prevLatestAny);
          return {
            sNo: idx + 1,
            cropName,
            contracts:
              typeof r.contracts === 'number' && r.contracts > 0
                ? Math.round(r.contracts)
                : typeof r.contracts === 'string' && /^\d+$/.test(r.contracts.trim())
                ? Number(r.contracts.trim())
                : '-',
            arrival:
              typeof r.arrival === 'number' && r.arrival > 0
                ? Math.round(r.arrival)
                : typeof r.arrival === 'string' && /^\d+(\.\d+)?$/.test(r.arrival.trim())
                ? Number(r.arrival.trim())
                : '-',
            arrivalUnit: parsed.arrivalUnit === 'बोरी' ? 'बोरी' : parsed.arrivalUnit === 'क्विंटल' ? 'क्विंटल' : arrivalUnit,
            minPrice: finalMin,
            maxPrice: finalMax,
            modalPrice: modP,
            yesterdayPrice: yPrice,
            priceChange: yPrice > 0 && modP > 0 ? modP - yPrice : 0,
            msp: lookupMspForCrop(cropName),
          };
        })
        .filter((r) => r.cropName.length > 0 && r.modalPrice >= 100 && r.modalPrice <= 100000);

      if (!parsed.found || validRows.length === 0 || !publishedDate) {
        negativeSyncCooldown.set(cacheKey, Date.now() + 15 * 60 * 1000);
        return {
          synced: false,
          foundToday: false,
          date,
          message: `अभी (${date}) के लिए "${mandiName}" का नया आधिकारिक वेब पत्रक प्रकाशित नहीं मिला।`,
        };
      }

      // Guard against saving dates older than what is already verified unless none existed
      const pubSort = ddmmyyyyToSortable(publishedDate);
      const prevSort = prevLatestAny ? ddmmyyyyToSortable(prevLatestAny.date) : '2026-11-16';
      if (pubSort && prevSort && pubSort < prevSort && publishedDate !== date) {
        negativeSyncCooldown.set(cacheKey, Date.now() + 15 * 60 * 1000);
        return {
          synced: false,
          foundToday: false,
          date,
          message: `ऑनलाइन पोर्टल पर अभी तक (${publishedDate}) से नया भाव अपडेट नहीं आया है।`,
        };
      }

      // Extract verified grounding URLs
      const chunks: any[] =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sourceUrls: Array<{ title: string; uri: string }> = [];
      const seenUri = new Set<string>();
      for (const ch of chunks) {
        const uri = String(ch?.web?.uri || '').trim();
        if (/^https?:\/\/.+/i.test(uri) && !seenUri.has(uri)) {
          seenUri.add(uri);
          sourceUrls.push({
            title: stripAngleBrackets(ch?.web?.title || uri).slice(0, 80) || 'मंडी स्रोत',
            uri: uri.slice(0, 500),
          });
          if (sourceUrls.length >= 5) break;
        }
      }

      const sourceName = stripAngleBrackets(parsed.sourceName || 'लाइव मंडी वेब सिंक').slice(0, 80);
      const unitOut: 'बोरी' | 'क्विंटल' =
        parsed.arrivalUnit === 'बोरी' ? 'बोरी' : parsed.arrivalUnit === 'क्विंटल' ? 'क्विंटल' : arrivalUnit;

      const totalContractsOut =
        parsed.totalContracts !== undefined && parsed.totalContracts !== null && String(parsed.totalContracts).trim() !== ''
          ? stripAngleBrackets(parsed.totalContracts).slice(0, 30)
          : '-';
      const totalArrivalOut =
        parsed.totalArrival !== undefined && parsed.totalArrival !== null && String(parsed.totalArrival).trim() !== ''
          ? stripAngleBrackets(parsed.totalArrival).slice(0, 30)
          : '-';

      const timeStr = `${String(istNow.getHours()).padStart(2, '0')}:${String(istNow.getMinutes()).padStart(2, '0')} IST`;
      const savedEntry = {
        mandiId,
        date: publishedDate,
        totalContracts: totalContractsOut,
        totalArrival: totalArrivalOut,
        arrivalUnit: unitOut,
        releaseTime: `स्वतः लाइव वेब सिंक (${publishedDate} • ${sourceName} • ${timeStr})`,
        sourceLabel: sourceName,
        sourceUrls,
        rows: validRows.map((r) => ({ ...r, arrivalUnit: unitOut })),
        updatedAt: new Date().toISOString(),
      };

      const targetKey = `${mandiId}__${publishedDate}`;
      const existingPub = readSharedPatraks()[targetKey];
      if (!isServerRichPatrak(savedEntry) && (isEmbeddedOfficialPatrakKey(mandiId, publishedDate) || (existingPub && isServerRichPatrak(existingPub)))) {
        negativeSyncCooldown.set(cacheKey, Date.now() + 10 * 60 * 1000);
        return {
          synced: Boolean(existingPub && isServerRichPatrak(existingPub)),
          foundToday: publishedDate === date,
          date: publishedDate,
          source: existingPub?.sourceLabel || 'सत्यापित मंडी समिति पत्रक',
          sourceUrls: existingPub?.sourceUrls || sourceUrls,
          patrak: existingPub && isServerRichPatrak(existingPub) ? existingPub : undefined,
          message: `📌 ${publishedDate} का पूर्ण सत्यापित मंडी समिति पत्रक सुरक्षित है (आज ${date} का नया पत्रक अभी जारी नहीं हुआ है)।`,
        };
      }

      writeSharedPatrak(targetKey, savedEntry);
      negativeSyncCooldown.delete(cacheKey);

      return {
        synced: true,
        foundToday: publishedDate === date,
        date: publishedDate,
        source: `${sourceName} (${usedModel})`,
        sourceUrls,
        patrak: savedEntry,
        message:
          publishedDate === date
            ? `✅ आज (${publishedDate}) के ${validRows.length} जिंसों के ताज़ा भाव (${sourceName}) से स्वतः अद्यतित!`
            : `✅ नवीनतम उपलब्ध मंडी पत्रक (${publishedDate} • ${validRows.length} जिंसें) स्वतः अद्यतित!`,
      };
    } catch (err: any) {
      console.warn('Auto-sync search grounding error:', err?.status, err?.message || err);
      negativeSyncCooldown.set(cacheKey, Date.now() + 2 * 60 * 1000);
      return {
        synced: false,
        foundToday: false,
        date,
        source: `ERR_${err?.status || 'UNKNOWN'}`,
        message: 'लाइव मंडी खोज अभी व्यस्त है — कृपया कुछ सेकंड बाद "ताज़ा करें" दबाएँ।',
      };
    }
  })();

  inFlightAutoSyncs.set(cacheKey, job);
  try {
    return await job;
  } finally {
    inFlightAutoSyncs.delete(cacheKey);
  }
}

app.post('/api/mandi/auto-sync', aiRateLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const mandiId = stripAngleBrackets(body.mandiId || '');
    if (!mandiId || !/^[a-zA-Z0-9_-]{2,100}$/.test(mandiId)) {
      return res.status(400).json({ error: 'INVALID_MANDI_ID', message: 'अमान्य मंडी ID।' });
    }
    const mandiName = stripAngleBrackets(body.mandiName || 'गंजबासौदा कृषि उपज मंडी').slice(0, 150);
    const district = stripAngleBrackets(body.district || 'विदिशा').slice(0, 100);
    const state = stripAngleBrackets(body.state || 'मध्य प्रदेश').slice(0, 100);
    const reqDate = normalizeSlashOrDashToDDMMYYYY(body.date || '') || formatServerDDMMYYYY(getServerIndianNow());
    const arrivalUnit: 'बोरी' | 'क्विंटल' = body.arrivalUnit === 'क्विंटल' ? 'क्विंटल' : 'बोरी';
    const force = Boolean(body.force);

    const result = await performMandiAutoSync({
      mandiId,
      mandiName,
      district,
      state,
      date: reqDate,
      arrivalUnit,
      force,
    });
    return res.json(result);
  } catch (err: any) {
    console.error('/api/mandi/auto-sync error:', err?.message || err);
    return res.status(500).json({
      synced: false,
      foundToday: false,
      message: 'मंडी भाव स्वतः सिंक करने में अस्थायी समस्या आई।',
    });
  }
});

app.get('/api/mandi/live-gov-sync', async (req, res) => {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    return res.json({
      liveFetched: false,
      reason: 'NO_API_KEY',
      message: 'लाइव वेब ऑटो-सिंक सक्रिय है ("पोर्टल सिंक" या "ताज़ा करें" से सीधे आज के भाव प्राप्त होते हैं)।',
    });
  }
  try {
    const state = String(req.query.state || 'Madhya Pradesh');
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${encodeURIComponent(apiKey)}&format=json&filters%5Bstate.keyword%5D=${encodeURIComponent(state)}&limit=50`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) {
      return res.json({
        liveFetched: false,
        reason: `HTTP_${resp.status}`,
        message: `सरकारी पोर्टल ने HTTP ${resp.status} लौटाया।`,
      });
    }
    const payload = await resp.json();
    return res.json({
      liveFetched: true,
      count: Array.isArray(payload?.records) ? payload.records.length : 0,
      records: payload?.records || [],
    });
  } catch (err: any) {
    return res.json({
      liveFetched: false,
      reason: 'NETWORK_BLOCKED',
      message: 'data.gov.in से सीधा कनेक्शन नहीं मिला — लाइव वेब ऑटो-सिंक से भाव खोजे जा रहे हैं।',
    });
  }
});

// Shared lazy Gemini client utility on the server (never fails startup if key is unset initially)
function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Expert Agronomy System Prompt
const AGRONOMY_SYSTEM_PROMPT_HI = `आप "किसान मित्र (Kisan Mitra)" हैं — भारत के शीर्षस्थ कृषि वैज्ञानिक एवं पादप रोग विशेषज्ञ (Senior Agronomist & Plant Pathologist)।
आप भारतीय किसानों के हर प्रश्न का बिल्कुल सटीक, विस्तृत, व्यावहारिक और वैज्ञानिक उत्तर सरल हिंदी में देते हैं (ठीक वैसे ही जैसे एक अनुभवी कृषि विशेषज्ञ किसान को खेत में खड़ा होकर समझाता है)।

महत्वपूर्ण नियम:
1. वॉइस टाइपिंग (Speech-to-Text) की गलतियों को स्वयं समझें:
   - जैसे किसान बोले "कल रतवा" -> इसका अर्थ है "काला रतुआ (Black Rust / Stem Rust)"।
   - "उकता" / "उकटा" -> "उकठा रोग (Fusarium Wilt)"।
   - "हरबसाइड" / "हर्बिसाइड" -> "खरपतवारनाशी (Herbicide)" तथा "महु" -> "माहू / चेपा", "गेहु" -> "गेहूं", "सरसो" -> "सरसों", "जलेबि" -> "जलेबी रोग (थ्रिप्स)"।
2. हर बीमारी/कीट/समस्या के उत्तर की स्पष्ट संरचना रखें:
   - **पहचान एवं कारण:** रोग या कीट का सही हिंदी + अंग्रेज़ी नाम, पहचान के मुख्य लक्षण और किस मौसम/परिस्थिति में तेजी से फैलता है।
   - **असरदार दवाइयां (विकल्प 1, 2, 3, 4):**
     • सबसे कारगर रासायनिक घटक (% सहित),
     • बाज़ार में प्रचलित भरोसेमंद ब्रांड नाम (जैसे Tilt, Folicur, Amistar Top, Dithane M-45, Confidor, Actara, Coragen आदि),
     • **सटीक मात्रा (डोज़):** प्रति एकड़ (150–200 लीटर पानी में) **तथा** प्रति 15 लीटर वाले पंप टंकी के हिसाब से!
   - **जैविक / देसी विकल्प:** यदि प्रारंभिक अवस्था या जैविक खेती के लिए कारगर उपाय हो।
   - **छिड़काव करते समय ध्यान रखने योग्य ज़रूरी बातें:**
     • सही समय (धूप/शाम 4 बजे के बाद मधुमक्खी सुरक्षा),
     • सिलिकॉन स्टीकर (चिपको) मिलाने की सलाह,
     • यूरिया / नाइट्रोजन कब रोकें या कब दें (जैसे रतुआ/फफूंद में यूरिया न डालें!),
     • पानी की मात्रा व दोबारा छिड़काव का अंतराल (12–15 दिन)।
3. यदि प्रश्न सिंचाई, खाद, बीज उपचार या मौसम का हो, तो दिन/अवस्था (जैसे CRI 20-25 दिन) और प्रति एकड़ किग्रा/लीटर मात्रा बिल्कुल स्पष्ट लिखें।
4. टोन आत्मीय, सम्मानजनक और सीधा हो; बिना वजह की एक-जैसी सामान्य बातें न लिखें — केवल पूछे गए सवाल का सटीक समाधान दें। उत्तर लगभग 150 से 220 शब्दों में संक्षिप्त, तेज़ और बिंदुवार रखें ताकि किसान जल्दी पढ़ सके।`;

const AGRONOMY_SYSTEM_PROMPT_EN = `You are "Kisan Mitra", an expert Indian Senior Agronomist & Plant Pathologist.
Give direct, detailed, practical, and scientifically accurate farming advice in clear English tailored to Indian agriculture:
1. Correct obvious voice-typing errors naturally (e.g., "kal ratwa" -> Black Rust / Stem Rust in wheat).
2. Structure disease/pest answers clearly:
   - Identification, Causal Organism & Favorable Weather
   - Recommended Fungicides/Insecticides (Active ingredient %, trusted market brand names, exact dose per acre in 150-200L water AND per 15L knapsack pump)
   - Organic / Preventive option if helpful
   - Critical Spray Precautions (silicon sticker, stopping Urea during fungal outbreaks, evening spray after 4 PM for pollinators, repeat interval).
3. Avoid generic filler; answer the exact question asked with crisp headings and bullet points.`;

async function generateWithModelFallback<T>(
  callForModel: (model: string) => Promise<T>,
  preferredModels: string[] = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen']
): Promise<{ result: T; model: string }> {
  let lastErr: any;

  for (let pass = 0; pass < 2; pass++) {
    for (const model of preferredModels) {
      try {
        const result = await callForModel(model);
        return { result, model };
      } catch (err: any) {
        lastErr = err;
        const msg = String(err?.message || '');
        const status = Number(err?.status || 0);
        const isTransient =
          status === 503 ||
          status === 429 ||
          status === 500 ||
          status === 404 ||
          /UNAVAILABLE|high demand|RESOURCE_EXHAUSTED|NOT_FOUND/i.test(msg);
        if (!isTransient) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, 650));
      }
    }
    if (pass === 0) {
      await new Promise((r) => setTimeout(r, 900));
    }
  }
  throw lastErr;
}

app.post('/api/crop-doctor/chat', aiRateLimiter, async (req, res) => {
  try {
    const { message, language, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY_NOT_CONFIGURED',
        message: 'सर्वर पर Gemini API Key सेट नहीं है।',
      });
    }

    const lang: 'hi' | 'en' = language === 'en' ? 'en' : 'hi';
    const systemInstruction = lang === 'en' ? AGRONOMY_SYSTEM_PROMPT_EN : AGRONOMY_SYSTEM_PROMPT_HI;

    const historyItems = Array.isArray(history)
      ? history
          .slice(-6)
          .filter(
            (h: any) =>
              h &&
              typeof h.text === 'string' &&
              h.text.trim().length > 0 &&
              (h.sender === 'user' || h.sender === 'ai')
          )
          .map((h: any) => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text.trim() }],
          }))
      : [];

    const contents = [
      ...historyItems,
      { role: 'user', parts: [{ text: message.trim() }] },
    ];

    const ai = getAiClient();
    const { result: response, model: usedModel } = await generateWithModelFallback((model) =>
      ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          ...(model === 'gemini-4-hydrogen'
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      })
    );

    const text = (response.text ?? '').trim();
    if (!text) {
      return res.status(502).json({
        error: 'EMPTY_AI_RESPONSE',
        message: 'AI से उत्तर प्राप्त नहीं हुआ। कृपया पुनः प्रयास करें।',
      });
    }

    return res.json({
      reply: text,
      source: 'gemini_ai',
      model: usedModel,
      expertName: lang === 'en' ? 'Kisan Mitra Gemini AI' : 'किसान मित्र (Live Gemini AI विशेषज्ञ)',
      designation: 'Senior AI Agronomist',
    });
  } catch (err: any) {
    console.error('Gemini crop-doctor chat error:', err?.status, err?.message || err);
    return res.status(err?.status && err.status >= 400 && err.status < 600 ? err.status : 502).json({
      error: 'GEMINI_UPSTREAM_ERROR',
      message: err?.message || 'Gemini AI सेवा से जुड़ने में समस्या आई।',
    });
  }
});

// Real Multimodal Crop Disease Diagnosis from Uploaded Leaf/Plant Photo
app.post('/api/crop-doctor/diagnose', aiRateLimiter, async (req, res) => {
  try {
    const { imageBase64, mimeType, language } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY_NOT_CONFIGURED',
        message: 'सर्वर पर Gemini API Key सेट नहीं है।',
      });
    }

    const lang: 'hi' | 'en' = language === 'en' ? 'en' : 'hi';
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const diagnoseSystemInstruction =
      lang === 'en'
        ? `You are an expert Indian plant pathologist & entomologist. Always respond in clear English. Note: If a farmer is holding a crop leaf, stem, pod, or caterpillar/insect in their hand, inspect the leaf and insect closely—never dismiss a hand-held plant photo as non-plant.`
        : `आप भारत के शीर्ष पादप रोग व कीट वैज्ञानिक हैं। सभी JSON फ़ील्ड (crop, name, causes, symptoms, organicRemedy, chemicalTreatment, preventiveMeasures) का पूरा उत्तर सरल और स्पष्ट हिंदी (देवनागरी) में ही दें (केवल रासायनिक नाम/ब्रांड नाम ब्रैकेट में अंग्रेज़ी में लिख सकते हैं, पर कभी भी अंग्रेज़ी वाक्य न लिखें)। विशेष ध्यान: यदि किसान अपने हाथ से पौधे की पत्ती पकड़कर फोटो दिखा रहा है, तो पत्ती, उस पर मौजूद कीट/इल्ली/सुंडी या धब्बों की गहराई से जांच करें—हाथ दिखने के कारण फोटो को कभी 'फसल नहीं है' न बताएं!`;

    const ai = getAiClient();
    const { result: response, model: usedModel } = await generateWithModelFallback((model) =>
      ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text:
                lang === 'en'
                  ? `Analyze this crop/plant/leaf photo carefully. Look closely for caterpillars/larvae, aphids, mites, leaf spots, rust, blight, or nutrient deficiencies even if held in a farmer's hand. Identify the crop, disease/pest visible, severity (low/medium/high), exact symptoms, causes, organic remedies, and exact chemical treatments with trusted Indian market brand names and dose per acre + per 15L pump.`
                  : `इस फोटो में दिखाई गई फसल/पत्ती/कीट की ध्यान से जांच करें (भले ही पत्ती किसान के हाथ में पकड़ी हो)। यदि पत्ती पर कोई हरी/काली इल्ली (सुंडी/Semilooper/Caterpillar), रस चूसक कीट, छेद, पीलापन या धब्बे दिख रहे हैं तो उसकी सटीक पहचान करें। बताएं: फसल का नाम, रोग/कीट का हिंदी व प्रचलित नाम, गंभीरता (low/medium/high), लक्षण, कारण, जैविक उपाय और भारत के भरोसेमंद ब्रांड नामों सहित सटीक दवा व मात्रा (प्रति एकड़ 200 लीटर पानी तथा प्रति 15 लीटर पंप के हिसाब से)। सभी उत्तर हिंदी (देवनागरी) में दें। यदि फोटो में बिल्कुल भी कोई पौधा/पत्ती/कीट न हो, तभी हिंदी में बताएं कि पौधे की फोटो स्पष्ट नहीं है।`,
            },
          ],
        },
        config: {
          systemInstruction: diagnoseSystemInstruction,
          ...(model === 'gemini-4-hydrogen'
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              crop: { type: Type.STRING },
              name: { type: Type.STRING },
              severity: { type: Type.STRING, description: 'low, medium, or high' },
              causes: { type: Type.STRING },
              symptoms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              organicRemedy: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              chemicalTreatment: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              preventiveMeasures: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendedProducts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'crop',
              'name',
              'severity',
              'causes',
              'symptoms',
              'organicRemedy',
              'chemicalTreatment',
              'recommendedProducts',
            ],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim());
    if (!parsed?.name) {
      return res.status(422).json({ error: 'फोटो का विश्लेषण स्पष्ट नहीं हो सका। कृपया पत्ती की साफ फोटो अपलोड करें।' });
    }

    const sev =
      parsed.severity === 'low' || parsed.severity === 'high' ? parsed.severity : 'medium';

    return res.json({
      source: 'gemini_ai',
      model: usedModel,
      diagnosis: {
        id: `ai-scan-${Date.now()}`,
        crop: parsed.crop || (lang === 'hi' ? 'फ़सल' : 'Crop'),
        name: parsed.name,
        severity: sev,
        causes: parsed.causes || '',
        symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
        organicRemedy: Array.isArray(parsed.organicRemedy) ? parsed.organicRemedy : [],
        chemicalTreatment: Array.isArray(parsed.chemicalTreatment) ? parsed.chemicalTreatment : [],
        preventiveMeasures: Array.isArray(parsed.preventiveMeasures) ? parsed.preventiveMeasures : [],
        recommendedProducts: Array.isArray(parsed.recommendedProducts) ? parsed.recommendedProducts : [],
      },
    });
  } catch (err: any) {
    console.error('Gemini crop-doctor diagnose error:', err?.status, err?.message || err);
    return res.status(502).json({
      error: 'GEMINI_DIAGNOSE_ERROR',
      message: err?.message || 'फोटो जांच में समस्या आई। कृपया पुनः प्रयास करें।',
    });
  }
});

// AI Patrak Photo Auto-Reader: extracts exact table rows from uploaded Mandi Committee photo
app.post('/api/mandi/parse-patrak', aiRateLimiter, async (req, res) => {
  try {
    const { imageBase64, mimeType, mandiId, targetDate } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured on server' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `आप एक सटीक डेटा एक्सट्रैक्शन असिस्टेंट हैं। इस मंडी भाव पत्रक (कृषि उपज मंडी समिति दैनिक आवक एवं भाव पत्रक) के फोटो से हर एक नंबर व फसल बिल्कुल सटीक (100% Exact) निकालें।
- तारीख (DD-MM-YYYY फॉर्मेट में, जैसे 16-11-2026)
- कुल अनुबंध व कुल आवक
- आवक की इकाई (बोरी या क्विंटल)
- हर जिंस की पंक्ति: क्रमांक, जिंस का नाम, अनुबंध संख्या, आवक, न्यूनतम भाव, अधिकतम भाव, मॉडल भाव।
कोई भी संख्या अनुमान से न बदलें, केवल जो फोटो में लिखा है वही दें।`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: 'Date in DD-MM-YYYY format' },
            committeeName: { type: Type.STRING, description: 'Name of Mandi committee if visible' },
            totalContracts: { type: Type.INTEGER, description: 'Total contracts count' },
            totalArrival: { type: Type.STRING, description: 'Total arrival formatted with commas' },
            arrivalUnit: { type: Type.STRING, description: 'बोरी or क्विंटल' },
            rows: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sNo: { type: Type.INTEGER },
                  cropName: { type: Type.STRING },
                  contracts: { type: Type.INTEGER },
                  arrival: { type: Type.NUMBER },
                  minPrice: { type: Type.NUMBER },
                  maxPrice: { type: Type.NUMBER },
                  modalPrice: { type: Type.NUMBER },
                },
                required: ['sNo', 'cropName', 'contracts', 'arrival', 'minPrice', 'maxPrice', 'modalPrice'],
              },
            },
          },
          required: ['date', 'rows'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    if (!parsed.rows || !Array.isArray(parsed.rows) || parsed.rows.length === 0) {
      return res.status(422).json({ error: 'पत्रक की तालिका स्पष्ट नहीं पढ़ी जा सकी। कृपया साफ फोटो अपलोड करें।' });
    }

    // Persist to shared server store if mandiId is provided so all app users get it
    if (mandiId && typeof mandiId === 'string') {
      const saveDate = (typeof targetDate === 'string' && targetDate) || parsed.date;
      if (saveDate) {
        const unit = parsed.arrivalUnit === 'क्विंटल' ? 'क्विंटल' : 'बोरी';
        const rowsNormalized = parsed.rows.map((r: any, idx: number) => ({
          sNo: Number(r.sNo) || idx + 1,
          cropName: String(r.cropName || ''),
          contracts: Number(r.contracts) || 0,
          arrival: Number(r.arrival) || 0,
          arrivalUnit: unit,
          minPrice: Number(r.minPrice) || 0,
          maxPrice: Number(r.maxPrice) || 0,
          modalPrice: Number(r.modalPrice) || 0,
          yesterdayPrice: 0,
          priceChange: 0,
          msp: '-',
        }));
        writeSharedPatrak(`${mandiId}__${saveDate}`, {
          mandiId,
          date: saveDate,
          totalContracts:
            parsed.totalContracts ||
            rowsNormalized.reduce((s: number, x: any) => s + Number(x.contracts || 0), 0),
          totalArrival:
            parsed.totalArrival ||
            String(rowsNormalized.reduce((s: number, x: any) => s + Number(x.arrival || 0), 0)),
          arrivalUnit: unit,
          releaseTime: `सायं पत्रक स्कैन द्वारा अद्यतित (${parsed.date || saveDate})`,
          rows: rowsNormalized,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error('Patrak parse error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'पत्रक पढ़ने में समस्या आई।' });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const distIndex = path.resolve('.', 'dist', 'index.html');
  const hasDist = fs.existsSync(distIndex);

  if (isProduction && hasDist) {
    console.log('Serving production static build from dist');
    app.use(express.static(path.resolve('.', 'dist')));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/dl')) {
        return next();
      }
      res.sendFile(distIndex);
    });
  } else {
    console.log('Mounting Vite middleware in development mode');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: false,
      },
      appType: 'spa',
    });
    // Serve a clean no-WebSocket @vite/client shim when HMR is disabled so Vite 8
    // does not attempt wss://...:24678 and throw "WebSocket closed without opened."
    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(`const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style && style.parentNode) {
    style.parentNode.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url) { return url; }
export class ErrorOverlay {}
`);
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }

      const url = req.originalUrl;
      try {
        const indexPath = path.resolve('.', 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
          return;
        }
        next();
      } catch (e: any) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kisan Setu full-stack server running on http://0.0.0.0:${PORT}`);
    startMandiBackgroundScheduler();
  });
}

const PRIORITY_AUTO_SYNC_MANDIS: Array<{
  mandiId: string;
  mandiName: string;
  district: string;
  state: string;
  arrivalUnit: 'बोरी' | 'क्विंटल';
}> = [
  { mandiId: 'mp-vidisha-ganjbasoda', mandiName: 'गंजबासौदा (कृषि उपज मंडी)', district: 'विदिशा', state: 'मध्य प्रदेश', arrivalUnit: 'बोरी' },
  { mandiId: 'mp-vidisha-vidisha', mandiName: 'विदिशा (मुख्य मंडी)', district: 'विदिशा', state: 'मध्य प्रदेश', arrivalUnit: 'क्विंटल' },
  { mandiId: 'mp-vidisha-sironj', mandiName: 'सिरोंज (मुख्य मंडी)', district: 'विदिशा', state: 'मध्य प्रदेश', arrivalUnit: 'क्विंटल' },
  { mandiId: 'mp-sehore-sehore', mandiName: 'सीहोर (मुख्य मंडी)', district: 'सीहोर', state: 'मध्य प्रदेश', arrivalUnit: 'क्विंटल' },
  { mandiId: 'mp-bhopal-karond', mandiName: 'भोपाल करोंद मंडी', district: 'भोपाल', state: 'मध्य प्रदेश', arrivalUnit: 'क्विंटल' },
  { mandiId: 'mp-raisen-raisen', mandiName: 'रायसेन (मुख्य मंडी)', district: 'रायसेन', state: 'मध्य प्रदेश', arrivalUnit: 'क्विंटल' },
  { mandiId: 'mp-sagar-sagar', mandiName: 'सागर (मुख्य मंडी)', district: 'सागर', state: 'मध्य प्रदेश', arrivalUnit: 'क्विंटल' },
  { mandiId: 'mp-neemuch-neemuch', mandiName: 'नीमच (मुख्य मंडी)', district: 'नीमच', state: 'मध्य प्रदेश', arrivalUnit: 'क्विंटल' },
  { mandiId: 'mp-mandsaur-mandsaur', mandiName: 'मंदसौर (मुख्य मंडी)', district: 'मंदसौर', state: 'मध्य प्रदेश', arrivalUnit: 'क्विंटल' },
];

const schedulerWindowDone = new Set<string>();
let schedulerRunning = false;

async function runScheduledMandiAutoSync(): Promise<void> {
  if (schedulerRunning) return;
  if (!process.env.GEMINI_API_KEY && !process.env.DATA_GOV_API_KEY) return;

  const ist = getServerIndianNow();
  const day = ist.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return;

  const mins = ist.getHours() * 60 + ist.getMinutes();
  const slot = mins >= 17 * 60 + 35 ? 'evening' : mins >= 13 * 60 + 15 ? 'midday' : null;
  if (!slot) return;

  const todayStr = formatServerDDMMYYYY(ist);
  schedulerRunning = true;
  try {
    for (const m of PRIORITY_AUTO_SYNC_MANDIS) {
      const slotKey = `${todayStr}__${slot}__${m.mandiId}`;
      if (schedulerWindowDone.has(slotKey)) continue;
      schedulerWindowDone.add(slotKey);

      const stored = readSharedPatraks()[`${m.mandiId}__${todayStr}`];
      // Skip if already refreshed during evening slot or fresh in last 3h
      if (stored && slot === 'midday') continue;

      try {
        await performMandiAutoSync({
          ...m,
          date: todayStr,
          force: slot === 'evening',
        });
      } catch {
        // continue with next mandi
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  } finally {
    schedulerRunning = false;
  }
}

function startMandiBackgroundScheduler(): void {
  // Initial check 12s after startup so live Render instances catch up today's rates automatically
  setTimeout(() => {
    runScheduledMandiAutoSync().catch(() => {});
  }, 12 * 1000);

  // Periodic check every 15 minutes for 1:15 PM & 5:35 PM IST auto-sync windows
  setInterval(() => {
    runScheduledMandiAutoSync().catch(() => {});
  }, 15 * 60 * 1000);
}

startServer();
