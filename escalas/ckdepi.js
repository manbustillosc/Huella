import { mostrarSinCruzar } from '../js/motor.js';

// CKD-EPI 2021 (creatinina), sin coeficiente racial. Inker LA et al., N Engl J Med 2021.
export function tfgCkdEpi2021(scrMgDl, edad, mujer) {
  const k = mujer ? 0.7 : 0.9;
  const a = mujer ? -0.241 : -0.302;
  const x = scrMgDl / k;
  return 142 * Math.min(x, 1) ** a * Math.max(x, 1) ** -1.2 * 0.9938 ** edad * (mujer ? 1.012 : 1);
}
export const superficieCorporal = (pesoKg, tallaCm) => 0.007184 * pesoKg ** 0.425 * tallaCm ** 0.725; // DuBois

// Rango de creatinina sérica aceptado; fuera de él el valor es improbable o un error de captura.
export const UNIDADES_CREATININA = [
  { id: 'mgdl', etiqueta: 'mg/dL', min: 0.2, max: 25 },
  { id: 'umol', etiqueta: 'µmol/L', min: 18, max: 2210, aBase: (x) => x / 88.4 },
];

// Categorías KDIGO con el valor sin redondear: G3a es 45 a <60, aunque se muestre «59.6».
export function categoriaTfg(tfg) {
  if (tfg < 15) return 'G5';
  if (tfg < 30) return 'G4';
  if (tfg < 45) return 'G3b';
  if (tfg < 60) return 'G3a';
  if (tfg < 90) return 'G2';
  return 'G1';
}
const ORDEN_G = ['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5'];

const ERC = 'Una determinación aislada no confirma enfermedad renal crónica: se requiere alteración persistente por 3 meses o más y evaluar la albuminuria (cociente albúmina/creatinina; categorías A1–A3).';
const SUG_BAJA = [
  'Confirmar con una segunda determinación a los 3 meses o más para establecer cronicidad, y medir albuminuria (cociente albúmina/creatinina).',
  'Revisar los fármacos de eliminación renal; para dosificar, consulta qué estimación pide la ficha técnica (a menudo depuración de creatinina de Cockcroft-Gault).',
  'Con masa muscular baja (sarcopenia, desnutrición, amputación) la creatinina sobrestima la función renal: considerar cistatina C (CKD-EPI creatinina–cistatina C 2021).',
];

const G = [
  { id: 'G5', min: 0, max: 14, rango: '<15', nombre: 'falla renal', nivel: 'critico', hallazgo: true, sugerencias: [...SUG_BAJA, 'Valoración por nefrología y planeación compartida del tratamiento.'] },
  { id: 'G4', min: 15, max: 29, rango: '15 a <30', nombre: 'gravemente disminuida', nivel: 'grave', hallazgo: true, sugerencias: [...SUG_BAJA, 'Valoración por nefrología.'] },
  { id: 'G3b', min: 30, max: 44, rango: '30 a <45', nombre: 'moderada a gravemente disminuida', nivel: 'grave', hallazgo: true, sugerencias: SUG_BAJA },
  { id: 'G3a', min: 45, max: 59, rango: '45 a <60', nombre: 'leve a moderadamente disminuida', nivel: 'moderado', hallazgo: true, sugerencias: SUG_BAJA },
  { id: 'G2', min: 60, max: 89, rango: '60 a <90', nombre: 'levemente disminuida', nivel: 'leve', sugerencias: ['Sin otros marcadores de daño renal (albuminuria, alteraciones del sedimento o de imagen), una TFG de 60 a 89 no establece enfermedad renal crónica.'] },
  { id: 'G1', min: 90, max: Infinity, rango: '≥90', nombre: 'normal o alta', nivel: 'bien', sugerencias: [] },
].map((b) => ({
  ...b,
  etiqueta: `${b.id} · TFG ${b.nombre}`,
  texto: b.id === 'G1' || b.id === 'G2'
    ? `TFG estimada en categoría KDIGO ${b.id} (${b.rango} mL/min/1.73 m²). No indica enfermedad renal crónica sin marcadores de daño renal.`
    : `TFG estimada en categoría KDIGO ${b.id} (${b.rango} mL/min/1.73 m²). ${ERC}`,
}));
const porG = Object.fromEntries(G.map((b) => [b.id, b]));
const gDeEtiqueta = (etiqueta) => String(etiqueta || '').split(' ')[0];

