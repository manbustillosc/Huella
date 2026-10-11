// Fase 2, módulo D: STOPP/START v3, Beers 2023 y registro de medicamentos.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMINIOS } from '../js/dominios.js';
import { RUTAS } from '../js/rutas.js';
import { notaValoracion } from '../js/nota.js';
import {
  STOPP, START, CRITERIOS, BEERS, normalizarMedicamento, resumenMedicacion, partesNota, textoRevision, textoRenal, vacia,
} from '../js/medicacion.js';
import { HERRAMIENTAS } from '../js/herramientas.js';
import { porId, guardado, EJEMPLOS } from './ayuda.mjs';

const fecha = new Date(2026, 9, 10);

test('STOPP/START v3: 133 STOPP y 57 START organizados por sistemas, con las secciones del apéndice 1', () => {
  const n = (xs) => xs.reduce((s, x) => s + x.criterios.length, 0);
  assert.equal(n(STOPP), 133);
  assert.equal(n(START), 57);
  assert.deepEqual(STOPP.map((s) => `${s.letra}${s.criterios.length}`), ['A3', 'B21', 'C16', 'D25', 'E10', 'F8', 'G4', 'H9', 'I8', 'J10', 'K12', 'L6', 'M1']);
  assert.deepEqual(START.map((s) => `${s.letra}${s.criterios.length}`), ['A1', 'B11', 'C2', 'D7', 'E4', 'F7', 'G3', 'H9', 'I5', 'J1', 'K3', 'L4']);
  assert.equal(new Set(CRITERIOS.map((c) => c.id)).size, 190);
  assert.ok(CRITERIOS.every((c) => c.texto.length > 10 && /^(STOPP|START) [A-M]\d+$/.test(c.codigo)));
  // Umbrales que deben conservarse en la redacción condensada.
  const t = (codigo) => CRITERIOS.find((c) => c.codigo === codigo).texto;
  assert.match(t('STOPP B12'), /K\+ >5\.5 mmol\/L/);
  assert.match(t('STOPP B15'), />450 ms en hombres, >470 ms en mujeres/);
  assert.match(t('STOPP B16'), /85 años.*3 años/);
  assert.match(t('STOPP E4'), /AINE con TFGe <50/);
  assert.match(t('STOPP D8'), /4 semanas/);
  assert.match(t('START B1'), /140.*fragilidad.*150/);
  assert.match(t('START L2'), /neumocócica/);
});

test('Beers 2023: seis categorías por tabla oficial, sin reproducir las tablas', () => {
  assert.deepEqual(BEERS.map((b) => b.tabla), [2, 3, 4, 5, 6, 7]);
  assert.ok(BEERS.every((b) => b.nombre.length > 20));
});

test('registro de medicamentos: nombre genérico obligatorio, campos limitados y sin datos de la persona', () => {
  assert.equal(normalizarMedicamento({ generico: '   ' }, 'm1'), null);
  const m = normalizarMedicamento({ generico: ' Lorazepam ', comercial: 'Ativan', dosis: '1 mg', presentacion: 'tableta', via: 'oral', frecuencia: 'cada 24 h', indicacion: '', duracion: '2 años', observaciones: 'x'.repeat(400), nombrePaciente: 'Juan' }, 'm1');
  assert.equal(m.generico, 'Lorazepam');
  assert.equal(m.observaciones.length, 160);
  assert.ok(!('nombrePaciente' in m), 'solo se guardan los campos del medicamento');
  assert.deepEqual(Object.keys(m), ['id', 'generico', 'comercial', 'dosis', 'presentacion', 'via', 'frecuencia', 'indicacion', 'duracion', 'observaciones']);
});

const conRevision = () => {
  const m = vacia();
  m.meds = [
    normalizarMedicamento({ generico: 'Lorazepam', dosis: '1 mg', frecuencia: 'cada 24 h', indicacion: 'insomnio', duracion: '2 años' }, 'm1'),
    normalizarMedicamento({ generico: 'Omeprazol', dosis: '20 mg', frecuencia: 'cada 24 h' }, 'm2'),
  ];
  m.stopp = { 'S-D10': { estado: 'cumple', med: 'm1' }, 'S-D8': { estado: 'cumple', med: 'm1' }, 'S-E4': { estado: 'ne' }, 'S-B1': { estado: 'no' }, 'T-L1': { estado: 'cumple' } };
  m.beers = { evitar: { estado: 'hallazgo', nota: 'lorazepam: benzodiacepina' }, renal: { estado: 'ne' }, precaucion: { estado: 'ok' } };
  return m;
};

