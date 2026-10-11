import { REF_INGER_2022, SUG } from './_comun.js';

// Puntos por tiempo de marcha (mejor de dos intentos) y por levantarse 5 veces de la silla.
// Tablas de Guralnik (1994), la guía del INGER (2022) y Vivifrail; se comparan los tiempos sin redondear.
export function puntosMarcha(seg, distancia) {
  if (distancia === 3) return seg < 3.62 ? 4 : seg <= 4.65 ? 3 : seg <= 6.52 ? 2 : 1;
  return seg < 4.82 ? 4 : seg <= 6.20 ? 3 : seg <= 8.70 ? 2 : 1;
}
export function puntosSilla(seg) {
  if (seg <= 11.19) return 4;
  if (seg <= 13.69) return 3;
  if (seg <= 16.69) return 2;
  if (seg <= 60) return 1;
  return 0;
}
export function programaVivifrail(sppb) {
  if (sppb <= 3) return 'A';
  if (sppb <= 6) return 'B';
  if (sppb <= 9) return 'C';
  return 'D';
}

// Motivos por los que una prueba puntúa 0. «Sin dato» no es una opción: la prueba queda pendiente.
const NO_LOGRA = { motivo: 'intento' };
const SEGURIDAD = { motivo: 'seguridad' };
const REHUSA = { motivo: 'rehusa' };
const ceros = (intento) => [
  { texto: intento, valor: 0, ...NO_LOGRA },
  { texto: 'No se intentó por seguridad', valor: 0, ...SEGURIDAD },
  { texto: 'Se rehusó o no comprendió la instrucción', valor: 0, ...REHUSA },
];
const MOTIVO_TEXTO = { intento: 'lo intentó sin lograrlo', seguridad: 'no se intentó por seguridad', rehusa: 'se rehusó o no comprendió' };

const seg = (id, texto, extra = {}) => ({ id, tipo: 'numero', texto, unidad: 's', min: 0.5, max: 300, decimales: 2, ...extra });
const VELOCIDAD_MAXIMA = 2.5;

