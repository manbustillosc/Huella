import { REF_INGER_2022, SUG } from './_comun.js';

// Clasificación de Huella: movilidad funcional según la guía del INGER (2022).
export function categoriaTug(seg) {
  if (seg < 10) return 'normal';
  if (seg <= 13) return 'leve';
  return 'riesgo';
}

const AISLADO = 'Un TUG aislado no establece el riesgo de caídas: intégralo con el antecedente de caídas, la marcha y el equilibrio, los fármacos, la hipotensión ortostática, la visión y el entorno.';

const B = {
  normal: {
    id: 'normal', rango: '<10 s', etiqueta: 'Normal', nivel: 'bien',
    texto: 'Movilidad funcional dentro de lo esperado (guía del INGER: <10 s).', sugerencias: [],
  },
  leve: {
    id: 'leve', rango: '10 a 13 s', etiqueta: 'Discapacidad leve de la movilidad', nivel: 'moderado', hallazgo: true,
    texto: 'Tiempo compatible con discapacidad leve de la movilidad (guía del INGER: 11–13 s; aquí se incluyen los valores de 10 a 10.9 s).',
    sugerencias: [SUG.caidas, 'Medir el desempeño físico completo (SPPB) para orientar la prescripción de ejercicio.'],
  },
  riesgo: {
    id: 'riesgo', rango: '>13 s', etiqueta: 'Riesgo elevado de caídas según el INGER', nivel: 'grave', hallazgo: true,
    texto: 'Más de 13 s: la guía del INGER lo asocia con riesgo elevado de caídas. Es un indicador de movilidad alterada, no un diagnóstico de riesgo de caídas.',
    sugerencias: [SUG.caidas, SUG.ejercicio, 'Valorar la necesidad de auxiliar de la marcha y la seguridad del entorno.'],
  },
  incapaz: {
    id: 'incapaz', rango: 'No puede', etiqueta: 'No puede realizar la prueba', nivel: 'critico', hallazgo: true,
    texto: 'No logra levantarse, caminar 3 m, girar y volver a sentarse, o la prueba se suspendió por seguridad.',
    sugerencias: [SUG.caidas, SUG.rehabilitacion],
  },
};

const si = (cond) => (cond ? 'Sí' : 'No');

