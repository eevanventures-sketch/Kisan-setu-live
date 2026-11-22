import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { TabKey } from './Navigation';
import { mockWeatherForecast } from '../data/mockData';
import { getPatrakForDate, getFavoriteMandi, mergeSharedPatraks } from '../data/patrakData';
import { subscribeToMandiPatraks } from '../firebase';
import {
  TrendingUp,
  Stethoscope,
  CloudSun,
  Landmark,
  Store,
  Calculator,
  BookOpen,
  Volume2,
  ArrowRight,
  Calendar,
  Sparkles,
  Flame,
  Share2,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { formatHindiDate, formatEnglishDate, getIndianNow } from '../utils/dateUtils';

interface DashboardProps {
  onNavigate: (tab: TabKey) => void;
  onOpenDownload?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenDownload }) => {
  const { language, t, speakText } = useLanguage();
  const [cloudVersion, setCloudVersion] = React.useState(0);

  React.useEffect(() => {
    const unsub = subscribeToMandiPatraks((cloudPatraks) => {
      if (mergeSharedPatraks(cloudPatraks) > 0) {
        setCloudVersion((v) => v + 1);
      }
    });
    return () => unsub();
  }, []);

  const todayWeather = mockWeatherForecast[0];
  const istNow = getIndianNow();
  const seasonLabel = `${istNow.getFullYear()}-${istNow.getFullYear() + 1}`;
  const favMandiId = getFavoriteMandi()?.mandiId || 'mp-vidisha-ganjbasoda';
  const ganjPatrak = React.useMemo(
    () => getPatrakForDate(favMandiId, 'today'),
    [favMandiId, cloudVersion]
  );
  const topPatrakRows = (ganjPatrak.rows || []).filter((r) => r.modalPrice > 0).slice(0, 5);

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('ais-dev-')
        ? window.location.href.split('#')[0]
        : 'https://eevanventures-sketch.github.io/Kisan-setu/';
    const msg = `🌾 *किसान सेतु ऐप* — रोज़ाना मंडी भाव पत्रक, AI फसल डॉक्टर, मौसम चेतावनी व खाद कैलकुलेटर!\n\n📲 अपने फोन में खोलने व इंस्टॉल करने के लिए दबाएं:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const dailyAdvisoryText =
    language === 'hi'
      ? 'आज की कृषि सलाह: मौसम साफ है। गेहूं की बुवाई में प्रति एकड़ 3 बोरी एसएसपी व 1 बोरी यूरिया का संतुलित प्रयोग करें। सरसों में माहू (चेपा) कीट की निगरानी हेतु पीले ट्रैप लगाएं। कीटनाशक छिड़काव के लिए आज का दिन अत्यंत अनुकूल है।'
      : "Today's Farm Advisory: Weather is clear and favorable. Use balanced fertilizer for wheat sowing. Deploy yellow sticky traps in mustard fields for aphid monitoring. Safe conditions for foliar sprays.";

  const quickServices = [
    {
      tab: 'cropDoctor' as TabKey,
      title: language === 'hi' ? 'एआई फसल डॉक्टर' : 'AI Crop Doctor',
      desc: language === 'hi' ? 'पत्ती की फोटो से रोग पहचानें व दवा जानें' : 'Diagnose plant disease from leaf photo',
      icon: Stethoscope,
      color: 'from-amber-500 to-orange-600',
      badge: 'एआई जांच',
    },
    {
      tab: 'mandi' as TabKey,
      title: language === 'hi' ? 'लाइव मंडी भाव' : 'Live Mandi Bhav',
      desc: language === 'hi' ? 'गेहूं, सरसों, सोयाबीन आदि के ताजा भाव' : 'Live prices for wheat, mustard & crops',
      icon: TrendingUp,
      color: 'from-emerald-600 to-green-700',
      badge: 'आज के भाव',
    },
    {
      tab: 'calculator' as TabKey,
      title: language === 'hi' ? 'खाद-बीज कैलकुलेटर' : 'Fertilizer Calculator',
      desc: language === 'hi' ? 'एकड़/बीघा में यूरिया, डीएपी व बीज मात्रा' : 'Precise NPK & seed dose for your field',
      icon: Calculator,
      color: 'from-blue-600 to-indigo-700',
      badge: 'सटीक बचत',
    },
    {
      tab: 'schemes' as TabKey,
      title: language === 'hi' ? 'सरकारी योजनाएं' : 'Govt Schemes',
      desc: language === 'hi' ? 'PM किसान, KCC, सोलर पंप सब्सिडी' : 'PM-Kisan, KCC, Solar Pump & SMAM',
      icon: Landmark,
      color: 'from-purple-600 to-violet-700',
      badge: 'सब्सिडी',
    },
    {
      tab: 'bazaar' as TabKey,
      title: language === 'hi' ? 'किसान बाज़ार व किराया' : 'Agri Bazaar & Rental',
      desc: language === 'hi' ? 'उपज बेचें, ट्रैक्टर व ड्रोन किराए पर लें' : 'Sell produce & rent farm machinery',
      icon: Store,
      color: 'from-teal-600 to-emerald-800',
      badge: 'सीधी बिक्री',
    },
    {
      tab: 'ledger' as TabKey,
      title: language === 'hi' ? 'किसान बही-खाता' : 'Farm Ledger (Diary)',
      desc: language === 'hi' ? 'खेती के खर्च, आमदनी व मुनाफे का हिसाब' : 'Track expenses, income & net profit',
      icon: BookOpen,
      color: 'from-rose-600 to-red-700',
      badge: 'मुनाफा',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-900 text-white p-5 sm:p-7 shadow-lg">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <TrendingUp className="w-96 h-96" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              {language === 'hi' ? `रबी सीजन ${seasonLabel} विशेष` : `Rabi Season ${seasonLabel}`}
            </span>
            <div className="flex items-center gap-2 text-emerald-200 text-xs sm:text-sm">
              <Calendar className="w-4 h-4" />
              <span>{language === 'hi' ? formatHindiDate(istNow) : formatEnglishDate(istNow)}</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-2">
            {t.dashboard.greeting[language]}
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed mb-4">
            {language === 'hi'
              ? 'किसान सेतु पर आज का मंडी भाव, फसल सुरक्षा उपाय, मौसम चेतावनी और सरकारी योजनाओं की पूरी जानकारी प्राप्त करें।'
              : 'Access live mandi commodity prices, plant health diagnosis, 7-day weather alerts, and subsidy schemes on Kisan Setu.'}
          </p>

          {/* Daily Voice Advisory Bar */}
          <div className="bg-emerald-950/60 backdrop-blur-xs border border-emerald-500/40 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0 mt-0.5">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 block uppercase tracking-wider">
                  {language === 'hi' ? 'आज की मुख्य कृषि सलाह (Daily Farm Advisory)' : "Today's Key Advisory"}
                </span>
                <p className="text-xs sm:text-sm text-emerald-50 font-medium">
                  {dailyAdvisoryText}
                </p>
              </div>
            </div>

            <button
              onClick={() => speakText(dailyAdvisoryText)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all shrink-0 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-amber-300" />
              <span>{t.speakText[language]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile App Download Quick Banner */}
      {onOpenDownload && (
        <div
          onClick={onOpenDownload}
          className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-emerald-950 rounded-2xl p-4 sm:p-4.5 shadow-sm border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-amber-300 flex items-center justify-center text-xl shrink-0 shadow-xs">
              📲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm sm:text-base leading-tight">
                  {language === 'hi'
                    ? 'किसान सेतु को अपने मोबाइल फोन में डाउनलोड करें!'
                    : 'Download Kisan Setu on your Mobile Phone!'}
                </h4>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-900 text-white uppercase">
                  मुफ्त
                </span>
              </div>
              <p className="text-xs text-emerald-900 font-medium mt-0.5">
                {language === 'hi'
                  ? 'बिना प्ले स्टोर के सीधे अपने फोन की होम स्क्रीन पर असली ऐप की तरह इंस्टॉल करें (QR कोड व लिंक)'
                  : 'Install directly onto your home screen without Play Store (QR Code & Quick Steps)'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white text-emerald-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>{language === 'hi' ? 'किसानों को भेजें' : 'Share App'}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDownload();
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-amber-300 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
            >
              <span>{language === 'hi' ? 'डाउनलोड विधि' : 'Get App'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Live Mandi Ticker Preview */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-emerald-100 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                ganjPatrak.sessionStatus === 'open' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            ></div>
            <h3 className="font-bold text-gray-900 text-base sm:text-lg">
              {t.dashboard.liveMandiSummary[language]}
            </h3>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                ganjPatrak.sessionStatus === 'open'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : ganjPatrak.sessionStatus === 'before_open'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-rose-100 text-rose-900 border-rose-300'
              }`}
            >
              {ganjPatrak.sessionStatus === 'weekend'
                ? '🔴 अवकाश (मंडी बंद)'
                : ganjPatrak.sessionStatus === 'after_530'
                ? '🔴 5:30 PM मंडी बंद'
                : ganjPatrak.sessionStatus === 'before_open'
                ? '🟡 10:30 AM खुलेगी'
                : '🟢 मंडी खुली'}
            </span>
            <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
              पत्रक: {ganjPatrak.date}
            </span>
          </div>
          <button
            onClick={() => onNavigate('mandi')}
            className="flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <span>{t.dashboard.viewAllMandi[language]}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {topPatrakRows.map((row) => {
            const change = row.priceChange ?? 0;
            return (
              <div
                key={row.sNo}
                onClick={() => onNavigate('mandi')}
                className="p-3 rounded-lg bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-100 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span className="font-bold text-emerald-950 truncate">{row.cropName}</span>
                </div>
                <div className="text-[11px] text-gray-500 mb-1 truncate">
                  {ganjPatrak.mandiName}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base sm:text-lg font-black text-gray-900">
                    ₹{row.modalPrice}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      change > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : change < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {change > 0 ? `▲ +₹${change}` : change < 0 ? `▼ -₹${Math.abs(change)}` : '▬ स्थिर'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  ₹{row.minPrice} – ₹{row.maxPrice} / क्विं.
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weather Snapshot + Spray Safety Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weather Card */}
        <div className="md:col-span-2 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CloudSun className="w-6 h-6 text-amber-300" />
              <div>
                <h4 className="font-bold text-base">{t.dashboard.weatherQuick[language]}</h4>
                <p className="text-xs text-blue-200">
                  {language === 'hi' ? 'उत्तर एवं मध्य भारत कृषि क्षेत्र' : 'North & Central India Agri Zones'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('weather')}
              className="text-xs text-amber-300 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'hi' ? '7-दिवसीय पूर्वानुमान' : '7-Day Forecast'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-blue-800/60 my-2">
            <div>
              <span className="text-xs text-blue-200 block">{language === 'hi' ? 'तापमान' : 'Temperature'}</span>
              <span className="text-xl sm:text-2xl font-black">{todayWeather.tempMax}°C</span>
              <span className="text-xs text-blue-300 ml-1">/ {todayWeather.tempMin}°C</span>
            </div>
            <div>
              <span className="text-xs text-blue-200 block">{language === 'hi' ? 'बारिश की संभावना' : 'Rain Chance'}</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300">{todayWeather.rainChance}%</span>
            </div>
            <div>
              <span className="text-xs text-blue-200 block">{language === 'hi' ? 'आर्द्रता (नमी)' : 'Humidity'}</span>
              <span className="text-xl sm:text-2xl font-black">{todayWeather.humidity}%</span>
            </div>
            <div>
              <span className="text-xs text-blue-200 block">{language === 'hi' ? 'हवा की गति' : 'Wind Speed'}</span>
              <span className="text-xl sm:text-2xl font-black">{todayWeather.windSpeed} km/h</span>
            </div>
          </div>

          {/* Spray Safety Badge */}
          <div className="mt-2 flex items-center justify-between gap-2 bg-blue-950/70 p-2.5 rounded-lg border border-blue-700/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-300">
                {todayWeather.sprayAdvisory.message[language]}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {language === 'hi' ? 'स्प्रे अनुकूल' : 'Spray Safe'}
            </span>
          </div>
        </div>

        {/* AI Crop Doctor Promo Card */}
        <div className="bg-amber-500 text-emerald-950 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase px-2 py-0.5 bg-emerald-950 text-amber-300 rounded">
                AI क्लिनिक
              </span>
              <Stethoscope className="w-6 h-6 text-emerald-950" />
            </div>
            <h4 className="font-black text-lg text-emerald-950 leading-tight mb-2">
              {language === 'hi' ? 'फसल में बीमारी या पीलापन?' : 'Crop Disease or Yellowing?'}
            </h4>
            <p className="text-xs font-medium text-emerald-900 leading-snug">
              {t.dashboard.cropDoctorPromo[language]}
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={() => onNavigate('cropDoctor')}
              className="w-full py-2.5 px-3 rounded-lg bg-emerald-950 text-amber-300 font-extrabold text-xs sm:text-sm hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Stethoscope className="w-4 h-4" />
              <span>{t.dashboard.diagnoseNow[language]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-base sm:text-lg">
            {t.dashboard.quickActions[language]}
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            {language === 'hi' ? 'सभी सुविधाएं नि:शुल्क हैं' : 'All services are 100% free'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {quickServices.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.tab}
                onClick={() => onNavigate(srv.tab)}
                className="bg-white rounded-xl p-4 border border-gray-200/80 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex items-start gap-3.5"
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${srv.color} text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">
                      {srv.title}
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {srv.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-snug line-clamp-2">{srv.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agricultural Emergency Call Support */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900">
              {language === 'hi' ? 'राष्ट्रीय किसान कॉल सेंटर (Kisan Call Centre)' : 'National Kisan Call Centre Helpline'}
            </h4>
            <p className="text-xs text-gray-600">
              {language === 'hi'
                ? 'कृषि वैज्ञानिकों से अपनी स्थानीय भाषा में सुबह 6 बजे से रात 10 बजे तक मुफ्त परामर्श लें।'
                : 'Free agricultural advice from certified scientists in 22 local languages (6 AM - 10 PM).'}
            </p>
          </div>
        </div>
        <a
          href="tel:18001801551"
          className="px-4 py-2 rounded-lg bg-emerald-800 text-amber-300 font-black text-xs sm:text-sm hover:bg-emerald-900 transition-colors flex items-center gap-2 shrink-0 shadow-xs"
        >
          <PhoneCall className="w-4 h-4" />
          <span>1800-180-1551</span>
        </a>
      </div>
    </div>
  );
};
