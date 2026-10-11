// Centro de pendientes y vigencia de los resultados (fase 3.1). Solo lee la valoración: no cambia nada ni decide
// por el médico. Los periodos que usa están declarados aquí y se muestran junto a cada indicador.
import { calcular, momentoDe } from './motor.js';
import { ordenarCronologico, vigenteDe, diasEntre, fechaCorta } from './comparacion.js';
import { planDe, nombreAmbito } from './plan.js';
import { revaloraciones, objetivoVencido } from './atencion.js';
import { estadosIcope } from './icope.js';
import { episodioDe } from './episodio.js';
import { DIAS_EPISODIO } from './nota.js';

// Periodo de referencia de Huella para señalar un resultado como posiblemente desactualizado: el mismo que usa el
// aviso de valoraciones largas. No es un criterio de validez de ningún instrumento.
export const DIAS_REFERENCIA = DIAS_EPISODIO;
// Instrumentos que describen el estado de un momento (sedación, delirium, signos vitales): solo valen el día en que
// se aplicaron.
export const MOMENTANEOS = ['rass', 'camicu', 'cam', '4at', 'news2'];

export const VIGENCIAS = {
  reciente: { nombre: 'Reciente' },
  anterior: { nombre: 'Aplicación anterior' },
  desactualizado: { nombre: 'Posiblemente desactualizado' },
  confirmar: { nombre: 'Requiere confirmación' },
};
export const TEXTO_PERIODOS = `Vigencia: «reciente» es la aplicación más reciente, de este episodio y de los últimos ${DIAS_REFERENCIA} días; «aplicación anterior», cuando hay otra más reciente del mismo instrumento; «requiere confirmación», si se aplicó antes de abrir el episodio; «posiblemente desactualizado», si tiene más de ${DIAS_REFERENCIA} días (periodo de referencia de Huella, no un criterio de validez del instrumento) o si describe un estado momentáneo (RASS, CAM-ICU, CAM, 4AT, NEWS2) de otro día.`;

const href = (r) => `#/e/${r.escalaId}${r.momento ? `@${r.momento}` : ''}/resultado`;

// Vigencia de una aplicación dentro de la lista de aplicaciones del mismo instrumento. El basal describe a propósito
// un estado previo: no lleva indicador.
export function vigenciaResultado(r, aplicaciones, v, hoy) {
  if (!r || r.momento === 'basal') return null;
  const vig = vigenteDe(aplicaciones);
  if (vig && vig !== r && vig.id !== r.id) return { estado: 'anterior', texto: 'Hay una aplicación más reciente del mismo instrumento.' };
  const f = r.fecha || '';
  if (!f) return null;
  const abierto = episodioDe(v).abierto;
  if (MOMENTANEOS.includes(r.escalaId) && f < hoy) {
    return { estado: 'desactualizado', texto: `Describe el estado del ${fechaCorta(f)}; vuelve a aplicarlo si necesitas el estado actual.` };
  }
  if (abierto && f < abierto) {
    return { estado: 'confirmar', texto: `Aplicado el ${fechaCorta(f)}, antes de abrir el episodio (${fechaCorta(abierto)}): confirma que sigue vigente o repítelo; si describe el estado previo, regístralo como basal.` };
  }
  const dias = diasEntre(f, hoy);
  if (dias > DIAS_REFERENCIA) {
    return { estado: 'desactualizado', texto: `Aplicado hace ${dias} días, más que el periodo de referencia de Huella (${DIAS_REFERENCIA} días; no es un criterio de validez del instrumento).` };
  }
  return { estado: 'reciente', texto: `Aplicado el ${fechaCorta(f)}, en este episodio.` };
}

// Respuestas en edición con al menos un dato capturado por el médico (sin contar los datos precargados) y que aún
// no permiten calcular el resultado.
export function instrumentosIncompletos(borradores, porId) {
  const out = [];
  for (const { escalaId, momento, r } of borradores) {
    const e = porId[escalaId];
    if (!e || !r || r._noEvaluable) continue;
    const capturados = e.campos.filter((c) => !c.prefill && r[c.id] !== undefined && r[c.id] !== null && r[c.id] !== '' && !(Array.isArray(r[c.id]) && !r[c.id].length));
    if (!capturados.length) continue;
    const res = calcular(e, r);
    if (res.completo) continue;
    const m = momento ? momentoDe(momento)?.enNota : '';
    const progreso = Number.isFinite(res.total) && res.total > 0 ? `${res.contestadas} de ${res.total} respondidas` : 'sin terminar';
    out.push({ texto: `${e.corto}${m ? ` ${m}` : ''}: ${progreso}.`, href: `#/e/${escalaId}${momento ? `@${momento}` : ''}` });
  }
  return out;
}

