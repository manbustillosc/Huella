// Clasificaciones de la EPOC: grado GOLD de obstrucción, grupo GOLD A-B-E (criterios de 2026-2027),
// registro del CAAT/CAT, índice BODE y gravedad de la exacerbación (propuesta de Roma).
// Criterios publicados con redacción propia de Huella. Versión 2.17.0.

const GOLD = 'https://goldcopd.org/2026-gold-report-and-pocket-guide/';
const REF_GOLD = {
  texto: 'Global Initiative for Chronic Obstructive Lung Disease (GOLD). Global Strategy for the Prevention, Diagnosis and Management of COPD: 2027 Report.',
  enlace: GOLD,
};
const CAAT_GUIA = 'https://gaapp.org/wp-content/uploads/2024/11/CAT-and-CAAT-User-Guide-7-Nov-2024_Clean.pdf';

const n = (x) => (Number.isFinite(x) ? x : null);
const fmt = (x, d = 1) => String(Math.round(x * 10 ** d) / 10 ** d).replace(/\.0+$/, '');
const indice = (r, id) => (r[id] == null || r[id] === '' ? null : Number(r[id]));

// Grado mMRC como opciones (el valor es el grado); se reutiliza de la escala mMRC.
const OPCIONES_MMRC = [
  { texto: '0 · Solo con ejercicio intenso', valor: 0 },
  { texto: '1 · Al ir de prisa o en una cuesta', valor: 1 },
  { texto: '2 · Camina más lento o hace pausas en plano', valor: 2 },
  { texto: '3 · Para a los 100 m o a los pocos minutos', valor: 3 },
  { texto: '4 · No sale de casa o se ahoga al vestirse', valor: 4 },
];
const vinculoMmrc = (campos, extra = {}) => ({
  id: 'mmrc', escala: 'mmrc', titulo: 'Disnea mMRC',
  disponible: (res) => (Number.isFinite(res.puntaje) ? true : 'La mMRC guardada no tiene grado.'),
  describir: (res) => `mMRC ${res.puntaje}`,
  aplicar: (res) => ({ ...extra, mmrc: res.puntaje }),
  campos,
});

/* ---------- 1. Grado GOLD de obstrucción (espirometría) ---------- */

const GRADOS_GOLD = [
  { grado: 1, nombre: 'Leve', min: 80, nivel: 'leve', texto: 'FEV₁ de 80 % del predicho o más.' },
  { grado: 2, nombre: 'Moderada', min: 50, nivel: 'moderado', texto: 'FEV₁ de 50 a 79 % del predicho.' },
  { grado: 3, nombre: 'Grave', min: 30, nivel: 'grave', texto: 'FEV₁ de 30 a 49 % del predicho.' },
  { grado: 4, nombre: 'Muy grave', min: -Infinity, nivel: 'critico', texto: 'FEV₁ menor de 30 % del predicho.' },
];
const SIN_OBSTRUCCION = {
  id: 'sinobs', rango: '≥ 0.70', etiqueta: 'Sin obstrucción por el criterio GOLD', nivel: 'neutro',
  texto: 'FEV₁/FVC posbroncodilatador de 0.70 o más: no cumple el criterio espirométrico de EPOC de GOLD, así que el grado no aplica.',
  sugerencias: ['Si los síntomas y la exposición sugieren EPOC y el cociente está entre 0.60 y 0.80, repite la espirometría (GOLD 2027).'],
};

