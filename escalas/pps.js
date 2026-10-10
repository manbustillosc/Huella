// Palliative Performance Scale (PPSv2, Victoria Hospice): registro del nivel asignado con la herramienta oficial.
const NIVELES = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
const nivelDe = (n) => (n >= 70 ? (n >= 90 ? 'bien' : 'leve') : n >= 40 ? (n >= 50 ? 'moderado' : 'grave') : 'critico');

export default {
  id: 'pps',
  nombre: 'Escala de desempeño paliativo (PPSv2)',
  corto: 'PPS',
  dominio: 'paliativos',
  tipo: 'evaluacion',
  registro: true,
  aliases: ['Palliative Performance Scale', 'PPSv2', 'Victoria Hospice', 'desempeno paliativo', 'Karnofsky paliativo'],
  problemas: ['cuidados paliativos', 'fin de vida', 'pronóstico', 'funcionalidad', 'enfermedad avanzada'],
  descripcion: 'Registro del nivel de desempeño (10 % a 100 %, de 10 en 10) asignado con la herramienta oficial de 5 dominios.',
  objetivo: 'Describir y seguir el estado funcional de personas en cuidados paliativos y facilitar la comunicación entre equipos.',
  poblacion: 'Personas con enfermedad avanzada en cuidados paliativos, en domicilio, hospital o unidad de cuidados paliativos (Anderson, 1996). Es una modificación de la escala de Karnofsky.',
  aplicacion: [
    'Usa la tabla oficial PPSv2: se lee de izquierda a derecha por sus 5 dominios (deambulación, actividad y evidencia de enfermedad, autocuidado, ingesta y nivel de conciencia).',
    'Elige el nivel que mejor corresponde; los dominios de la izquierda pesan más. Huella no reproduce la tabla.',
    'Repite el registro cuando cambie el estado: el valor útil es la tendencia.',
  ],
  tiempo: '1 a 2 min',
  momentos: true,
  direccionClinica: 'mayor_mejor',
  unidadCambio: ['punto', 'puntos'],
  textoMejoria: 'mejor desempeño funcional',
  textoEmpeoramiento: 'declinación funcional',
  min: 10,
  max: 100,
  campos: [
    { id: 'nivel', texto: 'Nivel PPS asignado con la tabla oficial', textoCorto: 'nivel', puntua: false, compactoNumerico: true, opciones: NIVELES.map((n) => ({ texto: `${n} %`, valor: n })) },
  ],
  bandas: [...NIVELES].reverse().map((n) => ({
    min: n, max: n, rango: `${n} %`, etiqueta: `PPS ${n} %`, nivel: nivelDe(n), hallazgo: n <= 60,
    texto: n === 100
      ? 'Nivel máximo de desempeño en los 5 dominios de la escala.'
      : `Desempeño de ${n} %: a menor nivel, mayor limitación en deambulación, actividad, autocuidado, ingesta o conciencia según la tabla oficial.`,
    sugerencias: n <= 30
      ? ['Revisar objetivos de atención, control de síntomas y apoyo a la familia; anticipar necesidades de cuidado en las siguientes horas o días.']
      : n <= 60 ? ['Revisar objetivos de atención y necesidades de apoyo; repetir el PPS para seguir la tendencia.'] : [],
  })),
  calcular({ v }) {
    return { valor: v.nivel.valor, mostrar: String(v.nivel.valor), sufijo: '%', unidad: '%' };
  },
  resumen: (res) => `PPS ${res.mostrar} %.`,
  resumenBreve: (res) => `PPS ${res.mostrar} %`,
  detalleEnResumen: true,
  notas: [
    'Huella no estima la esperanza de vida. Los datos de supervivencia publicados dependen de la población, el entorno y el diagnóstico y no se aplican a una persona en particular.',
    'Ejemplo de dato publicado (Anderson, 1996): en 129 personas que murieron en la unidad de cuidados paliativos de Victoria (Canadá), el tiempo promedio desde el ingreso hasta la muerte fue de 1.9 días con PPS 10 %, 2.6 con 20 %, 6.7 con 30 %, 10.3 con 40 % y 13.9 con 50 %. No es un pronóstico individual.',
    'El cambio entre registros tiene más valor clínico que un nivel aislado; anota la fecha de cada uno.',
    'Su inclusión en programas o expedientes electrónicos requiere permiso de Victoria Hospice; Huella registra solo el nivel.',
  ],
  licencia: { texto: 'Palliative Performance Scale (PPSv2) © Victoria Hospice Society. Uso con la tabla oficial; la integración en software requiere permiso del titular.', enlace: 'https://victoriahospice.org' },
  referencias: [
    { texto: 'Anderson F, Downing GM, Hill J, Casorso L, Lerch N. Palliative performance scale (PPS): a new tool. J Palliat Care. 1996;12(1):5-11.' },
  ],
};
