import { Star, Clock, Check, X, MessageCircle } from 'lucide-react';

export default function BidCard({ bid, onAccept, onCounter, onReject, animationDelay = 0 }) {
  return (
    <div
      className="glass-panel rounded-2xl border border-border-light p-6 stagger-item card-hover"
      style={{ animationDelay: `${animationDelay}s` }}
      id={`bid-card-${bid.id}`}
    >
      {/* Runner info row */}
      <div className="flex items-center gap-4 mb-5">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-dark flex items-center justify-center text-sm font-black text-accent flex-shrink-0 border border-border shadow-inner">
          {bid.runnerInitials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-[16px] truncate">{bid.runnerName}</h4>
            {bid.runnerCompletedTasks >= 100 && (
              <span className="text-accent text-[12px] bg-accent/10 px-1.5 py-0.5 rounded" title="Power Runner">⚡ PRO</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-warning">
              <Star size={12} fill="currentColor" />
              {bid.runnerRating}
            </span>
            <span className="text-[12px] text-charcoal-light font-medium">
              {bid.runnerCompletedTasks} tasks
            </span>
          </div>
        </div>

        {/* Proposed price */}
        <div className="text-center flex-shrink-0 bg-dark-surface p-2 rounded-xl border border-border">
          <span className="text-[24px] font-black text-white leading-none">{bid.proposedPrice}</span>
          <span className="block text-[11px] text-accent font-bold mt-1 uppercase tracking-wider">MAD</span>
        </div>
      </div>

      {/* ETA */}
      <div className="flex items-center gap-2 text-[13px] text-charcoal-light font-bold uppercase tracking-wide mb-4">
        <Clock size={14} className="text-accent" />
        <span>ETA: {bid.eta}</span>
      </div>

      {/* Message */}
      {bid.message && (
        <div className="bg-dark-surface border border-border rounded-xl px-5 py-4 mb-5">
          <p className="text-[14px] text-charcoal-light leading-relaxed flex items-start gap-2 font-medium">
            <MessageCircle size={16} className="text-accent mt-0.5 flex-shrink-0" />
            <span className="italic">&ldquo;{bid.message}&rdquo;</span>
          </p>
        </div>
      )}

      {/* Action buttons */}
      {bid.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => onAccept?.(bid)}
            className="flex-1 btn-accent font-bold text-[14px] py-3 rounded-xl flex items-center justify-center gap-2"
            id={`accept-bid-${bid.id}`}
          >
            <Check size={18} strokeWidth={3} />
            Accept
          </button>
          <button
            onClick={() => onCounter?.(bid)}
            className="flex-1 border border-accent/40 bg-accent/5 text-accent font-bold text-[14px] py-3 rounded-xl hover:bg-accent/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            id={`counter-bid-${bid.id}`}
          >
            Counter
          </button>
          <button
            onClick={() => onReject?.(bid)}
            className="w-12 border border-danger/30 text-danger bg-danger/5 rounded-xl hover:bg-danger/20 active:scale-[0.98] transition-all flex items-center justify-center"
            id={`reject-bid-${bid.id}`}
            aria-label="Reject bid"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {bid.status === 'accepted' && (
        <div className="flex items-center gap-2 text-accent text-[14px] font-bold bg-accent/10 px-4 py-2 rounded-xl border border-accent/20">
          <Check size={18} strokeWidth={3} />
          Bid accepted
        </div>
      )}
    </div>
  );
}
