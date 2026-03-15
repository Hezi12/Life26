// Service Worker for Life26 PWA
const CACHE_NAME = 'life26-v2';
const urlsToCache = [
  '/',
  '/schedule',
  '/computer',
  '/mission',
  '/focus',
  '/laws',
  '/analytics',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle notification scheduling via message from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_FOCUS_NOTIFICATION') {
    const { time, date, sessionNumber } = event.data;
    const target = new Date(`${date}T${time}:00`);
    const reminderTime = target.getTime() - 5 * 60 * 1000; // 5 minutes before
    const delay = reminderTime - Date.now();

    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification('FOCUS_PROTOCOL', {
          body: `עוד 5 דקות מיקוד ${sessionNumber} — התייצב.`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'focus-reminder',
          renotify: true,
          vibrate: [200, 100, 200],
        });
      }, delay);
    }
  }
});

// When user clicks notification, open the focus page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/focus');
    })
  );
});
