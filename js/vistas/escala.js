// Pantallas de un instrumento: aplicación (campos) y resultado (interpretación, comparación y texto).
import { almacen } from '../almacen.js';
import { porId, dominioDe, momentoPorDefecto } from '../datos.js';
import {
  calcular, resumenDe, resumenBreveDe, textoEscala, posicionMarcador, rangoTexto, campoVisible,
  limpiarOcultas, TIPOS, MOMENTOS, momentoDe, FUENTES, MOTIVOS_NO_EVALUABLE, minusculaInicial, NINGUNO, TEXTO_NINGUNO,
} from '../motor.js';
import {
  compararResultados, esUnico, etiquetaAplicacion, fechaCorta, textoRespectoA, textoCambio, vigenteDe, diasEntre,
} from '../comparacion.js';
import { valorGuardado } from '../nota.js';
import {
  $, $$, esc, icono, plural, aviso, copiar, botonEstrella, selectorFormato, alCambiarFormato,
  ETIQUETA_COPIAR, movimientoReducido, hoyISO, chipTipo,
} from '../ui.js';
import { pasosConEstado, siguientePendiente, urlPaso } from './rutas-estado.js';

/* ---------- Contexto y direcciones ---------- */

export function contexto({ id, momento, ruta }) {
  const e = porId[id];
  const m = momentoPorDefecto(e, ruta, momento, ruta ? almacen.momentoRuta(ruta.id) : null);
  const base = ruta ? `#/r/${ruta.id}/${id}` : `#/e/${id}`;
  const url = (mm = m) => `${base}${e.momentos ? `@${mm}` : ''}`;
  return { e, momento: m, ruta, url: url(), urlResultado: `${url()}/resultado`, urlMomento: url };
}

const paciente = () => almacen.valoracion().paciente || {};

