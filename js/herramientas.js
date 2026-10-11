// Herramientas que no son un instrumento de una sola aplicación (tienen su propia pantalla).
// Aparecen en su dominio, en la búsqueda, en favoritas y en las rutas como complementarias.
export const HERRAMIENTAS = [
  {
    id: 'medicacion',
    nombre: 'Revisión de medicamentos: STOPP/START v3 y Beers 2023',
    corto: 'Revisión de medicamentos',
    dominio: 'polifarmacia',
    tipo: 'lista',
    href: '#/medicacion',
    descripcion: 'Registro de la medicación, 190 criterios STOPP/START revisados uno por uno y revisión manual de las categorías de Beers 2023. Sin puntaje.',
    tiempo: '15 a 30 min',
    aliases: ['STOPP', 'START', 'Beers', 'polifarmacia', 'deprescripcion', 'prescripcion inapropiada', 'medicamentos', 'farmacos'],
    problemas: ['polifarmacia', 'prescripción inapropiada', 'omisiones de tratamiento', 'deprescripción', 'interacciones'],
  },
];
export const herramientaDe = (id) => HERRAMIENTAS.find((h) => h.id === id) || null;
export const herramientasDe = (dominioId) => HERRAMIENTAS.filter((h) => h.dominio === dominioId);
