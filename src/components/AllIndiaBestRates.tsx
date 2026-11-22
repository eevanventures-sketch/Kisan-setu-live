import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  TrendingUp,
  MapPin,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Volume2,
  Share2,
  ExternalLink,
  ChevronRight,
  BadgeAlert,
  Zap,
} from 'lucide-react';

interface BestRateMandi {
  rank: number;
  mandiName: string;
  district: string;
  state: string;
  variety: string;
  modalPrice: number;
  maxPrice: number;
  minPrice: number;
  arrivalToday: string;
  advantageOverMpAvg: number; // ₹ extra per quintal compared to local average
  notes: string;
}

interface CropBestRateGuide {
  cropId: string;
  cropName: { hi: string; en: string };
  category: string;
  icon: string;
  nationalAvgPrice: number;
  highestPriceMandi: string;
  highestPrice: number;
  msp: number;
  bestSellingSeason: string;
  sellingTip: { hi: string; en: string };
  topMandis: BestRateMandi[];
}

export const ALL_INDIA_BEST_RATES: CropBestRateGuide[] = [
  // 1. धान (Paddy / 1509 / Basmati)
  {
    cropId: 'paddy',
    cropName: { hi: 'धान (Paddy / बासमती / 1509)', en: 'Paddy / Basmati / 1509' },
    category: 'अनाज (Grain)',
    icon: '🌾',
    nationalAvgPrice: 3800,
    highestPriceMandi: 'तरनतारन / अमृतसर (पंजाब)',
    highestPrice: 5250,
    msp: 2441,
    bestSellingSeason: 'अक्टूबर से दिसंबर',
    sellingTip: {
      hi: 'मध्य प्रदेश (विदिशा, रायसेन, नर्मदापुरम) के किसान बासमती धान (1509, 1718, सुगंधा) को स्थानीय उपमंडियों की बजाय बरेली, सिलवानी या इटारसी मंडी अथवा पंजाब/हरियाणा के राइस मिलर्स से सीधे बेचकर प्रति क्विंटल ₹200 से ₹400 तक अधिक पा सकते हैं।',
      en: 'Farmers in MP can fetch ₹200-400/qtl higher prices by selling fine Basmati (1509/1718) in Bareli, Itarsi or directly to exporters in Punjab.',
    },
    topMandis: [
      {
        rank: 1,
        mandiName: 'अमृतसर / तरनतारन मंडी',
        district: 'अमृतसर',
        state: 'पंजाब',
        variety: 'बासमती 1509 सुपर',
        modalPrice: 5250,
        maxPrice: 5450,
        minPrice: 4800,
        arrivalToday: '42,000 बोरी',
        advantageOverMpAvg: 750,
        notes: 'एक्सपोर्ट राइस मिलर्स की भारी मांग, उच्चतम अंतरराष्ट्रीय भाव',
      },
      {
        rank: 2,
        mandiName: 'करनाल नई अनाज मंडी',
        district: 'करनाल',
        state: 'हरियाणा',
        variety: 'बासमती 1718 / पूसा',
        modalPrice: 5120,
        maxPrice: 5380,
        minPrice: 4700,
        arrivalToday: '38,500 बोरी',
        advantageOverMpAvg: 620,
        notes: 'हरियाणा की प्रमुख बासमती मंडी, नकद भुगतान सुविधा',
      },
      {
        rank: 3,
        mandiName: 'बरेली कृषि उपज मंडी',
        district: 'रायसेन',
        state: 'मध्य प्रदेश',
        variety: 'बासमती 1509 / सुगंधा',
        modalPrice: 4850,
        maxPrice: 5250,
        minPrice: 2100,
        arrivalToday: '15,800 क्विंटल',
        advantageOverMpAvg: 350,
        notes: 'मध्य प्रदेश का सबसे बड़ा धान हब, विदिशा व सीहोर से नजदीक',
      },
      {
        rank: 4,
        mandiName: 'इटारसी कृषि उपज मंडी',
        district: 'नर्मदापुरम',
        state: 'मध्य प्रदेश',
        variety: 'धान 1509 सुगंधा',
        modalPrice: 4610,
        maxPrice: 5020,
        minPrice: 1850,
        arrivalToday: '15,200 क्विंटल',
        advantageOverMpAvg: 110,
        notes: 'रेलवे जंक्शन कनेक्टिविटी, बड़ी राइस मिलों की सीधी नीलामी',
      },
      {
        rank: 5,
        mandiName: 'गंजबासौदा / विदिशा मंडी',
        district: 'विदिशा',
        state: 'मध्य प्रदेश',
        variety: 'धान सामान्य / सुगंधा',
        modalPrice: 4500,
        maxPrice: 4996,
        minPrice: 1000,
        arrivalToday: '14,758 बोरी',
        advantageOverMpAvg: 0,
        notes: 'स्थानीय मंडी, त्वरित तौल व सौदा पत्रक भुगतान',
      },
    ],
  },

  // 2. सोयाबीन (Soybean)
  {
    cropId: 'soybean',
    cropName: { hi: 'सोयाबीन (Soybean Yellow)', en: 'Soybean (Yellow)' },
    category: 'तिलहन (Oilseed)',
    icon: '🌱',
    nationalAvgPrice: 6200,
    highestPriceMandi: 'लातूर मंडी (महाराष्ट्र)',
    highestPrice: 7150,
    msp: 5708,
    bestSellingSeason: 'नवंबर से जनवरी',
    sellingTip: {
      hi: 'सोयाबीन में 10% से कम नमी और मिट्टी-कंकड़ रहित साफ दाना लाने पर इंदौर, कोटा या लातूर के सॉल्वेंट एक्सट्रैक्शन प्लांट्स ₹150 से ₹250 प्रति क्विंटल का प्रीमियम बोनस देते हैं।',
      en: 'Clean, graded soybean with under 10% moisture fetches a ₹150-250/qtl premium at Latur and Indore processing hubs.',
    },
    topMandis: [
      {
        rank: 1,
        mandiName: 'लातूर कृषि उपज मंडी',
        district: 'लातूर',
        state: 'महाराष्ट्र',
        variety: 'सोयाबीन पीला (Plant Quality)',
        modalPrice: 7150,
        maxPrice: 7300,
        minPrice: 6200,
        arrivalToday: '45,000 बोरी',
        advantageOverMpAvg: 550,
        notes: 'भारत का सबसे बड़ा सोयाबीन ऑयल हब, सॉल्वेंट प्लांट्स की सीधी बोली',
      },
      {
        rank: 2,
        mandiName: 'इंदौर छावनी मंडी',
        district: 'इंदौर',
        state: 'मध्य प्रदेश',
        variety: 'सोयाबीन ग्रेड-ए',
        modalPrice: 6840,
        maxPrice: 7200,
        minPrice: 3400,
        arrivalToday: '18,200 क्विंटल',
        advantageOverMpAvg: 240,
        notes: 'मालवा क्षेत्र का प्रमुख केंद्र, प्रतिदिन भारी आवक',
      },
      {
        rank: 3,
        mandiName: 'कोटा भामाशाह मंडी',
        district: 'कोटा',
        state: 'राजस्थान',
        variety: 'सोयाबीन सूखा साफ',
        modalPrice: 6840,
        maxPrice: 7220,
        minPrice: 3450,
        arrivalToday: '17,100 बोरी',
        advantageOverMpAvg: 240,
        notes: 'हाड़ौती संभाग का विशाल केंद्र, बड़े तेल मिलों के अनुबंध',
      },
      {
        rank: 4,
        mandiName: 'सिरोंज मंडी',
        district: 'विदिशा',
        state: 'मध्य प्रदेश',
        variety: 'सोयाबीन पीला',
        modalPrice: 6700,
        maxPrice: 6965,
        minPrice: 2000,
        arrivalToday: '2,752 क्विंटल',
        advantageOverMpAvg: 100,
        notes: 'स्थानीय किसानों के लिए भरोसेमंद नीलामी',
      },
      {
        rank: 5,
        mandiName: 'गंजबासौदा मंडी',
        district: 'विदिशा',
        state: 'मध्य प्रदेश',
        variety: 'सोयाबीन',
        modalPrice: 6600,
        maxPrice: 7050,
        minPrice: 2150,
        arrivalToday: '8,887 बोरी',
        advantageOverMpAvg: 0,
        notes: 'विदिशा जिले की प्रमुख सोयाबीन मंडी',
      },
    ],
  },

  // 3. सरसों (Mustard / Raida)
  {
    cropId: 'mustard',
    cropName: { hi: 'सरसों (Mustard / राई / 42% Oil)', en: 'Mustard / Rapeseed' },
    category: 'तिलहन (Oilseed)',
    icon: '🌼',
    nationalAvgPrice: 6800,
    highestPriceMandi: 'अलवर / गंजबासौदा मंडी',
    highestPrice: 8350,
    msp: 6200,
    bestSellingSeason: 'नवंबर व फरवरी-मार्च',
    sellingTip: {
      hi: 'गंजबासौदा और अलवर मंडी में 42% तेल कंडीशन वाली बोल्ड सरसों को रिकॉर्ड ₹8,300 से ₹8,590 का अधिकतम भाव मिल रहा है। तेल प्रतिशत जांच करवाकर ही बेचें।',
      en: 'Bold mustard with 42% oil condition is capturing all-time highs of ₹8,300-8,590 in Ganjbasoda and Alwar.',
    },
    topMandis: [
      {
        rank: 1,
        mandiName: 'अलवर कृषि उपज मंडी',
        district: 'अलवर',
        state: 'राजस्थान',
        variety: 'सरसों 42% तेल कंडीशन',
        modalPrice: 8350,
        maxPrice: 8650,
        minPrice: 6700,
        arrivalToday: '18,400 बोरी',
        advantageOverMpAvg: 1050,
        notes: 'भारत की सबसे प्रसिद्ध सरसों तेल मंडी, कच्ची घानी ब्रांड्स की खरीद',
      },
      {
        rank: 2,
        mandiName: 'गंजबासौदा मंडी',
        district: 'विदिशा',
        state: 'मध्य प्रदेश',
        variety: 'सरसों बोल्ड',
        modalPrice: 8300,
        maxPrice: 8590,
        minPrice: 6500,
        arrivalToday: '132 बोरी',
        advantageOverMpAvg: 1000,
        notes: 'मध्य प्रदेश में सरसों का रिकॉर्ड मॉडल भाव, व्यापारियों की कड़ी प्रतिस्पर्धा',
      },
      {
        rank: 3,
        mandiName: 'कोटा भामाशाह मंडी',
        district: 'कोटा',
        state: 'राजस्थान',
        variety: 'सरसों देशी',
        modalPrice: 7850,
        maxPrice: 8400,
        minPrice: 6950,
        arrivalToday: '9,100 बोरी',
        advantageOverMpAvg: 550,
        notes: 'हाड़ौती मंडी, निरंतर उच्च मांग',
      },
      {
        rank: 4,
        mandiName: 'सिरोंज मंडी',
        district: 'विदिशा',
        state: 'मध्य प्रदेश',
        variety: 'सरसों',
        modalPrice: 7585,
        maxPrice: 7585,
        minPrice: 7585,
        arrivalToday: '21 क्विंटल',
        advantageOverMpAvg: 285,
        notes: 'स्थानीय उच्च भाव',
      },
    ],
  },

  // 4. गेहूं (Wheat - Sharbati & Lokwan)
  {
    cropId: 'wheat',
    cropName: { hi: 'गेहूं (Wheat शरबती / 1544 / लोकवान)', en: 'Wheat (Sharbati / Lokwan)' },
    category: 'अनाज (Grain)',
    icon: '🌾',
    nationalAvgPrice: 2800,
    highestPriceMandi: 'सीहोर / अशोकनगर (GI शरबती)',
    highestPrice: 6200,
    msp: 2625,
    bestSellingSeason: 'मार्च से मई व नवंबर में बीज हेतु',
    sellingTip: {
      hi: 'सीहोर और अशोकनगर का जीआई टैग वाला शरबती गेहूं देश में सबसे महंगा (₹4,500 से ₹6,200/क्विंटल) बिकता है। सामान्य लोकवान/1544 गेहूं विदिशा, गंजबासौदा में ₹2,700-₹2,900 के बीच बिक रहा है।',
      en: 'GI Tagged Sehore Sharbati wheat commands unmatched prices up to ₹6,200/qtl in Sehore and Ashoknagar markets.',
    },
    topMandis: [
      {
        rank: 1,
        mandiName: 'अशोकनगर कृषि उपज मंडी',
        district: 'अशोकनगर',
        state: 'मध्य प्रदेश',
        variety: 'शरबती प्रीमियम C-306',
        modalPrice: 4850,
        maxPrice: 6200,
        minPrice: 3400,
        arrivalToday: '12,800 क्विंटल',
        advantageOverMpAvg: 2150,
        notes: 'देश का सबसे बड़ा शरबती गेहूं केंद्र, दिल्ली-मुंबई के व्यापारियों की सीधी खरीद',
      },
      {
        rank: 2,
        mandiName: 'सीहोर मुख्य मंडी',
        district: 'सीहोर',
        state: 'मध्य प्रदेश',
        variety: 'सीहोर शरबती (Golden Grain)',
        modalPrice: 4650,
        maxPrice: 5950,
        minPrice: 3200,
        arrivalToday: '9,200 क्विंटल',
        advantageOverMpAvg: 1950,
        notes: 'विश्व प्रसिद्ध सीहोर शरबती, प्रीमियम ब्रांड्स की मांग',
      },
      {
        rank: 3,
        mandiName: 'गंजबासौदा मंडी',
        district: 'विदिशा',
        state: 'मध्य प्रदेश',
        variety: 'गेहूं (मिल क्वालिटी / लोकवान)',
        modalPrice: 2900,
        maxPrice: 4800,
        minPrice: 1930,
        arrivalToday: '2,439 बोरी',
        advantageOverMpAvg: 200,
        notes: 'विदिशा जिले में लोकवान गेहूं का मजबूत भाव',
      },
      {
        rank: 4,
        mandiName: 'विदिशा मुख्य मंडी',
        district: 'विदिशा',
        state: 'मध्य प्रदेश',
        variety: 'गेहूं 1544 / शरबती',
        modalPrice: 2750,
        maxPrice: 5750,
        minPrice: 1550,
        arrivalToday: '6,920 क्विंटल',
        advantageOverMpAvg: 50,
        notes: 'जिले का मुख्य संकलन केंद्र',
      },
    ],
  },

  // 5. लहसुन (Garlic)
  {
    cropId: 'garlic',
    cropName: { hi: 'लहसुन (Garlic ऊटी / देसी / बोल्ड)', en: 'Garlic (Ooty / Desi)' },
    category: 'मसाला (Spice)',
    icon: '🧄',
    nationalAvgPrice: 12000,
    highestPriceMandi: 'मंदसौर / नीमच मंडी (मध्य प्रदेश)',
    highestPrice: 25000,
    msp: 0,
    bestSellingSeason: 'फरवरी से मई व नवंबर',
    sellingTip: {
      hi: 'एशिया की सबसे बड़ी लहसुन मंडी मंदसौर व नीमच में है, जहाँ ऊटी व सिल्वर बोल्ड लहसुन ₹24,000 से ₹25,000 प्रति क्विंटल तक बिक रहा है। छांट कर (ग्रेडिंग करके) माल लाने पर ₹3,000/क्विंटल अधिक मिलता है।',
      en: 'Mandsaur and Neemuch are Asia’s largest garlic markets, yielding peak prices up to ₹25,000/qtl for graded bold bulbs.',
    },
    topMandis: [
      {
        rank: 1,
        mandiName: 'मंदसौर कृषि उपज मंडी',
        district: 'मंदसौर',
        state: 'मध्य प्रदेश',
        variety: 'लहसुन बोल्ड / बॉक्स क्वालिटी',
        modalPrice: 18100,
        maxPrice: 25000,
        minPrice: 8000,
        arrivalToday: '16,800 बोरी',
        advantageOverMpAvg: 2600,
        notes: 'एशिया की नंबर-1 लहसुन मंडी, पूरे भारत के थोक खरीदार',
      },
      {
        rank: 2,
        mandiName: 'नीमच कृषि उपज मंडी',
        district: 'नीमच',
        state: 'मध्य प्रदेश',
        variety: 'लहसुन ऊटी / देशी',
        modalPrice: 17600,
        maxPrice: 24500,
        minPrice: 7800,
        arrivalToday: '15,200 बोरी',
        advantageOverMpAvg: 2100,
        notes: 'औषधीय व एक्सपोर्ट ग्रेड लहसुन का सबसे बड़ा केंद्र',
      },
      {
        rank: 3,
        mandiName: 'सीहोर / आष्टा मंडी',
        district: 'सीहोर',
        state: 'मध्य प्रदेश',
        variety: 'लहसुन देशी',
        modalPrice: 15800,
        maxPrice: 21500,
        minPrice: 6200,
        arrivalToday: '4,600 क्विंटल',
        advantageOverMpAvg: 300,
        notes: 'भोपाल संभाग के किसानों के लिए नजदीकी उच्च भाव मंडी',
      },
    ],
  },

  // 6. चना (Chickpea / Chana / Dollar)
  {
    cropId: 'chana',
    cropName: { hi: 'चना (Chana देसी / काबुली / डॉलर)', en: 'Chickpea / Dollar Gram' },
    category: 'दलहन (Pulse)',
    icon: '🌱',
    nationalAvgPrice: 6400,
    highestPriceMandi: 'इंदौर छावनी मंडी (डॉलर चना)',
    highestPrice: 14800,
    msp: 5958,
    bestSellingSeason: 'मार्च से जून व नवंबर',
    sellingTip: {
      hi: 'काबुली / डॉलर चना इंदौर व उज्जैन मंडी में ₹12,000 से ₹14,800 तक बिकता है। देसी चना गंजबासौदा व सिरोंज मंडी में ₹6,500 के आसपास एमएसपी (₹5,958) से ऊपर मजबूती से बिक रहा है।',
      en: 'Export-grade Dollar Chana fetches ₹12,000-14,800/qtl in Indore and Ujjain; Desi Chana is firm at ₹6,500/qtl in Ganjbasoda.',
    },
    topMandis: [
      {
        rank: 1,
        mandiName: 'इंदौर छावनी मंडी',
        district: 'इंदौर',
        state: 'मध्य प्रदेश',
        variety: 'डॉलर चना एक्सपोर्ट ग्रेड (Kabuli)',
        modalPrice: 12800,
        maxPrice: 14800,
        minPrice: 9200,
        arrivalToday: '7,800 क्विंटल',
        advantageOverMpAvg: 6300,
        notes: 'गल्फ व यूरोप निर्यात हेतु डॉलर चने का अंतरराष्ट्रीय बाजार',
      },
      {
        rank: 2,
        mandiName: 'गंजबासौदा मंडी',
        district: 'विदिशा',
        state: 'मध्य प्रदेश',
        variety: 'चना देसी (कांटा/विशाल)',
        modalPrice: 6500,
        maxPrice: 7100,
        minPrice: 4540,
        arrivalToday: '1,160 बोरी',
        advantageOverMpAvg: 100,
        notes: 'एमएसपी (₹5,958) से ₹542 प्रति क्विंटल ऊंचा भाव',
      },
      {
        rank: 3,
        mandiName: 'सिरोंज मंडी',
        district: 'विदिशा',
        state: 'मध्य प्रदेश',
        variety: 'चना देसी',
        modalPrice: 6500,
        maxPrice: 6810,
        minPrice: 5500,
        arrivalToday: '399 क्विंटल',
        advantageOverMpAvg: 100,
        notes: 'विदिशा जिले की विश्वसनीय चना मंडी',
      },
    ],
  },
];

