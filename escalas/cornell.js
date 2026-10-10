// Escala de Cornell para la depresión en la demencia: registro por secciones (Huella no reproduce los reactivos).
import { SUG } from './_comun.js';

const SECCIONES = [
  { id: 'sA', letra: 'A', texto: 'Síntomas relacionados con el ánimo', items: 4 },
  { id: 'sB', letra: 'B', texto: 'Alteraciones de la conducta', items: 4 },
  { id: 'sC', letra: 'C', texto: 'Signos físicos', items: 3 },
  { id: 'sD', letra: 'D', texto: 'Funciones cíclicas', items: 4 },
  { id: 'sE', letra: 'E', texto: 'Alteraciones ideatorias', items: 4 },
];
const TOTAL_ITEMS = 19;

const SUG_POSITIVO = [
  'Confirmar el diagnóstico con entrevista clínica (criterios DSM-5-TR) y distinguirlo de apatía, delirium y dolor.',
  'Buscar factores contribuyentes: dolor, fármacos, enfermedad médica, cambios en el entorno o en el cuidado.',
  'Si se inicia tratamiento, repetir la escala para seguir la respuesta.',
];

const BANDAS = [
  { min: 0, max: 5, etiqueta: 'Sin síntomas depresivos significativos', nivel: 'bien', texto: 'Puntaje menor de 6: en general sin síntomas depresivos significativos.', sugerencias: [] },
  {
    min: 6, max: 10, etiqueta: 'Síntomas depresivos por debajo del punto de corte', nivel: 'leve',
    texto: 'Hay síntomas depresivos, sin alcanzar el puntaje que los autores asocian con depresión mayor probable (más de 10).',
    sugerencias: ['Vigilar la evolución y repetir la escala; buscar dolor, fármacos o cambios en el entorno.'],
  },
  {
    min: 11, max: 18, etiqueta: 'Probable depresión mayor', nivel: 'grave', hallazgo: true,
    texto: 'Puntaje mayor de 10: los autores lo asocian con depresión mayor probable. El diagnóstico requiere evaluación clínica.',
    sugerencias: SUG_POSITIVO,
  },
  {
    min: 19, max: 38, etiqueta: 'Rango de depresión mayor definida', nivel: 'critico', hallazgo: true,
    texto: 'Puntaje mayor de 18: rango que los autores asocian con depresión mayor definida. El diagnóstico sigue siendo clínico.',
    sugerencias: SUG_POSITIVO,
  },
];
const bandaDe = (n) => BANDAS.find((b) => n >= b.min && n <= b.max);

