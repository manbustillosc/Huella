// Tinetti POMA-28: registro de las subescalas de equilibrio (0–16) y marcha (0–12). La traducción al español
// se hizo con permiso de la autora; Huella no reproduce los reactivos.
import { SUG } from './_comun.js';

export default {
  id: 'tinetti',
  nombre: 'Escala de Tinetti de equilibrio y marcha (POMA-28)',
  corto: 'Tinetti',
  dominio: 'caidas',
  tipo: 'desempeno',
  registro: true,
  aliases: ['POMA', 'Performance Oriented Mobility Assessment', 'equilibrio y marcha', 'Tinetti'],
  problemas: ['caídas', 'equilibrio', 'marcha', 'inestabilidad', 'miedo a caer'],
  descripcion: 'Registro de las subescalas de equilibrio (9 reactivos, 0 a 16) y marcha (7 reactivos, 0 a 12); total de 0 a 28.',
  objetivo: 'Describir alteraciones del equilibrio y la marcha y estimar el riesgo de caídas.',
  poblacion: 'Personas mayores en la comunidad, consulta y rehabilitación (Tinetti, 1986). Validada en español en población colombiana (Rodríguez y Lugo, 2012).',
  aplicacion: [
    'Aplica la versión de 28 puntos con su hoja oficial: 9 reactivos de equilibrio (máximo 16) y 7 de marcha (máximo 12). Huella no reproduce los reactivos.',
    'Registra el subtotal de cada subescala; el total se calcula solo.',
    'No mezcles versiones: otras variantes (por ejemplo, de 40 puntos o con reactivos distintos) tienen puntos de corte diferentes.',
  ],
  tiempo: '10 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor equilibrio y marcha',
  textoEmpeoramiento: 'peor equilibrio y marcha',
  min: 0,
  max: 28,
  campos: [
    { id: 'equilibrio', tipo: 'numero', texto: 'Subescala de equilibrio (0 a 16)', textoCorto: 'equilibrio', unidad: 'de 16', min: 0, max: 16, entero: true },
    { id: 'marcha', tipo: 'numero', texto: 'Subescala de marcha (0 a 12)', textoCorto: 'marcha', unidad: 'de 12', min: 0, max: 12, entero: true },
    {
      id: 'ayuda', texto: '¿Usó auxiliar de la marcha durante la prueba?', textoCorto: 'auxiliar de la marcha', puntua: false,
      opciones: [{ texto: 'No', valor: 0, clave: 'no' }, { texto: 'Sí', valor: 1, clave: 'si' }],
    },
  ],
  bandas: [
    {
      min: 0, max: 18, etiqueta: 'Riesgo alto de caídas', nivel: 'grave', hallazgo: true,
      texto: 'Puntaje menor de 19: riesgo alto de caídas según los puntos de corte citados por la validación en español.',
      sugerencias: [SUG.caidas, SUG.ejercicio, 'Valorar auxiliar de la marcha y fisioterapia para entrenamiento de equilibrio y marcha.'],
    },
    {
      min: 19, max: 24, etiqueta: 'Riesgo de caídas', nivel: 'moderado', hallazgo: true,
      texto: 'Puntaje de 19 a 24: riesgo de caídas menor que en el rango alto, pero presente.',
      sugerencias: [SUG.caidas, SUG.ejercicio],
    },
    {
      min: 25, max: 28, etiqueta: 'Por encima de los puntos de corte de riesgo', nivel: 'bien',
      texto: 'Puntaje de 25 a 28: no alcanza los puntos de corte de riesgo. No descarta riesgo si hay caídas previas u otros factores.',
      sugerencias: [],
    },
  ],
  calcular({ v }) {
    const puntaje = v.equilibrio + v.marcha;
    const lineas = [`Equilibrio ${v.equilibrio}/16; marcha ${v.marcha}/12.`];
    if (v.ayuda.clave === 'si') lineas.push('Se usó auxiliar de la marcha: compáralo con aplicaciones en las mismas condiciones.');
    return { puntaje, lineas, lineasNota: lineas, extras: { equilibrio: v.equilibrio, marcha: v.marcha, ayuda: v.ayuda.clave === 'si' } };
  },
  comparable(antes, despues) {
    const a = antes.extras?.ayuda;
    const d = despues.extras?.ayuda;
    return a != null && d != null && a !== d ? { advertencia: 'Una aplicación se hizo con auxiliar de la marcha y la otra sin él.' } : null;
  },
  cambioExtra(antes, despues) {
    const a = antes.extras;
    const d = despues.extras;
    if (a?.equilibrio == null || d?.equilibrio == null) return [];
    return [`Equilibrio de ${a.equilibrio} a ${d.equilibrio}; marcha de ${a.marcha} a ${d.marcha}.`];
  },
  detalleEnResumen: true,
  notas: [
    'Puntos de corte: menor de 19, riesgo alto; 19 a 24, riesgo de caídas (Rodríguez y Lugo, 2012, que citan a Di Fabio y Seay, 1997). Otros materiales usan cortes distintos (por ejemplo, ≤18, 19–23 y ≥24); no se combinan.',
    'Su capacidad para predecir caídas es moderada: el riesgo de caídas es multifactorial y no se descarta con un puntaje alto.',
    'Las subescalas describen el perfil: equilibrio bajo con marcha conservada y viceversa orientan intervenciones distintas.',
    'La traducción al español se hizo con permiso de la Dra. Tinetti; usa la hoja oficial de la versión de 28 puntos.',
  ],
  licencia: { texto: 'Performance Oriented Mobility Assessment © Mary E. Tinetti. Huella registra solo los subtotales.' },
  referencias: [
    { texto: 'Tinetti ME. Performance-oriented assessment of mobility problems in elderly patients. J Am Geriatr Soc. 1986;34(2):119-26.', doi: '10.1111/j.1532-5415.1986.tb05480.x' },
    { texto: 'Rodríguez Guevara C, Lugo LH. Validez y confiabilidad de la Escala de Tinetti para población colombiana. Rev Colomb Reumatol. 2012;19(4):218-33.', doi: '10.1016/S0121-8123(12)70017-8' },
  ],
};
