// Regresiones de la auditoría de Huella 2.9.0 (prioridades 2 y 3): DASI y su umbral, precisión de la movilidad ICOPE,
// catálogo de la evaluación detallada, discordancia cognitiva, trazabilidad de la VPO, episodios archivados y el paso
// de dolor de la ruta hospitalaria. Todos los datos son ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcular, resumenDe, textoEscala, fmtCrudo } from '../js/motor.js';
import { bandaDasi, difiereLineamiento, metDeDasi, TEXTO_DIFERENCIA_DASI, UMBRAL_DASI } from '../escalas/dasi.js';
import { DIAGRAMAS, DOCUMENTO_VPO, ORIGENES_VPO, FUENTE_LISTA_VPO } from '../js/vpo.js';
import { DOMINIOS_ICOPE, dominioIcope, opcionesDetallada, estadoDominio, textoIcope, resumenIcope } from '../js/icope.js';
import { hallazgosYSugerencias, notaValoracion, discordanciaCognitiva } from '../js/nota.js';
import { textoInforme } from '../js/informes.js';
import { DOMINIOS } from '../js/dominios.js';
import { RUTAS, pasosDe } from '../js/rutas.js';
import { almacen } from '../js/almacen.js';
import { pasosConEstado, progresoRuta, siguientePendiente, tiempoRuta } from '../js/vistas/rutas-estado.js';
import { porId, resp, guardado, todos, EJEMPLOS } from './ayuda.mjs';

/* ---------- 10. DASI ---------- */

// Responder «sí» solo a las actividades 5, 8, 9, 11 y 12 suma exactamente 34 (vector aritmético, no una historia clínica).
const VECTOR_34 = ['correr', 'pesado', 'jardin', 'recreacion', 'deporte'];
const dasiCon = (si) => calcular(porId.dasi, Object.fromEntries(porId.dasi.campos.map((c) => [c.id, si.includes(c.id) ? 0 : 1])));

test('DASI: frontera 33.95, 34 y 34.05 en el motor (guía AHA/ACC 2024: ≤34 es capacidad funcional baja)', () => {
  assert.equal(bandaDasi(33.95).id, 'bajo');
  assert.equal(bandaDasi(34).id, 'bajo');
  assert.equal(bandaDasi(34.05).id, 'alto');
  assert.equal(difiereLineamiento(33.95), false);
  assert.equal(difiereLineamiento(34), true, 'solo con 34 exactos difiere el lineamiento (≥34 menor riesgo)');
  assert.equal(difiereLineamiento(34.05), false);
  assert.equal(UMBRAL_DASI, 34);
  assert.equal(Number(metDeDasi(34).toFixed(2)), 6.92, '34 puntos son ≈6.9 MET estimados, no 4');
});

test('DASI: el vector exacto de 34 concuerda en resultado, resumen, nota e interpretación', () => {
  const r = dasiCon(VECTOR_34);
  assert.equal(r.valor, 34);
  assert.equal(r.banda.id, 'bajo');
  assert.match(r.banda.etiqueta, /≤34/);
  assert.equal(r.extras.met, 6.9);
  assert.equal(r.extras.difiereLineamiento, true);
  assert.ok(r.lineas.includes(TEXTO_DIFERENCIA_DASI));
  assert.match(resumenDe(porId.dasi, r), /DASI: 34\/58\.2 \(capacidad funcional baja, ≤34\); 6\.9 MET estimados/);
  const nota = textoEscala(porId.dasi, r, 'parrafo');
  assert.match(nota, /Con 34 puntos exactos los criterios difieren/);
  assert.doesNotMatch(nota, /equivale a ≥?4 MET/);
  assert.ok(r.banda.sugerencias.some((s) => /no es por sí solo indicación de prueba de esfuerzo/.test(s)), 'sin indicación automática de prueba de esfuerzo');
  const alto = dasiCon(['cuidado', 'casa', 'cuadras', 'escaleras', 'ligero', 'moderado', 'recreacion', 'sexual', 'jardin']);
  assert.equal(alto.valor, 34.7);
  assert.equal(alto.banda.id, 'alto');
  assert.equal(alto.extras.difiereLineamiento, false);
  assert.ok(!alto.lineas.includes(TEXTO_DIFERENCIA_DASI));
});

