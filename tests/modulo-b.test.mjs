// Fase 2, módulo B: fragilidad, caídas y riesgo social (fenotipo de Fried, Tinetti POMA-28 y Gijón).
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMINIOS } from '../js/dominios.js';
import { RUTAS, pasosDe } from '../js/rutas.js';
import { calcular, resumenDe } from '../js/motor.js';
import { clasificarCambio } from '../js/comparacion.js';
import { notaValoracion } from '../js/nota.js';
import { corteFuerza, corteMarcha } from '../escalas/fried.js';
import { porId, resp, calc, guardado, EJEMPLOS } from './ayuda.mjs';

const fecha = new Date(2026, 9, 10);

/* ---------- Fenotipo de Fried ---------- */

test('Fried: puntos de corte de fuerza por sexo e IMC y de marcha por sexo y talla (CHS, 2001)', () => {
  const f = (mujer, imc) => corteFuerza(mujer, imc).corte;
  assert.deepEqual([24, 24.05, 26, 26.1, 28, 28.1].map((x) => f(false, x)), [29, 30, 30, 30, 30, 32]);
  assert.deepEqual([23, 23.1, 26, 26.1, 29, 29.1].map((x) => f(true, x)), [17, 17.3, 17.3, 18, 18, 21]);
  assert.deepEqual([[false, 173], [false, 174], [true, 159], [true, 160]].map(([m, t]) => corteMarcha(m, t).corte), [7, 6, 7, 6]);
});

const base = {
  sexo: 'Hombre', peso: 'No', esfuerzo: 'Rara vez o nunca (menos de 1 día)', arrancar: 'Rara vez o nunca (menos de 1 día)',
  fuerza_estado: 'Medida con dinamómetro', fuerza: 35, peso_kg: 70, talla: 170, marcha_estado: 'Medida en 4.57 m', tiempo: 5, actividad: 'No bajo',
};
const fr = (cambios) => calc('fried', { ...base, ...cambios });

test('Fried: 0 robusto, 1–2 prefrágil, 3 o más frágil; límites exactos de fuerza y marcha', () => {
  assert.equal(fr({}).banda.id, 'robusto');
  // Hombre, IMC 24.2 → corte 30 kg: 30 es debilidad, 30.1 no.
  assert.equal(fr({ fuerza: 30 }).extras.componentes.debilidad, true);
  assert.equal(fr({ fuerza: 30.1 }).extras.componentes.debilidad, false);
  // Talla 170 → corte 7 s: 7 es lentitud, 6.99 no.
  assert.equal(fr({ tiempo: 7 }).extras.componentes.lentitud, true);
  assert.equal(fr({ tiempo: 6.99 }).extras.componentes.lentitud, false);
  assert.equal(fr({ fuerza: 30, tiempo: 7 }).banda.id, 'prefragil');
  const fragil = fr({ fuerza: 30, tiempo: 7, peso: 'Sí: más de 4.5 kg o 5 % o más' });
  assert.equal(fragil.banda.id, 'fragil');
  assert.equal(fragil.puntaje, 3);
  assert.match(resumenDe(porId.fried, fragil), /frágil, 3 de 5 componentes \(pérdida de peso, debilidad, lentitud\)/);
  assert.equal(fr({ esfuerzo: 'Una cantidad moderada de tiempo (3 a 4 días)' }).extras.componentes.agotamiento, true, 'agotamiento con 3 o más días');
  assert.equal(fr({ esfuerzo: 'Algunas veces (1 a 2 días)', arrancar: 'Algunas veces (1 a 2 días)' }).extras.componentes.agotamiento, false);
});

test('Fried: con componentes sin dato solo clasifica si el resultado no puede cambiar', () => {
  const sinFuerza = { fuerza_estado: 'No medida', actividad: 'No medido' };
  const ind = fr(sinFuerza);
  assert.equal(ind.banda.id, 'incompleto', '0 presentes y 2 sin dato: robusto o prefrágil');
  assert.equal(ind.puntaje, null);
  assert.ok(ind.lineas.some((l) => /podría ir de «robusto» a «prefrágil»/.test(l)));
  assert.equal(fr({ ...sinFuerza, tiempo: 8 }).banda.id, 'incompleto', '1 presente y 2 sin dato: prefrágil o frágil');
  assert.equal(fr({ actividad: 'No medido', tiempo: 8 }).banda.id, 'prefragil', '1 presente y 1 sin dato: siempre prefrágil');
  const tres = fr({ ...sinFuerza, tiempo: 8, peso: 'Sí: más de 4.5 kg o 5 % o más', esfuerzo: 'La mayor parte del tiempo (5 a 7 días)' });
  assert.equal(tres.banda.id, 'fragil', '3 presentes: frágil aunque falten datos');
  assert.ok(tres.lineas.some((l) => /no cambia/.test(l)));
  assert.equal(fr({ esfuerzo: 'No se pudo preguntar' }).extras.componentes.agotamiento, null, 'agotamiento con una pregunta sin respuesta y otra negativa');
  assert.equal(fr({ esfuerzo: 'No se pudo preguntar', arrancar: 'La mayor parte del tiempo (5 a 7 días)' }).extras.componentes.agotamiento, true);
  assert.ok(!fr({ fuerza_estado: 'No medida', marcha_estado: 'No medida', fuerza: 10, tiempo: 20 }).desglose.some((d) => ['fuerza', 'tiempo', 'talla', 'peso_kg'].includes(d.campo.id)), 'mediciones ocultas no se usan');
  const a = guardado('fried', resp('fried', { ...base, ...sinFuerza }));
  const b = guardado('fried', resp('fried', base));
  assert.equal(clasificarCambio(porId.fried, a, b).tipo, 'no_interpretable');
});

