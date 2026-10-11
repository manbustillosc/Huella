// Continencia y eliminación: ICIQ-UI SF (registro), síntomas urinarios, diario miccional y función intestinal.
// Ningún instrumento asigna un tipo de incontinencia ni un diagnóstico: los datos de alarma se señalan para evaluación médica.
const ALARMA = 'Requiere evaluación médica oportuna; Huella no establece la causa.';

/* ---------- ICIQ-UI SF (registro) ---------- */

export const iciq = {
  id: 'iciq',
  nombre: 'ICIQ-UI SF: cuestionario breve de incontinencia urinaria',
  corto: 'ICIQ-UI SF',
  dominio: 'continencia',
  tipo: 'evaluacion',
  registro: true,
  aliases: ['ICIQ', 'incontinencia urinaria', 'International Consultation on Incontinence Questionnaire', 'perdida de orina'],
  problemas: ['incontinencia urinaria', 'pérdidas de orina', 'calidad de vida'],
  descripcion: 'Registro del puntaje del cuestionario oficial (frecuencia, cantidad y repercusión): 0 a 21.',
  objetivo: 'Cuantificar la frecuencia, la cantidad y la repercusión de la incontinencia urinaria y seguir su evolución.',
  poblacion: 'Adultos con síntomas urinarios, en la comunidad y en la consulta; versión validada en español.',
  aplicacion: [
    'Aplica la versión oficial en español, obtenida del grupo ICIQ (iciq.net).',
    'Registra el puntaje total: suma de frecuencia (0 a 5), cantidad (0 a 6) y repercusión en la vida diaria (0 a 10). La última pregunta, sobre cuándo ocurren las pérdidas, no puntúa.',
    'Huella no reproduce las preguntas.',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor gravedad de la incontinencia',
  textoEmpeoramiento: 'mayor gravedad de la incontinencia',
  min: 0,
  max: 21,
  campos: [
    { id: 'puntaje', tipo: 'numero', texto: 'Puntaje total (0 a 21)', unidad: 'puntos', min: 0, max: 21, entero: true },
    {
      id: 'momento', tipo: 'checklist', texto: 'Cuándo ocurren las pérdidas (pregunta sin puntaje; opcional)', opcional: true,
      opciones: [
        { id: 'esfuerzo', texto: 'Al toser, estornudar o hacer esfuerzo' },
        { id: 'urgencia', texto: 'Antes de llegar al baño' },
        { id: 'dormido', texto: 'Al dormir' },
        { id: 'actividad', texto: 'Durante la actividad física' },
        { id: 'despues', texto: 'Al terminar de orinar y vestirse' },
        { id: 'sin_motivo', texto: 'Sin motivo evidente' },
        { id: 'continua', texto: 'De forma continua' },
      ],
    },
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'Sin incontinencia referida', nivel: 'bien', texto: 'Puntaje 0: no refiere pérdidas de orina en el periodo evaluado.' },
    { min: 1, max: 5, etiqueta: 'Incontinencia leve', nivel: 'leve', hallazgo: true, texto: 'Gravedad leve según los intervalos de Klovning et al. (2009).', sugerencias: ['Explorar el tipo de síntomas, los factores contribuyentes y las preferencias de tratamiento.'] },
    { min: 6, max: 12, etiqueta: 'Incontinencia moderada', nivel: 'moderado', hallazgo: true, texto: 'Gravedad moderada según los intervalos de Klovning et al. (2009).', sugerencias: ['Evaluación clínica de la incontinencia: síntomas, medicamentos, movilidad, cognición, estreñimiento e infección.'] },
    { min: 13, max: 18, etiqueta: 'Incontinencia grave', nivel: 'grave', hallazgo: true, texto: 'Gravedad grave según los intervalos de Klovning et al. (2009).', sugerencias: ['Evaluación clínica de la incontinencia y valorar referencia especializada según los hallazgos.'] },
    { min: 19, max: 21, etiqueta: 'Incontinencia muy grave', nivel: 'grave', hallazgo: true, texto: 'Gravedad muy grave según los intervalos de Klovning et al. (2009).', sugerencias: ['Evaluación clínica de la incontinencia y valorar referencia especializada según los hallazgos.'] },
  ],
  calcular({ v }) {
    const momentos = (v.momento || []).filter((x) => x);
    const lineas = momentos.length ? [`Cuándo ocurren las pérdidas: ${iciq.campos[1].opciones.filter((o) => momentos.includes(o.id)).map((o) => o.texto.toLowerCase()).join('; ')}. Orienta la exploración, pero no determina el tipo de incontinencia.`] : [];
    return { puntaje: v.puntaje, lineas, lineasNota: lineas };
  },
  notas: [
    'Intervalos de gravedad de Klovning et al. (2009): 1–5 leve, 6–12 moderada, 13–18 grave, 19–21 muy grave.',
    'El puntaje mide gravedad y repercusión; no determina el tipo de incontinencia (de esfuerzo, de urgencia, mixta, por rebosamiento o funcional).',
    'Registra solo puntajes obtenidos con la versión oficial completa.',
  ],
  licencia: { texto: 'ICIQ-UI SF © ICIQ Group (Bristol Urological Institute). Su uso requiere solicitarlo al grupo ICIQ; Huella solo registra el puntaje.', enlace: 'https://iciq.net' },
  referencias: [
    { texto: 'Avery K, Donovan J, Peters TJ, Shaw C, Gotoh M, Abrams P. ICIQ: a brief and robust measure for evaluating the symptoms and impact of urinary incontinence. Neurourol Urodyn. 2004;23(4):322-30.', doi: '10.1002/nau.20041' },
    { texto: 'Klovning A, Avery K, Sandvik H, Hunskaar S. Comparison of two questionnaires for assessing the severity of urinary incontinence: the ICIQ-UI SF versus the incontinence severity index. Neurourol Urodyn. 2009;28(5):411-5.', doi: '10.1002/nau.20674' },
    { texto: 'Espuña Pons M, Rebollo Álvarez P, Puig Clota M. Validación de la versión española del International Consultation on Incontinence Questionnaire-Short Form. Med Clin (Barc). 2004;122(8):288-92.', doi: '10.1016/s0025-7753(04)74212-8' },
  ],
};

