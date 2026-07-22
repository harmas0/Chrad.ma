import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Zap, 
  Wallet, 
  Lock, 
  CheckCircle,
  Building2,
  Navigation,
  DollarSign
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
    color: '#00FF87',
    glowColor: 'rgba(0, 255, 135, 0.25)',
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
    color: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.25)',
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
    color: '#FFB020',
    glowColor: 'rgba(255, 176, 32, 0.25)',
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
    color: '#FF0055',
    glowColor: 'rgba(255, 0, 85, 0.25)',
    graphicType: 'map',
  },
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const navigate = useNavigate();
  const { t } = useI18n();

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
  const IconComponent = slide.iconComponent;

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-dark flex flex-col justify-between pt-safe pb-safe-only px-6 overflow-hidden relative select-none"
    >
      {/* Background Ambient Glows */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-700"
        style={{ backgroundColor: slide.glowColor }}
      />

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mt-4 relative z-20">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-10 h-10 rounded-2xl bg-dark/80 flex items-center justify-center border transition-all duration-500 shadow-lg text-accent"
            style={{ borderColor: `${slide.color}50` }}
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

        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          {currentSlide < SLIDES.length - 1 && (
            <button
              onClick={handleSkip}
              className="text-[12px] font-extrabold text-charcoal-light hover:text-white transition-colors py-1.5 px-3.5 bg-dark/60 border border-white/10 rounded-xl"
            >
              {t('skip') || 'Skip'}
            </button>
          )}
        </div>
      </div>

      {/* Main Slide Card Container */}
      <div className="flex-1 flex flex-col justify-center my-6 relative z-10">
        <div 
          className="glass-floating rounded-[36px] p-8 border relative overflow-hidden transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
          style={{ borderColor: `${slide.color}40` }}
        >
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full mb-6 border bg-white/[0.03] transition-all duration-500"
            style={{ borderColor: `${slide.color}30` }}
          >
            <Sparkles size={13} style={{ color: slide.color }} />
            <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: slide.color }}>
              {t(slide.badgeKey) || slide.badgeDefault}
            </span>
          </div>

          {/* Interactive Graphical Motion Container */}
          <div 
            className="aspect-[16/10] w-full rounded-3xl bg-dark/70 border border-white/10 flex items-center justify-center mb-8 relative overflow-hidden transition-all duration-500 group shadow-inner"
          >
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Slide Graphic */}
            <div className="relative z-10 text-center animate-fade-in space-y-3">
              <div 
                className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center shadow-2xl animate-float border transition-all duration-500"
                style={{ backgroundColor: `${slide.color}15`, borderColor: `${slide.color}50`, color: slide.color }}
              >
                <IconComponent size={52} strokeWidth={2} />
              </div>

              {slide.graphicType === 'lightning' && (
                <div className="inline-flex items-center gap-2 bg-dark/90 border border-white/15 px-4 py-2 rounded-2xl shadow-xl animate-pulse-slow">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00FF87] animate-ping" />
                  <span className="text-[12px] font-black text-white">{t('live_bids')} <strong className="text-[#00FF87]">45 MAD</strong> {t('_arrival')} <strong className="text-white">{t('8m')}</strong></span>
                </div>
              )}

              {slide.graphicType === 'earnings' && (
                <div className="inline-flex items-center gap-2 bg-dark/90 border border-white/15 px-4 py-2 rounded-2xl shadow-xl">
                  <Building2 size={16} className="text-[#00E5FF]" />
                  <span className="text-[12px] font-black text-white">{t('moroccan_bank_rib_transfer')} <strong className="text-[#00E5FF]">+350 MAD</strong></span>
                </div>
              )}

              {slide.graphicType === 'escrow' && (
                <div className="inline-flex items-center gap-2 bg-dark/90 border border-white/15 px-4 py-2 rounded-2xl shadow-xl">
                  <Lock size={15} className="text-[#FFB020]" />
                  <span className="text-[12px] font-black text-white">{t('secret_otp_delivery_pin')} <strong className="text-[#FFB020] font-mono tracking-widest">4821</strong></span>
                </div>
              )}

              {slide.graphicType === 'map' && (
                <div className="inline-flex items-center gap-2 bg-dark/90 border border-white/15 px-4 py-2 rounded-2xl shadow-xl">
                  <Navigation size={16} className="text-[#FF0055] animate-spin-slow" />
                  <span className="text-[12px] font-black text-white">{t('live_telemetry')} <strong className="text-[#FF0055]">{t('marif_casablanca')}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-3">
            <h2 className="text-[26px] font-black text-white leading-tight font-heading">
              {t(slide.titleKey) || slide.titleDefault}
            </h2>
            <p className="text-[14px] text-charcoal-light font-medium leading-relaxed">
              {t(slide.descKey) || slide.descDefault}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Controls: Indicators & Primary Button */}
      <div className="space-y-5 mb-4 relative z-20">
        {/* Pagination Indicator Bars */}
        <div className="flex justify-center items-center gap-2">
          {SLIDES.map((s, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: currentSlide === index ? '32px' : '8px',
                backgroundColor: currentSlide === index ? s.color : 'rgba(255, 255, 255, 0.15)',
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full py-4.5 rounded-2xl font-heading font-black tracking-wider uppercase text-[14px] flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.98] shadow-2xl"
          style={{
            backgroundColor: slide.color,
            color: '#0D1117',
            boxShadow: `0 8px 30px ${slide.glowColor}`,
          }}
        >
          {currentSlide === SLIDES.length - 1 ? (
            <>
              <span>{t('get_started') || 'Get Started'}</span>
              <Sparkles size={18} strokeWidth={2.5} />
            </>
          ) : (
            <>
              <span>{t('next_slide') || 'Next Slide'}</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
