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
  evaluacion: 'Evaluación clínica',
  diagnostico: 'Algoritmo diagnóstico',
  desempeno: 'Prueba de desempeño físico',
  estadificacion: 'Estadificación',
  pronostico: 'Índice pronóstico',
  calculadora: 'Calculadora clínica',
  lista: 'Lista de verificación',
  prescripcion: 'Algoritmo de prescripción',
};

// Seis clases que se distinguen visualmente; cada tipo pertenece a una.
// «registro» no es un tipo sino una marca: el instrumento tiene titular de derechos y solo se captura su resultado.
export const CLASES = {
  tamizaje: { nombre: 'Tamizaje', ayuda: 'Identifica a quién evaluar más a fondo; no diagnostica.' },
  evaluacion: { nombre: 'Evaluación clínica', ayuda: 'Mide o describe un dominio, o aplica un algoritmo clínico.' },
  estadificacion: { nombre: 'Estadificación', ayuda: 'Asigna un estadio de gravedad o de progresión.' },
  pronostico: { nombre: 'Índice pronóstico', ayuda: 'Estima un riesgo para un desenlace, población y horizonte definidos.' },
  calculadora: { nombre: 'Calculadora', ayuda: 'Calcula un valor o una indicación a partir de datos.' },
  lista: { nombre: 'Lista de verificación', ayuda: 'Revisión estructurada criterio por criterio, sin puntaje.' },
};
const CLASE_DE_TIPO = {
  tamizaje: 'tamizaje', evaluacion: 'evaluacion', diagnostico: 'evaluacion', desempeno: 'evaluacion',
  estadificacion: 'estadificacion', pronostico: 'pronostico', calculadora: 'calculadora', prescripcion: 'calculadora', lista: 'lista',
};
export const claseDe = (escala) => CLASE_DE_TIPO[escala.tipo] || 'evaluacion';
export const TEXTO_REGISTRO = 'Registro de resultado';

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

