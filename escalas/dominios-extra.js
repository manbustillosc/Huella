// Fase 4: MUST (nutrición), Norton (piel), intensidad del dolor (EN y EVA), Karnofsky e índice pronóstico paliativo
// (paliativos), clasificación ASA (prequirúrgica), Lubben LSNS-6 y escala geriátrica de maltrato (social) y VES-13.
import { SUG } from './_comun.js';

const SINO = [{ texto: 'No', valor: 0 }, { texto: 'Sí', valor: 1 }];

/* ---------- MUST ---------- */

export const must = {
  id: 'must',
  nombre: 'Instrumento universal de cribado de malnutrición (MUST)',
  corto: 'MUST',
  dominio: 'nutricion',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['Malnutrition Universal Screening Tool', 'BAPEN', 'desnutrición', 'riesgo nutricional'],
  problemas: ['desnutrición', 'pérdida de peso', 'riesgo nutricional', 'hospitalización'],
  descripcion: 'Registro del puntaje obtenido con la herramienta oficial de BAPEN: riesgo bajo, medio o alto de desnutrición (0 a 6).',
  objetivo: 'Identificar desnutrición o riesgo de desnutrición en adultos en el hospital, residencias y la comunidad.',
  poblacion: 'Adultos en cualquier ámbito (BAPEN, 2003). En personas mayores, el MNA-SF es la herramienta específica.',
  aplicacion: [
    'Aplica el MUST con la herramienta oficial de BAPEN (descarga o calculadora en línea, gratuitas para profesionales). Huella solo registra el puntaje total y su categoría.',
    'Puedes guardar tu copia de la herramienta oficial en «Tu hoja oficial».',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor riesgo nutricional',
  textoEmpeoramiento: 'mayor riesgo nutricional',
  min: 0,
  max: 6,
  campos: [{ id: 'puntaje', tipo: 'numero', texto: 'Puntaje MUST total (0 a 6)', unidad: 'puntos', min: 0, max: 6, entero: true }],
  bandas: [
    { id: 'bajo', min: 0, max: 0, etiqueta: 'Riesgo bajo de desnutrición', nivel: 'bien', texto: 'MUST 0: atención habitual y repetir el cribado según el ámbito (hospital cada semana, residencias cada mes, comunidad cada año en grupos de riesgo).', sugerencias: [] },
    { id: 'medio', min: 1, max: 1, etiqueta: 'Riesgo medio de desnutrición', nivel: 'leve', hallazgo: true, texto: 'MUST 1: observar; registrar la ingesta durante 3 días y repetir el cribado.', sugerencias: ['Registrar la ingesta de 3 días; si es insuficiente, intervenir según la política local.', SUG.nutricion] },
    { id: 'alto', min: 2, max: 6, etiqueta: 'Riesgo alto de desnutrición', nivel: 'moderado', hallazgo: true, texto: 'MUST 2 o más: tratar. Referir a nutrición, mejorar y aumentar la ingesta y vigilar el plan.', sugerencias: ['Referir a nutrición; fijar metas de energía y proteína y vigilar el peso.', SUG.nutricion] },
  ],
  calcular: ({ v }) => ({ puntaje: v.puntaje }),
  notas: [
    'Categorías de BAPEN: 0 riesgo bajo, 1 medio, 2 o más alto.',
    'BAPEN cobra licencia por integrar el cálculo del MUST en apps usadas fuera del Reino Unido; por eso Huella no lo calcula y solo registra el resultado, como en un expediente clínico.',
  ],
  licencia: { texto: '«MUST» © BAPEN (British Association for Parenteral and Enteral Nutrition). Huella no reproduce la herramienta ni calcula el puntaje: registra el resultado obtenido con la versión oficial.', enlace: 'https://www.bapen.org.uk/must-and-self-screening/must/' },
  referencias: [
    { texto: 'Elia M. The «MUST» report. Nutritional screening of adults: a multidisciplinary responsibility. Redditch: BAPEN; 2003.', enlace: 'https://www.bapen.org.uk' },
    { texto: 'Stratton RJ, Hackston A, Longmore D, et al. Malnutrition in hospital outpatients and inpatients: prevalence, concurrent validity and ease of use of the «malnutrition universal screening tool» («MUST») for adults. Br J Nutr. 2004;92(5):799-808.', doi: '10.1079/bjn20041258' },
  ],
};

/* ---------- Norton ---------- */

const n4 = (a, b, c, d) => [{ texto: a, valor: 4 }, { texto: b, valor: 3 }, { texto: c, valor: 2 }, { texto: d, valor: 1 }];

export const norton = {
  id: 'norton',
  nombre: 'Escala de Norton para el riesgo de lesiones por presión',
  corto: 'Norton',
  dominio: 'piel',
  tipo: 'tamizaje',
  aliases: ['úlceras por presión', 'lesiones por presión', 'escaras', 'riesgo de úlceras'],
  problemas: ['lesiones por presión', 'inmovilidad', 'incontinencia'],
  descripcion: 'Estado físico, estado mental, actividad, movilidad e incontinencia, de 1 a 4 cada uno (5 a 20).',
  objetivo: 'Identificar el riesgo de lesiones por presión para indicar medidas de prevención.',
  poblacion: 'Personas mayores hospitalizadas o institucionalizadas (Norton, 1962). Alternativa a Braden.',
  aplicacion: ['Califica cada dimensión según el estado actual; reevalúa ante cambios clínicos.'],
  tiempo: '2 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'menor riesgo de lesiones por presión',
  textoEmpeoramiento: 'mayor riesgo de lesiones por presión',
  min: 5,
  max: 20,
  campos: [
    { id: 'fisico', texto: 'Estado físico general', textoCorto: 'estado físico', opciones: n4('Bueno', 'Aceptable', 'Pobre', 'Muy malo') },
    { id: 'mental', texto: 'Estado mental', textoCorto: 'estado mental', opciones: n4('Alerta', 'Apático', 'Confuso', 'Estuporoso o comatoso') },
    { id: 'actividad', texto: 'Actividad', textoCorto: 'actividad', opciones: n4('Camina solo', 'Camina con ayuda', 'Sentado (en silla)', 'Encamado') },
    { id: 'movilidad', texto: 'Movilidad', textoCorto: 'movilidad', opciones: n4('Completa', 'Ligeramente limitada', 'Muy limitada', 'Inmóvil') },
    { id: 'incontinencia', texto: 'Incontinencia', textoCorto: 'incontinencia', opciones: n4('Ninguna', 'Ocasional', 'Urinaria o fecal habitual', 'Urinaria y fecal') },
  ],
  bandas: [
    { min: 5, max: 9, etiqueta: 'Riesgo muy alto', nivel: 'critico', hallazgo: true, texto: 'Puntaje de 5 a 9.', sugerencias: ['Superficie especial de alivio de presión, cambios posturales programados, cuidado de la piel y de la humedad, y nutrición.'] },
    { min: 10, max: 12, etiqueta: 'Riesgo alto', nivel: 'grave', hallazgo: true, texto: 'Puntaje de 10 a 12.', sugerencias: ['Cambios posturales programados, superficie de alivio de presión, cuidado de la piel y nutrición.'] },
    { min: 13, max: 14, etiqueta: 'Riesgo medio', nivel: 'moderado', hallazgo: true, texto: 'Puntaje de 13 a 14: el punto de corte original (14 o menos) indica riesgo.', sugerencias: ['Medidas de prevención: movilización, cuidado de la piel, manejo de la humedad y nutrición.'] },
    { min: 15, max: 20, etiqueta: 'Riesgo mínimo', nivel: 'bien', texto: 'Puntaje mayor de 14.', sugerencias: [] },
  ],
  notas: [
    'Punto de corte original: 14 o menos indica riesgo (Norton, 1962). Los rangos de riesgo muy alto, alto y medio corresponden a la versión modificada de uso habitual en español.',
    'Braden es otra opción para el mismo fin; no combines los puntajes.',
  ],
  licencia: { texto: 'Escala publicada por Norton, McLaren y Exton-Smith (1962); sin titular de licencias identificado.' },
  referencias: [
    { texto: 'Norton D, McLaren R, Exton-Smith AN. An investigation of geriatric nursing problems in hospital. London: National Corporation for the Care of Old People; 1962.' },
  ],
};

/* ---------- Intensidad del dolor: EN y EVA ---------- */

export const dolorIntensidad = {
  id: 'dolorint',
  nombre: 'Intensidad del dolor: escala numérica (EN) o visual analógica (EVA)',
  corto: 'Intensidad del dolor',
  dominio: 'dolor',
  tipo: 'evaluacion',
  aliases: ['EVA', 'EN', 'escala numérica', 'escala visual analógica', 'dolor', 'NRS', 'VAS'],
  problemas: ['dolor', 'dolor crónico', 'analgesia'],
  descripcion: 'Intensidad del dolor que refiere la persona: de 0 a 10 (numérica) o de 0 a 100 mm (visual analógica).',
  objetivo: 'Medir la intensidad del dolor referida por la persona y seguir la respuesta al tratamiento.',
  poblacion: 'Personas que pueden comunicar su dolor. Con deterioro cognitivo avanzado, usa PAINAD.',
  aplicacion: [
    'Numérica: «Del 0 al 10, donde 0 es nada de dolor y 10 el peor dolor imaginable, ¿cuánto le duele ahora?».',
    'Visual analógica: línea de 10 cm de «sin dolor» a «el peor dolor imaginable»; mide en milímetros desde el inicio hasta la marca.',
    'Registra el contexto: en reposo, con el movimiento o el peor dolor de las últimas 24 horas.',
  ],
  tiempo: '1 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menos dolor',
  textoEmpeoramiento: 'más dolor',
  barra: false,
  min: 0,
  max: 10,
  campos: [
    { id: 'escala', texto: 'Escala usada', textoCorto: 'escala', puntua: false, opciones: [{ texto: 'Numérica (0 a 10)', valor: 0 }, { texto: 'Visual analógica (0 a 100 mm)', valor: 1 }] },
    { id: 'en', tipo: 'numero', texto: 'Intensidad (0 a 10)', unidad: 'de 10', min: 0, max: 10, entero: true, visibleSi: (r) => r.escala === 0 },
    { id: 'eva', tipo: 'numero', texto: 'Distancia marcada (0 a 100)', unidad: 'mm', min: 0, max: 100, entero: true, visibleSi: (r) => r.escala === 1 },
    { id: 'contexto', texto: 'Momento', textoCorto: 'momento', puntua: false, opciones: [{ texto: 'En reposo', valor: 0 }, { texto: 'Con el movimiento', valor: 1 }, { texto: 'El peor de las últimas 24 h', valor: 2 }] },
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'Sin dolor', nivel: 'bien', texto: 'Sin dolor referido.', sugerencias: [] },
    { min: 0.1, max: 3.99, etiqueta: 'Dolor leve', nivel: 'leve', hallazgo: true, texto: 'Dolor leve (1 a 3 de 10).', sugerencias: ['Identificar el tipo y la causa del dolor y su repercusión en la función y el sueño.'] },
    { min: 4, max: 6.99, etiqueta: 'Dolor moderado', nivel: 'moderado', hallazgo: true, texto: 'Dolor moderado (4 a 6 de 10).', sugerencias: ['Valoración integral del dolor y ajuste del tratamiento; revisar efectos adversos de los analgésicos en personas mayores.'] },
    { min: 7, max: 10, etiqueta: 'Dolor intenso', nivel: 'grave', hallazgo: true, texto: 'Dolor intenso (7 a 10 de 10).', sugerencias: ['Valoración y tratamiento prioritarios del dolor; reevaluar después de cada intervención.'] },
  ],
  calcular({ v }) {
    const valor = v.escala.valor === 0 ? v.en : v.eva / 10;
    const mostrar = v.escala.valor === 0 ? String(v.en) : `${v.eva} mm`;
    return { valor, mostrar, sufijo: v.escala.valor === 0 ? '/ 10' : `(${(v.eva / 10).toFixed(1)} de 10)`, unidad: '', extras: { escala: v.escala.valor === 0 ? 'EN' : 'EVA', contexto: v.contexto.texto } };
  },
  resumen: (res) => `Dolor (${res.extras.escala}, ${res.extras.contexto.toLowerCase()}): ${res.mostrar}${res.extras.escala === 'EVA' ? ` (${res.valor.toFixed(1)} de 10)` : '/10'} (${res.banda.etiqueta.toLowerCase()}).`,
  resumenBreve: (res) => `Dolor ${res.extras.escala} ${res.mostrar}${res.extras.escala === 'EN' ? '/10' : ''}`,
  decimalesCambio: 1,
  comparable(a, b) {
    const ea = a.extras?.escala; const eb = b.extras?.escala;
    if (ea && eb && ea !== eb) return { advertencia: 'Una medición usó la escala numérica y otra la visual analógica: compara con cautela.' };
    const ca = a.extras?.contexto; const cb = b.extras?.contexto;
    return ca && cb && ca !== cb ? { advertencia: `Contextos distintos (${ca.toLowerCase()} y ${cb.toLowerCase()}).` } : null;
  },
  notas: [
    'Categorías de uso habitual: 1 a 3 leve, 4 a 6 moderado y 7 a 10 intenso. Otros autores usan 1 a 4, 5 a 6 y 7 a 10 (Serlin, 1995).',
    'Un cambio de unos 2 puntos (o 30 %) suele considerarse clínicamente importante en dolor crónico (Farrar, 2001).',
    'La intensidad es solo una dimensión: valora también la repercusión en la función, el sueño y el ánimo.',
  ],
  licencia: { texto: 'Escalas de dominio público.' },
  referencias: [
    { texto: 'Serlin RC, Mendoza TR, Nakamura Y, Edwards KR, Cleeland CS. When is cancer pain mild, moderate or severe? Grading pain severity by its interference with function. Pain. 1995;61(2):277-84.', doi: '10.1016/0304-3959(94)00178-H' },
    { texto: 'Farrar JT, Young JP Jr, LaMoreaux L, Werth JL, Poole MR. Clinical importance of changes in chronic pain intensity measured on an 11-point numerical pain rating scale. Pain. 2001;94(2):149-58.', doi: '10.1016/S0304-3959(01)00349-9' },
  ],
};

