// Fase 3, módulo A: ICOPE (evaluación básica, factores clave, panel, plan y seguimiento).
import test from 'node:test';
import assert from 'node:assert/strict';
import { RUTAS, pasosDe } from '../js/rutas.js';
import { notaValoracion } from '../js/nota.js';
import { DOMINIOS } from '../js/dominios.js';
import { calcular } from '../js/motor.js';
import {
  DOMINIOS_ICOPE, estadoDominio, estadosIcope, estadoFactores, avanceBasica, textoIcope, categoriaSppbIcope, nombreAmbitoIcope, AMBITOS_ICOPE,
} from '../js/icope.js';
import {
  planVacio, planDe, fijarProblema, fijarPrioridad, fijarRevaloracion, agregarObjetivo, actualizarObjetivo, quitarObjetivo,
  agregarIntervencion, actualizarIntervencion, quitarIntervencion, fijarPreferencias, registrarCambio, planConContenido,
  lineasPlan, NOMBRES_ICOPE, CATEGORIAS_INTERVENCION, MAX_PREFERENCIA,
} from '../js/plan.js';
import { porId, resp, calc, guardado, EJEMPLOS } from './ayuda.mjs';

const ICOPE = ['icope-cog', 'icope-loc', 'icope-vit', 'icope-vis', 'icope-aud', 'icope-psi', 'icope-fac'];
const hoy = '2026-10-10';
const fecha = new Date(2026, 9, 10);
const banda = (id, mapa) => calc(id, mapa).banda?.id;

test('ICOPE: siete instrumentos del paso 1 con ficha, licencia CC BY-NC-SA y sin puntaje', () => {
  for (const id of ICOPE) {
    const e = porId[id];
    assert.ok(e, id);
    assert.equal(e.tipo, 'tamizaje', id);
    assert.equal(e.direccionClinica, 'sin_direccion', id);
    assert.match(e.licencia.texto, /CC BY-NC-SA 3\.0 IGO/, id);
    assert.match(e.licencia.texto, /no representan necesariamente los criterios de la OPS/, id);
    assert.ok(e.referencias.some((r) => r.doi === '10.37774/9789275330319'), `${id}: cita el manual de la OPS`);
    assert.ok(e.notas.some((n) => /no respalda|no define un puntaje global/.test(n)), id);
    const res = calcular(e, EJEMPLOS[id]());
    assert.ok(res.completo, id);
    assert.equal(res.puntaje, null, `${id}: sin puntaje`);
    assert.equal(res.valor, null, `${id}: sin valor numérico`);
  }
  assert.equal(new Set(DOMINIOS_ICOPE.map((d) => d.id)).size, 6);
  assert.deepEqual(DOMINIOS_ICOPE.map((d) => d.escala), ICOPE.slice(0, 6));
  assert.ok(DOMINIOS.some((d) => d.id === 'sensorial'), 'nuevo dominio de salud sensorial y oral');
  for (const d of DOMINIOS_ICOPE) assert.equal(NOMBRES_ICOPE[d.id], d.nombre, `nombre de ${d.id} coincide en plan.js`);
});

test('ICOPE cognición: filtro afirmativo pasa a evaluación detallada; orientación y 3 palabras', () => {
  assert.equal(banda('icope-cog', { filtro: 'Sí' }), 'filtro');
  const ok = { filtro: 'No', fecha: 'Responde correctamente', lugar: 'Responde correctamente', palabras: 'Recuerda las 3' };
  assert.equal(banda('icope-cog', ok), 'conservado');
  assert.equal(banda('icope-cog', { ...ok, fecha: 'Responde incorrectamente o no sabe' }), 'alterado');
  assert.equal(banda('icope-cog', { ...ok, lugar: 'Responde incorrectamente o no sabe' }), 'alterado');
  assert.equal(banda('icope-cog', { ...ok, palabras: 'Recuerda 2' }), 'alterado');
  assert.equal(calc('icope-cog', { filtro: 'No' }).completo, false, 'sin la prueba no se interpreta');
  const r = calc('icope-cog', { ...ok, palabras: 'Ninguna' });
  assert.match(r.extras.hallazgo, /recordó 0 de 3 palabras/);
  assert.ok(porId['icope-cog'].siguientes.every((s) => s.si(r)), 'sugiere Mini-Cog, MoCA o RUDAS');
});

