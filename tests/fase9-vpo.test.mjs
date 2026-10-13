// Versión 2.9: diagramas de flujo de la VPO (lineamiento IMSS 2026) y riesgo del procedimiento (ESC 2022).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DIAGRAMAS, LISTA_VPO, escalasMencionadas } from '../js/vpo.js';
import { HERRAMIENTAS } from '../js/herramientas.js';
import { RUTAS } from '../js/rutas.js';
import { porId, calc, EJEMPLOS } from './ayuda.mjs';

test('VPO: seis diagramas bien formados que solo enlazan instrumentos existentes', () => {
  assert.deepEqual(DIAGRAMAS.map((d) => d.id), ['general', 'cardio', 'ecg', 'estudios', 'dispositivos', 'despues']);
  const tipos = new Set(['inicio', 'paso', 'decision', 'alerta', 'fin']);
  const revisar = (nodos, ruta) => nodos.forEach((n, i) => {
    assert.ok(tipos.has(n.tipo), `${ruta}.${i}: tipo ${n.tipo}`);
    assert.ok(n.texto?.length > 5, `${ruta}.${i}: texto`);
    if (n.tipo === 'decision') {
      assert.ok(n.ramas.length >= 2, `${ruta}.${i}: al menos dos ramas`);
      n.ramas.forEach((r, j) => { assert.ok(r.etiqueta && r.nodos.length, `${ruta}.${i}.${j}`); revisar(r.nodos, `${ruta}.${i}.${j}`); });
    }
  });
  DIAGRAMAS.forEach((d) => revisar(d.nodos, d.id));
  for (const id of escalasMencionadas()) assert.ok(porId[id], `${id} existe en Huella`);
  assert.ok(LISTA_VPO.length >= 8);
});

test('VPO: el algoritmo general sigue al lineamiento (ASA × riesgo del procedimiento)', () => {
  const g = DIAGRAMAS.find((d) => d.id === 'general');
  const asa = g.nodos.find((n) => n.tipo === 'decision');
  assert.deepEqual(asa.ramas.map((r) => r.etiqueta), ['ASA I o II', 'ASA III', 'ASA IV', 'ASA V', 'ASA VI']);
  assert.match(asa.ramas[0].nodos[0].texto, /riesgo alto/);
  assert.match(asa.ramas[1].nodos[0].texto, /intermedio o alto/);
  assert.match(asa.ramas[3].nodos[0].texto, /Urgencia quirúrgica: no requiere VPO/);
  assert.ok(g.nodos.some((n) => /fragilidad/.test(n.texto) && n.escalas.includes('cfs')), 'fragilidad y síndromes geriátricos piden VPO');
  const ecg = DIAGRAMAS.find((d) => d.id === 'ecg');
  assert.ok(JSON.stringify(ecg).includes('Mobitz II'));
  const disp = JSON.stringify(DIAGRAMAS.find((d) => d.id === 'dispositivos'));
  assert.ok(disp.includes('30 cm') && disp.includes('40 %') && disp.includes('5 segundos'));
});

test('Riesgo del procedimiento (ESC 2022): tres categorías con sus consecuencias', () => {
  const e = porId.riesgoqx;
  assert.equal(e.dominio, 'prequirurgica');
  assert.deepEqual(e.campos[0].opciones.map((o) => o.valor), [1, 2, 3]);
  assert.match(e.campos[0].opciones[2].detalle, /Esofagectomía/);
  assert.match(e.campos[0].opciones[0].detalle, /Endocrina \(tiroides\)/);
  assert.equal(calc('riesgoqx', { categoria: 'Riesgo bajo (<1 %)' }).banda.hallazgo, undefined);
  const alto = calc('riesgoqx', { categoria: 'Riesgo alto (>5 %)' });
  assert.equal(alto.banda.etiqueta, 'Cirugía de riesgo alto');
  assert.ok(alto.banda.sugerencias.some((s) => /ECG/.test(s)));
  assert.equal(calc('riesgoqx', EJEMPLOS.riesgoqx()).mostrar, 'Intermedio');
});

test('integración: diagramas destacados en la valoración prequirúrgica y archivos en la caché', () => {
  const preqx = RUTAS.find((r) => r.id === 'preqx');
  assert.equal(preqx.destacada.id, 'vpo');
  assert.ok(preqx.complementarios.some((p) => p.id === 'riesgoqx'));
  assert.ok(preqx.complementarios.some((p) => p.id === 'stopbang'));
  assert.equal(HERRAMIENTAS.find((h) => h.id === 'vpo').dominio, 'prequirurgica');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  for (const f of ['./js/vpo.js', './js/vistas/vpo.js', './escalas/riesgoqx.js']) assert.ok(sw.includes(`'${f}'`), f);
});
