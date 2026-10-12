// Fase 6 (versión 2.5): instrumentos de la guía de instrumentos del INGER (2022) que faltaban en Huella.
// Escala Atenas de insomnio, ISAR-HP, HARP, SPPICEES, prueba del susurro, espacio de vida (LSA), recursos sociales OARS,
// inventario de recursos sociales de Díaz-Veiga y barreras del entorno físico y la movilidad.
// Los formatos de los anexos del INGER permiten reproducirse completos con fines educativos o asistenciales sin ánimo de
// lucro, citando al INGER; donde Huella no reproduce el formato, usa redacción propia.
import { SUG } from './_comun.js';

const GUIA = 'https://www.gob.mx/cms/uploads/attachment/file/813747/Guia_InstrumentosEvaluacion_2022_31oct.pdf';
const refInger = (anexo, nombre) => ({ texto: `Instituto Nacional de Geriatría. Guía de instrumentos de evaluación de la capacidad funcional. ${nombre} (anexo ${anexo}). Ciudad de México: INGER; 2022.`, enlace: GUIA });
const LIC_FORMATO = (anexo) => ({ texto: `Formato del anexo ${anexo} de la guía de instrumentos del INGER (2022), que permite reproducirlo completo con fines educativos o asistenciales sin ánimo de lucro citando al INGER.`, enlace: GUIA });
const minus = (t) => t.charAt(0).toLowerCase() + t.slice(1);
const SINO = (si = 1) => [{ texto: 'Sí', valor: si }, { texto: 'No', valor: 0 }];

/* ---------- Escala Atenas de insomnio ---------- */

const o4 = (a, b, c, d) => [{ texto: a, valor: 0 }, { texto: b, valor: 1 }, { texto: c, valor: 2 }, { texto: d, valor: 3 }];
const NO_DURMIO = 'Muy retrasado o no durmió en absoluto';

export const atenas = {
  id: 'atenas',
  nombre: 'Escala Atenas de insomnio',
  corto: 'Atenas',
  dominio: 'sueno',
  tipo: 'tamizaje',
  aliases: ['Athens Insomnia Scale', 'AIS', 'insomnio', 'calidad de sueño'],
  problemas: ['insomnio', 'trastornos del sueño', 'somnolencia diurna'],
  descripcion: '8 preguntas sobre el sueño y sus efectos durante el día, de 0 a 3 cada una (0 a 24); 8 o más indica problemas de insomnio.',
  objetivo: 'Detectar problemas de insomnio o de calidad del sueño en personas mayores.',
  poblacion: 'Personas mayores (Soldatos et al., 2000); incluida en la guía de instrumentos del INGER (2022).',
  aplicacion: [
    'Pregunta por su percepción del sueño; se considera el último mes si la persona no indica otro periodo.',
    'Cada pregunta va de 0 (ningún problema) a 3 (problema grave o no durmió en absoluto).',
  ],
  tiempo: '5 a 10 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menos problemas de sueño',
  textoEmpeoramiento: 'más problemas de sueño',
  min: 0,
  max: 24,
  campos: [
    { id: 'induccion', texto: 'Inducción del dormir (tiempo que le toma quedarse dormido una vez acostado)', textoCorto: 'inducción del dormir', opciones: o4('Ningún problema', 'Ligeramente retrasado', 'Marcadamente retrasado', NO_DURMIO) },
    { id: 'despertares', texto: 'Despertares durante la noche', textoCorto: 'despertares nocturnos', opciones: o4('Ningún problema', 'Problema menor', 'Problema considerable', 'Problema grave o no durmió en absoluto') },
    { id: 'temprano', texto: 'Despertar final más temprano de lo deseado', textoCorto: 'despertar temprano', opciones: o4('No más temprano', 'Un poco más temprano', 'Marcadamente más temprano', 'Mucho más temprano o no durmió en lo absoluto') },
    { id: 'duracion', texto: 'Duración total del dormir', textoCorto: 'duración del sueño', opciones: o4('Suficiente', 'Ligeramente insuficiente', 'Marcadamente insuficiente', 'Muy insuficiente o no durmió en lo absoluto') },
    { id: 'calidad', texto: 'Calidad general del dormir (no importa cuánto tiempo durmió usted)', textoCorto: 'calidad del sueño', opciones: o4('Satisfactoria', 'Ligeramente insatisfactoria', 'Marcadamente insatisfactoria', 'Muy insatisfactoria o no durmió en lo absoluto') },
    { id: 'bienestar', texto: 'Sensación de bienestar durante el día', textoCorto: 'bienestar diurno', opciones: o4('Normal', 'Ligeramente disminuida', 'Marcadamente disminuida', 'Muy disminuida') },
    { id: 'funcionamiento', texto: 'Funcionamiento (físico y mental) durante el día', textoCorto: 'funcionamiento diurno', opciones: o4('Normal', 'Ligeramente disminuido', 'Marcadamente disminuido', 'Muy disminuido') },
    { id: 'somnolencia', texto: 'Somnolencia durante el día', textoCorto: 'somnolencia diurna', opciones: o4('Ninguna', 'Leve', 'Considerable', 'Intensa') },
  ],
  bandas: [
    { min: 0, max: 7, etiqueta: 'Sin problemas de insomnio', nivel: 'bien', texto: '0 a 7 puntos.', sugerencias: [] },
    { min: 8, max: 24, etiqueta: 'Problemas de insomnio', nivel: 'moderado', hallazgo: true, texto: '8 puntos o más (guía del INGER).', sugerencias: ['Buscar causas y factores que contribuyen: dolor, nicturia, ánimo, fármacos, cafeína y hábitos de sueño (registro del sueño).', 'Preferir medidas no farmacológicas (higiene del sueño, terapia cognitivo-conductual para insomnio) y revisar hipnóticos y sedantes.'] },
  ],
  notas: [
    'Punto de corte de la guía del INGER (2022): 8 o más indica problemas de insomnio.',
    'En el formato del INGER, la última opción de «despertares durante la noche» repite por error «muy retrasado»; Huella usa «problema grave», como en la escala original.',
  ],
  licencia: LIC_FORMATO(8),
  referencias: [
    { texto: 'Soldatos CR, Dikeos DG, Paparrigopoulos TJ. Athens Insomnia Scale: validation of an instrument based on ICD-10 criteria. J Psychosom Res. 2000;48(6):555-60.', doi: '10.1016/S0022-3999(00)00095-7' },
    refInger(8, 'Escala Atenas de insomnio'),
  ],
};

