// Plan de atención geriátrica: lista de problemas (de todos los dominios, ICOPE y los que agrega el médico),
// valoración del médico, prioridades, objetivos, intervenciones, revaloraciones y lo que importa a la persona.
import { almacen } from '../almacen.js';
import { porId } from '../datos.js';
import { planDe, nombreDe, PRIORIDADES } from '../plan.js';
import { problemasPlan, sugerenciasDe } from '../atencion.js';
import { esc, icono, plural, hoyISO, $ } from '../ui.js';
import {
  formularioPreferencias, formularioProblema, tarjetaProblema, chipEstadoProblema, slugAmbito, conectarPlan, conectarQuitar,
} from './plan-ui.js';

const urlResultado = (h) => `#/e/${h.escalaId}/resultado`;

function filaResumen(p) {
  const det = [
    p.objetivos.length ? plural(p.objetivos.length, 'objetivo', 'objetivos') : '',
    p.intervenciones.length ? plural(p.intervenciones.length, 'intervención', 'intervenciones') : '',
    p.revaloracion ? `revaloración ${p.revaloracion.split('-').reverse().join('/')}` : '',
  ].filter(Boolean).join(' · ');
  return `
    <li class="fila-problema">
      <a href="#/plan#c-${slugAmbito(p.ambito)}" data-ir="c-${slugAmbito(p.ambito)}">
        <span class="fp-nombre">${esc(p.nombre)}</span>
        <span class="fp-meta">${chipEstadoProblema(p)}${p.prioridad ? `<span class="chip-prioridad prio-${p.prioridad}">${esc(nombreDe(PRIORIDADES, p.prioridad))}</span>` : ''}</span>
        ${det ? `<span class="fp-det">${esc(det)}</span>` : ''}
      </a>
    </li>`;
}

function htmlPlan(abiertas = null) {
  const v = almacen.valoracion();
  const hoy = hoyISO();
  const plan = planDe(v);
  const probs = problemasPlan(v, porId, hoy);
  const tarjetas = probs.map((p) => {
    const enlaces = [
      p.tipo === 'icope' ? `<a class="btn btn-chico" href="#/icope/plan">${icono('icope')} Ver en ICOPE</a>` : '',
      p.tipo === 'dominio' ? `<a class="btn btn-chico" href="#/d/${p.dominio}">${icono(p.dominio)} Instrumentos del dominio</a>` : '',
      p.tipo === 'libre' ? `<button class="btn btn-chico" type="button" data-quitar-libre="${esc(p.ambito)}">${icono('borrar')} Quitar problema</button>` : '',
    ].join('');
    return tarjetaProblema(p, plan, {
      sugeridas: sugerenciasDe(p.ambito),
      fuenteSugeridas: p.tipo === 'icope' ? 'Intervenciones orientativas del manual ICOPE' : 'Intervenciones orientativas',
      enlaces,
      urlResultado,
      abierta: abiertas ? abiertas.has(`c-${slugAmbito(p.ambito)}`) : probs.length <= 2,
    });
  }).join('');
  const sinEstado = probs.filter((p) => !p.asignado && p.derivado).length;
  return `
    <section class="tarjeta" id="problemas">
      <h2 class="titulo-tarjeta">${icono('lista')} Lista de problemas</h2>
      ${probs.length ? `
        <ul class="lista-problemas">${probs.map(filaResumen).join('')}</ul>
        ${sinEstado ? `<p class="discreto">${plural(sinEstado, 'hallazgo de tamizaje espera', 'hallazgos de tamizaje esperan')} la valoración del médico.</p>` : ''}`
        : '<p class="vacio-texto">Sin problemas todavía. Aparecen aquí los hallazgos de tamizaje de los instrumentos aplicados, los dominios ICOPE alterados y los problemas que agregues.</p>'}
      <p class="discreto">Orden: primero por la prioridad que asignes y después por dominio. Huella no asigna prioridades ni convierte un tamizaje en diagnóstico.</p>
    </section>
    ${formularioProblema()}
    ${formularioPreferencias(plan)}
    ${tarjetas ? `<h2 class="seccion">${icono('plan')} Plan por problema</h2>${tarjetas}` : ''}
    <div class="acciones dos">
      <a class="btn" href="#/seguimiento">${icono('historial')} Seguimiento</a>
      <a class="btn btn-primario" href="#/informe/plan">${icono('documento')} Informe del plan</a>
    </div>`;
}

export function renderPlanAtencion() {
  const v = almacen.valoracion();
  const n = problemasPlan(v, porId, hoyISO()).length;
  return `
    <section class="vista atencion">
      <a class="migas" href="#/">${icono('atras')} Inicio</a>
      <header class="cabecera cabecera-dominio">
        <span class="ico-dominio grande">${icono('plan')}</span>
        <div>
          <p class="ceja">Atención</p>
          <h1>Plan de atención geriátrica</h1>
          <p class="entradilla">Problemas, prioridades, objetivos e intervenciones del episodio${n ? ` (${plural(n, 'problema', 'problemas')})` : ''}. Huella solo deriva hallazgos de tamizaje; el estado clínico y el plan los decide el médico.</p>
        </div>
      </header>
      <div id="panel-plan">${htmlPlan()}</div>
    </section>`;
}

export function montarPlanAtencion(rerender, alCambiar) {
  const panel = $('#panel-plan');
  const abiertas = () => new Set([...panel.querySelectorAll('details.plan-problema[open]')].map((d) => d.id));
  const redibujar = (enfocar = null) => {
    panel.innerHTML = htmlPlan(abiertas());
    conectarQuitar(panel, { redibujar });
    alCambiar();
    if (enfocar) panel.querySelector(enfocar)?.focus({ preventScroll: true });
  };
  conectarPlan(panel, { redibujar, alCambiar });
  conectarQuitar(panel, { redibujar });
  // Los enlaces de la lista llevan a la tarjeta sin cambiar de ruta.
  panel.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-ir]');
    if (!a) return;
    ev.preventDefault();
    const el = document.getElementById(a.dataset.ir);
    if (el?.tagName === 'DETAILS') el.open = true;
    el?.scrollIntoView({ block: 'start' });
    el?.querySelector('h3')?.setAttribute('tabindex', '-1');
    el?.querySelector('h3')?.focus({ preventScroll: true });
  });
  const ancla = location.hash.split('#')[2];
  if (ancla) {
    const el = document.getElementById(ancla);
    if (el?.tagName === 'DETAILS') el.open = true;
    requestAnimationFrame(() => el?.scrollIntoView({ block: 'start' }));
  }
}

