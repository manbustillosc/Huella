// Evaluación básica ICOPE (paso 1): un instrumento por dominio de la capacidad intrínseca (cuadro 3.1)
// y los factores clave que repercuten en la salud (cuadro 3.2).
// Adaptación del Manual de atención integrada para las personas mayores, 2.ª ed. (OPS, 2025; CC BY-NC-SA 3.0 IGO).
// No hay puntaje global de capacidad intrínseca: cada dominio se informa por separado.

export const REF_ICOPE = {
  texto: 'Organización Panamericana de la Salud. Manual de atención integrada para las personas mayores. Guía sobre la evaluación y los esquemas de atención centrados en la persona en la atención primaria de salud. 2.ª ed. Washington, D.C.: OPS; 2025.',
  doi: '10.37774/9789275330319',
};
export const REF_ICOPE_OMS = {
  texto: 'World Health Organization. Integrated care for older people (ICOPE): guidance for person-centred assessment and pathways in primary care. 2nd ed. Geneva: WHO; 2024.',
  enlace: 'https://www.who.int/publications/i/item/9789240103726',
};
export const LICENCIA_ICOPE = {
  texto: 'Adaptación del manual ICOPE de la OPS (2025), licencia CC BY-NC-SA 3.0 IGO. Esta publicación es una adaptación de una obra original de la Organización Panamericana de la Salud (OPS). Las opiniones expresadas en esta adaptación son responsabilidad exclusiva de los autores y no representan necesariamente los criterios de la OPS.',
  enlace: 'https://doi.org/10.37774/9789275330319',
};

const NOTA_ADAPTACION = 'La OPS no respalda esta aplicación. Las preguntas pueden ajustarse al contexto local sin usar lenguaje discriminatorio ni edadista (manual ICOPE, cuadro 3.2).';
const NOTA_SIN_PUNTAJE = 'ICOPE no define un puntaje global de capacidad intrínseca: Huella informa cada dominio por separado y no los suma.';
const NOTA_PERIODICIDAD = 'Se recomienda repetir la evaluación básica al menos una vez al año (visión y audición cada 1 a 2 años) y después de un evento agudo, una enfermedad o un cambio de situación.';

const SI_NO = [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }];
// Pregunta de sí/no sin puntos: el resultado lo decide el algoritmo del dominio.
const pregunta = (id, texto, extra = {}) => ({ id, texto, opciones: SI_NO, puntua: false, compacto: true, ...extra });
const esSi = (o) => o?.valor === 1;

const MOTIVOS_SENSORIAL = [
  'Sin el equipo necesario para la prueba',
  'Alteración del estado de alerta o delirium',
  'Barrera de idioma o de comunicación',
  'Se rehusó',
  'Otro motivo',
];

// Bandas comunes: «conservado», «alterado» y, en los dominios con pregunta de filtro, «alterado por filtro».
function bandasDominio({ conservado, alterado, filtro, sugerencias = [] }) {
  const b = {
    conservado: {
      id: 'conservado', rango: 'Prueba superada', etiqueta: 'Conservado', nivel: 'bien',
      texto: conservado,
      sugerencias: ['Brindar asesoramiento sobre salud y estilo de vida, y repetir la evaluación básica con regularidad.'],
    },
    alterado: {
      id: 'alterado', rango: 'Prueba no superada', etiqueta: 'Alterado: requiere evaluación detallada', nivel: 'moderado', hallazgo: true,
      texto: alterado,
      sugerencias,
    },
  };
  if (filtro) {
    b.filtro = {
      id: 'filtro', rango: 'Pregunta de filtro afirmativa', etiqueta: 'Alterado por la pregunta de filtro: requiere evaluación detallada', nivel: 'moderado', hallazgo: true,
      texto: filtro,
      sugerencias,
    };
  }
  return b;
}

const textoResumen = (corto, banda, detalle) => `${corto}: ${banda.etiqueta.toLowerCase()}${detalle ? ` (${detalle})` : ''}.`;
const breve = (corto, banda) => `${corto} ${banda.id === 'conservado' ? 'conservado' : 'alterado'}`;

/* ---------- Cognición ---------- */

const B_COG = bandasDominio({
  conservado: 'Responde correctamente a las dos preguntas de orientación y recuerda las tres palabras. No requiere evaluación detallada de la cognición en este momento.',
  alterado: 'No responde alguna pregunta de orientación o no recuerda las tres palabras. Requiere una evaluación detallada de la cognición; el resultado no establece un diagnóstico.',
  filtro: 'Refiere problemas de memoria o de orientación: se pasa directamente a la evaluación detallada (paso 2) sin aplicar la prueba.',
  sugerencias: [
    'Evaluación detallada de la cognición con una herramienta validada localmente (p. ej., Mini-Cog, MoCA o RUDAS): elige una según la escolaridad y el idioma.',
    'Antes de interpretar, descartar un síndrome confusional agudo (delirium) y revisar la medicación.',
  ],
});

