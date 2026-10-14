// Versión 2.10: TFG estimada con BIS1 y BIS2 (Berlin Initiative Study) y conversión de HbA1c a glucosa promedio.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tfgBis1, tfgBis2, EDAD_BIS } from '../escalas/bis.js';
import {
  eagDeA1c, a1cDeEag, mgdlAMmol, mmolAMgdl, ngspAIfcc, ifccANgsp, gmiDeGlucosaMedia, TABLA_EAG, RANGO_TABLA_ADAG,
} from '../js/unidades.js';
import { textoRenal } from '../js/medicacion.js';
import { HERRAMIENTAS } from '../js/herramientas.js';
import { RUTAS, pasosDe } from '../js/rutas.js';
import { PESTANAS_UNIDADES } from '../js/vistas/unidades.js';
import { resumenDe, textoEscala } from '../js/motor.js';
import { porId, calc, guardado, resp } from './ayuda.mjs';

const cerca = (a, b, tol = 0.05) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

/* ---------- BIS ---------- */

test('BIS1 y BIS2: ecuaciones de Schaeffner (2012) con creatinina en mg/dL y cistatina C en mg/L', () => {
  cerca(tfgBis1(1.0, 80, false), 58.1);
  cerca(tfgBis1(1.0, 80, true), 47.7);
  cerca(tfgBis2(1.2, 1.0, 80, true), 49.1);
  cerca(tfgBis2(1.0, 1.0, 80, false), 767 * 80 ** -0.57, 1e-9);
  assert.ok(tfgBis1(2.0, 80, false) < tfgBis1(1.0, 80, false), 'más creatinina, menor TFG');
  assert.ok(tfgBis2(2.0, 1.0, 80, false) < tfgBis2(1.0, 1.0, 80, false), 'más cistatina C, menor TFG');
  assert.equal(EDAD_BIS, 70);
});

test('BIS: sin cistatina C usa BIS1; con cistatina C la categoría sale de BIS2 y se muestran ambas', () => {
  const sin = calc('bis', { creatinina: 1.0, edad: 80, sexo: 'Mujer' });
  assert.equal(sin.extras.ecuacion, 'BIS1');
  assert.equal(sin.mostrar, '48');
  assert.equal(sin.banda.id, 'G3a');
  assert.equal(sin.extras.bis2, null);
  assert.match(resumenDe(porId.bis, sin), /^TFG estimada \(BIS1\): 48 mL\/min\/1\.73 m², categoría G3a\.$/);
  const con = calc('bis', { creatinina: 1.0, cistatina: 1.2, edad: 80, sexo: 'Mujer' });
  assert.equal(con.extras.ecuacion, 'BIS2');
  assert.equal(con.mostrar, '49');
  assert.equal(con.extras.bis1, 47.7);
  assert.equal(con.extras.bis2, 49.1);
  assert.match(resumenDe(porId.bis, con), /\(BIS2\): 49 .*; BIS1 48 mL\/min\/1\.73 m²/);
  assert.ok(con.lineas.some((l) => /^BIS2 \(creatinina y cistatina C\): 49 mL\/min\/1\.73 m², categoría G3a; BIS1 \(solo creatinina\): 48/.test(l)));
  assert.match(textoEscala(porId.bis, con, 'lista'), /BIS2/);
  // La creatinina en µmol/L se convierte (88.4 µmol/L = 1 mg/dL) y da el mismo resultado.
  const umol = calc('bis', { creatinina: 88.4, creatinina_u: 'umol', edad: 80, sexo: 'Mujer' });
  assert.equal(umol.mostrar, sin.mostrar);
});

test('BIS: aviso en menores de 70 años, cautela con TFG <30 y misma dirección clínica que CKD-EPI', () => {
  const joven = calc('bis', { creatinina: 1.0, edad: 65, sexo: 'Hombre' });
  assert.equal(joven.extras.edadFueraDeRango, true);
  assert.match(joven.alertas[0], /70 años o más; con 65 años usa CKD-EPI 2021/);
  assert.deepEqual(calc('bis', { creatinina: 1.0, edad: 80, sexo: 'Hombre' }).alertas, []);
  const baja = calc('bis', { creatinina: 4.0, edad: 85, sexo: 'Mujer' });
  assert.equal(baja.banda.id, 'G5');
  assert.ok(baja.lineas.some((l) => /menor de 30/.test(l)));
  assert.equal(porId.bis.direccionClinica, 'sin_direccion');
  assert.equal(porId.bis.cambioExtra, porId.ckdepi.cambioExtra);
  assert.deepEqual(porId.bis.bandas.map((b) => b.id), porId.ckdepi.bandas.map((b) => b.id));
  assert.ok(porId.bis.referencias.some((r) => r.doi === '10.7326/0003-4819-157-7-201210020-00003'));
});

