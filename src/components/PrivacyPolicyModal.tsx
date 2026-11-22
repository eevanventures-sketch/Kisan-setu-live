import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, ShieldCheck, Camera, Mic, Database, Lock, Mail, CheckCircle2 } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border-2 border-emerald-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close privacy policy"
          className="absolute right-4 top-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-emerald-100">
          <div className="w-11 h-11 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              Google Play Console Compliant
            </span>
            <h3 className="text-lg sm:text-xl font-black text-emerald-950 mt-0.5">
              {language === 'hi'
                ? 'प्राइवेसी पॉलिसी, नियम एवं शर्तें (किसान सेतु)'
                : 'Privacy Policy & Terms of Use (Kisan Setu)'}
            </h3>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <p className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-950 font-semibold">
            {language === 'hi'
              ? 'किसान सेतु (Kisan Setu) पूरी तरह से भारतीय किसानों की सेवा के लिए बनाया गया निःशुल्क, विज्ञापन-मुक्त (Ad-Free) कृषि ऐप है। हम आपकी निजता का पूर्ण सम्मान करते हैं।'
              : 'Kisan Setu is an ad-free, farmer-first agricultural utility app. We strictly respect your privacy and collect no personal tracking data.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-emerald-950">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>{language === 'hi' ? 'कैमरा व फोटो अनुमति' : 'Camera & Photo Access'}</span>
              </div>
              <p className="text-xs text-gray-600">
                {language === 'hi'
                  ? 'कैमरे व गैलरी का उपयोग केवल फसल की पत्ती का रोग पहचानने और मंडी भाव पत्रक की फोटो स्कैन करने के लिए होता है। कोई भी निजी फोटो बेची या साझा नहीं की जाती।'
                  : 'Used strictly when you upload crop leaf photos for disease diagnosis or scan official mandi bulletins. Photos are never sold or used for ads.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-emerald-950">
                <Mic className="w-4 h-4 text-emerald-700" />
                <span>{language === 'hi' ? 'माइक्रोफोन (बोलकर खोजें)' : 'Microphone (Voice Input)'}</span>
              </div>
              <p className="text-xs text-gray-600">
                {language === 'hi'
                  ? 'माइक का उपयोग केवल तभी होता है जब आप स्वयं "बोलकर पूछें" बटन दबाते हैं ताकि आप हिंदी में मंडी भाव या खेती का सवाल पूछ सकें। कोई बैकग्राउंड रिकॉर्डिंग नहीं होती।'
                  : 'Used only when you tap the mic button for Hindi voice search or asking crop questions. No background audio is ever recorded.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
            <div className="flex items-center gap-2 font-black text-emerald-950">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>{language === 'hi' ? 'मंडी भाव एवं डेटा स्रोत' : 'Market Rates & Public Sources'}</span>
            </div>
            <p className="text-xs text-gray-600">
              {language === 'hi'
                ? 'मंडी आवक एवं भाव पत्रक आधिकारिक कृषि उपज मंडी समितियों, Agmarknet (agmarknet.gov.in), mpmandiboard एवं e-NAM के सार्वजनिक अभिलेखों पर आधारित हैं और Firebase Cloud के माध्यम से 24/7 लाइव सिंक होते हैं। किसान खाता व पसंदीदा मंडी आपके ही डिवाइस में सुरक्षित रहती है।'
                : 'Mandi bulletins reflect official APMC / Agmarknet / mpmandiboard public records synced 24/7 via Firebase Firestore. Farm ledger & pinned mandis stay safely stored for your convenience.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
            <div className="flex items-center gap-2 font-black text-emerald-950">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>{language === 'hi' ? 'खाता एवं डेटा सुरक्षा' : 'Account & Data Security'}</span>
            </div>
            <p className="text-xs text-gray-600">
              {language === 'hi'
                ? 'किसानों के लिए बिना लॉगिन के ही मंडी भाव, कैलकुलेटर व फसल डॉक्टर उपलब्ध हैं। Google Sign-In केवल मंडी एडमिन द्वारा भाव अपडेट करने या पसंदीदा मंडी क्लाउड सिंक करने के लिए वैकल्पिक है।'
                : 'Farmers can use Mandi prices, calculators, and Crop Doctor without logging in. Google Sign-In is optional for preference sync and verified admin price publishing.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-950 font-bold">
              <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {language === 'hi' ? 'संपर्क / सहायता ईमेल:' : 'Support Contact:'}{' '}
                <a href="mailto:dev.rgu201@gmail.com" className="underline text-emerald-800">
                  dev.rgu201@gmail.com
                </a>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Effective: Nov 2026 • Version 2.0</span>
            </span>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm cursor-pointer"
          >
            {language === 'hi' ? 'समझ गया / बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
