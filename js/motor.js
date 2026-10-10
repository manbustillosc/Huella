// Motor de Huella: convierte las respuestas de un instrumento en un resultado interpretable.
// Admite opción múltiple, sí/no, números con unidades, segundos, listas de verificación,
// fórmulas y algoritmos propios de cada instrumento. No interpreta resultados incompletos.

export const NIVELES = ['bien', 'leve', 'moderado', 'grave', 'critico', 'neutro'];

// Dirección clínica de un cambio en el valor principal. Cada instrumento la declara de forma explícita.
export const DIRECCIONES = ['mayor_mejor', 'menor_mejor', 'sin_direccion'];

// Opción exclusiva de las listas de verificación: confirma que no hay ningún elemento presente.
export const NINGUNO = '__ninguno';
export const TEXTO_NINGUNO = 'Ninguno de los anteriores';

export const TIPOS = {
  tamizaje: 'Tamizaje',
  evaluacion: 'Escala de evaluación',
  diagnostico: 'Algoritmo diagnóstico',
  desempeno: 'Prueba de desempeño físico',
  calculadora: 'Calculadora clínica',
  registro: 'Registro de puntaje oficial',
  pronostico: 'Índice de riesgo',
  prescripcion: 'Algoritmo de prescripción',
};

export const MOMENTOS = [
  { id: 'basal', nombre: 'Basal', ayuda: 'Previo a la enfermedad aguda', enNota: 'basal' },
  { id: 'ingreso', nombre: 'Ingreso', ayuda: 'Al ingreso hospitalario', enNota: 'al ingreso' },
  { id: 'actual', nombre: 'Actual', ayuda: 'Estado actual', enNota: 'actual' },
  { id: 'egreso', nombre: 'Egreso', ayuda: 'Al egreso', enNota: 'al egreso' },
];
export const momentoDe = (id) => MOMENTOS.find((m) => m.id === id) || null;

export const FUENTES = [
  { id: 'paciente', nombre: 'Paciente' },
  { id: 'cuidador', nombre: 'Cuidador' },
  { id: 'observacion', nombre: 'Observación directa' },
  { id: 'expediente', nombre: 'Expediente' },
];

export const MOTIVOS_NO_EVALUABLE = [
  'Alteración del estado de alerta o delirium',
  'Déficit sensorial (visual o auditivo)',
  'Barrera de idioma o escolaridad',
  'Limitación física que impide la prueba',
  'Se rehusó',
  'Otro motivo',
];

// Cambia solo la primera letra (respetando «¿» inicial) y deja intactas las siglas: «AMT4», «GDS».
export const minusculaInicial = (t) => String(t).replace(/^(¿?)(\p{Lu})(?![\p{Lu}\d])/u, (_, a, b) => a + b.toLowerCase());
export const mayusculaInicial = (t) => String(t).replace(/^(¿?)(\p{Ll})/u, (_, a, b) => a + b.toUpperCase());

// Número con punto decimal y sin ceros sobrantes: 6.0 → «6», 6.25 → «6.25».
export const fmt = (n, decimales = 1) => {
  if (n == null || Number.isNaN(n)) return '';
  const f = Number(n.toFixed(decimales));
  return String(f);
};

// Cifra para mostrar: redondea a los decimales pedidos, pero agrega decimales si el redondeo
// cambiaría la categoría (p. ej., TFG 59.6 no se muestra como «60» si se clasifica como G3a).
export function mostrarSinCruzar(valor, decimales, clasificar) {
  const real = clasificar(valor);
  for (let d = decimales; d <= decimales + 4; d += 1) {
    if (clasificar(Number(valor.toFixed(d))) === real) return valor.toFixed(d);
  }
  return String(valor);
}

// Minutos estimados a partir del texto de tiempo: «5 a 10 min» → [5, 10]; «2 min» → [2, 2].
export function minutosDe(escala) {
  const m = String(escala.tiempo || '').match(/(\d+)(?:\s*a\s*(\d+))?\s*min/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2] || m[1])];
}

/* ---------- Definición de campos ---------- */

export function normalizarEscala(escala) {
  const fuente = escala.campos || escala.items || [];
  const campos = fuente.map((c) => {
    const tipo = c.tipo || 'opciones';
    if (tipo === 'sino') {
      const si = c.puntua === 'si' ? 1 : 0;
      return {
        ...c,
        tipo: 'opciones',
        compacto: true,
        opciones: [
          { texto: 'Sí', valor: si },
          { texto: 'No', valor: 1 - si },
        ],
      };
    }
    return { ...c, tipo };
  });
  return {
    ...escala,
    campos,
    items: campos,
    permiteNoEvaluable: escala.permiteNoEvaluable ?? !['calculadora', 'prescripcion', 'pronostico'].includes(escala.tipo),
  };
}

