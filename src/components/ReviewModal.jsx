import { useState } from 'react';
import { Star, Check, Sparkles, Heart, DollarSign } from 'lucide-react';
import Modal from './Modal';
import { submitReview } from '../data/reviewsApi';
import { useI18n } from '../utils/i18n';

const COMPLIMENT_TAGS = [
  { id: 'fast', label: '⚡ Fast Delivery' },
  { id: 'communication', label: '💬 Great Communication' },
  { id: 'polite', label: '🤝 Polite & Helpful' },
  { id: 'careful', label: '🛡️ Careful Handling' },
  { id: 'punctual', label: '⏰ On Time' },
];

const TIP_OPTIONS = [0, 5, 10, 20];

export default function ReviewModal({ isOpen, onClose, task, runner, onSuccess }) {
  const { t, formatPrice } = useI18n();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['fast']);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!task || !runner) return null;

  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const tagText = selectedTags.map(t => COMPLIMENT_TAGS.find(c => c.id === t)?.label).filter(Boolean).join(', ');
      const fullComment = [tagText, comment].filter(Boolean).join(' - ');

      const res = await submitReview({
        taskId: task.id,
        reviewerId: task.clientId,
        revieweeId: runner.id,
        rating,
        comment: fullComment || 'Great service!',
      });

      if (res) {
        if (onSuccess) onSuccess(res);
        onClose();
      } else {
        setError('Failed to submit review. Please try again.');
      }
    } catch (err) {
      console.error('Review submit error:', err);
      setError('An error occurred while submitting your review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('rate_runner') || 'Rate Your Runner'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Runner Header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-dark/60 border border-white/10">
          <img
            src={runner.avatar_url || `https://i.pravatar.cc/150?u=${runner.id}`}
            alt={runner.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-accent/40 shadow-md"
          />
          <div>
            <h4 className="font-heading font-black text-white text-[16px] leading-tight">{runner.name}</h4>
            <p className="text-[12px] text-accent font-bold uppercase tracking-wider mt-0.5">
              {task.title}
            </p>
          </div>
        </div>

        {/* Star Rating Selector */}
        <div className="text-center py-2">
          <p className="text-[13px] font-bold text-charcoal-light uppercase tracking-wider mb-3">
            {t('how_was_experience') || 'How was your experience?'}
          </p>
          <div className="flex justify-center items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || rating) >= star;
              return (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1.5 transition-transform duration-200 hover:scale-125 focus:outline-none"
                >
                  <Star
                    size={36}
                    className={`transition-colors duration-200 ${
                      active
                        ? 'fill-warning text-warning drop-shadow-[0_0_12px_rgba(255,176,32,0.6)]'
                        : 'text-white/20 fill-white/5'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <p className="text-[14px] font-extrabold text-warning mt-2 font-heading">
            {rating === 5 && '🌟 Outstanding!'}
            {rating === 4 && '👍 Great Job!'}
            {rating === 3 && '👌 Good Service'}
            {rating === 2 && '😐 Below Expectations'}
            {rating === 1 && '👎 Poor Experience'}
          </p>
        </div>

        {/* Quick Compliment Tags */}
        <div>
          <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-2.5">
            {t('compliments') || 'What went well?'}
          </label>
          <div className="flex flex-wrap gap-2">
            {COMPLIMENT_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-accent/15 border-accent text-accent shadow-[0_0_10px_rgba(0,255,135,0.2)]'
                      : 'bg-dark/40 border-white/10 text-charcoal-light hover:border-white/20'
                  }`}
                >
                  {isSelected && <Check size={14} strokeWidth={3} />}
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment Textarea */}
        <div>
          <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-2">
            {t('add_comment') || 'Add a Comment'}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about your experience..."
            rows={3}
            className="w-full bg-dark/60 border border-white/10 rounded-2xl p-4 text-[14px] text-white placeholder:text-muted focus:border-accent focus:outline-none transition-all resize-none"
          />
        </div>

        {/* Optional Tip */}
        <div>
          <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Heart size={14} className="text-danger" />
            {t('add_tip') || 'Add a Tip for Runner (Optional)'}
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {TIP_OPTIONS.map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => setTip(amount)}
                className={`py-2.5 rounded-xl text-[13px] font-extrabold transition-all border ${
                  tip === amount
                    ? 'bg-accent text-dark border-accent shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                    : 'bg-dark/40 text-white border-white/10 hover:border-white/20'
                }`}
              >
                {amount === 0 ? 'No Tip' : `+${formatPrice(amount)}`}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-[12px] font-bold text-danger bg-danger/10 p-3 rounded-xl border border-danger/20">
            {error}
          </p>
        )}

        {/* Submit Action */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-accent text-dark font-heading font-black text-[15px] uppercase tracking-wider shadow-[0_0_25px_rgba(0,255,135,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <span>Submitting...</span>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Submit Review</span>
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
