// Fase 3, módulo C: salud ósea (FRAX como registro y DXA), levantarse de la silla en 30 s, equilibrio en 4 etapas,
// dinamometría de prensión y algoritmo EWGSOP2.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMINIOS } from '../js/dominios.js';
import { RUTAS } from '../js/rutas.js';
import { DOMINIOS_ICOPE } from '../js/icope.js';
import { clasificarCambio } from '../js/comparacion.js';
import { cifraGuardada } from '../js/nota.js';
import { corteSilla30, NORMAS_SILLA30 } from '../escalas/movilidad.js';
import { porId, resp, calc, guardado, EJEMPLOS } from './ayuda.mjs';

const NUEVOS = ['frax', 'dxa', 'silla30', 'equilibrio4', 'dinamometria', 'ewgsop2'];
const aplicarVinculo = (id, vid, res) => porId[id].vinculos.find((x) => x.id === vid).aplicar(res);

test('módulo C: seis instrumentos, dominio de salud ósea y rutas', () => {
  for (const id of NUEVOS) assert.ok(porId[id] && EJEMPLOS[id], id);
  assert.ok(DOMINIOS.some((d) => d.id === 'osea'));
  assert.equal(porId.frax.dominio, 'osea');
  assert.equal(porId.dxa.dominio, 'osea');
  const frag = RUTAS.find((r) => r.id === 'fragilidad').complementarios.map((p) => p.id);
  for (const id of ['dinamometria', 'ewgsop2', 'silla30', 'equilibrio4', 'dxa', 'frax']) assert.ok(frag.includes(id), id);
  const loc = DOMINIOS_ICOPE.find((d) => d.id === 'locomotora').detallada.complementarios.map((x) => x.id);
  assert.ok(loc.includes('equilibrio4') && loc.includes('dinamometria'));
  const vit = DOMINIOS_ICOPE.find((d) => d.id === 'vitalidad').detallada.complementarios.map((x) => x.id);
  assert.ok(vit.includes('dinamometria'));
});

