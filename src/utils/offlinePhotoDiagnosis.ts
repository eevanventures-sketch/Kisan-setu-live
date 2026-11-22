import { DiseaseInfo } from '../types';
import { getAgronomicAnswer } from './agronomyEngine';

export interface OfflineCropOption {
  id: string;
  labelHi: string;
  labelEn: string;
  keyword: string;
}

export interface OfflineSymptomOption {
  id: string;
  labelHi: string;
  labelEn: string;
  keyword: string;
  severity: 'low' | 'medium' | 'high';
}

export const OFFLINE_CROP_OPTIONS: OfflineCropOption[] = [
  { id: 'soybean', labelHi: 'सोयाबीन', labelEn: 'Soybean', keyword: 'सोयाबीन' },
  { id: 'wheat', labelHi: 'गेहूं', labelEn: 'Wheat', keyword: 'गेहूं' },
  { id: 'mustard', labelHi: 'सरसों', labelEn: 'Mustard', keyword: 'सरसों' },
  { id: 'chana', labelHi: 'चना', labelEn: 'Chana', keyword: 'चना' },
  { id: 'masoor', labelHi: 'मसूर', labelEn: 'Masoor', keyword: 'मसूर' },
  { id: 'paddy', labelHi: 'धान', labelEn: 'Paddy', keyword: 'धान' },
  { id: 'maize', labelHi: 'मक्का', labelEn: 'Maize', keyword: 'मक्का' },
  { id: 'cotton', labelHi: 'कपास', labelEn: 'Cotton', keyword: 'कपास' },
  { id: 'tomato', labelHi: 'टमाटर', labelEn: 'Tomato', keyword: 'टमाटर' },
  { id: 'potato', labelHi: 'आलू', labelEn: 'Potato', keyword: 'आलू' },
  { id: 'garlic', labelHi: 'लहसुन', labelEn: 'Garlic', keyword: 'लहसुन' },
  { id: 'moong', labelHi: 'मूंग/उड़द', labelEn: 'Moong/Urad', keyword: 'मूंग' },
];

export const OFFLINE_SYMPTOM_OPTIONS: OfflineSymptomOption[] = [
  {
    id: 'caterpillar',
    labelHi: '🐛 पत्ती पर इल्ली / सुंडी या छेद',
    labelEn: '🐛 Caterpillar / Holes on Leaf',
    keyword: 'इल्ली सुंडी छेदक कीट',
    severity: 'high',
  },
  {
    id: 'spots_blight',
    labelHi: '🟡 पीले-भूरे धब्बे / रतुआ / झुलसा',
    labelEn: '🟡 Rust / Leaf Spots / Blight',
    keyword: 'रतुआ झुलसा धब्बे फफूंद',
    severity: 'high',
  },
  {
    id: 'sucking_pest',
    labelHi: '🐜 माहू / चेपा / थ्रिप्स / सफेद मक्खी',
    labelEn: '🐜 Aphids / Thrips / Whitefly',
    keyword: 'माहू चेपा थ्रिप्स सफेद मक्खी रस चूसक',
    severity: 'medium',
  },
  {
    id: 'yellow_wilt',
    labelHi: '🍂 पीलापन / उकठा / जड़ गलन',
    labelEn: '🍂 Yellowing / Wilt / Root Rot',
    keyword: 'उकठा पीलापन जड़ गलन सड़न',
    severity: 'medium',
  },
  {
    id: 'weeds',
    labelHi: '🌿 खरपतवार / अनावश्यक घास',
    labelEn: '🌿 Weeds / Broadleaf & Grassy',
    keyword: 'खरपतवार हरबसाइड घास',
    severity: 'medium',
  },
];

function stripMarkdown(line: string): string {
  return line.replace(/\*\*/g, '').replace(/^[•\-*\d.)\s]+/, '').trim();
}

const SYMPTOM_FALLBACKS: Record<
  string,
  {
    symptomsHi: string[];
    symptomsEn: string[];
    chemicalsHi: string[];
    chemicalsEn: string[];
    organicHi: string[];
    organicEn: string[];
    precautionsHi: string[];
    precautionsEn: string[];
    products: string[];
  }
