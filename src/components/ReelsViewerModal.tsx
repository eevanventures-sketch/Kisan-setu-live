import React, { useEffect, useRef, useState } from 'react';
import { MarketListing, Language } from '../types';
import { getApiUrl } from '../utils/apiBase';
import { loadCloudBazaarVideoUrl } from '../firebase';
import {
  X,
  Heart,
  Phone,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Play,
  ChevronUp,
  ChevronDown,
  MapPin,
  PlusCircle,
  Loader2,
  BadgePercent,
  Building2,
} from 'lucide-react';

interface ReelsViewerModalProps {
  reels: MarketListing[];
  initialIndex: number;
  language: Language;
  resolvedVideoUrls: Record<string, string>;
  onResolveVideoUrl: (id: string, url: string) => void;
  likedIds: Record<string, boolean>;
  onLike: (item: MarketListing) => void;
  onShare: (item: MarketListing) => void;
  onUploadReel: () => void;
  onClose: () => void;
}

function cleanDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits.slice(-10);
}

function getExternalEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const ytMatch =
    trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
    trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/) ||
    trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&playsinline=1`;
  }
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  return null;
}

function isPlayableDirectMediaUrl(url?: string): boolean {
  if (!url) return false;
  const u = url.trim().toLowerCase();
  if (u.startsWith('blob:') || u.startsWith('data:video/')) return true;
  if (u.includes('/api/bazaar/media/')) return true;
  return /\.(mp4|webm|mov|m4v|3gp|mkv|ogv)(\?.*)?$/i.test(u);
}

export const ReelsViewerModal: React.FC<ReelsViewerModalProps> = ({
  reels,
  initialIndex,
  language,
  resolvedVideoUrls,
  onResolveVideoUrl,
  likedIds,
  onLike,
  onShare,
  onUploadReel,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cloudFallbackTriedRef = useRef<Record<string, boolean>>({});

  const [activeIndex, setActiveIndex] = useState(
    Math.max(0, Math.min(initialIndex, reels.length - 1))
  );
  const [isMuted, setIsMuted] = useState(false);
  const [pausedMap, setPausedMap] = useState<Record<string, boolean>>({});
  const [bufferingMap, setBufferingMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [expandedDescId, setExpandedDescId] = useState<string | null>(null);

  // Lock body scroll while Reels viewer is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Scroll immediately to the clicked reel slide on mount
  useEffect(() => {
    const targetSlide = slideRefs.current[initialIndex];
    if (targetSlide) {
      targetSlide.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    }
  }, [initialIndex]);

  const attemptPlayElement = React.useCallback(
    (vid: HTMLVideoElement | null, id: string, preferUnmuted = false) => {
      if (!vid) return;
      vid.muted = preferUnmuted ? false : isMuted;
      const p = vid.play();
      if (p && typeof p.catch === 'function') {
        p.catch((err: any) => {
          const errName = String(err?.name || '');
          // If browser blocked unmuted autoplay, fallback silently to muted autoplay
          if (errName === 'NotAllowedError' || !vid.muted) {
            vid.muted = true;
            setIsMuted(true);
            vid.play().catch(() => {
              setPausedMap((prev) => ({ ...prev, [id]: true }));
            });
          } else {
            setPausedMap((prev) => ({ ...prev, [id]: true }));
          }
        });
      }
    },
    [isMuted]
  );

  // Resolve playable URL for the currently visible reel (and preload next one)
  useEffect(() => {
    const ensurePlayable = async (item: MarketListing | undefined) => {
      if (!item) return;
      if (resolvedVideoUrls[item.id]) return;

      if (item.videoMediaId) {
        setLoadingMap((prev) => ({ ...prev, [item.id]: true }));
        try {
          const blobUrl = await loadCloudBazaarVideoUrl(item.videoMediaId, item.videoMimeType);
          onResolveVideoUrl(item.id, blobUrl);
          return;
        } catch {
          // If Firestore chunk lookup failed, fall through to videoUrl / externalVideoUrl if available
          if (!item.videoUrl && !item.externalVideoUrl) {
            setErrorMap((prev) => ({
              ...prev,
              [item.id]: 'यह वीडियो अभी लोड नहीं हो सका। इंटरनेट जांचकर दोबारा प्रयास करें।',
            }));
          }
        } finally {
          setLoadingMap((prev) => ({ ...prev, [item.id]: false }));
        }
      }

      if (item.videoUrl) {
        const u = item.videoUrl.startsWith('/api/') ? getApiUrl(item.videoUrl) : item.videoUrl;
        onResolveVideoUrl(item.id, u);
        return;
      }

      if (item.externalVideoUrl) {
        onResolveVideoUrl(item.id, item.externalVideoUrl);
      }
    };

    void ensurePlayable(reels[activeIndex]);
    void ensurePlayable(reels[activeIndex + 1]);
  }, [activeIndex, reels, resolvedVideoUrls, onResolveVideoUrl]);

  // Observe which vertical slide is centered in the snap viewport
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) {
              setActiveIndex(idx);
            }
          }
        }
      },
      { root, threshold: [0.6] }
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [reels.length]);

  // Auto-play active video and pause others
  useEffect(() => {
    reels.forEach((item, idx) => {
      const vid = videoRefs.current[item.id];
      if (!vid) return;

      if (idx === activeIndex && !pausedMap[item.id] && !errorMap[item.id]) {
        attemptPlayElement(vid, item.id);
      } else if (!vid.paused) {
        vid.pause();
      }
    });
  }, [activeIndex, reels, resolvedVideoUrls, isMuted, pausedMap, errorMap, attemptPlayElement]);

  // Keyboard navigation (Escape / ArrowUp / ArrowDown) for desktop users
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown' && activeIndex < reels.length - 1) {
        slideRefs.current[activeIndex + 1]?.scrollIntoView({ behavior: 'smooth' });
      }
      if (e.key === 'ArrowUp' && activeIndex > 0) {
        slideRefs.current[activeIndex - 1]?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, reels.length, onClose]);

  const togglePlayPause = (id: string) => {
    const vid = videoRefs.current[id];
    if (!vid) return;
    if (vid.paused) {
      setPausedMap((prev) => ({ ...prev, [id]: false }));
      attemptPlayElement(vid, id);
    } else {
      setPausedMap((prev) => ({ ...prev, [id]: true }));
      vid.pause();
    }
  };

  const handleVideoElementError = async (item: MarketListing) => {
    setBufferingMap((prev) => ({ ...prev, [item.id]: false }));

    // If current URL failed (e.g. Render ephemeral /api/bazaar/media/* cleared) and Firestore chunks exist, try loading from Firestore
    if (item.videoMediaId && !cloudFallbackTriedRef.current[item.id]) {
      cloudFallbackTriedRef.current[item.id] = true;
      setLoadingMap((prev) => ({ ...prev, [item.id]: true }));
      try {
        const blobUrl = await loadCloudBazaarVideoUrl(item.videoMediaId, item.videoMimeType);
        onResolveVideoUrl(item.id, blobUrl);
        setErrorMap((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
        setLoadingMap((prev) => ({ ...prev, [item.id]: false }));
        return;
      } catch {
        setLoadingMap((prev) => ({ ...prev, [item.id]: false }));
      }
    }

    setErrorMap((prev) => ({
      ...prev,
      [item.id]: item.videoUrl?.includes('/api/bazaar/media/')
        ? 'यह पुराना वीडियो सर्वर रीस्टार्ट के कारण उपलब्ध नहीं है। कृपया नई रील अपलोड करें (अब क्लाउड में स्थायी रूप से सेव होती है)।'
        : 'आपके ब्राउज़र में यह वीडियो फ़ॉर्मेट नहीं चल पा रहा है। कृपया नई MP4 रील अपलोड करें।',
    }));
  };

  const handleRetryLoad = async (item: MarketListing) => {
    setErrorMap((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    setPausedMap((prev) => ({ ...prev, [item.id]: false }));
    const vid = videoRefs.current[item.id];
    if (vid) {
      vid.load();
      attemptPlayElement(vid, item.id);
    } else if (item.videoMediaId) {
      setLoadingMap((prev) => ({ ...prev, [item.id]: true }));
      try {
        const blobUrl = await loadCloudBazaarVideoUrl(item.videoMediaId, item.videoMimeType);
        onResolveVideoUrl(item.id, blobUrl);
      } catch {
        setErrorMap((prev) => ({
          ...prev,
          [item.id]: 'वीडियो पुनः लोड नहीं हो सका। कृपया इंटरनेट जांचें।',
        }));
      } finally {
        setLoadingMap((prev) => ({ ...prev, [item.id]: false }));
      }
    }
  };

  const scrollToSlide = (idx: number) => {
    const clamped = Math.max(0, Math.min(idx, reels.length - 1));
    slideRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth' });
  };

  if (reels.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center select-none">
      {/* Top Floating Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-6 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] px-3 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span>वापस</span>
          </button>
          <span className="text-xs sm:text-sm font-black text-amber-300 drop-shadow-sm">
            किसान रील्स ({activeIndex + 1}/{reels.length})
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              const activeItem = reels[activeIndex];
              const vid = activeItem ? videoRefs.current[activeItem.id] : null;
              if (vid) {
                vid.muted = nextMuted;
                if (!nextMuted && vid.paused) {
                  vid.play().catch(() => {});
                }
              }
            }}
            className={`min-h-[44px] min-w-[44px] px-3 rounded-full backdrop-blur-md border text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
              isMuted
                ? 'bg-rose-950/80 border-rose-400/60 hover:bg-rose-900'
                : 'bg-black/60 border-white/20 hover:bg-black/80'
            }`}
            title={isMuted ? 'आवाज़ चालू करें' : 'म्यूट करें'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">आवाज़ बंद</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">आवाज़ चालू</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onUploadReel();
            }}
            className="min-h-[44px] px-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-200" />
            <span>+ रील डालें</span>
          </button>
        </div>
      </div>

      {/* Desktop Prev / Next Vertical Reel Arrows */}
      <div className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col gap-3">
        <button
          type="button"
          onClick={() => scrollToSlide(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30 backdrop-blur-md flex items-center justify-center cursor-pointer border border-white/20"
          title="पिछली रील"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={() => scrollToSlide(activeIndex + 1)}
          disabled={activeIndex === reels.length - 1}
          className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30 backdrop-blur-md flex items-center justify-center cursor-pointer border border-white/20"
          title="अगली रील"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Vertical Snap-Scrolling Reels Feed */}
      <div
        ref={containerRef}
        className="w-full h-[100dvh] overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {reels.map((item, idx) => {
          const playUrl = resolvedVideoUrls[item.id];
          const externalEmbed = getExternalEmbedUrl(playUrl || item.externalVideoUrl);
          const isDirectPlayable = isPlayableDirectMediaUrl(playUrl);
          const isNonDirectExternalLink =
            Boolean(playUrl) && !externalEmbed && !isDirectPlayable;
          const isLoading = Boolean(loadingMap[item.id]);
          const isBuffering = Boolean(bufferingMap[item.id]);
          const loadErr = errorMap[item.id];
          const isPaused = Boolean(pausedMap[item.id]);
          const progressPct = progressMap[item.id] || 0;
          const isLiked = Boolean(likedIds[item.id]);
          const digits = cleanDigits(item.phone);
          const isExpanded = expandedDescId === item.id;
          const isActive = idx === activeIndex;

          return (
            <div
              key={item.id}
              data-index={idx}
              ref={(el) => {
                slideRefs.current[idx] = el;
              }}
              className="w-full h-[100dvh] snap-start snap-always relative flex items-center justify-center bg-black overflow-hidden"
            >
              {/* Centered Phone-like 9:16 Stage on Desktop, Full-Screen Edge-to-Edge on Mobile */}
              <div className="relative w-full h-full md:max-w-[460px] md:h-[94dvh] md:rounded-3xl overflow-hidden bg-neutral-950 md:border md:border-white/15 shadow-2xl">
                {externalEmbed && isActive ? (
                  <iframe
                    src={externalEmbed}
                    title={item.title[language]}
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : isNonDirectExternalLink ? (
                  <div className="w-full h-full relative flex items-center justify-center bg-neutral-900">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title[language]}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-75"
                      />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-black/50">
                      <a
                        href={playUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm flex items-center gap-2 shadow-xl border border-white/30"
                      >
                        <Play className="w-5 h-5 fill-white" />
                        <span>पूरा वीडियो लिंक खोलें ↗</span>
                      </a>
                    </div>
                  </div>
                ) : playUrl && !loadErr ? (
                  <div
                    onClick={() => togglePlayPause(item.id)}
                    className="w-full h-full relative cursor-pointer flex items-center justify-center bg-black"
                  >
                    <video
                      ref={(el) => {
                        videoRefs.current[item.id] = el;
                      }}
                      src={playUrl}
                      poster={item.imageUrl || undefined}
                      autoPlay={isActive}
                      playsInline
                      loop
                      muted={isMuted}
                      preload={Math.abs(idx - activeIndex) <= 1 ? 'auto' : 'metadata'}
                      onLoadedData={(e) => {
                        setBufferingMap((prev) => ({ ...prev, [item.id]: false }));
                        if (isActive && !pausedMap[item.id]) {
                          attemptPlayElement(e.currentTarget, item.id);
                        }
                      }}
                      onCanPlay={(e) => {
                        setBufferingMap((prev) => ({ ...prev, [item.id]: false }));
                        if (isActive && e.currentTarget.paused && !pausedMap[item.id]) {
                          attemptPlayElement(e.currentTarget, item.id);
                        }
                      }}
                      onPlay={() => {
                        setPausedMap((prev) => ({ ...prev, [item.id]: false }));
                        setBufferingMap((prev) => ({ ...prev, [item.id]: false }));
                      }}
                      onPlaying={() => {
                        setPausedMap((prev) => ({ ...prev, [item.id]: false }));
                        setBufferingMap((prev) => ({ ...prev, [item.id]: false }));
                      }}
                      onPause={() => {
                        if (idx === activeIndex) {
                          setPausedMap((prev) => ({ ...prev, [item.id]: true }));
                        }
                      }}
                      onWaiting={() => {
                        if (idx === activeIndex) {
                          setBufferingMap((prev) => ({ ...prev, [item.id]: true }));
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const v = e.currentTarget;
                        if (v.duration && Number.isFinite(v.duration)) {
                          const pct = Math.min(100, Math.max(0, (v.currentTime / v.duration) * 100));
                          setProgressMap((prev) => ({ ...prev, [item.id]: pct }));
                        }
                      }}
                      onError={() => {
                        void handleVideoElementError(item);
                      }}
                      className="w-full h-full object-contain bg-black"
                    />

                    {/* Buffering indicator */}
                    {isBuffering && !isPaused && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="px-4 py-2 rounded-full bg-black/70 border border-white/20 flex items-center gap-2 text-xs font-bold">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                          <span>वीडियो चल रहा है...</span>
                        </div>
                      </div>
                    )}

                    {/* Tap-to-Play overlay when paused or waiting for user interaction */}
                    {isPaused && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 pointer-events-none">
                        <div className="w-20 h-20 rounded-full bg-rose-600/90 border-2 border-white flex items-center justify-center shadow-2xl">
                          <Play className="w-10 h-10 fill-white text-white ml-1" />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-black/70 text-xs font-black text-amber-300">
                          ▶️ वीडियो चलाने के लिए टैप करें
                        </span>
                      </div>
                    )}

                    {/* Subtle muted notice on active playing reel */}
                    {isActive && isMuted && !isPaused && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMuted(false);
                          const vid = videoRefs.current[item.id];
                          if (vid) vid.muted = false;
                        }}
                        className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-black/75 border border-amber-300/60 text-amber-200 text-[11px] font-black flex items-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                        <span>आवाज़ बंद है — चालू करने के लिए दबाएं</span>
                      </button>
                    )}

                    {/* Slim Video Progress Bar at Bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 z-30 pointer-events-none">
                      <div
                        className="h-full bg-amber-400 transition-all duration-150"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center bg-neutral-900">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title[language]}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-55"
                      />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-black/55">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-12 h-12 animate-spin text-amber-300" />
                          <span className="text-sm font-bold text-white">
                            क्लाउड से रील लोड हो रही है...
                          </span>
                        </>
                      ) : loadErr ? (
                        <div className="max-w-xs space-y-3 bg-black/80 border border-rose-400/50 rounded-2xl p-4">
                          <p className="text-xs sm:text-sm font-bold text-rose-200 leading-relaxed">
                            ⚠️ {loadErr}
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleRetryLoad(item)}
                              className="px-3.5 py-2 rounded-xl bg-white text-black font-black text-xs cursor-pointer"
                            >
                              🔄 पुनः प्रयास करें
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onUploadReel();
                              }}
                              className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-black text-xs cursor-pointer"
                            >
                              + नई रील अपलोड करें
                            </button>
                          </div>
                        </div>
                      ) : (
                        <Loader2 className="w-10 h-10 animate-spin text-white/80" />
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom Gradient Scrim for 4.5:1+ Text Contrast */}
                <div className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

                {/* Right-Side Instagram/Facebook Style Action Stack */}
                <div className="absolute right-3 bottom-20 sm:bottom-8 z-20 flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLike(item);
                    }}
                    className="flex flex-col items-center gap-1 cursor-pointer min-w-[48px] min-h-[48px]"
                  >
                    <span
                      className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-transform active:scale-90 ${
                        isLiked
                          ? 'bg-rose-600 border-rose-400 text-white'
                          : 'bg-black/55 border-white/25 text-white hover:bg-black/75'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${isLiked ? 'fill-white' : ''}`} />
                    </span>
                    <span className="text-xs font-black drop-shadow">{item.likes || 1}</span>
                  </button>

                  <a
                    href={`tel:${digits}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-col items-center gap-1 min-w-[48px] min-h-[48px]"
                  >
                    <span className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 border border-emerald-300 flex items-center justify-center shadow-lg">
                      <Phone className="w-5 h-5 text-white" />
                    </span>
                    <span className="text-[11px] font-bold drop-shadow">कॉल</span>
                  </a>

                  <a
                    href={`https://wa.me/91${digits}?text=${encodeURIComponent(
                      `नमस्ते ${item.sellerName} जी, मैंने किसान सेतु पर आपकी रील "${item.title.hi}" देखी।`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-col items-center gap-1 min-w-[48px] min-h-[48px]"
                  >
                    <span className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 border border-green-300 flex items-center justify-center shadow-lg">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </span>
                    <span className="text-[11px] font-bold drop-shadow">WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(item);
                    }}
                    className="flex flex-col items-center gap-1 cursor-pointer min-w-[48px] min-h-[48px]"
                  >
                    <span className="w-12 h-12 rounded-full bg-black/55 hover:bg-black/75 border border-white/25 flex items-center justify-center backdrop-blur-md">
                      <Share2 className="w-5 h-5 text-white" />
                    </span>
                    <span className="text-[11px] font-bold drop-shadow">शेयर</span>
                  </button>
                </div>

                {/* Bottom-Left Creator, Price, Phone & Swipe Hint */}
                <div className="absolute left-3.5 right-20 bottom-5 sm:bottom-6 z-20 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-amber-300">
                    <span>{item.isDemo ? 'नमूना रील' : 'लाइव किसान रील'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 text-white/90">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {item.location[language]}
                    </span>
                  </div>

                  {item.companyName && (
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-200">
                      <Building2 className="w-3.5 h-3.5 text-amber-300" />
                      <span>{item.companyName}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 border border-amber-300 flex items-center justify-center font-black text-sm shrink-0">
                      {item.sellerName.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm text-white truncate">{item.sellerName}</p>
                      <p className="text-xs font-bold text-emerald-300">📞 {item.phone}</p>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                    {item.title[language]}
                  </h3>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDescId(isExpanded ? null : item.id);
                    }}
                    className={`text-left text-xs text-gray-200 leading-relaxed cursor-pointer ${
                      isExpanded ? '' : 'line-clamp-2'
                    }`}
                  >
                    {item.description[language]}
                  </button>

                  {(item.price > 0 || item.discountOffer) && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs font-black">
                      {item.price > 0 && (
                        <span className="bg-emerald-700/90 text-white px-2.5 py-1 rounded-lg border border-emerald-400/50">
                          ₹{item.price.toLocaleString('en-IN')} {item.priceUnit[language]}
                        </span>
                      )}
                      {item.discountOffer && (
                        <span className="bg-amber-400 text-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <BadgePercent className="w-3.5 h-3.5" />
                          {item.discountOffer}
                        </span>
                      )}
                    </div>
                  )}

                  {idx === 0 && reels.length > 1 && (
                    <p className="text-[11px] font-semibold text-white/75 pt-1">
                      ↕️ अगली रील देखने के लिए ऊपर स्वाइप करें
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
