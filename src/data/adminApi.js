import { supabase } from '../utils/supabaseClient';
import { fetchPlatformSettings } from './settingsApi';

// =============================================
// DASHBOARD STATS
// =============================================

export async function fetchDashboardStats() {
  const [
    { count: totalUsers },
    { count: activeRunners },
    { count: pendingKyc },
    { count: openDisputes },
    { count: todayTasks },
    { count: bannedUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_runner', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
    supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
  ]);

  return {
    totalUsers: totalUsers || 0,
    activeRunners: activeRunners || 0,
    pendingKyc: pendingKyc || 0,
    openDisputes: openDisputes || 0,
    todayTasks: todayTasks || 0,
    bannedUsers: bannedUsers || 0,
  };
}

// =============================================
// USER MANAGEMENT
// =============================================

export async function fetchAllUsers(search = '', filter = {}) {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (filter.role) {
    query = query.eq('role', filter.role);
  }
  if (filter.kyc_status) {
    query = query.eq('kyc_status', filter.kyc_status);
  }
  if (filter.is_banned !== undefined) {
    query = query.eq('is_banned', filter.is_banned);
  }

  const { data, error } = await query;
  if (error) { console.error('fetchAllUsers error:', error); return []; }
  return data;
}

export async function banUser(userId, reason, adminId) {
  const { error } = await supabase.from('profiles').update({
    is_banned: true,
    ban_reason: reason,
    banned_at: new Date().toISOString(),
    banned_by: adminId,
  }).eq('id', userId);

  if (error) { console.error('banUser error:', error); return false; }

  await logAdminAction(adminId, 'BAN_USER', 'user', userId, { reason });
  return true;
}

export async function unbanUser(userId, adminId) {
  const { error } = await supabase.from('profiles').update({
    is_banned: false,
    ban_reason: null,
    banned_at: null,
    banned_by: null,
  }).eq('id', userId);

  if (error) { console.error('unbanUser error:', error); return false; }

  await logAdminAction(adminId, 'UNBAN_USER', 'user', userId, {});
  return true;
}

export async function updateUserRole(userId, newRole, adminId) {
  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
  if (error) { console.error('updateUserRole error:', error); return false; }

  await logAdminAction(adminId, 'CHANGE_ROLE', 'user', userId, { newRole });
  return true;
}

// =============================================
// KYC MANAGEMENT
// =============================================

export async function fetchPendingKYC() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('kyc_status', 'pending')
    .order('kyc_submitted_at', { ascending: true });

  if (error) { console.error('fetchPendingKYC error:', error); return []; }
  return data;
}

export async function fetchAllKYC(status = null) {
  let query = supabase.from('profiles')
    .select('*')
    .neq('kyc_status', 'none')
    .order('kyc_submitted_at', { ascending: false });

  if (status) {
    query = query.eq('kyc_status', status);
  }

  const { data, error } = await query;
  if (error) { console.error('fetchAllKYC error:', error); return []; }
  return data;
}

export async function approveKYC(userId, adminId) {
  const { error } = await supabase.from('profiles').update({
    kyc_status: 'approved',
    verified: true,
    kyc_reviewed_at: new Date().toISOString(),
    kyc_reviewer_id: adminId,
    kyc_rejection_reason: null,
  }).eq('id', userId);

  if (error) { console.error('approveKYC error:', error); return false; }

  await logAdminAction(adminId, 'APPROVE_KYC', 'user', userId, {});
  return true;
}

export async function rejectKYC(userId, reason, adminId) {
  const { error } = await supabase.from('profiles').update({
    kyc_status: 'rejected',
    verified: false,
    kyc_reviewed_at: new Date().toISOString(),
    kyc_reviewer_id: adminId,
    kyc_rejection_reason: reason,
  }).eq('id', userId);

  if (error) { console.error('rejectKYC error:', error); return false; }

  await logAdminAction(adminId, 'REJECT_KYC', 'user', userId, { reason });
  return true;
}