test('ICOPE movilidad: 5 levantadas en 14 s o menos; incapacidad para intentar = alterado', () => {
  assert.equal(banda('icope-loc', { seguro: 'No' }), 'alterado');
  assert.equal(banda('icope-loc', { seguro: 'Sí', completo: 'No logró completarlas' }), 'alterado');
  assert.equal(banda('icope-loc', { seguro: 'Sí', completo: 'Sí, las completó', tiempo: 14 }), 'conservado');
  assert.equal(banda('icope-loc', { seguro: 'Sí', completo: 'Sí, las completó', tiempo: 14.1 }), 'alterado');
  const conBaston = calc('icope-loc', { seguro: 'Sí', completo: 'Sí, las completó', tiempo: 10, baston: 'Con bastón' });
  assert.match(conBaston.extras.hallazgo, /con bastón/);
  // Reutiliza la prueba de la silla del SPPB.
  const sppb = guardado('sppb', EJEMPLOS.sppb());
  assert.equal(sppb.extras.tiempoSilla, 10);
  const vin = porId['icope-loc'].vinculos[0];
  assert.equal(vin.disponible(sppb), true);
  const r = calcular(porId['icope-loc'], vin.aplicar(sppb));
  assert.equal(r.banda.id, 'conservado');
  const sinTiempo = guardado('sppb', resp('sppb', { ...EJEMPLOS.sppb(), silla_estado: 'No las completó' }));
  assert.equal(typeof vin.disponible(sinTiempo), 'string', 'sin tiempo de silla no se ofrece');
});

test('ICOPE vitalidad: pérdida de peso, ropa floja si no conoce su peso, apetito y peso opcional', () => {
  assert.equal(banda('icope-vit', { peso: 'Sí', apetito: 'No' }), 'alterado');
  assert.equal(banda('icope-vit', { peso: 'No', apetito: 'Sí' }), 'alterado');
  assert.equal(banda('icope-vit', { peso: 'No conoce su peso', ropa: 'Sí', apetito: 'No' }), 'alterado');
  assert.equal(banda('icope-vit', { peso: 'No conoce su peso', ropa: 'No', apetito: 'No' }), 'conservado');
  assert.equal(calc('icope-vit', { peso: 'No conoce su peso', apetito: 'No' }).completo, false);
  const r = calc('icope-vit', { peso: 'No', apetito: 'No', kg: 58.5 });
  assert.equal(r.banda.id, 'conservado');
  assert.match(r.extras.hallazgo, /peso 58\.5 kg/);
});

test('ICOPE visión: filtros, revisión externa, 6/12 por ojo y N6 con o sin gafas de lectura', () => {
  assert.equal(banda('icope-vis', { filtro1: 'Sí', filtro2: 'No' }), 'filtro');
  assert.equal(banda('icope-vis', { filtro1: 'No', filtro2: 'Sí' }), 'filtro');
  const base = EJEMPLOS['icope-vis']();
  assert.equal(calcular(porId['icope-vis'], base).banda.id, 'conservado');
  const con = (k, t) => calcular(porId['icope-vis'], { ...base, ...resp('icope-vis', { [k]: t }) });
  assert.equal(con('lejos_izq', 'No ve 3 de las E pequeñas (menos de 6/12)').banda.id, 'alterado');
  assert.equal(con('externa', 'Con alguna alteración').banda.id, 'alterado');
  const lectura = con('cerca', 'Ve N6 solo con gafas de lectura prefabricadas');
  assert.equal(lectura.banda.id, 'conservado');
  assert.ok(lectura.lineas.some((l) => /proveer gafas de lectura/.test(l)));
  assert.equal(con('cerca', 'No ve N6 ni con gafas de lectura').banda.id, 'alterado');
  assert.ok(porId['icope-vis'].motivosNoEvaluable.includes('Sin el equipo necesario para la prueba'));
  const ne = calcular(porId['icope-vis'], { _noEvaluable: 'Sin el equipo necesario para la prueba' });
  assert.equal(ne.noEvaluable, 'Sin el equipo necesario para la prueba');
});

