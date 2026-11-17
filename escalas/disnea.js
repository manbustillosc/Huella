// Disnea: escala mMRC (Medical Research Council modificada) y clasificación funcional de la NYHA.
// Grados y clases con redacción propia de Huella. Versión 2.16.0.

const MRC_UKRI = 'https://www.ukri.org/councils/mrc/facilities-and-resources/find-an-mrc-facility-or-resource/mrc-dyspnoea-scale/';
const NYHA_AHA = 'https://professional.heart.org/en/guidelines-and-statements/classification';
const GOLD_2027 = 'https://goldcopd.org/2026-gold-report-and-pocket-guide/';

const otraCausa = {
  id: 'otraCausa',
  texto: 'Otra causa limita la marcha o la actividad (dolor, artrosis, fragilidad, secuelas neurológicas, deterioro cognitivo)',
  textoCorto: 'otra causa de limitación',
  tipo: 'sino',
  puntua: false,
  opcional: true,
  ayuda: 'Opcional. Si la persona camina poco por otra razón, el grado puede no reflejar solo la disnea.',
};

const avisoOtraCausa = 'Otra causa limita la actividad: el resultado puede no reflejar solo la disnea.';

/* ---------- mMRC ---------- */

// [grado mMRC, nombre corto, descripción, etiqueta de la banda, nivel]
const GRADOS_MMRC = [
  [0, 'Solo con ejercicio intenso', 'Solo le falta el aire al hacer un esfuerzo físico intenso.', 'Disnea solo con esfuerzo intenso', 'bien'],
  [1, 'Al ir de prisa o en una cuesta', 'Le falta el aire cuando camina de prisa en terreno plano o al subir una pendiente leve.', 'Disnea al ir de prisa o en pendiente', 'leve'],
  [2, 'Camina más lento o hace pausas en plano', 'Por la falta de aire camina en plano más despacio que otras personas de su edad, o tiene que parar a tomar aire aunque vaya a su propio ritmo.', 'Disnea que limita la marcha en plano', 'moderado'],
  [3, 'Para a los 100 m o a los pocos minutos', 'Tiene que parar a tomar aire después de caminar unos 100 metros, o tras pocos minutos en terreno plano.', 'Disnea al caminar distancias cortas', 'grave'],
  [4, 'No sale de casa o se ahoga al vestirse', 'La falta de aire le impide salir de casa, o le falta el aire al vestirse o desvestirse.', 'Disnea con actividades mínimas', 'critico'],
];

const SUG_DISNEA = {
  causa: 'Buscar y tratar la causa de la disnea (respiratoria, cardiaca, anemia, desacondicionamiento, obesidad o ansiedad), sobre todo si es nueva o empeoró.',
  epoc: 'En EPOC: revisar el tratamiento inhalado y la técnica de inhalación, y valorar rehabilitación pulmonar.',
  paliativo: 'Valorar el control de la disnea y las necesidades paliativas según los objetivos de cuidado.',
};

