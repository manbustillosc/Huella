// Versión 2.15.0: escala de coma de Glasgow y botón a la calculadora oficial del CDR. Datos ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { porId, resp, calc } from './ayuda.mjs';
import { RUTAS } from '../js/rutas.js';
import { resultadosBusqueda } from '../js/vistas/inicio.js';
import { readFileSync } from 'node:fs';

const g = (ocular, verbal, motora, pupilas = 'No evaluadas') => calc('glasgow', { ocular, verbal, motora, pupilas });

test('Glasgow: componentes con los puntajes de Teasdale (E 1–4, V 1–5, M 1–6)', () => {
  const e = porId.glasgow;
  const valores = (id) => e.campos.find((c) => c.id === id).opciones.filter((o) => o.valor != null).map((o) => o.valor);
  assert.deepEqual(valores('ocular'), [4, 3, 2, 1]);
  assert.deepEqual(valores('verbal'), [5, 4, 3, 2, 1]);
  assert.deepEqual(valores('motora'), [6, 5, 4, 3, 2, 1]);
  for (const id of ['ocular', 'verbal', 'motora']) {
    assert.ok(e.campos.find((c) => c.id === id).opciones.some((o) => o.texto === 'No valorable'), `${id} admite «No valorable»`);
  }
  assert.equal(e.dominio, 'delirium');
  assert.ok(!e.registro);
});

test('Glasgow: total, componentes y gravedad', () => {
  const r = g('Al sonido', 'Confusa', 'Obedece órdenes');
  assert.equal(r.valor, 13);
  assert.equal(r.extras.componentes, 'E3 V4 M6');
  assert.equal(r.banda.etiqueta, 'Alteración leve');
  assert.equal(g('Espontánea', 'Orientada', 'Obedece órdenes').banda.etiqueta, 'Conciencia normal');
  assert.equal(g('A la presión', 'Palabras', 'Localiza').valor, 10);
  assert.equal(g('A la presión', 'Palabras', 'Localiza').banda.etiqueta, 'Alteración moderada');
  assert.equal(g('A la presión', 'Sonidos', 'Flexión normal').valor, 8);
  assert.equal(g('A la presión', 'Sonidos', 'Flexión normal').banda.etiqueta, 'Alteración grave (coma)');
  assert.equal(g('Ninguna', 'Ninguna', 'Ninguna').valor, 3);
  assert.equal(porId.glasgow.resumen(r), 'Glasgow 13/15 (E3 V4 M6; alteración leve).');
  assert.equal(porId.glasgow.resumenBreve(r), 'Glasgow 13 (E3 V4 M6)');
});

test('Glasgow: un componente no valorable impide calcular el total', () => {
  const r = g('Al sonido', 'No valorable', 'Localiza');
  assert.equal(r.valor, null);
  assert.equal(r.extras.componentes, 'E3 VNT M5');
  assert.equal(r.banda.etiqueta, 'Total no calculable');
  assert.ok(r.lineas.some((l) => /No valorable: respuesta verbal/.test(l)));
  assert.equal(porId.glasgow.resumen(r), 'Glasgow E3 VNT M5: total no calculable (componente no valorable).');
});

test('Glasgow: GCS-Pupilas resta las pupilas que no reaccionan (Brennan 2018)', () => {
  const r = g('Ninguna', 'Ninguna', 'Extensión', 'Ninguna reacciona');
  assert.equal(r.valor, 4);
  assert.equal(r.extras.gcsp, 2);
  assert.match(r.lineas.join(' '), /GCS-Pupilas: 2 \(4 menos 2: ninguna pupila reacciona\)/);
  assert.match(g('Espontánea', 'Orientada', 'Obedece órdenes', 'Ambas reaccionan a la luz').lineas.join(' '), /GCS-Pupilas: 15 \(ambas pupilas reaccionan\)/);
  assert.match(g('Espontánea', 'Orientada', 'Obedece órdenes', 'Una no reacciona').lineas.join(' '), /GCS-Pupilas: 14 \(15 menos 1: una pupila no reacciona\)/);
  assert.equal(g('Espontánea', 'Orientada', 'Obedece órdenes', 'Ambas reaccionan a la luz').extras.gcsp, 15);
  assert.equal(g('Espontánea', 'Orientada', 'Obedece órdenes').extras.gcsp, null);
  assert.match(porId.glasgow.resumen(r), /GCS-Pupilas 2/);
});

test('Glasgow: referencias verificadas, licencia y lugar en la app', () => {
  const dois = porId.glasgow.referencias.map((r) => r.doi);
  for (const d of ['10.1016/s0140-6736(74)91639-0', '10.1016/S1474-4422(14)70120-6', '10.3171/2017.12.JNS172780', '10.1136/emermed-2015-205180']) assert.ok(dois.includes(d), d);
  assert.match(porId.glasgow.licencia.texto, /Universidad de Glasgow/);
  assert.ok(RUTAS.some((r) => [...r.pasos, ...(r.complementarios || [])].some((p) => p.id === 'glasgow')));
  assert.match(resultadosBusqueda('glasgow'), /Glasgow \(GCS\)/);
  assert.match(resultadosBusqueda('nivel de conciencia'), /Glasgow \(GCS\)/);
  assert.match(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), /\.\/escalas\/glasgow\.js/);
});

test('CDR: botón a la calculadora oficial, sin reproducir la tabla ni el algoritmo', () => {
  const e = porId.cdr;
  assert.equal(e.registro, true);
  assert.equal(e.herramientaOficial.enlace, 'https://www.naccdata.org/calculators/');
  assert.match(e.herramientaOficial.texto, /calculadora oficial del CDR/);
  assert.match(e.herramientaOficial.nota, /no envía ningún dato/);
  const js = readFileSync(new URL('../js/vistas/escala.js', import.meta.url), 'utf8');
  assert.match(js, /rel="noopener noreferrer"/);
  // El CDR global se sigue eligiendo a mano
  const r = calc('cdr', { global: '1 · Demencia leve', casillas: 'No' });
  assert.equal(r.valor, 1);
});
