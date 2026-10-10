// Pantallas de un instrumento: aplicación (campos) y resultado (interpretación, comparación y texto).
import { almacen } from '../almacen.js';
import { porId, dominioDe, momentoPorDefecto } from '../datos.js';
import {
  calcular, resumenDe, resumenBreveDe, textoEscala, posicionMarcador, rangoTexto, campoVisible, leerNumero,
  TIPOS, MOMENTOS, momentoDe, FUENTES, MOTIVOS_NO_EVALUABLE, minusculaInicial,
} from '../motor.js';
import { compararMomentos, valorGuardado, fechaCorta } from '../nota.js';
import {
  $, $$, esc, icono, plural, aviso, copiar, botonEstrella, selectorFormato, alCambiarFormato,
  ETIQUETA_COPIAR, movimientoReducido, hoyISO, chipTipo,
} from '../ui.js';
import { pasosConEstado, siguientePendiente, urlPaso } from './rutas-estado.js';

/* ---------- Contexto y direcciones ---------- */

export function contexto({ id, momento, ruta }) {
  const e = porId[id];
  const m = momentoPorDefecto(e, ruta, momento);
  const base = ruta ? `#/r/${ruta.id}/${id}` : `#/e/${id}`;
  const url = (mm = m) => `${base}${e.momentos ? `@${mm}` : ''}`;
  return { e, momento: m, ruta, url: url(), urlResultado: `${url()}/resultado`, urlMomento: url };
}

const paciente = () => almacen.valoracion().paciente || {};

function ultimoSppb() {
  const rs = almacen.valoracion().resultados.filter((r) => r.escalaId === 'sppb' && r.puntaje != null);
  return rs.length ? rs.sort((a, b) => (b.guardado || 0) - (a.guardado || 0))[0].puntaje : null;
}

// Completa con los datos del paciente los campos marcados con prefill (sin sobrescribir respuestas).
function precargar(e, r) {
  const p = paciente();
  let cambio = false;
  for (const c of e.campos) {
    if (!c.prefill || (r[c.id] != null && r[c.id] !== '')) continue;
    let v;
    if (c.prefill === 'edad' && p.edad) v = String(p.edad);
    if (c.prefill === 'sexo' && p.sexo) { const i = c.opciones.findIndex((o) => o.clave === p.sexo); if (i >= 0) v = i; }
    if (c.prefill === 'escolaridad12' && p.escolaridad !== '' && p.escolaridad != null) v = Number(p.escolaridad) <= 12 ? 0 : 1;
    if (c.prefill === 'sppb') { const s = ultimoSppb(); if (s != null) v = String(s); }
    if (v !== undefined) { r[c.id] = v; cambio = true; }
  }
  return cambio;
}

export function respuestasDe(ctx) {
  const r = { ...almacen.respuestas(ctx.e.id, ctx.momento) };
  if (precargar(ctx.e, r)) almacen.guardarRespuestas(ctx.e.id, ctx.momento, r);
  return r;
}

export const calcularCtx = (e, r) => calcular(e, r, { paciente: paciente() });

/* ---------- Piezas ---------- */

function fichaEscala(e) {
  return `
    <details class="ficha">
      <summary>${icono('info')} Objetivo, población e instrucciones <span>· ${esc(e.tiempo)}</span></summary>
      <dl class="ficha-datos">
        <div><dt>Tipo</dt><dd>${esc(TIPOS[e.tipo])}</dd></div>
        <div><dt>Objetivo</dt><dd>${esc(e.objetivo)}</dd></div>
        <div><dt>Población</dt><dd>${esc(e.poblacion)}</dd></div>
        <div><dt>Tiempo</dt><dd>${esc(e.tiempo)}</dd></div>
      </dl>
      <p class="ficha-sub">Cómo aplicarla</p>
      <ol class="ficha-pasos">${e.aplicacion.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
      ${e.licencia ? `<p class="ficha-licencia">${icono('escudo')} ${esc(e.licencia.texto)}${e.licencia.enlace ? ` <a href="${esc(e.licencia.enlace)}" target="_blank" rel="noopener">Sitio oficial</a>` : ''}</p>` : ''}
    </details>`;
}