/* ---------- Karnofsky ---------- */

const KPS = [
  [100, 'Normal; sin quejas ni evidencia de enfermedad.'],
  [90, 'Capaz de realizar su actividad normal; signos o síntomas menores de enfermedad.'],
  [80, 'Actividad normal con esfuerzo; algunos signos o síntomas de enfermedad.'],
  [70, 'Cuida de sí mismo; no puede realizar su actividad normal ni trabajar.'],
  [60, 'Requiere ayuda ocasional, pero atiende la mayoría de sus necesidades.'],
  [50, 'Requiere ayuda considerable y atención médica frecuente.'],
  [40, 'Incapacitado; requiere cuidados y ayuda especiales.'],
  [30, 'Gravemente incapacitado; está indicada la hospitalización, aunque la muerte no es inminente.'],
  [20, 'Muy enfermo; necesita hospitalización y tratamiento de soporte activo.'],
  [10, 'Moribundo; procesos mortales que progresan rápidamente.'],
];

export const karnofsky = {
  id: 'karnofsky',
  nombre: 'Escala de estado funcional de Karnofsky (KPS)',
  corto: 'Karnofsky',
  dominio: 'paliativos',
  tipo: 'estadificacion',
  aliases: ['KPS', 'Karnofsky Performance Status', 'estado funcional', 'oncología', 'cuidados paliativos'],
  problemas: ['cáncer', 'cuidados paliativos', 'estado funcional', 'pronóstico'],
  descripcion: 'Estado funcional global de 100 (normal) a 10 (moribundo), en intervalos de 10.',
  objetivo: 'Describir el estado funcional en personas con cáncer o enfermedad avanzada y apoyar decisiones terapéuticas y pronósticas.',
  poblacion: 'Personas con cáncer y otras enfermedades avanzadas (Karnofsky, 1949).',
  aplicacion: ['Elige el nivel que mejor describe el estado actual; la PPS es una adaptación para cuidados paliativos.'],
  tiempo: '1 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor estado funcional',
  textoEmpeoramiento: 'peor estado funcional',
  unidadCambio: '%',
  min: 10,
  max: 100,
  campos: [{ id: 'nivel', texto: 'Nivel que mejor describe a la persona', textoCorto: 'nivel', puntua: false, opciones: KPS.map(([n, d]) => ({ texto: `${n} %`, valor: n, detalle: d })) }],
  bandas: [
    { min: 80, max: 100, etiqueta: 'Capaz de actividad normal', nivel: 'bien', texto: 'Puede realizar su actividad normal y trabajar; no requiere cuidados especiales.', sugerencias: [] },
    { min: 50, max: 79, etiqueta: 'Incapaz de trabajar; vive en casa con ayuda variable', nivel: 'moderado', hallazgo: true, texto: 'Cuida de la mayoría de sus necesidades personales con ayuda variable.', sugerencias: ['Valorar necesidades de apoyo y cuidados en el domicilio.'] },
    { min: 10, max: 49, etiqueta: 'Incapaz de cuidar de sí mismo', nivel: 'grave', hallazgo: true, texto: 'Requiere cuidados equivalentes a los institucionales u hospitalarios; la enfermedad puede progresar rápidamente.', sugerencias: ['Planificación compartida de la atención y de las metas de cuidado; valorar cuidados paliativos.'] },
  ],
  calcular: ({ v }) => ({ valor: v.nivel.valor, mostrar: String(v.nivel.valor), sufijo: '%', unidad: '%' }),
  resumen: (res) => `Karnofsky: ${res.mostrar} % (${res.banda.etiqueta.toLowerCase()}).`,
  resumenBreve: (res) => `Karnofsky ${res.mostrar} %`,
  notas: ['Agrupaciones de la escala original: 80 a 100, 50 a 70 y 10 a 40 (0 corresponde al fallecimiento).'],
  licencia: { texto: 'Escala publicada por Karnofsky y Burchenal (1949); de dominio público.' },
  referencias: [
    { texto: 'Karnofsky DA, Burchenal JH. The clinical evaluation of chemotherapeutic agents in cancer. En: MacLeod CM, editor. Evaluation of chemotherapeutic agents. New York: Columbia University Press; 1949. p. 191-205.' },
  ],
};