export const mmrc = {
  id: 'mmrc',
  nombre: 'Escala de disnea mMRC (Medical Research Council modificada)',
  corto: 'Disnea mMRC',
  dominio: 'disnea',
  tipo: 'evaluacion',
  aliases: ['mMRC', 'MRC', 'Medical Research Council', 'escala de disnea', 'disnea', 'falta de aire', 'ahogo', 'dificultad para respirar', 'EPOC', 'GOLD', 'BODE'],
  problemas: ['disnea', 'EPOC', 'enfermedad pulmonar crónica', 'insuficiencia cardiaca', 'limitación de la actividad'],
  descripcion: 'Grado de disnea en las actividades diarias, de 0 (solo con ejercicio intenso) a 4 (no sale de casa o le falta el aire al vestirse), con su equivalencia en la escala MRC original (1 a 5).',
  objetivo: 'Registrar cuánto limita la falta de aire las actividades cotidianas y seguir su evolución; en la EPOC se usa para valorar los síntomas (GOLD) y forma parte del índice BODE.',
  poblacion: 'Personas con disnea crónica, sobre todo por EPOC u otra enfermedad respiratoria (Fletcher, 1959; Mahler y Wells, 1988; Bestall, 1999).',
  aplicacion: [
    'Pregunta a la persona qué actividades de su vida diaria le provocan falta de aire y elige el grado que mejor la describe.',
    'Valora su situación habitual; si está en una exacerbación o descompensación, anótalo y repítela cuando esté estable.',
    'Si camina poco por otra causa (dolor, artrosis, fragilidad, secuelas neurológicas, deterioro cognitivo), márcalo en el campo opcional.',
  ],
  tiempo: '1 min',
  momentos: true,
  fuente: true,
  direccionClinica: 'menor_mejor',
  unidadCambio: ['grado', 'grados'],
  textoMejoria: 'menos disnea',
  textoEmpeoramiento: 'más disnea',
  min: 0,
  max: 4,
  siguientes: [
    { id: 'caminata6', si: (res) => res.puntaje >= 1 && res.puntaje <= 3, motivo: 'Capacidad de ejercicio medida (distancia en 6 minutos); en la EPOC, junto con la mMRC, forma parte del índice BODE.' },
    { id: 'esasr', si: (res) => res.puntaje === 4, motivo: 'Intensidad de la disnea y de otros síntomas, para el control sintomático.' },
  ],
  campos: [
    {
      id: 'grado', texto: 'Grado que mejor describe su falta de aire', textoCorto: 'grado de disnea',
      ayuda: 'Elige el grado más alto que la describa. Equivalencia con la escala MRC original: mMRC 0 = MRC 1 … mMRC 4 = MRC 5.',
      opciones: GRADOS_MMRC.map(([n, nombre, desc]) => ({ texto: `${n} · ${nombre}`, valor: n, detalle: desc })),
    },
    otraCausa,
  ],
  bandas: GRADOS_MMRC.map(([n, , desc, etiqueta, nivel]) => ({
    min: n,
    max: n,
    etiqueta,
    nivel,
    hallazgo: n >= 2,
    texto: `Grado ${n} de la mMRC (MRC ${n + 1}). ${desc} ${n <= 1 ? 'Menos disnea según el umbral de GOLD (mMRC 0 a 1).' : 'Más disnea según el umbral de GOLD (mMRC 2 o más).'}`,
    sugerencias: n <= 1 ? [] : n === 4 ? [SUG_DISNEA.causa, SUG_DISNEA.epoc, SUG_DISNEA.paliativo] : [SUG_DISNEA.causa, SUG_DISNEA.epoc],
  })),
  calcular({ v }) {
    const g = v.grado.valor;
    const otra = v.otraCausa?.texto === 'Sí';
    const lineas = [`Equivale a MRC ${g + 1} en la escala original (1 a 5).`];
    if (otra) lineas.push(avisoOtraCausa);
    return { puntaje: g, max: 4, sufijo: `/ 4 · MRC ${g + 1}`, lineas, extras: { mrc: g + 1, otraCausa: otra } };
  },
  resumen: (res) => `Disnea mMRC ${res.puntaje} (MRC ${res.extras.mrc}): ${res.banda.etiqueta.toLowerCase()}.${res.extras.otraCausa ? ` ${avisoOtraCausa}` : ''}`,
  resumenBreve: (res) => `mMRC ${res.puntaje}`,
  detalleEnResumen: true,
  notas: [
    'La mMRC numera de 0 a 4 los mismos cinco grados de la escala MRC original (1 a 5): mMRC = MRC − 1. Anota cuál usas, porque en la literatura conviven ambas.',
    'El informe GOLD 2027 mantiene mMRC 2 o más como umbral para separar «menos» de «más» disnea; el umbral equivalente del cuestionario CAAT™ (antes CAT) es 10. Junto con las exacerbaciones, orienta los grupos A, B y E.',
    'Mide la disnea en las actividades, no su causa: en personas mayores, la insuficiencia cardiaca, la anemia, el desacondicionamiento, la obesidad o la ansiedad también la producen.',
    'Tiene pocos grados: puede no detectar cambios pequeños con el tiempo, que sí detectan escalas multidimensionales (Mahler, 2012).',
    'Grados con redacción propia de Huella; no es una traducción oficial.',
  ],
  licencia: {
    texto: 'Escala de disnea del Medical Research Council (MRC, UKRI). Used with the permission of the Medical Research Council. El MRC permite usar su escala con cualquier fin, reconociendo la autoría e indicando los cambios, sin sugerir que respalda el uso; no autoriza versiones modificadas ni traducciones. Cambios en Huella: numeración modificada de 0 a 4 (mMRC) junto a la original de 1 a 5, y grados descritos con redacción propia en español (no es una traducción oficial).',
    enlace: MRC_UKRI,
  },
  referencias: [
    { texto: 'Fletcher CM, Elmes PC, Fairbairn AS, Wood CH. The significance of respiratory symptoms and the diagnosis of chronic bronchitis in a working population. Br Med J. 1959;2(5147):257-66.', doi: '10.1136/bmj.2.5147.257' },
    { texto: 'Mahler DA, Wells CK. Evaluation of clinical methods for rating dyspnea. Chest. 1988;93(3):580-6.', doi: '10.1378/chest.93.3.580' },
    { texto: 'Bestall JC, Paul EA, Garrod R, Garnham R, Jones PW, Wedzicha JA. Usefulness of the Medical Research Council (MRC) dyspnoea scale as a measure of disability in patients with chronic obstructive pulmonary disease. Thorax. 1999;54(7):581-6.', doi: '10.1136/thx.54.7.581' },
    { texto: 'Celli BR, Cote CG, Marin JM, et al. The body-mass index, airflow obstruction, dyspnea, and exercise capacity index in chronic obstructive pulmonary disease. N Engl J Med. 2004;350(10):1005-12.', doi: '10.1056/NEJMoa021322' },
    { texto: 'Mahler DA, Ward J, Waterman LA, Baird JC. Longitudinal changes in patient-reported dyspnea in patients with COPD. COPD. 2012;9(5):522-7.', doi: '10.3109/15412555.2012.701678' },
    { texto: 'Global Initiative for Chronic Obstructive Lung Disease (GOLD). Global Strategy for the Prevention, Diagnosis and Management of COPD: 2027 Report.', enlace: GOLD_2027 },
  ],
};