function selectorMomento(ctx) {
  const guardados = almacen.valoracion().resultados.filter((r) => r.escalaId === ctx.e.id).map((r) => r.momento);
  const m = momentoDe(ctx.momento);
  return `
    <div class="momentos">
      <p class="momentos-etq">Momento de la evaluación</p>
      <nav class="segmentado ancho" aria-label="Momento de la evaluación">
        ${MOMENTOS.map((x) => `
          <a href="${ctx.urlMomento(x.id)}" class="${x.id === ctx.momento ? 'activo' : ''}"${x.id === ctx.momento ? ' aria-current="true"' : ''}>
            ${esc(x.nombre)}${guardados.includes(x.id) ? '<span class="punto-guardado" aria-label="guardado"></span>' : ''}
          </a>`).join('')}
      </nav>
      <p class="momentos-ayuda">${esc(m.ayuda)}. Cada momento se guarda por separado; uno nuevo no sustituye al basal.</p>
    </div>`;
}

function datosAplicacion(e, r) {
  return `
    <div class="aplicacion">
      <label class="campo-mini"><span>${icono('calendario')} Fecha de aplicación</span><input type="date" id="a-fecha" value="${esc(r._fecha || hoyISO())}" max="${hoyISO()}"></label>
      ${e.fuente ? `
        <label class="campo-mini"><span>Fuente de información</span>
          <select id="a-fuente">
            <option value="">Sin especificar</option>
            ${FUENTES.map((f) => `<option value="${f.id}"${r._fuente === f.id ? ' selected' : ''}>${esc(f.nombre)}</option>`).join('')}
          </select>
        </label>` : ''}
    </div>`;
}

function bloqueNoEvaluable(r) {
  return `
    <details class="no-evaluable"${r._noEvaluable ? ' open' : ''}>
      <summary>${icono('alerta')} No fue posible aplicarla</summary>
      <label class="campo-mini"><span>Motivo</span>
        <select id="ne-motivo">
          <option value="">— Sí fue posible aplicarla —</option>
          ${MOTIVOS_NO_EVALUABLE.map((m) => `<option${r._noEvaluable === m ? ' selected' : ''}>${esc(m)}</option>`).join('')}
        </select>
      </label>
      <p>Se registrará como «no evaluable», distinto de «sin responder», y no se interpretará.</p>
    </details>`;
}

function avisoGuardado(ctx, g) {
  const m = ctx.e.momentos ? ` ${momentoDe(ctx.momento).enNota}` : '';
  return `<p class="nota-guardado">${icono('completo')} Ya hay un resultado${m} en la valoración: ${esc(valorGuardado(g))}${g.fecha ? `, ${fechaCorta(g.fecha)}` : ''}. Si cambias las respuestas, se pedirá confirmación antes de reemplazarlo.</p>`;
}

function encabezadoCampo(c, n, etiquetaPara = '') {
  const titulo = `<span class="num" aria-hidden="true">${n}</span><span>${esc(c.texto)}</span>`;
  return etiquetaPara
    ? `<label class="reactivo-titulo" for="${etiquetaPara}" id="t-${c.id}">${titulo}</label>`
    : `<p class="reactivo-titulo" id="t-${c.id}">${titulo}</p>`;
}

function campoOpciones(c, n, r) {
  const sel = r[c.id];
  const clases = ['reactivo', c.compacto && 'compacto', c.compactoNumerico && 'numerico', c.secundario && 'secundario', sel != null && 'contestado'].filter(Boolean).join(' ');
  return `
    <div class="${clases}" id="r-${c.id}" data-campo="${c.id}" role="radiogroup" aria-labelledby="t-${c.id}">
      ${c.secundario ? `<p class="reactivo-titulo sub" id="t-${c.id}">${esc(c.texto)} <span>(opcional)</span></p>` : encabezadoCampo(c, n)}
      ${c.ayuda ? `<p class="ayuda">${esc(c.ayuda)}</p>` : ''}
      <div class="opciones">
        ${c.opciones.map((o, j) => {
          const pts = c.puntua !== false && !c.anotaA && !o.especial && !c.compactoNumerico;
          return `
          <label class="opcion${o.especial ? ' especial' : ''}">
            <input type="radio" name="${c.id}" value="${j}"${Number(sel) === j && sel !== '' && sel != null ? ' checked' : ''}>
            <span class="op-texto">
              <span class="op-titulo">${esc(o.texto)}</span>
              ${o.detalle ? `<span class="op-detalle">${esc(o.detalle)}</span>` : ''}
            </span>
            ${pts ? `<span class="op-pts" aria-hidden="true">${o.valor}</span><span class="sr">(${o.valor} ${o.valor === 1 ? 'punto' : 'puntos'})</span>` : ''}
          </label>`;
        }).join('')}
      </div>
    </div>`;
}

