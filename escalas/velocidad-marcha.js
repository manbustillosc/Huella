import { REF_INGER_2022, SUG } from './_comun.js';
import { mostrarSinCruzar } from '../js/motor.js';

// Clasificación con el valor sin redondear (guía del INGER, 2022): <1 m/s predice desenlaces adversos;
// <0.8 m/s disminución del desempeño como componente de la sarcopenia.
export function categoriaVelocidad(vm) {
  if (vm >= 1) return 'normal';
  if (vm >= 0.8) return 'riesgo';
  return 'bajo';
}
// Velocidad máxima plausible para marcha a paso habitual; por encima, el tiempo probablemente está mal capturado.
export const VELOCIDAD_MAXIMA = 2.5;

const B = {
  normal: {
    id: 'normal', rango: '≥1.0 m/s', etiqueta: 'Velocidad conservada', nivel: 'bien',
    texto: 'Velocidad de marcha de 1 m/s o más: sin criterio de riesgo por velocidad según la guía del INGER.', sugerencias: [],
  },
  riesgo: {
    id: 'riesgo', rango: '0.8 a <1.0 m/s', etiqueta: 'Velocidad disminuida', nivel: 'moderado', hallazgo: true,
    texto: 'Menos de 1 m/s: velocidad disminuida, que predice riesgo de desenlaces adversos (discapacidad, hospitalización, institucionalización, mortalidad).',
    sugerencias: [SUG.ejercicio, 'Caracterizar la fragilidad y el desempeño físico (SPPB, FRAIL o CFS).'],
  },
  bajo: {
    id: 'bajo', rango: '<0.8 m/s', etiqueta: 'Bajo desempeño físico', nivel: 'grave', hallazgo: true,
    texto: 'Menos de 0.8 m/s: bajo desempeño físico (guía del INGER; EWGSOP2 ≤0.8 m/s), además de riesgo de desenlaces adversos y de problemas de movilidad y caídas.',
    sugerencias: [SUG.caidas, SUG.ejercicio, 'Si hay sospecha de sarcopenia, medir la fuerza (prensión o levantarse 5 veces de la silla) y, si está baja, la masa muscular.'],
  },
};

