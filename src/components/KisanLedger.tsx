import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LedgerEntry } from '../types';
import {
  BookOpen,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Trash2,
  Calendar,
  DollarSign,
  PieChart,
  Tag,
  Volume2,
  X,
  FileSpreadsheet,
} from 'lucide-react';

const defaultLedgerEntries: LedgerEntry[] = [
  {
    id: 'l-1',
    date: '2026-10-25',
    type: 'expense',
    category: 'बीज खरीद (Seeds)',
    amount: 3600,
    description: 'शरबती गेहूं बीज 80 किग्रा (2 एकड़ हेतु)',
    cropOrSeason: 'गेहूं (रबी)',
  },
  {
    id: 'l-2',
    date: '2026-10-28',
    type: 'expense',
    category: 'खाद व उर्वरक (Fertilizers)',
    amount: 5400,
    description: '3 बोरी डीएपी और 2 बोरी पोटाश',
    cropOrSeason: 'गेहूं (रबी)',
  },
  {
    id: 'l-3',
    date: '2026-10-29',
    type: 'expense',
    category: 'ट्रैक्टर जुताई व डीजल',
    amount: 2800,
    description: 'रोटावेटर से 2 एकड़ खेत की जुताई (4 घंटे)',
    cropOrSeason: 'रबी जुताई',
  },
  {
    id: 'l-4',
    date: '2026-11-01',
    type: 'income',
    category: 'उपज बिक्री (Crop Sale)',
    amount: 48500,
    description: 'सोयाबीन 10 क्विंटल मंडी में बिक्री (₹4850/क्विंटल)',
    cropOrSeason: 'सोयाबीन (खरीफ)',
  },
  {
    id: 'l-5',
    date: '2026-11-02',
    type: 'income',
    category: 'सरकारी डीबीटी (PM-KISAN)',
    amount: 2000,
    description: 'पीएम किसान सम्मान निधि 18वीं किस्त',
    cropOrSeason: 'शासकीय सहायता',
  },
];

