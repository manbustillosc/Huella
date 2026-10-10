// Texto de la valoración para el expediente y comparación entre momentos (basal, ingreso, actual, egreso).
import { MOMENTOS, momentoDe, FUENTES, calcular, minusculaInicial } from './motor.js';

export const FORMATOS_NOTA = ['parrafo', 'lista', 'completa'];
const ORDEN = Object.fromEntries(MOMENTOS.map((m, i) => [m.id, i]));
const SEXO = { mujer: 'mujer', hombre: 'hombre' };

export const fechaCorta = (d) => {
  const x = d instanceof Date ? d : new Date(`${d}T12:00:00`);
  return Number.isNaN(x.getTime()) ? '' : x.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fuenteTexto = (id) => FUENTES.find((f) => f.id === id)?.nombre.toLowerCase() || '';

// «90/100 (dependencia moderada)» o «62 mL/min/1.73 m² (G2…)» a partir de un resultado guardado.
export function valorGuardado(r) {
  if (r.noEvaluable) return `no evaluable (${minusculaInicial(r.noEvaluable)})`;
  const cifra = r.puntaje != null && r.max != null ? `${r.puntaje}/${r.max}` : `${r.mostrar ?? r.valor} ${r.unidad || ''}`.trim();
  return `${cifra} (${minusculaInicial(r.etiqueta)})`;
}

export function breveGuardado(r, escalasPorId) {
  if (r.breve) return r.breve;
  return `${escalasPorId[r.escalaId]?.corto ?? r.escalaId} ${valorGuardado(r)}`;
}

/* ---------- Comparación entre momentos ---------- */

// Ordena los resultados de una misma escala por momento y compara cada uno con el basal (o el primero).
export function compararMomentos(resultados, escala) {
  const lista = [...resultados].filter((r) => r.momento).sort((a, b) => ORDEN[a.momento] - ORDEN[b.momento]);
  if (lista.length < 2) return null;
  const ref = lista.find((r) => r.momento === 'basal') || lista[0];
  const comparaciones = lista.filter((r) => r !== ref).map((r) => {
    const dif = r.puntaje != null && ref.puntaje != null && !r.noEvaluable && !ref.noEvaluable ? r.puntaje - ref.puntaje : null;
    const cambioCategoria = dif != null && r.etiqueta !== ref.etiqueta;
    const empeoradas = escala ? reactivosEmpeorados(escala, ref, r) : [];
    return { r, dif, cambioCategoria, empeoradas };
  });
  return { ref, lista, comparaciones };
}

// Reactivos con menor puntaje que en el momento de referencia (solo escalas donde más puntaje es mejor).
export function reactivosEmpeorados(escala, ref, actual) {
  if (escala.mayorEsMejor === false || !ref.respuestas || !actual.respuestas) return [];
  const a = calcular(escala, ref.respuestas);
  const b = calcular(escala, actual.respuestas);
  const antes = Object.fromEntries(a.desglose.filter((d) => d.valor != null && !d.opcion?.especial).map((d) => [d.campo.id, d.valor]));
  return b.desglose
    .filter((d) => d.valor != null && !d.opcion?.especial && antes[d.campo.id] != null && d.valor < antes[d.campo.id])
    .map((d) => d.campo.textoCorto || d.campo.texto);
}

function textoCambio(c, ref, unidad = 'puntos') {
  if (c.dif == null) return '';
  const quien = momentoDe(ref.momento)?.enNota || ref.momento;
  const base = c.dif < 0 ? `disminución de ${Math.abs(c.dif)} ${unidad}` : c.dif > 0 ? `aumento de ${c.dif} ${unidad}` : 'sin cambio en el puntaje';
  return `${base} respecto al ${quien === 'basal' ? 'basal' : `valor ${quien}`}${c.cambioCategoria ? ', con cambio de categoría' : ''}`;
}

// «Barthel basal 95/100 (dependencia escasa), al ingreso 45/100 (dependencia grave), con disminución de 50 puntos respecto al basal»
export function textoComparado(escala, cmp, { detalle = false, fuentes = false } = {}) {
  const partes = cmp.lista.map((r) => {
    const m = momentoDe(r.momento)?.enNota || r.momento;
    const extra = [];
    if (fuentes && r.fuente) extra.push(`fuente: ${fuenteTexto(r.fuente)}`);
    if (fuentes && r.fecha && r.fecha !== hoyISO()) extra.push(fechaCorta(r.fecha));
    const v = valorGuardado(r);
    return `${m} ${extra.length ? v.replace(/\)$/, `; ${extra.join(', ')})`) : v}`;
  });
  let t = `${escala.corto} ${partes.join(', ')}`;
  const cambios = cmp.comparaciones.filter((c) => c.dif != null).map((c) => textoCambio(c, cmp.ref, escala.unidadCambio));
  const ultimo = cmp.comparaciones.at(-1);
  if (cambios.length) t += `, con ${cambios.at(-1)}`;
  if (detalle && ultimo?.empeoradas.length) t += `; ${escala.textoEmpeoradas || 'reactivos con menor puntaje que el basal'}: ${ultimo.empeoradas.map(minusculaInicial).join(', ')}`;
  return t;
}