export const goldgrado = {
  id: 'goldgrado',
  nombre: 'Gravedad de la obstrucción en la EPOC (grado GOLD 1 a 4)',
  corto: 'Grado GOLD (espirometría)',
  dominio: 'disnea',
  tipo: 'estadificacion',
  aliases: ['GOLD', 'grado GOLD', 'estadio GOLD', 'espirometría', 'FEV1', 'VEF1', 'FEV1/FVC', 'obstrucción', 'EPOC', 'enfisema', 'bronquitis crónica'],
  problemas: ['EPOC', 'obstrucción al flujo aéreo', 'espirometría'],
  descripcion: 'Gravedad de la obstrucción por el FEV₁ posbroncodilatador (% del predicho) cuando el cociente FEV₁/FVC es menor de 0.70: GOLD 1 leve a GOLD 4 muy grave.',
  objetivo: 'Clasificar la gravedad de la obstrucción al flujo aéreo con la espirometría posbroncodilatador.',
  poblacion: 'Personas con EPOC confirmada por espirometría (FEV₁/FVC posbroncodilatador menor de 0.70), según GOLD.',
  aplicacion: [
    'Usa la espirometría posbroncodilatador, de calidad aceptable y en fase estable (no durante una exacerbación).',
    'Escribe el cociente FEV₁/FVC y el FEV₁ en % del predicho que reporta el estudio.',
  ],
  tiempo: '1 min',
  momentos: true,
  direccionClinica: 'menor_mejor',
  unidadCambio: ['grado', 'grados'],
  textoMejoria: 'menor obstrucción',
  textoEmpeoramiento: 'mayor obstrucción',
  min: 1,
  max: 4,
  siguientes: [
    { id: 'goldabe', si: (res) => res.valor != null, motivo: 'Completa la evaluación inicial con los síntomas y las exacerbaciones (grupo A, B o E).' },
  ],
  campos: [
    {
      id: 'cociente', tipo: 'numero', texto: 'FEV₁/FVC posbroncodilatador', decimales: 2,
      unidades: [
        { id: 'cociente', etiqueta: '(cociente, p. ej. 0.62)', min: 0.2, max: 1 },
        { id: 'pct', etiqueta: '%', min: 20, max: 100, aBase: (x) => x / 100 },
      ],
    },
    { id: 'fev1', tipo: 'numero', texto: 'FEV₁ posbroncodilatador', unidad: '% del predicho', min: 5, max: 160, decimales: 0 },
  ],
  bandas: [
    ...GRADOS_GOLD.map((g) => ({
      min: g.grado, max: g.grado, rango: `GOLD ${g.grado}`, etiqueta: `GOLD ${g.grado}: obstrucción ${g.nombre.toLowerCase()}`, nivel: g.nivel, hallazgo: true, texto: g.texto,
      sugerencias: g.grado >= 3 ? ['Valorar la oxigenación (SpO₂ en reposo y, si es baja, gasometría) y la necesidad de oxígeno en casa.'] : [],
    })),
    SIN_OBSTRUCCION,
  ],
  calcular({ v }) {
    const c = v.cociente;
    const f = v.fev1;
    if (c >= 0.7) {
      return { valor: null, mostrar: fmt(c, 2), sufijo: 'FEV₁/FVC', unidad: '', banda: SIN_OBSTRUCCION, lineas: [`FEV₁/FVC ${fmt(c, 2)}; FEV₁ ${fmt(f, 0)} % del predicho.`], extras: { cociente: c, fev1: f, grado: null } };
    }
    const g = GRADOS_GOLD.find((x) => f >= x.min);
    const lineas = [`FEV₁/FVC ${fmt(c, 2)} (menor de 0.70); FEV₁ ${fmt(f, 0)} % del predicho.`];
    if (c >= 0.6) lineas.push('Cociente entre 0.60 y 0.70: GOLD recomienda repetir la espirometría para confirmar.');
    return { valor: g.grado, mostrar: String(g.grado), sufijo: 'GOLD', unidad: '', lineas, extras: { cociente: c, fev1: f, grado: g.grado } };
  },
  resumen: (res) => (res.extras.grado == null
    ? `Espirometría: FEV₁/FVC ${fmt(res.extras.cociente, 2)}, sin obstrucción por el criterio GOLD.`
    : `Obstrucción GOLD ${res.extras.grado} (${res.banda.etiqueta.replace(/^GOLD \d: obstrucción /, '')}): FEV₁ ${fmt(res.extras.fev1, 0)} % del predicho, FEV₁/FVC ${fmt(res.extras.cociente, 2)}.`),
  resumenBreve: (res) => (res.extras.grado == null ? `FEV₁/FVC ${fmt(res.extras.cociente, 2)} (sin obstrucción)` : `GOLD ${res.extras.grado}`),
  detalleEnResumen: true,
  notas: [
    'GOLD confirma la EPOC con FEV₁/FVC posbroncodilatador menor de 0.70 en una persona con síntomas y exposición de riesgo, y gradúa la gravedad con el FEV₁ en % del predicho (informe GOLD 2027).',
    'El cociente fijo no se ajusta por la edad: en personas mayores puede clasificar como obstrucción lo que es envejecimiento pulmonar. Con valores entre 0.60 y 0.80, GOLD recomienda repetir la prueba o investigar más.',
    'El grado describe la obstrucción, no los síntomas ni el riesgo de exacerbaciones: el tratamiento inicial se guía por el grupo A, B o E.',
    'Clasificación con redacción propia de Huella.',
  ],
  licencia: { texto: 'Criterios del informe GOLD (© Global Initiative for Chronic Obstructive Lung Disease), citados como hechos y con redacción propia; Huella no reproduce figuras ni texto del informe.', enlace: GOLD },
  referencias: [REF_GOLD],
};

/* ---------- 2. Grupo GOLD A, B, E ---------- */

const MEDIDAS = [
  { texto: 'CAAT/CAT', valor: 0, clave: 'cat', detalle: 'Puntaje de 0 a 40; GOLD lo prefiere porque mide más que la disnea.' },
  { texto: 'mMRC', valor: 1, clave: 'mmrc', detalle: 'Grado de disnea de 0 a 4.' },
];

const GRUPOS = {
  A: { min: 1, max: 1, rango: 'A', etiqueta: 'Grupo A: menos síntomas, sin exacerbaciones', nivel: 'leve', hallazgo: true,
    texto: 'Sin exacerbaciones moderadas ni graves en el último año y con menos síntomas (CAAT/CAT menor de 10 o mMRC 0 a 1).',
    sugerencias: ['GOLD 2027 propone iniciar con un broncodilatador antimuscarínico de acción prolongada (LAMA) por su efecto sobre la disnea.'] },
  B: { min: 2, max: 2, rango: 'B', etiqueta: 'Grupo B: más síntomas, sin exacerbaciones', nivel: 'moderado', hallazgo: true,
    texto: 'Sin exacerbaciones moderadas ni graves en el último año y con más síntomas (CAAT/CAT de 10 o más o mMRC 2 o más).',
    sugerencias: ['GOLD 2027 propone iniciar con la combinación LABA + LAMA.', 'Buscar comorbilidades que aumenten los síntomas (insuficiencia cardiaca, ansiedad, depresión, desacondicionamiento).'] },
  E: { min: 3, max: 3, rango: 'E', etiqueta: 'Grupo E: con exacerbaciones', nivel: 'grave', hallazgo: true,
    texto: 'Una o más exacerbaciones moderadas o graves en el último año, sin importar los síntomas (criterio de GOLD desde 2026).',
    sugerencias: ['GOLD 2027 prefiere LABA + LAMA como tratamiento inicial; considerar LABA + LAMA + corticoide inhalado si los eosinófilos en sangre son de 300/µL o más.', 'Revisar la técnica de inhalación, la adherencia, las vacunas y un plan de acción para las exacerbaciones.'] },
};
const LETRA = { 1: 'A', 2: 'B', 3: 'E' };

