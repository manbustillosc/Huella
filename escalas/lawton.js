export default {
  id: 'lawton',
  nombre: 'Escala de Lawton y Brody',
  corto: 'Lawton-Brody',
  dominio: 'funcional',
  aliases: ['AIVD', 'actividades instrumentales', 'Lawton', 'Brody'],
  descripcion: 'Actividades instrumentales de la vida diaria (AIVD): 8 actividades, de 0 a 8 puntos.',
  aplicacion: 'Por interrogatorio al paciente o al cuidador. Valora lo que hace habitualmente en el último mes; elige en cada actividad la opción que mejor lo describa.',
  tiempo: '5 min',
  min: 0,
  max: 8,
  items: [
    {
      id: 'telefono', texto: 'Uso del teléfono',
      opciones: [
        { texto: 'Lo usa por iniciativa propia, busca y marca números', valor: 1 },
        { texto: 'Marca bien algunos números conocidos', valor: 1 },
        { texto: 'Contesta, pero no marca', valor: 1 },
        { texto: 'No usa el teléfono', valor: 0 },
      ],
    },
    {
      id: 'compras', texto: 'Hacer compras',
      opciones: [
        { texto: 'Realiza todas las compras necesarias de forma independiente', valor: 1 },
        { texto: 'Realiza solo compras pequeñas de forma independiente', valor: 0 },
        { texto: 'Necesita ir acompañado para cualquier compra', valor: 0 },
        { texto: 'Totalmente incapaz de comprar', valor: 0 },
      ],
    },
    {
      id: 'comida', texto: 'Preparación de la comida',
      opciones: [
        { texto: 'Organiza, prepara y sirve las comidas adecuadamente', valor: 1 },
        { texto: 'Las prepara si le dan los ingredientes', valor: 0 },
        { texto: 'Prepara, calienta y sirve, pero sin una dieta adecuada', valor: 0 },
        { texto: 'Necesita que le preparen y sirvan las comidas', valor: 0 },
      ],
    },
    {
      id: 'casa', texto: 'Cuidado de la casa',
      opciones: [
        { texto: 'Mantiene la casa solo o con ayuda ocasional para trabajos pesados', valor: 1 },
        { texto: 'Hace tareas ligeras (lavar platos, tender camas)', valor: 1 },
        { texto: 'Hace tareas ligeras, pero sin mantener un nivel de limpieza adecuado', valor: 1 },
        { texto: 'Necesita ayuda en todas las labores de la casa', valor: 1 },
        { texto: 'No participa en ninguna labor de la casa', valor: 0 },
      ],
    },
    {
      id: 'ropa', texto: 'Lavado de la ropa',
      opciones: [
        { texto: 'Lava solo toda su ropa', valor: 1 },
        { texto: 'Lava solo prendas pequeñas', valor: 1 },
        { texto: 'Otra persona lava toda su ropa', valor: 0 },
      ],
    },
    {
      id: 'transporte', texto: 'Uso de medios de transporte',
      opciones: [
        { texto: 'Viaja solo en transporte público o maneja su propio auto', valor: 1 },
        { texto: 'Toma un taxi solo, pero no otro medio de transporte', valor: 1 },
        { texto: 'Viaja en transporte público si va acompañado', valor: 1 },
        { texto: 'Solo viaja en taxi o auto con ayuda de otros', valor: 0 },
        { texto: 'No viaja', valor: 0 },
      ],
    },
    {
      id: 'medicacion', texto: 'Responsabilidad sobre su medicación',
      opciones: [
        { texto: 'Toma su medicación a la hora y en la dosis correctas', valor: 1 },
        { texto: 'La toma si alguien le prepara las dosis', valor: 0 },
        { texto: 'No es capaz de administrarse su medicación', valor: 0 },
      ],
    },
    {
      id: 'dinero', texto: 'Manejo de asuntos económicos',
      opciones: [
        { texto: 'Se encarga solo de sus asuntos económicos', valor: 1 },
        { texto: 'Hace compras diarias, pero necesita ayuda con compras grandes y bancos', valor: 1 },
        { texto: 'Incapaz de manejar dinero', valor: 0 },
      ],
    },
  ],
  bandas: [
    { min: 0, max: 1, etiqueta: 'Dependencia total', nivel: 'critico', texto: 'Dependencia total para las actividades instrumentales.' },
    { min: 2, max: 3, etiqueta: 'Dependencia grave', nivel: 'grave', texto: 'Dependencia grave para las actividades instrumentales.' },
    { min: 4, max: 5, etiqueta: 'Dependencia moderada', nivel: 'moderado', texto: 'Dependencia moderada para las actividades instrumentales.' },
    { min: 6, max: 7, etiqueta: 'Dependencia leve', nivel: 'leve', texto: 'Dependencia leve para las actividades instrumentales.' },
    { min: 8, max: 8, etiqueta: 'Independiente', nivel: 'bien', texto: 'Independiente para las actividades instrumentales.' },
  ],
  notas: [
    'Se puntúan las 8 actividades en ambos sexos. En la versión original, en hombres se excluían comida, casa y ropa (máximo 5).',
    'Considera barreras culturales o de rol: una actividad que nunca ha realizado no equivale a una pérdida funcional.',
    'Las categorías de dependencia son de uso común, no del instrumento original; el puntaje es más útil para comparar en el tiempo.',
  ],
  referencias: [
    { texto: 'Lawton MP, Brody EM. Assessment of older people: self-maintaining and instrumental activities of daily living. Gerontologist. 1969;9(3):179-86.' },
    { texto: 'Vergara I, et al. Validation of the Spanish version of the Lawton IADL Scale for its application in elderly people. Health Qual Life Outcomes. 2012;10:130.', doi: '10.1186/1477-7525-10-130' },
  ],
};
