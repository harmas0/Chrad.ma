import { useI18n } from '../utils/i18n';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import LanguageSwitcher from './LanguageSwitcher';
import WalletModal from './WalletModal';
import { useAuth } from '../context/AuthContext';
import { Shield, Wallet } from 'lucide-react';

export default function HeaderNav({ title, showBack = false }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, isAdmin, isRunner } = useAuth();
  const [showWallet, setShowWallet] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-[9999] glass-floating border-b border-white/10 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-dark/70 border border-white/10 flex items-center justify-center text-white hover:bg-surface transition-colors active-press"
            >
              ←
            </button>
          ) : (
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center font-heading font-black text-accent text-lg shadow-[0_0_15px_rgba(0,255,135,0.2)] group-hover:scale-105 transition-transform">
                <Zap size={18} />
              </div>
              <div>
                <span className="font-heading font-black text-white text-[17px] tracking-tight block leading-none">
                  {t('chrad')}<span className="text-accent">{t('ma')}</span>
                </span>
                {isRunner && (
                  <span className="text-[9px] font-black uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.2 rounded border border-accent/20">
                    {t('runner')}
                  </span>
                )}
              </div>
            </Link>
          )}
          {title && <h2 className="font-heading font-extrabold text-white text-[16px] truncate">{title}</h2>}
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => setShowWallet(true)}
              className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent hover:bg-accent/20 transition-all active-press"
              title={t('open_wallet')}
            >
              <Wallet size={18} />
            </button>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="p-2 rounded-xl bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 transition-colors"
              title={t('admin_dashboard')}
            >
              <Shield size={18} />
            </Link>
          )}
          <NotificationCenter />
          <LanguageSwitcher compact />
        </div>
      </header>

      {user && (
        <WalletModal isOpen={showWallet} onClose={() => setShowWallet(false)} />
      )}
    </>
  );
}