export const campoVisible = (campo, r) => !campo.visibleSi || Boolean(campo.visibleSi(r));
const puntuable = (c) => c.tipo === 'opciones' && c.puntua !== false && !c.anotaA;

export function unidadDe(campo, r) {
  if (!campo.unidades) return null;
  return campo.unidades.find((u) => u.id === r[`${campo.id}_u`]) || campo.unidades[0];
}

// Lee un campo numérico y lo convierte a la unidad base. Rechaza valores imposibles.
export function leerNumero(campo, r) {
  const crudo = r[campo.id];
  if (crudo == null || String(crudo).trim() === '') return { valor: null, vacio: true };
  const n = Number(String(crudo).trim().replace(',', '.'));
  const u = unidadDe(campo, r);
  const etiqueta = u ? u.etiqueta : campo.unidad || '';
  if (!Number.isFinite(n)) return { valor: null, error: 'Escribe solo números.' };
  if (campo.entero && !Number.isInteger(n)) return { valor: null, error: 'Escribe un número entero.' };
  const min = u?.min ?? campo.min;
  const max = u?.max ?? campo.max;
  if ((min != null && n < min) || (max != null && n > max)) {
    return { valor: null, error: `Valor fuera del rango posible (${min} a ${max} ${etiqueta}).`.replace(' )', ')') };
  }
  return { valor: u?.aBase ? u.aBase(n) : n, crudo: n, etiqueta };
}

// Recorre los campos visibles: valores leídos, faltantes, errores y desglose para el texto.
export function evaluarCampos(escala, r = {}) {
  const valores = {};
  const faltan = [];
  const errores = {};
  const desglose = [];
  let total = 0;
  let contestadas = 0;
  for (const c of escala.campos) {
    if (!campoVisible(c, r)) continue;
    const requerido = !c.opcional && !c.anotaA;
    if (requerido) total += 1;
    if (c.tipo === 'opciones') {
      const idx = r[c.id];
      const opcion = idx == null || idx === '' ? null : c.opciones[Number(idx)];
      valores[c.id] = opcion || null;
      if (!opcion) {
        if (requerido) faltan.push(c.id);
        continue;
      }
      if (requerido) contestadas += 1;
      if (c.anotaA) {
        const padre = desglose.find((d) => d.campo.id === c.anotaA);
        if (padre) padre.anotacion = opcion.texto;
        continue;
      }
      desglose.push({ campo: c, opcion, respuesta: opcion.texto, valor: puntuable(c) ? opcion.valor : null });
    } else if (c.tipo === 'numero') {
      const leido = leerNumero(c, r);
      valores[c.id] = leido.valor;
      if (leido.error) errores[c.id] = leido.error;
      if (leido.valor == null) {
        if (requerido) faltan.push(c.id);
        continue;
      }
      if (requerido) contestadas += 1;
      desglose.push({ campo: c, respuesta: `${fmt(leido.crudo, c.decimales ?? 2)} ${leido.etiqueta}`.trim(), valor: null });
    } else if (c.tipo === 'checklist') {
      // Una lista sin marcas queda pendiente: «ninguno» debe confirmarse de forma explícita.
      const crudo = Array.isArray(r[c.id]) ? r[c.id] : [];
      const marcadas = crudo.filter((id) => c.opciones.some((o) => o.id === id));
      const ninguno = crudo.includes(NINGUNO);
      if (ninguno && marcadas.length) {
        valores[c.id] = null;
        errores[c.id] = `Marca elementos o «${TEXTO_NINGUNO}», no ambos.`;
        if (requerido) faltan.push(c.id);
        continue;
      }
      if (!ninguno && !marcadas.length) {
        valores[c.id] = null;
        if (requerido) faltan.push(c.id);
        continue;
      }
      valores[c.id] = marcadas;
      if (requerido) contestadas += 1;
      const textos = c.opciones.filter((o) => marcadas.includes(o.id)).map((o) => o.texto);
      desglose.push({ campo: c, respuesta: textos.length ? textos.join(', ') : minusculaInicial(TEXTO_NINGUNO), valor: null, cuenta: textos.length });
    }
  }
  // Validaciones que dependen de varios campos (p. ej., velocidad imposible según distancia y tiempo).
  if (escala.validar) {
    const extra = escala.validar({ v: valores, r }) || {};
    for (const [id, msg] of Object.entries(extra)) {
      if (!msg) continue;
      errores[id] = msg;
    }
  }
  return { valores, faltan, errores, desglose, total, contestadas };
}

