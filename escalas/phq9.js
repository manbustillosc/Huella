import { REF_INGER_2022, NOTA_INGER } from './_comun.js';

const FRECUENCIA = [
  { texto: 'Ningún día', valor: 0 },
  { texto: 'Varios días', valor: 1 },
  { texto: 'Más de la mitad de los días', valor: 2 },
  { texto: 'Casi todos los días', valor: 3 },
];
const reactivo = (id, n, texto, textoCorto) => ({ id, texto: `${n}. ${texto}`, textoCorto, opciones: FRECUENCIA });

const ITEMS = [
  reactivo('interes', 1, 'Poco interés o placer en hacer cosas', 'poco interés o placer'),
  reactivo('animo', 2, 'Se ha sentido decaído(a), deprimido(a) o sin esperanzas', 'ánimo decaído o desesperanza'),
  reactivo('sueno', 3, 'Ha tenido dificultad para quedarse o permanecer dormido(a), o ha dormido demasiado', 'alteración del sueño'),
  reactivo('energia', 4, 'Se ha sentido cansado(a) o con poca energía', 'cansancio o poca energía'),
  reactivo('apetito', 5, 'Sin apetito o ha comido en exceso', 'alteración del apetito'),
  reactivo('culpa', 6, 'Se ha sentido mal con usted mismo(a) – o que es un fracaso o que ha quedado mal con usted mismo(a) o con su familia', 'sentimientos de fracaso o culpa'),
  reactivo('concentracion', 7, 'Ha tenido dificultad para concentrarse en ciertas actividades, tales como leer el periódico o ver la televisión', 'dificultad para concentrarse'),
  reactivo('psicomotor', 8, '¿Se ha movido o hablado tan lento que otras personas podrían haberlo notado? o lo contrario – muy inquieto(a) o agitado(a) que ha estado moviéndose mucho más de lo normal', 'lentitud o inquietud psicomotora'),
  reactivo('muerte', 9, 'Pensamientos de que estaría mejor muerto(a) o de lastimarse de alguna manera', 'pensamientos de muerte o de lastimarse'),
];
const IDS = ITEMS.map((c) => c.id);
const RESTO = IDS.slice(2);

// PHQ-2 = reactivos 1 y 2 del PHQ-9. Con 2 o más se completa el PHQ-9 (Levis, 2020: PHQ-2 ≥2 seguido de PHQ-9 ≥10
// tiene la misma sensibilidad que el PHQ-9 solo y evita aplicar las 9 preguntas a más de la mitad de las personas).
export const CORTE_PHQ2 = 2;
const contestado = (r, id) => r[id] != null && r[id] !== '';
export const puntajePhq2 = (r) => (contestado(r, 'interes') && contestado(r, 'animo') ? Number(r.interes) + Number(r.animo) : null);
// Se aplican las 9 preguntas si el PHQ-2 es positivo, si el médico decide completarlo, o en resultados guardados antes de
// la versión 2.11.1 (tienen las 9 respuestas y no tienen la decisión «completo»).
export function aplicaPhq9(r) {
  const p2 = puntajePhq2(r);
  if (p2 == null) return false;
  if (p2 >= CORTE_PHQ2) return true;
  if (contestado(r, 'completo')) return Number(r.completo) === 1;
  return RESTO.some((id) => contestado(r, id));
}

export const ALERTA_REACTIVO_9 = 'Reactivo 9 positivo (pensamientos de muerte o de lastimarse): evaluar hoy, de forma directa, la ideación suicida, el plan, el acceso a medios y los factores protectores. Un reactivo positivo no equivale a un diagnóstico de riesgo suicida, pero no debe quedar sin evaluación clínica.';

const SUG_POSITIVO = [
  'Entrevista clínica para confirmar o descartar un trastorno depresivo (criterios DSM-5-TR); el tamizaje no establece el diagnóstico.',
  'Buscar factores contribuyentes: dolor, enfermedad médica, fármacos, duelo, aislamiento, consumo de alcohol o deterioro cognitivo.',
  'Si se confirma, acordar el tratamiento y repetir el PHQ-9 para seguir la respuesta.',
];

