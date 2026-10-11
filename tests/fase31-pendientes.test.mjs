// Fase 3.1, prioridad 5: centro de pendientes, vigencia de los resultados e informes sin duplicados.
import test from 'node:test';
import assert from 'node:assert/strict';
import { centroPendientes, vigenciaResultado, instrumentosIncompletos, resultadosRecientes, DIAS_REFERENCIA, TEXTO_PERIODOS } from '../js/pendientes.js';
import { planVacio, agregarObjetivo, fijarRevaloracion, actualizarObjetivo } from '../js/plan.js';
import { textoInforme } from '../js/informes.js';
import { DOMINIOS } from '../js/dominios.js';
import { almacen } from '../js/almacen.js';
import { porId, resp, guardado, EJEMPLOS } from './ayuda.mjs';

const HOY = '2026-10-11';
const val = (resultados, extra = {}) => ({ id: 'v1', creada: Date.parse('2026-10-01T12:00:00'), paciente: {}, rutas: {}, resultados, episodio: { codigo: 'EP-ABCDEF', estado: 'abierto', abierto: '2026-10-01' }, ...extra });
const tug = (t, fecha) => guardado('tug', resp('tug', { estado: 'Sí', tiempo: t }), { fecha });

test('vigencia: reciente, anterior, requiere confirmación y posiblemente desactualizado, con periodos declarados', () => {
  const a = tug(11, '2026-10-02');
  const b = tug(12, '2026-10-09');
  const v = val([a, b]);
  assert.equal(vigenciaResultado(b, [a, b], v, HOY).estado, 'reciente');
  assert.equal(vigenciaResultado(a, [a, b], v, HOY).estado, 'anterior');
  const previo = tug(11, '2026-09-20');
  assert.equal(vigenciaResultado(previo, [previo], v, HOY).estado, 'confirmar', 'aplicado antes de abrir el episodio');
  assert.match(vigenciaResultado(previo, [previo], v, HOY).texto, /antes de abrir el episodio.*regístralo como basal/);
  const viejo = tug(11, '2026-06-01');
  const vLargo = val([viejo], { episodio: { codigo: 'EP-ABCDEF', estado: 'abierto', abierto: '2026-05-01' } });
  const x = vigenciaResultado(viejo, [viejo], vLargo, HOY);
  assert.equal(x.estado, 'desactualizado');
  assert.match(x.texto, new RegExp(`periodo de referencia de Huella \\(${DIAS_REFERENCIA} días; no es un criterio de validez`));
  // Estado momentáneo de otro día
  const rass = guardado('rass', resp('rass', { nivel: '0 · Alerta y tranquilo' }), { fecha: '2026-10-10' });
  assert.equal(vigenciaResultado(rass, [rass], v, HOY).estado, 'desactualizado');
  const rassHoy = guardado('rass', resp('rass', { nivel: '0 · Alerta y tranquilo' }), { fecha: HOY });
  assert.equal(vigenciaResultado(rassHoy, [rassHoy], v, HOY).estado, 'reciente');
  // El basal no lleva indicador
  assert.equal(vigenciaResultado({ ...previo, momento: 'basal' }, [previo], v, HOY), null);
  assert.match(TEXTO_PERIODOS, /90 días/);
});

test('instrumentos sin terminar: solo con datos capturados por el médico (no precargados) y sin resultado calculable', () => {
  const borr = [
    { escalaId: 'barthel', momento: undefined, r: { comer: 0, banarse: 0 } },
    { escalaId: 'charlson', momento: undefined, r: { edad: 82 } }, // solo dato precargado
    { escalaId: 'gds15', momento: undefined, r: EJEMPLOS.gds15() }, // completo
    { escalaId: 'moca', momento: undefined, r: { _noEvaluable: 'Déficit sensorial (visual o auditivo)' } },
  ];
  const xs = instrumentosIncompletos(borr, porId);
  assert.equal(xs.length, 1);
  assert.match(xs[0].texto, /^Barthel: 2 de 10 respondidas\.$/);
  assert.equal(xs[0].href, '#/e/barthel');
});