export const icopeCognicion = {
  id: 'icope-cog',
  nombre: 'ICOPE: evaluación básica de la cognición',
  corto: 'ICOPE cognición',
  dominio: 'cognitivo',
  tipo: 'tamizaje',
  icope: 'cognicion',
  aliases: ['ICOPE', 'capacidad intrinseca', 'memoria', 'orientacion', 'tres palabras', 'OMS', 'OPS'],
  problemas: ['deterioro cognitivo', 'queja de memoria', 'capacidad intrínseca'],
  descripcion: 'Pregunta de filtro y prueba sencilla de memoria y orientación del paso 1 de ICOPE.',
  objetivo: 'Detectar una posible pérdida de capacidad cognitiva que requiere evaluación detallada (paso 2).',
  poblacion: 'Personas mayores en la comunidad y en atención primaria (manual ICOPE, OPS 2025).',
  aplicacion: [
    'Pregunta de filtro: «¿Tiene algún problema de memoria o de orientación (como no saber dónde está o qué día es)?». Si responde que sí, pasa directamente a la evaluación detallada.',
    'Si responde que no: pide que recuerde tres palabras sencillas y concretas (el manual sugiere «flor», «puerta», «arroz»).',
    'Pregunta «¿Cuál es la fecha completa de hoy?» y «¿Dónde está usted ahora mismo?» (en casa, en el consultorio, etc.).',
    'Pide que repita las tres palabras.',
  ],
  tiempo: '2 a 3 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  siguientes: [
    { id: 'minicog', si: (res) => Boolean(res.banda?.hallazgo), motivo: 'Tamizaje breve con poco sesgo de escolaridad (cuadro 5.1 del manual).' },
    { id: 'moca', si: (res) => Boolean(res.banda?.hallazgo), motivo: 'Evaluación más amplia; permite detectar deterioro leve (hoja oficial y evaluador certificado).' },
    { id: 'rudas', si: (res) => Boolean(res.banda?.hallazgo), motivo: 'Mínimo sesgo lingüístico y educativo; elige un solo instrumento.' },
  ],
  campos: [
    pregunta('filtro', '¿Tiene algún problema de memoria o de orientación (como no saber dónde está o qué día es)?', { textoCorto: 'pregunta de filtro' }),
    {
      id: 'fecha', texto: '¿Cuál es la fecha completa de hoy?', textoCorto: 'orientación en tiempo', puntua: false,
      visibleSi: (r) => r.filtro === 1,
      opciones: [{ texto: 'Responde correctamente', valor: 1 }, { texto: 'Responde incorrectamente o no sabe', valor: 0 }],
    },
    {
      id: 'lugar', texto: '¿Dónde está usted ahora mismo?', textoCorto: 'orientación en espacio', puntua: false,
      visibleSi: (r) => r.filtro === 1,
      opciones: [{ texto: 'Responde correctamente', valor: 1 }, { texto: 'Responde incorrectamente o no sabe', valor: 0 }],
    },
    {
      id: 'palabras', texto: '¿Recuerda las tres palabras?', textoCorto: 'recuerdo de tres palabras', puntua: false,
      visibleSi: (r) => r.filtro === 1,
      opciones: [
        { texto: 'Recuerda las 3', valor: 3 },
        { texto: 'Recuerda 2', valor: 2 },
        { texto: 'Recuerda 1', valor: 1 },
        { texto: 'Ninguna', valor: 0 },
      ],
    },
  ],
  bandas: [B_COG.conservado, B_COG.alterado, B_COG.filtro],
  calcular({ v }) {
    if (esSi(v.filtro)) return { banda: B_COG.filtro, extras: { hallazgo: 'refiere problemas de memoria u orientación', filtro: true } };
    const fallas = [];
    if (v.fecha.valor === 0) fallas.push('orientación en tiempo incorrecta');
    if (v.lugar.valor === 0) fallas.push('orientación en espacio incorrecta');
    if (v.palabras.valor < 3) fallas.push(`recordó ${v.palabras.valor} de 3 palabras`);
    const banda = fallas.length ? B_COG.alterado : B_COG.conservado;
    return { banda, extras: { hallazgo: fallas.join('; ') || 'orientación correcta y recuerdo de 3 palabras', palabras: v.palabras.valor } };
  },
  resumen: (res) => textoResumen('ICOPE, cognición', res.banda, res.extras.hallazgo),
  resumenBreve: (res) => breve('ICOPE cognición', res.banda),
  notas: [
    'Es una evaluación básica: identifica a quién evaluar más a fondo y no diagnostica deterioro cognitivo ni demencia.',
    'Con una respuesta afirmativa a la pregunta de filtro no es necesario aplicar la prueba: se deriva a la evaluación detallada.',
    'El delirium, el déficit sensorial, la depresión y la baja escolaridad pueden alterar el resultado.',
    NOTA_PERIODICIDAD, NOTA_SIN_PUNTAJE, NOTA_ADAPTACION,
  ],
  licencia: LICENCIA_ICOPE,
  referencias: [REF_ICOPE, REF_ICOPE_OMS],
};

/* ---------- Capacidad locomotora ---------- */

const B_LOC = bandasDominio({
  conservado: 'Se levantó cinco veces de la silla sin usar los brazos en 14 segundos o menos. No requiere evaluación detallada de la movilidad en este momento.',
  alterado: 'No pudo intentar la prueba de la silla o no logró cinco levantadas en 14 segundos. Requiere una evaluación detallada de la movilidad (p. ej., SPPB).',
  sugerencias: [
    'Evaluación detallada de la movilidad: el manual ICOPE usa como ejemplo la SPPB (0 a 9 puntos, movilidad limitada; 10 a 12, normal).',
    'Valorar dolor, afecciones musculoesqueléticas, medicación inadecuada y riesgo de caídas en el hogar.',
  ],
});
const LIMITE_SILLA = 14;

export const icopeLocomotora = {
  id: 'icope-loc',
  nombre: 'ICOPE: evaluación básica de la capacidad locomotora',
  corto: 'ICOPE movilidad',
  dominio: 'caidas',
  tipo: 'tamizaje',
  icope: 'locomotora',
  aliases: ['ICOPE', 'capacidad intrinseca', 'prueba de la silla', 'levantarse de la silla', 'movilidad', 'locomotora'],
  problemas: ['movilidad limitada', 'debilidad', 'caídas', 'capacidad intrínseca'],
  descripcion: 'Prueba de la silla del paso 1 de ICOPE: cinco levantadas sin usar los brazos en 14 segundos.',
  objetivo: 'Detectar una posible pérdida de capacidad locomotora que requiere evaluación detallada (paso 2).',
  poblacion: 'Personas mayores en la comunidad y en atención primaria (manual ICOPE, OPS 2025).',
  aplicacion: [
    'Coloca una silla firme, idealmente sin reposabrazos, junto a una pared, y demuestra la prueba.',
    'Pregunta: «¿Cree que sería seguro para usted tratar de levantarse y sentarse en una silla cinco veces lo más rápido posible sin utilizar los brazos y sin que le cause dolor o molestias?».',
    'Si responde que sí: sentada a la mitad de la silla, con los brazos cruzados sobre el pecho, se levanta por completo y se vuelve a sentar cinco veces lo más rápido que pueda, sin detenerse. Mide el tiempo en segundos.',
    'Si usa bastón y se siente segura haciéndolo con él, puede usarlo.',
  ],
  tiempo: '1 a 2 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  siguientes: [
    { id: 'sppb', si: (res) => Boolean(res.banda?.hallazgo), motivo: 'Ejemplo de evaluación detallada de la movilidad en el manual ICOPE.' },
    { id: 'tug', si: (res) => Boolean(res.banda?.hallazgo), motivo: 'Movilidad y riesgo de caídas, si hay caídas o alteración de la marcha.' },
  ],
  vinculos: [
    {
      id: 'sppb', escala: 'sppb', titulo: 'Prueba de la silla del SPPB',
      disponible: (res) => (Number.isFinite(res.extras?.tiempoSilla) ? true : 'El SPPB guardado no tiene un tiempo de cinco levantadas (no se completó o se guardó con una versión anterior).'),
      describir: (res) => `Cinco levantadas en ${res.extras.tiempoSilla} s (mismo procedimiento: brazos cruzados, lo más rápido posible)`,
      aplicar: (res) => ({ seguro: 0, completo: 0, tiempo: String(res.extras.tiempoSilla) }),
      campos: ['seguro', 'completo', 'tiempo'],
    },
  ],
  campos: [
    pregunta('seguro', '¿Cree que sería seguro para usted levantarse y sentarse cinco veces lo más rápido posible, sin usar los brazos y sin dolor o molestias?', { textoCorto: 'seguridad para intentar la prueba' }),
    {
      id: 'completo', texto: '¿Completó las cinco levantadas?', textoCorto: 'cinco levantadas', puntua: false,
      visibleSi: (r) => r.seguro === 0,
      opciones: [{ texto: 'Sí, las completó', valor: 1 }, { texto: 'No logró completarlas', valor: 0 }],
    },
    { id: 'tiempo', tipo: 'numero', texto: 'Tiempo para las cinco levantadas', unidad: 's', min: 1, max: 120, decimales: 1, visibleSi: (r) => r.seguro === 0 && r.completo === 0 },
    {
      id: 'baston', texto: 'Ayuda técnica durante la prueba', textoCorto: 'ayuda técnica', puntua: false, opcional: true,
      visibleSi: (r) => r.seguro === 0,
      opciones: [{ texto: 'Ninguna', valor: 0 }, { texto: 'Con bastón', valor: 1 }],
    },
  ],
  bandas: [B_LOC.conservado, B_LOC.alterado],
  calcular({ v }) {
    if (!esSi(v.seguro)) return { banda: B_LOC.alterado, extras: { hallazgo: 'no pudo intentar la prueba de la silla con seguridad' } };
    if (v.completo.valor === 0) return { banda: B_LOC.alterado, extras: { hallazgo: 'no logró completar las cinco levantadas' } };
    const t = v.tiempo;
    const baston = v.baston?.valor === 1 ? ', con bastón' : '';
    const banda = t <= LIMITE_SILLA ? B_LOC.conservado : B_LOC.alterado;
    return { banda, extras: { hallazgo: `cinco levantadas en ${t} s${baston}${t > LIMITE_SILLA ? ', más de 14 s' : ''}`, tiempoSilla: t } };
  },
  resumen: (res) => textoResumen('ICOPE, movilidad', res.banda, res.extras.hallazgo),
  resumenBreve: (res) => breve('ICOPE movilidad', res.banda),
  notas: [
    'Criterio del manual ICOPE: evaluación detallada si la persona es incapaz de intentar la prueba o de ponerse de pie cinco veces en 14 segundos.',
    'Una respuesta negativa sobre la seguridad cuenta como incapacidad para intentar la prueba (requiere evaluación detallada), no como dato faltante.',
    'Si ya se hizo el SPPB, su prueba de la silla usa el mismo procedimiento y puede reutilizarse con tu confirmación.',
    NOTA_PERIODICIDAD, NOTA_SIN_PUNTAJE, NOTA_ADAPTACION,
  ],
  licencia: LICENCIA_ICOPE,
  referencias: [REF_ICOPE, REF_ICOPE_OMS],
};

