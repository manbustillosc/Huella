// Fase 5: escalas que no requieren permiso ni pago (Isaacs, GPCOG, GOHAI, MOS, Caprini, LACE, G8, ESAS-r, SPICT,
// NECPAL y equivalente de morfina).
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular, NINGUNO } from '../js/motor.js';
import { RUTAS } from '../js/rutas.js';
import { DOMINIOS } from '../js/dominios.js';
import { porId, resp, calc, guardado, EJEMPLOS } from './ayuda.mjs';

const NUEVAS = ['isaacs', 'gpcog', 'gohai', 'mos', 'caprini', 'lace', 'g8', 'esasr', 'spict', 'necpal', 'mme'];

test('fase 5: once escalas registradas, en su dominio y en alguna ruta', () => {
  const enRutas = new Set(RUTAS.flatMap((r) => [...r.pasos, ...(r.complementarios || [])].map((x) => x.id)));
  const dominios = new Set(DOMINIOS.map((d) => d.id));
  for (const id of NUEVAS) {
    assert.ok(porId[id] && EJEMPLOS[id], id);
    assert.ok(dominios.has(porId[id].dominio), `${id}: dominio`);
    assert.ok(enRutas.has(id), `${id}: en una ruta`);
    assert.ok(porId[id].referencias?.length && porId[id].licencia?.texto, `${id}: referencias y licencia`);
  }
  const planes = [...RUTAS.flatMap((r) => r.planes || []), ...DOMINIOS.flatMap((d) => d.planeadas)];
  assert.deepEqual([...new Set(planes)].sort(), ['Carga anticolinérgica (ACB)', 'IPOS']);
});

test('Isaacs: corte del INGER de 25 o menos y menos de 15 siempre asociado a demencia', () => {
  const t = (c, a, f, ci) => calc('isaacs', { colores: c, animales: a, frutas: f, ciudades: ci });
  assert.equal(t(7, 6, 6, 6).banda.etiqueta, 'Probable trastorno neurocognitivo');
  assert.equal(t(7, 7, 6, 6).banda.etiqueta, 'Dentro de lo esperado');
  assert.ok(t(7, 7, 7, 6).lineas.some((l) => /protocolo andaluz/.test(l)), '27 se marca con el corte andaluz');
  assert.ok(t(4, 4, 3, 2).lineas.some((l) => /siempre se asoció a demencia/.test(l)));
  assert.match(porId.isaacs.notas.join(' '), /INGER/);
});

test('Fluencia semántica: normas mexicanas del INGER (menos de −1 DE = probable deterioro)', () => {
  const f = (m) => calc('fluencia', m);
  assert.equal(f({ animales: 9 }).banda.etiqueta, 'Por debajo del punto de corte', 'sin edad ni escolaridad usa el corte de 10');
  assert.equal(f({ animales: 9, edad: 72, escolaridad: '1 a 5 años' }).banda.etiqueta, 'Probable deterioro en fluencia semántica', '9 queda bajo el rango normal 10 a 19 del INGER');
  assert.equal(f({ animales: 10, edad: 72, escolaridad: '1 a 5 años' }).banda.etiqueta, 'Dentro de lo esperado para su edad y escolaridad');
  assert.equal(f({ animales: 3, edad: 77, escolaridad: 'Sin escolaridad' }).banda.etiqueta, 'Muy por debajo de lo esperado para su edad y escolaridad');
  assert.equal(f({ animales: 14, edad: 66, escolaridad: '9 años o más' }).banda.etiqueta, 'Probable deterioro en fluencia semántica', '65 a 69 con 9 años o más: rango normal 15 a 24');
  assert.equal(f({ animales: 15, edad: 66, escolaridad: '9 años o más' }).banda.etiqueta, 'Dentro de lo esperado para su edad y escolaridad');
  assert.ok(f({ animales: 12, edad: 85, escolaridad: '6 a 8 años' }).lineas.some((l) => /80 años o más, 6 a 8 años de escolaridad/.test(l)));
  // Menores de 65: tabla del INGER
  assert.equal(f({ animales: 13, edad: 60, escolaridad: '6 a 8 años' }).banda.etiqueta, 'Probable deterioro en fluencia semántica');
  assert.equal(f({ animales: 14, edad: 60, escolaridad: '6 a 8 años' }).banda.etiqueta, 'Dentro de lo esperado para su edad y escolaridad');
  assert.equal(f({ animales: 6, edad: 45, escolaridad: 'Sin escolaridad' }).banda.etiqueta, 'Muy por debajo de lo esperado para su edad y escolaridad');
  assert.ok(f({ animales: 12, edad: 25, escolaridad: '6 a 8 años' }).lineas.some((l) => /Menor de 31 años/.test(l)));
});

