import { NavLink, useLocation } from 'react-router-dom';
import { Home, PlusCircle, MessageCircle, User, Compass } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/explore', icon: Compass, label: 'Explore' },
  { to: '/create', icon: PlusCircle, label: 'Post', isCreate: true },
  { to: '/messages', icon: MessageCircle, label: 'Messages', badge: 3 },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  
  // Hide bottom nav on detail, chat, task creation, and active tracking screens
  const hiddenRoutes = ['/chat', '/create', '/active', '/task'];
  if (hiddenRoutes.some(r => location.pathname.startsWith(r))) return null;

  return (
    <nav 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 pointer-events-none" 
      style={{ paddingBottom: 'calc(var(--safe-area-bottom, 0px) + 16px)', paddingLeft: '16px', paddingRight: '16px' }}
      id="bottom-nav"
    >
      <div className="w-full flex items-center justify-around px-2 h-[72px] bg-dark-surface border border-border-light shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-[28px] pointer-events-auto">
        {navItems.map(({ to, icon: Icon, label, isCreate, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 transition-all duration-300 relative
               ${isCreate
                 ? 'bg-accent text-dark rounded-full w-[56px] h-[56px] flex items-center justify-center -mt-8 shadow-[0_8px_25px_rgba(0,255,135,0.4)] hover:scale-105 active:scale-95'
                 : isActive
                   ? 'text-accent scale-105'
                   : 'text-charcoal-light hover:text-white'
               }`
            }
            id={`nav-${label.toLowerCase()}`}
          >
            {isCreate ? (
              <Icon size={28} strokeWidth={2.5} />
            ) : (
              <>
                <div className="relative">
                  <Icon size={24} strokeWidth={2} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-danger text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center shadow-md border border-dark">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold tracking-wide leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
