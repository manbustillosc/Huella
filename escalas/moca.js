import { REF_INGER_2022, SUG } from './_comun.js';

// MoCA: registro guiado por secciones (o solo el total) del puntaje obtenido con la hoja oficial.
// Las descripciones y reglas de puntuación están redactadas para Huella; no se reproducen láminas, palabras,
// series de dígitos o letras, frases ni pares de abstracción de la hoja oficial.
const BIN = (si, no) => [{ texto: si, valor: 1 }, { texto: no, valor: 0 }];
const guiado = (r) => r.modo === 0;
// «3 láminas (3)», «1 lámina (1)», «Ninguna (0)»
const conteo = (n, singular, plural) => Array.from({ length: n + 1 }, (_, i) => n - i).map((k) => ({ texto: k === 0 ? 'Ninguna (0)' : `${k} ${k === 1 ? singular : plural} (${k})`, valor: k }));

const SECCIONES = [
  { id: 'visuo', nombre: 'Visuoespacial y ejecutiva', max: 5, campos: ['trazo', 'cubo', 'reloj_contorno', 'reloj_numeros', 'reloj_manecillas'] },
  { id: 'identificacion', nombre: 'Identificación', max: 3, campos: ['identificacion'] },
  { id: 'atencion', nombre: 'Atención', max: 6, campos: ['digitos_directo', 'digitos_inverso', 'letras', 'resta'] },
  { id: 'lenguaje', nombre: 'Lenguaje', max: 3, campos: ['repeticion', 'fluidez'] },
  { id: 'abstraccion', nombre: 'Abstracción', max: 2, campos: ['abstraccion'] },
  { id: 'recuerdo', nombre: 'Recuerdo diferido', max: 5, campos: ['recuerdo'] },
  { id: 'orientacion', nombre: 'Orientación', max: 6, campos: ['orientacion'] },
];
const ORIENTACION = [
  { id: 'fecha', texto: 'Fecha (día del mes)' },
  { id: 'mes', texto: 'Mes' },
  { id: 'anio', texto: 'Año' },
  { id: 'dia', texto: 'Día de la semana' },
  { id: 'lugar', texto: 'Lugar' },
  { id: 'ciudad', texto: 'Ciudad' },
];

