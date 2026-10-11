// Fase 4: cuestionario de actividades funcionales de Pfeffer, Escala de Deterioro Global de Reisberg y fluencia verbal
// semántica. Redacción en español propia de Huella.
import { SUG } from './_comun.js';

/* ---------- FAQ de Pfeffer ---------- */

const OPC_PFEFFER = [
  { texto: '0 · Lo hace solo, sin dificultad', valor: 0, detalle: 'También si nunca lo hizo pero podría hacerlo ahora.' },
  { texto: '1 · Lo hace solo, con dificultad', valor: 1, detalle: 'También si nunca lo hizo y ahora tendría dificultad.' },
  { texto: '2 · Necesita ayuda', valor: 2 },
  { texto: '3 · No puede: depende de otra persona', valor: 3 },
];
const ACTIVIDADES_PFEFFER = [
  ['cuentas', 'Manejar su dinero: pagar cuentas, llevar la cuenta de sus gastos o del banco'],
  ['papeles', 'Ordenar y manejar papeles y trámites (recibos, impuestos, pensión, seguro)'],
  ['compras', 'Hacer solo las compras de ropa, artículos de la casa o el mandado'],
  ['juegos', 'Jugar un juego de habilidad (cartas, dominó, ajedrez) o practicar un pasatiempo'],
  ['cocina_simple', 'Calentar agua, preparar un café o una bebida y apagar la estufa'],
  ['comida', 'Preparar una comida completa'],
  ['noticias', 'Estar al tanto de lo que pasa en su comunidad o en las noticias'],
  ['atencion', 'Poner atención, entender y comentar un programa, una película, un libro o una revista'],
  ['recordar', 'Recordar citas, fechas familiares, días festivos o la toma de sus medicamentos'],
  ['traslado', 'Salir de su colonia: manejar, tomar el transporte público o organizar su traslado'],
];

export const pfeffer = {
  id: 'pfeffer',
  nombre: 'Cuestionario de actividades funcionales de Pfeffer (FAQ)',
  corto: 'FAQ de Pfeffer',
  dominio: 'funcional',
  tipo: 'evaluacion',
  aliases: ['Pfeffer', 'FAQ', 'Functional Activities Questionnaire', 'actividades funcionales', 'actividades instrumentales', 'informante'],
  problemas: ['deterioro cognitivo', 'demencia', 'dependencia funcional', 'actividades instrumentales'],
  descripcion: '10 actividades complejas de la vida diaria, informadas por un familiar o cuidador, de 0 a 3 cada una (0 a 30).',
  objetivo: 'Medir la repercusión del deterioro cognitivo en actividades complejas; ayuda a distinguir trastorno neurocognitivo leve de demencia.',
  poblacion: 'Personas mayores en la comunidad con sospecha de deterioro cognitivo, con un informante que las conozca bien (Pfeffer, 1982).',
  aplicacion: [
    'Pregunta a un familiar o cuidador cercano por el desempeño habitual de las últimas 4 semanas.',
    'Califica por la causa cognitiva, no por una limitación física: si no lo hace solo por un problema de la vista o de movilidad, anótalo como comentario clínico.',
    'Si la persona nunca hizo la actividad, califica lo que podría hacer ahora: 0 si podría sin dificultad, 1 si tendría dificultad.',
  ],
  tiempo: '5 a 10 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menos dependencia en actividades complejas',
  textoEmpeoramiento: 'más dependencia en actividades complejas',
  min: 0,
  max: 30,
  campos: ACTIVIDADES_PFEFFER.map(([id, texto]) => ({ id, texto, textoCorto: texto.split(':')[0].split(' (')[0].toLowerCase(), opciones: OPC_PFEFFER })),
  bandas: [
    { min: 0, max: 8, etiqueta: 'Sin alteración funcional significativa', nivel: 'bien', texto: 'Puntaje menor de 9. No descarta un deterioro leve; en el trastorno neurocognitivo leve suele haber puntajes bajos.', sugerencias: [] },
    {
      min: 9, max: 30, etiqueta: 'Alteración funcional en actividades complejas', nivel: 'moderado', hallazgo: true,
      texto: 'Puntaje de 9 o más (equivale a depender en 3 actividades o más): alteración funcional que, si se debe a una causa cognitiva, apoya un trastorno neurocognitivo mayor. No establece el diagnóstico.',
      sugerencias: [SUG.cognitivaCompleta, SUG.cuidador, 'Revisar seguridad en el manejo de dinero, medicamentos y traslados.'],
    },
  ],
  notas: [
    'Punto de corte 9 (Pfeffer, 1982): 9 o más indica alteración funcional. En otras poblaciones se han propuesto puntos de corte menores para detectar un deterioro más leve.',
    'Depende del informante: su conocimiento de la persona y su propio estado afectivo influyen en las respuestas.',
    'Califica por causa cognitiva; las limitaciones físicas o sensoriales elevan el puntaje sin indicar deterioro cognitivo.',
  ],
  licencia: { texto: 'Cuestionario publicado por Pfeffer et al. (1982); sin titular de licencias identificado. Redacción en español propia de Huella.' },
  referencias: [
    { texto: 'Pfeffer RI, Kurosaki TT, Harrah CH Jr, Chance JM, Filos S. Measurement of functional activities in older adults in the community. J Gerontol. 1982;37(3):323-9.', doi: '10.1093/geronj/37.3.323' },
  ],
};

