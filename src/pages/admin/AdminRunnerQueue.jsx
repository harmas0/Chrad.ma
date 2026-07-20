import { useState, useEffect } from 'react';
import { ShieldCheck, Eye, Check, X, Clock, AlertTriangle, Truck, Award, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchRunnerQueue, verifyRunnerTier, rejectKYC } from '../../data/adminApi';

const TIER_OPTIONS = [
  { key: 'standard', label: 'Standard Tier', icon: '🏃', desc: 'Pedestrian deliveries & basic tasks' },
  { key: 'express', label: 'Express Motor (Bikes/Scooters)', icon: '🛵', desc: 'Fast food, documents, and standard parcel runs' },
  { key: 'cargo', label: 'Cargo Carrier (Cars/Vans)', icon: '🚗', desc: 'Heavy items, furniture, bulk shopping orders' },
  { key: 'premium', label: 'Premium Carrier (VIP/Valuable)', icon: '💼', desc: 'High-value item delivery, express priority task handling' },
];

export default function AdminRunnerQueue() {
  const { user } = useAuth();
  const [runners, setRunners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunner, setSelectedRunner] = useState(null);
  const [tier, setTier] = useState('standard');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  async function loadQueue() {
    setLoading(true);
    const data = await fetchRunnerQueue();
    setRunners(data);
    setLoading(false);
  }

  useEffect(() => {
    loadQueue();
  }, []);

  const handleVerify = async () => {
    if (!selectedRunner) return;
    setActionLoading(true);
    const success = await verifyRunnerTier(selectedRunner.id, tier, notes, user.id);
    if (success) {
      alert(`Runner verified successfully as ${tier.toUpperCase()}`);
      setSelectedRunner(null);
      setNotes('');
      setTier('standard');
      await loadQueue();
    } else {
      alert('Failed to verify runner.');
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!selectedRunner || !rejectReason.trim()) return;
    setActionLoading(true);
    const success = await rejectKYC(selectedRunner.id, rejectReason, user.id);
    if (success) {
      alert('Application rejected.');
      setSelectedRunner(null);
      setRejectReason('');
      setRejectMode(false);
      await loadQueue();
    } else {
      alert('Failed to reject application.');
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Runner Onboarding Queue</h1>
        <p className="text-[14px] text-charcoal-light font-medium">Verify runner credentials and assign carrier service tiers</p>
      </div>

      {runners.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-border-light p-12 text-center">
          <UserCheck size={48} className="text-accent mx-auto mb-4 opacity-50" />
          <p className="text-[16px] font-bold text-white mb-2">Onboarding Queue Clear</p>
          <p className="text-[14px] text-charcoal-light">No runners awaiting carrier tier assignment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List queue */}
          <div className="lg:col-span-2 space-y-4">
            {runners.map((runner) => (
              <div
                key={runner.id}
                onClick={() => { setSelectedRunner(runner); setRejectMode(false); }}
                className={`glass-panel p-6 border rounded-2xl transition-all cursor-pointer flex flex-col justify-between hover:border-accent/30
                  ${selectedRunner?.id === runner.id ? 'border-accent shadow-[0_0_20px_rgba(0,255,135,0.15)] bg-accent/[0.02]' : 'border-border-light'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-dark border border-border flex items-center justify-center text-accent text-[14px] font-black shrink-0">
                    {runner.initials || runner.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-white truncate">{runner.name}</h3>
                    <p className="text-[12px] text-charcoal-light truncate mb-2">{runner.email}</p>
                    <div className="flex items-center gap-4 text-[11px] text-charcoal-light font-medium">
                      <span>Submitted: {runner.kyc_submitted_at ? new Date(runner.kyc_submitted_at).toLocaleDateString() : 'Pending'}</span>
                      {runner.kyc_vehicle_url && (
                        <span className="text-accent flex items-center gap-1 font-bold">
                          <Truck size={12} /> Has Vehicle Docs
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="badge badge-pending">Review Pending</span>
                </div>
              </div>
            ))}
          </div>

          {/* Details & Review Panel */}
          <div>
            {selectedRunner ? (
              <div className="glass-panel p-6 border border-border-light rounded-2xl sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[16px] font-bold text-white flex items-center gap-2">
                    <Award size={16} className="text-accent" />
                    Reviewing Runner
                  </h2>
                  <button onClick={() => setSelectedRunner(null)} className="text-charcoal-light hover:text-white font-bold text-xs uppercase">Close</button>
                </div>

                <div className="mb-4">
                  <p className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-1">Name</p>
                  <p className="text-[14px] text-white font-bold">{selectedRunner.name}</p>
                </div>

                {/* Photos */}
                <div className="mb-6">
                  <p className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2">Uploaded Document Previews</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRunner.kyc_id_url && (
                      <a href={selectedRunner.kyc_id_url} target="_blank" rel="noreferrer" className="aspect-[4/3] rounded-lg border border-border overflow-hidden bg-dark block relative group">
                        <img src={selectedRunner.kyc_id_url} alt="ID Document" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 text-white px-1 py-0.5 rounded">ID Card</span>
                      </a>
                    )}
                    {selectedRunner.kyc_selfie_url && (
                      <a href={selectedRunner.kyc_selfie_url} target="_blank" rel="noreferrer" className="aspect-[4/3] rounded-lg border border-border overflow-hidden bg-dark block relative group">
                        <img src={selectedRunner.kyc_selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 text-white px-1 py-0.5 rounded">Selfie</span>
                      </a>
                    )}
                    {selectedRunner.kyc_vehicle_url && (
                      <a href={selectedRunner.kyc_vehicle_url} target="_blank" rel="noreferrer" className="aspect-[4/3] rounded-lg border border-border overflow-hidden bg-dark block relative group col-span-2">
                        <img src={selectedRunner.kyc_vehicle_url} alt="Vehicle Doc" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 text-[8px] bg-black/60 text-white px-1 py-0.5 rounded">Vehicle Docs / Licence</span>
                      </a>
                    )}
                  </div>
                </div>

                {!rejectMode ? (
                  <>
                    {/* Carrier Tier selection */}
                    <div className="mb-6">
                      <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Assign Runner Tier</label>
                      <div className="space-y-2">
                        {TIER_OPTIONS.map((opt) => (
                          <div
                            key={opt.key}
                            onClick={() => setTier(opt.key)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5
                              ${tier === opt.key ? 'border-accent bg-accent/5' : 'border-border bg-dark hover:border-charcoal-light'}`}
                          >
                            <span className="text-lg mt-0.5">{opt.icon}</span>
                            <div>
                              <p className="text-[13px] font-bold text-white leading-none mb-1">{opt.label}</p>
                              <p className="text-[11px] text-charcoal-light leading-snug">{opt.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* notes */}
                    <div className="mb-6">
                      <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Internal Verification Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add specific credentials verification notes..."
                        rows={3}
                        className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setRejectMode(true)}
                        className="flex-1 py-3.5 rounded-xl border border-danger/30 bg-danger/5 text-danger font-bold text-[13px] hover:bg-danger/10 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={handleVerify}
                        disabled={actionLoading}
                        className="flex-1 btn-accent py-3.5 rounded-xl text-[13px] font-bold uppercase tracking-wider"
                      >
                        Approve Tier
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6 bg-danger/5 border border-danger/20 rounded-xl p-4 flex gap-2">
                      <AlertTriangle className="text-danger shrink-0 mt-0.5" size={16} />
                      <p className="text-[12px] text-charcoal-light">You are rejecting onboarding for this runner. Please provide notes explaining why.</p>
                    </div>

                    <div className="mb-6">
                      <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Rejection Reason</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Why is this runner profile rejected? (Blurry license, wrong vehicle docs...)"
                        rows={4}
                        className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setRejectMode(false)}
                        className="flex-1 py-3 rounded-xl border border-border text-charcoal-light font-bold text-[13px]"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={!rejectReason.trim() || actionLoading}
                        className="flex-1 py-3 rounded-xl bg-danger text-white font-bold text-[13px] hover:bg-danger/90 transition-colors disabled:opacity-50"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="glass-panel p-6 border border-dashed border-border-light rounded-2xl text-center text-charcoal-light text-[13px] py-16">
                Select a runner from the list to review their document credentials and assign their service tier.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
