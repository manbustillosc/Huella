import { fechaCorta } from '../js/comparacion.js';

const ENLACE = 'https://vivifrail.com';

const PROGRAMAS = {
  A: { etiqueta: 'Programa A (limitación grave)', nivel: 'critico', texto: 'SPPB 0–3: generalmente no camina o lo hace con gran dificultad. El objetivo inicial es ganar fuerza para levantarse de la silla; ejercicios sentado o en cama, con progresión.' },
  B: { etiqueta: 'Programa B (limitación moderada)', nivel: 'grave', texto: 'SPPB 4–6 (frágil): camina con dificultad o con ayuda. Trabaja fuerza, equilibrio y marcha con apoyo, con progresión gradual.' },
  C1: { etiqueta: 'Programa C1 (limitación leve)', nivel: 'moderado', texto: 'SPPB 7–9 (frágil o prefrágil) y camina de 10 a 30 minutos: fuerza, potencia, equilibrio, flexibilidad y resistencia cardiovascular.' },
  C2: { etiqueta: 'Programa C2 (limitación leve)', nivel: 'moderado', texto: 'SPPB 7–9 (frágil o prefrágil) y camina de 30 a 45 minutos: fuerza, potencia, equilibrio, flexibilidad y mayor componente de resistencia cardiovascular.' },
  D: { etiqueta: 'Programa D (limitación mínima)', nivel: 'bien', texto: 'SPPB 10–12 (robusto): mantener y progresar el programa multicomponente; si deja de hacer ejercicio puede empeorar con rapidez.' },
};

const INDEFINIDO = {
  id: 'indef', etiqueta: 'Limitación leve: programa no definido', nivel: 'moderado',
  texto: 'SPPB 7–9 con caminata menor de 10 minutos: Vivifrail asigna C1 a quien camina de 10 a 30 minutos y C2 a quien camina de 30 a 45. Para este caso el algoritmo no define el programa; la elección es clínica.',
};

const MEDIDAS_E = [
  'Valorar e intervenir el estado nutricional (MNA-SF; ingesta proteica adecuada).',
  'Optimizar fármacos: reducir psicofármacos y polifarmacia; revisar antihipertensivos si hay hipotensión ortostática y el tratamiento de la diabetes.',
  'Intervenir el entorno del domicilio (baño, alfombras, iluminación, calzado).',
  'Reforzar el programa de ejercicio con el componente de prevención de caídas (E).',
  'Valorar osteoporosis y deficiencia de vitamina D en quien tiene caídas o fracturas.',
];

const SINO = [{ texto: 'Sí', valor: 1, clave: 'si' }, { texto: 'No', valor: 0, clave: 'no' }];
const CRITERIO_MEDIBLE = (si, no) => [
  { texto: si, valor: 1, clave: 'si' },
  { texto: no, valor: 0, clave: 'no' },
  { texto: 'No se ha medido', valor: 0, clave: 'sin' },
];
const NOMBRES_CRITERIO = {
  caidas: '2 o más caídas en el último año o 1 que requirió atención médica',
  tug: 'TUG mayor de 20 s',
  vm6: 'velocidad de marcha en 6 m menor de 0.8 m/s',
  demencia: 'demencia',
};
const opcionDe = (campo, clave) => campo.opciones.findIndex((o) => o.clave === clave);

const CAMPOS = [
  { id: 'sppb', tipo: 'numero', texto: 'Puntaje SPPB', unidad: 'puntos', min: 0, max: 12, entero: true },
  {
    id: 'camina', texto: '¿Cuánto tiempo camina sin ayuda?', textoCorto: 'tiempo de caminata', puntua: false,
    visibleSi: (r) => { const n = Number(r.sppb); return r.sppb !== '' && r.sppb != null && n >= 7 && n <= 9; },
    opciones: [
      { texto: 'De 30 a 45 minutos o más', valor: 0, clave: 'C2' },
      { texto: 'De 10 a 30 minutos', valor: 0, clave: 'C1' },
      { texto: 'Menos de 10 minutos', valor: 0, clave: null },
    ],
  },
  {
    id: 'caidas', texto: 'Riesgo de caídas: ¿2 o más caídas en el último año, o 1 caída que requirió atención médica?', textoCorto: 'caídas', puntua: false,
    opciones: SINO,
  },
  {
    id: 'tug', texto: 'Riesgo de caídas: Levántate y anda (TUG) mayor de 20 s', textoCorto: 'TUG >20 s', puntua: false,
    opciones: CRITERIO_MEDIBLE('Sí, más de 20 s', 'No, 20 s o menos'),
  },
  {
    id: 'vm6', texto: 'Riesgo de caídas: velocidad de marcha en 6 m menor de 0.8 m/s', textoCorto: 'velocidad en 6 m <0.8 m/s', puntua: false,
    opciones: CRITERIO_MEDIBLE('Sí, menor de 0.8 m/s', 'No, 0.8 m/s o más'),
  },
  {
    id: 'demencia', texto: 'Riesgo de caídas: ¿tiene diagnóstico de demencia?', textoCorto: 'demencia', puntua: false,
    opciones: SINO,
  },
];
const campo = (id) => CAMPOS.find((c) => c.id === id);

