import { Check } from 'lucide-react';

const steps = [
  { key: 'accepted', label: 'Accepted', icon: '🤝' },
  { key: 'picked_up', label: 'Picked Up', icon: '📦' },
  { key: 'en_route', label: 'En Route', icon: '🚗' },
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
        {/* Connecting line */}
        <div className="absolute top-6 left-[calc(12.5%)] right-[calc(12.5%)] h-1.5 bg-dark border border-border rounded-full" />
        <div
          className="absolute top-6 left-[calc(12.5%)] h-1.5 bg-accent rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,255,135,0.6)]"
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
          const isPending = index > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-xl
                  transition-all duration-500 ease-out
                  ${isCompleted
                    ? 'bg-accent text-dark shadow-[0_0_15px_rgba(0,255,135,0.4)]'
                    : isCurrent
                      ? 'bg-accent text-dark shadow-[0_0_20px_rgba(0,255,135,0.6)] animate-pulse-glow ring-4 ring-accent/30'
                      : 'bg-dark-surface text-charcoal-light border-2 border-border'
                  }
                `}
              >
                {isCompleted ? <Check size={20} strokeWidth={4} /> : step.icon}
              </div>
              <span
                className={`text-[12px] font-bold text-center leading-tight uppercase tracking-wider
                  ${isCurrent ? 'text-accent drop-shadow-[0_0_8px_rgba(0,255,135,0.4)]' : isCompleted ? 'text-white' : 'text-muted'}
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
