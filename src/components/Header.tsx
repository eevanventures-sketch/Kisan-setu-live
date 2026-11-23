import React from 'react';
import { User } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import { UserProfileData } from '../firebase';
import { PhoneCall, VolumeX, Sprout, MapPin, Share2, UserCheck, LogIn } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onOpenDownload: () => void;
  user: User | null;
  userProfile: UserProfileData | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDownload,
  user,
  userProfile,
  onOpenAuth,
}) => {
  const { language, setLanguage, t, isSpeaking, stopSpeaking } = useLanguage();

  const displayFirstName = (
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'प्रोफाइल'
  )
    .trim()
    .split(/\s+/)[0]
    .slice(0, 14);

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
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-2xl font-black text-emerald-950 tracking-tight flex items-center gap-1.5 truncate">
                  {t.appName[language]}
                  <span className="hidden xs:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Smart 2.0
                  </span>
                </h1>
              </div>
              <p className="text-xs text-emerald-800/80 font-medium hidden sm:block truncate">
                {t.tagline[language]} • {t.subTagline[language]}
              </p>
            </div>
          </div>

          {/* Right Actions: Auth/Profile, Download Button, Voice Reader Indicator, Language Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenAuth}
              className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${
                user
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-emerald-950 border-amber-300'
              }`}
              title={user ? 'अपनी किसान प्रोफाइल व खाता सुरक्षा देखें' : 'Google से सुरक्षित लॉगिन करें'}
            >
              {user ? (
                <>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={displayFirstName}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover border border-emerald-500"
                    />
                  ) : (
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                  )}
                  <span className="max-w-[78px] sm:max-w-[110px] truncate">{displayFirstName}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-emerald-800" />
                  <span>{language === 'hi' ? 'लॉगिन' : 'Sign In'}</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenDownload}
              className="hidden md:flex min-h-[40px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>📲</span>
              <span>{language === 'hi' ? 'फोन में इंस्टॉल करें' : 'Install on Phone'}</span>
            </button>

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors animate-pulse"
                title="Stop Audio"
              >
                <VolumeX className="w-4 h-4 text-red-600" />
                <span className="hidden sm:inline">{t.stopSpeaking[language]}</span>
              </button>
            )}

            {/* Language Switcher Button */}
            <div className="flex items-center bg-emerald-50 border border-emerald-200 p-0.5 rounded-xl shadow-2xs min-h-[40px]">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-emerald-900 hover:bg-emerald-100/60'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
