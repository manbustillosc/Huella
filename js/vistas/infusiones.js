// Pantalla de infusiones: calculadora (preparación, dosis ↔ velocidad, ajuste, titulación por perfil y pautas de dosis
// única) y fichas de referencia con su fuente. Toda cifra mostrada sale de las funciones de js/infusiones.js.
import {
  FARMACOS, GRUPOS_INFUSION, FAMILIAS, UNIDADES_CANTIDAD, FUENTES_INFUSION, TIPOS_FUENTE, REVISION_INFUSIONES, LIMITES_ENTRADA,
  farmacoDe, concentracion, velocidadMlH, dosisDesdeVelocidad, convertirDosis, fmtNum, textoConcentracion, leerEntrada,
  clasificarDosis, tablaTitulacion, pasosTitulacion, leerUnidadDosis, familiaDeUnidad, textoPauta, dosisPauta, concPauta,
  pautaNoAplica, volumenDeDosis, ejemplosPerfil,
} from '../infusiones.js';
import { $, $$, esc, icono } from '../ui.js';

export const PESTANAS_INFUSION = [['calcular', 'Calcular'], ['tabla', 'Fichas de referencia']];
const OTRO = 'otro';

// Estado de la sesión (solo en memoria): el peso se conserva al cambiar de medicamento.
const estado = { peso: '', farmaco: null, familia: '', prep: null, perfil: null, pauta: null, unidadDosis: null };

function prepInicial(f) {
  const p = f?.preparaciones?.[0];
  if (p) return { cantidad: String(p.cantidad), unidad: p.unidad, volumen: String(p.volumen) };
  return { cantidad: '', unidad: f ? FAMILIAS[f.familia].cantidades[1] || FAMILIAS[f.familia].cantidades[0] : '', volumen: '' };
}

function asegurarEstado(id) {
  const f = farmacoDe(id);
  if (estado.farmaco !== id) {
    estado.farmaco = id;
    estado.familia = f ? f.familia : '';
    estado.prep = prepInicial(f);
    estado.perfil = f?.infusiones?.[0]?.id || null;
    estado.pauta = f?.pautas?.[0]?.id || null;
    estado.unidadDosis = f?.infusiones?.[0]?.unidad || null;
  }
  return f;
}

/* ---------- Fragmentos ---------- */

// El mensaje de error vive dentro de la etiqueta, justo debajo de su campo, y se anuncia al aparecer.
const campo = (id, etiqueta, valor, extra = '') => `
  <label class="campo"><span>${esc(etiqueta)}</span><input id="${id}" type="text" inputmode="decimal" autocomplete="off" value="${esc(valor ?? '')}" aria-describedby="${id}-e"${extra}><span class="error-campo" id="${id}-e" aria-live="polite" hidden></span></label>`;
const fuenteCorta = (k) => `${TIPOS_FUENTE[FUENTES_INFUSION[k].tipo]}`;

function selectorFarmaco(idActual) {
  return `
    <label class="campo campo-farmaco"><span>Medicamento</span>
      <select id="inf-farmaco">
        ${GRUPOS_INFUSION.map((g) => `<optgroup label="${esc(g.nombre)}">${FARMACOS.filter((f) => f.grupo === g.id).map((f) => `<option value="${f.id}"${f.id === idActual ? ' selected' : ''}>${esc(f.nombre)}</option>`).join('')}</optgroup>`).join('')}
        <option value="${OTRO}"${idActual === OTRO ? ' selected' : ''}>Otro medicamento (preparación libre)</option>
      </select>
    </label>`;
}

const fila = (t, v) => (v ? `<div><dt>${esc(t)}</dt><dd>${v}</dd></div>` : '');

function textoPerfil(f, p) {
  const intervalo = p.fija != null ? `Dosis fija de ${fmtNum(p.fija)} ${p.unidad}` : p.max ? `${fmtNum(p.min)} a ${fmtNum(p.max)} ${p.unidad}` : `Inicio ${fmtNum(p.inicio)}${p.inicioMax ? ` a ${fmtNum(p.inicioMax)}` : ''} ${p.unidad}`;
  const ej = ejemplosPerfil(f, p);
  return `
    <li class="perfil-ficha">
      <p><strong>${esc(p.indicacion)}</strong> · ${esc(p.poblacion)} <span class="chip-fuente fuente-${FUENTES_INFUSION[p.fuente].tipo}">${esc(fuenteCorta(p.fuente))}</span></p>
      <p>${esc(intervalo)}.${p.titulacion ? ` ${esc(p.titulacion)}` : ''}</p>
      ${ej ? `<p class="discreto">Con ${esc(ej.prep.texto)}: ${esc(ej.texto)} (calculado).</p>` : ''}
      ${p.nota ? `<p class="discreto">${esc(p.nota)}</p>` : ''}
    </li>`;
}

