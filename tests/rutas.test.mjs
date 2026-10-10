// Rutas clínicas y conexión entre SPPB, TUG, velocidad de marcha y Vivifrail.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RUTAS, pasosDe } from '../js/rutas.js';
import { almacen } from '../js/almacen.js';
import { calcular } from '../js/motor.js';
import { pasosConEstado, progresoRuta, siguientePendiente, tiempoRuta, urlPaso } from '../js/vistas/rutas-estado.js';
import { porId, resp, calc, todos, guardado } from './ayuda.mjs';

test('las siete rutas apuntan a instrumentos existentes con momentos válidos', () => {
  assert.equal(RUTAS.length, 7);
  for (const r of RUTAS) {
    const claves = new Set();
    for (const p of pasosDe(r)) {
      assert.ok(!claves.has(p.clave), `${r.id}: paso repetido ${p.clave}`);
      claves.add(p.clave);
      if (p.plan) continue;
      assert.ok(porId[p.id], `${r.id}: ${p.id}`);
      if (p.momento) assert.ok(porId[p.id].momentos, `${r.id}: ${p.id} no admite momentos`);
    }
    assert.ok(pasosDe(r).some((p) => !p.plan && !p.complementario), `${r.id}: sin núcleo`);
  }
});

test('la ruta rápida es breve y conserva el acceso a complementarias', () => {
  const rapida = RUTAS.find((r) => r.id === 'rapida');
  const nucleo = pasosDe(rapida).filter((p) => !p.plan && !p.complementario);
  assert.ok(nucleo.length <= 4, 'núcleo de 4 instrumentos o menos');
  assert.ok(pasosDe(rapida).some((p) => p.complementario));
  const t = tiempoRuta(rapida);
  assert.ok(t.max <= 25, `tiempo estimado ${t.texto}`);
  assert.match(t.texto, /min/);
  for (const r of RUTAS) assert.ok(tiempoRuta(r).max > 0, `${r.id}: sin tiempo estimado`);
});

test('la ruta completa no repite instrumentos ni mide dos veces la marcha en el núcleo', () => {
  const completa = RUTAS.find((r) => r.id === 'completa');
  const ids = pasosDe(completa).filter((p) => !p.plan).map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  const nucleo = pasosDe(completa).filter((p) => !p.plan && !p.complementario).map((p) => p.id);
  assert.ok(nucleo.includes('sppb') && !nucleo.includes('velocidad'), 'el SPPB ya incluye la velocidad de marcha');
});

test('hospitalización: prioridades y momento elegible', () => {
  const h = RUTAS.find((r) => r.id === 'hospital');
  const nucleo = pasosDe(h).filter((p) => !p.plan && !p.complementario);
  const tiene = (id, momento) => nucleo.some((p) => p.id === id && (momento === undefined || p.momento === momento));
  assert.ok(tiene('barthel', 'basal'), 'funcionalidad basal');
  assert.ok(nucleo.some((p) => p.id === 'barthel' && !p.momento), 'funcionalidad en el momento elegido');
  assert.ok(tiene('4at'), 'delirium');
  assert.ok(tiene('cfs', 'basal'), 'fragilidad basal');
  assert.ok(tiene('braden') && tiene('painad') && tiene('mnasf'), 'piel, dolor y nutrición');
  assert.ok(!nucleo.some((p) => p.id === 'katz'), 'Katz es alternativa, no duplica al Barthel en el núcleo');
  almacen.borrarTodo();
  const ingreso = pasosConEstado(h).find((p) => p.id === 'barthel' && p.clave === 'barthel');
  assert.equal(ingreso.momento, 'ingreso');
  almacen.guardarMomentoRuta('hospital', 'actual');
  const actual = pasosConEstado(h).find((p) => p.id === 'barthel' && p.clave === 'barthel');
  assert.equal(actual.momento, 'actual');
  assert.equal(pasosConEstado(h).find((p) => p.clave === 'barthel@basal').momento, 'basal', 'el basal no cambia');
  assert.equal(urlPaso(h, actual), '#/r/hospital/barthel@actual');
});

