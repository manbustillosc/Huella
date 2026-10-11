// Deglución y disfagia: EAT-10 (registro), FOIS, observación clínica y registro de la textura IDDSI indicada.
// Un tamizaje positivo se deriva a evaluación por personal capacitado. Huella no indica dietas ni pruebas con agua.

const DERIVAR = 'Referir a evaluación de la deglución por personal capacitado (fonoaudiología o logopedia, o equipo de disfagia).';
const NO_DIETA = 'No indicar la textura de la dieta ni pruebas de deglución con agua a partir de un tamizaje: lo decide el personal capacitado.';

/* ---------- EAT-10 (registro) ---------- */

export const eat10 = {
  id: 'eat10',
  nombre: 'EAT-10: herramienta de evaluación de la deglución',
  corto: 'EAT-10',
  dominio: 'deglucion',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['Eating Assessment Tool', 'disfagia', 'deglucion', 'tragar', 'atragantamiento', 'Belafsky'],
  problemas: ['disfagia', 'atragantamiento', 'neumonía por aspiración', 'pérdida de peso'],
  descripcion: 'Registro del puntaje oficial autoaplicado de 10 reactivos (0 a 4 cada uno): 0 a 40.',
  objetivo: 'Identificar a quién conviene evaluar la deglución por síntomas de disfagia referidos.',
  poblacion: 'Adultos capaces de responder por sí mismos; versión española validada (Burgos et al., 2012).',
  aplicacion: [
    'Aplica la versión oficial en español (Nestlé Nutrition Institute); Huella no reproduce los reactivos.',
    'Requiere que la persona comprenda y responda: con deterioro cognitivo importante, usa la observación clínica.',
  ],
  tiempo: '2 a 4 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menos síntomas de disfagia',
  textoEmpeoramiento: 'más síntomas de disfagia',
  min: 0,
  max: 40,
  campos: [{ id: 'puntaje', tipo: 'numero', texto: 'Puntaje total (0 a 40)', unidad: 'puntos', min: 0, max: 40, entero: true }],
  bandas: [
    { min: 0, max: 2, etiqueta: 'Sin indicación de disfagia en el tamizaje', nivel: 'bien', texto: 'Puntaje menor de 3. No descarta disfagia si hay signos clínicos o riesgo (p. ej., ictus, Parkinson, demencia avanzada).' },
    { min: 3, max: 40, etiqueta: 'Tamizaje positivo de disfagia', nivel: 'moderado', hallazgo: true, texto: 'Puntaje de 3 o más: anormal según los datos normativos de Belafsky et al. (2008). Indica la necesidad de evaluar la deglución; no establece el diagnóstico ni su gravedad.', sugerencias: [DERIVAR, NO_DIETA] },
  ],
  calcular: ({ v }) => ({ puntaje: v.puntaje }),
  notas: [
    'Punto de corte de 3 o más (Belafsky et al., 2008).',
    'Es un tamizaje autoaplicado: no evalúa la seguridad ni la eficacia de la deglución.',
  ],
  licencia: { texto: 'EAT-10 © Nestlé Nutrition Institute (Belafsky et al., 2008). Huella solo registra el puntaje.', enlace: 'https://www.nestlenutrition-institute.org' },
  referencias: [
    { texto: 'Belafsky PC, Mouadeb DA, Rees CJ, et al. Validity and reliability of the Eating Assessment Tool (EAT-10). Ann Otol Rhinol Laryngol. 2008;117(12):919-24.', doi: '10.1177/000348940811701210' },
    { texto: 'Burgos R, Sarto B, Segurola H, et al. Traducción y validación de la versión en español de la escala EAT-10 (Eating Assessment Tool-10) para el despistaje de la disfagia. Nutr Hosp. 2012;27(6):2048-54.', doi: '10.3305/nh.2012.27.6.6100' },
  ],
};

/* ---------- FOIS ---------- */

