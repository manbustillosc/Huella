import { SUG, REF_INGER_2022 } from './_comun.js';

// Mini-Mental State Examination, versión mexicana de la guía de instrumentos del INGER (2022; Reyes de Beaman, 2004):
// registro guiado por dominios del puntaje obtenido con el formato. Las reglas están redactadas para Huella; no se
// reproducen las preguntas, las palabras, la frase para repetir, las órdenes escritas ni el dibujo.
// Botones numéricos compactos (5, 4, 3…): el título del campo y la regla indican qué cuenta cada punto.
const conteo = (n) => Array.from({ length: n + 1 }, (_, i) => n - i).map((k) => ({ texto: String(k), valor: k }));
const BIN = (si, no) => [{ texto: si, valor: 1 }, { texto: no, valor: 0 }];
export const GUIA_INGER_2022 = 'https://www.gob.mx/cms/uploads/attachment/file/813747/Guia_InstrumentosEvaluacion_2022_31oct.pdf';
export const ENTRADA_BAJA_ESCOLARIDAD = 8;
export const CORTE_INGER = 24;

const DOMINIOS_MMSE = [
  { id: 'orientacion', nombre: 'Orientación', max: 10, campos: ['tiempo', 'lugar'] },
  { id: 'fijacion', nombre: 'Fijación', max: 3, campos: ['fijacion'] },
  { id: 'atencion', nombre: 'Atención y cálculo', max: 5, campos: ['atencion'], completa: true },
  { id: 'recuerdo', nombre: 'Recuerdo diferido', max: 3, campos: ['recuerdo'] },
  { id: 'lenguaje', nombre: 'Lenguaje y praxis', max: 9, campos: ['denominacion', 'repeticion', 'orden', 'lectura', 'escritura', 'copia'] },
];
const SOLO_COMPLETA = ['atencion', 'lectura', 'escritura', 'copia'];
const completa = (r) => r.escolaridad === 1;

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
  'Completar la evaluación clínica y neuropsicológica para confirmar y graduar el deterioro (MoCA, prueba del reloj o valoración neuropsicológica); el MMSE es poco sensible al deterioro leve.',
];
const gravedadIMSS = (p) => (p >= 19 ? 'leve' : p >= 14 ? 'moderada' : 'grave');

