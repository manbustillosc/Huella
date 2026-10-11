// Fase 3, módulo B: continencia y eliminación, sueño, salud sensorial y oral, deglución y disfagia.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMINIOS } from '../js/dominios.js';
import { calcular, NINGUNO } from '../js/motor.js';
import { clasificarCambio } from '../js/comparacion.js';
import { DOMINIOS_ICOPE, estadoDominio, FACTORES } from '../js/icope.js';
import { categoriaVisual, gradoAuditivo } from '../escalas/sensorial.js';
import { porId, resp, calc, guardado, EJEMPLOS } from './ayuda.mjs';

const NUEVOS = ['iciq', 'urinarios', 'diario', 'intestinal', 'isi', 'epworth', 'stopbang', 'sueno', 'agudeza', 'audiometria', 'hhies', 'ohat', 'bucal', 'eat10', 'fois', 'deglucion', 'iddsi'];
const banda = (id, mapa) => calc(id, mapa).banda?.id ?? calc(id, mapa).banda?.etiqueta;
const etiqueta = (id, mapa) => calc(id, mapa).banda.etiqueta;

test('módulo B: 17 instrumentos en cuatro dominios nuevos o ampliados', () => {
  for (const id of NUEVOS) assert.ok(porId[id], id);
  const de = (d) => NUEVOS.filter((id) => porId[id].dominio === d);
  assert.deepEqual(de('continencia'), ['iciq', 'urinarios', 'diario', 'intestinal']);
  assert.deepEqual(de('sueno'), ['isi', 'epworth', 'stopbang', 'sueno']);
  assert.deepEqual(de('sensorial'), ['agudeza', 'audiometria', 'hhies', 'ohat', 'bucal']);
  assert.deepEqual(de('deglucion'), ['eat10', 'fois', 'deglucion', 'iddsi']);
  for (const d of ['continencia', 'sueno', 'deglucion', 'sensorial']) assert.ok(DOMINIOS.some((x) => x.id === d), d);
  const plan = (d) => DOMINIOS.find((x) => x.id === d).planeadas;
  assert.ok(!plan('nutricion').some((p) => /EAT-10/.test(p)), 'EAT-10 ya no está como planeado');
  assert.ok(!plan('afectivo').some((p) => /Atenas/.test(p)));
  assert.ok(plan('sensorial').includes('GOHAI (registro)'), 'GOHAI pendiente de verificar sus puntos de corte');
});

test('instrumentos con titular de derechos: solo registro del resultado oficial, sin reactivos', () => {
  const registro = ['iciq', 'isi', 'epworth', 'stopbang', 'hhies', 'ohat', 'eat10'];
  for (const id of registro) {
    const e = porId[id];
    assert.equal(e.registro, true, id);
    assert.ok(e.licencia?.texto, `${id}: licencia`);
    assert.match(e.licencia.texto, /solo registra|registra las calificaciones/, `${id}: aclara que no reproduce`);
    for (const c of e.campos) assert.ok(c.texto.length < 140, `${id}.${c.id}: texto breve, no un reactivo`);
  }
  // Los registros de puntaje tienen un solo campo numérico (más campos de apoyo sin reactivos)
  for (const id of ['isi', 'epworth', 'hhies', 'eat10']) assert.deepEqual(porId[id].campos.map((c) => c.id), ['puntaje'], id);
  assert.deepEqual(porId.ohat.campos.map((c) => c.texto), ['Labios', 'Lengua', 'Encías y tejidos', 'Saliva', 'Dientes naturales', 'Prótesis', 'Limpieza oral', 'Dolor dental']);
  assert.match(porId.iddsi.licencia.texto, /Creative Commons Attribution-ShareAlike 4\.0/);
  assert.match(porId.intestinal.notas.join(' '), /imágenes originales tienen titular de derechos/);
});

test('ICIQ-UI SF: intervalos de gravedad de Klovning (2009)', () => {
  assert.equal(etiqueta('iciq', { puntaje: 0 }), 'Sin incontinencia referida');
  assert.equal(etiqueta('iciq', { puntaje: 5 }), 'Incontinencia leve');
  assert.equal(etiqueta('iciq', { puntaje: 6 }), 'Incontinencia moderada');
  assert.equal(etiqueta('iciq', { puntaje: 12 }), 'Incontinencia moderada');
  assert.equal(etiqueta('iciq', { puntaje: 13 }), 'Incontinencia grave');
  assert.equal(etiqueta('iciq', { puntaje: 19 }), 'Incontinencia muy grave');
  const r = calc('iciq', { puntaje: 9, momento: ['esfuerzo', 'urgencia'] });
  assert.match(r.lineas[0], /no determina el tipo de incontinencia/);
});

