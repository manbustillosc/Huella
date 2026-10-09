const factor = (id, texto, ayuda) => ({ id, texto, ayuda, tipo: 'sino', puntua: 'si' });

export default {
  id: 'rcri',
  nombre: 'Índice de Riesgo Cardiaco Revisado (RCRI)',
  corto: 'RCRI',
  dominio: 'prequirurgica',
  aliases: ['Lee', 'riesgo cardiaco', 'perioperatorio', 'preoperatorio', 'cirugia no cardiaca'],
  descripcion: 'Riesgo de complicaciones cardiacas en cirugía no cardiaca: 6 factores, de 0 a 6 puntos.',
  aplicacion: 'Marca cada factor presente según la historia clínica y los estudios preoperatorios. Solo para cirugía no cardiaca.',
  tiempo: '1 min',
  min: 0,
  max: 6,
  items: [
    factor('cirugia', 'Cirugía de alto riesgo', 'Intraperitoneal, intratorácica o vascular suprainguinal.'),
    factor('isquemica', 'Cardiopatía isquémica', 'Infarto previo, prueba de esfuerzo positiva, angina actual, uso de nitratos u ondas Q patológicas en el ECG.'),
    factor('ic', 'Insuficiencia cardiaca', 'Antecedente de insuficiencia cardiaca, edema pulmonar o disnea paroxística nocturna; estertores bilaterales, tercer ruido o redistribución vascular en la radiografía.'),
    factor('evc', 'Enfermedad cerebrovascular', 'Antecedente de EVC o de ataque isquémico transitorio.'),
    factor('insulina', 'Diabetes en tratamiento con insulina', ''),
    factor('creatinina', 'Creatinina preoperatoria mayor de 2.0 mg/dL', ''),
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'Clase I · riesgo bajo', nivel: 'bien', original: '0.4', recalibrado: '3.9' },
    { min: 1, max: 1, etiqueta: 'Clase II · riesgo bajo', nivel: 'leve', original: '0.9', recalibrado: '6.0' },
    { min: 2, max: 2, etiqueta: 'Clase III · riesgo intermedio', nivel: 'moderado', original: '6.6', recalibrado: '10.1' },
    { min: 3, max: 6, etiqueta: 'Clase IV · riesgo alto', nivel: 'critico', original: '11.0', recalibrado: '15.0' },
  ].map((b) => ({
    ...b,
    texto: `Complicaciones cardiacas mayores en el ${b.original} % de la cohorte de validación original (Lee, 1999). Muerte, infarto o paro cardiaco a 30 días: ${b.recalibrado} % con la recalibración de la Sociedad Cardiovascular Canadiense (2017).`,
  })),
  notas: [
    'Complicaciones mayores del estudio original: infarto, edema pulmonar, fibrilación ventricular o paro cardiaco primario y bloqueo cardiaco completo.',
    'Las cifras originales subestiman el riesgo actual; por eso se muestra también la recalibración canadiense.',
    'La guía canadiense (2017) recomienda medir BNP o NT-proBNP antes de la cirugía en personas de 65 años o más, de 45 a 64 años con enfermedad cardiovascular significativa, o con RCRI de 1 o más.',
    'No aplica a cirugía cardiaca ni a TAVI.',
  ],
  resumen({ puntaje, max, banda, presentes }) {
    const inicialMinuscula = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    const clase = inicialMinuscula(banda.etiqueta.replace(' · ', ', '));
    const factores = presentes.length ? ` Factores: ${presentes.map(inicialMinuscula).join('; ')}.` : ' Sin factores de riesgo.';
    return `RCRI (Lee): ${puntaje}/${max}, ${clase}. Muerte, infarto o paro cardiaco a 30 días: ${banda.recalibrado} % (recalibración CCS 2017).${factores}`;
  },
  referencias: [
    { texto: 'Lee TH, Marcantonio ER, Mangione CM, et al. Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. Circulation. 1999;100(10):1043-9.', doi: '10.1161/01.cir.100.10.1043' },
    { texto: 'Duceppe E, Parlow J, MacDonald P, et al. Canadian Cardiovascular Society Guidelines on Perioperative Cardiac Risk Assessment and Management for Patients Who Undergo Noncardiac Surgery. Can J Cardiol. 2017;33(1):17-32.', doi: '10.1016/j.cjca.2016.09.008' },
  ],
};