// Completa con los datos clínicos de la valoración los campos marcados con prefill (sin sobrescribir respuestas).
function precargar(e, r) {
  const p = paciente();
  let cambio = false;
  for (const c of e.campos) {
    if (!c.prefill || (r[c.id] != null && r[c.id] !== '')) continue;
    let v;
    if (c.prefill === 'edad' && p.edad) v = String(p.edad);
    if (c.prefill === 'sexo' && p.sexo) { const i = c.opciones.findIndex((o) => o.clave === p.sexo); if (i >= 0) v = i; }
    if (c.prefill === 'escolaridad12' && p.escolaridad !== '' && p.escolaridad != null) v = Number(p.escolaridad) <= 12 ? 0 : 1;
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

/* ---------- Datos vinculados de otras pruebas ---------- */

// Aplicación más reciente del instrumento fuente en la valoración en curso.
function candidatoVinculo(vin) {
  const rs = almacen.resultadosDe(vin.escala).filter((x) => !x.noEvaluable);
  return rs.length ? vigenteDe(rs) : null;
}

const antiguedad = (fecha) => {
  if (!fecha) return '';
  const d = diasEntre(fecha, hoyISO());
  return d <= 0 ? 'hoy' : d === 1 ? 'hace 1 día' : `hace ${d} días`;
};

function panelVinculos(e, r) {
  if (!e.vinculos?.length) return '';
  const usados = r._vinculos || {};
  const filas = e.vinculos.map((vin) => {
    const fuente = porId[vin.escala];
    const res = candidatoVinculo(vin);
    if (!res) return `<li class="vinculo sin-dato">${icono('pendiente')}<div><strong>${esc(vin.titulo)}</strong><span>Sin registro de ${esc(fuente.corto)} en esta valoración.</span></div></li>`;
    const etq = etiquetaAplicacion(res) || fechaCorta(res.fecha);
    const disp = vin.disponible(res);
    if (disp !== true) return `<li class="vinculo no-aplica">${icono('alerta')}<div><strong>${esc(vin.titulo)}</strong> <span class="vin-fecha">${esc(etq)}</span><span>${esc(disp)}</span></div></li>`;
    const adv = vin.advertencia?.(res);
    const dias = res.fecha ? diasEntre(res.fecha, hoyISO()) : 0;
    const usado = usados[vin.id]?.resultadoId === res.id;
    return `
      <li class="vinculo${usado ? ' usado' : ''}">
        ${icono(usado ? 'completo' : 'ruta')}
        <div>
          <strong>${esc(vin.titulo)}</strong> <span class="vin-fecha">${esc(etq)} · ${esc(antiguedad(res.fecha))}</span>
          <span>${esc(vin.describir(res))}</span>
          ${adv ? `<span class="vin-adv">${esc(adv)}</span>` : ''}
          ${dias > 30 ? '<span class="vin-adv">Tiene más de 30 días: confirma que siga vigente.</span>' : ''}
        </div>
        ${usado ? '<span class="vin-usado">En uso</span>' : `<button class="btn btn-chico" type="button" data-vincular="${esc(vin.id)}">Usar este dato</button>`}
      </li>`;
  }).join('');
  return `
    <section class="vinculos" id="vinculos" aria-labelledby="vinculos-t">
      <h2 class="sub" id="vinculos-t">Datos de otras pruebas en esta valoración</h2>
      <p class="vin-nota">Huella no los usa sin tu confirmación. Revisa la fecha y que sigan siendo válidos.</p>
      <ul>${filas}</ul>
    </section>`;
}

function notaVinculo(c, r) {
  const v = Object.values(r._vinculos || {}).find((x) => x.campos?.includes(c.id));
  if (!v) return '';
  return `<p class="dato-vinculado">${icono('completo')} Tomado de ${esc(v.titulo)}${v.etiqueta ? ` ${esc(v.etiqueta)}` : ''}${v.fecha ? `, ${esc(fechaCorta(v.fecha))}` : ''}. Si lo cambias, deja de vincularse.</p>`;
}

/* ---------- Piezas ---------- */

function fichaEscala(e) {
  return `
    <details class="ficha">
      <summary>${icono('info')} Objetivo, población e instrucciones <span>· ${esc(e.tiempo)}</span></summary>
      <dl class="ficha-datos">
        <div><dt>Tipo</dt><dd>${esc(TIPOS[e.tipo])}${e.registro ? ' · registro de resultado (no reproduce los reactivos)' : ''}</dd></div>
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
  const guardados = almacen.resultadosDe(ctx.e.id).map((r) => r.momento);
  const m = momentoDe(ctx.momento);
  return `
    <div class="momentos">
      <p class="momentos-etq">Momento clínico</p>
      <nav class="segmentado ancho" aria-label="Momento clínico de la evaluación">
        ${MOMENTOS.map((x) => `
          <a href="${ctx.urlMomento(x.id)}" class="${x.id === ctx.momento ? 'activo' : ''}"${x.id === ctx.momento ? ' aria-current="true"' : ''}>
            ${esc(x.nombre)}${guardados.includes(x.id) ? '<span class="punto-guardado" aria-label="con resultado guardado"></span>' : ''}
          </a>`).join('')}
      </nav>
      <p class="momentos-ayuda">${esc(m.ayuda)}. El momento clínico es distinto de la fecha de aplicación. Basal, ingreso y egreso admiten un resultado; «actual» admite varias aplicaciones con distinta fecha.</p>
    </div>`;
}

function datosAplicacion(e, r, momento) {
  const hoy = hoyISO();
  return `
    <div class="aplicacion">
      <label class="campo-mini"><span>${icono('calendario')} Fecha de aplicación</span><input type="date" id="a-fecha" value="${esc(r._fecha || hoy)}" max="${hoy}"></label>
      ${momento === 'basal' ? `
        <label class="campo-mini"><span>Fecha del estado basal (si se conoce)</span><input type="date" id="a-fecha-basal" value="${esc(r._fechaBasal || '')}" max="${esc(r._fecha || hoy)}" aria-describedby="ayuda-basal"></label>` : ''}
      ${e.fuente ? `
        <label class="campo-mini"><span>Fuente de información</span>
          <select id="a-fuente">
            <option value="">Sin especificar</option>
            ${FUENTES.map((f) => `<option value="${f.id}"${r._fuente === f.id ? ' selected' : ''}>${esc(f.nombre)}</option>`).join('')}
          </select>
        </label>` : ''}
    </div>
    ${momento === 'basal' ? '<p class="ayuda-aplicacion" id="ayuda-basal">El estado basal describe a la persona antes del episodio agudo (por ejemplo, 2 semanas antes del ingreso); la fecha de aplicación es cuando lo registras.</p>' : ''}
    <p class="error-campo" id="e-fechas" role="alert" hidden></p>`;
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

// Aplicaciones ya guardadas de este instrumento, con opción de abrir una para corregirla.
function avisoGuardados(ctx, r) {
  const todos = almacen.resultadosDe(ctx.e.id);
  if (!todos.length) return '';
  const origen = r._origen ? almacen.resultadoPorId(r._origen) : null;
  const filas = [...todos].sort((a, b) => ((b.fecha || '') > (a.fecha || '') ? 1 : -1)).map((g) => {
    const etq = etiquetaAplicacion(g) || fechaCorta(g.fecha) || 'sin fecha';
    const editando = origen?.id === g.id;
    return `<li><span><strong>${esc(etq)}</strong> · ${esc(valorGuardado(g))}</span>${editando ? '<span class="vin-usado">Corrigiendo</span>' : `<button class="btn btn-chico" type="button" data-corregir="${esc(g.id)}">Corregir</button>`}</li>`;
  }).join('');
  return `
    <div class="nota-guardado">
      ${icono('completo')}
      <div>
        <p>${todos.length === 1 ? 'Este instrumento ya tiene una aplicación' : `Este instrumento ya tiene ${todos.length} aplicaciones`} en la valoración. Al guardar se pedirá confirmación antes de reemplazar un resultado.</p>
        <ul class="lista-guardados">${filas}</ul>
      </div>
    </div>`;
}

function encabezadoCampo(c, n, etiquetaPara = '') {
  const titulo = `<span class="num" aria-hidden="true">${n}</span><span>${esc(c.texto)}</span>`;
  return etiquetaPara
    ? `<label class="reactivo-titulo" for="${etiquetaPara}" id="t-${c.id}">${titulo}</label>`
    : `<p class="reactivo-titulo" id="t-${c.id}">${titulo}</p>`;
}

const notaPrefill = (c) => (c.prefill ? '<p class="ayuda prefill">Se completa con los datos clínicos de la valoración; verifícalo.</p>' : '');

function campoOpciones(c, n, r) {
  const sel = r[c.id];
  const clases = ['reactivo', c.compacto && 'compacto', c.compactoNumerico && 'numerico', c.secundario && 'secundario', sel != null && sel !== '' && 'contestado'].filter(Boolean).join(' ');
  return `
    <div class="${clases}" id="r-${c.id}" data-campo="${c.id}" role="radiogroup" aria-labelledby="t-${c.id}">
      ${c.secundario ? `<p class="reactivo-titulo sub" id="t-${c.id}">${esc(c.texto)} <span>(opcional)</span></p>` : encabezadoCampo(c, n)}
      ${c.ayuda ? `<p class="ayuda">${esc(c.ayuda)}</p>` : ''}
      ${notaPrefill(c)}
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
      ${notaVinculo(c, r)}
    </div>`;
}

function campoNumero(c, n, r) {
  const u = c.unidades ? (c.unidades.find((x) => x.id === r[`${c.id}_u`]) || c.unidades[0]) : null;
  return `
    <div class="reactivo campo-numero${r[c.id] != null && r[c.id] !== '' ? ' contestado' : ''}" id="r-${c.id}" data-campo="${c.id}">
      ${encabezadoCampo(c, n, `n-${c.id}`)}
      ${c.ayuda ? `<p class="ayuda">${esc(c.ayuda)}</p>` : ''}
      ${notaPrefill(c)}
      <div class="entrada-numero">
        <input id="n-${c.id}" name="${c.id}" type="text" inputmode="decimal" autocomplete="off" value="${esc(r[c.id] ?? '')}" aria-describedby="e-${c.id}"${c.opcional ? '' : ' aria-required="true"'}>
        ${c.unidades
          ? `<select id="u-${c.id}" name="${c.id}_u" aria-label="Unidad">${c.unidades.map((x) => `<option value="${x.id}"${x === u ? ' selected' : ''}>${esc(x.etiqueta)}</option>`).join('')}</select>`
          : `<span class="unidad">${esc(c.unidad || '')}</span>`}
      </div>
      <p class="error-campo" id="e-${c.id}" role="alert" hidden></p>
      ${notaVinculo(c, r)}
    </div>`;
}

const estadoLista = (marcadas) => {
  if (marcadas.includes(NINGUNO)) return 'Confirmado: ninguno';
  const n = marcadas.length;
  return n ? plural(n, 'marcada', 'marcadas') : 'Sin responder: marca las presentes o «Ninguno de los anteriores»';
};

function campoChecklist(c, n, r) {
  const marcadas = Array.isArray(r[c.id]) ? r[c.id] : [];
  const contestado = marcadas.length > 0;
  return `
    <fieldset class="reactivo campo-lista${contestado ? ' contestado' : ''}" id="r-${c.id}" data-campo="${c.id}">
      <legend class="reactivo-titulo" id="t-${c.id}"><span class="num" aria-hidden="true">${n}</span><span>${esc(c.texto)}</span></legend>
      ${c.ayuda ? `<p class="ayuda">${esc(c.ayuda)}</p>` : ''}
      <div class="casillas">
        ${c.opciones.map((o) => `
          <label class="casilla"><input type="checkbox" name="${c.id}" value="${o.id}"${marcadas.includes(o.id) ? ' checked' : ''}><span>${esc(o.texto)}</span></label>`).join('')}
        <label class="casilla ninguno"><input type="checkbox" name="${c.id}" value="${NINGUNO}"${marcadas.includes(NINGUNO) ? ' checked' : ''}><span>${esc(TEXTO_NINGUNO)}</span></label>
      </div>
      <p class="cuenta-lista" id="cuenta-${c.id}" aria-live="polite">${esc(estadoLista(marcadas))}</p>
      <p class="error-campo" id="e-${c.id}" role="alert" hidden></p>
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
  const nucleo = disponibles.filter((p) => !p.complementario);
  const k = disponibles.indexOf(pa.actual) + 1;
  const completos = nucleo.filter((p) => p.estado === 'completo').length;
  const anterior = disponibles[k - 2];
  const siguiente = disponibles[k];
  return `
    <nav class="tira-ruta" aria-label="Ruta: ${esc(ctx.ruta.nombre)}">
      <div class="tira-cab">
        <a class="tira-nombre" href="#/r/${ctx.ruta.id}">${icono('ruta')} ${esc(ctx.ruta.nombre)}</a>
        <span class="tira-paso">${pa.actual.complementario ? 'Complementaria' : `Paso ${nucleo.indexOf(pa.actual) + 1} de ${nucleo.length}`} · ${completos} completos</span>
      </div>
      <div class="tira-barra" aria-hidden="true"><span style="width:${nucleo.length ? (completos / nucleo.length) * 100 : 0}%"></span></div>
      ${pa.actual.nota ? `<p class="tira-nota">${icono('info')} ${esc(pa.actual.nota)}</p>` : ''}
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
      ${datosAplicacion(e, r, ctx.momento)}
      ${avisoGuardados(ctx, r)}
      ${panelVinculos(e, r)}
      ${e.permiteNoEvaluable ? bloqueNoEvaluable(r) : ''}
      <form id="form-escala" class="reactivos${r._noEvaluable ? ' inactivo' : ''}" novalidate>${campos}</form>
      <div class="pie-escala" id="pie-escala" style="--avance:${res.total ? (res.contestadas / res.total) * 100 : 0}%">${pieEscala(e, res, r)}</div>
    </section>`;
}

function errorFechas(r) {
  if (r._fechaBasal && r._fecha && r._fechaBasal > r._fecha) return 'La fecha del estado basal no puede ser posterior a la fecha de aplicación.';
  if (r._fecha && r._fecha > hoyISO()) return 'La fecha de aplicación no puede ser futura.';
  return '';
}

export function montarEscala(params, rerender) {
  const ctx = contexto(params);
  const { e } = ctx;
  almacen.registrarUso(e.id);
  const form = $('#form-escala');
  const pie = $('#pie-escala');
  let r = respuestasDe(ctx);

  const guardar = () => almacen.guardarRespuestas(e.id, ctx.momento, r);

  // Un dato vinculado que se edita a mano deja de considerarse tomado de otra prueba.
  const desvincular = (campoId) => {
    if (!r._vinculos) return;
    let cambio = false;
    for (const [id, v] of Object.entries(r._vinculos)) {
      if (v.campos?.includes(campoId)) { delete r._vinculos[id]; cambio = true; }
    }
    if (!cambio) return;
    if (!Object.keys(r._vinculos).length) delete r._vinculos;
    const panel = $('#vinculos');
    if (panel) panel.outerHTML = panelVinculos(e, r);
    $$(`#r-${CSS.escape(campoId)} .dato-vinculado`).forEach((x) => x.remove());
    montarVinculos();
  };

  const actualizar = () => {
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
    for (const c of e.campos.filter((x) => x.tipo === 'numero' || x.tipo === 'checklist' || res.errores[x.id])) {
      const err = $(`#e-${CSS.escape(c.id)}`);
      const tarjeta = $(`#r-${CSS.escape(c.id)}`);
      if (!tarjeta) continue;
      const msg = campoVisible(c, r) ? res.errores[c.id] : '';
      if (err) { err.hidden = !msg; err.textContent = msg || ''; }
      tarjeta.classList.toggle('con-error', Boolean(msg));
      if (c.tipo === 'numero') tarjeta.classList.toggle('contestado', r[c.id] != null && r[c.id] !== '' && !msg);
      if (c.tipo === 'checklist') tarjeta.classList.toggle('contestado', Array.isArray(r[c.id]) && r[c.id].length > 0 && !msg);
    }
    pie.innerHTML = pieEscala(e, res, r);
    pie.style.setProperty('--avance', `${res.total ? (res.contestadas / res.total) * 100 : 0}%`);
    return res;
  };

  form.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.type === 'radio') {
      r[el.name] = Number(el.value);
      desvincular(el.name);
      const tarjeta = el.closest('.reactivo');
      tarjeta.classList.remove('falta');
      tarjeta.classList.add('contestado');
      guardar();
      actualizar();
      avanzar(tarjeta);
    } else if (el.type === 'checkbox') {
      const casillas = $$(`input[name="${CSS.escape(el.name)}"]`, form);
      // «Ninguno de los anteriores» excluye a los demás elementos y viceversa.
      if (el.checked && el.value === NINGUNO) casillas.forEach((x) => { if (x !== el) x.checked = false; });
      if (el.checked && el.value !== NINGUNO) casillas.forEach((x) => { if (x.value === NINGUNO) x.checked = false; });
      r[el.name] = casillas.filter((x) => x.checked).map((x) => x.value);
      $(`#cuenta-${CSS.escape(el.name)}`).textContent = estadoLista(r[el.name]);
      el.closest('.reactivo').classList.remove('falta');
      guardar();
      actualizar();
    } else if (el.tagName === 'SELECT') {
      r[el.name] = el.value;
      desvincular(el.name.replace(/_u$/, ''));
      guardar();
      actualizar();
    }
  });
  form.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.type !== 'text') return;
    r[el.name] = el.value;
    desvincular(el.name);
    el.closest('.reactivo').classList.remove('falta');
    guardar();
    actualizar();
  });
  form.addEventListener('submit', (ev) => ev.preventDefault());

  const mostrarErrorFechas = () => {
    const msg = errorFechas(r);
    const p = $('#e-fechas');
    p.hidden = !msg;
    p.textContent = msg;
    return msg;
  };
  $('#a-fecha')?.addEventListener('change', (ev) => {
    r._fecha = ev.target.value || undefined;
    const basal = $('#a-fecha-basal');
    if (basal) basal.max = r._fecha || hoyISO();
    guardar();
    mostrarErrorFechas();
  });
  $('#a-fecha-basal')?.addEventListener('change', (ev) => { r._fechaBasal = ev.target.value || undefined; guardar(); mostrarErrorFechas(); });
  $('#a-fuente')?.addEventListener('change', (ev) => { r._fuente = ev.target.value || undefined; guardar(); });
  $('#ne-motivo')?.addEventListener('change', (ev) => {
    r._noEvaluable = ev.target.value || undefined;
    form.classList.toggle('inactivo', Boolean(r._noEvaluable));
    guardar();
    actualizar();
  });

  // Corregir una aplicación guardada: carga sus respuestas y recuerda cuál es.
  $$('[data-corregir]').forEach((b) => b.addEventListener('click', () => {
    const g = almacen.resultadoPorId(b.dataset.corregir);
    if (!g) return;
    almacen.guardarRespuestas(e.id, g.momento, { ...(g.respuestas || {}), _origen: g.id });
    const destino = ctx.urlMomento(g.momento);
    if (location.hash === destino) rerender();
    else location.hash = destino;
    aviso('Respuestas cargadas para corregir');
  }));

  function montarVinculos() {
    $$('[data-vincular]').forEach((b) => b.addEventListener('click', () => {
      const vin = e.vinculos.find((x) => x.id === b.dataset.vincular);
      const res = vin && candidatoVinculo(vin);
      if (!res) return;
      const otros = Object.entries(r._vinculos || {}).filter(([, v]) => v.campos?.some((c) => vin.campos.includes(c)));
      r = { ...r, ...vin.aplicar(res), _vinculos: { ...(r._vinculos || {}) } };
      for (const [id] of otros) delete r._vinculos[id];
      r._vinculos[vin.id] = {
        resultadoId: res.id, escalaId: vin.escala, titulo: vin.titulo, texto: vin.describir(res),
        etiqueta: etiquetaAplicacion(res, { conFecha: false }), fecha: res.fecha || null, campos: vin.campos,
      };
      guardar();
      const y = window.scrollY;
      rerender();
      window.scrollTo(0, y);
      aviso(`${vin.titulo}: dato aplicado`);
    }));
  }
  montarVinculos();

  pie.addEventListener('click', (ev) => {
    if (!ev.target.closest('#ver-resultado')) return;
    const res = actualizar();
    if (mostrarErrorFechas()) {
      $('#e-fechas').scrollIntoView({ block: 'center' });
      aviso('Revisa las fechas');
      return;
    }
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
  mostrarErrorFechas();
}

function avanzar() {
  const siguiente = $$('.reactivo:not([hidden]):not(.secundario)').find((x) => !x.classList.contains('contestado'));
  if (!siguiente) return;
  const { top } = siguiente.getBoundingClientRect();
  if (top > window.innerHeight * 0.62) siguiente.scrollIntoView({ block: 'center', behavior: movimientoReducido() ? 'auto' : 'smooth' });
}

/* ---------- Resultado ---------- */

// Objeto que se guarda en la valoración. Las respuestas ocultas no se guardan.
export function aGuardado(e, res, r, momento) {
  const respuestas = limpiarOcultas(e, r);
  delete respuestas._origen;
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
    alertas: res.alertas?.length ? [...res.alertas] : null,
    extras: res.noEvaluable ? null : JSON.parse(JSON.stringify(res.extras || {})),
    respuestas,
    fecha: r._fecha || hoyISO(),
    fechaReferencia: momento === 'basal' ? r._fechaBasal || null : null,
    fuente: r._fuente || null,
    vinculos: r._vinculos ? Object.values(r._vinculos).map(({ titulo, etiqueta, fecha, texto }) => ({ titulo, etiqueta, fecha, texto })) : null,
  };
}

