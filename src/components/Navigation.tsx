import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  TrendingUp,
  Stethoscope,
  CloudSun,
  Landmark,
  Store,
  Calculator,
  BookOpen,
  Users,
} from 'lucide-react';

export type TabKey =
  | 'dashboard'
  | 'mandi'
  | 'cropDoctor'
  | 'weather'
  | 'schemes'
  | 'bazaar'
  | 'calculator'
  | 'ledger'
  | 'chopal';

interface NavigationProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { language, t } = useLanguage();

  const navItems: { key: TabKey; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { key: 'dashboard', label: t.nav.dashboard[language], icon: LayoutDashboard },
    { key: 'mandi', label: t.nav.mandi[language], icon: TrendingUp, badge: 'लाइव' },
    { key: 'cropDoctor', label: t.nav.cropDoctor[language], icon: Stethoscope, badge: 'AI' },
    { key: 'weather', label: t.nav.weather[language], icon: CloudSun },
    { key: 'schemes', label: t.nav.schemes[language], icon: Landmark },
    { key: 'bazaar', label: t.nav.bazaar[language], icon: Store },
    { key: 'calculator', label: t.nav.calculator[language], icon: Calculator },
    { key: 'ledger', label: t.nav.ledger[language], icon: BookOpen },
    { key: 'chopal', label: t.nav.chopal[language], icon: Users },
  ];

  return (
    <nav className="bg-emerald-900 text-white shadow-md sticky top-[73px] sm:top-[85px] z-30">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 relative shrink-0 ${
                  isActive
                    ? 'bg-amber-400 text-emerald-950 font-bold shadow-sm'
                    : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-950' : 'text-emerald-300'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold uppercase ${
                      isActive ? 'bg-emerald-950 text-amber-300' : 'bg-amber-400 text-emerald-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
