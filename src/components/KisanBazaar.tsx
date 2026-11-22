import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { mockMarketListings } from '../data/mockData';
import { MarketListing } from '../types';
import {
  Store,
  Phone,
  PlusCircle,
  MapPin,
  CheckCircle2,
  Calendar,
  X,
  Tag,
  ShieldCheck,
  Search,
  Tractor,
  Volume2,
  Video,
  Play,
  Share2,
  Heart,
  Upload,
  Sparkles,
  FlaskConical,
  BadgePercent,
  Building2,
  Camera,
  Image as ImageIcon,
  Film,
  Trash2,
} from 'lucide-react';

export const KisanBazaar: React.FC = () => {
  const { language, t, speakText } = useLanguage();

  const [listings, setListings] = useState<MarketListing[]>(() => {
    try {
      const saved = localStorage.getItem('kisan_setu_bazaar_listings_v4');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return mockMarketListings;
  });

  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  // Hidden File Input Refs for Gallery & Camera
  const galleryImageInputRef = useRef<HTMLInputElement>(null);
  const cameraImageInputRef = useRef<HTMLInputElement>(null);
  const galleryVideoInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoInputRef = useRef<HTMLInputElement>(null);

  // Form State for new listing or knowledge showcase or dealer promo
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MarketListing['type']>('sell_crop');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('₹ / क्विंटल');
  const [newQuantity, setNewQuantity] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newState, setNewState] = useState('मध्य प्रदेश');
  const [newSeller, setNewSeller] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFileName, setMediaFileName] = useState('');
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  // Company & Dealer Promo specific fields
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newDiscountOffer, setNewDiscountOffer] = useState('');

  // Persist listings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kisan_setu_bazaar_listings_v4', JSON.stringify(listings));
    } catch (e) {
      // ignore
    }
  }, [listings]);

  // Handle Image File from Camera or Gallery with client-side canvas compression
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingMedia(true);
    setMediaFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 850;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        setMediaUrl(compressedBase64);
        setMediaType('image');
        setIsProcessingMedia(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Video File from Camera or Gallery for Reels / Video Showcase
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingMedia(true);
    setMediaFileName(file.name);

    // Create object URL for instant, smooth video playback without memory bottlenecks
    const videoObjUrl = URL.createObjectURL(file);
    setMediaUrl(videoObjUrl);
    setMediaType('video');
    setIsProcessingMedia(false);
  };

  const filteredListings = listings.filter((item) => {
    const matchType =
      selectedType === 'all'
        ? true
        : selectedType === 'reels'
        ? item.mediaType === 'video' || !!item.videoUrl
        : item.type === selectedType;

    const matchSearch =
      item.title[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location[language].toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.companyName && item.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchType && matchSearch;
  });

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSeller || !newPhone) return;

    const isExp = newType === 'farm_experience';
    const isCompany = newType === 'company_promo';

    const defaultImg = isCompany
      ? 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80'
      : newType === 'rent_equipment'
      ? 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=600&q=80'
      : 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80';

    const newEntry: MarketListing = {
      id: `b-${Date.now()}`,
      title: { hi: newTitle, en: newTitle },
      type: newType,
      price: isExp ? 0 : Number(newPrice || 0),
      priceUnit: {
        hi: isExp ? 'निःशुल्क अनुभव' : isCompany ? '₹ / पैक' : newUnit,
        en: isExp ? 'Knowledge Sharing' : newUnit,
      },
      quantity: isExp ? 'अनुभव / टिप्स' : newQuantity || 'उपलब्ध',
      location: { hi: newLocation || 'विदिशा, मध्य प्रदेश', en: newLocation || 'Vidisha, MP' },
      state: { hi: newState, en: newState },
      sellerName: newSeller,
      phone: newPhone,
      date: 'आज',
      mediaType,
      imageUrl: mediaType === 'image' && mediaUrl ? mediaUrl : defaultImg,
      videoUrl: mediaType === 'video' && mediaUrl ? mediaUrl : undefined,
      description: { hi: newDesc || 'संपर्क करें।', en: newDesc || 'Contact dealer.' },
      verified: true,
      isCompanyPromo: isCompany,
      companyName: isCompany ? newCompanyName || 'अधिकृत कृषि केंद्र' : undefined,
      discountOffer: isCompany ? newDiscountOffer || 'विशेष किसान छूट' : undefined,
      likes: 1,
    };

    setListings([newEntry, ...listings]);
    setIsModalOpen(false);

    // Reset Form
    setNewTitle('');
    setNewPrice('');
    setNewQuantity('');
    setNewDesc('');
    setMediaUrl('');
    setMediaFileName('');
    setNewCompanyName('');
    setNewDiscountOffer('');
  };

  const handleCall = (seller: string, phone: string) => {
    setContactSuccess(`${seller} (${phone})`);
    setTimeout(() => setContactSuccess(null), 4000);
  };

  const handleShareListing = (item: MarketListing) => {
    const text = `🌾 *किसान सेतु बाज़ार:* ${item.title.hi}\n📍 स्थान: ${item.location.hi}, ${item.state.hi}\n👤 संपर्क: ${item.sellerName} (फोन: ${item.phone})\n💰 दर: ${item.price > 0 ? `₹${item.price} ${item.priceUnit.hi}` : 'निःशुल्क अनुभव/टिप्स'}${item.discountOffer ? `\n🏷️ छूट: ${item.discountOffer}` : ''}\n📝 विवरण: ${item.description.hi}\n\n👉 किसान सेतु ऐप में देखें: ${window.location.href}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-900">
                सीधी बिक्री • कंपनी व डीलर प्रचार • किसान अनुभव
              </span>
              <span className="text-xs text-gray-500">दवाई कंपनियों व कृषि सेवा केंद्र प्रचार सहित</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950">
              किसान बाज़ार, कृषि सेवा केंद्र व अनुभव मंच
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              फसल बेचें, ट्रैक्टर व ड्रोन किराए पर लें, कृषि सेवा केंद्रों व कंपनियों के विशेष दवाई ऑफर्स/डेमो वीडियो देखें, या अपने खेत का अनुभव साझा करें।
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>+ विज्ञापन / दुकान प्रचार पोस्ट करें</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="फसल, दवा कंपनी, दुकान, यंत्र या किसान..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              सभी ({listings.length})
            </button>

            {/* Reels / Short Video Filter */}
            <button
              onClick={() => setSelectedType('reels')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === 'reels'
                  ? 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-400'
                  : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-rose-500 fill-rose-400" />
              <span>🎬 किसान रील्स / वीडियो ({listings.filter((l) => l.mediaType === 'video' || !!l.videoUrl).length})</span>
            </button>

            {/* Company & Pesticide Dealer Promotion Tab */}
            <button
              onClick={() => setSelectedType('company_promo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedType === 'company_promo'
                  ? 'bg-purple-800 text-white shadow-2xs'
                  : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>🧪 दवाई दुकान व कंपनी प्रचार</span>
            </button>

            <button
              onClick={() => setSelectedType('farm_experience')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'farm_experience'
                  ? 'bg-amber-500 text-emerald-950 shadow-2xs'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              }`}
            >
              💡 किसान अनुभव व वीडियो
            </button>

            <button
              onClick={() => setSelectedType('sell_crop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'sell_crop'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🌾 फसल/अनाज बिक्री
            </button>

            <button
              onClick={() => setSelectedType('rent_equipment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'rent_equipment'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚜 ट्रैक्टर व ड्रोन किराया
            </button>

            <button
              onClick={() => setSelectedType('seeds_fertilizer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'seeds_fertilizer'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🌱 बीज व खाद
            </button>
          </div>
        </div>

        {contactSuccess && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center justify-between">
            <span>
              संपर्क विवरण: {contactSuccess}। कॉल अथवा व्हाट्सएप से बातचीत करें।
            </span>
          </div>
        )}
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredListings.map((item) => {
          const isExp = item.type === 'farm_experience';
          const isCompany = item.type === 'company_promo';
          const hasVideo = item.mediaType === 'video' || !!item.videoUrl;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                isCompany
                  ? 'border-purple-300 hover:border-purple-500 shadow-md ring-2 ring-purple-100'
                  : isExp
                  ? 'border-amber-300 hover:border-amber-500 shadow-xs ring-1 ring-amber-100'
                  : 'border-gray-200 hover:border-emerald-400 hover:shadow-md'
              }`}
            >
              <div>
                {/* Media banner (Photo or Video Player) */}
                <div className="relative h-48 w-full bg-black overflow-hidden group">
                  {hasVideo && activeVideoModal === item.id ? (
                    <video
                      src={item.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <img
                        src={item.imageUrl}
                        alt={item.title[language]}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      {hasVideo && (
                        <button
                          onClick={() => setActiveVideoModal(item.id)}
                          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                          title="वीडियो चलाएं"
                        >
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        </button>
                      )}
                    </>
                  )}

                  {/* Badge */}
                  <span
                    className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase backdrop-blur-xs ${
                      isCompany
                        ? 'bg-purple-900 text-amber-300 border border-purple-400'
                        : isExp
                        ? 'bg-amber-500 text-emerald-950 font-black'
                        : 'bg-emerald-950/80 text-amber-300'
                    }`}
                  >
                    {isCompany
                      ? '🧪 कृषि सेवा केंद्र / कंपनी प्रचार'
                      : isExp
                      ? hasVideo
                        ? '🎬 किसान वीडियो अनुभव'
                        : '💡 फसल अनुभव'
                      : item.type === 'rent_equipment'
                      ? 'किराया (Rent)'
                      : item.type === 'sell_crop'
                      ? 'फसल बिक्री'
                      : item.type === 'dairy_livestock'
                      ? 'पशुधन'
                      : 'बीज'}
                  </span>

                  {item.verified && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{isCompany ? 'अधिकृत डीलर' : 'सत्यापित'}</span>
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {item.location[language]}, {item.state[language]}
                    </span>
                    <span>{item.date}</span>
                  </div>

                  {isCompany && item.companyName && (
                    <div className="flex items-center gap-1.5 mb-1 text-purple-900 font-extrabold text-xs">
                      <Building2 className="w-3.5 h-3.5 text-purple-700" />
                      <span>{item.companyName}</span>
                    </div>
                  )}

                  <h3 className="font-extrabold text-gray-900 text-base leading-tight mb-2">
                    {item.title[language]}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-3">
                    {item.description[language]}
                  </p>

                  {/* Price, Discount Offer or Experience Banner */}
                  {isCompany ? (
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-semibold text-purple-800 block">कीमत / ऑफर</span>
                          <span className="text-lg font-black text-purple-950">
                            ₹{item.price.toLocaleString('en-IN')}{' '}
                            <span className="text-xs font-bold text-purple-800">{item.priceUnit[language]}</span>
                          </span>
                        </div>
                        {item.discountOffer && (
                          <span className="text-xs font-black bg-amber-400 text-purple-950 px-2 py-1 rounded-md shadow-2xs flex items-center gap-1">
                            <BadgePercent className="w-3.5 h-3.5" />
                            {item.discountOffer}
                          </span>
                        )}
                      </div>
                      {item.targetPestOrCrop && (
                        <span className="text-[11px] font-bold text-gray-700 block">
                          🎯 उपयोग: {item.targetPestOrCrop}
                        </span>
                      )}
                    </div>
                  ) : isExp ? (
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-950">
                      <span className="font-bold flex items-center gap-1 text-amber-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        प्रमाणित किसान अनुभव
                      </span>
                      <span className="font-extrabold bg-white px-2 py-0.5 rounded border border-amber-200">
                        ❤️ {item.likes || 45} किसानों ने सराहा
                      </span>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-800 block">मूल्य / दर</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-emerald-950">
                            ₹{item.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-semibold text-emerald-800">
                            {item.priceUnit[language]}
                          </span>
                        </div>
                      </div>
                      {item.quantity && (
                        <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded-md border border-gray-200">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 pt-0">
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-gray-400 block text-[10px]">
                      {isCompany ? 'दुकानदार / डीलर:' : 'किसान:'}
                    </span>
                    <span className="font-bold text-gray-800 line-clamp-1">{item.sellerName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleShareListing(item)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-800 transition-colors cursor-pointer"
                      title="व्हाट्सएप पर शेयर करें"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCall(item.sellerName, item.phone)}
                      className={`px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
                        isCompany
                          ? 'bg-purple-800 hover:bg-purple-900'
                          : 'bg-emerald-800 hover:bg-emerald-900'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isCompany ? 'दुकान से संपर्क' : 'संपर्क करें'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Listing / Company Promotion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-gray-950 mb-1">
              विज्ञापन, दवाई दुकान प्रचार या फसल अनुभव पोस्ट करें
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              कृषि सेवा केंद्र, दवाई कंपनी, या किसान भाई अपना प्रचार व वीडियो सीधे साझा करें
            </p>

            <form onSubmit={handleCreateListing} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-gray-700 block mb-1">विज्ञापन का प्रकार चुनें:</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 font-bold"
                >
                  <option value="company_promo">🧪 कृषि सेवा केंद्र / दवाई दुकानदार व कंपनी प्रचार (Product Offer & Demo)</option>
                  <option value="farm_experience">💡 केवल जानकारी / किसान फसल अनुभव साझा करना (Showcase/Video)</option>
                  <option value="sell_crop">🌾 फसल / अनाज बिक्री (Sell Produce)</option>
                  <option value="rent_equipment">🚜 कृषि यंत्र किराया (Tractor/Drone Rental)</option>
                  <option value="seeds_fertilizer">🌱 बीज व जैविक खाद बिक्री</option>
                  <option value="dairy_livestock">🐄 पशुधन व डेयरी</option>
                </select>
              </div>

              {/* If Company Promo, show company name and discount */}
              {newType === 'company_promo' && (
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 space-y-2">
                  <span className="font-black text-purple-950 text-xs block">
                    🧪 कंपनी / दुकानदार विशेष विवरण:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">कंपनी / ब्रांड का नाम</label>
                      <input
                        type="text"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="उदा. बायेर / सिंजेंटा / इफको"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">छूट / ऑफर (Discount)</label>
                      <input
                        type="text"
                        value={newDiscountOffer}
                        onChange={(e) => setNewDiscountOffer(e.target.value)}
                        placeholder="उदा. 15% छूट + गिफ्ट"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">शीर्षक (Title)</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={
                    newType === 'company_promo'
                      ? 'उदा. कोराजन ओरिजिनल कीटनाशक पर विशेष किसान छूट व डेमो'
                      : newType === 'farm_experience'
                      ? 'उदा. गेहूं 1544 में सुपर सीडर से बोने का फायदा व पैदावार'
                      : 'उदा. शरबती गेहूं 40 क्विंटल या महिंद्रा ट्रैक्टर किराये पर'
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>

              {/* Direct Camera and Gallery Upload: Photo vs Video */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border-2 border-emerald-200">
                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={galleryImageInputRef}
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraImageInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={galleryVideoInputRef}
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraVideoInputRef}
                  accept="video/*"
                  capture="environment"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />

                <div className="flex items-center justify-between mb-2">
                  <label className="font-black text-emerald-950 text-xs sm:text-sm block">
                    📸 गैलरी या कैमरे से सीधे अपलोड करें:
                  </label>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    इंस्टाग्राम रील्स जैसी सुविधा
                  </span>
                </div>

                {/* Media Type Toggle: Photo vs Video Reel */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('image');
                      if (mediaType !== 'image') {
                        setMediaUrl('');
                        setMediaFileName('');
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      mediaType === 'image'
                        ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-400'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>📷 फोटो (Camera/Gallery)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('video');
                      if (mediaType !== 'video') {
                        setMediaUrl('');
                        setMediaFileName('');
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      mediaType === 'video'
                        ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-400'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>🎬 रील्स / वीडियो (Camera/Gallery)</span>
                  </button>
                </div>

                {/* Action Buttons: Camera vs Gallery */}
                {mediaType === 'image' ? (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => cameraImageInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Camera className="w-4 h-4 text-amber-300" />
                      <span>कैमरे से फोटो लें</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryImageInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>गैलरी से फोटो चुनें</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => cameraVideoInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Camera className="w-4 h-4 text-amber-300" />
                      <span>कैमरे से रील बनाएं</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryVideoInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 border border-rose-300 text-rose-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Film className="w-4 h-4 text-rose-600" />
                      <span>गैलरी से वीडियो चुनें</span>
                    </button>
                  </div>
                )}

                {/* Live Preview Box */}
                {isProcessingMedia ? (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 text-center text-xs text-gray-600 animate-pulse">
                    ⏳ फ़ाइल तैयार की जा रही है...
                  </div>
                ) : mediaUrl ? (
                  <div className="bg-white p-3 rounded-xl border border-emerald-300 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>सफलतापूर्वक लोड हुआ {mediaFileName ? `(${mediaFileName})` : ''}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaUrl('');
                          setMediaFileName('');
                        }}
                        className="text-red-600 hover:text-red-800 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>हटाएं</span>
                      </button>
                    </div>

                    {mediaType === 'image' ? (
                      <div className="relative h-44 rounded-lg overflow-hidden border border-gray-200 bg-black">
                        <img
                          src={mediaUrl}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
                        <video
                          src={mediaUrl}
                          controls
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="p-1.5 bg-gray-900 text-amber-300 text-[10px] font-bold text-center">
                          ▶️ वीडियो चलाकर देखें (यह रील बाज़ार में चलेगी)
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-2 text-[11px] text-gray-500">
                    💡 ऊपर बटन दबाकर अपने फोन के कैमरे से तुरंत फोटो खींचें या गैलरी से वीडियो (Reel) चुनें।
                  </div>
                )}
              </div>

              {newType !== 'farm_experience' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">मूल्य (Price in ₹)</label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="1850"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">इकाई (Unit)</label>
                    <input
                      type="text"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder={newType === 'company_promo' ? '₹ / बोतल या ₹ / पैक' : '₹ / क्विंटल'}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {newType === 'company_promo' ? 'दुकान / विक्रेता का नाम' : 'किसान का नाम'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newSeller}
                    onChange={(e) => setNewSeller(e.target.value)}
                    placeholder={newType === 'company_promo' ? 'उदा. श्री राम कृषि सेवा केंद्र' : 'उदा. दिलीप रघुवंशी'}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">मोबाइल नंबर (WhatsApp/Call)</label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="98930XXXXX"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">दुकान / खेत का स्थान व तहसील</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="मंडी रोड, सिरोंज (विदिशा)"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">राज्य</label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  विवरण व दवा/उत्पाद का सही उपयोग:
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="उत्पाद का डोज, किन कीटों/फसलों पर काम करता है और क्या विशेष ऑफर है..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-900 transition-colors cursor-pointer mt-2"
              >
                {newType === 'company_promo'
                  ? 'दुकानदार / कंपनी प्रचार प्रकाशित करें'
                  : newType === 'farm_experience'
                  ? 'अनुभव व वीडियो प्रकाशित करें'
                  : 'विज्ञापन प्रकाशित करें'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
