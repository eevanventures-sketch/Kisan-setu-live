import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PhoneCall, VolumeX, Sprout, MapPin, Share2 } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onOpenDownload: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDownload }) => {
  const { language, setLanguage, t, isSpeaking, stopSpeaking } = useLanguage();

  const handleShareApp = async () => {
    const origin =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('ais-dev-')
        ? window.location.href.split('#')[0]
        : 'https://eevanventures-sketch.github.io/Kisan-setu/';
    const shareText =
      language === 'hi'
        ? `🌾 *किसान सेतु (Kisan Setu) ऐप* — मंडी भाव पत्रक, AI फसल डॉक्टर, मौसम चेतावनी और खाद-बीज कैलकुलेटर अब एक ही जगह!\n\n📲 अभी खोलें और फोन में इंस्टॉल करें:\n${origin}`
        : `🌾 *Kisan Setu App* — Mandi prices, AI Crop Doctor, weather alerts & fertilizer calculator!\n\n📲 Open & install now:\n${origin}`;

    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: 'किसान सेतु (Kisan Setu)',
          text: shareText,
          url: origin,
        });
        return;
      } catch {
        // Fallback to WhatsApp if cancelled/unsupported
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="bg-white border-b border-emerald-100 sticky top-0 z-40 shadow-xs">
      {/* Top Kisan Toll-Free Bar */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 text-white text-xs sm:text-sm px-3 py-1.5 font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>{t.kisanHelpline[language]}</span>
              <a
                href="tel:18001801551"
                className="font-bold underline text-amber-200 hover:text-white transition-colors tracking-wide ml-1"
              >
                1800-180-1551 (टोल-फ्री)
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleShareApp}
              className="bg-emerald-950/70 hover:bg-emerald-950 text-amber-200 border border-emerald-500/40 px-2.5 py-0.5 rounded font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="किसान भाइयों को ऐप भेजें"
            >
              <Share2 className="w-3 h-3" />
              <span>{language === 'hi' ? 'ऐप शेयर करें' : 'Share App'}</span>
            </button>
            <button
              onClick={onOpenDownload}
              className="bg-amber-400 hover:bg-amber-300 text-emerald-950 px-2.5 py-0.5 rounded font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <span>📲</span>
              <span>{language === 'hi' ? 'मोबाइल में डाउनलोड करें' : 'Download Mobile App'}</span>
            </button>
            <div className="hidden sm:flex items-center gap-1 bg-emerald-900/40 px-2 py-0.5 rounded text-emerald-100">
              <MapPin className="w-3 h-3 text-emerald-300" />
              <span>{language === 'hi' ? 'कृषि हब: भारत' : 'Agri Region: India'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight flex items-center gap-1.5">
                  {t.appName[language]}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Smart 2.0
                  </span>
                </h1>
              </div>
              <p className="text-xs text-emerald-800/80 font-medium hidden sm:block">
                {t.tagline[language]} • {t.subTagline[language]}
              </p>
            </div>
          </div>

          {/* Right Actions: Download Button, Voice Reader Indicator, Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenDownload}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>📲</span>
              <span>{language === 'hi' ? 'फोन में इंस्टॉल करें' : 'Install on Phone'}</span>
            </button>

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors animate-pulse"
                title="Stop Audio"
              >
                <VolumeX className="w-4 h-4 text-red-600" />
                <span>{t.stopSpeaking[language]}</span>
              </button>
            )}

            {/* Language Switcher Button */}
            <div className="flex items-center bg-emerald-50 border border-emerald-200 p-0.5 rounded-lg shadow-2xs">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  language === 'hi'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-emerald-900 hover:bg-emerald-100/60'
                }`}
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-emerald-900 hover:bg-emerald-100/60'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
