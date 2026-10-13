// Calculadora de infusiones y tabla de referencia rápida.
// Datos de la tabla «Medicamentos en paro, preparo y postparo» (HG30) que compartió el médico, transcritos y
// revisados: Huella recalcula cada velocidad a partir de la preparación y señala dónde los mL/h impresos no
// coinciden con la dosis. Es un apoyo de cálculo: la indicación, la dosis y la preparación se verifican con el
// protocolo institucional y en doble chequeo.

/* ---------- Unidades ---------- */

// Cantidades: todo se convierte a una unidad base (mcg para masa, mUI para unidades internacionales).
export const UNIDADES_CANTIDAD = {
  g: { base: 'mcg', factor: 1e6 },
  mg: { base: 'mcg', factor: 1e3 },
  mcg: { base: 'mcg', factor: 1 },
  UI: { base: 'mUI', factor: 1e3 },
  mUI: { base: 'mUI', factor: 1 },
};

// Unidades de dosis: «mcg/kg/min» → cantidad, por kg, por unidad de tiempo.
export function leerUnidadDosis(u) {
  const partes = String(u).split('/');
  const cantidad = partes[0];
  const porKg = partes.includes('kg');
  const tiempo = partes.at(-1) === 'h' ? 'h' : partes.at(-1) === 'min' ? 'min' : null;
  if (!UNIDADES_CANTIDAD[cantidad] || !tiempo) throw new Error(`Unidad de dosis no válida: ${u}`);
  return { cantidad, porKg, tiempo, base: UNIDADES_CANTIDAD[cantidad].base, factor: UNIDADES_CANTIDAD[cantidad].factor };
}

// Concentración de la preparación en unidad base por mL (mcg/mL o mUI/mL).
export function concentracion(cantidad, unidad, volumenMl) {
  const u = UNIDADES_CANTIDAD[unidad];
  if (!u || !(cantidad > 0) || !(volumenMl > 0)) return null;
  return { valor: (cantidad * u.factor) / volumenMl, base: u.base };
}

// Dosis → velocidad de la bomba (mL/h).
export function velocidadMlH(dosis, unidadDosis, pesoKg, conc) {
  const u = leerUnidadDosis(unidadDosis);
  if (!conc || u.base !== conc.base || !(dosis >= 0)) return null;
  if (u.porKg && !(pesoKg > 0)) return null;
  const basePorHora = dosis * u.factor * (u.porKg ? pesoKg : 1) * (u.tiempo === 'min' ? 60 : 1);
  return basePorHora / conc.valor;
}

// Velocidad de la bomba (mL/h) → dosis en la unidad pedida.
export function dosisDesdeVelocidad(mlh, unidadDosis, pesoKg, conc) {
  const u = leerUnidadDosis(unidadDosis);
  if (!conc || u.base !== conc.base || !(mlh >= 0)) return null;
  if (u.porKg && !(pesoKg > 0)) return null;
  const basePorHora = mlh * conc.valor;
  return basePorHora / (u.factor * (u.porKg ? pesoKg : 1) * (u.tiempo === 'min' ? 60 : 1));
}

