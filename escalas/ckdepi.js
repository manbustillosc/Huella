// CKD-EPI 2021 (creatinina), sin coeficiente racial. Inker LA et al., N Engl J Med 2021.
export function tfgCkdEpi2021(scrMgDl, edad, mujer) {
  const k = mujer ? 0.7 : 0.9;
  const a = mujer ? -0.241 : -0.302;
  const x = scrMgDl / k;
  return 142 * Math.min(x, 1) ** a * Math.max(x, 1) ** -1.2 * 0.9938 ** edad * (mujer ? 1.012 : 1);
}
export const superficieCorporal = (pesoKg, tallaCm) => 0.007184 * pesoKg ** 0.425 * tallaCm ** 0.725; // DuBois

export const UNIDADES_CREATININA = [
  { id: 'mgdl', etiqueta: 'mg/dL', min: 0.1, max: 25 },
  { id: 'umol', etiqueta: 'µmol/L', min: 9, max: 2200, aBase: (x) => x / 88.4 },
];

const SUG_BAJA = [
  'Confirmar con una segunda determinación a los 3 meses o más para establecer cronicidad, y medir albuminuria (cociente albúmina/creatinina).',
  'Ajustar los fármacos de eliminación renal; para dosificar, revisa qué estimación pide la ficha técnica (a menudo depuración de creatinina de Cockcroft-Gault).',
  'Con masa muscular baja (sarcopenia, desnutrición, amputación) la creatinina sobrestima la función renal: considerar cistatina C (CKD-EPI creatinina–cistatina C 2021).',
];

const G = [
  { id: 'G5', min: 0, max: 14, etiqueta: 'G5 · Falla renal', nivel: 'critico', hallazgo: true, sugerencias: [...SUG_BAJA, 'Valoración por nefrología y planeación compartida del tratamiento.'] },
  { id: 'G4', min: 15, max: 29, etiqueta: 'G4 · Gravemente disminuida', nivel: 'grave', hallazgo: true, sugerencias: [...SUG_BAJA, 'Valoración por nefrología.'] },
  { id: 'G3b', min: 30, max: 44, etiqueta: 'G3b · Moderada a gravemente disminuida', nivel: 'grave', hallazgo: true, sugerencias: SUG_BAJA },
  { id: 'G3a', min: 45, max: 59, etiqueta: 'G3a · Leve a moderadamente disminuida', nivel: 'moderado', hallazgo: true, sugerencias: SUG_BAJA },
  { id: 'G2', min: 60, max: 89, etiqueta: 'G2 · Levemente disminuida', nivel: 'leve', sugerencias: ['Sin otros marcadores de daño renal (albuminuria, alteraciones del sedimento o de imagen), una TFG de 60–89 no establece enfermedad renal crónica.'] },
  { id: 'G1', min: 90, max: 200, etiqueta: 'G1 · Normal o alta', nivel: 'bien', sugerencias: [] },
].map((b) => ({ ...b, rango: b.id === 'G1' ? '≥90' : b.id === 'G5' ? '<15' : `${b.min} a ${b.max}`, texto: `Categoría KDIGO ${b.id}: TFG ${b.etiqueta.split(' · ')[1].toLowerCase()}.` }));

export default {
  id: 'ckdepi',
  nombre: 'Tasa de filtración glomerular estimada · CKD-EPI 2021',
  corto: 'CKD-EPI 2021',
  dominio: 'calculadoras',
  tipo: 'calculadora',
  aliases: ['TFG', 'filtrado glomerular', 'eGFR', 'funcion renal', 'creatinina'],
  problemas: ['enfermedad renal crónica', 'función renal', 'ajuste de dosis', 'creatinina'],
  descripcion: 'TFG estimada con creatinina, edad y sexo, sin coeficiente racial, en mL/min/1.73 m².',
  objetivo: 'Estimar la tasa de filtración glomerular para clasificar la enfermedad renal crónica (KDIGO).',
  poblacion: 'Adultos de 18 años o más con creatinina estable; ecuación de 2021 sin raza (Inker, 2021), recomendada por KDIGO 2024.',
  aplicacion: [
    'Usa una creatinina sérica en estado estable (no en lesión renal aguda).',
    'Elige la unidad de la creatinina; la conversión es 1 mg/dL = 88.4 µmol/L.',
    'El peso y la talla son opcionales: permiten calcular la TFG no indexada (mL/min) para dosificar fármacos en tamaños corporales extremos.',
  ],
  tiempo: '1 min',
  momentos: true,
  campos: [
    { id: 'creatinina', tipo: 'numero', texto: 'Creatinina sérica', unidades: UNIDADES_CREATININA, decimales: 2 },
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad' },
    { id: 'sexo', texto: 'Sexo', textoCorto: 'sexo', puntua: false, prefill: 'sexo', opciones: [{ texto: 'Mujer', valor: 1, clave: 'mujer' }, { texto: 'Hombre', valor: 0, clave: 'hombre' }] },
    { id: 'peso', tipo: 'numero', texto: 'Peso (opcional)', unidad: 'kg', min: 20, max: 300, decimales: 1, opcional: true },
    { id: 'talla', tipo: 'numero', texto: 'Talla (opcional)', unidad: 'cm', min: 100, max: 230, decimales: 0, opcional: true },
  ],
  bandas: G,
  calcular({ v }) {
    const tfg = tfgCkdEpi2021(v.creatinina, v.edad, v.sexo.valor === 1);
    const valor = Math.round(tfg);
    const lineas = [`Creatinina ${v.creatinina.toFixed(2)} mg/dL, ${v.edad} años, ${v.sexo.texto.toLowerCase()}.`];
    let noIndexada = null;
    if (v.peso != null && v.talla != null) {
      const sc = superficieCorporal(v.peso, v.talla);
      noIndexada = Math.round((tfg * sc) / 1.73);
      lineas.push(`TFG no indexada: ${noIndexada} mL/min (superficie corporal ${sc.toFixed(2)} m², DuBois).`);
    }
    return { valor, unidad: 'mL/min/1.73 m²', mostrar: String(valor), sufijo: 'mL/min/1.73 m²', lineas, extras: { noIndexada } };
  },
  resumen(res) {
    return `TFG estimada (CKD-EPI 2021): ${res.valor} mL/min/1.73 m², categoría ${res.banda.id}${res.extras.noIndexada ? `; no indexada ${res.extras.noIndexada} mL/min` : ''}.`;
  },
  resumenBreve(res) {
    return `TFG CKD-EPI 2021 ${res.valor} mL/min/1.73 m² (${res.banda.id})`;
  },
  detalleEnResumen: true,
  notas: [
    'Ecuación CKD-EPI 2021 sin coeficiente racial: 142 × mín(Cr/κ, 1)^α × máx(Cr/κ, 1)^−1.200 × 0.9938^edad × 1.012 si es mujer (κ = 0.7 mujer, 0.9 hombre; α = −0.241 mujer, −0.302 hombre).',
    'Estima la filtración glomerular indexada a 1.73 m²; no es la depuración de creatinina de Cockcroft-Gault que muchas fichas técnicas usan para ajustar dosis.',
    'Las categorías G1 y G2 solo indican enfermedad renal crónica si hay otros marcadores de daño renal; la cronicidad requiere 3 meses o más.',
    'No es válida en lesión renal aguda, embarazo, cambios extremos de masa muscular o dieta, ni en amputaciones.',
  ],
  referencias: [
    { texto: 'Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-49.', doi: '10.1056/NEJMoa2102953' },
    { texto: 'Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.', doi: '10.1016/j.kint.2023.10.018' },
  ],
};
