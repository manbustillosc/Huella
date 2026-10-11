import { SUG } from './_comun.js';

// Mini-Mental State Examination (MMSE): registro guiado por dominios del puntaje obtenido con la hoja oficial.
// Las descripciones y reglas de puntuación están redactadas para Huella; no se reproducen las preguntas, las palabras,
// la frase para repetir, las órdenes escritas ni el dibujo de la hoja.
// Botones numéricos compactos (5, 4, 3…): el título del campo y la regla indican qué cuenta cada punto.
const conteo = (n) => Array.from({ length: n + 1 }, (_, i) => n - i).map((k) => ({ texto: String(k), valor: k }));
const BIN = (si, no) => [{ texto: si, valor: 1 }, { texto: no, valor: 0 }];

const DOMINIOS_MMSE = [
  { id: 'orientacion', nombre: 'Orientación', max: 10, campos: ['tiempo', 'lugar'] },
  { id: 'fijacion', nombre: 'Fijación', max: 3, campos: ['fijacion'] },
  { id: 'atencion', nombre: 'Atención y cálculo', max: 5, campos: ['atencion'] },
  { id: 'recuerdo', nombre: 'Recuerdo diferido', max: 3, campos: ['recuerdo'] },
  { id: 'lenguaje', nombre: 'Lenguaje y praxis', max: 9, campos: ['denominacion', 'repeticion', 'orden', 'lectura', 'escritura', 'copia'] },
];

const LIMITACIONES = [
  { id: 'vision', texto: 'Déficit visual' },
  { id: 'audicion', texto: 'Déficit auditivo' },
  { id: 'motor', texto: 'Limitación motora de la mano dominante' },
  { id: 'analfabetismo', texto: 'No sabe leer o escribir' },
  { id: 'idioma', texto: 'Barrera de idioma' },
];

const SUG_ALTERADO = [
  SUG.descartarDelirium,
  'Correlacionar con la funcionalidad (Lawton-Brody, Barthel) y con la información de un informante.',
  SUG.causasReversibles,
  'Completar la evaluación (MoCA, prueba del reloj o valoración neuropsicológica) si el diagnóstico es incierto; el MMSE es poco sensible al deterioro leve.',
];
const B = {
  normal: { id: 'normal', rango: '24 a 30 (22 a 30 con 0 a 4 años de escolaridad)', etiqueta: 'Dentro de lo esperado para la escolaridad', nivel: 'bien', texto: 'Puntaje igual o mayor que el punto de corte para su escolaridad. El MMSE es poco sensible al deterioro leve, sobre todo con escolaridad alta: no lo descarta si la sospecha clínica persiste.', sugerencias: ['Si hay queja cognitiva o sospecha clínica, considerar una prueba más sensible al deterioro leve (p. ej., MoCA).'] },
  leve: { id: 'leve', rango: '19 a 23 (19 a 21 con 0 a 4 años)', etiqueta: 'Alteración cognitiva leve', nivel: 'moderado', hallazgo: true, texto: 'Puntaje por debajo del punto de corte para su escolaridad, en el rango leve de la guía del IMSS. No establece el diagnóstico ni la causa.', sugerencias: SUG_ALTERADO },
  moderada: { id: 'moderada', rango: '14 a 18', etiqueta: 'Alteración cognitiva moderada', nivel: 'grave', hallazgo: true, texto: 'Puntaje en el rango moderado de la guía del IMSS. No establece el diagnóstico ni la causa.', sugerencias: SUG_ALTERADO },
  grave: { id: 'grave', rango: '0 a 13', etiqueta: 'Alteración cognitiva grave', nivel: 'critico', hallazgo: true, texto: 'Puntaje en el rango grave de la guía del IMSS. No establece el diagnóstico ni la causa.', sugerencias: SUG_ALTERADO },
};

