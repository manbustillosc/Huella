// Seguimiento: episodio (código anónimo, fechas, estado y cierre), evolución de las mediciones repetidas con gráfica,
// revaloraciones, estado de objetivos e intervenciones, cambios del plan, exportación e importación local.
import { almacen } from '../almacen.js';
import { porId, VERSION } from '../datos.js';
import { planDe, nombreAmbito } from '../plan.js';
import { seriesEvolucion, revaloraciones, objetivoVencido } from '../atencion.js';
import {
  episodioDe, fechasEvaluacion, cerrarEpisodio, reabrirEpisodio, fijarEtiquetaEpisodio, exportarEpisodio, nombreArchivo,
  validarImportacion, tieneContenido, ESTADOS_EPISODIO, MAX_ETIQUETA_EPISODIO, MAX_EPISODIOS,
} from '../episodio.js';
import { textoCambio, textoRespectoA, fechaCorta } from '../comparacion.js';
import { $, $$, esc, icono, plural, hoyISO, aviso, confirmarEnDosToques } from '../ui.js';
import { filaObjetivo, filaIntervencion, formularioCambio, conectarPlan, conectarQuitar, avisoDatos } from './plan-ui.js';

const AVISO_EXPORTAR = 'El archivo contiene información de salud del episodio, sin nombre ni identificadores. Revisa que el contexto clínico y las notas no incluyan datos identificables, guárdalo en un lugar seguro, no lo envíes por canales no seguros y bórralo cuando ya no lo necesites. Huella no lo sube a ningún servidor.';

/* ---------- Gráfica de una serie ---------- */

// Eje con pasos «redondos» (1, 2, 2.5 o 5 por potencia de 10) que incluye todos los valores.
export function escalaAmable(min, max) {
  let lo = min;
  let hi = max;
  if (hi === lo) { lo -= Math.abs(lo) * 0.1 || 1; hi += Math.abs(hi) * 0.1 || 1; }
  const crudo = (hi - lo) / 3;
  const pot = 10 ** Math.floor(Math.log10(crudo));
  const paso = [1, 2, 2.5, 5, 10].map((f) => f * pot).find((x) => x >= crudo);
  lo = Math.floor(lo / paso) * paso;
  hi = Math.ceil(hi / paso) * paso;
  const ticks = [];
  for (let t = lo; t <= hi + paso / 1000; t += paso) ticks.push(Math.round(t * 1e6) / 1e6);
  return { lo, hi, ticks };
}

const redondear = (x) => (Math.abs(x) >= 100 ? Math.round(x) : Math.round(x * 100) / 100);

