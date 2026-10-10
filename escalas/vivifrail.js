const ENLACE = 'https://vivifrail.com';

const PROGRAMAS = {
  A: { etiqueta: 'Programa A · Limitación grave', nivel: 'critico', texto: 'SPPB 0–3: generalmente no camina o lo hace con gran dificultad. El objetivo inicial es ganar fuerza para levantarse de la silla; ejercicios sentado o en cama, con progresión.' },
  B: { etiqueta: 'Programa B · Limitación moderada', nivel: 'grave', texto: 'SPPB 4–6 (frágil): camina con dificultad o con ayuda. Trabaja fuerza, equilibrio y marcha con apoyo, con progresión gradual.' },
  C1: { etiqueta: 'Programa C1 · Limitación leve', nivel: 'moderado', texto: 'SPPB 7–9 (frágil o prefrágil) y camina de 10 a 30 minutos: fuerza, potencia, equilibrio, flexibilidad y resistencia cardiovascular.' },
  C2: { etiqueta: 'Programa C2 · Limitación leve', nivel: 'moderado', texto: 'SPPB 7–9 (frágil o prefrágil) y camina de 30 a 45 minutos: fuerza, potencia, equilibrio, flexibilidad y mayor componente de resistencia cardiovascular.' },
  D: { etiqueta: 'Programa D · Limitación mínima', nivel: 'bien', texto: 'SPPB 10–12 (robusto): mantener y progresar el programa multicomponente; si deja de hacer ejercicio puede empeorar con rapidez.' },
};

const RIESGOS = [
  { id: 'caidas', texto: '2 o más caídas en el último año, o 1 caída que requirió atención médica' },
  { id: 'tug', texto: 'Levántate y anda (TUG) mayor de 20 s' },
  { id: 'marcha', texto: 'Velocidad de marcha en 6 m menor de 0.8 m/s' },
  { id: 'demencia', texto: 'Demencia' },
];

const MEDIDAS_E = [
  'Valorar e intervenir el estado nutricional (MNA-SF; ingesta proteica adecuada).',
  'Optimizar fármacos: reducir psicofármacos y polifarmacia; revisar antihipertensivos si hay hipotensión ortostática y el tratamiento de la diabetes.',
  'Intervenir el entorno del domicilio (baño, alfombras, iluminación, calzado).',
  'Reforzar el programa de ejercicio con el componente de prevención de caídas (E).',
  'Valorar osteoporosis y deficiencia de vitamina D en quien tiene caídas o fracturas.',
];

