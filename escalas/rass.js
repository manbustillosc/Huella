// Richmond Agitation-Sedation Scale (RASS). Descriptores redactados para Huella a partir de la publicación original.
export const NIVELES_RASS = [
  { valor: 4, nombre: 'Combativo', desc: 'Violento; peligro inmediato para el personal.', nivel: 'critico' },
  { valor: 3, nombre: 'Muy agitado', desc: 'Se retira o jala sondas, tubos o catéteres; agresivo.', nivel: 'grave' },
  { valor: 2, nombre: 'Agitado', desc: 'Movimientos frecuentes sin propósito; lucha contra el ventilador.', nivel: 'moderado' },
  { valor: 1, nombre: 'Inquieto', desc: 'Ansioso, con movimientos que no son agresivos ni vigorosos.', nivel: 'leve' },
  { valor: 0, nombre: 'Alerta y tranquilo', desc: 'Despierto, sin agitación.', nivel: 'bien' },
  { valor: -1, nombre: 'Somnoliento', desc: 'No del todo alerta; con la voz se mantiene despierto, con apertura ocular y contacto visual de más de 10 s.', nivel: 'leve' },
  { valor: -2, nombre: 'Sedación ligera', desc: 'Con la voz despierta brevemente, con contacto visual de menos de 10 s.', nivel: 'moderado' },
  { valor: -3, nombre: 'Sedación moderada', desc: 'Con la voz se mueve o abre los ojos, pero sin contacto visual.', nivel: 'grave' },
  { valor: -4, nombre: 'Sedación profunda', desc: 'No responde a la voz; se mueve o abre los ojos con estímulo físico.', nivel: 'critico' },
  { valor: -5, nombre: 'No despertable', desc: 'No responde a la voz ni al estímulo físico.', nivel: 'critico' },
];

// «+2», «0», «−3» (signo menos tipográfico).
export const signoRass = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
export const OPCIONES_RASS = NIVELES_RASS.map((x) => ({ texto: `${signoRass(x.valor)} · ${x.nombre}`, valor: x.valor, detalle: x.desc }));

const bandaRass = (x) => ({
  min: x.valor,
  max: x.valor,
  rango: signoRass(x.valor),
  etiqueta: x.nombre,
  nivel: x.nivel,
  hallazgo: x.valor !== 0,
  texto: `${x.desc}${x.valor <= -4 ? ' En este nivel no puede evaluarse el delirium con CAM-ICU: reevaluar cuando la RASS sea −3 o mayor.' : ''}`,
  sugerencias: x.valor > 0
    ? ['Buscar causas de agitación (dolor, hipoxia, retención urinaria, abstinencia, delirium) y valorar delirium con CAM-ICU si está en UCI.', 'Comparar con la meta de sedación indicada por el equipo tratante.']
    : x.valor < 0
      ? ['Comparar con la meta de sedación indicada por el equipo tratante y revisar sedantes y analgésicos.', ...(x.valor >= -3 ? ['Si está en UCI, valorar delirium con CAM-ICU.'] : [])]
      : [],
});

export default {
  id: 'rass',
  nombre: 'Escala de agitación y sedación de Richmond (RASS)',
  corto: 'RASS',
  dominio: 'delirium',
  tipo: 'evaluacion',
  aliases: ['Richmond', 'sedacion', 'agitacion', 'nivel de conciencia', 'UCI', 'terapia intensiva'],
  problemas: ['sedación', 'agitación', 'cuidados intensivos', 'ventilación mecánica', 'delirium'],
  descripcion: 'Nivel de agitación o sedación en 10 niveles, de +4 (combativo) a −5 (no despertable).',
  objetivo: 'Describir el nivel de alerta, agitación o sedación; es el paso previo obligatorio del CAM-ICU.',
  poblacion: 'Adultos en cuidados intensivos, con o sin ventilación mecánica o sedación (Sessler, 2002); también se usa en hospitalización general.',
  aplicacion: [
    'Observa a la persona unos 30 segundos sin estimularla. Si está alerta, inquieta o agitada, puntúa de 0 a +4.',
    'Si no está alerta, llámala por su nombre y pídele que abra los ojos y te mire; puntúa −1 a −3 según la duración del contacto visual.',
    'Si no responde a la voz, estimúlala físicamente (sacudir el hombro o presión esternal) y puntúa −4 o −5.',
  ],
  tiempo: '1 min',
  momentos: true,
  direccionClinica: 'sin_direccion',
  unidadCambio: ['nivel', 'niveles'],
  barra: false,
  min: -5,
  max: 4,
  siguientes: [
    { id: 'camicu', si: (res) => !res.noEvaluable && res.valor >= -3, motivo: 'Si está en UCI: identifica delirium usando esta RASS, siempre que corresponda al mismo momento.' },
  ],
  campos: [
    { id: 'nivel', texto: 'Nivel observado', textoCorto: 'nivel', puntua: false, opciones: OPCIONES_RASS },
  ],
  bandas: NIVELES_RASS.map(bandaRass),
  calcular({ v }) {
    const n = v.nivel.valor;
    return { valor: n, mostrar: signoRass(n), sufijo: 'RASS', unidad: '', extras: { rass: n } };
  },
  resumen: (res) => `RASS ${res.mostrar} (${res.banda.etiqueta.toLowerCase()}).`,
  resumenBreve: (res) => `RASS ${res.mostrar} (${res.banda.etiqueta.toLowerCase()})`,
  detalleEnResumen: true,
  notas: [
    'Describe el nivel de alerta en un momento; cambia en minutos, así que registra la fecha y repítela cuando cambie el estado o la sedación.',
    'La meta de sedación la define el equipo tratante: un valor negativo no es por sí mismo un error si coincide con la meta.',
    'No diagnostica delirium. Con RASS −3 a +4 puede aplicarse el CAM-ICU; con −4 o −5 el delirium no es evaluable.',
    'Descriptores redactados para Huella a partir de la publicación original; consulta la escala completa en la publicación.',
  ],
  referencias: [
    { texto: 'Sessler CN, Gosnell MS, Grap MJ, et al. The Richmond Agitation-Sedation Scale: validity and reliability in adult intensive care unit patients. Am J Respir Crit Care Med. 2002;166(10):1338-44.', doi: '10.1164/rccm.2107138' },
    { texto: 'Ely EW, Truman B, Shintani A, et al. Monitoring sedation status over time in ICU patients: reliability and validity of the Richmond Agitation-Sedation Scale (RASS). JAMA. 2003;289(22):2983-91.', doi: '10.1001/jama.289.22.2983' },
  ],
};
