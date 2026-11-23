import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import {
  UserProfileData,
  signInWithGooglePopup,
  signOutFirebase,
  updateUserProfileInCloud,
  deleteMyAccountDataInCloud,
  isVerifiedAdminUser,
  syncUserProfileOnLogin,
} from '../firebase';
import {
  X,
  ShieldCheck,
  UserCheck,
  LogOut,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Loader2,
  MapPin,
  Phone,
  Lock,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  userProfile: UserProfileData | null;
  onOpenPrivacy: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  userProfile,
  onOpenPrivacy,
}) => {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<{
    type: 'unauthorized-domain' | 'popup-blocked' | 'general';
    message: string;
  } | null>(null);
  const [copiedHost, setCopiedHost] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('मध्य प्रदेश');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 2-Step Account Data Deletion
  const [confirmDeleteStep, setConfirmDeleteStep] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAuthError(null);
      setProfileStatus(null);
      setConfirmDeleteStep(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || user?.displayName || '');
      setPhone(userProfile.phone || '');
      setVillage(userProfile.village || '');
      setDistrict(userProfile.district || '');
      setStateName(userProfile.state || 'मध्य प्रदेश');
    } else if (user) {
      setDisplayName(user.displayName || user.email?.split('@')[0] || '');
      setStateName('मध्य प्रदेश');
    }
  }, [user, userProfile]);

  if (!isOpen) return null;

  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : 'kisan-setu-121j.onrender.com';

  const handleCopyHostname = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2500);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      const signedInUser = await signInWithGooglePopup();
      await syncUserProfileOnLogin(signedInUser).catch(() => null);
    } catch (err: any) {
      const code = String(err?.code || err?.message || '');
      if (code.includes('unauthorized-domain')) {
        setAuthError({
          type: 'unauthorized-domain',
          message: isHi
            ? `यह डोमेन (${currentHostname}) अभी Firebase Console में Authorized Domains सूची में नहीं जुड़ा है। कृपया नीचे दिए आसान 3 कदम अपनाएं:`
            : `This domain (${currentHostname}) is not yet added to Firebase Authorized Domains.`,
        });
      } else if (code.includes('popup-blocked')) {
        setAuthError({
          type: 'popup-blocked',
          message: isHi
            ? 'ब्राउज़र ने लॉगिन पॉप-अप रोक दिया है। कृपया पॉप-अप अनुमति दें या ऊपर दाहिने 3-बिंदी मेनू से "Open in Chrome" में खोलें।'
            : 'Browser blocked the sign-in popup. Please allow popups and try again.',
        });
      } else if (!code.includes('popup-closed-by-user')) {
        setAuthError({
          type: 'general',
          message: isHi
            ? 'Google से लॉगिन पूरा नहीं हो सका। कृपया इंटरनेट जांचकर पुनः प्रयास करें।'
            : 'Could not complete Google Sign-In. Please check your connection and try again.',
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus(null);
    const cleanName = displayName.trim();
    if (cleanName.length < 2) {
      setProfileStatus({
        type: 'error',
        text: isHi ? 'कृपया कम से कम 2 अक्षर का नाम लिखें।' : 'Name must be at least 2 characters.',
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateUserProfileInCloud({
        displayName: cleanName,
        phone: phone.trim(),
        village: village.trim(),
        district: district.trim(),
        state: stateName.trim() || 'मध्य प्रदेश',
      });
      setProfileStatus({
        type: 'success',
        text: isHi
          ? '✅ आपकी किसान प्रोफाइल सुरक्षित क्लाउड में सेव हो गई है!'
          : '✅ Your farmer profile has been saved securely to cloud!',
      });
    } catch {
      setProfileStatus({
        type: 'error',
        text: isHi
          ? 'प्रोफाइल सेव करने में समस्या आई। कृपया पुनः प्रयास करें।'
          : 'Failed to save profile. Please try again.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    await signOutFirebase();
    onClose();
  };

  const handleDeleteCloudData = async () => {
    setIsDeletingData(true);
    setProfileStatus(null);
    try {
      await deleteMyAccountDataInCloud();
      setConfirmDeleteStep(false);
      onClose();
    } catch {
      setProfileStatus({
        type: 'error',
        text: isHi
          ? 'डेटा डिलीट करने में त्रुटि आई।'
          : 'Could not delete account data right now.',
      });
    } finally {
      setIsDeletingData(false);
    }
  };

  const isAdmin = isVerifiedAdminUser(user);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-emerald-200 relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close account modal"
          className="absolute right-4 top-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-emerald-100 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  Google Verified Login
                </span>
                <h3 className="text-lg sm:text-xl font-black text-emerald-950 mt-0.5">
                  {isHi ? 'किसान सेतु खाता लॉगिन' : 'Kisan Setu Account Sign-In'}
                </h3>
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2 text-xs sm:text-sm text-emerald-950">
              <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {isHi
                    ? 'सुरक्षित लॉगिन करने के मुख्य लाभ:'
                    : 'Benefits of signing in with Google:'}
                </span>
              </p>
              <ul className="space-y-1.5 text-xs text-emerald-900/90 pl-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    {isHi
                      ? 'किसान बाज़ार में आपकी रील व विज्ञापन स्थायी रूप से क्लाउड पर सेव होते हैं — केवल आप ही अपनी पोस्ट हटा या बदल सकते हैं।'
                      : 'Permanent cloud publishing for your Bazaar ads & reels — only you can edit or delete your listings.'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    {isHi
                      ? 'आपकी पसंदीदा मंडी व किसान प्रोफाइल दूसरे फोन पर भी स्वतः सिंक रहती है।'
                      : 'Sync your pinned mandi and farmer profile securely across devices.'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    {isHi
                      ? 'पासवर्ड याद रखने की कोई झंझट नहीं — 1-टैप में Google से सुरक्षित लॉगिन।'
                      : 'No extra passwords needed — instant 1-tap verified Google login.'}
                  </span>
                </li>
              </ul>
            </div>

            {authError && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 space-y-2.5 text-xs">
                <div className="flex items-start gap-2 text-amber-950 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>{authError.message}</span>
                </div>

                {authError.type === 'unauthorized-domain' && (
                  <div className="bg-white rounded-lg p-3 border border-amber-200 space-y-2 text-gray-700">
                    <div className="flex items-center justify-between gap-2 bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200">
                      <code className="text-[11px] font-bold text-emerald-900 truncate">
                        {currentHostname}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyHostname}
                        className="px-2 py-1 rounded bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {copiedHost ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>कॉपी हुआ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>डोमेन कॉपी करें</span>
                          </>
                        )}
                      </button>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                      <li>Firebase Console खोलें → Authentication → Settings चुनें।</li>
                      <li>
                        <strong>Authorized domains</strong> पर जाकर <strong>Add domain</strong> दबाएं।
                      </li>
                      <li>
                        ऊपर कॉपी किया हुआ डोमेन (<code>{currentHostname}</code>) पेस्ट करके Save कर दें।
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-md cursor-pointer transition-colors"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isHi ? 'Google से जुड़ रहे हैं...' : 'Signing in with Google...'}</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5 text-amber-300" />
                  <span>
                    {isHi ? 'Google खाते से 1-टैप लॉगिन करें' : 'Continue with Google Account'}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
              <span>
                {isHi
                  ? 'बिना लॉगिन के भी मंडी भाव व फसल डॉक्टर निःशुल्क खुले हैं।'
                  : 'Mandi prices & Crop Doctor remain free without login.'}
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrivacy();
                }}
                className="text-emerald-800 font-bold underline cursor-pointer shrink-0 ml-2"
              >
                {isHi ? 'प्राइवेसी पॉलिसी' : 'Privacy'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Signed-in Account Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-emerald-100 pr-8">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl border-2 border-emerald-500 object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-amber-300 font-black text-lg flex items-center justify-center shrink-0">
                  {(displayName || user.email || 'K').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>सत्यापित खाता</span>
                  </span>
                  {isAdmin && (
                    <span className="text-[10px] font-black bg-amber-300 text-emerald-950 px-2 py-0.5 rounded">
                      मंडी एडमिन
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-emerald-950 truncate mt-0.5">
                  {displayName || user.displayName || 'किसान भाई'}
                </h3>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* Account Security Status Strip */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                <span className="block font-black text-emerald-900">
                  {user.emailVerified ? '✅ ईमेल सत्यापित' : '⚠️ असत्यापित'}
                </span>
                <span className="text-gray-500 text-[10px]">Google सुरक्षा</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                <span className="block font-black text-emerald-900">🔒 निजी प्रोफाइल</span>
                <span className="text-gray-500 text-[10px]">केवल आपके लिए</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                <span className="block font-black text-emerald-900">☁️ क्लाउड सिंक</span>
                <span className="text-gray-500 text-[10px]">एन्क्रिप्टेड HTTPS</span>
              </div>
            </div>

            {/* Editable Farmer Profile Form */}
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 text-xs">
                    {isHi ? 'आपका नाम / दुकान का नाम *' : 'Full Name / Shop Name *'}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={100}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1 text-xs flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-700" />
                    <span>{isHi ? 'मोबाइल नंबर (वैकल्पिक)' : 'Phone (Optional)'}</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={25}
                    placeholder="98930XXXXX"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-700" />
                    <span>{isHi ? 'गाँव / तहसील' : 'Village'}</span>
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    maxLength={100}
                    placeholder="गंजबासौदा"
                    className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1 text-xs">
                    {isHi ? 'जिला' : 'District'}
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    maxLength={100}
                    placeholder="विदिशा"
                    className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1 text-xs">
                    {isHi ? 'राज्य' : 'State'}
                  </label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    maxLength={100}
                    className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {profileStatus && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold ${
                    profileStatus.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {profileStatus.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white font-black text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 transition-colors"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isHi ? 'सेव हो रहा है...' : 'Saving...'}</span>
                  </>
                ) : (
                  <span>{isHi ? '💾 किसान प्रोफाइल सेव करें' : '💾 Save Farmer Profile'}</span>
                )}
              </button>
            </form>

            {/* Sign Out & Play Store Data Deletion Controls */}
            <div className="pt-3 border-t border-gray-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isHi ? 'लॉगआउट करें' : 'Sign Out'}</span>
                </button>

                {!confirmDeleteStep ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteStep(true)}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isHi ? 'मेरा खाता डेटा डिलीट करें' : 'Delete Account Data'}</span>
                  </button>
                ) : (
                  <div className="w-full bg-red-50 border border-red-300 rounded-xl p-3 space-y-2 text-xs">
                    <p className="font-bold text-red-900">
                      {isHi
                        ? 'क्या आप वाकई अपना क्लाउड प्रोफाइल व पसंदीदा मंडी डेटा स्थायी रूप से हटाना चाहते हैं?'
                        : 'Permanently delete your cloud profile & pinned mandi data and sign out?'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteCloudData}
                        disabled={isDeletingData}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black cursor-pointer"
                      >
                        {isDeletingData
                          ? isHi
                            ? 'हट रहा है...'
                            : 'Deleting...'
                          : isHi
                          ? 'हाँ, स्थायी रूप से हटाएं'
                          : 'Yes, Delete Permanently'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteStep(false)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold cursor-pointer"
                      >
                        {isHi ? 'रद्द करें' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
