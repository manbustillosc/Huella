// Versión 2.13.1: correcciones de la segunda auditoría (31 de octubre de 2026). Cada prueba reproduce el problema
// confirmado en la 2.13.0 y verifica su corrección. Todos los datos son ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { almacen, mensajeFallo, mensajeNoGuardado } from '../js/almacen.js';
import { calcular, resumenDe } from '../js/motor.js';
import { mismoContenido, contenidoClinico } from '../js/comparacion.js';
import { aGuardado, planGuardado, renderEscala } from '../js/vistas/escala.js';
import { renderVpo } from '../js/vistas/vpo.js';
import { leerCreatinina, creatininaMgDl, gupta } from '../escalas/prequirurgicas.js';
import { GUIAS_VPO, DIAGRAMAS } from '../js/vpo.js';
import { exportarEpisodio } from '../js/episodio.js';
import { porId, resp, calc, guardado } from './ayuda.mjs';

const fuente = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');

// Almacenamiento simulado que puede fallar como un navegador real.
function almacenamientoFalso() {
  const datos = new Map();
  const a = {
    fallo: null, // { clave } → toda escritura de esa clave falla por almacenamiento lleno
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem(k, v) {
      if (a.fallo && k === `huella.${a.fallo.clave}`) throw Object.assign(new Error('lleno'), { name: 'QuotaExceededError' });
      datos.set(k, String(v));
    },
    removeItem: (k) => datos.delete(k),
    key: (i) => [...datos.keys()][i] ?? null,
    get length() { return datos.size; },
    crudo: (k) => (datos.has(`huella.${k}`) ? JSON.parse(datos.get(`huella.${k}`)) : null),
  };
  return a;
}
const usar = () => {
  const ls = almacenamientoFalso();
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() });
  return ls;
};
const restaurar = () => almacen._usarAlmacenamiento();

/* ---------- 1. Resultados idénticos ---------- */

const e = porId.barthel;
const opcion = (campo, valor) => e.campos.find((c) => c.id === campo).opciones.findIndex((o) => o.valor === valor);
const maximo = () => Object.fromEntries(e.campos.map((c) => [c.id, opcion(c.id, Math.max(...c.opciones.map((o) => o.valor)))]));
// Barthel 85: escalones 5 y vestirse 5 (y arreglarse 0) frente a escalones 0 y vestirse 10: mismo total.
const respA = () => ({ ...maximo(), escalones: opcion('escalones', 5), vestirse: opcion('vestirse', 5), arreglarse: opcion('arreglarse', 0), _fecha: '2026-10-31' });
const respB = () => ({ ...maximo(), escalones: opcion('escalones', 0), vestirse: opcion('vestirse', 10), arreglarse: opcion('arreglarse', 0), _fecha: '2026-10-31' });
const ctx = { e, momento: undefined };

