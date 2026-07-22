import { useI18n } from '../utils/i18n';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        // Sign out to clean up any recovery session residue and redirect
        supabase.auth.signOut().then(() => {
          navigate('/login');
        });
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col justify-center items-center px-6 relative overflow-hidden pt-safe pb-safe-only">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-accent/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-dark-surface rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border-light shadow-[0_0_35px_rgba(0,255,135,0.1)]">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider font-heading mb-1.5">{t('chrad')}</h1>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-[32px] border border-border-light shadow-2xl animate-scale-in">
          
          <div className="mb-6">
            <h2 className="text-[22px] font-black text-white font-heading">
              {t('new_password')}
            </h2>
            <p className="text-[12px] text-charcoal-light mt-1 font-medium">
              {t('create_a_new_secure_password_for_yo')}
            </p>
          </div>

          {success ? (
            <div className="space-y-4 text-center py-6 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-accent/15 border-2 border-accent mx-auto flex items-center justify-center text-accent">
                <CheckCircle2 size={32} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[16px] font-black text-white">{t('password_updated')}</h3>
                <p className="text-[12px] text-charcoal-light leading-relaxed font-medium">
                  {t('your_password_has_been_successfully')}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Feedback Error */}
              {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger p-3.5 rounded-xl flex items-start gap-2.5 text-[12px] font-semibold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider block">{t('new_password')}</label>
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-charcoal-light font-bold uppercase tracking-wider block">{t('confirm_new_password')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-charcoal-light">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-dark border border-border rounded-2xl py-3.5 pl-12 pr-12 text-[13px] text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Action button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-dark font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#00c968] active:scale-[0.98] transition-all disabled:opacity-70 shadow-[0_4px_20px_rgba(0,255,135,0.25)] text-[12px] uppercase tracking-wider font-heading mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {t('save_password')} <KeyRound size={16} />
                  </>
                )}
              </button>

            </form>
          )}
        </div>

        {/* Back Link */}
        {!success && (
          <div className="mt-8 text-center animate-fade-in">
            <button
              onClick={() => navigate('/login')}
              className="text-charcoal-light hover:text-white text-[12px] font-bold tracking-wide transition-colors inline-flex items-center gap-1.5 bg-white/[0.02] border border-border px-4 py-2 rounded-xl"
            >
              <ArrowLeft size={14} /> {t('back_to_sign_in')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
