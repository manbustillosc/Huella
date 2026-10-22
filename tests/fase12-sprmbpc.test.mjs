// Versión 2.11: lista en español revisada de verificación de problemas de memoria y comportamiento (SpRMBPC),
// anexo 42 de la guía de instrumentos del INGER (2022). Datos ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SITUACIONES_RMBPC, SUBESCALAS_RMBPC, FRECUENCIA_RMBPC, REACCION_RMBPC } from '../escalas/inger.js';
import { calcular, campoVisible, limpiarOcultas, resumenDe, resumenBreveDe, textoEscala } from '../js/motor.js';
import { CATALOGO_FUTURO } from '../js/vistas/catalogo.js';
import { RUTAS, pasosDe } from '../js/rutas.js';
import { valorGuardado, cifraGuardada } from '../js/nota.js';
import { porId, resp, EJEMPLOS, guardado } from './ayuda.mjs';

const e = () => porId.sprmbpc;
const nunca = () => Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`f${i + 1}`, 'Nunca']));
const calc = (mapa) => calcular(e(), resp('sprmbpc', { ...nunca(), ...mapa }));

test('SpRMBPC: 24 situaciones del anexo 42 en su orden, con subescalas de 7, 8 y 9', () => {
  assert.equal(SITUACIONES_RMBPC.length, 24);
  assert.deepEqual(SUBESCALAS_RMBPC.map((s) => SITUACIONES_RMBPC.filter((x) => x.subescala === s.id).length), [7, 8, 9]);
  assert.match(SITUACIONES_RMBPC[0].texto, /^Que el\/la paciente pregunte muchas veces lo mismo$/);
  assert.match(SITUACIONES_RMBPC[11].texto, /peligrosos para él\/ella o para otras personas/);
  assert.match(SITUACIONES_RMBPC[15].texto, /ansioso\/a o preocupado\/a/);
  assert.match(SITUACIONES_RMBPC[23].texto, /fracaso/);
  assert.deepEqual(FRECUENCIA_RMBPC, ['Nunca', 'Ocurrió, pero no en la última semana', '1 o 2 veces en la última semana', '3 a 6 veces en la última semana', 'Todos los días']);
  assert.deepEqual(REACCION_RMBPC, ['Nada', 'Un poco', 'Moderadamente', 'Mucho', 'Muchísimo']);
  // Cada situación: frecuencia + «No sé»; reacción anidada + «No sé».
  const f1 = e().campos.find((c) => c.id === 'f1');
  const a1 = e().campos.find((c) => c.id === 'a1');
  assert.equal(f1.opciones.length, 6);
  assert.equal(f1.opciones.at(-1).especial, true);
  assert.equal(a1.anidado, true);
  assert.equal(a1.textoDesglose, 'Cuánto le afectó a quien cuida');
  assert.deepEqual(e().campos.filter((c) => c.grupo).map((c) => c.id), ['f1', 'f8', 'f16']);
  assert.equal(e().dominio, 'social');
});

test('SpRMBPC: la reacción solo se pregunta si la situación ocurrió, y lo oculto no se guarda', () => {
  const a3 = e().campos.find((c) => c.id === 'a3');
  for (const [texto, visible] of [['Nunca', false], ['Ocurrió, pero no en la última semana', true], ['1 o 2 veces en la última semana', true], ['Todos los días', true], ['No sé', false]]) {
    assert.equal(campoVisible(a3, resp('sprmbpc', { f3: texto })), visible, texto);
  }
  const r = resp('sprmbpc', { ...nunca(), a3: 'Mucho' });
  assert.equal(limpiarOcultas(e(), r).a3, undefined);
  // Sin la reacción de una situación que ocurrió, el resultado no está completo.
  const incompleto = calcular(e(), resp('sprmbpc', { ...nunca(), f3: 'Todos los días' }));
  assert.equal(incompleto.completo, false);
  assert.deepEqual(incompleto.faltan, ['a3']);
});