/* ---------- ISAR-HP ---------- */

export const isarhp = {
  id: 'isarhp',
  nombre: 'Identificación de personas mayores hospitalizadas en riesgo (ISAR-HP)',
  corto: 'ISAR-HP',
  dominio: 'comorbilidad',
  tipo: 'tamizaje',
  aliases: ['Identification of Seniors At Risk Hospitalized Patients', 'ISAR', 'deterioro funcional hospitalario', 'riesgo funcional'],
  problemas: ['deterioro funcional', 'hospitalización', 'pérdida de autonomía'],
  descripcion: '4 preguntas sobre la situación antes del ingreso: riesgo de deterioro funcional durante la hospitalización y hasta 12 meses después (0 a 5).',
  objetivo: 'Detectar el riesgo de deterioro funcional durante la hospitalización en personas mayores.',
  poblacion: 'Personas mayores hospitalizadas (Hoogerduijn, 2012); recomendada en la guía de práctica clínica mexicana de rehabilitación temprana del adulto mayor hospitalizado.',
  aplicacion: [
    'Pregunta por la situación antes de la admisión hospitalaria; responde sí o no.',
  ],
  tiempo: '5 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor riesgo funcional',
  textoEmpeoramiento: 'mayor riesgo funcional',
  min: 0,
  max: 5,
  campos: [
    { id: 'aivd', texto: '¿Necesitaba regularmente ayuda para alguna de las actividades instrumentales de la vida diaria (uso de transporte, uso de teléfono, manejo de medicación, manejo de dinero, hacer compras, preparar alimentos, labores del hogar o lavar ropa)?', textoCorto: 'ayuda en actividades instrumentales', opciones: SINO(1) },
    { id: 'auxiliar', texto: '¿Necesitaba algún auxiliar para deambular (bastón, andadera, muletas)?', textoCorto: 'auxiliar para deambular', opciones: SINO(2) },
    { id: 'viaje', texto: '¿Necesitaba ayuda para salir de viaje?', textoCorto: 'ayuda para salir de viaje', opciones: SINO(1) },
    { id: 'educacion', texto: '¿Continuó su educación después de los 14 años de edad?', textoCorto: 'educación después de los 14 años', opciones: [{ texto: 'Sí', valor: 0 }, { texto: 'No', valor: 1 }] },
  ],
  bandas: [
    { min: 0, max: 1, etiqueta: 'Riesgo bajo de deterioro funcional', nivel: 'bien', texto: '0 a 1 punto.', sugerencias: [] },
    { min: 2, max: 3, etiqueta: 'Riesgo intermedio de deterioro funcional', nivel: 'leve', hallazgo: true, texto: '2 a 3 puntos.', sugerencias: ['Movilización temprana y prevención de complicaciones de la hospitalización (delirium, caídas, desnutrición).', SUG.rehabilitacion] },
    { min: 4, max: 5, etiqueta: 'Riesgo alto de deterioro funcional', nivel: 'moderado', hallazgo: true, texto: '4 a 5 puntos.', sugerencias: ['Rehabilitación temprana y movilización diaria; valorar atención geriátrica durante la hospitalización.', SUG.rehabilitacion] },
  ],
  notas: [
    'Categorías de la guía del INGER (2022): 0 a 1 bajo, 2 a 3 intermedio y 4 a 5 alto. En el estudio original, 2 o más identificó riesgo de deterioro funcional (valor predictivo positivo 43 %, negativo 85 %).',
  ],
  licencia: LIC_FORMATO(24),
  referencias: [
    { texto: 'Hoogerduijn JG, Buurman BM, Korevaar JC, Grobbee DE, de Rooij SE, Schuurmans MJ. The prediction of functional decline in older hospitalised patients. Age Ageing. 2012;41(3):381-7.', doi: '10.1093/ageing/afs015' },
    { texto: 'Asmus-Szepesi KJE, de Vreede PL, Flinterman LE, et al. Prognosis of hospitalised older people with different levels of functioning: a prospective cohort study. Age Ageing. 2013;42(6):803-9.', doi: '10.1093/ageing/aft126' },
    refInger(24, 'ISAR-HP'),
  ],
};

/* ---------- HARP ---------- */

const AIVD_HARP = [
  { id: 'telefono', texto: 'Usar el teléfono solo' },
  { id: 'compras', texto: 'Salir a hacer compras' },
  { id: 'alimentos', texto: 'Preparar alimentos' },
  { id: 'domesticas', texto: 'Tareas domésticas' },
  { id: 'transporte', texto: 'Usar transporte público' },
  { id: 'medicamentos', texto: 'Tomar solo los medicamentos' },
  { id: 'dinero', texto: 'Manejar dinero' },
];
const puntosEdadHarp = (e) => (e >= 85 ? 2 : e >= 76 ? 1 : 0);

