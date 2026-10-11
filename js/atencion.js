// Atención: lista de problemas del plan de atención geriátrica, sugerencias de intervención por dominio,
// revaloraciones, evolución de las mediciones repetidas y significado clínico del cambio.
// Huella deriva solo «hallazgos de tamizaje» a partir de los instrumentos; el estado clínico, la prioridad,
// los objetivos y las intervenciones los decide el médico.
import { DOMINIOS } from './dominios.js';
import {
  planDe, problemaDe, nombreAmbito, ambitoDominio, ESTADOS_PROBLEMA, PRIORIDADES, nombreDe, ambitosConContenido,
} from './plan.js';
import {
  vigenteDe, ordenarCronologico, compararResultados, etiquetaAplicacion, valorComparable, diasEntre, fechaCorta,
} from './comparacion.js';
import { valorGuardado } from './nota.js';
import { DOMINIOS_ICOPE, FACTORES, estadosIcope, ambitoIcope } from './icope.js';

/* ---------- Sugerencias orientativas por dominio (ninguna se agrega sola) ---------- */

export const SUGERENCIAS_DOMINIO = {
  funcional: [
    { categoria: 'referencia', texto: 'Rehabilitación o terapia ocupacional para las actividades afectadas.' },
    { categoria: 'caidas', texto: 'Valorar productos de apoyo y adaptaciones del hogar.' },
    { categoria: 'cuidador', texto: 'Organizar el apoyo para las actividades que ya no realiza sola.' },
  ],
  cognitivo: [
    { categoria: 'cognicion', texto: 'Completar la evaluación diagnóstica del deterioro cognitivo.' },
    { categoria: 'farmacologica', texto: 'Revisar fármacos con efecto sobre la cognición.' },
    { categoria: 'cuidador', texto: 'Información y apoyo a la persona que cuida.' },
  ],
  afectivo: [
    { categoria: 'mental', texto: 'Evaluación clínica de los síntomas depresivos o ansiosos.' },
    { categoria: 'mental', texto: 'Intervención psicológica o referencia a salud mental, según la valoración.' },
    { categoria: 'social', texto: 'Fomentar la actividad física y la participación social.' },
  ],
  delirium: [
    { categoria: 'delirium', texto: 'Medidas no farmacológicas: orientación, sueño, movilización, hidratación, lentes y audífonos.' },
    { categoria: 'delirium', texto: 'Buscar y tratar la causa desencadenante.' },
    { categoria: 'farmacologica', texto: 'Revisar fármacos que pueden precipitar delirium.' },
  ],
  fragilidad: [
    { categoria: 'ejercicio', texto: 'Ejercicio multicomponente adaptado (p. ej., Vivifrail).' },
    { categoria: 'nutricion', texto: 'Valoración nutricional y aporte de proteínas.' },
    { categoria: 'farmacologica', texto: 'Revisión de la medicación.' },
  ],
  caidas: [
    { categoria: 'caidas', texto: 'Evaluación multifactorial del riesgo de caídas.' },
    { categoria: 'ejercicio', texto: 'Ejercicio de equilibrio y fuerza.' },
    { categoria: 'farmacologica', texto: 'Revisar fármacos que aumentan el riesgo de caídas.' },
    { categoria: 'caidas', texto: 'Seguridad del hogar, calzado y revisión de la visión.' },
  ],
  osea: [
    { categoria: 'farmacologica', texto: 'Valorar la indicación de tratamiento para prevenir fracturas según la guía vigente (decisión clínica).' },
    { categoria: 'caidas', texto: 'Prevención de caídas.' },
  ],
  nutricion: [
    { categoria: 'nutricion', texto: 'Valoración nutricional completa y asesoramiento dietético.' },
    { categoria: 'nutricion', texto: 'Seguimiento del peso y de la ingesta.' },
    { categoria: 'oral', texto: 'Revisar la boca, las prótesis y la masticación.' },
  ],
  deglucion: [
    { categoria: 'deglucion', texto: 'Evaluación de la deglución por personal capacitado antes de cambiar la dieta.' },
    { categoria: 'oral', texto: 'Higiene oral.' },
  ],
  sensorial: [
    { categoria: 'sensorial', texto: 'Evaluación oftalmológica u optométrica.' },
    { categoria: 'sensorial', texto: 'Evaluación audiológica y valorar audífonos.' },
    { categoria: 'oral', texto: 'Revisión odontológica.' },
  ],
  continencia: [
    { categoria: 'continencia', texto: 'Buscar causas reversibles de incontinencia.' },
    { categoria: 'continencia', texto: 'Entrenamiento vesical o del suelo pélvico, según el tipo de incontinencia.' },
    { categoria: 'continencia', texto: 'Prevención y manejo del estreñimiento.' },
  ],
  sueno: [
    { categoria: 'sueno', texto: 'Medidas de higiene del sueño y terapia cognitivo-conductual para el insomnio.' },
    { categoria: 'farmacologica', texto: 'Revisar fármacos que alteran el sueño.' },
    { categoria: 'referencia', texto: 'Valorar un estudio de sueño si se sospecha apnea.' },
  ],
  piel: [
    { categoria: 'otra', texto: 'Plan de prevención de lesiones por presión: cambios de posición, superficies, piel y nutrición.' },
  ],
  dolor: [
    { categoria: 'otra', texto: 'Valoración integral del dolor y plan analgésico (decisión clínica).' },
    { categoria: 'otra', texto: 'Medidas no farmacológicas para el dolor.' },
  ],
  polifarmacia: [
    { categoria: 'farmacologica', texto: 'Revisión estructurada de la medicación (STOPP/START, Beers).' },
    { categoria: 'farmacologica', texto: 'Conciliación de la medicación en cada transición de cuidados.' },
  ],
  social: [
    { categoria: 'social', texto: 'Valoración por Trabajo Social.' },
    { categoria: 'cuidador', texto: 'Apoyo y respiro para la persona que cuida.' },
  ],
  paliativos: [
    { categoria: 'paliativos', texto: 'Valorar necesidades paliativas y control de síntomas.' },
    { categoria: 'paliativos', texto: 'Conversar sobre objetivos y preferencias de cuidado.' },
  ],
  comorbilidad: [
    { categoria: 'otra', texto: 'Revisar el control de las enfermedades crónicas.' },
    { categoria: 'referencia', texto: 'Coordinar el seguimiento entre especialidades.' },
  ],
  prequirurgica: [
    { categoria: 'otra', texto: 'Optimización prequirúrgica (nutrición, anemia, medicación).' },
    { categoria: 'delirium', texto: 'Prevención del delirium posoperatorio.' },
  ],
  calculadoras: [],
};