function textoPautaFicha(f, pa) {
  return `
    <li class="perfil-ficha${pa.especializada ? ' especializada' : ''}">
      <p><strong>${esc(pa.indicacion)}</strong> · ${esc(pa.poblacion)} <span class="chip-fuente fuente-${FUENTES_INFUSION[pa.fuente].tipo}">${esc(fuenteCorta(pa.fuente))}</span></p>
      <p>${esc(textoPauta(f, pa))}. Vía: ${esc(pa.via)}.${pa.frecuencia ? ` ${esc(pa.frecuencia)}.` : ''}${pa.maximo ? ` ${esc(pa.maximo)}.` : ''}</p>
      ${pa.nota ? `<p class="discreto">${esc(pa.nota)}</p>` : ''}
    </li>`;
}

function fichaFarmaco(f, { enlace = false } = {}) {
  return `
    <article class="tarjeta ficha-farmaco" id="ficha-${f.id}">
      <h3 class="titulo-tarjeta">${esc(f.nombre)}</h3>
      <dl class="ficha-datos">
        ${fila('Efectos', esc(f.efectos))}
        ${fila('Presentación', esc(f.presentacion?.texto || '—'))}
        ${fila('Preparaciones', f.preparaciones.length ? f.preparaciones.map((p) => `${esc(p.texto)} <span class="chip-fuente fuente-${FUENTES_INFUSION[p.fuente].tipo}">${esc(fuenteCorta(p.fuente))}</span>${p.nota ? `<br><span class="discreto">${esc(p.nota)}</span>` : ''}`).join('<br>') : esc(f.sinPreparacion || f.sinInfusion || '—'))}
      </dl>
      <p class="ficha-sub">Infusión continua</p>
      ${f.infusiones.length ? `<ul class="perfiles-ficha">${f.infusiones.map((p) => textoPerfil(f, p)).join('')}</ul>` : `<p class="discreto">${esc(f.sinInfusion || 'Sin infusión continua.')}</p>`}
      <p class="ficha-sub">Dosis únicas</p>
      ${f.pautas.length ? `<ul class="perfiles-ficha">${f.pautas.map((pa) => textoPautaFicha(f, pa)).join('')}</ul>` : `<p class="discreto">${esc(f.sinBolo || 'Sin dosis única de referencia.')}</p>`}
      <dl class="ficha-datos">
        ${fila('Contraindicaciones', (f.contraindicaciones || []).map(esc).join(' '))}
        ${fila('Advertencias', f.advertencias.map(esc).join(' '))}
        ${fila('Ajustes', f.ajustes.map(esc).join(' '))}
        ${fila('Fuentes', f.fuentes.map((k) => `${esc(FUENTES_INFUSION[k].texto)}${FUENTES_INFUSION[k].url ? ` <a href="${esc(FUENTES_INFUSION[k].url)}" target="_blank" rel="noopener">Enlace</a>` : ''}`).join('<br>'))}
        ${fila('Revisión', esc(REVISION_INFUSIONES.split('-').reverse().join('/')))}
      </dl>
      <details class="historica">
        <summary>Tabla original del HG30 (histórica; no usar para indicar)</summary>
        <dl class="ficha-datos">
          ${fila('Bolo', esc(f.historica.bolo))}
          ${fila('Infusión', esc(f.historica.infusion))}
          ${fila('Otros', esc(f.historica.otros))}
          ${fila('Revisión de Huella', esc(f.historica.discrepancia))}
        </dl>
      </details>
      ${enlace ? `<a class="btn btn-chico" href="#/infusiones/calcular/${f.id}">${icono('calculadoras')} Calcular</a>` : ''}
    </article>`;
}

/* ---------- Calcular ---------- */