export const harp = {
  id: 'harp',
  nombre: 'Perfil de riesgo a la admisión hospitalaria (HARP)',
  corto: 'HARP',
  dominio: 'comorbilidad',
  tipo: 'pronostico',
  aliases: ['Hospital Admission Risk Profile', 'pérdida de autonomía', 'deterioro funcional hospitalario'],
  problemas: ['deterioro funcional', 'hospitalización', 'pérdida de autonomía'],
  descripcion: 'Edad, actividades instrumentales previas y mini examen abreviado del estado mental: riesgo de perder autonomía al hospitalizarse (0 a 5).',
  objetivo: 'Predecir la pérdida de funcionalidad por una enfermedad aguda y la hospitalización.',
  poblacion: 'Personas mayores hospitalizadas por enfermedad médica aguda (Sager, 1996); estudiado en personas mayores mexicanas hospitalizadas (Dent, 2015).',
  aplicacion: [
    'Marca las actividades instrumentales que la persona hacía sola antes de la hospitalización.',
    'Aplica el mini examen abreviado del estado mental con el formato del anexo 25 del INGER (21 puntos) y registra el total.',
  ],
  tiempo: '10 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor riesgo de pérdida de autonomía',
  textoEmpeoramiento: 'mayor riesgo de pérdida de autonomía',
  min: 0,
  max: 5,
  campos: [
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 50, max: 120, entero: true, prefill: 'edad', ayuda: '60 a 75 años: 0; 76 a 84: 1; 85 o más: 2.' },
    { id: 'aivd', tipo: 'checklist', texto: 'Actividades que hacía sola antes de la hospitalización', textoCorto: 'actividades instrumentales previas', opciones: AIVD_HARP, ayuda: 'Si nunca preparó alimentos o hizo tareas domésticas, no se marcan (puntúan 0). 6 a 7 actividades: 0 puntos; 0 a 5: 2 puntos.' },
    { id: 'mental', tipo: 'numero', texto: 'Mini examen abreviado del estado mental: total (0 a 21)', unidad: 'puntos', min: 0, max: 21, entero: true, ayuda: '15 a 21: 0 puntos; 0 a 14: 1 punto.' },
  ],
  bandas: [
    { min: 0, max: 1, etiqueta: 'Riesgo bajo de pérdida de autonomía', nivel: 'bien', texto: '0 a 1 punto.', sugerencias: [] },
    { min: 2, max: 3, etiqueta: 'Riesgo intermedio de pérdida de autonomía', nivel: 'leve', hallazgo: true, texto: '2 a 3 puntos.', sugerencias: ['Movilización temprana, prevención de delirium y revisión de la funcionalidad al egreso.'] },
    { min: 4, max: 5, etiqueta: 'Riesgo alto de pérdida de autonomía', nivel: 'moderado', hallazgo: true, texto: '4 a 5 puntos.', sugerencias: ['Valoración geriátrica y rehabilitación temprana durante la hospitalización; planear el egreso con apoyos.', SUG.rehabilitacion] },
  ],
  calcular({ v }) {
    const n = (v.aivd || []).length;
    const pe = puntosEdadHarp(v.edad);
    const pa = n >= 6 ? 0 : 2;
    const pm = v.mental >= 15 ? 0 : 1;
    const puntaje = pe + pa + pm;
    const lineas = [`Edad ${v.edad} años (${pe}); actividades instrumentales previas ${n}/7 (${pa}); mini examen abreviado ${v.mental}/21 (${pm}).`];
    return { puntaje, lineas, lineasNota: lineas, extras: { aivd: n } };
  },
  notas: [
    'Puntos: edad 60 a 75 años 0, 76 a 84 1, 85 o más 2; actividades instrumentales 6 a 7 = 0 y 0 a 5 = 2; mini examen abreviado 15 a 21 = 0 y 0 a 14 = 1. Riesgo: 0 a 1 bajo, 2 a 3 intermedio y 4 a 5 alto.',
    'El mini examen abreviado contiene reactivos del MMSE; Huella registra solo su total.',
  ],
  licencia: { texto: 'HARP publicado por Sager et al. (1996); formato del anexo 25 de la guía del INGER (2022). Huella registra las actividades, la edad y el total del examen abreviado, sin reproducir sus reactivos.', enlace: GUIA },
  referencias: [
    { texto: 'Sager MA, Rudberg MA, Jalaluddin M, et al. Hospital admission risk profile (HARP): identifying older patients at risk for functional decline following acute medical illness and hospitalization. J Am Geriatr Soc. 1996;44(3):251-7.', doi: '10.1111/j.1532-5415.1996.tb00910.x' },
    { texto: 'Dent E, Perez-Zepeda MU. Comparison of five indices for prediction of adverse outcomes in hospitalised Mexican older adults: a cohort study. Arch Gerontol Geriatr. 2015;60(1):89-95.', enlace: 'https://pubmed.ncbi.nlm.nih.gov/25307954/' },
    refInger(25, 'HARP'),
  ],
};

/* ---------- SPPICEES ---------- */

const PROBLEMAS_SPPICEES = [
  ['piel', 'S = Integridad de la piel (Skin). Existe riesgo de úlceras por presión.', 'riesgo de lesiones por presión', 'Valorar el riesgo con Braden o Norton y aplicar medidas de prevención.'],
  ['nutricion', 'P = Problemas con la nutrición. En los últimos 6 meses ha perdido una talla o 2 kg de peso sin conocer la causa, o está muy enferma y es probable que esté en ayuno por más de 5 días.', 'problemas de nutrición', 'Tamizaje nutricional (MNA-SF) y plan de alimentación.'],
  ['dolor', 'P = Dolor (Pain). Presenta dolor que le impide realizar actividades de la vida diaria.', 'dolor que limita actividades', 'Evaluar la intensidad del dolor (escala numérica o PAINAD) y tratarlo.'],
  ['inmovilidad', 'I = Inmovilidad. Tiene dificultad para desplazarse y realizar sus actividades.', 'inmovilidad', 'Valorar movilidad y funcionalidad (Barthel, TUG) e iniciar movilización temprana.'],
  ['confusion', 'C = Confusión. Ha tenido cambios de conducta y desorientación, o se observan apatía, tristeza o desinterés.', 'confusión o cambios de conducta', 'Descartar delirium (4AT o CAM) y explorar síntomas depresivos.'],
  ['eliminacion', 'E = Eliminación. Ha tenido salida de orina o heces sin poder evitarlo.', 'incontinencia', 'Evaluar síntomas urinarios e intestinales y causas reversibles.'],
];

