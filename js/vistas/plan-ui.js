// Piezas de interfaz del plan de atención compartidas por el plan geriátrico y el seguimiento:
// preferencias, valoración del médico, prioridad, objetivos, intervenciones y revaloración por ámbito.
import { almacen } from '../almacen.js';
import {
  ESTADOS_PROBLEMA, PRIORIDADES, ESTADOS_OBJETIVO, ESTADOS_INTERVENCION, CATEGORIAS_INTERVENCION, CAMPOS_OBJETIVO,
  CAMPOS_PREFERENCIAS, MAX_PREFERENCIA, MAX_NOMBRE_PROBLEMA, nombreDe, lineaObjetivo, problemaDe, planDe, nombreAmbito,
  fijarProblema, fijarPrioridad, fijarRevaloracion, agregarObjetivo, actualizarObjetivo, quitarObjetivo, agregarIntervencion,
  actualizarIntervencion, quitarIntervencion, fijarPreferencias, registrarCambio, agregarProblemaLibre, quitarProblemaLibre,
} from '../plan.js';
import { $$, esc, icono, hoyISO, aviso, confirmarEnDosToques } from '../ui.js';

export const slugAmbito = (a) => String(a).replace(/[^a-z0-9_-]/gi, '-');
export const avisoDatos = `<p class="aviso-datos">${icono('escudo')} Escribe sin nombres, expedientes ni otros datos que identifiquen a la persona o a su familia.</p>`;

export function formularioPreferencias(plan, { nota = '' } = {}) {
  const vacio = !Object.keys(plan.preferencias).length;
  return `
    <details class="tarjeta icope-pref" id="preferencias"${vacio ? ' open' : ''}>
      <summary><span class="ico-dominio">${icono('apoyo')}</span><span class="icope-det-nombre">Lo que más importa a la persona</span>${vacio ? '' : '<span class="vin-usado">Registrado</span>'}</summary>
      <p class="discreto">${esc(nota || 'Preferencias centradas en la persona. No es un documento de voluntad anticipada ni lo sustituye.')}</p>
      <form id="form-pref" novalidate>
        ${CAMPOS_PREFERENCIAS.map((c) => `
          <label class="campo ancho"><span>${esc(c.etiqueta)}</span>${c.ayuda ? `<small class="campo-ayuda">${esc(c.ayuda)}</small>` : ''}
            <textarea name="${c.id}" rows="2" maxlength="${MAX_PREFERENCIA}">${esc(plan.preferencias[c.id] || '')}</textarea>
          </label>`).join('')}
        ${avisoDatos}
        <button class="btn btn-chico btn-primario" type="submit">${icono('check')} Guardar preferencias</button>
      </form>
    </details>`;
}

export function formularioProblema() {
  return `
    <form id="form-problema" class="tarjeta form-problema" novalidate>
      <label class="campo ancho"><span>Agregar un problema que no surge de un instrumento</span>
        <input name="nombre" type="text" maxlength="${MAX_NOMBRE_PROBLEMA}" placeholder="p. ej., cuidador con sobrecarga, dolor lumbar crónico">
      </label>
      ${avisoDatos}
      <button class="btn btn-chico btn-primario" type="submit">${icono('mas')} Agregar problema</button>
    </form>`;
}

function formularioObjetivo(ambito) {
  return `
    <details class="icope-form-obj">
      <summary>${icono('mas')} Agregar objetivo</summary>
      <form data-form-objetivo="${esc(ambito)}" novalidate>
        <div class="campos">
          ${CAMPOS_OBJETIVO.map((c) => `
            <label class="campo${c.id === 'texto' ? ' ancho' : ''}"><span>${esc(c.etiqueta)}${c.requerido ? ' *' : ''}</span>
              <input name="${c.id}" type="${c.tipo === 'date' ? 'date' : 'text'}"${c.max ? ` maxlength="${c.max}"` : ''}${c.ejemplo ? ` placeholder="${esc(c.ejemplo)}"` : ''}${c.tipo === 'date' ? ` min="${hoyISO()}"` : ''}>
            </label>`).join('')}
        </div>
        <p class="error-campo" role="alert" hidden></p>
        ${avisoDatos}
        <button class="btn btn-chico btn-primario" type="submit">${icono('check')} Agregar objetivo</button>
      </form>
    </details>`;
}

