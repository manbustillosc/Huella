// Pantalla de revisión de medicamentos: registro, STOPP/START v3, Beers 2023 y resumen para la nota.
import { almacen } from '../almacen.js';
import { porId } from '../datos.js';
import {
  STOPP, START, BEERS, ESTADOS_CRITERIO, ESTADOS_BEERS, CAMPOS_MEDICAMENTO, ENLACE_BEERS, ENLACE_STOPP,
  medicacionDe, normalizarMedicamento, lineaMedicamento, textoRenal, resumenMedicacion, textoRevision,
} from '../medicacion.js';
import { vigenteDe, diasEntre } from '../comparacion.js';
import { $, $$, esc, icono, plural, aviso, copiar, confirmarEnDosToques, hoyISO } from '../ui.js';

const leer = () => medicacionDe(almacen.valoracion());
function guardar(m) {
  const v = almacen.valoracion();
  v.medicacion = m;
  almacen.guardarValoracion(v);
}
const nuevoIdMed = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const PESTANAS = [
  ['medicamentos', 'Medicamentos'],
  ['stopp', 'STOPP/START'],
  ['beers', 'Beers 2023'],
  ['resumen', 'Resumen'],
];

function contadorPestana(id, r) {
  if (id === 'medicamentos') return r.m.meds.length;
  if (id === 'stopp') return `${r.revisados.stopp + r.revisados.start}/190`;
  if (id === 'beers') return `${r.beersRevisadas}/${BEERS.length}`;
  return r.problemas.length ? `${r.problemas.length} !` : '';
}

/* ---------- Medicamentos y función renal ---------- */

function candidatoRenal(id) {
  const rs = almacen.resultadosDe(id).filter((x) => !x.noEvaluable && Number.isFinite(x.valor));
  return rs.length ? vigenteDe(rs) : null;
}

function bloqueRenal(m) {
  const filas = [['ckdepi', 'tfg', 'TFGe (CKD-EPI 2021)'], ['cockcroft', 'depuracion', 'Depuración de creatinina (Cockcroft-Gault)']].map(([id, campo, nombre]) => {
    const r = candidatoRenal(id);
    if (!r) return `<li class="vinculo sin-dato">${icono('pendiente')}<div><strong>${esc(nombre)}</strong><span>Sin registro de ${esc(porId[id].corto)} en esta valoración.</span></div></li>`;
    const dias = r.fecha ? diasEntre(r.fecha, hoyISO()) : 0;
    const usado = m.renal?.[campo]?.fuente === id && m.renal[campo].valor === Math.round(r.valor) && m.renal[campo].fecha === r.fecha;
    return `
      <li class="vinculo${usado ? ' usado' : ''}">
        ${icono(usado ? 'completo' : 'ruta')}
        <div>
          <strong>${esc(nombre)}</strong>
          <span>${esc(`${r.mostrar} ${r.unidad || ''}`.trim())} · ${esc(r.fecha ? r.fecha.split('-').reverse().join('/') : 'sin fecha')}</span>
          ${dias > 30 ? '<span class="vin-adv">Tiene más de 30 días: confirma que siga vigente.</span>' : ''}
        </div>
        ${usado ? '<span class="vin-usado">En uso</span>' : `<button class="btn btn-chico" type="button" data-renal="${id}">Usar este dato</button>`}
      </li>`;
  }).join('');
  const actual = textoRenal(m.renal);
  return `
    <section class="tarjeta" id="bloque-renal" aria-labelledby="renal-t">
      <h2 class="titulo-tarjeta" id="renal-t">Función renal para la revisión</h2>
      <p class="vin-nota">Necesaria para la sección E de STOPP y la tabla 6 de Beers. Huella no usa datos de otras pruebas sin tu confirmación.</p>
      <ul class="vinculos-lista">${filas}</ul>
      <details class="renal-manual">
        <summary>Registrar manualmente</summary>
        <div class="campos">
          <label class="campo"><span>TFGe (mL/min/1.73 m²)</span><input id="r-tfg" type="number" inputmode="decimal" min="1" max="200" step="1"></label>
          <label class="campo"><span>Depuración (mL/min)</span><input id="r-dep" type="number" inputmode="decimal" min="1" max="250" step="1"></label>
          <label class="campo"><span>Fecha del dato</span><input id="r-fecha" type="date" max="${hoyISO()}" value="${hoyISO()}"></label>
        </div>
        <button class="btn btn-chico" type="button" id="r-guardar">Guardar función renal</button>
      </details>
      <p class="renal-actual" id="renal-actual">${actual ? `${icono('completo')} En uso: ${esc(actual)}. <button class="enlace" type="button" id="r-quitar">Quitar</button>` : `${icono('pendiente')} Sin función renal registrada.`}</p>
    </section>`;
}