/* ---------- Índice pronóstico paliativo (PPI) ---------- */

export const ppi = {
  id: 'ppi',
  nombre: 'Índice pronóstico paliativo (PPI)',
  corto: 'PPI',
  dominio: 'paliativos',
  tipo: 'pronostico',
  aliases: ['Palliative Prognostic Index', 'Morita', 'pronóstico de supervivencia', 'cuidados paliativos'],
  problemas: ['cuidados paliativos', 'pronóstico', 'final de la vida'],
  descripcion: 'PPS, ingesta oral, edema, disnea en reposo y delirium: 0 a 15 puntos, con estimación de supervivencia en semanas.',
  objetivo: 'Estimar la supervivencia a corto plazo (menos de 3 o de 6 semanas) para apoyar la planificación de cuidados.',
  poblacion: 'Personas con cáncer avanzado en cuidados paliativos (Morita, 1999). En otras enfermedades su validez es menor.',
  aplicacion: [
    'Usa la PPS de esta valoración si es de hoy, o asígnala con la tabla oficial.',
    'Delirium: no cuenta el causado solo por un fármaco.',
  ],
  tiempo: '2 min',
  direccionClinica: 'sin_direccion',
  decimalesCambio: 1,
  barra: false,
  min: 0,
  max: 15,
  vinculos: [
    {
      id: 'pps', escala: 'pps', titulo: 'PPS',
      disponible: (res) => (Number.isFinite(res.valor) ? true : 'La PPS guardada no tiene nivel.'),
      describir: (res) => `PPS ${res.valor} %`,
      aplicar: (res) => ({ pps: res.valor >= 60 ? 0 : res.valor >= 30 ? 1 : 2 }),
      campos: ['pps'],
    },
  ],
  campos: [
    { id: 'pps', texto: 'Escala de desempeño paliativo (PPS)', textoCorto: 'PPS', opciones: [{ texto: '60 % o más', valor: 0 }, { texto: '30 a 50 %', valor: 2.5 }, { texto: '10 a 20 %', valor: 4 }] },
    { id: 'ingesta', texto: 'Ingesta oral', textoCorto: 'ingesta oral', opciones: [{ texto: 'Normal', valor: 0 }, { texto: 'Moderadamente reducida (más que unos bocados)', valor: 1 }, { texto: 'Gravemente reducida (unos bocados o menos)', valor: 2.5 }] },
    { id: 'edema', texto: 'Edema', textoCorto: 'edema', opciones: [{ texto: 'Ausente', valor: 0 }, { texto: 'Presente', valor: 1 }] },
    { id: 'disnea', texto: 'Disnea en reposo', textoCorto: 'disnea en reposo', opciones: [{ texto: 'Ausente', valor: 0 }, { texto: 'Presente', valor: 3.5 }] },
    { id: 'delirium', texto: 'Delirium (no causado solo por un fármaco)', textoCorto: 'delirium', opciones: [{ texto: 'Ausente', valor: 0 }, { texto: 'Presente', valor: 4 }] },
  ],
  bandas: [
    { min: 0, max: 4, etiqueta: 'Supervivencia probable mayor de 6 semanas', nivel: 'leve', texto: 'PPI de 4 o menos.', sugerencias: [] },
    { min: 4.5, max: 6, etiqueta: 'Supervivencia probable menor de 6 semanas', nivel: 'grave', hallazgo: true, texto: 'PPI mayor de 4: predice supervivencia menor de 6 semanas (Morita, 1999).', sugerencias: ['Revisar metas de atención, preferencias y planificación anticipada con la persona y su familia.'] },
    { min: 6.5, max: 15, etiqueta: 'Supervivencia probable menor de 3 semanas', nivel: 'critico', hallazgo: true, texto: 'PPI mayor de 6: predice supervivencia menor de 3 semanas (Morita, 1999).', sugerencias: ['Priorizar el control de síntomas, el lugar de atención preferido y el apoyo a la familia.'] },
  ],
  calcular({ v }) {
    const puntaje = v.pps.valor + v.ingesta.valor + v.edema.valor + v.disnea.valor + v.delirium.valor;
    return { puntaje, mostrar: String(puntaje), sufijo: '/ 15' };
  },
  notas: [
    'Morita et al. (1999): PPI mayor de 6 predice supervivencia menor de 3 semanas (sensibilidad 80 %, especificidad 85 %); mayor de 4, menor de 6 semanas (sensibilidad 80 %, especificidad 77 %).',
    'Es una estimación poblacional: no predice con certeza la supervivencia individual; úsala para planificar, no para retirar cuidados.',
  ],
  licencia: { texto: 'Índice publicado por Morita et al. (1999); sin titular de licencias identificado.' },
  referencias: [
    { texto: 'Morita T, Tsunoda J, Inoue S, Chihara S. The Palliative Prognostic Index: a scoring system for survival prediction of terminally ill cancer patients. Support Care Cancer. 1999;7(3):128-33.', doi: '10.1007/s005200050242' },
  ],
};

