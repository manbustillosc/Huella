// Nota de la valoración: formatos, dirección de los cambios, fechas y conclusiones delimitadas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMINIOS } from '../js/dominios.js';
import { notaValoracion, hallazgosYSugerencias, valorGuardado, cifraGuardada } from '../js/nota.js';
import { calcular } from '../js/motor.js';
import { porId, resp, todos, guardado, escalas, EJEMPLOS } from './ayuda.mjs';

const barthelCon = (cambios) => ({ ...todos('barthel', () => 0), ...cambios });
const gdsCon = (n) => Object.fromEntries(porId.gds15.campos.map((c, i) => [c.id, i < n ? (c.puntua === 'si' ? 0 : 1) : (c.puntua === 'si' ? 1 : 0)]));

const fecha = new Date(2026, 9, 10);
const basal = guardado('barthel', barthelCon({ banarse: 1 }), { momento: 'basal', fuente: 'cuidador', fecha: '2026-10-10', fechaReferencia: '2026-09-26' });
const ingreso = guardado('barthel', barthelCon({ banarse: 1, vestirse: 2, retrete: 2, traslado: 1, deambulacion: 3, escalones: 2 }), { momento: 'ingreso', fecha: '2026-10-10' });
const gds = guardado('gds15', Object.fromEntries(porId.gds15.campos.map((c) => [c.id, 1])), { fecha: '2026-10-10' });
const moca = guardado('moca', { _noEvaluable: 'Alteración del estado de alerta o delirium' }, { fecha: '2026-10-10' });
const val = { paciente: { edad: 82, sexo: 'mujer', escolaridad: 6, contexto: 'Ingreso por neumonía' }, resultados: [ingreso, basal, gds, moca] };

test('nota en párrafo: una línea, con la dirección clínica del cambio', () => {
  const t = notaValoracion(val, porId, DOMINIOS, fecha, 'parrafo');
  assert.ok(!t.includes('\n'));
  assert.match(t, /^Valoración geriátrica 10\/10\/2026\. Paciente: mujer, 82 años, escolaridad 6 años\. Contexto: Ingreso por neumonía\./);
  assert.match(t, /Funcional: Barthel basal \(estado al 26\/09\/2026\) 95\/100 \(dependencia escasa\), al ingreso 45\/100 \(dependencia grave\): disminución de 50 puntos respecto al basal \(deterioro funcional en las ABVD\); cambio de categoría de «dependencia escasa» a «dependencia grave»\./);
  assert.match(t, /Afectivo: GDS-15 5\/15 \(síntomas depresivos: tamizaje positivo\)\./);
  assert.match(t, /Cognitivo: MoCA no evaluable \(alteración del estado de alerta o delirium\)\./);
});

test('nota en lista: renglones por aplicación y cambio con dirección', () => {
  const t = notaValoracion(val, porId, DOMINIOS, fecha, 'lista');
  assert.match(t, /\nFUNCIONAL\n- Barthel basal \(estado al 26\/09\/2026; fuente: cuidador\): 95\/100 \(dependencia escasa\)\.\n- Barthel al ingreso: 45\/100 \(dependencia grave\)\.\n {2}Cambio: disminución de 50 puntos respecto al basal \(deterioro funcional en las ABVD\)/);
});

