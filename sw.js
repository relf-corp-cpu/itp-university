/**
 * ITP University — Service Worker (PWA)
 * Cache-first pour les assets, network-first pour l'API
 */
const CACHE  = 'itp-v1.0';
const ASSETS = [
  '/', '/index.html', '/404.html',
  '/assets/css/style.css',
  '/assets/js/config.js', '/assets/js/api.js',
  '/assets/js/utils.js',  '/assets/js/main.js', '/assets/js/components.js',
  '/assets/images/icon-192.png',
  '/auth/login.html',
  '/student/index.html', '/student/notes.html', '/student/emploi_du_temps.html',
  '/student/paiements.html', '/student/reclamations.html', '/student/carte_numerique.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API → network first
  if (url.pathname.includes('/rest/v1') || url.pathname.includes('/api/v1')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  // Assets → cache first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    })).catch(() => caches.match('/404.html'))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title:'ITP University', body:'Nouvelle notification' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body, icon: '/assets/images/icon-192.png', badge: '/assets/images/icon-192.png'
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
