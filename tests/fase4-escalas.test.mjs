// Fase 4: MoCA guiado, MMSE, prueba del reloj, escalas nuevas y hoja oficial del médico.
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular, NINGUNO } from '../js/motor.js';
import { RUTAS } from '../js/rutas.js';
import { CATALOGO_FUTURO } from '../js/vistas/catalogo.js';
import { validarHoja, MAX_BYTES_HOJA, TIPOS_HOJA } from '../js/documentos.js';
import { porId, resp, calc, guardado, EJEMPLOS } from './ayuda.mjs';

const NUEVAS = ['mmse', 'reloj', 'pfeffer', 'gdsr', 'fluencia', 'gad7', 'cesd7', 'soledad3', 'downton', 'shortfesi', 'must', 'norton', 'dolorint', 'karnofsky', 'ppi', 'asa', 'lsns6', 'maltrato', 'ves13'];

test('fase 4: escalas nuevas registradas, con ejemplo y en alguna ruta o dominio', () => {
  const enRutas = new Set(RUTAS.flatMap((r) => [...r.pasos, ...(r.complementarios || [])].map((x) => x.id)));
  for (const id of NUEVAS) {
    assert.ok(porId[id], `${id} registrado`);
    assert.ok(EJEMPLOS[id], `${id} con ejemplo`);
    assert.ok(porId[id].referencias?.length, `${id} con referencias`);
    assert.ok(porId[id].licencia?.texto, `${id} con licencia`);
  }
  for (const id of ['mmse', 'reloj', 'pfeffer', 'fluencia', 'gdsr', 'downton', 'must', 'norton', 'dolorint', 'ppi', 'asa', 'ves13']) assert.ok(enRutas.has(id), `${id} en una ruta`);
  const cog = RUTAS.find((r) => r.id === 'cognitiva');
  const ids = [...cog.pasos, ...cog.complementarios].map((x) => x.id);
  for (const id of ['minicog', 'moca', 'mmse', 'reloj']) assert.ok(ids.includes(id), `${id} en la evaluación cognitiva`);
  for (const n of ['MMSE', 'VES-13', 'Prueba del reloj']) assert.ok(!CATALOGO_FUTURO.some((x) => x.nombre === n), `${n} ya no está en el catálogo futuro`);
});

/* ---------- MoCA ---------- */

const MOCA_MAX = {
  modo: 'Por secciones (guiado)', trazo: 'Correcto (1)', cubo: 'Correcto (1)', reloj_contorno: 'Correcto (1)', reloj_numeros: 'Correcto (1)', reloj_manecillas: 'Correcto (1)',
  identificacion: '3 láminas (3)', digitos_directo: 'Correcto (1)', digitos_inverso: 'Correcto (1)', letras: '0 o 1 error (1)', resta: '4 o 5 restas correctas (3)',
  repeticion: 'Las dos frases (2)', fluidez: '11 palabras o más (1)', abstraccion: 'Los dos pares (2)', recuerdo: '5 palabras (5)',
  orientacion: ['fecha', 'mes', 'anio', 'dia', 'lugar', 'ciudad'], escolaridad: 'Sí, 12 años o menos',
};

test('MoCA por secciones: suma 30, subtotales por dominio y sin ajuste en el máximo', () => {
  const r = calc('moca', MOCA_MAX);
  assert.equal(r.completo, true);
  assert.equal(r.puntaje, 30);
  assert.deepEqual(r.extras.secciones, { visuo: 5, identificacion: 3, atencion: 6, lenguaje: 3, abstraccion: 2, recuerdo: 5, orientacion: 6 });
  assert.equal(r.extras.ajuste, 0, 'no se suma el punto de escolaridad por encima de 30');
  assert.equal(r.banda.etiqueta, 'Dentro de lo esperado');
});

