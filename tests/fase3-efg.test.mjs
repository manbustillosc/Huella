// Fase 3, módulos E, F y G: plan de atención geriátrica, seguimiento por episodios con exportación local e informes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { almacen } from '../js/almacen.js';
import { DOMINIOS } from '../js/dominios.js';
import { RUTAS } from '../js/rutas.js';
import {
  planVacio, planDe, fijarProblema, fijarPrioridad, agregarObjetivo, agregarIntervencion, agregarProblemaLibre, quitarProblemaLibre,
  nombreAmbito, lineasPlan, planConContenido, fijarPreferencias,
} from '../js/plan.js';
import { problemasPlan, sugerenciasDe, significadoClinico, seriesEvolucion, revaloraciones, objetivoVencido, SUGERENCIAS_DOMINIO } from '../js/atencion.js';
import {
  codigoEpisodio, episodioDe, asegurarEpisodio, fechasEvaluacion, cerrarEpisodio, reabrirEpisodio, exportarEpisodio,
  tieneContenido, FORMATO_EXPORTACION, nombreArchivo,
} from '../js/episodio.js';
import { validarImportacion } from '../js/importacion.js';
import { FORMATOS_INFORME, textoInforme, bloquesInforme, pieInforme } from '../js/informes.js';
import { CATALOGO_FUTURO } from '../js/vistas/catalogo.js';
import { clasificarCambio } from '../js/comparacion.js';
import { porId, resp, guardado, EJEMPLOS } from './ayuda.mjs';

const HOY = '2026-10-10';
const valoracion = (resultados = [], extra = {}) => ({ id: 'vt', creada: Date.parse('2026-10-01T12:00:00'), paciente: {}, resultados, rutas: {}, ...extra });
const tug = (t, fecha) => guardado('tug', resp('tug', { estado: 'Sí', tiempo: t }), { fecha });

test('lista de problemas: hallazgos de tamizaje derivados, estado y prioridad solo del médico', () => {
  const v = valoracion([tug(16, '2026-10-01'), guardado('barthel', EJEMPLOS.barthel(), { fecha: HOY })]);
  let probs = problemasPlan(v, porId, HOY);
  const caidas = probs.find((p) => p.ambito === 'dom:caidas');
  assert.ok(caidas, 'el TUG positivo crea el problema del dominio');
  assert.equal(caidas.derivado, 'tamizaje');
  assert.equal(caidas.estado, 'tamizaje');
  assert.equal(caidas.asignado, null);
  assert.equal(caidas.prioridad, null, 'nunca se asigna prioridad automáticamente');
  assert.ok(!probs.some((p) => p.ambito === 'dom:funcional'), 'un resultado sin hallazgo no crea problema');
  assert.equal(caidas.nombre, 'Caídas y movilidad');
  // El médico asigna estado y prioridad
  const plan = planDe(v);
  fijarProblema(plan, 'dom:caidas', { estado: 'confirmado', nota: '' }, HOY, 'Caídas');
  fijarPrioridad(plan, 'dom:caidas', 'alta', HOY, 'Caídas');
  v.plan = plan;
  probs = problemasPlan(v, porId, HOY);
  assert.equal(probs[0].ambito, 'dom:caidas', 'la prioridad alta va primero');
  assert.equal(probs[0].estado, 'confirmado');
  // Las intervenciones sugeridas no se agregan solas
  assert.equal(probs[0].intervenciones.length, 0);
  assert.ok(sugerenciasDe('dom:caidas').length >= 3);
  for (const d of DOMINIOS) assert.ok(Array.isArray(SUGERENCIAS_DOMINIO[d.id]), `sugerencias definidas para ${d.id}`);
  // Los estados disponibles son los del documento
  assert.ok(sugerenciasDe('icope:locomotora').length, 'ICOPE reutiliza las intervenciones del manual');
});

