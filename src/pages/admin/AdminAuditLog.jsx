import { useI18n } from '../../utils/i18n';
import { useState, useEffect } from 'react';
import { ScrollText, Filter, ChevronDown, User, ShieldCheck, Ban, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { fetchAuditLog } from '../../data/adminApi';
import { exportToCSV } from '../../utils/exportCsv';

const ACTION_CONFIG = {
  BAN_USER: { icon: Ban, color: 'text-danger', bg: 'bg-danger/10 border-danger/20', label: 'Banned User' },
  UNBAN_USER: { icon: RefreshCw, color: 'text-accent', bg: 'bg-accent/10 border-accent/20', label: 'Unbanned User' },
  APPROVE_KYC: { icon: ShieldCheck, color: 'text-accent', bg: 'bg-accent/10 border-accent/20', label: 'Approved KYC' },
  REJECT_KYC: { icon: ShieldCheck, color: 'text-warning', bg: 'bg-warning/10 border-warning/20', label: 'Rejected KYC' },
  RESOLVE_DISPUTE: { icon: AlertTriangle, color: 'text-accent', bg: 'bg-accent/10 border-accent/20', label: 'Resolved Dispute' },
  DISMISS_DISPUTE: { icon: AlertTriangle, color: 'text-charcoal-light', bg: 'bg-muted/10 border-border', label: 'Dismissed Dispute' },
  CHANGE_ROLE: { icon: User, color: 'text-info', bg: 'bg-info/10 border-info/20', label: 'Changed Role' },
  UPDATE_DISPUTE_STATUS: { icon: AlertTriangle, color: 'text-info', bg: 'bg-info/10 border-info/20', label: 'Updated Dispute Status' },
};

export default function AdminAuditLog() {
  const { t } = useI18n();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await fetchAuditLog(100);
      setLogs(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-black text-white tracking-tight mb-1">{t('audit_log')}</h1>
          <p className="text-[14px] text-charcoal-light font-medium">{t('complete_history_of_admin_actions')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCSV(logs, `chrad_audit_log_${new Date().toISOString().split('T')[0]}.csv`)}
            className="p-3 bg-dark border border-border rounded-xl text-charcoal-light hover:text-white flex items-center gap-2 transition-all text-[13px] font-bold"
          >
            <Download size={14} />
            Export Audit Log CSV
          </button>
          <span className="text-[12px] text-charcoal-light font-medium bg-dark-surface border border-border px-4 py-3 rounded-xl">
            {logs.length} entries
          </span>
        </div>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-border-light p-12 text-center">
          <ScrollText size={48} className="text-charcoal-light mx-auto mb-4 opacity-50" />
          <p className="text-[16px] font-bold text-white mb-2">{t('no_activity_yet')}</p>
          <p className="text-[14px] text-charcoal-light">{t('admin_actions_will_appear_here_once')}</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-border-light overflow-hidden">
          <div className="divide-y divide-border">
            {logs.map((entry, i) => {
              const cfg = ACTION_CONFIG[entry.action] || {
                icon: ScrollText,
                color: 'text-charcoal-light',
                bg: 'bg-dark border-border',
                label: entry.action,
              };
              const isExpanded = expandedId === entry.id;

              return (
                <div key={entry.id || i} className="hover:bg-white/[0.01] transition-colors">
                  <button
                    className="w-full flex items-center gap-4 px-6 py-4 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} border flex items-center justify-center ${cfg.color} shrink-0`}>
                      <cfg.icon size={16} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className={`text-[13px] font-bold ${cfg.color}`}>{cfg.label}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-charcoal-light font-medium">
                          {entry.target_type}
                        </span>
                        <span className="text-[11px] text-white font-mono bg-dark px-2 py-0.5 rounded">
                          {entry.target_id?.slice(0, 12)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-charcoal-light font-medium">
                        {new Date(entry.created_at).toLocaleString('en-US', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-charcoal-light transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && entry.details && Object.keys(entry.details).length > 0 && (
                    <div className="px-6 pb-4">
                      <div className="bg-dark rounded-xl p-4 border border-border ml-13">
                        <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest mb-2">{t('details')}</p>
                        <div className="space-y-1">
                          {Object.entries(entry.details).map(([key, value]) => (
                            <div key={key} className="flex gap-2 text-[12px]">
                              <span className="text-charcoal-light font-medium min-w-[80px]">{key}:</span>
                              <span className="text-white font-medium">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-charcoal-light mt-3 font-mono">
                          Admin: {entry.admin_id?.slice(0, 12)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
