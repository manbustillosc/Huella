// Versión 2.13: correcciones de la auditoría integral del 30 de octubre de 2026. Cada prueba reproduce un hallazgo
// confirmado y verifica su corrección. Todos los datos son ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { almacen, mensajeFallo } from '../js/almacen.js';
import { tieneContenido, hayDato, cerrarEpisodio, exportarEpisodio, MAX_EPISODIOS } from '../js/episodio.js';
import { validarImportacion } from '../js/importacion.js';
import { respuestasSinAnadir } from '../js/pendientes.js';
import { DIAGRAMAS, GUIAS_VPO } from '../js/vpo.js';
import { segmentosHash } from '../js/ui.js';
import { INDICACIONES_RADIO } from '../escalas/osea.js';
import { porId, resp, calc, guardado } from './ayuda.mjs';

/* ---------- Almacenamiento simulado ---------- */

// Como un navegador real; puede fallar en la n-ésima escritura de una clave.
function almacenamientoFalso() {
  const datos = new Map();
  const cuenta = {};
  const a = {
    fallo: null, // { clave, desde } → falla la escritura número «desde» (1, 2, …) de esa clave y las siguientes
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem(k, v) {
      cuenta[k] = (cuenta[k] || 0) + 1;
      if (a.fallo && k === `huella.${a.fallo.clave}` && cuenta[k] >= a.fallo.desde) throw Object.assign(new Error('lleno'), { name: 'QuotaExceededError' });
      datos.set(k, String(v));
    },
    removeItem: (k) => datos.delete(k),
    key: (i) => [...datos.keys()][i] ?? null,
    get length() { return datos.size; },
    reiniciarCuenta: () => Object.keys(cuenta).forEach((k) => delete cuenta[k]),
  };
  return a;
}
const usar = () => {
  const ls = almacenamientoFalso();
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() });
  return ls;
};
const restaurar = () => almacen._usarAlmacenamiento();
const clonar = (x) => JSON.parse(JSON.stringify(x));

// Episodios que antes se consideraban vacíos: solo datos clínicos, solo revisión farmacológica, solo plan, etc.
const SOLO = {
  'datos clínicos': (v) => { v.paciente = { edad: '82', sexo: '', escolaridad: '', contexto: '' }; },
  'contexto clínico': (v) => { v.paciente = { edad: '', sexo: '', escolaridad: '', contexto: 'consulta por caídas' }; },
  'criterios STOPP/START revisados': (v) => { v.medicacion = { meds: [], renal: null, stopp: { 'S-A1': { estado: 'no' } }, beers: {}, paliativo: false }; },
  'categorías de Beers evaluadas': (v) => { v.medicacion = { meds: [], renal: null, stopp: {}, beers: { evitar: { estado: 'ok' } }, paliativo: false }; },
  'función renal de la revisión': (v) => { v.medicacion = { meds: [], renal: { tfg: { valor: 48, fecha: '2026-10-29', fuente: 'manual' } }, stopp: {}, beers: {}, paliativo: false }; },
  'contexto paliativo': (v) => { v.medicacion = { meds: [], renal: null, stopp: {}, beers: {}, paliativo: true }; },
  'prioridad del plan': (v) => { v.plan = { problemas: [], prioridades: { 'dom:caidas': 'alta' }, objetivos: [], intervenciones: [], revaloraciones: {}, preferencias: {}, bitacora: [], libres: [] }; },
  'fecha de revaloración': (v) => { v.plan = { problemas: [], prioridades: {}, objetivos: [], intervenciones: [], revaloraciones: { 'dom:caidas': '2026-12-01' }, preferencias: {}, bitacora: [], libres: [] }; },
  'nota en la bitácora': (v) => { v.plan = { problemas: [], prioridades: {}, objetivos: [], intervenciones: [], revaloraciones: {}, preferencias: {}, bitacora: [{ fecha: '2026-10-30', texto: 'Llamada con la familia', ts: 1 }], libres: [] }; },
  'reutilización ICOPE confirmada': (v) => { v.icope = { detalle: {}, reutilizacion: { vision: { tipo: 'resultado', id: 'x1', cribado: 'c1', fecha: '2026-10-30' } } }; },
  'momento de una ruta': (v) => { v.rutas = { hospital: { omitidas: [], momento: 'ingreso' } }; },
  'etiqueta del episodio': (v) => { v.episodio = { ...v.episodio, etiqueta: 'hospitalización por neumonía' }; },
  medicamentos: (v) => { v.medicacion = { meds: [{ id: 'm1', generico: 'paracetamol' }], renal: null, stopp: {}, beers: {}, paliativo: false }; },
  'resultados de escalas': (v) => { v.resultados = [guardado('tug', resp('tug', { estado: 'Sí', tiempo: 12 }), { fecha: '2026-10-30' })]; },
};