test('evaluación cognitiva: primero delirium, luego tamizaje y evaluación, con finalidad declarada', () => {
  const c = RUTAS.find((r) => r.id === 'cognitiva');
  const nucleo = pasosDe(c).filter((p) => !p.plan && !p.complementario);
  assert.deepEqual(nucleo.slice(0, 3).map((p) => p.id), ['4at', 'minicog', 'moca']);
  for (const p of nucleo) assert.ok(p.nota && p.nota.length > 20, `${p.id}: falta su finalidad`);
  assert.match(nucleo[0].nota, /delirium/);
  assert.match(nucleo[1].nota, /no diagnostica/);
});

test('calculadoras: función renal agrupada', () => {
  const calc2 = RUTAS.find((r) => r.id === 'calculadoras');
  const renal = pasosDe(calc2).filter((p) => p.grupo === 'Función renal').map((p) => p.id);
  assert.deepEqual(renal, ['ckdepi', 'cockcroft']);
});

test('progreso: omitir, retomar y continuar desde donde quedó', () => {
  almacen.borrarTodo();
  const rapida = RUTAS.find((r) => r.id === 'rapida');
  let p = progresoRuta(rapida);
  assert.equal(p.completos, 0);
  assert.equal(siguientePendiente(rapida).id, 'barthel');
  almacen.guardarResultado(guardado('barthel', todos('barthel', () => 0), { momento: 'actual', fecha: '2026-10-10' }));
  assert.equal(siguientePendiente(rapida).id, 'minicog');
  almacen.alternarOmitida('rapida', 'minicog', true);
  p = progresoRuta(rapida);
  assert.equal(p.completos, 1);
  assert.equal(p.omitidos, 1);
  assert.equal(siguientePendiente(rapida).id, 'gds15', 'continúa con el siguiente pendiente');
  almacen.alternarOmitida('rapida', 'minicog', false);
  assert.equal(siguientePendiente(rapida).id, 'minicog', 'retomado');
  // Una complementaria hecha no cuenta para el progreso del núcleo.
  almacen.guardarResultado(guardado('sarcf', todos('sarcf', () => 0), { fecha: '2026-10-10' }));
  p = progresoRuta(rapida);
  assert.equal(p.completos, 1);
  assert.equal(p.complementariosHechos, 1);
});

/* ---------- Vivifrail con datos de otras pruebas ---------- */

const viv = porId.vivifrail;
const vinculo = (id) => viv.vinculos.find((v) => v.id === id);
const aplicar = (id, res) => vinculo(id).aplicar(res);

test('Vivifrail recupera SPPB, TUG y velocidad de marcha solo con valores válidos', () => {
  const sppb = guardado('sppb', resp('sppb', { eq_juntos: 'Mantiene 10 s', eq_semi: 'Mantiene 10 s', eq_tandem: 'De 3 a 9.99 s', marcha_estado: 'Recorrido de 4 m', marcha_1: 5.6, marcha_2: 5.0, silla_pre: 'Sí', silla_estado: 'Sí', silla_t: 12 }), { fecha: '2026-10-10' });
  assert.equal(vinculo('sppb').disponible(sppb), true);
  assert.deepEqual(aplicar('sppb', sppb), { sppb: '9' });
  assert.equal(vinculo('sppbMarcha').disponible(sppb), true);
  assert.match(vinculo('sppbMarcha').advertencia(sppb), /6 m/);
  const tug = guardado('tug', resp('tug', { estado: 'Sí', tiempo: 21 }), { fecha: '2026-10-10' });
  const r1 = aplicar('tug', tug);
  assert.equal(viv.campos.find((c) => c.id === 'tug').opciones[r1.tug].clave, 'si');
  const tugNo = guardado('tug', resp('tug', { estado: 'Sí', tiempo: 20 }), { fecha: '2026-10-10' });
  assert.equal(viv.campos.find((c) => c.id === 'tug').opciones[aplicar('tug', tugNo).tug].clave, 'no', '20 s no es mayor de 20 s');
  const tugIncapaz = guardado('tug', resp('tug', { estado: 'No puede realizarla' }), { fecha: '2026-10-10' });
  assert.match(vinculo('tug').disponible(tugIncapaz), /decisión clínica/, 'no se infiere el criterio sin tiempo');
  const vm4 = guardado('velocidad', resp('velocidad', { distancia: '4 metros', tiempo: 5.2 }), { fecha: '2026-10-10' });
  assert.match(vinculo('velocidad').advertencia(vm4), /6 m/);
  const vm6 = guardado('velocidad', resp('velocidad', { distancia: '6 metros', tiempo: 7 }), { fecha: '2026-10-10' });
  assert.equal(vinculo('velocidad').advertencia(vm6), null);
  assert.equal(viv.campos.find((c) => c.id === 'vm6').opciones[aplicar('velocidad', vm6).vm6].clave, 'no', '0.857 m/s no es <0.8');
});

