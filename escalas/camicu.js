// CAM-ICU: algoritmo de Ely et al. (2001) con la RASS como paso previo. Rasgos redactados para Huella;
// las pruebas de atención y de pensamiento deben aplicarse con el manual oficial.
import { SUG } from './_comun.js';
import { isoDe } from '../js/comparacion.js';
import { OPCIONES_RASS, signoRass } from './rass.js';

const PRESENTE = [
  { texto: 'Presente', valor: 1 },
  { texto: 'Ausente', valor: 0 },
];
const rassDe = (r) => OPCIONES_RASS[r.rass]?.valor;
const evaluable = (r) => rassDe(r) != null && rassDe(r) >= -3;
const errores = (r, id) => {
  const n = Number(String(r[id] ?? '').replace(',', '.'));
  return String(r[id] ?? '').trim() === '' || !Number.isFinite(n) ? null : n;
};

const POSITIVO = {
  id: 'pos', rango: '1 + 2 + (3 o 4)', etiqueta: 'CAM-ICU positivo', nivel: 'critico', hallazgo: true,
  texto: 'Cumple el algoritmo CAM-ICU: delirium presente en esta evaluación. La causa debe buscarse clínicamente.',
  sugerencias: [
    'Buscar y tratar la causa: infección, hipoxia, fármacos (en especial sedantes y anticolinérgicos), abstinencia, dolor, retención urinaria y alteraciones metabólicas.',
    SUG.revisionFarmacos,
    'Medidas no farmacológicas: orientación, sueño, movilización temprana, lentes y auxiliares auditivos; reevaluar al menos una vez por turno.',
  ],
};
const NEGATIVO = {
  id: 'neg', rango: 'Otra combinación', etiqueta: 'CAM-ICU negativo', nivel: 'bien',
  texto: 'No cumple el algoritmo CAM-ICU en esta evaluación. El delirium fluctúa: reevaluar si cambia el estado mental o la sedación.',
  sugerencias: [],
};
const NO_EVALUABLE = {
  id: 'ne', rango: 'RASS −4 o −5', etiqueta: 'No evaluable', nivel: 'neutro',
  texto: 'Sedación profunda o coma: el delirium no puede evaluarse. No se registra como negativo.',
  sugerencias: ['Reevaluar la RASS y aplicar el CAM-ICU cuando sea −3 o mayor.'],
};

const RASGOS = {
  agudo: 'cambio agudo o curso fluctuante',
  inatencion: 'inatención',
  conciencia: 'nivel de conciencia alterado',
  desorganizado: 'pensamiento desorganizado',
};

