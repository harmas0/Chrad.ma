import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowRight, ShieldCheck, MapPin, Sparkles } from 'lucide-react';

const SLIDES = [
  {
    title: 'Delegated Tasks, Instant Bids',
    description: 'Need something delivered, fetched, or done? Describe your request, set your budget, and choose from local verified runners bidding for your job.',
    icon: '⚡',
    gradient: 'from-[#00FF87]/20 to-transparent border-[#00FF87]/20',
    accentText: 'text-[#00FF87]',
    accentGlow: 'shadow-[0_0_50px_rgba(0,255,135,0.15)]',
    badge: 'Fast & On-Demand'
  },
  {
    title: 'Earn Cash as a Local Runner',
    description: 'Bicycle, motorcycle, car, or just some spare time? Browse task opportunities in your area, submit bids, and secure payouts completing simple jobs.',
    icon: '💰',
    gradient: 'from-[#00E5FF]/20 to-transparent border-[#00E5FF]/20',
    accentText: 'text-[#00E5FF]',
    accentGlow: 'shadow-[0_0_50px_rgba(0,229,255,0.15)]',
    badge: 'Flexible Earnings'
  },
  {
    title: 'Escrow Secured Transactions',
    description: 'Peace of mind guaranteed. Payment is held in secure platform escrow, released only when the task is done and you verify the proof of completion.',
    icon: '🛡️',
    gradient: 'from-[#FFB020]/20 to-transparent border-[#FFB020]/20',
    accentText: 'text-[#FFB020]',
    accentGlow: 'shadow-[0_0_50px_rgba(255,176,32,0.15)]',
    badge: '100% Secure'
  }
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
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

  const slide = SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-dark flex flex-col justify-between pt-safe pb-safe-only px-6 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-dark-surface rounded-xl flex items-center justify-center border border-border shadow-[0_0_15px_rgba(0,255,135,0.1)]">
            <span className="text-[18px]">⚡</span>
          </div>
          <span className="font-heading font-black text-white uppercase tracking-wider text-[16px]">Chrad</span>
        </div>
        
        {currentSlide < SLIDES.length - 1 && (
          <button 
            onClick={handleSkip}
            className="text-[13px] font-bold text-charcoal-light hover:text-white transition-colors py-1.5 px-3.5 bg-white/[0.02] border border-border rounded-xl"
          >
            Skip
          </button>
        )}
      </div>

      {/* Main Content (Card with Slide Transitions) */}
      <div className="flex-1 flex flex-col justify-center my-8">
        <div className={`glass-panel rounded-[32px] p-8 border border-border-light relative overflow-hidden transition-all duration-500 ${slide.accentGlow}`}>
          {/* Background Ambient Glow */}
          <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full bg-gradient-to-br ${slide.gradient} blur-3xl opacity-50 pointer-events-none`} />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/[0.03] border border-border px-3.5 py-1.5 rounded-full mb-6 stagger-item">
            <Sparkles size={12} className={slide.accentText} />
            <span className="text-[10px] uppercase tracking-widest font-black text-charcoal-light">{slide.badge}</span>
          </div>

          {/* Visual Graphic Area */}
          <div className="aspect-[4/3] w-full rounded-2xl bg-dark/50 border border-border flex items-center justify-center mb-8 relative stagger-item overflow-hidden">
            {/* Visual background grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="text-[80px] select-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] animate-float">
              {slide.icon}
            </div>
          </div>

          {/* Text content */}
          <div className="space-y-4">
            <h2 className="text-[26px] font-black text-white leading-tight font-heading stagger-item">
              {slide.title}
            </h2>
            <p className="text-[14px] text-charcoal-light font-medium leading-relaxed stagger-item">
              {slide.description}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Nav / Indicators & Button */}
      <div className="space-y-6 mb-4">
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === index 
                  ? `w-8 ${index === 0 ? 'bg-[#00FF87]' : index === 1 ? 'bg-[#00E5FF]' : 'bg-[#FFB020]'}` 
                  : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className={`w-full py-4.5 rounded-2xl font-heading font-black tracking-wider uppercase text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]
            ${currentSlide === SLIDES.length - 1 
              ? 'bg-[#00FF87] text-dark shadow-[0_5px_20px_rgba(0,255,135,0.3)] hover:shadow-[0_5px_25px_rgba(0,255,135,0.4)]' 
              : 'bg-dark-surface text-white border border-border hover:border-charcoal-light'
            }`}
        >
          {currentSlide === SLIDES.length - 1 ? (
            <>
              Get Started <Sparkles size={16} />
            </>
          ) : (
            <>
              Next Slide <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
