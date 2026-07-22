import { useI18n } from '../../utils/i18n';
import { useState, useEffect } from 'react';
import { Search, Ban, ShieldCheck, ChevronRight, X, AlertTriangle, Download, Trash, UserCheck, ShieldAlert, Award, Calendar, DollarSign, ListTodo } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAllUsers, banUser, unbanUser, fetchUserFullProfile, resendKYCRequest, updateUserRole, bulkBanUsers, bulkUnbanUsers, bulkApproveKYC } from '../../data/adminApi';
import AdminUserInspectModal from '../../components/AdminUserInspectModal';

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
  const { t } = useI18n();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [inspectUserId, setInspectUserId] = useState(null);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileTab, setProfileTab] = useState('overview'); // 'overview' | 'tasks' | 'kyc' | 'logs'
  const [resendKycModal, setResendKycModal] = useState(false);
  const [resendReason, setResendReason] = useState('');

  // Ban Modal
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const data = await fetchAllUsers(search, { role: roleFilter || undefined });
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  // Load User Details
  const handleOpenUserDetail = async (u) => {
    setSelectedUser(u);
    setProfileLoading(true);
    setProfileTab('overview');
    const fullData = await fetchUserFullProfile(u.id);
    setUserProfileData(fullData);
    setProfileLoading(false);
  };

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) return;
    setActionLoading(true);
    const success = await banUser(selectedUser.id, banReason, user.id);
    if (success) {
      setShowBanModal(false);
      setBanReason('');
      setSelectedUser(null);
      setUserProfileData(null);
      await loadUsers();
    }
    setActionLoading(false);
  };

  const handleUnban = async (userId) => {
    if (!window.confirm('Unban this user?')) return;
    setActionLoading(true);
    await unbanUser(userId, user.id);
    setSelectedUser(null);
    setUserProfileData(null);
    await loadUsers();
    setActionLoading(false);
  };

  const handleUpdateRole = async (newRole) => {
    if (!selectedUser) return;
    setActionLoading(true);
    const success = await updateUserRole(selectedUser.id, newRole, user.id);
    if (success) {
      alert(`User role updated to ${newRole}`);
      await handleOpenUserDetail(selectedUser);
      await loadUsers();
    }
    setActionLoading(false);
  };

  const handleResendKYC = async () => {
    if (!selectedUser || !resendReason.trim()) return;
    setActionLoading(true);
    const success = await resendKYCRequest(selectedUser.id, resendReason, user.id);
    if (success) {
      alert('KYC Request reset. User has been notified and can submit documents again.');
      setResendKycModal(false);
      setResendReason('');
      setSelectedUser(null);
      setUserProfileData(null);
      await loadUsers();
    }
    setActionLoading(false);
  };

  // Bulk executions
  const handleCheckboxToggle = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.id));
    }
  };

  const executeBulkAction = async () => {
    if (selectedUserIds.length === 0) return;
    setActionLoading(true);

    let success = false;
    if (bulkAction === 'ban') {
      success = await bulkBanUsers(selectedUserIds, bulkReason, user.id);
    } else if (bulkAction === 'unban') {
      success = await bulkUnbanUsers(selectedUserIds, user.id);
    } else if (bulkAction === 'kyc') {
      success = await bulkApproveKYC(selectedUserIds, user.id);
    }

    if (success) {
      alert(`Bulk action successfully executed on ${selectedUserIds.length} users.`);
      setSelectedUserIds([]);
      setBulkAction('');
      setBulkReason('');
      setShowBulkModal(false);
      await loadUsers();
    } else {
      alert('Failed to complete bulk action.');
    }
    setActionLoading(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Role', 'KYC Status', 'Is Banned', 'Joined Date'];
    const rows = users.map(u => [
      u.id,
      u.name || 'Unknown',
      u.email || '',
      u.role || 'user',
      u.kyc_status || 'none',
      u.is_banned ? 'Yes' : 'No',
      u.joined_date || u.created_at ? new Date(u.joined_date || u.created_at).toLocaleDateString() : ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `chrad_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-black text-white tracking-tight mb-1">{t('user_management')}</h1>
          <p className="text-[14px] text-charcoal-light font-medium">{users.length} total users matching filters</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="p-3 bg-dark border border-border rounded-xl text-charcoal-light hover:text-white flex items-center gap-2 transition-all text-[13px] font-bold"
        >
          <Download size={14} />
          {t('export_to_csv')}
        </button>
      </div>

      {/* Bulk Action Panel */}
      {selectedUserIds.length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 animate-scale-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
            <span className="text-[13px] text-white font-bold">{selectedUserIds.length} users selected for bulk action</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setBulkAction('kyc'); setShowBulkModal(true); }}
              className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 px-3.5 py-2 rounded-lg hover:bg-accent/20"
            >
              {t('approve_kyc')}
            </button>
            <button
              onClick={() => { setBulkAction('ban'); setShowBulkModal(true); }}
              className="text-[11px] font-bold text-danger bg-danger/10 border border-danger/20 px-3.5 py-2 rounded-lg hover:bg-danger/20"
            >
              {t('ban_selected')}
            </button>
            <button
              onClick={() => { setBulkAction('unban'); executeBulkAction(); }}
              className="text-[11px] font-bold text-white bg-dark border border-border px-3.5 py-2 rounded-lg hover:border-charcoal-light"
            >
              {t('unban_selected')}
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
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
            placeholder={t('search_by_name_or_email')}
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
                  <th width="40">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded bg-dark border-border"
                    />
                  </th>
                  <th>{t('user')}</th>
                  <th>{t('role')}</th>
                  <th>{t('kyc_status')}</th>
                  <th>Account Status</th>
                  <th>{t('joined_date')}</th>
                  <th>{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.01]">
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => handleCheckboxToggle(u.id)}
                        className="rounded bg-dark border-border"
                      />
                    </td>
                    <td>
                      <div 
                        onClick={() => { setInspectUserId(u.id); setShowInspectModal(true); }}
                        className="flex items-center gap-3 cursor-pointer group/u"
                      >
                        <div className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-[12px] font-black text-accent shrink-0 group-hover/u:scale-105 transition-transform">
                          {u.initials || u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-white truncate group-hover/u:text-accent transition-colors">{u.name || 'Unknown'}</p>
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
                        <span className="badge badge-banned">{t('banned')}</span>
                      ) : (
                        <span className="badge badge-approved">{t('active')}</span>
                      )}
                    </td>
                    <td>
                      <span className="text-[12px] text-charcoal-light font-medium">
                        {u.joined_date || u.created_at ? new Date(u.joined_date || u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenUserDetail(u)}
                          className="text-[11px] font-bold text-charcoal-light hover:text-accent bg-dark border border-border px-3 py-1.5 rounded-lg hover:border-accent/30 transition-colors flex items-center gap-1"
                        >
                          {t('details')} <ChevronRight size={14} />
                        </button>
                        {!u.is_banned && u.role !== 'admin' && (
                          <button
                            onClick={() => { setSelectedUser(u); setShowBanModal(true); }}
                            className="text-[11px] font-bold text-danger hover:text-white bg-dark border border-border hover:bg-danger hover:border-danger px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            {t('ban')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-charcoal-light text-[14px]">
                      {t('no_users_found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal (Drawer) */}
      {selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => { setSelectedUser(null); setUserProfileData(null); }}>
          <div className="w-full max-w-2xl bg-dark-surface border border-border-light rounded-3xl p-6 animate-scale-in shadow-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6 border-b border-border pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-dark border border-border flex items-center justify-center text-[18px] font-black text-accent shrink-0">
                  {selectedUser.initials || selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[18px] font-extrabold text-white leading-none">{selectedUser.name}</h3>
                    <span className={ROLE_BADGES[selectedUser.role] || ROLE_BADGES.user}>{selectedUser.role}</span>
                  </div>
                  <p className="text-[12px] text-charcoal-light mt-1.5">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedUser(null); setUserProfileData(null); }} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {profileLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : userProfileData ? (
              <div>
                {/* Tabs */}
                <div className="flex gap-2 border-b border-border mb-6">
                  {[
                    { key: 'overview', label: 'Overview', icon: Award },
                    { key: 'tasks', label: 'Task History', icon: ListTodo },
                    { key: 'kyc', label: 'KYC & Verification', icon: ShieldCheck },
                    { key: 'logs', label: 'Admin Actions', icon: Calendar },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setProfileTab(tab.key)}
                      className={`px-4 py-3 text-[13px] font-bold flex items-center gap-1.5 border-b-2 transition-all
                        ${profileTab === tab.key
                          ? 'border-accent text-accent'
                          : 'border-transparent text-charcoal-light hover:text-white'}`}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {profileTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Financial Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-dark rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-2 mb-1.5">
                          <DollarSign size={14} className="text-accent" />
                          <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest">{t('spent')}</p>
                        </div>
                        <p className="text-[20px] font-black text-white">{(Number(userProfileData.profile.spent || 0)).toFixed(2)} MAD</p>
                      </div>
                      <div className="bg-dark rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-2 mb-1.5">
                          <DollarSign size={14} className="text-accent" />
                          <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest">{t('earnings')}</p>
                        </div>
                        <p className="text-[20px] font-black text-accent">{(Number(userProfileData.profile.earnings || 0)).toFixed(2)} MAD</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[13px] border-b border-border/50 pb-2">
                        <span className="text-charcoal-light">KYC Status:</span>
                        <span className={`font-bold uppercase ${selectedUser.kyc_status === 'approved' ? 'text-accent' : 'text-warning'}`}>
                          {userProfileData.profile.kyc_status || 'none'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px] border-b border-border/50 pb-2">
                        <span className="text-charcoal-light">{t('account_status')}</span>
                        <span className={`font-bold ${userProfileData.profile.is_banned ? 'text-danger' : 'text-accent'}`}>
                          {userProfileData.profile.is_banned ? 'Banned' : 'Active'}
                        </span>
                      </div>
                      {userProfileData.profile.is_banned && (
                        <div className="bg-danger/5 border border-danger/20 rounded-xl p-3 text-[12px] text-charcoal-light">
                          <strong className="text-white block mb-1">{t('reason_for_ban')}</strong>
                          {userProfileData.profile.ban_reason || 'No reason provided'}
                        </div>
                      )}
                      <div className="flex justify-between text-[13px] border-b border-border/50 pb-2">
                        <span className="text-charcoal-light">{t('user_id')}</span>
                        <span className="font-mono text-white text-[12px]">{userProfileData.profile.id}</span>
                      </div>
                    </div>

                    {/* Quick Actions Panel */}
                    <div className="border-t border-border pt-6">
                      <h4 className="text-[11px] text-charcoal-light font-bold uppercase tracking-widest mb-4">{t('quick_admin_actions')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {/* Ban / Unban */}
                        {userProfileData.profile.is_banned ? (
                          <button
                            onClick={() => handleUnban(userProfileData.profile.id)}
                            className="px-4 py-2.5 rounded-xl border border-accent/20 bg-accent/5 text-accent font-bold text-[12px] hover:bg-accent/15 transition-all"
                          >
                            Unban Account
                          </button>
                        ) : selectedUser.role !== 'admin' ? (
                          <button
                            onClick={() => setShowBanModal(true)}
                            className="px-4 py-2.5 rounded-xl border border-danger/20 bg-danger/5 text-danger font-bold text-[12px] hover:bg-danger/15 transition-all"
                          >
                            Ban Account
                          </button>
                        ) : null}

                        {/* KYC Reset */}
                        {selectedUser.role === 'runner' && (
                          <button
                            onClick={() => setResendKycModal(true)}
                            className="px-4 py-2.5 rounded-xl border border-border text-charcoal-light font-bold text-[12px] hover:text-white transition-all"
                          >
                            Resend KYC Request
                          </button>
                        )}

                        {/* Role Assignment */}
                        <div className="flex items-center gap-1 border border-border rounded-xl p-1 bg-dark">
                          {['user', 'runner', 'admin'].map(r => (
                            <button
                              key={r}
                              onClick={() => handleUpdateRole(r)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase
                                ${userProfileData.profile.role === r
                                  ? 'bg-accent text-dark'
                                  : 'text-charcoal-light hover:text-white'}`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {profileTab === 'tasks' && (
                  <div className="space-y-4">
                    <h4 className="text-[14px] font-bold text-white mb-2">Tasks Created ({userProfileData.tasksCreated.length})</h4>
                    <div className="max-h-[200px] overflow-y-auto space-y-2 border border-border rounded-xl p-3 bg-dark">
                      {userProfileData.tasksCreated.map(t => (
                        <div key={t.id} className="flex justify-between items-center text-[12px] border-b border-border/50 pb-2 last:border-0 last:pb-0">
                          <span className="text-white font-bold truncate max-w-[200px]">{t.title}</span>
                          <span className="text-accent font-bold">{t.offered_price} MAD</span>
                        </div>
                      ))}
                      {userProfileData.tasksCreated.length === 0 && (
                        <p className="text-charcoal-light text-center py-4">{t('no_tasks_created')}</p>
                      )}
                    </div>

                    <h4 className="text-[14px] font-bold text-white mb-2">Tasks Run ({userProfileData.tasksRun.length})</h4>
                    <div className="max-h-[200px] overflow-y-auto space-y-2 border border-border rounded-xl p-3 bg-dark">
                      {userProfileData.tasksRun.map(t => (
                        <div key={t.id} className="flex justify-between items-center text-[12px] border-b border-border/50 pb-2 last:border-0 last:pb-0">
                          <span className="text-white font-bold truncate max-w-[200px]">{t.title}</span>
                          <span className="text-accent font-bold">{t.offered_price} MAD</span>
                        </div>
                      ))}
                      {userProfileData.tasksRun.length === 0 && (
                        <p className="text-charcoal-light text-center py-4">{t('no_runner_jobs_completed')}</p>
                      )}
                    </div>
                  </div>
                )}

                {profileTab === 'kyc' && (
                  <div className="space-y-4">
                    <div className="bg-dark rounded-xl p-4 border border-border">
                      <p className="text-[12px] text-charcoal-light mb-2">{t('current_tier')} <strong className="text-white font-bold uppercase">{userProfileData.profile.runner_tier || 'standard'}</strong></p>
                      {userProfileData.profile.runner_notes && (
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg text-[12px] text-charcoal-light">
                          <strong className="text-white block mb-0.5">{t('verification_notes')}</strong>
                          {userProfileData.profile.runner_notes}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {userProfileData.profile.kyc_id_url && (
                        <div>
                          <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider mb-2">{t('id_card_passport')}</p>
                          <a href={userProfileData.profile.kyc_id_url} target="_blank" rel="noreferrer" className="aspect-[4/3] rounded-xl border border-border bg-dark block overflow-hidden">
                            <img src={userProfileData.profile.kyc_id_url} alt={t('id_document')} className="w-full h-full object-cover" />
                          </a>
                        </div>
                      )}
                      {userProfileData.profile.kyc_selfie_url && (
                        <div>
                          <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider mb-2">{t('selfie')}</p>
                          <a href={userProfileData.profile.kyc_selfie_url} target="_blank" rel="noreferrer" className="aspect-[4/3] rounded-xl border border-border bg-dark block overflow-hidden">
                            <img src={userProfileData.profile.kyc_selfie_url} alt={t('selfie')} className="w-full h-full object-cover" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {profileTab === 'logs' && (
                  <div className="space-y-3">
                    <h4 className="text-[14px] font-bold text-white">{t('action_logs')}</h4>
                    <div className="max-h-[300px] overflow-y-auto space-y-2.5 border border-border rounded-xl p-4 bg-dark">
                      {userProfileData.auditLogs.map((log) => (
                        <div key={log.id} className="flex flex-col border-b border-border/40 pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-accent font-bold uppercase">{log.action}</span>
                            <span className="text-charcoal-light">{new Date(log.created_at).toLocaleDateString()}</span>
                          </div>
                          {log.details && (
                            <p className="text-[12px] text-charcoal-light mt-1 font-medium">{JSON.stringify(log.details)}</p>
                          )}
                        </div>
                      ))}
                      {userProfileData.auditLogs.length === 0 && (
                        <p className="text-charcoal-light text-center py-6 text-[13px]">{t('no_logs_recorded_for_this_user')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Ban Reason Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in" onClick={() => setShowBanModal(false)}>
          <div className="w-full max-w-md bg-dark-surface border border-border-light rounded-3xl p-6 animate-scale-in shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-extrabold text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-danger" />
                {t('ban_user_account')}
              </h3>
              <button onClick={() => setShowBanModal(false)} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <p className="text-[13px] text-charcoal-light mb-4">
              {t('enter_reason_for_banning')} <strong className="text-white">{selectedUser.name}</strong>.
            </p>

            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={t('describe_why_this_account_is_banned')}
              rows={3}
              className="input-field w-full px-4 py-3.5 rounded-xl text-[13px] font-medium resize-none mb-6"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 py-3 rounded-xl border border-border text-charcoal font-bold text-[13px]"
              >
                Back
              </button>
              <button
                onClick={handleBan}
                disabled={actionLoading || !banReason.trim()}
                className="flex-1 py-3 rounded-xl bg-danger text-white font-bold text-[13px] hover:bg-danger/90 transition-colors disabled:opacity-50"
              >
                {t('confirm_ban')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resend KYC Request Reason Modal */}
      {resendKycModal && selectedUser && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in" onClick={() => setResendKycModal(false)}>
          <div className="w-full max-w-md bg-dark-surface border border-border-light rounded-3xl p-6 animate-scale-in shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-extrabold text-white">{t('reset_request_kyc')}</h3>
              <button onClick={() => setResendKycModal(false)} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <p className="text-[13px] text-charcoal-light mb-4">
              {t('state_the_reason_for_requesting_res')}
            </p>

            <textarea
              value={resendReason}
              onChange={(e) => setResendReason(e.target.value)}
              placeholder="Explain what was wrong with the previous documents (e.g. ID card picture was blurry)..."
              rows={3}
              className="input-field w-full px-4 py-3.5 rounded-xl text-[13px] font-medium resize-none mb-6"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setResendKycModal(false)}
                className="flex-1 py-3 rounded-xl border border-border text-charcoal font-bold text-[13px]"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleResendKYC}
                disabled={actionLoading || !resendReason.trim()}
                className="flex-1 btn-accent py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider"
              >
                {t('submit_request')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Reason Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in" onClick={() => setShowBulkModal(false)}>
          <div className="w-full max-w-md bg-dark-surface border border-border-light rounded-3xl p-6 animate-scale-in shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[18px] font-extrabold text-white uppercase tracking-wider">{t('execute_bulk_action')}</h3>
              <button onClick={() => setShowBulkModal(false)} className="w-9 h-9 rounded-full bg-dark border border-border flex items-center justify-center text-charcoal-light hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <p className="text-[13px] text-charcoal-light mb-4">
              {t('you_are_applying_bulk')} <strong>{bulkAction}</strong> to {selectedUserIds.length} accounts.
            </p>

            {bulkAction === 'ban' && (
              <textarea
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder={t('reason_for_bulk_ban')}
                rows={3}
                className="input-field w-full px-4 py-3.5 rounded-xl text-[13px] font-medium resize-none mb-6"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="flex-1 py-3 rounded-xl border border-border text-charcoal font-bold text-[13px]"
              >
                {t('cancel')}
              </button>
              <button
                onClick={executeBulkAction}
                disabled={actionLoading || (bulkAction === 'ban' && !bulkReason.trim())}
                className="flex-1 py-3 rounded-xl btn-accent font-bold text-[13px] uppercase tracking-wider"
              >
                {t('confirm_bulk_run')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin User Inspector & Wallet Modal */}
      <AdminUserInspectModal
        isOpen={showInspectModal}
        onClose={() => setShowInspectModal(false)}
        userId={inspectUserId}
        onRefresh={loadData}
      />
    </div>
  );
}