/* ---------- Nota de la valoración ---------- */

function datosPaciente(p = {}) {
  const datos = [];
  if (p.sexo && SEXO[p.sexo]) datos.push(SEXO[p.sexo]);
  if (p.edad) datos.push(`${p.edad} años`);
  if (p.escolaridad !== undefined && p.escolaridad !== '' && p.escolaridad != null) datos.push(`escolaridad ${p.escolaridad} años`);
  return datos;
}

// Agrupa por dominio y, dentro, por escala (con todos sus momentos).
function agrupar(valoracion, escalasPorId, dominios) {
  return dominios.map((d) => {
    const rs = valoracion.resultados.filter((r) => escalasPorId[r.escalaId]?.dominio === d.id);
    const porEscala = [];
    for (const r of rs) {
      let g = porEscala.find((x) => x.escalaId === r.escalaId);
      if (!g) porEscala.push((g = { escalaId: r.escalaId, escala: escalasPorId[r.escalaId], rs: [] }));
      g.rs.push(r);
    }
    for (const g of porEscala) g.rs.sort((a, b) => (ORDEN[a.momento] ?? 2) - (ORDEN[b.momento] ?? 2));
    return { d, porEscala };
  }).filter((x) => x.porEscala.length);
}

// El resultado más reciente de cada escala (egreso > actual > ingreso > basal).
export function resultadoVigente(rs) {
  return [...rs].sort((a, b) => (ORDEN[b.momento] ?? 2) - (ORDEN[a.momento] ?? 2))[0];
}

function lineaEscala(g, escalasPorId, formato) {
  const cmp = g.rs.length > 1 ? compararMomentos(g.rs, g.escala) : null;
  if (cmp) return textoComparado(g.escala, cmp, { detalle: formato === 'completa', fuentes: formato !== 'parrafo' });
  const r = g.rs[0];
  const m = r.momento && r.momento !== 'actual' ? ` ${momentoDe(r.momento)?.enNota}` : '';
  if (formato === 'parrafo') return breveGuardado(r, escalasPorId).replace(g.escala?.corto ?? '', `${g.escala?.corto ?? ''}${m}`);
  const fuente = r.fuente && formato !== 'parrafo' ? ` Fuente: ${fuenteTexto(r.fuente)}.` : '';
  if (formato === 'completa') return `${breveGuardado(r, escalasPorId).replace(g.escala?.corto ?? '', `${g.escala?.corto ?? ''}${m}`)}${r.fuente ? ` (fuente: ${fuenteTexto(r.fuente)})` : ''}`;
  return `${r.resumen.replace(`${g.escala?.corto}:`, `${g.escala?.corto}${m}:`)}${fuente}`;
}

