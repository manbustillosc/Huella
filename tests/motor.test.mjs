// Pruebas del motor y de cada instrumento. Ejecutar con: node --test tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ESCALAS } from '../escalas/index.js';
import { DOMINIOS } from '../js/dominios.js';
import {
  calcular, validarEscala, validarBandasEnteras, resumenDe, resumenBreveDe, textoEscala, posicionMarcador,
  TIPOS, NIVELES, DIRECCIONES, NINGUNO, limpiarOcultas, mostrarSinCruzar, minutosDe, minusculaInicial,
} from '../js/motor.js';
import { letraKatz } from '../escalas/katz.js';
import { puntosMarcha, puntosSilla } from '../escalas/sppb.js';
import { tfgCkdEpi2021, categoriaTfg } from '../escalas/ckdepi.js';
import { depuracionCG, pesoIdeal } from '../escalas/cockcroft.js';
import { categoriaVelocidad } from '../escalas/velocidad-marcha.js';
import { escalas, porId, resp, calc, todos, EJEMPLOS } from './ayuda.mjs';

const REF = JSON.parse(readFileSync(new URL('./referencia-renal.json', import.meta.url), 'utf8'));

/* ---------- Estructura ---------- */

test('los 43 instrumentos están disponibles y bien definidos', () => {
  assert.equal(ESCALAS.length, 43);
  for (const e of ESCALAS) assert.deepEqual(validarEscala(e), [], e.id);
});