export const KisanLedger: React.FC = () => {
  const { language, t, speakText } = useLanguage();

  const [entries, setEntries] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('kisan_setu_ledger');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultLedgerEntries;
      }
    }
    return defaultLedgerEntries;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  // New Transaction Form State
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('खाद व उर्वरक (Fertilizer)');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [cropOrSeason, setCropOrSeason] = useState('गेहूं (रबी)');

  useEffect(() => {
    localStorage.setItem('kisan_setu_ledger', JSON.stringify(entries));
  }, [entries]);

  const totalIncome = entries
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpense = entries
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalIncome - totalExpense;

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const newEntry: LedgerEntry = {
      id: `l-${Date.now()}`,
      date,
      type,
      category,
      amount: Number(amount),
      description: description || (type === 'income' ? 'उपज बिक्री' : 'कृषि खर्च'),
      cropOrSeason,
    };

    setEntries([newEntry, ...entries]);
    setIsModalOpen(false);
    setAmount('');
    setDescription('');
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleSpeakSummary = () => {
    const speech =
      language === 'hi'
        ? `आपके किसान बही-खाते के अनुसार: कुल आमदनी ₹${totalIncome.toLocaleString('en-IN')}, कुल कृषि खर्च ₹${totalExpense.toLocaleString('en-IN')}, और आपका शुद्ध मुनाफा ₹${netProfit.toLocaleString('en-IN')} है।`
        : `According to your farm ledger: Total income is ₹${totalIncome.toLocaleString('en-IN')}, total expenses are ₹${totalExpense.toLocaleString('en-IN')}, and net profit is ₹${netProfit.toLocaleString('en-IN')}.`;
    speakText(speech);
  };

  const filteredEntries = entries.filter((e) => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-900">
                खेती का डिजिटल खाता
              </span>
              <span className="text-xs text-gray-500">हर खर्च और उपज बिक्री का हिसाब</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
              {t.ledger.title[language]}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              {t.ledger.subtitle[language]}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSpeakSummary}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors cursor-pointer"
              title={t.speakText[language]}
            >
              <Volume2 className="w-4 h-4 text-emerald-700" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>{t.ledger.addTransaction[language]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
            <span>{t.ledger.totalIncome[language]}</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1">
            ₹{totalIncome.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-gray-500 block mt-1">फसल बिक्री व शासकीय अनुदान</span>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-red-800 font-bold mb-1">
            <span>{t.ledger.totalExpense[language]}</span>
            <div className="p-1.5 rounded-lg bg-red-100 text-red-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-950 mt-1">
            ₹{totalExpense.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-gray-500 block mt-1">बीज, खाद, कीटनाशक व जुताई</span>
        </div>

        {/* Net Profit */}
        <div
          className={`rounded-2xl p-5 border shadow-xs text-white ${
            netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-800 to-green-900 border-emerald-700'
              : 'bg-gradient-to-br from-red-800 to-rose-900 border-red-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1 text-emerald-200">
            <span>{t.ledger.netProfit[language]}</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-white/20 uppercase font-black">
              {netProfit >= 0 ? 'मुनाफा' : 'घाटा'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
            ₹{netProfit.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-white/80 block mt-1">
            {netProfit >= 0 ? 'बधाई! आपकी खेती मुनाफे में है' : 'खर्च पर नियंत्रण की सलाह'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
          <h3 className="font-extrabold text-base text-gray-950">
            {language === 'hi' ? 'लेन-देन का ब्योरा (Transaction History)' : 'Transaction History'}
          </h3>

          <div className="flex gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              सभी ({entries.length})
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'expense'
                  ? 'bg-red-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              खर्च
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'income'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              आय
            </button>
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="space-y-2.5">
          {filteredEntries.map((item) => {
            const isExpense = item.type === 'expense';
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-gray-50/70 hover:bg-gray-100/80 border border-gray-200 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isExpense ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isExpense ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 text-xs sm:text-sm">
                        {item.category}
                      </span>
                      {item.cropOrSeason && (
                        <span className="text-[10px] font-semibold text-gray-600 bg-white px-2 py-0.2 rounded border border-gray-200">
                          {item.cropOrSeason}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-base sm:text-lg font-black ${
                      isExpense ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {isExpense ? '-' : '+'}₹{item.amount.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={t.ledger.delete[language]}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredEntries.length === 0 && (
            <div className="p-8 text-center text-xs text-gray-500">
              {t.ledger.noEntries[language]}
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-gray-950 mb-1">
              {language === 'hi' ? 'नया लेन-देन दर्ज करें' : 'Record New Transaction'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {language === 'hi' ? 'खर्च या आमदनी का ब्योरा जोड़ें' : 'Enter farm expense or sales income'}
            </p>

            <form onSubmit={handleAddEntry} className="space-y-3 text-xs sm:text-sm">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    setCategory('खाद व उर्वरक (Fertilizer)');
                  }}
                  className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    type === 'expense'
                      ? 'bg-red-700 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  खर्च (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    setCategory('उपज बिक्री (Crop Sale)');
                  }}
                  className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    type === 'income'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  आमदनी (Income)
                </button>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">रकम (Amount in ₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="उदा. 4500"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">श्रेणी (Category)</label>
                {type === 'expense' ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <option value="बीज खरीद (Seeds)">बीज खरीद (Seeds)</option>
                    <option value="खाद व उर्वरक (Fertilizer)">खाद व उर्वरक (Fertilizer)</option>
                    <option value="कीटनाशक व दवाई (Pesticides)">कीटनाशक व दवाई (Pesticides)</option>
                    <option value="ट्रैक्टर जुताई व डीजल">ट्रैक्टर जुताई व डीजल</option>
                    <option value="मजदूरी (Labor Charges)">मजदूरी (Labor Charges)</option>
                    <option value="सिंचाई व बिजली बिल">सिंचाई व बिजली बिल</option>
                    <option value="अन्य कृषि खर्च">अन्य कृषि खर्च</option>
                  </select>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <option value="उपज बिक्री (Crop Sale)">उपज / अनाज बिक्री (Crop Sale)</option>
                    <option value="सरकारी डीबीटी (PM-KISAN)">सरकारी डीबीटी / सम्मान निधि</option>
                    <option value="दूध व डेयरी बिक्री">दूध व डेयरी बिक्री</option>
                    <option value="ट्रैक्टर या यंत्र किराया आय">यंत्र किराया आय</option>
                    <option value="अन्य कृषि आय">अन्य कृषि आय</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">फसल / सीजन</label>
                  <input
                    type="text"
                    value={cropOrSeason}
                    onChange={(e) => setCropOrSeason(e.target.value)}
                    placeholder="गेहूं / सरसों"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">दिनांक (Date)</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">विवरण (Note)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="उदा. 2 बोरी डीएपी दुकान से ली"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 transition-colors cursor-pointer mt-2"
              >
                सहेजें (Save Entry)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
