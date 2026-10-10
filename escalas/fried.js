// Fenotipo de fragilidad de Fried (Cardiovascular Health Study, 2001). Con componentes sin dato no se simula
// la clasificación: solo se asigna si es la misma con cualquier valor de los componentes faltantes.
import { SUG } from './_comun.js';
import { fmt, mostrarSinCruzar } from '../js/motor.js';

const FRECUENCIA_CESD = [
  { texto: 'Rara vez o nunca (menos de 1 día)', valor: 0 },
  { texto: 'Algunas veces (1 a 2 días)', valor: 1 },
  { texto: 'Una cantidad moderada de tiempo (3 a 4 días)', valor: 2 },
  { texto: 'La mayor parte del tiempo (5 a 7 días)', valor: 3 },
  { texto: 'No se pudo preguntar', valor: null, especial: true, clave: 'sin' },
];
const SINO_SABE = (si) => [
  { texto: si, valor: 1, clave: 'si' },
  { texto: 'No', valor: 0, clave: 'no' },
  { texto: 'No se sabe', valor: null, clave: 'sin' },
];

// Puntos de corte de fuerza de prensión (kg) por sexo e índice de masa corporal (Fried, 2001).
export function corteFuerza(mujer, imc) {
  if (mujer) return imc <= 23 ? { corte: 17, estrato: 'IMC ≤23' } : imc <= 26 ? { corte: 17.3, estrato: 'IMC 23.1–26' } : imc <= 29 ? { corte: 18, estrato: 'IMC 26.1–29' } : { corte: 21, estrato: 'IMC >29' };
  return imc <= 24 ? { corte: 29, estrato: 'IMC ≤24' } : imc <= 26 ? { corte: 30, estrato: 'IMC 24.1–26' } : imc <= 28 ? { corte: 30, estrato: 'IMC 26.1–28' } : { corte: 32, estrato: 'IMC >28' };
}
// Tiempo en 15 pies (4.57 m) a paso habitual: lentitud si es igual o mayor que el corte (Fried, 2001).
export function corteMarcha(mujer, talla) {
  if (mujer) return talla <= 159 ? { corte: 7, estrato: 'talla ≤159 cm' } : { corte: 6, estrato: 'talla >159 cm' };
  return talla <= 173 ? { corte: 7, estrato: 'talla ≤173 cm' } : { corte: 6, estrato: 'talla >173 cm' };
}

const NOMBRES = { peso: 'pérdida de peso', agotamiento: 'agotamiento', debilidad: 'debilidad', lentitud: 'lentitud', actividad: 'baja actividad física' };

const SUG_FRAGIL = [
  'Valoración geriátrica integral: buscar causas tratables (desnutrición, depresión, enfermedad crónica descompensada, polifarmacia).',
  SUG.ejercicio,
  SUG.nutricion,
  SUG.revisionFarmacos,
];

const BANDAS = [
  { id: 'robusto', min: 0, max: 0, rango: '0 componentes', etiqueta: 'Robusto', nivel: 'bien', texto: 'Ningún componente del fenotipo: no frágil.', sugerencias: [] },
  {
    id: 'prefragil', min: 1, max: 2, rango: '1 o 2', etiqueta: 'Prefrágil', nivel: 'moderado', hallazgo: true,
    texto: 'Uno o dos componentes: prefragilidad, con mayor riesgo de progresar a fragilidad.',
    sugerencias: [SUG.ejercicio, SUG.nutricion, 'Repetir el fenotipo para seguir la evolución.'],
  },
  {
    id: 'fragil', min: 3, max: 5, rango: '3 a 5', etiqueta: 'Frágil', nivel: 'grave', hallazgo: true,
    texto: 'Tres o más componentes: fragilidad física según el fenotipo de Fried; se asoció con caídas, discapacidad, hospitalización y muerte en el seguimiento.',
    sugerencias: SUG_FRAGIL,
  },
  {
    id: 'incompleto', rango: 'Componentes sin dato', etiqueta: 'Clasificación no determinable', nivel: 'neutro',
    texto: 'Faltan componentes y la clasificación depende de ellos: Huella no la estima. Completa los componentes faltantes con el método original.',
    sugerencias: [],
  },
];
const banda = (id) => BANDAS.find((b) => b.id === id);
const clasificacion = (n) => (n >= 3 ? 'frágil' : n >= 1 ? 'prefrágil' : 'robusto');

