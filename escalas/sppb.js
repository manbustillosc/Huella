import { REF_INGER_2022, SUG } from './_comun.js';

// Puntos por tiempo de marcha (mejor de dos intentos) y por levantarse 5 veces de la silla.
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

const seg = (id, texto, extra = {}) => ({ id, tipo: 'numero', texto, unidad: 's', min: 0.5, max: 300, decimales: 2, ...extra });

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
    'Equilibrio: pies juntos, semitándem (talón a la altura del dedo gordo del otro pie) y tándem (talón contra la punta). Cada posición se sostiene 10 s; si falla una, termina la prueba de equilibrio.',
    'Marcha: recorrido de 4 m (o 3 m) a paso habitual; registra el mejor de dos intentos.',
    'Silla: primero un intento de levantarse con los brazos cruzados; si lo logra, cronometra 5 levantadas lo más rápido posible.',
    'Puede usar su auxiliar de la marcha habitual; no lo ayudes físicamente.',
  ],
  tiempo: '10 min',
  momentos: true,
  min: 0,
  max: 12,
  campos: [
    {
      id: 'eq_juntos', texto: 'Equilibrio: pies juntos, uno al lado del otro', textoCorto: 'pies juntos',
      opciones: [
        { texto: 'Mantiene 10 s', valor: 1 },
        { texto: 'Menos de 10 s, no lo intenta o se rehúsa', valor: 0 },
      ],
    },
    {
      id: 'eq_semi', texto: 'Equilibrio: semitándem', textoCorto: 'semitándem',
      visibleSi: (r) => r.eq_juntos === 0,
      opciones: [
        { texto: 'Mantiene 10 s', valor: 1 },
        { texto: 'Menos de 10 s, no lo intenta o se rehúsa', valor: 0 },
      ],
    },
    {
      id: 'eq_tandem', texto: 'Equilibrio: tándem', textoCorto: 'tándem',
      visibleSi: (r) => r.eq_juntos === 0 && r.eq_semi === 0,
      opciones: [
        { texto: '10 s o más', valor: 2 },
        { texto: 'De 3 a 9.99 s', valor: 1 },
        { texto: 'Menos de 3 s o no lo intenta', valor: 0 },
      ],
    },
    {
      id: 'marcha_estado', texto: 'Marcha: ¿realizó la prueba?', textoCorto: 'marcha',
      opciones: [
        { texto: 'Recorrido de 4 m', valor: 4, puntos: null },
        { texto: 'Recorrido de 3 m', valor: 3, puntos: null },
        { texto: 'Incapaz o se rehúsa', valor: 0, puntos: 0 },
      ],
      puntua: false,
    },
    seg('marcha_1', 'Marcha: primer intento', { visibleSi: (r) => r.marcha_estado === 0 || r.marcha_estado === 1 }),
    seg('marcha_2', 'Marcha: segundo intento (opcional)', { opcional: true, visibleSi: (r) => r.marcha_estado === 0 || r.marcha_estado === 1 }),
    {
      id: 'silla_pre', texto: 'Silla: ¿se levanta una vez con los brazos cruzados?', textoCorto: 'prueba previa de silla',
      opciones: [
        { texto: 'Sí', valor: 1 },
        { texto: 'No, o se rehúsa', valor: 0 },
      ],
      puntua: false,
    },
    {
      id: 'silla_estado', texto: 'Silla: ¿completó las 5 levantadas?', textoCorto: '5 levantadas',
      visibleSi: (r) => r.silla_pre === 0,
      opciones: [
        { texto: 'Sí', valor: 1 },
        { texto: 'No las completó', valor: 0 },
      ],
      puntua: false,
    },
    seg('silla_t', 'Silla: tiempo para 5 levantadas', { visibleSi: (r) => r.silla_pre === 0 && r.silla_estado === 0 }),
  ],
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
    // Equilibrio
    let eq = v.eq_juntos.valor;
    if (eq === 1) {
      eq += v.eq_semi.valor;
      if (v.eq_semi.valor === 1) eq += v.eq_tandem.valor;
    }
    // Marcha
    let marcha = 0;
    let lineaMarcha = 'Marcha: incapaz o se rehúsa (0).';
    let velocidad = null;
    if (v.marcha_estado.valor !== 0) {
      const d = v.marcha_estado.valor;
      const mejor = Math.min(...[v.marcha_1, v.marcha_2].filter((x) => x != null));
      marcha = puntosMarcha(mejor, d);
      velocidad = d / mejor;
      lineaMarcha = `Marcha ${d} m: mejor tiempo ${mejor} s, ${velocidad.toFixed(2)} m/s (${marcha}).`;
    }
    // Silla
    let silla = 0;
    let lineaSilla = 'Silla: no logra levantarse con los brazos cruzados (0).';
    if (v.silla_pre.valor === 1) {
      if (v.silla_estado.valor === 0) lineaSilla = 'Silla: no completó las 5 levantadas (0).';
      else {
        silla = puntosSilla(v.silla_t);
        lineaSilla = `Silla: 5 levantadas en ${v.silla_t} s (${silla}).`;
      }
    }
    const total = eq + marcha + silla;
    const prog = programaVivifrail(total);
    return {
      puntaje: total,
      extras: { eq, marcha, silla, velocidad, programa: prog },
      lineas: [
        `Equilibrio ${eq}/4 · Marcha ${marcha}/4 · Silla ${silla}/4.`,
        lineaMarcha,
        lineaSilla,
        total <= 8 ? 'SPPB ≤8: bajo desempeño físico según el EWGSOP2 (criterio de gravedad de la sarcopenia).' : null,
        `Vivifrail: corresponde al programa ${prog === 'C' ? 'C (C1 o C2 según el tiempo que camina)' : prog}. Para afinarlo con el riesgo de caídas, usa la herramienta Vivifrail.`,
      ].filter(Boolean),
    };
  },
  resumen(res) {
    const { eq, marcha, silla, velocidad } = res.extras;
    return `SPPB: ${res.puntaje}/12 (${res.banda.etiqueta.toLowerCase()}); equilibrio ${eq}, marcha ${marcha}${velocidad ? ` (${velocidad.toFixed(2)} m/s)` : ''}, silla ${silla}.`;
  },
  resumenBreve(res) {
    return `SPPB ${res.puntaje}/12 (${res.banda.etiqueta.toLowerCase()})`;
  },
  detalleEnResumen: true,
  notas: [
    'Categorías de limitación usadas por Vivifrail: 0–3 grave, 4–6 moderada, 7–9 leve, 10–12 mínima.',
    'EWGSOP2: SPPB ≤8 indica bajo desempeño físico.',
    'Puntos por tiempo según Guralnik (1994), la guía del INGER (2022) y Vivifrail: marcha 4 m <4.82 s = 4; 4.82–6.20 = 3; 6.21–8.70 = 2; >8.70 = 1. Silla ≤11.19 s = 4; 11.20–13.69 = 3; 13.70–16.69 = 2; 16.70–60 = 1; >60 s o incapaz = 0.',
    'Suspende la prueba si hay riesgo para la persona; las pruebas no realizadas por seguridad puntúan 0.',
  ],
  referencias: [
    { texto: 'Guralnik JM, Simonsick EM, Ferrucci L, et al. A short physical performance battery assessing lower extremity function: association with self-reported disability and prediction of mortality and nursing home admission. J Gerontol. 1994;49(2):M85-94.', doi: '10.1093/geronj/49.2.m85' },
    { texto: 'Izquierdo M, Casas-Herrero A, Zambom-Ferraresi F, et al. Programa de ejercicio físico multicomponente Vivifrail. Erasmus+; 2017.', enlace: 'https://vivifrail.com' },
    { texto: 'Cruz-Jentoft AJ, Bahat G, Bauer J, et al. Sarcopenia: revised European consensus on definition and diagnosis (EWGSOP2). Age Ageing. 2019;48(1):16-31.', doi: '10.1093/ageing/afy169' },
    REF_INGER_2022,
  ],
};