function formularioMed(med = null) {
  return `
    <section class="tarjeta" aria-labelledby="form-med-t">
      <h2 class="titulo-tarjeta" id="form-med-t">${med ? 'Editar medicamento' : 'Agregar medicamento'}</h2>
      <form id="form-med" novalidate${med ? ` data-editar="${esc(med.id)}"` : ''}>
        <div class="campos campos-med">
          ${CAMPOS_MEDICAMENTO.map((c) => `
            <label class="campo${c.id === 'observaciones' || c.id === 'indicacion' ? ' ancho' : ''}"><span>${esc(c.etiqueta)}${c.requerido ? ' *' : ''}</span>
              <input name="${c.id}" type="text" maxlength="${c.max}" autocomplete="off" value="${esc(med?.[c.id] || '')}"${c.ejemplo ? ` placeholder="${esc(c.ejemplo)}"` : ''}${c.requerido ? ' aria-required="true"' : ''}>
            </label>`).join('')}
        </div>
        <p class="error-campo" id="e-med" role="alert" hidden></p>
        <p class="aviso-datos">${icono('escudo')} Solo datos del medicamento; no escribas nombre, expediente ni otros datos de la persona.</p>
        <div class="acciones-form">
          <button class="btn btn-primario" type="submit">${icono(med ? 'check' : 'mas')} ${med ? 'Guardar cambios' : 'Agregar'}</button>
          ${med ? '<button class="btn" type="button" id="cancelar-med">Cancelar</button>' : ''}
        </div>
      </form>
    </section>`;
}

function listaMeds(m) {
  if (!m.meds.length) return '<p class="vacio-texto" id="lista-meds">Aún no hay medicamentos registrados.</p>';
  return `
    <ul class="lista-meds" id="lista-meds">
      ${m.meds.map((x) => `
        <li class="med">
          <div class="med-texto">
            <span class="med-nombre">${esc(x.generico)}${x.comercial ? ` <span class="med-comercial">(${esc(x.comercial)})</span>` : ''}</span>
            <span class="med-pauta">${esc([x.dosis, x.presentacion, x.via, x.frecuencia].filter(Boolean).join(' · ') || 'Pauta no registrada')}</span>
            <span class="med-indicacion${x.indicacion ? '' : ' falta'}">${esc(x.indicacion ? `Indicación: ${x.indicacion}` : 'Indicación no registrada')}${x.duracion ? ` · ${esc(x.duracion)}` : ''}</span>
            ${x.observaciones ? `<span class="med-obs">${esc(x.observaciones)}</span>` : ''}
          </div>
          <div class="med-acciones">
            <button class="btn-icono" type="button" data-editar-med="${esc(x.id)}" aria-label="Editar ${esc(x.generico)}">${icono('editar')}</button>
            <button class="btn-icono" type="button" data-quitar-med="${esc(x.id)}" aria-label="Quitar ${esc(x.generico)}">${icono('cerrar')}</button>
          </div>
        </li>`).join('')}
    </ul>`;
}

function panelMedicamentos(m, editar = null) {
  return `
    <section class="tarjeta" aria-labelledby="contexto-t">
      <h2 class="titulo-tarjeta" id="contexto-t">Contexto</h2>
      <label class="casilla"><input type="checkbox" id="m-paliativo"${m.paliativo ? ' checked' : ''}><span>Cuidados paliativos o final de la vida</span></label>
      <p class="ayuda">En este contexto los criterios START no aplican y los de Beers no se usan de forma indiscriminada.</p>
    </section>
    ${bloqueRenal(m)}
    ${formularioMed(editar)}
    <h2 class="seccion">Medicamentos registrados <span class="cuenta-med">(${m.meds.length})</span></h2>
    ${listaMeds(m)}`;
}

/* ---------- STOPP/START ---------- */

const estadoCriterio = (m, id) => m.stopp[id]?.estado || 'sin';