function opciones(lista, actual, vacio = '') {
  return `${vacio ? `<option value="">${esc(vacio)}</option>` : ''}${lista.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(actual) ? ' selected' : ''}>${esc(t)}</option>`).join('')}`;
}

function panelCalcular(id) {
  const f = asegurarEstado(id);
  const p = estado.prep;
  const fam = estado.familia;
  const famDef = FAMILIAS[fam];
  const sinInfusion = f && !f.infusiones.length;
  const perfilActual = f?.infusiones.find((x) => x.id === estado.perfil) || null;
  return `
    <section class="tarjeta" aria-labelledby="inf-prep-t">
      <h2 class="titulo-tarjeta" id="inf-prep-t">Paciente y preparación</h2>
      <div class="campos campos-inf">
        ${selectorFarmaco(id)}
        ${campo('inf-peso', 'Peso (kg)', estado.peso)}
      </div>
      ${!f ? `
        <div class="campos campos-inf">
          <label class="campo"><span>Familia de unidades</span><select id="inf-familia">${opciones(Object.entries(FAMILIAS).map(([k, x]) => [k, x.nombre]), fam, 'Elige la familia de unidades')}</select></label>
        </div>
        <p class="discreto">Masa y unidades internacionales no se convierten entre sí: elige la familia del medicamento.</p>` : ''}
      ${f && f.preparaciones.length > 1 ? `<div class="chips-prep" role="group" aria-label="Preparaciones de referencia">${f.preparaciones.map((x, i) => `<button class="chip-prep" type="button" data-prep="${i}">${esc(`${fmtNum(x.cantidad)} ${x.unidad}/${fmtNum(x.volumen)} mL`)}</button>`).join('')}</div>` : ''}
      ${sinInfusion ? `<p class="discreto">${esc(f.sinInfusion || 'Sin infusión continua.')}</p>` : famDef ? `
      <div class="campos campos-prep">
        ${campo('inf-cantidad', 'Cantidad del medicamento', p.cantidad)}
        <label class="campo"><span>Unidad</span><select id="inf-unidad">${opciones(famDef.cantidades.map((u) => [u, u]), p.unidad)}</select></label>
        ${campo('inf-volumen', 'Volumen total (mL)', p.volumen)}
      </div>
      ${f?.sinPreparacion ? `<p class="aviso-inline">${icono('alerta')} ${esc(f.sinPreparacion)}</p>` : ''}
      <p class="aviso-inline" id="inf-prep-nota" hidden></p>
      <p class="concentracion" id="inf-conc" aria-live="polite"></p>` : ''}
    </section>
    ${sinInfusion || !famDef ? '' : `
    <section class="tarjeta" aria-labelledby="inf-perfil-t">
      <h2 class="titulo-tarjeta" id="inf-perfil-t">Perfil de dosis</h2>
      ${f ? `
        <label class="campo"><span>Indicación y fuente</span><select id="inf-perfil">${opciones(f.infusiones.map((x) => [x.id, `${x.indicacion} · ${TIPOS_FUENTE[FUENTES_INFUSION[x.fuente].tipo]}`]), estado.perfil)}</select></label>
        <p class="discreto" id="inf-perfil-desc">${perfilActual ? esc(`${perfilActual.poblacion}. ${perfilActual.fija != null ? `Dosis fija: ${fmtNum(perfilActual.fija)} ${perfilActual.unidad}.` : perfilActual.max ? `Intervalo: ${fmtNum(perfilActual.min)} a ${fmtNum(perfilActual.max)} ${perfilActual.unidad}.` : ''} ${perfilActual.titulacion || ''}`) : ''}</p>` : `
        <p class="discreto">Sin perfil validado para «otro medicamento». Si quieres una tabla de titulación, escribe los límites: son parámetros tuyos, no una recomendación.</p>
        <div class="campos campos-dosis">${campo('inf-lim-min', 'Límite inferior (tuyo)', '')}${campo('inf-lim-max', 'Límite superior (tuyo)', '')}</div>`}
    </section>
    <section class="tarjeta" aria-labelledby="inf-ini-t">
      <h2 class="titulo-tarjeta" id="inf-ini-t">Dosis → velocidad</h2>
      <div class="campos campos-dosis">
        ${campo('inf-dosis', 'Dosis deseada', '')}
        <label class="campo"><span>Unidad de dosis</span><select id="inf-udosis">${opciones(famDef.dosis.map((u) => [u, u]), estado.unidadDosis || famDef.dosis[0])}</select></label>
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
    ${f?.pautas.length ? `
    <section class="tarjeta" aria-labelledby="inf-bolo-t">
      <h2 class="titulo-tarjeta" id="inf-bolo-t">Dosis única</h2>
      <label class="campo"><span>Indicación</span><select id="inf-pauta">${opciones(f.pautas.map((x) => [x.id, `${x.indicacion} · ${x.poblacion}`]), estado.pauta)}</select></label>
      <div id="inf-pauta-desc"></div>
      <div class="campos campos-dosis">${campo('inf-bolo', 'Dosis a administrar (opcional)', '')}<p class="campo-unidad" id="inf-bolo-u"></p></div>
      <div id="inf-r-bolo" aria-live="polite"></div>
    </section>` : f?.sinBolo ? `<section class="tarjeta"><h2 class="titulo-tarjeta">Dosis única</h2><p>${esc(f.sinBolo)}</p></section>` : ''}
    ${f ? fichaFarmaco(f) : ''}
    <p class="nota-seguridad">${icono('info')} Apoyo de cálculo: verifica la indicación, la dosis y la preparación con tu protocolo y en doble chequeo. Las referencias no son órdenes automáticas.</p>`;
}

