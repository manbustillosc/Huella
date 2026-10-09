// Registro de escalas. Para agregar una escala nueva:
// 1. Crea un archivo en esta carpeta siguiendo el formato de las existentes.
// 2. Impórtalo aquí y agrégalo a la lista ESCALAS.
// 3. Agrega su ruta a la lista ARCHIVOS de sw.js (para que funcione sin conexión).
//
// Formato de una escala:
//   id, nombre, corto, dominio, aliases[], descripcion, aplicacion, tiempo, min, max
//   items[]: { id, texto, ayuda?, opciones[{ texto, detalle?, valor }] }
//            o { id, texto, ayuda?, tipo: 'sino', puntua: 'si' | 'no' }
//   bandas[]: { min, max, etiqueta, nivel: 'bien'|'leve'|'moderado'|'grave'|'critico', texto }
//   notas[], referencias[{ texto, doi? }], resumen?(resultado)

import barthel from './barthel.js';
import lawton from './lawton.js';
import gds15 from './gds15.js';
import cuatroAt from './cuatro-at.js';
import rcri from './rcri.js';

export const ESCALAS = [barthel, lawton, gds15, cuatroAt, rcri];
