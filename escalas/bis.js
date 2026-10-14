// Berlin Initiative Study (BIS): TFG estimada en personas de 70 años o más. Schaeffner ES et al., Ann Intern Med 2012.
// BIS1 usa creatinina; BIS2, creatinina y cistatina C. Mismas categorías KDIGO que CKD-EPI.
import { mostrarSinCruzar } from '../js/motor.js';
import ckdepi, { UNIDADES_CREATININA, categoriaTfg, BANDAS_TFG } from './ckdepi.js';

// Creatinina en mg/dL (estandarizada, trazable a IDMS); cistatina C en mg/L; edad en años.
export const tfgBis1 = (scrMgDl, edad, mujer) => 3736 * scrMgDl ** -0.87 * edad ** -0.95 * (mujer ? 0.82 : 1);
export const tfgBis2 = (cisMgL, scrMgDl, edad, mujer) => 767 * cisMgL ** -0.61 * scrMgDl ** -0.40 * edad ** -0.57 * (mujer ? 0.87 : 1);
export const EDAD_BIS = 70;

// Mismas categorías KDIGO; la sugerencia de usar cistatina C remite a BIS2 en lugar de CKD-EPI.
const BANDAS_BIS = BANDAS_TFG.map((b) => ({
  ...b,
  sugerencias: b.sugerencias.map((x) => x.replace('considerar cistatina C (CKD-EPI creatinina–cistatina C 2021)', 'agregar la cistatina C para calcular BIS2')),
}));
const porG = Object.fromEntries(BANDAS_BIS.map((b) => [b.id, b]));
const fmt0 = (x) => mostrarSinCruzar(x, 0, categoriaTfg);
const fmtCr = (x) => Number(x.toFixed(2)).toString();

// Reutiliza la creatinina (con su unidad) de un CKD-EPI o un Cockcroft-Gault guardado en la valoración.
const vinculoCreatinina = (escala, titulo) => ({
  id: escala, escala, titulo,
  disponible: (res) => (res.respuestas?.creatinina != null && String(res.respuestas.creatinina).trim() !== ''
    ? true
    : `El resultado guardado de ${titulo.replace('Creatinina de ', '')} no tiene la creatinina registrada.`),
  describir: (res) => {
    const u = UNIDADES_CREATININA.find((x) => x.id === res.respuestas.creatinina_u) || UNIDADES_CREATININA[0];
    return `Creatinina ${res.respuestas.creatinina} ${u.etiqueta}`;
  },
  aplicar: (res) => ({ creatinina: String(res.respuestas.creatinina), ...(res.respuestas.creatinina_u ? { creatinina_u: res.respuestas.creatinina_u } : {}) }),
  campos: ['creatinina'],
});

