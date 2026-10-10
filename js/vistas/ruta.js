// Ruta clínica guiada: instrumentos de la situación, con su estado y progreso.
import { almacen } from '../almacen.js';
import { rutaDe } from '../datos.js';
import { momentoDe } from '../motor.js';
import { valorGuardado } from '../nota.js';
import { $$, esc, icono, plural, aviso } from '../ui.js';
import { progresoRuta, siguientePendiente, urlPaso } from './rutas-estado.js';

const ESTADOS = {
  completo: ['completo', 'Completo'],
  omitido: ['omitido', 'Omitido'],
  pendiente: ['pendiente', 'Pendiente'],
  plan: ['pendiente', 'Próximamente'],
};

function filaPaso(ruta, p, n) {
  const [ico, etq] = ESTADOS[p.estado];
  if (p.estado === 'plan') {
    return `
      <li class="paso plan">
        <span class="paso-num" aria-hidden="true">·</span>
        <span class="paso-texto"><span class="paso-nombre">${esc(p.plan)}</span><span class="paso-desc">Aún no disponible en Huella</span></span>
        <span class="estado estado-plan">${etq}</span>
      </li>`;
  }
  const m = p.momento ? ` · ${momentoDe(p.momento).nombre}` : '';
  const desc = p.resultado ? valorGuardado(p.resultado) : p.escala.descripcion;
  return `
    <li class="paso ${p.estado}">
      <a class="paso-enlace" href="${urlPaso(ruta, p, p.estado === 'completo')}">
        <span class="paso-num" aria-hidden="true">${n}</span>
        <span class="paso-texto">
          <span class="paso-nombre">${esc(p.escala.corto)}${esc(m)}</span>
          <span class="paso-desc">${esc(desc)}</span>
        </span>
        <span class="estado estado-${p.estado}">${icono(ico)} ${etq}</span>
      </a>
      ${p.estado === 'omitido' ? `<button class="btn-icono" type="button" data-retomar="${esc(p.clave)}" aria-label="Retomar ${esc(p.escala.corto)}">${icono('reiniciar')}</button>` : ''}
    </li>`;
}

export function renderRuta({ id }) {
  const ruta = rutaDe(id);
  const p = progresoRuta(ruta);
  const sig = siguientePendiente(ruta);
  const pct = p.total ? (p.completos / p.total) * 100 : 0;
  let n = 0;
  const filas = p.pasos.map((x) => {
    if (x.estado !== 'plan') n += 1;
    return filaPaso(ruta, x, n);
  }).join('');
  const terminado = !sig;
  return `
    <section class="vista ruta">
      <a class="migas" href="#/">${icono('atras')} Inicio</a>
      <header class="cabecera cabecera-dominio">
        <span class="ico-dominio grande">${icono(ruta.icono)}</span>
        <div>
          <p class="ceja">Ruta guiada</p>
          <h1>${esc(ruta.nombre)}</h1>
          <p class="entradilla">${esc(ruta.descripcion)}</p>
        </div>
      </header>
      <div class="progreso-ruta">
        <div class="progreso-cifras">
          <strong>${p.completos} de ${p.total}</strong> completos${p.omitidos ? ` · ${plural(p.omitidos, 'omitido', 'omitidos')}` : ''}
        </div>
        <div class="tira-barra grande" role="progressbar" aria-valuemin="0" aria-valuemax="${p.total}" aria-valuenow="${p.completos}" aria-label="Progreso de la ruta"><span style="width:${pct}%"></span></div>
      </div>
      <div class="acciones-ruta">
        ${terminado
          ? `<a class="btn btn-primario" href="#/valoracion">${icono('valoracion')} Ver la nota de la valoración</a>`
          : `<a class="btn btn-primario" href="${urlPaso(ruta, sig)}">${icono('iniciar')} ${p.completos + p.omitidos ? `Continuar con ${esc(sig.escala.corto)}` : 'Comenzar'}</a>`}
        ${p.completos && !terminado ? `<a class="btn" href="#/valoracion">${icono('valoracion')} Ver la nota</a>` : ''}
      </div>
      <ol class="pasos">${filas}</ol>
      <p class="discreto">Los resultados se guardan en la valoración en curso. Los instrumentos marcados como «Próximamente» aún no están disponibles y no se simulan.</p>
    </section>`;
}

export function montarRuta({ id }, rerender) {
  $$('[data-retomar]').forEach((b) => b.addEventListener('click', () => {
    almacen.alternarOmitida(id, b.dataset.retomar, false);
    aviso('Instrumento retomado');
    rerender();
  }));
}