export function graficaSerie(s) {
  const W = 320;
  const H = 150;
  const m = { izq: 38, der: 14, arr: 18, aba: 30 };
  const vals = s.puntos.map((p) => p.valor);
  const acotada = Number.isFinite(s.escala.min) && Number.isFinite(s.escala.max) && s.escala.max > s.escala.min;
  let lo = acotada ? s.escala.min : Math.min(...vals);
  let hi = acotada ? s.escala.max : Math.max(...vals);
  let ticks;
  if (acotada) ticks = [lo, (lo + hi) / 2, hi];
  else {
    ({ lo, hi, ticks } = escalaAmable(lo, hi));
  }
  const x = (i) => m.izq + (s.puntos.length === 1 ? 0 : (i * (W - m.izq - m.der)) / (s.puntos.length - 1));
  const y = (v) => m.arr + (1 - (v - lo) / (hi - lo)) * (H - m.arr - m.aba);
  const etiquetasX = s.puntos.length > 6 ? [0, s.puntos.length - 1] : s.puntos.map((_, i) => i);
  const dir = s.escala.direccionClinica === 'mayor_mejor' ? 'Valores más altos son mejores' : s.escala.direccionClinica === 'menor_mejor' ? 'Valores más bajos son mejores' : 'Sin dirección clínica uniforme';
  const desc = `${s.escala.corto}: ${s.puntos.map((p) => `${p.etiqueta} ${redondear(p.valor)}`).join(', ')}. ${dir}.`;
  return `
    <figure class="grafica">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(desc)}" preserveAspectRatio="xMidYMid meet">
        ${ticks.map((t) => `<line class="graf-rejilla" x1="${m.izq}" x2="${W - m.der}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/><text class="graf-eje" x="${m.izq - 6}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${esc(String(redondear(t)))}</text>`).join('')}
        <polyline class="graf-linea" points="${s.puntos.map((p, i) => `${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ')}"/>
        ${s.puntos.map((p, i) => `<circle class="graf-punto nivel-${esc(p.nivel || 'neutro')}" cx="${x(i).toFixed(1)}" cy="${y(p.valor).toFixed(1)}" r="4.5"/><text class="graf-valor" x="${x(i).toFixed(1)}" y="${(y(p.valor) - 9).toFixed(1)}" text-anchor="middle">${esc(String(redondear(p.valor)))}</text>`).join('')}
        ${etiquetasX.map((i) => `<text class="graf-eje" x="${x(i).toFixed(1)}" y="${H - 10}" text-anchor="${s.puntos.length > 1 && i === 0 ? 'start' : i === s.puntos.length - 1 && s.puntos.length > 1 ? 'end' : 'middle'}">${esc(s.puntos[i].fecha ? s.puntos[i].fecha.slice(8, 10) + '/' + s.puntos[i].fecha.slice(5, 7) : '')}</text>`).join('')}
      </svg>
      <figcaption>${esc(dir)}${acotada ? ` · eje de ${s.escala.min} a ${s.escala.max}` : ''}</figcaption>
    </figure>`;
}

function tarjetaSerie(s) {
  const u = s.cmp?.ultima;
  return `
    <article class="tarjeta serie">
      <header class="icope-dom-cab"><h3>${esc(s.escala.corto)}</h3><span class="discreto">${plural(s.puntos.length, 'medición', 'mediciones')}</span></header>
      ${graficaSerie(s)}
      <ol class="serie-puntos">${s.puntos.map((p) => `<li><span>${esc(p.etiqueta)}</span><span>${esc(p.mostrar)}</span></li>`).join('')}</ol>
      ${u ? `<dl class="icope-datos">
        <div><dt>Cambio cuantitativo</dt><dd>${esc(textoCambio(u.vsRef, textoRespectoA(s.cmp.ref)))}</dd></div>
        <div><dt>Significado clínico</dt><dd>${esc(s.significado?.texto || '')}</dd></div>
        ${u.vsRef.advertencias?.length ? `<div><dt>Verifica</dt><dd>${u.vsRef.advertencias.map(esc).join(' ')}</dd></div>` : ''}
      </dl>` : ''}
    </article>`;
}

/* ---------- Pantalla ---------- */

function tarjetaEpisodio(v) {
  const ep = episodioDe(v);
  const fechas = fechasEvaluacion(v);
  return `
    <section class="tarjeta episodio" id="episodio">
      <div class="ep-cab">
        <div>
          <p class="ceja">Episodio</p>
          <p class="ep-codigo">${esc(ep.codigo)}</p>
        </div>
        <span class="chip-problema ep-${ep.estado}">${esc(ESTADOS_EPISODIO[ep.estado])}</span>
      </div>
      <dl class="icope-datos">
        <div><dt>Abierto</dt><dd>${ep.abierto ? esc(fechaCorta(ep.abierto)) : '—'}</dd></div>
        ${ep.cerrado ? `<div><dt>Cerrado</dt><dd>${esc(fechaCorta(ep.cerrado))}${ep.motivoCierre ? ` · ${esc(ep.motivoCierre)}` : ''}</dd></div>` : ''}
        <div><dt>Fechas de evaluación</dt><dd>${fechas.length ? esc(fechas.map(fechaCorta).join(', ')) : 'Sin evaluaciones'}${fechas.length && ep.abierto && fechas[0] < ep.abierto ? ` <span class="vencida">hay evaluaciones anteriores a la apertura del episodio: verifica que pertenezcan a él</span>` : ''}</dd></div>
        <div><dt>Resultados</dt><dd>${v.resultados.length}</dd></div>
      </dl>
      <label class="campo ancho"><span>Etiqueta del episodio (opcional)</span><input id="ep-etiqueta" type="text" maxlength="${MAX_ETIQUETA_EPISODIO}" value="${esc(ep.etiqueta)}" placeholder="p. ej., hospitalización por neumonía"></label>
      ${avisoDatos}
      <p class="discreto">El código es aleatorio y no se relaciona con la persona. Comparaciones, gráficas e informes usan solo las mediciones de este episodio.</p>
      <div class="acciones dos">
        ${ep.estado === 'cerrado'
          ? `<button class="btn" type="button" id="reabrir-episodio">${icono('reiniciar')} Reabrir episodio</button>`
          : `<button class="btn" type="button" id="cerrar-episodio">${icono('archivo')} Cerrar episodio y empezar otro</button>`}
        <a class="btn btn-primario" href="#/informe/seguimiento">${icono('documento')} Informe de seguimiento</a>
      </div>
      ${ep.estado === 'cerrado' ? '<p class="aviso-episodio">Este episodio está cerrado. Puedes consultarlo y generar informes; si agregas resultados, reábrelo primero.</p>' : ''}
    </section>`;
}

function htmlSeguimiento() {
  const v = almacen.valoracion();
  const hoy = hoyISO();
  const plan = planDe(v);
  const series = seriesEvolucion(v, porId);
  const rev = revaloraciones(plan, hoy);
  const archivados = almacen.episodios();
  const nombre = (a) => nombreAmbito(a, plan);
  const bitacora = [...plan.bitacora].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 40).map((b) => `<li><span class="bit-fecha">${esc(b.fecha ? fechaCorta(b.fecha) : '')}</span> ${esc(b.texto)}${b.auto ? '' : ' <span class="vin-usado">nota</span>'}</li>`).join('');
  return `
    ${tarjetaEpisodio(v)}
    <h2 class="seccion">${icono('grafica')} Evolución</h2>
    ${series.length ? `<div class="series">${series.map(tarjetaSerie).join('')}</div>
      <p class="discreto">Un cambio numérico no equivale a un cambio clínicamente significativo. Huella solo lo califica con los umbrales publicados que declara cada instrumento; en los demás, la relevancia requiere valoración clínica.</p>`
      : '<p class="vacio-texto">Las gráficas aparecen cuando un instrumento tiene dos o más mediciones en este episodio.</p>'}
    <h2 class="seccion">${icono('calendario')} Revaloraciones</h2>
    ${rev.length ? `<div class="tabla-envoltura"><table class="tabla">
      <thead><tr><th>Problema</th><th>Fecha</th><th>Estado</th></tr></thead>
      <tbody>${rev.map((r) => `<tr><th scope="row">${esc(r.nombre)}</th><td>${esc(fechaCorta(r.fecha))}</td><td>${r.dias < 0 ? `<span class="vencida">vencida hace ${plural(-r.dias, 'día', 'días')}</span>` : r.dias === 0 ? 'hoy' : `en ${plural(r.dias, 'día', 'días')}`}</td></tr>`).join('')}</tbody>
    </table></div>` : '<p class="vacio-texto">Sin fechas de revaloración. Se fijan en el <a href="#/plan">plan de atención</a>.</p>'}
    <h2 class="seccion">${icono('objetivo')} Objetivos</h2>
    ${plan.objetivos.length ? `<ul class="icope-segs">${plan.objetivos.map((o) => filaObjetivo(o, { etiqueta: nombre(o.ambito), vencido: objetivoVencido(o, hoy) })).join('')}</ul>` : '<p class="vacio-texto">Sin objetivos en el plan.</p>'}
    <h2 class="seccion">${icono('lista')} Intervenciones</h2>
    ${plan.intervenciones.length ? `<ul class="icope-segs">${plan.intervenciones.map((i) => filaIntervencion(i, { etiqueta: nombre(i.ambito), quitar: false })).join('')}</ul><p class="discreto">Huella no marca ninguna intervención como realizada: actualiza el estado cuando corresponda.</p>` : '<p class="vacio-texto">Sin intervenciones en el plan.</p>'}
    <h2 class="seccion">${icono('plan')} Cambios del plan</h2>
    ${formularioCambio()}
    ${bitacora ? `<ul class="icope-bitacora">${bitacora}</ul>` : '<p class="vacio-texto">Sin cambios registrados.</p>'}
    <h2 class="seccion">${icono('descargar')} Exportar e importar</h2>
    <section class="tarjeta exportar">
      <p class="aviso-datos">${icono('escudo')} ${esc(AVISO_EXPORTAR)}</p>
      <div class="acciones dos">
        <button class="btn btn-primario" type="button" id="exportar"${tieneContenido(v) ? '' : ' disabled'}>${icono('descargar')} Exportar este episodio (JSON)</button>
        <label class="btn" for="importar">${icono('subir')} Importar un episodio</label>
      </div>
      <input id="importar" class="sr" type="file" accept="application/json,.json">
      <div id="vista-importacion" hidden></div>
      <p class="discreto">La importación agrega el episodio a los episodios cerrados; nunca reemplaza el episodio en curso. No hay sincronización con ningún servidor.</p>
    </section>
    <h2 class="seccion">${icono('archivo')} Episodios cerrados</h2>
    ${archivados.length ? `<ul class="lista-episodios">${archivados.map((e) => {
      const ep = episodioDe(e);
      const f = fechasEvaluacion(e);
      return `
        <li class="tarjeta episodio-arch">
          <div><span class="ep-codigo chico">${esc(ep.codigo)}</span>${ep.etiqueta ? ` <span class="discreto">${esc(ep.etiqueta)}</span>` : ''}
            <span class="discreto ep-fechas">${ep.abierto ? `desde ${esc(fechaCorta(ep.abierto))}` : ''}${ep.cerrado ? ` hasta ${esc(fechaCorta(ep.cerrado))}` : ''} · ${plural(e.resultados.length, 'resultado', 'resultados')}${f.length ? ` · ${plural(f.length, 'fecha de evaluación', 'fechas de evaluación')}` : ''}</span></div>
          <div class="ep-acciones">
            <button class="btn btn-chico" type="button" data-abrir-ep="${esc(e.id)}">${icono('carpeta')} Abrir</button>
            <button class="btn btn-chico" type="button" data-exportar-ep="${esc(e.id)}">${icono('descargar')} Exportar</button>
            <button class="btn btn-chico" type="button" data-borrar-ep="${esc(e.id)}">${icono('borrar')} Borrar</button>
          </div>
        </li>`;
    }).join('')}</ul>
      <p class="discreto">Se conservan hasta ${MAX_EPISODIOS} episodios en este navegador. Al abrir uno, el episodio en curso pasa a esta lista si tiene contenido.</p>`
      : '<p class="vacio-texto">Sin episodios cerrados en este navegador.</p>'}`;
}

export function renderSeguimiento() {
  return `
    <section class="vista seguimiento">
      <a class="migas" href="#/">${icono('atras')} Inicio</a>
      <header class="cabecera cabecera-dominio">
        <span class="ico-dominio grande">${icono('historial')}</span>
        <div>
          <p class="ceja">Atención</p>
          <h1>Seguimiento</h1>
          <p class="entradilla">Episodio, evolución de las mediciones, revaloraciones y estado del plan. Todo se guarda solo en este navegador.</p>
        </div>
      </header>
      <div id="panel-seguimiento">${htmlSeguimiento()}</div>
    </section>`;
}

function descargar(nombre, texto) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function montarSeguimiento(rerender, alCambiar) {
  const panel = $('#panel-seguimiento');
  const hoy = hoyISO();
  let importable = null;
  const redibujar = (enfocar = null) => {
    panel.innerHTML = htmlSeguimiento();
    conectar();
    alCambiar();
    if (enfocar) panel.querySelector(enfocar)?.focus({ preventScroll: true });
  };
  const exportar = (v) => {
    descargar(nombreArchivo(v, hoy), JSON.stringify(exportarEpisodio(v, VERSION), null, 2));
    aviso('Episodio exportado');
  };
  function conectar() {
    conectarQuitar(panel, { redibujar });
    const cerrar = $('#cerrar-episodio', panel);
    if (cerrar) confirmarEnDosToques(cerrar, {
      texto: `${icono('alerta')} Toca otra vez para cerrar y archivar el episodio`,
      accion: () => {
        const v = almacen.valoracion();
        cerrarEpisodio(v, hoy);
        almacen.guardarValoracion(v);
        almacen.archivarYNueva();
        alCambiar();
        rerender();
        aviso('Episodio cerrado y archivado; empieza uno nuevo');
      },
    });
    $('#reabrir-episodio', panel)?.addEventListener('click', () => {
      const v = almacen.valoracion();
      reabrirEpisodio(v);
      almacen.guardarValoracion(v);
      redibujar('#cerrar-episodio');
      aviso('Episodio reabierto');
    });
    $('#ep-etiqueta', panel)?.addEventListener('change', (ev) => {
      const v = almacen.valoracion();
      fijarEtiquetaEpisodio(v, ev.target.value);
      almacen.guardarValoracion(v);
      aviso('Etiqueta guardada');
    });
    const exp = $('#exportar', panel);
    if (exp && !exp.disabled) confirmarEnDosToques(exp, { texto: `${icono('alerta')} Toca otra vez para descargar el archivo`, accion: () => exportar(almacen.valoracion()) });
    $$('[data-exportar-ep]', panel).forEach((b) => confirmarEnDosToques(b, {
      texto: `${icono('alerta')} Confirmar`,
      accion: () => { const e = almacen.episodios().find((x) => x.id === b.dataset.exportarEp); if (e) exportar(e); },
    }));
    $$('[data-abrir-ep]', panel).forEach((b) => confirmarEnDosToques(b, {
      texto: `${icono('alerta')} Confirmar`,
      accion: () => { if (almacen.abrirEpisodio(b.dataset.abrirEp)) { alCambiar(); rerender(); aviso('Episodio abierto'); } },
    }));
    $$('[data-borrar-ep]', panel).forEach((b) => confirmarEnDosToques(b, {
      texto: `${icono('alerta')} Borrar`,
      accion: () => { almacen.borrarEpisodio(b.dataset.borrarEp); redibujar(); aviso('Episodio borrado de este navegador'); },
    }));
    $('#importar', panel)?.addEventListener('change', (ev) => {
      const archivo = ev.target.files?.[0];
      const caja = $('#vista-importacion', panel);
      importable = null;
      if (!archivo) return;
      if (archivo.size > 2 * 1024 * 1024) { caja.hidden = false; caja.innerHTML = '<p class="error-campo">El archivo es demasiado grande para un episodio de Huella.</p>'; return; }
      const lector = new FileReader();
      lector.onload = () => {
        let datos = null;
        try { datos = JSON.parse(String(lector.result)); } catch { datos = null; }
        const r = validarImportacion(datos, porId);
        caja.hidden = false;
        if (!r.ok) { caja.innerHTML = `<p class="error-campo" role="alert">${r.errores.map(esc).join(' ')}</p>`; return; }
        importable = r.valoracion;
        const existentes = [almacen.valoracion(), ...almacen.episodios()].map((e) => episodioDe(e).codigo);
        if (existentes.includes(r.resumen.codigo)) r.avisos.push(`Ya hay un episodio con el código ${r.resumen.codigo} en este navegador: se agregará como otra copia.`);
        caja.innerHTML = `
          <div class="importacion">
            <p><strong>${esc(r.resumen.codigo)}</strong> · ${plural(r.resumen.resultados, 'resultado', 'resultados')}${r.resumen.fechas.length ? ` · ${esc(r.resumen.fechas.map(fechaCorta).join(', '))}` : ''}</p>
            ${r.avisos.length ? `<ul>${r.avisos.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
            <button class="btn btn-chico btn-primario" type="button" id="confirmar-importacion">${icono('subir')} Agregar a episodios cerrados</button>
          </div>`;
        const b = $('#confirmar-importacion', caja);
        confirmarEnDosToques(b, {
          texto: `${icono('alerta')} Toca otra vez para importar`,
          accion: () => {
            if (!importable) return;
            const ok = almacen.importarEpisodio(importable);
            if (!ok) { aviso(`Ya hay ${MAX_EPISODIOS} episodios: borra alguno antes de importar`); return; }
            redibujar();
            aviso('Episodio importado a episodios cerrados');
          },
        });
      };
      lector.readAsText(archivo);
    });
  }
  conectarPlan(panel, { redibujar, alCambiar });
  conectar();
}
