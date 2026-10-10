import { REF_INGER_2022, SUG } from './_comun.js';

export default {
  id: 'mnasf',
  nombre: 'Mini Nutritional Assessment, formato corto (MNA®-SF)',
  corto: 'MNA-SF',
  dominio: 'nutricion',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['MNA', 'nutricion', 'desnutricion', 'Nestle'],
  problemas: ['desnutrición', 'pérdida de peso', 'hiporexia', 'fragilidad', 'sarcopenia'],
  descripcion: 'Registro del puntaje obtenido con el formulario oficial: 0 a 14 puntos.',
  objetivo: 'Identificar desnutrición o riesgo de desnutrición en personas mayores.',
  poblacion: 'Personas de 65 años o más en comunidad, hospital y residencias (Rubenstein, 2001; Kaiser, 2009).',
  aplicacion: [
    'Aplica el formulario oficial MNA®-SF (mna-elderly.com) sin modificarlo; Huella no reproduce sus preguntas.',
    'Registra el puntaje total e indica si usaste el IMC o la circunferencia de pantorrilla.',
  ],
  tiempo: '5 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejoría del estado nutricional según el tamizaje',
  textoEmpeoramiento: 'empeoramiento del estado nutricional según el tamizaje',
  min: 0,
  max: 14,
  campos: [
    { id: 'puntaje', tipo: 'numero', texto: 'Puntaje total del formulario oficial', unidad: 'puntos', min: 0, max: 14, entero: true },
    {
      id: 'variante', texto: 'Medida antropométrica usada', textoCorto: 'medida', puntua: false,
      opciones: [{ texto: 'Índice de masa corporal (IMC)', valor: 0 }, { texto: 'Circunferencia de pantorrilla', valor: 0 }],
    },
  ],
  bandas: [
    {
      min: 0, max: 7, etiqueta: 'Desnutrición', nivel: 'grave', hallazgo: true,
      texto: 'Puntaje compatible con desnutrición según el instrumento; requiere valoración nutricional completa.',
      sugerencias: [SUG.nutricion, 'Valoración por nutrición clínica e intervención nutricional; considerar criterios GLIM para confirmar y graduar.', 'Buscar causas: problemas dentales o de deglución, depresión, deterioro cognitivo, fármacos, enfermedad aguda o crónica, factores sociales.'],
    },
    {
      min: 8, max: 11, etiqueta: 'Riesgo de desnutrición', nivel: 'moderado', hallazgo: true,
      texto: 'Riesgo de desnutrición.',
      sugerencias: [SUG.nutricion, 'Vigilar el peso y la ingesta; considerar el MNA completo.'],
    },
    { min: 12, max: 14, etiqueta: 'Estado nutricional normal', nivel: 'bien', texto: 'Estado nutricional normal según el tamizaje.', sugerencias: ['Repetir el tamizaje periódicamente o ante enfermedad aguda.'] },
  ],
  calcular({ v }) {
    return { puntaje: v.puntaje, lineas: [`Medida usada: ${v.variante.texto.toLowerCase()}.`] };
  },
  notas: [
    'Puntos de corte oficiales: 12–14 normal, 8–11 riesgo, 0–7 desnutrición (Kaiser, 2009; guía del INGER, 2022).',
    'Es un tamizaje; el diagnóstico de desnutrición requiere valoración nutricional completa.',
  ],
  licencia: { texto: 'MNA® es marca registrada de Société des Produits Nestlé S.A.; el formulario no puede modificarse. Distribución y licencias: Mapi Research Trust.', enlace: 'https://www.mna-elderly.com' },
  referencias: [
    { texto: 'Rubenstein LZ, Harker JO, Salvà A, Guigoz Y, Vellas B. Screening for undernutrition in geriatric practice: developing the short-form mini-nutritional assessment (MNA-SF). J Gerontol A Biol Sci Med Sci. 2001;56(6):M366-72.', doi: '10.1093/gerona/56.6.m366' },
    { texto: 'Kaiser MJ, Bauer JM, Ramsch C, et al. Validation of the Mini Nutritional Assessment short-form (MNA-SF): a practical tool for identification of nutritional status. J Nutr Health Aging. 2009;13(9):782-8.', doi: '10.1007/s12603-009-0214-7' },
    REF_INGER_2022,
  ],
};
