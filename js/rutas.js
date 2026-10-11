// Rutas clínicas guiadas.
// pasos: núcleo de la ruta (cuenta para el progreso). complementarios: opcionales, según hallazgos.
// planes: instrumentos aún no disponibles (se muestran como «Próximamente», sin simularlos).
// herramientas: pantallas propias (p. ej., revisión de medicamentos) que se ofrecen como complementarias.
// Cada paso puede llevar nota (finalidad o cuándo aplicarlo), momento y grupo.
// Un paso sin momento usa el de la ruta; en «hospital» el médico elige ingreso, actual o egreso.
export const RUTAS = [
  {
    id: 'icope', nombre: 'Valoración ICOPE', icono: 'icope',
    descripcion: 'Capacidad intrínseca en seis dominios (OMS/OPS): evaluación básica, evaluación detallada, plan personalizado y seguimiento. Sin puntaje global.',
    pantalla: '#/icope/panel',
    pasos: [
      { id: 'icope-cog', nota: 'Pregunta de filtro y prueba de memoria y orientación.' },
      { id: 'icope-loc', nota: 'Prueba de la silla: cinco levantadas en 14 segundos.' },
      { id: 'icope-vit', nota: 'Pérdida de peso y falta de apetito.' },
      { id: 'icope-vis', nota: 'Preguntas de filtro y agudeza visual con la tabla de la OMS.' },
      { id: 'icope-aud', nota: 'Pregunta de filtro y una prueba de audición.' },
      { id: 'icope-psi', nota: 'Dos preguntas sobre síntomas depresivos.' },
    ],
    complementarios: [
      { id: 'icope-fac', nota: 'Apoyo social, persona a cargo del cuidado, incontinencia urinaria y riesgo cardiovascular; no son dominios de la capacidad intrínseca.' },
    ],
  },
  {
    id: 'rapida', nombre: 'Valoración geriátrica rápida', icono: 'rapida',
    descripcion: 'Núcleo breve para consulta: funcionalidad básica, cognición, ánimo y fragilidad. Las complementarias se agregan según los hallazgos.',
    pasos: [
      { id: 'barthel', nota: 'Funcionalidad en actividades básicas de la vida diaria.' },
      { id: 'minicog', nota: 'Tamizaje cognitivo breve.' },
      { id: 'gds15', nota: 'Tamizaje de síntomas depresivos.' },
      { id: 'frail', nota: 'Tamizaje de fragilidad.' },
    ],
    complementarios: [
      { id: 'lawton', nota: 'Si se sospecha deterioro funcional temprano o cognitivo (actividades instrumentales).' },
      { id: 'sarcf', nota: 'Si FRAIL es positivo, o hay debilidad o caídas.' },
      { id: 'mnasf', nota: 'Si hay pérdida de peso o disminución del apetito.' },
      { id: 'tug', nota: 'Si hay caídas o alteración de la marcha.' },
      { id: 'phq9', nota: 'Alternativa a la GDS-15 si necesitas graduar la intensidad o seguir el tratamiento; no apliques ambas.' },
    ],
  },
  {
    id: 'completa', nombre: 'Valoración geriátrica completa', icono: 'valoracion',
    descripcion: 'Valoración integral por dominios, con desempeño físico, sin repetir pruebas que miden lo mismo.',
    pasos: [
      { id: 'barthel', nota: 'Actividades básicas de la vida diaria.' },
      { id: 'lawton', nota: 'Actividades instrumentales de la vida diaria.' },
      { id: 'moca', nota: 'Evaluación cognitiva breve (hoja oficial y evaluador certificado).' },
      { id: 'gds15', nota: 'Síntomas depresivos.' },
      { id: 'frail', nota: 'Tamizaje autorreferido de fragilidad.' },
      { id: 'cfs', nota: 'Grado de fragilidad por juicio clínico.' },
      { id: 'sarcf', nota: 'Tamizaje de sarcopenia.' },
      { id: 'sppb', nota: 'Desempeño físico; incluye la velocidad de marcha en 4 m.' },
      { id: 'mnasf', nota: 'Tamizaje nutricional.' },
    ],
    complementarios: [
      { id: 'tug', nota: 'Si hay caídas o alteración de la marcha; el SPPB ya mide la marcha.' },
      { id: 'zarit', nota: 'Si hay un cuidador principal.' },
      { id: 'gijon', nota: 'Riesgo social: familia, economía, vivienda, relaciones y apoyo; orienta la referencia a Trabajo Social.' },
      { id: 'fried', nota: 'Fenotipo de fragilidad si se dispone de dinamómetro y del recorrido de 4.57 m; complementa al CFS, no lo sustituye.' },
      { id: 'tinetti', nota: 'Equilibrio y marcha por separado si hay caídas o inestabilidad.' },
      { id: 'vivifrail', nota: 'Prescripción de ejercicio a partir del SPPB.' },
      { id: 'agudeza', nota: 'Agudeza visual con las categorías de la OMS, si hay queja visual o caídas.' },
      { id: 'audiometria', nota: 'Si hay audiometría disponible: grado de pérdida auditiva de la OMS.' },
      { id: 'bucal', nota: 'Revisión breve de la boca y las prótesis.' },
      { id: 'urinarios', nota: 'Síntomas urinarios y datos de alarma; ICIQ-UI SF si hay incontinencia.' },
      { id: 'intestinal', nota: 'Estreñimiento, impactación e incontinencia fecal.' },
      { id: 'sueno', nota: 'Patrón de sueño y factores contribuyentes; ISI, Epworth o STOP-Bang según los hallazgos.' },
      { id: 'eat10', nota: 'Tamizaje de disfagia si hay síntomas al comer o beber.' },
    ],
    herramientas: [{ id: 'medicacion', nota: 'Medicamentos con STOPP/START v3 y Beers 2023; los posibles problemas y la información pendiente pasan a la nota.' }],
  },
  {
    id: 'hospital', nombre: 'Valoración hospitalaria', icono: 'hospital',
    descripcion: 'Funcionalidad basal y actual, delirium, fragilidad basal, riesgo de lesiones por presión, dolor y nutrición; RASS y CAM-ICU en UCI.',
    momento: 'ingreso',
    momentos: ['ingreso', 'actual', 'egreso'],
    pasos: [
      { id: 'barthel', momento: 'basal', nota: 'Funcionalidad basal: estado previo al episodio agudo, referido por la persona o su cuidador.' },
      { id: 'barthel', nota: 'Funcionalidad en el momento elegido arriba, para compararla con la basal.' },
      { id: '4at', nota: 'Tamizaje de delirium; repítelo si cambia el estado mental.' },
      { id: 'cfs', momento: 'basal', nota: 'Fragilidad basal: puntúa el estado de 2 semanas antes del ingreso.' },
      { id: 'braden', nota: 'Riesgo de lesiones por presión.' },
      { id: 'painad', nota: 'Si la persona no puede comunicar su dolor (demencia avanzada); si puede, registra la intensidad que refiere.' },
      { id: 'mnasf', nota: 'Tamizaje nutricional.' },
    ],
    complementarios: [
      { id: 'cam', nota: 'Algoritmo para identificar delirium si el 4AT es positivo o hay sospecha clínica.' },
      { id: 'katz', momento: 'basal', nota: 'Alternativa al Barthel para actividades básicas; no es necesario aplicar ambos.' },
      { id: 'katz', nota: 'Alternativa al Barthel en el momento elegido.' },
      { id: 'ckdepi', nota: 'Función renal: categoría KDIGO de la TFG estimada.' },
      { id: 'cockcroft', nota: 'Depuración de creatinina para dosificar fármacos.' },
      { id: 'rass', nota: 'Nivel de agitación o sedación; en UCI es el paso previo del CAM-ICU.' },
      { id: 'camicu', nota: 'Solo en UCI o con ventilación mecánica; no es intercambiable con el CAM.' },
      { id: 'deglucion', nota: 'Signos de disfagia observados: derivar a personal capacitado antes de cambiar la dieta.' },
      { id: 'intestinal', nota: 'Estreñimiento e impactación fecal, frecuentes durante la hospitalización.' },
    ],
    herramientas: [{ id: 'medicacion', nota: 'Revisión de la medicación al ingreso o al egreso con STOPP/START v3 y Beers 2023.' }],
  },
  {
    id: 'cognitiva', nombre: 'Evaluación cognitiva', icono: 'cognitivo',
    descripcion: 'Descartar delirium, tamizar, evaluar y medir la repercusión funcional. Cada instrumento tiene una finalidad distinta: no son intercambiables.',
    pasos: [
      { id: '4at', nota: 'Primero: descartar delirium. Si es positivo, no interpretes las pruebas cognitivas hasta que se resuelva.' },
      { id: 'minicog', nota: 'Tamizaje: identifica quién necesita una evaluación más amplia; no diagnostica ni estadifica.' },
      { id: 'moca', nota: 'Evaluación cognitiva breve si el tamizaje es positivo o hay queja cognitiva; requiere hoja oficial y evaluador certificado.' },
      { id: 'lawton', nota: 'Repercusión en las actividades instrumentales: ayuda a distinguir trastorno neurocognitivo leve de mayor.' },
      { id: 'gds15', nota: 'Síntomas depresivos, que pueden afectar el desempeño cognitivo.' },
    ],
    complementarios: [
      { id: 'barthel', nota: 'Actividades básicas si se sospecha un deterioro avanzado.' },
      { id: 'rudas', nota: 'Tamizaje alternativo si la escolaridad o el idioma limitan el Mini-Cog o el MoCA.' },
      { id: 'cdr', nota: 'Estadificación si se confirma un trastorno neurocognitivo (entrevista y algoritmo oficiales).' },
      { id: 'fast', nota: 'Estadio funcional en enfermedad de Alzheimer; distinto del CDR y de la GDS de Reisberg.' },
      { id: 'npiq', nota: 'Síntomas neuropsiquiátricos y angustia del cuidador, con un informante.' },
      { id: 'cornell', nota: 'Síntomas depresivos con informante cuando la GDS-15 no es fiable por el deterioro cognitivo.' },
      { id: 'zarit', nota: 'Si hay un cuidador principal.' },
    ],
    planes: ['MMSE (registro)', 'FAQ de Pfeffer'],
  },
  {
    id: 'fragilidad', nombre: 'Fragilidad y movilidad', icono: 'fragilidad',
    descripcion: 'Fragilidad, sarcopenia, desempeño físico, caídas y prescripción de ejercicio Vivifrail con los datos ya registrados.',
    pasos: [
      { id: 'frail', nota: 'Tamizaje autorreferido de fragilidad.' },
      { id: 'cfs', nota: 'Grado de fragilidad por juicio clínico.' },
      { id: 'sarcf', nota: 'Tamizaje de sarcopenia.' },
      { id: 'sppb', nota: 'Desempeño físico; incluye la marcha en 4 m, que la velocidad de marcha puede reutilizar.' },
      { id: 'tug', nota: 'Movilidad y riesgo de caídas; Vivifrail usa el criterio de más de 20 s.' },
      { id: 'vivifrail', nota: 'Usa el SPPB, el TUG y la velocidad de marcha ya registrados, siempre con tu confirmación.' },
    ],
    complementarios: [
      { id: 'velocidad', nota: 'Si necesitas el recorrido de 6 m (criterio de Vivifrail) o no hiciste el SPPB; puede reutilizar la marcha del SPPB.' },
      { id: 'fried', nota: 'Fenotipo de Fried con dinamómetro, marcha de 4.57 m y actividad física; los componentes sin medir no se simulan.' },
      { id: 'tinetti', nota: 'Subescalas de equilibrio y marcha si hay caídas o inestabilidad.' },
    ],
    planes: ['Downton'],
  },
  {
    id: 'preqx', nombre: 'Valoración prequirúrgica', icono: 'prequirurgica',
    descripcion: 'Riesgo cardiaco y pulmonar, capacidad funcional, fragilidad, cognición, función, nutrición y función renal. Cada resultado se informa por separado: no se combinan en un riesgo único.',
    pasos: [
      { id: 'rcri', grupo: 'Riesgo cardiaco y capacidad funcional', nota: 'Riesgo de complicaciones cardiacas mayores en cirugía no cardiaca.' },
      { id: 'dasi', grupo: 'Riesgo cardiaco y capacidad funcional', nota: 'Capacidad funcional autorreferida; la guía AHA/ACC 2024 la considera razonable en cirugía de riesgo elevado.' },
      { id: 'ariscat', grupo: 'Riesgo pulmonar', nota: 'Riesgo de complicaciones pulmonares durante la hospitalización.' },
      { id: 'cfs', grupo: 'Vulnerabilidad geriátrica', nota: 'Fragilidad: se asocia con complicaciones y pérdida funcional posoperatoria.' },
      { id: 'minicog', grupo: 'Vulnerabilidad geriátrica', nota: 'Cognición basal: el deterioro cognitivo aumenta el riesgo de delirium posoperatorio.' },
      { id: 'barthel', grupo: 'Vulnerabilidad geriátrica', nota: 'Funcionalidad basal, para comparar después de la cirugía.' },
      { id: 'mnasf', grupo: 'Nutrición y función renal', nota: 'Estado nutricional.' },
      { id: 'ckdepi', grupo: 'Nutrición y función renal', nota: 'Función renal (categoría KDIGO de la TFG estimada).' },
    ],
    complementarios: [
      { id: 'lawton', nota: 'Actividades instrumentales.' },
      { id: 'tug', nota: 'Movilidad, si hay alteración de la marcha.' },
      { id: 'cockcroft', nota: 'Depuración de creatinina para dosificar fármacos perioperatorios.' },
      { id: 'fried', nota: 'Fenotipo de fragilidad si se dispone de dinamómetro y del recorrido de 4.57 m.' },
    ],
    planes: ['ASA'],
  },
  {
    id: 'calculadoras', nombre: 'Calculadoras clínicas', icono: 'calculadoras',
    descripcion: 'Función renal: la TFG estimada clasifica la enfermedad renal; la depuración de creatinina se usa para dosificar.',
    pasos: [
      { id: 'ckdepi', grupo: 'Función renal', nota: 'TFG estimada indexada (mL/min/1.73 m²): categoría KDIGO; no confirma enfermedad renal crónica por sí sola.' },
      { id: 'cockcroft', grupo: 'Función renal', nota: 'Depuración de creatinina (mL/min): la estimación que piden muchas fichas técnicas para dosificar.' },
    ],
    planes: ['Equianalgesia de opioides'],
  },
];

// Paso normalizado: { id, momento?, nota?, grupo?, complementario, clave } o { plan, clave }.
export function pasosDe(ruta) {
  const norm = (p, complementario) => {
    const x = typeof p === 'string' ? { id: p } : { ...p };
    return { ...x, complementario, clave: `${complementario ? 'c:' : ''}${x.id}${x.momento ? `@${x.momento}` : ''}` };
  };
  return [
    ...(ruta.pasos || []).map((p) => norm(p, false)),
    ...(ruta.complementarios || []).map((p) => norm(p, true)),
    ...(ruta.planes || []).map((plan) => ({ plan, clave: `plan:${plan}` })),
  ];
}
