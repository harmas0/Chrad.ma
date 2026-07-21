import { useState, useEffect } from 'react';
import { 
  MapPin, 
  KeyRound, 
  Camera, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  User, 
  ShieldAlert, 
  Clock,
  Sparkles
} from 'lucide-react';
import Modal from './Modal';
import { supabase } from '../utils/supabaseClient';
import { logAdminAction } from '../data/adminApi';
import { useAuth } from '../context/AuthContext';
import CategoryIcon from './CategoryIcon';

export default function AdminTaskInspectModal({ isOpen, onClose, taskId, onRefresh }) {
  const { user: currentAdmin } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overridePrice, setOverridePrice] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => {
    if (isOpen && taskId) {
      loadTask();
    }
  }, [isOpen, taskId]);

  async function loadTask() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (!error) setTask(data);
    setLoading(false);
  }

  const handleForceStatus = async (newStatus) => {
    if (!window.confirm(`Confirm admin status override to '${newStatus}'?`)) return;

    setOverrideLoading(true);
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (!error) {
      await logAdminAction(currentAdmin.id, 'FORCE_TASK_STATUS', 'task', taskId, { newStatus });
      alert(`Task status overridden to '${newStatus}'.`);
      loadTask();
      if (onRefresh) onRefresh();
    }
    setOverrideLoading(false);
  };

  const handlePriceOverride = async () => {
    const amt = Number(overridePrice);
    if (!amt || amt <= 0) return;

    setOverrideLoading(true);
    const { error } = await supabase
      .from('tasks')
      .update({ price: amt })
      .eq('id', taskId);

    if (!error) {
      await logAdminAction(currentAdmin.id, 'OVERRIDE_TASK_PRICE', 'task', taskId, { newPrice: amt });
      alert(`Task price updated to ${amt} MAD.`);
      setOverridePrice('');
      loadTask();
      if (onRefresh) onRefresh();
    }
    setOverrideLoading(false);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admin Task Route & Security Inspector">
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-charcoal-light font-bold">Loading task inspector...</p>
        </div>
      ) : !task ? (
        <div className="py-8 text-center text-charcoal-light font-bold">Task record not found.</div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* Header Card */}
          <div className="flex items-center justify-between p-4 rounded-3xl bg-dark/60 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <CategoryIcon icon={task.category || 'Package'} size={24} />
              </div>
              <div>
                <h3 className="font-heading font-black text-white text-[16px] truncate max-w-xs">{task.title}</h3>
                <span className="text-[10px] text-charcoal-light uppercase font-mono">ID: {task.id}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[20px] font-black text-accent font-heading block">{task.price} MAD</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white">
                {task.status}
              </span>
            </div>
          </div>

          {/* Pickup & Destination Route */}
          <div className="p-4 rounded-2xl bg-dark/40 border border-white/10 space-y-3">
            <h4 className="text-[12px] font-bold text-charcoal-light uppercase tracking-wider">Route Coordinates</h4>
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-accent shrink-0" />
                <span className="text-white font-medium truncate">
                  Pickup: <strong>{task.pickup_address || task.pickupAddress || 'Casablanca'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-warning shrink-0" />
                <span className="text-white font-medium truncate">
                  Destination: <strong>{task.destination_address || task.destinationAddress || 'Casablanca'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Verification Secrets */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 space-y-1">
              <span className="text-[11px] font-bold text-charcoal-light uppercase block">Client Secret OTP PIN</span>
              <span className="text-[22px] font-black text-accent font-mono tracking-widest">
                {task.delivery_pin || task.deliveryPin || '4821'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-dark/40 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-charcoal-light uppercase block">Proof Photo Upload</span>
              <span className="text-[12px] font-bold text-white block truncate">
                {task.proof_photo_url || task.proofPhotoUrl ? 'Uploaded ✅' : 'Pending Upload'}
              </span>
            </div>
          </div>

          {/* Proof Photo Display */}
          {(task.proof_photo_url || task.proofPhotoUrl) && (
            <div className="p-3.5 rounded-2xl bg-dark/40 border border-white/10 space-y-2">
              <h4 className="text-[12px] font-bold text-white flex items-center gap-1.5">
                <Camera size={14} className="text-accent" />
                Uploaded Proof of Delivery
              </h4>
              <img
                src={task.proof_photo_url || task.proofPhotoUrl}
                alt="Delivery Proof"
                className="w-full h-44 object-cover rounded-xl border border-white/10"
              />
            </div>
          )}

          {/* Admin Override Actions */}
          <div className="p-4 rounded-2xl bg-dark/60 border border-white/10 space-y-3">
            <h4 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={16} className="text-warning" />
              Administrative Overrides
            </h4>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="New price in MAD"
                value={overridePrice}
                onChange={(e) => setOverridePrice(e.target.value)}
                className="flex-1 bg-dark/80 border border-white/10 rounded-xl p-2.5 text-[13px] text-white focus:border-accent focus:outline-none"
              />
              <button
                onClick={handlePriceOverride}
                disabled={overrideLoading}
                className="px-4 py-2.5 rounded-xl bg-accent text-dark font-extrabold text-[11px] uppercase tracking-wider"
              >
                Set Price
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleForceStatus('completed')}
                disabled={overrideLoading}
                className="flex-1 py-2.5 rounded-xl bg-accent/20 border border-accent/30 text-accent font-extrabold text-[11px] uppercase tracking-wider hover:bg-accent/30 transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle size={14} /> Force Complete
              </button>
              <button
                onClick={() => handleForceStatus('cancelled')}
                disabled={overrideLoading}
                className="flex-1 py-2.5 rounded-xl bg-danger/20 border border-danger/30 text-danger font-extrabold text-[11px] uppercase tracking-wider hover:bg-danger/30 transition-colors flex items-center justify-center gap-1"
              >
                <XCircle size={14} /> Force Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
