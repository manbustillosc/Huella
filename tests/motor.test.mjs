// Pruebas del motor y de cada escala. Ejecutar con: node --test tests/motor.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { ESCALAS } from '../escalas/index.js';
import { DOMINIOS } from '../js/dominios.js';
import { normalizarEscala, calcular, validarEscala, resumenDe, resumenBreveDe, posicionMarcador, notaValoracion } from '../js/motor.js';

const escalas = ESCALAS.map(normalizarEscala);
const porId = Object.fromEntries(escalas.map((e) => [e.id, e]));

// Elige, en cada reactivo, la opción con el valor indicado.
function responder(escala, elegir) {
  const r = {};
  for (const item of escala.items) {
    const valores = item.opciones.map((o) => o.valor);
    const objetivo = elegir(item, valores);
    r[item.id] = valores.indexOf(objetivo);
  }
  return r;
}
const maximo = (e) => responder(e, (_, v) => Math.max(...v));
const minimo = (e) => responder(e, (_, v) => Math.min(...v));

test('todas las escalas están bien definidas', () => {
  for (const e of ESCALAS) assert.deepEqual(validarEscala(e), [], e.id);
});

test('ids únicos y dominios existentes', () => {
  const ids = new Set();
  for (const e of escalas) {
    assert.ok(!ids.has(e.id), `id repetido ${e.id}`);
    ids.add(e.id);
    assert.ok(DOMINIOS.some((d) => d.id === e.dominio), `${e.id}: dominio ${e.dominio}`);
  }
});

test('mínimo y máximo de cada escala tienen banda y resumen', () => {
  for (const e of escalas) {
    for (const r of [maximo(e), minimo(e)]) {
      const res = calcular(e, r);
      assert.ok(res.completo && res.banda, e.id);
      assert.ok(resumenDe(e, res).length > 5);
      const pos = posicionMarcador(e, res.puntaje);
      assert.ok(pos > 0 && pos < 1, `${e.id} marcador ${pos}`);
    }
  }
});

test('respuestas incompletas no tienen banda', () => {
  const res = calcular(porId.barthel, { comer: 0 });
  assert.equal(res.completo, false);
  assert.equal(res.banda, null);
  assert.equal(res.contestadas, 1);
  assert.equal(res.puntaje, 10);
});

test('Barthel: 85 puntos es dependencia moderada; 100 independiente', () => {
  const e = porId.barthel;
  assert.equal(calcular(e, maximo(e)).banda.etiqueta, 'Independiente');
  const r = maximo(e);
  r.escalones = 2; // dependiente (0) → 90
  r.banarse = 1; // dependiente (0) → 85
  const res = calcular(e, r);
  assert.equal(res.puntaje, 85);
  assert.equal(res.banda.etiqueta, 'Dependencia moderada');
  assert.equal(resumenDe(e, res), 'Barthel: 85/100 (dependencia moderada).');
});

test('Lawton: todo independiente = 8', () => {
  const res = calcular(porId.lawton, maximo(porId.lawton));
  assert.equal(res.puntaje, 8);
  assert.equal(res.banda.nivel, 'bien');
});

test('GDS-15: puntúan las respuestas depresivas', () => {
  const e = porId.gds15;
  // Todas "No": puntúan solo las 5 preguntas invertidas (satisfecho, humor, feliz, vivo, energía)
  const todasNo = Object.fromEntries(e.items.map((i) => [i.id, 1]));
  const res = calcular(e, todasNo);
  assert.equal(res.puntaje, 5);
  assert.equal(res.banda.etiqueta, 'Depresión leve');
  const todasSi = Object.fromEntries(e.items.map((i) => [i.id, 0]));
  assert.equal(calcular(e, todasSi).puntaje, 10);
});

test('4AT: cambio agudo solo = 4 → posible delirium', () => {
  const e = porId['4at'];
  const res = calcular(e, { alerta: 0, amt4: 0, atencion: 0, cambio: 1 });
  assert.equal(res.puntaje, 4);
  assert.equal(res.banda.etiqueta, 'Posible delirium');
  assert.equal(calcular(e, { alerta: 1, amt4: 1, atencion: 0, cambio: 0 }).banda.etiqueta, 'Posible deterioro cognitivo');
});

