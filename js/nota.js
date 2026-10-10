// Texto de la valoración para el expediente.
// Formatos: 'parrafo' (compacto), 'lista' (un renglón por aplicación) y 'completa', que separa
// 1) resultados objetivos, 2) interpretación, 3) cambios longitudinales, 4) hallazgos y 5) sugerencias.
import { FUENTES, minusculaInicial } from './motor.js';
import {
  ordenarCronologico, vigenteDe, compararResultados, etiquetaAplicacion, fechaCorta, isoDe,
  textoRespectoA, textoCambio, inconsistenciasCronologicas, amplitudDias,
} from './comparacion.js';

export { fechaCorta };
export const FORMATOS_NOTA = ['parrafo', 'lista', 'completa'];
// Dominios que una valoración geriátrica integral suele cubrir; la nota completa avisa si faltan.
export const DOMINIOS_NUCLEO = ['funcional', 'cognitivo', 'afectivo', 'fragilidad', 'nutricion'];
export const DIAS_EPISODIO = 90;
const SEXO = { mujer: 'mujer', hombre: 'hombre' };

const fuenteTexto = (id) => FUENTES.find((f) => f.id === id)?.nombre.toLowerCase() || '';

// Cifra del resultado sin interpretación: «45/100», «0.75 m/s», «52 mL/min/1.73 m²». Null si no es numérico.
export function cifraGuardada(r) {
  if (r.noEvaluable) return null;
  if (Number.isFinite(r.puntaje) && r.max != null) return `${r.puntaje}/${r.max}`;
  if (Number.isFinite(r.puntaje)) return String(r.puntaje);
  if (Number.isFinite(r.valor)) return `${r.mostrar ?? r.valor} ${r.unidad || ''}`.trim();
  return null;
}

// «45/100 (dependencia grave)», o solo la categoría si el resultado no es numérico.
export function valorGuardado(r) {
  if (r.noEvaluable) return `no evaluable (${minusculaInicial(r.noEvaluable)})`;
  const cifra = cifraGuardada(r);
  const etiqueta = r.etiqueta ? minusculaInicial(r.etiqueta) : '';
  if (!cifra) return etiqueta || r.resumen || '';
  return etiqueta ? `${cifra} (${etiqueta})` : cifra;
}

export function breveGuardado(r, escalasPorId) {
  if (r.breve) return r.breve;
  return `${escalasPorId[r.escalaId]?.corto ?? r.escalaId} ${valorGuardado(r)}`;
}

// Etiqueta de la aplicación con fuente: «basal (estado al 20/09/2026; fuente: cuidador)».
function etiquetaConFuente(r, hoy, conFuente) {
  const base = etiquetaAplicacion(r, { omitirFecha: hoy });
  const fuente = conFuente && r.fuente ? `fuente: ${fuenteTexto(r.fuente)}` : '';
  if (!fuente) return base;
  if (base.endsWith(')')) return `${base.slice(0, -1)}; ${fuente})`;
  return base ? `${base} (${fuente})` : `(${fuente})`;
}

const unir = (...xs) => xs.filter(Boolean).join(' ');

/* ---------- Agrupación ---------- */

function agrupar(valoracion, escalasPorId, dominios) {
  return dominios.map((d) => {
    const rs = valoracion.resultados.filter((r) => escalasPorId[r.escalaId]?.dominio === d.id);
    const porEscala = [];
    for (const r of rs) {
      let g = porEscala.find((x) => x.escalaId === r.escalaId);
      if (!g) porEscala.push((g = { escalaId: r.escalaId, escala: escalasPorId[r.escalaId], rs: [] }));
      g.rs.push(r);
    }
    for (const g of porEscala) {
      g.rs = ordenarCronologico(g.rs);
      g.cmp = g.rs.length > 1 ? compararResultados(g.rs, g.escala) : null;
    }
    return { d, porEscala };
  }).filter((x) => x.porEscala.length);
}

// Cambio de la aplicación vigente respecto a la referencia (y a la previa, si hay más de dos).
function textoCambioVigente(g) {
  const f = g.cmp?.ultima;
  if (!f) return '';
  let t = textoCambio(f.vsRef, textoRespectoA(g.cmp.ref));
  if (f.vsPrevio && f.previo) t += `; ${textoCambio(f.vsPrevio, textoRespectoA(f.previo))}`;
  return t;
}

/* ---------- Hallazgos, cambios y avisos ---------- */

