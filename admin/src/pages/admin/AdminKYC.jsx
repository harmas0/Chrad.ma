import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldX, Eye, Check, X, Clock, RotateCw, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchPendingKYC, fetchAllKYC, approveKYC, rejectKYC } from '@shared/data/adminApi';

const STATUS_TABS = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'approved', label: 'Approved', icon: Check },
  { key: 'rejected', label: 'Rejected', icon: X },
  { key: null, label: 'All', icon: Eye },
];

export default function AdminKYC() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rotation, setRotation] = useState(0);

  async function loadApplications() {
    setLoading(true);
    const data = activeTab === 'pending'
      ? await fetchPendingKYC()
      : await fetchAllKYC(activeTab);
    setApplications(data);
    setLoading(false);
  }

  useEffect(() => {
    loadApplications();
  }, [activeTab]);

  const handleApprove = async (userId) => {
    setActionLoading(true);
    const success = await approveKYC(userId, user.id);
    if (success) {
      const currentIndex = applications.findIndex(a => a.id === userId);
      const remaining = applications.filter(a => a.id !== userId);
      setApplications(remaining);
      if (remaining.length > 0 && currentIndex >= remaining.length) {
        setSelectedApp(remaining[remaining.length - 1]);
      } else if (remaining.length > 0) {
        setSelectedApp(remaining[currentIndex] || remaining[0]);
      } else {
        setSelectedApp(null);
      }
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectReason.trim()) return;
    setActionLoading(true);
    const success = await rejectKYC(selectedApp.id, rejectReason, user.id);
    if (success) {
      setShowRejectModal(false);
      setRejectReason('');
      const remaining = applications.filter(a => a.id !== selectedApp.id);
      setApplications(remaining);
      if (remaining.length > 0) {
        setSelectedApp(remaining[0]);
      } else {
        setSelectedApp(null);
      }
    }
    setActionLoading(false);
  };

  const navigateApp = (direction) => {
    if (!selectedApp || applications.length <= 1) return;
    const currentIndex = applications.findIndex(a => a.id === selectedApp.id);
    const newIndex = direction === 'next' 
      ? Math.min(currentIndex + 1, applications.length - 1)
      : Math.max(currentIndex - 1, 0);
    setSelectedApp(applications[newIndex]);
  };

  const openDocViewer = (url) => {
    setViewingDoc(url);
    setRotation(0);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-white tracking-tight mb-1">KYC Review</h1>
        <p className="text-[14px] text-charcoal-light font-medium">Verify runner identity documents side-by-side</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedApp(null); }}
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
      ) : applications.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-border-light p-12 text-center">
          <ShieldCheck size={48} className="text-charcoal-light mx-auto mb-4 opacity-50" />
          <p className="text-[16px] font-bold text-white mb-2">No applications</p>
          <p className="text-[14px] text-charcoal-light">
            {activeTab === 'pending' ? 'All KYC applications have been reviewed!' : 'No applications with this status.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Left Panel: Queue */}
          <div className="xl:col-span-3">
            <div className="glass-panel rounded-2xl border border-border-light overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-[14px] font-bold text-white">Queue ({applications.length})</h3>
              </div>
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {applications.map(app => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-4 border-b border-border cursor-pointer transition-all hover:bg-white/[0.02] ${
                      selectedApp?.id === app.id ? 'bg-accent/5 border-l-2 border-l-accent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dark border border-border flex items-center justify-center text-[12px] font-black text-accent shrink-0">
                        {app.initials || app.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white truncate">{app.name || 'Unknown'}</p>
                        <p className="text-[11px] text-charcoal-light truncate">{app.email || app.id.slice(0, 12)}</p>
                      </div>
                      <span className={`badge badge-${app.kyc_status}`}>{app.kyc_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel: Document Viewer */}
          <div className="xl:col-span-5">
            {selectedApp ? (
              <div className="glass-panel rounded-2xl border border-border-light overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark border border-border flex items-center justify-center text-[12px] font-black text-accent">
                      {selectedApp.initials || selectedApp.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-white">{selectedApp.name || 'Unknown'}</h3>
                      <p className="text-[11px] text-charcoal-light">{selectedApp.email || selectedApp.id.slice(0, 16)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigateApp('prev')}
                      disabled={applications.findIndex(a => a.id === selectedApp.id) === 0}
                      className="w-8 h-8 rounded-lg bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => navigateApp('next')}
                      disabled={applications.findIndex(a => a.id === selectedApp.id) === applications.length - 1}
                      className="w-8 h-8 rounded-lg bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div
                      onClick={() => selectedApp.kyc_id_url && openDocViewer(selectedApp.kyc_id_url)}
                      className={`aspect-[16/10] rounded-xl bg-dark border border-border overflow-hidden relative group/img cursor-pointer ${
                        !selectedApp.kyc_id_url ? 'opacity-50' : ''
                      }`}
                    >
                      {selectedApp.kyc_id_url ? (
                        <>
                          <img src={selectedApp.kyc_id_url} alt="ID Document" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn size={32} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-charcoal-light text-[14px] font-medium">No ID Document</div>
                      )}
                      <div className="absolute bottom-3 left-3 text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-lg backdrop-blur-sm">ID Card</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => selectedApp.kyc_selfie_url && openDocViewer(selectedApp.kyc_selfie_url)}
                        className={`aspect-[4/3] rounded-xl bg-dark border border-border overflow-hidden relative group/img cursor-pointer ${
                          !selectedApp.kyc_selfie_url ? 'opacity-50' : ''
                        }`}
                      >
                        {selectedApp.kyc_selfie_url ? (
                          <>
                            <img src={selectedApp.kyc_selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn size={24} className="text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-charcoal-light text-[12px] font-medium">No Selfie</div>
                        )}
                        <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">Selfie</div>
                      </div>
                      <div
                        onClick={() => selectedApp.kyc_vehicle_url && openDocViewer(selectedApp.kyc_vehicle_url)}
                        className={`aspect-[4/3] rounded-xl bg-dark border border-border overflow-hidden relative group/img cursor-pointer ${
                          !selectedApp.kyc_vehicle_url ? 'opacity-50' : ''
                        }`}
                      >
                        {selectedApp.kyc_vehicle_url ? (
                          <>
                            <img src={selectedApp.kyc_vehicle_url} alt="Vehicle Docs" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <ZoomIn size={24} className="text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-charcoal-light text-[12px] font-medium">No Vehicle</div>
                        )}
                        <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">Vehicle</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl border border-border-light p-12 text-center h-full flex items-center justify-center">
                <div>
                  <Eye size={48} className="text-charcoal-light mx-auto mb-4 opacity-50" />
                  <p className="text-[16px] font-bold text-white mb-2">Select an application</p>
                  <p className="text-[14px] text-charcoal-light">Choose from the queue to review documents</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Actions */}
          <div className="xl:col-span-4">
            {selectedApp ? (
              <div className="glass-panel rounded-2xl border border-border-light p-6">
                <h3 className="text-[16px] font-bold text-white mb-4">Applicant Details</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-[13px] text-charcoal-light">Name</span>
                    <span className="text-[13px] text-white font-medium">{selectedApp.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-[13px] text-charcoal-light">Email</span>
                    <span className="text-[13px] text-white font-medium">{selectedApp.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-[13px] text-charcoal-light">Phone</span>
                    <span className="text-[13px] text-white font-medium">{selectedApp.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-[13px] text-charcoal-light">Submitted</span>
                    <span className="text-[13px] text-white font-medium">
                      {selectedApp.kyc_submitted_at ? new Date(selectedApp.kyc_submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-[13px] text-charcoal-light">Status</span>
                    <span className={`badge badge-${selectedApp.kyc_status}`}>{selectedApp.kyc_status}</span>
                  </div>
                </div>

                {selectedApp.kyc_status === 'pending' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleApprove(selectedApp.id)}
                      disabled={actionLoading}
                      className="w-full py-3.5 rounded-xl bg-accent text-dark font-bold text-[14px] hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading ? (
                        <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check size={16} />
                          Approve & Verify
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { setSelectedApp(selectedApp); setShowRejectModal(true); }}
                      disabled={actionLoading}
                      className="w-full py-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger font-bold text-[14px] hover:bg-danger/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <X size={16} />
                      Reject Application
                    </button>
                  </div>
                )}

                {selectedApp.kyc_status === 'rejected' && selectedApp.kyc_rejection_reason && (
                  <div className="mt-4 p-4 rounded-xl bg-danger/5 border border-danger/20">
                    <p className="text-[11px] text-danger font-bold mb-1">Rejection Reason</p>
                    <p className="text-[13px] text-charcoal-light">{selectedApp.kyc_rejection_reason}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl border border-border-light p-12 text-center h-full flex items-center justify-center">
                <div>
                  <ShieldCheck size={48} className="text-charcoal-light mx-auto mb-4 opacity-50" />
                  <p className="text-[16px] font-bold text-white mb-2">No selection</p>
                  <p className="text-[14px] text-charcoal-light">Select an applicant to take action</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewingDoc && (
        <div className="document-viewer-overlay" onClick={() => setViewingDoc(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setViewingDoc(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-white hover:text-accent transition-colors z-10"
            >
              <X size={20} />
            </button>
            <button
              onClick={() => setRotation(r => r + 90)}
              className="absolute -top-12 right-14 w-10 h-10 rounded-full bg-dark-surface border border-border flex items-center justify-center text-white hover:text-accent transition-colors z-10"
            >
              <RotateCw size={18} />
            </button>
            <img
              src={viewingDoc}
              alt="KYC Document"
              className="document-viewer-img transition-transform duration-300"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          </div>
        </div>
      )}

      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowRejectModal(false)}>
          <div className="w-full max-w-md bg-dark-surface border border-border-light rounded-3xl p-6 animate-scale-in shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
                  <ShieldX size={20} />
                </div>
                <h3 className="text-[18px] font-extrabold text-white">Reject KYC</h3>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <p className="text-[14px] text-charcoal-light mb-4">
              Rejecting KYC for <strong className="text-white">{selectedApp.name}</strong>. Please provide a reason so they can resubmit with correct documents.
            </p>

            <div className="mb-6">
              <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="input-field w-full px-4 py-3.5 rounded-xl text-[14px] font-medium resize-none"
                rows={3}
                placeholder="e.g., ID photo is blurry, selfie doesn't match ID..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3.5 rounded-xl border border-border text-charcoal-light font-bold text-[14px] hover:text-white hover:border-border-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 py-3.5 rounded-xl bg-danger text-white font-bold text-[14px] hover:bg-danger/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldX size={16} />
                    Reject
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
