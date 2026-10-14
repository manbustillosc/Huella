// Conversión de unidades y referencia rápida. Cada grupo convierte un valor a todas las unidades del grupo.
// Los factores de laboratorio usan las masas molares habituales; los de sales de electrolitos se calculan con la masa
// molar de la sal (mEq = mmol × valencia).

// Grupos lineales: cada unidad tiene un factor a la unidad base del grupo.
export const GRUPOS_LINEALES = [
  {
    id: 'masa', nombre: 'Masa', base: 'mg',
    unidades: [
      { id: 'kg', texto: 'kg', factor: 1e6 },
      { id: 'g', texto: 'g', factor: 1e3 },
      { id: 'mg', texto: 'mg', factor: 1 },
      { id: 'mcg', texto: 'mcg (µg)', factor: 1e-3 },
      { id: 'ng', texto: 'ng', factor: 1e-6 },
      { id: 'lb', texto: 'lb (libra)', factor: 453592.37 },
      { id: 'oz', texto: 'oz (onza)', factor: 28349.523125 },
    ],
  },
  {
    id: 'volumen', nombre: 'Volumen', base: 'mL',
    unidades: [
      { id: 'L', texto: 'L', factor: 1000 },
      { id: 'dL', texto: 'dL', factor: 100 },
      { id: 'mL', texto: 'mL (cc)', factor: 1 },
      { id: 'mcL', texto: 'µL', factor: 1e-3 },
      { id: 'cda', texto: 'cucharada (15 mL)', factor: 15 },
      { id: 'cdta', texto: 'cucharadita (5 mL)', factor: 5 },
      { id: 'flOz', texto: 'onza líquida (EUA)', factor: 29.5735 },
    ],
  },
  {
    id: 'concentracion', nombre: 'Concentración', base: 'mg/mL',
    unidades: [
      { id: 'g/mL', texto: 'g/mL', factor: 1000 },
      { id: 'mg/mL', texto: 'mg/mL', factor: 1 },
      { id: 'mcg/mL', texto: 'mcg/mL', factor: 1e-3 },
      { id: 'g/L', texto: 'g/L', factor: 1 },
      { id: 'mg/dL', texto: 'mg/dL', factor: 0.01 },
      { id: 'porcentaje', texto: '% (g/100 mL)', factor: 10 },
      { id: 'mg/L', texto: 'mg/L', factor: 1e-3 },
      { id: 'ng/mL', texto: 'ng/mL', factor: 1e-6 },
    ],
  },
  {
    id: 'presion', nombre: 'Presión', base: 'mmHg',
    unidades: [
      { id: 'mmHg', texto: 'mmHg', factor: 1 },
      { id: 'kPa', texto: 'kPa', factor: 7.50062 },
      { id: 'cmH2O', texto: 'cmH₂O', factor: 0.735559 },
      { id: 'atm', texto: 'atm', factor: 760 },
    ],
  },
  {
    id: 'longitud', nombre: 'Longitud y talla', base: 'cm',
    unidades: [
      { id: 'm', texto: 'm', factor: 100 },
      { id: 'cm', texto: 'cm', factor: 1 },
      { id: 'mm', texto: 'mm', factor: 0.1 },
      { id: 'in', texto: 'pulgadas', factor: 2.54 },
      { id: 'ft', texto: 'pies', factor: 30.48 },
    ],
  },
  {
    id: 'tiempo', nombre: 'Tiempo', base: 'min',
    unidades: [
      { id: 's', texto: 'segundos', factor: 1 / 60 },
      { id: 'min', texto: 'minutos', factor: 1 },
      { id: 'h', texto: 'horas', factor: 60 },
      { id: 'd', texto: 'días', factor: 1440 },
    ],
  },
];

