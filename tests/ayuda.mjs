// Utilidades compartidas por las pruebas.
import assert from 'node:assert/strict';
import { ESCALAS } from '../escalas/index.js';
import { normalizarEscala, calcular, resumenDe, resumenBreveDe, NINGUNO } from '../js/motor.js';

export const escalas = ESCALAS.map(normalizarEscala);
export const porId = Object.fromEntries(escalas.map((e) => [e.id, e]));

// Construye respuestas a partir del texto de la opción (o un valor crudo para números y listas).
export function resp(id, mapa) {
  const e = porId[id];
  const r = {};
  for (const [k, val] of Object.entries(mapa)) {
    const c = e.campos.find((x) => x.id === k);
    if (!c) { r[k] = val; continue; }
    if (c.tipo === 'opciones' && typeof val === 'string') {
      const i = c.opciones.findIndex((o) => o.texto === val);
      assert.ok(i >= 0, `${id}.${k}: no existe la opción «${val}»`);
      r[k] = i;
    } else r[k] = val;
  }
  return r;
}
export const calc = (id, mapa, ctx) => calcular(porId[id], resp(id, mapa), ctx);
export const todos = (id, idx) => Object.fromEntries(porId[id].campos.filter((c) => c.tipo === 'opciones' && !c.anotaA).map((c) => [c.id, idx(c)]));

// Simula «Añadir a la valoración» con la misma forma que guarda la app.
let contador = 0;
export function guardado(id, respuestas, extra = {}) {
  const e = porId[id];
  const res = calcular(e, respuestas);
  assert.ok(res.completo, `${id} incompleto: ${res.faltan} ${JSON.stringify(res.errores)}`);
  contador += 1;
  return {
    id: `t${contador}`,
    escalaId: id, puntaje: res.puntaje, max: res.max, valor: res.valor, unidad: res.unidad, mostrar: res.mostrar,
    nivel: res.banda.nivel, etiqueta: res.banda.etiqueta, hallazgo: Boolean(res.banda.hallazgo), sugerencias: res.banda.sugerencias || [],
    resumen: resumenDe(e, res), breve: resumenBreveDe(e, res), noEvaluable: res.noEvaluable || null,
    alertas: res.alertas?.length ? [...res.alertas] : null,
    extras: res.noEvaluable ? null : JSON.parse(JSON.stringify(res.extras || {})),
    respuestas, guardado: contador, ...extra,
  };
}

