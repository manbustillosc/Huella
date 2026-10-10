const factor = (id, texto, ayuda, textoCorto) => ({ id, texto, ayuda, textoCorto, tipo: 'sino', puntua: 'si' });
const inicialMinuscula = (t) => t.charAt(0).toLowerCase() + t.slice(1);

// Riesgo por clase según cada fuente (porcentaje).
const LEE_1999 = ['0.4', '0.9', '6.6', '11.0']; // cohorte de validación
const CCS_2017 = ['3.9', '6.0', '10.1', '15.0']; // recalibración de la Sociedad Cardiovascular Canadiense

const SUG_BASE = [
  'La guía canadiense (2017) recomienda medir NT-proBNP o BNP antes de la cirugía si la persona tiene 65 años o más, de 45 a 64 años con enfermedad cardiovascular significativa, o RCRI de 1 o más.',
  'Completar la valoración preoperatoria geriátrica: cognición (Mini-Cog), riesgo de delirium, fragilidad (CFS o FRAIL), funcionalidad y nutrición.',
];

export default {
  id: 'rcri',
  nombre: 'Índice de Riesgo Cardiaco Revisado (RCRI)',
  corto: 'RCRI',
  dominio: 'prequirurgica',
  tipo: 'pronostico',
  aliases: ['Lee', 'riesgo cardiaco', 'perioperatorio', 'preoperatorio', 'cirugia no cardiaca'],
  problemas: ['cirugía', 'valoración preoperatoria', 'riesgo cardiovascular'],
  descripcion: 'Riesgo de complicaciones cardiacas en cirugía no cardiaca: 6 factores, de 0 a 6 puntos.',
  objetivo: 'Estimar el riesgo de complicaciones cardiacas mayores en cirugía no cardiaca.',
  poblacion: 'Derivado y validado en 4315 pacientes de 50 años o más sometidos a cirugía mayor electiva no cardiaca en un solo hospital (Lee, 1999). No aplica a cirugía cardiaca ni a TAVI.',
  aplicacion: [
    'Marca cada factor presente según la historia clínica y los estudios preoperatorios.',
    'Úsalo solo en cirugía no cardiaca.',
  ],
  tiempo: '1 min',
  min: 0,
  max: 6,
  detalleEnResumen: true,
  campos: [
    factor('cirugia', 'Cirugía de alto riesgo', 'Intraperitoneal, intratorácica o vascular suprainguinal.', 'cirugía de alto riesgo'),
    factor('isquemica', 'Cardiopatía isquémica', 'Infarto previo, prueba de esfuerzo positiva, angina actual, uso de nitratos u ondas Q patológicas en el ECG.', 'cardiopatía isquémica'),
    factor('ic', 'Insuficiencia cardiaca', 'Antecedente de insuficiencia cardiaca, edema pulmonar o disnea paroxística nocturna; estertores bilaterales, tercer ruido o redistribución vascular en la radiografía.', 'insuficiencia cardiaca'),
    factor('evc', 'Enfermedad cerebrovascular', 'Antecedente de EVC o de ataque isquémico transitorio.', 'enfermedad cerebrovascular'),
    factor('insulina', 'Diabetes en tratamiento con insulina', '', 'diabetes con insulina'),
    factor('creatinina', 'Creatinina preoperatoria mayor de 2.0 mg/dL', '', 'creatinina >2.0 mg/dL'),
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'Clase I · riesgo bajo', nivel: 'bien' },
    { min: 1, max: 1, etiqueta: 'Clase II · riesgo bajo', nivel: 'leve' },
    { min: 2, max: 2, etiqueta: 'Clase III · riesgo intermedio', nivel: 'moderado', hallazgo: true },
    { min: 3, max: 6, etiqueta: 'Clase IV · riesgo alto', nivel: 'critico', hallazgo: true },
  ].map((b, i) => ({
    ...b,
    original: LEE_1999[i],
    recalibrado: CCS_2017[i],
    texto: `Muerte, infarto o paro cardiaco a 30 días: ${CCS_2017[i]} % con la recalibración canadiense (2017). Complicaciones cardiacas mayores: ${LEE_1999[i]} % en la cohorte de validación original (1999).`,
    sugerencias: i === 0 ? [SUG_BASE[1]] : SUG_BASE,
  })),
  calcular({ base }) {
    const puntaje = base.desglose.reduce((s, d) => s + d.valor, 0);
    const i = Math.min(puntaje, 3);
    return {
      puntaje,
      detalles: [{
        titulo: 'Riesgo estimado según la fuente',
        encabezados: ['Desenlace', 'Fuente y población', 'Riesgo'],
        filas: [
          ['Muerte, infarto o paro cardiaco a 30 días', 'Sociedad Cardiovascular Canadiense, 2017: recalibración con estudios recientes de cirugía no cardiaca', `${CCS_2017[i]} %`],
          ['Complicaciones cardiacas mayores: infarto, edema pulmonar, fibrilación ventricular o paro primario, bloqueo AV completo', 'Lee, 1999: cirugía mayor electiva, 50 años o más, un hospital (cohorte de validación)', `${LEE_1999[i]} %`],
        ],
      }],
    };
  },
  resumen({ puntaje, max, banda, presentes }) {
    const clase = inicialMinuscula(banda.etiqueta.replace(' · ', ', '));
    const factores = presentes.length
      ? ` ${presentes.length === 1 ? 'Factor' : 'Factores'}: ${presentes.map(inicialMinuscula).join('; ')}.`
      : ' Sin factores de riesgo.';
    return `RCRI (Lee): ${puntaje}/${max}, ${clase}. Muerte, infarto o paro cardiaco a 30 días: ${banda.recalibrado} % (recalibración CCS 2017).${factores}`;
  },
  resumenBreve({ puntaje, max, banda, presentes }) {
    const clase = inicialMinuscula(banda.etiqueta.replace(' · ', ', '));
    const factores = presentes.length
      ? `; ${presentes.length === 1 ? 'factor' : 'factores'}: ${presentes.map(inicialMinuscula).join(', ')}`
      : '; sin factores de riesgo';
    return `RCRI ${puntaje}/${max} (${clase}; muerte, infarto o paro cardiaco a 30 días: ${banda.recalibrado} %${factores})`;
  },
  notas: [
    'Las cifras originales de 1999 subestiman el riesgo actual; la recalibración canadiense usa un desenlace distinto (muerte, infarto o paro a 30 días) y datos más recientes.',
    'En personas mayores, el RCRI no considera edad, fragilidad, capacidad funcional, cognición ni estado nutricional, que también predicen complicaciones y pérdida funcional posoperatoria.',
    'Su capacidad de discriminación es moderada en cirugía no cardiaca mixta y menor en cirugía vascular (metaanálisis de Ford et al., 2010).',
    'No aplica a cirugía cardiaca ni a TAVI. Estima riesgo; no sustituye la decisión clínica compartida.',
  ],
  referencias: [
    { texto: 'Lee TH, Marcantonio ER, Mangione CM, et al. Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. Circulation. 1999;100(10):1043-9.', doi: '10.1161/01.cir.100.10.1043' },
    { texto: 'Duceppe E, Parlow J, MacDonald P, et al. Canadian Cardiovascular Society Guidelines on Perioperative Cardiac Risk Assessment and Management for Patients Who Undergo Noncardiac Surgery. Can J Cardiol. 2017;33(1):17-32.', doi: '10.1016/j.cjca.2016.09.008' },
    { texto: 'Ford MK, Beattie WS, Wijeysundera DN. Systematic review: prediction of perioperative cardiac complications and mortality by the revised cardiac risk index. Ann Intern Med. 2010;152(1):26-35.', doi: '10.7326/0003-4819-152-1-201001050-00007' },
  ],
};
