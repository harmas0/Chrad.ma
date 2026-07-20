import { supabase } from '../utils/supabaseClient';

// Helper to convert DB row to UI shape
function rowToBid(row, profile) {
  return {
    id: row.id,
    taskId: row.task_id,
    runnerId: row.runner_id,
    runnerName: profile?.name || 'Unknown',
    runnerInitials: profile?.initials || '??',
    runnerRating: profile?.rating ? Number(profile.rating) : 0,
    runnerCompletedTasks: profile?.completed_tasks || 0,
    proposedPrice: Number(row.proposed_price),
    eta: row.eta,
    message: row.message,
    createdAt: row.created_at,
    status: row.status,
  };
}

// Fetch bids for a task, joining profile info for the runner
export async function fetchBidsForTask(taskId) {
  const { data, error } = await supabase
    .from('bids')
    .select('*, profiles:runner_id(*)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) { console.error('fetchBidsForTask error:', error); return []; }
  return data.map(row => rowToBid(row, row.profiles));
}

// Fetch a single bid by ID
export async function fetchBidById(id) {
  const { data, error } = await supabase
    .from('bids')
    .select('*, profiles:runner_id(*)')
    .eq('id', id)
    .single();
  if (error) { console.error('fetchBidById error:', error); return null; }
  return rowToBid(data, data.profiles);
}

// Create a new bid
export async function createBid(bidData) {
  const id = `bid-${Date.now()}`;
  const row = {
    id,
    task_id: bidData.taskId,
    runner_id: bidData.runnerId,
    proposed_price: bidData.proposedPrice,
    eta: bidData.eta,
    message: bidData.message,
    status: 'pending',
  };
  const { data, error } = await supabase.from('bids').insert(row).select('*, profiles:runner_id(*)').single();
  if (error) { console.error('createBid error:', error); return null; }
  return rowToBid(data, data.profiles);
}

// Update bid status (accept / reject)
export async function updateBidStatus(bidId, status) {
  const { data, error } = await supabase
    .from('bids')
    .update({ status })
    .eq('id', bidId)
    .select('*, profiles:runner_id(*)')
    .single();
  if (error) { console.error('updateBidStatus error:', error); return null; }
  return rowToBid(data, data.profiles);
}

// Update bid price and message for counter-offers
export async function updateBidPriceAndMessage(bidId, price, message) {
  const { data, error } = await supabase
    .from('bids')
    .update({ proposed_price: price, message })
    .eq('id', bidId)
    .select('*, profiles:runner_id(*)')
    .single();
  if (error) { console.error('updateBidPriceAndMessage error:', error); return null; }
  return rowToBid(data, data.profiles);
}

// Count bids for a task
export async function countBidsForTask(taskId) {
  const { count, error } = await supabase
    .from('bids')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', taskId);
  if (error) { console.error('countBidsForTask error:', error); return 0; }
  return count || 0;
}

// Delete / withdraw a bid
export async function deleteBid(bidId) {
  const { error } = await supabase
    .from('bids')
    .delete()
    .eq('id', bidId);
  if (error) { console.error('deleteBid error:', error); return false; }
  return true;
}
