// Pruebas del motor y de cada instrumento. Ejecutar con: node --test tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { ESCALAS } from '../escalas/index.js';
import { DOMINIOS } from '../js/dominios.js';
import { RUTAS, pasosDe } from '../js/rutas.js';
import { normalizarEscala, calcular, validarEscala, validarBandasEnteras, resumenDe, resumenBreveDe, textoEscala, posicionMarcador, TIPOS, NIVELES } from '../js/motor.js';
import { letraKatz } from '../escalas/katz.js';
import { puntosMarcha, puntosSilla } from '../escalas/sppb.js';
import { tfgCkdEpi2021 } from '../escalas/ckdepi.js';
import { depuracionCG, pesoIdeal } from '../escalas/cockcroft.js';

const escalas = ESCALAS.map(normalizarEscala);
const porId = Object.fromEntries(escalas.map((e) => [e.id, e]));

// Construye respuestas a partir del texto de la opción (o un valor crudo para números y listas).
function resp(id, mapa) {
  const e = porId[id];
  const r = {};
  for (const [k, val] of Object.entries(mapa)) {
    const c = e.campos.find((x) => x.id === k);
    if (!c) { r[k] = val; continue; }
    if (c.tipo === 'opciones' && typeof val === 'string') {
      const i = c.opciones.findIndex((o) => o.texto === val);
      assert.ok(i >= 0, `${id}.${k}: no existe la opción «${val}»`);
      r[k] = i;
    } else r[k] = val;
  }
  return r;
}
const calc = (id, mapa, ctx) => calcular(porId[id], resp(id, mapa), ctx);
const todos = (id, idx) => Object.fromEntries(porId[id].campos.filter((c) => c.tipo === 'opciones' && !c.anotaA).map((c) => [c.id, idx(c)]));

/* ---------- Estructura ---------- */

test('cada instrumento está bien definido', () => {
  for (const e of ESCALAS) assert.deepEqual(validarEscala(e), [], e.id);
});

test('ids únicos, dominio y tipo válidos, ficha estandarizada completa', () => {
  const ids = new Set();
  for (const e of escalas) {
    assert.ok(!ids.has(e.id), `id repetido ${e.id}`);
    ids.add(e.id);
    assert.ok(DOMINIOS.some((d) => d.id === e.dominio), `${e.id}: dominio ${e.dominio}`);
    assert.ok(TIPOS[e.tipo], `${e.id}: tipo ${e.tipo}`);
    for (const k of ['nombre', 'corto', 'descripcion', 'objetivo', 'poblacion', 'tiempo']) assert.ok(e[k], `${e.id}: falta ${k}`);
    assert.ok(Array.isArray(e.aplicacion) && e.aplicacion.length, `${e.id}: faltan instrucciones`);
    assert.ok(e.referencias?.length, `${e.id}: faltan referencias`);
    assert.ok(e.notas?.length, `${e.id}: faltan limitaciones`);
    for (const b of e.bandas) {
      assert.ok(NIVELES.includes(b.nivel), `${e.id}/${b.etiqueta}: nivel`);
      assert.ok(b.texto || e.calcular, `${e.id}/${b.etiqueta}: falta interpretación`);
    }
  }
});

test('las rutas solo apuntan a instrumentos existentes con momentos válidos', () => {
  for (const r of RUTAS) {
    for (const p of pasosDe(r)) {
      if (p.plan) continue;
      assert.ok(porId[p.id], `${r.id}: ${p.id}`);
      if (p.momento) assert.ok(porId[p.id].momentos, `${r.id}: ${p.id} no admite momentos`);
    }
  }
});

test('bandas enteras contiguas en instrumentos con cálculo propio', () => {
  assert.deepEqual(validarBandasEnteras(porId.cfs.bandas, 1, 9), []);
  assert.deepEqual(validarBandasEnteras(porId.ckdepi.bandas, 0, 200), []);
  assert.deepEqual(validarBandasEnteras(porId.cockcroft.bandas, 0, 400), []);
  assert.deepEqual(validarBandasEnteras(porId.sppb.bandas, 0, 12), []);
});

/* ---------- Comportamiento general ---------- */