> = {
  caterpillar: {
    symptomsHi: [
      'पत्तियों में छोटे-बड़े गोल छेद दिखना, पत्तियों का किनारों से कटा होना या पोंगी/फली में सुंडी का प्रकोप।',
      'पत्ती के नीचे छोटे हरे या भूरे रंग की इल्ली (सेमीलूपर / स्पोडोप्टेरा / फली छेदक) व बीट दिखना।',
    ],
    symptomsEn: [
      'Irregular holes or chewed leaf margins, damaged growing shoots/whorls, and frass under leaves.',
      'Presence of green/brown caterpillars (Semilooper, Spodoptera, Pod Borer or Armyworm).',
    ],
    chemicalsHi: [
      'क्लोरेंट्रानिलिप्रोल 18.5% SC (कोराजन / Coragen): 60 मिली प्रति एकड़ (6 मिली प्रति 15 लीटर पंप) — पत्ती व फली की इल्ली पर लंबा असर।',
      'एमामेक्टिन बेंजोएट 5% SG (प्रोक्लेम / Proclaim): 80–100 ग्राम प्रति एकड़ (8–10 ग्राम प्रति 15 लीटर पंप) 150–200 लीटर पानी में।',
      'यदि इल्ली के साथ तना मक्खी/रस चूसक भी हो तो: एम्प्लीगो (Ampligo) @ 80 मिली प्रति एकड़ (8 मिली प्रति 15L पंप) का छिड़काव करें।',
    ],
    chemicalsEn: [
      'Chlorantraniliprole 18.5% SC (Coragen): 60 ml/acre (6 ml per 15L pump) in 150–200L water.',
      'Emamectin Benzoate 5% SG (Proclaim): 80–100 g/acre (8–10 g per 15L pump) for rapid knockdown.',
      'For mixed caterpillar + stem/sucking pests: Ampligo @ 80 ml/acre (8 ml per 15L pump).',
    ],
    organicHi: [
      'प्रति एकड़ 15–20 "T" आकार की पक्षी बैठने की खूंटियां (T-Perches) व 4–5 फेरोमोन ट्रैप लगाएं।',
      'शुरुआती छोटी इल्ली पर नीम तेल 10,000 PPM (3–4 मिली/लीटर) या बी.टी. (Bacillus thuringiensis) @ 2 ग्राम/लीटर छिड़कें।',
    ],
    organicEn: [
      'Install 15–20 T-shaped bird perches and 4–5 pheromone traps per acre.',
      'For young larvae, spray Neem Oil 10,000 PPM (3–4 ml/L) or Bacillus thuringiensis (Bt) @ 2 g/L.',
    ],
    precautionsHi: [
      'स्प्रे हमेशा शाम 4 बजे के बाद या सुबह ठंडे मौसम में करें; घोल में सिलिकॉन स्टीकर (5 मिली/पंप) अवश्य मिलाएं।',
      'एक ही दवा लगातार दो बार न छिड़कें; 12–15 दिन बाद प्रकोप बचने पर ग्रुप बदलकर दवा डालें।',
    ],
    precautionsEn: [
      'Spray after 4 PM or early morning; always add silicon sticker (5 ml/pump) for uniform leaf coverage.',
      'Rotate insecticide groups if a repeat spray is needed after 12–15 days.',
    ],
    products: ['Coragen (Syngenta)', 'Proclaim (Syngenta)', 'Ampligo', 'Fame', 'Neem Oil 10,000 PPM'],
  },
  spots_blight: {
    symptomsHi: [
      'पत्तियों पर पीले, भूरे या काले गोल धब्बे, धारियां, किनारों से झुलसना या उंगली पर पीला/काला चूर्ण लगना।',
      'नमी, कोहरे या बारिश के बाद रोग का नीचे की पत्तियों से ऊपर तेजी से फैलना।',
    ],
    symptomsEn: [
      'Yellow, brown or dark necrotic leaf spots, rust pustules/powder, or scorching from leaf tips.',
      'Rapid upward spread after dew, fog, clouds, or rain.',
    ],
    chemicalsHi: [
      'प्रोपिकोनाज़ोल 25% EC (टिल्ट / Tilt) या टेबुकोनाज़ोल 25.9% EC (फोलिकुर): 200 मिली प्रति एकड़ (20 मिली प्रति 15 लीटर पंप) — रतुआ व धब्बों पर श्रेष्ठ।',
      'एज़ोक्सीस्ट्रोबिन + डिफेनोकोनाज़ोल (एमिस्टार टॉप / Amistar Top): 200 मिली प्रति एकड़ (20 मिली/15L पंप) — झुलसा, एन्थ्रेकनोज़ व धब्बों में दोहरा असर।',
      'शुरुआती बचाव या कोहरे में: मैंकोज़ेब 75% WP (Dithane M-45) @ 600 ग्राम/एकड़ (40 ग्राम/पंप) या साफ (Saaf) @ 400 ग्राम/एकड़।',
    ],
    chemicalsEn: [
      'Propiconazole 25% EC (Tilt) or Tebuconazole 25.9% EC (Folicur): 200 ml/acre (20 ml per 15L pump).',
      'Azoxystrobin + Difenoconazole (Amistar Top): 200 ml/acre (20 ml per 15L pump) for severe spots/blight.',
      'Preventive/fog protection: Mancozeb 75% WP (Dithane M-45) @ 600 g/acre or Saaf @ 400 g/acre.',
    ],
    organicHi: [
      'प्रारंभिक धब्बों पर सल्फर 80% WDG (2.5 ग्राम/लीटर) या नीम अर्क के साथ ट्राइकोडर्मा फोलियर स्प्रे करें।',
    ],
    organicEn: [
      'At early onset, spray Wettable Sulphur 80% WDG (2.5 g/L) or preventive Trichoderma foliar spray.',
    ],
    precautionsHi: [
      'फफूंद रोग दिखते ही यूरिया (नाइट्रोजन) का प्रयोग तुरंत रोक दें, इससे रोग बढ़ता है।',
      'स्प्रे में 5 मिली/पंप सिलिकॉन स्टीकर व 150–200 लीटर पानी प्रति एकड़ उपयोग करें।',
    ],
    precautionsEn: [
      'Stop Urea/nitrogen top-dressing immediately when fungal spots appear.',
      'Use 150–200 L water/acre with silicon sticker (5 ml/pump).',
    ],
    products: ['Tilt (Propiconazole)', 'Amistar Top', 'Folicur', 'Dithane M-45', 'Ridomil Gold'],
  },
  sucking_pest: {
    symptomsHi: [
      'नई कोंपलों व पत्तियों की निचली सतह पर माहू/चेपा, सफेद मक्खी या थ्रिप्स के छोटे कीट चिपके दिखना।',
      'पत्तियां ऊपर या नीचे की ओर मुड़ना (कुकड़ा/जलेबी लक्षण), चिपचिपा द्रव या पीला मोजेक वायरस फैलना।',
    ],
    symptomsEn: [
      'Colonies of aphids, whiteflies, or thrips on tender shoots and leaf undersides.',
      'Leaf curling/cupping, honeydew stickiness, or yellowing viral streaks.',
    ],
    chemicalsHi: [
      'थायमेथोक्सम 25% WG (एक्टारा / Actara): 80–100 ग्राम प्रति एकड़ (8–10 ग्राम प्रति 15 लीटर पंप)।',
      'इमिडाक्लोप्रिड 17.8% SL (कॉन्फिडोर / Confidor): 60–80 मिली प्रति एकड़ (6–8 मिली प्रति 15L पंप)।',
      'जिद्दी थ्रिप्स / सफेद मक्खी में: फिप्रोनिल 5% SC (रीजेंट) @ 350 मिली/एकड़ या फ्लोनिकामिड 50% WG (उलाला) @ 60 ग्राम/एकड़।',
    ],
    chemicalsEn: [
      'Thiamethoxam 25% WG (Actara): 80–100 g/acre (8–10 g per 15L pump).',
      'Imidacloprid 17.8% SL (Confidor): 60–80 ml/acre (6–8 ml per 15L pump).',
      'Severe thrips/whitefly: Fipronil 5% SC @ 350 ml/acre or Flonicamid 50% WG (Ulala) @ 60 g/acre.',
    ],
    organicHi: [
      'प्रति एकड़ 15–20 पीले (सफेद मक्खी/माहू) व नीले (थ्रिप्स) चिपचिपे कार्ड (Sticky Traps) लगाएं।',
      'नीम तेल 10,000 PPM (45 मिली प्रति 15L पंप) का पत्तियों की निचली सतह पर स्प्रे करें।',
    ],
    organicEn: [
      'Install 15–20 Yellow & Blue Sticky Traps per acre.',
      'Spray Neem Oil 10,000 PPM (45 ml per 15L pump) targeting leaf undersides.',
    ],
    precautionsHi: [
      'फूल अवस्था पर कीटनाशक छिड़काव केवल शाम 4:00 बजे के बाद करें ताकि मधुमक्खियों को नुकसान न हो।',
    ],
    precautionsEn: [
      'During flowering, spray strictly after 4:00 PM to protect pollinating honeybees.',
    ],
    products: ['Actara', 'Confidor', 'Ulala (Flonicamid)', 'Regent (Fipronil)', 'Yellow Sticky Trap'],
  },
  yellow_wilt: {
    symptomsHi: [
      'पौधों का हरा होते हुए अचानक ऊपर से मुरझा कर सूखना (उकठा) या जमीन के पास तने में गलन/काली धारी दिखना।',
      'अथवा पोषण कमी व जलभराव से पूरी फसल की पत्तियां पीली पड़ना।',
    ],
    symptomsEn: [
      'Sudden drooping/wilting of green plants, basal collar rot, or dark streaks inside split stems.',
      'Or uniform leaf yellowing due to Nitrogen/Zinc deficiency or waterlogging.',
    ],
    chemicalsHi: [
      'जड़ गलन / उकठा (Wilt) में ड्रेंचिंग: कार्बेन्डाजिम 12% + मैंकोज़ेब 63% (साफ) @ 2.5 ग्राम/लीटर (500 ग्राम/एकड़) या रोको (Thiophanate Methyl) @ 2 ग्राम/लीटर जड़ों के पास दें।',
      'पीलापन पोषण कमी होने पर: NPK 19:19:19 @ 75 ग्राम + चिलेटेड जिंक 12% EDTA @ 15 ग्राम प्रति 15L पंप का छिड़काव करें।',
    ],
    chemicalsEn: [
      'For Root Rot / Wilt: Drench root zones with Saaf (Carbendazim + Mancozeb @ 2.5 g/L) or Roko (Thiophanate Methyl @ 2 g/L).',
      'For nutritional yellowing: Foliar spray NPK 19:19:19 (75 g) + Chelated Zinc 12% (15 g) per 15L pump.',
    ],
    organicHi: [
      '2 किग्रा ट्राइकोडर्मा विरिडी को 100 किग्रा सड़ी गोबर खाद में मिलाकर सिंचाई से पहले जड़ों के पास डालें।',
      'अतिरिक्त पानी निकासी की व्यवस्था करें व कच्ची गोबर खाद न डालें।',
    ],
    organicEn: [
      'Apply 2 kg Trichoderma viride enriched in 100 kg well-rotted FYM before irrigation.',
      'Ensure proper field drainage and avoid waterlogging.',
    ],
    precautionsHi: [
      'सूखे हुए उकठा पौधों को उखाड़कर खेत से बाहर नष्ट करें; मिट्टी में उचित नमी बनाकर ही जड़ों में दवा चलाएं।',
    ],
    precautionsEn: [
      'Uproot and destroy severely wilted plants away from the field; drench soil when lightly moist.',
    ],
    products: ['Saaf (UPL)', 'Roko (Thiophanate Methyl)', 'Trichoderma Viride', 'Chelated Zinc 12%', 'NPK 19:19:19'],
  },
  weeds: {
    symptomsHi: [
      'फसल के बीच चौड़ी पत्ती (बथुआ, बोकना, दूधी) या संकरी पत्ती घास (गुल्ली डंडा, सावां, मोथा) उग आना।',
    ],
    symptomsEn: [
      'Broadleaf or grassy weeds competing with young crop plants for nutrients and sunlight.',
    ],
    chemicalsHi: [
      'फसल के अनुसार चुनिंदा खरपतवारनाशी ही डालें (जैसे सोयाबीन में पर्स्यूट 400 मिली/एकड़; गेहूं में टोटल 16 ग्राम या टॉपिक 160 ग्राम/एकड़; चना/सरसों में संकरी घास हेतु टार्गा सुपर 350 मिली/एकड़)।',
    ],
    chemicalsEn: [
      'Apply strictly crop-selective herbicides (e.g., Soybean: Pursuit 400 ml/acre; Wheat: Total 16 g/acre or Topik 160 g/acre; Chana/Mustard grassy weeds: Targa Super 350 ml/acre).',
    ],
    organicHi: [
      '20–25 दिन की अवस्था में हाथ से निराई-गुड़ाई (डोरा/कुलपा चलाना) सबसे सुरक्षित व जड़ को हवा देने वाला उपाय है।',
    ],
    organicEn: [
      'Manual weeding or inter-cultivation at 20–25 DAS aerates roots and avoids herbicide stress.',
    ],
    precautionsHi: [
      'हमेशा फ्लैट-फैन (कट) नोजल व पर्याप्त नमी में 150–200 लीटर पानी/एकड़ से ही हरबसाइड डालें। दलहन/सरसों में कभी 2,4-D न डालें।',
    ],
    precautionsEn: [
      'Always use a Flat-Fan nozzle on moist soil with 150–200L water/acre. Never apply 2,4-D in pulses/mustard.',
    ],
    products: ['Pursuit / Imazethapyr', 'Targa Super', 'Topik', 'Axial', 'Stomp'],
  },
};

