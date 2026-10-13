// Pantalla de diagramas de flujo de la valoración preoperatoria (VPO). Las ramas de cada decisión se pueden elegir
// para resaltar el camino que aplica a la persona.
import { DIAGRAMAS, LISTA_VPO, DOCUMENTO_VPO, ORIGENES_VPO, FUENTE_LISTA_VPO, diagramaDe } from '../vpo.js';
import { porId } from '../datos.js';
import { herramientaDe } from '../herramientas.js';
import { $$, esc, icono } from '../ui.js';

export const PESTANAS_VPO = ['lista', ...DIAGRAMAS.map((d) => d.id)];

const chipsEscalas = (ids = []) => (ids.length
  ? `<span class="nodo-escalas">${ids.filter((id) => porId[id]).map((id) => `<a class="chip-escala" href="#/e/${id}">${esc(porId[id].corto)}</a>`).join('')}</span>`
  : '');

const ICONO_NODO = { inicio: 'iniciar', paso: 'flecha', decision: 'info', alerta: 'alerta', fin: 'check' };

const origenNodo = (n) => (n.origen ? `<p class="nodo-origen">${icono('libro')} <span>${esc(n.origen)}</span></p>` : '');

function nodo(n, ruta) {
  const detalle = (n.detalle || []).length ? `<ul class="nodo-detalle">${n.detalle.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : '';
  const idTexto = n.tipo === 'decision' ? ` id="q-${ruta}"` : '';
  const cuerpo = `<p class="nodo-texto"${idTexto}>${esc(n.texto)}</p>${detalle}${chipsEscalas(n.escalas)}${origenNodo(n)}`;
  if (n.tipo !== 'decision') {
    return `<li class="nodo nodo-${n.tipo}${n.tono ? ` tono-${n.tono}` : ''}"><div class="nodo-caja">${icono(ICONO_NODO[n.tipo])}<div>${cuerpo}</div></div></li>`;
  }
  // Cada respuesta se nombra junto con su pregunta («Sí, ¿Cirugía de riesgo alto?») para que los Sí/No repetidos se
  // distingan con lector de pantalla; aria-pressed indica la respuesta elegida.
  return `
    <li class="nodo nodo-decision" data-decision="${ruta}">
      <div class="nodo-caja"><span class="rombo" aria-hidden="true">?</span><div>${cuerpo}</div></div>
      <div class="ramas" style="--n:${n.ramas.length}">
        ${n.ramas.map((r, i) => `
          <div class="rama${r.tono ? ` tono-${r.tono}` : ''}" data-rama="${i}">
            <button class="rama-etiqueta" type="button" id="b-${ruta}-${i}" aria-labelledby="b-${ruta}-${i} q-${ruta}" aria-pressed="false">${esc(r.etiqueta)}</button>
            <ol class="flujo">${r.nodos.map((x, j) => nodo(x, `${ruta}-${i}-${j}`)).join('')}</ol>
          </div>`).join('')}
      </div>
    </li>`;
}

const chipOrigen = (o) => `<span class="chip-fuente origen-${o}">${esc(ORIGENES_VPO[o])}</span>`;

function fuentesDiagrama(fuentes = []) {
  return `
    <section class="fuentes-vpo" aria-label="Fuentes de este diagrama">
      <h3 class="ficha-sub">Fuentes</h3>
      <ul>
        ${fuentes.map((f) => `<li>${chipOrigen(f.origen)} <span>${esc(f.texto)}${f.paginas ? `, p. ${esc(f.paginas)}` : ''}.</span></li>`).join('')}
        <li>${chipOrigen('propia')} <span>Redacción, orden de los pasos y diagrama de Huella; no sustituyen el documento.</span></li>
      </ul>
    </section>`;
}

function panelDiagrama(d) {
  return `
    <section class="diagrama" aria-labelledby="dg-${d.id}">
      <h2 class="seccion" id="dg-${d.id}">${esc(d.nombre)}</h2>
      <p class="discreto">${esc(d.resumen)} Toca una respuesta para resaltar el camino.</p>
      <div class="herramientas-vpo">
        <button class="btn btn-chico" type="button" data-solo aria-pressed="false">${icono('ruta')} Solo el camino seleccionado</button>
        <button class="btn btn-chico" type="button" data-limpiar>${icono('reiniciar')} Quitar selección</button>
      </div>
      <ol class="flujo flujo-raiz">${d.nodos.map((n, i) => nodo(n, `${d.id}-${i}`)).join('')}</ol>
      ${(d.notas || []).map((t) => `<p class="nota-seguridad">${icono('info')} ${esc(t)}</p>`).join('')}
      ${fuentesDiagrama(d.fuentes)}
    </section>`;
}

function panelLista() {
  return `
    <section class="tarjeta" aria-labelledby="vpo-lista-t">
      <h2 class="titulo-tarjeta" id="vpo-lista-t">Qué revisa la VPO por Medicina Interna</h2>
      <ul class="lista-vpo">
        ${LISTA_VPO.map((x) => `<li>${icono('check')}<div><span>${esc(x.texto)}</span>${chipsEscalas(x.escalas)}${x.herramienta ? `<span class="nodo-escalas"><a class="chip-escala" href="${herramientaDe(x.herramienta).href}">${esc(herramientaDe(x.herramienta).corto)}</a></span>` : ''}</div></li>`).join('')}
      </ul>
      <p class="discreto">Usa solo las escalas que respondan una decisión clínica y pide estudios únicamente si su resultado puede cambiar el manejo.</p>
      ${fuentesDiagrama([FUENTE_LISTA_VPO])}
    </section>
    <h2 class="seccion">Diagramas</h2>
    <div class="lista-diagramas">
      ${DIAGRAMAS.map((d) => `<a class="tarjeta enlace-diagrama" href="#/vpo/${d.id}"><strong>${esc(d.nombre)}</strong><span>${esc(d.resumen)}</span>${icono('adelante', 'chev')}</a>`).join('')}
    </div>`;
}

export function renderVpo({ pestana }) {
  const d = diagramaDe(pestana);
  return `
    <section class="vista vpo">
      <a class="migas" href="#/r/preqx">${icono('atras')} Valoración prequirúrgica</a>
      <header class="cabecera">
        <p class="ceja">Prequirúrgica · Diagramas de flujo</p>
        <h1>Valoración preoperatoria (VPO)</h1>
        <p class="entradilla">Qué hacer y qué pedir en cirugía electiva no cardiaca, según el lineamiento del IMSS (2026). La VPO estima el riesgo y deja recomendaciones: no es una autorización para operar.</p>
      </header>
      <nav class="pestanas-med pestanas-vpo" aria-label="Diagramas de la VPO">
        <a href="#/vpo/lista"${pestana === 'lista' ? ' aria-current="page" class="activo"' : ''}>Lista</a>
        ${DIAGRAMAS.map((x) => `<a href="#/vpo/${x.id}"${x.id === pestana ? ' aria-current="page" class="activo"' : ''}>${esc(x.nombre)}</a>`).join('')}
      </nav>
      <div id="panel-vpo">${d ? panelDiagrama(d) : panelLista()}</div>
      <section class="documento-vpo" aria-label="Documento de referencia">
        <p class="nota-seguridad">${icono('libro')} <span><strong>Documento:</strong> ${esc(DOCUMENTO_VPO.cita)} ${esc(DOCUMENTO_VPO.version)} ${esc(DOCUMENTO_VPO.enlace)} Huella digital del archivo: ${esc(DOCUMENTO_VPO.huella)}.</span></p>
        <p class="nota-seguridad">${icono('info')} <span>Las páginas citadas son las impresas en el documento. Los criterios de guías internacionales se marcan aparte; donde difieren del lineamiento, Huella lo indica.</span></p>
      </section>
    </section>`;
}

export function montarVpo() {
  const raiz = $$('.diagrama')[0];
  $$('.rama-etiqueta').forEach((b) => b.addEventListener('click', () => {
    const rama = b.closest('.rama');
    const ramas = rama.parentElement;
    const yaElegida = rama.classList.contains('elegida');
    [...ramas.children].forEach((x) => {
      x.classList.remove('elegida', 'atenuada');
      x.querySelector(':scope > .rama-etiqueta').setAttribute('aria-pressed', 'false');
    });
    if (!yaElegida) {
      [...ramas.children].forEach((x) => x.classList.add(x === rama ? 'elegida' : 'atenuada'));
      b.setAttribute('aria-pressed', 'true');
    }
  }));
  // Modo reversible: oculta el contenido de las ramas no elegidas (sus botones siguen visibles para cambiar de respuesta).
  $$('[data-solo]').forEach((b) => b.addEventListener('click', () => {
    const activo = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(activo));
    raiz?.classList.toggle('solo-camino', activo);
  }));
  $$('[data-limpiar]').forEach((b) => b.addEventListener('click', () => {
    $$('.rama').forEach((x) => x.classList.remove('elegida', 'atenuada'));
    $$('.rama-etiqueta').forEach((x) => x.setAttribute('aria-pressed', 'false'));
  }));
}