export default {
  id: 'mmse',
  nombre: 'Mini-Examen del Estado Mental (MMSE), versión mexicana del INGER',
  corto: 'MMSE',
  dominio: 'cognitivo',
  tipo: 'evaluacion',
  registro: true,
  hojaOficial: true,
  aliases: ['minimental', 'mini mental', 'Folstein', 'MMSE', 'MEC', 'examen mínimo del estado mental', 'mini examen', 'Reyes de Beaman', 'INGER'],
  problemas: ['deterioro cognitivo', 'demencia', 'queja de memoria', 'seguimiento de demencia'],
  descripcion: 'Registro guiado por dominios del puntaje obtenido con el formato de la versión mexicana (guía del INGER, 2022): 0 a 30; probable deterioro cognitivo con 24 o menos.',
  objetivo: 'Detectar deterioro cognitivo leve o demencia y seguir su evolución.',
  poblacion: 'Personas mayores en México. Versión adaptada y validada por Reyes de Beaman et al. (2004), incluida en la guía de instrumentos del INGER (2022), con un ajuste para quienes tienen 3 años o menos de escolaridad formal.',
  aplicacion: [
    'Aplica la prueba con el formato del anexo 3 de la guía del INGER, en un lugar privado y tranquilo, con lentes y auxiliares auditivos puestos. Puedes guardar ese formato en «Tu hoja oficial».',
    'Pregunta primero si sabe leer y escribir y hasta qué año estudió: con 3 años o menos de escolaridad formal se dan 8 puntos de entrada y no se aplican la resta, la lectura, la escritura ni la copia.',
    'Di cada instrucción tal como aparece en el formato y registra los puntos de cada dominio; Huella suma, muestra los subtotales e interpreta.',
    'Si la persona no puede hacer una tarea por un déficit sensorial o motor, anótalo: el puntaje subestima su cognición. Si no fue posible aplicarla, márcala como no evaluable.',
  ],
  tiempo: '10 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor desempeño en la prueba',
  textoEmpeoramiento: 'peor desempeño en la prueba',
  barra: false,
  min: 0,
  max: 30,
  campos: [
    {
      id: 'escolaridad', texto: 'Escolaridad formal', textoCorto: 'escolaridad', puntua: false, prefill: 'escolaridadRango',
      ayuda: 'Con 3 años o menos se asignan 8 puntos de entrada y se omiten la resta (5), la lectura (1), la escritura (1) y la copia (1). Así se usa el mismo punto de corte para todos.',
      opciones: [
        { texto: '3 años o menos', valor: 0, hasta: 3, detalle: '8 puntos de entrada; forma abreviada' },
        { texto: '4 años o más', valor: 1, hasta: 99, detalle: 'Forma completa' },
      ],
    },
    {
      id: 'tiempo', texto: 'Orientación en el tiempo', textoCorto: 'orientación en el tiempo', puntua: false, grupo: 'Orientación · 10 puntos', compactoNumerico: true,
      ayuda: '1 punto por cada uno de los cinco datos que pide el formato. En la versión mexicana la estación del año se cambia por la hora: es correcta si difiere 30 minutos o menos de la hora real.',
      opciones: conteo(5),
    },
    {
      id: 'lugar', texto: 'Orientación en el espacio', textoCorto: 'orientación en el espacio', puntua: false, compactoNumerico: true,
      ayuda: '1 punto por cada uno de los cinco datos del lugar. El nombre del hospital solo se pregunta a personas hospitalizadas; en otros lugares se pregunta dónde están ahora. Incluye la colonia y la ciudad.',
      opciones: conteo(5),
    },
    {
      id: 'fijacion', texto: 'Fijación (registro de tres palabras)', textoCorto: 'fijación', puntua: false, grupo: 'Fijación · 3 puntos', compactoNumerico: true,
      ayuda: 'Di las tres palabras del formato, una por segundo. 1 punto por cada palabra repetida en el primer intento. Después repítelas hasta que las aprenda para poder evaluar el recuerdo.',
      opciones: conteo(3),
    },
    {
      id: 'atencion', texto: 'Atención y cálculo', textoCorto: 'atención y cálculo', puntua: false, grupo: 'Atención y cálculo · 5 puntos', compactoNumerico: true, visibleSi: completa,
      ayuda: 'Resta de 7 en 7 desde 100; la versión mexicana deja como alternativa la resta de 3 en 3 desde 20. 1 punto por cada resta correcta, hasta 5; cada una se califica respecto al número anterior, aunque ese estuviera mal.',
      opciones: conteo(5),
    },
    {
      id: 'recuerdo', texto: 'Recuerdo diferido', textoCorto: 'recuerdo diferido', puntua: false, grupo: 'Recuerdo diferido · 3 puntos', compactoNumerico: true,
      ayuda: '1 punto por cada una de las tres palabras de la fijación que recuerda sin pistas, en cualquier orden.',
      opciones: conteo(3),
    },
    {
      id: 'denominacion', texto: 'Denominación', textoCorto: 'denominación', puntua: false, grupo: 'Lenguaje y praxis · 9 puntos (6 en la forma abreviada)', compactoNumerico: true,
      ayuda: '1 punto por cada uno de los dos objetos comunes que nombra correctamente al mostrárselos.',
      opciones: conteo(2),
    },
    {
      id: 'repeticion', texto: 'Repetición', textoCorto: 'repetición', puntua: false,
      ayuda: '1 punto si repite exactamente la frase del formato (la versión mexicana usa una frase propia), al primer intento.',
      opciones: BIN('Correcta (1)', 'Incorrecta (0)'),
    },
    {
      id: 'orden', texto: 'Orden verbal en tres pasos', textoCorto: 'orden en tres pasos', puntua: false, compactoNumerico: true,
      ayuda: 'Da la orden completa una sola vez, con la hoja de papel que pide el formato. 1 punto por cada paso que realiza correctamente.',
      opciones: conteo(3),
    },
    {
      id: 'lectura', texto: 'Lectura (orden escrita)', textoCorto: 'lectura', puntua: false, visibleSi: completa,
      ayuda: '1 punto si lee la indicación escrita del formato y la realiza. Leerla en voz alta sin hacerla no cuenta.',
      opciones: BIN('Correcta (1)', 'Incorrecta (0)'),
    },
    {
      id: 'escritura', texto: 'Escritura de una oración', textoCorto: 'escritura', puntua: false, visibleSi: completa,
      ayuda: '1 punto si escribe por sí misma una oración completa y con sentido. No cuentan los errores de ortografía ni de gramática.',
      opciones: BIN('Correcta (1)', 'Incorrecta (0)'),
    },
    {
      id: 'copia', texto: 'Copia del dibujo', textoCorto: 'copia del dibujo', puntua: false, visibleSi: completa,
      ayuda: '1 punto si la copia conserva todos los ángulos de las figuras y la intersección que muestra el modelo. No se toman en cuenta el temblor ni la rotación.',
      opciones: BIN('Correcta (1)', 'Incorrecta (0)'),
    },
    {
      id: 'limitacion', tipo: 'checklist', texto: 'Limitaciones durante la aplicación', textoCorto: 'limitaciones', opcional: true,
      ayuda: 'Opcional. Se anotan en el resultado porque el puntaje puede subestimar la cognición.',
      opciones: LIMITACIONES,
    },
  ],
  bandas: [
    { id: 'probable', min: 0, max: 24, etiqueta: 'Probable deterioro cognitivo', nivel: 'moderado', hallazgo: true, texto: '24 puntos o menos (guía del INGER). Requiere una evaluación clínica y neuropsicológica más amplia para confirmar y graduar el deterioro.', sugerencias: SUG_ALTERADO },
    { id: 'sin', min: 25, max: 30, etiqueta: 'Sin deterioro cognitivo probable', nivel: 'bien', texto: 'Más de 24 puntos. El MMSE es poco sensible al deterioro leve: no lo descarta si la sospecha clínica persiste.', sugerencias: ['Si hay queja cognitiva o sospecha clínica, considerar una prueba más sensible al deterioro leve (p. ej., MoCA).'] },
  ],
  calcular({ v }) {
    const baja = v.escolaridad.valor === 0;
    const val = (id) => (baja && SOLO_COMPLETA.includes(id) ? 0 : v[id].valor);
    const sub = Object.fromEntries(DOMINIOS_MMSE.map((d) => [d.id, d.campos.reduce((t, id) => t + val(id), 0)]));
    const entrada = baja ? ENTRADA_BAJA_ESCOLARIDAD : 0;
    const puntaje = Object.values(sub).reduce((t, x) => t + x, 0) + entrada;
    const doms = DOMINIOS_MMSE.filter((d) => !(baja && d.completa)).map((d) => `${d.nombre} ${sub[d.id]}/${baja && d.id === 'lenguaje' ? 6 : d.max}`);
    const lineas = [`${doms.join(' · ')}.`];
    if (baja) lineas.push(`Forma abreviada por escolaridad de 3 años o menos: ${puntaje - entrada} puntos aplicados + ${entrada} de entrada = ${puntaje}.`);
    if (puntaje === CORTE_INGER) lineas.push('24 está en el límite: el INGER lo considera probable deterioro; con la versión original, la guía del IMSS lo considera normal con 5 años o más de escolaridad.');
    else if (puntaje < CORTE_INGER) lineas.push(`Gravedad orientativa con los rangos de la guía del IMSS: ${gravedadIMSS(puntaje)} (19 a 23 leve, 14 a 18 moderada, menos de 14 grave).`);
    const lim = Array.isArray(v.limitacion) ? v.limitacion : [];
    const limTexto = LIMITACIONES.filter((o) => lim.includes(o.id)).map((o) => o.texto.toLowerCase());
    if (limTexto.length) lineas.push(`Limitaciones durante la aplicación: ${limTexto.join(', ')}; el puntaje puede subestimar la cognición.`);
    if (v.recuerdo.valor === 0 && sub.orientacion >= 9) lineas.push('Recuerdo diferido nulo con orientación conservada: conviene explorar la memoria con una prueba más sensible.');
    return { puntaje, extras: { dominios: sub, corte: CORTE_INGER, escolaridadBaja: baja, entrada, version: 'inger', limitaciones: lim }, lineas, lineasNota: lineas };
  },
  resumen: (res) => {
    const d = res.extras.dominios;
    const at = res.extras.escolaridadBaja ? 'forma abreviada por escolaridad (8 puntos de entrada)' : `atención y cálculo ${d.atencion}/5`;
    return `MMSE (versión mexicana del INGER): ${res.puntaje}/30 (${res.banda.etiqueta.toLowerCase()}); orientación ${d.orientacion}/10, fijación ${d.fijacion}/3, ${at}, recuerdo ${d.recuerdo}/3, lenguaje y praxis ${d.lenguaje}/${res.extras.escolaridadBaja ? 6 : 9}.`;
  },
  resumenBreve: (res) => `MMSE ${res.puntaje}/30 (${res.banda.etiqueta.toLowerCase()})`,
  detalleEnResumen: true,
  comparable(a, b) {
    if (!a.extras || !b.extras) return null;
    if (a.extras.version !== b.extras.version) return { advertencia: 'Una de las aplicaciones se registró con otra versión del MMSE (puntos de corte distintos): compara con cautela.' };
    if (a.extras.escolaridadBaja !== b.extras.escolaridadBaja) return { advertencia: 'Una aplicación usó la forma abreviada por escolaridad (8 puntos de entrada) y otra la completa: compara los dominios aplicados en ambas.' };
    return null;
  },
  notas: [
    'Versión de la guía de instrumentos del INGER (2022), adaptada y validada en población mexicana por Reyes de Beaman et al. (2004): probable deterioro cognitivo con 24 puntos o menos; más de 24, sin deterioro.',
    'Con 3 años o menos de escolaridad formal se asignan 8 puntos de entrada y se omiten la resta (5 puntos), la lectura (1), la escritura (1) y la copia (1), lo que permite usar el mismo punto de corte. La guía dice «3 o menos» en la descripción y «menos de 3» en las instrucciones; Huella usa 3 o menos.',
    'Cambios de la versión mexicana: la hora en lugar de la estación del año; «dónde estamos ahora» fuera del hospital, con colonia y ciudad; palabras y frase de repetición propias; resta de 3 en 3 desde 20 como alternativa.',
    'Referencia aparte: la guía del IMSS (IMSS-144-08) usa con la versión original 24 con 5 años o más y 22 con 0 a 4 años, y gradúa la gravedad en 19 a 23 leve, 14 a 18 moderada y menos de 14 grave.',
    'La puntuación está muy influida por la escolaridad y la edad, y es poco sensible al deterioro leve (Franco-Marina, 2010). Para seguir la evolución compara siempre con la misma versión y la misma forma.',
    'No interpretar durante delirium, sedación o déficit sensorial no corregido.',
  ],
  licencia: { texto: 'Versión mexicana del MMSE (Reyes de Beaman, 2004) publicada en la guía de instrumentos del INGER (2022; licencia CC BY-NC-ND 4.0 y permiso para reproducir sus formatos completos con fines educativos o asistenciales sin ánimo de lucro, citando al INGER). Los derechos del MMSE original son de Folstein y colaboradores (MiniMental LLC; distribuye PAR). Huella no reproduce las preguntas, las palabras, la frase, las órdenes ni el dibujo: registra los puntos obtenidos con el formato y describe las reglas con redacción propia.', enlace: GUIA_INGER_2022 },
  referencias: [
    { ...REF_INGER_2022, enlace: GUIA_INGER_2022 },
    { texto: 'Folstein MF, Folstein SE, McHugh PR. "Mini-mental state". A practical method for grading the cognitive state of patients for the clinician. J Psychiatr Res. 1975;12(3):189-98.', doi: '10.1016/0022-3956(75)90026-6' },
    { texto: 'Instituto Mexicano del Seguro Social. Diagnóstico y tratamiento del deterioro cognoscitivo en el adulto mayor en el primer nivel de atención. Guía de referencia rápida IMSS-144-08, actualización 2012.', enlace: 'https://www.imss.gob.mx/sites/all/statics/guiasclinicas/144GRR.pdf' },
    { texto: 'Reyes de Beaman S, Beaman PE, García-Peña C, et al. Validation of a modified version of the Mini-Mental State Examination (MMSE) in Spanish. Aging Neuropsychol Cogn. 2004;11(1):1-11.', doi: '10.1076/anec.11.1.1.29366' },
    { texto: 'Franco-Marina F, García-González JJ, Wagner-Echeagaray F, et al. The Mini-mental State Examination revisited: ceiling and floor effects after score adjustment for educational level in an aging Mexican population. Int Psychogeriatr. 2010;22(1):72-81.', doi: '10.1017/S1041610209990822' },
  ],
};
