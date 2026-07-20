import { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, RefreshCw, BarChart2, ShieldAlert, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchFinancialStats, updatePayoutStatus } from '../../data/adminApi';

export default function AdminFinancials() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    const data = await fetchFinancialStats();
    if (data) {
      setStats(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleReleasePayout = async (taskId) => {
    if (!window.confirm('Confirm you have paid this runner offline and want to mark this payout as completed?')) return;
    setActionLoading(true);
    const success = await updatePayoutStatus(taskId, true, user.id);
    if (success) {
      alert('Payout successfully marked as paid.');
      await loadData();
    } else {
      alert('Failed to update payout.');
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
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Financial Overview</h1>
        <p className="text-[14px] text-charcoal-light font-medium">Monitor earnings, escrow holdings, and release payouts</p>
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
              Daily Platform Commission Revenue
            </h2>
            <span className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider">Last 14 Days</span>
          </div>

          {stats.chartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-charcoal-light text-[13px]">
              No transactions recorded in this period.
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
            <h2 className="text-[16px] font-bold text-white mb-4">Commission Model</h2>
            <p className="text-[13px] text-charcoal-light leading-relaxed mb-4">
              Chrad.ma runs a dynamic commission-on-delivery system. When a task is marked as <strong>delivered</strong> or <strong>confirmed</strong>, the system calculates the platform commission from the offered run price.
            </p>
            <div className="bg-dark rounded-xl p-4 border border-border space-y-2 mb-4">
              <div className="flex justify-between text-[12px]">
                <span className="text-charcoal-light">Base Platform Fee:</span>
                <span className="text-white font-bold">10%</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-charcoal-light">Runner Payout Share:</span>
                <span className="text-accent font-bold">90%</span>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-charcoal-light font-medium flex items-center gap-1.5 bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <Award size={14} className="text-accent shrink-0" />
            Payout releases can be managed manually in the queue to the left.
          </div>
        </div>
      </div>

      {/* Payout Queue */}
      <div>
        <h2 className="text-[18px] font-black text-white mb-4">Runner Payout Queue</h2>
        <div className="glass-panel rounded-2xl border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Task / ID</th>
                  <th>Runner ID</th>
                  <th>Payout Amount</th>
                  <th>Task Finished</th>
                  <th>Status</th>
                  <th>Action</th>
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
                        Release Payout
                      </button>
                    </td>
                  </tr>
                ))}
                {stats.payoutQueue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-charcoal-light text-[14px]">
                      No pending runner payouts
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
