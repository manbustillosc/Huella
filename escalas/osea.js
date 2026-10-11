// Salud ósea: registro del resultado oficial de FRAX® y de la densitometría (DXA).
// Huella no reconstruye el algoritmo FRAX ni aplica umbrales de tratamiento, y distingue la osteoporosis
// densitométrica (T-score) de la clínica (fractura por fragilidad), que decide el médico.

const SEXO = { id: 'sexo', texto: 'Sexo', textoCorto: 'sexo', puntua: false, prefill: 'sexo', opciones: [{ texto: 'Mujer', valor: 1, clave: 'mujer' }, { texto: 'Hombre', valor: 0, clave: 'hombre' }] };
const EDAD = { id: 'edad', tipo: 'numero', texto: 'Edad', unidad: 'años', min: 18, max: 120, entero: true, prefill: 'edad' };
const SUG_CAIDAS = 'Evaluar el riesgo de caídas (TUG, prueba de equilibrio de 4 etapas, levantarse de la silla en 30 s) y la fragilidad: la mayoría de las fracturas ocurren tras una caída.';

/* ---------- FRAX (registro del resultado oficial) ---------- */

export const frax = {
  id: 'frax',
  nombre: 'FRAX®: probabilidad de fractura a 10 años (registro)',
  corto: 'FRAX',
  dominio: 'osea',
  tipo: 'pronostico',
  registro: true,
  aliases: ['fractura', 'osteoporosis', 'riesgo de fractura', 'fractura de cadera', 'FRAXplus'],
  problemas: ['osteoporosis', 'riesgo de fractura', 'caídas'],
  descripcion: 'Registro de las probabilidades a 10 años calculadas en la herramienta oficial con el modelo de México.',
  objetivo: 'Documentar la probabilidad a 10 años de fractura osteoporótica mayor y de cadera calculada con la herramienta oficial.',
  poblacion: 'Mujeres y hombres de 40 a 90 años; el modelo debe ser el del país (México).',
  aplicacion: [
    'Calcula en la herramienta oficial (fraxplus.org) con el modelo de México; Huella no reproduce ni aproxima el algoritmo.',
    'Registra las dos probabilidades y si el cálculo incluyó la densidad mineral ósea del cuello femoral.',
  ],
  tiempo: '1 min (registro)',
  // Sin dirección clínica: una disminución de FRAX no demuestra por sí sola una reducción del riesgo por una intervención.
  direccionClinica: 'sin_direccion',
  unidadCambio: 'puntos porcentuales',
  decimalesCambio: 1,
  barra: false,
  detalleEnResumen: true,
  campos: [
    {
      id: 'modelo', texto: 'Modelo de país', textoCorto: 'modelo', puntua: false,
      opciones: [{ texto: 'México', valor: 1 }, { texto: 'Otro país', valor: 0, detalle: 'Solo si la persona pertenece a esa población.' }],
    },
    { id: 'mayor', tipo: 'numero', texto: 'Fractura osteoporótica mayor a 10 años', unidad: '%', min: 0, max: 100, decimales: 1 },
    { id: 'cadera', tipo: 'numero', texto: 'Fractura de cadera a 10 años', unidad: '%', min: 0, max: 100, decimales: 1 },
    {
      id: 'dmo', texto: 'Cálculo', textoCorto: 'cálculo', puntua: false,
      opciones: [{ texto: 'Con DMO del cuello femoral', valor: 1 }, { texto: 'Sin DMO (solo con el IMC)', valor: 0 }],
    },
    {
      id: 'herramienta', texto: 'Herramienta usada', textoCorto: 'herramienta', puntua: false,
      opciones: [
        { texto: 'FRAXplus® (fraxplus.org)', valor: 'fraxplus' },
        { texto: 'FRAX® (calculadora clásica)', valor: 'frax' },
        { texto: 'No consta', valor: 'no_consta', detalle: 'Sin este dato, la comparación con otros cálculos no se interpreta.' },
      ],
    },
  ],
  validar({ v }) {
    if (Number.isFinite(v.mayor) && Number.isFinite(v.cadera) && v.cadera > v.mayor) return { cadera: 'La probabilidad de fractura de cadera no puede superar la de fractura mayor.' };
    return null;
  },
  bandas: [
    { id: 'registrado', rango: 'Probabilidades registradas', etiqueta: 'Probabilidad de fractura registrada', nivel: 'neutro', texto: 'Probabilidades calculadas en la herramienta oficial. Huella no las clasifica: los umbrales de intervención para México dependen de la edad (Clark et al., 2018) y de la guía vigente.' },
  ],
  calcular({ v }) {
    const lineas = [`Probabilidad a 10 años: fractura osteoporótica mayor ${v.mayor}% y de cadera ${v.cadera}% (modelo ${v.modelo.valor === 1 ? 'de México' : 'de otro país'}, ${v.dmo.valor === 1 ? 'con DMO del cuello femoral' : 'sin DMO'}; ${v.herramienta.valor === 'no_consta' ? 'herramienta no consta' : v.herramienta.texto}).`];
    if (v.modelo.valor === 0) lineas.push('Se usó un modelo de otro país: confirma que corresponde a la población de la persona.');
    if (v.dmo.valor === 0) lineas.push('Calculado sin DMO: si se dispone de densitometría, el cálculo con la DMO del cuello femoral es más preciso.');
    return {
      banda: { ...frax.bandas[0], sugerencias: ['Integrar la probabilidad con los umbrales de intervención por edad del modelo mexicano, las fracturas previas, el riesgo de caídas y las preferencias de la persona.', SUG_CAIDAS] },
      valor: v.mayor, unidad: '%', mostrar: String(v.mayor), sufijo: '% fractura mayor',
      lineas, lineasNota: lineas, extras: { mayor: v.mayor, cadera: v.cadera, dmo: v.dmo.valor === 1, modelo: v.modelo.valor === 1 ? 'mexico' : 'otro', herramienta: v.herramienta.valor },
    };
  },
  // Solo se comparan cálculos hechos en condiciones equivalentes: mismo modelo de país, misma herramienta y DMO.
  comparable: (a, b) => {
    const ea = a.extras || {};
    const eb = b.extras || {};
    const motivos = [];
    if (!ea.modelo || !eb.modelo || ea.modelo === 'otro' || eb.modelo === 'otro') motivos.push('modelo de país no especificado en alguno');
    else if (ea.modelo !== eb.modelo) motivos.push('modelos de país distintos');
    if (ea.dmo !== eb.dmo) motivos.push('uno con DMO y otro sin DMO');
    if (!ea.herramienta || !eb.herramienta || ea.herramienta === 'no_consta' || eb.herramienta === 'no_consta') motivos.push('herramienta sin registrar');
    else if (ea.herramienta !== eb.herramienta) motivos.push('herramientas distintas');
    if (motivos.length) return { textoNoInterpretable: `Comparación longitudinal no interpretable: los resultados proceden de condiciones de cálculo diferentes (${motivos.join('; ')})` };
    return { advertencia: 'Un cambio de FRAX refleja cambios en los datos de entrada (edad, DMO, factores de riesgo); no demuestra por sí solo el efecto de una intervención.' };
  },
  resumen: (res) => `FRAX (modelo ${res.lineas[0].includes('de México') ? 'de México' : 'de otro país'}): fractura mayor ${res.extras.mayor}% y cadera ${res.extras.cadera}% a 10 años, ${res.extras.dmo ? 'con' : 'sin'} DMO.`,
  resumenBreve: (res) => `FRAX ${res.extras.mayor}% mayor, ${res.extras.cadera}% cadera`,
  notas: [
    'Huella no reconstruye el algoritmo de FRAX®: solo registra el resultado de la herramienta oficial.',
    'Los umbrales de intervención para México dependen de la edad (de 2.6% a los 40 años a 20.0% a los 90 años para la fractura mayor; Clark et al., 2018); consulta la tabla por edad y la guía vigente. Huella no aplica umbrales de tratamiento.',
    'FRAX no considera las caídas ni la dosis de glucocorticoides o el número de fracturas previas; el juicio clínico ajusta su interpretación.',
    'En el seguimiento solo se comparan cálculos con el mismo modelo de país, la misma herramienta y el mismo uso de la DMO; un cambio no demuestra por sí solo el efecto de una intervención.',
  ],
  licencia: { texto: 'FRAX® y FRAXplus® son marcas registradas; © Osteoporosis Research Ltd (Reino Unido). Herramienta oficial en fraxplus.org. Huella solo registra el resultado.', enlace: 'https://www.fraxplus.org/calculation-tool' },
  referencias: [
    { texto: 'Clark P, Denova-Gutiérrez E, Zerbini C, et al. FRAX-based intervention and assessment thresholds in seven Latin American countries. Osteoporos Int. 2018;29(3):707-15.', doi: '10.1007/s00198-017-4341-4' },
    { texto: 'Kanis JA. Assessment of fracture risk and its application to screening for postmenopausal osteoporosis: synopsis of a WHO report. Osteoporos Int. 1994;4(6):368-81.', doi: '10.1007/BF01622200' },
  ],
};

