// Estado de una ruta guiada a partir de la valoración en curso.
import { almacen } from '../almacen.js';
import { porId, pasosDe, momentoPorDefecto } from '../datos.js';
import { minutosDe } from '../motor.js';

export const momentoDeRuta = (ruta) => (ruta.momentos ? almacen.momentoRuta(ruta.id) || ruta.momento : ruta.momento || null);

export function pasosConEstado(ruta) {
  const omitidas = almacen.omitidas(ruta.id);
  const v = almacen.valoracion();
  const mRuta = ruta.momentos ? almacen.momentoRuta(ruta.id) : null;
  return pasosDe(ruta).map((p, i) => {
    if (p.plan) return { ...p, i, estado: 'plan' };
    const escala = porId[p.id];
    const momento = momentoPorDefecto(escala, ruta, p.momento, mRuta);
    const resultados = v.resultados.filter((r) => r.escalaId === p.id && (r.momento || undefined) === momento);
    const resultado = resultados.sort((a, b) => ((b.fecha || '') > (a.fecha || '') ? 1 : -1))[0] || null;
    const estado = resultado ? 'completo' : omitidas.includes(p.clave) ? 'omitido' : 'pendiente';
    return { ...p, i, escala, momento, resultado, estado };
  });
}

export function progresoRuta(ruta) {
  const pasos = pasosConEstado(ruta);
  const nucleo = pasos.filter((p) => p.estado !== 'plan' && !p.complementario);
  const complementarios = pasos.filter((p) => p.estado !== 'plan' && p.complementario);
  return {
    pasos,
    total: nucleo.length,
    completos: nucleo.filter((p) => p.estado === 'completo').length,
    omitidos: nucleo.filter((p) => p.estado === 'omitido').length,
    pendientes: nucleo.filter((p) => p.estado === 'pendiente'),
    complementarios,
    complementariosHechos: complementarios.filter((p) => p.estado === 'completo').length,
  };
}

// Tiempo estimado del núcleo, a partir del tiempo de aplicación de cada instrumento.
export function tiempoRuta(ruta) {
  let min = 0;
  let max = 0;
  for (const p of pasosDe(ruta)) {
    if (p.plan || p.complementario) continue;
    const m = minutosDe(porId[p.id]);
    if (!m) continue;
    min += m[0];
    max += m[1];
  }
  return { min, max, texto: min === max ? `≈ ${min} min` : `≈ ${min} a ${max} min` };
}

// Siguiente paso pendiente del núcleo después de la posición dada (o el primero pendiente si no hay después).
export function siguientePendiente(ruta, desde = -1) {
  const { pendientes } = progresoRuta(ruta);
  return pendientes.find((p) => p.i > desde) || pendientes[0] || null;
}

export const urlPaso = (ruta, paso, resultado = false) =>
  `#/r/${ruta.id}/${paso.id}${paso.momento ? `@${paso.momento}` : ''}${resultado ? '/resultado' : ''}`;
