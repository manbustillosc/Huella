// Fase 2, módulo A: cognición, afecto, delirium y conducta (RUDAS, CDR, FAST, PHQ-9, Cornell, NPI-Q, RASS, CAM-ICU).
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMINIOS } from '../js/dominios.js';
import { RUTAS, pasosDe } from '../js/rutas.js';
import { calcular, resumenDe, textoEscala, claseDe, CLASES, TIPOS } from '../js/motor.js';
import { clasificarCambio, isoDe } from '../js/comparacion.js';
import { notaValoracion, hallazgosYSugerencias } from '../js/nota.js';
import { ALERTA_REACTIVO_9 } from '../escalas/phq9.js';
import { CODIGOS_FAST } from '../escalas/fast.js';
import { estadioPorSumaCasillas } from '../escalas/cdr.js';
import { escalas, porId, resp, calc, todos, guardado, EJEMPLOS } from './ayuda.mjs';

const NUEVAS = ['rudas', 'cdr', 'fast', 'phq9', 'cornell', 'npiq', 'rass', 'camicu'];
const fecha = new Date(2026, 9, 10);

/* ---------- Estructura y clases ---------- */

test('módulo A: los 8 instrumentos existen, con ficha, referencias y clase visual', () => {
  for (const id of NUEVAS) {
    const e = porId[id];
    assert.ok(e, id);
    assert.ok(TIPOS[e.tipo] && CLASES[claseDe(e)], `${id}: tipo ${e.tipo}`);
    assert.ok(e.referencias.length >= 1 && e.notas.length >= 3, `${id}: referencias y limitaciones`);
  }
  assert.equal(claseDe(porId.cdr), 'estadificacion');
  assert.equal(claseDe(porId.fast), 'estadificacion');
  assert.equal(claseDe(porId.phq9), 'tamizaje');
  assert.equal(claseDe(porId.camicu), 'evaluacion');
  assert.equal(claseDe(porId.rcri), 'pronostico');
  assert.equal(claseDe(porId.ckdepi), 'calculadora');
  for (const e of escalas) assert.ok(CLASES[claseDe(e)], `${e.id}: sin clase`);
});

test('instrumentos con titular de derechos: se registra el resultado y se declara la licencia', () => {
  for (const id of ['rudas', 'cdr', 'cornell', 'npiq', 'moca', 'zarit', 'cfs', 'mnasf', 'braden']) {
    assert.equal(porId[id].registro, true, `${id}: debe ser registro`);
  }
  for (const id of ['rudas', 'cdr', 'cornell', 'npiq', 'fast', 'camicu']) assert.ok(porId[id].licencia?.texto, `${id}: licencia`);
  // Ningún registro reproduce reactivos: sus campos no son preguntas.
  for (const id of ['rudas', 'cdr', 'cornell', 'npiq']) {
    for (const c of porId[id].campos) assert.ok(!/\?$/.test(c.texto) || /descartó|Registrar/.test(c.texto), `${id}.${c.id}: «${c.texto}»`);
  }
});

/* ---------- RUDAS ---------- */

test('RUDAS: suma de 6 dominios; <23 tamizaje positivo; rangos por dominio', () => {
  const r = (lenguaje) => calc('rudas', { memoria: 6, orientacion: 5, praxis: 2, dibujo: 2, juicio: 3, lenguaje });
  assert.equal(r(4).puntaje, 22);
  assert.equal(r(4).banda.etiqueta, 'Tamizaje positivo');
  assert.equal(r(5).puntaje, 23);
  assert.equal(r(5).banda.etiqueta, 'Tamizaje negativo');
  assert.equal(calc('rudas', { memoria: 8, orientacion: 5, praxis: 2, dibujo: 3, juicio: 4, lenguaje: 8 }).puntaje, 30);
  const malo = calc('rudas', { memoria: 9, orientacion: 5, praxis: 2, dibujo: 2, juicio: 3, lenguaje: 4 });
  assert.ok(!malo.completo && malo.errores.memoria, 'memoria máximo 8');
  assert.match(resumenDe(porId.rudas, r(4)), /^RUDAS: 22\/30 \(tamizaje positivo\)/);
});

/* ---------- CDR ---------- */

