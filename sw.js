// Service worker: guarda la app en el dispositivo para que funcione sin conexión.
// Al cambiar cualquier archivo, sube VERSION para que los celulares descarguen la nueva versión.
const VERSION = 'huella-1.1.0';

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/almacen.js',
  './js/app.js',
  './js/comparacion.js',
  './js/datos.js',
  './js/dominios.js',
  './js/iconos.js',
  './js/motor.js',
  './js/nota.js',
  './js/rutas.js',
  './js/ui.js',
  './js/vistas/acerca.js',
  './js/vistas/escala.js',
  './js/vistas/inicio.js',
  './js/vistas/ruta.js',
  './js/vistas/rutas-estado.js',
  './js/vistas/valoracion.js',
  './escalas/_comun.js',
  './escalas/barthel.js',
  './escalas/braden.js',
  './escalas/cam.js',
  './escalas/cfs.js',
  './escalas/ckdepi.js',
  './escalas/cockcroft.js',
  './escalas/cuatro-at.js',
  './escalas/frail.js',
  './escalas/gds15.js',
  './escalas/index.js',
  './escalas/katz.js',
  './escalas/lawton.js',
  './escalas/minicog.js',
  './escalas/mnasf.js',
  './escalas/moca.js',
  './escalas/painad.js',
  './escalas/rcri.js',
  './escalas/sarcf.js',
  './escalas/sppb.js',
  './escalas/tug.js',
  './escalas/velocidad-marcha.js',
  './escalas/vivifrail.js',
  './escalas/zarit.js',
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

// Se descargan sin pasar por la caché HTTP del navegador, para no guardar versiones viejas.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(ARCHIVOS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

// Primero la red, revalidando con el servidor (para ver cambios recientes); sin conexión, la copia guardada.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request, { cache: 'no-cache' })
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