test('una respuesta incompleta nunca produce interpretación', () => {
  for (const e of escalas) {
    const res = calcular(e, {});
    assert.equal(res.completo, false, e.id);
    assert.equal(res.banda, null, e.id);
  }
  const parcial = calc('barthel', { comer: 'Independiente' });
  assert.equal(parcial.contestadas, 1);
  assert.equal(parcial.puntaje, 10);
});

test('valores numéricos imposibles se rechazan', () => {
  const res = calcular(porId.moca, resp('moca', { puntaje: 31, escolaridad: 'No, más de 12 años' }));
  assert.equal(res.completo, false);
  assert.match(res.errores.puntaje, /fuera del rango/);
  const res2 = calcular(porId.ckdepi, resp('ckdepi', { creatinina: 'abc', edad: 70, sexo: 'Mujer' }));
  assert.match(res2.errores.creatinina, /números/);
  const res3 = calcular(porId.moca, resp('moca', { puntaje: 24.5, escolaridad: 'No, más de 12 años' }));
  assert.match(res3.errores.puntaje, /entero/);
});

test('no evaluable se distingue de sin responder y no se interpreta', () => {
  const res = calcular(porId.moca, { _noEvaluable: 'Alteración del estado de alerta o delirium' });
  assert.equal(res.completo, true);
  assert.equal(res.banda.etiqueta, 'No evaluable');
  assert.equal(resumenDe(porId.moca, res), 'MoCA: no evaluable (alteración del estado de alerta o delirium).');
  // Las calculadoras no admiten «no evaluable»
  assert.equal(calcular(porId.ckdepi, { _noEvaluable: 'x' }).completo, false);
});

/* ---------- Funcional ---------- */

test('Barthel: 90 = dependencia moderada; andadera = 10 puntos', () => {
  const r = todos('barthel', () => 0);
  r.comer = 1; r.banarse = 1; // 5 + 0
  const res = calcular(porId.barthel, r);
  assert.equal(res.puntaje, 90);
  assert.equal(res.banda.etiqueta, 'Dependencia moderada');
  const desp = porId.barthel.campos.find((c) => c.id === 'deambulacion');
  assert.equal(desp.opciones.find((o) => /andadera/.test(o.texto)).valor, 10);
  assert.equal(calcular(porId.barthel, todos('barthel', () => 0)).banda.etiqueta, 'Independiente');
});

test('Katz: clasificación jerárquica A–H', () => {
  assert.equal(letraKatz([]), 'A');
  assert.equal(letraKatz(['continencia']), 'B');
  assert.equal(letraKatz(['bano', 'alimentacion']), 'C');
  assert.equal(letraKatz(['bano', 'vestido', 'continencia']), 'D');
  assert.equal(letraKatz(['bano', 'vestido', 'sanitario', 'alimentacion']), 'E');
  assert.equal(letraKatz(['bano', 'vestido', 'sanitario', 'transferencias', 'continencia']), 'F');
  assert.equal(letraKatz(['bano', 'vestido', 'sanitario', 'transferencias', 'continencia', 'alimentacion']), 'G');
  assert.equal(letraKatz(['vestido', 'sanitario']), 'H');
  const res = calc('katz', { bano: 'Dependiente', vestido: 'Dependiente', sanitario: 'Independiente', transferencias: 'Independiente', continencia: 'Dependiente', alimentacion: 'Independiente' });
  assert.equal(res.puntaje, 3);
  assert.equal(res.extras.letra, 'D');
  assert.equal(resumenDe(porId.katz, res), 'Katz D: 3/6 (dependiente en baño, vestido, continencia).');
});

test('Lawton: puntuación original, «no aplica» reduce el total, barrera anotada', () => {
  const r = todos('lawton', () => 0);
  const casa = porId.lawton.campos.find((c) => c.id === 'casa');
  r.casa = casa.opciones.findIndex((o) => o.texto === 'Necesita ayuda en todas las labores de la casa');
  assert.equal(calcular(porId.lawton, r).puntaje, 8, 'necesita ayuda en todas = 1 punto (original)');
  const comida = porId.lawton.campos.find((c) => c.id === 'comida');
  r.comida = comida.opciones.findIndex((o) => o.especial === 'no-aplica');
  const compras = porId.lawton.campos.find((c) => c.id === 'compras');
  r.compras = compras.opciones.findIndex((o) => o.texto === 'Necesita compañía para cualquier compra');
  r.compras_motivo = 1; // barrera
  const res = calcular(porId.lawton, r);
  assert.equal(res.puntaje, 6);
  assert.equal(res.max, 7);
  assert.match(resumenDe(porId.lawton, res), /6\/7 \(dependencia en 1 actividad: compras; por barrera ambiental o sociocultural: compras\); no aplica: preparación de la comida\./);
  assert.match(textoEscala(porId.lawton, res, 'lista'), /Hacer compras: necesita compañía para cualquier compra \(0\); por barrera ambiental/);
});