export default {
  id: 'mmse',
  nombre: 'Mini-Mental State Examination (MMSE) de Folstein',
  corto: 'MMSE',
  dominio: 'cognitivo',
  tipo: 'evaluacion',
  registro: true,
  hojaOficial: true,
  aliases: ['minimental', 'mini mental', 'Folstein', 'MMSE', 'MEC', 'examen mínimo del estado mental', 'mini examen'],
  problemas: ['deterioro cognitivo', 'demencia', 'queja de memoria', 'seguimiento de demencia'],
  descripcion: 'Registro guiado por dominios del puntaje obtenido con la hoja oficial: orientación, fijación, atención y cálculo, recuerdo, y lenguaje y praxis (0 a 30), con punto de corte según la escolaridad.',
  objetivo: 'Tamizaje y seguimiento del estado cognitivo global; útil para graduar y seguir la gravedad del deterioro.',
  poblacion: 'Adultos y personas mayores en cualquier nivel de atención (Folstein, 1975). En México, la guía del IMSS indica ajustar el resultado a la escolaridad; existe una versión mexicana modificada (Reyes de Beaman, 2004).',
  aplicacion: [
    'Aplica la prueba con tu hoja oficial, en un lugar tranquilo, con lentes y auxiliares auditivos puestos. Huella no reproduce las preguntas, las palabras, la frase, las órdenes ni el dibujo.',
    'Registra los puntos de cada dominio con la regla que se describe en cada uno; Huella suma, muestra los subtotales e interpreta según la escolaridad.',
    'Pregunta de forma abierta, sin dar opciones ni pistas, salvo donde la hoja lo indique.',
    'Si la persona no puede hacer una tarea por un déficit sensorial o motor (p. ej., no ve para leer), anótalo: el puntaje subestima su cognición. Si no fue posible aplicarla, márcala como no evaluable.',
  ],
  tiempo: '5 a 10 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor desempeño en la prueba',
  textoEmpeoramiento: 'peor desempeño en la prueba',
  barra: false,
  min: 0,
  max: 30,
  campos: [
    {
      id: 'escolaridad', texto: 'Escolaridad', textoCorto: 'escolaridad', puntua: false, prefill: 'escolaridadRango',
      ayuda: 'Define el punto de corte: 24 con 5 años o más; 22 con 0 a 4 años (guía del IMSS).',
      opciones: [
        { texto: '0 a 4 años', valor: 0, hasta: 4 },
        { texto: '5 años o más', valor: 5, hasta: 99 },
      ],
    },
    {
      id: 'tiempo', texto: 'Orientación en el tiempo', textoCorto: 'orientación en el tiempo', puntua: false, grupo: 'Orientación · 10 puntos', compactoNumerico: true,
      ayuda: '1 punto por cada uno de los cinco datos de la fecha que responde correctamente (los indica la hoja oficial). Pregunta de forma abierta.',
      opciones: conteo(5),
    },
    {
      id: 'lugar', texto: 'Orientación en el espacio', textoCorto: 'orientación en el espacio', puntua: false, compactoNumerico: true,
      ayuda: '1 punto por cada uno de los cinco datos del lugar donde se encuentra (los indica la hoja oficial).',
      opciones: conteo(5),
    },
    {
      id: 'fijacion', texto: 'Fijación (registro de tres palabras)', textoCorto: 'fijación', puntua: false, grupo: 'Fijación · 3 puntos', compactoNumerico: true,
      ayuda: 'Di las tres palabras de la hoja, una por segundo. 1 punto por cada palabra repetida en el primer intento. Después repítelas hasta que las aprenda (la hoja indica cuántos intentos) para poder evaluar el recuerdo.',
      opciones: conteo(3),
    },
    {
      id: 'atencion', texto: 'Atención y cálculo', textoCorto: 'atención y cálculo', puntua: false, grupo: 'Atención y cálculo · 5 puntos', compactoNumerico: true,
      ayuda: 'La tarea que indica tu hoja (restas seriadas o deletreo inverso de una palabra). 1 punto por cada respuesta correcta, hasta 5. En las restas, cada una se califica respecto al número anterior, aunque ese estuviera mal.',
      opciones: conteo(5),
    },
    {
      id: 'recuerdo', texto: 'Recuerdo diferido', textoCorto: 'recuerdo diferido', puntua: false, grupo: 'Recuerdo diferido · 3 puntos', compactoNumerico: true,
      ayuda: '1 punto por cada una de las tres palabras de la fijación que recuerda sin pistas, en cualquier orden.',
      opciones: conteo(3),
    },
    {
      id: 'denominacion', texto: 'Denominación', textoCorto: 'denominación', puntua: false, grupo: 'Lenguaje y praxis · 9 puntos', compactoNumerico: true,
      ayuda: '1 punto por cada uno de los dos objetos comunes que nombra correctamente al mostrárselos.',
      opciones: conteo(2),
    },
    {
      id: 'repeticion', texto: 'Repetición', textoCorto: 'repetición', puntua: false,
      ayuda: '1 punto si repite exactamente la frase de la hoja, al primer intento.',
      opciones: BIN('Correcta (1)', 'Incorrecta (0)'),
    },
    {
      id: 'orden', texto: 'Orden verbal en tres pasos', textoCorto: 'orden en tres pasos', puntua: false, compactoNumerico: true,
      ayuda: 'Da la orden completa una sola vez. 1 punto por cada paso que realiza correctamente.',
      opciones: conteo(3),
    },
    {
      id: 'lectura', texto: 'Lectura (orden escrita)', textoCorto: 'lectura', puntua: false,
      ayuda: '1 punto si lee la indicación escrita de la hoja y la realiza. Leerla en voz alta sin hacerla no cuenta.',
      opciones: BIN('Correcta (1)', 'Incorrecta (0)'),
    },
    {
      id: 'escritura', texto: 'Escritura de una oración', textoCorto: 'escritura', puntua: false,
      ayuda: '1 punto si escribe por sí misma una oración completa y con sentido (con sujeto y verbo). No cuentan los errores de ortografía ni de gramática.',
      opciones: BIN('Correcta (1)', 'Incorrecta (0)'),
    },
    {
      id: 'copia', texto: 'Copia del dibujo', textoCorto: 'copia del dibujo', puntua: false,
      ayuda: '1 punto si la copia conserva todos los ángulos de las figuras y la intersección que muestra el modelo. No se toman en cuenta el temblor ni la rotación.',
      opciones: BIN('Correcta (1)', 'Incorrecta (0)'),
    },
    {
      id: 'limitacion', tipo: 'checklist', texto: 'Limitaciones durante la aplicación', textoCorto: 'limitaciones', opcional: true,
      ayuda: 'Opcional. Se anotan en el resultado porque el puntaje puede subestimar la cognición.',
      opciones: LIMITACIONES,
    },
  ],
  bandas: [B.normal, B.leve, B.moderada, B.grave],
  calcular({ v }) {
    const pts = { tiempo: v.tiempo.valor, lugar: v.lugar.valor, fijacion: v.fijacion.valor, atencion: v.atencion.valor, recuerdo: v.recuerdo.valor, denominacion: v.denominacion.valor, repeticion: v.repeticion.valor, orden: v.orden.valor, lectura: v.lectura.valor, escritura: v.escritura.valor, copia: v.copia.valor };
    const sub = Object.fromEntries(DOMINIOS_MMSE.map((d) => [d.id, d.campos.reduce((t, id) => t + pts[id], 0)]));
    const puntaje = Object.values(sub).reduce((t, x) => t + x, 0);
    const baja = v.escolaridad.valor === 0;
    const corte = baja ? 22 : 24;
    const banda = puntaje >= corte ? B.normal : puntaje >= 19 ? B.leve : puntaje >= 14 ? B.moderada : B.grave;
    const lineas = [
      `${DOMINIOS_MMSE.map((d) => `${d.nombre} ${sub[d.id]}/${d.max}`).join(' · ')}.`,
      `Punto de corte para ${baja ? '0 a 4 años' : '5 años o más'} de escolaridad: ${corte} (guía del IMSS).`,
    ];
    const lim = Array.isArray(v.limitacion) ? v.limitacion : [];
    const limTexto = LIMITACIONES.filter((o) => lim.includes(o.id)).map((o) => o.texto.toLowerCase());
    if (limTexto.length) lineas.push(`Limitaciones durante la aplicación: ${limTexto.join(', ')}; el puntaje puede subestimar la cognición.`);
    if (pts.recuerdo === 0 && sub.orientacion >= 9) lineas.push('Recuerdo diferido nulo con orientación conservada: conviene explorar la memoria con una prueba más sensible.');
    return { puntaje, banda, extras: { dominios: sub, corte, escolaridadBaja: baja, limitaciones: lim }, lineas, lineasNota: lineas };
  },
  resumen: (res) => {
    const d = res.extras.dominios;
    return `MMSE: ${res.puntaje}/30 (${res.banda.etiqueta.toLowerCase()}; corte ${res.extras.corte} para la escolaridad); orientación ${d.orientacion}/10, fijación ${d.fijacion}/3, atención y cálculo ${d.atencion}/5, recuerdo ${d.recuerdo}/3, lenguaje y praxis ${d.lenguaje}/9.`;
  },
  resumenBreve: (res) => `MMSE ${res.puntaje}/30 (${res.banda.etiqueta.toLowerCase()})`,
  detalleEnResumen: true,
  comparable: (a, b) => (a.extras && b.extras && a.extras.corte !== b.extras.corte ? { advertencia: 'Las aplicaciones usaron puntos de corte distintos (escolaridad registrada de forma diferente).' } : null),
  notas: [
    'Puntos de corte de la guía de práctica clínica del IMSS (IMSS-144-08, actualización 2012): 24 con 5 años o más de escolaridad y 22 con 0 a 4 años. Gravedad (cuadro 1 de la guía): 24 a 30 normal, 19 a 23 leve, 14 a 18 moderado y menos de 14 grave; el texto de la misma guía menciona 18 a 23 para el rango leve.',
    'Folstein (1975) no fijó un punto de corte; el más usado es 23/24.',
    'Es poco sensible al deterioro cognitivo leve y tiene efecto techo con escolaridad alta y efecto suelo con escolaridad baja, aun después de ajustar (Franco-Marina, 2010). Para deterioro leve, el MoCA es más sensible.',
    'Útil para seguir la evolución: compara siempre con la misma versión de la hoja y con la misma tarea de atención (restas o deletreo).',
    'No interpretar durante delirium, sedación o déficit sensorial no corregido.',
  ],
  licencia: { texto: 'MMSE: derechos de autor de Folstein y colaboradores (MiniMental LLC); las hojas y la versión MMSE-2, incluida una versión en español para Latinoamérica, se distribuyen por PAR (Psychological Assessment Resources). Huella no reproduce preguntas, palabras, frases, órdenes ni el dibujo; registra los puntos obtenidos con la hoja oficial y describe las reglas de puntuación con redacción propia.', enlace: 'https://www.parinc.com' },
  referencias: [
    { texto: 'Folstein MF, Folstein SE, McHugh PR. "Mini-mental state". A practical method for grading the cognitive state of patients for the clinician. J Psychiatr Res. 1975;12(3):189-98.', doi: '10.1016/0022-3956(75)90026-6' },
    { texto: 'Instituto Mexicano del Seguro Social. Diagnóstico y tratamiento del deterioro cognoscitivo en el adulto mayor en el primer nivel de atención. Guía de referencia rápida IMSS-144-08, actualización 2012.', enlace: 'https://www.imss.gob.mx/sites/all/statics/guiasclinicas/144GRR.pdf' },
    { texto: 'Reyes de Beaman S, Beaman PE, García-Peña C, et al. Validation of a modified version of the Mini-Mental State Examination (MMSE) in Spanish. Aging Neuropsychol Cogn. 2004;11(1):1-11.', doi: '10.1076/anec.11.1.1.29366' },
    { texto: 'Franco-Marina F, García-González JJ, Wagner-Echeagaray F, et al. The Mini-mental State Examination revisited: ceiling and floor effects after score adjustment for educational level in an aging Mexican population. Int Psychogeriatr. 2010;22(1):72-81.', doi: '10.1017/S1041610209990822' },
  ],
};
