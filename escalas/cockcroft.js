import { UNIDADES_CREATININA } from './ckdepi.js';
import { mostrarSinCruzar } from '../js/motor.js';

export function depuracionCG(edad, pesoKg, scrMgDl, mujer) {
  return (((140 - edad) * pesoKg) / (72 * scrMgDl)) * (mujer ? 0.85 : 1);
}
// Peso ideal de Devine (1974). Su extrapolación por debajo de 60 pulgadas (152.4 cm) da valores
// fisiológicamente inapropiados, por eso Huella no la usa en esas tallas.
export const TALLA_MINIMA_DEVINE = 152.4;
export function pesoIdeal(tallaCm, mujer) {
  const pulgadas = tallaCm / 2.54;
  return (mujer ? 45.5 : 50) + 2.3 * (pulgadas - 60);
}
export const pesoAjustado = (real, ideal) => ideal + 0.4 * (real - ideal);

export function categoriaDepuracion(x) {
  if (x < 15) return 'c4';
  if (x < 30) return 'c3';
  if (x < 60) return 'c2';
  return 'c1';
}

const PESOS = [
  { texto: 'Peso real', valor: 0, clave: 'real' },
  { texto: 'Peso ideal (requiere talla)', valor: 0, clave: 'ideal' },
  { texto: 'Peso ajustado (requiere talla)', valor: 0, clave: 'ajustado' },
];
const NOMBRE_PESO = { real: 'peso real', ideal: 'peso ideal (Devine)', ajustado: 'peso ajustado' };

const B = [
  { id: 'c4', min: 0, max: 14, rango: '<15', etiqueta: 'Depuración menor de 15 mL/min', nivel: 'critico' },
  { id: 'c3', min: 15, max: 29, rango: '15 a <30', etiqueta: 'Depuración de 15 a 29 mL/min', nivel: 'grave' },
  { id: 'c2', min: 30, max: 59, rango: '30 a <60', etiqueta: 'Depuración de 30 a 59 mL/min', nivel: 'moderado' },
  { id: 'c1', min: 60, max: Infinity, rango: '≥60', etiqueta: 'Depuración de 60 mL/min o más', nivel: 'bien' },
].map((b) => ({
  ...b,
  texto: 'Usa este valor con los umbrales de la ficha técnica de cada fármaco. Huella no calcula ni recomienda dosis.',
  sugerencias: b.min < 60 ? ['Revisar los fármacos de eliminación renal con su ficha técnica y los datos del paciente.', 'Para clasificar la enfermedad renal crónica usa la TFG estimada (CKD-EPI 2021), no esta depuración.'] : [],
}));
const porId = Object.fromEntries(B.map((b) => [b.id, b]));