test('salidas: medicamentos, criterios revisados, posibles problemas, información pendiente y sugerencias; sin puntaje', () => {
  const r = resumenMedicacion(conRevision());
  assert.equal(r.revisados.stopp, 4);
  assert.equal(r.revisados.start, 1);
  assert.equal(r.conteo.stopp.cumple, 2);
  assert.equal(r.beersRevisadas, 3);
  assert.ok(r.problemas.some((p) => /^STOPP D10: posible prescripción inapropiada \(Lorazepam\)/.test(p)));
  assert.ok(r.problemas.some((p) => /^START L1: posible omisión/.test(p)));
  assert.ok(r.problemas.some((p) => /Beers 2023, tabla 2.*lorazepam/.test(p)));
  assert.ok(r.pendientes.some((p) => /STOPP E4: no evaluable/.test(p)));
  assert.ok(r.pendientes.some((p) => /Beers 2023, tabla 6: no evaluable/.test(p)));
  assert.ok(r.pendientes.some((p) => /Indicación no registrada: Omeprazol/.test(p)));
  assert.ok(r.pendientes.some((p) => /Función renal no registrada/.test(p)));
  assert.ok(r.pendientes.some((p) => /sin revisar: 129 de 133 STOPP y 56 de 57 START/.test(p)));
  assert.ok(r.sugerencias.some((s) => /decisión clínica/.test(s)), 'no se suspende ni ajusta automáticamente');
  const texto = textoRevision(conRevision());
  assert.ok(!/puntaje|puntos/i.test(texto), 'sin puntaje numérico');
  assert.match(texto, /no son órdenes de suspensión ni de ajuste/);
});

test('contexto paliativo y función renal vinculada con fuente y fecha', () => {
  const m = conRevision();
  m.paliativo = true;
  m.renal = { tfg: { valor: 42, fecha: '2026-10-09', fuente: 'ckdepi' } };
  const r = resumenMedicacion(m);
  assert.ok(r.sugerencias.some((s) => /START no aplican/.test(s) && /Beers no se aplican de forma indiscriminada/.test(s)));
  assert.ok(!r.pendientes.some((p) => /Función renal no registrada/.test(p)));
  assert.equal(textoRenal(m.renal), 'TFGe 42 mL/min/1.73 m² (CKD-EPI 2021, 09/10/2026)');
  assert.equal(resumenMedicacion(vacia()).hayContenido, false);
  assert.equal(partesNota(vacia()), null);
});

test('la nota de la valoración incorpora medicamentos, problemas, pendientes y sugerencias en su sección', () => {
  const val = { resultados: [guardado('barthel', EJEMPLOS.barthel(), { fecha: '2026-10-10' })], medicacion: conRevision() };
  const completa = notaValoracion(val, porId, DOMINIOS, fecha, 'completa');
  const s1 = completa.slice(completa.indexOf('1. RESULTADOS'), completa.indexOf('2. INTERPRETACIÓN'));
  assert.match(s1, /Medicamentos \(2\):\n- Lorazepam 1 mg cada 24 h \(indicación: insomnio; duración: 2 años\)\./);
  assert.match(s1, /STOPP\/START v3: 4 de 133 STOPP y 1 de 57 START revisados/);
  const s4 = completa.slice(completa.indexOf('4. HALLAZGOS'), completa.indexOf('5. SUGERENCIAS'));
  assert.match(s4, /- Posible problema de prescripción: STOPP D10/);
  assert.match(s4, /- Información pendiente: STOPP E4: no evaluable/);
  const s5 = completa.slice(completa.indexOf('5. SUGERENCIAS'));
  assert.match(s5, /decisión clínica/);
  assert.match(notaValoracion(val, porId, DOMINIOS, fecha, 'lista'), /\nMEDICAMENTOS\n- Lorazepam/);
  assert.match(notaValoracion(val, porId, DOMINIOS, fecha, 'parrafo'), /Posibles problemas de prescripción: STOPP D8, STOPP D10, START L1, Beers 2023, tabla 2/);
  const soloMed = notaValoracion({ resultados: [], medicacion: conRevision() }, porId, DOMINIOS, fecha, 'completa');
  assert.ok(!/No hay instrumentos interpretables/.test(soloMed));
});

test('integración: la herramienta aparece en su dominio, en las rutas y sustituye los planes', () => {
  assert.equal(HERRAMIENTAS[0].dominio, 'polifarmacia');
  const planes = [...RUTAS.flatMap((r) => r.planes || []), ...DOMINIOS.flatMap((d) => d.planeadas)].join(' | ');
  assert.ok(!/STOPP|Beers/.test(planes), planes);
  for (const id of ['completa', 'hospital']) assert.ok(RUTAS.find((r) => r.id === id).herramientas?.some((h) => h.id === 'medicacion'), id);
});