export const sppicees = {
  id: 'sppicees',
  nombre: 'Instrumento para la detección de síndromes geriátricos (SPPICEES)',
  corto: 'SPPICEES',
  dominio: 'comorbilidad',
  tipo: 'lista',
  aliases: ['SPICES', 'síndromes geriátricos', 'Fulmer', 'tamizaje de enfermería'],
  problemas: ['síndromes geriátricos', 'lesiones por presión', 'desnutrición', 'dolor', 'inmovilidad', 'delirium', 'incontinencia', 'insomnio'],
  descripcion: '8 problemas geriátricos (piel, nutrición, dolor, inmovilidad, confusión, eliminación, apoyo social y sueño): cada respuesta positiva indica intervenir y evaluar a fondo.',
  objetivo: 'Detectar el riesgo de desarrollar síndromes geriátricos, sobre todo en la hospitalización.',
  poblacion: 'Personas mayores en cualquier ámbito; puede responderlo la persona o su cuidador (adaptación de SPICES, Fulmer).',
  aplicacion: [
    'Pregunta cada problema y responde sí o no según la percepción de la persona o del cuidador.',
    'No da un puntaje: cada problema presente pide una intervención inmediata y una evaluación más completa de esa área.',
  ],
  tiempo: '10 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menos problemas geriátricos',
  textoEmpeoramiento: 'más problemas geriátricos',
  barra: false,
  min: 0,
  max: 8,
  campos: [
    ...PROBLEMAS_SPPICEES.map(([id, texto, corto]) => ({ id, texto, textoCorto: corto, opciones: SINO(1) })),
    { id: 'apoyo', texto: 'E = Apoyo social (Elderly support). ¿Cuenta con cuidador primario?', textoCorto: 'cuidador primario', opciones: [{ texto: 'Sí', valor: 0 }, { texto: 'No', valor: 1 }], ayuda: 'Se considera problema cuando no cuenta con cuidador primario.' },
    { id: 'sueno', texto: 'S = Trastornos del sueño (Sleep). Tiene problemas para dormir.', textoCorto: 'problemas para dormir', opciones: SINO(1) },
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'Sin problemas geriátricos detectados', nivel: 'bien', texto: 'Ningún problema presente.', sugerencias: [] },
    { min: 1, max: 2, etiqueta: 'Problemas geriátricos presentes', nivel: 'leve', hallazgo: true, texto: '1 o 2 problemas: intervenir y evaluar cada área.', sugerencias: [] },
    { min: 3, max: 8, etiqueta: 'Varios problemas geriátricos', nivel: 'moderado', hallazgo: true, texto: '3 o más problemas: intervenir y evaluar cada área; considerar valoración geriátrica integral.', sugerencias: [] },
  ],
  calcular({ v }) {
    const presentes = [];
    const sugerencias = [];
    for (const [id, , corto, sug] of PROBLEMAS_SPPICEES) if (v[id].valor) { presentes.push(corto); sugerencias.push(sug); }
    if (v.apoyo.valor) { presentes.push('sin cuidador primario'); sugerencias.push('Identificar quién puede apoyar en el cuidado y los recursos sociales disponibles (OARS, Gijón).'); }
    if (v.sueno.valor) { presentes.push('problemas para dormir'); sugerencias.push('Evaluar el sueño (escala Atenas o registro del sueño).'); }
    const puntaje = presentes.length;
    const banda = { ...sppicees.bandas.find((b) => puntaje >= b.min && puntaje <= b.max) };
    banda.sugerencias = sugerencias;
    const lineas = presentes.length ? [`Problemas presentes: ${presentes.join(', ')}.`] : [];
    return { puntaje, banda, lineas, lineasNota: lineas, extras: { presentes } };
  },
  resumen: (res) => (res.extras.presentes.length ? `SPPICEES: ${res.extras.presentes.length} problemas (${res.extras.presentes.join(', ')}).` : 'SPPICEES: sin problemas geriátricos detectados.'),
  resumenBreve: (res) => `SPPICEES ${res.puntaje}/8`,
  notas: [
    'No tiene punto de corte: cualquier respuesta positiva indica intervenir y evaluar el área (guía del INGER). El número de problemas solo resume.',
  ],
  licencia: { ...LIC_FORMATO(26), texto: `${LIC_FORMATO(26).texto} Adaptación de SPICES (Fulmer).` },
  referencias: [
    { texto: 'Fulmer T. SPICES: an overall assessment tool for older adults. Try This: Best Practices in Nursing Care to Older Adults. Hartford Institute for Geriatric Nursing; 2019.', enlace: 'https://hign.org/consultgeri/try-this-series' },
    refInger(26, 'SPPICEES'),
  ],
};

/* ---------- Prueba del susurro ---------- */

const OIDO = [{ texto: 'Repite correctamente la combinación', valor: 0 }, { texto: 'No repite correctamente dos combinaciones', valor: 1 }];

