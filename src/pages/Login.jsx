import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRunner, setIsRunner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
              is_runner: isRunner,
            }
          }
        });
        if (error) throw error;
        
        if (data.user && !data.session) {
          // Email confirmation is required
          setSuccessMessage('Registration successful! Please check your email to verify your account before logging in.');
          setIsLogin(true);
        } else {
          // Auto-logged in
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-dark-surface rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border shadow-[0_0_30px_rgba(0,255,135,0.15)]">
            <span className="text-4xl">⚡</span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Chrad</h1>
          <p className="text-charcoal-light font-medium">Your on-demand runner app</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-surface p-6 rounded-3xl border border-border-light shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-accent/10 border border-accent/30 text-accent p-3 rounded-xl mb-4 text-sm font-medium">
              {successMessage}
            </div>
          )}

          {!isLogin && (
            <div className="mb-4 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <UserPlus size={18} className="text-charcoal-light" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-dark border border-border rounded-xl py-3 pl-11 pr-4 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
              />
            </div>
          )}

          <div className="mb-4 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Mail size={18} className="text-charcoal-light" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-dark border border-border rounded-xl py-3 pl-11 pr-4 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
            />
          </div>

          <div className="mb-6 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-charcoal-light" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-dark border border-border rounded-xl py-3 pl-11 pr-4 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
            />
          </div>



          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-dark font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#00c968] active:scale-[0.98] transition-all disabled:opacity-70 shadow-[0_4px_15px_rgba(0,255,135,0.3)]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn size={20} />
                Sign In
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Sign Up
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-charcoal-light hover:text-white text-sm font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
