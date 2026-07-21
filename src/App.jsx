import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import CreateTask from './pages/CreateTask';
import TaskDetail from './pages/TaskDetail';
import ActiveTask from './pages/ActiveTask';
import RunnerFeed from './pages/RunnerFeed';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Login from './pages/Login';
import BannedScreen from './pages/BannedScreen';
import KYCUpload from './pages/KYCUpload';
import Onboarding from './pages/Onboarding';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useI18n } from './utils/i18n';
import { supabase } from './utils/supabaseClient';
import { fetchPlatformSettings } from './data/settingsApi';
import { Settings } from 'lucide-react';

// Admin pages
import AdminGuard from './components/AdminGuard';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFinancials from './pages/admin/AdminFinancials';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTasks from './pages/admin/AdminTasks';
import AdminKYC from './pages/admin/AdminKYC';
import AdminRunnerQueue from './pages/admin/AdminRunnerQueue';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminCategories from './pages/admin/AdminCategories';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminAds from './pages/admin/AdminAds';
import AdminSupport from './pages/admin/AdminSupport';
import AdminLiveMap from './pages/admin/AdminLiveMap';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminSettings from './pages/admin/AdminSettings';

const ProtectedRoute = ({ children }) => {
  const { user, isBanned } = useAuth();
  const onboarded = localStorage.getItem('onboarded') === 'true';

  if (!user) {
    if (!onboarded) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  if (isBanned) {
    return <BannedScreen />;
  }
  return children;
};

const AppContent = () => {
  const { user, isBanned, isAdmin } = useAuth();
  const { t } = useI18n();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Register push notifications (FCM) dynamically upon login
  useEffect(() => {
    if (user?.id) {
      import('./utils/notifications').then(({ initializePushNotifications }) => {
        initializePushNotifications(user.id);
      }).catch((err) => {
        console.error('Failed to load notifications coordinator:', err);
      });
    }
  }, [user?.id]);

  useEffect(() => {
    async function checkMaintenance() {
      const data = await fetchPlatformSettings();
      if (data) {
        setMaintenanceMode(data.maintenanceMode);
      }
    }
    checkMaintenance();

    const handleOnline = () => {
      setIsOffline(false);
      try {
        const channels = supabase.getChannels();
        channels.forEach((ch) => {
          ch.unsubscribe();
          ch.subscribe();
        });
      } catch (err) {
        console.error('Failed to reconnect Supabase channels:', err);
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if on an admin route
  const isAdminRoute = window.location.hash?.startsWith('#/admin');

  if (maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent mx-auto mb-6 flex items-center justify-center shadow-[0_0_35px_rgba(0,255,135,0.15)] animate-pulse-glow">
          <Settings size={36} className="text-accent animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <h1 className="text-[26px] font-black text-white mb-3">Under Maintenance</h1>
        <p className="text-[14px] text-charcoal-light max-w-sm mb-8 leading-relaxed font-medium">
          Chrad.ma is undergoing scheduled system upgrades. We will be back online shortly. Thank you for your patience!
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
    <div className={`${isAdminRoute ? '' : 'app-container'} bg-dark min-h-screen relative`}>
      {isOffline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[400px] bg-danger/90 backdrop-blur-md border border-danger/30 rounded-2xl px-5 py-3.5 flex items-center gap-3.5 shadow-[0_8px_32px_rgba(255,51,102,0.3)] animate-bounce-in text-left">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-black text-white leading-tight">{t('connection_lost')}</p>
            <p className="text-[11px] text-white/80 font-medium">{t('reconnecting')}</p>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/onboarding" element={!user ? <Onboarding /> : <Navigate to="/" replace />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Main app routes */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
        <Route path="/task/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
        <Route path="/active/:id" element={<ProtectedRoute><ActiveTask /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><RunnerFeed /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/kyc-upload" element={<ProtectedRoute><KYCUpload /></ProtectedRoute>} />

        {/* Admin routes — nested under AdminLayout for shared sidebar */}
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<AdminDashboard />} />
          <Route path="financials" element={<AdminFinancials />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="kyc" element={<AdminKYC />} />
          <Route path="runners" element={<AdminRunnerQueue />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="live-map" element={<AdminLiveMap />} />
          <Route path="audit" element={<AdminAuditLog />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
      {user && !isBanned && !isAdminRoute && <BottomNav />}
      <PWAInstallPrompt />
    </div>
  );
};

import ErrorBoundary from './components/ErrorBoundary';
import PWAInstallPrompt from './components/PWAInstallPrompt';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