const opcionesSelect = (lista, actual) => lista.map((s) => `<option value="${s.id}"${actual === s.id ? ' selected' : ''}>${esc(s.nombre)}</option>`).join('');

// Tarjeta editable de un problema del plan.
export function tarjetaProblema(p, plan, { sugeridas = [], fuenteSugeridas = 'Sugerencias orientativas', enlaces = '', urlResultado = null, abierta = false } = {}) {
  const id = slugAmbito(p.ambito);
  const prob = problemaDe(plan, p.ambito);
  const enPlan = new Set(p.intervenciones.map((i) => i.texto));
  return `
    <details class="tarjeta icope-plan plan-problema" id="c-${id}"${abierta ? ' open' : ''}>
      <summary class="icope-dom-cab"><h3>${esc(p.nombre)}</h3>${chipEstadoProblema(p)}</summary>
      ${p.hallazgos.length ? `
        <p class="icope-sub">${icono('alerta')} Hallazgos de tamizaje</p>
        <ul class="plan-hallazgos">${p.hallazgos.map((h) => `<li>${urlResultado && h.escalaId ? `<a href="${urlResultado(h)}">${esc(h.texto)}</a>` : esc(h.texto)}</li>`).join('')}</ul>
        <p class="discreto">Un tamizaje positivo no es un diagnóstico.</p>` : ''}
      <div class="campos plan-valoracion">
        <label class="campo"><span>Valoración del médico</span>
          <select data-problema="${esc(p.ambito)}">
            <option value="">${p.derivado ? 'Sin asignar (hallazgo de tamizaje derivado)' : 'Sin asignar'}</option>
            ${opcionesSelect(ESTADOS_PROBLEMA, prob?.estado)}
          </select>
        </label>
        <label class="campo ancho"><span>Nota breve (opcional)</span><input type="text" maxlength="200" data-nota-problema="${esc(p.ambito)}" value="${esc(prob?.nota || '')}"></label>
      </div>
      <fieldset class="icope-prioridad">
        <legend>Prioridad (la decide el médico)</legend>
        <div class="segmentado">
          ${[...PRIORIDADES, { id: '', nombre: 'Sin definir' }].map((x) => `<label><input type="radio" name="prio-${id}" value="${x.id}" data-prioridad="${esc(p.ambito)}"${(p.prioridad || '') === x.id ? ' checked' : ''}>${esc(x.nombre)}</label>`).join('')}
        </div>
      </fieldset>
      <p class="icope-sub">${icono('objetivo')} Objetivos</p>
      ${p.objetivos.length ? `<ul class="icope-objetivos">${p.objetivos.map((o) => `
        <li><span>${esc(lineaObjetivo(o))}</span><button class="btn-icono" type="button" data-quitar-objetivo="${esc(o.id)}" aria-label="Quitar objetivo">${icono('cerrar')}</button></li>`).join('')}</ul>` : '<p class="discreto">Sin objetivos.</p>'}
      ${formularioObjetivo(p.ambito)}
      ${sugeridas.length ? `
        <p class="icope-sub">${icono('bombilla')} ${esc(fuenteSugeridas)}</p>
        <p class="discreto">Para comentar con la persona; ninguna se agrega sola ni se marca como realizada. Agrega solo las acordadas.</p>
        <ul class="icope-sugeridas">${sugeridas.map((s) => `
          <li>
            <span><span class="cat-int">${esc(nombreDe(CATEGORIAS_INTERVENCION, s.categoria))}</span> ${esc(s.texto)}</span>
            ${enPlan.has(s.texto) ? '<span class="vin-usado">En el plan</span>' : `<button class="btn btn-chico" type="button" data-agregar-int="${esc(p.ambito)}" data-categoria="${s.categoria}" data-texto="${esc(s.texto)}">Agregar</button>`}
          </li>`).join('')}</ul>` : ''}
      <details class="icope-form-int">
        <summary>${icono('mas')} ${sugeridas.length ? 'Otra intervención' : 'Agregar intervención'}</summary>
        <form data-form-int="${esc(p.ambito)}" novalidate>
          <div class="campos">
            <label class="campo"><span>Categoría</span><select name="categoria">${CATEGORIAS_INTERVENCION.map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}</select></label>
            <label class="campo ancho"><span>Intervención</span><input name="texto" type="text" maxlength="200"></label>
          </div>
          ${avisoDatos}
          <button class="btn btn-chico btn-primario" type="submit">${icono('check')} Agregar intervención</button>
        </form>
      </details>
      ${p.intervenciones.length ? `<p class="icope-sub">Intervenciones en el plan</p><ul class="icope-segs">${p.intervenciones.map((i) => filaIntervencion(i)).join('')}</ul>` : ''}
      <div class="plan-pie">
        <label class="campo icope-reval"><span>Fecha de revaloración</span><input type="date" min="${hoyISO()}" data-revaloracion="${esc(p.ambito)}" value="${esc(p.revaloracion || '')}"></label>
        ${enlaces}
      </div>
    </details>`;
}

