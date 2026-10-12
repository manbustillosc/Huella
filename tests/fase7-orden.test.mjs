// Versión 2.6: en las escalas cognitivas y funcionales, los resultados presentan primero lo que la persona logra por
// completo, después lo que logra en parte y al final lo que no logra.
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular, textoEscala, resumenDe, ordenarPorLogro, ordenarPorCapacidad, nivelLogro, NINGUNO } from '../js/motor.js';
import { escalas, porId, resp, calc, todos, EJEMPLOS } from './ayuda.mjs';

// Comprueba que los textos aparecen en ese orden dentro de t.
function enOrden(t, ...partes) {
  let desde = -1;
  for (const p of partes) {
    const i = t.indexOf(p, desde + 1);
    assert.ok(i > desde, `«${p}» debería aparecer después de lo anterior en:\n${t}`);
    desde = i;
  }
}

test('ordenarPorLogro: completas, parciales y nulas, conservando el orden dentro de cada grupo', () => {
  const x = [['a', 0.5], ['b', 0], ['c', 1], ['d', 0.2], ['e', 1]];
  assert.deepEqual(ordenarPorLogro(x, (p) => p[1]).map((p) => p[0]), ['c', 'e', 'a', 'd', 'b']);
  assert.deepEqual([1, 0.999, 0.5, 0.001, 0].map(nivelLogro), [0, 0, 1, 2, 2]);
});

test('cada configuración de orden apunta a reactivos existentes, solo en escalas cognitivas y funcionales', () => {
  const con = escalas.filter((e) => e.ordenCapacidad);
  assert.deepEqual(con.map((e) => e.id).sort(), ['barthel', 'cdr', 'icope-cog', 'isaacs', 'katz', 'lawton', 'minicog', 'mmse', 'moca', 'pfeffer', 'reloj', 'rudas'].sort());
  for (const e of con) {
    assert.ok(['cognitivo', 'funcional'].includes(e.dominio), e.id);
    assert.ok(['alto', 'bajo'].includes(e.ordenCapacidad.mejor), e.id);
    for (const id of e.ordenCapacidad.campos) assert.ok(e.campos.some((c) => c.id === id), `${e.id}.${id}`);
    if (e.ordenCapacidad.etiquetas) assert.equal(e.ordenCapacidad.etiquetas.length, 4, e.id);
  }
});

