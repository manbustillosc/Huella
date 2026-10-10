import { REF_INGER_2022, SUG } from './_comun.js';

// Definiciones de independencia del índice original (Katz et al., 1963).
// Independiente = sin supervisión, dirección ni ayuda personal activa.
const ACTIVIDADES = [
  {
    id: 'bano', texto: 'Baño (esponja, regadera o tina)', textoCorto: 'baño',
    opciones: [
      { texto: 'Independiente', detalle: 'Se baña solo o necesita ayuda solo en una parte del cuerpo (p. ej., espalda o una extremidad).', valor: 1 },
      { texto: 'Dependiente', detalle: 'Necesita ayuda en más de una parte del cuerpo, para entrar o salir de la tina, o no se baña solo.', valor: 0 },
    ],
  },
  {
    id: 'vestido', texto: 'Vestido', textoCorto: 'vestido',
    opciones: [
      { texto: 'Independiente', detalle: 'Toma la ropa y se viste por completo, incluidos broches; atarse los zapatos no se evalúa.', valor: 1 },
      { texto: 'Dependiente', detalle: 'No se viste solo o queda parcialmente vestido.', valor: 0 },
    ],
  },
  {
    id: 'sanitario', texto: 'Uso del sanitario', textoCorto: 'uso del sanitario',
    opciones: [
      { texto: 'Independiente', detalle: 'Llega al sanitario, se sienta y se levanta, se arregla la ropa y se limpia; puede usar apoyos (bastón, barras) y cómodo solo por la noche.', valor: 1 },
      { texto: 'Dependiente', detalle: 'Usa cómodo u orinal, o recibe ayuda para llegar al sanitario o usarlo.', valor: 0 },
    ],
  },
  {
    id: 'transferencias', texto: 'Transferencias (cama y silla)', textoCorto: 'transferencias',
    opciones: [
      { texto: 'Independiente', detalle: 'Entra y sale de la cama y se sienta y levanta de la silla sin ayuda; puede usar apoyos mecánicos.', valor: 1 },
      { texto: 'Dependiente', detalle: 'Necesita ayuda para moverse de la cama o la silla, o no realiza una o más transferencias.', valor: 0 },
    ],
  },
  {
    id: 'continencia', texto: 'Continencia', textoCorto: 'continencia',
    opciones: [
      { texto: 'Independiente', detalle: 'Control completo de la micción y la defecación.', valor: 1 },
      { texto: 'Dependiente', detalle: 'Incontinencia urinaria o fecal, parcial o total, o control mediante sonda, enemas u orinal programado.', valor: 0 },
    ],
  },
  {
    id: 'alimentacion', texto: 'Alimentación', textoCorto: 'alimentación',
    opciones: [
      { texto: 'Independiente', detalle: 'Lleva la comida del plato a la boca; cortar la carne o untar el pan no se evalúa.', valor: 1 },
      { texto: 'Dependiente', detalle: 'Necesita ayuda para comer, no come o recibe nutrición enteral o parenteral.', valor: 0 },
    ],
  },
];

const LETRAS = [
  { id: 'A', etiqueta: 'Clase A', nivel: 'bien', texto: 'Independiente en las seis actividades básicas.' },
  { id: 'B', etiqueta: 'Clase B', nivel: 'leve', texto: 'Independiente en todas las actividades salvo una.' },
  { id: 'C', etiqueta: 'Clase C', nivel: 'moderado', texto: 'Independiente en todas salvo baño y otra actividad.' },
  { id: 'D', etiqueta: 'Clase D', nivel: 'moderado', texto: 'Independiente en todas salvo baño, vestido y otra actividad.' },
  { id: 'E', etiqueta: 'Clase E', nivel: 'grave', texto: 'Independiente en todas salvo baño, vestido, uso del sanitario y otra actividad.' },
  { id: 'F', etiqueta: 'Clase F', nivel: 'grave', texto: 'Independiente en todas salvo baño, vestido, uso del sanitario, transferencias y otra actividad.' },
  { id: 'G', etiqueta: 'Clase G', nivel: 'critico', texto: 'Dependiente en las seis actividades básicas.' },
  { id: 'H', etiqueta: 'Clase H (otro)', nivel: 'moderado', texto: 'Dependiente en al menos dos actividades, sin clasificar como C, D, E ni F.' },
].map((l) => ({ ...l, rango: l.id }));