export function chipEstadoProblema(p) {
  if (p.asignado) return `<span class="chip-problema est-p-${p.asignado.estado}">${esc(nombreDe(ESTADOS_PROBLEMA, p.asignado.estado))}</span>`;
  if (p.derivado) return '<span class="chip-problema est-p-tamizaje">Hallazgo de tamizaje <span class="chip-derivado">derivado</span></span>';
  return '<span class="chip-problema">Sin estado asignado</span>';
}

export function filaObjetivo(o, { etiqueta = '', vencido = false } = {}) {
  return `
    <li class="icope-seg">
      <span class="icope-seg-texto">${etiqueta ? `<span class="cat-int">${esc(etiqueta)}</span> ` : ''}${esc(o.texto)}${o.meta ? ` <span class="discreto">· meta: ${esc(o.meta)}</span>` : ''}${o.plazo ? ` <span class="discreto">· plazo: ${esc(o.plazo.split('-').reverse().join('/'))}</span>` : ''}${vencido ? ' <span class="vencida">plazo vencido</span>' : ''}</span>
      <label class="campo-mini"><span class="sr">Estado del objetivo</span><select data-estado-objetivo="${esc(o.id)}">${opcionesSelect(ESTADOS_OBJETIVO, o.estado)}</select></label>
    </li>`;
}

export function filaIntervencion(i, { etiqueta = '', quitar = true } = {}) {
  return `
    <li class="icope-seg">
      <span class="icope-seg-texto"><span class="cat-int">${etiqueta ? `${esc(etiqueta)} · ` : ''}${esc(nombreDe(CATEGORIAS_INTERVENCION, i.categoria))}</span> ${esc(i.texto)}${i.fechaEstado && i.estado !== 'planeada' ? ` <span class="discreto">· ${esc(i.fechaEstado.split('-').reverse().join('/'))}</span>` : ''}</span>
      <span class="seg-acciones">
        <label class="campo-mini"><span class="sr">Estado de la intervención</span><select data-estado-int="${esc(i.id)}">${opcionesSelect(ESTADOS_INTERVENCION, i.estado)}</select></label>
        ${quitar ? `<button class="btn-icono" type="button" data-quitar-int="${esc(i.id)}" aria-label="Quitar intervención">${icono('cerrar')}</button>` : ''}
      </span>
    </li>`;
}