export default {
  id: 'vivifrail',
  nombre: 'Vivifrail · Prescripción de ejercicio multicomponente',
  corto: 'Vivifrail',
  dominio: 'fragilidad',
  tipo: 'prescripcion',
  aliases: ['ejercicio', 'pasaporte', 'programa de ejercicio', 'multicomponente', 'Izquierdo'],
  problemas: ['ejercicio', 'fragilidad', 'caídas', 'sarcopenia', 'prescripción de ejercicio'],
  descripcion: 'Elige el programa Vivifrail (A, B, C1, C2 o D, con o sin prevención de caídas) a partir del SPPB y del riesgo de caídas.',
  objetivo: 'Seleccionar el programa de ejercicio físico multicomponente Vivifrail adecuado a la capacidad funcional y al riesgo de caídas.',
  poblacion: 'Personas de 70 años o más, prefrágiles o frágiles, en la comunidad (programa Vivifrail, Erasmus+).',
  aplicacion: [
    'Aplica primero el SPPB. Si ya está en la valoración, Huella usa ese puntaje.',
    'Si el SPPB es de 7 a 9, indica cuánto tiempo camina sin ayuda para distinguir C1 de C2.',
    'Marca los criterios de riesgo elevado de caídas presentes: con uno basta para añadir el componente E.',
    'Los pasaportes y videos de ejercicios son gratuitos en vivifrail.com; Huella no los reproduce.',
  ],
  tiempo: '2 min (después del SPPB)',
  barra: false,
  campos: [
    { id: 'sppb', tipo: 'numero', texto: 'Puntaje SPPB', unidad: 'puntos', min: 0, max: 12, entero: true, prefill: 'sppb' },
    {
      id: 'camina', texto: '¿Cuánto tiempo camina sin ayuda?', textoCorto: 'tiempo de caminata', puntua: false,
      visibleSi: (r) => { const n = Number(r.sppb); return n >= 7 && n <= 9; },
      opciones: [
        { texto: '30 a 45 minutos', valor: 0, clave: 'C2' },
        { texto: '10 a 30 minutos', valor: 0, clave: 'C1' },
        { texto: 'Menos de 10 minutos', valor: 0, clave: 'C1' },
      ],
    },
    { id: 'riesgo', tipo: 'checklist', texto: 'Criterios de riesgo elevado de caídas', textoCorto: 'riesgo de caídas', opciones: RIESGOS },
  ],
  bandas: Object.entries(PROGRAMAS).map(([id, p]) => ({ id, rango: id, ...p })),
  calcular({ v }) {
    const s = v.sppb;
    const base = s <= 3 ? 'A' : s <= 6 ? 'B' : s <= 9 ? v.camina.clave : 'D';
    const conE = v.riesgo.length > 0;
    const p = PROGRAMAS[base];
    const lineas = [p.texto];
    if (base === 'C1' && v.camina.texto.startsWith('Menos')) lineas.push('Camina menos de 10 minutos: se asigna C1, el nivel más conservador de la limitación leve.');
    if (conE) lineas.push(`Riesgo elevado de caídas (${v.riesgo.length} ${v.riesgo.length === 1 ? 'criterio' : 'criterios'}): añadir el programa E de prevención de caídas.`);
    lineas.push('Repite el SPPB al terminar el programa para progresar de nivel.');
    return {
      banda: {
        id: base,
        etiqueta: `${p.etiqueta}${conE ? ' + E (prevención de caídas)' : ''}`,
        nivel: p.nivel,
        hallazgo: false,
        texto: `Programa sugerido: ${base}${conE ? ' + E' : ''}.`,
        sugerencias: conE ? MEDIDAS_E : [],
      },
      mostrar: `${base}${conE ? '+E' : ''}`,
      sufijo: 'programa',
      lineas,
      extras: { programa: `${base}${conE ? ' + E' : ''}`, riesgos: v.riesgo },
    };
  },
  resumen(res) {
    return `Vivifrail: programa ${res.extras.programa} (SPPB ${res.desglose.find((d) => d.campo.id === 'sppb')?.respuesta.replace(' puntos', '')}).`;
  },
  resumenBreve(res) {
    return `Vivifrail programa ${res.extras.programa}`;
  },
  detalleEnResumen: true,
  notas: [
    'Clasificación de Vivifrail: SPPB 0–3 programa A, 4–6 B, 7–9 C (C1 si camina 10–30 min, C2 si 30–45 min), 10–12 D. Con uno o más criterios de riesgo de caídas se añade el programa E.',
    'Vivifrail también usa la velocidad de marcha en 6 m para apoyar la clasificación (<0.5, 0.5–0.8, 0.9–1 y >1 m/s).',
    'Verifica que no haya contraindicaciones para el ejercicio y adapta la intensidad a la persona.',
    'Los materiales de Vivifrail tienen todos los derechos reservados; descárgalos gratuitamente en el sitio oficial.',
  ],
  licencia: { texto: '© Mikel Izquierdo y consorcio Vivifrail (Erasmus+ 556988-EPP-1-2014-1-ES-SPO-SCP). Todos los derechos reservados.', enlace: ENLACE },
  referencias: [
    { texto: 'Izquierdo M, Casas-Herrero A, Zambom-Ferraresi F, Martínez-Velilla N, Alonso-Bouzón C, Rodríguez-Mañas L. Programa de ejercicio físico multicomponente Vivifrail: guía práctica para la prescripción de un programa de entrenamiento físico multicomponente para la prevención de la fragilidad y caídas en mayores de 70 años. 2017.', enlace: ENLACE },
  ],
};
