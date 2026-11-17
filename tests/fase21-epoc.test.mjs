// Versión 2.17.0: clasificaciones de la EPOC (grado GOLD, grupo A-B-E, CAAT/CAT, BODE y exacerbación de Roma). Datos ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { porId, calc, guardado, EJEMPLOS } from './ayuda.mjs';
import { RUTAS } from '../js/rutas.js';
import { DOMINIOS } from '../js/dominios.js';
import { resultadosBusqueda } from '../js/vistas/inicio.js';

const MMRC = (g) => porId.bode.campos.find((c) => c.id === 'mmrc').opciones[g].texto;
const grado = (cociente, fev1) => calc('goldgrado', { cociente, fev1 });
const abe = (exacerbaciones, medida, valor) => calc('goldabe', medida === 'cat'
  ? { exacerbaciones, medida: 'CAAT/CAT', cat: valor }
  : { exacerbaciones, medida: 'mMRC', mmrc: MMRC(valor) });
const bode = (fev1, distancia, g, imc) => calc('bode', { fev1, distancia, mmrc: MMRC(g), imc });
const roma = (x) => calc('exaroma', { gaso: 'No', ...x });

test('Grado GOLD: FEV₁ 80 / 50 / 30 % con FEV₁/FVC < 0.70', () => {
  assert.equal(grado(0.6, 85).valor, 1);
  assert.equal(grado(0.6, 80).valor, 1);
  assert.equal(grado(0.6, 79).valor, 2);
  assert.equal(grado(0.55, 50).valor, 2);
  assert.equal(grado(0.5, 49).valor, 3);
  assert.equal(grado(0.5, 30).valor, 3);
  assert.equal(grado(0.4, 29).valor, 4);
  assert.equal(grado(0.4, 29).banda.etiqueta, 'GOLD 4: obstrucción muy grave');
  assert.equal(porId.goldgrado.resumen(grado(0.55, 45)), 'Obstrucción GOLD 3 (grave): FEV₁ 45 % del predicho, FEV₁/FVC 0.55.');
});

test('Grado GOLD: sin obstrucción con 0.70 o más, cociente en % y aviso entre 0.60 y 0.70', () => {
  const r = grado(0.7, 60);
  assert.equal(r.valor, null);
  assert.equal(r.completo, true);
  assert.equal(r.banda.etiqueta, 'Sin obstrucción por el criterio GOLD');
  const pct = calc('goldgrado', { cociente: 62, cociente_u: 'pct', fev1: 70 });
  assert.equal(pct.valor, 2);
  assert.equal(pct.extras.cociente, 0.62);
  assert.ok(pct.lineas.some((l) => /repetir la espirometría/.test(l)));
  assert.ok(!grado(0.5, 70).lineas.some((l) => /repetir/.test(l)));
});

test('Grupo GOLD (2026-2027): una exacerbación moderada ya es grupo E', () => {
  assert.equal(abe(0, 'cat', 9).extras.grupo, 'A');
  assert.equal(abe(0, 'cat', 10).extras.grupo, 'B');
  assert.equal(abe(0, 'mmrc', 1).extras.grupo, 'A');
  assert.equal(abe(0, 'mmrc', 2).extras.grupo, 'B');
  const e = abe(1, 'cat', 5);
  assert.equal(e.extras.grupo, 'E');
  assert.ok(e.lineas.some((l) => /desde GOLD 2026/.test(l)));
  assert.equal(abe(3, 'mmrc', 0).extras.grupo, 'E');
  assert.equal(abe(0, 'cat', 12).mostrar, 'B');
  assert.equal(porId.goldabe.resumen(abe(0, 'cat', 12)), 'Grupo GOLD B: sin exacerbaciones moderadas ni graves en el último año; CAAT/CAT 12, más síntomas.');
  assert.equal(porId.goldabe.resumen(abe(1, 'mmrc', 1)), 'Grupo GOLD E: 1 exacerbación moderada o grave en el último año; mMRC 1, menos síntomas.');
  const malo = calc('goldabe', { exacerbaciones: 1, hospitalizaciones: 2, medida: 'mMRC', mmrc: MMRC(1) });
  assert.equal(malo.completo, false);
  assert.ok(malo.errores.hospitalizaciones);
});