/* ---------- ERROR 01 y 07: contenido, cierre y exportación ---------- */

test('ERROR 01: una valoración recién creada no tiene contenido; cualquier dato capturado sí', () => {
  usar();
  const nueva = almacen.valoracion();
  assert.equal(tieneContenido(nueva), false, 'id, fecha y código automáticos no cuentan');
  const vacios = { ...clonar(nueva), paciente: { edad: '', sexo: '', escolaridad: '', contexto: '  ' }, medicacion: { meds: [], renal: null, stopp: {}, beers: {}, paliativo: false }, rutas: { rapida: { omitidas: [] } } };
  assert.equal(tieneContenido(vacios), false, 'campos vacíos tampoco');
  for (const [nombre, poner] of Object.entries(SOLO)) {
    const v = clonar(nueva);
    poner(v);
    assert.equal(tieneContenido(v), true, `solo ${nombre}`);
  }
  assert.equal(hayDato(0), true, 'un cero capturado es un dato');
  assert.equal(hayDato({ a: [null, '', false] }), false);
  restaurar();
});

test('ERROR 01: cerrar un episodio con cualquier dato lo archiva completo antes de empezar otro', () => {
  for (const [nombre, poner] of Object.entries(SOLO)) {
    usar();
    const v = almacen.valoracion();
    poner(v);
    almacen.guardarValoracion(v);
    const cerrada = cerrarEpisodio(clonar(almacen.valoracion()), '2026-10-30');
    const r = almacen.archivarYNueva(cerrada);
    assert.equal(r.ok, true, nombre);
    assert.equal(r.archivado, true, `${nombre}: se informa que quedó archivado`);
    const arch = almacen.episodios().find((e) => e.id === v.id);
    assert.ok(arch, `${nombre}: está en episodios archivados`);
    assert.deepEqual(arch, cerrada, `${nombre}: la copia archivada es idéntica`);
    assert.notEqual(almacen.valoracion().id, v.id, `${nombre}: se empezó una valoración nueva`);
    assert.equal(tieneContenido(almacen.valoracion()), false);
  }
  restaurar();
});

test('ERROR 01: si el archivo falla no se empieza otra valoración ni se anuncia éxito', () => {
  const ls = usar();
  const v = almacen.valoracion();
  SOLO['criterios STOPP/START revisados'](v);
  almacen.guardarValoracion(v);
  ls.fallo = { clave: 'episodios', desde: 1 };
  const r = almacen.archivarYNueva(cerrarEpisodio(clonar(almacen.valoracion()), '2026-10-30'));
  assert.deepEqual(r, { ok: false, motivo: 'lleno' });
  assert.equal(almacen.valoracion().id, v.id, 'la valoración sigue en curso');
  assert.deepEqual(almacen.valoracion().medicacion.stopp, { 'S-A1': { estado: 'no' } });
  assert.equal(almacen.episodios().length, 0);
  restaurar();
});

