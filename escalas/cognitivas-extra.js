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

// Percentiles de animales en 1 minuto en personas mayores mexicanas sin deterioro cognitivo (Chávez-Oliveros, 2015;
// referencia de la guía del INGER). Columnas: P1, P5, P10, P25, P50, P75, P90, media, DE.
const minusculaEsc = (t) => (t === 'Sin escolaridad' ? 'sin escolaridad' : `${t} de escolaridad`);
export const NORMAS_FLUENCIA = {
  '65-69': { 0: [5, 7, 8, 11, 13, 16, 20, 14.0, 4.1], 1: [4, 8, 9, 12, 15, 18, 20, 14.9, 4.4], 2: [7, 10, 11, 14, 17, 20, 22, 16.7, 4.3], 3: [9, 11, 13, 16, 18, 23, 26, 19.3, 5.0] },
  '70-74': { 0: [0, 6, 9, 11, 14, 16, 18, 13.6, 4.2], 1: [1, 7, 8, 12, 14, 18, 22, 14.4, 4.7], 2: [6, 8, 10, 12, 15, 18, 23, 15.1, 4.6], 3: [6, 11, 12, 17, 20, 22, 25, 19.5, 5.1] },
  '75-79': { 0: [0, 4, 7, 10, 12, 15, 18, 12.2, 4.3], 1: [1, 8, 9, 11, 14, 17, 22, 14.1, 5.0], 2: [7, 8, 10, 11, 14, 16, 21, 14.4, 4.2], 3: [7, 10, 12, 16, 18, 21, 26, 18.5, 4.5] },
  '80+': { 0: [0, 5, 7, 10, 12, 18, 19, 12.6, 4.7], 1: [0, 7, 8, 10, 13, 15, 18, 12.8, 4.3], 2: [4, 7, 9, 11, 14, 19, 21, 14.6, 4.9], 3: [8, 8, 12, 13, 16, 19, 21, 17.0, 6.4] },
};
const ESCOLARIDAD_FLUENCIA = [
  { texto: 'Sin escolaridad', valor: 0, hasta: 0 },
  { texto: '1 a 5 años', valor: 1, hasta: 5 },
  { texto: '6 a 8 años', valor: 2, hasta: 8 },
  { texto: '9 años o más', valor: 3, hasta: 99 },
];
const grupoEdad = (e) => (e >= 80 ? '80+' : e >= 75 ? '75-79' : e >= 70 ? '70-74' : '65-69');
export function percentilFluencia(animales, edad, escolaridad) {
  if (!Number.isFinite(edad) || edad < 65 || escolaridad == null) return null;
  const fila = NORMAS_FLUENCIA[grupoEdad(edad)][escolaridad];
  const [, p5, p10, p25, p50, p75, p90, media, de] = fila;
  const rango = animales < p5 ? 'menor del percentil 5' : animales < p10 ? 'percentil 5 a 9' : animales < p25 ? 'percentil 10 a 24' : animales < p50 ? 'percentil 25 a 49' : animales < p75 ? 'percentil 50 a 74' : animales < p90 ? 'percentil 75 a 89' : 'percentil 90 o más';
  const id = animales < p5 ? 'p5' : animales < p10 ? 'p10' : animales < p25 ? 'p25' : 'normal';
  return { grupo: grupoEdad(edad), rango, id, p10, p50, media, de };
}
const BF = {
  p5: { id: 'p5', rango: 'Menor del percentil 5', etiqueta: 'Muy por debajo de lo esperado para su edad y escolaridad', nivel: 'grave', hallazgo: true, texto: 'Menos animales que el 95 % de las personas mayores mexicanas sin deterioro de su edad y escolaridad.', sugerencias: [SUG.cognitivaCompleta, SUG.descartarDelirium] },
  p10: { id: 'p10', rango: 'Percentil 5 a 9', etiqueta: 'Por debajo de lo esperado para su edad y escolaridad', nivel: 'moderado', hallazgo: true, texto: 'Por debajo del percentil 10 de su grupo de edad y escolaridad.', sugerencias: [SUG.cognitivaCompleta, SUG.descartarDelirium] },
  p25: { id: 'p25', rango: 'Percentil 10 a 24', etiqueta: 'Límite bajo para su edad y escolaridad', nivel: 'leve', texto: 'Entre los percentiles 10 y 24 de su grupo: interpreta con la queja cognitiva y otras pruebas.', sugerencias: [] },
  normal: { id: 'normal', rango: 'Percentil 25 o más', etiqueta: 'Dentro de lo esperado para su edad y escolaridad', nivel: 'bien', texto: 'En el percentil 25 o más de su grupo de edad y escolaridad.', sugerencias: [] },
  bajo: { id: 'bajo', rango: '0 a 10', etiqueta: 'Por debajo del punto de corte', nivel: 'moderado', hallazgo: true, texto: '10 animales o menos: punto de corte usado en estudios españoles para demencia (sensibilidad alta, especificidad moderada). Sin edad y escolaridad no se usan las normas mexicanas.', sugerencias: [SUG.cognitivaCompleta, SUG.descartarDelirium] },
  alto: { id: 'alto', rango: '11 o más', etiqueta: 'Por encima del punto de corte', nivel: 'bien', texto: 'Más de 10 animales. No descarta deterioro cognitivo, sobre todo con escolaridad alta.', sugerencias: [] },
};

