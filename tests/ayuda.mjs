// Utilidades compartidas por las pruebas.
import assert from 'node:assert/strict';
import { ESCALAS } from '../escalas/index.js';
import { normalizarEscala, calcular, resumenDe, resumenBreveDe, NINGUNO } from '../js/motor.js';

export const escalas = ESCALAS.map(normalizarEscala);
export const porId = Object.fromEntries(escalas.map((e) => [e.id, e]));

// Construye respuestas a partir del texto de la opción (o un valor crudo para números y listas).
export function resp(id, mapa) {
  const e = porId[id];
  const r = {};
  for (const [k, val] of Object.entries(mapa)) {
    const c = e.campos.find((x) => x.id === k);
    if (!c) { r[k] = val; continue; }
    if (c.tipo === 'opciones' && typeof val === 'string') {
      const i = c.opciones.findIndex((o) => o.texto === val);
      assert.ok(i >= 0, `${id}.${k}: no existe la opción «${val}»`);
      r[k] = i;
    } else r[k] = val;
  }
  return r;
}
export const calc = (id, mapa, ctx) => calcular(porId[id], resp(id, mapa), ctx);
export const todos = (id, idx) => Object.fromEntries(porId[id].campos.filter((c) => c.tipo === 'opciones' && !c.anotaA).map((c) => [c.id, idx(c)]));

// Simula «Añadir a la valoración» con la misma forma que guarda la app.
let contador = 0;
export function guardado(id, respuestas, extra = {}) {
  const e = porId[id];
  const res = calcular(e, respuestas);
  assert.ok(res.completo, `${id} incompleto: ${res.faltan} ${JSON.stringify(res.errores)}`);
  contador += 1;
  return {
    id: `t${contador}`,
    escalaId: id, puntaje: res.puntaje, max: res.max, valor: res.valor, unidad: res.unidad, mostrar: res.mostrar,
    nivel: res.banda.nivel, etiqueta: res.banda.etiqueta, hallazgo: Boolean(res.banda.hallazgo), sugerencias: res.banda.sugerencias || [],
    resumen: resumenDe(e, res), breve: resumenBreveDe(e, res), noEvaluable: res.noEvaluable || null,
    extras: res.noEvaluable ? null : JSON.parse(JSON.stringify(res.extras || {})),
    respuestas, guardado: contador, ...extra,
  };
}

// Respuestas completas de ejemplo para cada instrumento.
export const EJEMPLOS = {
  barthel: () => todos('barthel', () => 0), katz: () => todos('katz', () => 0), lawton: () => todos('lawton', () => 0),
  minicog: () => todos('minicog', () => 0), moca: () => resp('moca', { puntaje: 22, escolaridad: 'No, más de 12 años' }),
  gds15: () => todos('gds15', () => 0), '4at': () => todos('4at', () => 0), cam: () => todos('cam', () => 0),
  frail: () => resp('frail', { ...todos('frail', () => 0), enfermedades: [NINGUNO], perdida: 'No' }), cfs: () => todos('cfs', () => 4),
  sarcf: () => todos('sarcf', () => 1),
  sppb: () => resp('sppb', { eq_juntos: 'Mantiene 10 s', eq_semi: 'Mantiene 10 s', eq_tandem: '10 s o más', marcha_estado: 'Recorrido de 4 m', marcha_1: 4, silla_pre: 'Sí', silla_estado: 'Sí', silla_t: 10 }),
  vivifrail: () => resp('vivifrail', { sppb: '12', caidas: 'No', tug: 'No, 20 s o menos', vm6: 'No, 0.8 m/s o más', demencia: 'No' }),
  tug: () => resp('tug', { estado: 'Sí', tiempo: 11 }), velocidad: () => resp('velocidad', { distancia: '4 metros', tiempo: 4 }),
  mnasf: () => resp('mnasf', { puntaje: 10, variante: 'Circunferencia de pantorrilla' }),
  braden: () => resp('braden', { percepcion: '3', humedad: '3', actividad: '3', movilidad: '3', nutricion: '3', friccion: '2', edad: 80 }),
  painad: () => todos('painad', () => 1), rcri: () => todos('rcri', () => 1), zarit: () => resp('zarit', { puntaje: 50 }),
  ckdepi: () => resp('ckdepi', { creatinina: 1.2, edad: 78, sexo: 'Hombre' }),
  cockcroft: () => resp('cockcroft', { edad: 78, sexo: 'Hombre', creatinina: 1.2, peso: 70, peso_uso: 'Peso real' }),
};
