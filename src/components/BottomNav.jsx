import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Plus, MessageCircle, User, Compass } from 'lucide-react';
import { fetchConversations } from '../data/messagesApi';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../utils/i18n';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadUnread() {
    if (!user) return;
    try {
      const convs = await fetchConversations();
      const totalUnread = convs.reduce((sum, c) => sum + (c.unread || 0), 0);
      setUnreadCount(totalUnread);
    } catch (e) {
      console.error('Failed to load unread count:', e);
    }
  }

  useEffect(() => {
    if (!user) return;
    
    loadUnread();

    const channel = supabase
      .channel('bottom-nav-unread')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, () => {
        loadUnread();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const hiddenRoutes = ['/chat', '/create', '/active', '/task'];
  if (hiddenRoutes.some(r => location.pathname.startsWith(r))) return null;

  const navItems = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/explore', icon: Compass, label: t('explore') },
    { to: '/create', icon: Plus, label: t('post'), isCreate: true },
    { to: '/messages', icon: MessageCircle, label: t('messages'), badge: unreadCount },
    { to: '/profile', icon: User, label: t('profile') },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 pointer-events-none" 
      style={{ paddingBottom: 'calc(var(--safe-area-bottom, 0px) + 14px)', paddingLeft: '14px', paddingRight: '14px' }}
      id="bottom-nav"
    >
      <div className="w-full flex items-center justify-around px-3 h-[74px] glass-floating rounded-[30px] pointer-events-auto shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
        {navItems.map(({ to, icon: Icon, label, isCreate, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1.5 px-3 py-2 transition-all duration-300 relative select-none
               ${isCreate
                 ? 'bg-accent text-dark rounded-2xl w-[58px] h-[58px] flex items-center justify-center -mt-9 shadow-[0_8px_30px_rgba(0,255,135,0.45)] hover:scale-105 active:scale-95 transition-transform border-2 border-dark'
                 : isActive
                   ? 'text-accent scale-105'
                   : 'text-charcoal-light hover:text-white'
               }`
            }
            id={`nav-${label.toLowerCase()}`}
          >
            {({ isActive }) => (
              <>
                {isCreate ? (
                  <Icon size={30} strokeWidth={3} />
                ) : (
                  <>
                    <div className="relative">
                      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -right-2.5 bg-danger text-white text-[9px] font-black rounded-full w-[18px] h-[18px] flex items-center justify-center shadow-[0_0_10px_rgba(255,51,102,0.5)] border border-dark animate-pulse">
                          {badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] tracking-wide leading-none font-extrabold ${isActive ? 'text-accent' : 'text-charcoal-light'}`}>
                      {label}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent absolute -bottom-1 shadow-[0_0_8px_#00FF87]" />
                    )}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