test('MoCA por secciones: puntos perdidos por dominio, ajuste por escolaridad y corte mexicano', () => {
  const r = calc('moca', { ...MOCA_MAX, cubo: 'Incorrecto (0)', resta: '2 o 3 restas correctas (2)', recuerdo: '2 palabras (2)', orientacion: ['mes', 'anio', 'lugar', 'ciudad'] });
  // 30 − 1 (cubo) − 1 (resta) − 3 (recuerdo) − 2 (orientación) = 23; +1 por escolaridad = 24
  assert.equal(r.extras.bruto, 23);
  assert.equal(r.extras.ajuste, 1);
  assert.equal(r.puntaje, 24);
  assert.equal(r.banda.etiqueta, 'Probable trastorno cognitivo');
  assert.ok(r.lineas.some((l) => /Puntaje bruto 23 \+ 1 por escolaridad/.test(l)));
  assert.ok(r.lineas.some((l) => /Dominios con puntos perdidos: visuoespacial/.test(l)));
  assert.ok(r.lineas.some((l) => /Aguilar-Navarro, 2018/.test(l)));
  const e = porId.moca;
  const g = guardado('moca', resp('moca', { ...MOCA_MAX, recuerdo: '2 palabras (2)' }));
  assert.match(g.resumen, /recuerdo diferido 2\/5/);
  assert.ok(e.hojaOficial, 'MoCA ofrece la hoja oficial del médico');
});

test('MoCA: el modo «solo el total» y los resultados antiguos siguen calculando', () => {
  const total = calc('moca', { modo: 'Solo el puntaje total', puntaje: 25, escolaridad: 'Sí, 12 años o menos' });
  assert.equal(total.puntaje, 26);
  assert.equal(total.banda.etiqueta, 'Dentro de lo esperado');
  const antiguo = calc('moca', { puntaje: 22, escolaridad: 'No, más de 12 años' });
  assert.equal(antiguo.completo, true);
  assert.equal(antiguo.puntaje, 22);
  const sinModo = calcular(porId.moca, resp('moca', { escolaridad: 'No, más de 12 años' }));
  assert.equal(sinModo.completo, false);
  assert.ok(sinModo.faltan.includes('modo'));
  // Ninguna opción reproduce láminas, palabras ni frases del instrumento
  for (const c of porId.moca.campos) assert.ok(c.texto.length < 160, c.id);
});

/* ---------- MMSE ---------- */

const MMSE_23 = { tiempo: '4', lugar: '5', fijacion: '3', atencion: '2', recuerdo: '1', denominacion: '2', repeticion: 'Correcta (1)', orden: '3', lectura: 'Correcta (1)', escritura: 'Incorrecta (0)', copia: 'Correcta (1)' };

test('MMSE: el mismo puntaje se interpreta con el corte de su escolaridad', () => {
  const baja = calc('mmse', { ...MMSE_23, escolaridad: '0 a 4 años' });
  const alta = calc('mmse', { ...MMSE_23, escolaridad: '5 años o más' });
  assert.equal(baja.puntaje, 23);
  assert.equal(alta.puntaje, 23);
  assert.equal(baja.extras.corte, 22);
  assert.equal(alta.extras.corte, 24);
  assert.equal(baja.banda.id, 'normal');
  assert.equal(alta.banda.id, 'leve');
  assert.deepEqual(alta.extras.dominios, { orientacion: 9, fijacion: 3, atencion: 2, recuerdo: 1, lenguaje: 8 });
  assert.match(porId.mmse.comparable(guardado('mmse', resp('mmse', { ...MMSE_23, escolaridad: '0 a 4 años' })), guardado('mmse', resp('mmse', { ...MMSE_23, escolaridad: '5 años o más' }))).advertencia, /puntos de corte distintos/);
});

