// Calculadora de infusiones y referencia rápida de sedantes, bloqueo neuromuscular y vasoactivos.
//
// Fuentes: cada perfil de dosis declara su fuente (ficha técnica, guía o la tabla institucional del HG30) y la población
// a la que aplica. Las velocidades de las fichas y de la calculadora salen de las mismas funciones y de la misma
// preparación: no hay cifras de mL/h escritas a mano. La tabla original del HG30 se conserva aparte, como apartado
// histórico, con sus discrepancias documentadas, y no se usa para recomendar.
//
// Es un apoyo de cálculo: la indicación, la dosis y la preparación se verifican con el protocolo vigente y en doble
// chequeo. Ninguna referencia es una orden automática.

export const REVISION_INFUSIONES = '2026-10-12';

/* ---------- Unidades ---------- */

// Familias: masa (g, mg, mcg) y actividad en unidades internacionales (UI, mUI). Nunca se convierte entre familias.
export const UNIDADES_CANTIDAD = {
  g: { base: 'mcg', factor: 1e6, familia: 'masa' },
  mg: { base: 'mcg', factor: 1e3, familia: 'masa' },
  mcg: { base: 'mcg', factor: 1, familia: 'masa' },
  UI: { base: 'mUI', factor: 1e3, familia: 'actividad' },
  mUI: { base: 'mUI', factor: 1, familia: 'actividad' },
};
export const FAMILIAS = {
  masa: { nombre: 'Masa (g, mg, mcg)', cantidades: ['g', 'mg', 'mcg'], dosis: ['mcg/kg/min', 'mcg/kg/h', 'mg/kg/h', 'mcg/min', 'mg/h', 'mcg/h'], bolo: ['mg', 'mcg'] },
  actividad: { nombre: 'Unidades internacionales (UI)', cantidades: ['UI', 'mUI'], dosis: ['mUI/kg/min', 'UI/min', 'UI/h', 'mUI/min'], bolo: ['UI'] },
};
export const familiaDeUnidad = (u) => UNIDADES_CANTIDAD[String(u).split('/')[0]]?.familia || null;

// Unidades de dosis: «mcg/kg/min» → cantidad, por kg, por unidad de tiempo.
export function leerUnidadDosis(u) {
  const partes = String(u).split('/');
  const cantidad = partes[0];
  const porKg = partes.includes('kg');
  const tiempo = partes.at(-1) === 'h' ? 'h' : partes.at(-1) === 'min' ? 'min' : null;
  if (!UNIDADES_CANTIDAD[cantidad] || !tiempo) throw new Error(`Unidad de dosis no válida: ${u}`);
  return { cantidad, porKg, tiempo, base: UNIDADES_CANTIDAD[cantidad].base, factor: UNIDADES_CANTIDAD[cantidad].factor };
}