/* ---------- Escala de Deterioro Global (GDS) de Reisberg ---------- */

const ESTADIOS_GDS = [
  { valor: 1, nombre: 'Sin deterioro cognitivo', desc: 'Sin quejas ni déficits evidentes en la entrevista.', nivel: 'bien' },
  { valor: 2, nombre: 'Deterioro cognitivo muy leve', desc: 'Quejas subjetivas de memoria (olvidos de nombres o de dónde dejó objetos) sin déficits objetivos en la entrevista ni en el trabajo o la vida social.', nivel: 'leve' },
  { valor: 3, nombre: 'Deterioro cognitivo leve', desc: 'Déficits objetivos y sutiles: menor rendimiento en tareas exigentes del trabajo o la vida social, dificultad para encontrar palabras o nombres, o para retener lo leído; puede haber ansiedad. Corresponde al deterioro cognitivo leve.', nivel: 'leve' },
  { valor: 4, nombre: 'Deterioro cognitivo moderado', desc: 'Déficits claros en la entrevista: menor conocimiento de sucesos recientes, dificultad con tareas complejas (finanzas, viajes, organización del hogar). Corresponde a demencia leve.', nivel: 'moderado' },
  { valor: 5, nombre: 'Deterioro cognitivo moderadamente grave', desc: 'Ya no puede sobrevivir sin ayuda: no recuerda datos relevantes de su vida actual (dirección, teléfono), desorientación en tiempo o lugar; necesita ayuda para elegir la ropa adecuada. Corresponde a demencia moderada.', nivel: 'grave' },
  { valor: 6, nombre: 'Deterioro cognitivo grave', desc: 'Puede olvidar el nombre de su pareja o cuidador; desconoce sucesos recientes; necesita ayuda en actividades básicas (vestido, baño) y puede tener incontinencia; cambios conductuales. Corresponde a demencia moderadamente grave.', nivel: 'critico' },
  { valor: 7, nombre: 'Deterioro cognitivo muy grave', desc: 'Pérdida progresiva del lenguaje y de las capacidades psicomotoras básicas (marcha, sostener la cabeza); dependencia total. Corresponde a demencia grave.', nivel: 'critico' },
];
const DECRECE = 'Un estadio menor no es lo esperable en una demencia neurodegenerativa: verifica la asignación y el informante, y si la evaluación previa coincidió con delirium, depresión, enfermedad aguda u otra causa reversible.';