test('CDR: global registrado, CDR-SB sumado y rangos de O\'Bryant sin recalcular el global', () => {
  const r = calc('cdr', { global: '1 · Demencia leve', casillas: 'Sí', m: '1', o: '1', j: '1', c: '1', h: '0.5', p: '0' });
  assert.equal(r.valor, 1);
  assert.equal(r.extras.sb, 4.5);
  assert.equal(r.banda.etiqueta, 'Demencia leve');
  assert.ok(!r.lineas.some((l) => l.includes('suele corresponder')), '4.5 corresponde a CDR 1');
  const dispar = calc('cdr', { global: '2 · Demencia moderada', casillas: 'Sí', m: '1', o: '1', j: '1', c: '1', h: '0.5', p: '0' });
  assert.equal(dispar.valor, 2, 'Huella no cambia el global asignado');
  assert.ok(dispar.lineas.some((l) => /verifica la asignación/.test(l)));
  const solo = calc('cdr', { global: '0.5 · Deterioro cuestionable o muy leve', casillas: 'No', m: '3' });
  assert.equal(solo.extras.sb, null, 'las casillas ocultas no cuentan');
  assert.ok(!porId.cdr.campos.find((c) => c.id === 'p').opciones.some((o) => o.valor === 0.5), 'cuidado personal no admite 0.5');
  assert.deepEqual([0, 0.5, 4, 4.5, 9, 9.5, 15.5, 16, 18].map(estadioPorSumaCasillas), [0, 0.5, 0.5, 1, 1, 2, 2, 3, 3]);
  const antes = guardado('cdr', EJEMPLOS.cdr());
  const despues = guardado('cdr', resp('cdr', { global: '2 · Demencia moderada', casillas: 'Sí', m: '2', o: '2', j: '2', c: '2', h: '2', p: '1' }));
  const c = clasificarCambio(porId.cdr, antes, despues);
  assert.equal(c.tipo, 'empeoramiento');
  assert.ok(c.advertencias.some((a) => /CDR-SB de 5 a 11/.test(a)), c.advertencias.join(' | '));
});

/* ---------- FAST ---------- */

test('FAST: 16 subestadios en orden; estadios 6 y 7 agrupan subestadios; avisos de no ordinalidad', () => {
  assert.deepEqual(CODIGOS_FAST, ['1', '2', '3', '4', '5', '6a', '6b', '6c', '6d', '6e', '7a', '7b', '7c', '7d', '7e', '7f']);
  const f = (estadio, extra = {}) => calc('fast', { estadio, ...extra });
  assert.equal(f('5 · elección de la ropa', { ordinal: 'Sí', otraCausa: 'No' }).banda.etiqueta, 'Estadio 5: demencia moderada');
  assert.equal(f('6a · vestido', { ordinal: 'Sí', otraCausa: 'No' }).banda.etiqueta, 'Estadio 6: demencia moderadamente grave');
  assert.equal(f('6e · continencia fecal', { ordinal: 'Sí', otraCausa: 'No' }).banda.etiqueta, 'Estadio 6: demencia moderadamente grave');
  assert.equal(f('7a · lenguaje limitado', { ordinal: 'Sí', otraCausa: 'No' }).banda.etiqueta, 'Estadio 7: demencia grave');
  const no = f('6d · continencia urinaria', { ordinal: 'No', otraCausa: 'Sí' });
  assert.equal(no.lineas.length, 2);
  assert.match(no.lineas.join(' '), /pierde validez/);
  assert.match(no.lineas.join(' '), /sobrestimar/);
  assert.ok(f('2 · déficit subjetivo').completo, 'en estadios iniciales no se pregunta por el orden');
  assert.match(resumenDe(porId.fast, f('6c · uso del sanitario', { ordinal: 'Sí', otraCausa: 'No' })), /FAST 6c \(demencia moderadamente grave; subestadio: uso del sanitario\)/);
  assert.ok(porId.fast.notas.some((n) => /Escala de Deterioro Global/.test(n)), 'se distingue de la GDS de Reisberg');
  const c = clasificarCambio(porId.fast, guardado('fast', resp('fast', { estadio: '6a · vestido', ordinal: 'Sí', otraCausa: 'No' })), guardado('fast', resp('fast', { estadio: '7a · lenguaje limitado', ordinal: 'Sí', otraCausa: 'No' })));
  assert.equal(c.tipo, 'empeoramiento');
});

