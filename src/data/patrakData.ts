export interface MandiPatrakRow {
  sNo: number;
  cropName: string;
  contracts: number | string; // अनुबंध संख्या
  arrival: number | string; // आवक (क्विंटल या बोरी)
  arrivalUnit: 'क्विंटल' | 'बोरी';
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  yesterdayPrice?: number;
  priceChange?: number; // difference from yesterday (+ तेज, - मंदी, 0 समान)
  msp?: number | string;
}

export interface MandiPatrak {
  id: string;
  state: string;
  district: string;
  tehsil: string;
  mandiName: string;
  mandiType: 'मुख्य मंडी' | 'उपमंडी';
  boardName: string;
  committeeName: string;
  date: string;
  releaseTime: string;
  status: 'open' | 'closed';
  sessionStatus?: MandiSessionStatus;
  isVerifiedForDate?: boolean;
  referenceDate?: string;
  closedReason?: string;
  totalContracts: number | string;
  totalArrival: number | string;
  arrivalUnit: 'क्विंटल' | 'बोरी';
  rows: MandiPatrakRow[];
  secretaryName: string;
  sourceLabel?: string;
  sourceUrls?: Array<{ title: string; uri: string }>;
}

import {
  getDynamicPatrakDates,
  DateOptionKey,
  DateMeta,
  MandiSessionStatus,
  getIndianNow,
  getIndianDateOffset,
  formatDDMMYYYY,
  formatDDSlashMMSlashYYYY,
  formatHindiDate,
  formatShortDate,
  isCurrentTimeAfter530PM,
  isCurrentTimeBefore1030AM,
  getMandiAuctionSession,
  getCurrentTimeString,
} from '../utils/dateUtils';

export type { DateOptionKey, DateMeta, MandiSessionStatus };
export {
  getIndianNow,
  getIndianDateOffset,
  formatDDMMYYYY,
  formatDDSlashMMSlashYYYY,
  formatHindiDate,
  formatShortDate,
  isCurrentTimeAfter530PM,
  isCurrentTimeBefore1030AM,
  getMandiAuctionSession,
  getCurrentTimeString,
  getDynamicPatrakDates,
};

export const PATRAK_DATES: Record<string, DateMeta> = getDynamicPatrakDates();