const NIVELES_FOIS = [
  { texto: '1 · Nada por vía oral', valor: 1 },
  { texto: '2 · Depende de sonda, con intentos mínimos de comida o líquido por boca', valor: 2 },
  { texto: '3 · Depende de sonda, con ingesta oral constante de comida o líquido', valor: 3 },
  { texto: '4 · Dieta oral total de una sola consistencia', valor: 4 },
  { texto: '5 · Dieta oral total de varias consistencias, con preparación especial o compensaciones', valor: 5 },
  { texto: '6 · Dieta oral total de varias consistencias, sin preparación especial, con limitaciones de alimentos específicos', valor: 6 },
  { texto: '7 · Dieta oral total sin restricciones', valor: 7 },
];

export const fois = {
  id: 'fois',
  nombre: 'FOIS: escala funcional de ingesta oral',
  corto: 'FOIS',
  dominio: 'deglucion',
  tipo: 'evaluacion',
  aliases: ['Functional Oral Intake Scale', 'disfagia', 'sonda', 'via oral', 'ingesta oral', 'Crary'],
  problemas: ['disfagia', 'alimentación por sonda', 'nutrición'],
  descripcion: 'Nivel funcional de ingesta oral de alimentos y líquidos, de 1 (nada por vía oral) a 7 (sin restricciones).',
  objetivo: 'Documentar el nivel de ingesta oral y su cambio en el tiempo.',
  poblacion: 'Desarrollada en ictus agudo (Crary et al., 2005); se usa en otras poblaciones con disfagia.',
  aplicacion: [
    'Elige el nivel que describe la ingesta oral actual, según la dieta indicada y lo que la persona realmente consume.',
    'Las descripciones son un resumen en español; los descriptores originales están en Crary et al. (2005).',
  ],
  tiempo: '1 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mayor nivel de ingesta oral',
  textoEmpeoramiento: 'menor nivel de ingesta oral',
  unidadCambio: ['nivel', 'niveles'],
  min: 1,
  max: 7,
  campos: [{ id: 'nivel', texto: 'Nivel de ingesta oral', textoCorto: 'nivel', puntua: false, opciones: NIVELES_FOIS }],
  bandas: [
    { min: 1, max: 3, etiqueta: 'Dependencia de vía no oral', nivel: 'grave', hallazgo: true, texto: 'Niveles 1 a 3: la nutrición depende de una sonda u otra vía no oral.' },
    { min: 4, max: 6, etiqueta: 'Dieta oral con restricciones', nivel: 'moderado', hallazgo: true, texto: 'Niveles 4 a 6: dieta oral total con restricciones de consistencia, preparación o alimentos.' },
    { min: 7, max: 7, etiqueta: 'Dieta oral sin restricciones', nivel: 'bien', texto: 'Nivel 7: dieta oral total sin restricciones.' },
  ],
  calcular: ({ v }) => ({ puntaje: v.nivel.valor, max: 7, mostrar: String(v.nivel.valor), sufijo: 'de 7' }),
  resumen: (res) => `FOIS: nivel ${res.puntaje} de 7 (${res.banda.etiqueta.toLowerCase()}).`,
  resumenBreve: (res) => `FOIS nivel ${res.puntaje}`,
  notas: [
    'Describe la ingesta oral; no evalúa la seguridad de la deglución ni indica qué dieta dar.',
    'Las agrupaciones (1–3, 4–6, 7) son descriptivas de Huella para facilitar la lectura; la escala original no define puntos de corte.',
  ],
  referencias: [
    { texto: 'Crary MA, Mann GD, Groher ME. Initial psychometric assessment of a functional oral intake scale for dysphagia in stroke patients. Arch Phys Med Rehabil. 2005;86(8):1516-20.', doi: '10.1016/j.apmr.2004.11.049' },
  ],
};

/* ---------- Observación clínica de la deglución ---------- */

const SIGNOS_DEGLUCION = [
  { id: 'tos', texto: 'Tos o atragantamiento al comer o beber' },
  { id: 'voz', texto: 'Voz húmeda o «gorgoteante» después de tragar' },
  { id: 'residuo', texto: 'Restos de comida en la boca o comida que se escapa' },
  { id: 'lento', texto: 'Comidas muy prolongadas o rechazo de ciertas consistencias' },
  { id: 'pastillas', texto: 'Dificultad para tragar pastillas' },
  { id: 'neumonia', texto: 'Neumonías o infecciones respiratorias repetidas' },
  { id: 'peso', texto: 'Pérdida de peso o deshidratación sin otra causa clara' },
];