export default {
  id: 'velocidad',
  nombre: 'Velocidad de la marcha',
  corto: 'Velocidad de marcha',
  dominio: 'caidas',
  tipo: 'desempeno',
  aliases: ['gait speed', 'marcha 4 metros', 'marcha 6 metros', 'm/s'],
  problemas: ['fragilidad', 'sarcopenia', 'caídas', 'movilidad'],
  descripcion: 'Tiempo para recorrer 4 o 6 m a paso habitual, convertido a metros por segundo.',
  objetivo: 'Medir la velocidad de marcha habitual como marcador de desempeño físico, fragilidad y riesgo de desenlaces adversos.',
  poblacion: 'Personas mayores en la comunidad y en consulta. Recorrido de 4 m en la guía del INGER (2022) y el EWGSOP2; de 6 m en Vivifrail.',
  aplicacion: [
    'Marca el recorrido (4 m, o 6 m como propone Vivifrail) con espacio para acelerar y desacelerar fuera de las marcas.',
    'Pide caminar a su paso habitual; usa su auxiliar de la marcha si lo necesita.',
    'Cronometra desde que cruza la marca de inicio hasta la de fin. Puedes registrar el mejor de dos intentos.',
  ],
  tiempo: '2 a 3 min',
  momentos: true,
  barra: false,
  direccionClinica: 'mayor_mejor',
  unidadCambio: 'm/s',
  decimalesCambio: 2,
  textoMejoria: 'mayor velocidad de marcha',
  textoEmpeoramiento: 'menor velocidad de marcha',
  cambioMinimo: { valor: 0.05, texto: '≈0.05 m/s; Perera, 2006' },
  cambioSustancial: { valor: 0.1, texto: '≥0.10 m/s; Perera, 2006' },
  comparable(antes, despues) {
    const a = antes.extras?.distancia;
    const b = despues.extras?.distancia;
    return a && b && a !== b ? { advertencia: `Recorridos distintos (${a} m y ${b} m): compara con cautela.` } : null;
  },
  cambioExtra(antes, despues, { dif }) {
    return dif < -0.15 ? ['Vivifrail considera que un deterioro mayor de 0.15 m/s en un año predice caídas; toma en cuenta el intervalo entre mediciones.'] : [];
  },
  vinculos: [
    {
      id: 'sppb', escala: 'sppb', titulo: 'Marcha del SPPB',
      disponible: (res) => (res.extras?.distanciaMarcha === 4 && res.extras?.tiempoMarcha ? true : res.extras?.distanciaMarcha === 3 ? 'El SPPB se hizo con 3 m; este instrumento usa 4 o 6 m.' : 'El SPPB no tiene un tiempo de marcha registrado.'),
      describir: (res) => `Marcha de 4 m en ${res.extras.tiempoMarcha} s (mejor intento del SPPB)`,
      aplicar: (res) => ({ distancia: 0, tiempo: String(res.extras.tiempoMarcha) }),
      campos: ['distancia', 'tiempo'],
    },
  ],
  campos: [
    {
      id: 'distancia', texto: 'Distancia recorrida', textoCorto: 'distancia', puntua: false,
      opciones: [{ texto: '4 metros', valor: 4 }, { texto: '6 metros', valor: 6 }],
    },
    { id: 'tiempo', tipo: 'numero', texto: 'Tiempo', unidad: 's', min: 0.5, max: 300, decimales: 2 },
  ],
  validar({ v }) {
    if (!v.distancia || v.tiempo == null) return null;
    const vm = v.distancia.valor / v.tiempo;
    return vm > VELOCIDAD_MAXIMA ? { tiempo: `Tiempo improbable para marcha habitual (${vm.toFixed(1)} m/s); revisa el registro.` } : null;
  },
  bandas: [B.normal, B.riesgo, B.bajo],
  calcular({ v }) {
    const d = v.distancia.valor;
    const vm = d / v.tiempo;
    const id = categoriaVelocidad(vm);
    const mostrar = mostrarSinCruzar(vm, 2, categoriaVelocidad);
    const lineas = [`Recorrido de ${d} m en ${v.tiempo} s: ${mostrar} m/s.`];
    if (vm <= 0.8) lineas.push('EWGSOP2: ≤0.8 m/s indica bajo desempeño físico. Por sí sola no diagnostica sarcopenia: se requiere fuerza muscular baja y confirmar masa muscular baja; el bajo desempeño gradúa la gravedad.');
    if (d === 6) lineas.push('Vivifrail (6 m): >1 m/s sin limitación; 0.8–1 m/s marcador de fragilidad; <0.8 m/s predice problemas de movilidad y caídas; <0.6 m/s, además, eventos adversos.');
    if (d === 4) lineas.push('El criterio de riesgo de caídas de Vivifrail se definió con el recorrido de 6 m.');
    return { valor: vm, unidad: 'm/s', mostrar, sufijo: 'm/s', banda: B[id], lineas, extras: { distancia: d, tiempo: v.tiempo, velocidad: vm } };
  },
  resumen(res) {
    return `Velocidad de marcha: ${res.mostrar} m/s en ${res.extras.distancia} m (${res.banda.etiqueta.toLowerCase()}).`;
  },
  resumenBreve(res) {
    return `velocidad de marcha ${res.mostrar} m/s en ${res.extras.distancia} m (${res.banda.etiqueta.toLowerCase()})`;
  },
  detalleEnResumen: true,
  notas: [
    'Clasificación de Huella con la guía del INGER (2022): <1 m/s predice desenlaces adversos; <0.8 m/s indica disminución del desempeño como componente de la sarcopenia. Se clasifica con el valor sin redondear y se redondea solo para mostrarlo.',
    'EWGSOP2 (2019): ≤0.8 m/s es bajo desempeño físico y gradúa la gravedad de la sarcopenia; no basta para diagnosticarla, que requiere fuerza baja confirmada con masa muscular baja.',
    'Vivifrail (6 m): >1 m/s sin limitación; 0.8–1 m/s marcador de fragilidad; <0.8 m/s predice problemas de movilidad y caídas. Un deterioro anual mayor de 0.15 m/s también predice caídas.',
    'Al comparar aplicaciones, un cambio menor de 0.05 m/s no se califica (cambio pequeño con significado clínico ≈0.05 m/s; sustancial ≈0.10 m/s; Perera, 2006).',
  ],
  referencias: [
    REF_INGER_2022,
    { texto: 'Cruz-Jentoft AJ, Bahat G, Bauer J, et al. Sarcopenia: revised European consensus on definition and diagnosis (EWGSOP2). Age Ageing. 2019;48(1):16-31.', doi: '10.1093/ageing/afy169' },
    { texto: 'Izquierdo M, et al. Programa de ejercicio físico multicomponente Vivifrail. Erasmus+; 2017.', enlace: 'https://vivifrail.com' },
    { texto: 'Perera S, Mody SH, Woodman RC, Studenski SA. Meaningful change and responsiveness in common physical performance measures in older adults. J Am Geriatr Soc. 2006;54(5):743-9.', doi: '10.1111/j.1532-5415.2006.00701.x' },
  ],
};
