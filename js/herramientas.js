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
  {
    id: 'infusiones',
    nombre: 'Calculadora de infusiones',
    corto: 'Infusiones',
    dominio: 'calculadoras',
    tipo: 'calculadora',
    href: '#/infusiones',
    descripcion: 'Preparación, dosis ↔ velocidad (mL/h), ajuste, titulación y bolos de sedantes, bloqueo neuromuscular y vasoactivos, con la tabla de referencia.',
    tiempo: '1 a 3 min',
    aliases: ['infusion', 'bomba', 'BIC', 'mL/h', 'norepinefrina', 'noradrenalina', 'midazolam', 'propofol', 'dexmedetomidina', 'vasopresores', 'sedacion', 'rocuronio', 'vecuronio', 'dobutamina', 'dopamina', 'vasopresina', 'adrenalina', 'goteo'],
    problemas: ['choque', 'sedación', 'cuidados intensivos', 'intubación', 'dosificación'],
  },
  {
    id: 'unidades',
    nombre: 'Conversión de unidades',
    corto: 'Conversión de unidades',
    dominio: 'calculadoras',
    tipo: 'calculadora',
    href: '#/unidades',
    descripcion: 'Masa, volumen, concentración, presión, temperatura, dosis por minuto u hora, goteo, electrolitos (mg, mmol, mEq) y laboratorio en unidades SI.',
    tiempo: '1 min',
    aliases: ['convertir', 'unidades', 'mEq', 'mmol', 'mcg', 'gotas', 'goteo', 'SI', 'mg/dL', 'Fahrenheit', 'libras', 'proporcion 1:1000'],
    problemas: ['dosificación', 'electrolitos', 'laboratorio'],
  },
];
export const herramientaDe = (id) => HERRAMIENTAS.find((h) => h.id === id) || null;
export const herramientasDe = (dominioId) => HERRAMIENTAS.filter((h) => h.dominio === dominioId);
