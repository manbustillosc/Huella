// Functional Assessment Staging (FAST) de Reisberg. Registro del estadio con palabras clave mínimas;
// la descripción completa de cada estadio está en el instrumento oficial.
const SUBESTADIOS = [
  ['1', 'sin déficit funcional'],
  ['2', 'déficit subjetivo'],
  ['3', 'déficit en actividades exigentes'],
  ['4', 'actividades instrumentales complejas'],
  ['5', 'elección de la ropa'],
  ['6a', 'vestido'],
  ['6b', 'baño'],
  ['6c', 'uso del sanitario'],
  ['6d', 'continencia urinaria'],
  ['6e', 'continencia fecal'],
  ['7a', 'lenguaje limitado'],
  ['7b', 'lenguaje de una palabra'],
  ['7c', 'deambulación'],
  ['7d', 'sedestación'],
  ['7e', 'sonrisa'],
  ['7f', 'control cefálico'],
];
export const CODIGOS_FAST = SUBESTADIOS.map(([c]) => c);

const ESTADIOS = [
  { min: 1, max: 1, rango: '1', etiqueta: 'Estadio 1: sin déficit', nivel: 'bien', texto: 'Sin dificultades funcionales objetivas ni subjetivas.' },
  { min: 2, max: 2, rango: '2', etiqueta: 'Estadio 2: déficit subjetivo', nivel: 'bien', texto: 'Dificultad funcional subjetiva, sin repercusión objetiva.' },
  { min: 3, max: 3, rango: '3', etiqueta: 'Estadio 3: déficit en actividades exigentes', nivel: 'leve', hallazgo: true, texto: 'Déficit objetivo en actividades laborales o sociales exigentes; en enfermedad de Alzheimer corresponde a una fase incipiente (deterioro cognitivo leve).' },
  { min: 4, max: 4, rango: '4', etiqueta: 'Estadio 4: demencia leve', nivel: 'moderado', hallazgo: true, texto: 'Dificultad en actividades instrumentales complejas; en enfermedad de Alzheimer corresponde a demencia leve.' },
  { min: 5, max: 5, rango: '5', etiqueta: 'Estadio 5: demencia moderada', nivel: 'moderado', hallazgo: true, texto: 'Requiere ayuda para elegir la ropa adecuada; en enfermedad de Alzheimer corresponde a demencia moderada.' },
  { min: 6, max: 10, rango: '6a–6e', etiqueta: 'Estadio 6: demencia moderadamente grave', nivel: 'grave', hallazgo: true, texto: 'Pérdida progresiva de actividades básicas (vestido, baño, sanitario) y de la continencia; en enfermedad de Alzheimer corresponde a demencia moderadamente grave.' },
  { min: 11, max: 16, rango: '7a–7f', etiqueta: 'Estadio 7: demencia grave', nivel: 'critico', hallazgo: true, texto: 'Pérdida progresiva del lenguaje, la deambulación, la sedestación, la sonrisa y el control cefálico; en enfermedad de Alzheimer corresponde a demencia grave.' },
].map((b) => ({
  ...b,
  sugerencias: b.min >= 6
    ? ['Plan de cuidados centrado en confort, nutrición, prevención de lesiones por presión y apoyo al cuidador.', 'Conversar con la familia sobre objetivos de atención y voluntades anticipadas.']
    : b.min >= 3 ? ['Correlacionar con la evaluación cognitiva y funcional; el FAST no diagnostica la causa.'] : [],
}));