export default {
  id: 'cornell',
  nombre: 'Escala de Cornell para la depresión en la demencia',
  corto: 'Cornell',
  dominio: 'afectivo',
  tipo: 'evaluacion',
  registro: true,
  aliases: ['CSDD', 'Cornell Scale for Depression in Dementia', 'Alexopoulos', 'depresion en demencia'],
  problemas: ['depresión', 'demencia', 'apatía', 'trastornos de conducta', 'residencias'],
  descripcion: 'Registro de los subtotales de 5 secciones (19 reactivos de 0 a 2; total 0 a 38), con informante y paciente.',
  objetivo: 'Valorar síntomas depresivos en personas con demencia a partir de la entrevista con un informante y con el paciente.',
  poblacion: 'Personas con demencia, incluso moderada a grave (Alexopoulos, 1988); también se usó en personas sin demencia. Versión en español: Pujol et al. (2001).',
  aplicacion: [
    'Aplica la escala oficial: entrevista primero al informante (cuidador o personal) y después al paciente; la calificación final es tu impresión clínica.',
    'Califica la semana previa. Cada reactivo vale 0, 1 o 2; «a» significa no evaluable y no suma.',
    'Registra el subtotal de cada sección y cuántos reactivos fueron no evaluables. Huella no reproduce los reactivos.',
    'Antes de interpretar, descarta delirium y distingue la apatía (falta de motivación sin tristeza).',
  ],
  tiempo: '20 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'reducción de síntomas depresivos',
  textoEmpeoramiento: 'aumento de síntomas depresivos',
  min: 0,
  max: 38,
  campos: [
    {
      id: 'entrevista', texto: 'Entrevistas realizadas', textoCorto: 'entrevistas', puntua: false,
      opciones: [
        { texto: 'Informante y paciente', valor: 0, clave: 'ambos' },
        { texto: 'Solo informante', valor: 1, clave: 'informante', detalle: 'El paciente no pudo entrevistarse.' },
        { texto: 'Solo paciente', valor: 2, clave: 'paciente', detalle: 'Sin informante disponible.' },
      ],
    },
    ...SECCIONES.map((s) => ({
      id: s.id, tipo: 'numero', texto: `${s.letra}. ${s.texto} (${s.items} reactivos, 0 a ${s.items * 2})`, textoCorto: `sección ${s.letra}`,
      unidad: `de ${s.items * 2}`, min: 0, max: s.items * 2, entero: true,
    })),
    {
      id: 'na', tipo: 'numero', texto: 'Reactivos calificados «a» (no evaluables)', textoCorto: 'no evaluables',
      ayuda: 'Cuántos de los 19 reactivos no pudieron calificarse. Escribe 0 si se calificaron todos.',
      unidad: 'de 19', min: 0, max: TOTAL_ITEMS, entero: true,
    },
    {
      id: 'delirium', texto: '¿Se descartó delirium?', textoCorto: 'delirium descartado', puntua: false,
      opciones: [
        { texto: 'Sí', valor: 0, clave: 'si' },
        { texto: 'No: hay delirium o sospecha', valor: 1, clave: 'no' },
        { texto: 'No se valoró', valor: 2, clave: 'sin' },
      ],
    },
  ],
  validar({ v }) {
    if (v.na == null || SECCIONES.some((s) => v[s.id] == null)) return {};
    const total = SECCIONES.reduce((s, x) => s + v[x.id], 0);
    const posible = 2 * (TOTAL_ITEMS - v.na);
    return total > posible ? { na: `Con ${v.na} reactivos no evaluables, el total máximo posible es ${posible}; revisa los subtotales.` } : {};
  },
  bandas: BANDAS,
  calcular({ v }) {
    const puntaje = SECCIONES.reduce((s, x) => s + v[x.id], 0);
    const lineas = [`Secciones: ${SECCIONES.map((s) => `${s.letra} ${v[s.id]}/${s.items * 2}`).join(', ')}.`];
    const advertencias = [];
    if (v.na > 0) {
      const tope = puntaje + 2 * v.na;
      const otra = bandaDe(Math.min(tope, 38));
      advertencias.push(`${v.na} ${v.na === 1 ? 'reactivo no evaluable' : 'reactivos no evaluables'}: el total es un mínimo (podría llegar a ${Math.min(tope, 38)})${otra !== bandaDe(puntaje) ? ` y la categoría podría ser «${otra.etiqueta.toLowerCase()}»` : ''}.`);
    }
    if (v.entrevista.clave !== 'ambos') advertencias.push(`Solo se entrevistó ${v.entrevista.clave === 'informante' ? 'al informante' : 'al paciente'}; el método original combina ambas entrevistas.`);
    if (v.delirium.clave === 'no') advertencias.push('Con delirium presente o sospechado, los síntomas pueden deberse a él: no interpretes la escala hasta que se resuelva.');
    if (v.delirium.clave === 'sin') advertencias.push('No se valoró delirium: algunos síntomas pueden deberse a él.');
    return {
      puntaje,
      lineas: [...lineas, ...advertencias],
      lineasNota: [...lineas, ...advertencias],
      extras: { secciones: Object.fromEntries(SECCIONES.map((s) => [s.letra, v[s.id]])), noEvaluables: v.na, entrevista: v.entrevista.clave, delirium: v.delirium.clave },
    };
  },
  comparable(antes, despues) {
    const a = antes.extras?.noEvaluables ?? 0;
    const d = despues.extras?.noEvaluables ?? 0;
    return a !== d ? { advertencia: `El número de reactivos no evaluables cambió (${a} → ${d}): el cambio del total puede deberse a eso.` } : null;
  },
  detalleEnResumen: true,
  notas: [
    'Puntos de corte de las instrucciones de la escala: menos de 6, sin síntomas significativos; más de 10, depresión mayor probable; más de 18, depresión mayor definida. No sustituyen el diagnóstico clínico.',
    'Los reactivos «a» (no evaluables) no suman: con varios, el total subestima la intensidad.',
    'La apatía de la demencia (pérdida de iniciativa sin tristeza) puede elevar algunas secciones; el delirium puede producir síntomas similares. Distínguelos antes de concluir.',
    'Prefiérela a la GDS-15 o el PHQ-9 cuando el deterioro cognitivo impide que la persona responda de forma fiable.',
    'Los subtotales por sección solo describen el perfil; no tienen puntos de corte propios.',
  ],
  licencia: { texto: 'Cornell Scale for Depression in Dementia © George S. Alexopoulos. Huella registra solo subtotales; usa la escala oficial.' },
  referencias: [
    { texto: 'Alexopoulos GS, Abrams RC, Young RC, Shamoian CA. Cornell Scale for Depression in Dementia. Biol Psychiatry. 1988;23(3):271-84.', doi: '10.1016/0006-3223(88)90038-8' },
    { texto: 'Alexopoulos GS, Abrams RC, Young RC, Shamoian CA. Use of the Cornell scale in nondemented patients. J Am Geriatr Soc. 1988;36(3):230-6.', doi: '10.1111/j.1532-5415.1988.tb01806.x' },
    { texto: 'Pujol J, de Azpiazu P, Salamero M, et al. Depressive symptoms in dementia. The Cornell scale: validation of the Spanish version [en español]. Rev Neurol. 2001;33(4):397-8.' },
  ],
};
