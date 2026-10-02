// Kimae's Party Bilao - Service Worker for Push Notifications
const CACHE_NAME = 'kimaes-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification event listener (for remote Push API)
self.addEventListener('push', (event) => {
  let data = {
    title: "Kimae's Party Bilao",
    body: 'Your delicious party bilao order status has been updated!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    url: '/account',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/account',
      orderNumber: data.orderNumber,
    },
    actions: [
      { action: 'track', title: 'Track Order' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Message listener (for client-initiated service worker push notifications)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_ORDER_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      ...options,
    });
  }
});

// Click notification handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/track';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