test('síntomas urinarios y función intestinal: datos de alarma sin diagnóstico automático', () => {
  const u = calc('urinarios', { sintomas: ['vaciamiento'], alarma: ['retencion'] });
  assert.equal(u.banda.id, 'alarma');
  assert.match(u.lineas.join(' '), /Huella no establece la causa/);
  assert.ok(u.banda.sugerencias.some((s) => /residuo posmiccional/.test(s)));
  const sinNumeros = calc('urinarios', { sintomas: ['urgencia'], alarma: [NINGUNO] });
  assert.equal(sinNumeros.banda.id, 'sintomas');
  assert.doesNotMatch(sinNumeros.lineas.join(' '), /Nicturia|Absorbentes/, 'un campo vacío no se informa como cero');
  assert.equal(calc('urinarios', { sintomas: [NINGUNO], alarma: [NINGUNO] }).banda.id, 'sin');
  for (const id of ['urinarios', 'intestinal']) {
    const txt = JSON.stringify(porId[id].bandas);
    assert.doesNotMatch(txt, /incontinencia de esfuerzo|incontinencia de urgencia confirmada|diagnóstico de estreñimiento/i, `${id}: no asigna subtipo`);
  }
  const imp = calc('intestinal', { frecuencia: 1, bristol: 'Tipo 1: trozos duros y separados, difíciles de evacuar', sintomas: ['pujo', 'maniobras'], incontinencia: 3, laxantes: ['osmotico', 'estimulante'], alarma: ['rebosamiento'] });
  assert.equal(imp.banda.id, 'alarma');
  assert.equal(imp.extras.posibleImpactacion, true);
  assert.match(imp.lineas.join(' '), /impactación fecal.*tacto rectal/);
  assert.match(imp.lineas.join(' '), /Datos que orientan a estreñimiento: 1 evacuaciones por semana; heces duras/);
  assert.ok(imp.banda.sugerencias.some((s) => /varios laxantes/.test(s)));
  const normal = calc('intestinal', { frecuencia: 7, bristol: 'Tipo 4: alargada, lisa y blanda', sintomas: [NINGUNO], incontinencia: 0, laxantes: [NINGUNO], alarma: [NINGUNO] });
  assert.equal(normal.banda.id, 'sin');
});

test('diario miccional: promedios de los días registrados, índice de poliuria nocturna y campos vacíos', () => {
  const r = calc('diario', { d1_diurnas: 8, d1_nocturnas: 3, d1_perdidas: 1, d1_total: 1800, d1_noche: 700, d2_diurnas: 6, d2_nocturnas: 2, d2_perdidas: 0, d2_total: 1600, d2_noche: 500 });
  assert.equal(r.extras.dias, 2);
  assert.equal(r.extras.diurnas, 7);
  assert.equal(r.extras.nocturnas, 2.5);
  assert.ok(Math.abs(r.extras.ipn - ((700 / 1800 + 500 / 1600) / 2)) < 1e-9);
  assert.match(r.lineas.join(' '), /Índice de poliuria nocturna .*: 35%: mayor del 33%/);
  assert.match(r.lineas.join(' '), /Menos de 3 días/);
  const sinVol = calc('diario', { d1_diurnas: 5, d1_nocturnas: 1, d1_perdidas: 0 });
  assert.match(sinVol.lineas.join(' '), /Volumen de 24 h: no registrado/);
  assert.match(sinVol.lineas.join(' '), /no calculable/);
  const parcial = calc('diario', { d1_diurnas: 5, d1_nocturnas: 1, d1_perdidas: 0, d2_diurnas: 4 });
  assert.ok(parcial.errores.d2_diurnas, 'un día incompleto se señala, no se toma como cero');
  const imposible = calc('diario', { d1_diurnas: 5, d1_nocturnas: 1, d1_perdidas: 0, d1_total: 500, d1_noche: 800 });
  assert.ok(imposible.errores.d1_noche);
});