/* ---------- Vitalidad ---------- */

const B_VIT = bandasDominio({
  conservado: 'Sin pérdida de peso involuntaria mayor de 3 kg en 3 meses ni falta de apetito. No requiere evaluación nutricional detallada en este momento.',
  alterado: 'Refiere pérdida de peso involuntaria o falta de apetito. Requiere una evaluación detallada del estado nutricional (p. ej., MNA).',
  sugerencias: [
    'Evaluación detallada del estado nutricional sin análisis de sangre (el manual cita MNA, MUST, SCREEN II y SNAQ65+).',
    'Valorar salud bucodental, problemas para masticar o deglutir, trastornos gastrointestinales, sarcopenia y acceso a los alimentos.',
  ],
});

export const icopeVitalidad = {
  id: 'icope-vit',
  nombre: 'ICOPE: evaluación básica de la vitalidad',
  corto: 'ICOPE vitalidad',
  dominio: 'nutricion',
  tipo: 'tamizaje',
  icope: 'vitalidad',
  aliases: ['ICOPE', 'capacidad intrinseca', 'perdida de peso', 'apetito', 'nutricion deficiente', 'vitalidad'],
  problemas: ['pérdida de peso', 'falta de apetito', 'desnutrición', 'capacidad intrínseca'],
  descripcion: 'Dos preguntas del paso 1 de ICOPE: pérdida de peso involuntaria y falta de apetito.',
  objetivo: 'Detectar una posible nutrición deficiente que requiere evaluación detallada (paso 2).',
  poblacion: 'Personas mayores en la comunidad y en atención primaria (manual ICOPE, OPS 2025).',
  aplicacion: [
    'Pregunta: «¿Ha perdido involuntariamente más de 3 kg en los últimos 3 meses?». Si no conoce su peso: «¿Ha notado que la ropa, el cinturón o el reloj de pulsera le quedan flojos?».',
    'Pregunta: «¿Ha tenido falta de apetito?».',
    'Si se cuenta con báscula, pesa a la persona y registra su peso (opcional).',
  ],
  tiempo: '1 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  siguientes: [
    { id: 'mnasf', si: (res) => Boolean(res.banda?.hallazgo), motivo: 'Evaluación del riesgo de desnutrición (registro del resultado oficial).' },
  ],
  campos: [
    {
      id: 'peso', texto: '¿Ha perdido involuntariamente más de 3 kg en los últimos 3 meses?', textoCorto: 'pérdida de peso', puntua: false,
      opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }, { texto: 'No conoce su peso', valor: 2 }],
    },
    pregunta('ropa', '¿Ha notado que la ropa, el cinturón o el reloj de pulsera le quedan flojos?', { textoCorto: 'ropa o cinturón flojos', visibleSi: (r) => r.peso === 2 }),
    pregunta('apetito', '¿Ha tenido falta de apetito?', { textoCorto: 'falta de apetito' }),
    { id: 'kg', tipo: 'numero', texto: 'Peso actual (si se cuenta con báscula)', unidad: 'kg', min: 20, max: 250, decimales: 1, opcional: true },
  ],
  bandas: [B_VIT.conservado, B_VIT.alterado],
  calcular({ v }) {
    const hallazgos = [];
    if (v.peso.valor === 1) hallazgos.push('pérdida de peso involuntaria mayor de 3 kg en 3 meses');
    if (v.peso.valor === 2 && esSi(v.ropa)) hallazgos.push('la ropa, el cinturón o el reloj le quedan flojos');
    if (esSi(v.apetito)) hallazgos.push('falta de apetito');
    const peso = Number.isFinite(v.kg) ? `peso ${v.kg} kg` : '';
    const banda = hallazgos.length ? B_VIT.alterado : B_VIT.conservado;
    const hallazgo = [hallazgos.join('; ') || 'sin pérdida de peso ni falta de apetito', peso].filter(Boolean).join('; ');
    return { banda, extras: { hallazgo, kg: Number.isFinite(v.kg) ? v.kg : null } };
  },
  resumen: (res) => textoResumen('ICOPE, vitalidad', res.banda, res.extras.hallazgo),
  resumenBreve: (res) => breve('ICOPE vitalidad', res.banda),
  notas: [
    'Criterio del manual ICOPE: evaluación detallada si responde afirmativamente a cualquiera de las dos preguntas.',
    'Si no conoce su peso y no nota la ropa floja, la pregunta de peso se considera negativa; registra el peso cuando sea posible para el seguimiento.',
    NOTA_PERIODICIDAD, NOTA_SIN_PUNTAJE, NOTA_ADAPTACION,
  ],
  licencia: LICENCIA_ICOPE,
  referencias: [REF_ICOPE, REF_ICOPE_OMS],
};

