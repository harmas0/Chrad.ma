import { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Building2, 
  Wallet, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Ban, 
  Shield, 
  Plus, 
  Minus,
  FileText,
  Phone,
  Mail
} from 'lucide-react';
import Modal from './Modal';
import { supabase } from '../utils/supabaseClient';
import { banUser, unbanUser, updateUserRole, logAdminAction } from '../data/adminApi';
import { topUpWallet } from '../data/walletApi';
import { useAuth } from '../context/AuthContext';

export default function AdminUserInspectModal({ isOpen, onClose, userId, onRefresh }) {
  const { user: currentAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Wallet adjustment state
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Ban modal state
  const [banReasonInput, setBanReasonInput] = useState('');
  const [showBanConfirm, setShowBanConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile();
    }
  }, [isOpen, userId]);

  async function loadProfile() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error) setProfile(data);
    setLoading(false);
  }

  const handleWalletAdjust = async (isCredit) => {
    const amt = Number(adjustAmount);
    if (!amt || amt <= 0) return;

    setAdjustLoading(true);
    const finalAmount = isCredit ? amt : -amt;

    const currentBal = Number(profile.wallet_balance || 0);
    const newBal = currentBal + finalAmount;

    await supabase
      .from('profiles')
      .update({ wallet_balance: newBal })
      .eq('id', userId);

    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: isCredit ? 'topup' : 'payout',
      amount: finalAmount,
      description: `Admin Manual Adjustment: ${adjustReason || 'System Correction'}`,
      status: 'completed',
    });

    await logAdminAction(currentAdmin.id, 'ADJUST_WALLET_BALANCE', 'user', userId, {
      previousBalance: currentBal,
      newBalance: newBal,
      amount: finalAmount,
      reason: adjustReason,
    });

    alert(`Successfully ${isCredit ? 'added' : 'deducted'} ${Math.abs(finalAmount)} MAD!`);
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustLoading(false);
    loadProfile();
    if (onRefresh) onRefresh();
  };

  const handleBanToggle = async () => {
    if (profile.is_banned) {
      await unbanUser(userId, currentAdmin.id);
      alert('User unbanned successfully.');
    } else {
      if (!banReasonInput.trim()) {
        alert('Please enter a reason for banning this user.');
        return;
      }
      await banUser(userId, banReasonInput, currentAdmin.id);
      alert('User banned successfully.');
    }
    setShowBanConfirm(false);
    loadProfile();
    if (onRefresh) onRefresh();
  };

  const handleRoleChange = async (newRole) => {
    await updateUserRole(userId, newRole, currentAdmin.id);
    alert(`Role updated to ${newRole}`);
    loadProfile();
    if (onRefresh) onRefresh();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admin User Inspector & Controls">
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px] text-charcoal-light font-bold">Loading user records...</p>
        </div>
      ) : !profile ? (
        <div className="py-8 text-center text-charcoal-light font-bold">User profile not found.</div>
      ) : (
        <div className="space-y-5 animate-fade-in">
          {/* User Header */}
          <div className="flex items-center gap-4 p-4 rounded-3xl bg-dark/60 border border-white/10 relative overflow-hidden">
            <img
              src={profile.avatar || profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`}
              alt={profile.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-accent/40 shadow-md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-heading font-black text-white text-[17px] truncate">{profile.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                  profile.role === 'admin' ? 'bg-danger/15 border-danger/30 text-danger' :
                  profile.is_runner ? 'bg-accent/15 border-accent/30 text-accent' :
                  'bg-info/15 border-info/30 text-info'
                }`}>
                  {profile.role === 'admin' ? 'Super Admin' : profile.is_runner ? 'Verified Runner' : 'Client'}
                </span>
              </div>
              <p className="text-[12px] text-charcoal-light font-medium flex items-center gap-3">
                <span className="flex items-center gap-1"><Mail size={12} /> {profile.email || 'No Email'}</span>
                {profile.phone && <span className="flex items-center gap-1"><Phone size={12} /> {profile.phone}</span>}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-dark/60 p-1 rounded-2xl border border-white/10 text-[11px] font-bold uppercase">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-accent text-dark font-black' : 'text-charcoal-light'}`}
            >
              Overview & KYC
            </button>
            <button
              onClick={() => setActiveTab('financials')}
              className={`flex-1 py-2 rounded-xl transition-all ${activeTab === 'financials' ? 'bg-accent text-dark font-black' : 'text-charcoal-light'}`}
            >
              Wallet & Bank RIB
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-2 rounded-xl transition-all ${activeTab === 'actions' ? 'bg-accent text-dark font-black' : 'text-charcoal-light'}`}
            >
              Admin Actions
            </button>
          </div>

          {/* TAB 1: OVERVIEW & KYC */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-dark/40 border border-white/5">
                  <span className="text-[10px] text-charcoal-light font-bold uppercase block mb-1">KYC Status</span>
                  <span className={`text-[12px] font-extrabold uppercase ${
                    profile.kyc_status === 'approved' ? 'text-accent' :
                    profile.kyc_status === 'rejected' ? 'text-danger' : 'text-warning'
                  }`}>
                    {profile.kyc_status || 'not_submitted'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-dark/40 border border-white/5">
                  <span className="text-[10px] text-charcoal-light font-bold uppercase block mb-1">Tasks Done</span>
                  <span className="text-[14px] font-black text-white">{profile.completed_tasks || 0}</span>
                </div>

                <div className="p-3 rounded-2xl bg-dark/40 border border-white/5">
                  <span className="text-[10px] text-charcoal-light font-bold uppercase block mb-1">Account State</span>
                  <span className={`text-[12px] font-black uppercase ${profile.is_banned ? 'text-danger' : 'text-accent'}`}>
                    {profile.is_banned ? 'BANNED' : 'Active'}
                  </span>
                </div>
              </div>

              {/* KYC Document Previews */}
              {profile.kyc_id_url && (
                <div className="p-3.5 rounded-2xl bg-dark/40 border border-white/10 space-y-2">
                  <h4 className="text-[12px] font-bold text-white flex items-center gap-1.5">
                    <FileText size={14} className="text-accent" />
                    Uploaded Identity Document
                  </h4>
                  <img
                    src={profile.kyc_id_url}
                    alt="KYC ID"
                    className="w-full h-36 object-cover rounded-xl border border-white/10"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FINANCIALS & WALLET ADJUSTMENT */}
          {activeTab === 'financials' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
                  <span className="text-[11px] font-bold text-charcoal-light uppercase block mb-1">Available Wallet</span>
                  <span className="text-[20px] font-black text-accent">{Number(profile.wallet_balance || 0)} MAD</span>
                </div>

                <div className="p-4 rounded-2xl bg-warning/10 border border-warning/20">
                  <span className="text-[11px] font-bold text-charcoal-light uppercase block mb-1">Escrow Holding</span>
                  <span className="text-[20px] font-black text-warning">{Number(profile.escrow_balance || 0)} MAD</span>
                </div>
              </div>

              {/* Bank RIB Info */}
              <div className="p-4 rounded-2xl bg-dark/40 border border-white/10 space-y-1">
                <p className="text-[12px] font-bold text-white flex items-center gap-1.5">
                  <Building2 size={16} className="text-accent" />
                  Moroccan Bank RIB Details
                </p>
                <p className="text-[12px] text-charcoal-light font-medium">
                  Bank: <strong className="text-white">{profile.bank_name || 'Not provided'}</strong>
                </p>
                <p className="text-[12px] text-charcoal-light font-mono">
                  RIB: <strong className="text-accent">{profile.bank_rib || 'Not provided'}</strong>
                </p>
              </div>

              {/* Wallet Adjustment Form */}
              <div className="p-4 rounded-2xl bg-dark/60 border border-white/10 space-y-3">
                <h4 className="text-[12px] font-bold text-white uppercase tracking-wider">
                  Admin Wallet Balance Adjustment
                </h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount in MAD"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="flex-1 bg-dark/80 border border-white/10 rounded-xl p-2.5 text-[13px] text-white focus:border-accent focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Reason (e.g. Compensation)"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="flex-1 bg-dark/80 border border-white/10 rounded-xl p-2.5 text-[13px] text-white focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWalletAdjust(true)}
                    disabled={adjustLoading}
                    className="flex-1 py-2.5 rounded-xl bg-accent text-dark font-extrabold text-[12px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-md hover:scale-105 transition-all"
                  >
                    <Plus size={14} /> Credit Wallet
                  </button>
                  <button
                    onClick={() => handleWalletAdjust(false)}
                    disabled={adjustLoading}
                    className="flex-1 py-2.5 rounded-xl bg-danger/20 border border-danger/30 text-danger font-extrabold text-[12px] uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-danger/30 transition-colors"
                  >
                    <Minus size={14} /> Deduct Wallet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADMIN ACTIONS */}
          {activeTab === 'actions' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-[12px] font-bold text-charcoal-light uppercase tracking-wider mb-2">
                  Change Account Role
                </label>
                <select
                  value={profile.role || (profile.is_runner ? 'runner' : 'client')}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-dark/60 border border-white/10 rounded-2xl p-3.5 text-[13px] text-white focus:border-accent focus:outline-none"
                >
                  <option value="client" className="bg-dark text-white">Client (Standard User)</option>
                  <option value="runner" className="bg-dark text-white">Runner (Task Executor)</option>
                  <option value="admin" className="bg-dark text-white">Super Admin</option>
                </select>
              </div>

              {/* Ban / Unban Section */}
              <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 space-y-3">
                <h4 className="text-[13px] font-black text-danger uppercase tracking-wider flex items-center gap-1.5">
                  <Ban size={16} />
                  Account Ban Status
                </h4>
                {profile.is_banned ? (
                  <div>
                    <p className="text-[12px] text-danger mb-3">
                      Reason: "{profile.ban_reason || 'Administrative decision'}"
                    </p>
                    <button
                      onClick={handleBanToggle}
                      className="w-full py-3 rounded-xl bg-accent text-dark font-black text-[12px] uppercase tracking-wider"
                    >
                      Unban User Account
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Specify ban reason..."
                      value={banReasonInput}
                      onChange={(e) => setBanReasonInput(e.target.value)}
                      className="w-full bg-dark/80 border border-danger/30 rounded-xl p-3 text-[12px] text-white placeholder:text-muted mb-3 focus:outline-none"
                    />
                    <button
                      onClick={handleBanToggle}
                      className="w-full py-3 rounded-xl bg-danger text-white font-black text-[12px] uppercase tracking-wider hover:scale-[1.01] transition-all"
                    >
                      Ban User Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
