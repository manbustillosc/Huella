// Valoración en curso: datos clínicos no identificables, resultados por dominio y nota para el expediente.
import { almacen } from '../almacen.js';
import { porId, DOMINIOS, RUTAS } from '../datos.js';
import { momentoDe, FUENTES } from '../motor.js';
import { notaValoracion, compararMomentos, valorGuardado, fechaCorta } from '../nota.js';
import { $, $$, esc, icono, plural, aviso, copiar, selectorFormato, alCambiarFormato, ETIQUETA_COPIAR, confirmarEnDosToques } from '../ui.js';
import { progresoRuta } from './rutas-estado.js';

const urlResultado = (r) => `#/e/${r.escalaId}${r.momento ? `@${r.momento}` : ''}/resultado`;

function filaResultado(r, cambio = '') {
  const e = porId[r.escalaId];
  const m = r.momento ? momentoDe(r.momento)?.nombre : '';
  return `
    <div class="fila-resultado nivel-${r.nivel}">
      <a class="fr-enlace" href="${urlResultado(r)}" data-cargar="${esc(r.escalaId)}" data-momento="${esc(r.momento || '')}">
        <span class="punto" aria-hidden="true"></span>
        <span class="fr-texto">
          <span class="fr-nombre">${esc(e.nombre)}${m ? ` <span class="fr-momento">${esc(m)}</span>` : ''}</span>
          <span class="fr-res">${esc(valorGuardado(r))}</span>
          ${cambio ? `<span class="fr-cambio">${esc(cambio)}</span>` : ''}
          ${r.fecha || r.fuente ? `<span class="fr-meta">${[r.fecha ? fechaCorta(r.fecha) : '', r.fuente ? `fuente: ${(FUENTES.find((f) => f.id === r.fuente)?.nombre || r.fuente).toLowerCase()}` : ''].filter(Boolean).join(' · ')}</span>` : ''}
        </span>
      </a>
      <button class="btn-icono" type="button" data-quitar="${esc(r.escalaId)}" data-momento="${esc(r.momento || '')}" aria-label="Quitar ${esc(e.corto)}${m ? ` ${esc(m)}` : ''} de la valoración">${icono('cerrar')}</button>
    </div>`;
}

function grupoEscala(rs) {
  const e = porId[rs[0].escalaId];
  const cmp = rs.length > 1 ? compararMomentos(rs, e) : null;
  return (cmp ? cmp.lista : rs).map((r) => {
    const c = cmp?.comparaciones.find((x) => x.r === r);
    const cambio = c?.dif != null ? `${c.dif === 0 ? 'Sin cambio' : `${c.dif > 0 ? '+' : '−'}${Math.abs(c.dif)} ${e.unidadCambio || 'puntos'}`} respecto al ${cmp.ref.momento === 'basal' ? 'basal' : momentoDe(cmp.ref.momento).nombre.toLowerCase()}` : '';
    return filaResultado(r, cambio);
  }).join('');
}

export function renderValoracion() {
  const v = almacen.valoracion();
  const p = v.paciente || {};
  const formato = almacen.formatoNota();
  const grupos = DOMINIOS.map((d) => {
    const rs = v.resultados.filter((r) => porId[r.escalaId]?.dominio === d.id);
    if (!rs.length) return '';
    const ids = [...new Set(rs.map((r) => r.escalaId))];
    return `<p class="ceja grupo-val">${esc(d.nombre)}</p>${ids.map((id) => grupoEscala(rs.filter((r) => r.escalaId === id))).join('')}`;
  }).join('');
  const enCurso = RUTAS.map((r) => ({ r, p: progresoRuta(r) })).filter((x) => x.p.completos + x.p.omitidos > 0 && x.p.pendientes.length);
  return `
    <section class="vista valoracion">
      <header class="cabecera">
        <p class="ceja">Valoración en curso</p>
        <h1>Valoración</h1>
        <p class="entradilla">Se guarda solo en este navegador, sin nombre ni datos de identificación. <a href="#/acerca">Qué se guarda y sus límites</a>.</p>
      </header>
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
      ${v.resultados.length ? `
        <div class="resultados-val">${grupos}</div>
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
    lista: 'Un renglón por instrumento, agrupado por dominio.',
    completa: 'Resultados por dominio, cambios respecto a evaluaciones previas, hallazgos y sugerencias separadas de los resultados.',
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
  $$('[data-quitar]').forEach((b) => b.addEventListener('click', () => {
    almacen.quitarResultado(b.dataset.quitar, b.dataset.momento || undefined);
    alCambiar();
    rerender();
    aviso('Quitado de la valoración');
  }));
  $$('[data-cargar]').forEach((a) => a.addEventListener('click', () => {
    const r = almacen.resultado(a.dataset.cargar, a.dataset.momento || undefined);
    if (r?.respuestas) almacen.guardarRespuestas(r.escalaId, r.momento, r.respuestas);
  }));
}