export default {
  id: 'moca',
  nombre: 'Evaluación Cognitiva Montreal (MoCA©)',
  corto: 'MoCA',
  dominio: 'cognitivo',
  tipo: 'evaluacion',
  registro: true,
  hojaOficial: true,
  aliases: ['Montreal', 'MoCA', 'cognitivo', 'deterioro cognitivo leve', 'Nasreddine'],
  problemas: ['deterioro cognitivo', 'deterioro cognitivo leve', 'demencia', 'queja de memoria'],
  descripcion: 'Registro guiado por secciones (o solo el total) del puntaje obtenido con la hoja oficial: 0 a 30 puntos, con ajuste por escolaridad.',
  objetivo: 'Detectar trastorno neurocognitivo leve y estadios tempranos de demencia.',
  poblacion: 'Personas de 49 a más de 85 años, en comunidad, hospital y urgencias; probada en múltiples idiomas y niveles de escolaridad (Nasreddine, 2005; guía del INGER, 2022). Validada en población mexicana (Aguilar-Navarro, 2018).',
  aplicacion: [
    'Aplica la prueba con la hoja e instrucciones oficiales (mocacognition.com), en un lugar tranquilo, con lentes y auxiliares auditivos puestos. Huella no reproduce láminas, palabras ni frases.',
    'Elige «Por secciones» para registrar cada tarea con su regla de puntuación; Huella suma y muestra el subtotal de cada dominio. Si ya tienes el total, elige «Solo el puntaje total».',
    'Orden recomendado por la hoja: visuoespacial y ejecutiva, identificación, memoria (dos ensayos de aprendizaje, sin puntos), atención, lenguaje, abstracción, recuerdo diferido (unos 5 minutos después) y orientación.',
    'El ajuste por escolaridad suma 1 punto si la escolaridad es de 12 años o menos y el total es menor de 30.',
    'Si no fue posible aplicarla, márcala como no evaluable e indica el motivo.',
  ],
  tiempo: '10 a 15 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor desempeño en la prueba',
  textoEmpeoramiento: 'peor desempeño en la prueba',
  min: 0,
  max: 30,
  campos: [
    {
      id: 'modo', texto: 'Forma de registro', textoCorto: 'forma de registro', puntua: false, opcional: true,
      opciones: [
        { texto: 'Por secciones (guiado)', valor: 0, detalle: 'Cada tarea con su regla de puntuación; Huella suma.' },
        { texto: 'Solo el puntaje total', valor: 1, detalle: 'Escribe el total de la hoja oficial antes del ajuste.' },
      ],
    },
    {
      id: 'puntaje', tipo: 'numero', texto: 'Puntaje total de la hoja oficial (antes del ajuste)', unidad: 'puntos', min: 0, max: 30, entero: true,
      visibleSi: (r) => r.modo === 1 || (r.modo == null && r.puntaje != null && r.puntaje !== ''),
    },
    // Visuoespacial y ejecutiva (5)
    {
      id: 'trazo', texto: 'Alternancia conceptual (trazo alternando números y letras)', textoCorto: 'alternancia conceptual', puntua: false, grupo: 'Visuoespacial y ejecutiva · 5 puntos', visibleSi: guiado,
      ayuda: '1 punto si une los puntos en el orden correcto, alternando número y letra, sin que las líneas se crucen. Si se equivoca y corrige de inmediato, cuenta como correcto.',
      opciones: BIN('Correcto (1)', 'Error o no lo completa (0)'),
    },
    {
      id: 'cubo', texto: 'Copia del cubo', textoCorto: 'copia del cubo', puntua: false, visibleSi: guiado,
      ayuda: '1 punto si el dibujo es tridimensional, tiene todas las líneas, no agrega líneas y las líneas son aproximadamente paralelas y de longitud similar.',
      opciones: BIN('Correcto (1)', 'Incorrecto (0)'),
    },
    {
      id: 'reloj_contorno', texto: 'Reloj: contorno', textoCorto: 'reloj, contorno', puntua: false, visibleSi: guiado,
      ayuda: 'Dibujo del reloj a la hora que indica la hoja. 1 punto si el contorno es un círculo; se aceptan deformaciones leves.',
      opciones: BIN('Correcto (1)', 'Incorrecto (0)'),
    },
    {
      id: 'reloj_numeros', texto: 'Reloj: números', textoCorto: 'reloj, números', puntua: false, visibleSi: guiado,
      ayuda: '1 punto si están todos los números, sin números de más, en orden y en el cuadrante correcto (pueden quedar dentro o fuera del contorno; se aceptan números romanos).',
      opciones: BIN('Correcto (1)', 'Incorrecto (0)'),
    },
    {
      id: 'reloj_manecillas', texto: 'Reloj: manecillas', textoCorto: 'reloj, manecillas', puntua: false, visibleSi: guiado,
      ayuda: '1 punto si hay dos manecillas que marcan la hora pedida, la de las horas claramente más corta que la de los minutos, unidas cerca del centro.',
      opciones: BIN('Correcto (1)', 'Incorrecto (0)'),
    },
    // Identificación (3)
    {
      id: 'identificacion', texto: 'Identificación de las tres láminas', textoCorto: 'identificación', puntua: false, grupo: 'Identificación · 3 puntos', visibleSi: guiado,
      ayuda: '1 punto por cada lámina nombrada correctamente según las respuestas aceptadas en las instrucciones oficiales.',
      opciones: conteo(3, 'lámina', 'láminas'),
    },
    // Atención (6)
    {
      id: 'digitos_directo', texto: 'Dígitos en orden directo', textoCorto: 'dígitos directos', puntua: false, grupo: 'Atención · 6 puntos', visibleSi: guiado,
      ayuda: 'Lee la serie a un dígito por segundo. 1 punto si la repite exactamente en el mismo orden.',
      opciones: BIN('Correcto (1)', 'Incorrecto (0)'),
    },
    {
      id: 'digitos_inverso', texto: 'Dígitos en orden inverso', textoCorto: 'dígitos inversos', puntua: false, visibleSi: guiado,
      ayuda: '1 punto si repite la serie exactamente al revés.',
      opciones: BIN('Correcto (1)', 'Incorrecto (0)'),
    },
    {
      id: 'letras', texto: 'Atención sostenida (serie de letras con golpe de la mano)', textoCorto: 'serie de letras', puntua: false, visibleSi: guiado,
      ayuda: 'Lees la serie de letras de la hoja y la persona da un golpe con la mano en cada letra indicada. Es error golpear en otra letra o no golpear en la indicada.',
      opciones: BIN('0 o 1 error (1)', '2 o más errores (0)'),
    },
    {
      id: 'resta', texto: 'Resta seriada de 7 en 7', textoCorto: 'resta seriada', puntua: false, visibleSi: guiado,
      ayuda: 'Cinco restas desde el número inicial de la hoja. Cada resta se califica por separado respecto al número anterior, aunque ese número estuviera mal. No repitas las respuestas de la persona.',
      opciones: [
        { texto: '4 o 5 restas correctas (3)', valor: 3 },
        { texto: '2 o 3 restas correctas (2)', valor: 2 },
        { texto: '1 resta correcta (1)', valor: 1 },
        { texto: 'Ninguna correcta (0)', valor: 0 },
      ],
    },
    // Lenguaje (3)
    {
      id: 'repeticion', texto: 'Repetición de las dos frases', textoCorto: 'repetición de frases', puntua: false, grupo: 'Lenguaje · 3 puntos', visibleSi: guiado,
      ayuda: '1 punto por cada frase repetida exactamente: sin omitir, sustituir ni agregar palabras.',
      opciones: [{ texto: 'Las dos frases (2)', valor: 2 }, { texto: 'Una frase (1)', valor: 1 }, { texto: 'Ninguna (0)', valor: 0 }],
    },
    {
      id: 'fluidez', texto: 'Fluidez verbal fonológica (1 minuto)', textoCorto: 'fluidez fonológica', puntua: false, visibleSi: guiado,
      ayuda: 'Palabras que empiezan con la letra que indica la hoja, en un minuto. No cuentan nombres propios, números ni la misma palabra con otra terminación.',
      opciones: BIN('11 palabras o más (1)', '10 palabras o menos (0)'),
    },
    // Abstracción (2)
    {
      id: 'abstraccion', texto: 'Abstracción (semejanzas)', textoCorto: 'abstracción', puntua: false, grupo: 'Abstracción · 2 puntos', visibleSi: guiado,
      ayuda: 'Después del ejemplo (que no puntúa), 1 punto por cada par en el que da una categoría abstracta, según las respuestas aceptadas en las instrucciones oficiales.',
      opciones: [{ texto: 'Los dos pares (2)', valor: 2 }, { texto: 'Un par (1)', valor: 1 }, { texto: 'Ninguno (0)', valor: 0 }],
    },
    // Recuerdo diferido (5)
    {
      id: 'recuerdo', texto: 'Recuerdo diferido sin pistas', textoCorto: 'recuerdo diferido', puntua: false, grupo: 'Recuerdo diferido · 5 puntos', visibleSi: guiado,
      ayuda: '1 punto por cada palabra recordada espontáneamente, sin pistas. Las palabras recordadas con pista de categoría u opción múltiple no suman puntos; regístralas en la hoja para fines clínicos.',
      opciones: conteo(5, 'palabra', 'palabras'),
    },
    // Orientación (6)
    {
      id: 'orientacion', tipo: 'checklist', texto: 'Orientación: marca las respuestas correctas', textoCorto: 'orientación', grupo: 'Orientación · 6 puntos', visibleSi: guiado,
      ayuda: '1 punto por cada respuesta exacta. La fecha debe ser exacta: un día de diferencia ya no cuenta.',
      opciones: ORIENTACION,
    },
    {
      id: 'escolaridad', texto: '¿Escolaridad de 12 años o menos?', ayuda: 'Se suma 1 punto si el total es menor de 30.', prefill: 'escolaridad12',
      opciones: [
        { texto: 'Sí, 12 años o menos', valor: 1 },
        { texto: 'No, más de 12 años', valor: 0 },
      ],
      puntua: false,
    },
  ],
  bandas: [
    {
      min: 0, max: 25, etiqueta: 'Probable trastorno cognitivo', nivel: 'moderado', hallazgo: true,
      texto: 'Puntaje por debajo del punto de corte: probable trastorno cognitivo. No establece el diagnóstico ni la causa.',
      sugerencias: [
        SUG.descartarDelirium,
        'Correlacionar con la funcionalidad (Lawton-Brody, Barthel) y con la información del cuidador para distinguir trastorno neurocognitivo leve de mayor.',
        SUG.causasReversibles,
        'Considerar valoración neuropsicológica o por especialista si el diagnóstico es incierto.',
      ],
    },
    { min: 26, max: 30, etiqueta: 'Dentro de lo esperado', nivel: 'bien', texto: 'Puntaje en rango normal. No descarta deterioro si la sospecha clínica es alta.', sugerencias: [] },
  ],
  calcular({ v }) {
    const porSecciones = v.modo?.valor === 0;
    if (!porSecciones && !Number.isFinite(v.puntaje)) return { faltan: ['modo'] };
    let bruto;
    const lineas = [];
    const extras = {};
    if (porSecciones) {
      const pts = {
        trazo: v.trazo.valor, cubo: v.cubo.valor, reloj_contorno: v.reloj_contorno.valor, reloj_numeros: v.reloj_numeros.valor, reloj_manecillas: v.reloj_manecillas.valor,
        identificacion: v.identificacion.valor, digitos_directo: v.digitos_directo.valor, digitos_inverso: v.digitos_inverso.valor, letras: v.letras.valor, resta: v.resta.valor,
        repeticion: v.repeticion.valor, fluidez: v.fluidez.valor, abstraccion: v.abstraccion.valor, recuerdo: v.recuerdo.valor, orientacion: v.orientacion.length,
      };
      const sub = Object.fromEntries(SECCIONES.map((s) => [s.id, s.campos.reduce((t, id) => t + pts[id], 0)]));
      bruto = Object.values(sub).reduce((t, x) => t + x, 0);
      extras.secciones = sub;
      lineas.push(`${SECCIONES.map((s) => `${s.nombre} ${sub[s.id]}/${s.max}`).join(' · ')}.`);
      const bajos = SECCIONES.filter((s) => sub[s.id] < s.max).map((s) => s.nombre.toLowerCase());
      if (bajos.length) lineas.push(`Dominios con puntos perdidos: ${bajos.join(', ')}.`);
    } else bruto = v.puntaje;
    const ajuste = v.escolaridad.valor === 1 && bruto < 30 ? 1 : 0;
    const puntaje = bruto + ajuste;
    lineas.unshift(ajuste ? `Puntaje bruto ${bruto} + 1 por escolaridad de 12 años o menos = ${puntaje}.` : `Puntaje ${bruto}, sin ajuste por escolaridad.`);
    if (puntaje < 26) lineas.push('Validación mexicana (Aguilar-Navarro, 2018; clínica de memoria): punto de corte de 26 para deterioro cognitivo leve (sensibilidad 80 %, especificidad 75 %) y de 24 para demencia (sensibilidad 98 %, especificidad 93 %). El puntaje no establece el diagnóstico.');
    return { puntaje, extras: { ...extras, bruto, ajuste, porSecciones }, lineas, lineasNota: lineas.filter((l) => !l.startsWith('Validación mexicana')) };
  },
  resumen(res) {
    const aj = res.extras.ajuste ? ' (incluye +1 por escolaridad ≤12 años)' : '';
    const s = res.extras.secciones;
    const det = s ? `; visuoespacial/ejecutiva ${s.visuo}/5, identificación ${s.identificacion}/3, atención ${s.atencion}/6, lenguaje ${s.lenguaje}/3, abstracción ${s.abstraccion}/2, recuerdo diferido ${s.recuerdo}/5, orientación ${s.orientacion}/6` : '';
    return `MoCA: ${res.puntaje}/30${aj} (${res.banda.etiqueta.toLowerCase()})${det}.`;
  },
  resumenBreve: (res) => `MoCA ${res.puntaje}/30 (${res.banda.etiqueta.toLowerCase()})`,
  detalleEnResumen: true,
  notas: [
    'Punto de corte 26 (normal 26–30), el original y el de la guía del INGER (2022). En la validación mexicana (Aguilar-Navarro, 2018) el punto de corte de 26 identificó deterioro cognitivo leve y el de 24, demencia.',
    'En poblaciones con baja escolaridad se han propuesto puntos de corte más bajos; con escolaridad muy baja o analfabetismo el MoCA subestima el desempeño: interprétalo con el contexto educativo o usa RUDAS.',
    'Interpretación por dominios: los subtotales orientan sobre qué funciones conviene explorar (p. ej., recuerdo diferido bajo con orientación conservada); no sustituyen una evaluación neuropsicológica.',
    'Requiere la versión oficial y, desde 2019, capacitación y certificación del evaluador según el titular. Huella solo registra e interpreta el puntaje.',
    'No interpretar durante delirium, sedación o déficit sensorial no corregido.',
  ],
  licencia: { texto: 'MoCA© es propiedad de MoCA Cognition. Huella no reproduce láminas, palabras, series ni frases; registra los puntos obtenidos con la versión oficial y describe las reglas de puntuación con redacción propia.', enlace: 'https://mocacognition.com' },
  referencias: [
    { texto: 'Nasreddine ZS, Phillips NA, Bédirian V, et al. The Montreal Cognitive Assessment, MoCA: a brief screening tool for mild cognitive impairment. J Am Geriatr Soc. 2005;53(4):695-9.', doi: '10.1111/j.1532-5415.2005.53221.x' },
    { texto: 'Aguilar-Navarro SG, Mimenza-Alvarado AJ, Palacios-García AA, et al. Validity and reliability of the Spanish version of the Montreal Cognitive Assessment (MoCA) for the detection of cognitive impairment in Mexico. Rev Colomb Psiquiatr. 2018;47(4):237-43.', doi: '10.1016/j.rcp.2017.05.003' },
    REF_INGER_2022,
  ],
};