// Todos los pendientes de la valoración en curso, agrupados. `rutas`: [{ id, nombre, pendientes }] de las rutas empezadas.
export function centroPendientes(v, porId, hoy, { borradores = [], rutas = [] } = {}) {
  const grupos = [];
  const agregar = (id, titulo, items, ayuda = '') => { if (items.length) grupos.push({ id, titulo, ayuda, items }); };

  agregar('incompletos', 'Instrumentos sin terminar', instrumentosIncompletos(borradores, porId), 'Respuestas guardadas en esta sesión del navegador que aún no forman un resultado.');

  const porInstrumento = {};
  for (const r of v.resultados || []) if (porId[r.escalaId]) (porInstrumento[r.escalaId] = porInstrumento[r.escalaId] || []).push(r);
  const vigentes = Object.values(porInstrumento).map((rs) => ({ rs, r: vigenteDe(rs) })).filter((x) => x.r);
  agregar('no_evaluables', 'No evaluables', vigentes.filter(({ r }) => r.noEvaluable).map(({ r }) => ({
    texto: `${porId[r.escalaId].corto}: no evaluable (${r.noEvaluable}) el ${fechaCorta(r.fecha)}. Repetir cuando sea posible o elegir otra herramienta.`,
    href: href(r),
  })));

  const complementarias = [];
  const icope = estadosIcope(v, hoy);
  const sinBasica = icope.filter((x) => x.estado === 'pendiente');
  if (sinBasica.length && sinBasica.length < icope.length) {
    complementarias.push({ texto: `ICOPE: evaluación básica pendiente en ${sinBasica.map((x) => x.dom.nombre.toLowerCase()).join(', ')}.`, href: '#/icope/basica' });
  }
  for (const x of icope) {
    if (x.estado === 'pendiente') continue;
    if (x.necesidad.tipo === 'detallada') complementarias.push({ texto: `ICOPE · ${x.dom.nombre}: evaluación detallada pendiente.`, href: `#/icope/detallada#d-${x.dom.id}` });
    if (x.necesidad.tipo === 'confirmar') complementarias.push({ texto: `ICOPE · ${x.dom.nombre}: evaluación previa por confirmar o repetir.`, href: `#/icope/detallada#d-${x.dom.id}` });
  }
  for (const ruta of rutas) {
    if (ruta.pendientes > 0) complementarias.push({ texto: `${ruta.nombre}: ${ruta.pendientes} ${ruta.pendientes === 1 ? 'paso pendiente' : 'pasos pendientes'}.`, href: `#/r/${ruta.id}` });
  }
  agregar('complementarias', 'Evaluaciones pendientes', complementarias);

  const plan = planDe(v);
  const abiertos = plan.objetivos.filter((o) => ['pendiente', 'en_curso'].includes(o.estado || 'pendiente'));
  const objetivos = abiertos
    .map((o) => ({ o, vencido: objetivoVencido(o, hoy) }))
    .sort((a, b) => Number(b.vencido) - Number(a.vencido) || String(a.o.plazo || '9').localeCompare(String(b.o.plazo || '9')))
    .map(({ o, vencido }) => ({
      texto: `${nombreAmbito(o.ambito, plan)}: ${o.texto}${o.plazo ? ` (plazo ${fechaCorta(o.plazo)}${vencido ? ', vencido' : ''})` : ' (sin plazo)'}.`,
      href: '#/plan',
      vencido,
    }));
  agregar('objetivos', 'Objetivos sin terminar', objetivos);

  agregar('revaloraciones', 'Revaloraciones vencidas o de hoy', revaloraciones(plan, hoy).filter((x) => x.dias <= 0).map((x) => ({
    texto: `${x.nombre}: ${x.dias === 0 ? 'programada para hoy' : `programada para el ${fechaCorta(x.fecha)} (hace ${-x.dias} ${x.dias === -1 ? 'día' : 'días'})`}.`,
    href: '#/plan',
  })));

  const vigencia = [];
  for (const { rs, r } of vigentes) {
    if (r.noEvaluable) continue;
    const x = vigenciaResultado(r, rs, v, hoy);
    if (x && (x.estado === 'desactualizado' || x.estado === 'confirmar')) vigencia.push({ texto: `${porId[r.escalaId].corto}: ${x.texto}`, href: href(r), estado: x.estado });
  }
  agregar('vigencia', 'Resultados por revisar su vigencia', vigencia, TEXTO_PERIODOS);

  return { grupos, total: grupos.reduce((s, g) => s + g.items.length, 0) };
}

// Inicio rápido: las aplicaciones guardadas más recientes (por fecha de aplicación y hora de guardado).
export function resultadosRecientes(v, porId, n = 3) {
  return ordenarCronologico((v.resultados || []).filter((r) => porId[r.escalaId]))
    .filter((r) => r.momento !== 'basal')
    .reverse()
    .slice(0, n)
    .map((r) => ({ r, href: href(r) }));
}