const B_PHQ2 = {
  id: 'phq2neg', rango: 'PHQ-2 de 0 a 1', etiqueta: 'PHQ-2 negativo', nivel: 'bien',
  texto: 'PHQ-2 de 0 o 1: tamizaje negativo; no hace falta completar las 7 preguntas restantes del PHQ-9. No descarta depresión si hay sospecha clínica.',
  sugerencias: [],
};

export default {
  id: 'phq9',
  nombre: 'Cuestionario sobre la salud del paciente (PHQ-2 y PHQ-9)',
  corto: 'PHQ-2/9',
  dominio: 'afectivo',
  tipo: 'tamizaje',
  aliases: ['Patient Health Questionnaire', 'PHQ', 'PHQ-2', 'PHQ2', 'PHQ-9', 'PHQ9', 'PHQ-2/9', 'depresion', 'animo', 'ideacion suicida'],
  problemas: ['depresión', 'tristeza', 'ánimo bajo', 'insomnio', 'ideación suicida', 'seguimiento del tratamiento'],
  descripcion: 'Síntomas depresivos de las últimas 2 semanas: empieza con las 2 preguntas del PHQ-2 y, si suman 2 o más, completa las 9 del PHQ-9 (0 a 27).',
  objetivo: 'Detectar síntomas depresivos con el PHQ-2 y, si es positivo, graduar su intensidad con el PHQ-9 y seguir la respuesta al tratamiento. No establece el diagnóstico de depresión.',
  poblacion: 'Adultos y personas mayores en atención primaria y consulta (Kroenke, 2001; guía del INGER, 2022). Con deterioro cognitivo moderado o grave pierde fiabilidad: considera la escala de Cornell.',
  aplicacion: [
    'Explica que harás preguntas sobre cómo se ha sentido solo durante las últimas dos semanas.',
    'Lee cada pregunta en orden y registra la frecuencia: ningún día (0), varios días (1), más de la mitad de los días (2), casi todos los días (3).',
    'Las 2 primeras preguntas son el PHQ-2. Si suman 2 o más, aparecen las 7 restantes del PHQ-9. Si suman 0 o 1, termina ahí, salvo que decidas aplicar las 9 (por ejemplo, para seguir un tratamiento).',
    'Si alguna respuesta es mayor de 0, haz la pregunta final sobre la dificultad que le han causado los problemas (no suma puntos).',
    'Si el reactivo 9 es positivo, evalúa la ideación suicida en ese mismo momento.',
  ],
  tiempo: '1 a 3 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'reducción de síntomas depresivos',
  textoEmpeoramiento: 'aumento de síntomas depresivos',
  textoEmpeoradas: 'síntomas que aumentaron',
  min: 0,
  max: 27,
  siguientes: [
    { id: 'cornell', si: (res) => Boolean(res.noEvaluable), motivo: 'Si el deterioro cognitivo impide responder: síntomas depresivos con informante.' },
  ],
  campos: [
    { ...ITEMS[0], grupo: 'PHQ-2' },
    ITEMS[1],
    {
      id: 'completo', texto: 'PHQ-2 negativo: ¿aplicar también las 7 preguntas restantes?', textoCorto: 'aplicar el PHQ-9 completo', puntua: false,
      secundario: true, opcional: true,
      visibleSi: (r) => { const p2 = puntajePhq2(r); return p2 != null && p2 < CORTE_PHQ2; },
      opciones: [
        { texto: 'No: terminar con el PHQ-2', valor: 0 },
        { texto: 'Sí: aplicar las 9 preguntas (p. ej., para seguir un tratamiento)', valor: 1 },
      ],
    },
    ...ITEMS.slice(2).map((c, i) => ({ ...c, ...(i === 0 ? { grupo: 'PHQ-9: 7 preguntas restantes' } : {}), visibleSi: aplicaPhq9 })),
    {
      id: 'dificultad', texto: 'Si marcó cualquiera de los problemas, ¿qué tanta dificultad le han dado estos problemas para hacer su trabajo, encargarse de las tareas del hogar, o llevarse bien con otras personas?',
      textoCorto: 'dificultad funcional', puntua: false,
      opciones: [
        { texto: 'No ha sido difícil', valor: 0 },
        { texto: 'Un poco difícil', valor: 1 },
        { texto: 'Muy difícil', valor: 2 },
        { texto: 'Extremadamente difícil', valor: 3 },
      ],
      visibleSi: (r) => aplicaPhq9(r) && IDS.some((id) => Number(r[id]) > 0),
    },
  ],
  bandas: [
    B_PHQ2,
    { min: 0, max: 4, etiqueta: 'Síntomas depresivos mínimos o ausentes', nivel: 'bien', texto: 'Tamizaje negativo: síntomas depresivos mínimos o ausentes. No descarta depresión si hay sospecha clínica.', sugerencias: [] },
    {
      min: 5, max: 9, etiqueta: 'Síntomas depresivos leves', nivel: 'leve',
      texto: 'Síntomas depresivos leves, por debajo del punto de corte de tamizaje (≥10).',
      sugerencias: ['Vigilar la evolución y repetir el PHQ-9; explorar factores contribuyentes.'],
    },
    { min: 10, max: 14, etiqueta: 'Síntomas depresivos moderados', nivel: 'moderado', hallazgo: true, texto: 'Tamizaje positivo (≥10): síntomas depresivos moderados. Requiere entrevista clínica.', sugerencias: SUG_POSITIVO },
    { min: 15, max: 19, etiqueta: 'Síntomas depresivos moderados a graves', nivel: 'grave', hallazgo: true, texto: 'Tamizaje positivo: síntomas depresivos moderados a graves. Requiere entrevista clínica.', sugerencias: SUG_POSITIVO },
    { min: 20, max: 27, etiqueta: 'Síntomas depresivos graves', nivel: 'critico', hallazgo: true, texto: 'Tamizaje positivo: síntomas depresivos graves. Requiere entrevista clínica pronta.', sugerencias: SUG_POSITIVO },
  ],
  calcular({ v, r }) {
    if (!aplicaPhq9(r)) {
      const p2 = v.interes.valor + v.animo.valor;
      const lineas = [`PHQ-2: ${p2} de 6 (poco interés o placer ${v.interes.valor}; ánimo decaído ${v.animo.valor}). Menos de ${CORTE_PHQ2}: no se aplicaron las 7 preguntas restantes del PHQ-9.`];
      return { banda: B_PHQ2, puntaje: null, mostrar: `${p2}/6`, sufijo: 'PHQ-2', lineas, lineasNota: lineas, extras: { modo: 'phq2', phq2: p2, positivo: false, reactivo9: 0 } };
    }
    const puntaje = IDS.reduce((s, id) => s + v[id].valor, 0);
    const muerte = v.muerte.valor;
    const alertas = muerte > 0 ? [ALERTA_REACTIVO_9] : [];
    const lineas = [puntaje >= 10 ? 'Tamizaje positivo (punto de corte ≥10).' : 'Tamizaje negativo (punto de corte ≥10).'];
    if (v.dificultad) lineas.push(`Dificultad funcional referida: ${v.dificultad.texto.toLowerCase()}.`);
    if (muerte > 0) lineas.push(`Reactivo 9: ${v.muerte.texto.toLowerCase()}.`);
    const conPuntos = ITEMS.filter((c) => v[c.id].valor > 0).map((c) => `${c.textoCorto} ${v[c.id].valor}`);
    const lineasNota = [conPuntos.length ? `Reactivos con puntos: ${conPuntos.join('; ')}.` : 'Sin reactivos con puntos.'];
    if (v.dificultad) lineasNota.push(`Dificultad funcional: ${v.dificultad.texto.toLowerCase()}.`);
    const p2 = v.interes.valor + v.animo.valor;
    lineas.push(p2 >= CORTE_PHQ2 ? `PHQ-2: ${p2} de 6 (positivo): por eso se completó el PHQ-9.` : `PHQ-2: ${p2} de 6; se aplicaron las 9 preguntas por decisión del médico.`);
    return { puntaje, alertas, lineas, lineasNota, extras: { modo: 'phq9', phq2: p2, reactivo9: muerte, positivo: puntaje >= 10 } };
  },
  comparable(antes, despues) {
    const a = antes.extras?.modo || 'phq9';
    const d = despues.extras?.modo || 'phq9';
    return a !== d ? { advertencia: 'Una aplicación terminó con el PHQ-2 y la otra completó el PHQ-9: solo se compara la categoría.' } : null;
  },
  resumen(res) {
    if (res.extras.modo === 'phq2') return `PHQ-2/9: PHQ-2 de ${res.extras.phq2}/6, negativo (se completa el PHQ-9 con ${CORTE_PHQ2} o más).`;
    const r9 = res.extras.reactivo9 > 0 ? '; reactivo 9 positivo: requiere evaluación de ideación suicida' : '';
    return `PHQ-2/9: PHQ-9 de ${res.puntaje}/27 (${res.banda.etiqueta.toLowerCase()}; tamizaje ${res.extras.positivo ? 'positivo' : 'negativo'}${r9}).`;
  },
  resumenBreve(res) {
    if (res.extras.modo === 'phq2') return `PHQ-2 ${res.extras.phq2}/6 (negativo)`;
    return `PHQ-9 ${res.puntaje}/27 (${res.banda.etiqueta.toLowerCase()}${res.extras.reactivo9 > 0 ? '; reactivo 9 positivo' : ''})`;
  },
  detalleEnResumen: true,
  notas: [
    'Tamizaje, no diagnóstico. Punto de corte ≥10: sensibilidad y especificidad de 0.85 para depresión mayor en el metaanálisis de datos individuales de Negeri (2021), citado por la guía del INGER (2022).',
    'PHQ-2 (reactivos 1 y 2, de 0 a 6): con 2 o más se completa el PHQ-9. En el metaanálisis de Levis (2020), PHQ-2 ≥2 seguido de PHQ-9 ≥10 tuvo una sensibilidad similar a la del PHQ-9 solo (0.82 frente a 0.86), una especificidad un poco mayor (0.87 frente a 0.85) y evitó aplicar las 9 preguntas al 57 % de las personas. El corte clásico del PHQ-2 usado solo es 3 o más (Kroenke, 2003).',
    'Las categorías de intensidad son las de Kroenke (2001) y la guía del INGER: 0–4, 5–9, 10–14, 15–19 y 20–27.',
    'Un reactivo 9 positivo obliga a evaluar el riesgo de suicidio, pero no equivale a riesgo alto ni a un diagnóstico: muchas personas mayores responden pensando en la muerte sin ideación activa.',
    'Validado en población mexicana rural adulta (Arrieta, 2017); con deterioro cognitivo moderado o grave, afasia o delirium su fiabilidad disminuye.',
    'El PHQ-9 y la GDS-15 miden síntomas depresivos con enfoques distintos: no es necesario aplicar ambos.',
    NOTA_INGER,
  ],
  licencia: { texto: 'PHQ-2 y PHQ-9 desarrollados por Spitzer, Williams, Kroenke y colegas con una beca educativa de Pfizer Inc.; no requiere permiso para reproducirlo, traducirlo o distribuirlo.', enlace: 'https://www.phqscreeners.com' },
  referencias: [
    { texto: 'Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):606-13.', doi: '10.1046/j.1525-1497.2001.016009606.x' },
    { texto: 'Kroenke K, Spitzer RL, Williams JB. The Patient Health Questionnaire-2: validity of a two-item depression screener. Med Care. 2003;41(11):1284-92.', doi: '10.1097/01.MLR.0000093487.78664.3C' },
    { texto: 'Levis B, Sun Y, He C, et al. Accuracy of the PHQ-2 alone and in combination with the PHQ-9 for screening to detect major depression: systematic review and meta-analysis. JAMA. 2020;323(22):2290-2300.', doi: '10.1001/jama.2020.6504' },
    { texto: 'Negeri ZF, Levis B, Sun Y, et al. Accuracy of the Patient Health Questionnaire-9 for screening to detect major depression: updated systematic review and individual participant data meta-analysis. BMJ. 2021;375:n2183.', doi: '10.1136/bmj.n2183' },
    { texto: 'Arrieta J, Aguerrebere M, Raviola G, et al. Validity and utility of the Patient Health Questionnaire (PHQ)-2 and PHQ-9 for screening and diagnosis of depression in rural Chiapas, Mexico: a cross-sectional study. J Clin Psychol. 2017;73(9):1076-90.', doi: '10.1002/jclp.22390' },
    REF_INGER_2022,
  ],
};