/* ---------- PHQ-9 ---------- */

const phq = (valores, extra = {}) => {
  const ids = ['interes', 'animo', 'sueno', 'energia', 'apetito', 'culpa', 'concentracion', 'psicomotor', 'muerte'];
  const r = Object.fromEntries(ids.map((id, i) => [id, valores[i] ?? 0]));
  return calcular(porId.phq9, { ...r, ...extra });
};

test('PHQ-9: 0 a 27, categorías del INGER y tamizaje positivo desde 10', () => {
  const casos = [[0, 'Síntomas depresivos mínimos o ausentes'], [4, 'Síntomas depresivos mínimos o ausentes'], [5, 'Síntomas depresivos leves'],
    [9, 'Síntomas depresivos leves'], [10, 'Síntomas depresivos moderados'], [14, 'Síntomas depresivos moderados'],
    [15, 'Síntomas depresivos moderados a graves'], [19, 'Síntomas depresivos moderados a graves'], [20, 'Síntomas depresivos graves'], [27, 'Síntomas depresivos graves']];
  for (const [total, etiqueta] of casos) {
    const v = [3, 3, 3, 3, 3, 3, 3, 3].map((_, i) => Math.max(0, Math.min(3, total - i * 3)));
    const valores = [...v, 0];
    while (valores.reduce((a, b) => a + b, 0) < total) valores[8] += 1;
    const res = phq(valores, total > 0 ? { dificultad: 0 } : {});
    assert.equal(res.puntaje, total);
    assert.equal(res.banda.etiqueta, etiqueta, `total ${total}`);
    assert.equal(res.extras.positivo, total >= 10);
  }
  assert.ok(!phq([0, 0, 0, 0, 0, 0, 0, 0, 0]).desglose.some((d) => d.campo.id === 'dificultad'), 'la dificultad solo se pregunta si hay síntomas');
  assert.ok(!phq([1, 0, 0, 0, 0, 0, 0, 0, 0]).completo, 'con síntomas, la dificultad es obligatoria');
  assert.equal(phq([1, 0, 0, 0, 0, 0, 0, 0, 0], { dificultad: 3 }).puntaje, 1, 'la dificultad no suma');
  assert.match(porId.phq9.notas[0], /no diagnóstico/);
});

test('PHQ-9: el reactivo 9 positivo genera una alerta destacada, con cualquier total, que llega a la nota', () => {
  const res = phq([0, 0, 0, 0, 0, 0, 0, 0, 1], { dificultad: 0 });
  assert.equal(res.puntaje, 1);
  assert.equal(res.banda.nivel, 'bien', 'el total sigue siendo mínimo');
  assert.deepEqual(res.alertas, [ALERTA_REACTIVO_9]);
  assert.match(ALERTA_REACTIVO_9, /no equivale a un diagnóstico de riesgo suicida/);
  assert.match(resumenDe(porId.phq9, res), /reactivo 9 positivo/);
  assert.deepEqual(phq([3, 3, 0, 0, 0, 0, 0, 0, 0], { dificultad: 1 }).alertas, []);
  const g = guardado('phq9', { interes: 0, animo: 0, sueno: 0, energia: 0, apetito: 0, culpa: 0, concentracion: 0, psicomotor: 0, muerte: 2, dificultad: 0 }, { fecha: '2026-10-10' });
  const { alertas, hallazgos } = hallazgosYSugerencias({ resultados: [g] }, porId, '2026-10-10');
  assert.equal(alertas.length, 1);
  assert.equal(hallazgos.length, 0);
  const nota = notaValoracion({ resultados: [g] }, porId, DOMINIOS, fecha, 'completa');
  const s4 = nota.slice(nota.indexOf('4. HALLAZGOS'));
  assert.match(s4, /- ALERTA: PHQ-9: Reactivo 9 positivo/);
  assert.ok(!/Sin hallazgos que requieran atención/.test(s4), 'con alerta no se afirma que no haya hallazgos');
});

/* ---------- Cornell ---------- */

