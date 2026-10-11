// Inicio orientado a tareas, búsqueda, dominios y favoritas.
import { almacen } from '../almacen.js';
import { escalas, porId, DOMINIOS, RUTAS, dominioDe, escalasDe } from '../datos.js';
import { TIPOS, CLASES, claseDe, TEXTO_REGISTRO } from '../motor.js';
import { $, esc, icono, plural, sinAcentos, filaEscala, filaHerramienta, tarjetaDominio, hoyISO } from '../ui.js';
import { HERRAMIENTAS, herramientaDe, herramientasDe } from '../herramientas.js';
import { progresoRuta, tiempoRuta } from './rutas-estado.js';
import { diasDesde } from './valoracion.js';
import { tarjetaInicioIcope } from './icope.js';
import { planDe } from '../plan.js';
import { problemasPlan, revaloraciones } from '../atencion.js';
import { episodioDe, fechasEvaluacion } from '../episodio.js';
import { resultadosRecientes } from '../pendientes.js';
import { pendientesActuales } from './pendientes.js';
import { valorGuardado } from '../nota.js';
import { etiquetaAplicacion, fechaCorta } from '../comparacion.js';

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
      <span class="ruta-meta">${empezada ? `<span class="mini-barra" aria-hidden="true"><span style="width:${(p.completos / p.total) * 100}%"></span></span>${p.completos}/${p.total}` : `${plural(p.total, 'paso', 'pasos')}<span class="ruta-min">${esc(tiempoRuta(ruta).texto)}</span>`}</span>
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

// Atención: lo que está en curso, problemas, plan, seguimiento e informes.
function seccionAtencion(val, dias) {
  const hoy = hoyISO();
  const plan = planDe(val);
  const probs = problemasPlan(val, porId, hoy);
  const sinValorar = probs.filter((p) => !p.asignado && p.derivado).length;
  const rev = revaloraciones(plan, hoy);
  const vencidas = rev.filter((r) => r.dias < 0).length;
  const ep = episodioDe(val);
  const n = val.resultados.length;
  const fechas = fechasEvaluacion(val).length;
  const pend = pendientesActuales();
  const alertasPend = pend.grupos.flatMap((g) => g.items).filter((x) => x.vencido || x.estado === 'desactualizado').length + (pend.grupos.find((g) => g.id === 'revaloraciones')?.items.length || 0);
  const tile = (href, ico, titulo, linea, extra = '', clase = '') => `
    <a class="tile-atencion${clase}" href="${href}">
      <span class="tile-ico">${icono(ico)}</span>
      <span class="tile-texto"><strong>${esc(titulo)}</strong><span>${linea}</span>${extra}</span>
    </a>`;
  return `
    <section class="atencion-inicio" aria-labelledby="atencion-t">
      <h2 class="seccion" id="atencion-t">Atención</h2>
      <div class="rejilla-atencion">
        ${tile('#/valoracion', 'valoracion', 'En curso', n ? `${esc(plural(n, 'resultado', 'resultados'))} · ${dias > 0 ? `hace ${esc(plural(dias, 'día', 'días'))}` : 'hoy'}` : 'Sin resultados todavía', dias > 7 && n ? '<span class="en-curso-aviso">Si es otro episodio, ciérralo en Seguimiento.</span>' : '', ' tile-principal')}
        ${tile('#/plan#problemas', 'lista', 'Problemas', probs.length ? `${esc(plural(probs.length, 'problema', 'problemas'))}${sinValorar ? ` · ${sinValorar} por valorar` : ''}` : 'Sin problemas')}
        ${tile('#/plan', 'plan', 'Plan', plan.objetivos.length || plan.intervenciones.length ? `${esc(plural(plan.objetivos.length, 'objetivo', 'objetivos'))} · ${esc(plural(plan.intervenciones.length, 'intervención', 'intervenciones'))}` : 'Sin objetivos')}
        ${tile('#/seguimiento', 'historial', 'Seguimiento', `${esc(ep.codigo)}${fechas ? ` · ${esc(plural(fechas, 'fecha', 'fechas'))}` : ''}`, vencidas ? `<span class="en-curso-aviso">${esc(plural(vencidas, 'revaloración vencida', 'revaloraciones vencidas'))}</span>` : '')}
        ${tile('#/pendientes', 'pendiente', 'Pendientes', pend.total ? esc(plural(pend.total, 'pendiente', 'pendientes')) : 'Nada pendiente', alertasPend ? `<span class="en-curso-aviso">${esc(plural(alertasPend, 'vencido o desactualizado', 'vencidos o desactualizados'))}</span>` : '')}
        ${tile('#/informe', 'documento', 'Informes', 'Evolución, nota, ICOPE, plan')}
      </div>
    </section>`;
}