test('ICOPE audición: filtro, susurro (al menos 3 de 4 por oído), audiometría tonal y dígitos en ruido', () => {
  assert.equal(banda('icope-aud', { audifonos: 'No', filtro: 'Sí' }), 'filtro');
  const r = calc('icope-aud', { audifonos: 'Sí', filtro: 'Sí' });
  assert.match(r.extras.hallazgo, /aun con audífonos/);
  const sus = (d, i) => calc('icope-aud', { audifonos: 'No', filtro: 'No', prueba: 'Prueba del susurro', sus_der: String(d), sus_izq: String(i) });
  assert.equal(sus(4, 4).banda.id, 'conservado');
  const tres = sus(3, 4);
  assert.equal(tres.banda.id, 'conservado');
  assert.ok(tres.lineas.some((l) => /más de tres palabras/.test(l)), 'aclara el caso de exactamente 3');
  assert.equal(sus(2, 4).banda.id, 'alterado');
  const ton = (d, i) => calc('icope-aud', { audifonos: 'No', filtro: 'No', prueba: 'Audiometría tonal (35 dBHL)', ton_der: d, ton_izq: i }).banda.id;
  assert.equal(ton('Responde a 35 dBHL en 1, 2 y 4 kHz', 'Responde a 35 dBHL en 1, 2 y 4 kHz'), 'conservado');
  assert.equal(ton('Responde a 35 dBHL en 1, 2 y 4 kHz', 'No responde en una o más frecuencias'), 'alterado');
  const din = (n) => calc('icope-aud', { audifonos: 'No', filtro: 'No', prueba: 'Dígitos en ruido (p. ej., hearWHO)', din: n }).banda.id;
  assert.equal(din(50), 'conservado');
  assert.equal(din(49), 'alterado');
});

test('ICOPE psicológica: cualquier respuesta afirmativa requiere evaluación detallada, sin diagnóstico', () => {
  assert.equal(banda('icope-psi', { tristeza: 'No', interes: 'No' }), 'conservado');
  assert.equal(banda('icope-psi', { tristeza: 'Sí', interes: 'No' }), 'alterado');
  assert.equal(banda('icope-psi', { tristeza: 'No', interes: 'Sí' }), 'alterado');
  const r = calc('icope-psi', { tristeza: 'Sí', interes: 'Sí' });
  assert.match(r.banda.texto, /no es un diagnóstico/);
  assert.deepEqual(porId['icope-psi'].siguientes.map((s) => s.id), ['phq9', 'gds15']);
});

test('ICOPE factores clave: necesidades por grupo, quien cuida en privado, presión arterial y tabaco', () => {
  const r = calc('icope-fac', { vivienda: 'No', economia: 'Sí', soledad: 'No', participacion: 'No', cuidador: 'Sí, y respondió en privado', cuid_apoyo: 'No', cuid_confianza: 'Sí', cuid_repercusion: 'Sí', orina: 'Sí' });
  assert.deepEqual(r.extras.necesidades, ['economia', 'orina', 'cuid_apoyo', 'cuid_repercusion']);
  assert.deepEqual(r.extras.grupos, ['social', 'continencia', 'cuidador']);
  assert.equal(r.banda.sugerencias.length, 3);
  const nadie = calc('icope-fac', { vivienda: 'No', economia: 'No', soledad: 'No', participacion: 'No', cuidador: 'No tiene', orina: 'No' });
  assert.equal(nadie.banda.id, 'sin');
  const pendiente = calc('icope-fac', { vivienda: 'No', economia: 'No', soledad: 'No', participacion: 'No', cuidador: 'Sí, pero no fue posible preguntarle', orina: 'No' });
  assert.equal(pendiente.extras.cuidadorPendiente, true);
  assert.ok(pendiente.lineas.some((l) => /no fue posible preguntarle/.test(l)));
  const pa = calc('icope-fac', { vivienda: 'No', economia: 'No', soledad: 'No', participacion: 'No', cuidador: 'No tiene', orina: 'No', pa: 'Medida (segunda de al menos dos lecturas)', pas: 150, pad: 85, tabaco: 'Sí' });
  assert.equal(pa.banda.id, 'necesidades');
  assert.ok(pa.lineas.some((l) => /150\/85.*dos consultas en días diferentes/.test(l)));
  assert.ok(pa.banda.sugerencias.some((s) => /tabaco/.test(s)));
  const normal = calc('icope-fac', { vivienda: 'No', economia: 'No', soledad: 'No', participacion: 'No', cuidador: 'No tiene', orina: 'No', pa: 'Medida (segunda de al menos dos lecturas)', pas: 128, pad: 76 });
  assert.equal(normal.banda.id, 'sin');
  const mal = calc('icope-fac', { vivienda: 'No', economia: 'No', soledad: 'No', participacion: 'No', cuidador: 'No tiene', orina: 'No', pa: 'Medida (segunda de al menos dos lecturas)', pas: 120, pad: 130 });
  assert.ok(mal.errores.pad, 'la diastólica debe ser menor que la sistólica');
});

