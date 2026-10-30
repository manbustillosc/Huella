// Versión 2.12: resultado en una frase sencilla con el porcentaje de riesgo (ASA, RCRI, Gupta, ARISCAT, Caprini,
// riesgo del procedimiento, DASI y ACS NSQIP) y resumen de la ruta prequirúrgica. Datos ficticios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcular, fraseDe, resumenDe } from '../js/motor.js';
import { almacen } from '../js/almacen.js';
import { RUTAS, pasosDe } from '../js/rutas.js';
import { frasesRuta } from '../js/vistas/rutas-estado.js';
import { MORTALIDAD_ASA } from '../escalas/dominios-extra.js';
import { riesgoGupta, fmtRiesgo, GUPTA_CIRUGIA } from '../escalas/prequirurgicas.js';
import { porId, resp, calc, guardado, EJEMPLOS } from './ayuda.mjs';

const textoAsa = (n) => porId.asa.campos[0].opciones[n - 1].texto;
const asa = (n, urgencia = 'No') => calc('asa', { clase: textoAsa(n), urgencia });

test('ASA: cada clase entrega su mortalidad perioperatoria publicada en una frase', () => {
  assert.deepEqual(MORTALIDAD_ASA, { I: '0 a 0.3', II: '0.3 a 1.4', III: '1.8 a 5.4', IV: '7.8 a 25.9', V: '9.4 a 57.8' });
  const esperadas = [
    'ASA I (paciente sano): 0 a 0.3 % de riesgo de mortalidad perioperatoria.',
    'ASA II (enfermedad sistémica leve): 0.3 a 1.4 % de riesgo de mortalidad perioperatoria.',
    'ASA III (enfermedad sistémica grave): 1.8 a 5.4 % de riesgo de mortalidad perioperatoria.',
    'ASA IV (enfermedad sistémica grave que amenaza la vida de forma constante): 7.8 a 25.9 % de riesgo de mortalidad perioperatoria.',
    'ASA V (moribundo): 9.4 a 57.8 % de riesgo de mortalidad perioperatoria.',
    'ASA VI (muerte encefálica): no aplica un riesgo de mortalidad perioperatoria.',
  ];
  esperadas.forEach((f, i) => {
    const r = asa(i + 1);
    assert.equal(fraseDe(porId.asa, r), f);
    assert.equal(resumenDe(porId.asa, r), f, 'la nota usa la misma frase');
  });
  const urg = asa(2, 'Sí: el retraso aumentaría la amenaza para la vida o un órgano');
  assert.equal(fraseDe(porId.asa, urg), 'ASA IIE (enfermedad sistémica leve): 0.3 a 1.4 % de riesgo de mortalidad perioperatoria. Cirugía de urgencia («E»): el riesgo es mayor.');
  const t = asa(3).detalles[0];
  assert.equal(t.filas.length, 5);
  assert.deepEqual(t.filas[2], ['ASA III (esta persona)', 'Enfermedad sistémica grave', '1.8 a 5.4 %']);
  assert.match(porId.asa.bandas[1].texto, /Mortalidad perioperatoria publicada para la clase II: 0.3 a 1.4 %/);
  assert.ok(porId.asa.notas.some((n) => /Daabiss \(2011\) cita 1.8 a 4.5 %/.test(n)));
  assert.ok(porId.asa.referencias.some((r) => r.doi === '10.1093/bja/77.2.217'));
});

