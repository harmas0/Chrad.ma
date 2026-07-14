import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye, Clock, Search, MessageCircle, X, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchDisputes, resolveDispute, dismissDispute, updateDisputeStatus } from '../../data/adminApi';
import { fetchProfileById } from '../../data/usersApi';

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
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [reporterProfile, setReporterProfile] = useState(null);
  const [reportedProfile, setReportedProfile] = useState(null);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
    const [reporter, reported] = await Promise.all([
      fetchProfileById(dispute.reporter_id),
      fetchProfileById(dispute.reported_user_id),
    ]);
    setReporterProfile(reporter);
    setReportedProfile(reported);
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

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Disputes</h1>
        <p className="text-[14px] text-charcoal-light font-medium">Manage user reports and conflicts</p>
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

                {d.evidence_urls?.length > 0 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-none">
                    {d.evidence_urls.map((url, i) => (
                      <div key={i} className="w-16 h-16 rounded-lg bg-dark border border-border overflow-hidden shrink-0">
                        <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail / Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedDispute(null)}>
          <div className="w-full max-w-lg bg-dark-surface border border-border-light rounded-3xl p-6 animate-scale-in shadow-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-extrabold text-white">Dispute Details</h3>
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
              <p className="text-[14px] text-charcoal-light leading-relaxed">{selectedDispute.description || 'No description provided'}</p>
            </div>

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

            {/* Evidence */}
            {selectedDispute.evidence_urls?.length > 0 && (
              <div className="mb-5">
                <p className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-3">Evidence</p>
                <div className="flex gap-3 overflow-x-auto scrollbar-none">
                  {selectedDispute.evidence_urls.map((url, i) => (
                    <div key={i} className="w-24 h-24 rounded-xl bg-dark border border-border overflow-hidden shrink-0">
                      <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution form — only for open/investigating */}
            {['open', 'investigating'].includes(selectedDispute.status) && (
              <>
                <div className="mb-4">
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-medium resize-none"
                    rows={2}
                    placeholder="Internal notes about this dispute..."
                  />
                </div>
                <div className="mb-6">
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Resolution (visible to both parties)</label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="input-field w-full px-4 py-3 rounded-xl text-[14px] font-medium resize-none"
                    rows={2}
                    placeholder="Describe the resolution..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDismiss}
                    disabled={actionLoading}
                    className="flex-1 py-3.5 rounded-xl border border-border text-charcoal-light font-bold text-[14px] hover:text-white hover:border-border-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Dismiss
                  </button>
                  <button
                    onClick={handleResolve}
                    disabled={actionLoading}
                    className="flex-1 py-3.5 rounded-xl bg-accent text-dark font-bold text-[14px] hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Resolve
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Already resolved */}
            {selectedDispute.status === 'resolved' && selectedDispute.resolution && (
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                <p className="text-[11px] text-accent font-bold mb-1">Resolution</p>
                <p className="text-[13px] text-charcoal">{selectedDispute.resolution}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
