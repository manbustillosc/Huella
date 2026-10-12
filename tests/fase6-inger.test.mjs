// Fase 6: instrumentos de la guía del INGER (2022) que faltaban: Atenas, ISAR-HP, HARP, SPPICEES, prueba del susurro,
// espacio de vida (LSA), recursos sociales OARS, Díaz-Veiga y barreras del entorno.
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular, NINGUNO } from '../js/motor.js';
import { RUTAS } from '../js/rutas.js';
import { porId, resp, calc, guardado, EJEMPLOS } from './ayuda.mjs';

const NUEVAS = ['atenas', 'isarhp', 'harp', 'sppicees', 'susurro', 'lsa', 'oars', 'diazveiga', 'barreras'];

test('fase 6: nueve instrumentos del INGER registrados, con ejemplo, en una ruta y citando la guía', () => {
  const enRutas = new Set(RUTAS.flatMap((r) => [...r.pasos, ...(r.complementarios || [])].map((x) => x.id)));
  for (const id of NUEVAS) {
    assert.ok(porId[id] && EJEMPLOS[id], id);
    assert.ok(enRutas.has(id), `${id} en una ruta`);
    assert.ok(porId[id].referencias.some((r) => /Instituto Nacional de Geriatría/.test(r.texto)), `${id} cita la guía del INGER`);
  }
});

test('Atenas: 8 o más indica problemas de insomnio', () => {
  const t = (n) => Object.fromEntries(porId.atenas.campos.map((c, i) => [c.id, c.opciones[i < n ? 1 : 0].texto]));
  assert.equal(calc('atenas', t(7)).banda.etiqueta, 'Sin problemas de insomnio');
  assert.equal(calc('atenas', t(8)).banda.etiqueta, 'Problemas de insomnio');
  assert.equal(porId.atenas.max, 24);
});

test('ISAR-HP: puntos del formato del INGER y sus tres categorías', () => {
  const r = (m) => calc('isarhp', { aivd: 'No', auxiliar: 'No', viaje: 'No', educacion: 'Sí', ...m });
  assert.equal(r({}).puntaje, 0);
  assert.equal(r({ educacion: 'No' }).puntaje, 1);
  assert.equal(r({ auxiliar: 'Sí' }).banda.etiqueta, 'Riesgo intermedio de deterioro funcional');
  assert.equal(r({ auxiliar: 'Sí', aivd: 'Sí', viaje: 'Sí', educacion: 'No' }).puntaje, 5);
  assert.equal(r({ auxiliar: 'Sí', aivd: 'Sí', viaje: 'Sí' }).banda.etiqueta, 'Riesgo alto de deterioro funcional');
});

test('HARP: edad, actividades instrumentales y examen abreviado', () => {
  const seis = ['telefono', 'compras', 'alimentos', 'domesticas', 'transporte', 'medicamentos'];
  const h = (edad, aivd, mental) => calc('harp', { edad, aivd, mental });
  assert.equal(h(75, seis, 15).puntaje, 0);
  assert.equal(h(76, seis, 15).puntaje, 1);
  assert.equal(h(85, seis, 15).puntaje, 2);
  assert.equal(h(70, seis.slice(0, 5), 15).puntaje, 2, '5 actividades suman 2');
  assert.equal(h(70, [NINGUNO], 14).puntaje, 3);
  assert.equal(h(90, [NINGUNO], 10).banda.etiqueta, 'Riesgo alto de pérdida de autonomía');
  assert.equal(h(70, seis, 20).banda.etiqueta, 'Riesgo bajo de pérdida de autonomía');
});

test('SPPICEES: cualquier problema pide intervenir; sin cuidador primario cuenta como problema', () => {
  const nada = { piel: 'No', nutricion: 'No', dolor: 'No', inmovilidad: 'No', confusion: 'No', eliminacion: 'No', apoyo: 'Sí', sueno: 'No' };
  assert.equal(calc('sppicees', nada).banda.etiqueta, 'Sin problemas geriátricos detectados');
  const sinCuidador = calc('sppicees', { ...nada, apoyo: 'No' });
  assert.equal(sinCuidador.puntaje, 1);
  assert.ok(sinCuidador.banda.hallazgo);
  assert.ok(sinCuidador.banda.sugerencias.some((x) => /quién puede apoyar/.test(x)));
  const confusion = calc('sppicees', { ...nada, confusion: 'Sí', piel: 'Sí', sueno: 'Sí' });
  assert.equal(confusion.banda.etiqueta, 'Varios problemas geriátricos');
  assert.ok(confusion.banda.sugerencias.some((x) => /4AT o CAM/.test(x)));
  assert.match(guardado('sppicees', resp('sppicees', { ...nada, dolor: 'Sí' })).resumen, /1 problemas \(dolor que limita actividades\)/);
});

