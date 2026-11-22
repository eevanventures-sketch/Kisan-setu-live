import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  Calculator,
  Volume2,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
  CircleDollarSign,
  Info,
} from 'lucide-react';

interface CropNutrientData {
  name: { hi: string; en: string };
  // N, P, K in kg per acre
  n: number;
  p: number;
  k: number;
  zinc: number;
  seedRatePerAcre: string;
  notes: { hi: string; en: string };
}

const cropPresets: Record<string, CropNutrientData> = {
  wheat: {
    name: { hi: 'गेहूं (Wheat)', en: 'Wheat' },
    n: 50,
    p: 24,
    k: 16,
    zinc: 10,
    seedRatePerAcre: '40 - 45 किग्रा / एकड़',
    notes: {
      hi: 'गेहूं में संपूर्ण फास्फोरस व पोटाश तथा 1/3 नाइट्रोजन बुवाई के समय दें। शेष नाइट्रोजन पहली व दूसरी सिंचाई पर दें।',
      en: 'Apply full P & K and 1/3 Nitrogen at sowing. Split remaining Nitrogen at 1st and 2nd irrigations.',
    },
  },
  mustard: {
    name: { hi: 'सरसों (Mustard)', en: 'Mustard' },
    n: 32,
    p: 16,
    k: 12,
    zinc: 8,
    seedRatePerAcre: '1.5 - 2 किग्रा / एकड़',
    notes: {
      hi: 'सरसों में सल्फर (गंधक) 10-15 किग्रा/एकड़ अवश्य डालें जिससे तेल की मात्रा 2-3% बढ़ जाती है।',
      en: 'Mustard requires 10-15kg Sulfur per acre for higher oil recovery.',
    },
  },
  paddy: {
    name: { hi: 'धान (Paddy)', en: 'Paddy' },
    n: 48,
    p: 24,
    k: 24,
    zinc: 10,
    seedRatePerAcre: '6 - 8 किग्रा (हाइब्रिड) / एकड़',
    notes: {
      hi: 'रोपाई के समय डीएपी व पोटाश दें। जिंक सल्फेट को कभी भी डीएपी के साथ मिलाकर न डालें, अलग से दें।',
      en: 'Never mix Zinc Sulphate directly with DAP to avoid chemical fixation.',
    },
  },
  cotton: {
    name: { hi: 'कपास (Cotton)', en: 'Cotton' },
    n: 60,
    p: 30,
    k: 30,
    zinc: 10,
    seedRatePerAcre: '2 पैकेट (बीटी हाइब्रिड) / एकड़',
    notes: {
      hi: 'नाइट्रोजन को 3 से 4 बार में विभाजित करके दें (बुवाई, डोडे बनते समय और फूल आते समय)।',
      en: 'Split Nitrogen into 3-4 split applications during square formation and flowering.',
    },
  },
  potato: {
    name: { hi: 'आलू (Potato)', en: 'Potato' },
    n: 72,
    p: 40,
    k: 48,
    zinc: 10,
    seedRatePerAcre: '12 - 15 क्विंटल कंद / एकड़',
    notes: {
      hi: 'आलू को पोटाश की अधिक आवश्यकता होती है। पोटाश से कंदों का आकार व छिलका मजबूत होता है।',
      en: 'High potassium requirement for uniform tuber sizing and skin resilience.',
    },
  },
  gram: {
    name: { hi: 'चना (Gram / Chana)', en: 'Gram / Chickpea' },
    n: 10,
    p: 20,
    k: 10,
    zinc: 5,
    seedRatePerAcre: '30 - 35 किग्रा / एकड़',
    notes: {
      hi: 'दलहनी फसल होने के कारण चने की जड़ों में राइजोबियम गांठे नाइट्रोजन बनाती हैं, इसलिए यूरिया कम दें।',
      en: 'Legume crop fixes atmospheric nitrogen via root nodules; requires minimal urea.',
    },
  },
};

