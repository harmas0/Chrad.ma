import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Zap, 
  Lock, 
  Building2,
  Navigation,
  DollarSign,
  Volume2,
  VolumeX,
  Play,
  Pause
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useI18n } from '../utils/i18n';

const SLIDES = [
  {
    id: 'delegated_tasks',
    titleKey: 'onboarding_slide1_title',
    titleDefault: 'Delegated Tasks, Instant Bids',
    descKey: 'onboarding_slide1_desc',
    descDefault: 'Need something fetched, delivered, or done in Casablanca or across Morocco? Describe your task, set your budget, and receive competitive bids from local verified runners in under 3 minutes.',
    badgeKey: 'onboarding_slide1_badge',
    badgeDefault: 'FAST & ON-DEMAND',
    iconComponent: Zap,
    videoUrl: '/videos/onboarding-1.mp4',
    color: '#00FF87',
    glowColor: 'rgba(0, 255, 135, 0.35)',
    graphicType: 'lightning',
  },
  {
    id: 'flexible_earnings',
    titleKey: 'onboarding_slide2_title',
    titleDefault: 'Earn Cash On Your Schedule',
    descKey: 'onboarding_slide2_desc',
    descDefault: 'Got a bicycle, motorcycle, car, or spare time? Browse open task opportunities near you, place bids, and secure payouts transferred directly to your Moroccan RIB bank account.',
    badgeKey: 'onboarding_slide2_badge',
    badgeDefault: 'FLEXIBLE EARNINGS',
    iconComponent: DollarSign,
    videoUrl: '/videos/onboarding-2.mp4',
    color: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.35)',
    graphicType: 'earnings',
  },
  {
    id: 'escrow_protection',
    titleKey: 'onboarding_slide3_title',
    titleDefault: 'Escrow Secured Transactions',
    descKey: 'onboarding_slide3_desc',
    descDefault: '100% peace of mind guaranteed. Payment is safely held in platform escrow and released to the runner only when you verify physical delivery using a secret 4-digit PIN.',
    badgeKey: 'onboarding_slide3_badge',
    badgeDefault: '100% ESCROW PROTECTED',
    iconComponent: ShieldCheck,
    videoUrl: '/videos/escrow-security.mp4',
    color: '#FFB020',
    glowColor: 'rgba(255, 176, 32, 0.35)',
    graphicType: 'escrow',
  },
  {
    id: 'live_telemetry',
    titleKey: 'onboarding_slide4_title',
    titleDefault: 'Real-Time GPS Tracking & Telemetry',
    descKey: 'onboarding_slide4_desc',
    descDefault: 'Track your runner live on interactive maps with 4 tile layers (Dark, Voyager, Satellite, Cyber Neon). Enjoy real-time status notifications and direct in-app messaging.',
    badgeKey: 'onboarding_slide4_badge',
    badgeDefault: 'LIVE MAP DISPATCH',
    iconComponent: MapPin,
    videoUrl: '/videos/delivery-hero.mp4',
    color: '#FF0055',
    glowColor: 'rgba(255, 0, 85, 0.35)',
    graphicType: 'map',
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const videoRefs = useRef([]);
  const navigate = useNavigate();
  const { t } = useI18n();

  // Reset & play current video smoothly when slide changes
  useEffect(() => {
    videoRefs.current.forEach((vRef, idx) => {
      if (vRef) {
        if (idx === currentSlide) {
          vRef.currentTime = 0;
          vRef.play().catch(() => {});
          setIsPlaying(true);
        } else {
          vRef.pause();
        }
      }
    });
  }, [currentSlide]);

  const togglePlayPause = () => {
    const activeVideo = videoRefs.current[currentSlide];
    if (activeVideo) {
      if (isPlaying) {
        activeVideo.pause();
        setIsPlaying(false);
      } else {
        activeVideo.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('onboarded', 'true');
    navigate('/login');
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50 && currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else if (diff < -50 && currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const slide = SLIDES[currentSlide];

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-dark flex flex-col justify-between pt-safe pb-safe-only px-5 overflow-hidden relative select-none"
    >
      {/* Dynamic Background Video Preloader Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {SLIDES.map((s, idx) => (
          <video
            key={s.id}
            ref={(el) => (videoRefs.current[idx] = el)}
            src={s.videoUrl}
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              idx === currentSlide ? 'opacity-35 blur-[2px] scale-105' : 'opacity-0 pointer-events-none'
            }`}
          />
        ))}
        {/* Dark Vignette Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-dark/60" />
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full blur-[150px] transition-all duration-700 opacity-60"
          style={{ backgroundColor: slide.glowColor }}
        />
      </div>

      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between mt-4 relative z-20">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-10 h-10 rounded-2xl bg-dark/90 flex items-center justify-center border transition-all duration-500 shadow-lg text-accent"
            style={{ borderColor: `${slide.color}60` }}
          >
            <Zap size={22} className="animate-pulse-glow" />
          </div>
          <div>
            <span className="font-heading font-black text-white uppercase tracking-wider text-[17px] block leading-none">
              {t('chrad')}<span style={{ color: slide.color }}>{t('ma')}</span>
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-charcoal-light">{t('errand_network')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute/Audio Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-9 h-9 rounded-xl bg-dark/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-charcoal-light hover:text-white transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-accent" />}
          </button>

          <LanguageSwitcher compact />

          {currentSlide < SLIDES.length - 1 && (
            <button
              onClick={handleSkip}
              className="text-[12px] font-extrabold text-charcoal-light hover:text-white transition-colors py-1.5 px-3.5 bg-dark/70 backdrop-blur-md border border-white/10 rounded-xl"
            >
              {t('skip') || 'Skip'}
            </button>
          )}
        </div>
      </div>

      {/* Main Adaptive Video Slide Card */}
      <div className="flex-1 flex flex-col justify-center my-4 relative z-10 max-w-lg mx-auto w-full">
        <div 
          className="glass-floating rounded-[36px] p-6 border relative overflow-hidden transition-all duration-500 shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
          style={{ borderColor: `${slide.color}50` }}
        >
          {/* Badge & Step Indicator */}
          <div className="flex items-center justify-between mb-4">
            <div 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border bg-white/[0.04] transition-all duration-500"
              style={{ borderColor: `${slide.color}40` }}
            >
              <Sparkles size={13} style={{ color: slide.color }} />
              <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: slide.color }}>
                {t(slide.badgeKey) || slide.badgeDefault}
              </span>
            </div>

            <span className="text-[11px] font-mono font-bold text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              0{currentSlide + 1} / 0{SLIDES.length}
            </span>
          </div>

          {/* Adaptive Video Viewport Container */}
          <div 
            onClick={togglePlayPause}
            className="w-full aspect-[16/10] sm:aspect-[16/9] rounded-3xl bg-dark/90 border border-white/15 relative overflow-hidden transition-all duration-500 group shadow-2xl cursor-pointer mb-5"
            style={{ boxShadow: `0 0 25px ${slide.glowColor}` }}
          >
            {/* Primary Video Element */}
            <video
              src={slide.videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Video Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/30 to-transparent" />

            {/* Play / Pause Toggle Overlay Indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-dark/40 backdrop-blur-xs">
              <div className="w-12 h-12 rounded-full bg-dark/80 border border-white/20 flex items-center justify-center text-white shadow-xl">
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </div>
            </div>

            {/* Floating Live Badge Over Video */}
            <div className="absolute bottom-3 left-3 right-3 z-10">
              {slide.graphicType === 'lightning' && (
                <div className="inline-flex items-center gap-2 bg-dark/90 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-xl shadow-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00FF87] animate-ping" />
                  <span className="text-[11px] font-black text-white">{t('live_bids')} <strong className="text-[#00FF87]">45 MAD</strong> {t('_arrival')} <strong className="text-white">{t('8m')}</strong></span>
                </div>
              )}

              {slide.graphicType === 'earnings' && (
                <div className="inline-flex items-center gap-2 bg-dark/90 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-xl shadow-xl">
                  <Building2 size={15} className="text-[#00E5FF]" />
                  <span className="text-[11px] font-black text-white">{t('moroccan_bank_rib_transfer')} <strong className="text-[#00E5FF]">+350 MAD</strong></span>
                </div>
              )}

              {slide.graphicType === 'escrow' && (
                <div className="inline-flex items-center gap-2 bg-dark/90 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-xl shadow-xl">
                  <Lock size={14} className="text-[#FFB020]" />
                  <span className="text-[11px] font-black text-white">{t('secret_otp_delivery_pin')} <strong className="text-[#FFB020] font-mono tracking-widest">4821</strong></span>
                </div>
              )}

              {slide.graphicType === 'map' && (
                <div className="inline-flex items-center gap-2 bg-dark/90 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-xl shadow-xl">
                  <Navigation size={15} className="text-[#FF0055] animate-spin-slow" />
                  <span className="text-[11px] font-black text-white">{t('live_telemetry')} <strong className="text-[#FF0055]">{t('marif_casablanca')}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h2 className="text-[24px] sm:text-[26px] font-black text-white leading-tight font-heading">
              {t(slide.titleKey) || slide.titleDefault}
            </h2>
            <p className="text-[13px] sm:text-[14px] text-charcoal-light font-medium leading-relaxed">
              {t(slide.descKey) || slide.descDefault}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Controls: Navigation Pills & Primary Button */}
      <div className="space-y-4 mb-4 relative z-20 max-w-lg mx-auto w-full">
        {/* Pagination Indicator Bars */}
        <div className="flex justify-center items-center gap-2">
          {SLIDES.map((s, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: currentSlide === index ? '36px' : '8px',
                backgroundColor: currentSlide === index ? s.color : 'rgba(255, 255, 255, 0.2)',
                boxShadow: currentSlide === index ? `0 0 12px ${s.color}` : 'none'
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl font-heading font-black tracking-wider uppercase text-[14px] flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.98] shadow-2xl"
          style={{
            backgroundColor: slide.color,
            color: '#0D1117',
            boxShadow: `0 8px 30px ${slide.glowColor}`,
          }}
        >
          <span>
            {currentSlide === SLIDES.length - 1
              ? t('get_started') || 'Get Started'
              : t('next_slide') || 'Next Slide'}
          </span>
          <ArrowRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
