// Fase 5 (versión 2.3): escalas que no requieren permiso ni pago.
// Isaacs, GPCOG (registro), GOHAI (registro), MOS de apoyo social, Caprini, LACE, G8 (registro), ESAS-r,
// SPICT (registro), NECPAL (registro) y dosis equivalente de morfina oral (MME, CDC 2022).
import { SUG } from './_comun.js';
import { ordenarPorLogro } from '../js/motor.js';

const minus = (t) => t.charAt(0).toLowerCase() + t.slice(1);

/* ---------- Prueba de Isaacs (Set Test) ---------- */

const categoria = (id, texto) => ({
  id, tipo: 'numero', texto, unidad: 'palabras', min: 0, max: 10, entero: true,
  ayuda: '1 minuto o hasta 10 palabras distintas. No cuentan las repeticiones ni las que no pertenecen a la categoría.',
});

export const isaacs = {
  id: 'isaacs',
  nombre: 'Prueba de Isaacs (Set Test)',
  corto: 'Isaacs',
  dominio: 'cognitivo',
  tipo: 'tamizaje',
  aliases: ['Set Test', 'set test de Isaacs', 'fluencia por categorías', 'colores animales frutas ciudades', 'baja escolaridad'],
  problemas: ['deterioro cognitivo', 'demencia', 'baja escolaridad', 'déficit sensorial'],
  descripcion: 'Fluencia verbal en cuatro categorías (colores, animales, frutas y ciudades), hasta 10 por categoría: 0 a 40.',
  objetivo: 'Tamizaje rápido de demencia, útil con baja escolaridad o con déficit sensorial porque no requiere leer, escribir ni dibujar.',
  poblacion: 'Personas mayores (Isaacs y Akhtar, 1972); incluida en la guía de instrumentos del INGER (2022).',
  aplicacion: [
    'Pide que diga todos los colores que recuerde; después, animales, frutas y ciudades, en ese orden.',
    'Da 1 minuto por categoría o detente al llegar a 10 palabras distintas.',
    'Anota cada palabra: así podrás comparar en el seguimiento. Las repeticiones y las palabras fuera de la categoría no suman, pero conviene anotarlas.',
  ],
  tiempo: '4 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'más palabras evocadas',
  textoEmpeoramiento: 'menos palabras evocadas',
  min: 0,
  max: 40,
  ordenCapacidad: { campos: ['colores', 'animales', 'frutas', 'ciudades'], mejor: 'alto' },
  campos: [categoria('colores', 'Colores'), categoria('animales', 'Animales'), categoria('frutas', 'Frutas'), categoria('ciudades', 'Ciudades')],
  bandas: [
    { min: 0, max: 25, etiqueta: 'Probable trastorno neurocognitivo', nivel: 'moderado', hallazgo: true, texto: '25 o menos (guía del INGER, 2022). No establece el diagnóstico.', sugerencias: [SUG.descartarDelirium, SUG.cognitivaCompleta, SUG.causasReversibles] },
    { min: 26, max: 40, etiqueta: 'Dentro de lo esperado', nivel: 'bien', texto: 'Más de 25 puntos.', sugerencias: [] },
  ],
  calcular({ v }) {
    const puntaje = v.colores + v.animales + v.frutas + v.ciudades;
    // Categorías con 10 palabras primero, luego las parciales y al final las que quedaron en 0.
    const cats = ordenarPorLogro([['colores', v.colores], ['animales', v.animales], ['frutas', v.frutas], ['ciudades', v.ciudades]], (c) => c[1] / 10)
      .map(([t, n]) => `${t} ${n}/10`).join(', ');
    const lineas = [`${cats.charAt(0).toUpperCase()}${cats.slice(1)}.`];
    if (puntaje < 15) lineas.push('Menos de 15: en la serie original, este puntaje siempre se asoció a demencia.');
    else if (puntaje <= 27 && puntaje > 25) lineas.push('26 a 27: por encima del corte del INGER, pero en el corte del protocolo andaluz para personas mayores (27 o menos); interpreta con la clínica.');
    return { puntaje, lineas, lineasNota: lineas.slice(1) };
  },
  notas: [
    'Punto de corte de la guía del INGER (2022): 25 o menos indica probable trastorno neurocognitivo; según la guía, no requiere ajustar por escolaridad.',
    'Otros cortes publicados: 27 o menos en personas mayores y 29 o menos en adultos (protocolo del Servicio Andaluz de Salud, validación de Pascual, 1990); 25 o menos para demencia tipo Alzheimer probable (sensibilidad 87 %, especificidad 67 %).',
    'La fluencia semántica de animales en 1 minuto es una prueba distinta, con su propio punto de corte.',
  ],
  licencia: { texto: 'Prueba publicada por Isaacs y Akhtar (1972); sin titular de derechos identificado.' },
  referencias: [
    { texto: 'Isaacs B, Akhtar AJ. The set test: a rapid test of mental function in old people. Age Ageing. 1972;1(4):222-6.', doi: '10.1093/ageing/1.4.222' },
    { texto: 'Isaacs B, Kennie AT. The set test as an aid to the detection of dementia in old people. Br J Psychiatry. 1973;123(575):467-70.', doi: '10.1192/bjp.123.4.467' },
    { texto: 'Instituto Nacional de Geriatría. Guía de instrumentos de evaluación de la capacidad funcional. Prueba de categorías de Isaacs. Ciudad de México: INGER; 2022.', enlace: 'https://www.gob.mx/cms/uploads/attachment/file/813747/Guia_InstrumentosEvaluacion_2022_31oct.pdf' },
    { texto: 'Pascual LF, et al. Validación española del Set Test de Isaacs. Neurología. 1990.' },
    { texto: 'Servicio Andaluz de Salud. Set Test de Isaacs (protocolo de cribado de demencias).', enlace: 'https://www.sspa.juntadeandalucia.es/servicioandaluzdesalud/sites/default/files/sincfiles/wsas-media-mediafile_sasdocumento/2019/PT6_CribDemencias_ISSAACS.pdf' },
  ],
};

/* ---------- GPCOG (registro) ---------- */

const numeroEnRango = (x, a, b) => x !== '' && x != null && Number.isFinite(Number(x)) && Number(x) >= a && Number(x) <= b;
const SUG_COG = [SUG.descartarDelirium, 'Correlacionar con la funcionalidad (Lawton-Brody) y completar la evaluación cognitiva (MoCA o MMSE).', SUG.causasReversibles];
const BG = {
  sin: { id: 'sin', rango: 'Paciente 9, o 5 a 8 con informante 4 a 6', etiqueta: 'Sin deterioro cognitivo según el GPCOG', nivel: 'bien', texto: 'Puntaje de 9 en la parte de la persona, o de 5 a 8 con un informante sin datos de declive (4 a 6).', sugerencias: [] },
  con: { id: 'con', rango: 'Paciente 0 a 4, o 5 a 8 con informante 0 a 3', etiqueta: 'Deterioro cognitivo probable', nivel: 'moderado', hallazgo: true, texto: 'Puntaje de 0 a 4 en la parte de la persona, o de 5 a 8 con un informante que refiere declive (0 a 3). Requiere evaluación diagnóstica.', sugerencias: SUG_COG },
};

