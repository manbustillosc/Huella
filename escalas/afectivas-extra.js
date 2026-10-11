// Fase 4: GAD-7, CES-D 7 (versión breve validada en adultos mayores mexicanos) y escala de soledad de 3 reactivos.

/* ---------- GAD-7 ---------- */

const FREC_GAD = [
  { texto: 'Ningún día', valor: 0 },
  { texto: 'Varios días', valor: 1 },
  { texto: 'Más de la mitad de los días', valor: 2 },
  { texto: 'Casi todos los días', valor: 3 },
];
const REACTIVOS_GAD = [
  ['nervios', 'Sentirse nervioso(a), ansioso(a) o con los nervios de punta', 'nervios'],
  ['control', 'No poder dejar de preocuparse o no poder controlar la preocupación', 'preocupación incontrolable'],
  ['preocupacion', 'Preocuparse demasiado por diferentes cosas', 'preocupación excesiva'],
  ['relajarse', 'Dificultad para relajarse', 'dificultad para relajarse'],
  ['inquietud', 'Estar tan inquieto(a) que es difícil permanecer sentado(a) tranquilamente', 'inquietud'],
  ['irritable', 'Molestarse o ponerse irritable fácilmente', 'irritabilidad'],
  ['miedo', 'Sentir miedo, como si algo terrible fuera a pasar', 'miedo de que algo terrible pase'],
];
const SUG_ANSIEDAD = [
  'Entrevista clínica para confirmar un trastorno de ansiedad y explorar depresión coexistente (PHQ-9 o GDS-15).',
  'Buscar causas médicas y farmacológicas de ansiedad: hipertiroidismo, hipoxia, dolor, abstinencia, cafeína, broncodilatadores o corticoesteroides.',
  'Evitar iniciar benzodiacepinas en personas mayores (riesgo de caídas, delirium y dependencia).',
];

export const gad7 = {
  id: 'gad7',
  nombre: 'Escala de ansiedad generalizada (GAD-7)',
  corto: 'GAD-7',
  dominio: 'afectivo',
  tipo: 'tamizaje',
  aliases: ['ansiedad', 'GAD', 'trastorno de ansiedad generalizada', 'preocupación', 'nervios'],
  problemas: ['ansiedad', 'preocupación', 'insomnio', 'irritabilidad'],
  descripcion: '7 síntomas de ansiedad en las últimas 2 semanas, de 0 a 3 cada uno (0 a 21).',
  objetivo: 'Tamizar y graduar síntomas de ansiedad; no establece el diagnóstico.',
  poblacion: 'Adultos en atención primaria (Spitzer, 2006); versión española validada (García-Campayo, 2010). En personas mayores puede ser útil un punto de corte menor.',
  aplicacion: [
    'Pregunta: «Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?».',
    'Lee cada reactivo y registra la frecuencia.',
  ],
  tiempo: '2 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menos síntomas de ansiedad',
  textoEmpeoramiento: 'más síntomas de ansiedad',
  min: 0,
  max: 21,
  campos: REACTIVOS_GAD.map(([id, texto, corto]) => ({ id, texto, textoCorto: corto, opciones: FREC_GAD })),
  bandas: [
    { min: 0, max: 4, etiqueta: 'Ansiedad mínima', nivel: 'bien', texto: 'Síntomas de ansiedad mínimos o ausentes.', sugerencias: [] },
    { min: 5, max: 9, etiqueta: 'Ansiedad leve', nivel: 'leve', hallazgo: true, texto: 'Síntomas de ansiedad leves (5 a 9).', sugerencias: ['Vigilar los síntomas y buscar factores contribuyentes; considerar intervenciones psicoeducativas.'] },
    { min: 10, max: 14, etiqueta: 'Ansiedad moderada', nivel: 'moderado', hallazgo: true, texto: 'Síntomas de ansiedad moderados (10 a 14). 10 o más es el punto de corte para un probable trastorno de ansiedad generalizada.', sugerencias: SUG_ANSIEDAD },
    { min: 15, max: 21, etiqueta: 'Ansiedad grave', nivel: 'grave', hallazgo: true, texto: 'Síntomas de ansiedad graves (15 a 21).', sugerencias: SUG_ANSIEDAD },
  ],
  notas: [
    'Categorías de Spitzer et al. (2006): 5, 10 y 15 marcan ansiedad leve, moderada y grave; 10 o más tiene sensibilidad de 89 % y especificidad de 82 % para trastorno de ansiedad generalizada.',
    'Tamizaje, no diagnóstico. En personas mayores, los síntomas somáticos de enfermedades médicas pueden elevar el puntaje.',
  ],
  licencia: { texto: 'GAD-7 desarrollado por Spitzer, Kroenke, Williams y Löwe con una beca educativa de Pfizer Inc. No requiere permiso para reproducirlo, traducirlo, mostrarlo ni distribuirlo.', enlace: 'https://www.phqscreeners.com' },
  referencias: [
    { texto: 'Spitzer RL, Kroenke K, Williams JBW, Löwe B. A brief measure for assessing generalized anxiety disorder: the GAD-7. Arch Intern Med. 2006;166(10):1092-7.', doi: '10.1001/archinte.166.10.1092' },
    { texto: 'García-Campayo J, Zamorano E, Ruiz MA, et al. Cultural adaptation into Spanish of the generalized anxiety disorder-7 (GAD-7) scale as a screening tool. Health Qual Life Outcomes. 2010;8:8.', doi: '10.1186/1477-7525-8-8' },
  ],
};

