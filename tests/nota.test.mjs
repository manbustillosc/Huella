// Pruebas de la nota de valoración y la comparación entre momentos.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ESCALAS } from '../escalas/index.js';
import { DOMINIOS } from '../js/dominios.js';
import { normalizarEscala, calcular, resumenDe, resumenBreveDe } from '../js/motor.js';
import { notaValoracion, compararMomentos, hallazgosYSugerencias } from '../js/nota.js';

const escalas = ESCALAS.map(normalizarEscala);
const porId = Object.fromEntries(escalas.map((e) => [e.id, e]));

// Simula «Añadir a la valoración».
function guardado(id, respuestas, extra = {}) {
  const e = porId[id];
  const res = calcular(e, respuestas);
  assert.ok(res.completo, `${id} incompleto`);
  return {
    escalaId: id, puntaje: res.puntaje, max: res.max, valor: res.valor, unidad: res.unidad, mostrar: res.mostrar,
    nivel: res.banda.nivel, etiqueta: res.banda.etiqueta, hallazgo: Boolean(res.banda.hallazgo), sugerencias: res.banda.sugerencias || [],
    resumen: resumenDe(e, res), breve: resumenBreveDe(e, res), noEvaluable: res.noEvaluable, respuestas, ...extra,
  };
}
const barthelCon = (cambios) => {
  const r = Object.fromEntries(porId.barthel.campos.map((c) => [c.id, 0]));
  return { ...r, ...cambios };
};

// Barthel basal 95 (bañarse dependiente) e ingreso 45.
const basal = guardado('barthel', barthelCon({ banarse: 1 }), { momento: 'basal', fuente: 'cuidador', fecha: '2026-10-01' });
const ingreso = guardado('barthel', barthelCon({ banarse: 1, vestirse: 2, retrete: 2, traslado: 1, deambulacion: 3, escalones: 2 }), { momento: 'ingreso' });
const gds = guardado('gds15', Object.fromEntries(porId.gds15.campos.map((c) => [c.id, 1])));
const moca = guardado('moca', { _noEvaluable: 'Alteración del estado de alerta o delirium' });
const val = { paciente: { edad: 82, sexo: 'mujer', escolaridad: 6, contexto: 'Ingreso por neumonía' }, resultados: [basal, ingreso, gds, moca] };
const fecha = new Date(2026, 9, 10);

test('comparación basal → ingreso: diferencia, categoría y actividades empeoradas', () => {
  assert.equal(basal.puntaje, 95);
  assert.equal(ingreso.puntaje, 45);
  const cmp = compararMomentos([ingreso, basal], porId.barthel);
  assert.equal(cmp.ref, basal);
  const c = cmp.comparaciones[0];
  assert.equal(c.dif, -50);
  assert.equal(c.cambioCategoria, true);
  assert.deepEqual(c.empeoradas, ['vestirse', 'uso del retrete', 'traslado cama–sillón', 'desplazamiento', 'escaleras']);
});

test('nota en párrafo: una línea, con comparación', () => {
  const t = notaValoracion(val, porId, DOMINIOS, fecha, 'parrafo');
  assert.ok(!t.includes('\n'));
  assert.match(t, /^Valoración geriátrica 10\/10\/2026\. Paciente: mujer, 82 años, escolaridad 6 años\. Contexto: Ingreso por neumonía\./);
  assert.match(t, /Funcional: Barthel basal 95\/100 \(dependencia escasa\), al ingreso 45\/100 \(dependencia grave\), con disminución de 50 puntos respecto al basal, con cambio de categoría\./);
  assert.match(t, /Afectivo: GDS-15 5\/15 \(síntomas depresivos: tamizaje positivo\)\./);
  assert.match(t, /Cognitivo: MoCA no evaluable \(alteración del estado de alerta o delirium\)\./);
});

test('nota en lista: renglones por momento y cambio', () => {
  const t = notaValoracion(val, porId, DOMINIOS, fecha, 'lista');
  assert.match(t, /\nFUNCIONAL\n- Barthel basal: 95\/100 \(dependencia escasa\)\. Fuente: cuidador\.\n- Barthel al ingreso: 45\/100 \(dependencia grave\)\.\n {2}Cambio: disminución de 50 puntos respecto al basal, con cambio de categoría\./);
});

test('nota completa: resultados, hallazgos, no evaluables y sugerencias separadas', () => {
  const t = notaValoracion(val, porId, DOMINIOS, fecha, 'completa');
  const i = (s) => t.indexOf(s);
  assert.ok(i('RESULTADOS POR DOMINIO') < i('HALLAZGOS QUE REQUIEREN ATENCIÓN'));
  assert.ok(i('HALLAZGOS QUE REQUIEREN ATENCIÓN') < i('SUGERENCIAS DE EVALUACIÓN COMPLEMENTARIA'));
  assert.match(t, /Contexto clínico: Ingreso por neumonía\./);
  assert.match(t, /actividades con menor puntaje que el basal: vestirse, uso del retrete/);
  assert.match(t, /- Disminución de 50 puntos en Barthel respecto al basal .*la causa y la reversibilidad requieren valoración clínica\./);
  assert.match(t, /- GDS-15 5\/15/);
  assert.match(t, /Instrumentos no evaluables: MoCA/);
  assert.match(t, /orientativas; no son resultados/);
  assert.match(t, /Entrevista clínica para confirmar o descartar un trastorno depresivo/);
});

test('hallazgos usan el resultado más reciente de cada escala', () => {
  const { hallazgos } = hallazgosYSugerencias(val, porId);
  assert.ok(hallazgos.some((h) => h.startsWith('Barthel 45/100')));
  assert.ok(!hallazgos.some((h) => h.startsWith('Barthel 95/100')));
});

test('resultado guardado con una versión anterior (sin momento ni breve) sigue funcionando', () => {
  const viejo = { escalaId: 'barthel', puntaje: 85, max: 100, nivel: 'moderado', etiqueta: 'Dependencia moderada', resumen: 'Barthel: 85/100 (dependencia moderada).' };
  const v = { paciente: {}, resultados: [viejo] };
  assert.match(notaValoracion(v, porId, DOMINIOS, fecha, 'parrafo'), /Funcional: Barthel 85\/100 \(dependencia moderada\)\./);
  assert.match(notaValoracion(v, porId, DOMINIOS, fecha, 'lista'), /- Barthel: 85\/100 \(dependencia moderada\)\./);
  assert.match(notaValoracion(v, porId, DOMINIOS, fecha, 'completa'), /RESULTADOS POR DOMINIO\nFuncional: Barthel 85\/100/);
});
