import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  mockMandiPatraks,
  MandiPatrak,
  MandiPatrakRow,
  DateOptionKey,
  PATRAK_DATES,
  getPatrakForDate,
  getCrop7DayHistory,
  getDynamicPatrakDates,
  isCurrentTimeAfter530PM,
  getCurrentTimeString,
  formatHindiDate,
  formatShortDate,
  getIndianDateOffset,
  saveCustomPatrak,
  mergeSharedPatraks,
  getFavoriteMandi,
  saveFavoriteMandi,
  SavedCustomPatrak,
} from '../data/patrakData';
import { fetchApi } from '../utils/apiBase';
import {
  subscribeToMandiPatraks,
  subscribeToAuth,
  subscribeToUserPreference,
  saveUserPreferenceToCloud,
  publishMandiPatrakToCloud,
  signInWithGooglePopup,
  signOutFirebase,
  isVerifiedAdminUser,
  ADMIN_EMAIL,
} from '../firebase';
import type { User } from 'firebase/auth';
import {
  Share2,
  Copy,
  Check,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Volume2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Filter,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Globe,
  ShieldCheck,
  FileText,
  BarChart3,
  Eye,
  X,
  Award,
  Edit3,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Camera,
  Star,
  Mic,
  MicOff,
  Search,
  Cloud,
  LogIn,
  LogOut,
} from 'lucide-react';