export const gdsReisberg = {
  id: 'gdsr',
  nombre: 'Escala de Deterioro Global (GDS) de Reisberg',
  corto: 'GDS de Reisberg',
  dominio: 'cognitivo',
  tipo: 'estadificacion',
  registro: true,
  aliases: ['Reisberg', 'Global Deterioration Scale', 'GDS-Reisberg', 'estadio de demencia', 'deterioro global'],
  problemas: ['demencia', 'enfermedad de Alzheimer', 'gravedad de la demencia', 'seguimiento'],
  descripcion: 'Estadio global del deterioro cognitivo en 7 niveles, de 1 (sin deterioro) a 7 (muy grave), por entrevista con la persona y un informante.',
  objetivo: 'Estadificar la gravedad del deterioro cognitivo en la demencia degenerativa primaria y seguir su evolución.',
  poblacion: 'Personas con sospecha o diagnóstico de demencia degenerativa, sobre todo enfermedad de Alzheimer (Reisberg, 1982).',
  aplicacion: [
    'Entrevista a la persona y a un informante; elige el estadio que mejor describe su situación actual.',
    'Se complementa con la FAST, que detalla los estadios funcionales; no confundas esta GDS con la escala de depresión geriátrica (GDS-15).',
  ],
  tiempo: '5 min',
  direccionClinica: 'menor_mejor',
  unidadCambio: ['estadio', 'estadios'],
  textoMejoria: 'estadio menor, sujeto a interpretación clínica',
  textoEmpeoramiento: 'progresión del estadio',
  comparable: (a, b) => (Number.isFinite(a.valor) && Number.isFinite(b.valor) && b.valor < a.valor ? { advertencia: DECRECE } : null),
  min: 1,
  max: 7,
  campos: [{ id: 'estadio', texto: 'Estadio que mejor describe a la persona', textoCorto: 'estadio', puntua: false, opciones: ESTADIOS_GDS.map((x) => ({ texto: `GDS ${x.valor} · ${x.nombre}`, valor: x.valor, detalle: x.desc })) }],
  bandas: ESTADIOS_GDS.map((x) => ({
    min: x.valor, max: x.valor, rango: String(x.valor), etiqueta: x.nombre, nivel: x.nivel, hallazgo: x.valor >= 3, texto: x.desc,
    sugerencias: x.valor >= 4 ? ['Planificar con la persona y su familia: objetivos de atención, voluntades anticipadas y apoyos.', 'Valorar síntomas neuropsiquiátricos (NPI-Q) y la carga del cuidador (Zarit).'] : x.valor === 3 ? [SUG.cognitivaCompleta] : [],
  })),
  calcular: ({ v }) => ({ valor: v.estadio.valor, mostrar: String(v.estadio.valor), sufijo: 'GDS de Reisberg', unidad: '' }),
  resumen: (res) => `GDS de Reisberg: estadio ${res.mostrar} (${res.banda.etiqueta.toLowerCase()}).`,
  resumenBreve: (res) => `GDS de Reisberg ${res.mostrar} (${res.banda.etiqueta.toLowerCase()})`,
  siguientes: [
    { id: 'fast', si: (res) => res.valor >= 4, motivo: 'Detallar el estadio funcional (FAST), sobre todo en estadios avanzados.' },
  ],
  notas: [
    'Descripciones resumidas con redacción propia; consulta la escala original para los criterios completos de cada estadio.',
    'Estadifica la gravedad; no diagnostica la causa del deterioro.',
    'No es la escala de depresión geriátrica (GDS-15 de Yesavage), aunque comparten la sigla.',
  ],
  licencia: { texto: 'GDS © Barry Reisberg. Huella registra el estadio con descripciones breves propias y no reproduce la escala.' },
  referencias: [
    { texto: 'Reisberg B, Ferris SH, de Leon MJ, Crook T. The Global Deterioration Scale for assessment of primary degenerative dementia. Am J Psychiatry. 1982;139(9):1136-9.', doi: '10.1176/ajp.139.9.1136' },
  ],
};