function campoNumero(c, n, r) {
  const u = c.unidades ? (c.unidades.find((x) => x.id === r[`${c.id}_u`]) || c.unidades[0]) : null;
  return `
    <div class="reactivo campo-numero${r[c.id] != null && r[c.id] !== '' ? ' contestado' : ''}" id="r-${c.id}" data-campo="${c.id}">
      ${encabezadoCampo(c, n, `n-${c.id}`)}
      ${c.ayuda ? `<p class="ayuda">${esc(c.ayuda)}</p>` : ''}
      <div class="entrada-numero">
        <input id="n-${c.id}" name="${c.id}" type="text" inputmode="decimal" autocomplete="off" value="${esc(r[c.id] ?? '')}" aria-describedby="e-${c.id}"${c.opcional ? '' : ' aria-required="true"'}>
        ${c.unidades
          ? `<select id="u-${c.id}" name="${c.id}_u" aria-label="Unidad">${c.unidades.map((x) => `<option value="${x.id}"${x === u ? ' selected' : ''}>${esc(x.etiqueta)}</option>`).join('')}</select>`
          : `<span class="unidad">${esc(c.unidad || '')}</span>`}
      </div>
      <p class="error-campo" id="e-${c.id}" role="alert" hidden></p>
    </div>`;
}

function campoChecklist(c, n, r) {
  const marcadas = Array.isArray(r[c.id]) ? r[c.id] : [];
  return `
    <fieldset class="reactivo campo-lista contestado" id="r-${c.id}" data-campo="${c.id}">
      <legend class="reactivo-titulo" id="t-${c.id}"><span class="num" aria-hidden="true">${n}</span><span>${esc(c.texto)}</span></legend>
      ${c.ayuda ? `<p class="ayuda">${esc(c.ayuda)}</p>` : ''}
      <div class="casillas">
        ${c.opciones.map((o) => `
          <label class="casilla"><input type="checkbox" name="${c.id}" value="${o.id}"${marcadas.includes(o.id) ? ' checked' : ''}><span>${esc(o.texto)}</span></label>`).join('')}
      </div>
      <p class="cuenta-lista" id="cuenta-${c.id}">${plural(marcadas.length, 'marcada', 'marcadas')}</p>
    </fieldset>`;
}

function htmlCampo(c, n, r) {
  if (c.tipo === 'numero') return campoNumero(c, n, r);
  if (c.tipo === 'checklist') return campoChecklist(c, n, r);
  return campoOpciones(c, n, r);
}

function pieEscala(e, res, r) {
  let etq;
  let num;
  if (r._noEvaluable) { etq = 'Resultado'; num = 'No evaluable'; }
  else if (!e.calcular) { etq = res.completo ? 'Puntaje' : 'Parcial'; num = `${res.puntaje ?? 0}<small>/${e.max}</small>`; }
  else if (res.completo) { etq = 'Resultado'; num = `${esc(res.mostrar)}<small> ${esc(res.sufijo)}</small>`; }
  else { etq = 'Avance'; num = `${res.contestadas}<small> de ${res.total}</small>`; }
  return `
    <div class="parcial">
      <span class="parcial-etq">${etq}</span>
      <span class="parcial-num">${num}</span>
    </div>
    ${r._noEvaluable || e.calcular ? '' : `<span class="progreso">${res.contestadas} de ${res.total}</span>`}
    <button type="button" class="btn btn-primario" id="ver-resultado">Ver resultado ${icono('flecha')}</button>`;
}

/* ---------- Tira de ruta ---------- */

function pasoActual(ctx) {
  if (!ctx.ruta) return null;
  const pasos = pasosConEstado(ctx.ruta);
  const i = pasos.findIndex((p) => p.id === ctx.e.id && p.momento === ctx.momento);
  return { pasos, actual: pasos[i] || null, i };
}

