// Valoración ICOPE: panel de capacidad intrínseca y los cuatro pasos del esquema de atención
// (evaluación básica, evaluación detallada, plan personalizado, ejecución y seguimiento).
import { almacen } from '../almacen.js';
import { porId } from '../datos.js';
import {
  DOMINIOS_ICOPE, FACTORES, ESTADOS_ICOPE, NECESIDADES_ICOPE, LICENCIA_ICOPE, ENLACE_ICOPE, RUTA_ICOPE,
  estadosIcope, estadoFactores, avanceBasica, textoIcope, ambitoIcope, nombreAmbitoIcope, icopeDe, dominioIcope,
} from '../icope.js';
import {
  planDe, ESTADOS_PROBLEMA, PRIORIDADES, ESTADOS_OBJETIVO, ESTADOS_INTERVENCION, CATEGORIAS_INTERVENCION, CAMPOS_OBJETIVO,
  CAMPOS_PREFERENCIAS, MAX_PREFERENCIA, nombreDe, fijarProblema, fijarPrioridad, fijarRevaloracion, agregarObjetivo, actualizarObjetivo,
  quitarObjetivo, agregarIntervencion, actualizarIntervencion, quitarIntervencion, fijarPreferencias, registrarCambio, lineaObjetivo,
  nuevoIdPlan,
} from '../plan.js';
import { valorGuardado } from '../nota.js';
import { fechaCorta, diasEntre } from '../comparacion.js';
import { $, $$, esc, icono, plural, aviso, copiar, hoyISO, confirmarEnDosToques } from '../ui.js';

export const PESTANAS_ICOPE = [
  ['panel', 'Panel'],
  ['basica', '1 · Básica'],
  ['detallada', '2 · Detallada'],
  ['plan', '3 · Plan'],
  ['seguimiento', '4 · Seguimiento'],
];
const urlEscala = (id) => `#/r/${RUTA_ICOPE}/${id}`;
const urlPestana = (p) => `#/icope/${p}`;
const fechaDMA = (f) => (f ? fechaCorta(f) : '');

function chipEstado(estado) {
  const e = ESTADOS_ICOPE[estado];
  return `<span class="chip-icope est-${estado}"><span class="punto" aria-hidden="true"></span>${esc(e.nombre)}</span>`;
}

const aviso18 = `<p class="aviso-datos">${icono('escudo')} Escribe sin nombres, expedientes ni otros datos que identifiquen a la persona o a su familia.</p>`;

function pieLicencia() {
  return `
    <p class="pie-icope">${icono('libro')}<span>${esc(LICENCIA_ICOPE.texto)} <a href="${ENLACE_ICOPE}" target="_blank" rel="noopener">Manual ICOPE (OPS, 2025)</a>.</span></p>`;
}

/* ---------- Panel ---------- */

function filaDato(titulo, contenido) {
  return contenido ? `<div><dt>${esc(titulo)}</dt><dd>${contenido}</dd></div>` : '';
}

function tarjetaPanel(x) {
  const accion = x.estado === 'pendiente'
    ? `<a class="btn btn-chico btn-primario" href="${urlEscala(x.dom.escala)}">${icono('iniciar')} Aplicar</a>`
    : `<a class="btn btn-chico" href="${urlEscala(x.dom.escala)}">${icono('reiniciar')} Repetir</a>`;
  const necesidad = x.necesidad.tipo === 'detallada'
    ? `${esc(x.necesidad.texto)} <a href="${urlPestana('detallada')}#d-${x.dom.id}">Ver opciones</a>`
    : esc(x.necesidad.texto);
  const objetivos = x.objetivos.length
    ? `${esc(x.objetivos[0].texto)}${x.objetivos.length > 1 ? ` <span class="discreto">y ${plural(x.objetivos.length - 1, 'objetivo más', 'objetivos más')}</span>` : ''}`
    : x.estado === 'alterado' ? `<span class="discreto">Sin objetivos.</span> <a href="${urlPestana('plan')}#p-${x.dom.id}">Agregar</a>` : '';
  return `
    <article class="icope-dom est-${x.estado}" id="panel-${x.dom.id}">
      <header class="icope-dom-cab">
        <span class="ico-dominio">${icono(x.dom.icono)}</span>
        <h3>${esc(x.dom.nombre)}</h3>
        ${chipEstado(x.estado)}
      </header>
      <dl class="icope-datos">
        ${filaDato('Instrumento', x.instrumento ? `${esc(x.instrumento)}${x.fecha ? ` · ${esc(fechaDMA(x.fecha))}` : ''}` : '')}
        ${filaDato('Hallazgo principal', esc(x.hallazgo))}
        ${filaDato('Evaluación adicional', necesidad)}
        ${filaDato('Valoración del médico', x.problema ? `${esc(nombreDe(ESTADOS_PROBLEMA, x.problema.estado))}${x.problema.nota ? ` · ${esc(x.problema.nota)}` : ''}` : '')}
        ${filaDato('Prioridad', x.prioridad ? esc(nombreDe(PRIORIDADES, x.prioridad)) : '')}
        ${filaDato('Objetivo del plan', objetivos)}
        ${filaDato('Evolución', x.evolucion.map(esc).join('<br>'))}
        ${filaDato('Revaloración', x.revaloracion ? `${esc(fechaDMA(x.revaloracion))}${x.revaloracionVencida ? ' <span class="vencida">vencida</span>' : ''}` : '')}
      </dl>
      <div class="icope-dom-acciones">${accion}</div>
    </article>`;
}