/* ---------- Densitometría (DXA) ---------- */

const T_OP = -2.5;
const T_NORMAL = -1.0;
const tSitio = (id, texto) => ({ id, tipo: 'numero', texto, unidad: 'DE', min: -8, max: 6, decimales: 1, opcional: true });
const SITIOS = [['t_columna', 'columna lumbar (L1–L4)'], ['t_cuello', 'cuello femoral'], ['t_cadera', 'cadera total'], ['t_radio', 'radio 33%']];

const B_DXA = {
  normal: { id: 'normal', rango: 'T-score ≥ −1.0', etiqueta: 'Densidad mineral ósea normal', nivel: 'bien', texto: 'T-score más bajo de −1.0 o mayor (categorías de la OMS).' },
  baja: { id: 'baja', rango: 'T-score entre −1.0 y −2.5', etiqueta: 'Baja masa ósea u osteopenia', nivel: 'leve', hallazgo: true, texto: 'T-score más bajo menor de −1.0 y mayor de −2.5 (categorías de la OMS).' },
  osteoporosis: { id: 'osteoporosis', rango: 'T-score ≤ −2.5', etiqueta: 'Osteoporosis densitométrica', nivel: 'moderado', hallazgo: true, texto: 'T-score más bajo de −2.5 o menor (categorías de la OMS). Es una categoría densitométrica; el diagnóstico y el tratamiento integran la clínica.' },
  zbaja: { id: 'zbaja', rango: 'Z-score ≤ −2.0', etiqueta: 'Por debajo del intervalo esperado para la edad', nivel: 'moderado', hallazgo: true, texto: 'Z-score de −2.0 o menor (ISCD): por debajo de lo esperado para la edad; buscar causas secundarias.' },
  zesperada: { id: 'zesperada', rango: 'Z-score > −2.0', etiqueta: 'Dentro del intervalo esperado para la edad', nivel: 'bien', texto: 'Z-score mayor de −2.0 (ISCD).' },
};

