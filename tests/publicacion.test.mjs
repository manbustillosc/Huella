// Verificaciones previas a la publicación (fase 3.1): referencias entre módulos, archivos de la PWA y versión.
// Las ejecuta también la acción de GitHub antes de publicar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'));
const leer = (f) => readFileSync(join(RAIZ, f), 'utf8');
const modulos = ['js', 'js/vistas', 'escalas'].flatMap((d) => readdirSync(join(RAIZ, d)).filter((f) => f.endsWith('.js')).map((f) => `${d}/${f}`));

// Nombres que exporta un módulo, leídos del código fuente (sin ejecutarlo: algunos módulos usan el DOM).
function exportados(fuente) {
  const n = new Set();
  for (const m of fuente.matchAll(/export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/g)) n.add(m[1]);
  for (const m of fuente.matchAll(/export\s*\{([^}]*)\}(?:\s*from\s*['"][^'"]+['"])?/g)) {
    for (const parte of m[1].split(',').map((x) => x.trim()).filter(Boolean)) n.add(parte.split(/\s+as\s+/).pop().trim());
  }
  if (/export\s+default\b/.test(fuente)) n.add('default');
  return n;
}

test('cada import relativo apunta a un archivo existente y a nombres que ese módulo exporta', () => {
  let revisados = 0;
  for (const f of modulos) {
    const fuente = leer(f);
    for (const m of fuente.matchAll(/import\s+([^'";]*?)\s*from\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const destino = normalize(join(dirname(f), m[2]));
      assert.ok(existsSync(join(RAIZ, destino)), `${f}: no existe ${m[2]}`);
      const exp = exportados(leer(destino));
      const clausula = m[1];
      const nombres = [];
      if (/^[A-Za-z_$][\w$]*(\s*,|$)/.test(clausula)) nombres.push('default');
      const llaves = clausula.match(/\{([^}]*)\}/);
      if (llaves) for (const p of llaves[1].split(',').map((x) => x.trim()).filter(Boolean)) nombres.push(p.split(/\s+as\s+/)[0].trim());
      for (const nombre of nombres) assert.ok(exp.has(nombre), `${f}: ${destino} no exporta «${nombre}»`);
      revisados += 1;
    }
    for (const m of fuente.matchAll(/import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g)) {
      assert.ok(existsSync(join(RAIZ, normalize(join(dirname(f), m[1])))), `${f}: no existe ${m[1]} (import dinámico)`);
    }
  }
  assert.ok(revisados > 100, `se revisaron ${revisados} imports`);
});

test('index.html y el manifiesto apuntan a archivos existentes; la app se instala como PWA', () => {
  const html = leer('index.html');
  for (const m of html.matchAll(/(?:href|src)="([^"#:]+)"/g)) assert.ok(existsSync(join(RAIZ, m[1])), `index.html: no existe ${m[1]}`);
  assert.match(html, /<link rel="manifest" href="manifest.webmanifest">/);
  assert.match(html, /<script type="module" src="js\/app.js"><\/script>/);
  const man = JSON.parse(leer('manifest.webmanifest'));
  assert.equal(man.display, 'standalone');
  assert.equal(man.start_url, './');
  assert.ok(man.icons.some((i) => i.sizes === '192x192') && man.icons.some((i) => i.sizes === '512x512'), 'íconos de 192 y 512');
  for (const i of man.icons) assert.ok(existsSync(join(RAIZ, i.src)), `manifiesto: no existe ${i.src}`);
  const sw = leer('sw.js');
  for (const f of ['manifest.webmanifest', 'css/app.css', 'index.html', ...man.icons.map((i) => i.src)]) assert.ok(sw.includes(`'./${f}'`), `sw.js no guarda ${f}`);
  assert.match(leer('js/app.js'), /serviceWorker\.register\(/, 'la app registra el service worker');
});

test('versión: el service worker y la app declaran la misma versión semántica', async () => {
  const { VERSION } = await import('../js/datos.js');
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
  assert.match(leer('sw.js'), new RegExp(`const VERSION = 'huella-${VERSION.replace(/\./g, '\\.')}';`));
});