export function sugerenciasDe(ambito) {
  const [tipo, id] = ambito.split(':');
  if (tipo === 'dom') return SUGERENCIAS_DOMINIO[id] || [];
  if (tipo === 'icope') return id === 'factores' ? FACTORES.intervenciones : DOMINIOS_ICOPE.find((d) => d.id === id)?.intervenciones || [];
  return [];
}

/* ---------- Lista de problemas ---------- */

const ORDEN_PRIORIDAD = { alta: 0, intermedia: 1, seguimiento: 2 };

// Problemas del plan: dominios con hallazgos de tamizaje, dominios ICOPE alterados, problemas agregados por el médico
// y cualquier ámbito con contenido en el plan.
export function problemasPlan(v, porId, hoy) {
  const plan = planDe(v);
  const lista = [];
  const conContenido = (a) => plan.objetivos.some((o) => o.ambito === a) || plan.intervenciones.some((i) => i.ambito === a)
    || plan.prioridades[a] || plan.revaloraciones[a] || problemaDe(plan, a);
  for (const d of DOMINIOS) {
    const ambito = ambitoDominio(d.id);
    const ids = [...new Set(v.resultados.filter((r) => porId[r.escalaId]?.dominio === d.id && !porId[r.escalaId]?.icope).map((r) => r.escalaId))];
    const hallazgos = [];
    for (const id of ids) {
      const vig = vigenteDe(v.resultados.filter((r) => r.escalaId === id));
      if (vig && !vig.noEvaluable && vig.hallazgo) hallazgos.push({ escalaId: id, texto: `${porId[id].corto}: ${valorGuardado(vig)}`, fecha: vig.fecha });
    }
    if (hallazgos.length || conContenido(ambito)) lista.push({ ambito, tipo: 'dominio', dominio: d.id, hallazgos });
  }
  for (const x of estadosIcope(v, hoy)) {
    if (x.estado === 'alterado' || conContenido(x.ambito)) {
      lista.push({ ambito: x.ambito, tipo: 'icope', dominio: x.dom.id, hallazgos: x.estado === 'alterado' ? [{ escalaId: x.dom.escala, texto: `${x.dom.nombre}: ${x.hallazgo}`, fecha: x.fecha }] : [] });
    }
  }
  if (conContenido(ambitoIcope('factores'))) lista.push({ ambito: ambitoIcope('factores'), tipo: 'icope', dominio: 'factores', hallazgos: [] });
  for (const l of plan.libres) lista.push({ ambito: l.ambito, tipo: 'libre', hallazgos: [] });
  for (const a of ambitosConContenido(plan)) if (!lista.some((x) => x.ambito === a)) lista.push({ ambito: a, tipo: 'otro', hallazgos: [] });
  return lista.map((x, orden) => {
    const asignado = problemaDe(plan, x.ambito);
    const derivado = x.hallazgos.length ? 'tamizaje' : null;
    return {
      ...x,
      orden,
      nombre: nombreAmbito(x.ambito, plan),
      asignado,
      derivado,
      estado: asignado?.estado || derivado,
      prioridad: plan.prioridades[x.ambito] || null,
      objetivos: plan.objetivos.filter((o) => o.ambito === x.ambito),
      intervenciones: plan.intervenciones.filter((i) => i.ambito === x.ambito),
      revaloracion: plan.revaloraciones[x.ambito] || null,
    };
  }).sort((a, b) => (ORDEN_PRIORIDAD[a.prioridad] ?? 3) - (ORDEN_PRIORIDAD[b.prioridad] ?? 3) || a.orden - b.orden);
}