export function hallazgosYSugerencias(valoracion, escalasPorId) {
  const hallazgos = [];
  const sugerencias = [];
  const noEvaluables = [];
  const ids = [...new Set(valoracion.resultados.map((r) => r.escalaId))];
  for (const id of ids) {
    const escala = escalasPorId[id];
    if (!escala) continue;
    const rs = valoracion.resultados.filter((r) => r.escalaId === id);
    const vig = resultadoVigente(rs);
    if (vig.noEvaluable) {
      noEvaluables.push(`${escala.corto} (${minusculaInicial(vig.noEvaluable)})`);
      continue;
    }
    if (vig.hallazgo) hallazgos.push(`${breveGuardado(vig, escalasPorId)}.`);
    const cmp = rs.length > 1 ? compararMomentos(rs, escala) : null;
    const ultimo = cmp?.comparaciones.at(-1);
    if (ultimo?.dif != null && ultimo.dif < 0) {
      hallazgos.push(`Disminución de ${Math.abs(ultimo.dif)} ${escala.unidadCambio || 'puntos'} en ${escala.corto} respecto al ${cmp.ref.momento === 'basal' ? 'basal' : momentoDe(cmp.ref.momento)?.enNota}${ultimo.empeoradas.length ? ` (${ultimo.empeoradas.map(minusculaInicial).join(', ')})` : ''}; la causa y la reversibilidad requieren valoración clínica.`);
    }
    for (const s of vig.sugerencias || []) if (!sugerencias.includes(s)) sugerencias.push(s);
  }
  return { hallazgos, sugerencias, noEvaluables };
}

// formato 'lista': encabezado por dominio y un renglón por escala.
// formato 'parrafo': todo seguido; dominios separados por punto y escalas por punto y coma.
// formato 'completa': resultados por dominio, cambios, hallazgos y sugerencias separadas de los resultados.
export function notaValoracion(valoracion, escalasPorId, dominios, fecha = new Date(), formato = 'lista') {
  const f = fechaCorta(fecha);
  const p = valoracion.paciente || {};
  const datos = datosPaciente(p);
  const contexto = (p.contexto || '').trim().replace(/\.$/, '');
  const grupos = agrupar(valoracion, escalasPorId, dominios);

  if (formato === 'parrafo') {
    const partes = [`Valoración geriátrica ${f}.`];
    if (datos.length) partes.push(`Paciente: ${datos.join(', ')}.`);
    if (contexto) partes.push(`Contexto: ${contexto}.`);
    for (const { d, porEscala } of grupos) partes.push(`${d.nombre}: ${porEscala.map((g) => lineaEscala(g, escalasPorId, 'parrafo')).join('; ')}.`);
    return partes.join(' ');
  }

  if (formato === 'completa') {
    const l = ['VALORACIÓN GERIÁTRICA INTEGRAL', `Fecha: ${f}`];
    if (datos.length) l.push(`Paciente: ${datos.join(', ')}.`);
    if (contexto) l.push(`Contexto clínico: ${contexto}.`);
    l.push('', 'RESULTADOS POR DOMINIO');
    for (const { d, porEscala } of grupos) l.push(`${d.nombre}: ${porEscala.map((g) => lineaEscala(g, escalasPorId, 'completa')).join('; ')}.`);
    const { hallazgos, sugerencias, noEvaluables } = hallazgosYSugerencias(valoracion, escalasPorId);
    l.push('', 'HALLAZGOS QUE REQUIEREN ATENCIÓN');
    l.push(...(hallazgos.length ? hallazgos.map((h) => `- ${h}`) : ['- Sin hallazgos anormales en los instrumentos aplicados.']));
    if (noEvaluables.length) l.push('', `Instrumentos no evaluables: ${noEvaluables.join('; ')}.`);
    if (sugerencias.length) {
      l.push('', 'SUGERENCIAS DE EVALUACIÓN COMPLEMENTARIA (orientativas; no son resultados)');
      l.push(...sugerencias.map((s) => `- ${s}`));
    }
    return l.join('\n');
  }

  const lineas = [`VALORACIÓN GERIÁTRICA · ${f}`];
  if (datos.length) lineas.push(`Paciente: ${datos.join(', ')}.`);
  if (contexto) lineas.push(`Contexto: ${contexto}.`);
  for (const { d, porEscala } of grupos) {
    lineas.push('', d.nombre.toUpperCase());
    for (const g of porEscala) {
      if (g.rs.length > 1) {
        for (const r of g.rs) lineas.push(`- ${g.escala.corto} ${momentoDe(r.momento)?.enNota}: ${valorGuardado(r)}.${r.fuente ? ` Fuente: ${fuenteTexto(r.fuente)}.` : ''}`);
        const cmp = compararMomentos(g.rs, g.escala);
        const c = cmp?.comparaciones.at(-1);
        if (c?.dif != null) lineas.push(`  Cambio: ${textoCambio(c, cmp.ref, g.escala.unidadCambio)}.`);
      } else {
        lineas.push(`- ${lineaEscala(g, escalasPorId, 'lista')}`);
      }
    }
  }
  return lineas.join('\n');
}