/* ---------- Fichas ---------- */

function panelTabla() {
  return `
    <p class="discreto">Cada perfil indica su fuente: ficha técnica, guía internacional o la tabla institucional del HG30. Las velocidades de ejemplo se calculan con la misma función que la calculadora. La tabla original queda en un apartado histórico de cada ficha, con sus discrepancias.</p>
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
        <p class="entradilla">Escribe la preparación y el peso: Huella calcula la velocidad (mL/h) para la dosis que quieres, la dosis que lleva una velocidad, cómo ajustar y las dosis únicas, con perfiles de dosis por indicación y su fuente.</p>
      </header>
      <nav class="pestanas-med" aria-label="Secciones de infusiones">
        ${PESTANAS_INFUSION.map(([pid, nombre]) => `<a href="#/infusiones/${pid}${pid === 'calcular' ? `/${id}` : ''}"${pid === pestana ? ' aria-current="page" class="activo"' : ''}>${esc(nombre)}</a>`).join('')}
      </nav>
      <div id="panel-inf" data-pestana="${pestana}">${pestana === 'tabla' ? panelTabla() : panelCalcular(id)}</div>
    </section>`;
}

/* ---------- Cálculo en vivo ---------- */

const CLASE_ESTADO = { dentro: 'en-rango', fija: 'en-rango', sin_intervalo: 'info-rango', no_comparable: 'info-rango' };
const avisoClasif = (c) => (c ? `<span class="${CLASE_ESTADO[c.estado] || 'fuera-rango'}">${icono(CLASE_ESTADO[c.estado] === 'en-rango' ? 'check' : CLASE_ESTADO[c.estado] === 'info-rango' ? 'info' : 'alerta')} ${esc(c.texto)}</span>` : '');

