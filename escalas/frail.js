import { REF_INGER_2022, NOTA_INGER, SUG } from './_comun.js';

const ENFERMEDADES = [
  { id: 'hta', texto: 'Hipertensión arterial sistémica' },
  { id: 'dm', texto: 'Diabetes' },
  { id: 'cancer', texto: 'Cáncer (excepto cáncer menor de piel)' },
  { id: 'epoc', texto: 'Enfermedad pulmonar crónica' },
  { id: 'isquemica', texto: 'Cardiopatía isquémica' },
  { id: 'ic', texto: 'Insuficiencia cardiaca' },
  { id: 'angina', texto: 'Angina' },
  { id: 'asma', texto: 'Asma' },
  { id: 'artritis', texto: 'Artritis (incluye osteoartrosis y artritis reumatoide)' },
  { id: 'evc', texto: 'Enfermedad vascular cerebral' },
  { id: 'erc', texto: 'Enfermedad renal crónica' },
];

const pesoValido = (r) => {
  const a = Number(String(r.peso_actual ?? '').replace(',', '.'));
  const p = Number(String(r.peso_previo ?? '').replace(',', '.'));
  return a >= 20 && a <= 300 && p >= 20 && p <= 300;
};

export default {
  id: 'frail',
  nombre: 'Escala FRAIL',
  corto: 'FRAIL',
  dominio: 'fragilidad',
  tipo: 'tamizaje',
  aliases: ['fragilidad', 'Morley', 'FRAIL scale'],
  problemas: ['fragilidad', 'pérdida de peso', 'fatiga', 'multimorbilidad', 'caídas'],
  descripcion: 'Tamizaje de fragilidad: 5 componentes (fatiga, resistencia, actividad aeróbica, enfermedades y pérdida de peso), de 0 a 5.',
  objetivo: 'Identificar probable fragilidad y prefragilidad.',
  poblacion: 'Personas mayores en la comunidad (Morley, 2012). Adaptación transcultural y validación en adultos mexicanos (Rosas-Carrasco, 2016).',
  aplicacion: [
    'Explica que harás 5 preguntas y registra cada respuesta.',
    'Para las enfermedades, pregunta: «¿Algún médico le ha dicho que tiene…?» y marca las que diga; si no tiene ninguna, confírmalo con «Ninguno de los anteriores».',
    'Pérdida de peso: escribe el peso actual y el de hace un año (con ropa y sin zapatos); si no se conocen, responde directamente.',
  ],
  tiempo: '5 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'reducción del número de componentes positivos',
  textoEmpeoramiento: 'aumento del número de componentes positivos',
  min: 0,
  max: 5,
  campos: [
    {
      id: 'fatiga', texto: 'Fatiga: en las últimas 4 semanas, ¿qué tanto tiempo se sintió cansado(a)?', textoCorto: 'fatiga',
      opciones: [
        { texto: 'Todo el tiempo', valor: 1 },
        { texto: 'La mayor parte del tiempo', valor: 1 },
        { texto: 'Algo de tiempo', valor: 0 },
        { texto: 'Muy poco tiempo', valor: 0 },
        { texto: 'Nada de tiempo', valor: 0 },
      ],
    },
    {
      id: 'resistencia', texto: 'Resistencia: usted solo, sin bastón ni andadera, ¿tiene dificultad para subir 10 escalones?', textoCorto: 'resistencia',
      opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }],
    },
    {
      id: 'aerobica', texto: 'Actividad aeróbica: usted solo, sin bastón ni andadera, ¿tiene dificultad para caminar 100 metros (dos cuadras) sin descansar?', textoCorto: 'actividad aeróbica',
      opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }],
    },
    {
      id: 'enfermedades', tipo: 'checklist', texto: 'Enfermedades: ¿algún médico le ha dicho que tiene…?', textoCorto: 'enfermedades',
      ayuda: 'Puntúa 1 si tiene 5 o más de las 11. Si no tiene ninguna, marca «Ninguno de los anteriores».',
      opciones: ENFERMEDADES,
    },
    { id: 'peso_actual', tipo: 'numero', texto: 'Peso actual', unidad: 'kg', min: 20, max: 300, decimales: 1, opcional: true },
    { id: 'peso_previo', tipo: 'numero', texto: 'Peso hace un año', unidad: 'kg', min: 20, max: 300, decimales: 1, opcional: true },
    {
      id: 'perdida', texto: 'Si no se conocen ambos pesos: ¿perdió 5 % o más de su peso en el último año?', textoCorto: 'pérdida de peso',
      visibleSi: (r) => !pesoValido(r),
      opciones: [{ texto: 'Sí, 5 % o más', valor: 1 }, { texto: 'No', valor: 0 }],
    },
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'Robusto (sin fragilidad)', nivel: 'bien', texto: 'Sin componentes de fragilidad.', sugerencias: [] },
    {
      min: 1, max: 2, etiqueta: 'Probable prefragilidad', nivel: 'leve', hallazgo: true,
      texto: 'Uno o dos componentes: probable prefragilidad.',
      sugerencias: [SUG.ejercicio, SUG.nutricion],
    },
    {
      min: 3, max: 5, etiqueta: 'Probable fragilidad', nivel: 'grave', hallazgo: true,
      texto: 'Tres o más componentes: compatible con fragilidad según el instrumento. Es un tamizaje; conviene caracterizarla con una valoración geriátrica integral.',
      sugerencias: [
        'Valoración geriátrica integral para identificar causas tratables (nutrición, fármacos, depresión, deterioro cognitivo, sarcopenia).',
        'Medir el desempeño físico (SPPB o velocidad de marcha) para orientar la intervención.',
        SUG.ejercicio,
        SUG.revisionFarmacos,
      ],
    },
  ],
  calcular({ v, r }) {
    const nEnf = v.enfermedades.length;
    let perdida;
    let lineaPeso;
    if (v.peso_actual != null && v.peso_previo != null) {
      const pct = ((v.peso_previo - v.peso_actual) / v.peso_previo) * 100;
      perdida = pct >= 5 ? 1 : 0;
      lineaPeso = pct > 0 ? `Pérdida de peso en un año: ${pct.toFixed(1)} % (${v.peso_previo} → ${v.peso_actual} kg).` : `Sin pérdida de peso en un año (${v.peso_previo} → ${v.peso_actual} kg).`;
    } else {
      perdida = v.perdida.valor;
      lineaPeso = `Pérdida de peso ≥5 % referida: ${perdida ? 'sí' : 'no'}.`;
    }
    const comp = {
      fatiga: v.fatiga.valor,
      resistencia: v.resistencia.valor,
      aerobica: v.aerobica.valor,
      enfermedades: nEnf >= 5 ? 1 : 0,
      perdida,
    };
    const nombres = { fatiga: 'fatiga', resistencia: 'resistencia', aerobica: 'actividad aeróbica', enfermedades: '5 o más enfermedades', perdida: 'pérdida de peso ≥5 %' };
    const positivos = Object.keys(comp).filter((k) => comp[k]).map((k) => nombres[k]);
    return {
      puntaje: Object.values(comp).reduce((s, x) => s + x, 0),
      extras: { positivos, nEnf },
      lineas: [`Enfermedades: ${nEnf} de 11.`, lineaPeso],
    };
  },
  resumen(res) {
    const p = res.extras.positivos;
    return `FRAIL: ${res.puntaje}/5 (${res.banda.etiqueta.toLowerCase()})${p.length ? `; componentes: ${p.join(', ')}` : ''}.`;
  },
  resumenBreve(res) {
    return `FRAIL ${res.puntaje}/5 (${res.banda.etiqueta.toLowerCase()})`;
  },
  detalleEnResumen: true,
  notas: [
    'Puntos de corte: 0 robusto, 1–2 prefragilidad, 3–5 fragilidad (Morley, 2012; guía del INGER, 2022).',
    'Es un cuestionario autorreferido: puede subestimar o sobrestimar la limitación en deterioro cognitivo.',
    'La pérdida de peso se calcula como (peso hace un año − peso actual) / peso hace un año × 100.',
    NOTA_INGER,
  ],
  referencias: [
    { texto: 'Morley JE, Malmstrom TK, Miller DK. A simple frailty questionnaire (FRAIL) predicts outcomes in middle aged African Americans. J Nutr Health Aging. 2012;16(7):601-8.', doi: '10.1007/s12603-012-0084-2' },
    { texto: 'Rosas-Carrasco O, Cruz-Arenas E, Parra-Rodríguez L, et al. Cross-cultural adaptation and validation of the FRAIL scale to assess frailty in Mexican adults. J Am Med Dir Assoc. 2016;17(12):1094-8.', doi: '10.1016/j.jamda.2016.07.008' },
    REF_INGER_2022,
  ],
};