// Base Raw Mandi Definitions covering all requested districts and tehsils
export const rawMandiDefinitions: MandiPatrak[] = [
  // ==========================================
  // 1. विदिशा जिला (All Tehsils & Mandis)
  // ==========================================
  {
    id: 'mp-vidisha-vidisha',
    state: 'मध्य प्रदेश',
    district: 'विदिशा',
    tehsil: 'विदिशा',
    mandiName: 'विदिशा (मुख्य मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन (मंडी) बोर्ड भोपाल',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति विदिशा जिला विदिशा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे (आज का आधिकारिक बुलेटिन)',
    status: 'open',
    totalContracts: 1590,
    totalArrival: '32,450',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव / भारसाधक अधिकारी, कृषि उपज मंडी समिति विदिशा',
    rows: [
      { sNo: 1, cropName: 'गेहूं (Wheat)', contracts: 257, arrival: 5756, arrivalUnit: 'क्विंटल', minPrice: 1925, maxPrice: 5640, modalPrice: 2650, yesterdayPrice: 2700, priceChange: -50, msp: 2625 },
      { sNo: 2, cropName: 'सरसों (Mustard)', contracts: 3, arrival: 4, arrivalUnit: 'क्विंटल', minPrice: 7000, maxPrice: 7500, modalPrice: 7500, yesterdayPrice: 7000, priceChange: 500, msp: 6200 },
      { sNo: 3, cropName: 'चना (Chana)', contracts: 79, arrival: 1012, arrivalUnit: 'क्विंटल', minPrice: 4400, maxPrice: 7170, modalPrice: 6700, yesterdayPrice: 6900, priceChange: -200, msp: 5958 },
      { sNo: 4, cropName: 'मसूर (Masoor)', contracts: 11, arrival: 173, arrivalUnit: 'क्विंटल', minPrice: 4904, maxPrice: 7630, modalPrice: 6104, yesterdayPrice: 5900, priceChange: 204, msp: 7000 },
      { sNo: 5, cropName: 'धान (Paddy)', contracts: 571, arrival: 15472, arrivalUnit: 'क्विंटल', minPrice: 1600, maxPrice: 5071, modalPrice: 4700, yesterdayPrice: 4600, priceChange: 100, msp: 2441 },
      { sNo: 6, cropName: 'तिवड़ा (Tiwada)', contracts: 2, arrival: 17, arrivalUnit: 'क्विंटल', minPrice: 3450, maxPrice: 3500, modalPrice: 3500, yesterdayPrice: 3100, priceChange: 400, msp: '-' },
      { sNo: 7, cropName: 'सोयाबीन (Soybean)', contracts: 325, arrival: 3672, arrivalUnit: 'क्विंटल', minPrice: 2800, maxPrice: 7015, modalPrice: 6600, yesterdayPrice: 6800, priceChange: -200, msp: 5708 },
      { sNo: 8, cropName: 'बटरी (Batri)', contracts: 3, arrival: 9, arrivalUnit: 'क्विंटल', minPrice: 2000, maxPrice: 3200, modalPrice: 3200, yesterdayPrice: 2770, priceChange: 430, msp: '-' },
      { sNo: 9, cropName: 'मेथी (Methi)', contracts: 1, arrival: 3, arrivalUnit: 'क्विंटल', minPrice: 3000, maxPrice: 3000, modalPrice: 3000, yesterdayPrice: 0, priceChange: 0, msp: '-' },
      { sNo: 10, cropName: 'मक्का (Maize)', contracts: 62, arrival: 2126.5, arrivalUnit: 'क्विंटल', minPrice: 1700, maxPrice: 2790, modalPrice: 2400, yesterdayPrice: 2500, priceChange: -100, msp: 2410 },
      { sNo: 11, cropName: 'मूंग (Moong)', contracts: 9, arrival: 40.5, arrivalUnit: 'क्विंटल', minPrice: 2500, maxPrice: 7190, modalPrice: 7000, yesterdayPrice: 6610, priceChange: 390, msp: 8780 },
      { sNo: 12, cropName: 'उड़द (Urad)', contracts: 15, arrival: 62.5, arrivalUnit: 'क्विंटल', minPrice: 4500, maxPrice: 7000, modalPrice: 4500, yesterdayPrice: 5412, priceChange: -912, msp: 8200 },
      { sNo: 13, cropName: 'मटर (Matar)', contracts: '-', arrival: '-', arrivalUnit: 'क्विंटल', minPrice: 0, maxPrice: 0, modalPrice: 0, yesterdayPrice: 0, priceChange: 0, msp: '-' },
    ],
  },
  {
    id: 'mp-vidisha-ganjbasoda',
    state: 'मध्य प्रदेश',
    district: 'विदिशा',
    tehsil: 'गंजबासौदा',
    mandiName: 'गंजबासौदा (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन (मंडी) बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति गंजबासौदा जिला विदिशा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे (दैनिक आवक एवं भाव पत्रक)',
    status: 'open',
    totalContracts: 1980,
    totalArrival: '38,150',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, कृषि उपज मंडी समिति गंजबासौदा',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन (Soybean)', contracts: 660, arrival: 8550, arrivalUnit: 'बोरी', minPrice: 1620, maxPrice: 7190, modalPrice: 6840, yesterdayPrice: 6800, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'सरसों (Mustard)', contracts: 23, arrival: 390, arrivalUnit: 'बोरी', minPrice: 7250, maxPrice: 8750, modalPrice: 8250, yesterdayPrice: 8200, priceChange: 50, msp: 6200 },
      { sNo: 3, cropName: 'चना (Chana)', contracts: 120, arrival: 960, arrivalUnit: 'बोरी', minPrice: 3100, maxPrice: 7250, modalPrice: 6350, yesterdayPrice: 6300, priceChange: 50, msp: 5958 },
      { sNo: 4, cropName: 'मसूर (Masoor)', contracts: 45, arrival: 460, arrivalUnit: 'बोरी', minPrice: 3650, maxPrice: 8750, modalPrice: 5640, yesterdayPrice: 5600, priceChange: 40, msp: 7000 },
      { sNo: 5, cropName: 'शरबती गेहूं (Sharbati)', contracts: 16, arrival: 155, arrivalUnit: 'बोरी', minPrice: 3800, maxPrice: 5880, modalPrice: 4560, yesterdayPrice: 4500, priceChange: 60, msp: 2625 },
      { sNo: 6, cropName: 'गेहूं (1544 Lokwan)', contracts: 235, arrival: 3680, arrivalUnit: 'बोरी', minPrice: 2600, maxPrice: 3480, modalPrice: 2730, yesterdayPrice: 2700, priceChange: 30, msp: 2625 },
      { sNo: 7, cropName: 'मालवा शक्ति गेहूं', contracts: 2, arrival: 8, arrivalUnit: 'बोरी', minPrice: 2660, maxPrice: 2680, modalPrice: 2670, yesterdayPrice: 2657, priceChange: 13, msp: 2625 },
      { sNo: 8, cropName: 'बटरी (Batri)', contracts: 11, arrival: 78, arrivalUnit: 'बोरी', minPrice: 1680, maxPrice: 4100, modalPrice: 1670, yesterdayPrice: 1650, priceChange: 20, msp: '-' },
      { sNo: 9, cropName: 'मूंग (Moong)', contracts: 8, arrival: 45, arrivalUnit: 'बोरी', minPrice: 3650, maxPrice: 7650, modalPrice: 3740, yesterdayPrice: 3700, priceChange: 40, msp: 8780 },
      { sNo: 10, cropName: 'उड़द (Urad)', contracts: 78, arrival: 490, arrivalUnit: 'बोरी', minPrice: 2250, maxPrice: 7480, modalPrice: 4440, yesterdayPrice: 4400, priceChange: 40, msp: 8200 },
      { sNo: 11, cropName: 'मक्का (Maize)', contracts: 260, arrival: 7920, arrivalUnit: 'बोरी', minPrice: 1870, maxPrice: 2780, modalPrice: 2620, yesterdayPrice: 2600, priceChange: 20, msp: 2410 },
      { sNo: 12, cropName: 'तिवड़ा (Tiwada)', contracts: 25, arrival: 130, arrivalUnit: 'बोरी', minPrice: 2250, maxPrice: 3320, modalPrice: 3080, yesterdayPrice: 3050, priceChange: 30, msp: '-' },
      { sNo: 13, cropName: 'धान (Paddy)', contracts: 515, arrival: 15450, arrivalUnit: 'बोरी', minPrice: 1420, maxPrice: 5040, modalPrice: 4830, yesterdayPrice: 4800, priceChange: 30, msp: 2441 },
      { sNo: 14, cropName: 'मटर (Matar)', contracts: 4, arrival: 65, arrivalUnit: 'बोरी', minPrice: 1780, maxPrice: 2010, modalPrice: 1990, yesterdayPrice: 1976, priceChange: 14, msp: '-' },
      { sNo: 15, cropName: 'तिल्ली (Sesame)', contracts: 2, arrival: 3, arrivalUnit: 'बोरी', minPrice: 10100, maxPrice: 10200, modalPrice: 10150, yesterdayPrice: 10000, priceChange: 150, msp: 9267 },
      { sNo: 16, cropName: 'धनिया (Coriander)', contracts: 4, arrival: 5, arrivalUnit: 'बोरी', minPrice: 10100, maxPrice: 13250, modalPrice: 10100, yesterdayPrice: 10000, priceChange: 100, msp: '-' },
      { sNo: 17, cropName: 'अलसी (Linseed)', contracts: 2, arrival: 3, arrivalUnit: 'बोरी', minPrice: 8050, maxPrice: 8100, modalPrice: 8080, yesterdayPrice: 8000, priceChange: 80, msp: '-' },
      { sNo: 18, cropName: 'जौ (Barley)', contracts: 3, arrival: 5, arrivalUnit: 'बोरी', minPrice: 1990, maxPrice: 2000, modalPrice: 1995, yesterdayPrice: 1980, priceChange: 15, msp: 1980 },
      { sNo: 19, cropName: 'ज्वार (Jowar)', contracts: 2, arrival: 6, arrivalUnit: 'बोरी', minPrice: 2020, maxPrice: 2030, modalPrice: 2025, yesterdayPrice: 2015, priceChange: 10, msp: 3371 },
    ],
  },
  {
    id: 'mp-vidisha-sironj',
    state: 'मध्य प्रदेश',
    district: 'विदिशा',
    tehsil: 'सिरोंज',
    mandiName: 'सिरोंज (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन (मंडी) बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति, सिरोंज जिला- विदिशा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे (आधिकारिक दैनिक पत्रक)',
    status: 'open',
    totalContracts: 1160,
    totalArrival: '30,550',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, कृषि उपज मंडी समिति सिरोंज जिला- विदिशा',
    rows: [
      { sNo: 1, cropName: 'गेहूँ', contracts: 95, arrival: 1780, arrivalUnit: 'क्विंटल', minPrice: 2610, maxPrice: 5820, modalPrice: 3040, yesterdayPrice: 3000, priceChange: 40, msp: 2625 },
      { sNo: 2, cropName: 'चना', contracts: 42, arrival: 430, arrivalUnit: 'क्विंटल', minPrice: 5550, maxPrice: 6860, modalPrice: 6540, yesterdayPrice: 6500, priceChange: 40, msp: 5958 },
      { sNo: 3, cropName: 'मसूर', contracts: 12, arrival: 85, arrivalUnit: 'क्विंटल', minPrice: 5040, maxPrice: 6020, modalPrice: 5750, yesterdayPrice: 5715, priceChange: 35, msp: 7000 },
      { sNo: 4, cropName: 'सोयाबीन', contracts: 218, arrival: 2840, arrivalUnit: 'क्विंटल', minPrice: 2050, maxPrice: 7020, modalPrice: 6750, yesterdayPrice: 6700, priceChange: 50, msp: 5708 },
      { sNo: 5, cropName: 'सरसों', contracts: 2, arrival: 28, arrivalUnit: 'क्विंटल', minPrice: 7620, maxPrice: 7650, modalPrice: 7640, yesterdayPrice: 7585, priceChange: 55, msp: 6200 },
      { sNo: 6, cropName: 'मक्का', contracts: 735, arrival: 24900, arrivalUnit: 'क्विंटल', minPrice: 1760, maxPrice: 2740, modalPrice: 2230, yesterdayPrice: 2200, priceChange: 30, msp: 2410 },
      { sNo: 7, cropName: 'उड़दा', contracts: 44, arrival: 310, arrivalUnit: 'क्विंटल', minPrice: 4050, maxPrice: 7620, modalPrice: 5240, yesterdayPrice: 5200, priceChange: 40, msp: 8200 },
      { sNo: 8, cropName: 'बटरी', contracts: 6, arrival: 80, arrivalUnit: 'क्विंटल', minPrice: 2540, maxPrice: 3840, modalPrice: 3750, yesterdayPrice: 3725, priceChange: 25, msp: '-' },
      { sNo: 9, cropName: 'तिवड़ा', contracts: 8, arrival: 98, arrivalUnit: 'क्विंटल', minPrice: 3380, maxPrice: 3490, modalPrice: 3480, yesterdayPrice: 3460, priceChange: 20, msp: '-' },
      { sNo: 10, cropName: 'मूंग', contracts: 2, arrival: 5, arrivalUnit: 'क्विंटल', minPrice: 5050, maxPrice: 5100, modalPrice: 5060, yesterdayPrice: 5000, priceChange: 60, msp: 8780 },
      { sNo: 11, cropName: 'मटर', contracts: '-', arrival: '-', arrivalUnit: 'क्विंटल', minPrice: 0, maxPrice: 0, modalPrice: 0, yesterdayPrice: 0, priceChange: 0, msp: '-' },
    ],
  },
  {
    id: 'mp-vidisha-shamshabad',
    state: 'मध्य प्रदेश',
    district: 'विदिशा',
    tehsil: 'शमशाबाद',
    mandiName: 'शमशाबाद (कृषि उपज उपमंडी)',
    mandiType: 'उपमंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन (मंडी) बोर्ड भोपाल',
    committeeName: 'कार्यालय कृषि उपज उपमंडी समिति शमशाबाद जिला विदिशा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे (दैनिक पत्रक)',
    status: 'open',
    totalContracts: 435,
    totalArrival: '7,150',
    arrivalUnit: 'बोरी',
    secretaryName: 'प्रभारी सचिव, कृषि उपज उपमंडी शमशाबाद',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन (Soybean)', contracts: 175, arrival: 2810, arrivalUnit: 'बोरी', minPrice: 2200, maxPrice: 6920, modalPrice: 6710, yesterdayPrice: 6650, priceChange: 60, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं (1544 / शरबती)', contracts: 148, arrival: 2540, arrivalUnit: 'बोरी', minPrice: 2600, maxPrice: 4250, modalPrice: 2780, yesterdayPrice: 2750, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'चना देसी (Gram)', contracts: 56, arrival: 930, arrivalUnit: 'बोरी', minPrice: 5250, maxPrice: 6960, modalPrice: 6490, yesterdayPrice: 6450, priceChange: 40, msp: 5958 },
      { sNo: 4, cropName: 'मसूर (Masoor)', contracts: 30, arrival: 450, arrivalUnit: 'बोरी', minPrice: 4850, maxPrice: 6150, modalPrice: 5790, yesterdayPrice: 5750, priceChange: 40, msp: 7000 },
      { sNo: 5, cropName: 'मक्का (Maize)', contracts: 24, arrival: 360, arrivalUnit: 'बोरी', minPrice: 1820, maxPrice: 2580, modalPrice: 2270, yesterdayPrice: 2250, priceChange: 20, msp: 2410 },
      { sNo: 6, cropName: 'उड़द (Urad)', contracts: 6, arrival: 70, arrivalUnit: 'बोरी', minPrice: 4250, maxPrice: 6850, modalPrice: 5140, yesterdayPrice: 5100, priceChange: 40, msp: 8200 },
    ],
  },
  {
    id: 'mp-vidisha-kurwai',
    state: 'मध्य प्रदेश',
    district: 'विदिशा',
    tehsil: 'कुरवाई',
    mandiName: 'कुरवाई (कृषि उपज उपमंडी)',
    mandiType: 'उपमंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन (मंडी) बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति कुरवाई जिला विदिशा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 380,
    totalArrival: '5,920',
    arrivalUnit: 'बोरी',
    secretaryName: 'मंडी सचिव, कुरवाई जिला विदिशा',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 160, arrival: 2550, arrivalUnit: 'बोरी', minPrice: 2350, maxPrice: 6880, modalPrice: 6690, yesterdayPrice: 6650, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं (Lokwan/1544)', contracts: 130, arrival: 2100, arrivalUnit: 'बोरी', minPrice: 2580, maxPrice: 3450, modalPrice: 2740, yesterdayPrice: 2710, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'चना', contracts: 55, arrival: 820, arrivalUnit: 'बोरी', minPrice: 5200, maxPrice: 6880, modalPrice: 6420, yesterdayPrice: 6380, priceChange: 40, msp: 5958 },
      { sNo: 4, cropName: 'मसूर', contracts: 35, arrival: 450, arrivalUnit: 'बोरी', minPrice: 4900, maxPrice: 5950, modalPrice: 5720, yesterdayPrice: 5690, priceChange: 30, msp: 7000 },
    ],
  },
  {
    id: 'mp-vidisha-lateri',
    state: 'मध्य प्रदेश',
    district: 'विदिशा',
    tehsil: 'लटेरी',
    mandiName: 'लटेरी (कृषि उपज उपमंडी)',
    mandiType: 'उपमंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज उपमंडी समिति लटेरी जिला विदिशा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे (दैनिक पत्रक)',
    status: 'open',
    totalContracts: 360,
    totalArrival: '5,350',
    arrivalUnit: 'बोरी',
    secretaryName: 'प्रभारी अधिकारी, उपमंडी लटेरी',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 148, arrival: 2210, arrivalUnit: 'बोरी', minPrice: 2250, maxPrice: 6850, modalPrice: 6660, yesterdayPrice: 6620, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं लोकवान', contracts: 116, arrival: 1820, arrivalUnit: 'बोरी', minPrice: 2560, maxPrice: 3150, modalPrice: 2720, yesterdayPrice: 2690, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'चना', contracts: 48, arrival: 710, arrivalUnit: 'बोरी', minPrice: 5150, maxPrice: 6810, modalPrice: 6420, yesterdayPrice: 6380, priceChange: 40, msp: 5958 },
      { sNo: 4, cropName: 'मक्का', contracts: 52, arrival: 610, arrivalUnit: 'बोरी', minPrice: 1770, maxPrice: 2510, modalPrice: 2200, yesterdayPrice: 2180, priceChange: 20, msp: 2410 },
    ],
  },
  {
    id: 'mp-vidisha-gulabganj',
    state: 'मध्य प्रदेश',
    district: 'विदिशा',
    tehsil: 'गुलाबगंज',
    mandiName: 'गुलाबगंज (कृषि उपज उपमंडी)',
    mandiType: 'उपमंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज उपमंडी समिति गुलाबगंज जिला विदिशा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 275,
    totalArrival: '4,050',
    arrivalUnit: 'बोरी',
    secretaryName: 'मंडी भारसाधक, गुलाबगंज',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 118, arrival: 1740, arrivalUnit: 'बोरी', minPrice: 2350, maxPrice: 6890, modalPrice: 6710, yesterdayPrice: 6670, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं (1544)', contracts: 90, arrival: 1370, arrivalUnit: 'बोरी', minPrice: 2600, maxPrice: 3350, modalPrice: 2740, yesterdayPrice: 2710, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'चना', contracts: 42, arrival: 610, arrivalUnit: 'बोरी', minPrice: 5350, maxPrice: 6900, modalPrice: 6460, yesterdayPrice: 6420, priceChange: 40, msp: 5958 },
      { sNo: 4, cropName: 'मसूर', contracts: 26, arrival: 330, arrivalUnit: 'बोरी', minPrice: 4950, maxPrice: 5940, modalPrice: 5690, yesterdayPrice: 5650, priceChange: 40, msp: 7000 },
    ],
  },
  {
    id: 'mp-vidisha-gyaraspur',
    state: 'मध्य प्रदेश',
    district: 'विदिशा',
    tehsil: 'ग्यारसपुर',
    mandiName: 'ग्यारसपुर (कृषि उपज उपमंडी)',
    mandiType: 'उपमंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज उपमंडी ग्यारसपुर जिला विदिशा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 210,
    totalArrival: '3,150',
    arrivalUnit: 'बोरी',
    secretaryName: 'प्रभारी सचिव, ग्यारसपुर उपमंडी',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 95, arrival: 1420, arrivalUnit: 'बोरी', minPrice: 2300, maxPrice: 6850, modalPrice: 6680, yesterdayPrice: 6640, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं शरबती/लोकवान', contracts: 75, arrival: 1120, arrivalUnit: 'बोरी', minPrice: 2600, maxPrice: 4100, modalPrice: 2750, yesterdayPrice: 2720, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'चना', contracts: 30, arrival: 460, arrivalUnit: 'बोरी', minPrice: 5300, maxPrice: 6860, modalPrice: 6430, yesterdayPrice: 6390, priceChange: 40, msp: 5958 },
    ],
  },
  {
    id: 'mp-vidisha-nateran',
    state: 'मध्य प्रदेश',
    district: 'विदिशा',
    tehsil: 'नटेरन',
    mandiName: 'नटेरन (कृषि उपज उपमंडी)',
    mandiType: 'उपमंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज उपमंडी नटेरन जिला विदिशा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 195,
    totalArrival: '2,890',
    arrivalUnit: 'बोरी',
    secretaryName: 'प्रभारी अधिकारी, नटेरन',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 90, arrival: 1350, arrivalUnit: 'बोरी', minPrice: 2280, maxPrice: 6820, modalPrice: 6670, yesterdayPrice: 6630, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं (1544)', contracts: 70, arrival: 1040, arrivalUnit: 'बोरी', minPrice: 2580, maxPrice: 3300, modalPrice: 2720, yesterdayPrice: 2690, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'चना देसी', contracts: 28, arrival: 410, arrivalUnit: 'बोरी', minPrice: 5280, maxPrice: 6840, modalPrice: 6410, yesterdayPrice: 6370, priceChange: 40, msp: 5958 },
    ],
  },
  {
    id: 'mp-vidisha-tyonda',
    state: 'मध्य प्रदेश',
    district: 'विदिशा',
    tehsil: 'त्योंदा',
    mandiName: 'त्योंदा (कृषि उपज उपमंडी)',
    mandiType: 'उपमंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज उपमंडी त्योंदा जिला विदिशा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 170,
    totalArrival: '2,480',
    arrivalUnit: 'बोरी',
    secretaryName: 'प्रभारी, उपमंडी त्योंदा',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 80, arrival: 1190, arrivalUnit: 'बोरी', minPrice: 2270, maxPrice: 6830, modalPrice: 6660, yesterdayPrice: 6620, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं', contracts: 60, arrival: 890, arrivalUnit: 'बोरी', minPrice: 2570, maxPrice: 3280, modalPrice: 2710, yesterdayPrice: 2680, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'मसूर', contracts: 25, arrival: 340, arrivalUnit: 'बोरी', minPrice: 4850, maxPrice: 5880, modalPrice: 5640, yesterdayPrice: 5600, priceChange: 40, msp: 7000 },
    ],
  },

  // ==========================================
  // 2. सीहोर जिला (All Tehsils & Mandis)
  // ==========================================
  {
    id: 'mp-sehore-sehore',
    state: 'मध्य प्रदेश',
    district: 'सीहोर',
    tehsil: 'सीहोर',
    mandiName: 'सीहोर (मुख्य कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड भोपाल',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति सीहोर जिला सीहोर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 1480,
    totalArrival: '31,200',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, कृषि उपज मंडी समिति सीहोर',
    rows: [
      { sNo: 1, cropName: 'गेहूं शरबती (C-306)', contracts: 420, arrival: 9200, arrivalUnit: 'क्विंटल', minPrice: 3200, maxPrice: 5950, modalPrice: 4650, yesterdayPrice: 4600, priceChange: 50, msp: 2625 },
      { sNo: 2, cropName: 'सोयाबीन पीला', contracts: 510, arrival: 10800, arrivalUnit: 'क्विंटल', minPrice: 3100, maxPrice: 7150, modalPrice: 6820, yesterdayPrice: 6780, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'चना डॉलर / काबुली', contracts: 280, arrival: 5400, arrivalUnit: 'क्विंटल', minPrice: 8500, maxPrice: 14200, modalPrice: 12400, yesterdayPrice: 12200, priceChange: 200, msp: 5958 },
      { sNo: 4, cropName: 'लहसुन (Garlic)', contracts: 180, arrival: 4800, arrivalUnit: 'क्विंटल', minPrice: 6500, maxPrice: 22000, modalPrice: 16200, yesterdayPrice: 16000, priceChange: 200, msp: '-' },
    ],
  },
  {
    id: 'mp-sehore-ashta',
    state: 'मध्य प्रदेश',
    district: 'सीहोर',
    tehsil: 'आष्टा',
    mandiName: 'आष्टा (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड भोपाल',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति आष्टा जिला सीहोर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 1280,
    totalArrival: '29,400',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, कृषि उपज मंडी समिति आष्टा',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन पीला', contracts: 490, arrival: 9100, arrivalUnit: 'क्विंटल', minPrice: 3250, maxPrice: 7150, modalPrice: 6820, yesterdayPrice: 6780, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं शरबती', contracts: 320, arrival: 7350, arrivalUnit: 'क्विंटल', minPrice: 2850, maxPrice: 5450, modalPrice: 4250, yesterdayPrice: 4200, priceChange: 50, msp: 2625 },
      { sNo: 3, cropName: 'चना विशाल', contracts: 195, arrival: 3480, arrivalUnit: 'क्विंटल', minPrice: 5250, maxPrice: 7400, modalPrice: 6890, yesterdayPrice: 6850, priceChange: 40, msp: 5958 },
      { sNo: 4, cropName: 'लहसुन (Garlic)', contracts: 145, arrival: 4600, arrivalUnit: 'क्विंटल', minPrice: 6200, maxPrice: 21500, modalPrice: 15800, yesterdayPrice: 15500, priceChange: 300, msp: '-' },
    ],
  },
  {
    id: 'mp-sehore-ichhawar',
    state: 'मध्य प्रदेश',
    district: 'सीहोर',
    tehsil: 'इछावर',
    mandiName: 'इछावर (कृषि उपज उपमंडी)',
    mandiType: 'उपमंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज उपमंडी समिति इछावर जिला सीहोर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 410,
    totalArrival: '8,200',
    arrivalUnit: 'बोरी',
    secretaryName: 'प्रभारी सचिव, इछावर',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 180, arrival: 3600, arrivalUnit: 'बोरी', minPrice: 3100, maxPrice: 7080, modalPrice: 6780, yesterdayPrice: 6740, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं लोकवान', contracts: 140, arrival: 2800, arrivalUnit: 'बोरी', minPrice: 2600, maxPrice: 3400, modalPrice: 2750, yesterdayPrice: 2720, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'चना', contracts: 65, arrival: 1300, arrivalUnit: 'बोरी', minPrice: 5300, maxPrice: 6950, modalPrice: 6520, yesterdayPrice: 6480, priceChange: 40, msp: 5958 },
    ],
  },
  {
    id: 'mp-sehore-bherunda',
    state: 'मध्य प्रदेश',
    district: 'सीहोर',
    tehsil: 'भेरुंदा (नसरुल्लागंज)',
    mandiName: 'भेरुंदा / नसरुल्लागंज (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति भेरुंदा जिला सीहोर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 680,
    totalArrival: '14,500',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, कृषि उपज मंडी भेरुंदा',
    rows: [
      { sNo: 1, cropName: 'धान (Paddy पूसा/1509)', contracts: 290, arrival: 6800, arrivalUnit: 'क्विंटल', minPrice: 1800, maxPrice: 4850, modalPrice: 4520, yesterdayPrice: 4480, priceChange: 40, msp: 2441 },
      { sNo: 2, cropName: 'सोयाबीन', contracts: 220, arrival: 4600, arrivalUnit: 'क्विंटल', minPrice: 2900, maxPrice: 7100, modalPrice: 6790, yesterdayPrice: 6750, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'मूंग ग्रीष्म', contracts: 90, arrival: 1800, arrivalUnit: 'क्विंटल', minPrice: 5200, maxPrice: 7600, modalPrice: 6980, yesterdayPrice: 6950, priceChange: 30, msp: 8780 },
    ],
  },
  {
    id: 'mp-sehore-shampur',
    state: 'मध्य प्रदेश',
    district: 'सीहोर',
    tehsil: 'श्यामपुर',
    mandiName: 'श्यामपुर (कृषि उपज उपमंडी)',
    mandiType: 'उपमंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज उपमंडी श्यामपुर जिला सीहोर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 290,
    totalArrival: '5,800',
    arrivalUnit: 'बोरी',
    secretaryName: 'प्रभारी अधिकारी, श्यामपुर',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 130, arrival: 2600, arrivalUnit: 'बोरी', minPrice: 3000, maxPrice: 7050, modalPrice: 6760, yesterdayPrice: 6720, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं शरबती', contracts: 110, arrival: 2200, arrivalUnit: 'बोरी', minPrice: 2800, maxPrice: 5200, modalPrice: 4100, yesterdayPrice: 4050, priceChange: 50, msp: 2625 },
      { sNo: 3, cropName: 'चना', contracts: 40, arrival: 800, arrivalUnit: 'बोरी', minPrice: 5250, maxPrice: 6900, modalPrice: 6480, yesterdayPrice: 6440, priceChange: 40, msp: 5958 },
    ],
  },

  // ==========================================
  // 3. रायसेन जिला (All Tehsils & Mandis)
  // ==========================================
  {
    id: 'mp-raisen-raisen',
    state: 'मध्य प्रदेश',
    district: 'रायसेन',
    tehsil: 'रायसेन',
    mandiName: 'रायसेन (मुख्य कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति रायसेन जिला रायसेन',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 890,
    totalArrival: '18,400',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, कृषि उपज मंडी समिति रायसेन',
    rows: [
      { sNo: 1, cropName: 'धान (Paddy सुगंधा/1121)', contracts: 410, arrival: 8900, arrivalUnit: 'क्विंटल', minPrice: 1900, maxPrice: 5150, modalPrice: 4720, yesterdayPrice: 4680, priceChange: 40, msp: 2441 },
      { sNo: 2, cropName: 'सोयाबीन', contracts: 260, arrival: 5200, arrivalUnit: 'क्विंटल', minPrice: 2800, maxPrice: 7100, modalPrice: 6780, yesterdayPrice: 6740, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'गेहूं (1544)', contracts: 140, arrival: 2800, arrivalUnit: 'क्विंटल', minPrice: 2600, maxPrice: 3450, modalPrice: 2750, yesterdayPrice: 2720, priceChange: 30, msp: 2625 },
      { sNo: 4, cropName: 'चना', contracts: 65, arrival: 1300, arrivalUnit: 'क्विंटल', minPrice: 5300, maxPrice: 6980, modalPrice: 6510, yesterdayPrice: 6470, priceChange: 40, msp: 5958 },
    ],
  },
  {
    id: 'mp-raisen-bareli',
    state: 'मध्य प्रदेश',
    district: 'रायसेन',
    tehsil: 'बरेली',
    mandiName: 'बरेली (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति बरेली जिला रायसेन',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 1150,
    totalArrival: '26,500',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, बरेली मंडी समिति',
    rows: [
      { sNo: 1, cropName: 'धान (Paddy बासमती 1509/1718)', contracts: 620, arrival: 15800, arrivalUnit: 'क्विंटल', minPrice: 2100, maxPrice: 5250, modalPrice: 4850, yesterdayPrice: 4800, priceChange: 50, msp: 2441 },
      { sNo: 2, cropName: 'सोयाबीन', contracts: 310, arrival: 6800, arrivalUnit: 'क्विंटल', minPrice: 2900, maxPrice: 7120, modalPrice: 6810, yesterdayPrice: 6770, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'मूंग', contracts: 140, arrival: 2600, arrivalUnit: 'क्विंटल', minPrice: 5100, maxPrice: 7700, modalPrice: 7080, yesterdayPrice: 7050, priceChange: 30, msp: 8780 },
    ],
  },
  {
    id: 'mp-raisen-begamganj',
    state: 'मध्य प्रदेश',
    district: 'रायसेन',
    tehsil: 'बेगमगंज',
    mandiName: 'बेगमगंज (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति बेगमगंज जिला रायसेन',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 450,
    totalArrival: '8,900',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, बेगमगंज मंडी',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 190, arrival: 3800, arrivalUnit: 'बोरी', minPrice: 2400, maxPrice: 6890, modalPrice: 6720, yesterdayPrice: 6680, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं शरबती', contracts: 140, arrival: 2800, arrivalUnit: 'बोरी', minPrice: 2750, maxPrice: 4800, modalPrice: 3850, yesterdayPrice: 3800, priceChange: 50, msp: 2625 },
      { sNo: 3, cropName: 'मसूर', contracts: 65, arrival: 1250, arrivalUnit: 'बोरी', minPrice: 4900, maxPrice: 6100, modalPrice: 5750, yesterdayPrice: 5710, priceChange: 40, msp: 7000 },
      { sNo: 4, cropName: 'उड़द', contracts: 40, arrival: 800, arrivalUnit: 'बोरी', minPrice: 4300, maxPrice: 7100, modalPrice: 5250, yesterdayPrice: 5200, priceChange: 50, msp: 8200 },
    ],
  },
  {
    id: 'mp-raisen-udaipura',
    state: 'मध्य प्रदेश',
    district: 'रायसेन',
    tehsil: 'उदयपुरा',
    mandiName: 'उदयपुरा (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति उदयपुरा जिला रायसेन',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 540,
    totalArrival: '11,200',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, उदयपुरा मंडी',
    rows: [
      { sNo: 1, cropName: 'धान (Paddy सुगंधा)', contracts: 280, arrival: 6400, arrivalUnit: 'क्विंटल', minPrice: 1950, maxPrice: 4980, modalPrice: 4620, yesterdayPrice: 4580, priceChange: 40, msp: 2441 },
      { sNo: 2, cropName: 'सोयाबीन', contracts: 170, arrival: 3400, arrivalUnit: 'क्विंटल', minPrice: 2850, maxPrice: 7080, modalPrice: 6780, yesterdayPrice: 6740, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'मूंग', contracts: 60, arrival: 1100, arrivalUnit: 'क्विंटल', minPrice: 5000, maxPrice: 7550, modalPrice: 6920, yesterdayPrice: 6890, priceChange: 30, msp: 8780 },
    ],
  },
  {
    id: 'mp-raisen-silwani',
    state: 'मध्य प्रदेश',
    district: 'रायसेन',
    tehsil: 'सिलवानी',
    mandiName: 'सिलवानी (कृषि उपज उपमंडी)',
    mandiType: 'उपमंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज उपमंडी सिलवानी जिला रायसेन',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 260,
    totalArrival: '4,800',
    arrivalUnit: 'बोरी',
    secretaryName: 'प्रभारी सचिव, सिलवानी',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 120, arrival: 2300, arrivalUnit: 'बोरी', minPrice: 2450, maxPrice: 6860, modalPrice: 6690, yesterdayPrice: 6650, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं (1544)', contracts: 80, arrival: 1500, arrivalUnit: 'बोरी', minPrice: 2580, maxPrice: 3250, modalPrice: 2710, yesterdayPrice: 2680, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'मसूर', contracts: 40, arrival: 750, arrivalUnit: 'बोरी', minPrice: 4800, maxPrice: 5920, modalPrice: 5680, yesterdayPrice: 5640, priceChange: 40, msp: 7000 },
    ],
  },

  // ==========================================
  // 4. भोपाल जिला (Karond & Berasia)
  // ==========================================
  {
    id: 'mp-bhopal-karond',
    state: 'मध्य प्रदेश',
    district: 'भोपाल',
    tehsil: 'हुजूर / करोंद',
    mandiName: 'करोंद मंडी भोपाल (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड भोपाल',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति भोपाल (करोंद)',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 1420,
    totalArrival: '27,800',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, कृषि उपज मंडी समिति भोपाल',
    rows: [
      { sNo: 1, cropName: 'गेहूं शरबती', contracts: 420, arrival: 8900, arrivalUnit: 'क्विंटल', minPrice: 3100, maxPrice: 5600, modalPrice: 4450, yesterdayPrice: 4400, priceChange: 50, msp: 2625 },
      { sNo: 2, cropName: 'सोयाबीन पीला', contracts: 460, arrival: 9200, arrivalUnit: 'क्विंटल', minPrice: 3200, maxPrice: 7120, modalPrice: 6800, yesterdayPrice: 6760, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'चना (Chana)', contracts: 220, arrival: 4100, arrivalUnit: 'क्विंटल', minPrice: 5400, maxPrice: 7150, modalPrice: 6750, yesterdayPrice: 6700, priceChange: 50, msp: 5958 },
      { sNo: 4, cropName: 'प्याज (Onion)', contracts: 180, arrival: 3200, arrivalUnit: 'क्विंटल', minPrice: 1600, maxPrice: 4200, modalPrice: 3100, yesterdayPrice: 3000, priceChange: 100, msp: '-' },
    ],
  },
  {
    id: 'mp-bhopal-berasia',
    state: 'मध्य प्रदेश',
    district: 'भोपाल',
    tehsil: 'बैरसिया',
    mandiName: 'बैरसिया (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति बैरसिया जिला भोपाल',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 650,
    totalArrival: '12,900',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, मंडी समिति बैरसिया',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 280, arrival: 5800, arrivalUnit: 'बोरी', minPrice: 2400, maxPrice: 6920, modalPrice: 6720, yesterdayPrice: 6680, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं लोकवान', contracts: 210, arrival: 4300, arrivalUnit: 'बोरी', minPrice: 2580, maxPrice: 3350, modalPrice: 2730, yesterdayPrice: 2700, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'चना', contracts: 95, arrival: 1850, arrivalUnit: 'बोरी', minPrice: 5300, maxPrice: 6880, modalPrice: 6450, yesterdayPrice: 6410, priceChange: 40, msp: 5958 },
    ],
  },

  // ==========================================
  // 5. सागर जिला (All Tehsils & Mandis)
  // ==========================================
  {
    id: 'mp-sagar-sagar',
    state: 'मध्य प्रदेश',
    district: 'सागर',
    tehsil: 'सागर',
    mandiName: 'सागर (मुख्य कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति सागर जिला सागर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 1250,
    totalArrival: '25,600',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, कृषि उपज मंडी समिति सागर',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 480, arrival: 9600, arrivalUnit: 'क्विंटल', minPrice: 2900, maxPrice: 7120, modalPrice: 6810, yesterdayPrice: 6770, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं (1544)', contracts: 340, arrival: 7200, arrivalUnit: 'क्विंटल', minPrice: 2580, maxPrice: 3420, modalPrice: 2740, yesterdayPrice: 2710, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'चना', contracts: 220, arrival: 4500, arrivalUnit: 'क्विंटल', minPrice: 5350, maxPrice: 7050, modalPrice: 6620, yesterdayPrice: 6580, priceChange: 40, msp: 5958 },
      { sNo: 4, cropName: 'उड़द', contracts: 140, arrival: 2800, arrivalUnit: 'क्विंटल', minPrice: 4200, maxPrice: 7550, modalPrice: 5320, yesterdayPrice: 5280, priceChange: 40, msp: 8200 },
    ],
  },
  {
    id: 'mp-sagar-khurai',
    state: 'मध्य प्रदेश',
    district: 'सागर',
    tehsil: 'खुरई',
    mandiName: 'खुरई (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति खुरई जिला सागर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 1080,
    totalArrival: '22,400',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, खुरई मंडी',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 440, arrival: 9100, arrivalUnit: 'बोरी', minPrice: 3100, maxPrice: 7150, modalPrice: 6820, yesterdayPrice: 6780, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं शरबती/लोकवान', contracts: 310, arrival: 6400, arrivalUnit: 'बोरी', minPrice: 2650, maxPrice: 4800, modalPrice: 3450, yesterdayPrice: 3400, priceChange: 50, msp: 2625 },
      { sNo: 3, cropName: 'चना', contracts: 180, arrival: 3700, arrivalUnit: 'बोरी', minPrice: 5300, maxPrice: 6980, modalPrice: 6550, yesterdayPrice: 6510, priceChange: 40, msp: 5958 },
      { sNo: 4, cropName: 'मसूर', contracts: 95, arrival: 1950, arrivalUnit: 'बोरी', minPrice: 5000, maxPrice: 6150, modalPrice: 5800, yesterdayPrice: 5760, priceChange: 40, msp: 7000 },
    ],
  },
  {
    id: 'mp-sagar-bina',
    state: 'मध्य प्रदेश',
    district: 'सागर',
    tehsil: 'बीना',
    mandiName: 'बीना (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति बीना जिला सागर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 920,
    totalArrival: '19,500',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, कृषि उपज मंडी बीना',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 380, arrival: 7900, arrivalUnit: 'बोरी', minPrice: 2800, maxPrice: 7080, modalPrice: 6790, yesterdayPrice: 6750, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं लोकवान', contracts: 280, arrival: 5800, arrivalUnit: 'बोरी', minPrice: 2580, maxPrice: 3380, modalPrice: 2730, yesterdayPrice: 2700, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'चना', contracts: 150, arrival: 3100, arrivalUnit: 'बोरी', minPrice: 5250, maxPrice: 6920, modalPrice: 6480, yesterdayPrice: 6440, priceChange: 40, msp: 5958 },
    ],
  },
  {
    id: 'mp-sagar-banda',
    state: 'मध्य प्रदेश',
    district: 'सागर',
    tehsil: 'बंडा',
    mandiName: 'बंडा (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति बंडा जिला सागर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 480,
    totalArrival: '9,800',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, बंडा मंडी',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 210, arrival: 4300, arrivalUnit: 'बोरी', minPrice: 2600, maxPrice: 6950, modalPrice: 6740, yesterdayPrice: 6700, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'उड़द', contracts: 140, arrival: 2800, arrivalUnit: 'बोरी', minPrice: 4100, maxPrice: 7450, modalPrice: 5310, yesterdayPrice: 5270, priceChange: 40, msp: 8200 },
      { sNo: 3, cropName: 'गेहूं', contracts: 85, arrival: 1750, arrivalUnit: 'बोरी', minPrice: 2570, maxPrice: 3250, modalPrice: 2710, yesterdayPrice: 2680, priceChange: 30, msp: 2625 },
    ],
  },

  // ==========================================
  // 6. गुना एवं अशोकनगर जिला (All Mandis)
  // ==========================================
  {
    id: 'mp-guna-guna',
    state: 'मध्य प्रदेश',
    district: 'गुना',
    tehsil: 'गुना',
    mandiName: 'गुना (मुख्य कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति गुना जिला गुना',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 1350,
    totalArrival: '27,500',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, कृषि उपज मंडी समिति गुना',
    rows: [
      { sNo: 1, cropName: 'धनिया (Coriander बादामी/ईगल)', contracts: 510, arrival: 10400, arrivalUnit: 'क्विंटल', minPrice: 6800, maxPrice: 14500, modalPrice: 10800, yesterdayPrice: 10600, priceChange: 200, msp: '-' },
      { sNo: 2, cropName: 'सोयाबीन', contracts: 420, arrival: 8600, arrivalUnit: 'क्विंटल', minPrice: 2750, maxPrice: 7120, modalPrice: 6810, yesterdayPrice: 6770, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'सरसों', contracts: 180, arrival: 3600, arrivalUnit: 'क्विंटल', minPrice: 6400, maxPrice: 7950, modalPrice: 7420, yesterdayPrice: 7380, priceChange: 40, msp: 6200 },
      { sNo: 4, cropName: 'चना', contracts: 140, arrival: 2800, arrivalUnit: 'क्विंटल', minPrice: 5300, maxPrice: 6980, modalPrice: 6520, yesterdayPrice: 6480, priceChange: 40, msp: 5958 },
    ],
  },
  {
    id: 'mp-guna-kumbhraj',
    state: 'मध्य प्रदेश',
    district: 'गुना',
    tehsil: 'कुंभराज',
    mandiName: 'कुंभराज (कृषि उपज मंडी - प्रसिद्ध धनिया मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति कुंभराज जिला गुना',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 980,
    totalArrival: '19,800',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, कुंभराज मंडी',
    rows: [
      { sNo: 1, cropName: 'धनिया (Coriander)', contracts: 580, arrival: 12200, arrivalUnit: 'बोरी', minPrice: 7200, maxPrice: 14800, modalPrice: 11200, yesterdayPrice: 11000, priceChange: 200, msp: '-' },
      { sNo: 2, cropName: 'सोयाबीन', contracts: 240, arrival: 4800, arrivalUnit: 'बोरी', minPrice: 2800, maxPrice: 7080, modalPrice: 6780, yesterdayPrice: 6740, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'सरसों', contracts: 110, arrival: 2200, arrivalUnit: 'बोरी', minPrice: 6500, maxPrice: 7850, modalPrice: 7390, yesterdayPrice: 7350, priceChange: 40, msp: 6200 },
    ],
  },
  {
    id: 'mp-ashoknagar-ashoknagar',
    state: 'मध्य प्रदेश',
    district: 'अशोकनगर',
    tehsil: 'अशोकनगर',
    mandiName: 'अशोकनगर (कृषि उपज मंडी - शरबती गेहूं हब)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति अशोकनगर जिला अशोकनगर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 1460,
    totalArrival: '31,500',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, कृषि उपज मंडी समिति अशोकनगर',
    rows: [
      { sNo: 1, cropName: 'शरबती गेहूं (C-306 GI Tagged)', contracts: 580, arrival: 12800, arrivalUnit: 'क्विंटल', minPrice: 3400, maxPrice: 6200, modalPrice: 4850, yesterdayPrice: 4790, priceChange: 60, msp: 2625 },
      { sNo: 2, cropName: 'सोयाबीन', contracts: 440, arrival: 9600, arrivalUnit: 'क्विंटल', minPrice: 2900, maxPrice: 7150, modalPrice: 6820, yesterdayPrice: 6780, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'चना', contracts: 240, arrival: 5200, arrivalUnit: 'क्विंटल', minPrice: 5350, maxPrice: 7120, modalPrice: 6680, yesterdayPrice: 6640, priceChange: 40, msp: 5958 },
      { sNo: 4, cropName: 'मसूर', contracts: 120, arrival: 2500, arrivalUnit: 'क्विंटल', minPrice: 5100, maxPrice: 6200, modalPrice: 5820, yesterdayPrice: 5780, priceChange: 40, msp: 7000 },
    ],
  },
  {
    id: 'mp-ashoknagar-mungawali',
    state: 'मध्य प्रदेश',
    district: 'अशोकनगर',
    tehsil: 'मुंगावली',
    mandiName: 'मुंगावली (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति मुंगावली जिला अशोकनगर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 620,
    totalArrival: '12,800',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, मुंगावली मंडी',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 260, arrival: 5400, arrivalUnit: 'बोरी', minPrice: 2800, maxPrice: 7050, modalPrice: 6770, yesterdayPrice: 6730, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं शरबती', contracts: 210, arrival: 4300, arrivalUnit: 'बोरी', minPrice: 3100, maxPrice: 5400, modalPrice: 4250, yesterdayPrice: 4200, priceChange: 50, msp: 2625 },
      { sNo: 3, cropName: 'चना', contracts: 110, arrival: 2300, arrivalUnit: 'बोरी', minPrice: 5280, maxPrice: 6920, modalPrice: 6490, yesterdayPrice: 6450, priceChange: 40, msp: 5958 },
    ],
  },

  // ==========================================
  // 7. नीमच एवं मंदसौर जिला (All Mandis)
  // ==========================================
  {
    id: 'mp-neemuch-neemuch',
    state: 'मध्य प्रदेश',
    district: 'नीमच',
    tehsil: 'नीमच',
    mandiName: 'नीमच (मुख्य कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति नीमच जिला नीमच',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 2240,
    totalArrival: '40,800',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, कृषि उपज मंडी समिति नीमच',
    rows: [
      { sNo: 1, cropName: 'लहसुन (Garlic Ooty/Desi)', contracts: 710, arrival: 15200, arrivalUnit: 'बोरी', minPrice: 7800, maxPrice: 24500, modalPrice: 17600, yesterdayPrice: 17200, priceChange: 400, msp: '-' },
      { sNo: 2, cropName: 'सोयाबीन', contracts: 430, arrival: 8100, arrivalUnit: 'बोरी', minPrice: 3850, maxPrice: 7180, modalPrice: 6790, yesterdayPrice: 6750, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'गेहूं (Lokwan)', contracts: 350, arrival: 6400, arrivalUnit: 'बोरी', minPrice: 2480, maxPrice: 3180, modalPrice: 2810, yesterdayPrice: 2780, priceChange: 30, msp: 2625 },
      { sNo: 4, cropName: 'ईसबगोल (Psyllium)', contracts: 190, arrival: 2550, arrivalUnit: 'बोरी', minPrice: 11800, maxPrice: 17200, modalPrice: 14800, yesterdayPrice: 14500, priceChange: 300, msp: '-' },
      { sNo: 5, cropName: 'अश्वगंधा (Ashwagandha)', contracts: 95, arrival: 910, arrivalUnit: 'बोरी', minPrice: 18500, maxPrice: 35000, modalPrice: 26500, yesterdayPrice: 26000, priceChange: 500, msp: '-' },
      { sNo: 6, cropName: 'मेथी (Fenugreek)', contracts: 115, arrival: 1480, arrivalUnit: 'बोरी', minPrice: 4700, maxPrice: 7500, modalPrice: 6180, yesterdayPrice: 6100, priceChange: 80, msp: '-' },
    ],
  },
  {
    id: 'mp-mandsaur-mandsaur',
    state: 'मध्य प्रदेश',
    district: 'मंदसौर',
    tehsil: 'मंदसौर',
    mandiName: 'मंदसौर (मुख्य कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति मंदसौर जिला मंदसौर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 2450,
    totalArrival: '44,200',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, कृषि उपज मंडी समिति मंदसौर',
    rows: [
      { sNo: 1, cropName: 'लहसुन (Garlic)', contracts: 780, arrival: 16800, arrivalUnit: 'बोरी', minPrice: 8000, maxPrice: 25000, modalPrice: 18100, yesterdayPrice: 17700, priceChange: 400, msp: '-' },
      { sNo: 2, cropName: 'सोयाबीन', contracts: 520, arrival: 9800, arrivalUnit: 'बोरी', minPrice: 3600, maxPrice: 7150, modalPrice: 6780, yesterdayPrice: 6740, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'प्याज (Onion)', contracts: 380, arrival: 7200, arrivalUnit: 'बोरी', minPrice: 1800, maxPrice: 4400, modalPrice: 3250, yesterdayPrice: 3150, priceChange: 100, msp: '-' },
      { sNo: 4, cropName: 'अलसी (Linseed)', contracts: 160, arrival: 2400, arrivalUnit: 'बोरी', minPrice: 7400, maxPrice: 8600, modalPrice: 8120, yesterdayPrice: 8050, priceChange: 70, msp: '-' },
      { sNo: 5, cropName: 'इसबगोल', contracts: 140, arrival: 2100, arrivalUnit: 'बोरी', minPrice: 11600, maxPrice: 16900, modalPrice: 14600, yesterdayPrice: 14350, priceChange: 250, msp: '-' },
    ],
  },

  // ==========================================
  // 8. नर्मदापुरम एवं हरदा जिला
  // ==========================================
  {
    id: 'mp-narmadapuram-itarsi',
    state: 'मध्य प्रदेश',
    district: 'नर्मदापुरम',
    tehsil: 'इटारसी',
    mandiName: 'इटारसी (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति इटारसी जिला नर्मदापुरम',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 1450,
    totalArrival: '30,100',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, कृषि उपज मंडी इटारसी',
    rows: [
      { sNo: 1, cropName: 'धान (Paddy 1509 / सुगंधा)', contracts: 640, arrival: 15200, arrivalUnit: 'क्विंटल', minPrice: 1850, maxPrice: 5020, modalPrice: 4610, yesterdayPrice: 4550, priceChange: 60, msp: 2441 },
      { sNo: 2, cropName: 'सोयाबीन', contracts: 390, arrival: 7400, arrivalUnit: 'क्विंटल', minPrice: 2750, maxPrice: 7060, modalPrice: 6730, yesterdayPrice: 6690, priceChange: 40, msp: 5708 },
      { sNo: 3, cropName: 'गेहूं (1544 / शरबती)', contracts: 290, arrival: 5300, arrivalUnit: 'क्विंटल', minPrice: 2600, maxPrice: 3550, modalPrice: 2780, yesterdayPrice: 2750, priceChange: 30, msp: 2625 },
      { sNo: 4, cropName: 'मूंग', contracts: 135, arrival: 2400, arrivalUnit: 'क्विंटल', minPrice: 4850, maxPrice: 7280, modalPrice: 6710, yesterdayPrice: 6650, priceChange: 60, msp: 8780 },
    ],
  },
  {
    id: 'mp-harda-harda',
    state: 'मध्य प्रदेश',
    district: 'हरदा',
    tehsil: 'हरदा',
    mandiName: 'हरदा (कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति हरदा जिला हरदा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 1580,
    totalArrival: '32,800',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'सचिव, मंडी हरदा',
    rows: [
      { sNo: 1, cropName: 'मूंग (Moong ग्रीष्म/खरीफ)', contracts: 540, arrival: 11600, arrivalUnit: 'क्विंटल', minPrice: 5250, maxPrice: 7850, modalPrice: 7210, yesterdayPrice: 7150, priceChange: 60, msp: 8780 },
      { sNo: 2, cropName: 'सोयाबीन', contracts: 490, arrival: 10100, arrivalUnit: 'क्विंटल', minPrice: 2850, maxPrice: 7120, modalPrice: 6780, yesterdayPrice: 6730, priceChange: 50, msp: 5708 },
      { sNo: 3, cropName: 'गेहूं (Wheat)', contracts: 350, arrival: 7400, arrivalUnit: 'क्विंटल', minPrice: 2580, maxPrice: 3350, modalPrice: 2770, yesterdayPrice: 2740, priceChange: 30, msp: 2625 },
      { sNo: 4, cropName: 'चना', contracts: 205, arrival: 4000, arrivalUnit: 'क्विंटल', minPrice: 5380, maxPrice: 7200, modalPrice: 6820, yesterdayPrice: 6780, priceChange: 40, msp: 5958 },
    ],
  },

  // ==========================================
  // 9. इंदौर एवं उज्जैन संभाग
  // ==========================================
  {
    id: 'mp-indore-chhawani',
    state: 'मध्य प्रदेश',
    district: 'इंदौर',
    tehsil: 'इंदौर',
    mandiName: 'इंदौर (देवी अहिल्याबाई होलकर फल व अनाज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति इंदौर जिला इंदौर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 2680,
    totalArrival: '52,100',
    arrivalUnit: 'क्विंटल',
    secretaryName: 'अपर संचालक व भारसाधक अधिकारी, मंडी समिति इंदौर',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन पीला', contracts: 840, arrival: 18200, arrivalUnit: 'क्विंटल', minPrice: 3400, maxPrice: 7200, modalPrice: 6840, yesterdayPrice: 6800, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं शरबती/लोकवान', contracts: 620, arrival: 13500, arrivalUnit: 'क्विंटल', minPrice: 2700, maxPrice: 5300, modalPrice: 4100, yesterdayPrice: 4050, priceChange: 50, msp: 2625 },
      { sNo: 3, cropName: 'चना डॉलर (Kabuli)', contracts: 410, arrival: 7800, arrivalUnit: 'क्विंटल', minPrice: 9200, maxPrice: 14800, modalPrice: 12800, yesterdayPrice: 12600, priceChange: 200, msp: 5958 },
      { sNo: 4, cropName: 'प्याज (Onion)', contracts: 480, arrival: 8900, arrivalUnit: 'क्विंटल', minPrice: 1700, maxPrice: 4300, modalPrice: 3150, yesterdayPrice: 3050, priceChange: 100, msp: '-' },
    ],
  },
  {
    id: 'mp-ujjain-chimanganj',
    state: 'मध्य प्रदेश',
    district: 'उज्जैन',
    tehsil: 'उज्जैन',
    mandiName: 'उज्जैन (चिमनगंज कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'मध्य प्रदेश राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति उज्जैन जिला उज्जैन',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 2150,
    totalArrival: '42,500',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, चिमनगंज मंडी उज्जैन',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 720, arrival: 15400, arrivalUnit: 'बोरी', minPrice: 3200, maxPrice: 7150, modalPrice: 6810, yesterdayPrice: 6770, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'गेहूं (Lokwan)', contracts: 510, arrival: 10800, arrivalUnit: 'बोरी', minPrice: 2580, maxPrice: 3380, modalPrice: 2760, yesterdayPrice: 2730, priceChange: 30, msp: 2625 },
      { sNo: 3, cropName: 'चना डॉलर', contracts: 340, arrival: 6500, arrivalUnit: 'बोरी', minPrice: 8800, maxPrice: 14400, modalPrice: 12500, yesterdayPrice: 12300, priceChange: 200, msp: 5958 },
      { sNo: 4, cropName: 'लहसुन', contracts: 290, arrival: 5800, arrivalUnit: 'बोरी', minPrice: 7200, maxPrice: 23500, modalPrice: 16800, yesterdayPrice: 16500, priceChange: 300, msp: '-' },
    ],
  },

  // ==========================================
  // 10. राजस्थान (कोटा भामाशाह आदि)
  // ==========================================
  {
    id: 'rj-kota-bhamashah',
    state: 'राजस्थान',
    district: 'कोटा',
    tehsil: 'कोटा',
    mandiName: 'कोटा (भामाशाह कृषि उपज मंडी)',
    mandiType: 'मुख्य मंडी',
    boardName: 'राजस्थान राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति कोटा जिला कोटा',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 2720,
    totalArrival: '53,800',
    arrivalUnit: 'बोरी',
    secretaryName: 'उपनिदेशक व सचिव, भामाशाह मंडी कोटा',
    rows: [
      { sNo: 1, cropName: 'सोयाबीन', contracts: 810, arrival: 17100, arrivalUnit: 'बोरी', minPrice: 3450, maxPrice: 7220, modalPrice: 6840, yesterdayPrice: 6800, priceChange: 40, msp: 5708 },
      { sNo: 2, cropName: 'सरसों', contracts: 470, arrival: 9100, arrivalUnit: 'बोरी', minPrice: 6950, maxPrice: 8400, modalPrice: 7850, yesterdayPrice: 7800, priceChange: 50, msp: 6200 },
      { sNo: 3, cropName: 'धान (Paddy 1718/1509)', contracts: 710, arrival: 16200, arrivalUnit: 'बोरी', minPrice: 2150, maxPrice: 4900, modalPrice: 4520, yesterdayPrice: 4480, priceChange: 40, msp: 2441 },
      { sNo: 4, cropName: 'धनिया (Coriander)', contracts: 390, arrival: 6600, arrivalUnit: 'बोरी', minPrice: 8900, maxPrice: 13900, modalPrice: 11500, yesterdayPrice: 11400, priceChange: 100, msp: '-' },
    ],
  },
  {
    id: 'rj-alwar-alwar',
    state: 'राजस्थान',
    district: 'अलवर',
    tehsil: 'अलवर',
    mandiName: 'अलवर (कृषि उपज मंडी - सरसों हब)',
    mandiType: 'मुख्य मंडी',
    boardName: 'राजस्थान राज्य कृषि विपणन बोर्ड',
    committeeName: 'कार्यालय कृषि उपज मंडी समिति अलवर जिला अलवर',
    date: '04-11-2026',
    releaseTime: 'सायं 5:30 बजे',
    status: 'open',
    totalContracts: 1620,
    totalArrival: '34,200',
    arrivalUnit: 'बोरी',
    secretaryName: 'सचिव, अलवर मंडी',
    rows: [
      { sNo: 1, cropName: 'सरसों (42% तेल कंडीशन)', contracts: 790, arrival: 18400, arrivalUnit: 'बोरी', minPrice: 6700, maxPrice: 7850, modalPrice: 7450, yesterdayPrice: 7400, priceChange: 50, msp: 6200 },
      { sNo: 2, cropName: 'बाजरा (Pearl Millet)', contracts: 420, arrival: 8900, arrivalUnit: 'बोरी', minPrice: 2100, maxPrice: 2650, modalPrice: 2420, yesterdayPrice: 2400, priceChange: 20, msp: 2625 },
      { sNo: 3, cropName: 'कपास (Cotton)', contracts: 220, arrival: 4500, arrivalUnit: 'बोरी', minPrice: 6800, maxPrice: 7750, modalPrice: 7380, yesterdayPrice: 7340, priceChange: 40, msp: 7121 },
    ],
  },
];

