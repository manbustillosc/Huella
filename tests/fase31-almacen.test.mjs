// Fase 3.1, prioridad 1: ningún episodio se pierde en silencio y los fallos de almacenamiento son visibles.
import test from 'node:test';
import assert from 'node:assert/strict';
import { almacen, mensajeFallo } from '../js/almacen.js';
import { cerrarEpisodio, reabrirEpisodio, episodioDe, MAX_EPISODIOS } from '../js/episodio.js';
import { resp, guardado } from './ayuda.mjs';

// Almacenamiento simulado que puede fallar como un navegador real.
function almacenamientoFalso() {
  const datos = new Map();
  const a = {
    fallo: null, // 'lleno' | 'bloqueado' | 'silencioso' | null
    fallarClave: null, // solo falla al escribir esta clave
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem(k, v) {
      const aplica = a.fallo && (!a.fallarClave || k === `huella.${a.fallarClave}`);
      if (aplica && a.fallo === 'lleno') throw Object.assign(new Error('lleno'), { name: 'QuotaExceededError' });
      if (aplica && a.fallo === 'bloqueado') throw Object.assign(new Error('bloqueado'), { name: 'SecurityError' });
      if (aplica && a.fallo === 'silencioso') return;
      datos.set(k, String(v));
    },
    removeItem: (k) => datos.delete(k),
    key: (i) => [...datos.keys()][i] ?? null,
    get length() { return datos.size; },
    leerCrudo: (k) => (datos.has(`huella.${k}`) ? JSON.parse(datos.get(`huella.${k}`)) : null),
  };
  return a;
}
const tug = (t) => guardado('tug', resp('tug', { estado: 'Sí', tiempo: t }), { fecha: '2026-10-10' });
const episodioSimulado = (i) => ({ id: `ep${i}`, creada: Date.now(), paciente: {}, resultados: [tug(10 + (i % 5))], rutas: {}, episodio: { codigo: `EP-AAAA${String(i).padStart(2, '0')}`.slice(0, 9), estado: 'cerrado', abierto: '2026-01-01', cerrado: '2026-01-02' } });

test('límite de 30 episodios: archivar uno más se rechaza y ninguno desaparece', () => {
  const ls = almacenamientoFalso();
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() });
  const treinta = Array.from({ length: MAX_EPISODIOS }, (_, i) => episodioSimulado(i));
  assert.deepEqual(almacen.guardarEpisodios(treinta), { ok: true, motivo: null });
  assert.deepEqual(almacen.guardarEpisodios([...treinta, episodioSimulado(99)]), { ok: false, motivo: 'limite' }, 'nunca se recorta la lista');
  const actual = almacen.valoracion();
  almacen.guardarResultado(tug(18));
  const r = almacen.archivarYNueva();
  assert.deepEqual(r, { ok: false, motivo: 'limite' });
  assert.equal(almacen.episodios().length, MAX_EPISODIOS);
  assert.deepEqual(almacen.episodios().map((e) => e.id), treinta.map((e) => e.id), 'los 30 episodios siguen completos y en orden');
  assert.equal(almacen.valoracion().id, actual.id, 'no se inicia una valoración nueva');
  assert.equal(almacen.valoracion().resultados.length, 1, 'la valoración en curso conserva sus resultados');
  assert.match(mensajeFallo('limite'), /no borra episodios por su cuenta/);
  // Importar también se rechaza
  assert.equal(almacen.importarEpisodio(episodioSimulado(100)).ok, false);
  assert.equal(almacen.episodios().length, MAX_EPISODIOS);
  // Al borrar uno (decisión del médico), ya se puede archivar
  assert.equal(almacen.borrarEpisodio('ep0').ok, true);
  assert.equal(almacen.archivarYNueva().ok, true);
  assert.equal(almacen.episodios().length, MAX_EPISODIOS);
  assert.equal(almacen.episodios()[0].id, actual.id);
  almacen._usarAlmacenamiento();
});

test('escritura fallida: se informa, no se toca lo anterior y los cambios siguen en esta sesión', () => {
  const ls = almacenamientoFalso();
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() });
  const v = almacen.valoracion();
  almacen.guardarResultado(tug(11));
  assert.equal(almacen.estadoGuardado().estado, 'guardado');
  assert.ok(almacen.estadoGuardado().ultimoOk > 0);
  const avisos = [];
  const quitar = almacen.alCambiarGuardado((e) => avisos.push(e.estado));
  ls.fallo = 'lleno';
  almacen.guardarResultado(tug(14));
  const est = almacen.estadoGuardado();
  assert.equal(est.estado, 'error');
  assert.equal(est.motivo, 'lleno');
  assert.equal(est.texto, 'No guardado');
  assert.deepEqual(avisos, ['error'], 'la interfaz recibe el aviso');
  assert.equal(ls.leerCrudo('valoracion').resultados.length, 1, 'lo guardado antes queda intacto');
  assert.equal(almacen.valoracion().resultados.length, 2, 'el cambio sigue disponible en esta pestaña (para exportarlo)');
  assert.equal(almacen.valoracion().id, v.id);
  // Al liberar espacio, la siguiente escritura funciona y el estado vuelve a «guardado»
  ls.fallo = null;
  almacen.guardarResultado(tug(15));
  assert.equal(almacen.estadoGuardado().estado, 'guardado');
  assert.equal(ls.leerCrudo('valoracion').resultados.length, 3);
  assert.deepEqual(avisos, ['error', 'guardado']);
  quitar();
  // Bloqueado y escritura que no se comprueba
  ls.fallo = 'bloqueado';
  almacen.guardarResultado(tug(16));
  assert.equal(almacen.estadoGuardado().motivo, 'bloqueado');
  ls.fallo = 'silencioso';
  almacen.guardarResultado(tug(17));
  assert.equal(almacen.estadoGuardado().motivo, 'verificacion', 'una escritura que no se puede leer de nuevo no cuenta como guardada');
  ls.fallo = null;
  almacen.guardarResultado(tug(12));
  assert.equal(almacen.estadoGuardado().estado, 'guardado');
  almacen._usarAlmacenamiento();
});

