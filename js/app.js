// Huella · enrutador, navegación y arranque.
import { almacen } from './almacen.js';
import { VERSION, escalas, porId, DOMINIOS, RUTAS, escalasDe, dominioDe, rutaDe } from './datos.js';
import { momentoDe, MOMENTOS } from './motor.js';
import { $, esc, icono, aviso, botonEstrella, nombreCorto, cuentaDominio } from './ui.js';
import { renderMedicacion, montarMedicacion } from './vistas/medicacion.js';
import { renderInicio, montarInicio, renderDominio, renderFavoritas } from './vistas/inicio.js';
import { renderEscala, montarEscala, renderResultado, montarResultado, contexto } from './vistas/escala.js';
import { renderRuta, montarRuta } from './vistas/ruta.js';
import { renderValoracion, montarValoracion } from './vistas/valoracion.js';
import { renderAcerca, montarAcerca } from './vistas/acerca.js';

const vista = $('#vista');

/* ---------- Rutas de la app ---------- */

function parsearEscala(segmento) {
  const [id, momento] = String(segmento || '').split('@');
  if (!porId[id]) return null;
  const valido = momento && porId[id].momentos && MOMENTOS.some((m) => m.id === momento) ? momento : undefined;
  return { id, momento: valido };
}

function ruta() {
  const partes = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const [a, b, c, d] = partes;
  if (a === 'd' && dominioDe(b)) return { vista: 'dominio', id: b };
  if (a === 'e') {
    const x = parsearEscala(b);
    if (x) return { vista: c === 'resultado' ? 'resultado' : 'escala', ...x, ruta: null };
  }
  if (a === 'r' && rutaDe(b)) {
    const x = c ? parsearEscala(c) : null;
    if (x) return { vista: d === 'resultado' ? 'resultado' : 'escala', ...x, ruta: rutaDe(b) };
    return { vista: 'ruta', id: b };
  }
  if (a === 'medicacion') return { vista: 'medicacion', pestana: ['medicamentos', 'stopp', 'beers', 'resumen'].includes(b) ? b : 'medicamentos' };
  if (a === 'valoracion') return { vista: 'valoracion' };
  if (a === 'favoritas') return { vista: 'favoritas' };
  if (a === 'acerca') return { vista: 'acerca' };
  return { vista: 'inicio' };
}

function render() {
  const r = ruta();
  let html;
  if (r.vista === 'resultado') {
    html = renderResultado(r);
    if (html == null) {
      location.replace(contexto(r).url);
      return;
    }
  } else {
    html = {
      inicio: renderInicio,
      dominio: renderDominio,
      escala: renderEscala,
      ruta: renderRuta,
      valoracion: renderValoracion,
      medicacion: renderMedicacion,
      favoritas: renderFavoritas,
      acerca: renderAcerca,
    }[r.vista](r);
  }
  document.body.dataset.vista = r.vista;
  vista.innerHTML = html;
  renderNavegacion(r);
  document.title = titulo(r);
  window.scrollTo(0, 0);
  const h1 = vista.querySelector('h1');
  if (h1) {
    h1.setAttribute('tabindex', '-1');
    h1.focus({ preventScroll: true });
  }
  montar(r);
}

function montar(r) {
  const navegacion = () => renderNavegacion(ruta());
  if (r.vista === 'inicio') montarInicio();
  if (r.vista === 'escala') montarEscala(r, render);
  if (r.vista === 'resultado') montarResultado(r, navegacion);
  if (r.vista === 'ruta') montarRuta(r, render);
  if (r.vista === 'valoracion') montarValoracion(render, navegacion);
  if (r.vista === 'medicacion') montarMedicacion(r, render, navegacion);
  if (r.vista === 'acerca') montarAcerca(() => { aplicarTema(); navegacion(); }, navegacion);
}