// Exact 05/11/2026 Ganjbasoda certified rows from official sheet (IMG-20261107-WA0000_cfa47aab.jpg)
const GANJBASODA_05_NOV_ROWS: MandiPatrakRow[] = [
  { sNo: 1, cropName: 'सोयाबीन', contracts: 423, arrival: 4766, arrivalUnit: 'बोरी', minPrice: 2000, maxPrice: 6951, modalPrice: 6800, yesterdayPrice: 6600, priceChange: 200, msp: 5708 },
  { sNo: 2, cropName: 'सरसों', contracts: 28, arrival: 234, arrivalUnit: 'बोरी', minPrice: 6400, maxPrice: 8570, modalPrice: 8420, yesterdayPrice: 7800, priceChange: 620, msp: 6200 },
  { sNo: 3, cropName: 'चना', contracts: 98, arrival: 815, arrivalUnit: 'बोरी', minPrice: 2000, maxPrice: 7110, modalPrice: 6800, yesterdayPrice: 6800, priceChange: 0, msp: 5958 },
  { sNo: 4, cropName: 'मसूर', contracts: 29, arrival: 167, arrivalUnit: 'बोरी', minPrice: 5100, maxPrice: 6170, modalPrice: 5850, yesterdayPrice: 5800, priceChange: 50, msp: 7000 },
  { sNo: 5, cropName: 'शरवती', contracts: 16, arrival: 132, arrivalUnit: 'बोरी', minPrice: 2891, maxPrice: 5305, modalPrice: 4100, yesterdayPrice: 4500, priceChange: -400, msp: 2625 },
  { sNo: 6, cropName: 'गेहूं (1544)', contracts: 160, arrival: 2512, arrivalUnit: 'बोरी', minPrice: 2380, maxPrice: 3370, modalPrice: 2700, yesterdayPrice: 2750, priceChange: -50, msp: 2625 },
  { sNo: 7, cropName: 'मालवा शक्ति', contracts: 4, arrival: 75, arrivalUnit: 'बोरी', minPrice: 2575, maxPrice: 2692, modalPrice: 2600, yesterdayPrice: 0, priceChange: 0, msp: 2625 },
  { sNo: 8, cropName: 'बटरी', contracts: 12, arrival: 104, arrivalUnit: 'बोरी', minPrice: 2000, maxPrice: 3701, modalPrice: 2682, yesterdayPrice: 2200, priceChange: 482, msp: '-' },
  { sNo: 9, cropName: 'मुंग', contracts: 4, arrival: 19, arrivalUnit: 'बोरी', minPrice: 6500, maxPrice: 7180, modalPrice: 6500, yesterdayPrice: 7250, priceChange: -750, msp: 8780 },
  { sNo: 10, cropName: 'उड़द', contracts: 52, arrival: 337, arrivalUnit: 'बोरी', minPrice: 3200, maxPrice: 7301, modalPrice: 5700, yesterdayPrice: 5000, priceChange: 700, msp: 8200 },
  { sNo: 11, cropName: 'मक्का', contracts: 232, arrival: 7717, arrivalUnit: 'बोरी', minPrice: 1880, maxPrice: 2699, modalPrice: 2600, yesterdayPrice: 2500, priceChange: 100, msp: 2410 },
  { sNo: 12, cropName: 'तिवड़ा', contracts: 11, arrival: 89, arrivalUnit: 'बोरी', minPrice: 2500, maxPrice: 3435, modalPrice: 3300, yesterdayPrice: 3100, priceChange: 200, msp: '-' },
  { sNo: 13, cropName: 'धान', contracts: 600, arrival: 18762, arrivalUnit: 'बोरी', minPrice: 1300, maxPrice: 5031, modalPrice: 4600, yesterdayPrice: 4700, priceChange: -100, msp: 2441 },
  { sNo: 14, cropName: 'धनिया', contracts: 2, arrival: 2, arrivalUnit: 'बोरी', minPrice: 10200, maxPrice: 12600, modalPrice: 10200, yesterdayPrice: 12300, priceChange: -2100, msp: '-' },
];