function tiraRuta(ctx) {
  const pa = pasoActual(ctx);
  if (!pa?.actual) return `<a class="migas" href="#/r/${ctx.ruta.id}">${icono('atras')} ${esc(ctx.ruta.nombre)}</a>`;
  const disponibles = pa.pasos.filter((p) => p.estado !== 'plan');
  const k = disponibles.indexOf(pa.actual) + 1;
  const completos = disponibles.filter((p) => p.estado === 'completo').length;
  const anterior = disponibles[k - 2];
  const siguiente = disponibles[k];
  return `
    <nav class="tira-ruta" aria-label="Ruta: ${esc(ctx.ruta.nombre)}">
      <div class="tira-cab">
        <a class="tira-nombre" href="#/r/${ctx.ruta.id}">${icono('ruta')} ${esc(ctx.ruta.nombre)}</a>
        <span class="tira-paso">Paso ${k} de ${disponibles.length} · ${completos} completos</span>
      </div>
      <div class="tira-barra" aria-hidden="true"><span style="width:${(completos / disponibles.length) * 100}%"></span></div>
      <div class="tira-acciones">
        ${anterior ? `<a class="btn btn-chico" href="${urlPaso(ctx.ruta, anterior)}">${icono('atras')} Anterior</a>` : '<span></span>'}
        <button class="btn btn-chico" type="button" id="omitir-paso">${icono('omitir')} Omitir</button>
        ${siguiente ? `<a class="btn btn-chico" href="${urlPaso(ctx.ruta, siguiente)}">Siguiente ${icono('adelante')}</a>` : `<a class="btn btn-chico" href="#/r/${ctx.ruta.id}">Ver ruta ${icono('adelante')}</a>`}
      </div>
    </nav>`;
}

function montarTiraRuta(ctx) {
  const btn = $('#omitir-paso');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const pa = pasoActual(ctx);
    almacen.alternarOmitida(ctx.ruta.id, pa.actual.clave, true);
    const sig = siguientePendiente(ctx.ruta, pa.i);
    aviso(`${ctx.e.corto} omitido`);
    location.hash = sig ? urlPaso(ctx.ruta, sig) : `#/r/${ctx.ruta.id}`;
  });
}

/* ---------- Vista: aplicar el instrumento ---------- */

export function renderEscala(params) {
  const ctx = contexto(params);
  const { e } = ctx;
  const d = dominioDe(e.dominio);
  const r = respuestasDe(ctx);
  const res = calcularCtx(e, r);
  const guardado = almacen.resultado(e.id, ctx.momento);
  let n = 0;
  const campos = e.campos.map((c) => {
    const visible = campoVisible(c, r);
    if (visible && !c.secundario) n += 1;
    const html = htmlCampo(c, n, r);
    return visible ? html : html.replace(/^(\s*<(div|fieldset))/, '$1 hidden');
  }).join('');
  return `
    <section class="vista escala">
      ${ctx.ruta ? tiraRuta(ctx) : `<a class="migas" href="#/d/${d.id}">${icono('atras')} ${esc(d.nombre)}</a>`}
      <header class="cabecera cabecera-escala">
        <div>
          <p class="ceja">${esc(d.nombre)}</p>
          <h1>${esc(e.nombre)}</h1>
          <p class="entradilla">${esc(e.descripcion)}</p>
          <p class="etiquetas">${chipTipo(e)}</p>
        </div>
        ${botonEstrella(e.id)}
      </header>
      ${fichaEscala(e)}
      ${e.momentos ? selectorMomento(ctx) : ''}
      ${datosAplicacion(e, r)}
      ${guardado ? avisoGuardado(ctx, guardado) : ''}
      ${e.permiteNoEvaluable ? bloqueNoEvaluable(r) : ''}
      <form id="form-escala" class="reactivos${r._noEvaluable ? ' inactivo' : ''}" novalidate>${campos}</form>
      <div class="pie-escala" id="pie-escala" style="--avance:${res.total ? (res.contestadas / res.total) * 100 : 0}%">${pieEscala(e, res, r)}</div>
    </section>`;
}