/* ---------- Clasificación ASA ---------- */

const ASA = [
  ['I', 'Paciente sano', 'Sin enfermedad sistémica; no fuma; consumo de alcohol nulo o mínimo.', 'bien'],
  ['II', 'Enfermedad sistémica leve', 'Sin limitación funcional sustancial (p. ej., fumador, obesidad con IMC de 30 a 40, diabetes o hipertensión bien controladas, enfermedad pulmonar leve).', 'leve'],
  ['III', 'Enfermedad sistémica grave', 'Con limitación funcional sustancial (p. ej., diabetes o hipertensión mal controladas, EPOC, IMC de 40 o más, fracción de expulsión moderadamente reducida, diálisis programada, infarto, ictus o stent coronario de más de 3 meses).', 'moderado'],
  ['IV', 'Enfermedad sistémica grave que amenaza la vida de forma constante', 'P. ej., infarto, ictus o AIT recientes (menos de 3 meses), isquemia cardiaca activa, valvulopatía grave, fracción de expulsión muy reducida, sepsis o enfermedad renal terminal sin diálisis programada.', 'grave'],
  ['V', 'Moribundo', 'No se espera que sobreviva sin la operación.', 'critico'],
  ['VI', 'Muerte encefálica', 'Donante de órganos.', 'critico'],
];