export const gpcog = {
  id: 'gpcog',
  nombre: 'Evaluación cognitiva del médico general (GPCOG)',
  corto: 'GPCOG',
  dominio: 'cognitivo',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['General Practitioner Assessment of Cognition', 'GPCOG', 'informante', 'atención primaria'],
  problemas: ['deterioro cognitivo', 'demencia', 'queja de memoria'],
  descripcion: 'Registro de los puntajes obtenidos con la hoja oficial: parte de la persona (0 a 9) y, si hace falta, del informante (0 a 6).',
  objetivo: 'Tamizaje de deterioro cognitivo en atención primaria, combinando pruebas a la persona con la información de un informante.',
  poblacion: 'Personas mayores en atención primaria (Brodaty et al., 2002). Hay versión oficial en español gratuita para uso individual no comercial en gpcog.com.au.',
  aplicacion: [
    'Aplica la parte de la persona con la hoja oficial y registra el total (0 a 9).',
    'Si obtiene de 5 a 8, entrevista a un informante con la hoja oficial y registra su total (0 a 6).',
    'Puedes guardar tu copia de la hoja oficial en «Tu hoja oficial».',
  ],
  tiempo: '4 a 6 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor desempeño en la prueba',
  textoEmpeoramiento: 'peor desempeño en la prueba',
  barra: false,
  min: 0,
  max: 9,
  campos: [
    { id: 'paciente', tipo: 'numero', texto: 'Parte de la persona: total (0 a 9)', unidad: 'puntos', min: 0, max: 9, entero: true },
    { id: 'informante', tipo: 'numero', texto: 'Entrevista al informante: total (0 a 6)', unidad: 'puntos', min: 0, max: 6, entero: true, visibleSi: (r) => numeroEnRango(r.paciente, 5, 8), ayuda: 'Solo si la parte de la persona fue de 5 a 8.' },
  ],
  bandas: [BG.sin, BG.con],
  calcular({ v }) {
    const p = v.paciente;
    const lineas = [];
    let banda;
    if (p === 9) { banda = BG.sin; lineas.push('Parte de la persona 9/9: sin deterioro; no hace falta el informante.'); }
    else if (p <= 4) { banda = BG.con; lineas.push(`Parte de la persona ${p}/9: deterioro probable; no hace falta el informante.`); }
    else {
      banda = v.informante <= 3 ? BG.con : BG.sin;
      lineas.push(`Parte de la persona ${p}/9 (zona intermedia) e informante ${v.informante}/6: ${v.informante <= 3 ? 'refiere declive' : 'sin datos de declive'}.`);
    }
    return { puntaje: p, max: 9, banda, lineas, lineasNota: lineas, extras: { informante: p >= 5 && p <= 8 ? v.informante : null } };
  },
  resumen: (res) => `GPCOG: persona ${res.puntaje}/9${res.extras.informante != null ? `, informante ${res.extras.informante}/6` : ''} (${minus(res.banda.etiqueta)}).`,
  resumenBreve: (res) => `GPCOG ${res.puntaje}/9${res.extras.informante != null ? ` + informante ${res.extras.informante}/6` : ''}`,
  detalleEnResumen: true,
  notas: [
    'Algoritmo oficial: 9 sin deterioro; 0 a 4 deterioro probable; 5 a 8 requiere al informante, en quien 0 a 3 indica deterioro.',
    'Es un tamizaje: no establece el diagnóstico ni la causa.',
  ],
  licencia: { texto: 'GPCOG © University of New South Wales. Hoja oficial gratuita para uso individual no comercial en gpcog.com.au. Huella no reproduce los reactivos: registra los totales y aplica el algoritmo publicado.', enlace: 'https://gpcog.com.au' },
  referencias: [
    { texto: 'Brodaty H, Pond D, Kemp NM, et al. The GPCOG: a new screening test for dementia designed for general practice. J Am Geriatr Soc. 2002;50(3):530-4.', doi: '10.1046/j.1532-5415.2002.50122.x' },
  ],
};

/* ---------- GOHAI (registro) ---------- */

export const gohai = {
  id: 'gohai',
  nombre: 'Índice de salud oral geriátrico (GOHAI)',
  corto: 'GOHAI',
  dominio: 'sensorial',
  tipo: 'evaluacion',
  registro: true,
  aliases: ['Geriatric Oral Health Assessment Index', 'salud bucal', 'calidad de vida oral', 'autopercepción oral'],
  problemas: ['salud bucal', 'prótesis dental', 'masticación', 'calidad de vida'],
  descripcion: 'Registro del total de los 12 reactivos (12 a 60): autopercepción de la salud bucal y su efecto en la vida diaria.',
  objetivo: 'Medir cómo percibe la persona su salud bucal (función física, dolor o incomodidad y aspectos psicosociales).',
  poblacion: 'Personas mayores (Atchison y Dolan, 1990); versión en español validada en personas mayores mexicanas (Sánchez-García, 2010).',
  aplicacion: [
    'Aplica los 12 reactivos con una versión en español validada; cada uno va de 1 a 5.',
    'Al sumar, invierte los reactivos redactados en positivo según indique la versión que uses, para que un total mayor signifique mejor salud bucal.',
    'Registra el total (12 a 60).',
  ],
  tiempo: '5 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor autopercepción de la salud bucal',
  textoEmpeoramiento: 'peor autopercepción de la salud bucal',
  min: 12,
  max: 60,
  campos: [{ id: 'puntaje', tipo: 'numero', texto: 'Puntaje total (12 a 60)', unidad: 'puntos', min: 12, max: 60, entero: true }],
  bandas: [
    { min: 12, max: 50, etiqueta: 'Autopercepción baja de la salud bucal', nivel: 'moderado', hallazgo: true, texto: '50 o menos.', sugerencias: ['Revisión odontológica: caries, enfermedad periodontal, ajuste de prótesis y dolor.', 'Valorar el efecto en la alimentación y el estado nutricional (MNA-SF).'] },
    { min: 51, max: 56, etiqueta: 'Autopercepción moderada de la salud bucal', nivel: 'leve', hallazgo: true, texto: '51 a 56.', sugerencias: ['Revisión odontológica y de prótesis.'] },
    { min: 57, max: 60, etiqueta: 'Autopercepción alta de la salud bucal', nivel: 'bien', texto: '57 a 60.', sugerencias: [] },
  ],
  calcular: ({ v }) => ({ puntaje: v.puntaje }),
  notas: [
    'Categorías de Atchison y Dolan (1990) usadas en estudios mexicanos: 57 a 60 alta, 51 a 56 moderada y 50 o menos baja.',
    'Otros autores (Pinzón y Zunzunegui, 1999) usan 57 o menos como necesidad percibida de atención dental.',
    'Mide autopercepción: no sustituye la exploración bucal (p. ej., OHAT).',
  ],
  licencia: { texto: 'GOHAI de Atchison y Dolan (1990). Huella solo registra el total; aplica una versión en español validada.' },
  referencias: [
    { texto: 'Atchison KA, Dolan TA. Development of the Geriatric Oral Health Assessment Index. J Dent Educ. 1990;54(11):680-7.' },
    { texto: 'Sánchez-García S, Heredia-Ponce E, Juárez-Cedillo T, et al. Psychometric properties of the General Oral Health Assessment Index (GOHAI) and dental status of an elderly Mexican population. J Public Health Dent. 2010;70(4):300-7.' },
    { texto: 'Esquivel Hernández RI, Jiménez Férez J. Necesidades de atención odontológica en adultos mayores mexicanos, según el índice GOHAI. Rev ADM. 2010;67(3):127-32.', enlace: 'https://www.medigraphic.com/pdfs/adm/od-2010/od103f.pdf' },
  ],
};

/* ---------- MOS de apoyo social ---------- */