test('problemas agregados por el médico: nombre breve, sin duplicados; quitarlos borra su plan', () => {
  const plan = planVacio();
  const l = agregarProblemaLibre(plan, '  Sobrecarga   de la hija que cuida ', HOY);
  assert.equal(l.nombre, 'Sobrecarga de la hija que cuida');
  assert.match(l.ambito, /^libre:/);
  assert.equal(agregarProblemaLibre(plan, 'sobrecarga de la hija que cuida', HOY), null, 'sin duplicados');
  assert.equal(agregarProblemaLibre(plan, '   ', HOY), null);
  assert.equal(nombreAmbito(l.ambito, plan), 'Sobrecarga de la hija que cuida');
  agregarObjetivo(plan, l.ambito, { texto: 'Respiro semanal' }, HOY, l.nombre);
  fijarPrioridad(plan, l.ambito, 'intermedia', HOY, l.nombre);
  const v = valoracion([], { plan });
  const p = problemasPlan(v, porId, HOY);
  assert.equal(p[0].tipo, 'libre');
  assert.equal(p[0].estado, null, 'sin estado asignado');
  assert.ok(lineasPlan(plan).some((x) => x.startsWith('Sobrecarga de la hija que cuida')));
  quitarProblemaLibre(plan, l.ambito, HOY);
  assert.equal(plan.libres.length, 0);
  assert.equal(plan.objetivos.length, 0);
  assert.ok(!plan.prioridades[l.ambito]);
  assert.ok(plan.bitacora.some((b) => /Problema retirado/.test(b.texto)));
  assert.equal(nombreAmbito('dom:sueno'), 'Sueño');
});

test('revaloraciones y objetivos vencidos', () => {
  const plan = planVacio();
  plan.revaloraciones = { 'dom:caidas': '2026-10-05', 'dom:nutricion': '2026-11-01' };
  const r = revaloraciones(plan, HOY);
  assert.deepEqual(r.map((x) => x.dias), [-5, 22]);
  assert.equal(objetivoVencido({ plazo: '2026-10-01', estado: 'pendiente' }, HOY), true);
  assert.equal(objetivoVencido({ plazo: '2026-10-01', estado: 'cumplido' }, HOY), false);
  assert.equal(objetivoVencido({ plazo: '2026-12-01', estado: 'en_curso' }, HOY), false);
});

test('evolución: series con dos o más mediciones y cambio cuantitativo frente al clínicamente significativo', () => {
  const vm = (t, fecha) => guardado('velocidad', resp('velocidad', { distancia: '4 metros', tiempo: t }), { fecha });
  const v = valoracion([tug(11, '2026-09-20'), tug(16.4, HOY), vm(5, '2026-09-20'), vm(4.8, HOY), guardado('barthel', EJEMPLOS.barthel(), { fecha: HOY })]);
  const series = seriesEvolucion(v, porId);
  assert.deepEqual(series.map((s) => s.escala.id).sort(), ['tug', 'velocidad'], 'el Barthel con una sola medición no se grafica');
  const vel = series.find((s) => s.escala.id === 'velocidad');
  assert.equal(vel.puntos.length, 2);
  assert.match(vel.significado.texto, /Menor que el cambio con significado clínico publicado/, '0.80 → 0.83 m/s');
  const tugS = series.find((s) => s.escala.id === 'tug');
  assert.ok(['categoria', 'sin_umbral'].includes(tugS.significado.tipo), 'sin umbral publicado, no se califica como clínicamente significativo');
  // Umbral sustancial del SPPB
  const sppb = porId.sppb;
  const c = { tipo: 'empeoramiento', dif: -2 };
  assert.equal(significadoClinico(sppb, c).tipo, 'sustancial');
  assert.equal(significadoClinico(porId.barthel, { tipo: 'empeoramiento', dif: -5 }).tipo, 'sin_umbral');
  assert.equal(significadoClinico(porId.barthel, { tipo: 'no_interpretable' }).tipo, 'no_interpretable');
  // La comparación se limita al episodio: los resultados de otro episodio no están en la valoración
  const a = tug(11, '2026-09-20');
  const b = tug(16.4, HOY);
  assert.equal(clasificarCambio(porId.tug, a, b).tipo, 'empeoramiento');
});

test('episodio: código anónimo, fechas de evaluación, cierre y reapertura', () => {
  const c = codigoEpisodio();
  assert.match(c, /^EP-[A-HJ-NP-Z2-9]{6}$/);
  assert.notEqual(codigoEpisodio(), c);
  const v = valoracion([tug(11, '2026-09-20'), tug(16.4, HOY), tug(12, HOY)]);
  assert.equal(asegurarEpisodio(v), true);
  assert.match(v.episodio.codigo, /^EP-/);
  assert.equal(asegurarEpisodio(v), false, 'no cambia el código ya asignado');
  assert.equal(episodioDe(v).abierto, '2026-10-01');
  assert.deepEqual(fechasEvaluacion(v), ['2026-09-20', HOY]);
  cerrarEpisodio(v, HOY, 'egreso');
  assert.equal(episodioDe(v).estado, 'cerrado');
  assert.equal(episodioDe(v).cerrado, HOY);
  reabrirEpisodio(v);
  assert.equal(episodioDe(v).estado, 'abierto');
  assert.equal(episodioDe(v).cerrado, '');
  assert.equal(tieneContenido(valoracion()), false);
  assert.equal(tieneContenido(v), true);
  // Sin datos personales en el episodio
  assert.deepEqual(Object.keys(episodioDe(v)).sort(), ['abierto', 'cerrado', 'codigo', 'estado', 'etiqueta', 'motivoCierre']);
});