const mismoContenido = (a, b) => a.resumen === b.resumen && a.fecha === b.fecha && (a.fuente || null) === (b.fuente || null)
  && (a.fechaReferencia || null) === (b.fechaReferencia || null);

// Qué hará el botón de guardar: agregar, reemplazar (con confirmación) o elegir entre nueva aplicación y reemplazo.
function planGuardado(ctx, guardable, r) {
  const slot = almacen.resultadosSlot(ctx.e.id, ctx.momento);
  const igual = slot.find((x) => mismoContenido(x, guardable)) || null;
  const unico = esUnico(ctx.momento);
  const origen = r._origen ? slot.find((x) => x.id === r._origen) || null : null;
  const mismaFecha = slot.find((x) => x.fecha === guardable.fecha) || null;
  const nombre = (x) => etiquetaAplicacion(x) || `del ${fechaCorta(x.fecha)}`;
  if (igual) return { igual, slot };
  if (!slot.length) return { accion: 'nuevo', slot };
  if (unico) return { accion: 'reemplazar', objetivo: slot[0], confirmar: `Reemplazar el resultado ${momentoDe(ctx.momento).enNota}`, slot, unico };
  const objetivo = origen || mismaFecha;
  if (objetivo) return { accion: 'reemplazar', objetivo, confirmar: `Actualizar la aplicación ${nombre(objetivo)}`, alterna: 'nuevo', slot };
  return { accion: 'nuevo', alterna: 'reemplazar', objetivo: slot[0], confirmar: `Reemplazar la aplicación ${nombre(slot[0])}`, slot };
}

