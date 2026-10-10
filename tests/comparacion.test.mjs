// Comparación longitudinal: dirección clínica, cronología, referencia y resultado vigente.
import test from 'node:test';
import assert from 'node:assert/strict';
import { NINGUNO } from '../js/motor.js';
import {
  clasificarCambio, compararResultados, ordenarCronologico, vigenteDe, referenciaDe,
  inconsistenciasCronologicas, amplitudDias, reactivosEmpeorados,
} from '../js/comparacion.js';
import { porId, resp, todos, guardado } from './ayuda.mjs';

// Resultado mínimo para comparar valores.
const r = (id, valor, extra = {}) => ({ escalaId: id, ...(Number.isInteger(valor) && !extra.continuo ? { puntaje: valor } : { valor }), ...extra });
const cambio = (id, a, b, ea = {}, eb = {}) => clasificarCambio(porId[id], r(id, a, ea), r(id, b, eb));

test('ejemplos de la Fase 1.1: dirección correcta de cada cambio', () => {
  const barthel = cambio('barthel', 95, 45);
  assert.equal(barthel.tipo, 'empeoramiento');
  assert.match(barthel.texto, /disminución de 50 puntos \(deterioro funcional/);

  const painad = cambio('painad', 8, 2);
  assert.equal(painad.tipo, 'mejoria');
  assert.match(painad.texto, /disminución de conductas sugestivas de dolor/);

  const tug = cambio('tug', 25, 12, { continuo: true }, { continuo: true });
  assert.equal(tug.tipo, 'mejoria');
  assert.match(tug.texto, /disminución de 13 s \(mejoría del tiempo\)/);

  const cfs = cambio('cfs', 7, 5);
  assert.equal(cfs.tipo, 'mejoria');
  assert.match(cfs.texto, /disminución de 2 niveles \(menor grado de fragilidad registrado, sujeto a interpretación clínica\)/);

  const gds = cambio('gds15', 12, 4);
  assert.equal(gds.tipo, 'mejoria');
  assert.match(gds.texto, /reducción de síntomas depresivos/);

  const frail = cambio('frail', 4, 2);
  assert.equal(frail.tipo, 'mejoria');
  assert.match(frail.texto, /reducción del número de componentes positivos/);
});

test('la dirección inversa también se interpreta correctamente', () => {
  assert.equal(cambio('barthel', 45, 95).tipo, 'mejoria');
  assert.equal(cambio('painad', 2, 8).tipo, 'empeoramiento');
  assert.equal(cambio('tug', 12, 25, { continuo: true }, { continuo: true }).tipo, 'empeoramiento');
  assert.equal(cambio('gds15', 4, 12).tipo, 'empeoramiento');
  assert.equal(cambio('frail', 2, 4).tipo, 'empeoramiento');
  assert.equal(cambio('zarit', 40, 60).tipo, 'empeoramiento');
  assert.equal(cambio('braden', 18, 12).tipo, 'empeoramiento', 'Braden menor = más riesgo');
  assert.equal(cambio('mnasf', 12, 7).tipo, 'empeoramiento');
  assert.equal(cambio('sarcf', 2, 6).tipo, 'empeoramiento');
});

test('sin cambio, sin dirección y no interpretable', () => {
  assert.equal(cambio('barthel', 60, 60).tipo, 'sin_cambio');
  const cg = cambio('cockcroft', 40.2, 55.8, { continuo: true }, { continuo: true });
  assert.equal(cg.tipo, 'sin_direccion');
  assert.match(cg.texto, /sin significado clínico uniforme: requiere valoración clínica/);
  const at = cambio('4at', 6, 0, { etiqueta: 'Posible delirium' }, { etiqueta: 'Delirium poco probable' });
  assert.equal(at.tipo, 'sin_direccion');
  assert.match(at.texto, /de «posible delirium» a «delirium poco probable»/);
  const ne = clasificarCambio(porId.moca, r('moca', 24), { escalaId: 'moca', noEvaluable: 'Se rehusó' });
  assert.equal(ne.tipo, 'no_interpretable');
  const cam = clasificarCambio(porId.cam, { etiqueta: 'CAM positivo' }, { etiqueta: 'CAM negativo' });
  assert.equal(cam.tipo, 'no_interpretable');
  assert.match(cam.texto, /de «CAM positivo» a «CAM negativo»/);
  // Lawton con distinto número de actividades aplicables: no se compara el puntaje.
  const lw = clasificarCambio(porId.lawton, { puntaje: 6, max: 8 }, { puntaje: 5, max: 7 });
  assert.equal(lw.tipo, 'no_interpretable');
  assert.match(lw.texto, /cambiaron las actividades aplicables/);
  // TUG que antes no podía realizarse: sin comparación numérica.
  const tug = clasificarCambio(porId.tug, { etiqueta: 'No puede realizar la prueba' }, { valor: 12, etiqueta: 'Discapacidad leve de la movilidad' });
  assert.equal(tug.tipo, 'no_interpretable');
});

test('variables continuas: se usa el valor sin redondear y el cambio mínimo publicado', () => {
  // 0.796 → 0.801: cruza el punto de corte, pero la diferencia es menor que el cambio pequeño significativo.
  const vm = cambio('velocidad', 0.796, 0.801, { continuo: true, etiqueta: 'Bajo desempeño físico' }, { continuo: true, etiqueta: 'Velocidad disminuida' });
  assert.equal(vm.tipo, 'sin_cambio');
  assert.match(vm.texto, /Perera, 2006/);
  assert.match(vm.texto, /al otro lado del punto de corte/);
  const vm2 = cambio('velocidad', 0.7, 0.85, { continuo: true }, { continuo: true });
  assert.equal(vm2.tipo, 'mejoria');
  assert.match(vm2.texto, /aumento de 0.15 m\/s/);
  assert.match(vm2.texto, /cambio sustancial/);
  const caida = cambio('velocidad', 1.1, 0.9, { continuo: true }, { continuo: true });
  assert.equal(caida.tipo, 'empeoramiento');
  assert.ok(caida.advertencias.some((a) => /0.15 m\/s/.test(a)));
  const distintos = cambio('velocidad', 0.9, 1.0, { continuo: true, extras: { distancia: 4 } }, { continuo: true, extras: { distancia: 6 } });
  assert.ok(distintos.advertencias.some((a) => /Recorridos distintos/.test(a)));
  // Pruebas cronometradas con décimas: 12.04 → 12.0 es «sin cambio» con resolución de 0.1 s.
  assert.equal(cambio('tug', 12.04, 12.0, { continuo: true }, { continuo: true }).tipo, 'sin_cambio');
  // SPPB: 1 punto o más es un cambio sustancial.
  assert.match(cambio('sppb', 7, 9).texto, /cambio sustancial/);
});

test('calculadoras: TFG con definición de KDIGO y Cockcroft-Gault con pesos distintos', () => {
  const tfg = clasificarCambio(porId.ckdepi, { valor: 62, etiqueta: 'G2 · TFG levemente disminuida' }, { valor: 44.4, etiqueta: 'G3b · TFG moderada a gravemente disminuida' });
  assert.equal(tfg.tipo, 'empeoramiento');
  assert.ok(tfg.advertencias.some((a) => /KDIGO/.test(a)));
  const leve = clasificarCambio(porId.ckdepi, { valor: 62, etiqueta: 'G2 · TFG levemente disminuida' }, { valor: 58, etiqueta: 'G3a · TFG leve a moderadamente disminuida' });
  assert.ok(!leve.advertencias.some((a) => /KDIGO/.test(a)), 'cambio de categoría sin caída ≥25 % no cumple la definición');
  const cg = clasificarCambio(porId.cockcroft, { valor: 40, extras: { peso: 'real' } }, { valor: 48, extras: { peso: 'ajustado' } });
  assert.ok(cg.advertencias.some((a) => /distinto peso/.test(a)));
});

test('orden cronológico: basal primero; después por fecha de aplicación, no por nombre del momento', () => {
  const basal = { momento: 'basal', fecha: '2026-10-09', fechaReferencia: '2026-09-25' };
  const ingreso = { momento: 'ingreso', fecha: '2026-10-01' };
  const egreso = { momento: 'egreso', fecha: '2026-10-05' };
  const actual = { momento: 'actual', fecha: '2026-10-08' };
  const lista = ordenarCronologico([actual, egreso, basal, ingreso]);
  assert.deepEqual(lista.map((x) => x.momento), ['basal', 'ingreso', 'egreso', 'actual']);
  assert.equal(vigenteDe([basal, ingreso, egreso, actual]), actual, 'el vigente es el más reciente por fecha, aunque exista egreso');
  assert.equal(referenciaDe(lista), basal);
  assert.equal(vigenteDe([basal]), basal);
  // Misma fecha: decide el momento clínico.
  const a = { momento: 'ingreso', fecha: '2026-10-01', guardado: 2 };
  const b = { momento: 'egreso', fecha: '2026-10-01', guardado: 1 };
  assert.equal(vigenteDe([b, a]), b);
  // Sin basal: la referencia es la primera aplicación.
  assert.equal(referenciaDe(ordenarCronologico([actual, ingreso])), ingreso);
});

test('aplicaciones repetidas sin momento se comparan por fecha', () => {
  const g1 = guardado('gds15', Object.fromEntries(porId.gds15.campos.map((c) => [c.id, c.puntua === 'si' ? 0 : 1])), { fecha: '2026-09-01' });
  const g2 = guardado('gds15', Object.fromEntries(porId.gds15.campos.map((c, i) => [c.id, i < 4 ? (c.puntua === 'si' ? 0 : 1) : (c.puntua === 'si' ? 1 : 0)])), { fecha: '2026-10-01' });
  assert.equal(g1.puntaje, 15);
  const cmp = compararResultados([g2, g1], porId.gds15);
  assert.equal(cmp.ref, g1);
  assert.equal(cmp.vigente, g2);
  assert.equal(cmp.ultima.vsRef.tipo, 'mejoria');
});

test('reactivos que empeoraron según la dirección del instrumento', () => {
  const pain = (vals) => guardado('painad', Object.fromEntries(porId.painad.campos.map((c, i) => [c.id, vals[i]])));
  const antes = pain([0, 0, 1, 0, 0]);
  const despues = pain([1, 0, 2, 0, 0]);
  assert.deepEqual(reactivosEmpeorados(porId.painad, antes, despues), ['respiración', 'expresión facial']);
  assert.deepEqual(reactivosEmpeorados(porId.painad, despues, antes), []);
  const b1 = guardado('barthel', todos('barthel', () => 0));
  const b2 = guardado('barthel', { ...todos('barthel', () => 0), banarse: 1 });
  assert.deepEqual(reactivosEmpeorados(porId.barthel, b1, b2), ['bañarse']);
  assert.deepEqual(reactivosEmpeorados(porId.cockcroft, b1, b2), [], 'sin dirección: no se señalan reactivos');
});

test('tres aplicaciones: cambio contra el basal y contra la previa', () => {
  const base = todos('barthel', () => 0);
  const basal = guardado('barthel', base, { momento: 'basal', fecha: '2026-10-01' });
  const ingreso = guardado('barthel', { ...base, vestirse: 2, deambulacion: 3 }, { momento: 'ingreso', fecha: '2026-10-01' });
  const egreso = guardado('barthel', { ...base, deambulacion: 1 }, { momento: 'egreso', fecha: '2026-10-08' });
  const cmp = compararResultados([egreso, ingreso, basal], porId.barthel);
  const u = cmp.ultima;
  assert.equal(u.r, egreso);
  assert.equal(u.vsRef.tipo, 'empeoramiento');
  assert.equal(u.vsRef.dif, -5);
  assert.equal(u.vsPrevio.tipo, 'mejoria');
  assert.equal(u.vsPrevio.dif, 20);
});

test('inconsistencias cronológicas y amplitud del episodio', () => {
  const avisos = inconsistenciasCronologicas([
    { momento: 'ingreso', fecha: '2026-10-05' },
    { momento: 'egreso', fecha: '2026-10-01' },
    { momento: 'basal', fecha: '2026-10-05', fechaReferencia: '2026-10-03' },
    { momento: 'actual', fecha: '2026-10-02' },
  ], porId.barthel);
  assert.ok(avisos.some((a) => /egreso .* anterior a la de ingreso/.test(a)));
  assert.ok(avisos.some((a) => /estado basal .* posterior/.test(a)));
  assert.ok(avisos.some((a) => /posterior al egreso/.test(a)));
  assert.equal(amplitudDias([{ fecha: '2026-01-01' }, { fecha: '2026-06-01' }, { momento: 'basal', fecha: '2025-01-01' }]), 151);
});

test('checklist «Ninguno» en un resultado guardado sigue comparándose', () => {
  const base = resp('frail', { fatiga: 'Todo el tiempo', resistencia: 'Sí', aerobica: 'Sí', perdida: 'Sí, 5 % o más' });
  const a = guardado('frail', { ...base, enfermedades: ['hta', 'dm', 'epoc', 'ic', 'artritis'] }, { fecha: '2026-09-01' });
  const b = guardado('frail', { ...base, enfermedades: [NINGUNO] }, { fecha: '2026-10-01' });
  assert.equal(a.puntaje, 5);
  assert.equal(b.puntaje, 4);
  assert.equal(compararResultados([a, b], porId.frail).ultima.vsRef.tipo, 'mejoria');
});