export const fluencia = {
  id: 'fluencia',
  nombre: 'Fluencia verbal semántica (animales en 1 minuto)',
  corto: 'Fluencia semántica',
  dominio: 'cognitivo',
  tipo: 'tamizaje',
  aliases: ['fluidez verbal', 'animales', 'fluencia categorial', 'FVS', 'evocación categorial'],
  problemas: ['deterioro cognitivo', 'demencia', 'memoria semántica', 'función ejecutiva'],
  descripcion: 'Animales distintos en 60 segundos, interpretados con percentiles de personas mayores mexicanas por edad y escolaridad.',
  objetivo: 'Evaluar la producción espontánea de palabras: explora lenguaje, memoria semántica y función ejecutiva.',
  poblacion: 'Personas mayores. Muy influida por la edad, la escolaridad, el sexo y la ocupación; la guía del INGER (2022) indica interpretarla con tablas normativas por edad y escolaridad.',
  aplicacion: [
    'Pide que diga todos los animales que pueda, de cualquier tipo (del aire, del agua, del bosque), en un minuto. Cronometra 60 segundos y anota las respuestas.',
    'Cuentan los animales válidos, incluidos los extintos, imaginarios o mágicos. No cuentan los nombres propios, las palabras incorrectas, las variaciones de un mismo animal ni las repeticiones.',
    'Registra la edad y la escolaridad para compararla con las normas mexicanas.',
  ],
  tiempo: '1 a 2 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'más animales evocados',
  textoEmpeoramiento: 'menos animales evocados',
  unidadCambio: ['animal', 'animales'],
  barra: false,
  min: 0,
  max: 60,
  campos: [
    { id: 'animales', tipo: 'numero', texto: 'Animales distintos en 60 segundos', unidad: 'animales', min: 0, max: 60, entero: true },
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad', opcional: true, ayuda: 'Las normas son para 65 años o más.' },
    { id: 'escolaridad', texto: 'Escolaridad', textoCorto: 'escolaridad', puntua: false, prefill: 'escolaridadRango', opcional: true, opciones: ESCOLARIDAD_FLUENCIA },
  ],
  bandas: [BF.p5, BF.p10, BF.p25, BF.normal, BF.bajo, BF.alto],
  calcular({ v }) {
    const n = v.animales;
    const esc = v.escolaridad ? v.escolaridad.valor : null;
    const norma = percentilFluencia(n, v.edad, esc);
    const lineas = [];
    let banda;
    if (norma) {
      banda = BF[norma.id];
      const grupo = norma.grupo === '80+' ? '80 años o más' : `${norma.grupo.replace('-', ' a ')} años`;
      lineas.push(`Normas mexicanas (${grupo}, ${minusculaEsc(v.escolaridad.texto)}): ${norma.rango}; mediana ${norma.p50}, percentil 10: ${norma.p10} (media ${norma.media.toFixed(1)} ± ${norma.de.toFixed(1)}).`);
    } else {
      banda = n <= 10 ? BF.bajo : BF.alto;
      lineas.push(Number.isFinite(v.edad) && v.edad < 65 ? 'Menor de 65 años: las normas mexicanas no aplican; se usa el punto de corte de 10.' : 'Sin edad y escolaridad: se usa el punto de corte de 10; regístralas para interpretar con las normas mexicanas.');
    }
    return { puntaje: n, mostrar: String(n), sufijo: 'animales en 1 min', banda, lineas, lineasNota: lineas, extras: { norma: norma ? norma.rango : null } };
  },
  resumen: (res) => `Fluencia semántica: ${res.puntaje} animales en 1 minuto (${res.banda.etiqueta.toLowerCase()}${res.extras?.norma ? `; ${res.extras.norma}` : ''}).`,
  resumenBreve: (res) => `Fluencia semántica ${res.puntaje} animales/min`,
  notas: [
    'Percentiles de Chávez-Oliveros et al. (2015) en 1,233 personas mayores mexicanas sin deterioro cognitivo ni síntomas depresivos, por edad (65 a 69, 70 a 74, 75 a 79 y 80 o más) y escolaridad (0, 1 a 5, 6 a 8 y 9 años o más). Es la referencia que cita la guía del INGER.',
    'Los autores no fijan un punto de corte: el percentil 10 se usa con frecuencia como límite bajo. Sin edad o escolaridad, Huella usa el corte de 10 animales (Barrero-Hernández, 2006).',
    'Útil para el seguimiento: compara siempre con la misma categoría (animales) y el mismo tiempo.',
  ],
  licencia: { texto: 'Prueba de dominio público. Los valores normativos se citan como datos publicados.' },
  referencias: [
    { texto: 'Chávez-Oliveros M, Rodríguez-Agudelo Y, Acosta-Castillo I, García-Ramírez N, Rojas de la Torre G, Sosa-Ortiz AL. Fluidez verbal-semántica en adultos mayores mexicanos: valores normativos. Neurología. 2015;30(4):189-94.', doi: '10.1016/j.nrl.2013.12.013' },
    { texto: 'Instituto Nacional de Geriatría. Guía de instrumentos de evaluación de la capacidad funcional. Fluencia verbal semántica (animales). Ciudad de México: INGER; 2022.', enlace: 'https://www.gob.mx/cms/uploads/attachment/file/813747/Guia_InstrumentosEvaluacion_2022_31oct.pdf' },
    { texto: 'Carnero-Pardo C, Maestre-Moreno JF, Marta-Moreno J, et al. Validación de un modelo de predicción de fluidez verbal semántica. Rev Neurol. 2000;30(11):1012-5.', doi: '10.33588/rn.3011.2000068' },
    { texto: 'Barrero-Hernández FJ, Vives-Montero F, Morales-Gordo B. Evaluación de la versión española del Memory Impairment Screen. Rev Neurol. 2006;43(1):15-9.' },
  ],
};
