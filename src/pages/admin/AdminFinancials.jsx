import { useI18n } from '../../utils/i18n';
import { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, RefreshCw, BarChart2, ShieldAlert, Award, Building2, Check, X, AlertCircle, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchFinancialStats, updatePayoutStatus } from '../../data/adminApi';
import { fetchAllPayoutRequests, approvePayoutRequest, rejectPayoutRequest } from '../../data/walletApi';
import { exportToCSV } from '../../utils/exportCsv';

export default function AdminFinancials() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [payoutReqs, setPayoutReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    const data = await fetchFinancialStats();
    if (data) {
      setStats(data);
    }
    const reqs = await fetchAllPayoutRequests();
    setPayoutReqs(reqs);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveRibPayout = async (reqId) => {
    if (!window.confirm('Confirm you have transferred the funds to the runner RIB bank account?')) return;
    setActionLoading(true);
    const res = await approvePayoutRequest({ requestId: reqId, adminId: user.id });
    if (res) {
      alert('Payout approved and marked as completed!');
      await loadData();
    } else {
      alert('Failed to approve payout.');
    }
    setActionLoading(false);
  };

  const handleRejectRibPayout = async (reqId) => {
    const reason = window.prompt('Enter reason for rejecting this payout request:', 'RIB details mismatch');
    if (!reason) return;
    setActionLoading(true);
    const res = await rejectPayoutRequest({ requestId: reqId, adminId: user.id, reason });
    if (res) {
      alert('Payout request rejected.');
      await loadData();
    } else {
      alert('Failed to reject payout.');
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total GMV', value: `${stats.totalGMV.toLocaleString()} MAD`, icon: DollarSign, color: 'text-white', bg: 'bg-white/5 border-white/10' },
    { label: 'Commission Earnings', value: `${stats.totalCommissions.toLocaleString()} MAD`, icon: Award, color: 'text-accent', bg: 'bg-accent/5 border-accent/20' },
    { label: 'Escrow Holdings', value: `${stats.escrowHoldings.toLocaleString()} MAD`, icon: Clock, color: 'text-warning', bg: 'bg-warning/5 border-warning/20' },
    { label: 'Disputed / Held', value: `${stats.disputedFunds.toLocaleString()} MAD`, icon: ShieldAlert, color: 'text-danger', bg: 'bg-danger/5 border-danger/20' },
  ];

  // Draw basic responsive premium SVG bar chart
  const maxRevenue = stats.chartData.length > 0 ? Math.max(...stats.chartData.map(d => d.revenue), 10) : 10;

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-black text-white tracking-tight mb-1">{t('financial_overview')}</h1>
          <p className="text-[14px] text-charcoal-light font-medium">{t('monitor_earnings_escrow_holdings_an')}</p>
        </div>
        <button
          onClick={() => exportToCSV(payoutReqs, `chrad_payout_requests_${new Date().toISOString().split('T')[0]}.csv`)}
          className="p-3 bg-dark border border-border rounded-xl text-charcoal-light hover:text-white flex items-center gap-2 transition-all text-[13px] font-bold"
        >
          <Download size={14} />
          Export Payouts CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {statCards.map((card, i) => (
          <div key={i} className={`glass-panel p-6 border rounded-2xl flex flex-col justify-between ${card.bg}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[12px] font-bold text-charcoal-light uppercase tracking-wider">{card.label}</span>
              <card.icon size={18} className={card.color} />
            </div>
            <div className={`text-[26px] font-black tracking-tight ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Chart & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* SVG Revenue Chart */}
        <div className="lg:col-span-2 glass-panel p-6 border border-border-light rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-bold text-white flex items-center gap-2">
              <BarChart2 size={16} className="text-accent" />
              {t('daily_platform_commission_revenue')}
            </h2>
            <span className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider">{t('last_14_days')}</span>
          </div>

          {stats.chartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-charcoal-light text-[13px]">
              {t('no_transactions_recorded_in_this_pe')}
            </div>
          ) : (
            <div className="w-full">
              <svg viewBox="0 0 500 200" className="w-full h-[200px] overflow-visible">
                {/* Horizontal gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                  <line
                    key={i}
                    x1="40"
                    y1={20 + r * 140}
                    x2="480"
                    y2={20 + r * 140}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                  />
                ))}

                {/* Bars */}
                {stats.chartData.map((d, i) => {
                  const x = 50 + (i * (420 / stats.chartData.length));
                  const barHeight = (d.revenue / maxRevenue) * 140;
                  const y = 160 - barHeight;
                  const dayStr = new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

                  return (
                    <g key={i} className="group cursor-pointer">
                      {/* Bar fill */}
                      <rect
                        x={x}
                        y={y}
                        width={(300 / stats.chartData.length)}
                        height={barHeight}
                        fill="rgba(0, 255, 135, 0.65)"
                        rx="3"
                        className="transition-all hover:fill-accent"
                      />
                      {/* Interactive tooltip */}
                      <text
                        x={x + 5}
                        y={y - 8}
                        fill="#00ff87"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {d.revenue} MAD
                      </text>
                      {/* Axis Label */}
                      <text
                        x={x + 5}
                        y="180"
                        fill="rgba(255,255,255,0.4)"
                        fontSize="8"
                        textAnchor="middle"
                        transform={`rotate(-25, ${x + 5}, 180)`}
                      >
                        {dayStr}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Financial info notes */}
        <div className="glass-panel p-6 border border-border-light rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-white mb-4">{t('commission_model')}</h2>
            <p className="text-[13px] text-charcoal-light leading-relaxed mb-4">
              {t('chradma_runs_a_dynamic_commissionon')} <strong>{t('delivered')}</strong> {t('or')} <strong>{t('confirmed')}</strong>{t('_the_system_calculates_the_platform')}
            </p>
            <div className="bg-dark rounded-xl p-4 border border-border space-y-2 mb-4">
              <div className="flex justify-between text-[12px]">
                <span className="text-charcoal-light">{t('base_platform_fee')}</span>
                <span className="text-white font-bold">10%</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-charcoal-light">{t('runner_payout_share')}</span>
                <span className="text-accent font-bold">90%</span>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-charcoal-light font-medium flex items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <Award size={14} className="text-accent shrink-0" />
            {t('payout_releases_can_be_managed_manu')}
          </div>
        </div>
      </div>

      {/* Moroccan Bank RIB Payout Requests */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-black text-white flex items-center gap-2">
              <Building2 size={20} className="text-accent" />
              {t('runner_bank_rib_withdrawal_requests')}
            </h2>
            <p className="text-[12px] text-charcoal-light font-medium">
              Review and approve pending wire transfers to Moroccan runner bank accounts (RIB).
            </p>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-dark/60 border border-white/10 text-charcoal-light hover:text-white transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="glass-panel rounded-2xl border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('runner')}</th>
                  <th>{t('bank_name')}</th>
                  <th>{t('24digit_rib_number')}</th>
                  <th>{t('account_holder')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {payoutReqs.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <img
                          src={req.runner?.avatar_url || `https://i.pravatar.cc/150?u=${req.runner_id}`}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full border border-white/10"
                        />
                        <div>
                          <p className="text-[13px] font-bold text-white leading-tight">{req.runner?.name || 'Runner'}</p>
                          <p className="text-[10px] text-charcoal-light font-mono">{req.runner_id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-[12px] font-bold text-white">{req.bank_name}</span>
                    </td>
                    <td>
                      <span className="text-[12px] font-mono text-accent bg-accent/10 px-2 py-1 rounded-lg border border-accent/20">
                        {req.rib_number}
                      </span>
                    </td>
                    <td>
                      <span className="text-[12px] text-white font-medium">{req.account_holder}</span>
                    </td>
                    <td>
                      <span className="text-[14px] font-black text-warning">{req.amount} MAD</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        req.status === 'approved' ? 'badge-approved' :
                        req.status === 'rejected' ? 'badge-none' : 'badge-pending'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveRibPayout(req.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg bg-accent text-dark font-extrabold text-[11px] hover:scale-105 transition-all flex items-center gap-1"
                          >
                            <Check size={12} strokeWidth={3} />
                            {t('approve_payout')}
                          </button>
                          <button
                            onClick={() => handleRejectRibPayout(req.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-danger/15 border border-danger/30 text-danger font-bold text-[11px] hover:bg-danger/25 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted italic font-medium">{t('processed')}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {payoutReqs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-charcoal-light text-[13px]">
                      {t('no_bank_payout_requests_submitted_y')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payout Queue */}
      <div>
        <h2 className="text-[18px] font-black text-white mb-4">{t('standard_runner_payout_queue')}</h2>
        <div className="glass-panel rounded-2xl border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('task_id')}</th>
                  <th>{t('runner_id')}</th>
                  <th>{t('payout_amount')}</th>
                  <th>{t('task_finished')}</th>
                  <th>{t('status')}</th>
                  <th>{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {stats.payoutQueue.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-white truncate max-w-[200px]">{item.title}</p>
                        <p className="text-[10px] text-charcoal-light font-mono">{item.id.slice(0, 16)}</p>
                      </div>
                    </td>
                    <td>
                      <span className="text-[12px] font-mono text-charcoal-light">{item.runnerId.slice(0, 16)}…</span>
                    </td>
                    <td>
                      <span className="text-[14px] font-bold text-accent">{item.amount.toFixed(2)} MAD</span>
                    </td>
                    <td>
                      <span className="text-[12px] text-charcoal-light font-medium">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-approved">{item.status}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleReleasePayout(item.id)}
                        disabled={actionLoading}
                        className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle size={12} />
                        {t('release_payout')}
                      </button>
                    </td>
                  </tr>
                ))}
                {stats.payoutQueue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-charcoal-light text-[14px]">
                      {t('no_pending_runner_payouts')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
