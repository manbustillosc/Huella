// Ruta clínica guiada: núcleo, complementarias y próximamente, con su estado, finalidad y progreso.
import { almacen } from '../almacen.js';
import { rutaDe } from '../datos.js';
import { momentoDe } from '../motor.js';
import { valorGuardado } from '../nota.js';
import { etiquetaAplicacion } from '../comparacion.js';
import { $$, esc, icono, plural, aviso } from '../ui.js';
import { progresoRuta, siguientePendiente, urlPaso, tiempoRuta, momentoDeRuta } from './rutas-estado.js';

const ESTADOS = {
  completo: ['completo', 'Completo'],
  omitido: ['omitido', 'Omitido'],
  pendiente: ['pendiente', 'Pendiente'],
};

function filaPaso(ruta, p, n) {
  const [ico, etq] = ESTADOS[p.estado];
  const m = p.momento ? ` · ${momentoDe(p.momento).nombre}` : '';
  const resultado = p.resultado ? `${valorGuardado(p.resultado)}${p.resultado.fecha ? ` · ${etiquetaAplicacion({ ...p.resultado, momento: undefined }).replace(/^del /, '')}` : ''}` : '';
  return `
    <li class="paso ${p.estado}${p.complementario ? ' complementario' : ''}">
      <a class="paso-enlace" href="${urlPaso(ruta, p, p.estado === 'completo')}">
        <span class="paso-num" aria-hidden="true">${p.complementario ? '+' : n}</span>
        <span class="paso-texto">
          <span class="paso-nombre">${esc(p.escala.corto)}${esc(m)}</span>
          ${p.nota ? `<span class="paso-nota">${esc(p.nota)}</span>` : ''}
          ${resultado ? `<span class="paso-desc">${esc(resultado)}</span>` : ''}
        </span>
        <span class="estado estado-${p.estado}">${icono(ico)} ${etq}</span>
      </a>
      ${p.estado === 'omitido' ? `<button class="btn-icono" type="button" data-retomar="${esc(p.clave)}" aria-label="Retomar ${esc(p.escala.corto)}">${icono('reiniciar')}</button>` : ''}
    </li>`;
}

function listaPasos(ruta, pasos) {
  let n = 0;
  let grupo = null;
  const partes = [];
  for (const p of pasos) {
    if (p.grupo && p.grupo !== grupo) {
      grupo = p.grupo;
      partes.push(`<li class="grupo-pasos" aria-hidden="true">${esc(grupo)}</li>`);
    }
    n += 1;
    partes.push(filaPaso(ruta, p, n));
  }
  return partes.join('');
}

function selectorMomentoRuta(ruta) {
  if (!ruta.momentos) return '';
  const actual = momentoDeRuta(ruta);
  return `
    <div class="momentos momento-ruta">
      <p class="momentos-etq">¿En qué momento de la hospitalización estás?</p>
      <div class="segmentado ancho" role="radiogroup" aria-label="Momento de la hospitalización">
        ${ruta.momentos.map((id) => `<label><input type="radio" name="momento-ruta" value="${id}"${id === actual ? ' checked' : ''}>${esc(momentoDe(id).nombre)}</label>`).join('')}
      </div>
      <p class="momentos-ayuda">Los pasos sin momento propio se registran en el momento elegido. El basal siempre es el estado previo al episodio.</p>
    </div>`;
}

export function renderRuta({ id }) {
  const ruta = rutaDe(id);
  const p = progresoRuta(ruta);
  const sig = siguientePendiente(ruta);
  const pct = p.total ? (p.completos / p.total) * 100 : 0;
  const tiempo = tiempoRuta(ruta);
  const nucleo = p.pasos.filter((x) => x.estado !== 'plan' && !x.complementario);
  const planes = p.pasos.filter((x) => x.estado === 'plan');
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
          <p class="ruta-tiempo">${icono('calendario')} ${plural(p.total, 'paso en el núcleo', 'pasos en el núcleo')} · ${esc(tiempo.texto)}${p.complementarios.length ? ` · ${plural(p.complementarios.length, 'complementaria', 'complementarias')}` : ''}</p>
        </div>
      </header>
      ${selectorMomentoRuta(ruta)}
      <div class="progreso-ruta">
        <div class="progreso-cifras">
          <strong>${p.completos} de ${p.total}</strong> completos${p.omitidos ? ` · ${plural(p.omitidos, 'omitido', 'omitidos')}` : ''}${p.complementariosHechos ? ` · ${plural(p.complementariosHechos, 'complementaria hecha', 'complementarias hechas')}` : ''}
        </div>
        <div class="tira-barra grande" role="progressbar" aria-valuemin="0" aria-valuemax="${p.total}" aria-valuenow="${p.completos}" aria-label="Progreso de la ruta"><span style="width:${pct}%"></span></div>
      </div>
      <div class="acciones-ruta">
        ${terminado
          ? `<a class="btn btn-primario" href="#/valoracion">${icono('valoracion')} Ver la nota de la valoración</a>`
          : `<a class="btn btn-primario" href="${urlPaso(ruta, sig)}">${icono('iniciar')} ${p.completos + p.omitidos ? `Continuar con ${esc(sig.escala.corto)}` : 'Comenzar'}</a>`}
        ${p.completos && !terminado ? `<a class="btn" href="#/valoracion">${icono('valoracion')} Ver la nota</a>` : ''}
      </div>
      <h2 class="seccion">Núcleo</h2>
      <ol class="pasos">${listaPasos(ruta, nucleo)}</ol>
      ${p.complementarios.length ? `
        <h2 class="seccion">Complementarias</h2>
        <p class="discreto">Opcionales: aplícalas según los hallazgos. No cuentan para el progreso.</p>
        <ol class="pasos">${listaPasos(ruta, p.complementarios)}</ol>` : ''}
      ${planes.length ? `
        <h2 class="seccion">Próximamente</h2>
        <ul class="chips">${planes.map((x) => `<li>${esc(x.plan)}</li>`).join('')}</ul>
        <p class="discreto">Aún no están disponibles en Huella y no se simulan.</p>` : ''}
    </section>`;
}

export function montarRuta({ id }, rerender) {
  $$('[data-retomar]').forEach((b) => b.addEventListener('click', () => {
    almacen.alternarOmitida(id, b.dataset.retomar, false);
    aviso('Instrumento retomado');
    rerender();
  }));
  $$('input[name="momento-ruta"]').forEach((input) => input.addEventListener('change', () => {
    almacen.guardarMomentoRuta(id, input.value);
    aviso(`Momento: ${momentoDe(input.value).nombre}`);
    rerender();
  }));
}