function tarjetaFactores(f) {
  const lista = f.necesidades.map((id) => `<li>${esc(NECESIDADES_ICOPE[id].texto)}</li>`).join('');
  const extra = [
    f.cuidadorPendiente ? '<li>Hay una persona a cargo del cuidado, pero no fue posible preguntarle en privado.</li>' : '',
    f.pa ? `<li>Presión arterial ${f.pa.pas}/${f.pa.pad} mmHg${f.pa.rango ? ': en rango de hipertensión en esta medición; confirmar en otra consulta' : ''}.</li>` : '',
    f.tabaco ? '<li>Consumo de tabaco en los últimos 12 meses.</li>' : '',
  ].join('');
  const rel = f.relacionados.filter((x) => x.r).map((x) => `<li>${esc(x.tema)}: ${esc(porId[x.id].corto)} ${esc(valorGuardado(x.r))} (${esc(fechaDMA(x.r.fecha))})</li>`).join('');
  return `
    <article class="icope-dom icope-factores est-${f.estado}">
      <header class="icope-dom-cab">
        <span class="ico-dominio">${icono('apoyo')}</span>
        <h3>Necesidades adicionales</h3>
        ${f.estado === 'pendiente' ? chipEstado('pendiente') : f.estado === 'no_evaluable' ? chipEstado('no_evaluable') : `<span class="chip-icope est-${f.necesidades.length ? 'alterado' : 'conservado'}"><span class="punto" aria-hidden="true"></span>${f.necesidades.length ? 'Por explorar' : 'Sin necesidades'}</span>`}
      </header>
      <p class="icope-nota">Apoyo social, persona a cargo del cuidado e incontinencia urinaria (cuadro 3.2), riesgo cardiovascular, caídas y riesgo social. No son dominios de la capacidad intrínseca.</p>
      ${lista || extra || rel ? `<ul class="icope-lista">${lista}${extra}${rel}</ul>` : ''}
      <div class="icope-dom-acciones"><a class="btn btn-chico${f.estado === 'pendiente' ? ' btn-primario' : ''}" href="${urlEscala(FACTORES.escala)}">${icono(f.estado === 'pendiente' ? 'iniciar' : 'reiniciar')} ${f.estado === 'pendiente' ? 'Preguntar' : 'Repetir'}</a></div>
    </article>`;
}

function panelPanel(v, hoy) {
  const estados = estadosIcope(v, hoy);
  const av = avanceBasica(estados);
  const f = estadoFactores(v);
  return `
    <section class="tarjeta icope-intro">
      <p>${av.evaluados ? `${av.evaluados} de ${av.total} dominios con evaluación básica.` : 'Aún no hay dominios evaluados.'} ${av.alterados.length ? `Con pérdida detectada: <strong>${esc(av.alterados.join(', '))}</strong>.` : ''}</p>
      <p class="discreto">ICOPE no tiene puntaje global: cada dominio se informa y se sigue por separado. Un dominio alterado indica la necesidad de una evaluación detallada, no un diagnóstico.</p>
      ${av.evaluados < av.total ? `<a class="btn btn-primario" href="${urlEscala((estados.find((x) => x.estado === 'pendiente') || estados[0]).dom.escala)}">${icono('iniciar')} ${av.evaluados ? 'Continuar la evaluación básica' : 'Iniciar la evaluación básica'}</a>` : ''}
    </section>
    <div class="icope-rejilla">${estados.map(tarjetaPanel).join('')}${tarjetaFactores(f)}</div>
    <h2 class="seccion">Resumen ICOPE para el expediente</h2>
    <pre class="nota" id="texto-icope">${esc(textoIcope(v, hoy))}</pre>
    <div class="acciones"><button class="btn btn-primario" type="button" id="copiar-icope">${icono('copiar')} Copiar resumen ICOPE</button></div>`;
}

/* ---------- Paso 1: evaluación básica ---------- */

function filaBasica(x) {
  const hecho = x.estado !== 'pendiente';
  return `
    <li class="icope-paso est-${x.estado}">
      <a href="${urlEscala(x.dom.escala)}">
        <span class="ico-dominio">${icono(x.dom.icono)}</span>
        <span class="icope-paso-texto">
          <span class="icope-paso-nombre">${esc(x.dom.nombre)}</span>
          <span class="icope-paso-desc">${hecho ? `${esc(fechaDMA(x.fecha))} · ${esc(x.hallazgo)}` : esc(porId[x.dom.escala].descripcion)}</span>
        </span>
        ${chipEstado(x.estado)}
        <span class="fila-aplicar" aria-hidden="true">${hecho ? 'Repetir' : 'Aplicar'}</span>
      </a>
    </li>`;
}

function filaRelacionado(id, nota, tema = '') {
  const e = porId[id];
  const rs = almacen.resultadosDe(id);
  const r = rs.length ? rs.sort((a, b) => ((b.fecha || '') > (a.fecha || '') ? 1 : -1))[0] : null;
  return `
    <li class="icope-rel${r ? ' hecho' : ''}">
      <a href="${urlEscala(id)}">
        ${icono(r ? 'completo' : 'pendiente')}
        <span class="icope-paso-texto">
          <span class="icope-paso-nombre">${tema ? `${esc(tema)}: ` : ''}${esc(e.corto)}</span>
          <span class="icope-paso-desc">${r ? `${esc(valorGuardado(r))} · ${esc(fechaDMA(r.fecha))}` : esc(nota)}</span>
        </span>
        <span class="fila-aplicar" aria-hidden="true">${r ? 'Repetir' : 'Aplicar'}</span>
      </a>
    </li>`;
}