test('archivo local de episodios: cerrar archiva, abrir intercambia, borrar elimina', () => {
  almacen.borrarTodo();
  const v = almacen.valoracion();
  assert.equal(almacen.episodios().length, 0);
  almacen.archivarYNueva();
  assert.equal(almacen.episodios().length, 0, 'una valoración vacía no se archiva');
  const v1 = almacen.valoracion();
  almacen.guardarResultado(tug(11, HOY));
  const id1 = v1.id;
  almacen.archivarYNueva();
  assert.equal(almacen.episodios().length, 1);
  assert.notEqual(almacen.valoracion().id, id1);
  assert.notEqual(almacen.valoracion().episodio.codigo, v1.episodio.codigo);
  almacen.guardarResultado(tug(14, HOY));
  const id2 = almacen.valoracion().id;
  assert.ok(almacen.abrirEpisodio(id1));
  assert.equal(almacen.valoracion().id, id1);
  assert.deepEqual(almacen.episodios().map((e) => e.id), [id2], 'la actual pasa al archivo');
  almacen.borrarEpisodio(id2);
  assert.equal(almacen.episodios().length, 0);
  assert.ok(v.id);
  almacen.borrarTodo();
});

test('exportación e importación local: formato, validación y avisos', () => {
  const v = valoracion([tug(11, '2026-09-20')], { paciente: { edad: '82', sexo: 'mujer', contexto: 'consulta por caídas' }, episodio: { codigo: 'EP-ABCDEF', estado: 'cerrado', abierto: '2026-09-20', cerrado: HOY } });
  const x = exportarEpisodio(v, '2.0.0', new Date('2026-10-10T18:00:00Z'));
  assert.equal(x.formato, FORMATO_EXPORTACION);
  assert.equal(x.version, 1);
  assert.match(x.aviso, /sin datos de identificación/);
  assert.equal(nombreArchivo(v, HOY), 'huella-EP-ABCDEF-2026-10-10.json');
  const r = validarImportacion(JSON.parse(JSON.stringify(x)), porId);
  assert.equal(r.ok, true);
  assert.equal(r.valoracion.resultados.length, 1);
  assert.deepEqual(Object.keys(r.valoracion.paciente).sort(), ['contexto', 'edad', 'sexo'], 'solo los campos clínicos generales');
  assert.ok(r.avisos.some((a) => /contexto clínico/.test(a)));
  assert.equal(r.resumen.codigo, 'EP-ABCDEF');
  // Archivos no válidos
  assert.equal(validarImportacion(null, porId).ok, false);
  assert.equal(validarImportacion({ formato: 'otro' }, porId).ok, false);
  assert.equal(validarImportacion({ ...x, version: 99 }, porId).ok, false);
  assert.equal(validarImportacion({ ...x, episodio: { resultados: 'x' } }, porId).ok, false);
  // Fase 3.1: un instrumento desconocido o un campo de identificación rechazan el archivo completo
  const desconocido = { ...x, episodio: { ...x.episodio, resultados: [...x.episodio.resultados, { escalaId: 'no-existe', fecha: HOY }] } };
  const r2 = validarImportacion(desconocido, porId);
  assert.equal(r2.ok, false);
  assert.ok(r2.errores.some((a) => /no reconocido/.test(a)));
  const conNombre = { ...x, episodio: { ...x.episodio, paciente: { ...x.episodio.paciente, nombre: 'no debe pasar' } } };
  assert.equal(validarImportacion(conNombre, porId).ok, false);
  const fechaMala = { ...x, episodio: { ...x.episodio, resultados: [{ escalaId: 'tug', fecha: '10/10/2026' }] } };
  assert.equal(validarImportacion(fechaMala, porId).ok, false);
  // La importación se agrega al archivo y no reemplaza la valoración en curso
  almacen.borrarTodo();
  const actual = almacen.valoracion().id;
  const imp = almacen.importarEpisodio(r.valoracion);
  assert.ok(imp.ok);
  assert.equal(almacen.valoracion().id, actual);
  assert.equal(almacen.episodios().length, 1);
  almacen.borrarTodo();
});