test('1. Barthel 85 corregido con respuestas que se compensan: se guarda la corrección y aparece en el desglose', () => {
  usar();
  const rA = respA();
  const resA = calcular(e, rA);
  assert.equal(resA.puntaje, 85);
  const gA = aGuardado(e, resA, rA, undefined);
  const p0 = planGuardado(ctx, gA, rA);
  assert.equal(p0.accion, 'nuevo');
  const guardadoA = almacen.guardarResultado(gA, { unico: false });
  // Sin ningún cambio, el comportamiento no cambia: «En la valoración».
  assert.ok(planGuardado(ctx, aGuardado(e, resA, rA, undefined), rA).igual, 'mismo contenido: ya está guardado');

  // Corrección: dos respuestas distintas, mismo total y mismo resumen.
  const rB = { ...respB(), _origen: guardadoA.id };
  const resB = calcular(e, rB);
  assert.equal(resB.puntaje, 85);
  const gB = aGuardado(e, resB, rB, undefined);
  assert.equal(resumenDe(e, resA), resumenDe(e, resB), 'el resumen coincide: el criterio anterior las daba por iguales');
  const plan = planGuardado(ctx, gB, rB);
  assert.equal(plan.igual, undefined, 'ya no se considera idéntico');
  assert.equal(plan.accion, 'reemplazar');
  assert.equal(plan.objetivo.id, guardadoA.id, 'reemplaza la aplicación que se está corrigiendo');
  assert.match(plan.confirmar, /^Actualizar la aplicación/, 'con confirmación');
  assert.ok(fuente('../js/vistas/escala.js').includes("Toca otra vez para reemplazar"), 'reemplazar sigue pidiendo un segundo toque');

  almacen.guardarResultado(gB, { reemplazar: plan.objetivo.id });
  const rs = almacen.resultadosDe('barthel');
  assert.equal(rs.length, 1, 'se reemplazó, no se duplicó');
  assert.equal(rs[0].id, guardadoA.id, 'conserva el identificador');
  assert.equal(rs[0].respuestas.escalones, opcion('escalones', 0));
  assert.equal(rs[0].respuestas.vestirse, opcion('vestirse', 10));
  const desglose = calcular(e, rs[0].respuestas).desglose;
  const fila = (id) => desglose.find((d) => d.campo.id === id);
  assert.equal(fila('escalones').valor, 0, 'el desglose muestra la corrección');
  assert.equal(fila('vestirse').valor, 10);
  assert.ok(planGuardado(ctx, aGuardado(e, resB, rB, undefined), rB).igual, 'tras guardar, la corrección queda «En la valoración»');
  restaurar();
});

test('1. El contenido clínico excluye solo campos técnicos y tolera claves vacías de versiones anteriores', () => {
  const r = respA();
  const g = aGuardado(e, calcular(e, r), r, undefined);
  assert.ok(mismoContenido(g, { ...g, id: 'r1', guardado: 123 }), 'identificador y marca de guardado no cuentan');
  assert.ok(mismoContenido(g, { ...g, respuestas: { ...g.respuestas, _origen: 'r9' } }), 'el enlace a la aplicación corregida no cuenta');
  const antiguo = { ...g };
  delete antiguo.alertas; delete antiguo.vinculos; delete antiguo.fechaReferencia; delete antiguo.fuente;
  assert.ok(mismoContenido(g, antiguo), 'un resultado de una versión anterior sin esos campos vacíos sigue siendo el mismo');
  assert.ok(!mismoContenido(g, { ...g, fuente: 'cuidador' }), 'la fuente cuenta');
  assert.ok(!mismoContenido(g, { ...g, fecha: '2026-10-30' }), 'la fecha cuenta');
  assert.ok(!mismoContenido(g, { ...g, vinculos: [{ titulo: 'x', texto: 'y' }] }), 'los datos vinculados cuentan');
  assert.ok(!mismoContenido(g, { ...g, extras: { otro: 1 } }), 'la información adicional cuenta');
  assert.equal(contenidoClinico({ b: 1, a: { d: null, c: 2 } }), contenidoClinico({ a: { c: 2 }, b: 1 }), 'el orden de las claves no importa');
});

/* ---------- 2. Creatinina reutilizada en Gupta ---------- */

const conCreatinina = (creatinina, unidad) => ({ respuestas: { edad: 78, ...(creatinina === undefined ? {} : { creatinina }), ...(unidad ? { creatinina_u: unidad } : {}) } });
const vinculo = gupta.vinculos.find((v) => v.escala === 'ckdepi');

