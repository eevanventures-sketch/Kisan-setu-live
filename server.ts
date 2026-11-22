import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT =
  process.env.NODE_ENV === 'production' && process.env.PORT
    ? Number(process.env.PORT)
    : 3000;

app.use(express.json({ limit: '25mb' }));

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
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

function writeSharedPatrak(key: string, entry: any): void {
  try {
    if (!fs.existsSync(SHARED_PATRAK_DIR)) {
      fs.mkdirSync(SHARED_PATRAK_DIR, { recursive: true });
    }
    const all = readSharedPatraks();
    all[key] = entry;
    fs.writeFileSync(SHARED_PATRAK_FILE, JSON.stringify(all, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('Could not persist shared patrak:', err?.message);
  }
}

app.get('/api/mandi/shared-patraks', (_req, res) => {
  res.json({ patraks: readSharedPatraks() });
});

app.get('/api/mandi/live-gov-sync', async (req, res) => {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    return res.json({
      liveFetched: false,
      reason: 'NO_API_KEY',
      message: 'आधिकारिक data.gov.in API Key सेट नहीं है (या सर्वर भारत से बाहर है)। फोटो स्कैन द्वारा पत्रक अपडेट उपलब्ध है।',
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
      message: 'इस क्लाउड रीजन से data.gov.in कनेक्ट नहीं हो सका (भारतीय सर्वर पर होस्ट करने पर स्वतः जुड़ेगा)।',
    });
  }
});

// Shared Gemini client utility on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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
  callForModel: (model: string) => Promise<T>
): Promise<{ result: T; model: string }> {
  const models = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
  let lastErr: any;

  for (const model of models) {
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
    }
  }
  throw lastErr;
}

app.post('/api/crop-doctor/chat', async (req, res) => {
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
app.post('/api/crop-doctor/diagnose', async (req, res) => {
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
app.post('/api/mandi/parse-patrak', async (req, res) => {
  try {
    const { imageBase64, mimeType, mandiId, targetDate } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured on server' });
    }

    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
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
  });
}

startServer();