test('ids únicos, dominio, tipo, dirección clínica explícita y ficha completa', () => {
  const ids = new Set();
  for (const e of escalas) {
    assert.ok(!ids.has(e.id), `id repetido ${e.id}`);
    ids.add(e.id);
    assert.ok(DOMINIOS.some((d) => d.id === e.dominio), `${e.id}: dominio ${e.dominio}`);
    assert.ok(TIPOS[e.tipo], `${e.id}: tipo ${e.tipo}`);
    assert.ok(DIRECCIONES.includes(e.direccionClinica), `${e.id}: falta direccionClinica`);
    assert.ok(minutosDe(e), `${e.id}: tiempo sin minutos legibles`);
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

test('dirección clínica de los instrumentos citados en la Fase 1.1', () => {
  const d = (id) => porId[id].direccionClinica;
  assert.equal(d('barthel'), 'mayor_mejor');
  assert.equal(d('painad'), 'menor_mejor');
  assert.equal(d('tug'), 'menor_mejor');
  assert.equal(d('cfs'), 'menor_mejor');
  assert.equal(d('gds15'), 'menor_mejor');
  assert.equal(d('frail'), 'menor_mejor');
  assert.equal(d('velocidad'), 'mayor_mejor');
  assert.equal(d('sppb'), 'mayor_mejor');
  assert.equal(d('cockcroft'), 'sin_direccion');
  assert.equal(d('4at'), 'sin_direccion');
});

test('bandas enteras contiguas en instrumentos con cálculo propio', () => {
  assert.deepEqual(validarBandasEnteras(porId.cfs.bandas, 1, 9), []);
  assert.deepEqual(validarBandasEnteras(porId.ckdepi.bandas, 0, Infinity), []);
  assert.deepEqual(validarBandasEnteras(porId.cockcroft.bandas, 0, Infinity), []);
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
  assert.equal(calcular(porId.ckdepi, { _noEvaluable: 'x' }).completo, false, 'las calculadoras no admiten «no evaluable»');
  assert.equal(calcular(porId['4at'], { _noEvaluable: 'x' }).completo, false, 'el 4AT tiene su propio puntaje para lo no evaluable');
});

test('las siglas conservan la mayúscula al iniciar una frase en minúscula', () => {
  assert.equal(minusculaInicial('G3a · TFG'), 'G3a · TFG');
  assert.equal(minusculaInicial('CAM positivo'), 'CAM positivo');
  assert.equal(minusculaInicial('Dependencia grave'), 'dependencia grave');
});

/* ---------- Listas de verificación ---------- */

test('checklist: vacía queda pendiente; «Ninguno» confirma; positiva cuenta; luego modificada', () => {
  const base = { fatiga: 'Algo de tiempo', resistencia: 'No', aerobica: 'No', perdida: 'No' };
  const vacia = calc('frail', { ...base, enfermedades: [] });
  assert.equal(vacia.completo, false, 'lista sin marcas = sin responder');
  assert.ok(vacia.faltan.includes('enfermedades'));
  const sinClave = calc('frail', { ...base });
  assert.equal(sinClave.completo, false);
  const ninguno = calc('frail', { ...base, enfermedades: [NINGUNO] });
  assert.equal(ninguno.completo, true);
  assert.equal(ninguno.puntaje, 0);
  assert.match(textoEscala(porId.frail, ninguno, 'lista'), /ninguno de los anteriores/);
  const cinco = calc('frail', { ...base, enfermedades: ['hta', 'dm', 'epoc', 'ic', 'artritis'] });
  assert.equal(cinco.puntaje, 1);
  // Después se corrige: quedan 4 enfermedades → el componente deja de puntuar.
  const cuatro = calc('frail', { ...base, enfermedades: ['hta', 'dm', 'epoc', 'ic'] });
  assert.equal(cuatro.puntaje, 0);
  assert.equal(cuatro.extras.nEnf, 4);
  // Marcar «Ninguno» junto con elementos es una contradicción y no se calcula.
  const ambos = calc('frail', { ...base, enfermedades: ['hta', NINGUNO] });
  assert.equal(ambos.completo, false);
  assert.match(ambos.errores.enfermedades, /no ambos/);
});

test('todas las listas de verificación exigen confirmación explícita', () => {
  for (const e of escalas) {
    for (const c of e.campos.filter((x) => x.tipo === 'checklist' && !x.opcional)) {
      const r = calcular(e, { [c.id]: [] });
      assert.ok(r.faltan.includes(c.id), `${e.id}.${c.id}: una lista vacía no debe contar como respondida`);
    }
  }
});

/* ---------- Respuestas condicionales ---------- */

test('las respuestas ocultas no influyen en el resultado ni se guardan', () => {
  const r = resp('sppb', {
    eq_juntos: 'Lo intentó, menos de 10 s', eq_semi: 'Mantiene 10 s', eq_tandem: '10 s o más',
    marcha_estado: 'No se intentó por seguridad', marcha_1: 4, silla_pre: 'Se rehusó o no comprendió la instrucción', silla_estado: 'Sí', silla_t: 9,
  });
  const res = calcular(porId.sppb, r);
  assert.equal(res.puntaje, 0, 'semitándem, tándem, tiempos ocultos no suman');
  const limpio = limpiarOcultas(porId.sppb, r);
  for (const k of ['eq_semi', 'eq_tandem', 'marcha_1', 'silla_estado', 'silla_t']) assert.ok(!(k in limpio), `${k} oculto no se guarda`);
  assert.ok('eq_juntos' in limpio && 'marcha_estado' in limpio);
  const tug = limpiarOcultas(porId.tug, resp('tug', { estado: 'No puede realizarla', tiempo: 12 }));
  assert.ok(!('tiempo' in tug));
  const lawton = limpiarOcultas(porId.lawton, { ...todos('lawton', () => 0), telefono_motivo: 1 });
  assert.ok(!('telefono_motivo' in lawton), 'el motivo solo aplica si no realiza la actividad');
});

/* ---------- Funcional ---------- */

test('Barthel: 90 = dependencia moderada; andadera = 10 puntos; límites de Shah', () => {
  const r = todos('barthel', () => 0);
  r.comer = 1; r.banarse = 1;
  const res = calcular(porId.barthel, r);
  assert.equal(res.puntaje, 90);
  assert.equal(res.banda.etiqueta, 'Dependencia moderada');
  const desp = porId.barthel.campos.find((c) => c.id === 'deambulacion');
  assert.equal(desp.opciones.find((o) => /andadera/.test(o.texto)).valor, 10);
  assert.equal(calcular(porId.barthel, todos('barthel', () => 0)).banda.etiqueta, 'Independiente');
  const b = (n) => porId.barthel.bandas.find((x) => n >= x.min && n <= x.max).etiqueta;
  assert.equal(b(20), 'Dependencia total');
  assert.equal(b(21), 'Dependencia grave');
  assert.equal(b(60), 'Dependencia grave');
  assert.equal(b(61), 'Dependencia moderada');
  assert.equal(b(91), 'Dependencia escasa');
  assert.equal(b(99), 'Dependencia escasa');
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
  assert.equal(res.banda.etiqueta, 'Clase D: dependiente en baño, vestido, continencia');
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
  r.compras_motivo = 1;
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
  assert.equal(res.puntaje, 4);
  assert.equal(res.banda.etiqueta, 'Probable fragilidad');
  const sinPesos = calc('frail', { ...base, enfermedades: ['hta'], perdida: 'No' });
  assert.equal(sinPesos.puntaje, 2);
  assert.equal(sinPesos.banda.etiqueta, 'Probable prefragilidad');
  assert.equal(calc('frail', { ...base }).completo, false, 'sin pesos ni respuesta directa no se interpreta');
});

test('CFS: nivel 5 es fragilidad; 4 fragilidad muy leve', () => {
  assert.equal(calc('cfs', { nivel: '5 · Fragilidad leve' }).banda.hallazgo, true);
  assert.equal(calc('cfs', { nivel: '4 · Fragilidad muy leve' }).banda.etiqueta, 'Nivel 4: fragilidad muy leve');
  assert.equal(calc('cfs', { nivel: '3 · Manejándose bien' }).banda.hallazgo, false);
});

test('SARC-F: 3 negativo, 4 positivo', () => {
  const r = todos('sarcf', () => 0);
  r.fuerza = 2; r.escaleras = 1;
  assert.equal(calcular(porId.sarcf, r).banda.etiqueta, 'Baja probabilidad de sarcopenia');
  r.escaleras = 2;
  assert.equal(calcular(porId.sarcf, r).puntaje, 4);
  assert.equal(calcular(porId.sarcf, r).banda.etiqueta, 'Alta probabilidad de sarcopenia');
});

test('SPPB: puntos por tiempo justo antes, en y después de cada límite', () => {
  const casos4 = [[4.81, 4], [4.82, 3], [6.2, 3], [6.21, 2], [8.7, 2], [8.71, 1], [20, 1]];
  for (const [s, p] of casos4) assert.equal(puntosMarcha(s, 4), p, `4 m ${s} s`);
  const casos3 = [[3.61, 4], [3.62, 3], [4.65, 3], [4.66, 2], [6.52, 2], [6.53, 1]];
  for (const [s, p] of casos3) assert.equal(puntosMarcha(s, 3), p, `3 m ${s} s`);
  const silla = [[11.19, 4], [11.2, 3], [13.69, 3], [13.7, 2], [16.69, 2], [16.7, 1], [60, 1], [60.01, 0]];
  for (const [s, p] of silla) assert.equal(puntosSilla(s), p, `silla ${s} s`);
});

test('SPPB: ejemplo completo, 0 a 12 y velocidad registrada para otras pruebas', () => {
  const res = calc('sppb', {
    eq_juntos: 'Mantiene 10 s', eq_semi: 'Mantiene 10 s', eq_tandem: 'De 3 a 9.99 s',
    marcha_estado: 'Recorrido de 4 m', marcha_1: 5.6, marcha_2: 5.0,
    silla_pre: 'Sí', silla_estado: 'Sí', silla_t: 12,
  });
  assert.equal(res.puntaje, 9);
  assert.equal(res.banda.etiqueta, 'Limitación leve');
  assert.equal(res.extras.programa, 'C');
  assert.equal(res.extras.tiempoMarcha, 5, 'mejor de dos intentos');
  assert.equal(res.extras.distanciaMarcha, 4);
  assert.equal(res.extras.velocidad, 0.8);
  const max = calc('sppb', { eq_juntos: 'Mantiene 10 s', eq_semi: 'Mantiene 10 s', eq_tandem: '10 s o más', marcha_estado: 'Recorrido de 4 m', marcha_1: 3, silla_pre: 'Sí', silla_estado: 'Sí', silla_t: 9 });
  assert.equal(max.puntaje, 12);
});

test('SPPB: incapacidad, suspensión por seguridad y ausencia de dato son distintas', () => {
  const seguridad = calc('sppb', {
    eq_juntos: 'No se intentó por seguridad', marcha_estado: 'No se intentó por seguridad', silla_pre: 'Lo intentó, pero no pudo',
  });
  assert.equal(seguridad.completo, true);
  assert.equal(seguridad.puntaje, 0);
  assert.match(seguridad.lineas.join(' '), /pies juntos: no se intentó por seguridad/);
  assert.match(resumenDe(porId.sppb, seguridad), /sin completar: pies juntos: no se intentó por seguridad, marcha: no se intentó por seguridad, silla: lo intentó sin lograrlo/);
  // Sin dato: la marcha queda sin responder → el total no se calcula ni se interpreta como 0.
  const sinDato = calc('sppb', { eq_juntos: 'Mantiene 10 s', eq_semi: 'Lo intentó, menos de 10 s', silla_pre: 'Sí', silla_estado: 'Sí', silla_t: 12 });
  assert.equal(sinDato.completo, false);
  assert.ok(sinDato.faltan.includes('marcha_estado'));
  assert.equal(sinDato.banda, null);
  // Marcha elegida, pero sin tiempo: pendiente.
  const sinTiempo = calc('sppb', { eq_juntos: 'Mantiene 10 s', eq_semi: 'Lo intentó, menos de 10 s', marcha_estado: 'Recorrido de 4 m', silla_pre: 'Sí', silla_estado: 'Se suspendió por seguridad' });
  assert.ok(sinTiempo.faltan.includes('marcha_1'));
  // Tiempo de marcha imposible.
  const rapido = calc('sppb', { eq_juntos: 'Mantiene 10 s', eq_semi: 'Lo intentó, menos de 10 s', marcha_estado: 'Recorrido de 4 m', marcha_1: 1, silla_pre: 'Sí', silla_estado: 'Sí', silla_t: 10 });
  assert.equal(rapido.completo, false);
  assert.match(rapido.errores.marcha_1, /improbable/);
});

test('TUG: categorías del INGER, STEADI y límites', () => {
  const t = (s) => calc('tug', { estado: 'Sí', tiempo: s });
  assert.equal(t(9.9).banda.id, 'normal');
  assert.equal(t(10).banda.id, 'leve');
  assert.equal(t(13).banda.id, 'leve');
  assert.equal(t(13.1).banda.id, 'riesgo');
  assert.equal(t(11.9).extras.steadi, false);
  assert.equal(t(12).extras.steadi, true);
  assert.equal(t(20).extras.mayor20, false);
  assert.equal(t(20.1).extras.mayor20, true);
  const det = t(14).detalles[0];
  assert.equal(det.filas.length, 4);
  assert.match(t(14).lineas.join(' '), /no establece el riesgo de caídas/);
  assert.equal(calc('tug', { estado: 'No puede realizarla' }).banda.id, 'incapaz');
  assert.equal(calc('tug', { estado: 'Se suspendió por seguridad' }).extras.seguridad, true);
  assert.equal(calc('tug', { estado: 'Sí', tiempo: 2 }).completo, false, 'menos de 3 s es imposible');
});

test('Velocidad de marcha: se clasifica sin redondear justo debajo, en y sobre cada umbral', () => {
  assert.equal(categoriaVelocidad(0.999), 'riesgo');
  assert.equal(categoriaVelocidad(1.0), 'normal');
  assert.equal(categoriaVelocidad(1.001), 'normal');
  assert.equal(categoriaVelocidad(0.799), 'bajo');
  assert.equal(categoriaVelocidad(0.8), 'riesgo');
  assert.equal(categoriaVelocidad(0.801), 'riesgo');
  const vm = (d, s) => calc('velocidad', { distancia: d, tiempo: s });
  // 4 m en 5.02 s = 0.7968 m/s: con redondeo sería 0.80 (riesgo); sin redondear es bajo desempeño.
  const cerca = vm('4 metros', 5.02);
  assert.equal(cerca.banda.id, 'bajo');
  assert.equal(cerca.mostrar, '0.797', 'se muestran más decimales para no aparentar otra categoría');
  assert.ok(cerca.valor < 0.8, 'se guarda el valor sin redondear');
  // 4 m en 4.01 s = 0.9975: no se muestra como «1.00».
  assert.equal(vm('4 metros', 4.01).banda.id, 'riesgo');
  assert.notEqual(vm('4 metros', 4.01).mostrar, '1.00');
  assert.equal(vm('4 metros', 4).banda.id, 'normal');
  assert.equal(vm('4 metros', 5).banda.id, 'riesgo');
  assert.equal(vm('6 metros', 6).mostrar, '1.00');
  assert.match(vm('4 metros', 5).lineas.join(' '), /EWGSOP2: ≤0.8 m\/s/);
  assert.match(vm('4 metros', 5).lineas.join(' '), /no diagnostica sarcopenia/);
  assert.match(resumenDe(porId.velocidad, vm('6 metros', 8)), /en 6 m/);
  assert.equal(vm('4 metros', 1).completo, false, 'velocidad imposible (4 m/s)');
});

/* ---------- Nutrición, piel, dolor, social ---------- */

test('MNA-SF, Zarit y PAINAD: puntos de corte', () => {
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
  const pain = (n) => calcular(porId.painad, Object.fromEntries(porId.painad.campos.map((c, i) => [c.id, i < n ? 2 : 0]))).banda.min;
  assert.equal(pain(0), 0);
  assert.equal(pain(2), 4);
  assert.equal(pain(4), 7);
});

test('Braden: cortes por edad y sin expresiones absolutas de ausencia de riesgo', () => {
  const br = (vals, edad) => {
    const [a, b, c, d, e, f] = vals.map(String);
    return calc('braden', { percepcion: a, humedad: b, actividad: c, movilidad: d, nutricion: e, friccion: f, edad });
  };
  assert.equal(br([2, 2, 2, 2, 2, 2], 80).banda.id, 'alto');
  assert.equal(br([3, 2, 2, 3, 2, 2], 80).banda.id, 'medio');
  assert.equal(br([3, 3, 2, 3, 2, 2], 80).banda.id, 'bajo');
  assert.equal(br([3, 3, 3, 3, 3, 2], 70).banda.id, 'sin');
  assert.equal(br([3, 3, 3, 3, 3, 2], 80).banda.id, 'bajo');
  assert.equal(br([4, 3, 3, 3, 3, 3], 80).banda.id, 'sin');
  const sin = br([4, 3, 3, 3, 3, 3], 80);
  assert.equal(sin.banda.etiqueta, 'Sin riesgo elevado identificado por la escala');
  assert.match(sin.banda.texto, /no sustituye la inspección/i);
  assert.ok(!porId.braden.bandas.some((b) => b.etiqueta === 'Sin riesgo'));
  assert.match(br([1, 1, 2, 1, 2, 1], 80).lineas.join(' '), /riesgo muy alto/);
  assert.match(br([2, 2, 2, 2, 2, 2], 80).lineas.join(' '), /no sustituye la inspección/);
});

/* ---------- Calculadoras ---------- */

test('CKD-EPI 2021: coincide con una implementación independiente', () => {
  for (const [scr, edad, hombre, esperado] of REF.tfg) {
    assert.ok(Math.abs(tfgCkdEpi2021(scr, edad, !hombre) - esperado) < 1e-3, `Cr ${scr}, ${edad} años, ${hombre ? 'H' : 'M'}`);
  }
  assert.equal(Math.round(tfgCkdEpi2021(1.0, 50, false)), 92);
  assert.equal(Math.round(tfgCkdEpi2021(0.8, 60, true)), 84);
});

test('CKD-EPI 2021: categorías sin redondear, abiertas, unidades y extremos', () => {
  assert.equal(categoriaTfg(59.99), 'G3a');
  assert.equal(categoriaTfg(60), 'G2');
  assert.equal(categoriaTfg(89.99), 'G2');
  assert.equal(categoriaTfg(90), 'G1');
  assert.equal(categoriaTfg(14.5), 'G5');
  assert.equal(categoriaTfg(15), 'G4');
  assert.equal(categoriaTfg(29.9), 'G4');
  assert.equal(categoriaTfg(44.99), 'G3b');
  assert.equal(categoriaTfg(250), 'G1', 'sin límite artificial superior');
  // Un valor que redondea a 60 pero es menor de 60 se muestra con decimal y se clasifica G3a.
  assert.equal(mostrarSinCruzar(59.6, 0, categoriaTfg), '59.6');
  assert.equal(mostrarSinCruzar(59.4, 0, categoriaTfg), '59');
  const mg = calc('ckdepi', { creatinina: 1.0, edad: 70, sexo: 'Mujer' });
  const um = calc('ckdepi', { creatinina: 88.4, creatinina_u: 'umol', edad: 70, sexo: 'Mujer' });
  assert.ok(Math.abs(mg.valor - um.valor) < 1e-9);
  assert.equal(mg.banda.id, 'G2');
  assert.match(mg.banda.texto, /No indica enfermedad renal crónica/);
  const g4 = calc('ckdepi', { creatinina: 2.5, edad: 80, sexo: 'Hombre' });
  assert.equal(g4.banda.id, 'G4');
  assert.match(g4.banda.texto, /no confirma enfermedad renal crónica.*albuminuria/);
  assert.equal(calc('ckdepi', { creatinina: 1.0, edad: 15, sexo: 'Mujer' }).completo, false, 'menores de 18 no');
  assert.equal(calc('ckdepi', { creatinina: 0.1, edad: 70, sexo: 'Mujer' }).completo, false, 'creatinina imposible');
  assert.equal(calc('ckdepi', { creatinina: 30, edad: 70, sexo: 'Mujer' }).completo, false);
  const minimo = calc('ckdepi', { creatinina: 0.2, edad: 18, sexo: 'Hombre' });
  assert.ok(minimo.completo && Number.isFinite(minimo.valor) && minimo.banda.id === 'G1');
  assert.match(minimo.lineas.join(' '), /verifica la creatinina/);
  const maximo = calc('ckdepi', { creatinina: 25, edad: 120, sexo: 'Mujer' });
  assert.ok(maximo.completo && maximo.banda.id === 'G5');
  const noIndex = calc('ckdepi', { creatinina: 1.2, edad: 78, sexo: 'Hombre', peso: 70, talla: 170 });
  assert.ok(noIndex.extras.noIndexada > 0);
});

test('Cockcroft-Gault: fórmula y pesos contra una implementación independiente', () => {
  for (const [edad, peso, scr, mujer, esperado] of REF.cg) {
    assert.ok(Math.abs(depuracionCG(edad, peso, scr, mujer) - esperado) < 1e-3, `${edad} años, ${peso} kg, Cr ${scr}`);
  }
  for (const [talla, hombre, esperado] of REF.ibw) assert.ok(Math.abs(pesoIdeal(talla, !hombre) - esperado) < 1e-3, `talla ${talla}`);
  assert.equal(Math.round(depuracionCG(80, 60, 1.0, true)), 43);
});

test('Cockcroft-Gault: peso usado, tallas extremas, limitaciones y sin dosis', () => {
  const real = calc('cockcroft', { edad: 80, sexo: 'Mujer', creatinina: 1.0, peso: 60, peso_uso: 'Peso real' });
  assert.ok(Math.abs(real.valor - 42.5) < 1e-9, 'valor sin redondear');
  assert.equal(real.mostrar, '43');
  assert.match(real.lineas[0], /peso real/);
  assert.match(real.banda.texto, /no calcula ni recomienda dosis/);
  const sinTalla = calc('cockcroft', { edad: 80, sexo: 'Mujer', creatinina: 1.0, peso: 60, peso_uso: 'Peso ideal (requiere talla)' });
  assert.equal(sinTalla.completo, false);
  assert.match(sinTalla.errores.peso_uso, /requieren la talla/);
  const baja = calc('cockcroft', { edad: 80, sexo: 'Mujer', creatinina: 1.0, peso: 50, talla: 145, peso_uso: 'Peso ideal (requiere talla)' });
  assert.equal(baja.completo, false, 'Devine no se aplica con talla menor de 152.4 cm');
  assert.match(baja.errores.peso_uso, /152.4 cm/);
  const bajaReal = calc('cockcroft', { edad: 80, sexo: 'Mujer', creatinina: 1.0, peso: 50, talla: 145, peso_uso: 'Peso real' });
  assert.ok(bajaReal.completo);
  assert.equal(bajaReal.detalles[0].filas[1][1], 'No aplicable');
  const ideal = calc('cockcroft', { edad: 80, sexo: 'Mujer', creatinina: 1.0, peso: 60, talla: 160, peso_uso: 'Peso ideal (requiere talla)' });
  assert.ok(Math.abs(ideal.valor - depuracionCG(80, pesoIdeal(160, true), 1.0, true)) < 1e-9);
  assert.equal(ideal.detalles[0].filas.length, 3);
  const obeso = calc('cockcroft', { edad: 70, sexo: 'Hombre', creatinina: 1.0, peso: 120, talla: 170, peso_uso: 'Peso real' });
  assert.match(obeso.lineas.join(' '), /Obesidad/);
  const bajoPeso = calc('cockcroft', { edad: 70, sexo: 'Mujer', creatinina: 0.8, peso: 40, talla: 160, peso_uso: 'Peso ideal (requiere talla)' });
  assert.match(bajoPeso.lineas.join(' '), /Bajo peso/);
  assert.match(bajoPeso.lineas.join(' '), /menor que el ideal/);
  assert.equal(calc('cockcroft', { edad: 80, sexo: 'Mujer', creatinina: 1.0, peso: 10, peso_uso: 'Peso real' }).completo, false, 'peso imposible');
  // Categoría con el valor sin redondear: 29.6 mL/min no se muestra como «30».
  assert.equal(mostrarSinCruzar(29.6, 0, (x) => (x < 30 ? 'a' : 'b')), '29.6');
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
  for (const e of escalas) {
    assert.ok(EJEMPLOS[e.id], `falta ejemplo de ${e.id}`);
    const res = calcular(e, EJEMPLOS[e.id]());
    assert.ok(res.completo && res.banda, `${e.id} incompleto: ${res.faltan} ${JSON.stringify(res.errores)}`);
    const resumen = resumenDe(e, res);
    assert.ok(resumen.length > 8 && !/undefined|NaN|null|Infinity/.test(resumen), `${e.id}: ${resumen}`);
    const breve = resumenBreveDe(e, res);
    assert.ok(!/undefined|NaN|null|Infinity/.test(breve), `${e.id}: ${breve}`);
    assert.ok(!textoEscala(e, res, 'parrafo').includes('\n'), `${e.id}: párrafo con saltos`);
    assert.ok(!/undefined|NaN|Infinity/.test(textoEscala(e, res, 'lista')), `${e.id}: lista`);
    if (e.barra !== false && (res.puntaje != null || res.valor != null)) {
      const pos = posicionMarcador(e, res.puntaje ?? res.valor, res.banda);
      assert.ok(pos > 0 && pos < 1, `${e.id}: marcador ${pos}`);
    }
  }
});

test('sw.js guarda todos los archivos de la app, existen y la versión coincide', async () => {
  const { existsSync, readdirSync } = await import('node:fs');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const lista = [...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  for (const f of lista) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `no existe ${f}`);
  for (const dir of ['js', 'js/vistas', 'escalas']) {
    for (const f of readdirSync(new URL(`../${dir}/`, import.meta.url))) {
      if (f.endsWith('.js')) assert.ok(lista.includes(`${dir}/${f}`), `sw.js no incluye ${dir}/${f}`);
    }
  }
  const { VERSION } = await import('../js/datos.js');
  assert.match(sw, new RegExp(`huella-${VERSION.replace(/\./g, '\\.')}'`), 'la versión del service worker y la de la app deben coincidir');
});