test('2. Creatinina válida: 1.0, 2.0, su equivalente en µmol/L y exactamente 1.5 mg/dL', () => {
  assert.equal(creatininaMgDl(conCreatinina(1.0)), 1);
  assert.deepEqual(vinculo.aplicar(conCreatinina(1.0)), { creatinina: 0 });
  assert.equal(creatininaMgDl(conCreatinina('2.0', 'mgdl')), 2);
  assert.deepEqual(vinculo.aplicar(conCreatinina('2.0', 'mgdl')), { creatinina: 1 });
  assert.equal(creatininaMgDl(conCreatinina(176.8, 'umol')), 2, '176.8 µmol/L = 2.0 mg/dL');
  assert.deepEqual(vinculo.aplicar(conCreatinina(176.8, 'umol')), { creatinina: 1 });
  assert.equal(creatininaMgDl(conCreatinina('1,5')), 1.5);
  assert.deepEqual(vinculo.aplicar(conCreatinina(1.5)), { creatinina: 0 }, 'Gupta usa «mayor de 1.5»: 1.5 exacto no suma');
  assert.equal(creatininaMgDl(conCreatinina(132.6, 'umol')), 1.5, '132.6 µmol/L queda en 1.5 sin error de redondeo');
  assert.deepEqual(vinculo.aplicar(conCreatinina(132.6, 'umol')), { creatinina: 0 });
  assert.equal(vinculo.describir(conCreatinina(1.5)), 'Creatinina 1.5 mg/dL (1.5 o menos)');
  for (const c of [1.0, 2.0, 1.5]) assert.equal(vinculo.disponible(conCreatinina(c)), true);
});

test('2. Creatinina ausente o no válida: nunca 0 mg/dL; el vínculo se deshabilita y explica el motivo', () => {
  const casos = {
    'campo vacío': conCreatinina(''),
    'solo espacios': conCreatinina('   '),
    'campo inexistente': conCreatinina(undefined),
    'objeto respuestas ausente': { valor: 60, fecha: '2026-10-30' },
    'resultado nulo': null,
    'valor no numérico': conCreatinina('abc'),
    'valor nulo': conCreatinina(null),
    negativo: conCreatinina(-1),
    cero: conCreatinina(0),
    'imposible (mg/dL)': conCreatinina(40),
    'unidad desconocida': conCreatinina(1, 'mmol'),
  };
  for (const [nombre, res] of Object.entries(casos)) {
    assert.equal(creatininaMgDl(res), null, nombre);
    const d = vinculo.disponible(res);
    assert.equal(typeof d, 'string', `${nombre}: el vínculo no está disponible`);
    assert.ok(d.length > 20, `${nombre}: explica el motivo (${d})`);
  }
  assert.match(leerCreatinina(conCreatinina('')).motivo, /no tiene la creatinina registrada/);
  assert.match(leerCreatinina({ valor: 60 }).motivo, /no conserva sus respuestas/);
  assert.match(leerCreatinina(conCreatinina('abc')).motivo, /no es un valor válido \(debe estar entre 0.2 y 25 mg\/dL\)/);
  // Los coeficientes de Gupta no cambian.
  assert.equal(gupta.campos.find((c) => c.id === 'creatinina').opciones.map((o) => o.valor).join(), '0,0.61', 'coeficiente publicado de creatinina >1.5');
});

test('2. En la pantalla de Gupta, el botón para reutilizar una creatinina vacía aparece deshabilitado con el motivo', () => {
  usar();
  const g = guardado('ckdepi', resp('ckdepi', { creatinina: 1.2, edad: 78, sexo: 'Hombre' }), { fecha: '2026-10-30' });
  g.respuestas = { ...g.respuestas, creatinina: '' }; // como un resultado guardado con el campo vacío
  almacen.guardarResultado(g);
  const html = renderEscala({ vista: 'escala', id: 'gupta', ruta: null });
  assert.match(html, /<span id="vin-motivo-ckdepi">El resultado guardado no tiene la creatinina registrada\.<\/span><\/div><button class="btn btn-chico" type="button" disabled aria-describedby="vin-motivo-ckdepi">No disponible<\/button>/);
  assert.doesNotMatch(html, /data-vincular="ckdepi"/, 'sin botón activo');
  assert.match(fuente('../js/vistas/escala.js'), /if \(!res \|\| vin\.disponible\(res\) !== true\) return;/, 'al aplicar se vuelve a comprobar');
  restaurar();
});

/* ---------- 3. Mensajes de guardado ---------- */

