import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, MessageCircle, Star, Send, Check } from 'lucide-react';
import { fetchTaskById, updateTaskStatus, TASK_CATEGORIES } from '../data/tasksApi';
import { fetchBidsForTask, updateBidStatus, updateBidPriceAndMessage, createBid, deleteBid } from '../data/bidsApi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import BidCard from '../components/BidCard';
import MapView from '../components/MapView';
import Modal from '../components/Modal';
import PriceInput from '../components/PriceInput';
import CategoryIcon from '../components/CategoryIcon';
import RunnerProfileModal from '../components/RunnerProfileModal';
import { useI18n } from '../utils/i18n';

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const statusConfig = {
  open: { label: 'Open', color: 'text-accent border-accent/30 bg-accent/5' },
  bidding: { label: 'Bidding Active', color: 'text-info border-info/30 bg-info/5' },
  accepted: { label: 'Assigned', color: 'text-warning border-warning/30 bg-warning/5' },
  picked_up: { label: 'Picked Up', color: 'text-warning border-warning/30 bg-warning/5' },
  en_route: { label: 'En Route', color: 'text-warning border-warning/30 bg-warning/5' },
  delivered: { label: 'Delivered', color: 'text-success border-success/30 bg-success/5' },
  completed: { label: 'Completed', color: 'text-success border-success/30 bg-success/5' },
};

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, formatPrice } = useI18n();
  const [task, setTask] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const [counterModal, setCounterModal] = useState(false);
  const [counterBid, setCounterBid] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [biddingSuccess, setBiddingSuccess] = useState('');

  const [selectedRunnerId, setSelectedRunnerId] = useState(null);
  const [showRunnerModal, setShowRunnerModal] = useState(false);
  const [acceptedBidId, setAcceptedBidId] = useState(null);

  // Runner placing bid state
  const [bidPrice, setBidPrice] = useState(0);
  const [bidEta, setBidEta] = useState('20 min');
  const [bidMsg, setBidMsg] = useState('');
  const [placingBid, setPlacingBid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [tVal, bVal] = await Promise.all([fetchTaskById(id), fetchBidsForTask(id)]);
      if (!cancelled) {
        setTask(tVal);
        setBids(bVal);
        setAcceptedBidId(tVal?.acceptedBid || null);
        if (tVal) setBidPrice(tVal.offeredPrice);
        setLoading(false);
      }
    }
    load();

    const bidsChannel = supabase
      .channel(`task-${id}-detail-updates`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bids',
        filter: `task_id=eq.${id}`,
      }, () => {
        load();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `id=eq.${id}`,
      }, () => {
        load();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(bidsChannel);
    };
  }, [id]);

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
        <p className="text-charcoal-light font-bold text-lg">{t('task_not_found')}</p>
      </div>
    );
  }

  const category = TASK_CATEGORIES.find(c => c.id === task.category);
  const status = statusConfig[task.status];
  const currentUserId = user?.id;
  const isOwner = task.clientId === currentUserId;
  const runnerBid = bids.find(b => b.runnerId === currentUserId);
  const isActive = task.status !== 'open' && task.status !== 'bidding' && task.status !== 'completed';

  const handleAccept = async (bid) => {
    setAcceptedBidId(bid.id);
    await updateBidStatus(bid.id, 'accepted');
    await updateTaskStatus(task.id, 'accepted', {
      accepted_bid: bid.id,
      accepted_runner_id: bid.runnerId
    });
    const [tVal, bVal] = await Promise.all([fetchTaskById(id), fetchBidsForTask(id)]);
    setTask(tVal);
    setBids(bVal);
  };

  const handleCounter = (bid) => {
    setCounterBid(bid);
    setCounterPrice(Math.round((bid.proposedPrice + task.offeredPrice) / 2));
    setCounterModal(true);
  };

  const submitCounter = async () => {
    if (!counterBid) return;
    await updateBidPriceAndMessage(counterBid.id, counterPrice, counterMsg || `Counter-offer: ${counterPrice} MAD`);
    setCounterModal(false);
    const bVal = await fetchBidsForTask(id);
    setBids(bVal);
  };

  const handlePlaceBid = async () => {
    if (!currentUserId) return;
    setPlacingBid(true);
    const success = await createBid({
      taskId: task.id,
      runnerId: currentUserId,
      proposedPrice: bidPrice,
      eta: bidEta,
      message: bidMsg,
    });
    if (success) {
      const bVal = await fetchBidsForTask(id);
      setBids(bVal);
      setBidMsg('');
    } else {
      alert('Failed to place bid');
    }
    setPlacingBid(false);
  };

  const handleCancelBid = async () => {
    if (!runnerBid) return;
    const confirmed = window.confirm('Are you sure you want to withdraw your bid?');
    if (!confirmed) return;
    const success = await deleteBid(runnerBid.id);
    if (success) {
      const bVal = await fetchBidsForTask(id);
      setBids(bVal);
      alert('Bid withdrawn successfully.');
    } else {
      alert('Failed to withdraw bid.');
    }
  };

  const handleCancelTask = async () => {
    const confirmed = window.confirm('Are you sure you want to cancel this task?');
    if (!confirmed) return;
    const success = await updateTaskStatus(task.id, 'cancelled');
    if (success) {
      setTask(prev => ({ ...prev, status: 'cancelled' }));
      alert('Task cancelled successfully.');
    } else {
      alert('Failed to cancel task.');
    }
  };

  return (
    <div className="pb-28 min-h-screen bg-dark pt-safe">
      {/* Top bar */}
      <div className="sticky top-0 z-40 glass border-b border-border px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-white hover:bg-surface transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className={`px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-widest border ${status.color}`}>
          {t(task.status)}
        </span>
      </div>

      <div className="px-5 py-6">
        {/* Map Header */}
        <div className="w-full aspect-[16/9] rounded-3xl overflow-hidden border border-border shadow-lg mb-6 relative">
          <MapView
            pickupCoords={task.pickup}
            destCoords={task.category !== 'custom' ? task.destination : null}
            waypoints={task.waypoints || []}
            height="100%"
            darkMode
            showRouteInfo={true}
          />
        </div>

        {/* Task Title & Meta */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <CategoryIcon icon={category?.icon || task.category} size={20} />
            </div>
            <span className="text-[12px] font-black uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
              {t(task.category)}
            </span>
            <span className="text-[12px] text-charcoal-light font-bold flex items-center gap-1">
              <Clock size={12} />
              {timeAgo(task.createdAt)}
            </span>
          </div>
          <h2 className="text-[24px] font-black text-white leading-tight tracking-tight">{task.title}</h2>
        </div>

        {/* Description */}
        {task.description && (
          <div className="bg-dark-surface rounded-2xl p-5 border border-border mb-6">
            <h4 className="text-[11px] font-bold text-charcoal-light uppercase tracking-widest mb-2">{t('description_label')}</h4>
            <p className="text-[15px] text-white leading-relaxed font-medium">{task.description}</p>
          </div>
        )}

        {/* Task photos */}
        {task.photos && task.photos.length > 0 && (
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-charcoal-light uppercase tracking-widest mb-3">{t('photos')}</h4>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {task.photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Task doc ${i}`}
                  className="w-24 h-24 object-cover rounded-xl border border-border flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* Location route */}
        <div className="bg-dark-surface rounded-2xl p-5 border border-border mb-6 relative overflow-hidden">
          <h4 className="text-[11px] font-bold text-charcoal-light uppercase tracking-widest mb-3">{t('route_details')}</h4>
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-start gap-3">
              <span className="text-accent bg-accent/10 p-1 rounded-lg border border-accent/20 text-[12px] mt-0.5">📍</span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-charcoal-light uppercase tracking-wider mb-0.5">{t('pickup_address_label')}</p>
                <p className="text-[13px] text-white font-medium truncate">{task.pickup.address}</p>
              </div>
            </div>
            {task.destination && task.category !== 'custom' && (
              <div className="flex items-start gap-3 border-t border-border/40 pt-3">
                <span className="text-danger bg-danger/10 p-1 rounded-lg border border-danger/20 text-[12px] mt-0.5">🏁</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-charcoal-light uppercase tracking-wider mb-0.5">{t('destination_address_label')}</p>
                  <p className="text-[13px] text-white font-medium truncate">{task.destination.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Price Card */}
        <div className="glass-panel rounded-3xl p-6 border border-border mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[14px] font-bold uppercase tracking-wider text-charcoal-light">{t('task_price_label')}</span>
            <div className="text-right">
              <span className="text-[28px] font-black text-accent">{formatPrice(task.offeredPrice)}</span>
            </div>
          </div>

          {task.itemBudget > 0 && (
            <div className="flex items-center justify-between mt-2 relative z-10 border-t border-border/40 pt-2">
              <span className="text-[14px] font-bold uppercase tracking-wider text-charcoal-light">{t('item_budget')}</span>
              <div className="text-right">
                <span className="text-[22px] font-bold text-warning">{formatPrice(task.itemBudget)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Active task → Navigate to live tracking */}
        {isActive && (
          <button
            onClick={() => navigate(`/active/${task.id}`)}
            className="w-full py-4 rounded-2xl btn-accent font-extrabold text-[16px] shadow-[0_8px_25px_rgba(0,255,135,0.4)] transition-all flex items-center justify-center gap-2 animate-pulse-glow"
            id="track-task"
          >
            <MapPin size={20} strokeWidth={3} />
            {t('track_live')}
          </button>
        )}

        {/* Bids Section / Bidding Form */}
        {(task.status === 'open' || task.status === 'bidding') && (
          <div>
            {isOwner ? (
              <>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <h3 className="text-[20px] font-extrabold text-white">
                    {t('bids')}
                    {bids.length > 0 && (
                      <span className="text-accent ml-2">({bids.length})</span>
                    )}
                  </h3>
                  {bids.length === 0 && (
                    <span className="text-[13px] text-accent font-bold flex items-center gap-2 bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                      <span className="w-2 h-2 bg-accent rounded-full animate-ping" />
                      {t('waiting_runners')}
                    </span>
                  )}
                </div>

                {bids.length === 0 ? (
                  <div className="glass-panel rounded-3xl p-10 text-center border border-border">
                    <span className="text-5xl block mb-4 opacity-50">📡</span>
                    <p className="text-[15px] text-white font-bold mb-1">{t('no_bids_yet')}</p>
                    <p className="text-[14px] text-charcoal-light font-medium">{t('runners_notified')}</p>
                  </div>
                ) : (
                  <div>
                    {bids.map((bid, i) => (
                      <div key={bid.id} className="mb-5">
                        <BidCard
                          bid={{
                            ...bid,
                            status: acceptedBidId === bid.id ? 'accepted' : bid.status,
                          }}
                          onAccept={handleAccept}
                          onCounter={handleCounter}
                          onReject={() => {}}
                          onViewProfile={(runnerId) => {
                            setSelectedRunnerId(runnerId);
                            setShowRunnerModal(true);
                          }}
                          animationDelay={i * 0.1}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                {runnerBid ? (
                  <div className="glass-panel rounded-3xl p-6 border border-border text-center">
                    <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto mb-3">
                      <Check size={22} strokeWidth={3} />
                    </div>
                    <p className="text-[16px] font-bold text-white mb-1">{t('proposed_offer_label')}</p>
                    <p className="text-[20px] font-black text-accent mb-4">{formatPrice(runnerBid.proposedPrice)}</p>
                    <button
                      onClick={handleCancelBid}
                      className="py-3 px-6 rounded-xl border border-border text-charcoal hover:text-white transition-colors text-[13px] font-bold"
                    >
                      {t('cancel_bid_btn')}
                    </button>
                  </div>
                ) : (
                  <div className="bg-dark-surface rounded-3xl p-6 border border-border">
                    <h3 className="text-[18px] font-black text-white mb-4">{t('place_bid')}</h3>
                    
                    <div className="mb-5">
                      <label className="text-[11px] font-bold text-charcoal-light block mb-2 uppercase tracking-wider">{t('your_offer')}</label>
                      <PriceInput
                        value={bidPrice}
                        onChange={setBidPrice}
                        min={10}
                        max={1000}
                      />
                    </div>

                    <div className="mb-5">
                      <label className="text-[11px] font-bold text-charcoal-light block mb-2 uppercase tracking-wider">{t('eta')}</label>
                      <input
                        type="text"
                        value={bidEta}
                        onChange={(e) => setBidEta(e.target.value)}
                        placeholder={t('eg_25_min')}
                        className="input-field w-full px-4 py-3 rounded-xl font-medium"
                      />
                    </div>

                    <div className="mb-6">
                      <label className="text-[11px] font-bold text-charcoal-light block mb-2 uppercase tracking-wider">{t('note')}</label>
                      <textarea
                        value={bidMsg}
                        onChange={(e) => setBidMsg(e.target.value)}
                        placeholder={t('add_a_message_for_the_client')}
                        rows={3}
                        className="input-field w-full px-4 py-3 rounded-xl font-medium resize-none"
                      />
                    </div>

                    <button
                      onClick={handlePlaceBid}
                      disabled={placingBid}
                      className="w-full btn-accent py-4 rounded-2xl text-[15px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      {placingBid ? <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" /> : t('place_bid_btn')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isOwner && (task.status === 'open' || task.status === 'bidding') && (
          <button
            onClick={handleCancelTask}
            className="w-full mt-6 py-4 rounded-xl border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors text-[14px] font-bold uppercase tracking-wider"
          >
            {t('cancel_task')}
          </button>
        )}
      </div>

      {/* Counter Modal */}
      {counterModal && counterBid && (
        <Modal onClose={() => setCounterModal(false)}>
          <div className="p-1">
            <h3 className="text-[20px] font-black text-white mb-2">{t('counter_offer_label')}</h3>
            <p className="text-[13px] text-charcoal-light font-medium mb-6">
              {t('propose_a_different_price_to_the_ru')}
            </p>

            <div className="mb-6">
              <label className="text-[11px] font-bold text-charcoal-light block mb-2 uppercase tracking-wider">{t('proposed_price_label')}</label>
              <PriceInput
                value={counterPrice}
                onChange={setCounterPrice}
                min={10}
                max={1000}
              />
            </div>

            <div className="mb-6">
              <label className="text-[11px] font-bold text-charcoal-light block mb-2 uppercase tracking-wider">{t('note')}</label>
              <textarea
                value={counterMsg}
                onChange={(e) => setCounterMsg(e.target.value)}
                placeholder={t('include_a_short_counter_note')}
                rows={3}
                className="input-field w-full px-4 py-3 rounded-xl font-medium resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCounterModal(false)}
                className="flex-1 py-3.5 rounded-xl border border-border text-charcoal font-bold text-[14px]"
              >
                {t('back')}
              </button>
              <button
                onClick={submitCounter}
                className="flex-1 btn-accent py-3.5 rounded-xl text-[14px] font-extrabold uppercase tracking-wider"
              >
                {t('submit_counter_btn')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Runner Public Profile Modal */}
      <RunnerProfileModal
        isOpen={showRunnerModal}
        onClose={() => setShowRunnerModal(false)}
        runnerId={selectedRunnerId}
      />
    </div>
  );
}
