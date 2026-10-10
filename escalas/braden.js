import { REF_INGER_2022, SUG } from './_comun.js';

const sub = (id, texto, max = 4) => ({
  id, texto, textoCorto: texto.toLowerCase(),
  opciones: Array.from({ length: max }, (_, i) => ({ texto: String(i + 1), valor: i + 1 })),
  compactoNumerico: true,
});

const SUG_RIESGO = [
  'Plan de prevención de lesiones por presión: cambios de posición programados, superficie de apoyo adecuada, cuidado de la piel y manejo de la humedad.',
  SUG.nutricion,
  'Revalorar el riesgo periódicamente y ante cambios clínicos.',
];

const B = {
  alto: { id: 'alto', rango: '≤12', etiqueta: 'Riesgo alto', nivel: 'grave', hallazgo: true, texto: 'Riesgo alto de lesiones por presión.', sugerencias: SUG_RIESGO },
  medio: { id: 'medio', rango: '13 a 14', etiqueta: 'Riesgo medio', nivel: 'moderado', hallazgo: true, texto: 'Riesgo medio de lesiones por presión.', sugerencias: SUG_RIESGO },
  bajo: { id: 'bajo', rango: '15 a 16 (<75 años) · 15 a 18 (≥75 años)', etiqueta: 'Riesgo bajo', nivel: 'leve', hallazgo: true, texto: 'Riesgo bajo de lesiones por presión.', sugerencias: [SUG_RIESGO[0], SUG_RIESGO[2]] },
  sin: {
    id: 'sin', rango: '≥17 (<75 años) · ≥19 (≥75 años)', etiqueta: 'Sin riesgo elevado identificado por la escala', nivel: 'bien',
    texto: 'Puntaje por encima del punto de corte para su edad: la escala no identifica riesgo elevado de lesiones por presión. No sustituye la inspección de la piel; revalorar ante cambios clínicos.',
    sugerencias: ['Mantener la inspección de la piel y revalorar el riesgo ante cambios en la movilidad, la nutrición, la continencia o el estado de alerta.'],
  },
};

export default {
  id: 'braden',
  nombre: 'Escala de Braden',
  corto: 'Braden',
  dominio: 'piel',
  tipo: 'registro',
  aliases: ['ulceras por presion', 'lesiones por presion', 'escaras', 'UPP'],
  problemas: ['úlceras por presión', 'lesiones por presión', 'inmovilidad', 'encamamiento', 'hospitalización'],
  descripcion: 'Riesgo de lesiones por presión: registro de 6 subescalas (6 a 23 puntos).',
  objetivo: 'Estimar el riesgo de desarrollar lesiones por presión.',
  poblacion: 'Pacientes hospitalizados y en cuidados de larga estancia (Bergstrom, 1987); el punto de corte varía con la edad.',
  aplicacion: [
    'Puntúa cada subescala con los descriptores del formato oficial; Huella no los reproduce.',
    'Percepción sensorial, humedad, actividad, movilidad y nutrición van de 1 a 4; fricción y cizallamiento de 1 a 3.',
    'Un puntaje menor indica mayor riesgo.',
  ],
  tiempo: '5 min',
  momentos: true,
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'menor riesgo según la escala',
  textoEmpeoramiento: 'mayor riesgo según la escala',
  min: 6,
  max: 23,
  barra: false,
  campos: [
    sub('percepcion', 'Percepción sensorial'),
    sub('humedad', 'Exposición a la humedad'),
    sub('actividad', 'Actividad'),
    sub('movilidad', 'Movilidad'),
    sub('nutricion', 'Nutrición'),
    sub('friccion', 'Fricción y cizallamiento', 3),
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad' },
  ],
  bandas: [B.alto, B.medio, B.bajo, B.sin],
  calcular({ v, base }) {
    const total = base.desglose.filter((d) => d.valor != null).reduce((s, d) => s + d.valor, 0);
    const limiteBajo = v.edad >= 75 ? 18 : 16;
    const banda = total <= 12 ? B.alto : total <= 14 ? B.medio : total <= limiteBajo ? B.bajo : B.sin;
    const lineas = [`Punto de corte para ${v.edad >= 75 ? '75 años o más' : 'menores de 75 años'}: riesgo hasta ${limiteBajo} puntos (guía del INGER).`];
    if (total <= 9) lineas.push('En la clasificación de Braden y Bergstrom, 9 puntos o menos corresponde a riesgo muy alto.');
    lineas.push('La escala estima el riesgo; no sustituye la inspección diaria de la piel.');
    return { puntaje: total, banda, lineas };
  },
  resumen(res) {
    const sub = res.desglose.filter((d) => d.valor != null).map((d) => `${d.campo.textoCorto} ${d.valor}`).join(', ');
    return `Braden: ${res.puntaje}/23 (${res.banda.etiqueta.toLowerCase()}); ${sub}.`;
  },
  detalleEnResumen: true,
  notas: [
    'Interpretación de la guía del INGER (2022): riesgo alto ≤12, medio 13–14, bajo 15–16 en menores de 75 años o 15–18 en 75 años o más. Por encima de esos valores la escala no identifica riesgo elevado, lo que no equivale a ausencia de riesgo.',
    'Clasificación de Braden y Bergstrom: 15–18 riesgo leve, 13–14 moderado, 10–12 alto y ≤9 muy alto.',
    'Estimar el riesgo no sustituye la inspección diaria de la piel ni el juicio clínico; revalora ante cambios en la movilidad, la nutrición, la continencia o el estado de alerta.',
    'El titular exige licencia para reproducir los descriptores: Huella registra solo los puntajes por subescala.',
  ],
  licencia: { texto: 'Braden Scale © Barbara Braden y Nancy Bergstrom; licencias a través de Health Sense Ai.', enlace: 'https://bradenscale.com' },
  referencias: [
    { texto: 'Bergstrom N, Braden BJ, Laguzza A, Holman V. The Braden Scale for predicting pressure sore risk. Nurs Res. 1987;36(4):205-10.' },
    REF_INGER_2022,
  ],
};
