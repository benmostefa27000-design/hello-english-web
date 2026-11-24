/* Hors ligne : tous les fichiers de l'appli sont gardÃ©s en cache.
   Changer VERSION Ã  chaque mise Ã  jour pour que les tablettes la rÃ©cupÃ¨rent. */
const VERSION = 'he-web-6';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'css/app.css', 'fonts/nunito-latin-wght-normal.woff2', 'fonts/nunito-latin-ext-wght-normal.woff2',
  'js/data.js', 'js/android.js', 'js/store.js', 'js/sync-config.js', 'js/sync.js', 'js/audio-index.js', 'js/audio.js', 'js/ui.js', 'js/games.js', 'js/lessons.js', 'js/screens.js', 'js/app.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // rÃ©seau d'abord (pour les mises Ã  jour), cache si hors ligne
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