test('Cornell: puntos de corte 6, 11 y 19; reactivos no evaluables como límite inferior; delirium y entrevistas', () => {
  const c = (A, B, C, D, E, na = 0, extra = {}) => calc('cornell', { entrevista: 'Informante y paciente', sA: A, sB: B, sC: C, sD: D, sE: E, na, delirium: 'Sí', ...extra });
  assert.equal(c(2, 1, 1, 1, 0).banda.etiqueta, 'Sin síntomas depresivos significativos');
  assert.equal(c(2, 1, 1, 1, 1).banda.etiqueta, 'Síntomas depresivos por debajo del punto de corte');
  assert.equal(c(4, 2, 1, 2, 1).banda.etiqueta, 'Síntomas depresivos por debajo del punto de corte');
  assert.equal(c(4, 2, 1, 2, 2).banda.etiqueta, 'Probable depresión mayor');
  assert.equal(c(6, 4, 3, 3, 2).banda.etiqueta, 'Probable depresión mayor');
  assert.equal(c(6, 4, 3, 3, 3).banda.etiqueta, 'Rango de depresión mayor definida');
  const lim = c(4, 2, 1, 2, 0, 1);
  assert.equal(lim.puntaje, 9);
  assert.ok(lim.lineas.some((l) => /es un mínimo \(podría llegar a 11\) y la categoría podría ser «probable depresión mayor»/.test(l)), lim.lineas.join(' | '));
  const imposible = c(8, 8, 6, 8, 8, 2);
  assert.ok(!imposible.completo && imposible.errores.na);
  assert.ok(c(1, 1, 1, 1, 1, 0, { delirium: 'No: hay delirium o sospecha' }).lineas.some((l) => /no interpretes/.test(l)));
  assert.ok(c(1, 1, 1, 1, 1, 0, { entrevista: 'Solo informante' }).lineas.some((l) => /Solo se entrevistó al informante/.test(l)));
  assert.ok(porId.cornell.notas.some((n) => /apatía/.test(n) && /delirium/.test(n)));
  const a = guardado('cornell', resp('cornell', { entrevista: 'Informante y paciente', sA: 4, sB: 2, sC: 1, sD: 2, sE: 1, na: 0, delirium: 'Sí' }));
  const b = guardado('cornell', resp('cornell', { entrevista: 'Informante y paciente', sA: 2, sB: 1, sC: 1, sD: 1, sE: 1, na: 3, delirium: 'Sí' }));
  const cmb = clasificarCambio(porId.cornell, a, b);
  assert.equal(cmb.tipo, 'mejoria');
  assert.ok(cmb.advertencias.some((x) => /no evaluables cambió/.test(x)));
});

/* ---------- NPI-Q ---------- */

const npi = (presentes = {}) => {
  const base = Object.fromEntries(['delirios', 'alucinaciones', 'agitacion', 'depresion', 'ansiedad', 'euforia', 'apatia', 'desinhibicion', 'irritabilidad', 'motora', 'sueno', 'apetito'].map((id) => [id, 'No']));
  const extra = {};
  for (const [id, [g, a]] of Object.entries(presentes)) {
    extra[id] = 'Sí';
    extra[`${id}_g`] = ['1 · Leve', '2 · Moderada', '3 · Grave'][g - 1];
    extra[`${id}_a`] = ['0 · Nada', '1 · Mínima', '2 · Leve', '3 · Moderada', '4 · Grave', '5 · Extrema'][a];
  }
  return resp('npiq', { ...base, ...extra });
};

