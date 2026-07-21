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
  Navigation
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useI18n } from '../utils/i18n';

const SLIDES = [
  {
    id: 'delegated_tasks',
    title: 'Delegated Tasks, Instant Bids',
    description: 'Need something fetched, delivered, or done in Casablanca or across Morocco? Describe your task, set your budget, and receive competitive bids from local verified runners in under 3 minutes.',
    icon: '⚡',
    badge: 'FAST & ON-DEMAND',
    color: '#00FF87',
    glowColor: 'rgba(0, 255, 135, 0.25)',
    graphicType: 'lightning',
  },
  {
    id: 'flexible_earnings',
    title: 'Earn Cash On Your Schedule',
    description: 'Got a bicycle, motorcycle, car, or spare time? Browse open task opportunities near you, place bids, and secure payouts transferred directly to your Moroccan RIB bank account.',
    icon: '💰',
    badge: 'FLEXIBLE EARNINGS',
    color: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.25)',
    graphicType: 'earnings',
  },
  {
    id: 'escrow_protection',
    title: 'Escrow Secured Transactions',
    description: '100% peace of mind guaranteed. Payment is safely held in platform escrow and released to the runner only when you verify physical delivery using a secret 4-digit PIN.',
    icon: '🛡️',
    badge: '100% ESCROW PROTECTED',
    color: '#FFB020',
    glowColor: 'rgba(255, 176, 32, 0.25)',
    graphicType: 'escrow',
  },
  {
    id: 'live_telemetry',
    title: 'Real-Time GPS Tracking & Telemetry',
    description: 'Track your runner live on interactive maps with 4 tile layers (Dark, Voyager, Satellite, Cyber Neon). Enjoy real-time status notifications and direct in-app messaging.',
    icon: '📍',
    badge: 'LIVE MAP DISPATCH',
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
      // Swipe Left -> Next
      setCurrentSlide((prev) => prev + 1);
    } else if (diff < -50 && currentSlide > 0) {
      // Swipe Right -> Prev
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
            className="w-10 h-10 rounded-2xl bg-dark/80 flex items-center justify-center border transition-all duration-500 shadow-lg"
            style={{ borderColor: `${slide.color}50` }}
          >
            <span className="text-[20px]">⚡</span>
          </div>
          <div>
            <span className="font-heading font-black text-white uppercase tracking-wider text-[17px] block leading-none">
              Chrad<span style={{ color: slide.color }}>.ma</span>
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-charcoal-light">Errand Network</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          {currentSlide < SLIDES.length - 1 && (
            <button
              onClick={handleSkip}
              className="text-[12px] font-extrabold text-charcoal-light hover:text-white transition-colors py-1.5 px-3.5 bg-dark/60 border border-white/10 rounded-xl"
            >
              Skip
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
              {slide.badge}
            </span>
          </div>

          {/* Interactive Graphical Feature Preview */}
          <div 
            className="aspect-[16/10] w-full rounded-3xl bg-dark/70 border border-white/10 flex items-center justify-center mb-8 relative overflow-hidden transition-all duration-500 group shadow-inner"
          >
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Slide 1 Graphic: Lightning & Bids */}
            {slide.graphicType === 'lightning' && (
              <div className="relative z-10 text-center animate-fade-in space-y-3">
                <div 
                  className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-[54px] shadow-2xl animate-float border"
                  style={{ backgroundColor: `${slide.color}15`, borderColor: `${slide.color}40` }}
                >
                  ⚡
                </div>
                <div className="inline-flex items-center gap-2 bg-dark/90 border border-white/15 px-4 py-2 rounded-2xl shadow-xl animate-pulse-slow">
                  <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-ping" />
                  <span className="text-[12px] font-black text-white">Live Bids: <strong className="text-[#00FF87]">45 MAD</strong> • Arrival: <strong className="text-white">8m</strong></span>
                </div>
              </div>
            )}

            {/* Slide 2 Graphic: Moroccan Bank RIB Earnings */}
            {slide.graphicType === 'earnings' && (
              <div className="relative z-10 text-center animate-fade-in space-y-3">
                <div 
                  className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-[54px] shadow-2xl animate-float border"
                  style={{ backgroundColor: `${slide.color}15`, borderColor: `${slide.color}40` }}
                >
                  💰
                </div>
                <div className="inline-flex items-center gap-2 bg-dark/90 border border-white/15 px-4 py-2 rounded-2xl shadow-xl">
                  <Building2 size={16} className="text-[#00E5FF]" />
                  <span className="text-[12px] font-black text-white">Moroccan Bank RIB Transfer <strong className="text-[#00E5FF]">+350 MAD</strong></span>
                </div>
              </div>
            )}

            {/* Slide 3 Graphic: Escrow & PIN */}
            {slide.graphicType === 'escrow' && (
              <div className="relative z-10 text-center animate-fade-in space-y-3">
                <div 
                  className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-[54px] shadow-2xl animate-float border"
                  style={{ backgroundColor: `${slide.color}15`, borderColor: `${slide.color}40` }}
                >
                  🛡️
                </div>
                <div className="inline-flex items-center gap-2 bg-dark/90 border border-white/15 px-4 py-2 rounded-2xl shadow-xl">
                  <Lock size={15} className="text-[#FFB020]" />
                  <span className="text-[12px] font-black text-white">Secret OTP Delivery PIN: <strong className="text-[#FFB020] font-mono tracking-widest">4821</strong></span>
                </div>
              </div>
            )}

            {/* Slide 4 Graphic: Live Telemetry Map */}
            {slide.graphicType === 'map' && (
              <div className="relative z-10 text-center animate-fade-in space-y-3">
                <div 
                  className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-[54px] shadow-2xl animate-float border"
                  style={{ backgroundColor: `${slide.color}15`, borderColor: `${slide.color}40` }}
                >
                  📍
                </div>
                <div className="inline-flex items-center gap-2 bg-dark/90 border border-white/15 px-4 py-2 rounded-2xl shadow-xl">
                  <Navigation size={16} className="text-[#FF0055] animate-spin-slow" />
                  <span className="text-[12px] font-black text-white">Live Telemetry: <strong className="text-[#FF0055]">Maârif, Casablanca</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="space-y-3">
            <h2 className="text-[26px] font-black text-white leading-tight font-heading">
              {slide.title}
            </h2>
            <p className="text-[14px] text-charcoal-light font-medium leading-relaxed">
              {slide.description}
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
              <span>Get Started</span>
              <Sparkles size={18} strokeWidth={2.5} />
            </>
          ) : (
            <>
              <span>Next Slide</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