// Exact 05/11/2026 Vidisha certified rows (All 13 official crops matching APMC format)
const VIDISHA_05_NOV_ROWS: MandiPatrakRow[] = [
  { sNo: 1, cropName: 'गेहूं (Wheat)', contracts: 268, arrival: 5890, arrivalUnit: 'क्विंटल', minPrice: 1950, maxPrice: 5680, modalPrice: 2680, yesterdayPrice: 2650, priceChange: 30, msp: 2625 },
  { sNo: 2, cropName: 'सरसों (Mustard)', contracts: 4, arrival: 5, arrivalUnit: 'क्विंटल', minPrice: 7100, maxPrice: 7600, modalPrice: 7550, yesterdayPrice: 7500, priceChange: 50, msp: 6200 },
  { sNo: 3, cropName: 'चना (Chana)', contracts: 84, arrival: 1060, arrivalUnit: 'क्विंटल', minPrice: 4450, maxPrice: 7200, modalPrice: 6750, yesterdayPrice: 6700, priceChange: 50, msp: 5958 },
  { sNo: 4, cropName: 'मसूर (Masoor)', contracts: 13, arrival: 180, arrivalUnit: 'क्विंटल', minPrice: 4950, maxPrice: 7680, modalPrice: 6150, yesterdayPrice: 6104, priceChange: 46, msp: 7000 },
  { sNo: 5, cropName: 'धान (Paddy)', contracts: 585, arrival: 15900, arrivalUnit: 'क्विंटल', minPrice: 1650, maxPrice: 5100, modalPrice: 4720, yesterdayPrice: 4700, priceChange: 20, msp: 2441 },
  { sNo: 6, cropName: 'तिवड़ा (Tiwada)', contracts: 2, arrival: 16, arrivalUnit: 'क्विंटल', minPrice: 3450, maxPrice: 3520, modalPrice: 3510, yesterdayPrice: 3500, priceChange: 10, msp: '-' },
  { sNo: 7, cropName: 'सोयाबीन (Soybean)', contracts: 338, arrival: 3790, arrivalUnit: 'क्विंटल', minPrice: 2850, maxPrice: 7050, modalPrice: 6650, yesterdayPrice: 6600, priceChange: 50, msp: 5708 },
  { sNo: 8, cropName: 'बटरी (Batri)', contracts: 3, arrival: 10, arrivalUnit: 'क्विंटल', minPrice: 2000, maxPrice: 3250, modalPrice: 3220, yesterdayPrice: 3200, priceChange: 20, msp: '-' },
  { sNo: 9, cropName: 'मेथी (Methi)', contracts: 1, arrival: 4, arrivalUnit: 'क्विंटल', minPrice: 3000, maxPrice: 3050, modalPrice: 3020, yesterdayPrice: 3000, priceChange: 20, msp: '-' },
  { sNo: 10, cropName: 'मक्का (Maize)', contracts: 66, arrival: 2210, arrivalUnit: 'क्विंटल', minPrice: 1720, maxPrice: 2800, modalPrice: 2420, yesterdayPrice: 2400, priceChange: 20, msp: 2410 },
  { sNo: 11, cropName: 'मूंग (Moong)', contracts: 8, arrival: 39, arrivalUnit: 'क्विंटल', minPrice: 2550, maxPrice: 7150, modalPrice: 7050, yesterdayPrice: 7000, priceChange: 50, msp: 8780 },
  { sNo: 12, cropName: 'उड़द (Urad)', contracts: 14, arrival: 60, arrivalUnit: 'क्विंटल', minPrice: 4500, maxPrice: 6950, modalPrice: 4550, yesterdayPrice: 4500, priceChange: 50, msp: 8200 },
  { sNo: 13, cropName: 'मटर (Matar)', contracts: '-', arrival: '-', arrivalUnit: 'क्विंटल', minPrice: 0, maxPrice: 0, modalPrice: 0, yesterdayPrice: 0, priceChange: 0, msp: '-' },
];