const FRECUENCIA = [
  { texto: 'Nunca', valor: 1 },
  { texto: 'Pocas veces', valor: 2 },
  { texto: 'Algunas veces', valor: 3 },
  { texto: 'La mayoría de las veces', valor: 4 },
  { texto: 'Siempre', valor: 5 },
];
const REACTIVOS_MOS = [
  ['r2', 'Alguien que le ayude cuando tenga que estar en cama'],
  ['r3', 'Alguien con quien pueda contar cuando necesite hablar'],
  ['r4', 'Alguien que le aconseje cuando tenga problemas'],
  ['r5', 'Alguien que le lleve al médico cuando lo necesite'],
  ['r6', 'Alguien que le muestre amor y afecto'],
  ['r7', 'Alguien con quien pasar un buen rato'],
  ['r8', 'Alguien que le informe y le ayude a entender una situación'],
  ['r9', 'Alguien en quien confiar o con quien hablar de sí mismo y de sus preocupaciones'],
  ['r10', 'Alguien que le abrace'],
  ['r11', 'Alguien con quien pueda relajarse'],
  ['r12', 'Alguien que le prepare la comida si no puede hacerlo'],
  ['r13', 'Alguien cuyo consejo realmente desee'],
  ['r14', 'Alguien con quien hacer cosas que le ayuden a olvidar sus problemas'],
  ['r15', 'Alguien que le ayude en las tareas domésticas si está enfermo'],
  ['r16', 'Alguien con quien compartir sus temores y problemas más íntimos'],
  ['r17', 'Alguien que le aconseje cómo resolver sus problemas personales'],
  ['r18', 'Alguien con quien divertirse'],
  ['r19', 'Alguien que comprenda sus problemas'],
  ['r20', 'Alguien a quien amar y que le haga sentirse querido'],
];
const SUBESCALAS_MOS = [
  { id: 'emocional', nombre: 'Emocional e informativo', reactivos: ['r3', 'r4', 'r8', 'r9', 'r13', 'r16', 'r17', 'r19'], corte: 24 },
  { id: 'instrumental', nombre: 'Instrumental', reactivos: ['r2', 'r5', 'r12', 'r15'], corte: 12 },
  { id: 'interaccion', nombre: 'Interacción social positiva', reactivos: ['r7', 'r11', 'r14', 'r18'], corte: 12 },
  { id: 'afectivo', nombre: 'Afectivo', reactivos: ['r6', 'r10', 'r20'], corte: 9 },
];

export const mos = {
  id: 'mos',
  nombre: 'Cuestionario MOS de apoyo social',
  corto: 'MOS apoyo social',
  dominio: 'social',
  tipo: 'evaluacion',
  aliases: ['Medical Outcomes Study', 'MOS-SSS', 'apoyo social percibido', 'red de apoyo', 'Sherbourne'],
  problemas: ['apoyo social', 'aislamiento', 'cuidador', 'red de apoyo'],
  descripcion: 'Apoyo social percibido en 19 reactivos (19 a 95), con subescalas emocional e informativa, instrumental, de interacción social positiva y afectiva.',
  objetivo: 'Conocer qué tipos de apoyo tiene disponibles la persona y cuáles le faltan para planear el cuidado.',
  poblacion: 'Adultos con enfermedades crónicas (Sherbourne y Stewart, 1991); validado en atención primaria en España (De la Revilla, 2005) y usado en México.',
  aplicacion: [
    'Explica: «A veces necesitamos a otras personas para tener compañía, ayuda u otro tipo de apoyo. ¿Con qué frecuencia dispone de cada tipo de apoyo cuando lo necesita?».',
    'Lee cada reactivo y anota la respuesta de la persona.',
    'El número de personas cercanas describe la red, pero no suma.',
  ],
  tiempo: '5 a 10 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'más apoyo social percibido',
  textoEmpeoramiento: 'menos apoyo social percibido',
  min: 19,
  max: 95,
  campos: [
    { id: 'red', tipo: 'numero', texto: '¿Cuántos amigos íntimos o familiares cercanos tiene? (personas con quienes se siente a gusto y puede hablar de lo que le pasa)', unidad: 'personas', min: 0, max: 100, entero: true, opcional: true },
    ...REACTIVOS_MOS.map(([id, texto], i) => ({ id, texto, textoCorto: minus(texto), opciones: FRECUENCIA, ...(i === 0 ? { grupo: '¿Con qué frecuencia dispone de cada tipo de apoyo cuando lo necesita?' } : {}) })),
  ],
  bandas: [
    { min: 19, max: 56, etiqueta: 'Apoyo social percibido escaso', nivel: 'moderado', hallazgo: true, texto: 'Índice global menor de 57.', sugerencias: ['Identificar los tipos de apoyo que faltan y los recursos familiares y comunitarios disponibles.', SUG.cuidador, 'Valorar la situación sociofamiliar (escala de Gijón) y el aislamiento (LSNS-6).'] },
    { min: 57, max: 95, etiqueta: 'Apoyo social percibido adecuado', nivel: 'bien', texto: 'Índice global de 57 o más. Revisa las subescalas: puede faltar un tipo de apoyo concreto.', sugerencias: [] },
  ],
  calcular({ v }) {
    const sub = Object.fromEntries(SUBESCALAS_MOS.map((s) => [s.id, s.reactivos.reduce((t, id) => t + v[id].valor, 0)]));
    const puntaje = REACTIVOS_MOS.reduce((t, [id]) => t + v[id].valor, 0);
    const lineas = [`${SUBESCALAS_MOS.map((s) => `${s.nombre} ${sub[s.id]}/${s.reactivos.length * 5}`).join(' · ')}.`];
    const escasos = SUBESCALAS_MOS.filter((s) => sub[s.id] < s.corte).map((s) => minus(s.nombre));
    if (escasos.length) lineas.push(`Apoyo escaso en: ${escasos.join(', ')}.`);
    if (Number.isFinite(v.red)) lineas.push(`Red: ${v.red} ${v.red === 1 ? 'persona cercana' : 'personas cercanas'}.`);
    return { puntaje, lineas, lineasNota: lineas, extras: { subescalas: sub, red: Number.isFinite(v.red) ? v.red : null } };
  },
  resumen: (res) => `MOS de apoyo social: ${res.puntaje}/95 (${minus(res.banda.etiqueta)}); emocional ${res.extras.subescalas.emocional}/40, instrumental ${res.extras.subescalas.instrumental}/20, interacción ${res.extras.subescalas.interaccion}/20, afectivo ${res.extras.subescalas.afectivo}/15.`,
  resumenBreve: (res) => `MOS apoyo social ${res.puntaje}/95 (${minus(res.banda.etiqueta)})`,
  detalleEnResumen: true,
  notas: [
    'Puntos de corte de la validación española (De la Revilla, 2005): índice global menor de 57; emocional menor de 24; instrumental menor de 12; interacción social positiva menor de 12; afectivo menor de 9.',
    'Mide apoyo percibido, no el apoyo real ni la calidad de las relaciones.',
  ],
  licencia: { texto: 'MOS Social Support Survey © RAND: uso no comercial libre, sin costo ni permiso, citando la fuente; traducirlo no requiere permiso. Traducción propia de Huella.', enlace: 'https://www.rand.org/health-care/surveys_tools/mos/social-support.html' },
  referencias: [
    { texto: 'Sherbourne CD, Stewart AL. The MOS social support survey. Soc Sci Med. 1991;32(6):705-14.', doi: '10.1016/0277-9536(91)90150-b' },
    { texto: 'De la Revilla Ahumada L, Luna del Castillo J, Bailón Muñoz E, Medina Moruno I. Validación del cuestionario MOS de apoyo social en Atención Primaria. Medicina de Familia (Andalucía). 2005;6:10-8.' },
  ],
};

/* ---------- Caprini ---------- */