test('operaciones de episodios seguras ante fallos: archivar, abrir, borrar, importar y nueva valoración', () => {
  const ls = almacenamientoFalso();
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() });
  almacen.guardarResultado(tug(11));
  const actual = almacen.valoracion();
  // Archivar con fallo al escribir el archivo: la valoración en curso no se reemplaza
  ls.fallo = 'lleno'; ls.fallarClave = 'episodios';
  const r = almacen.archivarYNueva(cerrarEpisodio(JSON.parse(JSON.stringify(actual)), '2026-10-10'));
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'lleno');
  assert.equal(almacen.episodios().length, 0, 'en la misma sesión tampoco aparece archivado');
  assert.equal(almacen.valoracion().id, actual.id, 'en la misma sesión la valoración sigue siendo la actual');
  ls.fallo = null; ls.fallarClave = null;
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() }); // simula recargar la página
  assert.equal(almacen.valoracion().id, actual.id);
  assert.equal(episodioDe(almacen.valoracion()).estado, 'abierto', 'no queda cerrada a medias');
  assert.equal(almacen.episodios().length, 0);
  // Archivar bien
  assert.equal(almacen.archivarYNueva(cerrarEpisodio(JSON.parse(JSON.stringify(actual)), '2026-10-10')).ok, true);
  assert.equal(almacen.episodios().length, 1);
  assert.notEqual(almacen.valoracion().id, actual.id);
  almacen.guardarResultado(tug(13));
  const segunda = almacen.valoracion();
  // Abrir con fallo al escribir la valoración: se restaura el archivo y la valoración en curso
  ls.fallo = 'lleno'; ls.fallarClave = 'valoracion';
  const ra = almacen.abrirEpisodio(actual.id);
  assert.equal(ra.ok, false);
  assert.equal(almacen.valoracion().id, segunda.id, 'en la misma sesión la valoración en curso no cambió');
  ls.fallo = null; ls.fallarClave = null;
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() });
  assert.deepEqual(almacen.episodios().map((e) => e.id), [actual.id], 'el archivo se restauró');
  assert.equal(almacen.valoracion().id, segunda.id, 'la valoración en curso no cambió');
  // Borrar con fallo: el episodio sigue
  ls.fallo = 'lleno'; ls.fallarClave = 'episodios';
  assert.equal(almacen.borrarEpisodio(actual.id).ok, false);
  ls.fallo = null; ls.fallarClave = null;
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() });
  assert.equal(almacen.episodios().length, 1);
  // Importar con fallo: nada cambia
  ls.fallo = 'lleno'; ls.fallarClave = 'episodios';
  assert.equal(almacen.importarEpisodio(episodioSimulado(5)).ok, false);
  ls.fallo = null; ls.fallarClave = null;
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() });
  assert.equal(almacen.episodios().length, 1);
  // Nueva valoración con fallo: se informa y la actual sigue guardada
  ls.fallo = 'lleno'; ls.fallarClave = 'valoracion';
  assert.equal(almacen.nuevaValoracion().ok, false);
  assert.equal(almacen.valoracion().id, segunda.id, 'en la misma sesión no se muestra una valoración vacía');
  ls.fallo = null; ls.fallarClave = null;
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() });
  assert.equal(almacen.valoracion().id, segunda.id);
  almacen._usarAlmacenamiento();
});

test('los datos se conservan entre sesiones y los episodios se cierran y reabren', () => {
  const ls = almacenamientoFalso();
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() });
  almacen.guardarResultado(tug(11));
  const v = almacen.valoracion();
  const codigo = v.episodio.codigo;
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() }); // nueva sesión, mismo navegador
  assert.equal(almacen.valoracion().id, v.id);
  assert.equal(almacen.valoracion().episodio.codigo, codigo);
  assert.equal(almacen.valoracion().resultados.length, 1);
  // Cerrar, abrir de nuevo y reabrir
  assert.equal(almacen.archivarYNueva(cerrarEpisodio(JSON.parse(JSON.stringify(v)), '2026-10-10')).ok, true);
  assert.equal(almacen.episodios()[0].episodio.estado, 'cerrado');
  assert.equal(almacen.abrirEpisodio(v.id).ok, true);
  const abierta = almacen.valoracion();
  assert.equal(episodioDe(abierta).estado, 'cerrado');
  reabrirEpisodio(abierta);
  assert.equal(almacen.guardarValoracion(abierta).ok, true);
  almacen._usarAlmacenamiento({ local: ls, sesion: almacenamientoFalso() });
  assert.equal(episodioDe(almacen.valoracion()).estado, 'abierto');
  assert.equal(almacen.valoracion().resultados.length, 1, 'los resultados del episodio se conservan');
  almacen._usarAlmacenamiento();
});

test('sin almacenamiento persistente, el estado es «solo durante esta sesión»', () => {
  almacen._usarAlmacenamiento();
  assert.equal(almacen.estadoGuardado().estado, 'sesion', 'en Node no hay localStorage');
  assert.equal(almacen.estadoGuardado().texto, 'Solo disponible durante esta sesión');
  assert.match(mensajeFallo('no_disponible'), /modo privado/);
});