/* ---------- Visión ---------- */

const B_VIS = bandasDominio({
  conservado: 'Revisión ocular externa sin alteraciones, visión de lejos de 6/12 o mejor en cada ojo y N6 de cerca (con gafas habituales o de lectura). No requiere evaluación ocular detallada en este momento.',
  alterado: 'Alteración ocular externa, visión de lejos menor de 6/12 en algún ojo o N6 no visible ni con gafas de lectura. Requiere una evaluación integral visual y ocular.',
  filtro: 'Refiere un problema en los ojos o tiene diabetes, hipertensión, o usa esteroides o medicamentos para los ojos: se pasa directamente a la evaluación detallada (paso 2).',
  sugerencias: [
    'Derivar para una evaluación integral visual y ocular por personal capacitado (examen de los ojos y graduación de gafas).',
    'Una pérdida visual repentina o de evolución rápida, o una alteración externa importante, requiere atención especializada pronta.',
  ],
});
const OP_LEJOS = [
  { texto: 'Ve al menos 3 de las E pequeñas (6/12 o mejor)', valor: 1 },
  { texto: 'No ve 3 de las E pequeñas (menos de 6/12)', valor: 0 },
];

export const icopeVision = {
  id: 'icope-vis',
  nombre: 'ICOPE: evaluación básica de la visión',
  corto: 'ICOPE visión',
  dominio: 'sensorial',
  tipo: 'tamizaje',
  icope: 'vision',
  aliases: ['ICOPE', 'capacidad intrinseca', 'agudeza visual', 'tabla de la OMS', 'WHOeyes', 'vision', 'ojos'],
  problemas: ['deficiencia visual', 'baja visión', 'cataratas', 'capacidad intrínseca'],
  descripcion: 'Preguntas de filtro, revisión ocular externa y agudeza visual de lejos y de cerca con la tabla de la OMS.',
  objetivo: 'Detectar una posible deficiencia visual o enfermedad ocular que requiere evaluación detallada (paso 2).',
  poblacion: 'Personas mayores en la comunidad y en atención primaria (manual ICOPE, OPS 2025).',
  aplicacion: [
    'Preguntas de filtro: «¿Tiene algún problema en los ojos? (dificultad para ver de lejos o de cerca —con gafas si las usa—, dolor o molestias)» y «¿Tiene diabetes o hipertensión, o usa esteroides o medicamentos para los ojos?». Si alguna es afirmativa, pasa directamente a la evaluación detallada.',
    'Revisión ocular externa: ojo, párpados, pestañas y cierre de los párpados.',
    'Visión de lejos con la tabla de la OMS a 3 m, cada ojo por separado (primero el derecho), con gafas si las usa: se supera al ver al menos 3 de las E pequeñas (6/12).',
    'Visión de cerca a 40 cm con ambos ojos: se supera al ver al menos 3 E (N6). Si no, comprueba si ve N6 con gafas de lectura prefabricadas.',
    'La aplicación WHOeyes de la OMS permite hacer la prueba de agudeza. Una prueba en el teléfono no sustituye un examen ocular.',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  motivosNoEvaluable: MOTIVOS_SENSORIAL,
  campos: [
    pregunta('filtro1', '¿Tiene algún problema en los ojos? (dificultad para ver de lejos o de cerca, con gafas si las usa; dolor o molestias oculares)', { textoCorto: 'problema en los ojos' }),
    pregunta('filtro2', '¿Tiene diabetes o hipertensión, o usa actualmente esteroides o medicamentos para los ojos?', { textoCorto: 'diabetes, hipertensión, esteroides o gotas' }),
    {
      id: 'metodo', texto: 'Prueba de agudeza visual', textoCorto: 'método', puntua: false,
      visibleSi: (r) => r.filtro1 === 1 && r.filtro2 === 1,
      opciones: [{ texto: 'Tabla de la OMS impresa', valor: 0 }, { texto: 'Aplicación WHOeyes', valor: 1 }],
    },
    {
      id: 'gafas', texto: 'Gafas durante la prueba', textoCorto: 'gafas', puntua: false,
      visibleSi: (r) => r.filtro1 === 1 && r.filtro2 === 1,
      opciones: [{ texto: 'Usa gafas y la prueba se hizo con ellas', valor: 1 }, { texto: 'No usa gafas', valor: 0 }],
    },
    {
      id: 'externa', texto: 'Revisión ocular externa', textoCorto: 'revisión externa', puntua: false,
      visibleSi: (r) => r.filtro1 === 1 && r.filtro2 === 1,
      ayuda: 'Alteraciones: costra abundante o pus en el borde del párpado; secreción excesiva, acuosa o pegajosa; pestañas vueltas hacia dentro; cierre anormal de los párpados; enrojecimiento anormal de la parte blanca del ojo; opacidad o enrojecimiento anormal de la parte coloreada.',
      opciones: [{ texto: 'Sin alteraciones', valor: 1 }, { texto: 'Con alguna alteración', valor: 0 }],
    },
    { id: 'lejos_der', texto: 'Visión de lejos, ojo derecho (3 m)', textoCorto: 'lejos, ojo derecho', puntua: false, visibleSi: (r) => r.filtro1 === 1 && r.filtro2 === 1, opciones: OP_LEJOS },
    { id: 'lejos_izq', texto: 'Visión de lejos, ojo izquierdo (3 m)', textoCorto: 'lejos, ojo izquierdo', puntua: false, visibleSi: (r) => r.filtro1 === 1 && r.filtro2 === 1, opciones: OP_LEJOS },
    {
      id: 'cerca', texto: 'Visión de cerca, ambos ojos (40 cm)', textoCorto: 'visión de cerca', puntua: false,
      visibleSi: (r) => r.filtro1 === 1 && r.filtro2 === 1,
      opciones: [
        { texto: 'Ve al menos 3 E (N6)', valor: 2 },
        { texto: 'Ve N6 solo con gafas de lectura prefabricadas', valor: 1 },
        { texto: 'No ve N6 ni con gafas de lectura', valor: 0 },
      ],
    },
  ],
  bandas: [B_VIS.conservado, B_VIS.alterado, B_VIS.filtro],
  calcular({ v }) {
    const filtros = [];
    if (esSi(v.filtro1)) filtros.push('refiere un problema en los ojos');
    if (esSi(v.filtro2)) filtros.push('diabetes, hipertensión, esteroides o medicamentos oculares');
    if (filtros.length) return { banda: B_VIS.filtro, extras: { hallazgo: filtros.join('; '), filtro: true } };
    const fallas = [];
    if (v.externa.valor === 0) fallas.push('alteración ocular externa');
    if (v.lejos_der.valor === 0) fallas.push('ojo derecho menos de 6/12');
    if (v.lejos_izq.valor === 0) fallas.push('ojo izquierdo menos de 6/12');
    if (v.cerca.valor === 0) fallas.push('no ve N6 ni con gafas de lectura');
    const lectura = v.cerca.valor === 1;
    const banda = fallas.length ? B_VIS.alterado : B_VIS.conservado;
    const metodo = v.metodo.valor === 1 ? 'WHOeyes' : 'tabla de la OMS';
    const hallazgo = fallas.length
      ? `${fallas.join('; ')} (${metodo})`
      : `lejos 6/12 o mejor en cada ojo y N6 de cerca${lectura ? ' con gafas de lectura prefabricadas' : ''} (${metodo})`;
    const lineasNota = lectura ? ['Ve N6 solo con gafas de lectura prefabricadas: el esquema de atención ICOPE sugiere proveer gafas de lectura.'] : [];
    return { banda, lineasNota, lineas: lineasNota, extras: { hallazgo, lectura } };
  },
  resumen: (res) => textoResumen('ICOPE, visión', res.banda, res.extras.hallazgo),
  resumenBreve: (res) => breve('ICOPE visión', res.banda),
  notas: [
    'Criterios del manual ICOPE: evaluación detallada si hay alteraciones externas, visión de lejos menor de 6/12 en cualquier ojo o si no ve N6 con gafas de lectura prefabricadas.',
    'Huella no reproduce la tabla optométrica: usa la tabla impresa de la OMS o la aplicación WHOeyes. Una prueba en una pantalla sin calibrar no equivale a un examen ocular.',
    'Si no se cuenta con la tabla, regístralo como no evaluable por falta de equipo; no se interpreta como prueba superada.',
    NOTA_PERIODICIDAD, NOTA_SIN_PUNTAJE, NOTA_ADAPTACION,
  ],
  licencia: LICENCIA_ICOPE,
  referencias: [
    REF_ICOPE, REF_ICOPE_OMS,
    { texto: 'Organización Mundial de la Salud. Manual de cribado visual y ocular. Ginebra: OMS; 2023.', enlace: 'https://iris.who.int/handle/10665/380579' },
  ],
};

/* ---------- Audición ---------- */

const B_AUD = bandasDominio({
  conservado: 'Supera la prueba de audición elegida. No requiere evaluación auditiva detallada en este momento.',
  alterado: 'No supera la prueba de audición. Requiere una evaluación detallada (otoscopia y audiometría diagnóstica).',
  filtro: 'Refiere dificultades para oír: se pasa directamente a la evaluación detallada (audiometría diagnóstica).',
  sugerencias: [
    'Evaluación detallada: otoscopia (si hay tapón de cerumen, tratar y repetir la prueba) y audiometría diagnóstica.',
    'Señales de alerta que requieren atención especializada: pérdida súbita o de progresión rápida, unilateral o asimétrica, dolor de oído, otorrea o mareos.',
  ],
});
const OP_TONAL = [{ texto: 'Responde a 35 dBHL en 1, 2 y 4 kHz', valor: 1 }, { texto: 'No responde en una o más frecuencias', valor: 0 }];
const susurro = (id, texto) => ({
  id, texto, textoCorto: texto.toLowerCase(), puntua: false, compactoNumerico: true,
  visibleSi: (r) => r.filtro === 1 && r.prueba === 0,
  opciones: [4, 3, 2, 1, 0].map((n) => ({ texto: String(n), valor: n })),
});

export const icopeAudicion = {
  id: 'icope-aud',
  nombre: 'ICOPE: evaluación básica de la audición',
  corto: 'ICOPE audición',
  dominio: 'sensorial',
  tipo: 'tamizaje',
  icope: 'audicion',
  aliases: ['ICOPE', 'capacidad intrinseca', 'prueba del susurro', 'audiometria', 'hearWHO', 'digitos en ruido', 'sordera', 'audicion'],
  problemas: ['pérdida auditiva', 'hipoacusia', 'audífonos', 'capacidad intrínseca'],
  descripcion: 'Pregunta de filtro y una prueba de audición: susurro, audiometría tonal o dígitos en ruido (hearWHO).',
  objetivo: 'Detectar una posible pérdida auditiva que requiere evaluación detallada (paso 2).',
  poblacion: 'Personas mayores en la comunidad y en atención primaria (manual ICOPE, OPS 2025).',
  aplicacion: [
    'Pregunta de filtro: «¿Tiene dificultades para oír?» (a quien usa audífonos: «… incluso cuando utiliza sus audífonos»). Si responde que sí, pasa directamente a la evaluación detallada.',
    'Si responde que no, aplica una prueba; de preferencia la audiometría tonal o la de dígitos en ruido. El ruido de fondo debe ser menor de 40 dBA.',
    'Prueba del susurro (solo si no hay otra): de pie detrás y a un lado, a la distancia de un brazo; la persona tapa el otro oído presionando el trago. Tras exhalar, susurra cuatro palabras comunes no relacionadas, una por una. Repite en el otro oído con palabras distintas.',
    'Audiometría tonal: 35 dBHL a 1, 2 y 4 kHz en cada oído. Dígitos en ruido (p. ej., hearWHO): se supera con al menos 50% de tripletes correctos (hearWHO: puntuación de 50 o más).',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  motivosNoEvaluable: MOTIVOS_SENSORIAL,
  campos: [
    {
      id: 'audifonos', texto: '¿Usa audífonos?', textoCorto: 'audífonos', puntua: false, compacto: true,
      opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }],
    },
    {
      id: 'filtro', texto: '¿Tiene dificultades para oír?', textoCorto: 'dificultad para oír', puntua: false, compacto: true,
      ayuda: 'A quien usa audífonos, pregunta: «¿Tiene dificultades para oír, incluso cuando utiliza sus audífonos?».',
      opciones: SI_NO,
    },
    {
      id: 'prueba', texto: 'Prueba de audición', textoCorto: 'prueba', puntua: false,
      visibleSi: (r) => r.filtro === 1,
      opciones: [
        { texto: 'Prueba del susurro', valor: 0 },
        { texto: 'Audiometría tonal (35 dBHL)', valor: 1 },
        { texto: 'Dígitos en ruido (p. ej., hearWHO)', valor: 2 },
      ],
    },
    susurro('sus_der', 'Palabras repetidas, oído derecho (de 4)'),
    susurro('sus_izq', 'Palabras repetidas, oído izquierdo (de 4)'),
    { id: 'ton_der', texto: 'Audiometría tonal, oído derecho', textoCorto: 'audiometría, oído derecho', puntua: false, visibleSi: (r) => r.filtro === 1 && r.prueba === 1, opciones: OP_TONAL },
    { id: 'ton_izq', texto: 'Audiometría tonal, oído izquierdo', textoCorto: 'audiometría, oído izquierdo', puntua: false, visibleSi: (r) => r.filtro === 1 && r.prueba === 1, opciones: OP_TONAL },
    {
      id: 'din', tipo: 'numero', texto: 'Puntuación de dígitos en ruido (% de tripletes correctos o puntuación de hearWHO)', unidad: '', min: 0, max: 100, entero: true,
      visibleSi: (r) => r.filtro === 1 && r.prueba === 2,
    },
  ],
  bandas: [B_AUD.conservado, B_AUD.alterado, B_AUD.filtro],
  calcular({ v }) {
    const conAudifonos = v.audifonos.valor === 1;
    const extras = { audifonos: conAudifonos };
    if (esSi(v.filtro)) return { banda: B_AUD.filtro, extras: { ...extras, filtro: true, hallazgo: `refiere dificultades para oír${conAudifonos ? ' aun con audífonos' : ''}` } };
    let banda;
    let hallazgo;
    const lineas = [];
    const p = v.prueba.valor;
    if (p === 0) {
      const d = v.sus_der.valor;
      const i = v.sus_izq.valor;
      banda = d >= 3 && i >= 3 ? B_AUD.conservado : B_AUD.alterado;
      hallazgo = `prueba del susurro: oído derecho ${d} de 4, oído izquierdo ${i} de 4`;
      if (banda === B_AUD.conservado && (d === 3 || i === 3)) {
        lineas.push('El manual describe como probable audición normal repetir más de tres palabras; con exactamente tres, considera confirmar con audiometría tonal o dígitos en ruido.');
      }
      lineas.push('La prueba del susurro es la opción menos precisa: el manual recomienda usarla solo si no se cuenta con otras pruebas.');
    } else if (p === 1) {
      const fallas = [v.ton_der.valor === 0 ? 'derecho' : '', v.ton_izq.valor === 0 ? 'izquierdo' : ''].filter(Boolean);
      banda = fallas.length ? B_AUD.alterado : B_AUD.conservado;
      hallazgo = fallas.length ? `audiometría tonal: no responde a 35 dBHL en el oído ${fallas.join(' y ')}` : 'audiometría tonal: responde a 35 dBHL en ambos oídos';
    } else {
      banda = v.din >= 50 ? B_AUD.conservado : B_AUD.alterado;
      hallazgo = `dígitos en ruido: ${v.din}${v.din >= 50 ? ' (50 o más)' : ' (menos de 50)'}`;
    }
    if (conAudifonos) hallazgo += '; usa audífonos';
    return { banda, lineas, lineasNota: lineas.slice(0, 1).filter((x) => x.startsWith('El manual')), extras: { ...extras, hallazgo, prueba: p, din: p === 2 ? v.din : null } };
  },
  resumen: (res) => textoResumen('ICOPE, audición', res.banda, res.extras.hallazgo),
  resumenBreve: (res) => breve('ICOPE audición', res.banda),
  notas: [
    'Criterios del manual ICOPE: evaluación detallada si no repite al menos tres palabras en un oído (susurro), si no responde a 35 dBHL en una o más frecuencias en cualquier oído (audiometría tonal) o si identifica menos del 50% de los tripletes (hearWHO menor de 50).',
    'La prueba del susurro solo debe usarse cuando no se cuente con otras pruebas. Las pruebas con auriculares requieren ruido de fondo menor de 40 dBA.',
    'Si no se cuenta con equipo ni con un espacio silencioso, regístralo como no evaluable; no se interpreta como prueba superada.',
    NOTA_PERIODICIDAD, NOTA_SIN_PUNTAJE, NOTA_ADAPTACION,
  ],
  licencia: LICENCIA_ICOPE,
  referencias: [
    REF_ICOPE, REF_ICOPE_OMS,
    { texto: 'Organización Panamericana de la Salud. Tamizaje auditivo: consideraciones para su implementación. Washington, D.C.: OPS; 2021.', enlace: 'https://iris.paho.org/handle/10665.2/55387' },
  ],
};

