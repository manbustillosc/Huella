// Sueño: ISI, Epworth y STOP-Bang como registro del resultado oficial, y un registro clínico del sueño.
// Un riesgo de apnea no es un diagnóstico, y Huella no sugiere hipnóticos ni sedantes.

/* ---------- Índice de gravedad del insomnio (registro) ---------- */

export const isi = {
  id: 'isi',
  nombre: 'Índice de gravedad del insomnio (ISI)',
  corto: 'ISI',
  dominio: 'sueno',
  tipo: 'evaluacion',
  registro: true,
  aliases: ['insomnio', 'Insomnia Severity Index', 'Morin', 'dificultad para dormir'],
  problemas: ['insomnio', 'sueño', 'despertares nocturnos'],
  descripcion: 'Registro del puntaje oficial de 7 reactivos (0 a 4 cada uno): 0 a 28.',
  objetivo: 'Cuantificar la gravedad percibida del insomnio y su repercusión, y seguir la respuesta al tratamiento.',
  poblacion: 'Adultos con queja de sueño; validado en población general y clínica, incluidas personas mayores.',
  aplicacion: [
    'Aplica la versión oficial en español distribuida por Mapi Research Trust (ePROVIDE).',
    'Registra el puntaje total (0 a 28). Huella no reproduce los reactivos.',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor gravedad del insomnio',
  textoEmpeoramiento: 'mayor gravedad del insomnio',
  min: 0,
  max: 28,
  campos: [{ id: 'puntaje', tipo: 'numero', texto: 'Puntaje total (0 a 28)', unidad: 'puntos', min: 0, max: 28, entero: true }],
  bandas: [
    { min: 0, max: 7, etiqueta: 'Sin insomnio clínicamente significativo', nivel: 'bien', texto: 'Puntaje 0 a 7 (Bastien et al., 2001).' },
    { min: 8, max: 14, etiqueta: 'Insomnio subclínico', nivel: 'leve', hallazgo: true, texto: 'Puntaje 8 a 14: insomnio por debajo del umbral clínico (Bastien et al., 2001).', sugerencias: ['Explorar hábitos de sueño, siestas, horarios, dolor, nicturia, ánimo y medicamentos.'] },
    { min: 15, max: 21, etiqueta: 'Insomnio clínico moderado', nivel: 'moderado', hallazgo: true, texto: 'Puntaje 15 a 21 (Bastien et al., 2001).', sugerencias: ['Evaluación clínica del insomnio y de sus factores contribuyentes; la terapia cognitivo-conductual para el insomnio es el tratamiento de primera línea.', 'Revisar hipnóticos y sedantes con STOPP/START y Beers antes de cualquier cambio.'] },
    { min: 22, max: 28, etiqueta: 'Insomnio clínico grave', nivel: 'grave', hallazgo: true, texto: 'Puntaje 22 a 28 (Bastien et al., 2001).', sugerencias: ['Evaluación clínica del insomnio y de sus factores contribuyentes; la terapia cognitivo-conductual para el insomnio es el tratamiento de primera línea.', 'Revisar hipnóticos y sedantes con STOPP/START y Beers antes de cualquier cambio.'] },
  ],
  calcular: ({ v }) => ({ puntaje: v.puntaje }),
  notas: [
    'Categorías de Bastien et al. (2001): 0–7 sin insomnio clínicamente significativo, 8–14 subclínico, 15–21 moderado, 22–28 grave. En población general, un puntaje de 10 o más fue el corte óptimo para detectar casos (Morin et al., 2011).',
    'Una disminución de alrededor de 8 puntos se asoció con mejoría moderada tras el tratamiento (Morin et al., 2011).',
    'Mide la percepción del insomnio; no identifica su causa ni otros trastornos del sueño.',
  ],
  licencia: { texto: 'ISI © Charles M. Morin. Distribución y licencias: Mapi Research Trust (ePROVIDE). Huella solo registra el puntaje.', enlace: 'https://eprovide.mapi-trust.org/isi-insomnia-severity-index/' },
  referencias: [
    { texto: 'Bastien CH, Vallières A, Morin CM. Validation of the Insomnia Severity Index as an outcome measure for insomnia research. Sleep Med. 2001;2(4):297-307.', doi: '10.1016/s1389-9457(00)00065-4' },
    { texto: 'Morin CM, Belleville G, Bélanger L, Ivers H. The Insomnia Severity Index: psychometric indicators to detect insomnia cases and evaluate treatment response. Sleep. 2011;34(5):601-8.', doi: '10.1093/sleep/34.5.601' },
  ],
};

/* ---------- Escala de somnolencia de Epworth (registro) ---------- */

export const epworth = {
  id: 'epworth',
  nombre: 'Escala de somnolencia de Epworth (ESS)',
  corto: 'Epworth',
  dominio: 'sueno',
  tipo: 'evaluacion',
  registro: true,
  aliases: ['ESS', 'somnolencia diurna', 'Epworth Sleepiness Scale', 'Johns', 'sueno de dia'],
  problemas: ['somnolencia diurna', 'apnea del sueño', 'hipersomnia'],
  descripcion: 'Registro del puntaje oficial de 8 situaciones (0 a 3 cada una): 0 a 24.',
  objetivo: 'Medir la propensión a quedarse dormido durante el día en situaciones habituales.',
  poblacion: 'Adultos; versión española validada en pacientes con apnea del sueño (Chiner et al., 1999).',
  aplicacion: [
    'Aplica la versión oficial en español; las licencias para organizaciones las otorga Mapi Research Trust.',
    'Registra el puntaje total (0 a 24). Huella no reproduce los reactivos.',
  ],
  tiempo: '2 a 3 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor somnolencia diurna',
  textoEmpeoramiento: 'mayor somnolencia diurna',
  min: 0,
  max: 24,
  campos: [{ id: 'puntaje', tipo: 'numero', texto: 'Puntaje total (0 a 24)', unidad: 'puntos', min: 0, max: 24, entero: true }],
  bandas: [
    { min: 0, max: 5, etiqueta: 'Somnolencia diurna normal baja', nivel: 'bien', texto: 'Puntaje 0 a 5.' },
    { min: 6, max: 10, etiqueta: 'Somnolencia diurna normal alta', nivel: 'bien', texto: 'Puntaje 6 a 10: dentro del intervalo normal.' },
    { min: 11, max: 12, etiqueta: 'Somnolencia diurna excesiva leve', nivel: 'leve', hallazgo: true, texto: 'Puntaje 11 a 12.', sugerencias: ['Explorar duración y calidad del sueño, ronquido o apneas observadas, medicamentos sedantes y estado de ánimo.'] },
    { min: 13, max: 15, etiqueta: 'Somnolencia diurna excesiva moderada', nivel: 'moderado', hallazgo: true, texto: 'Puntaje 13 a 15.', sugerencias: ['Evaluar trastornos del sueño (p. ej., apnea obstructiva) y medicamentos sedantes; considerar referencia a medicina del sueño.', 'Valorar la seguridad al conducir.'] },
    { min: 16, max: 24, etiqueta: 'Somnolencia diurna excesiva grave', nivel: 'grave', hallazgo: true, texto: 'Puntaje 16 a 24.', sugerencias: ['Evaluar trastornos del sueño (p. ej., apnea obstructiva) y medicamentos sedantes; considerar referencia a medicina del sueño.', 'Valorar la seguridad al conducir.'] },
  ],
  calcular: ({ v }) => ({ puntaje: v.puntaje }),
  notas: [
    'Categorías publicadas por los creadores de la escala: 0–5 y 6–10 normal, 11–12 excesiva leve, 13–15 moderada, 16–24 grave. En la validación española, más de 10 se consideró somnolencia excesiva (Chiner et al., 1999).',
    'No diagnostica ningún trastorno: la somnolencia puede deberse a falta de sueño, apnea, medicamentos, depresión u otras enfermedades.',
  ],
  licencia: { texto: 'ESS © Murray W. Johns. Gratuita para clínicos individuales; las organizaciones requieren licencia de Mapi Research Trust. Huella solo registra el puntaje.', enlace: 'https://eprovide.mapi-trust.org' },
  referencias: [
    { texto: 'Johns MW. A new method for measuring daytime sleepiness: the Epworth sleepiness scale. Sleep. 1991;14(6):540-5.', doi: '10.1093/sleep/14.6.540' },
    { texto: 'Chiner E, Arriero JM, Signes-Costa J, Marco J, Fuentes I. Validación de la versión española del test de somnolencia Epworth en pacientes con síndrome de apnea de sueño. Arch Bronconeumol. 1999;35(9):422-7.', doi: '10.1016/s0300-2896(15)30037-5' },
  ],
};

/* ---------- STOP-Bang (registro) ---------- */

const B_STOP = {
  bajo: { id: 'bajo', rango: '0 a 2', etiqueta: 'Riesgo bajo de apnea obstructiva moderada o grave', nivel: 'bien', texto: 'Puntaje 0 a 2: riesgo bajo de apnea obstructiva moderada o grave (Chung et al., 2016). No descarta la apnea.' },
  intermedio: { id: 'intermedio', rango: '3 a 4', etiqueta: 'Riesgo intermedio de apnea obstructiva moderada o grave', nivel: 'moderado', hallazgo: true, texto: 'Puntaje 3 a 4: riesgo intermedio (Chung et al., 2016).', sugerencias: ['Integrar con la somnolencia diurna, las comorbilidades y la preferencia de la persona para decidir si se refiere a estudio del sueño.'] },
  alto: { id: 'alto', rango: '5 a 8, o 3–4 con criterio adicional', etiqueta: 'Riesgo alto de apnea obstructiva moderada o grave', nivel: 'grave', hallazgo: true, texto: 'Riesgo alto de apnea obstructiva moderada o grave (Chung et al., 2016). Es un riesgo, no un diagnóstico: el diagnóstico requiere un estudio del sueño.', sugerencias: ['Considerar la referencia a un estudio del sueño según el contexto clínico y las preferencias de la persona.', 'En cirugía, informar el riesgo al equipo de anestesia.'] },
};

export const stopbang = {
  id: 'stopbang',
  nombre: 'STOP-Bang: riesgo de apnea obstructiva del sueño',
  corto: 'STOP-Bang',
  dominio: 'sueno',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['apnea del sueno', 'SAOS', 'ronquido', 'Chung', 'STOP'],
  problemas: ['apnea obstructiva del sueño', 'ronquido', 'somnolencia', 'valoración preoperatoria'],
  descripcion: 'Registro del puntaje oficial (0 a 8) y del criterio adicional que reclasifica el riesgo intermedio.',
  objetivo: 'Estimar el riesgo de apnea obstructiva del sueño moderada o grave para decidir si se necesita un estudio del sueño.',
  poblacion: 'Adultos en clínicas preoperatorias, de sueño y en población general (Chung et al., 2008 y 2016).',
  aplicacion: [
    'Aplica la versión oficial (stopbang.ca); su uso requiere permiso de los autores.',
    'Registra el puntaje total (0 a 8) y, si es de 3 o 4, si se cumple un criterio adicional de la versión oficial: 2 o más respuestas afirmativas en la parte STOP junto con sexo masculino, IMC mayor de 35 kg/m² o el criterio de cuello. Huella no reproduce las preguntas.',
  ],
  tiempo: '2 a 3 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor riesgo estimado',
  textoEmpeoramiento: 'mayor riesgo estimado',
  min: 0,
  max: 8,
  campos: [
    { id: 'puntaje', tipo: 'numero', texto: 'Puntaje total (0 a 8)', unidad: 'puntos', min: 0, max: 8, entero: true },
    {
      id: 'adicional', texto: '¿STOP de 2 o más con sexo masculino, IMC mayor de 35 kg/m² o el criterio de cuello positivo?', textoCorto: 'criterio adicional', puntua: false,
      visibleSi: (r) => [3, 4].includes(Number(String(r.puntaje ?? '').trim())),
      opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }],
    },
  ],
  bandas: [B_STOP.bajo, B_STOP.intermedio, B_STOP.alto],
  calcular({ v }) {
    const p = v.puntaje;
    let banda = p <= 2 ? B_STOP.bajo : p >= 5 ? B_STOP.alto : B_STOP.intermedio;
    const lineas = [];
    if (banda === B_STOP.intermedio && v.adicional?.valor === 1) {
      banda = B_STOP.alto;
      lineas.push('Puntaje intermedio reclasificado como riesgo alto por el criterio adicional (Chung et al., 2016).');
    }
    return { puntaje: p, banda, lineas, lineasNota: lineas };
  },
  notas: [
    'Estratificación de Chung et al. (2016): 0–2 riesgo bajo; 3–4 intermedio; 5–8 alto. Con 3–4, un STOP de 2 o más más sexo masculino, IMC >35 kg/m² o el criterio de cuello clasifica como riesgo alto.',
    'Es un tamizaje de riesgo: no diagnostica apnea del sueño ni sustituye el estudio del sueño.',
    'Desarrollado en clínicas preoperatorias; en personas mayores la prevalencia de apnea es alta y el valor predictivo cambia.',
  ],
  licencia: { texto: 'STOP-Bang © University Health Network (Toronto). Su uso requiere permiso de los autores; Huella solo registra el puntaje.', enlace: 'http://www.stopbang.ca' },
  referencias: [
    { texto: 'Chung F, Yegneswaran B, Liao P, et al. STOP questionnaire: a tool to screen patients for obstructive sleep apnea. Anesthesiology. 2008;108(5):812-21.', doi: '10.1097/ALN.0b013e31816d83e4' },
    { texto: 'Chung F, Abdullah HR, Liao P. STOP-Bang questionnaire: a practical approach to screen for obstructive sleep apnea. Chest. 2016;149(3):631-8.', doi: '10.1378/chest.15-0903' },
  ],
};

