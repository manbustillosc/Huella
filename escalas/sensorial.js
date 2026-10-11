// Salud sensorial y oral: agudeza visual y audiometría con las categorías de la OMS, HHIE-S y OHAT como registro,
// y una revisión clínica breve de la boca. Una prueba en pantalla sin calibrar no equivale a un examen ocular.

/* ---------- Agudeza visual (categorías de la CIE-11) ---------- */

const T_LEVE = 6 / 12;
const T_MODERADA = 6 / 18;
const T_GRAVE = 6 / 60;
const T_CEGUERA = 3 / 60;
const AGUDEZAS = [
  ['20/20 (6/6)', 20 / 20], ['20/25 (6/7.5)', 20 / 25], ['20/30 (6/9)', 20 / 30], ['20/40 (6/12)', 20 / 40],
  ['20/50 (6/15)', 20 / 50], ['20/60 (6/18)', 20 / 60], ['20/70 (6/21)', 20 / 70], ['20/80 (6/24)', 20 / 80],
  ['20/100 (6/30)', 20 / 100], ['20/200 (6/60)', 20 / 200], ['20/400 (3/60)', 20 / 400],
  ['Cuenta dedos', 0.02], ['Movimiento de manos', 0.005], ['Percepción de luz', 0.002], ['Sin percepción de luz', 0],
].map(([texto, valor]) => ({ texto, valor }));
const OP_OJO = [...AGUDEZAS, { texto: 'No se pudo medir en este ojo', valor: -1, especial: true }];

const B_VA = {
  sin: { id: 'sin', rango: '6/12 o mejor', etiqueta: 'Sin deficiencia visual de lejos', nivel: 'bien', texto: 'Agudeza visual de presentación en el mejor ojo de 6/12 o mejor.' },
  leve: { id: 'leve', rango: 'Peor que 6/12 y hasta 6/18', etiqueta: 'Deficiencia visual de lejos leve', nivel: 'leve', hallazgo: true, texto: 'Agudeza en el mejor ojo peor que 6/12 y de 6/18 o mejor (CIE-11).' },
  moderada: { id: 'moderada', rango: 'Peor que 6/18 y hasta 6/60', etiqueta: 'Deficiencia visual de lejos moderada', nivel: 'moderado', hallazgo: true, texto: 'Agudeza en el mejor ojo peor que 6/18 y de 6/60 o mejor (CIE-11).' },
  grave: { id: 'grave', rango: 'Peor que 6/60 y hasta 3/60', etiqueta: 'Deficiencia visual de lejos grave', nivel: 'grave', hallazgo: true, texto: 'Agudeza en el mejor ojo peor que 6/60 y de 3/60 o mejor (CIE-11).' },
  ceguera: { id: 'ceguera', rango: 'Peor que 3/60', etiqueta: 'Ceguera', nivel: 'critico', hallazgo: true, texto: 'Agudeza en el mejor ojo peor que 3/60 (CIE-11).' },
};
const SUG_VISION = ['Referencia para evaluación integral visual y ocular: refracción, catarata, glaucoma, retinopatía y degeneración macular.', 'Valorar productos de apoyo para baja visión, iluminación y riesgo de caídas.'];
export const categoriaVisual = (v) => (v >= T_LEVE ? 'sin' : v >= T_MODERADA ? 'leve' : v >= T_GRAVE ? 'moderada' : v >= T_CEGUERA ? 'grave' : 'ceguera');