export const degluObs = {
  id: 'deglucion',
  nombre: 'Deglución: observación clínica',
  corto: 'Observación de la deglución',
  dominio: 'deglucion',
  tipo: 'lista',
  aliases: ['disfagia', 'atragantamiento', 'aspiracion', 'tos al comer', 'voz humeda'],
  problemas: ['disfagia', 'neumonía por aspiración', 'pérdida de peso'],
  descripcion: 'Signos de disfagia observados o referidos por quien cuida. Sin puntaje; no incluye pruebas con agua.',
  objetivo: 'Documentar signos de alarma de disfagia para derivar a una evaluación por personal capacitado, también en quien no puede responder el EAT-10.',
  poblacion: 'Personas mayores, incluidas las que tienen deterioro cognitivo o están hospitalizadas.',
  aplicacion: [
    'Observa una comida habitual o pregunta a quien la acompaña. No hagas pruebas con agua ni con alimentos si no tienes entrenamiento.',
    'Marca los signos presentes o confirma que no hay ninguno.',
  ],
  tiempo: '2 a 5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  campos: [{ id: 'signos', tipo: 'checklist', texto: 'Signos observados o referidos', opciones: SIGNOS_DEGLUCION }],
  bandas: [
    { id: 'con', rango: 'Algún signo', etiqueta: 'Signos de posible disfagia', nivel: 'moderado', hallazgo: true, texto: `Hay signos de posible disfagia. ${DERIVAR}`, sugerencias: [DERIVAR, NO_DIETA, 'Revisar medicamentos que dificultan la deglución o reducen el estado de alerta, y la forma de administrarlos.'] },
    { id: 'sin', rango: 'Ninguno', etiqueta: 'Sin signos de disfagia observados', nivel: 'bien', texto: 'No se observaron signos de disfagia. No descarta una aspiración silente.' },
  ],
  calcular({ v }) {
    const s = SIGNOS_DEGLUCION.filter((o) => v.signos.includes(o.id)).map((o) => o.texto.toLowerCase());
    const lineas = s.length ? [`Signos: ${s.join('; ')}.`] : [];
    return { banda: s.length ? degluObs.bandas[0] : degluObs.bandas[1], mostrar: s.length ? 'Con signos' : 'Sin signos', lineas, lineasNota: lineas, extras: { signos: v.signos } };
  },
  resumen: (res) => `Observación de la deglución: ${res.banda.etiqueta.toLowerCase()}.`,
  resumenBreve: (res) => `Deglución: ${res.banda.etiqueta.toLowerCase()}`,
  notas: [
    'Formulario clínico de Huella, no es un instrumento validado ni tiene puntaje.',
    'La aspiración puede ser silente (sin tos): la ausencia de signos no la descarta.',
  ],
  referencias: [
    { texto: 'Organización Panamericana de la Salud. Manual de atención integrada para las personas mayores (ICOPE). 2.ª ed. Washington, D.C.: OPS; 2025. Capítulo 7: vitalidad (problemas para masticar o deglutir).', doi: '10.37774/9789275330319' },
  ],
};

/* ---------- IDDSI: registro de la textura indicada ---------- */

const BEBIDAS = [
  { texto: 'Nivel 0 · Fino', valor: 0 },
  { texto: 'Nivel 1 · Ligeramente espeso', valor: 1 },
  { texto: 'Nivel 2 · Poco espeso', valor: 2 },
  { texto: 'Nivel 3 · Moderadamente espeso', valor: 3 },
  { texto: 'Nivel 4 · Extremadamente espeso', valor: 4 },
  { texto: 'Sin indicación de bebidas', valor: -1, especial: true },
];
const ALIMENTOS = [
  { texto: 'Nivel 3 · Licuado', valor: 3 },
  { texto: 'Nivel 4 · Puré', valor: 4 },
  { texto: 'Nivel 5 · Picado y húmedo', valor: 5 },
  { texto: 'Nivel 6 · Suave y tamaño bocado', valor: 6 },
  { texto: 'Nivel 7 · Fácil de masticar', valor: 7 },
  { texto: 'Nivel 7 · Normal (regular)', valor: 7 },
  { texto: 'Sin indicación de alimentos (p. ej., nada por boca)', valor: -1, especial: true },
];

