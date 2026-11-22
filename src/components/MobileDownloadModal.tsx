import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  Share2,
  Copy,
  Check,
  X,
  QrCode,
  Sparkles,
  ExternalLink,
  Volume2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

interface MobileDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrivacy?: () => void;
}

export const MobileDownloadModal: React.FC<MobileDownloadModalProps> = ({ isOpen, onClose, onOpenPrivacy }) => {
  const { language, speakText } = useLanguage();
  const { isInstallable, isInstalled, install, isIOS, isAndroid } = usePWAInstall();

  const [activeOS, setActiveOS] = useState<'troubleshoot' | 'android' | 'ios' | 'apk'>('troubleshoot');
  const [copied, setCopied] = useState(false);
  const [dlStatus, setDlStatus] = useState<string | null>(null);

  const PERMANENT_GITHUB_URL = 'https://eevanventures-sketch.github.io/Kisan-setu/';

  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : PERMANENT_GITHUB_URL;

  const isDevSandbox = currentOrigin.includes('ais-dev-');

  // Never hand out sleeping ais-dev sandbox URL as a "24/7 permanent link"
  const targetAppUrl = isDevSandbox ? PERMANENT_GITHUB_URL : currentOrigin;

  // For QR code, encode the 24/7 permanent URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    targetAppUrl
  )}&bgcolor=ffffff&color=166534&margin=10`;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenPermanentLink = () => {
    if (typeof window !== 'undefined') {
      window.open(targetAppUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDirectInstall = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  const handleBlobDownload = async (filename: 'index.html' | 'index.js' | 'index.css' | 'sw.js') => {
    try {
      setDlStatus(`${filename} डाउनलोड हो रहा है...`);
      const res = await fetch(`/dl/${filename}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      setDlStatus(`✅ ${filename} आपके Downloads में सेव हो गई!`);
    } catch {
      setDlStatus(`⚠️ कृपया नीचे "डाउनलोड पेज खोलें" बटन का उपयोग करें।`);
    }
  };

  const handleSpeakSteps = () => {
    const speech =
      language === 'hi'
        ? 'किसान भाई ध्यान दें: जब चैट बंद रहती है, तो अस्थायी डेवलपर लिंक स्लीप हो जाता है। इसलिए हमने स्थायी 24/7 लिंक उपलब्ध कराई है जो कभी बंद नहीं होती। इस लिंक को फोन के क्रोम में खोलकर ऐड टू होम स्क्रीन करें।'
        : 'Important: The development link goes to sleep when chat is inactive. Use our permanent 24/7 link which never sleeps to add to home screen.';
    speakText(speech);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-emerald-100 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center shadow-md shrink-0">
            <Smartphone className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                मोबाइल ऐप स्थायी लिंक
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">24/7 स्थायी</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-950">
              {language === 'hi' ? 'स्थायी 24/7 मोबाइल ऐप (Add to Home Screen)' : '24/7 Permanent Mobile App'}
            </h3>
          </div>
        </div>

        {/* Why ais-dev sleeps vs 24/7 permanent hosting notice */}
        {isDevSandbox && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3.5 mb-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-amber-950">
                <span className="font-black text-sm block">
                  {language === 'hi'
                    ? '⚠️ चैट बंद होने पर ऐप क्यों बंद होता है? (और 24 घंटे कैसे चलाएं)'
                    : '⚠️ Why Preview Sleeps When Chat Closes (and How to Run 24/7)'}
                </span>
                <p className="leading-relaxed">
                  {language === 'hi' ? (
                    <>
                      अभी आप अस्थायी टेस्ट लिंक (<code>ais-dev</code>) पर हैं — यह चैट बंद होते ही स्लीप हो जाता है। <strong>24 घंटे कभी बंद न होने</strong> के लिए केवल ये 2 पक्के तरीके हैं:<br />
                      <strong>1. AI Studio से 1-क्लिक Deploy (पूरे AI के साथ 24/7):</strong> AI Studio में ऊपर दाईं ओर <strong>Share / Deploy</strong> बटन दबाएं — आपको पक्की <code>run.app</code> लिंक मिलेगी जो चैट बंद होने पर भी कभी बंद नहीं होगी।<br />
                      <strong>2. आपकी 24/7 वेबसाइट (नीचे दी लिंक):</strong> <code>github.io/Kisan-setu</code> कभी बंद नहीं होती — बस नीचे से नई <strong>index.js</strong> व <strong>index.css</strong> डाउनलोड करके GitHub पर डाल दें।
                    </>
                  ) : (
                    <>
                      You are currently on the temporary <code>ais-dev</code> sandbox, which sleeps when chat closes. Use AI Studio&apos;s top-right <strong>Share / Deploy</strong> button for a 24/7 Cloud Run URL, or update your 24/7 GitHub Pages site below.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Direct Mobile Solution Alert */}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3.5 mb-4 text-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-emerald-950 text-sm block">
                {language === 'hi'
                  ? '📱 मोबाइल पर ऐप चलाने व शेयर करने की सरल विधि:'
                  : '📱 Simple Steps to Use & Share on Mobile:'}
              </span>
              <p className="text-emerald-900 mt-1 leading-relaxed">
                {language === 'hi' ? (
                  <>
                    <strong>1. होम स्क्रीन पर ऐप जोड़ने के लिए:</strong> अपने मोबाइल के Google Chrome ब्राउज़र में सबसे ऊपर <strong>3 बिंदु (⋮)</strong> दबाएं और <strong>"Add to Home screen" (होम स्क्रीन में जोड़ें)</strong> या <strong>"Install app"</strong> चुनें।<br />
                    <strong>2. व्हाट्सएप पर भाव पत्रक शेयर करने के लिए:</strong> भाव पत्रक के ठीक ऊपर हरा <strong>"📲 व्हाट्सएप शेयर"</strong> बटन दबाएं।<br />
                    <strong>3. 100% आधिकारिक पत्रक:</strong> इसमें कोई भी व्यक्ति छेड़छाड़ नहीं कर सकता।
                  </>
                ) : (
                  <>
                    <strong>1. Add to Home Screen:</strong> In mobile Chrome, tap the 3 dots (⋮) in the top-right corner and select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.<br />
                    <strong>2. WhatsApp Sharing:</strong> Tap the green <strong>"Share on WhatsApp"</strong> button directly above the Mandi bulletin.<br />
                    <strong>3. Tamper-Proof:</strong> Certified 100% official APMC bulletin data.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* If browser supports direct 1-click install */}
        {isInstallable && (
          <div className="bg-gradient-to-r from-emerald-700 to-green-800 text-white p-4 rounded-xl shadow-xs mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="font-extrabold text-sm block">
                {language === 'hi' ? '✨ एक क्लिक में ऐप इंस्टॉल करें' : '✨ 1-Click Install App'}
              </span>
              <span className="text-xs text-emerald-100">
                {language === 'hi' ? 'सीधे अपने फोन में इंस्टॉल करें' : 'Install directly on your phone'}
              </span>
            </div>
            <button
              onClick={handleDirectInstall}
              className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'hi' ? 'अभी इंस्टॉल करें' : 'Install Now'}</span>
            </button>
          </div>
        )}

        {/* QR Code and Mobile Link Sharing */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-28 h-28 bg-white p-2 rounded-xl border border-emerald-200 shadow-2xs shrink-0 flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="Scan on mobile for 24/7 App"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <span className="text-xs font-bold text-emerald-950 flex items-center justify-center sm:justify-start gap-1">
                <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                {language === 'hi' ? 'स्थायी 24/7 QR कोड स्कैन करें' : 'Scan 24/7 Permanent QR Code'}
              </span>
              <p className="text-[11px] text-gray-600 mt-1 leading-snug">
                {language === 'hi'
                  ? 'कैमरे से स्कैन करें या नीचे दी गई स्थायी 24/7 लिंक को कॉपी करके Chrome में खोलें:'
                  : 'Scan or copy the 24/7 permanent link below to open in Chrome:'}
              </p>

              <div className="mt-2.5 flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={targetAppUrl}
                  className="w-full px-2 py-1.5 text-[10px] bg-white border border-gray-300 rounded-lg text-emerald-900 font-mono select-all truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  title="स्थायी लिंक कॉपी करें"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (language === 'hi' ? 'कॉपी हुआ' : 'Copied') : (language === 'hi' ? 'कॉपी' : 'Copy')}</span>
                </button>
              </div>

              {/* Direct Open Button */}
              <div className="mt-2">
                <button
                  onClick={handleOpenPermanentLink}
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                  <span>{language === 'hi' ? '🚀 स्थायी लिंक नए टैब में खोलें' : '🚀 Open Permanent App in New Tab'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Operating System Selector Tabs */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveOS('troubleshoot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeOS === 'troubleshoot'
                  ? 'bg-amber-500 text-emerald-950 shadow-2xs'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
            >
              🛠️ समाधान (Fix)
            </button>
            <button
              onClick={() => setActiveOS('android')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeOS === 'android'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🤖 Android Chrome
            </button>
            <button
              onClick={() => setActiveOS('apk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeOS === 'apk'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 ओरिजिनल .APK
            </button>
            <button
              onClick={() => setActiveOS('ios')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeOS === 'ios'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🍎 iPhone
            </button>
          </div>

          <button
            onClick={handleSpeakSteps}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-100 text-emerald-900 transition-colors"
            title="आवाज में निर्देश सुनें"
          >
            <Volume2 className="w-4 h-4 text-emerald-700" />
          </button>
        </div>

        {/* Tab 1: Troubleshooting Fix */}
        {activeOS === 'troubleshoot' && (
          <div className="space-y-3 text-xs text-gray-800 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
            <div className="bg-white p-3 rounded-xl border border-emerald-300 space-y-2.5">
              <div className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-700" />
                <span>GitHub के लिए 4 ज़रूरी फ़ाइलें डाउनलोड करें:</span>
              </div>
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-2 text-[11px] text-amber-950 leading-snug">
                ⚠️ <strong>सावधानी:</strong> डाउनलोड से पहले फ़ोन के <strong>Downloads</strong> फ़ोल्डर से पुरानी <code>index*</code> व <code>sw.js</code> फ़ाइलें डिलीट करें (वरना Chrome नाम <code>index (1).js</code> बना देता है)।
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleBlobDownload('index.html')}
                  className="py-2 px-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>1. index.html</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBlobDownload('index.js')}
                  className="py-2 px-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>2. index.js</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBlobDownload('index.css')}
                  className="py-2 px-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>3. index.css</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBlobDownload('sw.js')}
                  className="py-2 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>4. sw.js</span>
                </button>
              </div>
              {dlStatus && (
                <p className="text-[11px] font-bold text-emerald-800">{dlStatus}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="/dl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-3 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-300"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>डाउनलोड पेज (/dl) खोलें</span>
                </a>
                <a
                  href="https://github.com/eevanventures-sketch/Kisan-setu/upload/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>GitHub पर अपलोड करें</span>
                </a>
              </div>
            </div>

            <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>होम स्क्रीन पर सही तरीके से चलाने के 3 कदम:</span>
            </h4>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-gray-900 block">पुराना होम स्क्रीन आइकन हटाएं:</strong>
                  <span className="text-gray-600">
                    यदि पहले वाला आइकन ब्लैंक या सफेद आ रहा है, तो फोन की स्क्रीन पर उस आइकन को दबाकर रखें और <strong>Remove (हटाएं)</strong> कर दें।
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-gray-900 block">लाइव लिंक को Chrome में खोलें:</strong>
                  <span className="text-gray-600">
                    ऊपर दी गई <strong>लाइव लिंक</strong> को अपने फोन के Google Chrome ब्राउज़र में खोलें।
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-gray-900 block">अब 'Install app' या 'Add to Home screen' करें:</strong>
                  <span className="text-gray-600">
                    Chrome में ऊपर 3 डॉट्स (⋮) दबाकर <strong>Install app (ऐप इंस्टॉल करें)</strong> चुनें। अब आपका ऐप हमेशा सुपर फास्ट खुलेगा!
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Android Chrome */}
        {activeOS === 'android' && (
          <div className="space-y-2.5 text-xs text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="font-bold text-sm text-emerald-950 mb-2">
              एंड्रॉइड फोन (Chrome) में इंस्टॉलेशन चरण:
            </h4>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                1
              </span>
              <div>
                <span className="font-extrabold text-gray-900 block">Google Chrome में खोलें</span>
                <span className="text-gray-500">अपने फोन के Chrome ब्राउज़र में लिंक खोलें।</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                2
              </span>
              <div>
                <span className="font-extrabold text-gray-900 block">3 बिन्दुओं (⋮) पर क्लिक करें</span>
                <span className="text-gray-500">ऊपर दायें कोने में मेन्यू दबाएं और "Install app" चुनें।</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                3
              </span>
              <div>
                <span className="font-extrabold text-gray-900 block">इंस्टॉल दबाएं</span>
                <span className="text-gray-500">ऐप का हरा किसान सेतु लोगो आपके मोबाइल की स्क्रीन पर आ जाएगा।</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: APK Generation */}
        {activeOS === 'apk' && (
          <div className="space-y-3 text-xs text-gray-800 bg-amber-50/80 p-4 rounded-xl border border-amber-300">
            <h4 className="font-black text-sm text-amber-950 flex items-center gap-1.5">
              <span>📦 24 घंटे चलने वाली असली Android .APK फाइल</span>
            </h4>
            <p className="text-gray-800 leading-relaxed">
              अगर आप चाहते हैं कि यह ऐप <strong>बिना किसी चैट या सर्वर के 24 घंटे किसी भी समय हमेशा चले</strong>, तो इसकी असली <strong>.APK फाइल</strong> अपने फोन में डाउनलोड करके इंस्टॉल कर लें:
            </p>

            <div className="bg-white p-3.5 rounded-xl border border-amber-300 space-y-3">
              <a
                href={`https://www.pwabuilder.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-xl text-center flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 cursor-pointer"
              >
                <span>🚀 PWABuilder से 1-क्लिक में .APK बनाएं</span>
                <ExternalLink className="w-4 h-4 text-amber-300" />
              </a>

              <div className="space-y-1.5 text-gray-700 text-[11px]">
                <p className="font-bold text-gray-900">आसान 3 कदम:</p>
                <p>1. ऊपर दिए गए हरे बटन पर क्लिक करें (PWABuilder खुलेगा)।</p>
                <p>2. सर्च बॉक्स में यह लिंक पेस्ट करें: <code className="bg-gray-100 px-1 py-0.5 rounded text-emerald-900 font-mono text-[10px] select-all">{targetAppUrl}</code></p>
                <p>3. <strong>"Package for Android"</strong> पर क्लिक करें — तुरंत <strong>.APK फाइल</strong> आपके फोन में डाउनलोड हो जाएगी!</p>
                <p>4. डाउनलोड होने के बाद उस .APK फाइल पर क्लिक करके इंस्टॉल कर लें।</p>
              </div>
            </div>

            <div className="bg-emerald-100/70 p-2.5 rounded-lg border border-emerald-300 text-[11px] text-emerald-950 font-semibold">
              ✅ .APK इंस्टॉल होने के बाद ऐप 100% आपके फोन से चलेगा — सर्वर बंद होने या चैट खत्म होने का इस पर कोई असर नहीं होगा!
            </div>
          </div>
        )}

        {/* Tab 4: iOS */}
        {activeOS === 'ios' && (
          <div className="space-y-2.5 text-xs text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="font-bold text-sm text-emerald-950 mb-2">iPhone (Safari):</h4>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                1
              </span>
              <div>
                <span className="font-extrabold text-gray-900 block">Safari में खोलें</span>
                <span className="text-gray-500">आईफोन में Safari ब्राउज़र का उपयोग करें।</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                2
              </span>
              <div>
                <span className="font-extrabold text-gray-900 block">Share (शेयर) बटन ⎋ दबाएं</span>
                <span className="text-gray-500">नीचे शेयर आइकन दबाएं।</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                3
              </span>
              <div>
                <span className="font-extrabold text-gray-900 block">"Add to Home Screen" चुनें</span>
                <span className="text-gray-500">ऊपर 'Add' दबाएं, ऐप इंस्टॉल हो जाएगा।</span>
              </div>
            </div>
          </div>
        )}

        {/* Benefits reminder */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-900">
          <span className="flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% सुरक्षित • कोई विज्ञापन नहीं
          </span>
          <div className="flex items-center gap-3">
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrivacy();
                }}
                className="font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
              >
                🛡️ प्राइवेसी पॉलिसी (Play Store)
              </button>
            )}
            <span className="font-medium text-gray-500">ऑफ़लाइन सपोर्टेड</span>
          </div>
        </div>
      </div>
    </div>
  );
};