test('DASI: sin la equivalencia «≥34 = ≥4 MET» en la escala ni en los diagramas de la VPO', () => {
  const textos = [JSON.stringify(porId.dasi.notas), readFileSync(new URL('../js/vpo.js', import.meta.url), 'utf8')];
  for (const t of textos) assert.doesNotMatch(t, /≥ ?34 puntos equivale|equivale a ≥ ?4 MET|\(≥34 puntos equivale/);
  assert.ok(porId.dasi.notas.some((n) => /DASI ≤34/.test(n) && /AHA\/ACC 2024/.test(n)));
  assert.ok(porId.dasi.notas.some((n) => /cuadro 3, p\. 12/.test(n)), 'criterio institucional con su página');
  const cardio = DIAGRAMAS.find((d) => d.id === 'cardio');
  const nodoDasi = JSON.stringify(cardio.nodos);
  assert.match(nodoDasi, /DASI ≤34/);
  assert.match(nodoDasi, /no indica una prueba de esfuerzo/);
});

/* ---------- 11. ICOPE movilidad: precisión en el punto de corte ---------- */

const loc = (t) => calcular(porId['icope-loc'], { seguro: 0, completo: 0, tiempo: t });

test('ICOPE movilidad: 14.00 s conservado y 14.01 s alterado se distinguen en todas las salidas', () => {
  const a = loc('14.00');
  const b = loc('14.01');
  assert.equal(a.banda.id, 'conservado');
  assert.equal(b.banda.id, 'alterado');
  const resp14 = a.desglose.find((d) => d.campo.id === 'tiempo').respuesta;
  const resp1401 = b.desglose.find((d) => d.campo.id === 'tiempo').respuesta;
  assert.equal(resp14, '14 s');
  assert.equal(resp1401, '14.01 s', 'no se redondea a «14 s», que coincide con el límite conservado');
  assert.notEqual(resp14, resp1401);
  assert.match(textoEscala(porId['icope-loc'], b, 'lista'), /14\.01 s/);
  assert.match(textoEscala(porId['icope-loc'], b, 'parrafo'), /14\.01 s/);
  assert.match(b.extras.hallazgo, /14\.01 s, más de 14 s/);
  assert.equal(loc('13.99').desglose.find((d) => d.campo.id === 'tiempo').respuesta, '13.99 s');
  assert.equal(fmtCrudo(14.01, 1), '14.01');
  assert.equal(fmtCrudo(14, 1), '14');
  assert.equal(fmtCrudo(12.5, 1), '12.5');
  assert.equal(fmtCrudo(0.1234567, 1), '0.123457', 'como máximo 6 decimales');
});

/* ---------- 12. ICOPE: catálogo de la evaluación detallada ---------- */

test('ICOPE detallada: MMSE, GPCOG y MUST como alternativas disponibles, sin «Próximamente» obsoleto', () => {
  for (const d of DOMINIOS_ICOPE) {
    assert.equal('planeadas' in d.detallada, false, `${d.id}: lista manual de planeadas`);
    const op = opcionesDetallada(d);
    assert.deepEqual(op.proximamente, [], `${d.id}: todo lo citado existe en el catálogo`);
    for (const x of [...op.elegir, ...op.alternativas, ...op.complementarios, ...op.antes]) assert.ok(porId[x.id], `${d.id}: ${x.id}`);
  }
  const cog = opcionesDetallada(dominioIcope('cognicion'));
  assert.deepEqual(cog.alternativas.map((x) => x.id), ['mmse', 'gpcog']);
  assert.ok(cog.alternativas.every((x) => x.nota && x.nota.length > 40), 'contexto y requisitos de cada alternativa');
  assert.match(cog.alternativas[0].nota, /formato oficial/);
  assert.match(cog.alternativas[1].nota, /informante/);
  assert.deepEqual(opcionesDetallada(dominioIcope('vitalidad')).alternativas.map((x) => x.id), ['must']);
  // Disponibilidad derivada del catálogo: un instrumento inexistente se lista como próximamente.
  const ficticio = { detallada: { elegir: ['minicog', 'inexistente'], alternativas: [{ id: 'otra', nombre: 'Otra herramienta' }] } };
  const op = opcionesDetallada(ficticio);
  assert.deepEqual(op.elegir.map((x) => x.id), ['minicog']);
  assert.deepEqual(op.proximamente, ['inexistente', 'Otra herramienta']);
  for (const d of DOMINIOS) assert.ok(!d.planeadas.some((p) => /MMSE|GPCOG|MUST/.test(p)), `${d.id}: planeada que ya existe`);
});

/* ---------- 13. Discordancia entre tamizajes cognitivos ---------- */

const HOY = '2026-10-12';
const minicog2 = () => guardado('minicog', resp('minicog', { palabras: '2 palabras', reloj: 'Anormal o se rehúsa' }), { fecha: '2026-10-12' });
const icopeCogConservado = () => guardado('icope-cog', resp('icope-cog', { filtro: 'No', fecha: 'Responde correctamente', lugar: 'Responde correctamente', palabras: 'Recuerda las 3' }), { fecha: '2026-10-12' });
const valoracionCon = (resultados) => ({ resultados, paciente: { sexo: 'Mujer', edad: 80 }, episodio: { codigo: 'HU-PRUEBA', abierto: '2026-10-01' } });

test('ICOPE: Mini-Cog 2/5 y cognición ICOPE conservada el mismo día muestran la discordancia sin cambiar el estado', () => {
  const mc = minicog2();
  const ic = icopeCogConservado();
  assert.equal(mc.puntaje, 2);
  assert.equal(mc.hallazgo, true);
  assert.equal(ic.hallazgo, false);
  const v = valoracionCon([ic, mc]);
  const x = estadoDominio(dominioIcope('cognicion'), v, HOY);
  assert.equal(x.estado, 'conservado', 'no cambia el estado del dominio');
  assert.equal(x.necesidad.tipo, 'ninguna', 'no cambia el algoritmo ICOPE');
  assert.ok(x.discordancia);
  assert.match(x.discordancia.texto, /^El tamizaje básico ICOPE está conservado, pero existe un tamizaje cognitivo positivo en este episodio/);
  assert.match(x.discordancia.texto, /Mini-Cog, 12\/10\/2026: 2\/5/);
  assert.match(x.discordancia.texto, /12\/10\/2026/, 'muestra la fecha');
  assert.match(x.discordancia.texto, /Revisar la discordancia y considerar evaluación adicional/);
  assert.doesNotMatch(x.discordancia.texto, /demencia|diagn/i, 'sin diagnóstico automático');
  // Coherencia entre panel (estado), resumen ICOPE, informe ICOPE, nota y avisos de la valoración.
  assert.match(textoIcope(v, HOY), /Cognición: conservado .*aviso: el tamizaje básico ICOPE está conservado.*Mini-Cog, 12\/10\/2026: 2\/5/);
  assert.match(resumenIcope(v, HOY), /Aviso en cognición/);
  assert.match(textoInforme('icope', v, { porId, dominios: DOMINIOS, hoy: HOY }), /Mini-Cog, 12\/10\/2026: 2\/5 \(probable deterioro cognitivo\)/);
  assert.ok(hallazgosYSugerencias(v, porId).avisos.some((a) => /tamizaje cognitivo positivo/.test(a)));
  assert.match(notaValoracion(v, porId, DOMINIOS, new Date(`${HOY}T12:00:00`), 'completa'), /Verificar: El tamizaje básico ICOPE está conservado/);
  assert.match(textoInforme('completa', v, { porId, dominios: DOMINIOS, hoy: HOY }), /tamizaje cognitivo positivo en este episodio/);
});

test('ICOPE: sin discordancia si el Mini-Cog es negativo, si ICOPE está alterado o si el Mini-Cog no fue evaluable', () => {
  const negativo = guardado('minicog', EJEMPLOS.minicog(), { fecha: '2026-10-12' });
  assert.equal(discordanciaCognitiva(valoracionCon([icopeCogConservado(), negativo]), porId), null);
  const alterado = guardado('icope-cog', EJEMPLOS['icope-cog'](), { fecha: '2026-10-12' });
  assert.equal(discordanciaCognitiva(valoracionCon([alterado, minicog2()]), porId), null);
  assert.equal(estadoDominio(dominioIcope('cognicion'), valoracionCon([alterado, minicog2()]), HOY).discordancia, null);
  const ne = { ...minicog2(), noEvaluable: 'Se rehusó', hallazgo: false };
  assert.equal(discordanciaCognitiva(valoracionCon([icopeCogConservado(), ne]), porId), null);
  assert.equal(discordanciaCognitiva(valoracionCon([minicog2()]), porId), null, 'sin ICOPE no hay discordancia');
});

/* ---------- 14 y 17. VPO: fuentes verificables ---------- */

test('VPO: cada diagrama declara documento, páginas y origen (lineamiento, guía o adaptación propia)', () => {
  assert.match(DOCUMENTO_VPO.version, /agosto 2026/);
  assert.match(DOCUMENTO_VPO.version, /23 páginas/);
  assert.match(DOCUMENTO_VPO.huella, /^SHA-256 9cff2109/);
  assert.match(DOCUMENTO_VPO.enlace, /Sin enlace público/);
  assert.deepEqual(Object.keys(ORIGENES_VPO), ['lineamiento', 'guia', 'propia']);
  for (const d of DIAGRAMAS) {
    assert.ok(d.fuentes?.length, `${d.id}: sin fuentes`);
    for (const f of d.fuentes) {
      assert.ok(ORIGENES_VPO[f.origen], `${d.id}: origen ${f.origen}`);
      if (f.origen === 'lineamiento') assert.match(f.paginas, /^\d+( (y|a) \d+)?$/, `${d.id}: páginas de «${f.texto}»`);
    }
  }
  assert.ok(DIAGRAMAS.find((d) => d.id === 'cardio').fuentes.some((f) => f.origen === 'guia' && /AHA\/ACC 2024/.test(f.texto)));
  assert.equal(FUENTE_LISTA_VPO.paginas, '5 y 6');
});

/* ---------- 16. Episodios archivados ---------- */

test('Seguimiento: «Episodios archivados» con el estado de cada uno; sin «episodios cerrados» en la interfaz', () => {
  const fuente = ['../js/vistas/seguimiento.js', '../js/almacen.js', '../js/vistas/acerca.js'].map((f) => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');
  assert.doesNotMatch(fuente, /[Ee]pisodios cerrados/);
  assert.match(fuente, /Episodios archivados/);
  assert.match(fuente, /Abierto, sin cierre/);
  assert.match(fuente, /con el estado que traía el archivo/);
});

/* ---------- 18. Dolor en la ruta hospitalaria ---------- */

test('Ruta hospitalaria: elección explícita entre escala numérica/EVA y PAINAD', () => {
  const h = RUTAS.find((r) => r.id === 'hospital');
  const nucleo = pasosDe(h).filter((p) => !p.plan && !p.complementario);
  const dolor = nucleo.filter((p) => p.eleccion === 'dolor');
  assert.deepEqual(dolor.map((p) => p.id), ['dolorint', 'painad'], 'la valoración autorreferida va primero');
  assert.match(dolor[0].nota, /puede comunicar su dolor/);
  assert.match(dolor[1].nota, /no puede comunicarlo/);
  assert.ok(!pasosDe(h).some((p) => p.complementario && ['dolorint', 'painad'].includes(p.id)), 'ninguna queda relegada a complementaria');
  assert.match(h.elecciones.dolor.nota, /No es necesario aplicar ambas/);

  almacen.borrarTodo();
  let p = progresoRuta(h);
  const total = p.total;
  assert.equal(total, nucleo.length - 1, 'el grupo de dolor cuenta como un solo paso');
  assert.equal(p.pendientes.filter((x) => x.eleccion === 'dolor').length, 1, 'un solo pendiente para el grupo');
  almacen.guardarResultado(guardado('dolorint', EJEMPLOS.dolorint(), { fecha: '2026-10-12' }));
  const pasos = pasosConEstado(h);
  assert.equal(pasos.find((x) => x.id === 'dolorint' && !x.complementario).estado, 'completo');
  assert.equal(pasos.find((x) => x.id === 'painad' && !x.complementario).estado, 'alternativa', 'PAINAD no es obligatorio si ya hay dolor autorreferido');
  p = progresoRuta(h);
  assert.equal(p.completos, 1);
  assert.ok(!p.pendientes.some((x) => x.eleccion === 'dolor'));
  assert.notEqual(siguientePendiente(h)?.id, 'painad');
  // Omitir la autorreferida (no puede comunicarse) deja pendiente el grupo hasta registrar PAINAD.
  almacen.borrarTodo();
  almacen.alternarOmitida('hospital', 'dolorint', true);
  p = progresoRuta(h);
  assert.equal(p.omitidos, 0, 'omitir una opción no omite el grupo');
  assert.equal(p.pendientes.find((x) => x.eleccion === 'dolor').id, 'painad');
  almacen.guardarResultado(guardado('painad', EJEMPLOS.painad(), { momento: 'ingreso', fecha: '2026-10-12' }));
  assert.equal(progresoRuta(h).completos, 1);
  assert.ok(tiempoRuta(h).max > 0);
  almacen.borrarTodo();
});
