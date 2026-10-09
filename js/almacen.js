// Almacenamiento local. Todo vive solo en este dispositivo; nunca se envía a ningún servidor.
// La valoración no guarda nombre ni datos de identificación del paciente.

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

const local = typeof localStorage !== 'undefined' ? localStorage : null;
const sesion = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
const memoria = {};
const area = (a) => a || { getItem: (k) => memoria[k] ?? null, setItem: (k, v) => { memoria[k] = v; } };

export const almacen = {
  favoritas: () => leer(area(local), 'favoritas', []),
  alternarFavorita(id) {
    const f = this.favoritas();
    const nuevas = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
    escribir(area(local), 'favoritas', nuevas);
    return nuevas.includes(id);
  },

  tema: () => leer(area(local), 'tema', 'auto'),
  guardarTema: (t) => escribir(area(local), 'tema', t),

  respuestas: (id) => leer(area(sesion), 'respuestas', {})[id] || {},
  guardarRespuestas(id, r) {
    const todas = leer(area(sesion), 'respuestas', {});
    todas[id] = r;
    escribir(area(sesion), 'respuestas', todas);
  },

  valoracion: () => leer(area(local), 'valoracion', { paciente: {}, resultados: [] }),
  guardarValoracion: (v) => escribir(area(local), 'valoracion', v),
  agregarResultado(resultado) {
    const v = this.valoracion();
    v.resultados = v.resultados.filter((r) => r.escalaId !== resultado.escalaId);
    v.resultados.push(resultado);
    this.guardarValoracion(v);
  },
  quitarResultado(escalaId) {
    const v = this.valoracion();
    v.resultados = v.resultados.filter((r) => r.escalaId !== escalaId);
    this.guardarValoracion(v);
  },
  nuevaValoracion() {
    escribir(area(local), 'valoracion', { paciente: {}, resultados: [] });
    escribir(area(sesion), 'respuestas', {});
  },
};
