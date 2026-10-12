import { SUG } from './_comun.js';
import { FIGURAS_CFS } from './cfs-figuras.js';

// Descripciones resumidas con redacción propia de Huella (no son el texto oficial de la escala).
const NIVELES = [
  ['1', 'Muy en forma', 'bien', 'Activa, vigorosa y motivada; se ejercita con regularidad. Su condición supera a la de la mayoría de las personas de su edad.'],
  ['2', 'En forma', 'bien', 'Sin síntomas de enfermedad activa, pero con menor condición que el nivel 1. Hace ejercicio o es muy activa por temporadas.'],
  ['3', 'Manejándose bien', 'bien', 'Sus problemas médicos están bien controlados, aunque tenga síntomas ocasionales. Fuera de caminar como parte de su rutina, no es regularmente activa.'],
  ['4', 'Fragilidad muy leve', 'leve', 'No depende de otros en su día a día, pero los síntomas limitan sus actividades. Suele referir que «va más lento» o que se cansa durante el día.'],
  ['5', 'Fragilidad leve', 'moderado', 'Lentitud evidente; necesita ayuda en actividades instrumentales exigentes (dinero, transporte, labores pesadas de la casa). Poco a poco le cuesta comprar y salir sola, preparar la comida, manejar sus medicamentos y hacer el quehacer.'],
  ['6', 'Fragilidad moderada', 'moderado', 'Necesita ayuda en todas las actividades fuera de casa y para mantener el hogar. Dentro de casa le cuestan las escaleras, necesita ayuda para bañarse y puede requerir indicaciones para vestirse.'],
  ['7', 'Fragilidad grave', 'grave', 'Depende por completo de otros para su cuidado personal, por causa física o cognitiva. Aun así, se ve estable y sin alto riesgo de morir en los próximos 6 meses.'],
  ['8', 'Fragilidad muy grave', 'critico', 'Dependencia total; se acerca al final de la vida. Por lo general no se recupera ni de una enfermedad menor.'],
  ['9', 'Enfermedad terminal', 'critico', 'Esperanza de vida menor de 6 meses, sin otros datos evidentes de fragilidad grave: puede seguir activa hasta poco antes de morir.'],
];

const SUG_FRAGIL = [
  'Valoración geriátrica integral para identificar causas tratables y establecer objetivos de atención.',
  SUG.revisionFarmacos,
  'Considerar la fragilidad en decisiones de tratamiento invasivo, cirugía o ingreso a cuidados intensivos, junto con los valores y preferencias de la persona.',
];

export default {
  id: 'cfs',
  nombre: 'Escala Clínica de Fragilidad (CFS) versión 2.0',
  corto: 'CFS',
  dominio: 'fragilidad',
  tipo: 'estadificacion',
  registro: true,
  aliases: ['Clinical Frailty Scale', 'Rockwood', 'fragilidad'],
  problemas: ['fragilidad', 'pronóstico', 'hospitalización', 'cuidados intensivos', 'cirugía'],
  descripcion: 'Nivel de fragilidad de 1 a 9 por juicio clínico, con figuras y descripciones de cada nivel.',
  objetivo: 'Graduar la fragilidad mediante juicio clínico a partir de la funcionalidad, la comorbilidad y la actividad.',
  poblacion: 'Personas de 65 años o más (Rockwood, 2005; versión 2.0, Rockwood y Theou, 2020). No validada en menores de 65 años ni en discapacidad estable de larga evolución.',
  aplicacion: [
    'Elige el nivel que mejor describe a la persona según su funcionalidad, comorbilidad y actividad habituales.',
    'En enfermedad aguda, puntúa el estado basal de 2 semanas antes: usa el momento «Basal».',
    'En demencia, el nivel refleja la funcionalidad (leve 5, moderada 6, grave 7).',
    'Ante la duda, consulta la escala oficial de Dalhousie University (puedes guardarla en «Tu hoja oficial»).',
  ],
  tiempo: '1 a 2 min',
  momentos: true,
  fuente: true,
  direccionClinica: 'menor_mejor',
  unidadCambio: ['nivel', 'niveles'],
  textoMejoria: 'menor grado de fragilidad registrado, sujeto a interpretación clínica',
  textoEmpeoramiento: 'mayor grado de fragilidad registrado',
  min: 1,
  max: 9,
  campos: [
    {
      id: 'nivel', texto: 'Nivel que mejor describe a la persona', textoCorto: 'nivel',
      ayuda: 'En demencia, el nivel corresponde a su gravedad: leve (olvida detalles de sucesos recientes, repite preguntas o historias, se aísla) = 5; moderada (memoria reciente muy afectada; se cuida con indicaciones y supervisión) = 6; grave (necesita que otros la cuiden) = 7.',
      opciones: NIVELES.map(([n, nombre, , desc]) => ({ texto: `${n} · ${nombre}`, valor: Number(n), detalle: desc, figura: FIGURAS_CFS[n] })),
    },
  ],
  bandas: NIVELES.map(([n, nombre, nivel, desc]) => {
    const k = Number(n);
    return {
      min: k,
      max: k,
      etiqueta: `Nivel ${n}: ${nombre.toLowerCase()}`,
      nivel,
      hallazgo: k >= 4,
      figura: FIGURAS_CFS[n],
      texto: `${desc} ${k <= 3 ? 'Sin fragilidad.' : k === 9 ? 'Se clasifica por el pronóstico, no por la funcionalidad.' : k === 4 ? 'Fragilidad muy leve (antes «vulnerable»).' : 'A partir del nivel 5 se considera fragilidad.'}`,
      sugerencias: k >= 5 ? SUG_FRAGIL : k === 4 ? [SUG.ejercicio] : [],
    };
  }),
  calcular({ v }) {
    return { puntaje: v.nivel.valor, max: 9, sufijo: '/ 9' };
  },
  resumen(res) {
    return `CFS: ${res.banda.etiqueta.toLowerCase()}.`;
  },
  resumenBreve(res) {
    return `CFS ${res.puntaje}/9 (${res.banda.etiqueta.replace(/^Nivel \d: /, '')})`;
  },
  detalleEnResumen: true,
  notas: [
    'Las descripciones de cada nivel son un resumen con redacción propia y las figuras son ilustraciones originales de Huella: no reproducen el texto ni los pictogramas oficiales.',
    'Niveles 1–3 sin fragilidad; 4 fragilidad muy leve (antes «vulnerable»); 5–8 fragilidad leve a muy grave; 9 enfermedad terminal.',
    'Se basa en el juicio clínico. En el paciente agudo debe reflejar el estado basal, no el de la enfermedad actual.',
  ],
  licencia: { texto: 'CFS © Geriatric Medicine Research, Dalhousie University. Huella muestra un resumen de cada nivel con redacción propia y figuras originales; el texto y los pictogramas oficiales se obtienen del titular (uso clínico sin fines de lucro con su permiso).', enlace: 'https://www.dal.ca/sites/gmr/our-tools/clinical-frailty-scale.html' },
  referencias: [
    { texto: 'Rockwood K, Song X, MacKnight C, et al. A global clinical measure of fitness and frailty in elderly people. CMAJ. 2005;173(5):489-95.', doi: '10.1503/cmaj.050051' },
    { texto: 'Rockwood K, Theou O. Using the Clinical Frailty Scale in allocating scarce health care resources. Can Geriatr J. 2020;23(3):210-5.', doi: '10.5770/cgj.23.463' },
  ],
};
