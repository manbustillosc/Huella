// ARISCAT: riesgo de complicaciones pulmonares posoperatorias (Canet, 2010; validación externa PERISCOPE, Mazo 2014).
const sino = (id, texto, puntos, ayuda) => ({
  id, texto, textoCorto: texto.toLowerCase(), ayuda, puntua: false,
  opciones: [{ texto: 'No', valor: 0 }, { texto: 'Sí', valor: puntos }],
});

export function puntosEdad(edad) {
  return edad <= 50 ? 0 : edad <= 80 ? 3 : 16;
}
export function puntosSpO2(spo2) {
  return spo2 >= 96 ? 0 : spo2 >= 91 ? 8 : 24;
}

const BANDAS = [
  {
    id: 'bajo', min: 0, max: 25, rango: 'Menos de 26', etiqueta: 'Riesgo bajo', nivel: 'bien',
    texto: 'Riesgo bajo de complicaciones pulmonares posoperatorias. En la validación europea PERISCOPE se observaron en 3.4 % durante la hospitalización.',
    sugerencias: [],
  },
  {
    id: 'intermedio', min: 26, max: 44, rango: '26 a 44', etiqueta: 'Riesgo intermedio', nivel: 'moderado', hallazgo: true,
    texto: 'Riesgo intermedio de complicaciones pulmonares posoperatorias. En la validación europea PERISCOPE se observaron en 13.0 % durante la hospitalización.',
    sugerencias: [
      'Optimizar factores modificables antes de la cirugía (infección respiratoria reciente, anemia, enfermedad pulmonar descompensada) cuando la urgencia lo permita.',
      'Comentar con el equipo quirúrgico y de anestesia medidas de protección pulmonar, analgesia que permita toser y movilización temprana.',
    ],
  },
  {
    id: 'alto', min: 45, max: 123, rango: '45 o más', etiqueta: 'Riesgo alto', nivel: 'grave', hallazgo: true,
    texto: 'Riesgo alto de complicaciones pulmonares posoperatorias. En la validación europea PERISCOPE se observaron en 38.0 % durante la hospitalización.',
    sugerencias: [
      'Optimizar factores modificables y discutir con el equipo quirúrgico y de anestesia la técnica, la duración prevista y la vigilancia posoperatoria.',
      'Planear fisioterapia respiratoria, movilización temprana y analgesia multimodal.',
    ],
  },
];