const positivo = (x) => typeof x === 'number' && Number.isFinite(x) && x > 0;
const noNegativo = (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0;

// Concentración de la preparación en unidad base por mL (mcg/mL o mUI/mL); null si la preparación no es válida.
export function concentracion(cantidad, unidad, volumenMl) {
  const u = UNIDADES_CANTIDAD[unidad];
  if (!u || !positivo(cantidad) || !positivo(volumenMl)) return null;
  return { valor: (cantidad * u.factor) / volumenMl, base: u.base, familia: u.familia };
}

// Dosis → velocidad de la bomba (mL/h). null si algún dato falta, no es válido o las unidades son incompatibles.
export function velocidadMlH(dosis, unidadDosis, pesoKg, conc) {
  const u = leerUnidadDosis(unidadDosis);
  if (!conc || u.base !== conc.base || !noNegativo(dosis)) return null;
  if (u.porKg && !positivo(pesoKg)) return null;
  const basePorHora = dosis * u.factor * (u.porKg ? pesoKg : 1) * (u.tiempo === 'min' ? 60 : 1);
  const r = basePorHora / conc.valor;
  return Number.isFinite(r) ? r : null;
}

// Velocidad de la bomba (mL/h) → dosis en la unidad pedida.
export function dosisDesdeVelocidad(mlh, unidadDosis, pesoKg, conc) {
  const u = leerUnidadDosis(unidadDosis);
  if (!conc || u.base !== conc.base || !noNegativo(mlh)) return null;
  if (u.porKg && !positivo(pesoKg)) return null;
  const r = (mlh * conc.valor) / (u.factor * (u.porKg ? pesoKg : 1) * (u.tiempo === 'min' ? 60 : 1));
  return Number.isFinite(r) ? r : null;
}

// Convierte una dosis entre unidades de la misma familia y con el mismo «por kg». null si no es posible sin peso o sin
// una conversión farmacológica (p. ej., mcg/kg/min ↔ mcg/min, o mg ↔ UI).
export function convertirDosis(valor, desde, hacia) {
  const a = leerUnidadDosis(desde);
  const b = leerUnidadDosis(hacia);
  if (a.base !== b.base || a.porKg !== b.porKg || !noNegativo(valor)) return null;
  return (valor * a.factor * (a.tiempo === 'min' ? 60 : 1)) / (b.factor * (b.tiempo === 'min' ? 60 : 1));
}

// Volumen de una dosis única (cantidad total) con una concentración dada.
export function volumenDeDosis(cantidad, unidad, conc) {
  const u = UNIDADES_CANTIDAD[unidad];
  if (!u || !conc || u.base !== conc.base || !positivo(cantidad)) return null;
  return (cantidad * u.factor) / conc.valor;
}

// Bolo por kg: dosis por kg × peso → cantidad total y mL de una concentración dada.
export function bolo(dosisPorKg, unidad, pesoKg, conc) {
  const u = UNIDADES_CANTIDAD[unidad];
  if (!u || !conc || u.base !== conc.base || !positivo(pesoKg) || !positivo(dosisPorKg)) return null;
  const total = dosisPorKg * pesoKg;
  return { total, unidad, ml: (total * u.factor) / conc.valor };
}

// Redondeo para mostrar: más decimales en valores pequeños.
export function redondear(x) {
  if (x == null || !Number.isFinite(x)) return null;
  const a = Math.abs(x);
  const d = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.1 ? 3 : 4;
  return Number(x.toFixed(d));
}
export const fmtNum = (x) => (x == null || !Number.isFinite(x) ? '—' : String(redondear(x)).replace(/\.0+$/, ''));

// Concentración legible: «10 mg/mL (10000 mcg/mL)».
export function textoConcentracion(conc) {
  if (!conc) return '—';
  if (conc.base === 'mUI') return conc.valor >= 1000 ? `${fmtNum(conc.valor / 1000)} UI/mL` : `${fmtNum(conc.valor / 1000)} UI/mL (${fmtNum(conc.valor)} mUI/mL)`;
  return conc.valor >= 1000 ? `${fmtNum(conc.valor / 1000)} mg/mL (${fmtNum(conc.valor)} mcg/mL)` : `${fmtNum(conc.valor)} mcg/mL (${fmtNum(conc.valor / 1000)} mg/mL)`;
}

/* ---------- Lectura y validación de entradas ---------- */

// Lee un número escrito por la persona. Acepta coma o punto decimal; rechaza signos, exponentes, texto e infinito.
// opciones: { cero: permite 0, min, max }. Devuelve { estado: 'vacio' | 'error' | 'ok', valor?, mensaje? }.
export function leerEntrada(texto, { cero = false, min = null, max = null, etiqueta = 'El valor' } = {}) {
  const t = String(texto ?? '').trim();
  if (t === '') return { estado: 'vacio' };
  if (/^-/.test(t)) return { estado: 'error', mensaje: `${etiqueta} no puede ser negativo.` };
  if (!/^(\d+([.,]\d*)?|[.,]\d+)$/.test(t)) return { estado: 'error', mensaje: 'Escribe solo un número (por ejemplo, 2.5).' };
  const n = Number(t.replace(',', '.'));
  if (!Number.isFinite(n)) return { estado: 'error', mensaje: 'Escribe un número válido.' };
  if (n === 0 && !cero) return { estado: 'error', mensaje: `${etiqueta} debe ser mayor que 0.` };
  if (min != null && n < min) return { estado: 'error', mensaje: `${etiqueta} debe ser de al menos ${min}.` };
  if (max != null && n > max) return { estado: 'error', mensaje: `${etiqueta} está fuera del rango posible (máximo ${max}).` };
  return { estado: 'ok', valor: n };
}

export const LIMITES_ENTRADA = {
  peso: { min: 1, max: 350, etiqueta: 'El peso' },
  cantidad: { max: 1e6, etiqueta: 'La cantidad' },
  volumen: { max: 2000, etiqueta: 'El volumen' },
  dosis: { max: 1e6, etiqueta: 'La dosis' },
  velocidad: { cero: true, max: 2000, etiqueta: 'La velocidad' },
  bolo: { max: 1e6, etiqueta: 'La dosis' },
  limite: { max: 1e6, etiqueta: 'El límite' },
};

/* ---------- Titulación ---------- */

// Pasos de titulación entre el mínimo y el máximo de un perfil validado, incluidos ambos extremos. En rangos amplios
// (máximo ≥ 20 veces el mínimo) la serie es casi logarítmica para afinar donde más se titula: la parte baja.
const SERIE = [1, 1.5, 2, 3, 5, 7.5];
export function pasosTitulacion(min, max, n = 8) {
  if (!positivo(min) || !positivo(max) || !(max > min)) return [];
  const limpio = (v) => Number(v.toPrecision(10));
  const valores = [min];
  if (max / min >= 20) {
    for (let e = Math.floor(Math.log10(min)) - 1; e <= Math.ceil(Math.log10(max)); e += 1) {
      for (const m of SERIE) {
        const v = limpio(m * 10 ** e);
        if (v > min * 1.0001 && v < max * 0.9999) valores.push(v);
      }
    }
  } else {
    const crudo = (max - min) / (n - 1);
    const mag = 10 ** Math.floor(Math.log10(crudo));
    const paso = [1, 2, 2.5, 5, 10].map((m) => m * mag).reduce((a, b) => (Math.abs(b - crudo) < Math.abs(a - crudo) ? b : a));
    for (let v = Math.ceil((min + paso * 0.5) / paso) * paso; v < max - paso * 0.25; v += paso) valores.push(limpio(v));
  }
  valores.push(max);
  return valores;
}

// Tabla de titulación de un perfil: [{ dosis, mlh }] en la unidad del perfil. Solo para perfiles con intervalo
// validado (no dosis fijas ni perfiles sin máximo). null si falta peso, preparación o intervalo.
export function tablaTitulacion(perfil, pesoKg, conc) {
  if (!perfil || perfil.fija != null || perfil.titular === false || !positivo(perfil.min) || !positivo(perfil.max)) return null;
  if (!conc || familiaDeUnidad(perfil.unidad) !== conc.familia) return null;
  if (leerUnidadDosis(perfil.unidad).porKg && !positivo(pesoKg)) return null;
  return pasosTitulacion(perfil.min, perfil.max).map((dosis) => ({ dosis, mlh: velocidadMlH(dosis, perfil.unidad, pesoKg, conc) }));
}

// Clasifica una dosis respecto a un perfil sin usar el peso: solo compara si la unidad elegida es convertible a la del
// perfil (misma familia y mismo «por kg»). Así, escribir o quitar el peso no cambia la clasificación.
export function clasificarDosis(dosis, unidad, perfil) {
  if (!perfil || !noNegativo(dosis)) return null;
  const v = convertirDosis(dosis, unidad, perfil.unidad);
  if (v == null) return { estado: 'no_comparable', texto: `El perfil «${perfil.indicacion}» se expresa en ${perfil.unidad}; elige esa unidad para compararlo.` };
  if (perfil.fija != null) {
    const igual = Math.abs(v - perfil.fija) <= perfil.fija * 0.005;
    return { estado: igual ? 'fija' : 'distinta_fija', valor: v, texto: igual ? `Coincide con la dosis fija del perfil (${fmtNum(perfil.fija)} ${perfil.unidad}).` : `Distinta de la dosis fija del perfil (${fmtNum(perfil.fija)} ${perfil.unidad}); este perfil no se titula.` };
  }
  if (positivo(perfil.min) && v < perfil.min * 0.999) return { estado: 'debajo', valor: v, texto: `Por debajo del intervalo del perfil (${fmtNum(perfil.min)} a ${fmtNum(perfil.max)} ${perfil.unidad}).` };
  if (positivo(perfil.max) && v > perfil.max * 1.001) {
    const alerta = perfil.alerta && v > perfil.alerta.valor ? ` ${perfil.alerta.texto}` : '';
    return { estado: 'encima', valor: v, texto: `Por encima del intervalo del perfil (${fmtNum(perfil.min)} a ${fmtNum(perfil.max)} ${perfil.unidad}).${alerta}` };
  }
  if (perfil.alerta && v > perfil.alerta.valor) return { estado: 'encima', valor: v, texto: perfil.alerta.texto };
  if (!positivo(perfil.max)) return { estado: 'sin_intervalo', valor: v, texto: 'Este perfil no fija un intervalo: titula según la respuesta y el protocolo.' };
  return { estado: 'dentro', valor: v, texto: `Dentro del intervalo del perfil (${fmtNum(perfil.min)} a ${fmtNum(perfil.max)} ${perfil.unidad}).` };
}

/* ---------- Fuentes ---------- */

export const FUENTES_INFUSION = {
  hg30: { tipo: 'institucional', texto: 'Tabla «Medicamentos en paro, preparo y postparo» (HG30), compartida por el médico. Institucional; transcrita y revisada en octubre de 2026, con discrepancias documentadas.' },
  adrenalinaFDA: { tipo: 'ficha', texto: 'ADRENALIN (epinefrina 1 mg/mL), información para prescribir aprobada por la FDA, revisión 06/2026.', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/204640Orig1s022lbl.pdf' },
  aha2025: { tipo: 'guia', texto: 'American Heart Association. Algoritmo de paro cardiaco del adulto (FV/TVSP/asistolia/AESP), 2025.', url: 'https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/Algorithm-ACLS-CA-250527.pdf' },
  ssc2026: { tipo: 'guia', texto: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2026 (SCCM/ESICM).', url: 'https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026' },
  vasopresinaFDA: { tipo: 'ficha', texto: 'Vasopresina en cloruro de sodio (Baxter, 20 y 40 UI/100 mL), información para prescribir aprobada por la FDA, revisión 02/2024.', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/217569Orig1s001lbl.pdf' },
  norepinefrinaFDA: { tipo: 'ficha', texto: 'Norepinefrina en cloruro de sodio (bolsas de 250 mL), información para prescribir aprobada por la FDA, revisión 10/2022.', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/215700s001lbl.pdf' },
  propofolFDA: { tipo: 'ficha', texto: 'DIPRIVAN (propofol 10 mg/mL), información para prescribir aprobada por la FDA, revisión 08/2022.', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/Label/2022/019627s069lbl.pdf' },
  dexmedetomidinaFDA: { tipo: 'ficha', texto: 'PRECEDEX (dexmedetomidina), información para prescribir aprobada por la FDA, revisión 05/2026.', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/021038s061lbl.pdf' },
  diazepamFDA: { tipo: 'ficha', texto: 'Diazepam inyectable 5 mg/mL, información para prescribir aprobada por la FDA, revisión 07/2021.', url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2021/070312s018lbl.pdf' },
  midazolamFDA: { tipo: 'ficha', texto: 'Midazolam inyectable, información para prescribir de EE. UU. (sección de infusión continua).', url: 'https://medlibrary.org/lib/rx/meds/midazolam/page/9/' },
  rocuronioFDA: { tipo: 'ficha', texto: 'Rocuronio inyectable (Pfizer), información para prescribir de EE. UU.: dosificación.', url: 'https://www.pfizermedical.com/rocuronium-bromide-injection/dosage-admin' },
  vecuronioFDA: { tipo: 'ficha', texto: 'Vecuronio para inyección (Pfizer), información para prescribir de EE. UU.: dosificación.', url: 'https://www.pfizermedical.com/vecuronium-bromide/dosage-admin' },
  dobutaminaFDA: { tipo: 'ficha', texto: 'Dobutamina inyectable (Hospira), información para prescribir de EE. UU., versión vigente desde 2024-12-09.', url: 'https://www.medthority.com/fda/d/dobutamine/dobutamine-dobutamine-hydrochloride-12.5-mgml-hospira-inc' },
  dopaminaFDA: { tipo: 'ficha', texto: 'Dopamina inyectable (Pfizer), información para prescribir de EE. UU., revisión 09/2023.', url: 'https://www.pfizermedical.com/dopamine/highlights' },
  terlipresinaFT: { tipo: 'ficha', texto: 'GLYPRESSIN 1 mg/8.5 mL (terlipresina acetato), ficha técnica de la AEMPS, revisión 05/2026.', url: 'https://cima.aemps.es/cima/pdfs/ft/72359/FT_72359.pdf' },
};
export const TIPOS_FUENTE = { ficha: 'Ficha técnica', guia: 'Guía internacional', institucional: 'Tabla institucional (HG30)' };

/* ---------- Medicamentos ---------- */

export const GRUPOS_INFUSION = [
  { id: 'sedantes', nombre: 'Sedantes' },
  { id: 'bnm', nombre: 'Bloqueo neuromuscular' },
  { id: 'vasoactivos', nombre: 'Vasopresores e inotrópicos' },
];

const ADULTOS = 'Adultos';
const ADULTOS_UCI = 'Adultos intubados con ventilación mecánica';

// infusiones: perfiles por indicación. { id, indicacion, poblacion, unidad, min?, max?, fija?, titular?, inicio?,
//   titulacion?, alerta?, fuente, nota? }
// pautas: dosis únicas. { id, indicacion, poblacion, via, dosis: { min, max?, unidad, porKg? } | porPeso, conc?,
//   frecuencia?, duracionMin?, maximo?, fuente, especializada?, nota? }
export const FARMACOS = [
  {
    id: 'propofol', nombre: 'Propofol', grupo: 'sedantes', familia: 'masa',
    efectos: 'Hipnótico: inducción y mantenimiento de la anestesia y sedación; anticomicial; antiemético.',
    presentacion: { texto: '200 mg/20 mL (10 mg/mL)', cantidad: 200, unidad: 'mg', volumen: 20 },
    preparaciones: [{ texto: '1 g/100 mL sin diluir (10 mg/mL)', cantidad: 1000, unidad: 'mg', volumen: 100, fuente: 'hg30' }],
    infusiones: [
      {
        id: 'uci', indicacion: 'Sedación en UCI', poblacion: ADULTOS_UCI, unidad: 'mcg/kg/min', min: 5, max: 50, inicio: 5,
        titulacion: 'Iniciar a 5 mcg/kg/min y aumentar de 5 a 10 mcg/kg/min, con al menos 5 minutos entre ajustes. Pueden requerirse dosis mayores.',
        alerta: { valor: 66.7, texto: 'Supera 4 mg/kg/h (≈66.7 mcg/kg/min), que la ficha indica no rebasar salvo que el beneficio supere el riesgo.' },
        fuente: 'propofolFDA',
      },
      {
        id: 'hg30', indicacion: 'Sedación', poblacion: 'Adultos, según la tabla del HG30', unidad: 'mcg/kg/min', min: 5, max: 80,
        nota: 'La tabla indica hasta 200 mcg/kg/min en estado epiléptico; no figura en la ficha técnica: aplica solo con protocolo de estado epiléptico.',
        fuente: 'hg30',
      },
    ],
    pautas: [
      { id: 'induccion', indicacion: 'Inducción anestésica', poblacion: 'Adultos menores de 65 años, ASA I–II', via: 'IV, titulada según la respuesta', dosis: { min: 2, max: 2.5, unidad: 'mg', porKg: true }, fuente: 'propofolFDA' },
      { id: 'induccion-mayor', indicacion: 'Inducción anestésica', poblacion: 'Persona mayor, debilitada o ASA III–IV', via: 'IV, titulada (≈20 mg cada 10 s); evitar bolos rápidos', dosis: { min: 1, max: 1.5, unidad: 'mg', porKg: true }, fuente: 'propofolFDA', nota: 'Referencia aproximada de la ficha: la dosis se individualiza.' },
    ],
    advertencias: [
      'Hipotensión proporcional a la dosis, bradicardia y apnea (puede durar más de 60 s); en personas mayores, dosis de inducción menores, mantenimiento más lento y vigilancia estrecha.',
      'Síndrome de infusión de propofol con infusiones prolongadas a dosis altas (>5 mg/kg/h por más de 48 h): acidosis metabólica, hiperpotasemia, rabdomiólisis; suspender si aparece.',
      'Vigilar triglicéridos con riesgo de hiperlipidemia (1 mL aporta ≈0.1 g de grasa).',
    ],
    ajustes: ['Sin ajuste renal ni hepático específico en la ficha.'],
    fuentes: ['propofolFDA', 'hg30'],
    historica: {
      bolo: 'Inducción 1 a 3 mg/kg (50 kg: 5 a 15 mL; 100 kg: 10 a 30 mL).',
      infusion: '5 a 80 mcg/kg/min; estado epiléptico máximo 200 mcg/kg/min. Impreso: 50 kg 3-48-120 mL/h; 100 kg 6-96-240 mL/h.',
      discrepancia: 'Con 10 mg/mL los mL/h impresos son el doble de los correctos (80 mcg/kg/min en 50 kg = 24 mL/h, no 48).',
      otros: 'Sedación profunda, primera línea. Consideraciones: hipotensión proporcional a la dosis, síndrome de infusión de propofol, dislipidemia. Ajuste: no.',
    },
  },
  {
    id: 'dexmedetomidina', nombre: 'Dexmedetomidina', grupo: 'sedantes', familia: 'masa',
    efectos: 'Agonista α2: sedante, ansiolítico, coadyuvante analgésico.',
    presentacion: { texto: '200 mcg/2 mL (100 mcg/mL); debe diluirse', cantidad: 200, unidad: 'mcg', volumen: 2 },
    preparaciones: [{ texto: '400 mcg/100 mL de SS 0.9 % (4 mcg/mL)', cantidad: 400, unidad: 'mcg', volumen: 100, fuente: 'hg30' }],
    infusiones: [
      { id: 'uci', indicacion: 'Sedación en UCI', poblacion: ADULTOS_UCI, unidad: 'mcg/kg/h', min: 0.2, max: 0.7, titulacion: 'Ajustar al nivel de sedación deseado. La ficha de la FDA limita la infusión a 24 horas.', fuente: 'dexmedetomidinaFDA' },
      { id: 'procedimiento', indicacion: 'Sedación para procedimientos', poblacion: 'Adultos no intubados', unidad: 'mcg/kg/h', min: 0.2, max: 1, inicio: 0.6, fuente: 'dexmedetomidinaFDA' },
      { id: 'hg30', indicacion: 'Sedación', poblacion: 'Adultos, según la tabla del HG30', unidad: 'mcg/kg/h', min: 0.2, max: 1.5, nota: 'Supera el máximo de 0.7 mcg/kg/h de la ficha de la FDA para sedación en UCI.', fuente: 'hg30' },
    ],
    pautas: [
      { id: 'carga', indicacion: 'Carga opcional (sedación en UCI o procedimientos)', poblacion: ADULTOS, via: 'Infusión IV en 10 minutos (no en bolo), con la preparación diluida', dosis: { min: 1, max: 1, unidad: 'mcg', porKg: true }, duracionMin: 10, usarPreparacion: true, fuente: 'dexmedetomidinaFDA', nota: 'Puede omitirse al cambiar desde otro sedante. Para procedimientos, 0.5 mcg/kg en procedimientos poco invasivos.' },
      { id: 'carga-mayor', indicacion: 'Carga para procedimientos', poblacion: 'Mayores de 65 años', via: 'Infusión IV en 10 minutos, con la preparación diluida', dosis: { min: 0.5, max: 0.5, unidad: 'mcg', porKg: true }, duracionMin: 10, usarPreparacion: true, fuente: 'dexmedetomidinaFDA', nota: 'Considerar también reducir el mantenimiento.' },
    ],
    advertencias: [
      'Bradicardia, paro sinusal e hipotensión, más marcados con hipovolemia, diabetes, hipertensión crónica y en personas mayores; precaución con bloqueo cardiaco avanzado o disfunción ventricular grave. Requiere monitoreo continuo.',
      'Hipertensión transitoria durante la carga.',
    ],
    ajustes: ['Hepatopatía: considerar reducir la dosis (la depuración disminuye con la gravedad).', 'Mayores de 65 años: considerar reducir la dosis.'],
    fuentes: ['dexmedetomidinaFDA', 'hg30'],
    historica: {
      bolo: 'No recomendado.',
      infusion: '0.2 a 1.5 mcg/kg/h. Impreso: 50 kg 2.5 a 18 mL/h; 100 kg 5 a 36 mL/h.',
      discrepancia: 'Los mínimos coinciden; los máximos impresos (18 y 36) están redondeados a la baja: con 4 mcg/mL, 1.5 mcg/kg/h son 18.75 (50 kg) y 37.5 (100 kg). El máximo de 1.5 supera el de la ficha de la FDA para UCI (0.7).',
      otros: 'Paliativos: ansiólisis y coadyuvante de la analgesia (no monoterapia). Consideraciones: alto potencial crono/inotrópico negativo. Ajuste: no.',
    },
  },
  {
    id: 'midazolam', nombre: 'Midazolam', grupo: 'sedantes', familia: 'masa',
    efectos: 'Benzodiacepina: sedación, ansiólisis, anticomicial.',
    presentacion: { texto: '15 mg/3 mL (5 mg/mL)', cantidad: 15, unidad: 'mg', volumen: 3 },
    preparaciones: [{ texto: '30 mg/100 mL de SS 0.9 % (0.3 mg/mL)', cantidad: 30, unidad: 'mg', volumen: 100, fuente: 'hg30' }],
    infusiones: [
      { id: 'sedacion', indicacion: 'Sedación continua', poblacion: ADULTOS, unidad: 'mg/kg/h', min: 0.02, max: 0.1, titulacion: 'Ajustar 25 a 50 % de la velocidad; reducir 10 a 25 % cada pocas horas para encontrar la mínima eficaz.', fuente: 'midazolamFDA' },
      { id: 'hg30', indicacion: 'Sedación', poblacion: 'Adultos, según la tabla del HG30', unidad: 'mg/kg/h', min: 0.01, max: 0.1, fuente: 'hg30' },
    ],
    pautas: [
      { id: 'carga', indicacion: 'Carga antes de la infusión', poblacion: ADULTOS, via: 'IV lenta, en varios minutos; repetible cada 10 a 15 min', dosis: { min: 0.01, max: 0.05, unidad: 'mg', porKg: true }, fuente: 'midazolamFDA' },
      { id: 'crisis', indicacion: 'Crisis convulsiva', poblacion: 'Adultos, según la tabla del HG30', via: 'IV (1 mL) o IM (2 mL) de la presentación de 5 mg/mL', dosis: { min: 5, max: 10, unidad: 'mg' }, fuente: 'hg30', nota: 'Verifica la pauta con tu protocolo de crisis convulsivas.' },
    ],
    advertencias: [
      'Depresión respiratoria y apnea; riesgo mayor con opioides u otros depresores del sistema nervioso central.',
      'Personas mayores, debilitadas o de mayor riesgo: dosis menores.',
      'La eliminación se retrasa en hepatopatía, bajo gasto cardiaco y con inhibidores de CYP3A4 (p. ej., eritromicina).',
    ],
    ajustes: ['Nota de Huella: en insuficiencia renal y en infusiones prolongadas puede prolongarse la sedación por acumulación de metabolitos.'],
    fuentes: ['midazolamFDA', 'hg30'],
    historica: {
      bolo: 'Inducción 0.1 a 0.3 mg/kg (50 kg: 1 a 3 mL; 100 kg: 2 a 6 mL). Anticomicial 1 mL IV / 2 mL IM; in extremis, vía nasal.',
      infusion: '0.01 a 0.1 mg/kg/h. Impreso: 50 kg 1.6 a 5 mL/h; 100 kg 3 a 10 mL/h.',
      discrepancia: 'Con 0.3 mg/mL, 0.1 mg/kg/h en 50 kg son 16.7 mL/h; el máximo impreso (5 mL/h) corresponde a 0.03 mg/kg/h.',
      otros: 'Consideraciones: hipotensión importante, depresión respiratoria. Ajuste: no.',
    },
  },
  {
    id: 'diazepam', nombre: 'Diazepam', grupo: 'sedantes', familia: 'masa',
    efectos: 'Benzodiacepina: sedación, anticomicial, relajante muscular.',
    presentacion: { texto: '10 mg/2 mL (5 mg/mL)', cantidad: 10, unidad: 'mg', volumen: 2 },
    preparaciones: [],
    sinInfusion: 'Sin infusión continua.',
    infusiones: [],
    pautas: [
      { id: 'estado-epileptico', indicacion: 'Estado epiléptico', poblacion: ADULTOS, via: 'IV lenta: al menos 1 minuto por cada 5 mg (1 mL)', dosis: { min: 5, max: 10, unidad: 'mg' }, frecuencia: 'Repetir cada 10 a 15 min si es necesario', maximo: 'Máximo 30 mg', fuente: 'diazepamFDA' },
      { id: 'mayor', indicacion: 'Dosis inicial menor', poblacion: 'Personas mayores o debilitadas', via: 'IV lenta', dosis: { min: 2, max: 5, unidad: 'mg' }, frecuencia: 'Aumentar despacio según la respuesta', fuente: 'diazepamFDA' },
    ],
    advertencias: [
      'Depresión respiratoria y apnea, e incluso paro cardiaco por vía IV: mayor riesgo en personas mayores, muy enfermas o con reserva pulmonar limitada. Tener a la mano el equipo de reanimación y soporte ventilatorio.',
      'Con opioides u otros depresores: sedación profunda, depresión respiratoria, coma y muerte (advertencia en recuadro).',
      'Riesgo de abuso, dependencia y abstinencia al suspender de forma brusca.',
    ],
    ajustes: ['Personas mayores o debilitadas: dosis menores (habitualmente 2 a 5 mg) e incrementos lentos.', 'Hepatopatía: precauciones habituales; individualizar la dosis.'],
    fuentes: ['diazepamFDA', 'hg30'],
    historica: {
      bolo: '0.02 a 0.1 mg/kg; 1 mL (5 mg) + 0.5 mL (2.5 mg) cada 60 s según necesidad; 2.5 mg según necesidad cada 6, 8 o 12 h.',
      infusion: 'No recomendada en infusión continua.',
      discrepancia: 'La tabla decía «depresión respiratoria mínima» y «reducir 50 % en insuficiencia hepática y ancianos»; la ficha advierte apnea y paro cardiaco y recomienda dosis menores individualizadas.',
      otros: 'Síndrome neuroléptico maligno; intoxicación por cloroquinas (QT largo, choque). Ajuste renal: no.',
    },
  },
  {
    id: 'vecuronio', nombre: 'Vecuronio', grupo: 'bnm', familia: 'masa',
    efectos: 'Bloqueador neuromuscular no despolarizante.',
    presentacion: { texto: '4 mg/mL reconstituido (presentación de la tabla)', cantidad: 4, unidad: 'mg', volumen: 1 },
    preparaciones: [
      { texto: '40 mg/100 mL de SS 0.9 % (0.4 mg/mL)', cantidad: 40, unidad: 'mg', volumen: 100, fuente: 'hg30' },
      { texto: '10 mg/100 mL (0.1 mg/mL)', cantidad: 10, unidad: 'mg', volumen: 100, fuente: 'vecuronioFDA' },
      { texto: '20 mg/100 mL (0.2 mg/mL)', cantidad: 20, unidad: 'mg', volumen: 100, fuente: 'vecuronioFDA' },
    ],
    infusiones: [
      { id: 'quirofano', indicacion: 'Mantenimiento del bloqueo', poblacion: 'Adultos anestesiados, tras recuperación inicial del bolo', unidad: 'mcg/kg/min', min: 0.8, max: 1.2, inicio: 1, titulacion: 'Iniciar a 1 mcg/kg/min y titular a 90 % de supresión de la respuesta (tren de cuatro).', fuente: 'vecuronioFDA', nota: 'La ficha indica que el uso prolongado en UCI no está suficientemente estudiado para recomendar dosis.' },
    ],
    pautas: [
      { id: 'intubacion', indicacion: 'Intubación', poblacion: ADULTOS, via: 'IV', dosis: { min: 0.08, max: 0.1, unidad: 'mg', porKg: true }, fuente: 'vecuronioFDA' },
    ],
    advertencias: ['Produce apnea: requiere ventilación, sedación y analgesia adecuadas. No es anticomicial: enmascara las crisis sin tratarlas.'],
    ajustes: ['La tabla del HG30 sugiere calcular con el peso ideal en obesidad (>50 % sobre el IMC), excepto en urgencia; la ficha indica individualizar.'],
    fuentes: ['vecuronioFDA', 'hg30'],
    historica: {
      bolo: 'Inducción 0.1 a 0.2 mg/kg (50 kg: 1 a 3 mL; 100 kg: 2 a 6 mL); dosis inicial 2 ámpulas.',
      infusion: '0.8 a 1.2 mcg/kg/min. Impreso: 50 kg 6 a 9 mL/h; 100 kg 12 a 18 mL/h.',
      discrepancia: 'Las velocidades coinciden. El bolo de la tabla (0.1 a 0.2 mg/kg) es mayor que el de la ficha (0.08 a 0.1).',
      otros: 'Bloqueo neuromuscular en SIRA, neurocrítico, tórax inestable, quemado o trauma grave.',
    },
  },
  {
    id: 'rocuronio', nombre: 'Rocuronio', grupo: 'bnm', familia: 'masa',
    efectos: 'Bloqueador neuromuscular no despolarizante de inicio rápido.',
    presentacion: { texto: '50 mg/5 mL (10 mg/mL)', cantidad: 50, unidad: 'mg', volumen: 5 },
    preparaciones: [{ texto: '200 mg/100 mL de SS 0.9 % (2 mg/mL)', cantidad: 200, unidad: 'mg', volumen: 100, fuente: 'hg30' }],
    infusiones: [
      { id: 'quirofano', indicacion: 'Mantenimiento del bloqueo', poblacion: 'Adultos anestesiados, tras recuperación inicial del bolo', unidad: 'mcg/kg/min', min: 4, max: 16, inicio: 10, titulacion: 'Iniciar a 10 a 12 mcg/kg/min; en estudios clínicos, 4 a 16 mcg/kg/min. Con anestésicos inhalados puede reducirse 30 a 50 %.', fuente: 'rocuronioFDA' },
      { id: 'hg30', indicacion: 'Bloqueo continuo', poblacion: 'Adultos, según la tabla del HG30', unidad: 'mcg/kg/min', min: 3, max: 8, fuente: 'hg30' },
    ],
    pautas: [
      { id: 'intubacion', indicacion: 'Intubación', poblacion: ADULTOS, via: 'IV', dosis: { min: 0.6, max: 0.6, unidad: 'mg', porKg: true }, fuente: 'rocuronioFDA' },
      { id: 'srapida', indicacion: 'Intubación de secuencia rápida', poblacion: 'Adultos premedicados y anestesiados', via: 'IV', dosis: { min: 0.6, max: 1.2, unidad: 'mg', porKg: true }, fuente: 'rocuronioFDA' },
    ],
    advertencias: ['Produce apnea: requiere ventilación, sedación y analgesia adecuadas. No es anticomicial.', 'Personas mayores: duración ligeramente prolongada.'],
    ajustes: ['Obesidad: la ficha calcula la dosis de intubación con el peso real; la tabla del HG30 sugiere el peso ideal. Define el criterio con tu protocolo.'],
    fuentes: ['rocuronioFDA', 'hg30'],
    historica: {
      bolo: 'Inducción 1 a 1.2 mg/kg (50 kg: 5 a 6 mL; 100 kg: 10 a 12 mL).',
      infusion: '3 a 8 mcg/kg/min. Impreso: 50 kg 4.5 a 12 mL/h; 100 kg 12 a 18 mL/h.',
      discrepancia: 'Con 2 mg/mL, en 100 kg son 9 a 24 mL/h; el rango impreso para 100 kg parece copiado del vecuronio.',
      otros: 'Lo mismo que el vecuronio, pero más rápido. Ajuste: obesos, peso ideal.',
    },
  },
  {
    id: 'adrenalina', nombre: 'Adrenalina (epinefrina)', grupo: 'vasoactivos', familia: 'masa',
    efectos: 'Agonista β1 > α1 > β2: inotrópico y cronotrópico positivo; vasopresor.',
    presentacion: { texto: '1 mg/mL (ámpula)', cantidad: 1, unidad: 'mg', volumen: 1 },
    preparaciones: [
      { texto: '10 mg/250 mL (40 mcg/mL), tabla del HG30', cantidad: 10, unidad: 'mg', volumen: 250, fuente: 'hg30', nota: 'La ficha recomienda diluir en glucosado al 5 % o glucosado con cloruro de sodio; no recomienda solución salina sola.' },
      { texto: '1 mg/1000 mL de glucosado al 5 % (1 mcg/mL), ficha', cantidad: 1, unidad: 'mg', volumen: 1000, fuente: 'adrenalinaFDA' },
    ],
    infusiones: [
      { id: 'choque-septico', indicacion: 'Hipotensión en choque séptico', poblacion: ADULTOS, unidad: 'mcg/kg/min', min: 0.05, max: 2, titulacion: 'Titular a la PAM deseada cada 10 a 15 min, en incrementos de 0.05 a 0.2 mcg/kg/min. SSC 2026: se sugiere agregarla si la PAM es insuficiente pese a norepinefrina y vasopresina.', fuente: 'adrenalinaFDA' },
    ],
    pautas: [
      { id: 'paro', indicacion: 'Paro cardiaco', poblacion: ADULTOS, via: 'IV/IO, seguida de un bolo de solución', dosis: { min: 1, max: 1, unidad: 'mg' }, frecuencia: 'Cada 3 a 5 min durante la reanimación', fuente: 'aha2025' },
      { id: 'anafilaxia', indicacion: 'Anafilaxia', poblacion: 'Adultos y niños de 30 kg o más', pesoMin: 30, via: 'IM (o SC) en la cara anterolateral del muslo, sin diluir', dosis: { min: 0.3, max: 0.5, unidad: 'mg' }, frecuencia: 'Repetir cada 5 a 10 min si es necesario; no repetir en el mismo sitio', maximo: 'Máximo 0.5 mg por inyección', fuente: 'adrenalinaFDA' },
      { id: 'anafilaxia-ped', indicacion: 'Anafilaxia', poblacion: 'Niños de menos de 30 kg', pesoMenorQue: 30, via: 'IM (o SC) en la cara anterolateral del muslo, sin diluir', dosis: { min: 0.01, max: 0.01, unidad: 'mg', porKg: true }, frecuencia: 'Repetir cada 5 a 10 min si es necesario', maximo: 'Máximo 0.3 mg por inyección', topeMg: 0.3, fuente: 'adrenalinaFDA' },
      { id: 'push', indicacion: 'Bolos IV de dosis baja («push dose»)', poblacion: 'Adultos con hipotensión, en área de cuidados críticos', via: 'IV, solo por personal con experiencia, con monitoreo continuo y según protocolo institucional', dosis: { min: 0.005, max: 0.02, unidad: 'mg' }, conc: { texto: 'dilución de 10 mcg/mL: 1 mg en 100 mL, o 1 mg aforado a 10 mL y de ahí 1 mL aforado a 10 mL', cantidad: 1, unidad: 'mg', volumen: 100 }, frecuencia: 'Según la tabla del HG30: 0.5 a 2 mL cada 5 min', fuente: 'hg30', especializada: true, nota: 'No figura en la ficha técnica.' },
    ],
    advertencias: ['Taquicardia, arritmias, isquemia miocárdica; aumenta el consumo de oxígeno. Extravasación con necrosis: infundir en vena grande.'],
    ajustes: ['En personas mayores o con enfermedad vascular oclusiva, evitar las venas de las piernas.'],
    fuentes: ['adrenalinaFDA', 'aha2025', 'ssc2026', 'hg30'],
    historica: {
      bolo: '1 mL IV cada 3 min (RCP); 0.5 a 1 mL IM/IV en anafilaxia; push dose 0.5 a 2 mL/5 min.',
      infusion: 'No es de primera línea; «0.5 a 1 mcg/kg/min». Impreso: 50 kg 4 a 75 mL/h; 100 kg 8 a 150 mL/h.',
      discrepancia: '«0.5 a 1 mL IM/IV en anafilaxia» no separa vía ni dosis: la ficha indica 0.3 a 0.5 mg IM (máximo 0.5 mg). La dosis de infusión impresa no coincide con sus propios mL/h, que corresponden a 0.05 a 1 mcg/kg/min.',
      otros: 'Consideraciones: taquicardia, arritmias, aumenta el gasto cardiaco y los requerimientos tisulares, isquemia periférica.',
    },
  },
  {
    id: 'norepinefrina', nombre: 'Norepinefrina (noradrenalina)', grupo: 'vasoactivos', familia: 'masa',
    efectos: 'Agonista α1 > β1: vasopresor de primera línea en choque séptico (SSC 2026).',
    presentacion: { texto: '4 mg/4 mL (ámpula)', cantidad: 4, unidad: 'mg', volumen: 4 },
    preparaciones: [
      { texto: '8 mg/100 mL de SS 0.9 % (80 mcg/mL)', cantidad: 8, unidad: 'mg', volumen: 100, fuente: 'hg30' },
      { texto: '16 mg/100 mL de SS 0.9 % (160 mcg/mL)', cantidad: 16, unidad: 'mg', volumen: 100, fuente: 'hg30' },
      { texto: '4 mg/250 mL (16 mcg/mL), premezcla', cantidad: 4, unidad: 'mg', volumen: 250, fuente: 'norepinefrinaFDA' },
      { texto: '8 mg/250 mL (32 mcg/mL), premezcla', cantidad: 8, unidad: 'mg', volumen: 250, fuente: 'norepinefrinaFDA' },
    ],
    infusiones: [
      { id: 'ficha', indicacion: 'Hipotensión aguda grave', poblacion: ADULTOS, unidad: 'mcg/min', inicio: 8, inicioMax: 12, titular: false, titulacion: 'Inicio de 8 a 12 mcg/min; mantenimiento típico de 2 a 4 mcg/min. Ajustar según la respuesta; medir la TA cada 2 min hasta lograr el efecto y después cada 5 min. La ficha no fija un máximo.', fuente: 'norepinefrinaFDA' },
      { id: 'hg30', indicacion: 'Choque', poblacion: 'Adultos, según la tabla del HG30', unidad: 'mcg/kg/min', min: 0.01, max: 2, titulacion: 'Modificar según la respuesta cada 3 a 5 min.', fuente: 'hg30' },
    ],
    pautas: [],
    sinBolo: 'Bolo no recomendado.',
    advertencias: ['Arritmias, bradicardia refleja, isquemia periférica; extravasación con necrosis.', 'Meta en choque séptico (SSC 2026): PAM inicial de 65 mmHg; en personas de 65 años o más, 60 a 65 mmHg.'],
    ajustes: [],
    fuentes: ['norepinefrinaFDA', 'ssc2026', 'hg30'],
    historica: {
      bolo: 'No recomendado.',
      infusion: '0.01 a 2 mcg/kg/min; «modificar a respuesta, generalmente TAM >65; iniciar 5 mL/h».',
      discrepancia: 'El inicio a 5 mL/h no expresa una dosis: equivale a ≈0.095 mcg/kg/min con 8 mg/100 mL o a ≈0.19 con 16 mg/100 mL en 70 kg. Huella expresa el inicio como dosis y calcula los mL/h con el peso y la preparación reales.',
      otros: 'Consideraciones: arritmias, bradicardia refleja, isquemia periférica. Ajustar cada 3 a 5 min.',
    },
  },
  {
    id: 'dobutamina', nombre: 'Dobutamina', grupo: 'vasoactivos', familia: 'masa',
    efectos: 'Agonista β1 > β2 > α1: inotrópico positivo, vasodilatador; poco cronotrópico.',
    presentacion: { texto: '250 mg/5 mL', cantidad: 250, unidad: 'mg', volumen: 5 },
    preparaciones: [{ texto: '250 mg/100 mL de glucosado al 5 % (2.5 mg/mL)', cantidad: 250, unidad: 'mg', volumen: 100, fuente: 'hg30' }],
    infusiones: [
      { id: 'ficha', indicacion: 'Apoyo inotrópico a corto plazo por descompensación cardiaca con contractilidad disminuida', poblacion: ADULTOS, unidad: 'mcg/kg/min', min: 2.5, max: 15, alerta: { valor: 15, texto: 'La ficha menciona hasta 40 mcg/kg/min solo en raras ocasiones.' }, fuente: 'dobutaminaFDA' },
      { id: 'hg30', indicacion: 'Inotrópico', poblacion: 'Adultos, según la tabla del HG30', unidad: 'mcg/kg/min', min: 2, max: 10, fuente: 'hg30' },
    ],
    pautas: [],
    sinBolo: 'Bolo solo en casos específicos.',
    advertencias: ['Arritmias, alteraciones del potasio y calcio; disminuye la resistencia periférica: no se recomienda en choque vasodilatado.'],
    ajustes: ['La tabla del HG30 advierte mioclonías con TFG <20 mL/min.'],
    fuentes: ['dobutaminaFDA', 'hg30'],
    historica: { bolo: 'Casos específicos.', infusion: '2 a 10 mcg/kg/min. Impreso: 50 kg 2.4 a 12 mL/h; 100 kg 4.8 a 24 mL/h.', discrepancia: 'Las velocidades coinciden.', otros: '«TFF <20 % puede producir mioclonos».' },
  },
  {
    id: 'dopamina', nombre: 'Dopamina', grupo: 'vasoactivos', familia: 'masa',
    efectos: 'Catecolamina con efecto dependiente de la dosis.',
    presentacion: { texto: '200 mg/5 mL o 400 mg/10 mL (40 mg/mL)', cantidad: 200, unidad: 'mg', volumen: 5 },
    preparaciones: [],
    sinPreparacion: 'La tabla del HG30 no indica la preparación: escribe la tuya en la calculadora.',
    infusiones: [
      { id: 'ficha', indicacion: 'Choque (mejorar el estado hemodinámico)', poblacion: 'Adultos y niños', unidad: 'mcg/kg/min', min: 2, max: 50, inicio: 2, titulacion: 'Iniciar a 2 a 5 mcg/kg/min y aumentar de 5 a 10 mcg/kg/min según la respuesta; no más de 50 mcg/kg/min.', fuente: 'dopaminaFDA' },
    ],
    pautas: [],
    sinBolo: 'Bolo no recomendado.',
    advertencias: ['SSC 2026: en choque séptico se recomienda norepinefrina sobre dopamina como primera línea (recomendación fuerte).', 'Taquiarritmias; las dosis bajas no protegen la función renal.'],
    ajustes: [],
    fuentes: ['dopaminaFDA', 'ssc2026', 'hg30'],
    historica: { bolo: 'No recomendado.', infusion: '1 a 2 mcg/kg/min: D1; 5 a 10: β1; >10 a 30: α1.', discrepancia: 'Sin preparación en la tabla.', otros: 'Taquiarritmias, posible tolerancia después de 5 días, fiebre, eosinofilia.' },
  },
  {
    id: 'vasopresina', nombre: 'Vasopresina', grupo: 'vasoactivos', familia: 'actividad',
    efectos: 'Vasopresor no catecolaminérgico (receptores V1, V2 y V3).',
    presentacion: { texto: '20 UI/1 mL', cantidad: 20, unidad: 'UI', volumen: 1 },
    preparaciones: [
      { texto: '40 UI/100 mL de SS 0.9 % (0.4 UI/mL)', cantidad: 40, unidad: 'UI', volumen: 100, fuente: 'hg30' },
      { texto: '20 UI/100 mL (0.2 UI/mL), premezcla', cantidad: 20, unidad: 'UI', volumen: 100, fuente: 'vasopresinaFDA' },
    ],
    infusiones: [
      { id: 'ssc', indicacion: 'Choque séptico: se agrega cuando la norepinefrina va en aumento', poblacion: ADULTOS, unidad: 'UI/min', fija: 0.03, titulacion: 'Dosis fija de 0.03 UI/min, sin titular (práctica descrita en SSC 2026; el panel la agregó con una mediana de norepinefrina de 0.3 mcg/kg/min).', fuente: 'ssc2026' },
      { id: 'ficha-septico', indicacion: 'Choque séptico (titulación de la ficha)', poblacion: ADULTOS, unidad: 'UI/min', min: 0.01, max: 0.07, inicio: 0.01, titulacion: 'Iniciar a 0.01 UI/min y subir 0.005 UI/min cada 10 a 15 min hasta la TA objetivo. Hay pocos datos con más de 0.07 UI/min.', fuente: 'vasopresinaFDA' },
      { id: 'ficha-poscardiotomia', indicacion: 'Choque poscardiotomía', poblacion: ADULTOS, unidad: 'UI/min', min: 0.03, max: 0.1, inicio: 0.03, titulacion: 'Iniciar a 0.03 UI/min y subir 0.005 UI/min cada 10 a 15 min. Hay pocos datos con más de 0.1 UI/min.', fuente: 'vasopresinaFDA' },
    ],
    pautas: [],
    sinBolo: 'Bolo no recomendado.',
    advertencias: ['Retiro gradual: tras 8 h con la TA objetivo sin catecolaminas, bajar 0.005 UI/min cada hora según tolerancia.', 'Isquemia digital, mesentérica o miocárdica; hiponatremia.'],
    ajustes: [],
    fuentes: ['ssc2026', 'vasopresinaFDA', 'hg30'],
    historica: {
      bolo: 'No recomendado.',
      infusion: '0.5 a 2 mUI/kg/min. Impreso: 50 kg 4 a 15 mL/h; 100 kg 8 a 30 mL/h.',
      discrepancia: 'La tabla expresa la dosis por kilogramo; en choque séptico se usa una dosis fija en UI/min que no depende del peso.',
      otros: 'Coadyuvante en choque vasodilatado y en sangrado variceal (frente a terlipresina). No retirar de forma abrupta.',
    },
  },
  {
    id: 'terlipresina', nombre: 'Terlipresina', grupo: 'vasoactivos', familia: 'masa',
    efectos: 'Análogo de la vasopresina (V1 > V2): vasoconstricción esplácnica y periférica.',
    presentacion: { texto: '1 mg/8.5 mL (1 mg de terlipresina acetato por ámpula)', cantidad: 1, unidad: 'mg', volumen: 8.5 },
    preparaciones: [],
    sinInfusion: 'Infusión continua solo en el síndrome hepatorrenal, según la ficha (2 mg/24 h, hasta 12 mg/24 h).',
    infusiones: [],
    pautas: [
      { id: 'variceal', indicacion: 'Sangrado por várices esofagogástricas', poblacion: 'Adultos', via: 'Bolo IV', porPeso: [{ menorQue: 50, mg: 1, texto: 'menos de 50 kg' }, { hasta: 70, mg: 1.5, texto: '50 a 70 kg' }, { mg: 2, texto: 'más de 70 kg' }], frecuencia: 'Cada 4 h, 24 h tras el control del sangrado, máximo 48 h. Si hay reacciones adversas, puede reducirse a 1 mg cada 4 h.', fuente: 'terlipresinaFT' },
      { id: 'shr', indicacion: 'Síndrome hepatorrenal tipo 1', poblacion: 'Adultos', via: 'Bolo IV', dosis: { min: 1, max: 1, unidad: 'mg' }, frecuencia: 'Cada 4 a 6 h; si la creatinina no baja al menos 25 % en 2 días, hasta 2 mg cada 4 a 6 h (máximo 12 mg/día). Suspender a los 14 días si no hay respuesta.', fuente: 'terlipresinaFT' },
    ],
    contraindicaciones: ['Hipersensibilidad a la terlipresina o a los excipientes.', 'Embarazo.'],
    advertencias: [
      'SSC 2026: se sugiere no usar terlipresina en adultos con choque séptico. No administrar en choque séptico con gasto cardiaco bajo (ficha).',
      'Isquemia miocárdica, intestinal o periférica, arritmias y sobrecarga circulatoria; necrosis cutánea.',
      'Insuficiencia respiratoria, incluso mortal, en el síndrome hepatorrenal: estabilizar la función respiratoria antes de la primera dosis.',
      'Hiponatremia; prolongación del QT y torsade de pointes.',
    ],
    ajustes: ['Mayores de 70 años con enfermedad cardiovascular: usar con precaución (poca experiencia).'],
    fuentes: ['terlipresinaFT', 'ssc2026', 'hg30'],
    historica: {
      bolo: '1 mg IV cada 6 a 8 h (choque); 2 mg inicial, 1 a 2 mg cada 4 h (sangrado variceal).',
      infusion: 'No recomendada.',
      discrepancia: 'La pauta genérica para «choque» se retiró: SSC 2026 sugiere no usarla en choque séptico. La ficha dosifica el sangrado variceal por peso (1, 1.5 o 2 mg).',
      otros: 'Torsade de pointes, necrosis, isquemia cardiaca; menos vasopresora que la vasopresina.',
    },
  },
];

export const farmacoDe = (id) => FARMACOS.find((f) => f.id === id) || null;
export const FUENTE_TABLA = FUENTES_INFUSION.hg30.texto;

// Concentración de una preparación o presentación declarada.
export const concDe = (p) => (p ? concentracion(p.cantidad, p.unidad, p.volumen) : null);

// Concentración con la que se mide el volumen de una pauta: su dilución propia, la preparación (cargas en infusión) o
// la presentación sin diluir.
export function concPauta(f, pauta, prep = null) {
  if (pauta.conc) return { conc: concDe(pauta.conc), texto: pauta.conc.texto };
  if (pauta.usarPreparacion) {
    const p = prep || f.preparaciones?.[0];
    return { conc: concDe(p), texto: p?.texto || 'tu preparación' };
  }
  return { conc: concDe(f.presentacion), texto: f.presentacion?.texto || '' };
}

// ¿La pauta aplica a este peso? null si no hay restricción o no hay peso; texto si no aplica.
export function pautaNoAplica(pauta, pesoKg) {
  if (!positivo(pesoKg)) return null;
  if (pauta.pesoMin != null && pesoKg < pauta.pesoMin) return `Esta pauta es para ${pauta.poblacion.toLowerCase()}.`;
  if (pauta.pesoMenorQue != null && pesoKg >= pauta.pesoMenorQue) return `Esta pauta es para ${pauta.poblacion.toLowerCase()}.`;
  return null;
}

// Dosis de una pauta para un peso: { min, max, unidad } en cantidad total, o null si requiere peso y no hay.
export function dosisPauta(pauta, pesoKg) {
  if (pauta.porPeso) {
    if (!positivo(pesoKg)) return null;
    const tramo = pauta.porPeso.find((t) => (t.menorQue != null ? pesoKg < t.menorQue : t.hasta != null ? pesoKg <= t.hasta : true));
    return { min: tramo.mg, max: tramo.mg, unidad: 'mg' };
  }
  const d = pauta.dosis;
  if (d.porKg) {
    if (!positivo(pesoKg)) return null;
    const tope = (x) => (pauta.topeMg != null ? Math.min(x, pauta.topeMg) : x);
    return { min: tope(d.min * pesoKg), max: tope(d.max * pesoKg), unidad: d.unidad };
  }
  return { min: d.min, max: d.max, unidad: d.unidad };
}

// Texto de la dosis de una pauta, con su volumen en la concentración de la pauta (o la presentación).
export function textoPauta(f, pauta, pesoKg = null, prep = null) {
  const { conc, texto: concTexto } = concPauta(f, pauta, prep);
  const rango = (a, b, u) => (a === b ? `${fmtNum(a)} ${u}` : `${fmtNum(a)} a ${fmtNum(b)} ${u}`);
  let dosis;
  if (pauta.porPeso) dosis = pauta.porPeso.map((t) => `${t.texto}: ${fmtNum(t.mg)} mg (${fmtNum(volumenDeDosis(t.mg, 'mg', conc))} mL)`).join('; ');
  else {
    const d = pauta.dosis;
    const base = d.porKg ? `${rango(d.min, d.max, `${d.unidad}/kg`)}` : rango(d.min, d.max, d.unidad);
    const vol = !d.porKg && conc ? ` = ${rango(volumenDeDosis(d.min, d.unidad, conc), volumenDeDosis(d.max, d.unidad, conc), 'mL')}` : '';
    dosis = `${base}${vol}`;
  }
  const noAplica = pautaNoAplica(pauta, pesoKg);
  const calc = pesoKg && !noAplica && (pauta.porPeso || pauta.dosis?.porKg) ? (() => {
    const t = dosisPauta(pauta, pesoKg);
    if (!t) return '';
    const vMin = volumenDeDosis(t.min, t.unidad, conc);
    const vMax = volumenDeDosis(t.max, t.unidad, conc);
    const ritmo = pauta.duracionMin && vMax != null ? ` en ${pauta.duracionMin} min (${rango(vMin * (60 / pauta.duracionMin), vMax * (60 / pauta.duracionMin), 'mL/h')})` : '';
    return ` → con ${fmtNum(pesoKg)} kg: ${rango(t.min, t.max, t.unidad)} = ${rango(vMin, vMax, 'mL')}${ritmo}`;
  })() : '';
  return `${dosis}${calc}${concTexto ? ` de ${concTexto}` : ''}`;
}

// Velocidades de ejemplo de un perfil con la preparación de referencia, calculadas (nunca escritas a mano).
export function ejemplosPerfil(f, perfil) {
  const prep = f.preparaciones?.[0];
  const conc = concDe(prep);
  if (!conc || familiaDeUnidad(perfil.unidad) !== conc.familia) return null;
  const porKg = leerUnidadDosis(perfil.unidad).porKg;
  const valores = perfil.fija != null ? [perfil.fija] : [perfil.min, perfil.max].filter(positivo);
  if (!valores.length) {
    if (perfil.inicio == null) return null;
    valores.push(perfil.inicio, ...(perfil.inicioMax != null ? [perfil.inicioMax] : []));
  }
  const rango = (w) => valores.map((x) => fmtNum(velocidadMlH(x, perfil.unidad, w, conc))).join(' a ');
  return { prep, texto: porKg ? `50 kg: ${rango(50)} mL/h; 100 kg: ${rango(100)} mL/h` : `${rango(null)} mL/h`, valores };
}