/* ---------- Eventos ---------- */

// Guarda un cambio del plan en la valoración en curso.
export function guardarPlan(mutar) {
  const v = almacen.valoracion();
  const plan = planDe(v);
  const salida = mutar(plan, v);
  v.plan = plan;
  almacen.guardarValoracion(v);
  return salida;
}

const nombreDeAmbito = (a) => nombreAmbito(a, planDe(almacen.valoracion()));

// Conecta los controles del plan dentro de «raiz». redibujar(selectorParaEnfocar) vuelve a dibujar sin mover la página.
export function conectarPlan(raiz, { redibujar, alCambiar = () => {} }) {
  const hoy = hoyISO();
  raiz.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-agregar-int]');
    if (!b) return;
    const ambito = b.dataset.agregarInt;
    guardarPlan((plan) => agregarIntervencion(plan, ambito, { categoria: b.dataset.categoria, texto: b.dataset.texto, origen: 'sugerida' }, hoy, nombreDeAmbito(ambito)));
    redibujar();
    aviso('Intervención agregada al plan');
  });
  raiz.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.matches('[data-problema]')) {
      const a = t.dataset.problema;
      const nota = raiz.querySelector(`[data-nota-problema="${CSS.escape(a)}"]`)?.value || '';
      guardarPlan((plan) => fijarProblema(plan, a, { estado: t.value, nota }, hoy, nombreDeAmbito(a)));
      redibujar(`[data-problema="${CSS.escape(a)}"]`);
      aviso(t.value ? 'Valoración del médico registrada' : 'Valoración del médico retirada');
    } else if (t.matches('[data-nota-problema]')) {
      const a = t.dataset.notaProblema;
      const estado = raiz.querySelector(`[data-problema="${CSS.escape(a)}"]`)?.value;
      if (estado) { guardarPlan((plan) => fijarProblema(plan, a, { estado, nota: t.value }, hoy, nombreDeAmbito(a))); aviso('Nota guardada'); } else aviso('Elige primero la valoración del médico');
    } else if (t.matches('[data-prioridad]')) {
      const a = t.dataset.prioridad;
      guardarPlan((plan) => fijarPrioridad(plan, a, t.value, hoy, nombreDeAmbito(a)));
      aviso(t.value ? `Prioridad ${nombreDe(PRIORIDADES, t.value).toLowerCase()}` : 'Prioridad sin definir');
      redibujar(`[data-prioridad="${CSS.escape(a)}"][value="${t.value}"]`);
    } else if (t.matches('[data-revaloracion]')) {
      const a = t.dataset.revaloracion;
      guardarPlan((plan) => fijarRevaloracion(plan, a, t.value, hoy, nombreDeAmbito(a)));
      aviso(t.value ? 'Fecha de revaloración guardada' : 'Fecha de revaloración quitada');
      alCambiar();
    } else if (t.matches('[data-estado-objetivo]')) {
      guardarPlan((plan) => actualizarObjetivo(plan, t.dataset.estadoObjetivo, { estado: t.value }, hoy));
      redibujar(`[data-estado-objetivo="${CSS.escape(t.dataset.estadoObjetivo)}"]`);
      aviso('Estado del objetivo actualizado');
    } else if (t.matches('[data-estado-int]')) {
      guardarPlan((plan) => actualizarIntervencion(plan, t.dataset.estadoInt, { estado: t.value }, hoy));
      redibujar(`[data-estado-int="${CSS.escape(t.dataset.estadoInt)}"]`);
      aviso('Estado de la intervención actualizado');
    }
  });
  raiz.addEventListener('submit', (ev) => {
    const form = ev.target;
    ev.preventDefault();
    const datos = Object.fromEntries(new FormData(form).entries());
    if (form.id === 'form-pref') {
      guardarPlan((plan) => fijarPreferencias(plan, datos));
      redibujar();
      aviso('Preferencias guardadas');
    } else if (form.id === 'form-problema') {
      const nuevo = guardarPlan((plan) => agregarProblemaLibre(plan, datos.nombre, hoy));
      if (!nuevo) { form.querySelector('[name="nombre"]').focus(); aviso(String(datos.nombre || '').trim() ? 'Ese problema ya está en la lista' : 'Escribe el problema'); return; }
      redibujar();
      const tarjeta = raiz.querySelector(`#c-${slugAmbito(nuevo.ambito)}`);
      if (tarjeta) {
        tarjeta.open = true;
        tarjeta.scrollIntoView({ block: 'start' });
        tarjeta.querySelector('summary')?.focus({ preventScroll: true });
      }
      aviso('Problema agregado');
    } else if (form.dataset.formObjetivo) {
      const a = form.dataset.formObjetivo;
      const ok = guardarPlan((plan) => agregarObjetivo(plan, a, datos, hoy, nombreDeAmbito(a)));
      if (!ok) {
        const e = form.querySelector('.error-campo');
        e.textContent = 'Escribe el objetivo.';
        e.hidden = false;
        form.querySelector('[name="texto"]').focus();
        return;
      }
      redibujar();
      aviso('Objetivo agregado al plan');
    } else if (form.dataset.formInt) {
      const a = form.dataset.formInt;
      if (!String(datos.texto || '').trim()) { form.querySelector('[name="texto"]').focus(); aviso('Escribe la intervención'); return; }
      guardarPlan((plan) => agregarIntervencion(plan, a, { categoria: datos.categoria, texto: datos.texto }, hoy, nombreDeAmbito(a)));
      redibujar();
      aviso('Intervención agregada al plan');
    } else if (form.id === 'form-cambio') {
      const ok = guardarPlan((plan) => registrarCambio(plan, datos.texto, datos.fecha || hoy));
      if (!ok) { form.querySelector('[name="texto"]').focus(); aviso('Describe el cambio'); return; }
      redibujar();
      aviso('Cambio registrado');
    }
  });
}