test('GPCOG: algoritmo oficial con informante solo en la zona intermedia', () => {
  assert.equal(calc('gpcog', { paciente: 9 }).banda.id, 'sin');
  assert.equal(calc('gpcog', { paciente: 4 }).banda.id, 'con');
  assert.equal(calc('gpcog', { paciente: 6, informante: 4 }).banda.id, 'sin');
  assert.equal(calc('gpcog', { paciente: 6, informante: 3 }).banda.id, 'con');
  const sinInf = calcular(porId.gpcog, resp('gpcog', { paciente: 6 }));
  assert.equal(sinInf.completo, false);
  assert.ok(sinInf.faltan.includes('informante'));
  assert.equal(calcular(porId.gpcog, resp('gpcog', { paciente: 9 })).completo, true, 'con 9 no hace falta el informante');
  assert.match(guardado('gpcog', resp('gpcog', { paciente: 6, informante: 2 })).resumen, /persona 6\/9, informante 2\/6/);
});

test('GOHAI: categorías de Atchison y Dolan', () => {
  assert.equal(calc('gohai', { puntaje: 50 }).banda.etiqueta, 'Autopercepción baja de la salud bucal');
  assert.equal(calc('gohai', { puntaje: 51 }).banda.etiqueta, 'Autopercepción moderada de la salud bucal');
  assert.equal(calc('gohai', { puntaje: 56 }).banda.etiqueta, 'Autopercepción moderada de la salud bucal');
  assert.equal(calc('gohai', { puntaje: 57 }).banda.etiqueta, 'Autopercepción alta de la salud bucal');
});

test('MOS de apoyo social: índice global menor de 57 y cortes por subescala (De la Revilla, 2005)', () => {
  const todos = (t) => Object.fromEntries(porId.mos.campos.filter((c) => c.tipo === 'opciones').map((c) => [c.id, t]));
  assert.equal(calc('mos', todos('Siempre')).puntaje, 95);
  assert.equal(calc('mos', todos('Nunca')).puntaje, 19);
  const tres = calc('mos', todos('Algunas veces'));
  assert.equal(tres.puntaje, 57);
  assert.equal(tres.banda.etiqueta, 'Apoyo social percibido adecuado');
  assert.ok(!tres.lineas.some((l) => /escaso en/.test(l)), 'con 3 en todo, cada subescala queda justo en su corte');
  const bajo = calc('mos', { ...todos('Algunas veces'), r6: 'Pocas veces' });
  assert.equal(bajo.puntaje, 56);
  assert.equal(bajo.banda.etiqueta, 'Apoyo social percibido escaso');
  assert.ok(bajo.lineas.some((l) => /Apoyo escaso en: afectivo/.test(l)));
  assert.deepEqual(Object.keys(bajo.extras.subescalas), ['emocional', 'instrumental', 'interaccion', 'afectivo']);
});

test('Caprini: puntos por edad, factores y categorías de riesgo', () => {
  const nada = { f1: [NINGUNO], f2: [NINGUNO], f3: [NINGUNO], f5: [NINGUNO] };
  const edad = (e) => calc('caprini', { edad: e, ...nada }).puntaje;
  assert.deepEqual([40, 41, 60, 61, 74, 75].map(edad), [0, 1, 1, 2, 2, 3]);
  assert.equal(calc('caprini', { edad: 35, ...nada }).banda.etiqueta, 'Riesgo muy bajo de tromboembolia venosa');
  assert.equal(calc('caprini', { edad: 50, ...nada, f1: ['varices'] }).banda.etiqueta, 'Riesgo bajo de tromboembolia venosa');
  assert.equal(calc('caprini', { edad: 75, ...nada }).banda.etiqueta, 'Riesgo moderado de tromboembolia venosa');
  const alto = calc('caprini', { edad: 70, ...nada, f5: ['fractura'] });
  assert.equal(alto.puntaje, 7);
  assert.equal(alto.banda.etiqueta, 'Riesgo alto de tromboembolia venosa');
  assert.ok(alto.banda.sugerencias.some((s) => /no indica fármacos ni dosis/.test(s)));
  assert.equal(calcular(porId.caprini, resp('caprini', { edad: 70, f1: [], f2: [NINGUNO], f3: [NINGUNO], f5: [NINGUNO] })).completo, false, '«Ninguno» debe confirmarse');
});

test('LACE: suma de los cuatro componentes y Charlson reutilizable', () => {
  const r = calc('lace', { estancia: '14 días o más', agudeza: 'Urgente o no programado', charlson: '4 o más', urgencias: '4 o más' });
  assert.equal(r.puntaje, 19);
  assert.equal(calc('lace', { estancia: '3 días', agudeza: 'Programado', charlson: '1', urgencias: 'Ninguna' }).banda.etiqueta, 'Riesgo bajo de reingreso o muerte');
  assert.equal(calc('lace', { estancia: '4 a 6 días', agudeza: 'Urgente o no programado', charlson: '2', urgencias: '1' }).banda.etiqueta, 'Riesgo alto de reingreso o muerte');
  const ch = guardado('charlson', EJEMPLOS.charlson());
  const vin = porId.lace.vinculos.find((x) => x.escala === 'charlson');
  assert.equal(vin.disponible(ch), true);
  const idx = vin.aplicar(ch).charlson;
  assert.equal(porId.lace.campos.find((c) => c.id === 'charlson').opciones[idx].valor, ch.puntaje >= 4 ? 5 : ch.puntaje);
});