test('nota completa: cinco secciones en orden, separadas y sin conclusiones de más', () => {
  const t = notaValoracion(val, porId, DOMINIOS, fecha, 'completa');
  const i = (s) => t.indexOf(s);
  const secciones = ['1. RESULTADOS OBJETIVOS', '2. INTERPRETACIÓN DE LOS INSTRUMENTOS', '3. CAMBIOS LONGITUDINALES', '4. HALLAZGOS QUE REQUIEREN ATENCIÓN', '5. SUGERENCIAS ORIENTATIVAS'];
  for (let k = 0; k < secciones.length; k += 1) {
    assert.ok(i(secciones[k]) > 0, `falta ${secciones[k]}`);
    if (k) assert.ok(i(secciones[k - 1]) < i(secciones[k]), `${secciones[k]} fuera de orden`);
  }
  const objetivos = t.slice(i('1. RESULTADOS'), i('2. INTERPRETACIÓN'));
  assert.match(objetivos, /- Barthel basal \(estado al 26\/09\/2026; fuente: cuidador\): 95\/100\./);
  assert.ok(!/dependencia/.test(objetivos), 'los resultados objetivos no llevan interpretación');
  assert.match(objetivos, /sin instrumentos aplicados: fragilidad y sarcopenia, nutrición/);
  const interp = t.slice(i('2. INTERPRETACIÓN'), i('3. CAMBIOS'));
  assert.match(interp, /- Barthel: basal \(estado al 26\/09\/2026\), dependencia escasa; al ingreso, dependencia grave\./);
  const cambios = t.slice(i('3. CAMBIOS'), i('4. HALLAZGOS'));
  assert.match(cambios, /- Barthel al ingreso: disminución de 50 puntos respecto al basal \(deterioro funcional en las ABVD\); cambio de categoría/);
  assert.match(cambios, /actividades con menor puntaje que en la referencia: vestirse, uso del retrete/);
  assert.match(cambios, /su relevancia requiere valoración/);
  const hall = t.slice(i('4. HALLAZGOS'), i('5. SUGERENCIAS'));
  assert.match(hall, /- Barthel al ingreso: 45\/100 \(dependencia grave\)\./);
  assert.match(hall, /La causa y la reversibilidad requieren valoración clínica\./);
  assert.match(hall, /Instrumentos no evaluables: MoCA \(alteración del estado de alerta o delirium\)/);
  assert.ok(!/Barthel basal: 95/.test(hall), 'los hallazgos usan la aplicación vigente');
  assert.match(t.slice(i('5. SUGERENCIAS')), /Entrevista clínica para confirmar o descartar un trastorno depresivo/);
});

test('cambios que mejoran no se reportan como deterioro', () => {
  const g1 = guardado('gds15', gdsCon(12), { fecha: '2026-09-01' });
  const g2 = guardado('gds15', gdsCon(4), { fecha: '2026-10-01' });
  const p1 = guardado('painad', Object.fromEntries(porId.painad.campos.map((c, i) => [c.id, i < 4 ? 2 : 0])), { momento: 'ingreso', fecha: '2026-09-28' });
  const p2 = guardado('painad', Object.fromEntries(porId.painad.campos.map((c) => [c.id, c.id === 'facial' ? 1 : 0])), { momento: 'egreso', fecha: '2026-10-02' });
  const v = { paciente: {}, resultados: [g2, g1, p2, p1] };
  const t = notaValoracion(v, porId, DOMINIOS, fecha, 'completa');
  assert.match(t, /GDS-15 del 01\/10\/2026: disminución de 8 puntos respecto a la aplicación del 01\/09\/2026 \(reducción de síntomas depresivos\)/);
  assert.match(t, /PAINAD al egreso \(02\/10\/2026\): disminución de 7 puntos respecto al ingreso del 28\/09\/2026 \(disminución de conductas sugestivas de dolor\)/);
  const { hallazgos } = hallazgosYSugerencias(v, porId);
  assert.ok(!hallazgos.some((h) => /disminución/.test(h)), 'una mejoría no es un hallazgo de deterioro');
  assert.ok(hallazgos.some((h) => h.startsWith('PAINAD al egreso (02/10/2026): 1/10')), 'el hallazgo vigente sí se informa');
});

test('el vigente sigue a la fecha aunque el momento diga «egreso»', () => {
  const egreso = guardado('barthel', barthelCon({ deambulacion: 3 }), { momento: 'egreso', fecha: '2026-10-03' });
  const actual = guardado('barthel', barthelCon({}), { momento: 'actual', fecha: '2026-10-09' });
  const { hallazgos, avisos } = hallazgosYSugerencias({ resultados: [actual, egreso] }, porId);
  assert.ok(!hallazgos.some((h) => /85\/100/.test(h)), 'no toma el egreso como vigente');
  assert.ok(avisos.some((a) => /posterior al egreso/.test(a)));
});

