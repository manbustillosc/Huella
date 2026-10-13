// Almacenamiento local. Todo vive solo en este navegador y nunca se envía a ningún servidor.
// La valoración no guarda nombre ni datos de identificación del paciente.
//
// localStorage (permanece al cerrar el navegador): favoritas, tema, formato de nota, usos,
//   valoración en curso (datos clínicos opcionales, resultados, respuestas y rutas omitidas) y
//   episodios archivados (hasta MAX_EPISODIOS): cerrados o importados con su estado; se pueden exportar o borrar.
// sessionStorage (se borra al cerrar la pestaña): respuestas en edición, ligadas al id de la valoración.

import { codigoEpisodio, asegurarEpisodio, tieneContenido, MAX_EPISODIOS } from './episodio.js';

const PREFIJO = 'huella.';

/* ---------- Estado del guardado ----------
   guardado: la última escritura se comprobó leyéndola de nuevo.
   sesion: el navegador no ofrece almacenamiento persistente (p. ej., modo privado); los datos duran lo que dure la pestaña.
   error: la última escritura falló (almacenamiento lleno o bloqueado). Lo anterior no se tocó y los cambios nuevos
          quedan solo en esta pestaña (respaldo en memoria) hasta que una escritura posterior funcione. */
export const ESTADOS_GUARDADO = {
  guardado: 'Guardado en este navegador',
  sesion: 'Solo disponible durante esta sesión',
  error: 'No guardado',
};
let estado = { estado: 'guardado', motivo: null, ts: 0 };
let ultimoOk = 0;
const oyentes = new Set();
function fijarEstado(nuevo, motivo = null) {
  const cambio = nuevo !== estado.estado || motivo !== estado.motivo;
  estado = { estado: nuevo, motivo, ts: Date.now() };
  if (cambio) oyentes.forEach((fn) => { try { fn(estado); } catch { /* un oyente no debe romper el guardado */ } });
}

// Respaldo en memoria de lo que no pudo escribirse: se lee antes que el almacenamiento para no perder los cambios
// durante la sesión, y se descarta en cuanto una escritura posterior de esa clave funciona.
const respaldo = new Map();

const memoria = {};
const enMemoria = { getItem: (k) => memoria[k] ?? null, setItem: (k, v) => { memoria[k] = String(v); }, removeItem: (k) => { delete memoria[k]; }, key: (i) => Object.keys(memoria)[i] ?? null, get length() { return Object.keys(memoria).length; } };
const seguro = (nombre) => {
  try {
    const a = globalThis[nombre];
    a.setItem('huella.__prueba', '1');
    a.removeItem('huella.__prueba');
    return a;
  } catch {
    return enMemoria;
  }
};
let local = seguro('localStorage');
let sesion = seguro('sessionStorage');
if (local === enMemoria) fijarEstado('sesion', 'no_disponible');

// Mensaje para el médico según el motivo del fallo.
export function mensajeFallo(motivo) {
  return {
    limite: `Hay ${MAX_EPISODIOS} episodios archivados en este navegador. Exporta y borra alguno antes de continuar: Huella no borra episodios por su cuenta.`,
    lleno: 'El almacenamiento del navegador está lleno y no se guardó el cambio. Exporta el episodio y libera espacio borrando episodios archivados que ya hayas exportado.',
    bloqueado: 'El navegador bloqueó el almacenamiento y no se guardó el cambio. Revisa la configuración de privacidad o exporta el episodio.',
    verificacion: 'No se pudo comprobar que el cambio quedara guardado, así que no se hizo ningún cambio. Exporta el episodio por seguridad.',
    desconocido: 'No se pudo guardar el cambio y no se hizo ningún cambio. Exporta el episodio por seguridad.',
    no_encontrado: 'No se encontró el episodio.',
    no_disponible: 'Este navegador no permite guardar datos de forma permanente (p. ej., modo privado): los datos duran solo mientras la pestaña esté abierta. Exporta el episodio antes de cerrarla.',
  }[motivo] || 'No se pudo guardar el cambio.';
}

function motivoError(err) {
  const n = err?.name || '';
  if (n === 'QuotaExceededError' || n === 'NS_ERROR_DOM_QUOTA_REACHED' || err?.code === 22 || err?.code === 1014) return 'lleno';
  if (n === 'SecurityError') return 'bloqueado';
  return 'desconocido';
}

