// Versión 2.11: sección «Desempeño físico» y pruebas nuevas (cinco levantadas, caminatas de 6 minutos y de 400 m,
// apoyo en un pie y alcance funcional). Datos ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DOMINIOS } from '../js/dominios.js';
import { ICONOS } from '../js/iconos.js';
import { DOMINIOS_NUCLEO, valorGuardado } from '../js/nota.js';
import { calcular, campoVisible } from '../js/motor.js';
import { promedioSilla5, esperado6m, categoriaAlcance, promedioMonopodal } from '../escalas/desempeno.js';
import { porId, resp, calc, guardado, EJEMPLOS } from './ayuda.mjs';

const cerca = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

test('Desempeño físico: sección propia con las pruebas movidas y enlaces desde Fragilidad y Caídas', () => {
  const ids = DOMINIOS.map((d) => d.id);
  assert.equal(ids.indexOf('desempeno'), ids.indexOf('fragilidad') + 1);
  const d = DOMINIOS.find((x) => x.id === 'desempeno');
  assert.equal(d.nombre, 'Desempeño físico');
  assert.ok(ICONOS.desempeno, 'tiene ícono');
  for (const id of ['sppb', 'velocidad', 'tug', 'tinetti', 'silla30', 'equilibrio4', 'dinamometria', 'silla5', 'caminata6', 'caminata400', 'monopodal', 'alcance']) {
    assert.equal(porId[id].dominio, 'desempeno', id);
  }
  for (const id of ['ewgsop2', 'vivifrail', 'fried', 'frail', 'cfs']) assert.equal(porId[id].dominio, 'fragilidad', id);
  for (const id of ['downton', 'shortFesi', 'lsa'].map((x) => (porId[x] ? x : null)).filter(Boolean)) assert.equal(porId[id].dominio, 'caidas', id);
  for (const dom of ['fragilidad', 'caidas']) {
    const rel = DOMINIOS.find((x) => x.id === dom).relacionadas;
    assert.ok(rel.length >= 4, dom);
    for (const id of rel) assert.equal(porId[id]?.dominio, 'desempeno', `${dom} → ${id}`);
  }
  assert.ok(DOMINIOS_NUCLEO.includes('desempeno'), 'la nota completa avisa si falta el desempeño físico');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.ok(sw.includes("'./escalas/desempeno.js'"));
});

test('Cinco levantadas: >15 s es fuerza baja (EWGSOP2), con ICOPE, AWGS, puntos del SPPB y promedio por edad', () => {
  const r = calc('silla5', { edad: 78, estado: 'Sí', tiempo: 16.4 });
  assert.equal(r.banda.id, 'baja');
  assert.equal(r.banda.hallazgo, true);
  assert.equal(r.extras.puntosSppb, 2);
  assert.equal(r.extras.promedio, 12.6);
  assert.ok(r.lineas.some((l) => /Promedio para 78 años \(Bohannon, 2006\): 12.6 s; este tiempo es peor que el promedio/.test(l)));
  assert.deepEqual(r.detalles[0].filas.map((f) => f[2]), ['Sí', 'Sí', 'Sí', '2 de 4', 'Peor que el promedio']);
  const limite = calc('silla5', { edad: 72, estado: 'Sí', tiempo: 15 });
  assert.equal(limite.banda.id, 'normal', 'exactamente 15 s no es fuerza baja');
  assert.ok(limite.lineas.some((l) => /Más de 14 s: en el tamizaje ICOPE/.test(l)));
  const rapido = calc('silla5', { edad: 65, estado: 'Sí', tiempo: 10.2 });
  assert.equal(rapido.extras.puntosSppb, 4);
  assert.deepEqual(rapido.detalles[0].filas.map((f) => f[2]).slice(0, 3), ['No', 'No', 'No']);
  const no = calc('silla5', { edad: 88, estado: 'No: usó los brazos, no completó las 5 o tardó más de 60 s' });
  assert.equal(no.banda.id, 'incapaz');
  assert.equal(no.extras.puntosSppb, 0);
  assert.equal(no.valor, null);
  assert.deepEqual(porId.silla5.siguientes.filter((x) => x.si(r)).map((x) => x.id), ['ewgsop2']);
  assert.deepEqual(porId.silla5.siguientes.filter((x) => x.si(rapido)).map((x) => x.id), []);
  assert.deepEqual([promedioSilla5(60), promedioSilla5(69), promedioSilla5(70), promedioSilla5(89), promedioSilla5(90)], [11.4, 11.4, 12.6, 14.8, null]);
  assert.equal(valorGuardado(guardado('silla5', EJEMPLOS.silla5())), '16.4 s (fuerza de las piernas baja según el EWGSOP2)');
  // Reutiliza el tiempo de la silla del SPPB.
  const v = porId.silla5.vinculos.find((x) => x.escala === 'sppb');
  assert.deepEqual(v.aplicar({ extras: { tiempoSilla: 12.3 } }), { estado: 0, tiempo: '12.3' });
  assert.notEqual(v.disponible({ extras: { tiempoSilla: null } }), true);
  assert.equal(campoVisible(porId.silla5.campos.find((c) => c.id === 'tiempo'), resp('silla5', { estado: 'Sí' })), true);
});

