import { UNIDADES_CREATININA } from './ckdepi.js';

export function depuracionCG(edad, pesoKg, scrMgDl, mujer) {
  return (((140 - edad) * pesoKg) / (72 * scrMgDl)) * (mujer ? 0.85 : 1);
}
// Peso ideal de Devine.
export function pesoIdeal(tallaCm, mujer) {
  const pulgadas = tallaCm / 2.54;
  return (mujer ? 45.5 : 50) + 2.3 * (pulgadas - 60);
}
export const pesoAjustado = (real, ideal) => ideal + 0.4 * (real - ideal);

const PESOS = [
  { texto: 'Peso real', valor: 0, clave: 'real' },
  { texto: 'Peso ideal (requiere talla)', valor: 0, clave: 'ideal' },
  { texto: 'Peso ajustado (requiere talla)', valor: 0, clave: 'ajustado' },
];

const B = [
  { id: 'c4', min: 0, max: 14, rango: '<15', etiqueta: 'Depuración menor de 15 mL/min', nivel: 'critico' },
  { id: 'c3', min: 15, max: 29, rango: '15 a 29', etiqueta: 'Depuración de 15 a 29 mL/min', nivel: 'grave' },
  { id: 'c2', min: 30, max: 59, rango: '30 a 59', etiqueta: 'Depuración de 30 a 59 mL/min', nivel: 'moderado' },
  { id: 'c1', min: 60, max: 400, rango: '≥60', etiqueta: 'Depuración de 60 mL/min o más', nivel: 'bien' },
].map((b) => ({
  ...b,
  texto: 'Usa este valor con los umbrales de ajuste de dosis de la ficha técnica de cada fármaco.',
  sugerencias: b.min < 60 ? ['Revisar los fármacos de eliminación renal y ajustar la dosis según la ficha técnica.', 'Para clasificar la enfermedad renal crónica usa la TFG estimada (CKD-EPI 2021), no esta depuración.'] : [],
}));

export default {
  id: 'cockcroft',
  nombre: 'Depuración de creatinina estimada · Cockcroft-Gault',
  corto: 'Cockcroft-Gault',
  dominio: 'calculadoras',
  tipo: 'calculadora',
  aliases: ['depuracion de creatinina', 'aclaramiento', 'CrCl', 'ajuste de dosis', 'funcion renal'],
  problemas: ['ajuste de dosis', 'función renal', 'polifarmacia', 'creatinina'],
  descripcion: 'Depuración de creatinina en mL/min para ajuste de dosis de fármacos.',
  objetivo: 'Estimar la depuración de creatinina, la medida que usan muchas fichas técnicas para ajustar la dosis de fármacos de eliminación renal.',
  poblacion: 'Adultos con creatinina estable (Cockcroft y Gault, 1976; derivada en 249 hombres).',
  aplicacion: [
    'Usa una creatinina estable y el peso medido.',
    'Elige el peso para el cálculo. El ideal y el ajustado requieren la talla; Huella muestra los tres para comparar.',
    'No redondees la creatinina hacia arriba de forma rutinaria en personas mayores: puede subestimar la depuración.',
  ],
  tiempo: '1 min',
  momentos: true,
  campos: [
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad' },
    { id: 'sexo', texto: 'Sexo', textoCorto: 'sexo', puntua: false, prefill: 'sexo', opciones: [{ texto: 'Mujer', valor: 1, clave: 'mujer' }, { texto: 'Hombre', valor: 0, clave: 'hombre' }] },
    { id: 'creatinina', tipo: 'numero', texto: 'Creatinina sérica', unidades: UNIDADES_CREATININA, decimales: 2 },
    { id: 'peso', tipo: 'numero', texto: 'Peso real', unidad: 'kg', min: 20, max: 300, decimales: 1 },
    { id: 'talla', tipo: 'numero', texto: 'Talla (para peso ideal y ajustado)', unidad: 'cm', min: 100, max: 230, decimales: 0, opcional: true },
    { id: 'peso_uso', texto: 'Peso para el cálculo', textoCorto: 'peso usado', puntua: false, opciones: PESOS },
  ],
  bandas: B,
  calcular({ v }) {
    const mujer = v.sexo.valor === 1;
    const filas = [];
    const real = depuracionCG(v.edad, v.peso, v.creatinina, mujer);
    filas.push(['Peso real', `${v.peso} kg`, `${Math.round(real)} mL/min`]);
    let ideal = null;
    let ajustado = null;
    const lineas = [];
    if (v.talla != null) {
      const pi = pesoIdeal(v.talla, mujer);
      const pa = pesoAjustado(v.peso, pi);
      ideal = depuracionCG(v.edad, pi, v.creatinina, mujer);
      ajustado = depuracionCG(v.edad, pa, v.creatinina, mujer);
      filas.push(['Peso ideal (Devine)', `${pi.toFixed(1)} kg`, `${Math.round(ideal)} mL/min`]);
      filas.push(['Peso ajustado', `${pa.toFixed(1)} kg`, `${Math.round(ajustado)} mL/min`]);
      const imc = v.peso / (v.talla / 100) ** 2;
      const pct = (v.peso / pi) * 100;
      lineas.push(`IMC ${imc.toFixed(1)} kg/m²; peso real ${Math.round(pct)} % del ideal.`);
      if (v.talla < 152.4) lineas.push('Talla menor de 152 cm: la fórmula de Devine puede subestimar el peso ideal.');
    }
    const uso = v.peso_uso.clave;
    if (uso !== 'real' && v.talla == null) return { faltan: ['talla'] };
    const elegido = uso === 'ideal' ? ideal : uso === 'ajustado' ? ajustado : real;
    const valor = Math.round(elegido);
    return {
      valor,
      unidad: 'mL/min',
      mostrar: String(valor),
      sufijo: 'mL/min',
      lineas: [`Calculada con ${v.peso_uso.texto.replace(' (requiere talla)', '').toLowerCase()}.`, ...lineas],
      detalles: [{ titulo: 'Depuración según el peso usado', encabezados: ['Peso', 'Valor', 'Depuración'], filas }],
      extras: { uso: v.peso_uso.texto.replace(' (requiere talla)', '').toLowerCase() },
    };
  },
  resumen(res) {
    return `Depuración de creatinina (Cockcroft-Gault, ${res.extras.uso}): ${res.valor} mL/min.`;
  },
  resumenBreve(res) {
    return `depuración de creatinina Cockcroft-Gault ${res.valor} mL/min (${res.extras.uso})`;
  },
  detalleEnResumen: true,
  barra: false,
  notas: [
    'Fórmula: (140 − edad) × peso / (72 × creatinina en mg/dL), × 0.85 si es mujer. Resultado en mL/min, no indexado a superficie corporal.',
    'Es una depuración de creatinina para dosificar fármacos, no una tasa de filtración glomerular: para clasificar la enfermedad renal usa CKD-EPI 2021.',
    'Elección del peso: el peso real tiende a sobrestimar la depuración en obesidad y el ideal a subestimarla en bajo peso. Una práctica frecuente es usar el real si es menor que el ideal, el ideal con peso normal y el ajustado en obesidad (peso >120–130 % del ideal o IMC ≥30); sigue la ficha técnica del fármaco.',
    'Sobrestima la función renal con masa muscular baja (sarcopenia, desnutrición, encamamiento).',
  ],
  referencias: [
    { texto: 'Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41.', doi: '10.1159/000180580' },
    { texto: 'Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650-5.' },
  ],
};
