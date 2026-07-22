import { useState } from 'react';
import { CreditCard, ShieldCheck, Lock, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useI18n } from '../utils/i18n';
import { topUpWallet } from '../data/walletApi';

export default function PaymentCheckoutModal({ isOpen, onClose, userId, amount, onSuccess }) {
  const { t } = useI18n();
  const { t, formatPrice } = useI18n();
  const [gateway, setGateway] = useState('cmi'); // 'cmi' or 'stripe'
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paidSuccess, setPaidSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setError('Please specify a valid top-up amount.');
      return;
    }

    if (gateway === 'stripe' && (!cardNumber || !expiry || !cvv)) {
      setError('Please complete all card payment fields.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Simulate gateway authorization handshake (CMI / Stripe Tokenization)
      await new Promise((res) => setTimeout(res, 1800));

      const paymentMethodName = gateway === 'cmi' ? 'CMI Moroccan Interbank Gateway' : 'Stripe Global Card';
      
      const result = await topUpWallet({
        userId,
        amount: Number(amount),
        paymentMethod: paymentMethodName,
      });

      if (!result || !result.success) {
        throw new Error('Payment processing failed. Please check your card details or try again.');
      }

      setPaidSuccess(true);
      setTimeout(() => {
        setPaidSuccess(false);
        setProcessing(false);
        onSuccess?.(result.newBalance);
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.message || 'Payment transaction failed.');
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-dark-surface border border-white/15 rounded-3xl p-6 shadow-2xl animate-scale-in relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        {paidSuccess ? (
          <div className="py-10 text-center flex flex-col items-center justify-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center text-accent mb-4 shadow-[0_0_30px_rgba(0,255,135,0.4)] animate-bounce-in">
              <CheckCircle size={44} strokeWidth={2.5} />
            </div>
            <h3 className="text-[22px] font-black text-white mb-2">Payment Authorized!</h3>
            <p className="text-[14px] text-accent font-bold">
              +{formatPrice(amount)} Credited to Wallet
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-black text-white leading-tight">Checkout Payment</h3>
                  <p className="text-[11px] text-charcoal-light font-medium">Secured SSL 256-bit Encryption</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-charcoal-light hover:text-white font-bold text-[13px] px-2 py-1"
              >
                {t('cancel')}
              </button>
            </div>

            {/* Amount Banner */}
            <div className="bg-dark/80 rounded-2xl p-4 border border-white/10 mb-5 flex items-center justify-between">
              <span className="text-[12px] font-bold text-charcoal-light uppercase tracking-wider">Top-Up Total</span>
              <span className="text-[24px] font-black text-accent">{formatPrice(amount)}</span>
            </div>

            {/* Gateway Selector */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                type="button"
                onClick={() => setGateway('cmi')}
                className={`py-3 px-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  gateway === 'cmi'
                    ? 'bg-accent/15 border-accent text-white shadow-[0_0_15px_rgba(0,255,135,0.2)]'
                    : 'bg-dark/50 border-white/10 text-charcoal-light hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-extrabold uppercase tracking-wider">CMI Maroc</span>
                  {gateway === 'cmi' && <CheckCircle size={14} className="text-accent" />}
                </div>
                <span className="text-[10px] text-charcoal-light font-medium">Moroccan Interbank Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setGateway('stripe')}
                className={`py-3 px-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  gateway === 'stripe'
                    ? 'bg-accent/15 border-accent text-white shadow-[0_0_15px_rgba(0,255,135,0.2)]'
                    : 'bg-dark/50 border-white/10 text-charcoal-light hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-extrabold uppercase tracking-wider">Stripe Card</span>
                  {gateway === 'stripe' && <CheckCircle size={14} className="text-accent" />}
                </div>
                <span className="text-[10px] text-charcoal-light font-medium">Visa / MasterCard / AMEX</span>
              </button>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-xl mb-4 text-[12px] font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Payment Form */}
            <form onSubmit={handlePay} className="space-y-4">
              {gateway === 'cmi' ? (
                <div className="bg-dark/40 rounded-2xl p-4 border border-white/10 text-center">
                  <div className="w-12 h-12 rounded-full bg-info/10 border border-info/30 flex items-center justify-center text-info mx-auto mb-2">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="text-[14px] font-bold text-white mb-1">Centre Monétique Interbancaire</h4>
                  <p className="text-[12px] text-charcoal-light leading-relaxed">
                    You will be securely routed to CMI 3D-Secure authentication (Attijariwafa, BMCE, BCP, CIH Bank).
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-charcoal-light uppercase tracking-wider block mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="e.g. MOHAMMED BENALI"
                      className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-semibold uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-charcoal-light uppercase tracking-wider block mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      placeholder="4000 0000 0000 0000"
                      className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-mono tracking-widest"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-charcoal-light uppercase tracking-wider block mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="12/28"
                        className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-mono text-center"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-charcoal-light uppercase tracking-wider block mb-1">CVV Security</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="•••"
                        className="input-field w-full px-4 py-3 rounded-xl text-[13px] font-mono text-center"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full btn-accent py-4 rounded-2xl text-[14px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(0,255,135,0.35)] mt-2"
              >
                {processing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Authorizing Payment...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Pay {formatPrice(amount)} Now
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
