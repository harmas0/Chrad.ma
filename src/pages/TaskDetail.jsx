import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, MessageCircle, Star, Send } from 'lucide-react';
import { fetchTaskById, updateTaskStatus, TASK_CATEGORIES } from '../data/mockTasks';
import { fetchBidsForTask, updateBidStatus, updateBidPriceAndMessage, createBid } from '../data/mockBids';
import { getCurrentUserId } from '../data/mockUsers';
import BidCard from '../components/BidCard';
import MapView from '../components/MapView';
import Modal from '../components/Modal';
import PriceInput from '../components/PriceInput';

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
  open: { label: 'Waiting for bids', color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
  bidding: { label: 'Bids coming in!', color: 'text-warning', bg: 'bg-warning-light border-warning/20' },
  accepted: { label: 'Runner accepted', color: 'text-info', bg: 'bg-info-light border-info/20' },
  picked_up: { label: 'Items picked up', color: 'text-info', bg: 'bg-info-light border-info/20' },
  en_route: { label: 'Runner en route', color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
  delivered: { label: 'Confirm to release payment', color: 'text-accent', bg: 'bg-accent/10 border-accent/20' },
  confirmed: { label: 'Completed', color: 'text-charcoal-light', bg: 'bg-muted-light/20 border-border' },
};

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const [counterModal, setCounterModal] = useState(false);
  const [counterBid, setCounterBid] = useState(null);
  const [counterPrice, setCounterPrice] = useState(0);
  const [counterMsg, setCounterMsg] = useState('');
  const [acceptedBidId, setAcceptedBidId] = useState(null);

  // Runner placing bid state
  const [bidPrice, setBidPrice] = useState(0);
  const [bidEta, setBidEta] = useState('20 min');
  const [bidMsg, setBidMsg] = useState('');
  const [placingBid, setPlacingBid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [t, b] = await Promise.all([fetchTaskById(id), fetchBidsForTask(id)]);
      if (!cancelled) {
        setTask(t);
        setBids(b);
        setAcceptedBidId(t?.acceptedBid || null);
        if (t) setBidPrice(t.offeredPrice);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
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
        <p className="text-charcoal-light font-bold text-lg">Task not found</p>
      </div>
    );
  }

  const category = TASK_CATEGORIES.find(c => c.id === task.category);
  const status = statusConfig[task.status];
  const currentUserId = getCurrentUserId();
  const isOwner = task.clientId === currentUserId;
  const runnerBid = bids.find(b => b.runnerId === currentUserId);

  const handleAccept = async (bid) => {
    setAcceptedBidId(bid.id);
    await updateBidStatus(bid.id, 'accepted');
    await updateTaskStatus(task.id, 'accepted', {
      accepted_bid: bid.id,
      accepted_runner_id: bid.runnerId
    });
    const [t, b] = await Promise.all([fetchTaskById(id), fetchBidsForTask(id)]);
    setTask(t);
    setBids(b);
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
    const [t, b] = await Promise.all([fetchTaskById(id), fetchBidsForTask(id)]);
    setTask(t);
    setBids(b);
  };

  const handlePlaceBid = async () => {
    const currentUserId = getCurrentUserId();
    setPlacingBid(true);
    const newBid = await createBid({
      taskId: task.id,
      runnerId: currentUserId,
      proposedPrice: bidPrice,
      eta: bidEta,
      message: bidMsg,
    });
    if (newBid) {
      const [t, b] = await Promise.all([fetchTaskById(id), fetchBidsForTask(id)]);
      setTask(t);
      setBids(b);
      setBidMsg('');
    } else {
      alert('Failed to place bid.');
    }
    setPlacingBid(false);
  };

  const isActive = ['accepted', 'picked_up', 'en_route'].includes(task.status);

  return (
    <div className="pb-safe-only min-h-screen bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-panel border-b border-border-light px-5 pt-safe pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-white hover:bg-surface transition-colors"
            id="task-back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-extrabold text-white truncate mb-1">{task.title}</h1>
            <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.color} ${status.bg}`}>
              {status.label}
            </span>
          </div>
          <span className="text-3xl drop-shadow-md">{category?.icon}</span>
        </div>
      </div>

      <div className="px-5 py-8 animate-fade-in-up">
        {/* Map */}
        <div className="rounded-[24px] overflow-hidden border border-border-light shadow-lg mb-6">
          <MapView
            pickup={task.pickup}
            destination={task.destination}
            height="220px"
          />
        </div>

        {/* Task Info Card */}
        <div className="glass-panel rounded-3xl p-6 border border-border-light relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Description */}
          <p className="text-[15px] text-white font-medium leading-relaxed mb-5 relative z-10">
            {task.description}
          </p>

          {/* Meta */}
          <div className="flex flex-col gap-4 text-[13px] text-charcoal-light font-medium relative z-10 mb-6">
            <span className="inline-flex items-center gap-2">
              <span className="bg-accent/20 text-accent p-1.5 rounded-lg border border-accent/30"><MapPin size={14} /></span>
              {task.pickup.name || task.pickup.address}
            </span>
            {task.destination && (
              <span className="inline-flex items-center gap-2">
                <span className="bg-danger/20 text-danger p-1.5 rounded-lg border border-danger/30"><MapPin size={14} /></span>
                {task.destination.name || task.destination.address}
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <span className="bg-dark text-white p-1.5 rounded-lg border border-border"><Clock size={14} /></span>
              Posted {timeAgo(task.createdAt)}
            </span>
          </div>

          {/* Price row */}
          <div className="flex items-center justify-between pt-5 border-t border-border relative z-10">
            <span className="text-[14px] font-bold uppercase tracking-wider text-charcoal-light">Offered Price</span>
            <div className="text-right">
              <span className="text-[28px] font-black text-accent">{task.offeredPrice}</span>
              <span className="text-[12px] font-bold text-accent/80 uppercase tracking-widest ml-1">MAD</span>
            </div>
          </div>

          {task.itemBudget && (
            <div className="flex items-center justify-between mt-2 relative z-10">
              <span className="text-[14px] font-bold uppercase tracking-wider text-charcoal-light">Item Budget</span>
              <div className="text-right">
                <span className="text-[22px] font-bold text-warning">{task.itemBudget}</span>
                <span className="text-[12px] font-bold text-warning/80 uppercase tracking-widest ml-1">MAD</span>
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
            Track Live
          </button>
        )}

        {/* Bids Section / Bidding Form */}
        {(task.status === 'open' || task.status === 'bidding') && (
          <div>
            {isOwner ? (
              <>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <h3 className="text-[20px] font-extrabold text-white">
                    Bids
                    {bids.length > 0 && (
                      <span className="text-accent ml-2">({bids.length})</span>
                    )}
                  </h3>
                  {bids.length === 0 && (
                    <span className="text-[13px] text-accent font-bold flex items-center gap-2 bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                      <span className="w-2 h-2 bg-accent rounded-full animate-ping" />
                      Waiting for runners...
                    </span>
                  )}
                </div>

                {bids.length === 0 ? (
                  <div className="glass-panel rounded-3xl p-10 text-center border border-border">
                    <span className="text-5xl block mb-4 opacity-50">📡</span>
                    <p className="text-[15px] text-white font-bold mb-1">No bids yet</p>
                    <p className="text-[14px] text-charcoal-light font-medium">Nearby runners are being notified.</p>
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
                          animationDelay={i * 0.1}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {runnerBid ? (
                  <div className="glass-panel rounded-3xl p-6 border border-accent/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10 mb-4">
                      <span className="text-[14px] text-charcoal-light font-bold uppercase tracking-wider">Your Active Bid</span>
                      <span className="text-[12px] bg-accent/20 text-accent border border-accent/40 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                        {runnerBid.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between relative z-10 mb-4">
                      <div>
                        <span className="text-[32px] font-black text-white">{runnerBid.proposedPrice}</span>
                        <span className="text-[14px] font-bold text-accent ml-1 uppercase">MAD</span>
                        <span className="text-[13px] text-charcoal-light font-medium ml-3 bg-dark px-2 py-1 rounded-lg border border-border">ETA: {runnerBid.eta}</span>
                      </div>
                    </div>
                    {runnerBid.message && (
                      <p className="text-[14px] text-white font-medium bg-dark border border-border rounded-xl px-4 py-3 italic relative z-10">
                        &ldquo;{runnerBid.message}&rdquo;
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="glass-panel rounded-3xl p-6 border border-border">
                    <h3 className="text-[20px] font-extrabold text-white mb-4">Place a Bid</h3>
                    
                    <div className="mb-4">
                      <PriceInput
                        value={bidPrice}
                        onChange={setBidPrice}
                        label="Your Offer"
                        min={10}
                        max={1000}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2 mb-4">
                      <div>
                        <label className="text-[13px] font-bold text-charcoal-light uppercase tracking-wider block mb-2">ETA</label>
                        <select
                          value={bidEta}
                          onChange={(e) => setBidEta(e.target.value)}
                          className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-bold"
                        >
                          <option value="15 min">15 min</option>
                          <option value="25 min">25 min</option>
                          <option value="40 min">40 min</option>
                          <option value="1 hour">1 hour</option>
                          <option value="2 hours">2 hours</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[13px] font-bold text-charcoal-light uppercase tracking-wider block mb-2">Note</label>
                        <input
                          type="text"
                          value={bidMsg}
                          onChange={(e) => setBidMsg(e.target.value)}
                          placeholder="e.g. I have a bike"
                          className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-medium"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePlaceBid}
                      disabled={placingBid}
                      className="w-full py-4 rounded-2xl btn-accent font-extrabold text-[16px] shadow-[0_8px_25px_rgba(0,255,135,0.4)] transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      Place Bid — {bidPrice} MAD
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Counter-Offer Modal */}
      <Modal
        isOpen={counterModal}
        onClose={() => setCounterModal(false)}
        title="Counter Offer"
      >
        {counterBid && (
          <div>
            <div className="flex items-center gap-4 bg-dark border border-border rounded-2xl p-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-[16px] font-black text-accent border border-accent/30">
                {counterBid.runnerInitials}
              </div>
              <div>
                <span className="text-[16px] font-bold text-white block mb-0.5">{counterBid.runnerName}</span>
                <span className="text-[13px] text-charcoal-light font-medium">asked for {counterBid.proposedPrice} MAD</span>
              </div>
            </div>

            <div className="mb-6">
              <PriceInput
                value={counterPrice}
                onChange={setCounterPrice}
                label="Your Counter"
                min={10}
                max={counterBid.proposedPrice + 50}
              />
            </div>
            <div className="mb-6">
              <label className="text-[13px] font-bold text-charcoal-light uppercase tracking-wider block mb-2">Message</label>
              <textarea
                value={counterMsg}
                onChange={(e) => setCounterMsg(e.target.value)}
                placeholder="Add a note to the runner..."
                rows={3}
                className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-medium resize-none"
              />
            </div>

            <button
              onClick={submitCounter}
              className="w-full py-4 rounded-2xl btn-accent font-extrabold text-[16px] transition-all flex items-center justify-center gap-2"
              id="submit-counter"
            >
              <Send size={18} strokeWidth={2.5} />
              Send Counter — {counterPrice} MAD
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
