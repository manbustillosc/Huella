// Plan de atención: estado de los problemas, prioridades, objetivos, intervenciones, fechas de revaloración,
// preferencias de la persona y bitácora de cambios. Lo usan ICOPE y el plan de atención geriátrica.
// Todo lo decide el médico: Huella no asigna prioridades, no convierte un tamizaje en diagnóstico,
// no selecciona intervenciones ni las marca como realizadas.

export const ESTADOS_PROBLEMA = [
  { id: 'tamizaje', nombre: 'Hallazgo de tamizaje' },
  { id: 'sospecha', nombre: 'Sospecha clínica' },
  { id: 'confirmado', nombre: 'Diagnóstico confirmado por el médico' },
  { id: 'descartado', nombre: 'Descartado' },
  { id: 'pendiente', nombre: 'Pendiente de evaluación' },
];
export const PRIORIDADES = [
  { id: 'alta', nombre: 'Alta' },
  { id: 'intermedia', nombre: 'Intermedia' },
  { id: 'seguimiento', nombre: 'Seguimiento' },
];
export const ESTADOS_OBJETIVO = [
  { id: 'pendiente', nombre: 'Pendiente' },
  { id: 'en_curso', nombre: 'En curso' },
  { id: 'cumplido', nombre: 'Cumplido' },
  { id: 'parcial', nombre: 'Cumplido en parte' },
  { id: 'no_cumplido', nombre: 'No cumplido' },
  { id: 'suspendido', nombre: 'Suspendido' },
];
export const ESTADOS_INTERVENCION = [
  { id: 'planeada', nombre: 'Planeada' },
  { id: 'en_curso', nombre: 'En curso' },
  { id: 'realizada', nombre: 'Realizada' },
  { id: 'suspendida', nombre: 'Suspendida' },
];
export const CATEGORIAS_INTERVENCION = [
  { id: 'ejercicio', nombre: 'Ejercicio' },
  { id: 'nutricion', nombre: 'Nutrición' },
  { id: 'cognicion', nombre: 'Cognición' },
  { id: 'delirium', nombre: 'Prevención de delirium' },
  { id: 'farmacologica', nombre: 'Revisión farmacológica' },
  { id: 'caidas', nombre: 'Prevención de caídas' },
  { id: 'continencia', nombre: 'Continencia' },
  { id: 'sueno', nombre: 'Sueño' },
  { id: 'sensorial', nombre: 'Visión y audición' },
  { id: 'oral', nombre: 'Salud oral' },
  { id: 'deglucion', nombre: 'Deglución' },
  { id: 'mental', nombre: 'Salud mental' },
  { id: 'social', nombre: 'Trabajo social' },
  { id: 'cuidador', nombre: 'Apoyo al cuidador' },
  { id: 'paliativos', nombre: 'Cuidados paliativos' },
  { id: 'referencia', nombre: 'Referencia' },
  { id: 'otra', nombre: 'Otra' },
];
// Preferencias centradas en la persona. No son documentos de voluntad anticipada.
export const CAMPOS_PREFERENCIAS = [
  { id: 'importa', etiqueta: 'Lo que más le importa', ayuda: 'En todos los ámbitos de su vida.' },
  { id: 'actividades', etiqueta: 'Actividades que desea mantener o recuperar' },
  { id: 'dificultades', etiqueta: 'Dificultades principales, en sus palabras' },
  { id: 'prioridades', etiqueta: 'Sus prioridades de salud', ayuda: 'Por ejemplo, a corto plazo (3 meses) y a largo plazo (6 a 12 meses).' },
  { id: 'apoyo', etiqueta: 'Apoyo con el que cuenta' },
  { id: 'decide', etiqueta: 'Quién participa en las decisiones', ayuda: 'Describe el papel (p. ej., «hija», «la propia persona»), sin nombres.' },
  { id: 'tratamientos', etiqueta: 'Preferencias sobre tratamientos o cuidados', ayuda: 'Incluye los que no desea. No sustituye un documento de voluntad anticipada.' },
];
export const MAX_PREFERENCIA = 300;

export const nombreDe = (lista, id) => lista.find((x) => x.id === id)?.nombre || '';