export default {
  id: 'cockcroft',
  nombre: 'Depuración de creatinina estimada · Cockcroft-Gault',
  corto: 'Cockcroft-Gault',
  dominio: 'calculadoras',
  tipo: 'calculadora',
  aliases: ['depuracion de creatinina', 'aclaramiento', 'CrCl', 'ajuste de dosis', 'funcion renal'],
  problemas: ['ajuste de dosis', 'función renal', 'polifarmacia', 'creatinina'],
  descripcion: 'Depuración de creatinina en mL/min, la estimación que usan muchas fichas técnicas para dosificar.',
  objetivo: 'Estimar la depuración de creatinina, la medida que usan muchas fichas técnicas para ajustar la dosis de fármacos de eliminación renal.',
  poblacion: 'Adultos con creatinina estable (Cockcroft y Gault, 1976; derivada en 249 hombres).',
  aplicacion: [
    'Usa una creatinina estable y el peso medido.',
    'Elige el peso para el cálculo. El ideal y el ajustado requieren la talla; Huella muestra los tres para comparar.',
    'No redondees la creatinina hacia arriba de forma rutinaria en personas mayores: puede subestimar la depuración.',
  ],
  tiempo: '1 min',
  momentos: true,
  direccionClinica: 'sin_direccion',
  unidadCambio: 'mL/min',
  decimalesCambio: 0,
  comparable(antes, despues) {
    const a = antes.extras?.peso;
    const b = despues.extras?.peso;
    return a && b && a !== b ? { advertencia: `Calculadas con distinto peso (${NOMBRE_PESO[a]} y ${NOMBRE_PESO[b]}): la diferencia no refleja solo la función renal.` } : null;
  },
  campos: [
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad' },
    { id: 'sexo', texto: 'Sexo', textoCorto: 'sexo', puntua: false, prefill: 'sexo', opciones: [{ texto: 'Mujer', valor: 1, clave: 'mujer' }, { texto: 'Hombre', valor: 0, clave: 'hombre' }] },
    { id: 'creatinina', tipo: 'numero', texto: 'Creatinina sérica', unidades: UNIDADES_CREATININA, decimales: 2 },
    { id: 'peso', tipo: 'numero', texto: 'Peso real', unidad: 'kg', min: 20, max: 300, decimales: 1 },
    { id: 'talla', tipo: 'numero', texto: 'Talla (para peso ideal y ajustado)', unidad: 'cm', min: 100, max: 230, decimales: 0, opcional: true },
    { id: 'peso_uso', texto: 'Peso para el cálculo', textoCorto: 'peso usado', puntua: false, opciones: PESOS },
  ],
  validar({ v }) {
    const uso = v.peso_uso?.clave;
    if (!uso || uso === 'real') return null;
    if (v.talla == null) return { peso_uso: 'El peso ideal y el ajustado requieren la talla.' };
    if (v.talla < TALLA_MINIMA_DEVINE) return { peso_uso: 'Con talla menor de 152.4 cm la fórmula de Devine da pesos ideales no confiables: usa el peso real o el criterio de la ficha técnica.' };
    return null;
  },
  bandas: B,
  calcular({ v }) {
    const mujer = v.sexo.valor === 1;
    const uso = v.peso_uso.clave;
    const real = depuracionCG(v.edad, v.peso, v.creatinina, mujer);
    const filas = [['Peso real', `${v.peso} kg`, `${Math.round(real)} mL/min`]];
    const lineas = [];
    let ideal = null;
    let ajustado = null;
    let pi = null;
    if (v.talla != null) {
      const imc = v.peso / (v.talla / 100) ** 2;
      if (v.talla >= TALLA_MINIMA_DEVINE) {
        pi = pesoIdeal(v.talla, mujer);
        const pa = pesoAjustado(v.peso, pi);
        ideal = depuracionCG(v.edad, pi, v.creatinina, mujer);
        ajustado = depuracionCG(v.edad, pa, v.creatinina, mujer);
        filas.push(['Peso ideal (Devine)', `${pi.toFixed(1)} kg`, `${Math.round(ideal)} mL/min`]);
        filas.push(['Peso ajustado', `${pa.toFixed(1)} kg`, `${Math.round(ajustado)} mL/min`]);
        lineas.push(`IMC ${imc.toFixed(1)} kg/m²; peso real ${Math.round((v.peso / pi) * 100)} % del ideal.`);
      } else {
        filas.push(['Peso ideal (Devine)', 'No aplicable', 'Talla <152.4 cm']);
        filas.push(['Peso ajustado', 'No aplicable', 'Talla <152.4 cm']);
        lineas.push(`IMC ${imc.toFixed(1)} kg/m². Talla menor de 152.4 cm: la fórmula de Devine no da un peso ideal confiable.`);
      }
      if (imc < 18.5) lineas.push('Bajo peso: con masa muscular baja la creatinina sobrestima la depuración.');
      if (uso === 'real' && (imc >= 30 || (pi && v.peso > pi * 1.3))) lineas.push('Obesidad: el peso real tiende a sobrestimar la depuración; revisa si la ficha técnica indica peso ajustado.');
      if (uso === 'ideal' && pi && v.peso < pi) lineas.push('El peso real es menor que el ideal: usar el ideal sobrestima la depuración; suele preferirse el peso real.');
      if (uso === 'ajustado' && pi && v.peso <= pi * 1.2) lineas.push('El peso ajustado suele reservarse para obesidad (peso real mayor de 120–130 % del ideal).');
    } else {
      lineas.push('Sin talla no se puede valorar si el peso real es adecuado para el cálculo (obesidad o bajo peso).');
    }
    const elegido = uso === 'ideal' ? ideal : uso === 'ajustado' ? ajustado : real;
    const id = categoriaDepuracion(elegido);
    const mostrar = mostrarSinCruzar(elegido, 0, categoriaDepuracion);
    lineas.unshift(`Calculada con ${NOMBRE_PESO[uso]}.`);
    lineas.push('Con masa muscular baja (sarcopenia, desnutrición, encamamiento) la creatinina sobrestima la depuración. Huella no calcula dosis: usa la ficha técnica del fármaco.');
    return {
      valor: elegido,
      unidad: 'mL/min',
      mostrar,
      sufijo: 'mL/min',
      banda: porId[id],
      lineas,
      detalles: [{ titulo: 'Depuración según el peso', encabezados: ['Peso', 'Valor', 'Depuración'], filas }],
      extras: { uso: NOMBRE_PESO[uso], peso: uso },
    };
  },
  resumen(res) {
    return `Depuración de creatinina (Cockcroft-Gault, ${res.extras.uso}): ${res.mostrar} mL/min.`;
  },
  resumenBreve(res) {
    return `depuración de creatinina Cockcroft-Gault ${res.mostrar} mL/min (${res.extras.uso})`;
  },
  detalleEnResumen: true,
  barra: false,
  notas: [
    'Fórmula: (140 − edad) × peso / (72 × creatinina en mg/dL), × 0.85 si es mujer. Resultado en mL/min, no indexado a superficie corporal.',
    'Es una depuración de creatinina para dosificar fármacos, no una tasa de filtración glomerular: para clasificar la enfermedad renal usa CKD-EPI 2021.',
    'Peso ideal de Devine: 50 kg (hombres) o 45.5 kg (mujeres) + 2.3 kg por cada pulgada por encima de 5 pies (60 pulgadas, 152.4 cm). Se definió para tallas mayores de 5 pies; extrapolarla por debajo da pesos ideales inapropiados (p. ej., 16 kg para una mujer de 120 cm), por eso Huella no la aplica. Peso ajustado = ideal + 0.4 × (real − ideal).',
    'Elección del peso: el real tiende a sobrestimar la depuración en obesidad y el ideal a sobrestimarla si el peso real es menor. Una práctica frecuente es usar el real si es menor que el ideal, el ideal con peso normal y el ajustado en obesidad; sigue la ficha técnica del fármaco.',
    'Sobrestima la función renal con masa muscular baja (sarcopenia, desnutrición, encamamiento). Huella no calcula ni recomienda dosis.',
  ],
  referencias: [
    { texto: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41.', doi: '10.1159/000180580' },
    { texto: 'Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650-5.' },
    { texto: 'Pai MP, Paloucek FP. The origin of the "ideal" body weight equations. Ann Pharmacother. 2000;34(9):1066-9.', doi: '10.1345/aph.19381' },
  ],
};
