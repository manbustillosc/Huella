export default {
  id: 'zarit',
  nombre: 'Escala de sobrecarga del cuidador de Zarit',
  corto: 'Zarit',
  dominio: 'social',
  tipo: 'registro',
  aliases: ['sobrecarga', 'cuidador', 'Zarit Burden Interview', 'ZBI', 'colapso del cuidador'],
  problemas: ['cuidador', 'sobrecarga del cuidador', 'colapso del cuidador', 'demencia', 'dependencia'],
  descripcion: 'Registro del puntaje de la versión española de 22 reactivos (1 a 5 puntos cada uno): 22 a 110.',
  objetivo: 'Medir la sobrecarga percibida por el cuidador principal.',
  poblacion: 'Cuidadores principales de personas mayores dependientes o con demencia; adaptación española de Martín et al. (1996).',
  aplicacion: [
    'Aplica al cuidador la versión oficial de 22 reactivos con respuestas de 1 (nunca) a 5 (casi siempre).',
    'Registra el puntaje total. Huella no reproduce los reactivos.',
    'Son datos del cuidador, no del paciente: no anotes su nombre.',
  ],
  tiempo: '10 min',
  min: 22,
  max: 110,
  campos: [
    { id: 'puntaje', tipo: 'numero', texto: 'Puntaje total (versión española, 22 a 110)', unidad: 'puntos', min: 22, max: 110, entero: true },
  ],
  bandas: [
    { min: 22, max: 46, etiqueta: 'Sin sobrecarga', nivel: 'bien', texto: 'No hay sobrecarga según el punto de corte de la versión española.', sugerencias: [] },
    {
      min: 47, max: 55, etiqueta: 'Sobrecarga leve', nivel: 'moderado', hallazgo: true,
      texto: 'Sobrecarga leve del cuidador.',
      sugerencias: ['Explorar necesidades del cuidador: información sobre la enfermedad, apoyo de otros familiares, respiro y recursos comunitarios.'],
    },
    {
      min: 56, max: 110, etiqueta: 'Sobrecarga intensa', nivel: 'grave', hallazgo: true,
      texto: 'Sobrecarga intensa del cuidador; se asocia con mayor riesgo de claudicación del cuidado y de problemas de salud del cuidador.',
      sugerencias: [
        'Plan de apoyo al cuidador: redistribuir tareas, respiro, grupos de apoyo y trabajo social.',
        'Valorar la salud física y emocional del cuidador y referirlo a su propio médico si es necesario.',
        'Revalorar la sobrecarga tras las intervenciones.',
      ],
    },
  ],
  calcular({ v }) {
    return { puntaje: v.puntaje };
  },
  notas: [
    'Puntos de corte de la adaptación española (Martín et al., 1996): ≤46 sin sobrecarga, 47–55 sobrecarga leve, ≥56 sobrecarga intensa.',
    'Si se usa la versión original puntuada de 0 a 4 (0 a 88) o una versión abreviada, los puntos de corte son distintos: no la registres aquí.',
    'Mide la sobrecarga percibida; no evalúa la calidad del cuidado.',
  ],
  licencia: { texto: 'Zarit Burden Interview © Steven H. Zarit. Licencia y distribución exclusivas: Mapi Research Trust (ePROVIDE).', enlace: 'https://eprovide.mapi-trust.org' },
  referencias: [
    { texto: 'Zarit SH, Reever KE, Bach-Peterson J. Relatives of the impaired elderly: correlates of feelings of burden. Gerontologist. 1980;20(6):649-55.', doi: '10.1093/geront/20.6.649' },
    { texto: 'Martín M, Salvadó I, Nadal S, et al. Adaptación para nuestro medio de la Escala de Sobrecarga del Cuidador (Caregiver Burden Interview) de Zarit. Rev Gerontol. 1996;6:338-46.' },
  ],
};
