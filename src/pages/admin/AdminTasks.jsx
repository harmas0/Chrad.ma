import { useState, useEffect } from 'react';
import { Package, Search, Eye, ChevronDown, MapPin, Clock, User, DollarSign, X, CheckCircle, RefreshCw, MessageSquare, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchTasks, updateTaskStatus } from '../../data/tasksApi';
import { fetchProfileById } from '../../data/usersApi';
import { fetchTaskChatTranscript, bulkUpdateTaskStatus, updatePayoutStatus } from '../../data/adminApi';
import MapView from '../../components/MapView';
import AdminTaskInspectModal from '../../components/AdminTaskInspectModal';

const STATUS_OPTIONS = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'bidding', label: 'Bidding' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'en_route', label: 'En Route' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS = {
  open: 'badge-open',
  bidding: 'badge-pending',
  accepted: 'badge-approved',
  picked_up: 'badge-approved',
  en_route: 'badge-approved',
  delivered: 'badge-approved',
  confirmed: 'badge-approved',
  cancelled: 'badge-rejected',
};

const CATEGORY_EMOJI = {
  delivery: '📦',
  documents: '📄',
  shopping: '🛒',
  custom: '🔧',
};

export default function AdminTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [inspectTaskId, setInspectTaskId] = useState(null);
  const [showInspectModal, setShowInspectModal] = useState(false);
  
  // Selected task detail state
  const [selectedTask, setSelectedTask] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [runnerProfile, setRunnerProfile] = useState(null);
  const [chatTranscript, setChatTranscript] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Bulk Actions
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');

  async function loadTasks() {
    setLoading(true);
    const data = await fetchTasks();
    setTasks(data);
    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openTaskDetail = async (task) => {
    setSelectedTask(task);
    setClientProfile(null);
    setRunnerProfile(null);
    setChatTranscript([]);
    setChatLoading(true);

    const promises = [
      fetchTaskChatTranscript(task.id)
    ];

    if (task.clientId) {
      promises.push(fetchProfileById(task.clientId));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (task.acceptedRunnerId) {
      promises.push(fetchProfileById(task.acceptedRunnerId));
    } else {
      promises.push(Promise.resolve(null));
    }

    const [chat, client, runner] = await Promise.all(promises);
    setChatTranscript(chat);
    setClientProfile(client);
    setRunnerProfile(runner);
    setChatLoading(false);
  };

  const handleEscrowRelease = async () => {
    if (!selectedTask) return;
    if (!window.confirm('Force release escrow? This will mark the task as CONFIRMED and prepare the payout for the runner.')) return;
    setActionLoading(true);

    const success = await updateTaskStatus(selectedTask.id, 'confirmed');
    if (success) {
      alert('Escrow successfully released. Task set to CONFIRMED.');
      setSelectedTask(null);
      await loadTasks();
    } else {
      alert('Failed to release escrow.');
    }
    setActionLoading(false);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTask) return;
    setActionLoading(true);
    const success = await updateTaskStatus(selectedTask.id, newStatus);
    if (success) {
      alert(`Task status updated to ${newStatus}`);
      setSelectedTask(null);
      await loadTasks();
    } else {
      alert('Failed to update task status.');
    }
    setActionLoading(false);
  };

  // Bulk selections
  const handleCheckboxToggle = (taskId) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
  };

  const executeBulkStatus = async () => {
    if (selectedTaskIds.length === 0 || !bulkStatus) return;
    setActionLoading(true);
    const success = await bulkUpdateTaskStatus(selectedTaskIds, bulkStatus, user.id);
    if (success) {
      alert(`Bulk updated ${selectedTaskIds.length} tasks to ${bulkStatus}.`);
      setSelectedTaskIds([]);
      setBulkStatus('');
      await loadTasks();
    } else {
      alert('Failed to execute bulk update.');
    }
    setActionLoading(false);
  };

  // Stats
  const openCount = tasks.filter(t => t.status === 'open' || t.status === 'bidding').length;
  const activeCount = tasks.filter(t => ['accepted', 'picked_up', 'en_route'].includes(t.status)).length;
  const completedCount = tasks.filter(t => t.status === 'delivered' || t.status === 'confirmed').length;
  const totalRevenue = tasks.filter(t => t.status === 'delivered' || t.status === 'confirmed').reduce((sum, t) => sum + (t.offeredPrice || 0), 0);

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Task Management</h1>
        <p className="text-[14px] text-charcoal-light font-medium">Monitor and manage all platform tasks</p>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open', value: openCount, color: 'text-info' },
          { label: 'Active', value: activeCount, color: 'text-warning' },
          { label: 'Completed', value: completedCount, color: 'text-accent' },
          { label: 'Revenue', value: `${totalRevenue} MAD`, color: 'text-accent' },
        ].map((s, i) => (
          <div key={i} className="bg-dark-surface rounded-xl p-4 border border-border">
            <p className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-[22px] font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bulk Action Panel */}
      {selectedTaskIds.length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 animate-scale-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
            <span className="text-[13px] text-white font-bold">{selectedTaskIds.length} tasks selected for bulk update</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="input-field px-3 py-1.5 rounded-lg text-[12px] font-bold bg-dark border-border"
            >
              <option value="">Select Status...</option>
              <option value="open">Open</option>
              <option value="cancelled">Cancelled</option>
              <option value="confirmed">Confirmed (Release)</option>
            </select>
            <button
              onClick={executeBulkStatus}
              disabled={!bulkStatus || actionLoading}
              className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 px-3.5 py-2 rounded-lg hover:bg-accent/20"
            >
              Apply Status
            </button>
            <button
              onClick={() => setSelectedTaskIds([])}
              className="text-[11px] font-bold text-charcoal-light hover:text-white px-2 py-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-light" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or ID..."
            className="input-field w-full pl-11 pr-4 py-3 rounded-xl text-[14px] font-medium"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`px-3 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap
                ${statusFilter === opt.key
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-dark-surface border-border text-charcoal-light hover:text-white'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th width="40">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                      onChange={handleSelectAll}
                      className="rounded bg-dark border-border"
                    />
                  </th>
                  <th>Task</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-white/[0.01]">
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => handleCheckboxToggle(task.id)}
                        className="rounded bg-dark border-border"
                      />
                    </td>
                    <td>
                      <div 
                        onClick={() => { setInspectTaskId(task.id); setShowInspectModal(true); }}
                        className="min-w-0 cursor-pointer group/t"
                      >
                        <p className="text-[14px] font-bold text-white truncate max-w-[220px] group-hover/t:text-accent transition-colors">{task.title || 'Untitled'}</p>
                        <p className="text-[11px] text-charcoal-light font-mono">{task.id?.slice(0, 16)}</p>
                      </div>
                    </td>
                    <td>
                      <span className="flex items-center gap-2 text-[13px] font-medium text-charcoal">
                        <span className="text-lg">{CATEGORY_EMOJI[task.category] || '📦'}</span>
                        {task.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[task.status] || 'badge-none'}`}>
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-[14px] font-bold text-accent">{task.offeredPrice} <span className="text-[10px] text-accent/70">MAD</span></span>
                    </td>
                    <td>
                      <span className="text-[12px] text-charcoal-light font-medium">
                        {task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openTaskDetail(task)}
                        className="text-[11px] font-bold text-charcoal-light hover:text-accent bg-dark border border-border px-3 py-1.5 rounded-lg hover:border-accent/30 transition-colors flex items-center gap-1"
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-charcoal-light text-[14px]">
                      No tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedTask(null)}>
          <div className="w-full max-w-2xl bg-dark-surface border border-border-light rounded-3xl p-6 animate-scale-in shadow-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CATEGORY_EMOJI[selectedTask.category] || '📦'}</span>
                <div>
                  <h3 className="text-[18px] font-extrabold text-white">{selectedTask.title || 'Untitled'}</h3>
                  <span className={`badge ${STATUS_COLORS[selectedTask.status] || 'badge-none'}`}>{selectedTask.status}</span>
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Map Header */}
            <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden border border-border shadow-lg mb-6 relative">
              <MapView
                pickupCoords={selectedTask.pickup}
                destCoords={selectedTask.category !== 'custom' ? selectedTask.destination : null}
                waypoints={selectedTask.waypoints || []}
                height="100%"
                darkMode
                showRouteInfo={true}
              />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <div className="bg-dark rounded-xl p-3 border border-border">
                <p className="text-[9px] text-charcoal-light font-bold uppercase tracking-wider mb-1">Price</p>
                <p className="text-[16px] font-black text-accent">{selectedTask.offeredPrice} MAD</p>
              </div>
              {selectedTask.itemBudget > 0 && (
                <div className="bg-dark rounded-xl p-3 border border-border">
                  <p className="text-[9px] text-charcoal-light font-bold uppercase tracking-wider mb-1">Budget</p>
                  <p className="text-[16px] font-bold text-warning">{selectedTask.itemBudget} MAD</p>
                </div>
              )}
              <div className="bg-dark rounded-xl p-3 border border-border">
                <p className="text-[9px] text-charcoal-light font-bold uppercase tracking-wider mb-1">Runner Paid</p>
                <p className={`text-[14px] font-bold ${selectedTask.runner_paid ? 'text-accent' : 'text-warning'}`}>
                  {selectedTask.runner_paid ? 'Yes' : 'Awaiting Release'}
                </p>
              </div>
              <div className="bg-dark rounded-xl p-3 border border-border">
                <p className="text-[9px] text-charcoal-light font-bold uppercase tracking-wider mb-1">Category</p>
                <p className="text-[14px] font-bold text-white capitalize">{selectedTask.category}</p>
              </div>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div className="mb-5">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-1.5">Description</p>
                <p className="text-[13px] text-charcoal-light leading-relaxed bg-dark rounded-xl p-3 border border-border">{selectedTask.description}</p>
              </div>
            )}

            {/* Completion Photo */}
            {selectedTask.delivery_photo_url && (
              <div className="mb-5">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-accent" />
                  Proof of Completion Photo
                </p>
                <div className="w-full aspect-[21/9] rounded-xl overflow-hidden border border-border bg-dark">
                  <img src={selectedTask.delivery_photo_url} alt="Delivery Completion Proof" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-dark rounded-xl p-3.5 border border-border">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2">Client</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[11px] font-black">
                    {clientProfile?.initials || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-white truncate">{clientProfile?.name || 'Loading...'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-dark rounded-xl p-3.5 border border-border">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2">Runner</p>
                {selectedTask.acceptedRunnerId ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-info/10 border border-info/20 flex items-center justify-center text-info text-[11px] font-black">
                      {runnerProfile?.initials || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">{runnerProfile?.name || 'Loading...'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-charcoal-light italic pt-1.5">Not assigned</p>
                )}
              </div>
            </div>

            {/* Chat Transcript Thread */}
            <div className="mb-6">
              <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-charcoal-light" />
                Negotiation Chat Transcript
              </p>
              {chatLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : chatTranscript.length === 0 ? (
                <div className="bg-dark rounded-xl p-6 text-center border border-border text-[12px] text-charcoal-light italic">
                  No conversation logs created for this task.
                </div>
              ) : (
                <div className="bg-dark rounded-xl p-4 border border-border max-h-[160px] overflow-y-auto space-y-3">
                  {chatTranscript.map((msg, i) => {
                    const isClient = msg.sender_id === selectedTask.clientId;
                    return (
                      <div key={i} className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}>
                        <div className="flex items-center gap-1.5 text-[9px] text-charcoal-light mb-0.5">
                          <span className="font-bold">{isClient ? 'Client' : 'Runner'}</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <span className={`px-3 py-1.5 rounded-xl text-[12px] inline-block font-medium max-w-[80%]
                          ${isClient ? 'bg-dark-surface text-white rounded-tl-none' : 'bg-accent text-dark rounded-tr-none'}`}>
                          {msg.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Admin Controls Panel */}
            <div className="border-t border-border pt-4">
              <h4 className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-3 flex items-center gap-1">
                <AlertTriangle size={12} className="text-warning" />
                Escrow & Moderation Controls
              </h4>
              <div className="flex flex-wrap gap-2">
                {['accepted', 'picked_up', 'en_route', 'delivered'].includes(selectedTask.status) && (
                  <button
                    onClick={handleEscrowRelease}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-accent text-dark font-bold text-[12px] hover:bg-accent-hover transition-all flex items-center gap-1"
                  >
                    <CheckCircle size={14} /> Force Release Escrow Payout
                  </button>
                )}

                {selectedTask.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateStatus('cancelled')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl border border-danger/30 bg-danger/5 text-danger font-bold text-[12px] hover:bg-danger/10 transition-all"
                  >
                    Force Cancel Task
                  </button>
                )}

                {selectedTask.status === 'cancelled' && (
                  <button
                    onClick={() => handleUpdateStatus('open')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl border border-border text-charcoal-light font-bold text-[12px] hover:text-white transition-all"
                  >
                    Reopen Task Listing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Task & Route Inspector Modal */}
      <AdminTaskInspectModal
        isOpen={showInspectModal}
        onClose={() => setShowInspectModal(false)}
        taskId={inspectTaskId}
        onRefresh={loadData}
      />
    </div>
  );
}