/* ---------- CES-D 7 ---------- */

const FREC_CESD = [
  { texto: 'Rara vez o nunca (menos de 1 día)', valor: 0 },
  { texto: 'Pocas veces o alguna vez (1 a 2 días)', valor: 1 },
  { texto: 'Un número de veces considerable (3 a 4 días)', valor: 2 },
  { texto: 'Todo el tiempo o la mayoría del tiempo (5 a 7 días)', valor: 3 },
];
const FREC_CESD_INV = FREC_CESD.map((o) => ({ ...o, valor: 3 - o.valor }));

export const cesd7 = {
  id: 'cesd7',
  nombre: 'Escala de depresión del Centro de Estudios Epidemiológicos, versión breve (CES-D 7)',
  corto: 'CES-D 7',
  dominio: 'afectivo',
  tipo: 'tamizaje',
  aliases: ['CESD', 'CES-D', 'depresión', 'ENASEM', 'ENSANUT', 'Radloff'],
  problemas: ['depresión', 'tristeza', 'ánimo bajo'],
  descripcion: '7 síntomas depresivos de la última semana, de 0 a 3 cada uno (0 a 21); validada en adultos mayores mexicanos.',
  objetivo: 'Tamizar síntomas depresivos en adultos mayores mexicanos; no establece el diagnóstico.',
  poblacion: 'Adultos de 60 años o más en México (Salinas-Rodríguez, 2014; versión de las encuestas nacionales de salud).',
  aplicacion: [
    'Pregunta por la última semana: «Durante la última semana, usted…» y lee cada reactivo.',
    'El reactivo «¿disfrutó de la vida?» se puntúa al revés (la puntuación de cada opción se muestra al lado).',
  ],
  tiempo: '2 a 3 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'reducción de síntomas depresivos',
  textoEmpeoramiento: 'aumento de síntomas depresivos',
  min: 0,
  max: 21,
  campos: [
    { id: 'tristeza_encima', texto: '¿Sentía como si no pudiera quitarse de encima la tristeza?', textoCorto: 'no podía quitarse la tristeza', opciones: FREC_CESD },
    { id: 'concentrarse', texto: '¿Le costaba concentrarse en lo que estaba haciendo?', textoCorto: 'dificultad para concentrarse', opciones: FREC_CESD },
    { id: 'deprimido', texto: '¿Se sintió deprimido(a)?', textoCorto: 'se sintió deprimido(a)', opciones: FREC_CESD },
    { id: 'esfuerzo', texto: '¿Le parecía que todo lo que hacía era un esfuerzo?', textoCorto: 'todo era un esfuerzo', opciones: FREC_CESD },
    { id: 'durmio', texto: '¿No durmió bien?', textoCorto: 'no durmió bien', opciones: FREC_CESD },
    { id: 'disfruto', texto: '¿Disfrutó de la vida?', textoCorto: 'disfrutó de la vida (inverso)', opciones: FREC_CESD_INV },
    { id: 'triste', texto: '¿Se sintió triste?', textoCorto: 'se sintió triste', opciones: FREC_CESD },
  ],
  bandas: [
    { min: 0, max: 4, etiqueta: 'Sin síntomas depresivos significativos', nivel: 'bien', texto: 'Puntaje menor de 5. No descarta depresión si hay sospecha clínica.', sugerencias: [] },
    {
      min: 5, max: 21, etiqueta: 'Síntomas depresivos: tamizaje positivo', nivel: 'moderado', hallazgo: true,
      texto: 'Puntaje de 5 o más: síntomas depresivos clínicamente significativos según la validación mexicana. No establece el diagnóstico.',
      sugerencias: ['Entrevista clínica para confirmar o descartar un trastorno depresivo; explorar ideación suicida.', 'Buscar factores contribuyentes: dolor, enfermedad médica, fármacos, duelo, aislamiento o deterioro cognitivo.'],
    },
  ],
  notas: [
    'Punto de corte ≥5 en adultos mayores mexicanos (Salinas-Rodríguez, 2014): sensibilidad 83.3 % y especificidad 90.2 % frente a la CIE-10.',
    'Reactivos tal como los publica la validación mexicana.',
  ],
  licencia: { texto: 'La CES-D (Radloff, 1977) es de dominio público. Versión breve y punto de corte de Salinas-Rodríguez et al. (2014).' },
  referencias: [
    { texto: 'Salinas-Rodríguez A, Manrique-Espinoza B, Acosta-Castillo GI, et al. Validación de un punto de corte para la versión breve de la Escala de Depresión del Centro de Estudios Epidemiológicos en adultos mayores mexicanos. Salud Publica Mex. 2014;56(3):279-85.', enlace: 'https://www.redalyc.org/pdf/106/10631164007.pdf' },
    { texto: 'Radloff LS. The CES-D Scale: a self-report depression scale for research in the general population. Appl Psychol Meas. 1977;1(3):385-401.', doi: '10.1177/014662167700100306' },
  ],
};