function titulo(r) {
  const base = 'Huella';
  if (r.vista === 'dominio') return `${dominioDe(r.id).nombre} · ${base}`;
  if (r.vista === 'escala') return `${porId[r.id].corto} · ${base}`;
  if (r.vista === 'resultado') return `${porId[r.id].corto}: resultado · ${base}`;
  if (r.vista === 'ruta') return `${rutaDe(r.id).nombre} · ${base}`;
  if (r.vista === 'valoracion') return `Valoración · ${base}`;
  if (r.vista === 'medicacion') return `Revisión de medicamentos · ${base}`;
  if (r.vista === 'favoritas') return `Favoritas · ${base}`;
  if (r.vista === 'acerca') return `Acerca de · ${base}`;
  return base;
}

/* ---------- Navegación: lateral, barra superior y pestañas ---------- */

const ARCOS = `<svg class="arcos" viewBox="0 0 260 260" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
  ${[40, 64, 88, 112, 136].map((x) => `<circle cx="130" cy="130" r="${x}"/>`).join('')}
</svg>`;

function renderNavegacion(r) {
  const nVal = almacen.valoracion().resultados.length;
  const domAct = r.vista === 'dominio' ? r.id : ['escala', 'resultado'].includes(r.vista) && !r.ruta ? porId[r.id].dominio : null;
  const rutaAct = r.vista === 'ruta' ? r.id : r.ruta?.id;
  const item = (href, ico, texto, activo, extra = '', clase = '') =>
    `<a class="nav-item${activo ? ' activo' : ''}${clase}" href="${href}"${activo ? ' aria-current="page"' : ''}>${icono(ico)}<span>${esc(texto)}</span>${extra}</a>`;

  $('#lateral').innerHTML = `
    <a class="marca" href="#/">
      <img src="assets/img/huella-crema.png" alt="" width="34" height="43">
      <span><span class="marca-nombre">Huella</span><span class="marca-sub">Valoración geriátrica integral</span></span>
    </a>
    <nav aria-label="Principal">
      ${item('#/', 'inicio', 'Inicio', r.vista === 'inicio')}
      ${item('#/valoracion', 'valoracion', 'Valoración', r.vista === 'valoracion', nVal ? `<span class="insignia">${nVal}</span>` : '')}
      ${item('#/favoritas', 'estrella', 'Favoritas', r.vista === 'favoritas')}
    </nav>
    <nav class="grupo-nav" aria-label="Rutas guiadas">
      <p class="etq-nav">Rutas guiadas</p>
      ${RUTAS.map((x) => item(`#/r/${x.id}`, x.icono, x.nombre.replace('Valoración geriátrica ', 'VGI '), rutaAct === x.id)).join('')}
    </nav>
    <nav class="grupo-nav" aria-label="Dominios">
      <p class="etq-nav">Dominios</p>
      ${DOMINIOS.map((d) => {
        const n = cuentaDominio(d.id);
        return item(`#/d/${d.id}`, d.id, d.nombre, domAct === d.id, `<span class="cuenta">${n || '·'}</span>`, n ? '' : ' vacio');
      }).join('')}
    </nav>
    <div class="pie-lateral">
      ${ARCOS}
      <p>${escalas.length} instrumentos · versión ${VERSION}<br>Datos solo en este navegador</p>
      <div class="botones">
        <button class="btn-lateral" type="button" data-tema>${icono(temaOscuro() ? 'sol' : 'luna')}<span>${temaOscuro() ? 'Claro' : 'Oscuro'}</span></button>
        <a class="btn-lateral" href="#/acerca">${icono('info')}<span>Acerca de</span></a>
      </div>
    </div>`;

  const esEscala = ['escala', 'resultado'].includes(r.vista);
  let atras = '#/';
  let tituloBarra = '';
  if (r.vista === 'dominio') tituloBarra = dominioDe(r.id).nombre;
  if (r.vista === 'ruta') tituloBarra = rutaDe(r.id).nombre;
  if (esEscala) {
    const ctx = contexto(r);
    atras = r.vista === 'resultado' ? ctx.url : r.ruta ? `#/r/${r.ruta.id}` : `#/d/${porId[r.id].dominio}`;
    const m = ctx.e.momentos ? ` · ${momentoDe(ctx.momento).nombre}` : '';
    tituloBarra = `${porId[r.id].corto}${r.vista === 'resultado' ? ' · Resultado' : m}`;
  }
  if (r.vista === 'valoracion') tituloBarra = 'Valoración';
  if (r.vista === 'medicacion') { tituloBarra = 'Medicamentos'; atras = '#/d/polifarmacia'; }
  if (r.vista === 'favoritas') tituloBarra = 'Favoritas';
  if (r.vista === 'acerca') tituloBarra = 'Acerca de';

  $('#barra').innerHTML = r.vista === 'inicio'
    ? `<a class="marca-movil" href="#/">
         <img class="logo-claro" src="assets/img/huella-verde.png" alt="" width="22" height="28">
         <img class="logo-oscuro" src="assets/img/huella-crema.png" alt="" width="22" height="28">
         <span>Huella</span>
       </a>
       <div class="acciones-barra">
         <button class="btn-icono" type="button" data-tema aria-label="Cambiar a tema ${temaOscuro() ? 'claro' : 'oscuro'}">${icono(temaOscuro() ? 'sol' : 'luna')}</button>
         <a class="btn-icono" href="#/acerca" aria-label="Acerca de Huella">${icono('info')}</a>
       </div>`
    : `<a class="btn-icono" href="${atras}" aria-label="Regresar">${icono('atras')}</a>
       <span class="barra-titulo">${esc(tituloBarra)}</span>
       ${esEscala ? botonEstrella(r.id) : r.vista === 'medicacion' ? botonEstrella('medicacion') : ''}`;

  const tab = (href, ico, texto, activo, extra = '') =>
    `<a href="${href}"${activo ? ' class="activo" aria-current="page"' : ''}>${icono(ico)}<span>${texto}</span>${extra}</a>`;
  $('#pestanas').innerHTML = `
    ${tab('#/', 'inicio', 'Inicio', ['inicio', 'dominio', 'escala', 'resultado', 'acerca', 'ruta', 'medicacion'].includes(r.vista))}
    ${tab('#/favoritas', 'estrella', 'Favoritas', r.vista === 'favoritas')}
    ${tab('#/valoracion', 'valoracion', 'Valoración', r.vista === 'valoracion', nVal ? `<span class="insignia">${nVal}</span>` : '')}`;
}

