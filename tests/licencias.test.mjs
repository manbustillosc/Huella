// Licencias y atribuciones: cada instrumento figura en LICENCIAS.md y las licencias abiertas llevan la atribución exigida.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { porId, escalas } from './ayuda.mjs';
import { CATALOGO_FUTURO } from '../js/vistas/catalogo.js';

const registro = readFileSync(new URL('../LICENCIAS.md', import.meta.url), 'utf8').toLowerCase();
const OTROS_NOMBRES = { equilibrio4: 'equilibrio en 4 etapas' };

test('LICENCIAS.md registra todos los instrumentos de la app', () => {
  for (const e of escalas) {
    const nombre = e.id.startsWith('icope') ? 'icope, 7 instrumentos' : (OTROS_NOMBRES[e.id] || e.corto).toLowerCase();
    assert.ok(registro.includes(nombre), `${e.id}: falta en LICENCIAS.md`);
  }
  for (const x of ['compartir igual', 'cc by-nc-sa 3.0 igo', 'cc by-nc-sa 4.0', 'cc by-sa 4.0', 'sin fines de lucro', 'inger']) assert.ok(registro.includes(x), x);
});

test('4AT y CAM llevan la atribución que exigen sus licencias', () => {
  const at = porId['4at'].licencia.texto;
  assert.match(at, /^Adaptado del 4AT © 2011–2014 Alasdair MacLullich, Tracy Ryan y Helen Cash/);
  assert.match(at, /CC BY 4\.0/);
  assert.match(at, /Esta versión fue modificada\. Cambios:/);
  assert.match(at, /No debe asumirse que la evidencia de validación publicada del 4AT oficial aplica a esta versión modificada/);
  assert.match(at, /Sin garantía de exactitud ni de idoneidad/);
  assert.equal(porId['4at'].licencia.enlace, 'https://www.the4at.com/4at-espanol');
  const cam = porId.cam.licencia.texto;
  assert.match(cam, /NIDUS Measurement and Harmonization Core/);
  assert.match(cam, /CC BY-NC-SA 4\.0/);
  assert.match(cam, /misma licencia/);
  assert.match(porId.gds15.licencia.texto, /dominio público/);
  assert.match(porId.barthel.licencia.texto, /Maryland State Medical Society/);
  assert.match(porId.rass.licencia.texto, /Virginia Commonwealth University/);
});

test('los instrumentos con titular de derechos solo registran el resultado', () => {
  for (const e of escalas.filter((x) => x.registro)) {
    assert.ok(e.licencia?.texto, `${e.id}: licencia`);
    for (const c of e.campos) assert.ok(c.texto.length < 160, `${e.id}.${c.id}: sin reactivos`);
  }
});

test('el catálogo de futuras herramientas resume las condiciones verificadas', () => {
  const de = (n) => CATALOGO_FUTURO.find((x) => x.nombre === n).estado;
  assert.ok(!CATALOGO_FUTURO.some((x) => x.nombre === 'VES-13'), 'VES-13 ya está implementado');
  assert.match(de('EQ-5D'), /registro y consentimiento escrito de EuroQol/);
  assert.match(de('SPICT'), /requiere permiso/);
  assert.match(de('IPOS'), /registro en pos-pal\.org/);
  assert.match(de('ESAS-r'), /no puede modificarse sin consentimiento/);
});
