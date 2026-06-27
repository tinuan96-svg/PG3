// Scripts for firebase and firebase-messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyAvPeVBPFkgHKyjH_xXzDvI65flicNFUAc",
  authDomain: "pocketgrocery-5fd1f.firebaseapp.com",
  projectId: "pocketgrocery-5fd1f",
  storageBucket: "pocketgrocery-5fd1f.firebasestorage.app",
  messagingSenderId: "75115921613",
  appId: "1:75115921613:web:263e119371998572cb2984",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
