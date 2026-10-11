// Validación de un episodio importado. Es estricta y no modifica nada: o el archivo completo es válido y se puede
// agregar a los episodios cerrados, o se rechaza entero con la lista de problemas. Nunca se descartan resultados
// en silencio. Cuando un resultado trae sus respuestas, se recalcula con el motor actual y se compara.
import { calcular, NIVELES, MOMENTOS, FUENTES } from './motor.js';
import { FORMATO_EXPORTACION, VERSION_EXPORTACION, episodioDe, codigoEpisodio, fechasEvaluacion } from './episodio.js';
import { ESTADOS_PROBLEMA, PRIORIDADES, ESTADOS_OBJETIVO, ESTADOS_INTERVENCION, CATEGORIAS_INTERVENCION, CAMPOS_PREFERENCIAS } from './plan.js';
import { ESTADOS_CRITERIO, ESTADOS_BEERS, BEERS, porIdCriterio, CAMPOS_MEDICAMENTO } from './medicacion.js';
import { DOMINIOS_ICOPE } from './icope.js';

export const MAX_RESULTADOS_IMPORTACION = 500;
export const MAX_BYTES_IMPORTACION = 2 * 1024 * 1024;

const esObjeto = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const esTexto = (x, max) => typeof x === 'string' && x.length <= max;
const esId = (x) => typeof x === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(x);
const esNumero = (x) => typeof x === 'number' && Number.isFinite(x);
const ids = (lista) => new Set(lista.map((o) => o.id));