// Respuestas sin los campos ocultos: lo que no se ve no se guarda ni influye en el resultado.
const META = ['_fecha', '_fuente', '_noEvaluable', '_fechaBasal', '_vinculos', '_origen'];
export function limpiarOcultas(escala, r = {}) {
  const limpio = {};
  for (const k of META) if (r[k] !== undefined) limpio[k] = r[k];
  for (const c of escala.campos) {
    if (!campoVisible(c, r)) continue;
    if (r[c.id] !== undefined) limpio[c.id] = r[c.id];
    if (c.unidades && r[`${c.id}_u`] !== undefined) limpio[`${c.id}_u`] = r[`${c.id}_u`];
  }
  return limpio;
}

export function bandaDe(escala, valor) {
  if (valor == null || !escala.bandas) return null;
  return escala.bandas.find((b) => valor >= b.min && valor <= b.max) || null;
}

const NO_EVALUABLE = '_noEvaluable';

// Calcula el resultado. ctx puede traer datos del paciente (edad, sexo, escolaridad).
export function calcular(escala, r = {}, ctx = {}) {
  const base = evaluarCampos(escala, r);
  const res = {
    puntaje: null,
    max: escala.max ?? null,
    valor: null,
    unidad: escala.unidad || '',
    mostrar: null,
    sufijo: '',
    banda: null,
    desglose: base.desglose,
    presentes: base.desglose.filter((d) => d.campo.compacto && d.valor > 0).map((d) => d.campo.texto),
    lineas: [],
    detalles: [],
    extras: {},
    faltan: base.faltan,
    errores: base.errores,
    total: base.total,
    contestadas: base.contestadas,
    completo: false,
    noEvaluable: null,
  };

  if (escala.permiteNoEvaluable && r[NO_EVALUABLE]) {
    res.noEvaluable = r[NO_EVALUABLE];
    res.completo = true;
    res.banda = { etiqueta: 'No evaluable', nivel: 'neutro', texto: `No fue posible aplicar el instrumento: ${minusculaInicial(r[NO_EVALUABLE])}. No se interpreta.` };
    res.faltan = [];
    return res;
  }

  // Suma parcial (solo informativa mientras se contesta)
  const sumables = base.desglose.filter((d) => d.valor != null && !d.opcion?.especial);
  if (!escala.calcular) res.puntaje = sumables.reduce((s, d) => s + d.valor, 0);

  const completo = base.faltan.length === 0 && Object.keys(base.errores).length === 0;
  if (!completo) return res;

  if (escala.calcular) {
    const propio = escala.calcular({ v: base.valores, r, base, ctx, escala }) || {};
    Object.assign(res, propio);
    if (propio.lineas) res.lineas = propio.lineas;
    if (res.faltan?.length) return { ...res, completo: false };
  }
  if (!res.banda && res.puntaje != null) res.banda = bandaDe(escala, res.puntaje);
  if (!res.banda && res.valor != null) res.banda = bandaDe(escala, res.valor);
  res.completo = Boolean(res.banda);
  if (res.mostrar == null) res.mostrar = res.puntaje != null ? String(res.puntaje) : fmt(res.valor);
  if (!res.sufijo) res.sufijo = res.puntaje != null && res.max != null ? `/ ${res.max} puntos` : res.unidad;
  return res;
}

/* ---------- Textos ---------- */

const etiquetaMin = (banda) => minusculaInicial(banda.etiqueta);

export function resumenDe(escala, res) {
  if (res.noEvaluable) return `${escala.corto}: no evaluable (${minusculaInicial(res.noEvaluable)}).`;
  if (escala.resumen) return escala.resumen(res);
  if (res.puntaje != null && res.max != null) return `${escala.corto}: ${res.puntaje}/${res.max} (${etiquetaMin(res.banda)}).`;
  return `${escala.corto}: ${res.mostrar} ${res.unidad} (${etiquetaMin(res.banda)}).`.replace(' (', ' (').replace('  ', ' ');
}

// Versión compacta, sin punto final: «Barthel 90/100 (dependencia moderada)».
export function resumenBreveDe(escala, res) {
  if (res.noEvaluable) return `${escala.corto} no evaluable (${minusculaInicial(res.noEvaluable)})`;
  if (escala.resumenBreve) return escala.resumenBreve(res);
  if (res.puntaje != null && res.max != null) return `${escala.corto} ${res.puntaje}/${res.max} (${etiquetaMin(res.banda)})`;
  return `${escala.corto} ${res.mostrar} ${res.unidad} (${etiquetaMin(res.banda)})`.replace('  ', ' ');
}

function filaDesglose(d) {
  const pts = d.valor != null ? ` (${d.valor})` : '';
  const nota = d.anotacion ? `; ${minusculaInicial(d.anotacion)}` : '';
  return { pregunta: d.campo.texto.endsWith('?'), texto: d.campo.texto, respuesta: d.respuesta, pts, nota };
}