export default {
  id: 'ckdepi',
  nombre: 'Tasa de filtración glomerular estimada · CKD-EPI 2021',
  corto: 'CKD-EPI 2021',
  dominio: 'calculadoras',
  tipo: 'calculadora',
  aliases: ['TFG', 'filtrado glomerular', 'eGFR', 'funcion renal', 'creatinina', 'KDIGO'],
  problemas: ['enfermedad renal crónica', 'función renal', 'ajuste de dosis', 'creatinina'],
  descripcion: 'TFG estimada con creatinina, edad y sexo, sin coeficiente racial, en mL/min/1.73 m².',
  objetivo: 'Estimar la tasa de filtración glomerular y su categoría KDIGO (G1–G5) como parte de la evaluación de la enfermedad renal crónica.',
  poblacion: 'Adultos de 18 años o más con creatinina estable; ecuación de 2021 sin raza (Inker, 2021), recomendada por KDIGO 2024.',
  aplicacion: [
    'Usa una creatinina sérica en estado estable (no en lesión renal aguda).',
    'Elige la unidad de la creatinina; la conversión es 1 mg/dL = 88.4 µmol/L.',
    'El peso y la talla son opcionales: permiten calcular la TFG no indexada (mL/min) para dosificar fármacos en tamaños corporales extremos.',
  ],
  tiempo: '1 min',
  momentos: true,
  direccionClinica: 'mayor_mejor',
  unidadCambio: 'mL/min/1.73 m²',
  decimalesCambio: 0,
  textoMejoria: 'mayor TFG estimada',
  textoEmpeoramiento: 'menor TFG estimada',
  cambioExtra(antes, despues) {
    const ga = ORDEN_G.indexOf(gDeEtiqueta(antes.etiqueta));
    const gb = ORDEN_G.indexOf(gDeEtiqueta(despues.etiqueta));
    const avisos = [];
    if (ga >= 0 && gb > ga && antes.valor > 0 && (despues.valor - antes.valor) / antes.valor <= -0.25) {
      avisos.push('Cumple la definición de KDIGO (2012) de descenso definido de la TFG: cambio a una categoría peor con disminución de 25 % o más respecto a la referencia. Confirma que la creatinina esté estable (sin lesión renal aguda).');
    }
    avisos.push('La creatinina tiene variación biológica y analítica: interpreta con cautela los cambios pequeños.');
    return avisos;
  },
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
    const id = categoriaTfg(tfg);
    const mostrar = mostrarSinCruzar(tfg, 0, categoriaTfg);
    const lineas = [`Creatinina ${v.creatinina.toFixed(2)} mg/dL, ${v.edad} años, ${v.sexo.texto.toLowerCase()}.`];
    if (mostrar.includes('.')) lineas.push(`Se muestra con decimal porque el redondeo a entero cambiaría la categoría (valor calculado ${tfg.toFixed(2)}).`);
    let noIndexada = null;
    if (v.peso != null && v.talla != null) {
      const sc = superficieCorporal(v.peso, v.talla);
      noIndexada = (tfg * sc) / 1.73;
      lineas.push(`TFG no indexada: ${Math.round(noIndexada)} mL/min (superficie corporal ${sc.toFixed(2)} m², DuBois).`);
    } else if (v.peso != null || v.talla != null) {
      lineas.push('Para la TFG no indexada se necesitan peso y talla.');
    }
    if (tfg >= 120) lineas.push('Valor alto: verifica la creatinina; con masa muscular baja la ecuación sobrestima la filtración.');
    lineas.push('Estimación indexada a 1.73 m²: no es la depuración de creatinina de Cockcroft-Gault que muchas fichas técnicas usan para dosificar.');
    return { valor: tfg, unidad: 'mL/min/1.73 m²', mostrar, sufijo: 'mL/min/1.73 m²', banda: porG[id], lineas, extras: { noIndexada: noIndexada == null ? null : Math.round(noIndexada) } };
  },
  resumen(res) {
    return `TFG estimada (CKD-EPI 2021): ${res.mostrar} mL/min/1.73 m², categoría ${res.banda.id}${res.extras.noIndexada ? `; no indexada ${res.extras.noIndexada} mL/min` : ''}.`;
  },
  resumenBreve(res) {
    return `TFG CKD-EPI 2021 ${res.mostrar} mL/min/1.73 m² (${res.banda.id})`;
  },
  detalleEnResumen: true,
  notas: [
    'Ecuación CKD-EPI 2021 sin coeficiente racial: 142 × mín(Cr/κ, 1)^α × máx(Cr/κ, 1)^−1.200 × 0.9938^edad × 1.012 si es mujer (κ = 0.7 mujer, 0.9 hombre; α = −0.241 mujer, −0.302 hombre).',
    'La categoría se asigna con el valor sin redondear; si el redondeo a entero cambiara la categoría, se muestra un decimal.',
    'TFG estimada no es diagnóstico de enfermedad renal crónica: se requieren 3 meses o más de TFG <60 o de marcadores de daño renal (como albuminuria ≥30 mg/g), y clasificar también por albuminuria (A1–A3).',
    'No es válida en lesión renal aguda, embarazo, cambios extremos de masa muscular o dieta, ni en amputaciones. En sarcopenia y desnutrición la creatinina baja sobrestima la filtración: considera cistatina C.',
    'Estima la filtración indexada a 1.73 m²; no es la depuración de creatinina de Cockcroft-Gault que muchas fichas técnicas usan para ajustar dosis.',
  ],
  referencias: [
    { texto: 'Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-49.', doi: '10.1056/NEJMoa2102953' },
    { texto: 'Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. KDIGO 2012 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int Suppl. 2013;3(1):1-150.' },
    { texto: 'Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.', doi: '10.1016/j.kint.2023.10.018' },
  ],
};
