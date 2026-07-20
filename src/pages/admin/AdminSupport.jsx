import { useState, useEffect } from 'react';
import { MessageSquare, Calendar, ShieldCheck, HelpCircle, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchSupportTickets, replySupportTicket } from '../../data/adminApi';

export default function AdminSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'open' | 'resolved'

  async function loadData() {
    setLoading(true);
    const data = await fetchSupportTickets();
    setTickets(data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !reply.trim()) return;
    setSubmitting(true);
    const success = await replySupportTicket(selectedTicket.id, reply, user.id);
    if (success) {
      alert('Reply sent and ticket resolved.');
      setReply('');
      setSelectedTicket(null);
      await loadData();
    } else {
      alert('Failed to submit reply.');
    }
    setSubmitting(false);
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus === 'open') return ticket.status !== 'resolved';
    if (filterStatus === 'resolved') return ticket.status === 'resolved';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black text-white tracking-tight mb-1">Support Center</h1>
        <p className="text-[14px] text-charcoal-light font-medium">Respond to user inquiries and platform dispute inquiries</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'All Tickets' },
          { key: 'open', label: 'Awaiting Action' },
          { key: 'resolved', label: 'Resolved' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-5 py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all border
              ${filterStatus === tab.key
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-dark-surface border-border text-charcoal-light hover:text-white hover:border-border-light'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredTickets.length === 0 ? (
        <div className="glass-panel p-12 text-center text-charcoal-light border border-dashed border-border-light rounded-2xl py-20">
          No support tickets found matching this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => { setSelectedTicket(ticket); setReply(''); }}
                className={`glass-panel p-6 border rounded-2xl transition-all cursor-pointer flex flex-col justify-between hover:border-accent/35
                  ${selectedTicket?.id === ticket.id ? 'border-accent shadow-[0_0_20px_rgba(0,255,135,0.1)] bg-accent/[0.01]' : 'border-border-light'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
                    ${ticket.status === 'resolved' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-warning/10 border-warning/20 text-warning'}`}>
                    {ticket.status === 'resolved' ? <ShieldCheck size={20} /> : <HelpCircle size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-[15px] font-bold text-white truncate">{ticket.subject || 'Platform Inquiry'}</h3>
                      <span className={`badge ${ticket.status === 'resolved' ? 'badge-approved' : 'badge-pending'}`}>
                        {ticket.status || 'open'}
                      </span>
                    </div>
                    <p className="text-[13px] text-charcoal-light mb-3 line-clamp-2">{ticket.message}</p>
                    <div className="flex items-center gap-4 text-[10px] text-charcoal-light font-medium">
                      <span className="font-mono">User ID: {ticket.user_id?.slice(0, 14)}…</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(ticket.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Details / Reply Editor Panel */}
          <div>
            {selectedTicket ? (
              <div className="glass-panel p-6 border border-border-light rounded-2xl sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-bold text-white flex items-center gap-1.5">
                    <MessageSquare size={16} className="text-accent" />
                    Ticket Thread
                  </h2>
                  <button onClick={() => setSelectedTicket(null)} className="text-charcoal-light hover:text-white font-bold text-xs uppercase">Close</button>
                </div>

                <div className="bg-dark rounded-xl p-4 border border-border mb-4">
                  <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider mb-2">Subject</p>
                  <p className="text-[13px] text-white font-bold mb-3">{selectedTicket.subject || 'Platform Inquiry'}</p>
                  <p className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider mb-2">Inquiry Details</p>
                  <p className="text-[13px] text-charcoal-light leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {selectedTicket.status === 'resolved' && selectedTicket.admin_reply ? (
                  <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                    <div className="flex items-center gap-1.5 text-accent text-[11px] font-bold uppercase tracking-wider mb-2">
                      <CheckCircle size={14} />
                      Resolution Answer
                    </div>
                    <p className="text-[13px] text-charcoal-light leading-relaxed">{selectedTicket.admin_reply}</p>
                    <p className="text-[10px] text-charcoal-light mt-3 font-medium">
                      Replied {new Date(selectedTicket.replied_at).toLocaleDateString()} by Admin
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReplySubmit} className="space-y-4">
                    <div>
                      <label className="text-[11px] text-charcoal-light font-bold uppercase tracking-wider mb-2 block">Resolution Answer</label>
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write support reply message here... (Marks ticket resolved)"
                        required
                        rows={4}
                        className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-medium resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || !reply.trim()}
                      className="w-full btn-accent py-3 rounded-xl text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      <Send size={14} /> Send Reply
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="glass-panel p-6 border border-dashed border-border-light rounded-2xl text-center text-charcoal-light text-[13px] py-16">
                Select a ticket thread from the queue to read user inquiries, view dates, and write answers.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