test('BIS: reutiliza la creatinina de CKD-EPI o Cockcroft-Gault con su unidad', () => {
  const ck = guardado('ckdepi', resp('ckdepi', { creatinina: 106, creatinina_u: 'umol', edad: 78, sexo: 'Hombre' }));
  const v = porId.bis.vinculos.find((x) => x.escala === 'ckdepi');
  assert.equal(v.disponible(ck), true);
  assert.match(v.describir(ck), /106 µmol\/L/);
  assert.deepEqual(v.aplicar(ck), { creatinina: '106', creatinina_u: 'umol' });
  assert.notEqual(v.disponible({ respuestas: {} }), true);
  assert.ok(porId.bis.vinculos.some((x) => x.escala === 'cockcroft'));
});

test('BIS en rutas y en la revisión de medicamentos', () => {
  const calcR = RUTAS.find((r) => r.id === 'calculadoras');
  assert.deepEqual(pasosDe(calcR).filter((p) => p.grupo === 'Función renal').map((p) => p.id), ['ckdepi', 'bis', 'cockcroft']);
  assert.ok(RUTAS.find((r) => r.id === 'hospital').complementarios.some((p) => p.id === 'bis'));
  assert.equal(textoRenal({ tfg: { valor: 48, fecha: '2026-10-14', fuente: 'bis' } }), 'TFGe 48 mL/min/1.73 m² (BIS, 14/10/2026)');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.ok(sw.includes("'./escalas/bis.js'"));
});

/* ---------- HbA1c y glucosa promedio ---------- */

test('HbA1c → glucosa promedio (ADAG): coincide con la tabla publicada de 5 a 12 %', () => {
  const publicada = { 5: 97, 6: 126, 7: 154, 8: 183, 9: 212, 10: 240, 11: 269, 12: 298 };
  for (const [a1c, mgdl] of Object.entries(publicada)) assert.equal(Math.round(eagDeA1c(Number(a1c))), mgdl, `${a1c} %`);
  assert.equal(mgdlAMmol(eagDeA1c(7)).toFixed(1), '8.6');
  cerca(a1cDeEag(eagDeA1c(7.3)), 7.3, 1e-9);
  cerca(mmolAMgdl(mgdlAMmol(154)), 154, 1e-9);
  assert.deepEqual(TABLA_EAG.map((x) => x.a1c), [5, 6, 7, 8, 9, 10, 11, 12]);
  assert.deepEqual([RANGO_TABLA_ADAG.min, RANGO_TABLA_ADAG.max], [5, 12]);
  assert.equal(eagDeA1c(null), null);
  assert.equal(eagDeA1c(NaN), null);
});

test('HbA1c en % ↔ mmol/mol (ecuación maestra IFCC–NGSP) y GMI del monitor continuo', () => {
  assert.equal(Math.round(ngspAIfcc(6.5)), 48);
  assert.equal(Math.round(ngspAIfcc(7)), 53);
  assert.equal(Math.round(ngspAIfcc(8)), 64);
  cerca(ifccANgsp(ngspAIfcc(6.5)), 6.5, 1e-9);
  assert.equal(gmiDeGlucosaMedia(150).toFixed(1), '6.9');
  assert.equal(gmiDeGlucosaMedia(154).toFixed(1), '7.0');
  assert.equal(gmiDeGlucosaMedia(null), null);
});

test('HbA1c: herramienta propia en Calculadoras con su pestaña en Conversión de unidades', () => {
  const h = HERRAMIENTAS.find((x) => x.id === 'glucemia');
  assert.equal(h.href, '#/unidades/glucemia');
  assert.equal(h.dominio, 'calculadoras');
  for (const a of ['HbA1c', 'hemoglobina glucosilada', 'glucosa promedio', 'GMI']) assert.ok(h.aliases.includes(a), a);
  assert.ok(PESTANAS_UNIDADES.includes('glucemia'));
  assert.ok(RUTAS.find((r) => r.id === 'calculadoras').herramientas.some((x) => x.id === 'glucemia'));
});