// Texto de un instrumento para copiar al expediente.
// 'lista': el resumen y un renglón por reactivo.
// 'parrafo': todo seguido; de los reactivos de sí/no solo se mencionan los que suman puntos.
export function textoEscala(escala, res, formato = 'parrafo', encabezado = '') {
  const resumen = encabezado + resumenDe(escala, res);
  if (res.noEvaluable) return resumen;
  const filas = res.desglose.map(filaDesglose);
  const extra = res.lineasNota || [];
  if (formato === 'lista') {
    return [
      resumen,
      ...extra,
      ...filas.map((f) => (f.pregunta ? `- ${f.texto} ${f.respuesta}${f.pts}${f.nota}` : `- ${f.texto}: ${minusculaInicial(f.respuesta)}${f.pts}${f.nota}`)),
    ].join('\n');
  }
  const partes = [resumen, ...extra];
  if (!escala.detalleEnResumen) {
    const conOpciones = res.desglose.filter((d) => !d.campo.compacto).map(filaDesglose);
    if (conOpciones.length) {
      const t = conOpciones.map((f) => `${minusculaInicial(f.texto)}: ${minusculaInicial(f.respuesta)}${f.pts}${f.nota}`).join('; ');
      partes.push(`${mayusculaInicial(t)}.`);
    }
    const sino = res.desglose.filter((d) => d.campo.compacto);
    if (sino.length) {
      const positivos = sino.filter((d) => d.valor > 0);
      partes.push(positivos.length
        ? `Reactivos positivos: ${positivos.map((d) => `${minusculaInicial(d.campo.texto)} ${minusculaInicial(d.respuesta)}`).join('; ')}.`
        : 'Sin reactivos positivos.');
    }
  }
  return partes.join(' ');
}

/* ---------- Presentación ---------- */

// Posición del marcador en una barra de bandas de igual ancho (0–1).
export function posicionMarcador(escala, valor, banda = null) {
  const n = escala.bandas?.length || 0;
  if (!n) return 0;
  let i = banda ? escala.bandas.findIndex((b) => b === banda || (b.id && b.id === banda.id)) : -1;
  if (i < 0) i = escala.bandas.findIndex((b) => valor >= b.min && valor <= b.max);
  if (i < 0) return 0;
  const b = escala.bandas[i];
  let fraccion = 0.5;
  if (Number.isFinite(b.max) && b.max > b.min) fraccion = Math.min(1, Math.max(0, (valor - b.min) / (b.max - b.min)));
  return (i + 0.1 + fraccion * 0.8) / n;
}

export function rangoTexto(banda) {
  if (banda.rango) return banda.rango;
  return banda.min === banda.max ? `${banda.min}` : `${banda.min} a ${banda.max}`;
}

/* ---------- Revisión de la definición ---------- */

// Para escalas de suma: mínimo, máximo y bandas contiguas sin huecos ni traslapes.
export function validarEscala(escalaCruda) {
  const errores = [];
  const e = normalizarEscala(escalaCruda);
  for (const c of e.campos) {
    if ((c.tipo === 'opciones' || c.tipo === 'checklist') && !c.opciones?.length) errores.push(`${c.id}: sin opciones`);
  }
  for (const b of e.bandas || []) if (!NIVELES.includes(b.nivel)) errores.push(`${b.etiqueta}: nivel desconocido ${b.nivel}`);
  if (e.calcular) return errores;
  let min = 0;
  let max = 0;
  for (const c of e.campos.filter(puntuable)) {
    const valores = c.opciones.filter((o) => !o.especial).map((o) => o.valor);
    min += Math.min(...valores);
    max += Math.max(...valores);
  }
  if (min !== e.min) errores.push(`min calculado ${min} ≠ declarado ${e.min}`);
  if (max !== e.max) errores.push(`max calculado ${max} ≠ declarado ${e.max}`);
  const bandas = [...e.bandas].sort((a, b) => a.min - b.min);
  if (bandas[0].min !== e.min) errores.push('la primera banda no empieza en el mínimo');
  if (bandas.at(-1).max !== e.max) errores.push('la última banda no termina en el máximo');
  for (let i = 1; i < bandas.length; i++) {
    if (bandas[i].min !== bandas[i - 1].max + 1) errores.push(`hueco o traslape entre ${bandas[i - 1].etiqueta} y ${bandas[i].etiqueta}`);
  }
  return errores;
}

// Bandas enteras contiguas (para instrumentos con cálculo propio que las usan).
export function validarBandasEnteras(bandas, min, max) {
  const errores = [];
  const b = [...bandas].sort((x, y) => x.min - y.min);
  if (b[0].min !== min) errores.push('la primera banda no empieza en el mínimo');
  if (b.at(-1).max !== max) errores.push('la última banda no termina en el máximo');
  for (let i = 1; i < b.length; i++) if (b[i].min !== b[i - 1].max + 1) errores.push(`hueco o traslape en ${b[i].etiqueta}`);
  return errores;
}
