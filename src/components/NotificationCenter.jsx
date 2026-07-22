import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, MessageSquare, Tag, Package, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { useI18n } from '../utils/i18n';

const MOCK_INITIAL_NOTIFS = [
  {
    id: 'n1',
    title: 'New Bid Received 🏷️',
    message: 'Ahmed Runner offered 45 MAD for your delivery task.',
    time: '5m ago',
    read: false,
    type: 'bid',
    route: '/task/1',
  },
  {
    id: 'n2',
    title: 'Task In Progress 🚚',
    message: 'Your runner is en route with your package.',
    time: '25m ago',
    read: false,
    type: 'status',
    route: '/',
  },
  {
    id: 'n3',
    title: 'Welcome to Chrad.ma 🎉',
    message: 'Post your first errand or start earning as a runner today!',
    time: '1h ago',
    read: true,
    type: 'system',
    route: '/',
  },
];

export default function NotificationCenter() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_INITIAL_NOTIFS);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to live Supabase channel updates for tasks/messages if user is logged in
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new && payload.new.receiver_id === user.id) {
          const newNotif = {
            id: `msg-${Date.now()}`,
            title: 'New Message 💬',
            message: payload.new.content || 'You received a new message.',
            time: 'Just now',
            read: false,
            type: 'chat',
            route: `/chat/${payload.new.conversation_id}`,
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif) => {
    setNotifications(
      notifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setIsOpen(false);
    if (notif.route) {
      navigate(notif.route);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-2xl bg-dark/60 border border-white/10 flex items-center justify-center text-white hover:border-accent/40 transition-all active-press"
        id="notification-bell-btn"
        aria-label={t('notifications')}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-accent text-dark font-mono text-[10px] font-black flex items-center justify-center shadow-[0_0_10px_#00FF87] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-dark/95 backdrop-blur-xl border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.7)] p-4 z-[99999] animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-accent" />
              <h3 className="font-heading font-black text-white text-[15px]">{t('notifications')}</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-[10px] font-extrabold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1"
              >
                <CheckCheck size={14} />
                {t('mark_all_read')}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={28} className="text-muted mx-auto mb-2 opacity-40" />
                <p className="text-[13px] text-charcoal-light font-bold">{t('no_notifications_yet')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left p-3 rounded-2xl transition-all border flex items-start gap-3 group ${
                    !n.read
                      ? 'bg-accent/10 border-accent/30 hover:border-accent'
                      : 'bg-dark/40 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === 'bid' ? 'bg-accent/20 text-accent' :
                    n.type === 'status' ? 'bg-info/20 text-info' : 'bg-warning/20 text-warning'
                  }`}>
                    {n.type === 'bid' ? <Tag size={16} /> :
                     n.type === 'chat' ? <MessageSquare size={16} /> : <Package size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-[13px] font-bold line-clamp-1 ${!n.read ? 'text-white font-extrabold' : 'text-charcoal-light'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted shrink-0 font-medium">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-muted line-clamp-2 leading-tight">{n.message}</p>
                  </div>
                  <ChevronRight size={14} className="text-muted group-hover:text-accent transition-colors mt-2 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