test('Vivifrail: algoritmo oficial, componente E y datos faltantes', () => {
  const base = { caidas: 'No', tug: 'No, 20 s o menos', vm6: 'No, 0.8 m/s o más', demencia: 'No' };
  const p = (m) => calc('vivifrail', { ...base, ...m });
  assert.equal(p({ sppb: '2' }).extras.programa, 'A');
  assert.equal(p({ sppb: '3' }).extras.programa, 'A');
  assert.equal(p({ sppb: '4' }).extras.programa, 'B');
  assert.equal(p({ sppb: '6', caidas: 'Sí' }).extras.programa, 'B + E');
  assert.equal(p({ sppb: '7', camina: 'De 30 a 45 minutos o más' }).extras.programa, 'C2');
  assert.equal(p({ sppb: '9', camina: 'De 10 a 30 minutos', demencia: 'Sí' }).extras.programa, 'C1 + E');
  assert.equal(p({ sppb: '10' }).extras.programa, 'D');
  assert.equal(p({ sppb: '12', tug: 'Sí, más de 20 s' }).extras.programa, 'D + E');
  // Caminata menor de 10 minutos: el algoritmo no define el programa y no se inventa uno.
  const indef = p({ sppb: '8', camina: 'Menos de 10 minutos' });
  assert.equal(indef.extras.programa, 'no definido');
  assert.match(indef.banda.texto, /no define el programa/);
  // Sin TUG ni velocidad: no se descarta el componente E.
  const pendiente = p({ sppb: '11', tug: 'No se ha medido', vm6: 'No se ha medido' });
  assert.equal(pendiente.extras.e, 'indeterminado');
  assert.equal(pendiente.extras.programa, 'D');
  assert.match(pendiente.lineas.join(' '), /falta TUG mayor de 20 s y velocidad de marcha/);
  assert.ok(pendiente.banda.sugerencias.some((s) => /el TUG y la velocidad/.test(s)));
  // Un criterio presente basta aunque falte otro.
  assert.equal(p({ sppb: '11', caidas: 'Sí', tug: 'No se ha medido' }).extras.e, 'si');
  // Sin respuestas de riesgo de caídas no hay resultado: no se usan valores predeterminados.
  assert.equal(calc('vivifrail', { sppb: '11' }).completo, false);
  assert.equal(calc('vivifrail', { ...base, sppb: '8' }).completo, false, 'falta el tiempo de caminata');
});

test('Vivifrail informa la procedencia y la fecha de los datos vinculados', () => {
  const r = resp('vivifrail', { sppb: '9', camina: 'De 10 a 30 minutos', caidas: 'No', tug: 'No se ha medido', vm6: 'No se ha medido', demencia: 'No' });
  r._vinculos = { sppb: { titulo: 'SPPB', texto: 'SPPB 9/12', etiqueta: 'actual', fecha: '2026-10-08', campos: ['sppb'] } };
  const res = calcular(viv, r);
  assert.match(res.lineas.join(' '), /Datos tomados de esta valoración: SPPB 9\/12 \(actual 08\/10\/2026\)/);
});

test('velocidad de marcha puede reutilizar la marcha de 4 m del SPPB, no la de 3 m', () => {
  const vin = porId.velocidad.vinculos[0];
  const s4 = guardado('sppb', resp('sppb', { eq_juntos: 'Mantiene 10 s', eq_semi: 'Lo intentó, menos de 10 s', marcha_estado: 'Recorrido de 4 m', marcha_1: 5, silla_pre: 'Sí', silla_estado: 'Sí', silla_t: 12 }));
  assert.equal(vin.disponible(s4), true);
  const r = vin.aplicar(s4);
  const res = calcular(porId.velocidad, r);
  assert.equal(res.mostrar, '0.80');
  const s3 = guardado('sppb', resp('sppb', { eq_juntos: 'Mantiene 10 s', eq_semi: 'Lo intentó, menos de 10 s', marcha_estado: 'Recorrido de 3 m', marcha_1: 4, silla_pre: 'Sí', silla_estado: 'Sí', silla_t: 12 }));
  assert.match(vin.disponible(s3), /3 m/);
});
