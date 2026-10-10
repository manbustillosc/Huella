import { REF_INGER_2022, SUG } from './_comun.js';

const NO_APLICA = { texto: 'Nunca la ha realizado (no aplica)', detalle: 'Se excluye del total, como indica la guía del INGER.', valor: 0, especial: 'no-aplica' };

const ACTIVIDADES = [
  {
    id: 'telefono', texto: 'Uso del teléfono', textoCorto: 'uso del teléfono',
    opciones: [
      { texto: 'Lo usa por iniciativa propia, busca y marca números', valor: 1 },
      { texto: 'Marca solo unos cuantos números bien conocidos', valor: 1 },
      { texto: 'Contesta el teléfono, pero no llama', valor: 1 },
      { texto: 'No usa el teléfono', valor: 0 },
    ],
  },
  {
    id: 'transporte', texto: 'Uso de medios de transporte', textoCorto: 'transporte',
    opciones: [
      { texto: 'Viaja solo en transporte público o maneja su propio auto', valor: 1 },
      { texto: 'Se transporta solo únicamente en taxi; no usa otros medios', valor: 1 },
      { texto: 'Viaja en transporte colectivo si va acompañado', valor: 1 },
      { texto: 'Solo viaja en taxi o auto acompañado', valor: 0 },
      { texto: 'No sale', valor: 0 },
    ],
  },
  {
    id: 'medicacion', texto: 'Responsabilidad sobre su medicación', textoCorto: 'manejo de la medicación',
    opciones: [
      { texto: 'Toma sus medicamentos a la hora y dosis correctas', valor: 1 },
      { texto: 'Los toma solo si se los preparan por adelantado', valor: 0 },
      { texto: 'Es incapaz de hacerse cargo de su medicación', valor: 0 },
    ],
  },
  {
    id: 'dinero', texto: 'Manejo de asuntos económicos', textoCorto: 'manejo de dinero',
    opciones: [
      { texto: 'Maneja sus asuntos económicos de forma independiente', valor: 1 },
      { texto: 'Maneja los gastos diarios, pero necesita ayuda con compras grandes o el banco', valor: 1 },
      { texto: 'Es incapaz de manejar dinero', valor: 0 },
    ],
  },
  {
    id: 'compras', texto: 'Hacer compras', textoCorto: 'compras',
    opciones: [
      { texto: 'Realiza todas las compras necesarias de forma independiente', valor: 1 },
      { texto: 'Realiza solo compras pequeñas de forma independiente', valor: 0 },
      { texto: 'Necesita compañía para cualquier compra', valor: 0 },
      { texto: 'Es incapaz de comprar', valor: 0 },
    ],
  },
  {
    id: 'comida', texto: 'Preparación de la comida', textoCorto: 'preparación de la comida',
    opciones: [
      { texto: 'Planea, prepara y sirve las comidas adecuadamente', valor: 1 },
      { texto: 'Prepara las comidas solo si le dan los ingredientes', valor: 0 },
      { texto: 'Calienta, sirve y prepara, pero no lleva una dieta adecuada', valor: 0 },
      { texto: 'Necesita que le preparen y sirvan las comidas', valor: 0 },
    ],
  },
  {
    id: 'casa', texto: 'Cuidado de la casa', textoCorto: 'cuidado de la casa',
    opciones: [
      { texto: 'Mantiene la casa solo o con ayuda ocasional para trabajos pesados', valor: 1 },
      { texto: 'Realiza tareas ligeras (lavar platos, tender camas)', valor: 1 },
      { texto: 'Realiza tareas ligeras, pero sin mantener un nivel de limpieza aceptable', valor: 1 },
      { texto: 'Necesita ayuda en todas las labores de la casa', valor: 1 },
      { texto: 'No participa en ninguna labor de la casa', valor: 0 },
    ],
  },
  {
    id: 'ropa', texto: 'Lavado de la ropa', textoCorto: 'lavado de la ropa',
    opciones: [
      { texto: 'Lava sola toda su ropa', valor: 1 },
      { texto: 'Lava solo prendas pequeñas', valor: 1 },
      { texto: 'Otra persona lava toda su ropa', valor: 0 },
    ],
  },
];

const MOTIVOS = [
  { texto: 'Por limitación funcional (física o cognitiva)', valor: 0, clave: 'funcional' },
  { texto: 'Por barrera ambiental o sociocultural', valor: 0, clave: 'barrera' },
  { texto: 'Motivo no determinado', valor: 0, clave: 'indeterminado' },
];

const campos = ACTIVIDADES.flatMap((a) => [
  { ...a, opciones: [...a.opciones, NO_APLICA] },
  {
    id: `${a.id}_motivo`,
    texto: '¿Por qué no la realiza?',
    anotaA: a.id,
    opcional: true,
    secundario: true,
    opciones: MOTIVOS,
    visibleSi: (r) => {
      const o = a.opciones[r[a.id]];
      return r[a.id] != null && o != null && o.valor === 0;
    },
  },
]);

const lista = (xs) => xs.join(', ');
const plural = (n, uno, varios) => (n === 1 ? uno : varios);

const BANDA_INDEP = { id: 'indep', rango: 'Máximo aplicable', etiqueta: 'Independiente', nivel: 'bien', texto: 'Independiente en las actividades instrumentales aplicables.', sugerencias: [] };
const BANDA_DEP = { id: 'dep', rango: 'Menor al máximo', etiqueta: 'Dependencia en una o más actividades', nivel: 'moderado' };

