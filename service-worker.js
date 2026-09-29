/**
 * GÉO-TERRAIN - SERVICE WORKER DE CACHE HORS-LIGNE
 * Assure le chargement instantané en zone blanche (Zero-Connectivity Field Mode)
 */

const CACHE_NAME = 'geoterrain-v2.1.0-lea-brand';
const STATIC_ASSETS = [
  './',
  './index.html',
  './assets/logo_lea.jpg',
  './css/leaflet.css',
  './css/styles.css',
  './js/leaflet.js',
  './js/schema.js',
  './js/storage.js',
  './js/geo.js',
  './js/pipeline-export.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mise en cache des ressources statiques pour usage terrain...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET et les endpoints d'API de synchro
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retourne le cache immédiatement, rafraîchit en arrière-plan si réseau disponible
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {
          // Normal en mode hors-ligne sur le terrain
        });
        return cachedResponse;
      }

      // Si pas en cache, aller sur le réseau et mettre en cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // En cas de panne totale sur une page HTML, renvoyer index.html
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
