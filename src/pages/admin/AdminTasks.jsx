import { useState, useEffect } from 'react';
import { Package, Search, Eye, ChevronDown, MapPin, Clock, User, DollarSign, Filter } from 'lucide-react';
import { fetchTasks } from '../../data/mockTasks';
import { fetchProfileById } from '../../data/mockUsers';

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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [runnerProfile, setRunnerProfile] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchTasks();
      setTasks(data);
      setLoading(false);
    }
    load();
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
    if (task.clientId) {
      const cp = await fetchProfileById(task.clientId);
      setClientProfile(cp);
    }
    if (task.acceptedRunnerId) {
      const rp = await fetchProfileById(task.acceptedRunnerId);
      setRunnerProfile(rp);
    }
  };

  // Stats
  const openCount = tasks.filter(t => t.status === 'open' || t.status === 'bidding').length;
  const activeCount = tasks.filter(t => ['accepted', 'picked_up', 'en_route'].includes(t.status)).length;
  const completedCount = tasks.filter(t => t.status === 'delivered' || t.status === 'confirmed').length;
  const totalRevenue = tasks.filter(t => t.status === 'delivered' || t.status === 'confirmed').reduce((sum, t) => sum + (t.offeredPrice || 0), 0);

  return (
    <div className="animate-fade-in">
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
                  <th>Task</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-white truncate max-w-[220px]">{task.title || 'Untitled'}</p>
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
                        {task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
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
                    <td colSpan={6} className="text-center py-12 text-charcoal-light text-[14px]">
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
          <div className="w-full max-w-lg bg-dark-surface border border-border-light rounded-3xl p-6 animate-scale-in shadow-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CATEGORY_EMOJI[selectedTask.category] || '📦'}</span>
                <div>
                  <h3 className="text-[18px] font-extrabold text-white">{selectedTask.title || 'Untitled'}</h3>
                  <span className={`badge ${STATUS_COLORS[selectedTask.status] || 'badge-none'}`}>{selectedTask.status}</span>
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <span className="text-lg">×</span>
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-dark rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={14} className="text-accent" />
                  <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest">Price</p>
                </div>
                <p className="text-[20px] font-black text-accent">{selectedTask.offeredPrice} <span className="text-[11px] text-accent/70">MAD</span></p>
              </div>
              <div className="bg-dark rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-charcoal-light" />
                  <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest">Created</p>
                </div>
                <p className="text-[14px] font-bold text-white">
                  {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </div>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div className="mb-5">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2">Description</p>
                <p className="text-[13px] text-charcoal-light leading-relaxed bg-dark rounded-xl p-4 border border-border">{selectedTask.description}</p>
              </div>
            )}

            {/* Pickup & Destination */}
            <div className="grid grid-cols-1 gap-3 mb-5">
              {selectedTask.pickup?.name && (
                <div className="bg-dark rounded-xl p-4 border border-border flex items-start gap-3">
                  <MapPin size={16} className="text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-1">Pickup</p>
                    <p className="text-[13px] font-bold text-white">{selectedTask.pickup.name}</p>
                    {selectedTask.pickup.address && <p className="text-[11px] text-charcoal-light">{selectedTask.pickup.address}</p>}
                  </div>
                </div>
              )}
              {selectedTask.destination?.name && (
                <div className="bg-dark rounded-xl p-4 border border-border flex items-start gap-3">
                  <MapPin size={16} className="text-danger shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-1">Destination</p>
                    <p className="text-[13px] font-bold text-white">{selectedTask.destination.name}</p>
                    {selectedTask.destination.address && <p className="text-[11px] text-charcoal-light">{selectedTask.destination.address}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-dark rounded-xl p-4 border border-border">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2">Client</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px] font-black">
                    {clientProfile?.initials || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-white truncate">{clientProfile?.name || 'Loading...'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-dark rounded-xl p-4 border border-border">
                <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2">Runner</p>
                {selectedTask.acceptedRunnerId ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-info/10 border border-info/20 flex items-center justify-center text-info text-[10px] font-black">
                      {runnerProfile?.initials || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">{runnerProfile?.name || 'Loading...'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-charcoal-light italic">Not assigned</p>
                )}
              </div>
            </div>

            {/* Task ID */}
            <div className="bg-dark rounded-xl p-3 border border-border">
              <p className="text-[10px] text-charcoal-light font-mono">Task ID: {selectedTask.id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