test('FRAX: solo registro del resultado oficial, sin algoritmo ni umbrales de tratamiento', () => {
  const e = porId.frax;
  assert.equal(e.registro, true);
  assert.match(e.licencia.texto, /marcas registradas/);
  assert.match(e.licencia.texto, /Osteoporosis Research Ltd/);
  assert.match(e.licencia.enlace, /^https:\/\/www\.fraxplus\.org\//);
  assert.ok(!/OMS|WHO|Organización Mundial/.test(e.nombre + e.descripcion + e.licencia.texto), 'no se presenta como herramienta de la OMS');
  assert.deepEqual(e.campos.map((c) => c.id), ['modelo', 'mayor', 'cadera', 'dmo']);
  assert.equal(e.bandas.length, 1, 'una sola categoría neutra: no clasifica alto o bajo');
  const res = calc('frax', { modelo: 'México', mayor: 25, cadera: 9, dmo: 'Sin DMO (solo con el IMC)' });
  assert.equal(res.banda.nivel, 'neutro');
  assert.ok(!res.banda.hallazgo);
  assert.ok(res.lineas.some((l) => /sin DMO/.test(l)));
  assert.equal(res.mostrar, '25');
  assert.equal(cifraGuardada(guardado('frax', resp('frax', { modelo: 'México', mayor: 25, cadera: 9, dmo: 'Sin DMO (solo con el IMC)' }))), '25 %');
  // Cadera mayor que fractura mayor: error de captura
  const mal = calc('frax', { modelo: 'México', mayor: 5, cadera: 8, dmo: 'Con DMO del cuello femoral' });
  assert.ok(!mal.completo && mal.errores.cadera);
  // Otro país: aviso
  assert.ok(calc('frax', { modelo: 'Otro país', mayor: 5, cadera: 1, dmo: 'Con DMO del cuello femoral' }).lineas.some((l) => /otro país/.test(l)));
  // Comparación con y sin DMO
  const a = guardado('frax', resp('frax', { modelo: 'México', mayor: 10, cadera: 3, dmo: 'Con DMO del cuello femoral' }));
  const b = guardado('frax', resp('frax', { modelo: 'México', mayor: 12, cadera: 3, dmo: 'Sin DMO (solo con el IMC)' }));
  assert.match(porId.frax.comparable(a, b).advertencia, /DMO/);
});

test('DXA: categorías de la OMS con el T-score más bajo; osteoporosis densitométrica distinta de la clínica', () => {
  const t = (vals, extra = {}) => calc('dxa', { sexo: 'Mujer', edad: 70, menopausia: 'Sí', fractura: 'No', ...vals, ...extra });
  assert.equal(t({ t_columna: -1.0 }).banda.id, 'normal');
  assert.equal(t({ t_columna: -1.1 }).banda.id, 'baja');
  assert.equal(t({ t_columna: -2.4, t_cuello: -1.5 }).banda.id, 'baja');
  assert.equal(t({ t_columna: -2.5 }).banda.id, 'osteoporosis');
  const op = t({ t_columna: -1.2, t_cuello: -2.8, t_cadera: -2.0 });
  assert.equal(op.valor, -2.8);
  assert.match(op.lineas[0], /cuello femoral/);
  assert.match(op.banda.etiqueta, /densitométrica/);
  // Fractura por fragilidad con T-score no osteoporótico: diagnóstico clínico posible, lo establece el médico
  const fx = t({ t_columna: -1.5 }, { fractura: 'Sí' });
  assert.equal(fx.banda.id, 'baja');
  assert.ok(fx.banda.hallazgo);
  assert.ok(fx.lineas.some((l) => /criterio clínico de osteoporosis/.test(l) && /el médico/.test(l)));
  assert.ok(!fx.lineas.some((l) => /grave o establecida/.test(l)));
  assert.ok(t({ t_columna: -3.0 }, { fractura: 'Sí' }).lineas.some((l) => /grave o establecida/.test(l)));
  // Sin T-score: error
  assert.ok(t({}).errores.t_columna);
  // Hombre de 45 años: Z-score
  const z = calc('dxa', { sexo: 'Hombre', edad: 45, z_min: -2.0, t_columna: -2.7, fractura: 'No' });
  assert.equal(z.banda.id, 'zbaja');
  assert.equal(calc('dxa', { sexo: 'Hombre', edad: 45, z_min: -1.9, fractura: 'No' }).banda.id, 'zesperada');
  assert.ok(calc('dxa', { sexo: 'Hombre', edad: 45, fractura: 'No' }).errores.z_min);
  // Hombre de 50 años: T-score
  assert.equal(calc('dxa', { sexo: 'Hombre', edad: 50, t_cuello: -2.6, fractura: 'No' }).banda.id, 'osteoporosis');
  // Sugiere evaluar caídas y FRAX ante un hallazgo; la comparación advierte sobre el cambio mínimo significativo
  assert.ok(op.banda.sugerencias.some((s) => /caídas/.test(s)));
  const ids = porId.dxa.siguientes.filter((s) => s.si(op)).map((s) => s.id);
  assert.deepEqual(ids, ['frax', 'tug', 'equilibrio4']);
  const a = guardado('dxa', resp('dxa', { sexo: 'Mujer', edad: 70, menopausia: 'Sí', t_columna: -2.6, fractura: 'No' }));
  const b = guardado('dxa', resp('dxa', { sexo: 'Mujer', edad: 72, menopausia: 'Sí', t_columna: -2.4, fractura: 'No' }));
  assert.match(porId.dxa.comparable(a, b).advertencia, /cambio mínimo significativo/);
});

test('silla 30 s: valores del CDC STEADI por edad y sexo; uso de brazos registra 0', () => {
  assert.equal(corteSilla30(false, 60), 14);
  assert.equal(corteSilla30(false, 72), 12);
  assert.equal(corteSilla30(false, 94), 7);
  assert.equal(corteSilla30(true, 66), 11);
  assert.equal(corteSilla30(true, 77), 10);
  assert.equal(corteSilla30(true, 92), 4);
  assert.equal(corteSilla30(true, 59), null);
  assert.equal(corteSilla30(false, 95), null);
  assert.equal(NORMAS_SILLA30.mujer.length, 7);
  const s = (sexo, edad, n) => calc('silla30', { sexo, edad, brazos: 'No', repeticiones: n });
  assert.equal(s('Mujer', 78, 9).banda.id, 'bajo');
  assert.equal(s('Mujer', 78, 10).banda.id, 'normal');
  assert.equal(s('Hombre', 62, 13).banda.id, 'bajo');
  assert.equal(s('Hombre', 62, 14).banda.id, 'normal');
  assert.equal(s('Hombre', 97, 5).banda.id, 'sinref');
  const brazos = calc('silla30', { sexo: 'Mujer', edad: 80, brazos: 'Sí: se detiene la prueba y se registra 0' });
  assert.equal(brazos.valor, 0);
  assert.equal(brazos.banda.id, 'bajo');
  assert.ok(porId.silla30.notas.some((n) => /no son intercambiables/.test(n)), 'distinta de las 5 levantadas');
  const a = guardado('silla30', resp('silla30', { sexo: 'Mujer', edad: 78, brazos: 'No', repeticiones: 8 }));
  const b = guardado('silla30', resp('silla30', { sexo: 'Mujer', edad: 78, brazos: 'No', repeticiones: 11 }));
  assert.equal(clasificarCambio(porId.silla30, a, b).tipo, 'mejoria');
});

test('equilibrio en 4 etapas: secuencial; no mantener el tándem indica mayor riesgo; reutiliza el SPPB', () => {
  const M = 'Lo mantiene 10 segundos';
  const N = 'No lo mantiene 10 segundos';
  const eq = (m) => calc('equilibrio4', m);
  assert.equal(eq({ etapa1: N }).puntaje, 0);
  assert.equal(eq({ etapa1: M, etapa2: M, etapa3: N }).banda.id, 'riesgo');
  assert.equal(eq({ etapa1: M, etapa2: M, etapa3: M, etapa4: N }).banda.id, 'tandem');
  assert.equal(eq({ etapa1: M, etapa2: M, etapa3: M, etapa4: M }).puntaje, 4);
  // Etapa siguiente oculta si la anterior no se mantuvo
  const e2 = porId.equilibrio4.campos.find((c) => c.id === 'etapa2');
  assert.equal(e2.visibleSi({ etapa1: 1 }), false);
  assert.equal(e2.visibleSi({ etapa1: 0 }), true);
  // Vínculo con el equilibrio del SPPB (0 = lo mantiene)
  assert.deepEqual(aplicarVinculo('equilibrio4', 'sppb', { extras: { eq: 4 } }), { etapa1: 0, etapa2: 0, etapa3: 0 });
  assert.deepEqual(aplicarVinculo('equilibrio4', 'sppb', { extras: { eq: 3 } }), { etapa1: 0, etapa2: 0, etapa3: 1 });
  assert.deepEqual(aplicarVinculo('equilibrio4', 'sppb', { extras: { eq: 1 } }), { etapa1: 0, etapa2: 1 });
  assert.deepEqual(aplicarVinculo('equilibrio4', 'sppb', { extras: { eq: 0 } }), { etapa1: 1 });
});

test('dinamometría: máximo de los intentos, cortes del EWGSOP2 y sin diagnóstico de sarcopenia por sí sola', () => {
  const d = calc('dinamometria', { sexo: 'Mujer', dominante: 'Derecha', equipo: 'Electrónico', der1: 14, izq1: 15.9 });
  assert.equal(d.valor, 15.9);
  assert.equal(d.banda.id, 'baja');
  assert.match(d.banda.texto, /sarcopenia probable/);
  assert.match(d.banda.texto, /confirmación requiere/);
  assert.equal(d.extras.dominante, 14);
  assert.ok(d.lineas.some((l) => /2 de 6 intentos/.test(l)));
  assert.equal(calc('dinamometria', { sexo: 'Mujer', dominante: 'Derecha', equipo: 'Electrónico', der1: 16 }).banda.id, 'normal');
  assert.equal(calc('dinamometria', { sexo: 'Hombre', dominante: 'Izquierda', equipo: 'Electrónico', izq1: 26.9 }).banda.id, 'baja');
  assert.equal(calc('dinamometria', { sexo: 'Hombre', dominante: 'Izquierda', equipo: 'Electrónico', izq1: 27 }).banda.id, 'normal');
  assert.equal(calc('dinamometria', { sexo: 'Hombre', dominante: 'Ambidiestra', equipo: 'Otro', der1: 30, izq2: 33 }).extras.dominante, 33);
  assert.ok(calc('dinamometria', { sexo: 'Hombre', dominante: 'Derecha', equipo: 'Otro' }).errores.der1, 'al menos un intento');
  assert.ok(!/sarcopenia confirmada|diagnóstico de sarcopenia/i.test(JSON.stringify(porId.dinamometria.bandas)));
  assert.deepEqual(porId.dinamometria.siguientes.filter((s) => s.si(d)).map((s) => s.id), ['ewgsop2']);
  // Reutilización en Fried (mano dominante, con advertencia de método) y en el EWGSOP2 (máximo)
  const vf = porId.fried.vinculos.find((x) => x.id === 'dinamometria');
  assert.equal(vf.disponible(d), true);
  assert.deepEqual(vf.aplicar(d), { fuerza_estado: 0, fuerza: '14' });
  assert.match(vf.advertencia(d), /mano dominante/);
  assert.deepEqual(aplicarVinculo('ewgsop2', 'dinamometria', d), { fuerza_tipo: 0, prension: '15.9' });
  const soloIzq = calc('dinamometria', { sexo: 'Hombre', dominante: 'Derecha', equipo: 'Otro', izq1: 30 });
  assert.notEqual(vf.disponible(soloIzq), true, 'sin intentos con la mano dominante no se ofrece a Fried');
});

test('EWGSOP2: probable, no confirmada, confirmada y grave según fuerza, masa y desempeño', () => {
  const base = { sexo: 'Mujer', fuerza_tipo: 'Prensión (kg)', prension: 15 };
  const ew = (m) => calc('ewgsop2', { ...base, ...m });
  assert.equal(ew({ prension: 16, masa_tipo: 'No medida', desempeno_tipo: 'No medido' }).banda.id, 'sin');
  assert.equal(ew({ masa_tipo: 'No medida', desempeno_tipo: 'No medido' }).banda.id, 'probable');
  assert.equal(ew({ masa_tipo: 'ASM (kg)', asm: 15, metodo: 'DXA', desempeno_tipo: 'No medido' }).banda.id, 'noconfirmada');
  const conf = ew({ masa_tipo: 'ASM (kg)', asm: 14.9, metodo: 'DXA', desempeno_tipo: 'No medido' });
  assert.equal(conf.banda.id, 'confirmada');
  assert.ok(conf.lineas.some((l) => /no se puede valorar la gravedad/.test(l)));
  assert.equal(ew({ masa_tipo: 'ASM/talla² (kg/m²)', asmi: 5.4, metodo: 'DXA', desempeno_tipo: 'Velocidad de marcha (m/s)', marcha: 0.9 }).banda.id, 'confirmada');
  assert.equal(ew({ masa_tipo: 'ASM/talla² (kg/m²)', asmi: 5.4, metodo: 'DXA', desempeno_tipo: 'Velocidad de marcha (m/s)', marcha: 0.8 }).banda.id, 'grave');
  assert.equal(ew({ masa_tipo: 'ASM/talla² (kg/m²)', asmi: 5.4, metodo: 'DXA', desempeno_tipo: 'SPPB (puntos)', sppb: 8 }).banda.id, 'grave');
  assert.equal(ew({ masa_tipo: 'ASM/talla² (kg/m²)', asmi: 5.4, metodo: 'DXA', desempeno_tipo: 'TUG (s)', tug: 19.9 }).banda.id, 'confirmada');
  // Hombre: cortes propios; fuerza por 5 levantadas
  const h = (m) => calc('ewgsop2', { sexo: 'Hombre', ...m });
  assert.equal(h({ fuerza_tipo: 'Cinco levantadas de la silla (s)', silla5: 15, masa_tipo: 'No medida', desempeno_tipo: 'No medido' }).banda.id, 'sin');
  assert.equal(h({ fuerza_tipo: 'Cinco levantadas de la silla (s)', silla5: 15.1, masa_tipo: 'ASM/talla² (kg/m²)', asmi: 6.9, metodo: 'Bioimpedancia (BIA)', desempeno_tipo: 'No medido' }).banda.id, 'confirmada');
  assert.equal(h({ fuerza_tipo: 'Prensión (kg)', prension: 27, masa_tipo: 'ASM (kg)', asm: 15, metodo: 'DXA', desempeno_tipo: 'No medido' }).banda.id, 'sin');
  // Desempeño bajo con fuerza conservada: buscar otras causas
  assert.ok(h({ fuerza_tipo: 'Prensión (kg)', prension: 35, masa_tipo: 'No medida', desempeno_tipo: 'Velocidad de marcha (m/s)', marcha: 0.6 }).lineas.some((l) => /otras causas/.test(l)));
  assert.match(porId.ewgsop2.notas.join(' '), /lo integra el médico/);
});
