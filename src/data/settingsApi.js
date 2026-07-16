import { supabase } from '../utils/supabaseClient';
import { logAdminAction } from './adminApi';

export async function fetchPlatformSettings() {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('id', 'global_config')
    .single();

  if (error) {
    console.error('fetchPlatformSettings error:', error);
    // Return defaults as fallback
    return {
      platformName: 'Chrad',
      supportEmail: 'support@chrad.ma',
      minBidPrice: 10,
      maxBidPrice: 5000,
      platformFeePercent: 10,
      requireKYCForRunners: true,
      allowGuestBrowsing: false,
      maxPhotosPerTask: 5,
      maintenanceMode: false,
      enablePushNotifications: true,
      enableEmailNotifications: true,
      autoApproveKYC: false,
    };
  }

  // Map database snake_case to frontend camelCase
  return {
    platformName: data.platform_name,
    supportEmail: data.support_email,
    minBidPrice: Number(data.min_bid_price),
    maxBidPrice: Number(data.max_bid_price),
    platformFeePercent: Number(data.platform_fee_percent),
    requireKYCForRunners: data.require_kyc_for_runners,
    allowGuestBrowsing: data.allow_guest_browsing,
    maxPhotosPerTask: data.max_photos_per_task,
    maintenanceMode: data.maintenance_mode,
    enablePushNotifications: data.enable_push_notifications,
    enableEmailNotifications: data.enable_email_notifications,
    autoApproveKYC: data.auto_approve_kyc,
  };
}

export async function updatePlatformSettings(settings, adminId) {
  const row = {
    platform_name: settings.platformName,
    support_email: settings.supportEmail,
    min_bid_price: Number(settings.minBidPrice),
    max_bid_price: Number(settings.maxBidPrice),
    platform_fee_percent: Number(settings.platformFeePercent),
    require_kyc_for_runners: settings.requireKYCForRunners,
    allow_guest_browsing: settings.allowGuestBrowsing,
    max_photos_per_task: settings.maxPhotosPerTask,
    maintenance_mode: settings.maintenanceMode,
    enable_push_notifications: settings.enablePushNotifications,
    enable_email_notifications: settings.enableEmailNotifications,
    auto_approve_kyc: settings.autoApproveKYC,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('platform_settings')
    .update(row)
    .eq('id', 'global_config')
    .select()
    .single();

  if (error) {
    console.error('updatePlatformSettings error:', error);
    return null;
  }

  // Log admin action to audit logs
  await logAdminAction(adminId, 'UPDATE_PLATFORM_SETTINGS', 'settings', 'global_config', settings);

  return data;
}
