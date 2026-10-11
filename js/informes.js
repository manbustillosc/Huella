// Informes: evolución breve, nota geriátrica completa, resumen por dominio, informe ICOPE, plan de atención
// e informe de seguimiento. Texto plano para copiar; la vista lo presenta para imprimir o guardar en PDF.
// Ningún informe lleva firma ni certificación: los revisa y firma el médico responsable fuera de Huella.
import { notaValoracion, hallazgosYSugerencias, valorGuardado, fechaCorta } from './nota.js';
import { ordenarCronologico, compararResultados, etiquetaAplicacion, textoCambio, textoRespectoA, vigenteDe, isoDe } from './comparacion.js';
import {
  planDe, planConContenido, lineasPlan, lineaObjetivo, lineaIntervencion, nombreAmbito, nombreDe, ESTADOS_OBJETIVO, ESTADOS_INTERVENCION,
  CAMPOS_PREFERENCIAS, ambitoDominio, problemaDe, ESTADOS_PROBLEMA, PRIORIDADES,
} from './plan.js';
import { partesNota } from './medicacion.js';
import { textoIcope } from './icope.js';
import { episodioDe, fechasEvaluacion } from './episodio.js';
import { problemasPlan, lineaProblema, revaloraciones, objetivoVencido, seriesEvolucion } from './atencion.js';

export const FORMATOS_INFORME = [
  { id: 'evolucion', nombre: 'Evolución breve', desc: 'Resultados vigentes, cambios, hallazgos y plan en pocas líneas, para la nota de evolución.' },
  { id: 'completa', nombre: 'Nota geriátrica completa', desc: 'Resultados objetivos, interpretación, cambios, hallazgos, sugerencias orientativas y plan.' },
  { id: 'dominios', nombre: 'Resumen por dominio', desc: 'Cada dominio con sus instrumentos, cambios y la valoración del médico.' },
  { id: 'icope', nombre: 'Informe ICOPE', desc: 'Capacidad intrínseca por dominio, sin puntaje global, con el plan personalizado.' },
  { id: 'plan', nombre: 'Plan de atención', desc: 'Lista de problemas, prioridades, objetivos, intervenciones, revaloraciones y preferencias.' },
  { id: 'seguimiento', nombre: 'Informe de seguimiento', desc: 'Fechas del episodio, evolución de las mediciones repetidas y estado del plan.' },
];
export const formatoInforme = (id) => FORMATOS_INFORME.find((f) => f.id === id) || null;

const minus = (s) => String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1);

function encabezado(titulo, v, hoy) {
  const ep = episodioDe(v);
  const p = v.paciente || {};
  const datos = [p.sexo, p.edad ? `${p.edad} años` : '', p.escolaridad ? `escolaridad ${p.escolaridad} años` : ''].filter(Boolean);
  const l = [titulo.toUpperCase(), `Fecha de elaboración: ${fechaCorta(hoy)}`];
  const periodo = ep.estado === 'cerrado'
    ? `cerrado${ep.abierto ? `; del ${fechaCorta(ep.abierto)}` : ''}${ep.cerrado ? ` al ${fechaCorta(ep.cerrado)}` : ''}`
    : `abierto${ep.abierto ? ` desde el ${fechaCorta(ep.abierto)}` : ''}`;
  l.push(`Episodio ${ep.codigo || 'sin código'}${ep.etiqueta ? ` · ${ep.etiqueta}` : ''} (${periodo}).`);
  if (datos.length) l.push(`Paciente: ${datos.join(', ')}.`);
  const ctx = (p.contexto || '').trim().replace(/\.$/, '');
  if (ctx) l.push(`Contexto clínico: ${ctx}.`);
  return l;
}

export const pieInforme = (version) => `Documento de apoyo elaborado con Huella ${version}, sin datos de identificación. No incluye firma ni certificación médica: su contenido debe revisarlo y validarlo el médico responsable.`;

