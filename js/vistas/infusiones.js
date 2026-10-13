// Pantalla de infusiones: calculadora (preparación, dosis ↔ velocidad, ajuste, titulación y bolo) y tabla de referencia.
import {
  FARMACOS, GRUPOS_INFUSION, UNIDADES_DOSIS, UNIDADES_CANTIDAD, FUENTE_TABLA, farmacoDe, concentracion, velocidadMlH,
  dosisDesdeVelocidad, bolo, fmtNum, textoConcentracion, pasosTitulacion,
} from '../infusiones.js';
import { $, $$, esc, icono } from '../ui.js';

export const PESTANAS_INFUSION = [['calcular', 'Calcular'], ['tabla', 'Tabla de referencia']];
const OTRO = 'otro';

// Estado de la sesión (solo en memoria): el peso se conserva al cambiar de medicamento.
const estado = { peso: '', farmaco: null, prep: null, unidadDosis: null };

const numero = (v) => {
  const n = Number(String(v ?? '').trim().replace(',', '.'));
  return String(v ?? '').trim() === '' || !Number.isFinite(n) ? null : n;
};

function prepInicial(f) {
  if (f?.preparacion) return { cantidad: String(f.preparacion.cantidad), unidad: f.preparacion.unidad, volumen: String(f.preparacion.volumen) };
  return { cantidad: '', unidad: 'mg', volumen: '' };
}

function asegurarEstado(id) {
  const f = farmacoDe(id);
  if (estado.farmaco !== id) {
    estado.farmaco = id;
    estado.prep = prepInicial(f);
    estado.unidadDosis = f?.infusion?.unidad || 'mcg/kg/min';
  }
  return f;
}

/* ---------- Fragmentos ---------- */

const campo = (id, etiqueta, valor, extra = '') => `
  <label class="campo"><span>${esc(etiqueta)}</span><input id="${id}" type="text" inputmode="decimal" autocomplete="off" value="${esc(valor ?? '')}"${extra}></label>`;

function selectorFarmaco(idActual) {
  return `
    <label class="campo campo-farmaco"><span>Medicamento</span>
      <select id="inf-farmaco">
        ${GRUPOS_INFUSION.map((g) => `<optgroup label="${esc(g.nombre)}">${FARMACOS.filter((f) => f.grupo === g.id).map((f) => `<option value="${f.id}"${f.id === idActual ? ' selected' : ''}>${esc(f.nombre)}</option>`).join('')}</optgroup>`).join('')}
        <option value="${OTRO}"${idActual === OTRO ? ' selected' : ''}>Otro medicamento (preparación libre)</option>
      </select>
    </label>`;
}

function opcionesUnidadDosis(base, actual) {
  return (UNIDADES_DOSIS[base] || UNIDADES_DOSIS.mcg).map((u) => `<option value="${u}"${u === actual ? ' selected' : ''}>${u}</option>`).join('');
}

const fila = (t, v) => (v ? `<div><dt>${esc(t)}</dt><dd>${esc(v)}</dd></div>` : '');

function textoBolo(f) {
  if (f.bolo) return `${f.bolo.nota} ${f.bolo.tabla ? `Tabla: ${f.bolo.tabla}` : ''}`.trim();
  return f.boloNota || '';
}
function textoInfusion(f) {
  if (f.infusion) return `${fmtNum(f.infusion.min)} a ${fmtNum(f.infusion.max)} ${f.infusion.unidad}${f.infusion.extra ? ` (${f.infusion.extra.nota})` : ''}. ${f.infusion.tabla ? `Tabla: ${f.infusion.tabla}` : ''}`.trim();
  return f.infusionNota || '';
}

function fichaFarmaco(f, { enlace = false } = {}) {
  return `
    <article class="tarjeta ficha-farmaco" id="ficha-${f.id}">
      <h3 class="titulo-tarjeta">${esc(f.nombre)}</h3>
      <dl class="ficha-datos">
        ${fila('Efectos', f.efectos)}
        ${fila('Presentación', f.presentacion?.texto || 'No indicada en la tabla')}
        ${fila('Preparación', f.preparacion?.texto || f.preparacionNota)}
        ${fila('Bolo', textoBolo(f))}
        ${fila('Infusión (sostén)', textoInfusion(f))}
        ${(f.rangos || []).length ? fila('Rangos', f.rangos.map((r) => `${fmtNum(r.min)} a ${fmtNum(r.max)}: ${r.efecto}`).join(' ')) : ''}
        ${fila('Perfil', f.perfil)}
        ${fila('Otros usos', f.otros)}
        ${fila('Consideraciones', f.consideraciones)}
        ${fila('Ajuste y notas', f.ajuste)}
      </dl>
      ${f.revision ? `<p class="revision-huella">${icono('alerta')}<span><strong>Revisión de Huella:</strong> ${esc(f.revision)}</span></p>` : ''}
      ${enlace && (f.infusion || f.bolo) ? `<a class="btn btn-chico" href="#/infusiones/calcular/${f.id}">${icono('calculadoras')} Calcular</a>` : ''}
    </article>`;
}

