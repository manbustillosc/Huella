// Versión 2.11.1: PHQ-2 como primer paso del PHQ-9 y nuevo núcleo de la valoración geriátrica rápida. Datos ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular, campoVisible, limpiarOcultas, resumenDe, resumenBreveDe } from '../js/motor.js';
import { clasificarCambio } from '../js/comparacion.js';
import { valorGuardado } from '../js/nota.js';
import { RUTAS, pasosDe } from '../js/rutas.js';
import { CORTE_PHQ2, aplicaPhq9, puntajePhq2 } from '../escalas/phq9.js';
import { porId, guardado } from './ayuda.mjs';

const e = () => porId.phq9;
const campo = (id) => e().campos.find((c) => c.id === id);
const RESTO = ['sueno', 'energia', 'apetito', 'culpa', 'concentracion', 'psicomotor', 'muerte'];
const ceros = Object.fromEntries(RESTO.map((id) => [id, 0]));

test('PHQ-2: las 7 preguntas restantes aparecen solo con PHQ-2 de 2 o más o si el médico decide completar', () => {
  assert.equal(CORTE_PHQ2, 2);
  assert.equal(e().corto, 'PHQ-2/9');
  assert.equal(puntajePhq2({ interes: 1 }), null);
  assert.equal(campoVisible(campo('sueno'), {}), false, 'sin el PHQ-2 contestado, no se ven');
  assert.equal(campoVisible(campo('sueno'), { interes: 0, animo: 1 }), false);
  assert.equal(campoVisible(campo('completo'), { interes: 0, animo: 1 }), true, 'con PHQ-2 negativo se ofrece completar');
  assert.equal(campo('completo').secundario, true);
  assert.equal(campoVisible(campo('sueno'), { interes: 1, animo: 1 }), true, 'PHQ-2 = 2 es positivo');
  assert.equal(campoVisible(campo('completo'), { interes: 1, animo: 1 }), false);
  assert.equal(campoVisible(campo('muerte'), { interes: 0, animo: 0, completo: 1 }), true, 'el médico decide aplicar las 9');
  assert.equal(campoVisible(campo('muerte'), { interes: 0, animo: 0, completo: 0 }), false);
  assert.deepEqual(e().campos.filter((c) => c.grupo).map((c) => c.id), ['interes', 'sueno']);
});

test('PHQ-2 negativo: resultado propio, sin cifra en la escala de 0 a 27 y sin preguntar la dificultad', () => {
  const r = calcular(e(), { interes: 1, animo: 0 });
  assert.equal(r.completo, true);
  assert.equal(r.banda.id, 'phq2neg');
  assert.equal(r.banda.hallazgo, undefined);
  assert.equal(r.puntaje, null);
  assert.equal(r.mostrar, '1/6');
  assert.equal(r.extras.modo, 'phq2');
  assert.ok(!r.desglose.some((d) => d.campo.id === 'dificultad'));
  assert.equal(resumenDe(e(), r), 'PHQ-2/9: PHQ-2 de 1/6, negativo (se completa el PHQ-9 con 2 o más).');
  assert.equal(resumenBreveDe(e(), r), 'PHQ-2 1/6 (negativo)');
  const g = guardado('phq9', { interes: 1, animo: 0 });
  assert.equal(valorGuardado(g), 'PHQ-2 negativo');
  // Lo que se contestó de más y quedó oculto no se guarda.
  assert.equal(limpiarOcultas(e(), { interes: 0, animo: 0, completo: 0, sueno: 2 }).sueno, undefined);
});

test('PHQ-2 positivo: obliga a completar el PHQ-9 y el resultado es el PHQ-9 de siempre', () => {
  const incompleto = calcular(e(), { interes: 2, animo: 1 });
  assert.equal(incompleto.completo, false);
  assert.deepEqual(incompleto.faltan, [...RESTO, 'dificultad']);
  const r = calcular(e(), { interes: 2, animo: 1, ...ceros, sueno: 2, energia: 3, culpa: 2, dificultad: 1 });
  assert.equal(r.puntaje, 10);
  assert.equal(r.banda.etiqueta, 'Síntomas depresivos moderados');
  assert.equal(r.extras.modo, 'phq9');
  assert.equal(r.extras.phq2, 3);
  assert.ok(r.lineas.includes('PHQ-2: 3 de 6 (positivo): por eso se completó el PHQ-9.'));
  assert.match(resumenDe(e(), r), /^PHQ-2\/9: PHQ-9 de 10\/27 \(síntomas depresivos moderados; tamizaje positivo\)\.$/);
  const decidido = calcular(e(), { interes: 0, animo: 0, completo: 1, ...ceros });
  assert.equal(decidido.puntaje, 0);
  assert.ok(decidido.lineas.includes('PHQ-2: 0 de 6; se aplicaron las 9 preguntas por decisión del médico.'));
});

test('Resultados guardados antes (9 respuestas sin la decisión «completo») siguen calculando el PHQ-9 completo', () => {
  assert.equal(aplicaPhq9({ interes: 0, animo: 0, ...ceros }), true);
  const viejo = calcular(e(), { interes: 0, animo: 1, ...ceros, muerte: 1, dificultad: 0 });
  assert.equal(viejo.completo, true);
  assert.equal(viejo.puntaje, 2);
  assert.equal(viejo.alertas.length, 1, 'el reactivo 9 sigue alertando');
});

test('Comparar PHQ-2 con PHQ-9: solo la categoría, nunca 1/6 contra una cifra de 0 a 27', () => {
  const p2 = guardado('phq9', { interes: 1, animo: 0 }, { fecha: '2026-10-01' });
  const p9 = guardado('phq9', { interes: 2, animo: 1, ...ceros, sueno: 2, energia: 3, culpa: 2, dificultad: 1 }, { fecha: '2026-10-20' });
  const c = clasificarCambio(e(), p2, p9);
  assert.equal(c.dif, null);
  assert.notEqual(c.tipo, 'empeoramiento');
  assert.ok(c.advertencias.some((a) => /terminó con el PHQ-2/.test(a)));
  assert.match(c.texto, /de «PHQ-2 negativo» a «síntomas depresivos moderados»/);
});

test('Valoración rápida: núcleo Barthel, Lawton, Mini-Cog, PHQ-2/9, MNA-SF, FRAIL y SARC-F', () => {
  const rapida = RUTAS.find((r) => r.id === 'rapida');
  const pasos = pasosDe(rapida);
  assert.deepEqual(pasos.filter((p) => !p.complementario).map((p) => porId[p.id].corto), ['Barthel', 'Lawton-Brody', 'Mini-Cog', 'PHQ-2/9', 'MNA-SF', 'FRAIL', 'SARC-F']);
  assert.deepEqual(pasos.filter((p) => p.complementario).map((p) => p.id), ['gds15', 'tug']);
  assert.match(pasos.find((p) => p.id === 'phq9').nota, /PHQ-2/);
});
