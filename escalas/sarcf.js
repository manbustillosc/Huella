import { REF_INGER_2022, NOTA_INGER } from './_comun.js';

const tres = (alto = 'Mucha o incapaz') => [
  { texto: 'Ninguna', valor: 0 },
  { texto: 'Alguna', valor: 1 },
  { texto: alto, valor: 2 },
];

export default {
  id: 'sarcf',
  nombre: 'SARC-F',
  corto: 'SARC-F',
  dominio: 'fragilidad',
  tipo: 'tamizaje',
  aliases: ['sarcopenia', 'fuerza', 'Malmstrom'],
  problemas: ['sarcopenia', 'debilidad', 'caídas', 'pérdida de masa muscular'],
  descripcion: 'Tamizaje de sarcopenia: 5 preguntas, de 0 a 10 puntos.',
  objetivo: 'Identificar probable sarcopenia para iniciar su confirmación (búsqueda de casos).',
  poblacion: 'Personas mayores en la comunidad (Malmstrom, 2013). Adaptación y validación en adultos mayores mexicanos (Parra-Rodríguez, 2016). Recomendado por el EWGSOP2 para la búsqueda de casos.',
  aplicacion: ['Aplica las 5 preguntas y marca la opción de cada una.'],
  tiempo: '2 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'reducción de síntomas sugestivos de sarcopenia',
  textoEmpeoramiento: 'aumento de síntomas sugestivos de sarcopenia',
  min: 0,
  max: 10,
  campos: [
    { id: 'fuerza', texto: 'Fuerza: ¿qué tanta dificultad tiene para llevar o cargar 4.5 kg?', textoCorto: 'fuerza', opciones: tres() },
    { id: 'asistencia', texto: 'Asistencia para caminar: ¿qué tanta dificultad tiene para cruzar caminando un cuarto?', textoCorto: 'caminar', opciones: tres('Mucha, usa auxiliares o incapaz') },
    { id: 'silla', texto: 'Levantarse de una silla: ¿qué tanta dificultad tiene para levantarse de una silla o cama?', textoCorto: 'levantarse', opciones: tres('Mucha o incapaz sin ayuda') },
    { id: 'escaleras', texto: 'Subir escaleras: ¿qué tanta dificultad tiene para subir 10 escalones?', textoCorto: 'escaleras', opciones: tres() },
    {
      id: 'caidas', texto: 'Caídas: ¿cuántas veces se ha caído en el último año?', textoCorto: 'caídas',
      opciones: [
        { texto: 'Ninguna', valor: 0 },
        { texto: '1 a 3 caídas', valor: 1 },
        { texto: '4 o más caídas', valor: 2 },
      ],
    },
  ],
  bandas: [
    { min: 0, max: 3, etiqueta: 'Baja probabilidad de sarcopenia', nivel: 'bien', texto: 'Tamizaje negativo. Si hay sospecha clínica, puede medirse directamente la fuerza.', sugerencias: [] },
    {
      min: 4, max: 10, etiqueta: 'Alta probabilidad de sarcopenia', nivel: 'moderado', hallazgo: true,
      texto: 'Tamizaje positivo: probable sarcopenia. El diagnóstico requiere medir fuerza y masa muscular.',
      sugerencias: [
        'Medir la fuerza: prensión <27 kg en hombres o <16 kg en mujeres, o levantarse 5 veces de una silla en más de 15 s (EWGSOP2).',
        'Si la fuerza está baja, confirmar con masa muscular (DXA, bioimpedancia) y graduar con el desempeño físico (SPPB ≤8 o velocidad de marcha ≤0.8 m/s).',
        'Valorar nutrición (ingesta proteica) y prescribir ejercicio de fuerza.',
      ],
    },
  ],
  notas: [
    'Alta especificidad y baja sensibilidad: un resultado negativo no descarta sarcopenia.',
    'Punto de corte ≥4 (Malmstrom, 2013; guía del INGER, 2022).',
    NOTA_INGER,
  ],
  referencias: [
    { texto: 'Malmstrom TK, Morley JE. SARC-F: a simple questionnaire to rapidly diagnose sarcopenia. J Am Med Dir Assoc. 2013;14(8):531-2.', doi: '10.1016/j.jamda.2013.05.018' },
    { texto: 'Parra-Rodríguez L, Szlejf C, García-González AI, et al. Cross-cultural adaptation and validation of the Spanish-language version of the SARC-F to assess sarcopenia in Mexican community-dwelling older adults. J Am Med Dir Assoc. 2016;17(12):1142-6.', doi: '10.1016/j.jamda.2016.09.008' },
    { texto: 'Cruz-Jentoft AJ, Bahat G, Bauer J, et al. Sarcopenia: revised European consensus on definition and diagnosis (EWGSOP2). Age Ageing. 2019;48(1):16-31.', doi: '10.1093/ageing/afy169' },
    REF_INGER_2022,
  ],
};
