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
// MET estimados con la fórmula de Hlatky (VO₂ / 3.5). El umbral de 34 es pronóstico (estudio METS), no una conversión:
// 34 puntos corresponden a ≈6.9 MET estimados, no a 4.
export const metDeDasi = (d) => vo2DeDasi(d) / 3.5;

// Criterio de la guía internacional (AHA/ACC 2024): DASI ≤34 forma parte de la capacidad funcional baja (con <4 MET).
const BAJO = {
  id: 'bajo', rango: '34 o menos', etiqueta: 'Capacidad funcional baja, DASI ≤34', nivel: 'moderado', hallazgo: true,
  texto: 'DASI de 34 o menos: la guía AHA/ACC 2024 lo incluye en la capacidad funcional baja. En el estudio METS, los puntajes ≤34 se asociaron con más muerte o infarto a 30 días tras cirugía no cardiaca en pacientes de riesgo cardiaco elevado.',
  sugerencias: [
    'Integrar la capacidad funcional con el riesgo clínico (RCRI), la condición cardiaca y el tipo de cirugía según la guía AHA/ACC 2024; no se combina en un riesgo único.',
    'Un DASI bajo no es por sí solo indicación de prueba de esfuerzo: los estudios adicionales se piden solo si su resultado cambiaría el manejo.',
    'Valorar fragilidad y desempeño físico (CFS, SPPB) si la limitación no se explica por la enfermedad cardiaca o pulmonar.',
  ],
};
const ALTO = {
  id: 'alto', rango: 'Más de 34', etiqueta: 'Capacidad funcional por encima del umbral, DASI >34', nivel: 'bien',
  texto: 'DASI mayor de 34: por encima del umbral de capacidad funcional baja de la guía AHA/ACC 2024. En el estudio METS, los puntajes más altos se asociaron con menos muerte o lesión miocárdica a 30 días y menos muerte o discapacidad nueva al año.',
  sugerencias: [],
};

// Banda según la guía AHA/ACC 2024 (≤34 baja). Se redondea a centésimas, la precisión del puntaje.
export function bandaDasi(d) {
  const x = Number(Number(d).toFixed(2));
  return x <= UMBRAL_DASI ? BAJO : ALTO;
}