function filaCriterio(m, c, tipo, letra, i) {
  const id = `${tipo === 'stopp' ? 'S' : 'T'}-${letra}${i + 1}`;
  const codigo = `${tipo.toUpperCase()} ${letra}${i + 1}`;
  const est = estadoCriterio(m, id);
  const med = m.stopp[id]?.med || '';
  return `
    <li class="criterio est-${est}" data-criterio="${id}">
      <p class="crit-texto"><span class="crit-codigo">${codigo}</span> ${esc(c)}</p>
      <div class="estados-crit" role="radiogroup" aria-label="Estado de ${codigo}">
        ${ESTADOS_CRITERIO.map((e) => `<label class="est-op op-${e.id}"><input type="radio" name="c-${id}" value="${e.id}"${e.id === est ? ' checked' : ''}><span>${esc(e.nombre)}</span></label>`).join('')}
      </div>
      ${tipo === 'stopp' && m.meds.length ? `
        <label class="crit-med"${est === 'cumple' ? '' : ' hidden'}><span>Fármaco implicado (opcional)</span>
          <select data-med-crit="${id}"><option value="">—</option>${m.meds.map((x) => `<option value="${esc(x.id)}"${x.id === med ? ' selected' : ''}>${esc(x.generico)}</option>`).join('')}</select>
        </label>` : ''}
    </li>`;
}

function contadorSeccion(m, tipo, s) {
  const ids = s.criterios.map((_, i) => `${tipo === 'stopp' ? 'S' : 'T'}-${s.letra}${i + 1}`);
  const rev = ids.filter((id) => estadoCriterio(m, id) !== 'sin').length;
  const cumple = ids.filter((id) => estadoCriterio(m, id) === 'cumple').length;
  return `${rev} de ${ids.length} revisados${cumple ? ` · ${plural(cumple, 'se cumple', 'se cumplen')}` : ''}`;
}

function seccionCriterios(m, tipo, s) {
  return `
    <details class="seccion-crit" data-seccion="${tipo}-${s.letra}">
      <summary><span class="sec-letra">${s.letra}</span><span class="sec-titulo">${esc(s.titulo)}</span><span class="sec-cuenta" data-cuenta="${tipo}-${s.letra}">${esc(contadorSeccion(m, tipo, s))}</span></summary>
      <button class="btn btn-chico" type="button" data-marcar-no="${tipo}-${s.letra}">Marcar los sin revisar como «No se cumple»</button>
      <ol class="criterios">${s.criterios.map((c, i) => filaCriterio(m, c, tipo, s.letra, i)).join('')}</ol>
    </details>`;
}

function panelStopp(m) {
  return `
    <section class="intro-crit">
      <p>Marca cada criterio: <strong>se cumple</strong> (posible problema), <strong>no se cumple</strong> o <strong>no evaluable</strong> por falta de información. No hay puntaje: cada criterio que se cumple se revisa por separado.</p>
      <p class="discreto">Redacción condensada en español elaborada para Huella a partir de STOPP/START versión 3 (O'Mahony et al., 2023; licencia CC BY 4.0). No es una traducción oficial: ante dudas consulta el <a href="${ENLACE_STOPP}" target="_blank" rel="noopener">texto original</a>.</p>
      ${m.paliativo ? `<p class="aviso-episodio">${icono('alerta')} Contexto paliativo: los criterios START no aplican al final de la vida.</p>` : ''}
    </section>
    <h2 class="seccion">STOPP · 133 criterios de prescripción potencialmente inapropiada</h2>
    ${STOPP.map((s) => seccionCriterios(m, 'stopp', s)).join('')}
    <h2 class="seccion">START · 57 criterios de omisión de tratamientos indicados</h2>
    <p class="discreto">Se consideran cuando el fármaco se omitió sin razón clínica válida y tras revisar sus contraindicaciones.</p>
    ${START.map((s) => seccionCriterios(m, 'start', s)).join('')}`;
}

/* ---------- Beers ---------- */