export const asa = {
  id: 'asa',
  nombre: 'Clasificación del estado físico de la ASA',
  corto: 'ASA',
  dominio: 'prequirurgica',
  tipo: 'estadificacion',
  aliases: ['American Society of Anesthesiologists', 'estado físico', 'riesgo anestésico', 'preoperatorio'],
  problemas: ['valoración preoperatoria', 'riesgo quirúrgico', 'comorbilidad'],
  descripcion: 'Estado físico preoperatorio en 6 clases (I a VI), con «E» si la cirugía es de urgencia.',
  objetivo: 'Comunicar el estado físico general antes de la anestesia; no estima por sí sola el riesgo de la cirugía.',
  poblacion: 'Personas que recibirán anestesia o sedación.',
  aplicacion: ['Asigna la clase con el juicio clínico y la información completa; los ejemplos son orientativos (ASA, actualización de 2020).'],
  tiempo: '1 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  min: 1,
  max: 6,
  campos: [
    { id: 'clase', texto: 'Clase ASA', textoCorto: 'clase', puntua: false, opciones: ASA.map(([c, n, d], i) => ({ texto: `ASA ${c} · ${n}`, valor: i + 1, detalle: d })) },
    { id: 'urgencia', texto: '¿Cirugía de urgencia («E»)?', textoCorto: 'urgencia', puntua: false, opciones: [{ texto: 'No', valor: 0 }, { texto: 'Sí: el retraso aumentaría la amenaza para la vida o un órgano', valor: 1 }] },
  ],
  bandas: ASA.map(([c, n, d, nivel], i) => ({ min: i + 1, max: i + 1, rango: `ASA ${c}`, etiqueta: `ASA ${c}: ${n.toLowerCase()}`, nivel, hallazgo: i >= 2, texto: d, sugerencias: i >= 2 ? ['Integrar con la valoración geriátrica preoperatoria: fragilidad, cognición, funcionalidad, nutrición y riesgo de delirium.'] : [] })),
  calcular({ v }) {
    const c = ASA[v.clase.valor - 1][0];
    const e = v.urgencia.valor === 1 ? 'E' : '';
    return { valor: v.clase.valor, mostrar: `${c}${e}`, sufijo: 'ASA', unidad: '', extras: { clase: c, urgencia: Boolean(e) } };
  },
  resumen: (res) => `ASA ${res.mostrar} (${res.banda.etiqueta.replace(/^ASA [IV]+: /, '')}).`,
  resumenBreve: (res) => `ASA ${res.mostrar}`,
  notas: [
    'Definiciones resumidas de la ASA (actualización de diciembre de 2020); los ejemplos no sustituyen el juicio clínico.',
    'No incluye la edad ni la fragilidad: complétala con RCRI, ARISCAT y la valoración geriátrica.',
  ],
  licencia: { texto: 'ASA Physical Status Classification System © American Society of Anesthesiologists. Huella resume las definiciones con redacción propia.', enlace: 'https://www.asahq.org/standards-and-practice-parameters/statement-on-asa-physical-status-classification-system' },
  referencias: [
    { texto: 'American Society of Anesthesiologists. Statement on ASA Physical Status Classification System. Última modificación: 13 de diciembre de 2020.', enlace: 'https://www.asahq.org/standards-and-practice-parameters/statement-on-asa-physical-status-classification-system' },
  ],
};

