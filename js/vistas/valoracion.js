// Valoración en curso: datos clínicos no identificables, resultados por dominio en orden cronológico y nota.
import { almacen } from '../almacen.js';
import { porId, DOMINIOS, RUTAS } from '../datos.js';
import { FUENTES } from '../motor.js';
import { notaValoracion, valorGuardado, hallazgosYSugerencias } from '../nota.js';
import { ordenarCronologico, compararResultados, etiquetaAplicacion, fechaCorta, isoDe, textoCambio, textoRespectoA } from '../comparacion.js';
import { $, $$, esc, icono, plural, aviso, copiar, selectorFormato, alCambiarFormato, ETIQUETA_COPIAR, confirmarEnDosToques } from '../ui.js';
import { progresoRuta } from './rutas-estado.js';

export const diasDesde = (ts) => (ts ? Math.max(0, Math.floor((Date.now() - ts) / 86400000)) : 0);

const urlResultado = (r) => `#/e/${r.escalaId}${r.momento ? `@${r.momento}` : ''}/resultado`;
const ICONO_CAMBIO = { mejoria: '↑', empeoramiento: '↓', sin_cambio: '=', sin_direccion: '~', no_interpretable: '?' };

function filaResultado(r, cambio = null, esRef = false, ref = null) {
  const e = porId[r.escalaId];
  const etq = etiquetaAplicacion(r) || (r.fecha ? fechaCorta(r.fecha) : '');
  const fuente = r.fuente ? `fuente: ${(FUENTES.find((f) => f.id === r.fuente)?.nombre || r.fuente).toLowerCase()}` : '';
  const meta = [r.momento && r.fecha && r.momento !== 'basal' ? '' : r.momento === 'basal' && r.fecha ? `registrado ${fechaCorta(r.fecha)}` : '', fuente].filter(Boolean).join(' · ');
  return `
    <div class="fila-resultado nivel-${r.nivel}">
      <a class="fr-enlace" href="${urlResultado(r)}" data-cargar="${esc(r.id)}">
        <span class="punto" aria-hidden="true"></span>
        <span class="fr-texto">
          <span class="fr-nombre">${esc(e.corto)}${etq ? ` <span class="fr-momento">${esc(etq)}</span>` : ''}${esRef ? ' <span class="fr-ref">referencia</span>' : ''}</span>
          <span class="fr-res">${esc(valorGuardado(r))}</span>
          ${r.alertas?.length ? `<span class="fr-alerta">${icono('alerta')} Alerta de seguridad: ${esc(r.alertas[0].split(':')[0])}</span>` : ''}
          ${cambio ? `<span class="fr-cambio cambio-${cambio.tipo}"><span aria-hidden="true">${ICONO_CAMBIO[cambio.tipo]}</span> ${esc(textoCambio(cambio, ref ? textoRespectoA(ref) : ''))}</span>` : ''}
          ${meta ? `<span class="fr-meta">${esc(meta)}</span>` : ''}
        </span>
      </a>
      <button class="btn-icono" type="button" data-quitar="${esc(r.id)}" aria-label="Quitar ${esc(e.corto)}${etq ? ` ${esc(etq)}` : ''} de la valoración">${icono('cerrar')}</button>
    </div>`;
}

function grupoEscala(rs) {
  const e = porId[rs[0].escalaId];
  const cmp = rs.length > 1 ? compararResultados(rs, e) : null;
  if (!cmp) return filaResultado(rs[0]);
  return cmp.filas.map((f) => filaResultado(f.r, f.esRef ? null : f.vsRef, f.esRef, cmp.ref)).join('');
}