/* ---------- Síntomas urinarios (formulario clínico) ---------- */

const SINTOMAS_URINARIOS = [
  { id: 'esfuerzo', texto: 'Pérdida de orina con la tos, la risa, el estornudo o al levantarse' },
  { id: 'urgencia', texto: 'Urgencia: deseo súbito de orinar difícil de posponer' },
  { id: 'urgencia_perdida', texto: 'Pérdida de orina con la urgencia, antes de llegar al baño' },
  { id: 'frecuencia', texto: 'Orina con más frecuencia de lo habitual durante el día' },
  { id: 'vaciamiento', texto: 'Chorro débil, pujo, goteo o sensación de vaciamiento incompleto' },
  { id: 'funcional', texto: 'Dificultad para llegar al baño a tiempo por movilidad, entorno o cognición' },
];
const ALARMA_URINARIA = [
  { id: 'hematuria', texto: 'Sangre visible en la orina' },
  { id: 'retencion', texto: 'Dificultad o imposibilidad para orinar, o vejiga palpable' },
  { id: 'dolor', texto: 'Dolor al orinar, fiebre o dolor suprapúbico o lumbar' },
  { id: 'subita', texto: 'Incontinencia de inicio súbito con debilidad, alteración sensitiva o confusión nuevas' },
  { id: 'recurrente', texto: 'Infecciones urinarias recurrentes' },
];