export const goldabe = {
  id: 'goldabe',
  nombre: 'Grupo GOLD de la EPOC (A, B, E)',
  corto: 'Grupo GOLD (A, B, E)',
  dominio: 'disnea',
  tipo: 'estadificacion',
  aliases: ['GOLD ABE', 'ABE', 'grupo GOLD', 'GOLD A', 'GOLD B', 'GOLD E', 'clasificación GOLD', 'EPOC', 'exacerbaciones', 'CAT', 'CAAT', 'mMRC'],
  problemas: ['EPOC', 'exacerbaciones', 'disnea'],
  descripcion: 'Grupo A, B o E de la evaluación inicial de GOLD: exacerbaciones del último año y síntomas (CAAT/CAT o mMRC). Desde 2026, una sola exacerbación moderada ya define el grupo E.',
  objetivo: 'Clasificar a la persona con EPOC para orientar el tratamiento inicial según GOLD.',
  poblacion: 'Personas con EPOC confirmada por espirometría, al diagnóstico o al revisar el tratamiento (GOLD 2026-2027).',
  aplicacion: [
    'Cuenta las exacerbaciones moderadas (requirieron corticoide sistémico o antibiótico) y graves (hospitalización) de los últimos 12 meses; no cuentes las tratadas solo con broncodilatador de rescate.',
    'Para los síntomas usa el CAAT/CAT o la mMRC, no ambos. Si tienes los dos registrados, GOLD prefiere el CAAT/CAT.',
  ],
  tiempo: '2 min',
  momentos: true,
  direccionClinica: 'sin_direccion',
  min: 1,
  max: 3,
  vinculos: [
    {
      id: 'cat', escala: 'cat', titulo: 'CAAT/CAT',
      disponible: (res) => (Number.isFinite(res.puntaje) ? true : 'El CAAT/CAT guardado no tiene puntaje.'),
      describir: (res) => `CAAT/CAT ${res.puntaje}`,
      aplicar: (res) => ({ medida: 0, cat: String(res.puntaje) }),
      campos: ['medida', 'cat'],
    },
    vinculoMmrc(['medida', 'mmrc'], { medida: 1 }),
  ],
  campos: [
    { id: 'exacerbaciones', tipo: 'numero', texto: 'Exacerbaciones moderadas o graves en los últimos 12 meses', unidad: 'exacerbaciones', min: 0, max: 30, entero: true },
    { id: 'hospitalizaciones', tipo: 'numero', texto: 'De ellas, cuántas requirieron hospitalización (opcional)', unidad: 'hospitalizaciones', min: 0, max: 30, entero: true, opcional: true },
    { id: 'medida', texto: 'Medida de los síntomas', textoCorto: 'medida de síntomas', puntua: false, opciones: MEDIDAS },
    { id: 'cat', tipo: 'numero', texto: 'Puntaje del CAAT/CAT', unidad: 'puntos (0 a 40)', min: 0, max: 40, entero: true, visibleSi: (r) => indice(r, 'medida') === 0 },
    { id: 'mmrc', texto: 'Grado de disnea mMRC', textoCorto: 'mMRC', puntua: false, opciones: OPCIONES_MMRC, visibleSi: (r) => indice(r, 'medida') === 1 },
  ],
  validar({ v }) {
    if (v.hospitalizaciones != null && v.exacerbaciones != null && v.hospitalizaciones > v.exacerbaciones) {
      return { hospitalizaciones: 'Las hospitalizaciones no pueden ser más que las exacerbaciones.' };
    }
    return null;
  },
  bandas: [GRUPOS.A, GRUPOS.B, GRUPOS.E],
  calcular({ v }) {
    const exa = v.exacerbaciones;
    const porCat = v.medida.clave === 'cat';
    const sint = porCat ? v.cat : v.mmrc.valor;
    const masSintomas = porCat ? sint >= 10 : sint >= 2;
    const letra = exa >= 1 ? 'E' : masSintomas ? 'B' : 'A';
    const valor = { A: 1, B: 2, E: 3 }[letra];
    const sintTxt = porCat ? `CAAT/CAT ${sint}` : `mMRC ${sint}`;
    const hosp = v.hospitalizaciones;
    const exaTxt = exa === 0 ? 'sin exacerbaciones moderadas ni graves' : `${exa} exacerbación${exa === 1 ? '' : 'es'} moderada${exa === 1 ? '' : 's'} o grave${exa === 1 ? '' : 's'}${hosp ? ` (${hosp} con hospitalización)` : ''}`;
    const lineas = [`Último año: ${exaTxt}; síntomas: ${sintTxt} (${masSintomas ? 'más' : 'menos'} síntomas).`];
    if (letra === 'E' && exa === 1 && !hosp) lineas.push('Una sola exacerbación moderada define el grupo E desde GOLD 2026 (antes eran 2 o más, o 1 con hospitalización).');
    return { valor, mostrar: letra, sufijo: 'GOLD', unidad: '', lineas, extras: { grupo: letra, exacerbaciones: exa, hospitalizaciones: hosp ?? null, sintomas: sintTxt, masSintomas } };
  },
  resumen: (res) => {
    const x = res.extras;
    const exa = x.exacerbaciones === 0 ? 'sin exacerbaciones moderadas ni graves en el último año'
      : `${x.exacerbaciones} exacerbación${x.exacerbaciones === 1 ? '' : 'es'} moderada${x.exacerbaciones === 1 ? '' : 's'} o grave${x.exacerbaciones === 1 ? '' : 's'} en el último año${x.hospitalizaciones ? ` (${x.hospitalizaciones} con hospitalización)` : ''}`;
    return `Grupo GOLD ${x.grupo}: ${exa}; ${x.sintomas}, ${x.masSintomas ? 'más' : 'menos'} síntomas.`;
  },
  resumenBreve: (res) => `GOLD ${res.extras.grupo}`,
  detalleEnResumen: true,
  notas: [
    'Criterios de GOLD 2026-2027: A y B sin exacerbaciones moderadas ni graves en el último año (A con CAAT/CAT menor de 10 o mMRC 0 a 1; B con CAAT/CAT de 10 o más o mMRC 2 o más); E con una o más exacerbaciones moderadas o graves.',
    'Desde 2026 una sola exacerbación moderada basta para el grupo E (antes eran 2 o más, o 1 con hospitalización); en cohortes posteriores, ese cambio identificó a personas con más riesgo de nuevas exacerbaciones y de muerte (Choi, 2026; Zhang, 2026).',
    'El grupo orienta el tratamiento inicial. En el seguimiento, GOLD ajusta el tratamiento según la disnea y las exacerbaciones que persistan.',
    'Las sugerencias de tratamiento son las del informe GOLD 2027, sin dosis; Huella no indica fármacos.',
  ],
  licencia: { texto: 'Criterios del informe GOLD (© Global Initiative for Chronic Obstructive Lung Disease), citados como hechos y con redacción propia; Huella no reproduce la figura del informe.', enlace: GOLD },
  referencias: [
    REF_GOLD,
    { texto: 'Choi JY, Yoon HK, Moon JY, et al. Prognostic impact of single moderate exacerbation in patients with COPD: analysis of 12-year mortality and future exacerbation risk. Chest. 2026.', doi: '10.1016/j.chest.2026.07.5219' },
    { texto: 'Zhang B, Zeng J, Zeng H, Dai Z, Chen Y. The high-risk B-to-E transitional phenotype: a prospective multi-centre validation of patient reclassification under the updated GOLD 2026 criteria. J Glob Health. 2026;16:04205.', doi: '10.7189/jogh.16.04205' },
  ],
};

