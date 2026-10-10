// Duke Activity Status Index (Hlatky, 1989): 12 actividades con su peso; estimación de VO₂ pico y MET.
import { fmt } from '../js/motor.js';

const ACTIVIDADES = [
  ['cuidado', '¿Puede cuidarse solo (comer, vestirse, bañarse o usar el sanitario)?', 'cuidado personal', 2.75],
  ['casa', '¿Puede caminar dentro de su casa?', 'caminar en casa', 1.75],
  ['cuadras', '¿Puede caminar una o dos cuadras en terreno plano?', 'caminar 1 a 2 cuadras', 2.75],
  ['escaleras', '¿Puede subir un piso de escaleras o caminar cuesta arriba?', 'subir escaleras o cuesta arriba', 5.5],
  ['correr', '¿Puede correr una distancia corta?', 'correr una distancia corta', 8],
  ['ligero', '¿Puede hacer trabajo ligero en casa (sacudir, lavar platos)?', 'trabajo ligero en casa', 2.7],
  ['moderado', '¿Puede hacer trabajo moderado en casa (barrer, aspirar, cargar el mandado)?', 'trabajo moderado en casa', 3.5],
  ['pesado', '¿Puede hacer trabajo pesado en casa (tallar pisos, levantar o mover muebles pesados)?', 'trabajo pesado en casa', 8],
  ['jardin', '¿Puede hacer trabajo de jardín (rastrillar hojas, deshierbar, empujar una podadora)?', 'trabajo de jardín', 4.5],
  ['sexual', '¿Puede tener relaciones sexuales?', 'relaciones sexuales', 5.25],
  ['recreacion', '¿Puede hacer actividades recreativas moderadas (golf, boliche, baile, tenis en dobles, lanzar una pelota)?', 'recreación moderada', 6],
  ['deporte', '¿Puede practicar deportes extenuantes (nadar, tenis individual, fútbol, básquetbol, esquí)?', 'deporte extenuante', 7.5],
].map(([id, texto, textoCorto, peso]) => ({ id, texto, textoCorto, peso }));

export const MAX_DASI = 58.2;
export const vo2DeDasi = (d) => 0.43 * d + 9.6;
export const UMBRAL_DASI = 34;

const BAJO = {
  id: 'bajo', rango: 'Menos de 34', etiqueta: 'Capacidad funcional por debajo del umbral de 34', nivel: 'moderado', hallazgo: true,
  texto: 'DASI menor de 34: en el estudio METS se asoció con más muerte o infarto a 30 días y más complicaciones moderadas a graves tras cirugía no cardiaca en pacientes de riesgo cardiaco elevado.',
  sugerencias: [
    'Integrar la capacidad funcional con el riesgo clínico (RCRI) y el tipo de cirugía según la guía AHA/ACC 2024; no se combina en un riesgo único.',
    'Valorar fragilidad y desempeño físico (CFS, SPPB) si la limitación no se explica por la enfermedad cardiaca o pulmonar.',
  ],
};
const ALTO = {
  id: 'alto', rango: '34 o más', etiqueta: 'Capacidad funcional en o por encima del umbral de 34', nivel: 'bien',
  texto: 'DASI de 34 o más: en el estudio METS, cada punto por encima de 34 se asoció con menos muerte o lesión miocárdica a 30 días y menos muerte o discapacidad nueva al año.',
  sugerencias: [],
};

