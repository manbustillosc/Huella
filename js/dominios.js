// Dominios de valoración. "planeadas" son instrumentos por agregar (se muestran como próximamente).
export const DOMINIOS = [
  {
    id: 'funcional', nombre: 'Funcional',
    descripcion: 'Actividades básicas e instrumentales de la vida diaria.',
    problemas: ['dependencia', 'discapacidad', 'autonomía'],
    planeadas: ['FAQ de Pfeffer'],
  },
  {
    id: 'cognitivo', nombre: 'Cognitivo',
    descripcion: 'Tamizaje, evaluación y estadificación del deterioro cognitivo.',
    problemas: ['memoria', 'demencia', 'olvidos'],
    planeadas: ['MMSE (registro)', 'Fluencia verbal semántica', 'GPCOG', 'Prueba de Isaacs', 'Escala de Deterioro Global (GDS) de Reisberg'],
  },
  {
    id: 'afectivo', nombre: 'Afectivo',
    descripcion: 'Síntomas depresivos, ansiedad y soledad.',
    problemas: ['depresión', 'ansiedad', 'tristeza', 'insomnio'],
    planeadas: ['CES-D 7', 'GAD-7', 'Escala de soledad de 3 ítems', 'Escala Atenas de insomnio'],
  },
  {
    id: 'delirium', nombre: 'Delirium y conducta',
    descripcion: 'Detección de delirium, nivel de sedación y síntomas neuropsiquiátricos.',
    problemas: ['confusión', 'agitación', 'sedación', 'conducta'],
    planeadas: [],
  },
  {
    id: 'fragilidad', nombre: 'Fragilidad y sarcopenia',
    descripcion: 'Fragilidad, fuerza, desempeño físico y prescripción de ejercicio.',
    problemas: ['debilidad', 'pérdida de peso', 'ejercicio'],
    planeadas: [],
  },
  {
    id: 'caidas', nombre: 'Caídas y movilidad',
    descripcion: 'Marcha, equilibrio y riesgo de caídas.',
    problemas: ['caídas', 'marcha', 'equilibrio'],
    planeadas: ['Downton', 'Short FES-I'],
  },
  {
    id: 'nutricion', nombre: 'Nutrición',
    descripcion: 'Tamizaje de desnutrición y deglución.',
    problemas: ['desnutrición', 'peso', 'apetito'],
    planeadas: ['MUST', 'EAT-10 (registro)'],
  },
  {
    id: 'piel', nombre: 'Integridad cutánea',
    descripcion: 'Riesgo de lesiones por presión.',
    problemas: ['úlceras', 'escaras', 'lesiones por presión'],
    planeadas: ['Norton'],
  },
  {
    id: 'dolor', nombre: 'Dolor',
    descripcion: 'Valoración del dolor, incluso en quien no puede comunicarlo.',
    problemas: ['dolor', 'analgesia'],
    planeadas: ['Escala numérica análoga', 'Escala visual análoga'],
  },
  {
    id: 'prequirurgica', nombre: 'Prequirúrgica',
    descripcion: 'Riesgo perioperatorio.',
    problemas: ['cirugía', 'preoperatorio'],
    planeadas: ['ARISCAT', 'ASA', 'DASI', 'Caprini'],
  },
  {
    id: 'polifarmacia', nombre: 'Polifarmacia',
    descripcion: 'Carga anticolinérgica y prescripción potencialmente inapropiada.',
    problemas: ['medicamentos', 'fármacos', 'deprescripción'],
    planeadas: ['Carga anticolinérgica (ACB)', 'STOPP/START', 'Criterios de Beers'],
  },
  {
    id: 'social', nombre: 'Social y cuidador',
    descripcion: 'Riesgo social, red de apoyo, sobrecarga del cuidador y maltrato.',
    problemas: ['cuidador', 'aislamiento', 'red de apoyo', 'maltrato'],
    planeadas: ['Lubben LSNS-6', 'Escala geriátrica de maltrato', 'Cuestionario MOS de apoyo social'],
  },
  {
    id: 'paliativos', nombre: 'Paliativos y pronóstico',
    descripcion: 'Funcionalidad, síntomas y necesidades paliativas.',
    problemas: ['cuidados paliativos', 'pronóstico', 'fin de vida'],
    planeadas: ['PPS', 'Karnofsky', 'Índice pronóstico paliativo (PPI)', 'NECPAL (registro)', 'Índice de Charlson', 'G8', 'VES-13'],
  },
  {
    id: 'calculadoras', nombre: 'Calculadoras',
    descripcion: 'Función renal y conversiones.',
    problemas: ['riñón', 'dosis', 'creatinina'],
    planeadas: ['Equianalgesia de opioides'],
  },
];