test('sueño: ISI, Epworth y STOP-Bang con sus categorías publicadas; sin sugerir fármacos', () => {
  assert.equal(etiqueta('isi', { puntaje: 7 }), 'Sin insomnio clínicamente significativo');
  assert.equal(etiqueta('isi', { puntaje: 8 }), 'Insomnio subclínico');
  assert.equal(etiqueta('isi', { puntaje: 15 }), 'Insomnio clínico moderado');
  assert.equal(etiqueta('isi', { puntaje: 22 }), 'Insomnio clínico grave');
  assert.equal(etiqueta('epworth', { puntaje: 10 }), 'Somnolencia diurna normal alta');
  assert.equal(etiqueta('epworth', { puntaje: 11 }), 'Somnolencia diurna excesiva leve');
  assert.equal(etiqueta('epworth', { puntaje: 13 }), 'Somnolencia diurna excesiva moderada');
  assert.equal(etiqueta('epworth', { puntaje: 16 }), 'Somnolencia diurna excesiva grave');
  assert.equal(banda('stopbang', { puntaje: 2 }), 'bajo');
  assert.equal(banda('stopbang', { puntaje: 3, adicional: 'No' }), 'intermedio');
  assert.equal(banda('stopbang', { puntaje: 4, adicional: 'Sí' }), 'alto');
  assert.equal(banda('stopbang', { puntaje: 5 }), 'alto');
  assert.equal(calc('stopbang', { puntaje: 3 }).completo, false, 'con 3 o 4 pide el criterio adicional');
  assert.match(porId.stopbang.bandas.find((b) => b.id === 'alto').texto, /no un diagnóstico/);
  const s = calc('sueno', { horas: 5, cama: 9, problemas: ['apneas', 'conciliar'], contribuyentes: ['hipnoticos'] });
  assert.match(s.lineas[0], /56%/);
  const sug = s.banda.sugerencias.join(' ');
  assert.match(sug, /STOP-Bang/);
  assert.match(sug, /STOPP\/START y Beers/);
  assert.doesNotMatch(sug, /zolpidem|melatonina|trazodona|benzodiacepina indicada|iniciar un hipnótico/i);
  assert.ok(calc('sueno', { horas: 10, cama: 8, problemas: [NINGUNO], contribuyentes: [NINGUNO] }).errores.horas);
});

test('agudeza visual: categorías de la CIE-11 con el mejor ojo, ojo peor y visión de cerca', () => {
  assert.equal(categoriaVisual(20 / 40), 'sin');
  assert.equal(categoriaVisual(20 / 50), 'leve');
  assert.equal(categoriaVisual(20 / 60), 'leve', '6/18 todavía es leve');
  assert.equal(categoriaVisual(20 / 70), 'moderada');
  assert.equal(categoriaVisual(20 / 200), 'moderada', '6/60 todavía es moderada');
  assert.equal(categoriaVisual(20 / 400), 'grave', '3/60 todavía es grave');
  assert.equal(categoriaVisual(0.02), 'ceguera');
  const r = calcular(porId.agudeza, EJEMPLOS.agudeza());
  assert.equal(r.banda.id, 'sin');
  assert.equal(r.banda.hallazgo, true, 'un ojo peor que 6/12 es hallazgo aunque el mejor ojo esté bien');
  assert.match(r.lineas.join(' '), /ojo izquierdo tiene una agudeza peor que 6\/12/);
  const cerca = calc('agudeza', { metodo: 'Aplicación o pantalla', correccion: 'Sin lentes (los usa, pero no los tenía)', od: '20/20 (6/6)', oi: 'No se pudo medir en este ojo', cerca: 'No lee N6' });
  assert.equal(cerca.extras.cerca, true);
  assert.match(cerca.lineas.join(' '), /Solo se midió un ojo/);
  assert.match(cerca.lineas.join(' '), /no equivale a una medición estandarizada/);
  assert.match(cerca.lineas.join(' '), /sin los lentes que usa habitualmente/);
  const ninguno = calc('agudeza', { metodo: 'Snellen a 6 m (20 pies)', correccion: 'Sin lentes (no usa)', od: 'No se pudo medir en este ojo', oi: 'No se pudo medir en este ojo', cerca: 'No se evaluó' });
  assert.ok(ninguno.errores.oi);
});

test('audiometría: grados de la OMS (2021) con el mejor oído y pérdida unilateral', () => {
  assert.equal(gradoAuditivo(19.9).id, 'normal');
  assert.equal(gradoAuditivo(20).id, 'leve');
  assert.equal(gradoAuditivo(34.9).id, 'leve');
  assert.equal(gradoAuditivo(35).id, 'moderada');
  assert.equal(gradoAuditivo(64.9).id, 'moderada_grave');
  assert.equal(gradoAuditivo(80).id, 'profunda');
  assert.equal(gradoAuditivo(95).id, 'completa');
  const r = calcular(porId.audiometria, EJEMPLOS.audiometria());
  assert.equal(r.banda.id, 'moderada');
  assert.equal(r.valor, 38.75);
  assert.equal(calc('audiometria', { od: 15, oi: 40, audifonos: 'No tiene' }).banda.id, 'unilateral');
  const asim = calc('audiometria', { od: 25, oi: 45, audifonos: 'Tiene, pero no los usa' });
  assert.match(asim.lineas.join(' '), /Diferencia de 20 dB/);
  assert.match(asim.lineas.join(' '), /no los usa: explorar el motivo/);
  const antes = guardado('audiometria', resp('audiometria', { od: 30, oi: 32, audifonos: 'No tiene' }));
  const despues = guardado('audiometria', resp('audiometria', { od: 40, oi: 42, audifonos: 'No tiene' }));
  assert.equal(clasificarCambio(porId.audiometria, antes, despues).tipo, 'empeoramiento');
});

