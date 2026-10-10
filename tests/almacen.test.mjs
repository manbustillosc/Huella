// Almacenamiento local: aplicaciones repetidas, reemplazos con confirmación, momentos y separación de valoraciones.
import test from 'node:test';
import assert from 'node:assert/strict';
import { almacen } from '../js/almacen.js';
import { porId, todos, guardado } from './ayuda.mjs';

const barthel = (extra) => guardado('barthel', todos('barthel', () => 0), extra);

test('basal, ingreso y egreso admiten un solo resultado; reemplazar conserva el identificador', () => {
  almacen.borrarTodo();
  const a = almacen.guardarResultado(barthel({ momento: 'basal', fecha: '2026-10-01' }), { unico: true });
  const b = almacen.guardarResultado(barthel({ momento: 'basal', fecha: '2026-10-02' }), { unico: true });
  assert.equal(almacen.resultadosSlot('barthel', 'basal').length, 1);
  assert.equal(b.id, a.id, 'el reemplazo del basal mantiene su identificador');
  assert.equal(almacen.resultado('barthel', 'basal').fecha, '2026-10-02');
});

test('el resultado actual no sobrescribe el basal', () => {
  almacen.borrarTodo();
  almacen.guardarResultado(barthel({ momento: 'basal', fecha: '2026-10-01' }), { unico: true });
  almacen.guardarResultado({ ...barthel({ momento: 'actual', fecha: '2026-10-05' }), puntaje: 60 });
  assert.equal(almacen.resultado('barthel', 'basal').puntaje, 100);
  assert.equal(almacen.resultado('barthel', 'actual').puntaje, 60);
  assert.equal(almacen.resultadosDe('barthel').length, 2);
});

test('aplicaciones repetidas: nueva aplicación conserva la anterior; reemplazo explícito la sustituye', () => {
  almacen.borrarTodo();
  const primera = almacen.guardarResultado({ ...guardado('4at', todos('4at', () => 0)), fecha: '2026-09-01' });
  const segunda = almacen.guardarResultado({ ...guardado('4at', todos('4at', () => 0)), fecha: '2026-09-03' });
  assert.notEqual(primera.id, segunda.id);
  assert.equal(almacen.resultadosDe('4at').length, 2, 'se conservan ambas aplicaciones');
  assert.equal(almacen.resultado('4at', undefined).fecha, '2026-09-03', 'la más reciente por fecha');
  const corregida = almacen.guardarResultado({ ...guardado('4at', todos('4at', (c) => c.opciones.length - 1)), fecha: '2026-09-03' }, { reemplazar: segunda.id });
  assert.equal(corregida.id, segunda.id);
  assert.equal(almacen.resultadosDe('4at').length, 2);
  assert.equal(almacen.resultadoPorId(segunda.id).puntaje, corregida.puntaje);
  almacen.quitarResultado(primera.id);
  assert.equal(almacen.resultadosDe('4at').length, 1);
});

test('las respuestas en edición pertenecen a una valoración y a un momento', () => {
  almacen.borrarTodo();
  almacen.guardarRespuestas('barthel', 'basal', { comer: 0 });
  almacen.guardarRespuestas('barthel', 'actual', { comer: 2 });
  assert.deepEqual(almacen.respuestas('barthel', 'basal'), { comer: 0 });
  assert.deepEqual(almacen.respuestas('barthel', 'actual'), { comer: 2 }, 'el basal y el actual no se mezclan');
  const id = almacen.valoracion().id;
  almacen.nuevaValoracion();
  assert.notEqual(almacen.valoracion().id, id);
  assert.deepEqual(almacen.respuestas('barthel', 'basal'), {}, 'una nueva valoración no hereda respuestas');
  assert.equal(almacen.valoracion().resultados.length, 0);
});

test('migración: resultados de versiones anteriores reciben identificador', () => {
  almacen.borrarTodo();
  const v = almacen.valoracion();
  v.resultados = [{ escalaId: 'barthel', puntaje: 85, max: 100, etiqueta: 'Dependencia moderada' }];
  almacen.guardarValoracion(v);
  const leida = almacen.valoracion();
  assert.ok(leida.resultados[0].id, 'se asigna un id');
  assert.equal(almacen.valoracion().resultados[0].id, leida.resultados[0].id, 'el id es estable');
});

test('momento elegido en una ruta y omisiones se guardan con la valoración', () => {
  almacen.borrarTodo();
  almacen.guardarMomentoRuta('hospital', 'actual');
  almacen.alternarOmitida('hospital', 'painad', true);
  assert.equal(almacen.momentoRuta('hospital'), 'actual');
  assert.deepEqual(almacen.omitidas('hospital'), ['painad']);
  almacen.alternarOmitida('hospital', 'painad', false);
  assert.deepEqual(almacen.omitidas('hospital'), []);
  almacen.nuevaValoracion();
  assert.equal(almacen.momentoRuta('hospital'), null);
});

test('no se guardan datos identificables: el paciente solo admite datos clínicos generales', () => {
  almacen.borrarTodo();
  const v = almacen.valoracion();
  assert.deepEqual(Object.keys(v).sort(), ['creada', 'id', 'paciente', 'resultados', 'rutas']);
  assert.deepEqual(v.paciente, {});
  assert.ok(porId.barthel);
});