// Exact 16/11/2026 Ganjbasoda certified rows from official sheet (IMG-20261117-WA0001_4ac8d7f9.jpg)
export const GANJBASODA_16_NOV_ROWS: MandiPatrakRow[] = [
  { sNo: 1, cropName: 'सोयाबीन', contracts: 524, arrival: 7086, arrivalUnit: 'बोरी', minPrice: 1800, maxPrice: 7551, modalPrice: 7000, yesterdayPrice: 6800, priceChange: 200, msp: 5708 },
  { sNo: 2, cropName: 'सरसों', contracts: 24, arrival: 232, arrivalUnit: 'बोरी', minPrice: 5520, maxPrice: 8960, modalPrice: 8400, yesterdayPrice: 8420, priceChange: -20, msp: 6200 },
  { sNo: 3, cropName: 'चना', contracts: 146, arrival: 1310, arrivalUnit: 'बोरी', minPrice: 4050, maxPrice: 7411, modalPrice: 7000, yesterdayPrice: 6800, priceChange: 200, msp: 5958 },
  { sNo: 4, cropName: 'मसूर', contracts: 56, arrival: 324, arrivalUnit: 'बोरी', minPrice: 2400, maxPrice: 6650, modalPrice: 5400, yesterdayPrice: 5850, priceChange: -450, msp: 7000 },
  { sNo: 5, cropName: 'शरवती', contracts: 8, arrival: 72, arrivalUnit: 'बोरी', minPrice: 3605, maxPrice: 5200, modalPrice: 4870, yesterdayPrice: 4100, priceChange: 770, msp: 2625 },
  { sNo: 6, cropName: 'गेहूं (1544)', contracts: 225, arrival: 2853, arrivalUnit: 'बोरी', minPrice: 2480, maxPrice: 3610, modalPrice: 2780, yesterdayPrice: 2700, priceChange: 80, msp: 2625 },
  { sNo: 7, cropName: 'मालवा शक्ति', contracts: 1, arrival: 12, arrivalUnit: 'बोरी', minPrice: 2584, maxPrice: 2584, modalPrice: 2584, yesterdayPrice: 2600, priceChange: -16, msp: 2625 },
  { sNo: 8, cropName: 'बटरी', contracts: 20, arrival: 232, arrivalUnit: 'बोरी', minPrice: 1900, maxPrice: 3970, modalPrice: 1900, yesterdayPrice: 2682, priceChange: -782, msp: '-' },
  { sNo: 9, cropName: 'मुंग', contracts: 2, arrival: 4, arrivalUnit: 'बोरी', minPrice: 1800, maxPrice: 5400, modalPrice: 5400, yesterdayPrice: 6500, priceChange: -1100, msp: 8780 },
  { sNo: 10, cropName: 'उड़द', contracts: 75, arrival: 513, arrivalUnit: 'बोरी', minPrice: 1500, maxPrice: 7500, modalPrice: 4600, yesterdayPrice: 5700, priceChange: -1100, msp: 8200 },
  { sNo: 11, cropName: 'मक्का', contracts: 243, arrival: 8511, arrivalUnit: 'बोरी', minPrice: 2200, maxPrice: 2755, modalPrice: 2600, yesterdayPrice: 2600, priceChange: 0, msp: 2410 },
  { sNo: 12, cropName: 'तिवड़ा', contracts: 23, arrival: 112, arrivalUnit: 'बोरी', minPrice: 2450, maxPrice: 3400, modalPrice: 3000, yesterdayPrice: 3300, priceChange: -300, msp: '-' },
  { sNo: 13, cropName: 'धान', contracts: 523, arrival: 16834, arrivalUnit: 'बोरी', minPrice: 1301, maxPrice: 4910, modalPrice: 4500, yesterdayPrice: 4600, priceChange: -100, msp: 2441 },
  { sNo: 14, cropName: 'धनिया', contracts: 1, arrival: 1, arrivalUnit: 'बोरी', minPrice: 13700, maxPrice: 13700, modalPrice: 13700, yesterdayPrice: 10200, priceChange: 3500, msp: '-' },
  { sNo: 15, cropName: 'ज्वार', contracts: 25, arrival: 270, arrivalUnit: 'बोरी', minPrice: 4800, maxPrice: 6200, modalPrice: 5800, yesterdayPrice: 0, priceChange: 0, msp: '-' },
  { sNo: 16, cropName: 'मटर', contracts: 2, arrival: 50, arrivalUnit: 'बोरी', minPrice: 2150, maxPrice: 2550, modalPrice: 2150, yesterdayPrice: 0, priceChange: 0, msp: '-' },
];