/* ---------- Lubben LSNS-6 ---------- */

const RED = [
  { texto: 'Ninguno', valor: 0 }, { texto: 'Uno', valor: 1 }, { texto: 'Dos', valor: 2 },
  { texto: 'Tres o cuatro', valor: 3 }, { texto: 'Cinco a ocho', valor: 4 }, { texto: 'Nueve o más', valor: 5 },
];

export const lsns6 = {
  id: 'lsns6',
  nombre: 'Escala de red social de Lubben, versión abreviada (LSNS-6)',
  corto: 'Lubben LSNS-6',
  dominio: 'social',
  tipo: 'tamizaje',
  aliases: ['Lubben', 'red social', 'aislamiento social', 'apoyo social', 'LSNS'],
  problemas: ['aislamiento social', 'soledad', 'red de apoyo'],
  descripcion: 'Tamaño y cercanía de la red de familiares y de amigos: 6 preguntas de 0 a 5 (0 a 30).',
  objetivo: 'Identificar aislamiento social en personas mayores.',
  poblacion: 'Personas mayores en la comunidad (Lubben, 2006).',
  aplicacion: [
    'Familiares: incluye a los parientes por nacimiento, matrimonio o adopción. Amigos: incluye a los vecinos.',
    'Pregunta por el número de personas en cada caso.',
  ],
  tiempo: '2 a 3 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'red social más amplia',
  textoEmpeoramiento: 'red social más reducida',
  min: 0,
  max: 30,
  campos: [
    { id: 'fam_ve', texto: '¿Con cuántos familiares se ve o habla al menos una vez al mes?', textoCorto: 'familiares con contacto mensual', grupo: 'Familiares', opciones: RED },
    { id: 'fam_privado', texto: '¿Con cuántos familiares se siente con la confianza para hablar de asuntos personales?', textoCorto: 'familiares de confianza', opciones: RED },
    { id: 'fam_ayuda', texto: '¿A cuántos familiares se siente lo bastante cercano(a) como para pedirles ayuda?', textoCorto: 'familiares a quienes pedir ayuda', opciones: RED },
    { id: 'ami_ve', texto: '¿Con cuántos amigos se ve o habla al menos una vez al mes?', textoCorto: 'amigos con contacto mensual', grupo: 'Amigos', opciones: RED },
    { id: 'ami_privado', texto: '¿Con cuántos amigos se siente con la confianza para hablar de asuntos personales?', textoCorto: 'amigos de confianza', opciones: RED },
    { id: 'ami_ayuda', texto: '¿A cuántos amigos se siente lo bastante cercano(a) como para pedirles ayuda?', textoCorto: 'amigos a quienes pedir ayuda', opciones: RED },
  ],
  bandas: [
    { min: 0, max: 11, etiqueta: 'Riesgo de aislamiento social', nivel: 'moderado', hallazgo: true, texto: 'Puntaje menor de 12: riesgo de aislamiento social (Lubben, 2006).', sugerencias: ['Explorar soledad percibida, depresión y necesidades de apoyo; valorar recursos comunitarios y trabajo social.', SUG.cuidador] },
    { min: 12, max: 30, etiqueta: 'Sin aislamiento social', nivel: 'bien', texto: 'Puntaje de 12 o más.', sugerencias: [] },
  ],
  calcular({ v }) {
    const fam = v.fam_ve.valor + v.fam_privado.valor + v.fam_ayuda.valor;
    const ami = v.ami_ve.valor + v.ami_privado.valor + v.ami_ayuda.valor;
    const lineas = [`Familiares ${fam}/15 · amigos ${ami}/15.`];
    if (fam < 6) lineas.push('Subescala de familiares menor de 6: red familiar limitada.');
    if (ami < 6) lineas.push('Subescala de amigos menor de 6: red de amigos limitada.');
    return { puntaje: fam + ami, lineas, lineasNota: lineas, extras: { familiares: fam, amigos: ami } };
  },
  notas: [
    'Punto de corte: menos de 12 indica riesgo de aislamiento social; en cada subescala, menos de 6 indica una red limitada (Lubben, 2006).',
    'Mide la red social objetiva; la soledad percibida se valora aparte (escala de soledad de 3 reactivos).',
    'Traducción al español propia de Huella.',
  ],
  licencia: { texto: 'LSNS-6 © James Lubben. Traducción propia de Huella; conviene confirmar las condiciones de uso con el autor.' },
  referencias: [
    { texto: 'Lubben J, Blozik E, Gillmann G, et al. Performance of an abbreviated version of the Lubben Social Network Scale among three European community-dwelling older adult populations. Gerontologist. 2006;46(4):503-13.', doi: '10.1093/geront/46.4.503' },
  ],
};

/* ---------- Escala geriátrica de maltrato (registro por tipo) ---------- */

const TIPOS_MALTRATO = [
  ['fisico', 'Maltrato físico', 5],
  ['psicologico', 'Maltrato psicológico', 6],
  ['negligencia', 'Negligencia', 4],
  ['economico', 'Maltrato económico', 5],
  ['sexual', 'Maltrato sexual', 2],
];

