export default {
  id: '4at',
  nombre: '4AT · Detección rápida de delirium',
  corto: '4AT',
  dominio: 'delirium',
  aliases: ['delirium', 'sindrome confusional', 'confusion', 'AMT4', 'cuatro A'],
  descripcion: 'Cribado de delirium y deterioro cognitivo en menos de 2 minutos: 4 reactivos, de 0 a 12 puntos.',
  aplicacion: 'Aplícala junto a la cama. No requiere entrenamiento formal. El reactivo 4 puede completarse con información del cuidador, enfermería o el expediente.',
  tiempo: '2 min',
  min: 0,
  max: 12,
  items: [
    {
      id: 'alerta', texto: 'Alerta',
      ayuda: 'Observa al paciente. Si está dormido, intenta despertarlo con la voz o tocándole suavemente el hombro. Pídele que diga su nombre y domicilio. Incluye a quien esté muy somnoliento o agitado.',
      opciones: [
        { texto: 'Normal', detalle: 'Totalmente alerta y sin agitación durante toda la evaluación.', valor: 0 },
        { texto: 'Somnolencia leve', detalle: 'Menos de 10 segundos tras despertar; después, normal.', valor: 0 },
        { texto: 'Claramente anormal', valor: 4 },
      ],
    },
    {
      id: 'amt4', texto: 'AMT4',
      ayuda: 'Pregunta edad, fecha de nacimiento, lugar (nombre del hospital o del edificio) y año actual.',
      opciones: [
        { texto: 'Sin errores', valor: 0 },
        { texto: '1 error', valor: 1 },
        { texto: '2 o más errores, o no evaluable', valor: 2 },
      ],
    },
    {
      id: 'atencion', texto: 'Atención',
      ayuda: 'Pide: «Dígame los meses del año al revés, empezando por diciembre». Puedes ayudar una vez con «¿cuál es el mes anterior a diciembre?».',
      opciones: [
        { texto: '7 meses o más correctos', valor: 0 },
        { texto: 'Empieza, pero menos de 7 meses, o se niega', valor: 1 },
        { texto: 'No evaluable', detalle: 'No puede empezar por malestar, somnolencia o inatención.', valor: 2 },
      ],
    },
    {
      id: 'cambio', texto: 'Cambio agudo o curso fluctuante',
      ayuda: 'Cambio o fluctuación significativa en el estado de alerta, la cognición u otra función mental (p. ej., paranoia, alucinaciones) que surgió en las últimas 2 semanas y sigue presente en las últimas 24 horas.',
      opciones: [
        { texto: 'No', valor: 0 },
        { texto: 'Sí', valor: 4 },
      ],
    },
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'Delirium poco probable', nivel: 'bien', texto: 'Delirium o deterioro cognitivo grave poco probables. El delirium sigue siendo posible si la información del reactivo 4 es incompleta.' },
    { min: 1, max: 3, etiqueta: 'Posible deterioro cognitivo', nivel: 'moderado', texto: 'Posible deterioro cognitivo. Se requiere evaluación cognitiva más detallada.' },
    { min: 4, max: 12, etiqueta: 'Posible delirium', nivel: 'critico', texto: 'Posible delirium, con o sin deterioro cognitivo. Se requiere evaluación clínica para confirmar y buscar la causa.' },
  ],
  notas: [
    'Un puntaje de 4 o más no diagnostica delirium por sí solo: confirma con evaluación clínica (criterios DSM-5).',
    'Sensibilidad y especificidad combinadas de 0.88 en el metaanálisis de Tieges et al. (2021).',
    'Uso libre; versión original y traducciones en the4AT.com.',
  ],
  referencias: [
    { texto: 'Bellelli G, Morandi A, Davis DH, et al. Validation of the 4AT, a new instrument for rapid delirium screening: a study in 234 hospitalised older people. Age Ageing. 2014;43(4):496-502.', doi: '10.1093/ageing/afu021' },
    { texto: 'Tieges Z, Maclullich AMJ, Anand A, et al. Diagnostic accuracy of the 4AT for delirium detection in older adults: systematic review and meta-analysis. Age Ageing. 2021;50(3):733-43.', doi: '10.1093/ageing/afaa224' },
  ],
};