/* ---------- Registro clínico del sueño ---------- */

const PROBLEMAS_SUENO = [
  { id: 'conciliar', texto: 'Dificultad para conciliar el sueño' },
  { id: 'mantener', texto: 'Despertares frecuentes o dificultad para volver a dormir' },
  { id: 'temprano', texto: 'Despertar demasiado temprano' },
  { id: 'no_reparador', texto: 'Sueño no reparador' },
  { id: 'ronquido', texto: 'Ronquido intenso' },
  { id: 'apneas', texto: 'Pausas respiratorias observadas durante el sueño' },
  { id: 'piernas', texto: 'Molestias en las piernas al reposar que mejoran al moverse' },
  { id: 'conductas', texto: 'Conductas anormales durante el sueño (p. ej., golpes o gritos)' },
  { id: 'siestas', texto: 'Siestas largas o frecuentes durante el día' },
];
const CONTRIBUYENTES = [
  { id: 'dolor', texto: 'Dolor nocturno' },
  { id: 'nicturia', texto: 'Nicturia' },
  { id: 'animo', texto: 'Ansiedad o ánimo bajo' },
  { id: 'cafeina', texto: 'Cafeína, alcohol o tabaco por la tarde o la noche' },
  { id: 'entorno', texto: 'Entorno con ruido, luz o temperatura inadecuados' },
  { id: 'horario', texto: 'Horarios irregulares o mucho tiempo en cama sin dormir' },
  { id: 'hipnoticos', texto: 'Uso de hipnóticos, sedantes o antihistamínicos para dormir' },
];