// Resultados con los que se compara esta aplicación (sin el que reemplazaría por defecto).
function contextoComparacion(ctx, guardable, plan) {
  const quitar = plan.igual?.id || (plan.accion === 'reemplazar' ? plan.objetivo?.id : null);
  const otros = almacen.resultadosDe(ctx.e.id).filter((x) => x.id !== quitar);
  const yo = { ...guardable, id: '__esta', guardado: Date.now() };
  return { lista: [...otros, yo], yo };
}

// Texto de la escala con el momento, la fuente, la fecha y el cambio respecto a la referencia.
export function textoConContexto(e, res, r, momento, formato, cmpCtx = null) {
  let t = textoEscala(e, res, formato);
  const yo = cmpCtx?.yo;
  const etq = yo ? etiquetaAplicacion(yo, { conFecha: false }) : '';
  if (etq && momento !== 'actual') t = t.replace(e.corto, `${e.corto} ${etq}`);
  const extra = [];
  const cambio = cmpCtx ? textoCambioEscala(e, cmpCtx) : '';
  if (cambio) extra.push(cambio);
  if (r._fuente) extra.push(`Fuente: ${FUENTES.find((f) => f.id === r._fuente).nombre.toLowerCase()}.`);
  if (r._fecha && r._fecha !== hoyISO()) extra.push(`Fecha de aplicación: ${fechaCorta(r._fecha)}.`);
  if (!extra.length) return t;
  return formato === 'lista' ? `${t}\n${extra.join(' ')}` : `${t} ${extra.join(' ')}`;
}