export const textoEstadoProblema = (p) => (p.asignado
  ? nombreDe(ESTADOS_PROBLEMA, p.asignado.estado)
  : p.derivado ? `${nombreDe(ESTADOS_PROBLEMA, 'tamizaje')} (derivado de los instrumentos)` : 'Sin estado asignado');

// Línea de la lista de problemas para los informes.
export function lineaProblema(p) {
  const partes = [textoEstadoProblema(p).toLowerCase()];
  if (p.prioridad) partes.push(`prioridad ${nombreDe(PRIORIDADES, p.prioridad).toLowerCase()}`);
  if (p.asignado?.nota) partes.push(p.asignado.nota);
  const hall = p.hallazgos.length ? ` Hallazgos: ${p.hallazgos.map((h) => h.texto).join('; ')}.` : '';
  return `${p.nombre}: ${partes.join('; ')}.${hall}`;
}

/* ---------- Revaloraciones y objetivos ---------- */

export function revaloraciones(plan, hoy) {
  return Object.entries(plan.revaloraciones)
    .map(([ambito, fecha]) => ({ ambito, nombre: nombreAmbito(ambito, plan), fecha, dias: diasEntre(hoy, fecha) }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
}

export const objetivoVencido = (o, hoy) => Boolean(o.plazo && o.plazo < hoy && !['cumplido', 'parcial', 'no_cumplido', 'suspendido'].includes(o.estado));

/* ---------- Evolución y significado clínico del cambio ---------- */

// Series de mediciones repetidas con valor numérico comparable (dos o más), en orden cronológico.
export function seriesEvolucion(v, porId) {
  const ids = [...new Set(v.resultados.map((r) => r.escalaId))].filter((id) => porId[id]);
  const series = [];
  for (const id of ids) {
    const escala = porId[id];
    const rs = ordenarCronologico(v.resultados.filter((r) => r.escalaId === id && !r.noEvaluable));
    const puntos = rs.map((r) => ({ r, valor: valorComparable(r) })).filter((p) => Number.isFinite(p.valor));
    if (puntos.length < 2) continue;
    const cmp = compararResultados(rs, escala);
    series.push({
      escala,
      puntos: puntos.map((p) => ({ valor: p.valor, fecha: p.r.fecha, etiqueta: etiquetaAplicacion(p.r) || fechaCorta(p.r.fecha), mostrar: valorGuardado(p.r), nivel: p.r.nivel })),
      cmp,
      significado: cmp?.ultima ? significadoClinico(escala, cmp.ultima.vsRef) : null,
    });
  }
  return series;
}

// Distingue el cambio cuantitativo del clínicamente significativo. Solo se califica con umbrales publicados
// declarados en el instrumento (cambio mínimo o sustancial); si no los hay, la relevancia queda a juicio clínico.
export function significadoClinico(escala, c) {
  if (!c) return null;
  const dif = Math.abs(c.dif ?? 0);
  if (c.tipo === 'no_interpretable') return { tipo: 'no_interpretable', texto: 'El cambio no se interpreta numéricamente (métodos o escalas distintos).' };
  if (escala.cambioSustancial && dif >= escala.cambioSustancial.valor) return { tipo: 'sustancial', texto: `Alcanza el cambio sustancial publicado (${escala.cambioSustancial.texto}).` };
  if (escala.cambioMinimo && dif >= escala.cambioMinimo.valor) return { tipo: 'minimo', texto: `Alcanza el cambio pequeño con significado clínico publicado (${escala.cambioMinimo.texto}).` };
  if (escala.cambioMinimo || escala.cambioSustancial) {
    const ref = escala.cambioMinimo || escala.cambioSustancial;
    return { tipo: 'menor', texto: `Menor que el cambio con significado clínico publicado (${ref.texto}).` };
  }
  if (c.categoria) return { tipo: 'categoria', texto: 'Cambió de categoría; cerca de un punto de corte, un cambio numérico pequeño puede cambiar la categoría sin ser clínicamente relevante.' };
  return { tipo: 'sin_umbral', texto: 'Huella no tiene un cambio mínimo clínicamente importante validado para este instrumento: la relevancia requiere valoración clínica.' };
}