export const maltrato = {
  id: 'maltrato',
  nombre: 'Escala geriátrica de maltrato (EGM)',
  corto: 'Maltrato (EGM)',
  dominio: 'social',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['maltrato', 'abuso', 'violencia', 'negligencia', 'Giraldo-Rodríguez', 'INCMNSZ', 'EGM'],
  problemas: ['maltrato', 'violencia', 'negligencia', 'abuso económico'],
  descripcion: 'Registro de las respuestas afirmativas de la escala oficial (22 reactivos, últimos 12 meses) por tipo de maltrato.',
  objetivo: 'Detectar maltrato físico, psicológico, negligencia, maltrato económico y sexual en personas mayores.',
  poblacion: 'Personas mayores mexicanas en la comunidad (Giraldo-Rodríguez y Rosas-Carrasco, 2013).',
  aplicacion: [
    'Aplica la escala oficial (Instituto Nacional de Ciencias Médicas y Nutrición Salvador Zubirán) en privado, sin la presencia del posible agresor ni de acompañantes.',
    'Registra cuántos reactivos de cada tipo respondió con «sí» en los últimos 12 meses. Huella no reproduce los reactivos.',
    'Si hay riesgo inmediato, prioriza la seguridad de la persona y activa el protocolo de tu institución.',
  ],
  tiempo: '5 a 10 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menos respuestas afirmativas',
  textoEmpeoramiento: 'más respuestas afirmativas',
  barra: false,
  min: 0,
  max: 22,
  campos: TIPOS_MALTRATO.map(([id, texto, max], i) => ({ id, tipo: 'numero', texto: `${texto}: reactivos con «sí» (de ${max})`, unidad: `de ${max}`, min: 0, max, entero: true, ...(i === 0 ? { grupo: 'Respuestas afirmativas por tipo' } : {}) })),
  bandas: [
    { min: 0, max: 0, etiqueta: 'Sin respuestas afirmativas', nivel: 'bien', texto: 'Ninguna respuesta afirmativa. No descarta el maltrato: si hay signos o sospecha, explora de nuevo en privado.', sugerencias: [] },
    {
      min: 1, max: 22, etiqueta: 'Posible maltrato', nivel: 'grave', hallazgo: true,
      texto: 'Al menos una respuesta afirmativa: posible maltrato que requiere una valoración clínica y social cuidadosa.',
      sugerencias: [
        'Evaluar en privado la seguridad inmediata, la frecuencia, quién lo ejerce y la capacidad de decisión de la persona.',
        'Documentar con detalle y activar el protocolo institucional y a trabajo social; conocer la obligación de aviso que aplique en tu entidad.',
        'Valorar sobrecarga del cuidador (Zarit) y redes de apoyo, sin exponer a la persona a represalias.',
      ],
    },
  ],
  calcular({ v }) {
    const conteo = Object.fromEntries(TIPOS_MALTRATO.map(([id]) => [id, v[id]]));
    const puntaje = Object.values(conteo).reduce((t, x) => t + x, 0);
    const tipos = TIPOS_MALTRATO.filter(([id]) => conteo[id] > 0).map(([, t]) => t.toLowerCase());
    const lineas = tipos.length ? [`Tipos con respuestas afirmativas: ${tipos.join(', ')}.`] : [];
    return { puntaje, mostrar: String(puntaje), sufijo: '/ 22 respuestas afirmativas', lineas, lineasNota: lineas, extras: { conteo, tipos } };
  },
  resumen: (res) => `Escala geriátrica de maltrato: ${res.puntaje} respuestas afirmativas (${res.banda.etiqueta.toLowerCase()})${res.extras.tipos.length ? `; ${res.extras.tipos.join(', ')}` : ''}.`,
  resumenBreve: (res) => `EGM ${res.puntaje}/22 (${res.banda.etiqueta.toLowerCase()})`,
  notas: [
    'Cada reactivo se califica 0 (no) o 1 (sí); la escala explora los últimos 12 meses.',
    'Información sensible: registra solo lo necesario y sin datos que identifiquen a la persona ni al posible agresor.',
  ],
  licencia: { texto: 'Escala de Giraldo-Rodríguez y Rosas-Carrasco (2013), publicada por el INCMNSZ. Huella no reproduce los reactivos; solo registra las respuestas afirmativas por tipo.', enlace: 'https://www.incmnsz.mx/investigacion/Escala_Geriatrica_de_Maltrato_al_Adulto_Mayor-F.pdf' },
  referencias: [
    { texto: 'Giraldo-Rodríguez L, Rosas-Carrasco O. Development and psychometric properties of the Geriatric Mistreatment Scale. Geriatr Gerontol Int. 2013;13(2):466-74.' },
  ],
};

/* ---------- VES-13 ---------- */

const DIFICULTAD = [
  { texto: 'Ninguna', valor: 0 }, { texto: 'Poca', valor: 0 }, { texto: 'Alguna', valor: 0 },
  { texto: 'Mucha', valor: 1 }, { texto: 'No puede hacerlo', valor: 1 },
];
const ACT_FISICAS = [
  ['agacharse', 'Agacharse, ponerse en cuclillas o arrodillarse'],
  ['cargar', 'Levantar o cargar objetos de unos 4.5 kg (10 libras)'],
  ['brazos', 'Elevar o extender los brazos por encima de los hombros'],
  ['escribir', 'Escribir, o manejar y sujetar objetos pequeños'],
  ['caminar', 'Caminar unos 400 metros'],
  ['pesado', 'Hacer trabajo pesado de la casa (tallar pisos, lavar ventanas)'],
];
const ACT_DISCAPACIDAD = [
  ['compras', 'Hacer las compras de artículos personales'],
  ['dinero', 'Manejar su dinero'],
  ['habitacion', 'Caminar dentro de la habitación'],
  ['ligero', 'Hacer trabajo ligero de la casa (lavar trastes, limpieza ligera)'],
  ['banarse', 'Bañarse en regadera o tina'],
];