/* ---------- Capacidad psicológica ---------- */

const B_PSI = bandasDominio({
  conservado: 'Sin sentimientos de tristeza o desesperanza ni falta de interés en las últimas 2 semanas. No requiere evaluación detallada de los síntomas depresivos en este momento.',
  alterado: 'Refiere tristeza, melancolía o desesperanza, o poco interés o placer en las últimas 2 semanas. Requiere evaluación detallada de los síntomas depresivos; un tamizaje positivo no es un diagnóstico.',
  sugerencias: [
    'Evaluación detallada de los síntomas depresivos (p. ej., PHQ-9 o GDS-15; elige uno) siguiendo la guía de intervención mhGAP.',
    'Valorar el riesgo de lesiones autoinfligidas o suicidio; si el riesgo es inminente, derivar de inmediato.',
    'Buscar causas o factores contribuyentes: medicación, dolor, anemia, hipotiroidismo, nutrición deficiente, duelo reciente y discapacidad.',
  ],
});

export const icopePsicologica = {
  id: 'icope-psi',
  nombre: 'ICOPE: evaluación básica de la capacidad psicológica',
  corto: 'ICOPE psicológica',
  dominio: 'afectivo',
  tipo: 'tamizaje',
  icope: 'psicologica',
  aliases: ['ICOPE', 'capacidad intrinseca', 'sintomas depresivos', 'tristeza', 'anhedonia', 'psicologica'],
  problemas: ['síntomas depresivos', 'tristeza', 'capacidad intrínseca'],
  descripcion: 'Dos preguntas del paso 1 de ICOPE sobre síntomas depresivos en las últimas 2 semanas.',
  objetivo: 'Detectar síntomas depresivos que requieren evaluación detallada (paso 2).',
  poblacion: 'Personas mayores en la comunidad y en atención primaria (manual ICOPE, OPS 2025).',
  aplicacion: [
    'Pregunta: «En las últimas dos semanas, ¿ha tenido alguno de los siguientes problemas?».',
    'Sentimientos de tristeza, melancolía o desesperanza.',
    'Falta de interés o de placer al hacer las cosas.',
  ],
  tiempo: '1 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  siguientes: [
    { id: 'phq9', si: (res) => Boolean(res.banda?.hallazgo), motivo: 'Herramienta citada por el manual ICOPE; gradúa la intensidad.' },
    { id: 'gds15', si: (res) => Boolean(res.banda?.hallazgo), motivo: 'Alternativa diseñada para personas mayores; aplica solo una de las dos.' },
  ],
  campos: [
    pregunta('tristeza', 'En las últimas 2 semanas, ¿ha tenido sentimientos de tristeza, melancolía o desesperanza?', { textoCorto: 'tristeza o desesperanza' }),
    pregunta('interes', 'En las últimas 2 semanas, ¿ha tenido falta de interés o de placer al hacer las cosas?', { textoCorto: 'poco interés o placer' }),
  ],
  bandas: [B_PSI.conservado, B_PSI.alterado],
  calcular({ v }) {
    const s = [esSi(v.tristeza) ? 'tristeza, melancolía o desesperanza' : '', esSi(v.interes) ? 'poco interés o placer' : ''].filter(Boolean);
    return { banda: s.length ? B_PSI.alterado : B_PSI.conservado, extras: { hallazgo: s.length ? `refiere ${s.join(' y ')}` : 'sin tristeza ni falta de interés en las últimas 2 semanas' } };
  },
  resumen: (res) => textoResumen('ICOPE, capacidad psicológica', res.banda, res.extras.hallazgo),
  resumenBreve: (res) => breve('ICOPE psicológica', res.banda),
  notas: [
    'Criterio del manual ICOPE: evaluación detallada si responde afirmativamente a cualquiera de las dos preguntas.',
    'Un tamizaje positivo no establece el diagnóstico de depresión: requiere una evaluación clínica (guía mhGAP).',
    NOTA_PERIODICIDAD, NOTA_SIN_PUNTAJE, NOTA_ADAPTACION,
  ],
  licencia: LICENCIA_ICOPE,
  referencias: [
    REF_ICOPE, REF_ICOPE_OMS,
    { texto: 'Organización Panamericana de la Salud. Guía de intervención mhGAP para los trastornos mentales, neurológicos y por consumo de sustancias en el nivel de atención de salud no especializada. Versión 2.0. Washington, D.C.: OPS; 2017.', enlace: 'https://iris.paho.org/handle/10665.2/34071' },
  ],
};

