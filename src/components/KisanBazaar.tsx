import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import { mockMarketListings } from '../data/mockData';
import { MarketListing } from '../types';
import { fetchApi } from '../utils/apiBase';
import {
  UserProfileData,
  subscribeToAuth,
  signInWithGooglePopup,
  subscribeToBazaarListings,
  publishBazaarListingToCloud,
  likeBazaarListingInCloud,
  deleteBazaarListingInCloud,
  isVerifiedAdminUser,
} from '../firebase';
import { ReelsViewerModal } from './ReelsViewerModal';
import {
  Phone,
  PlusCircle,
  MapPin,
  CheckCircle2,
  X,
  ShieldCheck,
  Search,
  Play,
  Share2,
  Heart,
  Sparkles,
  FlaskConical,
  BadgePercent,
  Building2,
  Camera,
  Image as ImageIcon,
  Film,
  Trash2,
  AlertCircle,
  Loader2,
  MessageCircle,
  Cloud,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Video,
  Maximize2,
} from 'lucide-react';

const SAFE_CROP_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#065f46"/><stop offset="100%" stop-color="#064e3b"/></linearGradient></defs><rect width="600" height="450" fill="url(#g)"/><text x="300" y="215" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="34" font-weight="bold">किसान सेतु बाज़ार</text><text x="300" y="255" text-anchor="middle" fill="#d1fae5" font-family="sans-serif" font-size="18">कृषि उत्पाद एवं प्रचार</text></svg>'
  );

const LOCAL_LISTINGS_KEY = 'kisan_setu_bazaar_my_posts_v5';
const OWNED_IDS_KEY = 'kisan_setu_bazaar_owned_ids_v1';

function cleanDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits.slice(-10);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('फ़ाइल पढ़ने में त्रुटि'));
    reader.readAsDataURL(file);
  });
}