test('ruta ICOPE: seis dominios en el núcleo y factores clave como complementario', () => {
  const r = RUTAS.find((x) => x.id === 'icope');
  const pasos = pasosDe(r);
  assert.deepEqual(pasos.filter((p) => !p.complementario).map((p) => p.id), ICOPE.slice(0, 6));
  assert.deepEqual(pasos.filter((p) => p.complementario).map((p) => p.id), ['icope-fac']);
});

function valoracion(resultados = [], extra = {}) {
  return { id: 'v1', creada: Date.now(), paciente: {}, resultados, rutas: {}, ...extra };
}

test('panel ICOPE: estados pendiente, conservado, alterado y no evaluable; evaluación detallada reutilizada', () => {
  const cog = guardado('icope-cog', resp('icope-cog', { filtro: 'No', fecha: 'Responde correctamente', lugar: 'Responde correctamente', palabras: 'Recuerda 2' }), { fecha: '2026-10-01' });
  const loc = guardado('icope-loc', EJEMPLOS['icope-loc'](), { fecha: '2026-10-01' });
  const vis = guardado('icope-vis', { _noEvaluable: 'Sin el equipo necesario para la prueba' }, { fecha: '2026-10-01' });
  const moca = guardado('moca', EJEMPLOS.moca(), { fecha: '2026-10-05' });
  const v = valoracion([cog, loc, vis, moca]);
  const est = estadosIcope(v, hoy);
  const de = (id) => est.find((x) => x.dom.id === id);
  assert.equal(de('cognicion').estado, 'alterado');
  assert.equal(de('cognicion').necesidad.tipo, 'hecha', 'MoCA registrada cuenta como evaluación detallada');
  assert.match(de('cognicion').necesidad.texto, /MoCA/);
  assert.equal(de('locomotora').estado, 'conservado');
  assert.equal(de('locomotora').necesidad.proxima, '2027-10-01', 'evaluación básica anual');
  assert.equal(de('vision').estado, 'no_evaluable');
  assert.equal(de('audicion').estado, 'pendiente');
  assert.equal(de('audicion').necesidad.tipo, 'basica');
  assert.equal(de('cognicion').prioridad, null, 'la prioridad nunca se asigna sola');
  assert.equal(de('cognicion').problema, null, 'el tamizaje no se convierte en diagnóstico');
  const av = avanceBasica(est);
  assert.equal(av.evaluados, 3);
  assert.deepEqual(av.alterados, ['Cognición']);
  // Paso 2 sin instrumento: pendiente
  const sola = estadosIcope(valoracion([cog]), hoy).find((x) => x.dom.id === 'cognicion');
  assert.equal(sola.necesidad.tipo, 'detallada');
  // Registro externo (visión, audición) cuenta como evaluación detallada
  const aud = guardado('icope-aud', resp('icope-aud', { audifonos: 'No', filtro: 'Sí' }), { fecha: '2026-10-01' });
  const conExterna = valoracion([aud], { icope: { detalle: { audicion: [{ id: 'x1', fecha: '2026-10-08', prueba: 'Audiometría diagnóstica', hallazgo: 'hipoacusia bilateral' }] } } });
  const a = estadoDominio(DOMINIOS_ICOPE.find((d) => d.id === 'audicion'), conExterna, hoy);
  assert.equal(a.porFiltro, true);
  assert.equal(a.necesidad.tipo, 'hecha');
  assert.match(a.necesidad.texto, /Audiometría diagnóstica/);
});

test('panel ICOPE: evolución entre aplicaciones y categoría de la SPPB en el esquema ICOPE', () => {
  const antes = guardado('icope-loc', EJEMPLOS['icope-loc'](), { fecha: '2026-04-01' });
  const despues = guardado('icope-loc', resp('icope-loc', { seguro: 'Sí', completo: 'Sí, las completó', tiempo: 16 }), { fecha: '2026-10-01' });
  const s1 = guardado('sppb', EJEMPLOS.sppb(), { fecha: '2026-04-01' });
  const s2 = guardado('sppb', resp('sppb', { ...EJEMPLOS.sppb(), eq_tandem: 'Lo intentó, menos de 3 s', silla_t: 15 }), { fecha: '2026-10-01' });
  const x = estadoDominio(DOMINIOS_ICOPE[1], valoracion([antes, despues, s1, s2]), hoy);
  assert.equal(x.estado, 'alterado');
  assert.ok(x.evolucion.some((e) => /conservado \(01\/04\/2026\) → alterado \(01\/10\/2026\): empeoró/.test(e)));
  assert.ok(x.evolucion.some((e) => /^SPPB: disminución/.test(e)));
  assert.equal(categoriaSppbIcope(s1), 'movilidad normal en el esquema ICOPE (10 a 12)');
  assert.equal(categoriaSppbIcope({ puntaje: 9 }), 'movilidad limitada en el esquema ICOPE (0 a 9)');
  assert.equal(categoriaSppbIcope({ noEvaluable: 'x' }), '');
});

