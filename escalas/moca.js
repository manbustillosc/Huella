import { REF_INGER_2022, SUG } from './_comun.js';

export default {
  id: 'moca',
  nombre: 'Evaluación Cognitiva Montreal (MoCA©)',
  corto: 'MoCA',
  dominio: 'cognitivo',
  tipo: 'registro',
  aliases: ['Montreal', 'MoCA', 'cognitivo', 'deterioro cognitivo leve'],
  problemas: ['deterioro cognitivo', 'deterioro cognitivo leve', 'demencia', 'queja de memoria'],
  descripcion: 'Registro del puntaje obtenido con la hoja oficial: 0 a 30 puntos, con ajuste por escolaridad.',
  objetivo: 'Detectar trastorno neurocognitivo leve y estadios tempranos de demencia.',
  poblacion: 'Personas de 49 a más de 85 años, en comunidad, hospital y urgencias; probada en múltiples idiomas y niveles de escolaridad (Nasreddine, 2005; guía del INGER, 2022).',
  aplicacion: [
    'Aplica la prueba con la hoja e instrucciones oficiales (mocacognition.com). Huella no reproduce los reactivos.',
    'Escribe el puntaje total antes del ajuste; Huella suma 1 punto si la escolaridad es de 12 años o menos.',
    'Si no fue posible aplicarla, márcala como no evaluable e indica el motivo.',
  ],
  tiempo: '10 a 15 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor desempeño en la prueba',
  textoEmpeoramiento: 'peor desempeño en la prueba',
  min: 0,
  max: 30,
  campos: [
    { id: 'puntaje', tipo: 'numero', texto: 'Puntaje total de la hoja oficial (antes del ajuste)', unidad: 'puntos', min: 0, max: 30, entero: true },
    {
      id: 'escolaridad', texto: '¿Escolaridad de 12 años o menos?', ayuda: 'Se suma 1 punto si el total es menor de 30.', prefill: 'escolaridad12',
      opciones: [
        { texto: 'Sí, 12 años o menos', valor: 1 },
        { texto: 'No, más de 12 años', valor: 0 },
      ],
      puntua: false,
    },
  ],
  bandas: [
    {
      min: 0, max: 25, etiqueta: 'Probable trastorno cognitivo', nivel: 'moderado', hallazgo: true,
      texto: 'Puntaje por debajo del punto de corte: probable trastorno cognitivo. No establece el diagnóstico ni la causa.',
      sugerencias: [
        SUG.descartarDelirium,
        'Correlacionar con la funcionalidad (Lawton-Brody, Barthel) y con la información del cuidador para distinguir trastorno neurocognitivo leve de mayor.',
        SUG.causasReversibles,
        'Considerar valoración neuropsicológica o por especialista si el diagnóstico es incierto.',
      ],
    },
    { min: 26, max: 30, etiqueta: 'Dentro de lo esperado', nivel: 'bien', texto: 'Puntaje en rango normal. No descarta deterioro si la sospecha clínica es alta.', sugerencias: [] },
  ],
  calcular({ v }) {
    const bruto = v.puntaje;
    const ajuste = v.escolaridad.valor === 1 && bruto < 30 ? 1 : 0;
    return {
      puntaje: bruto + ajuste,
      extras: { bruto, ajuste },
      lineas: [ajuste ? `Puntaje bruto ${bruto} + 1 por escolaridad de 12 años o menos = ${bruto + 1}.` : `Puntaje ${bruto}, sin ajuste por escolaridad.`],
    };
  },
  resumen(res) {
    const aj = res.extras.ajuste ? ' (incluye +1 por escolaridad ≤12 años)' : '';
    return `MoCA: ${res.puntaje}/30${aj} (${res.banda.etiqueta.toLowerCase()}).`;
  },
  notas: [
    'Punto de corte 26 (normal 26–30), el original y el de la guía del INGER (2022). En poblaciones con baja escolaridad se han propuesto puntos de corte más bajos; interprétalo con el contexto educativo.',
    'Requiere la versión oficial y, desde 2019, certificación del evaluador según el titular. Huella solo registra e interpreta el puntaje.',
    'No interpretar durante delirium, sedación o déficit sensorial no corregido.',
  ],
  licencia: { texto: 'MoCA© es propiedad de MoCA Cognition. Huella no reproduce reactivos; solo registra el puntaje obtenido con la versión oficial.', enlace: 'https://mocacognition.com' },
  referencias: [
    { texto: 'Nasreddine ZS, Phillips NA, Bédirian V, et al. The Montreal Cognitive Assessment, MoCA: a brief screening tool for mild cognitive impairment. J Am Geriatr Soc. 2005;53(4):695-9.', doi: '10.1111/j.1532-5415.2005.53221.x' },
    REF_INGER_2022,
  ],
};
