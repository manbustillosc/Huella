// ICOPE: los seis dominios de la capacidad intrínseca, su estado en la valoración en curso,
// la evaluación detallada sugerida (paso 2), las intervenciones orientativas del manual y el texto del informe.
// Sin puntaje global: cada dominio se informa por separado (manual ICOPE, OPS 2025).
import { porId } from './datos.js';
import { ordenarCronologico, vigenteDe, compararResultados, textoCambio, textoRespectoA, fechaCorta, diasEntre } from './comparacion.js';
import { valorGuardado } from './nota.js';
import { minusculaInicial } from './motor.js';
import { planDe, problemaDe, lineasPlan, ESTADOS_PROBLEMA, PRIORIDADES, nombreDe } from './plan.js';
import { NECESIDADES_ICOPE, LICENCIA_ICOPE } from '../escalas/icope.js';

export { NECESIDADES_ICOPE, LICENCIA_ICOPE };
export const RUTA_ICOPE = 'icope';
export const ENLACE_ICOPE = 'https://doi.org/10.37774/9789275330319';

export const ESTADOS_ICOPE = {
  pendiente: { nombre: 'Pendiente', nivel: 'neutro' },
  conservado: { nombre: 'Conservado', nivel: 'bien' },
  alterado: { nombre: 'Alterado', nivel: 'moderado' },
  no_evaluable: { nombre: 'No evaluable', nivel: 'neutro' },
};