export function hallazgosYSugerencias(valoracion, escalasPorId, hoy = null) {
  const hallazgos = [];
  const sugerencias = [];
  const noEvaluables = [];
  const cambios = [];
  const avisos = [];
  const aplicados = [];
  const alertas = [];
  const ids = [...new Set(valoracion.resultados.map((r) => r.escalaId))];
  for (const id of ids) {
    const escala = escalasPorId[id];
    if (!escala) continue;
    const rs = valoracion.resultados.filter((r) => r.escalaId === id);
    const vig = vigenteDe(rs);
    const etq = etiquetaAplicacion(vig, { omitirFecha: hoy });
    avisos.push(...inconsistenciasCronologicas(rs, escala));
    if (vig.noEvaluable) {
      noEvaluables.push(`${unir(escala.corto, etq)} (${minusculaInicial(vig.noEvaluable)})`);
    } else {
      aplicados.push(escala.corto);
      for (const a of vig.alertas || []) alertas.push(`${unir(escala.corto, etq)}: ${a}`);
      if (vig.hallazgo) hallazgos.push(`${unir(escala.corto, etq)}: ${valorGuardado(vig)}.`);
      for (const s of vig.sugerencias || []) if (!sugerencias.includes(s)) sugerencias.push(s);
    }
    const cmp = rs.length > 1 ? compararResultados(rs, escala) : null;
    if (!cmp) continue;
    for (const f of cmp.filas.filter((x) => !x.esRef)) {
      let linea = `${unir(escala.corto, etiquetaAplicacion(f.r, { omitirFecha: hoy }))}: ${textoCambio(f.vsRef, textoRespectoA(cmp.ref))}`;
      if (f.vsPrevio && f.previo) linea += `; ${textoCambio(f.vsPrevio, textoRespectoA(f.previo))}`;
      if (f.empeoradas.length) linea += `; ${escala.textoEmpeoradas || 'reactivos que empeoraron'}: ${f.empeoradas.map(minusculaInicial).join(', ')}`;
      cambios.push(`${linea}.`);
      for (const a of [...f.vsRef.advertencias]) if (!cambios.includes(`  ${a}`)) cambios.push(`  ${a}`);
    }
    const u = cmp.ultima;
    if (u?.vsRef.tipo === 'empeoramiento') {
      hallazgos.push(`${escala.corto}: ${textoCambio(u.vsRef, textoRespectoA(cmp.ref))}${u.empeoradas.length ? `; ${escala.textoEmpeoradas || 'reactivos que empeoraron'}: ${u.empeoradas.map(minusculaInicial).join(', ')}` : ''}. La causa y la reversibilidad requieren valoración clínica.`);
    }
  }
  const dias = amplitudDias(valoracion.resultados);
  if (dias > DIAS_EPISODIO) avisos.push(`Las aplicaciones abarcan ${dias} días: verifica que pertenezcan al mismo episodio clínico.`);
  return { hallazgos, sugerencias, noEvaluables, cambios, avisos, aplicados, alertas };
}

/* ---------- Nota ---------- */

function datosPaciente(p = {}) {
  const datos = [];
  if (p.sexo && SEXO[p.sexo]) datos.push(SEXO[p.sexo]);
  if (p.edad) datos.push(`${p.edad} años`);
  if (p.escolaridad !== undefined && p.escolaridad !== '' && p.escolaridad != null) datos.push(`escolaridad ${p.escolaridad} años`);
  return datos;
}

function lineaParrafo(g, hoy) {
  const partes = g.rs.map((r) => unir(etiquetaConFuente(r, hoy, false), valorGuardado(r)));
  let t = `${g.escala.corto} ${partes.join(', ')}`;
  const cambio = textoCambioVigente(g);
  if (cambio) t += `: ${cambio}`;
  return t;
}

