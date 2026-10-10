// Clinical Dementia Rating: registro del CDR global asignado con el algoritmo oficial y, opcionalmente, de las 6 casillas (CDR-SB).
import { fmt } from '../js/motor.js';

const ESTADIOS = [
  { valor: 0, nombre: 'Normal', nivel: 'bien', texto: 'Sin deterioro cognitivo ni funcional atribuible.' },
  { valor: 0.5, nombre: 'Deterioro cuestionable o muy leve', nivel: 'leve', texto: 'Deterioro cuestionable o muy leve: incluye personas con deterioro cognitivo leve y con demencia muy leve. Correlaciona con la evaluación clínica.' },
  { valor: 1, nombre: 'Demencia leve', nivel: 'moderado', texto: 'Demencia leve.' },
  { valor: 2, nombre: 'Demencia moderada', nivel: 'grave', texto: 'Demencia moderada.' },
  { valor: 3, nombre: 'Demencia grave', nivel: 'critico', texto: 'Demencia grave.' },
];
const SUG_DEMENCIA = [
  'Planificar con la persona y su familia: objetivos de atención, voluntades anticipadas y apoyos.',
  'Valorar síntomas neuropsiquiátricos (NPI-Q) y la carga del cuidador (Zarit).',
];

const CASILLAS = [
  { id: 'm', texto: 'Memoria', mediaPunto: true },
  { id: 'o', texto: 'Orientación', mediaPunto: true },
  { id: 'j', texto: 'Juicio y resolución de problemas', mediaPunto: true },
  { id: 'c', texto: 'Actividades en la comunidad', mediaPunto: true },
  { id: 'h', texto: 'Hogar y aficiones', mediaPunto: true },
  { id: 'p', texto: 'Cuidado personal', mediaPunto: false },
];
const opcionesCasilla = (media) => [0, ...(media ? [0.5] : []), 1, 2, 3].map((n) => ({ texto: String(n), valor: n }));

// Rangos del CDR-SB que corresponden a cada CDR global (O'Bryant, 2008; validados en NACC, 2010).
export function estadioPorSumaCasillas(sb) {
  if (sb === 0) return 0;
  if (sb <= 4) return 0.5;
  if (sb <= 9) return 1;
  if (sb <= 15.5) return 2;
  return 3;
}