/* ---------- Calcular ---------- */

function panelCalcular(id) {
  const f = asegurarEstado(id);
  const p = estado.prep;
  const alternas = f ? [f.preparacion, ...(f.preparacionesAlternas || [])].filter(Boolean) : [];
  const sinInfusion = f && !f.infusion;
  return `
    <section class="tarjeta" aria-labelledby="inf-prep-t">
      <h2 class="titulo-tarjeta" id="inf-prep-t">Paciente y preparación</h2>
      <div class="campos campos-inf">
        ${selectorFarmaco(id)}
        ${campo('inf-peso', 'Peso (kg)', estado.peso, ' aria-describedby="inf-peso-e"')}
      </div>
      <p class="error-campo" id="inf-peso-e" hidden></p>
      ${f?.preparacion?.ejemplo ? `<p class="aviso-inline">${icono('alerta')} ${esc(f.preparacion.texto)}</p>` : ''}
      ${alternas.length > 1 ? `<div class="chips-prep" role="group" aria-label="Preparaciones de la tabla">${alternas.map((x, i) => `<button class="chip-prep" type="button" data-prep="${i}">${esc(`${fmtNum(x.cantidad)} ${x.unidad}/${fmtNum(x.volumen)} mL`)}</button>`).join('')}</div>` : ''}
      ${sinInfusion ? `<p class="discreto">${esc(f.preparacionNota || f.infusionNota || 'Sin infusión continua.')}</p>` : `
      <div class="campos campos-prep">
        ${campo('inf-cantidad', 'Cantidad del medicamento', p.cantidad)}
        <label class="campo"><span>Unidad</span><select id="inf-unidad">${Object.keys(UNIDADES_CANTIDAD).map((u) => `<option value="${u}"${u === p.unidad ? ' selected' : ''}>${u}</option>`).join('')}</select></label>
        ${campo('inf-volumen', 'Volumen total (mL)', p.volumen)}
      </div>
      <p class="concentracion" id="inf-conc" aria-live="polite"></p>`}
    </section>
    ${sinInfusion ? '' : `
    <section class="tarjeta" aria-labelledby="inf-ini-t">
      <h2 class="titulo-tarjeta" id="inf-ini-t">Dosis → velocidad</h2>
      <div class="campos campos-dosis">
        ${campo('inf-dosis', 'Dosis deseada', '')}
        <label class="campo"><span>Unidad de dosis</span><select id="inf-udosis"></select></label>
      </div>
      <p class="resultado-inf" id="inf-r-vel" aria-live="polite"></p>
    </section>
    <section class="tarjeta" aria-labelledby="inf-aj-t">
      <h2 class="titulo-tarjeta" id="inf-aj-t">Ajustar la infusión</h2>
      <div class="campos campos-dosis">
        ${campo('inf-actual', 'Velocidad actual (mL/h)', '')}
        ${campo('inf-nueva', 'Nueva dosis', '')}
      </div>
      <p class="resultado-inf" id="inf-r-aj" aria-live="polite"></p>
      <p class="equivalencia" id="inf-equiv"></p>
    </section>
    <section class="tarjeta" aria-labelledby="inf-tit-t">
      <h2 class="titulo-tarjeta" id="inf-tit-t">Tabla de titulación <span id="inf-tit-sub"></span></h2>
      <div id="inf-titulacion"></div>
    </section>`}
    ${f?.bolo ? `
    <section class="tarjeta" aria-labelledby="inf-bolo-t">
      <h2 class="titulo-tarjeta" id="inf-bolo-t">Bolo <span>${esc(f.bolo.nota)}</span></h2>
      <div class="campos campos-dosis">${campo('inf-bolo', `Dosis (${f.bolo.unidad}/kg)`, '')}</div>
      <div id="inf-r-bolo" aria-live="polite"></div>
    </section>` : f?.boloNota ? `<section class="tarjeta"><h2 class="titulo-tarjeta">Bolo</h2><p>${esc(f.boloNota)}</p></section>` : ''}
    ${f ? fichaFarmaco(f) : ''}
    <p class="nota-seguridad">${icono('info')} Apoyo de cálculo: verifica la indicación, la dosis y la preparación con tu protocolo y en doble chequeo. ${esc(FUENTE_TABLA)}</p>`;
}

