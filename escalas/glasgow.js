// Escala de coma de Glasgow (GCS), con la terminología de Teasdale et al. (2014) y, opcionalmente, la puntuación
// GCS-Pupilas (Brennan, 2018). Descripciones redactadas en español para Huella. Versión 2.15.0.
import { SUG } from './_comun.js';

const NT = { texto: 'No valorable', valor: null, especial: true, clave: 'nt' };

const OCULAR = [
  { texto: 'Espontánea', valor: 4, detalle: 'Tiene los ojos abiertos antes de que le hables o lo toques.' },
  { texto: 'Al sonido', valor: 3, detalle: 'Los abre al hablarle o al llamarlo en voz alta (no hace falta pedírselo).' },
  { texto: 'A la presión', valor: 2, detalle: 'Los abre solo con presión en la punta de un dedo (10 s).' },
  { texto: 'Ninguna', valor: 1, detalle: 'No los abre con ningún estímulo, sin un factor que lo impida.' },
  { ...NT, detalle: 'Algo impide abrirlos: edema, hematoma o vendaje en los párpados.' },
];
const VERBAL = [
  { texto: 'Orientada', valor: 5, detalle: 'Dice correctamente su nombre, dónde está y el mes o el año.' },
  { texto: 'Confusa', valor: 4, detalle: 'Conversa con frases, pero no está orientada.' },
  { texto: 'Palabras', valor: 3, detalle: 'Solo palabras sueltas que se entienden.' },
  { texto: 'Sonidos', valor: 2, detalle: 'Solo quejidos o gemidos, sin palabras.' },
  { texto: 'Ninguna', valor: 1, detalle: 'No emite sonidos, sin un factor que lo impida.' },
  { ...NT, detalle: 'Algo impide hablar: intubación, traqueostomía o lesión de la boca. Una afasia previa también se anota aquí.' },
];
const MOTORA = [
  { texto: 'Obedece órdenes', valor: 6, detalle: 'Hace una orden de dos pasos (p. ej., apretar y soltar la mano, sacar la lengua).' },
  { texto: 'Localiza', valor: 5, detalle: 'Lleva la mano por encima de la clavícula hacia la presión en la cabeza o el cuello.' },
  { texto: 'Flexión normal', valor: 4, detalle: 'Dobla el codo con rapidez ante la presión, sin postura anormal.' },
  { texto: 'Flexión anormal', valor: 3, detalle: 'Dobla el codo lento y rígido, con postura anormal (decorticación).' },
  { texto: 'Extensión', valor: 2, detalle: 'Extiende el codo (descerebración).' },
  { texto: 'Ninguna', valor: 1, detalle: 'Ningún movimiento de brazos ni piernas, sin un factor que lo impida.' },
  { ...NT, detalle: 'Algo impide moverse: parálisis, lesión medular o relajantes musculares.' },
];
const PUPILAS = [
  { texto: 'No evaluadas', valor: null, especial: true, clave: 'sin', detalle: 'Sin GCS-Pupilas.' },
  { texto: 'Ambas reaccionan a la luz', valor: 0 },
  { texto: 'Una no reacciona', valor: 1 },
  { texto: 'Ninguna reacciona', valor: 2 },
];

const COMPONENTES = [
  { id: 'ocular', letra: 'E', nombre: 'apertura ocular' },
  { id: 'verbal', letra: 'V', nombre: 'respuesta verbal' },
  { id: 'motora', letra: 'M', nombre: 'respuesta motora' },
];

const NO_CALCULABLE = {
  id: 'nt', rango: 'Con NT', etiqueta: 'Total no calculable', nivel: 'neutro',
  texto: 'Un componente no se pudo valorar: se describe por componentes (E, V y M) y no se calcula el total.',
  sugerencias: ['Anota el motivo del componente no valorable y repite la valoración en cuanto sea posible.'],
};

