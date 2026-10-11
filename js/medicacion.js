// Revisión de medicamentos: registro de la medicación, STOPP/START v3 criterio por criterio y revisión manual
// de los criterios de Beers 2023. No hay puntaje y nada se suspende ni se ajusta automáticamente.
import { STOPP, START, CRITERIOS } from '../escalas/stoppstart-datos.js';

export { STOPP, START, CRITERIOS };
export const porIdCriterio = Object.fromEntries(CRITERIOS.map((c) => [c.id, c]));

export const ESTADOS_CRITERIO = [
  { id: 'sin', nombre: 'Sin revisar' },
  { id: 'cumple', nombre: 'Se cumple' },
  { id: 'no', nombre: 'No se cumple' },
  { id: 'ne', nombre: 'No evaluable' },
];

// Categorías de los criterios de Beers 2023 (American Geriatrics Society). Huella no reproduce sus tablas.
export const BEERS = [
  { id: 'evitar', tabla: 2, nombre: 'Medicamentos potencialmente inapropiados que en general conviene evitar' },
  { id: 'enfermedad', tabla: 3, nombre: 'Medicamentos inapropiados por interacción con una enfermedad o síndrome' },
  { id: 'precaucion', tabla: 4, nombre: 'Medicamentos que se usan con precaución' },
  { id: 'interacciones', tabla: 5, nombre: 'Interacciones entre medicamentos que conviene evitar' },
  { id: 'renal', tabla: 6, nombre: 'Medicamentos que se evitan o ajustan según la función renal' },
  { id: 'anticolinergicos', tabla: 7, nombre: 'Medicamentos con efecto anticolinérgico fuerte' },
];
export const ESTADOS_BEERS = [
  { id: 'sin', nombre: 'Sin revisar' },
  { id: 'ok', nombre: 'Revisada sin hallazgos' },
  { id: 'hallazgo', nombre: 'Con hallazgos' },
  { id: 'ne', nombre: 'No evaluable' },
];
export const ENLACE_BEERS = 'https://doi.org/10.1111/jgs.18372';
export const ENLACE_STOPP = 'https://doi.org/10.1007/s41999-023-00777-y';

export const CAMPOS_MEDICAMENTO = [
  { id: 'generico', etiqueta: 'Nombre genérico', requerido: true, max: 80 },
  { id: 'comercial', etiqueta: 'Nombre comercial (opcional)', max: 60 },
  { id: 'dosis', etiqueta: 'Dosis', max: 40, ejemplo: 'p. ej., 50 mg' },
  { id: 'presentacion', etiqueta: 'Presentación', max: 40, ejemplo: 'p. ej., tableta' },
  { id: 'via', etiqueta: 'Vía', max: 30, ejemplo: 'p. ej., oral' },
  { id: 'frecuencia', etiqueta: 'Frecuencia', max: 40, ejemplo: 'p. ej., cada 12 h' },
  { id: 'indicacion', etiqueta: 'Indicación', max: 80 },
  { id: 'duracion', etiqueta: 'Duración o fecha de inicio', max: 40, ejemplo: 'p. ej., 3 años' },
  { id: 'observaciones', etiqueta: 'Observaciones', max: 160 },
];

export const vacia = () => ({ meds: [], renal: null, stopp: {}, beers: {}, paliativo: false });
export const medicacionDe = (v) => ({ ...vacia(), ...(v?.medicacion || {}) });
const limpio = (t, max = 160) => String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

// Normaliza un medicamento capturado: recorta, limita longitud y exige el nombre genérico.
export function normalizarMedicamento(datos, id) {
  const m = { id };
  for (const c of CAMPOS_MEDICAMENTO) m[c.id] = limpio(datos[c.id], c.max);
  if (!m.generico) return null;
  return m;
}

export function lineaMedicamento(m) {
  const nombre = m.comercial ? `${m.generico} (${m.comercial})` : m.generico;
  const pauta = [m.dosis, m.presentacion, m.via, m.frecuencia].filter(Boolean).join(' ');
  const extra = [m.indicacion ? `indicación: ${m.indicacion}` : 'indicación no registrada', m.duracion ? `duración: ${m.duracion}` : '', m.observaciones].filter(Boolean).join('; ');
  return `${nombre}${pauta ? ` ${pauta}` : ''} (${extra})`;
}

// Función renal usada en la revisión: { tfg: { valor, fecha, fuente }, depuracion: { valor, fecha, fuente } }.
const FUENTES_RENAL = { ckdepi: 'CKD-EPI 2021', cockcroft: 'Cockcroft-Gault', manual: 'registrada manualmente' };
const fechaDMA = (f) => (f ? f.split('-').reverse().join('/') : '');
export function textoRenal(r) {
  if (!r) return '';
  const parte = (x, nombre, unidad) => (x && Number.isFinite(x.valor)
    ? `${nombre} ${x.valor} ${unidad} (${[FUENTES_RENAL[x.fuente], fechaDMA(x.fecha)].filter(Boolean).join(', ')})`
    : '');
  return [parte(r.tfg, 'TFGe', 'mL/min/1.73 m²'), parte(r.depuracion, 'depuración de creatinina', 'mL/min')].filter(Boolean).join('; ');
}

const estadoDe = (m, id) => m.stopp[id]?.estado || 'sin';

