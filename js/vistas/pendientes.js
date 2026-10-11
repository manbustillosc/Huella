// Centro de pendientes: lo que falta en la valoración en curso, en un solo lugar. Solo enlaza; no cambia nada.
import { almacen } from '../almacen.js';
import { porId, RUTAS } from '../datos.js';
import { esc, icono, plural, hoyISO } from '../ui.js';
import { centroPendientes } from '../pendientes.js';
import { progresoRuta } from './rutas-estado.js';

const ICONOS = { incompletos: 'editar', no_evaluables: 'omitido', complementarias: 'ruta', objetivos: 'objetivo', revaloraciones: 'calendario', vigencia: 'historial' };

export function pendientesActuales() {
  const v = almacen.valoracion();
  const rutas = RUTAS.filter((r) => r.id !== 'icope')
    .map((r) => ({ r, p: progresoRuta(r) }))
    .filter(({ p }) => p.completos + p.omitidos > 0 && p.pendientes.length)
    .map(({ r, p }) => ({ id: r.id, nombre: r.nombre, pendientes: p.pendientes.length }));
  return centroPendientes(v, porId, hoyISO(), { borradores: almacen.borradores(), rutas });
}

export function renderPendientes() {
  const { grupos, total } = pendientesActuales();
  return `
    <section class="vista pendientes">
      <a class="migas" href="#/">${icono('atras')} Inicio</a>
      <header class="cabecera">
        <p class="ceja">Valoración en curso</p>
        <h1>Pendientes</h1>
        <p class="entradilla">${total ? `${esc(plural(total, 'pendiente', 'pendientes'))}. Toca uno para resolverlo; Huella no cambia nada por su cuenta.` : 'No hay pendientes en la valoración en curso.'}</p>
      </header>
      ${grupos.map((g) => `
        <section class="grupo-pendientes" aria-labelledby="pend-${g.id}">
          <h2 class="seccion" id="pend-${g.id}">${icono(ICONOS[g.id] || 'lista')} ${esc(g.titulo)} <span class="cuenta">${g.items.length}</span></h2>
          ${g.ayuda ? `<p class="discreto">${esc(g.ayuda)}</p>` : ''}
          <ul class="lista-pendientes">
            ${g.items.map((x) => `<li${x.vencido || x.estado === 'desactualizado' ? ' class="pend-alerta"' : ''}><a href="${esc(x.href)}">${esc(x.texto)}${icono('adelante', 'chev')}</a></li>`).join('')}
          </ul>
        </section>`).join('')}
      ${total ? '' : `
        <div class="vacio-estado">
          ${icono('check')}
          <p>Todo al día</p>
          <p class="sub-vacio">Aquí aparecerán instrumentos sin terminar, no evaluables, evaluaciones pendientes, objetivos abiertos, revaloraciones vencidas y resultados por revisar su vigencia.</p>
          <a class="btn btn-primario" href="#/">Ir al inicio</a>
        </div>`}
    </section>`;
}