/* ---------- Tabla de referencia ---------- */

function panelTabla() {
  return `
    <p class="discreto">${esc(FUENTE_TABLA)} Las velocidades se recalculan en «Calcular» con tu preparación y el peso; donde los mL/h impresos no coinciden con la dosis, Huella lo señala.</p>
    ${GRUPOS_INFUSION.map((g) => `
      <h2 class="seccion">${esc(g.nombre)}</h2>
      <div class="fichas">${FARMACOS.filter((f) => f.grupo === g.id).map((f) => fichaFarmaco(f, { enlace: true })).join('')}</div>`).join('')}`;
}

export function renderInfusiones({ pestana, farmaco }) {
  const id = farmaco && (farmacoDe(farmaco) || farmaco === OTRO) ? farmaco : estado.farmaco || 'norepinefrina';
  return `
    <section class="vista infusiones">
      <a class="migas" href="#/d/calculadoras">${icono('atras')} Calculadoras</a>
      <header class="cabecera">
        <p class="ceja">Calculadoras · Calculadora clínica</p>
        <h1>Infusiones</h1>
        <p class="entradilla">Escribe la preparación y el peso: Huella calcula la velocidad (mL/h) para la dosis que quieres, la dosis que lleva una velocidad, cómo ajustar y los bolos. Incluye la tabla de sedantes, bloqueo neuromuscular y vasoactivos.</p>
      </header>
      <nav class="pestanas-med" aria-label="Secciones de infusiones">
        ${PESTANAS_INFUSION.map(([pid, nombre]) => `<a href="#/infusiones/${pid}${pid === 'calcular' ? `/${id}` : ''}"${pid === pestana ? ' aria-current="page" class="activo"' : ''}>${esc(nombre)}</a>`).join('')}
      </nav>
      <div id="panel-inf" data-pestana="${pestana}">${pestana === 'tabla' ? panelTabla() : panelCalcular(id)}</div>
    </section>`;
}

/* ---------- Cálculo en vivo ---------- */

function rangoEn(f, unidad, peso, conc) {
  // Rango de la tabla convertido a la unidad elegida (pasando por mL/h).
  if (!f?.infusion) return null;
  const a = velocidadMlH(f.infusion.min, f.infusion.unidad, peso, conc);
  const b = velocidadMlH(f.infusion.max, f.infusion.unidad, peso, conc);
  if (a == null || b == null) return null;
  return { min: dosisDesdeVelocidad(a, unidad, peso, conc), max: dosisDesdeVelocidad(b, unidad, peso, conc), mlhMin: a, mlhMax: b };
}

function avisoRango(f, dosisEnUnidad, rango, unidad) {
  if (!rango || dosisEnUnidad == null) return '';
  const extra = f.infusion.extra;
  if (dosisEnUnidad < rango.min * 0.999) return `<span class="fuera-rango">${icono('alerta')} Por debajo del rango de la tabla (${fmtNum(rango.min)} a ${fmtNum(rango.max)} ${unidad}).</span>`;
  if (dosisEnUnidad > rango.max * 1.001) return `<span class="fuera-rango">${icono('alerta')} Por encima del rango de la tabla (${fmtNum(rango.min)} a ${fmtNum(rango.max)} ${unidad})${extra ? `; ${extra.nota}` : ''}.</span>`;
  return `<span class="en-rango">${icono('check')} Dentro del rango de la tabla (${fmtNum(rango.min)} a ${fmtNum(rango.max)} ${unidad}).</span>`;
}