function textoCambioEscala(e, { lista, yo }) {
  if (res0(yo) || lista.length < 2) return '';
  const cmp = compararResultados(lista, e);
  if (!cmp) return '';
  const previos = cmp.lista.filter((x) => x !== yo).map((x) => `${mayus(etiquetaAplicacion(x) || 'aplicación previa')}: ${valorGuardado(x)}`).join('; ');
  const f = cmp.filas.find((x) => x.r === yo);
  if (!f || f.esRef) return `${previos}.`;
  return `${previos}; ${textoCambio(f.vsRef, textoRespectoA(cmp.ref))}.`;
}
const res0 = (yo) => Boolean(yo.noEvaluable);
const mayus = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const ICONO_CAMBIO = { mejoria: ['↑', 'Mejoría'], empeoramiento: ['↓', 'Empeoramiento'], sin_cambio: ['=', 'Sin cambio'], sin_direccion: ['~', 'Sin dirección clínica'], no_interpretable: ['?', 'No interpretable'] };

function celdaCambio(c) {
  if (!c) return '—';
  const [simbolo, nombre] = ICONO_CAMBIO[c.tipo];
  const cifra = c.dif == null ? '' : c.tipo === 'sin_cambio' ? '' : ` ${c.dif > 0 ? '+' : '−'}${c.magnitud}`;
  return `<span class="cambio cambio-${c.tipo}" title="${esc(c.texto)}"><span aria-hidden="true">${simbolo}</span>${esc(cifra)} <span class="cambio-nombre">${esc(nombre)}</span></span>`;
}

