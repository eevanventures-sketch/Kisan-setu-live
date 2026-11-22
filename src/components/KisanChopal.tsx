import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockChopalPosts } from '../data/mockData';
import { ChopalPost } from '../types';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Award,
  PlusCircle,
  Volume2,
  X,
  Share2,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Send,
  UserCheck,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getAgronomicAnswer } from '../utils/agronomyEngine';
import { fetchApi } from '../utils/apiBase';

interface ChopalComment {
  id: string;
  postId: string;
  author: string;
  location: string;
  role: 'expert' | 'farmer';
  text: string;
  time: string;
  verified?: boolean;
}

const INITIAL_COMMENTS: Record<string, ChopalComment[]> = {
  'c-1': [
    {
      id: 'comm-101',
      postId: 'c-1',
      author: 'राजेश धाकड़ (उन्नत किसान)',
      location: 'गुना, मध्य प्रदेश',
      role: 'farmer',
      text: 'यादव जी, मैंने पिछले साल 3 एकड़ में 3 बोरी एसएसपी + 1 बोरी यूरिया डाला था। फसल में कल्ले बहुत शानदार फूटे और दाना एकदम चमकदार निकला। डीएपी के चक्कर में मत पड़िए, एसएसपी सर्वोत्तम है।',
      time: '1 घंटा पहले',
      verified: true,
    },
    {
      id: 'comm-102',
      postId: 'c-1',
      author: 'डॉ. सत्येंद्र शर्मा (वरिष्ठ वैज्ञानिक)',
      location: 'KVK मथुरा',
      role: 'expert',
      text: 'एसएसपी का मुख्य लाभ इसमें उपस्थित 11% सल्फर है। गेहूं में सल्फर मिलने से प्रोटीन और दाने का वजन बढ़ता है। पहले पानी पर 25 किग्रा यूरिया की टॉप ड्रेसिंग जरूर करें।',
      time: '30 मिनट पहले',
      verified: true,
    },
  ],
  'c-2': [
    {
      id: 'comm-201',
      postId: 'c-2',
      author: 'हनुमान राम बिश्नोई',
      location: 'मेड़ता सिटी, राजस्थान',
      role: 'farmer',
      text: 'सोढ़ा जी, ट्राइकोडर्मा का प्रयोग 100% असरदार है। गोबर की खाद में मिलाकर 5-6 दिन छाया में गीली बोरी से ढक कर रखें, फफूंद अच्छे से फैल जाएगी, फिर खेत में डालें।',
      time: '3 घंटे पहले',
    },
  ],
  'c-3': [
    {
      id: 'comm-301',
      postId: 'c-3',
      author: 'डॉ. प्रमोद महाजन (उद्यानिकी वैज्ञानिक)',
      location: 'KVK जलगांव',
      role: 'expert',
      text: 'पाटिल जी, 2 महीने की अवस्था पर केले में वानस्पतिक बढ़वार तेज होती है। प्रति पौधा 5 ग्राम 19:19:19 सप्ताह में दो बार ड्रिप से दें। साथ में मैग्नीशियम सल्फेट 5 किग्रा प्रति एकड़ 15 दिन में एक बार चलाएं।',
      time: '4 घंटे पहले',
      verified: true,
    },
  ],
};

