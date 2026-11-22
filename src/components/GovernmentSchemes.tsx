import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockGovtSchemes } from '../data/mockData';
import { GovtScheme } from '../types';
import {
  Landmark,
  CheckCircle,
  FileText,
  ExternalLink,
  Volume2,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  X,
  CreditCard,
  Sun,
  Shield,
  Layers,
  Search,
} from 'lucide-react';

export const GovernmentSchemes: React.FC = () => {
  const { language, t, speakText } = useLanguage();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedScheme, setSelectedScheme] = useState<GovtScheme | null>(null);
  const [landFilter, setLandFilter] = useState<'all' | 'marginal' | 'small' | 'large'>('all');

  const categories = [
    { id: 'all', hi: 'सभी योजनाएं', en: 'All Schemes' },
    { id: 'direct_benefit', hi: 'डीबीटी नकद लाभ (DBT)', en: 'Direct Cash Benefit' },
    { id: 'insurance', hi: 'फसल बीमा (Insurance)', en: 'Crop Insurance' },
    { id: 'subsidy', hi: 'मशीन व सोलर सब्सिडी', en: 'Machinery & Solar Subsidy' },
    { id: 'credit', hi: 'केसीसी व सस्ता लोन', en: 'KCC & Low Interest Loan' },
    { id: 'soil_water', hi: 'ड्रिप व जल संरक्षण', en: 'Drip & Micro Irrigation' },
  ];

  const filteredSchemes = mockGovtSchemes.filter((sc) => {
    const matchCat = activeCategory === 'all' || sc.category === activeCategory;
    return matchCat;
  });

  const handleSpeakScheme = (sc: GovtScheme) => {
    const text =
      language === 'hi'
        ? `${sc.title.hi}: ${sc.shortDesc.hi}. मुख्य लाभ: ${sc.benefit.hi}. पात्रता: ${sc.eligibility.hi.join('. ')}`
        : `${sc.title.en}: ${sc.shortDesc.en}. Key benefit: ${sc.benefit.en}. Eligibility: ${sc.eligibility.en.join('. ')}`;
    speakText(text);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-900">
                100% सरकारी योजनाएं व सब्सिडी
              </span>
              <span className="text-xs text-gray-500">कृषि मंत्रालय, भारत सरकार</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
              {t.schemes.title[language]}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              {t.schemes.subtitle[language]}
            </p>
          </div>

          <button
            onClick={() => {
              const overview =
                language === 'hi'
                  ? 'पीएम किसान सम्मान निधि में प्रति वर्ष ₹6,000, पीएम फसल बीमा में 1.5% प्रीमियम पर सुरक्षा, और पीएम कुसुम में सोलर पंप पर 60 से 90 प्रतिशत तक की सब्सिडी मिलती है।'
                  : 'PM-Kisan provides ₹6,000 yearly. PMFBY offers crop insurance at 1.5% premium, and PM-KUSUM provides 60% to 90% subsidy on solar agricultural pumps.';
              speakText(overview);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-emerald-700" />
            <span>{t.speakText[language]}</span>
          </button>
        </div>

        {/* Eligibility Quick Filter */}
        <div className="mt-4 pt-4 border-t border-gray-100 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <h4 className="text-xs sm:text-sm font-bold text-purple-950">
              {t.schemes.eligibilityPrompt[language]}
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setLandFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                landFilter === 'all'
                  ? 'bg-purple-800 text-white shadow-2xs'
                  : 'bg-white text-purple-950 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              {t.schemes.allFarmers[language]}
            </button>
            <button
              onClick={() => setLandFilter('marginal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                landFilter === 'marginal'
                  ? 'bg-purple-800 text-white shadow-2xs'
                  : 'bg-white text-purple-950 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              {t.schemes.marginal[language]}
            </button>
            <button
              onClick={() => setLandFilter('small')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                landFilter === 'small'
                  ? 'bg-purple-800 text-white shadow-2xs'
                  : 'bg-white text-purple-950 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              {t.schemes.small[language]}
            </button>
            <button
              onClick={() => setLandFilter('large')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                landFilter === 'large'
                  ? 'bg-purple-800 text-white shadow-2xs'
                  : 'bg-white text-purple-950 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              {t.schemes.large[language]}
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat[language]}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchemes.map((scheme) => (
          <div
            key={scheme.id}
            className="bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {scheme.subsidyPercentage || 'सरकारी अनुदान (Govt Scheme)'}
                </span>

                <button
                  onClick={() => handleSpeakScheme(scheme)}
                  className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                  title={t.speakText[language]}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-extrabold text-gray-950 text-base leading-snug mb-1.5">
                {scheme.title[language]}
              </h3>

              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-3">
                {scheme.shortDesc[language]}
              </p>

              {/* Benefit highlight */}
              <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/80 text-xs text-emerald-950 mb-3">
                <span className="font-black block text-emerald-900 mb-0.5">
                  {t.schemes.benefits[language]}
                </span>
                <span className="font-semibold leading-snug">{scheme.benefit[language]}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedScheme(scheme)}
                className="text-xs font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'hi' ? 'दस्तावेज व पात्रता देखें' : 'View Eligibility & Docs'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <a
                href={scheme.officialLink}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-600 transition-colors"
                title={t.schemes.officialPortal[language]}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedScheme(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                {selectedScheme.ministry[language]}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-gray-950 mt-1">
                {selectedScheme.title[language]}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {selectedScheme.shortDesc[language]}
              </p>
            </div>

            {/* Benefit Box */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-emerald-950 mb-4">
              <span className="text-xs font-black uppercase text-emerald-900 block mb-1">
                {t.schemes.benefits[language]}
              </span>
              <p className="text-sm font-bold">{selectedScheme.benefit[language]}</p>
            </div>

            {/* Eligibility List */}
            <div className="mb-4">
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{t.schemes.eligibilityList[language]}</span>
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                {selectedScheme.eligibility[language].map((el, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0"></span>
                    <span>{el}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Documents Required */}
            <div className="mb-4">
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>{t.schemes.documentsList[language]}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedScheme.requiredDocuments[language].map((doc, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-purple-50 text-purple-900 text-xs font-semibold border border-purple-200"
                  >
                    ✓ {doc}
                  </span>
                ))}
              </div>
            </div>

            {/* Apply Process */}
            <div className="mb-5">
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>{t.schemes.howToApply[language]}</span>
              </h4>
              <div className="space-y-2 text-xs sm:text-sm text-gray-700 bg-blue-50/50 p-3.5 rounded-xl border border-blue-200/80">
                {selectedScheme.applyProcess[language].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex flex-wrap gap-2.5">
              <a
                href={selectedScheme.officialLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 text-white font-bold text-xs sm:text-sm hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{t.schemes.officialPortal[language]}</span>
              </a>

              <button
                onClick={() => handleSpeakScheme(selectedScheme)}
                className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-bold text-xs sm:text-sm border border-emerald-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{t.speakText[language]}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
