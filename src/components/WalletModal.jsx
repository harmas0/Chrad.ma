import { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Plus, 
  Check, 
  Building2, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import Modal from './Modal';
import { fetchWalletSummary, topUpWallet, createPayoutRequest, fetchUserPayoutRequests } from '../data/walletApi';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../utils/i18n';

const MOROCCAN_BANKS = [
  'Attijariwafa Bank',
  'Banque Populaire (BCP)',
  'Bank of Africa (BMCE)',
  'CIH Bank',
  'Crédit Agricole du Maroc',
  'Société Générale Maroc',
  'CFG Bank',
  'Al Barid Bank',
];

const PRESET_AMOUNTS = [100, 200, 500, 1000];

export default function WalletModal({ isOpen, onClose }) {
  const { user, isRunner } = useAuth();
  const { t, formatPrice } = useI18n();

  const [activeTab, setActiveTab] = useState(isRunner ? 'cashout' : 'topup');
  const [summary, setSummary] = useState(null);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Top-Up Form State
  const [topUpAmount, setTopUpAmount] = useState(200);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card (CMI)');
  const [topUpSuccess, setTopUpSuccess] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);

  // Cashout Form State
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [bankName, setBankName] = useState('Attijariwafa Bank');
  const [accountHolder, setAccountHolder] = useState('');
  const [ribNumber, setRibNumber] = useState('');
  const [cashoutSuccess, setCashoutSuccess] = useState('');
  const [cashoutError, setCashoutError] = useState('');
  const [cashoutLoading, setCashoutLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadData();
    }
  }, [isOpen, user?.id]);

  async function loadData() {
    setLoading(true);
    const data = await fetchWalletSummary(user.id);
    setSummary(data);
    if (data?.bankRib) setRibNumber(data.bankRib);
    if (data?.bankName) setBankName(data.bankName);
    if (data?.userName) setAccountHolder(data.userName);

    const reqs = await fetchUserPayoutRequests(user.id);
    setPayoutRequests(reqs);
    setLoading(false);
  }

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const finalAmount = Number(customAmount || topUpAmount);
    if (!finalAmount || finalAmount <= 0) return;

    setTopUpLoading(true);
    setTopUpSuccess('');

    const res = await topUpWallet({
      userId: user.id,
      amount: finalAmount,
      paymentMethod,
    });

    if (res?.success) {
      setTopUpSuccess(`Successfully added ${formatPrice(finalAmount)} to your wallet!`);
      setCustomAmount('');
      loadData();
    }
    setTopUpLoading(false);
  };

  const handleCashoutSubmit = async (e) => {
    e.preventDefault();
    setCashoutError('');
    setCashoutSuccess('');

    const amountNum = Number(cashoutAmount);
    if (!amountNum || amountNum <= 0) {
      setCashoutError('Please enter a valid withdrawal amount.');
      return;
    }

    if (ribNumber.length < 16) {
      setCashoutError('Please enter a valid 24-digit Moroccan RIB number.');
      return;
    }

    setCashoutLoading(true);

    const req = await createPayoutRequest({
      runnerId: user.id,
      amount: amountNum,
      bankName,
      ribNumber,
      accountHolder: accountHolder || summary?.userName || 'Runner Account',
    });

    if (req) {
      setCashoutSuccess('Withdrawal request submitted! Admin will process payout to your RIB.');
      setCashoutAmount('');
      loadData();
    } else {
      setCashoutError('Failed to submit payout request. Please try again.');
    }

    setCashoutLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('wallet') || 'My Wallet & Transactions'}>
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-charcoal-light font-bold">{t('loading_wallet_details')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Balance Cards Header */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel p-4 rounded-2xl border border-accent/30 bg-accent/5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={16} className="text-accent" />
                <span className="text-[11px] font-bold text-charcoal-light uppercase tracking-wider">{t('wallet_balance')}</span>
              </div>
              <p className="text-[22px] font-black text-white font-heading">
                {formatPrice(summary?.walletBalance || 0)}
              </p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-warning/30 bg-warning/5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-warning" />
                <span className="text-[11px] font-bold text-charcoal-light uppercase tracking-wider">{t('escrow_holding')}</span>
              </div>
              <p className="text-[22px] font-black text-warning font-heading">
                {formatPrice(summary?.escrowBalance || 0)}
              </p>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex bg-dark/60 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('topup')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'topup'
                  ? 'bg-accent text-dark shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                  : 'text-charcoal-light hover:text-white'
              }`}
            >
              <Plus size={15} />
              {t('topup_credit')}
            </button>

            {isRunner && (
              <button
                onClick={() => setActiveTab('cashout')}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'cashout'
                    ? 'bg-accent text-dark shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                    : 'text-charcoal-light hover:text-white'
                }`}
              >
                <Building2 size={15} />
                {t('bank_rib_cashout')}
              </button>
            )}

            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-accent text-dark shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                  : 'text-charcoal-light hover:text-white'
              }`}
            >
              <Clock size={15} />
              {t('history')}
            </button>
          </div>

          {/* TAB 1: TOP-UP (CLIENT) */}
          {activeTab === 'topup' && (
            <form onSubmit={handleTopUpSubmit} className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-3">
                  Select Amount (MAD)
                </label>
                <div className="grid grid-cols-4 gap-2.5 mb-3">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => {
                        setTopUpAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-3 rounded-xl text-[14px] font-black transition-all border ${
                        topUpAmount === amt && !customAmount
                          ? 'bg-accent text-dark border-accent shadow-[0_0_12px_rgba(0,255,135,0.3)]'
                          : 'bg-dark/40 text-white border-white/10 hover:border-white/20'
                      }`}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder={t('or_enter_custom_amount')}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-dark/60 border border-white/10 rounded-2xl p-3.5 text-[14px] text-white placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-2">
                  {t('payment_method')}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {['Card (CMI)', 'Cash on Delivery (COD)'].map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-xl text-[12px] font-bold border flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === method
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'bg-dark/40 border-white/10 text-charcoal-light hover:border-white/20'
                      }`}
                    >
                      <CreditCard size={16} />
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {topUpSuccess && (
                <div className="p-3.5 rounded-xl bg-accent/15 border border-accent/30 text-accent text-[12px] font-bold flex items-center gap-2">
                  <Check size={16} />
                  {topUpSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={topUpLoading}
                className="w-full py-4 rounded-2xl bg-accent text-dark font-heading font-black text-[15px] uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,135,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {topUpLoading ? (
                  <span>{t('processing')}</span>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>{t('topup_wallet')}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: CASHOUT (RUNNER RIB) */}
          {activeTab === 'cashout' && (
            <form onSubmit={handleCashoutSubmit} className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-dark/60 border border-white/10 text-[12px] text-charcoal-light space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-accent" />
                  {t('moroccan_rib_bank_transfer')}
                </p>
                <p>{t('withdrawals_are_processed_directly_')}</p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-1.5">
                  Withdrawal Amount (MAD)
                </label>
                <input
                  type="number"
                  placeholder={t('eg_500')}
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                  className="w-full bg-dark/60 border border-white/10 rounded-2xl p-3.5 text-[14px] text-white placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-1.5">
                  {t('bank_name')}
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-dark/60 border border-white/10 rounded-2xl p-3.5 text-[14px] text-white focus:border-accent focus:outline-none"
                >
                  {MOROCCAN_BANKS.map((b) => (
                    <option key={b} value={b} className="bg-dark text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-1.5">
                  {t('account_holder_name')}
                </label>
                <input
                  type="text"
                  placeholder={t('full_name_as_on_bank_account')}
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full bg-dark/60 border border-white/10 rounded-2xl p-3.5 text-[14px] text-white placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-1.5">
                  {t('24digit_rib_number')}
                </label>
                <input
                  type="text"
                  placeholder={t('eg_230_780_0000000000000000_00')}
                  value={ribNumber}
                  onChange={(e) => setRibNumber(e.target.value)}
                  className="w-full bg-dark/60 border border-white/10 rounded-2xl p-3.5 text-[14px] text-white font-mono placeholder:text-muted focus:border-accent focus:outline-none"
                />
              </div>

              {cashoutError && (
                <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-[12px] font-bold flex items-center gap-2">
                  <AlertCircle size={16} />
                  {cashoutError}
                </div>
              )}

              {cashoutSuccess && (
                <div className="p-3.5 rounded-xl bg-accent/15 border border-accent/30 text-accent text-[12px] font-bold flex items-center gap-2">
                  <Check size={16} />
                  {cashoutSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={cashoutLoading}
                className="w-full py-4 rounded-2xl bg-accent text-dark font-heading font-black text-[15px] uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,135,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cashoutLoading ? (
                  <span>{t('submitting_request')}</span>
                ) : (
                  <>
                    <Building2 size={18} />
                    <span>{t('submit_cashout_request')}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: TRANSACTION & PAYOUT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar animate-fade-in">
              <h4 className="text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-2">
                {t('recent_activity')}
              </h4>
              {summary?.transactions?.length === 0 && payoutRequests?.length === 0 ? (
                <div className="py-8 text-center text-charcoal-light text-[13px] font-bold">
                  {t('no_transaction_history_yet')}
                </div>
              ) : (
                <>
                  {payoutRequests.map((req) => (
                    <div key={req.id} className="p-3.5 rounded-2xl bg-dark/60 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-warning/20 text-warning flex items-center justify-center shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white leading-tight">
                            Cashout to {req.bank_name}
                          </p>
                          <p className="text-[10px] text-muted font-mono">
                            RIB: ****{req.rib_number.slice(-4)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-black text-warning">-{formatPrice(req.amount)}</p>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          req.status === 'approved' ? 'bg-accent/15 border-accent/30 text-accent' :
                          req.status === 'rejected' ? 'bg-danger/15 border-danger/30 text-danger' :
                          'bg-warning/15 border-warning/30 text-warning'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {summary?.transactions?.map((tx) => (
                    <div key={tx.id} className="p-3.5 rounded-2xl bg-dark/40 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.amount > 0 ? 'bg-accent/20 text-accent' : 'bg-danger/20 text-danger'
                        }`}>
                          {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white leading-tight">
                            {tx.description || tx.type}
                          </p>
                          <p className="text-[10px] text-muted">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[14px] font-black ${tx.amount > 0 ? 'text-accent' : 'text-danger'}`}>
                          {tx.amount > 0 ? `+${formatPrice(tx.amount)}` : formatPrice(tx.amount)}
                        </p>
                        <span className="text-[10px] font-bold text-muted uppercase">{tx.status}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