// Elemento #aviso simulado para leer lo que se anuncia.
function conAviso(fn) {
  const el = { textContent: '', classList: { add() {}, remove() {} } };
  const antes = globalThis.document;
  globalThis.document = { querySelector: (s) => (s === '#aviso' ? el : null) };
  try { return fn(el); } finally { globalThis.document = antes; }
}

test('3. Solo se anuncia «guardado» si la escritura se comprobó; si falla, se dice que queda solo en esta pestaña', async () => {
  const { avisoGuardado } = await import('../js/ui.js');
  const ls = usar();
  const v = almacen.valoracion();
  v.episodio = { ...v.episodio, etiqueta: 'consulta' };
  almacen.guardarValoracion(v);
  conAviso((el) => {
    assert.equal(avisoGuardado('Etiqueta guardada'), true);
    assert.equal(el.textContent, 'Etiqueta guardada');
  });
  ls.fallo = { clave: 'valoracion' };
  const v2 = almacen.valoracion();
  v2.episodio = { ...v2.episodio, etiqueta: 'hospitalización' };
  const r = almacen.guardarValoracion(v2);
  assert.deepEqual(r, { ok: false, motivo: 'lleno' });
  assert.deepEqual(almacen.ultimaEscritura(), { ok: false, motivo: 'lleno', clave: 'valoracion', sesion: false, enMemoria: true });
  conAviso((el) => {
    assert.equal(avisoGuardado('Etiqueta guardada'), false);
    assert.doesNotMatch(el.textContent, /Etiqueta guardada/, 'sin mensaje de éxito');
    assert.match(el.textContent, /^No guardado\. El almacenamiento del navegador está lleno: el cambio se conserva solo en esta pestaña/);
  });
  // La información no se pierde: sigue en memoria para esta pestaña y entra en la exportación.
  assert.equal(almacen.valoracion().episodio.etiqueta, 'hospitalización');
  assert.equal(ls.crudo('valoracion').episodio.etiqueta, 'consulta', 'lo guardado antes queda intacto');
  assert.equal(exportarEpisodio(almacen.valoracion(), '2.13.1').episodio.episodio.etiqueta, 'hospitalización');
  const est = almacen.estadoGuardado();
  assert.equal(est.estado, 'error');
  assert.equal(est.mensaje, mensajeNoGuardado('lleno'), 'el estado explica que el cambio sigue en memoria');
  // Guardado silencioso (sin mensaje de éxito): solo avisa si falla.
  conAviso((el) => { assert.equal(avisoGuardado(), false); assert.match(el.textContent, /^No guardado\./); });
  // Al volver a funcionar el almacenamiento, el estado vuelve a «guardado» sin mensajes contradictorios.
  ls.fallo = null;
  almacen.guardarValoracion(almacen.valoracion());
  assert.equal(almacen.estadoGuardado().estado, 'guardado');
  assert.equal(ls.crudo('valoracion').episodio.etiqueta, 'hospitalización');
  conAviso((el) => { assert.equal(avisoGuardado('Etiqueta guardada'), true); assert.equal(el.textContent, 'Etiqueta guardada'); });
  restaurar();
});

test('3. Operaciones de episodios que fallan sin copia en memoria usan su propio mensaje; modo de solo sesión se distingue', async () => {
  const { avisoGuardado } = await import('../js/ui.js');
  const ls = usar();
  ls.fallo = { clave: 'episodios' };
  assert.equal(almacen.guardarEpisodios([]).ok, false);
  conAviso((el) => { avisoGuardado('Episodio borrado'); assert.equal(el.textContent, mensajeFallo('lleno')); });
  assert.equal(almacen.estadoGuardado().mensaje, mensajeFallo('lleno'));
  // Sin almacenamiento permanente (en Node no hay localStorage): «solo durante esta sesión».
  almacen._usarAlmacenamiento();
  almacen.guardarValoracion(almacen.valoracion());
  conAviso((el) => { avisoGuardado('Medicamento quitado'); assert.match(el.textContent, /^Medicamento quitado\. Solo durante esta sesión/); });
});