export default {
  id: 'glasgow',
  nombre: 'Escala de coma de Glasgow (GCS)',
  corto: 'Glasgow (GCS)',
  dominio: 'delirium',
  tipo: 'evaluacion',
  aliases: ['Glasgow', 'GCS', 'escala de coma', 'coma', 'nivel de conciencia', 'estado de alerta', 'estupor', 'GCS-P', 'pupilas', 'TCE', 'traumatismo craneoencefálico', 'EVC'],
  problemas: ['alteración del nivel de conciencia', 'coma', 'traumatismo craneoencefálico', 'deterioro neurológico'],
  descripcion: 'Nivel de conciencia por 3 componentes: apertura ocular (1 a 4), respuesta verbal (1 a 5) y motora (1 a 6); total de 3 a 15.',
  objetivo: 'Describir y vigilar el nivel de conciencia con un lenguaje común, sobre todo tras un traumatismo craneoencefálico o un evento neurológico agudo.',
  poblacion: 'Personas con alteración aguda del nivel de conciencia de cualquier causa (Teasdale y Jennett, 1974).',
  aplicacion: [
    'Busca factores que impidan valorar algún componente (sedación, intubación, edema de párpados, parálisis, sordera, idioma) y anótalos.',
    'Observa antes de estimular. Luego háblale en voz normal y después en voz alta. Si no responde, aplica presión 10 s en la punta de un dedo, en el trapecio o en la escotadura supraorbitaria.',
    'Registra la mejor respuesta de cada componente; en la motora, la del mejor brazo.',
    'Comunica los componentes (por ejemplo, E3 V4 M6), no solo el total.',
  ],
  tiempo: '1 a 2 min',
  momentos: true,
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor nivel de conciencia',
  textoEmpeoramiento: 'peor nivel de conciencia',
  unidadCambio: ['punto', 'puntos'],
  min: 3,
  max: 15,
  siguientes: [
    { id: 'rass', si: (res) => res.valor != null && res.valor >= 13, motivo: 'Nivel de agitación o sedación; en UCI es el paso previo del CAM-ICU.' },
    { id: '4at', si: (res) => res.valor != null && res.valor >= 13 && res.valor < 15, motivo: 'Una alteración leve de la conciencia puede ser delirium.' },
  ],
  campos: [
    { id: 'ocular', texto: 'Apertura ocular (E)', textoCorto: 'apertura ocular', puntua: false, opciones: OCULAR },
    { id: 'verbal', texto: 'Respuesta verbal (V)', textoCorto: 'respuesta verbal', puntua: false, opciones: VERBAL },
    { id: 'motora', texto: 'Mejor respuesta motora (M)', textoCorto: 'respuesta motora', puntua: false, opciones: MOTORA, ayuda: 'Si los brazos responden distinto, registra la mejor respuesta.' },
    {
      id: 'pupilas', texto: 'Pupilas que no reaccionan a la luz (opcional, para GCS-Pupilas)', textoCorto: 'reactividad pupilar', puntua: false, opciones: PUPILAS,
      ayuda: 'GCS-Pupilas = total de Glasgow menos las pupilas que no reaccionan (Brennan, 2018). Úsalo en traumatismo craneoencefálico.',
    },
  ],
  bandas: [
    { min: 15, max: 15, etiqueta: 'Conciencia normal', nivel: 'bien', texto: 'Total de 15: sin alteración del nivel de conciencia en esta escala.', sugerencias: [] },
    {
      min: 13, max: 14, etiqueta: 'Alteración leve', nivel: 'leve', hallazgo: true,
      texto: 'Total de 13 a 14. En traumatismo craneoencefálico, 13 a 15 se considera leve.',
      sugerencias: ['Buscar la causa (delirium, hipoglucemia, hipoxia, fármacos, infección, lesión intracraneal) y repetir la valoración.', 'Valorar delirium (4AT o CAM).'],
    },
    {
      min: 9, max: 12, etiqueta: 'Alteración moderada', nivel: 'grave', hallazgo: true,
      texto: 'Total de 9 a 12. En traumatismo craneoencefálico, 9 a 12 se considera moderado.',
      sugerencias: ['Valoración médica urgente de la causa y vigilancia neurológica estrecha.', SUG.revisionFarmacos],
    },
    {
      min: 3, max: 8, etiqueta: 'Alteración grave (coma)', nivel: 'critico', hallazgo: true,
      texto: 'Total de 3 a 8: suele considerarse coma. En traumatismo craneoencefálico, 3 a 8 se considera grave.',
      sugerencias: ['Atención de urgencia: valorar la protección de la vía aérea y buscar la causa de inmediato, según los objetivos de atención.'],
    },
    NO_CALCULABLE,
  ],
  calcular({ v }) {
    const comps = COMPONENTES.map((c) => ({ ...c, valor: v[c.id]?.valor ?? null }));
    const etiqueta = comps.map((c) => `${c.letra}${c.valor ?? 'NT'}`).join(' ');
    const noValorables = comps.filter((c) => c.valor == null);
    const lineas = [`Componentes: ${etiqueta}.`];
    const prs = v.pupilas?.valor ?? null;
    if (noValorables.length) {
      lineas.push(`No valorable: ${noValorables.map((c) => c.nombre).join(' y ')} (NT). No se calcula el total.`);
      return { valor: null, mostrar: etiqueta, sufijo: 'sin total', unidad: '', banda: NO_CALCULABLE, lineas, extras: { componentes: etiqueta, total: null, gcsp: null } };
    }
    const total = comps.reduce((s, c) => s + c.valor, 0);
    const gcsp = prs == null ? null : total - prs;
    if (gcsp != null) {
      const motivo = prs === 0 ? 'ambas pupilas reaccionan' : prs === 1 ? `${total} menos 1: una pupila no reacciona` : `${total} menos 2: ninguna pupila reacciona`;
      lineas.push(`GCS-Pupilas: ${gcsp} (${motivo}).`);
    }
    return { valor: total, mostrar: String(total), sufijo: `/ 15 · ${etiqueta}`, unidad: '', lineas, extras: { componentes: etiqueta, total, gcsp } };
  },
  resumen: (res) => (res.valor == null
    ? `Glasgow ${res.extras.componentes}: total no calculable (componente no valorable).`
    : `Glasgow ${res.valor}/15 (${res.extras.componentes}; ${res.banda.etiqueta.toLowerCase()})${res.extras.gcsp != null ? `; GCS-Pupilas ${res.extras.gcsp}` : ''}.`),
  resumenBreve: (res) => (res.valor == null
    ? `Glasgow ${res.extras.componentes} (total no calculable)`
    : `Glasgow ${res.valor} (${res.extras.componentes})${res.extras.gcsp != null ? `, GCS-P ${res.extras.gcsp}` : ''}`),
  detalleEnResumen: true,
  notas: [
    'Comunica los tres componentes (p. ej., E2 V3 M5): describen mejor a la persona que el total, que se reserva para grupos y para clasificar la gravedad (Teasdale, 2014).',
    'Si un componente no se puede valorar (NT), no se calcula el total; no se asigna 1 a lo que no se puede explorar.',
    'Clasificación de la gravedad del traumatismo craneoencefálico por el total: 13 a 15 leve, 9 a 12 moderado y 3 a 8 grave.',
    'En personas mayores, para una misma lesión intracraneal el Glasgow inicial suele ser más alto que en jóvenes (Kehoe, 2016): un total normal o casi normal no descarta una lesión grave tras una caída.',
    'Un Glasgow de 15 no descarta delirium; el deterioro cognitivo previo, la sordera, la afasia o el idioma pueden bajar la respuesta verbal.',
  ],
  licencia: { texto: 'Escala de coma de Glasgow © Universidad de Glasgow; GCS-Pupilas © Sir Graham Teasdale. Gratuitas para la atención clínica y la investigación, sin licencia, reconociendo su autoría. Descripciones en español redactadas para Huella.', enlace: 'https://glasgowcomascale.org/permissions' },
  referencias: [
    { texto: 'Teasdale G, Jennett B. Assessment of coma and impaired consciousness. A practical scale. Lancet. 1974;2(7872):81-4.', doi: '10.1016/s0140-6736(74)91639-0' },
    { texto: 'Teasdale G, Maas A, Lecky F, Manley G, Stocchetti N, Murray G. The Glasgow Coma Scale at 40 years: standing the test of time. Lancet Neurol. 2014;13(8):844-54.', doi: '10.1016/S1474-4422(14)70120-6' },
    { texto: 'Brennan PM, Murray GD, Teasdale GM. Simplifying the use of prognostic information in traumatic brain injury. Part 1: The GCS-Pupils score: an extended index of clinical severity. J Neurosurg. 2018;128(6):1612-20.', doi: '10.3171/2017.12.JNS172780' },
    { texto: 'Kehoe A, Smith JE, Bouamra O, Edwards A, Yates D, Lecky F. Older patients with traumatic brain injury present with a higher GCS score than younger patients for a given severity of injury. Emerg Med J. 2016;33(6):381-5.', doi: '10.1136/emermed-2015-205180' },
  ],
};