function bloqueComparacion(ctx, cmpCtx) {
  if (cmpCtx.lista.length < 2) return '';
  const cmp = compararResultados(cmpCtx.lista, ctx.e);
  if (!cmp) return '';
  const fila = (f) => `
    <tr${f.r === cmpCtx.yo ? ' class="actual"' : ''}>
      <th scope="row">${esc(mayus(etiquetaAplicacion(f.r) || 'Aplicación'))}${f.r === cmpCtx.yo ? ' <span>(esta aplicación)</span>' : ''}</th>
      <td>${esc(valorGuardado(f.r))}</td>
      <td class="num-col">${f.esRef ? 'Referencia' : celdaCambio(f.vsRef)}</td>
    </tr>`;
  const yo = cmp.filas.find((x) => x.r === cmpCtx.yo);
  const avisos = [...new Set(cmp.filas.flatMap((f) => (f.esRef ? [] : f.vsRef.advertencias)))];
  return `
    <section class="comparacion">
      <h2 class="sub">Comparación entre aplicaciones</h2>
      <div class="tabla-envoltura"><table class="tabla">
        <thead><tr><th>Aplicación</th><th>Resultado</th><th class="num-col">Cambio vs ${esc(cmp.ref.momento === 'basal' ? 'basal' : 'referencia')}</th></tr></thead>
        <tbody>${cmp.filas.map(fila).join('')}</tbody>
      </table></div>
      ${yo && !yo.esRef ? `<p class="comparacion-nota">${esc(mayus(textoCambio(yo.vsRef, textoRespectoA(cmp.ref))))}.</p>` : ''}
      ${yo?.empeoradas?.length ? `<p class="comparacion-nota">${esc(mayus(ctx.e.textoEmpeoradas || 'reactivos que empeoraron'))}: ${esc(yo.empeoradas.map(minusculaInicial).join(', '))}.</p>` : ''}
      ${avisos.map((a) => `<p class="comparacion-nota aviso-cambio">${icono('alerta')} ${esc(a)}</p>`).join('')}
      <p class="comparacion-nota discreta">Orden cronológico por fecha de aplicación; el basal es la referencia si existe. El cambio describe la diferencia numérica y su dirección clínica; no establece su causa, su reversibilidad ni su relevancia.</p>
    </section>`;
}

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

