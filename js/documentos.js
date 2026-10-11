// Hojas oficiales del médico: la copia que él mismo agrega (PDF o imagen) de la hoja de un instrumento con titular
// de derechos. Se guarda solo en este navegador (IndexedDB): Huella no la publica, no la sube a ningún servidor y
// no la incluye en las exportaciones. El médico es responsable de usar copias que tenga derecho a usar.

export const BD_DOCUMENTOS = 'huella-documentos';
const ALMACEN = 'hojas';
export const MAX_BYTES_HOJA = 15 * 1024 * 1024;
export const TIPOS_HOJA = { 'application/pdf': 'PDF', 'image/png': 'imagen', 'image/jpeg': 'imagen', 'image/webp': 'imagen' };

export function validarHoja(archivo) {
  if (!archivo) return 'No se eligió ningún archivo.';
  if (!TIPOS_HOJA[archivo.type]) return 'Solo se aceptan PDF o imágenes (PNG, JPG o WEBP).';
  if (archivo.size > MAX_BYTES_HOJA) return `El archivo pesa ${(archivo.size / 1048576).toFixed(1)} MB; el máximo es 15 MB.`;
  if (!archivo.size) return 'El archivo está vacío.';
  return null;
}

function abrir() {
  return new Promise((resolver, rechazar) => {
    if (!globalThis.indexedDB) { rechazar(new Error('no_disponible')); return; }
    let pet;
    try { pet = globalThis.indexedDB.open(BD_DOCUMENTOS, 1); } catch (err) { rechazar(err); return; }
    pet.onupgradeneeded = () => pet.result.createObjectStore(ALMACEN);
    pet.onsuccess = () => resolver(pet.result);
    pet.onerror = () => rechazar(pet.error || new Error('no_disponible'));
    pet.onblocked = () => rechazar(new Error('bloqueado'));
  });
}

async function operar(modo, accion) {
  const bd = await abrir();
  try {
    return await new Promise((resolver, rechazar) => {
      const t = bd.transaction(ALMACEN, modo);
      const pet = accion(t.objectStore(ALMACEN));
      let valor;
      pet.onsuccess = () => { valor = pet.result; };
      t.oncomplete = () => resolver(valor);
      t.onerror = () => rechazar(t.error || pet.error);
      t.onabort = () => rechazar(t.error || new Error('cancelado'));
    });
  } finally {
    bd.close();
  }
}

// { nombre, tipo, tamano, fecha, blob } o null.
export async function hojaDe(escalaId) {
  try { return (await operar('readonly', (s) => s.get(escalaId))) || null; } catch { return null; }
}

// Devuelve { ok, error }; la escritura se comprueba leyéndola de nuevo.
export async function guardarHoja(escalaId, archivo, ahora = Date.now()) {
  const error = validarHoja(archivo);
  if (error) return { ok: false, error };
  const registro = { nombre: String(archivo.name || 'hoja').slice(0, 120), tipo: archivo.type, tamano: archivo.size, fecha: ahora, blob: archivo };
  try {
    await operar('readwrite', (s) => s.put(registro, escalaId));
    const leido = await hojaDe(escalaId);
    if (!leido || leido.tamano !== archivo.size) return { ok: false, error: 'El navegador no confirmó el guardado de la hoja.' };
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: 'Este navegador no permitió guardar la hoja (almacenamiento lleno, bloqueado o ventana privada).' };
  }
}

export async function quitarHoja(escalaId) {
  try { await operar('readwrite', (s) => s.delete(escalaId)); return true; } catch { return false; }
}

export const tamanoLegible = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