const F1 = [
  ['cirugia_menor', 'Cirugía menor programada'],
  ['cirugia_mes', 'Cirugía mayor en el último mes'],
  ['varices', 'Venas varicosas'],
  ['eii', 'Antecedente de enfermedad inflamatoria intestinal'],
  ['edema', 'Edema actual de las piernas'],
  ['obesidad', 'Obesidad (IMC mayor de 25)'],
  ['iam', 'Infarto agudo de miocardio'],
  ['icc', 'Insuficiencia cardiaca en el último mes'],
  ['sepsis', 'Sepsis en el último mes'],
  ['pulmonar', 'Enfermedad pulmonar grave, incluida neumonía, en el último mes'],
  ['epoc', 'Función pulmonar anormal (EPOC)'],
  ['reposo', 'Paciente médico en reposo en cama'],
  ['hormonas', 'Anticonceptivos orales o terapia hormonal de reemplazo'],
  ['embarazo', 'Embarazo o puerperio en el último mes'],
  ['obstetrico', 'Antecedente obstétrico de riesgo (muerte fetal inexplicada, 3 o más abortos, parto prematuro con toxemia o restricción del crecimiento)'],
  ['otros', 'Otros factores de riesgo'],
];
const F2 = [
  ['mayor45', 'Cirugía mayor de más de 45 minutos'],
  ['laparo45', 'Cirugía laparoscópica de más de 45 minutos'],
  ['artroscopica', 'Cirugía artroscópica'],
  ['cancer', 'Cáncer actual o previo'],
  ['cama72', 'Reposo en cama de más de 72 horas'],
  ['yeso', 'Inmovilización con yeso en el último mes'],
  ['cvc', 'Catéter venoso central'],
];
const F3 = [
  ['tvp', 'Antecedente de trombosis venosa profunda o tromboembolia pulmonar'],
  ['familiar', 'Antecedente familiar de trombosis'],
  ['leiden', 'Factor V de Leiden positivo'],
  ['protrombina', 'Mutación 20210A de la protrombina'],
  ['lupico', 'Anticoagulante lúpico positivo'],
  ['cardiolipina', 'Anticuerpos anticardiolipina elevados'],
  ['homocisteina', 'Homocisteína sérica elevada'],
  ['tih', 'Trombocitopenia inducida por heparina'],
  ['trombofilia', 'Otra trombofilia congénita o adquirida'],
];
const F5 = [
  ['ictus', 'Ictus en el último mes'],
  ['artroplastia', 'Artroplastia mayor electiva de miembro inferior'],
  ['fractura', 'Fractura de cadera, pelvis o pierna en el último mes'],
  ['trauma', 'Politraumatismo en el último mes'],
  ['medular', 'Lesión aguda de la médula espinal (parálisis) en el último mes'],
];
const lista = (pares) => pares.map(([id, texto]) => ({ id, texto }));
const puntosEdadCaprini = (edad) => (edad >= 75 ? 3 : edad >= 61 ? 2 : edad >= 41 ? 1 : 0);
const NOTA_SANGRADO = 'Antes de indicar profilaxis farmacológica valora el riesgo de sangrado, la función renal y la anestesia neuroaxial. Huella no indica fármacos ni dosis.';

export const caprini = {
  id: 'caprini',
  nombre: 'Modelo de riesgo de tromboembolia venosa de Caprini',
  corto: 'Caprini',
  dominio: 'prequirurgica',
  tipo: 'pronostico',
  aliases: ['tromboembolia venosa', 'TEV', 'trombosis', 'tromboprofilaxis', 'riesgo trombótico quirúrgico'],
  problemas: ['tromboembolia venosa', 'cirugía', 'tromboprofilaxis', 'inmovilidad'],
  descripcion: 'Factores de riesgo de tromboembolia venosa con 1, 2, 3 o 5 puntos: riesgo muy bajo, bajo, moderado o alto en cirugía.',
  objetivo: 'Estimar el riesgo de tromboembolia venosa en pacientes quirúrgicos para decidir la tromboprofilaxis.',
  poblacion: 'Pacientes quirúrgicos (Caprini, 2005); categorías de riesgo de la guía del ACCP para cirugía general y abdominopélvica (Gould, 2012).',
  aplicacion: [
    'Registra la edad y marca cada factor presente con la información clínica disponible.',
    'Si no hay factores en una lista, marca «Ninguno» para confirmarlo.',
    'Desde los 75 años la edad suma 3 puntos: toda persona de esa edad tiene al menos riesgo moderado.',
  ],
  tiempo: '3 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor riesgo trombótico',
  textoEmpeoramiento: 'mayor riesgo trombótico',
  barra: false,
  min: 0,
  max: 99,
  campos: [
    { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad', ayuda: '41 a 60 años: 1 punto; 61 a 74: 2; 75 o más: 3.' },
    { id: 'f1', tipo: 'checklist', texto: 'Factores de 1 punto', textoCorto: 'factores de 1 punto', opciones: lista(F1) },
    { id: 'f2', tipo: 'checklist', texto: 'Factores de 2 puntos', textoCorto: 'factores de 2 puntos', opciones: lista(F2) },
    { id: 'f3', tipo: 'checklist', texto: 'Factores de 3 puntos', textoCorto: 'factores de 3 puntos', opciones: lista(F3) },
    { id: 'f5', tipo: 'checklist', texto: 'Factores de 5 puntos', textoCorto: 'factores de 5 puntos', opciones: lista(F5) },
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'Riesgo muy bajo de tromboembolia venosa', nivel: 'bien', texto: '0 puntos (riesgo estimado menor de 0.5 % en la guía del ACCP).', sugerencias: ['Deambulación temprana.'] },
    { min: 1, max: 2, etiqueta: 'Riesgo bajo de tromboembolia venosa', nivel: 'leve', texto: '1 a 2 puntos (alrededor de 1.5 %).', sugerencias: ['Profilaxis mecánica, de preferencia compresión neumática intermitente, además de la deambulación temprana.'] },
    { min: 3, max: 4, etiqueta: 'Riesgo moderado de tromboembolia venosa', nivel: 'moderado', hallazgo: true, texto: '3 a 4 puntos (alrededor de 3 %).', sugerencias: ['Profilaxis farmacológica si el riesgo de sangrado no es alto; si lo es, profilaxis mecánica.', NOTA_SANGRADO] },
    { min: 5, max: 99, etiqueta: 'Riesgo alto de tromboembolia venosa', nivel: 'grave', hallazgo: true, texto: '5 puntos o más (alrededor de 6 %).', sugerencias: ['Profilaxis farmacológica más mecánica si el riesgo de sangrado lo permite; considerar profilaxis extendida (4 semanas) tras cirugía abdominal o pélvica por cáncer.', NOTA_SANGRADO] },
  ],
  calcular({ v }) {
    const edad = puntosEdadCaprini(v.edad);
    const grupos = [[F1, v.f1, 1], [F2, v.f2, 2], [F3, v.f3, 3], [F5, v.f5, 5]];
    let puntaje = edad;
    const marcados = [];
    for (const [pares, ids, pts] of grupos) {
      for (const [id, texto] of pares) if (ids.includes(id)) { puntaje += pts; marcados.push(`${minus(texto.split(" (")[0])} (${pts})`); }
    }
    const lineas = [`Edad ${v.edad} años (${edad}).`, marcados.length ? `Factores: ${marcados.join('; ')}.` : 'Sin otros factores.'];
    return { puntaje, lineas, lineasNota: lineas, extras: { edad, factores: marcados.length } };
  },
  notas: [
    'Puntos y factores según la versión de 2005 publicada en la guía de la AHRQ (apéndice B.10). Existen otras versiones con puntajes distintos; no se mezclan.',
    'Categorías y profilaxis sugerida: guía del ACCP para cirugía general y abdominopélvica no ortopédica (Gould, 2012). En cirugía ortopédica mayor la profilaxis se decide por el tipo de cirugía.',
    NOTA_SANGRADO,
  ],
  licencia: { texto: 'Modelo publicado por Caprini (2005) y difundido por la AHRQ (apéndice B.10 de su guía de prevención de tromboembolia venosa). Redacción propia.', enlace: 'https://www.ahrq.gov/es/patient-safety/settings/hospital/vtguide/appb2.html' },
  referencias: [
    { texto: 'Caprini JA. Thrombosis risk assessment as a guide to quality patient care. Dis Mon. 2005;51(2-3):70-8.', doi: '10.1016/j.disamonth.2005.02.003' },
    { texto: 'Gould MK, Garcia DA, Wren SM, et al. Prevention of VTE in nonorthopedic surgical patients: antithrombotic therapy and prevention of thrombosis, 9th ed: American College of Chest Physicians evidence-based clinical practice guidelines. Chest. 2012;141(2 Suppl):e227S-e277S.', doi: '10.1378/chest.11-2297' },
    { texto: 'Agency for Healthcare Research and Quality. Preventing hospital-acquired venous thromboembolism. Appendix B.10: Caprini individualized point-based model.', enlace: 'https://www.ahrq.gov/es/patient-safety/settings/hospital/vtguide/appb2.html' },
  ],
};

/* ---------- LACE ---------- */