export const planVacio = () => ({
  problemas: [], prioridades: {}, objetivos: [], intervenciones: [], revaloraciones: {}, preferencias: {}, bitacora: [],
});
export function planDe(v) {
  const p = { ...planVacio(), ...(v?.plan || {}) };
  for (const k of ['problemas', 'objetivos', 'intervenciones', 'bitacora']) if (!Array.isArray(p[k])) p[k] = [];
  for (const k of ['prioridades', 'revaloraciones', 'preferencias']) if (!p[k] || typeof p[k] !== 'object') p[k] = {};
  return p;
}

const limpio = (t, max) => String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const fechaValida = (f) => (/^\d{4}-\d{2}-\d{2}$/.test(String(f || '')) ? f : '');
export const nuevoIdPlan = (p = 'p') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function anotar(plan, fecha, texto, auto = true) {
  plan.bitacora.push({ id: nuevoIdPlan('b'), fecha: fechaValida(fecha), texto: limpio(texto, 240).replace(/\.{2,}$/, '.').replace(/\.»/g, '»'), auto, ts: Date.now() });
}

/* ---------- Problemas y prioridades ---------- */

export const problemaDe = (plan, ambito) => plan.problemas.find((x) => x.ambito === ambito) || null;

// Fija el estado que el médico asigna a un problema (estado null lo quita y vuelve al estado derivado).
export function fijarProblema(plan, ambito, { estado, nota }, fecha, nombre = nombreAmbito(ambito)) {
  const previo = problemaDe(plan, ambito);
  if (!estado) {
    if (previo) {
      plan.problemas = plan.problemas.filter((x) => x !== previo);
      anotar(plan, fecha, `${nombre}: se retiró el estado asignado por el médico.`);
    }
    return null;
  }
  if (!ESTADOS_PROBLEMA.some((x) => x.id === estado)) return previo;
  const antes = previo?.estado || null;
  const nuevo = { id: previo?.id || nuevoIdPlan('pr'), ambito, estado, nota: limpio(nota ?? previo?.nota, 200), fecha: fechaValida(fecha) };
  if (previo) Object.assign(previo, nuevo);
  else plan.problemas.push(nuevo);
  if (antes !== estado) anotar(plan, fecha, `${nombre}: ${nombreDe(ESTADOS_PROBLEMA, estado).toLowerCase()}${antes ? ` (antes: ${nombreDe(ESTADOS_PROBLEMA, antes).toLowerCase()})` : ''}.`);
  return previo || nuevo;
}

export function fijarPrioridad(plan, ambito, prioridad, fecha, nombre = nombreAmbito(ambito)) {
  const antes = plan.prioridades[ambito] || null;
  if (!prioridad) delete plan.prioridades[ambito];
  else if (PRIORIDADES.some((x) => x.id === prioridad)) plan.prioridades[ambito] = prioridad;
  else return;
  const ahora = plan.prioridades[ambito] || null;
  if (antes !== ahora) anotar(plan, fecha, `${nombre}: prioridad ${ahora ? nombreDe(PRIORIDADES, ahora).toLowerCase() : 'sin definir'}${antes ? ` (antes: ${nombreDe(PRIORIDADES, antes).toLowerCase()})` : ''}.`);
}

export function fijarRevaloracion(plan, ambito, fecha, hoy, nombre = nombreAmbito(ambito)) {
  const f = fechaValida(fecha);
  const antes = plan.revaloraciones[ambito] || '';
  if (f) plan.revaloraciones[ambito] = f;
  else delete plan.revaloraciones[ambito];
  if (antes !== f) anotar(plan, hoy, `${nombre}: ${f ? `revaloración programada para el ${f.split('-').reverse().join('/')}` : 'se quitó la fecha de revaloración'}.`);
}

/* ---------- Objetivos ---------- */

export const CAMPOS_OBJETIVO = [
  { id: 'texto', etiqueta: 'Objetivo', max: 160, requerido: true, ejemplo: 'p. ej., caminar al mercado sin ayuda' },
  { id: 'basal', etiqueta: 'Situación basal', max: 80, ejemplo: 'p. ej., SPPB 7/12' },
  { id: 'meta', etiqueta: 'Meta', max: 80, ejemplo: 'p. ej., SPPB 9/12 o más' },
  { id: 'plazo', etiqueta: 'Plazo', tipo: 'date' },
  { id: 'responsable', etiqueta: 'Responsable (papel, sin nombres)', max: 60, ejemplo: 'p. ej., fisioterapia' },
  { id: 'indicador', etiqueta: 'Indicador', max: 80, ejemplo: 'p. ej., SPPB repetido' },
];

