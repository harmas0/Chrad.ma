import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { fetchConversations } from '../data/messagesApi';
import { supabase } from '../utils/supabaseClient';
import { useI18n } from '../utils/i18n';

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Messages() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchConversations();
      if (!cancelled) { setConversations(data); setLoading(false); }
    }
    load();

    const channel = supabase
      .channel('messages-conversations-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, () => {
        load();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="pb-safe min-h-screen bg-dark pt-safe">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-panel border-b border-border-light px-5 py-4 rounded-b-3xl">
        <h1 className="text-[24px] font-black text-white tracking-tight">{t('inbox')}</h1>
      </div>

      {/* Content */}
      <div className="animate-fade-in px-5 pt-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 text-center border border-border mt-4">
            <MessageCircle size={48} className="text-charcoal-light mx-auto mb-4 opacity-50" />
            <p className="text-[16px] font-bold text-white mb-2">{t('no_messages')}</p>
            <p className="text-[14px] text-charcoal-light font-medium">
              {t('inbox_desc')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {conversations.map((conv, i) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="glass-panel rounded-2xl border border-border-light p-4 hover:border-accent/20 transition-all cursor-pointer flex items-center gap-4 group animate-scale-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-dark border border-border flex items-center justify-center text-accent text-[14px] font-black shadow-inner">
                    {conv.participantInitials}
                  </div>
                  {/* Unread badge indicator */}
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-dark rounded-full flex items-center justify-center text-[10px] font-black shadow-[0_0_8px_rgba(0,255,135,0.6)]">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[15px] font-bold text-white truncate group-hover:text-accent transition-colors">
                      {conv.participantName}
                    </h3>
                    <span className="text-[11px] text-charcoal-light font-medium">
                      {timeAgo(conv.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-[12px] text-charcoal-light truncate font-medium mb-0.5">
                    {conv.lastMessageText}
                  </p>
                  <p className="text-[10px] text-accent font-bold uppercase tracking-wider truncate">
                    {conv.taskTitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