/* ---------- Eventos globales ---------- */

document.addEventListener('click', (ev) => {
  const fav = ev.target.closest('[data-fav]');
  if (fav) {
    const id = fav.dataset.fav;
    const ahora = almacen.alternarFavorita(id);
    document.querySelectorAll(`[data-fav="${id}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', String(ahora));
      b.setAttribute('aria-label', `${ahora ? 'Quitar de' : 'Agregar a'} favoritas: ${nombreCorto(id)}`);
    });
    aviso(ahora ? 'Agregada a favoritas' : 'Quitada de favoritas');
    return;
  }
  if (ev.target.closest('[data-tema]')) {
    almacen.guardarTema(temaOscuro() ? 'claro' : 'oscuro');
    aplicarTema();
    renderNavegacion(ruta());
  }
});

/* ---------- Tema ---------- */

function temaOscuro() {
  const t = almacen.tema();
  return t === 'oscuro' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
}

function aplicarTema() {
  const t = almacen.tema();
  const raiz = document.documentElement;
  if (t === 'claro') raiz.dataset.theme = 'light';
  else if (t === 'oscuro') raiz.dataset.theme = 'dark';
  else delete raiz.dataset.theme;
  $('meta[name="theme-color"]').setAttribute('content', temaOscuro() ? '#111a16' : '#fbf6ec');
}

/* ---------- Arranque ---------- */

aplicarTema();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  aplicarTema();
  renderNavegacion(ruta());
});
window.addEventListener('hashchange', render);
render();

if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
