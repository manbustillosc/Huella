// Fase 3.1, prioridad 3: ICOPE no reutiliza evaluaciones detalladas antiguas sin confirmación del médico.
import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoDominio, DOMINIOS_ICOPE, icopeDe, confirmarReutilizacion, retirarReutilizacion, textoIcope } from '../js/icope.js';
import { REF_ICOPE, REF_ICOPE_OMS, LICENCIA_ICOPE } from '../escalas/icope.js';
import { porId, resp, guardado, EJEMPLOS } from './ayuda.mjs';

const cog = DOMINIOS_ICOPE.find((d) => d.id === 'cognicion');
const cribado = (fecha) => guardado('icope-cog', resp('icope-cog', { filtro: 'No', fecha: 'Responde correctamente', lugar: 'Responde incorrectamente o no sabe', palabras: 'Recuerda 2' }), { fecha });
const moca = (fecha) => guardado('moca', EJEMPLOS.moca(), { fecha });
const val = (resultados, icope = undefined) => ({ id: 'v', creada: Date.parse('2026-01-01T12:00:00'), paciente: {}, rutas: {}, resultados, ...(icope ? { icope } : {}), episodio: { codigo: 'EP-ABCDEF', estado: 'abierto', abierto: '2026-01-01' } });

test('evaluación antigua anterior al tamizaje alterado: requiere confirmación, no se da por resuelta', () => {
  const c = cribado('2026-10-10');
  const m = moca('2026-04-01');
  const x = estadoDominio(cog, val([c, m]), '2026-10-10');
  assert.equal(x.estado, 'alterado');
  assert.equal(x.vigencia, 'por_confirmar');
  assert.equal(x.necesidad.tipo, 'confirmar');
  assert.match(x.necesidad.texto, /Evaluación previa que requiere confirmación: MoCA .* es anterior al tamizaje alterado del 10\/10\/2026/);
  assert.notEqual(x.necesidad.tipo, 'hecha');
  assert.match(textoIcope(val([c, m]), '2026-10-10'), /Evaluación detallada pendiente: cognición/);
});

test('el médico confirma la reutilización; la confirmación vale solo para ese tamizaje', () => {
  const c = cribado('2026-10-10');
  const m = moca('2026-04-01');
  const icope = confirmarReutilizacion(icopeDe(val([])), 'cognicion', { tipo: 'resultado', id: m.id, cribado: c.id }, '2026-10-10');
  const x = estadoDominio(cog, val([c, m], icope), '2026-10-10');
  assert.equal(x.vigencia, 'confirmada');
  assert.equal(x.necesidad.tipo, 'hecha');
  assert.equal(x.necesidad.reutilizada, true);
  assert.match(x.necesidad.texto, /confirmada por el médico como vigente el 10\/10\/2026: MoCA/);
  // Un tamizaje nuevo invalida la confirmación anterior
  const c2 = cribado('2026-12-01');
  const y = estadoDominio(cog, val([c, m, c2], icope), '2026-12-01');
  assert.equal(y.vigencia, 'por_confirmar');
  // Retirar la confirmación
  retirarReutilizacion(icope, 'cognicion');
  assert.equal(estadoDominio(cog, val([c, m], icope), '2026-10-10').vigencia, 'por_confirmar');
});

test('evaluación complementaria reciente (posterior al tamizaje): vigente', () => {
  const c = cribado('2026-10-10');
  const x = estadoDominio(cog, val([c, moca('2026-10-12')]), '2026-10-12');
  assert.equal(x.vigencia, 'vigente');
  assert.equal(x.necesidad.tipo, 'hecha');
  assert.match(x.necesidad.texto, /Evaluación detallada vigente, posterior al tamizaje del 10\/10\/2026: MoCA/);
  // Mismo día también cuenta
  assert.equal(estadoDominio(cog, val([c, moca('2026-10-10')]), '2026-10-10').vigencia, 'vigente');
  // Anterior a la apertura del episodio: requiere confirmación aunque sea posterior al tamizaje
  const viejo = { ...val([cribado('2025-12-01'), moca('2025-12-15')]) };
  assert.equal(estadoDominio(cog, viejo, '2026-01-02').vigencia, 'por_confirmar');
});

test('evaluación detallada no realizable y pendiente', () => {
  const c = cribado('2026-10-10');
  const ne = guardado('moca', { _noEvaluable: 'Déficit sensorial (visual o auditivo)' }, { fecha: '2026-10-11' });
  const x = estadoDominio(cog, val([c, ne]), '2026-10-11');
  assert.equal(x.vigencia, 'no_realizable');
  assert.equal(x.necesidad.tipo, 'no_realizable');
  assert.equal(estadoDominio(cog, val([c]), '2026-10-11').vigencia, 'pendiente');
});

test('reutilización de resultados entre instrumentos: siempre con datos de origen y advertencias', () => {
  // SPPB → evaluación básica de la movilidad ICOPE (prueba de la silla), solo si hay tiempo de 5 levantadas
  const vl = porId['icope-loc'].vinculos.find((x) => x.escala === 'sppb');
  const sppbOk = guardado('sppb', EJEMPLOS.sppb(), { fecha: '2026-10-01' });
  assert.equal(vl.disponible(sppbOk), true);
  assert.notEqual(vl.disponible({ extras: { tiempoSilla: null } }), true, 'sin tiempo de silla no se ofrece');
  // Dinamometría → Fried: mano dominante y advertencia de método
  const vf = porId.fried.vinculos.find((x) => x.id === 'dinamometria');
  assert.match(vf.advertencia({}), /mano dominante/);
  // Velocidad de marcha → Vivifrail: advierte si el recorrido no es de 6 m
  const vv = porId.vivifrail.vinculos.find((x) => x.id === 'velocidad');
  assert.match(vv.advertencia({ extras: { distancia: 4 } }), /6 m/);
});

test('bibliografía ICOPE: segunda edición, licencia y nota de adaptación', () => {
  assert.match(REF_ICOPE.texto, /Segunda edición\. Washington, D\.C\.: OPS; 2025/);
  assert.equal(REF_ICOPE.doi, '10.37774/9789275330319');
  assert.match(REF_ICOPE_OMS.texto, /2nd ed\. Geneva: WHO; 2025\. ISBN 978-92-4-010372-6/);
  assert.match(REF_ICOPE_OMS.texto, /CC BY-NC-SA 3\.0 IGO/);
  assert.match(LICENCIA_ICOPE.texto, /Esta publicación es una adaptación de una obra original de la Organización Panamericana de la Salud \(OPS\)\. Las opiniones expresadas en esta adaptación son responsabilidad exclusiva de los autores y no representan necesariamente los criterios de la OPS/);
});
