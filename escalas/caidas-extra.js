// Fase 4: índice de riesgo de caídas de Downton y Short FES-I (registro del puntaje).
import { SUG } from './_comun.js';

/* ---------- Downton ---------- */

const MEDICAMENTOS = [
  { id: 'sedantes', texto: 'Tranquilizantes o sedantes' },
  { id: 'diureticos', texto: 'Diuréticos' },
  { id: 'hipotensores', texto: 'Antihipertensivos distintos de diuréticos' },
  { id: 'antiparkinsonianos', texto: 'Antiparkinsonianos' },
  { id: 'antidepresivos', texto: 'Antidepresivos' },
  { id: 'otros', texto: 'Otros medicamentos (no suman)' },
];
const DEFICITS = [
  { id: 'visual', texto: 'Alteraciones visuales' },
  { id: 'auditivo', texto: 'Alteraciones auditivas' },
  { id: 'extremidades', texto: 'De las extremidades (p. ej., secuelas de ictus, neuropatía, amputación)' },
];

export const downton = {
  id: 'downton',
  nombre: 'Índice de riesgo de caídas de Downton',
  corto: 'Downton',
  dominio: 'caidas',
  tipo: 'tamizaje',
  aliases: ['riesgo de caídas', 'Downton', 'caídas hospital', 'enfermería'],
  problemas: ['caídas', 'riesgo de caídas', 'hospitalización'],
  descripcion: 'Caídas previas, medicamentos, déficits sensoriales y motores, estado mental y deambulación: 0 a 11 puntos.',
  objetivo: 'Identificar a las personas hospitalizadas o institucionalizadas con alto riesgo de caer.',
  poblacion: 'Personas mayores hospitalizadas o en residencias (Downton, 1993).',
  aplicacion: [
    'Registra cada factor con la información de la persona, el expediente y la observación.',
    'Cada medicamento de riesgo y cada déficit suma 1 punto; «otros medicamentos» no suma.',
    'Reevalúa al ingreso, tras una caída y cuando cambie el estado clínico o la medicación.',
  ],
  tiempo: '2 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor riesgo de caídas',
  textoEmpeoramiento: 'mayor riesgo de caídas',
  min: 0,
  max: 11,
  campos: [
    { id: 'caidas', texto: 'Caídas previas', textoCorto: 'caídas previas', opciones: [{ texto: 'No', valor: 0 }, { texto: 'Sí', valor: 1 }] },
    { id: 'medicamentos', tipo: 'checklist', texto: 'Medicamentos que toma', textoCorto: 'medicamentos', opciones: MEDICAMENTOS },
    { id: 'deficits', tipo: 'checklist', texto: 'Déficits sensoriales o motores', textoCorto: 'déficits', opciones: DEFICITS },
    { id: 'mental', texto: 'Estado mental', textoCorto: 'estado mental', opciones: [{ texto: 'Orientado', valor: 0 }, { texto: 'Confuso', valor: 1 }] },
    {
      id: 'deambulacion', texto: 'Deambulación', textoCorto: 'deambulación',
      opciones: [{ texto: 'Normal', valor: 0 }, { texto: 'Segura, con ayuda', valor: 1 }, { texto: 'Insegura, con o sin ayuda', valor: 1 }, { texto: 'Imposible', valor: 1 }],
    },
  ],
  bandas: [
    { min: 0, max: 2, etiqueta: 'Riesgo bajo de caídas', nivel: 'bien', texto: 'Menos de 3 puntos. No descarta el riesgo: reevalúa si cambia el estado clínico.', sugerencias: [] },
    { min: 3, max: 11, etiqueta: 'Riesgo alto de caídas', nivel: 'moderado', hallazgo: true, texto: '3 puntos o más: alto riesgo de caídas según Downton.', sugerencias: [SUG.caidas, SUG.revisionFarmacos, 'Medidas de prevención en el hospital: cama baja, iluminación, calzado, acompañamiento para levantarse y timbre al alcance.'] },
  ],
  calcular({ v }) {
    const meds = (v.medicamentos || []).filter((id) => id !== 'otros');
    const defs = v.deficits || [];
    const puntaje = v.caidas.valor + meds.length + defs.length + v.mental.valor + v.deambulacion.valor;
    const nombres = (lista, ids) => lista.filter((x) => ids.includes(x.id)).map((x) => x.texto.split(' (')[0].toLowerCase());
    const lineas = [];
    if (meds.length) lineas.push(`Medicamentos de riesgo: ${nombres(MEDICAMENTOS, meds).join(', ')} (${meds.length}).`);
    if (defs.length) lineas.push(`Déficits: ${nombres(DEFICITS, defs).join(', ')} (${defs.length}).`);
    return { puntaje, lineas, lineasNota: lineas };
  },
  notas: [
    'Punto de corte: 3 o más indica alto riesgo de caídas (Downton, 1993).',
    'Pensado para hospital y residencias; en la comunidad, la evaluación multifactorial (STEADI) es más informativa.',
  ],
  licencia: { texto: 'Índice publicado por Downton (1993); sin titular de licencias identificado.' },
  referencias: [
    { texto: 'Downton JH. Falls in the elderly. London: Edward Arnold; 1993.' },
  ],
};

