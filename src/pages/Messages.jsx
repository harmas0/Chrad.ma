import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { fetchConversations } from '../data/messagesApi';
import { supabase } from '../utils/supabaseClient';
import { useI18n } from '../utils/i18n';

function timeAgo(dateString) {
  if (!dateString) return '';
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
      <div className="sticky top-0 z-40 glass-floating border-b border-white/10 px-5 py-4.5 rounded-b-3xl">
        <h1 className="text-[24px] font-heading font-black text-white tracking-tight">{t('inbox')}</h1>
      </div>

      {/* Content */}
      <div className="animate-fade-in px-5 pt-6 pb-28">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-9 h-9 border-3 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="glass-card rounded-3xl p-10 text-center border border-white/10 mt-4">
            <MessageCircle size={44} className="text-accent mx-auto mb-4 opacity-70" />
            <p className="text-[16px] font-heading font-black text-white mb-1.5">{t('no_messages')}</p>
            <p className="text-[13px] text-charcoal-light font-medium">
              {t('inbox_desc')}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {conversations.map((conv, i) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="glass-card rounded-3xl p-4.5 border border-white/10 hover-lift active-press cursor-pointer flex items-center gap-4 group"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="relative shrink-0">
                  <div className="w-13 h-13 rounded-2xl bg-dark/80 border-2 border-white/10 flex items-center justify-center text-accent text-[14px] font-black shadow-inner">
                    {conv.participantInitials}
                  </div>
                  {/* Unread badge indicator */}
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-dark rounded-full flex items-center justify-center text-[10px] font-black shadow-[0_0_10px_rgba(0,255,135,0.6)] animate-pulse">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[15px] font-heading font-black text-white truncate group-hover:text-accent transition-colors">
                      {conv.participantName}
                    </h3>
                    <span className="text-[11px] text-charcoal-light font-bold">
                      {timeAgo(conv.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-[13px] text-charcoal-light truncate font-medium mb-1">
                    {conv.lastMessageText}
                  </p>
                  <p className="text-[10px] text-accent font-black uppercase tracking-wider truncate bg-accent/10 px-2 py-0.5 rounded-full w-max border border-accent/20">
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