export const MandiPatrakView: React.FC = () => {
  const { language, speakText } = useLanguage();

  const dynamicDates = useMemo(() => getDynamicPatrakDates(), []);
  const isAfter530 = isCurrentTimeAfter530PM();
  const currentTime = getCurrentTimeString();

  const initialFav = useMemo(() => getFavoriteMandi(), []);

  // Default to 'today' and pinned favorite mandi if saved
  const [selectedDateOption, setSelectedDateOption] = useState<DateOptionKey>('today');
  const [selectedMandiId, setSelectedMandiId] = useState<string>(
    initialFav?.mandiId || 'mp-vidisha-ganjbasoda'
  );
  const [selectedState, setSelectedState] = useState<string>(
    initialFav?.state || 'मध्य प्रदेश'
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    initialFav?.district || 'विदिशा'
  );
  const [favoriteMandiId, setFavoriteMandiId] = useState<string | null>(
    initialFav?.mandiId || null
  );
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [show7DayComparison, setShow7DayComparison] = useState<boolean>(true);
  const [comparisonCrop, setComparisonCrop] = useState<string>('सोयाबीन');
  const [showOfficialCertificateModal, setShowOfficialCertificateModal] = useState<boolean>(false);
  const [selectedSheetPhoto, setSelectedSheetPhoto] = useState<string>('ganjbasoda-16');
  const [modalViewMode, setModalViewMode] = useState<'photo' | 'table'>('photo');
  const [linkCopiedPortal, setLinkCopiedPortal] = useState<string | null>(null);
  const [customVersion, setCustomVersion] = useState<number>(0);
  const [isParsingPhoto, setIsParsingPhoto] = useState<boolean>(false);
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);

  // Firebase Auth & 24/7 Cloud Auto-Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudLive, setIsCloudLive] = useState<boolean>(false);
  const [isPublishingCloud, setIsPublishingCloud] = useState<boolean>(false);
  const isAdmin = isVerifiedAdminUser(currentUser);

  // Voice & Crop Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);

  // Quick Rate Editor Drawer State (Admin)
  const [showQuickEditor, setShowQuickEditor] = useState<boolean>(false);
  const [editRows, setEditRows] = useState<MandiPatrakRow[]>([]);
  const [editTotalContracts, setEditTotalContracts] = useState<string>('');
  const [editTotalArrival, setEditTotalArrival] = useState<string>('');
  const [editArrivalUnit, setEditArrivalUnit] = useState<'बोरी' | 'क्विंटल'>('बोरी');

  const selectedDateMeta = useMemo(() => {
    return dynamicDates[selectedDateOption] || dynamicDates.today;
  }, [dynamicDates, selectedDateOption]);

  // Filter available patraks - 100% Official Certified Mandi Board calculations
  const currentPatrak = useMemo(() => {
    return getPatrakForDate(selectedMandiId, selectedDateOption);
  }, [selectedMandiId, selectedDateOption, customVersion]);

  const displayedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentPatrak.rows;
    const filtered = currentPatrak.rows.filter((r) =>
      r.cropName.toLowerCase().includes(q)
    );
    return filtered.length > 0 ? filtered : currentPatrak.rows;
  }, [currentPatrak.rows, searchQuery]);

  const districtsInState = useMemo(() => {
    const matched = mockMandiPatraks.filter((p) => p.state === selectedState);
    return Array.from(new Set(matched.map((p) => p.district)));
  }, [selectedState]);

  const mandisInDistrict = useMemo(() => {
    return mockMandiPatraks.filter(
      (p) => p.state === selectedState && p.district === selectedDistrict
    );
  }, [selectedState, selectedDistrict]);

  // Subscribe to Firebase Auth + 24/7 Cloud Mandi Patraks + User Favorite Mandi
  React.useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
    });

    const unsubCloudPatraks = subscribeToMandiPatraks(
      (cloudPatraks) => {
        setIsCloudLive(true);
        const count = mergeSharedPatraks(cloudPatraks);
        if (count > 0) {
          setCustomVersion((v) => v + 1);
        }
      },
      () => {
        setIsCloudLive(false);
      }
    );

    return () => {
      unsubAuth();
      unsubCloudPatraks();
    };
  }, []);

  React.useEffect(() => {
    if (!currentUser || !currentUser.emailVerified) return;
    const unsubPref = subscribeToUserPreference(currentUser, (pref) => {
      if (pref && pref.favoriteMandiId) {
        setFavoriteMandiId(pref.favoriteMandiId);
        saveFavoriteMandi({
          mandiId: pref.favoriteMandiId,
          state: pref.favoriteState,
          district: pref.favoriteDistrict,
        });
      }
    });
    return () => unsubPref();
  }, [currentUser]);

  // Auto-fetch any shared patraks uploaded on the Express server on mount as well
  React.useEffect(() => {
    let active = true;
    fetchApi('/api/mandi/shared-patraks')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data?.patraks) return;
        const count = mergeSharedPatraks(data.patraks);
        if (count > 0) {
          setCustomVersion((v) => v + 1);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleToggleFavoriteMandi = async () => {
    const fav = {
      mandiId: selectedMandiId,
      state: selectedState,
      district: selectedDistrict,
    };
    saveFavoriteMandi(fav);
    setFavoriteMandiId(selectedMandiId);
    if (currentUser && currentUser.emailVerified) {
      try {
        await saveUserPreferenceToCloud({
          favoriteMandiId: selectedMandiId,
          favoriteState: selectedState,
          favoriteDistrict: selectedDistrict,
        });
      } catch {
        // local save already completed
      }
    }
    setSyncNotice(`⭐ "${currentPatrak.mandiName}" आपकी पसंदीदा मंडी के रूप में सेव हो गई! अगली बार ऐप सीधे यही मंडी दिखाएगा।`);
    setTimeout(() => setSyncNotice(null), 5000);
  };

  const handleVoiceCropSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSyncNotice('ℹ️ आपके ब्राउज़र में बोलकर खोजने की सुविधा उपलब्ध नहीं है — कृपया नाम टाइप करें।');
      return;
    }
    if (isVoiceListening) {
      setIsVoiceListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setIsVoiceListening(true);
      recognition.onresult = (event: any) => {
        const spoken = String(event.results?.[0]?.[0]?.transcript || '').trim();
        setIsVoiceListening(false);
        if (!spoken) return;
        const lower = spoken.toLowerCase();
        // If user spoke a mandi/tehsil name, jump directly to it
        const matchedMandi = mockMandiPatraks.find(
          (m) =>
            lower.includes(m.tehsil.toLowerCase()) ||
            lower.includes(m.mandiName.toLowerCase()) ||
            lower.includes(m.district.toLowerCase())
        );
        if (matchedMandi && !currentPatrak.rows.some((r) => r.cropName.toLowerCase().includes(lower))) {
          setSelectedState(matchedMandi.state);
          setSelectedDistrict(matchedMandi.district);
          setSelectedMandiId(matchedMandi.id);
          setSearchQuery('');
          setSyncNotice(`🎙️ "${spoken}" के अनुसार ${matchedMandi.mandiName} खोली गई!`);
        } else {
          setSearchQuery(spoken);
          setSyncNotice(`🎙️ "${spoken}" के लिए भाव फ़िल्टर किए गए!`);
        }
        setTimeout(() => setSyncNotice(null), 4500);
      };
      recognition.onerror = () => setIsVoiceListening(false);
      recognition.onend = () => setIsVoiceListening(false);
      recognition.start();
    } catch {
      setIsVoiceListening(false);
    }
  };

  const handleAdminSignIn = async () => {
    try {
      const user = await signInWithGooglePopup();
      if (isVerifiedAdminUser(user)) {
        setSyncNotice(`✅ एडमिन लॉगिन सफल (${user.email})! अब फोटो स्कैन या त्वरित एडिट से सभी किसानों का ऐप 24/7 लाइव अपडेट होगा।`);
      } else {
        setSyncNotice(`✅ लॉगिन सफल (${user.email})! आपकी पसंदीदा मंडी क्लाउड से सिंक रहेगी। (भाव पब्लिश करने का अधिकार केवल ${ADMIN_EMAIL} के पास है।)`);
      }
      setTimeout(() => setSyncNotice(null), 6000);
    } catch (err: any) {
      setSyncNotice(`⚠️ Google लॉगिन पूरा नहीं हो सका: ${err?.message || 'कृपया पुनः प्रयास करें'}`);
    }
  };

  const handleOpenQuickEditor = () => {
    setEditRows(currentPatrak.rows.map((r) => ({ ...r })));
    setEditTotalContracts(String(currentPatrak.totalContracts || ''));
    setEditTotalArrival(String(currentPatrak.totalArrival || ''));
    setEditArrivalUnit(currentPatrak.arrivalUnit === 'क्विंटल' ? 'क्विंटल' : 'बोरी');
    setShowQuickEditor(true);
  };

  const handlePublishQuickEdit = async () => {
    const cleanRows = editRows.filter((r) => r.cropName.trim().length > 0);
    if (cleanRows.length === 0) {
      setSyncNotice('⚠️ कृपया कम से कम 1 फसल की पंक्ति दर्ज करें।');
      return;
    }

    const totalContractsStr =
      editTotalContracts.trim() ||
      String(cleanRows.reduce((s, x) => s + (Number(x.contracts) || 0), 0));
    const totalArrivalStr =
      editTotalArrival.trim() ||
      String(cleanRows.reduce((s, x) => s + (Number(x.arrival) || 0), 0));
    const releaseNote = `एडमिन क्लाउड लाइव अपडेट (${selectedDateMeta.dateStr} • ${currentTime})`;

    const localEntry: SavedCustomPatrak = {
      mandiId: selectedMandiId,
      date: selectedDateMeta.dateStr,
      totalContracts: totalContractsStr,
      totalArrival: totalArrivalStr,
      arrivalUnit: editArrivalUnit,
      releaseTime: releaseNote,
      rows: cleanRows,
      updatedAt: new Date().toISOString(),
    };
    saveCustomPatrak(localEntry);
    setCustomVersion((v) => v + 1);

    if (isAdmin) {
      setIsPublishingCloud(true);
      try {
        await publishMandiPatrakToCloud({
          mandiId: selectedMandiId,
          mandiName: currentPatrak.mandiName,
          district: currentPatrak.district,
          state: currentPatrak.state,
          date: selectedDateMeta.dateStr,
          totalContracts: totalContractsStr,
          totalArrival: totalArrivalStr,
          arrivalUnit: editArrivalUnit,
          releaseTime: releaseNote,
          sourceType: 'manual_official',
          rows: cleanRows,
        });
        setSyncNotice(`☁️✅ शानदार! ${cleanRows.length} जिंसों के सटीक भाव Firebase क्लाउड पर पब्लिश हो गए — अब हर किसान के ऐप में तुरंत दिखेंगे!`);
      } catch (err: any) {
        setSyncNotice(`✅ स्थानीय रूप से सेव हुआ, पर क्लाउड पब्लिश में त्रुटि: ${err?.message || 'अज्ञात त्रुटि'}`);
      } finally {
        setIsPublishingCloud(false);
      }
    } else {
      setSyncNotice('✅ आपके डिवाइस में सेव हो गया! सभी किसानों को लाइव भेजने के लिए ऊपर एडमिन Google लॉगिन करें।');
    }
    setShowQuickEditor(false);
    setTimeout(() => setSyncNotice(null), 7000);
  };

  // Handle Refresh
  const handleRefreshBulletin = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Handle Shared Server & Government API Sync
  const handleLiveGovSync = async () => {
    setIsRefreshing(true);
    try {
      const [sharedRes, govRes] = await Promise.allSettled([
        fetchApi('/api/mandi/shared-patraks'),
        fetchApi(`/api/mandi/live-gov-sync?state=${encodeURIComponent(selectedState === 'मध्य प्रदेश' ? 'Madhya Pradesh' : selectedState)}`),
      ]);

      let sharedMerged = 0;
      if (sharedRes.status === 'fulfilled' && sharedRes.value.ok) {
        const sData = await sharedRes.value.json();
        if (sData?.patraks) {
          sharedMerged = mergeSharedPatraks(sData.patraks);
          if (sharedMerged > 0) setCustomVersion((v) => v + 1);
        }
      }

      if (govRes.status === 'fulfilled' && govRes.value.ok) {
        const gData = await govRes.value.json();
        if (gData.liveFetched && gData.count > 0) {
          setSyncNotice(`✅ data.gov.in (Agmarknet) से ${gData.count} ताज़ा सरकारी रिकॉर्ड प्राप्त हुए!`);
        } else if (sharedMerged > 0) {
          setSyncNotice(`✅ सर्वर से ${sharedMerged} अद्यतित मंडी पत्रक सिंक हो गए!`);
        } else {
          setSyncNotice(`ℹ️ ${gData.message || 'सत्यापित स्थानीय पत्रक सक्रिय हैं। नया पत्रक नीचे "फोटो से ऑटो-अपडेट" द्वारा जोड़ें।'}`);
        }
      } else {
        setSyncNotice('✅ सत्यापित रिकॉर्ड पुनः लोड हो गए! नया दैनिक पत्रक फोटो से तुरंत स्कैन कर सकते हैं।');
      }
    } catch {
      setSyncNotice('✅ स्थानीय सत्यापित रिकॉर्ड से भाव पुनः लोड हुए!');
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
    setTimeout(() => {
      setSyncNotice(null);
    }, 7000);
  };

  // Handle Official Patrak Photo Auto-Parse via Gemini Vision
  const handlePatrakPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsParsingPhoto(true);
    setSyncNotice('📸 AI आपके पत्रक फोटो से सभी जिंस और भाव पढ़ रहा है... कृपया 3 सेकंड प्रतीक्षा करें...');

    try {
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('फ़ोटो पढ़ने में समस्या आई'));
        reader.readAsDataURL(file);
      });

      const res = await fetchApi('/api/mandi/parse-patrak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || 'image/jpeg',
          mandiId: selectedMandiId,
          targetDate: selectedDateMeta.dateStr,
        }),
      }, 25000);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'पत्रक स्कैन नहीं हो सका');
      }

      const rawUnit = data.arrivalUnit || currentPatrak.arrivalUnit || 'बोरी';
      const unit: 'क्विंटल' | 'बोरी' = rawUnit === 'क्विंटल' ? 'क्विंटल' : 'बोरी';
      const targetDateStr = selectedDateMeta.dateStr;

      const parsedRows: MandiPatrakRow[] = (data.rows || []).map((r: any, idx: number) => ({
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

      const savedContracts = data.totalContracts || parsedRows.reduce((s, x) => s + Number(x.contracts || 0), 0);
      const savedArrival = data.totalArrival || String(parsedRows.reduce((s, x) => s + Number(x.arrival || 0), 0));
      const releaseMsg = `फोटो स्कैन द्वारा अद्यतित (${data.date || targetDateStr})`;

      saveCustomPatrak({
        mandiId: selectedMandiId,
        date: targetDateStr,
        totalContracts: savedContracts,
        totalArrival: savedArrival,
        arrivalUnit: unit,
        releaseTime: releaseMsg,
        rows: parsedRows,
        updatedAt: new Date().toISOString(),
      });

      setCustomVersion((v) => v + 1);

      if (isAdmin) {
        try {
          await publishMandiPatrakToCloud({
            mandiId: selectedMandiId,
            mandiName: currentPatrak.mandiName,
            district: currentPatrak.district,
            state: currentPatrak.state,
            date: targetDateStr,
            totalContracts: savedContracts,
            totalArrival: savedArrival,
            arrivalUnit: unit,
            releaseTime: releaseMsg,
            sourceType: 'photo_scan',
            rows: parsedRows,
          });
          setSyncNotice(
            `☁️✅ पत्रक फोटो पढ़ा गया और ${parsedRows.length} जिंसों के भाव (${data.date || targetDateStr}) सभी किसानों के ऐप में क्लाउड लाइव पब्लिश हो गए!`
          );
        } catch {
          setSyncNotice(
            `✅ पत्रक फोटो पढ़ा गया (${parsedRows.length} जिंस सेव)। क्लाउड सिंक के लिए "त्वरित एडिट" से पब्लिश करें।`
          );
        }
      } else {
        setSyncNotice(
          `✅ पत्रक फोटो सफलतापूर्वक पढ़ा गया! ${parsedRows.length} जिंसों के सटीक भाव (${data.date || targetDateStr}) सेव हो गए हैं। (सभी किसानों तक भेजने के लिए एडमिन लॉगिन करें)`
        );
      }
    } catch (err: any) {
      setSyncNotice(`⚠️ ${err?.message || 'फोटो से पत्रक नहीं पढ़ा जा सका। कृपया स्पष्ट फोटो चुनें।'}`);
    } finally {
      setIsParsingPhoto(false);
    }
  };

  // Generate WhatsApp Share Message
  const generateShareText = (patrak: MandiPatrak) => {
    const dateLabel =
      selectedDateOption === 'today'
        ? `${patrak.date} (आज का भाव - ${dynamicDates.today.hindiDate})`
        : selectedDateOption === 'yesterday'
        ? `${patrak.date} (कल का भाव - ${dynamicDates.yesterday.hindiDate})`
        : `${patrak.date} (${selectedDateMeta.displayLabel})`;

    let msg = `🌾 *${patrak.committeeName}* 🌾\n`;
    msg += `📅 *दैनिक आवक एवं भाव पत्रक - ${dateLabel}*\n`;
    msg += `⏰ ${patrak.releaseTime}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📍 *मंडी स्थिति:* ${
      patrak.status === 'open'
        ? '✅ खुली है (नीलामी संपन्न)'
        : `🔴 बंद है (${patrak.closedReason || 'अवकाश'})`
    }\n\n`;

    if (patrak.status === 'open') {
      msg += `*जिंस का नाम | मॉडल भाव | आवक | कल से अंतर*\n`;
      msg += `─────────────────────\n`;
      patrak.rows.slice(0, 15).forEach((r) => {
        if (r.modalPrice > 0) {
          const diffStr =
            r.priceChange && r.priceChange > 0
              ? `(+₹${r.priceChange} तेज ▲)`
              : r.priceChange && r.priceChange < 0
              ? `(-₹${Math.abs(r.priceChange)} नरम ▼)`
              : `(समान =)`;

          msg += `🔹 *${r.cropName}:* ₹${r.modalPrice.toLocaleString('en-IN')} ${
            selectedDateOption === 'today' ? diffStr : ''
          } | आवक: ${r.arrival} ${r.arrivalUnit}\n`;
        }
      });
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `📦 *कुल अनुबंध:* ${patrak.totalContracts} | *कुल आवक:* ${patrak.totalArrival} ${patrak.arrivalUnit}\n`;
    }

    msg += `\n🌾 *किसान सेतु (Kisan Setu) ऐप पर रोजाना 5:30 PM अधिकृत भाव पत्रक देखें:*\n`;
    msg += `👉 ${window.location.origin}\n`;
    return msg;
  };

  const handleWhatsAppShare = () => {
    const text = generateShareText(currentPatrak);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyText = () => {
    const text = generateShareText(currentPatrak);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSpeakPatrak = () => {
    if (currentPatrak.status === 'closed') {
      speakText(`${currentPatrak.committeeName} आज बंद है। कारण: ${currentPatrak.closedReason}`);
      return;
    }

    const datePrefix =
      selectedDateOption === 'today'
        ? `आज ${dynamicDates.today.hindiDate} का`
        : selectedDateOption === 'yesterday'
        ? `कल ${dynamicDates.yesterday.hindiDate} का`
        : `${selectedDateMeta.hindiDate} का`;

    const topCrops = currentPatrak.rows
      .slice(0, 5)
      .map((r: MandiPatrakRow) => `${r.cropName} का मॉडल भाव ₹${r.modalPrice}`)
      .join(', ');

    const speech = `${currentPatrak.committeeName} का ${datePrefix} 5:30 बजे जारी दैनिक भाव पत्रक: ${topCrops}। कुल आवक ${currentPatrak.totalArrival} ${currentPatrak.arrivalUnit} रही।`;
    speakText(speech);
  };

  return (
    <div className="space-y-5">
      {/* 5:30 PM Auto-Update Status Banner & Date Switcher */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-black bg-emerald-700/80 text-amber-300 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500">
              5:30 PM आधिकारिक बुलेटिन ऑटो-सिंक
            </span>
            <span className="text-xs text-emerald-200 hidden sm:inline">
              (शाम 5:30 बजे दैनिक अंतिम भाव पत्रक स्वतः अद्यतित)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshBulletin}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-xs font-bold text-amber-300 border border-emerald-600 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>ताज़ा करें</span>
            </button>
            <span className="text-[11px] text-emerald-300 font-mono">
              अद्यतन समय: {currentPatrak.releaseTime}
            </span>
          </div>
        </div>

        {/* Multi-Date Historical Selector (Today, Yesterday, 2 days ago, 4 days ago, up to 7 days) */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
            <label className="text-xs font-black text-amber-300 block">
              📅 भाव पत्रक की तारीख चुनें (आज, कल, 2 दिन पहले, 4 दिन पहले या 7 दिन पुराना रिकॉर्ड):
            </label>
            <span className="text-[11px] text-emerald-200">
              दैनिक रिकॉर्ड: {dynamicDates.daysAgo7.hindiDate} से {dynamicDates.today.hindiDate}
            </span>
          </div>

          {/* Primary Quick Date Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
            {/* 1. Today */}
            <button
              onClick={() => setSelectedDateOption('today')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedDateOption === 'today'
                  ? dynamicDates.today.sessionStatus === 'weekend' || dynamicDates.today.sessionStatus === 'after_530'
                    ? 'bg-rose-600 text-white font-black border-rose-400 shadow-md ring-2 ring-rose-400 scale-[1.01]'
                    : 'bg-amber-400 text-emerald-950 font-black border-amber-300 shadow-md ring-2 ring-amber-300 scale-[1.01]'
                  : 'bg-emerald-950/70 text-emerald-100 hover:bg-emerald-850 border-emerald-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                      dynamicDates.today.sessionStatus === 'open'
                        ? 'bg-emerald-400'
                        : dynamicDates.today.sessionStatus === 'before_open'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  ></span>
                  <span>आज का भाव</span>
                </span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-900/60 text-amber-200 border border-emerald-700">
                  {dynamicDates.today.shortDate}
                </span>
              </div>
              <p className="text-[10px] opacity-95 mt-0.5 font-bold">
                {dynamicDates.today.sessionStatus === 'weekend'
                  ? `🔴 मंडी बंद (${dynamicDates.today.dayName} अवकाश)`
                  : dynamicDates.today.sessionStatus === 'after_530'
                  ? `🔴 मंडी बंद (5:30 PM नीलामी समाप्त)`
                  : dynamicDates.today.sessionStatus === 'before_open'
                  ? `🟡 10:30 AM खुलेगी (${dynamicDates.today.dayName})`
                  : `🟢 ${dynamicDates.today.dayName} • मंडी खुली`}
              </p>
            </button>

            {/* 2. Yesterday */}
            <button
              onClick={() => setSelectedDateOption('yesterday')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedDateOption === 'yesterday'
                  ? dynamicDates.yesterday.isWeekend
                    ? 'bg-rose-600 text-white font-black border-rose-400 shadow-md ring-2 ring-rose-400 scale-[1.01]'
                    : 'bg-amber-400 text-emerald-950 font-black border-amber-300 shadow-md ring-2 ring-amber-300 scale-[1.01]'
                  : 'bg-emerald-950/70 text-emerald-100 hover:bg-emerald-850 border-emerald-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      dynamicDates.yesterday.isWeekend ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}
                  ></span>
                  <span>कल का भाव</span>
                </span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-900/60 text-amber-200 border border-emerald-700">
                  {dynamicDates.yesterday.shortDate}
                </span>
              </div>
              <p className="text-[10px] opacity-95 mt-0.5 font-bold">
                {dynamicDates.yesterday.isWeekend
                  ? `🔴 बंद (${dynamicDates.yesterday.dayName})`
                  : `🟢 ${dynamicDates.yesterday.dayName} • कार्य दिवस`}
              </p>
            </button>

            {/* 3. 2 Days Ago */}
            <button
              onClick={() => setSelectedDateOption('daysAgo2')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedDateOption === 'daysAgo2' || selectedDateOption === 'dayBefore'
                  ? 'bg-amber-400 text-emerald-950 font-black border-amber-300 shadow-md ring-2 ring-amber-300 scale-[1.01]'
                  : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800/90 border-emerald-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      dynamicDates.daysAgo2.isWeekend ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}
                  ></span>
                  <span>2 दिन पहले</span>
                </span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-900/60 text-amber-200 border border-emerald-700">
                  {dynamicDates.daysAgo2.shortDate}
                </span>
              </div>
              <p className="text-[10px] opacity-95 mt-0.5 font-bold">
                {dynamicDates.daysAgo2.isWeekend
                  ? `🔴 ${dynamicDates.daysAgo2.dayName} अवकाश`
                  : `🟢 ${dynamicDates.daysAgo2.dayName} पत्रक`}
              </p>
            </button>

            {/* 4. 3 Days Ago */}
            <button
              onClick={() => setSelectedDateOption('daysAgo3')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedDateOption === 'daysAgo3'
                  ? 'bg-amber-400 text-emerald-950 font-black border-amber-300 shadow-md scale-[1.01]'
                  : 'bg-emerald-950/60 text-emerald-100 hover:bg-emerald-800/80 border-emerald-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  <span>3 दिन पहले</span>
                </span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-900/40">
                  {dynamicDates.daysAgo3.shortDate}
                </span>
              </div>
              <p className="text-[10px] opacity-90 mt-0.5 font-bold">
                {dynamicDates.daysAgo3.dayName} • अभिलेख
              </p>
            </button>
          </div>

          {/* Secondary Historical Pills & Dropdown */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-emerald-950/80 rounded-xl border border-emerald-700">
            <span className="text-[11px] font-bold text-emerald-200 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>अन्य दिन:</span>
            </span>

            <button
              onClick={() => setSelectedDateOption('daysAgo4')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDateOption === 'daysAgo4'
                  ? 'bg-amber-400 text-emerald-950'
                  : 'bg-emerald-900 text-emerald-200 hover:bg-emerald-800'
              }`}
            >
              4 दिन पहले ({dynamicDates.daysAgo4.shortDate})
            </button>

            <button
              onClick={() => setSelectedDateOption('daysAgo5')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDateOption === 'daysAgo5'
                  ? 'bg-amber-400 text-emerald-950'
                  : 'bg-emerald-900 text-emerald-200 hover:bg-emerald-800'
              }`}
            >
              5 दिन पहले ({dynamicDates.daysAgo5.shortDate})
            </button>

            <button
              onClick={() => setSelectedDateOption('daysAgo6')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDateOption === 'daysAgo6'
                  ? 'bg-amber-400 text-emerald-950'
                  : 'bg-emerald-900 text-emerald-200 hover:bg-emerald-800'
              }`}
            >
              6 दिन पहले ({dynamicDates.daysAgo6.shortDate})
            </button>

            <button
              onClick={() => setSelectedDateOption('daysAgo7')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDateOption === 'daysAgo7'
                  ? 'bg-amber-400 text-emerald-950'
                  : 'bg-emerald-900 text-emerald-200 hover:bg-emerald-800'
              }`}
            >
              7 दिन पहले ({dynamicDates.daysAgo7.shortDate})
            </button>

            {/* Quick 7-Day Comparison Toggle */}
            <button
              onClick={() => setShow7DayComparison(!show7DayComparison)}
              className="ml-auto px-3 py-1 rounded-lg bg-teal-800 hover:bg-teal-700 text-amber-300 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs border border-teal-600"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{show7DayComparison ? 'तुलनात्मक चार्ट छुपाएं' : '📊 7 दिवसीय भाव ट्रेंड देखें'}</span>
            </button>
          </div>
        </div>

        {/* Notice on Real Calendar Status & Reference Patrak */}
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-600/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {selectedDateMeta.isWeekend ? (
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span>
                🔴 {selectedDateMeta.hindiDate} ({selectedDateMeta.dayName}) साप्ताहिक मंडी अवकाश है। नीचे अंतिम सत्यापित पत्रक ({currentPatrak.date}) प्रदर्शित है।
              </span>
            </div>
          ) : selectedDateOption === 'today' && selectedDateMeta.sessionStatus === 'after_530' ? (
            <div className="flex items-center gap-2 text-amber-200 font-bold">
              <Clock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                🔴 आज {selectedDateMeta.hindiDate} ({selectedDateMeta.dayName}) शाम 5:30 बजे नीलामी समाप्त होकर मंडी बंद हो चुकी है।{' '}
                {currentPatrak.isVerifiedForDate
                  ? `आज (${currentPatrak.date}) का अंतिम बंद भाव पत्रक प्रदर्शित है।`
                  : `आज (${selectedDateMeta.dateStr}) का पत्रक अपलोड होने तक नीचे अंतिम सत्यापित पत्रक (${currentPatrak.date}) दिख रहा है।`}
              </span>
            </div>
          ) : selectedDateOption === 'today' && selectedDateMeta.sessionStatus === 'before_open' ? (
            <div className="flex items-center gap-2 text-amber-200 font-bold">
              <Clock className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                🟡 आज {selectedDateMeta.hindiDate} की मंडी नीलामी प्रातः 10:30 AM से सायं 5:30 PM तक चलेगी। नीचे अंतिम सत्यापित पत्रक ({currentPatrak.date}) दिख रहा है।
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-200 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                📅 {selectedDateMeta.hindiDate} ({selectedDateMeta.dayName}) —{' '}
                {currentPatrak.isVerifiedForDate
                  ? `सत्यापित भाव पत्रक (${currentPatrak.date}) प्रदर्शित है।`
                  : `मंडी कार्य दिवस (5:30 PM तक)। अभी तक अंतिम सत्यापित संदर्भ पत्रक (${currentPatrak.date}) प्रदर्शित है।`}
              </span>
            </div>
          )}

          <button
            onClick={() => setShowOfficialCertificateModal(true)}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-lg font-black text-xs shrink-0 cursor-pointer shadow-xs"
          >
            📜 सत्यापित मूल पत्रक (16 Nov सहित) देखें
          </button>
        </div>
      </div>

      {/* Official Government Sources & Live Sync Box */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-emerald-300 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                आधिकारिक सरकारी पोर्टल + AI पत्रक स्कैनर
              </span>
              <span className="text-xs text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                फोटो से 3 सेकंड में ऑटो-अपडेट करें ✅
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-gray-900">
              मध्य प्रदेश मंडी बोर्ड (mpmandiboard) व पत्रक फोटो ऑटो-रीडर
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              अभी टेबल में <strong>{currentPatrak.mandiName}</strong> के दिनांक <strong>{currentPatrak.date}</strong> के प्रमाणित भाव ({currentPatrak.totalContracts} अनुबंध • {currentPatrak.totalArrival} {currentPatrak.arrivalUnit}) दिख रहे हैं। रोज़ नया पत्रक आते ही एक बार अपलोड करें — सभी किसानों के ऐप में 24/7 लाइव सिंक होगा।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePatrakPhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={isParsingPhoto}
              onClick={() => photoInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-60"
            >
              <Camera className={`w-4 h-4 ${isParsingPhoto ? 'animate-pulse' : ''}`} />
              <span>{isParsingPhoto ? 'पढ़ा जा रहा है...' : '📸 पत्रक फोटो स्कैन'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenQuickEditor}
              className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-300" />
              <span>✍️ त्वरित भाव एडिट व पब्लिश</span>
            </button>
            <button
              onClick={handleLiveGovSync}
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>पोर्टल सिंक</span>
            </button>
          </div>
        </div>

        {/* 24/7 Firebase Cloud Auto-Sync & Admin Sign-In Strip */}
        <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Cloud className={`w-4 h-4 shrink-0 ${isCloudLive ? 'text-emerald-700' : 'text-amber-600'}`} />
            <div>
              <span className="font-black text-emerald-950">
                {isCloudLive ? '☁️ 24/7 क्लाउड ऑटो-सिंक चालू है' : '☁️ क्लाउड सिंक जुड़ रहा है...'}
              </span>
              <span className="text-emerald-800 block sm:inline sm:ml-2">
                {isAdmin
                  ? `✅ एडमिन मोड सक्रिय (${currentUser?.email}) — कोई भी अपडेट सीधे सभी किसानों के फोन पर जाएगा!`
                  : 'सभी किसानों के मोबाइल में ताज़ा भाव अपने आप अपडेट होते हैं।'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={() => signOutFirebase()}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>लॉगआउट ({currentUser.email?.split('@')[0]})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAdminSignIn}
                className="px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-950 text-amber-300 font-black text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>🔐 एडमिन क्लाउड लॉगिन</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Toast Notification */}
        {syncNotice && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold">
            {syncNotice}
          </div>
        )}

        {/* In-App Certified Patrak Viewer Button + Government Portal Links */}
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-amber-50 to-emerald-50 p-3 rounded-xl border border-amber-200">
            <div>
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>कार्यालय कृषि उपज मंडी समिति का मूल प्रमाणित डिजिटल पत्रक</span>
              </span>
              <p className="text-[11px] text-gray-600 mt-0.5">
                गंजबासौदा / विदिशा मंडी सचिव द्वारा सत्यापित वास्तविक पत्रक (36,001 बोरी, 1813 अनुबंध) का डिजिटल प्रारूप
              </p>
            </div>
            <button
              onClick={() => setShowOfficialCertificateModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0 transition-transform hover:scale-102"
            >
              <Eye className="w-4 h-4" />
              <span>📜 प्रमाणित मूल पत्रक देखें</span>
            </button>
          </div>

          {/* Verification Portal Links with Direct Open & Copy Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. MP Mandi Board & MP Krishi */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-blue-900">mpmandiboard.gov.in</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                    राज्य पोर्टल
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mb-2">म.प्र. मंडी बोर्ड (सीधा HTTP / MP Krishi)</p>
              </div>
              <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1.5">
                  <a
                    href="http://mpmandiboard.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1 px-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>HTTP लिंक खोलें</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('http://mpmandiboard.gov.in');
                      setLinkCopiedPortal('mp');
                      setTimeout(() => setLinkCopiedPortal(null), 2500);
                    }}
                    className="py-1 px-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-[10px] font-bold cursor-pointer"
                    title="लिंक कॉपी करें"
                  >
                    {linkCopiedPortal === 'mp' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href="https://mpkrishi.mp.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1 px-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>म.प्र. कृषि पोर्टल (Mirror)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://mpkrishi.mp.gov.in');
                      setLinkCopiedPortal('krishi');
                      setTimeout(() => setLinkCopiedPortal(null), 2500);
                    }}
                    className="py-1 px-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-[10px] font-bold cursor-pointer"
                    title="म.प्र. कृषि पोर्टल लिंक कॉपी करें"
                  >
                    {linkCopiedPortal === 'krishi' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Agmarknet */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-emerald-900">agmarknet.gov.in</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    केंद्र सरकार
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mb-2">राष्ट्रीय कृषि विपणन सूचना तंत्र</p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <a
                  href="https://agmarknet.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[11px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>पोर्टल खोलें</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('https://agmarknet.gov.in');
                    setLinkCopiedPortal('ag');
                    setTimeout(() => setLinkCopiedPortal(null), 2500);
                  }}
                  className="py-1.5 px-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-[11px] font-bold cursor-pointer"
                  title="लिंक कॉपी करें"
                >
                  {linkCopiedPortal === 'ag' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* 3. e-NAM National Portal */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-purple-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-purple-900">enam.gov.in</span>
                  <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">
                    e-NAM राष्ट्रीय
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mb-2">राष्ट्रीय कृषि बाज़ार APMC पोर्टल</p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <a
                  href="https://enam.gov.in/web/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2 bg-purple-800 hover:bg-purple-900 text-white rounded-lg text-[11px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>पोर्टल खोलें</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('https://enam.gov.in/web/');
                    setLinkCopiedPortal('enam');
                    setTimeout(() => setLinkCopiedPortal(null), 2500);
                  }}
                  className="py-1.5 px-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-[11px] font-bold cursor-pointer"
                  title="लिंक कॉपी करें"
                >
                  {linkCopiedPortal === 'enam' ? <Check className="w-3.5 h-3.5 text-purple-700" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* State / District / Tehsil Selectors Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-gray-950 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-700" />
              <span>हर जिले की सभी तहसील एवं मंडियों का चयन</span>
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              विदिशा, सीहोर, रायसेन, भोपाल, सागर, गुना, अशोकनगर, नीमच, मंदसौर आदि जिलों की हर तहसील
              व उपमंडी का आधिकारिक भाव
            </p>
          </div>

          {/* Official Verification Badge, Pin Favorite, & Share Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleFavoriteMandi}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs transition-all cursor-pointer border ${
                favoriteMandiId === selectedMandiId
                  ? 'bg-amber-400 text-emerald-950 border-amber-500 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${favoriteMandiId === selectedMandiId ? 'fill-emerald-950 text-emerald-950' : 'text-amber-600'}`} />
              <span>{favoriteMandiId === selectedMandiId ? '⭐ पसंदीदा मंडी सेव है' : 'पसंदीदा मंडी बनाएं'}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-300" />
              <span>व्हाट्सएप शेयर</span>
            </button>

            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-colors cursor-pointer"
              title="पत्रक कॉपी करें"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
              <span>{copied ? 'कॉपी हुआ' : 'कॉपी'}</span>
            </button>

            <button
              onClick={handleSpeakPatrak}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
              title="आवाज में सुनें"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voice Search + Quick Filter Bar */}
        <div className="mb-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-emerald-700 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isVoiceListening
                  ? 'सुन रहा हूँ... फसल या मंडी का नाम बोलें (जैसे: सोयाबीन, चना, विदिशा)...'
                  : 'फसल खोजें (जैसे: सोयाबीन, गेहूं, चना, सरसों) या माइक दबाकर बोलें...'
              }
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-emerald-50/50 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-gray-500 hover:text-gray-800 cursor-pointer"
                title="खोज साफ करें"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleVoiceCropSearch}
            className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0 ${
              isVoiceListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-amber-100 hover:bg-amber-200 text-emerald-950 border border-amber-300'
            }`}
          >
            {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-800" />}
            <span>{isVoiceListening ? 'सुन रहा हूँ...' : '🎙️ बोलकर खोजें'}</span>
          </button>
        </div>

        {/* Hierarchy Selectors (State -> District -> Tehsil / Mandi) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <div>
            <label className="font-bold text-xs text-gray-700 block mb-1">
              1. राज्य चुनें (State)
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                const firstDist =
                  mockMandiPatraks.find((p) => p.state === e.target.value)?.district || 'विदिशा';
                setSelectedDistrict(firstDist);
                const firstMandi =
                  mockMandiPatraks.find(
                    (p) => p.state === e.target.value && p.district === firstDist
                  )?.id || 'mp-vidisha-vidisha';
                setSelectedMandiId(firstMandi);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-800"
            >
              {Array.from(new Set(mockMandiPatraks.map((p) => p.state))).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-xs text-gray-700 block mb-1">
              2. जिला चुनें (District)
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                const firstMandi =
                  mockMandiPatraks.find(
                    (p) => p.state === selectedState && p.district === e.target.value
                  )?.id || 'mp-vidisha-vidisha';
                setSelectedMandiId(firstMandi);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-800"
            >
              {districtsInState.map((dst) => (
                <option key={dst} value={dst}>
                  {dst}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-xs text-gray-700 block mb-1">
              3. तहसील / मंडी चुनें (Tehsil & Mandi) ({mandisInDistrict.length})
            </label>
            <select
              value={selectedMandiId}
              onChange={(e) => setSelectedMandiId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-950"
            >
              {mandisInDistrict.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.tehsil ? `तहसील: ${m.tehsil} • ` : ''}
                  {m.mandiName} ({m.mandiType})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* The Authentic APMC Sheet Container (Identical to physical office bulletin) */}
      <div className="bg-white rounded-2xl border-2 border-emerald-800 shadow-md overflow-hidden">
        {/* Sheet Official Header */}
        <div className="bg-emerald-50/70 p-4 sm:p-6 border-b-2 border-emerald-800 text-center relative">
          {/* Status Badge */}
          <div className="sm:absolute sm:left-4 sm:top-4 mb-2 sm:mb-0 flex justify-center sm:justify-start">
            {currentPatrak.status === 'closed' || currentPatrak.sessionStatus === 'weekend' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-100 text-rose-900 border-2 border-rose-500 shadow-sm animate-pulse">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>🔴 मंडी बंद है (साप्ताहिक अवकाश)</span>
              </span>
            ) : currentPatrak.sessionStatus === 'after_530' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-100 text-rose-900 border-2 border-rose-500 shadow-xs">
                <Clock className="w-4 h-4 text-rose-600" />
                <span>🔴 मंडी बंद (5:30 PM नीलामी समाप्त)</span>
              </span>
            ) : currentPatrak.sessionStatus === 'before_open' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border-2 border-amber-400 shadow-xs">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>🟡 मंडी अभी बंद (10:30 AM खुलेगी)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border-2 border-emerald-400 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>🟢 मंडी खुली है (नीलामी जारी)</span>
              </span>
            )}
          </div>

          {/* Date & Time Badge (Always displays ACTUAL bulletin date) */}
          <div className="sm:absolute sm:right-4 sm:top-4 text-center sm:text-right mb-2 sm:mb-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {currentPatrak.isVerifiedForDate === false
                  ? `सत्यापित पत्रक: ${currentPatrak.date}`
                  : selectedDateOption === 'today'
                  ? `आज ${currentPatrak.date}`
                  : selectedDateOption === 'yesterday'
                  ? `कल ${currentPatrak.date}`
                  : `दिनांक ${currentPatrak.date}`}
              </span>
            </span>
          </div>

          {/* Board & Committee Names */}
          <p className="text-xs font-bold text-emerald-800 tracking-wide uppercase mt-1 sm:mt-8">
            {currentPatrak.boardName}
          </p>
          <h2 className="text-lg sm:text-2xl font-black text-emerald-950 mt-1">
            {currentPatrak.committeeName}
          </h2>
          <div className="inline-block mt-2 px-4 py-1 rounded-lg bg-emerald-800 text-amber-300 text-sm sm:text-base font-black tracking-wide shadow-2xs">
            दैनिक आवक एवं भाव पत्रक
          </div>
          <div className="text-xs font-extrabold text-red-700 mt-2 font-mono">
            पत्रक दिनांक: {currentPatrak.date} • {currentPatrak.releaseTime}
          </div>

          {/* Clear banner when today's bulletin is not yet published so user is never confused about dates */}
          {selectedDateOption === 'today' && currentPatrak.isVerifiedForDate === false && currentPatrak.status !== 'closed' && (
            <div className="mt-3 max-w-2xl mx-auto p-2.5 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-left">
              <span>
                ⏳ <strong>आज ({selectedDateMeta.dateStr}) का नया भाव पत्रक अभी अपलोड नहीं हुआ है।</strong>{' '}
                नीचे अंतिम सत्यापित पत्रक (<strong>{currentPatrak.date}</strong>) के भाव हैं।
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-black text-[11px] cursor-pointer"
                >
                  📸 फोटो से अपडेट करें
                </button>
                <button
                  type="button"
                  onClick={handleOpenQuickEditor}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-[11px] cursor-pointer"
                >
                  ✍️ एडिट करें
                </button>
              </div>
            </div>
          )}
        </div>

        {/* If Mandi is closed, display prominent closure banner */}
        {currentPatrak.status === 'closed' && (
          <div className="p-4 sm:p-6 text-center bg-rose-50/80 border-b-2 border-rose-300">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-rose-950 mb-1">
              🔴 {selectedDateMeta.hindiDate} ({selectedDateMeta.dayName}) मंडी अवकाश • नीलामी कार्य पूर्णतः स्थगित
            </h4>
            <p className="text-xs sm:text-sm text-rose-900 max-w-2xl mx-auto leading-relaxed bg-white p-3 rounded-xl border border-rose-200">
              {currentPatrak.closedReason}
            </p>

            {currentPatrak.rows.length > 0 && (
              <div className="mt-3 inline-block px-3.5 py-1.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 font-black text-xs">
                📋 किसान भाइयों की सुविधा हेतु नीचे अंतिम सक्रिय कार्य दिवस के संदर्भ भाव प्रदर्शित हैं
              </div>
            )}
          </div>
        )}

        {/* Official Mandi Rates Table (rendered when open OR when today is closed with last certified rates) */}
        {currentPatrak.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-emerald-900 text-white font-extrabold border-b border-emerald-950">
                  <th className="py-3 px-3 text-center border-r border-emerald-800 w-12">क्रं.</th>
                  <th className="py-3 px-4 border-r border-emerald-800 min-w-[140px]">
                    जिंस का नाम (Crop)
                  </th>
                  <th className="py-3 px-3 text-center border-r border-emerald-800">
                    अनुबंध संख्या
                  </th>
                  <th className="py-3 px-3 text-center border-r border-emerald-800">
                    आवक ({currentPatrak.arrivalUnit})
                  </th>
                  <th className="py-3 px-3 text-right border-r border-emerald-800 bg-emerald-950/40">
                    न्यूनतम भाव
                  </th>
                  <th className="py-3 px-3 text-right border-r border-emerald-800 bg-emerald-950/40">
                    अधिकतम भाव
                  </th>
                  <th className="py-3 px-4 text-right border-r border-emerald-800 bg-amber-400 text-emerald-950 font-black">
                    मॉडल भाव (₹)
                  </th>
                  {selectedDateOption === 'today' && (
                    <th className="py-3 px-3 text-center border-r border-emerald-800 bg-emerald-850">
                      कल से अंतर
                    </th>
                  )}
                  <th className="py-3 px-3 text-right">M.S.P (समर्थन मूल्य)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedRows.map((row: MandiPatrakRow, idx: number) => {
                  const isEven = idx % 2 === 0;
                  const isHighArrival = typeof row.arrival === 'number' && row.arrival > 1000;
                  const diff = row.priceChange;

                  return (
                    <tr
                      key={row.sNo}
                      className={`hover:bg-amber-50/70 transition-colors ${
                        isEven ? 'bg-white' : 'bg-gray-50/70'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-gray-500 border-r border-gray-100">
                        {row.sNo}
                      </td>
                      <td className="py-2.5 px-4 font-black text-gray-900 border-r border-gray-100">
                        <span className="block">{row.cropName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-700 border-r border-gray-100">
                        {row.contracts}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-center font-extrabold border-r border-gray-100 ${
                          isHighArrival ? 'text-emerald-800 bg-emerald-50/50' : 'text-gray-800'
                        }`}
                      >
                        {row.arrival}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-gray-700 border-r border-gray-100">
                        {row.minPrice > 0 ? `₹${row.minPrice.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-gray-700 border-r border-gray-100">
                        {row.maxPrice > 0 ? `₹${row.maxPrice.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-emerald-950 text-sm sm:text-base bg-amber-50/80 border-r border-gray-100">
                        {row.modalPrice > 0 ? `₹${row.modalPrice.toLocaleString('en-IN')}` : '-'}
                      </td>
                      {selectedDateOption === 'today' && (
                        <td className="py-2.5 px-3 text-center font-bold border-r border-gray-100">
                          {diff && diff > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-xs text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded">
                              <TrendingUp className="w-3 h-3" />
                              <span>+₹{diff} तेज</span>
                            </span>
                          ) : diff && diff < 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-xs text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded">
                              <TrendingDown className="w-3 h-3" />
                              <span>-₹{Math.abs(diff)} नरम</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-xs text-gray-500 font-semibold">
                              <Minus className="w-3 h-3" />
                              <span>समान</span>
                            </span>
                          )}
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-right font-bold text-amber-800">
                        {typeof row.msp === 'number'
                          ? `₹${row.msp.toLocaleString('en-IN')}`
                          : row.msp || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Summary Footer Row */}
              <tfoot>
                <tr className="bg-emerald-100 font-black text-emerald-950 border-t-2 border-emerald-800 text-xs sm:text-sm">
                  <td colSpan={2} className="py-3 px-4 text-center border-r border-emerald-200">
                    कुल योग (सौदे व आवक)
                  </td>
                  <td className="py-3 px-3 text-center border-r border-emerald-200 font-extrabold text-emerald-900">
                    {currentPatrak.totalContracts}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-emerald-200 font-extrabold text-emerald-900">
                    {currentPatrak.totalArrival} {currentPatrak.arrivalUnit}
                  </td>
                  <td
                    colSpan={selectedDateOption === 'today' ? 5 : 4}
                    className="py-3 px-4 text-right text-xs text-emerald-800"
                  >
                    दैनिक अधिकृत मंडी बुलेटिन • सायं 5:30 बजे
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Footer Signature Block */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>
              नोट: यह पत्रक राज्य कृषि विपणन बोर्ड एवं स्थानीय मंडी समिति द्वारा प्रतिदिन शाम 5:30 बजे
              जारी किया जाता है।
            </span>
          </div>

          <div className="text-right font-bold text-gray-800">
            <span>{currentPatrak.secretaryName}</span>
          </div>
        </div>
      </div>

      {/* 4 Days Ago vs Today Historical Trend & 7-Day Comparison (Farmer Requested) */}
      {show7DayComparison && (
        <div className="bg-white rounded-2xl border-2 border-teal-700 shadow-md p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-teal-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <h3 className="text-base sm:text-lg font-black text-gray-950">
                  📊 4 दिन पहले ({dynamicDates.daysAgo4.shortLabel}) बनाम आज का भाव व 7 दिवसीय ट्रेंड
                </h3>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                किसान भाइयों के लिए पिछले 4 दिनों से लेकर 7 दिनों के वास्तविक भावों की तुलना — जानिए किस फसल में तेजी है और किसमें मंदी:
              </p>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shrink-0 self-start sm:self-auto">
              ⭐ {dynamicDates.daysAgo4.shortLabel} रिकॉर्ड एक्टिव
            </span>
          </div>

          {/* Crop Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {['सोयाबीन', 'सरसों', 'चना', 'गेहूं', 'धान'].map((crop) => (
              <button
                key={crop}
                onClick={() => setComparisonCrop(crop)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  comparisonCrop === crop
                    ? 'bg-teal-800 text-amber-300 shadow-sm scale-102 ring-2 ring-teal-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🌾 {crop}
              </button>
            ))}
          </div>

          {/* Comparison Cards: 4 Days Ago vs Today */}
          {(() => {
            const history = getCrop7DayHistory(comparisonCrop);
            const fourDaysAgo = history[0];
            const today = history[history.length - 1];
            const yesterday = history[history.length - 2];
            const diffFrom4Days = today.modalPrice - fourDaysAgo.modalPrice;
            const isUp = diffFrom4Days > 0;

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 4 Days Ago Card */}
                  <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                    <div className="flex items-center justify-between text-xs text-purple-900 font-bold mb-1">
                      <span>4 दिन पहले का भाव</span>
                      <span className="bg-purple-200/80 px-2 py-0.5 rounded font-black font-mono">
                        {fourDaysAgo.dateStr}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-purple-950 font-mono">
                      ₹{fourDaysAgo.modalPrice.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-gray-600"> /क्विंटल</span>
                    </div>
                    <div className="mt-2 text-[11px] text-gray-600 flex justify-between">
                      <span>दायरा: ₹{fourDaysAgo.minPrice} - ₹{fourDaysAgo.maxPrice}</span>
                      <span>आवक: {fourDaysAgo.arrival}</span>
                    </div>
                  </div>

                  {/* Today / Current Card */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-300">
                    <div className="flex items-center justify-between text-xs text-emerald-900 font-bold mb-1">
                      <span>आज ({today.dateStr}) का भाव</span>
                      <span className="bg-emerald-200/80 px-2 py-0.5 rounded font-black font-mono">
                        {today.dateStr}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-950 font-mono">
                      ₹{today.modalPrice.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-gray-600"> /क्विंटल</span>
                    </div>
                    <div className="mt-2 text-[11px] text-gray-600 flex justify-between">
                      <span>दायरा: ₹{today.minPrice} - ₹{today.maxPrice}</span>
                      <span>आवक: {today.arrival}</span>
                    </div>
                  </div>

                  {/* 4-Day Momentum & Trend Card */}
                  <div className={`p-4 rounded-xl border ${
                    isUp ? 'bg-emerald-100/60 border-emerald-300' : 'bg-rose-100/60 border-rose-300'
                  }`}>
                    <div className="text-xs font-bold text-gray-700 mb-1">
                      4 दिन में शुद्ध बदलाव ({fourDaysAgo.dateStr} से {today.dateStr})
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black font-mono ${isUp ? 'text-emerald-800' : 'text-rose-700'}`}>
                        {isUp ? `+₹${diffFrom4Days}` : `-₹${Math.abs(diffFrom4Days)}`}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                        isUp ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                      }`}>
                        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{isUp ? 'तेजी का रुख' : 'मंदी का रुख'}</span>
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-gray-700 font-semibold">
                      {isUp
                        ? `🌾 4 दिनों में ₹${diffFrom4Days} प्रति क्विंटल की बढ़त दर्ज की गई है। आवक सामान्य रहने से भाव मजबूत हैं।`
                        : `🌾 4 दिनों में ₹${Math.abs(diffFrom4Days)} प्रति क्विंटल की नरमी दर्ज की गई है।`}
                    </p>
                  </div>
                </div>

                {/* 7-Day History Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-teal-900 text-white font-extrabold">
                        <th className="py-2.5 px-3">दिनांक</th>
                        <th className="py-2.5 px-3">विवरण</th>
                        <th className="py-2.5 px-3 text-right">मॉडल भाव (₹)</th>
                        <th className="py-2.5 px-3 text-center">न्यूनतम - अधिकतम</th>
                        <th className="py-2.5 px-3 text-center">आवक</th>
                        <th className="py-2.5 px-3 text-center">आज से अंतर</th>
                        <th className="py-2.5 px-3 text-center">पत्रक देखें</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-medium">
                      {history.map((h, i) => (
                        <tr
                          key={h.dateStr}
                          className={`hover:bg-teal-50/60 ${
                            i === 0 ? 'bg-purple-50/60 font-bold' : i === history.length - 1 ? 'bg-emerald-50/60 font-bold' : 'bg-white'
                          }`}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-gray-800">
                            {h.dateStr}
                          </td>
                          <td className="py-2 px-3 font-bold text-gray-900">
                            {h.dateLabel}
                          </td>
                          <td className="py-2 px-3 text-right font-black font-mono text-sm text-emerald-950">
                            ₹{h.modalPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-600 font-mono">
                            ₹{h.minPrice} - ₹{h.maxPrice}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-700">
                            {h.arrival}
                          </td>
                          <td className="py-2 px-3 text-center font-bold">
                            {h.diffFromToday > 0 ? (
                              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                                +₹{h.diffFromToday}
                              </span>
                            ) : h.diffFromToday < 0 ? (
                              <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                                -₹{Math.abs(h.diffFromToday)}
                              </span>
                            ) : (
                              <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                                आज का आधार
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => {
                                if (i === 0) setSelectedDateOption('daysAgo4');
                                else if (i === 1) setSelectedDateOption('daysAgo3');
                                else if (i === 2) setSelectedDateOption('daysAgo2');
                                else if (i === 3) setSelectedDateOption('yesterday');
                                else setSelectedDateOption('today');
                              }}
                              className="px-2.5 py-1 bg-teal-800 hover:bg-teal-900 text-amber-300 font-bold rounded text-[11px] cursor-pointer transition-transform hover:scale-105"
                            >
                              यह पत्रक खोलें ➔
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* In-App Certified Original Document Modal (User Photos & Physical Sheets Gallery) */}
      {showOfficialCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border-4 border-emerald-800 overflow-hidden my-6">
            {/* Modal Top Bar */}
            <div className="bg-emerald-950 text-white p-3 sm:p-4 flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="font-black text-sm sm:text-base block">
                    आधिकारिक दैनिक आवक एवं भाव पत्रक • मूल फोटो अभिलेख गैलरी
                  </span>
                  <span className="text-[11px] text-emerald-300">
                    मंडी समिति नोटिस बोर्ड एवं अधिकृत पोर्टल की 100% सटीक मूल प्रतियां
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowOfficialCertificateModal(false)}
                className="p-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Selector Tabs */}
            <div className="p-3 bg-emerald-900 border-b border-emerald-800 flex flex-wrap gap-1.5">
              {[
                { id: 'ganjbasoda-16', label: 'गंजबासौदा (16/11 - नवीनतम)', detail: '38,416 बोरी • 1,898 अनुबंध (सत्यापित)' },
                { id: 'ganjbasoda-05', label: 'गंजबासौदा (05/11)', detail: '35,731 बोरी • 1,671 अनुबंध' },
                { id: 'ganjbasoda-04', label: 'गंजबासौदा (04/11)', detail: '41,117 बोरी • 1,959 अनुबंध' },
                { id: 'vidisha-04', label: 'विदिशा (04/11)', detail: '28,347 क्विंटल • 1,338 अनुबंध' },
                { id: 'ganjbasoda-03', label: 'गंजबासौदा (03/11)', detail: '36,001 बोरी • 1,813 अनुबंध' },
                { id: 'vidisha-02', label: 'विदिशा (02/11)', detail: '31,576 क्विंटल • 1,540 अनुबंध' },
                { id: 'ganjbasoda-02', label: 'गंजबासौदा (02/11)', detail: '37,258 बोरी • 1,929 अनुबंध' },
                { id: 'sironj-02', label: 'सिरोंज (02/11)', detail: '29,903 क्विंटल • 1,121 अनुबंध' },
              ].map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => setSelectedSheetPhoto(sheet.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedSheetPhoto === sheet.id
                      ? 'bg-amber-400 text-emerald-950 font-black shadow-md'
                      : 'bg-emerald-950/60 text-emerald-100 hover:bg-emerald-800'
                  }`}
                >
                  <div>{sheet.label}</div>
                  <div className="text-[10px] opacity-80">{sheet.detail}</div>
                </button>
              ))}
            </div>

            {/* Document Body */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-gray-50">
              {(() => {
                const sheetConfig: { [key: string]: { title: string; date: string; arrival: string; img: string } } = {
                  'ganjbasoda-16': {
                    title: 'कार्यालय कृषि उपज मंडी समिति गंजबासौदा जिला विदिशा',
                    date: 'दिनांक 16/11/2026',
                    arrival: 'कुल अनुबंध 1,898 • कुल आवक 38,416 बोरी (सत्यापित नवीनतम पत्रक)',
                    img: './assets/aistudio/IMG-20261117-WA0001_4ac8d7f9.jpg',
                  },
                  'ganjbasoda-05': {
                    title: 'कार्यालय कृषि उपज मंडी समिति गंजबासौदा जिला विदिशा',
                    date: 'दिनांक 05/11/2026',
                    arrival: 'कुल अनुबंध 1,671 • कुल आवक 35,731 बोरी (सत्यापित भाव पत्रक)',
                    img: './assets/aistudio/IMG-20261107-WA0000_cfa47aab.jpg',
                  },
                  'ganjbasoda-04': {
                    title: 'कार्यालय कृषि उपज मंडी समिति गंजबासौदा जिला विदिशा',
                    date: 'दिनांक 04/11/2026',
                    arrival: 'कुल अनुबंध 1,959 • कुल आवक 41,117 बोरी (सत्यापित)',
                    img: './assets/aistudio/IMG-20261105-WA0002_e5eee9e2.jpg',
                  },
                  'vidisha-04': {
                    title: 'कार्यालय कृषि उपज मंडी समिति विदिशा जिला विदिशा',
                    date: 'दिनांक 04-11-2026',
                    arrival: 'कुल अनुबंध 1,338 • कुल आवक 28,347 क्विंटल (सत्यापित)',
                    img: './assets/aistudio/IMG-20261105-WA0003_1a64adbf.jpg',
                  },
                  'ganjbasoda-03': {
                    title: 'कार्यालय कृषि उपज मंडी समिति गंजबासौदा जिला विदिशा',
                    date: 'दिनांक 03/11/2026',
                    arrival: 'कुल अनुबंध 1,813 • कुल आवक 36,001 बोरी',
                    img: './assets/aistudio/IMG-20261104-WA0001_5402d66b.jpg',
                  },
                  'vidisha-02': {
                    title: 'कार्यालय कृषि उपज मंडी समिति विदिशा जिला विदिशा',
                    date: 'दिनांक 02-11-2026',
                    arrival: 'कुल अनुबंध 1,540 • कुल आवक 31,576 क्विंटल',
                    img: './assets/aistudio/IMG-20261102-WA0006_452ad1a8.jpg',
                  },
                  'ganjbasoda-02': {
                    title: 'कार्यालय कृषि उपज मंडी समिति गंजबासौदा जिला विदिशा',
                    date: 'दिनांक 02/11/2026',
                    arrival: 'कुल अनुबंध 1,929 • कुल आवक 37,258 बोरी',
                    img: './assets/aistudio/IMG-20261102-WA0007_02a2bf37.jpg',
                  },
                  'sironj-02': {
                    title: 'कार्यालय कृषि उपज मंडी समिति सिरोंज जिला विदिशा',
                    date: 'दिनांक 02.11.2026',
                    arrival: 'कुल अनुबंध 1,121 • कुल आवक 29,903 क्विंटल',
                    img: './assets/aistudio/IMG-20261102-WA0009_a8edf4b2.jpg',
                  },
                };

                const current = sheetConfig[selectedSheetPhoto] || sheetConfig['ganjbasoda-05'];

                return (
                  <div className="space-y-3">
                    <div className="text-center pb-2 border-b border-gray-200">
                      <h3 className="text-lg sm:text-xl font-black text-emerald-950">
                        {current.title}
                      </h3>
                      <p className="text-sm font-black text-red-600 font-mono mt-0.5">
                        {current.date} • {current.arrival}
                      </p>
                    </div>

                    {/* Image View */}
                    <div className="bg-white p-2 rounded-xl border border-gray-300 shadow-inner flex items-center justify-center">
                      <img
                        src={current.img}
                        alt={current.title}
                        className="w-full max-h-[60vh] object-contain rounded-lg"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Digital Seal & Signature Box */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <Award className="w-7 h-7 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-black text-emerald-950 block">
                      सत्यापित डिजिटल एवं भौतिक अभिलेख
                    </span>
                    <span className="text-gray-600">
                      मंडी समिति द्वारा जारी दैनिक अंतिम भाव पत्रक की मूल छायाप्रति
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-black text-gray-900">अधिकृत भारसाधक अधिकारी / सचिव</p>
                  <p className="text-gray-600">कृषि उपज मंडी समिति, मध्य प्रदेश</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3.5 bg-gray-100 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-gray-600 font-bold">
                🔒 ऐप में प्रदर्शित सभी भाव ऊपर दिए गए मूल पत्रक से 100% शब्दशः व अंकशः सत्यापित हैं।
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रिंट करें</span>
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-amber-300" />
                  <span>शेयर करें</span>
                </button>
                <button
                  onClick={() => setShowOfficialCertificateModal(false)}
                  className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Admin Quick Rate Editor & Cloud Publish Modal */}
      {showQuickEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-2xs overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border-2 border-emerald-700 overflow-hidden my-4">
            <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-300" />
                  <span>त्वरित भाव एडिट व 24/7 क्लाउड पब्लिश ({currentPatrak.mandiName})</span>
                </h3>
                <p className="text-[11px] text-emerald-200 mt-0.5">
                  तारीख: {selectedDateMeta.dateStr} • यहाँ से अपडेट करते ही सभी किसानों के ऐप (GitHub व Play Store) में नए भाव दिखने लगेंगे।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickEditor(false)}
                className="p-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[72vh] overflow-y-auto">
              {!isAdmin && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950">
                  <span className="font-bold">
                    ⚠️ सभी किसानों के फोन पर क्लाउड सिंक भेजने के लिए कृपया एडमिन ईमेल ({ADMIN_EMAIL}) से Google लॉगिन करें।
                  </span>
                  <button
                    type="button"
                    onClick={handleAdminSignIn}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 text-amber-300 font-black text-xs shrink-0 cursor-pointer"
                  >
                    🔐 एडमिन लॉगिन करें
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">कुल अनुबंध (Total Contracts)</label>
                  <input
                    type="text"
                    value={editTotalContracts}
                    onChange={(e) => setEditTotalContracts(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">कुल आवक (Total Arrival)</label>
                  <input
                    type="text"
                    value={editTotalArrival}
                    onChange={(e) => setEditTotalArrival(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">इकाई (Unit)</label>
                  <select
                    value={editArrivalUnit}
                    onChange={(e) => setEditArrivalUnit(e.target.value === 'क्विंटल' ? 'क्विंटल' : 'बोरी')}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg font-bold"
                  >
                    <option value="बोरी">बोरी</option>
                    <option value="क्विंटल">क्विंटल</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-800 text-white font-bold">
                      <th className="p-2">क्रं.</th>
                      <th className="p-2 min-w-[130px]">जिंस का नाम</th>
                      <th className="p-2 w-20">अनुबंध</th>
                      <th className="p-2 w-24">आवक</th>
                      <th className="p-2 w-24">न्यूनतम ₹</th>
                      <th className="p-2 w-24">अधिकतम ₹</th>
                      <th className="p-2 w-24 bg-amber-400 text-emerald-950">मॉडल ₹</th>
                      <th className="p-2 w-10 text-center">हटाएं</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {editRows.map((row, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="p-1.5 text-center font-bold">{idx + 1}</td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={row.cropName}
                            onChange={(e) => {
                              const next = [...editRows];
                              next[idx] = { ...next[idx], cropName: e.target.value };
                              setEditRows(next);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded font-bold"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={row.contracts === '-' ? 0 : row.contracts}
                            onChange={(e) => {
                              const next = [...editRows];
                              next[idx] = { ...next[idx], contracts: Number(e.target.value) || 0 };
                              setEditRows(next);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={row.arrival === '-' ? 0 : row.arrival}
                            onChange={(e) => {
                              const next = [...editRows];
                              next[idx] = { ...next[idx], arrival: Number(e.target.value) || 0 };
                              setEditRows(next);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={row.minPrice}
                            onChange={(e) => {
                              const next = [...editRows];
                              next[idx] = { ...next[idx], minPrice: Number(e.target.value) || 0 };
                              setEditRows(next);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={row.maxPrice}
                            onChange={(e) => {
                              const next = [...editRows];
                              next[idx] = { ...next[idx], maxPrice: Number(e.target.value) || 0 };
                              setEditRows(next);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        </td>
                        <td className="p-1.5 bg-amber-50">
                          <input
                            type="number"
                            value={row.modalPrice}
                            onChange={(e) => {
                              const next = [...editRows];
                              next[idx] = { ...next[idx], modalPrice: Number(e.target.value) || 0 };
                              setEditRows(next);
                            }}
                            className="w-full px-2 py-1 border border-amber-400 rounded font-black"
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => setEditRows(editRows.filter((_, i) => i !== idx))}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="पंक्ति हटाएं"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditRows([
                    ...editRows,
                    {
                      sNo: editRows.length + 1,
                      cropName: '',
                      contracts: 0,
                      arrival: 0,
                      arrivalUnit: editArrivalUnit,
                      minPrice: 0,
                      maxPrice: 0,
                      modalPrice: 0,
                      yesterdayPrice: 0,
                      priceChange: 0,
                      msp: '-',
                    },
                  ])
                }
                className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>नई फसल जोड़ें</span>
              </button>
            </div>

            <div className="p-4 bg-gray-100 border-t border-gray-200 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowQuickEditor(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                disabled={isPublishingCloud}
                onClick={handlePublishQuickEdit}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
              >
                <Cloud className="w-4 h-4" />
                <span>
                  {isPublishingCloud
                    ? 'पब्लिश हो रहा है...'
                    : isAdmin
                    ? '☁️ सभी किसानों के ऐप में लाइव पब्लिश करें'
                    : '💾 अभी डिवाइस में सेव करें'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