function leer(area, clave, defecto) {
  if (area === local && respaldo.has(clave)) return JSON.parse(respaldo.get(clave));
  try {
    const v = area.getItem(PREFIJO + clave);
    return v == null ? defecto : JSON.parse(v);
  } catch {
    return defecto;
  }
}

// Escribe y comprueba leyendo de nuevo. Devuelve { ok, motivo }. Si falla, el valor anterior queda intacto en el
// almacenamiento y el nuevo se conserva solo en memoria (respaldo) para esta sesión.
// Con { respaldar: false } (operaciones de episodios) un fallo no deja copia en memoria: la operación se considera no
// realizada y lo que se lee sigue siendo lo guardado.
function escribir(area, clave, valor, { respaldar = true } = {}) {
  const json = JSON.stringify(valor);
  try {
    area.setItem(PREFIJO + clave, json);
    if (area.getItem(PREFIJO + clave) !== json) throw Object.assign(new Error('verificación fallida'), { name: 'VerificacionError' });
    if (area === local) {
      ultimoOk = Date.now();
      respaldo.delete(clave);
      if (!respaldo.size) fijarEstado(local === enMemoria ? 'sesion' : 'guardado', local === enMemoria ? 'no_disponible' : null);
    }
    return { ok: true, motivo: null };
  } catch (err) {
    const motivo = err?.name === 'VerificacionError' ? 'verificacion' : motivoError(err);
    if (area === local) {
      if (respaldar) respaldo.set(clave, json);
      fijarEstado('error', motivo);
    }
    return { ok: false, motivo };
  }
}

const nuevoId = (p = 'v') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const hoyLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const vacia = () => ({ id: nuevoId(), creada: Date.now(), paciente: {}, resultados: [], rutas: {}, episodio: { codigo: codigoEpisodio(), estado: 'abierto', abierto: hoyLocal() } });
export const claveResultado = (escalaId, momento) => (momento ? `${escalaId}@${momento}` : escalaId);
const claveDe = (r) => claveResultado(r.escalaId, r.momento);
const recientePrimero = (a, b) => ((b.fecha || '') > (a.fecha || '') ? 1 : (b.fecha || '') < (a.fecha || '') ? -1 : (b.guardado || 0) - (a.guardado || 0));

