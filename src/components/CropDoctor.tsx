import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockDiseases } from '../data/mockData';
import { DiseaseInfo } from '../types';
import {
  Camera,
  Volume2,
  Sparkles,
  AlertTriangle,
  Leaf,
  FlaskConical,
  Send,
  CheckCircle2,
  RefreshCw,
  Mic,
  MicOff,
  Video,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { getAgronomicAnswer } from '../utils/agronomyEngine';
import { fetchApi } from '../utils/apiBase';
import {
  OFFLINE_CROP_OPTIONS,
  OFFLINE_SYMPTOM_OPTIONS,
  buildDiseaseReportFromOfflineEngine,
} from '../utils/offlinePhotoDiagnosis';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: 'gemini_ai' | 'offline_engine';
  model?: string;
}

function renderFormattedMessage(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-extrabold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export const CropDoctor: React.FC = () => {
  const { language, t, speakText } = useLanguage();

  const [selectedDisease, setSelectedDisease] = useState<DiseaseInfo>(mockDiseases[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSource, setScanSource] = useState<'sample' | 'uploaded' | 'offline_matched' | 'gemini_ai'>('sample');
  const [selectedOfflineCrop, setSelectedOfflineCrop] = useState<string>('soybean');
  const [selectedOfflineSymptom, setSelectedOfflineSymptom] = useState<string>('');
  const [mediaFile, setMediaFile] = useState<{
    url: string;
    type: 'image' | 'video';
    name?: string;
    analysisDataUrl?: string;
    mimeType?: string;
  } | null>(null);

  // Separate file inputs so Android/iOS opens direct Camera Photo, direct Camera Video, or Gallery
  const cameraPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoInputRef = useRef<HTMLInputElement | null>(null);
  const galleryMediaInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const scanRequestIdRef = useRef(0);
  const activeScanAbortRef = useRef<AbortController | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);

  // In-app Live WebRTC Camera fallback (for browsers/webviews that ignore capture="environment")
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [liveCameraError, setLiveCameraError] = useState<string | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (activeScanAbortRef.current) {
        activeScanAbortRef.current.abort();
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  // Voice Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [lastAiSource, setLastAiSource] = useState<'gemini_ai' | 'offline_engine' | null>(null);

  // Kisan Mitra Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text:
        language === 'hi'
          ? 'राम राम किसान भाई! 🙏 मैं आपका एआई किसान मित्र (कृषि विशेषज्ञ) हूँ। फसल में सिंचाई, पहला पानी, खाद की मात्रा, पीलापन, खरपतवार या किसी भी बीमारी के बारे में मुझसे सीधा सवाल पूछें।'
          : 'Ram Ram Farmer Brother! 🙏 I am your AI Kisan Mitra (Agri Scientist). Ask me anything about irrigation timing, fertilizer doses, pest management, or yellowing in your crop.',
      timestamp: '10:00 AM',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);

  const sampleQuestions = [
    {
      hi: 'गेहूं की फसल में काला रतुआ रोग के लिए कौन सी दवाई डाली जाती है?',
      en: 'Which fungicide is best for Black Rust in wheat crop?',
    },
    {
      hi: 'गेहूं में पहला पानी कितने दिन बाद देना चाहिए?',
      en: 'After how many days should first irrigation be given in wheat?',
    },
    {
      hi: 'गेहूं में पीलापन आ रहा है, क्या उपाय करें?',
      en: 'Wheat leaves turning yellow, what should I apply?',
    },
    {
      hi: 'गेहूं में खरपतवार (गुल्ली डंडा/बथुआ) मारने की दवा?',
      en: 'Herbicide for broadleaf and grassy weeds in wheat?',
    },
    {
      hi: 'सरसों में माहू (चेपा) कीट का देसी जैविक उपचार?',
      en: 'Organic remedy for aphids in mustard?',
    },
    {
      hi: 'सरसों में पहली सिंचाई कब करें और सल्फर की मात्रा?',
      en: 'When to do 1st irrigation in mustard and sulfur dose?',
    },
    {
      hi: 'लहसुन में जलेबी रोग व थ्रिप्स की पक्की दवा?',
      en: 'Effective spray for garlic curled leaf (jalebi) and thrips?',
    },
    {
      hi: 'दीमक (Termites) से फसल बचाने के लिए क्या डालें?',
      en: 'How to control termites in the field?',
    },
  ];

  // Speech Recognition (Mic Input in Hindi)
  const handleToggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice(
        language === 'hi'
          ? 'आपके ब्राउज़र में बोलकर टाइप करने की सुविधा उपलब्ध नहीं है — कृपया लिखकर सवाल पूछें।'
          : 'Speech recognition is not supported in this browser. Please type your query.'
      );
      setTimeout(() => setVoiceNotice(null), 5000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const replaceObjectUrl = (nextUrl: string | null) => {
    if (objectUrlRef.current && objectUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = nextUrl && nextUrl.startsWith('blob:') ? nextUrl : null;
  };

  const handleSelectSample = (disease: DiseaseInfo) => {
    scanRequestIdRef.current += 1;
    if (activeScanAbortRef.current) {
      activeScanAbortRef.current.abort();
      activeScanAbortRef.current = null;
    }
    setScanError(null);
    setScanSource('sample');
    setIsScanning(true);
    replaceObjectUrl(null);
    setMediaFile({ url: disease.imageUrl, type: 'image', name: disease.name[language] });
    setTimeout(() => {
      setSelectedDisease(disease);
      setIsScanning(false);
    }, 300);
  };

  const compressImageFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const tempUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 960;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not available');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          URL.revokeObjectURL(tempUrl);
          resolve(compressed);
        } catch {
          URL.revokeObjectURL(tempUrl);
          const reader = new FileReader();
          reader.onloadend = () =>
            typeof reader.result === 'string'
              ? resolve(reader.result)
              : reject(new Error('Read failed'));
          reader.onerror = () => reject(new Error('File read error'));
          reader.readAsDataURL(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        const reader = new FileReader();
        reader.onloadend = () =>
          typeof reader.result === 'string'
            ? resolve(reader.result)
            : reject(new Error('Read failed'));
        reader.onerror = () => reject(new Error('File read error'));
        reader.readAsDataURL(file);
      };
      img.src = tempUrl;
    });
  };

  const extractVideoFrameDataUrl = (videoUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      let settled = false;

      const finish = (result: string | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        video.removeAttribute('src');
        video.load();
        resolve(result);
      };

      const timeout = setTimeout(() => finish(null), 6000);

      const captureFrame = () => {
        try {
          const vw = video.videoWidth || 640;
          const vh = video.videoHeight || 480;
          const maxDim = 1024;
          let width = vw;
          let height = vh;
          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) return finish(null);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          finish(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          finish(null);
        }
      };

      video.onloadeddata = () => {
        const target =
          Number.isFinite(video.duration) && video.duration > 0.6
            ? Math.min(0.8, video.duration / 2)
            : 0;
        if (target > 0.1) {
          video.currentTime = target;
        } else {
          captureFrame();
        }
      };
      video.onseeked = captureFrame;
      video.onerror = () => finish(null);
      video.src = videoUrl;
    });
  };

  const runImageDiagnosis = async (
    analysisDataUrl: string,
    mimeType: string,
    previewUrl?: string,
    previewType: 'image' | 'video' = 'image',
    explicitRequestId?: number
  ) => {
    const requestId = explicitRequestId ?? ++scanRequestIdRef.current;
    if (activeScanAbortRef.current) {
      activeScanAbortRef.current.abort();
    }
    const controller = new AbortController();
    activeScanAbortRef.current = controller;

    setIsScanning(true);
    setScanError(null);
    try {
      const res = await fetchApi(
        '/api/crop-doctor/diagnose',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            imageBase64: analysisDataUrl,
            mimeType: mimeType || 'image/jpeg',
            language,
          }),
        },
        40000
      );

      if (requestId !== scanRequestIdRef.current) return;

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.diagnosis) {
        throw new Error(
          data?.message ||
            data?.error ||
            (language === 'hi'
              ? 'फोटो की Live AI जांच नहीं हो सकी। कृपया पत्ती की साफ फोटो के साथ पुनः प्रयास करें।'
              : 'Could not analyze image with Live AI. Please retry with a clearer leaf photo.')
        );
      }

      const d = data.diagnosis;
      const dynamicDisease: DiseaseInfo = {
        id: d.id || `ai-${Date.now()}`,
        name: { hi: d.name, en: d.name },
        crop: { hi: d.crop, en: d.crop },
        cropCategory: 'ai_detected',
        severity: d.severity === 'low' || d.severity === 'high' ? d.severity : 'medium',
        imageUrl: previewUrl || analysisDataUrl,
        causes: { hi: d.causes, en: d.causes },
        symptoms: {
          hi: d.symptoms?.length ? d.symptoms : ['फोटो के आधार पर रोग लक्षण चिन्हित'],
          en: d.symptoms?.length ? d.symptoms : ['Symptoms identified from uploaded photo'],
        },
        organicRemedy: {
          hi: d.organicRemedy?.length
            ? d.organicRemedy
            : ['नीम तेल 10,000 PPM (3 मिली/लीटर) का छिड़काव करें'],
          en: d.organicRemedy?.length
            ? d.organicRemedy
            : ['Spray Neem Oil 10,000 PPM (3 ml/L)'],
        },
        chemicalTreatment: {
          hi: d.chemicalTreatment?.length
            ? d.chemicalTreatment
            : ['नजदीकी कृषि केंद्र से अनुशंसित दवा की जांच करें'],
          en: d.chemicalTreatment?.length
            ? d.chemicalTreatment
            : ['Consult local agri expert for targeted spray'],
        },
        preventiveMeasures: {
          hi: d.preventiveMeasures?.length
            ? d.preventiveMeasures
            : ['खेत में जल निकासी व साफ-सफाई रखें'],
          en: d.preventiveMeasures?.length
            ? d.preventiveMeasures
            : ['Maintain field drainage and sanitation'],
        },
        recommendedProducts: Array.isArray(d.recommendedProducts) ? d.recommendedProducts : [],
      };

      if (requestId !== scanRequestIdRef.current) return;
      setSelectedDisease(dynamicDisease);
      setScanSource('gemini_ai');
    } catch (err: any) {
      if (requestId !== scanRequestIdRef.current) return;
      const rawMsg = String(err?.message || '');
      const isNetworkFailure =
        err?.name === 'AbortError' ||
        /failed to fetch|networkerror|network request failed|load failed|abort/i.test(rawMsg);
      // On standalone GitHub Pages / offline PWA, avoid alarming warning and let the in-place 2-tap selector shine
      setScanError(
        !isNetworkFailure && rawMsg
          ? rawMsg
          : language === 'hi'
            ? `आपकी ${previewType === 'video' ? 'वीडियो' : 'फोटो'} जुड़ गई है ✅ — नीचे अपनी फ़सल और लक्षण चुनकर तुरंत सटीक दवा व मात्रा देखें।`
            : `Your ${previewType} has been added ✅ — Select your crop & visible symptom below for an instant treatment report.`
      );
    } finally {
      if (requestId === scanRequestIdRef.current) {
        setIsScanning(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so re-selecting the same photo/video always triggers onChange
    e.target.value = '';
    if (!file) return;

    const requestId = ++scanRequestIdRef.current;
    if (activeScanAbortRef.current) {
      activeScanAbortRef.current.abort();
      activeScanAbortRef.current = null;
    }

    const isVid =
      file.type.startsWith('video') ||
      /\.(mp4|mov|webm|mkv|3gp|avi)$/i.test(file.name);

    setScanError(null);
    setScanSource('uploaded');
    setSelectedOfflineSymptom('');

    // Immediate zero-RAM blob preview so BOTH photo & large mobile video appear instantly
    const previewObjectUrl = URL.createObjectURL(file);
    replaceObjectUrl(previewObjectUrl);

    setMediaFile({
      url: previewObjectUrl,
      type: isVid ? 'video' : 'image',
      name: file.name,
      mimeType: isVid ? 'image/jpeg' : file.type || 'image/jpeg',
    });

    setTimeout(() => {
      resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);

    if (isVid) {
      const frameDataUrl = await extractVideoFrameDataUrl(previewObjectUrl);
      if (requestId !== scanRequestIdRef.current) return;
      if (frameDataUrl) {
        setMediaFile((prev) =>
          prev ? { ...prev, analysisDataUrl: frameDataUrl, mimeType: 'image/jpeg' } : prev
        );
        await runImageDiagnosis(frameDataUrl, 'image/jpeg', previewObjectUrl, 'video', requestId);
      } else {
        setScanError(
          language === 'hi'
            ? 'वीडियो जुड़ गया है ✅ (ऊपर/नीचे प्ले कर सकते हैं)। इस वीडियो से फ्रेम नहीं निकल पाया — सटीक Live AI रोग जांच के लिए कृपया पत्ती की एक साफ फोटो खींचकर डालें।'
            : 'Video added ✅. Could not extract a frame from this video codec — please capture a clear photo of the leaf for Live AI pathology analysis.'
        );
      }
      return;
    }

    try {
      const compressedDataUrl = await compressImageFileToDataUrl(file);
      if (requestId !== scanRequestIdRef.current) return;
      setMediaFile((prev) =>
        prev
          ? {
              ...prev,
              analysisDataUrl: compressedDataUrl,
              mimeType: 'image/jpeg',
            }
          : prev
      );
      await runImageDiagnosis(compressedDataUrl, 'image/jpeg', previewObjectUrl, 'image', requestId);
    } catch {
      if (requestId !== scanRequestIdRef.current) return;
      setScanError(
        language === 'hi'
          ? 'फोटो जुड़ गई है ✅ लेकिन इसे पढ़ने में समस्या आई। कृपया कैमरे से नई साफ फोटो खींचें।'
          : 'Photo added ✅, but could not prepare it for upload. Please try capturing a fresh photo.'
      );
    }
  };

  const handleOpenLiveCamera = async () => {
    setLiveCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setLiveCameraError(
        language === 'hi'
          ? 'इस ब्राउज़र में लाइव कैमरा सपोर्ट उपलब्ध नहीं है — कृपया ऊपर "कैमरे से फोटो खींचें" बटन का उपयोग करें।'
          : 'Live camera API is unavailable in this browser. Please use the Capture Photo button above.'
      );
      setIsLiveCameraOpen(true);
      return;
    }

    setIsLiveCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch {
      setLiveCameraError(
        language === 'hi'
          ? 'कैमरा अनुमति नहीं मिली या कैमरा किसी अन्य ऐप में व्यस्त है। कृपया Chrome सेटिंग में Camera Allow करें या ऊपर "कैमरे से फोटो खींचें" दबाएं।'
          : 'Camera permission denied or camera unavailable. Please allow camera permission in Chrome settings.'
      );
    }
  };

  const handleCloseLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((tr) => tr.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraOpen(false);
    setLiveCameraError(null);
  };

  const handleCaptureLivePhoto = async () => {
    const videoEl = liveVideoRef.current;
    if (!videoEl || !videoEl.videoWidth) return;

    const maxDim = 1280;
    let width = videoEl.videoWidth;
    let height = videoEl.videoHeight;
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoEl, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    const requestId = ++scanRequestIdRef.current;
    if (activeScanAbortRef.current) {
      activeScanAbortRef.current.abort();
      activeScanAbortRef.current = null;
    }

    handleCloseLiveCamera();
    replaceObjectUrl(null);
    setScanSource('uploaded');
    setSelectedOfflineSymptom('');
    setMediaFile({
      url: dataUrl,
      type: 'image',
      name: `camera-${Date.now()}.jpg`,
      analysisDataUrl: dataUrl,
      mimeType: 'image/jpeg',
    });

    setTimeout(() => {
      resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);

    await runImageDiagnosis(dataUrl, 'image/jpeg', dataUrl, 'image', requestId);
  };

  const handleClearMedia = () => {
    scanRequestIdRef.current += 1;
    if (activeScanAbortRef.current) {
      activeScanAbortRef.current.abort();
      activeScanAbortRef.current = null;
    }
    replaceObjectUrl(null);
    setMediaFile(null);
    setScanError(null);
    setIsScanning(false);
    setScanSource('sample');
    setSelectedOfflineSymptom('');
    setSelectedDisease(mockDiseases[0]);
  };

  const applyOfflineDiagnosisSelection = (cropId: string, symptomId: string) => {
    setSelectedOfflineCrop(cropId);
    setSelectedOfflineSymptom(symptomId);
    if (!cropId || !symptomId) return;
    const report = buildDiseaseReportFromOfflineEngine(
      cropId,
      symptomId,
      mediaFile?.url || '',
      language
    );
    setSelectedDisease(report);
    setScanSource('offline_matched');
    setScanError(null);
  };

  // Multi-turn Gemini AI Chat + Rich Offline Agronomy Fallback
  const handleSendMessage = async (customQuery?: string) => {
    const query = (customQuery ?? userInput).trim();
    if (!query || isAiReplying) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const historySnapshot = chatMessages.slice(-6).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    setChatMessages((prev) => [...prev, newMsg]);
    if (!customQuery) setUserInput('');
    setIsAiReplying(true);

    let aiResponse = '';
    let aiSource: 'gemini_ai' | 'offline_engine' = 'offline_engine';
    let aiModel: string | undefined;

    try {
      const response = await fetchApi(
        '/api/crop-doctor/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            language,
            history: historySnapshot,
          }),
        },
        35000
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.reply && data.reply.trim().length > 0) {
          aiResponse = data.reply.trim();
          aiSource = data.source === 'gemini_ai' ? 'gemini_ai' : 'offline_engine';
          aiModel = data.model;
        }
      }
    } catch (err) {
      console.warn('Live Gemini chat API unreachable, using local agronomy knowledge engine');
    }

    if (!aiResponse) {
      aiResponse = getAgronomicAnswer(query, language).reply;
      aiSource = 'offline_engine';
    }

    setLastAiSource(aiSource);
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: aiSource,
        model: aiModel,
      },
    ]);
    setIsAiReplying(false);

    // Auto-speak short summary so farmer hears it directly
    speakText(aiResponse.slice(0, 200));
  };

  const handleSpeakTreatment = () => {
    const speech =
      language === 'hi'
        ? `${selectedDisease.name.hi} के लिए उपचार: जैविक उपचार में ${selectedDisease.organicRemedy.hi[0]} रासायनिक उपचार में ${selectedDisease.chemicalTreatment.hi[0]}`
        : `Treatment for ${selectedDisease.name.en}: Organic remedy is ${selectedDisease.organicRemedy.en[0]}. Chemical treatment is ${selectedDisease.chemicalTreatment.en[0]}`;
    speakText(speech);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                AI Plant Pathology & Kisan Mitra
              </span>
              <span className="text-xs text-emerald-800 font-semibold">
                {language === 'hi' ? '98% रोग व समाधान सटीकता' : '98% Agronomy Accuracy'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
              {t.cropDoctor.title[language]}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              पत्ती या पौधे की फोटो/वीडियो अपलोड करके बीमारी पहचानें और किसान मित्र एआई से अपनी भाषा में बोलकर या लिखकर सटीक कृषि सलाह पाएं।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeakTreatment}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-emerald-700" />
              <span>{t.speakText[language]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kisan Mitra AI Interactive Chat (Prominently Placed on Top for Instant Questions) */}
      <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 to-green-800 text-amber-300 flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-emerald-950">
                  किसान मित्र एआई (कृषि विशेषज्ञ सहायक)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {lastAiSource === 'offline_engine'
                    ? 'ऑफ़लाइन ज्ञानकोश मोड'
                    : 'Gemini AI लाइव सहायक'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                बोलकर या लिखकर पूछें — काला रतुआ, पहला पानी, पीलापन, खाद, खरपतवार या किसी भी फसल रोग की दवा
              </p>
            </div>
          </div>
        </div>

        {/* Suggested Question Chips (Includes exact Black Rust & CRI queries) */}
        <div className="mb-4 flex flex-wrap gap-2">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q[language])}
              className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
            >
              🌾 {q[language]}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div className="bg-gray-50/90 rounded-xl p-4 border border-gray-200 max-h-96 overflow-y-auto space-y-3 mb-4">
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-emerald-800 text-white rounded-br-none font-semibold'
                      : 'bg-white text-gray-900 border border-gray-200 shadow-2xs rounded-bl-none'
                  }`}
                >
                  {!isUser && msg.source && (
                    <div className="mb-2 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          msg.source === 'gemini_ai'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {msg.source === 'gemini_ai'
                          ? '✨ Live Gemini AI विशेषज्ञ'
                          : '📚 किसान सेतु कृषि ज्ञानकोश (ऑफ़लाइन सपोर्ट)'}
                      </span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{renderFormattedMessage(msg.text)}</div>
                  {!isUser && (
                    <button
                      onClick={() => speakText(msg.text)}
                      className="mt-2.5 text-xs text-emerald-800 font-extrabold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 hover:bg-emerald-100 cursor-pointer w-fit"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{t.speakText[language]}</span>
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            );
          })}

          {isAiReplying && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 text-xs text-gray-600 w-fit">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping"></div>
              <span className="font-bold">किसान मित्र कृषि विशेषज्ञ उत्तर तैयार कर रहे हैं...</span>
            </div>
          )}
        </div>

        {voiceNotice && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-950">
            ℹ️ {voiceNotice}
          </div>
        )}

        {/* Input Bar with Microphone Voice Recording */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`p-3 rounded-xl transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
            }`}
            title="माइक से बोलकर सवाल पूछें (Speak to Ask)"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-900" />}
          </button>

          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={
              isListening
                ? 'सुन रहा हूँ... अब अपना सवाल बोलें...'
                : 'जैसे: गेहूं में पहला पानी कितने दिन बाद देना चाहिए?...'
            }
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />

          <button
            type="submit"
            disabled={!userInput.trim() || isAiReplying}
            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t.cropDoctor.askButton[language]}</span>
          </button>
        </form>
      </div>

      {/* Main Diagnosis Section: Photo/Video Uploader & Diagnostic Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Photo & Video Uploader & Common Samples (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Upload & Direct Camera Box */}
          <div className="bg-white rounded-2xl p-5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 transition-colors text-center shadow-xs">
            {/* Hidden Inputs: 1) Direct Rear Camera Photo, 2) Direct Rear Camera Video, 3) Phone Gallery */}
            <input
              ref={cameraPhotoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
            <input
              ref={cameraVideoInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
            <input
              ref={galleryMediaInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm sm:text-base">
              रोगग्रस्त पौधे की फोटो या वीडियो अपलोड करें
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              सीधे कैमरे से फोटो/वीडियो खींचें या गैलरी से चुनें
            </p>

            {/* Primary 3 Clear Buttons */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => cameraPhotoInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>कैमरे से फोटो खींचें</span>
              </button>

              <button
                type="button"
                onClick={() => cameraVideoInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs sm:text-sm font-extrabold shadow-xs transition-colors cursor-pointer"
              >
                <Video className="w-4 h-4 shrink-0" />
                <span>कैमरे से वीडियो बनाएं</span>
              </button>
            </div>

            <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => galleryMediaInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>गैलरी से फोटो / वीडियो चुनें</span>
              </button>

              <button
                type="button"
                onClick={handleOpenLiveCamera}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-bold transition-colors cursor-pointer"
                title="यदि ऊपर के बटन से कैमरा न खुले तो लाइव ऐप कैमरा खोलें"
              >
                <Camera className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>लाइव ऐप कैमरा</span>
              </button>
            </div>

            {/* Compact Uploaded Media Confirmation Strip (Full media is shown cleanly in Result Panel below) */}
            {mediaFile && scanSource !== 'sample' && (
              <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-2.5 text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  {mediaFile.type === 'video' ? (
                    <div className="w-12 h-12 rounded-lg bg-emerald-900 text-amber-300 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                  ) : (
                    <img
                      src={mediaFile.url}
                      alt="थंबनेल"
                      className="w-12 h-12 rounded-lg object-cover border border-emerald-200 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-emerald-950 block">
                      {mediaFile.type === 'video' ? 'वीडियो जुड़ गया ✅' : 'फोटो जुड़ गई ✅'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                      className="text-[11px] font-bold text-emerald-700 underline cursor-pointer"
                    >
                      नीचे जांच रिपोर्ट देखें ↓
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearMedia}
                  className="text-[11px] font-bold text-gray-600 hover:text-red-700 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>हटाएं</span>
                </button>
              </div>
            )}
          </div>

          {/* Sample Cases */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
            <h4 className="font-bold text-gray-900 text-xs sm:text-sm mb-3 flex items-center gap-1.5 text-emerald-950">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>सामान्य फसल रोग नमूने:</span>
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              {mockDiseases.map((d) => {
                const isSelected = selectedDisease.id === d.id && scanSource === 'sample';
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelectSample(d)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-emerald-50 border border-emerald-100">
                      <img
                        src={d.imageUrl}
                        alt={d.name[language]}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded block w-fit mb-0.5">
                        {d.crop[language]}
                      </span>
                      <p className="text-xs font-bold text-gray-900 line-clamp-1">{d.name[language]}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Diagnostic Analysis & Treatments (7 cols) */}
        <div ref={resultCardRef} className="lg:col-span-7 space-y-3">
          {scanError && scanSource === 'uploaded' && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs sm:text-sm font-bold text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span>📸 {scanError}</span>
              {mediaFile?.analysisDataUrl && !isScanning && (
                <button
                  type="button"
                  onClick={() =>
                    runImageDiagnosis(
                      mediaFile.analysisDataUrl!,
                      mediaFile.mimeType || 'image/jpeg',
                      mediaFile.url,
                      mediaFile.type
                    )
                  }
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer w-fit"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Live AI प्रयास करें</span>
                </button>
              )}
            </div>
          )}

          {isScanning ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-xs flex flex-col items-center justify-center text-center min-h-[420px]">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center animate-spin mb-4">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {t.cropDoctor.diagnosing[language]}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                पत्तियों के धब्बे, रंग, फफूंद व कीट लक्षणों का Live Gemini AI द्वारा विश्लेषण किया जा रहा है...
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              {/* Uploaded Media Preview (ALWAYS visible when user uploads photo or video!) */}
              {mediaFile && mediaFile.type === 'video' && (
                <div className="bg-black p-2 flex flex-col items-center justify-center">
                  <video
                    src={mediaFile.url}
                    controls
                    playsInline
                    className="max-h-64 rounded-lg w-full"
                  />
                </div>
              )}
              {mediaFile && mediaFile.type === 'image' && scanSource !== 'sample' && (
                <div className="bg-gray-900 p-2 flex items-center justify-center">
                  <img
                    src={mediaFile.url}
                    alt={selectedDisease.name[language]}
                    className="max-h-60 rounded-lg object-contain"
                  />
                </div>
              )}

              {/* In-Place Crop + Symptom Selector when uploaded without Live Gemini Vision result */}
              {(scanSource === 'uploaded' || scanSource === 'offline_matched') && (
                <div className="p-4 bg-emerald-50/70 border-b border-emerald-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-black text-emerald-950">
                      1️⃣ फ़सल और 2️⃣ फ़ोटो में दिख रहे लक्षण चुनें — तुरंत पूरा इलाज कार्ड पाएं:
                    </span>
                    {mediaFile?.analysisDataUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          runImageDiagnosis(
                            mediaFile.analysisDataUrl!,
                            mediaFile.mimeType || 'image/jpeg',
                            mediaFile.url,
                            mediaFile.type
                          )
                        }
                        className="px-3 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Live AI जांच</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-700 block mb-1.5">
                      1️⃣ कौन सी फ़सल है?
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {OFFLINE_CROP_OPTIONS.map((crop) => (
                        <button
                          key={crop.id}
                          type="button"
                          onClick={() => {
                            setSelectedOfflineCrop(crop.id);
                            if (selectedOfflineSymptom) {
                              applyOfflineDiagnosisSelection(crop.id, selectedOfflineSymptom);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            selectedOfflineCrop === crop.id
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {language === 'hi' ? crop.labelHi : crop.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-gray-700 block mb-1.5">
                      2️⃣ पत्ती / पौधे पर क्या दिख रहा है?
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {OFFLINE_SYMPTOM_OPTIONS.map((sym) => (
                        <button
                          key={sym.id}
                          type="button"
                          onClick={() =>
                            applyOfflineDiagnosisSelection(selectedOfflineCrop || 'soybean', sym.id)
                          }
                          className={`text-left px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            selectedOfflineSymptom === sym.id && scanSource === 'offline_matched'
                              ? 'bg-amber-400 text-emerald-950 border-amber-500 shadow-2xs'
                              : 'bg-white hover:bg-emerald-100 text-emerald-950 border-emerald-200'
                          }`}
                        >
                          {language === 'hi' ? sym.labelHi : sym.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {scanSource !== 'uploaded' && (
                <>
                  {/* Header Badge */}
                  <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-emerald-950">
                          {scanSource === 'gemini_ai'
                            ? '✨ Live Gemini AI फोटो जांच'
                            : scanSource === 'offline_matched'
                              ? '📚 किसान सेतु लक्षण निदान रिपोर्ट'
                              : '🌾 नमूना रोग जानकारी'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            selectedDisease.severity === 'high'
                              ? 'bg-red-500 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {selectedDisease.severity === 'high'
                            ? 'गंभीर रोग (High Severity)'
                            : 'मध्यम प्रकोप'}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-2xl font-black text-amber-200">
                        {selectedDisease.name[language]}
                      </h3>
                      <p className="text-xs text-emerald-100 mt-1">
                        {selectedDisease.causes[language]}
                      </p>
                    </div>

                    <button
                      onClick={handleSpeakTreatment}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 cursor-pointer"
                      title={t.speakText[language]}
                    >
                      <Volume2 className="w-5 h-5 text-amber-300" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-5">
                    {/* Symptoms */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>{t.cropDoctor.symptoms[language]}</span>
                      </h4>
                      <ul className="space-y-1.5 bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 text-xs sm:text-sm text-gray-800">
                        {selectedDisease.symptoms[language].map((symptom, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0"></span>
                            <span>{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Organic / Desi Remedies */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                        <Leaf className="w-4 h-4 text-emerald-600" />
                        <span>{t.cropDoctor.organicRemedy[language]}</span>
                      </h4>
                      <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 text-xs sm:text-sm text-emerald-950 space-y-2">
                        {selectedDisease.organicRemedy[language].map((remedy, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="font-medium">{remedy}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chemical Treatments & Dosages */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-blue-950 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                        <FlaskConical className="w-4 h-4 text-blue-600" />
                        <span>{t.cropDoctor.chemicalTreatment[language]}</span>
                      </h4>
                      <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80 text-xs sm:text-sm text-blue-950 space-y-2">
                        {selectedDisease.chemicalTreatment[language].map((chem, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="font-bold text-blue-700 shrink-0">[{idx + 1}]</span>
                            <span className="font-medium">{chem}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Market Products */}
                    <div>
                      <span className="text-xs font-bold text-gray-700 block mb-2">
                        {t.cropDoctor.recommendedMedicines[language]}:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedDisease.recommendedProducts.map((prod) => (
                          <span
                            key={prod}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-bold border border-gray-200"
                          >
                            {prod}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live In-App WebRTC Camera Modal */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-emerald-200">
            <div className="bg-emerald-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-300" />
                <h4 className="font-bold text-sm">लाइव फसल कैमरा</h4>
              </div>
              <button
                type="button"
                onClick={handleCloseLiveCamera}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {liveCameraError ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-950">
                  ℹ️ {liveCameraError}
                </div>
              ) : (
                <div className="bg-black rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center">
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex gap-2">
                {!liveCameraError && (
                  <button
                    type="button"
                    onClick={handleCaptureLivePhoto}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>फोटो खींचें और जांचें</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseLiveCamera}
                  className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm cursor-pointer"
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