test('Prueba del susurro: positiva si falla en cualquier oído', () => {
  const ok = 'Repite correctamente la combinación';
  const no = 'No repite correctamente dos combinaciones';
  assert.equal(calc('susurro', { derecho: ok, izquierdo: ok }).banda.etiqueta, 'Prueba negativa');
  const r = calc('susurro', { derecho: no, izquierdo: ok });
  assert.equal(r.banda.etiqueta, 'Prueba positiva: probable déficit auditivo');
  assert.ok(r.lineas.some((l) => /oído derecho/.test(l)));
});

test('Espacio de vida (LSA): nivel × frecuencia × independencia y cortes de 20 y 56', () => {
  const no = { n1: 'No', n2: 'No', n3: 'No', n4: 'No', n5: 'No' };
  assert.equal(calc('lsa', no).puntaje, 0);
  assert.equal(calc('lsa', no).banda.etiqueta, 'Espacio de vida muy restringido');
  const max = Object.fromEntries([1, 2, 3, 4, 5].flatMap((n) => [[`n${n}`, 'Sí'], [`f${n}`, 'Diario'], [`i${n}`, 'Sin ningún apoyo']]));
  assert.equal(calc('lsa', max).puntaje, 120);
  assert.equal(calc('lsa', max).banda.etiqueta, 'Espacio de vida conservado');
  const disp = calc('lsa', { ...no, n3: 'Sí', f3: '1 a 3 veces por semana', i3: 'Solo con un dispositivo de ayuda' });
  assert.equal(disp.puntaje, 9, '3 × 2 × 1.5');
  assert.equal(calc('lsa', EJEMPLOS.lsa()).puntaje, 29);
  assert.equal(calc('lsa', EJEMPLOS.lsa()).banda.etiqueta, 'Espacio de vida restringido');
  const n56 = calc('lsa', { ...no, n4: 'Sí', f4: '4 a 6 veces por semana', i4: 'Sin ningún apoyo', n2: 'Sí', f2: '1 a 3 veces por semana', i2: 'Sin ningún apoyo' });
  assert.equal(n56.puntaje, 32);
  assert.equal(calcular(porId.lsa, resp('lsa', { ...no, n1: 'Sí' })).completo, false, 'si estuvo en el nivel, pide frecuencia e independencia');
});

test('OARS, Díaz-Veiga y barreras del entorno', () => {
  assert.equal(calc('oars', { categoria: '1 · Excelentes recursos sociales' }).banda.nivel, 'bien');
  assert.ok(calc('oars', { categoria: '5 · Recursos sociales bastante deteriorados' }).banda.hallazgo);
  assert.ok(porId.oars.registro, 'OARS solo registra la categoría');
  const dv = calc('diazveiga', EJEMPLOS.diazveiga());
  assert.equal(dv.puntaje, 3);
  assert.equal(dv.banda.nivel, 'neutro');
  assert.ok(dv.lineas.some((l) => /Poca satisfacción con: familiares próximos/.test(l)));
  const nadie = Object.fromEntries(['conyuge', 'hijos', 'familiares', 'amigos'].map((x) => [`${x}_f`, 'No tiene o no aplica']));
  assert.equal(calc('diazveiga', nadie).banda.etiqueta, 'Sin fuentes de apoyo registradas');
  const sinBarreras = Object.fromEntries(porId.barreras.campos.map((c) => [c.id, [NINGUNO]]));
  assert.equal(calc('barreras', sinBarreras).banda.etiqueta, 'Sin barreras identificadas');
  assert.equal(calc('barreras', EJEMPLOS.barreras()).puntaje, 3);
  assert.equal(calc('barreras', EJEMPLOS.barreras()).banda.etiqueta, 'Barreras en varias áreas');
});