export default {
  id: 'sppb',
  nombre: 'Batería Corta de Desempeño Físico (SPPB)',
  corto: 'SPPB',
  dominio: 'fragilidad',
  tipo: 'desempeno',
  aliases: ['Guralnik', 'short physical performance battery', 'equilibrio', 'marcha', 'levantarse de la silla'],
  problemas: ['fragilidad', 'sarcopenia', 'caídas', 'movilidad', 'ejercicio', 'Vivifrail'],
  descripcion: 'Equilibrio, velocidad de marcha y levantarse de una silla: 3 pruebas de 0 a 4 puntos, total 0 a 12.',
  objetivo: 'Medir el desempeño físico de las extremidades inferiores y graduar la limitación funcional.',
  poblacion: 'Personas mayores en la comunidad (Guralnik, 1994); predice discapacidad, institucionalización y mortalidad. Base del programa Vivifrail.',
  aplicacion: [
    'Equilibrio: pies juntos, semitándem (talón a la altura del dedo gordo del otro pie) y tándem (talón contra la punta). Cada posición se sostiene 10 s; si no logra una, termina la prueba de equilibrio.',
    'Marcha: recorrido de 4 m (o 3 m) a paso habitual; registra el mejor de dos intentos.',
    'Silla: primero un intento de levantarse con los brazos cruzados; si lo logra, cronometra 5 levantadas lo más rápido posible.',
    'Puede usar su auxiliar de la marcha habitual en la marcha; no lo ayudes físicamente. Si una prueba no se intenta por seguridad, regístralo así: puntúa 0, como indica el protocolo.',
    'Si una prueba no se hizo por otro motivo (falta de espacio o de tiempo), déjala sin responder: el total no se calcula con datos incompletos.',
  ],
  tiempo: '10 min',
  momentos: true,
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor desempeño físico',
  textoEmpeoramiento: 'peor desempeño físico',
  cambioSustancial: { valor: 1, texto: '≥1 punto; Perera, 2006' },
  min: 0,
  max: 12,
  campos: [
    {
      id: 'eq_juntos', texto: 'Equilibrio: pies juntos, uno al lado del otro', textoCorto: 'pies juntos',
      opciones: [{ texto: 'Mantiene 10 s', valor: 1 }, ...ceros('Lo intentó, menos de 10 s')],
    },
    {
      id: 'eq_semi', texto: 'Equilibrio: semitándem', textoCorto: 'semitándem',
      visibleSi: (r) => r.eq_juntos === 0,
      opciones: [{ texto: 'Mantiene 10 s', valor: 1 }, ...ceros('Lo intentó, menos de 10 s')],
    },
    {
      id: 'eq_tandem', texto: 'Equilibrio: tándem', textoCorto: 'tándem',
      visibleSi: (r) => r.eq_juntos === 0 && r.eq_semi === 0,
      opciones: [
        { texto: '10 s o más', valor: 2 },
        { texto: 'De 3 a 9.99 s', valor: 1 },
        ...ceros('Lo intentó, menos de 3 s'),
      ],
    },
    {
      id: 'marcha_estado', texto: 'Marcha: ¿realizó la prueba?', textoCorto: 'marcha', puntua: false,
      opciones: [
        { texto: 'Recorrido de 4 m', valor: 4 },
        { texto: 'Recorrido de 3 m', valor: 3 },
        ...ceros('Lo intentó, pero no pudo completarla'),
      ],
    },
    seg('marcha_1', 'Marcha: primer intento', { visibleSi: (r) => r.marcha_estado === 0 || r.marcha_estado === 1 }),
    seg('marcha_2', 'Marcha: segundo intento (opcional)', { opcional: true, visibleSi: (r) => r.marcha_estado === 0 || r.marcha_estado === 1 }),
    {
      id: 'silla_pre', texto: 'Silla: ¿se levanta una vez con los brazos cruzados?', textoCorto: 'prueba previa de silla', puntua: false,
      opciones: [{ texto: 'Sí', valor: 1 }, ...ceros('Lo intentó, pero no pudo')],
    },
    {
      id: 'silla_estado', texto: 'Silla: ¿completó las 5 levantadas?', textoCorto: '5 levantadas', puntua: false,
      visibleSi: (r) => r.silla_pre === 0,
      opciones: [
        { texto: 'Sí', valor: 1 },
        { texto: 'No las completó', valor: 0, motivo: 'intento' },
        { texto: 'Se suspendió por seguridad', valor: 0, motivo: 'seguridad' },
      ],
    },
    seg('silla_t', 'Silla: tiempo para 5 levantadas', { min: 2, visibleSi: (r) => r.silla_pre === 0 && r.silla_estado === 0 }),
  ],
  validar({ v }) {
    const d = v.marcha_estado?.valor;
    if (!d || (d !== 3 && d !== 4)) return null;
    const errores = {};
    for (const id of ['marcha_1', 'marcha_2']) {
      if (v[id] != null && d / v[id] > VELOCIDAD_MAXIMA) errores[id] = `Tiempo improbable para marcha habitual en ${d} m (${(d / v[id]).toFixed(1)} m/s); revisa el registro.`;
    }
    return errores;
  },
  bandas: [
    { min: 0, max: 3, etiqueta: 'Limitación grave', nivel: 'critico', hallazgo: true, texto: 'Limitación grave del desempeño físico.' },
    { min: 4, max: 6, etiqueta: 'Limitación moderada', nivel: 'grave', hallazgo: true, texto: 'Limitación moderada del desempeño físico.' },
    { min: 7, max: 9, etiqueta: 'Limitación leve', nivel: 'moderado', hallazgo: true, texto: 'Limitación leve del desempeño físico.' },
    { min: 10, max: 12, etiqueta: 'Limitación mínima o sin limitación', nivel: 'bien', texto: 'Desempeño físico conservado.' },
  ].map((b) => ({
    ...b,
    sugerencias: b.min >= 10
      ? ['Mantener la actividad física; Vivifrail sugiere el programa D.']
      : [SUG.ejercicio, SUG.caidas, ...(b.max <= 6 ? [SUG.nutricion] : [])],
  })),
  calcular({ v }) {
    const noRealizadas = [];
    const anotar = (nombre, o) => { if (o?.motivo) noRealizadas.push(`${nombre}: ${MOTIVO_TEXTO[o.motivo]}`); };
    // Equilibrio: la prueba termina en la primera posición que no se logra.
    let eq = v.eq_juntos.valor;
    anotar('pies juntos', v.eq_juntos);
    if (eq === 1) {
      eq += v.eq_semi.valor;
      anotar('semitándem', v.eq_semi);
      if (v.eq_semi.valor === 1) {
        eq += v.eq_tandem.valor;
        anotar('tándem', v.eq_tandem);
      }
    }
    // Marcha
    let marcha = 0;
    let lineaMarcha;
    let velocidad = null;
    let mejor = null;
    let distanciaMarcha = null;
    if (v.marcha_estado.valor === 3 || v.marcha_estado.valor === 4) {
      distanciaMarcha = v.marcha_estado.valor;
      mejor = Math.min(...[v.marcha_1, v.marcha_2].filter((x) => x != null));
      marcha = puntosMarcha(mejor, distanciaMarcha);
      velocidad = distanciaMarcha / mejor;
      lineaMarcha = `Marcha ${distanciaMarcha} m: mejor tiempo ${mejor} s, ${velocidad.toFixed(2)} m/s (${marcha}).`;
    } else {
      anotar('marcha', v.marcha_estado);
      lineaMarcha = `Marcha: ${MOTIVO_TEXTO[v.marcha_estado.motivo]} (0).`;
    }
    // Silla
    let silla = 0;
    let lineaSilla;
    if (v.silla_pre.valor === 1) {
      if (v.silla_estado.valor === 0) {
        anotar('5 levantadas', v.silla_estado);
        lineaSilla = `Silla: ${v.silla_estado.motivo === 'seguridad' ? 'se suspendió por seguridad' : 'no completó las 5 levantadas'} (0).`;
      } else {
        silla = puntosSilla(v.silla_t);
        lineaSilla = `Silla: 5 levantadas en ${v.silla_t} s (${silla})${v.silla_t > 60 ? '; más de 60 s puntúa 0' : ''}.`;
      }
    } else {
      anotar('silla', v.silla_pre);
      lineaSilla = `Silla: ${MOTIVO_TEXTO[v.silla_pre.motivo]} (0).`;
    }
    const total = eq + marcha + silla;
    const prog = programaVivifrail(total);
    return {
      puntaje: total,
      extras: { eq, marcha, silla, velocidad, distanciaMarcha, tiempoMarcha: mejor, tiempoSilla: v.silla_pre.valor === 1 && v.silla_estado.valor === 1 ? v.silla_t : null, programa: prog, noRealizadas },
      lineas: [
        `Equilibrio ${eq}/4 · Marcha ${marcha}/4 · Silla ${silla}/4.`,
        lineaMarcha,
        lineaSilla,
        noRealizadas.length ? `Pruebas que puntuaron 0 sin completarse: ${noRealizadas.join('; ')}.` : null,
        total <= 8 ? 'SPPB ≤8: bajo desempeño físico según el EWGSOP2 (criterio de gravedad de la sarcopenia, no de diagnóstico).' : null,
        `Vivifrail: corresponde al programa ${prog === 'C' ? 'C (C1 o C2 según el tiempo que camina)' : prog}. Para afinarlo con el riesgo de caídas, usa la herramienta Vivifrail.`,
      ].filter(Boolean),
    };
  },
  resumen(res) {
    const { eq, marcha, silla, velocidad, noRealizadas } = res.extras;
    const nr = noRealizadas?.length ? `; sin completar: ${noRealizadas.join(', ')}` : '';
    return `SPPB: ${res.puntaje}/12 (${res.banda.etiqueta.toLowerCase()}); equilibrio ${eq}, marcha ${marcha}${velocidad ? ` (${velocidad.toFixed(2)} m/s)` : ''}, silla ${silla}${nr}.`;
  },
  resumenBreve(res) {
    return `SPPB ${res.puntaje}/12 (${res.banda.etiqueta.toLowerCase()})`;
  },
  detalleEnResumen: true,
  notas: [
    'Categorías de limitación usadas por Vivifrail: 0–3 grave, 4–6 moderada, 7–9 leve, 10–12 mínima.',
    'EWGSOP2: SPPB ≤8 indica bajo desempeño físico.',
    'Puntos por tiempo según Guralnik (1994), la guía del INGER (2022) y Vivifrail: marcha 4 m <4.82 s = 4; 4.82–6.20 = 3; 6.21–8.70 = 2; >8.70 = 1. Marcha 3 m <3.62 s = 4; 3.62–4.65 = 3; 4.66–6.52 = 2; >6.52 = 1. Silla ≤11.19 s = 4; 11.20–13.69 = 3; 13.70–16.69 = 2; 16.70–60 = 1; >60 s o incapaz = 0.',
    'Una prueba que no se intenta por seguridad, que se intenta sin lograrla o que la persona rehúsa puntúa 0, y se señala en el texto. Una prueba sin respuesta no se interpreta como 0: el total queda pendiente.',
    'Al comparar aplicaciones: un cambio de 1 punto o más es un cambio sustancial (Perera, 2006); el cambio pequeño (≈0.5 puntos) no es detectable en la práctica clínica.',
    'Las respuestas de posiciones de equilibrio que ya no corresponden (por ejemplo, el semitándem cuando no logró pies juntos) se ocultan y no se guardan.',
  ],
  referencias: [
    { texto: 'Guralnik JM, Simonsick EM, Ferrucci L, et al. A short physical performance battery assessing lower extremity function: association with self-reported disability and prediction of mortality and nursing home admission. J Gerontol. 1994;49(2):M85-94.', doi: '10.1093/geronj/49.2.m85' },
    { texto: 'Izquierdo M, Casas-Herrero A, Zambom-Ferraresi F, et al. Programa de ejercicio físico multicomponente Vivifrail. Erasmus+; 2017.', enlace: 'https://vivifrail.com' },
    { texto: 'Cruz-Jentoft AJ, Bahat G, Bauer J, et al. Sarcopenia: revised European consensus on definition and diagnosis (EWGSOP2). Age Ageing. 2019;48(1):16-31.', doi: '10.1093/ageing/afy169' },
    REF_INGER_2022,
    { texto: 'Perera S, Mody SH, Woodman RC, Studenski SA. Meaningful change and responsiveness in common physical performance measures in older adults. J Am Geriatr Soc. 2006;54(5):743-9.', doi: '10.1111/j.1532-5415.2006.00701.x' },
  ],
};