const SYMPTOM_LINE_FILTER: Record<string, RegExp> = {
  caterpillar: /इल्ली|सुंडी|छेदक|आर्मीवॉर्म|कोराजन|एम्प्लीगो|एमामेक्टिन|प्रोक्लेम|स्पाइनोटोरम|डेलीगेट|फेरोमोन|borer|caterpillar|coragen|emamectin|ampligo|spinetoram/i,
  spots_blight: /रतुआ|धब्ब|झुलसा|आसिता|फफूंद|कंडुआ|टिल्ट|प्रोपिकोनाज़ोल|फोलिकुर|टेबुकोनाज़ोल|एमिस्टार|एज़ोक्सीस्ट्रोबिन|मैंकोज़ेब|रिडोमिल|ब्लास्ट|rust|blight|spot|tilt|folicur|amistar|mancozeb|ridomil/i,
  sucking_pest: /माहू|चेपा|थ्रिप्स|सफेद मक्खी|मोजेक|मरोड़िया|कुकड़ा|इमिडा|थायमेथोक्सम|कॉन्फिडोर|एक्टारा|फिप्रोनिल|उलाला|सोलोमन|aphid|thrips|whitefly|imidacloprid|thiamethoxam|fipronil|actara|confidor/i,
  yellow_wilt: /उकठा|गलन|सड़न|पीलापन|दीमक|साफ|रोको|ट्राइकोडर्मा|जिंक|यूरिया|wilt|rot|yellow|saaf|roko|trichoderma|zinc/i,
  weeds: /खरपतवार|हरबसाइड|घास|बथुआ|गुल्ली|मंडूसी|टॉपिक|एक्सियल|टोटल|पर्स्यूट|इमाज़ेथापायर|टार्गा|पेंडीमेथालिन|स्टॉम्प|बिसपायरीबैक|नॉमिनी|एट्राज़ीन|herbicide|weed|pursuit|targa|topik|axial|stomp/i,
};

