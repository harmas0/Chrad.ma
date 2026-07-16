import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Camera, Check, Phone, Clock, AlertTriangle } from 'lucide-react';
import { fetchTaskById, updateTaskStatus } from '../data/tasksApi';
import { fetchProfileById } from '../data/usersApi';
import MapView from '../components/MapView';
import StatusTimeline from '../components/StatusTimeline';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import ReportDispute from '../components/ReportDispute';
import { useI18n } from '../utils/i18n';
import { submitReview } from '../data/reviewsApi';

export default function ActiveTask() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, formatPrice } = useI18n();
  const [task, setTask] = useState(null);
  const [runner, setRunner] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulate runner movement
  const [runnerPos, setRunnerPos] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('accepted');
  const lastDbWriteRef = useRef(0);

  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const tVal = await fetchTaskById(id);
      if (cancelled) return;
      if (tVal) {
        setTask(tVal);
        setCurrentStatus(tVal.status);
        if (tVal.acceptedRunnerId) {
          const u = await fetchProfileById(tVal.acceptedRunnerId);
          if (!cancelled) setRunner(u);
        }
      }
      
      // Load last known location from db
      try {
        const { data: locData } = await supabase
          .from('runner_locations')
          .select('*')
          .eq('task_id', id)
          .maybeSingle();
        if (!cancelled && locData) {
          setRunnerPos({ lat: Number(locData.lat), lng: Number(locData.lng) });
        }
      } catch (e) {
        console.error('Failed to load last known runner location:', e);
      }

      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!task || !user) return;
    const isClient = user.id === task.clientId;
    const isRunner = user.id === task.acceptedRunnerId;

    const channel = supabase.channel(`task-${id}-tracking`);

    if (isRunner) {
      // Runner: Watch GPS, broadcast location, and persist to DB
      let watchId;
      const handlePosition = async (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setRunnerPos(newPos);
        // Broadcast to client
        channel.send({
          type: 'broadcast',
          event: 'location',
          payload: newPos,
        });
        // Persist to lightweight table with throttling (max once every 30s)
        const now = Date.now();
        if (now - lastDbWriteRef.current >= 30000) {
          lastDbWriteRef.current = now;
          try {
            await supabase.from('runner_locations').upsert({
              task_id: id,
              runner_id: user.id,
              lat: newPos.lat,
              lng: newPos.lng,
            }, { onConflict: 'task_id' });
          } catch (e) {
            console.error('Failed to persist runner location:', e);
          }
        }
      };

      const handleError = (err) => {
        console.error('GPS error:', err);
      };

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
              enableHighAccuracy: true,
              maximumAge: 5000,
              timeout: 10000,
            });
          }
        }
      });

      return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        supabase.removeChannel(channel);
      };
    } else if (isClient) {
      // Client: Listen to runner location broadcast
      channel.on('broadcast', { event: 'location' }, (payload) => {
        setRunnerPos(payload.payload);
      }).subscribe();

      // Fallback: Poll runner location from DB every 10s
      const interval = setInterval(async () => {
        try {
          const { data: locData } = await supabase
            .from('runner_locations')
            .select('*')
            .eq('task_id', id)
            .maybeSingle();
          if (locData) {
            setRunnerPos({ lat: Number(locData.lat), lng: Number(locData.lng) });
          }
        } catch (e) {
          console.error('Failed to poll runner location:', e);
        }
      }, 10000);

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
  }, [task, user, id]);

  const handleStatusChange = async (newStatus) => {
    setCurrentStatus(newStatus);
    const success = await updateTaskStatus(id, newStatus);
    if (!success) {
      alert('Failed to update status');
      // Revert status
      if (task) setCurrentStatus(task.status);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-charcoal-light font-bold text-lg">Task not found</p>
      </div>
    );
  }

  const isClient = user?.id === task.clientId;
  const isRunner = user?.id === task.acceptedRunnerId;
  const canConfirm = isClient && currentStatus === 'delivered';

  return (
    <div className="min-h-screen bg-dark flex flex-col pt-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-border px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-white hover:bg-surface transition-colors"
          id="active-back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-white tracking-tight">{t('live_tracking')}</h1>
          <p className="text-[11px] text-accent font-bold uppercase tracking-wider">{t('runner_active')}</p>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 min-h-[300px] relative">
        <MapView
          pickupCoords={task.pickup}
          destCoords={task.category !== 'custom' ? task.destination : null}
          runnerCoords={runnerPos}
          height="100%"
          darkMode
          showUserLocation
        />
      </div>

      {/* Bottom Panel */}
      <div className="px-5 py-8 animate-slide-up relative z-10 -mt-6">
        {/* Status Timeline */}
        <div className="glass-panel rounded-3xl p-6 border border-border-light mb-6">
          <StatusTimeline currentStatus={currentStatus} />
        </div>

        {/* Runner Info */}
        {runner && (
          <div className="flex items-center gap-4 glass-panel rounded-3xl p-6 border border-border-light mb-6">
            <div className="w-14 h-14 rounded-full bg-dark flex items-center justify-center text-[18px] font-black text-accent flex-shrink-0 border border-border shadow-inner">
              {runner.initials}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[16px] font-bold text-white mb-1">{runner.name}</h4>
              <div className="flex items-center gap-3 text-[13px] text-charcoal-light font-medium">
                <span className="text-warning font-bold">⭐ {runner.rating}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{runner.completed_tasks || 0} {t('tasks')}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const { fetchOrCreateConversation } = await import('../data/messagesApi');
                  const conv = await fetchOrCreateConversation(task.id, runner.id);
                  if (conv) {
                    navigate(`/chat/${conv.id}`);
                  } else {
                    navigate('/messages');
                  }
                }}
                className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent hover:bg-accent/20 transition-all active:scale-95"
                id="chat-runner"
                aria-label="Chat with runner"
              >
                <MessageCircle size={20} strokeWidth={2.5} />
              </button>
              {runner.phone ? (
                <a
                  href={`tel:${runner.phone}`}
                  className="w-12 h-12 rounded-xl bg-dark-surface border border-border flex items-center justify-center text-white hover:bg-surface transition-all active:scale-95"
                  aria-label="Call runner"
                >
                  <Phone size={20} />
                </a>
              ) : (
                <button
                  onClick={() => alert(t('no_phone_error'))}
                  className="w-12 h-12 rounded-xl bg-dark-surface border border-border flex items-center justify-center text-white hover:bg-surface transition-all active:scale-95 opacity-50 cursor-not-allowed"
                  aria-label="Call runner"
                >
                  <Phone size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Task Summary */}
        <div className="glass-panel rounded-3xl p-6 border border-border-light flex flex-col gap-4 relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
          <h4 className="text-[15px] font-bold text-white relative z-10 leading-snug">{task.title}</h4>
          <div className="flex items-center justify-between relative z-10 pt-3 border-t border-border">
            <span className="text-[13px] text-charcoal-light font-bold uppercase tracking-wider">{t('price_agreed')}</span>
            <span className="text-[20px] font-black text-accent">{formatPrice(task.offeredPrice)}</span>
          </div>
        </div>

        {/* Status action buttons */}
        {isRunner && (
          <div className="flex gap-4 mb-6">
            {currentStatus === 'accepted' && (
              <button
                onClick={() => handleStatusChange('picked_up')}
                className="flex-1 py-4 rounded-xl bg-dark-surface text-charcoal-light font-bold text-[14px] border border-border hover:bg-surface hover:text-white transition-all uppercase tracking-wider shadow-sm"
              >
                📦 {t('mark_picked')}
              </button>
            )}
            {currentStatus === 'picked_up' && (
              <button
                onClick={() => handleStatusChange('en_route')}
                className="flex-1 py-4 rounded-xl bg-dark-surface text-charcoal-light font-bold text-[14px] border border-border hover:bg-surface hover:text-white transition-all uppercase tracking-wider shadow-sm"
              >
                🚗 {t('mark_route')}
              </button>
            )}
            {currentStatus === 'en_route' && (
              <button
                onClick={() => handleStatusChange('delivered')}
                className="flex-1 py-4 rounded-xl bg-dark-surface text-charcoal-light font-bold text-[14px] border border-border hover:bg-surface hover:text-white transition-all uppercase tracking-wider shadow-sm"
              >
                ✅ {t('mark_delivered')}
              </button>
            )}
          </div>
        )}

        {/* Report Problem Button */}
        {runner && !['confirmed', 'cancelled'].includes(currentStatus) && (
          <button
            onClick={() => setShowReport(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors text-[13px] font-bold uppercase tracking-wider mb-6"
          >
            <AlertTriangle size={16} />
            {t('report_dispute')}
          </button>
        )}

        {/* Confirm Delivery */}
        {canConfirm && (
          <div className="animate-fade-in-up mb-6">
            <div className="glass-panel border border-accent/30 rounded-3xl p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
              <span className="text-5xl block mb-3 drop-shadow-lg relative z-10">📸</span>
              <h4 className="text-[18px] font-extrabold text-white mb-2 relative z-10">{t('delivery_photo')}</h4>
              <p className="text-[14px] text-charcoal-light font-medium mb-5 relative z-10">{t('runner_uploaded_photo')}</p>

              {/* Placeholder photo area */}
              <div className="w-full h-48 bg-dark border-2 border-dashed border-border-light rounded-2xl flex items-center justify-center mb-5 relative z-10">
                <div className="text-center">
                  <Camera size={40} className="text-muted mx-auto mb-2 opacity-50" />
                  <span className="text-[13px] text-muted font-medium">{t('verification_photo')}</span>
                </div>
              </div>

              <button
                onClick={() => handleStatusChange('confirmed')}
                className="w-full py-4 rounded-2xl btn-accent font-extrabold text-[16px] transition-all flex items-center justify-center gap-3 animate-pulse-glow relative z-10"
                id="confirm-delivery"
              >
                <Check size={22} strokeWidth={3} />
                {t('confirm_release')}
              </button>
            </div>
          </div>
        )}

        {/* Confirmed state */}
        {currentStatus === 'confirmed' && (
          <div className="text-center py-8 animate-bounce-in glass-panel rounded-3xl border border-border-light px-6">
            <span className="text-7xl block mb-5 drop-shadow-[0_0_20px_rgba(0,255,135,0.4)]">🎉</span>
            <h3 className="text-[24px] font-extrabold text-white mb-2">{t('task_complete')}</h3>
            <p className="text-[14px] text-charcoal-light font-medium mb-6">{t('payment_released_to_runner')}</p>

            {isClient && !reviewSubmitted ? (
              <div className="border-t border-border pt-6 mt-4 text-left">
                <h4 className="text-[16px] font-bold text-white mb-2 text-center">Rate the Runner</h4>
                <p className="text-[12px] text-charcoal-light text-center mb-4">Share your feedback to help the community.</p>
                
                {/* Star selection */}
                <div className="flex justify-center gap-3 mb-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-transform active:scale-90 ${star <= rating ? 'text-warning' : 'text-charcoal-light opacity-40'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Leave a comment about the service (optional)..."
                  rows={3}
                  className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-medium resize-none mb-5"
                />

                <button
                  onClick={async () => {
                    setSubmittingReview(true);
                    await submitReview({
                      taskId: task.id,
                      reviewerId: user.id,
                      revieweeId: task.acceptedRunnerId,
                      rating,
                      comment: reviewComment,
                    });
                    setReviewSubmitted(true);
                    setSubmittingReview(false);
                  }}
                  disabled={submittingReview}
                  className="w-full btn-accent py-3.5 rounded-xl font-bold uppercase tracking-wider text-[14px] flex items-center justify-center gap-2"
                >
                  {submittingReview ? (
                    <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="w-full btn-accent py-4 rounded-xl text-[15px] font-bold uppercase tracking-wider shadow-lg"
              >
                {t('back_home')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Report Dispute Modal */}
      {showReport && task && runner && (
        <ReportDispute
          taskId={task.id}
          reportedUserId={runner.id}
          onClose={() => setShowReport(false)}
          onSubmitted={() => {
            setShowReport(false);
            alert(t('report_submitted'));
          }}
        />
      )}
    </div>
  );
}
