// Inicio orientado a tareas, búsqueda, dominios y favoritas.
import { almacen } from '../almacen.js';
import { escalas, porId, DOMINIOS, RUTAS, dominioDe, escalasDe } from '../datos.js';
import { TIPOS } from '../motor.js';
import { $, esc, icono, plural, sinAcentos, filaEscala, tarjetaDominio } from '../ui.js';
import { progresoRuta } from './rutas-estado.js';

function tarjetaRuta(ruta) {
  const p = progresoRuta(ruta);
  const empezada = p.completos + p.omitidos > 0;
  return `
    <a class="tarjeta-ruta" href="#/r/${ruta.id}">
      <span class="ico-ruta">${icono(ruta.icono)}</span>
      <span class="ruta-texto">
        <span class="ruta-nombre">${esc(ruta.nombre)}</span>
        <span class="ruta-desc">${esc(ruta.descripcion)}</span>
      </span>
      <span class="ruta-meta">${empezada ? `<span class="mini-barra" aria-hidden="true"><span style="width:${(p.completos / p.total) * 100}%"></span></span>${p.completos}/${p.total}` : plural(p.total, 'paso', 'pasos')}</span>
    </a>`;
}

function frecuentes() {
  const usos = almacen.usos();
  return Object.entries(usos)
    .filter(([id]) => porId[id])
    .sort((a, b) => b[1].n - a[1].n || b[1].t - a[1].t)
    .slice(0, 4)
    .map(([id]) => porId[id]);
}

export function renderInicio() {
  const val = almacen.valoracion();
  const favs = almacen.favoritas().filter((id) => porId[id]);
  const frec = frecuentes().filter((e) => !favs.includes(e.id));
  const n = val.resultados.length;
  return `
    <section class="vista inicio">
      <header class="cabecera">
        <p class="ceja">Valoración geriátrica integral</p>
        <h1>¿Qué deseas valorar?</h1>
      </header>
      <label class="buscador">
        ${icono('buscar')}
        <input id="buscar" type="search" placeholder="Nombre, sigla, dominio o problema clínico" aria-label="Buscar instrumento" autocomplete="off" enterkeyhint="search">
      </label>
      <div id="busqueda" hidden></div>
      <div id="contenido-inicio">
        ${n ? `
          <a class="en-curso" href="#/valoracion">
            ${icono('valoracion')}
            <span><strong>Valoración en curso</strong><span>${plural(n, 'resultado guardado', 'resultados guardados')} · ver la nota</span></span>
            ${icono('adelante', 'chev')}
          </a>` : ''}
        <h2 class="seccion">Rutas guiadas</h2>
        <div class="rejilla-rutas">${RUTAS.map(tarjetaRuta).join('')}</div>
        ${favs.length ? `
          <h2 class="seccion">Favoritas</h2>
          <div class="lista-escalas">${favs.map((id) => filaEscala(porId[id], { conDominio: true })).join('')}</div>` : ''}
        ${frec.length ? `
          <h2 class="seccion">Usadas con frecuencia</h2>
          <div class="lista-escalas">${frec.map((e) => filaEscala(e, { conDominio: true })).join('')}</div>` : ''}
        <h2 class="seccion">Dominios</h2>
        <div class="rejilla-dominios">${DOMINIOS.map(tarjetaDominio).join('')}</div>
      </div>
    </section>`;
}

function textoBusqueda(e) {
  const d = dominioDe(e.dominio);
  return sinAcentos([e.nombre, e.corto, ...(e.aliases || []), ...(e.problemas || []), d.nombre, ...(d.problemas || []), TIPOS[e.tipo]].join(' '));
}

export function resultadosBusqueda(q) {
  const terminos = sinAcentos(q.trim()).split(/\s+/).filter(Boolean);
  const coincide = (t) => terminos.every((x) => t.includes(x));
  const disponibles = escalas.filter((e) => coincide(textoBusqueda(e)));
  const rutas = RUTAS.filter((r) => coincide(sinAcentos(`${r.nombre} ${r.descripcion}`)));
  const planeadas = DOMINIOS.flatMap((d) => d.planeadas.map((nombre) => ({ nombre, d })))
    .filter(({ nombre, d }) => coincide(sinAcentos(`${nombre} ${d.nombre}`)));
  if (!disponibles.length && !planeadas.length && !rutas.length) {
    return `<p class="busqueda-vacia">No hay instrumentos que coincidan con «${esc(q)}».</p>`;
  }
  return `
    ${rutas.length ? `<h2 class="seccion">Rutas</h2><div class="rejilla-rutas">${rutas.map(tarjetaRuta).join('')}</div>` : ''}
    ${disponibles.length ? `<h2 class="seccion">Instrumentos</h2><div class="lista-escalas">${disponibles.map((e) => filaEscala(e, { conDominio: true })).join('')}</div>` : ''}
    ${planeadas.length ? `
      <h2 class="seccion">Próximamente</h2>
      <div class="lista-escalas">${planeadas.map(({ nombre, d }) => `<div class="prox-fila"><span>${esc(nombre)}</span><span>${esc(d.nombre)}</span></div>`).join('')}</div>` : ''}`;
}

export function montarInicio() {
  const input = $('#buscar');
  const caja = $('#busqueda');
  const contenido = $('#contenido-inicio');
  input.addEventListener('input', () => {
    const hay = input.value.trim().length > 0;
    caja.hidden = !hay;
    contenido.hidden = hay;
    if (hay) caja.innerHTML = resultadosBusqueda(input.value);
  });
}

export function renderDominio({ id }) {
  const d = dominioDe(id);
  const lista = escalasDe(id);
  return `
    <section class="vista dominio">
      <a class="migas" href="#/">${icono('atras')} Inicio</a>
      <header class="cabecera cabecera-dominio">
        <span class="ico-dominio grande">${icono(d.id)}</span>
        <div>
          <p class="ceja">Dominio</p>
          <h1>${esc(d.nombre)}</h1>
          <p class="entradilla">${esc(d.descripcion)}</p>
        </div>
      </header>
      ${lista.length
        ? `<div class="lista-escalas">${lista.map((e) => filaEscala(e)).join('')}</div>`
        : '<p class="vacio-texto">Aún no hay instrumentos en este dominio.</p>'}
      ${d.planeadas.length ? `
        <h2 class="seccion">Próximamente</h2>
        <ul class="chips">${d.planeadas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
    </section>`;
}

export function renderFavoritas() {
  const favs = almacen.favoritas().filter((id) => porId[id]);
  return `
    <section class="vista favoritas">
      <header class="cabecera">
        <p class="ceja">Acceso rápido</p>
        <h1>Favoritas</h1>
      </header>
      ${favs.length
        ? `<div class="lista-escalas">${favs.map((id) => filaEscala(porId[id], { conDominio: true })).join('')}</div>`
        : `<div class="vacio-estado">
            ${icono('estrella')}
            <p>Sin favoritas todavía</p>
            <p class="sub-vacio">Toca la estrella de cualquier instrumento para tenerlo aquí.</p>
            <a class="btn btn-primario" href="#/">Ir al inicio</a>
          </div>`}
    </section>`;
}