function panelBeers(m) {
  return `
    <section class="intro-crit">
      <p>Revisión manual por categorías con la publicación oficial de la American Geriatrics Society. Huella no reproduce las tablas (© AGS): ábrelas en el <a href="${ENLACE_BEERS}" target="_blank" rel="noopener">artículo oficial</a> y registra aquí el resultado de cada categoría.</p>
      <p class="aviso-episodio">${icono('alerta')} Los criterios de Beers no están pensados para hospicio ni cuidados al final de la vida; en cuidados paliativos no se aplican de forma indiscriminada.</p>
    </section>
    ${BEERS.map((b) => {
      const r = m.beers[b.id] || {};
      const est = r.estado || 'sin';
      return `
        <section class="tarjeta beers-cat est-${est}" data-beers="${b.id}">
          <h3 class="titulo-tarjeta">Tabla ${b.tabla} · ${esc(b.nombre)}</h3>
          <div class="estados-crit" role="radiogroup" aria-label="Estado de la tabla ${b.tabla}">
            ${ESTADOS_BEERS.map((e) => `<label class="est-op op-${e.id}"><input type="radio" name="b-${b.id}" value="${e.id}"${e.id === est ? ' checked' : ''}><span>${esc(e.nombre)}</span></label>`).join('')}
          </div>
          <label class="campo ancho beers-nota"${est === 'hallazgo' || est === 'ne' ? '' : ' hidden'}><span>${est === 'ne' ? 'Qué información falta' : 'Hallazgo (fármaco y criterio)'}</span>
            <textarea data-nota-beers="${b.id}" maxlength="300" rows="2">${esc(r.nota || '')}</textarea>
          </label>
        </section>`;
    }).join('')}`;
}

/* ---------- Resumen ---------- */