test('Barthel: independiente, luego con ayuda y al final dependiente, en lista y en párrafo', () => {
  const r = resp('barthel', {
    ...todos('barthel', () => 0),
    comer: 'Dependiente', vestirse: 'Necesita ayuda', escalones: 'Dependiente', traslado: 'Gran ayuda',
  });
  const res = calcular(porId.barthel, r);
  const lista = textoEscala(porId.barthel, res, 'lista');
  enOrden(lista, 'Independiente:', '- Bañarse', 'Con ayuda o de forma parcial:', '- Vestirse: necesita ayuda (5/10)', '- Traslado cama–sillón: gran ayuda (5/15)', 'Dependiente:', '- Comer', '- Subir y bajar escaleras');
  const parrafo = textoEscala(porId.barthel, res, 'parrafo');
  enOrden(parrafo, 'Barthel: ', 'Independiente: bañarse', 'Con ayuda o de forma parcial: vestirse (necesita ayuda, 5/10)', 'Dependiente: comer; subir y bajar escaleras.');
  assert.doesNotMatch(parrafo, /comer \(dependiente/, 'no repite lo que ya dice el encabezado');
});

test('Katz y Lawton: el resumen nombra primero lo que hace', () => {
  const k = calc('katz', { ...todos('katz', () => 0), bano: 'Dependiente' });
  assert.equal(resumenDe(porId.katz, k), 'Katz B: 5/6 (independiente en vestido, uso del sanitario, transferencias, continencia, alimentación; dependiente en baño).');
  const todosDep = calc('katz', todos('katz', () => 1));
  assert.equal(resumenDe(porId.katz, todosDep), 'Katz G: 0/6 (dependiente en baño, vestido, uso del sanitario, transferencias, continencia, alimentación).');
  const l = calc('lawton', { ...todos('lawton', () => 0), compras: 'Es incapaz de comprar', telefono: 'Contesta el teléfono, pero no llama', comida: 'Nunca la ha realizado (no aplica)' });
  const lista = textoEscala(porId.lawton, l, 'lista');
  enOrden(lista, 'Realiza (suma punto):', '- Uso del teléfono: contesta el teléfono, pero no llama', 'No realiza (sin punto):', '- Hacer compras: es incapaz de comprar', 'No aplica (nunca la ha realizado):', '- Preparación de la comida');
  enOrden(resumenDe(porId.lawton, l), 'realiza: uso del teléfono', 'dependencia en 1 actividad: compras', 'no aplica: preparación de la comida');
});

test('Pfeffer: un puntaje menor es mejor, así que primero va lo que hace sin dificultad', () => {
  const res = calcular(porId.pfeffer, EJEMPLOS.pfeffer());
  const lista = textoEscala(porId.pfeffer, res, 'lista');
  enOrden(lista, 'Lo hace solo, sin dificultad:', '- Hacer solo las compras', 'Con dificultad o con ayuda:', '(necesita ayuda, 2)', 'Depende de otra persona:', '- Ordenar y manejar papeles');
  assert.doesNotMatch(lista, /no puede: depende de otra persona$/m, 'no repite el encabezado');
});

test('MMSE: dominios completos primero en el resumen y en los renglones; reactivos agrupados en la lista', () => {
  const res = calcular(porId.mmse, EJEMPLOS.mmse());
  assert.equal(resumenDe(porId.mmse, res), 'MMSE (versión mexicana del INGER): 24/30 (probable deterioro cognitivo); fijación 3/3, orientación 9/10, atención y cálculo 3/5, recuerdo 1/3, lenguaje y praxis 8/9.');
  assert.equal(res.lineas[0], 'Fijación 3/3 · Orientación 9/10 · Atención y cálculo 3/5 · Recuerdo diferido 1/3 · Lenguaje y praxis 8/9.');
  const sinRecuerdo = calcular(porId.mmse, { ...EJEMPLOS.mmse(), recuerdo: 3 });
  assert.match(resumenDe(porId.mmse, sinRecuerdo), /lenguaje y praxis 8\/9, recuerdo 0\/3\.$/, 'el dominio sin puntos va al final');
  const lista = textoEscala(porId.mmse, res, 'lista');
  enOrden(lista, 'Puntaje completo:', '- Orientación en el espacio', 'Puntaje parcial:', '- Orientación en el tiempo (4/5)', '- Recuerdo diferido (1/3)', 'Sin puntos:', '- Copia del dibujo: incorrecta');
  const baja = calcular(porId.mmse, resp('mmse', { escolaridad: '3 años o menos', tiempo: '5', lugar: '5', fijacion: '3', recuerdo: '0', denominacion: '2', repeticion: 'Correcta (1)', orden: '2' }));
  assert.match(resumenDe(porId.mmse, baja), /, forma abreviada por escolaridad \(8 puntos de entrada\); orientación 10\/10, fijación 3\/3, lenguaje y praxis 5\/6, recuerdo 0\/3\.$/);
});

test('MoCA por secciones: dominios ordenados; con solo el total no se agrupa', () => {
  const r = resp('moca', {
    modo: 'Por secciones (guiado)', trazo: 'Correcto (1)', cubo: 'Incorrecto (0)', reloj_contorno: 'Correcto (1)', reloj_numeros: 'Correcto (1)', reloj_manecillas: 'Correcto (1)',
    identificacion: '3 láminas (3)', digitos_directo: 'Correcto (1)', digitos_inverso: 'Correcto (1)', letras: '0 o 1 error (1)', resta: '4 o 5 restas correctas (3)',
    repeticion: 'Ninguna (0)', fluidez: '10 palabras o menos (0)', abstraccion: 'Un par (1)', recuerdo: '2 palabras (2)',
    orientacion: ['fecha', 'mes', 'anio', 'dia', 'lugar', 'ciudad'], escolaridad: 'No, más de 12 años',
  });
  const res = calcular(porId.moca, r);
  assert.ok(res.completo);
  assert.equal(res.lineas[1], 'Identificación 3/3 · Atención 6/6 · Orientación 6/6 · Visuoespacial y ejecutiva 4/5 · Abstracción 1/2 · Recuerdo diferido 2/5 · Lenguaje 0/3.');
  assert.match(resumenDe(porId.moca, res), /; identificación 3\/3, atención 6\/6, orientación 6\/6, visuoespacial\/ejecutiva 4\/5, abstracción 1\/2, recuerdo diferido 2\/5, lenguaje 0\/3\.$/);
  const lista = textoEscala(porId.moca, res, 'lista');
  enOrden(lista, 'Puntaje completo:', '- Alternancia conceptual', 'Puntaje parcial:', '- Abstracción (semejanzas): un par (1/2)', 'Sin puntos:', '- Copia del cubo: incorrecto');
  const total = calcular(porId.moca, EJEMPLOS.moca());
  assert.equal(ordenarPorCapacidad(porId.moca, total.desglose), null);
  assert.doesNotMatch(textoEscala(porId.moca, total, 'lista'), /Puntaje completo:/);
});

test('CDR, reloj, RUDAS, Isaacs e ICOPE: lo conservado primero', () => {
  const cdr = calcular(porId.cdr, EJEMPLOS.cdr());
  assert.ok(cdr.lineas.includes('Casillas: cuidado personal 0, memoria 1, orientación 1, juicio y resolución de problemas 1, actividades en la comunidad 1, hogar y aficiones 1.'));
  enOrden(textoEscala(porId.cdr, cdr, 'lista'), 'Sin alteración (0):', '- Cuidado personal', 'Alteración cuestionable a moderada (0.5 a 2):', '- Memoria (1)');
  const reloj = calcular(porId.reloj, EJEMPLOS.reloj());
  assert.match(reloj.lineas[0], /^A la orden: 7\/10 \(esfera 2\/2, números 3\/4, manecillas 2\/4\)/);
  assert.match(reloj.lineas[1], /^A la copia: 9\.5\/10 \(esfera 2\/2, números 4\/4, manecillas 3\.5\/4\)/);
  const rudas = calcular(porId.rudas, EJEMPLOS.rudas());
  assert.match(rudas.lineas[0], /^Dominios: orientación corporal 5\/5, praxis 2\/2, memoria 6\/8/);
  const isaacs = calc('isaacs', { colores: 10, animales: 0, frutas: 6, ciudades: 10 });
  assert.equal(isaacs.lineas[0], 'Colores 10/10, ciudades 10/10, frutas 6/10, animales 0/10.');
  const icope = calc('icope-cog', { filtro: 'No', fecha: 'Responde incorrectamente o no sabe', lugar: 'Responde correctamente', palabras: 'Recuerda 1' });
  assert.equal(icope.extras.hallazgo, 'orientación en espacio correcta; recordó 1 de 3 palabras; orientación en tiempo incorrecta');
});

test('las escalas sin configuración de orden conservan su texto', () => {
  const gds = porId.gds15;
  const res = calcular(gds, EJEMPLOS.gds15());
  assert.equal(ordenarPorCapacidad(gds, res.desglose), null);
  assert.doesNotMatch(textoEscala(gds, res, 'lista'), /Puntaje completo:|Independiente:/);
  assert.equal(NINGUNO, '__ninguno');
});
