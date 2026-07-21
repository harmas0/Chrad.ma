import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, ShieldCheck, AlertTriangle, ScrollText, LogOut, Zap, Package, Settings, DollarSign, UserCheck, Layers, Megaphone, MessageSquare, Map } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/financials', icon: DollarSign, label: 'Financials' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/tasks', icon: Package, label: 'Tasks' },
  { to: '/admin/kyc', icon: ShieldCheck, label: 'KYC Review' },
  { to: '/admin/runners', icon: UserCheck, label: 'Runner Queue' },
  { to: '/admin/disputes', icon: AlertTriangle, label: 'Disputes' },
  { to: '/admin/categories', icon: Layers, label: 'Categories' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/ads', icon: Sparkles, label: 'Ads Manager' },
  { to: '/admin/support', icon: MessageSquare, label: 'Support Tickets' },
  { to: '/admin/live-map', icon: Map, label: 'Live Map' },
  { to: '/admin/audit', icon: ScrollText, label: 'Audit Log' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];


export default function AdminLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 mb-8">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20 shadow-[0_0_20px_rgba(0,255,135,0.1)]">
            <Zap size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-[16px] font-black text-white tracking-tight leading-none">CHRAD</h1>
            <span className="text-[10px] text-accent font-bold uppercase tracking-widest">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <div className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest px-4 mb-3">Navigation</div>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Admin info */}
        <div className="mt-auto pt-6 border-t border-border">
          <div className="flex items-center gap-3 px-4 mb-4">
            <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[13px] font-black">
              {profile?.initials || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white truncate">{profile?.name || 'Admin'}</p>
              <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Administrator</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="admin-sidebar-link text-danger hover:bg-danger/5 w-full"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