test('SpRMBPC: ejemplo con frecuencia, reacción, subescalas y «No sé»', () => {
  const res = calcular(e(), EJEMPLOS.sprmbpc());
  assert.equal(res.completo, true);
  assert.equal(res.banda.id, 'con');
  assert.equal(res.banda.hallazgo, true);
  assert.deepEqual(res.extras.enSemana, [1, 2, 4, 10, 18]);
  assert.deepEqual(res.extras.semana, { memoria: 3, disruptiva: 1, depresion: 1 });
  assert.deepEqual(res.extras.frecuencia, { memoria: 9, disruptiva: 3, depresion: 2 });
  assert.deepEqual(res.extras.reaccionSub, { memoria: 6, disruptiva: 5, depresion: 3 });
  assert.equal(res.puntaje, 14);
  assert.equal(res.extras.reaccion, 14);
  assert.deepEqual(res.extras.antes, [15]);
  assert.deepEqual(res.extras.noSe, [20]);
  assert.deepEqual(res.extras.afectan, [10, 4, 18]);
  assert.deepEqual(res.alertas, []);
  assert.ok(res.lineas.includes('En la última semana: 5 de 24 situaciones (memoria 3/7, conducta disruptiva 1/8, depresión 1/9).'));
  assert.ok(res.lineas.includes('Todos los días: olvida cosas recientes (2).'));
  assert.ok(res.lineas.some((l) => l.startsWith('Afectan mucho o muchísimo a quien cuida: despierta a la familia durante la noche (10, muchísimo), pierde cosas')));
  assert.ok(res.lineas.includes('Ocurrieron, pero no en la última semana: discute, está irritable o se queja (15).'));
  assert.ok(res.lineas.some((l) => /^Sumas descriptivas, sin punto de corte: frecuencia 14\/96 .*reacción de quien cuida 14\/96/.test(l)));
  assert.ok(res.lineas.includes('No supo la frecuencia de 1 situación: llanto (20); no entran en las sumas.'));
  assert.equal(resumenDe(e(), res), 'SpRMBPC: 5 de 24 situaciones en la última semana (memoria 3, conducta disruptiva 1, depresión 1); frecuencia 14/96; reacción de quien cuida 14/96; 1 sin respuesta («No sé»).');
  assert.equal(resumenBreveDe(e(), res), 'SpRMBPC 5/24 en la última semana, frecuencia 14/96, reacción 14/96');
  // Tablas: subescalas y situaciones referidas (incluye la de antes y la de «No sé»).
  assert.deepEqual(res.detalles[0].filas, [['Memoria', '3 de 7', '9/28', '6/28'], ['Conducta disruptiva', '1 de 8', '3/32', '5/32'], ['Depresión', '1 de 9', '2/36', '3/36']]);
  const depresion = res.detalles.find((d) => d.titulo.startsWith('Depresión'));
  assert.deepEqual(depresion.filas, [['18. Tristeza o ánimo deprimido', '1 o 2 veces en la última semana', 'Mucho'], ['20. Llanto', 'No sé', '—']]);
  // Texto del expediente: la reacción se entiende fuera del formulario.
  const lista = textoEscala(e(), res, 'lista');
  assert.match(lista, /- Cuánto le afectó a quien cuida: muchísimo/);
  assert.doesNotMatch(lista, /¿Cuánto le afectó a usted\?/);
  const parrafo = textoEscala(e(), res, 'parrafo');
  assert.match(parrafo, /^SpRMBPC: 5 de 24 situaciones/);
  assert.doesNotMatch(parrafo, /Que el\/la paciente/);
});

test('SpRMBPC: sin situaciones en la última semana, con situaciones previas, y todo «No sé»', () => {
  const sin = calc({});
  assert.equal(sin.banda.id, 'sin');
  assert.equal(sin.puntaje, 0);
  assert.equal(resumenDe(e(), sin), 'SpRMBPC: ninguna situación de memoria o comportamiento en la última semana (frecuencia 0/96; reacción de quien cuida 0/96).');
  assert.equal(sin.detalles.length, 1);
  const previa = calc({ f5: 'Ocurrió, pero no en la última semana', a5: 'Nada' });
  assert.equal(previa.banda.id, 'sin');
  assert.equal(previa.puntaje, 1);
  assert.ok(previa.lineas.includes('Ocurrieron, pero no en la última semana: olvida qué día es (5).'));
  const todoNoSe = calcular(e(), resp('sprmbpc', Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`f${i + 1}`, 'No sé']))));
  assert.equal(todoNoSe.banda.id, 'ns');
  assert.equal(todoNoSe.banda.nivel, 'neutro');
  assert.equal(resumenDe(e(), todoNoSe), 'SpRMBPC: quien cuida no supo responder ninguna situación; no se interpreta.');
  const reaccionNoSe = calc({ f7: 'Todos los días', a7: 'No sé' });
  assert.equal(reaccionNoSe.extras.reaccion, 0);
  assert.ok(reaccionNoSe.lineas.includes('No supo cuánto le afectó en 1 situación: dificultad para concentrarse en una tarea (7).'));
});