function evolucionBreve(v, porId, dominios, hoy) {
  const l = [];
  const { hallazgos, cambios, alertas } = hallazgosYSugerencias(v, porId, hoy);
  const ids = [...new Set(v.resultados.map((r) => r.escalaId))].filter((id) => porId[id]);
  const vigentes = dominios.flatMap((d) => ids.filter((id) => porId[id].dominio === d.id)).map((id) => {
    const vig = vigenteDe(v.resultados.filter((r) => r.escalaId === id));
    const etq = etiquetaAplicacion(vig, { omitirFecha: hoy });
    return `${porId[id].corto}${etq ? ` ${etq}` : ''}: ${valorGuardado(vig)}`;
  });
  l.push('', 'RESULTADOS VIGENTES');
  l.push(...(vigentes.length ? vigentes.map((x) => `- ${x}.`) : ['- Sin instrumentos aplicados.']));
  if (cambios.length) l.push('', 'CAMBIOS', ...cambios.filter((c) => !c.startsWith('  ')).map((c) => `- ${c}`));
  if (alertas.length || hallazgos.length) l.push('', 'HALLAZGOS', ...alertas.map((a) => `- ALERTA: ${a}`), ...hallazgos.map((h) => `- ${h}`));
  const med = partesNota(v.medicacion);
  if (med?.problemas.length) l.push(`- Posibles problemas de prescripción: ${med.problemas.map((x) => x.split(':')[0]).join(', ')}.`);
  const plan = planDe(v);
  const probs = problemasPlan(v, porId, hoy).filter((p) => p.asignado || p.prioridad || p.objetivos.length || p.intervenciones.length);
  if (probs.length) {
    l.push('', 'PLAN');
    for (const p of probs) {
      const det = [p.prioridad ? `prioridad ${minus(nombreDe(PRIORIDADES, p.prioridad))}` : '', p.objetivos.length ? `objetivos: ${p.objetivos.map((o) => o.texto).join('; ')}` : '', p.intervenciones.length ? `intervenciones: ${p.intervenciones.map((i) => i.texto.replace(/\.$/, '')).join('; ')}` : ''].filter(Boolean);
      l.push(`- ${p.nombre}${p.asignado ? ` (${minus(nombreDe(ESTADOS_PROBLEMA, p.asignado.estado))})` : ''}${det.length ? `: ${det.join('; ')}` : ''}.`);
    }
  }
  const rev = revaloraciones(plan, hoy);
  if (rev.length) l.push(`Próximas revaloraciones: ${rev.map((r) => `${r.nombre} ${fechaCorta(r.fecha)}`).join('; ')}.`);
  return l;
}

function resumenDominios(v, porId, dominios, hoy) {
  const l = [];
  const plan = planDe(v);
  for (const d of dominios) {
    const rs = v.resultados.filter((r) => porId[r.escalaId]?.dominio === d.id);
    const amb = ambitoDominio(d.id);
    const prob = problemaDe(plan, amb);
    const objs = plan.objetivos.filter((o) => o.ambito === amb);
    const ints = plan.intervenciones.filter((i) => i.ambito === amb);
    if (!rs.length && !prob && !objs.length && !ints.length) continue;
    l.push('', d.nombre.toUpperCase());
    for (const id of [...new Set(rs.map((r) => r.escalaId))]) {
      const escala = porId[id];
      const lista = ordenarCronologico(rs.filter((r) => r.escalaId === id));
      const vig = vigenteDe(lista);
      l.push(`- ${vig.resumen && !vig.noEvaluable ? vig.resumen : `${escala.corto}: ${valorGuardado(vig)}.`}`);
      const cmp = lista.length > 1 ? compararResultados(lista, escala) : null;
      if (cmp?.ultima) l.push(`  Cambio: ${textoCambio(cmp.ultima.vsRef, textoRespectoA(cmp.ref))}.`);
    }
    if (prob) l.push(`- Valoración del médico: ${minus(nombreDe(ESTADOS_PROBLEMA, prob.estado))}${prob.nota ? ` (${prob.nota})` : ''}.`);
    if (plan.prioridades[amb]) l.push(`- Prioridad: ${minus(nombreDe(PRIORIDADES, plan.prioridades[amb]))}.`);
    l.push(...objs.map((o) => `- Objetivo: ${lineaObjetivo(o)}.`));
    l.push(...ints.map((i) => `- Intervención: ${lineaIntervencion(i)}.`));
  }
  if (!l.length) l.push('', 'Sin instrumentos aplicados en este episodio.');
  return l;
}