export function montarEscala(params) {
  const ctx = contexto(params);
  const { e } = ctx;
  almacen.registrarUso(e.id);
  const form = $('#form-escala');
  const pie = $('#pie-escala');
  let r = respuestasDe(ctx);

  const guardar = () => almacen.guardarRespuestas(e.id, ctx.momento, r);

  const actualizar = () => {
    // Visibilidad y numeración
    let n = 0;
    for (const c of e.campos) {
      const tarjeta = $(`#r-${CSS.escape(c.id)}`);
      if (!tarjeta) continue;
      const visible = campoVisible(c, r);
      tarjeta.hidden = !visible;
      if (visible && !c.secundario) {
        n += 1;
        const num = tarjeta.querySelector('.num');
        if (num) num.textContent = n;
      }
    }
    const res = calcularCtx(e, r);
    // Errores de números
    for (const c of e.campos.filter((x) => x.tipo === 'numero')) {
      const err = $(`#e-${CSS.escape(c.id)}`);
      if (!err) continue;
      const leido = leerNumero(c, r);
      err.hidden = !leido.error;
      err.textContent = leido.error || '';
      $(`#r-${CSS.escape(c.id)}`).classList.toggle('con-error', Boolean(leido.error));
      $(`#r-${CSS.escape(c.id)}`).classList.toggle('contestado', leido.valor != null);
    }
    pie.innerHTML = pieEscala(e, res, r);
    pie.style.setProperty('--avance', `${res.total ? (res.contestadas / res.total) * 100 : 0}%`);
    return res;
  };

  form.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.type === 'radio') {
      r[el.name] = Number(el.value);
      const tarjeta = el.closest('.reactivo');
      tarjeta.classList.remove('falta');
      tarjeta.classList.add('contestado');
      guardar();
      actualizar();
      avanzar(tarjeta);
    } else if (el.type === 'checkbox') {
      r[el.name] = $$(`input[name="${CSS.escape(el.name)}"]:checked`, form).map((x) => x.value);
      $(`#cuenta-${CSS.escape(el.name)}`).textContent = plural(r[el.name].length, 'marcada', 'marcadas');
      guardar();
      actualizar();
    } else if (el.tagName === 'SELECT') {
      r[el.name] = el.value;
      guardar();
      actualizar();
    }
  });
  form.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.type !== 'text') return;
    r[el.name] = el.value;
    el.closest('.reactivo').classList.remove('falta');
    guardar();
    actualizar();
  });
  form.addEventListener('submit', (ev) => ev.preventDefault());

  $('#a-fecha')?.addEventListener('change', (ev) => { r._fecha = ev.target.value; guardar(); });
  $('#a-fuente')?.addEventListener('change', (ev) => { r._fuente = ev.target.value || undefined; guardar(); });
  $('#ne-motivo')?.addEventListener('change', (ev) => {
    r._noEvaluable = ev.target.value || undefined;
    form.classList.toggle('inactivo', Boolean(r._noEvaluable));
    guardar();
    actualizar();
  });

  pie.addEventListener('click', (ev) => {
    if (!ev.target.closest('#ver-resultado')) return;
    const res = actualizar();
    if (res.completo) {
      location.hash = ctx.urlResultado;
      return;
    }
    const pendientes = [...res.faltan, ...Object.keys(res.errores)];
    pendientes.forEach((id) => $(`#r-${CSS.escape(id)}`)?.classList.add('falta'));
    const primero = $(`#r-${CSS.escape(pendientes[0])}`);
    if (primero) {
      primero.scrollIntoView({ block: 'center', behavior: movimientoReducido() ? 'auto' : 'smooth' });
      primero.querySelector('input, select')?.focus({ preventScroll: true });
    }
    const n = res.faltan.length;
    aviso(Object.keys(res.errores).length ? 'Revisa los valores marcados' : `Falta${n === 1 ? '' : 'n'} ${plural(n, 'dato', 'datos')} por contestar`);
  });

  montarTiraRuta(ctx);
  actualizar();
}

function avanzar() {
  const siguiente = $$('.reactivo:not([hidden]):not(.secundario)').find((x) => !x.classList.contains('contestado'));
  if (!siguiente) return;
  const { top } = siguiente.getBoundingClientRect();
  if (top > window.innerHeight * 0.62) siguiente.scrollIntoView({ block: 'center', behavior: movimientoReducido() ? 'auto' : 'smooth' });
}

/* ---------- Resultado ---------- */

// Objeto que se guarda en la valoración.
export function aGuardado(e, res, r, momento) {
  return {
    escalaId: e.id,
    momento,
    puntaje: res.puntaje,
    max: res.max,
    valor: res.valor,
    unidad: res.unidad,
    mostrar: res.mostrar,
    nivel: res.banda.nivel,
    etiqueta: res.banda.etiqueta,
    hallazgo: Boolean(res.banda.hallazgo),
    sugerencias: res.banda.sugerencias || [],
    resumen: resumenDe(e, res),
    breve: resumenBreveDe(e, res),
    noEvaluable: res.noEvaluable || null,
    respuestas: { ...r },
    fecha: r._fecha || hoyISO(),
    fuente: r._fuente || null,
  };
}

// Texto de la escala con el momento, la fuente y la fecha cuando aplican.
export function textoConContexto(e, res, r, momento, formato) {
  let t = textoEscala(e, res, formato);
  if (momento && momento !== 'actual') t = t.replace(e.corto, `${e.corto} ${momentoDe(momento).enNota}`);
  const extra = [];
  const cambio = textoCambioEscala(e, res, r, momento);
  if (cambio) extra.push(cambio);
  if (r._fuente) extra.push(`Fuente: ${FUENTES.find((f) => f.id === r._fuente).nombre.toLowerCase()}.`);
  if (r._fecha && r._fecha !== hoyISO()) extra.push(`Fecha: ${fechaCorta(r._fecha)}.`);
  if (!extra.length) return t;
  return formato === 'lista' ? `${t}\n${extra.join(' ')}` : `${t} ${extra.join(' ')}`;
}