test('Grupo GOLD: usa el CAAT/CAT o la mMRC registrados, con confirmación', () => {
  const vinCat = porId.goldabe.vinculos.find((x) => x.id === 'cat');
  assert.deepEqual(vinCat.aplicar(guardado('cat', EJEMPLOS.cat())), { medida: 0, cat: '18' });
  const vinM = porId.goldabe.vinculos.find((x) => x.id === 'mmrc');
  assert.deepEqual(vinM.aplicar(guardado('mmrc', EJEMPLOS.mmrc())), { medida: 1, mmrc: 2 });
});

test('CAAT/CAT: solo registro, niveles de impacto y umbral de GOLD', () => {
  const e = porId.cat;
  assert.equal(e.registro, true);
  assert.equal(e.campos.length, 1);
  const r = (p) => calc('cat', { puntaje: p });
  assert.equal(r(9).banda.etiqueta, 'Impacto bajo');
  assert.equal(r(9).banda.hallazgo, undefined);
  assert.equal(r(10).banda.etiqueta, 'Impacto medio');
  assert.equal(r(10).banda.hallazgo, true);
  assert.equal(r(20).banda.etiqueta, 'Impacto medio');
  assert.equal(r(21).banda.etiqueta, 'Impacto alto');
  assert.equal(r(31).banda.etiqueta, 'Impacto muy alto');
  assert.match(e.licencia.texto, /GSK/);
  assert.match(e.licencia.texto, /solo registra el total/);
});

test('BODE: puntos de Celli (2004) en cada límite y cuartiles', () => {
  assert.equal(bode(65, 350, 1, 21.1).puntaje, 0);
  assert.equal(bode(64, 349, 2, 21).puntaje, 4);
  assert.equal(bode(50, 250, 2, 25).puntaje, 3);
  assert.equal(bode(49, 249, 3, 25).puntaje, 6);
  assert.equal(bode(36, 150, 3, 25).puntaje, 6);
  assert.equal(bode(35, 149, 4, 18).puntaje, 10);
  assert.equal(bode(70, 400, 0, 25).banda.etiqueta, 'Cuartil 1 del BODE');
  assert.equal(bode(64, 349, 2, 21).banda.etiqueta, 'Cuartil 2 del BODE');
  assert.equal(bode(49, 249, 3, 25).banda.etiqueta, 'Cuartil 3 del BODE');
  assert.equal(bode(35, 149, 4, 18).banda.etiqueta, 'Cuartil 4 del BODE');
  const r = bode(45, 300, 2, 20.5);
  assert.equal(r.puntaje, 5);
  assert.match(r.lineas[0], /B \(IMC 20.5 kg\/m²\): 1 · O \(FEV₁ 45 %\): 2 · D \(mMRC 2\): 1 · E \(300 m\): 1/);
  assert.ok(r.lineas.some((l) => /MNA-SF/.test(l)));
  assert.ok(!JSON.stringify(porId.bode.bandas).match(/supervivencia de \d|%\s*a\s*\d+ años/));
});

test('BODE: toma la distancia y el IMC de la caminata de 6 minutos', () => {
  const c = guardado('caminata6', { ...EJEMPLOS.caminata6(), talla: 160, peso: 64, distancia: 320 });
  const dist = porId.bode.vinculos.find((x) => x.id === 'caminata');
  assert.deepEqual(dist.aplicar(c), { distancia: '320' });
  const imc = porId.bode.vinculos.find((x) => x.id === 'imc');
  assert.equal(imc.disponible(c), true);
  assert.deepEqual(imc.aplicar(c), { imc: '25' });
});