test('RCRI, ARISCAT, Caprini, riesgo del procedimiento y DASI: frase con el riesgo y su fuente', () => {
  const rcri = calcular(porId.rcri, resp('rcri', { cirugia: 'No', isquemica: 'No', ic: 'No', evc: 'No', insulina: 'No', creatinina: 'No' }));
  assert.equal(fraseDe(porId.rcri, rcri), 'RCRI 0 puntos, clase I, riesgo bajo: 0.4 % de complicaciones cardiacas mayores (infarto, edema pulmonar, fibrilación ventricular o paro cardiaco, o bloqueo AV completo; Lee, 1999) y 3.9 % de muerte, infarto o paro cardiaco a 30 días (recalibración canadiense, 2017). Sin factores de riesgo.');
  const ar = calcular(porId.ariscat, EJEMPLOS.ariscat());
  assert.match(fraseDe(porId.ariscat, ar), /^ARISCAT \d+ puntos?: riesgo (bajo|intermedio|alto) de complicaciones pulmonares intrahospitalarias \((3\.4|13\.0|38\.0) % en la validación europea PERISCOPE\)\.$/);
  const capEj = calcular(porId.caprini, EJEMPLOS.caprini());
  assert.equal(fraseDe(porId.caprini, capEj), 'Caprini 8 puntos: riesgo alto de tromboembolia venosa (alrededor de 6 % sin profilaxis, según la guía del ACCP 2012).');
  for (const [i, riesgo] of [[1, 'menos de 1 %'], [2, '1 a 5 %'], [3, 'más de 5 %']]) {
    const r = calcular(porId.riesgoqx, { categoria: i - 1 });
    assert.match(fraseDe(porId.riesgoqx, r), new RegExp(`\\(ESC 2022\\): ${riesgo} de riesgo de muerte cardiovascular, infarto o EVC a 30 días\\.$`));
  }
  const dasi = calcular(porId.dasi, EJEMPLOS.dasi());
  assert.match(fraseDe(porId.dasi, dasi), /^DASI [\d.]+ \([\d.]+ MET estimados\): capacidad funcional/);
});

test('Gupta (MICA): ecuación publicada, umbral de 1 % y frase sencilla', () => {
  // Ejemplo publicado de calculadoras en línea: 72 años, ASA III, parcialmente dependiente, creatinina >1.5, cirugía aórtica.
  const p = riesgoGupta({ edad: 72, asa: -1.92, funcional: 0.65, creatinina: 0.61, cirugia: 1.6 });
  assert.equal(p.toFixed(2), '5.37');
  assert.equal(GUPTA_CIRUGIA.length, 21);
  assert.equal(GUPTA_CIRUGIA.find(([id]) => id === 'hernia')[2], 0, 'la hernia es la referencia');
  const r = calcular(porId.gupta, EJEMPLOS.gupta());
  assert.equal(r.mostrar, '0.81');
  assert.equal(r.banda.id, 'bajo');
  assert.equal(fraseDe(porId.gupta, r), 'Gupta (MICA): 0.81 % de riesgo de infarto o paro cardiaco perioperatorio (hasta 30 días), riesgo bajo (umbral de 1 %, ACC/AHA). Cirugía: ortopédica y de extremidades (no vascular).');
  const alto = calc('gupta', { edad: 72, asa: 'ASA III', funcional: 'Parcialmente dependiente', creatinina: 'Sí', cirugia: 'Aórtica' });
  assert.equal(alto.mostrar, '5.4');
  assert.equal(alto.banda.id, 'elevado');
  assert.equal(alto.banda.hallazgo, true);
  assert.deepEqual([fmtRiesgo(0.004), fmtRiesgo(0.183), fmtRiesgo(12.34)], ['menos de 0.01', '0.18', '12.3']);
  // Reutiliza la ASA y la creatinina guardadas.
  const gAsa = guardado('asa', resp('asa', { clase: textoAsa(4), urgencia: 'No' }));
  const vAsa = porId.gupta.vinculos.find((x) => x.escala === 'asa');
  assert.deepEqual(vAsa.aplicar(gAsa), { asa: 3 });
  assert.notEqual(vAsa.disponible(guardado('asa', resp('asa', { clase: textoAsa(6), urgencia: 'No' }))), true, 'ASA VI no aplica');
  const gCk = guardado('ckdepi', resp('ckdepi', { creatinina: 150, creatinina_u: 'umol', edad: 78, sexo: 'Hombre' }));
  const vCk = porId.gupta.vinculos.find((x) => x.escala === 'ckdepi');
  assert.equal(vCk.describir(gCk), 'Creatinina 1.7 mg/dL (mayor de 1.5)');
  assert.deepEqual(vCk.aplicar(gCk), { creatinina: 1 });
});