export default {
  id: 'ariscat',
  nombre: 'Índice ARISCAT de riesgo pulmonar posoperatorio',
  corto: 'ARISCAT',
  dominio: 'prequirurgica',
  tipo: 'pronostico',
  aliases: ['Canet', 'complicaciones pulmonares posoperatorias', 'riesgo pulmonar', 'PERISCOPE'],
  problemas: ['cirugía', 'preoperatorio', 'complicaciones pulmonares', 'neumonía posoperatoria', 'anestesia'],
  descripcion: 'Siete variables preoperatorias y quirúrgicas: riesgo bajo, intermedio o alto de complicaciones pulmonares posoperatorias.',
  objetivo: 'Estimar el riesgo de complicaciones pulmonares durante la hospitalización tras una cirugía con anestesia general, neuroaxial o regional.',
  poblacion: 'Adultos sometidos a cirugía con anestesia general, neuroaxial o regional (Canet, 2010, Cataluña); validado en 63 centros europeos (Mazo, 2014).',
  aplicacion: [
    'Registra los datos preoperatorios: edad, SpO₂ en aire ambiente, infección respiratoria en el último mes y anemia.',
    'Registra la incisión y la duración prevista de la cirugía, y si es urgente.',
    'El resultado describe un riesgo poblacional; no se combina con el riesgo cardiaco ni con la fragilidad.',
  ],
  tiempo: '2 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor riesgo pulmonar estimado',
  textoEmpeoramiento: 'mayor riesgo pulmonar estimado',
  min: 0,
  max: 123,
  campos: [
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad' },
    { id: 'spo2', tipo: 'numero', texto: 'SpO₂ preoperatoria en aire ambiente', unidad: '%', min: 50, max: 100, entero: true },
    sino('infeccion', 'Infección respiratoria en el último mes', 17, 'Infección de vías respiratorias altas o bajas con fiebre y tratamiento antibiótico.'),
    sino('anemia', 'Anemia preoperatoria (hemoglobina ≤10 g/dL)', 11),
    {
      id: 'incision', texto: 'Incisión quirúrgica', textoCorto: 'incisión', puntua: false,
      opciones: [
        { texto: 'Periférica', valor: 0 },
        { texto: 'Abdominal alta', valor: 15 },
        { texto: 'Intratorácica', valor: 24 },
      ],
    },
    {
      id: 'duracion', texto: 'Duración prevista de la cirugía', textoCorto: 'duración', puntua: false,
      opciones: [
        { texto: 'Menos de 2 h', valor: 0 },
        { texto: '2 a 3 h', valor: 16 },
        { texto: 'Más de 3 h', valor: 23 },
      ],
    },
    sino('urgencia', 'Cirugía urgente', 8),
  ],
  bandas: BANDAS,
  calcular({ v }) {
    const pe = puntosEdad(v.edad);
    const ps = puntosSpO2(v.spo2);
    const partes = [
      ['edad', `edad ${v.edad} años`, pe],
      ['spo2', `SpO₂ ${v.spo2} %`, ps],
      ['infeccion', 'infección respiratoria reciente', v.infeccion.valor],
      ['anemia', 'anemia', v.anemia.valor],
      ['incision', `incisión ${v.incision.texto.toLowerCase()}`, v.incision.valor],
      ['duracion', `duración ${v.duracion.texto.toLowerCase()}`, v.duracion.valor],
      ['urgencia', 'cirugía urgente', v.urgencia.valor],
    ];
    const puntaje = partes.reduce((s, x) => s + x[2], 0);
    const conPuntos = partes.filter((x) => x[2] > 0).map((x) => `${x[1]} (${x[2]})`);
    const lineas = [conPuntos.length ? `Puntos: ${conPuntos.join('; ')}.` : 'Ninguna variable suma puntos.'];
    return { puntaje, lineas, lineasNota: lineas, extras: Object.fromEntries(partes.map((x) => [x[0], x[2]])) };
  },
  resumen: (res) => `ARISCAT: ${res.puntaje} puntos (${res.banda.etiqueta.toLowerCase()} de complicaciones pulmonares posoperatorias).`,
  resumenBreve: (res) => `ARISCAT ${res.puntaje} (${res.banda.etiqueta.toLowerCase()} pulmonar)`,
  detalleEnResumen: true,
  notas: [
    'Desenlace: al menos una complicación pulmonar durante la hospitalización (infección respiratoria, insuficiencia respiratoria, broncoespasmo, atelectasia, derrame pleural, neumotórax o neumonitis por aspiración).',
    'Clases validadas: menos de 26, bajo; 26 a 44, intermedio; 45 o más, alto. Porcentajes observados en la cohorte europea PERISCOPE (5099 pacientes): 3.4 %, 13.0 % y 38.0 %. El desempeño fue peor en Europa del Este y puede variar en otras poblaciones.',
    'No incluye fragilidad, EPOC, apnea del sueño ni estado funcional, y la duración es una estimación previa a la cirugía.',
    'Estima un riesgo de grupo, no la probabilidad individual exacta; no indica por sí mismo una intervención.',
  ],
  referencias: [
    { texto: 'Canet J, Gallart L, Gomar C, et al. Prediction of postoperative pulmonary complications in a population-based surgical cohort. Anesthesiology. 2010;113(6):1338-50.', doi: '10.1097/ALN.0b013e3181fc6e0a' },
    { texto: 'Mazo V, Sabaté S, Canet J, et al. Prospective external validation of a predictive score for postoperative pulmonary complications. Anesthesiology. 2014;121(2):219-31.', doi: '10.1097/ALN.0000000000000334' },
  ],
};
