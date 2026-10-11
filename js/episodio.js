// Episodios: identificador anónimo, fechas, estado y cierre; exportación e importación local en JSON.
// Huella no es un expediente: no guarda nombres ni identificadores y nunca envía datos a un servidor.

export const FORMATO_EXPORTACION = 'huella-episodio';
export const VERSION_EXPORTACION = 1;
export const MAX_EPISODIOS = 30;
export const ESTADOS_EPISODIO = { abierto: 'Abierto', cerrado: 'Cerrado' };
export const MAX_ETIQUETA_EPISODIO = 60;

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const fechaValida = (f) => (/^\d{4}-\d{2}-\d{2}$/.test(String(f || '')) ? f : '');
const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const limpio = (t, max) => String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

// Código aleatorio sin relación con la persona (p. ej., EP-7KQ3MX).
export function codigoEpisodio() {
  const n = new Uint32Array(6);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(n);
  else for (let i = 0; i < n.length; i += 1) n[i] = Math.floor(Math.random() * 2 ** 32);
  return `EP-${[...n].map((x) => ALFABETO[x % ALFABETO.length]).join('')}`;
}

// Datos del episodio con valores por defecto (no modifica la valoración).
export function episodioDe(v) {
  const e = v?.episodio || {};
  return {
    codigo: typeof e.codigo === 'string' && /^EP-[A-Z0-9]{6}$/.test(e.codigo) ? e.codigo : '',
    estado: e.estado === 'cerrado' ? 'cerrado' : 'abierto',
    abierto: fechaValida(e.abierto) || (v?.creada ? isoLocal(new Date(v.creada)) : ''),
    cerrado: e.estado === 'cerrado' ? fechaValida(e.cerrado) : '',
    motivoCierre: e.estado === 'cerrado' ? limpio(e.motivoCierre, 120) : '',
    etiqueta: limpio(e.etiqueta, MAX_ETIQUETA_EPISODIO),
  };
}

// Asegura que la valoración tenga código y fecha de apertura. Devuelve true si cambió.
export function asegurarEpisodio(v) {
  const e = episodioDe(v);
  if (e.codigo && v.episodio?.abierto) return false;
  v.episodio = { ...e, codigo: e.codigo || codigoEpisodio() };
  return true;
}

// Fechas en que se aplicaron instrumentos (sin repetir), en orden.
export function fechasEvaluacion(v) {
  return [...new Set((v?.resultados || []).map((r) => fechaValida(r.fecha)).filter(Boolean))].sort();
}

export function cerrarEpisodio(v, hoy, motivo = '') {
  v.episodio = { ...episodioDe(v), estado: 'cerrado', cerrado: fechaValida(hoy), motivoCierre: limpio(motivo, 120) };
  return v;
}

export function reabrirEpisodio(v) {
  v.episodio = { ...episodioDe(v), estado: 'abierto', cerrado: '', motivoCierre: '' };
  return v;
}

export function fijarEtiquetaEpisodio(v, etiqueta) {
  v.episodio = { ...episodioDe(v), etiqueta: limpio(etiqueta, MAX_ETIQUETA_EPISODIO) };
  return v;
}

export const tieneContenido = (v) => Boolean(v?.resultados?.length || v?.medicacion?.meds?.length
  || ['problemas', 'objetivos', 'intervenciones', 'libres'].some((k) => v?.plan?.[k]?.length)
  || Object.keys(v?.plan?.preferencias || {}).length || Object.keys(v?.icope?.detalle || {}).length);

/* ---------- Exportación e importación ---------- */

export function exportarEpisodio(v, versionApp, ahora = new Date()) {
  return {
    formato: FORMATO_EXPORTACION,
    version: VERSION_EXPORTACION,
    app: `Huella ${versionApp}`,
    exportado: ahora.toISOString(),
    aviso: 'Información de salud sin datos de identificación. Guárdala en un lugar seguro y bórrala cuando ya no la necesites.',
    episodio: JSON.parse(JSON.stringify(v)),
  };
}

export const nombreArchivo = (v, hoy) => `huella-${episodioDe(v).codigo || 'episodio'}-${hoy}.json`;

const esObjeto = (x) => x && typeof x === 'object' && !Array.isArray(x);
const PACIENTE = { edad: 3, sexo: 6, escolaridad: 2, contexto: 160 };

// Revisa un archivo importado: forma, tamaño e instrumentos conocidos. Devuelve la valoración saneada o los errores.
export function validarImportacion(datos, escalasPorId) {
  const errores = [];
  const avisos = [];
  if (!esObjeto(datos) || datos.formato !== FORMATO_EXPORTACION) return { ok: false, errores: ['El archivo no es una exportación de Huella.'], avisos };
  if (datos.version !== VERSION_EXPORTACION) return { ok: false, errores: [`Versión de exportación no compatible (${String(datos.version).slice(0, 10)}).`], avisos };
  const e = datos.episodio;
  if (!esObjeto(e) || !Array.isArray(e.resultados)) return { ok: false, errores: ['El archivo no contiene un episodio válido.'], avisos };
  const resultados = [];
  let desconocidos = 0;
  for (const r of e.resultados.slice(0, 500)) {
    if (!esObjeto(r) || typeof r.escalaId !== 'string') { errores.push('Hay resultados con un formato no válido.'); break; }
    if (!escalasPorId[r.escalaId]) { desconocidos += 1; continue; }
    if (r.fecha && !fechaValida(r.fecha)) { errores.push('Hay resultados con fechas no válidas.'); break; }
    resultados.push(r);
  }
  if (desconocidos) avisos.push(`${desconocidos} resultado(s) de instrumentos que esta versión no reconoce se omitirán.`);
  const paciente = {};
  if (esObjeto(e.paciente)) for (const [k, max] of Object.entries(PACIENTE)) if (e.paciente[k] != null) paciente[k] = limpio(e.paciente[k], max);
  if (paciente.contexto) avisos.push('El episodio incluye un contexto clínico en texto libre: revisa que no contenga datos identificables.');
  if (errores.length) return { ok: false, errores, avisos };
  const valoracion = {
    id: typeof e.id === 'string' ? e.id.slice(0, 40) : undefined,
    creada: Number.isFinite(e.creada) ? e.creada : Date.now(),
    paciente,
    resultados,
    rutas: esObjeto(e.rutas) ? e.rutas : {},
    medicacion: esObjeto(e.medicacion) ? e.medicacion : undefined,
    plan: esObjeto(e.plan) ? e.plan : undefined,
    icope: esObjeto(e.icope) ? e.icope : undefined,
    episodio: episodioDe(e),
  };
  if (!valoracion.episodio.codigo) valoracion.episodio.codigo = codigoEpisodio();
  return { ok: true, errores, avisos, valoracion, resumen: { codigo: valoracion.episodio.codigo, resultados: resultados.length, fechas: fechasEvaluacion(valoracion) } };
}