function planAtencion(v, porId, hoy) {
  const plan = planDe(v);
  const probs = problemasPlan(v, porId, hoy);
  const l = [];
  l.push('', 'LISTA DE PROBLEMAS');
  l.push(...(probs.length ? probs.map((p) => `- ${lineaProblema(p)}`) : ['- Sin problemas registrados.']));
  l.push('Los hallazgos de tamizaje no son diagnósticos; el estado, la prioridad y las intervenciones los decide el médico.');
  const pref = CAMPOS_PREFERENCIAS.filter((c) => plan.preferencias[c.id]);
  // lineasPlan empieza con las preferencias (encabezado y una línea por campo): aquí van en su propia sección.
  const sinPref = lineasPlan(plan, probs.map((p) => p.ambito)).slice(pref.length ? pref.length + 1 : 0);
  if (sinPref.length) l.push('', 'OBJETIVOS E INTERVENCIONES POR PROBLEMA', ...sinPref);
  if (pref.length) l.push('', 'LO QUE IMPORTA A LA PERSONA', ...pref.map((c) => `- ${c.etiqueta}: ${plan.preferencias[c.id]}.`), 'Las preferencias registradas no sustituyen un documento de voluntad anticipada.');
  const rev = revaloraciones(plan, hoy);
  if (rev.length) l.push('', 'REVALORACIONES', ...rev.map((r) => `- ${r.nombre}: ${fechaCorta(r.fecha)}${r.dias < 0 ? ' (vencida)' : ''}.`));
  if (!planConContenido(plan) && !probs.length) l.push('', 'Aún no hay un plan de atención registrado.');
  return l;
}

function seguimiento(v, porId, hoy) {
  const plan = planDe(v);
  const l = [];
  const fechas = fechasEvaluacion(v);
  l.push('', 'FECHAS DE EVALUACIÓN');
  l.push(fechas.length ? `- ${fechas.map(fechaCorta).join(', ')}.` : '- Sin evaluaciones registradas.');
  const series = seriesEvolucion(v, porId);
  l.push('', 'EVOLUCIÓN DE LAS MEDICIONES REPETIDAS');
  if (series.length) {
    for (const s of series) {
      l.push(`- ${s.escala.corto}: ${s.puntos.map((p) => `${p.etiqueta} ${p.mostrar}`).join(' → ')}.`);
      if (s.cmp?.ultima) l.push(`  Cambio cuantitativo: ${textoCambio(s.cmp.ultima.vsRef, textoRespectoA(s.cmp.ref))}.`);
      if (s.significado) l.push(`  Significado clínico: ${s.significado.texto}`);
    }
  } else l.push('- Para comparar se necesitan al menos dos mediciones del mismo instrumento en el episodio.');
  l.push('', 'OBJETIVOS');
  if (plan.objetivos.length) {
    for (const o of plan.objetivos) l.push(`- ${nombreAmbito(o.ambito, plan)}: ${lineaObjetivo(o)}${objetivoVencido(o, hoy) ? '; plazo vencido' : ''}.`);
    const n = (e) => plan.objetivos.filter((o) => o.estado === e).length;
    l.push(`Resumen: ${ESTADOS_OBJETIVO.map((e) => `${minus(e.nombre)} ${n(e.id)}`).join(', ')}.`);
  } else l.push('- Sin objetivos registrados.');
  l.push('', 'INTERVENCIONES');
  if (plan.intervenciones.length) {
    l.push(...plan.intervenciones.map((i) => `- ${nombreAmbito(i.ambito, plan)}: ${lineaIntervencion(i)}.`));
    const n = (e) => plan.intervenciones.filter((i) => i.estado === e).length;
    l.push(`Resumen: ${ESTADOS_INTERVENCION.map((e) => `${minus(e.nombre)} ${n(e.id)}`).join(', ')}.`);
  } else l.push('- Sin intervenciones registradas.');
  const rev = revaloraciones(plan, hoy);
  if (rev.length) l.push('', 'REVALORACIONES', ...rev.map((r) => `- ${r.nombre}: ${fechaCorta(r.fecha)}${r.dias < 0 ? ` (vencida hace ${-r.dias} días)` : r.dias === 0 ? ' (hoy)' : ''}.`));
  const bit = [...plan.bitacora].sort((a, b) => (a.ts || 0) - (b.ts || 0)).slice(-15);
  if (bit.length) l.push('', 'CAMBIOS DEL PLAN', ...bit.map((b) => `- ${b.fecha ? `${fechaCorta(b.fecha)}: ` : ''}${b.texto}`));
  return l;
}

