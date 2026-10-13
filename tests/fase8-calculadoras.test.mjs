// Calculadora de infusiones y conversión de unidades. Desde 2.9.1 (auditoría de 2.9.0): perfiles de dosis por indicación
// con fuente, validación de entradas, familias de unidades, titulación sin respaldo inventado y fichas calculadas con
// las mismas funciones que la calculadora.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FARMACOS, FAMILIAS, FUENTES_INFUSION, REVISION_INFUSIONES, LIMITES_ENTRADA, concentracion, velocidadMlH,
  dosisDesdeVelocidad, convertirDosis, bolo, pasosTitulacion, tablaTitulacion, clasificarDosis, leerUnidadDosis,
  textoConcentracion, leerEntrada, familiaDeUnidad, farmacoDe, concDe, textoPauta, dosisPauta, pautaNoAplica, ejemplosPerfil,
  volumenDeDosis, fmtNum,
} from '../js/infusiones.js';
import {
  convertirLineal, cAF, fAC, contenidoSal, convertirIon, ANALITOS, convertirVelocidad, mlhAGotas, gotasAMlh, proporcionAMgMl, fmtConv,
} from '../js/unidades.js';
import { HERRAMIENTAS } from '../js/herramientas.js';
import { RUTAS } from '../js/rutas.js';
import { readFileSync } from 'node:fs';