// Inicio rápido: últimos resultados guardados e instrumentos más usados en este dispositivo.
function seccionRapida(val, frec) {
  const recientes = resultadosRecientes(val, porId, 3);
  if (!recientes.length && !frec.length) return '';
  return `
    <section class="inicio-rapido" aria-labelledby="rapido-t">
      <h2 class="seccion" id="rapido-t">Inicio rápido</h2>
      ${recientes.length ? `
        <p class="ceja">Resultados recientes</p>
        <ul class="lista-recientes">${recientes.map(({ r, href }) => `<li><a href="${href}"><strong>${esc(porId[r.escalaId].corto)}</strong> <span>${esc(valorGuardado(r))}</span><span class="discreto">${esc(etiquetaAplicacion(r) || fechaCorta(r.fecha))}</span></a></li>`).join('')}</ul>` : ''}
      ${frec.length ? `
        <p class="ceja">Usadas con frecuencia</p>
        <div class="lista-escalas">${frec.map((e) => filaEscala(e, { conDominio: true })).join('')}</div>` : ''}
    </section>`;
}

export function renderInicio() {
  const val = almacen.valoracion();
  const favs = almacen.favoritas().filter((id) => porId[id] || herramientaDe(id));
  const frec = frecuentes().filter((e) => !favs.includes(e.id));
  const n = val.resultados.length;
  const dias = diasDesde(val.creada);
  const valoraciones = RUTAS.filter((r) => !['icope', 'calculadoras'].includes(r.id));
  const calculadoras = RUTAS.find((r) => r.id === 'calculadoras');
  const atencion = seccionAtencion(val, dias);
  const enCurso = n || planDe(val).objetivos.length || planDe(val).libres.length;
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
        ${enCurso ? atencion : ''}
        ${seccionRapida(val, frec)}
        <h2 class="seccion">Valoraciones</h2>
        ${tarjetaInicioIcope()}
        <div class="rejilla-rutas">${valoraciones.map(tarjetaRuta).join('')}</div>
        ${enCurso ? '' : atencion}
        <h2 class="seccion">Herramientas</h2>
        <div class="rejilla-rutas herramientas-inicio">
          ${calculadoras ? tarjetaRuta(calculadoras) : ''}
          ${HERRAMIENTAS.map((h) => `
            <a class="tarjeta-ruta" href="${esc(h.href)}">
              <span class="ico-ruta">${icono(h.dominio)}</span>
              <span class="ruta-texto"><span class="ruta-nombre">${esc(h.corto)}</span><span class="ruta-desc">${esc(h.descripcion)}</span></span>
            </a>`).join('')}
          <a class="tarjeta-ruta" href="#/catalogo">
            <span class="ico-ruta">${icono('libro')}</span>
            <span class="ruta-texto"><span class="ruta-nombre">Futuras herramientas</span><span class="ruta-desc">Instrumentos por agregar y el estado de su licencia.</span></span>
          </a>
        </div>
        ${favs.length ? `
          <h2 class="seccion">Favoritas</h2>
          <div class="lista-escalas">${favs.map((id) => filaFav(id)).join('')}</div>` : ''}
        <h2 class="seccion">Dominios</h2>
        <div class="rejilla-dominios">${DOMINIOS.map(tarjetaDominio).join('')}</div>
      </div>
    </section>`;
}

const filaFav = (id) => (porId[id] ? filaEscala(porId[id], { conDominio: true }) : filaHerramienta(herramientaDe(id), { conDominio: true }));

function textoBusqueda(e) {
  const d = dominioDe(e.dominio);
  return sinAcentos([e.nombre, e.corto, ...(e.aliases || []), ...(e.problemas || []), d.nombre, ...(d.problemas || []), TIPOS[e.tipo], CLASES[claseDe(e)].nombre, e.registro ? `${TEXTO_REGISTRO} registro` : ''].join(' '));
}

export function resultadosBusqueda(q) {
  const terminos = sinAcentos(q.trim()).split(/\s+/).filter(Boolean);
  const coincide = (t) => terminos.every((x) => t.includes(x));
  const disponibles = escalas.filter((e) => coincide(textoBusqueda(e)));
  const herramientas = HERRAMIENTAS.filter((h) => coincide(textoBusqueda(h)));
  const rutas = RUTAS.filter((r) => coincide(sinAcentos(`${r.nombre} ${r.descripcion}`)));
  const planeadas = DOMINIOS.flatMap((d) => d.planeadas.map((nombre) => ({ nombre, d })))
    .filter(({ nombre, d }) => coincide(sinAcentos(`${nombre} ${d.nombre}`)));
  if (!disponibles.length && !herramientas.length && !planeadas.length && !rutas.length) {
    return `<p class="busqueda-vacia">No hay instrumentos que coincidan con «${esc(q)}».</p>`;
  }
  return `
    ${rutas.length ? `<h2 class="seccion">Rutas</h2><div class="rejilla-rutas">${rutas.map(tarjetaRuta).join('')}</div>` : ''}
    ${disponibles.length || herramientas.length ? `<h2 class="seccion">Instrumentos</h2><div class="lista-escalas">${herramientas.map((h) => filaHerramienta(h, { conDominio: true })).join('')}${disponibles.map((e) => filaEscala(e, { conDominio: true })).join('')}</div>` : ''}
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

// Más usados del dominio en este dispositivo (solo con usos registrados).
function masUsadosDe(dominioId) {
  const usos = almacen.usos();
  return escalasDe(dominioId)
    .filter((e) => usos[e.id]?.n)
    .sort((a, b) => usos[b.id].n - usos[a.id].n || usos[b.id].t - usos[a.id].t)
    .slice(0, 3);
}

export function renderDominio({ id }) {
  const d = dominioDe(id);
  const lista = escalasDe(id);
  const hs = herramientasDe(id);
  const usados = lista.length > 3 ? masUsadosDe(id) : [];
  const clases = [...new Set([...hs, ...lista].map(claseDe))];
  const aplicados = lista.filter((e) => almacen.resultadosDe(e.id).length).length;
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
      ${lista.length || hs.length ? `
        <p class="dominio-resumen">${plural(lista.length + hs.length, 'instrumento disponible', 'instrumentos disponibles')}${aplicados ? ` · ${aplicados} en la valoración en curso` : ''}</p>
        ${clases.length > 1 ? `<ul class="leyenda-clases" aria-label="Tipos de instrumento">${clases.map((c) => `<li><span class="chip-tipo clase-${c}"><span class="chip-marca" aria-hidden="true"></span>${esc(CLASES[c].nombre)}</span><span>${esc(CLASES[c].ayuda)}</span></li>`).join('')}</ul>` : ''}
        ${usados.length ? `
          <h2 class="seccion">Más usados aquí</h2>
          <div class="lista-escalas">${usados.map((e) => filaEscala(e, { detalle: true })).join('')}</div>
          <h2 class="seccion">Todos</h2>` : ''}
        <div class="lista-escalas">${hs.map((h) => filaHerramienta(h)).join('')}${lista.map((e) => filaEscala(e, { detalle: true })).join('')}</div>`
        : '<p class="vacio-texto">Aún no hay instrumentos en este dominio.</p>'}
      ${d.planeadas.length ? `
        <h2 class="seccion">Próximamente</h2>
        <ul class="chips">${d.planeadas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
    </section>`;
}

export function renderFavoritas() {
  const favs = almacen.favoritas().filter((id) => porId[id] || herramientaDe(id));
  return `
    <section class="vista favoritas">
      <header class="cabecera">
        <p class="ceja">Acceso rápido</p>
        <h1>Favoritas</h1>
      </header>
      ${favs.length
        ? `<div class="lista-escalas">${favs.map((id) => filaFav(id)).join('')}</div>`
        : `<div class="vacio-estado">
            ${icono('estrella')}
            <p>Sin favoritas todavía</p>
            <p class="sub-vacio">Toca la estrella de cualquier instrumento para tenerlo aquí.</p>
            <a class="btn btn-primario" href="#/">Ir al inicio</a>
          </div>`}
    </section>`;
}