test('NPI-Q: gravedad y angustia por separado, síntomas predominantes y sin puntos de corte inventados', () => {
  const sin = calcular(porId.npiq, npi());
  assert.equal(sin.banda.etiqueta, 'Sin síntomas neuropsiquiátricos referidos');
  assert.equal(sin.puntaje, 0);
  const r = calcular(porId.npiq, npi({ agitacion: [3, 5], alucinaciones: [2, 3], apatia: [1, 0] }));
  assert.equal(r.extras.gravedad, 6);
  assert.equal(r.extras.angustia, 8);
  assert.equal(r.puntaje, 6, 'el puntaje principal es la gravedad');
  assert.match(r.lineas.join(' '), /Predomina: agitación o agresividad \(grave\)/);
  assert.match(r.lineas.join(' '), /Angustia grave o extrema del cuidador por: agitación o agresividad/);
  const todo = calcular(porId.npiq, npi(Object.fromEntries(['delirios', 'alucinaciones', 'agitacion', 'depresion', 'ansiedad', 'euforia', 'apatia', 'desinhibicion', 'irritabilidad', 'motora', 'sueno', 'apetito'].map((id) => [id, [3, 5]]))));
  assert.equal(todo.extras.gravedad, 36);
  assert.equal(todo.extras.angustia, 60);
  const oculto = calcular(porId.npiq, { ...npi(), delirios_g: 2, delirios_a: 4 });
  assert.equal(oculto.extras.gravedad, 0, 'sin presencia, gravedad y angustia no cuentan');
  assert.ok(porId.npiq.notas[0].includes('No hay puntos de corte validados'));
  const a = guardado('npiq', npi({ agitacion: [3, 5] }));
  const b = guardado('npiq', npi({ agitacion: [1, 1], sueno: [2, 3] }));
  const c = clasificarCambio(porId.npiq, a, b);
  assert.equal(c.tipo, 'sin_cambio', 'gravedad total 3 → 3');
  const adv = clasificarCambio(porId.npiq, a, guardado('npiq', npi({ sueno: [1, 2] }))).advertencias.join(' ');
  assert.match(adv, /Síntomas nuevos: sueño y conducta nocturna/);
  assert.match(adv, /ya no se refieren: agitación o agresividad/);
  assert.match(adv, /Angustia del cuidador de 5 a 2/);
});

/* ---------- RASS y CAM-ICU ---------- */

test('RASS: diez niveles de +4 a −5, signo explícito y sin dirección clínica uniforme', () => {
  const niveles = porId.rass.campos[0].opciones.map((o) => o.valor);
  assert.deepEqual(niveles, [4, 3, 2, 1, 0, -1, -2, -3, -4, -5]);
  assert.equal(porId.rass.direccionClinica, 'sin_direccion');
  const r = calc('rass', { nivel: '−4 · Sedación profunda' });
  assert.equal(r.mostrar, '−4');
  assert.match(r.banda.texto, /no puede evaluarse el delirium con CAM-ICU/);
  assert.equal(calc('rass', { nivel: '+2 · Agitado' }).mostrar, '+2');
  assert.equal(resumenDe(porId.rass, calc('rass', { nivel: '0 · Alerta y tranquilo' })), 'RASS 0 (alerta y tranquilo).');
});

const cam = (m) => calc('camicu', m);

test('CAM-ICU: con RASS −4 o −5 es no evaluable, nunca negativo', () => {
  for (const nivel of ['−4 · Sedación profunda', '−5 · No despertable']) {
    const r = cam({ rass: nivel, agudo: 'Ausente', inatencion: 0 });
    assert.ok(r.completo);
    assert.ok(r.noEvaluable, nivel);
    assert.notEqual(r.banda.id, 'neg');
    assert.match(resumenDe(porId.camicu, r), /no evaluable/);
    const g = guardado('camicu', resp('camicu', { rass: nivel }));
    assert.ok(g.noEvaluable && !/negativo/.test(g.resumen));
  }
  assert.ok(!cam({ rass: '−3 · Sedación moderada' }).completo, 'con −3 sí se evalúan los rasgos');
});

test('CAM-ICU: algoritmo 1 + 2 + (3 o 4) con umbrales de errores', () => {
  assert.equal(cam({ rass: '0 · Alerta y tranquilo', agudo: 'Ausente' }).banda.id, 'neg', 'sin rasgo 1');
  assert.equal(cam({ rass: '0 · Alerta y tranquilo', agudo: 'Presente', inatencion: 2 }).banda.id, 'neg', '2 errores no es inatención');
  assert.ok(!cam({ rass: '0 · Alerta y tranquilo', agudo: 'Presente', inatencion: 3 }).completo, 'con RASS 0 hace falta el rasgo 4');
  assert.equal(cam({ rass: '0 · Alerta y tranquilo', agudo: 'Presente', inatencion: 3, desorganizado: 1 }).banda.id, 'neg', '1 error no es desorganización');
  assert.equal(cam({ rass: '0 · Alerta y tranquilo', agudo: 'Presente', inatencion: 3, desorganizado: 2 }).banda.id, 'pos');
  const r3 = cam({ rass: '−2 · Sedación ligera', agudo: 'Presente', inatencion: 5 });
  assert.equal(r3.banda.id, 'pos', 'RASS distinto de 0 es el rasgo 3');
  assert.equal(r3.extras.r4, null, 'no se pide el rasgo 4');
  assert.equal(cam({ rass: '+1 · Inquieto', agudo: 'Presente', inatencion: 3, desorganizado: 0 }).banda.id, 'pos', 'el rasgo 4 oculto no cuenta');
  assert.match(textoEscala(porId.camicu, r3, 'parrafo'), /Rasgo 3 \(nivel de conciencia alterado\): presente \(RASS −2\)/);
});