// Extract an actual JPEG thumbnail frame from an uploaded video file (max ~200KB)
function extractVideoThumbnailDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const fallbackSvg =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><rect width="600" height="360" fill="#064e3b"/><circle cx="300" cy="170" r="46" fill="#e11d48"/><polygon points="288,148 288,192 324,170" fill="#ffffff"/><text x="300" y="255" text-anchor="middle" fill="#fde68a" font-family="sans-serif" font-size="22" font-weight="bold">किसान रील / वीडियो</text></svg>`
      );

    try {
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.muted = true;
      vid.playsInline = true;
      let done = false;

      const finish = (dataUrl: string) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
        resolve(dataUrl);
      };

      const timer = setTimeout(() => finish(fallbackSvg), 4000);

      vid.onloadedmetadata = () => {
        try {
          const seekTo = vid.duration && vid.duration > 1 ? Math.min(1.0, vid.duration * 0.2) : 0.1;
          vid.currentTime = seekTo;
        } catch {
          finish(fallbackSvg);
        }
      };

      vid.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxW = 560;
          const vw = vid.videoWidth || 560;
          const vh = vid.videoHeight || 360;
          const scale = vw > maxW ? maxW / vw : 1;
          canvas.width = Math.max(160, Math.round(vw * scale));
          canvas.height = Math.max(120, Math.round(vh * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            finish(fallbackSvg);
            return;
          }
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          const jpg = canvas.toDataURL('image/jpeg', 0.7);
          finish(jpg || fallbackSvg);
        } catch {
          finish(fallbackSvg);
        }
      };

      vid.onerror = () => finish(fallbackSvg);
      vid.src = url;
    } catch {
      resolve(fallbackSvg);
    }
  });
}

interface KisanBazaarProps {
  userProfile?: UserProfileData | null;
}

export const KisanBazaar: React.FC<KisanBazaarProps> = ({ userProfile }) => {
  const { language } = useLanguage();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cloudListings, setCloudListings] = useState<MarketListing[]>([]);
  const [serverListings, setServerListings] = useState<MarketListing[]>([]);
  const [localDraftListings, setLocalDraftListings] = useState<MarketListing[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_LISTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });
  const [ownedIds, setOwnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(OWNED_IDS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDemoExamples, setShowDemoExamples] = useState(false);

  // Video playback & Fullscreen Reels Viewer state
  const [resolvedVideoUrls, setResolvedVideoUrls] = useState<Record<string, string>>({});
  const [reelsModal, setReelsModal] = useState<{
    reels: MarketListing[];
    initialIndex: number;
  } | null>(null);

  // Post Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postBanner, setPostBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Hidden File Input Refs
  const galleryImageInputRef = useRef<HTMLInputElement>(null);
  const cameraImageInputRef = useRef<HTMLInputElement>(null);
  const galleryVideoInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoInputRef = useRef<HTMLInputElement>(null);
  const feedTopRef = useRef<HTMLDivElement>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MarketListing['type']>('sell_crop');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('₹ / क्विंटल');
  const [newQuantity, setNewQuantity] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newState, setNewState] = useState('मध्य प्रदेश');
  const [newSeller, setNewSeller] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFileName, setMediaFileName] = useState('');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoThumbData, setVideoThumbData] = useState('');
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  const [newCompanyName, setNewCompanyName] = useState('');
  const [newDiscountOffer, setNewDiscountOffer] = useState('');

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});

  // Subscribe to Firebase Auth & live Firestore Bazaar feed + fetch shared server listings
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
    });

    const unsubCloud = subscribeToBazaarListings(
      (items) => {
        setCloudListings(items);
        setIsLoadingFeed(false);
      },
      () => {
        setIsLoadingFeed(false);
      }
    );

    const loadServerListings = async () => {
      try {
        const res = await fetchApi('/api/bazaar/listings', undefined, 10000);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.listings)) {
            setServerListings(data.listings);
          }
        }
      } catch {
        // silent offline fallback
      } finally {
        setIsLoadingFeed(false);
      }
    };

    void loadServerListings();
    const poll = setInterval(loadServerListings, 30000);

    return () => {
      unsubAuth();
      unsubCloud();
      clearInterval(poll);
    };
  }, []);

  // Persist user's local fallback drafts (without large base64 videos)
  useEffect(() => {
    try {
      const safe = localDraftListings.slice(0, 20).map((item) => ({
        ...item,
        videoUrl:
          item.videoUrl && item.videoUrl.startsWith('blob:') ? undefined : item.videoUrl,
      }));
      localStorage.setItem(LOCAL_LISTINGS_KEY, JSON.stringify(safe));
    } catch {
      // ignore quota
    }
  }, [localDraftListings]);

  useEffect(() => {
    try {
      localStorage.setItem(OWNED_IDS_KEY, JSON.stringify(ownedIds.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [ownedIds]);

  // Combined REAL community listings (Firestore + Shared Server + Local) deduplicated by id
  const realListings = useMemo(() => {
    const byId = new Map<string, MarketListing>();

    for (const item of localDraftListings) {
      byId.set(item.id, { ...item, isDemo: false });
    }
    for (const item of serverListings) {
      byId.set(item.id, { ...item, isDemo: false, isCloudPost: true });
    }
    for (const item of cloudListings) {
      const existing = byId.get(item.id);
      byId.set(item.id, {
        ...existing,
        ...item,
        videoUrl: item.videoUrl || existing?.videoUrl,
        imageUrl: item.imageUrl || existing?.imageUrl || '',
        isDemo: false,
        isCloudPost: true,
      });
    }

    return Array.from(byId.values()).sort(
      (a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)
    );
  }, [cloudListings, serverListings, localDraftListings]);

  const demoListings = useMemo(
    () => mockMarketListings.map((d) => ({ ...d, isDemo: true })),
    []
  );

  const filterFn = (item: MarketListing) => {
    const hasVideo =
      item.mediaType === 'video' ||
      !!item.videoUrl ||
      !!item.videoMediaId ||
      !!item.externalVideoUrl;

    const matchType =
      selectedType === 'all'
        ? true
        : selectedType === 'reels'
        ? hasVideo
        : item.type === selectedType;

    const q = searchTerm.trim().toLowerCase();
    const matchSearch =
      !q ||
      item.title[language].toLowerCase().includes(q) ||
      item.location[language].toLowerCase().includes(q) ||
      item.sellerName.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      (item.companyName && item.companyName.toLowerCase().includes(q));

    return matchType && matchSearch;
  };

  const filteredRealListings = realListings.filter(filterFn);
  const filteredDemoListings = demoListings.filter(filterFn);

  const openPostModal = (preset: 'general' | 'reel' | 'company_promo' = 'general') => {
    setFormError(null);
    setUploadProgress(0);
    if (userProfile) {
      if (!newSeller.trim() && userProfile.displayName) setNewSeller(userProfile.displayName);
      if (!newPhone.trim() && userProfile.phone) setNewPhone(userProfile.phone);
      if (!newLocation.trim() && (userProfile.village || userProfile.district)) {
        setNewLocation([userProfile.village, userProfile.district].filter(Boolean).join(', '));
      }
      if (userProfile.state) setNewState(userProfile.state);
    }
    if (preset === 'reel') {
      setNewType('farm_experience');
      setMediaType('video');
    } else if (preset === 'company_promo') {
      setNewType('company_promo');
      setMediaType('image');
    }
    setIsModalOpen(true);
  };

  const handleGoogleConnect = async () => {
    setAuthNotice(null);
    try {
      await signInWithGooglePopup();
    } catch (err: any) {
      const code = String(err?.code || err?.message || '');
      if (code.includes('unauthorized-domain')) {
        setAuthNotice(
          'इस वेबसाइट डोमेन पर Google लॉगिन अभी Firebase में अधिकृत नहीं है, पर चिंता न करें — आपकी पोस्ट और वीडियो सीधे साझा सर्वर पर सभी किसानों के लिए लाइव सेव हो रहे हैं।'
        );
      } else if (!code.includes('popup-closed-by-user')) {
        setAuthNotice('Google लॉगिन नहीं हो सका — आपकी पोस्ट साझा सर्वर पर सीधे सेव होगी।');
      }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError(null);
    setIsProcessingMedia(true);
    setMediaFileName(file.name);
    setSelectedVideoFile(null);
    setVideoThumbData('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 820;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        setMediaUrl(compressedBase64);
        setMediaType('image');
        setIsProcessingMedia(false);
      };
      img.onerror = () => {
        setIsProcessingMedia(false);
        setFormError('यह फोटो लोड नहीं हो सकी। कृपया दूसरी फोटो चुनें।');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError(null);
    if (file.size > 22 * 1024 * 1024) {
      setFormError(
        `चयनित वीडियो ${(file.size / (1024 * 1024)).toFixed(1)} MB का है। कृपया 20 MB से छोटा वीडियो (लगभग 30-45 सेकंड की रील) चुनें या नीचे YouTube/Instagram लिंक डालें।`
      );
      return;
    }

    setIsProcessingMedia(true);
    setMediaFileName(file.name);
    setSelectedVideoFile(file);
    setMediaType('video');

    const videoObjUrl = URL.createObjectURL(file);
    setMediaUrl(videoObjUrl);

    const thumb = await extractVideoThumbnailDataUrl(file);
    setVideoThumbData(thumb);
    setIsProcessingMedia(false);
  };

  const resetForm = () => {
    setNewTitle('');
    setNewPrice('');
    setNewQuantity('');
    setNewDesc('');
    setMediaUrl('');
    setMediaFileName('');
    setSelectedVideoFile(null);
    setVideoThumbData('');
    setExternalVideoUrl('');
    setNewCompanyName('');
    setNewDiscountOffer('');
    setFormError(null);
    setUploadProgress(0);
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanTitle = newTitle.trim();
    const cleanSeller = newSeller.trim();
    const cleanPhoneRaw = newPhone.trim();
    const digits = cleanDigits(cleanPhoneRaw);

    if (cleanTitle.length < 3) {
      setFormError('कृपया विज्ञापन/रील का स्पष्ट शीर्षक (कम से कम 3 अक्षर) लिखें।');
      return;
    }
    if (cleanSeller.length < 2) {
      setFormError('कृपया अपना या अपनी दुकान का नाम लिखें।');
      return;
    }
    if (digits.length < 10) {
      setFormError('कृपया सही 10 अंकों का मोबाइल / WhatsApp नंबर दर्ज करें ताकि खरीदार कॉल कर सकें।');
      return;
    }
    const cleanExtUrl = externalVideoUrl.trim();
    if (cleanExtUrl && !/^https?:\/\/.+/i.test(cleanExtUrl)) {
      setFormError('वीडियो लिंक हमेशा https:// या http:// से शुरू होना चाहिए।');
      return;
    }

    if (
      mediaType === 'video' &&
      !selectedVideoFile &&
      !cleanExtUrl &&
      !mediaUrl
    ) {
      setFormError(
        'आपने वीडियो/रील चुना है — कृपया गैलरी या कैमरे से वीडियो चुनें, या नीचे वीडियो लिंक डालें (या ऊपर 📷 फोटो विकल्प चुनें)।'
      );
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(15);

    const isExp = newType === 'farm_experience';
    const isCompany = newType === 'company_promo';

    const chosenThumb =
      mediaType === 'image'
        ? mediaUrl || SAFE_CROP_SVG
        : videoThumbData || SAFE_CROP_SVG;

    const unitLabel = isExp
      ? 'निःशुल्क अनुभव'
      : isCompany
      ? newUnit || '₹ / पैक'
      : newUnit || '₹ / क्विंटल';

    const generatedId = `bz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let savedEntry: MarketListing | null = null;
    let savedToCloudOrServer = false;

    try {
      // 1. Try permanent Firestore Cloud publish if signed in with Google & video <= ~5.8 MB
      const canTryFirestoreVideo =
        !selectedVideoFile || selectedVideoFile.size <= 5.5 * 1024 * 1024;

      if (currentUser && currentUser.emailVerified && canTryFirestoreVideo) {
        try {
          setUploadProgress(25);
          savedEntry = await publishBazaarListingToCloud({
            id: generatedId,
            type: newType,
            title: cleanTitle,
            description: newDesc.trim() || 'संपर्क करें।',
            price: isExp ? 0 : Number(newPrice || 0),
            priceUnit: unitLabel,
            quantity: isExp ? 'अनुभव / वीडियो' : newQuantity.trim() || 'उपलब्ध',
            location: newLocation.trim() || 'विदिशा, मध्य प्रदेश',
            state: newState.trim() || 'मध्य प्रदेश',
            sellerName: cleanSeller,
            contactPhone: digits,
            mediaType,
            thumbnailData: chosenThumb,
            externalVideoUrl: externalVideoUrl.trim() || undefined,
            companyName: isCompany ? newCompanyName.trim() || 'अधिकृत कृषि केंद्र' : undefined,
            discountOffer: isCompany ? newDiscountOffer.trim() || 'विशेष किसान छूट' : undefined,
            videoFile: mediaType === 'video' ? selectedVideoFile : null,
            onProgress: (pct) => setUploadProgress(Math.max(25, Math.min(95, pct))),
          });
          savedToCloudOrServer = true;
        } catch (cloudErr) {
          console.warn('Firestore publish fallback to shared server:', cloudErr);
        }
      }

      // 2. Also upload / publish to Shared Express Server (/api/bazaar/media & /api/bazaar/listings)
      // Works for ALL users even without Google sign-in and supports videos up to 22 MB!
      let serverVideoUrl: string | undefined = externalVideoUrl.trim() || undefined;
      if (!savedEntry && mediaType === 'video' && selectedVideoFile) {
        setUploadProgress(40);
        const dataUrl = await fileToDataUrl(selectedVideoFile);
        setUploadProgress(65);
        const mediaRes = await fetchApi(
          '/api/bazaar/media',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64: dataUrl,
              mimeType: selectedVideoFile.type || 'video/mp4',
              fileName: selectedVideoFile.name,
            }),
          },
          60000
        );
        if (!mediaRes.ok) {
          const errJson = await mediaRes.json().catch(() => ({}));
          throw new Error(errJson?.message || errJson?.error || 'वीडियो सर्वर पर अपलोड नहीं हो सका।');
        }
        const mediaData = await mediaRes.json();
        serverVideoUrl = mediaData.url;
        setUploadProgress(85);
      }

      if (!savedEntry) {
        const entryPayload: MarketListing = {
          id: generatedId,
          authorUid: currentUser?.uid,
          title: { hi: cleanTitle, en: cleanTitle },
          type: newType,
          price: isExp ? 0 : Number(newPrice || 0),
          priceUnit: { hi: unitLabel, en: unitLabel },
          quantity: isExp ? 'अनुभव / वीडियो' : newQuantity.trim() || 'उपलब्ध',
          location: {
            hi: newLocation.trim() || 'विदिशा, मध्य प्रदेश',
            en: newLocation.trim() || 'Vidisha, MP',
          },
          state: { hi: newState.trim() || 'मध्य प्रदेश', en: newState.trim() || 'MP' },
          sellerName: cleanSeller,
          phone: digits,
          date: 'आज',
          imageUrl: chosenThumb,
          mediaType,
          videoUrl: serverVideoUrl,
          externalVideoUrl: externalVideoUrl.trim() || undefined,
          description: {
            hi: newDesc.trim() || 'संपर्क करें।',
            en: newDesc.trim() || 'Contact seller.',
          },
          verified: true,
          isCompanyPromo: isCompany,
          companyName: isCompany ? newCompanyName.trim() || 'अधिकृत कृषि केंद्र' : undefined,
          discountOffer: isCompany ? newDiscountOffer.trim() || 'विशेष किसान छूट' : undefined,
          likes: 1,
          isCloudPost: true,
          isDemo: false,
          createdAtMs: Date.now(),
        };

        try {
          const postRes = await fetchApi(
            '/api/bazaar/listings',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(entryPayload),
            },
            20000
          );
          if (postRes.ok) {
            const data = await postRes.json();
            savedEntry = data?.listing || entryPayload;
            savedToCloudOrServer = true;
            setServerListings((prev) => [savedEntry!, ...prev.filter((x) => x.id !== savedEntry!.id)]);
          } else {
            savedEntry = entryPayload;
          }
        } catch {
          savedEntry = entryPayload;
        }
      }

      // If video was uploaded from device, cache local playable URL too for instant zero-lag preview
      if (savedEntry) {
        if (mediaType === 'video' && mediaUrl && mediaUrl.startsWith('blob:')) {
          setResolvedVideoUrls((prev) => ({ ...prev, [savedEntry!.id]: mediaUrl }));
        }
        setOwnedIds((prev) => Array.from(new Set([savedEntry!.id, ...prev])));
        setLocalDraftListings((prev) => [
          savedEntry!,
          ...prev.filter((x) => x.id !== savedEntry!.id),
        ]);
      }

      setUploadProgress(100);
      setIsModalOpen(false);
      resetForm();

      // Switch filter so the new post/reel is immediately visible at top
      setSearchTerm('');
      setSelectedType(mediaType === 'video' ? 'reels' : 'all');

      setPostBanner({
        type: 'success',
        text: savedToCloudOrServer
          ? `✅ "${cleanTitle}" सफलतापूर्वक लाइव प्रकाशित हो गया है! अब सभी किसान और खरीदार इसे देख सकते हैं व आपके नंबर ${digits} पर संपर्क कर सकते हैं।`
          : `✅ "${cleanTitle}" आपके फोन में सेव हो गया है। (इंटरनेट से जुड़ते ही सभी को दिखेगा)`,
      });

      setTimeout(() => {
        feedTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err: any) {
      setFormError(err?.message || 'प्रकाशित करने में समस्या आई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVideoItem = (item: MarketListing) =>
    item.mediaType === 'video' ||
    !!item.videoUrl ||
    !!item.videoMediaId ||
    !!item.externalVideoUrl;

  const openFullscreenReels = (clickedItem?: MarketListing) => {
    const realReels = realListings.filter(isVideoItem);
    const demoReels = demoListings.filter(isVideoItem);
    const combinedReels = [...realReels, ...demoReels];
    if (combinedReels.length === 0) return;

    const idx = clickedItem
      ? Math.max(
          0,
          combinedReels.findIndex((r) => r.id === clickedItem.id)
        )
      : 0;

    setReelsModal({ reels: combinedReels, initialIndex: idx });
  };

  const handleLikeListing = async (item: MarketListing) => {
    if (likedIds[item.id]) return;
    setLikedIds((prev) => ({ ...prev, [item.id]: true }));
    const nextLikes = (item.likes || 0) + 1;

    setLocalDraftListings((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, likes: nextLikes } : x))
    );
    setServerListings((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, likes: nextLikes } : x))
    );

    if (item.isCloudPost && currentUser && !item.isDemo) {
      likeBazaarListingInCloud(item.id, item.likes || 0).catch(() => {});
    }
    if (!item.isDemo) {
      fetchApi(`/api/bazaar/listings/${encodeURIComponent(item.id)}/like`, {
        method: 'POST',
      }).catch(() => {});
    }
  };

  const handleDeleteListing = async (item: MarketListing) => {
    if (item.isDemo) return;
    setLocalDraftListings((prev) => prev.filter((x) => x.id !== item.id));
    setServerListings((prev) => prev.filter((x) => x.id !== item.id));
    setCloudListings((prev) => prev.filter((x) => x.id !== item.id));

    if (currentUser && (item.authorUid === currentUser.uid || isVerifiedAdminUser(currentUser))) {
      deleteBazaarListingInCloud(item.id, item.videoMediaId).catch(() => {});
    }
    fetchApi(`/api/bazaar/listings/${encodeURIComponent(item.id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  };

  const handleShareListing = (item: MarketListing) => {
    const text = `🌾 *किसान सेतु बाज़ार:* ${item.title.hi}\n📍 स्थान: ${item.location.hi}, ${item.state.hi}\n👤 संपर्क: ${item.sellerName} (मोबाइल: ${item.phone})\n💰 दर: ${item.price > 0 ? `₹${item.price} ${item.priceUnit.hi}` : 'निःशुल्क अनुभव/वीडियो'}${item.discountOffer ? `\n🏷️ छूट: ${item.discountOffer}` : ''}\n📝 विवरण: ${item.description.hi}\n\n👉 किसान सेतु ऐप में देखें: ${window.location.href}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener');
  };

  const reelsCount = realListings.filter(isVideoItem).length;

  const renderCard = (item: MarketListing) => {
    const isExp = item.type === 'farm_experience';
    const isCompany = item.type === 'company_promo';
    const hasVideo = isVideoItem(item);
    const digits = cleanDigits(item.phone);
    const canDelete =
      !item.isDemo &&
      (ownedIds.includes(item.id) ||
        (currentUser &&
          (item.authorUid === currentUser.uid || isVerifiedAdminUser(currentUser))));

    return (
      <div
        key={item.id}
        className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
          isCompany
            ? 'border-purple-300 hover:border-purple-500 shadow-md ring-2 ring-purple-100'
            : isExp
            ? 'border-amber-300 hover:border-amber-500 shadow-xs ring-1 ring-amber-100'
            : 'border-gray-200 hover:border-emerald-400 hover:shadow-md'
        }`}
      >
        <div>
          {/* Large Instagram / Facebook Style Media Frame */}
          <div
            onClick={hasVideo ? () => openFullscreenReels(item) : undefined}
            className={`relative w-full bg-neutral-950 overflow-hidden group ${
              hasVideo
                ? 'h-[400px] sm:h-[440px] cursor-pointer'
                : 'h-64 sm:h-72'
            }`}
          >
            <img
              src={item.imageUrl || SAFE_CROP_SVG}
              alt={item.title[language]}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = SAFE_CROP_SVG;
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Measured gradient scrim for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35 pointer-events-none" />

            {hasVideo && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFullscreenReels(item);
                  }}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-rose-600/95 hover:bg-rose-700 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer border-2 border-white"
                  title="इंस्टाग्राम/फेसबुक जैसी बड़ी रील चलाएं"
                >
                  <Play className="w-8 h-8 fill-white ml-1" />
                </button>

                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 text-white pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-xs font-black flex items-center gap-1.5 border border-white/20">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>फुल-स्क्रीन रील देखें (स्वाइप ↕️)</span>
                  </span>
                </div>
              </>
            )}

            {/* Category Label */}
            <span
              className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[11px] font-black backdrop-blur-xs ${
                isCompany
                  ? 'bg-purple-900/90 text-amber-300 border border-purple-400'
                  : isExp
                  ? 'bg-amber-400 text-emerald-950 font-black'
                  : 'bg-emerald-950/90 text-amber-300'
              }`}
            >
              {isCompany
                ? hasVideo
                  ? '🎬 दुकानदार रील / प्रचार'
                  : '🧪 कृषि सेवा केंद्र'
                : isExp
                ? hasVideo
                  ? '🎬 किसान रील'
                  : '💡 फसल अनुभव'
                : item.type === 'rent_equipment'
                ? '🚜 यंत्र किराया'
                : item.type === 'sell_crop'
                ? '🌾 फसल बिक्री'
                : item.type === 'dairy_livestock'
                ? '🐄 पशुधन'
                : '🌱 बीज व खाद'}
            </span>

            {/* Right label: Live vs Demo */}
            {item.isDemo ? (
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-900/90 text-gray-200">
                उदाहरण (Demo)
              </span>
            ) : (
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3" />
                <span>लाइव</span>
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {item.location[language]}, {item.state[language]}
                </span>
              </span>
              <span className="shrink-0 font-semibold">{item.date}</span>
            </div>

            {isCompany && item.companyName && (
              <div className="flex items-center gap-1.5 mb-1 text-purple-900 font-extrabold text-xs">
                <Building2 className="w-3.5 h-3.5 text-purple-700" />
                <span>{item.companyName}</span>
              </div>
            )}

            <h3 className="font-extrabold text-gray-900 text-base leading-tight mb-1.5">
              {item.title[language]}
            </h3>

            <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-3">
              {item.description[language]}
            </p>

            {/* Price, Offer or Experience Banner */}
            {isCompany ? (
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-purple-800 block">
                      कीमत / ऑफर
                    </span>
                    <span className="text-lg font-black text-purple-950">
                      {item.price > 0
                        ? `₹${item.price.toLocaleString('en-IN')}`
                        : 'विशेष ऑफर'}{' '}
                      {item.price > 0 && (
                        <span className="text-xs font-bold text-purple-800">
                          {item.priceUnit[language]}
                        </span>
                      )}
                    </span>
                  </div>
                  {item.discountOffer && (
                    <span className="text-xs font-black bg-amber-400 text-purple-950 px-2 py-1 rounded-md shadow-2xs flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5" />
                      {item.discountOffer}
                    </span>
                  )}
                </div>
              </div>
            ) : isExp ? (
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-950">
                <span className="font-bold flex items-center gap-1 text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  {hasVideo ? 'किसान वीडियो रील' : 'किसान अनुभव'}
                </span>
                <button
                  type="button"
                  onClick={() => handleLikeListing(item)}
                  className={`font-extrabold px-2.5 py-0.5 rounded border flex items-center gap-1 cursor-pointer transition-colors ${
                    likedIds[item.id]
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-amber-950 border-amber-200 hover:bg-rose-50'
                  }`}
                >
                  <Heart className="w-3 h-3 fill-current" />
                  <span>{item.likes || 1} पसंद</span>
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-emerald-800 block">
                    मूल्य / दर
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-emerald-950">
                      {item.price > 0
                        ? `₹${item.price.toLocaleString('en-IN')}`
                        : 'बातचीत द्वारा'}
                    </span>
                    {item.price > 0 && (
                      <span className="text-xs font-semibold text-emerald-800">
                        {item.priceUnit[language]}
                      </span>
                    )}
                  </div>
                </div>
                {item.quantity && (
                  <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded-md border border-gray-200">
                    {item.quantity}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions with Visible Mobile Number, Call, WhatsApp & Delete */}
        <div className="p-4 pt-0 space-y-2.5">
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-gray-400 block text-[10px]">
                {isCompany ? 'दुकानदार / डीलर:' : 'किसान / विक्रेता:'}
              </span>
              <span className="font-bold text-gray-900 text-xs block truncate">
                {item.sellerName}
              </span>
              <span className="font-black text-emerald-800 text-xs block">
                📞 {item.phone}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleLikeListing(item)}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  likedIds[item.id]
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-rose-50'
                }`}
                title="पसंद करें"
              >
                <Heart className={`w-3.5 h-3.5 ${likedIds[item.id] ? 'fill-rose-600' : ''}`} />
                <span className="text-[11px]">{item.likes || 1}</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareListing(item)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-800 transition-colors cursor-pointer"
                title="व्हाट्सएप पर शेयर करें"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDeleteListing(item)}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                  title="अपनी पोस्ट हटाएं"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${digits}`}
              className={`py-2 px-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
                isCompany
                  ? 'bg-purple-800 hover:bg-purple-900'
                  : 'bg-emerald-800 hover:bg-emerald-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-amber-300" />
              <span>सीधे कॉल करें</span>
            </a>

            <a
              href={`https://wa.me/91${digits}?text=${encodeURIComponent(
                `नमस्ते ${item.sellerName} जी, मैंने किसान सेतु ऐप पर आपकी पोस्ट "${item.title.hi}" देखी। कृपया अधिक जानकारी दें।`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12" ref={feedTopRef}>
      {/* Header & Direct Action Buttons */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                लाइव साझा बाज़ार सक्रिय
              </span>
              <span className="text-xs text-gray-500">
                सभी पोस्ट व रील सभी किसानों को दिखती हैं
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
              किसान बाज़ार, कृषि सेवा केंद्र व रील्स मंच
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              अपनी फसल, ट्रैक्टर/ड्रोन किराया, दवाई दुकान प्रचार या खेत की रील (वीडियो) डालें — हर
              पोस्ट तुरंत लाइव होती है और खरीदार सीधे आपके नंबर पर कॉल या WhatsApp कर सकते हैं।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => openFullscreenReels()}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Play className="w-4 h-4 fill-emerald-950" />
              <span>▶️ बड़ी रील्स देखें (Insta जैसा)</span>
            </button>

            <button
              type="button"
              onClick={() => openPostModal('reel')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Film className="w-4 h-4 text-amber-300" />
              <span>🎬 + नई रील / वीडियो डालें</span>
            </button>

            <button
              type="button"
              onClick={() => openPostModal('general')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>+ विज्ञापन / दुकान प्रचार पोस्ट करें</span>
            </button>
          </div>
        </div>

        {/* Live status strip */}
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-950 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              {currentUser
                ? `🟢 Google क्लाउड सिंक चालू (${currentUser.displayName || currentUser.email}) — आपकी रील व विज्ञापन स्थायी रूप से सुरक्षित हैं।`
                : '🟢 साझा बाज़ार चालू है — बिना लॉगिन के भी आपकी पोस्ट व वीडियो सीधे सभी यूजर्स को दिखेंगे।'}
            </span>
          </div>
          {!currentUser && (
            <button
              type="button"
              onClick={handleGoogleConnect}
              className="px-3 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-bold hover:bg-emerald-100 cursor-pointer shrink-0 self-start sm:self-auto"
            >
              Google से जुड़ें (वैकल्पिक)
            </button>
          )}
        </div>

        {authNotice && (
          <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold">
            ℹ️ {authNotice}
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="फसल, दवा कंपनी, दुकान, मोबाइल या किसान..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              सभी लाइव ({realListings.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('reels')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'reels'
                  ? 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-400'
                  : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>🎬 किसान रील्स / वीडियो ({reelsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('company_promo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedType === 'company_promo'
                  ? 'bg-purple-800 text-white shadow-2xs'
                  : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>🧪 दवाई दुकान व कंपनी प्रचार</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('farm_experience')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'farm_experience'
                  ? 'bg-amber-500 text-emerald-950 shadow-2xs'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
            >
              💡 किसान अनुभव
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('sell_crop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'sell_crop'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🌾 फसल/अनाज बिक्री
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('rent_equipment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'rent_equipment'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚜 ट्रैक्टर व ड्रोन
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('seeds_fertilizer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'seeds_fertilizer'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🌱 बीज व खाद
            </button>
          </div>
        </div>
      </div>

      {/* Post confirmation banner */}
      {postBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 text-xs sm:text-sm font-bold shadow-xs ${
            postBanner.type === 'success'
              ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <span>{postBanner.text}</span>
          <button
            type="button"
            onClick={() => setPostBanner(null)}
            className="p-1 rounded-lg hover:bg-black/10 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dedicated Reels Upload & Fullscreen Launch Banner when user clicks the Reels tab */}
      {selectedType === 'reels' && (
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-800 rounded-2xl p-5 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-black mb-1">
              <Video className="w-4 h-4" />
              <span>किसान रील्स व वीडियो प्रचार (इंस्टा / फेसबुक जैसा)</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              बड़ी फुल-स्क्रीन रील्स देखें या अपने खेत/दुकान का वीडियो अपलोड करें!
            </h3>
            <p className="text-xs text-rose-100 mt-1">
              रील पर टैप करते ही पूरा वीडियो इंस्टाग्राम व फेसबुक की तरह बड़ी स्क्रीन पर चलेगा — ऊपर
              स्वाइप करके अगली रील देख सकते हैं।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => openFullscreenReels()}
              className="min-h-[44px] px-5 py-3 rounded-xl bg-white hover:bg-amber-50 text-rose-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-rose-700 text-rose-700" />
              <span>▶️ बड़ी रील्स चलाएं</span>
            </button>
            <button
              type="button"
              onClick={() => openPostModal('reel')}
              className="min-h-[44px] px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-rose-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-95"
            >
              <Film className="w-4 h-4" />
              <span>+ रील अपलोड करें</span>
            </button>
          </div>
        </div>
      )}

      {/* LIVE COMMUNITY FEED */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm sm:text-base font-black text-emerald-950">
            किसानों व दुकानदारों की लाइव पोस्ट ({filteredRealListings.length})
          </h3>
        </div>

        {isLoadingFeed && filteredRealListings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-emerald-100 text-center text-gray-600 text-sm flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
            <span>लाइव किसान बाज़ार की पोस्ट लोड हो रही हैं...</span>
          </div>
        ) : filteredRealListings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-emerald-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              {selectedType === 'reels' ? (
                <Film className="w-6 h-6 text-rose-700" />
              ) : (
                <PlusCircle className="w-6 h-6" />
              )}
            </div>
            <h4 className="text-base sm:text-lg font-black text-emerald-950">
              {selectedType === 'reels'
                ? 'अभी इस श्रेणी में कोई लाइव वीडियो रील नहीं डली है'
                : 'अभी इस श्रेणी में कोई लाइव पोस्ट नहीं है'}
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              नीचे बटन दबाकर पहली असली रील या विज्ञापन डालें — आपकी पोस्ट व मोबाइल नंबर तुरंत सभी
              किसानों को दिखना शुरू हो जाएगा।
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => openPostModal(selectedType === 'reels' ? 'reel' : 'general')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs"
              >
                {selectedType === 'reels'
                  ? '🎬 पहली रील / वीडियो अपलोड करें'
                  : '+ पहला विज्ञापन / दुकान प्रचार डालें'}
              </button>
              {selectedType === 'reels' && (
                <button
                  type="button"
                  onClick={() => openFullscreenReels()}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>▶️ बड़ी रील्स चलाकर देखें</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`grid gap-5 ${
              selectedType === 'reels'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {filteredRealListings.map(renderCard)}
          </div>
        )}
      </div>

      {/* Collapsible Demo Examples Section — separated from real listings */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
        <button
          type="button"
          onClick={() => setShowDemoExamples((prev) => !prev)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div>
            <span className="text-xs sm:text-sm font-black text-gray-800 block">
              📘 नमूना उदाहरण देखें (Demo Examples — केवल समझने के लिए)
            </span>
            <span className="text-[11px] text-gray-500">
              ये उदाहरण सिर्फ ऐप का तरीका दिखाने के लिए हैं; असली किसान व दुकानदार पोस्ट ऊपर लाइव
              दिखती हैं।
            </span>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-700 flex items-center gap-1 shrink-0">
            {showDemoExamples ? (
              <>
                <span>छुपाएं</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>देखें ({filteredDemoListings.length})</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </span>
        </button>

        {showDemoExamples && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDemoListings.map(renderCard)}
          </div>
        )}
      </div>

      {/* Post Listing / Reel / Company Promotion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                if (!isSubmitting) setIsModalOpen(false);
              }}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-gray-950 mb-1 pr-8">
              विज्ञापन, दवाई दुकान प्रचार या रील (वीडियो) पोस्ट करें
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              सबमिट करते ही आपकी पोस्ट और मोबाइल नंबर सभी किसानों व खरीदारों को लाइव दिखने लगेगा
            </p>

            {formError && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateListing} noValidate className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-gray-700 block mb-1">विज्ञापन / पोस्ट का प्रकार:</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as MarketListing['type'])}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 font-bold"
                >
                  <option value="sell_crop">🌾 फसल / अनाज बिक्री (Sell Produce)</option>
                  <option value="company_promo">🧪 कृषि सेवा केंद्र / दवाई दुकानदार व कंपनी प्रचार</option>
                  <option value="farm_experience">🎬 किसान रील / वीडियो अनुभव साझा करें</option>
                  <option value="rent_equipment">🚜 कृषि यंत्र किराया (Tractor / Drone Rental)</option>
                  <option value="seeds_fertilizer">🌱 बीज व जैविक खाद बिक्री</option>
                  <option value="dairy_livestock">🐄 पशुधन व डेयरी</option>
                </select>
              </div>

              {newType === 'company_promo' && (
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 space-y-2">
                  <span className="font-black text-purple-950 text-xs block">
                    🧪 कंपनी / दुकानदार विशेष विवरण:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">कंपनी / ब्रांड नाम</label>
                      <input
                        type="text"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="उदा. बायेर / सिंजेंटा / इफको"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">छूट / ऑफर</label>
                      <input
                        type="text"
                        value={newDiscountOffer}
                        onChange={(e) => setNewDiscountOffer(e.target.value)}
                        placeholder="उदा. 15% छूट + गिफ्ट"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  शीर्षक (Title) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    mediaType === 'video'
                      ? 'उदा. सोयाबीन में दवाई छिड़काव का शानदार रिजल्ट देखें'
                      : newType === 'company_promo'
                      ? 'उदा. कोराजन कीटनाशक पर विशेष किसान छूट व डेमो'
                      : 'उदा. शरबती गेहूं 40 क्विंटल या ट्रैक्टर किराये पर'
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>

              {/* Camera & Gallery Upload: Photo vs Video Reel */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border-2 border-emerald-200">
                <input
                  type="file"
                  ref={galleryImageInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraImageInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={galleryVideoInputRef}
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraVideoInputRef}
                  accept="video/*"
                  capture="environment"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />

                <div className="flex items-center justify-between mb-2">
                  <label className="font-black text-emerald-950 text-xs sm:text-sm block">
                    📸 गैलरी या कैमरे से अपलोड करें:
                  </label>
                  <span className="text-[10px] bg-rose-100 text-rose-900 font-bold px-2 py-0.5 rounded-full">
                    रील अधिकतम 20 MB
                  </span>
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('image');
                      setSelectedVideoFile(null);
                      setVideoThumbData('');
                      if (mediaType !== 'image') {
                        setMediaUrl('');
                        setMediaFileName('');
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      mediaType === 'image'
                        ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-400'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>📷 फोटो</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('video');
                      if (mediaType !== 'video') {
                        setMediaUrl('');
                        setMediaFileName('');
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      mediaType === 'video'
                        ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-400'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>🎬 रील्स / वीडियो</span>
                  </button>
                </div>

                {mediaType === 'image' ? (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => cameraImageInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Camera className="w-4 h-4 text-amber-300" />
                      <span>कैमरे से फोटो लें</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryImageInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>गैलरी से फोटो चुनें</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 mb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => cameraVideoInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Camera className="w-4 h-4 text-amber-300" />
                        <span>कैमरे से रील बनाएं</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => galleryVideoInputRef.current?.click()}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 border border-rose-300 text-rose-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Film className="w-4 h-4 text-rose-600" />
                        <span>गैलरी से वीडियो चुनें</span>
                      </button>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                      <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1 mb-1">
                        <LinkIcon className="w-3 h-3" />
                        <span>या YouTube / बड़े वीडियो का लिंक डालें (वैकल्पिक):</span>
                      </label>
                      <input
                        type="url"
                        value={externalVideoUrl}
                        onChange={(e) => setExternalVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/shorts/..."
                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs"
                      />
                    </div>
                  </div>
                )}

                {isProcessingMedia ? (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 text-center text-xs text-gray-600 animate-pulse">
                    ⏳ फ़ाइल और थंबनेल तैयार किया जा रहा है...
                  </div>
                ) : mediaUrl ? (
                  <div className="bg-white p-3 rounded-xl border border-emerald-300 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900 flex items-center gap-1 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          तैयार है {mediaFileName ? `(${mediaFileName})` : ''}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaUrl('');
                          setMediaFileName('');
                          setSelectedVideoFile(null);
                          setVideoThumbData('');
                        }}
                        className="text-red-600 hover:text-red-800 font-bold flex items-center gap-1 text-[11px] cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>हटाएं</span>
                      </button>
                    </div>

                    {mediaType === 'image' ? (
                      <div className="relative h-44 rounded-lg overflow-hidden border border-gray-200 bg-black">
                        <img
                          src={mediaUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
                        <video
                          src={mediaUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-48 object-contain rounded-lg"
                        />
                        <div className="p-1.5 bg-gray-900 text-amber-300 text-[10px] font-bold text-center">
                          ▶️ सबमिट करने पर यह वीडियो सभी किसानों को दिखेगा
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-1 text-[11px] text-gray-500">
                    💡 ऊपर बटन दबाकर कैमरे से रील बनाएं या गैलरी से वीडियो/फोटो चुनें।
                  </div>
                )}
              </div>

              {newType !== 'farm_experience' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">मूल्य (₹)</label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="1850"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">इकाई (Unit)</label>
                    <input
                      type="text"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="₹ / क्विंटल"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">मात्रा (Qty)</label>
                    <input
                      type="text"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      placeholder="40 क्विंटल"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {newType === 'company_promo' ? 'दुकान / विक्रेता नाम' : 'किसान का नाम'}{' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSeller}
                    onChange={(e) => setNewSeller(e.target.value)}
                    placeholder={
                      newType === 'company_promo'
                        ? 'उदा. श्री राम कृषि सेवा केंद्र'
                        : 'उदा. दिलीप रघुवंशी'
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    मोबाइल नंबर <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="98930XXXXX"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    गाँव / दुकान व तहसील
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="मंडी रोड, सिरोंज (विदिशा)"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">राज्य</label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  विवरण व दवा/उत्पाद का सही उपयोग:
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="उत्पाद की गुणवत्ता, डोज या अनुभव के बारे में लिखें..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                ></textarea>
              </div>

              {isSubmitting && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      लाइव बाज़ार में अपलोड हो रहा है...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-700 h-2 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || isProcessingMedia}
                className="w-full py-3 rounded-xl bg-emerald-800 text-white font-black hover:bg-emerald-900 disabled:opacity-60 transition-colors cursor-pointer mt-2 flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>प्रकाशित हो रहा है ({uploadProgress}%)...</span>
                  </>
                ) : mediaType === 'video' ? (
                  <span>🎬 रील / वीडियो लाइव प्रकाशित करें</span>
                ) : newType === 'company_promo' ? (
                  <span>🧪 दुकानदार / कंपनी प्रचार प्रकाशित करें</span>
                ) : (
                  <span>✅ विज्ञापन लाइव प्रकाशित करें</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Instagram/Facebook-style Vertical Reels Player */}
      {reelsModal && (
        <ReelsViewerModal
          reels={reelsModal.reels}
          initialIndex={reelsModal.initialIndex}
          language={language}
          resolvedVideoUrls={resolvedVideoUrls}
          onResolveVideoUrl={(id, url) =>
            setResolvedVideoUrls((prev) => ({ ...prev, [id]: url }))
          }
          likedIds={likedIds}
          onLike={handleLikeListing}
          onShare={handleShareListing}
          onUploadReel={() => openPostModal('reel')}
          onClose={() => setReelsModal(null)}
        />
      )}
    </div>
  );
};