test('RCRI: creatinina sola = clase II con 6.0 % recalibrado', () => {
  const e = porId.rcri;
  const r = Object.fromEntries(e.items.map((i) => [i.id, 1]));
  r.creatinina = 0;
  const res = calcular(e, r);
  assert.equal(res.puntaje, 1);
  assert.equal(res.banda.etiqueta, 'Clase II · riesgo bajo');
  assert.match(resumenDe(e, res), /6\.0 %/);
  assert.match(resumenDe(e, res), /creatinina/);
});

test('nota de valoración agrupa por dominio en orden', () => {
  const v = {
    paciente: { edad: 82, sexo: 'mujer', escolaridad: 6 },
    resultados: [
      { escalaId: 'gds15', resumen: 'GDS-15: 3/15 (sin datos de depresión).' },
      { escalaId: 'barthel', resumen: 'Barthel: 85/100 (dependencia moderada).' },
    ],
  };
  const nota = notaValoracion(v, porId, DOMINIOS, new Date(2026, 9, 9));
  assert.match(nota, /^VALORACIÓN GERIÁTRICA · 09\/10\/2026/);
  assert.match(nota, /Paciente: mujer, 82 años, escolaridad 6 años\./);
  assert.ok(nota.indexOf('FUNCIONAL') < nota.indexOf('AFECTIVO'));
});

test('sw.js guarda todos los archivos de la app y existen', async () => {
  const { readFileSync, existsSync, readdirSync } = await import('node:fs');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const lista = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  for (const f of lista) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `no existe ${f}`);
  for (const dir of ['js', 'escalas']) {
    for (const f of readdirSync(new URL(`../${dir}/`, import.meta.url))) {
      if (f.endsWith('.js')) assert.ok(lista.includes(`${dir}/${f}`), `sw.js no incluye ${dir}/${f}`);
    }
  }
});

test('nota en párrafo: compacta, sin viñetas ni saltos de línea', () => {
  const rcri = porId.rcri;
  const r = Object.fromEntries(rcri.items.map((i) => [i.id, 1]));
  r.creatinina = 0;
  const resRcri = calcular(rcri, r);
  const v = {
    paciente: { edad: 82, sexo: 'mujer' },
    resultados: [
      { escalaId: 'barthel', puntaje: 90, max: 100, etiqueta: 'Dependencia moderada', resumen: 'Barthel: 90/100 (dependencia moderada).' },
      { escalaId: 'lawton', puntaje: 6, max: 8, etiqueta: 'Dependencia leve', resumen: 'Lawton-Brody: 6/8 (dependencia leve).', breve: resumenBreveDe(porId.lawton, { puntaje: 6, max: 8, banda: { etiqueta: 'Dependencia leve' } }) },
      { escalaId: 'rcri', puntaje: 1, max: 6, etiqueta: resRcri.banda.etiqueta, resumen: resumenDe(rcri, resRcri), breve: resumenBreveDe(rcri, resRcri) },
    ],
  };
  const nota = notaValoracion(v, porId, DOMINIOS, new Date(2026, 9, 10), 'parrafo');
  assert.ok(!nota.includes('\n') && !nota.includes('- '), nota);
  assert.equal(nota,
    'Valoración geriátrica 10/10/2026. Paciente: mujer, 82 años. '
    + 'Funcional: Barthel 90/100 (dependencia moderada); Lawton-Brody 6/8 (dependencia leve). '
    + 'Prequirúrgica: RCRI 1/6 (clase II, riesgo bajo; muerte, infarto o paro cardiaco a 30 días: 6.0 %; factor: creatinina preoperatoria mayor de 2.0 mg/dL).');
  // La lista conserva el formato por renglones
  assert.match(notaValoracion(v, porId, DOMINIOS, new Date(2026, 9, 10), 'lista'), /\nFUNCIONAL\n- Barthel/);
});