// Upload KYC document to Supabase Storage
export async function uploadKYCDocument(userId, file, docType) {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${docType}.${fileExt}`;

  const { error } = await supabase.storage
    .from('kyc-documents')
    .upload(filePath, file, { upsert: true });

  if (error) { console.error('uploadKYCDocument error:', error); return null; }

  const { data: urlData } = supabase.storage
    .from('kyc-documents')
    .getPublicUrl(filePath);

  return urlData?.publicUrl || filePath;
}

// Submit KYC application
export async function submitKYC(userId, idUrl, selfieUrl, vehicleUrl) {
  const settings = await fetchPlatformSettings();
  const isAutoApprove = settings?.autoApproveKYC;

  const { error } = await supabase.from('profiles').update({
    kyc_status: isAutoApprove ? 'approved' : 'pending',
    verified: isAutoApprove ? true : false,
    kyc_reviewed_at: isAutoApprove ? new Date().toISOString() : null,
    kyc_id_url: idUrl,
    kyc_selfie_url: selfieUrl,
    kyc_vehicle_url: vehicleUrl || null,
    kyc_submitted_at: new Date().toISOString(),
  }).eq('id', userId);

  if (error) { console.error('submitKYC error:', error); return false; }
  return true;
}

// Get signed URL for private KYC document
export async function getKYCDocumentUrl(filePath) {
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) { console.error('getKYCDocumentUrl error:', error); return null; }
  return data?.signedUrl;
}

// =============================================
// DISPUTE MANAGEMENT
// =============================================

export async function fetchDisputes(statusFilter = null) {
  let query = supabase.from('disputes').select('*').order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) { console.error('fetchDisputes error:', error); return []; }
  return data;
}

export async function fetchDisputeById(id) {
  const { data, error } = await supabase.from('disputes').select('*').eq('id', id).single();
  if (error) { console.error('fetchDisputeById error:', error); return null; }
  return data;
}

export async function createDispute(disputeData) {
  const { data, error } = await supabase.from('disputes').insert({
    task_id: disputeData.taskId,
    reporter_id: disputeData.reporterId,
    reported_user_id: disputeData.reportedUserId,
    reason: disputeData.reason,
    description: disputeData.description,
    evidence_urls: disputeData.evidenceUrls || [],
    status: 'open',
  }).select().single();

  if (error) { console.error('createDispute error:', error); return null; }
  return data;
}

export async function resolveDispute(disputeId, resolution, adminNotes, adminId) {
  const { error } = await supabase.from('disputes').update({
    status: 'resolved',
    resolution,
    admin_notes: adminNotes,
    resolved_at: new Date().toISOString(),
    resolved_by: adminId,
  }).eq('id', disputeId);

  if (error) { console.error('resolveDispute error:', error); return false; }

  await logAdminAction(adminId, 'RESOLVE_DISPUTE', 'dispute', disputeId, { resolution });
  return true;
}

export async function dismissDispute(disputeId, adminNotes, adminId) {
  const { error } = await supabase.from('disputes').update({
    status: 'dismissed',
    admin_notes: adminNotes,
    resolved_at: new Date().toISOString(),
    resolved_by: adminId,
  }).eq('id', disputeId);

  if (error) { console.error('dismissDispute error:', error); return false; }

  await logAdminAction(adminId, 'DISMISS_DISPUTE', 'dispute', disputeId, { adminNotes });
  return true;
}

export async function updateDisputeStatus(disputeId, status, adminId) {
  const { error } = await supabase.from('disputes').update({ status }).eq('id', disputeId);
  if (error) { console.error('updateDisputeStatus error:', error); return false; }

  await logAdminAction(adminId, 'UPDATE_DISPUTE_STATUS', 'dispute', disputeId, { status });
  return true;
}

// =============================================
// AUDIT LOG
// =============================================

export async function fetchAuditLog(limit = 50) {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('fetchAuditLog error:', error); return []; }
  return data;
}

export async function logAdminAction(adminId, action, targetType, targetId, details = {}) {
  const { error } = await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  });

  if (error) { console.error('logAdminAction error:', error); }
}