// Resultados de la revisión: medicamentos, criterios revisados, posibles problemas, información pendiente y sugerencias.
export function resumenMedicacion(med) {
  const m = { ...vacia(), ...(med || {}) };
  const nombreMed = (id) => m.meds.find((x) => x.id === id)?.generico || '';
  const conteo = { stopp: { cumple: 0, no: 0, ne: 0, sin: 0 }, start: { cumple: 0, no: 0, ne: 0, sin: 0 } };
  const problemas = [];
  const pendientes = [];
  for (const c of CRITERIOS) {
    const est = estadoDe(m, c.id);
    conteo[c.tipo][est] += 1;
    if (est === 'cumple') {
      const f = c.tipo === 'stopp' ? nombreMed(m.stopp[c.id]?.med) : '';
      problemas.push(c.tipo === 'stopp'
        ? `${c.codigo}: posible prescripción inapropiada${f ? ` (${f})` : ''}. ${c.texto}`
        : `${c.codigo}: posible omisión de un tratamiento indicado. ${c.texto}`);
    }
    if (est === 'ne') pendientes.push(`${c.codigo}: no evaluable con la información disponible.`);
  }
  for (const b of BEERS) {
    const r = m.beers[b.id] || {};
    if (r.estado === 'hallazgo') problemas.push(`Beers 2023, tabla ${b.tabla} (${b.nombre.toLowerCase()})${r.nota ? `: ${r.nota}` : ': hallazgo sin detalle registrado'}.`);
    if (r.estado === 'ne') pendientes.push(`Beers 2023, tabla ${b.tabla}: no evaluable con la información disponible.`);
  }
  const sinIndicacion = m.meds.filter((x) => !x.indicacion).map((x) => x.generico);
  if (sinIndicacion.length) pendientes.push(`Indicación no registrada: ${sinIndicacion.join(', ')}.`);
  if (m.meds.length && !textoRenal(m.renal)) pendientes.push('Función renal no registrada: se necesita para la sección E de STOPP y la tabla 6 de Beers.');
  const revisados = { stopp: 133 - conteo.stopp.sin, start: 57 - conteo.start.sin };
  const beersRevisadas = BEERS.filter((b) => (m.beers[b.id]?.estado || 'sin') !== 'sin').length;
  if (m.meds.length && revisados.stopp + revisados.start < CRITERIOS.length) {
    pendientes.push(`Criterios STOPP/START sin revisar: ${conteo.stopp.sin} de 133 STOPP y ${conteo.start.sin} de 57 START.`);
  }
  if (m.meds.length && beersRevisadas < BEERS.length) pendientes.push(`Categorías de Beers sin revisar: ${BEERS.length - beersRevisadas} de ${BEERS.length}.`);

  const sugerencias = [];
  if (problemas.length) {
    sugerencias.push('Revisar cada posible problema con la persona, su cuidador y el médico tratante: beneficio esperado, riesgo, preferencias y pronóstico.');
    sugerencias.push('Cualquier suspensión, sustitución o cambio de dosis es una decisión clínica; varios fármacos requieren retiro gradual (p. ej., benzodiacepinas, antidepresivos, betabloqueadores).');
  }
  if (pendientes.length && m.meds.length) sugerencias.push('Completar la información pendiente antes de concluir la revisión.');
  if (m.paliativo) sugerencias.push('En cuidados paliativos o al final de la vida, priorizar el confort y los objetivos de la persona: los criterios START no aplican y los de Beers no se aplican de forma indiscriminada.');
  const hayContenido = Boolean(m.meds.length || revisados.stopp || revisados.start || beersRevisadas || textoRenal(m.renal));
  return { m, conteo, revisados, beersRevisadas, problemas, pendientes, sugerencias, hayContenido };
}

// Texto para la nota en el formato elegido. Devuelve partes que la nota coloca en su sección.
export function partesNota(med) {
  const s = resumenMedicacion(med);
  if (!s.hayContenido) return null;
  const { m } = s;
  const renal = textoRenal(m.renal);
  const revision = `STOPP/START v3: ${s.revisados.stopp} de 133 STOPP y ${s.revisados.start} de 57 START revisados (se cumplen ${s.conteo.stopp.cumple} STOPP y ${s.conteo.start.cumple} START; no evaluables ${s.conteo.stopp.ne + s.conteo.start.ne}). Beers 2023: ${s.beersRevisadas} de ${BEERS.length} categorías revisadas.`;
  return {
    medicamentos: m.meds.map(lineaMedicamento),
    renal,
    revision,
    problemas: s.problemas,
    pendientes: s.pendientes,
    sugerencias: s.sugerencias,
    paliativo: m.paliativo,
  };
}

// Texto autónomo de la revisión (para copiar desde la pantalla de medicamentos).
export function textoRevision(med) {
  const p = partesNota(med);
  if (!p) return 'Sin medicamentos ni criterios revisados.';
  const l = ['REVISIÓN DE MEDICAMENTOS'];
  if (p.paliativo) l.push('Contexto: cuidados paliativos o final de la vida.');
  l.push('', `Medicamentos (${p.medicamentos.length}):`, ...(p.medicamentos.length ? p.medicamentos.map((x) => `- ${x}`) : ['- Sin medicamentos registrados.']));
  if (p.renal) l.push(`Función renal: ${p.renal}.`);
  l.push('', 'Criterios revisados:', `- ${p.revision}`);
  l.push('', 'Posibles problemas:', ...(p.problemas.length ? p.problemas.map((x) => `- ${x}`) : ['- Ninguno identificado en los criterios revisados; la conclusión se limita a ellos.']));
  if (p.pendientes.length) l.push('', 'Información pendiente:', ...p.pendientes.map((x) => `- ${x}`));
  if (p.sugerencias.length) l.push('', 'Sugerencias orientativas (no son órdenes de suspensión ni de ajuste):', ...p.sugerencias.map((x) => `- ${x}`));
  return l.join('\n');
}