test('MMSE: gravedad moderada y grave, limitaciones y recuerdo nulo con orientación conservada', () => {
  const mod = calc('mmse', { ...MMSE_23, escolaridad: '5 años o más', atencion: '0', lugar: '2', orden: '1' });
  assert.equal(mod.puntaje, 16);
  assert.equal(mod.banda.id, 'moderada');
  const grave = calc('mmse', { ...MMSE_23, escolaridad: '5 años o más', tiempo: '0', lugar: '0', atencion: '0' });
  assert.equal(grave.puntaje, 12);
  assert.equal(grave.banda.id, 'grave');
  const lim = calc('mmse', { ...MMSE_23, escolaridad: '5 años o más', recuerdo: '0', limitacion: ['vision'] });
  assert.ok(lim.lineas.some((l) => /Limitaciones durante la aplicación: déficit visual/.test(l)));
  assert.ok(lim.lineas.some((l) => /Recuerdo diferido nulo con orientación conservada/.test(l)));
  assert.ok(porId.mmse.registro && porId.mmse.hojaOficial);
});

/* ---------- Prueba del reloj ---------- */

const ORDEN = (n, m) => ({ condicion: 'A la orden', o_esfera: '2 · Esfera normal', o_numeros: n, o_manecillas: m });

test('Prueba del reloj (Cacho, 1999): cortes a la orden ≤6, a la copia ≤8 y suma ≤15', () => {
  const seis = calc('reloj', ORDEN('3 · Error de posición significativo o desorden leve', '1 · No se unen y la hora es incorrecta, o una sola'));
  assert.equal(seis.puntaje, 6);
  assert.equal(seis.banda.etiqueta, 'Por debajo del punto de corte');
  const siete = calc('reloj', ORDEN('3 · Error de posición significativo o desorden leve', '2 · Gran distorsión, o no se unen y la hora es correcta'));
  assert.equal(siete.puntaje, 7);
  assert.equal(siete.banda.etiqueta, 'Por encima del punto de corte');
  const copia8 = calc('reloj', { condicion: 'A la copia', c_esfera: '2 · Esfera normal', c_numeros: '3 · Error de posición significativo o desorden leve', c_manecillas: '3 · Pequeños errores' });
  assert.equal(copia8.puntaje, 8);
  assert.equal(copia8.banda.etiqueta, 'Por debajo del punto de corte');
  const copia85 = calc('reloj', { condicion: 'A la copia', c_esfera: '2 · Esfera normal', c_numeros: '3.5 · Pequeños errores de posición en 4 números o más', c_manecillas: '3 · Pequeños errores' });
  assert.equal(copia85.puntaje, 8.5);
  assert.equal(copia85.banda.etiqueta, 'Por encima del punto de corte');
  const ambas = calc('reloj', { ...ORDEN('3 · Error de posición significativo o desorden leve', '2 · Gran distorsión, o no se unen y la hora es correcta'), condicion: 'A la orden y a la copia', c_esfera: '2 · Esfera normal', c_numeros: '3 · Error de posición significativo o desorden leve', c_manecillas: '3 · Pequeños errores' });
  assert.equal(ambas.puntaje, 7, 'el principal es el dibujo a la orden');
  assert.ok(ambas.lineas.some((l) => /Orden \+ copia: 15\/20; punto de corte ≤15: positivo/.test(l)));
  const signos = calc('reloj', { ...ORDEN('4 · Todos, en orden', '4 · Posición y proporción correctas'), signos: ['perseveracion'] });
  assert.ok(signos.lineas.some((l) => /Signos cualitativos: perseveración/.test(l)));
});

test('Prueba del reloj: no compara una aplicación a la orden con otra solo a la copia', () => {
  const a = guardado('reloj', resp('reloj', ORDEN('4 · Todos, en orden', '4 · Posición y proporción correctas')));
  const b = guardado('reloj', resp('reloj', { condicion: 'A la copia', c_esfera: '2 · Esfera normal', c_numeros: '4 · Todos, en orden', c_manecillas: '4 · Posición y proporción correctas' }));
  assert.match(porId.reloj.comparable(a, b).noInterpretable, /a la orden y otra solo a la copia/);
  assert.equal(porId.reloj.comparable(a, a), null);
});