test('CAM-ICU: solo usa una RASS de hoy y con confirmación; no es intercambiable con el CAM', () => {
  const vin = porId.camicu.vinculos.find((x) => x.id === 'rass');
  const hoy = guardado('rass', resp('rass', { nivel: '−2 · Sedación ligera' }), { fecha: isoDe(new Date()) });
  const ayer = guardado('rass', resp('rass', { nivel: '−2 · Sedación ligera' }), { fecha: '2020-01-01' });
  assert.equal(vin.disponible(hoy), true);
  assert.match(vin.disponible(ayer), /no es de hoy/);
  const aplicado = vin.aplicar(hoy);
  assert.equal(porId.camicu.campos[0].opciones[aplicado.rass].valor, -2);
  assert.notEqual(porId.camicu.id, porId.cam.id);
  assert.ok(porId.camicu.notas.some((n) => /No es intercambiable con el CAM/.test(n)));
});

/* ---------- Integración ---------- */

test('rutas y dominios: el módulo A sustituye los planes y no quedan planes de instrumentos ya disponibles', () => {
  const ruta = (id) => RUTAS.find((r) => r.id === id);
  const comp = (id) => pasosDe(ruta(id)).filter((p) => p.complementario).map((p) => p.id);
  assert.ok(comp('hospital').includes('rass') && comp('hospital').includes('camicu'));
  for (const id of ['rudas', 'cdr', 'fast', 'npiq', 'cornell']) assert.ok(comp('cognitiva').includes(id), `cognitiva: ${id}`);
  assert.ok(comp('rapida').includes('phq9'));
  assert.ok(!pasosDe(ruta('rapida')).some((p) => !p.complementario && !p.plan && p.id === 'phq9'), 'PHQ-9 no duplica a la GDS-15 en el núcleo');
  const cortos = new Set(escalas.map((e) => e.corto.toLowerCase()));
  const planes = [...RUTAS.flatMap((r) => r.planes || []), ...DOMINIOS.flatMap((d) => d.planeadas)];
  for (const p of planes) assert.ok(!cortos.has(p.replace(/ \(registro\)$/, '').toLowerCase()), `plan ya disponible: ${p}`);
});

test('siguiente paso sugerido: apunta a instrumentos existentes y tolera resultados no evaluables', () => {
  for (const e of escalas) {
    for (const s of e.siguientes || []) {
      assert.ok(porId[s.id] && s.id !== e.id, `${e.id} → ${s.id}`);
      assert.ok(s.motivo?.length > 15, `${e.id} → ${s.id}: motivo`);
      const ej = calcular(e, EJEMPLOS[e.id]());
      assert.equal(typeof s.si(ej), 'boolean', `${e.id} → ${s.id}`);
      const ne = calcular(e, { _noEvaluable: 'Se rehusó' });
      if (e.permiteNoEvaluable) assert.equal(typeof s.si(ne), 'boolean');
    }
  }
  const rass = calc('rass', { nivel: '−3 · Sedación moderada' });
  assert.ok(porId.rass.siguientes[0].si(rass), 'RASS −3 sugiere CAM-ICU');
  assert.ok(!porId.rass.siguientes[0].si(calc('rass', { nivel: '−4 · Sedación profunda' })), 'RASS −4 no');
  const mc = calcular(porId.minicog, EJEMPLOS.minicog());
  assert.equal(porId.minicog.siguientes.every((s) => s.si(mc)), Boolean(mc.banda.hallazgo), 'Mini-Cog positivo sugiere MoCA o RUDAS');
});