/* ---------- Factores clave (cuadro 3.2) y riesgo cardiovascular ---------- */

export const NECESIDADES_ICOPE = {
  vivienda: { texto: 'Problemas con la vivienda (estado, ubicación o seguridad)', grupo: 'social' },
  economia: { texto: 'Le faltan con frecuencia recursos para alimentación, vivienda o atención de salud', grupo: 'social' },
  soledad: { texto: 'Siente soledad con frecuencia', grupo: 'social' },
  participacion: { texto: 'Dificultad para realizar actividades de ocio y otras importantes para la persona', grupo: 'social' },
  cuid_apoyo: { texto: 'Quien cuida no siente que tiene el apoyo que necesita', grupo: 'cuidador' },
  cuid_confianza: { texto: 'Quien cuida no confía en su capacidad para prestar cuidados', grupo: 'cuidador' },
  cuid_repercusion: { texto: 'La función de cuidado tiene una repercusión negativa', grupo: 'cuidador' },
  orina: { texto: 'Problemas de control de la vejiga o pérdidas accidentales de orina', grupo: 'continencia' },
};
const SUG_NECESIDADES = {
  social: 'Explorar las necesidades de cuidados y apoyo social (p. ej., escala de Gijón) y considerar la referencia a Trabajo Social o a servicios comunitarios.',
  cuidador: 'Hablar en privado con quien cuida, explorar su sobrecarga (p. ej., Zarit) e incluir su apoyo en el plan de atención.',
  continencia: 'Evaluar la incontinencia urinaria en la evaluación detallada: es un síndrome geriátrico que influye en la capacidad intrínseca.',
};
const B_FAC = {
  con: { id: 'necesidades', rango: 'Alguna respuesta que sugiere necesidad', etiqueta: 'Con necesidades por explorar', nivel: 'moderado', hallazgo: true, texto: 'Hay factores que conviene explorar con una evaluación adicional o preguntas complementarias.' },
  sin: { id: 'sin', rango: 'Ninguna respuesta que sugiere necesidad', etiqueta: 'Sin necesidades detectadas', nivel: 'bien', texto: 'No se detectaron necesidades en estas preguntas. Vuelve a preguntar con regularidad.' },
};