/* ---------- Escalas nuevas: límites de bandas ---------- */

const banda = (id, mapa) => calc(id, mapa).banda.etiqueta;
const repartir = (id, total, maxPorCampo = 3) => {
  const r = {};
  let resto = total;
  for (const c of porId[id].campos) { const k = Math.min(maxPorCampo, resto); r[c.id] = c.opciones[k].texto; resto -= k; }
  return r;
};

test('GAD-7: cortes 5, 10 y 15', () => {
  assert.equal(banda('gad7', repartir('gad7', 4)), 'Ansiedad mínima');
  assert.equal(banda('gad7', repartir('gad7', 5)), 'Ansiedad leve');
  assert.equal(banda('gad7', repartir('gad7', 10)), 'Ansiedad moderada');
  assert.equal(banda('gad7', repartir('gad7', 15)), 'Ansiedad grave');
});

test('CES-D 7: el reactivo de disfrute se invierte y el corte es 5', () => {
  const nunca = 'Rara vez o nunca (menos de 1 día)';
  const siempre = 'Todo el tiempo o la mayoría del tiempo (5 a 7 días)';
  const base = Object.fromEntries(porId.cesd7.campos.map((c) => [c.id, nunca]));
  assert.equal(calc('cesd7', { ...base, disfruto: siempre }).puntaje, 0);
  assert.equal(calc('cesd7', base).puntaje, 3, 'no disfrutar nunca suma 3');
  assert.equal(banda('cesd7', { ...base, disfruto: siempre, triste: siempre, deprimido: 'Un número de veces considerable (3 a 4 días)' }), 'Síntomas depresivos: tamizaje positivo');
});

test('Downton: «otros medicamentos» no suma y el corte es 3', () => {
  const base = { caidas: 'No', medicamentos: ['otros'], deficits: [NINGUNO], mental: 'Orientado', deambulacion: 'Normal' };
  assert.equal(calc('downton', base).puntaje, 0);
  assert.equal(banda('downton', { ...base, caidas: 'Sí', deficits: ['visual'] }), 'Riesgo bajo de caídas');
  assert.equal(banda('downton', { ...base, caidas: 'Sí', deficits: ['visual'], mental: 'Confuso' }), 'Riesgo alto de caídas');
});

test('MUST: puntos por IMC, pérdida de peso y enfermedad aguda', () => {
  const m = (peso, perdida, aguda = 'No') => calc('must', { peso, talla: 160, perdida, aguda });
  assert.equal(m(53, 'Menos de 5 %').puntaje, 0); // IMC 20.7
  assert.equal(m(50, 'Menos de 5 %').puntaje, 1); // IMC 19.5
  assert.equal(m(46, 'Menos de 5 %').puntaje, 2); // IMC 18.0
  assert.equal(m(53, 'Más de 10 %').puntaje, 2);
  const alto = m(46, 'Más de 10 %', 'Sí');
  assert.equal(alto.puntaje, 6);
  assert.equal(alto.banda.id, 'alto');
});