const cerca = (a, b, tol = 1e-6) => assert.ok(a != null && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
const prep = (id, i = 0) => concDe(farmacoDe(id).preparaciones[i]);
const perfil = (id, p) => farmacoDe(id).infusiones.find((x) => x.id === p);
const pauta = (id, p) => farmacoDe(id).pautas.find((x) => x.id === p);
// Todo el texto de un medicamento fuera del apartado histórico.
const textoVigente = (f) => JSON.stringify({ ...f, historica: undefined });

test('infusiones: dosis ↔ velocidad, ida y vuelta, con y sin peso', () => {
  const ne = prep('norepinefrina');
  assert.deepEqual(ne, { valor: 80, base: 'mcg', familia: 'masa' });
  cerca(velocidadMlH(0.1, 'mcg/kg/min', 70, ne), 5.25);
  cerca(dosisDesdeVelocidad(5.25, 'mcg/kg/min', 70, ne), 0.1);
  cerca(velocidadMlH(10, 'mcg/min', null, ne), 7.5);
  assert.equal(velocidadMlH(0.1, 'mcg/kg/min', null, ne), null, 'sin peso no calcula dosis por kg');
  const vaso = prep('vasopresina');
  cerca(velocidadMlH(0.03, 'UI/min', null, vaso), 4.5);
  cerca(velocidadMlH(2, 'mUI/kg/min', 50, vaso), 15);
  cerca(velocidadMlH(0.03, 'mg/kg/h', 50, prep('midazolam')), 5);
  assert.deepEqual(leerUnidadDosis('mcg/kg/min'), { cantidad: 'mcg', porKg: true, tiempo: 'min', base: 'mcg', factor: 1 });
  assert.equal(textoConcentracion(prep('propofol')), '10 mg/mL (10000 mcg/mL)');
  assert.equal(textoConcentracion(vaso), '0.4 UI/mL (400 mUI/mL)');
});

test('infusiones: cálculo frente a la tabla original (coincidencias y discrepancias documentadas)', () => {
  const v = (id, w, d, i = 0) => velocidadMlH(d, 'mcg/kg/min', w, prep(id, i));
  cerca(v('vecuronio', 50, 0.8), 6); cerca(v('vecuronio', 100, 1.2), 18);
  cerca(v('dobutamina', 50, 2), 2.4); cerca(v('dobutamina', 100, 10), 24);
  cerca(v('rocuronio', 50, 3), 4.5); cerca(v('rocuronio', 50, 8), 12);
  cerca(v('adrenalina', 50, 1), 75);
  cerca(velocidadMlH(0.2, 'mcg/kg/h', 50, prep('dexmedetomidina')), 2.5);
  cerca(velocidadMlH(1.5, 'mcg/kg/h', 100, prep('dexmedetomidina')), 37.5); // impreso: 36
  cerca(v('propofol', 50, 80), 24); // impreso: 48
  cerca(velocidadMlH(0.1, 'mg/kg/h', 50, prep('midazolam')), 16.6667, 1e-4); // impreso: 5
  cerca(v('rocuronio', 100, 3), 9); // impreso: 12
  for (const id of ['propofol', 'midazolam', 'rocuronio', 'adrenalina', 'vasopresina', 'norepinefrina', 'dexmedetomidina']) {
    assert.ok(farmacoDe(id).historica.discrepancia, `${id}: discrepancia documentada en el apartado histórico`);
  }
});

test('infusiones: las fichas muestran los mismos mL/h que la calculadora (una sola función y una sola fuente)', () => {
  const ej = (id, p) => ejemplosPerfil(farmacoDe(id), perfil(id, p));
  assert.equal(ej('propofol', 'hg30').texto, '50 kg: 1.5 a 24 mL/h; 100 kg: 3 a 48 mL/h');
  assert.equal(ej('midazolam', 'sedacion').texto, '50 kg: 3.33 a 16.7 mL/h; 100 kg: 6.67 a 33.3 mL/h');
  assert.equal(ej('rocuronio', 'hg30').texto, '50 kg: 4.5 a 12 mL/h; 100 kg: 9 a 24 mL/h');
  assert.equal(ej('norepinefrina', 'ficha').texto, '6 a 9 mL/h', 'el inicio de la ficha (8 a 12 mcg/min) expresado como dosis');
  assert.equal(ej('vasopresina', 'ssc').texto, '4.5 mL/h', 'dosis fija de 0.03 UI/min con 0.4 UI/mL');
  // Cada ejemplo coincide con velocidadMlH de la misma preparación.
  for (const f of FARMACOS) {
    for (const p of f.infusiones) {
      const e = ejemplosPerfil(f, p);
      if (!e) continue;
      const w = leerUnidadDosis(p.unidad).porKg ? 50 : null;
      const esperado = e.valores.map((x) => fmtNum(velocidadMlH(x, p.unidad, w, concDe(f.preparaciones[0]))));
      for (const x of esperado) assert.ok(e.texto.includes(`${w ? '50 kg: ' : ''}${esperado.join(' a ')} mL/h`), `${f.id}/${p.id}: ${x} en «${e.texto}»`);
    }
  }
});

test('infusiones: sin cifras de mL/h escritas a mano fuera del apartado histórico (p. ej., «iniciar 5 mL/h»)', () => {
  for (const f of FARMACOS) {
    assert.doesNotMatch(textoVigente(f), /mL\/h/, `${f.id}: mL/h escrito a mano`);
  }
  assert.match(farmacoDe('norepinefrina').historica.infusion, /5 mL\/h/, 'el dato original queda solo como histórico');
  assert.equal(perfil('norepinefrina', 'ficha').inicio, 8);
});

test('infusiones: entradas negativas, texto, cero según el campo, infinito y fuera de rango', () => {
  assert.deepEqual(leerEntrada(''), { estado: 'vacio' });
  assert.deepEqual(leerEntrada('  '), { estado: 'vacio' });
  for (const t of ['-1', '-0.03', '−1'.replace('−', '-')]) {
    const r = leerEntrada(t, LIMITES_ENTRADA.dosis);
    assert.equal(r.estado, 'error', t);
    assert.match(r.mensaje, /negativ/);
  }
  for (const t of ['abc', '1e3', 'Infinity', 'NaN', '2..5', '1,2,3', '0x10', '5 mg', '+3']) assert.equal(leerEntrada(t, LIMITES_ENTRADA.dosis).estado, 'error', t);
  assert.equal(leerEntrada('0', LIMITES_ENTRADA.dosis).estado, 'error', 'dosis 0 no es válida');
  assert.equal(leerEntrada('0', LIMITES_ENTRADA.cantidad).estado, 'error', 'cantidad 0 no es válida');
  assert.equal(leerEntrada('0', LIMITES_ENTRADA.volumen).estado, 'error', 'volumen 0 no es válido');
  assert.equal(leerEntrada('0', LIMITES_ENTRADA.peso).estado, 'error', 'peso 0 no es válido');
  assert.deepEqual(leerEntrada('0', LIMITES_ENTRADA.velocidad), { estado: 'ok', valor: 0 }, 'velocidad 0 (bomba detenida) sí es válida');
  assert.deepEqual(leerEntrada('2,5', LIMITES_ENTRADA.dosis), { estado: 'ok', valor: 2.5 });
  assert.deepEqual(leerEntrada('.5', LIMITES_ENTRADA.dosis), { estado: 'ok', valor: 0.5 });
  assert.equal(leerEntrada('400', LIMITES_ENTRADA.peso).estado, 'error');
  assert.equal(leerEntrada('0.5', LIMITES_ENTRADA.peso).estado, 'error');
  assert.equal(leerEntrada('1'.repeat(400), LIMITES_ENTRADA.dosis).estado, 'error', 'un número enorme (Infinity al convertir) no pasa');
});

test('infusiones: preparación inválida y operaciones con null nunca devuelven un número', () => {
  for (const [c, u, v] of [[0, 'mg', 100], [-8, 'mg', 100], [8, 'mg', 0], [8, 'mg', -100], [Infinity, 'mg', 100], [8, 'mg', Infinity], [NaN, 'mg', 100], [8, 'ml', 100], [8, 'mEq', 100], [null, 'mg', 100], ['8', 'mg', 100]]) {
    assert.equal(concentracion(c, u, v), null, `${c} ${u}/${v}`);
  }
  const ne = prep('norepinefrina');
  for (const d of [null, undefined, -1, NaN, Infinity]) {
    assert.equal(velocidadMlH(d, 'mcg/min', null, ne), null, `dosis ${d}`);
    assert.equal(dosisDesdeVelocidad(d, 'mcg/min', null, ne), null, `velocidad ${d}`);
    assert.equal(clasificarDosis(d, 'mcg/kg/min', perfil('norepinefrina', 'hg30')), null, `clasificación ${d}`);
  }
  assert.equal(velocidadMlH(0.1, 'mcg/kg/min', -70, ne), null);
  assert.equal(velocidadMlH(0.1, 'mcg/kg/min', 0, ne), null);
  assert.equal(velocidadMlH(0.1, 'mcg/min', null, null), null, 'sin preparación');
  assert.equal(volumenDeDosis(0.3, 'mg', null), null);
  assert.equal(bolo(1, 'mg', null, ne), null);
});

test('infusiones: las unidades se restringen a la familia del medicamento (masa frente a UI)', () => {
  const ne = prep('norepinefrina');
  assert.equal(velocidadMlH(1, 'UI/min', 70, ne), null, 'norepinefrina con UI: incompatible');
  assert.equal(convertirDosis(1, 'mcg/min', 'UI/min'), null);
  assert.equal(clasificarDosis(1, 'UI/min', perfil('norepinefrina', 'hg30')).estado, 'no_comparable');
  assert.equal(velocidadMlH(0.03, 'mcg/min', null, prep('vasopresina')), null, 'vasopresina con mcg: incompatible');
  for (const f of FARMACOS) {
    for (const p of f.preparaciones) assert.equal(familiaDeUnidad(p.unidad), f.familia, `${f.id}: preparación ${p.texto}`);
    for (const p of f.infusiones) {
      assert.equal(familiaDeUnidad(p.unidad), f.familia, `${f.id}/${p.id}: unidad del perfil`);
      assert.ok(FAMILIAS[f.familia].dosis.includes(p.unidad), `${f.id}/${p.id}: la unidad del perfil se ofrece en el selector`);
    }
  }
  for (const [k, fam] of Object.entries(FAMILIAS)) {
    for (const u of fam.dosis) assert.equal(familiaDeUnidad(u), k, u);
    for (const u of fam.cantidades) assert.equal(familiaDeUnidad(u), k, u);
  }
  assert.equal(farmacoDe('vasopresina').familia, 'actividad');
});

test('infusiones: la tabla de titulación exige un intervalo validado (sin respaldo inventado)', () => {
  for (const [a, b] of [[0, 1], [1, 1], [2, 1], [NaN, 2], [-1, 2], [1, Infinity], [null, 5]]) assert.deepEqual(pasosTitulacion(a, b), [], `${a}–${b}`);
  assert.deepEqual(pasosTitulacion(0.01, 2).slice(0, 5), [0.01, 0.015, 0.02, 0.03, 0.05]);
  assert.deepEqual(pasosTitulacion(5, 80), [5, 10, 20, 30, 40, 50, 60, 70, 80]);
  const ne = prep('norepinefrina');
  assert.equal(tablaTitulacion(null, 70, ne), null, 'sin perfil no hay tabla');
  assert.equal(tablaTitulacion(perfil('norepinefrina', 'ficha'), 70, ne), null, 'perfil sin máximo: no se inventa uno');
  const t = tablaTitulacion(perfil('propofol', 'uci'), 70, prep('propofol'));
  assert.equal(t[0].dosis, 5); assert.equal(t.at(-1).dosis, 50);
  cerca(t.at(-1).mlh, 21);
  assert.equal(tablaTitulacion(perfil('propofol', 'uci'), null, prep('propofol')), null, 'perfil por kg sin peso');
  const vaso = prep('vasopresina');
  assert.equal(tablaTitulacion(perfil('vasopresina', 'ssc'), null, vaso), null, 'dosis fija: no se titula');
  assert.equal(tablaTitulacion(perfil('vasopresina', 'ssc'), 70, vaso), null, 'dosis fija: tampoco con peso');
  assert.equal(tablaTitulacion(perfil('vasopresina', 'ficha-septico'), null, vaso).length > 2, true, 'perfil en UI/min no requiere peso');
  assert.equal(tablaTitulacion(perfil('propofol', 'uci'), 70, vaso), null, 'familias distintas');
});

test('infusiones: vasopresina por indicación; la dosis fija no se clasifica con un rango por kg ni depende del peso', () => {
  const v = farmacoDe('vasopresina');
  assert.deepEqual(v.infusiones.map((p) => p.id), ['ssc', 'ficha-septico', 'ficha-poscardiotomia']);
  assert.ok(v.infusiones.every((p) => !leerUnidadDosis(p.unidad).porKg), 'ningún perfil vigente es por kg');
  const ssc = perfil('vasopresina', 'ssc');
  assert.equal(clasificarDosis.length, 3, 'la clasificación no recibe el peso');
  assert.equal(clasificarDosis(0.03, 'UI/min', ssc).estado, 'fija');
  assert.equal(clasificarDosis(1.8, 'UI/h', ssc).estado, 'fija', '1.8 UI/h = 0.03 UI/min');
  assert.equal(clasificarDosis(0.04, 'UI/min', ssc).estado, 'distinta_fija');
  assert.equal(clasificarDosis(0.5, 'mUI/kg/min', ssc).estado, 'no_comparable', 'mUI/kg/min no se compara con una dosis fija');
  assert.equal(clasificarDosis(0.03, 'UI/min', perfil('vasopresina', 'ficha-septico')).estado, 'dentro');
  assert.equal(clasificarDosis(0.08, 'UI/min', perfil('vasopresina', 'ficha-septico')).estado, 'encima');
  // Vasopresina −1 UI/min: error en la entrada y ningún cálculo.
  assert.equal(leerEntrada('-1', LIMITES_ENTRADA.dosis).estado, 'error');
  assert.equal(velocidadMlH(-1, 'UI/min', null, prep('vasopresina')), null);
  assert.equal(clasificarDosis(-1, 'UI/min', ssc), null);
});

test('infusiones: adrenalina separa paro, anafilaxia IM y bolos especializados', () => {
  const a = farmacoDe('adrenalina');
  const paro = pauta('adrenalina', 'paro');
  assert.deepEqual(paro.dosis, { min: 1, max: 1, unidad: 'mg' });
  assert.match(paro.via, /IV\/IO/);
  assert.match(textoPauta(a, paro), /^1 mg = 1 mL de 1 mg\/mL/);
  const ana = pauta('adrenalina', 'anafilaxia');
  assert.deepEqual(ana.dosis, { min: 0.3, max: 0.5, unidad: 'mg' });
  assert.match(ana.via, /^IM/);
  assert.match(ana.maximo, /0\.5 mg/);
  assert.match(textoPauta(a, ana), /^0\.3 a 0\.5 mg = 0\.3 a 0\.5 mL de 1 mg\/mL/);
  assert.equal(pautaNoAplica(ana, 20) != null, true, 'menos de 30 kg: usar la pauta pediátrica');
  const ped = pauta('adrenalina', 'anafilaxia-ped');
  cerca(dosisPauta(ped, 20).max, 0.2);
  cerca(dosisPauta(ped, 29).max, 0.29);
  assert.equal(pautaNoAplica(ped, 40) != null, true);
  const push = pauta('adrenalina', 'push');
  assert.equal(push.especializada, true);
  assert.match(textoPauta(a, push), /0\.005 a 0\.02 mg = 0\.5 a 2 mL/);
  for (const p of a.pautas) assert.ok(p.indicacion && p.via && p.dosis.unidad && p.fuente && p.poblacion, p.id);
  // No hay una instrucción principal ambigua que luego se corrija con una nota.
  assert.doesNotMatch(textoVigente(a), /0\.5 a 1 mL IM\/IV/);
});

test('infusiones: terlipresina sin pauta de choque y con indicaciones, contraindicaciones y advertencias de la ficha', () => {
  const t = farmacoDe('terlipresina');
  assert.ok(t.pautas.every((p) => !/choque/i.test(p.indicacion)), 'sin pauta de choque');
  assert.deepEqual(t.pautas.map((p) => p.id), ['variceal', 'shr']);
  const v = pauta('terlipresina', 'variceal');
  assert.deepEqual([45, 50, 70, 71].map((w) => dosisPauta(v, w).max), [1, 1.5, 1.5, 2]);
  assert.ok(t.contraindicaciones.length >= 2);
  assert.ok(t.advertencias.some((x) => /SSC 2026/.test(x) && /choque séptico/.test(x)));
  assert.ok(t.advertencias.some((x) => /respiratoria/.test(x)));
});

test('infusiones: sedantes con advertencias corregidas (diazepam, propofol, dexmedetomidina)', () => {
  const dz = farmacoDe('diazepam');
  assert.doesNotMatch(textoVigente(dz), /mínima/);
  assert.doesNotMatch(textoVigente(dz), /50 ?%/, 'sin regla universal de reducir 50 %');
  assert.ok(dz.advertencias.some((x) => /apnea/.test(x) && /reserva pulmonar/.test(x)));
  assert.ok(dz.advertencias.some((x) => /opioides/.test(x)));
  assert.ok(dz.ajustes.some((x) => /mayores/.test(x)));
  const pr = farmacoDe('propofol');
  assert.ok(pr.infusiones.some((p) => /Sedación/.test(p.indicacion)) && pr.pautas.some((p) => /Inducción/.test(p.indicacion)), 'inducción y sedación separadas');
  const mayor = pauta('propofol', 'induccion-mayor');
  assert.deepEqual([mayor.dosis.min, mayor.dosis.max], [1, 1.5]);
  assert.match(mayor.poblacion, /ASA III–IV/);
  assert.ok(farmacoDe('dexmedetomidina').ajustes.some((x) => /[Hh]epat/.test(x) && /reducir/.test(x)));
  assert.equal(clasificarDosis(70, 'mcg/kg/min', perfil('propofol', 'uci')).estado, 'encima');
  assert.match(clasificarDosis(70, 'mcg/kg/min', perfil('propofol', 'uci')).texto, /4 mg\/kg\/h/);
});

test('infusiones: cada perfil y pauta declara fuente, indicación y población; cada ficha, fecha de revisión', () => {
  assert.match(REVISION_INFUSIONES, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(FARMACOS.length, 12);
  for (const f of FARMACOS) {
    assert.ok(f.efectos && f.fuentes.length && f.historica, f.id);
    for (const k of f.fuentes) assert.ok(FUENTES_INFUSION[k], `${f.id}: fuente ${k}`);
    for (const x of [...f.infusiones, ...f.pautas, ...f.preparaciones]) assert.ok(FUENTES_INFUSION[x.fuente], `${f.id}: fuente de ${x.id || x.texto}`);
    for (const x of [...f.infusiones, ...f.pautas]) assert.ok(x.indicacion && x.poblacion, `${f.id}/${x.id}`);
    for (const p of f.infusiones) assert.ok(p.fija != null || (p.max > p.min) || p.inicio != null, `${f.id}/${p.id}: intervalo, dosis fija o inicio`);
    if (!f.infusiones.length) assert.ok(f.sinInfusion, `${f.id}: explica por qué no hay infusión`);
    if (!f.pautas.length) assert.ok(f.sinBolo, `${f.id}: explica por qué no hay dosis única`);
  }
  for (const k of Object.keys(FUENTES_INFUSION)) assert.ok(['ficha', 'guia', 'institucional'].includes(FUENTES_INFUSION[k].tipo), k);
});

test('unidades: masa, temperatura, goteo, proporciones y velocidad de dosis', () => {
  const m = convertirLineal('masa', 1, 'g');
  assert.equal(m.find((r) => r.unidad.id === 'mg').valor, 1000);
  cerca(m.find((r) => r.unidad.id === 'mcg').valor, 1e6);
  cerca(convertirLineal('concentracion', 0.9, 'porcentaje').find((r) => r.unidad.id === 'mg/mL').valor, 9);
  cerca(convertirLineal('presion', 10, 'cmH2O').find((r) => r.unidad.id === 'mmHg').valor, 7.35559);
  cerca(cAF(37), 98.6); cerca(fAC(212), 100);
  cerca(mlhAGotas(120, 20), 40); cerca(gotasAMlh(40, 20), 120); cerca(mlhAGotas(60, 60), 60);
  assert.equal(proporcionAMgMl(1000), 1); assert.equal(proporcionAMgMl(200000), 0.005);
  const vel = convertirVelocidad(0.1, 'mcg/kg/min', 70);
  cerca(vel.find((r) => r.unidad === 'mcg/min').valor, 7);
  cerca(vel.find((r) => r.unidad === 'mg/h').valor, 0.42);
  assert.ok(convertirVelocidad(0.1, 'mcg/kg/min').every((r) => r.unidad.includes('/kg/')), 'sin peso solo convierte entre unidades por kg');
  assert.equal(fmtConv(101.3), '101.3'); assert.equal(fmtConv(0.000001), '0.000001');
});

test('unidades: electrolitos y laboratorio con masas molares', () => {
  cerca(contenidoSal('KCl').mEq, 13.4138, 1e-4);
  cerca(contenidoSal('NaCl').mEq, 17.1116, 1e-4);
  cerca(contenidoSal('NaHCO3').mEq, 11.9038, 1e-4);
  cerca(contenidoSal('gluconatoCa').mEq, 4.6472, 1e-4);
  cerca(contenidoSal('gluconatoCa').mgIon, 93.125, 1e-3);
  cerca(contenidoSal('CaCl2').mgIon, 272.62, 1e-3);
  cerca(contenidoSal('MgSO4').mEq, 8.1146, 1e-4);
  const ca = convertirIon('Ca', 2, 'mEq');
  cerca(ca.mmol, 1); cerca(ca.mg, 40.078);
  const a = (id) => ANALITOS.find((x) => x.id === id).factor;
  cerca(100 * a('glucosa'), 5.5506, 1e-4);
  cerca(1 * a('creatinina'), 88.42);
  cerca(10 * a('calcio'), 2.495, 1e-3);
});

test('integración: herramientas en Calculadoras y en la valoración hospitalaria, y en la caché', () => {
  assert.equal(HERRAMIENTAS[0].id, 'medicacion');
  for (const id of ['infusiones', 'unidades']) {
    const h = HERRAMIENTAS.find((x) => x.id === id);
    assert.equal(h.dominio, 'calculadoras');
    assert.ok(RUTAS.find((r) => r.id === 'calculadoras').herramientas.some((x) => x.id === id), id);
  }
  assert.ok(RUTAS.find((r) => r.id === 'hospital').herramientas.some((x) => x.id === 'infusiones'));
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  for (const f of ['./js/infusiones.js', './js/unidades.js', './js/vistas/infusiones.js', './js/vistas/unidades.js']) assert.ok(sw.includes(`'${f}'`), f);
});