export const DOMINIOS_ICOPE = [
  {
    id: 'cognicion', nombre: 'Cognición', corto: 'Cognición', escala: 'icope-cog', icono: 'cognitivo', meses: 12,
    detallada: {
      texto: 'Usa una herramienta validada localmente (cuadro 5.1 del manual): elige una según la escolaridad y el idioma; no apliques varias de forma automática.',
      elegir: ['minicog', 'moca', 'rudas'],
      antes: [{ id: '4at', nota: 'Si hay un cambio agudo o fluctuante del estado mental, descarta delirium antes de interpretar la cognición.' }],
      complementarios: [{ id: 'lawton', nota: 'Repercusión en las actividades instrumentales.' }],
      planeadas: ['MMSE (registro)', 'GPCOG'],
    },
    intervenciones: [
      { categoria: 'ejercicio', texto: 'Ejercicio físico multimodal, que también favorece la cognición.' },
      { categoria: 'cognicion', texto: 'Estimulación cognitiva o entrenamiento cognitivo si el deterioro es probable.' },
      { categoria: 'cognicion', texto: 'Asesoramiento sobre estilo de vida para reducir el riesgo de deterioro cognitivo (actividad física, participación social y factores de riesgo cardiovascular).' },
      { categoria: 'farmacologica', texto: 'Revisión de la medicación que puede afectar la cognición.' },
      { categoria: 'cuidador', texto: 'Asesoramiento y apoyo a la persona a cargo del cuidado.' },
      { categoria: 'referencia', texto: 'Si el deterioro afecta la autonomía: evaluación de demencia (guía mhGAP) o referencia especializada.' },
    ],
  },
  {
    id: 'locomotora', nombre: 'Capacidad locomotora', corto: 'Locomotora', escala: 'icope-loc', icono: 'caidas', meses: 12,
    detallada: {
      texto: 'El manual usa como ejemplo la SPPB: 0 a 9 puntos, movilidad limitada; 10 a 12, movilidad normal. Si ya está registrada, se reutiliza.',
      elegir: ['sppb'],
      alternativas: ['velocidad', 'tug'],
      complementarios: [{ id: 'tinetti', nota: 'Equilibrio y marcha por separado si hay caídas o inestabilidad.' }],
      planeadas: [],
    },
    intervenciones: [
      { categoria: 'ejercicio', texto: 'Programa de ejercicio multimodal (con supervisión estrecha si la movilidad es limitada).' },
      { categoria: 'nutricion', texto: 'Valorar la posibilidad de aumentar la ingesta de proteínas.' },
      { categoria: 'farmacologica', texto: 'Revisión de la medicación que puede afectar la movilidad.' },
      { categoria: 'caidas', texto: 'Reducir el riesgo de caídas en el hogar y valorar productos de apoyo para la movilidad.' },
      { categoria: 'referencia', texto: 'Rehabilitación si hay una pérdida importante de la capacidad o multimorbilidad.' },
      { categoria: 'otra', texto: 'Manejo del dolor y de las afecciones musculoesqueléticas que limitan la movilidad.' },
    ],
  },
  {
    id: 'vitalidad', nombre: 'Vitalidad', corto: 'Vitalidad', escala: 'icope-vit', icono: 'nutricion', meses: 12,
    detallada: {
      texto: 'Evalúa el estado nutricional sin análisis de sangre; el manual cita MNA, MUST, SCREEN II y SNAQ65+.',
      elegir: ['mnasf'],
      complementarios: [{ id: 'sarcf', nota: 'Si hay debilidad o pérdida de fuerza: tamizaje de sarcopenia.' }],
      planeadas: ['MUST'],
    },
    intervenciones: [
      { categoria: 'nutricion', texto: 'Asesoramiento dietético personalizado y registro de los patrones alimentarios.' },
      { categoria: 'nutricion', texto: 'Seguimiento estrecho del peso y de la ingesta.' },
      { categoria: 'nutricion', texto: 'Valorar suplementos nutricionales orales si hay desnutrición o si la ingesta no mejora (decisión clínica).' },
      { categoria: 'ejercicio', texto: 'Ejercicio multimodal.' },
      { categoria: 'oral', texto: 'Promover la salud bucodental y valorar problemas para masticar o deglutir.' },
      { categoria: 'social', texto: 'Apoyo para el acceso, la preparación y la provisión de alimentos.' },
    ],
  },
  {
    id: 'vision', nombre: 'Visión', corto: 'Visión', escala: 'icope-vis', icono: 'delirium', meses: 12, mesesMax: 24,
    detallada: {
      texto: 'La evaluación detallada es una evaluación integral visual y ocular por personal capacitado. Registra aquí su resultado cuando lo tengas.',
      elegir: [],
      externo: 'Evaluación integral visual y ocular',
      planeadas: [],
    },
    intervenciones: [
      { categoria: 'referencia', texto: 'Referencia para evaluación integral visual y ocular, y revisión de la graduación de las gafas.' },
      { categoria: 'sensorial', texto: 'Proveer gafas de lectura si ve N6 solo con gafas de lectura.' },
      { categoria: 'referencia', texto: 'Revisión periódica de la retina si hay diabetes o hipertensión.' },
      { categoria: 'sensorial', texto: 'Productos de apoyo para la baja visión y mejor iluminación.' },
      { categoria: 'caidas', texto: 'Adaptar el hogar y sus alrededores para reducir el riesgo de caídas.' },
    ],
  },
  {
    id: 'audicion', nombre: 'Audición', corto: 'Audición', escala: 'icope-aud', icono: 'oido', meses: 12, mesesMax: 24,
    detallada: {
      texto: 'La evaluación detallada incluye otoscopia (tratar el tapón de cerumen y repetir la prueba) y audiometría diagnóstica. Registra aquí su resultado cuando lo tengas.',
      elegir: [],
      externo: 'Otoscopia y audiometría diagnóstica',
      planeadas: [],
    },
    intervenciones: [
      { categoria: 'referencia', texto: 'Referencia para otoscopia y audiometría diagnóstica.' },
      { categoria: 'sensorial', texto: 'Valorar audífonos u otros productos de apoyo auditivo.' },
      { categoria: 'sensorial', texto: 'Estrategias de comunicación para la persona y su entorno.' },
      { categoria: 'farmacologica', texto: 'Revisar medicamentos ototóxicos.' },
      { categoria: 'sensorial', texto: 'Adaptaciones en el hogar (alarmas luminosas o vibratorias, amplificadores).' },
    ],
  },
  {
    id: 'psicologica', nombre: 'Capacidad psicológica', corto: 'Psicológica', escala: 'icope-psi', icono: 'afectivo', meses: 12,
    detallada: {
      texto: 'Evalúa los síntomas depresivos con una herramienta (el manual cita el PHQ-9; la GDS-15 es una alternativa): elige una. Un tamizaje positivo no es un diagnóstico; sigue la guía mhGAP.',
      elegir: ['phq9', 'gds15'],
      complementarios: [{ id: 'cornell', nota: 'Con informante si el deterioro cognitivo impide responder la GDS-15 o el PHQ-9.' }],
      planeadas: [],
    },
    intervenciones: [
      { categoria: 'mental', texto: 'Manejo del estrés y técnicas de relajación.' },
      { categoria: 'mental', texto: 'Psicoeducación para la persona y quien la cuida.' },
      { categoria: 'mental', texto: 'Intervenciones psicológicas estructuradas breves.' },
      { categoria: 'referencia', texto: 'Evaluar el riesgo de suicidio; si es inminente, referencia inmediata.' },
      { categoria: 'social', texto: 'Actividad física y participación social.' },
      { categoria: 'farmacologica', texto: 'Revisión de la medicación que puede contribuir a los síntomas.' },
    ],
  },
];
export const dominioIcope = (id) => DOMINIOS_ICOPE.find((d) => d.id === id) || null;