test('Caminata de 6 minutos: ecuaciones de Enright y Sherrill, límite inferior y cambio de Perera', () => {
  const m = esperado6m(false, 70, 170, 75);
  cerca(m.esperado, 7.57 * 170 - 5.02 * 70 - 1.76 * 75 - 309);
  cerca(m.limite, m.esperado - 153);
  const f = esperado6m(true, 76, 155, 62);
  cerca(f.esperado, 2.11 * 155 - 2.29 * 62 - 5.78 * 76 + 667);
  cerca(f.limite, f.esperado - 139);
  const r = calcular(porId.caminata6, EJEMPLOS.caminata6());
  assert.equal(r.banda.id, 'esperada');
  assert.equal(r.extras.esperado, 413);
  assert.equal(r.extras.limite, 274);
  assert.equal(r.extras.porcentaje, 75);
  assert.ok(r.lineas[0].startsWith('310 m en 6 minutos: 75 % del valor esperado.'));
  const baja = calc('caminata6', { sexo: 'Mujer', edad: 76, talla: 155, peso: 62, distancia: 250 });
  assert.equal(baja.banda.id, 'baja');
  const mayor = calc('caminata6', { sexo: 'Hombre', edad: 86, talla: 165, peso: 70, distancia: 300, oxigeno: 'Con oxígeno' });
  assert.equal(mayor.extras.extrapolado, true);
  assert.ok(mayor.lineas.some((l) => /con 86 años, el valor esperado es una extrapolación/.test(l)));
  assert.ok(mayor.lineas.includes('Caminó con oxígeno suplementario.'));
  assert.equal(porId.caminata6.cambioMinimo.valor, 20);
  assert.equal(porId.caminata6.cambioSustancial.valor, 50);
  assert.match(porId.caminata6.comparable({ extras: { oxigeno: false, auxiliar: null } }, { extras: { oxigeno: true, auxiliar: null } }).advertencia, /oxígeno/);
  assert.equal(porId.caminata6.comparable({ extras: { oxigeno: false, auxiliar: null } }, { extras: { oxigeno: false, auxiliar: null } }), null);
});

test('Caminata de 400 m: no completarla o tardar 6 minutos o más es desempeño bajo (EWGSOP2)', () => {
  const r = calcular(porId.caminata400, EJEMPLOS.caminata400());
  assert.equal(r.banda.id, 'lenta');
  assert.equal(r.valor, 385);
  assert.equal(r.mostrar, '6:25');
  const rapida = calc('caminata400', { completa: 'Sí', minutos: 5, segundos: 59 });
  assert.equal(rapida.banda.id, 'normal');
  assert.equal(calc('caminata400', { completa: 'Sí', minutos: 6, segundos: 0 }).banda.id, 'lenta');
  const no = calc('caminata400', { completa: 'No: se detuvo antes de los 400 m' });
  assert.equal(no.banda.id, 'nocompleta');
  assert.equal(no.extras.bajo, true);
  const muyLenta = calc('caminata400', { completa: 'Sí', minutos: 15, segundos: 30 });
  assert.ok(muyLenta.lineas.some((l) => /estudio LIFE/.test(l)));
  assert.deepEqual(porId.caminata400.siguientes.filter((x) => x.si(r)).map((x) => x.id), ['ewgsop2']);
});

