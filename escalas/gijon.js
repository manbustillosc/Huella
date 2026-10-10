// Adaptación mexicana de la escala de Gijón de valoración sociofamiliar (guía del INGER, 2022; licencia Creative Commons
// para fines asistenciales sin ánimo de lucro, citando la fuente).
import { REF_INGER_2022, NOTA_INGER } from './_comun.js';

const area = (id, letra, nombre, textoCorto, opciones) => ({
  id, letra, nombre, texto: `${letra}. ${nombre}`, textoCorto,
  opciones: opciones.map((o, i) => (typeof o === 'string' ? { texto: o, valor: i + 1 } : { ...o, valor: i + 1 })),
});

const AREAS = [
  area('familiar', 'A', 'Situación familiar', 'situación familiar', [
    'Vive con familia sin dependencia física o psíquica',
    'Vive con cónyuge de similar edad',
    'Vive con familia o cónyuge y presenta algún grado de dependencia',
    'Vive solo y tiene hijos próximos',
    'Vive solo y carece de hijos o viven alejados',
  ]),
  area('economica', 'B', 'Situación económica', 'situación económica', [
    'Más de 8 veces el salario mínimo mensual',
    '1 a 8 veces el salario mínimo mensual',
    'Desde el salario mínimo mensual hasta la pensión mínima contributiva',
    { texto: 'Pensión no contributiva (programa de pensión para adultos mayores)', detalle: 'La guía del INGER (2022) tomó como referencia el monto de ese año; verifica el vigente.' },
    'Sin ingresos o inferiores al apartado anterior',
  ]),
  area('vivienda', 'C', 'Vivienda', 'vivienda', [
    'Adecuada a necesidades',
    { texto: 'Barreras arquitectónicas en la vivienda o portal de la casa', detalle: 'Escalones, puertas estrechas, baños…' },
    { texto: 'Humedades, mala higiene, equipamiento inadecuado', detalle: 'Sin baño completo, agua caliente, calefacción…' },
    'Ausencia de elevador (en caso de ser necesario) o de teléfono',
    { texto: 'Vivienda inadecuada', detalle: 'Chozas, equipamiento mínimo, daño estructural de la vivienda.' },
  ]),
  area('relaciones', 'D', 'Relaciones sociales', 'relaciones sociales', [
    'Relaciones sociales',
    'Relación social solo con familia y vecinos',
    'Relación social solo con familia o vecinos',
    'No sale del domicilio, recibe visitas',
    'No sale y no recibe visitas',
  ]),
  area('apoyo', 'E', 'Apoyo de la red social', 'apoyo de la red social', [
    'Con apoyo familiar y vecinal',
    'Voluntariado social, ayuda domiciliaria',
    'No tiene apoyo',
    'Pendiente del ingreso en residencia geriátrica',
    'Tiene cuidados permanentes',
  ]),
];

// Sugerencias orientativas para Trabajo Social según el área con 3 o más puntos (no son puntos de corte del instrumento).
const SUG_AREA = {
  familiar: 'Vive solo o con dependencia: valorar la red de apoyo cercana, un plan ante emergencias y la necesidad de cuidador.',
  economica: 'Ingreso limitado: orientar con Trabajo Social sobre programas de apoyo económico y acceso a medicamentos.',
  vivienda: 'Vivienda con barreras o carencias: valorar adaptaciones del hogar y riesgo de caídas en el domicilio.',
  relaciones: 'Contacto social limitado: explorar soledad y aislamiento, y opciones de actividades comunitarias.',
  apoyo: 'Apoyo de la red social limitado o necesidad de cuidados permanentes: gestionar apoyos formales e informales y valorar la carga del cuidador.',
};

const BANDAS = [
  { min: 5, max: 9, etiqueta: 'Riesgo social bajo', nivel: 'bien', texto: 'Menos de 10 puntos: situación social normal o riesgo social bajo.', sugerencias: [] },
  {
    min: 10, max: 16, etiqueta: 'Riesgo social intermedio', nivel: 'moderado', hallazgo: true,
    texto: '10 a 16 puntos: riesgo social intermedio. La guía del INGER indica referir a Trabajo Social.',
    sugerencias: ['Referir a Trabajo Social.'],
  },
  {
    min: 17, max: 25, etiqueta: 'Riesgo social elevado (problema social)', nivel: 'grave', hallazgo: true,
    texto: '17 puntos o más: riesgo social elevado o problema social. La guía del INGER indica referir a Trabajo Social.',
    sugerencias: ['Referir a Trabajo Social.'],
  },
];

