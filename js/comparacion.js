// Comparación longitudinal de resultados de un mismo instrumento.
// Orden cronológico, referencia (basal o primera aplicación), resultado vigente
// y dirección clínica del cambio según lo que declara cada instrumento.
import { momentoDe, minusculaInicial, fmt, calcular } from './motor.js';

const RANGO_MOMENTO = { basal: 0, ingreso: 1, actual: 2, egreso: 3 };
// Momentos que solo admiten un resultado por instrumento; «actual» y sin momento admiten varias aplicaciones.
export const MOMENTOS_UNICOS = ['basal', 'ingreso', 'egreso'];
export const esUnico = (momento) => MOMENTOS_UNICOS.includes(momento);

const rango = (r) => RANGO_MOMENTO[r.momento] ?? RANGO_MOMENTO.actual;

export const fechaCorta = (d) => {
  if (!d) return '';
  const x = d instanceof Date ? d : new Date(`${d}T12:00:00`);
  return Number.isNaN(x.getTime()) ? '' : x.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const isoDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const diasEntre = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);

// El basal va siempre primero: describe el estado previo al episodio, aunque se registre después.
// El resto se ordena por la fecha real de aplicación; a igual fecha, por momento clínico y hora de guardado.
export function ordenarCronologico(rs) {
  return [...rs].sort((a, b) => {
    const ba = a.momento === 'basal';
    const bb = b.momento === 'basal';
    if (ba !== bb) return ba ? -1 : 1;
    const fa = (ba ? a.fechaReferencia : null) || a.fecha || '';
    const fb = (bb ? b.fechaReferencia : null) || b.fecha || '';
    if (fa !== fb) return fa < fb ? -1 : 1;
    if (rango(a) !== rango(b)) return rango(a) - rango(b);
    return (a.guardado || 0) - (b.guardado || 0);
  });
}

export const referenciaDe = (lista) => lista.find((r) => r.momento === 'basal') || lista[0] || null;

// Resultado vigente: la aplicación más reciente según su fecha, no según el nombre del momento.
// El basal solo es vigente si no hay otra aplicación.
export function vigenteDe(rs) {
  const lista = ordenarCronologico(rs);
  const actuales = lista.filter((r) => r.momento !== 'basal');
  return (actuales.length ? actuales : lista).at(-1) || null;
}

export function valorComparable(r) {
  if (Number.isFinite(r.puntaje)) return r.puntaje;
  if (Number.isFinite(r.valor)) return r.valor;
  return null;
}

// «al ingreso (10/10/2026)», «basal (estado al 20/09/2026)», «del 12/10/2026».
export function etiquetaAplicacion(r, { conFecha = true, omitirFecha = null } = {}) {
  const m = r.momento ? momentoDe(r.momento)?.enNota : '';
  const fechaRef = r.momento === 'basal' && r.fechaReferencia ? `estado al ${fechaCorta(r.fechaReferencia)}` : '';
  const fecha = conFecha && r.fecha && r.fecha !== omitirFecha ? fechaCorta(r.fecha) : '';
  if (r.momento === 'basal') return [m, fechaRef ? `(${fechaRef})` : ''].filter(Boolean).join(' ');
  if (m) return [m, fecha ? `(${fecha})` : ''].filter(Boolean).join(' ');
  return fecha ? `del ${fecha}` : '';
}

const unidadTexto = (escala, n) => {
  const u = escala.unidadCambio ?? ['punto', 'puntos'];
  if (Array.isArray(u)) return Number(n) === 1 ? u[0] : u[1];
  return u;
};

