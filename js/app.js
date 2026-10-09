import { ESCALAS } from '../escalas/index.js';
import { DOMINIOS } from './dominios.js';
import { icono } from './iconos.js';
import { normalizarEscala, calcular, resumenDe, posicionMarcador, rangoTexto, notaValoracion } from './motor.js';
import { almacen } from './almacen.js';

const VERSION = '0.1.0';

const escalas = ESCALAS.map(normalizarEscala);
const porId = Object.fromEntries(escalas.map((e) => [e.id, e]));
const escalasDe = (dominioId) => escalas.filter((e) => e.dominio === dominioId);
const dominioDe = (id) => DOMINIOS.find((d) => d.id === id);

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const vista = $('#vista');

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sinAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const movimientoReducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Rutas ---------- */

function ruta() {
  const partes = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const [a, b, c] = partes;
  if (a === 'd' && dominioDe(b)) return { vista: 'dominio', id: b };
  if (a === 'e' && porId[b]) return { vista: c === 'resultado' ? 'resultado' : 'escala', id: b };
  if (a === 'valoracion') return { vista: 'valoracion' };
  if (a === 'favoritas') return { vista: 'favoritas' };
  if (a === 'acerca') return { vista: 'acerca' };
  return { vista: 'inicio' };
}

const VISTAS = {
  inicio: vistaInicio,
  dominio: vistaDominio,
  escala: vistaEscala,
  resultado: vistaResultado,
  valoracion: vistaValoracion,
  favoritas: vistaFavoritas,
  acerca: vistaAcerca,
};

function render() {
  const r = ruta();
  if (r.vista === 'resultado' && !calcular(porId[r.id], almacen.respuestas(r.id)).completo) {
    location.replace(`#/e/${r.id}`);
    return;
  }
  document.body.dataset.vista = r.vista;
  vista.innerHTML = VISTAS[r.vista](r);
  renderNavegacion(r);
  document.title = titulo(r);
  window.scrollTo(0, 0);
  const h1 = vista.querySelector('h1');
  if (h1) {
    h1.setAttribute('tabindex', '-1');
    h1.focus({ preventScroll: true });
  }
  MONTAJES[r.vista]?.(r);
}

function titulo(r) {
  const base = 'Huella';
  if (r.vista === 'dominio') return `${dominioDe(r.id).nombre} · ${base}`;
  if (r.vista === 'escala') return `${porId[r.id].corto} · ${base}`;
  if (r.vista === 'resultado') return `${porId[r.id].corto}: resultado · ${base}`;
  if (r.vista === 'valoracion') return `Valoración · ${base}`;
  if (r.vista === 'favoritas') return `Favoritas · ${base}`;
  if (r.vista === 'acerca') return `Acerca de · ${base}`;
  return base;
}

/* ---------- Navegación: lateral, barra superior y pestañas ---------- */

function dominioActivo(r) {
  if (r.vista === 'dominio') return r.id;
  if (r.vista === 'escala' || r.vista === 'resultado') return porId[r.id].dominio;
  return null;
}

const ARCOS = `<svg class="arcos" viewBox="0 0 260 260" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
  ${[40, 64, 88, 112, 136].map((r) => `<circle cx="130" cy="130" r="${r}"/>`).join('')}
</svg>`;