export const suenoClinico = {
  id: 'sueno',
  nombre: 'Sueño: registro clínico',
  corto: 'Registro del sueño',
  dominio: 'sueno',
  tipo: 'lista',
  aliases: ['insomnio', 'ronquido', 'apnea', 'piernas inquietas', 'siesta', 'hipnoticos', 'higiene del sueno'],
  problemas: ['insomnio', 'apnea del sueño', 'piernas inquietas', 'somnolencia diurna', 'uso de hipnóticos'],
  descripcion: 'Horario y duración del sueño, problemas referidos, factores contribuyentes y uso de hipnóticos. Sin puntaje.',
  objetivo: 'Documentar el patrón de sueño y los factores que orientan la evaluación, sin establecer diagnósticos ni indicar fármacos.',
  poblacion: 'Personas mayores con queja de sueño o somnolencia; completar con quien duerme cerca si es posible.',
  aplicacion: [
    'Pregunta por el último mes. Las pausas respiratorias y las conductas durante el sueño suelen referirlas quienes duermen cerca.',
    'Las horas son aproximadas; deja vacío lo que no se sabe.',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  campos: [
    { id: 'horas', tipo: 'numero', texto: 'Horas de sueño por noche, aproximadas (opcional)', unidad: 'h', min: 0, max: 16, decimales: 1, opcional: true },
    { id: 'cama', tipo: 'numero', texto: 'Horas en cama por noche (opcional)', unidad: 'h', min: 0, max: 20, decimales: 1, opcional: true },
    { id: 'problemas', tipo: 'checklist', texto: 'Problemas referidos', opciones: PROBLEMAS_SUENO },
    { id: 'contribuyentes', tipo: 'checklist', texto: 'Factores contribuyentes', opciones: CONTRIBUYENTES },
  ],
  validar({ v }) {
    if (Number.isFinite(v.horas) && Number.isFinite(v.cama) && v.horas > v.cama) return { horas: 'Las horas de sueño no pueden superar las horas en cama.' };
    return null;
  },
  bandas: [
    { id: 'con', rango: 'Algún problema o factor', etiqueta: 'Problemas del sueño registrados', nivel: 'moderado', hallazgo: true, texto: 'Hay problemas del sueño o factores contribuyentes. Orientan la evaluación; no establecen un diagnóstico.' },
    { id: 'sin', rango: 'Ninguno', etiqueta: 'Sin problemas del sueño referidos', nivel: 'bien', texto: 'No refiere problemas del sueño ni factores contribuyentes.' },
  ],
  calcular({ v }) {
    const p = PROBLEMAS_SUENO.filter((o) => v.problemas.includes(o.id)).map((o) => o.texto.toLowerCase());
    const c = CONTRIBUYENTES.filter((o) => v.contribuyentes.includes(o.id)).map((o) => o.texto.toLowerCase());
    const lineas = [];
    if (Number.isFinite(v.horas) || Number.isFinite(v.cama)) {
      const ef = Number.isFinite(v.horas) && Number.isFinite(v.cama) && v.cama > 0 ? `; tiempo dormido respecto al tiempo en cama: ${Math.round((v.horas / v.cama) * 100)}%` : '';
      lineas.push(`Sueño: ${Number.isFinite(v.horas) ? `${v.horas} h por noche` : 'horas de sueño no registradas'}${Number.isFinite(v.cama) ? `, ${v.cama} h en cama` : ''}${ef}.`);
    }
    if (p.length) lineas.push(`Problemas: ${p.join('; ')}.`);
    if (c.length) lineas.push(`Factores contribuyentes: ${c.join('; ')}.`);
    const sug = [];
    if (v.problemas.includes('apneas') || v.problemas.includes('ronquido')) sug.push('Ronquido o pausas observadas: estimar el riesgo de apnea (p. ej., STOP-Bang) y la somnolencia diurna (Epworth).');
    if (['conciliar', 'mantener', 'temprano'].some((x) => v.problemas.includes(x))) sug.push('Para el insomnio: cuantificar su gravedad (ISI) y priorizar medidas no farmacológicas y la terapia cognitivo-conductual.');
    if (v.problemas.includes('piernas')) sug.push('Molestias en las piernas al reposar: valorar síndrome de piernas inquietas y ferritina.');
    if (v.problemas.includes('conductas')) sug.push('Conductas anormales durante el sueño: valorar la seguridad y la referencia a neurología o medicina del sueño.');
    if (v.contribuyentes.includes('hipnoticos')) sug.push('Uso de hipnóticos o sedantes: revisarlos con STOPP/START y Beers; cualquier retiro debe ser gradual y decidido con la persona.');
    const hay = p.length || c.length;
    const banda = { ...(hay ? suenoClinico.bandas[0] : suenoClinico.bandas[1]), sugerencias: sug };
    return { banda, mostrar: hay ? 'Con problemas' : 'Sin problemas', lineas, lineasNota: lineas, extras: { problemas: v.problemas, contribuyentes: v.contribuyentes } };
  },
  resumen: (res) => `Registro del sueño: ${res.banda.etiqueta.toLowerCase()}.`,
  resumenBreve: (res) => `Registro del sueño: ${res.banda.etiqueta.toLowerCase()}`,
  notas: [
    'Formulario clínico de Huella, no es un instrumento validado ni tiene puntaje.',
    'Huella no sugiere hipnóticos ni sedantes: en personas mayores aumentan el riesgo de caídas, fracturas y deterioro cognitivo (criterios de Beers 2023).',
  ],
  referencias: [
    { texto: 'American Geriatrics Society Beers Criteria Update Expert Panel. American Geriatrics Society 2023 updated AGS Beers Criteria for potentially inappropriate medication use in older adults. J Am Geriatr Soc. 2023;71(7):2052-81.', doi: '10.1111/jgs.18372' },
    { texto: 'Edinger JD, Arnedt JT, Bertisch SM, et al. Behavioral and psychological treatments for chronic insomnia disorder in adults: an American Academy of Sleep Medicine clinical practice guideline. J Clin Sleep Med. 2021;17(2):255-62.', doi: '10.5664/jcsm.8986' },
  ],
};

export const ESCALAS_SUENO = [isi, epworth, stopbang, suenoClinico];
