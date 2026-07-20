import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { fetchAuditLog } from '@shared/data/adminApi';

const ACTION_LABELS = {
  BAN_USER: 'Banned user',
  UNBAN_USER: 'Unbanned user',
  APPROVE_KYC: 'Approved KYC',
  REJECT_KYC: 'Rejected KYC',
  RESOLVE_DISPUTE: 'Resolved dispute',
  DISMISS_DISPUTE: 'Dismissed dispute',
  CHANGE_ROLE: 'Changed role',
  UPDATE_DISPUTE_STATUS: 'Updated dispute',
};

const ACTION_COLORS = {
  BAN_USER: 'text-danger',
  UNBAN_USER: 'text-accent',
  APPROVE_KYC: 'text-accent',
  REJECT_KYC: 'text-warning',
  RESOLVE_DISPUTE: 'text-accent',
  DISMISS_DISPUTE: 'text-charcoal-light',
  CHANGE_ROLE: 'text-info',
  UPDATE_DISPUTE_STATUS: 'text-info',
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchAuditLog(limit);
      setLogs(data);
      setLoading(false);
    }
    load();
  }, [limit]);

  const toggleExpand = (index) => {
    setExpandedRows(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Audit Log</h1>
          <p className="text-[14px] text-charcoal-light font-medium">{logs.length} recent actions</p>
        </div>
        <div className="flex gap-2">
          {[25, 50, 100].map(l => (
            <button
              key={l}
              onClick={() => setLimit(l)}
              className={`px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all border
                ${limit === l
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-dark-surface border-border text-charcoal-light hover:text-white hover:border-border-light'
                }`}
            >
              {l}
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
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                  <th>Admin</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry, i) => {
                  const isExpanded = expandedRows[i];
                  const actionLabel = ACTION_LABELS[entry.action] || entry.action;
                  const actionColor = ACTION_COLORS[entry.action] || 'text-charcoal-light';
                  return (
                    <>
                      <tr key={i} className="cursor-pointer" onClick={() => toggleExpand(i)}>
                        <td>
                          <span className={`text-[13px] font-bold ${actionColor}`}>{actionLabel}</span>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-[13px] text-white font-medium">{entry.target_type}</span>
                            <span className="text-[11px] text-charcoal-light font-mono">{entry.target_id?.slice(0, 12)}…</span>
                          </div>
                        </td>
                        <td>
                          {entry.details && Object.keys(entry.details).length > 0 ? (
                            <span className="text-[12px] text-charcoal-light">
                              {isExpanded ? JSON.stringify(entry.details, null, 2) : 'Click to expand'}
                            </span>
                          ) : (
                            <span className="text-[12px] text-charcoal-light">—</span>
                          )}
                        </td>
                        <td>
                          <span className="text-[13px] text-charcoal font-mono">{entry.admin_id?.slice(0, 8)}…</span>
                        </td>
                        <td>
                          <span className="text-[12px] text-charcoal-light font-medium whitespace-nowrap">
                            {new Date(entry.created_at).toLocaleString('en-US', { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' 
                            })}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && entry.details && Object.keys(entry.details).length > 0 && (
                        <tr key={`${i}-expanded`}>
                          <td colSpan={5} className="p-4 bg-dark/50">
                            <pre className="text-[11px] text-charcoal-light font-mono overflow-x-auto">
                              {JSON.stringify(entry.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-charcoal-light text-[14px]">
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
