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
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './utils/i18n';

// Admin pages
import AdminGuard from './components/AdminGuard';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTasks from './pages/admin/AdminTasks';
import AdminKYC from './pages/admin/AdminKYC';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminSettings from './pages/admin/AdminSettings';

const ProtectedRoute = ({ children }) => {
  const { user, isBanned } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (isBanned) {
    return <BannedScreen />;
  }
  return children;
};

const AppContent = () => {
  const { user, isBanned, isAdmin } = useAuth();

  // Check if on an admin route
  const isAdminRoute = window.location.hash?.startsWith('#/admin');

  return (
    <div className={`${isAdminRoute ? '' : 'app-container'} bg-dark min-h-screen relative`}>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

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
          <Route path="users" element={<AdminUsers />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="kyc" element={<AdminKYC />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="audit" element={<AdminAuditLog />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
      {user && !isBanned && !isAdminRoute && <BottomNav />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