// Tipos: 'mejoria' | 'empeoramiento' | 'sin_cambio' | 'no_interpretable' | 'sin_direccion'.
export function clasificarCambio(escala, antes, despues) {
  const dir = escala.direccionClinica;
  const salida = { tipo: null, dif: null, magnitud: null, texto: '', principal: '', cola: '', categoria: null, advertencias: [] };
  // principal: cifra y calificación; cola: aclaraciones. texto = principal + cola.
  const fin = (o, principal, cola = '') => ({ ...salida, ...o, principal, cola, texto: principal + cola });
  if (antes.noEvaluable || despues.noEvaluable) {
    return fin({ tipo: 'no_interpretable' }, 'cambio no interpretable: uno de los resultados no fue evaluable');
  }
  const cambioCategoria = Boolean(antes.etiqueta && despues.etiqueta && antes.etiqueta !== despues.etiqueta);
  if (cambioCategoria) salida.categoria = { de: antes.etiqueta, a: despues.etiqueta };
  const textoCategoria = cambioCategoria ? `de «${minusculaInicial(antes.etiqueta)}» a «${minusculaInicial(despues.etiqueta)}»` : '';

  const regla = escala.comparable ? escala.comparable(antes, despues) : null;
  if (regla?.advertencia) salida.advertencias.push(regla.advertencia);
  if (regla?.noInterpretable) {
    return fin({ tipo: 'no_interpretable' }, `cambio no interpretable numéricamente: ${regla.noInterpretable}`, textoCategoria ? `; ${textoCategoria}` : '');
  }

  const a = valorComparable(antes);
  const b = valorComparable(despues);
  if (a == null || b == null) {
    if (cambioCategoria) return fin({ tipo: 'no_interpretable' }, 'sin comparación numérica', `; ${textoCategoria}`);
    return fin({ tipo: 'sin_cambio' }, 'sin cambio de categoría');
  }

  const dif = b - a;
  const dec = escala.decimalesCambio ?? 0;
  const resolucion = 10 ** -dec;
  salida.dif = dif;
  if (Math.abs(dif) < resolucion / 2) {
    const base = dec
      ? `sin cambio apreciable (diferencia menor de ${resolucion.toFixed(dec)} ${unidadTexto(escala, 2)})`
      : 'sin cambio en el puntaje';
    return fin({ tipo: 'sin_cambio', magnitud: 0 }, base, cambioCategoria ? `; el valor quedó al otro lado del punto de corte (${textoCategoria})` : '');
  }
  const magnitud = dec ? Number(Math.abs(dif).toFixed(dec)) : Math.round(Math.abs(dif));
  const cifra = `${dif < 0 ? 'disminución' : 'aumento'} de ${fmt(magnitud, dec)} ${unidadTexto(escala, magnitud)}`;
  salida.magnitud = magnitud;
  // Cambio menor que el mínimo con significado clínico publicado: no se califica como mejoría ni empeoramiento.
  if (escala.cambioMinimo && Math.abs(dif) < escala.cambioMinimo.valor) {
    return fin(
      { tipo: 'sin_cambio' },
      cifra,
      `, menor que el cambio pequeño con significado clínico (${escala.cambioMinimo.texto}): sin cambio relevante${cambioCategoria ? `; el valor quedó al otro lado del punto de corte (${textoCategoria})` : ''}`,
    );
  }
  let tipo;
  let calificacion = '';
  let cola = '';
  if (dir === 'mayor_mejor' || dir === 'menor_mejor') {
    const mejora = dir === 'mayor_mejor' ? dif > 0 : dif < 0;
    tipo = mejora ? 'mejoria' : 'empeoramiento';
    calificacion = ` (${mejora ? escala.textoMejoria || 'mejoría' : escala.textoEmpeoramiento || 'empeoramiento'})`;
  } else {
    tipo = 'sin_direccion';
    cola = '; variación numérica sin significado clínico uniforme: requiere valoración clínica';
  }
  if (escala.cambioSustancial && Math.abs(dif) >= escala.cambioSustancial.valor) cola += `; magnitud de cambio sustancial (${escala.cambioSustancial.texto})`;
  if (cambioCategoria) cola += `; cambio de categoría ${textoCategoria}`;
  if (escala.cambioExtra) salida.advertencias.push(...(escala.cambioExtra(antes, despues, { dif }) || []).filter(Boolean));
  return { ...fin({ tipo }, `${cifra}${calificacion}`, cola), cifra };
}

// «disminución de 50 puntos respecto al basal (deterioro funcional…); cambio de categoría…»
export function textoCambio(c, respecto = '') {
  if (!c) return '';
  if (!respecto) return c.texto;
  if (c.cifra && c.principal.startsWith(c.cifra)) return `${c.cifra} ${respecto}${c.principal.slice(c.cifra.length)}${c.cola}`;
  return `${c.principal} ${respecto}${c.cola}`;
}