export default {
  id: 'fast',
  nombre: 'Estadificación funcional de Reisberg (FAST)',
  corto: 'FAST',
  dominio: 'cognitivo',
  tipo: 'estadificacion',
  aliases: ['Functional Assessment Staging', 'Reisberg', 'estadio funcional', 'demencia avanzada', 'GDS-FAST'],
  problemas: ['demencia', 'enfermedad de Alzheimer', 'demencia avanzada', 'cuidados paliativos', 'seguimiento'],
  descripcion: 'Estadio funcional de la demencia en 7 estadios y 11 subestadios (6a–6e, 7a–7f).',
  objetivo: 'Estadificar la repercusión funcional de la enfermedad de Alzheimer y seguir su progresión.',
  poblacion: 'Personas con enfermedad de Alzheimer (Reisberg, 1988; Sclan y Reisberg, 1992). En otras demencias o con comorbilidad la progresión puede no ser ordinal.',
  aplicacion: [
    'Consulta el instrumento oficial: describe cada estadio y subestadio.',
    'Con información del cuidador, elige el estadio más alto que la persona alcanza de forma consecutiva: las pérdidas previas deben estar presentes.',
    'Si una pérdida se explica por otra causa (fractura, evento vascular, incontinencia urológica), anótalo.',
  ],
  tiempo: '2 a 5 min',
  fuente: true,
  direccionClinica: 'menor_mejor',
  unidadCambio: ['subestadio', 'subestadios'],
  textoMejoria: 'estadio funcional menor, sujeto a interpretación clínica',
  textoEmpeoramiento: 'progresión del estadio funcional',
  min: 1,
  max: 16,
  siguientes: [
    { id: 'npiq', si: (res) => !res.noEvaluable && res.valor >= 4, motivo: 'Síntomas neuropsiquiátricos y angustia del cuidador.' },
    { id: 'zarit', si: (res) => !res.noEvaluable && res.valor >= 4, motivo: 'Sobrecarga del cuidador principal.' },
  ],
  campos: [
    {
      id: 'estadio', texto: 'Estadio o subestadio más alto alcanzado de forma consecutiva', textoCorto: 'estadio', puntua: false,
      opciones: SUBESTADIOS.map(([c, clave], i) => ({ texto: `${c} · ${clave}`, valor: i + 1, codigo: c })),
    },
    {
      id: 'ordinal', texto: '¿Las pérdidas siguieron el orden esperado?', textoCorto: 'progresión ordinal', puntua: false,
      opciones: [
        { texto: 'Sí', valor: 0, clave: 'si' },
        { texto: 'No', valor: 1, clave: 'no' },
        { texto: 'No se sabe', valor: 2, clave: 'sin' },
      ],
      visibleSi: (r) => Number(r.estadio) >= 4,
    },
    {
      id: 'otraCausa', texto: '¿Alguna pérdida se explica mejor por otra causa?', textoCorto: 'otra causa', puntua: false,
      ayuda: 'Por ejemplo, incontinencia de origen urológico, inmovilidad por fractura o un evento vascular.',
      opciones: [
        { texto: 'No', valor: 0, clave: 'no' },
        { texto: 'Sí', valor: 1, clave: 'si' },
      ],
      visibleSi: (r) => Number(r.estadio) >= 5,
    },
  ],
  bandas: ESTADIOS,
  calcular({ v }) {
    const o = v.estadio;
    const lineas = [];
    if (v.ordinal?.clave === 'no') lineas.push('Las pérdidas no siguieron el orden esperado: el estadio pierde validez como medida de progresión de la demencia.');
    if (v.ordinal?.clave === 'sin') lineas.push('No se sabe si la progresión fue ordinal: interpreta el estadio con cautela.');
    if (v.otraCausa?.clave === 'si') lineas.push('Alguna pérdida se explica por otra causa: el estadio puede sobrestimar la progresión de la demencia.');
    return {
      valor: o.valor,
      mostrar: o.codigo,
      sufijo: 'FAST',
      unidad: '',
      lineas,
      lineasNota: lineas,
      extras: { codigo: o.codigo, clave: SUBESTADIOS[o.valor - 1][1] },
    };
  },
  resumen: (res) => `FAST ${res.mostrar} (${res.banda.etiqueta.replace(/^Estadio \d+: /, '')}${/[a-f]$/.test(res.mostrar) ? `; subestadio: ${res.extras.clave}` : ''}).`,
  resumenBreve: (res) => `FAST ${res.mostrar} (${res.banda.etiqueta.replace(/^Estadio \d+: /, '')})`,
  detalleEnResumen: true,
  notas: [
    'Estadifica la funcionalidad, no la cognición. Es distinto de la Escala de Deterioro Global (GDS) de Reisberg, que estadifica el deterioro cognitivo, y de la GDS-15 de Yesavage, que tamiza depresión.',
    'Se diseñó para la enfermedad de Alzheimer, cuya progresión suele ser ordinal. En demencia vascular, por cuerpos de Lewy o frontotemporal, o con comorbilidad, el orden puede no cumplirse y el estadio pierde validez.',
    'No estima por sí solo la supervivencia ni define el ingreso a cuidados paliativos: considera también la comorbilidad, la nutrición y las complicaciones.',
    'La diferencia entre subestadios es ordinal: un cambio de varios subestadios no tiene una magnitud uniforme.',
  ],
  licencia: { texto: 'FAST © Barry Reisberg. Huella registra el estadio con palabras clave; consulta el instrumento oficial.' },
  referencias: [
    { texto: 'Reisberg B. Functional assessment staging (FAST). Psychopharmacol Bull. 1988;24(4):653-9.' },
    { texto: 'Sclan SG, Reisberg B. Functional assessment staging (FAST) in Alzheimer\'s disease: reliability, validity, and ordinality. Int Psychogeriatr. 1992;4 Suppl 1:55-69.', doi: '10.1017/s1041610292001157' },
  ],
};