/* ---------- Short FES-I (registro) ---------- */

export const shortFesi = {
  id: 'shortfesi',
  nombre: 'Escala internacional de eficacia ante las caídas, versión breve (Short FES-I)',
  corto: 'Short FES-I',
  dominio: 'caidas',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['FES-I', 'miedo a caer', 'temor a caídas', 'preocupación por caer', 'Falls Efficacy Scale'],
  problemas: ['miedo a caer', 'caídas', 'restricción de actividades'],
  descripcion: 'Registro del puntaje oficial: preocupación por caer en 7 actividades, de 1 a 4 cada una (7 a 28).',
  objetivo: 'Medir la preocupación por caer, que limita la actividad y aumenta el riesgo de caídas y de fragilidad.',
  poblacion: 'Personas mayores en la comunidad (Kempen, 2008); hay versiones oficiales en español.',
  aplicacion: [
    'Aplica la versión oficial en español (sitio de la FES-I, Universidad de Manchester). Huella solo registra el total.',
    'Pregunta por la preocupación que sentiría al hacer cada actividad, aunque no la haga habitualmente.',
  ],
  tiempo: '2 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menos preocupación por caer',
  textoEmpeoramiento: 'más preocupación por caer',
  min: 7,
  max: 28,
  campos: [{ id: 'puntaje', tipo: 'numero', texto: 'Puntaje total (7 a 28)', unidad: 'puntos', min: 7, max: 28, entero: true }],
  bandas: [
    { min: 7, max: 8, etiqueta: 'Preocupación baja por caer', nivel: 'bien', texto: 'Puntaje de 7 a 8.', sugerencias: [] },
    { min: 9, max: 13, etiqueta: 'Preocupación moderada por caer', nivel: 'leve', hallazgo: true, texto: 'Puntaje de 9 a 13.', sugerencias: ['Explorar si la preocupación limita actividades y considerar ejercicio de fuerza y equilibrio.'] },
    { min: 14, max: 28, etiqueta: 'Preocupación alta por caer', nivel: 'moderado', hallazgo: true, texto: 'Puntaje de 14 a 28: preocupación alta, asociada a restricción de actividades y mayor riesgo de caídas.', sugerencias: [SUG.caidas, 'Ejercicio de fuerza y equilibrio (p. ej., Vivifrail o tai chi) y abordaje cognitivo-conductual del miedo a caer.'] },
  ],
  calcular: ({ v }) => ({ puntaje: v.puntaje }),
  notas: [
    'Puntos de corte de Delbaere et al. (2010): 7 a 8 baja, 9 a 13 moderada y 14 a 28 alta preocupación por caer.',
    'Mide la preocupación por caer, no el riesgo de caídas por sí mismo.',
  ],
  licencia: { texto: 'FES-I y Short FES-I: Prevention of Falls Network Europe y Universidad de Manchester; versiones oficiales en su sitio. Huella solo registra el puntaje.', enlace: 'https://sites.manchester.ac.uk/fes-i/' },
  referencias: [
    { texto: 'Kempen GIJM, Yardley L, van Haastregt JCM, et al. The Short FES-I: a shortened version of the falls efficacy scale-international to assess fear of falling. Age Ageing. 2008;37(1):45-50.', doi: '10.1093/ageing/afm157' },
    { texto: 'Delbaere K, Close JCT, Mikolaizak AS, et al. The Falls Efficacy Scale International (FES-I). A comprehensive longitudinal validation study. Age Ageing. 2010;39(2):210-6.', doi: '10.1093/ageing/afp225' },
  ],
};