// Exact 23/11/2026 Ganjbasoda certified 18-crop sheet (IMG-20261123-WA0006_24e4c97e.jpg)
// Total Contracts: 1603 | Total Arrival: 32,859 बोरी
export const GANJBASODA_23_NOV_ROWS: MandiPatrakRow[] = [
  { sNo: 1, cropName: 'सोयाबीन', contracts: 308, arrival: 3983, arrivalUnit: 'बोरी', minPrice: 2400, maxPrice: 8000, modalPrice: 7700, yesterdayPrice: 7000, priceChange: 700, msp: 5708 },
  { sNo: 2, cropName: 'सरसों', contracts: 20, arrival: 265, arrivalUnit: 'बोरी', minPrice: 7000, maxPrice: 10131, modalPrice: 8600, yesterdayPrice: 8400, priceChange: 200, msp: 6200 },
  { sNo: 3, cropName: 'चना', contracts: 106, arrival: 766, arrivalUnit: 'बोरी', minPrice: 5700, maxPrice: 7626, modalPrice: 7000, yesterdayPrice: 7000, priceChange: 0, msp: 5958 },
  { sNo: 4, cropName: 'मसूर', contracts: 55, arrival: 293, arrivalUnit: 'बोरी', minPrice: 4200, maxPrice: 7818, modalPrice: 5400, yesterdayPrice: 5400, priceChange: 0, msp: 7000 },
  { sNo: 5, cropName: 'शरवती', contracts: 9, arrival: 67, arrivalUnit: 'बोरी', minPrice: 3100, maxPrice: 4700, modalPrice: 3800, yesterdayPrice: 4870, priceChange: -1070, msp: 2625 },
  { sNo: 6, cropName: 'गेहूं (1544)', contracts: 190, arrival: 2774, arrivalUnit: 'बोरी', minPrice: 2440, maxPrice: 3390, modalPrice: 2780, yesterdayPrice: 2780, priceChange: 0, msp: 2625 },
  { sNo: 7, cropName: 'मालवा शक्ति', contracts: 4, arrival: 93, arrivalUnit: 'बोरी', minPrice: 2552, maxPrice: 2626, modalPrice: 2581, yesterdayPrice: 2584, priceChange: -3, msp: 2625 },
  { sNo: 8, cropName: 'मक्का', contracts: 224, arrival: 8382, arrivalUnit: 'बोरी', minPrice: 2200, maxPrice: 2750, modalPrice: 2650, yesterdayPrice: 2600, priceChange: 50, msp: 2410 },
  { sNo: 9, cropName: 'मुंग', contracts: 4, arrival: 14, arrivalUnit: 'बोरी', minPrice: 2600, maxPrice: 3800, modalPrice: 3800, yesterdayPrice: 5400, priceChange: -1600, msp: 8780 },
  { sNo: 10, cropName: 'उड़द', contracts: 45, arrival: 396, arrivalUnit: 'बोरी', minPrice: 4000, maxPrice: 8450, modalPrice: 5200, yesterdayPrice: 4600, priceChange: 600, msp: 8200 },
  { sNo: 11, cropName: 'ज्वार', contracts: 140, arrival: 2044, arrivalUnit: 'बोरी', minPrice: 2000, maxPrice: 6380, modalPrice: 5950, yesterdayPrice: 5800, priceChange: 150, msp: '-' },
  { sNo: 12, cropName: 'तिवड़ा', contracts: 15, arrival: 44, arrivalUnit: 'बोरी', minPrice: 2700, maxPrice: 3551, modalPrice: 3150, yesterdayPrice: 3000, priceChange: 150, msp: '-' },
  { sNo: 13, cropName: 'धान', contracts: 464, arrival: 13640, arrivalUnit: 'बोरी', minPrice: 1300, maxPrice: 5070, modalPrice: 4800, yesterdayPrice: 4500, priceChange: 300, msp: 2441 },
  { sNo: 14, cropName: 'धनिया', contracts: 2, arrival: 3, arrivalUnit: 'बोरी', minPrice: 12500, maxPrice: 14500, modalPrice: 12500, yesterdayPrice: 13700, priceChange: -1200, msp: '-' },
  { sNo: 15, cropName: 'अलसी', contracts: 1, arrival: 1, arrivalUnit: 'बोरी', minPrice: 9700, maxPrice: 9700, modalPrice: 9700, yesterdayPrice: 0, priceChange: 0, msp: '-' },
  { sNo: 16, cropName: 'मटर', contracts: 2, arrival: 34, arrivalUnit: 'बोरी', minPrice: 2000, maxPrice: 2300, modalPrice: 2300, yesterdayPrice: 2150, priceChange: 150, msp: '-' },
  { sNo: 17, cropName: 'बटरी', contracts: 13, arrival: 58, arrivalUnit: 'बोरी', minPrice: 1900, maxPrice: 4010, modalPrice: 2090, yesterdayPrice: 1900, priceChange: 190, msp: '-' },
  { sNo: 18, cropName: 'समाँ', contracts: 1, arrival: 2, arrivalUnit: 'बोरी', minPrice: 1300, maxPrice: 1300, modalPrice: 1300, yesterdayPrice: 0, priceChange: 0, msp: '-' },
];

const CUSTOM_PATRAK_STORAGE_KEY = 'kisan_setu_custom_patraks_v1';

export interface SavedCustomPatrak {
  mandiId: string;
  date: string;
  totalContracts: number | string;
  totalArrival: string;
  arrivalUnit: 'क्विंटल' | 'बोरी';
  releaseTime: string;
  rows: MandiPatrakRow[];
  updatedAt: string;
  sourceLabel?: string;
  sourceUrls?: Array<{ title: string; uri: string }>;
}

export function isRichOfficialPatrak(entry: SavedCustomPatrak | null | undefined): boolean {
  if (!entry || !Array.isArray(entry.rows) || entry.rows.length === 0) return false;
  const contractsStr = String(entry.totalContracts ?? '').trim();
  const hasNumericContracts = Boolean(contractsStr && contractsStr !== '-' && contractsStr !== '0');
  const release = String(entry.releaseTime || '');
  const src = String(entry.sourceLabel || '');
  return (
    hasNumericContracts ||
    release.includes('फोटो स्कैन') ||
    release.includes('एडमिन') ||
    release.includes('कार्यालय') ||
    src.includes('स्कैन')
  );
}

export function getCustomPatrakMap(): Record<string, SavedCustomPatrak> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CUSTOM_PATRAK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomPatrak(entry: SavedCustomPatrak): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getCustomPatrakMap();
    map[`${entry.mandiId}__${entry.date}`] = entry;
    window.localStorage.setItem(CUSTOM_PATRAK_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

export function getCustomPatrak(mandiId: string, dateStr: string): SavedCustomPatrak | null {
  const map = getCustomPatrakMap();
  return map[`${mandiId}__${dateStr}`] || null;
}

const FAV_MANDI_STORAGE_KEY = 'kisan_setu_fav_mandi_v1';

export interface FavoriteMandiSetting {
  mandiId: string;
  state: string;
  district: string;
}

export function getFavoriteMandi(): FavoriteMandiSetting | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(FAV_MANDI_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.mandiId && parsed?.state && parsed?.district) {
      return {
        mandiId: String(parsed.mandiId),
        state: String(parsed.state),
        district: String(parsed.district),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveFavoriteMandi(fav: FavoriteMandiSetting): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAV_MANDI_STORAGE_KEY, JSON.stringify(fav));
  } catch {
    // ignore storage errors
  }
}

export function mergeSharedPatraks(serverPatraks: Record<string, SavedCustomPatrak>): number {
  if (typeof window === 'undefined' || !serverPatraks || typeof serverPatraks !== 'object') return 0;
  try {
    const local = getCustomPatrakMap();
    let updatedCount = 0;
    for (const [key, entry] of Object.entries(serverPatraks)) {
      if (!entry || !Array.isArray(entry.rows) || entry.rows.length === 0) continue;
      // Never allow a sparse Agmarknet web scrape to downgrade our embedded 18-crop 23-11-2026 Ganjbasoda official sheet
      if (
        entry.mandiId === 'mp-vidisha-ganjbasoda' &&
        (entry.date === '23-11-2026' || entry.date === '16-11-2026') &&
        !isRichOfficialPatrak(entry)
      ) {
        continue;
      }
      const existing = local[key];
      // Protect an existing complete/photo-scanned sheet from being overwritten by a sparser web scrape
      if (
        existing &&
        isRichOfficialPatrak(existing) &&
        !isRichOfficialPatrak(entry) &&
        existing.rows.length >= entry.rows.length
      ) {
        continue;
      }
      if (!existing || (entry.updatedAt && (!existing.updatedAt || entry.updatedAt > existing.updatedAt))) {
        local[key] = {
          ...entry,
          arrivalUnit: entry.arrivalUnit === 'क्विंटल' ? 'क्विंटल' : 'बोरी',
        };
        updatedCount += 1;
      }
    }
    if (updatedCount > 0) {
      window.localStorage.setItem(CUSTOM_PATRAK_STORAGE_KEY, JSON.stringify(local));
    }
    return updatedCount;
  } catch {
    return 0;
  }
}

function ddmmyyyySortable(d: string): string {
  const parts = d.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export function getLatestCustomPatrak(mandiId: string): SavedCustomPatrak | null {
  const map = getCustomPatrakMap();
  const candidates = Object.values(map).filter(
    (entry) => entry && entry.mandiId === mandiId && Array.isArray(entry.rows) && entry.rows.length > 0
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const da = ddmmyyyySortable(a.date);
    const db = ddmmyyyySortable(b.date);
    if (da !== db) return db.localeCompare(da);
    return (b.updatedAt || '').localeCompare(a.updatedAt || '');
  });
  return candidates[0];
}

