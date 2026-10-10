// Registro de instrumentos. Para agregar uno nuevo:
// 1. Crea un archivo en esta carpeta siguiendo el formato de los existentes.
// 2. Impórtalo aquí y agrégalo a la lista ESCALAS.
// 3. Agrega su ruta a ARCHIVOS en sw.js y sube VERSION (para que funcione sin conexión).
// 4. Corre las pruebas: node --test tests/
//
// Campos de un instrumento:
//   id, nombre, corto, dominio, tipo (tamizaje | evaluacion | diagnostico | desempeno | calculadora | registro | pronostico | prescripcion)
//   descripcion, objetivo, poblacion, aplicacion[], tiempo, aliases[], problemas[]
//   campos[]: { id, texto, tipo: 'opciones' | 'sino' | 'numero' | 'checklist', opciones[], unidad, unidades[], min, max,
//               opcional, visibleSi(r), anotaA, puntua, prefill: 'edad' | 'sexo' | 'escolaridad' | 'sppb' }
//   min, max, bandas[{ min, max, rango, etiqueta, nivel, texto, hallazgo, sugerencias[] }]
//   calcular({ v, r, base, ctx }) para cálculo propio; resumen(res), resumenBreve(res)
//   momentos (basal/ingreso/actual/egreso), fuente, mayorEsMejor, barra, notas[], licencia, referencias[]

import barthel from './barthel.js';
import katz from './katz.js';
import lawton from './lawton.js';
import minicog from './minicog.js';
import moca from './moca.js';
import gds15 from './gds15.js';
import cuatroAt from './cuatro-at.js';
import cam from './cam.js';
import frail from './frail.js';
import cfs from './cfs.js';
import sarcf from './sarcf.js';
import sppb from './sppb.js';
import vivifrail from './vivifrail.js';
import tug from './tug.js';
import velocidad from './velocidad-marcha.js';
import mnasf from './mnasf.js';
import braden from './braden.js';
import painad from './painad.js';
import rcri from './rcri.js';
import zarit from './zarit.js';
import ckdepi from './ckdepi.js';
import cockcroft from './cockcroft.js';

export const ESCALAS = [
  barthel, katz, lawton,
  minicog, moca,
  gds15,
  cuatroAt, cam,
  frail, cfs, sarcf, sppb, vivifrail,
  tug, velocidad,
  mnasf,
  braden,
  painad,
  rcri,
  zarit,
  ckdepi, cockcroft,
];