function panelResumen(m) {
  const r = resumenMedicacion(m);
  const lista = (xs, vacio) => (xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="discreto">${esc(vacio)}</p>`);
  return `
    <section class="tarjeta"><h2 class="titulo-tarjeta">Medicamentos (${m.meds.length})</h2>${lista(m.meds.map(lineaMedicamento), 'Sin medicamentos registrados.')}
      ${textoRenal(m.renal) ? `<p class="discreto">Función renal: ${esc(textoRenal(m.renal))}.</p>` : ''}</section>
    <section class="tarjeta"><h2 class="titulo-tarjeta">Criterios revisados</h2>
      <p>STOPP: ${r.revisados.stopp} de 133 (se cumplen ${r.conteo.stopp.cumple}; no evaluables ${r.conteo.stopp.ne}). START: ${r.revisados.start} de 57 (se cumplen ${r.conteo.start.cumple}; no evaluables ${r.conteo.start.ne}). Beers: ${r.beersRevisadas} de ${BEERS.length} categorías.</p></section>
    <section class="tarjeta"><h2 class="titulo-tarjeta">Posibles problemas</h2>${lista(r.problemas, 'Ninguno en los criterios revisados; la conclusión se limita a ellos.')}</section>
    <section class="tarjeta"><h2 class="titulo-tarjeta">Información pendiente</h2>${lista(r.pendientes, 'Sin información pendiente.')}</section>
    <section class="sugerencias"><h2 class="sub">${icono('bombilla')} Sugerencias orientativas</h2>
      <p class="sugerencias-nota">No son órdenes de suspensión ni de ajuste de dosis; la decisión es clínica.</p>${lista(r.sugerencias, 'Sin sugerencias por ahora.')}</section>
    <div class="cabecera-nota"><h2 class="seccion">Texto de la revisión</h2></div>
    <pre class="nota" id="texto-med">${esc(textoRevision(m))}</pre>
    <div class="acciones"><button class="btn btn-primario" type="button" id="copiar-med">${icono('copiar')} Copiar la revisión</button><a class="btn" href="#/valoracion">${icono('valoracion')} Ver la nota completa</a></div>`;
}

/* ---------- Vista ---------- */

export function renderMedicacion({ pestana }) {
  const m = leer();
  const r = resumenMedicacion(m);
  const editar = pestana === 'medicamentos' ? m.meds.find((x) => x.id === medEnEdicion()) || null : null;
  const panel = { medicamentos: () => panelMedicamentos(m, editar), stopp: panelStopp, beers: panelBeers, resumen: panelResumen }[pestana](m);
  return `
    <section class="vista medicacion">
      <a class="migas" href="#/d/polifarmacia">${icono('atras')} Polifarmacia</a>
      <header class="cabecera">
        <p class="ceja">Polifarmacia · Lista de verificación</p>
        <h1>Revisión de medicamentos</h1>
        <p class="entradilla">Registra la medicación y revisa STOPP/START v3 y Beers 2023. No hay puntaje y Huella no suspende ni ajusta dosis.</p>
      </header>
      <nav class="pestanas-med" aria-label="Secciones de la revisión">
        ${PESTANAS.map(([id, nombre]) => {
          const n = contadorPestana(id, r);
          return `<a href="#/medicacion/${id}"${id === pestana ? ' aria-current="page" class="activo"' : ''}>${esc(nombre)}${n !== '' ? ` <span class="pest-cuenta">${esc(String(n))}</span>` : ''}</a>`;
        }).join('')}
      </nav>
      <div id="panel-med" data-pestana="${pestana}">${panel}</div>
    </section>`;
}

export function montarMedicacion({ pestana }, rerender, alCambiar) {
  const panel = $('#panel-med');
  const actualizar = () => {
    alCambiar();
    const r = resumenMedicacion(leer());
    $$('.pestanas-med a').forEach((a) => {
      const id = a.getAttribute('href').split('/').pop();
      const n = contadorPestana(id, r);
      let span = a.querySelector('.pest-cuenta');
      if (n === '' && span) span.remove();
      if (n !== '') {
        if (!span) { span = document.createElement('span'); span.className = 'pest-cuenta'; a.append(' ', span); }
        span.textContent = String(n);
      }
    });
  };

  if (pestana === 'medicamentos') {
    $('#m-paliativo').addEventListener('change', (ev) => {
      const m = leer();
      m.paliativo = ev.target.checked;
      guardar(m);
      aviso(m.paliativo ? 'Contexto paliativo registrado' : 'Contexto paliativo quitado');
    });
    $$('[data-renal]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.renal;
      const res = candidatoRenal(id);
      if (!res) return;
      const m = leer();
      m.renal = { ...(m.renal || {}), [id === 'ckdepi' ? 'tfg' : 'depuracion']: { valor: Math.round(res.valor), fecha: res.fecha || null, fuente: id } };
      guardar(m);
      rerender();
      aviso('Función renal tomada de esta valoración');
    }));
    $('#r-guardar').addEventListener('click', () => {
      const tfg = Number($('#r-tfg').value);
      const dep = Number($('#r-dep').value);
      const fecha = $('#r-fecha').value || hoyISO();
      const ok = (x, max) => Number.isFinite(x) && x >= 1 && x <= max;
      if (!ok(tfg, 200) && !ok(dep, 250)) { aviso('Escribe una TFGe (1 a 200) o una depuración (1 a 250)'); return; }
      const m = leer();
      m.renal = { ...(m.renal || {}) };
      if (ok(tfg, 200)) m.renal.tfg = { valor: Math.round(tfg), fecha, fuente: 'manual' };
      if (ok(dep, 250)) m.renal.depuracion = { valor: Math.round(dep), fecha, fuente: 'manual' };
      guardar(m);
      rerender();
      aviso('Función renal registrada');
    });
    $('#r-quitar')?.addEventListener('click', () => {
      const m = leer();
      m.renal = null;
      guardar(m);
      rerender();
      aviso('Función renal quitada');
    });
    const form = $('#form-med');
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const datos = Object.fromEntries(new FormData(form).entries());
      const m = leer();
      const editar = form.dataset.editar;
      const med = normalizarMedicamento(datos, editar || nuevoIdMed());
      if (!med) {
        const e = $('#e-med');
        e.textContent = 'Escribe al menos el nombre genérico.';
        e.hidden = false;
        form.querySelector('[name="generico"]').focus();
        return;
      }
      if (editar) m.meds = m.meds.map((x) => (x.id === editar ? med : x));
      else m.meds.push(med);
      guardar(m);
      fijarEdicion(null);
      actualizar();
      rerender();
      aviso(editar ? 'Medicamento actualizado' : `${med.generico} agregado`);
    });
    $('#cancelar-med')?.addEventListener('click', () => { fijarEdicion(null); rerender(); });
    $$('[data-editar-med]').forEach((b) => b.addEventListener('click', () => {
      fijarEdicion(b.dataset.editarMed);
      rerender();
    }));
    $$('[data-quitar-med]').forEach((b) => confirmarEnDosToques(b, {
      texto: icono('alerta'),
      accion: () => {
        const m = leer();
        const id = b.dataset.quitarMed;
        m.meds = m.meds.filter((x) => x.id !== id);
        for (const k of Object.keys(m.stopp)) if (m.stopp[k].med === id) delete m.stopp[k].med;
        guardar(m);
        actualizar();
        rerender();
        aviso('Medicamento quitado');
      },
    }));
  }

  if (pestana === 'stopp') {
    const refrescarCuenta = (seccion) => {
      const [tipo, letra] = seccion.split('-');
      const s = (tipo === 'stopp' ? STOPP : START).find((x) => x.letra === letra);
      const el = panel.querySelector(`[data-cuenta="${seccion}"]`);
      if (el) el.textContent = contadorSeccion(leer(), tipo, s);
    };
    panel.addEventListener('change', (ev) => {
      const radio = ev.target.closest('input[type="radio"][name^="c-"]');
      const sel = ev.target.closest('[data-med-crit]');
      if (radio) {
        const id = radio.name.slice(2);
        const m = leer();
        if (radio.value === 'sin') delete m.stopp[id];
        else m.stopp[id] = { ...(m.stopp[id] || {}), estado: radio.value };
        if (radio.value !== 'cumple' && m.stopp[id]) delete m.stopp[id].med;
        guardar(m);
        const li = radio.closest('.criterio');
        li.className = `criterio est-${radio.value}`;
        const medSel = li.querySelector('.crit-med');
        if (medSel) medSel.hidden = radio.value !== 'cumple';
        refrescarCuenta(li.closest('[data-seccion]').dataset.seccion);
        actualizar();
      }
      if (sel) {
        const m = leer();
        const id = sel.dataset.medCrit;
        if (m.stopp[id]) {
          if (sel.value) m.stopp[id].med = sel.value;
          else delete m.stopp[id].med;
          guardar(m);
        }
      }
    });
    $$('[data-marcar-no]').forEach((b) => b.addEventListener('click', () => {
      const seccion = b.dataset.marcarNo;
      const det = panel.querySelector(`[data-seccion="${seccion}"]`);
      const m = leer();
      let n = 0;
      det.querySelectorAll('.criterio').forEach((li) => {
        const id = li.dataset.criterio;
        if ((m.stopp[id]?.estado || 'sin') !== 'sin') return;
        m.stopp[id] = { estado: 'no' };
        li.className = 'criterio est-no';
        li.querySelector('input[value="no"]').checked = true;
        n += 1;
      });
      guardar(m);
      refrescarCuenta(seccion);
      actualizar();
      aviso(n ? `${plural(n, 'criterio marcado', 'criterios marcados')} como «No se cumple»` : 'No había criterios sin revisar en esta sección');
    }));
  }

  if (pestana === 'beers') {
    panel.addEventListener('change', (ev) => {
      const radio = ev.target.closest('input[type="radio"][name^="b-"]');
      if (!radio) return;
      const id = radio.name.slice(2);
      const m = leer();
      if (radio.value === 'sin') delete m.beers[id];
      else m.beers[id] = { ...(m.beers[id] || {}), estado: radio.value };
      guardar(m);
      const card = radio.closest('[data-beers]');
      card.className = `tarjeta beers-cat est-${radio.value}`;
      const nota = card.querySelector('.beers-nota');
      nota.hidden = !['hallazgo', 'ne'].includes(radio.value);
      nota.querySelector('span').textContent = radio.value === 'ne' ? 'Qué información falta' : 'Hallazgo (fármaco y criterio)';
      actualizar();
    });
    panel.addEventListener('input', (ev) => {
      const t = ev.target.closest('[data-nota-beers]');
      if (!t) return;
      const m = leer();
      const id = t.dataset.notaBeers;
      m.beers[id] = { ...(m.beers[id] || { estado: 'hallazgo' }), nota: t.value.slice(0, 300) };
      guardar(m);
    });
  }

  if (pestana === 'resumen') {
    $('#copiar-med').addEventListener('click', () => copiar($('#texto-med').textContent, 'Revisión copiada'));
  }
}

// Medicamento en edición (sobrevive al re-render de la pantalla, no a cerrar la pestaña).
function medEnEdicion() {
  try { return sessionStorage.getItem('huella:editar-med'); } catch { return null; }
}
function fijarEdicion(id) {
  try {
    if (id) sessionStorage.setItem('huella:editar-med', id);
    else sessionStorage.removeItem('huella:editar-med');
  } catch { /* sin almacenamiento de sesión: la edición no persiste entre pantallas */ }
}
