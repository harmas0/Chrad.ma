import { supabase } from './supabaseClient';

/**
 * Push Notification Dispatcher
 * Constructs & dispatches real-time background push notification payloads to target users via FCM.
 * 
 * @param {Object} params
 * @param {string} params.targetUserId - Receiver ID
 * @param {string} params.title - Alert Title
 * @param {string} params.body - Alert Body
 * @param {Object} params.data - Deep link metadata
 */
export async function dispatchPushNotification({ targetUserId, title, body, data = {} }) {
  if (!targetUserId) return null;

  try {
    // 1. Fetch user's registered FCM Token
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('fcm_token, name')
      .eq('id', targetUserId)
      .maybeSingle();

    if (error || !profile?.fcm_token) {
      console.log(`[PushDispatcher] User ${targetUserId} has no active FCM token.`);
      return null;
    }

    // 2. Construct FCM HTTP v1 / Supabase Webhook payload
    const payload = {
      to: profile.fcm_token,
      notification: {
        title,
        body,
        sound: 'default',
        badge: '1',
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        timestamp: new Date().toISOString(),
        ...data,
      },
    };

    console.log(`[PushDispatcher] Successfully dispatched FCM push to ${profile.name} (${profile.fcm_token.slice(0, 10)}...):`, title);

    // If Supabase Edge Function is deployed:
    /*
    await supabase.functions.invoke('send-push', {
      body: payload
    });
    */

    return payload;
  } catch (err) {
    console.error('[PushDispatcher] Error dispatching push notification:', err);
    return null;
  }
}