test('plan: valoración del médico, prioridad, objetivos e intervenciones solo por acción explícita, con bitácora', () => {
  const plan = planVacio();
  assert.equal(planConContenido(plan), false);
  fijarProblema(plan, 'icope:cognicion', { estado: 'sospecha', nota: 'MoCA 22' }, hoy, 'Cognición');
  assert.equal(plan.problemas[0].estado, 'sospecha');
  fijarProblema(plan, 'icope:cognicion', { estado: 'confirmado' }, hoy, 'Cognición');
  assert.equal(plan.problemas.length, 1);
  assert.equal(plan.problemas[0].nota, 'MoCA 22', 'conserva la nota previa');
  fijarProblema(plan, 'icope:cognicion', { estado: 'inventado' }, hoy);
  assert.equal(plan.problemas[0].estado, 'confirmado', 'rechaza estados desconocidos');
  fijarPrioridad(plan, 'icope:cognicion', 'alta', hoy, 'Cognición');
  fijarPrioridad(plan, 'icope:cognicion', 'urgentisima', hoy);
  assert.equal(plan.prioridades['icope:cognicion'], 'alta');
  assert.equal(agregarObjetivo(plan, 'icope:locomotora', { texto: '  ' }, hoy), null, 'el objetivo es obligatorio');
  const o = agregarObjetivo(plan, 'icope:locomotora', { texto: 'Caminar al mercado sin ayuda', basal: 'SPPB 7/12', meta: 'SPPB 9/12', plazo: '2027-01-10', responsable: 'fisioterapia', indicador: 'SPPB', extra: 'x' }, hoy, 'Capacidad locomotora');
  assert.equal(o.estado, 'pendiente');
  assert.equal(o.extra, undefined);
  actualizarObjetivo(plan, o.id, { estado: 'cumplido' }, '2027-01-05');
  assert.equal(plan.objetivos[0].estado, 'cumplido');
  const i = agregarIntervencion(plan, 'icope:locomotora', { categoria: 'ejercicio', texto: 'Programa de ejercicio multimodal.', origen: 'sugerida' }, hoy, 'Capacidad locomotora');
  assert.equal(i.estado, 'planeada', 'nunca se agrega como realizada');
  assert.equal(agregarIntervencion(plan, 'icope:locomotora', { categoria: 'ejercicio', texto: 'Programa de ejercicio multimodal.' }, hoy), null, 'sin duplicados');
  const otra = agregarIntervencion(plan, 'icope:locomotora', { categoria: 'inexistente', texto: 'Bastón' }, hoy);
  assert.equal(otra.categoria, 'otra');
  actualizarIntervencion(plan, i.id, { estado: 'en_curso' }, '2026-10-20');
  assert.equal(plan.intervenciones[0].fechaEstado, '2026-10-20');
  quitarIntervencion(plan, otra.id, hoy);
  fijarRevaloracion(plan, 'icope:locomotora', '2027-01-10', hoy, 'Capacidad locomotora');
  fijarPreferencias(plan, { importa: 'Seguir cuidando su jardín', decide: 'x'.repeat(500), ajeno: 'no' });
  assert.equal(plan.preferencias.decide.length, MAX_PREFERENCIA);
  assert.equal(plan.preferencias.ajeno, undefined);
  assert.equal(registrarCambio(plan, '   ', hoy), false);
  assert.ok(registrarCambio(plan, 'Se suspende el ejercicio por dolor de rodilla', hoy));
  const textos = plan.bitacora.map((b) => b.texto).join('\n');
  for (const t of [/sospecha clínica/, /diagnóstico confirmado.*antes: sospecha/, /prioridad alta/, /objetivo agregado/, /cumplido \(antes: pendiente\)/, /intervención agregada/, /en curso \(antes: planeada\)/, /retirada: Bastón/, /revaloración programada para el 10\/01\/2027/, /suspende el ejercicio/]) assert.match(textos, t);
  assert.equal(plan.bitacora.filter((b) => !b.auto).length, 1);
  quitarObjetivo(plan, o.id, hoy);
  assert.equal(plan.objetivos.length, 0);
  fijarProblema(plan, 'icope:cognicion', { estado: '' }, hoy, 'Cognición');
  assert.equal(plan.problemas.length, 0, 'se puede retirar la valoración del médico');
  assert.equal(CATEGORIAS_INTERVENCION.length, 17);
  assert.deepEqual(planDe({ plan: { objetivos: 'roto' } }).objetivos, [], 'tolera datos dañados');
});

