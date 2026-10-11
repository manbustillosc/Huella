// Comorbilidad y riesgo hospitalario: índice de Charlson (original y combinado con la edad), CIRS-G y NEWS2.
// Ninguno muestra porcentajes de mortalidad: dependen de la cohorte y del horizonte de seguimiento.
// NEWS2 informa la categoría de riesgo del RCP; la respuesta clínica sigue el protocolo de cada institución.

const EDAD = { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad' };
const minus = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/* ---------- Índice de comorbilidad de Charlson ---------- */

// Condiciones y pesos de Charlson et al. (1987). Las jerárquicas (diabetes, hígado, tumor sólido) cuentan solo la más grave.
const cond = (id, texto, peso, ayuda) => ({
  id, texto, textoCorto: texto.toLowerCase(), compacto: true, ayuda,
  opciones: [{ texto: 'Sí', valor: peso }, { texto: 'No', valor: 0 }],
});
const CONDICIONES = [
  cond('iam', 'Infarto de miocardio', 1, 'Antecedente documentado de infarto (no solo cambios en el electrocardiograma).'),
  cond('icc', 'Insuficiencia cardiaca', 1, 'Sintomática y con respuesta a su tratamiento.'),
  cond('vascular', 'Enfermedad vascular periférica', 1, 'Claudicación, derivación arterial por insuficiencia, gangrena, insuficiencia arterial aguda o aneurisma no tratado de 6 cm o más.'),
  cond('cerebro', 'Enfermedad cerebrovascular', 1, 'Evento vascular cerebral con secuelas leves o sin ellas, o isquemia cerebral transitoria. La hemiplejía se registra aparte.'),
  cond('demencia', 'Demencia', 1, 'Deterioro cognitivo crónico.'),
  cond('pulmonar', 'Enfermedad pulmonar crónica', 1, 'Disnea sintomática por una enfermedad respiratoria crónica, incluida el asma.'),
  cond('conectivo', 'Enfermedad del tejido conectivo', 1, 'Lupus, polimiositis, enfermedad mixta del tejido conectivo, polimialgia reumática o artritis reumatoide moderada o grave.'),
  cond('ulcera', 'Enfermedad ulcerosa péptica', 1, 'Úlcera péptica que ha requerido tratamiento, incluida la que sangró.'),
  {
    id: 'higado', texto: 'Enfermedad hepática', textoCorto: 'enfermedad hepática',
    ayuda: 'Leve: cirrosis sin hipertensión portal o hepatitis crónica. Moderada o grave: cirrosis con hipertensión portal, con o sin sangrado variceal.',
    opciones: [{ texto: 'No', valor: 0 }, { texto: 'Leve', valor: 1 }, { texto: 'Moderada o grave', valor: 3 }],
  },
  {
    id: 'diabetes', texto: 'Diabetes', textoCorto: 'diabetes',
    ayuda: 'Tratada con fármacos (no solo con dieta). Daño a órgano blanco: retinopatía, neuropatía o nefropatía.',
    opciones: [{ texto: 'No', valor: 0 }, { texto: 'Sin daño a órgano blanco', valor: 1 }, { texto: 'Con daño a órgano blanco', valor: 2 }],
  },
  cond('hemiplejia', 'Hemiplejía o paraplejía', 2, 'De cualquier causa.'),
  cond('renal', 'Enfermedad renal moderada o grave', 2, 'Creatinina mayor de 3 mg/dL (265 µmol/L), diálisis, trasplante o uremia.'),
  {
    id: 'tumor', texto: 'Tumor sólido', textoCorto: 'tumor sólido',
    ayuda: 'Sin metástasis: tratamiento inicial en los últimos 5 años (excluye cáncer de piel no melanoma y carcinoma cervicouterino in situ).',
    opciones: [{ texto: 'No', valor: 0 }, { texto: 'Sin metástasis', valor: 2 }, { texto: 'Con metástasis', valor: 6 }],
  },
  cond('leucemia', 'Leucemia', 2, 'Aguda o crónica, incluida la policitemia vera.'),
  cond('linfoma', 'Linfoma', 2, 'Hodgkin, no Hodgkin, macroglobulinemia de Waldenström o mieloma.'),
  cond('sida', 'Sida', 6, 'Sida definido (no solo infección por VIH).'),
];
const IDS_CHARLSON = CONDICIONES.map((c) => c.id);

// Índice combinado edad-comorbilidad (Charlson et al., 1994): un punto por cada década después de los 40 años.
export function puntosEdadCharlson(edad) {
  if (!Number.isFinite(edad) || edad < 50) return 0;
  return Math.floor((edad - 40) / 10);
}

export const charlson = {
  id: 'charlson',
  nombre: 'Índice de comorbilidad de Charlson',
  corto: 'Charlson',
  dominio: 'comorbilidad',
  tipo: 'pronostico',
  aliases: ['comorbilidad', 'CCI', 'multimorbilidad', 'Charlson ajustado por edad', 'indice combinado'],
  problemas: ['comorbilidad', 'multimorbilidad', 'pronóstico'],
  descripcion: '19 condiciones ponderadas (1987) y, aparte, el índice combinado con la edad (1994). No estima un porcentaje de mortalidad.',
  objetivo: 'Cuantificar la carga de comorbilidad con pesos pronósticos para describirla y compararla en el tiempo.',
  poblacion: 'Adultos hospitalizados o ambulatorios; se desarrolló en pacientes de medicina interna.',
  aplicacion: [
    'Marca cada condición con la información clínica disponible (expediente, entrevista, estudios).',
    'Diabetes, enfermedad hepática y tumor sólido son jerárquicas: elige solo la categoría más grave.',
    'La edad se usa solo para el índice combinado edad-comorbilidad, que se informa aparte.',
  ],
  tiempo: '3 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor puntaje',
  textoEmpeoramiento: 'mayor carga de comorbilidad',
  barra: false,
  min: 0,
  max: 33,
  detalleEnResumen: true,
  campos: [EDAD, ...CONDICIONES],
  bandas: [
    { min: 0, max: 0, id: 'cero', rango: '0', etiqueta: 'Sin condiciones del índice', nivel: 'bien', texto: 'Ninguna de las condiciones del índice de Charlson.' },
    { min: 1, max: 2, id: 'baja', rango: '1 a 2', etiqueta: 'Carga de comorbilidad baja', nivel: 'leve', texto: 'Estrato de 1 a 2 puntos de la cohorte original.' },
    { min: 3, max: 4, id: 'moderada', rango: '3 a 4', etiqueta: 'Carga de comorbilidad moderada', nivel: 'moderado', hallazgo: true, texto: 'Estrato de 3 a 4 puntos de la cohorte original.' },
    { min: 5, max: 33, id: 'alta', rango: '5 o más', etiqueta: 'Carga de comorbilidad alta', nivel: 'grave', hallazgo: true, texto: 'Estrato de 5 o más puntos de la cohorte original.' },
  ],
  calcular({ v }) {
    const puntaje = IDS_CHARLSON.reduce((s, id) => s + (v[id]?.valor || 0), 0);
    const edadPts = puntosEdadCharlson(v.edad);
    const combinado = puntaje + edadPts;
    const presentes = CONDICIONES.filter((c) => v[c.id]?.valor > 0).map((c) => `${c.opciones.length > 2 ? `${c.texto.toLowerCase()} ${minus(v[c.id].texto)}` : c.texto.toLowerCase()} (${v[c.id].valor})`);
    const lineas = [
      presentes.length ? `Condiciones: ${presentes.join('; ')}.` : 'Sin condiciones del índice.',
      `Índice combinado edad-comorbilidad: ${combinado} (${puntaje} por comorbilidad + ${edadPts} por edad).`,
    ];
    return {
      puntaje, max: 33, lineas, lineasNota: lineas,
      banda: { ...charlson.bandas.find((b) => puntaje >= b.min && puntaje <= b.max), sugerencias: puntaje >= 3 ? ['Integrar la carga de comorbilidad en las metas de atención, la revisión de la medicación y la planificación del seguimiento.'] : [] },
      extras: { original: puntaje, combinado, edadPts, presentes: presentes.length },
    };
  },
  resumen: (res) => `Charlson: ${res.puntaje} (${minus(res.banda.etiqueta)}); índice combinado con la edad ${res.extras.combinado}.`,
  resumenBreve: (res) => `Charlson ${res.puntaje} (con edad ${res.extras.combinado})`,
  comparable: (a, b) => (a.extras?.edadPts != null && b.extras?.edadPts != null && a.extras.edadPts !== b.extras.edadPts ? { advertencia: `El índice combinado cambió también por la edad (de ${a.extras.combinado} a ${b.extras.combinado}); la comparación usa el índice original, que refleja solo la comorbilidad.` } : null),
  notas: [
    'Pesos de Charlson et al. (1987): 1 punto (infarto, insuficiencia cardiaca, vascular periférica, cerebrovascular, demencia, pulmonar crónica, tejido conectivo, úlcera, hepática leve, diabetes sin daño a órgano blanco); 2 (hemiplejía, renal moderada o grave, diabetes con daño a órgano blanco, tumor sin metástasis, leucemia, linfoma); 3 (hepática moderada o grave); 6 (tumor metastásico, sida).',
    'Índice combinado (Charlson et al., 1994): un punto por cada década después de los 40 años (50 a 59 años: 1; 60 a 69: 2; 70 a 79: 3; 80 a 89: 4; 90 a 99: 5). Algunas calculadoras limitan la edad a 4 puntos desde los 80 años.',
    'Huella no muestra porcentajes de mortalidad: las cifras originales provienen de cohortes y horizontes concretos (p. ej., mortalidad a 1 año en 559 pacientes de medicina interna) y no se trasladan a otra población.',
    'Las adaptaciones con códigos de diagnóstico (Deyo, Quan) o pesos actualizados son instrumentos distintos.',
  ],
  referencias: [
    { texto: 'Charlson ME, Pompei P, Ales KL, MacKenzie CR. A new method of classifying prognostic comorbidity in longitudinal studies: development and validation. J Chronic Dis. 1987;40(5):373-83.', doi: '10.1016/0021-9681(87)90171-8' },
    { texto: 'Charlson M, Szatrowski TP, Peterson J, Gold J. Validation of a combined comorbidity index. J Clin Epidemiol. 1994;47(11):1245-51.', doi: '10.1016/0895-4356(94)90129-5' },
  ],
};

/* ---------- CIRS-G ---------- */

const SISTEMAS_CIRSG = [
  ['cardiaco', 'Cardiaco'],
  ['vascular', 'Vascular'],
  ['hemato', 'Hematopoyético'],
  ['respiratorio', 'Respiratorio'],
  ['oorl', 'Ojos, oídos, nariz, garganta y laringe'],
  ['gi_sup', 'Gastrointestinal superior'],
  ['gi_inf', 'Gastrointestinal inferior'],
  ['hepatico', 'Hígado'],
  ['renal', 'Renal'],
  ['genitourinario', 'Genitourinario'],
  ['musculo', 'Musculoesquelético y piel'],
  ['neuro', 'Neurológico'],
  ['endocrino', 'Endocrino, metabólico y mama'],
  ['psiquiatrico', 'Psiquiátrico'],
];
const NIVELES_CIRSG = [
  { texto: '0 · Sin problema', valor: 0 },
  { texto: '1 · Leve, o antecedente significativo', valor: 1 },
  { texto: '2 · Moderado, o requiere tratamiento de primera línea', valor: 2 },
  { texto: '3 · Grave, discapacidad constante o difícil de controlar', valor: 3 },
  { texto: '4 · Muy grave: tratamiento inmediato, falla orgánica o deterioro funcional grave', valor: 4 },
];

export const cirsg = {
  id: 'cirsg',
  nombre: 'Escala acumulativa de enfermedad, versión geriátrica (CIRS-G)',
  corto: 'CIRS-G',
  dominio: 'comorbilidad',
  tipo: 'evaluacion',
  aliases: ['CIRS', 'Cumulative Illness Rating Scale', 'carga de enfermedad', 'multimorbilidad', 'comorbilidad'],
  problemas: ['multimorbilidad', 'comorbilidad', 'carga de enfermedad'],
  descripcion: 'Gravedad de 0 a 4 en 14 sistemas, con puntaje total, sistemas afectados, índice de gravedad y número de sistemas en nivel 3 o 4.',
  objetivo: 'Describir la carga de enfermedad crónica por sistemas para la planificación y el seguimiento.',
  poblacion: 'Personas mayores en cualquier ámbito; requiere juicio clínico y la información médica completa.',
  aplicacion: [
    'Califica cada sistema según su problema más grave, con el manual de Miller y Towers (1991).',
    'Usa toda la información disponible: historia, exploración, estudios y medicación.',
  ],
  tiempo: '5 a 10 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor carga de enfermedad',
  textoEmpeoramiento: 'mayor carga de enfermedad',
  barra: false,
  min: 0,
  max: 56,
  detalleEnResumen: true,
  campos: SISTEMAS_CIRSG.map(([id, texto]) => ({ id, texto, textoCorto: texto.toLowerCase(), opciones: NIVELES_CIRSG })),
  bandas: [
    { id: 'registrada', rango: '0 a 56', etiqueta: 'Carga de enfermedad registrada', nivel: 'neutro', texto: 'La CIRS-G no tiene puntos de corte validados: se interpretan el perfil por sistemas y los puntajes derivados.' },
    { id: 'grave', rango: 'Algún sistema en nivel 3 o 4', etiqueta: 'Problemas graves en uno o más sistemas', nivel: 'moderado', hallazgo: true, texto: 'Uno o más sistemas en nivel 3 o 4. La CIRS-G no tiene puntos de corte validados para el total.' },
  ],
  calcular({ v }) {
    const niveles = SISTEMAS_CIRSG.map(([id, n]) => ({ n, x: v[id].valor }));
    const total = niveles.reduce((s, x) => s + x.x, 0);
    const afectados = niveles.filter((x) => x.x > 0);
    const indice = afectados.length ? total / afectados.length : 0;
    const n3 = niveles.filter((x) => x.x === 3);
    const n4 = niveles.filter((x) => x.x === 4);
    const lineas = [
      `Sistemas afectados: ${afectados.length} de 14. Índice de gravedad (total ÷ sistemas afectados): ${indice.toFixed(2)}.`,
      `Sistemas en nivel 3: ${n3.length}${n3.length ? ` (${n3.map((x) => x.n.toLowerCase()).join(', ')})` : ''}. En nivel 4: ${n4.length}${n4.length ? ` (${n4.map((x) => x.n.toLowerCase()).join(', ')})` : ''}.`,
    ];
    const banda = n3.length || n4.length ? cirsg.bandas[1] : cirsg.bandas[0];
    return {
      puntaje: total, max: 56, banda: { ...banda, sugerencias: banda.hallazgo ? ['Revisar el control de los problemas graves y su repercusión funcional en el plan de atención.'] : [] },
      lineas, lineasNota: lineas, extras: { total, afectados: afectados.length, indice: Number(indice.toFixed(2)), nivel3: n3.length, nivel4: n4.length },
    };
  },
  resumen: (res) => `CIRS-G: ${res.puntaje}/56; ${res.extras.afectados} sistemas afectados, índice de gravedad ${res.extras.indice.toFixed(2)}, ${res.extras.nivel3} en nivel 3 y ${res.extras.nivel4} en nivel 4.`,
  resumenBreve: (res) => `CIRS-G ${res.puntaje}/56 (${res.extras.nivel3 + res.extras.nivel4} sistemas en nivel 3-4)`,
  cambioExtra: (a, b) => (a.extras && b.extras && (a.extras.nivel3 + a.extras.nivel4) !== (b.extras.nivel3 + b.extras.nivel4)
    ? [`Sistemas en nivel 3 o 4: de ${a.extras.nivel3 + a.extras.nivel4} a ${b.extras.nivel3 + b.extras.nivel4}.`] : []),
  notas: [
    'Puntajes derivados (Miller et al., 1992): total (0 a 56), número de sistemas afectados, índice de gravedad (total entre sistemas afectados) y número de sistemas en nivel 3 y en nivel 4.',
    'Requiere juicio clínico: la calificación de cada sistema sigue las guías del manual, que Huella no reproduce.',
    'No hay puntos de corte validados para el total: Huella no lo clasifica en alto o bajo.',
  ],
  licencia: { texto: 'CIRS-G: manual de Miller y Towers (1991), Universidad de Pittsburgh. Huella registra el nivel por sistema con descripciones breves y no reproduce el manual; verifica las condiciones de uso con sus autores.' },
  referencias: [
    { texto: 'Miller MD, Paradis CF, Houck PR, et al. Rating chronic medical illness burden in geropsychiatric practice and research: application of the Cumulative Illness Rating Scale. Psychiatry Res. 1992;41(3):237-48.', doi: '10.1016/0165-1781(92)90005-N' },
    { texto: 'Linn BS, Linn MW, Gurel L. Cumulative illness rating scale. J Am Geriatr Soc. 1968;16(5):622-6.', doi: '10.1111/j.1532-5415.1968.tb02103.x' },
  ],
};

/* ---------- NEWS2 ---------- */

export function puntosNews2({ fr, spo2, escala2, oxigeno, pas, fc, alerta, temp }) {
  const p = {};
  p.fr = fr <= 8 ? 3 : fr <= 11 ? 1 : fr <= 20 ? 0 : fr <= 24 ? 2 : 3;
  if (!escala2) p.spo2 = spo2 <= 91 ? 3 : spo2 <= 93 ? 2 : spo2 <= 95 ? 1 : 0;
  else if (spo2 <= 83) p.spo2 = 3;
  else if (spo2 <= 85) p.spo2 = 2;
  else if (spo2 <= 87) p.spo2 = 1;
  else if (spo2 <= 92 || !oxigeno) p.spo2 = 0;
  else p.spo2 = spo2 <= 94 ? 1 : spo2 <= 96 ? 2 : 3;
  p.oxigeno = oxigeno ? 2 : 0;
  p.pas = pas <= 90 ? 3 : pas <= 100 ? 2 : pas <= 110 ? 1 : pas <= 219 ? 0 : 3;
  p.fc = fc <= 40 ? 3 : fc <= 50 ? 1 : fc <= 90 ? 0 : fc <= 110 ? 1 : fc <= 130 ? 2 : 3;
  p.conciencia = alerta ? 0 : 3;
  p.temp = temp <= 35.0 ? 3 : temp <= 36.0 ? 1 : temp <= 38.0 ? 0 : temp <= 39.0 ? 1 : 2;
  const total = Object.values(p).reduce((s, x) => s + x, 0);
  return { p, total, alguno3: Object.values(p).some((x) => x === 3) };
}

const B_NEWS = {
  bajo: { id: 'bajo', rango: '0 a 4', etiqueta: 'Riesgo clínico bajo', nivel: 'bien', texto: 'Puntaje agregado de 0 a 4 sin ningún parámetro con 3 puntos (categoría del RCP).' },
  bajomedio: { id: 'bajomedio', rango: '3 puntos en un parámetro', etiqueta: 'Riesgo clínico bajo a medio', nivel: 'leve', hallazgo: true, texto: 'Un parámetro con 3 puntos y agregado menor de 5 (categoría del RCP): requiere valoración clínica.' },
  medio: { id: 'medio', rango: '5 a 6', etiqueta: 'Riesgo clínico medio', nivel: 'moderado', hallazgo: true, texto: 'Puntaje agregado de 5 o 6: umbral del RCP para una respuesta urgente.' },
  alto: { id: 'alto', rango: '7 o más', etiqueta: 'Riesgo clínico alto', nivel: 'critico', hallazgo: true, texto: 'Puntaje agregado de 7 o más: umbral del RCP para una respuesta de emergencia.' },
};
const RESPUESTA_RCP = {
  cero: 'Referencia del RCP: monitorización al menos cada 12 horas.',
  bajo: 'Referencia del RCP: monitorización al menos cada 4 a 6 horas y valoración por enfermería.',
  bajomedio: 'Referencia del RCP: monitorización al menos cada hora y aviso al equipo médico para valorar si se escala la atención.',
  medio: 'Referencia del RCP: monitorización al menos cada hora y valoración urgente por personal con competencias en enfermedad aguda.',
  alto: 'Referencia del RCP: monitorización continua y valoración de emergencia por un equipo con competencias en cuidados críticos.',
};
const NOMBRES_NEWS = { fr: 'frecuencia respiratoria', spo2: 'SpO₂', oxigeno: 'oxígeno', pas: 'presión sistólica', fc: 'pulso', conciencia: 'conciencia', temp: 'temperatura' };

export const news2 = {
  id: 'news2',
  nombre: 'National Early Warning Score 2 (NEWS2)',
  corto: 'NEWS2',
  dominio: 'comorbilidad',
  tipo: 'tamizaje',
  aliases: ['NEWS', 'early warning score', 'alerta temprana', 'signos vitales', 'deterioro clínico', 'ACVPU'],
  problemas: ['deterioro clínico', 'sepsis', 'hospitalización', 'signos vitales'],
  descripcion: 'Siete parámetros fisiológicos, con dos escalas de SpO₂; puntaje agregado y categoría de riesgo clínico del RCP.',
  objetivo: 'Detectar el deterioro clínico agudo a partir de los signos vitales y apoyar la decisión de escalar la atención.',
  poblacion: 'Adultos de 16 años o más en el hospital o en la atención prehospitalaria; no validado en el embarazo.',
  aplicacion: [
    'Registra los signos vitales medidos en el mismo momento.',
    'Usa la escala 2 de SpO₂ solo si el médico confirmó insuficiencia respiratoria hipercápnica e indicó una meta de 88 a 92%; en los demás casos, la escala 1.',
    'Conciencia (ACVPU): una confusión nueva o que empeora cuenta como C, aunque la persona esté despierta.',
  ],
  tiempo: '2 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor puntaje',
  textoEmpeoramiento: 'mayor puntaje',
  barra: false,
  min: 0,
  max: 20,
  detalleEnResumen: true,
  campos: [
    { id: 'fr', tipo: 'numero', texto: 'Frecuencia respiratoria', unidad: 'respiraciones/min', min: 1, max: 80, entero: true },
    {
      id: 'escala_spo2', texto: 'Escala de SpO₂', textoCorto: 'escala de SpO₂', puntua: false,
      opciones: [
        { texto: 'Escala 1', valor: 1, detalle: 'La habitual.' },
        { texto: 'Escala 2', valor: 2, detalle: 'Solo con insuficiencia respiratoria hipercápnica confirmada y meta de 88 a 92% indicada por el médico.' },
      ],
    },
    { id: 'spo2', tipo: 'numero', texto: 'Saturación de oxígeno (SpO₂)', unidad: '%', min: 50, max: 100, entero: true },
    { id: 'oxigeno', texto: '¿Aire ambiente u oxígeno?', textoCorto: 'aire u oxígeno', puntua: false, opciones: [{ texto: 'Aire ambiente', valor: 0 }, { texto: 'Oxígeno suplementario', valor: 1 }] },
    { id: 'pas', tipo: 'numero', texto: 'Presión arterial sistólica', unidad: 'mmHg', min: 40, max: 300, entero: true },
    { id: 'fc', tipo: 'numero', texto: 'Pulso', unidad: 'latidos/min', min: 20, max: 250, entero: true },
    {
      id: 'conciencia', texto: 'Nivel de conciencia (ACVPU)', textoCorto: 'conciencia', puntua: false,
      opciones: [
        { texto: 'Alerta (A)', valor: 0 },
        { texto: 'Confusión nueva (C)', valor: 1 },
        { texto: 'Responde a la voz (V)', valor: 1 },
        { texto: 'Responde al dolor (P)', valor: 1 },
        { texto: 'No responde (U)', valor: 1 },
      ],
    },
    { id: 'temp', tipo: 'numero', texto: 'Temperatura', unidad: '°C', min: 25, max: 45, decimales: 1 },
  ],
  bandas: [B_NEWS.bajo, B_NEWS.bajomedio, B_NEWS.medio, B_NEWS.alto],
  calcular({ v }) {
    const escala2 = v.escala_spo2.valor === 2;
    const { p, total, alguno3 } = puntosNews2({
      fr: v.fr, spo2: v.spo2, escala2, oxigeno: v.oxigeno.valor === 1, pas: v.pas, fc: v.fc, alerta: v.conciencia.valor === 0, temp: v.temp,
    });
    let banda;
    let resp;
    if (total >= 7) { banda = B_NEWS.alto; resp = RESPUESTA_RCP.alto; } else if (total >= 5) { banda = B_NEWS.medio; resp = RESPUESTA_RCP.medio; } else if (alguno3) { banda = B_NEWS.bajomedio; resp = RESPUESTA_RCP.bajomedio; } else { banda = B_NEWS.bajo; resp = total === 0 ? RESPUESTA_RCP.cero : RESPUESTA_RCP.bajo; }
    const con3 = Object.entries(p).filter(([, x]) => x === 3).map(([k]) => NOMBRES_NEWS[k]);
    const lineas = [
      `Puntos: FR ${v.fr} (${p.fr}); SpO₂ ${v.spo2}% en escala ${escala2 ? 2 : 1} (${p.spo2}); ${v.oxigeno.valor === 1 ? 'oxígeno' : 'aire ambiente'} (${p.oxigeno}); PAS ${v.pas} (${p.pas}); pulso ${v.fc} (${p.fc}); ${minus(v.conciencia.texto)} (${p.conciencia}); temperatura ${v.temp} °C (${p.temp}).`,
    ];
    if (con3.length) lineas.push(`Parámetros con 3 puntos: ${con3.join(', ')}.`);
    if (escala2) lineas.push('Escala 2 de SpO₂: confirma que la meta de 88 a 92% está indicada por el médico.');
    lineas.push(`${resp} La respuesta y el escalamiento siguen el protocolo de tu institución.`);
    return {
      puntaje: total, max: 20, banda: { ...banda, sugerencias: banda.hallazgo ? ['Valorar al paciente y aplicar el protocolo institucional de escalamiento; el puntaje no sustituye el juicio clínico.'] : [] },
      lineas, lineasNota: lineas.slice(0, -1), alertas: total >= 5 ? [`NEWS2 ${total}: ${banda.texto} Aplica el protocolo de tu institución.`] : [],
      extras: { puntos: p, total, alguno3, escala2 },
    };
  },
  comparable: (a, b) => (a.extras && b.extras && a.extras.escala2 !== b.extras.escala2 ? { advertencia: 'Una medición usó la escala 1 de SpO₂ y otra la escala 2.' } : null),
  resumen: (res) => `NEWS2: ${res.puntaje} (${minus(res.banda.etiqueta)}).`,
  resumenBreve: (res) => `NEWS2 ${res.puntaje}`,
  notas: [
    'Categorías del RCP: 0 a 4, riesgo bajo; 3 puntos en un parámetro, riesgo bajo a medio; 5 o 6, riesgo medio (umbral de respuesta urgente); 7 o más, riesgo alto (umbral de respuesta de emergencia).',
    'La frecuencia de monitorización y el escalamiento que se muestran son la referencia del RCP; aplica el protocolo de tu institución.',
    'En personas mayores, la fragilidad, la medicación (p. ej., betabloqueadores) y los valores basales modifican los signos vitales: el puntaje no sustituye la valoración clínica.',
  ],
  licencia: {
    texto: 'Reproducido de: Royal College of Physicians. National Early Warning Score (NEWS) 2: Standardising the assessment of acute-illness severity in the NHS. Updated report of a working party. London: RCP, 2017. La redacción de esta traducción no ha sido aprobada específicamente por el Royal College of Physicians; consulta la versión original en inglés antes de su uso clínico. Huella no reproduce la gráfica de NEWS2.',
    enlace: 'https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/',
  },
  referencias: [
    { texto: 'Royal College of Physicians. National Early Warning Score (NEWS) 2: Standardising the assessment of acute-illness severity in the NHS. Updated report of a working party. London: RCP; 2017.', enlace: 'https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/' },
  ],
};

export const ESCALAS_COMORBILIDAD = [charlson, cirsg, news2];