// Cifra tecleada por la persona: al menos los decimales del campo y nunca menos de los que escribió, para que la
// respuesta mostrada no cruce un punto de corte (14.01 s no se muestra como «14 s»).
export const fmtCrudo = (n, decimales = 2) => {
  if (n == null || Number.isNaN(n)) return '';
  const escritos = (String(n).split('.')[1] || '').length;
  return fmt(n, Math.min(Math.max(decimales, escritos), 6));
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
    permiteNoEvaluable: escala.permiteNoEvaluable ?? !['calculadora', 'prescripcion', 'pronostico', 'lista'].includes(escala.tipo),
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
      desglose.push({ campo: c, respuesta: `${fmtCrudo(leido.crudo, c.decimales ?? 2)} ${leido.etiqueta}`.trim(), valor: null, crudo: leido.valor });
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

/* ---------- Orden por logro ---------- */
// En las escalas cognitivas y funcionales, los reactivos se presentan primero con lo que la persona logra por completo,
// después lo que logra en parte y al final lo que no logra. Cada escala declara sus reactivos en «ordenCapacidad».

// 0 = completo, 1 = parcial, 2 = sin logro, para una proporción de logro entre 0 y 1.
export const nivelLogro = (p) => (p >= 0.999 ? 0 : p <= 0.001 ? 2 : 1);

// Orden estable por nivel de logro: completas, parciales y sin logro, conservando el orden original dentro de cada grupo.
export function ordenarPorLogro(partes, proporcion = (x) => x.proporcion) {
  return partes.map((x, i) => ({ x, i, n: nivelLogro(proporcion(x)) })).sort((a, b) => a.n - b.n || a.i - b.i).map((o) => o.x);
}

export const ETIQUETAS_LOGRO = {
  funcional: ['Independiente', 'Con ayuda o de forma parcial', 'Dependiente', 'No aplica'],
  cognitivo: ['Puntaje completo', 'Puntaje parcial', 'Sin puntos', 'Sin calificar'],
};
const IDS_GRUPO = ['completo', 'parcial', 'nulo', 'otro'];

// Proporción de logro de un reactivo del desglose (0 a 1), 'otro' si es una opción especial, o null si no es reactivo.
function logroDe(escala, d) {
  const cfg = escala.ordenCapacidad;
  const c = d.campo;
  if (!cfg.campos.includes(c.id)) return null;
  let p = null;
  if (c.tipo === 'opciones') {
    if (!d.opcion) return null;
    if (d.opcion.especial) return 'otro';
    const vals = c.opciones.filter((o) => !o.especial).map((o) => o.valor);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (!(max > min)) return null;
    p = (d.opcion.valor - min) / (max - min);
  } else if (c.tipo === 'numero') {
    const min = c.min ?? 0;
    if (!Number.isFinite(d.crudo) || !(c.max > min)) return null;
    p = (d.crudo - min) / (c.max - min);
  } else if (c.tipo === 'checklist') {
    p = (d.cuenta || 0) / c.opciones.length;
  }
  if (p == null) return null;
  return cfg.mejor === 'bajo' ? 1 - p : p;
}

// Agrupa el desglose: campos de contexto antes y después, y los reactivos por nivel de logro.
export function ordenarPorCapacidad(escala, desglose) {
  if (!escala.ordenCapacidad || !desglose?.length) return null;
  const etiquetas = escala.ordenCapacidad.etiquetas || ETIQUETAS_LOGRO[escala.dominio] || ETIQUETAS_LOGRO.cognitivo;
  const grupos = IDS_GRUPO.map((id, i) => ({ id, etiqueta: etiquetas[i], items: [] }));
  const antes = [];
  const despues = [];
  let reactivos = 0;
  for (const d of desglose) {
    const l = logroDe(escala, d);
    if (l == null) {
      (reactivos ? despues : antes).push(d);
      continue;
    }
    reactivos += 1;
    grupos[l === 'otro' ? 3 : nivelLogro(l)].items.push(d);
  }
  if (!reactivos) return null;
  return { antes, grupos: grupos.filter((g) => g.items.length), despues };
}

const lineaLista = (f) => (f.pregunta ? `- ${f.texto} ${f.respuesta}${f.pts}${f.nota}` : `- ${f.texto}: ${minusculaInicial(f.respuesta)}${f.pts}${f.nota}`);

// Reactivo dentro de un grupo de logro: sin repetir lo que ya dice el encabezado del grupo.
// En los grupos de logro completo y nulo el puntaje queda implícito (máximo o mínimo); en el parcial se anota
// «obtenido/máximo» (o el puntaje, si un valor menor es mejor).
const sinPrefijo = (t) => String(t).replace(/^\d+(?:\.\d+)?\s*·\s*/, '').trim();
const RANGO_FINAL = /\s*\(\d+(?:\.\d+)? a \d+(?:\.\d+)?\)$/;
function filaGrupo(escala, d, g) {
  const c = d.campo;
  const bajo = escala.ordenCapacidad.mejor === 'bajo';
  const parcial = g.id === 'parcial';
  const texto = c.texto.replace(RANGO_FINAL, '');
  let respuesta = '';
  let pts = '';
  if (c.tipo === 'numero') {
    if (parcial) respuesta = bajo ? fmt(d.crudo) : `${fmt(d.crudo)}/${fmt(c.max)}`;
  } else if (c.tipo === 'checklist') {
    if (parcial) pts = `${d.cuenta || 0}/${c.opciones.length}`;
  } else if (d.opcion) {
    const v = d.opcion.valor;
    respuesta = sinPrefijo(d.respuesta).replace(new RegExp(`\\s*\\(${String(v).replace('.', '\\.')}\\)$`), '');
    if (respuesta === String(v)) respuesta = '';
    if (parcial && !d.opcion.especial) pts = bajo ? fmt(v) : `${fmt(v)}/${fmt(Math.max(...c.opciones.filter((o) => !o.especial).map((o) => o.valor)))}`;
  }
  if (g.id === 'otro' || (respuesta && respuesta.toLocaleLowerCase('es').endsWith(sinPrefijo(g.etiqueta).toLocaleLowerCase('es')))) respuesta = '';
  const nota = d.anotacion ? minusculaInicial(d.anotacion) : '';
  return { pregunta: texto.endsWith('?'), texto, respuesta, pts, nota };
}
function lineaGrupo(f) {
  const pts = f.pts ? ` (${f.pts})` : '';
  if (f.pregunta) return `- ${f.texto}${f.respuesta ? ` ${f.respuesta}` : ''}${pts}${f.nota ? `; ${f.nota}` : ''}`;
  // Si el texto del reactivo ya lleva dos puntos, la respuesta va entre paréntesis.
  if (f.respuesta && !f.texto.includes(':')) return `- ${f.texto}: ${minusculaInicial(f.respuesta)}${pts}${f.nota ? `; ${f.nota}` : ''}`;
  return `- ${reactivoGrupo(f, false)}`;
}
function reactivoGrupo(f, minuscula = true) {
  const dentro = [f.respuesta && minusculaInicial(f.respuesta), f.pts].filter(Boolean).join(', ') + (f.nota ? `${f.respuesta || f.pts ? '; ' : ''}${f.nota}` : '');
  return `${minuscula ? minusculaInicial(f.texto) : f.texto}${dentro ? ` (${dentro})` : ''}`;
}

// Texto de un instrumento para copiar al expediente.
// 'lista': el resumen y un renglón por reactivo.
// 'parrafo': todo seguido; de los reactivos de sí/no solo se mencionan los que suman puntos.
// Con «ordenCapacidad», los reactivos se agrupan: primero lo que logra por completo, luego lo parcial y al final lo que no.
export function textoEscala(escala, res, formato = 'parrafo', encabezado = '') {
  const resumen = encabezado + resumenDe(escala, res);
  if (res.noEvaluable) return resumen;
  const extra = res.lineasNota || [];
  const orden = ordenarPorCapacidad(escala, res.desglose);
  if (formato === 'lista') {
    if (orden) {
      const out = [resumen, ...extra, ...orden.antes.map((d) => lineaLista(filaDesglose(d)))];
      for (const g of orden.grupos) out.push(`${g.etiqueta}:`, ...g.items.map((d) => lineaGrupo(filaGrupo(escala, d, g))));
      out.push(...orden.despues.map((d) => lineaLista(filaDesglose(d))));
      return out.join('\n');
    }
    return [resumen, ...extra, ...res.desglose.map((d) => lineaLista(filaDesglose(d)))].join('\n');
  }
  const partes = [resumen, ...extra];
  if (!escala.detalleEnResumen) {
    if (orden) {
      const ctx = [...orden.antes, ...orden.despues].filter((d) => !d.campo.compacto).map(filaDesglose);
      if (ctx.length) partes.push(`${mayusculaInicial(ctx.map((f) => `${minusculaInicial(f.texto)}: ${minusculaInicial(f.respuesta)}${f.pts}${f.nota}`).join('; '))}.`);
      for (const g of orden.grupos) partes.push(`${g.etiqueta}: ${g.items.map((d) => reactivoGrupo(filaGrupo(escala, d, g))).join('; ')}.`);
      return partes.join(' ');
    }
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