// Necesidades adicionales (no son dominios de la capacidad intrínseca).
export const FACTORES = {
  id: 'factores', nombre: 'Necesidades adicionales', escala: 'icope-fac',
  relacionados: [
    { id: 'tug', tema: 'Riesgo de caídas', nota: 'Movilidad y riesgo de caídas.' },
    { id: 'tinetti', tema: 'Riesgo de caídas', nota: 'Equilibrio y marcha.' },
    { id: 'gijon', tema: 'Riesgo social', nota: 'Familia, economía, vivienda, relaciones y apoyo.' },
    { id: 'zarit', tema: 'Persona a cargo del cuidado', nota: 'Sobrecarga de quien cuida.' },
  ],
  intervenciones: [
    { categoria: 'social', texto: 'Referencia a Trabajo Social o a servicios comunitarios (prescripción social).' },
    { categoria: 'cuidador', texto: 'Apoyo a quien cuida: capacitación, relevo y apoyo psicosocial.' },
    { categoria: 'continencia', texto: 'Evaluar y tratar la incontinencia urinaria (ejercicios del suelo pélvico, factores contribuyentes).' },
    { categoria: 'caidas', texto: 'Evaluación multifactorial del riesgo de caídas y adaptación del hogar.' },
    { categoria: 'otra', texto: 'Confirmar la presión arterial en otra consulta y valorar los factores de riesgo cardiovascular.' },
  ],
};

export const ambitoIcope = (id) => `icope:${id}`;
export function nombreAmbitoIcope(ambito) {
  const id = String(ambito).replace(/^icope:/, '');
  if (id === 'factores') return FACTORES.nombre;
  return dominioIcope(id)?.nombre || id;
}
export const AMBITOS_ICOPE = [...DOMINIOS_ICOPE.map((d) => ambitoIcope(d.id)), ambitoIcope('factores')];

export const icopeDe = (v) => ({ detalle: {}, ...(v?.icope || {}) });

const mas = (iso, meses) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + meses);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const estadoDeResultado = (r) => (!r ? 'pendiente' : r.noEvaluable ? 'no_evaluable' : r.hallazgo ? 'alterado' : 'conservado');
const hallazgoDe = (r) => (r.noEvaluable ? `no evaluable (${minusculaInicial(r.noEvaluable)})` : r.extras?.hallazgo || minusculaInicial(r.etiqueta || ''));

// Resultado vigente de un instrumento en la valoración, o null.
function vigente(v, id) {
  const rs = v.resultados.filter((r) => r.escalaId === id);
  return rs.length ? vigenteDe(rs) : null;
}

// Categoría del esquema de atención ICOPE para la SPPB (capítulo 6): 0–9 movilidad limitada; 10–12 normal.
export function categoriaSppbIcope(r) {
  if (!r || r.noEvaluable || !Number.isFinite(r.puntaje)) return '';
  return r.puntaje <= 9 ? 'movilidad limitada en el esquema ICOPE (0 a 9)' : 'movilidad normal en el esquema ICOPE (10 a 12)';
}

function textoInstrumento(r) {
  const e = porId[r.escalaId];
  const extra = r.escalaId === 'sppb' ? categoriaSppbIcope(r) : '';
  return `${e.corto} ${valorGuardado(r)}${extra ? `; ${extra}` : ''} (${fechaCorta(r.fecha)})`;
}

