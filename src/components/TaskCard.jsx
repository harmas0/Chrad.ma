import { MapPin, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../utils/i18n';
import CategoryIcon from './CategoryIcon';

const categoryIcons = {
  delivery: '📦',
  documents: '📄',
  shopping: '🛒',
  custom: '🔧',
};

const statusStyles = {
  open: { label: 'Open', bg: 'bg-accent/15 border-accent/30', text: 'text-accent', dot: 'bg-accent shadow-[0_0_8px_#00FF87]' },
  bidding: { label: 'Bidding', bg: 'bg-warning/15 border-warning/30', text: 'text-warning', dot: 'bg-warning shadow-[0_0_8px_#FFB020]' },
  accepted: { label: 'Accepted', bg: 'bg-info/15 border-info/30', text: 'text-info', dot: 'bg-info shadow-[0_0_8px_#00E5FF]' },
  picked_up: { label: 'Picked Up', bg: 'bg-info/15 border-info/30', text: 'text-info', dot: 'bg-info' },
  en_route: { label: 'En Route', bg: 'bg-accent/15 border-accent/30', text: 'text-accent', dot: 'bg-accent' },
  delivered: { label: 'Delivered', bg: 'bg-accent/15 border-accent/30', text: 'text-accent', dot: 'bg-accent' },
  confirmed: { label: 'Confirmed', bg: 'bg-muted-light/20 border-border', text: 'text-charcoal-light', dot: 'bg-muted-light' },
  cancelled: { label: 'Cancelled', bg: 'bg-danger/15 border-danger/30', text: 'text-danger', dot: 'bg-danger' },
};

function timeAgo(dateString) {
  if (!dateString) return 'recently';
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function TaskCard({ task, className = '', onClick }) {
  const navigate = useNavigate();
  const { formatPrice } = useI18n();
  const status = statusStyles[task.status] || statusStyles.open;

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      navigate(`/task/${task.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left glass-card rounded-3xl p-5.5 cursor-pointer relative overflow-hidden active-press ${className}`}
      id={`task-card-${task.id}`}
    >
      {/* Status ambient glow */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none ${status.dot}`} />

      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex shrink-0 items-center justify-center text-accent shadow-inner">
            <CategoryIcon icon={task.category} size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-black text-white text-[15px] leading-snug line-clamp-1 mb-1">
              {task.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${status.bg} ${status.text} uppercase tracking-wider`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              {task.bids && task.bids.length > 0 && (
                <span className="text-[11px] font-black text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
                  {task.bids.length} bid{task.bids.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Offered Price Pill */}
        <div className="shrink-0 bg-accent text-dark border border-accent-light/40 rounded-2xl px-4 py-2.5 text-center shadow-[0_4px_15px_rgba(0,255,135,0.25)]">
          <span className="text-[15px] font-black leading-none tracking-tight block font-heading">{formatPrice(task.offeredPrice)}</span>
        </div>
      </div>

      {/* Description Preview */}
      {task.description && (
        <p className="text-[13px] text-charcoal-light line-clamp-2 mb-4 leading-relaxed relative z-10 font-medium">
          {task.description}
        </p>
      )}

      {/* Footer Metadata */}
      <div className="flex items-center justify-between text-[11px] text-charcoal-light font-bold relative z-10 pt-3.5 border-t border-white/[0.06]">
        <div className="flex items-center gap-3">
          {task.distance && (
            <span className="inline-flex items-center gap-1 text-white">
              <MapPin size={13} className="text-accent" />
              {task.distance} km
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock size={13} className="text-charcoal-light" />
            {timeAgo(task.createdAt)}
          </span>
        </div>

        {task.itemBudget ? (
          <span className="inline-flex items-center gap-1 text-warning bg-warning/10 border border-warning/20 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold">
            Budget: {formatPrice(task.itemBudget)}
          </span>
        ) : (
          <span className="text-accent hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 text-[11px]">
            Details <ArrowRight size={12} />
          </span>
        )}
      </div>
    </button>
  );
}