export function montarInfusiones({ pestana }) {
  const sel = $('#inf-farmaco');
  if (sel) sel.addEventListener('change', () => { location.hash = `#/infusiones/calcular/${sel.value}`; });
  if (pestana !== 'calcular' || !sel) return;
  const f = farmacoDe(estado.farmaco);

  // Lee un campo con sus límites y muestra el error junto a él. Devuelve el número válido o null.
  function leer(id, limites) {
    const el = $(`#${id}`);
    const err = $(`#${id}-e`);
    if (!el) return null;
    const r = leerEntrada(el.value, limites);
    if (err) {
      err.hidden = r.estado !== 'error';
      err.textContent = r.estado === 'error' ? r.mensaje : '';
    }
    el.setAttribute('aria-invalid', String(r.estado === 'error'));
    return r.estado === 'ok' ? r.valor : null;
  }
  const hayError = (id) => $(`#${id}`)?.getAttribute('aria-invalid') === 'true';

  function actualizar() {
    estado.peso = $('#inf-peso').value;
    const peso = leer('inf-peso', LIMITES_ENTRADA.peso);
    if (!$('#inf-cantidad')) { actualizarPauta(peso, null); return; }
    estado.prep = { cantidad: $('#inf-cantidad').value, unidad: $('#inf-unidad').value, volumen: $('#inf-volumen').value };
    const cant = leer('inf-cantidad', LIMITES_ENTRADA.cantidad);
    const vol = leer('inf-volumen', LIMITES_ENTRADA.volumen);
    const conc = concentracion(cant, estado.prep.unidad, vol);
    const prepRef = f?.preparaciones.find((x) => String(x.cantidad) === estado.prep.cantidad && x.unidad === estado.prep.unidad && String(x.volumen) === estado.prep.volumen);
    const nota = $('#inf-prep-nota');
    nota.hidden = !prepRef?.nota;
    nota.innerHTML = prepRef?.nota ? `${icono('alerta')} ${esc(prepRef.nota)}` : '';
    $('#inf-conc').innerHTML = conc ? `Concentración: <strong>${esc(textoConcentracion(conc))}</strong>` : hayError('inf-cantidad') || hayError('inf-volumen') ? 'Corrige la preparación.' : 'Escribe la cantidad y el volumen para calcular la concentración.';

    const u = $('#inf-udosis').value;
    estado.unidadDosis = u;
    const perfil = f?.infusiones.find((x) => x.id === estado.perfil) || null;
    // Compatibilidad de unidades: la dosis y la preparación deben ser de la misma familia (y del medicamento).
    const famMed = f ? f.familia : estado.familia;
    const incompatible = (conc && conc.familia !== famMed) || familiaDeUnidad(u) !== famMed;
    const porKg = leerUnidadDosis(u).porKg;
    const faltaPeso = porKg && peso == null;
    const listo = conc && !incompatible && !faltaPeso;
    const motivo = incompatible ? '<span class="fuera-rango">' + icono('alerta') + ' Unidades incompatibles con el medicamento: corrige la preparación o la unidad de dosis.</span>'
      : !conc ? '' : faltaPeso ? `<span class="discreto">${hayError('inf-peso') ? 'Corrige el peso' : 'Escribe el peso'} para dosis por kg.</span>` : '';

    // Dosis → velocidad
    const d = leer('inf-dosis', LIMITES_ENTRADA.dosis);
    const rVel = $('#inf-r-vel');
    if (!listo) rVel.innerHTML = motivo;
    else if (d == null) rVel.innerHTML = perfil ? `<span class="discreto">${esc(perfil.fija != null ? `Dosis fija del perfil: ${fmtNum(perfil.fija)} ${perfil.unidad}.` : perfil.max ? `Intervalo del perfil: ${fmtNum(perfil.min)} a ${fmtNum(perfil.max)} ${perfil.unidad}.` : '')}</span>` : '';
    else {
      const mlh = velocidadMlH(d, u, peso, conc);
      rVel.innerHTML = mlh == null ? '<span class="fuera-rango">No se pudo calcular con estos datos.</span>' : `<span class="cifra-inf">${fmtNum(mlh)} <small>mL/h</small></span>${avisoClasif(clasificarDosis(d, u, perfil))}`;
    }

    // Ajuste: solo con números válidos; nunca se resta un null.
    const actual = leer('inf-actual', LIMITES_ENTRADA.velocidad);
    const nueva = leer('inf-nueva', LIMITES_ENTRADA.dosis);
    const rAj = $('#inf-r-aj');
    const partes = [];
    if (listo && actual != null) {
      const dosisAct = dosisDesdeVelocidad(actual, u, peso, conc);
      if (dosisAct != null) partes.push(`<span>A ${fmtNum(actual)} mL/h lleva <strong>${fmtNum(dosisAct)} ${esc(u)}</strong>.</span>${actual > 0 ? avisoClasif(clasificarDosis(dosisAct, u, perfil)) : ''}`);
    }
    if (listo && nueva != null) {
      const mlhNueva = velocidadMlH(nueva, u, peso, conc);
      if (mlhNueva != null) {
        const cambio = actual != null ? mlhNueva - actual : null;
        const texto = cambio == null ? '' : Math.abs(cambio) < 0.005 ? ' (sin cambio)' : ` (${cambio > 0 ? 'subir' : 'bajar'} ${fmtNum(Math.abs(cambio))} mL/h)`;
        partes.push(`<span class="cifra-inf">${fmtNum(mlhNueva)} <small>mL/h</small></span><span>para ${fmtNum(nueva)} ${esc(u)}${texto}.</span>${avisoClasif(clasificarDosis(nueva, u, perfil))}`);
      }
    }
    rAj.innerHTML = !listo && ($('#inf-actual').value || $('#inf-nueva').value) ? motivo : partes.join('');
    $('#inf-equiv').innerHTML = listo ? `Equivalencia: cada 1 mL/h = <strong>${fmtNum(dosisDesdeVelocidad(1, u, peso, conc))} ${esc(u)}</strong>.` : '';

    // Titulación: solo con un intervalo validado del perfil, o con límites explícitos de la persona (otro medicamento).
    const tit = $('#inf-titulacion');
    const sub = $('#inf-tit-sub');
    sub.textContent = '';
    if (!conc || incompatible) { tit.innerHTML = `<p class="discreto">${incompatible ? 'Unidades incompatibles.' : 'Escribe una preparación válida.'}</p>`; }
    else if (f) {
      if (!perfil || perfil.fija != null || perfil.titular === false || !perfil.max) {
        tit.innerHTML = `<p class="discreto">${perfil?.fija != null ? 'Este perfil es de dosis fija: no se titula.' : 'Este perfil no fija un intervalo de titulación.'}</p>`;
      } else {
        const filas = tablaTitulacion(perfil, peso, conc);
        sub.textContent = `· ${perfil.unidad}${leerUnidadDosis(perfil.unidad).porKg && peso ? ` · ${fmtNum(peso)} kg` : ''} · ${TIPOS_FUENTE[FUENTES_INFUSION[perfil.fuente].tipo]}`;
        tit.innerHTML = filas ? tablaHtml(filas, perfil.unidad, actual) : `<p class="discreto">${hayError('inf-peso') ? 'Corrige el peso' : 'Escribe el peso'} para ver la tabla.</p>`;
      }
    } else {
      const lmin = leer('inf-lim-min', LIMITES_ENTRADA.limite);
      const lmax = leer('inf-lim-max', LIMITES_ENTRADA.limite);
      const errLim = $('#inf-lim-max-e');
      if (lmin != null && lmax != null && !(lmax > lmin)) { errLim.hidden = false; errLim.textContent = 'El límite superior debe ser mayor que el inferior.'; }
      if (lmin == null || lmax == null || !(lmax > lmin) || faltaPeso) tit.innerHTML = '<p class="discreto">Sin límites definidos: no se genera tabla.</p>';
      else {
        const filas = pasosTitulacion(lmin, lmax).map((x) => ({ dosis: x, mlh: velocidadMlH(x, u, peso, conc) }));
        sub.textContent = `· ${u} · límites definidos por ti`;
        tit.innerHTML = tablaHtml(filas, u, actual);
      }
    }
    actualizarPauta(peso, conc);
  }

  function tablaHtml(filas, unidad, actual) {
    return `
      <div class="tabla-envoltura"><table class="tabla tabla-titulacion">
        <thead><tr><th scope="col">Dosis (${esc(unidad)})</th><th scope="col" class="num-col">mL/h</th></tr></thead>
        <tbody>${filas.map((x) => `<tr${actual != null && x.mlh != null && Math.abs(x.mlh - actual) < 0.05 ? ' class="actual"' : ''}><th scope="row">${fmtNum(x.dosis)}</th><td class="num-col">${fmtNum(x.mlh)}</td></tr>`).join('')}</tbody>
      </table></div>`;
  }

  function actualizarPauta(peso, conc) {
    const caja = $('#inf-r-bolo');
    if (!caja || !f?.pautas.length) return;
    const pauta = f.pautas.find((x) => x.id === estado.pauta) || f.pautas[0];
    const prep = estado.prep && conc ? { ...estado.prep, cantidad: Number(estado.prep.cantidad.replace(',', '.')), volumen: Number(estado.prep.volumen.replace(',', '.')), texto: 'tu preparación' } : null;
    $('#inf-pauta-desc').innerHTML = `
      <p class="pauta-texto"><strong>${esc(pauta.indicacion)}</strong> · ${esc(pauta.poblacion)}${pauta.especializada ? ' <span class="chip-fuente fuente-institucional">Uso especializado</span>' : ''}</p>
      <p>${esc(textoPauta(f, pauta, null, prep))}. Vía: ${esc(pauta.via)}.${pauta.frecuencia ? ` ${esc(pauta.frecuencia)}.` : ''}${pauta.maximo ? ` ${esc(pauta.maximo)}.` : ''}</p>
      <p class="discreto">Fuente: ${esc(FUENTES_INFUSION[pauta.fuente].texto)}${pauta.nota ? ` ${esc(pauta.nota)}` : ''}</p>`;
    const unidad = pauta.porPeso ? 'mg' : pauta.dosis.unidad;
    $('#inf-bolo-u').textContent = `Total en ${unidad}`;
    const noAplica = pautaNoAplica(pauta, peso);
    const rango = dosisPauta(pauta, peso);
    const { conc: cPauta, texto: cTexto } = concPauta(f, pauta, prep);
    const dosis = leer('inf-bolo', LIMITES_ENTRADA.bolo);
    const partes = [];
    if (noAplica) partes.push(`<p class="fuera-rango">${icono('alerta')} ${esc(noAplica)}</p>`);
    else if (!rango) partes.push(`<p class="discreto">${hayError('inf-peso') ? 'Corrige el peso' : 'Escribe el peso'} para calcular esta pauta.</p>`);
    else {
      const r = (a, b, s) => (Math.abs(a - b) < 1e-9 ? `${fmtNum(a)} ${s}` : `${fmtNum(a)} a ${fmtNum(b)} ${s}`);
      const vMin = volumenDeDosis(rango.min, rango.unidad, cPauta);
      const vMax = volumenDeDosis(rango.max, rango.unidad, cPauta);
      partes.push(`<p class="discreto">Dosis de la pauta${peso ? ` para ${fmtNum(peso)} kg` : ''}: ${r(rango.min, rango.max, rango.unidad)}${vMin != null ? ` = ${r(vMin, vMax, 'mL')} de ${esc(cTexto)}` : ''}${pauta.duracionMin && vMax != null ? ` en ${pauta.duracionMin} min (${r(vMin * 60 / pauta.duracionMin, vMax * 60 / pauta.duracionMin, 'mL/h')})` : ''}.</p>`);
      if (dosis != null) {
        const vol = volumenDeDosis(dosis, rango.unidad, cPauta);
        const fuera = dosis < rango.min * 0.999 || dosis > rango.max * 1.001;
        partes.unshift(`<p class="resultado-inf"><span class="cifra-inf">${fmtNum(vol)} <small>mL</small></span><span>para ${fmtNum(dosis)} ${esc(rango.unidad)} de ${esc(cTexto)}${pauta.duracionMin ? ` en ${pauta.duracionMin} min (${fmtNum(vol * 60 / pauta.duracionMin)} mL/h)` : ''}.</span>${fuera ? `<span class="fuera-rango">${icono('alerta')} Fuera de la dosis de la pauta (${r(rango.min, rango.max, rango.unidad)}).</span>` : ''}</p>`);
      }
    }
    caja.innerHTML = partes.join('');
  }

  $$('#panel-inf input, #panel-inf select').forEach((el) => {
    if (el.id === 'inf-farmaco') return;
    el.addEventListener('input', () => {
      if (el.id === 'inf-perfil') {
        estado.perfil = el.value;
        const p = f.infusiones.find((x) => x.id === el.value);
        // La unidad pasa a la del perfil para que la comparación sea directa.
        if (p) { $('#inf-udosis').value = p.unidad; estado.unidadDosis = p.unidad; }
        $('#inf-perfil-desc').textContent = p ? `${p.poblacion}. ${p.fija != null ? `Dosis fija: ${fmtNum(p.fija)} ${p.unidad}.` : p.max ? `Intervalo: ${fmtNum(p.min)} a ${fmtNum(p.max)} ${p.unidad}.` : ''} ${p.titulacion || ''}` : '';
      }
      if (el.id === 'inf-pauta') estado.pauta = el.value;
      if (el.id === 'inf-familia') {
        // Cambiar de familia rehace el panel en el sitio (sin tocar la ruta) con unidades de esa familia.
        estado.peso = $('#inf-peso').value;
        estado.familia = el.value;
        const fam = FAMILIAS[el.value];
        estado.prep = { cantidad: $('#inf-cantidad')?.value || '', unidad: fam ? fam.cantidades[1] || fam.cantidades[0] : '', volumen: $('#inf-volumen')?.value || '' };
        estado.unidadDosis = fam ? fam.dosis[0] : null;
        $('#panel-inf').innerHTML = panelCalcular(OTRO);
        montarInfusiones({ pestana: 'calcular' });
        $('#inf-familia')?.focus();
        return;
      }
      actualizar();
    });
  });
  $$('[data-prep]').forEach((b) => b.addEventListener('click', () => {
    const x = f.preparaciones[Number(b.dataset.prep)];
    $('#inf-cantidad').value = String(x.cantidad);
    $('#inf-unidad').value = x.unidad;
    $('#inf-volumen').value = String(x.volumen);
    actualizar();
  }));
  actualizar();
}
