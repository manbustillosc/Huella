// Estado de una ruta guiada a partir de la valoración en curso.
import { almacen } from '../almacen.js';
import { porId, pasosDe, momentoPorDefecto } from '../datos.js';
import { minutosDe } from '../motor.js';

export const momentoDeRuta = (ruta) => (ruta.momentos ? almacen.momentoRuta(ruta.id) || ruta.momento : ruta.momento || null);

export function pasosConEstado(ruta) {
  const omitidas = almacen.omitidas(ruta.id);
  const v = almacen.valoracion();
  const mRuta = ruta.momentos ? almacen.momentoRuta(ruta.id) : null;
  const pasos = pasosDe(ruta).map((p, i) => {
    if (p.plan) return { ...p, i, estado: 'plan' };
    const escala = porId[p.id];
    const momento = momentoPorDefecto(escala, ruta, p.momento, mRuta);
    const resultados = v.resultados.filter((r) => r.escalaId === p.id && (r.momento || undefined) === momento);
    const resultado = resultados.sort((a, b) => ((b.fecha || '') > (a.fecha || '') ? 1 : -1))[0] || null;
    const estado = resultado ? 'completo' : omitidas.includes(p.clave) ? 'omitido' : 'pendiente';
    return { ...p, i, escala, momento, resultado, estado };
  });
  // Elección explícita: si un paso del grupo está completo, los demás quedan como alternativa no necesaria.
  for (const miembros of Object.values(gruposEleccion(pasos))) {
    if (miembros.some((p) => p.estado === 'completo')) miembros.forEach((p) => { if (p.estado !== 'completo') p.estado = 'alternativa'; });
  }
  return pasos;
}

export function gruposEleccion(pasos) {
  const grupos = {};
  for (const p of pasos) if (p.eleccion && !p.complementario) (grupos[p.eleccion] ||= []).push(p);
  return grupos;
}

// Unidades del núcleo: cada paso cuenta una vez, y cada grupo de elección cuenta como un solo paso.
export function unidadesNucleo(nucleo) {
  const unidades = [];
  const vistos = new Set();
  for (const p of nucleo) {
    if (!p.eleccion) unidades.push([p]);
    else if (!vistos.has(p.eleccion)) {
      vistos.add(p.eleccion);
      unidades.push(nucleo.filter((x) => x.eleccion === p.eleccion));
    }
  }
  return unidades.map((miembros) => ({
    miembros,
    estado: miembros.some((p) => p.estado === 'completo') ? 'completo' : miembros.every((p) => p.estado === 'omitido') ? 'omitido' : 'pendiente',
  }));
}

export function progresoRuta(ruta) {
  const pasos = pasosConEstado(ruta);
  const nucleo = pasos.filter((p) => p.estado !== 'plan' && !p.complementario);
  const complementarios = pasos.filter((p) => p.estado !== 'plan' && p.complementario);
  const unidades = unidadesNucleo(nucleo);
  return {
    pasos,
    total: unidades.length,
    completos: unidades.filter((u) => u.estado === 'completo').length,
    omitidos: unidades.filter((u) => u.estado === 'omitido').length,
    // Un pendiente por unidad: en un grupo de elección, el primer paso pendiente (la persona elige en la ruta).
    pendientes: unidades.filter((u) => u.estado === 'pendiente').map((u) => u.miembros.find((p) => p.estado === 'pendiente')),
    complementarios,
    complementariosHechos: complementarios.filter((p) => p.estado === 'completo').length,
  };
}

// Tiempo estimado del núcleo, a partir del tiempo de aplicación de cada instrumento.
export function tiempoRuta(ruta) {
  let min = 0;
  let max = 0;
  const elecciones = {};
  for (const p of pasosDe(ruta)) {
    if (p.plan || p.complementario) continue;
    const m = minutosDe(porId[p.id]);
    if (!m) continue;
    if (p.eleccion) {
      // De un grupo de elección se aplica uno: cuenta el intervalo más amplio del grupo.
      const g = elecciones[p.eleccion] || (elecciones[p.eleccion] = [Infinity, 0]);
      g[0] = Math.min(g[0], m[0]);
      g[1] = Math.max(g[1], m[1]);
      continue;
    }
    min += m[0];
    max += m[1];
  }
  for (const [a, b] of Object.values(elecciones)) { min += a; max += b; }
  return { min, max, texto: min === max ? `≈ ${min} min` : `≈ ${min} a ${max} min` };
}

// Siguiente paso pendiente del núcleo después de la posición dada (o el primero pendiente si no hay después).
export function siguientePendiente(ruta, desde = -1) {
  const { pendientes } = progresoRuta(ruta);
  return pendientes.find((p) => p.i > desde) || pendientes[0] || null;
}

export const urlPaso = (ruta, paso, resultado = false) =>
  `#/r/${ruta.id}/${paso.id}${paso.momento ? `@${paso.momento}` : ''}${resultado ? '/resultado' : ''}`;