function panelBasica(v, hoy) {
  const estados = estadosIcope(v, hoy);
  const f = estadoFactores(v);
  const sig = estados.find((x) => x.estado === 'pendiente');
  return `
    <section class="tarjeta">
      <h2 class="titulo-tarjeta">Paso 1 · Evaluación básica</h2>
      <p>Evalúa los seis dominios en la misma consulta (8 a 12 minutos). En cognición, visión y audición, una respuesta afirmativa a la pregunta de filtro lleva directamente a la evaluación detallada, sin aplicar la prueba.</p>
      <p class="discreto">Repetir al menos una vez al año (visión y audición cada 1 a 2 años), después de un evento agudo o si cambia la situación de la persona.</p>
      ${sig ? `<a class="btn btn-primario" href="${urlEscala(sig.dom.escala)}">${icono('iniciar')} ${estados.some((x) => x.estado !== 'pendiente') ? `Continuar con ${esc(sig.dom.nombre.toLowerCase())}` : 'Iniciar la evaluación básica'}</a>` : ''}
    </section>
    <h2 class="seccion">Dominios de la capacidad intrínseca</h2>
    <ol class="icope-pasos">${estados.map(filaBasica).join('')}</ol>
    <h2 class="seccion">Necesidades adicionales</h2>
    <p class="discreto">Se preguntan a todas las personas mayores, independientemente de su capacidad intrínseca. No son dominios ICOPE.</p>
    <ol class="icope-pasos">
      <li class="icope-paso est-${f.estado === 'pendiente' ? 'pendiente' : f.estado === 'no_evaluable' ? 'no_evaluable' : f.necesidades.length || f.pa?.rango || f.tabaco ? 'alterado' : 'conservado'}">
        <a href="${urlEscala(FACTORES.escala)}">
          <span class="ico-dominio">${icono('apoyo')}</span>
          <span class="icope-paso-texto">
            <span class="icope-paso-nombre">Factores clave y riesgo cardiovascular</span>
            <span class="icope-paso-desc">${f.r ? `${esc(fechaDMA(f.r.fecha))} · ${esc(valorGuardado(f.r))}` : 'Apoyo social, persona a cargo del cuidado, incontinencia urinaria, presión arterial y tabaco.'}</span>
          </span>
          <span class="fila-aplicar" aria-hidden="true">${f.r ? 'Repetir' : 'Preguntar'}</span>
        </a>
      </li>
    </ol>
    <ul class="icope-rels">${FACTORES.relacionados.filter((x) => porId[x.id]).map((x) => filaRelacionado(x.id, x.nota, x.tema)).join('')}</ul>
    <p class="discreto">Preferencias y objetivos de la persona: en el <a href="${urlPestana('plan')}">paso 3</a>.</p>`;
}

/* ---------- Paso 2: evaluación detallada ---------- */

