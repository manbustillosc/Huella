// Riesgo prequirúrgico por procedimiento (versión 2.12): calculadora de Gupta (MICA), derivada de ACS NSQIP, y registro
// de los porcentajes de la calculadora oficial ACS NSQIP (Huella no reproduce ni aproxima ese modelo).
import { UNIDADES_CREATININA } from './ckdepi.js';

const minus = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/* ---------- Gupta: infarto o paro cardiaco perioperatorio (MICA) ---------- */

// Coeficientes del modelo logístico de Gupta et al. (Circulation, 2011), datos ACS NSQIP 2007.
export const GUPTA_CONSTANTE = -5.25;
export const GUPTA_EDAD = 0.02;
export const GUPTA_ASA = [['I', -5.17], ['II', -3.29], ['III', -1.92], ['IV', -0.95], ['V', 0]];
export const GUPTA_FUNCIONAL = [
  ['Independiente', 0, 'No necesita ayuda de otra persona para las actividades básicas de la vida diaria.'],
  ['Parcialmente dependiente', 0.65, 'Necesita ayuda de otra persona para algunas actividades básicas.'],
  ['Totalmente dependiente', 1.03, 'Necesita ayuda de otra persona para todas las actividades básicas.'],
];
export const GUPTA_CIRUGIA = [
  ['hernia', 'Hernia (ventral, inguinal o femoral)', 0],
  ['anorrectal', 'Anorrectal', -0.16],
  ['aorta', 'Aórtica', 1.6],
  ['bariatrica', 'Bariátrica', -0.25],
  ['cerebro', 'Cerebral', 1.4],
  ['mama', 'Mama', -1.61],
  ['cardiaca', 'Cardiaca', 1.01],
  ['orl', 'Otorrinolaringología (excepto tiroides y paratiroides)', 0.71],
  ['digestiva', 'Esófago, estómago, hígado, páncreas o vías biliares (excepto colecistectomía aislada)', 1.39],
  ['vesicula', 'Vesícula, apéndice, glándulas suprarrenales o bazo', 0.59],
  ['intestino', 'Intestinal (por debajo del duodeno)', 1.14],
  ['cuello', 'Cuello (tiroides y paratiroides)', 0.18],
  ['gineco', 'Obstétrica o ginecológica', 0.76],
  ['orto', 'Ortopédica y de extremidades (no vascular)', 0.8],
  ['abdomen', 'Otra cirugía abdominal', 1.13],
  ['vascular', 'Vascular periférica (no aórtica ni venosa)', 0.86],
  ['piel', 'Piel', 0.54],
  ['columna', 'Columna', 0.21],
  ['torax', 'Torácica (no esofágica ni cardiaca)', 0.4],
  ['vena', 'Venosa', -1.09],
  ['urologia', 'Urológica', -0.26],
];

export function riesgoGupta({ edad, asa, funcional, creatinina, cirugia }) {
  const x = GUPTA_CONSTANTE + GUPTA_EDAD * edad + asa + funcional + creatinina + cirugia;
  return (100 * Math.exp(x)) / (1 + Math.exp(x));
}
export const fmtRiesgo = (p) => (p < 0.01 ? 'menos de 0.01' : p < 1 ? Number(p.toFixed(2)).toString() : Number(p.toFixed(1)).toString());
const CORTE_ELEVADO = 1;

