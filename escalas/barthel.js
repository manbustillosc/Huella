export default {
  id: 'barthel',
  nombre: 'Índice de Barthel',
  corto: 'Barthel',
  dominio: 'funcional',
  aliases: ['ABVD', 'actividades basicas', 'dependencia', 'Mahoney'],
  descripcion: 'Actividades básicas de la vida diaria (ABVD): 10 actividades, de 0 a 100 puntos.',
  aplicacion: 'Por interrogatorio al paciente o al cuidador, u observación directa. Puntúa lo que la persona hace habitualmente, no lo que podría hacer.',
  tiempo: '5 min',
  min: 0,
  max: 100,
  items: [
    {
      id: 'comer', texto: 'Comer',
      opciones: [
        { texto: 'Independiente', detalle: 'Usa cualquier utensilio necesario y come en un tiempo razonable.', valor: 10 },
        { texto: 'Necesita ayuda', detalle: 'Para cortar la carne, untar mantequilla, etc.', valor: 5 },
        { texto: 'Dependiente', valor: 0 },
      ],
    },
    {
      id: 'banarse', texto: 'Bañarse',
      opciones: [
        { texto: 'Independiente', detalle: 'Se baña completo en regadera o tina; entra y sale sin ayuda.', valor: 5 },
        { texto: 'Dependiente', valor: 0 },
      ],
    },
    {
      id: 'vestirse', texto: 'Vestirse',
      opciones: [
        { texto: 'Independiente', detalle: 'Se pone y quita la ropa, se abrocha, se ata los zapatos.', valor: 10 },
        { texto: 'Necesita ayuda', detalle: 'Hace al menos la mitad de la tarea en un tiempo razonable.', valor: 5 },
        { texto: 'Dependiente', valor: 0 },
      ],
    },
    {
      id: 'arreglarse', texto: 'Arreglarse',
      opciones: [
        { texto: 'Independiente', detalle: 'Se lava cara y manos, se peina, se afeita o maquilla.', valor: 5 },
        { texto: 'Dependiente', valor: 0 },
      ],
    },
    {
      id: 'deposicion', texto: 'Deposición',
      opciones: [
        { texto: 'Continente', valor: 10 },
        { texto: 'Accidente ocasional', detalle: 'Máximo uno por semana, o necesita ayuda con enemas o supositorios.', valor: 5 },
        { texto: 'Incontinente', valor: 0 },
      ],
    },
    {
      id: 'miccion', texto: 'Micción',
      opciones: [
        { texto: 'Continente', detalle: 'O maneja solo su sonda.', valor: 10 },
        { texto: 'Accidente ocasional', detalle: 'Máximo uno en 24 h, o necesita ayuda con la sonda.', valor: 5 },
        { texto: 'Incontinente', valor: 0 },
      ],
    },
    {
      id: 'retrete', texto: 'Uso del retrete',
      opciones: [
        { texto: 'Independiente', detalle: 'Entra y sale, se limpia y se acomoda la ropa.', valor: 10 },
        { texto: 'Necesita ayuda', detalle: 'Pero se limpia solo.', valor: 5 },
        { texto: 'Dependiente', valor: 0 },
      ],
    },
    {
      id: 'traslado', texto: 'Traslado sillón–cama',
      opciones: [
        { texto: 'Independiente', valor: 15 },
        { texto: 'Mínima ayuda', detalle: 'Ayuda física mínima o supervisión.', valor: 10 },
        { texto: 'Gran ayuda', detalle: 'Una persona fuerte o dos; se mantiene sentado sin ayuda.', valor: 5 },
        { texto: 'Dependiente', detalle: 'Necesita grúa o dos personas; no se mantiene sentado.', valor: 0 },
      ],
    },
    {
      id: 'deambulacion', texto: 'Deambulación',
      opciones: [
        { texto: 'Independiente', detalle: 'Camina al menos 50 m solo; puede usar bastón o andadera.', valor: 15 },
        { texto: 'Necesita ayuda', detalle: 'Ayuda física o supervisión para caminar 50 m.', valor: 10 },
        { texto: 'Independiente en silla de ruedas', detalle: 'Recorre 50 m sin ayuda.', valor: 5 },
        { texto: 'Dependiente', valor: 0 },
      ],
    },
    {
      id: 'escalones', texto: 'Subir y bajar escalones',
      opciones: [
        { texto: 'Independiente', detalle: 'Sube y baja un piso sin supervisión; puede usar barandal o bastón.', valor: 10 },
        { texto: 'Necesita ayuda', detalle: 'Ayuda física o supervisión.', valor: 5 },
        { texto: 'Dependiente', valor: 0 },
      ],
    },
  ],
  bandas: [
    { min: 0, max: 20, etiqueta: 'Dependencia total', nivel: 'critico', texto: 'Dependencia total para las actividades básicas de la vida diaria.' },
    { min: 21, max: 60, etiqueta: 'Dependencia grave', nivel: 'grave', texto: 'Dependencia grave para las actividades básicas de la vida diaria.' },
    { min: 61, max: 90, etiqueta: 'Dependencia moderada', nivel: 'moderado', texto: 'Dependencia moderada para las actividades básicas de la vida diaria.' },
    { min: 91, max: 99, etiqueta: 'Dependencia escasa', nivel: 'leve', texto: 'Dependencia escasa para las actividades básicas de la vida diaria.' },
    { min: 100, max: 100, etiqueta: 'Independiente', nivel: 'bien', texto: 'Independiente para las actividades básicas de la vida diaria.' },
  ],
  notas: [
    'Puntuación en múltiplos de 5. Puntos de corte de Shah et al. (1989), los más usados; otros autores agrupan de forma distinta.',
    'Más útil para el seguimiento seriado del mismo paciente que como valor aislado.',
  ],
  referencias: [
    { texto: 'Mahoney FI, Barthel DW. Functional evaluation: the Barthel Index. Md State Med J. 1965;14:61-5.' },
    { texto: 'Shah S, Vanclay F, Cooper B. Improving the sensitivity of the Barthel Index for stroke rehabilitation. J Clin Epidemiol. 1989;42(8):703-9.', doi: '10.1016/0895-4356(89)90065-6' },
    { texto: 'Baztán JJ, et al. Índice de Barthel: instrumento válido para la valoración funcional de pacientes con enfermedad cerebrovascular. Rev Esp Geriatr Gerontol. 1993;28:32-40.' },
  ],
};