export const agudezaVisual = {
  id: 'agudeza',
  nombre: 'Agudeza visual de presentación (categorías de la OMS)',
  corto: 'Agudeza visual',
  dominio: 'sensorial',
  tipo: 'evaluacion',
  aliases: ['vision', 'Snellen', 'optotipos', 'cartilla', 'lentes', 'gafas', 'baja vision', 'ceguera', 'presbicia'],
  problemas: ['deficiencia visual', 'baja visión', 'cataratas', 'caídas'],
  descripcion: 'Registro de la agudeza visual de lejos por ojo y de la visión de cerca, clasificada según la CIE-11.',
  objetivo: 'Clasificar la deficiencia visual de lejos y de cerca con la agudeza de presentación (con la corrección habitual).',
  poblacion: 'Adultos y personas mayores; la clasificación de la CIE-11 se usa en el Informe mundial sobre la visión de la OMS.',
  aplicacion: [
    'Mide cada ojo por separado con la corrección que la persona usa habitualmente (agudeza de presentación), con una cartilla estandarizada a la distancia indicada y buena iluminación.',
    'Registra la línea más pequeña que lee correctamente; si no ve la línea más grande, registra cuenta dedos, movimiento de manos o percepción de luz.',
    'Visión de cerca: a 40 cm con ambos ojos y su corrección habitual.',
    'Una aplicación o una cartilla en pantalla sin calibrar no equivale a una medición estandarizada ni a un examen ocular.',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  campos: [
    {
      id: 'metodo', texto: 'Cartilla', textoCorto: 'cartilla', puntua: false,
      opciones: [
        { texto: 'Snellen a 6 m (20 pies)', valor: 0 },
        { texto: 'Tabla de la OMS o de «E» a 3 m', valor: 1 },
        { texto: 'Otra cartilla estandarizada', valor: 2 },
        { texto: 'Aplicación o pantalla', valor: 3, detalle: 'Solo orientativa; no equivale a una medición estandarizada.' },
      ],
    },
    {
      id: 'correccion', texto: 'Corrección durante la prueba', textoCorto: 'corrección', puntua: false,
      opciones: [
        { texto: 'Con sus lentes habituales', valor: 1 },
        { texto: 'Sin lentes (no usa)', valor: 0 },
        { texto: 'Sin lentes (los usa, pero no los tenía)', valor: 2 },
      ],
    },
    { id: 'od', texto: 'Ojo derecho, de lejos', textoCorto: 'ojo derecho', puntua: false, opciones: OP_OJO },
    { id: 'oi', texto: 'Ojo izquierdo, de lejos', textoCorto: 'ojo izquierdo', puntua: false, opciones: OP_OJO },
    {
      id: 'cerca', texto: 'Visión de cerca (40 cm, ambos ojos)', textoCorto: 'visión de cerca', puntua: false,
      opciones: [
        { texto: 'Lee N6 o equivalente', valor: 1 },
        { texto: 'No lee N6', valor: 0 },
        { texto: 'No se evaluó', valor: -1, especial: true },
      ],
    },
  ],
  validar({ v }) {
    if (v.od?.valor === -1 && v.oi?.valor === -1) return { oi: 'Se necesita la agudeza de al menos un ojo para clasificar.' };
    return null;
  },
  bandas: [B_VA.sin, B_VA.leve, B_VA.moderada, B_VA.grave, B_VA.ceguera],
  calcular({ v }) {
    const ojos = [['derecho', v.od], ['izquierdo', v.oi]].filter(([, o]) => o.valor >= 0);
    const mejor = Math.max(...ojos.map(([, o]) => o.valor));
    const banda = B_VA[categoriaVisual(mejor)];
    const lineas = [`Agudeza de presentación: ojo derecho ${v.od.texto.toLowerCase()}, ojo izquierdo ${v.oi.texto.toLowerCase()} (${v.correccion.texto.toLowerCase()}).`];
    const peor = ojos.filter(([, o]) => o.valor < T_LEVE).map(([n]) => n);
    if (banda.id === 'sin' && peor.length) lineas.push(`El ojo ${peor.join(' y ')} tiene una agudeza peor que 6/12: aunque el mejor ojo no tenga deficiencia, requiere evaluación (el criterio de ICOPE se aplica a cada ojo).`);
    if (ojos.length < 2) lineas.push('Solo se midió un ojo: la clasificación se basa en él.');
    let cerca = null;
    if (v.cerca.valor === 0) { cerca = true; lineas.push('Visión de cerca peor que N6 a 40 cm con la corrección habitual: deficiencia visual de cerca (CIE-11).'); }
    if (v.cerca.valor === 1) cerca = false;
    if (v.correccion.valor === 2) lineas.push('Se midió sin los lentes que usa habitualmente: la agudeza puede subestimar su visión con corrección.');
    if (v.metodo.valor === 3) lineas.push('Medida con una aplicación o pantalla: orientativa, no equivale a una medición estandarizada.');
    const hallazgo = banda.hallazgo || peor.length || cerca;
    const sugerencias = hallazgo ? SUG_VISION : [];
    if (cerca) sugerencias.unshift('Valorar la corrección de cerca (gafas de lectura) y referir si no mejora.');
    return {
      banda: { ...banda, hallazgo: Boolean(hallazgo), sugerencias }, mostrar: { sin: 'Sin deficiencia', leve: 'Leve', moderada: 'Moderada', grave: 'Grave', ceguera: 'Ceguera' }[banda.id],
      lineas, lineasNota: lineas, extras: { mejor, cerca, unilateral: banda.id === 'sin' && peor.length > 0 },
    };
  },
  resumen: (res) => `Agudeza visual: ${res.banda.etiqueta.toLowerCase()}${res.extras.cerca ? '; deficiencia visual de cerca' : ''}${res.extras.unilateral ? '; agudeza peor que 6/12 en un ojo' : ''}.`,
  resumenBreve: (res) => `Agudeza visual: ${res.banda.etiqueta.toLowerCase()}`,
  notas: [
    'Categorías de la CIE-11 con la agudeza de presentación del mejor ojo: leve, peor que 6/12; moderada, peor que 6/18; grave, peor que 6/60; ceguera, peor que 3/60. Deficiencia de cerca: peor que N6 o M0.8 a 40 cm con la corrección habitual.',
    'Clasifica la agudeza; no identifica la causa. La pérdida visual súbita, el ojo rojo doloroso o la diplopía nueva requieren atención urgente.',
  ],
  referencias: [
    { texto: 'World Health Organization. World report on vision. Geneva: WHO; 2019.', enlace: 'https://www.who.int/publications/i/item/9789241516570' },
    { texto: 'Organización Panamericana de la Salud. Manual de atención integrada para las personas mayores (ICOPE). 2.ª ed. Washington, D.C.: OPS; 2025. Capítulo 8: visión.', doi: '10.37774/9789275330319' },
  ],
};

/* ---------- Audiometría tonal (grados de la OMS) ---------- */

const GRADOS = [
  { id: 'normal', max: 20, etiqueta: 'Audición normal', nivel: 'bien', rango: 'Menos de 20 dB' },
  { id: 'leve', max: 35, etiqueta: 'Pérdida auditiva leve', nivel: 'leve', rango: '20 a menos de 35 dB' },
  { id: 'moderada', max: 50, etiqueta: 'Pérdida auditiva moderada', nivel: 'moderado', rango: '35 a menos de 50 dB' },
  { id: 'moderada_grave', max: 65, etiqueta: 'Pérdida auditiva moderadamente grave', nivel: 'moderado', rango: '50 a menos de 65 dB' },
  { id: 'grave', max: 80, etiqueta: 'Pérdida auditiva grave', nivel: 'grave', rango: '65 a menos de 80 dB' },
  { id: 'profunda', max: 95, etiqueta: 'Pérdida auditiva profunda', nivel: 'grave', rango: '80 a menos de 95 dB' },
  { id: 'completa', max: Infinity, etiqueta: 'Pérdida auditiva completa', nivel: 'critico', rango: '95 dB o más' },
];
export const gradoAuditivo = (db) => GRADOS.find((g) => db < g.max);
const B_AUD = Object.fromEntries(GRADOS.map((g) => [g.id, { id: g.id, rango: g.rango, etiqueta: g.etiqueta, nivel: g.nivel, hallazgo: g.id !== 'normal', texto: `${g.etiqueta}: promedio de tonos puros en el mejor oído de ${g.rango.toLowerCase()} (grados de la OMS, 2021).` }]));
B_AUD.unilateral = { id: 'unilateral', rango: 'Mejor oído <20 dB y peor oído ≥35 dB', etiqueta: 'Pérdida auditiva unilateral', nivel: 'moderado', hallazgo: true, texto: 'Mejor oído con menos de 20 dB y peor oído con 35 dB o más (OMS, 2021). Una pérdida asimétrica requiere evaluación otológica.' };

export const audiometria = {
  id: 'audiometria',
  nombre: 'Audiometría tonal: grado de pérdida auditiva (OMS)',
  corto: 'Audiometría',
  dominio: 'sensorial',
  tipo: 'evaluacion',
  aliases: ['audicion', 'hipoacusia', 'sordera', 'audifonos', 'PTA', 'promedio de tonos puros', 'presbiacusia'],
  problemas: ['pérdida auditiva', 'hipoacusia', 'audífonos'],
  descripcion: 'Registro del promedio de tonos puros de cada oído (0.5, 1, 2 y 4 kHz) y del uso de audífonos; grado según la OMS (2021).',
  objetivo: 'Clasificar el grado de pérdida auditiva a partir de una audiometría tonal realizada por personal capacitado.',
  poblacion: 'Adultos con audiometría tonal; los grados de la OMS se diseñaron sobre todo para uso epidemiológico.',
  aplicacion: [
    'Registra el promedio de tonos puros por vía aérea de cada oído: la media de los umbrales a 0.5, 1, 2 y 4 kHz.',
    'El grado se asigna con el mejor oído; se señala la pérdida unilateral o asimétrica.',
  ],
  tiempo: '1 min (registro)',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'mejor umbral auditivo',
  textoEmpeoramiento: 'peor umbral auditivo',
  unidadCambio: 'dB',
  decimalesCambio: 1,
  barra: false,
  detalleEnResumen: true,
  campos: [
    { id: 'od', tipo: 'numero', texto: 'Oído derecho: promedio de tonos puros', unidad: 'dB HL', min: -10, max: 130, decimales: 1 },
    { id: 'oi', tipo: 'numero', texto: 'Oído izquierdo: promedio de tonos puros', unidad: 'dB HL', min: -10, max: 130, decimales: 1 },
    {
      id: 'audifonos', texto: 'Audífonos', textoCorto: 'audífonos', puntua: false,
      opciones: [{ texto: 'No tiene', valor: 0 }, { texto: 'Tiene y los usa', valor: 1 }, { texto: 'Tiene, pero no los usa', valor: 2 }],
    },
  ],
  bandas: [...GRADOS.map((g) => B_AUD[g.id]), B_AUD.unilateral],
  calcular({ v }) {
    const mejor = Math.min(v.od, v.oi);
    const peor = Math.max(v.od, v.oi);
    let banda = B_AUD[gradoAuditivo(mejor).id];
    if (mejor < 20 && peor >= 35) banda = B_AUD.unilateral;
    const lineas = [`Promedio de tonos puros: oído derecho ${v.od} dB HL, oído izquierdo ${v.oi} dB HL; mejor oído ${mejor} dB HL.`];
    if (peor - mejor >= 15 && banda.id !== 'unilateral') lineas.push(`Diferencia de ${Number((peor - mejor).toFixed(1))} dB entre oídos: valorar asimetría con evaluación otológica.`);
    if (v.audifonos.valor === 2) lineas.push('Tiene audífonos, pero no los usa: explorar el motivo (ajuste, molestias, mantenimiento, costo).');
    if (v.audifonos.valor === 1) lineas.push('Usa audífonos.');
    const sugerencias = banda.hallazgo
      ? ['Valorar audífonos u otros productos de apoyo auditivo y estrategias de comunicación.', 'La indicación de audífonos considera también la audiometría verbal y las dificultades de comunicación, no solo el grado.']
      : [];
    return { valor: mejor, unidad: 'dB HL', mostrar: String(mejor), sufijo: 'dB HL', banda: { ...banda, sugerencias }, lineas, lineasNota: lineas.slice(1), extras: { od: v.od, oi: v.oi, audifonos: v.audifonos.valor } };
  },
  resumen: (res) => `Audiometría: ${res.banda.etiqueta.toLowerCase()} (mejor oído ${res.mostrar} dB HL; derecho ${res.extras.od}, izquierdo ${res.extras.oi})${res.extras.audifonos === 1 ? '; usa audífonos' : res.extras.audifonos === 2 ? '; tiene audífonos, pero no los usa' : ''}.`,
  resumenBreve: (res) => `Audiometría: ${res.banda.etiqueta.toLowerCase()} (${res.mostrar} dB HL)`,
  notas: [
    'Grados de la OMS (Informe mundial sobre la audición, 2021) con el promedio de 0.5, 1, 2 y 4 kHz en el mejor oído: normal <20; leve 20 a <35; moderada 35 a <50; moderadamente grave 50 a <65; grave 65 a <80; profunda 80 a <95; completa ≥95 dB. Unilateral: mejor oído <20 y peor oído ≥35 dB.',
    'Los grados se usan sobre todo con fines epidemiológicos; la decisión clínica considera la audiometría verbal y las dificultades de comunicación.',
    'La pérdida súbita, unilateral o asimétrica, el dolor de oído, la otorrea o el mareo requieren evaluación otológica.',
  ],
  referencias: [
    { texto: 'World Health Organization. World report on hearing. Geneva: WHO; 2021.', enlace: 'https://www.who.int/publications/i/item/9789240020481' },
  ],
};

/* ---------- HHIE-S (registro) ---------- */

export const hhies = {
  id: 'hhies',
  nombre: 'HHIE-S: discapacidad auditiva percibida (versión de tamizaje)',
  corto: 'HHIE-S',
  dominio: 'sensorial',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['Hearing Handicap Inventory for the Elderly', 'audicion', 'hipoacusia', 'discapacidad auditiva', 'Ventry', 'Weinstein'],
  problemas: ['pérdida auditiva', 'discapacidad auditiva', 'aislamiento'],
  descripcion: 'Registro del puntaje oficial de 10 reactivos (0, 2 o 4 cada uno): 0 a 40.',
  objetivo: 'Identificar la repercusión emocional y social percibida de la pérdida auditiva.',
  poblacion: 'Personas mayores en la comunidad y en atención primaria (Lichtenstein et al., 1988).',
  aplicacion: [
    'Aplica la versión oficial; Huella no reproduce los reactivos.',
    'Cada reactivo vale 0, 2 o 4 puntos: el puntaje total siempre es par.',
  ],
  tiempo: '2 a 5 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor discapacidad auditiva percibida',
  textoEmpeoramiento: 'mayor discapacidad auditiva percibida',
  min: 0,
  max: 40,
  campos: [{ id: 'puntaje', tipo: 'numero', texto: 'Puntaje total (0 a 40, par)', unidad: 'puntos', min: 0, max: 40, entero: true }],
  validar({ v }) {
    return Number.isFinite(v.puntaje) && v.puntaje % 2 !== 0 ? { puntaje: 'El puntaje del HHIE-S siempre es par (cada reactivo vale 0, 2 o 4).' } : null;
  },
  bandas: [
    { min: 0, max: 8, etiqueta: 'Sin discapacidad auditiva percibida', nivel: 'bien', texto: 'Puntaje 0 a 8: menor probabilidad de pérdida auditiva (razón de verosimilitud 0.36; Lichtenstein et al., 1988). No la descarta.' },
    { min: 10, max: 24, etiqueta: 'Discapacidad auditiva leve a moderada', nivel: 'moderado', hallazgo: true, texto: 'Puntaje 10 a 24 (Ventry y Weinstein, 1983).', sugerencias: ['Evaluación auditiva: otoscopia y audiometría.'] },
    { min: 26, max: 40, etiqueta: 'Discapacidad auditiva significativa', nivel: 'grave', hallazgo: true, texto: 'Puntaje 26 a 40: alta probabilidad de pérdida auditiva (razón de verosimilitud 12; Lichtenstein et al., 1988).', sugerencias: ['Evaluación auditiva: otoscopia y audiometría; valorar audífonos y estrategias de comunicación.'] },
  ],
  calcular: ({ v }) => ({ puntaje: v.puntaje }),
  notas: [
    'Categorías de Ventry y Weinstein (1983): 0–8 sin discapacidad; 10–24 leve a moderada; 26–40 significativa.',
    'Mide la discapacidad percibida, no el umbral auditivo: complementa, no sustituye, a la audiometría.',
  ],
  licencia: { texto: 'HHIE-S © Ventry y Weinstein. Huella solo registra el puntaje y no reproduce los reactivos.' },
  referencias: [
    { texto: 'Ventry IM, Weinstein BE. Identification of elderly people with hearing problems. ASHA. 1983;25(7):37-42.' },
    { texto: 'Lichtenstein MJ, Bess FH, Logan SA. Validation of screening tools for identifying hearing-impaired elderly in primary care. JAMA. 1988;259(19):2875-8.' },
  ],
};

/* ---------- OHAT (registro por categoría) ---------- */

const CATEGORIAS_OHAT = [
  ['labios', 'Labios'], ['lengua', 'Lengua'], ['encias', 'Encías y tejidos'], ['saliva', 'Saliva'],
  ['dientes', 'Dientes naturales'], ['protesis', 'Prótesis'], ['limpieza', 'Limpieza oral'], ['dolor', 'Dolor dental'],
];
const OP_OHAT = [{ texto: '0 · Sano', valor: 0 }, { texto: '1 · Cambios', valor: 1 }, { texto: '2 · No sano', valor: 2 }];

export const ohat = {
  id: 'ohat',
  nombre: 'OHAT: evaluación de la salud oral',
  corto: 'OHAT',
  dominio: 'sensorial',
  tipo: 'evaluacion',
  registro: true,
  aliases: ['Oral Health Assessment Tool', 'salud bucal', 'boca', 'dientes', 'protesis dental', 'Chalmers'],
  problemas: ['salud bucal', 'caries', 'prótesis dental', 'dolor dental', 'boca seca'],
  descripcion: 'Registro de la calificación de las 8 categorías del formato oficial (0 sano, 1 cambios, 2 no sano): 0 a 16.',
  objetivo: 'Documentar el estado de la salud oral observado por personal de salud o cuidadores capacitados, incluso en personas con demencia.',
  poblacion: 'Personas mayores en residencias y cuidados de largo plazo, incluidas personas con deterioro cognitivo (Chalmers et al., 2005).',
  aplicacion: [
    'Califica cada categoría con los descriptores del formato oficial OHAT (Chalmers et al., 2005). Huella no reproduce los descriptores.',
    'Registra aquí la calificación de cada categoría.',
  ],
  tiempo: '5 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'mejor salud oral observada',
  textoEmpeoramiento: 'peor salud oral observada',
  min: 0,
  max: 16,
  campos: CATEGORIAS_OHAT.map(([id, texto]) => ({ id, texto, textoCorto: texto.toLowerCase(), puntua: false, opciones: OP_OHAT })),
  bandas: [
    { id: 'sano', rango: 'Todas las categorías en 0', etiqueta: 'Todas las categorías sanas', nivel: 'bien', texto: 'Todas las categorías calificadas como sanas.' },
    { id: 'cambios', rango: 'Alguna categoría en 1', etiqueta: 'Categorías con cambios', nivel: 'leve', hallazgo: true, texto: 'Hay categorías con cambios y ninguna calificada como no sana.' },
    { id: 'no_sano', rango: 'Alguna categoría en 2', etiqueta: 'Categorías no sanas', nivel: 'moderado', hallazgo: true, texto: 'Hay al menos una categoría calificada como no sana.' },
  ],
  calcular({ v }) {
    const total = CATEGORIAS_OHAT.reduce((s, [id]) => s + v[id].valor, 0);
    const con = (n) => CATEGORIAS_OHAT.filter(([id]) => v[id].valor === n).map(([, t]) => t.toLowerCase());
    const noSanas = con(2);
    const cambios = con(1);
    const banda = noSanas.length ? ohat.bandas[2] : cambios.length ? ohat.bandas[1] : ohat.bandas[0];
    const lineas = [];
    if (noSanas.length) lineas.push(`No sano: ${noSanas.join(', ')}.`);
    if (cambios.length) lineas.push(`Con cambios: ${cambios.join(', ')}.`);
    const sugerencias = banda.hallazgo ? ['El formato OHAT incluye la decisión de referencia a odontología: la toma el equipo tratante.', 'Revisar la higiene oral diaria, la ayuda que necesita y el estado de las prótesis.'] : [];
    return { puntaje: total, banda: { ...banda, sugerencias }, lineas, lineasNota: lineas, extras: { noSanas, cambios } };
  },
  notas: [
    'El OHAT no define puntos de corte para el total: Huella informa las categorías con cambios o no sanas en lugar de clasificar el total.',
    'Registra solo calificaciones obtenidas con los descriptores del formato oficial.',
  ],
  licencia: { texto: 'OHAT: Chalmers et al., Australian Dental Journal (2005). Huella registra las calificaciones y no reproduce los descriptores.' },
  referencias: [
    { texto: 'Chalmers JM, King PL, Spencer AJ, Wright FAC, Carter KD. The oral health assessment tool—validity and reliability. Aust Dent J. 2005;50(3):191-9.', doi: '10.1111/j.1834-7819.2005.tb00360.x' },
  ],
};

/* ---------- Revisión clínica breve de la boca ---------- */

const HALLAZGOS_BOCA = [
  { id: 'dolor', texto: 'Dolor dental u oral' },
  { id: 'dientes', texto: 'Dientes rotos, flojos o con caries visibles' },
  { id: 'encias', texto: 'Encías inflamadas o que sangran' },
  { id: 'seca', texto: 'Boca seca' },
  { id: 'masticar', texto: 'Dificultad para masticar' },
  { id: 'higiene', texto: 'Higiene oral deficiente o necesita ayuda para hacerla' },
  { id: 'protesis_mal', texto: 'Prótesis mal ajustada, rota o que causa dolor' },
  { id: 'protesis_no', texto: 'Tiene prótesis, pero no la usa' },
  { id: 'edentulo', texto: 'Sin dientes naturales y sin prótesis funcional' },
];
const ALARMA_BOCA = [
  { id: 'lesion', texto: 'Úlcera, placa blanca o roja, o bulto en la boca sin explicación que dura más de 3 semanas' },
  { id: 'infeccion', texto: 'Inflamación de la cara o del cuello, o fiebre con dolor dental' },
];

export const saludBucal = {
  id: 'bucal',
  nombre: 'Salud bucal: revisión clínica breve',
  corto: 'Revisión bucal',
  dominio: 'sensorial',
  tipo: 'lista',
  aliases: ['boca', 'dientes', 'protesis', 'dentadura', 'encias', 'xerostomia', 'odontologia'],
  problemas: ['salud bucal', 'prótesis dental', 'dolor dental', 'dificultad para masticar', 'boca seca'],
  descripcion: 'Hallazgos de la boca, prótesis, última visita al dentista y datos de alarma. Sin puntaje.',
  objetivo: 'Documentar problemas bucales que afectan la alimentación, el dolor y la calidad de vida, y orientar la referencia a odontología.',
  poblacion: 'Personas mayores en cualquier nivel de atención.',
  aplicacion: [
    'Pregunta por molestias y observa la boca con buena luz; retira las prótesis para revisar la mucosa.',
    'Marca los hallazgos presentes o confirma que no hay ninguno.',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  campos: [
    { id: 'hallazgos', tipo: 'checklist', texto: 'Hallazgos', opciones: HALLAZGOS_BOCA },
    {
      id: 'dentista', texto: 'Última visita al dentista', textoCorto: 'última visita al dentista', puntua: false,
      opciones: [{ texto: 'Hace menos de 1 año', valor: 0 }, { texto: 'Hace 1 a 2 años', valor: 1 }, { texto: 'Hace más de 2 años o no recuerda', valor: 2 }],
    },
    { id: 'alarma', tipo: 'checklist', texto: 'Datos de alarma', opciones: ALARMA_BOCA },
  ],
  bandas: [
    { id: 'alarma', rango: 'Algún dato de alarma', etiqueta: 'Con datos de alarma', nivel: 'grave', hallazgo: true, texto: 'Hay datos de alarma que requieren evaluación pronta por odontología, estomatología o el médico.' },
    { id: 'hallazgos', rango: 'Hallazgos sin alarma', etiqueta: 'Problemas bucales registrados', nivel: 'moderado', hallazgo: true, texto: 'Hay problemas bucales que conviene atender.' },
    { id: 'sin', rango: 'Sin hallazgos', etiqueta: 'Sin problemas bucales referidos', nivel: 'bien', texto: 'Sin hallazgos en la revisión breve.' },
  ],
  calcular({ v }) {
    const h = HALLAZGOS_BOCA.filter((o) => v.hallazgos.includes(o.id)).map((o) => o.texto.toLowerCase());
    const a = ALARMA_BOCA.filter((o) => v.alarma.includes(o.id)).map((o) => o.texto.toLowerCase());
    const lineas = [];
    if (h.length) lineas.push(`Hallazgos: ${h.join('; ')}.`);
    lineas.push(`Última visita al dentista: ${v.dentista.texto.toLowerCase()}.`);
    if (a.length) lineas.push(`Datos de alarma: ${a.join('; ')}.`);
    const banda = a.length ? saludBucal.bandas[0] : h.length ? saludBucal.bandas[1] : saludBucal.bandas[2];
    const sug = [];
    if (v.alarma.includes('lesion')) sug.push('Lesión de la boca sin explicación que dura más de 3 semanas: referencia pronta para descartar cáncer oral (NICE NG12).');
    if (v.alarma.includes('infeccion')) sug.push('Inflamación facial o fiebre con dolor dental: valoración médica u odontológica urgente.');
    if (h.length || v.dentista.valor === 2) sug.push('Referir a odontología para revisión y tratamiento.');
    if (v.hallazgos.includes('masticar') || v.hallazgos.includes('edentulo')) sug.push('Valorar la repercusión en la nutrición (p. ej., MNA-SF) y la textura de la dieta con personal capacitado.');
    if (v.hallazgos.includes('seca')) sug.push('Revisar medicamentos que causan boca seca (anticolinérgicos, antidepresivos, diuréticos).');
    return { banda: { ...banda, sugerencias: sug }, mostrar: banda.id === 'alarma' ? 'Con alarma' : banda.id === 'hallazgos' ? 'Con problemas' : 'Sin problemas', lineas, lineasNota: lineas, extras: { hallazgos: v.hallazgos, alarma: v.alarma } };
  },
  resumen: (res) => `Revisión bucal: ${res.banda.etiqueta.toLowerCase()}.`,
  resumenBreve: (res) => `Revisión bucal: ${res.banda.etiqueta.toLowerCase()}`,
  notas: [
    'Formulario clínico de Huella, no es un instrumento validado ni tiene puntaje.',
    'No sustituye la exploración odontológica.',
  ],
  referencias: [
    { texto: 'National Institute for Health and Care Excellence. Suspected cancer: recognition and referral (NG12). London: NICE; 2015, actualizada.', enlace: 'https://www.nice.org.uk/guidance/ng12' },
    { texto: 'National Institute for Health and Care Excellence. Oral health for adults in care homes (NG48). London: NICE; 2016.', enlace: 'https://www.nice.org.uk/guidance/ng48' },
  ],
};

export const ESCALAS_SENSORIAL = [agudezaVisual, audiometria, hhies, ohat, saludBucal];