/* ---------- Cognitivo, afectivo y delirium ---------- */

test('Mini-Cog: 0–2 tamizaje positivo, 3–5 negativo', () => {
  assert.equal(calc('minicog', { palabras: '2 palabras', reloj: 'Anormal o se rehúsa' }).banda.hallazgo, true);
  assert.equal(calc('minicog', { palabras: '1 palabra', reloj: 'Normal' }).banda.etiqueta, 'Deterioro cognitivo poco probable');
});

test('MoCA: ajuste por escolaridad y punto de corte 26', () => {
  assert.equal(calc('moca', { puntaje: 25, escolaridad: 'Sí, 12 años o menos' }).banda.etiqueta, 'Dentro de lo esperado');
  assert.equal(calc('moca', { puntaje: 25, escolaridad: 'No, más de 12 años' }).banda.etiqueta, 'Probable trastorno cognitivo');
  assert.equal(calc('moca', { puntaje: 30, escolaridad: 'Sí, 12 años o menos' }).puntaje, 30);
});

test('GDS-15: ≥5 tamizaje positivo con necesidad de entrevista', () => {
  const todasNo = Object.fromEntries(porId.gds15.campos.map((c) => [c.id, 1]));
  const res = calcular(porId.gds15, todasNo);
  assert.equal(res.puntaje, 5);
  assert.equal(res.banda.etiqueta, 'Síntomas depresivos: tamizaje positivo');
  assert.match(res.banda.texto, /entrevista clínica/);
  assert.ok(!/depresión (leve|moderada|grave)/i.test(JSON.stringify(porId.gds15.bandas)));
});

test('4AT: cambio agudo solo = 4 → posible delirium con sugerencias', () => {
  const res = calc('4at', { alerta: 'Normal', amt4: 'Sin errores', atencion: '7 meses o más correctos', cambio: 'Sí' });
  assert.equal(res.puntaje, 4);
  assert.equal(res.banda.etiqueta, 'Posible delirium');
  assert.ok(res.banda.sugerencias.length >= 3);
});

test('CAM: algoritmo 1 + 2 + (3 o 4)', () => {
  const p = (a, b, c, d) => calc('cam', { agudo: a, inatencion: b, desorganizado: c, conciencia: d }).banda.id;
  assert.equal(p('Presente', 'Presente', 'Presente', 'Ausente'), 'pos');
  assert.equal(p('Presente', 'Presente', 'Ausente', 'Presente'), 'pos');
  assert.equal(p('Presente', 'Presente', 'Ausente', 'Ausente'), 'neg');
  assert.equal(p('Ausente', 'Presente', 'Presente', 'Presente'), 'neg');
  assert.equal(p('Presente', 'Ausente', 'Presente', 'Presente'), 'neg');
});

/* ---------- Fragilidad, movilidad y ejercicio ---------- */

test('FRAIL: pérdida de peso calculada, 5 enfermedades, puntos de corte', () => {
  const base = { fatiga: 'Todo el tiempo', resistencia: 'Sí', aerobica: 'No', enfermedades: ['hta', 'dm', 'epoc', 'ic', 'artritis'] };
  const res = calc('frail', { ...base, peso_actual: 57, peso_previo: 60 });
  assert.equal(res.puntaje, 4); // fatiga, resistencia, 5 enfermedades, 5 % de pérdida
  assert.equal(res.banda.etiqueta, 'Probable fragilidad');
  const sinPesos = calc('frail', { ...base, enfermedades: ['hta'], perdida: 'No' });
  assert.equal(sinPesos.puntaje, 2);
  assert.equal(sinPesos.banda.etiqueta, 'Probable prefragilidad');
  const faltaPerdida = calc('frail', { ...base });
  assert.equal(faltaPerdida.completo, false, 'sin pesos ni respuesta directa no se interpreta');
});