/* ---------- 3. CAAT/CAT (registro) ---------- */

export const cat = {
  id: 'cat',
  nombre: 'CAAT™ (antes COPD Assessment Test, CAT™): registro del puntaje',
  corto: 'CAAT/CAT',
  dominio: 'disnea',
  tipo: 'evaluacion',
  registro: true,
  hojaOficial: true,
  aliases: ['CAT', 'CAAT', 'COPD Assessment Test', 'Chronic Airways Assessment Test', 'cuestionario CAT', 'EPOC', 'calidad de vida', 'impacto de la EPOC'],
  problemas: ['EPOC', 'asma', 'impacto de los síntomas respiratorios'],
  descripcion: 'Registro del total oficial del CAAT/CAT: impacto de la enfermedad respiratoria en la salud, de 0 a 40 (más es peor).',
  objetivo: 'Registrar el impacto de la EPOC en la vida diaria y seguir su evolución; CAAT/CAT de 10 o más es el umbral de «más síntomas» de GOLD.',
  poblacion: 'Personas con EPOC (Jones, 2009); el CAAT, con la misma escala, se validó también en asma (Tomaszewski, 2023).',
  aplicacion: [
    'La persona contesta el formulario oficial (8 preguntas de 0 a 5) en la versión aprobada en español; Huella solo registra el total.',
    'El formulario se usa sin cambios y con las preguntas juntas, como pide su Consejo de Gobierno.',
  ],
  tiempo: '2 a 3 min',
  momentos: true,
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor impacto',
  textoEmpeoramiento: 'mayor impacto',
  min: 0,
  max: 40,
  siguientes: [
    { id: 'goldabe', si: () => true, motivo: 'Grupo GOLD A, B o E con este puntaje y las exacerbaciones del último año.' },
  ],
  campos: [{ id: 'puntaje', tipo: 'numero', texto: 'Puntaje total (0 a 40)', unidad: 'puntos', min: 0, max: 40, entero: true }],
  bandas: [
    { min: 0, max: 9, etiqueta: 'Impacto bajo', nivel: 'leve', texto: 'Puntaje menor de 10: menos síntomas según el umbral de GOLD.', sugerencias: [] },
    { min: 10, max: 20, etiqueta: 'Impacto medio', nivel: 'moderado', hallazgo: true, texto: 'Puntaje de 10 a 20: más síntomas según el umbral de GOLD.', sugerencias: ['Revisar el tratamiento inhalado, la técnica de inhalación y la actividad física.'] },
    { min: 21, max: 30, etiqueta: 'Impacto alto', nivel: 'grave', hallazgo: true, texto: 'Puntaje de 21 a 30.', sugerencias: ['Revisar el tratamiento y la técnica de inhalación, y valorar rehabilitación pulmonar y comorbilidades (ansiedad, depresión, insuficiencia cardiaca).'] },
    { min: 31, max: 40, etiqueta: 'Impacto muy alto', nivel: 'critico', hallazgo: true, texto: 'Puntaje de 31 a 40.', sugerencias: ['Revisar el tratamiento, buscar una exacerbación o comorbilidades y valorar el control de síntomas y las necesidades paliativas según los objetivos de cuidado.'] },
  ],
  calcular: ({ v }) => ({ puntaje: v.puntaje }),
  notas: [
    'Niveles de impacto de la guía de uso del CAAT/CAT: menos de 10 bajo, 10 a 20 medio, 21 a 30 alto y más de 30 muy alto. GOLD usa 10 o más como umbral de «más síntomas» (equivale a 25 o más en el cuestionario de St George).',
    'En 2025 el COPD Assessment Test se renombró Chronic Airways Assessment Test (CAAT) para usarlo también en asma; las preguntas y la escala no cambiaron en lo esencial y los puntajes son equivalentes.',
    'Mide el impacto global, no solo la disnea: en personas mayores, la fatiga, el sueño o el ánimo pueden elevarlo por otras causas.',
  ],
  licencia: {
    texto: 'CAT™ y CAAT™ son marcas del grupo GSK (© 2009 GlaxoSmithKline). Son gratuitos para la práctica clínica, pero deben usarse sin cambios y solo en traducciones aprobadas, y su integración en sistemas electrónicos requiere permiso de su Consejo de Gobierno. Por eso Huella solo registra el total obtenido con el formulario oficial.',
    enlace: CAAT_GUIA,
  },
  referencias: [
    { texto: 'Jones PW, Harding G, Berry P, Wiklund I, Chen WH, Kline Leidy N. Development and first validation of the COPD Assessment Test. Eur Respir J. 2009;34(3):648-54.', doi: '10.1183/09031936.00102509' },
    { texto: 'Tomaszewski EL, Atkinson MJ, Janson C, et al. Chronic Airways Assessment Test: psychometric properties in patients with asthma and/or COPD. Respir Res. 2023;24(1):106.', doi: '10.1186/s12931-023-02394-6' },
    { texto: 'Tal-Singer R, Chalmers JD, Jones PW, et al. The Chronic Airways Assessment Test (CAAT™): evolution from the COPD Assessment Test (CAT™). Chronic Obstr Pulm Dis. 2025;12(3):203-6.', doi: '10.15326/jcopdf.2025.0614' },
    { texto: 'GAAPP. CAT and CAAT User Guide (7 de noviembre de 2024).', enlace: CAAT_GUIA },
    REF_GOLD,
  ],
};

