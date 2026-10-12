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
  ordenCapacidad: {
    campos: ACTIVIDADES_PFEFFER.map(([id]) => id),
    mejor: 'bajo',
    etiquetas: ['Lo hace solo, sin dificultad', 'Con dificultad o con ayuda', 'Depende de otra persona', 'No aplica'],
  },
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
// Tabla del INGER (anexo 1) para menores de 65 años: valor en −1 DE y en −2 DE por escolaridad (0, 1 a 5, 6 a 8, 9 o más).
// Un puntaje igual o menor que el valor está por debajo de ese límite.
export const INGER_FLUENCIA_JOVENES = {
  '31-55': { 0: [9, 6], 1: [9, 6], 2: [12, 8], 3: [16, 11] },
  '56-64': { 0: [7, 1], 1: [7, 1], 2: [13, 8], 3: [16, 12] },
};
const grupoEdad = (e) => (e >= 80 ? '80+' : e >= 75 ? '75-79' : e >= 70 ? '70-74' : '65-69');
const nombreGrupo = (g) => (g === '80+' ? '80 años o más' : `${g.replace('-', ' a ')} años`);
export function percentilFluencia(animales, edad, escolaridad) {
  if (!Number.isFinite(edad) || edad < 31 || escolaridad == null) return null;
  if (edad < 65) {
    const g = edad <= 55 ? '31-55' : '56-64';
    const [uno, dos] = INGER_FLUENCIA_JOVENES[g][escolaridad];
    const id = animales <= dos ? 'dos' : animales <= uno ? 'uno' : 'normal';
    return { fuente: 'inger', grupo: g, id, uno, dos };
  }
  const fila = NORMAS_FLUENCIA[grupoEdad(edad)][escolaridad];
  const [, p5, p10, p25, p50, p75, p90, media, de] = fila;
  const rango = animales < p5 ? 'menor del percentil 5' : animales < p10 ? 'percentil 5 a 9' : animales < p25 ? 'percentil 10 a 24' : animales < p50 ? 'percentil 25 a 49' : animales < p75 ? 'percentil 50 a 74' : animales < p90 ? 'percentil 75 a 89' : 'percentil 90 o más';
  const z = (animales - media) / de;
  const id = z < -2 ? 'dos' : z < -1 ? 'uno' : 'normal';
  return { fuente: 'chavez', grupo: grupoEdad(edad), rango, id, z, p10, p50, media, de, normal: [Math.ceil(media - de), Math.floor(media + de)] };
}
const BF = {
  dos: { id: 'dos', rango: 'Menos de −2 DE', etiqueta: 'Muy por debajo de lo esperado para su edad y escolaridad', nivel: 'grave', hallazgo: true, texto: 'Más de 2 desviaciones estándar por debajo de la media de su grupo de edad y escolaridad.', sugerencias: [SUG.cognitivaCompleta, SUG.descartarDelirium] },
  uno: { id: 'uno', rango: 'Menos de −1 DE', etiqueta: 'Probable deterioro en fluencia semántica', nivel: 'moderado', hallazgo: true, texto: 'Menos de −1 desviación estándar para su edad y escolaridad: probable deterioro en fluencia verbal semántica (guía del INGER).', sugerencias: [SUG.cognitivaCompleta, SUG.descartarDelirium] },
  normal: { id: 'normal', rango: 'Dentro de ±1 DE o más', etiqueta: 'Dentro de lo esperado para su edad y escolaridad', nivel: 'bien', texto: 'Dentro del rango normal para su edad y escolaridad: no hay deterioro en este dominio (guía del INGER).', sugerencias: [] },
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
  descripcion: 'Animales distintos en 60 segundos, interpretados con las normas mexicanas por edad y escolaridad de la guía del INGER.',
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
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad', opcional: true, ayuda: 'Las normas mexicanas cubren de 31 años en adelante.' },
    { id: 'escolaridad', texto: 'Escolaridad', textoCorto: 'escolaridad', puntua: false, prefill: 'escolaridadRango', opcional: true, opciones: ESCOLARIDAD_FLUENCIA },
  ],
  bandas: [BF.dos, BF.uno, BF.normal, BF.bajo, BF.alto],
  calcular({ v }) {
    const n = v.animales;
    const esc = v.escolaridad ? v.escolaridad.valor : null;
    const norma = percentilFluencia(n, v.edad, esc);
    const lineas = [];
    let banda;
    if (norma && norma.fuente === 'chavez') {
      banda = BF[norma.id];
      const z = norma.z.toFixed(1).replace('-', '−');
      lineas.push(`Normas mexicanas (${nombreGrupo(norma.grupo)}, ${minusculaEsc(v.escolaridad.texto)}): ${z} DE (media ${norma.media.toFixed(1)} ± ${norma.de.toFixed(1)}); rango normal ${norma.normal[0]} a ${norma.normal[1]}; ${norma.rango}.`);
    } else if (norma) {
      banda = BF[norma.id];
      lineas.push(`Tabla del INGER (${norma.grupo.replace('-', ' a ')} años, ${minusculaEsc(v.escolaridad.texto)}): ${norma.uno} o menos está por debajo de −1 DE y ${norma.dos} o menos por debajo de −2 DE.`);
    } else {
      banda = n <= 10 ? BF.bajo : BF.alto;
      lineas.push(Number.isFinite(v.edad) && v.edad < 31 ? 'Menor de 31 años: la tabla del INGER no aplica; se usa el punto de corte de 10.' : 'Sin edad y escolaridad: se usa el punto de corte de 10; regístralas para interpretar con las normas mexicanas.');
    }
    return { puntaje: n, mostrar: String(n), sufijo: 'animales en 1 min', banda, lineas, lineasNota: lineas, extras: { norma: norma?.rango || null } };
  },
  resumen: (res) => `Fluencia semántica: ${res.puntaje} animales en 1 minuto (${res.banda.etiqueta.toLowerCase()}${res.extras?.norma ? `; ${res.extras.norma}` : ''}).`,
  resumenBreve: (res) => `Fluencia semántica ${res.puntaje} animales/min`,
  notas: [
    'Interpretación de la guía del INGER (anexo 1): un resultado menor de −1 desviación estándar para la edad y la escolaridad indica probable deterioro en fluencia verbal semántica.',
    'Desde los 65 años, Huella usa la media, la desviación estándar y los percentiles de Chávez-Oliveros et al. (2015; 1,233 personas mayores mexicanas sin deterioro cognitivo ni síntomas depresivos), los mismos datos de la tabla del INGER. De 31 a 64 años usa los valores de la tabla del INGER.',
    'Sin edad o escolaridad, Huella usa el corte de 10 animales (Barrero-Hernández, 2006).',
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