export function normalizarObjetivo(datos) {
  const o = {};
  for (const c of CAMPOS_OBJETIVO) o[c.id] = c.tipo === 'date' ? fechaValida(datos[c.id]) : limpio(datos[c.id], c.max);
  return o.texto ? o : null;
}

export function agregarObjetivo(plan, ambito, datos, fecha, nombre = nombreAmbito(ambito)) {
  const o = normalizarObjetivo(datos);
  if (!o) return null;
  const nuevo = { id: nuevoIdPlan('o'), ambito, ...o, estado: 'pendiente', creado: fechaValida(fecha) };
  plan.objetivos.push(nuevo);
  anotar(plan, fecha, `${nombre}: objetivo agregado: ${o.texto}.`);
  return nuevo;
}

export function actualizarObjetivo(plan, id, cambios, fecha) {
  const o = plan.objetivos.find((x) => x.id === id);
  if (!o) return null;
  if (cambios.estado && cambios.estado !== o.estado && ESTADOS_OBJETIVO.some((x) => x.id === cambios.estado)) {
    anotar(plan, fecha, `Objetivo «${o.texto}»: ${nombreDe(ESTADOS_OBJETIVO, cambios.estado).toLowerCase()} (antes: ${nombreDe(ESTADOS_OBJETIVO, o.estado).toLowerCase()}).`);
    o.estado = cambios.estado;
    o.fechaEstado = fechaValida(fecha);
  }
  const campos = normalizarObjetivo({ ...o, ...cambios });
  if (campos) Object.assign(o, campos);
  return o;
}

export function quitarObjetivo(plan, id, fecha) {
  const o = plan.objetivos.find((x) => x.id === id);
  if (!o) return;
  plan.objetivos = plan.objetivos.filter((x) => x !== o);
  anotar(plan, fecha, `Objetivo retirado: ${o.texto}.`);
}

/* ---------- Intervenciones ---------- */

export function agregarIntervencion(plan, ambito, { categoria, texto, origen = 'propia' }, fecha, nombre = nombreAmbito(ambito)) {
  const t = limpio(texto, 200);
  if (!t) return null;
  const cat = CATEGORIAS_INTERVENCION.some((x) => x.id === categoria) ? categoria : 'otra';
  if (plan.intervenciones.some((x) => x.ambito === ambito && x.texto === t)) return null;
  const nueva = { id: nuevoIdPlan('i'), ambito, categoria: cat, texto: t, origen: origen === 'sugerida' ? 'sugerida' : 'propia', estado: 'planeada', creado: fechaValida(fecha), fechaEstado: fechaValida(fecha) };
  plan.intervenciones.push(nueva);
  anotar(plan, fecha, `${nombre}: intervención agregada al plan (${nombreDe(CATEGORIAS_INTERVENCION, cat).toLowerCase()}): ${t}.`);
  return nueva;
}

export function actualizarIntervencion(plan, id, { estado, nota }, fecha) {
  const i = plan.intervenciones.find((x) => x.id === id);
  if (!i) return null;
  if (estado && estado !== i.estado && ESTADOS_INTERVENCION.some((x) => x.id === estado)) {
    anotar(plan, fecha, `Intervención «${i.texto}»: ${nombreDe(ESTADOS_INTERVENCION, estado).toLowerCase()} (antes: ${nombreDe(ESTADOS_INTERVENCION, i.estado).toLowerCase()}).`);
    i.estado = estado;
    i.fechaEstado = fechaValida(fecha);
  }
  if (nota !== undefined) i.nota = limpio(nota, 160);
  return i;
}

export function quitarIntervencion(plan, id, fecha) {
  const i = plan.intervenciones.find((x) => x.id === id);
  if (!i) return;
  plan.intervenciones = plan.intervenciones.filter((x) => x !== i);
  anotar(plan, fecha, `Intervención retirada: ${i.texto}.`);
}

/* ---------- Preferencias y bitácora ---------- */

export function fijarPreferencias(plan, datos) {
  const p = {};
  for (const c of CAMPOS_PREFERENCIAS) {
    const t = limpio(datos[c.id], MAX_PREFERENCIA);
    if (t) p[c.id] = t;
  }
  plan.preferencias = p;
}

export function registrarCambio(plan, texto, fecha) {
  const t = limpio(texto, 240);
  if (!t) return false;
  anotar(plan, fecha, t, false);
  return true;
}