test('ACS NSQIP: solo registra los porcentajes de la calculadora oficial', () => {
  const r = calcular(porId.nsqip, EJEMPLOS.nsqip());
  assert.equal(r.completo, true);
  assert.equal(r.mostrar, '1.2');
  assert.equal(fraseDe(porId.nsqip, r), 'ACS NSQIP (calculadora oficial): muerte 1.2 %; complicación grave 8.5 %; cualquier complicación 11.3 %; neumonía 1.4 %; complicación cardiaca 0.9 %; tromboembolia venosa 1.1 %; estancia prevista 4.5 días.');
  assert.equal(porId.nsqip.registro, true);
  const vacio = calcular(porId.nsqip, { estancia: '3' });
  assert.equal(vacio.completo, false, 'pide al menos un porcentaje');
  assert.match(porId.nsqip.licencia.texto, /no reproduce ni aproxima su modelo/);
});

test('Sin frase en instrumentos sin riesgo publicado ni en resultados incompletos o no evaluables', () => {
  assert.equal(fraseDe(porId.barthel, calcular(porId.barthel, EJEMPLOS.barthel())), null);
  assert.equal(fraseDe(porId.asa, calcular(porId.asa, {})), null);
  assert.equal(fraseDe(porId.asa, { noEvaluable: 'x', completo: true }), null);
});

test('Ruta prequirúrgica: ASA, Gupta y Caprini en el núcleo, ACS NSQIP complementaria, y «Resultados en pocas palabras» en el orden de la ruta', () => {
  const preqx = RUTAS.find((r) => r.id === 'preqx');
  const nucleo = pasosDe(preqx).filter((p) => !p.complementario).map((p) => p.id);
  assert.deepEqual(nucleo.slice(0, 6), ['asa', 'rcri', 'gupta', 'dasi', 'ariscat', 'caprini'], 'ASA, Gupta y Caprini en el núcleo, como el médico los usa');
  assert.ok(pasosDe(preqx).some((p) => p.complementario && p.id === 'nsqip'));
  almacen.borrarTodo();
  for (const id of ['caprini', 'gupta', 'asa', 'rcri', 'barthel']) almacen.guardarResultado(guardado(id, EJEMPLOS[id](), { fecha: '2026-10-30' }));
  const f = frasesRuta(preqx);
  assert.deepEqual(f.map((x) => x.id), ['asa', 'rcri', 'gupta', 'caprini'], 'solo los que tienen frase, en el orden de la ruta');
  assert.match(f[0].texto, /^ASA III \(enfermedad sistémica grave\): 1.8 a 5.4 %/);
  almacen.borrarTodo();
});

test('Nota completa: la interpretación de los riesgos prequirúrgicos es su frase sencilla', async () => {
  const { notaValoracion } = await import('../js/nota.js');
  const { DOMINIOS } = await import('../js/dominios.js');
  const v = { resultados: ['asa', 'gupta', 'caprini'].map((id) => guardado(id, EJEMPLOS[id](), { fecha: '2026-10-30' })) };
  const t = notaValoracion(v, porId, DOMINIOS, new Date('2026-10-30T12:00:00'), 'completa');
  const interp = t.slice(t.indexOf('2. INTERPRETACIÓN'), t.indexOf('3. CAMBIOS'));
  assert.match(interp, /- ASA III \(enfermedad sistémica grave\): 1.8 a 5.4 % de riesgo de mortalidad perioperatoria\./);
  assert.match(interp, /- Gupta \(MICA\): 0.81 % de riesgo de infarto o paro cardiaco perioperatorio/);
  assert.match(interp, /- Caprini 8 puntos: riesgo alto de tromboembolia venosa \(alrededor de 6 % sin profilaxis/);
});
