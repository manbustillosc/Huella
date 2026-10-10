// Estado de una ruta guiada a partir de la valoración en curso.
import { almacen } from '../almacen.js';
import { porId, pasosDe, momentoPorDefecto } from '../datos.js';

export function pasosConEstado(ruta) {
  const omitidas = almacen.omitidas(ruta.id);
  const v = almacen.valoracion();
  return pasosDe(ruta).map((p, i) => {
    if (p.plan) return { ...p, i, estado: 'plan' };
    const escala = porId[p.id];
    const momento = momentoPorDefecto(escala, ruta, p.momento);
    const resultado = v.resultados.find((r) => r.escalaId === p.id && (r.momento || undefined) === momento) || null;
    const estado = resultado ? 'completo' : omitidas.includes(p.clave) ? 'omitido' : 'pendiente';
    return { ...p, i, escala, momento, resultado, estado };
  });
}

export function progresoRuta(ruta) {
  const pasos = pasosConEstado(ruta);
  const disponibles = pasos.filter((p) => p.estado !== 'plan');
  return {
    pasos,
    total: disponibles.length,
    completos: disponibles.filter((p) => p.estado === 'completo').length,
    omitidos: disponibles.filter((p) => p.estado === 'omitido').length,
    pendientes: disponibles.filter((p) => p.estado === 'pendiente'),
  };
}

// Siguiente paso pendiente después de la posición dada (o el primero pendiente si no hay después).
export function siguientePendiente(ruta, desde = -1) {
  const { pendientes } = progresoRuta(ruta);
  return pendientes.find((p) => p.i > desde) || pendientes[0] || null;
}

export const urlPaso = (ruta, paso, resultado = false) =>
  `#/r/${ruta.id}/${paso.id}${paso.momento ? `@${paso.momento}` : ''}${resultado ? '/resultado' : ''}`;