test('CFS: nivel 5 es fragilidad; 4 fragilidad muy leve', () => {
  assert.equal(calc('cfs', { nivel: '5 · Fragilidad leve' }).banda.hallazgo, true);
  assert.match(calc('cfs', { nivel: '4 · Fragilidad muy leve' }).banda.etiqueta, /Nivel 4/);
  assert.equal(calc('cfs', { nivel: '3 · Manejándose bien' }).banda.hallazgo, false);
});

test('SARC-F: ≥4 alta probabilidad', () => {
  const r = todos('sarcf', () => 0);
  r.fuerza = 2; r.escaleras = 2; // 2 + 2
  assert.equal(calcular(porId.sarcf, r).puntaje, 4);
  assert.equal(calcular(porId.sarcf, r).banda.etiqueta, 'Alta probabilidad de sarcopenia');
});

test('SPPB: puntos por tiempo en los límites', () => {
  assert.equal(puntosMarcha(4.81, 4), 4);
  assert.equal(puntosMarcha(4.82, 4), 3);
  assert.equal(puntosMarcha(6.20, 4), 3);
  assert.equal(puntosMarcha(6.21, 4), 2);
  assert.equal(puntosMarcha(8.70, 4), 2);
  assert.equal(puntosMarcha(8.71, 4), 1);
  assert.equal(puntosMarcha(3.61, 3), 4);
  assert.equal(puntosMarcha(6.53, 3), 1);
  assert.equal(puntosSilla(11.19), 4);
  assert.equal(puntosSilla(11.2), 3);
  assert.equal(puntosSilla(13.7), 2);
  assert.equal(puntosSilla(16.7), 1);
  assert.equal(puntosSilla(60), 1);
  assert.equal(puntosSilla(60.1), 0);
});

test('SPPB: ejemplo completo y equilibrio interrumpido', () => {
  const res = calc('sppb', {
    eq_juntos: 'Mantiene 10 s', eq_semi: 'Mantiene 10 s', eq_tandem: 'De 3 a 9.99 s',
    marcha_estado: 'Recorrido de 4 m', marcha_1: 5.6, marcha_2: 5.0,
    silla_pre: 'Sí', silla_estado: 'Sí', silla_t: 12,
  });
  assert.equal(res.puntaje, 9); // 3 + 3 + 3
  assert.equal(res.banda.etiqueta, 'Limitación leve');
  assert.equal(res.extras.programa, 'C');
  const res2 = calc('sppb', {
    eq_juntos: 'Menos de 10 s, no lo intenta o se rehúsa', eq_semi: 'Mantiene 10 s',
    marcha_estado: 'Incapaz o se rehúsa', silla_pre: 'No, o se rehúsa',
  });
  assert.equal(res2.puntaje, 0, 'el semitándem oculto no suma');
  assert.equal(res2.extras.programa, 'A');
});

test('TUG: categorías del INGER e incapacidad', () => {
  const t = (s) => calc('tug', { estado: 'Sí', tiempo: s }).banda.id;
  assert.equal(t(9.9), 'normal');
  assert.equal(t(10), 'leve');
  assert.equal(t(13), 'leve');
  assert.equal(t(13.1), 'riesgo');
  assert.equal(calc('tug', { estado: 'No puede realizarla' }).banda.id, 'incapaz');
});

test('Velocidad de marcha: 1.0, 0.8 y <0.8 m/s', () => {
  const vm = (d, s) => calc('velocidad', { distancia: d, tiempo: s });
  assert.equal(vm('4 metros', 4).banda.id, 'normal');
  assert.equal(vm('4 metros', 5).banda.id, 'riesgo');
  assert.equal(vm('4 metros', 5.2).banda.id, 'bajo');
  assert.equal(vm('6 metros', 6).mostrar, '1.00');
});

test('Vivifrail: programa según SPPB, caminata y riesgo de caídas', () => {
  const p = (m) => calc('vivifrail', m).extras.programa;
  assert.equal(p({ sppb: 2, riesgo: [] }), 'A');
  assert.equal(p({ sppb: 5, riesgo: ['caidas'] }), 'B + E');
  assert.equal(p({ sppb: 8, camina: '30 a 45 minutos', riesgo: [] }), 'C2');
  assert.equal(p({ sppb: 8, camina: 'Menos de 10 minutos', riesgo: ['demencia'] }), 'C1 + E');
  assert.equal(p({ sppb: 11, riesgo: [] }), 'D');
  assert.equal(calc('vivifrail', { sppb: 8, riesgo: [] }).completo, false, 'falta el tiempo de caminata');
});

