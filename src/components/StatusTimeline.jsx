import { Check } from 'lucide-react';

const steps = [
  { key: 'accepted', label: 'Accepted', icon: '🤝' },
  { key: 'picked_up', label: 'Picked Up', icon: '📦' },
  { key: 'en_route', label: 'En Route', icon: '🛵' },
  { key: 'delivered', label: 'Delivered', icon: '✅' },
];

const statusOrder = {
  accepted: 0,
  picked_up: 1,
  en_route: 2,
  delivered: 3,
  confirmed: 4,
};

export default function StatusTimeline({ currentStatus }) {
  const currentIndex = statusOrder[currentStatus] ?? -1;

  return (
    <div className="py-4" id="status-timeline">
      <div className="flex items-start justify-between relative">
        {/* Connecting Track Line */}
        <div className="absolute top-5 left-[calc(12.5%)] right-[calc(12.5%)] h-1.5 bg-dark/80 border border-border/80 rounded-full" />
        
        {/* Animated Active Progress Fill */}
        <div
          className="absolute top-5 left-[calc(12.5%)] h-1.5 bg-accent rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_#00FF87]"
          style={{
            width: currentIndex >= 3
              ? '75%'
              : currentIndex >= 0
                ? `${(currentIndex / 3) * 75}%`
                : '0%',
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex || currentStatus === 'confirmed';
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 flex-1 select-none">
              <div
                className={`
                  w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black
                  transition-all duration-500 ease-out
                  ${isCompleted
                    ? 'bg-accent text-dark shadow-[0_0_15px_rgba(0,255,135,0.4)] border border-accent-light'
                    : isCurrent
                      ? 'bg-accent text-dark shadow-[0_0_20px_rgba(0,255,135,0.7)] ring-4 ring-accent/30 animate-pulse'
                      : 'bg-dark/80 text-charcoal-light border border-border'
                  }
                `}
              >
                {isCompleted ? <Check size={18} strokeWidth={3.5} /> : step.icon}
              </div>
              <span
                className={`text-[11px] font-black text-center leading-tight uppercase tracking-wider
                  ${isCurrent ? 'text-accent drop-shadow-[0_0_6px_rgba(0,255,135,0.5)]' : isCompleted ? 'text-white' : 'text-charcoal-light'}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
