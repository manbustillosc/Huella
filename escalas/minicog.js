import { REF_INGER_2022, SUG } from './_comun.js';

export default {
  id: 'minicog',
  nombre: 'Mini-Cog™',
  corto: 'Mini-Cog',
  dominio: 'cognitivo',
  tipo: 'tamizaje',
  aliases: ['minicog', 'tres palabras', 'reloj', 'memoria'],
  problemas: ['deterioro cognitivo', 'demencia', 'queja de memoria', 'olvidos', 'valoración preoperatoria'],
  descripcion: 'Tamizaje cognitivo breve: recuerdo de 3 palabras y dibujo del reloj, de 0 a 5 puntos.',
  objetivo: 'Identificar a quienes requieren una evaluación cognitiva más amplia.',
  poblacion: 'Personas mayores en distintos niveles de atención; poca influencia del idioma, la cultura y la escolaridad (Borson, 2000; Carnero-Pardo, 2013).',
  aplicacion: [
    'Registro: di tres palabras de una de las series oficiales y pide que las repita. Puedes repetirlas hasta 3 intentos.',
    'Reloj: da una hoja con un círculo y pide que coloque los números y después las manecillas a las 11:10. Puedes repetir la instrucción; si no termina en 3 minutos, pasa a la siguiente sección.',
    'Recuerdo: pide las tres palabras, sin pistas.',
    'Las series de palabras no se reproducen aquí: usa las de la hoja oficial (mini-cog.com o la guía del INGER).',
  ],
  tiempo: '3 a 5 min',
  min: 0,
  max: 5,
  campos: [
    {
      id: 'palabras', texto: 'Palabras recordadas sin pistas', textoCorto: 'recuerdo de palabras',
      opciones: [
        { texto: '3 palabras', valor: 3 },
        { texto: '2 palabras', valor: 2 },
        { texto: '1 palabra', valor: 1 },
        { texto: 'Ninguna', valor: 0 },
      ],
    },
    {
      id: 'reloj', texto: 'Dibujo del reloj', textoCorto: 'reloj',
      ayuda: 'Normal: todos los números del 1 al 12, una sola vez, en orden y posición aproximadamente correcta; dos manecillas apuntando al 11 y al 2. La longitud de las manecillas no se puntúa.',
      opciones: [
        { texto: 'Normal', valor: 2 },
        { texto: 'Anormal o se rehúsa', valor: 0 },
      ],
    },
  ],
  bandas: [
    {
      min: 0, max: 2, etiqueta: 'Probable deterioro cognitivo', nivel: 'moderado', hallazgo: true,
      texto: 'Tamizaje positivo: probable deterioro cognitivo. Se recomienda una evaluación cognitiva más amplia; no establece el diagnóstico.',
      sugerencias: [SUG.cognitivaCompleta, SUG.descartarDelirium, SUG.causasReversibles],
    },
    {
      min: 3, max: 5, etiqueta: 'Deterioro cognitivo poco probable', nivel: 'bien',
      texto: 'Tamizaje negativo. No descarta deterioro cognitivo: muchas personas con deterioro clínicamente significativo obtienen 3 o más.',
      sugerencias: ['Si hay quejas de memoria o sospecha clínica, considerar una evaluación más amplia (p. ej., MoCA).'],
    },
  ],
  notas: [
    'Punto de corte <3 validado para el tamizaje de demencia (guía del INGER, 2022). Para mayor sensibilidad, los autores sugieren considerar <4.',
    'No se usa para diagnosticar ni para estadificar; tampoco es útil en delirium activo.',
    'Mini-Cog™ © S. Borson. Uso clínico y educativo; no puede modificarse. Las listas de palabras no se reproducen en Huella.',
  ],
  licencia: { texto: 'Mini-Cog™ © S. Borson. Reproducción solo con fines clínicos y educativos.', enlace: 'https://mini-cog.com' },
  referencias: [
    { texto: 'Borson S, Scanlan J, Brush M, Vitaliano P, Dokmak A. The Mini-Cog: a cognitive "vital signs" measure for dementia screening in multi-lingual elderly. Int J Geriatr Psychiatry. 2000;15(11):1021-7.', doi: '10.1002/1099-1166(200011)15:11<1021::aid-gps234>3.0.co;2-6' },
    { texto: 'Carnero-Pardo C, Cruz-Orduña I, Espejo-Martínez B, et al. Utility of the Mini-Cog for detection of cognitive impairment in primary care: data from two Spanish studies. Int J Alzheimers Dis. 2013;2013:285462.', doi: '10.1155/2013/285462' },
    REF_INGER_2022,
  ],
};