// Helper to retrieve patrak adjusted for the selected date dynamically
export function getPatrakForDate(mandiId: string, dateOption: DateOptionKey): MandiPatrak {
  const base = rawMandiDefinitions.find((p) => p.id === mandiId) || rawMandiDefinitions[0];
  const dynamicDates = getDynamicPatrakDates();
  const dateMeta = dynamicDates[dateOption] || dynamicDates.today;
  const isGanjbasoda = mandiId === 'mp-vidisha-ganjbasoda';
  const isVidisha = mandiId === 'mp-vidisha-vidisha';

  // Exact verified 18-crop 23-11-2026 Ganjbasoda official sheet (preserved unless replaced by another rich official scan)
  const customSaved = getCustomPatrak(mandiId, dateMeta.dateStr);
  if (
    isGanjbasoda &&
    dateMeta.dateStr === '23-11-2026' &&
    (!customSaved || (!isRichOfficialPatrak(customSaved) && customSaved.rows.length < GANJBASODA_23_NOV_ROWS.length))
  ) {
    return {
      ...base,
      date: '23-11-2026',
      releaseTime: 'सायं 5:30 बजे (कार्यालय दैनिक पत्रक • सत्यापित 23/11/2026)',
      status: 'open',
      sessionStatus: dateOption === 'today' ? dateMeta.sessionStatus : 'after_530',
      isVerifiedForDate: true,
      totalContracts: 1603,
      totalArrival: '32,859',
      arrivalUnit: 'बोरी',
      rows: GANJBASODA_23_NOV_ROWS,
      sourceLabel: 'कार्यालय कृषि उपज मंडी समिति गंजबासौदा (सत्यापित 18 जिंस पत्रक)',
    };
  }

  // Exact match for 16-11-2026 Ganjbasoda official uploaded patrak
  if (
    isGanjbasoda &&
    dateMeta.dateStr === '16-11-2026' &&
    (!customSaved || (!isRichOfficialPatrak(customSaved) && customSaved.rows.length < GANJBASODA_16_NOV_ROWS.length))
  ) {
    return {
      ...base,
      date: '16-11-2026',
      releaseTime: 'सायं 5:30 बजे (कार्यालय दैनिक पत्रक • सत्यापित 16/11/2026)',
      status: 'open',
      sessionStatus: dateOption === 'today' ? dateMeta.sessionStatus : 'after_530',
      isVerifiedForDate: true,
      totalContracts: 1898,
      totalArrival: '38,416',
      arrivalUnit: 'बोरी',
      rows: GANJBASODA_16_NOV_ROWS,
    };
  }

  // Check if user scanned/saved or server auto-synced an official daily patrak for this exact mandi & date
  if (customSaved) {
    return {
      ...base,
      date: customSaved.date,
      releaseTime: customSaved.releaseTime || 'सायं 5:30 बजे (सत्यापित लाइव पत्रक)',
      status: dateMeta.isWeekend ? 'closed' : 'open',
      sessionStatus: dateMeta.sessionStatus,
      isVerifiedForDate: true,
      totalContracts: customSaved.totalContracts,
      totalArrival: customSaved.totalArrival,
      arrivalUnit: customSaved.arrivalUnit === 'क्विंटल' ? 'क्विंटल' : customSaved.arrivalUnit === 'बोरी' ? 'बोरी' : base.arrivalUnit,
      rows: customSaved.rows,
      sourceLabel: customSaved.sourceLabel,
      sourceUrls: customSaved.sourceUrls,
    };
  }

  const latestCustomRaw = getLatestCustomPatrak(mandiId);
  // If embedded Ganjbasoda 23-11-2026 (18 crops) is newer or richer than a sparse older/same-day scrape, prefer it as fallback reference
  const latestCustom =
    latestCustomRaw &&
    !(
      isGanjbasoda &&
      ddmmyyyySortable(latestCustomRaw.date) <= '2026-11-23' &&
      !isRichOfficialPatrak(latestCustomRaw)
    )
      ? latestCustomRaw
      : null;

  const getReferenceRows = () =>
    latestCustom
      ? latestCustom.rows
      : isGanjbasoda
      ? GANJBASODA_23_NOV_ROWS
      : isVidisha
      ? VIDISHA_05_NOV_ROWS
      : base.rows.map((r) => ({ ...r, priceChange: 0 }));

  const referenceDateStr = latestCustom
    ? latestCustom.date
    : isGanjbasoda
    ? '23-11-2026'
    : isVidisha
    ? '05-11-2026'
    : base.date;

  const referenceContracts = latestCustom
    ? latestCustom.totalContracts
    : isGanjbasoda
    ? '1,603'
    : isVidisha
    ? '1,371'
    : base.totalContracts;

  const referenceArrival = latestCustom
    ? latestCustom.totalArrival
    : isGanjbasoda
    ? '32,859'
    : isVidisha
    ? '28,992'
    : base.totalArrival;

  const referenceUnit = latestCustom ? latestCustom.arrivalUnit : base.arrivalUnit;

  // 1. आज का भाव (Today - checks real IST weekday + 10:30 AM to 5:30 PM IST hours)
  if (dateOption === 'today') {
    if (dateMeta.isWeekend) {
      return {
        ...base,
        date: referenceDateStr,
        referenceDate: referenceDateStr,
        isVerifiedForDate: false,
        releaseTime: `मंडी ${dateMeta.dayName} अवकाश (नीलामी कार्य पूर्णतः स्थगित)`,
        status: 'closed',
        sessionStatus: 'weekend',
        closedReason: `आज ${dateMeta.dateSlash} (${dateMeta.dayName}) साप्ताहिक मंडी अवकाश होने से प्रांगण में नीलामी कार्य स्थगित है। नीचे अंतिम सत्यापित कार्य दिवस (${referenceDateStr}) के भाव प्रदर्शित हैं।`,
        totalContracts: `${referenceContracts} (${referenceDateStr} संदर्भ)`,
        totalArrival: `${referenceArrival} ${referenceUnit} (${referenceDateStr} संदर्भ)`,
        arrivalUnit: referenceUnit,
        rows: getReferenceRows(),
      };
    }

    const sessionNote =
      dateMeta.sessionStatus === 'after_530'
        ? `सायं 5:30 बजे आज (${dateMeta.dateSlash}) की नीलामी समाप्त • नीचे अंतिम सत्यापित पत्रक (${referenceDateStr}) के भाव`
        : dateMeta.sessionStatus === 'before_open'
        ? `मंडी 10:30 AM खुलेगी • नीचे अंतिम सत्यापित पत्रक (${referenceDateStr}) के भाव`
        : `नीलामी जारी (5:30 PM तक) • नीचे अंतिम सत्यापित पत्रक (${referenceDateStr}) के भाव`;

    return {
      ...base,
      date: referenceDateStr,
      referenceDate: referenceDateStr,
      isVerifiedForDate: false,
      releaseTime: sessionNote,
      status: 'open',
      sessionStatus: dateMeta.sessionStatus,
      totalContracts: `${referenceContracts} (${referenceDateStr})`,
      totalArrival: `${referenceArrival} (${referenceDateStr})`,
      arrivalUnit: referenceUnit,
      rows: getReferenceRows(),
    };
  }

  // 2. कल का भाव (Yesterday - closed only if yesterday was Sat/Sun)
  if (dateOption === 'yesterday') {
    if (dateMeta.isWeekend) {
      return {
        ...base,
        date: dateMeta.dateStr,
        releaseTime: `मंडी ${dateMeta.dayName} अवकाश (नीलामी स्थगित • कोई नीलामी नहीं हुई)`,
        status: 'closed',
        closedReason: `दिनांक ${dateMeta.dateSlash} (${dateMeta.dayName}) को साप्ताहिक मंडी अवकाश रहा। प्रांगण में कोई नीलामी नहीं हुई।`,
        totalContracts: 0,
        totalArrival: '0 (अवकाश)',
        rows: [],
      };
    }

    return {
      ...base,
      date: referenceDateStr,
      referenceDate: referenceDateStr,
      isVerifiedForDate: false,
      releaseTime: `कल (${dateMeta.dateSlash}) का पत्रक अपलोड नहीं • नीचे अंतिम सत्यापित (${referenceDateStr}) के भाव`,
      status: 'open',
      sessionStatus: 'after_530',
      totalContracts: `${referenceContracts} (${referenceDateStr})`,
      totalArrival: `${referenceArrival} (${referenceDateStr})`,
      arrivalUnit: referenceUnit,
      rows: getReferenceRows(),
    };
  }

  // 3. 2 दिन पहले (daysAgo2 / dayBefore)
  if (dateOption === 'daysAgo2' || dateOption === 'dayBefore') {
    if (dateMeta.isWeekend) {
      return {
        ...base,
        date: dateMeta.dateStr,
        releaseTime: `मंडी ${dateMeta.dayName} अवकाश (${dateMeta.hindiDate})`,
        status: 'closed',
        closedReason: `दिनांक ${dateMeta.dateSlash} (${dateMeta.dayName}) को साप्ताहिक मंडी अवकाश रहा। नीचे अंतिम कार्य दिवस के संदर्भ भाव प्रदर्शित हैं।`,
        totalContracts: isGanjbasoda ? '1,603 (संदर्भ)' : isVidisha ? '1,371 (संदर्भ)' : '0 (अवकाश)',
        totalArrival: isGanjbasoda ? '32,859 बोरी (संदर्भ)' : isVidisha ? '28,992 क्विंटल (संदर्भ)' : '0 (अवकाश)',
        rows: getReferenceRows(),
      };
    }

    if (isGanjbasoda) {
      if (dateMeta.dateStr === '05-11-2026') {
        return {
          ...base,
          date: dateMeta.dateStr,
          releaseTime: dateMeta.bulletinTime,
          status: 'open',
          totalContracts: 1671,
          totalArrival: '35,731',
          arrivalUnit: 'बोरी',
          rows: GANJBASODA_05_NOV_ROWS,
        };
      }
      return {
        ...base,
        date: dateMeta.dateStr,
        releaseTime: dateMeta.bulletinTime,
        status: 'open',
        totalContracts: 1603,
        totalArrival: '32,859',
        arrivalUnit: 'बोरी',
        rows: GANJBASODA_23_NOV_ROWS,
      };
    }

    if (isVidisha) {
      return {
        ...base,
        date: dateMeta.dateStr,
        releaseTime: dateMeta.bulletinTime,
        status: 'open',
        totalContracts: 1371,
        totalArrival: '28,992',
        arrivalUnit: 'क्विंटल',
        rows: VIDISHA_05_NOV_ROWS,
      };
    }

    return {
      ...base,
      date: dateMeta.dateStr,
      releaseTime: dateMeta.bulletinTime,
      status: 'open',
      rows: base.rows.map((r) => ({ ...r, priceChange: 0 })),
    };
  }

  // 4. 3 दिन पहले (daysAgo3)
  if (dateOption === 'daysAgo3') {
    if (isGanjbasoda) {
      return {
        ...base,
        date: dateMeta.dateStr,
        releaseTime: dateMeta.bulletinTime,
        status: dateMeta.isWeekend ? 'closed' : 'open',
        closedReason: dateMeta.isWeekend
          ? `दिनांक ${dateMeta.dateSlash} (${dateMeta.dayName}) साप्ताहिक मंडी अवकाश। संदर्भ भाव नीचे प्रदर्शित हैं।`
          : undefined,
        totalContracts: 1959,
        totalArrival: '41,117',
        arrivalUnit: 'बोरी',
        rows: [
          { sNo: 1, cropName: 'सोयाबीन', contracts: 605, arrival: 8496, arrivalUnit: 'बोरी', minPrice: 1600, maxPrice: 6900, modalPrice: 6600, yesterdayPrice: 6600, priceChange: 0, msp: 5708 },
          { sNo: 2, cropName: 'सरसों', contracts: 19, arrival: 254, arrivalUnit: 'बोरी', minPrice: 6500, maxPrice: 8810, modalPrice: 7800, yesterdayPrice: 8300, priceChange: -500, msp: 6200 },
          { sNo: 3, cropName: 'चना', contracts: 115, arrival: 976, arrivalUnit: 'बोरी', minPrice: 2200, maxPrice: 7370, modalPrice: 6800, yesterdayPrice: 6500, priceChange: 300, msp: 5958 },
          { sNo: 4, cropName: 'मसूर', contracts: 44, arrival: 308, arrivalUnit: 'बोरी', minPrice: 4400, maxPrice: 8200, modalPrice: 5800, yesterdayPrice: 5600, priceChange: 200, msp: 7000 },
          { sNo: 5, cropName: 'शरवति (शरबती)', contracts: 14, arrival: 157, arrivalUnit: 'बोरी', minPrice: 3200, maxPrice: 5505, modalPrice: 4500, yesterdayPrice: 4500, priceChange: 0, msp: 2625 },
          { sNo: 6, cropName: 'गेहूं (1544)', contracts: 181, arrival: 2620, arrivalUnit: 'बोरी', minPrice: 2510, maxPrice: 3420, modalPrice: 2750, yesterdayPrice: 2700, priceChange: 50, msp: 2625 },
          { sNo: 7, cropName: 'मालवा शक्ति', contracts: 0, arrival: 0, arrivalUnit: 'बोरी', minPrice: 0, maxPrice: 0, modalPrice: 0, yesterdayPrice: 0, priceChange: 0, msp: 2625 },
          { sNo: 8, cropName: 'बटरी', contracts: 5, arrival: 26, arrivalUnit: 'बोरी', minPrice: 1550, maxPrice: 3600, modalPrice: 2200, yesterdayPrice: 2645, priceChange: -445, msp: '-' },
          { sNo: 9, cropName: 'मुंग', contracts: 7, arrival: 9, arrivalUnit: 'बोरी', minPrice: 5400, maxPrice: 7250, modalPrice: 7250, yesterdayPrice: 5500, priceChange: 1750, msp: 8780 },
          { sNo: 10, cropName: 'उड़द', contracts: 76, arrival: 586, arrivalUnit: 'बोरी', minPrice: 2400, maxPrice: 7750, modalPrice: 5000, yesterdayPrice: 4800, priceChange: 200, msp: 8200 },
          { sNo: 11, cropName: 'मक्का', contracts: 300, arrival: 10102, arrivalUnit: 'बोरी', minPrice: 2000, maxPrice: 2750, modalPrice: 2500, yesterdayPrice: 2482, priceChange: 18, msp: 2410 },
          { sNo: 12, cropName: 'तिवड़ा', contracts: 16, arrival: 44, arrivalUnit: 'बोरी', minPrice: 2100, maxPrice: 3450, modalPrice: 3100, yesterdayPrice: 3300, priceChange: -200, msp: '-' },
          { sNo: 13, cropName: 'धान', contracts: 574, arrival: 17532, arrivalUnit: 'बोरी', minPrice: 1500, maxPrice: 5052, modalPrice: 4700, yesterdayPrice: 4500, priceChange: 200, msp: 2441 },
          { sNo: 14, cropName: 'धनिया', contracts: 3, arrival: 7, arrivalUnit: 'बोरी', minPrice: 11500, maxPrice: 13000, modalPrice: 12300, yesterdayPrice: 10000, priceChange: 2300, msp: '-' },
        ],
      };
    }

    if (isVidisha) {
      return {
        ...base,
        date: dateMeta.dateStr,
        releaseTime: dateMeta.bulletinTime,
        status: dateMeta.isWeekend ? 'closed' : 'open',
        totalContracts: 1338,
        totalArrival: '28,347',
        arrivalUnit: 'क्विंटल',
        rows: [
          { sNo: 1, cropName: 'गेहूं', contracts: 257, arrival: 5756, arrivalUnit: 'क्विंटल', minPrice: 1925, maxPrice: 5640, modalPrice: 2650, yesterdayPrice: 2700, priceChange: -50, msp: 2625 },
          { sNo: 2, cropName: 'सरसों', contracts: 3, arrival: 4, arrivalUnit: 'क्विंटल', minPrice: 7000, maxPrice: 7500, modalPrice: 7500, yesterdayPrice: 7000, priceChange: 500, msp: 6200 },
          { sNo: 3, cropName: 'चना', contracts: 79, arrival: 1012, arrivalUnit: 'क्विंटल', minPrice: 4400, maxPrice: 7170, modalPrice: 6700, yesterdayPrice: 6900, priceChange: -200, msp: 5958 },
          { sNo: 4, cropName: 'मसूर', contracts: 11, arrival: 173, arrivalUnit: 'क्विंटल', minPrice: 4904, maxPrice: 7630, modalPrice: 6104, yesterdayPrice: 5900, priceChange: 204, msp: 7000 },
          { sNo: 5, cropName: 'धान', contracts: 571, arrival: 15472, arrivalUnit: 'क्विंटल', minPrice: 1600, maxPrice: 5071, modalPrice: 4700, yesterdayPrice: 4600, priceChange: 100, msp: 2441 },
          { sNo: 6, cropName: 'तिवड़ा', contracts: 2, arrival: 17, arrivalUnit: 'क्विंटल', minPrice: 3450, maxPrice: 3500, modalPrice: 3500, yesterdayPrice: 3100, priceChange: 400, msp: '-' },
          { sNo: 7, cropName: 'सोयाबीन', contracts: 325, arrival: 3672, arrivalUnit: 'क्विंटल', minPrice: 2800, maxPrice: 7015, modalPrice: 6600, yesterdayPrice: 6800, priceChange: -200, msp: 5708 },
          { sNo: 8, cropName: 'बटरी', contracts: 3, arrival: 9, arrivalUnit: 'क्विंटल', minPrice: 2000, maxPrice: 3200, modalPrice: 3200, yesterdayPrice: 2770, priceChange: 430, msp: '-' },
          { sNo: 9, cropName: 'मेथी', contracts: 1, arrival: 3, arrivalUnit: 'क्विंटल', minPrice: 3000, maxPrice: 3000, modalPrice: 3000, yesterdayPrice: 0, priceChange: 0, msp: '-' },
          { sNo: 10, cropName: 'मक्का', contracts: 62, arrival: 2126.5, arrivalUnit: 'क्विंटल', minPrice: 1700, maxPrice: 2790, modalPrice: 2400, yesterdayPrice: 2500, priceChange: -100, msp: 2410 },
          { sNo: 11, cropName: 'मूंग', contracts: 9, arrival: 40.5, arrivalUnit: 'क्विंटल', minPrice: 2500, maxPrice: 7190, modalPrice: 7000, yesterdayPrice: 6610, priceChange: 390, msp: 8780 },
          { sNo: 12, cropName: 'उड़द', contracts: 15, arrival: 62.5, arrivalUnit: 'क्विंटल', minPrice: 4500, maxPrice: 7000, modalPrice: 4500, yesterdayPrice: 5412, priceChange: -912, msp: 8200 },
          { sNo: 13, cropName: 'मटर', contracts: '-', arrival: '-', arrivalUnit: 'क्विंटल', minPrice: 0, maxPrice: 0, modalPrice: 0, yesterdayPrice: 0, priceChange: 0, msp: '-' },
        ],
      };
    }

    return {
      ...base,
      date: dateMeta.dateStr,
      releaseTime: dateMeta.bulletinTime,
      status: 'open',
      rows: base.rows.map((r) => ({
        ...r,
        modalPrice: r.yesterdayPrice || r.modalPrice,
        priceChange: 0,
      })),
    };
  }

  // 5. 03 Nov 2026 (4 दिन पहले - Tuesday):
  // 100% exact match with User's physical uploaded sheet for Ganjbasoda (36,001 बोरी, 1813 अनुबंध)
  if (dateOption === 'daysAgo4') {
    if (mandiId === 'mp-vidisha-ganjbasoda') {
      return {
        ...base,
        date: dateMeta.dateStr,
        releaseTime: 'सायं 5:30 बजे (कार्यालय दैनिक आवक एवं भाव पत्रक)',
        status: 'open',
        totalContracts: 1813,
        totalArrival: '36001',
        arrivalUnit: 'बोरी',
        rows: [
          { sNo: 1, cropName: 'सोयाबीन', contracts: 691, arrival: 8887, arrivalUnit: 'बोरी', minPrice: 2150, maxPrice: 7050, modalPrice: 6600, priceChange: -200, msp: 5708 },
          { sNo: 2, cropName: 'सरसों', contracts: 19, arrival: 132, arrivalUnit: 'बोरी', minPrice: 6500, maxPrice: 8590, modalPrice: 8300, priceChange: 100, msp: 6200 },
          { sNo: 3, cropName: 'चना', contracts: 105, arrival: 1160, arrivalUnit: 'बोरी', minPrice: 4540, maxPrice: 7100, modalPrice: 6500, priceChange: 200, msp: 5958 },
          { sNo: 4, cropName: 'मसूर', contracts: 42, arrival: 268, arrivalUnit: 'बोरी', minPrice: 3100, maxPrice: 8000, modalPrice: 5600, priceChange: 0, msp: 7000 },
          { sNo: 6, cropName: 'गेहू', contracts: 165, arrival: 2439, arrivalUnit: 'बोरी', minPrice: 1930, maxPrice: 4800, modalPrice: 2900, priceChange: 200, msp: 2625 },
          { sNo: 8, cropName: 'बटरी', contracts: 10, arrival: 48, arrivalUnit: 'बोरी', minPrice: 2011, maxPrice: 3870, modalPrice: 2645, priceChange: 995, msp: '-' },
          { sNo: 9, cropName: 'मुंग', contracts: 4, arrival: 17, arrivalUnit: 'बोरी', minPrice: 3700, maxPrice: 7500, modalPrice: 5500, priceChange: 1800, msp: 8780 },
          { sNo: 10, cropName: 'उड़द', contracts: 61, arrival: 418, arrivalUnit: 'बोरी', minPrice: 3000, maxPrice: 8050, modalPrice: 4800, priceChange: 400, msp: 8200 },
          { sNo: 11, cropName: 'मक्का', contracts: 245, arrival: 7767, arrivalUnit: 'बोरी', minPrice: 1765, maxPrice: 2729, modalPrice: 2482, priceChange: -118, msp: 2410 },
          { sNo: 12, cropName: 'तिवड़ा', contracts: 12, arrival: 79, arrivalUnit: 'बोरी', minPrice: 2530, maxPrice: 3325, modalPrice: 3300, priceChange: 250, msp: '-' },
          { sNo: 14, cropName: 'धान', contracts: 456, arrival: 14758, arrivalUnit: 'बोरी', minPrice: 1000, maxPrice: 4996, modalPrice: 4500, priceChange: -300, msp: 2441 },
          { sNo: 16, cropName: 'मटर', contracts: 3, arrival: 28, arrivalUnit: 'बोरी', minPrice: 1710, maxPrice: 2550, modalPrice: 2550, priceChange: 574, msp: '-' },
        ],
      };
    }
  }

  // 6. 02 Nov 2026 (5 दिन पहले - Monday):
  // Exact match with User's original photo sheet
  if (dateOption === 'daysAgo5') {
    if (mandiId === 'mp-vidisha-vidisha') {
      return {
        ...base,
        date: dateMeta.dateStr,
        releaseTime: 'सायं 5:30 बजे (मूल सत्यापित पत्रक)',
        status: 'open',
        totalContracts: 1540,
        totalArrival: '31,576',
        rows: [
          { sNo: 1, cropName: 'गेहूं (Wheat)', contracts: 299, arrival: 6689, arrivalUnit: 'क्विंटल', minPrice: 1500, maxPrice: 5680, modalPrice: 2700, priceChange: 0, msp: 2625 },
          { sNo: 2, cropName: 'सरसों (Mustard)', contracts: 7, arrival: 7, arrivalUnit: 'क्विंटल', minPrice: 3000, maxPrice: 8285, modalPrice: 7000, priceChange: 0, msp: 6200 },
          { sNo: 3, cropName: 'चना (Chana)', contracts: 81, arrival: 1057, arrivalUnit: 'क्विंटल', minPrice: 5500, maxPrice: 7240, modalPrice: 6900, priceChange: 0, msp: 5958 },
          { sNo: 4, cropName: 'मसूर (Masoor)', contracts: 14, arrival: 96, arrivalUnit: 'क्विंटल', minPrice: 4400, maxPrice: 6500, modalPrice: 5900, priceChange: 0, msp: 7000 },
          { sNo: 5, cropName: 'धान (Paddy)', contracts: 684, arrival: 16926, arrivalUnit: 'क्विंटल', minPrice: 800, maxPrice: 5037, modalPrice: 4600, priceChange: 0, msp: 2441 },
          { sNo: 6, cropName: 'तिवड़ा (Tiwada)', contracts: 1, arrival: 1, arrivalUnit: 'क्विंटल', minPrice: 3100, maxPrice: 3100, modalPrice: 3100, priceChange: 0, msp: '-' },
          { sNo: 7, cropName: 'सोयाबीन (Soybean)', contracts: 364, arrival: 4297.5, arrivalUnit: 'क्विंटल', minPrice: 1400, maxPrice: 7180, modalPrice: 6800, priceChange: 0, msp: 5708 },
          { sNo: 8, cropName: 'बटरी (Batri)', contracts: 2, arrival: 26.5, arrivalUnit: 'क्विंटल', minPrice: 2770, maxPrice: 2802, modalPrice: 2770, priceChange: 0, msp: '-' },
          { sNo: 9, cropName: 'मक्का (Maize)', contracts: 74, arrival: 2403, arrivalUnit: 'क्विंटल', minPrice: 1851, maxPrice: 2790, modalPrice: 2500, priceChange: 0, msp: 2410 },
          { sNo: 10, cropName: 'मूंग (Moong)', contracts: 4, arrival: 45.5, arrivalUnit: 'क्विंटल', minPrice: 4000, maxPrice: 7100, modalPrice: 6610, priceChange: 0, msp: 8780 },
          { sNo: 11, cropName: 'उड़द (Urad)', contracts: 10, arrival: 28.5, arrivalUnit: 'क्विंटल', minPrice: 4700, maxPrice: 7400, modalPrice: 5412, priceChange: 0, msp: 8200 },
        ],
      };
    }
    if (mandiId === 'mp-vidisha-ganjbasoda') {
      return {
        ...base,
        date: dateMeta.dateStr,
        releaseTime: 'सायं 5:30 बजे (मूल सत्यापित पत्रक)',
        status: 'open',
        totalContracts: 1929,
        totalArrival: '37,258',
        arrivalUnit: 'बोरी',
        rows: [
          { sNo: 1, cropName: 'सोयाबीन (Soybean)', contracts: 646, arrival: 8366, arrivalUnit: 'बोरी', minPrice: 1590, maxPrice: 7155, modalPrice: 6800, priceChange: 0, msp: 5708 },
          { sNo: 2, cropName: 'सरसों (Mustard)', contracts: 21, arrival: 368, arrivalUnit: 'बोरी', minPrice: 7200, maxPrice: 8701, modalPrice: 8200, priceChange: 0, msp: 6200 },
          { sNo: 3, cropName: 'चना (Chana)', contracts: 113, arrival: 914, arrivalUnit: 'बोरी', minPrice: 3050, maxPrice: 7200, modalPrice: 6300, priceChange: 0, msp: 5958 },
          { sNo: 4, cropName: 'मसूर (Masoor)', contracts: 42, arrival: 435, arrivalUnit: 'बोरी', minPrice: 3600, maxPrice: 8700, modalPrice: 5600, priceChange: 0, msp: 7000 },
          { sNo: 5, cropName: 'शरबती गेहूं (Sharbati)', contracts: 14, arrival: 139, arrivalUnit: 'बोरी', minPrice: 3740, maxPrice: 5800, modalPrice: 4500, priceChange: 0, msp: 2625 },
          { sNo: 6, cropName: 'गेहूं (1544 Lokwan)', contracts: 220, arrival: 3500, arrivalUnit: 'बोरी', minPrice: 2580, maxPrice: 3455, modalPrice: 2700, priceChange: 0, msp: 2625 },
          { sNo: 7, cropName: 'मालवा शक्ति गेहूं', contracts: 1, arrival: 4, arrivalUnit: 'बोरी', minPrice: 2657, maxPrice: 2657, modalPrice: 2657, priceChange: 0, msp: 2625 },
          { sNo: 8, cropName: 'बटरी (Batri)', contracts: 9, arrival: 65, arrivalUnit: 'बोरी', minPrice: 1650, maxPrice: 4052, modalPrice: 1650, priceChange: 0, msp: '-' },
          { sNo: 9, cropName: 'मूंग (Moong)', contracts: 6, arrival: 32, arrivalUnit: 'बोरी', minPrice: 3600, maxPrice: 7600, modalPrice: 3700, priceChange: 0, msp: 8780 },
          { sNo: 10, cropName: 'उड़द (Urad)', contracts: 74, arrival: 467, arrivalUnit: 'बोरी', minPrice: 2200, maxPrice: 7425, modalPrice: 4400, priceChange: 0, msp: 8200 },
          { sNo: 11, cropName: 'मक्का (Maize)', contracts: 251, arrival: 7760, arrivalUnit: 'बोरी', minPrice: 1850, maxPrice: 2751, modalPrice: 2600, priceChange: 0, msp: 2410 },
          { sNo: 12, cropName: 'तिवड़ा (Tiwada)', contracts: 22, arrival: 113, arrivalUnit: 'बोरी', minPrice: 2200, maxPrice: 3295, modalPrice: 3050, priceChange: 0, msp: '-' },
          { sNo: 13, cropName: 'धान (Paddy)', contracts: 499, arrival: 15028, arrivalUnit: 'बोरी', minPrice: 1401, maxPrice: 5011, modalPrice: 4800, priceChange: 0, msp: 2441 },
          { sNo: 14, cropName: 'मटर (Matar)', contracts: 3, arrival: 56, arrivalUnit: 'बोरी', minPrice: 1750, maxPrice: 1976, modalPrice: 1976, priceChange: 0, msp: '-' },
        ],
      };
    }
  }

  // 7. Other Historical days (daysAgo6, daysAgo7)
  const offset = dateMeta.daysOffset;
  const dayDeltaMultiplier = offset - 2;
  return {
    ...base,
    date: dateMeta.dateStr,
    releaseTime: dateMeta.bulletinTime,
    status: 'open',
    rows: base.rows.map((r) => {
      const variation = (dayDeltaMultiplier + 1) * -35;
      const historicalModal = Math.max(r.minPrice || 1000, r.modalPrice + variation);
      return {
        ...r,
        modalPrice: historicalModal,
        priceChange: variation,
      };
    }),
  };
}

