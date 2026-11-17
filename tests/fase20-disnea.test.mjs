// Versión 2.16.0: disnea mMRC y clase funcional NYHA en la nueva sección «Disnea». Datos ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { porId, calc } from './ayuda.mjs';
import { RUTAS } from '../js/rutas.js';
import { DOMINIOS } from '../js/dominios.js';
import { SUGERENCIAS_DOMINIO } from '../js/atencion.js';
import { ICONOS } from '../js/iconos.js';
import { resultadosBusqueda } from '../js/vistas/inicio.js';

const opcion = (id, campo, n) => porId[id].campos.find((c) => c.id === campo).opciones.find((o) => o.valor === n).texto;
const m = (g, otra) => calc('mmrc', { grado: opcion('mmrc', 'grado', g), ...(otra ? { otraCausa: otra } : {}) });
const n = (c, otra) => calc('nyha', { clase: opcion('nyha', 'clase', c), ...(otra ? { otraCausa: otra } : {}) });

test('mMRC: grados 0 a 4 con su equivalencia MRC 1 a 5', () => {
  const e = porId.mmrc;
  assert.deepEqual(e.campos.find((c) => c.id === 'grado').opciones.map((o) => o.valor), [0, 1, 2, 3, 4]);
  assert.equal(e.dominio, 'disnea');
  assert.equal(e.direccionClinica, 'menor_mejor');
  assert.ok(!e.registro);
  for (let g = 0; g <= 4; g++) {
    const r = m(g);
    assert.equal(r.completo, true, `grado ${g} sin el campo opcional`);
    assert.equal(r.puntaje, g);
    assert.equal(r.extras.mrc, g + 1);
    assert.equal(r.sufijo, `/ 4 · MRC ${g + 1}`);
    assert.match(r.lineas[0], new RegExp(`Equivale a MRC ${g + 1}`));
  }
});

test('mMRC: umbral de GOLD (2 o más = más disnea) y sugerencias', () => {
  assert.equal(m(0).banda.hallazgo, false);
  assert.equal(m(1).banda.hallazgo, false);
  assert.match(m(1).banda.texto, /Menos disnea/);
  for (const g of [2, 3, 4]) {
    assert.equal(m(g).banda.hallazgo, true);
    assert.match(m(g).banda.texto, /Más disnea según el umbral de GOLD \(mMRC 2 o más\)/);
    assert.ok(m(g).banda.sugerencias.length >= 2);
  }
  assert.ok(m(4).banda.sugerencias.some((s) => /paliativas/.test(s)));
  assert.equal(m(0).banda.nivel, 'bien');
  assert.equal(m(4).banda.nivel, 'critico');
});

test('mMRC: resumen, otra causa de limitación y siguiente paso', () => {
  const r = m(2, 'No');
  assert.equal(porId.mmrc.resumen(r), 'Disnea mMRC 2 (MRC 3): disnea que limita la marcha en plano.');
  assert.equal(porId.mmrc.resumenBreve(r), 'mMRC 2');
  const o = m(3, 'Sí');
  assert.equal(o.extras.otraCausa, true);
  assert.ok(o.lineas.some((l) => /no reflejar solo la disnea/.test(l)));
  assert.match(porId.mmrc.resumen(o), /Otra causa limita la actividad/);
  const sig = (res) => porId.mmrc.siguientes.filter((x) => x.si(res)).map((x) => x.id);
  assert.deepEqual(sig(m(2)), ['caminata6']);
  assert.deepEqual(sig(m(4)), ['esasr']);
  assert.deepEqual(sig(m(0)), []);
});

test('NYHA: clases I a IV con números romanos', () => {
  const e = porId.nyha;
  assert.deepEqual(e.campos.find((c) => c.id === 'clase').opciones.map((o) => o.texto.split(' · ')[0]), ['I', 'II', 'III', 'IV']);
  assert.equal(e.dominio, 'disnea');
  assert.equal(e.direccionClinica, 'menor_mejor');
  const r = n(3);
  assert.equal(r.completo, true);
  assert.equal(r.valor, 3);
  assert.equal(r.mostrar, 'III');
  assert.equal(r.sufijo, 'NYHA');
  assert.equal(r.banda.etiqueta, 'Clase III: limitación marcada');
  assert.equal(porId.nyha.resumen(r), 'Clase funcional NYHA III (limitación marcada).');
  assert.equal(porId.nyha.resumenBreve(r), 'NYHA III');
  assert.equal(n(1).banda.hallazgo, false);
  assert.match(n(1).banda.texto, /no descarta la cardiopatía/);
  for (const c of [2, 3, 4]) assert.equal(n(c).banda.hallazgo, true);
  assert.ok(n(4).banda.sugerencias.some((s) => /estadio D/.test(s)));
  assert.ok(n(2).banda.sugerencias.some((s) => /rehabilitación cardiaca/.test(s)));
  assert.match(porId.nyha.resumen(n(2, 'Sí')), /Otra causa limita la actividad/);
});

test('Disnea: referencias verificadas y licencias', () => {
  const dois = (id) => porId[id].referencias.map((r) => r.doi).filter(Boolean);
  for (const d of ['10.1136/bmj.2.5147.257', '10.1378/chest.93.3.580', '10.1136/thx.54.7.581', '10.1056/NEJMoa021322', '10.3109/15412555.2012.701678']) {
    assert.ok(dois('mmrc').includes(d), d);
  }
  for (const d of ['10.1161/CIR.0000000000001063', '10.1136/hrt.2006.089656']) assert.ok(dois('nyha').includes(d), d);
  assert.match(porId.mmrc.licencia.texto, /Used with the permission of the Medical Research Council\./);
  assert.match(porId.mmrc.licencia.texto, /no es una traducción oficial/);
  assert.match(porId.mmrc.licencia.enlace, /ukri\.org/);
  assert.match(porId.nyha.licencia.texto, /© 1994 American Heart Association/);
  assert.match(porId.nyha.licencia.texto, /redacción propia/);
});

test('Disnea: sección propia, rutas, búsqueda, plan y funcionamiento sin conexión', () => {
  const d = DOMINIOS.find((x) => x.id === 'disnea');
  assert.ok(d, 'existe la sección Disnea');
  for (const x of d.relacionadas) assert.ok(porId[x], x);
  assert.ok(ICONOS.disnea);
  assert.ok(SUGERENCIAS_DOMINIO.disnea.length);
  const enRuta = (id, ruta) => RUTAS.find((r) => r.id === ruta).complementarios.some((p) => p.id === id);
  assert.ok(enRuta('mmrc', 'completa') && enRuta('nyha', 'completa'));
  assert.ok(enRuta('mmrc', 'paliativa') && enRuta('nyha', 'paliativa'));
  assert.ok(enRuta('nyha', 'preqx') && enRuta('nyha', 'hospital'));
  assert.match(resultadosBusqueda('mMRC'), /Disnea mMRC/);
  assert.match(resultadosBusqueda('NYHA'), /Clase funcional NYHA/);
  assert.match(resultadosBusqueda('falta de aire'), /Disnea mMRC/);
  assert.match(resultadosBusqueda('insuficiencia cardiaca'), /Clase funcional NYHA/);
  assert.match(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), /\.\/escalas\/disnea\.js/);
});
