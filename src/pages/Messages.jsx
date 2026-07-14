import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { fetchConversations } from '../data/messagesApi';

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchConversations();
      if (!cancelled) { setConversations(data); setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="pb-safe min-h-screen bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-panel border-b border-border-light px-5 pt-safe pb-4 rounded-b-3xl">
        <h1 className="text-[24px] font-extrabold text-white tracking-tight">Messages</h1>
        <p className="text-[13px] text-accent font-semibold mt-1">
          {conversations.filter(c => c.unread > 0).length} unread conversations
        </p>
      </div>

      {/* Conversations */}
      <div className="px-5 pt-6 pb-28">
        {conversations.map((conv, i) => (
          <button
            key={conv.id}
            onClick={() => navigate(`/chat/${conv.id}`)}
            className="stagger-item w-full flex items-center gap-4 px-6 py-6 bg-dark-surface border border-border-light rounded-2xl hover:border-accent hover:bg-surface transition-all text-left group shadow-md mb-5"
            style={{ animationDelay: `${i * 0.08}s` }}
            id={`conversation-${conv.id}`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-dark flex items-center justify-center text-[16px] font-black text-accent border border-border shadow-inner">
                {conv.participantInitials}
              </div>
              {conv.unread > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-accent text-dark text-[11px] font-black rounded-full flex items-center justify-center border-2 border-dark shadow-[0_0_10px_rgba(0,255,135,0.6)]">
                  {conv.unread}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className={`text-[15px] truncate ${conv.unread > 0 ? 'font-black text-white' : 'font-bold text-white'}`}>
                  {conv.participantName}
                </h3>
                <span className={`text-[11px] flex-shrink-0 font-bold uppercase tracking-wider ${conv.unread > 0 ? 'text-accent' : 'text-gray-400'}`}>
                  {timeAgo(conv.lastMessageTime)}
                </span>
              </div>
              <p className="text-[12px] text-accent font-bold uppercase tracking-wider truncate mt-2">
                {conv.taskTitle}
              </p>
              <p className={`text-[14px] truncate mt-2 ${conv.unread > 0 ? 'text-white font-semibold' : 'text-gray-300 font-medium'}`}>
                {conv.lastMessage}
              </p>
            </div>
          </button>
        ))}
      </div>

      {conversations.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-20 h-20 bg-dark-surface rounded-full flex items-center justify-center mb-5 border border-border">
            <MessageCircle size={36} className="text-muted" />
          </div>
          <h3 className="text-[18px] font-extrabold text-white mb-2">No messages yet</h3>
          <p className="text-[14px] text-charcoal-light font-medium leading-relaxed">
            When you accept a bid or a runner messages you, conversations will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