export const almacen = {
  /* Preferencias */
  favoritas: () => leer(local, 'favoritas', []),
  alternarFavorita(id) {
    const f = this.favoritas();
    const nuevas = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
    escribir(local, 'favoritas', nuevas);
    return nuevas.includes(id);
  },
  tema: () => leer(local, 'tema', 'auto'),
  guardarTema: (t) => escribir(local, 'tema', t),

  // Formato del texto: la nota admite «completa»; cada escala usa párrafo o lista.
  formatoNota: () => {
    const f = leer(local, 'formatoNota', 'parrafo');
    return ['parrafo', 'lista', 'completa'].includes(f) ? f : 'parrafo';
  },
  formatoEscala() {
    const f = leer(local, 'formatoEscala', null) ?? this.formatoNota();
    return f === 'lista' ? 'lista' : 'parrafo';
  },
  guardarFormato(f) {
    escribir(local, 'formatoNota', f);
    if (f !== 'completa') escribir(local, 'formatoEscala', f);
  },

  usos: () => leer(local, 'usos', {}),
  registrarUso(id) {
    const u = this.usos();
    u[id] = { n: (u[id]?.n || 0) + 1, t: Date.now() };
    escribir(local, 'usos', u);
  },

  /* Valoración en curso */
  valoracion() {
    const v = leer(local, 'valoracion', null);
    if (!v) {
      const n = vacia();
      escribir(local, 'valoracion', n);
      return n;
    }
    let migrada = false;
    if (!v.id) {
      // Migración desde versiones anteriores
      Object.assign(v, { id: nuevoId(), creada: Date.now(), rutas: v.rutas || {} });
      migrada = true;
    }
    v.rutas = v.rutas || {};
    v.paciente = v.paciente || {};
    v.resultados = v.resultados || [];
    for (const r of v.resultados) {
      if (!r.id) { r.id = nuevoId('r'); migrada = true; }
    }
    if (asegurarEpisodio(v)) migrada = true;
    if (migrada) escribir(local, 'valoracion', v);
    return v;
  },

  /* Estado del guardado */
  estadoGuardado: () => ({ ...estado, texto: ESTADOS_GUARDADO[estado.estado], pendientes: [...respaldo.keys()], ultimoOk }),
  alCambiarGuardado(fn) { oyentes.add(fn); return () => oyentes.delete(fn); },

  /* Episodios archivados (solo en este navegador). Nunca se descartan solos: al llegar al límite, archivar o importar
     se rechaza hasta que el médico exporte y borre alguno. Cada operación devuelve { ok, motivo }. */
  episodios: () => leer(local, 'episodios', []).filter((e) => e && Array.isArray(e.resultados)),
  limiteEpisodios: () => MAX_EPISODIOS,
  guardarEpisodios(lista) {
    if (lista.length > MAX_EPISODIOS) return { ok: false, motivo: 'limite' };
    return escribir(local, 'episodios', lista, { respaldar: false });
  },
  // Archiva la valoración en curso (o la versión cerrada que se indique) y solo entonces empieza una nueva.
  archivarYNueva(v = this.valoracion()) {
    if (tieneContenido(v)) {
      const lista = this.episodios().filter((e) => e.id !== v.id);
      if (lista.length >= MAX_EPISODIOS) return { ok: false, motivo: 'limite' };
      const r = this.guardarEpisodios([v, ...lista]);
      if (!r.ok) return r;
      const guardado = this.episodios();
      if (!guardado.some((e) => e.id === v.id)) return { ok: false, motivo: 'verificacion' };
    }
    return this.nuevaValoracion();
  },
  // Abre un episodio archivado como valoración en curso; la actual pasa al archivo si tiene contenido.
  // Orden sin pérdidas: 1) se copia la actual al archivo (el episodio que se abre sigue ahí), 2) se escribe la valoración,
  // 3) se quita del archivo el episodio abierto. Si algo falla, nada queda sin copia.
  abrirEpisodio(id) {
    const original = this.episodios();
    const e = original.find((x) => x.id === id);
    if (!e) return { ok: false, motivo: 'no_encontrado' };
    const actual = this.valoracion();
    const conActual = tieneContenido(actual) ? [actual, ...original.filter((x) => x.id !== actual.id)] : original;
    if (conActual !== original) {
      const r1 = escribir(local, 'episodios', conActual, { respaldar: false });
      if (!r1.ok) return r1;
    }
    const r2 = escribir(local, 'valoracion', e, { respaldar: false });
    if (!r2.ok) {
      if (conActual !== original) escribir(local, 'episodios', original, { respaldar: false });
      return r2;
    }
    escribir(local, 'episodios', conActual.filter((x) => x.id !== id), { respaldar: false });
    escribir(sesion, 'respuestas', null);
    return { ok: true, motivo: null };
  },
  borrarEpisodio(id) {
    const lista = this.episodios();
    if (!lista.some((x) => x.id === id)) return { ok: false, motivo: 'no_encontrado' };
    return this.guardarEpisodios(lista.filter((x) => x.id !== id));
  },
  // Agrega al archivo un episodio importado (nunca reemplaza la valoración en curso).
  importarEpisodio(v) {
    const lista = this.episodios();
    if (lista.length >= MAX_EPISODIOS) return { ok: false, motivo: 'limite' };
    const ids = new Set([this.valoracion().id, ...lista.map((x) => x.id)]);
    const nuevo = { ...v, id: v.id && !ids.has(v.id) ? v.id : nuevoId() };
    const r = this.guardarEpisodios([nuevo, ...lista]);
    return r.ok ? { ok: true, motivo: null, episodio: nuevo } : r;
  },
  guardarValoracion: (v) => escribir(local, 'valoracion', v),
  // Todas las aplicaciones de un instrumento, o solo las de un momento (sin momento = undefined).
  resultadosDe(escalaId) {
    return this.valoracion().resultados.filter((r) => r.escalaId === escalaId);
  },
  resultadosSlot(escalaId, momento) {
    return this.valoracion().resultados.filter((r) => claveDe(r) === claveResultado(escalaId, momento)).sort(recientePrimero);
  },
  // La aplicación más reciente de ese momento.
  resultado(escalaId, momento) {
    return this.resultadosSlot(escalaId, momento)[0] || null;
  },
  resultadoPorId(id) {
    return this.valoracion().resultados.find((r) => r.id === id) || null;
  },
  // Guarda una aplicación. Con { reemplazar: id } sustituye esa aplicación (conserva su identificador);
  // sin él agrega una nueva. Los momentos únicos (basal, ingreso, egreso) siempre reemplazan al anterior.
  guardarResultado(resultado, { reemplazar = null, unico = false } = {}) {
    const v = this.valoracion();
    const datos = { ...resultado };
    delete datos.id;
    let id = reemplazar && v.resultados.some((r) => r.id === reemplazar) ? reemplazar : null;
    if (unico) {
      const previo = v.resultados.find((r) => claveDe(r) === claveDe(resultado));
      if (previo) id = previo.id;
      v.resultados = v.resultados.filter((r) => claveDe(r) !== claveDe(resultado) || r.id === id);
    }
    const nuevo = { ...datos, id: id || nuevoId('r'), guardado: Date.now() };
    const i = id ? v.resultados.findIndex((r) => r.id === id) : -1;
    if (i >= 0) v.resultados[i] = nuevo;
    else v.resultados.push(nuevo);
    this.guardarValoracion(v);
    return nuevo;
  },
  // Compatibilidad: agrega reemplazando el mismo momento.
  agregarResultado(resultado) {
    return this.guardarResultado(resultado, { unico: true });
  },
  quitarResultado(id) {
    const v = this.valoracion();
    v.resultados = v.resultados.filter((r) => r.id !== id);
    this.guardarValoracion(v);
  },
  omitidas(rutaId) {
    return this.valoracion().rutas[rutaId]?.omitidas || [];
  },
  momentoRuta(rutaId) {
    return this.valoracion().rutas[rutaId]?.momento || null;
  },
  guardarMomentoRuta(rutaId, momento) {
    const v = this.valoracion();
    const r = (v.rutas[rutaId] = v.rutas[rutaId] || { omitidas: [] });
    r.momento = momento;
    this.guardarValoracion(v);
  },
  alternarOmitida(rutaId, clave, omitir = true) {
    const v = this.valoracion();
    const r = (v.rutas[rutaId] = v.rutas[rutaId] || { omitidas: [] });
    r.omitidas = r.omitidas.filter((c) => c !== clave);
    if (omitir) r.omitidas.push(clave);
    this.guardarValoracion(v);
  },

  /* Respuestas en edición: por instrumento y momento, ligadas a la valoración en curso */
  respuestas(escalaId, momento) {
    const s = leer(sesion, 'respuestas', null);
    if (!s || s.valoracion !== this.valoracion().id) return {};
    return s.datos?.[claveResultado(escalaId, momento)] || {};
  },
  // Todas las respuestas en edición de la valoración en curso (centro de pendientes).
  borradores() {
    const s = leer(sesion, 'respuestas', null);
    if (!s || s.valoracion !== this.valoracion().id) return [];
    return Object.entries(s.datos || {}).map(([clave, r]) => {
      const [escalaId, momento] = clave.split('@');
      return { escalaId, momento: momento || undefined, r };
    });
  },
  guardarRespuestas(escalaId, momento, r) {
    const id = this.valoracion().id;
    let s = leer(sesion, 'respuestas', null);
    if (!s || s.valoracion !== id) s = { valoracion: id, datos: {} };
    s.datos[claveResultado(escalaId, momento)] = r;
    escribir(sesion, 'respuestas', s);
  },

  nuevaValoracion() {
    const r = escribir(local, 'valoracion', vacia(), { respaldar: false });
    escribir(sesion, 'respuestas', null);
    return r;
  },
  borrarTodo() {
    for (const area of [local, sesion]) {
      try {
        const claves = [];
        for (let i = 0; i < area.length; i += 1) {
          const k = area.key(i);
          if (k && k.startsWith(PREFIJO)) claves.push(k);
        }
        claves.forEach((k) => area.removeItem(k));
      } catch {
        /* nada que borrar */
      }
    }
    Object.keys(memoria).forEach((k) => delete memoria[k]);
    respaldo.clear();
    fijarEstado(local === enMemoria ? 'sesion' : 'guardado', local === enMemoria ? 'no_disponible' : null);
  },

  // Solo para pruebas: sustituye el almacenamiento (p. ej., uno que falle al escribir).
  _usarAlmacenamiento({ local: l = null, sesion: s = null } = {}) {
    local = l || seguro('localStorage');
    sesion = s || seguro('sessionStorage');
    respaldo.clear();
    fijarEstado(local === enMemoria ? 'sesion' : 'guardado', local === enMemoria ? 'no_disponible' : null);
  },
};