/* ---------- Soledad de 3 reactivos ---------- */

const FREC_SOLEDAD = [
  { texto: 'Casi nunca', valor: 1 },
  { texto: 'Algunas veces', valor: 2 },
  { texto: 'A menudo', valor: 3 },
];

export const soledad3 = {
  id: 'soledad3',
  nombre: 'Escala de soledad de 3 reactivos (Hughes)',
  corto: 'Soledad 3 reactivos',
  dominio: 'social',
  tipo: 'tamizaje',
  aliases: ['soledad', 'UCLA', 'aislamiento', 'loneliness', 'Hughes', 'soledad no deseada'],
  problemas: ['soledad', 'aislamiento social', 'depresión'],
  descripcion: 'Tres preguntas sobre la frecuencia con que la persona siente falta de compañía, que la dejan de lado o que está aislada (3 a 9).',
  objetivo: 'Identificar soledad percibida, un factor de riesgo de depresión, deterioro cognitivo y mortalidad.',
  poblacion: 'Personas mayores en la comunidad; derivada de la escala de soledad de UCLA para encuestas (Hughes, 2004).',
  aplicacion: [
    'Pregunta con naturalidad, sin juicio: «¿Con qué frecuencia siente…?».',
    'La persona responde por sí misma; no se aplica a través de un informante.',
  ],
  tiempo: '1 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menos soledad percibida',
  textoEmpeoramiento: 'más soledad percibida',
  min: 3,
  max: 9,
  campos: [
    { id: 'compania', texto: '¿Con qué frecuencia siente que le falta compañía?', textoCorto: 'falta de compañía', opciones: FREC_SOLEDAD },
    { id: 'excluido', texto: '¿Con qué frecuencia se siente excluido(a) o dejado(a) de lado?', textoCorto: 'excluido(a)', opciones: FREC_SOLEDAD },
    { id: 'aislado', texto: '¿Con qué frecuencia se siente aislado(a) de los demás?', textoCorto: 'aislado(a)', opciones: FREC_SOLEDAD },
  ],
  bandas: [
    { min: 3, max: 5, etiqueta: 'Sin soledad significativa', nivel: 'bien', texto: 'Puntaje de 3 a 5.', sugerencias: [] },
    { min: 6, max: 9, etiqueta: 'Soledad percibida', nivel: 'moderado', hallazgo: true, texto: 'Puntaje de 6 o más: soledad percibida, según el punto de corte usado con frecuencia en estudios de envejecimiento.', sugerencias: ['Explorar red de apoyo y aislamiento objetivo (Lubben LSNS-6, Gijón).', 'Tamizar depresión (GDS-15) y deterioro cognitivo.', 'Considerar recursos comunitarios: grupos, centros de día y actividades significativas.'] },
  ],
  notas: [
    'Puntaje de 3 a 9; 6 o más se usa con frecuencia para identificar soledad, aunque no hay un punto de corte universal.',
    'Mide soledad percibida, distinta del aislamiento social objetivo (red pequeña o poco contacto): pueden presentarse por separado.',
    'Traducción al español propia de Huella; no es una versión validada.',
  ],
  licencia: { texto: 'Versión breve publicada por Hughes et al. (2004) a partir de la escala de soledad de UCLA (Russell). Traducción propia de Huella.' },
  referencias: [
    { texto: 'Hughes ME, Waite LJ, Hawkley LC, Cacioppo JT. A short scale for measuring loneliness in large surveys: results from two population-based studies. Res Aging. 2004;26(6):655-72.', doi: '10.1177/0164027504268574' },
  ],
};
