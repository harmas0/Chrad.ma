import { MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const categoryIcons = {
  delivery: '📦',
  documents: '📄',
  shopping: '🛒',
  custom: '🔧',
};

const statusStyles = {
  open: { label: 'Open', bg: 'bg-accent/10', text: 'text-accent', dot: 'bg-accent' },
  bidding: { label: 'Bidding', bg: 'bg-warning-light', text: 'text-warning', dot: 'bg-warning' },
  accepted: { label: 'Accepted', bg: 'bg-info-light', text: 'text-info', dot: 'bg-info' },
  picked_up: { label: 'Picked Up', bg: 'bg-info-light', text: 'text-info', dot: 'bg-info' },
  en_route: { label: 'En Route', bg: 'bg-accent/10', text: 'text-accent', dot: 'bg-accent' },
  delivered: { label: 'Delivered', bg: 'bg-accent/10', text: 'text-accent', dot: 'bg-accent' },
  confirmed: { label: 'Confirmed', bg: 'bg-muted-light/20', text: 'text-charcoal-light', dot: 'bg-muted-light' },
  cancelled: { label: 'Cancelled', bg: 'bg-danger-light', text: 'text-danger', dot: 'bg-danger' },
};

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function TaskCard({ task, className = '' }) {
  const navigate = useNavigate();
  const status = statusStyles[task.status] || statusStyles.open;

  return (
    <button
      onClick={() => navigate(`/task/${task.id}`)}
      className={`w-full text-left glass-panel rounded-3xl p-6 card-hover cursor-pointer border border-border-light relative overflow-hidden ${className}`}
      id={`task-card-${task.id}`}
    >
      {/* Background flare based on status */}
      <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 ${status.dot}`} />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-dark-surface border border-border flex flex-shrink-0 items-center justify-center text-2xl shadow-inner">
            {categoryIcons[task.category] || '📌'}
          </div>
          <div>
            <h3 className="font-bold text-white text-[16px] leading-snug line-clamp-1 mb-1">
              {task.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${status.bg} ${status.text} uppercase tracking-wider`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              {task.bids && task.bids.length > 0 && (
                <span className="text-[12px] font-semibold text-accent">
                  {task.bids.length} bid{task.bids.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Price badge */}
        <div className="flex-shrink-0 bg-accent/10 border border-accent/20 rounded-xl px-3 py-1.5 text-center min-w-[70px]">
          <span className="text-[20px] font-extrabold text-accent block leading-tight tracking-tight">{task.offeredPrice}</span>
          <span className="text-[10px] text-accent/80 font-bold uppercase tracking-widest">MAD</span>
        </div>
      </div>

      {/* Description preview */}
      <p className="text-[14px] text-gray-200 line-clamp-2 mb-5 leading-relaxed relative z-10 font-medium">
        {task.description}
      </p>

      {/* Footer meta */}
      <div className="flex items-center gap-4 text-[12px] text-gray-400 font-medium relative z-10 pt-4 border-t border-border">
        {task.distance && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} className="text-accent" />
            {task.distance} km
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} className="text-accent" />
          {timeAgo(task.createdAt)}
        </span>
        {task.itemBudget && (
          <span className="inline-flex items-center gap-1.5 text-warning font-semibold ml-auto">
            <span className="text-[14px]">🛍️</span> {task.itemBudget} MAD
          </span>
        )}
      </div>
    </button>
  );
}