export const susurro = {
  id: 'susurro',
  nombre: 'Prueba del susurro (agudeza auditiva)',
  corto: 'Prueba del susurro',
  dominio: 'sensorial',
  tipo: 'tamizaje',
  aliases: ['voz susurrada', 'whispered voice test', 'audición', 'hipoacusia'],
  problemas: ['pérdida auditiva', 'hipoacusia'],
  descripcion: 'Combinaciones de 3 números o letras susurradas por detrás, en cada oído: positiva si no las repite.',
  objetivo: 'Detectar déficit auditivo de forma sencilla y sin equipo.',
  poblacion: 'Adultos y personas mayores (Pirozzo, 2003); incluida en la guía de instrumentos del INGER (2022).',
  aplicacion: [
    'En un lugar sin ruido, con la persona sentada, colócate a un brazo de distancia (unos 60 cm) por detrás para que no lea los labios.',
    'Evalúa cada oído por separado, empezando por el que oye mejor; ocluye suavemente el otro.',
    'Exhala en silencio y susurra una combinación de 3 números o letras (por ejemplo, 7-6-A); pide que la repita. Si falla, usa otra combinación distinta. Usa combinaciones diferentes en cada oído.',
  ],
  tiempo: '5 a 10 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'mejor audición',
  textoEmpeoramiento: 'peor audición',
  barra: false,
  min: 0,
  max: 2,
  campos: [
    { id: 'derecho', texto: 'Oído derecho', textoCorto: 'oído derecho', opciones: OIDO },
    { id: 'izquierdo', texto: 'Oído izquierdo', textoCorto: 'oído izquierdo', opciones: OIDO },
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'Prueba negativa', nivel: 'bien', texto: 'Repite las combinaciones con ambos oídos.', sugerencias: [] },
    { min: 1, max: 2, etiqueta: 'Prueba positiva: probable déficit auditivo', nivel: 'moderado', hallazgo: true, texto: 'No repite las combinaciones con al menos un oído.', sugerencias: ['Revisar el conducto auditivo (tapón de cerumen) y referir a audiometría.', 'Valorar el uso de auxiliares auditivos y su efecto en la comunicación y la cognición.'] },
  ],
  calcular({ v }) {
    const pos = [v.derecho.valor ? 'derecho' : null, v.izquierdo.valor ? 'izquierdo' : null].filter(Boolean);
    const lineas = pos.length ? [`Positiva en el oído ${pos.join(' y ')}.`] : [];
    return { puntaje: pos.length, lineas, lineasNota: lineas };
  },
  resumen: (res) => `Prueba del susurro: ${minus(res.banda.etiqueta)}${res.lineas[0] ? ` (${res.lineas[0].replace(/\.$/, '').toLowerCase()})` : ''}.`,
  resumenBreve: (res) => `Susurro ${res.puntaje ? 'positiva' : 'negativa'}`,
  notas: [
    'No hay una combinación estandarizada de números y letras. En la revisión sistemática de Pirozzo (2003), la prueba tuvo buena sensibilidad y especificidad para detectar pérdida auditiva.',
  ],
  licencia: { texto: 'Prueba clínica sin titular de derechos; procedimiento de la guía de instrumentos del INGER (2022).', enlace: GUIA },
  referencias: [
    { texto: 'Pirozzo S, Papinczak T, Glasziou P. Whispered voice test for screening for hearing impairment in adults and children: systematic review. BMJ. 2003;327(7421):967.', doi: '10.1136/bmj.327.7421.967' },
    refInger(32, 'Prueba del susurro'),
  ],
};

/* ---------- Evaluación del espacio de vida (LSA) ---------- */

const NIVELES_LSA = [
  [1, 'Otras habitaciones de su casa, además de donde duerme'],
  [2, 'Un área fuera de su casa (terraza, patio, pasillo del edificio, garaje o entrada)'],
  [3, 'Lugares de su vecindario, fuera de su casa o patio'],
  [4, 'Lugares fuera de su vecindario, pero dentro de su ciudad'],
  [5, 'Lugares fuera de su ciudad'],
];
const FRECUENCIA_LSA = [
  { texto: 'Menos de 1 vez por semana', valor: 1 },
  { texto: '1 a 3 veces por semana', valor: 2 },
  { texto: '4 a 6 veces por semana', valor: 3 },
  { texto: 'Diario', valor: 4 },
];
const INDEPENDENCIA_LSA = [
  { texto: 'Con ayuda de otra persona', valor: 1 },
  { texto: 'Solo con un dispositivo de ayuda', valor: 1.5 },
  { texto: 'Sin ningún apoyo', valor: 2 },
];
const BL = {
  abvd: { id: 'abvd', rango: 'Menos de 20', etiqueta: 'Espacio de vida muy restringido', nivel: 'grave', hallazgo: true, texto: 'Menos de 20: probable riesgo de perder independencia en las actividades básicas de la vida diaria.', sugerencias: [SUG.rehabilitacion, SUG.caidas] },
  aivd: { id: 'aivd', rango: '20 a menos de 56', etiqueta: 'Espacio de vida restringido', nivel: 'moderado', hallazgo: true, texto: 'Menos de 56: probable riesgo de perder independencia en las actividades instrumentales de la vida diaria.', sugerencias: ['Identificar barreras para salir (miedo a caer, transporte, entorno) y promover la movilidad fuera del domicilio.', SUG.ejercicio] },
  sin: { id: 'sin', rango: '56 o más', etiqueta: 'Espacio de vida conservado', nivel: 'bien', texto: '56 o más.', sugerencias: [] },
};
const nivelLsa = ([n, texto]) => [
  { id: `n${n}`, texto: `Nivel ${n}: ${texto}`, textoCorto: `nivel ${n}`, puntua: false, ...(n === 1 ? { grupo: 'En las últimas 4 semanas, ¿ha estado en…?' } : {}), opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }] },
  { id: `f${n}`, texto: `Nivel ${n}: ¿con qué frecuencia?`, textoCorto: `frecuencia nivel ${n}`, puntua: false, visibleSi: (r) => r[`n${n}`] === 0, opciones: FRECUENCIA_LSA },
  { id: `i${n}`, texto: `Nivel ${n}: ¿cómo lo hace?`, textoCorto: `independencia nivel ${n}`, puntua: false, visibleSi: (r) => r[`n${n}`] === 0, opciones: INDEPENDENCIA_LSA },
];