export default {
  id: 'dasi',
  nombre: 'Índice de estado de actividad de Duke (DASI)',
  corto: 'DASI',
  dominio: 'prequirurgica',
  tipo: 'evaluacion',
  aliases: ['Duke Activity Status Index', 'capacidad funcional', 'equivalentes metabolicos', 'MET', 'METs'],
  problemas: ['cirugía', 'preoperatorio', 'capacidad funcional', 'disnea', 'insuficiencia cardiaca'],
  descripcion: 'Doce actividades de la vida diaria con su peso: puntaje de 0 a 58.2, VO₂ pico y MET estimados.',
  objetivo: 'Estimar la capacidad funcional autorreferida, en especial para la evaluación preoperatoria de cirugía no cardiaca.',
  poblacion: 'Adultos con sospecha o diagnóstico de enfermedad cardiovascular (Hlatky, 1989); en cirugía no cardiaca, adultos de 40 años o más con riesgo cardiaco elevado (Wijeysundera, 2020).',
  aplicacion: [
    'Pregunta si puede hacer cada actividad, no si la hace: la limitación debe ser por síntomas o capacidad física.',
    'Cada «sí» suma su peso; Huella calcula el puntaje, el VO₂ pico y los MET estimados.',
  ],
  tiempo: '3 a 5 min',
  fuente: true,
  direccionClinica: 'mayor_mejor',
  decimalesCambio: 2,
  textoMejoria: 'mayor capacidad funcional referida',
  textoEmpeoramiento: 'menor capacidad funcional referida',
  barra: false,
  min: 0,
  max: MAX_DASI,
  campos: ACTIVIDADES.map((a) => ({
    id: a.id, texto: a.texto, textoCorto: a.textoCorto, puntua: false, compacto: true,
    opciones: [{ texto: 'Sí', valor: a.peso }, { texto: 'No', valor: 0 }],
  })),
  bandas: [BAJO, ALTO],
  calcular({ v }) {
    const dasi = Number(ACTIVIDADES.reduce((s, a) => s + v[a.id].valor, 0).toFixed(2));
    const vo2 = vo2DeDasi(dasi);
    const met = vo2 / 3.5;
    const si = ACTIVIDADES.filter((a) => v[a.id].valor > 0).map((a) => a.textoCorto);
    const no = ACTIVIDADES.filter((a) => v[a.id].valor === 0).map((a) => a.textoCorto);
    const lineas = [
      `VO₂ pico estimado ${fmt(vo2)} mL/kg/min; ${fmt(met)} MET estimados (fórmula de Hlatky; no equivale a una prueba de esfuerzo cardiopulmonar).`,
      no.length ? `No puede: ${no.join(', ')}.` : 'Puede realizar las 12 actividades.',
    ];
    return {
      valor: dasi,
      mostrar: fmt(dasi, 2),
      unidad: 'puntos',
      sufijo: `/ ${MAX_DASI} puntos`,
      banda: dasi < UMBRAL_DASI ? BAJO : ALTO,
      lineas,
      lineasNota: [`VO₂ pico estimado ${fmt(vo2)} mL/kg/min (fórmula de Hlatky).`, lineas[1]],
      extras: { vo2: Number(vo2.toFixed(1)), met: Number(met.toFixed(1)), puede: si },
    };
  },
  resumen: (res) => `DASI: ${res.mostrar}/${MAX_DASI} (${res.valor < UMBRAL_DASI ? 'menor de 34' : '34 o más'}); ${fmt(res.extras.met)} MET estimados.`,
  resumenBreve: (res) => `DASI ${res.mostrar} (${res.valor < UMBRAL_DASI ? '<34' : '≥34'}; ${fmt(res.extras.met)} MET estimados)`,
  detalleEnResumen: true,
  notas: [
    'Guía AHA/ACC 2024: en cirugía no cardiaca de riesgo elevado es razonable una evaluación estructurada de la capacidad funcional, como el DASI, para estratificar el riesgo de eventos cardiovasculares perioperatorios (clase 2a, nivel B-NR).',
    'Umbral de 34 del estudio METS (Wijeysundera, 2020): desenlaces a 30 días y a 1 año en adultos con riesgo cardiaco elevado y cirugía no cardiaca con hospitalización.',
    'Los MET se estiman con una fórmula derivada en 50 personas (VO₂ = 0.43 × DASI + 9.6): son aproximados y no sustituyen una prueba de esfuerzo cardiopulmonar.',
    'Es autorreferido: la limitación por dolor articular, deterioro cognitivo o falta de oportunidad (p. ej., no tener jardín) reduce el puntaje sin reflejar la capacidad cardiorrespiratoria.',
  ],
  referencias: [
    { texto: 'Hlatky MA, Boineau RE, Higginbotham MB, et al. A brief self-administered questionnaire to determine functional capacity (the Duke Activity Status Index). Am J Cardiol. 1989;64(10):651-4.', doi: '10.1016/0002-9149(89)90496-7' },
    { texto: 'Wijeysundera DN, Beattie WS, Hillis GS, et al. Integration of the Duke Activity Status Index into preoperative risk evaluation: a multicentre prospective cohort study. Br J Anaesth. 2020;124(3):261-70.', doi: '10.1016/j.bja.2019.11.025' },
    { texto: 'Thompson A, Fleischmann KE, Smilowitz NR, et al. 2024 AHA/ACC/ACS/ASNC/HRS/SCA/SCCT/SCMR/SVM Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery. Circulation. 2024;150(19):e351-e442.', doi: '10.1161/CIR.0000000000001285' },
  ],
};