export const lace = {
  id: 'lace',
  nombre: 'Índice LACE de reingreso o muerte tras el alta',
  corto: 'LACE',
  dominio: 'comorbilidad',
  tipo: 'pronostico',
  aliases: ['reingreso', 'readmisión', 'alta hospitalaria', 'van Walraven'],
  problemas: ['reingreso hospitalario', 'alta hospitalaria', 'transición de cuidados'],
  descripcion: 'Días de estancia, ingreso urgente, Charlson y visitas a urgencias en 6 meses: riesgo de muerte o reingreso no programado a 30 días (0 a 19).',
  objetivo: 'Identificar al alta a quienes tienen más riesgo de reingreso o muerte, para reforzar la transición de cuidados.',
  poblacion: 'Adultos dados de alta de hospitales de Ontario (van Walraven, 2010). En personas mayores su capacidad predictiva fue limitada (Cotter, 2012).',
  aplicacion: [
    'Usa los datos de la hospitalización actual y del expediente.',
    'El índice de Charlson puede tomarse del que ya registraste en Huella.',
  ],
  tiempo: '2 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor riesgo de reingreso',
  textoEmpeoramiento: 'mayor riesgo de reingreso',
  min: 0,
  max: 19,
  vinculos: [
    {
      id: 'charlson', escala: 'charlson', titulo: 'Charlson',
      disponible: (res) => (Number.isFinite(res.puntaje) ? true : 'El Charlson guardado no tiene puntaje.'),
      describir: (res) => `Charlson ${res.puntaje}`,
      aplicar: (res) => ({ charlson: Math.min(res.puntaje, 4) }),
      campos: ['charlson'],
    },
  ],
  campos: [
    {
      id: 'estancia', texto: 'Días de estancia (L)', textoCorto: 'estancia',
      opciones: [{ texto: 'Menos de 1 día', valor: 0 }, { texto: '1 día', valor: 1 }, { texto: '2 días', valor: 2 }, { texto: '3 días', valor: 3 }, { texto: '4 a 6 días', valor: 4 }, { texto: '7 a 13 días', valor: 5 }, { texto: '14 días o más', valor: 7 }],
    },
    { id: 'agudeza', texto: 'Tipo de ingreso (A)', textoCorto: 'tipo de ingreso', opciones: [{ texto: 'Urgente o no programado', valor: 3 }, { texto: 'Programado', valor: 0 }] },
    { id: 'charlson', texto: 'Índice de Charlson (C)', textoCorto: 'Charlson', opciones: [{ texto: '0', valor: 0 }, { texto: '1', valor: 1 }, { texto: '2', valor: 2 }, { texto: '3', valor: 3 }, { texto: '4 o más', valor: 5 }] },
    { id: 'urgencias', texto: 'Visitas a urgencias en los 6 meses previos (E)', textoCorto: 'visitas a urgencias', opciones: [{ texto: 'Ninguna', valor: 0 }, { texto: '1', valor: 1 }, { texto: '2', valor: 2 }, { texto: '3', valor: 3 }, { texto: '4 o más', valor: 4 }] },
  ],
  bandas: [
    { min: 0, max: 4, etiqueta: 'Riesgo bajo de reingreso o muerte', nivel: 'bien', texto: '0 a 4 puntos.', sugerencias: [] },
    { min: 5, max: 9, etiqueta: 'Riesgo moderado de reingreso o muerte', nivel: 'leve', hallazgo: true, texto: '5 a 9 puntos.', sugerencias: ['Plan de alta con conciliación de medicamentos y cita de seguimiento temprana.'] },
    { min: 10, max: 19, etiqueta: 'Riesgo alto de reingreso o muerte', nivel: 'moderado', hallazgo: true, texto: '10 puntos o más: punto de corte de alto riesgo usado con más frecuencia.', sugerencias: ['Reforzar la transición de cuidados: conciliación de medicamentos, educación al paciente y al cuidador, contacto a las 48 a 72 h y cita en los primeros 7 días.'] },
  ],
  notas: [
    'Puntos de van Walraven et al. (2010): estancia menos de 1 día 0, 1 día 1, 2 días 2, 3 días 3, 4 a 6 días 4, 7 a 13 días 5, 14 o más 7; ingreso urgente 3; Charlson 0 a 3 igual a su valor y 4 o más 5; urgencias 1 punto por visita hasta 4.',
    'En personas mayores su discriminación fue pobre (Cotter, 2012): úsalo como apoyo, junto con la funcionalidad, la cognición y el apoyo social.',
  ],
  licencia: { texto: 'Índice publicado por van Walraven et al. (2010) en CMAJ; sin titular de licencias identificado.' },
  referencias: [
    { texto: 'van Walraven C, Dhalla IA, Bell C, et al. Derivation and validation of an index to predict early death or unplanned readmission after discharge from hospital to the community. CMAJ. 2010;182(6):551-7.', doi: '10.1503/cmaj.091117' },
    { texto: 'Cotter PE, Bhalla VK, Wallis SJ, Biram RW. Predicting readmissions: poor performance of the LACE index in an older UK population. Age Ageing. 2012;41(6):784-9.' },
  ],
};

/* ---------- G8 (registro) ---------- */

export const g8 = {
  id: 'g8',
  nombre: 'Cuestionario G8 de tamizaje geriátrico en oncología',
  corto: 'G8',
  dominio: 'fragilidad',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['G-8', 'oncogeriatría', 'cáncer', 'vulnerabilidad', 'Bellera'],
  problemas: ['cáncer', 'fragilidad', 'vulnerabilidad', 'quimioterapia'],
  descripcion: 'Registro del total obtenido con el cuestionario oficial (0 a 17): 14 o menos indica hacer una valoración geriátrica integral.',
  objetivo: 'Identificar a las personas mayores con cáncer que se benefician de una valoración geriátrica integral antes del tratamiento.',
  poblacion: 'Personas de 70 años o más con cáncer (Bellera et al., 2012).',
  aplicacion: [
    'Aplica los 8 reactivos con la versión oficial (7 derivados del MNA más la edad). Huella solo registra el total.',
    'Puedes guardar tu copia del cuestionario en «Tu hoja oficial».',
  ],
  tiempo: '5 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'menos vulnerabilidad',
  textoEmpeoramiento: 'más vulnerabilidad',
  min: 0,
  max: 17,
  campos: [{ id: 'puntaje', tipo: 'numero', texto: 'Puntaje total (0 a 17)', unidad: 'puntos', min: 0, max: 17, decimales: 1, ayuda: 'Admite medios puntos (la autopercepción de salud puede valer 0.5).' }],
  bandas: [
    { min: 0, max: 14, etiqueta: 'Vulnerable: indicada la valoración geriátrica integral', nivel: 'moderado', hallazgo: true, texto: '14 o menos (sensibilidad mayor de 85 %, especificidad cercana a 65 %).', sugerencias: ['Valoración geriátrica integral antes de decidir el tratamiento oncológico: funcionalidad, cognición, nutrición, ánimo, comorbilidad, polifarmacia y apoyo social.'] },
    { min: 14.5, max: 17, etiqueta: 'Sin vulnerabilidad según el G8', nivel: 'bien', texto: 'Más de 14: puede seguirse el tratamiento planeado con vigilancia de la funcionalidad.', sugerencias: [] },
  ],
  calcular: ({ v }) => ({ puntaje: v.puntaje }),
  notas: [
    'Punto de corte de Bellera et al. (2012): 14 o menos es anormal.',
    'Es un tamizaje: un resultado normal no excluye problemas geriátricos si hay sospecha clínica.',
  ],
  licencia: { texto: 'G8 publicado por Bellera et al. (2012); incluye reactivos derivados del MNA® (Nestlé). Huella no reproduce los reactivos: solo registra el total.' },
  referencias: [
    { texto: 'Bellera CA, Rainfray M, Mathoulin-Pélissier S, et al. Screening older cancer patients: first evaluation of the G-8 geriatric screening tool. Ann Oncol. 2012;23(8):2166-72.', doi: '10.1093/annonc/mdr587' },
  ],
};

/* ---------- ESAS-r ---------- */