export default {
  id: 'fried',
  nombre: 'Fenotipo de fragilidad de Fried',
  corto: 'Fried',
  dominio: 'fragilidad',
  tipo: 'evaluacion',
  aliases: ['fenotipo de fragilidad', 'Cardiovascular Health Study', 'CHS', 'fragilidad fisica', 'prefragilidad'],
  problemas: ['fragilidad', 'debilidad', 'pérdida de peso', 'lentitud', 'cansancio'],
  descripcion: 'Cinco componentes medidos (pérdida de peso, agotamiento, debilidad, lentitud y baja actividad): robusto, prefrágil o frágil.',
  objetivo: 'Identificar fragilidad física con los criterios operativos del Cardiovascular Health Study.',
  poblacion: 'Personas de 65 años o más que viven en la comunidad (Fried, 2001). Excluye, por diseño, a personas con Parkinson, evento vascular cerebral reciente, deterioro cognitivo grave o en tratamiento con antidepresivos.',
  aplicacion: [
    'Registra cada componente con el método original: dinamómetro para la fuerza, cronómetro en 15 pies (4.57 m) a paso habitual y cuestionario de Minnesota para la actividad.',
    'Si un componente no se midió, márcalo así: Huella solo clasifica cuando el resultado no depende de él.',
    'Los puntos de corte de fuerza dependen del sexo y del IMC, y los de marcha del sexo y la talla; Huella los aplica.',
  ],
  tiempo: '10 a 15 min',
  direccionClinica: 'menor_mejor',
  unidadCambio: ['componente', 'componentes'],
  textoMejoria: 'menos componentes de fragilidad',
  textoEmpeoramiento: 'más componentes de fragilidad',
  barra: false,
  min: 0,
  max: 5,
  campos: [
    { id: 'sexo', texto: 'Sexo', textoCorto: 'sexo', puntua: false, prefill: 'sexo', opciones: [{ texto: 'Mujer', valor: 1, clave: 'mujer' }, { texto: 'Hombre', valor: 0, clave: 'hombre' }] },
    {
      id: 'peso', texto: '1. Pérdida de peso no intencional en el último año', textoCorto: 'pérdida de peso', puntua: false,
      ayuda: 'Más de 4.5 kg (10 libras) referidos, o 5 % o más del peso medido en el seguimiento.',
      opciones: SINO_SABE('Sí: más de 4.5 kg o 5 % o más'),
    },
    {
      id: 'esfuerzo', texto: '2a. Durante la última semana, ¿con qué frecuencia sintió que todo lo que hacía era un esfuerzo?', textoCorto: 'todo era un esfuerzo', puntua: false,
      opciones: FRECUENCIA_CESD,
    },
    {
      id: 'arrancar', texto: '2b. Durante la última semana, ¿con qué frecuencia sintió que no podía ponerse en marcha?', textoCorto: 'no podía ponerse en marcha', puntua: false,
      opciones: FRECUENCIA_CESD,
    },
    {
      id: 'fuerza_estado', texto: '3. Fuerza de prensión', textoCorto: 'fuerza de prensión', puntua: false,
      opciones: [{ texto: 'Medida con dinamómetro', valor: 1, clave: 'si' }, { texto: 'No medida', valor: null, clave: 'sin' }],
    },
    { id: 'fuerza', tipo: 'numero', texto: 'Fuerza de prensión, mano dominante', unidad: 'kg', min: 0, max: 100, decimales: 1, visibleSi: (r) => r.fuerza_estado === 0 },
    { id: 'peso_kg', tipo: 'numero', texto: 'Peso actual (para el IMC)', unidad: 'kg', min: 20, max: 300, decimales: 1, visibleSi: (r) => r.fuerza_estado === 0 },
    {
      id: 'marcha_estado', texto: '4. Tiempo de marcha en 15 pies (4.57 m) a paso habitual', textoCorto: 'marcha', puntua: false,
      ayuda: 'Se permiten auxiliares de la marcha. Otra distancia (4 o 6 m) no es el método de Fried: márcala como no medida.',
      opciones: [{ texto: 'Medida en 4.57 m', valor: 1, clave: 'si' }, { texto: 'No medida', valor: null, clave: 'sin' }],
    },
    { id: 'tiempo', tipo: 'numero', texto: 'Tiempo en 4.57 m', unidad: 's', min: 1, max: 120, decimales: 2, visibleSi: (r) => r.marcha_estado === 0 },
    { id: 'talla', tipo: 'numero', texto: 'Talla', unidad: 'cm', min: 100, max: 220, decimales: 0, visibleSi: (r) => r.fuerza_estado === 0 || r.marcha_estado === 0 },
    {
      id: 'actividad', texto: '5. Gasto energético en actividad física (cuestionario de Minnesota, versión breve)', textoCorto: 'actividad física', puntua: false,
      ayuda: 'Bajo: menos de 383 kcal por semana en hombres o menos de 270 kcal por semana en mujeres.',
      opciones: [
        { texto: 'Bajo', valor: 1, clave: 'si' },
        { texto: 'No bajo', valor: 0, clave: 'no' },
        { texto: 'No medido', valor: null, clave: 'sin' },
      ],
    },
  ],
  bandas: BANDAS,
  calcular({ v }) {
    const mujer = v.sexo.valor === 1;
    const comp = {};
    const detalle = [];
    comp.peso = v.peso.valor == null ? null : v.peso.valor === 1;
    detalle.push(`Pérdida de peso: ${comp.peso == null ? 'sin dato' : comp.peso ? 'presente' : 'ausente'}.`);
    const cesd = [v.esfuerzo.valor, v.arrancar.valor];
    if (cesd.some((x) => x != null && x >= 2)) comp.agotamiento = true;
    else if (cesd.every((x) => x != null)) comp.agotamiento = false;
    else comp.agotamiento = null;
    detalle.push(`Agotamiento: ${comp.agotamiento == null ? 'sin dato completo' : comp.agotamiento ? 'presente (3 o más días en al menos una pregunta)' : 'ausente'}.`);
    if (v.fuerza_estado.valor == null) {
      comp.debilidad = null;
      detalle.push('Debilidad: no medida.');
    } else {
      const imc = v.peso_kg / (v.talla / 100) ** 2;
      const { corte, estrato } = corteFuerza(mujer, imc);
      comp.debilidad = v.fuerza <= corte;
      detalle.push(`Debilidad: ${fmt(v.fuerza)} kg; corte ≤${fmt(corte)} kg (${mujer ? 'mujer' : 'hombre'}, ${estrato}; IMC ${mostrarSinCruzar(imc, 1, (x) => corteFuerza(mujer, x).estrato)}): ${comp.debilidad ? 'presente' : 'ausente'}.`);
    }
    if (v.marcha_estado.valor == null) {
      comp.lentitud = null;
      detalle.push('Lentitud: no medida.');
    } else {
      const { corte, estrato } = corteMarcha(mujer, v.talla);
      comp.lentitud = v.tiempo >= corte;
      detalle.push(`Lentitud: ${fmt(v.tiempo, 2)} s en 4.57 m; corte ≥${corte} s (${mujer ? 'mujer' : 'hombre'}, ${estrato}): ${comp.lentitud ? 'presente' : 'ausente'}.`);
    }
    comp.actividad = v.actividad.valor == null ? null : v.actividad.valor === 1;
    detalle.push(`Baja actividad física: ${comp.actividad == null ? 'no medida' : comp.actividad ? 'presente' : 'ausente'}.`);

    const ids = Object.keys(NOMBRES);
    const presentes = ids.filter((k) => comp[k] === true);
    const sinDato = ids.filter((k) => comp[k] == null);
    const p = presentes.length;
    const u = sinDato.length;
    let b;
    if (p >= 3) b = banda('fragil');
    else if (!u) b = banda(p === 0 ? 'robusto' : 'prefragil');
    else if (p >= 1 && p + u <= 2) b = banda('prefragil');
    else b = banda('incompleto');
    const lineas = [`${p} de 5 componentes presentes${u ? `; ${u} sin dato (${sinDato.map((k) => NOMBRES[k]).join(', ')})` : ''}.`, ...detalle];
    if (b.id === 'incompleto') lineas.splice(1, 0, `Con los componentes sin dato la clasificación podría ir de «${clasificacion(p)}» a «${clasificacion(p + u)}».`);
    else if (u) lineas.splice(1, 0, 'La clasificación no cambia con ningún valor de los componentes sin dato.');
    return {
      banda: b,
      puntaje: b.id === 'incompleto' ? null : p,
      valor: null,
      max: 5,
      mostrar: b.id === 'incompleto' ? `${p}+?` : String(p),
      sufijo: '/ 5 componentes',
      lineas,
      lineasNota: lineas,
      extras: { componentes: comp, presentes, sinDato },
    };
  },
  resumen(res) {
    const e = res.extras;
    const pres = e.presentes.length ? ` (${e.presentes.map((k) => NOMBRES[k]).join(', ')})` : '';
    const falta = e.sinDato.length ? `; sin dato: ${e.sinDato.map((k) => NOMBRES[k]).join(', ')}` : '';
    return `Fenotipo de Fried: ${res.banda.etiqueta.toLowerCase()}, ${e.presentes.length} de 5 componentes${pres}${falta}.`;
  },
  resumenBreve(res) {
    return `Fried ${res.banda.id === 'incompleto' ? `${res.extras.presentes.length} de 5 con componentes sin dato (no clasificable)` : `${res.puntaje}/5 (${res.banda.etiqueta.toLowerCase()})`}`;
  },
  detalleEnResumen: true,
  comparable(antes, despues) {
    const a = antes.extras?.sinDato?.length ?? 0;
    const d = despues.extras?.sinDato?.length ?? 0;
    if (a || d) return { noInterpretable: 'uno de los resultados tiene componentes sin dato' };
    return null;
  },
  siguientes: [
    { id: 'sppb', si: (res) => !res.noEvaluable && ['fragil', 'prefragil'].includes(res.banda?.id), motivo: 'Desempeño físico para orientar el programa de ejercicio (Vivifrail).' },
    { id: 'mnasf', si: (res) => !res.noEvaluable && Boolean(res.extras?.componentes?.peso), motivo: 'Pérdida de peso: tamizaje nutricional.' },
  ],
  notas: [
    'Criterios operativos del Cardiovascular Health Study (Fried, 2001). Los puntos de corte de fuerza y marcha son los del quintil más bajo de esa cohorte; en otras poblaciones pueden no ser equivalentes.',
    'No se simulan componentes: otra distancia de marcha, autorreporte de debilidad o versiones modificadas de actividad física no son el fenotipo original.',
    'Con componentes sin dato, la clasificación solo se asigna si no puede cambiar; si puede, queda como no determinable.',
    'Fried (2001) no define cómo puntuar la incapacidad para hacer la prueba de marcha o de fuerza; Huella la deja sin dato.',
    'Es un fenotipo físico: no evalúa cognición, ánimo ni red social, y no sustituye la valoración geriátrica integral.',
  ],
  referencias: [
    { texto: 'Fried LP, Tangen CM, Walston J, et al. Frailty in older adults: evidence for a phenotype. J Gerontol A Biol Sci Med Sci. 2001;56(3):M146-56.', doi: '10.1093/gerona/56.3.m146' },
    { texto: 'Radloff LS. The CES-D Scale: a self-report depression scale for research in the general population. Appl Psychol Meas. 1977;1(3):385-401.', doi: '10.1177/014662167700100306' },
    { texto: 'Taylor HL, Jacobs DR Jr, Schucker B, et al. A questionnaire for the assessment of leisure time physical activities. J Chronic Dis. 1978;31(12):741-55.', doi: '10.1016/0021-9681(78)90058-9' },
  ],
};