// Estado completo de un dominio ICOPE en la valoración en curso.
export function estadoDominio(dom, v, hoy) {
  const rs = v.resultados.filter((r) => r.escalaId === dom.escala);
  const lista = ordenarCronologico(rs);
  const vig = rs.length ? vigenteDe(rs) : null;
  const iv = lista.indexOf(vig);
  const previo = iv > 0 ? lista[iv - 1] : null;
  const estado = estadoDeResultado(vig);
  const plan = planDe(v);
  const ambito = ambitoIcope(dom.id);
  const det = dom.detallada;
  const ids = [...(det.antes || []).map((x) => x.id), ...det.elegir, ...(det.alternativas || []), ...(det.complementarios || []).map((x) => x.id)];
  const detallada = ids.filter((id) => porId[id]).map((id) => ({ id, r: vigente(v, id) }));
  const hechas = detallada.filter((x) => x.r && !x.r.noEvaluable && (det.elegir.includes(x.id) || (det.alternativas || []).includes(x.id)));
  const externas = (icopeDe(v).detalle[dom.id] || []).slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const problema = problemaDe(plan, ambito);

  let necesidad;
  if (estado === 'pendiente') necesidad = { tipo: 'basica', texto: 'Falta la evaluación básica.' };
  else if (estado === 'no_evaluable') necesidad = { tipo: 'detallada', texto: 'Evaluación básica no evaluable: considera la evaluación detallada directamente o repetirla cuando sea posible.' };
  else if (estado === 'alterado') {
    necesidad = hechas.length || externas.length
      ? { tipo: 'hecha', texto: `Evaluación detallada registrada: ${[...hechas.map((x) => textoInstrumento(x.r)), ...externas.slice(0, 1).map((x) => `${x.prueba} (${fechaCorta(x.fecha)})`)].join('; ')}.` }
      : { tipo: 'detallada', texto: `Pendiente: evaluación detallada (paso 2)${det.externo ? `: ${det.externo.toLowerCase()}` : ''}.` };
  } else {
    const desde = mas(vig.fecha, dom.meses);
    necesidad = { tipo: 'ninguna', texto: `No requiere evaluación detallada. Repetir la evaluación básica ${dom.mesesMax ? 'cada 1 a 2 años' : 'al menos cada año'} (a partir del ${fechaCorta(desde)}) o antes si hay un evento agudo.`, proxima: desde };
  }

  // Evolución: cambio de estado entre aplicaciones de la evaluación básica y de los instrumentos del paso 2.
  const evolucion = [];
  if (previo) {
    const a = estadoDeResultado(previo);
    const b = estado;
    const sentido = a === b ? 'sin cambio' : a === 'conservado' && b === 'alterado' ? 'empeoró' : a === 'alterado' && b === 'conservado' ? 'mejoró' : 'cambió';
    evolucion.push(`Evaluación básica: ${ESTADOS_ICOPE[a].nombre.toLowerCase()} (${fechaCorta(previo.fecha)}) → ${ESTADOS_ICOPE[b].nombre.toLowerCase()} (${fechaCorta(vig.fecha)}): ${sentido}.`);
  }
  for (const x of detallada) {
    const todos = v.resultados.filter((r) => r.escalaId === x.id);
    if (todos.length < 2) continue;
    const cmp = compararResultados(todos, porId[x.id]);
    if (cmp?.ultima) evolucion.push(`${porId[x.id].corto}: ${textoCambio(cmp.ultima.vsRef, textoRespectoA(cmp.ref))}.`);
  }

  const revaloracion = plan.revaloraciones[ambito] || null;
  return {
    dom, ambito, estado, vigente: vig, previo, aplicaciones: lista.length,
    fecha: vig?.fecha || null,
    porFiltro: Boolean(vig?.extras?.filtro),
    hallazgo: vig ? hallazgoDe(vig) : '',
    instrumento: vig ? (vig.noEvaluable ? `${porId[dom.escala].corto}: no evaluable` : `${porId[dom.escala].corto}${vig.extras?.filtro ? ' (pregunta de filtro)' : ''}`) : '',
    detallada, hechas, externas, necesidad, evolucion, problema,
    prioridad: plan.prioridades[ambito] || null,
    objetivos: plan.objetivos.filter((o) => o.ambito === ambito),
    intervenciones: plan.intervenciones.filter((i) => i.ambito === ambito),
    revaloracion,
    revaloracionVencida: Boolean(revaloracion && hoy && diasEntre(hoy, revaloracion) < 0),
  };
}

export const estadosIcope = (v, hoy) => DOMINIOS_ICOPE.map((d) => estadoDominio(d, v, hoy));

// Estado de las necesidades adicionales (cuadro 3.2 y presión arterial).
export function estadoFactores(v) {
  const r = vigente(v, FACTORES.escala);
  const relacionados = FACTORES.relacionados.filter((x) => porId[x.id]).map((x) => ({ ...x, r: vigente(v, x.id) }));
  if (!r) return { estado: 'pendiente', r: null, necesidades: [], relacionados };
  if (r.noEvaluable) return { estado: 'no_evaluable', r, necesidades: [], relacionados };
  return { estado: r.hallazgo ? 'alterado' : 'conservado', r, necesidades: r.extras?.necesidades || [], pa: r.extras?.pa || null, tabaco: Boolean(r.extras?.tabaco), cuidadorPendiente: Boolean(r.extras?.cuidadorPendiente), relacionados };
}