export const AllIndiaBestRates: React.FC = () => {
  const { language, speakText } = useLanguage();
  const [selectedCropId, setSelectedCropId] = useState<string>('paddy');
  const [searchTerm, setSearchTerm] = useState('');

  const activeCrop =
    ALL_INDIA_BEST_RATES.find((c) => c.cropId === selectedCropId) || ALL_INDIA_BEST_RATES[0];

  const handleSpeakSummary = () => {
    const text =
      language === 'hi'
        ? `${activeCrop.cropName.hi} में आज पूरे भारत में सबसे ऊंचा भाव ${activeCrop.highestPriceMandi} में ₹${activeCrop.highestPrice} प्रति क्विंटल चल रहा है। वैज्ञानिक सलाह: ${activeCrop.sellingTip.hi}`
        : `Highest rate for ${activeCrop.cropName.en} today in India is ₹${activeCrop.highestPrice} per quintal in ${activeCrop.highestPriceMandi}.`;
    speakText(text);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-emerald-950 flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                अखिल भारतीय सर्वोच्च भाव ट्रैकर
              </span>
              <span className="text-xs text-emerald-200">
                (All-India High Rate Mandi Discovery)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              अपनी फसल सबसे महंगे भाव में कहाँ बेचें?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-3xl leading-relaxed">
              जानिए पूरे भारत में आपकी फसल (धान, सोयाबीन, गेहूं, सरसों, लहसुन आदि) किस राज्य व मंडी
              में सबसे ऊंचे दामों पर बिक रही है, ताकि आपको अपनी उपज का अधिकतम मुनाफा मिले।
            </p>
          </div>

          <button
            onClick={handleSpeakSummary}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs sm:text-sm transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>सलाह आवाज में सुनें</span>
          </button>
        </div>

        {/* Crop Selection Pills */}
        <div className="mt-5 pt-4 border-t border-emerald-800/80 flex flex-wrap gap-2">
          {ALL_INDIA_BEST_RATES.map((crop) => {
            const isSelected = crop.cropId === selectedCropId;
            return (
              <button
                key={crop.cropId}
                onClick={() => setSelectedCropId(crop.cropId)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-emerald-950 font-black shadow-md scale-102 ring-2 ring-amber-300'
                    : 'bg-emerald-900/80 text-emerald-100 hover:bg-emerald-800 border border-emerald-700/60'
                }`}
              >
                <span>{crop.icon}</span>
                <span>{crop.cropName[language]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Crop Summary Highlight Card */}
      <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Top Price Mandi */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <span className="text-[11px] font-bold text-amber-900 block flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>भारत में नंबर-1 सर्वोच्च भाव</span>
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-950">
                ₹{activeCrop.highestPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-gray-500">/ क्विंटल</span>
            </div>
            <span className="text-xs font-extrabold text-emerald-800 block mt-1">
              📍 {activeCrop.highestPriceMandi}
            </span>
          </div>

          {/* National Avg */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-800 block">
              राष्ट्रीय औसत मंडी भाव
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-gray-900">
                ₹{activeCrop.nationalAvgPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-gray-500">/ क्विंटल</span>
            </div>
            <span className="text-xs text-gray-600 block mt-1">
              सर्वोच्च मंडी में +₹{activeCrop.highestPrice - activeCrop.nationalAvgPrice} अधिक
            </span>
          </div>

          {/* MSP Support Price */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
            <span className="text-[11px] font-bold text-blue-800 block">
              सरकारी समर्थन मूल्य (MSP)
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-blue-950">
                {activeCrop.msp > 0 ? `₹${activeCrop.msp.toLocaleString('en-IN')}` : 'बाजार भाव'}
              </span>
              {activeCrop.msp > 0 && <span className="text-xs font-bold text-gray-500">/ क्विंटल</span>}
            </div>
            <span className="text-xs text-blue-700 block mt-1">
              {activeCrop.msp > 0 ? 'केंद्र सरकार द्वारा न्यूनतम घोषित दर' : 'मुफ्त व्यापार जिंस'}
            </span>
          </div>

          {/* Best Selling Window */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[11px] font-bold text-gray-600 block">
              उपज बेचने का स्वर्णिम समय
            </span>
            <div className="mt-1 text-base sm:text-lg font-black text-gray-900">
              {activeCrop.bestSellingSeason}
            </div>
            <span className="text-xs text-gray-500 block mt-1">उच्च मांग व व्यापारियों की खरीद</span>
          </div>
        </div>

        {/* Expert Selling Tip for Farmers */}
        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-800 text-amber-300 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-xs sm:text-sm text-emerald-950">
              किसान व्यापार एवं मंडी चयन सलाह:
            </h4>
            <p className="text-xs sm:text-sm text-emerald-900 mt-0.5 leading-relaxed">
              {activeCrop.sellingTip[language]}
            </p>
          </div>
        </div>
      </div>

      {/* Top 5 Mandis Comparison Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-black text-gray-950 flex items-center gap-2">
              <span>🏆 {activeCrop.cropName[language]} के लिए भारत की शीर्ष मंडियां</span>
            </h3>
            <p className="text-xs text-gray-500">
              विभिन्न राज्यों की मंडियों के आज के मॉडल भाव, अधिकतम भाव एवं आवक की तुलना
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 w-fit">
            दैनिक लाइव अंतर-राज्यीय भाव
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-emerald-900 text-white font-extrabold border-b border-emerald-950">
                <th className="py-3 px-3 text-center w-12">रैंक</th>
                <th className="py-3 px-4 min-w-[160px]">मंडी का नाम एवं जिला</th>
                <th className="py-3 px-3">राज्य</th>
                <th className="py-3 px-3">प्रकार / क्वालिटी</th>
                <th className="py-3 px-4 text-right bg-amber-400 text-emerald-950 font-black">
                  मॉडल भाव (₹)
                </th>
                <th className="py-3 px-3 text-right">अधिकतम भाव</th>
                <th className="py-3 px-3 text-center">आज की आवक</th>
                <th className="py-3 px-4 min-w-[200px]">विशेषता एवं व्यापारी टिप्पणी</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeCrop.topMandis.map((m) => {
                const isRank1 = m.rank === 1;
                return (
                  <tr
                    key={m.rank}
                    className={`hover:bg-amber-50/60 transition-colors ${
                      isRank1 ? 'bg-amber-50/40 font-semibold' : 'bg-white'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-black ${
                          isRank1
                            ? 'bg-amber-400 text-emerald-950 shadow-xs'
                            : m.rank === 2
                            ? 'bg-gray-300 text-gray-800'
                            : m.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {m.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-gray-900">
                      <div>
                        <span>{m.mandiName}</span>
                        <span className="block text-[11px] font-normal text-gray-500">
                          {m.district}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-700">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-xs">
                        {m.state}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-emerald-900 font-semibold">{m.variety}</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-950 text-sm sm:text-base bg-amber-50/60">
                      ₹{m.modalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-gray-700">
                      ₹{m.maxPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-700 font-medium">
                      {m.arrivalToday}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 leading-snug">{m.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