// Botones de quitar (requieren un segundo toque). Se llama después de cada redibujo.
export function conectarQuitar(raiz, { redibujar }) {
  const hoy = hoyISO();
  $$('[data-quitar-objetivo]', raiz).forEach((b) => confirmarEnDosToques(b, {
    texto: icono('alerta'),
    accion: () => { guardarPlan((plan) => quitarObjetivo(plan, b.dataset.quitarObjetivo, hoy)); redibujar(); aviso('Objetivo quitado del plan'); },
  }));
  $$('[data-quitar-int]', raiz).forEach((b) => confirmarEnDosToques(b, {
    texto: icono('alerta'),
    accion: () => { guardarPlan((plan) => quitarIntervencion(plan, b.dataset.quitarInt, hoy)); redibujar(); aviso('Intervención quitada del plan'); },
  }));
  $$('[data-quitar-libre]', raiz).forEach((b) => confirmarEnDosToques(b, {
    texto: `${icono('alerta')} Toca otra vez para quitar el problema y su plan`,
    accion: () => { guardarPlan((plan) => quitarProblemaLibre(plan, b.dataset.quitarLibre, hoy)); redibujar(); aviso('Problema quitado'); },
  }));
}

export function formularioCambio() {
  return `
    <form id="form-cambio" class="tarjeta" novalidate>
      <div class="campos">
        <label class="campo"><span>Fecha</span><input name="fecha" type="date" max="${hoyISO()}" value="${hoyISO()}"></label>
        <label class="campo ancho"><span>Cambio o motivo</span><input name="texto" type="text" maxlength="240" placeholder="p. ej., se suspende el programa de ejercicio por dolor de rodilla"></label>
      </div>
      ${avisoDatos}
      <button class="btn btn-chico btn-primario" type="submit">${icono('check')} Registrar cambio</button>
    </form>`;
}
