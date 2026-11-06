// Versión 2.14.0: cuestionario de Pfeiffer (SPMSQ) y FES-I completa (registro). Todos los datos son ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { porId, resp, calc, todos, guardado } from './ayuda.mjs';
import { RUTAS } from '../js/rutas.js';
import { resultadosBusqueda } from '../js/vistas/inicio.js';
import { notaValoracion } from '../js/nota.js';
import { DOMINIOS } from '../js/dominios.js';

const ITEMS = ['fecha', 'dia', 'lugar', 'telefono', 'edad', 'nacimiento', 'presidente', 'anterior', 'madre', 'resta'];

function pfeiffer(errores, escolaridad = 'Primaria a preparatoria') {
  const r = { ...todos('pfeiffer', () => 0), escolaridad };
  for (const id of ITEMS.slice(0, errores)) r[id] = 'Error';
  return calc('pfeiffer', r);
}

test('Pfeiffer: 10 preguntas que cuentan errores, más la escolaridad que no puntúa', () => {
  const e = porId.pfeiffer;
  assert.equal(e.dominio, 'cognitivo');
  assert.equal(e.tipo, 'tamizaje');
  assert.equal(e.direccionClinica, 'menor_mejor');
  assert.deepEqual(e.campos.filter((c) => c.id !== 'escolaridad').map((c) => c.id), ITEMS);
  assert.equal(e.campos.find((c) => c.id === 'escolaridad').puntua, false);
  assert.ok(!e.registro, 'preguntas con redacción propia, sin titular de licencias');
  // Distinto del cuestionario funcional de Pfeffer
  assert.notEqual(porId.pfeffer.dominio, 'cognitivo');
});

test('Pfeiffer: categorías de Pfeiffer (1975) sobre los errores', () => {
  assert.equal(pfeiffer(0).banda.etiqueta, 'Sin deterioro cognitivo probable');
  assert.equal(pfeiffer(2).banda.etiqueta, 'Sin deterioro cognitivo probable');
  assert.equal(pfeiffer(3).banda.etiqueta, 'Probable deterioro cognitivo leve');
  assert.equal(pfeiffer(4).banda.etiqueta, 'Probable deterioro cognitivo leve');
  assert.equal(pfeiffer(5).banda.etiqueta, 'Probable deterioro cognitivo moderado');
  assert.equal(pfeiffer(7).banda.etiqueta, 'Probable deterioro cognitivo moderado');
  assert.equal(pfeiffer(8).banda.etiqueta, 'Probable deterioro cognitivo grave');
  assert.equal(pfeiffer(10).banda.etiqueta, 'Probable deterioro cognitivo grave');
  const r = pfeiffer(3);
  assert.equal(r.puntaje, 3);
  assert.equal(r.mostrar, '3');
  assert.equal(r.sufijo, 'errores de 10');
  assert.equal(r.banda.hallazgo, true);
});

test('Pfeiffer: sin estudios se permite un error más (corte de 4, Martínez de la Iglesia 2001)', () => {
  const sin = 'No sabe leer ni escribir o no fue a la escuela';
  assert.equal(pfeiffer(3, sin).banda.etiqueta, 'Sin deterioro cognitivo probable');
  assert.equal(pfeiffer(4, sin).banda.etiqueta, 'Probable deterioro cognitivo leve');
  assert.equal(pfeiffer(3, sin).puntaje, 3, 'el puntaje guardado son los errores reales');
  assert.equal(pfeiffer(3, sin).extras.ajustados, 2);
  assert.match(pfeiffer(3, sin).lineas[0], /se permite un error más: 3 errores cuentan como 2/);
  assert.equal(pfeiffer(0, sin).extras.ajustados, 0, 'nunca menos de 0');
});

