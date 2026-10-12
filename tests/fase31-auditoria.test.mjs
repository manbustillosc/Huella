// Fase 3.1, prioridad 4: revisión transversal del catálogo. Una prueba por cada corrección.
import test from 'node:test';
import assert from 'node:assert/strict';
import { clasificarCambio } from '../js/comparacion.js';
import { calcular } from '../js/motor.js';
import { escalas, porId, resp, guardado, calc, EJEMPLOS } from './ayuda.mjs';

const CLAVES_VINCULO = new Set(['id', 'escala', 'titulo', 'disponible', 'describir', 'aplicar', 'campos', 'advertencia']);

test('estructura: los vínculos solo usan propiedades conocidas y apuntan a instrumentos registrados', () => {
  assert.equal(escalas.length, 109);
  for (const e of escalas) {
    for (const v of e.vinculos || []) {
      for (const k of Object.keys(v)) assert.ok(CLAVES_VINCULO.has(k), `${e.id}: vínculo ${v.id} con propiedad desconocida «${k}»`);
      assert.ok(porId[v.escala], `${e.id}: vínculo a ${v.escala} no registrado`);
      for (const c of v.campos) assert.ok(e.campos.some((x) => x.id === c), `${e.id}: vínculo ${v.id} llena un campo inexistente (${c})`);
    }
    for (const s of e.siguientes || []) assert.ok(porId[s.id], `${e.id}: siguiente paso a ${s.id} no registrado`);
  }
});

test('auditoría automática: todos los ejemplos calculan sin valores indefinidos y las bandas cubren el intervalo', () => {
  for (const e of escalas) {
    assert.ok(EJEMPLOS[e.id], `${e.id}: sin ejemplo de prueba`);
    const r = calcular(e, EJEMPLOS[e.id]());
    assert.ok(r.completo, e.id);
    assert.ok(!/undefined|NaN/.test(JSON.stringify([r.lineas, r.banda])), e.id);
    const num = e.bandas.filter((b) => b.min != null && b.max != null);
    if (num.length === e.bandas.length && e.min != null && e.max != null) {
      const s = [...num].sort((a, b) => a.min - b.min);
      assert.ok(s[0].min <= e.min && s.at(-1).max >= e.max, `${e.id}: bandas no cubren ${e.min}–${e.max}`);
      for (let i = 1; i < s.length; i += 1) assert.ok(s[i].min > s[i - 1].max, `${e.id}: bandas solapadas`);
    }
  }
});

test('CAM-ICU: con RASS −4 o −5 sugiere reevaluar la sedación (el siguiente paso estaba dentro del vínculo)', () => {
  const e = porId.camicu;
  assert.ok(Array.isArray(e.siguientes) && e.siguientes.some((s) => s.id === 'rass'));
  const ne = calc('camicu', { rass: '−4 · Sedación profunda' });
  assert.ok(ne.completo);
  assert.equal(ne.banda.id, 'ne');
  assert.ok(e.siguientes.find((s) => s.id === 'rass').si(ne));
  assert.ok(!e.siguientes.find((s) => s.id === 'rass').si(calc('camicu', { rass: '0 · Alerta y tranquilo', agudo: 'Ausente' })));
});

test('NEWS2: la escala 2 de SpO₂ exige hipercapnia confirmada por gasometría y meta prescrita; ante la duda, escala 1', () => {
  const e = porId.news2;
  assert.ok(e.aplicacion.some((t) => /gasometría/.test(t) && /si hay duda, la escala 1/.test(t)));
  assert.match(e.campos.find((c) => c.id === 'escala_spo2').opciones[1].detalle, /gasometría.*Si hay duda, usa la escala 1/);
  const n = calc('news2', { fr: 16, escala_spo2: 'Escala 2', spo2: 90, oxigeno: 'Oxígeno suplementario', pas: 120, fc: 70, conciencia: 'Alerta (A)', temp: 37 });
  assert.equal(n.puntaje, 2, 'SpO₂ 90 % con oxígeno en escala 2: 0 por SpO₂ + 2 por oxígeno');
  assert.ok(n.lineas.some((l) => /gasometría/.test(l) && /vuelve a la escala 1/.test(l)));
});

test('Charlson: el cambio del índice no se califica como mejoría y se listan las condiciones que cambiaron', () => {
  const NO = Object.fromEntries(porId.charlson.campos.filter((c) => c.opciones).map((c) => [c.id, 'No']));
  const a = guardado('charlson', resp('charlson', { edad: 80, ...NO, iam: 'Sí', tumor: 'Sin metástasis' }));
  const b = guardado('charlson', resp('charlson', { edad: 80, ...NO, iam: 'Sí' }));
  const c = clasificarCambio(porId.charlson, a, b);
  assert.equal(c.tipo, 'sin_direccion');
  assert.ok(c.advertencias.some((x) => /ya no se registraron: tumor sólido sin metástasis/.test(x)));
  assert.ok(c.advertencias.some((x) => /no equivale a mejoría clínica/.test(x)));
  const d = clasificarCambio(porId.charlson, b, a);
  assert.equal(d.tipo, 'sin_direccion');
  assert.ok(d.advertencias.some((x) => /que no estaban antes: tumor sólido sin metástasis/.test(x)));
});

test('CDR y FAST: una disminución del estadio se acompaña de una advertencia', () => {
  const cdr = (g) => guardado('cdr', resp('cdr', { global: g, casillas: 'No' }));
  const c = clasificarCambio(porId.cdr, cdr('2 · Demencia moderada'), cdr('1 · Demencia leve'));
  assert.ok(c.advertencias.some((x) => /no es lo esperable/.test(x)));
  assert.ok(!clasificarCambio(porId.cdr, cdr('1 · Demencia leve'), cdr('2 · Demencia moderada')).advertencias.length);
  const fast = (e) => guardado('fast', resp('fast', { estadio: e, ordinal: 'Sí', otraCausa: 'No' }));
  const f = clasificarCambio(porId.fast, fast('7a · lenguaje limitado'), fast('6a · vestido'));
  assert.ok(f.advertencias.some((x) => /delirium, depresión/.test(x)));
});

test('IDDSI: nombres de los niveles según la tarjeta de referencia oficial en español', () => {
  const t = (id) => porId.iddsi.campos.find((c) => c.id === id).opciones.map((o) => o.texto);
  assert.deepEqual(t('bebidas').slice(0, 5), ['Nivel 0 · Fina', 'Nivel 1 · Ligeramente espesa', 'Nivel 2 · Poco espesa', 'Nivel 3 · Moderadamente espesa', 'Nivel 4 · Extremadamente espesa']);
  assert.deepEqual(t('alimentos').slice(0, 6), ['Nivel 3 · Licuada', 'Nivel 4 · Puré', 'Nivel 5 · Picada y húmeda', 'Nivel 6 · Suave y tamaño bocado', 'Nivel 7 · Fácil de masticar', 'Nivel 7 · Regular']);
});

test('Fried: población del análisis original descrita con sus exclusiones', () => {
  assert.match(porId.fried.poblacion, /antecedente de evento vascular cerebral, MMSE menor de 18/);
  assert.match(porId.fried.poblacion, /levodopa\/carbidopa, donepezilo o antidepresivos/);
});
