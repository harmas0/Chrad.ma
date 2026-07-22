import { useState, useEffect } from 'react';
import { Star, ShieldCheck, Award, CheckCircle, Clock, Phone, MessageSquare, User, Sparkles } from 'lucide-react';
import Modal from './Modal';
import { fetchProfileById } from '../data/usersApi';
import { fetchReviewsForUser } from '../data/reviewsApi';
import { useI18n } from '../utils/i18n';

export default function RunnerProfileModal({ isOpen, onClose, runnerId }) {
  const { t } = useI18n();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && runnerId) {
      loadData();
    }
  }, [isOpen, runnerId]);

  async function loadData() {
    setLoading(true);
    try {
      const p = await fetchProfileById(runnerId);
      setProfile(p);

      const r = await fetchReviewsForUser(runnerId);
      setReviews(r || []);
    } catch (e) {
      console.error('Failed to load runner public profile:', e);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const ratingVal = Number(profile?.rating || 5.0).toFixed(1);
  const completedCount = profile?.completed_tasks || profile?.completedTasks || 12;
  const tier = profile?.runner_tier || (completedCount >= 50 ? 'Gold' : completedCount >= 20 ? 'Silver' : 'Bronze');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('verified_runner_profile')}>
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-charcoal-light font-bold">{t('loading_profile_reviews')}</p>
        </div>
      ) : !profile ? (
        <div className="py-8 text-center text-charcoal-light font-bold">{t('runner_details_unavailable')}</div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="flex items-center gap-4 p-5 rounded-3xl bg-dark/60 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative">
              <img
                src={profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`}
                alt={profile.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-accent/50 shadow-[0_0_20px_rgba(0,255,135,0.2)]"
              />
              <span className="absolute -bottom-1 -right-1 bg-accent text-dark p-1 rounded-lg shadow-md" title={t('verified_runner')}>
                <ShieldCheck size={14} strokeWidth={3} />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-heading font-black text-white text-[18px] truncate">{profile.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-black text-[10px] uppercase tracking-wider">
                  ⚡ {tier} Tier
                </span>
              </div>
              <p className="text-[12px] text-charcoal-light font-medium line-clamp-1">
                {profile.bio || 'Verified local runner ready for fast errands & deliveries.'}
              </p>
            </div>
          </div>

          {/* Stats Ribbon */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="glass-panel p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-center gap-1 text-warning mb-1">
                <Star size={16} fill="currentColor" />
                <span className="text-[16px] font-black text-white">{ratingVal}</span>
              </div>
              <span className="text-[10px] font-bold text-charcoal-light uppercase tracking-wider">{t('average_rating')}</span>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl border border-white/10">
              <div className="text-[16px] font-black text-accent mb-1">{completedCount}</div>
              <span className="text-[10px] font-bold text-charcoal-light uppercase tracking-wider">{t('tasks_done')}</span>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-center gap-1 text-accent mb-1">
                <CheckCircle size={16} />
                <span className="text-[14px] font-black text-white">{t('verified')}</span>
              </div>
              <span className="text-[10px] font-bold text-charcoal-light uppercase tracking-wider">{t('identity_kyc')}</span>
            </div>
          </div>

          {/* Past Reviews List */}
          <div>
            <h4 className="text-[13px] font-bold text-charcoal-light uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>{t('client_reviews_compliments')}</span>
              <span className="text-[11px] text-accent font-extrabold">{reviews.length} reviews</span>
            </h4>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {reviews.length === 0 ? (
                <div className="py-6 text-center text-charcoal-light text-[12px] font-bold">
                  {t('no_public_reviews_written_yet_for_t')}
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-dark/40 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex text-warning">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={13}
                              className={s <= rev.rating ? 'fill-warning text-warning' : 'text-white/10'}
                            />
                          ))}
                        </div>
                        <span className="text-[12px] font-extrabold text-white">
                          {rev.profiles?.name || 'Client'}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted">
                        {new Date(rev.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {rev.comment && (
                      <p className="text-[12px] text-charcoal-light leading-relaxed font-medium">
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