/* ---------- Nutrición, piel, dolor, social ---------- */

test('MNA-SF, Zarit, Braden y PAINAD: puntos de corte', () => {
  const mna = (n) => calc('mnasf', { puntaje: n, variante: 'Índice de masa corporal (IMC)' }).banda.etiqueta;
  assert.equal(mna(7), 'Desnutrición');
  assert.equal(mna(8), 'Riesgo de desnutrición');
  assert.equal(mna(11), 'Riesgo de desnutrición');
  assert.equal(mna(12), 'Estado nutricional normal');
  const z = (n) => calc('zarit', { puntaje: n }).banda.etiqueta;
  assert.equal(z(46), 'Sin sobrecarga');
  assert.equal(z(47), 'Sobrecarga leve');
  assert.equal(z(55), 'Sobrecarga leve');
  assert.equal(z(56), 'Sobrecarga intensa');
  assert.equal(calc('zarit', { puntaje: 21 }).completo, false);
  const br = (vals, edad) => {
    const [a, b, c, d, e, f] = vals.map(String);
    return calc('braden', { percepcion: a, humedad: b, actividad: c, movilidad: d, nutricion: e, friccion: f, edad }).banda.id;
  };
  assert.equal(br([2, 2, 2, 2, 2, 2], 80), 'alto'); // 12
  assert.equal(br([3, 2, 2, 3, 2, 2], 80), 'medio'); // 14
  assert.equal(br([3, 3, 2, 3, 2, 2], 80), 'bajo'); // 15 en ≥75
  assert.equal(br([3, 3, 3, 3, 3, 2], 70), 'sin'); // 17 en <75
  assert.equal(br([3, 3, 3, 3, 3, 2], 80), 'bajo'); // 17 en ≥75
  assert.equal(br([4, 3, 3, 3, 3, 3], 80), 'sin'); // 19 en ≥75
  const pain = (n) => calcular(porId.painad, Object.fromEntries(porId.painad.campos.map((c, i) => [c.id, i < n ? 2 : 0]))).banda.min;
  assert.equal(pain(0), 0);
  assert.equal(pain(2), 4);
  assert.equal(pain(4), 7);
});

/* ---------- Calculadoras ---------- */

test('CKD-EPI 2021: fórmula, unidades y validación', () => {
  assert.equal(Math.round(tfgCkdEpi2021(1.0, 50, false)), 92);
  assert.equal(Math.round(tfgCkdEpi2021(0.8, 60, true)), 84);
  const mg = calc('ckdepi', { creatinina: 1.0, edad: 70, sexo: 'Mujer' });
  const um = calc('ckdepi', { creatinina: 88.4, creatinina_u: 'umol', edad: 70, sexo: 'Mujer' });
  assert.equal(mg.valor, um.valor);
  assert.equal(mg.banda.id, 'G2');
  assert.equal(calc('ckdepi', { creatinina: 2.5, edad: 80, sexo: 'Hombre' }).banda.id, 'G4');
  assert.equal(calc('ckdepi', { creatinina: 1.0, edad: 15, sexo: 'Mujer' }).completo, false, 'menores de 18 no');
});

test('Cockcroft-Gault: fórmula, peso ideal y ajustado', () => {
  assert.equal(Math.round(depuracionCG(80, 60, 1.0, true)), 43);
  assert.equal(Number(pesoIdeal(160, true).toFixed(1)), 52.4);
  const real = calc('cockcroft', { edad: 80, sexo: 'Mujer', creatinina: 1.0, peso: 60, peso_uso: 'Peso real' });
  assert.equal(real.valor, 43);
  const sinTalla = calc('cockcroft', { edad: 80, sexo: 'Mujer', creatinina: 1.0, peso: 60, peso_uso: 'Peso ideal (requiere talla)' });
  assert.equal(sinTalla.completo, false);
  const ideal = calc('cockcroft', { edad: 80, sexo: 'Mujer', creatinina: 1.0, peso: 60, talla: 160, peso_uso: 'Peso ideal (requiere talla)' });
  assert.equal(ideal.valor, Math.round(depuracionCG(80, pesoIdeal(160, true), 1.0, true)));
  assert.equal(ideal.detalles[0].filas.length, 3);
});