// Clasificación jerárquica de Katz (1963).
export function letraKatz(dependientes) {
  const d = new Set(dependientes);
  const n = d.size;
  const incluye = (...xs) => xs.every((x) => d.has(x));
  if (n === 0) return 'A';
  if (n === 1) return 'B';
  if (n === 6) return 'G';
  if (n === 2 && incluye('bano')) return 'C';
  if (n === 3 && incluye('bano', 'vestido')) return 'D';
  if (n === 4 && incluye('bano', 'vestido', 'sanitario')) return 'E';
  if (n === 5 && incluye('bano', 'vestido', 'sanitario', 'transferencias')) return 'F';
  return 'H';
}

export default {
  id: 'katz',
  nombre: 'Índice de Katz',
  corto: 'Katz',
  dominio: 'funcional',
  tipo: 'evaluacion',
  aliases: ['ABVD', 'actividades basicas', 'Katz ADL', 'independencia'],
  problemas: ['dependencia funcional', 'deterioro funcional', 'hospitalización', 'discapacidad asociada a la hospitalización'],
  descripcion: 'Actividades básicas de la vida diaria: 6 actividades, de 0 a 6 puntos y clasificación A–H.',
  objetivo: 'Identificar el grado de independencia en seis actividades básicas de la vida diaria.',
  poblacion: 'Desarrollado en personas mayores y con enfermedad crónica (Katz, 1963); muy usado en hospitalización para detectar discapacidad asociada a la hospitalización.',
  aplicacion: [
    'Observa a la persona o pregunta cómo realiza cada actividad; si no está cognitivamente íntegra, pregunta al cuidador.',
    'Independiente significa sin supervisión, dirección ni ayuda personal activa.',
    'Registra el estado basal (previo a la enfermedad aguda) y el actual para identificar actividades perdidas.',
  ],
  tiempo: '5 min',
  momentos: true,
  fuente: true,
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'recuperación de actividades básicas',
  textoEmpeoramiento: 'pérdida de actividades básicas',
  min: 0,
  max: 6,
  barra: false,
  textoEmpeoradas: 'actividades básicas perdidas respecto a la referencia',
  campos: ACTIVIDADES,
  bandas: LETRAS,
  calcular({ v }) {
    const dependientes = ACTIVIDADES.filter((a) => v[a.id].valor === 0).map((a) => a.id);
    const letra = letraKatz(dependientes);
    const base = LETRAS.find((l) => l.id === letra);
    const nombres = ACTIVIDADES.filter((a) => dependientes.includes(a.id)).map((a) => a.textoCorto);
    const banda = {
      ...base,
      etiqueta: `${base.etiqueta}: ${dependientes.length ? `dependiente en ${nombres.join(', ')}` : 'independiente'}`,
      hallazgo: dependientes.length > 0,
      sugerencias: dependientes.length ? [SUG.causaFuncional, SUG.rehabilitacion, SUG.cuidador] : [],
    };
    return { puntaje: 6 - dependientes.length, banda, extras: { letra, dependientes: nombres } };
  },
  resumen(res) {
    const { letra, dependientes } = res.extras;
    return `Katz ${letra}: ${res.puntaje}/6 (${dependientes.length ? `dependiente en ${dependientes.join(', ')}` : 'independiente en las 6 ABVD'}).`;
  },
  resumenBreve(res) {
    const { letra, dependientes } = res.extras;
    return `Katz ${letra} ${res.puntaje}/6 (${dependientes.length ? `dependiente en ${dependientes.join(', ')}` : 'independiente'})`;
  },
  notas: [
    'Se usan las definiciones de independencia del índice original (Katz, 1963). Algunas versiones en español, incluida la de la guía del INGER (2022), consideran independiente el traslado con asistencia, el uso del sanitario con ayuda y la incontinencia ocasional; aquí se conserva el criterio original.',
    'Cualquier puntaje menor de 6 indica dependencia. La pérdida de una o más actividades respecto al estado basal se usa como definición de discapacidad asociada a la hospitalización (Covinsky, 2011).',
    'Poco sensible a cambios en personas independientes; no evalúa actividades instrumentales.',
  ],
  referencias: [
    { texto: 'Katz S, Ford AB, Moskowitz RW, Jackson BA, Jaffe MW. Studies of illness in the aged. The index of ADL: a standardized measure of biological and psychosocial function. JAMA. 1963;185:914-9.', doi: '10.1001/jama.1963.03060120024016' },
    { texto: 'Covinsky KE, Pierluissi E, Johnston CB. Hospitalization-associated disability: "She was probably able to ambulate, but I\'m not sure". JAMA. 2011;306(16):1782-93.', doi: '10.1001/jama.2011.1556' },
    REF_INGER_2022,
  ],
};
