// Fase 2, módulo C: pronóstico paliativo y valoración prequirúrgica (PPS, ARISCAT, DASI y ruta prequirúrgica).
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMINIOS } from '../js/dominios.js';
import { RUTAS, pasosDe } from '../js/rutas.js';
import { calcular, resumenDe, textoEscala } from '../js/motor.js';
import { clasificarCambio } from '../js/comparacion.js';
import { notaValoracion } from '../js/nota.js';
import { puntosEdad, puntosSpO2 } from '../escalas/ariscat.js';
import { vo2DeDasi, MAX_DASI, UMBRAL_DASI } from '../escalas/dasi.js';
import { porId, resp, calc, guardado, EJEMPLOS } from './ayuda.mjs';

const fecha = new Date(2026, 9, 10);

/* ---------- ARISCAT ---------- */

const ar = (cambios) => calc('ariscat', { edad: 45, spo2: 98, infeccion: 'No', anemia: 'No', incision: 'Periférica', duracion: 'Menos de 2 h', urgencia: 'No', ...cambios });

test('ARISCAT: puntos de cada variable (Canet, 2010)', () => {
  assert.deepEqual([50, 51, 80, 81].map(puntosEdad), [0, 3, 3, 16]);
  assert.deepEqual([96, 95, 91, 90].map(puntosSpO2), [0, 8, 8, 24]);
  assert.equal(ar({}).puntaje, 0);
  assert.equal(ar({ infeccion: 'Sí' }).puntaje, 17);
  assert.equal(ar({ anemia: 'Sí' }).puntaje, 11);
  assert.equal(ar({ incision: 'Abdominal alta' }).puntaje, 15);
  assert.equal(ar({ incision: 'Intratorácica' }).puntaje, 24);
  assert.equal(ar({ duracion: '2 a 3 h' }).puntaje, 16);
  assert.equal(ar({ duracion: 'Más de 3 h' }).puntaje, 23);
  assert.equal(ar({ urgencia: 'Sí' }).puntaje, 8);
  assert.equal(ar({ edad: 85, spo2: 88, infeccion: 'Sí', anemia: 'Sí', incision: 'Intratorácica', duracion: 'Más de 3 h', urgencia: 'Sí' }).puntaje, 123);
});

test('ARISCAT: clases <26, 26–44 y ≥45 con desenlace y población explícitos', () => {
  assert.equal(ar({ edad: 60, duracion: '2 a 3 h' }).puntaje, 19);
  assert.equal(ar({ edad: 60, duracion: '2 a 3 h' }).banda.etiqueta, 'Riesgo bajo');
  assert.equal(ar({ edad: 60, spo2: 94, incision: 'Abdominal alta' }).puntaje, 26);
  assert.equal(ar({ edad: 60, spo2: 94, incision: 'Abdominal alta' }).banda.etiqueta, 'Riesgo intermedio');
  assert.equal(ar({ edad: 60, incision: 'Intratorácica', duracion: '2 a 3 h' }).puntaje, 43);
  assert.equal(ar({ edad: 60, anemia: 'Sí', incision: 'Intratorácica', duracion: 'Menos de 2 h', urgencia: 'Sí' }).puntaje, 46);
  assert.equal(ar({ edad: 60, anemia: 'Sí', incision: 'Intratorácica', urgencia: 'Sí' }).banda.etiqueta, 'Riesgo alto');
  assert.match(ar({}).banda.texto, /PERISCOPE/);
  assert.ok(porId.ariscat.notas.some((n) => /Desenlace/.test(n) && /hospitalización/.test(n)));
  assert.match(resumenDe(porId.ariscat, ar({ urgencia: 'Sí' })), /ARISCAT: 8 puntos \(riesgo bajo de complicaciones pulmonares posoperatorias\)/);
});

/* ---------- DASI ---------- */

test('DASI: pesos de Hlatky, máximo 58.2, VO₂ = 0.43 × DASI + 9.6 y MET = VO₂ / 3.5', () => {
  const todo = calcular(porId.dasi, Object.fromEntries(porId.dasi.campos.map((c) => [c.id, 0])));
  assert.equal(todo.valor, MAX_DASI);
  const nada = calcular(porId.dasi, Object.fromEntries(porId.dasi.campos.map((c) => [c.id, 1])));
  assert.equal(nada.valor, 0);
  assert.equal(nada.extras.vo2, 9.6);
  const r = calcular(porId.dasi, EJEMPLOS.dasi());
  assert.equal(r.valor, 18.95);
  assert.equal(r.extras.vo2, Number(vo2DeDasi(18.95).toFixed(1)));
  assert.equal(r.extras.met, Number((vo2DeDasi(18.95) / 3.5).toFixed(1)));
  const pesos = porId.dasi.campos.map((c) => c.opciones[0].valor);
  assert.deepEqual(pesos, [2.75, 1.75, 2.75, 5.5, 8, 2.7, 3.5, 8, 4.5, 5.25, 6, 7.5]);
});

