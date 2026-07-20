import { AlertTriangle, Eye, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchDisputes, resolveDispute } from '@shared/data/adminApi';

const STATUS_TABS = [
  { key: 'open', label: 'Open', icon: AlertTriangle },
  { key: 'resolved', label: 'Resolved', icon: Check },
  { key: 'dismissed', label: 'Dismissed', icon: X },
  { key: null, label: 'All', icon: Eye },
];

const RESOLUTION_OPTIONS = [
  { value: 'refund_client', label: 'Full Refund to Client' },
  { value: 'release_runner', label: 'Full Release to Runner' },
  { value: 'split_50_50', label: 'Split 50/50' },
  { value: 'custom', label: 'Custom Adjustment' },
];

export default function AdminDisputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolution, setResolution] = useState('refund_client');
  const [actionLoading, setActionLoading] = useState(false);

  async function loadDisputes() {
    setLoading(true);
    const data = await fetchDisputes(activeTab);
    setDisputes(data);
    setLoading(false);
  }

  useEffect(() => {
    loadDisputes();
  }, [activeTab]);

  const handleResolve = async () => {
    if (!selectedDispute) return;
    setActionLoading(true);
    await resolveDispute(selectedDispute.id, resolution, adminNotes, user.id);
    setShowResolveModal(false);
    setAdminNotes('');
    setSelectedDispute(null);
    await loadDisputes();
    setActionLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Dispute Resolution</h1>
        <p className="text-[14px] text-charcoal-light font-medium">Manage and resolve platform disputes</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all border
              ${activeTab === tab.key
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-dark-surface border-border text-charcoal-light hover:text-white hover:border-border-light'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-border-light p-12 text-center">
          <AlertTriangle size={48} className="text-charcoal-light mx-auto mb-4 opacity-50" />
          <p className="text-[16px] font-bold text-white mb-2">No disputes</p>
          <p className="text-[14px] text-charcoal-light">
            {activeTab === 'open' ? 'All disputes have been resolved!' : 'No disputes with this status.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {disputes.map(dispute => (
            <div
              key={dispute.id}
              className="glass-panel rounded-2xl border border-border-light p-6 hover:border-accent/20 transition-all cursor-pointer group"
              onClick={() => { setSelectedDispute(dispute); setShowDetailModal(true); }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-[16px] font-bold text-white mb-1">Dispute #{dispute.id.slice(0, 8)}</h3>
                  <p className="text-[12px] text-charcoal-light">Task: {dispute.task_id?.slice(0, 8) || 'N/A'}…</p>
                </div>
                <span className={`badge badge-${dispute.status}`}>{dispute.status}</span>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Reason</label>
                  <p className="text-[13px] text-charcoal font-medium line-clamp-2">{dispute.reason || 'No reason provided'}</p>
                </div>
                <div>
                  <label className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Description</label>
                  <p className="text-[13px] text-charcoal font-medium line-clamp-2">{dispute.description || 'No description'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-[11px] text-charcoal-light font-medium">
                  {dispute.created_at ? new Date(dispute.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </span>
                {dispute.status === 'open' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedDispute(dispute); setShowResolveModal(true); }}
                    className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 px-4 py-2 rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailModal && selectedDispute && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowDetailModal(false)}>
          <div className="w-full max-w-2xl bg-dark-surface border border-border-light rounded-3xl p-8 animate-scale-in shadow-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-extrabold text-white">Dispute Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Dispute ID</label>
                <p className="text-[14px] text-white font-mono">{selectedDispute.id}</p>
              </div>
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Reason</label>
                <p className="text-[14px] text-charcoal font-medium">{selectedDispute.reason || 'N/A'}</p>
              </div>
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Description</label>
                <p className="text-[14px] text-charcoal font-medium">{selectedDispute.description || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Status</label>
                  <span className={`badge badge-${selectedDispute.status}`}>{selectedDispute.status}</span>
                </div>
                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Created</label>
                  <p className="text-[14px] text-charcoal font-medium">
                    {selectedDispute.created_at ? new Date(selectedDispute.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              {selectedDispute.admin_notes && (
                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Admin Notes</label>
                  <p className="text-[14px] text-charcoal font-medium">{selectedDispute.admin_notes}</p>
                </div>
              )}
              {selectedDispute.evidence_urls && selectedDispute.evidence_urls.length > 0 && (
                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Evidence</label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedDispute.evidence_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-accent hover:underline">
                        Evidence {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {selectedDispute.status === 'open' && (
              <div className="mt-6 pt-6 border-t border-border flex gap-3">
                <button
                  onClick={() => { setShowDetailModal(false); setShowResolveModal(true); }}
                  className="flex-1 py-3.5 rounded-xl bg-accent text-dark font-bold text-[14px] hover:bg-accent/90 transition-colors"
                >
                  Resolve Dispute
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowResolveModal(false)}>
          <div className="w-full max-w-md bg-dark-surface border border-border-light rounded-3xl p-6 animate-scale-in shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-extrabold text-white">Resolve Dispute</h3>
              <button onClick={() => setShowResolveModal(false)} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="mb-6">
              <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Resolution</label>
              <div className="space-y-2">
                {RESOLUTION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setResolution(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-[13px] font-medium transition-all
                      ${resolution === opt.value
                        ? 'bg-accent/10 border-accent/30 text-accent'
                        : 'bg-dark border-border text-charcoal hover:text-white hover:border-border-light'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="input-field w-full px-4 py-3.5 rounded-xl text-[14px] font-medium resize-none"
                rows={3}
                placeholder="Add notes about this resolution..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 py-3.5 rounded-xl border border-border text-charcoal-light font-bold text-[14px] hover:text-white hover:border-border-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={actionLoading}
                className="flex-1 py-3.5 rounded-xl bg-accent text-dark font-bold text-[14px] hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Resolve'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