// Respuestas completas de ejemplo para cada instrumento.
export const EJEMPLOS = {
  barthel: () => todos('barthel', () => 0), katz: () => todos('katz', () => 0), lawton: () => todos('lawton', () => 0),
  minicog: () => todos('minicog', () => 0), moca: () => resp('moca', { puntaje: 22, escolaridad: 'No, más de 12 años' }),
  gds15: () => todos('gds15', () => 0), '4at': () => todos('4at', () => 0), cam: () => todos('cam', () => 0),
  frail: () => resp('frail', { ...todos('frail', () => 0), enfermedades: [NINGUNO], perdida: 'No' }), cfs: () => todos('cfs', () => 4),
  sarcf: () => todos('sarcf', () => 1),
  sppb: () => resp('sppb', { eq_juntos: 'Mantiene 10 s', eq_semi: 'Mantiene 10 s', eq_tandem: '10 s o más', marcha_estado: 'Recorrido de 4 m', marcha_1: 4, silla_pre: 'Sí', silla_estado: 'Sí', silla_t: 10 }),
  vivifrail: () => resp('vivifrail', { sppb: '12', caidas: 'No', tug: 'No, 20 s o menos', vm6: 'No, 0.8 m/s o más', demencia: 'No' }),
  tug: () => resp('tug', { estado: 'Sí', tiempo: 11 }), velocidad: () => resp('velocidad', { distancia: '4 metros', tiempo: 4 }),
  mnasf: () => resp('mnasf', { puntaje: 10, variante: 'Circunferencia de pantorrilla' }),
  braden: () => resp('braden', { percepcion: '3', humedad: '3', actividad: '3', movilidad: '3', nutricion: '3', friccion: '2', edad: 80 }),
  painad: () => todos('painad', () => 1), rcri: () => todos('rcri', () => 1), zarit: () => resp('zarit', { puntaje: 50 }),
  ckdepi: () => resp('ckdepi', { creatinina: 1.2, edad: 78, sexo: 'Hombre' }),
  cockcroft: () => resp('cockcroft', { edad: 78, sexo: 'Hombre', creatinina: 1.2, peso: 70, peso_uso: 'Peso real' }),
  rudas: () => resp('rudas', { memoria: 6, orientacion: 5, praxis: 2, dibujo: 2, juicio: 3, lenguaje: 6 }),
  cdr: () => resp('cdr', { global: '1 · Demencia leve', casillas: 'Sí', m: '1', o: '1', j: '1', c: '1', h: '1', p: '0' }),
  fast: () => resp('fast', { estadio: '4 · actividades instrumentales complejas', ordinal: 'Sí' }),
  phq9: () => resp('phq9', { ...todos('phq9', () => 1), dificultad: 'Un poco difícil' }),
  cornell: () => resp('cornell', { entrevista: 'Informante y paciente', sA: 3, sB: 1, sC: 1, sD: 2, sE: 1, na: 0, delirium: 'Sí' }),
  npiq: () => resp('npiq', {
    ...Object.fromEntries(['delirios', 'alucinaciones', 'agitacion', 'depresion', 'ansiedad', 'euforia', 'apatia', 'desinhibicion', 'irritabilidad', 'motora', 'sueno', 'apetito'].map((id) => [id, 'No'])),
    apatia: 'Sí', apatia_g: '2 · Moderada', apatia_a: '1 · Mínima',
  }),
  rass: () => resp('rass', { nivel: '0 · Alerta y tranquilo' }),
  camicu: () => resp('camicu', { rass: '0 · Alerta y tranquilo', agudo: 'Ausente' }),
  fried: () => resp('fried', {
    sexo: 'Mujer', peso: 'No', esfuerzo: 'Algunas veces (1 a 2 días)', arrancar: 'Rara vez o nunca (menos de 1 día)',
    fuerza_estado: 'Medida con dinamómetro', fuerza: 16, peso_kg: 60, talla: 155, marcha_estado: 'Medida en 4.57 m', tiempo: 6.5, actividad: 'No bajo',
  }),
  tinetti: () => resp('tinetti', { equilibrio: 12, marcha: 9, ayuda: 'No' }),
  ariscat: () => resp('ariscat', { edad: 82, spo2: 94, infeccion: 'No', anemia: 'No', incision: 'Abdominal alta', duracion: '2 a 3 h', urgencia: 'No' }),
  dasi: () => resp('dasi', { cuidado: 'Sí', casa: 'Sí', cuadras: 'Sí', escaleras: 'Sí', correr: 'No', ligero: 'Sí', moderado: 'Sí', pesado: 'No', jardin: 'No', sexual: 'No', recreacion: 'No', deporte: 'No' }),
  pps: () => resp('pps', { nivel: '50 %' }),
  gijon: () => resp('gijon', { familiar: 'Vive con cónyuge de similar edad', economica: '1 a 8 veces el salario mínimo mensual', vivienda: 'Adecuada a necesidades', relaciones: 'Relaciones sociales', apoyo: 'Con apoyo familiar y vecinal' }),
  'icope-cog': () => resp('icope-cog', { filtro: 'No', fecha: 'Responde correctamente', lugar: 'Responde correctamente', palabras: 'Recuerda 2' }),
  'icope-loc': () => resp('icope-loc', { seguro: 'Sí', completo: 'Sí, las completó', tiempo: 12.5 }),
  'icope-vit': () => resp('icope-vit', { peso: 'No', apetito: 'Sí' }),
  'icope-vis': () => resp('icope-vis', { filtro1: 'No', filtro2: 'No', metodo: 'Tabla de la OMS impresa', gafas: 'No usa gafas', externa: 'Sin alteraciones', lejos_der: 'Ve al menos 3 de las E pequeñas (6/12 o mejor)', lejos_izq: 'Ve al menos 3 de las E pequeñas (6/12 o mejor)', cerca: 'Ve al menos 3 E (N6)' }),
  'icope-aud': () => resp('icope-aud', { audifonos: 'No', filtro: 'Sí' }),
  'icope-psi': () => resp('icope-psi', { tristeza: 'No', interes: 'No' }),
  'icope-fac': () => resp('icope-fac', { vivienda: 'No', economia: 'No', soledad: 'Sí', participacion: 'No', cuidador: 'No tiene', orina: 'Sí' }),
  iciq: () => resp('iciq', { puntaje: 9 }),
  urinarios: () => resp('urinarios', { sintomas: ['urgencia', 'urgencia_perdida'], nicturia: 3, alarma: [NINGUNO] }),
  diario: () => resp('diario', { d1_diurnas: 8, d1_nocturnas: 3, d1_perdidas: 1, d1_total: 1800, d1_noche: 700 }),
  intestinal: () => resp('intestinal', { frecuencia: 2, bristol: 'Tipo 2: forma alargada, pero grumosa y dura', sintomas: ['pujo'], incontinencia: 0, laxantes: [NINGUNO], alarma: [NINGUNO] }),
  isi: () => resp('isi', { puntaje: 16 }),
  epworth: () => resp('epworth', { puntaje: 12 }),
  stopbang: () => resp('stopbang', { puntaje: 4, adicional: 'No' }),
  sueno: () => resp('sueno', { horas: 5, cama: 9, problemas: ['mantener'], contribuyentes: ['nicturia'] }),
  agudeza: () => resp('agudeza', { metodo: 'Snellen a 6 m (20 pies)', correccion: 'Con sus lentes habituales', od: '20/40 (6/12)', oi: '20/70 (6/21)', cerca: 'Lee N6 o equivalente' }),
  audiometria: () => resp('audiometria', { od: 42.5, oi: 38.75, audifonos: 'No tiene' }),
  hhies: () => resp('hhies', { puntaje: 14 }),
  ohat: () => resp('ohat', { labios: '0 · Sano', lengua: '0 · Sano', encias: '1 · Cambios', saliva: '0 · Sano', dientes: '2 · No sano', protesis: '0 · Sano', limpieza: '1 · Cambios', dolor: '0 · Sano' }),
  bucal: () => resp('bucal', { hallazgos: ['masticar'], dentista: 'Hace más de 2 años o no recuerda', alarma: [NINGUNO] }),
  eat10: () => resp('eat10', { puntaje: 5 }),
  fois: () => resp('fois', { nivel: '5 · Dieta oral total de varias consistencias, con preparación especial o compensaciones' }),
  deglucion: () => resp('deglucion', { signos: ['tos'] }),
  iddsi: () => resp('iddsi', { bebidas: 'Nivel 2 · Poco espeso', alimentos: 'Nivel 5 · Picado y húmedo', indico: 'Fonoaudiología o logopedia' }),
  frax: () => resp('frax', { modelo: 'México', mayor: 12.5, cadera: 4.1, dmo: 'Con DMO del cuello femoral' }),
  dxa: () => resp('dxa', { sexo: 'Mujer', edad: 74, menopausia: 'Sí', t_columna: -2.1, t_cuello: -2.6, t_cadera: -2.2, fractura: 'No' }),
  silla30: () => resp('silla30', { sexo: 'Mujer', edad: 78, brazos: 'No', repeticiones: 8 }),
  equilibrio4: () => resp('equilibrio4', { etapa1: 'Lo mantiene 10 segundos', etapa2: 'Lo mantiene 10 segundos', etapa3: 'No lo mantiene 10 segundos' }),
  dinamometria: () => resp('dinamometria', { sexo: 'Mujer', dominante: 'Derecha', equipo: 'Hidráulico (p. ej., Jamar)', der1: 14, der2: 15.5, der3: 15, izq1: 13, izq2: 14, izq3: 13.5 }),
  charlson: () => resp('charlson', { edad: 82, iam: 'Sí', icc: 'No', vascular: 'No', cerebro: 'No', demencia: 'Sí', pulmonar: 'Sí', conectivo: 'No', ulcera: 'No', higado: 'No', diabetes: 'Con daño a órgano blanco', hemiplejia: 'No', renal: 'No', tumor: 'No', leucemia: 'No', linfoma: 'No', sida: 'No' }),
  cirsg: () => resp('cirsg', { cardiaco: '2 · Moderado, o requiere tratamiento de primera línea', vascular: '2 · Moderado, o requiere tratamiento de primera línea', hemato: '0 · Sin problema', respiratorio: '1 · Leve, o antecedente significativo', oorl: '1 · Leve, o antecedente significativo', gi_sup: '0 · Sin problema', gi_inf: '1 · Leve, o antecedente significativo', hepatico: '0 · Sin problema', renal: '3 · Grave, discapacidad constante o difícil de controlar', genitourinario: '1 · Leve, o antecedente significativo', musculo: '2 · Moderado, o requiere tratamiento de primera línea', neuro: '0 · Sin problema', endocrino: '2 · Moderado, o requiere tratamiento de primera línea', psiquiatrico: '0 · Sin problema' }),
  news2: () => resp('news2', { fr: 22, escala_spo2: 'Escala 1', spo2: 94, oxigeno: 'Aire ambiente', pas: 105, fc: 96, conciencia: 'Alerta (A)', temp: 38.3 }),
  ewgsop2: () => resp('ewgsop2', { sexo: 'Mujer', fuerza_tipo: 'Prensión (kg)', prension: 15.5, masa_tipo: 'ASM/talla² (kg/m²)', asmi: 5.2, metodo: 'Bioimpedancia (BIA)', desempeno_tipo: 'Velocidad de marcha (m/s)', marcha: 0.7 }),
};
