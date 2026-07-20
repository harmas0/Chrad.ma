import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, ShieldCheck, 
  AlertTriangle, ScrollText, Settings, LogOut, Zap 
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { fetchPlatformSettings } from '@shared/data/settingsApi';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTasks from './pages/admin/AdminTasks';
import AdminKYC from './pages/admin/AdminKYC';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminSettings from './pages/admin/AdminSettings';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/tasks', icon: Package, label: 'Tasks' },
  { to: '/kyc', icon: ShieldCheck, label: 'KYC Review' },
  { to: '/disputes', icon: AlertTriangle, label: 'Disputes' },
  { to: '/audit', icon: ScrollText, label: 'Audit Log' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function AdminSidebar() {
  const { profile, signOut } = useAuth();

  return (
    <aside className="admin-sidebar">
      <div className="flex items-center gap-3 px-5 mb-10">
        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20 shadow-[0_0_20px_rgba(0,255,135,0.1)]">
          <Zap size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-[16px] font-black text-white tracking-tight leading-none">CHRAD</h1>
          <span className="text-[10px] text-accent font-bold uppercase tracking-widest">Admin Portal</span>
        </div>
      </div>

      <nav className="flex-1">
        <div className="text-[10px] text-charcoal-light font-bold uppercase tracking-widest px-5 mb-3">Navigation</div>
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

      <div className="mt-auto pt-6 border-t border-border">
        <div className="flex items-center gap-3 px-5 mb-4">
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
  );
}

function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default function App() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    async function checkMaintenance() {
      const data = await fetchPlatformSettings();
      if (data) {
        setMaintenanceMode(data.maintenanceMode);
      }
    }
    checkMaintenance();
  }, []);

  if (maintenanceMode) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent mx-auto mb-6 flex items-center justify-center shadow-[0_0_35px_rgba(0,255,135,0.15)] animate-pulse-glow">
          <Settings size={36} className="text-accent animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <h1 className="text-[26px] font-black text-white mb-3">Under Maintenance</h1>
        <p className="text-[14px] text-charcoal-light max-w-sm mb-8 leading-relaxed font-medium">
          Ghrad Admin is undergoing scheduled system upgrades. We will be back online shortly. Thank you for your patience!
        </p>
        <button
          onClick={async () => {
            const data = await fetchPlatformSettings();
            if (data) setMaintenanceMode(data.maintenanceMode);
          }}
          className="btn-accent px-6 py-3.5 rounded-xl text-[14px] font-bold uppercase tracking-wider shadow-md"
        >
          Check Again
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="tasks" element={<AdminTasks />} />
        <Route path="kyc" element={<AdminKYC />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="audit" element={<AdminAuditLog />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}
