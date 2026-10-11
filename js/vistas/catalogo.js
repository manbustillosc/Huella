// Catálogo de futuras herramientas: solo informativo. Ninguna está implementada; antes de integrarlas se verifican
// versión, licencia, traducción validada al español y algoritmo.
import { DOMINIOS, RUTAS } from '../datos.js';
import { esc, icono } from '../ui.js';

export const CATALOGO_FUTURO = [
  { nombre: 'G8', dominio: 'Oncogeriatría', uso: 'Tamizaje de vulnerabilidad geriátrica en personas con cáncer.', estado: 'Por confirmar: incluye reactivos derivados del MNA, cuyo titular es Nestlé; no hay condiciones públicas para integrarlo en una app.' },
  { nombre: 'VES-13', dominio: 'Fragilidad y pronóstico', uso: 'Vulnerabilidad en personas mayores que viven en la comunidad.', estado: 'RAND no cobra ni pide permiso para uso no comercial; exige reconocer a RAND y citar a Saliba et al. (2001). Falta elegir una versión en español validada.' },
  { nombre: 'EQ-5D', dominio: 'Calidad de vida', uso: 'Calidad de vida relacionada con la salud.', estado: 'Requiere registro y consentimiento escrito de EuroQol. Gratuito para uso no comercial; las versiones digitales se solicitan con un registro propio. El uso comercial tiene tarifa.' },
  { nombre: 'WHOQOL-OLD', dominio: 'Calidad de vida', uso: 'Calidad de vida en personas mayores (módulo de la OMS).', estado: 'Permiso por estudio del centro WHOQOL de cada idioma o de la OMS; orientado a investigación, con posible tarifa si hay financiamiento comercial. Poco adecuado para una app clínica.' },
  { nombre: 'SPICT', dominio: 'Paliativos', uso: 'Identificar a personas que podrían beneficiarse de cuidados paliativos.', estado: 'Descarga gratuita, pero no puede reproducirse en otro formato ni modificarse sin permiso del equipo SPICT: requiere permiso para integrarlo.' },
  { nombre: 'NECPAL', dominio: 'Paliativos', uso: 'Identificar necesidades de atención paliativa en enfermedades crónicas avanzadas.', estado: 'Sin condiciones de uso públicas; la app oficial exige un curso de formación (SECPAL y UVic). Requiere permiso del Observatorio QUALY del ICO.' },
  { nombre: 'ESAS-r', dominio: 'Paliativos', uso: 'Intensidad de síntomas frecuentes en cuidados paliativos.', estado: 'Uso libre con reconocimiento de la fuente; no puede modificarse sin consentimiento de los autores y se pide llenar un formulario de solicitud para registrar su uso.' },
  { nombre: 'IPOS', dominio: 'Paliativos', uso: 'Resultados centrados en la persona en cuidados paliativos.', estado: 'Licencia gratuita con registro en pos-pal.org; no se puede cambiar la redacción ni cobrar por su uso, y cada usuario debe registrarse.' },
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
