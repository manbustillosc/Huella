// Registro de instrumentos. Para agregar uno nuevo:
// 1. Crea un archivo en esta carpeta siguiendo el formato de los existentes.
// 2. Impórtalo aquí y agrégalo a la lista ESCALAS.
// 3. Agrega su ruta a ARCHIVOS en sw.js y sube VERSION (para que funcione sin conexión).
// 4. Corre las pruebas: node --test tests/*.test.mjs
//
// Campos de un instrumento:
//   id, nombre, corto, dominio, tipo (tamizaje | evaluacion | diagnostico | desempeno | estadificacion | pronostico | calculadora | lista | prescripcion)
//   registro: true si el instrumento tiene titular de derechos y solo se captura su resultado (sin reproducir reactivos)
//   descripcion, objetivo, poblacion, aplicacion[], tiempo, aliases[], problemas[]
//   campos[]: { id, texto, tipo: 'opciones' | 'sino' | 'numero' | 'checklist' (con «Ninguno de los anteriores» obligatorio), opciones[], unidad, unidades[], min, max,
//               opcional, visibleSi(r), anotaA, puntua, prefill: 'edad' | 'sexo' | 'escolaridad12' }
//   min, max, bandas[{ min, max, rango, etiqueta, nivel, texto, hallazgo, sugerencias[] }]
//   calcular({ v, r, base, ctx }) para cálculo propio; resumen(res), resumenBreve(res)
//   momentos (basal/ingreso/actual/egreso), fuente, barra, notas[], licencia, referencias[]
//   direccionClinica ('mayor_mejor' | 'menor_mejor' | 'sin_direccion', obligatoria), unidadCambio, decimalesCambio,
//   textoMejoria, textoEmpeoramiento, comparable(antes, despues), cambioExtra(antes, despues, { dif }), validar({ v, r }),
//   vinculos[] (datos de otras pruebas de la misma valoración que el médico confirma antes de usarlos)
//   siguientes[{ id, si(res), motivo }] (siguiente paso sugerido según el resultado; nunca se aplica solo)
//   calcular puede devolver alertas[] (avisos de seguridad destacados que también llegan a la nota)

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
import rudas from './rudas.js';
import cdr from './cdr.js';
import fast from './fast.js';
import phq9 from './phq9.js';
import cornell from './cornell.js';
import npiq from './npiq.js';
import rass from './rass.js';
import camicu from './camicu.js';
import fried from './fried.js';
import tinetti from './tinetti.js';
import gijon from './gijon.js';

export const ESCALAS = [
  barthel, katz, lawton,
  minicog, moca, rudas, cdr, fast,
  gds15, phq9, cornell,
  cuatroAt, cam, rass, camicu, npiq,
  frail, cfs, fried, sarcf, sppb, vivifrail,
  tug, velocidad, tinetti,
  mnasf,
  braden,
  painad,
  rcri,
  zarit, gijon,
  ckdepi, cockcroft,
];