export default {
  id: 'lawton',
  nombre: 'Escala de Lawton y Brody',
  corto: 'Lawton-Brody',
  dominio: 'funcional',
  tipo: 'evaluacion',
  aliases: ['AIVD', 'actividades instrumentales', 'Lawton', 'Brody'],
  problemas: ['dependencia funcional', 'deterioro funcional', 'deterioro cognitivo', 'vivir solo'],
  descripcion: 'Actividades instrumentales de la vida diaria (AIVD): 8 actividades, de 0 a 8 puntos.',
  objetivo: 'Identificar el grado de independencia en 8 actividades instrumentales, más sensibles que las básicas para detectar deterioro funcional temprano.',
  poblacion: 'Personas mayores que viven en la comunidad o en instituciones (Lawton y Brody, 1969). Versión en español validada por Vergara et al. (2012).',
  aplicacion: [
    'Pregunta al paciente o al cuidador (si hay deterioro cognitivo) cómo realiza cada actividad en el último mes.',
    'Elige en cada actividad la opción que mejor describa lo que hace.',
    'Si nunca ha realizado una actividad, marca «no aplica»: se excluye del total.',
    'Si no la realiza, indica si es por limitación funcional o por una barrera ambiental o sociocultural.',
  ],
  tiempo: '5 a 10 min',
  momentos: true,
  fuente: true,
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejoría en las AIVD',
  textoEmpeoramiento: 'deterioro en las AIVD',
  comparable(antes, despues) {
    if (antes.max != null && despues.max != null && antes.max !== despues.max) {
      return { noInterpretable: `cambiaron las actividades aplicables (${antes.max} y ${despues.max})` };
    }
    return null;
  },
  min: 0,
  max: 8,
  barra: false,
  textoEmpeoradas: 'actividades con menor puntaje que en la referencia',
  campos,
  bandas: [BANDA_INDEP, BANDA_DEP],
  calcular({ v }) {
    let puntaje = 0;
    let aplicables = 0;
    const dependientes = [];
    const noAplica = [];
    const barrera = [];
    for (const a of ACTIVIDADES) {
      const o = v[a.id];
      if (o.especial === 'no-aplica') {
        noAplica.push(a.textoCorto);
        continue;
      }
      aplicables += 1;
      puntaje += o.valor;
      if (o.valor === 0) {
        dependientes.push(a.textoCorto);
        if (v[`${a.id}_motivo`]?.clave === 'barrera') barrera.push(a.textoCorto);
      }
    }
    if (!aplicables) {
      return { banda: { etiqueta: 'Sin actividades aplicables', nivel: 'neutro', texto: 'Todas las actividades se marcaron como nunca realizadas; no se interpreta.' } };
    }
    const lineas = [];
    if (noAplica.length) lineas.push(`No aplicables (nunca las ha realizado): ${lista(noAplica)}. Se excluyen del total.`);
    if (barrera.length) lineas.push(`No realizadas por barrera ambiental o sociocultural: ${lista(barrera)}. No equivale necesariamente a pérdida funcional.`);
    if (puntaje === aplicables) {
      return { puntaje, max: aplicables, banda: BANDA_INDEP, lineas, extras: { dependientes, noAplica, barrera } };
    }
    const n = dependientes.length;
    const banda = {
      ...BANDA_DEP,
      etiqueta: `Dependencia en ${n} ${plural(n, 'actividad instrumental', 'actividades instrumentales')}`,
      hallazgo: true,
      texto: `Dependencia en ${n} de ${aplicables} actividades instrumentales aplicables: ${lista(dependientes)}.`,
      sugerencias: [SUG.causaFuncional, 'Si la dependencia es reciente o no se explica por limitación física, valorar la cognición (p. ej., Mini-Cog o MoCA).', SUG.cuidador],
    };
    return { puntaje, max: aplicables, banda, lineas, extras: { dependientes, noAplica, barrera } };
  },
  resumen(res) {
    const { dependientes, noAplica, barrera } = res.extras;
    let t = `Lawton-Brody: ${res.puntaje}/${res.max}`;
    t += dependientes.length
      ? ` (dependencia en ${dependientes.length} ${plural(dependientes.length, 'actividad', 'actividades')}: ${lista(dependientes)}${barrera.length ? `; por barrera ambiental o sociocultural: ${lista(barrera)}` : ''})`
      : ' (independiente en las actividades aplicables)';
    if (noAplica.length) t += `; no aplica: ${lista(noAplica)}`;
    return `${t}.`;
  },
  resumenBreve(res) {
    const { dependientes, noAplica } = res.extras;
    const dep = dependientes.length ? `dependencia en ${lista(dependientes)}` : 'independiente';
    return `Lawton-Brody ${res.puntaje}/${res.max} (${dep}${noAplica.length ? `; no aplica: ${lista(noAplica)}` : ''})`;
  },
  detalleEnResumen: false,
  notas: [
    'Se conserva la puntuación original de Lawton y Brody (1969), validada en español por Vergara (2012). La guía del INGER (2022) puntúa 0 en «necesita ayuda en todas las labores de la casa» y en «solo maneja lo necesario para pequeñas compras»; en la versión original ambas valen 1 punto.',
    'Las actividades que la persona nunca ha realizado se excluyen del total, como indica la guía del INGER (p. ej., 7/7).',
    'Una actividad no realizada por barrera ambiental o sociocultural se puntúa según la opción elegida, pero se señala en el texto.',
    'Influyen el rol de género, la cultura y el entorno. Es más útil para detectar deterioro temprano y para el seguimiento que como valor aislado.',
  ],
  referencias: [
    { texto: 'Lawton MP, Brody EM. Assessment of older people: self-maintaining and instrumental activities of daily living. Gerontologist. 1969;9(3):179-86.' },
    { texto: 'Vergara I, Bilbao A, Orive M, et al. Validation of the Spanish version of the Lawton IADL Scale for its application in elderly people. Health Qual Life Outcomes. 2012;10:130.', doi: '10.1186/1477-7525-10-130' },
    REF_INGER_2022,
  ],
};
