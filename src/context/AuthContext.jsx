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
        loadProfile(session.user.id, session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId, currentUser) => {
    try {
      let p = await fetchProfileById(userId);
      
      if (!p && (currentUser || user)) {
        const activeUser = currentUser || user;
        console.warn('Profile not found for authenticated user, creating fallback...');
        const name = activeUser.user_metadata?.name || activeUser.email?.split('@')[0] || 'User';
        const isRunner = activeUser.user_metadata?.is_runner || false;
        const initials = name.slice(0, 2).toUpperCase();

        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name,
            is_runner: isRunner,
            initials,
            phone: '',
            bio: '',
            rating: 5.0,
            completed_tasks: 0,
            earnings: 0,
            spent: 0,
            verified: false,
            role: 'user',
            kyc_status: 'none',
            is_banned: false
          })
          .select()
          .maybeSingle();

        if (error) {
          console.error('Error creating fallback profile:', error);
        } else if (data) {
          p = data;
        }
      }
      
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
    refreshProfile: () => user && loadProfile(user.id, user),
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