export const planConContenido = (plan) => Boolean(
  plan.problemas.length || plan.objetivos.length || plan.intervenciones.length || Object.keys(plan.prioridades).length
  || Object.keys(plan.revaloraciones).length || Object.keys(plan.preferencias).length,
);

/* ---------- Texto ---------- */

const fechaDMA = (f) => (f ? f.split('-').reverse().join('/') : '');

export function lineaObjetivo(o) {
  const det = [
    o.basal ? `basal: ${o.basal}` : '',
    o.meta ? `meta: ${o.meta}` : '',
    o.plazo ? `plazo: ${fechaDMA(o.plazo)}` : '',
    o.responsable ? `responsable: ${o.responsable}` : '',
    o.indicador ? `indicador: ${o.indicador}` : '',
  ].filter(Boolean).join('; ');
  return `${o.texto}${det ? ` (${det})` : ''}; estado: ${nombreDe(ESTADOS_OBJETIVO, o.estado).toLowerCase()}`;
}

export function lineaIntervencion(i) {
  const cuando = i.fechaEstado && i.estado !== 'planeada' ? ` (${fechaDMA(i.fechaEstado)})` : '';
  return `${nombreDe(CATEGORIAS_INTERVENCION, i.categoria)}: ${i.texto}; ${nombreDe(ESTADOS_INTERVENCION, i.estado).toLowerCase()}${cuando}${i.nota ? `; ${i.nota}` : ''}`;
}

// Nombre legible de un ámbito del plan. Los dominios ICOPE se nombran aquí para que la nota no dependa
// de la pantalla ICOPE (las pruebas comprueban que coincidan con js/icope.js).
export const NOMBRES_ICOPE = {
  cognicion: 'Cognición', locomotora: 'Capacidad locomotora', vitalidad: 'Vitalidad', vision: 'Visión',
  audicion: 'Audición', psicologica: 'Capacidad psicológica', factores: 'Necesidades adicionales',
};
export function nombreAmbito(ambito) {
  const [tipo, id] = String(ambito).split(':');
  if (tipo === 'icope') return `${NOMBRES_ICOPE[id] || id} (ICOPE)`;
  return id || tipo;
}
// Ámbitos con contenido, en orden: primero los dominios ICOPE y después el resto en orden de creación.
export function ambitosConContenido(plan) {
  const vistos = [];
  const agregar = (a) => { if (a && !vistos.includes(a)) vistos.push(a); };
  const todos = [...plan.problemas.map((x) => x.ambito), ...Object.keys(plan.prioridades), ...plan.objetivos.map((x) => x.ambito), ...plan.intervenciones.map((x) => x.ambito), ...Object.keys(plan.revaloraciones)];
  Object.keys(NOMBRES_ICOPE).map((id) => `icope:${id}`).filter((a) => todos.includes(a)).forEach(agregar);
  todos.forEach(agregar);
  return vistos;
}

// Líneas del plan para un conjunto de ámbitos, con el nombre legible de cada uno.
export function lineasPlan(plan, ambitos = ambitosConContenido(plan), nombre = nombreAmbito) {
  const l = [];
  const pref = CAMPOS_PREFERENCIAS.filter((c) => plan.preferencias[c.id]);
  if (pref.length) {
    l.push('Lo que importa a la persona:');
    l.push(...pref.map((c) => `- ${c.etiqueta}: ${plan.preferencias[c.id]}.`));
  }
  for (const a of ambitos) {
    const objs = plan.objetivos.filter((x) => x.ambito === a);
    const ints = plan.intervenciones.filter((x) => x.ambito === a);
    const prio = plan.prioridades[a];
    const rev = plan.revaloraciones[a];
    const prob = problemaDe(plan, a);
    if (!objs.length && !ints.length && !prio && !rev && !prob) continue;
    l.push(`${nombre(a)}${prio ? ` (prioridad ${nombreDe(PRIORIDADES, prio).toLowerCase()})` : ''}:`);
    if (prob) l.push(`- Valoración del médico: ${nombreDe(ESTADOS_PROBLEMA, prob.estado).toLowerCase()}${prob.nota ? ` (${prob.nota})` : ''}.`);
    l.push(...objs.map((o) => `- Objetivo: ${lineaObjetivo(o)}.`));
    l.push(...ints.map((i) => `- Intervención: ${lineaIntervencion(i)}.`));
    if (rev) l.push(`- Revaloración: ${fechaDMA(rev)}.`);
  }
  return l;
}
