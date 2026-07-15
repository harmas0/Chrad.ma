import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../utils/i18n';

export default function BannedScreen() {
  const { signOut, profile } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-danger/10 border-2 border-danger mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(255,51,102,0.15)]">
          <ShieldOff size={36} className="text-danger" />
        </div>

        <h1 className="text-[24px] font-black text-white mb-3">{t('access_denied')}</h1>
        <p className="text-[14px] text-charcoal-light font-medium mb-4 leading-relaxed">
          {t('banned_desc')}
        </p>

        {profile?.ban_reason && (
          <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 mb-6 text-left">
            <p className="text-[11px] text-danger font-bold uppercase tracking-widest mb-1">{t('reason_label')}</p>
            <p className="text-[13px] text-charcoal-light">{profile.ban_reason}</p>
          </div>
        )}

        <p className="text-[13px] text-charcoal-light mb-8">
          {t('banned_mistake')}{' '}
          <span className="text-accent font-bold">support@chrad.ma</span>
        </p>

        <button
          onClick={signOut}
          className="w-full py-4 rounded-2xl border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors text-[15px] font-bold uppercase tracking-wider"
        >
          {t('logout')}
        </button>
      </div>
    </div>
  );
}
