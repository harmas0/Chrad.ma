// Firebase Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyChradMA_ProdKeyForPush",
  authDomain: "chrad-ma-prod.firebaseapp.com",
  projectId: "chrad-ma-prod",
  storageBucket: "chrad-ma-prod.appspot.com",
  messagingSenderId: "716906967642",
  appId: "1:716906967642:web:665926b1e5d21912ed5e63"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Chrad.ma Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'New task activity update',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