function renderNavegacion(r) {
  const nVal = almacen.valoracion().resultados.length;
  const domAct = dominioActivo(r);
  const item = (href, ico, texto, activo, extra = '', clase = '') =>
    `<a class="nav-item${activo ? ' activo' : ''}${clase}" href="${href}"${activo ? ' aria-current="page"' : ''}>${icono(ico)}<span>${texto}</span>${extra}</a>`;

  $('#lateral').innerHTML = `
    <a class="marca" href="#/">
      <img src="assets/img/huella-crema.png" alt="" width="34" height="43">
      <span><span class="marca-nombre">Huella</span><span class="marca-sub">Escalas de valoración geriátrica</span></span>
    </a>
    <nav aria-label="Principal">
      ${item('#/', 'inicio', 'Inicio', r.vista === 'inicio')}
      ${item('#/valoracion', 'valoracion', 'Valoración', r.vista === 'valoracion', nVal ? `<span class="insignia cuenta-val">${nVal}</span>` : '')}
      ${item('#/favoritas', 'estrella', 'Favoritas', r.vista === 'favoritas')}
    </nav>
    <nav class="grupo-nav" aria-label="Dominios">
      <p class="etq-nav">Dominios</p>
      ${DOMINIOS.map((d) => {
        const n = escalasDe(d.id).length;
        return item(`#/d/${d.id}`, d.id, d.nombre, domAct === d.id, `<span class="cuenta">${n || '·'}</span>`, n ? '' : ' vacio');
      }).join('')}
    </nav>
    <div class="pie-lateral">
      ${ARCOS}
      <p>${plural(escalas.length, 'escala', 'escalas')} · versión ${VERSION}<br>Datos solo en este dispositivo</p>
      <div class="botones">
        <button class="btn-lateral" type="button" data-tema>${icono(temaOscuro() ? 'sol' : 'luna')}<span>${temaOscuro() ? 'Claro' : 'Oscuro'}</span></button>
        <a class="btn-lateral" href="#/acerca">${icono('info')}<span>Acerca de</span></a>
      </div>
    </div>`;

  // Barra superior del celular
  const atras = {
    dominio: '#/',
    escala: r.id && porId[r.id] ? `#/d/${porId[r.id].dominio}` : '#/',
    resultado: `#/e/${r.id}`,
    valoracion: '#/',
    favoritas: '#/',
    acerca: '#/',
  }[r.vista];
  const tituloBarra = {
    dominio: () => dominioDe(r.id).nombre,
    escala: () => porId[r.id].corto,
    resultado: () => `${porId[r.id].corto} · Resultado`,
    valoracion: () => 'Valoración',
    favoritas: () => 'Favoritas',
    acerca: () => 'Acerca de',
  }[r.vista];
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
       <span class="barra-titulo">${esc(tituloBarra())}</span>
       ${(r.vista === 'escala' || r.vista === 'resultado') ? botonEstrella(r.id) : ''}`;

  const tab = (href, ico, texto, activo, extra = '') =>
    `<a href="${href}"${activo ? ' class="activo" aria-current="page"' : ''}>${icono(ico)}<span>${texto}</span>${extra}</a>`;
  $('#pestanas').innerHTML = `
    ${tab('#/', 'dominios', 'Escalas', ['inicio', 'dominio', 'escala', 'resultado', 'acerca'].includes(r.vista))}
    ${tab('#/favoritas', 'estrella', 'Favoritas', r.vista === 'favoritas')}
    ${tab('#/valoracion', 'valoracion', 'Valoración', r.vista === 'valoracion', nVal ? `<span class="insignia">${nVal}</span>` : '')}`;
}

/* ---------- Piezas reutilizables ---------- */

function botonEstrella(id) {
  const fav = almacen.favoritas().includes(id);
  const nombre = porId[id].corto;
  return `<button class="btn-icono btn-estrella" type="button" data-fav="${id}" aria-pressed="${fav}" aria-label="${fav ? 'Quitar de' : 'Agregar a'} favoritas: ${esc(nombre)}">${icono('estrella')}</button>`;
}

function filaEscala(e, { conDominio = false } = {}) {
  const meta = [conDominio ? dominioDe(e.dominio).nombre : null, plural(e.items.length, 'reactivo', 'reactivos'), e.tiempo].filter(Boolean).join(' · ');
  return `
    <div class="fila-escala">
      <a class="fila-enlace" href="#/e/${e.id}">
        <span class="fila-texto">
          <span class="fila-nombre">${esc(e.nombre)}</span>
          <span class="fila-desc">${esc(e.descripcion)}</span>
          <span class="fila-meta">${esc(meta)}</span>
        </span>
        ${icono('adelante', 'chev')}
      </a>
      ${botonEstrella(e.id)}
    </div>`;
}

function tarjetaDominio(d) {
  const n = escalasDe(d.id).length;
  return `
    <a class="tarjeta-dominio${n ? '' : ' vacio'}" href="#/d/${d.id}">
      <span class="ico-dominio">${icono(d.id)}</span>
      <span class="dom-nombre">${esc(d.nombre)}</span>
      <span class="dom-cuenta">${n ? plural(n, 'escala', 'escalas') : 'Próximamente'}</span>
    </a>`;
}

/* ---------- Vistas ---------- */

function vistaInicio() {
  const val = almacen.valoracion();
  const favs = almacen.favoritas().filter((id) => porId[id]);
  const n = val.resultados.length;
  return `
    <section class="vista inicio">
      <header class="cabecera">
        <p class="ceja">Valoración geriátrica integral</p>
        <h1>¿Qué vas a valorar?</h1>
      </header>
      <label class="buscador">
        ${icono('buscar')}
        <input id="buscar" type="search" placeholder="Buscar escala, sigla o dominio" aria-label="Buscar escala" autocomplete="off" enterkeyhint="search">
      </label>
      <div id="busqueda" hidden></div>
      <div id="contenido-inicio">
        ${n ? `
          <a class="en-curso" href="#/valoracion">
            ${icono('valoracion')}
            <span><strong>Valoración en curso</strong><span>${plural(n, 'escala añadida', 'escalas añadidas')}</span></span>
            ${icono('adelante', 'chev')}
          </a>` : ''}
        ${favs.length ? `
          <h2 class="seccion">Favoritas</h2>
          <div class="lista-escalas">${favs.map((id) => filaEscala(porId[id], { conDominio: true })).join('')}</div>` : ''}
        <h2 class="seccion">Dominios</h2>
        <div class="rejilla-dominios">${DOMINIOS.map(tarjetaDominio).join('')}</div>
      </div>
    </section>`;
}

function resultadosBusqueda(q) {
  const t = sinAcentos(q.trim());
  const disponibles = escalas.filter((e) =>
    sinAcentos([e.nombre, e.corto, ...(e.aliases || []), dominioDe(e.dominio).nombre].join(' ')).includes(t));
  const planeadas = DOMINIOS.flatMap((d) => d.planeadas.map((nombre) => ({ nombre, d })))
    .filter(({ nombre, d }) => sinAcentos(`${nombre} ${d.nombre}`).includes(t));
  if (!disponibles.length && !planeadas.length) {
    return `<p class="busqueda-vacia">No hay escalas que coincidan con «${esc(q)}».</p>`;
  }
  return `
    ${disponibles.length ? `<div class="lista-escalas" style="margin-top:16px">${disponibles.map((e) => filaEscala(e, { conDominio: true })).join('')}</div>` : ''}
    ${planeadas.length ? `
      <h2 class="seccion">Próximamente</h2>
      <div class="lista-escalas">${planeadas.map(({ nombre, d }) => `<div class="prox-fila"><span>${esc(nombre)}</span><span>${esc(d.nombre)}</span></div>`).join('')}</div>` : ''}`;
}

function vistaDominio({ id }) {
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
        : '<p class="vacio-texto">Aún no hay escalas en este dominio.</p>'}
      ${d.planeadas.length ? `
        <h2 class="seccion">Próximamente</h2>
        <ul class="chips">${d.planeadas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
    </section>`;
}

function reactivo(it, i, resp) {
  const sel = resp[it.id];
  return `
    <div class="reactivo${it.compacto ? ' compacto' : ''}${sel != null ? ' contestado' : ''}" id="r-${it.id}" role="radiogroup" aria-labelledby="t-${it.id}">
      <p class="reactivo-titulo" id="t-${it.id}"><span class="num" aria-hidden="true">${i + 1}</span><span>${esc(it.texto)}</span></p>
      ${it.ayuda ? `<p class="ayuda">${esc(it.ayuda)}</p>` : ''}
      <div class="opciones">
        ${it.opciones.map((o, j) => `
          <label class="opcion">
            <input type="radio" name="${it.id}" value="${j}"${sel === j ? ' checked' : ''}>
            <span class="op-texto">
              <span class="op-titulo">${esc(o.texto)}</span>
              ${o.detalle ? `<span class="op-detalle">${esc(o.detalle)}</span>` : ''}
            </span>
            <span class="op-pts" aria-hidden="true">${o.valor}</span>
            <span class="sr">(${o.valor} ${o.valor === 1 ? 'punto' : 'puntos'})</span>
          </label>`).join('')}
      </div>
    </div>`;
}

function pieEscala(e, res) {
  return `
    <div class="parcial">
      <span class="parcial-etq">${res.completo ? 'Puntaje' : 'Parcial'}</span>
      <span class="parcial-num">${res.puntaje}<small>/${e.max}</small></span>
    </div>
    <span class="progreso">${res.contestadas} de ${res.total}</span>
    <button type="button" class="btn btn-primario" id="ver-resultado">Ver resultado ${icono('flecha')}</button>`;
}

function vistaEscala({ id }) {
  const e = porId[id];
  const d = dominioDe(e.dominio);
  const resp = almacen.respuestas(id);
  const res = calcular(e, resp);
  return `
    <section class="vista escala">
      <a class="migas" href="#/d/${d.id}">${icono('atras')} ${esc(d.nombre)}</a>
      <header class="cabecera cabecera-escala">
        <div>
          <p class="ceja">${esc(d.nombre)}</p>
          <h1>${esc(e.nombre)}</h1>
          <p class="entradilla">${esc(e.descripcion)}</p>
        </div>
        ${botonEstrella(e.id)}
      </header>
      <details class="como-aplicar">
        <summary>${icono('info')} Cómo aplicarla <span>· ${esc(e.tiempo)}</span></summary>
        <p>${esc(e.aplicacion)}</p>
      </details>
      <form id="form-escala" class="reactivos" novalidate>
        ${e.items.map((it, i) => reactivo(it, i, resp)).join('')}
      </form>
      <div class="pie-escala" id="pie-escala" style="--avance:${(res.contestadas / res.total) * 100}%">${pieEscala(e, res)}</div>
    </section>`;
}

function vistaResultado({ id }) {
  const e = porId[id];
  const res = calcular(e, almacen.respuestas(id));
  const b = res.banda;
  const resumen = resumenDe(e, res);
  const enVal = almacen.valoracion().resultados.find((r) => r.escalaId === id);
  const pos = posicionMarcador(e, res.puntaje);
  const estadoBoton = !enVal ? 'nuevo' : enVal.resumen === resumen ? 'igual' : 'distinto';
  return `
    <section class="vista resultado">
      <a class="migas" href="#/e/${id}">${icono('atras')} ${esc(e.corto)}</a>
      <article class="tarjeta-resultado nivel-${b.nivel}">
        <h1 class="ceja">${esc(e.corto)} · Resultado</h1>
        <p class="puntaje"><span class="puntaje-num">${res.puntaje}</span><span class="puntaje-de">/ ${e.max} puntos</span></p>
        <p class="chip nivel-${b.nivel}"><span class="punto" aria-hidden="true"></span>${esc(b.etiqueta)}</p>
        <div class="barra-bandas" role="img" aria-label="Puntaje ${res.puntaje}: ${esc(b.etiqueta)}">
          ${e.bandas.map((x) => `<span class="seg nivel-${x.nivel}"></span>`).join('')}
          <span class="marcador" style="left:${(pos * 100).toFixed(2)}%" aria-hidden="true">${res.puntaje}</span>
        </div>
        <ul class="lista-bandas">
          ${e.bandas.map((x) => `
            <li class="nivel-${x.nivel}${x === b ? ' actual' : ''}"${x === b ? ' aria-current="true"' : ''}>
              <span class="punto" aria-hidden="true"></span><span class="rango">${rangoTexto(x)}</span><span>${esc(x.etiqueta)}</span>
            </li>`).join('')}
        </ul>
        <p class="interpretacion">${esc(b.texto)}</p>
        ${e.notas?.length ? `<ul class="notas">${e.notas.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
        <h2 class="sub">Respuestas</h2>
        <dl class="desglose">
          ${res.desglose.map(({ item, opcion }) => `
            <div><dt>${esc(item.texto)}</dt><dd><span>${esc(opcion.texto)}</span><strong>${opcion.valor}</strong></dd></div>`).join('')}
        </dl>
        <details class="referencias">
          <summary>${icono('libro')} Referencias</summary>
          <ol>${e.referencias.map((r) => `<li>${esc(r.texto)}${r.doi ? ` <a href="https://doi.org/${esc(r.doi)}" target="_blank" rel="noopener">doi:${esc(r.doi)}</a>` : ''}</li>`).join('')}</ol>
        </details>
      </article>
      <div class="acciones">
        <button class="btn btn-primario" type="button" id="agregar"${estadoBoton === 'igual' ? ' data-agregado' : ''}>
          ${estadoBoton === 'igual' ? `${icono('check')} En la valoración` : estadoBoton === 'distinto' ? `${icono('reiniciar')} Actualizar en la valoración` : `${icono('mas')} Añadir a la valoración`}
        </button>
        <button class="btn ancho" type="button" id="copiar">${icono('copiar')} Copiar resumen</button>
        <a class="btn" href="#/e/${id}">${icono('editar')} Revisar<span class="amplio">&nbsp;respuestas</span></a>
        <button class="btn" type="button" id="nueva">${icono('reiniciar')} <span class="corto">Repetir</span><span class="amplio">Nueva aplicación</span></button>
      </div>
      <p class="texto-nota"><span class="ceja">Texto para el expediente</span>${esc(resumen)}</p>
    </section>`;
}

function filaResultado(r) {
  const e = porId[r.escalaId];
  return `
    <div class="fila-resultado nivel-${r.nivel}">
      <a class="fr-enlace" href="#/e/${r.escalaId}/resultado" data-cargar="${r.escalaId}">
        <span class="punto" aria-hidden="true"></span>
        <span class="fr-texto">
          <span class="fr-nombre">${esc(e.nombre)}</span>
          <span class="fr-res">${r.puntaje}/${r.max} · ${esc(r.etiqueta)}</span>
        </span>
      </a>
      <button class="btn-icono" type="button" data-quitar="${r.escalaId}" aria-label="Quitar ${esc(e.corto)} de la valoración">${icono('cerrar')}</button>
    </div>`;
}

function vistaValoracion() {
  const v = almacen.valoracion();
  const p = v.paciente || {};
  const grupos = DOMINIOS.map((d) => {
    const rs = v.resultados.filter((r) => porId[r.escalaId]?.dominio === d.id);
    if (!rs.length) return '';
    return `<p class="ceja grupo-val">${esc(d.nombre)}</p>${rs.map(filaResultado).join('')}`;
  }).join('');
  return `
    <section class="vista valoracion">
      <header class="cabecera">
        <p class="ceja">Valoración en curso</p>
        <h1>Valoración</h1>
        <p class="entradilla">Se guarda solo en este dispositivo, sin nombre ni datos de identificación.</p>
      </header>
      <div class="tarjeta">
        <p class="titulo-tarjeta">Datos del paciente <span>(opcionales)</span></p>
        <div class="campos">
          <label class="campo"><span>Edad</span><input id="p-edad" type="number" inputmode="numeric" min="0" max="120" value="${esc(p.edad ?? '')}"></label>
          <label class="campo"><span>Sexo</span>
            <select id="p-sexo">
              <option value="">—</option>
              <option value="mujer"${p.sexo === 'mujer' ? ' selected' : ''}>Mujer</option>
              <option value="hombre"${p.sexo === 'hombre' ? ' selected' : ''}>Hombre</option>
            </select>
          </label>
          <label class="campo"><span>Escolaridad</span><input id="p-escolaridad" type="number" inputmode="numeric" min="0" max="30" placeholder="años" value="${esc(p.escolaridad ?? '')}"></label>
        </div>
      </div>
      ${v.resultados.length ? `
        <div class="resultados-val">${grupos}</div>
        <h2 class="seccion">Nota para el expediente</h2>
        <pre class="nota" id="nota">${esc(notaValoracion(v, porId, DOMINIOS))}</pre>
        <div class="acciones dos">
          <button class="btn btn-primario" type="button" id="copiar-nota">${icono('copiar')} Copiar nota</button>
          <button class="btn" type="button" id="nueva-val">${icono('borrar')} Nueva valoración</button>
        </div>` : `
        <div class="vacio-estado">
          ${icono('valoracion')}
          <p>Aún no has añadido escalas</p>
          <p class="sub-vacio">Aplica una escala y toca «Añadir a la valoración».</p>
          <a class="btn btn-primario" href="#/">Ir a las escalas</a>
        </div>`}
    </section>`;
}

function vistaFavoritas() {
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
            <p class="sub-vacio">Toca la estrella de cualquier escala para tenerla aquí.</p>
            <a class="btn btn-primario" href="#/">Ir a las escalas</a>
          </div>`}
    </section>`;
}

function vistaAcerca() {
  const t = almacen.tema();
  const opcionTema = (valor, texto) =>
    `<label><input type="radio" name="tema" value="${valor}"${t === valor ? ' checked' : ''}> ${texto}</label>`;
  return `
    <section class="vista acerca">
      <header class="cabecera">
        <p class="ceja">Versión ${VERSION}</p>
        <h1>Acerca de Huella</h1>
      </header>
      <div class="prosa">
        <p>Escalas de valoración geriátrica integral del Dr. Manuel Bustillos, geriatra: se llenan, se interpretan y generan el texto para el expediente.</p>
        <h2>Privacidad</h2>
        <p>Todo se calcula en el navegador; no se envía nada a ningún servidor. La valoración en curso se guarda solo en este dispositivo y no incluye nombre ni datos de identificación.</p>
        <h2>Uso clínico</h2>
        <p>Es un apoyo para aplicar e interpretar escalas; no sustituye el juicio clínico. Los puntos de corte corresponden a las referencias citadas en cada escala.</p>
        <h2>Tema</h2>
        <div class="selector-tema" role="radiogroup" aria-label="Tema">
          ${opcionTema('auto', 'Automático')}${opcionTema('claro', 'Claro')}${opcionTema('oscuro', 'Oscuro')}
        </div>
        <h2>Instalar en el celular</h2>
        <ul>
          <li><strong>iPhone:</strong> en Safari, toca Compartir y después «Agregar a inicio».</li>
          <li><strong>Android:</strong> en Chrome, abre el menú ⋮ y toca «Instalar app» o «Agregar a la pantalla principal».</li>
        </ul>
        <p>Una vez instalada funciona sin conexión.</p>
        <h2>Créditos</h2>
        <p class="discreto">Íconos: Lucide (licencia ISC). Tipografías: Fraunces e Inter Tight (SIL Open Font License 1.1).</p>
      </div>
    </section>`;
}

/* ---------- Interacción por vista ---------- */

const MONTAJES = {
  inicio() {
    const input = $('#buscar');
    const caja = $('#busqueda');
    const contenido = $('#contenido-inicio');
    input.addEventListener('input', () => {
      const q = input.value;
      const hay = q.trim().length > 0;
      caja.hidden = !hay;
      contenido.hidden = hay;
      if (hay) caja.innerHTML = resultadosBusqueda(q);
    });
  },

  escala({ id }) {
    const e = porId[id];
    const form = $('#form-escala');
    const pie = $('#pie-escala');

    form.addEventListener('change', (ev) => {
      const input = ev.target;
      if (input.type !== 'radio') return;
      const resp = almacen.respuestas(id);
      resp[input.name] = Number(input.value);
      almacen.guardarRespuestas(id, resp);
      const tarjeta = input.closest('.reactivo');
      tarjeta.classList.remove('falta');
      tarjeta.classList.add('contestado');
      const res = calcular(e, resp);
      pie.innerHTML = pieEscala(e, res);
      pie.style.setProperty('--avance', `${(res.contestadas / res.total) * 100}%`);
      avanzar(tarjeta);
    });

    pie.addEventListener('click', (ev) => {
      if (!ev.target.closest('#ver-resultado')) return;
      const res = calcular(e, almacen.respuestas(id));
      if (res.completo) {
        location.hash = `#/e/${id}/resultado`;
        return;
      }
      res.faltan.forEach((itemId) => $(`#r-${itemId}`).classList.add('falta'));
      const primero = $(`#r-${res.faltan[0]}`);
      primero.scrollIntoView({ block: 'center', behavior: movimientoReducido() ? 'auto' : 'smooth' });
      primero.querySelector('input').focus({ preventScroll: true });
      aviso(`Falta${res.faltan.length === 1 ? '' : 'n'} ${plural(res.faltan.length, 'reactivo', 'reactivos')} por contestar`);
    });
  },

  resultado({ id }) {
    const e = porId[id];
    const res = calcular(e, almacen.respuestas(id));
    const resumen = resumenDe(e, res);
    $('#agregar').addEventListener('click', (ev) => {
      almacen.agregarResultado({
        escalaId: id,
        puntaje: res.puntaje,
        max: res.max,
        nivel: res.banda.nivel,
        etiqueta: res.banda.etiqueta,
        resumen,
        respuestas: { ...almacen.respuestas(id) },
        fecha: Date.now(),
      });
      const btn = ev.currentTarget;
      btn.dataset.agregado = '';
      btn.innerHTML = `${icono('check')} En la valoración`;
      renderNavegacion(ruta());
      aviso('Añadido a la valoración');
    });
    $('#copiar').addEventListener('click', () => copiar(resumen));
    $('#nueva').addEventListener('click', () => {
      almacen.guardarRespuestas(id, {});
      location.hash = `#/e/${id}`;
    });
  },

  valoracion() {
    const actualizarNota = () => {
      const nota = $('#nota');
      if (nota) nota.textContent = notaValoracion(almacen.valoracion(), porId, DOMINIOS);
    };
    const guardarPaciente = () => {
      const v = almacen.valoracion();
      v.paciente = {
        edad: $('#p-edad').value,
        sexo: $('#p-sexo').value,
        escolaridad: $('#p-escolaridad').value,
      };
      almacen.guardarValoracion(v);
      actualizarNota();
    };
    ['#p-edad', '#p-sexo', '#p-escolaridad'].forEach((s) => $(s).addEventListener('input', guardarPaciente));
    $('#copiar-nota')?.addEventListener('click', () => copiar($('#nota').textContent));
    // Confirmación en dos toques, sin cuadros de diálogo del navegador.
    let armado = null;
    $('#nueva-val')?.addEventListener('click', (ev) => {
      const btn = ev.currentTarget;
      if (!armado) {
        btn.innerHTML = `${icono('borrar')} Toca otra vez para borrar`;
        armado = setTimeout(() => {
          armado = null;
          btn.innerHTML = `${icono('borrar')} Nueva valoración`;
        }, 4000);
        return;
      }
      clearTimeout(armado);
      almacen.nuevaValoracion();
      render();
      aviso('Valoración borrada; empieza una nueva');
    });
  },

  acerca() {
    vista.querySelectorAll('input[name="tema"]').forEach((input) =>
      input.addEventListener('change', () => {
        almacen.guardarTema(input.value);
        aplicarTema();
        renderNavegacion(ruta());
      }));
  },
};

function avanzar(tarjeta) {
  const siguiente = [...document.querySelectorAll('.reactivo')].find((r) => !r.querySelector('input:checked'));
  if (!siguiente) return;
  const { top } = siguiente.getBoundingClientRect();
  if (top > window.innerHeight * 0.62) {
    siguiente.scrollIntoView({ block: 'center', behavior: movimientoReducido() ? 'auto' : 'smooth' });
  }
}

/* ---------- Eventos globales ---------- */

document.addEventListener('click', (ev) => {
  const fav = ev.target.closest('[data-fav]');
  if (fav) {
    const id = fav.dataset.fav;
    const ahora = almacen.alternarFavorita(id);
    document.querySelectorAll(`[data-fav="${id}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', String(ahora));
      b.setAttribute('aria-label', `${ahora ? 'Quitar de' : 'Agregar a'} favoritas: ${porId[id].corto}`);
    });
    aviso(ahora ? 'Agregada a favoritas' : 'Quitada de favoritas');
    return;
  }
  const quitar = ev.target.closest('[data-quitar]');
  if (quitar) {
    almacen.quitarResultado(quitar.dataset.quitar);
    render();
    aviso('Quitada de la valoración');
    return;
  }
  const cargar = ev.target.closest('[data-cargar]');
  if (cargar) {
    const r = almacen.valoracion().resultados.find((x) => x.escalaId === cargar.dataset.cargar);
    if (r?.respuestas) almacen.guardarRespuestas(r.escalaId, r.respuestas);
    return;
  }
  if (ev.target.closest('[data-tema]')) {
    almacen.guardarTema(temaOscuro() ? 'claro' : 'oscuro');
    aplicarTema();
    renderNavegacion(ruta());
  }
});

/* ---------- Utilidades ---------- */

let temporizadorAviso;
function aviso(mensaje) {
  const el = $('#aviso');
  el.textContent = mensaje;
  el.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.classList.remove('visible'), 2200);
}

async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  aviso('Copiado al portapapeles');
}

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
  $('meta[name="theme-color"]').setAttribute('content', temaOscuro() ? '#1c1613' : '#fbf6ec');
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