export const ves13 = {
  id: 'ves13',
  nombre: 'Encuesta de personas mayores vulnerables (VES-13)',
  corto: 'VES-13',
  dominio: 'fragilidad',
  tipo: 'tamizaje',
  aliases: ['Vulnerable Elders Survey', 'vulnerabilidad', 'RAND', 'Saliba', 'oncogeriatría'],
  problemas: ['vulnerabilidad', 'fragilidad', 'riesgo de deterioro funcional', 'oncogeriatría'],
  descripcion: 'Edad, salud autopercibida, dificultad en 6 actividades físicas y necesidad de ayuda en 5 actividades: 0 a 10.',
  objetivo: 'Identificar personas mayores vulnerables, con mayor riesgo de muerte o deterioro funcional a 2 años.',
  poblacion: 'Personas de 65 años o más en la comunidad (Saliba, 2001); se usa también en oncogeriatría.',
  aplicacion: [
    'Autoaplicada o en entrevista. Las actividades se refieren a su estado habitual por motivos de salud.',
    'Necesidad de ayuda: marca «sí» si necesita ayuda o no la hace por su salud.',
  ],
  tiempo: '5 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor vulnerabilidad',
  textoEmpeoramiento: 'mayor vulnerabilidad',
  min: 0,
  max: 10,
  campos: [
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 65, max: 120, entero: true, prefill: 'edad' },
    { id: 'salud', texto: 'En general, ¿diría que su salud es…?', textoCorto: 'salud autopercibida', puntua: false, opciones: [{ texto: 'Excelente', valor: 0 }, { texto: 'Muy buena', valor: 0 }, { texto: 'Buena', valor: 0 }, { texto: 'Regular', valor: 1 }, { texto: 'Mala', valor: 1 }] },
    ...ACT_FISICAS.map(([id, texto], i) => ({ id, texto: `Dificultad para: ${texto.charAt(0).toLowerCase()}${texto.slice(1)}`, textoCorto: texto.toLowerCase(), puntua: false, compacto: true, opciones: DIFICULTAD, ...(i === 0 ? { grupo: 'Dificultad en actividades físicas (máximo 2 puntos)' } : {}) })),
    ...ACT_DISCAPACIDAD.map(([id, texto], i) => ({ id: `ayuda_${id}`, texto: `Por su salud, ¿necesita ayuda o no puede ${texto.charAt(0).toLowerCase()}${texto.slice(1)}?`, textoCorto: `ayuda para ${texto.toLowerCase()}`, puntua: false, compacto: true, opciones: SINO.map((o) => ({ ...o })), ...(i === 0 ? { grupo: 'Necesidad de ayuda (4 puntos si hay al menos una)' } : {}) })),
  ],
  bandas: [
    { min: 0, max: 2, etiqueta: 'No vulnerable', nivel: 'bien', texto: 'Puntaje menor de 3.', sugerencias: [] },
    { min: 3, max: 10, etiqueta: 'Persona mayor vulnerable', nivel: 'moderado', hallazgo: true, texto: 'Puntaje de 3 o más: riesgo de muerte o deterioro funcional a 2 años unas 4 veces mayor (Saliba, 2001).', sugerencias: ['Valoración geriátrica integral para identificar problemas tratables.', SUG.ejercicio] },
  ],
  calcular({ v }) {
    const pEdad = v.edad >= 85 ? 3 : v.edad >= 75 ? 1 : 0;
    const pSalud = v.salud.valor;
    const pFis = Math.min(2, ACT_FISICAS.reduce((t, [id]) => t + v[id].valor, 0));
    const ayuda = ACT_DISCAPACIDAD.filter(([id]) => v[`ayuda_${id}`].valor === 1);
    const pAyuda = ayuda.length ? 4 : 0;
    const lineas = [`Edad ${v.edad} años (${pEdad}); salud ${v.salud.texto.toLowerCase()} (${pSalud}); actividades físicas (${pFis}); necesidad de ayuda (${pAyuda}${ayuda.length ? `: ${ayuda.map(([, t]) => t.toLowerCase()).join(', ')}` : ''}).`];
    return { puntaje: pEdad + pSalud + pFis + pAyuda, lineas, lineasNota: lineas };
  },
  notas: [
    'Puntos (Saliba, 2001): edad 75 a 84, 1; 85 o más, 3. Salud regular o mala, 1. Cada actividad física con mucha dificultad o que no puede hacer, 1 (máximo 2). Necesidad de ayuda en cualquiera de las 5 actividades, 4.',
    'Punto de corte: 3 o más identifica a una persona mayor vulnerable.',
    'Traducción al español propia de Huella; no es una versión validada.',
  ],
  licencia: { texto: 'VES-13 © RAND Corporation. RAND permite el uso no comercial sin costo con reconocimiento y la cita de Saliba et al. (2001). Traducción propia de Huella.', enlace: 'https://www.rand.org/health-care/projects/acove/survey.html' },
  referencias: [
    { texto: 'Saliba D, Elliott M, Rubenstein LZ, et al. The Vulnerable Elders Survey: a tool for identifying vulnerable older people in the community. J Am Geriatr Soc. 2001;49(12):1691-9.', doi: '10.1046/j.1532-5415.2001.49281.x' },
  ],
};
