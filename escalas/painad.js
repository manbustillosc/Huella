const item = (id, texto, textoCorto, o0, o1, o2) => ({
  id, texto, textoCorto,
  opciones: [
    { texto: '0', detalle: o0, valor: 0 },
    { texto: '1', detalle: o1, valor: 1 },
    { texto: '2', detalle: o2, valor: 2 },
  ],
});

const SUG_DOLOR = [
  'Buscar la causa del dolor (musculoesquelético, lesiones por presión, estreñimiento, retención urinaria, problemas dentales, infección).',
  'Tratar según la causa e intensidad y reevaluar con PAINAD tras la intervención.',
  'Descartar otras causas de malestar o agitación (hambre, frío, necesidad de ir al baño, delirium).',
];

export default {
  id: 'painad',
  nombre: 'Evaluación del dolor en demencia avanzada (PAINAD)',
  corto: 'PAINAD',
  dominio: 'dolor',
  tipo: 'evaluacion',
  aliases: ['dolor', 'demencia avanzada', 'Warden', 'pain assessment in advanced dementia'],
  problemas: ['dolor', 'demencia avanzada', 'agitación', 'paciente no comunicativo', 'cuidados paliativos'],
  descripcion: 'Observación conductual del dolor: 5 conductas de 0 a 2, total 0 a 10.',
  objetivo: 'Estimar la presencia e intensidad del dolor en personas con demencia avanzada que no pueden comunicarlo verbalmente.',
  poblacion: 'Personas con demencia avanzada (Warden, 2003); versión española validada (García-Soler, 2014).',
  aplicacion: [
    'Observa a la persona durante unos 5 minutos, de preferencia en actividad (movilización, aseo, traslado) y en reposo.',
    'Puntúa cada conducta según lo observado.',
    'Reevalúa después de cada intervención analgésica.',
  ],
  tiempo: '5 min de observación',
  momentos: true,
  direccionClinica: 'menor_mejor',
  textoMejoria: 'disminución de conductas sugestivas de dolor',
  textoEmpeoramiento: 'aumento de conductas sugestivas de dolor',
  min: 0,
  max: 10,
  campos: [
    item('respiracion', 'Respiración (independiente de la vocalización)', 'respiración',
      'Normal', 'Respiración ocasionalmente dificultosa; periodo corto de hiperventilación', 'Respiración dificultosa y ruidosa; periodos largos de hiperventilación; respiración de Cheyne-Stokes'),
    item('vocalizacion', 'Vocalización negativa', 'vocalización',
      'Ninguna', 'Quejidos o gemidos ocasionales; habla en voz baja con tono negativo o desaprobatorio', 'Llamadas angustiadas repetidas; quejidos o gemidos fuertes; llanto'),
    item('facial', 'Expresión facial', 'expresión facial',
      'Sonriente o inexpresiva', 'Triste, asustada, ceño fruncido', 'Muecas de dolor'),
    item('corporal', 'Lenguaje corporal', 'lenguaje corporal',
      'Relajado', 'Tenso, camina de un lado a otro con angustia, inquieto', 'Rígido, puños cerrados, rodillas flexionadas, aparta o empuja, golpea'),
    item('consuelo', 'Consolabilidad', 'consolabilidad',
      'No necesita consuelo', 'Se distrae o tranquiliza con la voz o el contacto', 'Imposible de consolar, distraer o tranquilizar'),
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'Sin conductas de dolor', nivel: 'bien', texto: 'No se observaron conductas sugestivas de dolor en esta evaluación.', sugerencias: [] },
    { min: 1, max: 3, etiqueta: 'Dolor leve: rango orientativo', nivel: 'leve', hallazgo: true, texto: 'Conductas compatibles con dolor de intensidad leve.', sugerencias: SUG_DOLOR },
    { min: 4, max: 6, etiqueta: 'Dolor moderado: rango orientativo', nivel: 'moderado', hallazgo: true, texto: 'Conductas compatibles con dolor de intensidad moderada.', sugerencias: SUG_DOLOR },
    { min: 7, max: 10, etiqueta: 'Dolor intenso: rango orientativo', nivel: 'grave', hallazgo: true, texto: 'Conductas compatibles con dolor intenso.', sugerencias: SUG_DOLOR },
  ],
  notas: [
    'Los rangos de intensidad (1–3, 4–6, 7–10) son orientativos: el estudio original no validó puntos de corte. Cualquier puntaje mayor de 0 amerita buscar una causa.',
    'Las conductas pueden deberse a otras causas de malestar (hambre, frío, miedo, delirium); interprétalo con el contexto.',
    'Útil sobre todo para comparar a la misma persona antes y después de una intervención.',
  ],
  referencias: [
    { texto: 'Warden V, Hurley AC, Volicer L. Development and psychometric evaluation of the Pain Assessment in Advanced Dementia (PAINAD) scale. J Am Med Dir Assoc. 2003;4(1):9-15.', doi: '10.1097/01.JAM.0000043422.31640.F7' },
    { texto: 'García-Soler A, Sánchez-Iglesias I, Buiza C, et al. Adaptación y validación de la versión española de la escala de evaluación de dolor en personas con demencia avanzada: PAINAD-Sp. Rev Esp Geriatr Gerontol. 2014;49(1):10-4.', doi: '10.1016/j.regg.2013.02.001' },
  ],
};
