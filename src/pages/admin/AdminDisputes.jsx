import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye, Clock, Search, MessageCircle, X, User, ShieldCheck, DollarSign, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchDisputes, resolveDispute, dismissDispute, updateDisputeStatus } from '../../data/adminApi';
import { fetchProfileById } from '../../data/usersApi';
import { fetchTaskById, updateTaskStatus } from '../../data/tasksApi';

const REASON_LABELS = {
  'didnt_deliver': "Didn't deliver",
  'damaged_item': 'Damaged item',
  'rude_behavior': 'Rude behavior',
  'scam': 'Scam / Fraud',
  'other': 'Other',
};

const STATUS_CONFIG = {
  open: { label: 'Open', badge: 'badge-open', icon: AlertTriangle },
  investigating: { label: 'Investigating', badge: 'badge-pending', icon: Eye },
  resolved: { label: 'Resolved', badge: 'badge-approved', icon: CheckCircle },
  dismissed: { label: 'Dismissed', badge: 'badge-none', icon: XCircle },
};

export default function AdminDisputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');
  
  // Selected dispute state
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [reporterProfile, setReporterProfile] = useState(null);
  const [reportedProfile, setReportedProfile] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Evidence Gallery Slider index
  const [sliderIndex, setSliderIndex] = useState(0);

  async function loadDisputes() {
    setLoading(true);
    const data = await fetchDisputes(statusFilter);
    setDisputes(data);
    setLoading(false);
  }

  useEffect(() => {
    loadDisputes();
  }, [statusFilter]);

  const openDisputeDetail = async (dispute) => {
    setSelectedDispute(dispute);
    setResolution('');
    setAdminNotes('');
    setSliderIndex(0);
    setTaskDetails(null);

    const [reporter, reported, task] = await Promise.all([
      fetchProfileById(dispute.reporter_id),
      fetchProfileById(dispute.reported_user_id),
      fetchTaskById(dispute.task_id)
    ]);
    setReporterProfile(reporter);
    setReportedProfile(reported);
    setTaskDetails(task);
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;
    setActionLoading(true);
    await resolveDispute(selectedDispute.id, resolution, adminNotes, user.id);
    setSelectedDispute(null);
    await loadDisputes();
    setActionLoading(false);
  };

  const handleDismiss = async () => {
    if (!selectedDispute) return;
    setActionLoading(true);
    await dismissDispute(selectedDispute.id, adminNotes, user.id);
    setSelectedDispute(null);
    await loadDisputes();
    setActionLoading(false);
  };

  const handleMarkInvestigating = async (disputeId) => {
    setActionLoading(true);
    await updateDisputeStatus(disputeId, 'investigating', user.id);
    await loadDisputes();
    setActionLoading(false);
  };

  // Quick Resolve Room Actions
  const handleQuickReleaseToRunner = async () => {
    if (!selectedDispute || !taskDetails) return;
    if (!window.confirm('Release Escrow Funds to Runner? This will set the task to CONFIRMED and close this dispute as resolved.')) return;
    setActionLoading(true);

    const resolveNotes = "Resolved via Admin Room: Escrow funds fully released to runner.";
    const disputeSuccess = await resolveDispute(selectedDispute.id, resolveNotes, "Admin forced payout release to runner.", user.id);
    const taskSuccess = await updateTaskStatus(selectedDispute.task_id, 'confirmed');

    if (disputeSuccess && taskSuccess) {
      alert('Escrow released and dispute resolved.');
      setSelectedDispute(null);
      await loadDisputes();
    } else {
      alert('Failed to execute resolution.');
    }
    setActionLoading(false);
  };

  const handleQuickRefundToClient = async () => {
    if (!selectedDispute || !taskDetails) return;
    if (!window.confirm('Refund Client? This will cancel the task, suspend runner payout, and close the dispute.')) return;
    setActionLoading(true);

    const resolveNotes = "Resolved via Admin Room: Escrow funds fully refunded back to client.";
    const disputeSuccess = await resolveDispute(selectedDispute.id, resolveNotes, "Admin cancelled task and refunded client.", user.id);
    const taskSuccess = await updateTaskStatus(selectedDispute.task_id, 'cancelled');

    if (disputeSuccess && taskSuccess) {
      alert('Escrow refunded and task marked as cancelled.');
      setSelectedDispute(null);
      await loadDisputes();
    } else {
      alert('Failed to execute resolution.');
    }
    setActionLoading(false);
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Disputes & Conflict Resolution</h1>
        <p className="text-[14px] text-charcoal-light font-medium">Manage user reports, verify completion proofs, and arbitrate escrows</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all border
              ${statusFilter === key
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-dark-surface border-border text-charcoal-light hover:text-white hover:border-border-light'
              }`}
          >
            <cfg.icon size={14} />
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Disputes list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-border-light p-12 text-center">
          <CheckCircle size={48} className="text-accent mx-auto mb-4 opacity-50" />
          <p className="text-[16px] font-bold text-white mb-2">All clear!</p>
          <p className="text-[14px] text-charcoal-light">No {statusFilter} disputes at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(d => {
            const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.open;
            return (
              <div
                key={d.id}
                className="glass-panel rounded-2xl border border-border-light p-6 hover:border-accent/15 transition-all cursor-pointer group"
                onClick={() => openDisputeDetail(d)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0
                    ${d.status === 'open' ? 'bg-info/10 border-info/20 text-info' : ''}
                    ${d.status === 'investigating' ? 'bg-warning/10 border-warning/20 text-warning' : ''}
                    ${d.status === 'resolved' ? 'bg-accent/10 border-accent/20 text-accent' : ''}
                    ${d.status === 'dismissed' ? 'bg-muted/10 border-border text-charcoal-light' : ''}
                  `}>
                    <cfg.icon size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-[15px] font-bold text-white">{REASON_LABELS[d.reason] || d.reason}</h3>
                      <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <p className="text-[13px] text-charcoal-light mb-2 line-clamp-2">{d.description || 'No description provided'}</p>
                    <div className="flex items-center gap-4 text-[11px] text-charcoal-light font-medium">
                      <span>Task: <span className="text-white font-mono">{d.task_id?.slice(0, 12)}</span></span>
                      <span>•</span>
                      <span>{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {d.status === 'open' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkInvestigating(d.id); }}
                      disabled={actionLoading}
                      className="text-[11px] font-bold text-warning bg-warning/10 border border-warning/20 px-4 py-2 rounded-lg hover:bg-warning/20 transition-colors shrink-0 disabled:opacity-50"
                    >
                      <Eye size={12} className="inline mr-1" />
                      Investigate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail / Arbitrate Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedDispute(null)}>
          <div className="w-full max-w-3xl bg-dark-surface border border-border-light rounded-3xl p-6 animate-scale-in shadow-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 border-b border-border pb-3">
              <h3 className="text-[18px] font-extrabold text-white flex items-center gap-1.5">
                <AlertTriangle size={18} className="text-warning" />
                Dispute Arbitration Room
              </h3>
              <button onClick={() => setSelectedDispute(null)} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Reason & Description */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`badge ${(STATUS_CONFIG[selectedDispute.status] || STATUS_CONFIG.open).badge}`}>{selectedDispute.status}</span>
                <span className="text-[13px] font-bold text-white">{REASON_LABELS[selectedDispute.reason] || selectedDispute.reason}</span>
              </div>
              <p className="text-[13px] text-charcoal-light bg-dark rounded-xl p-3 border border-border leading-relaxed">
                <strong>Dispute Claim:</strong> {selectedDispute.description || 'No description provided'}
              </p>
            </div>

            {/* Evidence Photo Gallery Slider */}
            {selectedDispute.evidence_urls && selectedDispute.evidence_urls.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2">Submitted Claim Evidence Gallery</p>
                <div className="relative aspect-[21/9] rounded-xl overflow-hidden border border-border bg-dark flex items-center justify-center">
                  <img
                    src={selectedDispute.evidence_urls[sliderIndex]}
                    alt={`Evidence page ${sliderIndex + 1}`}
                    className="h-full w-full object-contain"
                  />
                  {selectedDispute.evidence_urls.length > 1 && (
                    <>
                      <button
                        onClick={() => setSliderIndex(prev => (prev > 0 ? prev - 1 : selectedDispute.evidence_urls.length - 1))}
                        className="absolute left-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/85"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setSliderIndex(prev => (prev < selectedDispute.evidence_urls.length - 1 ? prev + 1 : 0))}
                        className="absolute right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/85"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                  <span className="absolute bottom-2 right-2 text-[9px] bg-black/65 px-2 py-0.5 rounded text-white font-bold">
                    {sliderIndex + 1} / {selectedDispute.evidence_urls.length} Photos
                  </span>
                </div>
              </div>
            )}

            {/* Proof Comparison Room */}
            {taskDetails && (
              <div className="mb-6">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2">Proof Verification Room</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Requirements */}
                  <div className="bg-dark rounded-xl p-4 border border-border flex flex-col justify-between">
                    <div>
                      <h4 className="text-[12px] font-bold text-white mb-2">Original Task Details</h4>
                      <p className="text-[13px] text-white font-medium mb-1">{taskDetails.title}</p>
                      <p className="text-[12px] text-charcoal-light mb-3">{taskDetails.description || 'No instruction notes.'}</p>
                    </div>
                    <div className="flex justify-between items-center border-t border-border/50 pt-2 text-[12px] font-bold">
                      <span className="text-charcoal-light">Escrow Budget:</span>
                      <span className="text-accent">{taskDetails.offeredPrice + (taskDetails.itemBudget || 0)} MAD</span>
                    </div>
                  </div>

                  {/* Right: Runner Completion Proof Photo */}
                  <div className="bg-dark rounded-xl p-4 border border-border flex flex-col justify-between">
                    <div>
                      <h4 className="text-[12px] font-bold text-white mb-2">Runner Completion Proof Photo</h4>
                      {taskDetails.delivery_photo_url ? (
                        <a href={taskDetails.delivery_photo_url} target="_blank" rel="noreferrer" className="aspect-[16/9] rounded-lg border border-border overflow-hidden bg-black block relative group">
                          <img src={taskDetails.delivery_photo_url} alt="Runner proof" className="w-full h-full object-cover" />
                          <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold">Zoom image</span>
                        </a>
                      ) : (
                        <p className="text-[11px] text-charcoal-light italic py-4 text-center">No completion proof photo uploaded by runner.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-dark rounded-xl p-4 border border-border">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2">Reporter</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px] font-black">
                    {reporterProfile?.initials || '?'}
                  </div>
                  <span className="text-[13px] font-bold text-white truncate">{reporterProfile?.name || 'Loading...'}</span>
                </div>
              </div>
              <div className="bg-dark rounded-xl p-4 border border-border">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2">Reported</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center text-danger text-[10px] font-black">
                    {reportedProfile?.initials || '?'}
                  </div>
                  <span className="text-[13px] font-bold text-white truncate">{reportedProfile?.name || 'Loading...'}</span>
                </div>
              </div>
            </div>

            {/* Arbitration Controls */}
            {['open', 'investigating'].includes(selectedDispute.status) && (
              <div className="border-t border-border pt-4">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-3">Escrow Arbitrage Actions</p>
                
                {/* Fast Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    onClick={handleQuickRefundToClient}
                    disabled={actionLoading || !taskDetails}
                    className="py-3 rounded-xl border border-danger/30 bg-danger/5 hover:bg-danger/10 text-danger font-bold text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <DollarSign size={14} /> Refund Escrow back to Client
                  </button>
                  <button
                    onClick={handleQuickReleaseToRunner}
                    disabled={actionLoading || !taskDetails}
                    className="py-3 rounded-xl bg-accent text-dark font-bold text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <Award size={14} /> Release Escrow to Runner
                  </button>
                </div>

                <div className="mb-4">
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Internal Audit Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium resize-none"
                    rows={2}
                    placeholder="Internal moderator logs..."
                  />
                </div>
                <div className="mb-6">
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Resolution Summary (visible to both parties)</label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium resize-none"
                    rows={2}
                    placeholder="Provide final explanation..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleDismiss}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl border border-border text-charcoal font-bold text-[13px]"
                  >
                    Dismiss Dispute
                  </button>
                  <button
                    onClick={handleResolve}
                    disabled={actionLoading || !resolution.trim()}
                    className="flex-1 btn-accent py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider"
                  >
                    Resolve Dispute
                  </button>
                </div>
              </div>
            )}

            {/* Resolved information */}
            {selectedDispute.status === 'resolved' && selectedDispute.resolution && (
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                <p className="text-[11px] text-accent font-bold mb-1">Resolution Summary</p>
                <p className="text-[13px] text-charcoal-light leading-relaxed">{selectedDispute.resolution}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
