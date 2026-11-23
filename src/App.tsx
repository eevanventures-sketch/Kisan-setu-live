import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { MandiBhav } from './components/MandiBhav';
import { CropDoctor } from './components/CropDoctor';
import { WeatherAdvisory } from './components/WeatherAdvisory';
import { GovernmentSchemes } from './components/GovernmentSchemes';
import { KisanBazaar } from './components/KisanBazaar';
import { FertilizerCalculator } from './components/FertilizerCalculator';
import { KisanLedger } from './components/KisanLedger';
import { KisanChopal } from './components/KisanChopal';
import { MobileDownloadModal } from './components/MobileDownloadModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AuthModal } from './components/AuthModal';
import {
  UserProfileData,
  subscribeToAuth,
  syncUserProfileOnLogin,
  subscribeToUserProfile,
} from './firebase';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Heart, ShieldCheck, Sprout, Download, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [dismissedInstallBar, setDismissedInstallBar] = useState(false);
  const { language } = useLanguage();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = subscribeToAuth((nextUser) => {
      setUser(nextUser);
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (nextUser && nextUser.emailVerified) {
        void syncUserProfileOnLogin(nextUser).catch(() => null);
        unsubProfile = subscribeToUserProfile(
          nextUser,
          (profile) => setUserProfile(profile),
          () => {}
        );
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9f6] text-[#1a2e1c]">
      {/* Offline / Standalone Notice Strip */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs px-4 py-1.5 text-center font-bold flex items-center justify-center gap-2">
          <span>⚡ आप ऑफ़लाइन हैं — भाव पत्रक व किसान डॉक्टर डेटा स्थानीय रूप से सुरक्षित उपलब्ध है।</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
        user={user}
        userProfile={userProfile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Primary Navigation Tabs */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={setActiveTab}
            onOpenDownload={() => setIsDownloadModalOpen(true)}
          />
        )}
        {activeTab === 'mandi' && <MandiBhav />}
        {activeTab === 'cropDoctor' && <CropDoctor />}
        {activeTab === 'weather' && <WeatherAdvisory />}
        {activeTab === 'schemes' && <GovernmentSchemes />}
        {activeTab === 'bazaar' && <KisanBazaar userProfile={userProfile} />}
        {activeTab === 'calculator' && <FertilizerCalculator />}
        {activeTab === 'ledger' && <KisanLedger />}
        {activeTab === 'chopal' && <KisanChopal />}
      </main>

      {/* Mobile Download Modal */}
      <MobileDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
      />

      {/* Account & Farmer Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        userProfile={userProfile}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
      />

      {/* Play Store Compliance Privacy Policy & Terms Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Automatic 1-Tap App Install Bar when supported by Chrome */}
      {isInstallable && !isInstalled && !dismissedInstallBar && (
        <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-40 bg-emerald-900 text-white rounded-2xl shadow-2xl border border-emerald-600 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black truncate">
                {language === 'hi' ? 'किसान सेतु ऐप फोन में लगाएं' : 'Install Kisan Setu App'}
              </p>
              <p className="text-[11px] text-emerald-200 truncate">
                {language === 'hi' ? '1-टैप में सीधे मोबाइल स्क्रीन पर इंस्टॉल करें' : '1-tap instant mobile app install'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => install()}
              className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs px-3 py-2 rounded-xl cursor-pointer transition-colors"
            >
              {language === 'hi' ? 'इंस्टॉल करें' : 'Install'}
            </button>
            <button
              onClick={() => setDismissedInstallBar(true)}
              aria-label="Close install banner"
              className="p-1.5 text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-emerald-950 text-white border-t border-emerald-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-emerald-200">
            {/* Col 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-amber-300">
                  <Sprout className="w-5 h-5" />
                </div>
                <span className="text-base font-black text-white">किसान सेतु (Kisan Setu)</span>
              </div>
              <p className="leading-relaxed text-emerald-300/80">
                {language === 'hi'
                  ? 'भारत के अन्नदाता किसानों के सशक्तिकरण हेतु समर्पित डिजिटल मंच। सही समय पर सही सलाह, बेहतर मूल्य और सरकारी लाभ।'
                  : 'Empowering Indian farmers with real-time mandi prices, plant clinic AI, scientific weather advisories, and direct marketplace.'}
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="font-bold text-white text-sm mb-2.5">
                {language === 'hi' ? 'महत्वपूर्ण किसान हेल्पलाइन' : 'Essential Agri Helplines'}
              </h4>
              <ul className="space-y-1.5">
                <li>
                  किसान कॉल सेंटर:{' '}
                  <a href="tel:18001801551" className="text-amber-300 font-bold hover:underline">
                    1800-180-1551
                  </a>
                </li>
                <li>
                  पीएम किसान हेल्पलाइन:{' '}
                  <a href="tel:155261" className="text-amber-300 font-bold hover:underline">
                    155261 / 011-24300606
                  </a>
                </li>
                <li>
                  फसल बीमा क्लेम टोल-फ्री:{' '}
                  <a href="tel:14447" className="text-amber-300 font-bold hover:underline">
                    14447
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="font-bold text-white text-sm mb-2.5">
                {language === 'hi' ? 'शासकीय पोर्टल लिंक' : 'Official Portals'}
              </h4>
              <ul className="space-y-1.5 text-emerald-300">
                <li>• agmarknet.gov.in (कृषि उपज मंडी)</li>
                <li>• pmkisan.gov.in (पीएम-किसान सम्मान निधि)</li>
                <li>• pmfby.gov.in (प्रधानमंत्री फसल बीमा)</li>
                <li>• agrimachinery.nic.in (कृषि यंत्र अनुदान)</li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-white text-sm">
                {language === 'hi' ? 'सुरक्षा एवं भरोसा' : 'Security & Trust'}
              </h4>
              <div className="flex items-start gap-2 bg-emerald-900/40 p-2.5 rounded-lg border border-emerald-800">
                <ShieldCheck className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-emerald-200">
                  {language === 'hi'
                    ? 'सभी आंकड़े आईसीएआर (ICAR) एवं केंद्रीय कृषि मंत्रालय के मानकों पर आधारित हैं।'
                    : 'All farm guidelines align with ICAR recommendations and Ministry of Agriculture standards.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="w-full py-2 px-3 rounded-lg bg-emerald-900 hover:bg-emerald-800 border border-emerald-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {language === 'hi' ? '🛡️ प्राइवेसी पॉलिसी व नियम (Play Store)' : '🛡️ Privacy Policy & Terms'}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-emerald-900/80 text-center text-xs text-emerald-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 किसान सेतु (Kisan Setu) • आत्मनिर्भर भारत • जय जवान, जय किसान!</span>
            <span className="flex items-center gap-1">
              भारतीय किसानों के लिए समर्पित <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <MainContent />
    </LanguageProvider>
  );
}
