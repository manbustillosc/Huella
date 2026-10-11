// Informes: vista previa, copiar, imprimir o guardar en PDF desde el navegador. Sin firma ni certificación.
import { almacen } from '../almacen.js';
import { porId, DOMINIOS, VERSION } from '../datos.js';
import { FORMATOS_INFORME, formatoInforme, textoInforme, bloquesInforme } from '../informes.js';
import { $, esc, icono, hoyISO, copiar } from '../ui.js';

const textoActual = (formato) => textoInforme(formato, almacen.valoracion(), { porId, dominios: DOMINIOS, hoy: hoyISO(), version: VERSION });

function htmlDocumento(texto) {
  return bloquesInforme(texto).map((b) => {
    if (b.tipo === 'titulo') return `<h2 class="inf-titulo">${esc(b.texto)}</h2>`;
    if (b.tipo === 'encabezado') return `<h3 class="inf-seccion">${esc(b.texto)}</h3>`;
    if (b.tipo === 'lista') return `<ul>${b.items.map((i) => `<li>${esc(i.texto)}${i.sub.length ? `<span class="inf-sub">${i.sub.map(esc).join('<br>')}</span>` : ''}</li>`).join('')}</ul>`;
    return `<p>${esc(b.texto)}</p>`;
  }).join('');
}

export function renderInforme({ formato }) {
  const f = formatoInforme(formato) || FORMATOS_INFORME[0];
  const texto = textoActual(f.id);
  return `
    <section class="vista informe">
      <a class="migas" href="#/">${icono('atras')} Inicio</a>
      <header class="cabecera cabecera-dominio">
        <span class="ico-dominio grande">${icono('documento')}</span>
        <div>
          <p class="ceja">Atención</p>
          <h1>Informes</h1>
          <p class="entradilla">Elige el formato, revisa la vista previa y cópialo, imprímelo o guárdalo en PDF. Ningún informe lleva firma ni certificación.</p>
        </div>
      </header>
      <nav class="formatos-informe" aria-label="Formato del informe">
        ${FORMATOS_INFORME.map((x) => `<a href="#/informe/${x.id}"${x.id === f.id ? ' aria-current="page" class="activo"' : ''}>${esc(x.nombre)}</a>`).join('')}
      </nav>
      <p class="discreto inf-desc">${esc(f.desc)}</p>
      <div class="acciones dos inf-acciones">
        <button class="btn btn-primario" type="button" id="copiar-informe">${icono('copiar')} Copiar texto</button>
        <button class="btn" type="button" id="imprimir-informe">${icono('imprimir')} Imprimir o guardar en PDF</button>
      </div>
      <p class="discreto inf-pdf">Para un PDF, elige «Guardar como PDF» en el diálogo de impresión. El archivo se guarda en tu dispositivo.</p>
      <article class="informe-doc" id="informe-doc" aria-label="Vista previa del informe">${htmlDocumento(texto)}</article>
      <pre hidden id="informe-texto">${esc(texto)}</pre>
    </section>`;
}

export function montarInforme({ formato }) {
  const f = formatoInforme(formato) || FORMATOS_INFORME[0];
  $('#copiar-informe').addEventListener('click', () => copiar($('#informe-texto').textContent, `${f.nombre}: copiado`));
  $('#imprimir-informe').addEventListener('click', () => window.print());
}