/* ---------- Fluencia verbal semántica ---------- */

export const fluencia = {
  id: 'fluencia',
  nombre: 'Fluencia verbal semántica (animales en 1 minuto)',
  corto: 'Fluencia semántica',
  dominio: 'cognitivo',
  tipo: 'tamizaje',
  aliases: ['fluidez verbal', 'animales', 'fluencia categorial', 'FVS', 'set test', 'evocación categorial'],
  problemas: ['deterioro cognitivo', 'demencia', 'memoria semántica', 'función ejecutiva'],
  descripcion: 'Número de animales distintos que la persona dice en 60 segundos.',
  objetivo: 'Tamizaje breve de deterioro cognitivo que explora memoria semántica, velocidad de procesamiento y función ejecutiva.',
  poblacion: 'Personas mayores con sospecha de deterioro cognitivo. Muy influida por la edad y la escolaridad.',
  aplicacion: [
    'Instrucción: «Dígame todos los nombres de animales que se le ocurran, de cualquier tipo, lo más rápido que pueda. Tiene un minuto». Cronometra 60 segundos.',
    'Cuenta los animales distintos. No cuentan las repeticiones ni las variaciones de un mismo animal (perro y perrito cuentan como uno); sí cuentan una categoría y sus ejemplares (ave y canario).',
    'No des pistas; si se detiene, puedes animarla una vez a seguir.',
  ],
  tiempo: '1 a 2 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'más animales evocados',
  textoEmpeoramiento: 'menos animales evocados',
  unidadCambio: ['animal', 'animales'],
  barra: false,
  min: 0,
  max: 60,
  campos: [{ id: 'animales', tipo: 'numero', texto: 'Animales distintos en 60 segundos', unidad: 'animales', min: 0, max: 60, entero: true }],
  bandas: [
    { min: 0, max: 10, etiqueta: 'Por debajo del punto de corte', nivel: 'moderado', hallazgo: true, texto: '10 animales o menos: punto de corte usado en estudios españoles para demencia (sensibilidad alta, especificidad moderada). Con escolaridad baja hay más falsos positivos.', sugerencias: [SUG.cognitivaCompleta, SUG.descartarDelirium] },
    { min: 11, max: 60, etiqueta: 'Por encima del punto de corte', nivel: 'bien', texto: 'Más de 10 animales. No descarta deterioro cognitivo, sobre todo con escolaridad alta.', sugerencias: [] },
  ],
  calcular: ({ v }) => ({ puntaje: v.animales, mostrar: String(v.animales), sufijo: 'animales en 1 min' }),
  resumen: (res) => `Fluencia semántica: ${res.puntaje} animales en 1 minuto (${res.banda.etiqueta.toLowerCase()}).`,
  resumenBreve: (res) => `Fluencia semántica ${res.puntaje} animales/min`,
  notas: [
    'Punto de corte ≤10 animales (Barrero-Hernández, 2006, con el modelo de Carnero-Pardo, 2000): sensibilidad 93.9 % y especificidad cercana a 64 % para demencia.',
    'El desempeño esperado depende de la edad y de la escolaridad; para una interpretación individual usa normas por edad y escolaridad de tu población.',
    'Útil para el seguimiento: compara siempre con la misma categoría (animales) y el mismo tiempo.',
  ],
  licencia: { texto: 'Prueba de dominio público.' },
  referencias: [
    { texto: 'Carnero-Pardo C, Maestre-Moreno JF, Marta-Moreno J, et al. Validación de un modelo de predicción de fluidez verbal semántica. Rev Neurol. 2000;30(11):1012-5.', doi: '10.33588/rn.3011.2000068' },
    { texto: 'Barrero-Hernández FJ, Vives-Montero F, Morales-Gordo B. Evaluación de la versión española del Memory Impairment Screen. Rev Neurol. 2006;43(1):15-9.' },
  ],
};
