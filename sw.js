/**
 * Hold'em Solitaire - Service Worker v3
 * Updated: 2026-05-19
 */
const CACHE_NAME = 'holdem-solitaire-v3';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './engine.js',
  './ui.js',
  './site.webmanifest',
  './icons/favicon.ico',
  './icons/favicon-16x16.png',
  './icons/favicon-32x32.png',
  './icons/apple-touch-icon.png',
  './icons/android-chrome-192x192.png',
  './icons/android-chrome-512x512.png',
  './sounds/gameover.wav',
  './sounds/bet.wav',
  './sounds/card.mp3',
  './sounds/fold.wav',
  './sounds/win.wav',
  ...Array.from({length: 56}, (_, i) => `./cards/${i.toString().padStart(2, '0')}_kerenel_Cards.png`)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network First strategy for HTML and core logic to avoid stale content on GitHub Pages
  if (
    event.request.mode === 'navigate' || 
    url.pathname.endsWith('/') || 
    url.pathname.endsWith('index.html') ||
    url.pathname.endsWith('engine.js') ||
    url.pathname.endsWith('ui.js') ||
    url.pathname.endsWith('style.css')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with new version
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)) // Fallback to cache if offline
    );
    return;
  }

  // Cache First for everything else (images, sounds, etc)
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
