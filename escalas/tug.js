import { REF_INGER_2022, SUG } from './_comun.js';

const B = {
  normal: { id: 'normal', rango: '<10 s', etiqueta: 'Normal', nivel: 'bien', texto: 'Movilidad básica dentro de lo esperado.', sugerencias: [] },
  leve: {
    id: 'leve', rango: '10 a 13 s', etiqueta: 'Discapacidad leve de la movilidad', nivel: 'moderado', hallazgo: true,
    texto: 'Tiempo compatible con alteración leve de la movilidad.',
    sugerencias: [SUG.caidas, 'Medir el desempeño físico completo (SPPB) para orientar la prescripción de ejercicio.'],
  },
  riesgo: {
    id: 'riesgo', rango: '>13 s', etiqueta: 'Riesgo elevado de caídas', nivel: 'grave', hallazgo: true,
    texto: 'Tiempo asociado con riesgo elevado de caídas.',
    sugerencias: [SUG.caidas, SUG.ejercicio, 'Valorar la necesidad de auxiliar de la marcha y la seguridad del entorno.'],
  },
  incapaz: {
    id: 'incapaz', rango: 'No puede', etiqueta: 'No puede realizar la prueba', nivel: 'critico', hallazgo: true,
    texto: 'No logra levantarse, caminar 3 m y volver a sentarse.',
    sugerencias: [SUG.caidas, SUG.rehabilitacion],
  },
};

export default {
  id: 'tug',
  nombre: 'Prueba cronometrada Levántate y Anda (Timed Up and Go)',
  corto: 'TUG',
  dominio: 'caidas',
  tipo: 'desempeno',
  aliases: ['timed up and go', 'levantate y anda', 'get up and go', 'marcha'],
  problemas: ['caídas', 'marcha', 'equilibrio', 'movilidad', 'fragilidad'],
  descripcion: 'Tiempo para levantarse de una silla, caminar 3 m, girar, regresar y sentarse.',
  objetivo: 'Evaluar la movilidad básica y orientar sobre trastornos de la marcha, el equilibrio y el riesgo de caídas.',
  poblacion: 'Personas mayores frágiles (Podsiadlo, 1991) y en la comunidad (Shumway-Cook, 2000).',
  aplicacion: [
    'Silla con respaldo y sin descansabrazos; marca una línea a 3 m.',
    'La persona inicia sentada con la espalda apoyada; usa su calzado y auxiliar de la marcha habituales.',
    'Indica: «Levántese, camine a paso normal hasta la línea, dé la vuelta, regrese y siéntese».',
    'El cronómetro inicia al levantarse y termina al sentarse. Permite un intento de práctica.',
  ],
  tiempo: '3 a 5 min',
  momentos: true,
  mayorEsMejor: false,
  barra: false,
  campos: [
    {
      id: 'estado', texto: '¿Realizó la prueba?', textoCorto: 'realización',
      opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No puede realizarla', valor: 0 }],
      puntua: false,
    },
    { id: 'tiempo', tipo: 'numero', texto: 'Tiempo', unidad: 's', min: 1, max: 300, decimales: 1, visibleSi: (r) => r.estado === 0 },
    {
      id: 'auxiliar', texto: 'Auxiliar de la marcha', textoCorto: 'auxiliar', opcional: true, puntua: false,
      visibleSi: (r) => r.estado === 0,
      opciones: [{ texto: 'Ninguno', valor: 0 }, { texto: 'Bastón', valor: 0 }, { texto: 'Andadera', valor: 0 }, { texto: 'Otro', valor: 0 }],
    },
  ],
  bandas: [B.normal, B.leve, B.riesgo, B.incapaz],
  calcular({ v }) {
    if (v.estado.valor === 0) return { banda: B.incapaz, mostrar: '—', sufijo: 'No puede' };
    const t = v.tiempo;
    const banda = t < 10 ? B.normal : t <= 13 ? B.leve : B.riesgo;
    const lineas = [];
    if (t >= 12 && t <= 13) lineas.push('La guía STEADI (CDC) considera ≥12 s como riesgo de caídas en adultos mayores de la comunidad.');
    if (t > 20) lineas.push('Más de 20 s: alto riesgo de caídas según Vivifrail (criterio para añadir el programa de prevención de caídas).');
    const auxiliar = v.auxiliar && v.auxiliar.texto !== 'Ninguno' ? v.auxiliar.texto.toLowerCase() : null;
    if (auxiliar) lineas.push(`Realizada con ${auxiliar}.`);
    return { valor: t, unidad: 's', mostrar: String(t), sufijo: 'segundos', banda, lineas, extras: { auxiliar } };
  },
  resumen(res) {
    if (res.banda.id === 'incapaz') return 'TUG: no puede realizar la prueba.';
    return `TUG: ${res.valor} s (${res.banda.etiqueta.toLowerCase()})${res.extras.auxiliar ? `, con ${res.extras.auxiliar}` : ''}.`;
  },
  resumenBreve(res) {
    return res.banda.id === 'incapaz' ? 'TUG: no puede realizarla' : `TUG ${res.valor} s (${res.banda.etiqueta.toLowerCase()})`;
  },
  detalleEnResumen: true,
  notas: [
    'Categorías de la guía del INGER (2022): normal <10 s, discapacidad leve de la movilidad 11–13 s, riesgo elevado de caídas >13 s; aquí los valores de 10 a 10.9 s se agrupan con la discapacidad leve.',
    'Otros puntos de corte: ≥12 s (STEADI, CDC), ≥13.5 s (Shumway-Cook, 2000) y >20 s (Vivifrail). El resultado depende de la silla, el calzado y la consigna.',
    'Observa además la calidad de la marcha: inestabilidad, base amplia, pasos cortos o uso de apoyos.',
  ],
  referencias: [
    { texto: 'Podsiadlo D, Richardson S. The timed "Up & Go": a test of basic functional mobility for frail elderly persons. J Am Geriatr Soc. 1991;39(2):142-8.', doi: '10.1111/j.1532-5415.1991.tb01616.x' },
    { texto: 'Shumway-Cook A, Brauer S, Woollacott M. Predicting the probability for falls in community-dwelling older adults using the Timed Up & Go Test. Phys Ther. 2000;80(9):896-903.' },
    { texto: 'Centers for Disease Control and Prevention. STEADI: Timed Up & Go (TUG).', enlace: 'https://www.cdc.gov/steadi/' },
    REF_INGER_2022,
  ],
};
