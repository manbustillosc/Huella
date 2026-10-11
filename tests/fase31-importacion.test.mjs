// Fase 3.1, prioridad 1: importación estricta, completa o nada.
import test from 'node:test';
import assert from 'node:assert/strict';
import { validarImportacion, fechaReal, MAX_RESULTADOS_IMPORTACION } from '../js/importacion.js';
import { exportarEpisodio } from '../js/episodio.js';
import { planVacio, agregarObjetivo, agregarIntervencion, fijarProblema } from '../js/plan.js';
import { almacen } from '../js/almacen.js';
import { porId, resp, guardado, EJEMPLOS } from './ayuda.mjs';

const tug = (t, fecha = '2026-10-01') => guardado('tug', resp('tug', { estado: 'Sí', tiempo: t }), { fecha });
function archivo(extra = {}) {
  const plan = planVacio();
  fijarProblema(plan, 'dom:caidas', { estado: 'sospecha', nota: '' }, '2026-10-01', 'Caídas');
  agregarObjetivo(plan, 'dom:caidas', { texto: 'Sin caídas', plazo: '2027-01-01' }, '2026-10-01', 'Caídas');
  agregarIntervencion(plan, 'dom:caidas', { categoria: 'caidas', texto: 'Evaluación multifactorial.' }, '2026-10-01', 'Caídas');
  const v = {
    id: 'vimport1', creada: Date.parse('2026-10-01T12:00:00'), paciente: { edad: '82', sexo: 'mujer' }, rutas: {},
    resultados: [tug(11), tug(16.4, '2026-10-08'), guardado('barthel', EJEMPLOS.barthel(), { fecha: '2026-10-01' }), guardado('frax', EJEMPLOS.frax(), { fecha: '2026-10-02' })],
    plan,
    medicacion: { meds: [{ id: 'm1', generico: 'metformina', dosis: '850 mg' }], stopp: { 'S-B1': { estado: 'no' } }, beers: { evitar: { estado: 'ok' } }, renal: null, paliativo: false },
    icope: { detalle: { audicion: [{ id: 'x1', fecha: '2026-10-03', prueba: 'Audiometría', hallazgo: 'hipoacusia moderada' }] } },
    episodio: { codigo: 'EP-ABCDEF', estado: 'cerrado', abierto: '2026-10-01', cerrado: '2026-10-08' },
    ...extra,
  };
  v.resultados.forEach((r, i) => { r.id = `r${i}`; });
  return JSON.parse(JSON.stringify(exportarEpisodio(v, '2.1.0', new Date('2026-10-10T12:00:00Z'))));
}
const conResultado = (x, i, cambios) => { x.episodio.resultados[i] = { ...x.episodio.resultados[i], ...cambios }; return x; };

test('fechas reales', () => {
  assert.equal(fechaReal('2026-02-28'), true);
  assert.equal(fechaReal('2026-02-30'), false, 'el 30 de febrero no existe');
  assert.equal(fechaReal('2026-13-01'), false);
  assert.equal(fechaReal('10/10/2026'), false);
  assert.equal(fechaReal('1890-01-01'), false);
  assert.equal(fechaReal('2999-01-01'), false, 'no se aceptan fechas futuras de aplicación');
});

test('archivo válido: se acepta completo, con plan, medicación e ICOPE', () => {
  const r = validarImportacion(archivo(), porId);
  assert.deepEqual(r.errores, []);
  assert.equal(r.ok, true);
  assert.equal(r.valoracion.resultados.length, 4);
  assert.equal(r.valoracion.plan.objetivos.length, 1);
  assert.equal(r.valoracion.medicacion.meds.length, 1);
  assert.equal(r.valoracion.icope.detalle.audicion.length, 1);
  assert.equal(r.resumen.codigo, 'EP-ABCDEF');
});

test('archivo corrupto o con estructura inválida: se rechaza entero', () => {
  assert.equal(validarImportacion(null, porId).ok, false);
  assert.equal(validarImportacion('texto', porId).ok, false);
  assert.equal(validarImportacion({ formato: 'huella-episodio', version: 1, episodio: { resultados: {} } }, porId).ok, false);
  const x = archivo();
  x.episodio.resultados[1] = 'no es un objeto';
  const r = validarImportacion(x, porId);
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /Resultado 2: no es un objeto/.test(e)));
  const y = archivo();
  y.episodio.plan.objetivos[0].estado = 'inventado';
  assert.equal(validarImportacion(y, porId).ok, false, 'estructuras anidadas del plan');
  const z = archivo();
  z.episodio.medicacion.stopp.NOEXISTE = { estado: 'cumple' };
  assert.equal(validarImportacion(z, porId).ok, false, 'criterio STOPP/START desconocido');
  const w = archivo();
  w.episodio.icope.detalle.audicion[0].fecha = '2026-02-31';
  assert.equal(validarImportacion(w, porId).ok, false, 'fecha inválida en ICOPE');
  const d = archivo();
  d.episodio.resultados[1].id = d.episodio.resultados[0].id;
  assert.ok(validarImportacion(d, porId).errores.some((e) => /identificadores repetidos/.test(e)));
  const u = archivo();
  u.episodio.resultados[0].escalaId = 'escala-inventada';
  assert.ok(validarImportacion(u, porId).errores.some((e) => /no reconocido/.test(e)));
});

