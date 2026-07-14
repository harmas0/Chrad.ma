import { ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BannedScreen() {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center animate-fade-in-up">
        <div className="w-20 h-20 rounded-full bg-danger/10 border-2 border-danger mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(255,51,102,0.15)]">
          <ShieldOff size={36} className="text-danger" />
        </div>

        <h1 className="text-[24px] font-black text-white mb-3">Account Suspended</h1>
        <p className="text-[14px] text-charcoal-light font-medium mb-4 leading-relaxed">
          Your account has been suspended due to a violation of our platform policies.
        </p>

        {profile?.ban_reason && (
          <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 mb-6 text-left">
            <p className="text-[11px] text-danger font-bold uppercase tracking-widest mb-1">Reason</p>
            <p className="text-[13px] text-charcoal-light">{profile.ban_reason}</p>
          </div>
        )}

        <p className="text-[13px] text-charcoal-light mb-8">
          If you believe this is a mistake, please contact our support team at{' '}
          <span className="text-accent font-bold">support@chrad.ma</span>
        </p>

        <button
          onClick={signOut}
          className="w-full py-4 rounded-2xl border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors text-[15px] font-bold uppercase tracking-wider"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