test('Exacerbación (Roma): leve, moderada con 3 de 5, grave con gasometría', () => {
  assert.equal(roma({ eva: 4, fr: 20, fc: 90, spo2: 94 }).banda.etiqueta, 'Exacerbación leve');
  assert.equal(roma({ eva: 5, fr: 24, fc: 90, spo2: 94 }).banda.etiqueta, 'Exacerbación leve');
  const m = roma({ eva: 5, fr: 24, fc: 95, spo2: 94 });
  assert.equal(m.banda.etiqueta, 'Exacerbación moderada');
  assert.equal(m.extras.criterios, 3);
  assert.equal(m.extras.total, 4);
  assert.ok(m.lineas.some((l) => /Sin gasometría/.test(l)));
  // La caída de más de 3 puntos respecto a la SpO₂ habitual cuenta como criterio
  assert.equal(roma({ eva: 6, fr: 25, fc: 80, spo2: 93, spo2basal: 97 }).banda.etiqueta, 'Exacerbación moderada');
  assert.equal(roma({ eva: 6, fr: 25, fc: 80, spo2: 93, spo2basal: 96 }).banda.etiqueta, 'Exacerbación leve');
  // PCR en mg/dL se convierte a mg/L
  assert.equal(roma({ eva: 6, fr: 25, fc: 80, spo2: 95, pcr: 1.2, pcr_u: 'mgdl' }).banda.etiqueta, 'Exacerbación moderada');
  const g = calc('exaroma', { eva: 7, fr: 30, fc: 110, spo2: 86, gaso: 'Sí', pao2: 58, paco2: 62, ph: 7.29 });
  assert.equal(g.banda.etiqueta, 'Exacerbación grave');
  assert.equal(g.extras.acidosis, true);
  assert.ok(g.alertas.some((a) => /ventilación mecánica no invasiva/.test(a)));
  assert.equal(porId.exaroma.resumen(g), 'Exacerbación grave (propuesta de Roma: 4 de 4 criterios; acidosis hipercápnica).');
  const sinGas = calc('exaroma', { eva: 7, fr: 30, fc: 110, spo2: 86, gaso: 'Sí', pao2: 70, paco2: 44, ph: 7.4 });
  assert.equal(sinGas.banda.etiqueta, 'Exacerbación moderada');
});

test('Exacerbación (Roma): gasometría grave con menos de 3 criterios no se llama «leve»', () => {
  const r = calc('exaroma', { eva: 3, fr: 20, fc: 85, spo2: 93, gaso: 'Sí', pao2: 55, paco2: 50, ph: 7.3 });
  assert.equal(r.banda.etiqueta, 'Gasometría grave con menos de 3 criterios');
  assert.equal(r.valor, null);
  assert.equal(r.completo, true);
  assert.ok(r.alertas.length);
});

test('EPOC: referencias, sección, rutas, búsqueda y funcionamiento sin conexión', () => {
  const dois = (id) => porId[id].referencias.map((x) => x.doi).filter(Boolean);
  assert.ok(dois('goldabe').includes('10.1016/j.chest.2026.07.5219'));
  assert.ok(dois('goldabe').includes('10.7189/jogh.16.04205'));
  assert.ok(dois('cat').includes('10.1183/09031936.00102509'));
  assert.ok(dois('bode').includes('10.1056/NEJMoa021322'));
  assert.ok(dois('exaroma').includes('10.1164/rccm.202108-1819PP'));
  for (const id of ['goldgrado', 'goldabe', 'cat', 'bode', 'exaroma']) assert.equal(porId[id].dominio, 'disnea', id);
  assert.equal(DOMINIOS.find((d) => d.id === 'disnea').nombre, 'Disnea y EPOC');
  const en = (id, ruta) => RUTAS.find((r) => r.id === ruta).complementarios.some((p) => p.id === id);
  assert.ok(en('goldgrado', 'completa') && en('goldabe', 'completa'));
  assert.ok(en('exaroma', 'hospital'));
  assert.ok(en('bode', 'paliativa'));
  assert.match(resultadosBusqueda('BODE'), /Índice BODE/);
  assert.match(resultadosBusqueda('espirometría'), /Grado GOLD/);
  assert.match(resultadosBusqueda('CAT'), /CAAT\/CAT/);
  assert.match(resultadosBusqueda('exacerbación'), /Exacerbación de EPOC/);
  assert.match(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), /\.\/escalas\/epoc\.js/);
});