export function renderValoracion() {
  const v = almacen.valoracion();
  const p = v.paciente || {};
  const formato = almacen.formatoNota();
  const dias = diasDesde(v.creada);
  const grupos = DOMINIOS.map((d) => {
    const rs = v.resultados.filter((r) => porId[r.escalaId]?.dominio === d.id);
    if (!rs.length) return '';
    const ids = [...new Set(ordenarCronologico(rs).map((r) => r.escalaId))];
    return `<p class="ceja grupo-val">${esc(d.nombre)}</p>${ids.map((id) => grupoEscala(rs.filter((r) => r.escalaId === id))).join('')}`;
  }).join('');
  const enCurso = RUTAS.map((r) => ({ r, p: progresoRuta(r) })).filter((x) => x.p.completos + x.p.omitidos > 0 && x.p.pendientes.length);
  const { avisos } = v.resultados.length ? hallazgosYSugerencias(v, porId) : { avisos: [] };
  return `
    <section class="vista valoracion">
      <header class="cabecera">
        <p class="ceja">Valoración en curso</p>
        <h1>Valoración</h1>
        <p class="entradilla">Se guarda solo en este navegador, sin nombre ni datos de identificación. <a href="#/acerca">Qué se guarda y sus límites</a>.</p>
        ${v.creada ? `<p class="inicio-valoracion">${icono('calendario')} Iniciada el ${esc(fechaCorta(isoDe(new Date(v.creada))))}${dias > 0 ? ` (hace ${plural(dias, 'día', 'días')})` : ' (hoy)'}.</p>` : ''}
      </header>
      ${dias > 7 && v.resultados.length ? `<p class="aviso-episodio">${icono('alerta')} Esta valoración tiene más de una semana. Si los nuevos resultados son de otro episodio clínico, copia la nota e inicia una nueva valoración para no mezclarlos.</p>` : ''}
      <div class="tarjeta">
        <p class="titulo-tarjeta">Datos clínicos <span>(opcionales, no identificables)</span></p>
        <div class="campos">
          <label class="campo"><span>Edad</span><input id="p-edad" type="number" inputmode="numeric" min="0" max="120" value="${esc(p.edad ?? '')}"></label>
          <label class="campo"><span>Sexo</span>
            <select id="p-sexo">
              <option value="">—</option>
              <option value="mujer"${p.sexo === 'mujer' ? ' selected' : ''}>Mujer</option>
              <option value="hombre"${p.sexo === 'hombre' ? ' selected' : ''}>Hombre</option>
            </select>
          </label>
          <label class="campo"><span>Escolaridad</span><input id="p-escolaridad" type="number" inputmode="numeric" min="0" max="30" placeholder="años" value="${esc(p.escolaridad ?? '')}"></label>
          <label class="campo ancho"><span>Contexto clínico</span><input id="p-contexto" type="text" maxlength="160" placeholder="Ej.: ingreso por neumonía; consulta por caídas" value="${esc(p.contexto ?? '')}"></label>
        </div>
        <p class="aviso-datos">${icono('escudo')} No escribas nombre, expediente, fechas de nacimiento ni otros datos que identifiquen a la persona.</p>
      </div>
      ${enCurso.length ? `
        <div class="rutas-en-curso">
          ${enCurso.map(({ r, p: pr }) => `<a class="en-curso" href="#/r/${r.id}">${icono(r.icono)}<span><strong>${esc(r.nombre)}</strong><span>${pr.completos} de ${pr.total} completos · ${plural(pr.pendientes.length, 'pendiente', 'pendientes')}</span></span>${icono('adelante', 'chev')}</a>`).join('')}
        </div>` : ''}
      ${avisos.length ? `
        <div class="avisos-cronologia" role="note">
          <p class="titulo-tarjeta">${icono('alerta')} Revisa la cronología</p>
          <ul>${avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        </div>` : ''}
      ${v.resultados.length ? `
        <div class="resultados-val">${grupos}</div>
        <p class="discreto">Cada instrumento se muestra en orden cronológico; el cambio se compara con el basal o, si no hay, con la primera aplicación. Toca un resultado para revisarlo o corregirlo.</p>
        <div class="cabecera-nota">
          <h2 class="seccion">Nota para el expediente</h2>
          ${selectorFormato(formato, ['parrafo', 'lista', 'completa'])}
        </div>
        <p class="discreto" id="desc-formato">${descripcionFormato(formato)}</p>
        <pre class="nota" id="nota" data-formato="${formato}">${esc(notaValoracion(v, porId, DOMINIOS, new Date(), formato))}</pre>
        <div class="acciones dos">
          <button class="btn btn-primario" type="button" id="copiar-nota">${icono('copiar')} ${ETIQUETA_COPIAR[formato]}</button>
          <button class="btn" type="button" id="nueva-val">${icono('borrar')} Nueva valoración</button>
        </div>` : `
        <div class="vacio-estado">
          ${icono('valoracion')}
          <p>Aún no hay resultados</p>
          <p class="sub-vacio">Elige una ruta guiada o aplica un instrumento y toca «Añadir a la valoración».</p>
          <a class="btn btn-primario" href="#/">Ir al inicio</a>
        </div>`}
    </section>`;
}

function descripcionFormato(f) {
  return {
    parrafo: 'Todo seguido, para ahorrar espacio en la nota.',
    lista: 'Un renglón por aplicación, agrupado por dominio, con el cambio respecto a la referencia.',
    completa: 'Separa resultados objetivos, interpretación, cambios longitudinales, hallazgos y sugerencias orientativas.',
  }[f];
}

export function montarValoracion(rerender, alCambiar) {
  const actualizarNota = () => {
    const nota = $('#nota');
    if (!nota) return;
    const f = almacen.formatoNota();
    nota.dataset.formato = f;
    nota.textContent = notaValoracion(almacen.valoracion(), porId, DOMINIOS, new Date(), f);
    $('#copiar-nota').innerHTML = `${icono('copiar')} ${ETIQUETA_COPIAR[f]}`;
    $('#desc-formato').textContent = descripcionFormato(f);
  };
  alCambiarFormato(document, actualizarNota);
  const guardarPaciente = () => {
    const v = almacen.valoracion();
    v.paciente = {
      edad: $('#p-edad').value,
      sexo: $('#p-sexo').value,
      escolaridad: $('#p-escolaridad').value,
      contexto: $('#p-contexto').value,
    };
    almacen.guardarValoracion(v);
    actualizarNota();
  };
  ['#p-edad', '#p-sexo', '#p-escolaridad', '#p-contexto'].forEach((s) => $(s).addEventListener('input', guardarPaciente));
  $('#copiar-nota')?.addEventListener('click', () => {
    const f = almacen.formatoNota();
    copiar($('#nota').textContent, { parrafo: 'Nota copiada en párrafo', lista: 'Nota copiada en lista', completa: 'Nota completa copiada' }[f]);
  });
  const nueva = $('#nueva-val');
  if (nueva) {
    confirmarEnDosToques(nueva, {
      texto: `${icono('alerta')} Toca otra vez para borrar todos los resultados`,
      accion: () => {
        almacen.nuevaValoracion();
        alCambiar();
        rerender();
        aviso('Valoración borrada; puedes empezar una nueva');
      },
    });
  }
  // Quitar un resultado también pide un segundo toque.
  $$('[data-quitar]').forEach((b) => confirmarEnDosToques(b, {
    texto: icono('alerta'),
    accion: () => {
      almacen.quitarResultado(b.dataset.quitar);
      alCambiar();
      rerender();
      aviso('Quitado de la valoración');
    },
  }));
  $$('[data-quitar]').forEach((b) => b.addEventListener('click', () => {
    if (b.classList.contains('armado')) b.setAttribute('aria-label', 'Toca otra vez para quitar este resultado');
  }));
  // Al abrir un resultado, sus respuestas quedan listas para revisarlo o corregirlo.
  $$('[data-cargar]').forEach((a) => a.addEventListener('click', () => {
    const r = almacen.resultadoPorId(a.dataset.cargar);
    if (r?.respuestas) almacen.guardarRespuestas(r.escalaId, r.momento, { ...r.respuestas, _origen: r.id });
  }));
}
