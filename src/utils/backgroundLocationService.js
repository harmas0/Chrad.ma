import { supabase } from './supabaseClient';
import { Capacitor } from '@capacitor/core';

let watchId = null;

/**
 * Starts background location tracking for an active runner on an ongoing task.
 * 
 * @param {string} runnerId - Authenticated runner ID
 * @param {string} taskId - Active task ID
 * @param {Function} onLocationUpdate - Optional callback
 */
export function startBackgroundLocationTracking(runnerId, taskId, onLocationUpdate) {
  if (!runnerId || watchId !== null) return;

  console.log(`[LocationService] Starting runner telemetry tracking for task ${taskId}`);

  if (Capacitor.isNativePlatform()) {
    // Native Mobile Geolocation
    import(/* @vite-ignore */ '@capacitor/geolocation').then(({ Geolocation }) => {
      Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 },
        async (position, err) => {
          if (err || !position) return;
          const { latitude, longitude } = position.coords;
          await updateTelemetryPosition(runnerId, taskId, latitude, longitude);
          onLocationUpdate?.({ lat: latitude, lng: longitude });
        }
      ).then((id) => { watchId = id; });
    }).catch((err) => {
      console.error('[LocationService] Native Geolocation error:', err);
    });
  } else if ('geolocation' in navigator) {
    // Web WatchPosition
    watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await updateTelemetryPosition(runnerId, taskId, latitude, longitude);
        onLocationUpdate?.({ lat: latitude, lng: longitude });
      },
      (err) => console.warn('[LocationService] Web Geolocation warn:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }
}

/**
 * Stops background location tracking.
 */
export function stopBackgroundLocationTracking() {
  if (watchId !== null) {
    if (Capacitor.isNativePlatform()) {
      import(/* @vite-ignore */ '@capacitor/geolocation').then(({ Geolocation }) => {
        Geolocation.clearWatch({ id: watchId });
      });
    } else if ('geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId);
    }
    console.log('[LocationService] Telemetry tracking stopped.');
    watchId = null;
  }
}

async function updateTelemetryPosition(runnerId, taskId, lat, lng) {
  try {
    // Update profile current position
    await supabase.from('profiles').update({
      current_lat: lat,
      current_lng: lng,
      last_location_at: new Date().toISOString()
    }).eq('id', runnerId);

    // Update active task runner telemetry
    if (taskId) {
      await supabase.from('tasks').update({
        runner_lat: lat,
        runner_lng: lng,
      }).eq('id', taskId);
    }
  } catch (err) {
    console.error('[LocationService] Telemetry update failed:', err);
  }
}