export default {
  id: 'tug',
  nombre: 'Prueba cronometrada Levántate y Anda (Timed Up and Go)',
  corto: 'TUG',
  dominio: 'caidas',
  tipo: 'desempeno',
  aliases: ['timed up and go', 'levantate y anda', 'get up and go', 'marcha', 'STEADI'],
  problemas: ['caídas', 'marcha', 'equilibrio', 'movilidad', 'fragilidad'],
  descripcion: 'Tiempo para levantarse de una silla, caminar 3 m, girar, regresar y sentarse.',
  objetivo: 'Evaluar la movilidad funcional básica. Como parte de la valoración del riesgo de caídas, orienta sobre trastornos de la marcha y el equilibrio.',
  poblacion: 'Personas mayores frágiles (Podsiadlo, 1991) y en la comunidad (Shumway-Cook, 2000; STEADI, CDC).',
  aplicacion: [
    'Silla con respaldo y sin descansabrazos; marca una línea a 3 m.',
    'La persona inicia sentada con la espalda apoyada; usa su calzado y auxiliar de la marcha habituales.',
    'Indica: «Levántese, camine a paso normal hasta la línea, dé la vuelta, regrese y siéntese».',
    'El cronómetro inicia al levantarse y termina al sentarse. Permite un intento de práctica.',
  ],
  tiempo: '3 a 5 min',
  momentos: true,
  barra: false,
  direccionClinica: 'menor_mejor',
  unidadCambio: 's',
  decimalesCambio: 1,
  textoMejoria: 'mejoría del tiempo',
  textoEmpeoramiento: 'empeoramiento del tiempo',
  campos: [
    {
      id: 'estado', texto: '¿Realizó la prueba?', textoCorto: 'realización', puntua: false,
      opciones: [
        { texto: 'Sí', valor: 1 },
        { texto: 'No puede realizarla', valor: 0, clave: 'incapaz' },
        { texto: 'Se suspendió por seguridad', valor: 0, clave: 'seguridad' },
      ],
    },
    { id: 'tiempo', tipo: 'numero', texto: 'Tiempo', unidad: 's', min: 3, max: 300, decimales: 1, visibleSi: (r) => r.estado === 0 },
    {
      id: 'auxiliar', texto: 'Auxiliar de la marcha', textoCorto: 'auxiliar', opcional: true, puntua: false,
      visibleSi: (r) => r.estado === 0,
      opciones: [{ texto: 'Ninguno', valor: 0 }, { texto: 'Bastón', valor: 0 }, { texto: 'Andadera', valor: 0 }, { texto: 'Otro', valor: 0 }],
    },
  ],
  bandas: [B.normal, B.leve, B.riesgo, B.incapaz],
  calcular({ v }) {
    if (v.estado.valor === 0) {
      const seguridad = v.estado.clave === 'seguridad';
      return {
        banda: B.incapaz,
        mostrar: '—',
        sufijo: seguridad ? 'Suspendida por seguridad' : 'No puede',
        lineas: [seguridad ? 'La prueba se suspendió por seguridad.' : 'No puede realizar la prueba.', AISLADO],
        extras: { incapaz: true, seguridad },
      };
    }
    const t = v.tiempo;
    const banda = B[categoriaTug(t)];
    const auxiliar = v.auxiliar && v.auxiliar.texto !== 'Ninguno' ? v.auxiliar.texto.toLowerCase() : null;
    const lineas = [
      `Clasificación de Huella (movilidad funcional, guía del INGER): ${banda.etiqueta.replace(' según el INGER', '').toLowerCase()}.`,
      `Riesgo de caídas según STEADI (CDC): ${t >= 12 ? 'positivo (≥12 s)' : 'negativo (<12 s)'}.`,
      AISLADO,
    ];
    if (auxiliar) lineas.push(`Realizada con ${auxiliar}.`);
    return {
      valor: t,
      unidad: 's',
      mostrar: String(t),
      sufijo: 'segundos',
      banda,
      lineas,
      detalles: [{
        titulo: 'Puntos de corte según el objetivo',
        encabezados: ['Objetivo', 'Fuente y criterio', 'Este resultado'],
        filas: [
          ['Movilidad funcional (clasificación de Huella)', 'Guía del INGER 2022: <10 s normal; 11–13 s discapacidad leve; >13 s riesgo elevado de caídas', banda.etiqueta.replace(' según el INGER', '')],
          ['Riesgo de caídas en la comunidad', 'STEADI, CDC: ≥12 s', si(t >= 12)],
          ['Riesgo de caídas en la comunidad', 'Shumway-Cook, 2000: ≥13.5 s (30 participantes; sensibilidad y especificidad de 87 %)', si(t >= 13.5)],
          ['Riesgo elevado de caídas en fragilidad', 'Vivifrail: >20 s (10–20 s marcador de fragilidad)', si(t > 20)],
        ],
      }],
      extras: { auxiliar, segundos: t, steadi: t >= 12, mayor20: t > 20 },
    };
  },
  resumen(res) {
    if (res.extras.incapaz) return `TUG: ${res.extras.seguridad ? 'suspendida por seguridad' : 'no puede realizar la prueba'}.`;
    return `TUG: ${res.valor} s (${res.banda.etiqueta.toLowerCase()}; STEADI ${res.extras.steadi ? 'positivo' : 'negativo'})${res.extras.auxiliar ? `, con ${res.extras.auxiliar}` : ''}.`;
  },
  resumenBreve(res) {
    if (res.extras.incapaz) return `TUG ${res.extras.seguridad ? 'suspendida por seguridad' : 'no puede realizarla'}`;
    return `TUG ${res.valor} s (${res.banda.etiqueta.toLowerCase()})`;
  },
  detalleEnResumen: true,
  notas: [
    'Huella clasifica la movilidad funcional con la guía del INGER (2022): normal <10 s, discapacidad leve de la movilidad 11–13 s y riesgo elevado de caídas >13 s; los valores de 10 a 10.9 s se agrupan con la discapacidad leve.',
    'Riesgo de caídas: STEADI (CDC) considera en riesgo a quien tarda 12 s o más; Shumway-Cook (2000) propuso ≥13.5 s en adultos mayores de la comunidad; Vivifrail, >20 s como riesgo elevado en fragilidad.',
    'El TUG es un componente de la valoración del riesgo de caídas, no un diagnóstico. Su resultado depende de la silla, el calzado, el auxiliar y la consigna.',
    'Observa además la calidad de la marcha: inestabilidad, base amplia, pasos cortos o uso de apoyos.',
  ],
  referencias: [
    { texto: 'Podsiadlo D, Richardson S. The timed "Up & Go": a test of basic functional mobility for frail elderly persons. J Am Geriatr Soc. 1991;39(2):142-8.', doi: '10.1111/j.1532-5415.1991.tb01616.x' },
    { texto: 'Shumway-Cook A, Brauer S, Woollacott M. Predicting the probability for falls in community-dwelling older adults using the Timed Up & Go Test. Phys Ther. 2000;80(9):896-903.' },
    { texto: 'Centers for Disease Control and Prevention. STEADI — Older Adult Fall Prevention: Timed Up & Go (TUG).', enlace: 'https://www.cdc.gov/steadi/' },
    REF_INGER_2022,
    { texto: 'Izquierdo M, et al. Programa de ejercicio físico multicomponente Vivifrail. Erasmus+; 2017.', enlace: 'https://vivifrail.com' },
  ],
};