/* ---------- 4. Índice BODE ---------- */

const ptsFev1 = (f) => (f >= 65 ? 0 : f >= 50 ? 1 : f >= 36 ? 2 : 3);
const ptsCaminata = (d) => (d >= 350 ? 0 : d >= 250 ? 1 : d >= 150 ? 2 : 3);
const ptsMmrc = (g) => (g <= 1 ? 0 : g - 1);
const ptsImc = (i) => (i > 21 ? 0 : 1);

const SUG_BODE = {
  rehabilitacion: 'Valorar rehabilitación pulmonar y actividad física: mejoran la capacidad de ejercicio y la disnea, dos componentes del índice.',
  nutricion: 'Con IMC de 21 o menos, completar la valoración nutricional (MNA-SF) y buscar sarcopenia.',
  avanzada: 'Conversar sobre objetivos de cuidado y necesidades paliativas en la EPOC avanzada.',
};

export const bode = {
  id: 'bode',
  nombre: 'Índice BODE (IMC, obstrucción, disnea y capacidad de ejercicio)',
  corto: 'Índice BODE',
  dominio: 'disnea',
  tipo: 'pronostico',
  aliases: ['BODE', 'Celli', 'índice pronóstico EPOC', 'EPOC', 'caminata de 6 minutos', 'mMRC', 'FEV1'],
  problemas: ['EPOC', 'pronóstico', 'disnea', 'capacidad de ejercicio'],
  descripcion: 'Índice multidimensional de 0 a 10 con el IMC, el FEV₁, la disnea (mMRC) y la caminata de 6 minutos; a más puntos, mayor riesgo de muerte (sin porcentajes).',
  objetivo: 'Graduar la gravedad global de la EPOC más allá del FEV₁ y seguir su evolución.',
  poblacion: 'Personas con EPOC estable (Celli, 2004; edad media de la cohorte de validación, alrededor de 66 años).',
  aplicacion: [
    'Usa el FEV₁ posbroncodilatador en fase estable.',
    'La distancia es la mejor de la caminata de 6 minutos hecha con el método estándar; si usa oxígeno o un auxiliar, anótalo en la caminata.',
    'Huella puede tomar la mMRC, la distancia y el IMC (con la talla y el peso de la caminata) si ya están en esta valoración; confírmalos antes de usarlos.',
  ],
  tiempo: '2 min (más la caminata de 6 minutos)',
  momentos: true,
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor gravedad global',
  textoEmpeoramiento: 'mayor gravedad global',
  min: 0,
  max: 10,
  vinculos: [
    vinculoMmrc(['mmrc']),
    {
      id: 'caminata', escala: 'caminata6', titulo: 'Caminata de 6 minutos',
      disponible: (res) => (Number.isFinite(res.extras?.distancia) ? true : 'La caminata guardada no tiene distancia.'),
      describir: (res) => `${res.extras.distancia} m en 6 minutos`,
      advertencia: (res) => (res.extras?.suspendida ? 'La caminata se suspendió antes de los 6 minutos.' : res.extras?.oxigeno ? 'La caminata se hizo con oxígeno suplementario.' : null),
      aplicar: (res) => ({ distancia: String(res.extras.distancia) }),
      campos: ['distancia'],
    },
    {
      id: 'imc', escala: 'caminata6', titulo: 'IMC con la talla y el peso de la caminata',
      disponible: (res) => {
        const t = Number(res.respuestas?.talla);
        const p = Number(res.respuestas?.peso);
        return t > 0 && p > 0 ? true : 'La caminata guardada no tiene talla y peso.';
      },
      describir: (res) => {
        const t = Number(res.respuestas.talla) / 100;
        return `IMC ${fmt(Number(res.respuestas.peso) / (t * t))} kg/m² (${res.respuestas.peso} kg, ${res.respuestas.talla} cm)`;
      },
      aplicar: (res) => {
        const t = Number(res.respuestas.talla) / 100;
        return { imc: fmt(Number(res.respuestas.peso) / (t * t)) };
      },
      campos: ['imc'],
    },
  ],
  campos: [
    { id: 'fev1', tipo: 'numero', texto: 'FEV₁ posbroncodilatador (B: obstrucción)', unidad: '% del predicho', min: 5, max: 160, decimales: 0 },
    { id: 'distancia', tipo: 'numero', texto: 'Distancia en la caminata de 6 minutos (E: ejercicio)', unidad: 'm', min: 0, max: 1000, entero: true, ayuda: 'Si no pudo caminar, escribe 0.' },
    { id: 'mmrc', texto: 'Disnea mMRC (D)', textoCorto: 'mMRC', puntua: false, opciones: OPCIONES_MMRC },
    { id: 'imc', tipo: 'numero', texto: 'Índice de masa corporal (B: IMC)', unidad: 'kg/m²', min: 10, max: 70, decimales: 1 },
  ],
  bandas: [
    { min: 0, max: 2, rango: '0 a 2', etiqueta: 'Cuartil 1 del BODE', nivel: 'leve', texto: 'Puntaje de 0 a 2: el grupo de menor riesgo en la cohorte original.', sugerencias: [] },
    { min: 3, max: 4, rango: '3 a 4', etiqueta: 'Cuartil 2 del BODE', nivel: 'moderado', hallazgo: true, texto: 'Puntaje de 3 a 4.', sugerencias: [SUG_BODE.rehabilitacion] },
    { min: 5, max: 6, rango: '5 a 6', etiqueta: 'Cuartil 3 del BODE', nivel: 'grave', hallazgo: true, texto: 'Puntaje de 5 a 6.', sugerencias: [SUG_BODE.rehabilitacion] },
    { min: 7, max: 10, rango: '7 a 10', etiqueta: 'Cuartil 4 del BODE', nivel: 'critico', hallazgo: true, texto: 'Puntaje de 7 a 10: el grupo de mayor riesgo en la cohorte original.', sugerencias: [SUG_BODE.rehabilitacion, SUG_BODE.avanzada] },
  ],
  calcular({ v }) {
    const p = { fev1: ptsFev1(v.fev1), distancia: ptsCaminata(v.distancia), mmrc: ptsMmrc(v.mmrc.valor), imc: ptsImc(v.imc) };
    const total = p.fev1 + p.distancia + p.mmrc + p.imc;
    const lineas = [
      `B (IMC ${fmt(v.imc)} kg/m²): ${p.imc} · O (FEV₁ ${fmt(v.fev1, 0)} %): ${p.fev1} · D (mMRC ${v.mmrc.valor}): ${p.mmrc} · E (${v.distancia} m): ${p.distancia}.`,
    ];
    if (p.imc === 1) lineas.push(SUG_BODE.nutricion);
    return { puntaje: total, max: 10, sufijo: '/ 10', lineas, extras: { puntos: p } };
  },
  resumen: (res) => `Índice BODE ${res.puntaje}/10 (${res.banda.etiqueta.replace(' del BODE', '').toLowerCase()}): ${res.lineas[0].replace(/\.$/, '')}.`,
  resumenBreve: (res) => `BODE ${res.puntaje}/10`,
  detalleEnResumen: true,
  notas: [
    'Puntos (Celli, 2004): FEV₁ ≥ 65 % = 0, 50–64 % = 1, 36–49 % = 2, ≤ 35 % = 3; caminata ≥ 350 m = 0, 250–349 m = 1, 150–249 m = 2, ≤ 149 m = 3; mMRC 0–1 = 0, 2 = 1, 3 = 2, 4 = 3; IMC > 21 = 0, ≤ 21 = 1.',
    'Predice la muerte mejor que el FEV₁ solo. Huella muestra el cuartil, no porcentajes de supervivencia.',
    'En personas mayores, la caminata y la disnea también dependen de la fragilidad, el dolor o la artrosis: interpreta el índice con la valoración geriátrica.',
    'La cohorte original incluyó sobre todo hombres con EPOC estable; no se diseñó para la exacerbación aguda.',
  ],
  licencia: { texto: 'Índice publicado por Celli et al. (2004); puntos de corte citados como hechos, sin titular de licencias identificado.' },
  referencias: [
    { texto: 'Celli BR, Cote CG, Marin JM, et al. The body-mass index, airflow obstruction, dyspnea, and exercise capacity index in chronic obstructive pulmonary disease. N Engl J Med. 2004;350(10):1005-12.', doi: '10.1056/NEJMoa021322' },
    { texto: 'Marin JM, Alfageme I, Almagro P, et al. Multicomponent indices to predict survival in COPD: the COCOMICS study. Eur Respir J. 2013;42(2):323-32.', doi: '10.1183/09031936.00121012' },
  ],
};

