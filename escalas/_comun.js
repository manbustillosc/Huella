// Piezas compartidas por varias escalas.

export const sino = (id, texto, puntua, extra = {}) => ({ id, texto, tipo: 'sino', puntua, ...extra });

export const REF_INGER_2022 = {
  texto: 'Instituto Nacional de Geriatría. Guía de instrumentos de evaluación de la capacidad funcional. Ciudad de México: INGER; 2022.',
  enlace: 'https://www.gob.mx/inger',
};

export const NOTA_INGER = 'Versión en español conforme a la Guía de instrumentos de evaluación de la capacidad funcional del Instituto Nacional de Geriatría (2022), con fines asistenciales sin ánimo de lucro y citando la fuente.';

// Sugerencias reutilizables (orientativas; no sustituyen el juicio clínico).
export const SUG = {
  causaFuncional: 'Identificar la causa de la dependencia (aguda, crónica o mixta) y compararla con el estado funcional basal.',
  rehabilitacion: 'Valorar necesidades de rehabilitación (fisioterapia o terapia ocupacional), ayudas técnicas y apoyos en el domicilio.',
  cuidador: 'Explorar la carga del cuidador principal (p. ej., escala de Zarit).',
  piel: 'Valorar el riesgo de lesiones por presión (Braden) y el estado nutricional (MNA-SF).',
  cognitivaCompleta: 'Completar la evaluación cognitiva con un instrumento más amplio (p. ej., MoCA) y la funcionalidad instrumental (Lawton-Brody), cuando el estado clínico lo permita.',
  descartarDelirium: 'Descartar delirium antes de atribuir el resultado a un trastorno neurocognitivo (4AT o CAM).',
  causasReversibles: 'Buscar causas potencialmente reversibles o contribuyentes (fármacos, alteraciones metabólicas, déficit sensorial, depresión).',
  caidas: 'Valorar el riesgo de caídas de forma multifactorial: antecedente de caídas, marcha y equilibrio, fármacos, visión, hipotensión ortostática y entorno.',
  ejercicio: 'Considerar un programa de ejercicio físico multicomponente adaptado a la capacidad funcional (p. ej., Vivifrail según el SPPB).',
  nutricion: 'Completar la valoración nutricional: ingesta, pérdida de peso, causas de hiporexia y necesidades de proteína.',
  revisionFarmacos: 'Revisar la medicación, en especial psicofármacos y fármacos con carga anticolinérgica.',
};