test('informes: seis formatos, encabezado con el episodio, sin firma ni certificación', () => {
  assert.deepEqual(FORMATOS_INFORME.map((f) => f.id), ['evolucion', 'completa', 'dominios', 'icope', 'plan', 'seguimiento']);
  const plan = planVacio();
  fijarProblema(plan, 'dom:caidas', { estado: 'sospecha', nota: '' }, HOY, 'Caídas');
  fijarPrioridad(plan, 'dom:caidas', 'alta', HOY, 'Caídas');
  agregarObjetivo(plan, 'dom:caidas', { texto: 'Sin caídas en 3 meses', plazo: '2026-12-01' }, HOY, 'Caídas');
  agregarIntervencion(plan, 'dom:caidas', { categoria: 'caidas', texto: 'Evaluación multifactorial del riesgo de caídas.' }, HOY, 'Caídas');
  fijarPreferencias(plan, { importa: 'Seguir yendo al mercado' });
  const v = valoracion([tug(11, '2026-09-20'), tug(16.4, HOY), guardado('charlson', EJEMPLOS.charlson(), { fecha: HOY })], {
    paciente: { edad: '82', sexo: 'mujer' }, plan, episodio: { codigo: 'EP-ABCDEF', estado: 'abierto', abierto: '2026-09-20' },
  });
  assert.ok(planConContenido(plan));
  for (const f of FORMATOS_INFORME) {
    const t = textoInforme(f.id, v, { porId, dominios: DOMINIOS, hoy: HOY, version: '2.0.0' });
    assert.ok(t.includes('EP-ABCDEF'), `${f.id}: episodio`);
    assert.ok(t.includes('Fecha de elaboración: 10/10/2026'), `${f.id}: fecha`);
    assert.ok(t.endsWith(pieInforme('2.0.0')), `${f.id}: pie sin firma`);
    assert.ok(!/firmad[oa] por|certifico|cédula profesional/i.test(t), `${f.id}: sin firma ni certificación`);
    assert.ok(!/undefined|NaN|null|\[object/.test(t), `${f.id}: texto limpio`);
    const bloques = bloquesInforme(t);
    assert.equal(bloques[0].tipo, 'titulo');
    assert.ok(bloques.some((b) => b.tipo === 'encabezado'), `${f.id}: secciones`);
  }
  const seg = textoInforme('seguimiento', v, { porId, dominios: DOMINIOS, hoy: HOY, version: '2.0.0' });
  assert.match(seg, /Cambio cuantitativo: aumento de 5\.4 s/);
  assert.match(seg, /Significado clínico:/);
  const pl = textoInforme('plan', v, { porId, dominios: DOMINIOS, hoy: HOY, version: '2.0.0' });
  assert.match(pl, /Caídas y movilidad: sospecha clínica; prioridad alta/);
  assert.match(pl, /Comorbilidad y riesgo hospitalario: hallazgo de tamizaje \(derivado de los instrumentos\)/);
  assert.match(pl, /no sustituyen un documento de voluntad anticipada/);
  assert.match(textoInforme('icope', v, { porId, dominios: DOMINIOS, hoy: HOY, version: '2.0.0' }), /La OPS no respalda esta adaptación/);
  assert.match(textoInforme('evolucion', v, { porId, dominios: DOMINIOS, hoy: HOY, version: '2.0.0' }), /prioridad alta/);
});

test('inicio y catálogo: valoración paliativa y futuras herramientas sin implementar', () => {
  const pal = RUTAS.find((r) => r.id === 'paliativa');
  assert.ok(pal);
  assert.deepEqual(pal.planes, ['IPOS']);
  assert.match(pal.descripcion, /La supervivencia solo se estima si eliges el PPI/);
  const ids = [...pal.pasos, ...pal.complementarios].map((x) => x.id);
  for (const id of ['ppi', 'esasr', 'spict', 'necpal']) assert.ok(ids.includes(id), `${id} en la ruta paliativa`);
  const nombres = CATALOGO_FUTURO.map((x) => x.nombre);
  for (const n of ['VES-13', 'G8', 'SPICT', 'NECPAL', 'ESAS-r']) {
    assert.ok(!nombres.includes(n), `${n} ya no está en el catálogo`);
    assert.ok(Object.values(porId).some((e) => e.corto === n), `${n} implementado`);
  }
  for (const n of ['EQ-5D', 'WHOQOL-OLD', 'IPOS', 'Carga anticolinérgica (ACB)']) {
    assert.ok(nombres.includes(n), n);
    assert.ok(!Object.values(porId).some((e) => e.corto === n), `${n} no está implementado`);
  }
  for (const id of ['spict', 'necpal', 'g8', 'gpcog', 'gohai', 'must']) assert.ok(porId[id].registro, `${id} solo registra el resultado`);
});
