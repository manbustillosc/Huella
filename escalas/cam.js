import { SUG } from './_comun.js';

const rasgo = (id, texto, ayuda, textoCorto) => ({
  id, texto, ayuda, textoCorto,
  opciones: [
    { texto: 'Presente', valor: 1 },
    { texto: 'Ausente', valor: 0 },
  ],
});

const POSITIVO = {
  id: 'pos', rango: '1 + 2 + (3 o 4)', etiqueta: 'CAM positivo', nivel: 'critico', hallazgo: true,
  texto: 'Cumple el algoritmo CAM para delirium: inicio agudo o curso fluctuante e inatención, con pensamiento desorganizado o alteración del nivel de conciencia.',
  sugerencias: [
    'Confirmar clínicamente y buscar la causa: infección, fármacos, retención urinaria, estreñimiento, dolor, deshidratación, hipoxia y alteraciones metabólicas.',
    SUG.revisionFarmacos,
    'Iniciar medidas no farmacológicas (orientación, sueño, movilización, hidratación, lentes y auxiliares auditivos) y reevaluar a diario.',
  ],
};
const NEGATIVO = {
  id: 'neg', rango: 'Otra combinación', etiqueta: 'CAM negativo', nivel: 'bien',
  texto: 'No cumple el algoritmo CAM en esta evaluación. El delirium fluctúa: reevaluar si cambia el estado mental.',
  sugerencias: ['Reevaluar si hay cambios en el estado mental; considerar deterioro cognitivo previo si hubo hallazgos aislados.'],
};

export default {
  id: 'cam',
  nombre: 'Confusion Assessment Method (CAM)',
  corto: 'CAM',
  dominio: 'delirium',
  tipo: 'diagnostico',
  aliases: ['delirium', 'confusion', 'Inouye', 'sindrome confusional agudo'],
  problemas: ['delirium', 'confusión aguda', 'hospitalización', 'postoperatorio', 'urgencias'],
  descripcion: 'Algoritmo de 4 rasgos para identificar delirium: requiere 1 y 2, más 3 o 4.',
  objetivo: 'Identificar delirium mediante un algoritmo basado en los criterios diagnósticos, tras una evaluación cognitiva estructurada.',
  poblacion: 'Personas mayores hospitalizadas (Inouye, 1990); usado en hospital, urgencias y residencias. Existe una versión para UCI (CAM-ICU).',
  aplicacion: [
    'Antes de puntuar, realiza una evaluación cognitiva breve y estructurada (p. ej., orientación, atención con meses al revés o dígitos) y obtén información del cuidador o de enfermería.',
    'Marca cada rasgo como presente o ausente.',
    'Delirium según el algoritmo: rasgo 1 y rasgo 2, más el rasgo 3 o el 4.',
  ],
  tiempo: '5 min (después de la evaluación cognitiva)',
  permiteNoEvaluable: false,
  direccionClinica: 'sin_direccion',
  barra: false,
  campos: [
    rasgo('agudo', '1. Inicio agudo y curso fluctuante', 'Cambio agudo del estado mental respecto al basal, o conducta que fluctúa durante el día (aparece y desaparece, o aumenta y disminuye de intensidad).', 'inicio agudo y curso fluctuante'),
    rasgo('inatencion', '2. Inatención', 'Dificultad para enfocar la atención: se distrae con facilidad o le cuesta seguir lo que se le dice.', 'inatención'),
    rasgo('desorganizado', '3. Pensamiento desorganizado', 'Discurso incoherente o desorganizado, conversación irrelevante, ideas poco claras o ilógicas, cambios impredecibles de tema.', 'pensamiento desorganizado'),
    rasgo('conciencia', '4. Alteración del nivel de conciencia', 'Cualquier estado distinto de «alerta»: hiperalerta, somnoliento, estuporoso o en coma.', 'alteración del nivel de conciencia'),
  ],
  bandas: [POSITIVO, NEGATIVO],
  calcular({ v }) {
    const p = (id) => v[id].valor === 1;
    const positivo = p('agudo') && p('inatencion') && (p('desorganizado') || p('conciencia'));
    const presentes = ['agudo', 'inatencion', 'desorganizado', 'conciencia'].filter(p);
    return { banda: positivo ? POSITIVO : NEGATIVO, extras: { presentes } };
  },
  resumen(res) {
    const nombres = res.desglose.filter((d) => d.valor === 1).map((d) => d.campo.textoCorto);
    return `CAM ${res.banda.id === 'pos' ? 'positivo para delirium' : 'negativo'}${nombres.length ? ` (rasgos presentes: ${nombres.join(', ')})` : ' (sin rasgos presentes)'}.`;
  },
  resumenBreve(res) {
    return `CAM ${res.banda.id === 'pos' ? 'positivo para delirium' : 'negativo'}`;
  },
  detalleEnResumen: true,
  notas: [
    'Su exactitud depende del entrenamiento y de una evaluación cognitiva previa; sin ella, la sensibilidad disminuye.',
    'El resultado positivo indica que se cumple el algoritmo; la confirmación del diagnóstico y de su causa es clínica.',
    'Los rasgos se describen aquí de forma resumida. El instrumento completo (con su entrevista estructurada) está disponible en la red NIDUS y en el Hospital Elder Life Program.',
  ],
  licencia: { texto: 'Algoritmo publicado por Inouye et al. (1990). Instrumento estandarizado de NIDUS bajo licencia CC BY-NC-SA 4.0.', enlace: 'https://deliriumnetwork.org' },
  referencias: [
    { texto: 'Inouye SK, van Dyck CH, Alessi CA, et al. Clarifying confusion: the confusion assessment method. A new method for detection of delirium. Ann Intern Med. 1990;113(12):941-8.', doi: '10.7326/0003-4819-113-12-941' },
    { texto: 'NIDUS – Network for Investigation of Delirium: Unifying Scientists. Confusion Assessment Method (CAM), versión estandarizada.', enlace: 'https://deliriumnetwork.org' },
  ],
};
