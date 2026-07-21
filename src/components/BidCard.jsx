import { Star, Clock, Check, X, MessageCircle, ShieldCheck } from 'lucide-react';

export default function BidCard({ bid, onAccept, onCounter, onReject, animationDelay = 0 }) {
  return (
    <div
      className="glass-card rounded-3xl border border-border-light p-5.5 stagger-item hover-lift relative overflow-hidden"
      style={{ animationDelay: `${animationDelay}s` }}
      id={`bid-card-${bid.id}`}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

      {/* Runner info header */}
      <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar Ring */}
          <div className="relative">
            <div className="w-13 h-13 rounded-2xl bg-dark/80 flex items-center justify-center text-sm font-black text-accent border-2 border-accent/40 shadow-[0_0_15px_rgba(0,255,135,0.2)]">
              {bid.runnerInitials}
            </div>
            {bid.runnerCompletedTasks >= 50 && (
              <span className="absolute -bottom-1 -right-1 bg-accent text-dark p-0.5 rounded-md shadow-md" title="Verified Runner">
                <ShieldCheck size={12} strokeWidth={3} />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-heading font-extrabold text-white text-[15px] truncate">{bid.runnerName}</h4>
              {bid.runnerCompletedTasks >= 100 && (
                <span className="text-[9px] font-black text-accent bg-accent/15 border border-accent/30 px-2 py-0.5 rounded-full tracking-wide uppercase">⚡ PRO</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-[12px] font-black text-warning">
                <Star size={13} fill="currentColor" />
                {bid.runnerRating}
              </span>
              <span className="text-[11px] text-charcoal-light font-bold">
                {bid.runnerCompletedTasks} completed tasks
              </span>
            </div>
          </div>
        </div>

        {/* Proposed price pill */}
        <div className="text-right shrink-0 bg-dark/70 border border-border px-4 py-2.5 rounded-2xl">
          <div className="text-[20px] font-black text-white leading-none font-heading">{bid.proposedPrice}</div>
          <span className="text-[10px] text-accent font-black uppercase tracking-wider block mt-1">MAD</span>
        </div>
      </div>

      {/* ETA Badge */}
      <div className="inline-flex items-center gap-1.5 text-[11px] text-white bg-dark/50 border border-border px-3 py-1 rounded-xl font-bold uppercase tracking-wider mb-4">
        <Clock size={13} className="text-accent" />
        <span>Est. Arrival: <strong className="text-accent font-black">{bid.eta}</strong></span>
      </div>

      {/* Message */}
      {bid.message && (
        <div className="bg-dark/40 border border-white/[0.06] rounded-2xl p-4 mb-4">
          <p className="text-[13px] text-charcoal-light leading-relaxed flex items-start gap-2 font-medium italic">
            <MessageCircle size={15} className="text-accent mt-0.5 shrink-0" />
            <span>&ldquo;{bid.message}&rdquo;</span>
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {bid.status === 'pending' && (
        <div className="flex gap-2.5 pt-2">
          <button
            onClick={() => onAccept?.(bid)}
            className="flex-1 btn-accent font-black text-[13px] py-3 rounded-2xl flex items-center justify-center gap-1.5 uppercase tracking-wider active-press shadow-[0_4px_15px_rgba(0,255,135,0.2)]"
            id={`accept-bid-${bid.id}`}
          >
            <Check size={16} strokeWidth={3} />
            Accept
          </button>
          <button
            onClick={() => onCounter?.(bid)}
            className="flex-1 border border-accent/40 bg-accent/10 text-accent font-black text-[13px] py-3 rounded-2xl hover:bg-accent/20 active-press transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
            id={`counter-bid-${bid.id}`}
          >
            Counter
          </button>
          <button
            onClick={() => onReject?.(bid)}
            className="w-11 border border-danger/30 text-danger bg-danger/10 rounded-2xl hover:bg-danger/20 active-press transition-all flex items-center justify-center"
            id={`reject-bid-${bid.id}`}
            aria-label="Reject bid"
          >
            <X size={17} strokeWidth={3} />
          </button>
        </div>
      )}

      {bid.status === 'accepted' && (
        <div className="flex items-center justify-center gap-2 text-accent text-[13px] font-black bg-accent/15 px-4 py-3 rounded-2xl border border-accent/30 uppercase tracking-wider">
          <Check size={16} strokeWidth={3} />
          Offer Accepted
        </div>
      )}
    </div>
  );
}
