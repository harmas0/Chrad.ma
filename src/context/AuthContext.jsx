import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { fetchProfileById } from '../data/mockUsers';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    try {
      const p = await fetchProfileById(userId);
      setProfile(p);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Computed helpers
  const isAdmin = profile?.role === 'admin';
  const isBanned = profile?.is_banned === true;

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    isBanned,
    signOut: () => supabase.auth.signOut(),
    refreshProfile: () => user && loadProfile(user.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