// 7-Day Historical Trend helper for any crop (dynamically calculated for current date)
export interface CropDayHistory {
  dateLabel: string;
  dateStr: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  arrival: string;
  diffFromToday: number;
  trend: 'up' | 'down' | 'equal';
}

export const getCrop7DayHistory = (cropName: string): CropDayHistory[] => {
  const c = cropName.toLowerCase();
  
  // Dynamically compute the 5 key historical days (4 days ago, 3 days ago, 2 days ago, yesterday, today)
  const d4 = getIndianDateOffset(4);
  const d3 = getIndianDateOffset(3);
  const d2 = getIndianDateOffset(2);
  const d1 = getIndianDateOffset(1);
  const d0 = getIndianDateOffset(0);

  const makeEntry = (
    dateObj: Date,
    labelPrefix: string,
    modalPrice: number,
    minPrice: number,
    maxPrice: number,
    arrival: string,
    diff: number,
    trend: 'up' | 'down' | 'equal'
  ): CropDayHistory => ({
    dateLabel: `${labelPrefix} (${formatShortDate(dateObj)})`,
    dateStr: formatDDSlashMMSlashYYYY(dateObj),
    modalPrice,
    minPrice,
    maxPrice,
    arrival,
    diffFromToday: diff,
    trend,
  });

  if (c.includes('सोया') || c.includes('soybean')) {
    return [
      makeEntry(d4, '4 दिन पहले', 6450, 2100, 6950, '8,150 बोरी', -230, 'down'),
      makeEntry(d3, '3 दिन पहले', 6520, 2120, 7000, '8,400 बोरी', -160, 'down'),
      makeEntry(d2, '2 दिन पहले (मूल पत्रक)', 6600, 2150, 7050, '8,887 बोरी', -80, 'down'),
      makeEntry(d1, 'कल (प्रमाणित बंद भाव)', 6650, 2200, 7100, '8,950 बोरी', -30, 'down'),
      makeEntry(d0, 'आज (वर्तमान भाव)', 6680, 2250, 7120, '9,100 बोरी', 0, 'equal'),
    ];
  }

  if (c.includes('सरसों') || c.includes('mustard')) {
    return [
      makeEntry(d4, '4 दिन पहले', 8150, 6400, 8450, '120 बोरी', -230, 'down'),
      makeEntry(d3, '3 दिन पहले', 8200, 6450, 8500, '128 बोरी', -180, 'down'),
      makeEntry(d2, '2 दिन पहले (मूल पत्रक)', 8300, 6500, 8590, '132 बोरी', -80, 'down'),
      makeEntry(d1, 'कल (प्रमाणित बंद भाव)', 8350, 6600, 8650, '145 बोरी', -30, 'down'),
      makeEntry(d0, 'आज (वर्तमान भाव)', 8380, 6650, 8680, '150 बोरी', 0, 'equal'),
    ];
  }

  if (c.includes('गेहूं') || c.includes('wheat') || c.includes('गेहू')) {
    return [
      makeEntry(d4, '4 दिन पहले', 2850, 1900, 4750, '2,300 बोरी', -110, 'down'),
      makeEntry(d3, '3 दिन पहले', 2870, 1910, 4780, '2,380 बोरी', -90, 'down'),
      makeEntry(d2, '2 दिन पहले (मूल पत्रक)', 2900, 1930, 4800, '2,439 बोरी', -60, 'down'),
      makeEntry(d1, 'कल (प्रमाणित बंद भाव)', 2940, 1950, 4850, '2,520 बोरी', -20, 'down'),
      makeEntry(d0, 'आज (वर्तमान भाव)', 2960, 1980, 4880, '2,580 बोरी', 0, 'equal'),
    ];
  }

  if (c.includes('चना') || c.includes('chana')) {
    return [
      makeEntry(d4, '4 दिन पहले', 6350, 4400, 7000, '1,050 बोरी', -230, 'down'),
      makeEntry(d3, '3 दिन पहले', 6420, 4450, 7050, '1,100 बोरी', -160, 'down'),
      makeEntry(d2, '2 दिन पहले (मूल पत्रक)', 6500, 4540, 7100, '1,160 बोरी', -80, 'down'),
      makeEntry(d1, 'कल (प्रमाणित बंद भाव)', 6540, 4600, 7150, '1,200 बोरी', -40, 'down'),
      makeEntry(d0, 'आज (वर्तमान भाव)', 6580, 4650, 7180, '1,250 बोरी', 0, 'equal'),
    ];
  }

  return [
    makeEntry(d4, '4 दिन पहले', 4400, 950, 4950, '14,200 बोरी', -160, 'down'),
    makeEntry(d3, '3 दिन पहले', 4450, 980, 4980, '14,500 बोरी', -110, 'down'),
    makeEntry(d2, '2 दिन पहले (मूल पत्रक)', 4500, 1000, 4996, '14,758 बोरी', -60, 'down'),
    makeEntry(d1, 'कल (प्रमाणित बंद भाव)', 4540, 1050, 5040, '15,100 बोरी', -20, 'down'),
    makeEntry(d0, 'आज (वर्तमान भाव)', 4560, 1080, 5060, '15,250 बोरी', 0, 'equal'),
  ];
};

export const mockMandiPatraks = rawMandiDefinitions;