/* ---------- 5. Gravedad de la exacerbación (propuesta de Roma) ---------- */

const B_EXA = {
  leve: { min: 1, max: 1, rango: 'Leve', etiqueta: 'Exacerbación leve', nivel: 'leve', hallazgo: true,
    texto: 'Menos de 3 de los 5 criterios.',
    sugerencias: ['Descartar otras causas del empeoramiento (neumonía, insuficiencia cardiaca, tromboembolia pulmonar, neumotórax, arritmia) y revisar el tratamiento.'] },
  moderada: { min: 2, max: 2, rango: 'Moderada', etiqueta: 'Exacerbación moderada', nivel: 'grave', hallazgo: true,
    texto: 'Cumple 3 o más de los 5 criterios.',
    sugerencias: ['Descartar otras causas del empeoramiento (neumonía, insuficiencia cardiaca, tromboembolia pulmonar, neumotórax, arritmia).', 'Valorar gasometría si la SpO₂ es baja o hay somnolencia o confusión.'] },
  grave: { min: 3, max: 3, rango: 'Grave', etiqueta: 'Exacerbación grave', nivel: 'critico', hallazgo: true,
    texto: 'Cumple 3 o más criterios y la gasometría muestra hipoxemia (PaO₂ ≤ 60 mmHg) o hipercapnia con acidosis (PaCO₂ > 45 mmHg y pH < 7.35).',
    sugerencias: ['Atención urgente según los objetivos de cuidado. La acidosis hipercápnica es indicación de valorar ventilación mecánica no invasiva.'] },
  discordante: { id: 'discordante', rango: 'Revisar', etiqueta: 'Gasometría grave con menos de 3 criterios', nivel: 'grave', hallazgo: true,
    texto: 'La propuesta de Roma no contempla esta combinación: la gasometría muestra hipoxemia o acidosis hipercápnica, aunque no cumple 3 de los 5 criterios. Decide la gravedad con juicio clínico.',
    sugerencias: ['Valoración médica urgente; repite los signos vitales y la gasometría.'] },
};