test('SpRMBPC: amenazas de lastimarse, comentarios de muerte y conductas peligrosas se señalan aunque sean previas', () => {
  const autolesion = calc({ f17: 'Ocurrió, pero no en la última semana', a17: 'Mucho' });
  assert.equal(autolesion.alertas.length, 1);
  assert.match(autolesion.alertas[0], /amenaza con lastimarse \(17\): pregunta directamente a la persona por ideas de muerte o de suicidio/);
  assert.equal(autolesion.lineasNota[0], autolesion.alertas[0], 'la alerta también va al expediente');
  assert.ok(!autolesion.lineas.includes(autolesion.alertas[0]), 'en pantalla no se repite fuera de su recuadro');
  assert.match(textoEscala(e(), autolesion, 'parrafo'), /ideas de muerte o de suicidio/);
  const muerte = calc({ f21: '1 o 2 veces en la última semana', a21: 'Muchísimo' });
  assert.match(muerte.alertas[0], /habla de su propia muerte o la de otras personas \(21\)/);
  const peligro = calc({ f12: '1 o 2 veces en la última semana', a12: 'Mucho', f13: 'Ocurrió, pero no en la última semana', a13: 'Moderadamente' });
  assert.equal(peligro.alertas.length, 1);
  assert.match(peligro.alertas[0], /comportamientos potencialmente peligrosos \(12\), amenaza con lastimar a otras personas \(13\): revisa la seguridad/);
  assert.deepEqual(peligro.extras.seguridad, [12, 13]);
  assert.deepEqual(calc({ f16: 'Todos los días', a16: 'Mucho' }).alertas, []);
});

test('SpRMBPC: siguientes pasos, comparación entre aplicaciones, rutas y catálogo', () => {
  const res = calcular(e(), EJEMPLOS.sprmbpc());
  const sig = e().siguientes.filter((x) => x.si(res)).map((x) => x.id);
  assert.deepEqual(sig, ['zarit', 'npiq', 'cornell']);
  const sin = calc({});
  assert.deepEqual(e().siguientes.filter((x) => x.si(sin)).map((x) => x.id), []);
  assert.deepEqual(e().siguientes.filter((x) => x.si({ noEvaluable: 'x', extras: null })).map((x) => x.id), []);
  const despues = calc({ f2: '1 o 2 veces en la última semana', a2: 'Un poco', f20: 'Nunca' });
  const cambio = e().cambioExtra(res, despues);
  assert.ok(cambio.includes('Reacción de quien cuida de 14 a 1 de 96.'));
  assert.ok(cambio.some((l) => l.startsWith('Situaciones que ya no ocurrieron en la última semana: pregunta muchas veces lo mismo (1), pierde cosas')));
  assert.ok(cambio.includes('Respuestas «No sé»: 1 antes y 0 ahora; las sumas no son del todo comparables.'));
  assert.equal(e().direccionClinica, 'menor_mejor');
  assert.ok(pasosDe(RUTAS.find((r) => r.id === 'cognitiva')).some((p) => p.id === 'sprmbpc'));
  assert.ok(!CATALOGO_FUTURO.some((x) => x.nombre === 'SpRMBPC'));
  assert.ok(e().referencias.some((r) => r.doi === '10.1017/S1041610210002073'));
  assert.ok(e().referencias.some((r) => r.doi === '10.1037/0882-7974.7.4.622'));
  assert.match(e().licencia.texto, /anexo 42/);
});

test('SpRMBPC en la nota: la cifra dice que es la suma de frecuencia; las demás escalas no cambian', () => {
  const g = guardado('sprmbpc', EJEMPLOS.sprmbpc());
  assert.equal(cifraGuardada(g), 'frecuencia 14/96');
  assert.equal(valorGuardado(g), 'frecuencia 14/96 (problemas de memoria o comportamiento en la última semana)');
  const barthel = guardado('barthel', EJEMPLOS.barthel());
  assert.match(cifraGuardada(barthel), /^\d+\/100$/);
});
