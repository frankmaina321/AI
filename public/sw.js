const CACHE_NAME = 'peris-ai-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// Background sync for voice commands
self.addEventListener('sync', event => {
  if (event.tag === 'voice-command') {
    event.waitUntil(syncVoiceCommands());
  }
});

async function syncVoiceCommands() {
  // Handle offline voice commands
  console.log('Syncing voice commands...');
}