export const iddsi = {
  id: 'iddsi',
  nombre: 'IDDSI: textura indicada por el equipo de deglución',
  corto: 'IDDSI',
  dominio: 'deglucion',
  tipo: 'lista',
  aliases: ['textura', 'espesante', 'dieta modificada', 'pure', 'disfagia', 'International Dysphagia Diet Standardisation Initiative'],
  problemas: ['disfagia', 'dieta de textura modificada'],
  descripcion: 'Registro de los niveles IDDSI de bebidas y alimentos indicados por personal capacitado. Huella no indica dietas.',
  objetivo: 'Dejar constancia, con la terminología IDDSI, de la textura vigente indicada, para comunicarla y darle seguimiento.',
  poblacion: 'Personas con dieta de textura modificada indicada por fonoaudiología o logopedia, nutrición o el médico tratante.',
  aplicacion: [
    'Registra la indicación vigente tal como la dio el personal capacitado; no la elijas a partir de un tamizaje.',
    'Para verificar las texturas se usan los métodos de prueba oficiales de IDDSI (iddsi.org).',
  ],
  tiempo: '1 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  permiteNoEvaluable: false,
  campos: [
    { id: 'bebidas', texto: 'Bebidas', textoCorto: 'bebidas', puntua: false, opciones: BEBIDAS },
    { id: 'alimentos', texto: 'Alimentos', textoCorto: 'alimentos', puntua: false, opciones: ALIMENTOS },
    {
      id: 'indico', texto: 'Indicada por', textoCorto: 'indicada por', puntua: false,
      opciones: [{ texto: 'Fonoaudiología o logopedia', valor: 0 }, { texto: 'Nutrición', valor: 1 }, { texto: 'Médico tratante', valor: 2 }, { texto: 'Otro profesional', valor: 3 }],
    },
  ],
  bandas: [
    { id: 'registrada', rango: 'Indicación registrada', etiqueta: 'Textura indicada registrada', nivel: 'neutro', texto: 'Indicación vigente de textura según la terminología IDDSI. Su revisión corresponde al personal que la indicó.' },
  ],
  calcular({ v }) {
    const b = v.bebidas.valor >= 0 ? v.bebidas.texto : 'sin indicación de bebidas';
    const a = v.alimentos.valor >= 0 ? v.alimentos.texto : 'sin indicación de alimentos';
    const lineas = [`Bebidas: ${b}. Alimentos: ${a}. Indicada por: ${v.indico.texto.toLowerCase()}.`];
    return { banda: iddsi.bandas[0], mostrar: 'Registrada', lineas, lineasNota: lineas, extras: { bebidas: v.bebidas.valor, alimentos: v.alimentos.valor } };
  },
  resumen: (res) => `IDDSI (indicación vigente): ${res.lineas[0].replace(/\.$/, '')}.`,
  resumenBreve: () => 'IDDSI: textura indicada registrada',
  notas: [
    'Huella registra la indicación; no la propone ni la deduce de un tamizaje.',
    'Niveles IDDSI: bebidas 0 a 4 y alimentos 3 a 7, más alimentos de transición. Los alimentos de transición no se incluyen aquí.',
  ],
  licencia: { texto: 'El marco y los descriptores de la IDDSI están autorizados bajo la licencia Creative Commons Attribution-ShareAlike 4.0 International. © The International Dysphagia Diet Standardisation Initiative.', enlace: 'https://iddsi.org/framework' },
  referencias: [
    { texto: 'International Dysphagia Diet Standardisation Initiative. Marco IDDSI, definiciones detalladas y métodos de prueba, versión en español. IDDSI; 2019, actualizado.', enlace: 'https://iddsi.org/framework' },
  ],
};

export const ESCALAS_DEGLUCION = [eat10, fois, degluObs, iddsi];