/* ---------- Tinetti ---------- */

test('Tinetti POMA-28: subescalas 16 + 12; puntos de corte 19 y 25; condiciones de aplicación', () => {
  const t = (equilibrio, marcha, ayuda = 'No') => calc('tinetti', { equilibrio, marcha, ayuda });
  assert.equal(t(10, 8).puntaje, 18);
  assert.equal(t(10, 8).banda.etiqueta, 'Riesgo alto de caídas');
  assert.equal(t(11, 8).banda.etiqueta, 'Riesgo de caídas');
  assert.equal(t(14, 10).banda.etiqueta, 'Riesgo de caídas');
  assert.equal(t(14, 11).banda.etiqueta, 'Por encima de los puntos de corte de riesgo');
  assert.equal(t(16, 12).puntaje, 28);
  assert.ok(!t(17, 12).completo, 'equilibrio máximo 16');
  assert.ok(!t(16, 13).completo, 'marcha máximo 12');
  assert.equal(porId.tinetti.registro, true);
  const c = clasificarCambio(porId.tinetti, guardado('tinetti', resp('tinetti', { equilibrio: 14, marcha: 10, ayuda: 'No' })), guardado('tinetti', resp('tinetti', { equilibrio: 10, marcha: 10, ayuda: 'Sí' })));
  assert.equal(c.tipo, 'empeoramiento');
  assert.ok(c.advertencias.some((a) => /auxiliar de la marcha/.test(a)));
  assert.ok(c.advertencias.some((a) => /Equilibrio de 14 a 10; marcha de 10 a 10/.test(a)));
  assert.ok(porId.tinetti.notas.some((n) => /no se combinan/.test(n)), 'no se mezclan versiones');
});

/* ---------- Gijón ---------- */

const gij = (valores) => {
  const ids = ['familiar', 'economica', 'vivienda', 'relaciones', 'apoyo'];
  return calcular(porId.gijon, Object.fromEntries(ids.map((id, i) => [id, valores[i] - 1])));
};

test('Gijón (INGER): 5 a 25 puntos; cortes 10 y 17 del anexo; áreas alteradas y Trabajo Social', () => {
  assert.equal(gij([1, 1, 1, 1, 1]).puntaje, 5);
  assert.equal(gij([2, 2, 2, 2, 1]).banda.etiqueta, 'Riesgo social bajo');
  assert.equal(gij([2, 2, 2, 2, 2]).banda.etiqueta, 'Riesgo social intermedio');
  assert.equal(gij([4, 3, 3, 3, 3]).banda.etiqueta, 'Riesgo social intermedio');
  assert.equal(gij([4, 4, 3, 3, 3]).banda.etiqueta, 'Riesgo social elevado (problema social)');
  assert.equal(gij([5, 5, 5, 5, 5]).puntaje, 25);
  const r = gij([5, 2, 3, 1, 3]);
  assert.deepEqual(r.extras.alteradas, ['familiar', 'vivienda', 'apoyo']);
  assert.ok(r.banda.sugerencias.includes('Referir a Trabajo Social.'));
  assert.ok(r.banda.sugerencias.some((s) => /Vive solo/.test(s)) && r.banda.sugerencias.some((s) => /adaptaciones del hogar/.test(s)));
  assert.equal(gij([1, 1, 1, 1, 1]).banda.sugerencias.length, 0);
  assert.ok(porId.gijon.notas[0].includes('Huella usa los del anexo'), 'se documenta la inconsistencia de la guía');
  const c = clasificarCambio(porId.gijon, guardado('gijon', { familiar: 1, economica: 1, vivienda: 0, relaciones: 0, apoyo: 0 }), guardado('gijon', { familiar: 4, economica: 1, vivienda: 0, relaciones: 3, apoyo: 2 }));
  assert.equal(c.tipo, 'empeoramiento');
  assert.match(c.advertencias.join(' '), /situación familiar 2 → 5; relaciones sociales 1 → 4; apoyo de la red social 1 → 3/);
});

/* ---------- Integración ---------- */

test('módulo B: rutas, dominios y nota completa', () => {
  const ruta = (id) => RUTAS.find((r) => r.id === id);
  const comp = (id) => pasosDe(ruta(id)).filter((p) => p.complementario).map((p) => p.id);
  for (const id of ['fried', 'tinetti', 'gijon']) assert.ok(comp('completa').includes(id), `completa: ${id}`);
  for (const id of ['fried', 'tinetti']) assert.ok(comp('fragilidad').includes(id), `fragilidad: ${id}`);
  const planes = [...RUTAS.flatMap((r) => r.planes || []), ...DOMINIOS.flatMap((d) => d.planeadas)].join(' | ');
  assert.ok(!/Fried|Tinetti|Gijón/.test(planes), planes);
  const val = { resultados: ['fried', 'tinetti', 'gijon'].map((id) => guardado(id, EJEMPLOS[id](), { fecha: '2026-10-10' })) };
  const nota = notaValoracion(val, porId, DOMINIOS, fecha, 'completa');
  assert.match(nota, /- Fried: 1\/5\./);
  assert.match(nota, /- Tinetti: 21\/28\./);
  assert.match(nota, /- Gijón: 7\/25\./);
  assert.match(nota, /4\. HALLAZGOS[\s\S]*Fried: 1\/5 \(prefrágil\)[\s\S]*Tinetti: 21\/28 \(riesgo de caídas\)/);
});