export const lsa = {
  id: 'lsa',
  nombre: 'Evaluación del espacio de vida (LSA)',
  corto: 'Espacio de vida (LSA)',
  dominio: 'caidas',
  tipo: 'evaluacion',
  aliases: ['Life-Space Assessment', 'movilidad en el entorno', 'espacio vital', 'UAB'],
  problemas: ['movilidad', 'aislamiento', 'pérdida de independencia', 'fragilidad'],
  descripcion: 'Hasta dónde se mueve la persona en las últimas 4 semanas, con qué frecuencia y con cuánta ayuda: 0 a 120.',
  objetivo: 'Evaluar la movilidad en los espacios del entorno de la persona mayor.',
  poblacion: 'Personas mayores en la comunidad (Baker, 2003); incluida en la guía de instrumentos del INGER (2022).',
  aplicacion: [
    'Para cada nivel pregunta si estuvo ahí en las últimas 4 semanas; si sí, con qué frecuencia y si necesitó un dispositivo o a otra persona.',
    'Cada nivel puntúa: número del nivel × frecuencia × independencia. Huella suma los cinco.',
  ],
  tiempo: '5 a 10 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mayor espacio de vida',
  textoEmpeoramiento: 'menor espacio de vida',
  barra: false,
  min: 0,
  max: 120,
  campos: NIVELES_LSA.flatMap(nivelLsa),
  bandas: [BL.abvd, BL.aivd, BL.sin],
  calcular({ v }) {
    let puntaje = 0;
    const partes = [];
    let maximo = 0;
    for (const [n] of NIVELES_LSA) {
      if (v[`n${n}`].valor !== 1) continue;
      const pts = n * v[`f${n}`].valor * v[`i${n}`].valor;
      puntaje += pts;
      maximo = n;
      partes.push(`nivel ${n}: ${pts}`);
    }
    const banda = puntaje < 20 ? BL.abvd : puntaje < 56 ? BL.aivd : BL.sin;
    const lineas = [partes.length ? `Puntos por nivel: ${partes.join(', ')}.` : 'No salió de la habitación donde duerme en las últimas 4 semanas.'];
    if (maximo) lineas.push(`Nivel más lejano alcanzado: ${maximo} de 5.`);
    return { puntaje, mostrar: String(puntaje), banda, lineas, lineasNota: lineas, extras: { nivelMaximo: maximo } };
  },
  notas: [
    'Puntos de corte propuestos en la guía del INGER (2022): menos de 56 predice disminución de la independencia en actividades instrumentales y menos de 20, en actividades básicas; se requieren más estudios de validación.',
    'Independencia: 1 con ayuda de otra persona, 1.5 solo con un dispositivo de ayuda y 2 sin ningún apoyo. Frecuencia: 1 (menos de una vez por semana, como en la escala original; el formato del INGER dice «1 vez a la semana») a 4 (diario).',
  ],
  licencia: { texto: 'Life-Space Assessment (Baker, Bodner y Allman, 2003; University of Alabama at Birmingham). Formato del anexo 40 de la guía del INGER (2022); preguntas resumidas con redacción propia.', enlace: GUIA },
  referencias: [
    { texto: 'Baker PS, Bodner EV, Allman RM. Measuring life-space mobility in community-dwelling older adults. J Am Geriatr Soc. 2003;51(11):1610-4.', doi: '10.1046/j.1532-5415.2003.51512.x' },
    refInger(40, 'Evaluación del espacio de vida (LSA)'),
  ],
};

/* ---------- OARS: escala de recursos sociales ---------- */

const CATEGORIAS_OARS = [
  ['Excelentes recursos sociales', 'Relaciones muy satisfactorias y amplias; al menos una persona la cuidaría indefinidamente.', 'bien'],
  ['Buenos recursos sociales', 'Relaciones satisfactorias y adecuadas; alguien la cuidaría indefinidamente o habría ayuda a corto plazo.', 'bien'],
  ['Recursos sociales ligeramente deteriorados', 'Relaciones insatisfactorias o escasas, pero alguien la cuidaría indefinidamente o habría ayuda a corto plazo.', 'leve'],
  ['Recursos sociales moderadamente deteriorados', 'Relaciones insatisfactorias y escasas; solo habría ayuda a corto plazo o de vez en cuando.', 'moderado'],
  ['Recursos sociales bastante deteriorados', 'Relaciones muy insatisfactorias; nadie en quien confiar; solo ayuda ocasional.', 'grave'],
  ['Recursos sociales totalmente deteriorados', 'Relaciones muy insatisfactorias, sin contactos y sin posibilidad de ayuda ni siquiera de vez en cuando.', 'critico'],
];

export const oars = {
  id: 'oars',
  nombre: 'Escala de recursos sociales OARS',
  corto: 'Recursos sociales OARS',
  dominio: 'social',
  tipo: 'evaluacion',
  registro: true,
  aliases: ['Older Americans Resources and Services', 'OARS', 'recursos sociales', 'red de apoyo'],
  problemas: ['apoyo social', 'aislamiento', 'red de apoyo', 'cuidador'],
  descripcion: 'Clasificación de los recursos sociales en 6 categorías, de excelentes a totalmente deteriorados, a partir de las 13 preguntas del cuestionario.',
  objetivo: 'Identificar los recursos sociales con los que cuenta la persona mayor: familia, amistades, visitas y disponibilidad de ayuda.',
  poblacion: 'Personas mayores (Fillenbaum, 1981); incluida en la guía de instrumentos del INGER (2022).',
  aplicacion: [
    'Aplica las 13 preguntas con el formato oficial (anexo 37 de la guía del INGER).',
    'Elige la categoría que mejor se aproxima a su situación; la pregunta 13 (satisfacción con sus relaciones) es clave para decidirla.',
  ],
  tiempo: '10 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'mejores recursos sociales',
  textoEmpeoramiento: 'recursos sociales más deteriorados',
  barra: false,
  min: 1,
  max: 6,
  campos: [
    { id: 'categoria', texto: 'Categoría de recursos sociales', textoCorto: 'categoría', puntua: false, opciones: CATEGORIAS_OARS.map(([t, d], i) => ({ texto: `${i + 1} · ${t}`, valor: i + 1, detalle: d })) },
  ],
  bandas: CATEGORIAS_OARS.map(([t, d, nivel], i) => ({
    min: i + 1, max: i + 1, rango: String(i + 1), etiqueta: t, nivel, hallazgo: i >= 2, texto: d,
    sugerencias: i >= 2 ? ['Identificar apoyos disponibles y necesidades de cuidado; considerar referencia a Trabajo Social.', SUG.cuidador] : [],
  })),
  calcular: ({ v }) => ({ valor: v.categoria.valor, mostrar: String(v.categoria.valor), sufijo: 'de 6', unidad: '' }),
  resumen: (res) => `Recursos sociales OARS: categoría ${res.mostrar} (${minus(res.banda.etiqueta)}).`,
  resumenBreve: (res) => `OARS ${res.mostrar}/6`,
  notas: [
    'Categorías resumidas con redacción propia a partir de la guía del INGER (2022); consulta el formato para los criterios completos (número de personas, frecuencia de contactos y disponibilidad de ayuda).',
  ],
  licencia: { texto: 'OARS Social Resources Scale (Duke University). Huella registra la categoría y no reproduce las preguntas; formato en el anexo 37 de la guía del INGER (2022).', enlace: GUIA },
  referencias: [
    { texto: 'Fillenbaum GG, Smyer MA. The development, validity, and reliability of the OARS multidimensional functional assessment questionnaire. J Gerontol. 1981;36(4):428-34.', doi: '10.1093/geronj/36.4.428' },
    refInger(37, 'Escala de recursos sociales OARS'),
  ],
};

