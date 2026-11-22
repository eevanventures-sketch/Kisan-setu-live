export type Language = 'hi' | 'en';

export interface MandiItem {
  id: string;
  cropName: { hi: string; en: string };
  category: 'grain' | 'pulse' | 'oilseed' | 'vegetable' | 'cash_crop';
  mandi: { hi: string; en: string };
  state: { hi: string; en: string };
  district: { hi: string; en: string };
  minPrice: number;
  maxPrice: number;
  modalPrice: number; // Most common trading price
  msp?: number; // Minimum Support Price if applicable
  unit: string; // e.g. "₹/क्विंटल"
  arrivalDate: string;
  arrivalVolume: string; // e.g. "450 बोरी"
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  priceHistory: { date: string; price: number }[];
}

export interface DiseaseInfo {
  id: string;
  name: { hi: string; en: string };
  crop: { hi: string; en: string };
  cropCategory: string;
  severity: 'low' | 'medium' | 'high';
  imageUrl: string;
  symptoms: { hi: string[]; en: string[] };
  causes: { hi: string; en: string };
  organicRemedy: { hi: string[]; en: string[] };
  chemicalTreatment: { hi: string[]; en: string[] };
  preventiveMeasures: { hi: string[]; en: string[] };
  recommendedProducts: string[];
}

export interface WeatherDay {
  day: { hi: string; en: string };
  date: string;
  tempMax: number;
  tempMin: number;
  condition: { hi: string; en: string };
  icon: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'partly-cloudy';
  rainChance: number;
  humidity: number;
  windSpeed: number; // km/h
  soilMoisture: number; // %
  sprayAdvisory: {
    status: 'safe' | 'caution' | 'unsafe';
    message: { hi: string; en: string };
  };
  irrigationAdvisory: { hi: string; en: string };
}

export interface GovtScheme {
  id: string;
  title: { hi: string; en: string };
  shortDesc: { hi: string; en: string };
  ministry: { hi: string; en: string };
  benefit: { hi: string; en: string };
  subsidyPercentage?: string;
  targetFarmers: { hi: string; en: string };
  eligibility: { hi: string[]; en: string[] };
  requiredDocuments: { hi: string[]; en: string[] };
  applyProcess: { hi: string[]; en: string[] };
  officialLink: string;
  category: 'direct_benefit' | 'insurance' | 'subsidy' | 'credit' | 'soil_water';
}

export interface MarketListing {
  id: string;
  title: { hi: string; en: string };
  type: 'sell_crop' | 'rent_equipment' | 'seeds_fertilizer' | 'dairy_livestock' | 'farm_experience' | 'company_promo';
  price: number;
  priceUnit: { hi: string; en: string };
  quantity?: string;
  location: { hi: string; en: string };
  state: { hi: string; en: string };
  sellerName: string;
  phone: string;
  date: string;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  description: { hi: string; en: string };
  verified: boolean;
  likes?: number;
  // Promotion fields for pesticide companies & Krishi Seva Kendra dealers
  isCompanyPromo?: boolean;
  companyName?: string;
  discountOffer?: string;
  targetPestOrCrop?: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'expense' | 'income';
  category: string;
  amount: number;
  description: string;
  cropOrSeason?: string;
}

export interface ChopalPost {
  id: string;
  author: string;
  location: string;
  avatarBg: string;
  timeAgo: { hi: string; en: string };
  title: { hi: string; en: string };
  content: { hi: string; en: string };
  cropTag: string;
  likes: number;
  userLiked?: boolean;
  expertAnswer?: {
    expertName: string;
    designation: string;
    text: { hi: string; en: string };
  };
  commentsCount: number;
}
