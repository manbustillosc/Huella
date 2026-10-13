// Versión 2.8: calculadora de infusiones (tabla del HG30 revisada) y conversión de unidades.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FARMACOS, concentracion, velocidadMlH, dosisDesdeVelocidad, bolo, pasosTitulacion, leerUnidadDosis, textoConcentracion,
} from '../js/infusiones.js';
import {
  convertirLineal, cAF, fAC, contenidoSal, convertirIon, ANALITOS, convertirVelocidad, mlhAGotas, gotasAMlh, proporcionAMgMl, fmtConv,
} from '../js/unidades.js';
import { HERRAMIENTAS } from '../js/herramientas.js';
import { RUTAS } from '../js/rutas.js';
import { readFileSync } from 'node:fs';

const cerca = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
const prep = (id) => { const f = FARMACOS.find((x) => x.id === id); return concentracion(f.preparacion.cantidad, f.preparacion.unidad, f.preparacion.volumen); };

test('infusiones: dosis ↔ velocidad, ida y vuelta, con y sin peso', () => {
  const ne = prep('norepinefrina');
  assert.deepEqual(ne, { valor: 80, base: 'mcg' });
  cerca(velocidadMlH(0.1, 'mcg/kg/min', 70, ne), 5.25);
  cerca(dosisDesdeVelocidad(5.25, 'mcg/kg/min', 70, ne), 0.1);
  cerca(velocidadMlH(10, 'mcg/min', null, ne), 7.5);
  assert.equal(velocidadMlH(0.1, 'mcg/kg/min', null, ne), null, 'sin peso no calcula dosis por kg');
  assert.equal(velocidadMlH(1, 'UI/min', 70, ne), null, 'unidades incompatibles (masa frente a UI)');
  const vaso = prep('vasopresina');
  cerca(velocidadMlH(0.03, 'UI/min', null, vaso), 4.5);
  cerca(velocidadMlH(2, 'mUI/kg/min', 50, vaso), 15);
  cerca(velocidadMlH(0.03, 'mg/kg/h', 50, prep('midazolam')), 5);
  assert.deepEqual(leerUnidadDosis('mcg/kg/min'), { cantidad: 'mcg', porKg: true, tiempo: 'min', base: 'mcg', factor: 1 });
  assert.equal(textoConcentracion(prep('propofol')), '10 mg/mL (10000 mcg/mL)');
});

test('infusiones: los rangos de la tabla que coinciden y las discrepancias que Huella señala', () => {
  const v = (id, w, d) => velocidadMlH(d, FARMACOS.find((x) => x.id === id).infusion.unidad, w, prep(id));
  // Coinciden con lo impreso
  cerca(v('dexmedetomidina', 50, 0.2), 2.5); cerca(v('dexmedetomidina', 100, 1.5), 37.5);
  cerca(v('vecuronio', 50, 0.8), 6); cerca(v('vecuronio', 100, 1.2), 18);
  cerca(v('dobutamina', 50, 2), 2.4); cerca(v('dobutamina', 100, 10), 24);
  cerca(v('rocuronio', 50, 3), 4.5); cerca(v('rocuronio', 50, 8), 12);
  cerca(v('adrenalina', 50, 1), 75); cerca(v('adrenalina', 100, 0.05), 7.5);
  // Discrepancias documentadas
  cerca(v('propofol', 50, 80), 24); // la tabla dice 48
  cerca(v('midazolam', 50, 0.1), 16.6667, 1e-4); // la tabla dice 5
  cerca(v('rocuronio', 100, 3), 9); // la tabla dice 12
  for (const id of ['propofol', 'midazolam', 'rocuronio', 'adrenalina', 'vasopresina']) assert.ok(FARMACOS.find((x) => x.id === id).revision, `${id}: revisión`);
});