test('informe ICOPE y nota: dominios por separado, plan decidido por el médico y aviso de adaptación', () => {
  const cog = guardado('icope-cog', resp('icope-cog', { filtro: 'Sí' }), { fecha: '2026-10-10' });
  const psi = guardado('icope-psi', EJEMPLOS['icope-psi'](), { fecha: '2026-10-10' });
  const fac = guardado('icope-fac', EJEMPLOS['icope-fac'](), { fecha: '2026-10-10' });
  const plan = planVacio();
  fijarProblema(plan, 'icope:cognicion', { estado: 'sospecha' }, hoy, 'Cognición');
  fijarPrioridad(plan, 'icope:cognicion', 'alta', hoy);
  agregarObjetivo(plan, 'icope:cognicion', { texto: 'Completar la evaluación cognitiva' }, hoy);
  agregarIntervencion(plan, 'icope:cognicion', { categoria: 'cognicion', texto: 'Estimulación cognitiva.' }, hoy);
  fijarPreferencias(plan, { importa: 'Vivir en su casa' });
  const v = valoracion([cog, psi, fac], { plan });
  const t = textoIcope(v, hoy);
  assert.match(t, /sin puntaje global/);
  assert.match(t, /- Cognición: alterado \(10\/10\/2026\): refiere problemas de memoria u orientación; evaluación detallada pendiente; valoración del médico: sospecha clínica\./);
  assert.match(t, /- Capacidad psicológica: conservado/);
  assert.match(t, /- Visión: pendiente de evaluación básica\./);
  assert.match(t, /Por explorar: siente soledad con frecuencia; problemas de control de la vejiga/);
  assert.match(t, /Evaluación detallada pendiente: cognición\./);
  assert.match(t, /Cognición \(prioridad alta\):\n- Objetivo: Completar la evaluación cognitiva; estado: pendiente\./);
  assert.match(t, /La OPS no respalda esta adaptación/);
  assert.doesNotMatch(t, /\d+\s*\/\s*6\b|puntaje (global|total) de|índice ICOPE/i, 'no hay puntaje global');
  assert.equal(estadoFactores(v).necesidades.length, 2);

  const completa = notaValoracion(v, porId, DOMINIOS, fecha, 'completa');
  assert.match(completa, /PLAN DE ATENCIÓN \(decidido por el médico\)/);
  assert.match(completa, /Cognición \(ICOPE\) \(prioridad alta\):/);
  assert.match(completa, /- Valoración del médico: sospecha clínica\./);
  assert.match(completa, /Lo que importa a la persona:\n- Lo que más le importa: Vivir en su casa\./);
  assert.match(completa, /ICOPE cognición/);
  const lista = notaValoracion(v, porId, DOMINIOS, fecha, 'lista');
  assert.match(lista, /\nPLAN DE ATENCIÓN\n/);
  const parrafo = notaValoracion(v, porId, DOMINIOS, fecha, 'parrafo');
  assert.match(parrafo, /Plan de atención: Cognición \(ICOPE\): prioridad alta; objetivos: Completar la evaluación cognitiva; intervenciones: Estimulación cognitiva\. Lo que más le importa: Vivir en su casa\./);
  assert.equal(lineasPlan(planVacio()).length, 0);
  assert.equal(nombreAmbitoIcope('icope:factores'), 'Necesidades adicionales');
  assert.equal(AMBITOS_ICOPE.length, 7);
  const sinPlan = notaValoracion(valoracion([cog]), porId, DOMINIOS, fecha, 'completa');
  assert.doesNotMatch(sinPlan, /PLAN DE ATENCIÓN/);
});
