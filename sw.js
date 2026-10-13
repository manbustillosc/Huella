// Service worker: guarda la app en el dispositivo para que funcione sin conexión.
// Al cambiar cualquier archivo, sube VERSION para que los celulares descarguen la nueva versión.
const VERSION = 'huella-2.9.1';

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/almacen.js',
  './js/app.js',
  './js/comparacion.js',
  './js/medicacion.js',
  './js/infusiones.js',
  './js/unidades.js',
  './js/herramientas.js',
  './js/vistas/medicacion.js',
  './js/vistas/infusiones.js',
  './js/vistas/unidades.js',
  './js/vpo.js',
  './js/vistas/vpo.js',
  './js/icope.js',
  './js/plan.js',
  './js/vistas/icope.js',
  './js/atencion.js',
  './js/episodio.js',
  './js/importacion.js',
  './js/pendientes.js',
  './js/documentos.js',
  './js/informes.js',
  './js/vistas/plan-ui.js',
  './js/vistas/atencion.js',
  './js/vistas/seguimiento.js',
  './js/vistas/informe.js',
  './js/vistas/catalogo.js',
  './js/vistas/pendientes.js',
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
  './escalas/cfs-figuras.js',
  './escalas/figuras.js',
  './escalas/rankin.js',
  './escalas/rankin-figuras.js',
  './escalas/riesgoqx.js',
  './escalas/ckdepi.js',
  './escalas/cockcroft.js',
  './escalas/rudas.js',
  './escalas/cdr.js',
  './escalas/mmse.js',
  './escalas/reloj.js',
  './escalas/cognitivas-extra.js',
  './escalas/afectivas-extra.js',
  './escalas/caidas-extra.js',
  './escalas/dominios-extra.js',
  './escalas/fase5.js',
  './escalas/inger.js',
  './escalas/fast.js',
  './escalas/phq9.js',
  './escalas/cornell.js',
  './escalas/npiq.js',
  './escalas/rass.js',
  './escalas/camicu.js',
  './escalas/fried.js',
  './escalas/tinetti.js',
  './escalas/gijon.js',
  './escalas/ariscat.js',
  './escalas/dasi.js',
  './escalas/pps.js',
  './escalas/icope.js',
  './escalas/continencia.js',
  './escalas/sueno.js',
  './escalas/sensorial.js',
  './escalas/deglucion.js',
  './escalas/osea.js',
  './escalas/movilidad.js',
  './escalas/comorbilidad.js',
  './escalas/stoppstart-datos.js',
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
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png',
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