/* ---------- NYHA ---------- */

const ROMANO = ['', 'I', 'II', 'III', 'IV'];

// [clase, nombre corto, descripción, nivel]
const CLASES_NYHA = [
  [1, 'Sin limitación', 'Tiene una cardiopatía, pero la actividad física habitual no le causa fatiga, palpitaciones, disnea ni angina fuera de lo esperable.', 'bien'],
  [2, 'Limitación ligera', 'Sin molestias en reposo; la actividad física habitual le causa fatiga, palpitaciones, disnea o angina.', 'leve'],
  [3, 'Limitación marcada', 'Sin molestias en reposo; actividades más ligeras que las habituales le causan esos síntomas.', 'grave'],
  [4, 'Síntomas con cualquier actividad o en reposo', 'No puede hacer ninguna actividad física sin molestias; puede tener síntomas en reposo, que aumentan con cualquier esfuerzo.', 'critico'],
];

const SUG_NYHA = {
  descompensacion: 'Buscar causas de empeoramiento: adherencia al tratamiento, sal y líquidos, arritmias, isquemia, infección, anemia y función renal o tiroidea.',
  farmacos: 'Revisar la medicación: algunos fármacos empeoran la insuficiencia cardiaca (p. ej., AINE y tiazolidinedionas).',
  rehabilitacion: 'Valorar rehabilitación cardiaca o un programa de ejercicio adaptado, si está estable.',
  avanzada: 'Si la clase IV persiste pese al tratamiento, valorar insuficiencia cardiaca avanzada (estadio D) y las necesidades paliativas, según los objetivos de cuidado.',
};