// «Basal: 95/100 (dependencia escasa); disminución de 50 puntos respecto al basal.»
function textoCambioEscala(e, res, r, momento) {
  if (!e.momentos || !momento || res.noEvaluable) return '';
  const otros = almacen.valoracion().resultados.filter((x) => x.escalaId === e.id && x.momento && x.momento !== momento);
  if (!otros.length) return '';
  const yo = aGuardado(e, res, r, momento);
  const cmp = compararMomentos([...otros, yo], e);
  if (!cmp) return '';
  const previos = cmp.lista.filter((x) => x !== yo).map((x) => `${mayus(momentoDe(x.momento).enNota)}: ${valorGuardado(x)}`).join('; ');
  const c = cmp.comparaciones.find((x) => x.r === yo);
  if (!c || c.dif == null) return `${previos}.`;
  const base = c.dif < 0 ? `disminución de ${Math.abs(c.dif)} ${e.unidadCambio || 'puntos'}` : c.dif > 0 ? `aumento de ${c.dif} ${e.unidadCambio || 'puntos'}` : 'sin cambio en el puntaje';
  return `${previos}; ${base} respecto al ${cmp.ref.momento === 'basal' ? 'basal' : momentoDe(cmp.ref.momento).enNota}.`;
}

const esActual = (x, b) => x === b || (x.id && b.id && x.id === b.id) || (x.min != null && x.min === b.min && x.max === b.max && !b.id);