export const icopeFactores = {
  id: 'icope-fac',
  nombre: 'ICOPE: factores clave y riesgo cardiovascular',
  corto: 'ICOPE factores clave',
  dominio: 'social',
  tipo: 'tamizaje',
  icope: 'factores',
  aliases: ['ICOPE', 'apoyo social', 'cuidador', 'incontinencia urinaria', 'vivienda', 'soledad', 'presion arterial', 'tabaco', 'necesidades adicionales'],
  problemas: ['aislamiento', 'soledad', 'sobrecarga del cuidador', 'incontinencia urinaria', 'hipertensión', 'riesgo social'],
  descripcion: 'Cuidados y apoyo social, apoyo a quien cuida e incontinencia urinaria (cuadro 3.2), más presión arterial y tabaco.',
  objetivo: 'Reconocer otros factores que repercuten en la salud de la persona mayor, independientemente de su capacidad intrínseca.',
  poblacion: 'Todas las personas mayores, después de la evaluación básica de la capacidad intrínseca (manual ICOPE, OPS 2025).',
  aplicacion: [
    'Haz las preguntas a la persona mayor; adapta la forma de enunciarlas al contexto sin usar lenguaje discriminatorio ni edadista.',
    'Las preguntas sobre el cuidado se hacen en privado a quien cuida a la persona mayor.',
    'Presión arterial (opcional): manguito del tamaño adecuado, sentada con la espalda apoyada, sin cruzar las piernas, con la vejiga vacía, tras 5 minutos de reposo y sin hablar; haz al menos dos lecturas y registra la segunda.',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  siguientes: [
    { id: 'gijon', si: (res) => Boolean(res.extras?.grupos?.includes('social')), motivo: 'Riesgo social: familia, economía, vivienda, relaciones y apoyo.' },
    { id: 'zarit', si: (res) => Boolean(res.extras?.grupos?.includes('cuidador')), motivo: 'Sobrecarga de quien cuida (registro del resultado oficial).' },
  ],
  campos: [
    pregunta('vivienda', '¿Tiene problemas con su vivienda, por ejemplo, estado de la casa, ubicación o seguridad?', { textoCorto: 'vivienda', grupo: 'Cuidados y apoyo social' }),
    pregunta('economia', '¿Le faltan con frecuencia recursos para pagar sus gastos de alimentación, vivienda y atención de salud?', { textoCorto: 'situación económica' }),
    pregunta('soledad', '¿Siente soledad con frecuencia?', { textoCorto: 'soledad' }),
    pregunta('participacion', '¿Tiene dificultades para realizar actividades de ocio y otras actividades importantes para usted?', { textoCorto: 'participación' }),
    {
      id: 'cuidador', texto: '¿Hay una persona a cargo de su cuidado?', textoCorto: 'persona a cargo del cuidado', puntua: false, grupo: 'Apoyo a quien cuida',
      opciones: [
        { texto: 'Sí, y respondió en privado', valor: 1 },
        { texto: 'Sí, pero no fue posible preguntarle', valor: 2 },
        { texto: 'No tiene', valor: 0 },
      ],
    },
    { ...pregunta('cuid_apoyo', '¿Siente que tiene el apoyo que necesita en su papel de persona a cargo del cuidado?', { textoCorto: 'apoyo a quien cuida' }), visibleSi: (r) => r.cuidador === 0 },
    { ...pregunta('cuid_confianza', '¿Confía en su capacidad para prestar cuidados y apoyo?', { textoCorto: 'confianza de quien cuida' }), visibleSi: (r) => r.cuidador === 0 },
    {
      id: 'cuid_repercusion', texto: 'La función de cuidado, ¿tiene una repercusión negativa (física, mental, económica o social)?', textoCorto: 'repercusión del cuidado', puntua: false, compacto: true,
      visibleSi: (r) => r.cuidador === 0, opciones: SI_NO,
    },
    pregunta('orina', '¿Tiene problemas de control de la vejiga, como pérdidas accidentales de orina?', { textoCorto: 'control de la vejiga', grupo: 'Incontinencia urinaria' }),
    {
      id: 'pa', texto: 'Presión arterial', textoCorto: 'presión arterial', puntua: false, opcional: true, grupo: 'Riesgo cardiovascular (opcional)',
      opciones: [{ texto: 'Medida (segunda de al menos dos lecturas)', valor: 1 }, { texto: 'No se midió', valor: 0 }],
    },
    { id: 'pas', tipo: 'numero', texto: 'Presión sistólica', unidad: 'mmHg', min: 60, max: 260, entero: true, visibleSi: (r) => r.pa === 0 },
    { id: 'pad', tipo: 'numero', texto: 'Presión diastólica', unidad: 'mmHg', min: 30, max: 160, entero: true, visibleSi: (r) => r.pa === 0 },
    { ...pregunta('tabaco', '¿Ha fumado o consumido algún otro producto del tabaco en los últimos 12 meses?', { textoCorto: 'tabaco' }), opcional: true },
  ],
  validar({ v }) {
    if (Number.isFinite(v.pas) && Number.isFinite(v.pad) && v.pad >= v.pas) return { pad: 'La diastólica debe ser menor que la sistólica.' };
    return null;
  },
  bandas: [B_FAC.con, B_FAC.sin],
  calcular({ v }) {
    const necesidades = [];
    for (const id of ['vivienda', 'economia', 'soledad', 'participacion', 'orina']) if (esSi(v[id])) necesidades.push(id);
    if (v.cuidador.valor === 1) {
      if (v.cuid_apoyo.valor === 0) necesidades.push('cuid_apoyo');
      if (v.cuid_confianza.valor === 0) necesidades.push('cuid_confianza');
      if (esSi(v.cuid_repercusion)) necesidades.push('cuid_repercusion');
    }
    const grupos = [...new Set(necesidades.map((id) => NECESIDADES_ICOPE[id].grupo))];
    const lineas = [];
    const otros = [];
    if (v.cuidador.valor === 2) lineas.push('Hay una persona a cargo del cuidado, pero no fue posible preguntarle en privado: sus necesidades quedan pendientes.');
    let pa = null;
    if (v.pa?.valor === 1 && Number.isFinite(v.pas) && Number.isFinite(v.pad)) {
      pa = { pas: v.pas, pad: v.pad, rango: v.pas >= 140 || v.pad >= 90 };
      lineas.push(pa.rango
        ? `Presión arterial ${v.pas}/${v.pad} mmHg: en el rango de hipertensión del manual ICOPE (sistólica ≥140 o diastólica ≥90). Una sola consulta no basta: el diagnóstico requiere cifras elevadas en dos consultas en días diferentes.`
        : `Presión arterial ${v.pas}/${v.pad} mmHg.`);
      if (pa.rango) otros.push('presión arterial en rango de hipertensión en esta medición');
    }
    if (esSi(v.tabaco)) {
      lineas.push('Consumo de tabaco en los últimos 12 meses.');
      otros.push('consumo de tabaco');
    }
    const sugerencias = grupos.map((g) => SUG_NECESIDADES[g]);
    if (pa?.rango) sugerencias.push('Confirmar la presión arterial en una segunda consulta en otro día y valorar los demás factores de riesgo cardiovascular.');
    if (esSi(v.tabaco)) sugerencias.push('Brindar consejo breve para dejar el tabaco.');
    const hay = necesidades.length || otros.length;
    const banda = { ...(hay ? B_FAC.con : B_FAC.sin), sugerencias };
    const textos = necesidades.map((id) => NECESIDADES_ICOPE[id].texto.toLowerCase());
    const hallazgo = [...textos, ...otros].join('; ') || 'sin necesidades detectadas';
    return { banda, mostrar: hay ? 'Con necesidades' : 'Sin necesidades', lineas, lineasNota: lineas, extras: { necesidades, grupos, pa, tabaco: esSi(v.tabaco), cuidadorPendiente: v.cuidador.valor === 2, hallazgo } };
  },
  resumen: (res) => `ICOPE, factores clave: ${res.banda.etiqueta.toLowerCase()}${res.extras.hallazgo && res.banda.id !== 'sin' ? ` (${res.extras.hallazgo})` : ''}.`,
  resumenBreve: (res) => `ICOPE factores clave: ${res.banda.etiqueta.toLowerCase()}`,
  notas: [
    'Las respuestas que sugieren necesidad indican la conveniencia de una evaluación adicional o de preguntas complementarias; no son diagnósticos.',
    'La incontinencia urinaria se evalúa aparte de la capacidad intrínseca porque es un síndrome geriátrico, aunque influye en ella.',
    'Presión arterial: en general se diagnostica hipertensión si en dos consultas en días diferentes la sistólica es ≥140 mmHg o la diastólica ≥90 mmHg (manual ICOPE, recuadro 3.1). El manual señala que no es ético tamizar sin vías de derivación y tratamiento.',
    NOTA_ADAPTACION,
  ],
  licencia: LICENCIA_ICOPE,
  referencias: [REF_ICOPE, REF_ICOPE_OMS],
};

// Cada dominio muestra su estado como texto (no hay cifra que sumar entre dominios).
for (const e of [icopeCognicion, icopeLocomotora, icopeVitalidad, icopeVision, icopeAudicion, icopePsicologica]) {
  const propio = e.calcular;
  e.calcular = (args) => {
    const r = propio(args);
    return { mostrar: r.banda.id === 'conservado' ? 'Conservado' : 'Alterado', ...r };
  };
}

export const ESCALAS_ICOPE = [icopeCognicion, icopeLocomotora, icopeVitalidad, icopeVision, icopeAudicion, icopePsicologica, icopeFactores];