// Avance de la evaluación básica: cuántos dominios tienen resultado. No es un puntaje de capacidad.
export function avanceBasica(estados) {
  const evaluados = estados.filter((x) => x.estado !== 'pendiente').length;
  return { evaluados, total: estados.length, alterados: estados.filter((x) => x.estado === 'alterado').map((x) => x.dom.nombre) };
}

/* ---------- Texto del informe ICOPE ---------- */

function lineaDominio(x) {
  if (x.estado === 'pendiente') return `- ${x.dom.nombre}: pendiente de evaluación básica.`;
  const partes = [`${ESTADOS_ICOPE[x.estado].nombre.toLowerCase()} (${fechaCorta(x.fecha)}): ${x.hallazgo}`];
  if (x.estado === 'alterado') partes.push(x.necesidad.tipo === 'hecha' ? x.necesidad.texto.replace(/\.$/, '') : 'evaluación detallada pendiente');
  if (x.problema) partes.push(`valoración del médico: ${nombreDe(ESTADOS_PROBLEMA, x.problema.estado).toLowerCase()}${x.problema.nota ? ` (${x.problema.nota})` : ''}`);
  return `- ${x.dom.nombre}: ${partes.join('; ')}.`;
}

export function textoIcope(v, hoy) {
  const estados = estadosIcope(v, hoy);
  const f = estadoFactores(v);
  const plan = planDe(v);
  const l = ['VALORACIÓN ICOPE · CAPACIDAD INTRÍNSECA', `Fecha: ${fechaCorta(hoy)}`];
  const p = v.paciente || {};
  const datos = [p.sexo, p.edad ? `${p.edad} años` : ''].filter(Boolean);
  if (datos.length) l.push(`Paciente: ${datos.join(', ')}.`);
  l.push('', 'Evaluación básica por dominio (sin puntaje global; cada dominio se informa por separado):');
  l.push(...estados.map(lineaDominio));
  l.push('', 'Necesidades adicionales:');
  if (f.estado === 'pendiente') l.push('- Factores clave (apoyo social, quien cuida, incontinencia urinaria): sin evaluar.');
  else if (f.estado === 'no_evaluable') l.push(`- Factores clave: ${valorGuardado(f.r)}.`);
  else {
    l.push(f.necesidades.length ? `- Por explorar: ${f.necesidades.map((id) => NECESIDADES_ICOPE[id].texto.toLowerCase()).join('; ')}.` : '- Sin necesidades detectadas en las preguntas del cuadro 3.2.');
    if (f.cuidadorPendiente) l.push('- Persona a cargo del cuidado: no fue posible preguntarle en privado.');
    if (f.pa) l.push(`- Presión arterial ${f.pa.pas}/${f.pa.pad} mmHg${f.pa.rango ? ' (en rango de hipertensión en esta medición; requiere confirmación en otra consulta)' : ''}.`);
    if (f.tabaco) l.push('- Consumo de tabaco en los últimos 12 meses.');
  }
  for (const x of f.relacionados.filter((y) => y.r)) l.push(`- ${x.tema}: ${porId[x.id].corto} ${valorGuardado(x.r)} (${fechaCorta(x.r.fecha)}).`);
  const pendientes = estados.filter((x) => x.necesidad.tipo === 'detallada').map((x) => x.dom.nombre.toLowerCase());
  if (pendientes.length) l.push('', `Evaluación detallada pendiente: ${pendientes.join(', ')}.`);
  const evo = estados.flatMap((x) => x.evolucion.map((e) => `- ${x.dom.nombre}. ${e}`));
  if (evo.length) l.push('', 'Evolución:', ...evo);
  const lp = lineasPlan(plan, AMBITOS_ICOPE, nombreAmbitoIcope).filter((x) => !x.startsWith('- Valoración del médico'));
  if (lp.length) l.push('', 'Plan de atención personalizado:', ...lp);
  l.push('', 'Adaptado del Manual de atención integrada para las personas mayores (ICOPE), 2.ª ed., OPS 2025 (CC BY-NC-SA 3.0 IGO). La OPS no respalda esta adaptación.');
  return l.join('\n');
}

// Resumen compacto para la nota de la valoración (párrafo).
export function resumenIcope(v, hoy) {
  const estados = estadosIcope(v, hoy).filter((x) => x.estado !== 'pendiente');
  if (!estados.length) return '';
  return `ICOPE (capacidad intrínseca, sin puntaje global): ${estados.map((x) => `${x.dom.nombre.toLowerCase()} ${ESTADOS_ICOPE[x.estado].nombre.toLowerCase()}`).join(', ')}.`;
}

export const prioridadTexto = (id) => nombreDe(PRIORIDADES, id);