test('centro de pendientes: no evaluables, ICOPE, rutas, objetivos, revaloraciones y vigencia', () => {
  const plan = planVacio();
  const o1 = agregarObjetivo(plan, 'dom:caidas', { texto: 'Sin caídas', plazo: '2026-10-05' }, '2026-10-01', 'Caídas');
  agregarObjetivo(plan, 'dom:funcional', { texto: 'Bañarse con supervisión' }, '2026-10-01', 'Funcional');
  const o3 = agregarObjetivo(plan, 'dom:nutricion', { texto: 'Ganar 2 kg' }, '2026-10-01', 'Nutrición');
  actualizarObjetivo(plan, o3.id, { estado: 'cumplido' }, '2026-10-08');
  fijarRevaloracion(plan, 'dom:caidas', '2026-10-09', '2026-10-01', 'Caídas');
  const moca = guardado('moca', { _noEvaluable: 'Déficit sensorial (visual o auditivo)' }, { fecha: '2026-10-08' });
  const cog = guardado('icope-cog', resp('icope-cog', { filtro: 'No', fecha: 'Responde correctamente', lugar: 'Responde incorrectamente o no sabe', palabras: 'Recuerda 2' }), { fecha: '2026-10-08' });
  const viejo = tug(11, '2026-09-01');
  const v = val([moca, cog, viejo], { plan });
  const { grupos, total } = centroPendientes(v, porId, HOY, { rutas: [{ id: 'nucleo', nombre: 'Valoración geriátrica', pendientes: 3 }] });
  const g = Object.fromEntries(grupos.map((x) => [x.id, x]));
  assert.match(g.no_evaluables.items[0].texto, /^MoCA: no evaluable \(Déficit sensorial \(visual o auditivo\)\) el 08\/10\/2026/);
  // La MoCA no evaluable cuenta como evaluación detallada no realizable: aparece en «No evaluables», no como pendiente.
  assert.ok(!g.complementarias.items.some((x) => /ICOPE · Cognición/.test(x.texto)));
  const sinMoca = centroPendientes(val([cog]), porId, HOY).grupos.find((x) => x.id === 'complementarias');
  assert.ok(sinMoca.items.some((x) => /ICOPE · Cognición: evaluación detallada pendiente/.test(x.texto) && x.href === '#/icope/detallada#d-cognicion'));
  assert.ok(g.complementarias.items.some((x) => /ICOPE: evaluación básica pendiente en/.test(x.texto)));
  assert.ok(g.complementarias.items.some((x) => /Valoración geriátrica: 3 pasos pendientes/.test(x.texto) && x.href === '#/r/nucleo'));
  assert.equal(g.objetivos.items.length, 2, 'el objetivo cumplido no aparece');
  assert.ok(g.objetivos.items[0].vencido && /Sin caídas \(plazo 05\/10\/2026, vencido\)/.test(g.objetivos.items[0].texto), 'vencidos primero');
  assert.match(g.objetivos.items[1].texto, /sin plazo/);
  assert.match(g.revaloraciones.items[0].texto, /programada para el 09\/10\/2026 \(hace 2 días\)/);
  assert.ok(g.vigencia.items.some((x) => /^TUG: Aplicado el 01\/09\/2026, antes de abrir el episodio/.test(x.texto)));
  assert.equal(total, grupos.reduce((s, x) => s + x.items.length, 0));
  assert.ok(o1);
  // Valoración vacía: sin pendientes
  assert.equal(centroPendientes(val([]), porId, HOY).total, 0);
});

test('borradores del almacén: respuestas en edición ligadas a la valoración en curso', () => {
  almacen.borrarTodo();
  almacen.guardarRespuestas('barthel', undefined, { comer: 0 });
  almacen.guardarRespuestas('tug', 'ingreso', { estado: 0 });
  const b = almacen.borradores();
  assert.deepEqual(b.map((x) => [x.escalaId, x.momento]).sort(), [['barthel', undefined], ['tug', 'ingreso']]);
  almacen.nuevaValoracion();
  assert.deepEqual(almacen.borradores(), [], 'una valoración nueva no hereda borradores');
  almacen.borrarTodo();
});

test('inicio rápido: resultados recientes por fecha, sin el basal', () => {
  const a = tug(11, '2026-10-02');
  const b = guardado('barthel', EJEMPLOS.barthel(), { fecha: '2026-10-09' });
  const c = { ...guardado('barthel', EJEMPLOS.barthel(), { fecha: '2026-09-01' }), momento: 'basal' };
  const xs = resultadosRecientes(val([a, b, c]), porId, 3);
  assert.deepEqual(xs.map((x) => x.r.escalaId), ['barthel', 'tug']);
  assert.match(xs[0].href, /^#\/e\/barthel/);
});

test('evolución breve: los hallazgos no repiten los resultados vigentes ni los cambios', () => {
  const v = val([tug(11, '2026-10-02'), tug(16.4, '2026-10-08'), guardado('barthel', EJEMPLOS.barthel(), { fecha: '2026-10-08' })]);
  const t = textoInforme('evolucion', v, { porId, dominios: DOMINIOS, hoy: HOY, version: '2.1.0' });
  const lineas = t.split('\n').filter((l) => l.trim().length > 20);
  assert.equal(new Set(lineas).size, lineas.length, 'sin líneas repetidas');
  assert.match(t, /HALLAZGOS\n- Requieren atención: .*TUG \(empeoramiento respecto a la referencia\)/);
});