test('HHIE-S, OHAT, revisión bucal: puntajes pares, categorías sin cortes inventados y alarma oral', () => {
  assert.ok(calc('hhies', { puntaje: 9 }).errores.puntaje, 'el puntaje del HHIE-S es par');
  assert.equal(etiqueta('hhies', { puntaje: 8 }), 'Sin discapacidad auditiva percibida');
  assert.equal(etiqueta('hhies', { puntaje: 10 }), 'Discapacidad auditiva leve a moderada');
  assert.equal(etiqueta('hhies', { puntaje: 26 }), 'Discapacidad auditiva significativa');
  const o = calcular(porId.ohat, EJEMPLOS.ohat());
  assert.equal(o.puntaje, 4);
  assert.equal(o.banda.id, 'no_sano');
  assert.match(o.lineas.join(' '), /No sano: dientes naturales/);
  assert.match(porId.ohat.notas[0], /no define puntos de corte para el total/);
  const b = calc('bucal', { hallazgos: ['seca'], dentista: 'Hace menos de 1 año', alarma: ['lesion'] });
  assert.equal(b.banda.id, 'alarma');
  assert.ok(b.banda.sugerencias.some((s) => /más de 3 semanas.*NICE NG12/.test(s)));
  assert.ok(b.banda.sugerencias.some((s) => /boca seca/.test(s)));
});

test('deglución: EAT-10 ≥3 deriva a personal capacitado; FOIS; IDDSI solo registra la indicación', () => {
  assert.equal(etiqueta('eat10', { puntaje: 2 }), 'Sin indicación de disfagia en el tamizaje');
  const e = calc('eat10', { puntaje: 3 });
  assert.equal(e.banda.etiqueta, 'Tamizaje positivo de disfagia');
  assert.ok(e.banda.sugerencias.some((s) => /personal capacitado/.test(s)));
  assert.ok(e.banda.sugerencias.some((s) => /No indicar la textura de la dieta ni pruebas de deglución con agua/.test(s)));
  const f = calcular(porId.fois, EJEMPLOS.fois());
  assert.equal(f.puntaje, 5);
  assert.equal(f.banda.etiqueta, 'Dieta oral con restricciones');
  assert.equal(clasificarCambio(porId.fois, guardado('fois', resp('fois', { nivel: '3 · Depende de sonda, con ingesta oral constante de comida o líquido' })), guardado('fois', EJEMPLOS.fois())).tipo, 'mejoria');
  const d = calc('deglucion', { signos: ['voz', 'neumonia'] });
  assert.ok(d.banda.sugerencias.some((s) => /personal capacitado/.test(s)));
  assert.match(porId.deglucion.aplicacion[0], /No hagas pruebas con agua/);
  const i = calcular(porId.iddsi, EJEMPLOS.iddsi());
  assert.equal(i.banda.nivel, 'neutro');
  assert.match(i.lineas[0], /Bebidas: Nivel 2 · Poco espeso\. Alimentos: Nivel 5 · Picado y húmedo/);
  assert.equal(porId.iddsi.siguientes, undefined, 'no propone texturas');
  assert.ok(!porId.eat10.siguientes?.some((s) => s.id === 'iddsi'), 'el tamizaje no lleva a indicar una textura');
});

test('ICOPE usa los instrumentos nuevos en el paso 2 y en las necesidades adicionales', () => {
  const vision = DOMINIOS_ICOPE.find((d) => d.id === 'vision');
  const audicion = DOMINIOS_ICOPE.find((d) => d.id === 'audicion');
  assert.deepEqual(vision.detallada.elegir, ['agudeza']);
  assert.deepEqual(audicion.detallada.elegir, ['audiometria']);
  assert.ok(FACTORES.relacionados.some((x) => x.id === 'iciq'));
  const vis = guardado('icope-vis', resp('icope-vis', { filtro1: 'Sí', filtro2: 'No' }), { fecha: '2026-10-01' });
  const ag = guardado('agudeza', EJEMPLOS.agudeza(), { fecha: '2026-10-02' });
  const x = estadoDominio(vision, { resultados: [vis, ag] }, '2026-10-10');
  assert.equal(x.estado, 'alterado');
  assert.equal(x.necesidad.tipo, 'hecha');
  assert.match(x.necesidad.texto, /Agudeza visual/);
});