const SINTOMAS = [
  ['dolor', 'Dolor'],
  ['cansancio', 'Cansancio (falta de energía)'],
  ['somnolencia', 'Somnolencia (sentirse adormilado)'],
  ['nauseas', 'Náuseas'],
  ['apetito', 'Falta de apetito'],
  ['disnea', 'Falta de aire'],
  ['depresion', 'Depresión (sentirse triste)'],
  ['ansiedad', 'Ansiedad (sentirse nervioso)'],
  ['bienestar', 'Bienestar (cómo se siente en general; 10 es el peor)'],
];
const BE = {
  sin: { id: 'sin', rango: 'Todos en 0', etiqueta: 'Sin síntomas', nivel: 'bien', texto: 'Todos los síntomas en 0.', sugerencias: [] },
  leve: { id: 'leve', rango: 'Máximo 1 a 3', etiqueta: 'Síntomas leves', nivel: 'leve', texto: 'El síntoma más intenso está entre 1 y 3.', sugerencias: [] },
  moderado: { id: 'moderado', rango: 'Máximo 4 a 6', etiqueta: 'Al menos un síntoma moderado', nivel: 'moderado', hallazgo: true, texto: 'El síntoma más intenso está entre 4 y 6.', sugerencias: ['Explorar y tratar los síntomas moderados; reevaluar con la misma escala.'] },
  intenso: { id: 'intenso', rango: 'Máximo 7 a 10', etiqueta: 'Al menos un síntoma intenso', nivel: 'grave', hallazgo: true, texto: 'Algún síntoma en 7 o más.', sugerencias: ['Atender con prioridad los síntomas intensos y reevaluar pronto; considerar el apoyo del equipo de cuidados paliativos.'] },
};

export const esasr = {
  id: 'esasr',
  nombre: 'Sistema de evaluación de síntomas de Edmonton, revisado (ESAS-r)',
  corto: 'ESAS-r',
  dominio: 'paliativos',
  tipo: 'evaluacion',
  aliases: ['ESAS', 'Edmonton', 'síntomas', 'carga de síntomas', 'escala de síntomas'],
  problemas: ['síntomas', 'dolor', 'cuidados paliativos', 'enfermedad avanzada'],
  descripcion: 'Intensidad de 9 síntomas de 0 a 10 en este momento; suma total de 0 a 90.',
  objetivo: 'Medir y seguir la intensidad de los síntomas frecuentes en la enfermedad avanzada.',
  poblacion: 'Personas en cuidados paliativos o con enfermedad avanzada (Bruera, 1991; versión revisada de Watanabe, 2011).',
  aplicacion: [
    'Pregunta por cómo se siente ahora, en este momento: 0 es ausencia del síntoma y 10 el peor posible.',
    'De preferencia la responde la persona; si no puede, con ayuda de un familiar o del equipo, y anótalo.',
    'Úsala de forma repetida: el valor útil es la tendencia de cada síntoma.',
  ],
  tiempo: '2 a 5 min',
  momentos: true,
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor carga de síntomas',
  textoEmpeoramiento: 'mayor carga de síntomas',
  barra: false,
  min: 0,
  max: 90,
  campos: [
    ...SINTOMAS.map(([id, texto]) => ({ id, tipo: 'numero', texto, unidad: 'de 10', min: 0, max: 10, entero: true })),
    { id: 'otro', tipo: 'numero', texto: 'Otro problema (opcional)', unidad: 'de 10', min: 0, max: 10, entero: true, opcional: true },
    { id: 'quien', texto: '¿Quién la contestó?', textoCorto: 'quién la contestó', puntua: false, opciones: [{ texto: 'La persona', valor: 0 }, { texto: 'La persona con ayuda', valor: 1 }, { texto: 'Un familiar o cuidador', valor: 2 }, { texto: 'El equipo de salud', valor: 3 }] },
  ],
  bandas: [BE.sin, BE.leve, BE.moderado, BE.intenso],
  calcular({ v }) {
    const vals = SINTOMAS.map(([id, texto]) => [texto.split(' (')[0], v[id]]);
    const puntaje = vals.reduce((t, [, x]) => t + x, 0);
    const maximo = Math.max(...vals.map(([, x]) => x), Number.isFinite(v.otro) ? v.otro : 0);
    const banda = maximo >= 7 ? BE.intenso : maximo >= 4 ? BE.moderado : maximo >= 1 ? BE.leve : BE.sin;
    const lista = (a, b) => vals.filter(([, x]) => x >= a && x <= b).map(([t, x]) => `${minus(t)} ${x}`);
    const lineas = [`Suma total de síntomas: ${puntaje}/90.`];
    if (lista(7, 10).length) lineas.push(`Intensos (7 a 10): ${lista(7, 10).join(', ')}.`);
    if (lista(4, 6).length) lineas.push(`Moderados (4 a 6): ${lista(4, 6).join(', ')}.`);
    if (Number.isFinite(v.otro)) lineas.push(`Otro problema: ${v.otro}.`);
    if (v.quien.valor > 0) lineas.push(`Contestada por: ${minus(v.quien.texto)}.`);
    return { puntaje, max: 90, banda, lineas, lineasNota: lineas, extras: { maximo } };
  },
  resumen: (res) => `ESAS-r: suma ${res.puntaje}/90; ${minus(res.banda.etiqueta)}.`,
  resumenBreve: (res) => `ESAS-r ${res.puntaje}/90 (${minus(res.banda.etiqueta)})`,
  notas: [
    'Intensidad por síntoma de uso frecuente: 1 a 3 leve, 4 a 6 moderada y 7 a 10 intensa.',
    'La suma total resume la carga de síntomas, pero cada síntoma debe revisarse por separado.',
    'En la versión revisada, la pregunta se refiere a «ahora» y cada síntoma lleva una definición breve.',
  ],
  licencia: { texto: 'ESAS-r: de dominio público y de uso libre citando la fuente (Alberta Health Services y Covenant Health). Su forma y nombre no deben modificarse sin consentimiento de los autores; se pide llenar un formulario de solicitud para registrar su uso.', enlace: 'https://www.albertahealthservices.ca/info/page14546.aspx' },
  referencias: [
    { texto: 'Bruera E, Kuehn N, Miller MJ, Selmser P, Macmillan K. The Edmonton Symptom Assessment System (ESAS): a simple method for the assessment of palliative care patients. J Palliat Care. 1991;7(2):6-9.' },
    { texto: 'Watanabe SM, Nekolaichuk C, Beaumont C, Johnson L, Myers J, Strasser F. A multicenter study comparing two numerical versions of the Edmonton Symptom Assessment System in palliative care patients. J Pain Symptom Manage. 2011;41(2):456-68.', doi: '10.1016/j.jpainsymman.2010.04.020' },
    { texto: 'Alberta Health Services. Guidelines for using the revised Edmonton Symptom Assessment System (ESAS-r).', enlace: 'https://albertahealthservices.ca/assets/info/peolc/if-peolc-ed-esasr-admin-manual.pdf' },
  ],
};

/* ---------- SPICT y NECPAL (registro) ---------- */

const SUG_PALIATIVO = [
  'Revisar con la persona y su familia los objetivos de atención y lo que más le importa; iniciar la planificación anticipada.',
  'Valorar síntomas (ESAS-r), funcionalidad (PPS) y necesidades del cuidador (Zarit).',
  'Revisar la medicación según los objetivos de cuidado y considerar el apoyo del equipo de cuidados paliativos.',
];
const ENFERMEDADES = [
  { id: 'cancer', texto: 'Cáncer' },
  { id: 'demencia', texto: 'Demencia o fragilidad' },
  { id: 'neurologica', texto: 'Enfermedad neurológica' },
  { id: 'cardiaca', texto: 'Enfermedad cardiaca o vascular' },
  { id: 'respiratoria', texto: 'Enfermedad respiratoria' },
  { id: 'renal', texto: 'Enfermedad renal' },
  { id: 'hepatica', texto: 'Enfermedad hepática' },
  { id: 'otra', texto: 'Otra condición que limita la vida' },
];