export const dxa = {
  id: 'dxa',
  nombre: 'Densitometría ósea (DXA): registro',
  corto: 'DXA',
  dominio: 'osea',
  tipo: 'evaluacion',
  aliases: ['densitometria', 'densidad mineral osea', 'DMO', 'T-score', 'Z-score', 'osteoporosis', 'osteopenia'],
  problemas: ['osteoporosis', 'osteopenia', 'fractura por fragilidad'],
  descripcion: 'T-scores por sitio (o Z-score cuando corresponde) y fractura por fragilidad; categoría densitométrica de la OMS.',
  objetivo: 'Registrar el resultado de la densitometría y su categoría densitométrica sin confundirla con el diagnóstico clínico de osteoporosis.',
  poblacion: 'T-score: mujeres posmenopáusicas y hombres de 50 años o más. Z-score: mujeres premenopáusicas y hombres menores de 50 años (ISCD).',
  aplicacion: [
    'Registra los T-scores que informa la densitometría (columna L1–L4, cuello femoral, cadera total y, si se midió, radio 33%). Huella usa el más bajo, como recomienda la ISCD.',
    'En mujeres premenopáusicas y hombres menores de 50 años registra el Z-score más bajo.',
    'Anota la fecha del estudio como fecha de aplicación.',
  ],
  tiempo: '1 min (registro)',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'T-score mayor',
  textoEmpeoramiento: 'T-score menor',
  unidadCambio: 'DE',
  decimalesCambio: 1,
  barra: false,
  detalleEnResumen: true,
  campos: [
    SEXO,
    EDAD,
    {
      id: 'menopausia', texto: '¿Posmenopáusica?', textoCorto: 'posmenopausia', puntua: false,
      visibleSi: (r) => r.sexo === 0, opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }],
    },
    tSitio('t_columna', 'T-score, columna lumbar (L1–L4)'),
    tSitio('t_cuello', 'T-score, cuello femoral'),
    tSitio('t_cadera', 'T-score, cadera total'),
    tSitio('t_radio', 'T-score, radio 33%'),
    { id: 'z_min', tipo: 'numero', texto: 'Z-score más bajo', unidad: 'DE', min: -8, max: 6, decimales: 1, opcional: true },
    {
      id: 'fractura', texto: 'Fractura por fragilidad de cadera o vertebral (clínica o morfométrica)', textoCorto: 'fractura por fragilidad', puntua: false,
      opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }, { texto: 'No se sabe', valor: -1, especial: true }],
    },
    {
      id: 'dmo_sitio', texto: 'DMO para el seguimiento: sitio', textoCorto: 'sitio de la DMO', puntua: false, grupo: 'Seguimiento (opcional)', opcional: true,
      ayuda: 'El seguimiento se valora con la DMO en g/cm² del mismo sitio y en el mismo equipo, no con el T-score.',
      opciones: [...SITIOS.map(([, n]) => ({ texto: n.charAt(0).toUpperCase() + n.slice(1), valor: n })), { texto: 'No registrar', valor: null, especial: true }],
    },
    { id: 'dmo_valor', tipo: 'numero', texto: 'DMO en ese sitio', unidad: 'g/cm²', min: 0.2, max: 2.0, decimales: 3, visibleSi: (r) => r.dmo_sitio != null && r.dmo_sitio < SITIOS.length },
    {
      id: 'equipo', texto: 'Equipo de densitometría', textoCorto: 'equipo', puntua: false, visibleSi: (r) => r.dmo_sitio != null && r.dmo_sitio < SITIOS.length,
      opciones: [{ texto: 'Hologic', valor: 'hologic' }, { texto: 'GE Healthcare (Lunar)', valor: 'lunar' }, { texto: 'Otro', valor: 'otro' }, { texto: 'No consta', valor: 'no_consta' }],
    },
    { id: 'lsc', tipo: 'numero', texto: 'Cambio mínimo significativo del centro (LSC) para ese sitio', unidad: 'g/cm²', min: 0.005, max: 0.2, decimales: 3, opcional: true, visibleSi: (r) => r.dmo_sitio != null && r.dmo_sitio < SITIOS.length },
  ],
  validar({ v }) {
    const usaT = (v.sexo?.valor === 1 && v.menopausia?.valor === 1) || (v.sexo?.valor === 0 && Number.isFinite(v.edad) && v.edad >= 50);
    const hayT = SITIOS.some(([id]) => Number.isFinite(v[id]));
    if (v.sexo && Number.isFinite(v.edad) && (v.sexo.valor === 0 || v.menopausia)) {
      if (usaT && !hayT) return { t_columna: 'Registra al menos un T-score.' };
      if (!usaT && !Number.isFinite(v.z_min)) return { z_min: 'En esta población se interpreta el Z-score: regístralo.' };
    }
    return null;
  },
  bandas: [B_DXA.normal, B_DXA.baja, B_DXA.osteoporosis, B_DXA.zbaja, B_DXA.zesperada],
  calcular({ v }) {
    const usaT = (v.sexo.valor === 1 && v.menopausia?.valor === 1) || (v.sexo.valor === 0 && v.edad >= 50);
    const lineas = [];
    const sug = [];
    let banda;
    let valor = null;
    let sitiosMin = [];
    if (usaT) {
      const medidos = SITIOS.filter(([id]) => Number.isFinite(v[id])).map(([id, n]) => ({ n, t: v[id] }));
      const min = Math.min(...medidos.map((x) => x.t));
      valor = min;
      banda = min >= T_NORMAL ? B_DXA.normal : min > T_OP ? B_DXA.baja : B_DXA.osteoporosis;
      sitiosMin = medidos.filter((x) => x.t === min).map((x) => x.n);
      lineas.push(`T-scores: ${medidos.map((x) => `${x.n} ${x.t}`).join('; ')}. Más bajo: ${min} (${sitiosMin.join(' y ')}).`);
      if (v.t_radio != null && Number.isFinite(v.t_radio) && medidos.length === 1) lineas.push('Solo se registró el radio 33%: la ISCD lo usa cuando la cadera o la columna no pueden medirse o interpretarse.');
    } else {
      valor = v.z_min;
      banda = v.z_min <= -2.0 ? B_DXA.zbaja : B_DXA.zesperada;
      lineas.push(`Z-score más bajo: ${v.z_min}. En esta población no se usan las categorías de T-score de la OMS.`);
    }
    if (v.dmo_sitio?.valor && Number.isFinite(v.dmo_valor)) {
      lineas.push(`DMO para el seguimiento: ${v.dmo_sitio.valor} ${v.dmo_valor} g/cm² (${v.equipo?.valor === 'no_consta' ? 'equipo no consta' : v.equipo?.texto}${Number.isFinite(v.lsc) ? `; cambio mínimo significativo del centro ${v.lsc} g/cm²` : ''}).`);
    }
    if (v.fractura.valor === 1) {
      lineas.push('Fractura por fragilidad de cadera o vertebral: es un criterio clínico de osteoporosis independiente de la DMO; el diagnóstico lo establece el médico.');
      if (banda.id === 'osteoporosis') lineas.push('T-score de −2.5 o menor con fractura por fragilidad: corresponde a la categoría de osteoporosis grave o establecida de la OMS.');
      sug.push('Con fractura por fragilidad, valorar el tratamiento para prevenir nuevas fracturas con independencia del T-score (decisión clínica).');
    }
    if (banda.hallazgo) sug.push('Integrar con FRAX, los factores de riesgo y las causas secundarias de pérdida ósea.');
    if (banda.hallazgo || v.fractura.valor === 1) sug.push(SUG_CAIDAS);
    return {
      banda: { ...banda, hallazgo: banda.hallazgo || v.fractura.valor === 1, sugerencias: sug },
      valor, unidad: usaT ? 'T' : 'Z', mostrar: String(valor), sufijo: usaT ? 'T-score más bajo' : 'Z-score más bajo',
      lineas, lineasNota: lineas,
      extras: {
        usaT, valor, fractura: v.fractura.valor, sitiosMin,
        dmo: v.dmo_sitio?.valor && Number.isFinite(v.dmo_valor) ? { sitio: v.dmo_sitio.valor, valor: v.dmo_valor, equipo: v.equipo?.valor || 'no_consta', lsc: Number.isFinite(v.lsc) ? v.lsc : null } : null,
      },
    };
  },
  // El seguimiento densitométrico se valora con la DMO (g/cm²) del mismo sitio y equipo frente al cambio mínimo
  // significativo del centro (ISCD); nunca con diferencias aisladas del T-score, ni entre T-score y Z-score.
  comparable: (a, b) => {
    const ea = a.extras || {};
    const eb = b.extras || {};
    if (ea.usaT !== eb.usaT) return { noInterpretable: 'una aplicación usa T-score y otra Z-score; son magnitudes distintas y no se comparan' };
    const da = ea.dmo;
    const db = eb.dmo;
    if (da && db && da.sitio === db.sitio) {
      const dif = db.valor - da.valor;
      const base = `DMO de ${da.sitio} de ${da.valor} a ${db.valor} g/cm² (${dif >= 0 ? '+' : ''}${dif.toFixed(3)})`;
      const mismoEquipo = da.equipo === db.equipo && !['otro', 'no_consta'].includes(da.equipo);
      const lsc = db.lsc ?? da.lsc;
      if (mismoEquipo && lsc) {
        const supera = Math.abs(dif) >= lsc;
        return { noInterpretable: `el seguimiento no se valora con el T-score. ${base}: ${supera ? 'igual o mayor' : 'menor'} que el cambio mínimo significativo del centro (${lsc} g/cm²)${supera ? '; cambio significativo que requiere interpretación clínica' : '; sin cambio significativo'}` };
      }
      return { noInterpretable: `el seguimiento no se valora con el T-score. ${base}; sin el mismo equipo y el cambio mínimo significativo del centro, la diferencia no se puede calificar` };
    }
    const otrosSitios = (ea.sitiosMin || []).join() !== (eb.sitiosMin || []).join() ? '; además, el valor más bajo corresponde a sitios distintos' : '';
    return { noInterpretable: `una diferencia aislada del T-score no demuestra un cambio densitométrico${otrosSitios}. Para el seguimiento registra la DMO en g/cm² del mismo sitio, el equipo y el cambio mínimo significativo del centro` };
  },
  siguientes: [
    { id: 'frax', si: (res) => Boolean(res.banda?.hallazgo), motivo: 'Probabilidad de fractura a 10 años con la DMO del cuello femoral (herramienta oficial).' },
    { id: 'tug', si: (res) => Boolean(res.banda?.hallazgo), motivo: 'Riesgo de caídas: movilidad y marcha.' },
    { id: 'equilibrio4', si: (res) => Boolean(res.banda?.hallazgo), motivo: 'Riesgo de caídas: equilibrio estático (CDC STEADI).' },
  ],
  resumen: (res) => `DXA: ${res.banda.etiqueta.toLowerCase()} (${res.extras.usaT ? 'T-score' : 'Z-score'} más bajo ${res.mostrar})${res.extras.fractura === 1 ? '; fractura por fragilidad de cadera o vertebral' : ''}.`,
  resumenBreve: (res) => `DXA: ${res.banda.etiqueta.toLowerCase()} (${res.mostrar})`,
  notas: [
    'Categorías densitométricas de la OMS con el T-score más bajo de columna lumbar, cuello femoral y cadera total (radio 33% si corresponde): normal ≥ −1.0; baja masa ósea entre −1.0 y −2.5; osteoporosis ≤ −2.5.',
    'La osteoporosis densitométrica no es lo mismo que la clínica: una fractura por fragilidad de cadera o vertebral establece el diagnóstico clínico aunque el T-score no llegue a −2.5.',
    'En mujeres premenopáusicas y hombres menores de 50 años se interpreta el Z-score (≤ −2.0: por debajo de lo esperado para la edad).',
    'Seguimiento: la ISCD recomienda comparar la DMO en g/cm² del mismo sitio, en el mismo equipo, con el cambio mínimo significativo (LSC) del centro. Huella no califica como mejoría o deterioro las diferencias del T-score ni compara T-score con Z-score.',
  ],
  referencias: [
    { texto: 'Kanis JA. Assessment of fracture risk and its application to screening for postmenopausal osteoporosis: synopsis of a WHO report. Osteoporos Int. 1994;4(6):368-81.', doi: '10.1007/BF01622200' },
    { texto: 'Shuhart CR, Yeap SS, Anderson PA, et al. Executive summary of the 2019 ISCD Position Development Conference. J Clin Densitom. 2019;22(4):453-71.', doi: '10.1016/j.jocd.2019.07.001' },
  ],
};

export const ESCALAS_OSEA = [frax, dxa];