export default {
  id: 'cdr',
  nombre: 'Clinical Dementia Rating (CDR)',
  corto: 'CDR',
  dominio: 'cognitivo',
  tipo: 'estadificacion',
  registro: true,
  aliases: ['Clinical Dementia Rating', 'CDR-SB', 'suma de casillas', 'estadificacion de demencia', 'Morris'],
  problemas: ['demencia', 'gravedad de la demencia', 'deterioro cognitivo leve', 'seguimiento'],
  descripcion: 'Registro del CDR global (0 a 3) asignado con el algoritmo oficial y, si se tienen, las 6 casillas (CDR-SB, 0 a 18).',
  objetivo: 'Estadificar la gravedad de un trastorno neurocognitivo y seguir su evolución.',
  poblacion: 'Personas con sospecha o diagnóstico de trastorno neurocognitivo, en especial enfermedad de Alzheimer (Morris, 1993). Requiere entrevista semiestructurada con un informante y con la persona.',
  aplicacion: [
    'Aplica la entrevista oficial del CDR con un informante y con la persona; requiere capacitación.',
    'Asigna el CDR global con el algoritmo oficial (o la calculadora del Knight ADRC); Huella no lo calcula ni reproduce la entrevista.',
    'Si tienes las 6 casillas, regístralas: Huella suma el CDR-SB, más sensible al cambio que el global.',
  ],
  tiempo: '30 a 40 min',
  direccionClinica: 'menor_mejor',
  unidadCambio: ['punto', 'puntos'],
  decimalesCambio: 1,
  textoMejoria: 'menor estadio registrado, sujeto a interpretación clínica',
  textoEmpeoramiento: 'progresión del estadio',
  min: 0,
  max: 3,
  siguientes: [
    { id: 'npiq', si: (res) => !res.noEvaluable && res.valor >= 1, motivo: 'Síntomas neuropsiquiátricos y angustia del cuidador.' },
    { id: 'zarit', si: (res) => !res.noEvaluable && res.valor >= 1, motivo: 'Sobrecarga del cuidador principal.' },
  ],
  campos: [
    {
      id: 'global', texto: 'CDR global asignado con el algoritmo oficial', textoCorto: 'CDR global', puntua: false,
      opciones: ESTADIOS.map((x) => ({ texto: `${x.valor} · ${x.nombre}`, valor: x.valor })),
    },
    {
      id: 'casillas', texto: '¿Registrar las 6 casillas (CDR-SB)?', textoCorto: 'casillas', puntua: false,
      opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }],
    },
    ...CASILLAS.map((c) => ({
      id: c.id, texto: c.texto, textoCorto: c.texto.toLowerCase(), puntua: false, compactoNumerico: true,
      opciones: opcionesCasilla(c.mediaPunto), visibleSi: (r) => r.casillas === 0,
    })),
  ],
  bandas: ESTADIOS.map((x) => ({
    min: x.valor, max: x.valor, rango: String(x.valor), etiqueta: x.nombre, nivel: x.nivel, hallazgo: x.valor > 0,
    texto: x.texto, sugerencias: x.valor >= 1 ? SUG_DEMENCIA : x.valor === 0.5 ? ['Completar la evaluación cognitiva y funcional y repetir el CDR para seguir la evolución.'] : [],
  })),
  calcular({ v }) {
    const global = v.global.valor;
    const lineas = [];
    const extras = { global, sb: null };
    if (v.casillas.valor === 1) {
      const sb = CASILLAS.reduce((s, c) => s + v[c.id].valor, 0);
      extras.sb = sb;
      extras.casillas = Object.fromEntries(CASILLAS.map((c) => [c.id, v[c.id].valor]));
      const esperado = estadioPorSumaCasillas(sb);
      lineas.push(`CDR-SB (suma de casillas): ${fmt(sb)}/18.`);
      lineas.push(`Casillas: ${CASILLAS.map((c) => `${c.texto.toLowerCase()} ${v[c.id].valor}`).join(', ')}.`);
      if (esperado !== global) {
        lineas.push(`Un CDR-SB de ${fmt(sb)} suele corresponder a un CDR global de ${esperado} (O'Bryant, 2008): verifica la asignación con el algoritmo oficial.`);
      }
    }
    return { valor: global, mostrar: fmt(global), sufijo: 'CDR global', unidad: '', lineas, lineasNota: lineas.filter((l) => !l.startsWith('Un CDR-SB')), extras };
  },
  resumen: (res) => `CDR global ${res.mostrar} (${res.banda.etiqueta.toLowerCase()})${res.extras.sb != null ? `; CDR-SB ${fmt(res.extras.sb)}/18` : ''}.`,
  resumenBreve: (res) => `CDR ${res.mostrar} (${res.banda.etiqueta.toLowerCase()})${res.extras.sb != null ? `, CDR-SB ${fmt(res.extras.sb)}` : ''}`,
  detalleEnResumen: true,
  cambioExtra(antes, despues) {
    const a = antes.extras?.sb;
    const d = despues.extras?.sb;
    if (a == null || d == null) return [];
    if (a === d) return [`CDR-SB sin cambio (${fmt(d)}).`];
    return [`CDR-SB de ${fmt(a)} a ${fmt(d)} (${d > a ? 'aumento' : 'disminución'} de ${fmt(Math.abs(d - a))}).`];
  },
  notas: [
    'Estadifica la gravedad; no diagnostica la causa del trastorno neurocognitivo.',
    'El CDR global se asigna con el algoritmo oficial, en el que la memoria es la casilla principal; no equivale a la suma ni al promedio de las casillas.',
    "Rangos del CDR-SB que corresponden a cada global (O'Bryant, 2008; validados en la base NACC, 2010): 0.5–4.0 → 0.5; 4.5–9.0 → 1; 9.5–15.5 → 2; 16–18 → 3.",
    'Las actividades se juzgan por el cambio respecto al nivel previo de la persona y por causa cognitiva, no por limitaciones físicas.',
    'Su uso requiere capacitación; el instrumento está protegido por derechos de autor.',
  ],
  licencia: { texto: 'CDR® © Washington University. Uso clínico y de investigación sujeto a permiso y capacitación del Knight Alzheimer Disease Research Center; Huella no reproduce la entrevista ni el algoritmo.', enlace: 'https://knightadrc.wustl.edu' },
  referencias: [
    { texto: 'Morris JC. The Clinical Dementia Rating (CDR): current version and scoring rules. Neurology. 1993;43(11):2412-4.', doi: '10.1212/wnl.43.11.2412-a' },
    { texto: "O'Bryant SE, Waring SC, Cullum CM, et al. Staging dementia using Clinical Dementia Rating Scale Sum of Boxes scores: a Texas Alzheimer's research consortium study. Arch Neurol. 2008;65(8):1091-5.", doi: '10.1001/archneur.65.8.1091' },
    { texto: "O'Bryant SE, Lacritz LH, Hall J, et al. Validation of the new interpretive guidelines for the clinical dementia rating scale sum of boxes score in the national Alzheimer's coordinating center database. Arch Neurol. 2010;67(6):746-9.", doi: '10.1001/archneurol.2010.115' },
  ],
};