export default {
  id: 'camicu',
  nombre: 'CAM-ICU: método de evaluación de la confusión en cuidados intensivos',
  corto: 'CAM-ICU',
  dominio: 'delirium',
  tipo: 'diagnostico',
  aliases: ['delirium UCI', 'Ely', 'terapia intensiva', 'ventilacion mecanica', 'confusion UCI'],
  problemas: ['delirium', 'cuidados intensivos', 'ventilación mecánica', 'sedación'],
  descripcion: 'Delirium en UCI en dos pasos: RASS y, si es −3 o mayor, 4 rasgos (1 + 2 + 3 o 4).',
  objetivo: 'Identificar delirium en personas en cuidados intensivos, incluidas las que no pueden hablar por ventilación mecánica.',
  poblacion: 'Adultos en UCI, con o sin ventilación mecánica (Ely, 2001); versión en español validada por Tobar et al. (2010). No es intercambiable con el CAM, diseñado para hospitalización general.',
  aplicacion: [
    'Paso 1: mide la RASS en este momento. Con −4 o −5 el delirium no es evaluable: reevalúa más tarde.',
    'Paso 2: aplica los rasgos con el manual oficial (iCAMICU / Vanderbilt). Huella solo registra los resultados.',
    'Rasgo 2: cuenta los errores de la prueba de atención de 10 estímulos. Rasgo 4: cuenta los errores en las 4 preguntas y la orden.',
    'Rasgo 3 se toma de la RASS: cualquier valor distinto de 0 es nivel de conciencia alterado.',
  ],
  tiempo: '2 a 5 min',
  momentos: true,
  direccionClinica: 'sin_direccion',
  barra: false,
  vinculos: [
    {
      id: 'rass', escala: 'rass', titulo: 'RASS',
      disponible: (res) => (res.fecha === isoDe(new Date())
        ? (Number.isFinite(res.valor) ? true : 'La RASS guardada no tiene nivel.')
        : 'La RASS guardada no es de hoy: mide la sedación en este momento.'),
      advertencia: () => 'La sedación cambia en minutos: úsala solo si corresponde a esta evaluación.',
      describir: (res) => `RASS ${signoRass(res.valor)}`,
      aplicar: (res) => ({ rass: OPCIONES_RASS.findIndex((o) => o.valor === res.valor) }),
      siguientes: [
    { id: 'rass', si: (res) => Boolean(res.noEvaluable), motivo: 'Reevalúa la sedación más tarde; con RASS −3 o mayor, repite el CAM-ICU.' },
  ],
  campos: ['rass'],
    },
  ],
  campos: [
    { id: 'rass', texto: 'Paso 1 · RASS en este momento', textoCorto: 'RASS', puntua: false, opciones: OPCIONES_RASS },
    {
      id: 'agudo', texto: 'Rasgo 1 · Cambio agudo o curso fluctuante', textoCorto: RASGOS.agudo, puntua: false,
      ayuda: 'Cambio respecto al estado mental basal, o fluctuación en las últimas 24 h (en la RASS, en la escala de coma de Glasgow o en una evaluación previa de delirium).',
      opciones: PRESENTE, visibleSi: evaluable,
    },
    {
      id: 'inatencion', tipo: 'numero', texto: 'Rasgo 2 · Errores en la prueba de atención', textoCorto: 'errores de atención',
      ayuda: 'Prueba de 10 estímulos del manual oficial (letras o imágenes). Más de 2 errores = inatención.',
      unidad: 'de 10', min: 0, max: 10, entero: true,
      visibleSi: (r) => evaluable(r) && r.agudo === 0,
    },
    {
      id: 'desorganizado', tipo: 'numero', texto: 'Rasgo 4 · Errores en preguntas y orden', textoCorto: 'errores de pensamiento',
      ayuda: '4 preguntas de sí o no y una orden de dos pasos, según el manual oficial. Más de 1 error = pensamiento desorganizado. Solo se necesita si la RASS es 0.',
      unidad: 'de 5', min: 0, max: 5, entero: true,
      visibleSi: (r) => evaluable(r) && r.agudo === 0 && rassDe(r) === 0 && (errores(r, 'inatencion') ?? 0) > 2,
    },
  ],
  bandas: [POSITIVO, NEGATIVO, NO_EVALUABLE],
  calcular({ v }) {
    const rass = v.rass.valor;
    if (rass <= -4) {
      return {
        banda: NO_EVALUABLE,
        noEvaluable: `sedación profunda o coma, RASS ${signoRass(rass)}`,
        extras: { rass },
      };
    }
    const r1 = v.agudo.valor === 1;
    const r2 = r1 && v.inatencion > 2;
    const r3 = rass !== 0;
    const r4 = r1 && r2 && !r3 ? v.desorganizado > 1 : null;
    const positivo = r1 && r2 && (r3 || r4);
    const lineas = [`RASS ${signoRass(rass)}.`];
    lineas.push(`Rasgo 1 (${RASGOS.agudo}): ${r1 ? 'presente' : 'ausente'}.`);
    if (r1) lineas.push(`Rasgo 2 (${RASGOS.inatencion}): ${r2 ? 'presente' : 'ausente'} (${v.inatencion} errores de 10).`);
    if (r1 && r2) lineas.push(`Rasgo 3 (${RASGOS.conciencia}): ${r3 ? `presente (RASS ${signoRass(rass)})` : 'ausente (RASS 0)'}.`);
    if (r4 != null) lineas.push(`Rasgo 4 (${RASGOS.desorganizado}): ${r4 ? 'presente' : 'ausente'} (${v.desorganizado} errores de 5).`);
    if (!positivo) lineas.push(!r1 ? 'Sin rasgo 1 el algoritmo es negativo; no se requieren los demás.' : !r2 ? 'Sin inatención el algoritmo es negativo.' : 'Sin rasgo 3 ni 4 el algoritmo es negativo.');
    return {
      banda: positivo ? POSITIVO : NEGATIVO,
      lineas,
      lineasNota: lineas.slice(1),
      extras: { rass, r1, r2, r3: r1 && r2 ? r3 : null, r4 },
    };
  },
  resumen: (res) => `CAM-ICU ${res.banda.id === 'pos' ? 'positivo para delirium' : 'negativo'} (RASS ${signoRass(res.extras.rass)}).`,
  resumenBreve: (res) => `CAM-ICU ${res.banda.id === 'pos' ? 'positivo para delirium' : 'negativo'} (RASS ${signoRass(res.extras.rass)})`,
  detalleEnResumen: true,
  notas: [
    'Con RASS −4 o −5 el resultado es «no evaluable», nunca negativo.',
    'No es intercambiable con el CAM: se diseñó y validó en UCI, con pruebas no verbales. Fuera de la UCI usa 4AT o CAM.',
    'Un resultado negativo describe solo ese momento: el delirium fluctúa y conviene evaluarlo al menos una vez por turno.',
    'En demencia avanzada, afasia, sordera o barrera de idioma la prueba puede no ser válida: márcala como no evaluable y explica el motivo.',
    'Huella no reproduce las pruebas de atención ni las preguntas del manual; consulta el manual oficial y su capacitación.',
  ],
  licencia: { texto: 'CAM-ICU © 2002 E. Wesley Ely, MD, MPH, y Vanderbilt University. Manual, hojas de trabajo y traducciones en el sitio oficial.', enlace: 'https://www.icudelirium.org' },
  referencias: [
    { texto: 'Ely EW, Inouye SK, Bernard GR, et al. Delirium in mechanically ventilated patients: validity and reliability of the confusion assessment method for the intensive care unit (CAM-ICU). JAMA. 2001;286(21):2703-10.', doi: '10.1001/jama.286.21.2703' },
    { texto: 'Tobar E, Romero C, Galleguillos T, et al. Método para la evaluación de la confusión en la unidad de cuidados intensivos para el diagnóstico de delirium: adaptación cultural y validación de la versión en idioma español. Med Intensiva. 2010;34(1):4-13.', doi: '10.1016/j.medin.2009.04.003' },
    { texto: 'Sessler CN, Gosnell MS, Grap MJ, et al. The Richmond Agitation-Sedation Scale: validity and reliability in adult intensive care unit patients. Am J Respir Crit Care Med. 2002;166(10):1338-44.', doi: '10.1164/rccm.2107138' },
  ],
};
