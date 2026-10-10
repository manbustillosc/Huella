// Rutas clínicas guiadas: instrumentos agrupados por situación. Un paso con { plan } aún no está disponible.
export const RUTAS = [
  {
    id: 'rapida', nombre: 'Valoración geriátrica rápida', icono: 'rapida',
    descripcion: 'Tamizaje breve en consulta: funcionalidad, cognición, ánimo, fragilidad, sarcopenia y nutrición.',
    pasos: ['barthel', 'lawton', 'minicog', 'gds15', 'frail', 'sarcf', 'mnasf'],
  },
  {
    id: 'completa', nombre: 'Valoración geriátrica completa', icono: 'valoracion',
    descripcion: 'Valoración integral por dominios, con desempeño físico y sobrecarga del cuidador.',
    pasos: ['barthel', 'lawton', 'moca', 'gds15', 'cfs', 'frail', 'sarcf', 'sppb', 'tug', 'mnasf', 'zarit', { plan: 'Fenotipo de Fried' }, { plan: 'STOPP/START' }, { plan: 'Gijón' }],
  },
  {
    id: 'hospital', nombre: 'Valoración hospitalaria', icono: 'hospital',
    descripcion: 'Al ingreso: funcionalidad basal y actual, delirium, fragilidad basal, piel, dolor y nutrición.',
    momento: 'ingreso',
    pasos: [
      { id: 'barthel', momento: 'basal' }, { id: 'barthel', momento: 'ingreso' },
      { id: 'katz', momento: 'basal' }, { id: 'katz', momento: 'ingreso' },
      '4at', 'cam', { id: 'cfs', momento: 'basal' }, 'braden', 'painad', 'mnasf', 'ckdepi', { plan: 'RASS' },
    ],
  },
  {
    id: 'cognitiva', nombre: 'Evaluación cognitiva', icono: 'cognitivo',
    descripcion: 'Tamizaje, evaluación cognitiva, ánimo, delirium y repercusión funcional.',
    pasos: ['minicog', 'moca', '4at', 'gds15', 'lawton', { plan: 'MMSE (registro)' }, { plan: 'FAQ de Pfeffer' }, { plan: 'CDR (registro)' }],
  },
  {
    id: 'fragilidad', nombre: 'Fragilidad y movilidad', icono: 'fragilidad',
    descripcion: 'Fragilidad, sarcopenia, desempeño físico, caídas y prescripción de ejercicio Vivifrail.',
    pasos: ['frail', 'cfs', 'sarcf', 'sppb', 'velocidad', 'tug', 'vivifrail', { plan: 'Fenotipo de Fried' }, { plan: 'Downton' }],
  },
  {
    id: 'preqx', nombre: 'Valoración prequirúrgica', icono: 'prequirurgica',
    descripcion: 'Riesgo cardiaco, fragilidad, cognición basal, funcionalidad, nutrición y función renal.',
    pasos: ['rcri', 'cfs', 'minicog', 'barthel', 'mnasf', 'ckdepi', { plan: 'ARISCAT' }, { plan: 'ASA' }, { plan: 'DASI' }],
  },
  {
    id: 'calculadoras', nombre: 'Calculadoras clínicas', icono: 'calculadoras',
    descripcion: 'Función renal: filtración glomerular y depuración de creatinina para dosificar.',
    pasos: ['ckdepi', 'cockcroft', { plan: 'Equianalgesia de opioides' }],
  },
];

// Paso normalizado: { id, momento?, plan?, clave }
export function pasosDe(ruta) {
  return ruta.pasos.map((p) => {
    if (typeof p === 'string') return { id: p, clave: p };
    if (p.plan) return { plan: p.plan, clave: `plan:${p.plan}` };
    return { ...p, clave: `${p.id}@${p.momento}` };
  });
}