test('Pfeiffer: con estudios universitarios se permite un error menos', () => {
  const uni = 'Estudios universitarios';
  assert.equal(pfeiffer(2, uni).banda.etiqueta, 'Probable deterioro cognitivo leve');
  assert.equal(pfeiffer(1, uni).banda.etiqueta, 'Sin deterioro cognitivo probable');
  assert.equal(pfeiffer(10, uni).extras.ajustados, 10, 'nunca más de 10');
  assert.match(pfeiffer(1, uni).lineas[0], /1 error cuenta como 2/);
});

test('Pfeiffer: resumen y nota legibles', () => {
  const e = porId.pfeiffer;
  const sin = pfeiffer(3, 'No sabe leer ni escribir o no fue a la escuela');
  assert.equal(e.resumen(sin), 'Pfeiffer (SPMSQ): 3 errores de 10, 2 ajustados por escolaridad (sin deterioro cognitivo probable).');
  assert.equal(e.resumenBreve(pfeiffer(1)), 'Pfeiffer 1 error (sin deterioro cognitivo probable)');
  const g = guardado('pfeiffer', resp('pfeiffer', { ...todos('pfeiffer', () => 0), escolaridad: 'Primaria a preparatoria', resta: 'Error', madre: 'Error', fecha: 'Error', dia: 'Error' }), { fecha: '2026-11-06' });
  const t = notaValoracion({ resultados: [g] }, porId, DOMINIOS, '2026-11-06', 'lista');
  assert.match(t, /Pfeiffer/);
  assert.ok(!/undefined|NaN|null/.test(t));
});

test('Pfeiffer: la escolaridad es obligatoria para interpretar', () => {
  const sinEsc = calc('pfeiffer', Object.fromEntries(ITEMS.map((id) => [id, 'Correcta'])));
  assert.equal(sinEsc.completo, false);
});

test('FES-I completa: solo registra el total oficial (16 a 64) con los cortes de Delbaere 2010', () => {
  const e = porId.fesi;
  assert.equal(e.registro, true);
  assert.equal(e.dominio, 'caidas');
  assert.deepEqual(e.campos.map((c) => c.id), ['puntaje']);
  const banda = (n) => calc('fesi', { puntaje: n }).banda.etiqueta;
  assert.equal(banda(16), 'Preocupación baja por caer');
  assert.equal(banda(19), 'Preocupación baja por caer');
  assert.equal(banda(20), 'Preocupación moderada por caer');
  assert.equal(banda(27), 'Preocupación moderada por caer');
  assert.equal(banda(28), 'Preocupación alta por caer');
  assert.equal(banda(64), 'Preocupación alta por caer');
  assert.equal(calc('fesi', { puntaje: 15 }).completo, false, 'fuera de rango');
  assert.equal(calc('fesi', { puntaje: 65 }).completo, false, 'fuera de rango');
  assert.ok(e.referencias.some((r) => r.doi === '10.1093/ageing/afi196'));
  assert.ok(e.referencias.some((r) => r.doi === '10.1093/ageing/afp225'));
  assert.equal(e.licencia.enlace, 'https://sites.manchester.ac.uk/fes-i/');
});

test('ambas aparecen en sus rutas y en la búsqueda', () => {
  const cog = RUTAS.find((r) => r.id === 'cognitiva');
  assert.ok([...cog.pasos, ...cog.complementarios].some((p) => p.id === 'pfeiffer'));
  const caidas = RUTAS.find((r) => [...r.pasos, ...(r.complementarios || [])].some((p) => p.id === 'shortfesi'));
  assert.ok([...caidas.pasos, ...caidas.complementarios].some((p) => p.id === 'fesi'));
  assert.match(resultadosBusqueda('pfeiffer cognitivo'), /Pfeiffer \(SPMSQ\)/);
  assert.match(resultadosBusqueda('pfeifer'), /Pfeiffer \(SPMSQ\)/);
  assert.match(resultadosBusqueda('fesi'), /FES-I/);
  assert.match(resultadosBusqueda('miedo a caer'), /FES-I/);
});