export const nyha = {
  id: 'nyha',
  nombre: 'Clasificación funcional de la New York Heart Association (NYHA)',
  corto: 'Clase funcional NYHA',
  dominio: 'disnea',
  tipo: 'estadificacion',
  aliases: ['NYHA', 'New York Heart Association', 'clase funcional', 'clase NYHA', 'insuficiencia cardiaca', 'IC', 'falla cardiaca', 'disnea', 'fatiga', 'palpitaciones', 'angina'],
  problemas: ['insuficiencia cardiaca', 'cardiopatía', 'disnea', 'fatiga', 'limitación de la actividad'],
  descripcion: 'Clase funcional I a IV según la actividad física que provoca fatiga, palpitaciones, disnea o angina en personas con cardiopatía, sobre todo con insuficiencia cardiaca.',
  objetivo: 'Graduar la limitación funcional por los síntomas de la cardiopatía y seguir su evolución con el tratamiento.',
  poblacion: 'Personas con cardiopatía, sobre todo con insuficiencia cardiaca sintomática (Comité de Criterios de la NYHA, 9.ª edición, 1994).',
  aplicacion: [
    'Pregunta por actividades concretas de su vida diaria (caminar en plano, subir un piso de escaleras, bañarse, vestirse) y si tiene síntomas en reposo.',
    'Anota qué actividad le provoca síntomas: la clase es subjetiva y así se puede comparar en la siguiente consulta.',
    'Si otra causa limita la actividad (dolor, artrosis, fragilidad, deterioro cognitivo, enfermedad pulmonar), márcalo en el campo opcional.',
  ],
  tiempo: '1 a 2 min',
  momentos: true,
  fuente: true,
  direccionClinica: 'menor_mejor',
  unidadCambio: ['clase', 'clases'],
  textoMejoria: 'menor limitación funcional',
  textoEmpeoramiento: 'mayor limitación funcional',
  min: 1,
  max: 4,
  siguientes: [
    { id: 'caminata6', si: (res) => res.valor >= 2 && res.valor <= 3, motivo: 'Capacidad de ejercicio medida; complementa a la clase NYHA, que es subjetiva.' },
    { id: 'esasr', si: (res) => res.valor === 4, motivo: 'Intensidad de la disnea y de otros síntomas, para el control sintomático.' },
  ],
  campos: [
    {
      id: 'clase', texto: 'Clase que mejor describe a la persona', textoCorto: 'clase funcional',
      ayuda: 'Clasifica por lo que le ocurre en su vida diaria actual. «Habitual» es la actividad cotidiana de una persona de su edad.',
      opciones: CLASES_NYHA.map(([n, nombre, desc]) => ({ texto: `${ROMANO[n]} · ${nombre}`, valor: n, detalle: desc })),
    },
    otraCausa,
  ],
  bandas: CLASES_NYHA.map(([n, nombre, desc, nivel]) => ({
    min: n,
    max: n,
    rango: ROMANO[n],
    etiqueta: `Clase ${ROMANO[n]}: ${nombre.toLowerCase()}`,
    nivel,
    hallazgo: n >= 2,
    texto: n === 1 ? `${desc} La clase I no descarta la cardiopatía ni la necesidad de su tratamiento.` : desc,
    sugerencias: n === 1 ? []
      : n === 4 ? [SUG_NYHA.descompensacion, SUG_NYHA.farmacos, SUG_NYHA.avanzada]
        : [SUG_NYHA.descompensacion, SUG_NYHA.farmacos, SUG_NYHA.rehabilitacion],
  })),
  calcular({ v }) {
    const c = v.clase.valor;
    const otra = v.otraCausa?.texto === 'Sí';
    const lineas = otra ? [avisoOtraCausa] : [];
    return { valor: c, mostrar: ROMANO[c], sufijo: 'NYHA', unidad: '', lineas, extras: { clase: ROMANO[c], otraCausa: otra } };
  },
  resumen: (res) => `Clase funcional NYHA ${res.extras.clase} (${res.banda.etiqueta.replace(/^Clase [IV]+: /, '')}).${res.extras.otraCausa ? ` ${avisoOtraCausa}` : ''}`,
  resumenBreve: (res) => `NYHA ${res.extras.clase}`,
  detalleEnResumen: true,
  notas: [
    'Los estadios ACC/AHA (A a D) describen la progresión de la insuficiencia cardiaca; la clase NYHA describe los síntomas y la capacidad funcional en la insuficiencia cardiaca sintomática (estadios C y D) y puede mejorar o empeorar con el tratamiento (guía AHA/ACC/HFSA 2022).',
    'Es subjetiva: dos cardiólogos coincidieron en el 54 % de las personas al distinguir entre las clases II y III (Raphael, 2007). Pregunta por actividades concretas y anótalas.',
    'En personas mayores, la artrosis, el dolor, la fragilidad, el deterioro cognitivo o una vida sedentaria pueden limitar la actividad antes que el corazón, y la clase puede no reflejar los síntomas cardiacos. Complétala con una medida objetiva (caminata de 6 minutos) cuando sea posible.',
    'La clasificación de 1994 incluye también una evaluación objetiva de la cardiopatía (A a D) que Huella no registra.',
    'Clases con redacción propia de Huella.',
  ],
  licencia: {
    texto: 'Clasificación del Comité de Criterios de la New York Heart Association (9.ª edición, 1994), © 1994 American Heart Association. Huella resume las clases con redacción propia y no reproduce el texto original.',
    enlace: NYHA_AHA,
  },
  referencias: [
    { texto: 'The Criteria Committee of the New York Heart Association. Nomenclature and Criteria for Diagnosis of Diseases of the Heart and Great Vessels. 9th ed. Boston: Little, Brown & Co; 1994. p. 253-6.', enlace: NYHA_AHA },
    { texto: 'Heidenreich PA, Bozkurt B, Aguilar D, et al. 2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure. Circulation. 2022;145(18):e895-e1032.', doi: '10.1161/CIR.0000000000001063' },
    { texto: 'Raphael C, Briscoe C, Davies J, et al. Limitations of the New York Heart Association functional classification system and self-reported walking distances in chronic heart failure. Heart. 2007;93(4):476-82.', doi: '10.1136/hrt.2006.089656' },
  ],
};