test('infusiones: bolos, presentaciones y cobertura de la tabla', () => {
  const f = FARMACOS.find((x) => x.id === 'rocuronio');
  const pres = concentracion(f.presentacion.cantidad, f.presentacion.unidad, f.presentacion.volumen);
  assert.deepEqual(bolo(1.2, 'mg', 100, pres), { total: 120, unidad: 'mg', ml: 12 });
  assert.equal(FARMACOS.length, 12);
  for (const x of FARMACOS) {
    assert.ok(x.efectos && x.consideraciones, x.id);
    if (x.infusion) assert.ok(x.preparacion && x.infusion.max > x.infusion.min, `${x.id}: infusión con preparación y rango`);
    if (!x.infusion) assert.ok(x.infusionNota || x.boloNota, `${x.id}: explica por qué no hay infusión`);
  }
  assert.deepEqual(pasosTitulacion(0.01, 2).slice(0, 5), [0.01, 0.015, 0.02, 0.03, 0.05]);
  assert.deepEqual(pasosTitulacion(5, 80), [5, 10, 20, 30, 40, 50, 60, 70, 80]);
});

test('unidades: masa, temperatura, goteo, proporciones y velocidad de dosis', () => {
  const m = convertirLineal('masa', 1, 'g');
  assert.equal(m.find((r) => r.unidad.id === 'mg').valor, 1000);
  cerca(m.find((r) => r.unidad.id === 'mcg').valor, 1e6);
  cerca(convertirLineal('concentracion', 0.9, 'porcentaje').find((r) => r.unidad.id === 'mg/mL').valor, 9);
  cerca(convertirLineal('presion', 10, 'cmH2O').find((r) => r.unidad.id === 'mmHg').valor, 7.35559);
  cerca(cAF(37), 98.6); cerca(fAC(212), 100);
  cerca(mlhAGotas(120, 20), 40); cerca(gotasAMlh(40, 20), 120); cerca(mlhAGotas(60, 60), 60);
  assert.equal(proporcionAMgMl(1000), 1); assert.equal(proporcionAMgMl(200000), 0.005);
  const vel = convertirVelocidad(0.1, 'mcg/kg/min', 70);
  cerca(vel.find((r) => r.unidad === 'mcg/min').valor, 7);
  cerca(vel.find((r) => r.unidad === 'mg/h').valor, 0.42);
  assert.ok(convertirVelocidad(0.1, 'mcg/kg/min').every((r) => r.unidad.includes('/kg/')), 'sin peso solo convierte entre unidades por kg');
  assert.equal(fmtConv(101.3), '101.3'); assert.equal(fmtConv(0.000001), '0.000001');
});

test('unidades: electrolitos y laboratorio con masas molares', () => {
  cerca(contenidoSal('KCl').mEq, 13.4138, 1e-4);
  cerca(contenidoSal('NaCl').mEq, 17.1116, 1e-4);
  cerca(contenidoSal('NaHCO3').mEq, 11.9038, 1e-4);
  cerca(contenidoSal('gluconatoCa').mEq, 4.6472, 1e-4);
  cerca(contenidoSal('gluconatoCa').mgIon, 93.125, 1e-3);
  cerca(contenidoSal('CaCl2').mgIon, 272.62, 1e-3);
  cerca(contenidoSal('MgSO4').mEq, 8.1146, 1e-4);
  const ca = convertirIon('Ca', 2, 'mEq');
  cerca(ca.mmol, 1); cerca(ca.mg, 40.078);
  const a = (id) => ANALITOS.find((x) => x.id === id).factor;
  cerca(100 * a('glucosa'), 5.5506, 1e-4);
  cerca(1 * a('creatinina'), 88.42);
  cerca(10 * a('calcio'), 2.495, 1e-3);
});

test('integración: herramientas en Calculadoras y en la valoración hospitalaria, y en la caché', () => {
  assert.equal(HERRAMIENTAS[0].id, 'medicacion');
  for (const id of ['infusiones', 'unidades']) {
    const h = HERRAMIENTAS.find((x) => x.id === id);
    assert.equal(h.dominio, 'calculadoras');
    assert.ok(RUTAS.find((r) => r.id === 'calculadoras').herramientas.some((x) => x.id === id), id);
  }
  assert.ok(RUTAS.find((r) => r.id === 'hospital').herramientas.some((x) => x.id === 'infusiones'));
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  for (const f of ['./js/infusiones.js', './js/unidades.js', './js/vistas/infusiones.js', './js/vistas/unidades.js']) assert.ok(sw.includes(`'${f}'`), f);
});
