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

// =============================================
// FINANCIAL STATS & PAYOUTS
// =============================================

export async function fetchFinancialStats() {
  // Fetch tasks, categories, and disputes
  const [
    { data: tasks, error: tasksErr },
    { data: categories, error: catsErr },
    { data: disputes, error: dispErr },
    settings
  ] = await Promise.all([
    supabase.from('tasks').select('*'),
    supabase.from('task_categories').select('*'),
    supabase.from('disputes').select('*').eq('status', 'open'),
    fetchPlatformSettings(),
  ]);

  if (tasksErr) { console.error('fetchFinancialStats tasks error:', tasksErr); return null; }

  const catCommissionMap = {};
  (categories || []).forEach(cat => {
    catCommissionMap[cat.id] = Number(cat.commission_rate || 10);
  });

  const getCommissionRate = (category) => {
    return catCommissionMap[category] !== undefined ? catCommissionMap[category] : Number(settings?.platformFeePercent || 10);
  };

  let totalGMV = 0;
  let totalCommissions = 0;
  let escrowHoldings = 0;
  let disputedFunds = 0;
  const payoutQueue = [];

  const disputeTaskIds = new Set((disputes || []).map(d => d.task_id));

  (tasks || []).forEach(task => {
    const price = Number(task.offered_price || 0);
    const budget = Number(task.item_budget || 0);
    const rate = getCommissionRate(task.category);

    const taskGMV = price + budget;
    const taskCommission = price * (rate / 100);

    if (['delivered', 'confirmed', 'completed'].includes(task.status)) {
      totalGMV += taskGMV;
      totalCommissions += taskCommission;

      if (!task.runner_paid && task.accepted_runner_id) {
        payoutQueue.push({
          id: task.id,
          title: task.title,
          runnerId: task.accepted_runner_id,
          amount: price - taskCommission,
          createdAt: task.created_at,
          status: task.status,
        });
      }
    } else if (['accepted', 'picked_up', 'en_route'].includes(task.status)) {
      escrowHoldings += taskGMV;

      if (disputeTaskIds.has(task.id)) {
        disputedFunds += taskGMV;
      }
    }
  });

  // Build chart data (grouped by date)
  const dailyRevenue = {};
  (tasks || []).forEach(task => {
    if (['delivered', 'confirmed', 'completed'].includes(task.status) && task.created_at) {
      const dateStr = new Date(task.created_at).toISOString().split('T')[0];
      const price = Number(task.offered_price || 0);
      const rate = getCommissionRate(task.category);
      const commission = price * (rate / 100);

      dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + commission;
    }
  });

  const chartData = Object.keys(dailyRevenue)
    .sort()
    .slice(-14) // Last 14 days
    .map(date => ({
      date,
      revenue: Math.round(dailyRevenue[date] * 100) / 100,
    }));

  return {
    totalGMV,
    totalCommissions,
    escrowHoldings,
    disputedFunds,
    payoutQueue,
    chartData,
  };
}

export async function updatePayoutStatus(taskId, paid, adminId) {
  const { error } = await supabase
    .from('tasks')
    .update({
      runner_paid: paid,
      runner_payout_at: paid ? new Date().toISOString() : null,
    })
    .eq('id', taskId);

  if (error) { console.error('updatePayoutStatus error:', error); return false; }

  await logAdminAction(adminId, paid ? 'PAYOUT_RELEASED' : 'PAYOUT_REVOKED', 'task', taskId, {});
  return true;
}

// =============================================
// USER DETAILS EXTENSION
// =============================================