export default {
  id: 'bis',
  nombre: 'Tasa de filtración glomerular estimada · BIS1 y BIS2 (Berlin Initiative Study)',
  corto: 'BIS',
  dominio: 'calculadoras',
  tipo: 'calculadora',
  aliases: ['BIS1', 'BIS2', 'BIS 1', 'BIS 2', 'Berlin Initiative Study', 'Berlin', 'cistatina C', 'cistatina', 'TFG', 'filtrado glomerular', 'eGFR', 'funcion renal', 'creatinina', 'KDIGO', 'adulto mayor'],
  problemas: ['enfermedad renal crónica', 'función renal', 'ajuste de dosis', 'creatinina', 'cistatina C'],
  descripcion: 'TFG estimada para personas de 70 años o más: BIS1 con creatinina y BIS2 con creatinina y cistatina C, en mL/min/1.73 m².',
  objetivo: 'Estimar la tasa de filtración glomerular y su categoría KDIGO (G1–G5) en personas mayores, con ecuaciones derivadas en ese grupo de edad.',
  poblacion: 'Personas de 70 años o más con creatinina estable (Schaeffner, 2012: 610 participantes de Berlín, edad media 78.5 años, TFG medida por depuración plasmática de iohexol). Útil sobre todo con función normal o disminución leve a moderada.',
  aplicacion: [
    'Usa una creatinina sérica en estado estable (no en lesión renal aguda), medida con un método estandarizado.',
    'Si tienes cistatina C (mg/L), Huella calcula también BIS2 y la usa para la categoría; sin cistatina C, usa BIS1.',
    'Si ya registraste un CKD-EPI o un Cockcroft-Gault en esta valoración, puedes reutilizar su creatinina.',
  ],
  tiempo: '1 min',
  momentos: true,
  direccionClinica: 'sin_direccion',
  unidadCambio: 'mL/min/1.73 m²',
  decimalesCambio: 0,
  cambioExtra: ckdepi.cambioExtra,
  vinculos: [vinculoCreatinina('ckdepi', 'Creatinina de CKD-EPI 2021'), vinculoCreatinina('cockcroft', 'Creatinina de Cockcroft-Gault')],
  campos: [
    { id: 'creatinina', tipo: 'numero', texto: 'Creatinina sérica', unidades: UNIDADES_CREATININA, decimales: 2 },
    { id: 'cistatina', tipo: 'numero', texto: 'Cistatina C (opcional, para BIS2)', unidad: 'mg/L', min: 0.2, max: 10, decimales: 2, opcional: true },
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad' },
    { id: 'sexo', texto: 'Sexo', textoCorto: 'sexo', puntua: false, prefill: 'sexo', opciones: [{ texto: 'Mujer', valor: 1, clave: 'mujer' }, { texto: 'Hombre', valor: 0, clave: 'hombre' }] },
  ],
  bandas: BANDAS_BIS,
  calcular({ v }) {
    const mujer = v.sexo.valor === 1;
    const bis1 = tfgBis1(v.creatinina, v.edad, mujer);
    const bis2 = v.cistatina != null ? tfgBis2(v.cistatina, v.creatinina, v.edad, mujer) : null;
    const ecuacion = bis2 != null ? 'BIS2' : 'BIS1';
    const tfg = bis2 ?? bis1;
    const id = categoriaTfg(tfg);
    const mostrar = fmt0(tfg);
    const lineas = [
      `Creatinina ${fmtCr(v.creatinina)} mg/dL${v.cistatina != null ? `, cistatina C ${fmtCr(v.cistatina)} mg/L` : ''}, ${v.edad} años, ${v.sexo.texto.toLowerCase()}.`,
      bis2 != null
        ? `BIS2 (creatinina y cistatina C): ${fmt0(bis2)} mL/min/1.73 m², categoría ${categoriaTfg(bis2)}; BIS1 (solo creatinina): ${fmt0(bis1)} mL/min/1.73 m², categoría ${categoriaTfg(bis1)}. La categoría usa BIS2.`
        : `BIS1 (solo creatinina): ${fmt0(bis1)} mL/min/1.73 m². Con cistatina C se calcula BIS2, la de menor sesgo en el estudio original.`,
    ];
    const alertas = [];
    if (v.edad < EDAD_BIS) alertas.push(`BIS se derivó en personas de ${EDAD_BIS} años o más; con ${v.edad} años usa CKD-EPI 2021.`);
    if (mostrar.includes('.')) lineas.push(`Se muestra con decimal porque el redondeo a entero cambiaría la categoría (valor calculado ${tfg.toFixed(2)}).`);
    if (tfg < 30) lineas.push('Con TFG estimada menor de 30, la concordancia con la TFG medida fue menor en el estudio original: interpreta con cautela.');
    lineas.push('Estimación indexada a 1.73 m²: no es la depuración de creatinina de Cockcroft-Gault que muchas fichas técnicas usan para dosificar.');
    return {
      valor: tfg, unidad: 'mL/min/1.73 m²', mostrar, sufijo: 'mL/min/1.73 m²', banda: porG[id], lineas, alertas,
      extras: { ecuacion, bis1: Number(bis1.toFixed(1)), bis2: bis2 == null ? null : Number(bis2.toFixed(1)), edadFueraDeRango: v.edad < EDAD_BIS },
    };
  },
  resumen(res) {
    const otra = res.extras.bis2 != null ? `; BIS1 ${fmt0(res.extras.bis1)} mL/min/1.73 m²` : '';
    return `TFG estimada (${res.extras.ecuacion}): ${res.mostrar} mL/min/1.73 m², categoría ${res.banda.id}${otra}.`;
  },
  resumenBreve(res) {
    return `TFG ${res.extras.ecuacion} ${res.mostrar} mL/min/1.73 m² (${res.banda.id})`;
  },
  detalleEnResumen: true,
  notas: [
    'BIS1 = 3736 × creatinina^−0.87 × edad^−0.95 × 0.82 si es mujer. BIS2 = 767 × cistatina C^−0.61 × creatinina^−0.40 × edad^−0.57 × 0.87 si es mujer. Creatinina en mg/dL, cistatina C en mg/L, edad en años; resultado en mL/min/1.73 m².',
    'Derivadas en 610 personas de 70 años o más de una población comunitaria de Berlín, con la TFG medida por depuración plasmática de iohexol. BIS2 tuvo el menor sesgo; entre las ecuaciones con creatinina, BIS1 tuvo la menor clasificación errónea alrededor de 60 mL/min/1.73 m².',
    'Los autores recomiendan BIS2 en personas de 70 años o más con función renal normal o disminución leve a moderada, y BIS1 como alternativa aceptable si no hay cistatina C. El estudio original no tuvo validación externa y la población fue de origen europeo.',
    'La categoría KDIGO se asigna con el valor sin redondear. Una determinación aislada no confirma enfermedad renal crónica: se requieren 3 meses o más y evaluar la albuminuria.',
    'No es válida en lesión renal aguda ni con masa muscular extrema; la cistatina C se altera con hipotiroidismo o hipertiroidismo, glucocorticoides, inflamación y obesidad.',
    'Para dosificar fármacos, consulta qué estimación pide la ficha técnica (a menudo depuración de creatinina de Cockcroft-Gault).',
  ],
  referencias: [
    { texto: 'Schaeffner ES, Ebert N, Delanaye P, et al. Two novel equations to estimate kidney function in persons aged 70 years or older. Ann Intern Med. 2012;157(7):471-81.', doi: '10.7326/0003-4819-157-7-201210020-00003' },
    { texto: 'Kidney Disease: Improving Global Outcomes (KDIGO) CKD Work Group. KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117-S314.', doi: '10.1016/j.kint.2023.10.018' },
  ],
};
