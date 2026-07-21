import { supabase } from '../utils/supabaseClient';

// Fetch wallet summary for a user
export async function fetchWalletSummary(userId) {
  if (!userId) return null;

  try {
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('wallet_balance, escrow_balance, earnings, spent, bank_rib, bank_name, name')
      .eq('id', userId)
      .maybeSingle();

    if (profErr) console.error('fetchWalletSummary profile error:', profErr);

    const { data: transactions, error: txErr } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (txErr) console.error('fetchWalletSummary tx error:', txErr);

    return {
      walletBalance: Number(profile?.wallet_balance || 0),
      escrowBalance: Number(profile?.escrow_balance || 0),
      totalEarnings: Number(profile?.earnings || 0),
      totalSpent: Number(profile?.spent || 0),
      bankRib: profile?.bank_rib || '',
      bankName: profile?.bank_name || '',
      userName: profile?.name || '',
      transactions: transactions || [],
    };
  } catch (err) {
    console.error('fetchWalletSummary error:', err);
    return null;
  }
}

// Client top up wallet
export async function topUpWallet({ userId, amount, paymentMethod = 'Card (CMI)' }) {
  if (!userId || !amount || amount <= 0) return null;

  try {
    // 1. Get current balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', userId)
      .maybeSingle();

    const currentBal = Number(profile?.wallet_balance || 0);
    const newBal = currentBal + Number(amount);

    // 2. Update profile
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBal })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // 3. Record transaction
    const { data: tx, error: txErr } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'topup',
        amount: Number(amount),
        description: `Top-up via ${paymentMethod}`,
        status: 'completed',
      })
      .select()
      .single();

    if (txErr) console.error('topUpWallet tx log error:', txErr);

    return { success: true, newBalance: newBal, transaction: tx };
  } catch (err) {
    console.error('topUpWallet error:', err);
    return null;
  }
}

// Runner request bank payout (RIB)
export async function createPayoutRequest({ runnerId, amount, bankName, ribNumber, accountHolder }) {
  if (!runnerId || !amount || amount <= 0 || !ribNumber) return null;

  try {
    // Save bank RIB info to profile for convenience
    await supabase
      .from('profiles')
      .update({ bank_rib: ribNumber, bank_name: bankName })
      .eq('id', runnerId);

    // Insert payout request
    const { data: req, error: reqErr } = await supabase
      .from('payout_requests')
      .insert({
        runner_id: runnerId,
        amount: Number(amount),
        bank_name: bankName,
        rib_number: ribNumber,
        account_holder: accountHolder,
        status: 'pending',
      })
      .select()
      .single();

    if (reqErr) throw reqErr;

    // Record pending transaction log
    await supabase.from('wallet_transactions').insert({
      user_id: runnerId,
      type: 'payout',
      amount: -Number(amount),
      description: `Withdrawal Request to ${bankName} (${ribNumber.slice(-4)})`,
      status: 'pending',
    });

    return req;
  } catch (err) {
    console.error('createPayoutRequest error:', err);
    return null;
  }
}

// Fetch user's payout requests
export async function fetchUserPayoutRequests(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('runner_id', userId)
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchUserPayoutRequests error:', error); return []; }
  return data || [];
}

// Admin: Fetch all payout requests
export async function fetchAllPayoutRequests() {
  try {
    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) { console.error('fetchAllPayoutRequests error:', error); return []; }

    // Join runner profiles manually
    if (data && data.length > 0) {
      const runnerIds = [...new Set(data.map(r => r.runner_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, phone, earnings, wallet_balance')
        .in('id', runnerIds);

      const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

      return data.map(req => ({
        ...req,
        runner: profileMap[req.runner_id] || { name: 'Unknown Runner' },
      }));
    }

    return data || [];
  } catch (err) {
    console.error('fetchAllPayoutRequests error:', err);
    return [];
  }
}

// Admin: Approve Payout Request
export async function approvePayoutRequest({ requestId, adminId }) {
  if (!requestId) return null;

  try {
    // 1. Get request info
    const { data: req } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (!req) throw new Error('Payout request not found');

    // 2. Update status
    const { data: updated, error: updateErr } = await supabase
      .from('payout_requests')
      .update({
        status: 'approved',
        processed_by: adminId,
        processed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 3. Update pending wallet transaction status to completed
    await supabase
      .from('wallet_transactions')
      .update({ status: 'completed' })
      .eq('user_id', req.runner_id)
      .eq('type', 'payout')
      .eq('status', 'pending');

    // 4. Log admin audit entry
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      action: 'APPROVE_PAYOUT',
      details: { requestId, runnerId: req.runner_id, amount: req.amount },
    });

    return updated;
  } catch (err) {
    console.error('approvePayoutRequest error:', err);
    return null;
  }
}

// Admin: Reject Payout Request
export async function rejectPayoutRequest({ requestId, adminId, reason }) {
  if (!requestId) return null;

  try {
    const { data: updated, error: updateErr } = await supabase
      .from('payout_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'Information mismatch',
        processed_by: adminId,
        processed_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return updated;
  } catch (err) {
    console.error('rejectPayoutRequest error:', err);
    return null;
  }
}