// Formato de conversiones: 4 cifras significativas sin notación científica (101.3; 13.41; 0.000001).
export function fmtConv(x) {
  if (x == null || !Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const dec = Math.min(12, Math.max(0, 3 - Math.floor(Math.log10(Math.abs(x)))));
  return x.toFixed(dec).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

export const grupoDe = (id) => GRUPOS_LINEALES.find((g) => g.id === id) || null;

// Convierte valor de la unidad «desde» a todas las del grupo: [{ unidad, valor }].
export function convertirLineal(grupoId, valor, desde) {
  const g = grupoDe(grupoId);
  const u = g?.unidades.find((x) => x.id === desde);
  if (!u || !Number.isFinite(valor)) return [];
  const base = valor * u.factor;
  return g.unidades.map((x) => ({ unidad: x, valor: base / x.factor }));
}

// Temperatura (no lineal).
export const cAF = (c) => (c * 9) / 5 + 32;
export const fAC = (f) => ((f - 32) * 5) / 9;

/* ---------- Diluciones expresadas como proporción ---------- */
// 1:1000 = 1 g en 1000 mL = 1 mg/mL. 1:10 000 = 0.1 mg/mL. 1:200 000 = 5 mcg/mL.
export const proporcionAMgMl = (n) => (n > 0 ? 1000 / n : null);
export const mgMlAProporcion = (mgml) => (mgml > 0 ? 1000 / mgml : null);

/* ---------- Goteo ---------- */
export const FACTORES_GOTEO = [
  { id: 10, texto: 'Macrogotero 10 gotas/mL' },
  { id: 15, texto: 'Macrogotero 15 gotas/mL' },
  { id: 20, texto: 'Macrogotero 20 gotas/mL' },
  { id: 60, texto: 'Microgotero 60 microgotas/mL' },
];
export const mlhAGotas = (mlh, factor) => (mlh * factor) / 60;
export const gotasAMlh = (gotas, factor) => (gotas * 60) / factor;

/* ---------- Velocidad de dosis (sin preparación) ---------- */
// Convierte una dosis entre unidades de velocidad, con o sin peso: todo pasa a mcg/min.
export const UNIDADES_VELOCIDAD = [
  { id: 'mcg/kg/min', porKg: true, aMcgMin: 1 },
  { id: 'mcg/kg/h', porKg: true, aMcgMin: 1 / 60 },
  { id: 'mg/kg/h', porKg: true, aMcgMin: 1000 / 60 },
  { id: 'mg/kg/día', porKg: true, aMcgMin: 1000 / 1440 },
  { id: 'mcg/min', porKg: false, aMcgMin: 1 },
  { id: 'mcg/h', porKg: false, aMcgMin: 1 / 60 },
  { id: 'mg/min', porKg: false, aMcgMin: 1000 },
  { id: 'mg/h', porKg: false, aMcgMin: 1000 / 60 },
  { id: 'mg/día', porKg: false, aMcgMin: 1000 / 1440 },
  { id: 'g/día', porKg: false, aMcgMin: 1e6 / 1440 },
];
export function convertirVelocidad(valor, desde, pesoKg) {
  const u = UNIDADES_VELOCIDAD.find((x) => x.id === desde);
  if (!u || !Number.isFinite(valor)) return [];
  const hayPeso = pesoKg > 0;
  if (u.porKg && !hayPeso) return UNIDADES_VELOCIDAD.filter((x) => x.porKg).map((x) => ({ unidad: x.id, valor: (valor * u.aMcgMin) / x.aMcgMin }));
  const mcgMin = valor * u.aMcgMin * (u.porKg ? pesoKg : 1);
  return UNIDADES_VELOCIDAD.filter((x) => hayPeso || !x.porKg).map((x) => ({ unidad: x.id, valor: mcgMin / (x.aMcgMin * (x.porKg ? pesoKg : 1)) }));
}

/* ---------- Electrolitos ---------- */
// Iones: masa molar (g/mol) y valencia. mmol = mg / masa molar; mEq = mmol × valencia.
export const IONES = [
  { id: 'Na', texto: 'Sodio (Na⁺)', mm: 22.99, valencia: 1 },
  { id: 'K', texto: 'Potasio (K⁺)', mm: 39.098, valencia: 1 },
  { id: 'Cl', texto: 'Cloro (Cl⁻)', mm: 35.453, valencia: 1 },
  { id: 'HCO3', texto: 'Bicarbonato (HCO₃⁻)', mm: 61.017, valencia: 1 },
  { id: 'Ca', texto: 'Calcio (Ca²⁺)', mm: 40.078, valencia: 2 },
  { id: 'Mg', texto: 'Magnesio (Mg²⁺)', mm: 24.305, valencia: 2 },
];
// Sales: masa molar, cationes por fórmula, valencia del ion de interés y presentaciones frecuentes.
export const SALES = [
  { id: 'KCl', texto: 'Cloruro de potasio (KCl)', mm: 74.55, ion: 'K', iones: 1 },
  { id: 'NaCl', texto: 'Cloruro de sodio (NaCl)', mm: 58.44, ion: 'Na', iones: 1 },
  { id: 'NaHCO3', texto: 'Bicarbonato de sodio (NaHCO₃)', mm: 84.007, ion: 'Na', iones: 1 },
  { id: 'gluconatoCa', texto: 'Gluconato de calcio (anhidro)', mm: 430.37, ion: 'Ca', iones: 1, nota: 'Con la forma monohidratada (448.4 g/mol) se obtienen 4.46 mEq y 89 mg de calcio por gramo.' },
  { id: 'CaCl2', texto: 'Cloruro de calcio dihidratado (CaCl₂·2H₂O)', mm: 147.01, ion: 'Ca', iones: 1 },
  { id: 'MgSO4', texto: 'Sulfato de magnesio heptahidratado (MgSO₄·7H₂O)', mm: 246.47, ion: 'Mg', iones: 1 },
];
export const ionDe = (id) => IONES.find((x) => x.id === id);

// Contenido de 1 g de sal: mmol, mEq y mg del ion.
export function contenidoSal(salId, gramos = 1) {
  const s = SALES.find((x) => x.id === salId);
  if (!s || !(gramos >= 0)) return null;
  const ion = ionDe(s.ion);
  const mmol = ((gramos * 1000) / s.mm) * s.iones;
  return { sal: s, ion, mmol, mEq: mmol * ion.valencia, mgIon: mmol * ion.mm };
}

// Ion: convierte entre mg, mmol y mEq.
export function convertirIon(ionId, valor, desde) {
  const ion = ionDe(ionId);
  if (!ion || !Number.isFinite(valor)) return null;
  const mmol = desde === 'mg' ? valor / ion.mm : desde === 'mEq' ? valor / ion.valencia : valor;
  return { mg: mmol * ion.mm, mmol, mEq: mmol * ion.valencia };
}

/* ---------- Laboratorio: unidades convencionales ↔ SI ---------- */
// factor: multiplica el valor convencional para obtener el SI.
export const ANALITOS = [
  { id: 'glucosa', texto: 'Glucosa', conv: 'mg/dL', si: 'mmol/L', factor: 1 / 18.016 },
  { id: 'creatinina', texto: 'Creatinina', conv: 'mg/dL', si: 'µmol/L', factor: 88.42 },
  { id: 'urea', texto: 'Urea', conv: 'mg/dL', si: 'mmol/L', factor: 1 / 6.006 },
  { id: 'bun', texto: 'Nitrógeno ureico (BUN)', conv: 'mg/dL', si: 'mmol/L de urea', factor: 1 / 2.801 },
  { id: 'calcio', texto: 'Calcio', conv: 'mg/dL', si: 'mmol/L', factor: 1 / 4.008 },
  { id: 'magnesio', texto: 'Magnesio', conv: 'mg/dL', si: 'mmol/L', factor: 1 / 2.4305 },
  { id: 'fosforo', texto: 'Fósforo', conv: 'mg/dL', si: 'mmol/L', factor: 1 / 3.097 },
  { id: 'acidoUrico', texto: 'Ácido úrico', conv: 'mg/dL', si: 'µmol/L', factor: 59.48 },
  { id: 'bilirrubina', texto: 'Bilirrubina', conv: 'mg/dL', si: 'µmol/L', factor: 17.104 },
  { id: 'colesterol', texto: 'Colesterol', conv: 'mg/dL', si: 'mmol/L', factor: 1 / 38.67 },
  { id: 'trigliceridos', texto: 'Triglicéridos', conv: 'mg/dL', si: 'mmol/L', factor: 1 / 88.57 },
  { id: 'lactato', texto: 'Lactato', conv: 'mg/dL', si: 'mmol/L', factor: 1 / 9.008 },
  { id: 'albumina', texto: 'Albúmina', conv: 'g/dL', si: 'g/L', factor: 10 },
  { id: 'hemoglobina', texto: 'Hemoglobina', conv: 'g/dL', si: 'g/L', factor: 10 },
  { id: 'vitaminaD', texto: '25-OH vitamina D', conv: 'ng/mL', si: 'nmol/L', factor: 2.496 },
];
// Urea ↔ BUN (mg/dL): urea = BUN × 2.14.
export const bunAUrea = (bun) => bun * 2.1428;
export const ureaABun = (urea) => urea / 2.1428;

/* ---------- HbA1c y glucosa promedio ---------- */
// ADAG (Nathan, Diabetes Care 2008; 507 personas, R² 0.84): glucosa promedio estimada (eAG) = 28.7 × A1C − 46.7 mg/dL.
// En mmol/L se usa el mismo factor que la glucosa del laboratorio (÷ 18.016), equivalente a 1.59 × A1C − 2.59.
export const EAG = { pendiente: 28.7, intercepto: -46.7 };
// Se calcula en décimas (287 × A1C − 467) / 10 para que, p. ej., 6 % dé 125.5 exacto y redondee a 126 como la tabla.
export const eagDeA1c = (a1c) => (Number.isFinite(a1c) ? (287 * a1c - 467) / 10 : null);
export const a1cDeEag = (mgdl) => (Number.isFinite(mgdl) ? (mgdl - EAG.intercepto) / EAG.pendiente : null);
export const GLUCOSA_MMOL = 18.016;
export const mgdlAMmol = (mgdl) => (Number.isFinite(mgdl) ? mgdl / GLUCOSA_MMOL : null);
export const mmolAMgdl = (mmol) => (Number.isFinite(mmol) ? mmol * GLUCOSA_MMOL : null);
// HbA1c en % (NGSP/DCCT) ↔ mmol/mol (IFCC), con la ecuación maestra: IFCC = (NGSP − 2.15) × 10.929.
export const ngspAIfcc = (pct) => (Number.isFinite(pct) ? (pct - 2.15) * 10.929 : null);
export const ifccANgsp = (mmolmol) => (Number.isFinite(mmolmol) ? mmolmol / 10.929 + 2.15 : null);
// GMI (Bergenstal, Diabetes Care 2018): HbA1c estimada a partir de la glucosa media del monitor continuo.
export const gmiDeGlucosaMedia = (mgdl) => (Number.isFinite(mgdl) ? 3.31 + 0.02392 * mgdl : null);
// Intervalo de la tabla publicada de ADAG; fuera de él la relación es una extrapolación.
export const RANGO_TABLA_ADAG = { min: 5, max: 12 };
export const TABLA_EAG = [5, 6, 7, 8, 9, 10, 11, 12].map((a1c) => ({ a1c, ifcc: ngspAIfcc(a1c), mgdl: eagDeA1c(a1c), mmol: mgdlAMmol(eagDeA1c(a1c)) }));
// Límites de captura (valores fuera de ellos son errores de captura, no resultados posibles).
export const LIMITES_GLUCEMIA = { a1c: { min: 3, max: 20 }, ifcc: { min: 9, max: 195 }, mgdl: { min: 20, max: 1000 }, mmol: { min: 1.1, max: 55.5 } };