test('DASI: umbral de 34 del estudio METS; los MET son estimados, no prueba de esfuerzo', () => {
  const con = (ids) => calcular(porId.dasi, Object.fromEntries(porId.dasi.campos.map((c) => [c.id, ids.includes(c.id) ? 0 : 1])));
  const bajo = con(['cuidado', 'casa', 'cuadras', 'escaleras', 'ligero', 'moderado', 'jardin']); // 23.45
  assert.ok(bajo.valor < UMBRAL_DASI && bajo.banda.id === 'bajo');
  const justo = con(['cuidado', 'casa', 'cuadras', 'escaleras', 'ligero', 'moderado', 'recreacion', 'sexual']); // 30.2
  assert.equal(justo.banda.id, 'bajo');
  const alto = con(['cuidado', 'casa', 'cuadras', 'escaleras', 'ligero', 'moderado', 'recreacion', 'sexual', 'jardin']); // 34.7
  assert.equal(alto.valor, 34.7);
  assert.equal(alto.banda.id, 'alto');
  assert.match(textoEscala(porId.dasi, bajo, 'parrafo'), /fórmula de Hlatky/);
  assert.ok(porId.dasi.notas.some((n) => /AHA\/ACC 2024/.test(n) && /clase 2a/.test(n)));
  assert.ok(porId.dasi.notas.some((n) => /no sustituyen una prueba de esfuerzo cardiopulmonar/.test(n)));
  const c = clasificarCambio(porId.dasi, guardado('dasi', EJEMPLOS.dasi()), guardado('dasi', Object.fromEntries(porId.dasi.campos.map((x) => [x.id, 0]))));
  assert.equal(c.tipo, 'mejoria');
  assert.match(c.texto, /aumento de 39.25 puntos/);
});

/* ---------- PPS ---------- */

test('PPS: niveles de 10 % a 100 %, seguimiento longitudinal y sin esperanza de vida individual', () => {
  assert.deepEqual(porId.pps.campos[0].opciones.map((o) => o.valor), [100, 90, 80, 70, 60, 50, 40, 30, 20, 10]);
  assert.equal(porId.pps.registro, true);
  const r = calc('pps', { nivel: '30 %' });
  assert.equal(r.valor, 30);
  assert.equal(resumenDe(porId.pps, r), 'PPS 30 %.');
  assert.ok(!/días|semanas|meses/.test(r.banda.texto), 'la interpretación no da tiempo de supervivencia');
  assert.ok(porId.pps.notas[0].includes('no estima la esperanza de vida'));
  assert.ok(porId.pps.notas[1].includes('129 personas') && porId.pps.notas[1].includes('No es un pronóstico individual'), 'el dato publicado nombra población, desenlace y fuente');
  const c = clasificarCambio(porId.pps, guardado('pps', resp('pps', { nivel: '60 %' })), guardado('pps', resp('pps', { nivel: '40 %' })));
  assert.equal(c.tipo, 'empeoramiento');
  assert.match(c.texto, /disminución de 20 puntos \(declinación funcional\)/);
});

/* ---------- Ruta prequirúrgica ---------- */

test('ruta prequirúrgica: agrupa RCRI, DASI, ARISCAT, CFS, cognición, función, nutrición y riñón sin combinarlos', () => {
  const r = RUTAS.find((x) => x.id === 'preqx');
  const nucleo = pasosDe(r).filter((p) => !p.plan && !p.complementario);
  assert.deepEqual(nucleo.map((p) => p.id), ['rcri', 'dasi', 'ariscat', 'cfs', 'minicog', 'barthel', 'mnasf', 'ckdepi']);
  assert.ok(nucleo.every((p) => p.grupo), 'cada paso tiene su grupo');
  assert.match(r.descripcion, /no se combinan en un riesgo único/);
  const planes = [...RUTAS.flatMap((x) => x.planes || []), ...DOMINIOS.flatMap((d) => d.planeadas)].join(' | ');
  assert.ok(!/ARISCAT|DASI|PPS/.test(planes), planes);
  const val = { resultados: ['rcri', 'ariscat', 'dasi', 'cfs'].map((id) => guardado(id, EJEMPLOS[id](), { fecha: '2026-10-10' })) };
  const nota = notaValoracion(val, porId, DOMINIOS, fecha, 'completa');
  for (const corto of ['RCRI', 'ARISCAT', 'DASI', 'CFS']) assert.match(nota, new RegExp(`- ${corto}:`));
  assert.ok(!/riesgo (global|combinado|total)/i.test(nota), 'la nota no combina los riesgos');
});