// Criterio institucional: el lineamiento de VPO del IMSS (2026, cuadro 3) usa <34 como mayor riesgo y ≥34 como menor
// riesgo. Solo difiere de la guía con 34 exactos; entonces Huella lo señala.
export function difiereLineamiento(d) {
  return Number(Number(d).toFixed(2)) === UMBRAL_DASI;
}
export const TEXTO_DIFERENCIA_DASI = 'Con 34 puntos exactos los criterios difieren: la guía AHA/ACC 2024 incluye 34 en la capacidad funcional baja (≤34), y el lineamiento de VPO del IMSS (2026, cuadro 3) lo clasifica como menor riesgo (≥34). Huella usa el criterio de la guía.';

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
    const met = metDeDasi(dasi);
    const si = ACTIVIDADES.filter((a) => v[a.id].valor > 0).map((a) => a.textoCorto);
    const no = ACTIVIDADES.filter((a) => v[a.id].valor === 0).map((a) => a.textoCorto);
    const difiere = difiereLineamiento(dasi);
    const lineas = [
      `VO₂ pico estimado ${fmt(vo2)} mL/kg/min; ${fmt(met)} MET estimados (fórmula de Hlatky; no equivale a una prueba de esfuerzo cardiopulmonar, y el umbral de 34 no es una conversión a 4 MET).`,
      ...(difiere ? [TEXTO_DIFERENCIA_DASI] : []),
      no.length ? `No puede: ${no.join(', ')}.` : 'Puede realizar las 12 actividades.',
    ];
    return {
      valor: dasi,
      mostrar: fmt(dasi, 2),
      unidad: 'puntos',
      sufijo: `/ ${MAX_DASI} puntos`,
      banda: bandaDasi(dasi),
      lineas,
      lineasNota: [`VO₂ pico estimado ${fmt(vo2)} mL/kg/min; ${fmt(met)} MET estimados (fórmula de Hlatky).`, ...(difiere ? [TEXTO_DIFERENCIA_DASI] : []), lineas.at(-1)],
      extras: { vo2: Number(vo2.toFixed(1)), met: Number(met.toFixed(1)), puede: si, difiereLineamiento: difiere },
    };
  },
  resumen: (res) => `DASI: ${res.mostrar}/${MAX_DASI} (${res.banda.id === 'bajo' ? 'capacidad funcional baja, ≤34' : 'mayor de 34'}); ${fmt(res.extras.met)} MET estimados.`,
  resumenBreve: (res) => `DASI ${res.mostrar} (${res.banda.id === 'bajo' ? '≤34' : '>34'}; ${fmt(res.extras.met)} MET estimados)`,
  detalleEnResumen: true,
  notas: [
    'Guía AHA/ACC 2024: en cirugía no cardiaca de riesgo elevado es razonable una evaluación estructurada de la capacidad funcional, como el DASI, para estratificar el riesgo de eventos cardiovasculares perioperatorios (clase 2a, nivel B-NR). La guía considera capacidad funcional baja <4 MET o DASI ≤34.',
    'Umbral de 34 del estudio METS (Wijeysundera, 2020): desenlaces a 30 días y a 1 año en adultos con riesgo cardiaco elevado y cirugía no cardiaca con hospitalización. Es un umbral pronóstico, no una equivalencia con 4 MET.',
    'Criterio institucional: el lineamiento de VPO del IMSS (agosto 2026, cuadro 3, p. 12) usa <34 como mayor riesgo y ≥34 como menor riesgo, y los describe como equivalentes a <4 y ≥4 MET. Con la fórmula de Hlatky, 34 puntos son ≈6.9 MET estimados. Solo con 34 exactos difiere de la guía; Huella lo señala y usa el criterio de la guía.',
    'Los MET se estiman con una fórmula derivada en 50 personas (VO₂ = 0.43 × DASI + 9.6; MET = VO₂ / 3.5): son aproximados y no sustituyen una prueba de esfuerzo cardiopulmonar.',
    'Un DASI aislado no indica una prueba de esfuerzo: se integra con la condición cardiaca, el riesgo del procedimiento y el RCRI, y los estudios se piden solo si cambiarían el manejo.',
    'Es autorreferido: la limitación por dolor articular, deterioro cognitivo o falta de oportunidad (p. ej., no tener jardín) reduce el puntaje sin reflejar la capacidad cardiorrespiratoria.',
  ],
  referencias: [
    { texto: 'Hlatky MA, Boineau RE, Higginbotham MB, et al. A brief self-administered questionnaire to determine functional capacity (the Duke Activity Status Index). Am J Cardiol. 1989;64(10):651-4.', doi: '10.1016/0002-9149(89)90496-7' },
    { texto: 'Wijeysundera DN, Beattie WS, Hillis GS, et al. Integration of the Duke Activity Status Index into preoperative risk evaluation: a multicentre prospective cohort study. Br J Anaesth. 2020;124(3):261-70.', doi: '10.1016/j.bja.2019.11.025' },
    { texto: 'Thompson A, Fleischmann KE, Smilowitz NR, et al. 2024 AHA/ACC/ACS/ASNC/HRS/SCA/SCCT/SCMR/SVM Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery. Circulation. 2024;150(19):e351-e442. Secciones 3.2 y 4.5.', doi: '10.1161/CIR.0000000000001285' },
    { texto: 'Instituto Mexicano del Seguro Social, Dirección de Prestaciones Médicas. Lineamiento para Valoración Preoperatoria para Cirugía Electiva no Cardiaca. México: IMSS; agosto 2026. Cuadro 3, p. 12.' },
  ],
};