test('ERROR 01: archivado correcto pero sin poder empezar otra valoración: se dice tal cual', () => {
  const ls = usar();
  const v = almacen.valoracion();
  SOLO['datos clínicos'](v);
  almacen.guardarValoracion(v);
  ls.reiniciarCuenta();
  ls.fallo = { clave: 'valoracion', desde: 1 };
  const r = almacen.archivarYNueva(cerrarEpisodio(clonar(v), '2026-10-30'));
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'archivado_sin_nueva');
  assert.match(mensajeFallo(r.motivo), /quedó archivado/);
  assert.ok(almacen.episodios().some((e) => e.id === v.id), 'la copia archivada existe');
  assert.equal(almacen.valoracion().paciente.edad, '82', 'y la valoración en curso no se perdió');
  restaurar();
});

test('ERROR 07: se exporta cualquier episodio con información y la importación lo reproduce', () => {
  usar();
  const v = almacen.valoracion();
  for (const k of ['datos clínicos', 'criterios STOPP/START revisados', 'nota en la bitácora', 'reutilización ICOPE confirmada', 'etiqueta del episodio']) SOLO[k](v);
  assert.equal(tieneContenido(v), true, 'el botón de exportar se habilita con este mismo criterio');
  const archivo = JSON.parse(JSON.stringify(exportarEpisodio(v, '2.13.0', new Date('2026-10-30T12:00:00Z'))));
  const r = validarImportacion(archivo, porId);
  assert.equal(r.ok, true, r.errores?.join(' '));
  for (const k of ['paciente', 'medicacion', 'plan', 'icope', 'rutas', 'resultados']) assert.deepEqual(r.valoracion[k], v[k], k);
  assert.equal(r.valoracion.episodio.etiqueta, 'hospitalización por neumonía');
  assert.equal(r.valoracion.episodio.codigo, v.episodio.codigo);
  restaurar();
});

test('ERROR 01 y 07: la interfaz usa el mismo criterio para cerrar, avisar del límite y exportar', () => {
  const fuente = readFileSync(new URL('../js/vistas/seguimiento.js', import.meta.url), 'utf8');
  assert.match(fuente, /id="exportar"\$\{tieneContenido\(v\) \? '' : ' disabled'\}/);
  assert.match(fuente, /MAX_EPISODIOS && tieneContenido\(v\)/);
  assert.doesNotMatch(readFileSync(new URL('../js/episodio.js', import.meta.url), 'utf8'), /\['problemas', 'objetivos', 'intervenciones', 'libres'\]\.some/, 'sin la lista incompleta anterior');
});

/* ---------- ERROR 11: abrir episodios archivados ---------- */

const episodioArchivado = (i) => ({ id: `ep${i}`, creada: 1, paciente: {}, resultados: [guardado('tug', resp('tug', { estado: 'Sí', tiempo: 10 + (i % 5) }), { fecha: '2026-09-01' })], rutas: {}, episodio: { codigo: `EP-ABC${String(i).padStart(3, '0')}`, estado: 'cerrado', abierto: '2026-09-01', cerrado: '2026-09-02' } });

test('ERROR 11: con 30 archivados, abrir uno archiva la valoración en curso y el archivo vuelve a 30', () => {
  usar();
  const treinta = Array.from({ length: MAX_EPISODIOS }, (_, i) => episodioArchivado(i));
  assert.equal(almacen.guardarEpisodios(treinta).ok, true);
  const actual = almacen.valoracion();
  SOLO['categorías de Beers evaluadas'](actual);
  almacen.guardarValoracion(actual);
  const r = almacen.abrirEpisodio('ep7');
  assert.deepEqual(r, { ok: true, motivo: null, duplicado: false });
  assert.equal(almacen.valoracion().id, 'ep7');
  const ids = almacen.episodios().map((e) => e.id);
  assert.equal(ids.length, MAX_EPISODIOS, 'el límite se respeta al terminar');
  assert.ok(ids.includes(actual.id), 'la valoración anterior quedó archivada');
  assert.ok(!ids.includes('ep7'), 'sin duplicado del episodio abierto');
  assert.deepEqual(almacen.episodios().find((e) => e.id === actual.id).medicacion.beers, { evitar: { estado: 'ok' } });
  restaurar();
});