test('puntajes imposibles e inconsistentes con las respuestas: se rechaza', () => {
  const x = conResultado(archivo(), 2, { puntaje: 150 });
  const r = validarImportacion(x, porId);
  assert.equal(r.ok, false);
  assert.ok(r.errores.some((e) => /Barthel.*puntaje imposible/.test(e)));
  // Puntaje dentro del intervalo pero distinto del que dan sus respuestas
  const y = archivo();
  const b = y.episodio.resultados[2];
  y.episodio.resultados[2] = { ...b, puntaje: b.puntaje === 100 ? 95 : 100 };
  const r2 = validarImportacion(y, porId);
  assert.equal(r2.ok, false);
  assert.ok(r2.errores.some((e) => /no coincide con sus respuestas/.test(e)));
  // Unidad inconsistente
  const z = conResultado(archivo(), 0, { unidad: 'min' });
  assert.ok(validarImportacion(z, porId).errores.some((e) => /unidad inconsistente/.test(e)));
  // Valor que no es número
  const w = conResultado(archivo(), 0, { valor: '11' });
  assert.ok(validarImportacion(w, porId).errores.some((e) => /no es un número/.test(e)));
});

test('fechas inválidas: se rechaza', () => {
  assert.equal(validarImportacion(conResultado(archivo(), 0, { fecha: '2026-02-30' }), porId).ok, false);
  assert.equal(validarImportacion(conResultado(archivo(), 0, { fecha: '01/10/2026' }), porId).ok, false);
  const x = archivo();
  x.episodio.episodio.cerrado = '2026-99-01';
  assert.equal(validarImportacion(x, porId).ok, false);
});

test('campos inesperados: se rechaza y no se descarta nada en silencio', () => {
  const a = conResultado(archivo(), 0, { campoRaro: 1 });
  assert.ok(validarImportacion(a, porId).errores.some((e) => /campos no reconocidos \(campoRaro\)/.test(e)));
  const b = archivo();
  b.episodio.paciente.nombre = 'Juana Pérez';
  const rb = validarImportacion(b, porId);
  assert.equal(rb.ok, false);
  assert.ok(rb.errores.some((e) => /datos de identificación/.test(e)));
  const c = archivo();
  c.extra = true;
  assert.equal(validarImportacion(c, porId).ok, false);
});

test('más de 500 resultados: se rechaza todo con el límite explícito y sin cambios en el navegador', () => {
  almacen.borrarTodo();
  const antes = { val: almacen.valoracion().id, eps: almacen.episodios().length };
  const x = archivo();
  const base = x.episodio.resultados[0];
  x.episodio.resultados = Array.from({ length: MAX_RESULTADOS_IMPORTACION + 1 }, (_, i) => ({ ...base, id: `r${i}` }));
  const r = validarImportacion(x, porId);
  assert.equal(r.ok, false);
  assert.match(r.errores[0], /501 resultados y el máximo que se puede importar es 500\. No se importó nada\./);
  assert.equal(almacen.valoracion().id, antes.val);
  assert.equal(almacen.episodios().length, antes.eps);
  // Exactamente 500 sí se acepta
  x.episodio.resultados = x.episodio.resultados.slice(0, 500);
  assert.equal(validarImportacion(x, porId).ok, true);
  almacen.borrarTodo();
});

test('archivos exportados con versiones anteriores (sin los campos nuevos de FRAX) se siguen importando, con aviso', () => {
  const x = archivo();
  const i = x.episodio.resultados.findIndex((r) => r.escalaId === 'frax');
  const viejo = { ...x.episodio.resultados[i].respuestas };
  delete viejo.herramienta;
  x.episodio.resultados[i] = { ...x.episodio.resultados[i], respuestas: viejo, extras: { mayor: 14.2, cadera: 3.5, dmo: true } };
  const r = validarImportacion(x, porId);
  assert.equal(r.ok, true, JSON.stringify(r.errores));
  assert.ok(r.avisos.some((a) => /no se pudieron recalcular con esta versión; se conserva el resultado registrado/.test(a)));
});
