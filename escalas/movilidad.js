// Fuerza y equilibrio: levantarse de la silla en 30 s y equilibrio en 4 etapas (CDC STEADI), dinamometría de
// prensión y algoritmo EWGSOP2 de sarcopenia. La fuerza de prensión baja por sí sola no diagnostica sarcopenia.
const minus = (s) => s.charAt(0).toLowerCase() + s.slice(1);

const SEXO = { id: 'sexo', texto: 'Sexo', textoCorto: 'sexo', puntua: false, prefill: 'sexo', opciones: [{ texto: 'Mujer', valor: 1, clave: 'mujer' }, { texto: 'Hombre', valor: 0, clave: 'hombre' }] };
const EDAD = { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad' };
const REF_STEADI = { texto: 'Centers for Disease Control and Prevention. STEADI: Stopping Elderly Accidents, Deaths & Injuries. Assessment tools. Atlanta: CDC; 2017.', enlace: 'https://www.cdc.gov/steadi' };
const REF_EWGSOP2 = { texto: 'Cruz-Jentoft AJ, Bahat G, Bauer J, et al. Sarcopenia: revised European consensus on definition and diagnosis. Age Ageing. 2019;48(1):16-31.', doi: '10.1093/ageing/afy169' };

/* ---------- Levantarse de la silla en 30 segundos ---------- */

// Valores por debajo del promedio del CDC STEADI (de Rikli y Jones): «menos de» n repeticiones, por edad y sexo.
export const NORMAS_SILLA30 = {
  hombre: [[60, 64, 14], [65, 69, 12], [70, 74, 12], [75, 79, 11], [80, 84, 10], [85, 89, 8], [90, 94, 7]],
  mujer: [[60, 64, 12], [65, 69, 11], [70, 74, 10], [75, 79, 10], [80, 84, 9], [85, 89, 8], [90, 94, 4]],
};
export function corteSilla30(mujer, edad) {
  const fila = NORMAS_SILLA30[mujer ? 'mujer' : 'hombre'].find(([a, b]) => edad >= a && edad <= b);
  return fila ? fila[2] : null;
}

const B_S30 = {
  bajo: { id: 'bajo', rango: 'Por debajo del promedio', etiqueta: 'Por debajo del promedio para la edad y el sexo', nivel: 'moderado', hallazgo: true, texto: 'Menos repeticiones que el valor de referencia del CDC STEADI para su edad y sexo: fuerza de las piernas por debajo del promedio.', sugerencias: ['Integrar en la evaluación del riesgo de caídas (STEADI) y considerar ejercicio de fuerza y equilibrio.'] },
  normal: { id: 'normal', rango: 'En el promedio o por encima', etiqueta: 'En el promedio o por encima para la edad y el sexo', nivel: 'bien', texto: 'Igual o más repeticiones que el valor de referencia del CDC STEADI para su edad y sexo.' },
  sinref: { id: 'sinref', rango: 'Edad sin valores de referencia', etiqueta: 'Sin valores de referencia para la edad', nivel: 'neutro', texto: 'El CDC STEADI publica valores de 60 a 94 años: el número de repeticiones se registra sin clasificarlo.' },
};

export const silla30 = {
  id: 'silla30',
  nombre: 'Levantarse de la silla en 30 segundos',
  corto: 'Silla 30 s',
  dominio: 'caidas',
  tipo: 'desempeno',
  aliases: ['30-Second Chair Stand', 'chair stand', 'sentarse y levantarse', 'fuerza de piernas', 'STEADI'],
  problemas: ['caídas', 'debilidad', 'fuerza de las piernas'],
  descripcion: 'Número de veces que se levanta de una silla en 30 segundos con los brazos cruzados, comparado con los valores del CDC STEADI.',
  objetivo: 'Medir la fuerza y la resistencia de las piernas como parte de la evaluación del riesgo de caídas.',
  poblacion: 'Personas mayores de 60 a 94 años que viven en la comunidad (valores de Rikli y Jones adoptados por el CDC STEADI).',
  aplicacion: [
    'Silla firme sin descansabrazos, de unos 43 cm de altura, apoyada contra la pared. Párate junto a la persona por seguridad.',
    'Sentada a la mitad del asiento, con los pies apoyados y los brazos cruzados sobre el pecho, se levanta por completo y se vuelve a sentar tantas veces como pueda en 30 segundos.',
    'Si a los 30 segundos está a más de la mitad del camino para ponerse de pie, cuenta como una repetición.',
    'Si necesita usar los brazos para levantarse, detén la prueba y registra 0.',
  ],
  tiempo: '2 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'más repeticiones',
  textoEmpeoramiento: 'menos repeticiones',
  unidadCambio: ['repetición', 'repeticiones'],
  barra: false,
  detalleEnResumen: true,
  campos: [
    SEXO,
    EDAD,
    {
      id: 'brazos', texto: '¿Necesitó usar los brazos para levantarse?', textoCorto: 'uso de los brazos', puntua: false,
      opciones: [{ texto: 'No', valor: 0 }, { texto: 'Sí: se detiene la prueba y se registra 0', valor: 1 }],
    },
    { id: 'repeticiones', tipo: 'numero', texto: 'Repeticiones en 30 segundos', unidad: 'repeticiones', min: 0, max: 50, entero: true, visibleSi: (r) => r.brazos === 0 },
  ],
  bandas: [B_S30.bajo, B_S30.normal, B_S30.sinref],
  calcular({ v }) {
    const n = v.brazos.valor === 1 ? 0 : v.repeticiones;
    const mujer = v.sexo.valor === 1;
    const corte = corteSilla30(mujer, v.edad);
    const lineas = [v.brazos.valor === 1 ? 'Necesitó los brazos para levantarse: se registra 0.' : `${n} repeticiones en 30 segundos.`];
    let banda;
    if (corte == null) banda = B_S30.sinref;
    else {
      banda = n < corte ? B_S30.bajo : B_S30.normal;
      lineas.push(`Valor de referencia del CDC STEADI para ${mujer ? 'mujeres' : 'hombres'} de ${v.edad} años: por debajo del promedio si son menos de ${corte}.`);
    }
    return { valor: n, unidad: 'repeticiones', mostrar: String(n), sufijo: 'en 30 s', banda, lineas, lineasNota: lineas.slice(1), extras: { repeticiones: n, corte, brazos: v.brazos.valor === 1 } };
  },
  resumen: (res) => `Silla 30 s: ${res.extras.repeticiones} repeticiones${res.extras.brazos ? ' (usó los brazos)' : ''} (${minus(res.banda.etiqueta)}).`,
  resumenBreve: (res) => `Silla 30 s ${res.extras.repeticiones} repeticiones`,
  siguientes: [
    { id: 'equilibrio4', si: (res) => res.banda?.id === 'bajo', motivo: 'Completar la evaluación de caídas con el equilibrio estático (CDC STEADI).' },
    { id: 'tug', si: (res) => res.banda?.id === 'bajo', motivo: 'Movilidad y marcha (CDC STEADI).' },
  ],
  notas: [
    'Valores por debajo del promedio del CDC STEADI (2017), derivados de Rikli y Jones: hombres <14 (60–64), <12 (65–74), <11 (75–79), <10 (80–84), <8 (85–89), <7 (90–94); mujeres <12 (60–64), <11 (65–69), <10 (70–79), <9 (80–84), <8 (85–89), <4 (90–94).',
    'Es distinta de la prueba de 5 levantadas cronometradas (SPPB, ICOPE, EWGSOP2): sus puntos de corte no son intercambiables.',
    'Fuera de 60 a 94 años no hay valores de referencia: se registra el número sin clasificarlo.',
  ],
  referencias: [
    REF_STEADI,
    { texto: 'Jones CJ, Rikli RE, Beam WC. A 30-s chair-stand test as a measure of lower body strength in community-residing older adults. Res Q Exerc Sport. 1999;70(2):113-9.', doi: '10.1080/02701367.1999.10608028' },
  ],
};

/* ---------- Equilibrio en 4 etapas (CDC STEADI) ---------- */

const ETAPAS = [
  ['etapa1', '1. Pies juntos, uno al lado del otro'],
  ['etapa2', '2. Semitándem: el empeine de un pie toca el dedo gordo del otro'],
  ['etapa3', '3. Tándem: un pie delante del otro, talón contra punta'],
  ['etapa4', '4. Sobre un pie'],
];
const OP_ETAPA = [{ texto: 'Lo mantiene 10 segundos', valor: 1 }, { texto: 'No lo mantiene 10 segundos', valor: 0 }];

export const equilibrio4 = {
  id: 'equilibrio4',
  nombre: 'Prueba de equilibrio en 4 etapas (CDC STEADI)',
  corto: 'Equilibrio 4 etapas',
  dominio: 'caidas',
  tipo: 'desempeno',
  aliases: ['4-Stage Balance Test', 'tandem', 'equilibrio estatico', 'STEADI', 'apoyo monopodal'],
  problemas: ['caídas', 'inestabilidad', 'equilibrio'],
  descripcion: 'Cuatro posiciones de dificultad creciente, 10 segundos cada una; no mantener el tándem 10 segundos indica mayor riesgo de caídas.',
  objetivo: 'Evaluar el equilibrio estático como parte de la evaluación del riesgo de caídas.',
  poblacion: 'Personas mayores en atención primaria y en la comunidad (CDC STEADI).',
  aplicacion: [
    'Con los ojos abiertos y sin auxiliar de la marcha. Demuestra cada posición y quédate cerca para dar apoyo.',
    'Ayúdala a colocarse y suéltala cuando esté lista; cronometra 10 segundos.',
    'Si mantiene la posición 10 segundos sin mover los pies ni necesitar apoyo, pasa a la siguiente; si no, termina la prueba.',
  ],
  tiempo: '2 a 3 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'más etapas completadas',
  textoEmpeoramiento: 'menos etapas completadas',
  unidadCambio: ['etapa', 'etapas'],
  barra: false,
  detalleEnResumen: true,
  vinculos: [
    {
      id: 'sppb', escala: 'sppb', titulo: 'Equilibrio del SPPB',
      disponible: (res) => (Number.isFinite(res.extras?.eq) ? true : 'El SPPB guardado no tiene el puntaje de equilibrio.'),
      describir: (res) => `Equilibrio del SPPB: ${res.extras.eq}/4 (pies juntos, semitándem y tándem; la cuarta etapa no forma parte del SPPB)`,
      aplicar: (res) => {
        const eq = res.extras.eq;
        const r = { etapa1: eq >= 1 ? 0 : 1 };
        if (eq >= 1) r.etapa2 = eq >= 2 ? 0 : 1;
        if (eq >= 2) r.etapa3 = eq === 4 ? 0 : 1;
        return r;
      },
      campos: ['etapa1', 'etapa2', 'etapa3'],
    },
  ],
  campos: ETAPAS.map(([id, texto], i) => ({
    id, texto, textoCorto: texto.replace(/^\d\. /, '').split(':')[0].toLowerCase(), puntua: false, opciones: OP_ETAPA,
    ...(i ? { visibleSi: (r) => ETAPAS.slice(0, i).every(([prev]) => r[prev] === 0) } : {}),
  })),
  bandas: [
    { min: 0, max: 2, id: 'riesgo', rango: 'No mantiene el tándem', etiqueta: 'Mayor riesgo de caídas', nivel: 'moderado', hallazgo: true, texto: 'No mantiene el tándem 10 segundos: según el CDC STEADI, mayor riesgo de caídas.', sugerencias: ['Evaluación multifactorial del riesgo de caídas y referencia a fisioterapia o a un programa de ejercicio de equilibrio (p. ej., tai chi).'] },
    { min: 3, max: 4, id: 'tandem', rango: 'Mantiene el tándem', etiqueta: 'Mantiene el tándem', nivel: 'bien', texto: 'Mantiene el tándem 10 segundos. No descarta otros factores de riesgo de caídas.' },
  ],
  calcular({ v }) {
    let n = 0;
    for (const [id] of ETAPAS) {
      if (v[id]?.valor === 1) n += 1;
      else break;
    }
    const nombre = n ? ETAPAS[n - 1][1].replace(/^\d\. /, '').split(':')[0].toLowerCase() : '';
    const lineas = [n ? `Etapas mantenidas 10 segundos: ${n} de 4 (última: ${nombre}).` : 'No mantiene los pies juntos 10 segundos.'];
    return { puntaje: n, max: 4, lineas, lineasNota: lineas, extras: { etapas: n } };
  },
  resumen: (res) => `Equilibrio en 4 etapas: ${res.puntaje} de 4 (${minus(res.banda.etiqueta)}).`,
  resumenBreve: (res) => `Equilibrio 4 etapas ${res.puntaje}/4`,
  notas: [
    'Criterio del CDC STEADI: una persona mayor que no mantiene el tándem al menos 10 segundos tiene mayor riesgo de caídas.',
    'Las tres primeras posiciones coinciden con las del SPPB: si ya se aplicó, se pueden reutilizar con tu confirmación.',
  ],
  referencias: [REF_STEADI],
};

/* ---------- Dinamometría de prensión ---------- */

const intento = (id, texto) => ({ id, tipo: 'numero', texto, unidad: 'kg', min: 0, max: 100, decimales: 1, opcional: true });
const CORTE_GRIP = { mujer: 16, hombre: 27 };
const INTENTOS = ['der1', 'der2', 'der3', 'izq1', 'izq2', 'izq3'];

export const dinamometria = {
  id: 'dinamometria',
  nombre: 'Fuerza de prensión (dinamometría)',
  corto: 'Dinamometría',
  dominio: 'fragilidad',
  tipo: 'desempeno',
  aliases: ['fuerza de prension', 'handgrip', 'dinamometro', 'Jamar', 'grip', 'sarcopenia', 'debilidad'],
  problemas: ['sarcopenia', 'debilidad', 'fragilidad', 'desnutrición'],
  descripcion: 'Registro de hasta tres intentos por mano; toma el máximo y lo compara con los puntos de corte del EWGSOP2.',
  objetivo: 'Medir la fuerza muscular y reutilizarla en el algoritmo de sarcopenia, el fenotipo de fragilidad y el seguimiento.',
  poblacion: 'Personas mayores capaces de sujetar el dinamómetro; protocolo de Southampton (Roberts et al., 2011).',
  aplicacion: [
    'Sentada, con los antebrazos apoyados, el codo a 90° y la muñeca en posición neutra. Pide que apriete lo más fuerte posible durante unos segundos.',
    'Alterna las manos hasta tres intentos por mano. Registra los que se hicieron; deja vacíos los que no.',
    'Huella usa el valor máximo de todos los intentos (protocolo de Southampton, que recomienda el EWGSOP2).',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'más fuerza',
  textoEmpeoramiento: 'menos fuerza',
  unidadCambio: 'kg',
  decimalesCambio: 1,
  barra: false,
  detalleEnResumen: true,
  campos: [
    SEXO,
    {
      id: 'dominante', texto: 'Mano dominante', textoCorto: 'mano dominante', puntua: false,
      opciones: [{ texto: 'Derecha', valor: 0 }, { texto: 'Izquierda', valor: 1 }, { texto: 'Ambidiestra', valor: 2 }],
    },
    {
      id: 'equipo', texto: 'Dinamómetro', textoCorto: 'dinamómetro', puntua: false,
      opciones: [{ texto: 'Hidráulico (p. ej., Jamar)', valor: 0 }, { texto: 'Electrónico', valor: 1 }, { texto: 'Otro', valor: 2 }],
    },
    { ...intento('der1', 'Mano derecha, intento 1'), grupo: 'Mano derecha' },
    intento('der2', 'Mano derecha, intento 2'),
    intento('der3', 'Mano derecha, intento 3'),
    { ...intento('izq1', 'Mano izquierda, intento 1'), grupo: 'Mano izquierda' },
    intento('izq2', 'Mano izquierda, intento 2'),
    intento('izq3', 'Mano izquierda, intento 3'),
  ],
  validar({ v }) {
    return INTENTOS.some((k) => Number.isFinite(v[k])) ? null : { der1: 'Registra al menos un intento.' };
  },
  bandas: [
    { id: 'baja', rango: '<27 kg (hombres), <16 kg (mujeres)', etiqueta: 'Fuerza de prensión baja según el EWGSOP2', nivel: 'moderado', hallazgo: true, texto: 'Por debajo del punto de corte del EWGSOP2. Según el EWGSOP2 indica sarcopenia probable: la confirmación requiere medir la cantidad o la calidad muscular.', sugerencias: ['Aplicar el algoritmo EWGSOP2 (masa muscular y desempeño) antes de hablar de sarcopenia.', 'Buscar causas de debilidad: desnutrición, inactividad, enfermedad aguda, dolor o artrosis de la mano.'] },
    { id: 'normal', rango: '≥27 kg (hombres), ≥16 kg (mujeres)', etiqueta: 'Fuerza de prensión no baja según el EWGSOP2', nivel: 'bien', texto: 'En o por encima del punto de corte del EWGSOP2.' },
  ],
  calcular({ v }) {
    const mujer = v.sexo.valor === 1;
    const der = ['der1', 'der2', 'der3'].map((k) => v[k]).filter(Number.isFinite);
    const izq = ['izq1', 'izq2', 'izq3'].map((k) => v[k]).filter(Number.isFinite);
    const max = Math.max(...der, ...izq);
    const corte = CORTE_GRIP[mujer ? 'mujer' : 'hombre'];
    const banda = max < corte ? dinamometria.bandas[0] : dinamometria.bandas[1];
    const maxDer = der.length ? Math.max(...der) : null;
    const maxIzq = izq.length ? Math.max(...izq) : null;
    const dom = v.dominante.valor === 0 ? maxDer : v.dominante.valor === 1 ? maxIzq : max;
    const lineas = [
      `Máximo: ${max} kg (derecha: ${der.length ? der.join(', ') : 'sin intentos'}; izquierda: ${izq.length ? izq.join(', ') : 'sin intentos'}).`,
      `Punto de corte del EWGSOP2 para ${mujer ? 'mujeres' : 'hombres'}: menos de ${corte} kg.`,
    ];
    if (der.length + izq.length < 6) lineas.push(`Se registraron ${der.length + izq.length} de 6 intentos: el máximo puede subestimar la fuerza.`);
    return { valor: max, unidad: 'kg', mostrar: String(max), sufijo: 'kg (máximo)', banda, lineas, lineasNota: lineas.slice(0, 1), extras: { max, maxDer, maxIzq, dominante: dom, mujer, corte, baja: max < corte } };
  },
  resumen: (res) => `Dinamometría: ${res.extras.max} kg, máximo de los intentos (${minus(res.banda.etiqueta)}).`,
  resumenBreve: (res) => `Prensión ${res.extras.max} kg`,
  siguientes: [
    { id: 'ewgsop2', si: (res) => Boolean(res.extras?.baja), motivo: 'Fuerza baja: completar el algoritmo de sarcopenia (masa muscular y desempeño).' },
  ],
  notas: [
    'Puntos de corte del EWGSOP2 (Cruz-Jentoft et al., 2019), de los datos normativos de Dodds et al. (2014): <27 kg en hombres y <16 kg en mujeres.',
    'La fuerza de prensión baja por sí sola no diagnostica sarcopenia: el EWGSOP2 la llama sarcopenia probable hasta confirmar la masa o la calidad muscular.',
    'El fenotipo de Fried usa otros puntos de corte (por sexo e IMC) y la mano dominante: al reutilizar el dato, confirma que el método coincida.',
  ],
  referencias: [
    REF_EWGSOP2,
    { texto: 'Roberts HC, Denison HJ, Martin HJ, et al. A review of the measurement of grip strength in clinical and epidemiological studies: towards a standardised approach. Age Ageing. 2011;40(4):423-9.', doi: '10.1093/ageing/afr051' },
    { texto: 'Dodds RM, Syddall HE, Cooper R, et al. Grip strength across the life course: normative data from twelve British studies. PLoS One. 2014;9(12):e113637.', doi: '10.1371/journal.pone.0113637' },
  ],
};

/* ---------- Algoritmo EWGSOP2 de sarcopenia ---------- */

const B_EW = {
  sin: { id: 'sin', rango: 'Fuerza no baja', etiqueta: 'Sin sarcopenia probable por la fuerza', nivel: 'bien', texto: 'La fuerza muscular no está baja según el EWGSOP2. Si la sospecha clínica persiste, repetir la evaluación.' },
  probable: { id: 'probable', rango: 'Fuerza baja', etiqueta: 'Sarcopenia probable', nivel: 'moderado', hallazgo: true, texto: 'Fuerza muscular baja (EWGSOP2). Basta para buscar causas e iniciar intervenciones; la confirmación requiere medir la cantidad o la calidad muscular.' },
  noconfirmada: { id: 'noconfirmada', rango: 'Fuerza baja, masa no baja', etiqueta: 'Fuerza baja sin masa muscular baja', nivel: 'moderado', hallazgo: true, texto: 'La fuerza está baja, pero la masa muscular medida no: no se confirma sarcopenia (EWGSOP2). Buscar otras causas de debilidad.' },
  confirmada: { id: 'confirmada', rango: 'Fuerza y masa bajas', etiqueta: 'Sarcopenia confirmada', nivel: 'grave', hallazgo: true, texto: 'Fuerza y cantidad o calidad muscular bajas (EWGSOP2). El diagnóstico lo integra el médico con la clínica.' },
  grave: { id: 'grave', rango: 'Fuerza, masa y desempeño bajos', etiqueta: 'Sarcopenia grave', nivel: 'critico', hallazgo: true, texto: 'Fuerza, masa muscular y desempeño físico bajos (EWGSOP2). El diagnóstico lo integra el médico con la clínica.' },
};
const SUG_SARCO = ['Intervenciones: ejercicio de fuerza progresivo y aporte adecuado de proteínas; revisar fármacos y enfermedades que contribuyen.', 'Valorar el riesgo de caídas y fracturas.'];

export const ewgsop2 = {
  id: 'ewgsop2',
  nombre: 'Sarcopenia: algoritmo EWGSOP2',
  corto: 'EWGSOP2',
  dominio: 'fragilidad',
  tipo: 'diagnostico',
  aliases: ['sarcopenia', 'masa muscular', 'ASM', 'bioimpedancia', 'DXA', 'fuerza muscular', 'desempeno fisico'],
  problemas: ['sarcopenia', 'debilidad', 'caídas', 'desnutrición'],
  descripcion: 'Combina fuerza, masa muscular y desempeño con los puntos de corte del EWGSOP2; reutiliza la dinamometría, el SPPB, la marcha y el TUG.',
  objetivo: 'Aplicar el algoritmo del EWGSOP2: sarcopenia probable (fuerza baja), confirmada (más masa baja) y grave (más desempeño bajo).',
  poblacion: 'Personas mayores con sospecha de sarcopenia (p. ej., SARC-F positivo, caídas, debilidad o pérdida de peso).',
  aplicacion: [
    'Fuerza: prensión (kg) o tiempo de 5 levantadas de la silla (s).',
    'Masa muscular: masa muscular esquelética apendicular (ASM) en kg o ajustada por talla (kg/m²), medida con DXA o bioimpedancia; si no se midió, marca «No medida».',
    'Desempeño (opcional): velocidad de marcha, SPPB o TUG.',
  ],
  tiempo: '2 min (con datos ya medidos)',
  direccionClinica: 'sin_direccion',
  barra: false,
  detalleEnResumen: true,
  vinculos: [
    {
      id: 'dinamometria', escala: 'dinamometria', titulo: 'Dinamometría',
      disponible: (res) => (Number.isFinite(res.extras?.max) ? true : 'La dinamometría guardada no tiene un máximo.'),
      describir: (res) => `Prensión máxima ${res.extras.max} kg`,
      aplicar: (res) => ({ fuerza_tipo: 0, prension: String(res.extras.max) }),
      campos: ['fuerza_tipo', 'prension'],
    },
    {
      id: 'sppb_silla', escala: 'sppb', titulo: 'Silla del SPPB (5 levantadas)',
      disponible: (res) => (Number.isFinite(res.extras?.tiempoSilla) ? true : 'El SPPB guardado no tiene el tiempo de 5 levantadas.'),
      describir: (res) => `Cinco levantadas en ${res.extras.tiempoSilla} s`,
      aplicar: (res) => ({ fuerza_tipo: 1, silla5: String(res.extras.tiempoSilla) }),
      campos: ['fuerza_tipo', 'silla5'],
    },
    {
      id: 'velocidad', escala: 'velocidad', titulo: 'Velocidad de marcha',
      disponible: (res) => (Number.isFinite(res.valor) ? true : 'Sin velocidad registrada.'),
      describir: (res) => `${res.mostrar} m/s`,
      aplicar: (res) => ({ desempeno_tipo: 0, marcha: String(Number(res.valor.toFixed(2))) }),
      campos: ['desempeno_tipo', 'marcha'],
    },
    {
      id: 'sppb', escala: 'sppb', titulo: 'SPPB',
      disponible: (res) => (Number.isFinite(res.puntaje) ? true : 'Sin puntaje de SPPB.'),
      describir: (res) => `${res.puntaje}/12`,
      aplicar: (res) => ({ desempeno_tipo: 1, sppb: String(res.puntaje) }),
      campos: ['desempeno_tipo', 'sppb'],
    },
    {
      id: 'tug', escala: 'tug', titulo: 'TUG',
      disponible: (res) => (Number.isFinite(res.valor) ? true : 'El TUG guardado no tiene un tiempo.'),
      describir: (res) => `${res.mostrar} s`,
      aplicar: (res) => ({ desempeno_tipo: 2, tug: String(res.valor) }),
      campos: ['desempeno_tipo', 'tug'],
    },
  ],
  campos: [
    SEXO,
    {
      id: 'fuerza_tipo', texto: 'Medida de fuerza', textoCorto: 'medida de fuerza', puntua: false, grupo: 'Fuerza muscular',
      opciones: [{ texto: 'Prensión (kg)', valor: 0 }, { texto: 'Cinco levantadas de la silla (s)', valor: 1 }],
    },
    { id: 'prension', tipo: 'numero', texto: 'Fuerza de prensión máxima', unidad: 'kg', min: 0, max: 100, decimales: 1, visibleSi: (r) => r.fuerza_tipo === 0 },
    { id: 'silla5', tipo: 'numero', texto: 'Tiempo de 5 levantadas', unidad: 's', min: 2, max: 120, decimales: 1, visibleSi: (r) => r.fuerza_tipo === 1 },
    {
      id: 'masa_tipo', texto: 'Masa muscular', textoCorto: 'masa muscular', puntua: false, grupo: 'Cantidad muscular',
      opciones: [{ texto: 'ASM (kg)', valor: 0 }, { texto: 'ASM/talla² (kg/m²)', valor: 1 }, { texto: 'No medida', valor: -1, especial: true }],
    },
    { id: 'asm', tipo: 'numero', texto: 'Masa muscular esquelética apendicular', unidad: 'kg', min: 3, max: 60, decimales: 1, visibleSi: (r) => r.masa_tipo === 0 },
    { id: 'asmi', tipo: 'numero', texto: 'ASM ajustada por talla', unidad: 'kg/m²', min: 2, max: 20, decimales: 2, visibleSi: (r) => r.masa_tipo === 1 },
    {
      id: 'metodo', texto: 'Método de medición', textoCorto: 'método', puntua: false, visibleSi: (r) => r.masa_tipo === 0 || r.masa_tipo === 1,
      opciones: [{ texto: 'DXA', valor: 0 }, { texto: 'Bioimpedancia (BIA)', valor: 1 }, { texto: 'Otro', valor: 2 }],
    },
    {
      id: 'desempeno_tipo', texto: 'Desempeño físico', textoCorto: 'desempeño', puntua: false, grupo: 'Desempeño físico',
      opciones: [{ texto: 'Velocidad de marcha (m/s)', valor: 0 }, { texto: 'SPPB (puntos)', valor: 1 }, { texto: 'TUG (s)', valor: 2 }, { texto: 'No medido', valor: -1, especial: true }],
    },
    { id: 'marcha', tipo: 'numero', texto: 'Velocidad de marcha', unidad: 'm/s', min: 0.05, max: 3, decimales: 2, visibleSi: (r) => r.desempeno_tipo === 0 },
    { id: 'sppb', tipo: 'numero', texto: 'Puntaje SPPB', unidad: 'puntos', min: 0, max: 12, entero: true, visibleSi: (r) => r.desempeno_tipo === 1 },
    { id: 'tug', tipo: 'numero', texto: 'Tiempo del TUG', unidad: 's', min: 2, max: 300, decimales: 1, visibleSi: (r) => r.desempeno_tipo === 2 },
  ],
  bandas: [B_EW.sin, B_EW.probable, B_EW.noconfirmada, B_EW.confirmada, B_EW.grave],
  calcular({ v }) {
    const mujer = v.sexo.valor === 1;
    const lineas = [];
    let fuerzaBaja;
    if (v.fuerza_tipo.valor === 0) {
      const c = mujer ? 16 : 27;
      fuerzaBaja = v.prension < c;
      lineas.push(`Fuerza: prensión ${v.prension} kg (baja si <${c} kg): ${fuerzaBaja ? 'baja' : 'no baja'}.`);
    } else {
      fuerzaBaja = v.silla5 > 15;
      lineas.push(`Fuerza: 5 levantadas en ${v.silla5} s (baja si >15 s): ${fuerzaBaja ? 'baja' : 'no baja'}.`);
    }
    let masaBaja = null;
    if (v.masa_tipo.valor === 0) {
      const c = mujer ? 15 : 20;
      masaBaja = v.asm < c;
      lineas.push(`Masa muscular: ASM ${v.asm} kg (baja si <${c} kg; ${v.metodo.texto}): ${masaBaja ? 'baja' : 'no baja'}.`);
    } else if (v.masa_tipo.valor === 1) {
      const c = mujer ? 5.5 : 7.0;
      masaBaja = v.asmi < c;
      lineas.push(`Masa muscular: ASM/talla² ${v.asmi} kg/m² (baja si <${c}; ${v.metodo.texto}): ${masaBaja ? 'baja' : 'no baja'}.`);
    } else lineas.push('Masa muscular: no medida.');
    let desBajo = null;
    if (v.desempeno_tipo.valor === 0) { desBajo = v.marcha <= 0.8; lineas.push(`Desempeño: marcha ${v.marcha} m/s (bajo si ≤0.8): ${desBajo ? 'bajo' : 'no bajo'}.`); }
    if (v.desempeno_tipo.valor === 1) { desBajo = v.sppb <= 8; lineas.push(`Desempeño: SPPB ${v.sppb} (bajo si ≤8): ${desBajo ? 'bajo' : 'no bajo'}.`); }
    if (v.desempeno_tipo.valor === 2) { desBajo = v.tug >= 20; lineas.push(`Desempeño: TUG ${v.tug} s (bajo si ≥20): ${desBajo ? 'bajo' : 'no bajo'}.`); }
    if (v.desempeno_tipo.valor === -1) lineas.push('Desempeño: no medido.');
    let banda;
    if (!fuerzaBaja) banda = B_EW.sin;
    else if (masaBaja == null) banda = B_EW.probable;
    else if (!masaBaja) banda = B_EW.noconfirmada;
    else banda = desBajo ? B_EW.grave : B_EW.confirmada;
    if (banda === B_EW.probable) lineas.push('Para confirmar: medir la masa muscular (DXA o bioimpedancia).');
    if (banda === B_EW.confirmada && desBajo == null) lineas.push('El desempeño no se midió: no se puede valorar la gravedad.');
    if (!fuerzaBaja && desBajo) lineas.push('El desempeño está bajo con fuerza conservada: buscar otras causas (neurológicas, articulares, cardiorrespiratorias).');
    const sug = banda.hallazgo ? SUG_SARCO : [];
    return { banda: { ...banda, sugerencias: sug }, mostrar: { sin: 'Sin sarcopenia probable', probable: 'Probable', noconfirmada: 'No confirmada', confirmada: 'Confirmada', grave: 'Grave' }[banda.id], lineas, lineasNota: lineas, extras: { fuerzaBaja, masaBaja, desBajo } };
  },
  resumen: (res) => `EWGSOP2: ${minus(res.banda.etiqueta)}.`,
  resumenBreve: (res) => `EWGSOP2: ${minus(res.banda.etiqueta)}`,
  notas: [
    'Puntos de corte del EWGSOP2: prensión <27 kg (hombres) y <16 kg (mujeres); 5 levantadas >15 s; ASM <20 kg y <15 kg; ASM/talla² <7.0 y <5.5 kg/m²; marcha ≤0.8 m/s; SPPB ≤8; TUG ≥20 s.',
    'Los puntos de corte de masa muscular se derivaron sobre todo en población europea y dependen del método (DXA o BIA) y del equipo.',
    'La categoría resulta del algoritmo; el diagnóstico de sarcopenia lo integra el médico con la clínica.',
  ],
  referencias: [REF_EWGSOP2],
};

export const ESCALAS_MOVILIDAD = [silla30, equilibrio4, dinamometria, ewgsop2];