export default {
  id: 'vivifrail',
  nombre: 'Vivifrail · Prescripción de ejercicio multicomponente',
  corto: 'Vivifrail',
  dominio: 'fragilidad',
  tipo: 'prescripcion',
  aliases: ['ejercicio', 'pasaporte', 'programa de ejercicio', 'multicomponente', 'Izquierdo'],
  problemas: ['ejercicio', 'fragilidad', 'caídas', 'sarcopenia', 'prescripción de ejercicio'],
  descripcion: 'Elige el programa Vivifrail (A, B, C1, C2 o D, con o sin prevención de caídas) a partir del SPPB y de los criterios de riesgo de caídas.',
  objetivo: 'Seleccionar el programa de ejercicio físico multicomponente Vivifrail adecuado a la capacidad funcional y al riesgo de caídas.',
  poblacion: 'Personas de 70 años o más, prefrágiles o frágiles, en la comunidad (programa Vivifrail, Erasmus+).',
  aplicacion: [
    'Si en esta valoración ya hay SPPB, TUG o velocidad de marcha, Huella los muestra con su fecha: tócalos para usarlos solo si siguen vigentes.',
    'Si el SPPB es de 7 a 9, indica cuánto tiempo camina sin ayuda para distinguir C1 de C2.',
    'Responde los cuatro criterios de riesgo de caídas: con uno presente se añade el programa E. Si el TUG o la velocidad en 6 m no se han medido, el componente E queda por determinar.',
    'Los pasaportes y videos de ejercicios son gratuitos en vivifrail.com; Huella no los reproduce.',
  ],
  tiempo: '2 min (después del SPPB)',
  barra: false,
  direccionClinica: 'sin_direccion',
  vinculos: [
    {
      id: 'sppb', escala: 'sppb', titulo: 'SPPB',
      disponible: (res) => (Number.isFinite(res.puntaje) ? true : 'El SPPB guardado no tiene puntaje.'),
      describir: (res) => `SPPB ${res.puntaje}/12`,
      aplicar: (res) => ({ sppb: String(res.puntaje) }),
      campos: ['sppb'],
    },
    {
      id: 'tug', escala: 'tug', titulo: 'TUG',
      disponible: (res) => (res.extras?.incapaz
        ? 'El TUG registrado indica que no se completó; el criterio de Vivifrail (>20 s) requiere decisión clínica.'
        : Number.isFinite(res.valor) ? true : 'El TUG guardado no tiene tiempo.'),
      describir: (res) => `TUG ${res.valor} s: criterio >20 s ${res.valor > 20 ? 'presente' : 'ausente'}`,
      aplicar: (res) => ({ tug: opcionDe(campo('tug'), res.valor > 20 ? 'si' : 'no') }),
      campos: ['tug'],
    },
    {
      id: 'velocidad', escala: 'velocidad', titulo: 'Velocidad de marcha',
      disponible: (res) => (Number.isFinite(res.valor) ? true : 'La velocidad guardada no tiene valor.'),
      advertencia: (res) => (res.extras?.distancia === 6 ? null : `Medida en ${res.extras?.distancia ?? 'otro recorrido'} m; Vivifrail definió el criterio con 6 m.`),
      describir: (res) => `${res.mostrar} m/s en ${res.extras?.distancia ?? '?'} m: criterio <0.8 m/s ${res.valor < 0.8 ? 'presente' : 'ausente'}`,
      aplicar: (res) => ({ vm6: opcionDe(campo('vm6'), res.valor < 0.8 ? 'si' : 'no') }),
      campos: ['vm6'],
    },
    {
      id: 'sppbMarcha', escala: 'sppb', titulo: 'Marcha del SPPB',
      disponible: (res) => (Number.isFinite(res.extras?.velocidad) ? true : 'El SPPB no tiene una marcha cronometrada.'),
      advertencia: (res) => `Medida en ${res.extras?.distanciaMarcha} m dentro del SPPB; Vivifrail definió el criterio con 6 m.`,
      describir: (res) => `${res.extras.velocidad.toFixed(2)} m/s en ${res.extras.distanciaMarcha} m: criterio <0.8 m/s ${res.extras.velocidad < 0.8 ? 'presente' : 'ausente'}`,
      aplicar: (res) => ({ vm6: opcionDe(campo('vm6'), res.extras.velocidad < 0.8 ? 'si' : 'no') }),
      campos: ['vm6'],
    },
  ],
  campos: CAMPOS,
  bandas: ['A', 'B', 'C1', 'C2', 'D'].map((id) => ({ id, rango: id, ...PROGRAMAS[id] })),
  calcular({ v, r }) {
    const s = v.sppb;
    const base = s <= 3 ? 'A' : s <= 6 ? 'B' : s <= 9 ? v.camina.clave : 'D';
    const presentes = ['caidas', 'tug', 'vm6', 'demencia'].filter((id) => v[id].clave === 'si');
    const sinMedir = ['tug', 'vm6'].filter((id) => v[id].clave === 'sin');
    const e = presentes.length ? 'si' : sinMedir.length ? 'indeterminado' : 'no';
    const lineas = [];
    const p = base ? PROGRAMAS[base] : INDEFINIDO;
    lineas.push(p.texto);
    if (e === 'si') lineas.push(`Riesgo elevado de caídas (${presentes.map((id) => NOMBRES_CRITERIO[id]).join('; ')}): añadir el programa E de prevención de caídas.`);
    if (e === 'no') lineas.push('Sin criterios de riesgo elevado de caídas entre los cuatro evaluados: no se añade el programa E.');
    if (e === 'indeterminado') lineas.push(`Componente E por determinar: ningún criterio presente entre los evaluados, pero falta ${sinMedir.map((id) => NOMBRES_CRITERIO[id]).join(' y ')}.`);
    const vinculos = Object.values(r._vinculos || {});
    if (vinculos.length) lineas.push(`Datos tomados de esta valoración: ${vinculos.map((x) => `${x.texto} (${x.etiqueta || ''}${x.fecha ? ` ${fechaCorta(x.fecha)}` : ''})`.replace('( ', '(')).join('; ')}.`);
    lineas.push('Repite el SPPB al terminar el programa para progresar de nivel.');
    const programa = base ? `${base}${e === 'si' ? ' + E' : ''}` : 'no definido';
    const etiqueta = `${p.etiqueta}${e === 'si' ? ' + E (prevención de caídas)' : e === 'indeterminado' ? ' · prevención de caídas por determinar' : ''}`;
    const sugerencias = e === 'si' ? MEDIDAS_E
      : e === 'indeterminado' ? [`Completar ${sinMedir.map((id) => (id === 'tug' ? 'el TUG' : 'la velocidad de marcha en 6 m')).join(' y ')} para decidir si se añade el programa E.`]
        : [];
    return {
      banda: { id: base || 'indef', etiqueta, nivel: p.nivel, hallazgo: false, texto: base ? `Programa sugerido: ${programa}.` : INDEFINIDO.texto, sugerencias },
      mostrar: base ? `${base}${e === 'si' ? '+E' : ''}` : '—',
      sufijo: base ? (e === 'indeterminado' ? 'programa · E por determinar' : 'programa') : 'programa no definido',
      lineas,
      extras: { programa, e, presentes, sinMedir, sppb: s },
    };
  },
  resumen(res) {
    const { programa, e, sinMedir, sppb } = res.extras;
    const pend = e === 'indeterminado' ? `; prevención de caídas (E) por determinar: falta ${sinMedir.map((id) => NOMBRES_CRITERIO[id]).join(' y ')}` : '';
    return `Vivifrail: ${programa === 'no definido' ? 'programa no definido por el algoritmo (SPPB 7–9, camina menos de 10 min)' : `programa ${programa}`} (SPPB ${sppb})${pend}.`;
  },
  resumenBreve(res) {
    const { programa, e } = res.extras;
    return `Vivifrail ${programa === 'no definido' ? 'programa no definido' : `programa ${programa}`}${e === 'indeterminado' ? ' (E por determinar)' : ''}`;
  },
  detalleEnResumen: true,
  notas: [
    'Clasificación de Vivifrail: SPPB 0–3 programa A, 4–6 B, 7–9 C (C1 si camina de 10 a 30 min, C2 si de 30 a 45 min), 10–12 D. Con uno o más criterios de riesgo de caídas se añade el programa E.',
    'Criterios de riesgo elevado de caídas: 2 o más caídas en el último año o 1 que requirió atención médica; TUG mayor de 20 s; velocidad de marcha en 6 m menor de 0.8 m/s; demencia.',
    'Vivifrail también usa la velocidad de marcha en 6 m para apoyar el nivel funcional (<0.5, 0.5–0.8, 0.9–1 y >1 m/s).',
    'Huella no usa datos de otras pruebas sin que los confirmes, y muestra su fecha. Verifica que no haya contraindicaciones para el ejercicio y adapta la intensidad a la persona.',
    'Los materiales de Vivifrail tienen todos los derechos reservados; descárgalos gratuitamente en el sitio oficial.',
  ],
  licencia: { texto: '© Mikel Izquierdo y consorcio Vivifrail (Erasmus+ 556988-EPP-1-2014-1-ES-SPO-SCP). Todos los derechos reservados.', enlace: ENLACE },
  referencias: [
    { texto: 'Izquierdo M, Casas-Herrero A, Zambom-Ferraresi F, Martínez-Velilla N, Alonso-Bouzón C, Rodríguez-Mañas L. Programa de ejercicio físico multicomponente Vivifrail: guía práctica para la prescripción de un programa de entrenamiento físico multicomponente para la prevención de la fragilidad y caídas en mayores de 70 años. 2017.', enlace: ENLACE },
  ],
};