export const FertilizerCalculator: React.FC = () => {
  const { language, t, speakText } = useLanguage();

  const [selectedCrop, setSelectedCrop] = useState<string>('wheat');
  const [landArea, setLandArea] = useState<number>(2);
  const [unit, setUnit] = useState<'acre' | 'bigha' | 'hectare'>('acre');
  const [nutrientSource, setNutrientSource] = useState<'dap' | 'ssp'>('dap');

  // Convert to acres for standard calculation
  // 1 Acre = 1.6 Bigha (approx standard north-central India), 1 Hectare = 2.47 Acres
  const acres =
    unit === 'acre' ? landArea : unit === 'bigha' ? landArea / 1.6 : landArea * 2.47;

  const crop = cropPresets[selectedCrop] || cropPresets.wheat;

  // Fertilizer bag weight: Urea = 45 kg bag, DAP = 50 kg bag, SSP = 50 kg bag, MOP = 50 kg bag
  // DAP is 18% N, 46% P2O5
  // Urea is 46% N
  // MOP is 60% K2O
  // SSP is 16% P2O5, 11% Sulfur, 19% Calcium

  const dapKg = (crop.p / 0.46) * acres;
  const dapBags = Math.ceil(dapKg / 50);

  // Nitrogen from DAP
  const nFromDap = dapKg * 0.18;
  const remainingN = Math.max(0, crop.n * acres - nFromDap);
  const ureaKg = remainingN / 0.46;
  const ureaBags = Math.ceil(ureaKg / 45);

  const mopKg = (crop.k / 0.6) * acres;
  const mopBags = Math.ceil(mopKg / 50);

  // If SSP chosen:
  const sspKg = (crop.p / 0.16) * acres;
  const sspBags = Math.ceil(sspKg / 50);
  const ureaForSspKg = (crop.n * acres) / 0.46;
  const ureaForSspBags = Math.ceil(ureaForSspKg / 45);

  const zincKg = crop.zinc * acres;

  // Approximate govt subsidized prices:
  // Urea = ₹266.50 / 45kg bag
  // DAP = ₹1350 / 50kg bag
  // SSP = ₹450 / 50kg bag
  // MOP = ₹1700 / 50kg bag
  const estimatedCostDap = dapBags * 1350 + ureaBags * 266.5 + mopBags * 1700;
  const estimatedCostSsp = sspBags * 450 + ureaForSspBags * 266.5 + mopBags * 1700;

  const handleSpeakCalculation = () => {
    const speech =
      language === 'hi'
        ? `${landArea} ${unit === 'acre' ? 'एकड़' : unit === 'bigha' ? 'बीघा' : 'हेक्टेयर'} ${crop.name.hi} के लिए कुल ${ureaBags} बोरी यूरिया, ${dapBags} बोरी डीएपी, और ${mopBags} बोरी पोटाश की आवश्यकता होगी। ${crop.notes.hi}`
        : `For ${landArea} ${unit} of ${crop.name.en}, recommended dosage is ${ureaBags} bags Urea, ${dapBags} bags DAP, and ${mopBags} bags MOP.`;
    speakText(speech);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900">
                ICAR वैज्ञानिक खाद अनुशंसा
              </span>
              <span className="text-xs text-gray-500">संतुलित पोषण • कम लागत में अधिक उपज</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
              {t.calculator.title[language]}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              {t.calculator.subtitle[language]}
            </p>
          </div>

          <button
            onClick={handleSpeakCalculation}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-emerald-700" />
            <span>{t.speakText[language]}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs vs Calculation Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-black text-base text-gray-950 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-700" />
            <span>{language === 'hi' ? 'खेत का विवरण भरें' : 'Enter Field Details'}</span>
          </h3>

          {/* Crop Selector */}
          <div>
            <label className="font-bold text-xs sm:text-sm text-gray-700 block mb-1.5">
              {t.calculator.selectCrop[language]}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
            >
              {Object.entries(cropPresets).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.name[language]}
                </option>
              ))}
            </select>
          </div>

          {/* Land Size & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-xs sm:text-sm text-gray-700 block mb-1.5">
                {t.calculator.landSize[language]}
              </label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={landArea}
                onChange={(e) => setLandArea(Math.max(0.1, Number(e.target.value)))}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="font-bold text-xs sm:text-sm text-gray-700 block mb-1.5">
                {t.calculator.unit[language]}
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="acre">{t.calculator.acre[language]}</option>
                <option value="bigha">{t.calculator.bigha[language]}</option>
                <option value="hectare">{t.calculator.hectare[language]}</option>
              </select>
            </div>
          </div>

          {/* Fertilizer Option Switcher: DAP vs SSP */}
          <div>
            <label className="font-bold text-xs sm:text-sm text-gray-700 block mb-1.5">
              {language === 'hi' ? 'फॉस्फोरस का स्रोत चुनें:' : 'Select Phosphorus Source:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNutrientSource('dap')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  nutrientSource === 'dap'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                यूरिया + डीएपी (DAP)
              </button>
              <button
                type="button"
                onClick={() => setNutrientSource('ssp')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  nutrientSource === 'ssp'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                यूरिया + एसएसपी (SSP)
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {nutrientSource === 'ssp'
                ? language === 'hi'
                  ? '💡 एसएसपी में 11% सल्फर व 19% कैल्शियम मुफ्त मिलता है!'
                  : '💡 SSP provides free 11% Sulfur & 19% Calcium!'
                : language === 'hi'
                ? 'डीएपी प्रचलित व तीव्र घुलनशील खाद है।'
                : 'DAP is conventional fast dissolving phosphate.'}
            </p>
          </div>

          {/* Seed Requirement Box */}
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950">
            <span className="font-bold block text-amber-900 mb-0.5">
              {t.calculator.seedRequirement[language]}
            </span>
            <span className="text-sm font-extrabold">{crop.seedRatePerAcre}</span>
            <span className="text-[11px] text-amber-800 block mt-1">
              ({landArea} {unit === 'acre' ? 'एकड़' : unit === 'bigha' ? 'बीघा' : 'हेक्टेयर'} के लिए लगभग{' '}
              {Math.round(40 * acres)} किग्रा बीज)
            </span>
          </div>

          {/* Scientific Note */}
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{crop.notes[language]}</p>
          </div>
        </div>

        {/* Right Dosage & Cost Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base sm:text-lg text-emerald-950">
                {t.calculator.resultsTitle[language]}
              </h3>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                {landArea} {unit === 'acre' ? 'एकड़' : unit === 'bigha' ? 'बीघा' : 'हेक्टेयर'}
              </span>
            </div>

            {/* Fertilizer Cards */}
            {nutrientSource === 'dap' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {/* Urea Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 block">नीम लेपित यूरिया (Urea)</span>
                  <div className="my-2">
                    <span className="text-3xl font-black text-emerald-950">{ureaBags}</span>
                    <span className="text-xs font-bold text-emerald-800 ml-1">बोरी (45 kg)</span>
                  </div>
                  <span className="text-xs text-gray-600 block">कुल: ~{Math.round(ureaKg)} किग्रा</span>
                  <span className="text-[11px] text-emerald-700 font-bold block mt-1">
                    अनुमानित: ₹{Math.round(ureaBags * 266.5)}
                  </span>
                </div>

                {/* DAP Card */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                  <span className="text-xs font-bold text-amber-900 block">डीएपी (DAP 18-46-0)</span>
                  <div className="my-2">
                    <span className="text-3xl font-black text-amber-950">{dapBags}</span>
                    <span className="text-xs font-bold text-amber-900 ml-1">बोरी (50 kg)</span>
                  </div>
                  <span className="text-xs text-gray-600 block">कुल: ~{Math.round(dapKg)} किग्रा</span>
                  <span className="text-[11px] text-amber-800 font-bold block mt-1">
                    अनुमानित: ₹{dapBags * 1350}
                  </span>
                </div>

                {/* MOP Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <span className="text-xs font-bold text-blue-900 block">पोटाश (MOP 60% K)</span>
                  <div className="my-2">
                    <span className="text-3xl font-black text-blue-950">{mopBags}</span>
                    <span className="text-xs font-bold text-blue-900 ml-1">बोरी (50 kg)</span>
                  </div>
                  <span className="text-xs text-gray-600 block">कुल: ~{Math.round(mopKg)} किग्रा</span>
                  <span className="text-[11px] text-blue-800 font-bold block mt-1">
                    अनुमानित: ₹{mopBags * 1700}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {/* Urea Card for SSP */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 block">यूरिया (Urea)</span>
                  <div className="my-2">
                    <span className="text-3xl font-black text-emerald-950">{ureaForSspBags}</span>
                    <span className="text-xs font-bold text-emerald-800 ml-1">बोरी (45 kg)</span>
                  </div>
                  <span className="text-xs text-gray-600 block">कुल: ~{Math.round(ureaForSspKg)} किग्रा</span>
                  <span className="text-[11px] text-emerald-700 font-bold block mt-1">
                    अनुमानित: ₹{Math.round(ureaForSspBags * 266.5)}
                  </span>
                </div>

                {/* SSP Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <span className="text-xs font-bold text-purple-900 block">एसएसपी (SSP दानेदार)</span>
                  <div className="my-2">
                    <span className="text-3xl font-black text-purple-950">{sspBags}</span>
                    <span className="text-xs font-bold text-purple-900 ml-1">बोरी (50 kg)</span>
                  </div>
                  <span className="text-xs text-gray-600 block">कुल: ~{Math.round(sspKg)} किग्रा</span>
                  <span className="text-[11px] text-purple-800 font-bold block mt-1">
                    अनुमानित: ₹{sspBags * 450}
                  </span>
                </div>

                {/* MOP Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <span className="text-xs font-bold text-blue-900 block">पोटाश (MOP)</span>
                  <div className="my-2">
                    <span className="text-3xl font-black text-blue-950">{mopBags}</span>
                    <span className="text-xs font-bold text-blue-900 ml-1">बोरी (50 kg)</span>
                  </div>
                  <span className="text-xs text-gray-600 block">कुल: ~{Math.round(mopKg)} किग्रा</span>
                  <span className="text-[11px] text-blue-800 font-bold block mt-1">
                    अनुमानित: ₹{mopBags * 1700}
                  </span>
                </div>
              </div>
            )}

            {/* Application Stages Timeline */}
            <h4 className="font-bold text-xs sm:text-sm text-gray-900 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>{language === 'hi' ? 'खाद देने का सही समय व शेड्यूल' : 'Fertilizer Application Timeline'}</span>
            </h4>

            <div className="space-y-2 text-xs text-gray-800">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <span className="font-extrabold text-emerald-950 block">{t.calculator.basalDose[language]}</span>
                  <p className="text-gray-600 mt-0.5">
                    {nutrientSource === 'dap'
                      ? `संपूर्ण डीएपी (${dapBags} बोरी) + संपूर्ण पोटाश (${mopBags} बोरी) + 1/3 यूरिया (${Math.ceil(
                          ureaBags / 3
                        )} बोरी)`
                      : `संपूर्ण एसएसपी (${sspBags} बोरी) + संपूर्ण पोटाश (${mopBags} बोरी) + 1/3 यूरिया (${Math.ceil(
                          ureaForSspBags / 3
                        )} बोरी)`}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  <span className="font-extrabold text-blue-950 block">{t.calculator.topDressing1[language]}</span>
                  <p className="text-gray-600 mt-0.5">
                    यूरिया की दूसरी किस्त ({Math.ceil(ureaBags / 3)} बोरी) + जिंक सल्फेट ({Math.round(zincKg)} किग्रा)
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-purple-700 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  <span className="font-extrabold text-purple-950 block">{t.calculator.topDressing2[language]}</span>
                  <p className="text-gray-600 mt-0.5">
                    शेष यूरिया ({Math.floor(ureaBags / 3)} बोरी) सिंचाई से ठीक पहले या बाद में खेत में बखेरें।
                  </p>
                </div>
              </div>
            </div>

            {/* Estimated Total Cost */}
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-emerald-800 to-green-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-200 block">{t.calculator.estimatedCost[language]}</span>
                <span className="text-2xl font-black text-amber-300">
                  ₹{nutrientSource === 'dap' ? Math.round(estimatedCostDap) : Math.round(estimatedCostSsp)}
                </span>
              </div>
              <span className="text-xs bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30 font-semibold">
                सब्सिडी युक्त सरकारी दर
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