export default {
  id: 'gijon',
  nombre: 'Escala de Gijón de valoración sociofamiliar (adaptación del INGER)',
  corto: 'Gijón',
  dominio: 'social',
  tipo: 'tamizaje',
  aliases: ['valoracion sociofamiliar', 'riesgo social', 'trabajo social', 'Gijon'],
  problemas: ['riesgo social', 'aislamiento', 'vive solo', 'red de apoyo', 'vivienda', 'situación económica'],
  descripcion: 'Riesgo social en 5 áreas (familia, economía, vivienda, relaciones y apoyo), de 1 a 5 puntos cada una; total de 5 a 25.',
  objetivo: 'Detectar situaciones de riesgo o problemas sociales en el entorno de la persona mayor y orientar la referencia a Trabajo Social.',
  poblacion: 'Personas mayores en atención primaria y hospital (García González, 1999); adaptación mexicana de la guía del INGER (2022).',
  aplicacion: [
    'Explica que harás preguntas sobre su situación y elige en cada área la opción que mejor la describa.',
    'Cada área vale de 1 (situación más favorable) a 5 (más desfavorable).',
    'Si respondió un familiar, anótalo en la fuente.',
  ],
  tiempo: '5 a 10 min',
  fuente: true,
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor riesgo social',
  textoEmpeoramiento: 'mayor riesgo social',
  min: 5,
  max: 25,
  campos: AREAS.map(({ letra, nombre, ...c }) => c),
  bandas: BANDAS,
  calcular({ v }) {
    const puntaje = AREAS.reduce((s, a) => s + v[a.id].valor, 0);
    const alteradas = AREAS.filter((a) => v[a.id].valor >= 3).sort((x, y) => v[y.id].valor - v[x.id].valor);
    const lineas = [`Áreas: ${AREAS.map((a) => `${a.textoCorto} ${v[a.id].valor}`).join(', ')}.`];
    if (alteradas.length) lineas.push(`Áreas con 3 o más puntos: ${alteradas.map((a) => `${a.textoCorto} (${v[a.id].texto.toLowerCase()})`).join('; ')}.`);
    const banda = BANDAS.find((b) => puntaje >= b.min && puntaje <= b.max);
    const sugerencias = [...banda.sugerencias, ...alteradas.map((a) => SUG_AREA[a.id])];
    return {
      puntaje,
      banda: { ...banda, sugerencias },
      lineas,
      lineasNota: lineas,
      extras: { areas: Object.fromEntries(AREAS.map((a) => [a.id, v[a.id].valor])), alteradas: alteradas.map((a) => a.id) },
    };
  },
  cambioExtra(antes, despues) {
    const a = antes.extras?.areas;
    const d = despues.extras?.areas;
    if (!a || !d) return [];
    const cambios = AREAS.filter((x) => a[x.id] !== d[x.id]).map((x) => `${x.textoCorto} ${a[x.id]} → ${d[x.id]}`);
    return cambios.length ? [`Áreas que cambiaron: ${cambios.join('; ')}.`] : [];
  },
  detalleEnResumen: true,
  notas: [
    'Puntos de corte del anexo de la guía del INGER (2022), coincidentes con la versión original (García González, 1999): menos de 10, 10 a 16 y 17 o más. El texto de la misma guía menciona otros rangos (5–9, 10–14 y más de 15); Huella usa los del anexo.',
    'La guía del INGER señala que la validez de los puntos de corte no está establecida: úsala para orientar la referencia, no como diagnóstico social.',
    'El área económica usa referencias mexicanas (salario mínimo y pensiones) que cambian cada año.',
    'Existen otras versiones (abreviadas o modificadas) con reactivos y puntos de corte distintos: no se combinan.',
    'Las sugerencias por área (3 o más puntos) son orientativas de Huella; no forman parte del instrumento.',
    NOTA_INGER,
  ],
  referencias: [
    { texto: 'García González JV, Díaz Palacios E, Salamea García A, et al. Evaluación de la fiabilidad y validez de una escala de valoración social en el anciano. Aten Primaria. 1999;23(7):434-40.' },
    REF_INGER_2022,
  ],
};