export const spict = {
  id: 'spict',
  nombre: 'Herramienta de indicadores de cuidados paliativos y de soporte (SPICT™)',
  corto: 'SPICT',
  dominio: 'paliativos',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['SPICT-ES', 'Supportive and Palliative Care Indicators Tool', 'necesidades paliativas', 'identificación paliativa'],
  problemas: ['cuidados paliativos', 'enfermedad avanzada', 'planificación anticipada', 'deterioro de la salud'],
  descripcion: 'Registro del resultado obtenido con la hoja oficial: identifica a personas con salud en deterioro que podrían beneficiarse de cuidados paliativos.',
  objetivo: 'Identificar a quienes conviene revisar objetivos de atención y necesidades de cuidados paliativos y de soporte.',
  poblacion: 'Personas con una o varias condiciones crónicas avanzadas, en cualquier ámbito (equipo SPICT, Universidad de Edimburgo).',
  aplicacion: [
    'Aplica la hoja oficial (descarga gratuita en spict.org.uk, también en español): indicadores generales de deterioro e indicadores clínicos de enfermedades avanzadas.',
    'Registra si la persona cumple los criterios de la hoja y, si quieres, las condiciones presentes. Huella no reproduce los indicadores.',
    'Puedes guardar tu copia de la hoja en «Tu hoja oficial».',
  ],
  tiempo: '5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  min: 0,
  max: 1,
  campos: [
    { id: 'resultado', texto: 'Resultado con la hoja oficial', textoCorto: 'resultado', opciones: [{ texto: 'Identifica probables necesidades de cuidados paliativos', valor: 1 }, { texto: 'No cumple los criterios', valor: 0 }] },
    { id: 'condiciones', tipo: 'checklist', texto: 'Condiciones avanzadas presentes', textoCorto: 'condiciones', opcional: true, opciones: ENFERMEDADES, ayuda: 'Opcional, para el resumen.' },
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'Sin criterios SPICT', nivel: 'bien', texto: 'No cumple los criterios de la hoja oficial. Reevalúa si la salud se deteriora.', sugerencias: [] },
    { min: 1, max: 1, etiqueta: 'Probables necesidades de cuidados paliativos', nivel: 'moderado', hallazgo: true, texto: 'Cumple los criterios de la hoja oficial: revisa objetivos de atención y necesidades. No significa que la persona esté al final de la vida.', sugerencias: SUG_PALIATIVO },
  ],
  calcular({ v }) {
    const conds = ENFERMEDADES.filter((e) => (v.condiciones || []).includes(e.id)).map((e) => minus(e.texto));
    const lineas = conds.length ? [`Condiciones avanzadas: ${conds.join(', ')}.`] : [];
    return { valor: v.resultado.valor, mostrar: v.resultado.valor ? 'Positivo' : 'Negativo', sufijo: 'SPICT', unidad: '', lineas, lineasNota: lineas };
  },
  resumen: (res) => `SPICT: ${res.mostrar.toLowerCase()} (${minus(res.banda.etiqueta)}).`,
  resumenBreve: (res) => `SPICT ${res.mostrar.toLowerCase()}`,
  notas: [
    'El SPICT ayuda a identificar; no estima la supervivencia ni sustituye la valoración clínica.',
    'La hoja oficial se descarga gratis, pero no puede reproducirse en otro formato sin permiso del equipo SPICT; por eso Huella solo registra el resultado.',
  ],
  licencia: { texto: 'SPICT™ © University of Edinburgh. Descarga gratuita en spict.org.uk; no se reproduce en otro formato sin permiso. Huella solo registra el resultado.', enlace: 'https://www.spict.org.uk' },
  referencias: [
    { texto: 'Highet G, Crawford D, Murray SA, Boyd K. Development and evaluation of the Supportive and Palliative Care Indicators Tool (SPICT): a mixed-methods study. BMJ Support Palliat Care. 2014;4(3):285-90.', doi: '10.1136/bmjspcare-2013-000488' },
  ],
};

export const necpal = {
  id: 'necpal',
  nombre: 'Instrumento NECPAL CCOMS-ICO©',
  corto: 'NECPAL',
  dominio: 'paliativos',
  tipo: 'tamizaje',
  registro: true,
  aliases: ['NECPAL', 'pregunta sorpresa', 'necesidades paliativas', 'ICO', 'enfermedad crónica avanzada'],
  problemas: ['cuidados paliativos', 'enfermedad crónica avanzada', 'pronóstico', 'planificación anticipada'],
  descripcion: 'Registro del resultado obtenido con el instrumento oficial: pregunta sorpresa y al menos un criterio adicional.',
  objetivo: 'Identificar a personas con enfermedades crónicas avanzadas que necesitan atención paliativa.',
  poblacion: 'Personas con enfermedades crónicas avanzadas en cualquier ámbito (Gómez-Batiste et al., 2013).',
  aplicacion: [
    'Responde la pregunta sorpresa: «¿Le sorprendería que esta persona muriera en los próximos 12 meses?».',
    'Si no le sorprendería, revisa los criterios adicionales con el instrumento oficial y registra si cumple al menos uno. Huella no reproduce los criterios.',
    'Puedes guardar tu copia del instrumento en «Tu hoja oficial».',
  ],
  tiempo: '5 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  min: 0,
  max: 1,
  campos: [
    { id: 'sorpresa', texto: '¿Le sorprendería que esta persona muriera en los próximos 12 meses?', textoCorto: 'pregunta sorpresa', puntua: false, opciones: [{ texto: 'No me sorprendería', valor: 1 }, { texto: 'Sí me sorprendería', valor: 0 }] },
    { id: 'criterios', texto: '¿Cumple al menos un criterio adicional del instrumento oficial?', textoCorto: 'criterios adicionales', puntua: false, visibleSi: (r) => r.sorpresa === 0, opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }] },
  ],
  bandas: [
    { min: 0, max: 0, etiqueta: 'NECPAL negativo', nivel: 'bien', texto: 'No cumple la combinación de pregunta sorpresa y criterio adicional. Reevalúa si cambia la evolución.', sugerencias: [] },
    { min: 1, max: 1, etiqueta: 'NECPAL positivo: necesidades de atención paliativa', nivel: 'moderado', hallazgo: true, texto: 'Pregunta sorpresa positiva y al menos un criterio adicional. Identifica necesidades; no implica dejar los tratamientos ni predice la muerte en un plazo concreto.', sugerencias: SUG_PALIATIVO },
  ],
  calcular({ v }) {
    const positivo = v.sorpresa.valor === 1 && v.criterios?.valor === 1 ? 1 : 0;
    const lineas = [v.sorpresa.valor === 1 ? `Pregunta sorpresa positiva; ${v.criterios.valor === 1 ? 'con' : 'sin'} criterios adicionales.` : 'Pregunta sorpresa negativa (sí le sorprendería).'];
    return { valor: positivo, mostrar: positivo ? 'Positivo' : 'Negativo', sufijo: 'NECPAL', unidad: '', lineas, lineasNota: lineas };
  },
  resumen: (res) => `NECPAL: ${res.mostrar.toLowerCase()}. ${res.lineas[0]}`,
  resumenBreve: (res) => `NECPAL ${res.mostrar.toLowerCase()}`,
  notas: [
    'NECPAL positivo identifica necesidades de atención paliativa; no es un criterio de pronóstico ni de exclusividad paliativa.',
    'Los criterios completos y las versiones vigentes se consultan en el instrumento oficial del ICO.',
  ],
  licencia: { texto: 'NECPAL CCOMS-ICO© (Institut Català d’Oncologia). Huella no reproduce los criterios: solo registra la pregunta sorpresa y el resultado.' },
  referencias: [
    { texto: 'Gómez-Batiste X, Martínez-Muñoz M, Blay C, et al. Identifying patients with chronic conditions in need of palliative care in the general population: development of the NECPAL tool and preliminary prevalence rates in Catalonia. BMJ Support Palliat Care. 2013;3(3):300-8.', doi: '10.1136/bmjspcare-2012-000211' },
  ],
};

/* ---------- Dosis equivalente de morfina oral (MME, CDC 2022) ---------- */