export async function fetchUserFullProfile(userId) {
  const [
    { data: profile, error: profErr },
    { data: tasksCreated, error: tcErr },
    { data: tasksRun, error: trErr },
    { data: disputes, error: dispErr },
    { data: auditLogs, error: auditErr },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('tasks').select('*').eq('client_id', userId),
    supabase.from('tasks').select('*').eq('accepted_runner_id', userId),
    supabase.from('disputes').select('*').or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`),
    supabase.from('admin_audit_log').select('*').eq('target_id', userId).order('created_at', { ascending: false }),
  ]);

  if (profErr) { console.error('fetchUserFullProfile error:', profErr); return null; }

  return {
    profile,
    tasksCreated: tasksCreated || [],
    tasksRun: tasksRun || [],
    disputes: disputes || [],
    auditLogs: auditLogs || [],
  };
}

export async function resendKYCRequest(userId, reason, adminId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      kyc_status: 'none',
      verified: false,
      kyc_rejection_reason: reason,
      kyc_submitted_at: null,
    })
    .eq('id', userId);

  if (error) { console.error('resendKYCRequest error:', error); return false; }

  await logAdminAction(adminId, 'RESEND_KYC_REQUEST', 'user', userId, { reason });
  return true;
}

// =============================================
// CHAT TRANSCRIPT FOR TASK
// =============================================

export async function fetchTaskChatTranscript(taskId) {
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .select('id')
    .eq('task_id', taskId)
    .maybeSingle();

  if (convErr) { console.error('fetchTaskChatTranscript conv error:', convErr); return []; }
  if (!conv) return [];

  const { data: messages, error: msgErr } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conv.id)
    .order('timestamp', { ascending: true });

  if (msgErr) { console.error('fetchTaskChatTranscript msg error:', msgErr); return []; }
  return messages || [];
}

// =============================================
// RUNNER ONBOARDING QUEUE
// =============================================

export async function fetchRunnerQueue() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_runner', true)
    .eq('kyc_status', 'pending')
    .order('kyc_submitted_at', { ascending: true });

  if (error) { console.error('fetchRunnerQueue error:', error); return []; }
  return data || [];
}

export async function verifyRunnerTier(userId, tier, notes, adminId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      runner_tier: tier,
      runner_notes: notes,
      kyc_status: 'approved',
      verified: true,
      kyc_reviewed_at: new Date().toISOString(),
      kyc_reviewer_id: adminId,
    })
    .eq('id', userId);

  if (error) { console.error('verifyRunnerTier error:', error); return false; }

  await logAdminAction(adminId, 'APPROVE_RUNNER_TIER', 'user', userId, { tier, notes });
  return true;
}

// =============================================
// BULK ACTIONS
// =============================================

export async function bulkBanUsers(userIds, reason, adminId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: true,
      ban_reason: reason,
      banned_at: new Date().toISOString(),
      banned_by: adminId,
    })
    .in('id', userIds);

  if (error) { console.error('bulkBanUsers error:', error); return false; }

  await logAdminAction(adminId, 'BULK_BAN_USERS', 'user', userIds.join(','), { reason, count: userIds.length });
  return true;
}

export async function bulkUnbanUsers(userIds, adminId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: false,
      ban_reason: null,
      banned_at: null,
      banned_by: null,
    })
    .in('id', userIds);

  if (error) { console.error('bulkUnbanUsers error:', error); return false; }

  await logAdminAction(adminId, 'BULK_UNBAN_USERS', 'user', userIds.join(','), { count: userIds.length });
  return true;
}

export async function bulkApproveKYC(userIds, adminId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      kyc_status: 'approved',
      verified: true,
      kyc_reviewed_at: new Date().toISOString(),
      kyc_reviewer_id: adminId,
    })
    .in('id', userIds);

  if (error) { console.error('bulkApproveKYC error:', error); return false; }

  await logAdminAction(adminId, 'BULK_APPROVE_KYC', 'user', userIds.join(','), { count: userIds.length });
  return true;
}

export async function bulkUpdateTaskStatus(taskIds, status, adminId) {
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .in('id', taskIds);

  if (error) { console.error('bulkUpdateTaskStatus error:', error); return false; }

  await logAdminAction(adminId, 'BULK_UPDATE_TASK_STATUS', 'task', taskIds.join(','), { status, count: taskIds.length });
  return true;
}

// =============================================
// CATEGORIES MANAGEMENT
// =============================================

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('task_categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) { console.error('fetchCategories error:', error); return []; }
  return data || [];
}

export async function createCategory(cat, adminId) {
  const { data, error } = await supabase
    .from('task_categories')
    .insert({
      id: cat.id,
      name_en: cat.nameEn,
      name_fr: cat.nameFr,
      name_ar: cat.nameAr,
      icon: cat.icon,
      description: cat.description,
      commission_rate: Number(cat.commissionRate || 10),
      is_featured: Boolean(cat.isFeatured),
    })
    .select()
    .single();

  if (error) { console.error('createCategory error:', error); return null; }

  await logAdminAction(adminId, 'CREATE_CATEGORY', 'category', cat.id, cat);
  return data;
}

export async function updateCategory(cat, adminId) {
  const { data, error } = await supabase
    .from('task_categories')
    .update({
      name_en: cat.nameEn,
      name_fr: cat.nameFr,
      name_ar: cat.nameAr,
      icon: cat.icon,
      description: cat.description,
      commission_rate: Number(cat.commissionRate || 10),
      is_featured: Boolean(cat.isFeatured),
    })
    .eq('id', cat.id)
    .select()
    .single();

  if (error) { console.error('updateCategory error:', error); return null; }

  await logAdminAction(adminId, 'UPDATE_CATEGORY', 'category', cat.id, cat);
  return data;
}

export async function deleteCategory(id, adminId) {
  const { error } = await supabase
    .from('task_categories')
    .delete()
    .eq('id', id);

  if (error) { console.error('deleteCategory error:', error); return false; }

  await logAdminAction(adminId, 'DELETE_CATEGORY', 'category', id, {});
  return true;
}

// =============================================
// ANNOUNCEMENTS
// =============================================

export async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchAnnouncements error:', error); return []; }
  return data || [];
}

export async function createAnnouncement(ann, adminId) {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: ann.title,
      message: ann.message,
      target_segment: ann.targetSegment,
      is_active: true,
      expires_at: ann.expiresAt || null,
    })
    .select()
    .single();

  if (error) { console.error('createAnnouncement error:', error); return null; }

  await logAdminAction(adminId, 'CREATE_ANNOUNCEMENT', 'announcement', data.id, ann);
  return data;
}

export async function deleteAnnouncement(id, adminId) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) { console.error('deleteAnnouncement error:', error); return false; }

  await logAdminAction(adminId, 'DELETE_ANNOUNCEMENT', 'announcement', id, {});
  return true;
}

// =============================================
// SUPPORT TICKETS
// =============================================

export async function fetchSupportTickets() {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchSupportTickets error:', error); return []; }
  return data || [];
}

export async function replySupportTicket(ticketId, reply, adminId) {
  const { error } = await supabase
    .from('support_tickets')
    .update({
      admin_reply: reply,
      replied_at: new Date().toISOString(),
      replied_by: adminId,
      status: 'resolved',
    })
    .eq('id', ticketId);

  if (error) { console.error('replySupportTicket error:', error); return false; }

  await logAdminAction(adminId, 'REPLY_SUPPORT_TICKET', 'ticket', ticketId, { reply });
  return true;
}