export const exaroma = {
  id: 'exaroma',
  nombre: 'Gravedad de la exacerbación de la EPOC (propuesta de Roma)',
  corto: 'Exacerbación de EPOC (Roma)',
  dominio: 'disnea',
  tipo: 'estadificacion',
  aliases: ['Roma', 'propuesta de Roma', 'exacerbación', 'agudización', 'EPOC exacerbada', 'AEPOC', 'gravedad de la exacerbación', 'gasometría'],
  problemas: ['exacerbación de EPOC', 'insuficiencia respiratoria', 'disnea'],
  descripcion: 'Clasifica la exacerbación como leve, moderada o grave con la disnea (EVA), la frecuencia respiratoria y cardiaca, la SpO₂, la PCR y, si se tomó, la gasometría.',
  objetivo: 'Graduar la gravedad de una exacerbación en el momento de la valoración, con datos clínicos medibles en lugar del lugar de atención.',
  poblacion: 'Personas con EPOC y un empeoramiento agudo de la disnea, la tos o el esputo en los últimos 14 días (Celli, 2021; GOLD 2027).',
  aplicacion: [
    'Mide los signos en reposo. La SpO₂ es al aire ambiente o con el oxígeno que usa habitualmente.',
    'La disnea se califica de 0 (nada) a 10 (la peor imaginable) en una escala visual analógica.',
    'Si conoces la SpO₂ habitual en estabilidad, escríbela: una caída de más de 3 puntos cuenta como criterio.',
  ],
  tiempo: '2 min',
  direccionClinica: 'menor_mejor',
  unidadCambio: ['nivel', 'niveles'],
  textoMejoria: 'menor gravedad',
  textoEmpeoramiento: 'mayor gravedad',
  min: 1,
  max: 3,
  campos: [
    { id: 'eva', tipo: 'numero', texto: 'Disnea en la escala visual analógica', unidad: '(0 a 10)', min: 0, max: 10, decimales: 1 },
    { id: 'fr', tipo: 'numero', texto: 'Frecuencia respiratoria', unidad: 'respiraciones/min', min: 4, max: 80, entero: true },
    { id: 'fc', tipo: 'numero', texto: 'Frecuencia cardiaca', unidad: 'latidos/min', min: 20, max: 250, entero: true },
    { id: 'spo2', tipo: 'numero', texto: 'SpO₂ en reposo (aire ambiente o su oxígeno habitual)', unidad: '%', min: 50, max: 100, entero: true },
    { id: 'spo2basal', tipo: 'numero', texto: 'SpO₂ habitual en estabilidad (opcional)', unidad: '%', min: 50, max: 100, entero: true, opcional: true },
    {
      id: 'pcr', tipo: 'numero', texto: 'Proteína C reactiva (opcional)', decimales: 1, opcional: true,
      unidades: [
        { id: 'mgl', etiqueta: 'mg/L', min: 0, max: 600 },
        { id: 'mgdl', etiqueta: 'mg/dL', min: 0, max: 60, aBase: (x) => x * 10 },
      ],
    },
    {
      id: 'gaso', texto: '¿Se tomó gasometría arterial?', textoCorto: 'gasometría', puntua: false,
      opciones: [{ texto: 'No', valor: 0, clave: 'no' }, { texto: 'Sí', valor: 1, clave: 'si' }],
    },
    { id: 'pao2', tipo: 'numero', texto: 'PaO₂', unidad: 'mmHg', min: 20, max: 600, entero: true, visibleSi: (r) => indice(r, 'gaso') === 1 },
    { id: 'paco2', tipo: 'numero', texto: 'PaCO₂', unidad: 'mmHg', min: 10, max: 150, entero: true, visibleSi: (r) => indice(r, 'gaso') === 1 },
    { id: 'ph', tipo: 'numero', texto: 'pH', unidad: '', min: 6.8, max: 7.8, decimales: 2, visibleSi: (r) => indice(r, 'gaso') === 1 },
  ],
  bandas: [B_EXA.leve, B_EXA.moderada, B_EXA.grave, B_EXA.discordante],
  calcular({ v }) {
    const caida = n(v.spo2basal) != null ? v.spo2basal - v.spo2 : null;
    const criterios = [
      { ok: v.eva >= 5, txt: `disnea EVA ${fmt(v.eva)} (≥ 5)` },
      { ok: v.fr >= 24, txt: `FR ${v.fr}/min (≥ 24)` },
      { ok: v.fc >= 95, txt: `FC ${v.fc}/min (≥ 95)` },
      { ok: v.spo2 < 92 || (caida != null && caida > 3), txt: `SpO₂ ${v.spo2} %${caida != null && caida > 3 ? `, ${caida} puntos menos que su habitual` : ''} (< 92 % o caída > 3)` },
    ];
    const conPcr = n(v.pcr) != null;
    if (conPcr) criterios.push({ ok: v.pcr >= 10, txt: `PCR ${fmt(v.pcr)} mg/L (≥ 10)` });
    const cumple = criterios.filter((c) => c.ok);
    const moderada = cumple.length >= 3;
    const conGaso = v.gaso.clave === 'si';
    const hipoxemia = conGaso && v.pao2 <= 60;
    const acidosis = conGaso && v.paco2 > 45 && v.ph < 7.35;
    const gasGrave = hipoxemia || acidosis;
    const clave = moderada ? (gasGrave ? 'grave' : 'moderada') : gasGrave ? 'discordante' : 'leve';
    const lineas = [
      `Criterios cumplidos: ${cumple.length} de ${criterios.length}${conPcr ? '' : ' (sin PCR)'}${cumple.length ? `: ${cumple.map((c) => c.txt).join('; ')}` : ''}.`,
    ];
    if (conGaso) lineas.push(`Gasometría: PaO₂ ${v.pao2} mmHg, PaCO₂ ${v.paco2} mmHg, pH ${fmt(v.ph, 2)}${acidosis ? ' (acidosis hipercápnica)' : hipoxemia ? ' (hipoxemia)' : ''}.`);
    else if (moderada) lineas.push('Sin gasometría: no se puede distinguir entre moderada y grave.');
    const alertas = acidosis ? ['Acidosis hipercápnica (PaCO₂ > 45 mmHg y pH < 7.35): insuficiencia respiratoria aguda; valorar ventilación mecánica no invasiva de inmediato.'] : [];
    const valor = { leve: 1, moderada: 2, grave: 3, discordante: null }[clave];
    if (clave === 'discordante') {
      return { valor: null, mostrar: 'Revisar', sufijo: '', unidad: '', banda: B_EXA.discordante, lineas, alertas, extras: { criterios: cumple.length, total: criterios.length, gasometria: conGaso, acidosis, hipoxemia } };
    }
    return { valor, mostrar: B_EXA[clave].rango, sufijo: '', unidad: '', lineas, alertas, extras: { criterios: cumple.length, total: criterios.length, gasometria: conGaso, acidosis, hipoxemia } };
  },
  resumen: (res) => {
    const x = res.extras;
    const gas = !x.gasometria ? '' : x.acidosis ? '; acidosis hipercápnica' : x.hipoxemia ? '; hipoxemia' : '; gasometría sin hipoxemia ni acidosis';
    return `${res.banda.etiqueta} (propuesta de Roma: ${x.criterios} de ${x.total} criterios${gas}).`;
  },
  resumenBreve: (res) => `${res.banda.etiqueta} (Roma)`,
  detalleEnResumen: true,
  notas: [
    'Criterios de la propuesta de Roma recogidos en el informe GOLD 2027: leve con disnea EVA < 5, FR < 24, FC < 95, SpO₂ ≥ 92 % (y caída ≤ 3 puntos si se conoce) y PCR < 10 mg/L; moderada si cumple al menos 3 de esos 5 criterios en sentido contrario; grave si además la gasometría muestra hipoxemia (PaO₂ ≤ 60 mmHg) o hipercapnia con acidosis.',
    'Sin PCR se cuentan 4 criterios y siguen haciendo falta 3 para pasar a moderada.',
    'La propuesta clasifica la gravedad por datos clínicos medibles, no por el tratamiento ni por el lugar de atención, como se hacía antes.',
    'Antes de atribuir el empeoramiento a la EPOC, descarta neumonía, insuficiencia cardiaca, tromboembolia pulmonar, neumotórax y arritmias.',
    'En personas mayores, la exacerbación puede manifestarse con delirium o caída funcional: valora también el 4AT y el Barthel.',
  ],
  licencia: { texto: 'Criterios publicados (Celli et al., 2021) y recogidos en el informe GOLD; citados como hechos y con redacción propia.', enlace: GOLD },
  referencias: [
    { texto: 'Celli BR, Fabbri LM, Aaron SD, et al. An updated definition and severity classification of chronic obstructive pulmonary disease exacerbations: the Rome proposal. Am J Respir Crit Care Med. 2021;204(11):1251-8.', doi: '10.1164/rccm.202108-1819PP' },
    REF_GOLD,
  ],
};
