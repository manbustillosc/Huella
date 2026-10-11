// Fase 3, módulo D: comorbilidad y riesgo hospitalario (Charlson, CIRS-G, NEWS2) y decisión sobre LACE.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMINIOS } from '../js/dominios.js';
import { RUTAS } from '../js/rutas.js';
import { validarBandasEnteras, calcular } from '../js/motor.js';
import { clasificarCambio } from '../js/comparacion.js';
import { puntosEdadCharlson, puntosNews2 } from '../escalas/comorbilidad.js';
import { porId, resp, calc, guardado, EJEMPLOS } from './ayuda.mjs';

const NO_CH = { iam: 'No', icc: 'No', vascular: 'No', cerebro: 'No', demencia: 'No', pulmonar: 'No', conectivo: 'No', ulcera: 'No', higado: 'No', diabetes: 'No', hemiplejia: 'No', renal: 'No', tumor: 'No', leucemia: 'No', linfoma: 'No', sida: 'No' };
const ch = (m, edad = 75) => calc('charlson', { edad, ...NO_CH, ...m });

test('módulo D: dominio de comorbilidad y riesgo hospitalario, rutas y LACE con advertencia en personas mayores', () => {
  for (const id of ['charlson', 'cirsg', 'news2']) {
    assert.ok(porId[id] && EJEMPLOS[id], id);
    assert.equal(porId[id].dominio, 'comorbilidad');
  }
  const dom = DOMINIOS.find((d) => d.id === 'comorbilidad');
  assert.equal(dom.nombre, 'Comorbilidad y riesgo hospitalario');
  assert.ok(porId.lace && porId.lace.dominio === 'comorbilidad', 'LACE implementado en comorbilidad');
  assert.match(porId.lace.notas.join(' '), /discriminación fue pobre \(Cotter, 2012\)/);
  assert.ok(!DOMINIOS.find((d) => d.id === 'paliativos').planeadas.includes('Índice de Charlson'));
  const hosp = RUTAS.find((r) => r.id === 'hospital').complementarios.map((p) => p.id);
  for (const id of ['news2', 'charlson', 'cirsg', 'lace']) assert.ok(hosp.includes(id), id);
});

test('Charlson: pesos originales, jerarquías y edad aparte; sin porcentajes de mortalidad', () => {
  assert.equal(ch({}).puntaje, 0);
  assert.equal(ch({}).banda.id, 'cero');
  const todos = Object.fromEntries(Object.keys(NO_CH).map((k) => [k, 'Sí']));
  Object.assign(todos, { higado: 'Moderada o grave', diabetes: 'Con daño a órgano blanco', tumor: 'Con metástasis' });
  assert.equal(ch(todos).puntaje, 33, 'máximo: 8 condiciones de 1 punto + 3 + 2 + 2 + 2 + 6 + 2 + 2 + 6');
  assert.equal(porId.charlson.max, 33);
  assert.deepEqual(validarBandasEnteras(porId.charlson.bandas, 0, 33), []);
  assert.equal(ch({ higado: 'Leve' }).puntaje, 1);
  assert.equal(ch({ higado: 'Moderada o grave' }).puntaje, 3);
  assert.equal(ch({ diabetes: 'Sin daño a órgano blanco' }).puntaje, 1);
  assert.equal(ch({ diabetes: 'Con daño a órgano blanco' }).puntaje, 2);
  assert.equal(ch({ tumor: 'Sin metástasis' }).puntaje, 2);
  assert.equal(ch({ tumor: 'Con metástasis' }).puntaje, 6);
  assert.equal(ch({ sida: 'Sí' }).puntaje, 6);
  assert.equal(ch({ iam: 'Sí', demencia: 'Sí' }).banda.id, 'baja');
  assert.equal(ch({ iam: 'Sí', renal: 'Sí' }).banda.id, 'moderada');
  assert.equal(ch({ tumor: 'Con metástasis' }).banda.id, 'alta');
  // Edad: un punto por década después de los 40
  assert.deepEqual([49, 50, 59, 60, 70, 79, 80, 89, 90, 99].map(puntosEdadCharlson), [0, 1, 1, 2, 3, 3, 4, 4, 5, 5]);
  const r = ch({ iam: 'Sí', diabetes: 'Con daño a órgano blanco' }, 84);
  assert.equal(r.puntaje, 3, 'el puntaje principal es el índice original');
  assert.equal(r.extras.combinado, 7);
  assert.match(r.lineas[1], /3 por comorbilidad \+ 4 por edad/);
  // Nada de porcentajes de mortalidad en los resultados ni en las bandas
  const texto = JSON.stringify([r.lineas, porId.charlson.bandas, porId.charlson.descripcion]);
  assert.ok(!/\d+\s?%/.test(texto), 'sin porcentajes');
  // Comparación: si cambia la década, se advierte que el combinado cambió también por la edad
  const a = guardado('charlson', resp('charlson', { edad: 79, ...NO_CH, iam: 'Sí' }));
  const b = guardado('charlson', resp('charlson', { edad: 80, ...NO_CH, iam: 'Sí' }));
  const cmp = clasificarCambio(porId.charlson, a, b);
  assert.equal(cmp.tipo, 'sin_cambio');
  assert.ok(cmp.advertencias.some((x) => /por la edad/.test(x)));
});

