import { useState, useEffect } from 'react';
import { Search, Filter, Ban, ShieldCheck, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllUsers, banUser, unbanUser } from '../../data/adminApi';

const ROLE_BADGES = {
  admin: 'badge badge-admin',
  runner: 'badge badge-approved',
  user: 'badge badge-none',
};

const KYC_BADGES = {
  none: 'badge badge-none',
  pending: 'badge badge-pending',
  approved: 'badge badge-approved',
  rejected: 'badge badge-rejected',
};

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const data = await fetchAllUsers(search, { role: roleFilter || undefined });
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) return;
    setActionLoading(true);
    const success = await banUser(selectedUser.id, banReason, user.id);
    if (success) {
      setShowBanModal(false);
      setBanReason('');
      setSelectedUser(null);
      await loadUsers();
    }
    setActionLoading(false);
  };

  const handleUnban = async (userId) => {
    setActionLoading(true);
    await unbanUser(userId, user.id);
    await loadUsers();
    setActionLoading(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-black text-white tracking-tight mb-1">User Management</h1>
          <p className="text-[14px] text-charcoal-light font-medium">{users.length} total users</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-light" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input-field w-full pl-11 pr-4 py-3 rounded-xl text-[14px] font-medium"
          />
        </div>
        <div className="flex gap-2">
          {['', 'user', 'runner', 'admin'].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-3 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all border
                ${roleFilter === role
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-dark-surface border-border text-charcoal-light hover:text-white hover:border-border-light'
                }`}
            >
              {role || 'All'}
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
                  <th>User</th>
                  <th>Role</th>
                  <th>KYC</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-[12px] font-black text-accent shrink-0">
                          {u.initials || u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-white truncate">{u.name || 'Unknown'}</p>
                          <p className="text-[11px] text-charcoal-light truncate">{u.email || u.id.slice(0, 12)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={ROLE_BADGES[u.role] || ROLE_BADGES.user}>{u.role || 'user'}</span>
                    </td>
                    <td>
                      <span className={KYC_BADGES[u.kyc_status] || KYC_BADGES.none}>{u.kyc_status || 'none'}</span>
                    </td>
                    <td>
                      {u.is_banned ? (
                        <span className="badge badge-banned">Banned</span>
                      ) : (
                        <span className="badge badge-approved">Active</span>
                      )}
                    </td>
                    <td>
                      <span className="text-[12px] text-charcoal-light font-medium">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {u.is_banned ? (
                          <button
                            onClick={() => handleUnban(u.id)}
                            disabled={actionLoading}
                            className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
                          >
                            Unban
                          </button>
                        ) : u.role !== 'admin' ? (
                          <button
                            onClick={() => { setSelectedUser(u); setShowBanModal(true); }}
                            className="text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 px-3 py-1.5 rounded-lg hover:bg-danger/20 transition-colors"
                          >
                            <Ban size={12} className="inline mr-1" />
                            Ban
                          </button>
                        ) : null}
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="text-[11px] font-bold text-charcoal-light hover:text-white px-2 py-1.5 rounded-lg transition-colors"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-charcoal-light text-[14px]">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowBanModal(false)}>
          <div className="w-full max-w-md bg-dark-surface border border-border-light rounded-3xl p-6 animate-scale-in shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-[18px] font-extrabold text-white">Ban User</h3>
              </div>
              <button onClick={() => setShowBanModal(false)} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <p className="text-[14px] text-charcoal-light mb-4">
              You are about to ban <strong className="text-white">{selectedUser.name}</strong>. This will prevent them from using the platform.
            </p>

            <div className="mb-6">
              <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-2 block">Reason for ban</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="input-field w-full px-4 py-3.5 rounded-xl text-[14px] font-medium resize-none"
                rows={3}
                placeholder="Describe the reason for banning this user..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 py-3.5 rounded-xl border border-border text-charcoal-light font-bold text-[14px] hover:text-white hover:border-border-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={!banReason.trim() || actionLoading}
                className="flex-1 py-3.5 rounded-xl bg-danger text-white font-bold text-[14px] hover:bg-danger/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Ban size={16} />
                    Confirm Ban
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