export function montarInfusiones({ pestana }) {
  const sel = $('#inf-farmaco');
  if (sel) sel.addEventListener('change', () => { location.hash = `#/infusiones/calcular/${sel.value}`; });
  if (pestana !== 'calcular' || !sel) return;
  const f = farmacoDe(estado.farmaco);
  const valor = (id) => numero($(`#${id}`)?.value);

  function actualizar() {
    estado.peso = $('#inf-peso').value;
    const peso = valor('inf-peso');
    const errPeso = $('#inf-peso-e');
    const pesoMal = peso != null && (peso < 1 || peso > 350);
    errPeso.hidden = !pesoMal;
    errPeso.textContent = pesoMal ? 'Peso fuera del rango posible (1 a 350 kg).' : '';
    const pesoOk = pesoMal ? null : peso;
    if (!$('#inf-cantidad')) {
      actualizarBolo(null, pesoOk);
      return;
    }
    estado.prep = { cantidad: $('#inf-cantidad').value, unidad: $('#inf-unidad').value, volumen: $('#inf-volumen').value };
    const conc = concentracion(valor('inf-cantidad'), estado.prep.unidad, valor('inf-volumen'));
    $('#inf-conc').innerHTML = conc ? `Concentración: <strong>${esc(textoConcentracion(conc))}</strong>` : 'Escribe la cantidad y el volumen para calcular la concentración.';

    // Unidades de dosis disponibles según la preparación (masa o UI).
    const udSel = $('#inf-udosis');
    const base = conc?.base || UNIDADES_CANTIDAD[estado.prep.unidad]?.base || 'mcg';
    const opciones = UNIDADES_DOSIS[base];
    if (!opciones.includes(estado.unidadDosis)) estado.unidadDosis = f?.infusion && UNIDADES_DOSIS[base].includes(f.infusion.unidad) ? f.infusion.unidad : opciones[0];
    if (udSel.dataset.base !== base) { udSel.innerHTML = opcionesUnidadDosis(base, estado.unidadDosis); udSel.dataset.base = base; }
    udSel.value = estado.unidadDosis;
    const u = estado.unidadDosis;
    const necesitaPeso = u.includes('/kg/');
    const faltaPeso = necesitaPeso && pesoOk == null;
    const rango = conc && !faltaPeso ? rangoEn(f, u, pesoOk, conc) : null;

    // Dosis → velocidad
    const d = valor('inf-dosis');
    const rVel = $('#inf-r-vel');
    if (!conc) rVel.innerHTML = '';
    else if (faltaPeso) rVel.innerHTML = '<span class="discreto">Escribe el peso para dosis por kg.</span>';
    else if (d == null) rVel.innerHTML = rango ? `<span class="discreto">Rango de la tabla: ${fmtNum(rango.min)} a ${fmtNum(rango.max)} ${esc(u)} = ${fmtNum(rango.mlhMin)} a ${fmtNum(rango.mlhMax)} mL/h.</span>` : '';
    else {
      const mlh = velocidadMlH(d, u, pesoOk, conc);
      rVel.innerHTML = `<span class="cifra-inf">${fmtNum(mlh)} <small>mL/h</small></span>${avisoRango(f, d, rango, u)}`;
    }

    // Ajuste
    const actual = valor('inf-actual');
    const nueva = valor('inf-nueva');
    const rAj = $('#inf-r-aj');
    const partes = [];
    if (conc && !faltaPeso && actual != null) {
      const dosisAct = dosisDesdeVelocidad(actual, u, pesoOk, conc);
      partes.push(`<span>A ${fmtNum(actual)} mL/h lleva <strong>${fmtNum(dosisAct)} ${esc(u)}</strong>.</span>${avisoRango(f, dosisAct, rango, u)}`);
    }
    if (conc && !faltaPeso && nueva != null) {
      const mlhNueva = velocidadMlH(nueva, u, pesoOk, conc);
      const cambio = actual != null ? mlhNueva - actual : null;
      partes.push(`<span class="cifra-inf">${fmtNum(mlhNueva)} <small>mL/h</small></span><span>para ${fmtNum(nueva)} ${esc(u)}${cambio != null ? ` (${cambio >= 0 ? 'subir' : 'bajar'} ${fmtNum(Math.abs(cambio))} mL/h)` : ''}.</span>${avisoRango(f, nueva, rango, u)}`);
    }
    rAj.innerHTML = faltaPeso && (actual != null || nueva != null) ? '<span class="discreto">Escribe el peso para dosis por kg.</span>' : partes.join('');
    $('#inf-equiv').innerHTML = conc && !faltaPeso ? `Equivalencia: cada 1 mL/h = <strong>${fmtNum(dosisDesdeVelocidad(1, u, pesoOk, conc))} ${esc(u)}</strong>.` : '';

    // Titulación
    const tit = $('#inf-titulacion');
    $('#inf-tit-sub').textContent = conc && !faltaPeso ? `· ${u}${necesitaPeso ? ` · ${fmtNum(pesoOk)} kg` : ''}` : '';
    if (!conc || faltaPeso) tit.innerHTML = `<p class="discreto">${faltaPeso ? 'Escribe el peso' : 'Escribe la preparación'} para ver la tabla.</p>`;
    else {
      const r = rango || { min: d || 1, max: (d || 1) * 10 };
      const filas = pasosTitulacion(redondeoBonito(r.min), redondeoBonito(r.max));
      const extra = f?.infusion?.extra && u === f.infusion.unidad ? [f.infusion.extra.valor] : [];
      tit.innerHTML = `
        <div class="tabla-envoltura"><table class="tabla tabla-titulacion">
          <thead><tr><th scope="col">Dosis (${esc(u)})</th><th scope="col" class="num-col">mL/h</th></tr></thead>
          <tbody>${[...filas, ...extra].map((x) => {
            const mlh = velocidadMlH(x, u, pesoOk, conc);
            const act = actual != null && Math.abs(mlh - actual) < 0.05;
            return `<tr${act ? ' class="actual"' : ''}><th scope="row">${fmtNum(x)}${extra.includes(x) ? ' <span>(máximo especial)</span>' : ''}</th><td class="num-col">${fmtNum(mlh)}</td></tr>`;
          }).join('')}</tbody>
        </table></div>
        ${rango ? '' : '<p class="discreto">Sin rango de la tabla para este medicamento: los pasos son orientativos.</p>'}`;
    }
    actualizarBolo(conc, pesoOk);
  }

  function actualizarBolo(conc, peso) {
    const caja = $('#inf-r-bolo');
    if (!caja || !f?.bolo) return;
    const dk = valor('inf-bolo');
    const pres = f.presentacion ? concentracion(f.presentacion.cantidad, f.presentacion.unidad, f.presentacion.volumen) : null;
    if (peso == null) { caja.innerHTML = '<p class="discreto">Escribe el peso.</p>'; return; }
    const rango = (x) => {
      const b1 = bolo(x, f.bolo.unidad, peso, pres);
      return b1 ? `${fmtNum(b1.total)} ${f.bolo.unidad}${pres ? ` = ${fmtNum(b1.ml)} mL de la presentación (${esc(f.presentacion.texto)})` : ''}` : '';
    };
    const filas = dk != null
      ? [`<p class="resultado-inf"><span class="cifra-inf">${fmtNum(dk * peso)} <small>${f.bolo.unidad}</small></span><span>${pres ? `${fmtNum(bolo(dk, f.bolo.unidad, peso, pres).ml)} mL de la presentación (${esc(f.presentacion.texto)})` : ''}${conc ? `; ${fmtNum(bolo(dk, f.bolo.unidad, peso, conc).ml)} mL de tu preparación` : ''}.</span>${dk < f.bolo.min * 0.999 || dk > f.bolo.max * 1.001 ? `<span class="fuera-rango">${icono('alerta')} Fuera del rango de la tabla (${fmtNum(f.bolo.min)} a ${fmtNum(f.bolo.max)} ${f.bolo.unidad}/kg).</span>` : ''}</p>`]
      : [];
    filas.push(`<p class="discreto">Rango de la tabla para ${fmtNum(peso)} kg: ${rango(f.bolo.min)} a ${rango(f.bolo.max)}.</p>`);
    caja.innerHTML = filas.join('');
  }

  $$('#panel-inf input, #panel-inf select').forEach((el) => {
    if (el.id === 'inf-farmaco') return;
    el.addEventListener('input', () => {
      if (el.id === 'inf-udosis') estado.unidadDosis = el.value;
      actualizar();
    });
  });
  $$('[data-prep]').forEach((b) => b.addEventListener('click', () => {
    const x = [f.preparacion, ...(f.preparacionesAlternas || [])][Number(b.dataset.prep)];
    $('#inf-cantidad').value = String(x.cantidad);
    $('#inf-unidad').value = x.unidad;
    $('#inf-volumen').value = String(x.volumen);
    actualizar();
  }));
  actualizar();
}

// Extremos de la tabla de titulación con pocas cifras significativas (p. ej., 0.0526 → 0.05).
function redondeoBonito(x) {
  if (!(x > 0)) return x;
  return Number(x.toPrecision(2));
}