test('ERROR 11: si falla quitar la copia archivada, el episodio se abre, nada se pierde y se avisa del duplicado', () => {
  const ls = usar();
  assert.equal(almacen.guardarEpisodios([episodioArchivado(1), episodioArchivado(2)]).ok, true);
  const actual = almacen.valoracion();
  SOLO['contexto clínico'](actual);
  almacen.guardarValoracion(actual);
  ls.reiniciarCuenta();
  ls.fallo = { clave: 'episodios', desde: 2 }; // 1.ª escritura (archivar la actual) bien; 2.ª (quitar la abierta) falla
  const r = almacen.abrirEpisodio('ep1');
  assert.deepEqual(r, { ok: true, motivo: null, duplicado: true });
  assert.equal(almacen.valoracion().id, 'ep1');
  const ids = almacen.episodios().map((e) => e.id);
  assert.ok(ids.includes(actual.id) && ids.includes('ep1') && ids.includes('ep2'), 'todo conserva al menos una copia');
  restaurar();
});

test('ERROR 11: si falla escribir la valoración, todo queda como estaba', () => {
  const ls = usar();
  assert.equal(almacen.guardarEpisodios([episodioArchivado(1)]).ok, true);
  const actual = almacen.valoracion();
  SOLO['prioridad del plan'](actual);
  almacen.guardarValoracion(actual);
  ls.reiniciarCuenta();
  ls.fallo = { clave: 'valoracion', desde: 1 };
  const r = almacen.abrirEpisodio('ep1');
  assert.equal(r.ok, false);
  ls.fallo = null;
  assert.equal(almacen.valoracion().id, actual.id);
  assert.deepEqual(almacen.episodios().map((e) => e.id), ['ep1'], 'se retiró la copia temporal de la actual');
  restaurar();
});

test('ERROR 11: una valoración con el mismo identificador que el episodio abierto y con cambios se archiva aparte', () => {
  usar();
  const actual = almacen.valoracion();
  SOLO['datos clínicos'](actual);
  almacen.guardarValoracion(actual);
  const viejo = cerrarEpisodio(clonar(actual), '2026-10-29');
  viejo.paciente = { edad: '80', sexo: '', escolaridad: '', contexto: '' };
  assert.equal(almacen.guardarEpisodios([viejo]).ok, true);
  const r = almacen.abrirEpisodio(actual.id);
  assert.equal(r.ok, true);
  assert.equal(almacen.valoracion().paciente.edad, '80');
  const otra = almacen.episodios().find((e) => e.paciente?.edad === '82');
  assert.ok(otra && otra.id !== actual.id, 'los cambios de la valoración en curso se conservan con otro identificador');
  restaurar();
});

/* ---------- Respuestas en edición que se descartarían ---------- */

