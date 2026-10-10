import { REF_INGER_2022, SUG } from './_comun.js';

const B = {
  normal: { id: 'normal', rango: '≥1.0 m/s', etiqueta: 'Velocidad conservada', nivel: 'bien', texto: 'Velocidad de marcha de 1 m/s o más.', sugerencias: [] },
  riesgo: {
    id: 'riesgo', rango: '0.8 a 0.99 m/s', etiqueta: 'Riesgo de desenlaces adversos', nivel: 'moderado', hallazgo: true,
    texto: 'Menos de 1 m/s: predice riesgo de desenlaces adversos (discapacidad, hospitalización, mortalidad).',
    sugerencias: [SUG.ejercicio, 'Completar con SPPB o FRAIL para caracterizar la fragilidad.'],
  },
  bajo: {
    id: 'bajo', rango: '<0.8 m/s', etiqueta: 'Bajo desempeño físico', nivel: 'grave', hallazgo: true,
    texto: 'Menos de 0.8 m/s: bajo desempeño físico, componente de la sarcopenia grave (EWGSOP2) y predictor de problemas de movilidad y caídas.',
    sugerencias: [SUG.caidas, SUG.ejercicio, 'Si hay sospecha de sarcopenia, medir fuerza de prensión y masa muscular.'],
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
  objetivo: 'Medir la velocidad de marcha habitual como marcador de fragilidad, sarcopenia y riesgo de desenlaces adversos.',
  poblacion: 'Personas mayores en la comunidad y en consulta (guía del INGER, 2022; EWGSOP2).',
  aplicacion: [
    'Marca el recorrido (4 m, o 6 m como propone Vivifrail) con espacio para acelerar y desacelerar fuera de las marcas.',
    'Pide caminar a su paso habitual; usa su auxiliar de la marcha si lo necesita.',
    'Cronometra desde que cruza la marca de inicio hasta la de fin. Puedes registrar el mejor de dos intentos.',
  ],
  tiempo: '2 a 3 min',
  momentos: true,
  barra: false,
  campos: [
    {
      id: 'distancia', texto: 'Distancia recorrida', textoCorto: 'distancia', puntua: false,
      opciones: [{ texto: '4 metros', valor: 4 }, { texto: '6 metros', valor: 6 }],
    },
    { id: 'tiempo', tipo: 'numero', texto: 'Tiempo', unidad: 's', min: 0.5, max: 300, decimales: 2 },
  ],
  bandas: [B.normal, B.riesgo, B.bajo],
  calcular({ v }) {
    const d = v.distancia.valor;
    const vm = d / v.tiempo;
    const redondeada = Math.round(vm * 100) / 100;
    const banda = redondeada >= 1 ? B.normal : redondeada >= 0.8 ? B.riesgo : B.bajo;
    return { valor: redondeada, unidad: 'm/s', mostrar: redondeada.toFixed(2), sufijo: 'm/s', banda, lineas: [`${d} m en ${v.tiempo} s.`] };
  },
  resumen(res) {
    return `Velocidad de marcha: ${res.mostrar} m/s (${res.banda.etiqueta.toLowerCase()}; ${res.lineas[0].replace(/\.$/, '')}).`;
  },
  resumenBreve(res) {
    return `velocidad de marcha ${res.mostrar} m/s (${res.banda.etiqueta.toLowerCase()})`;
  },
  detalleEnResumen: true,
  notas: [
    'Puntos de corte de la guía del INGER (2022): <1 m/s predice desenlaces adversos; <0.8 m/s indica disminución del desempeño (sarcopenia). El EWGSOP2 usa ≤0.8 m/s.',
    'Vivifrail (6 m): >1 m/s sin limitación; 0.8–1 m/s marcador de fragilidad; <0.8 m/s predice problemas de movilidad y caídas.',
    'Una disminución anual mayor de 0.15 m/s también predice caídas (Vivifrail).',
  ],
  referencias: [
    REF_INGER_2022,
    { texto: 'Cruz-Jentoft AJ, Bahat G, Bauer J, et al. Sarcopenia: revised European consensus on definition and diagnosis (EWGSOP2). Age Ageing. 2019;48(1):16-31.', doi: '10.1093/ageing/afy169' },
    { texto: 'Izquierdo M, et al. Programa de ejercicio físico multicomponente Vivifrail. Erasmus+; 2017.', enlace: 'https://vivifrail.com' },
  ],
};