test('3. Las pantallas no anuncian éxito sin comprobar el guardado', () => {
  const exitos = {
    '../js/vistas/seguimiento.js': ['Episodio reabierto', 'Etiqueta guardada'],
    '../js/vistas/medicacion.js': ['Medicamento quitado', 'Función renal registrada', 'Función renal quitada', 'Función renal tomada de esta valoración'],
    '../js/vistas/valoracion.js': ['Quitado de la valoración'],
    '../js/vistas/plan-ui.js': ['Intervención agregada al plan', 'Preferencias guardadas', 'Objetivo agregado al plan', 'Cambio registrado', 'Problema quitado', 'Nota guardada'],
    '../js/vistas/icope.js': ['Evaluación detallada registrada', 'Registro quitado', 'Evaluación previa confirmada como vigente', 'Objetivo agregado al plan'],
    '../js/vistas/ruta.js': ['Instrumento retomado'],
  };
  for (const [archivo, textos] of Object.entries(exitos)) {
    const s = fuente(archivo);
    for (const t of textos) {
      assert.ok(s.includes(`avisoGuardado('${t}')`), `${archivo}: «${t}» se anuncia tras comprobar`);
      assert.ok(!s.includes(`aviso('${t}')`), `${archivo}: «${t}» sin comprobar`);
    }
  }
  // Guardados silenciosos (STOPP/START, Beers, datos del paciente) avisan si fallan.
  assert.ok((fuente('../js/vistas/medicacion.js').match(/guardar\(m\);\n\s+avisoGuardado\(\);/g) || []).length >= 4);
  assert.match(fuente('../js/vistas/valoracion.js'), /almacen\.guardarValoracion\(v\);\n\s+avisoGuardado\(\);/);
  // El resultado de una escala usa la escritura real, no el estado general.
  assert.match(fuente('../js/vistas/escala.js'), /const escritura = almacen\.ultimaEscritura\(\);/);
  // La línea de estado de Valoración se actualiza al cambiar el estado: nunca «Guardado» junto a «No guardado».
  assert.match(fuente('../js/vistas/valoracion.js'), /almacen\.alCambiarGuardado\(\(\) => \{/);
});

/* ---------- 4. Referencias de la VPO ---------- */

test('4. VPO: la reafirmación de 2026 de la guía AHA/ACC se cita sin cambiar los algoritmos', () => {
  assert.match(GUIAS_VPO.acc2026, /2026 AHA\/ACC\/ACS\/ASNC\/HRS\/SCA\/SCCT\/SCMR\/SVM Guideline/);
  assert.match(GUIAS_VPO.acc2026, /Circulation\. 2026;154\(13\):e413-e504\. doi:10\.1161\/CIR\.0000000000001472/);
  assert.match(GUIAS_VPO.acc2026, /10\.1016\/j\.jacc\.2026\.06\.017/);
  assert.match(GUIAS_VPO.acc2026, /sin cambios en sus recomendaciones/);
  assert.match(GUIAS_VPO.acc2024, /10\.1161\/CIR\.0000000000001285/, 'se conserva la edición 2024, que cita el lineamiento');
  const guias = DIAGRAMAS.flatMap((d) => d.fuentes).filter((f) => /AHA\/ACC 2024/.test(f.texto));
  assert.ok(guias.length >= 2 && guias.every((f) => f.origen === 'guia' && /reafirmada sin cambios en 2026/.test(f.texto)));
  assert.ok(DIAGRAMAS.every((d) => d.fuentes.some((f) => f.origen === 'lineamiento')), 'el lineamiento sigue diferenciado');
  assert.ok(porId.dasi.referencias.some((r) => r.doi === '10.1161/CIR.0000000000001472'));
  assert.match(renderVpo({ pestana: 'lista' }), /Guías internacionales citadas/);
  // Los algoritmos clínicos de la 2.13 no cambian.
  const ecg = JSON.stringify(DIAGRAMAS.find((d) => d.id === 'ecg').nodos);
  assert.match(ecg, /Sospecha de síndrome coronario agudo/);
});

/* ---------- 5. DXA: sitios centrales no interpretables ---------- */

const dxa = (x) => calc('dxa', { sexo: 'Mujer', edad: 74, menopausia: 'Sí', fractura: 'No', ...x });

test('5. DXA: columna no interpretable fuera de la categoría', () => {
  const r = dxa({ t_columna: -3.1, t_cuello: -1.6, t_cadera: -1.4, no_interpretables: ['t_columna'] });
  assert.equal(r.banda.id, 'baja', 'sin la columna no interpretable, no es osteoporosis');
  assert.equal(r.valor, -1.6);
  assert.ok(r.lineas.some((l) => /No interpretable según el informe, fuera de la categoría: columna lumbar \(L1–L4\) -3\.1/.test(l)));
  assert.deepEqual(r.extras.noInterpretables, [{ sitio: 't_columna', t: -3.1 }]);
  assert.equal(dxa({ t_columna: -3.1, t_cuello: -1.6, t_cadera: -1.4 }).banda.id, 'osteoporosis', 'sin marcar, se usa como antes');
});

test('5. DXA: cadera no interpretable fuera de la categoría', () => {
  const r = dxa({ t_columna: -1.2, t_cuello: -2.9, t_cadera: -2.7, no_interpretables: ['t_cuello', 't_cadera'] });
  assert.equal(r.banda.id, 'baja');
  assert.equal(r.valor, -1.2);
  assert.ok(r.lineas.some((l) => /cuello femoral -2\.9; cadera total -2\.7/.test(l)));
});

test('5. DXA: uso justificado del radio 33 % cuando columna y cadera no son interpretables', () => {
  const r = dxa({ t_columna: -3.0, t_cuello: -2.8, no_interpretables: ['t_columna', 't_cuello'], t_radio: -2.6, radio_motivo: 'La cadera o la columna no pueden medirse o interpretarse' });
  assert.equal(r.banda.id, 'osteoporosis');
  assert.equal(r.valor, -2.6, 'clasifica con el radio, no con los sitios no interpretables');
  assert.deepEqual(r.extras.radio, { t: -2.6, diagnostico: true, indicacion: 'central' });
  // Sin ningún sitio interpretable ni radio: se pide revisar.
  assert.ok(dxa({ t_columna: -3.0, no_interpretables: ['t_columna'] }).errores.no_interpretables);
  // Sin sitios centrales interpretables, el radio sin indicación no clasifica.
  assert.ok(dxa({ t_columna: -3.0, no_interpretables: ['t_columna'], t_radio: -2.6, radio_motivo: 'Ninguna: registrar el radio solo como dato adicional' }).errores.radio_motivo);
  // Indicación «central» con columna y cadera interpretables: se advierte.
  const inc = dxa({ t_columna: -1.2, t_cuello: -1.3, t_radio: -2.6, radio_motivo: 'La cadera o la columna no pueden medirse o interpretarse' });
  assert.ok(inc.lineas.some((l) => /verifica la indicación/.test(l)));
});

test('5. DXA: se conservan osteoporosis clínica frente a densitométrica y T-score frente a Z-score', () => {
  const fx = dxa({ t_columna: -3.1, t_cuello: -1.6, no_interpretables: ['t_columna'], fractura: 'Sí' });
  assert.equal(fx.banda.id, 'baja');
  assert.ok(fx.banda.hallazgo);
  assert.ok(fx.lineas.some((l) => /criterio clínico de osteoporosis/.test(l)));
  const z = calc('dxa', { sexo: 'Hombre', edad: 45, z_min: -2.1, t_columna: -2.7, fractura: 'No' });
  assert.equal(z.banda.id, 'zbaja');
  assert.equal(z.unidad, 'Z');
  const campo = porId.dxa.campos.find((c) => c.id === 'no_interpretables');
  assert.equal(campo.opcional, true);
  assert.equal(campo.visibleSi({}), false, 'solo aparece si se registró un sitio central');
  assert.equal(campo.visibleSi({ t_cuello: '-1,6' }), true);
});