function tarjetaDetallada(x) {
  const det = x.dom.detallada;
  const fila = (id, nota = '') => filaRelacionado(id, nota || porId[id].descripcion);
  const grupos = [
    det.antes?.length ? `<p class="icope-sub">Antes de interpretar</p><ul class="icope-rels">${det.antes.map((a) => fila(a.id, a.nota)).join('')}</ul>` : '',
    det.elegir.length ? `<p class="icope-sub">${det.elegir.length > 1 ? 'Elige un instrumento' : 'Instrumento sugerido'}</p><ul class="icope-rels">${det.elegir.map((id) => fila(id)).join('')}</ul>` : '',
    det.alternativas?.length ? `<p class="icope-sub">Alternativas</p><ul class="icope-rels">${det.alternativas.map((id) => fila(id)).join('')}</ul>` : '',
    det.complementarios?.length ? `<p class="icope-sub">Complementarios</p><ul class="icope-rels">${det.complementarios.map((c) => fila(c.id, c.nota)).join('')}</ul>` : '',
    det.planeadas?.length ? `<p class="icope-sub">Próximamente en Huella</p><ul class="chips">${det.planeadas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '',
  ].join('');
  const externas = x.externas.map((e) => `
    <li class="icope-externa">
      <span><strong>${esc(e.prueba)}</strong> · ${esc(fechaDMA(e.fecha))}${e.hallazgo ? ` · ${esc(e.hallazgo)}` : ''}</span>
      <button class="btn-icono" type="button" data-quitar-externa="${esc(x.dom.id)}:${esc(e.id)}" aria-label="Quitar registro ${esc(e.prueba)}">${icono('cerrar')}</button>
    </li>`).join('');
  const abierta = ['alterado', 'no_evaluable'].includes(x.estado) || x.externas.length || x.problema || x.hechas.length;
  return `
    <details class="tarjeta icope-det est-${x.estado}" id="d-${x.dom.id}"${abierta ? ' open' : ''}>
      <summary><span class="ico-dominio">${icono(x.dom.icono)}</span><span class="icope-det-nombre">${esc(x.dom.nombre)}</span>${chipEstado(x.estado)}</summary>
      ${x.estado === 'conservado' ? '<p class="discreto">La evaluación básica no indica evaluación detallada; puedes hacerla si hay sospecha clínica.</p>' : ''}
      ${x.estado === 'pendiente' ? `<p class="discreto">Sin evaluación básica. <a href="${urlEscala(x.dom.escala)}">Aplicarla</a>.</p>` : ''}
      <p>${esc(det.texto)}</p>
      ${grupos}
      <p class="icope-sub">${det.externo ? esc(det.externo) : 'Evaluación realizada fuera de Huella'}</p>
      ${externas ? `<ul class="icope-externas">${externas}</ul>` : ''}
      <details class="icope-form-externa">
        <summary>${icono('mas')} Registrar resultado</summary>
        <form data-form-externa="${esc(x.dom.id)}" novalidate>
          <div class="campos">
            <label class="campo"><span>Fecha</span><input name="fecha" type="date" max="${hoyISO()}" value="${hoyISO()}" required></label>
            <label class="campo ancho"><span>Prueba o servicio</span><input name="prueba" type="text" maxlength="80" placeholder="${esc(det.externo ? `p. ej., ${det.externo.toLowerCase()}` : 'p. ej., evaluación por geriatría')}" required></label>
            <label class="campo ancho"><span>Hallazgo principal</span><input name="hallazgo" type="text" maxlength="160"></label>
          </div>
          ${aviso18}
          <button class="btn btn-chico btn-primario" type="submit">${icono('check')} Guardar registro</button>
        </form>
      </details>
      <div class="icope-conclusion">
        <label class="campo"><span>Valoración del médico</span>
          <select data-problema="${esc(x.dom.id)}">
            <option value="">— Sin asignar${x.estado === 'alterado' ? ' (hallazgo de tamizaje)' : ''} —</option>
            ${ESTADOS_PROBLEMA.map((s) => `<option value="${s.id}"${x.problema?.estado === s.id ? ' selected' : ''}>${esc(s.nombre)}</option>`).join('')}
          </select>
        </label>
        <label class="campo ancho"><span>Nota (opcional)</span><input type="text" maxlength="200" data-nota-problema="${esc(x.dom.id)}" value="${esc(x.problema?.nota || '')}"${x.problema ? '' : ' disabled'}></label>
      </div>
      <p class="discreto">La valoración la decide el médico; Huella no la asigna a partir del tamizaje.</p>
    </details>`;
}

function panelDetallada(v, hoy) {
  const estados = estadosIcope(v, hoy);
  const orden = [...estados].sort((a, b) => rangoEstado(a) - rangoEstado(b));
  return `
    <section class="tarjeta">
      <h2 class="titulo-tarjeta">Paso 2 · Evaluación detallada</h2>
      <p>Para cada dominio alterado, Huella muestra los instrumentos disponibles y reutiliza los resultados ya registrados en esta valoración: no hace falta repetirlos. Elige un instrumento por dominio; no se aplican varios de forma automática.</p>
    </section>
    ${orden.map(tarjetaDetallada).join('')}`;
}
const rangoEstado = (x) => ({ alterado: 0, no_evaluable: 1, pendiente: 2, conservado: 3 })[x.estado];

/* ---------- Paso 3: plan ---------- */

function formularioPreferencias(plan) {
  const vacio = !Object.keys(plan.preferencias).length;
  return `
    <details class="tarjeta icope-pref"${vacio ? ' open' : ''}>
      <summary><span class="ico-dominio">${icono('apoyo')}</span><span class="icope-det-nombre">Lo que más importa a la persona</span>${vacio ? '' : '<span class="vin-usado">Registrado</span>'}</summary>
      <p class="discreto">El plan parte de los objetivos y las preferencias de la persona mayor (manual ICOPE, 3.3.1). No es un documento de voluntad anticipada.</p>
      <form id="form-pref" novalidate>
        ${CAMPOS_PREFERENCIAS.map((c) => `
          <label class="campo ancho"><span>${esc(c.etiqueta)}</span>${c.ayuda ? `<small class="campo-ayuda">${esc(c.ayuda)}</small>` : ''}
            <textarea name="${c.id}" rows="2" maxlength="${MAX_PREFERENCIA}">${esc(plan.preferencias[c.id] || '')}</textarea>
          </label>`).join('')}
        ${aviso18}
        <button class="btn btn-chico btn-primario" type="submit">${icono('check')} Guardar preferencias</button>
      </form>
    </details>`;
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
        ${aviso18}
        <button class="btn btn-chico btn-primario" type="submit">${icono('check')} Agregar objetivo</button>
      </form>
    </details>`;
}

function tarjetaPlan(ambito, nombre, estadoChip, sugeridas, plan) {
  const prio = plan.prioridades[ambito] || '';
  const objs = plan.objetivos.filter((o) => o.ambito === ambito);
  const ints = plan.intervenciones.filter((i) => i.ambito === ambito);
  const enPlan = new Set(ints.map((i) => i.texto));
  const id = ambito.replace('icope:', '');
  return `
    <section class="tarjeta icope-plan" id="p-${esc(id)}">
      <header class="icope-dom-cab"><h3>${esc(nombre)}</h3>${estadoChip}</header>
      <fieldset class="icope-prioridad">
        <legend>Prioridad (la decide el médico)</legend>
        <div class="segmentado">
          ${[...PRIORIDADES, { id: '', nombre: 'Sin definir' }].map((p) => `<label><input type="radio" name="prio-${esc(id)}" value="${p.id}" data-prioridad="${esc(ambito)}"${prio === p.id ? ' checked' : ''}>${esc(p.nombre)}</label>`).join('')}
        </div>
      </fieldset>
      <p class="icope-sub">${icono('objetivo')} Objetivos</p>
      ${objs.length ? `<ul class="icope-objetivos">${objs.map((o) => `
        <li><span>${esc(lineaObjetivo(o))}</span><button class="btn-icono" type="button" data-quitar-objetivo="${esc(o.id)}" aria-label="Quitar objetivo">${icono('cerrar')}</button></li>`).join('')}</ul>` : '<p class="discreto">Sin objetivos.</p>'}
      ${formularioObjetivo(ambito)}
      <p class="icope-sub">${icono('bombilla')} Intervenciones orientativas del manual ICOPE</p>
      <p class="discreto">Sugerencias para comentar con la persona; ninguna se agrega sola. Agrega solo las acordadas.</p>
      <ul class="icope-sugeridas">${sugeridas.map((s) => `
        <li>
          <span><span class="cat-int">${esc(nombreDe(CATEGORIAS_INTERVENCION, s.categoria))}</span> ${esc(s.texto)}</span>
          ${enPlan.has(s.texto) ? '<span class="vin-usado">En el plan</span>' : `<button class="btn btn-chico" type="button" data-agregar-int="${esc(ambito)}" data-categoria="${s.categoria}" data-texto="${esc(s.texto)}">Agregar</button>`}
        </li>`).join('')}</ul>
      <details class="icope-form-int">
        <summary>${icono('mas')} Otra intervención</summary>
        <form data-form-int="${esc(ambito)}" novalidate>
          <div class="campos">
            <label class="campo"><span>Categoría</span><select name="categoria">${CATEGORIAS_INTERVENCION.map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}</select></label>
            <label class="campo ancho"><span>Intervención</span><input name="texto" type="text" maxlength="200"></label>
          </div>
          ${aviso18}
          <button class="btn btn-chico btn-primario" type="submit">${icono('check')} Agregar intervención</button>
        </form>
      </details>
      ${ints.length ? `<p class="icope-sub">Intervenciones en el plan</p><ul class="icope-objetivos">${ints.map((i) => `
        <li><span><span class="cat-int">${esc(nombreDe(CATEGORIAS_INTERVENCION, i.categoria))}</span> ${esc(i.texto)} · <em>${esc(nombreDe(ESTADOS_INTERVENCION, i.estado).toLowerCase())}</em></span><button class="btn-icono" type="button" data-quitar-int="${esc(i.id)}" aria-label="Quitar intervención">${icono('cerrar')}</button></li>`).join('')}</ul>` : ''}
      <label class="campo icope-reval"><span>Fecha de revaloración</span><input type="date" min="${hoyISO()}" data-revaloracion="${esc(ambito)}" value="${esc(plan.revaloraciones[ambito] || '')}"></label>
    </section>`;
}

const necesitaPlan = (x, plan) => ['alterado', 'no_evaluable'].includes(x.estado) || ['sospecha', 'confirmado'].includes(x.problema?.estado)
  || plan.objetivos.some((o) => o.ambito === x.ambito) || plan.intervenciones.some((i) => i.ambito === x.ambito) || plan.prioridades[x.ambito];

function panelPlan(v, hoy) {
  const plan = planDe(v);
  const estados = estadosIcope(v, hoy);
  const f = estadoFactores(v);
  const amb = ambitoIcope('factores');
  const conPlan = estados.filter((x) => necesitaPlan(x, plan));
  const otros = estados.filter((x) => !conPlan.includes(x));
  const factoresEnPlan = f.necesidades.length || f.pa?.rango || f.tabaco || plan.objetivos.some((o) => o.ambito === amb) || plan.intervenciones.some((i) => i.ambito === amb);
  const tarjeta = (x) => tarjetaPlan(x.ambito, x.dom.nombre, chipEstado(x.estado), x.dom.intervenciones, plan);
  const tarjetaFac = () => tarjetaPlan(amb, FACTORES.nombre, '', FACTORES.intervenciones, plan);
  return `
    <section class="tarjeta">
      <h2 class="titulo-tarjeta">Paso 3 · Plan de atención personalizado</h2>
      <p>Prioriza según la urgencia clínica, la probabilidad de éxito, la repercusión en otros dominios, la carga de las intervenciones y lo que la persona considere más importante. Las intervenciones se acuerdan con la persona y, si corresponde, con quien la cuida.</p>
    </section>
    ${formularioPreferencias(plan)}
    ${conPlan.length ? conPlan.map(tarjeta).join('') : '<p class="vacio-texto">Ningún dominio alterado todavía. Completa la evaluación básica o agrega un objetivo a cualquier dominio.</p>'}
    ${factoresEnPlan ? tarjetaFac() : ''}
    ${otros.length || !factoresEnPlan ? `
      <details class="tarjeta icope-otros">
        <summary>Agregar al plan otros dominios</summary>
        ${otros.map(tarjeta).join('')}
        ${factoresEnPlan ? '' : tarjetaFac()}
      </details>` : ''}`;
}

/* ---------- Paso 4: ejecución y seguimiento ---------- */

function panelSeguimiento(v, hoy) {
  const plan = planDe(v);
  const estados = estadosIcope(v, hoy);
  const amb = (a) => esc(nombreAmbitoIcope(a));
  const filasReval = estados.map((x) => {
    const fecha = x.revaloracion;
    const dias = fecha ? diasEntre(hoy, fecha) : null;
    const estado = fecha ? (dias < 0 ? `<span class="vencida">vencida hace ${plural(-dias, 'día', 'días')}</span>` : dias === 0 ? 'hoy' : `en ${plural(dias, 'día', 'días')}`) : '<span class="discreto">sin fecha</span>';
    const sugerida = !fecha && x.necesidad.proxima ? ` · evaluación básica a partir del ${esc(fechaDMA(x.necesidad.proxima))}` : '';
    return `<tr><th scope="row">${esc(x.dom.nombre)}</th><td>${fecha ? esc(fechaDMA(fecha)) : '—'}</td><td>${estado}${sugerida}</td><td><a href="${urlEscala(x.dom.escala)}">Repetir</a></td></tr>`;
  }).join('');
  const objetivos = plan.objetivos.map((o) => `
    <li class="icope-seg">
      <span class="icope-seg-texto"><span class="cat-int">${amb(o.ambito)}</span> ${esc(o.texto)}${o.meta ? ` <span class="discreto">· meta: ${esc(o.meta)}</span>` : ''}${o.plazo ? ` <span class="discreto">· plazo: ${esc(fechaDMA(o.plazo))}</span>` : ''}</span>
      <label class="campo-mini"><span class="sr">Estado del objetivo</span><select data-estado-objetivo="${esc(o.id)}">${ESTADOS_OBJETIVO.map((s) => `<option value="${s.id}"${o.estado === s.id ? ' selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select></label>
    </li>`).join('');
  const intervenciones = plan.intervenciones.map((i) => `
    <li class="icope-seg">
      <span class="icope-seg-texto"><span class="cat-int">${amb(i.ambito)} · ${esc(nombreDe(CATEGORIAS_INTERVENCION, i.categoria))}</span> ${esc(i.texto)}${i.fechaEstado && i.estado !== 'planeada' ? ` <span class="discreto">· ${esc(fechaDMA(i.fechaEstado))}</span>` : ''}</span>
      <label class="campo-mini"><span class="sr">Estado de la intervención</span><select data-estado-int="${esc(i.id)}">${ESTADOS_INTERVENCION.map((s) => `<option value="${s.id}"${i.estado === s.id ? ' selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select></label>
    </li>`).join('');
  const evolucion = estados.filter((x) => x.evolucion.length).map((x) => `<li><strong>${esc(x.dom.nombre)}.</strong> ${x.evolucion.map(esc).join(' ')}</li>`).join('');
  const bitacora = [...plan.bitacora].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 40).map((b) => `<li><span class="bit-fecha">${esc(fechaDMA(b.fecha))}</span> ${esc(b.texto)}${b.auto ? '' : ' <span class="vin-usado">nota</span>'}</li>`).join('');
  return `
    <section class="tarjeta">
      <h2 class="titulo-tarjeta">Paso 4 · Ejecución y seguimiento</h2>
      <p>Revisa que cada intervención se ejecute, busca efectos no deseados, repite la evaluación básica o detallada y adapta el plan. La frecuencia del seguimiento se acuerda con la persona.</p>
    </section>
    <h2 class="seccion">${icono('calendario')} Revaloraciones</h2>
    <div class="tabla-envoltura"><table class="tabla">
      <thead><tr><th>Dominio</th><th>Fecha</th><th>Estado</th><th><span class="sr">Acción</span></th></tr></thead>
      <tbody>${filasReval}</tbody>
    </table></div>
    <p class="discreto">Las fechas de revaloración se fijan en el <a href="${urlPestana('plan')}">paso 3</a>.</p>
    <h2 class="seccion">${icono('objetivo')} Objetivos</h2>
    ${objetivos ? `<ul class="icope-segs">${objetivos}</ul>` : '<p class="vacio-texto">Sin objetivos en el plan.</p>'}
    <h2 class="seccion">${icono('lista')} Intervenciones</h2>
    ${intervenciones ? `<ul class="icope-segs">${intervenciones}</ul><p class="discreto">Huella no marca ninguna intervención como realizada: actualiza el estado cuando corresponda.</p>` : '<p class="vacio-texto">Sin intervenciones en el plan.</p>'}
    <h2 class="seccion">${icono('historial')} Evolución</h2>
    ${evolucion ? `<ul class="icope-lista">${evolucion}</ul><p class="discreto">Un cambio numérico no equivale a un cambio clínicamente significativo; su relevancia requiere valoración.</p>` : '<p class="vacio-texto">Para comparar se necesitan al menos dos aplicaciones del mismo instrumento.</p>'}
    <h2 class="seccion">${icono('plan')} Cambios del plan</h2>
    <form id="form-cambio" class="tarjeta" novalidate>
      <div class="campos">
        <label class="campo"><span>Fecha</span><input name="fecha" type="date" max="${hoyISO()}" value="${hoyISO()}"></label>
        <label class="campo ancho"><span>Cambio o motivo</span><input name="texto" type="text" maxlength="240" placeholder="p. ej., se suspende el programa de ejercicio por dolor de rodilla"></label>
      </div>
      ${aviso18}
      <button class="btn btn-chico btn-primario" type="submit">${icono('check')} Registrar cambio</button>
    </form>
    ${bitacora ? `<ul class="icope-bitacora">${bitacora}</ul>` : '<p class="vacio-texto">Sin cambios registrados.</p>'}`;
}

/* ---------- Pantalla ---------- */

function contador(id, v, hoy) {
  if (id === 'basica') {
    const av = avanceBasica(estadosIcope(v, hoy));
    return `${av.evaluados}/${av.total}`;
  }
  if (id === 'plan') {
    const n = planDe(v).objetivos.length;
    return n ? String(n) : '';
  }
  return '';
}

function htmlPanel(pestana, v, hoy) {
  return { panel: panelPanel, basica: panelBasica, detallada: panelDetallada, plan: panelPlan, seguimiento: panelSeguimiento }[pestana](v, hoy);
}

export function renderIcope({ pestana }) {
  const v = almacen.valoracion();
  const hoy = hoyISO();
  return `
    <section class="vista icope">
      <a class="migas" href="#/">${icono('atras')} Inicio</a>
      <header class="cabecera cabecera-dominio">
        <span class="ico-dominio grande">${icono('icope')}</span>
        <div>
          <p class="ceja">OMS · OPS · Atención integrada para las personas mayores</p>
          <h1>Valoración ICOPE</h1>
          <p class="entradilla">Capacidad intrínseca en seis dominios, sin puntaje global: evaluación básica, evaluación detallada, plan personalizado y seguimiento.</p>
        </div>
      </header>
      <nav class="pestanas-med pestanas-icope" aria-label="Pasos ICOPE">
        ${PESTANAS_ICOPE.map(([id, nombre]) => {
          const n = contador(id, v, hoy);
          return `<a href="${urlPestana(id)}"${id === pestana ? ' aria-current="page" class="activo"' : ''}>${esc(nombre)}${n ? ` <span class="pest-cuenta">${esc(n)}</span>` : ''}</a>`;
        }).join('')}
      </nav>
      <div id="panel-icope" data-pestana="${pestana}">${htmlPanel(pestana, v, hoy)}</div>
      ${pieLicencia()}
    </section>`;
}

// Guarda un cambio del plan o de ICOPE y vuelve a dibujar el panel sin mover la página.
function guardar(mutar) {
  const v = almacen.valoracion();
  const plan = planDe(v);
  const icope = icopeDe(v);
  mutar({ plan, icope, v });
  v.plan = plan;
  v.icope = icope;
  almacen.guardarValoracion(v);
}

export function montarIcope({ pestana }, rerender, alCambiar) {
  const panel = $('#panel-icope');
  const hoy = hoyISO();
  const redibujar = (enfocar = null) => {
    const v = almacen.valoracion();
    panel.innerHTML = htmlPanel(pestana, v, hoy);
    $$('.pestanas-icope a').forEach((a) => {
      const id = a.getAttribute('href').split('/').pop();
      const n = contador(id, v, hoy);
      let span = a.querySelector('.pest-cuenta');
      if (!n && span) span.remove();
      if (n) {
        if (!span) { span = document.createElement('span'); span.className = 'pest-cuenta'; a.append(' ', span); }
        span.textContent = n;
      }
    });
    conectar();
    alCambiar();
    if (enfocar) panel.querySelector(enfocar)?.focus({ preventScroll: true });
  };

  // Ancla en la URL de la pestaña (p. ej., #/icope/detallada#d-vision): abrir y desplazar.
  const ancla = location.hash.split('#')[2];
  if (ancla) {
    const el = document.getElementById(ancla);
    if (el) {
      if (el.tagName === 'DETAILS') el.open = true;
      requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
    }
  }

  function conectar() {
    $('#copiar-icope')?.addEventListener('click', () => copiar($('#texto-icope').textContent, 'Resumen ICOPE copiado'));
    $$('[data-quitar-objetivo]', panel).forEach((b) => confirmarEnDosToques(b, {
      texto: icono('alerta'),
      accion: () => { guardar(({ plan }) => quitarObjetivo(plan, b.dataset.quitarObjetivo, hoy)); redibujar(); aviso('Objetivo quitado del plan'); },
    }));
    $$('[data-quitar-int]', panel).forEach((b) => confirmarEnDosToques(b, {
      texto: icono('alerta'),
      accion: () => { guardar(({ plan }) => quitarIntervencion(plan, b.dataset.quitarInt, hoy)); redibujar(); aviso('Intervención quitada del plan'); },
    }));
    $$('[data-quitar-externa]', panel).forEach((b) => confirmarEnDosToques(b, {
      texto: icono('alerta'),
      accion: () => {
        const [dom, id] = b.dataset.quitarExterna.split(':');
        guardar(({ icope }) => { icope.detalle = { ...icope.detalle, [dom]: (icope.detalle[dom] || []).filter((x) => x.id !== id) }; });
        redibujar();
        aviso('Registro quitado');
      },
    }));
  }

  panel.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-agregar-int]');
    if (!b) return;
    const ambito = b.dataset.agregarInt;
    guardar(({ plan }) => agregarIntervencion(plan, ambito, { categoria: b.dataset.categoria, texto: b.dataset.texto, origen: 'sugerida' }, hoy, nombreAmbitoIcope(ambito)));
    redibujar();
    aviso('Intervención agregada al plan');
  });

  panel.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.matches('[data-problema]')) {
      const dom = t.dataset.problema;
      const nota = panel.querySelector(`[data-nota-problema="${dom}"]`)?.value || '';
      guardar(({ plan }) => fijarProblema(plan, ambitoIcope(dom), { estado: t.value, nota }, hoy, dominioIcope(dom).nombre));
      redibujar(`[data-problema="${dom}"]`);
      aviso(t.value ? 'Valoración del médico registrada' : 'Valoración del médico retirada');
    } else if (t.matches('[data-nota-problema]')) {
      const dom = t.dataset.notaProblema;
      const estado = panel.querySelector(`[data-problema="${dom}"]`)?.value;
      if (estado) guardar(({ plan }) => fijarProblema(plan, ambitoIcope(dom), { estado, nota: t.value }, hoy, dominioIcope(dom).nombre));
    } else if (t.matches('[data-prioridad]')) {
      const ambito = t.dataset.prioridad;
      guardar(({ plan }) => fijarPrioridad(plan, ambito, t.value, hoy, nombreAmbitoIcope(ambito)));
      aviso(t.value ? `Prioridad ${nombreDe(PRIORIDADES, t.value).toLowerCase()}` : 'Prioridad sin definir');
      alCambiar();
    } else if (t.matches('[data-revaloracion]')) {
      const ambito = t.dataset.revaloracion;
      guardar(({ plan }) => fijarRevaloracion(plan, ambito, t.value, hoy, nombreAmbitoIcope(ambito)));
      aviso(t.value ? 'Fecha de revaloración guardada' : 'Fecha de revaloración quitada');
      alCambiar();
    } else if (t.matches('[data-estado-objetivo]')) {
      guardar(({ plan }) => actualizarObjetivo(plan, t.dataset.estadoObjetivo, { estado: t.value }, hoy));
      redibujar(`[data-estado-objetivo="${t.dataset.estadoObjetivo}"]`);
      aviso('Estado del objetivo actualizado');
    } else if (t.matches('[data-estado-int]')) {
      guardar(({ plan }) => actualizarIntervencion(plan, t.dataset.estadoInt, { estado: t.value }, hoy));
      redibujar(`[data-estado-int="${t.dataset.estadoInt}"]`);
      aviso('Estado de la intervención actualizado');
    }
  });

  panel.addEventListener('submit', (ev) => {
    const form = ev.target;
    ev.preventDefault();
    const datos = Object.fromEntries(new FormData(form).entries());
    if (form.id === 'form-pref') {
      guardar(({ plan }) => fijarPreferencias(plan, datos));
      redibujar();
      aviso('Preferencias guardadas');
    } else if (form.dataset.formObjetivo) {
      const ambito = form.dataset.formObjetivo;
      let ok = null;
      guardar(({ plan }) => { ok = agregarObjetivo(plan, ambito, datos, hoy, nombreAmbitoIcope(ambito)); });
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
      const ambito = form.dataset.formInt;
      if (!String(datos.texto || '').trim()) { form.querySelector('[name="texto"]').focus(); aviso('Escribe la intervención'); return; }
      guardar(({ plan }) => agregarIntervencion(plan, ambito, { categoria: datos.categoria, texto: datos.texto }, hoy, nombreAmbitoIcope(ambito)));
      redibujar();
      aviso('Intervención agregada al plan');
    } else if (form.dataset.formExterna) {
      const dom = form.dataset.formExterna;
      const prueba = String(datos.prueba || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      const fecha = /^\d{4}-\d{2}-\d{2}$/.test(datos.fecha || '') && datos.fecha <= hoy ? datos.fecha : '';
      if (!prueba || !fecha) { aviso(!prueba ? 'Escribe la prueba o el servicio' : 'Revisa la fecha'); return; }
      const hallazgo = String(datos.hallazgo || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      guardar(({ icope, plan }) => {
        icope.detalle = { ...icope.detalle, [dom]: [...(icope.detalle[dom] || []), { id: nuevoIdPlan('x'), fecha, prueba, hallazgo }] };
        registrarCambio(plan, `${dominioIcope(dom).nombre}: evaluación detallada registrada (${prueba}).`, hoy);
      });
      redibujar();
      aviso('Evaluación detallada registrada');
    } else if (form.id === 'form-cambio') {
      let ok = false;
      guardar(({ plan }) => { ok = registrarCambio(plan, datos.texto, datos.fecha || hoy); });
      if (!ok) { form.querySelector('[name="texto"]').focus(); aviso('Describe el cambio'); return; }
      redibujar();
      aviso('Cambio registrado');
    }
  });

  conectar();
}

/* ---------- Tarjeta destacada del inicio ---------- */

export function tarjetaInicioIcope() {
  const v = almacen.valoracion();
  const hoy = hoyISO();
  const estados = estadosIcope(v, hoy);
  const av = avanceBasica(estados);
  const sig = estados.find((x) => x.estado === 'pendiente');
  return `
    <section class="icope-inicio" aria-labelledby="icope-inicio-t">
      <div class="icope-inicio-cab">
        <span class="ico-dominio">${icono('icope')}</span>
        <div>
          <h2 id="icope-inicio-t">Valoración ICOPE · Capacidad intrínseca</h2>
          <p>Seis dominios de la OMS evaluados por separado, sin puntaje global, con plan personalizado y seguimiento.</p>
        </div>
      </div>
      <ul class="icope-mini">${estados.map((x) => `<li class="est-${x.estado}"><span class="punto" aria-hidden="true"></span><span>${esc(x.dom.corto)}</span><span class="sr">: ${esc(ESTADOS_ICOPE[x.estado].nombre)}</span></li>`).join('')}</ul>
      <div class="icope-inicio-acciones">
        ${sig ? `<a class="btn btn-primario" href="${urlEscala(sig.dom.escala)}">${icono('iniciar')} ${av.evaluados ? 'Continuar' : 'Iniciar'}</a>` : ''}
        <a class="btn" href="#/icope/panel">${icono('dominios')} Ver panel${av.evaluados ? ` <span class="discreto">(${av.evaluados}/${av.total})</span>` : ''}</a>
      </div>
    </section>`;
}