const esActual = (x, b) => x === b || (x.id && b.id && x.id === b.id) || (x.min != null && x.min === b.min && x.max === b.max && !b.id);

function botonesGuardado(ctx, plan) {
  const enRuta = Boolean(ctx.ruta);
  if (plan.igual) {
    return { principal: enRuta ? [icono('flecha'), 'Continuar'] : [icono('check'), 'En la valoración'], alterna: null, nota: '' };
  }
  const nombreAccion = (accion) => (accion === 'nuevo'
    ? (plan.slot.length ? 'Guardar como nueva aplicación' : 'Añadir a la valoración')
    : plan.confirmar);
  const principal = [icono(plan.accion === 'nuevo' ? 'mas' : 'reiniciar'), `${nombreAccion(plan.accion)}${enRuta ? ' y continuar' : ''}`];
  const alterna = plan.alterna ? [icono(plan.alterna === 'nuevo' ? 'mas' : 'reiniciar'), nombreAccion(plan.alterna)] : null;
  let nota = '';
  if (plan.slot.length && !plan.unico) {
    const previa = plan.slot[0];
    nota = `Ya hay ${plan.slot.length === 1 ? 'una aplicación' : `${plan.slot.length} aplicaciones`} de este momento (la más reciente: ${etiquetaAplicacion(previa) || fechaCorta(previa.fecha)}, ${valorGuardado(previa)}). Una nueva aplicación conserva las anteriores; reemplazar pide confirmación.`;
  } else if (plan.unico) {
    nota = `Solo puede haber un resultado ${momentoDe(ctx.momento).enNota}: guardar reemplaza el actual (${valorGuardado(plan.slot[0])}) y pide confirmación.`;
  }
  return { principal, alterna, nota };
}

// Siguiente paso sugerido por el resultado: solo enlaza; nada se aplica ni se copia sin que el médico lo decida.
function bloqueSiguientes(e, res) {
  const xs = (e.siguientes || []).filter((x) => porId[x.id] && x.si(res));
  if (!xs.length) return '';
  return `
    <section class="siguientes">
      <h2 class="sub">${icono('ruta')} Siguiente paso sugerido</h2>
      <ul>${xs.map((x) => {
        const rs = almacen.resultadosDe(x.id);
        const vig = rs.length ? vigenteDe(rs) : null;
        return `<li><a href="#/e/${x.id}"><strong>${esc(porId[x.id].corto)}</strong>${icono('adelante', 'chev')}</a><span>${esc(x.motivo)}</span>${vig ? `<span class="sig-hecho">Ya en esta valoración (${esc(etiquetaAplicacion(vig) || fechaCorta(vig.fecha))}): ${esc(valorGuardado(vig))}</span>` : ''}</li>`;
      }).join('')}</ul>
    </section>`;
}

