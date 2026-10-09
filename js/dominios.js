// Dominios de valoración. "planeadas" son las escalas por agregar (se muestran como próximamente).
export const DOMINIOS = [
  {
    id: 'funcional', nombre: 'Funcional',
    descripcion: 'Actividades básicas e instrumentales de la vida diaria.',
    planeadas: ['Katz', 'FAQ de Pfeffer'],
  },
  {
    id: 'cognitivo', nombre: 'Cognitivo',
    descripcion: 'Cribado y estadificación del deterioro cognitivo.',
    planeadas: ['MMSE', 'MoCA', 'Mini-Cog', 'SLUMS', 'RUDAS', 'Prueba del reloj', 'Fluidez verbal', 'CDR', 'FAST'],
  },
  {
    id: 'afectivo', nombre: 'Afectivo',
    descripcion: 'Depresión y ansiedad.',
    planeadas: ['GDS-5', 'PHQ-9', 'PHQ-2', 'GAD-7', 'Cornell'],
  },
  {
    id: 'delirium', nombre: 'Delirium y conducta',
    descripcion: 'Detección de delirium y síntomas neuropsiquiátricos.',
    planeadas: ['CAM', 'CAM-ICU', 'RASS', 'NPI-Q'],
  },
  {
    id: 'fragilidad', nombre: 'Fragilidad y sarcopenia',
    descripcion: 'Fragilidad, fuerza y desempeño físico.',
    planeadas: ['FRAIL', 'Clinical Frailty Scale', 'Fenotipo de Fried', 'SARC-F', 'SPPB'],
  },
  {
    id: 'caidas', nombre: 'Caídas y movilidad',
    descripcion: 'Marcha, equilibrio y riesgo de caídas.',
    planeadas: ['Tinetti', 'Timed Up and Go', 'Downton'],
  },
  {
    id: 'nutricion', nombre: 'Nutrición',
    descripcion: 'Cribado de desnutrición.',
    planeadas: ['MNA-SF', 'MUST'],
  },
  {
    id: 'prequirurgica', nombre: 'Prequirúrgica',
    descripcion: 'Riesgo perioperatorio.',
    planeadas: ['ARISCAT', 'ASA', 'Caprini', 'DASI'],
  },
  {
    id: 'polifarmacia', nombre: 'Polifarmacia',
    descripcion: 'Carga anticolinérgica y prescripción potencialmente inapropiada.',
    planeadas: ['Carga anticolinérgica (ACB)', 'STOPP/START', 'Criterios de Beers'],
  },
  {
    id: 'social', nombre: 'Social y cuidador',
    descripcion: 'Red de apoyo y sobrecarga del cuidador.',
    planeadas: ['Zarit', 'Gijón', 'APGAR familiar'],
  },
  {
    id: 'paliativos', nombre: 'Paliativos y pronóstico',
    descripcion: 'Funcionalidad, síntomas y necesidades paliativas.',
    planeadas: ['PPS', 'Karnofsky', 'NECPAL', 'PAINAD', 'ESAS'],
  },
  {
    id: 'calculadoras', nombre: 'Calculadoras',
    descripcion: 'Función renal y conversiones.',
    planeadas: ['CKD-EPI', 'Cockcroft-Gault', 'Equianalgesia de opioides'],
  },
];
