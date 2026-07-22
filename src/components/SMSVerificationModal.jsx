import { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, CheckCircle, AlertCircle, RefreshCw, Loader2, KeyRound } from 'lucide-react';
import { useI18n } from '../utils/i18n';
import { sendSMSOTP, verifySMSOTP } from '../utils/smsVerificationService';

export default function SMSVerificationModal({ isOpen, onClose, userId, initialPhone, onVerified }) {
  const { t } = useI18n();
  const [phone, setPhone] = useState(initialPhone || '');
  const [step, setStep] = useState('input'); // 'input' | 'otp' | 'success'
  const [otpCode, setOtpCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      setError('Please enter a valid Moroccan phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await sendSMSOTP(phone);
    setLoading(false);

    if (res.success) {
      setExpectedCode(res.otpCode);
      setStep('otp');
      setTimer(60);
    } else {
      setError(res.error || 'Failed to dispatch SMS code.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 4) {
      setError('Please enter the 4-digit SMS OTP code.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await verifySMSOTP(userId, phone, otpCode, expectedCode);
    setLoading(false);

    if (res.success) {
      setStep('success');
      setTimeout(() => {
        onVerified?.(phone);
        onClose();
      }, 1500);
    } else {
      setError(res.error || 'Invalid OTP code.');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-dark-surface border border-white/15 rounded-3xl p-6 shadow-2xl animate-scale-in relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-white leading-tight">Phone Verification</h3>
              <p className="text-[11px] text-charcoal-light font-medium">Morocco SMS Security (+212)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-charcoal-light hover:text-white font-bold text-xs">
            Close
          </button>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-xl mb-4 text-[12px] font-bold flex items-center gap-2 animate-fade-in">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {step === 'input' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-charcoal-light uppercase tracking-wider block mb-1.5">
                Moroccan Phone Number
              </label>
              <div className="flex gap-2">
                <div className="bg-dark/80 border border-white/10 px-3.5 py-3 rounded-xl text-[13px] font-mono text-accent font-bold flex items-center">
                  🇲🇦 +212
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="6XX XXX XXX"
                  className="input-field flex-1 px-4 py-3 rounded-xl text-[14px] font-mono font-bold tracking-wider"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-accent py-3.5 rounded-xl text-[13px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send SMS Verification Code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerify} className="space-y-4 animate-fade-in">
            <div className="bg-dark/60 rounded-2xl p-4 border border-white/10 text-center">
              <KeyRound size={28} className="text-accent mx-auto mb-2 animate-pulse" />
              <p className="text-[13px] font-bold text-white mb-1">Enter 4-Digit Security Code</p>
              <p className="text-[11px] text-charcoal-light">Code sent via SMS to <span className="text-accent font-mono">{phone}</span></p>
              {expectedCode && (
                <div className="mt-2 text-[11px] bg-accent/15 border border-accent/30 text-accent font-mono py-1 px-2 rounded-lg inline-block font-bold">
                  Demo SMS Code: {expectedCode}
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                maxLength={4}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • •"
                className="input-field w-full text-center text-[24px] font-mono font-black tracking-[0.5em] py-3 rounded-2xl focus:border-accent"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-accent py-3.5 rounded-xl text-[13px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify Code'}
            </button>

            <div className="text-center pt-2">
              {timer > 0 ? (
                <span className="text-[11px] text-charcoal-light font-medium">Resend SMS code in {timer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-[12px] font-bold text-accent hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <RefreshCw size={12} /> Resend SMS Code
                </button>
              )}
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="py-8 text-center animate-scale-in">
            <CheckCircle size={48} className="text-accent mx-auto mb-3 shadow-[0_0_20px_rgba(0,255,135,0.4)] rounded-full" />
            <h4 className="text-[18px] font-black text-white mb-1">Phone Verified!</h4>
            <p className="text-[12px] text-charcoal-light font-medium">Your Moroccan number is now linked & verified.</p>
          </div>
        )}
      </div>
    </div>
  );
}