const creatininaMgDl = (res) => {
  const n = Number(String(res.respuestas?.creatinina ?? '').replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  const u = UNIDADES_CREATININA.find((x) => x.id === res.respuestas.creatinina_u) || UNIDADES_CREATININA[0];
  return u.aBase ? u.aBase(n) : n;
};
const vinculoCreatinina = (escala, titulo) => ({
  id: escala, escala, titulo,
  disponible: (res) => (creatininaMgDl(res) != null ? true : 'El resultado guardado no tiene la creatinina registrada.'),
  describir: (res) => `Creatinina ${Number(creatininaMgDl(res).toFixed(2))} mg/dL (${creatininaMgDl(res) > 1.5 ? 'mayor de 1.5' : '1.5 o menos'})`,
  aplicar: (res) => ({ creatinina: creatininaMgDl(res) > 1.5 ? 1 : 0 }),
  campos: ['creatinina'],
});

const B_GUPTA = {
  bajo: {
    id: 'bajo', rango: 'Menos de 1 %', etiqueta: 'Riesgo cardiaco bajo: menos de 1 %', nivel: 'bien',
    texto: 'Riesgo de infarto o paro cardiaco perioperatorio menor de 1 %: riesgo bajo según la guía ACC/AHA (2014), que permite proceder a la cirugía sin más pruebas cardiacas por este motivo.',
    sugerencias: [],
  },
  elevado: {
    id: 'elevado', rango: '1 % o más', etiqueta: 'Riesgo cardiaco elevado: 1 % o más', nivel: 'moderado', hallazgo: true,
    texto: 'Riesgo de infarto o paro cardiaco perioperatorio de 1 % o más: riesgo elevado según la guía ACC/AHA (2014). Valora la capacidad funcional (DASI o MET) y si las pruebas adicionales cambiarían el manejo.',
    sugerencias: ['Valorar la capacidad funcional (DASI) y seguir el algoritmo de riesgo cardiovascular de la VPO.', 'Considerar biomarcadores (NT-proBNP o troponina) según la guía y la disponibilidad local.'],
  },
};

export const gupta = {
  id: 'gupta',
  nombre: 'Riesgo cardiaco perioperatorio de Gupta (MICA)',
  corto: 'Gupta (MICA)',
  dominio: 'prequirurgica',
  tipo: 'pronostico',
  aliases: ['Gupta', 'MICA', 'myocardial infarction or cardiac arrest', 'NSQIP', 'riesgo cardiaco', 'infarto perioperatorio', 'paro cardiaco', 'cirugia no cardiaca', 'preoperatorio'],
  problemas: ['cirugía', 'valoración preoperatoria', 'riesgo cardiovascular'],
  descripcion: 'Porcentaje de riesgo de infarto o paro cardiaco perioperatorio según la edad, la ASA, el estado funcional, la creatinina y el tipo de cirugía (datos ACS NSQIP).',
  objetivo: 'Estimar el riesgo individual de infarto o paro cardiaco hasta 30 días después de la cirugía, según el tipo de procedimiento.',
  poblacion: 'Derivado en 211 410 pacientes quirúrgicos de más de 250 hospitales del ACS NSQIP (2007) y validado en 257 385 (2008); estadístico C de 0.874, mayor que el del RCRI (0.747) en la misma población (Gupta, 2011).',
  aplicacion: [
    'Usa la clase ASA asignada para esta cirugía (puedes reutilizar la que ya registraste) y la creatinina preoperatoria más reciente.',
    'Estado funcional en los 30 días previos a la cirugía: necesidad de ayuda de otra persona para las actividades básicas de la vida diaria.',
    'Elige el grupo de cirugía que mejor corresponda al procedimiento principal.',
  ],
  tiempo: '1 min',
  momentos: false,
  direccionClinica: 'sin_direccion',
  barra: false,
  unidadCambio: '%',
  decimalesCambio: 2,
  min: 0,
  max: 100,
  vinculos: [
    {
      id: 'asa', escala: 'asa', titulo: 'Clase ASA',
      disponible: (res) => (GUPTA_ASA.some(([c]) => c === res.extras?.clase) ? true : 'La clase ASA guardada no aplica (ASA VI).'),
      describir: (res) => `ASA ${res.extras.clase}`,
      aplicar: (res) => ({ asa: GUPTA_ASA.findIndex(([c]) => c === res.extras.clase) }),
      campos: ['asa'],
    },
    vinculoCreatinina('ckdepi', 'Creatinina de CKD-EPI 2021'),
    vinculoCreatinina('cockcroft', 'Creatinina de Cockcroft-Gault'),
    vinculoCreatinina('bis', 'Creatinina de BIS'),
  ],
  campos: [
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad' },
    { id: 'asa', texto: 'Clase ASA', textoCorto: 'clase ASA', puntua: false, opciones: GUPTA_ASA.map(([c, b]) => ({ texto: `ASA ${c}`, valor: b })) },
    { id: 'funcional', texto: 'Estado funcional en los 30 días previos', textoCorto: 'estado funcional', puntua: false, opciones: GUPTA_FUNCIONAL.map(([t, b, d]) => ({ texto: t, valor: b, detalle: d })) },
    { id: 'creatinina', texto: 'Creatinina preoperatoria mayor de 1.5 mg/dL (133 µmol/L)', textoCorto: 'creatinina >1.5 mg/dL', puntua: false, opciones: [{ texto: 'No', valor: 0 }, { texto: 'Sí', valor: 0.61 }] },
    { id: 'cirugia', texto: 'Tipo de cirugía', textoCorto: 'tipo de cirugía', puntua: false, opciones: GUPTA_CIRUGIA.map(([, t, b]) => ({ texto: t, valor: b })) },
  ],
  bandas: [B_GUPTA.bajo, B_GUPTA.elevado],
  calcular({ v }) {
    const riesgo = riesgoGupta({ edad: v.edad, asa: v.asa.valor, funcional: v.funcional.valor, creatinina: v.creatinina.valor, cirugia: v.cirugia.valor });
    const banda = riesgo < CORTE_ELEVADO ? B_GUPTA.bajo : B_GUPTA.elevado;
    const lineas = [
      `${v.edad} años, ${v.asa.texto}, ${minus(v.funcional.texto)}, creatinina ${v.creatinina.valor ? 'mayor de 1.5 mg/dL' : 'de 1.5 mg/dL o menos'}; cirugía: ${minus(v.cirugia.texto)}.`,
    ];
    return {
      valor: riesgo, unidad: '%', mostrar: fmtRiesgo(riesgo), sufijo: '% de infarto o paro cardiaco', banda, lineas, lineasNota: lineas,
      extras: { riesgo: Number(riesgo.toFixed(3)), cirugia: v.cirugia.texto, asa: v.asa.texto },
    };
  },
  frase: (res) => `Gupta (MICA): ${fmtRiesgo(res.valor)} % de riesgo de infarto o paro cardiaco perioperatorio (hasta 30 días), ${res.banda.id === 'bajo' ? 'riesgo bajo' : 'riesgo elevado'} (umbral de 1 %, ACC/AHA). Cirugía: ${minus(res.extras.cirugia)}.`,
  resumen: (res) => gupta.frase(res),
  resumenBreve: (res) => `Gupta ${fmtRiesgo(res.valor)} % de infarto o paro cardiaco`,
  detalleEnResumen: true,
  notas: [
    'Desenlace: infarto o paro cardiaco hasta 30 días después de la cirugía (definiciones del ACS NSQIP). No incluye edema pulmonar ni arritmias, que sí cuenta el RCRI.',
    'Modelo: riesgo = eˣ / (1 + eˣ), con x = −5.25 + 0.02 × edad + estado funcional + ASA + creatinina + tipo de cirugía (coeficientes de Gupta, 2011). La cirugía de hernia es la referencia (0).',
    'Umbral de 1 %: la guía ACC/AHA (2014) considera riesgo bajo de eventos cardiacos mayores un riesgo menor de 1 %, estimado con el RCRI o con calculadoras como la de Gupta o la de ACS NSQIP.',
    'Derivado en hospitales de Estados Unidos; la clasificación ASA es subjetiva y cambia el resultado de forma importante. Estima un riesgo de grupo, no sustituye el juicio clínico.',
  ],
  licencia: { texto: 'Modelo publicado por Gupta et al. (Circulation, 2011); Huella aplica la ecuación publicada.' },
  referencias: [
    { texto: 'Gupta PK, Gupta H, Sundaram A, et al. Development and validation of a risk calculator for prediction of cardiac risk after surgery. Circulation. 2011;124(4):381-7.', doi: '10.1161/CIRCULATIONAHA.110.015701' },
    { texto: 'Fleisher LA, Fleischmann KE, Auerbach AD, et al. 2014 ACC/AHA guideline on perioperative cardiovascular evaluation and management of patients undergoing noncardiac surgery. Circulation. 2014;130(24):e278-333.', doi: '10.1161/CIR.0000000000000106' },
  ],
};

/* ---------- ACS NSQIP: registro de la calculadora oficial ---------- */

export const NSQIP_DESENLACES = [
  ['muerte', 'Muerte'],
  ['grave', 'Complicación grave'],
  ['cualquiera', 'Cualquier complicación'],
  ['neumonia', 'Neumonía'],
  ['cardiaca', 'Complicación cardiaca'],
  ['isq', 'Infección del sitio quirúrgico'],
  ['itu', 'Infección urinaria'],
  ['tev', 'Tromboembolia venosa'],
  ['renal', 'Insuficiencia renal'],
  ['sepsis', 'Sepsis'],
  ['reingreso', 'Reingreso'],
  ['reoperacion', 'Regreso al quirófano'],
  ['alta', 'Alta a un centro de cuidados o rehabilitación'],
];
const ENLACE_NSQIP = 'https://riskcalculator.facs.org';

export const nsqip = {
  id: 'nsqip',
  nombre: 'Calculadora de riesgo quirúrgico ACS NSQIP (registro)',
  corto: 'ACS NSQIP',
  dominio: 'prequirurgica',
  tipo: 'pronostico',
  registro: true,
  aliases: ['NSQIP', 'ACS NSQIP', 'American College of Surgeons', 'riesgo quirúrgico', 'calculadora de riesgo quirúrgico', 'mortalidad quirúrgica', 'complicaciones', 'riskcalculator'],
  problemas: ['cirugía', 'valoración preoperatoria', 'riesgo quirúrgico'],
  descripcion: 'Registro de los porcentajes de riesgo que da la calculadora oficial ACS NSQIP para el procedimiento: muerte, complicaciones, reingreso y otros.',
  objetivo: 'Documentar el riesgo específico del procedimiento calculado en la herramienta oficial del American College of Surgeons.',
  poblacion: 'Modelo universal del ACS NSQIP basado en más de 1.4 millones de pacientes de 393 hospitales y 1557 procedimientos (Bilimoria, 2013); se actualiza periódicamente.',
  aplicacion: [
    `Calcula el riesgo en la herramienta oficial (${ENLACE_NSQIP}) con el procedimiento (CPT) y los 20 factores del paciente. Huella no reproduce ni aproxima el modelo.`,
    'Copia aquí los porcentajes que te interesen; deja en blanco los que no. Registra al menos uno.',
    'No anotes datos que identifiquen a la persona.',
  ],
  tiempo: '1 min (registro)',
  direccionClinica: 'sin_direccion',
  barra: false,
  campos: [
    ...NSQIP_DESENLACES.map(([id, texto], i) => ({ id, tipo: 'numero', texto, unidad: '%', min: 0, max: 100, decimales: 1, opcional: true, ...(i === 0 ? { grupo: 'Riesgo calculado para esta persona' } : {}) })),
    { id: 'estancia', tipo: 'numero', texto: 'Estancia hospitalaria prevista', unidad: 'días', min: 0, max: 120, decimales: 1, opcional: true },
  ],
  validar({ v }) {
    return NSQIP_DESENLACES.some(([id]) => Number.isFinite(v[id])) ? null : { muerte: 'Registra al menos un porcentaje de la calculadora oficial.' };
  },
  bandas: [{
    id: 'registro', rango: 'Registro', etiqueta: 'Riesgos de la calculadora ACS NSQIP', nivel: 'neutro',
    texto: 'Porcentajes de la calculadora oficial ACS NSQIP para esta persona y este procedimiento. Huella no los calcula ni los clasifica.',
    sugerencias: [],
  }],
  calcular({ v }) {
    const presentes = NSQIP_DESENLACES.filter(([id]) => Number.isFinite(v[id])).map(([id, texto]) => ({ id, texto, valor: v[id] }));
    const partes = presentes.map((x) => `${minus(x.texto)} ${Number(x.valor.toFixed(1))} %`);
    if (Number.isFinite(v.estancia)) partes.push(`estancia prevista ${Number(v.estancia.toFixed(1))} días`);
    const lineas = [`${partes.join('; ')}.`.replace(/^./, (c) => c.toUpperCase())];
    const muerte = Number.isFinite(v.muerte) ? v.muerte : null;
    return {
      banda: nsqip.bandas[0], valor: muerte, unidad: '%', mostrar: muerte != null ? Number(muerte.toFixed(1)).toString() : `${presentes.length}`,
      sufijo: muerte != null ? '% de muerte' : (presentes.length === 1 ? 'desenlace registrado' : 'desenlaces registrados'),
      lineas, lineasNota: [],
      detalles: [{ titulo: 'Riesgo de la calculadora oficial', encabezados: ['Desenlace', 'Riesgo'], filas: presentes.map((x) => [x.texto, `${Number(x.valor.toFixed(1))} %`]) }],
      extras: Object.fromEntries([...presentes.map((x) => [x.id, x.valor]), ['estancia', Number.isFinite(v.estancia) ? v.estancia : null]]),
    };
  },
  frase: (res) => `ACS NSQIP (calculadora oficial): ${res.lineas[0].replace(/^./, (c) => c.toLowerCase())}`,
  resumen: (res) => nsqip.frase(res),
  resumenBreve: (res) => (res.extras.muerte != null ? `ACS NSQIP: muerte ${Number(res.extras.muerte.toFixed(1))} %` : 'ACS NSQIP: riesgos registrados'),
  detalleEnResumen: true,
  notas: [
    'Huella solo registra los porcentajes; el cálculo depende del procedimiento (CPT) y de 20 factores del paciente que solo la herramienta oficial combina.',
    'La calculadora oficial muestra también el riesgo de un paciente promedio para el mismo procedimiento y permite un ajuste del cirujano; anótalo en tu nota si lo usas.',
    'El modelo se basa en hospitales del programa ACS NSQIP, sobre todo de Estados Unidos, y se recalibra con el tiempo: registra la fecha en que calculaste.',
  ],
  licencia: { texto: 'ACS NSQIP Surgical Risk Calculator © American College of Surgeons. Huella no reproduce ni aproxima su modelo: registra los resultados de la herramienta oficial.', enlace: ENLACE_NSQIP },
  referencias: [
    { texto: 'Bilimoria KY, Liu Y, Paruch JL, et al. Development and evaluation of the universal ACS NSQIP surgical risk calculator: a decision aid and informed consent tool for patients and surgeons. J Am Coll Surg. 2013;217(5):833-42.', doi: '10.1016/j.jamcollsurg.2013.07.385' },
    { texto: 'American College of Surgeons. ACS NSQIP Surgical Risk Calculator.', enlace: ENLACE_NSQIP },
  ],
};

export const ESCALAS_PREQX = [gupta, nsqip];