test('CIRS-G: 14 sistemas de 0 a 4, puntajes derivados y sin puntos de corte del total', () => {
  const e = porId.cirsg;
  assert.equal(e.campos.length, 14);
  for (const c of e.campos) assert.deepEqual(c.opciones.map((o) => o.valor), [0, 1, 2, 3, 4]);
  const res = calcularEjemplo('cirsg');
  assert.equal(res.puntaje, 15);
  assert.equal(res.extras.afectados, 9);
  assert.equal(res.extras.indice, 1.67);
  assert.equal(res.extras.nivel3, 1);
  assert.equal(res.extras.nivel4, 0);
  assert.equal(res.banda.id, 'grave');
  assert.match(res.lineas[1], /renal/);
  const cero = calc('cirsg', Object.fromEntries(e.campos.map((c) => [c.id, '0 · Sin problema'])));
  assert.equal(cero.puntaje, 0);
  assert.equal(cero.extras.indice, 0);
  assert.equal(cero.banda.id, 'registrada');
  assert.equal(cero.banda.nivel, 'neutro');
  assert.ok(e.notas.some((n) => /no hay puntos de corte validados/i.test(n)));
  assert.match(e.licencia.texto, /no reproduce el manual/);
});

const calcularEjemplo = (id) => calcular(porId[id], EJEMPLOS[id]());

test('NEWS2: tabla del RCP, dos escalas de SpO2 y categorías de riesgo', () => {
  const base = { fr: 16, spo2: 97, escala2: false, oxigeno: false, pas: 120, fc: 70, alerta: true, temp: 37 };
  const pts = (m) => puntosNews2({ ...base, ...m });
  assert.equal(pts({}).total, 0);
  // Frecuencia respiratoria
  assert.deepEqual([8, 9, 11, 12, 20, 21, 24, 25].map((fr) => pts({ fr }).p.fr), [3, 1, 1, 0, 0, 2, 2, 3]);
  // SpO2 escala 1
  assert.deepEqual([91, 92, 93, 94, 95, 96].map((spo2) => pts({ spo2 }).p.spo2), [3, 2, 2, 1, 1, 0]);
  // SpO2 escala 2
  assert.deepEqual([83, 84, 85, 86, 87, 88, 92].map((spo2) => pts({ spo2, escala2: true }).p.spo2), [3, 2, 2, 1, 1, 0, 0]);
  assert.equal(pts({ spo2: 97, escala2: true }).p.spo2, 0, '≥93 con aire ambiente');
  assert.deepEqual([93, 94, 95, 96, 97].map((spo2) => pts({ spo2, escala2: true, oxigeno: true }).p.spo2), [1, 1, 2, 2, 3]);
  // Oxígeno, presión, pulso, conciencia y temperatura
  assert.equal(pts({ oxigeno: true }).p.oxigeno, 2);
  assert.deepEqual([90, 91, 100, 101, 110, 111, 219, 220].map((pas) => pts({ pas }).p.pas), [3, 2, 2, 1, 1, 0, 0, 3]);
  assert.deepEqual([40, 41, 50, 51, 90, 91, 110, 111, 130, 131].map((fc) => pts({ fc }).p.fc), [3, 1, 1, 0, 0, 1, 1, 2, 2, 3]);
  assert.equal(pts({ alerta: false }).p.conciencia, 3);
  assert.deepEqual([35.0, 35.1, 36.0, 36.1, 38.0, 38.1, 39.0, 39.1].map((temp) => pts({ temp }).p.temp), [3, 1, 1, 0, 0, 1, 1, 2]);
  // Categorías
  const n = (m) => calc('news2', { fr: 16, escala_spo2: 'Escala 1', spo2: 97, oxigeno: 'Aire ambiente', pas: 120, fc: 70, conciencia: 'Alerta (A)', temp: 37, ...m });
  assert.equal(n({}).banda.id, 'bajo');
  assert.match(n({}).lineas.at(-1), /cada 12 horas/);
  assert.match(n({}).lineas.at(-1), /protocolo de tu institución/);
  assert.equal(n({ fr: 22 }).banda.id, 'bajo');
  assert.equal(n({ conciencia: 'Confusión nueva (C)' }).banda.id, 'bajomedio');
  assert.equal(n({ fr: 22, fc: 115, temp: 38.5 }).puntaje, 5);
  assert.equal(n({ fr: 22, fc: 115, temp: 38.5 }).banda.id, 'medio');
  const alto = n({ fr: 26, spo2: 92, oxigeno: 'Oxígeno suplementario', conciencia: 'Responde a la voz (V)' });
  assert.equal(alto.puntaje, 10);
  assert.equal(alto.banda.id, 'alto');
  assert.ok(alto.alertas.length && /protocolo/.test(alto.alertas[0]));
  assert.ok(n({ escala_spo2: 'Escala 2', spo2: 90 }).lineas.some((l) => /meta de 88 a 92%/.test(l)));
  // Licencia del RCP y aviso de traducción
  assert.match(porId.news2.licencia.texto, /Reproducido de: Royal College of Physicians/);
  assert.match(porId.news2.licencia.texto, /no ha sido aprobada específicamente por el Royal College of Physicians/);
  // Comparación entre escalas distintas
  const a = guardado('news2', resp('news2', { fr: 16, escala_spo2: 'Escala 1', spo2: 97, oxigeno: 'Aire ambiente', pas: 120, fc: 70, conciencia: 'Alerta (A)', temp: 37 }));
  const b = guardado('news2', resp('news2', { fr: 16, escala_spo2: 'Escala 2', spo2: 90, oxigeno: 'Oxígeno suplementario', pas: 120, fc: 70, conciencia: 'Alerta (A)', temp: 37 }));
  assert.ok(clasificarCambio(porId.news2, a, b).advertencias.some((x) => /escala/.test(x)));
});
