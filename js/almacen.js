// Almacenamiento local. Todo vive solo en este navegador y nunca se envía a ningún servidor.
// La valoración no guarda nombre ni datos de identificación del paciente.
//
// localStorage (permanece al cerrar el navegador): favoritas, tema, formato de nota, usos,
//   valoración en curso (datos clínicos opcionales, resultados, respuestas y rutas omitidas).
// sessionStorage (se borra al cerrar la pestaña): respuestas en edición, ligadas al id de la valoración.

const PREFIJO = 'huella.';

function leer(area, clave, defecto) {
  try {
    const v = area.getItem(PREFIJO + clave);
    return v == null ? defecto : JSON.parse(v);
  } catch {
    return defecto;
  }
}

function escribir(area, clave, valor) {
  try {
    area.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    /* almacenamiento no disponible: la app sigue funcionando en memoria */
  }
}

const memoria = {};
const enMemoria = { getItem: (k) => memoria[k] ?? null, setItem: (k, v) => { memoria[k] = v; }, removeItem: (k) => { delete memoria[k]; } };
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
const local = seguro('localStorage');
const sesion = seguro('sessionStorage');

const nuevoId = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const vacia = () => ({ id: nuevoId(), creada: Date.now(), paciente: {}, resultados: [], rutas: {} });
export const claveResultado = (escalaId, momento) => (momento ? `${escalaId}@${momento}` : escalaId);
const claveDe = (r) => claveResultado(r.escalaId, r.momento);

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
    if (!v.id) {
      // Migración desde versiones anteriores
      Object.assign(v, { id: nuevoId(), creada: Date.now(), rutas: v.rutas || {} });
      escribir(local, 'valoracion', v);
    }
    v.rutas = v.rutas || {};
    v.paciente = v.paciente || {};
    v.resultados = v.resultados || [];
    return v;
  },
  guardarValoracion: (v) => escribir(local, 'valoracion', v),
  resultado(escalaId, momento) {
    return this.valoracion().resultados.find((r) => claveDe(r) === claveResultado(escalaId, momento)) || null;
  },
  agregarResultado(resultado) {
    const v = this.valoracion();
    const clave = claveDe(resultado);
    v.resultados = v.resultados.filter((r) => claveDe(r) !== clave);
    v.resultados.push({ ...resultado, guardado: Date.now() });
    this.guardarValoracion(v);
  },
  quitarResultado(escalaId, momento) {
    const v = this.valoracion();
    v.resultados = v.resultados.filter((r) => claveDe(r) !== claveResultado(escalaId, momento));
    this.guardarValoracion(v);
  },
  omitidas(rutaId) {
    return this.valoracion().rutas[rutaId]?.omitidas || [];
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
  guardarRespuestas(escalaId, momento, r) {
    const id = this.valoracion().id;
    let s = leer(sesion, 'respuestas', null);
    if (!s || s.valoracion !== id) s = { valoracion: id, datos: {} };
    s.datos[claveResultado(escalaId, momento)] = r;
    escribir(sesion, 'respuestas', s);
  },

  nuevaValoracion() {
    escribir(local, 'valoracion', vacia());
    escribir(sesion, 'respuestas', null);
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
  },
};