test('Apoyo en un pie: menos de 5 s predice caídas con lesión (Vellas); promedios de Springer', () => {
  const r = calcular(porId.monopodal, EJEMPLOS.monopodal());
  assert.equal(r.banda.id, 'riesgo');
  assert.equal(r.extras.promedio, 9.4);
  assert.ok(r.lineas[0].includes('pierna derecha'));
  assert.equal(calc('monopodal', { edad: 70, tiempo: 5 }).banda.id, 'sin');
  assert.equal(calc('monopodal', { edad: 70, tiempo: 0 }).lineas[0], 'No logró despegar el pie.');
  assert.match(calc('monopodal', { edad: 66, tiempo: 45 }).lineas[0], /el máximo de la prueba/);
  assert.deepEqual([promedioMonopodal(65), promedioMonopodal(75), promedioMonopodal(95)], [32.1, 21.5, 9.4]);
});

test('Alcance funcional: cortes de Duncan (1992) en cm o pulgadas y promedios de Duncan (1990)', () => {
  const r = calcular(porId.alcance, EJEMPLOS.alcance());
  assert.equal(r.banda.id, 'moderado');
  assert.equal(r.extras.promedio, 33.4);
  assert.deepEqual([categoriaAlcance(15.24), categoriaAlcance(15.3), categoriaAlcance(25.39), categoriaAlcance(25.4)], ['alto', 'moderado', 'moderado', 'bajo']);
  const pulgadas = calc('alcance', { sexo: 'Hombre', edad: 80, puede: 'Sí', alcance: 6, alcance_u: 'in' });
  assert.equal(pulgadas.banda.id, 'alto');
  assert.equal(pulgadas.valor, 15.2);
  assert.match(pulgadas.lineas[0], /15.2 cm \(6 pulgadas\)/);
  assert.equal(calc('alcance', { sexo: 'Hombre', edad: 80, puede: 'Sí', alcance: 10, alcance_u: 'in' }).banda.id, 'bajo');
  const no = calc('alcance', { sexo: 'Mujer', edad: 84, puede: 'No pudo o no quiso inclinarse' });
  assert.equal(no.banda.id, 'nopuede');
  const mujer = calc('alcance', { sexo: 'Mujer', edad: 75, puede: 'Sí', alcance: 27 });
  assert.equal(mujer.banda.id, 'bajo');
  assert.ok(mujer.lineas.some((l) => /se derivaron en varones/.test(l)));
});

test('EWGSOP2 reutiliza las cinco levantadas y la caminata de 400 m sin romper resultados guardados', () => {
  const e = porId.ewgsop2;
  const opciones = e.campos.find((c) => c.id === 'desempeno_tipo').opciones.map((o) => o.texto);
  assert.deepEqual(opciones, ['Velocidad de marcha (m/s)', 'SPPB (puntos)', 'TUG (s)', 'No medido', 'Caminata de 400 m'], '«No medido» conserva su índice');
  const s5 = guardado('silla5', EJEMPLOS.silla5());
  const v5 = e.vinculos.find((x) => x.escala === 'silla5');
  assert.equal(v5.disponible(s5), true);
  assert.deepEqual(v5.aplicar(s5), { fuerza_tipo: 1, silla5: '16.4' });
  const c4 = guardado('caminata400', EJEMPLOS.caminata400());
  const v4 = e.vinculos.find((x) => x.escala === 'caminata400');
  assert.equal(v4.describir(c4), '400 m en 6:25 min');
  assert.deepEqual(v4.aplicar(c4), { desempeno_tipo: 4, c400: 1 });
  const r = calcular(e, { ...resp('ewgsop2', { sexo: 'Mujer', fuerza_tipo: 'Cinco levantadas de la silla (s)', silla5: 16.4, masa_tipo: 'ASM/talla² (kg/m²)', asmi: 5.1, metodo: 'DXA', desempeno_tipo: 'Caminata de 400 m', c400: 'No la completó o tardó 6 minutos o más' }) });
  assert.equal(r.banda.id, 'grave');
  assert.ok(r.lineas.some((l) => /caminata de 400 m no completada o en 6 min o más/.test(l)));
  // Un resultado guardado antes con «No medido» (índice 3) sigue calculando igual.
  const viejo = calcular(e, { sexo: 0, fuerza_tipo: 0, prension: '14', masa_tipo: 2, desempeno_tipo: 3 });
  assert.equal(viejo.banda.id, 'probable');
  assert.ok(viejo.lineas.includes('Desempeño: no medido.'));
});
