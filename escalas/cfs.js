import { SUG } from './_comun.js';

const NIVELES = [
  ['1', 'Muy en forma', 'bien'],
  ['2', 'En forma', 'bien'],
  ['3', 'Manejándose bien', 'bien'],
  ['4', 'Fragilidad muy leve', 'leve'],
  ['5', 'Fragilidad leve', 'moderado'],
  ['6', 'Fragilidad moderada', 'moderado'],
  ['7', 'Fragilidad grave', 'grave'],
  ['8', 'Fragilidad muy grave', 'critico'],
  ['9', 'Enfermedad terminal', 'critico'],
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
  tipo: 'registro',
  aliases: ['Clinical Frailty Scale', 'Rockwood', 'fragilidad'],
  problemas: ['fragilidad', 'pronóstico', 'hospitalización', 'cuidados intensivos', 'cirugía'],
  descripcion: 'Registro del nivel (1 a 9) asignado con la escala oficial según el juicio clínico.',
  objetivo: 'Graduar la fragilidad mediante juicio clínico a partir de la funcionalidad, la comorbilidad y la actividad.',
  poblacion: 'Personas de 65 años o más (Rockwood, 2005; versión 2.0, Rockwood y Theou, 2020). No validada en menores de 65 años ni en discapacidad estable de larga evolución.',
  aplicacion: [
    'Consulta la escala oficial con sus descripciones y pictogramas (Dalhousie University).',
    'En enfermedad aguda, puntúa el estado basal de 2 semanas antes: usa el momento «Basal».',
    'En demencia, el nivel refleja la funcionalidad (leve 5, moderada 6, grave 7).',
  ],
  tiempo: '1 a 2 min',
  momentos: true,
  fuente: true,
  mayorEsMejor: false,
  unidadCambio: 'niveles',
  min: 1,
  max: 9,
  campos: [
    {
      id: 'nivel', texto: 'Nivel asignado con la escala oficial', textoCorto: 'nivel',
      opciones: NIVELES.map(([n, nombre]) => ({ texto: `${n} · ${nombre}`, valor: Number(n) })),
    },
  ],
  bandas: NIVELES.map(([n, nombre, nivel]) => {
    const k = Number(n);
    return {
      min: k,
      max: k,
      etiqueta: `Nivel ${n} · ${nombre}`,
      nivel,
      hallazgo: k >= 4,
      texto: k <= 3 ? 'Sin fragilidad.' : k === 9 ? 'Esperanza de vida menor de 6 meses; puede no tener otros datos de fragilidad.' : `Fragilidad (${nombre.toLowerCase()}). A partir del nivel 5 se considera fragilidad.`,
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
    return `CFS ${res.puntaje} (${res.banda.etiqueta.replace(/^Nivel \d · /, '').toLowerCase()})`;
  },
  detalleEnResumen: true,
  notas: [
    'Huella solo registra el nivel: las descripciones y pictogramas oficiales no se reproducen.',
    'Niveles 1–3 sin fragilidad; 4 fragilidad muy leve (antes «vulnerable»); 5–8 fragilidad leve a muy grave; 9 enfermedad terminal.',
    'Se basa en el juicio clínico. En el paciente agudo debe reflejar el estado basal, no el de la enfermedad actual.',
  ],
  licencia: { texto: 'CFS © Geriatric Medicine Research, Dalhousie University. Uso clínico sin fines de lucro con permiso del titular (portal de solicitud).', enlace: 'https://www.dal.ca/sites/gmr/our-tools/clinical-frailty-scale.html' },
  referencias: [
    { texto: 'Rockwood K, Song X, MacKnight C, et al. A global clinical measure of fitness and frailty in elderly people. CMAJ. 2005;173(5):489-95.', doi: '10.1503/cmaj.050051' },
    { texto: 'Rockwood K, Theou O. Using the Clinical Frailty Scale in allocating scarce health care resources. Can Geriatr J. 2020;23(3):210-5.', doi: '10.5770/cgj.23.463' },
  ],
};