function bloqueComparacion(ctx, actualGuardable) {
  const otros = almacen.valoracion().resultados.filter((r) => r.escalaId === ctx.e.id && r.momento && r.momento !== ctx.momento);
  if (!otros.length) return '';
  const cmp = compararMomentos([...otros, actualGuardable], ctx.e);
  if (!cmp) return '';
  const fila = (r) => {
    const c = cmp.comparaciones.find((x) => x.r === r);
    const dif = c?.dif == null ? '—' : c.dif === 0 ? 'Sin cambio' : `${c.dif > 0 ? '+' : '−'}${Math.abs(c.dif)}`;
    return `<tr${r === actualGuardable ? ' class="actual"' : ''}>
      <th scope="row">${esc(momentoDe(r.momento).nombre)}${r === actualGuardable ? ' <span>(esta aplicación)</span>' : ''}</th>
      <td>${esc(valorGuardado(r))}</td>
      <td class="num-col">${r === cmp.ref ? 'Referencia' : dif}</td>
    </tr>`;
  };
  const yo = cmp.comparaciones.find((x) => x.r === actualGuardable);
  return `
    <section class="comparacion">
      <h2 class="sub">Comparación entre momentos</h2>
      <div class="tabla-envoltura"><table class="tabla">
        <thead><tr><th>Momento</th><th>Resultado</th><th class="num-col">Cambio vs ${esc(momentoDe(cmp.ref.momento).nombre.toLowerCase())}</th></tr></thead>
        <tbody>${cmp.lista.map(fila).join('')}</tbody>
      </table></div>
      ${yo?.empeoradas.length ? `<p class="comparacion-nota">${esc(mayus(ctx.e.textoEmpeoradas || 'reactivos con menor puntaje'))}: ${esc(yo.empeoradas.map(minusculaInicial).join(', '))}.</p>` : ''}
      <p class="comparacion-nota discreta">El cambio describe la diferencia de puntaje; no establece su causa ni si es reversible.</p>
    </section>`;
}
const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function tablaDetalle(d) {
  return `
    <section class="detalle">
      <h2 class="sub">${esc(d.titulo)}</h2>
      <div class="tabla-envoltura"><table class="tabla">
        <thead><tr>${d.encabezados.map((h, i) => `<th${i === d.encabezados.length - 1 ? ' class="num-col"' : ''}>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${d.filas.map((f) => `<tr>${f.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td${i === f.length - 1 ? ' class="num-col"' : ''}>${esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody>
      </table></div>
    </section>`;
}

export function renderResultado(params) {
  const ctx = contexto(params);
  const { e } = ctx;
  const r = respuestasDe(ctx);
  const res = calcularCtx(e, r);
  if (!res.completo) return null;
  const b = res.banda;
  const formato = almacen.formatoEscala();
  const guardable = aGuardado(e, res, r, ctx.momento);
  const existente = almacen.resultado(e.id, ctx.momento);
  const igual = existente && existente.resumen === guardable.resumen && existente.fecha === guardable.fecha && (existente.fuente || null) === guardable.fuente;
  const barra = e.barra !== false && !res.noEvaluable && (res.puntaje != null || res.valor != null) && e.bandas.every((x) => x.min != null);
  const valorBarra = res.puntaje ?? res.valor;
  const pos = barra ? posicionMarcador(e, valorBarra, b) : 0;
  const m = e.momentos ? momentoDe(ctx.momento) : null;
  const pa = pasoActual(ctx);
  const etiquetaPrincipal = ctx.ruta ? (igual ? 'Continuar' : 'Guardar y continuar') : igual ? 'En la valoración' : existente ? 'Actualizar en la valoración' : 'Añadir a la valoración';
  const icoPrincipal = ctx.ruta ? 'flecha' : igual ? 'check' : existente ? 'reiniciar' : 'mas';

  return `
    <section class="vista resultado">
      ${ctx.ruta && pa?.actual ? tiraRuta(ctx) : `<a class="migas" href="${ctx.url}">${icono('atras')} ${esc(e.corto)}</a>`}
      <article class="tarjeta-resultado nivel-${b.nivel}">
        <h1 class="ceja">${esc(e.corto)} · Resultado${m ? ` · ${esc(m.nombre)}` : ''}</h1>
        ${res.noEvaluable
          ? `<p class="puntaje"><span class="puntaje-texto">No evaluable</span></p>`
          : `<p class="puntaje"><span class="puntaje-num${String(res.mostrar).length > 4 ? ' largo' : ''}">${esc(res.mostrar)}</span><span class="puntaje-de">${esc(res.sufijo)}</span></p>`}
        <p class="chip nivel-${b.nivel}"><span class="punto" aria-hidden="true"></span>${esc(b.etiqueta)}</p>
        ${barra ? `
          <div class="barra-bandas" role="img" aria-label="${esc(`${res.mostrar} ${res.unidad || ''}: ${b.etiqueta}`)}">
            ${e.bandas.map((x) => `<span class="seg nivel-${x.nivel}"></span>`).join('')}
            <span class="marcador" style="left:${(pos * 100).toFixed(2)}%" aria-hidden="true">${esc(res.mostrar)}</span>
          </div>` : ''}
        ${!res.noEvaluable && e.bandas?.length ? `
          <ul class="lista-bandas${barra ? '' : ' sin-barra'}">
            ${e.bandas.map((x) => {
              const act = esActual(x, b);
              return `<li class="nivel-${x.nivel}${act ? ' actual' : ''}"${act ? ' aria-current="true"' : ''}><span class="punto" aria-hidden="true"></span><span class="rango">${esc(rangoTexto(x))}</span><span>${esc(x.etiqueta)}</span></li>`;
            }).join('')}
          </ul>` : ''}
        <p class="interpretacion">${esc(b.texto)}</p>
        ${res.lineas?.length ? `<ul class="lineas">${res.lineas.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
        ${(res.detalles || []).map(tablaDetalle).join('')}
        ${e.momentos && !res.noEvaluable ? bloqueComparacion(ctx, guardable) : ''}
        ${b.sugerencias?.length ? `
          <section class="sugerencias">
            <h2 class="sub">${icono('bombilla')} Sugerencias de evaluación complementaria</h2>
            <p class="sugerencias-nota">Orientativas; no son resultados del instrumento ni sustituyen el juicio clínico.</p>
            <ul>${b.sugerencias.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          </section>` : ''}
        <h2 class="sub">Limitaciones e interpretación</h2>
        <ul class="notas">${e.notas.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
        ${res.desglose.length && !res.noEvaluable ? `
          <h2 class="sub">Respuestas</h2>
          <dl class="desglose">
            ${res.desglose.map((d) => `
              <div><dt>${esc(d.campo.texto)}</dt><dd><span>${esc(d.respuesta)}${d.anotacion ? ` · ${esc(minusculaInicial(d.anotacion))}` : ''}</span>${d.valor != null ? `<strong>${d.valor}</strong>` : ''}</dd></div>`).join('')}
          </dl>` : ''}
        <details class="referencias">
          <summary>${icono('libro')} Referencias${e.licencia ? ' y licencia' : ''}</summary>
          <ol>${e.referencias.map((x) => `<li>${esc(x.texto)}${x.doi ? ` <a href="https://doi.org/${esc(x.doi)}" target="_blank" rel="noopener">doi:${esc(x.doi)}</a>` : ''}${x.enlace ? ` <a href="${esc(x.enlace)}" target="_blank" rel="noopener">Enlace</a>` : ''}</li>`).join('')}</ol>
          ${e.licencia ? `<p class="ficha-licencia">${icono('escudo')} ${esc(e.licencia.texto)}</p>` : ''}
        </details>
      </article>
      <div class="cabecera-nota">
        <h2 class="seccion">Texto para el expediente</h2>
        ${selectorFormato(formato)}
      </div>
      <pre class="nota" id="texto-escala" data-formato="${formato}">${esc(textoConContexto(e, res, r, ctx.momento, formato))}</pre>
      <div class="acciones">
        <button class="btn btn-primario" type="button" id="agregar"${igual && !ctx.ruta ? ' data-agregado' : ''}>${icono(icoPrincipal)} ${etiquetaPrincipal}</button>
        <button class="btn ancho" type="button" id="copiar">${icono('copiar')} ${ETIQUETA_COPIAR[formato]}</button>
        <a class="btn" href="${ctx.url}">${icono('editar')} Revisar<span class="amplio">&nbsp;respuestas</span></a>
        ${ctx.ruta
          ? `<a class="btn" href="#/r/${ctx.ruta.id}">${icono('ruta')} <span class="corto">Ruta</span><span class="amplio">Ver la ruta</span></a>`
          : `<button class="btn" type="button" id="nueva">${icono('reiniciar')} <span class="corto">Repetir</span><span class="amplio">Nueva aplicación</span></button>`}
      </div>
    </section>`;
}

export function montarResultado(params, alGuardar) {
  const ctx = contexto(params);
  const { e } = ctx;
  const r = respuestasDe(ctx);
  const res = calcularCtx(e, r);
  const guardable = aGuardado(e, res, r, ctx.momento);
  const existente = almacen.resultado(e.id, ctx.momento);
  const igual = existente && existente.resumen === guardable.resumen && existente.fecha === guardable.fecha && (existente.fuente || null) === guardable.fuente;
  const btn = $('#agregar');
  let armado = null;

  const continuarRuta = () => {
    const pa = pasoActual(ctx);
    const sig = siguientePendiente(ctx.ruta, pa?.i ?? -1);
    location.hash = sig ? urlPaso(ctx.ruta, sig) : `#/r/${ctx.ruta.id}`;
  };

  btn.addEventListener('click', () => {
    if (igual) {
      if (ctx.ruta) continuarRuta();
      return;
    }
    if (existente && !armado) {
      const m = e.momentos ? ` ${momentoDe(ctx.momento).enNota}` : '';
      btn.innerHTML = `${icono('alerta')} Toca otra vez para reemplazar el resultado${m} guardado (${esc(valorGuardado(existente))})`;
      btn.classList.add('armado');
      armado = setTimeout(() => {
        armado = null;
        btn.classList.remove('armado');
        btn.innerHTML = `${icono(ctx.ruta ? 'flecha' : 'reiniciar')} ${ctx.ruta ? 'Guardar y continuar' : 'Actualizar en la valoración'}`;
      }, 5000);
      return;
    }
    clearTimeout(armado);
    almacen.agregarResultado(guardable);
    alGuardar();
    if (ctx.ruta) {
      aviso(`${e.corto} guardado`);
      continuarRuta();
      return;
    }
    btn.classList.remove('armado');
    btn.dataset.agregado = '';
    btn.innerHTML = `${icono('check')} En la valoración`;
    aviso(existente ? 'Resultado actualizado en la valoración' : 'Añadido a la valoración');
  });

  alCambiarFormato(document, (formato) => {
    const f = formato === 'lista' ? 'lista' : 'parrafo';
    const pre = $('#texto-escala');
    pre.dataset.formato = f;
    pre.textContent = textoConContexto(e, res, r, ctx.momento, f);
    $('#copiar').innerHTML = `${icono('copiar')} ${ETIQUETA_COPIAR[f]}`;
  });
  $('#copiar').addEventListener('click', () => {
    const f = almacen.formatoEscala();
    copiar(textoConContexto(e, res, r, ctx.momento, f), f === 'parrafo' ? 'Copiado en párrafo' : 'Copiado en lista');
  });
  $('#nueva')?.addEventListener('click', () => {
    almacen.guardarRespuestas(e.id, ctx.momento, {});
    location.hash = ctx.url;
  });
  montarTiraRuta(ctx);
}
