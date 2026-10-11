// Catálogo en memoria: instrumentos normalizados, dominios y rutas.
import { ESCALAS } from '../escalas/index.js';
import { DOMINIOS } from './dominios.js';
import { RUTAS, pasosDe } from './rutas.js';
import { normalizarEscala } from './motor.js';

export const VERSION = '1.5.0';
export const escalas = ESCALAS.map(normalizarEscala);
export const porId = Object.fromEntries(escalas.map((e) => [e.id, e]));
export const escalasDe = (dominioId) => escalas.filter((e) => e.dominio === dominioId);
export const dominioDe = (id) => DOMINIOS.find((d) => d.id === id);
export const rutaDe = (id) => RUTAS.find((r) => r.id === id);
export { DOMINIOS, RUTAS, pasosDe };

// Momento que corresponde a un paso de ruta o a una escala abierta sin momento explícito.
// momentoRuta: el elegido por el médico en una ruta con momento elegible (p. ej., hospitalización).
export function momentoPorDefecto(escala, ruta = null, momento = null, momentoRuta = null) {
  if (!escala.momentos) return undefined;
  return momento || momentoRuta || ruta?.momento || 'actual';
}
