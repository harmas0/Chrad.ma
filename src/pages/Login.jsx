import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, User, Briefcase, Zap } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useI18n } from '../utils/i18n';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useI18n();
  // authMode can be: 'login' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState('login');
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRunner, setIsRunner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else if (authMode === 'signup') {
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
          setSuccessMessage('Registration successful! Please check your email to verify your account.');
          setAuthMode('login');
          // Clear inputs
          setName('');
          setPassword('');
        } else {
          navigate('/');
        }
      } else if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/#/reset-password`,
        });
        if (error) throw error;
        setSuccessMessage('Password recovery link sent! Please check your inbox.');
        setAuthMode('login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col justify-center items-center px-6 relative overflow-hidden pt-safe pb-safe-only">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#00FF87]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#00E5FF]/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-dark-surface rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border-light shadow-[0_0_35px_rgba(0,255,135,0.15)] animate-pulse-glow">
            <Zap className="text-accent" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider font-heading mb-1.5">{t('chrad')}</h1>
          <p className="text-charcoal-light font-medium text-[13px] tracking-wide">{t('hero_desc') || 'Premium On-Demand Tasks & Deliveries'}</p>
        </div>

        {/* Auth Mode Toggle Tabs (only if not in forgot mode) */}
        {authMode !== 'forgot' && (
          <div className="flex bg-dark-surface p-1 rounded-2xl border border-border mb-6">
            <button
              onClick={() => { setAuthMode('login'); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider rounded-xl transition-all
                ${authMode === 'login' 
                  ? 'bg-accent text-dark shadow-md font-black' 
                  : 'text-charcoal-light hover:text-white'
                }`}
            >
              {t('login') || 'Sign In'}
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-3 text-[12px] font-bold uppercase tracking-wider rounded-xl transition-all
                ${authMode === 'signup' 
                  ? 'bg-accent text-dark shadow-md font-black' 
                  : 'text-charcoal-light hover:text-white'
                }`}
            >
              {t('signup') || 'Sign Up'}
            </button>
          </div>
        )}

        {/* Auth Card */}
        <div className="glass-panel p-8 rounded-[32px] border border-border-light shadow-2xl animate-scale-in">
          
          {/* Header */}
          <div className="mb-6">
            {authMode === 'forgot' && (
              <button 
                onClick={() => { setAuthMode('login'); setError(null); }}
                className="inline-flex items-center gap-1.5 text-charcoal-light hover:text-white text-[12px] font-bold mb-4 transition-colors"
              >
                <ArrowLeft size={14} /> {t('back') || 'Back'}
              </button>
            )}
            <h2 className="text-[22px] font-black text-white font-heading">
              {authMode === 'login' && (t('welcome_back') || 'Welcome Back')}
              {authMode === 'signup' && (t('create_account') || 'Create Account')}
              {authMode === 'forgot' && (t('reset_password') || 'Reset Password')}
            </h2>
            <p className="text-[12px] text-charcoal-light mt-1 font-medium">
              {authMode === 'login' && (t('login_subtitle') || 'Enter your credentials to access your portal')}
              {authMode === 'signup' && (t('signup_subtitle') || 'Sign up to request tasks or earn as a runner')}
              {authMode === 'forgot' && (t('forgot_subtitle') || "Provide your email and we'll send a recovery link")}
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger p-3.5 rounded-xl mb-5 flex items-start gap-2.5 text-[12px] font-semibold animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-accent/10 border border-accent/20 text-accent p-3.5 rounded-xl mb-5 flex items-start gap-2.5 text-[12px] font-semibold">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Main Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* SignUp Name Input */}
            {authMode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider block">{t('full_name')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-charcoal-light">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('john_doe')}
                    className="w-full bg-dark border border-border rounded-2xl py-3.5 pl-12 pr-4 text-[13px] text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider block">{t('email_address')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-charcoal-light">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('yournamedomaincom')}
                  className="w-full bg-dark border border-border rounded-2xl py-3.5 pl-12 pr-4 text-[13px] text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Input (only in login and signup) */}
            {authMode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider">{t('password')}</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] font-bold text-accent hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-charcoal-light">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-dark border border-border rounded-2xl py-3.5 pl-12 pr-12 text-[13px] text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-charcoal-light hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Role Cards Selector (only in signup mode) */}
            {authMode === 'signup' && (
              <div className="space-y-2 pt-2">
                <label className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider block">{t('choose_your_account_tier')}</label>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Client Card */}
                  <div
                    onClick={() => setIsRunner(false)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between aspect-square relative select-none
                      ${!isRunner 
                        ? 'border-accent bg-accent/5 shadow-[0_0_15px_rgba(0,255,135,0.05)]' 
                        : 'border-border bg-dark hover:border-charcoal-light'
                      }`}
                  >
                    {!isRunner && (
                      <div className="absolute top-3 right-3 w-4 h-4 bg-accent rounded-full flex items-center justify-center text-[10px] font-black text-dark">
                        ✓
                      </div>
                    )}
                    <User size={22} className={!isRunner ? 'text-accent' : 'text-charcoal-light'} />
                    <div>
                      <h4 className={`text-[12px] font-black uppercase ${!isRunner ? 'text-white' : 'text-charcoal-light'}`}>{t('client')}</h4>
                      <p className="text-[9px] text-charcoal-light leading-snug mt-1 font-medium">{t('post_tasks_and_hire_helper_runners')}</p>
                    </div>
                  </div>

                  {/* Runner Card */}
                  <div
                    onClick={() => setIsRunner(true)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between aspect-square relative select-none
                      ${isRunner 
                        ? 'border-accent bg-accent/5 shadow-[0_0_15px_rgba(0,255,135,0.05)]' 
                        : 'border-border bg-dark hover:border-charcoal-light'
                      }`}
                  >
                    {isRunner && (
                      <div className="absolute top-3 right-3 w-4 h-4 bg-accent rounded-full flex items-center justify-center text-[10px] font-black text-dark">
                        ✓
                      </div>
                    )}
                    <Briefcase size={22} className={isRunner ? 'text-accent' : 'text-charcoal-light'} />
                    <div>
                      <h4 className={`text-[12px] font-black uppercase ${isRunner ? 'text-white' : 'text-charcoal-light'}`}>{t('runner')}</h4>
                      <p className="text-[9px] text-charcoal-light leading-snug mt-1 font-medium">{t('accept_nearby_tasks_and_earn_money')}</p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-dark font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#00c968] active:scale-[0.98] transition-all disabled:opacity-70 shadow-[0_4px_20px_rgba(0,255,135,0.25)] text-[12px] uppercase tracking-wider font-heading mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {authMode === 'login' && (
                    <>
                      {t('sign_in')} <LogIn size={16} />
                    </>
                  )}
                  {authMode === 'signup' && (
                    <>
                      {t('create_account')} <UserPlus size={16} />
                    </>
                  )}
                  {authMode === 'forgot' && (
                    <>
                      {t('send_reset_link')} <KeyRound size={16} />
                    </>
                  )}
                </>
              )}
            </button>

          </form>
        </div>

        {/* Bottom Mode Switcher */}
        {authMode !== 'forgot' && (
          <div className="mt-8 text-center animate-fade-in">
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-charcoal-light hover:text-white text-[12px] font-bold tracking-wide transition-colors inline-flex items-center gap-1 bg-white/[0.02] border border-border px-4 py-2 rounded-xl"
            >
              {authMode === 'login' ? (
                <>
                  {t('new_to_chrad')} <span className="text-accent">{t('create_an_account')}</span>
                </>
              ) : (
                <>
                  {t('already_have_an_account')} <span className="text-accent">{t('sign_in')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
