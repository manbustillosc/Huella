// Fase 3.1, prioridad 2: comparaciones clínicas inválidas bloqueadas (DXA, FRAX), TFG sin dirección automática
// y criterio de demencia de Charlson.
import test from 'node:test';
import assert from 'node:assert/strict';
import { clasificarCambio } from '../js/comparacion.js';
import { notaValoracion, hallazgosYSugerencias } from '../js/nota.js';
import { DOMINIOS } from '../js/dominios.js';
import { porId, resp, guardado, calc } from './ayuda.mjs';

const dxaT = (t, extra = {}, fecha = '2025-10-01') => guardado('dxa', resp('dxa', { sexo: 'Mujer', edad: 72, menopausia: 'Sí', t_columna: t, fractura: 'No', dmo_sitio: 'No registrar', ...extra }), { fecha });
const dxaZ = (z, fecha = '2026-10-01') => guardado('dxa', resp('dxa', { sexo: 'Hombre', edad: 45, z_min: z, fractura: 'No', dmo_sitio: 'No registrar' }), { fecha });
const frax = (mayor, extra = {}, fecha = '2025-10-01') => guardado('frax', resp('frax', { modelo: 'México', mayor, cadera: 2, dmo: 'Con DMO del cuello femoral', herramienta: 'FRAXplus® (fraxplus.org)', ...extra }), { fecha });

test('DXA: T-score frente a Z-score no se compara', () => {
  const c = clasificarCambio(porId.dxa, dxaT(-2.6), dxaZ(-1.0));
  assert.equal(c.tipo, 'no_interpretable');
  assert.match(c.texto, /T-score y otra Z-score; son magnitudes distintas/);
  assert.ok(!/mejor|peor|aumento|disminución/.test(c.principal));
});

test('DXA: una diferencia aislada del T-score no se califica como mejoría', () => {
  const c = clasificarCambio(porId.dxa, dxaT(-2.6), dxaT(-2.1, {}, '2026-10-01'));
  assert.equal(c.tipo, 'no_interpretable');
  assert.match(c.texto, /una diferencia aislada del T-score no demuestra un cambio densitométrico/);
  // Distinto sitio con el valor más bajo
  const a = dxaT(-2.6, { t_cuello: -1.5 });
  const b = dxaT(-1.4, { t_cuello: -2.0 }, '2026-10-01');
  assert.match(clasificarCambio(porId.dxa, a, b).texto, /sitios distintos/);
});

test('DXA: el seguimiento con DMO del mismo sitio, equipo y LSC se informa sin dirección automática', () => {
  const dmo = (valor, lsc = 0.03, equipo = 'Hologic') => ({ dmo_sitio: 'Columna lumbar (L1–L4)', dmo_valor: valor, equipo, lsc });
  const a = dxaT(-2.6, dmo(0.800));
  const b = dxaT(-2.5, dmo(0.845), '2026-10-01');
  const c = clasificarCambio(porId.dxa, a, b);
  assert.equal(c.tipo, 'no_interpretable');
  assert.match(c.texto, /DMO de columna lumbar \(L1–L4\) de 0\.8 a 0\.845 g\/cm² \(\+0\.045\): igual o mayor que el cambio mínimo significativo del centro \(0\.03 g\/cm²\)/);
  const d = clasificarCambio(porId.dxa, a, dxaT(-2.5, dmo(0.815), '2026-10-01'));
  assert.match(d.texto, /menor que el cambio mínimo significativo.*sin cambio significativo/);
  const e = clasificarCambio(porId.dxa, a, dxaT(-2.5, dmo(0.845, 0.03, 'GE Healthcare (Lunar)'), '2026-10-01'));
  assert.match(e.texto, /sin el mismo equipo y el cambio mínimo significativo del centro, la diferencia no se puede calificar/);
  assert.ok(calc('dxa', { sexo: 'Mujer', edad: 72, menopausia: 'Sí', t_columna: -2.6, fractura: 'No', ...dmo(0.8) }).lineas.some((l) => /DMO para el seguimiento: columna lumbar/.test(l)));
});

