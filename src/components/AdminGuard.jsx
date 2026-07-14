import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminGuard({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,255,135,0.5)]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
