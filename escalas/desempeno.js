// Desempeño físico (versión 2.11): cinco levantadas de la silla, caminata de 6 minutos, caminata de 400 m,
// apoyo en un pie y alcance funcional. Pruebas sin titular de derechos; puntos de corte de las fuentes citadas.
import { SUG } from './_comun.js';
import { puntosSilla } from './sppb.js';
import { REF_ICOPE } from './icope.js';

const minus = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const si = (b) => (b ? 'Sí' : 'No');
const fmt1 = (x) => Number(x.toFixed(1)).toString();
const SEXO = { id: 'sexo', texto: 'Sexo', textoCorto: 'sexo', puntua: false, prefill: 'sexo', opciones: [{ texto: 'Mujer', valor: 1, clave: 'mujer' }, { texto: 'Hombre', valor: 0, clave: 'hombre' }] };
const EDAD = { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad' };
const REF_EWGSOP2 = { texto: 'Cruz-Jentoft AJ, Bahat G, Bauer J, et al. Sarcopenia: revised European consensus on definition and diagnosis. Age Ageing. 2019;48(1):16-31.', doi: '10.1093/ageing/afy169' };
const SEGURIDAD_CAMINATA = 'No la apliques con angina inestable o infarto en el último mes; valora con cautela si la frecuencia cardiaca en reposo es mayor de 120 lpm o la presión mayor de 180/100 mm Hg. Detén la prueba ante dolor torácico, disnea intolerable, calambres, mareo, sudoración o palidez.';

/* ---------- Cinco levantadas de la silla ---------- */

// Promedio por edad (Bohannon, 2006): tiempos mayores son peores que el promedio.
export const PROMEDIO_SILLA5 = [[60, 69, 11.4], [70, 79, 12.6], [80, 89, 14.8]];
export const promedioSilla5 = (edad) => PROMEDIO_SILLA5.find(([a, b]) => edad >= a && edad <= b)?.[2] ?? null;
export const CORTE_SILLA5 = { ewgsop2: 15, awgs: 12, icope: 14 };

const B_S5 = {
  normal: { id: 'normal', rango: '15 s o menos', etiqueta: 'Sin fuerza baja según el EWGSOP2', nivel: 'bien', texto: '15 segundos o menos: la fuerza de las piernas no está baja según el EWGSOP2. Revisa los otros puntos de corte y el promedio para su edad.', sugerencias: [] },
  baja: {
    id: 'baja', rango: 'Más de 15 s', etiqueta: 'Fuerza de las piernas baja según el EWGSOP2', nivel: 'moderado', hallazgo: true,
    texto: 'Más de 15 segundos: fuerza muscular baja según el EWGSOP2 (sarcopenia probable). La confirmación requiere medir la cantidad o la calidad muscular.',
    sugerencias: ['Completar el algoritmo de sarcopenia (EWGSOP2): masa muscular y desempeño.', SUG.ejercicio, SUG.caidas],
  },
  incapaz: {
    id: 'incapaz', rango: 'No la completa', etiqueta: 'No completa las 5 levantadas', nivel: 'grave', hallazgo: true,
    texto: 'No logra 5 levantadas sin usar los brazos (o tarda más de 60 s): fuerza de las piernas muy disminuida; en el SPPB este componente puntúa 0.',
    sugerencias: ['Completar el algoritmo de sarcopenia (EWGSOP2) y buscar la causa de la debilidad.', SUG.rehabilitacion, SUG.caidas],
  },
};

export const silla5 = {
  id: 'silla5',
  nombre: 'Pararse y sentarse 5 veces de la silla (cinco levantadas)',
  corto: 'Silla 5 veces',
  dominio: 'desempeno',
  tipo: 'desempeno',
  aliases: ['Five Times Sit to Stand', 'FTSST', '5xSTS', '5STS', 'chair stand test', 'prueba de la silla', 'levantarse de la silla', 'pararse y sentarse', 'sentarse y pararse', '15 segundos', 'sit to stand', 'fuerza de piernas', 'sarcopenia'],
  problemas: ['sarcopenia', 'debilidad', 'caídas', 'fragilidad', 'fuerza de las piernas'],
  descripcion: 'Tiempo para pararse y sentarse 5 veces lo más rápido posible sin usar los brazos; más de 15 segundos indica fuerza baja de las piernas (EWGSOP2).',
  objetivo: 'Medir la fuerza de las piernas para el tamizaje de sarcopenia, fragilidad y riesgo de caídas, y seguir su evolución.',
  poblacion: 'Personas mayores capaces de levantarse de una silla sin ayuda de otra persona. Punto de corte del EWGSOP2 (Cruz-Jentoft, 2019); promedio por edad de Bohannon (2006).',
  aplicacion: [
    'Silla firme sin descansabrazos, de 43 a 47 cm de altura, apoyada contra la pared. Antes, pide que se levante una vez con los brazos cruzados sobre el pecho; si no puede, no se hace la prueba.',
    'Sentada con la espalda apoyada, los pies en el suelo y los brazos cruzados: «Levántese por completo y siéntese 5 veces, lo más rápido que pueda, sin usar los brazos».',
    'Cronometra desde la señal hasta que se pone de pie por quinta vez (protocolo del SPPB y del EWGSOP2). Quédate cerca por seguridad.',
    'Si usa los brazos, no completa las 5 levantadas o tarda más de 60 segundos, registra que no la completó.',
  ],
  tiempo: '1 a 2 min',
  momentos: true,
  barra: false,
  direccionClinica: 'menor_mejor',
  unidadCambio: 's',
  decimalesCambio: 1,
  textoMejoria: 'menos tiempo para las 5 levantadas',
  textoEmpeoramiento: 'más tiempo para las 5 levantadas',
  vinculos: [
    {
      id: 'sppb', escala: 'sppb', titulo: 'Silla del SPPB',
      disponible: (res) => (Number.isFinite(res.extras?.tiempoSilla) ? true : 'El SPPB guardado no tiene el tiempo de 5 levantadas.'),
      describir: (res) => `Cinco levantadas en ${res.extras.tiempoSilla} s (SPPB)`,
      aplicar: (res) => ({ estado: 0, tiempo: String(res.extras.tiempoSilla) }),
      campos: ['estado', 'tiempo'],
    },
  ],
  campos: [
    EDAD,
    {
      id: 'estado', texto: '¿Completó las 5 levantadas sin usar los brazos?', textoCorto: 'realización', puntua: false,
      opciones: [
        { texto: 'Sí', valor: 1 },
        { texto: 'No: usó los brazos, no completó las 5 o tardó más de 60 s', valor: 0, clave: 'incapaz' },
        { texto: 'No se intentó por seguridad o no logra levantarse una vez', valor: 0, clave: 'seguridad' },
      ],
    },
    { id: 'tiempo', tipo: 'numero', texto: 'Tiempo para las 5 levantadas', unidad: 's', min: 2, max: 60, decimales: 2, visibleSi: (r) => r.estado === 0 },
  ],
  bandas: [B_S5.normal, B_S5.baja, B_S5.incapaz],
  calcular({ v }) {
    const prom = promedioSilla5(v.edad);
    if (v.estado.valor === 0) {
      const seguridad = v.estado.clave === 'seguridad';
      const lineas = [seguridad ? 'No se intentó por seguridad o no logra levantarse una vez.' : 'No completó las 5 levantadas sin usar los brazos en 60 segundos.'];
      return { banda: B_S5.incapaz, mostrar: '—', sufijo: seguridad ? 'No se intentó' : 'No la completa', lineas, lineasNota: lineas, extras: { incapaz: true, seguridad, puntosSppb: 0, promedio: prom } };
    }
    const t = v.tiempo;
    const banda = t > CORTE_SILLA5.ewgsop2 ? B_S5.baja : B_S5.normal;
    const pts = puntosSilla(t);
    const lineas = [`${t} s para 5 levantadas sin usar los brazos (equivale a ${pts} de 4 puntos en el SPPB).`];
    if (prom != null) lineas.push(`Promedio para ${v.edad} años (Bohannon, 2006): ${prom} s; este tiempo es ${t > prom ? 'peor que el promedio' : 'igual o mejor que el promedio'}.`);
    if (t > CORTE_SILLA5.icope && t <= CORTE_SILLA5.ewgsop2) lineas.push('Más de 14 s: en el tamizaje ICOPE indica revisar la capacidad locomotora, aunque no cumple el corte de fuerza baja del EWGSOP2.');
    return {
      valor: t, unidad: 's', mostrar: String(t), sufijo: 'segundos', banda, lineas, lineasNota: lineas,
      detalles: [{
        titulo: 'Puntos de corte según el objetivo',
        encabezados: ['Objetivo', 'Fuente y criterio', 'Este resultado'],
        filas: [
          ['Fuerza baja (sarcopenia probable)', 'EWGSOP2, 2019: más de 15 s', si(t > CORTE_SILLA5.ewgsop2)],
          ['Tamizaje de la capacidad locomotora', 'ICOPE (OMS y OPS, 2025): más de 14 s', si(t > CORTE_SILLA5.icope)],
          ['Desempeño bajo en población asiática', 'AWGS, 2019: 12 s o más', si(t >= CORTE_SILLA5.awgs)],
          ['Puntos del SPPB', 'Guralnik, 1994: ≤11.19 s = 4; 11.20–13.69 = 3; 13.70–16.69 = 2; 16.70–60 = 1', `${pts} de 4`],
          ['Promedio para la edad', 'Bohannon, 2006: 11.4 s (60–69), 12.6 s (70–79), 14.8 s (80–89)', prom == null ? 'Sin valor para su edad' : t > prom ? 'Peor que el promedio' : 'En el promedio o mejor'],
        ],
      }],
      extras: { segundos: t, incapaz: false, bajaEwgsop2: t > CORTE_SILLA5.ewgsop2, puntosSppb: pts, promedio: prom },
    };
  },
  resumen(res) {
    if (res.extras.incapaz) return `Silla 5 veces: ${res.extras.seguridad ? 'no se intentó por seguridad' : 'no completa las 5 levantadas sin brazos'} (${minus(res.banda.etiqueta)}).`;
    return `Silla 5 veces: ${res.valor} s (${minus(res.banda.etiqueta)}; ${res.extras.puntosSppb}/4 en el SPPB).`;
  },
  resumenBreve: (res) => (res.extras.incapaz ? 'Silla 5 veces: no la completa' : `Silla 5 veces ${res.valor} s`),
  detalleEnResumen: true,
  siguientes: [
    { id: 'ewgsop2', si: (res) => !res.noEvaluable && (res.extras?.bajaEwgsop2 || res.extras?.incapaz), motivo: 'Fuerza baja: completar el algoritmo de sarcopenia (masa muscular y desempeño).' },
  ],
  notas: [
    'Puntos de corte: EWGSOP2, más de 15 s es fuerza baja; ICOPE, más de 14 s en el tamizaje de la capacidad locomotora; AWGS 2019, 12 s o más (población asiática). No son intercambiables: Huella clasifica con el del EWGSOP2 y muestra los demás.',
    'El tiempo termina al ponerse de pie la quinta vez, como en el SPPB y el EWGSOP2; si termina al sentarse, el tiempo es un poco mayor.',
    'No se encontró una versión validada que cuente repeticiones en 15 segundos: 15 s es el punto de corte del tiempo de 5 levantadas. La prueba de 30 segundos (Silla 30 s) cuenta repeticiones y tiene otros valores.',
    'Valores europeos por percentiles (Grgic, 2025; 45 470 personas de 50 años o más): la mediana es de 15 s a partir de los 85 años en mujeres y de los 90 en hombres.',
    'Una silla más baja, el cansancio por otras pruebas previas y el dolor de rodilla o cadera alargan el tiempo.',
  ],
  referencias: [
    REF_EWGSOP2,
    { texto: 'Chen LK, Woo J, Assantachai P, et al. Asian Working Group for Sarcopenia: 2019 consensus update on sarcopenia diagnosis and treatment. J Am Med Dir Assoc. 2020;21(3):300-307.e2.', doi: '10.1016/j.jamda.2019.12.012' },
    { texto: 'Guralnik JM, Simonsick EM, Ferrucci L, et al. A short physical performance battery assessing lower extremity function: association with self-reported disability and prediction of mortality and nursing home admission. J Gerontol. 1994;49(2):M85-94.', doi: '10.1093/geronj/49.2.m85' },
    { texto: 'Bohannon RW. Reference values for the five-repetition sit-to-stand test: a descriptive meta-analysis of data from elders. Percept Mot Skills. 2006;103(1):215-22.', doi: '10.2466/pms.103.1.215-222' },
    { texto: 'Grgic J, Schoenfeld BJ, Maier AB, Pedisic Z. Reference values for the five-times-sit-to-stand test: a pooled analysis including 45,470 participants from 14 countries. GeroScience. 2025;48(2):3059-67.', doi: '10.1007/s11357-025-01863-8' },
    REF_ICOPE,
  ],
};

/* ---------- Caminata de 6 minutos ---------- */

// Enright y Sherrill (1998): talla en cm, peso en kg, edad en años; límite inferior = esperado − 153 m (hombres) o − 139 m (mujeres).
export function esperado6m(mujer, edad, talla, peso) {
  const esperado = mujer ? 2.11 * talla - 2.29 * peso - 5.78 * edad + 667 : 7.57 * talla - 5.02 * edad - 1.76 * peso - 309;
  return { esperado, limite: esperado - (mujer ? 139 : 153) };
}
export const EDAD_ENRIGHT = { min: 40, max: 80 };

const B_6M = {
  esperada: { id: 'esperada', rango: 'En el límite inferior o por encima', etiqueta: 'Distancia dentro de lo esperado', nivel: 'bien', texto: 'Distancia igual o mayor que el límite inferior esperado para su edad, sexo, talla y peso (Enright y Sherrill, 1998).', sugerencias: [] },
  baja: {
    id: 'baja', rango: 'Por debajo del límite inferior', etiqueta: 'Distancia menor que lo esperado', nivel: 'moderado', hallazgo: true,
    texto: 'Distancia por debajo del límite inferior esperado para su edad, sexo, talla y peso: capacidad de ejercicio disminuida. Busca la causa (cardiaca, respiratoria, musculoesquelética, neurológica o desacondicionamiento).',
    sugerencias: [SUG.ejercicio, 'Correlacionar con síntomas, saturación y frecuencia cardiaca durante la prueba; valorar rehabilitación cardiaca o pulmonar si corresponde.'],
  },
  sinref: { id: 'sinref', rango: 'Sin valor esperado', etiqueta: 'Sin valor esperado calculable', nivel: 'neutro', texto: 'Con estos datos la ecuación no da un valor esperado útil: se registra la distancia sin clasificarla.', sugerencias: [] },
};

export const caminata6 = {
  id: 'caminata6',
  nombre: 'Prueba de caminata de 6 minutos',
  corto: 'Caminata 6 min',
  dominio: 'desempeno',
  tipo: 'desempeno',
  aliases: ['6MWT', 'six-minute walk test', 'six minute walk', 'C6M', 'PC6M', 'TC6M', 'caminata de seis minutos', 'resistencia', 'capacidad funcional', 'distancia recorrida'],
  problemas: ['capacidad funcional', 'resistencia', 'insuficiencia cardiaca', 'EPOC', 'fragilidad', 'preoperatorio'],
  descripcion: 'Distancia que camina en 6 minutos en un pasillo de 30 m, comparada con lo esperado por edad, sexo, talla y peso (Enright y Sherrill, 1998).',
  objetivo: 'Medir la capacidad de ejercicio submáxima y su cambio con el tiempo o tras una intervención.',
  poblacion: 'Protocolo de la ATS (2002). Ecuaciones derivadas en adultos sanos de 40 a 80 años; cambio con significado clínico en personas mayores de Perera (2006).',
  aplicacion: [
    'Pasillo plano de 30 m marcado cada 3 m, con conos en los extremos y una silla cerca. Si es posible, registra frecuencia cardiaca, SpO₂ y disnea antes y al final.',
    'Consigna: «Camine lo más que pueda durante 6 minutos, de ida y vuelta. Puede ir más despacio, detenerse y descansar, y seguir en cuanto pueda». Avisa el tiempo cada minuto; no camines junto a la persona.',
    SEGURIDAD_CAMINATA,
    'Registra la distancia total en metros, aunque la prueba se haya suspendido.',
  ],
  tiempo: '10 min',
  momentos: true,
  barra: false,
  direccionClinica: 'mayor_mejor',
  unidadCambio: 'm',
  decimalesCambio: 0,
  textoMejoria: 'mayor distancia',
  textoEmpeoramiento: 'menor distancia',
  cambioMinimo: { valor: 20, texto: '≈20 m; Perera, 2006' },
  cambioSustancial: { valor: 50, texto: '≈50 m; Perera, 2006' },
  comparable(antes, despues) {
    const a = antes.extras;
    const d = despues.extras;
    if (!a || !d) return null;
    if (a.oxigeno !== d.oxigeno || a.auxiliar !== d.auxiliar) return { advertencia: 'Condiciones distintas (oxígeno o auxiliar de la marcha): compara con cautela.' };
    return null;
  },
  campos: [
    SEXO,
    EDAD,
    { id: 'talla', tipo: 'numero', texto: 'Talla', unidad: 'cm', min: 100, max: 220, decimales: 1 },
    { id: 'peso', tipo: 'numero', texto: 'Peso', unidad: 'kg', min: 25, max: 250, decimales: 1 },
    { id: 'distancia', tipo: 'numero', texto: 'Distancia recorrida en 6 minutos', unidad: 'm', min: 0, max: 1000, entero: true },
    {
      id: 'suspendida', texto: '¿Se suspendió antes de los 6 minutos?', textoCorto: 'suspensión', puntua: false, opcional: true,
      opciones: [{ texto: 'No', valor: 0 }, { texto: 'Sí, por síntomas o seguridad', valor: 1 }],
    },
    {
      id: 'auxiliar', texto: 'Auxiliar de la marcha', textoCorto: 'auxiliar', puntua: false, opcional: true,
      opciones: [{ texto: 'Ninguno', valor: 0 }, { texto: 'Bastón', valor: 1 }, { texto: 'Andadera', valor: 2 }, { texto: 'Otro', valor: 3 }],
    },
    {
      id: 'oxigeno', texto: 'Oxígeno suplementario', textoCorto: 'oxígeno', puntua: false, opcional: true,
      opciones: [{ texto: 'Sin oxígeno', valor: 0 }, { texto: 'Con oxígeno', valor: 1 }],
    },
  ],
  bandas: [B_6M.esperada, B_6M.baja, B_6M.sinref],
  calcular({ v }) {
    const mujer = v.sexo.valor === 1;
    const d = v.distancia;
    const { esperado, limite } = esperado6m(mujer, v.edad, v.talla, v.peso);
    const fuera = v.edad < EDAD_ENRIGHT.min || v.edad > EDAD_ENRIGHT.max;
    const auxiliar = v.auxiliar && v.auxiliar.valor ? v.auxiliar.texto.toLowerCase() : null;
    const oxigeno = v.oxigeno?.valor === 1;
    const lineas = [];
    let banda;
    let pct = null;
    if (esperado <= 100 || limite <= 0) {
      banda = B_6M.sinref;
      lineas.push(`${d} m en 6 minutos. La ecuación de Enright y Sherrill da un valor esperado no útil con estos datos.`);
    } else {
      pct = Math.round((d / esperado) * 100);
      banda = d < limite ? B_6M.baja : B_6M.esperada;
      lineas.push(`${d} m en 6 minutos: ${pct} % del valor esperado.`);
      lineas.push(`Valor esperado (Enright y Sherrill, 1998) para ${mujer ? 'una mujer' : 'un hombre'} de ${v.edad} años, ${fmt1(v.talla)} cm y ${fmt1(v.peso)} kg: ${Math.round(esperado)} m; límite inferior: ${Math.round(limite)} m.`);
      if (fuera) lineas.push(`Las ecuaciones se derivaron en personas de 40 a 80 años: con ${v.edad} años, el valor esperado es una extrapolación; interprétalo con cautela.`);
    }
    if (v.suspendida?.valor === 1) lineas.push('La prueba se suspendió antes de los 6 minutos por síntomas o seguridad.');
    if (auxiliar) lineas.push(`Caminó con ${auxiliar}.`);
    if (oxigeno) lineas.push('Caminó con oxígeno suplementario.');
    return {
      valor: d, unidad: 'm', mostrar: String(d), sufijo: 'metros', banda, lineas, lineasNota: lineas,
      extras: { distancia: d, esperado: Math.round(esperado), limite: Math.round(limite), porcentaje: pct, extrapolado: fuera, auxiliar, oxigeno, suspendida: v.suspendida?.valor === 1 },
    };
  },
  resumen(res) {
    const e = res.extras;
    return `Caminata de 6 minutos: ${e.distancia} m${e.porcentaje != null ? ` (${e.porcentaje} % del esperado)` : ''} (${minus(res.banda.etiqueta)}).`;
  },
  resumenBreve: (res) => `Caminata 6 min ${res.extras.distancia} m`,
  detalleEnResumen: true,
  notas: [
    'Ecuaciones de Enright y Sherrill (1998): hombres = 7.57 × talla (cm) − 5.02 × edad − 1.76 × peso (kg) − 309; mujeres = 2.11 × talla − 2.29 × peso − 5.78 × edad + 667. Límite inferior: 153 m menos en hombres y 139 m menos en mujeres.',
    'Cambio con significado clínico en personas mayores (Perera, 2006): pequeño ≈20 m y sustancial ≈50 m.',
    'La primera prueba suele subestimar la capacidad (efecto de aprendizaje). Compara con las mismas condiciones: pasillo, consigna, oxígeno y auxiliar.',
    'Las ecuaciones se derivaron en adultos de Estados Unidos de 40 a 80 años; en personas mayores de 80 años el valor esperado es una extrapolación.',
  ],
  referencias: [
    { texto: 'ATS Committee on Proficiency Standards for Clinical Pulmonary Function Laboratories. ATS statement: guidelines for the six-minute walk test. Am J Respir Crit Care Med. 2002;166(1):111-7.', doi: '10.1164/ajrccm.166.1.at1102' },
    { texto: 'Enright PL, Sherrill DL. Reference equations for the six-minute walk in healthy adults. Am J Respir Crit Care Med. 1998;158(5 Pt 1):1384-7.', doi: '10.1164/ajrccm.158.5.9710086' },
    { texto: 'Perera S, Mody SH, Woodman RC, Studenski SA. Meaningful change and responsiveness in common physical performance measures in older adults. J Am Geriatr Soc. 2006;54(5):743-9.', doi: '10.1111/j.1532-5415.2006.00701.x' },
  ],
};

/* ---------- Caminata de 400 m ---------- */

export const CORTE_400 = 360; // 6 minutos (EWGSOP2)
export const LIMITE_LIFE_400 = 900; // 15 minutos (estudio LIFE)
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const B_400 = {
  normal: { id: 'normal', rango: 'Menos de 6 min', etiqueta: 'Sin desempeño bajo: menos de 6 min', nivel: 'bien', texto: 'Completa los 400 m en menos de 6 minutos: sin desempeño físico bajo según el EWGSOP2.', sugerencias: [] },
  lenta: {
    id: 'lenta', rango: '6 min o más', etiqueta: 'Desempeño físico bajo: 6 min o más', nivel: 'moderado', hallazgo: true,
    texto: 'Tarda 6 minutos o más en 400 m: desempeño físico bajo según el EWGSOP2. Cada minuto adicional se asoció con más mortalidad, enfermedad cardiovascular y limitación de la movilidad (Newman, 2006).',
    sugerencias: [SUG.ejercicio, 'Si hay fuerza baja, integrar en el algoritmo de sarcopenia (gravedad).'],
  },
  nocompleta: {
    id: 'nocompleta', rango: 'No la completa', etiqueta: 'No completa los 400 m', nivel: 'grave', hallazgo: true,
    texto: 'No completa los 400 m: desempeño físico bajo según el EWGSOP2; se asoció con limitación y discapacidad de la movilidad (Newman, 2006).',
    sugerencias: [SUG.ejercicio, SUG.rehabilitacion, 'Si hay fuerza baja, integrar en el algoritmo de sarcopenia (gravedad).'],
  },
};

export const caminata400 = {
  id: 'caminata400',
  nombre: 'Caminata de 400 metros',
  corto: 'Caminata 400 m',
  dominio: 'desempeno',
  tipo: 'desempeno',
  aliases: ['400-m walk', '400 m walk test', 'long distance corridor walk', 'LDCW', '400 metros', 'resistencia', 'movilidad', 'sarcopenia grave', 'EWGSOP2'],
  problemas: ['sarcopenia', 'movilidad', 'resistencia', 'fragilidad', 'discapacidad'],
  descripcion: 'Caminar 400 m a paso habitual: no completarla o tardar 6 minutos o más indica desempeño físico bajo (EWGSOP2).',
  objetivo: 'Evaluar la capacidad para caminar distancias largas; define desempeño bajo en el algoritmo de sarcopenia y predice limitación de la movilidad y mortalidad.',
  poblacion: 'Personas mayores que caminan sin ayuda de otra persona (estudio Health ABC, 70 a 79 años; Newman, 2006). Punto de corte del EWGSOP2.',
  aplicacion: [
    'Recorrido de 20 m marcado con conos: cada ida y vuelta son 40 m; 10 vueltas son 400 m.',
    'Consigna: caminar a su paso habitual, sin correr. Puede usar bastón y detenerse de pie brevemente si lo necesita; el cronómetro sigue corriendo.',
    SEGURIDAD_CAMINATA,
    'Registra si completó los 400 m y el tiempo total en minutos y segundos.',
  ],
  tiempo: '6 a 15 min',
  momentos: true,
  barra: false,
  direccionClinica: 'menor_mejor',
  unidadCambio: 's',
  decimalesCambio: 0,
  textoMejoria: 'menos tiempo para 400 m',
  textoEmpeoramiento: 'más tiempo para 400 m',
  campos: [
    {
      id: 'completa', texto: '¿Completó los 400 m?', textoCorto: 'realización', puntua: false,
      opciones: [
        { texto: 'Sí', valor: 1 },
        { texto: 'No: se detuvo antes de los 400 m', valor: 0, clave: 'no' },
        { texto: 'No se intentó por seguridad', valor: 0, clave: 'seguridad' },
      ],
    },
    { id: 'minutos', tipo: 'numero', texto: 'Tiempo: minutos', unidad: 'min', min: 2, max: 30, entero: true, visibleSi: (r) => r.completa === 0 },
    { id: 'segundos', tipo: 'numero', texto: 'Tiempo: segundos', unidad: 's', min: 0, max: 59, entero: true, visibleSi: (r) => r.completa === 0 },
    {
      id: 'auxiliar', texto: 'Auxiliar de la marcha', textoCorto: 'auxiliar', puntua: false, opcional: true, visibleSi: (r) => r.completa === 0,
      opciones: [{ texto: 'Ninguno', valor: 0 }, { texto: 'Bastón', valor: 1 }, { texto: 'Otro', valor: 2 }],
    },
  ],
  bandas: [B_400.normal, B_400.lenta, B_400.nocompleta],
  calcular({ v }) {
    if (v.completa.valor === 0) {
      const seguridad = v.completa.clave === 'seguridad';
      const lineas = [seguridad ? 'No se intentó por seguridad.' : 'No completó los 400 m.', 'El estudio LIFE define discapacidad mayor de la movilidad como no poder caminar 400 m (en su protocolo, en 15 minutos o menos sin sentarse ni ayuda de otra persona o andadera).'];
      return { banda: B_400.nocompleta, mostrar: '—', sufijo: seguridad ? 'No se intentó' : 'No la completa', lineas, lineasNota: lineas.slice(0, 1), extras: { completa: false, seguridad, bajo: true } };
    }
    const t = v.minutos * 60 + v.segundos;
    const banda = t >= CORTE_400 ? B_400.lenta : B_400.normal;
    const auxiliar = v.auxiliar && v.auxiliar.valor ? v.auxiliar.texto.toLowerCase() : null;
    const lineas = [`400 m en ${mmss(t)} min (${t} s).`];
    if (t >= LIMITE_LIFE_400) lineas.push('Tardó 15 minutos o más: en el protocolo del estudio LIFE no cuenta como capacidad para caminar 400 m.');
    if (auxiliar) lineas.push(`Caminó con ${auxiliar}.`);
    return { valor: t, unidad: 's', mostrar: mmss(t), sufijo: 'min', banda, lineas, lineasNota: lineas, extras: { completa: true, segundos: t, bajo: t >= CORTE_400, auxiliar } };
  },
  resumen(res) {
    if (!res.extras.completa) return `Caminata de 400 m: ${res.extras.seguridad ? 'no se intentó por seguridad' : 'no la completa'} (${minus(res.banda.etiqueta)}).`;
    return `Caminata de 400 m: ${res.mostrar} min (${minus(res.banda.etiqueta)}).`;
  },
  resumenBreve: (res) => (res.extras.completa ? `Caminata 400 m ${res.mostrar} min` : 'Caminata 400 m: no la completa'),
  detalleEnResumen: true,
  siguientes: [
    { id: 'ewgsop2', si: (res) => !res.noEvaluable && Boolean(res.extras?.bajo), motivo: 'Desempeño bajo: si hay fuerza baja, define la gravedad de la sarcopenia.' },
  ],
  notas: [
    'EWGSOP2: no completar la caminata de 400 m o tardar 6 minutos o más indica desempeño físico bajo; con fuerza y masa muscular bajas, sarcopenia grave.',
    'Health ABC (3075 personas de 70 a 79 años): no completarla se asoció con más limitación (HR 1.86) y discapacidad de la movilidad (HR 1.95); en quienes la completaron, cada minuto adicional se asoció con más mortalidad (HR 1.29). El cuartil más lento (más de 362 s) tuvo más mortalidad que el más rápido (menos de 290 s).',
    'El estudio LIFE usa la incapacidad de caminar 400 m como definición de discapacidad mayor de la movilidad.',
  ],
  referencias: [
    REF_EWGSOP2,
    { texto: 'Newman AB, Simonsick EM, Naydeck BL, et al. Association of long-distance corridor walk performance with mortality, cardiovascular disease, mobility limitation, and disability. JAMA. 2006;295(17):2018-26.', doi: '10.1001/jama.295.17.2018' },
    { texto: 'Pahor M, Guralnik JM, Ambrosius WT, et al. Effect of structured physical activity on prevention of major mobility disability in older adults: the LIFE study randomized clinical trial. JAMA. 2014;311(23):2387-96.', doi: '10.1001/jama.2014.5616' },
  ],
};

/* ---------- Apoyo en un pie ---------- */

// Promedio del mejor de 3 intentos con ojos abiertos (Springer, 2007; ambos sexos).
export const PROMEDIO_MONOPODAL = [[18, 39, 44.7], [40, 49, 41.9], [50, 59, 41.2], [60, 69, 32.1], [70, 79, 21.5], [80, 120, 9.4]];
export const promedioMonopodal = (edad) => PROMEDIO_MONOPODAL.find(([a, b]) => edad >= a && edad <= b)?.[2] ?? null;
export const CORTE_MONOPODAL = 5;

export const monopodal = {
  id: 'monopodal',
  nombre: 'Apoyo en un pie (equilibrio monopodal)',
  corto: 'Apoyo en un pie',
  dominio: 'desempeno',
  tipo: 'desempeno',
  aliases: ['one-leg stance', 'one leg balance', 'single leg stance', 'unipedal stance test', 'equilibrio monopodal', 'apoyo unipodal', 'estacion unipodal', 'pararse en un pie'],
  problemas: ['caídas', 'equilibrio', 'fracturas'],
  descripcion: 'Segundos que se sostiene sobre un pie con los ojos abiertos; menos de 5 segundos predice caídas con lesión (Vellas, 1997).',
  objetivo: 'Evaluar el equilibrio estático y el riesgo de caídas con lesión.',
  poblacion: 'Personas mayores que viven en la comunidad (Vellas, 1997: 316 personas de 60 años o más). Promedios por edad de Springer (2007).',
  aplicacion: [
    'Ojos abiertos mirando un punto en la pared y brazos cruzados sobre el pecho. Quédate cerca para sujetarla.',
    'Que levante un pie y lo deje cerca del tobillo de la otra pierna, sin tocarlo. Cronometra desde que despega el pie.',
    'Detén el cronómetro si descruza los brazos, apoya o recarga el pie levantado, gira el pie de apoyo o llega a 45 segundos.',
    'Haz hasta 3 intentos y registra el mejor. Si no logra despegar el pie, registra 0.',
  ],
  tiempo: '2 min',
  momentos: true,
  barra: false,
  direccionClinica: 'mayor_mejor',
  unidadCambio: 's',
  decimalesCambio: 1,
  textoMejoria: 'más tiempo sobre un pie',
  textoEmpeoramiento: 'menos tiempo sobre un pie',
  campos: [
    EDAD,
    { id: 'tiempo', tipo: 'numero', texto: 'Mejor tiempo sobre un pie (hasta 3 intentos)', unidad: 's', min: 0, max: 45, decimales: 1 },
    {
      id: 'pierna', texto: 'Pierna de apoyo', textoCorto: 'pierna', puntua: false, opcional: true,
      opciones: [{ texto: 'Derecha', valor: 0 }, { texto: 'Izquierda', valor: 1 }],
    },
  ],
  bandas: [
    { id: 'riesgo', rango: 'Menos de 5 s', etiqueta: 'Mayor riesgo de caídas con lesión', nivel: 'moderado', hallazgo: true, texto: 'No se sostiene 5 segundos sobre un pie: en el estudio de Vellas (1997) fue el predictor independiente más fuerte de caídas con lesión (riesgo relativo 2.1).', sugerencias: [SUG.caidas, 'Ejercicio de equilibrio progresivo (p. ej., tai chi o el programa de equilibrio de Vivifrail).'] },
    { id: 'sin', rango: '5 s o más', etiqueta: 'Se sostiene 5 segundos o más', nivel: 'bien', texto: 'Se sostiene sobre un pie 5 segundos o más. No descarta otros factores de riesgo de caídas.', sugerencias: [] },
  ],
  calcular({ v }) {
    const t = v.tiempo;
    const banda = monopodal.bandas[t < CORTE_MONOPODAL ? 0 : 1];
    const prom = promedioMonopodal(v.edad);
    const pierna = v.pierna ? ` (pierna ${v.pierna.texto.toLowerCase()})` : '';
    const lineas = [t === 0 ? `No logró despegar el pie${pierna}.` : `Mejor tiempo: ${t} s${pierna}${t >= 45 ? ', el máximo de la prueba' : ''}.`];
    if (prom != null) lineas.push(`Promedio del mejor de 3 intentos con ojos abiertos a los ${v.edad} años (Springer, 2007): ${prom} s.`);
    return { valor: t, unidad: 's', mostrar: String(t), sufijo: 'segundos', banda, lineas, lineasNota: lineas.slice(0, 1), extras: { segundos: t, riesgo: t < CORTE_MONOPODAL, promedio: prom } };
  },
  resumen: (res) => `Apoyo en un pie: ${res.valor} s (${minus(res.banda.etiqueta)}).`,
  resumenBreve: (res) => `Apoyo en un pie ${res.valor} s`,
  detalleEnResumen: true,
  siguientes: [
    { id: 'tinetti', si: (res) => Boolean(res.extras?.riesgo), motivo: 'Equilibrio alterado: evalúa equilibrio y marcha con más detalle.' },
  ],
  notas: [
    'Vellas (1997): no sostenerse 5 segundos sobre un pie predijo caídas con lesión (riesgo relativo 2.13), pero no el total de caídas; ningún factor aislado basta para estimar el riesgo de caídas.',
    'Promedios del mejor de 3 intentos con ojos abiertos (Springer, 2007): 32.1 s (60–69 años), 21.5 s (70–79) y 9.4 s (80 o más), con mucha variación entre personas; no dependen del sexo.',
    'La cuarta etapa de la prueba de equilibrio en 4 etapas (CDC STEADI) también es sobre un pie, pero solo pide 10 segundos.',
  ],
  referencias: [
    { texto: 'Vellas BJ, Wayne SJ, Romero L, Baumgartner RN, Rubenstein LZ, Garry PJ. One-leg balance is an important predictor of injurious falls in older persons. J Am Geriatr Soc. 1997;45(6):735-8.', doi: '10.1111/j.1532-5415.1997.tb01479.x' },
    { texto: 'Springer BA, Marin R, Cyhan T, Roberts H, Gill NW. Normative values for the unipedal stance test with eyes open and closed. J Geriatr Phys Ther. 2007;30(1):8-15.', doi: '10.1519/00139143-200704000-00003' },
  ],
};

/* ---------- Alcance funcional ---------- */

export const UNIDADES_ALCANCE = [
  { id: 'cm', etiqueta: 'cm', min: 0, max: 60 },
  { id: 'in', etiqueta: 'pulgadas', min: 0, max: 24, aBase: (x) => x * 2.54 },
];
// Duncan (1992): 6 pulgadas = 15.24 cm; 10 pulgadas = 25.4 cm.
export const CORTES_ALCANCE = { alto: 15.24, bajo: 25.4 };
// Promedios de Duncan (1990), en cm.
export const PROMEDIO_ALCANCE = { hombre: [[20, 40, 42.5], [41, 69, 38.0], [70, 87, 33.4]], mujer: [[20, 40, 37.2], [41, 69, 35.1], [70, 87, 26.6]] };
export function categoriaAlcance(cm) {
  if (cm <= CORTES_ALCANCE.alto) return 'alto';
  if (cm < CORTES_ALCANCE.bajo) return 'moderado';
  return 'bajo';
}

const B_AL = {
  nopuede: { id: 'nopuede', rango: 'No puede', etiqueta: 'No puede hacer el alcance', nivel: 'grave', hallazgo: true, texto: 'No puede o no quiere inclinarse: en el estudio de Duncan (1992), riesgo de caídas recurrentes unas 8 veces mayor que con un alcance de 25 cm o más.', sugerencias: [SUG.caidas, SUG.rehabilitacion] },
  alto: { id: 'alto', rango: '15 cm o menos', etiqueta: 'Riesgo alto de caídas', nivel: 'grave', hallazgo: true, texto: 'Alcance de 15 cm (6 pulgadas) o menos: riesgo de caídas recurrentes unas 4 veces mayor que con un alcance de 25 cm o más (Duncan, 1992).', sugerencias: [SUG.caidas, 'Ejercicio de equilibrio y fuerza; valorar fisioterapia.'] },
  moderado: { id: 'moderado', rango: 'Más de 15 y menos de 25 cm', etiqueta: 'Riesgo moderado de caídas', nivel: 'moderado', hallazgo: true, texto: 'Alcance de más de 15 y menos de 25 cm: riesgo de caídas recurrentes unas 2 veces mayor que con un alcance de 25 cm o más (Duncan, 1992).', sugerencias: [SUG.caidas, 'Ejercicio de equilibrio y fuerza.'] },
  bajo: { id: 'bajo', rango: '25 cm o más', etiqueta: 'Sin riesgo aumentado por el alcance', nivel: 'bien', texto: 'Alcance de 25 cm (10 pulgadas) o más: grupo de referencia de Duncan (1992). No descarta otros factores de riesgo de caídas.', sugerencias: [] },
};

export const alcance = {
  id: 'alcance',
  nombre: 'Alcance funcional (Functional Reach)',
  corto: 'Alcance funcional',
  dominio: 'desempeno',
  tipo: 'desempeno',
  aliases: ['Functional Reach Test', 'FRT', 'functional reach', 'limite de estabilidad', 'Duncan', 'equilibrio dinamico'],
  problemas: ['caídas', 'equilibrio'],
  descripcion: 'Cuánto alcanza hacia adelante de pie sin mover los pies; 15 cm o menos indica riesgo alto de caídas (Duncan, 1992).',
  objetivo: 'Evaluar el equilibrio (límite de estabilidad hacia adelante) y el riesgo de caídas recurrentes.',
  poblacion: 'Personas mayores que se mantienen de pie sin apoyo. Riesgo de caídas en 217 varones veteranos de 70 a 104 años (Duncan, 1992); promedios por edad y sexo de Duncan (1990).',
  aplicacion: [
    'De pie, de lado junto a la pared sin tocarla, con los pies separados al ancho de los hombros. Eleva el brazo más cercano a la pared a 90° con el puño cerrado.',
    'Marca la posición del nudillo del dedo medio en una cinta métrica fija a la pared, a la altura del hombro.',
    'Pide que se incline hacia adelante lo más que pueda sin dar un paso ni despegar los talones; marca la posición final. Quédate al frente para protegerla.',
    'Haz 3 intentos (el primero de práctica) y registra el promedio de los dos últimos.',
  ],
  tiempo: '3 min',
  momentos: true,
  barra: false,
  direccionClinica: 'mayor_mejor',
  unidadCambio: 'cm',
  decimalesCambio: 1,
  textoMejoria: 'mayor alcance',
  textoEmpeoramiento: 'menor alcance',
  campos: [
    SEXO,
    EDAD,
    {
      id: 'puede', texto: '¿Pudo hacer la prueba?', textoCorto: 'realización', puntua: false,
      opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No pudo o no quiso inclinarse', valor: 0 }],
    },
    { id: 'alcance', tipo: 'numero', texto: 'Alcance (promedio de los dos últimos intentos)', unidades: UNIDADES_ALCANCE, decimales: 1, visibleSi: (r) => r.puede === 0 },
  ],
  bandas: [B_AL.nopuede, B_AL.alto, B_AL.moderado, B_AL.bajo],
  calcular({ v, r }) {
    const mujer = v.sexo.valor === 1;
    const fila = PROMEDIO_ALCANCE[mujer ? 'mujer' : 'hombre'].find(([a, b]) => v.edad >= a && v.edad <= b);
    const prom = fila ? fila[2] : null;
    const lineaProm = prom != null ? `Promedio para ${mujer ? 'mujeres' : 'hombres'} de ${fila[0]} a ${fila[1]} años (Duncan, 1990): ${prom} cm.` : null;
    if (v.puede.valor === 0) {
      const lineas = ['No pudo o no quiso inclinarse.'];
      return { banda: B_AL.nopuede, mostrar: '—', sufijo: 'No puede', lineas, lineasNota: lineas, extras: { nopuede: true, promedio: prom } };
    }
    const cm = Number(v.alcance.toFixed(1));
    const pulgadas = r.alcance_u === 'in';
    const banda = B_AL[categoriaAlcance(v.alcance)];
    const lineas = [`Alcance: ${cm} cm${pulgadas ? ` (${r.alcance} pulgadas)` : ''}.`];
    if (lineaProm) lineas.push(lineaProm);
    if (mujer) lineas.push('Los puntos de corte de riesgo se derivaron en varones; en mujeres, interprétalos con cautela.');
    return { valor: cm, unidad: 'cm', mostrar: String(cm), sufijo: 'cm', banda, lineas, lineasNota: lineas.slice(0, 1), extras: { nopuede: false, cm, categoria: banda.id, promedio: prom } };
  },
  resumen(res) {
    if (res.extras.nopuede) return `Alcance funcional: no puede hacer la prueba (${minus(res.banda.etiqueta)}).`;
    return `Alcance funcional: ${res.valor} cm (${minus(res.banda.etiqueta)}).`;
  },
  resumenBreve: (res) => (res.extras.nopuede ? 'Alcance funcional: no puede' : `Alcance funcional ${res.valor} cm`),
  detalleEnResumen: true,
  siguientes: [
    { id: 'tinetti', si: (res) => ['nopuede', 'alto'].includes(res.banda?.id), motivo: 'Equilibrio alterado: evalúa equilibrio y marcha con más detalle.' },
  ],
  notas: [
    'Duncan (1992), caídas recurrentes en 6 meses: no poder hacer el alcance, razón de momios 8.07; 15 cm (6 pulgadas) o menos, 4.02; más de 15 y menos de 25 cm (10 pulgadas), 2.00, frente a 25 cm o más. La asociación no dependió de la edad, la depresión ni la cognición.',
    'Promedios de Duncan (1990): hombres 42.5 cm (20–40 años), 38.0 cm (41–69) y 33.4 cm (70–87); mujeres 37.2, 35.1 y 26.6 cm.',
    'Se puede registrar en pulgadas: Huella lo convierte a centímetros.',
  ],
  referencias: [
    { texto: 'Duncan PW, Weiner DK, Chandler J, Studenski S. Functional reach: a new clinical measure of balance. J Gerontol. 1990;45(6):M192-7.', doi: '10.1093/geronj/45.6.m192' },
    { texto: 'Duncan PW, Studenski S, Chandler J, Prescott B. Functional reach: predictive validity in a sample of elderly male veterans. J Gerontol. 1992;47(3):M93-8.', doi: '10.1093/geronj/47.3.m93' },
  ],
};

export const ESCALAS_DESEMPENO = [silla5, caminata6, caminata400, monopodal, alcance];
