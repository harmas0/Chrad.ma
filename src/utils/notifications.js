import { Capacitor } from '@capacitor/core';
import { updateFcmToken } from '../data/usersApi';

/**
 * Initializes and registers push notifications for the current authenticated user.
 * Supports both native (Capacitor) and web (Firebase Cloud Messaging) environments.
 * 
 * @param {string} userId - The current authenticated user's ID
 */
export const initializePushNotifications = async (userId) => {
  if (!userId) return;

  if (Capacitor.isNativePlatform()) {
    // --- Capacitor Native Push Notifications Wrapper ---
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Check current permission state
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Native push notifications permissions denied.');
        return;
      }

      // Register with FCM/APNS gateways
      await PushNotifications.register();

      // Listeners
      PushNotifications.addListener('registration', async (token) => {
        console.log('Capacitor native FCM token registered:', token.value);
        await updateFcmToken(userId, token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Capacitor push registration error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Native push notification received:', notification);
        // Direct display handler or local notification trigger if active
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Native push action performed:', action);
      });

    } catch (err) {
      console.error('Capacitor native push integration failed:', err);
    }
  } else {
    // --- Web Firebase FCM Push Notifications ---
    try {
      // Dynamic imports to optimize initial bundle sizes
      const { initializeApp } = await import('firebase/app');
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

      // Firebase configuration
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
        appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
      };

      // Expose only if browser notifications API is supported
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const app = initializeApp(firebaseConfig);
          const messaging = getMessaging(app);

          // Retrieve active registration token
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY"
          });

          if (token) {
            console.log('Web FCM token registered:', token);
            await updateFcmToken(userId, token);
          } else {
            console.warn('FCM: No registration token available.');
          }

          // Foreground message listener
          onMessage(messaging, (payload) => {
            console.log('Foreground FCM message received:', payload);
            if (payload.notification) {
              // Custom premium alert popups
              alert(`🔔 ${payload.notification.title}\n${payload.notification.body}`);
            }
          });
        } else {
          console.warn('Web push notification permission denied by user.');
        }
      }
    } catch (err) {
      console.error('Web Firebase FCM integration failed:', err);
    }
  }
};
