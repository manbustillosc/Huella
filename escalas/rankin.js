import { SUG } from './_comun.js';
import { FIGURAS_RANKIN } from './rankin-figuras.js';

// Escala de Rankin modificada (Rankin, 1957; van Swieten, 1988). Descripciones con redacción propia de Huella.
const GRADOS = [
  [0, 'Sin síntomas', 'bien', 'Ningún síntoma.'],
  [1, 'Sin discapacidad significativa', 'bien', 'Tiene síntomas, pero puede hacer todas sus actividades y obligaciones habituales.'],
  [2, 'Discapacidad leve', 'leve', 'No puede hacer todo lo que hacía antes, pero se ocupa de sus propios asuntos sin ayuda.'],
  [3, 'Discapacidad moderada', 'moderado', 'Necesita algo de ayuda, pero camina sin ayuda de otra persona (puede usar bastón o andadera).'],
  [4, 'Discapacidad moderadamente grave', 'grave', 'No puede caminar sin ayuda de otra persona ni atender sus necesidades corporales sin ayuda.'],
  [5, 'Discapacidad grave', 'critico', 'Encamada, con incontinencia; necesita cuidados y atención constantes.'],
  [6, 'Muerte', 'neutro', 'Fallecimiento (se usa al registrar el desenlace, p. ej., a los 90 días de un EVC).'],
];

const TEXTO_BANDA = [
  'Sin síntomas ni discapacidad.',
  'Síntomas sin discapacidad significativa: realiza todas sus actividades habituales.',
  'Independiente para sus asuntos, con alguna limitación respecto a sus actividades previas.',
  'Dependencia parcial: necesita algo de ayuda, aunque camina sin ayuda de otra persona.',
  'Dependiente para caminar y para su cuidado corporal.',
  'Dependencia total con necesidad de atención constante.',
  'Desenlace registrado: fallecimiento.',
];

export default {
  id: 'rankin',
  nombre: 'Escala de Rankin modificada (mRS)',
  corto: 'Rankin modificada',
  dominio: 'funcional',
  tipo: 'estadificacion',
  aliases: ['mRS', 'modified Rankin Scale', 'Rankin', 'discapacidad', 'EVC', 'ictus', 'evento vascular cerebral'],
  problemas: ['evento vascular cerebral', 'discapacidad', 'dependencia funcional', 'rehabilitación', 'pronóstico funcional'],
  descripcion: 'Discapacidad global en 7 grados (0 sin síntomas a 6 muerte), con figuras de cada grado.',
  objetivo: 'Graduar la discapacidad y la dependencia globales, sobre todo después de un evento vascular cerebral, y registrar el estado previo (premórbido).',
  poblacion: 'Personas con evento vascular cerebral (Rankin, 1957; versión modificada de van Swieten, 1988); se usa también en otras enfermedades neurológicas.',
  aplicacion: [
    'Pregunta a la persona o a su cuidador por lo que hace habitualmente, no por lo que podría hacer.',
    'Para el estado previo al EVC (Rankin premórbido), usa el momento «Basal».',
    'Usa la secuencia de preguntas del campo para decidir entre dos grados.',
  ],
  tiempo: '2 a 5 min',
  momentos: true,
  fuente: true,
  direccionClinica: 'menor_mejor',
  unidadCambio: ['grado', 'grados'],
  textoMejoria: 'menor discapacidad',
  textoEmpeoramiento: 'mayor discapacidad',
  min: 0,
  max: 6,
  campos: [
    {
      id: 'grado', texto: 'Grado que mejor describe a la persona', textoCorto: 'grado',
      ayuda: 'Para decidir: ¿camina sin ayuda de otra persona? Si no: ¿está encamada o necesita atención constante? (sí = 5; no = 4). Si camina sin ayuda: ¿necesita ayuda para sus asuntos, como dinero, compras, comida o aseo? (sí = 3). Si no: ¿dejó de hacer alguna actividad que hacía antes? (sí = 2). Si no: ¿tiene síntomas? (sí = 1; no = 0).',
      opciones: GRADOS.map(([n, nombre, , desc]) => ({ texto: `${n} · ${nombre}`, valor: n, detalle: desc, figura: FIGURAS_RANKIN[n] })),
    },
  ],
  bandas: GRADOS.map(([n, nombre, nivel, desc]) => ({
    min: n,
    max: n,
    etiqueta: `Grado ${n}: ${nombre.toLowerCase()}`,
    nivel,
    hallazgo: n >= 2 && n <= 5,
    figura: FIGURAS_RANKIN[n],
    texto: `${desc} ${TEXTO_BANDA[n]}${n <= 2 ? ' Grados 0 a 2: independencia funcional.' : n <= 5 ? ' Grados 3 a 5: dependencia.' : ''}`,
    sugerencias: n >= 3 && n <= 5 ? [SUG.causaFuncional, SUG.rehabilitacion, SUG.cuidador] : n === 2 ? [SUG.rehabilitacion] : [],
  })),
  calcular({ v }) {
    return { puntaje: v.grado.valor, max: 6, sufijo: '/ 6' };
  },
  resumen: (res) => `Rankin modificada: grado ${res.puntaje} (${res.banda.etiqueta.replace(/^Grado \d: /, '')}).`,
  resumenBreve: (res) => `mRS ${res.puntaje} (${res.banda.etiqueta.replace(/^Grado \d: /, '')})`,
  detalleEnResumen: true,
  notas: [
    'Grados 0 a 2: independencia funcional; 3 a 5: dependencia. En los estudios de EVC, un mRS de 0 a 2 a los 90 días suele considerarse resultado favorable (0 a 1, excelente).',
    'Mide la discapacidad global, no su causa: en personas mayores, la comorbilidad y la fragilidad previas pueden elevar el grado sin relación con el EVC. Registra el Rankin premórbido para comparar.',
    '«Sin ayuda» se refiere a otra persona: usar bastón o andadera no impide el grado 3.',
    'La versión de 1988 tiene grados 0 a 5; el grado 6 (muerte) se añadió para registrar desenlaces en los estudios.',
    'La concordancia entre evaluadores es moderada; una secuencia estructurada de preguntas (Bruno, 2010) la mejora.',
    'Descripciones con redacción propia y figuras originales de Huella.',
  ],
  licencia: { texto: 'Escala publicada por Rankin (1957) y modificada por van Swieten et al. (1988); se reproduce libremente en guías y protocolos, sin condiciones de uso publicadas. Huella usa redacción propia.' },
  referencias: [
    { texto: 'Rankin J. Cerebral vascular accidents in patients over the age of 60. II. Prognosis. Scott Med J. 1957;2(5):200-15.', doi: '10.1177/003693305700200504' },
    { texto: 'van Swieten JC, Koudstaal PJ, Visser MC, Schouten HJ, van Gijn J. Interobserver agreement for the assessment of handicap in stroke patients. Stroke. 1988;19(5):604-7.', doi: '10.1161/01.str.19.5.604' },
    { texto: 'Bruno A, Shah N, Lin C, et al. Improving modified Rankin Scale assessment with a simplified questionnaire. Stroke. 2010;41(5):1048-50.', doi: '10.1161/STROKEAHA.109.571562' },
  ],
};