export function notaValoracion(valoracion, escalasPorId, dominios, fecha = new Date(), formato = 'lista') {
  const f = fechaCorta(fecha);
  const hoy = isoDe(fecha instanceof Date ? fecha : new Date(fecha));
  const p = valoracion.paciente || {};
  const datos = datosPaciente(p);
  const contexto = (p.contexto || '').trim().replace(/\.$/, '');
  const grupos = agrupar(valoracion, escalasPorId, dominios);

  if (formato === 'parrafo') {
    const partes = [`Valoración geriátrica ${f}.`];
    if (datos.length) partes.push(`Paciente: ${datos.join(', ')}.`);
    if (contexto) partes.push(`Contexto: ${contexto}.`);
    for (const { d, porEscala } of grupos) partes.push(`${d.nombre}: ${porEscala.map((g) => lineaParrafo(g, hoy)).join('; ')}.`);
    return partes.join(' ');
  }

  if (formato === 'completa') {
    const { hallazgos, sugerencias, noEvaluables, cambios, avisos, aplicados, alertas } = hallazgosYSugerencias(valoracion, escalasPorId, hoy);
    const l = ['VALORACIÓN GERIÁTRICA INTEGRAL', `Fecha: ${f}`];
    if (datos.length) l.push(`Paciente: ${datos.join(', ')}.`);
    if (contexto) l.push(`Contexto clínico: ${contexto}.`);

    l.push('', '1. RESULTADOS OBJETIVOS');
    for (const { d, porEscala } of grupos) {
      l.push(`${d.nombre}:`);
      for (const g of porEscala) {
        for (const r of g.rs) {
          const etq = etiquetaConFuente(r, hoy, true);
          const valor = r.noEvaluable ? `no evaluable (${minusculaInicial(r.noEvaluable)})` : cifraGuardada(r) || (r.resumen || '').replace(/^[^:]*:\s*/, '').replace(/\.$/, '');
          l.push(`- ${unir(g.escala.corto, etq)}: ${valor}.`);
        }
      }
    }
    const presentes = new Set(grupos.map((x) => x.d.id));
    const faltantes = dominios.filter((d) => DOMINIOS_NUCLEO.includes(d.id) && !presentes.has(d.id)).map((d) => d.nombre.toLowerCase());
    if (faltantes.length) l.push(`Dominios de la valoración integral sin instrumentos aplicados: ${faltantes.join(', ')}.`);

    l.push('', '2. INTERPRETACIÓN DE LOS INSTRUMENTOS');
    for (const { porEscala } of grupos) {
      for (const g of porEscala) {
        const partes = g.rs.map((r) => {
          const etq = etiquetaAplicacion(r, { omitirFecha: hoy });
          const cat = r.noEvaluable ? 'no evaluable' : minusculaInicial(r.etiqueta || '');
          return g.rs.length > 1 || etq ? unir(etq ? `${etq},` : '', cat) : cat;
        });
        l.push(`- ${g.escala.corto}: ${partes.join('; ')}.`);
      }
    }

    if (cambios.length) {
      l.push('', '3. CAMBIOS LONGITUDINALES');
      l.push(...cambios.map((c) => (c.startsWith('  ') ? c : `- ${c}`)));
      l.push('Los cambios describen la diferencia numérica y su dirección clínica; su relevancia requiere valoración.');
    } else {
      l.push('', '3. CAMBIOS LONGITUDINALES', '- Sin aplicaciones repetidas para comparar.');
    }

    l.push('', '4. HALLAZGOS QUE REQUIEREN ATENCIÓN');
    if (alertas.length) l.push(...alertas.map((a) => `- ALERTA: ${a}`));
    if (hallazgos.length) l.push(...hallazgos.map((h) => `- ${h}`));
    else if (aplicados.length && !alertas.length) l.push(`- Sin hallazgos que requieran atención en los instrumentos aplicados (${aplicados.join(', ')}); la conclusión se limita a ellos.`);
    else l.push('- No hay instrumentos interpretables en esta valoración.');
    if (noEvaluables.length) l.push(`- Instrumentos no evaluables: ${noEvaluables.join('; ')}.`);
    if (avisos.length) l.push(...avisos.map((a) => `- Verificar: ${a}`));

    if (sugerencias.length) {
      l.push('', '5. SUGERENCIAS ORIENTATIVAS (no son resultados)');
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
        for (const r of g.rs) lineas.push(`- ${unir(g.escala.corto, etiquetaConFuente(r, hoy, true))}: ${valorGuardado(r)}.`);
        const cambio = textoCambioVigente(g);
        if (cambio) lineas.push(`  Cambio: ${cambio}.`);
      } else {
        const r = g.rs[0];
        const etq = etiquetaConFuente(r, hoy, true);
        const prefijo = `${g.escala.corto}:`;
        lineas.push(!r.noEvaluable && r.resumen?.startsWith(prefijo)
          ? `- ${unir(g.escala.corto, etq)}:${r.resumen.slice(prefijo.length)}`
          : `- ${unir(g.escala.corto, etq)}: ${valorGuardado(r)}.`);
      }
    }
  }
  return lineas.join('\n');
}