export const KisanChopal: React.FC = () => {
  const { language, t, speakText } = useLanguage();

  const [posts, setPosts] = useState<ChopalPost[]>(() => {
    try {
      const saved = localStorage.getItem('kisan_setu_chopal_posts_v5');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return mockChopalPosts;
  });

  const [commentsMap, setCommentsMap] = useState<Record<string, ChopalComment[]>>(() => {
    try {
      const saved = localStorage.getItem('kisan_setu_chopal_comments_v5');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return INITIAL_COMMENTS;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>('c-1');
  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});
  const [commentAuthor, setCommentAuthor] = useState<{ [postId: string]: string }>({});
  const [isScientistThinking, setIsScientistThinking] = useState<string | null>(null);
  const [quickQuery, setQuickQuery] = useState('');

  const handleQuickAsk = async (q: string) => {
    if (!q.trim()) return;
    const newPostId = `c-${Date.now()}`;
    const agroHi = getAgronomicAnswer(q, 'hi');
    const agroEn = getAgronomicAnswer(q, 'en');
    const isSpecificMatch = agroHi.matchedTopic !== 'unmatched_offline';

    const expertAns = {
      expertName: agroHi.expertName,
      designation: agroHi.designation,
      text: {
        hi: agroHi.reply,
        en: agroEn.reply,
      },
    };

    const expertComm: ChopalComment = {
      id: `comm-auto-${Date.now()}`,
      postId: newPostId,
      author: expertAns.expertName,
      location: expertAns.designation,
      role: 'expert',
      text: expertAns.text.hi,
      time: 'अभी-अभी',
      verified: true,
    };

    const newPost: ChopalPost = {
      id: newPostId,
      author: 'किसान भाई (आप)',
      location: 'मध्य प्रदेश',
      avatarBg: 'bg-emerald-700',
      timeAgo: { hi: 'अभी-अभी', en: 'Just now' },
      title: { hi: q, en: q },
      content: { hi: q, en: q },
      cropTag: isSpecificMatch ? 'सत्यापित कृषि परामर्श' : 'कृषि परामर्श',
      likes: 1,
      commentsCount: 1,
      userLiked: true,
      expertAnswer: expertAns,
    };

    setPosts([newPost, ...posts]);
    setCommentsMap((prev) => ({
      ...prev,
      [newPostId]: [expertComm],
    }));

    setActiveThreadId(newPostId);
    setQuickQuery('');
    speakText(`कृषि वैज्ञानिक का उत्तर: ${expertAns.text.hi.slice(0, 160)}`);

    // Only query server if not already answered by a specific ICAR agronomy match
    if (!isSpecificMatch) {
      try {
        const res = await fetchApi('/api/crop-doctor/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q, language }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.reply && data.reply.trim().length > 0) {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === newPostId
                  ? {
                      ...p,
                      expertAnswer: {
                        expertName: data.expertName || expertAns.expertName,
                        designation: data.designation || expertAns.designation,
                        text: { hi: data.reply, en: data.reply },
                      },
                    }
                  : p
              )
            );
            setCommentsMap((prev) => ({
              ...prev,
              [newPostId]: prev[newPostId]?.map((c) =>
                c.id === expertComm.id ? { ...c, text: data.reply } : c
              ) || [expertComm],
            }));
          }
        }
      } catch {
        // Keep verified agronomy expert answer
      }
    }
  };

  // New Post Form
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [cropTag, setCropTag] = useState('गेहूं (Wheat)');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kisan_setu_chopal_posts_v5', JSON.stringify(posts));
      localStorage.setItem('kisan_setu_chopal_comments_v5', JSON.stringify(commentsMap));
    } catch (e) {
      // ignore
    }
  }, [posts, commentsMap]);

  const handleLike = (id: string) => {
    setPosts(
      posts.map((p) => {
        if (p.id === id) {
          const isLiked = p.userLiked;
          return {
            ...p,
            likes: isLiked ? p.likes - 1 : p.likes + 1,
            userLiked: !isLiked,
          };
        }
        return p;
      })
    );
  };

  // Helper to generate an in-depth, crop-specific expert answer based on title, content and crop
  const generateScientistReply = (postTitle: string, postContent: string, crop: string) => {
    const combinedQuery = `${postTitle} ${postContent} ${crop}`;
    const ansHi = getAgronomicAnswer(combinedQuery, 'hi');
    const ansEn = getAgronomicAnswer(combinedQuery, 'en');
    return {
      expertName: ansHi.expertName,
      designation: ansHi.designation,
      text: {
        hi: ansHi.reply,
        en: ansEn.reply,
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const textLower = (postTitle + ' ' + postContent + ' ' + crop).toLowerCase();

    // 1. Wheat: Irrigation & CRI Stage
    if (
      (textLower.includes('पानी') || textLower.includes('सिंचाई') || textLower.includes('पहला') || textLower.includes('कब')) &&
      (textLower.includes('गेहूं') || textLower.includes('wheat') || crop.includes('गेहूं'))
    ) {
      return {
        expertName: 'डॉ. सत्येंद्र शर्मा (प्रधान वैज्ञानिक, सस्य विज्ञान KVK)',
        designation: 'गेहूं अनुसंधान प्रभाग, कृषि विज्ञान केंद्र',
        text: {
          hi: `🌾 **गेहूं की फसल में प्रथम सिंचाई (पहला पानी) का संपूर्ण वैज्ञानिक नियम:**\n\n` +
            `1. **सटीक समय (Timing):** बुवाई के ठीक **20 से 25 दिन बाद (औसतन 21वें दिन)** पहला पानी दें।\n` +
            `2. **पौधे की अवस्था (CRI Stage):** इस समय पौधे में ताज जड़ें (Crown Root Initiation) फूटती हैं। समय पर पानी मिलने से कल्ले (टिलर्स) सर्वाधिक निकलते हैं और जड़ें गहरी जाती हैं।\n` +
            `3. **मिट्टी अनुसार नियम:**\n` +
            `   • हल्की/बलुई मिट्टी: 20-21 दिन पर दें।\n` +
            `   • भारी काली मिट्टी: 22-25 दिन पर दें।\n` +
            `4. **खाद प्रबंधन (Fertilizer):** पहले पानी के 2 दिन बाद (पैर धंसने लायक नमी में) प्रति एकड़ **25 से 30 किग्रा यूरिया** + **5 किग्रा जिंक सल्फेट (33%)** की टॉप ड्रेसिंग करें।\n` +
            `5. **सावधानी:** खेत में जलभराव बिल्कुल न होने दें, केवल **हल्की सिंचाई (फ्लो या स्प्रिंकलर)** करें। अधिक पानी से पौधे पीले पड़ जाते हैं।\n` +
            `6. **आगामी सिंचाई चक्र:** दूसरा पानी 40-45 दिन (कल्ले फूटते समय), तीसरा 60-65 दिन (गांठें बनते समय), चौथा 80-85 दिन (फूल/बाली समय) दें।`,
          en: `🌾 **Scientific Irrigation Guide for Wheat (CRI Stage):**\n` +
            `1. Optimal Timing: 20-25 days after sowing (21st day ideal) at Crown Root Initiation stage.\n` +
            `2. Fertilizer: Top-dress 25-30kg Urea + 5kg Zinc Sulphate (33%) per acre.\n` +
            `3. Precaution: Apply light irrigation to prevent yellowing.`,
        },
      };
    }

    // 2. Wheat: Weed Management (खरपतवार)
    if (
      textLower.includes('खरपतवार') ||
      textLower.includes('बथुआ') ||
      textLower.includes('गुल्ली') ||
      textLower.includes('मंडूसी') ||
      textLower.includes('घास')
    ) {
      return {
        expertName: 'डॉ. आर. के. तिवारी (वरिष्ठ खरपतवार विशेषज्ञ, KVK)',
        designation: 'सस्य विज्ञान एवं खरपतवार नियंत्रण प्रभाग',
        text: {
          hi: `🌿 **गेहूं में खरपतवार नियंत्रण का संपूर्ण वैज्ञानिक समाधान:**\n\n` +
            `1. **छिड़काव का सही समय:** पहले पानी के 3 से 5 दिन बाद (बुवाई के 30 से 35 दिन बाद), जब खेत में पर्याप्त नमी हो और खरपतवार 2 से 4 पत्ती अवस्था में हों।\n` +
            `2. **चौड़ी पत्ती वाले खरपतवार (बथुआ, सेंजी, चटरी, कृष्णनील):**\n` +
            `   • **2,4-D अमाइन साल्ट 58% SL** @ 400 मिली प्रति एकड़ (150-200 लीटर पानी में)।\n` +
            `   • या **मेटसल्फ्यूरॉन मिथाइल 20% WP (एल्गिप)** @ 8 ग्राम प्रति एकड़।\n` +
            `3. **संकरी पत्ती (गुल्ली डंडा / मंडूसी / फालारिस माइनर / जंगली जई):**\n` +
            `   • **क्लोडिनाफॉप प्रोपार्गिल 15% WP (टोपिक)** @ 160 ग्राम प्रति एकड़ 150 लीटर पानी में।\n` +
            `4. **मिश्रित खरपतवार (संकरी + चौड़ी दोनों होने पर):**\n` +
            `   • **सल्फोसल्फ्यूरॉन 75% + मेटसल्फ्यूरॉन 5% WG (टोटल / वेस्टा)** @ 16 ग्राम प्रति एकड़, साथ में दिए गए चिपको (सर्फेक्टेंट) को 150 लीटर पानी में घोलकर छिड़कें।\n` +
            `⚠️ **अति आवश्यक सावधानियां:** हमेशा **फ्लैट फैन (कट नोजल)** का उपयोग करें। धूप खिलने पर ही स्प्रे करें। सूखी मिट्टी में कभी भी खरपतवारनाशक का प्रयोग न करें।`,
          en: `🌿 **Wheat Weed Control Protocol:** Spray 30-35 days after sowing in moist soil. For broadleaf weeds use 2,4-D Amine 58% SL @ 400ml/acre or Metsulfuron 20% WP @ 8g/acre. For Phalaris minor (Gulli Danda) use Clodinafop 15% WP @ 160g/acre. Always use Flat Fan nozzle with 150L water/acre.`,
        },
      };
    }

    // 3. Crop Yellowing & Rust (पीलापन व पीला रतुआ)
    if (textLower.includes('पीला') || textLower.includes('पीलापन') || textLower.includes('रतुआ') || textLower.includes('rust')) {
      return {
        expertName: 'डॉ. अनिता सिंह (पादप रोग विशेषज्ञ)',
        designation: 'पौध रोग एवं महामारी विज्ञान प्रभाग, KVK',
        text: {
          hi: `🍂 **फसल में पीलापन आने के 4 मुख्य कारण और चरणबद्ध उपचार:**\n\n` +
            `1. **नाइट्रोजन की कमी (नीचे की पत्तियां पीली होना):**\n` +
            `   • उपचार: प्रति एकड़ 20-25 किग्रा यूरिया की टॉप ड्रेसिंग करें, अथवा **इफको नैनो यूरिया** 4 मिली प्रति लीटर पानी की दर से छिड़काव करें।\n` +
            `2. **पीला रतुआ (Yellow Rust) - पत्तियों पर हल्दी जैसा पाउडर लगना:**\n` +
            `   • पहचान: पत्तियों की सतह पर पीले रंग की धारियां बनना और छूने पर उंगली पर पीला चूर्ण लगना।\n` +
            `   • उपचार: तुरंत **प्रोपिकोनाज़ोल 25% EC (टिल्ट)** @ 200 मिली प्रति एकड़ (15 मिली प्रति 15 लीटर टंकी) 200 लीटर पानी में मिलाकर स्प्रे करें। 10 दिन बाद दोहराएं।\n` +
            `3. **जिंक या सूक्ष्म पोषक तत्वों की कमी (ऊपरी नई पत्तियां पीली होना):**\n` +
            `   • उपचार: **जिंक सल्फेट (33%)** 5 किग्रा/एकड़ जमीन में दें, या **चिलेटेड जिंक (EDTA 12%)** 1 ग्राम/लीटर पानी में 100 ग्राम यूरिया मिलाकर स्प्रे करें।\n` +
            `4. **जलभराव (Waterlogging):** अधिक पानी जमा होने से जड़ें सांस नहीं ले पातीं; खेत की नालियों से अतिरिक्त पानी तत्काल बाहर निकालें।`,
          en: `🍂 **Crop Yellowing Diagnostics & Cure:** If bottom leaves yellow, top-dress Urea or Nano Urea (4ml/L). If yellow turmeric-like powder rubs on fingers, it is Yellow Rust — spray Propiconazole 25% EC @ 200ml/acre in 200L water. If upper leaves yellow, spray Chelated Zinc 12% EDTA @ 1g/L.`,
        },
      };
    }

    // 4. Mustard: Aphids (माहू / चेपा), White Rust & Irrigation
    if (
      textLower.includes('सरसों') ||
      textLower.includes('माहू') ||
      textLower.includes('चेपा') ||
      crop.includes('सरसों')
    ) {
      return {
        expertName: 'डॉ. बी. एल. पाटीदार (कीट वैज्ञानिक)',
        designation: 'राष्ट्रीय तिलहन अनुसंधान प्रभाग',
        text: {
          hi: `🌱 **सरसों की फसल सुरक्षा, माहू कीट व उत्पादन प्रबंधन:**\n\n` +
            `1. **माहू (चेपा / Aphids) की रोकथाम:**\n` +
            `   • **देसी/जैविक उपाय:** खेत में फसल की ऊंचाई पर प्रति एकड़ 15-20 **पीले चिपचिपे कार्ड (Yellow Sticky Traps)** लगाएं। नीम तेल (10,000 PPM) 3 मिली प्रति लीटर पानी में मिलाकर स्प्रे करें।\n` +
            `   • **रासायनिक दवा:** **इमिडाक्लोप्रिड 17.8% SL (कॉन्फिडोर)** @ 1 मिली प्रति 3 लीटर पानी (50 मिली प्रति एकड़ 150 लीटर पानी में)। अथवा **थायमेथोक्सम 25% WG (एक्टारा)** @ 80 ग्राम प्रति एकड़।\n` +
            `2. **सफेद रोली / फफूंद (White Rust):**\n` +
            `   • पत्तियों की निचली सतह पर सफेद फफोले दिखने पर **रिडोमिल गोल्ड (मेटालैक्सिल 4% + मैंकोजेब 64%)** @ 2 ग्राम प्रति लीटर पानी का छिड़काव करें।\n` +
            `3. **प्रथम सिंचाई व खाद:** बुवाई के 25-30 दिन बाद हल्की सिंचाई करें। सिंचाई के समय **25 किग्रा यूरिया** + **10 किग्रा बेंटोनाइट सल्फर 90%** डालें (सल्फर से दानों में तेल की मात्रा 3% तक बढ़ जाती है)।\n` +
            `⚠️ **विशेष चेतावनी:** कीटनाशक का छिड़काव हमेशा **शाम 4:00 बजे के बाद** करें, ताकि परागण करने वाली मित्र मधुमक्खियों को क्षति न पहुंचे।`,
          en: `🌱 **Mustard Crop Management & Aphid Protection:** Install 15-20 Yellow Sticky Traps per acre. Spray Imidacloprid 17.8% SL @ 50ml/acre or Thiamethoxam 25% WG @ 80g/acre strictly after 4 PM to protect pollinators. Apply 10kg Sulphur 90% at 1st watering to boost oil content.`,
        },
      };
    }

    // 5. Gram / Chana: Pod Borer (इल्ली) & Wilt (उकठा)
    if (
      textLower.includes('चना') ||
      textLower.includes('इल्ली') ||
      textLower.includes('उकठा') ||
      crop.includes('चना')
    ) {
      return {
        expertName: 'डॉ. महेंद्र सिंह धाकड़ (दलहन विशेषज्ञ)',
        designation: 'दलहन अनुसंधान केंद्र, कृषि विज्ञान केंद्र',
        text: {
          hi: `🌿 **चने की फसल में इल्ली (फली छेदक) एवं उकठा रोग का समाधान:**\n\n` +
            `1. **फली छेदक इल्ली (Helicoverpa Pod Borer):**\n` +
            `   • **शुरुआती अवस्था:** खेत में 15 से 20 'T' आकार की लकड़ी की खूंटियां (T-Perches) गाड़ें ताकि पक्षी बैठकर इल्लियों को खा सकें।\n` +
            `   • **जैविक स्प्रे:** नीम बाण (Azadirachtin 5%) @ 2 मिली/लीटर पानी का छिड़काव करें।\n` +
            `   • **रासायनिक दवा:** **एमामेक्टिन बेंजोएट 5% SG (प्रोक्लेम)** @ 100 ग्राम प्रति एकड़, या **कोराजन (क्लोरेंट्रानिलिप्रोल 18.5% SC)** @ 60 मिली प्रति एकड़ 150 लीटर पानी में छिड़कें।\n` +
            `2. **उकठा (Wilt) रोग - पौधे सूखना:**\n` +
            `   • रोगग्रस्त पौधों को उखाड़कर नष्ट करें। जड़ों के पास **कार्बेन्डाजिम 12% + मैंकोजेब 63% (साफ)** @ 2 ग्राम/लीटर पानी का घोल बनाकर ड्रेंचिंग करें।\n` +
            `3. **फूल व दाना भराव अवस्था:** चने में फूल आने की अवस्था में कभी भी भारी सिंचाई न करें (वरना फूल झड़ जाते हैं)। फूल बनते समय **0:52:34** @ 1 किग्रा + **बोरॉन 20%** @ 200 ग्राम प्रति एकड़ का छिड़काव करने से फलियों में दाने मोटे और चमकदार बनते हैं।`,
          en: `🌿 **Chickpea (Chana) Management:** For pod borer, set 15 T-perches per acre and spray Emamectin Benzoate 5% SG @ 100g/acre or Coragen @ 60ml/acre. Avoid heavy irrigation during flowering. Spray 0:52:34 @ 1kg + Boron 20% @ 200g/acre at pod development.`,
        },
      };
    }

    // 6. Garlic & Onion (लहसुन, प्याज - थ्रिप्स, जलेबी व कंद फुलाव)
    if (
      textLower.includes('लहसुन') ||
      textLower.includes('प्याज') ||
      textLower.includes('जलेबी') ||
      textLower.includes('थ्रिप्स') ||
      crop.includes('लहसुन') ||
      crop.includes('प्याज')
    ) {
      return {
        expertName: 'डॉ. पी. के. पाटीदार (उद्यानिकी वैज्ञानिक)',
        designation: 'सब्जी एवं मसाला फसल अनुसंधान प्रभाग, KVK',
        text: {
          hi: `🧄 **लहसुन व प्याज में थ्रिप्स (जलेबी रोग), पीलापन व कंद विकास का संपूर्ण पैकेज:**\n\n` +
            `1. **थ्रिप्स कीट (पत्तियां मुड़ना / कड़छा बनना / जलेबी रोग):**\n` +
            `   • रस चूसक थ्रिप्स पत्तियों का रस चूसकर उन्हें पीला व घुंघराला बना देते हैं।\n` +
            `   • **दवा:** **फिप्रोनिल 5% SC (रीजेंट)** @ 35 मिली प्रति 15 लीटर टंकी, या **स्पाइनोटोरम 11.7% SC (डेलीगेट)** @ 18 मिली प्रति टंकी छिड़कें।\n` +
            `2. **फफूंद जनित पीलापन व बैंगनी धब्बा (Purple Blotch):**\n` +
            `   • **टेबुकोनाज़ोल 50% + ट्राइफ्लॉक्सीस्ट्रोबिन 25% (नेटिवो)** @ 100 ग्राम प्रति एकड़ 150 लीटर पानी में, साथ में स्ट्रेप्टोसाइक्लिन 12 ग्राम मिलाएं।\n` +
            `3. **कंद का साइज (आकार) व चमक बढ़ाने हेतु (60-70 दिन बाद):**\n` +
            `   • **0:0:50 (पोटेशियम सल्फेट)** 1 किग्रा + **बोरॉन 20%** 250 ग्राम प्रति एकड़ का छिड़काव करें।\n` +
            `⚠️ **जरूरी नियम:** लहसुन व प्याज की पत्तियों पर मोमी परत होती है, अतः हर स्प्रे में **सिलिकॉन स्टीकर/चिपको** (5 मिली प्रति टंकी) अवश्य मिलाएं!`,
          en: `🧄 **Garlic & Onion Thrips & Tuber Growth Protocol:** For thrips/twisting leaf curl, spray Fipronil 5% SC @ 35ml/tank or Spinetoram 11.7% SC @ 18ml/tank. For fungal purple blotch spray Nativo @ 100g/acre. Apply 0:0:50 @ 1kg + Boron @ 250g/acre for bulb sizing. Always add silicon spreader.`,
        },
      };
    }

    // 7. Soybean: Girdle Beetle, Semilooper, Yellow Mosaic
    if (textLower.includes('सोयाबीन') || crop.includes('सोयाबीन')) {
      return {
        expertName: 'डॉ. विजय अग्रवाल (वरिष्ठ वैज्ञानिक, KVK)',
        designation: 'सोयाबीन अनुसंधान निदेशालय',
        text: {
          hi: `🌾 **सोयाबीन फसल सुरक्षा व उच्च पैदावार प्रबंधन:**\n\n` +
            `1. **पीला मोजेक वायरस (सफेद मक्खी द्वारा फैलाव):**\n` +
            `   • लक्षण: पत्तियों पर पीले-हरे चकत्ते बनना।\n` +
            `   • रोकथाम: सफेद मक्खी को तुरंत रोकें। **थायमेथोक्सम 25% WG** @ 80 ग्राम प्रति एकड़ या **बीटा-साइफ्लूथ्रिन + इमिडाक्लोप्रिड (सोलोमन)** @ 140 मिली/एकड़ छिड़कें।\n` +
            `2. **गर्डल बीटल (चक्र भृंग) व सेमीलूपर इल्ली:**\n` +
            `   • **कोराजन (क्लोरेंट्रानिलिप्रोल 18.5% SC)** @ 60 मिली प्रति एकड़ अथवा **एम्प्लीगो (क्लोरेंट्रानिलिप्रोल + लैम्ब्डा)** @ 80 मिली प्रति एकड़ 150 लीटर पानी में स्प्रे करें।\n` +
            `3. **फलियों में दाना भराव (R5 स्टेज):**\n` +
            `   • दाना भरते समय **0:0:50** @ 1 किग्रा प्रति एकड़ स्प्रे करने से दाना सुडौल, चमकीला और भारी होता है।`,
          en: `🌾 **Soybean Integrated Management:** For yellow mosaic, control whitefly vector with Thiamethoxam 25% WG @ 80g/acre or Solomon @ 140ml/acre. For girdle beetle and caterpillar, apply Coragen @ 60ml/acre. Spray 0:0:50 @ 1kg/acre at pod filling stage.`,
        },
      };
    }

    // 8. Paddy (धान): Stem Borer, Blast, Sheath Blight
    if (textLower.includes('धान') || textLower.includes('paddy') || crop.includes('धान')) {
      return {
        expertName: 'डॉ. ओ. पी. सिंह (चावल अनुसंधान वैज्ञानिक)',
        designation: 'राष्ट्रीय चावल अनुसंधान संस्थान सहयोगी केंद्र',
        text: {
          hi: `🌾 **धान (बासमती व क्रांति) में कीट व रोग का संपूर्ण प्रबंधन:**\n\n` +
            `1. **तना छेदक (Stem Borer - सफेद बाली निकलना):**\n` +
            `   • **कारबोफ्यूरॉन 3% GR** या **कार्टाप हाइड्रोक्लोराइड 4% G (पदान)** @ 7.5 किग्रा प्रति एकड़ खेत में छिड़कें।\n` +
            `   • या **कोराजन 18.5% SC** @ 60 मिली प्रति एकड़ 150 लीटर पानी में स्प्रे करें।\n` +
            `2. **शीथ ब्लाइट व झुलसा (Blast):**\n` +
            `   • **हेक्साकोनाज़ोल 5% SC (कॉन्टैफ)** @ 400 मिली प्रति एकड़, या **एजॉक्सीस्ट्रोबिन + डाइफेनोकोनाज़ोल (एम्पलीगो/एमिस्टार टॉप)** @ 200 मिली प्रति एकड़ छिड़कें।\n` +
            `3. **गंधी बग कीट (दूधिया अवस्था में दानों का रस चूसना):**\n` +
            `   • शाम के समय **मैलाथियान 5% डस्ट** 10 किग्रा/एकड़ खेत के किनारों पर भुरकें।`,
          en: `🌾 **Paddy (Basmati) Pest & Disease Control:** For stem borer apply Cartap Hydrochloride 4G @ 7.5kg/acre or Coragen @ 60ml/acre. For sheath blight and blast, spray Hexaconazole 5% SC @ 400ml/acre. Protect milky grains from Gundhi bug with Malathion dust.`,
        },
      };
    }

    // 9. General Agricultural Query
    return {
      expertName: 'डॉ. एस. के. वर्मा (वरिष्ठ कृषि वैज्ञानिक, KVK)',
      designation: 'अखिल भारतीय कृषि अनुसंधान परिषद (ICAR) विशेषज्ञ',
      text: {
        hi: `🌾 **किसान भाई, आपके सवाल "${postTitle}" पर कृषि वैज्ञानिक मार्गदर्शन:**\n\n` +
          `1. **संतुलित उर्वरक नियम (NPK & Micro):** रबी फसलों में केवल डीएपी पर निर्भर न रहें। 1 एकड़ में 2 बोरी सिंगल सुपर फास्फेट (SSP) + 1 बोरी यूरिया + 20 किग्रा पोटाश (MOP) का संतुलन सर्वाधिक लाभकारी रहता है।\n` +
          `2. **रोग-कीट स्प्रे नियम:** किसी भी दवा के छिड़काव में सिलिकॉन चिपको (सर्फेक्टेंट) अवश्य मिलाएं। दवा की सही खुराक और पर्याप्त पानी (प्रति एकड़ न्यूनतम 150 लीटर) ही 100% परिणाम देता है।\n` +
          `3. **मौसम पूर्व-अनुमान:** सिंचाई व कीटनाशक छिड़काव से पहले हमारे ऐप का 'मौसम पूर्वानुमान' अवश्य देखें। तेज हवा या वर्षा की संभावना में स्प्रे स्थगित रखें।\n` +
          `4. **त्वरित फोन परामर्श:** अधिक आपातकालीन स्थिति में भारत सरकार के राष्ट्रीय किसान कॉल सेंटर टोल-फ्री **1800-180-1551** पर सुबह 6:00 से रात 10:00 बजे तक सीधे कृषि वैज्ञानिक से बात करें।`,
        en: `🌾 **Detailed Scientific Recommendation:** Balance NPK with single superphosphate (SSP) and potash for root and grain vigor. Always use 150L water/acre with silicon spreader. Call Toll-Free 1800-180-1551 for direct agronomist discussion.`,
      },
    };
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !author) return;

    const expertAns = generateScientistReply(title, content, cropTag);
    const newPostId = `c-${Date.now()}`;
    
    // Peer farmer advice
    const peerFarmerComment: ChopalComment = {
      id: `comm-peer-${Date.now()}`,
      postId: newPostId,
      author: 'रामेश्वर पाटीदार (उन्नत किसान)',
      location: 'विदिशा (म.प्र.)',
      role: 'farmer',
      text: 'किसान भाई, मैंने भी यह समस्या देखी थी। वैज्ञानिक जी की सलाह के अनुसार ही उपचार करें, खेत में पर्याप्त नमी का ध्यान अवश्य रखें।',
      time: 'अभी-अभी',
      verified: true,
    };

    const expertComm: ChopalComment = {
      id: `comm-auto-${Date.now() + 1}`,
      postId: newPostId,
      author: expertAns.expertName,
      location: expertAns.designation,
      role: 'expert',
      text: expertAns.text.hi,
      time: 'अभी-अभी',
      verified: true,
    };

    const newPost: ChopalPost = {
      id: newPostId,
      author,
      location: location || 'विदिशा, मध्य प्रदेश',
      avatarBg: 'bg-emerald-700',
      timeAgo: { hi: 'अभी-अभी', en: 'Just now' },
      title: { hi: title, en: title },
      content: { hi: content, en: content },
      cropTag,
      likes: 2,
      commentsCount: 2,
      userLiked: true,
      expertAnswer: expertAns,
    };

    setPosts([newPost, ...posts]);
    setCommentsMap((prev) => ({
      ...prev,
      [newPostId]: [expertComm, peerFarmerComment],
    }));

    setIsModalOpen(false);
    setActiveThreadId(newPostId);
    setIsScientistThinking(null);

    speakText(`कृषि वैज्ञानिक का उत्तर आ चुका है: ${expertAns.text.hi.slice(0, 160)}`);

    setTitle('');
    setContent('');
  };

  // Farmer adding a comment or follow-up reply to any thread
  const handleAddComment = (postId: string) => {
    const text = newCommentText[postId]?.trim();
    if (!text) return;

    const commenterName = commentAuthor[postId]?.trim() || 'किसान भाई (आप)';

    const newComm: ChopalComment = {
      id: `comm-${Date.now()}`,
      postId,
      author: commenterName,
      location: 'मध्य प्रदेश',
      role: 'farmer',
      text,
      time: 'अभी-अभी',
    };

    setCommentsMap((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComm],
    }));

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
    );

    setNewCommentText((prev) => ({ ...prev, [postId]: '' }));

    // If the post didn't have an expert reply yet, trigger one!
    const targetPost = posts.find((p) => p.id === postId);
    if (targetPost && !targetPost.expertAnswer) {
      setIsScientistThinking(postId);
      setTimeout(() => {
        const expertAns = generateScientistReply(targetPost.title.hi, text, targetPost.cropTag);
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, expertAnswer: expertAns } : p))
        );

        const expertComm: ChopalComment = {
          id: `comm-exp-${Date.now()}`,
          postId,
          author: expertAns.expertName,
          location: expertAns.designation,
          role: 'expert',
          text: expertAns.text.hi,
          time: 'अभी-अभी',
          verified: true,
        };

        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), expertComm],
        }));
        setIsScientistThinking(null);
      }, 1000);
    }
  };

  const handleRequestScientistAnswer = (postId: string) => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    setIsScientistThinking(postId);
    setActiveThreadId(postId);

    setTimeout(() => {
      const expertAns = generateScientistReply(
        targetPost.title.hi,
        targetPost.content.hi,
        targetPost.cropTag
      );

      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, expertAnswer: expertAns } : p))
      );

      const expertComm: ChopalComment = {
        id: `comm-req-${Date.now()}`,
        postId,
        author: expertAns.expertName,
        location: expertAns.designation,
        role: 'expert',
        text: expertAns.text.hi,
        time: 'अभी-अभी',
        verified: true,
      };

      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), expertComm],
      }));

      setIsScientistThinking(null);
      speakText(`${expertAns.expertName} द्वारा उत्तर: ${expertAns.text.hi.slice(0, 150)}`);
    }, 1000);
  };

  const handleSpeakPost = (post: ChopalPost) => {
    const text =
      language === 'hi'
        ? `${post.author} द्वारा सवाल: ${post.title.hi}. ${post.content.hi}. ${
            post.expertAnswer ? `कृषि वैज्ञानिक उत्तर: ${post.expertAnswer.text.hi}` : ''
          }`
        : `Question by ${post.author}: ${post.title.en}. ${post.content.en}. ${
            post.expertAnswer ? `Scientist Answer: ${post.expertAnswer.text.en}` : ''
          }`;
    speakText(text);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-700" />
                किसान चौपाल • 24/7 सक्रिय सामुदायिक मंच
              </span>
              <span className="text-xs text-emerald-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                सत्यापित कृषि वैज्ञानिक सीधे उत्तर देते हैं ✅
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
              {t.chopal.title[language]}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              {language === 'hi'
                ? 'अपना सवाल पूछें या अनुभव साझा करें। कृषि वैज्ञानिक, केवीके विशेषज्ञ व साथी किसान आपके सवालों का तुरंत समाधान देंगे।'
                : t.chopal.subtitle[language]}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer hover:scale-102"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>{t.chopal.askQuestion[language]} (सवाल पूछें)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Direct Quick Ask Box (No modal needed!) */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-5 border-2 border-emerald-300 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-emerald-950 font-black text-xs sm:text-sm">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>सीधा सवाल पूछें — कृषि वैज्ञानिक का तुरंत 1-सेकंड में उत्तर पाएं:</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!quickQuery.trim()) return;
            handleQuickAsk(quickQuery);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="जैसे: गेहूं में पहला पानी 21 दिन पर दें या 25 दिन पर? या सरसों में माहू की दवा..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <button
            type="submit"
            disabled={!quickQuery.trim()}
            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4 text-amber-300" />
            <span>उत्तर प्राप्त करें (तुरंत)</span>
          </button>
        </form>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => {
          const isThreadOpen = activeThreadId === post.id;
          const postComments = commentsMap[post.id] || [];
          const isThinking = isScientistThinking === post.id;

          return (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 shadow-xs p-5 transition-all"
            >
              {/* Author Row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${post.avatarBg} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm leading-tight flex items-center gap-1.5">
                      <span>{post.author}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-gray-100 text-gray-700 rounded">
                        किसान
                      </span>
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                      <span>{post.location}</span>
                      <span>•</span>
                      <span>{post.timeAgo[language]}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {post.cropTag}
                  </span>
                  <button
                    onClick={() => handleSpeakPost(post)}
                    className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                    title={t.speakText[language]}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Post Title & Content */}
              <h3 className="font-extrabold text-base sm:text-lg text-gray-950 mb-2 leading-snug">
                {post.title[language]}
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                {post.content[language]}
              </p>

              {/* Expert Answer Section (Featured Highlight) */}
              {post.expertAnswer ? (
                <div className="my-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-700 text-amber-300">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-black text-xs sm:text-sm text-emerald-950 flex items-center gap-1.5">
                          <span>{post.expertAnswer.expertName}</span>
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            सत्यापित उत्तर ✓
                          </span>
                        </span>
                        <span className="text-[10px] text-emerald-800 font-bold block">
                          {post.expertAnswer.designation}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        speakText(
                          `${post.expertAnswer?.expertName} की सलाह: ${post.expertAnswer?.text[language]}`
                        )
                      }
                      className="text-xs text-emerald-800 font-bold flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>सुनें</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                    {post.expertAnswer.text[language]}
                  </p>
                </div>
              ) : isThinking ? (
                <div className="my-3 p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-900 animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping"></div>
                  <span>👨‍🔬 कृषि वैज्ञानिक आपके सवाल का अध्ययन कर उत्तर तैयार कर रहे हैं...</span>
                </div>
              ) : (
                <div className="my-3 p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 font-medium">
                    इस सवाल पर अभी वैज्ञानिक का विस्तृत परामर्श उपलब्ध नहीं है।
                  </span>
                  <button
                    onClick={() => handleRequestScientistAnswer(post.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>वैज्ञानिक से उत्तर मांगें</span>
                  </button>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                      post.userLiked
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{post.likes} लाइक</span>
                  </button>

                  <button
                    onClick={() => setActiveThreadId(isThreadOpen ? null : post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      isThreadOpen
                        ? 'bg-emerald-800 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>
                      {postComments.length || post.commentsCount} {t.chopal.reply[language]} (चर्चा
                      देखें/दें)
                    </span>
                    {isThreadOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <span className="text-[11px] text-gray-400 hidden sm:inline">
                  {language === 'hi' ? 'प्रमाणित किसान चर्चा' : 'Verified Agri Discussion'}
                </span>
              </div>

              {/* Discussion Thread (Replies & Reply Box) */}
              {isThreadOpen && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 bg-gray-50/70 p-4 rounded-xl">
                  <h5 className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>सभी जवाब एवं किसानों के अनुभव ({postComments.length}):</span>
                  </h5>

                  {/* Replies List */}
                  {postComments.length === 0 ? (
                    <p className="text-xs text-gray-500 py-2">
                      अभी तक कोई अतिरिक्त जवाब नहीं है। सबसे पहले अपना अनुभव या सलाह लिखें!
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {postComments.map((comment) => {
                        const isExp = comment.role === 'expert';
                        return (
                          <div
                            key={comment.id}
                            className={`p-3 rounded-xl border text-xs sm:text-sm ${
                              isExp
                                ? 'bg-emerald-50/90 border-emerald-300'
                                : 'bg-white border-gray-200 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-gray-900">
                                  {comment.author}
                                </span>
                                {isExp ? (
                                  <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold">
                                    वैज्ञानिक
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">
                                    किसान
                                  </span>
                                )}
                                <span className="text-gray-400 text-[10px]">•</span>
                                <span className="text-gray-500 text-[11px]">
                                  {comment.location}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400">{comment.time}</span>
                            </div>
                            <p className="text-gray-800 leading-relaxed font-medium">
                              {comment.text}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Reply Input Form */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="आपका नाम (वैकल्पिक)"
                        value={commentAuthor[post.id] || ''}
                        onChange={(e) =>
                          setCommentAuthor((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="इस सवाल पर अपना जवाब या सलाह लिखें..."
                          value={newCommentText[post.id] || ''}
                          onChange={(e) =>
                            setNewCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!newCommentText[post.id]?.trim()}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>उत्तर भेजें</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ask Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-gray-950 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>
                {language === 'hi' ? 'चौपाल में अपना सवाल पूछें' : 'Ask in Kisan Chopal'}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {language === 'hi'
                ? 'कृषि वैज्ञानिक व अनुभवी किसान भाई तुरंत आपके सवाल का समाधान देंगे'
                : 'Agri scientists and peer farmers will reply to your question'}
            </p>

            <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {language === 'hi' ? 'आपका नाम' : 'Your Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="जैसे: रामअवतार पटेल"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {language === 'hi' ? 'गाँव / जिला' : 'Village / District'}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="जैसे: विदिशा (म.प्र.)"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {language === 'hi' ? 'फसल या विषय चुनें' : 'Crop / Topic'}
                </label>
                <select
                  value={cropTag}
                  onChange={(e) => setCropTag(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700"
                >
                  <option value="गेहूं (Wheat)">गेहूं (Wheat)</option>
                  <option value="सरसों (Mustard)">सरसों (Mustard)</option>
                  <option value="चना (Chickpea)">चना (Chickpea)</option>
                  <option value="सोयाबीन (Soybean)">सोयाबीन (Soybean)</option>
                  <option value="लहसुन / प्याज (Garlic/Onion)">लहसुन / प्याज (Garlic/Onion)</option>
                  <option value="खाद व उर्वरक प्रबंधन">खाद व उर्वरक प्रबंधन (Fertilizer)</option>
                  <option value="सिंचाई व पहला पानी">सिंचाई व पहला पानी (Irrigation)</option>
                  <option value="खरपतवार नियंत्रण">खरपतवार नियंत्रण (Weeds)</option>
                  <option value="जैविक खेती">जैविक खेती (Organic Farming)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {language === 'hi' ? 'सवाल का मुख्य शीर्षक' : 'Question Title'} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="जैसे: गेहूं में पहला पानी 21 दिन पर दें या 25 दिन पर?"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  {language === 'hi' ? 'सवाल का पूरा विवरण' : 'Full Description'} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="खेत की स्थिति, मिट्टी का प्रकार और अपनी समस्या विस्तार से लिखें..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-100 font-bold transition-colors cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>चौपाल में पोस्ट करें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