// Factores de conversión a miligramos equivalentes de morfina oral por día (CDC, 2022). Fentanilo: por mcg/h del parche.
const OPIOIDES = [
  { texto: 'Morfina oral', valor: 1, clave: 'morfina' },
  { texto: 'Oxicodona oral', valor: 1.5, clave: 'oxicodona' },
  { texto: 'Hidromorfona oral', valor: 5, clave: 'hidromorfona' },
  { texto: 'Tramadol oral', valor: 0.2, clave: 'tramadol' },
  { texto: 'Tapentadol oral', valor: 0.4, clave: 'tapentadol' },
  { texto: 'Codeína oral', valor: 0.15, clave: 'codeina' },
  { texto: 'Hidrocodona oral', valor: 1, clave: 'hidrocodona' },
  { texto: 'Oximorfona oral', valor: 3, clave: 'oximorfona' },
  { texto: 'Metadona oral', valor: 4.7, clave: 'metadona' },
  { texto: 'Fentanilo transdérmico (parche)', valor: 2.4, clave: 'fentanilo' },
];
const I_FENTANILO = OPIOIDES.findIndex((o) => o.clave === 'fentanilo');
const NINGUNO_MAS = { texto: 'Ninguno más', valor: 0, clave: 'ninguno' };
const elegido = (x) => x !== '' && x != null;
const opioide = (n) => {
  const extra = n > 1;
  const idx = (r) => (extra ? Number(r[`o${n}`]) - 1 : Number(r[`o${n}`]));
  const visible = (r) => {
    if (!elegido(r[`o${n}`])) return false;
    if (extra && Number(r[`o${n}`]) === 0) return false;
    return true;
  };
  const previoActivo = (r) => n === 1 || (n === 2 ? elegido(r.o1) : elegido(r.o2) && Number(r.o2) !== 0);
  return [
    { id: `o${n}`, texto: n === 1 ? 'Opioide' : `Opioide ${n} (opcional)`, textoCorto: `opioide ${n}`, puntua: false, opciones: extra ? [NINGUNO_MAS, ...OPIOIDES] : OPIOIDES, ...(n > 1 ? { visibleSi: previoActivo, opcional: true } : {}) },
    { id: `d${n}`, tipo: 'numero', texto: 'Dosis total en 24 horas', unidad: 'mg/día', min: 0.1, max: 5000, decimales: 2, visibleSi: (r) => visible(r) && previoActivo(r) && idx(r) !== I_FENTANILO },
    { id: `f${n}`, tipo: 'numero', texto: 'Parche de fentanilo', unidad: 'mcg/h', min: 1, max: 1000, decimales: 1, visibleSi: (r) => visible(r) && previoActivo(r) && idx(r) === I_FENTANILO },
  ];
};

export const mme = {
  id: 'mme',
  nombre: 'Dosis equivalente de morfina oral (MME/día)',
  corto: 'Equivalente de morfina',
  dominio: 'calculadoras',
  tipo: 'calculadora',
  aliases: ['MME', 'equianalgesia', 'equivalencia de opioides', 'morfina equivalente', 'carga de opioides', 'CDC 2022'],
  problemas: ['opioides', 'dolor', 'polifarmacia', 'riesgo de sobredosis'],
  descripcion: 'Suma la dosis diaria de hasta 3 opioides en miligramos equivalentes de morfina oral, con los factores de los CDC (2022).',
  objetivo: 'Conocer la carga total de opioides para valorar riesgos y documentarla. No sirve para calcular la dosis al cambiar de opioide.',
  poblacion: 'Adultos con dolor tratados con opioides (CDC, 2022). Los umbrales de riesgo no aplican al dolor por cáncer, cuidados paliativos ni final de la vida.',
  aplicacion: [
    'Elige cada opioide y anota la dosis total de 24 horas (incluidos los rescates habituales). En el fentanilo transdérmico anota los mcg/h del parche.',
    'Solo vía oral y fentanilo transdérmico. La buprenorfina no tiene factor en la guía de los CDC.',
  ],
  tiempo: '1 min',
  momentos: true,
  direccionClinica: 'sin_direccion',
  unidadCambio: 'MME/día',
  decimalesCambio: 0,
  barra: false,
  campos: [...opioide(1), ...opioide(2), ...opioide(3)],
  bandas: [
    { id: 'menos50', min: 0, max: 49.99, rango: '<50', etiqueta: 'Menos de 50 MME/día', nivel: 'bien', texto: 'Carga de opioides menor de 50 MME/día.', sugerencias: [] },
    { id: 'de50', min: 50, max: 89.99, rango: '50 a <90', etiqueta: 'De 50 a 89 MME/día', nivel: 'moderado', hallazgo: true, texto: 'A partir de 50 MME/día el beneficio adicional suele ser escaso y el riesgo aumenta (CDC, 2022).', sugerencias: ['Revalorar el beneficio en dolor y función; considerar naloxona y evitar benzodiacepinas y otros depresores.'] },
    { id: 'de90', min: 90, max: Infinity, rango: '≥90', etiqueta: '90 MME/día o más', nivel: 'grave', hallazgo: true, texto: 'Carga alta de opioides: mayor riesgo de sobredosis y efectos adversos.', sugerencias: ['Revalorar el beneficio y los riesgos; ofrecer naloxona; considerar reducción gradual si el beneficio no lo justifica.'] },
  ],
  calcular({ v }) {
    const filas = [];
    let total = 0;
    for (const n of [1, 2, 3]) {
      const o = v[`o${n}`];
      if (!o || o.clave === 'ninguno') continue;
      const fent = o.clave === 'fentanilo';
      const dosis = fent ? v[`f${n}`] : v[`d${n}`];
      if (!Number.isFinite(dosis)) continue;
      const eq = dosis * o.valor;
      total += eq;
      filas.push([o.texto, `${dosis} ${fent ? 'mcg/h' : 'mg/día'}`, `× ${o.valor}`, `${Math.round(eq * 10) / 10} MME`]);
    }
    const lineas = ['No uses este valor para calcular la dosis de otro opioide: la tolerancia cruzada es incompleta. Al rotar, sigue una guía de rotación y la ficha técnica; suele reducirse la dosis calculada.'];
    if (filas.some((f) => f[0].startsWith('Metadona'))) lineas.push('Metadona: su equivalencia no es lineal y aumenta con la dosis; el factor único de 4.7 solo estima la carga total.');
    if (filas.some((f) => f[0].startsWith('Fentanilo'))) lineas.push('Fentanilo transdérmico: el factor se aplica a los mcg/h del parche.');
    const id = total >= 90 ? 'de90' : total >= 50 ? 'de50' : 'menos50';
    return {
      valor: total,
      unidad: 'MME/día',
      mostrar: String(Math.round(total)),
      sufijo: 'MME/día',
      banda: mme.bandas.find((b) => b.id === id),
      lineas,
      lineasNota: lineas.slice(1),
      detalles: [{ titulo: 'Equivalencia por opioide', encabezados: ['Opioide', 'Dosis', 'Factor', 'Equivalente'], filas }],
      extras: { opioides: filas.length },
    };
  },
  resumen: (res) => `Dosis equivalente de morfina oral: ${res.mostrar} MME/día (factores CDC 2022).`,
  resumenBreve: (res) => `${res.mostrar} MME/día`,
  detalleEnResumen: true,
  notas: [
    'Factores de los CDC (2022): codeína 0.15, tramadol 0.2, tapentadol 0.4, morfina 1, hidrocodona 1, oxicodona 1.5, oximorfona 3, metadona 4.7, hidromorfona 5 y fentanilo transdérmico 2.4 por mcg/h.',
    'Los CDC advierten que estos factores no deben usarse para convertir de un opioide a otro.',
    'Los umbrales de 50 y 90 MME/día no son límites rígidos y no aplican al dolor por cáncer, a cuidados paliativos ni al final de la vida.',
    'En personas mayores, con función renal o hepática disminuida o con fragilidad, inicia y ajusta con dosis más bajas.',
  ],
  licencia: { texto: 'Factores de conversión de la guía de los CDC (2022), de dominio público.' },
  referencias: [
    { texto: 'Dowell D, Ragan KR, Jones CM, Baldwin GT, Chou R. CDC clinical practice guideline for prescribing opioids for pain — United States, 2022. MMWR Recomm Rep. 2022;71(3):1-95.', doi: '10.15585/mmwr.rr7103a1' },
  ],
};