export function buildDiseaseReportFromOfflineEngine(
  cropId: string,
  symptomId: string,
  mediaUrl: string,
  language: 'hi' | 'en'
): DiseaseInfo {
  const crop = OFFLINE_CROP_OPTIONS.find((c) => c.id === cropId) || OFFLINE_CROP_OPTIONS[0];
  const symptom =
    OFFLINE_SYMPTOM_OPTIONS.find((s) => s.id === symptomId) || OFFLINE_SYMPTOM_OPTIONS[0];
  const fallback = SYMPTOM_FALLBACKS[symptom.id] || SYMPTOM_FALLBACKS.caterpillar;

  const query = `${crop.keyword} में ${symptom.keyword}`;
  const engineRes = getAgronomicAnswer(query, language);

  const lines = engineRes.reply
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^ℹ️|^📚/.test(l))
    .map(stripMarkdown)
    .filter((l) => l.length > 6);

  const symRegex = SYMPTOM_LINE_FILTER[symptom.id];
  const doseRegex =
    /मिली|ग्राम|किग्रा|लीटर|ml|gm|kg|पंप|टंकी|एकड़|acre|@|कोराजन|प्रोक्लेम|एम्प्लीगो|टिल्ट|फोलिकुर|एमिस्टार|इमिडा|थायमेथोक्सम|फिप्रोनिल|उलाला|साफ|रोको|मैंकोज़ेब|रिडोमिल|पर्स्यूट|टार्गा|टॉपिक|एक्सियल|स्टॉम्प|नॉमिनी/i;

  // Prefer crop-specific lines from agronomyEngine that actually match the selected symptom!
  const matchedCropLines = lines.filter((l) => symRegex.test(l) && doseRegex.test(l));

  const finalChemicalsHi =
    matchedCropLines.length > 0 && language === 'hi'
      ? Array.from(new Set([...matchedCropLines, ...fallback.chemicalsHi])).slice(0, 4)
      : fallback.chemicalsHi;

  const finalChemicalsEn =
    matchedCropLines.length > 0 && language === 'en'
      ? Array.from(new Set([...matchedCropLines, ...fallback.chemicalsEn])).slice(0, 4)
      : fallback.chemicalsEn;

  const productMatches = Array.from(
    new Set(
      (
        [...matchedCropLines, ...fallback.chemicalsHi].join(' ').match(
          /\b(Coragen|Proclaim|Ampligo|Tilt|Folicur|Amistar Top|Ridomil Gold|Dithane M-45|Confidor|Actara|Saaf|Roko|Nativo|Emamectin|Chlorantraniliprole|Propiconazole|Imidacloprid|Thiamethoxam|Mancozeb|Fipronil|Topik|Axial|Pursuit|Targa Super|Stomp|Nominee Gold)\b/gi
        ) || []
      ).map((p) => p)
    )
  ).slice(0, 5);

  return {
    id: `offline-${crop.id}-${symptom.id}-${Date.now()}`,
    name: {
      hi: `${crop.labelHi}: ${symptom.labelHi.replace(/^[^\w\u0900-\u097F]+/, '').trim()}`,
      en: `${crop.labelEn}: ${symptom.labelEn.replace(/^[^\w]+/, '').trim()}`,
    },
    crop: { hi: crop.labelHi, en: crop.labelEn },
    cropCategory: 'offline_matched',
    severity: symptom.severity,
    imageUrl: mediaUrl,
    causes: {
      hi: `${crop.labelHi} की फसल में ${symptom.labelHi.replace(/^[^\w\u0900-\u097F]+/, '').trim()} के लिए ${engineRes.expertName} द्वारा प्रमाणित उपचार रिपोर्ट`,
      en: `Verified ${crop.labelEn} agronomy treatment card (${engineRes.expertName})`,
    },
    symptoms: {
      hi: fallback.symptomsHi,
      en: fallback.symptomsEn,
    },
    organicRemedy: {
      hi: fallback.organicHi,
      en: fallback.organicEn,
    },
    chemicalTreatment: {
      hi: finalChemicalsHi,
      en: finalChemicalsEn,
    },
    preventiveMeasures: {
      hi: fallback.precautionsHi,
      en: fallback.precautionsEn,
    },
    recommendedProducts: productMatches.length > 0 ? productMatches : fallback.products,
  };
}