test('G8: 14 o menos indica valoración geriátrica integral', () => {
  assert.equal(calc('g8', { puntaje: 14 }).banda.etiqueta, 'Vulnerable: indicada la valoración geriátrica integral');
  assert.equal(calc('g8', { puntaje: 14.5 }).banda.etiqueta, 'Sin vulnerabilidad según el G8');
  assert.ok(porId.g8.registro);
});

test('ESAS-r: categoría por el síntoma más intenso y suma total', () => {
  const base = Object.fromEntries(porId.esasr.campos.filter((c) => c.tipo === 'numero' && !c.opcional).map((c) => [c.id, 0]));
  const e = (m) => calc('esasr', { ...base, quien: 'La persona', ...m });
  assert.equal(e({}).banda.id, 'sin');
  assert.equal(e({ dolor: 3 }).banda.id, 'leve');
  assert.equal(e({ dolor: 3, ansiedad: 4 }).banda.id, 'moderado');
  const intenso = e({ disnea: 8, dolor: 5 });
  assert.equal(intenso.banda.id, 'intenso');
  assert.equal(intenso.puntaje, 13);
  assert.ok(intenso.lineas.some((l) => /Intensos \(7 a 10\): falta de aire 8/.test(l)));
  assert.equal(e({ otro: 9 }).banda.id, 'intenso', 'el «otro problema» también cuenta para la categoría');
  assert.equal(porId.esasr.campos.filter((c) => c.tipo === 'numero' && !c.opcional).length, 9);
});

test('SPICT y NECPAL: solo registran el resultado de la hoja oficial', () => {
  assert.equal(calc('spict', { resultado: 'No cumple los criterios' }).banda.etiqueta, 'Sin criterios SPICT');
  assert.equal(calc('spict', { resultado: 'Identifica probables necesidades de cuidados paliativos' }).mostrar, 'Positivo');
  assert.equal(calc('necpal', { sorpresa: 'No me sorprendería', criterios: 'Sí' }).banda.etiqueta, 'NECPAL positivo: necesidades de atención paliativa');
  assert.equal(calc('necpal', { sorpresa: 'No me sorprendería', criterios: 'No' }).mostrar, 'Negativo');
  const sorpresaNeg = calcular(porId.necpal, resp('necpal', { sorpresa: 'Sí me sorprendería' }));
  assert.equal(sorpresaNeg.completo, true, 'sin pregunta sorpresa positiva no se piden criterios');
  assert.equal(sorpresaNeg.mostrar, 'Negativo');
  for (const id of ['spict', 'necpal']) for (const c of porId[id].campos) assert.ok(c.texto.length < 120, `${id}.${c.id}: sin reproducir indicadores`);
});

test('Equivalente de morfina: factores de los CDC (2022), umbrales y advertencia de rotación', () => {
  const m = (o, d) => calc('mme', o === 'Fentanilo transdérmico (parche)' ? { o1: o, f1: d } : { o1: o, d1: d });
  assert.equal(m('Morfina oral', 30).valor, 30);
  assert.equal(m('Oxicodona oral', 20).valor, 30);
  assert.equal(m('Tramadol oral', 200).valor, 40);
  assert.equal(m('Hidromorfona oral', 8).valor, 40);
  assert.equal(m('Tapentadol oral', 100).valor, 40);
  assert.equal(m('Codeína oral', 120).valor, 18);
  assert.ok(Math.abs(m('Metadona oral', 10).valor - 47) < 1e-9);
  assert.ok(Math.abs(m('Fentanilo transdérmico (parche)', 12).valor - 28.8) < 1e-9);
  assert.equal(m('Morfina oral', 49).banda.id, 'menos50');
  assert.equal(m('Morfina oral', 50).banda.id, 'de50');
  assert.equal(m('Morfina oral', 90).banda.id, 'de90');
  const dos = calc('mme', { o1: 'Morfina oral', d1: 30, o2: 'Fentanilo transdérmico (parche)', f2: 25, o3: 'Ninguno más' });
  assert.equal(dos.valor, 90);
  assert.equal(dos.detalles[0].filas.length, 2);
  assert.ok(dos.lineas.some((l) => /No uses este valor para calcular la dosis de otro opioide/.test(l)));
  assert.ok(m('Metadona oral', 10).lineas.some((l) => /no es lineal/.test(l)));
  assert.ok(!porId.mme.campos.find((c) => c.id === 'o1').opciones.some((o) => /buprenorfina/i.test(o.texto)), 'sin buprenorfina: no tiene factor en la guía de los CDC');
  const solo = calcular(porId.mme, resp('mme', { o1: 'Morfina oral', d1: 60 }));
  assert.equal(solo.completo, true, 'los opioides 2 y 3 son opcionales');
});