test('respuestas en edición sin añadir: se cuentan para avisar antes de cerrar, abrir o borrar', () => {
  const r1 = guardado('tug', resp('tug', { estado: 'Sí', tiempo: 12 }), { fecha: '2026-10-30' });
  r1.id = 'r1';
  const borradores = [
    { escalaId: 'barthel', r: { comer: 1 } }, // capturado, sin añadir
    { escalaId: 'tug', r: { ...r1.respuestas, _origen: 'r1' } }, // abierto para revisar, sin cambios
    { escalaId: 'tug', momento: 'basal', r: { ...r1.respuestas, tiempo: 20, _origen: 'r1' } }, // con cambios
    { escalaId: 'lawton', r: {} }, // vacío
  ];
  assert.deepEqual(respuestasSinAnadir(borradores, porId, [r1]).map((b) => b.escalaId), ['barthel', 'tug']);
  const ui = readFileSync(new URL('../js/vistas/seguimiento.js', import.meta.url), 'utf8');
  assert.match(ui, /n === 1 \? 'se descarta' : 'se descartan'\} \$\{plural\(n, 'instrumento en edición sin añadir'/);
});

/* ---------- ERROR 02: radio 33 % en la DXA ---------- */

const dxa = (x) => calc('dxa', { sexo: 'Mujer', edad: 70, menopausia: 'Sí', fractura: 'No', ...x });
const CENTRALES = { t_columna: -1.0, t_cuello: -1.2, t_cadera: -1.1 };

test('ERROR 02: el radio 33 % sin indicación de la ISCD no clasifica; se muestra como dato adicional', () => {
  const r = dxa({ ...CENTRALES, t_radio: -2.8, radio_motivo: 'Ninguna: registrar el radio solo como dato adicional' });
  assert.equal(r.banda.id, 'baja', 'el ejemplo de la auditoría ya no es osteoporosis');
  assert.equal(r.valor, -1.2);
  assert.ok(r.lineas.some((l) => /Radio 33%: T-score -2.8, registrado como dato adicional/.test(l)));
  assert.deepEqual(r.extras.radio, { t: -2.8, diagnostico: false, indicacion: 'ninguna' });
  // Sin responder la indicación, el resultado no se calcula: la pregunta es obligatoria al registrar el radio.
  const sin = dxa({ ...CENTRALES, t_radio: -2.8 });
  assert.equal(sin.completo, false);
  assert.ok(sin.faltan.includes('radio_motivo'));
  // Sin radio, la pregunta no aparece.
  assert.equal(porId.dxa.campos.find((c) => c.id === 'radio_motivo').visibleSi({ t_radio: '' }), false);
  assert.equal(porId.dxa.campos.find((c) => c.id === 'radio_motivo').visibleSi({ t_radio: '-2,8' }), true);
});

test('ERROR 02: con indicación de la ISCD, el radio 33 % entra en el T-score más bajo', () => {
  assert.deepEqual(INDICACIONES_RADIO.map((o) => o.valor), ['central', 'hiperparatiroidismo', 'obesidad', 'ninguna']);
  for (const motivo of ['La cadera o la columna no pueden medirse o interpretarse', 'Hiperparatiroidismo', 'Obesidad que supera el límite de peso de la mesa del densitómetro']) {
    const r = dxa({ ...CENTRALES, t_radio: -2.8, radio_motivo: motivo });
    assert.equal(r.banda.id, 'osteoporosis', motivo);
    assert.equal(r.valor, -2.8);
    assert.ok(r.lineas.some((l) => /Radio 33% incluido en la categoría por indicación de la ISCD/.test(l)));
  }
  // Solo radio: exige una indicación que lo permita.
  assert.ok(dxa({ t_radio: -2.8, radio_motivo: 'Ninguna: registrar el radio solo como dato adicional' }).errores.radio_motivo);
  assert.equal(dxa({ t_radio: -2.8, radio_motivo: 'La cadera o la columna no pueden medirse o interpretarse' }).banda.id, 'osteoporosis');
  // La osteoporosis clínica (fractura por fragilidad) sigue siendo independiente.
  const fx = dxa({ ...CENTRALES, t_radio: -2.8, radio_motivo: 'Ninguna: registrar el radio solo como dato adicional', fractura: 'Sí' });
  assert.ok(fx.lineas.some((l) => /criterio clínico de osteoporosis/.test(l)));
  assert.ok(porId.dxa.notas.some((n) => /solo con una indicación de la ISCD/.test(n)));
  assert.ok(porId.dxa.referencias.some((r) => /2023 ISCD Official Positions/.test(r.texto)));
});

/* ---------- ERROR 03 a 06: VPO ---------- */

const diagrama = (id) => DIAGRAMAS.find((d) => d.id === id);
const textos = (nodos) => JSON.stringify(nodos);

test('ERROR 03: ASA V no equivale a urgencia; la urgencia es el modificador «E» de cualquier clase', () => {
  const g = diagrama('general');
  const asa = g.nodos.find((n) => n.tipo === 'decision');
  const v = asa.ramas.find((r) => r.etiqueta === 'ASA V');
  assert.doesNotMatch(v.nodos[0].texto, /Urgencia quirúrgica: no requiere VPO/);
  assert.match(v.nodos[0].texto, /moribunda/);
  assert.match(v.nodos[0].texto, /no es sinónimo de urgencia/);
  assert.match(v.nodos[0].texto, /sin retrasar un procedimiento vital/);
  assert.match(v.nodos[0].origen, /algoritmo 1 del lineamiento \(p\. 8\)/, 'se declara lo que dice el lineamiento');
  const urg = g.nodos.find((n) => /urgente o de emergencia/.test(n.texto));
  assert.ok(urg, 'el algoritmo distingue electiva, urgente y emergencia');
  assert.ok(g.nodos.indexOf(urg) < g.nodos.indexOf(asa), 'antes de clasificar la ASA');
  assert.match(textos(urg.detalle), /Electiva/);
  assert.match(textos(urg.detalle), /Urgente/);
  assert.match(textos(urg.detalle), /Emergencia/);
  assert.match(textos(urg.detalle), /ASA IIIE/);
  // La escala ASA clasifica I a VI con y sin «E».
  const texto = (n) => porId.asa.campos[0].opciones[n - 1].texto;
  for (let n = 1; n <= 6; n += 1) {
    for (const [u, sufijo] of [['No', ''], ['Sí: el retraso aumentaría la amenaza para la vida o un órgano', 'E']]) {
      const r = calc('asa', { clase: texto(n), urgencia: u });
      assert.equal(r.mostrar, `${['I', 'II', 'III', 'IV', 'V', 'VI'][n - 1]}${sufijo}`);
    }
  }
  assert.ok(porId.asa.notas.some((n) => /ASA V describe el estado físico/.test(n)));
});

test('ERROR 04: dispositivos sin contraindicaciones absolutas: tipo, dependencia, sitio, imán y reactivación', () => {
  const d = diagrama('dispositivos');
  const t = textos(d.nodos);
  assert.match(t, /TRC-P/);
  assert.match(t, /Dependencia de la estimulación/);
  assert.match(t, /por encima del ombligo/);
  assert.match(t, /el imán sobre un DAI suspende las terapias pero no cambia la estimulación a modo asincrónico/);
  assert.match(t, /reprogramación o con imán/);
  assert.match(t, /reactivar las terapias/);
  assert.match(t, /comprobar el funcionamiento/);
  assert.match(t, /desfibrilador externo/);
  const dai = d.nodos.find((n) => n.tipo === 'decision').ramas[0];
  assert.doesNotMatch(dai.nodos[0].texto, /está contraindicado/, 'sin la frase absoluta como conclusión');
  assert.match(dai.nodos[0].texto, /^Lineamiento:/, 'lo que dice el lineamiento se atribuye');
  assert.ok(d.fuentes.some((f) => f.origen === 'guia' && /HRS\/ASA 2011/.test(f.texto)));
  assert.ok(t.includes('30 cm') && t.includes('40 %') && t.includes('5 segundos'), 'se conservan los criterios del lineamiento');
  assert.match(GUIAS_VPO.hrs2011, /10\.1016\/j\.hrthm\.2010\.12\.023/);
});

test('ERROR 05: la elevación del ST y los cambios isquémicos con síntomas van a Urgencias, no a Cardiología programada', () => {
  const e = diagrama('ecg');
  const hallazgos = e.nodos.find((n) => n.tipo === 'decision' && /qué muestra/.test(n.texto));
  const sca = hallazgos.ramas[0];
  assert.equal(sca.etiqueta, 'Sospecha de síndrome coronario agudo');
  assert.equal(sca.tono, 'alerta');
  assert.match(sca.nodos[0].texto, /Urgencias de inmediato/);
  assert.match(textos(sca.nodos), /Elevación nueva del ST/);
  assert.match(textos(sca.nodos), /inestabilidad hemodinámica/);
  const cardio = hallazgos.ramas.find((r) => r.etiqueta === 'Requiere Cardiología');
  assert.doesNotMatch(textos(cardio.nodos), /elevación del ST/i);
  assert.match(textos(cardio.nodos), /sin síntomas y hemodinámicamente estable/);
  assert.ok(hallazgos.ramas.some((r) => r.etiqueta === 'Requiere Urgencias' && /Mobitz II/.test(textos(r.nodos))));
});

test('ERROR 06: ECG preoperatorio con la fuerza de cada recomendación y su origen', () => {
  const t = textos(diagrama('ecg').nodos);
  assert.match(t, /El lineamiento indica pedir ECG de 12 derivaciones/);
  assert.match(t, /es opcional; puede considerarse para tener un trazo basal/);
  assert.match(t, /Lineamiento, cuadro 9 \(p\. 18\)/);
  assert.ok(diagrama('ecg').fuentes.some((f) => f.origen === 'guia' && /AHA\/ACC 2024/.test(f.texto)));
  const intermedio = calc('riesgoqx', { categoria: 'Riesgo intermedio (1 a 5 %)' });
  assert.match(intermedio.banda.texto, /El lineamiento del IMSS indica ECG/);
  assert.ok(intermedio.banda.sugerencias.some((s) => /opcional en personas asintomáticas/.test(s)));
});

/* ---------- ERROR 08: service worker sin conexión ---------- */

async function swSinConexion(copias) {
  const oyentes = {};
  const self = { addEventListener: (t, fn) => { oyentes[t] = fn; }, location: { origin: 'https://huella.test' }, skipWaiting() {}, clients: { claim() {} } };
  const caches = {
    match: async (req) => {
      const url = typeof req === 'string' ? req : new URL(req.url).pathname.replace(/^\/Huella\//, './');
      return copias[url] ? new Response(copias[url], { status: 200 }) : undefined;
    },
    open: async () => ({ put: async () => {} }),
    keys: async () => [],
  };
  const fetch = () => Promise.reject(new TypeError('sin red'));
  new Function('self', 'caches', 'fetch', readFileSync(new URL('../sw.js', import.meta.url), 'utf8'))(self, caches, fetch);
  const pedir = async (ruta, { mode = 'no-cors', destination = 'script' } = {}) => {
    let promesa;
    oyentes.fetch({ request: { method: 'GET', url: `https://huella.test/Huella/${ruta}`, mode, destination }, respondWith: (p) => { promesa = p; } });
    const r = await promesa;
    return { status: r.status, texto: await r.text() };
  };
  return pedir;
}

test('ERROR 08: sin conexión, solo la navegación recibe index.html; un JS o CSS recibe su copia o un 503', async () => {
  const pedir = await swSinConexion({ './index.html': '<!doctype html>', './js/app.js': 'export {}' });
  assert.deepEqual(await pedir('', { mode: 'navigate', destination: 'document' }), { status: 200, texto: '<!doctype html>' });
  assert.deepEqual(await pedir('js/app.js'), { status: 200, texto: 'export {}' }, 'copia guardada del módulo');
  const falta = await pedir('js/nuevo.js');
  assert.equal(falta.status, 503, 'un módulo sin copia no recibe HTML');
  assert.doesNotMatch(falta.texto, /doctype/i);
  assert.equal((await pedir('css/app.css', { destination: 'style' })).status, 503);
});

/* ---------- ERROR 09: enlaces malformados ---------- */

test('ERROR 09: un enlace con codificación inválida no detiene el enrutador', () => {
  assert.equal(segmentosHash('#/e/%E0%A4%A'), null);
  assert.equal(segmentosHash('#/r/preqx/%'), null);
  assert.deepEqual(segmentosHash('#/r/preqx/asa%40basal'), ['r', 'preqx', 'asa@basal']);
  assert.deepEqual(segmentosHash('#/icope/detallada#d-vision'), ['icope', 'detallada']);
  assert.deepEqual(segmentosHash(''), ['']);
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /\.map\(decodeURIComponent\)/, 'sin decodificación sin protección');
  assert.match(app, /if \(!partes\) return \{ vista: 'inicio', enlaceInvalido: true \}/);
  assert.match(app, /history\.replaceState\(null, '', '#\/'\)/);
});

/* ---------- ERROR 10: aviso de «Nueva valoración» ---------- */

test('ERROR 10: «Nueva valoración» dice que borra toda la valoración en curso y recomienda archivar o exportar', () => {
  const ui = readFileSync(new URL('../js/vistas/valoracion.js', import.meta.url), 'utf8');
  assert.match(ui, /borra de este navegador toda la valoración en curso: resultados, datos clínicos, medicamentos/);
  assert.match(ui, /No la archiva\. Para conservarla, ciérrala en <a href="#\/seguimiento">Seguimiento<\/a>/);
  assert.match(ui, /o expórtala antes/);
  assert.match(ui, /Toca otra vez para borrar toda la valoración en curso/);
  assert.doesNotMatch(ui, /Toca otra vez para borrar todos los resultados/);
});

/* ---------- Sección 5: contraste de calculadoras de alto impacto con sus ecuaciones publicadas ---------- */

test('Sección 5: CKD-EPI 2021, Cockcroft-Gault y BIS coinciden con implementaciones independientes de sus ecuaciones', () => {
  // Inker 2021 (CKD-EPI sin raza), Cockcroft y Gault 1976, Schaeffner 2012 (BIS1 y BIS2).
  const ckd = (scr, edad, mujer) => { const k = mujer ? 0.7 : 0.9; const a = mujer ? -0.241 : -0.302; return 142 * Math.min(scr / k, 1) ** a * Math.max(scr / k, 1) ** -1.2 * 0.9938 ** edad * (mujer ? 1.012 : 1); };
  const cg = (scr, edad, peso, mujer) => ((140 - edad) * peso / (72 * scr)) * (mujer ? 0.85 : 1);
  const bis1 = (scr, edad, mujer) => 3736 * scr ** -0.87 * edad ** -0.95 * (mujer ? 0.82 : 1);
  const bis2 = (scr, cys, edad, mujer) => 767 * cys ** -0.61 * scr ** -0.40 * edad ** -0.57 * (mujer ? 0.87 : 1);
  for (const scr of [0.5, 0.7, 0.9, 1.0, 1.3, 2.0, 3.5]) {
    for (const edad of [70, 80, 95]) {
      for (const mujer of [true, false]) {
        const sexo = mujer ? 'Mujer' : 'Hombre';
        assert.ok(Math.abs(calc('ckdepi', { creatinina: scr, edad, sexo }).valor - ckd(scr, edad, mujer)) < 1e-9, `CKD-EPI ${scr} ${edad} ${sexo}`);
        assert.ok(Math.abs(calc('cockcroft', { creatinina: scr, edad, sexo, peso: 65, peso_uso: 'Peso real' }).valor - cg(scr, edad, 65, mujer)) < 1e-9, `CG ${scr} ${edad} ${sexo}`);
        assert.ok(Math.abs(calc('bis', { creatinina: scr, edad, sexo }).valor - bis1(scr, edad, mujer)) < 1e-9, `BIS1 ${scr} ${edad} ${sexo}`);
        assert.ok(Math.abs(calc('bis', { creatinina: scr, cistatina: 1.2, edad, sexo }).valor - bis2(scr, 1.2, edad, mujer)) < 1e-9, `BIS2 ${scr} ${edad} ${sexo}`);
      }
    }
  }
  // Ejemplos redondos: mujer de 60 años con creatinina 1.0 mg/dL → 64 mL/min/1.73 m²; hombre de 80 años, 70 kg → 58 mL/min.
  assert.equal(Math.round(calc('ckdepi', { creatinina: 1.0, edad: 60, sexo: 'Mujer' }).valor), 64);
  assert.equal(calc('cockcroft', { creatinina: 1.0, edad: 80, sexo: 'Hombre', peso: 70, peso_uso: 'Peso real' }).mostrar, '58');
});