// Reactivos que empeoraron respecto a la referencia, según la dirección del instrumento.
export function reactivosEmpeorados(escala, ref, actual) {
  const dir = escala.direccionClinica;
  if (!['mayor_mejor', 'menor_mejor'].includes(dir) || !ref?.respuestas || !actual?.respuestas) return [];
  const a = calcular(escala, ref.respuestas);
  const b = calcular(escala, actual.respuestas);
  const conValor = (d) => d.valor != null && !d.opcion?.especial;
  if (b.desglose.filter(conValor).length < 2) return [];
  const antes = Object.fromEntries(a.desglose.filter(conValor).map((d) => [d.campo.id, d.valor]));
  const peor = (x, y) => (dir === 'mayor_mejor' ? y < x : y > x);
  return b.desglose
    .filter((d) => conValor(d) && antes[d.campo.id] != null && peor(antes[d.campo.id], d.valor))
    .map((d) => d.campo.textoCorto || d.campo.texto);
}

// Todas las aplicaciones en orden, cada una comparada con la referencia y con la aplicación previa.
export function compararResultados(rs, escala) {
  const lista = ordenarCronologico(rs);
  if (lista.length < 2) return null;
  const ref = referenciaDe(lista);
  const vigente = vigenteDe(lista);
  const filas = lista.map((r, i) => {
    if (r === ref) return { r, esRef: true };
    const vsRef = clasificarCambio(escala, ref, r);
    const previo = i > 0 ? lista[i - 1] : null;
    const vsPrevio = previo && previo !== ref ? clasificarCambio(escala, previo, r) : null;
    return { r, esRef: false, vsRef, vsPrevio, previo, empeoradas: reactivosEmpeorados(escala, ref, r) };
  });
  return { lista, ref, vigente, filas, ultima: filas.find((f) => f.r === vigente) || null };
}

// «respecto al basal», «respecto al ingreso del 08/10/2026», «respecto a la aplicación del 01/09/2026».
export function textoRespectoA(ref) {
  if (ref.momento === 'basal') return 'respecto al basal';
  const fecha = ref.fecha ? ` del ${fechaCorta(ref.fecha)}` : '';
  if (ref.momento === 'ingreso' || ref.momento === 'egreso') return `respecto al ${ref.momento}${fecha}`;
  return fecha ? `respecto a la aplicación${fecha}` : 'respecto a la aplicación previa';
}

// Avisos de fechas que no cuadran con el momento clínico declarado.
export function inconsistenciasCronologicas(rs, escala) {
  const avisos = [];
  const de = (m) => rs.find((r) => r.momento === m);
  const ingreso = de('ingreso');
  const egreso = de('egreso');
  const basal = de('basal');
  if (ingreso?.fecha && egreso?.fecha && egreso.fecha < ingreso.fecha) {
    avisos.push(`${escala.corto}: la fecha de egreso (${fechaCorta(egreso.fecha)}) es anterior a la de ingreso (${fechaCorta(ingreso.fecha)}).`);
  }
  if (basal?.fechaReferencia) {
    const previas = rs.filter((r) => r.momento !== 'basal' && r.fecha && r.fecha < basal.fechaReferencia);
    if (previas.length) avisos.push(`${escala.corto}: la fecha del estado basal (${fechaCorta(basal.fechaReferencia)}) es posterior a otra aplicación.`);
  }
  for (const r of rs.filter((x) => x.momento === 'actual' && x.fecha)) {
    if (egreso?.fecha && r.fecha > egreso.fecha) {
      avisos.push(`${escala.corto}: hay una aplicación «actual» (${fechaCorta(r.fecha)}) posterior al egreso; se toma como la más reciente.`);
      break;
    }
  }
  return avisos;
}

// Días entre la primera y la última aplicación (sin contar el estado basal).
export function amplitudDias(resultados) {
  const fechas = resultados.filter((r) => r.momento !== 'basal' && r.fecha).map((r) => r.fecha).sort();
  if (fechas.length < 2) return 0;
  return diasEntre(fechas[0], fechas.at(-1));
}
