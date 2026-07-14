import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldCheck, AlertTriangle, Package, TrendingUp, Ban, ArrowRight, Clock } from 'lucide-react';
import { fetchDashboardStats, fetchAuditLog } from '../../data/adminApi';

const ACTION_LABELS = {
  BAN_USER: { label: 'Banned user', color: 'text-danger' },
  UNBAN_USER: { label: 'Unbanned user', color: 'text-accent' },
  APPROVE_KYC: { label: 'Approved KYC', color: 'text-accent' },
  REJECT_KYC: { label: 'Rejected KYC', color: 'text-warning' },
  RESOLVE_DISPUTE: { label: 'Resolved dispute', color: 'text-accent' },
  DISMISS_DISPUTE: { label: 'Dismissed dispute', color: 'text-charcoal-light' },
  CHANGE_ROLE: { label: 'Changed role', color: 'text-info' },
  UPDATE_DISPUTE_STATUS: { label: 'Updated dispute', color: 'text-info' },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, activity] = await Promise.all([
        fetchDashboardStats(),
        fetchAuditLog(10),
      ]);
      setStats(s);
      setRecentActivity(activity);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, variant: 'accent', onClick: () => navigate('/admin/users') },
    { label: 'Active Runners', value: stats.activeRunners, icon: TrendingUp, variant: 'info' },
    { label: 'Pending KYC', value: stats.pendingKyc, icon: ShieldCheck, variant: 'warning', onClick: () => navigate('/admin/kyc') },
    { label: 'Open Disputes', value: stats.openDisputes, icon: AlertTriangle, variant: 'danger', onClick: () => navigate('/admin/disputes') },
    { label: 'Tasks Today', value: stats.todayTasks, icon: Package, variant: 'accent' },
    { label: 'Banned Users', value: stats.bannedUsers, icon: Ban, variant: 'danger' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Dashboard</h1>
        <p className="text-[14px] text-charcoal-light font-medium">Overview of your platform activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`admin-stat-card ${card.variant} cursor-pointer group`}
            onClick={card.onClick}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border
                ${card.variant === 'accent' ? 'bg-accent/10 border-accent/20 text-accent' : ''}
                ${card.variant === 'warning' ? 'bg-warning/10 border-warning/20 text-warning' : ''}
                ${card.variant === 'danger' ? 'bg-danger/10 border-danger/20 text-danger' : ''}
                ${card.variant === 'info' ? 'bg-info/10 border-info/20 text-info' : ''}
              `}>
                <card.icon size={20} />
              </div>
              {card.onClick && (
                <ArrowRight size={16} className="text-charcoal-light group-hover:text-accent group-hover:translate-x-1 transition-all" />
              )}
            </div>
            <div className="text-[32px] font-black text-white leading-none mb-1">{card.value}</div>
            <div className="text-[13px] text-charcoal-light font-medium">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <button
          onClick={() => navigate('/admin/kyc')}
          className="glass-panel rounded-2xl p-6 border border-warning/20 hover:border-warning/40 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
              <ShieldCheck size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-[16px] font-bold text-white mb-0.5">Review KYC Applications</h3>
              <p className="text-[13px] text-charcoal-light">{stats.pendingKyc} pending verification{stats.pendingKyc !== 1 ? 's' : ''}</p>
            </div>
            <ArrowRight size={20} className="text-charcoal-light group-hover:text-warning group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/disputes')}
          className="glass-panel rounded-2xl p-6 border border-danger/20 hover:border-danger/40 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-[16px] font-bold text-white mb-0.5">Open Disputes</h3>
              <p className="text-[13px] text-charcoal-light">{stats.openDisputes} dispute{stats.openDisputes !== 1 ? 's' : ''} need attention</p>
            </div>
            <ArrowRight size={20} className="text-charcoal-light group-hover:text-danger group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-[18px] font-bold text-white mb-4 flex items-center gap-2">
          <Clock size={18} className="text-charcoal-light" />
          Recent Activity
        </h2>
        <div className="glass-panel rounded-2xl border border-border-light overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-charcoal-light text-[14px] font-medium">No admin activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.map((entry, i) => {
                const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, color: 'text-charcoal-light' };
                return (
                  <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.01] transition-colors">
                    <div className="w-2 h-2 rounded-full bg-accent/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className={`text-[13px] font-bold ${actionInfo.color}`}>{actionInfo.label}</span>
                      <span className="text-[13px] text-charcoal-light ml-2">
                        on {entry.target_type} <span className="text-white font-mono text-[11px]">{entry.target_id.slice(0, 8)}…</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-charcoal-light font-medium shrink-0">
                      {new Date(entry.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
