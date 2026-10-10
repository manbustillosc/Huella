import { SUG } from './_comun.js';

const DOMINIOS_RUDAS = [
  { id: 'memoria', texto: 'Memoria', max: 8 },
  { id: 'orientacion', texto: 'Orientación corporal (derecha-izquierda)', max: 5 },
  { id: 'praxis', texto: 'Praxis', max: 2 },
  { id: 'dibujo', texto: 'Dibujo visoconstructivo', max: 3 },
  { id: 'juicio', texto: 'Juicio', max: 4 },
  { id: 'lenguaje', texto: 'Lenguaje (fluencia)', max: 8 },
];

export default {
  id: 'rudas',
  nombre: 'Escala universal de evaluación de demencia de Rowland (RUDAS)',
  corto: 'RUDAS',
  dominio: 'cognitivo',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['Rowland', 'Rowland Universal Dementia Assessment Scale', 'baja escolaridad', 'multicultural', 'demencia'],
  problemas: ['memoria', 'deterioro cognitivo', 'demencia', 'baja escolaridad', 'analfabetismo'],
  descripcion: 'Registro de los 6 dominios de la RUDAS (0 a 30); poco influida por la escolaridad y el idioma.',
  objetivo: 'Detectar deterioro cognitivo con un instrumento diseñado para ser justo entre culturas y niveles de escolaridad. No establece el diagnóstico.',
  poblacion: 'Personas mayores de distintos orígenes culturales y lingüísticos (Storey, 2004; Rowland, 2006). En hispanohablantes de España hay una tabla de equivalencias con el MMSE (Delgado-Álvarez, 2024); no se identificó una validación en población mexicana.',
  aplicacion: [
    'Aplica la RUDAS con su formato e instrucciones oficiales. Huella no reproduce los reactivos.',
    'Registra el puntaje de cada dominio; el total se calcula solo.',
    'Descarta antes delirium y déficit sensorial no corregido.',
  ],
  tiempo: '10 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor desempeño cognitivo',
  textoEmpeoramiento: 'peor desempeño cognitivo',
  min: 0,
  max: 30,
  siguientes: [
    { id: 'lawton', si: (res) => !res.noEvaluable && res.puntaje < 23, motivo: 'Repercusión en actividades instrumentales: ayuda a distinguir trastorno neurocognitivo leve de mayor.' },
  ],
  campos: DOMINIOS_RUDAS.map((d) => ({
    id: d.id, tipo: 'numero', texto: `${d.texto} (0 a ${d.max})`, textoCorto: d.texto.toLowerCase(), unidad: `de ${d.max}`, min: 0, max: d.max, entero: true,
  })),
  bandas: [
    {
      min: 0, max: 22, etiqueta: 'Tamizaje positivo', nivel: 'moderado', hallazgo: true,
      texto: 'Puntaje menor de 23: sugiere deterioro cognitivo. Requiere evaluación clínica y neuropsicológica para establecer el diagnóstico.',
      sugerencias: [
        SUG.descartarDelirium,
        SUG.causasReversibles,
        'Evaluar la repercusión funcional (Lawton-Brody, Barthel) para distinguir trastorno neurocognitivo leve de mayor.',
      ],
    },
    {
      min: 23, max: 30, etiqueta: 'Tamizaje negativo', nivel: 'bien',
      texto: 'Puntaje de 23 o más: no sugiere deterioro cognitivo según el punto de corte publicado. No lo descarta si hay sospecha clínica.',
      sugerencias: [],
    },
  ],
  calcular({ v }) {
    const puntaje = DOMINIOS_RUDAS.reduce((s, d) => s + v[d.id], 0);
    const perfil = DOMINIOS_RUDAS.map((d) => `${d.texto.split(' (')[0].toLowerCase()} ${v[d.id]}/${d.max}`).join(', ');
    return { puntaje, lineas: [`Dominios: ${perfil}.`], lineasNota: [`Dominios: ${perfil}.`], extras: { dominios: Object.fromEntries(DOMINIOS_RUDAS.map((d) => [d.id, v[d.id]])) } };
  },
  detalleEnResumen: true,
  notas: [
    'Punto de corte publicado: menor de 23 de 30 (sensibilidad 89 % y especificidad 98 % en una muestra multicultural de Sídney; Storey, 2004). Su razón de verosimilitud positiva alta la hace útil para confirmar sospecha (Rowland, 2006).',
    'En la muestra original no se asoció con escolaridad, sexo ni idioma preferido, a diferencia del MMSE.',
    'No se identificó una validación en población mexicana: interpreta el punto de corte con cautela.',
    'Tamizaje: no distingue tipos de demencia ni establece el diagnóstico.',
  ],
  licencia: { texto: 'RUDAS © Storey, Rowland, Basic, Conforti y Dickson. Huella registra solo los puntajes por dominio; usa el formato y las instrucciones oficiales.' },
  referencias: [
    { texto: 'Storey JE, Rowland JT, Basic D, Conforti DA, Dickson HG. The Rowland Universal Dementia Assessment Scale (RUDAS): a multicultural cognitive assessment scale. Int Psychogeriatr. 2004;16(1):13-31.', doi: '10.1017/s1041610204000043' },
    { texto: 'Rowland JT, Basic D, Storey JE, Conforti DA. The Rowland Universal Dementia Assessment Scale (RUDAS) and the Folstein MMSE in a multicultural cohort of elderly persons. Int Psychogeriatr. 2006;18(1):111-20.', doi: '10.1017/S1041610205003133' },
    { texto: 'Delgado-Álvarez A, et al. Conversion between the Rowland Universal Dementia Assessment Scale and Mini-Mental State Examination test scores in majority and minority populations. Brain Behav. 2024.', doi: '10.1002/brb3.3650' },
  ],
};
