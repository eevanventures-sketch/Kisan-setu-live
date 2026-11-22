import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockMandiItems } from '../data/mockData';
import { MandiItem } from '../types';
import { MandiPatrakView } from './MandiPatrakView';
import { AllIndiaBestRates } from './AllIndiaBestRates';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Volume2,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  Bell,
  X,
  Scale,
  Sparkles,
  FileSpreadsheet,
  LayoutGrid,
  Trophy,
} from 'lucide-react';
import { formatHindiDate, formatEnglishDate, getIndianNow } from '../utils/dateUtils';

export const MandiBhav: React.FC = () => {
  const { language, t, speakText } = useLanguage();

  const [viewMode, setViewMode] = useState<'patrak' | 'cards' | 'bestRates'>('patrak');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MandiItem | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  const states = useMemo(() => {
    const list = Array.from(new Set(mockMandiItems.map((item) => item.state[language])));
    return list;
  }, [language]);

  const filteredItems = useMemo(() => {
    return mockMandiItems.filter((item) => {
      const matchSearch =
        item.cropName[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.mandi[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.state[language].toLowerCase().includes(searchTerm.toLowerCase());

      const matchState = selectedState === 'all' || item.state[language] === selectedState;
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;

      return matchSearch && matchState && matchCategory;
    });
  }, [searchTerm, selectedState, selectedCategory, language]);

  const handleSpeakItem = (item: MandiItem) => {
    const text =
      language === 'hi'
        ? `${item.cropName.hi} का ${item.mandi.hi} मंडी में मॉडल भाव ₹${item.modalPrice} प्रति क्विंटल है। न्यूनतम भाव ₹${item.minPrice} और अधिकतम भाव ₹${item.maxPrice} है।`
        : `Model rate of ${item.cropName.en} in ${item.mandi.en} mandi is ₹${item.modalPrice} per quintal. Min price is ₹${item.minPrice} and Max price is ₹${item.maxPrice}.`;
    speakText(text);
  };

  const handleSetAlert = (cropName: string) => {
    setAlertSuccess(cropName);
    setTimeout(() => setAlertSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Subtitle */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                APMC 5:30 PM Live Bulletin
              </span>
              <span className="text-xs text-gray-600 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                {language === 'hi'
                  ? `दैनिक अद्यतन: ${formatHindiDate(getIndianNow())} (आज का भाव) • स्वतः 5:30 PM सिंक`
                  : `Daily Updated: ${formatEnglishDate(getIndianNow())} (Today) • Auto 5:30 PM Sync`}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
              {t.mandi.title[language]}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              {t.mandi.subtitle[language]}
            </p>
          </div>

          <button
            onClick={() => {
              const summary =
                language === 'hi'
                  ? 'आज की प्रमुख मंडियों में गेहूं 2780 रुपये, सरसों 6100 रुपये, सोयाबीन 4680 रुपये, और कपास 7420 रुपये प्रति क्विंटल दर्ज किया गया।'
                  : 'Today major mandi modal prices: Wheat at 2780 rupees, Mustard at 6100 rupees, Soybean at 4680 rupees, Cotton at 7420 rupees per quintal.';
              speakText(summary);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-emerald-700" />
            <span>{t.speakText[language]}</span>
          </button>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="mt-5 p-1 bg-gray-100 rounded-xl flex flex-wrap gap-1 border border-gray-200">
          <button
            onClick={() => setViewMode('patrak')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              viewMode === 'patrak'
                ? 'bg-emerald-800 text-amber-300 shadow-xs'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📋 दैनिक आवक-भाव पत्रक (5:30 PM बुलेटिन)</span>
            <span className="text-[10px] bg-amber-400 text-emerald-950 px-1.5 py-0.2 rounded font-extrabold uppercase">
              विदिशा/गंजबासौदा
            </span>
          </button>

          <button
            onClick={() => setViewMode('cards')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-emerald-800 text-amber-300 shadow-xs'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>🌾 फसल वार त्वरित भाव एवं 7-दिवसीय अनुमान</span>
          </button>

          <button
            onClick={() => setViewMode('bestRates')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              viewMode === 'bestRates'
                ? 'bg-emerald-800 text-amber-300 shadow-xs ring-2 ring-amber-400'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>🏆 भारत में सबसे ऊंचे भाव (धान, सोया, गेहूं कहाँ महंगे हैं?)</span>
            <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-extrabold uppercase">
              नया
            </span>
          </button>
        </div>
      </div>

      {viewMode === 'patrak' ? (
        <MandiPatrakView />
      ) : viewMode === 'bestRates' ? (
        <AllIndiaBestRates />
      ) : (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.mandi.searchPlaceholder[language]}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* State Filter */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-700"
            >
              <option value="all">{t.mandi.allStates[language]}</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-700"
            >
              <option value="all">{t.mandi.allCategories[language]}</option>
              <option value="grain">{t.mandi.grain[language]}</option>
              <option value="oilseed">{t.mandi.oilseed[language]}</option>
              <option value="pulse">{t.mandi.pulse[language]}</option>
              <option value="vegetable">{t.mandi.vegetable[language]}</option>
              <option value="cash_crop">{t.mandi.cash_crop[language]}</option>
            </select>
          </div>
        </div>

        {alertSuccess && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              {language === 'hi'
                ? `सफल! ${alertSuccess} के भाव में बदलाव होते ही आपको सूचना मिलेगी।`
                : `Alert set! You will be notified when ${alertSuccess} rates fluctuate.`}
            </span>
          </div>
        )}
      </div>

      {/* Mandi Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isAboveMsp = item.msp ? item.modalPrice >= item.msp : null;
          const mspDiff = item.msp ? item.modalPrice - item.msp : 0;

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all p-4.5 flex flex-col justify-between"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base leading-tight">
                      {item.cropName[language]}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {item.mandi[language]}, {item.state[language]}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSpeakItem(item)}
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                    title={t.speakText[language]}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Price Badge */}
                <div className="bg-emerald-50/70 rounded-xl p-3 my-3 border border-emerald-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800 block">
                      {t.mandi.modalPrice[language]}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-emerald-950">
                        ₹{item.modalPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-emerald-800">{item.unit}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-md ${
                        item.trend === 'up'
                          ? 'bg-emerald-200 text-emerald-900'
                          : item.trend === 'down'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      {item.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-emerald-800" />
                      ) : item.trend === 'down' ? (
                        <TrendingDown className="w-3 h-3 text-red-800" />
                      ) : (
                        <Minus className="w-3 h-3 text-gray-800" />
                      )}
                      <span>{item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}</span>
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      {item.arrivalVolume}
                    </span>
                  </div>
                </div>

                {/* Min / Max Prices */}
                <div className="grid grid-cols-2 gap-2 text-xs py-1">
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block text-[11px]">{t.mandi.minPrice[language]}</span>
                    <span className="font-bold text-gray-800">₹{item.minPrice}</span>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-gray-500 block text-[11px]">{t.mandi.maxPrice[language]}</span>
                    <span className="font-bold text-gray-800">₹{item.maxPrice}</span>
                  </div>
                </div>

                {/* MSP Tag */}
                {item.msp && (
                  <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">
                      {t.mandi.mspComparison[language]} ₹{item.msp}
                    </span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        isAboveMsp
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isAboveMsp
                        ? `+₹${mspDiff} ${t.mandi.aboveMsp[language]}`
                        : `-₹${Math.abs(mspDiff)} ${t.mandi.belowMsp[language]}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{t.mandi.priceTrend[language]}</span>
                </button>

                <button
                  onClick={() => handleSetAlert(item.cropName[language])}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-gray-600 transition-colors"
                  title="अलर्ट सेट करें (Set Alert)"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <h4 className="font-bold text-gray-800">
            {language === 'hi' ? 'कोई मंडी भाव नहीं मिला' : 'No Mandi items match your search'}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'hi'
              ? 'कृपया फसल या मंडी का नाम बदलकर खोजें।'
              : 'Try searching with another crop or market name.'}
          </p>
        </div>
      )}

      {/* 7-Day Price Trend Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {selectedItem.mandi[language]}, {selectedItem.state[language]}
              </span>
              <h3 className="text-xl font-black text-gray-950 mt-1">
                {selectedItem.cropName[language]} - {t.mandi.priceTrend[language]}
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'hi'
                  ? 'पिछले 7 दिनों में मॉडल भाव के उतार-चढ़ाव का विवरण'
                  : 'Daily modal price fluctuation over the past 7 days'}
              </p>
            </div>

            {/* Simple Visual Bar Chart */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 my-4 space-y-2.5">
              {selectedItem.priceHistory.map((hist, idx) => {
                const maxInHist = Math.max(...selectedItem.priceHistory.map((h) => h.price));
                const minInHist = Math.min(...selectedItem.priceHistory.map((h) => h.price));
                const percentage =
                  maxInHist === minInHist ? 100 : ((hist.price - minInHist * 0.9) / (maxInHist - minInHist * 0.9)) * 100;

                const isToday = idx === selectedItem.priceHistory.length - 1;

                return (
                  <div key={hist.date} className="flex items-center gap-3 text-xs">
                    <span className={`w-14 shrink-0 font-medium ${isToday ? 'font-bold text-emerald-900' : 'text-gray-600'}`}>
                      {hist.date}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isToday ? 'bg-emerald-600' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(15, percentage))}%` }}
                      ></div>
                    </div>
                    <span className="w-16 text-right font-black text-gray-900">
                      ₹{hist.price}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer Info */}
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-600 block">{t.mandi.mspComparison[language]}</span>
                <span className="font-bold text-gray-900">₹{selectedItem.msp || 'लागू नहीं (N/A)'}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-600 block">{language === 'hi' ? 'आज का भाव' : "Today's Rate"}</span>
                <span className="font-black text-emerald-900 text-sm">₹{selectedItem.modalPrice} / क्विंटल</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  handleSpeakItem(selectedItem);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-800 text-white font-bold text-xs sm:text-sm hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{t.speakText[language]}</span>
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
