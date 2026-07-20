import { useState, useEffect } from 'react';
import { Search, Eye, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchTasks } from '@shared/data/tasksApi';
import { fetchAllUsers } from '@shared/data/adminApi';

const STATUS_BADGES = {
  open: 'badge badge-open',
  assigned: 'badge badge-pending',
  in_progress: 'badge badge-pending',
  completed: 'badge badge-approved',
  cancelled: 'badge badge-banned',
};

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  async function loadTasks() {
    setLoading(true);
    const data = await fetchTasks();
    setTasks(data);
    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
    fetchAllUsers().then(setUsers);
  }, []);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Task Management</h1>
          <p className="text-[14px] text-charcoal-light font-medium">{tasks.length} total tasks</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-light" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or ID..."
            className="input-field w-full pl-11 pr-4 py-3 rounded-xl text-[14px] font-medium"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'open', 'assigned', 'in_progress', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-3 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all border
                ${statusFilter === status
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-dark-surface border-border text-charcoal-light hover:text-white hover:border-border-light'
                }`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-border-light overflow-hidden">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Client</th>
                  <th>Runner</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => {
                  const client = users.find(u => u.id === task.clientId || u.id === task.client_id);
                  const runner = users.find(u => u.id === task.acceptedRunnerId || u.id === task.runner_id);
                  return (
                    <tr key={task.id}>
                      <td>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-white truncate max-w-[200px]">{task.title || 'Untitled'}</p>
                          <p className="text-[11px] text-charcoal-light font-mono">{task.id?.slice(0, 8)}…</p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-dark border border-border flex items-center justify-center text-[10px] font-black text-accent shrink-0">
                            {client?.initials || '?'}
                          </div>
                          <span className="text-[13px] text-charcoal truncate max-w-[120px]">{client?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-dark border border-border flex items-center justify-center text-[10px] font-black text-info shrink-0">
                            {runner?.initials || '—'}
                          </div>
                          <span className="text-[13px] text-charcoal truncate max-w-[120px]">{runner?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td><span className={STATUS_BADGES[task.status] || 'badge badge-none'}>{task.status || 'open'}</span></td>
                      <td className="text-[14px] font-bold text-white">{task.offeredPrice ? `${task.offeredPrice} MAD` : '—'}</td>
                      <td>
                        <span className="text-[12px] text-charcoal-light font-medium">
                          {task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => { setSelectedTask(task); setShowDetailModal(true); }}
                          className="text-[11px] font-bold text-charcoal-light hover:text-white px-2 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowDetailModal(false)}>
          <div className="w-full max-w-2xl bg-dark-surface border border-border-light rounded-3xl p-8 animate-scale-in shadow-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-extrabold text-white">Task Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Title</label>
                <p className="text-[14px] text-white font-medium">{selectedTask.title || 'Untitled'}</p>
              </div>
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Description</label>
                <p className="text-[14px] text-charcoal font-medium">{selectedTask.description || 'No description'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Price</label>
                  <p className="text-[14px] text-white font-bold">{selectedTask.offeredPrice ? `${selectedTask.offeredPrice} MAD` : '—'}</p>
                </div>
                <div>
                  <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Status</label>
                  <span className={STATUS_BADGES[selectedTask.status] || 'badge badge-none'}>{selectedTask.status || 'open'}</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-1 block">Location</label>
                <p className="text-[14px] text-charcoal font-medium">{selectedTask.pickup?.name || selectedTask.location || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
