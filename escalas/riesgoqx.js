// Riesgo inherente al tipo de cirugía o procedimiento (ESC 2022, tabla de riesgo quirúrgico), como lo usa el
// lineamiento de valoración preoperatoria del IMSS (2026, cuadro 2).
const BAJO = ['Mama', 'Dental', 'Endocrina (tiroides)', 'Ocular', 'Ginecológica menor', 'Ortopédica menor (meniscectomía)', 'Reconstructiva', 'Superficial', 'Urológica menor (resección transuretral de próstata)', 'Resección pulmonar menor por CTAV'];
const INTERMEDIO = ['Carotídea asintomática (endarterectomía o stent)', 'Carotídea sintomática (endarterectomía)', 'Reparación endovascular de aneurisma de aorta', 'Cabeza y cuello', 'Intraperitoneal: esplenectomía, reparación de hernia hiatal, colecistectomía', 'Intratorácica no mayor', 'Neurológica u ortopédica mayor (cadera y columna)', 'Angioplastia arterial periférica', 'Trasplante renal', 'Urológica o ginecológica mayor'];
const ALTO = ['Resección suprarrenal', 'Cirugía aórtica y vascular mayor', 'Carotídea sintomática (stent)', 'Duodeno y páncreas', 'Resección hepática, cirugía de vías biliares', 'Esofagectomía', 'Revascularización abierta de miembros inferiores por isquemia aguda o amputación', 'Neumonectomía (CTAV o abierta)', 'Trasplante pulmonar o hepático', 'Reparación de perforación intestinal', 'Cistectomía total'];

const lista = (xs) => xs.join(' · ');

export default {
  id: 'riesgoqx',
  nombre: 'Riesgo del procedimiento quirúrgico (ESC 2022)',
  corto: 'Riesgo del procedimiento',
  dominio: 'prequirurgica',
  tipo: 'estadificacion',
  aliases: ['riesgo quirurgico', 'tipo de cirugia', 'ESC 2022', 'riesgo inherente', 'cirugia de alto riesgo', 'VPO', 'valoracion preoperatoria'],
  problemas: ['valoración preoperatoria', 'cirugía no cardiaca', 'riesgo cardiovascular perioperatorio'],
  descripcion: 'Riesgo inherente al tipo de cirugía: bajo (<1 %), intermedio (1 a 5 %) o alto (>5 %).',
  objetivo: 'Clasificar el riesgo propio del procedimiento, que junto con el estado del paciente define si hace falta VPO, ECG o más estudios.',
  poblacion: 'Personas adultas candidatas a cirugía electiva no cardiaca (guía ESC 2022; lineamiento de VPO del IMSS, 2026).',
  aplicacion: [
    'Elige la categoría que contiene el procedimiento programado; cada opción enumera los procedimientos de la tabla.',
    'Es una variable distinta de la «cirugía de alto riesgo» del RCRI (intraperitoneal, intratorácica o vascular suprainguinal).',
  ],
  tiempo: '1 min',
  direccionClinica: 'sin_direccion',
  barra: false,
  min: 1,
  max: 3,
  campos: [
    {
      id: 'categoria', texto: 'Categoría del procedimiento programado', textoCorto: 'categoría', puntua: false,
      opciones: [
        { texto: 'Riesgo bajo (<1 %)', valor: 1, detalle: lista(BAJO) },
        { texto: 'Riesgo intermedio (1 a 5 %)', valor: 2, detalle: lista(INTERMEDIO) },
        { texto: 'Riesgo alto (>5 %)', valor: 3, detalle: lista(ALTO) },
      ],
    },
  ],
  bandas: [
    { min: 1, max: 1, etiqueta: 'Cirugía de riesgo bajo', nivel: 'bien', texto: 'Riesgo estimado <1 % a 30 días. En personas asintomáticas no se piden ECG, radiografía de tórax, ecocardiograma ni laboratorio de rutina.', sugerencias: [] },
    { min: 2, max: 2, etiqueta: 'Cirugía de riesgo intermedio', nivel: 'moderado', hallazgo: true, texto: 'Riesgo estimado de 1 a 5 % a 30 días. Indica ECG de 12 derivaciones y, con ASA III, solicitar VPO.', sugerencias: ['ECG de 12 derivaciones.', 'Con ASA III: solicitar VPO a Medicina Interna.'] },
    { min: 3, max: 3, etiqueta: 'Cirugía de riesgo alto', nivel: 'grave', hallazgo: true, texto: 'Riesgo estimado >5 % a 30 días. Indica ECG de 12 derivaciones y solicitar VPO desde ASA I; valorar sesión colegiada en casos complejos.', sugerencias: ['ECG de 12 derivaciones.', 'Solicitar VPO a Medicina Interna (desde ASA I).', 'Casos complejos: sesión colegiada interdisciplinaria.'] },
  ],
  calcular: ({ v }) => ({ valor: v.categoria.valor, mostrar: ['', 'Bajo', 'Intermedio', 'Alto'][v.categoria.valor], sufijo: 'riesgo del procedimiento', unidad: '' }),
  resumen: (res) => `Riesgo del procedimiento (ESC 2022): ${res.banda.etiqueta.replace('Cirugía de riesgo ', '')}.`,
  resumenBreve: (res) => `Procedimiento de riesgo ${res.banda.etiqueta.replace('Cirugía de riesgo ', '')}`,
  detalleEnResumen: true,
  notas: [
    'La guía ESC 2022 estima el riesgo a 30 días de muerte cardiovascular, infarto o EVC según el tipo de cirugía; el lineamiento del IMSS lo describe como mortalidad a 30 días.',
    'Se interpreta junto con el estado del paciente (ASA, condición cardiaca activa, capacidad funcional y RCRI); no sustituye el juicio clínico.',
    'CTAV: cirugía torácica asistida por video.',
  ],
  licencia: { texto: 'Clasificación publicada en la guía ESC 2022 y reproducida en el lineamiento de VPO del IMSS (2026); Huella enumera los procedimientos con redacción propia.' },
  referencias: [
    { texto: 'Halvorsen S, Mehilli J, Cassese S, et al. 2022 ESC Guidelines on cardiovascular assessment and management of patients undergoing non-cardiac surgery. Eur Heart J. 2022;43(39):3826-3924.', doi: '10.1093/eurheartj/ehac270' },
    { texto: 'Instituto Mexicano del Seguro Social. Lineamiento para Valoración Preoperatoria para Cirugía Electiva no Cardiaca. México: IMSS; 2026.' },
  ],
};
