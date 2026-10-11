// Catálogo de futuras herramientas: solo informativo. Ninguna está implementada; antes de integrarlas se verifican
// versión, licencia, traducción validada al español y algoritmo.
import { DOMINIOS, RUTAS } from '../datos.js';
import { esc, icono } from '../ui.js';

export const CATALOGO_FUTURO = [
  { nombre: 'G8', dominio: 'Oncogeriatría', uso: 'Tamizaje de vulnerabilidad geriátrica en personas con cáncer.', estado: 'Licencia por verificar; incluye reactivos derivados del MNA, cuyo titular es Nestlé.' },
  { nombre: 'VES-13', dominio: 'Fragilidad y pronóstico', uso: 'Vulnerabilidad en personas mayores que viven en la comunidad.', estado: 'Licencia y versión en español por verificar.' },
  { nombre: 'EQ-5D', dominio: 'Calidad de vida', uso: 'Calidad de vida relacionada con la salud.', estado: 'Requiere registro y licencia de la EuroQol Research Foundation; puede tener costo según el uso.' },
  { nombre: 'WHOQOL-OLD', dominio: 'Calidad de vida', uso: 'Calidad de vida en personas mayores (módulo de la OMS).', estado: 'Requiere autorización de la OMS; versión en español por verificar.' },
  { nombre: 'SPICT', dominio: 'Paliativos', uso: 'Identificar a personas que podrían beneficiarse de cuidados paliativos.', estado: 'Condiciones de uso y versión en español por verificar.' },
  { nombre: 'NECPAL', dominio: 'Paliativos', uso: 'Identificar necesidades de atención paliativa en enfermedades crónicas avanzadas.', estado: 'Solo registro del resultado; condiciones de uso por verificar.' },
  { nombre: 'ESAS-r', dominio: 'Paliativos', uso: 'Intensidad de síntomas frecuentes en cuidados paliativos.', estado: 'Condiciones de uso y versión en español por verificar.' },
  { nombre: 'IPOS', dominio: 'Paliativos', uso: 'Resultados centrados en la persona en cuidados paliativos.', estado: 'Requiere registro con sus autores; condiciones de uso por verificar.' },
];

export function renderCatalogo() {
  const yaListados = new Set(CATALOGO_FUTURO.map((x) => x.nombre.toLowerCase()));
  const pendientes = [];
  for (const d of DOMINIOS) for (const p of d.planeadas) pendientes.push({ nombre: p, de: d.nombre });
  for (const r of RUTAS) for (const p of r.planes || []) if (!pendientes.some((x) => x.nombre === p)) pendientes.push({ nombre: p, de: r.nombre });
  const otros = pendientes.filter((x) => !yaListados.has(x.nombre.replace(/ \(.*\)$/, '').toLowerCase()));
  return `
    <section class="vista catalogo">
      <a class="migas" href="#/">${icono('atras')} Inicio</a>
      <header class="cabecera cabecera-dominio">
        <span class="ico-dominio grande">${icono('libro')}</span>
        <div>
          <p class="ceja">Herramientas</p>
          <h1>Futuras herramientas</h1>
          <p class="entradilla">Instrumentos que podrían agregarse. Ninguno está disponible todavía: antes de integrarlos se verifican la versión, la licencia, la traducción validada al español y el algoritmo.</p>
        </div>
      </header>
      <div class="tabla-envoltura"><table class="tabla catalogo-tabla">
        <thead><tr><th>Instrumento</th><th>Uso</th><th>Estado</th></tr></thead>
        <tbody>${CATALOGO_FUTURO.map((x) => `<tr><th scope="row">${esc(x.nombre)}<span class="discreto">${esc(x.dominio)}</span></th><td>${esc(x.uso)}</td><td>${esc(x.estado)}</td></tr>`).join('')}</tbody>
      </table></div>
      <h2 class="seccion">Otros pendientes por dominio o ruta</h2>
      <ul class="chips">${otros.map((x) => `<li>${esc(x.nombre)} <span class="discreto">· ${esc(x.de)}</span></li>`).join('')}</ul>
      <p class="discreto">Que un instrumento sea de uso clínico gratuito no implica permiso para reproducirlo en una aplicación pública.</p>
    </section>`;
}