export function renderResultado(params) {
  const ctx = contexto(params);
  const { e } = ctx;
  const r = respuestasDe(ctx);
  const res = calcularCtx(e, r);
  if (!res.completo || errorFechas(r)) return null;
  const b = res.banda;
  const formato = almacen.formatoEscala();
  const guardable = aGuardado(e, res, r, ctx.momento);
  const plan = planGuardado(ctx, guardable, r);
  const cmpCtx = contextoComparacion(ctx, guardable, plan);
  const barra = e.barra !== false && !res.noEvaluable && (res.puntaje != null || res.valor != null) && e.bandas.every((x) => x.min != null);
  const valorBarra = res.puntaje ?? res.valor;
  const pos = barra ? posicionMarcador(e, valorBarra, b) : 0;
  const m = e.momentos ? momentoDe(ctx.momento) : null;
  const pa = pasoActual(ctx);
  const botones = botonesGuardado(ctx, plan);

  return `
    <section class="vista resultado">
      ${ctx.ruta && pa?.actual ? tiraRuta(ctx) : `<a class="migas" href="${ctx.url}">${icono('atras')} ${esc(e.corto)}</a>`}
      <article class="tarjeta-resultado nivel-${b.nivel}">
        <h1 class="ceja">${esc(e.corto)} · Resultado${m ? ` · ${esc(m.nombre)}` : ''}</h1>
        ${res.noEvaluable
          ? '<p class="puntaje"><span class="puntaje-texto">No evaluable</span></p>'
          : `<p class="puntaje"><span class="puntaje-num${String(res.mostrar).length > 4 ? ' largo' : ''}">${esc(res.mostrar)}</span><span class="puntaje-de">${esc(res.sufijo)}</span></p>`}
        <p class="chip nivel-${b.nivel}"><span class="punto" aria-hidden="true"></span>${esc(b.etiqueta)}</p>
        ${res.alertas?.length ? `
          <div class="alerta-seguridad" role="alert">
            ${icono('alerta')}
            <div>
              <p class="alerta-titulo">Requiere atención hoy</p>
              ${res.alertas.map((a) => `<p>${esc(a)}</p>`).join('')}
            </div>
          </div>` : ''}
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
        ${!res.noEvaluable ? bloqueComparacion(ctx, cmpCtx) : ''}
        ${b.sugerencias?.length ? `
          <section class="sugerencias">
            <h2 class="sub">${icono('bombilla')} Sugerencias de evaluación complementaria</h2>
            <p class="sugerencias-nota">Orientativas; no son resultados del instrumento ni sustituyen el juicio clínico.</p>
            <ul>${b.sugerencias.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          </section>` : ''}
        ${bloqueSiguientes(e, res)}
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
      <pre class="nota" id="texto-escala" data-formato="${formato}">${esc(textoConContexto(e, res, r, ctx.momento, formato, cmpCtx))}</pre>
      ${botones.nota ? `<p class="nota-guardar" id="nota-guardar">${icono('info')} ${esc(botones.nota)}</p>` : ''}
      <div class="acciones">
        <button class="btn btn-primario" type="button" id="agregar"${plan.igual && !ctx.ruta ? ' data-agregado' : ''}>${botones.principal.join(' ')}</button>
        ${botones.alterna ? `<button class="btn ancho" type="button" id="guardar-alterna">${botones.alterna.join(' ')}</button>` : ''}
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
  const plan = planGuardado(ctx, guardable, r);
  const cmpCtx = contextoComparacion(ctx, guardable, plan);

  const continuarRuta = () => {
    const pa = pasoActual(ctx);
    const sig = siguientePendiente(ctx.ruta, pa?.i ?? -1);
    location.hash = sig ? urlPaso(ctx.ruta, sig) : `#/r/${ctx.ruta.id}`;
  };

  const ejecutar = (accion) => {
    const guardado = accion === 'reemplazar'
      ? almacen.guardarResultado(guardable, { reemplazar: plan.objetivo.id, unico: Boolean(plan.unico) })
      : almacen.guardarResultado(guardable, { unico: esUnico(ctx.momento) });
    // Las respuestas en edición quedan ligadas a la aplicación guardada para futuras correcciones.
    almacen.guardarRespuestas(e.id, ctx.momento, { ...r, _origen: guardado.id });
    alGuardar();
    if (ctx.ruta) {
      aviso(`${e.corto} guardado`);
      continuarRuta();
      return;
    }
    aviso(accion === 'reemplazar' ? 'Resultado reemplazado en la valoración' : 'Añadido a la valoración');
    const btn = $('#agregar');
    btn.classList.remove('armado');
    btn.dataset.agregado = '';
    btn.innerHTML = `${icono('check')} En la valoración`;
    $('#guardar-alterna')?.remove();
    $('#nota-guardar')?.remove();
  };

  // Reemplazar siempre pide un segundo toque; agregar una aplicación nueva no.
  const conConfirmacion = (boton, accion) => {
    let armado = null;
    const original = boton.innerHTML;
    boton.addEventListener('click', () => {
      if (boton.dataset.agregado !== undefined) return;
      if (accion !== 'reemplazar') { ejecutar(accion); return; }
      if (!armado) {
        boton.innerHTML = `${icono('alerta')} Toca otra vez para reemplazar ${esc(valorGuardado(plan.objetivo))}`;
        boton.classList.add('armado');
        armado = setTimeout(() => { armado = null; boton.classList.remove('armado'); boton.innerHTML = original; }, 5000);
        return;
      }
      clearTimeout(armado);
      ejecutar(accion);
    });
  };

  const btn = $('#agregar');
  if (plan.igual) {
    btn.addEventListener('click', () => { if (ctx.ruta) continuarRuta(); });
  } else {
    conConfirmacion(btn, plan.accion);
    const alt = $('#guardar-alterna');
    if (alt) conConfirmacion(alt, plan.alterna);
  }

  alCambiarFormato(document, (formato) => {
    const f = formato === 'lista' ? 'lista' : 'parrafo';
    const pre = $('#texto-escala');
    pre.dataset.formato = f;
    pre.textContent = textoConContexto(e, res, r, ctx.momento, f, cmpCtx);
    $('#copiar').innerHTML = `${icono('copiar')} ${ETIQUETA_COPIAR[f]}`;
  });
  $('#copiar').addEventListener('click', () => {
    const f = almacen.formatoEscala();
    copiar(textoConContexto(e, res, r, ctx.momento, f, cmpCtx), f === 'parrafo' ? 'Copiado en párrafo' : 'Copiado en lista');
  });
  $('#nueva')?.addEventListener('click', () => {
    almacen.guardarRespuestas(e.id, ctx.momento, {});
    location.hash = ctx.url;
  });
  montarTiraRuta(ctx);
}
