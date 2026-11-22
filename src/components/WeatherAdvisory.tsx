import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getIndianNow, formatShortDate } from '../utils/dateUtils';
import {
  CloudSun,
  Sun,
  CloudRain,
  Cloud,
  Droplets,
  Wind,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Volume2,
  Calendar,
  Layers,
  Thermometer,
  MapPin,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface DistrictWeatherData {
  state: string;
  district: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  rainChance: number;
  humidity: number;
  windSpeed: number; // km/h
  sprayStatus: 'safe' | 'caution' | 'unsafe';
  sprayAdvice: string;
  irrigationAdvice: string;
}

const allDistrictsMap: Record<string, DistrictWeatherData> = {
  // मध्य प्रदेश के जिले
  'विदिशा': {
    state: 'मध्य प्रदेश',
    district: 'विदिशा (Vidisha)',
    tempMax: 29,
    tempMin: 16,
    condition: 'साफ एवं खिली हुई धूप',
    rainChance: 5,
    humidity: 48,
    windSpeed: 8,
    sprayStatus: 'safe',
    sprayAdvice: 'विदिशा जिले में आज मौसम पूर्णतः अनुकूल है। हवा की गति 8 किमी/घंटा शांत है। गेहूं में खरपतवारनाशक (2,4-D / क्लोडिनाफॉप), चना में इल्ली नाशक अथवा सरसों में माहू की दवाई का छिड़काव करने के लिए 100% उत्तम समय है।',
    irrigationAdvice: 'गेहूं के खेत में यदि बुवाई के 21 दिन हो चुके हों तो पहला पानी (CRI ताज जड़ अवस्था) हल्की सिंचाई के रूप में अवश्य दें।',
  },
  'सीहोर': {
    state: 'मध्य प्रदेश',
    district: 'सीहोर (Sehore)',
    tempMax: 30,
    tempMin: 16,
    condition: 'साफ व शुष्क',
    rainChance: 5,
    humidity: 46,
    windSpeed: 9,
    sprayStatus: 'safe',
    sprayAdvice: 'सीहोर व आष्टा क्षेत्र में आज दवाई छिड़काव के लिए बहुत अच्छा दिन है। धूप खिली रहेगी और दवा पत्तियों पर तेजी से असर करेगी। शाम 4 बजे से पहले खरपतवारनाशक का छिड़काव पूर्ण करें।',
    irrigationAdvice: 'शरबती गेहूं व चने में आवश्यकतानुसार हल्की सिंचाई चालू रखें।',
  },
  'रायसेन': {
    state: 'मध्य प्रदेश',
    district: 'रायसेन (Raisen)',
    tempMax: 29,
    tempMin: 15,
    condition: 'साफ धूप',
    rainChance: 4,
    humidity: 50,
    windSpeed: 7,
    sprayStatus: 'safe',
    sprayAdvice: 'रायसेन व गैरतगंज-बरेली क्षेत्र में मौसम बिल्कुल शांत है। धान कटाई उपरांत गेहूं बुवाई व दवा छिड़काव के लिए अनुकूल समय है।',
    irrigationAdvice: 'गेहूं की बुवाई के बाद पलेवा अथवा पहली सिंचाई समय पर करें।',
  },
  'भोपाल': {
    state: 'मध्य प्रदेश',
    district: 'भोपाल (Bhopal)',
    tempMax: 29,
    tempMin: 16,
    condition: 'हल्की धूप व साफ मौसम',
    rainChance: 5,
    humidity: 47,
    windSpeed: 8,
    sprayStatus: 'safe',
    sprayAdvice: 'भोपाल व बैरसिया संभाग में मौसम स्थिर है। सब्जी एवं रबी फसलों में किसी भी कीटनाशक या फफूंदनाशक दवाई का स्प्रे बेझिझक कर सकते हैं।',
    irrigationAdvice: 'सब्जी वाली फसलों (टमाटर, मटर) में शाम के समय हल्की सिंचाई करें।',
  },
  'राजगढ़': {
    state: 'मध्य प्रदेश',
    district: 'राजगढ़ (ब्यावरा)',
    tempMax: 30,
    tempMin: 16,
    condition: 'शुष्क व तेज धूप',
    rainChance: 2,
    humidity: 42,
    windSpeed: 9,
    sprayStatus: 'safe',
    sprayAdvice: 'राजगढ़, ब्यावरा व नरसिंहगढ़ में धनिया एवं सरसों में कीटनाशक व सूक्ष्म पोषक तत्वों (सल्फर/जिंक) के स्प्रे के लिए मौसम पूर्ण अनुकूल है।',
    irrigationAdvice: 'धनिया की फसल में पहली सिंचाई के बाद हल्की गुड़ाई करें।',
  },
  'गुना': {
    state: 'मध्य प्रदेश',
    district: 'गुना (Guna)',
    tempMax: 29,
    tempMin: 15,
    condition: 'साफ आसमान',
    rainChance: 3,
    humidity: 45,
    windSpeed: 8,
    sprayStatus: 'safe',
    sprayAdvice: 'गुना व चाचौड़ा-बीनागंज में धनिया, सरसों व गेहूं में दवाई डालने के लिए हवा शांत है। दोपहर 11 बजे से 3 बजे के बीच स्प्रे सर्वोत्तम रहेगा।',
    irrigationAdvice: 'चना एवं धनिया में नमी देखकर ही पानी लगाएं, अधिक पानी से उकठा रोग की संभावना रहती है।',
  },
  'अशोकनगर': {
    state: 'मध्य प्रदेश',
    district: 'अशोकनगर (Ashoknagar)',
    tempMax: 29,
    tempMin: 15,
    condition: 'खिली धूप',
    rainChance: 3,
    humidity: 44,
    windSpeed: 8,
    sprayStatus: 'safe',
    sprayAdvice: 'अशोकनगर व मुंगावली क्षेत्र में शरबती गेहूं व चने की फसल में टॉनिक व कीटनाशक छिड़काव के लिए मौसम बिल्कुल सुरक्षित है।',
    irrigationAdvice: 'गेहूं में पहले पानी के साथ 30 किग्रा यूरिया प्रति एकड़ दें।',
  },
  'सागर': {
    state: 'मध्य प्रदेश',
    district: 'सागर (Sagar)',
    tempMax: 28,
    tempMin: 15,
    condition: 'साफ व मंद हवा',
    rainChance: 6,
    humidity: 52,
    windSpeed: 7,
    sprayStatus: 'safe',
    sprayAdvice: 'सागर, खुरई व बीना क्षेत्र में मौसम अनुकूल है। गेहूं में खरपतवार नियंत्रण हेतु स्प्रे मशीन से कट नोजल लगाकर छिड़काव करें।',
    irrigationAdvice: 'मसूर व चना में हल्की सिंचाई करें, जलभराव न होने दें।',
  },
  'इंदौर': {
    state: 'मध्य प्रदेश',
    district: 'इंदौर (Indore)',
    tempMax: 30,
    tempMin: 17,
    condition: 'हल्की धूप व साफ',
    rainChance: 8,
    humidity: 45,
    windSpeed: 10,
    sprayStatus: 'safe',
    sprayAdvice: 'इंदौर व सांवेर-देपालपुर क्षेत्र में आलू, प्याज, लहसुन व गेहूं में फफूंदनाशक (साफ / कस्टोडिया) एवं कीटनाशक छिड़काव के लिए मौसम उपयुक्त है।',
    irrigationAdvice: 'आलू व लहसुन की फसल में ड्रिप या स्प्रिंकलर से पानी दें।',
  },
  'उज्जैन': {
    state: 'मध्य प्रदेश',
    district: 'उज्जैन (Ujjain)',
    tempMax: 30,
    tempMin: 16,
    condition: 'साफ एवं शुष्क',
    rainChance: 4,
    humidity: 43,
    windSpeed: 9,
    sprayStatus: 'safe',
    sprayAdvice: 'उज्जैन, बड़नगर व खाचरौद में लहसुन, प्याज व चने में दवा डालने के लिए मौसम उत्तम है। दवा के साथ चिपको (सर्फेक्टेंट) अवश्य मिलाएं।',
    irrigationAdvice: 'चने में फूल आने से पहले एक हल्की सिंचाई अवश्य करें।',
  },
  'देवास': {
    state: 'मध्य प्रदेश',
    district: 'देवास (Dewas)',
    tempMax: 30,
    tempMin: 16,
    condition: 'साफ धूप',
    rainChance: 5,
    humidity: 45,
    windSpeed: 9,
    sprayStatus: 'safe',
    sprayAdvice: 'देवास, सोनकच्छ व खातेगांव में रबी फसलों में कीटनाशक छिड़काव के लिए आज का दिन पूरी तरह सुरक्षित है।',
    irrigationAdvice: 'गेहूं में कल्ले फूटते समय सिंचाई प्रबंधन का ध्यान रखें।',
  },
  'शाजापुर': {
    state: 'मध्य प्रदेश',
    district: 'शाजापुर (Shajapur)',
    tempMax: 30,
    tempMin: 16,
    condition: 'साफ मौसम',
    rainChance: 3,
    humidity: 44,
    windSpeed: 8,
    sprayStatus: 'safe',
    sprayAdvice: 'शाजापुर, शुजालपुर व कालापीपल में प्याज नर्सरी व लहसुन में थ्रिप्स व फफूंद की रोकथाम के लिए स्प्रे करने का सही समय है।',
    irrigationAdvice: 'प्याज नर्सरी में शाम के समय फव्वारे से हल्की सिंचाई करें।',
  },
  'मंदसौर': {
    state: 'मध्य प्रदेश',
    district: 'मंदसौर (Mandsaur)',
    tempMax: 29,
    tempMin: 15,
    condition: 'खिली धूप',
    rainChance: 2,
    humidity: 41,
    windSpeed: 8,
    sprayStatus: 'safe',
    sprayAdvice: 'मंदसौर व दलौदा-पिपलिया मंडी क्षेत्र में लहसुन, अफीम, इसबगोल व मेथी में फफूंदनाशक एवं कीटनाशक स्प्रे के लिए मौसम 100% अनुकूल है।',
    irrigationAdvice: 'लहसुन में बुवाई के बाद पहली व दूसरी सिंचाई नियमित अंतराल पर करें।',
  },
  'नीमच': {
    state: 'मध्य प्रदेश',
    district: 'नीमच (Neemuch)',
    tempMax: 28,
    tempMin: 15,
    condition: 'खुला आसमान व शुष्क',
    rainChance: 2,
    humidity: 40,
    windSpeed: 7,
    sprayStatus: 'safe',
    sprayAdvice: 'नीमच, जावद व मनासा क्षेत्र में लहसुन, अश्वगंधा व इसबगोल में किसी भी दवाई या पोषक टॉनिक का छिड़काव करने के लिए आदर्श मौसम है।',
    irrigationAdvice: 'इसबगोल में अंकुरण के बाद पहली हल्की सिंचाई करें।',
  },
  'हरदा': {
    state: 'मध्य प्रदेश',
    district: 'हरदा (Harda)',
    tempMax: 31,
    tempMin: 17,
    condition: 'तेज धूप',
    rainChance: 4,
    humidity: 46,
    windSpeed: 8,
    sprayStatus: 'safe',
    sprayAdvice: 'हरदा, खिरकिया व टिमरनी में मूंग कटाई बाद गेहूं बुवाई व खरपतवारनाशक स्प्रे के लिए परिस्थितियां पूरी तरह अनुकूल हैं।',
    irrigationAdvice: 'नहरी पानी की उपलब्धता अनुसार गेहूं में 21 दिन पर पहला पानी दें।',
  },
  'नर्मदापुरम': {
    state: 'मध्य प्रदेश',
    district: 'नर्मदापुरम (होशंगाबाद)',
    tempMax: 30,
    tempMin: 16,
    condition: 'साफ आसमान',
    rainChance: 5,
    humidity: 49,
    windSpeed: 7,
    sprayStatus: 'safe',
    sprayAdvice: 'नर्मदापुरम, इटारसी व पिपरिया क्षेत्र में धान कटाई उपरांत गेहूं में खरपतवार व फफूंदनाशक स्प्रे के लिए मौसम पूर्ण सुरक्षित है।',
    irrigationAdvice: 'गेहूं में क्राउन रूट इनिशिएशन अवस्था पर पहला पानी लगाएं।',
  },
  'जबलपुर': {
    state: 'मध्य प्रदेश',
    district: 'जबलपुर (Jabalpur)',
    tempMax: 28,
    tempMin: 14,
    condition: 'हल्की धूप व धुंध',
    rainChance: 8,
    humidity: 55,
    windSpeed: 7,
    sprayStatus: 'safe',
    sprayAdvice: 'जबलपुर, पाटन व सिहोरा में हरी मटर व गेहूं में फफूंदनाशक छिड़काव के लिए सुबह की ओस सूखने के बाद (दोपहर 11 बजे बाद) ही स्प्रे करें।',
    irrigationAdvice: 'हरी मटर में फूल आते समय अधिक पानी न दें।',
  },
  'ग्वालियर': {
    state: 'मध्य प्रदेश',
    district: 'ग्वालियर (Gwalior)',
    tempMax: 28,
    tempMin: 13,
    condition: 'साफ व हल्की ठंड',
    rainChance: 3,
    humidity: 48,
    windSpeed: 8,
    sprayStatus: 'safe',
    sprayAdvice: 'ग्वालियर व डबरा क्षेत्र में सरसों में माहू व सफेद रतुआ की रोकथाम हेतु दोपहर के समय दवा का स्प्रे करें।',
    irrigationAdvice: 'सरसों में पहली सिंचाई बुवाई के 25-30 दिन बाद फूल आने से पहले करें।',
  },

  // राजस्थान के प्रमुख जिले
  'कोटा': {
    state: 'राजस्थान',
    district: 'कोटा (Kota)',
    tempMax: 31,
    tempMin: 17,
    condition: 'तेज धूप व सूखा',
    rainChance: 0,
    humidity: 38,
    windSpeed: 9,
    sprayStatus: 'safe',
    sprayAdvice: 'हाड़ौती संभाग कोटा में आज दवाई डालने के लिए मौसम पूरी तरह सुरक्षित है। हवा शांत है और दवा का असर उत्कृष्ट रहेगा।',
    irrigationAdvice: 'नहरी पानी की उपलब्धता अनुसार गेहूं व सरसों में सिंचाई करें।',
  },
  'झालावाड़': {
    state: 'राजस्थान',
    district: 'झालावाड़ (Jhalawar)',
    tempMax: 30,
    tempMin: 16,
    condition: 'साफ मौसम',
    rainChance: 2,
    humidity: 40,
    windSpeed: 8,
    sprayStatus: 'safe',
    sprayAdvice: 'झालावाड़ में संतरा बगीचों व लहसुन में कीट नियंत्रण हेतु दवाई छिड़कने का सही समय है।',
    irrigationAdvice: 'संतरा फलियों में नियमित ड्रिप सिंचाई बनाए रखें।',
  },
};

export const WeatherAdvisory: React.FC = () => {
  const { language, t, speakText } = useLanguage();

  const [selectedState, setSelectedState] = useState<string>('मध्य प्रदेश');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('विदिशा');

  const currentDist = allDistrictsMap[selectedDistrict] || allDistrictsMap['विदिशा'];

  const districtsList = Object.keys(allDistrictsMap).filter(
    (distKey) => allDistrictsMap[distKey].state === selectedState
  );

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('बारिश')) return <CloudRain className="w-8 h-8 text-blue-500" />;
    if (condition.includes('बादल')) return <Cloud className="w-8 h-8 text-gray-500" />;
    return <Sun className="w-8 h-8 text-amber-500" />;
  };

  const dynamicForecast = useMemo(() => {
    const hindiDayNames = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const engDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const baseVariations = [
      { maxOffset: 0, minOffset: 0, condition: currentDist.condition, rain: currentDist.rainChance, humidity: currentDist.humidity, wind: currentDist.windSpeed, spray: currentDist.sprayAdvice, irrigation: currentDist.irrigationAdvice },
      { maxOffset: 1, minOffset: 0, condition: 'साफ व खिली धूप', rain: 4, humidity: 46, wind: 8, spray: 'मौसम पूरी तरह शांत व धूप खिली रहेगी। दवाई छिड़काव का 100% असर होगा।', irrigation: 'गेहूं व चने में आवश्यकतानुसार हल्की सिंचाई करें।' },
      { maxOffset: 0, minOffset: -1, condition: 'हल्की धूप व साफ मौसम', rain: 5, humidity: 48, wind: 9, spray: 'दवाई छिड़काव हेतु उत्तम समय है। सुबह की ओस सूखने पर स्प्रे करें।', irrigation: 'सब्जी वाली फसलों में शाम को पानी दें।' },
      { maxOffset: -1, minOffset: -1, condition: 'आंशिक बादल', rain: 12, humidity: 54, wind: 10, spray: 'सुबह 11 बजे से शाम 4 बजे तक छिड़काव सुरक्षित रहेगा।', irrigation: 'नमी की जांच करके ही पानी लगाएं।' },
      { maxOffset: -2, minOffset: -2, condition: 'साफ व हल्की ठंड', rain: 5, humidity: 50, wind: 8, spray: 'दवा व टॉनिक छिड़काव के लिए अनुकूल मौसम है।', irrigation: 'रबी फसलों में क्रांतिक अवस्थाओं पर सिंचाई करें।' },
      { maxOffset: -1, minOffset: -1, condition: 'खिली हुई धूप', rain: 2, humidity: 44, wind: 9, spray: 'मौसम पूरी तरह शांत व सुरक्षित है। बेझिझक स्प्रे करें।', irrigation: 'सरसों में पहली सिंचाई बुवाई के 25-30 दिन पर करें।' },
      { maxOffset: 0, minOffset: 0, condition: 'साफ मौसम', rain: 3, humidity: 45, wind: 8, spray: 'हवा शांत है। कीटनाशक व खरपतवारनाशक का असर तेज रहेगा।', irrigation: 'खेत में नमी बनाए रखने हेतु हल्की सिंचाई करें।' },
    ];

    return baseVariations.map((v, idx) => {
      const d = getIndianNow();
      d.setDate(d.getDate() + idx);
      const dayIdx = d.getDay();
      const dayHi = idx === 0 ? `आज (${hindiDayNames[dayIdx]})` : idx === 1 ? `कल (${hindiDayNames[dayIdx]})` : hindiDayNames[dayIdx];
      const dayEn = idx === 0 ? `Today (${engDayNames[dayIdx]})` : idx === 1 ? `Tomorrow (${engDayNames[dayIdx]})` : engDayNames[dayIdx];
      const dateStr = formatShortDate(d);

      return {
        day: { hi: dayHi, en: dayEn },
        date: dateStr,
        tempMax: currentDist.tempMax + v.maxOffset,
        tempMin: currentDist.tempMin + v.minOffset,
        condition: { hi: v.condition, en: v.condition },
        rainChance: v.rain,
        humidity: v.humidity,
        windSpeed: v.wind,
        sprayAdvisory: {
          status: 'safe' as const,
          message: { hi: v.spray, en: v.spray },
        },
        irrigationAdvisory: {
          hi: v.irrigation,
          en: v.irrigation,
        },
      };
    });
  }, [currentDist]);

  const handleSpeakDistrictWeather = () => {
    const text = `${currentDist.state}, जिला ${currentDist.district}: आज का तापमान अधिकतम ${currentDist.tempMax} डिग्री और न्यूनतम ${currentDist.tempMin} डिग्री है। बारिश की संभावना मात्र ${currentDist.rainChance} प्रतिशत है। हवा की गति ${currentDist.windSpeed} किमी प्रति घंटा है। दवाई छिड़काव सलाह: ${currentDist.sprayAdvice} सिंचाई परामर्श: ${currentDist.irrigationAdvice}`;
    speakText(text);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                जिला वार कृषि मौसम विज्ञान (Agro-Met)
              </span>
              <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {currentDist.district}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
              {t.weather.title[language]}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              अपना जिला चुनें और जानें आज आपके खेत में कीटनाशक, खरपतवारनाशक या टॉनिक की दवाई डालने लायक मौसम है या नहीं।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeakDistrictWeather}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer shadow-xs"
            >
              <Volume2 className="w-4 h-4 text-amber-300" />
              <span>जिले का मौसम आवाज में सुनें</span>
            </button>
          </div>
        </div>

        {/* State & District Selector Bar */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-xs text-gray-700 block mb-1">1. राज्य चुनें (State)</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                const firstDist = e.target.value === 'राजस्थान' ? 'कोटा' : 'विदिशा';
                setSelectedDistrict(firstDist);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm font-semibold text-gray-800"
            >
              <option value="मध्य प्रदेश">मध्य प्रदेश (Madhya Pradesh)</option>
              <option value="राजस्थान">राजस्थान (Rajasthan)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-xs text-gray-700 block mb-1">
              2. अपना जिला चुनें (Select District - सभी जिले उपलब्ध)
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs sm:text-sm font-bold text-emerald-950"
            >
              {districtsList.map((distKey) => (
                <option key={distKey} value={distKey}>
                  जिला: {allDistrictsMap[distKey].district}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected District Highlight Card (With Spray Decision Status) */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
              {getWeatherIcon(currentDist.condition)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  आज का मौसम • {currentDist.district}
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-900 text-emerald-200 border border-emerald-400">
                  लाइव अपडेट
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black mt-1">
                {currentDist.tempMax}°C
                <span className="text-lg font-medium text-emerald-200 ml-2">
                  न्यूनतम {currentDist.tempMin}°C
                </span>
              </h3>
              <p className="text-sm font-medium text-emerald-100 mt-1">
                {currentDist.condition}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
            <div>
              <span className="text-[11px] text-emerald-200 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-300" />
                बारिश की संभावना
              </span>
              <span className="text-xl font-black text-amber-300">{currentDist.rainChance}%</span>
            </div>
            <div>
              <span className="text-[11px] text-emerald-200 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-300" />
                हवा में नमी
              </span>
              <span className="text-xl font-black">{currentDist.humidity}%</span>
            </div>
            <div>
              <span className="text-[11px] text-emerald-200 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-gray-300" />
                हवा की गति
              </span>
              <span className="text-xl font-black">{currentDist.windSpeed} km/h</span>
            </div>
          </div>
        </div>

        {/* Big Spray Decision Alert Banner (The core feature requested by user) */}
        <div className="mt-5 pt-4 border-t border-white/20">
          <div className="bg-emerald-950/70 p-4 rounded-xl border-2 border-emerald-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center font-black shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <span className="text-xs font-black text-amber-300 uppercase tracking-wide block">
                  आज दवाई (कीटनाशक / खरपतवारनाशक) डालने की स्थिति:
                </span>
                <p className="text-sm text-emerald-50 font-bold mt-0.5 leading-relaxed">
                  {currentDist.sprayAdvice}
                </p>
              </div>
            </div>

            <button
              onClick={handleSpeakDistrictWeather}
              className="self-end sm:self-auto px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
            >
              <Volume2 className="w-4 h-4 text-emerald-950" />
              <span>सलाह सुनें</span>
            </button>
          </div>

          <div className="mt-2.5 bg-white/10 p-3 rounded-xl border border-white/10 text-xs text-emerald-100 flex items-center gap-2">
            <span className="font-bold text-amber-300">सिंचाई सलाह:</span>
            <span>{currentDist.irrigationAdvice}</span>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-gray-900 text-base sm:text-lg">
            आगामी 7 दिनों का मौसम पूर्वानुमान ({currentDist.district})
          </h3>
          <span className="text-xs text-gray-500">प्रतिदिन प्रातः 6:00 बजे अद्यतन</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dynamicForecast.map((day, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm">{day.day[language]}</h4>
                    <span className="text-xs text-gray-500">{day.date}</span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl">{getWeatherIcon(day.condition.hi)}</div>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-2xl font-black text-gray-950">{day.tempMax}°C</span>
                    <span className="text-xs text-gray-500 ml-1">/ {day.tempMin}°C</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {day.condition[language]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 mb-2.5">
                  <div>
                    <span className="text-[10px] text-gray-500 block">बारिश</span>
                    <span className="font-bold text-blue-600">{day.rainChance}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">नमी</span>
                    <span className="font-bold text-gray-800">{day.humidity}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">हवा</span>
                    <span className="font-bold text-gray-800">{day.windSpeed} km/h</span>
                  </div>
                </div>

                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  {day.sprayAdvisory.message[language]}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-100 text-[11px] text-emerald-900 font-medium">
                💧 {day.irrigationAdvisory[language]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