test('RCRI: clase II con riesgo recalibrado y tabla por desenlace', () => {
  const r = Object.fromEntries(porId.rcri.campos.map((c) => [c.id, 1]));
  r.creatinina = 0;
  const res = calcular(porId.rcri, r);
  assert.equal(res.banda.etiqueta, 'Clase II · riesgo bajo');
  assert.match(resumenDe(porId.rcri, res), /6\.0 %.*Factor: creatinina/);
  assert.equal(res.detalles[0].filas.length, 2);
});

/* ---------- Textos ---------- */

test('textos: resumen, breve y párrafo/lista para todos los instrumentos', () => {
  const ejemplos = {
    barthel: () => todos('barthel', () => 0), katz: () => todos('katz', () => 0), lawton: () => todos('lawton', () => 0),
    minicog: () => todos('minicog', () => 0), moca: () => resp('moca', { puntaje: 22, escolaridad: 'No, más de 12 años' }),
    gds15: () => todos('gds15', () => 0), '4at': () => todos('4at', () => 0), cam: () => todos('cam', () => 0),
    frail: () => resp('frail', { ...todos('frail', () => 0), enfermedades: [], perdida: 'No' }), cfs: () => todos('cfs', () => 4),
    sarcf: () => todos('sarcf', () => 1),
    sppb: () => resp('sppb', { eq_juntos: 'Mantiene 10 s', eq_semi: 'Mantiene 10 s', eq_tandem: '10 s o más', marcha_estado: 'Recorrido de 4 m', marcha_1: 4, silla_pre: 'Sí', silla_estado: 'Sí', silla_t: 10 }),
    vivifrail: () => resp('vivifrail', { sppb: 12, riesgo: [] }),
    tug: () => resp('tug', { estado: 'Sí', tiempo: 11 }), velocidad: () => resp('velocidad', { distancia: '4 metros', tiempo: 4 }),
    mnasf: () => resp('mnasf', { puntaje: 10, variante: 'Circunferencia de pantorrilla' }),
    braden: () => resp('braden', { percepcion: '3', humedad: '3', actividad: '3', movilidad: '3', nutricion: '3', friccion: '2', edad: 80 }),
    painad: () => todos('painad', () => 1), rcri: () => todos('rcri', () => 1), zarit: () => resp('zarit', { puntaje: 50 }),
    ckdepi: () => resp('ckdepi', { creatinina: 1.2, edad: 78, sexo: 'Hombre' }),
    cockcroft: () => resp('cockcroft', { edad: 78, sexo: 'Hombre', creatinina: 1.2, peso: 70, peso_uso: 'Peso real' }),
  };
  for (const e of escalas) {
    assert.ok(ejemplos[e.id], `falta ejemplo de ${e.id}`);
    const res = calcular(e, ejemplos[e.id]());
    assert.ok(res.completo && res.banda, `${e.id} incompleto: ${res.faltan} ${JSON.stringify(res.errores)}`);
    const resumen = resumenDe(e, res);
    assert.ok(resumen.length > 8 && !/undefined|NaN|null/.test(resumen), `${e.id}: ${resumen}`);
    const breve = resumenBreveDe(e, res);
    assert.ok(!/undefined|NaN|null/.test(breve), `${e.id}: ${breve}`);
    assert.ok(!textoEscala(e, res, 'parrafo').includes('\n'), `${e.id}: párrafo con saltos`);
    assert.ok(!/undefined|NaN/.test(textoEscala(e, res, 'lista')), `${e.id}: lista`);
    if (e.barra !== false && res.puntaje != null) {
      const pos = posicionMarcador(e, res.puntaje, res.banda);
      assert.ok(pos > 0 && pos < 1, `${e.id}: marcador ${pos}`);
    }
  }
});

test('sw.js guarda todos los archivos de la app y existen', async () => {
  const { readFileSync, existsSync, readdirSync } = await import('node:fs');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const lista = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  for (const f of lista) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `no existe ${f}`);
  for (const dir of ['js', 'js/vistas', 'escalas']) {
    for (const f of readdirSync(new URL(`../${dir}/`, import.meta.url))) {
      if (f.endsWith('.js')) assert.ok(lista.includes(`${dir}/${f}`), `sw.js no incluye ${dir}/${f}`);
    }
  }
});