test('Short FES-I, Norton, LSNS-6, soledad, VES-13, PPI y fluencia: límites de bandas', () => {
  assert.equal(banda('shortfesi', { puntaje: 8 }), 'Preocupación baja por caer');
  assert.equal(banda('shortfesi', { puntaje: 9 }), 'Preocupación moderada por caer');
  assert.equal(banda('shortfesi', { puntaje: 14 }), 'Preocupación alta por caer');
  assert.equal(banda('norton', { fisico: 'Muy malo', mental: 'Confuso', actividad: 'Sentado (en silla)', movilidad: 'Muy limitada', incontinencia: 'Urinaria o fecal habitual' }), 'Riesgo muy alto');
  const lsns = (n) => Object.fromEntries(porId.lsns6.campos.map((c, i) => [c.id, porId.lsns6.campos[i].opciones[i < n % 6 ? Math.ceil(n / 6) : Math.floor(n / 6)].texto]));
  assert.equal(calc('lsns6', lsns(12)).puntaje, 12);
  assert.equal(banda('lsns6', lsns(12)), 'Sin aislamiento social');
  assert.equal(banda('lsns6', lsns(11)), 'Riesgo de aislamiento social');
  assert.equal(banda('soledad3', { compania: 'Algunas veces', excluido: 'Algunas veces', aislado: 'Casi nunca' }), 'Sin soledad significativa');
  assert.equal(banda('soledad3', { compania: 'Algunas veces', excluido: 'Algunas veces', aislado: 'Algunas veces' }), 'Soledad percibida');
  assert.equal(banda('fluencia', { animales: 10 }), 'Por debajo del punto de corte');
  assert.equal(banda('fluencia', { animales: 11 }), 'Por encima del punto de corte');
  const no = Object.fromEntries(porId.ves13.campos.filter((c) => c.tipo === 'opciones').map((c) => [c.id, c.opciones[0].texto]));
  assert.equal(banda('ves13', { ...no, edad: 80 }), 'No vulnerable');
  assert.equal(banda('ves13', { ...no, edad: 85 }), 'Persona mayor vulnerable', '85 años o más suma 3 (Saliba, 2001)');
  const ppi = (m) => calc('ppi', { pps: '60 % o más', ingesta: 'Normal', edema: 'Ausente', disnea: 'Ausente', delirium: 'Ausente', ...m });
  assert.equal(ppi({ pps: '10 a 20 %' }).banda.etiqueta, 'Supervivencia probable mayor de 6 semanas');
  assert.equal(ppi({ pps: '30 a 50 %', ingesta: 'Moderadamente reducida (más que unos bocados)', edema: 'Presente' }).banda.etiqueta, 'Supervivencia probable menor de 6 semanas');
  assert.equal(ppi({ pps: '10 a 20 %', ingesta: 'Gravemente reducida (unos bocados o menos)' }).banda.etiqueta, 'Supervivencia probable menor de 3 semanas');
});

test('PPI reutiliza la PPS guardada', () => {
  const pps = guardado('pps', resp('pps', { nivel: '50 %' }));
  const vin = porId.ppi.vinculos.find((x) => x.escala === 'pps');
  assert.equal(vin.disponible(pps), true);
  assert.deepEqual(vin.aplicar(pps), { pps: 1 });
});

test('Intensidad del dolor: escala numérica y visual analógica en la misma escala de 0 a 10', () => {
  assert.equal(banda('dolorint', { escala: 'Numérica (0 a 10)', en: 0, contexto: 'En reposo' }), 'Sin dolor');
  assert.equal(banda('dolorint', { escala: 'Numérica (0 a 10)', en: 7, contexto: 'En reposo' }), 'Dolor intenso');
  assert.equal(banda('dolorint', { escala: 'Visual analógica (0 a 100 mm)', eva: 35, contexto: 'Con el movimiento' }), 'Dolor leve');
});

/* ---------- Hoja oficial del médico ---------- */

test('hoja oficial: solo PDF o imágenes, no vacía y de 15 MB como máximo', () => {
  assert.equal(validarHoja({ type: 'application/pdf', size: 2048 }), null);
  assert.equal(validarHoja({ type: 'image/jpeg', size: 1 }), null);
  assert.match(validarHoja(null), /No se eligió/);
  assert.match(validarHoja({ type: 'application/msword', size: 10 }), /Solo se aceptan PDF o imágenes/);
  assert.match(validarHoja({ type: 'application/pdf', size: 0 }), /vacío/);
  assert.match(validarHoja({ type: 'application/pdf', size: MAX_BYTES_HOJA + 1 }), /máximo es 15 MB/);
  assert.deepEqual(Object.keys(TIPOS_HOJA).sort(), ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
});
