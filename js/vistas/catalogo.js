// Catálogo de futuras herramientas: solo informativo. Ninguna está implementada; antes de integrarlas se verifican
// versión, licencia, traducción validada al español y algoritmo.
import { DOMINIOS, RUTAS } from '../datos.js';
import { esc, icono } from '../ui.js';

export const CATALOGO_FUTURO = [
  { nombre: 'EQ-5D', dominio: 'Calidad de vida', uso: 'Calidad de vida relacionada con la salud.', estado: 'Requiere registro y consentimiento escrito de EuroQol. Gratuito para uso no comercial tras el registro, también en versión digital (vía «Fast Track – Digital»). El uso comercial tiene tarifa.' },
  { nombre: 'WHOQOL-OLD', dominio: 'Calidad de vida', uso: 'Calidad de vida en personas mayores (módulo de la OMS).', estado: 'Permiso por estudio del centro WHOQOL de cada idioma o de la OMS; orientado a investigación, con posible tarifa si hay financiamiento comercial. Poco adecuado para una app clínica.' },
  { nombre: 'IPOS', dominio: 'Paliativos', uso: 'Resultados centrados en la persona en cuidados paliativos.', estado: 'Licencia gratuita con registro en pos-pal.org; no se puede cambiar la redacción ni cobrar por su uso, y cada usuario debe registrarse.' },
  { nombre: 'Carga anticolinérgica (ACB)', dominio: 'Polifarmacia', uso: 'Suma del efecto anticolinérgico de la medicación.', estado: 'La escala ACB (actualización 2012) es © Regenstrief Institute y solo puede usarse según sus términos: falta su permiso (acb@agingbraincare.org). Mientras tanto, la revisión de medicamentos incluye la tabla 7 de Beers 2023.' },
  { nombre: 'Rotación de opioides', dominio: 'Calculadoras', uso: 'Dosis del nuevo opioide al cambiar de uno a otro.', estado: 'No se integrará: las tablas varían entre guías y el error tiene consecuencias graves. Huella calcula la carga total en MME/día (CDC 2022), que los CDC indican no usar para convertir dosis.' },
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