// Fecha real (AAAA-MM-DD) entre 1900 y mañana.
export function fechaReal(f) {
  if (typeof f !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
  const [a, m, d] = f.split('-').map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  if (fecha.getUTCFullYear() !== a || fecha.getUTCMonth() !== m - 1 || fecha.getUTCDate() !== d) return false;
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return a >= 1900 && f <= `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;
}

// Fecha de calendario real (admite fechas futuras, como plazos y revaloraciones).
export function fechaCalendario(f) {
  if (typeof f !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
  const [a, m, d] = f.split('-').map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  return a >= 1900 && a <= 2100 && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d;
}

const CAMPOS_EXPORTACION = ['formato', 'version', 'app', 'exportado', 'aviso', 'episodio'];
const CAMPOS_EPISODIO = ['id', 'creada', 'paciente', 'resultados', 'rutas', 'medicacion', 'plan', 'icope', 'episodio'];
const CAMPOS_PACIENTE = ['edad', 'sexo', 'escolaridad', 'contexto'];
const CAMPOS_RESULTADO = ['id', 'escalaId', 'momento', 'puntaje', 'max', 'valor', 'unidad', 'mostrar', 'nivel', 'etiqueta', 'hallazgo', 'sugerencias',
  'resumen', 'breve', 'noEvaluable', 'alertas', 'extras', 'respuestas', 'fecha', 'fechaReferencia', 'fuente', 'vinculos', 'guardado'];
const sobrantes = (obj, permitidos) => Object.keys(obj).filter((k) => !permitidos.includes(k));
const tamano = (x) => JSON.stringify(x ?? null).length;

function validarResultado(r, i, porId, errores, avisos) {
  const donde = `Resultado ${i + 1}`;
  if (!esObjeto(r)) { errores.push(`${donde}: no es un objeto válido.`); return; }
  const extra = sobrantes(r, CAMPOS_RESULTADO);
  if (extra.length) errores.push(`${donde}: campos no reconocidos (${extra.slice(0, 5).join(', ')}).`);
  if (!esTexto(r.escalaId, 40)) { errores.push(`${donde}: sin instrumento.`); return; }
  const escala = porId[r.escalaId];
  if (!escala) { errores.push(`${donde}: instrumento no reconocido por esta versión («${String(r.escalaId).slice(0, 30)}»).`); return; }
  const n = `${donde} (${escala.corto})`;
  if (r.id !== undefined && !esId(r.id)) errores.push(`${n}: identificador no válido.`);
  if (!fechaReal(r.fecha)) errores.push(`${n}: fecha de aplicación no válida.`);
  if (r.fechaReferencia != null && !fechaReal(r.fechaReferencia)) errores.push(`${n}: fecha del estado basal no válida.`);
  if (r.momento != null && (!escala.momentos || !MOMENTOS.some((m) => m.id === r.momento))) errores.push(`${n}: momento clínico no válido.`);
  if (r.fuente != null && !FUENTES.some((f) => f.id === r.fuente)) errores.push(`${n}: fuente no válida.`);
  if (r.guardado != null && !esNumero(r.guardado)) errores.push(`${n}: marca de guardado no válida.`);
  for (const k of ['unidad', 'mostrar']) if (r[k] != null && !esTexto(r[k], 80)) errores.push(`${n}: ${k} no válido.`);
  for (const k of ['etiqueta', 'noEvaluable']) if (r[k] != null && !esTexto(r[k], 300)) errores.push(`${n}: ${k} no válido.`);
  for (const k of ['resumen', 'breve']) if (r[k] != null && !esTexto(r[k], 3000)) errores.push(`${n}: ${k} no válido.`);
  if (r.hallazgo != null && typeof r.hallazgo !== 'boolean') errores.push(`${n}: hallazgo no válido.`);
  if (r.nivel != null && !NIVELES.includes(r.nivel)) errores.push(`${n}: nivel no válido.`);
  for (const k of ['sugerencias', 'alertas']) {
    if (r[k] != null && (!Array.isArray(r[k]) || r[k].length > 30 || !r[k].every((x) => esTexto(x, 600)))) errores.push(`${n}: ${k} no válido.`);
  }
  if (r.vinculos != null && (!Array.isArray(r.vinculos) || r.vinculos.length > 20 || !r.vinculos.every(esObjeto))) errores.push(`${n}: datos vinculados no válidos.`);
  if (r.extras != null && (!esObjeto(r.extras) || tamano(r.extras) > 20000)) errores.push(`${n}: datos derivados no válidos.`);
  if (r.respuestas != null && (!esObjeto(r.respuestas) || tamano(r.respuestas) > 20000)) errores.push(`${n}: respuestas no válidas.`);
  for (const k of ['puntaje', 'valor', 'max']) if (r[k] != null && !esNumero(r[k])) errores.push(`${n}: ${k} no es un número.`);
  if (r.noEvaluable) return;
  if (esNumero(r.puntaje) && Number.isFinite(escala.min) && Number.isFinite(escala.max) && (r.puntaje < escala.min || r.puntaje > escala.max)) {
    errores.push(`${n}: puntaje imposible (${r.puntaje}; el intervalo es de ${escala.min} a ${escala.max}).`);
  }
  if (r.puntaje == null && r.valor == null && !r.etiqueta) errores.push(`${n}: sin resultado.`);
  // Recalcular con las respuestas, si las hay y están completas.
  if (esObjeto(r.respuestas) && Object.keys(r.respuestas).length) {
    let res = null;
    try { res = calcular(escala, r.respuestas); } catch { res = null; }
    if (!res?.completo) {
      avisos.push(`${n}: sus respuestas no se pudieron recalcular con esta versión; se conserva el resultado registrado.`);
      return;
    }
    const igual = (a, b) => (a == null && b == null) || (esNumero(a) && esNumero(b) && Math.abs(a - b) < 1e-6);
    if (!igual(r.puntaje ?? null, res.puntaje ?? null) || !igual(r.valor ?? null, res.valor ?? null)) {
      errores.push(`${n}: el resultado no coincide con sus respuestas (registrado ${r.puntaje ?? r.valor}; recalculado ${res.puntaje ?? res.valor}).`);
    } else if ((r.unidad || '') !== (res.unidad || '') && r.unidad != null) {
      errores.push(`${n}: unidad inconsistente («${r.unidad}» en lugar de «${res.unidad}»).`);
    } else if (r.nivel && res.banda?.nivel && r.nivel !== res.banda.nivel) {
      avisos.push(`${n}: la interpretación guardada difiere de la del motor actual (posible cambio de versión); se importa tal como se guardó.`);
    }
  }
}

function validarPlan(p, errores) {
  if (p == null) return;
  if (!esObjeto(p)) { errores.push('Plan de atención: formato no válido.'); return; }
  const listas = { problemas: 200, objetivos: 300, intervenciones: 300, bitacora: 3000, libres: 100 };
  for (const [k, max] of Object.entries(listas)) {
    if (p[k] == null) continue;
    if (!Array.isArray(p[k]) || p[k].length > max || !p[k].every(esObjeto)) { errores.push(`Plan de atención: «${k}» no válido.`); return; }
  }
  const textoAmbito = (a) => esTexto(a, 80) && /^(dom|icope|libre):[A-Za-z0-9_-]+$/.test(a);
  for (const pr of p.problemas || []) if (!textoAmbito(pr.ambito) || !ESTADOS_PROBLEMA.some((e) => e.id === pr.estado) || (pr.nota != null && !esTexto(pr.nota, 300))) { errores.push('Plan de atención: un problema tiene datos no válidos.'); break; }
  for (const o of p.objetivos || []) if (!esId(o.id) || !textoAmbito(o.ambito) || !esTexto(o.texto, 300) || !ESTADOS_OBJETIVO.some((e) => e.id === o.estado) || (o.plazo && !fechaCalendario(o.plazo))) { errores.push('Plan de atención: un objetivo tiene datos no válidos.'); break; }
  for (const it of p.intervenciones || []) if (!esId(it.id) || !textoAmbito(it.ambito) || !esTexto(it.texto, 300) || !ESTADOS_INTERVENCION.some((e) => e.id === it.estado) || !CATEGORIAS_INTERVENCION.some((c) => c.id === it.categoria)) { errores.push('Plan de atención: una intervención tiene datos no válidos.'); break; }
  for (const l of p.libres || []) if (!textoAmbito(l.ambito) || !esTexto(l.nombre, 120)) { errores.push('Plan de atención: un problema agregado tiene datos no válidos.'); break; }
  for (const b of p.bitacora || []) if (!esTexto(b.texto, 400)) { errores.push('Plan de atención: la bitácora tiene datos no válidos.'); break; }
  if (ids(p.objetivos || []).size !== (p.objetivos || []).length || ids(p.intervenciones || []).size !== (p.intervenciones || []).length) errores.push('Plan de atención: identificadores repetidos.');
  for (const k of ['prioridades', 'revaloraciones', 'preferencias']) if (p[k] != null && !esObjeto(p[k])) errores.push(`Plan de atención: «${k}» no válido.`);
  for (const v of Object.values(p.prioridades || {})) if (!PRIORIDADES.some((x) => x.id === v)) { errores.push('Plan de atención: prioridad no válida.'); break; }
  for (const v of Object.values(p.revaloraciones || {})) if (!fechaCalendario(v)) { errores.push('Plan de atención: fecha de revaloración no válida.'); break; }
  for (const [k, v] of Object.entries(p.preferencias || {})) if (!CAMPOS_PREFERENCIAS.some((c) => c.id === k) || !esTexto(v, 400)) { errores.push('Plan de atención: preferencias no válidas.'); break; }
}

function validarMedicacion(m, errores) {
  if (m == null) return;
  if (!esObjeto(m)) { errores.push('Medicación: formato no válido.'); return; }
  if (m.meds != null && (!Array.isArray(m.meds) || m.meds.length > 100)) { errores.push('Medicación: lista no válida.'); return; }
  for (const x of m.meds || []) {
    if (!esObjeto(x) || !esId(x.id) || !esTexto(x.generico, 120) || !x.generico.trim()) { errores.push('Medicación: un medicamento no es válido.'); break; }
    if (sobrantes(x, ['id', ...CAMPOS_MEDICAMENTO.map((c) => c.id)]).length || CAMPOS_MEDICAMENTO.some((c) => x[c.id] != null && !esTexto(x[c.id], c.max + 40))) { errores.push('Medicación: un medicamento tiene campos no válidos.'); break; }
  }
  if (ids(m.meds || []).size !== (m.meds || []).length) errores.push('Medicación: identificadores repetidos.');
  if (m.stopp != null && !esObjeto(m.stopp)) errores.push('Medicación: revisión STOPP/START no válida.');
  for (const [id, v] of Object.entries(m.stopp || {})) if (!porIdCriterio[id] || !esObjeto(v) || !ESTADOS_CRITERIO.some((e) => e.id === v.estado)) { errores.push('Medicación: un criterio STOPP/START no es válido.'); break; }
  if (m.beers != null && !esObjeto(m.beers)) errores.push('Medicación: revisión de Beers no válida.');
  for (const [id, v] of Object.entries(m.beers || {})) if (!BEERS.some((b) => b.id === id) || !esObjeto(v) || (v.estado != null && !ESTADOS_BEERS.some((e) => e.id === v.estado)) || (v.nota != null && !esTexto(v.nota, 400))) { errores.push('Medicación: una categoría de Beers no es válida.'); break; }
  if (m.renal != null) {
    const ok = esObjeto(m.renal) && Object.entries(m.renal).every(([k, v]) => ['tfg', 'depuracion'].includes(k) && (v == null || (esObjeto(v) && esNumero(v.valor) && v.valor >= 0 && v.valor < 400)));
    if (!ok) errores.push('Medicación: función renal no válida.');
  }
  if (m.paliativo != null && typeof m.paliativo !== 'boolean') errores.push('Medicación: contexto paliativo no válido.');
}

function validarIcope(ic, errores) {
  if (ic == null) return;
  if (!esObjeto(ic) || (ic.detalle != null && !esObjeto(ic.detalle))) { errores.push('ICOPE: formato no válido.'); return; }
  for (const [dom, lista] of Object.entries(ic.detalle || {})) {
    if (!DOMINIOS_ICOPE.some((d) => d.id === dom) || !Array.isArray(lista) || lista.length > 50) { errores.push('ICOPE: evaluación detallada no válida.'); return; }
    for (const x of lista) if (!esObjeto(x) || !esId(x.id) || !fechaReal(x.fecha) || !esTexto(x.prueba, 120) || (x.hallazgo != null && !esTexto(x.hallazgo, 300))) { errores.push('ICOPE: un registro de evaluación detallada no es válido.'); return; }
  }
  if (sobrantes(ic, ['detalle', 'reutilizacion']).length) errores.push('ICOPE: campos no reconocidos.');
  if (ic.reutilizacion != null) {
    const ok = esObjeto(ic.reutilizacion) && Object.entries(ic.reutilizacion).every(([dom, x]) => DOMINIOS_ICOPE.some((d) => d.id === dom)
      && esObjeto(x) && ['resultado', 'externa'].includes(x.tipo) && esId(x.id) && esId(x.cribado) && (x.fecha == null || fechaReal(x.fecha)));
    if (!ok) errores.push('ICOPE: confirmaciones de evaluación detallada no válidas.');
  }
}

// Valida el objeto leído del archivo. Devuelve { ok, errores, avisos, valoracion, resumen }.
export function validarImportacion(datos, porId) {
  const errores = [];
  const avisos = [];
  const falla = (msg) => ({ ok: false, errores: [msg], avisos });
  if (!esObjeto(datos) || datos.formato !== FORMATO_EXPORTACION) return falla('El archivo no es una exportación de Huella.');
  if (datos.version !== VERSION_EXPORTACION) return falla(`Versión de exportación no compatible (${String(datos.version).slice(0, 10)}).`);
  if (tamano(datos) > MAX_BYTES_IMPORTACION) return falla('El archivo es demasiado grande para un episodio de Huella.');
  const extraArchivo = sobrantes(datos, CAMPOS_EXPORTACION);
  if (extraArchivo.length) return falla(`El archivo tiene campos no reconocidos (${extraArchivo.slice(0, 5).join(', ')}).`);
  const e = datos.episodio;
  if (!esObjeto(e) || !Array.isArray(e.resultados)) return falla('El archivo no contiene un episodio válido.');
  if (e.resultados.length > MAX_RESULTADOS_IMPORTACION) {
    return falla(`El episodio tiene ${e.resultados.length} resultados y el máximo que se puede importar es ${MAX_RESULTADOS_IMPORTACION}. No se importó nada.`);
  }
  const extraEp = sobrantes(e, CAMPOS_EPISODIO);
  if (extraEp.length) errores.push(`El episodio tiene campos no reconocidos (${extraEp.slice(0, 5).join(', ')}).`);
  if (e.id != null && !esId(e.id)) errores.push('Identificador del episodio no válido.');
  if (e.creada != null && !esNumero(e.creada)) errores.push('Fecha de creación no válida.');
  // Datos del paciente: solo los campos clínicos generales.
  if (e.paciente != null) {
    if (!esObjeto(e.paciente)) errores.push('Datos del paciente no válidos.');
    else {
      const extraP = sobrantes(e.paciente, CAMPOS_PACIENTE);
      if (extraP.length) errores.push(`Datos del paciente con campos no permitidos (${extraP.slice(0, 5).join(', ')}): podrían ser datos de identificación.`);
      const p = e.paciente;
      if (p.edad != null && p.edad !== '' && !(Number(p.edad) >= 0 && Number(p.edad) <= 120)) errores.push('Edad no válida.');
      if (p.sexo != null && !['', 'mujer', 'hombre'].includes(p.sexo)) errores.push('Sexo no válido.');
      if (p.escolaridad != null && p.escolaridad !== '' && !(Number(p.escolaridad) >= 0 && Number(p.escolaridad) <= 30)) errores.push('Escolaridad no válida.');
      if (p.contexto != null && !esTexto(p.contexto, 200)) errores.push('Contexto clínico no válido.');
      if (p.contexto) avisos.push('El episodio incluye un contexto clínico en texto libre: revisa que no contenga datos identificables.');
    }
  }
  if (e.episodio != null) {
    const ep = e.episodio;
    if (!esObjeto(ep) || (ep.codigo != null && !/^EP-[A-Z0-9]{6}$/.test(ep.codigo)) || (ep.estado != null && !['abierto', 'cerrado'].includes(ep.estado))
      || (ep.abierto && !fechaReal(ep.abierto)) || (ep.cerrado && !fechaReal(ep.cerrado))) errores.push('Datos del episodio no válidos.');
  }
  if (e.rutas != null && (!esObjeto(e.rutas) || !Object.values(e.rutas).every((x) => esObjeto(x) && (x.omitidas == null || (Array.isArray(x.omitidas) && x.omitidas.every((c) => esTexto(c, 80))))))) errores.push('Rutas no válidas.');
  e.resultados.forEach((r, i) => validarResultado(r, i, porId, errores, avisos));
  const idsRes = e.resultados.map((r) => r?.id).filter((x) => x != null);
  if (new Set(idsRes).size !== idsRes.length) errores.push('Hay resultados con identificadores repetidos.');
  validarPlan(e.plan, errores);
  validarMedicacion(e.medicacion, errores);
  validarIcope(e.icope, errores);
  if (errores.length) return { ok: false, errores: [...new Set(errores)].slice(0, 20), avisos, totalErrores: errores.length };
  const valoracion = {
    id: e.id,
    creada: e.creada ?? Date.now(),
    paciente: e.paciente || {},
    resultados: e.resultados,
    rutas: e.rutas || {},
    ...(e.medicacion ? { medicacion: e.medicacion } : {}),
    ...(e.plan ? { plan: e.plan } : {}),
    ...(e.icope ? { icope: e.icope } : {}),
    episodio: episodioDe(e),
  };
  if (!valoracion.episodio.codigo) valoracion.episodio.codigo = codigoEpisodio();
  return { ok: true, errores: [], avisos: [...new Set(avisos)], valoracion, resumen: { codigo: valoracion.episodio.codigo, resultados: e.resultados.length, fechas: fechasEvaluacion(valoracion) } };
}