// Bolo: dosis por kg × peso → cantidad total y mL de una concentración dada.
export function bolo(dosisPorKg, unidad, pesoKg, conc) {
  const u = UNIDADES_CANTIDAD[unidad];
  if (!u || !conc || u.base !== conc.base || !(pesoKg > 0)) return null;
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
export const fmtNum = (x) => (x == null ? '—' : String(redondear(x)).replace(/\.0+$/, ''));

// Concentración legible: «10 mg/mL (10 000 mcg/mL)».
export function textoConcentracion(conc) {
  if (!conc) return '—';
  if (conc.base === 'mUI') return conc.valor >= 1000 ? `${fmtNum(conc.valor / 1000)} UI/mL` : `${fmtNum(conc.valor)} mUI/mL (${fmtNum(conc.valor / 1000)} UI/mL)`;
  return conc.valor >= 1000 ? `${fmtNum(conc.valor / 1000)} mg/mL (${fmtNum(conc.valor)} mcg/mL)` : `${fmtNum(conc.valor)} mcg/mL (${fmtNum(conc.valor / 1000)} mg/mL)`;
}

// Pasos de titulación entre el mínimo y el máximo, incluidos ambos extremos. En rangos amplios (máximo ≥ 20 veces el
// mínimo, p. ej., norepinefrina 0.01 a 2) la serie es casi logarítmica para afinar donde más se titula: la parte baja.
const SERIE = [1, 1.5, 2, 3, 5, 7.5];
export function pasosTitulacion(min, max, n = 8) {
  if (!(max > min)) return [min];
  const limpio = (v) => Number(v.toPrecision(10));
  const valores = [min];
  if (min > 0 && max / min >= 20) {
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

/* ---------- Tabla de medicamentos ---------- */

const NOTA_TABLA = 'Tabla «Medicamentos en paro, preparo y postparo» (HG30).';

export const GRUPOS_INFUSION = [
  { id: 'sedantes', nombre: 'Sedantes' },
  { id: 'bnm', nombre: 'Bloqueo neuromuscular' },
  { id: 'vasoactivos', nombre: 'Vasopresores e inotrópicos' },
];

export const FARMACOS = [
  {
    id: 'propofol', nombre: 'Propofol', grupo: 'sedantes',
    efectos: 'Sedación, anticomicial (estado epiléptico), antiemético.',
    presentacion: { texto: '200 mg/20 mL', cantidad: 200, unidad: 'mg', volumen: 20 },
    preparacion: { texto: 'BIC: 1 g/100 mL (sin diluir, 10 mg/mL)', cantidad: 1000, unidad: 'mg', volumen: 100 },
    bolo: { min: 1, max: 3, unidad: 'mg', nota: 'Inducción 1 a 3 mg/kg.', tabla: '50 kg: 5 a 15 mL; 100 kg: 10 a 30 mL.' },
    infusion: { min: 5, max: 80, unidad: 'mcg/kg/min', extra: { valor: 200, nota: 'Estado epiléptico: máximo 200 mcg/kg/min.' }, tabla: '50 kg: 3-48-120* mL/h; 100 kg: 6-96-240* mL/h.' },
    otros: 'Sedación profunda, primera línea.',
    consideraciones: 'Hipotensión proporcional a la dosis, síndrome de infusión de propofol, dislipidemia.',
    ajuste: 'No requiere ajuste renal ni hepático.',
    revision: 'Con 10 mg/mL, 5 a 80 mcg/kg/min equivalen a 1.5 a 24 mL/h en 50 kg (60 mL/h con 200 mcg/kg/min) y a 3 a 48 mL/h en 100 kg (120 mL/h). Los mL/h impresos son el doble: corresponderían a una preparación de 5 mg/mL.',
  },
  {
    id: 'dexmedetomidina', nombre: 'Dexmedetomidina', grupo: 'sedantes',
    efectos: 'Sedante, ansiolítico, hipnótico, analgésico.',
    presentacion: { texto: '200 mcg/2 mL', cantidad: 200, unidad: 'mcg', volumen: 2 },
    preparacion: { texto: 'BIC: 400 mcg/100 mL de SS 0.9 % (4 mcg/mL)', cantidad: 400, unidad: 'mcg', volumen: 100 },
    bolo: null, boloNota: 'Bolo no recomendado.',
    infusion: { min: 0.2, max: 1.5, unidad: 'mcg/kg/h', tabla: '50 kg: 2.5 a 18 mL/h; 100 kg: 5 a 36 mL/h.' },
    otros: 'Paliativos: ansiólisis y coadyuvante de la analgesia (no como monoterapia).',
    consideraciones: 'Efecto cronotrópico e inotrópico negativo importante (bradicardia, hipotensión).',
    ajuste: 'No requiere ajuste renal.',
  },
  {
    id: 'midazolam', nombre: 'Midazolam', grupo: 'sedantes',
    efectos: 'Sedación, anticomicial, ansiolítico.',
    presentacion: { texto: '15 mg/3 mL', cantidad: 15, unidad: 'mg', volumen: 3 },
    preparacion: { texto: 'BIC: 30 mg/100 mL de SS 0.9 % (0.3 mg/mL)', cantidad: 30, unidad: 'mg', volumen: 100 },
    bolo: { min: 0.1, max: 0.3, unidad: 'mg', nota: 'Inducción 0.1 a 0.3 mg/kg.', tabla: '50 kg: 1 a 3 mL (5 a 15 mg); 100 kg: 2 a 6 mL (10 a 30 mg).' },
    infusion: { min: 0.01, max: 0.1, unidad: 'mg/kg/h', tabla: '50 kg: 1.6 a 5 mL/h; 100 kg: 3 a 10 mL/h.' },
    otros: 'Crisis convulsiva: 1 mL IV o 2 mL IM; in extremis, vía nasal.',
    consideraciones: 'Hipotensión importante, depresión respiratoria.',
    ajuste: 'La tabla indica que no requiere ajuste.',
    revision: 'Con 0.3 mg/mL, 0.01 a 0.1 mg/kg/h equivalen a 1.7 a 16.7 mL/h en 50 kg y a 3.3 a 33.3 mL/h en 100 kg. El límite superior impreso (5 y 10 mL/h) corresponde a 0.03 mg/kg/h. Su metabolito activo se acumula en la insuficiencia renal y en infusiones prolongadas.',
  },
  {
    id: 'diazepam', nombre: 'Diazepam', grupo: 'sedantes',
    efectos: 'Sedación, anticomicial, relajante muscular.',
    presentacion: { texto: '10 mg/2 mL (5 mg/mL)', cantidad: 10, unidad: 'mg', volumen: 2 },
    preparacion: null, preparacionNota: 'Sin infusión continua (BIC: no).',
    bolo: { min: 0.02, max: 0.1, unidad: 'mg', nota: 'Bolo 0.02 a 0.1 mg/kg.', tabla: '1 mL (5 mg) + 0.5 mL (2.5 mg) cada 60 s según necesidad; 2.5 mg según necesidad cada 6, 8 o 12 h.' },
    infusion: null, infusionNota: 'No se recomienda en infusión continua.',
    otros: 'Síndrome neuroléptico maligno; intoxicación por cloroquinas (QT largo, choque).',
    consideraciones: 'Hipotensión; depresión respiratoria mínima.',
    ajuste: 'Renal: no. Insuficiencia hepática y personas mayores: reducir 50 %.',
  },
  {
    id: 'vecuronio', nombre: 'Vecuronio', grupo: 'bnm',
    efectos: 'Parálisis (bloqueo de la placa neuromuscular).',
    presentacion: { texto: '4 mg/mL (ámpula)', cantidad: 4, unidad: 'mg', volumen: 1 },
    preparacion: { texto: 'BIC: 40 mg/100 mL de SS 0.9 % (0.4 mg/mL)', cantidad: 40, unidad: 'mg', volumen: 100 },
    bolo: { min: 0.1, max: 0.2, unidad: 'mg', nota: 'Inducción 0.1 a 0.2 mg/kg; dosis inicial habitual: 2 ámpulas.', tabla: '50 kg: 1 a 3 mL (5 a 10 mg); 100 kg: 2 a 6 mL (10 a 20 mg).' },
    infusion: { min: 0.8, max: 1.2, unidad: 'mcg/kg/min', tabla: '50 kg: 6 a 9 mL/h; 100 kg: 12 a 18 mL/h.' },
    otros: 'Bloqueo neuromuscular en pacientes especiales: SIRA, neurocrítico, tórax inestable, quemado, trauma grave.',
    consideraciones: 'Produce apnea. No es anticomicial (no controla las crisis, solo las enmascara). Requiere sedación y analgesia adecuadas.',
    ajuste: 'Obesidad (la tabla dice «>50 % IMC»): calcular con el peso ideal de inicio, excepto en urgencia.',
  },
  {
    id: 'rocuronio', nombre: 'Rocuronio', grupo: 'bnm',
    efectos: 'Parálisis (bloqueo de la placa neuromuscular).',
    presentacion: { texto: '50 mg/5 mL (10 mg/mL)', cantidad: 50, unidad: 'mg', volumen: 5 },
    preparacion: { texto: 'BIC: 200 mg/100 mL de SS 0.9 % (2 mg/mL)', cantidad: 200, unidad: 'mg', volumen: 100 },
    bolo: { min: 1, max: 1.2, unidad: 'mg', nota: 'Inducción 1 a 1.2 mg/kg.', tabla: '50 kg: 5 a 6 mL (50 a 60 mg); 100 kg: 10 a 12 mL (100 a 120 mg).' },
    infusion: { min: 3, max: 8, unidad: 'mcg/kg/min', tabla: '50 kg: 4.5 a 12 mL/h; 100 kg: 12 a 18 mL/h.' },
    otros: 'Mismas indicaciones que el vecuronio.',
    consideraciones: 'Como el vecuronio, pero de inicio más rápido. Produce apnea; no es anticomicial.',
    ajuste: 'Obesidad (la tabla dice «>50 % IMC»): calcular con el peso ideal de inicio, excepto en urgencia.',
    revision: 'Con 2 mg/mL, 3 a 8 mcg/kg/min equivalen a 9 a 24 mL/h en 100 kg; el rango impreso para 100 kg (12 a 18 mL/h) parece copiado del vecuronio. El de 50 kg (4.5 a 12 mL/h) sí coincide.',
  },
  {
    id: 'adrenalina', nombre: 'Adrenalina (epinefrina)', grupo: 'vasoactivos',
    efectos: 'Inotrópico y cronotrópico positivo; aumenta contractilidad, precarga, poscarga y gasto cardiaco.',
    presentacion: { texto: '1 mg/mL', cantidad: 1, unidad: 'mg', volumen: 1 },
    preparacion: { texto: 'BIC: 10 mg/250 mL de SS 0.9 % (40 mcg/mL)', cantidad: 10, unidad: 'mg', volumen: 250 },
    bolo: null,
    boloNota: 'Paro (RCP): 1 mL (1 mg) IV cada 3 min. Anafilaxia: 0.5 a 1 mL. «Push dose»: 0.5 a 2 mL cada 5 min de una dilución de 10 mcg/mL.',
    infusion: { min: 0.05, max: 1, unidad: 'mcg/kg/min', tabla: 'No es de primera línea. 50 kg: 4 a 75 mL/h; 100 kg: 8 a 150 mL/h.' },
    perfil: 'Agonista β1 > α1 > β2.',
    consideraciones: 'Taquicardia, arritmias; aumenta el gasto cardiaco y los requerimientos tisulares; isquemia periférica.',
    ajuste: '«Push dose» (10 mcg/mL): 1 ámpula en 100 mL, o 1 ámpula aforada a 10 mL y de ella 1 mL aforado a 10 mL.',
    revision: 'La dosis impresa dice «0.5 a 1 mcg/kg/min», pero los mL/h (4 y 8 mL/h) corresponden a 0.05 mcg/kg/min: Huella usa 0.05 a 1. En anafilaxia, 0.5 mg (0.5 mL de 1 mg/mL) es la dosis intramuscular; por vía intravenosa se usan bolos pequeños diluidos o infusión, con monitoreo.',
  },
  {
    id: 'norepinefrina', nombre: 'Norepinefrina (noradrenalina)', grupo: 'vasoactivos',
    efectos: 'Inotrópico positivo; aumenta contractilidad, precarga, poscarga y gasto cardiaco.',
    presentacion: { texto: '4 mg/4 mL (ámpula)', cantidad: 4, unidad: 'mg', volumen: 4 },
    preparacion: { texto: 'BIC: 8 mg o 16 mg/100 mL de SS 0.9 % (80 o 160 mcg/mL)', cantidad: 8, unidad: 'mg', volumen: 100 },
    preparacionesAlternas: [{ texto: '16 mg/100 mL (160 mcg/mL)', cantidad: 16, unidad: 'mg', volumen: 100 }],
    bolo: null, boloNota: 'Bolo no recomendado.',
    infusion: { min: 0.01, max: 2, unidad: 'mcg/kg/min', tabla: 'Modificar según respuesta; meta habitual TAM >65 mmHg. Iniciar a 5 mL/h.' },
    perfil: 'Agonista α1 > β1 > β2.',
    consideraciones: 'Arritmias, bradicardia refleja, isquemia periférica.',
    ajuste: 'Ajustar la dosis según la respuesta cada 3 a 5 min.',
  },
  {
    id: 'dobutamina', nombre: 'Dobutamina', grupo: 'vasoactivos',
    efectos: 'Inotrópico positivo, vasodilatador; poco cronotrópico.',
    presentacion: { texto: '250 mg/5 mL', cantidad: 250, unidad: 'mg', volumen: 5 },
    preparacion: { texto: 'BIC: 250 mg/100 mL de solución glucosada 5 % (2.5 mg/mL)', cantidad: 250, unidad: 'mg', volumen: 100 },
    bolo: null, boloNota: 'Bolo solo en casos específicos.',
    infusion: { min: 2, max: 10, unidad: 'mcg/kg/min', tabla: '50 kg: 2.4 a 12 mL/h; 100 kg: 4.8 a 24 mL/h.' },
    perfil: 'Agonista β1 > β2 > α1.',
    consideraciones: 'Arritmias, alteraciones de electrolitos (K, Ca). No se recomienda en choque vasodilatado. Disminuye la resistencia periférica.',
    ajuste: 'Con TFG <20 mL/min puede producir mioclonías.',
  },
  {
    id: 'dopamina', nombre: 'Dopamina', grupo: 'vasoactivos',
    efectos: 'Inotrópico positivo; efecto dependiente de la dosis.',
    presentacion: null,
    preparacion: { texto: 'La tabla no indica la preparación. Ejemplo frecuente: 400 mg/250 mL (1600 mcg/mL); escribe la tuya.', cantidad: 400, unidad: 'mg', volumen: 250, ejemplo: true },
    bolo: null, boloNota: 'Bolo no recomendado.',
    infusion: { min: 1, max: 30, unidad: 'mcg/kg/min', tabla: '1 a 2 mcg/kg/min: D1; 5 a 10: β1; >10 a 30: α1.' },
    rangos: [
      { min: 1, max: 2, efecto: 'D1: vasodilatación renal, mesentérica, coronaria y cerebral; aumenta la TFG.' },
      { min: 5, max: 10, efecto: 'β1: aumenta el gasto cardiaco, el volumen latido y la PAM.' },
      { min: 10, max: 30, efecto: 'α1: aumenta contractilidad, precarga y poscarga (menos que la norepinefrina).' },
    ],
    consideraciones: 'Taquiarritmias; posible tolerancia después de 5 días; fiebre, eosinofilia.',
    ajuste: 'Las dosis bajas no protegen la función renal; no se recomienda con ese fin.',
  },
  {
    id: 'vasopresina', nombre: 'Vasopresina', grupo: 'vasoactivos',
    efectos: 'Hormona antidiurética; vasopresor; vasoconstricción sistémica y renal; estimula la ACTH.',
    presentacion: { texto: '20 UI/1 mL', cantidad: 20, unidad: 'UI', volumen: 1 },
    preparacion: { texto: 'BIC: 40 UI/100 mL de SS 0.9 % (0.4 UI/mL)', cantidad: 40, unidad: 'UI', volumen: 100 },
    bolo: null, boloNota: 'Bolo no recomendado.',
    infusion: { min: 0.5, max: 2, unidad: 'mUI/kg/min', tabla: '50 kg: 4 a 15 mL/h; 100 kg: 8 a 30 mL/h.' },
    perfil: 'Se une a los receptores V1, V2 y V3.',
    consideraciones: 'No retirar de forma abrupta: puede bajar la TA; supresión de la producción endógena.',
    ajuste: 'Coadyuvante en choque vasodilatado y en sangrado de tubo digestivo alto variceal (frente a terlipresina).',
    revision: 'En choque séptico se usa sobre todo una dosis fija de 0.03 UI/min (0.03 a 0.04 UI/min), sin ajustar al peso; puedes calcularla eligiendo la unidad UI/min.',
  },
  {
    id: 'terlipresina', nombre: 'Terlipresina', grupo: 'vasoactivos',
    efectos: 'Vasoconstricción periférica y esplácnica; disminuye el gasto cardiaco; aumenta el metabolismo cardiaco.',
    presentacion: { texto: '1 mg/8.5 mL', cantidad: 1, unidad: 'mg', volumen: 8.5 },
    preparacion: null, preparacionNota: 'Sin infusión continua en la tabla.',
    bolo: null, boloNota: 'Choque: 1 mg IV cada 6 a 8 h. Sangrado variceal: 2 mg de inicio y luego 1 a 2 mg cada 4 h.',
    infusion: null, infusionNota: 'Infusión no recomendada en la tabla.',
    perfil: 'Se une a los receptores V1a, V1b (mayor afinidad) y V2.',
    consideraciones: 'Torsade de pointes, necrosis, isquemia cardiaca; menos vasopresora que la vasopresina.',
    ajuste: 'Manejo inicial del sangrado de tubo digestivo alto variceal.',
  },
];

export const farmacoDe = (id) => FARMACOS.find((f) => f.id === id) || null;
export const FUENTE_TABLA = NOTA_TABLA;

// Unidades de dosis que se pueden elegir según la unidad base de la preparación.
export const UNIDADES_DOSIS = {
  mcg: ['mcg/kg/min', 'mcg/kg/h', 'mg/kg/h', 'mcg/min', 'mg/h', 'mcg/h'],
  mUI: ['mUI/kg/min', 'UI/min', 'UI/h', 'mUI/min'],
};