test('FRAX: modelos distintos o sin herramienta registrada no se comparan', () => {
  const m = clasificarCambio(porId.frax, frax(15), frax(10, { modelo: 'Otro país' }, '2026-10-01'));
  assert.equal(m.tipo, 'no_interpretable');
  assert.match(m.texto, /^Comparación longitudinal no interpretable: los resultados proceden de condiciones de cálculo diferentes/);
  assert.match(m.texto, /modelo de país no especificado/);
  const h = clasificarCambio(porId.frax, frax(15), frax(10, { herramienta: 'No consta' }, '2026-10-01'));
  assert.match(h.texto, /herramienta sin registrar/);
  // Resultado guardado con una versión anterior (sin modelo ni herramienta en los datos derivados)
  const viejo = { ...frax(15), extras: { mayor: 15, cadera: 2, dmo: true } };
  assert.equal(clasificarCambio(porId.frax, viejo, frax(10, {}, '2026-10-01')).tipo, 'no_interpretable');
});

test('FRAX: con y sin DMO no se comparan; en condiciones equivalentes, sin calificar como reducción del riesgo', () => {
  const d = clasificarCambio(porId.frax, frax(15), frax(10, { dmo: 'Sin DMO (solo con el IMC)' }, '2026-10-01'));
  assert.equal(d.tipo, 'no_interpretable');
  assert.match(d.texto, /uno con DMO y otro sin DMO/);
  const ok = clasificarCambio(porId.frax, frax(15), frax(10, {}, '2026-10-01'));
  assert.equal(ok.tipo, 'sin_direccion', 'una disminución no se presenta como mejoría');
  assert.ok(ok.advertencias.some((a) => /no demuestra por sí solo el efecto de una intervención/.test(a)));
});

test('TFG: cambios pequeños y grandes, sin afirmar recuperación', () => {
  const g = (valor, etiqueta) => ({ valor, etiqueta });
  const pequeno = clasificarCambio(porId.ckdepi, g(50, 'G3a · x'), g(53, 'G3a · x'));
  assert.equal(pequeno.tipo, 'sin_direccion');
  assert.ok(pequeno.advertencias.some((a) => /Cambio relativo: \+6\.0 %.*sin cambio \(G3a\)/.test(a)));
  assert.ok(pequeno.advertencias.some((a) => /dentro de la variabilidad esperada/.test(a)));
  const grande = clasificarCambio(porId.ckdepi, g(50, 'G3a · x'), g(36, 'G3b · x'));
  assert.ok(grande.advertencias.some((a) => /-28\.0 %.*de G3a a G3b/.test(a)));
  assert.ok(grande.advertencias.some((a) => /supera el 20 %.*requiere evaluación clínica/.test(a)));
  const aumento = clasificarCambio(porId.ckdepi, g(36, 'G3b · x'), g(50, 'G3a · x'));
  assert.notEqual(aumento.tipo, 'mejoria');
  assert.ok(aumento.advertencias.some((a) => /no equivale a recuperación renal.*sarcopenia/.test(a)));
  assert.equal(porId.ckdepi.direccionClinica, 'sin_direccion');
});

test('Charlson: demencia clínicamente establecida, sin tamizajes ni deterioro leve', () => {
  const ayuda = porId.charlson.campos.find((c) => c.id === 'demencia').ayuda;
  assert.match(ayuda, /Demencia clínicamente establecida/);
  for (const x of ['queja subjetiva de memoria', 'trastorno neurocognitivo leve', 'tamizaje cognitivo alterado aislado', 'delirium']) assert.ok(ayuda.includes(x), x);
  assert.equal(porId.charlson.campos.find((c) => c.id === 'demencia').opciones[0].valor, 1, 'el peso original no cambia');
  assert.ok(porId.charlson.notas.some((n) => /déficit cognitivo crónico/.test(n) && /Limitaciones/.test(n)));
});

test('nota médica con resultados no comparables: sin mejoría ni deterioro', () => {
  const v = { resultados: [dxaT(-2.6), dxaZ(-1.0)], paciente: {} };
  for (const f of ['lista', 'completa']) {
    const t = notaValoracion(v, porId, DOMINIOS, new Date('2026-10-10T12:00:00'), f);
    assert.match(t, /T-score y otra Z-score/, f);
    assert.ok(!/DXA[^\n]*(mejoría|deterioro|empeoramiento)/.test(t), `${f}: no califica el cambio`);
  }
  const { hallazgos } = hallazgosYSugerencias(v, porId, '2026-10-10');
  assert.ok(!hallazgos.some((h) => /DXA: .*(aumento|disminución)/.test(h)), 'un cambio no interpretable no aparece como empeoramiento');
});