// Texto completo del informe (encabezado, cuerpo y pie).
export function textoInforme(formato, v, { porId, dominios, hoy = isoDe(new Date()), version = '' }) {
  const f = formatoInforme(formato);
  if (!f) return '';
  let cuerpo;
  if (formato === 'completa') {
    const nota = notaValoracion(v, porId, dominios, new Date(`${hoy}T12:00:00`), 'completa').split('\n');
    cuerpo = ['', ...nota.slice(nota.findIndex((x) => x.startsWith('1. ')))];
  } else if (formato === 'icope') {
    const t = textoIcope(v, hoy).split('\n');
    cuerpo = ['', ...t.slice(t.findIndex((x) => x === '') + 1)];
  } else if (formato === 'evolucion') cuerpo = evolucionBreve(v, porId, dominios, hoy);
  else if (formato === 'dominios') cuerpo = resumenDominios(v, porId, dominios, hoy);
  else if (formato === 'plan') cuerpo = planAtencion(v, porId, hoy);
  else cuerpo = seguimiento(v, porId, hoy);
  const titulo = formato === 'completa' ? 'Valoración geriátrica integral' : formato === 'icope' ? 'Valoración ICOPE · capacidad intrínseca' : f.nombre;
  return [...encabezado(titulo, v, hoy), ...cuerpo, '', pieInforme(version)].join('\n').replace(/\n{3,}/g, '\n\n');
}

// Bloques para la vista previa: título, encabezados, listas y párrafos.
export function bloquesInforme(texto) {
  const lineas = texto.split('\n');
  const bloques = [];
  let lista = null;
  const cerrar = () => { if (lista) { bloques.push(lista); lista = null; } };
  lineas.forEach((t, i) => {
    if (i === 0) { bloques.push({ tipo: 'titulo', texto: t }); return; }
    if (!t.trim()) { cerrar(); return; }
    const encabezadoMayus = /^(\d+\.\s)?[A-ZÁÉÍÓÚÑÜ0-9 ,·()/-]+$/.test(t) && /[A-ZÁÉÍÓÚÑ]{3}/.test(t);
    if (encabezadoMayus || /:$/.test(t) && !t.startsWith('- ') && t.length < 80) { cerrar(); bloques.push({ tipo: 'encabezado', texto: t.replace(/:$/, '') }); return; }
    if (t.startsWith('- ')) { if (!lista) lista = { tipo: 'lista', items: [] }; lista.items.push({ texto: t.slice(2), sub: [] }); return; }
    if (t.startsWith('  ') && lista?.items.length) { lista.items.at(-1).sub.push(t.trim()); return; }
    cerrar();
    bloques.push({ tipo: 'parrafo', texto: t });
  });
  cerrar();
  return bloques;
}