test('sin hallazgos: la conclusión se limita a los instrumentos aplicados', () => {
  const b = guardado('barthel', barthelCon({}), { fecha: '2026-10-10' });
  const t = notaValoracion({ resultados: [b] }, porId, DOMINIOS, fecha, 'completa');
  assert.ok(!/Sin hallazgos anormales/.test(t));
  assert.match(t, /Sin hallazgos que requieran atención en los instrumentos aplicados \(Barthel\); la conclusión se limita a ellos\./);
  assert.match(t, /sin instrumentos aplicados: cognitivo, afectivo, fragilidad y sarcopenia, nutrición/);
  // Si todo lo aplicado fue no evaluable, no se concluye nada.
  const solo = notaValoracion({ resultados: [moca] }, porId, DOMINIOS, fecha, 'completa');
  assert.match(solo, /No hay instrumentos interpretables en esta valoración/);
});

test('fechas: se muestran cuando difieren de la fecha de la nota; aviso de episodios largos', () => {
  const b1 = guardado('barthel', barthelCon({}), { fecha: '2026-01-05' });
  const b2 = guardado('barthel', barthelCon({ banarse: 1 }), { fecha: '2026-10-10' });
  const t = notaValoracion({ resultados: [b1, b2] }, porId, DOMINIOS, fecha, 'lista');
  assert.match(t, /- Barthel del 05\/01\/2026: 100\/100/);
  assert.match(t, /- Barthel: 95\/100/);
  const { avisos } = hallazgosYSugerencias({ resultados: [b1, b2] }, porId);
  assert.ok(avisos.some((a) => /mismo episodio clínico/.test(a)));
});

test('unidades y categorías se leen bien en todos los instrumentos', () => {
  for (const e of escalas) {
    const g = guardado(e.id, EJEMPLOS[e.id](), { fecha: '2026-10-10' });
    const v = valorGuardado(g);
    assert.ok(v && !/undefined|NaN|null|Infinity|\(\(|\)\)/.test(v), `${e.id}: «${v}»`);
    assert.ok(!/^[a-z]+ ·/.test(v), `${e.id}: categoría mal escrita «${v}»`);
    for (const f of ['parrafo', 'lista', 'completa']) {
      const t = notaValoracion({ resultados: [g] }, porId, DOMINIOS, fecha, f);
      assert.ok(!/undefined|NaN|null|Infinity/.test(t), `${e.id}/${f}`);
    }
  }
  assert.equal(cifraGuardada(guardado('velocidad', resp('velocidad', { distancia: '4 metros', tiempo: 5 }))), '0.80 m/s');
  assert.equal(cifraGuardada(guardado('tug', resp('tug', { estado: 'Sí', tiempo: 14.2 }))), '14.2 s');
  assert.match(cifraGuardada(guardado('ckdepi', resp('ckdepi', { creatinina: 1.2, edad: 78, sexo: 'Hombre' }))), /^\d+ mL\/min\/1\.73 m²$/);
  assert.equal(valorGuardado(guardado('tug', resp('tug', { estado: 'No puede realizarla' }))), 'no puede realizar la prueba');
});

test('resultado guardado con una versión anterior (sin id, momento ni fecha) sigue funcionando', () => {
  const viejo = { escalaId: 'barthel', puntaje: 85, max: 100, nivel: 'moderado', etiqueta: 'Dependencia moderada', resumen: 'Barthel: 85/100 (dependencia moderada).' };
  const v = { paciente: {}, resultados: [viejo] };
  assert.match(notaValoracion(v, porId, DOMINIOS, fecha, 'parrafo'), /Funcional: Barthel 85\/100 \(dependencia moderada\)\./);
  assert.match(notaValoracion(v, porId, DOMINIOS, fecha, 'lista'), /- Barthel: 85\/100 \(dependencia moderada\)\./);
  assert.match(notaValoracion(v, porId, DOMINIOS, fecha, 'completa'), /1\. RESULTADOS OBJETIVOS\nFuncional:\n- Barthel: 85\/100\./);
});

test('una checklist sin confirmar no llega a la nota', () => {
  const r = resp('frail', { fatiga: 'Algo de tiempo', resistencia: 'No', aerobica: 'No', perdida: 'No', enfermedades: [] });
  assert.equal(calcular(porId.frail, r).completo, false);
});