export const sintomasUrinarios = {
  id: 'urinarios',
  nombre: 'Síntomas urinarios: registro clínico',
  corto: 'Síntomas urinarios',
  dominio: 'continencia',
  tipo: 'lista',
  aliases: ['incontinencia', 'nicturia', 'urgencia', 'esfuerzo', 'absorbentes', 'panal', 'retencion urinaria', 'hematuria'],
  problemas: ['incontinencia urinaria', 'nicturia', 'urgencia urinaria', 'retención urinaria'],
  descripcion: 'Síntomas de almacenamiento y vaciamiento, nicturia, absorbentes y datos de alarma. Sin puntaje.',
  objetivo: 'Documentar los síntomas urinarios y los datos de alarma para orientar la evaluación clínica.',
  poblacion: 'Personas mayores con incontinencia o síntomas urinarios.',
  aplicacion: [
    'Pregunta por cada síntoma en el último mes; si hay quien cuida, completa con su información.',
    'Marca los datos de alarma presentes o confirma que no hay ninguno.',
    'Los síntomas orientan la exploración (tacto rectal o pélvico, residuo posmiccional, examen general de orina), pero no establecen el tipo de incontinencia.',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  campos: [
    { id: 'sintomas', tipo: 'checklist', texto: 'Síntomas en el último mes', opciones: SINTOMAS_URINARIOS },
    { id: 'nicturia', tipo: 'numero', texto: 'Veces que se levanta a orinar por la noche (opcional)', unidad: 'veces', min: 0, max: 20, entero: true, opcional: true },
    { id: 'absorbentes', tipo: 'numero', texto: 'Absorbentes o pañales al día (opcional)', unidad: 'al día', min: 0, max: 20, entero: true, opcional: true },
    { id: 'alarma', tipo: 'checklist', texto: 'Datos de alarma', opciones: ALARMA_URINARIA },
  ],
  bandas: [
    { id: 'alarma', rango: 'Algún dato de alarma', etiqueta: 'Con datos de alarma', nivel: 'grave', hallazgo: true, texto: `Hay datos de alarma. ${ALARMA}` },
    { id: 'sintomas', rango: 'Síntomas sin datos de alarma', etiqueta: 'Síntomas urinarios registrados', nivel: 'moderado', hallazgo: true, texto: 'Hay síntomas urinarios sin datos de alarma. El patrón de síntomas no establece por sí solo el tipo de incontinencia.' },
    { id: 'sin', rango: 'Sin síntomas ni datos de alarma', etiqueta: 'Sin síntomas urinarios', nivel: 'bien', texto: 'No refiere síntomas urinarios en el último mes.' },
  ],
  calcular({ v }) {
    const s = SINTOMAS_URINARIOS.filter((o) => v.sintomas.includes(o.id)).map((o) => o.texto.toLowerCase());
    const a = ALARMA_URINARIA.filter((o) => v.alarma.includes(o.id)).map((o) => o.texto.toLowerCase());
    const lineas = [];
    if (s.length) lineas.push(`Síntomas: ${s.join('; ')}.`);
    if (Number.isFinite(v.nicturia)) lineas.push(`Nicturia: ${v.nicturia} ${v.nicturia === 1 ? 'vez' : 'veces'} por noche.`);
    if (Number.isFinite(v.absorbentes)) lineas.push(`Absorbentes: ${v.absorbentes} al día.`);
    if (a.length) lineas.push(`Datos de alarma: ${a.join('; ')}. ${ALARMA}`);
    const banda = a.length ? urinariosBandas.alarma : s.length || v.nicturia > 0 || v.absorbentes > 0 ? urinariosBandas.sintomas : urinariosBandas.sin;
    const sug = [];
    if (s.length) sug.push('Evaluar factores contribuyentes: medicamentos (diuréticos, anticolinérgicos, sedantes), estreñimiento, movilidad, cognición, ingesta de líquidos e infección.');
    if (v.sintomas.includes('vaciamiento')) sug.push('Con síntomas de vaciamiento, considerar la medición del residuo posmiccional.');
    if (Number.isFinite(v.nicturia) && v.nicturia >= 2) sug.push('Para la nicturia, un diario miccional permite distinguir poliuria nocturna de baja capacidad vesical.');
    return {
      banda: { ...banda, sugerencias: sug }, mostrar: banda.id === 'alarma' ? 'Con alarma' : banda.id === 'sintomas' ? 'Con síntomas' : 'Sin síntomas',
      lineas, lineasNota: lineas, extras: { sintomas: v.sintomas, alarma: v.alarma },
    };
  },
  resumen: (res) => `Síntomas urinarios: ${res.banda.etiqueta.toLowerCase()}.`,
  resumenBreve: (res) => `Síntomas urinarios: ${res.banda.etiqueta.toLowerCase()}`,
  notas: [
    'Formulario clínico de Huella, no es un instrumento validado ni tiene puntaje.',
    'No establece el tipo de incontinencia: la clasificación requiere historia, exploración y, según el caso, estudios.',
    'Un campo numérico vacío significa «no registrado», no «cero».',
  ],
  referencias: [
    { texto: 'National Institute for Health and Care Excellence. Urinary incontinence and pelvic organ prolapse in women: management (NG123). London: NICE; 2019.', enlace: 'https://www.nice.org.uk/guidance/ng123' },
    { texto: 'Organización Panamericana de la Salud. Manual de atención integrada para las personas mayores (ICOPE). 2.ª ed. Washington, D.C.: OPS; 2025. Capítulo 13: incontinencia urinaria.', doi: '10.37774/9789275330319' },
  ],
};
const urinariosBandas = Object.fromEntries(sintomasUrinarios.bandas.map((b) => [b.id, b]));

/* ---------- Diario miccional (resumen de hasta 3 días) ---------- */

const dia = (n, extra = {}) => [
  { id: `d${n}_diurnas`, tipo: 'numero', texto: `Día ${n}: micciones diurnas`, unidad: 'micciones', min: 0, max: 40, entero: true, opcional: n > 1, grupo: n > 1 ? `Día ${n} (opcional)` : 'Día 1', ...extra },
  { id: `d${n}_nocturnas`, tipo: 'numero', texto: `Día ${n}: micciones nocturnas`, unidad: 'micciones', min: 0, max: 20, entero: true, opcional: n > 1 },
  { id: `d${n}_perdidas`, tipo: 'numero', texto: `Día ${n}: episodios de pérdida de orina`, unidad: 'episodios', min: 0, max: 40, entero: true, opcional: n > 1 },
  { id: `d${n}_total`, tipo: 'numero', texto: `Día ${n}: volumen de 24 h (opcional)`, unidad: 'mL', min: 50, max: 8000, entero: true, opcional: true },
  { id: `d${n}_noche`, tipo: 'numero', texto: `Día ${n}: volumen nocturno (opcional)`, unidad: 'mL', min: 0, max: 6000, entero: true, opcional: true },
  { id: `d${n}_maximo`, tipo: 'numero', texto: `Día ${n}: volumen de la micción más grande (opcional)`, unidad: 'mL', min: 10, max: 2000, entero: true, opcional: true },
];
const LIMITE_POLIURIA_NOCTURNA = 0.33;
const media = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const f1 = (n) => String(Number(n.toFixed(1)));

export const diarioMiccional = {
  id: 'diario',
  nombre: 'Diario miccional: resumen de hasta 3 días',
  corto: 'Diario miccional',
  dominio: 'continencia',
  tipo: 'calculadora',
  aliases: ['diario vesical', 'frecuencia volumen', 'poliuria nocturna', 'nicturia', 'cartilla miccional'],
  problemas: ['nicturia', 'incontinencia urinaria', 'poliuria nocturna', 'urgencia urinaria'],
  descripcion: 'Resume micciones diurnas y nocturnas, pérdidas y volúmenes de uno a tres días; calcula el índice de poliuria nocturna si hay volúmenes.',
  objetivo: 'Cuantificar el patrón miccional registrado en casa para orientar la evaluación de la nicturia y la incontinencia.',
  poblacion: 'Personas con síntomas urinarios capaces de registrar (por sí mismas o con quien las cuida) las micciones de 1 a 3 días.',
  aplicacion: [
    'Entrega una hoja para anotar, durante 1 a 3 días (de preferencia 3), la hora y, si es posible, el volumen de cada micción y cada pérdida de orina.',
    'Define «noche» como el periodo en que la persona se acuesta a dormir; la primera micción al levantarse cuenta como nocturna para el volumen nocturno, según la convención de la ICS.',
    'Captura aquí los totales de cada día. Deja vacío lo que no se registró: un campo vacío no significa cero.',
  ],
  tiempo: '5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  campos: [...dia(1), ...dia(2), ...dia(3)],
  validar({ v }) {
    const errores = {};
    for (const n of [1, 2, 3]) {
      const t = v[`d${n}_total`];
      const no = v[`d${n}_noche`];
      const mx = v[`d${n}_maximo`];
      if (Number.isFinite(t) && Number.isFinite(no) && no > t) errores[`d${n}_noche`] = 'El volumen nocturno no puede ser mayor que el de 24 h.';
      if (Number.isFinite(t) && Number.isFinite(mx) && mx > t) errores[`d${n}_maximo`] = 'La micción más grande no puede superar el volumen de 24 h.';
      const parcial = ['diurnas', 'nocturnas', 'perdidas'].map((k) => v[`d${n}_${k}`]);
      if (n > 1 && parcial.some(Number.isFinite) && !parcial.every(Number.isFinite)) errores[`d${n}_diurnas`] = `Completa micciones diurnas, nocturnas y pérdidas del día ${n}, o deja el día vacío.`;
    }
    return errores;
  },
  bandas: [
    { id: 'resumen', rango: 'Resumen calculado', etiqueta: 'Resumen del diario miccional', nivel: 'neutro', texto: 'Promedios por día de los días registrados. La interpretación clínica (nicturia, poliuria, baja capacidad vesical) requiere la valoración completa.' },
  ],
  calcular({ v }) {
    const dias = [1, 2, 3].filter((n) => ['diurnas', 'nocturnas', 'perdidas'].every((k) => Number.isFinite(v[`d${n}_${k}`])));
    const prom = (k) => media(dias.map((n) => v[`d${n}_${k}`]));
    const conVol = dias.filter((n) => Number.isFinite(v[`d${n}_total`]));
    const conIpn = dias.filter((n) => Number.isFinite(v[`d${n}_total`]) && Number.isFinite(v[`d${n}_noche`]));
    const maximos = dias.map((n) => v[`d${n}_maximo`]).filter(Number.isFinite);
    const lineas = [
      `Días registrados: ${dias.length}.`,
      `Promedio por día: ${f1(prom('diurnas'))} micciones diurnas, ${f1(prom('nocturnas'))} nocturnas y ${f1(prom('perdidas'))} episodios de pérdida.`,
    ];
    let ipn = null;
    if (conVol.length) lineas.push(`Volumen de 24 h: promedio ${Math.round(media(conVol.map((n) => v[`d${n}_total`])))} mL (${conVol.length} ${conVol.length === 1 ? 'día' : 'días'} con volumen).`);
    else lineas.push('Volumen de 24 h: no registrado.');
    if (maximos.length) lineas.push(`Micción más grande registrada: ${Math.max(...maximos)} mL.`);
    if (conIpn.length) {
      ipn = media(conIpn.map((n) => v[`d${n}_noche`] / v[`d${n}_total`]));
      const pct = Math.round(ipn * 100);
      lineas.push(`Índice de poliuria nocturna (volumen nocturno / 24 h): ${pct}%${ipn > LIMITE_POLIURIA_NOCTURNA ? ': mayor del 33%, compatible con poliuria nocturna según la definición de la ICS para personas mayores' : ''}.`);
    } else lineas.push('Índice de poliuria nocturna: no calculable sin volumen nocturno y de 24 h.');
    if (dias.length < 3) lineas.push('Menos de 3 días: el resumen puede no representar el patrón habitual.');
    return {
      banda: diarioMiccional.bandas[0], mostrar: `${dias.length} ${dias.length === 1 ? 'día' : 'días'}`, lineas, lineasNota: lineas,
      extras: { dias: dias.length, diurnas: prom('diurnas'), nocturnas: prom('nocturnas'), perdidas: prom('perdidas'), ipn },
    };
  },
  resumen: (res) => `Diario miccional (${res.extras.dias} ${res.extras.dias === 1 ? 'día' : 'días'}): ${f1(res.extras.diurnas)} micciones diurnas, ${f1(res.extras.nocturnas)} nocturnas y ${f1(res.extras.perdidas)} pérdidas por día${res.extras.ipn != null ? `; índice de poliuria nocturna ${Math.round(res.extras.ipn * 100)}%` : ''}.`,
  resumenBreve: (res) => `Diario miccional: ${f1(res.extras.nocturnas)} micciones nocturnas por día`,
  notas: [
    'Poliuria nocturna (ICS, 2002): volumen nocturno mayor del 33% del volumen de 24 h en personas mayores (20% en jóvenes). Requiere medir volúmenes.',
    'Un campo vacío significa «no registrado»: no se interpreta como cero ni como ausencia del síntoma.',
    'Es un resumen de datos registrados; no establece el tipo de incontinencia ni la causa de la nicturia. No existe un formato de diario miccional plenamente validado (Bright et al., 2011).',
  ],
  referencias: [
    { texto: 'van Kerrebroeck P, Abrams P, Chaikin D, et al. The standardisation of terminology in nocturia: report from the Standardisation Sub-committee of the International Continence Society. Neurourol Urodyn. 2002;21(2):179-83.', doi: '10.1002/nau.10053' },
    { texto: 'Bright E, Drake MJ, Abrams P. Urinary diaries: evidence for the development and validation of diary content, format, and duration. Neurourol Urodyn. 2011;30(3):348-52.', doi: '10.1002/nau.20994' },
  ],
};

/* ---------- Función intestinal (formulario clínico) ---------- */

const BRISTOL = [
  { texto: 'Tipo 1: trozos duros y separados, difíciles de evacuar', valor: 1 },
  { texto: 'Tipo 2: forma alargada, pero grumosa y dura', valor: 2 },
  { texto: 'Tipo 3: alargada con grietas en la superficie', valor: 3 },
  { texto: 'Tipo 4: alargada, lisa y blanda', valor: 4 },
  { texto: 'Tipo 5: trozos blandos de bordes definidos', valor: 5 },
  { texto: 'Tipo 6: trozos pastosos de bordes irregulares', valor: 6 },
  { texto: 'Tipo 7: acuosa, sin trozos sólidos', valor: 7 },
  { texto: 'No sabe o no es posible precisarlo', valor: 0, especial: true },
];
const SINTOMAS_INTESTINO = [
  { id: 'pujo', texto: 'Esfuerzo excesivo para evacuar' },
  { id: 'incompleta', texto: 'Sensación de evacuación incompleta' },
  { id: 'bloqueo', texto: 'Sensación de obstrucción anorrectal' },
  { id: 'maniobras', texto: 'Necesita maniobras manuales para evacuar' },
];
const LAXANTES = [
  { id: 'fibra', texto: 'Fibra o formadores de bolo' },
  { id: 'osmotico', texto: 'Osmótico (p. ej., polietilenglicol, lactulosa)' },
  { id: 'estimulante', texto: 'Estimulante (p. ej., senósidos, bisacodilo)' },
  { id: 'emoliente', texto: 'Emoliente o lubricante' },
  { id: 'rectal', texto: 'Supositorios o enemas' },
];
const ALARMA_INTESTINO = [
  { id: 'sangre', texto: 'Sangre en las heces o melena' },
  { id: 'peso', texto: 'Pérdida de peso no intencional' },
  { id: 'cambio', texto: 'Cambio reciente y persistente del hábito intestinal' },
  { id: 'anemia', texto: 'Anemia conocida sin causa aclarada' },
  { id: 'obstruccion', texto: 'Distensión abdominal con vómito o sin expulsión de gases' },
  { id: 'rebosamiento', texto: 'Escurrimiento de heces líquidas en una persona con estreñimiento' },
];

export const funcionIntestinal = {
  id: 'intestinal',
  nombre: 'Función intestinal: registro clínico',
  corto: 'Función intestinal',
  dominio: 'continencia',
  tipo: 'lista',
  aliases: ['estrenimiento', 'Bristol', 'impactacion fecal', 'incontinencia fecal', 'laxantes', 'evacuaciones', 'fecaloma'],
  problemas: ['estreñimiento', 'impactación fecal', 'incontinencia fecal', 'uso de laxantes'],
  descripcion: 'Frecuencia y forma de las evacuaciones (Bristol, en texto), síntomas, incontinencia fecal, laxantes y datos de alarma. Sin puntaje.',
  objetivo: 'Documentar la función intestinal y distinguir los datos que orientan a estreñimiento, impactación fecal o incontinencia fecal, sin establecer un diagnóstico.',
  poblacion: 'Personas mayores en la comunidad, en hospitalización o en cuidados de largo plazo.',
  aplicacion: [
    'Pregunta por las últimas 2 a 4 semanas; si hay quien cuida, completa con su información.',
    'Forma de las heces: describe los 7 tipos de la escala de Bristol con palabras; Huella no reproduce sus imágenes.',
    'El estreñimiento, la impactación fecal y la incontinencia fecal son problemas distintos que pueden coexistir.',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  campos: [
    { id: 'frecuencia', tipo: 'numero', texto: 'Evacuaciones por semana', unidad: 'por semana', min: 0, max: 50, entero: true },
    { id: 'bristol', texto: 'Forma predominante de las heces (escala de Bristol)', textoCorto: 'forma de las heces', puntua: false, opciones: BRISTOL },
    { id: 'sintomas', tipo: 'checklist', texto: 'Síntomas al evacuar', opciones: SINTOMAS_INTESTINO },
    { id: 'incontinencia', tipo: 'numero', texto: 'Episodios de incontinencia fecal por semana', unidad: 'por semana', min: 0, max: 50, entero: true },
    { id: 'laxantes', tipo: 'checklist', texto: 'Laxantes en uso', opciones: LAXANTES },
    { id: 'alarma', tipo: 'checklist', texto: 'Datos de alarma', opciones: ALARMA_INTESTINO },
  ],
  bandas: [
    { id: 'alarma', rango: 'Algún dato de alarma', etiqueta: 'Con datos de alarma', nivel: 'grave', hallazgo: true, texto: `Hay datos de alarma. ${ALARMA}` },
    { id: 'hallazgos', rango: 'Hallazgos sin datos de alarma', etiqueta: 'Hallazgos intestinales registrados', nivel: 'moderado', hallazgo: true, texto: 'Hay hallazgos intestinales sin datos de alarma. Orientan la valoración; no establecen un diagnóstico.' },
    { id: 'sin', rango: 'Sin hallazgos', etiqueta: 'Sin hallazgos intestinales', nivel: 'bien', texto: 'Sin hallazgos en las preguntas registradas.' },
  ],
  calcular({ v }) {
    const b = v.bristol.valor;
    const s = SINTOMAS_INTESTINO.filter((o) => v.sintomas.includes(o.id)).map((o) => o.texto.toLowerCase());
    const lax = LAXANTES.filter((o) => v.laxantes.includes(o.id)).map((o) => o.texto.toLowerCase());
    const a = ALARMA_INTESTINO.filter((o) => v.alarma.includes(o.id));
    const datosEstrenimiento = [
      v.frecuencia < 3 ? `${v.frecuencia} evacuaciones por semana` : '',
      b === 1 || b === 2 ? 'heces duras (Bristol 1 o 2)' : '',
      ...s,
    ].filter(Boolean);
    const lineas = [`Evacuaciones: ${v.frecuencia} por semana; forma predominante: ${b ? `Bristol tipo ${b}` : 'no precisada'}.`];
    if (datosEstrenimiento.length) lineas.push(`Datos que orientan a estreñimiento: ${datosEstrenimiento.join('; ')}.`);
    if (v.incontinencia > 0) lineas.push(`Incontinencia fecal: ${v.incontinencia} ${v.incontinencia === 1 ? 'episodio' : 'episodios'} por semana.`);
    if (lax.length) lineas.push(`Laxantes: ${lax.join('; ')}.`);
    const posibleImpactacion = v.alarma.includes('rebosamiento') || v.alarma.includes('obstruccion');
    if (posibleImpactacion) lineas.push('Los datos registrados pueden corresponder a impactación fecal (incluido el escurrimiento por rebosamiento): requiere exploración, incluido el tacto rectal, antes de tratar una «diarrea» o una incontinencia.');
    if (a.length) lineas.push(`Datos de alarma: ${a.map((o) => o.texto.toLowerCase()).join('; ')}. ${ALARMA}`);
    const hay = datosEstrenimiento.length || v.incontinencia > 0 || b >= 6;
    const banda = a.length ? intestinoBandas.alarma : hay ? intestinoBandas.hallazgos : intestinoBandas.sin;
    const sug = [];
    if (datosEstrenimiento.length) sug.push('Revisar medicamentos que estriñen (opioides, anticolinérgicos, calcio, hierro), ingesta de líquidos y fibra, movilidad y acceso al baño.');
    if (v.incontinencia > 0) sug.push('Evaluar la incontinencia fecal: consistencia de las heces, impactación, función del esfínter, movilidad y cognición.');
    if (lax.length > 1) sug.push('Hay varios laxantes en uso: revisar su indicación y eficacia con la persona y el médico tratante.');
    return {
      banda: { ...banda, sugerencias: sug }, mostrar: banda.id === 'alarma' ? 'Con alarma' : banda.id === 'hallazgos' ? 'Hallazgos' : 'Sin hallazgos',
      lineas, lineasNota: lineas, extras: { frecuencia: v.frecuencia, bristol: b || null, incontinencia: v.incontinencia, posibleImpactacion },
    };
  },
  resumen: (res) => `Función intestinal: ${res.banda.etiqueta.toLowerCase()}.`,
  resumenBreve: (res) => `Función intestinal: ${res.banda.etiqueta.toLowerCase()}`,
  notas: [
    'Formulario clínico de Huella, no es un instrumento validado ni aplica criterios diagnósticos (p. ej., Roma IV).',
    'Escala de Bristol (Lewis y Heaton, 1997): se usan descripciones propias en texto; las imágenes originales tienen titular de derechos y no se reproducen.',
    'La incontinencia con heces líquidas en una persona con estreñimiento puede deberse a impactación (rebosamiento).',
  ],
  referencias: [
    { texto: 'Lewis SJ, Heaton KW. Stool form scale as a useful guide to intestinal transit time. Scand J Gastroenterol. 1997;32(9):920-4.', doi: '10.3109/00365529709011203' },
    { texto: 'National Institute for Health and Care Excellence. Faecal incontinence in adults: management (CG49). London: NICE; 2007.', enlace: 'https://www.nice.org.uk/guidance/cg49' },
  ],
};
const intestinoBandas = Object.fromEntries(funcionIntestinal.bandas.map((b) => [b.id, b]));

export const ESCALAS_CONTINENCIA = [iciq, sintomasUrinarios, diarioMiccional, funcionIntestinal];
