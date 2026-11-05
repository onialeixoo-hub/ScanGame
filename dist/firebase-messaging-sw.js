/* ScanGame - Firebase Cloud Messaging service worker */
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCmtJrXGqi9B7ZvD-bHXHCv-ESJ6GBOQWM",
  authDomain: "scangame-e511f.firebaseapp.com",
  projectId: "scangame-e511f",
  storageBucket: "scangame-e511f.firebasestorage.app",
  messagingSenderId: "1056981866859",
  appId: "1:1056981866859:web:686c0264eabaf00632942e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;

  const title = payload.data?.title || "ScanGame";
  const body = payload.data?.body || "Tenés una novedad";

  self.registration.showNotification(title, {
    body,
    icon: "/ScanGame/icon-192.png",
    badge: "/ScanGame/icon-192.png",
    data: {
      url: "/ScanGame/"
    }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((client) =>
        client.url.includes("/ScanGame/")
      );

      if (existing) {
        existing.focus();
        return;
      }

      return clients.openWindow("/ScanGame/");
    })
  );
});