/* ---------- Inventario de recursos sociales de Díaz-Veiga ---------- */

const PERSONAS_DV = [['conyuge', 'Cónyuge'], ['hijos', 'Hijos'], ['familiares', 'Familiares próximos'], ['amigos', 'Amigos']];
const FRECUENCIA_DV = [
  { texto: 'No tiene o no aplica', valor: 0 },
  { texto: 'Menos de una vez al mes', valor: 1 },
  { texto: '1 o 2 veces al mes', valor: 2 },
  { texto: '1 vez a la semana o más', valor: 3 },
];
const APOYOS_DV = [{ id: 'emocional', texto: 'Apoyo emocional' }, { id: 'instrumental', texto: 'Apoyo instrumental' }];
const SATISFACCION_DV = [{ texto: 'Poco', valor: 1 }, { texto: 'Algo', valor: 2 }, { texto: 'Mucho', valor: 3 }];

export const diazveiga = {
  id: 'diazveiga',
  nombre: 'Inventario de recursos sociales de Díaz-Veiga',
  corto: 'Díaz-Veiga',
  dominio: 'social',
  tipo: 'lista',
  aliases: ['recursos sociales', 'red social', 'apoyo emocional', 'apoyo instrumental'],
  problemas: ['apoyo social', 'red de apoyo', 'aislamiento'],
  descripcion: 'Frecuencia de contacto, tipo de apoyo y satisfacción con cónyuge, hijos, familiares próximos y amigos. Descriptivo, sin puntaje.',
  objetivo: 'Identificar la frecuencia, los tipos de apoyo y la satisfacción con el apoyo que recibe la persona de su entorno inmediato.',
  poblacion: 'Personas mayores; incluido en la guía de instrumentos del INGER (2022).',
  aplicacion: [
    'Para cada grupo pregunta con qué frecuencia lo ve o habla con él, qué tipo de apoyo recibe y qué tan satisfecha está.',
  ],
  tiempo: '10 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  min: 0,
  max: 4,
  campos: PERSONAS_DV.flatMap(([id, nombre], i) => [
    { id: `${id}_f`, texto: `${nombre}: frecuencia de contacto`, textoCorto: `contacto con ${nombre.toLowerCase()}`, puntua: false, ...(i === 0 ? { grupo: 'Frecuencia, apoyo y satisfacción' } : {}), opciones: FRECUENCIA_DV },
    { id: `${id}_a`, tipo: 'checklist', texto: `${nombre}: tipo de apoyo que recibe`, textoCorto: `apoyo de ${nombre.toLowerCase()}`, visibleSi: (r) => r[`${id}_f`] != null && r[`${id}_f`] !== '' && Number(r[`${id}_f`]) > 0, opciones: APOYOS_DV },
    { id: `${id}_s`, texto: `${nombre}: satisfacción`, textoCorto: `satisfacción con ${nombre.toLowerCase()}`, puntua: false, visibleSi: (r) => r[`${id}_f`] != null && r[`${id}_f`] !== '' && Number(r[`${id}_f`]) > 0, opciones: SATISFACCION_DV },
  ]),
  bandas: [
    { min: 0, max: 0, etiqueta: 'Sin fuentes de apoyo registradas', nivel: 'moderado', hallazgo: true, texto: 'No refiere contacto con cónyuge, hijos, familiares ni amigos.', sugerencias: ['Explorar aislamiento social (LSNS-6) y apoyos comunitarios; considerar referencia a Trabajo Social.'] },
    { min: 1, max: 4, etiqueta: 'Descripción de la red de apoyo', nivel: 'neutro', texto: 'Inventario descriptivo: revisa quién da apoyo, de qué tipo y con qué satisfacción.', sugerencias: [] },
  ],
  calcular({ v }) {
    const lineas = [];
    let fuentes = 0;
    const pocos = [];
    for (const [id, nombre] of PERSONAS_DV) {
      const f = v[`${id}_f`];
      if (!f.valor) continue;
      fuentes += 1;
      const apoyos = (v[`${id}_a`] || []).map((a) => APOYOS_DV.find((x) => x.id === a).texto.replace('Apoyo ', ''));
      const sat = v[`${id}_s`];
      lineas.push(`${nombre}: ${minus(f.texto)}; apoyo ${apoyos.length ? apoyos.join(' e ') : 'ninguno'}; satisfacción ${minus(sat.texto)}.`);
      if (sat.valor === 1) pocos.push(nombre.toLowerCase());
    }
    if (pocos.length) lineas.push(`Poca satisfacción con: ${pocos.join(', ')}.`);
    return { puntaje: fuentes, mostrar: String(fuentes), sufijo: 'fuentes de apoyo', lineas, lineasNota: lineas, extras: { fuentes } };
  },
  resumen: (res) => (res.lineas.length ? `Recursos sociales (Díaz-Veiga): ${res.lineas.join(' ')}` : 'Recursos sociales (Díaz-Veiga): sin fuentes de apoyo registradas.'),
  resumenBreve: (res) => `Díaz-Veiga: ${res.puntaje} fuentes de apoyo`,
  detalleEnResumen: true,
  notas: [
    'Es descriptivo: identifica qué personas son próximas, qué apoyo dan y la satisfacción con ese apoyo (guía del INGER, 2022). El número de fuentes solo resume.',
  ],
  licencia: { texto: 'Inventario de Díaz-Veiga; formato del anexo 38 de la guía del INGER (2022). Preguntas resumidas con redacción propia.', enlace: GUIA },
  referencias: [refInger(38, 'Inventario de recursos sociales en personas mayores de Díaz-Veiga')],
};

