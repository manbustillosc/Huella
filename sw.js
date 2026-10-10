// Service worker: guarda la app en el dispositivo para que funcione sin conexión.
// Al cambiar cualquier archivo, sube VERSION para que los celulares descarguen la nueva versión.
const VERSION = 'huella-0.2.0';

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/motor.js',
  './js/almacen.js',
  './js/dominios.js',
  './js/iconos.js',
  './escalas/index.js',
  './escalas/barthel.js',
  './escalas/lawton.js',
  './escalas/gds15.js',
  './escalas/cuatro-at.js',
  './escalas/rcri.js',
  './assets/img/huella-verde.png',
  './assets/img/huella-crema.png',
  './assets/icons/favicon-32.png',
  './assets/icons/icon-192.png',
  './assets/icons/apple-touch-icon.png',
  './assets/fonts/fraunces-latin-opsz-normal.woff2',
  './assets/fonts/fraunces-latin-ext-opsz-normal.woff2',
  './assets/fonts/inter-tight-latin-wght-normal.woff2',
  './assets/fonts/inter-tight-latin-ext-wght-normal.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

// Primero la red (para ver cambios recientes); si no hay conexión, la copia guardada.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copia));
        }
        return respuesta;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
  );
});