/* ---------- Barreras del entorno físico y la movilidad ---------- */

const AREAS_BARRERAS = [
  ['domicilio', 'Dentro del domicilio', [['espacio', 'Espacio insuficiente para moverse libremente'], ['adaptada', 'Vivienda no adaptada a su condición (superficies, pasillos, cocina)'], ['cambio', 'No puede adaptar la vivienda ni cambiarse a una mejor adaptada']]],
  ['exterior', 'Fuera del domicilio', [['aceras', 'Aceras con obstrucciones o sin mantenimiento'], ['camino', 'Camino peatonal obstruido'], ['edificios', 'Edificios públicos que visita no accesibles'], ['transito', 'No se respetan las reglas de tránsito']]],
  ['transporte', 'Transporte', [['rutas', 'Rutas inadecuadas para sus necesidades'], ['vehiculos', 'Vehículos no accesibles para su condición'], ['costo', 'Transporte público caro'], ['confiable', 'Transporte poco confiable o poco frecuente'], ['paradas', 'Paradas inadecuadas o conductores que manejan mal']]],
  ['auxiliares', 'Dispositivos auxiliares', [['prescripcion', 'Los necesita y no se los han prescrito'], ['dispone', 'Prescritos, pero no dispone de ellos'], ['acceso', 'Sin acceso gratuito ni apoyo para obtenerlos']]],
  ['actividad', 'Actividad física', [['promueve', 'En su comunidad no se promueve la actividad física'], ['instalaciones', 'Las instalaciones no consideran a las personas mayores'], ['casa', 'No sabe cómo iniciar un programa seguro de actividad física en casa']]],
  ['participacion', 'Participación social', [['participa', 'No participa en actividades comunitarias'], ['condiciones', 'Ubicación, horario o precio inconvenientes'], ['lugares', 'No conoce lugares de encuentro para personas mayores']]],
];

export const barreras = {
  id: 'barreras',
  nombre: 'Evaluación de las barreras del entorno físico y la movilidad',
  corto: 'Barreras del entorno',
  dominio: 'social',
  tipo: 'lista',
  aliases: ['entorno', 'accesibilidad', 'barreras arquitectónicas', 'movilidad comunitaria', 'ciudades amigables'],
  problemas: ['movilidad', 'accesibilidad', 'participación social', 'entorno'],
  descripcion: 'Barreras dentro y fuera del domicilio, en el transporte, para conseguir auxiliares, para la actividad física y para la participación social.',
  objetivo: 'Identificar las barreras del entorno que limitan la movilidad y la participación de la persona mayor.',
  poblacion: 'Personas mayores en la comunidad; incluido en la guía de instrumentos del INGER (2022).',
  aplicacion: [
    'Pregunta por cada área con el formato del anexo 35 del INGER y marca las barreras presentes; si no hay, marca «Ninguno».',
  ],
  tiempo: '10 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menos áreas con barreras',
  textoEmpeoramiento: 'más áreas con barreras',
  barra: false,
  min: 0,
  max: 6,
  campos: AREAS_BARRERAS.map(([id, nombre, items]) => ({ id, tipo: 'checklist', texto: nombre, textoCorto: nombre.toLowerCase(), opciones: items.map(([i, t]) => ({ id: i, texto: t })) })),
  bandas: [
    { min: 0, max: 0, etiqueta: 'Sin barreras identificadas', nivel: 'bien', texto: 'Ninguna barrera en las áreas evaluadas.', sugerencias: [] },
    { min: 1, max: 2, etiqueta: 'Barreras en algunas áreas', nivel: 'leve', hallazgo: true, texto: 'Barreras en 1 o 2 áreas.', sugerencias: ['Orientar adaptaciones del hogar, auxiliares y alternativas de transporte; referir a Trabajo Social o terapia ocupacional si hace falta.'] },
    { min: 3, max: 6, etiqueta: 'Barreras en varias áreas', nivel: 'moderado', hallazgo: true, texto: 'Barreras en 3 áreas o más.', sugerencias: ['Plan con terapia ocupacional y Trabajo Social: adaptaciones del hogar, auxiliares, transporte y acceso a actividades comunitarias.'] },
  ],
  calcular({ v }) {
    const lineas = [];
    let areas = 0;
    for (const [id, nombre, items] of AREAS_BARRERAS) {
      const marcadas = v[id] || [];
      if (!marcadas.length) continue;
      areas += 1;
      lineas.push(`${nombre}: ${items.filter(([i]) => marcadas.includes(i)).map(([, t]) => minus(t)).join('; ')}.`);
    }
    return { puntaje: areas, lineas, lineasNota: lineas, extras: { areas } };
  },
  resumen: (res) => (res.lineas.length ? `Barreras del entorno en ${res.puntaje} áreas. ${res.lineas.join(' ')}` : 'Barreras del entorno: ninguna identificada.'),
  resumenBreve: (res) => `Barreras del entorno: ${res.puntaje} áreas`,
  detalleEnResumen: true,
  notas: ['Interpretación descriptiva: identifica el tipo de barreras de la persona en su entorno (guía del INGER, 2022). El número de áreas solo resume.'],
  licencia: { texto: 'Formato del anexo 35 de la guía de instrumentos del INGER (2022); barreras resumidas con redacción propia.', enlace: GUIA },
  referencias: [refInger(35, 'Evaluación de las barreras del entorno físico y movilidad')],
};
