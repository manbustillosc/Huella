// Piezas de interfaz compartidas por las vistas.
import { icono } from './iconos.js';
import { almacen } from './almacen.js';
import { porId, dominioDe, escalasDe } from './datos.js';
import { TIPOS, CLASES, claseDe, TEXTO_REGISTRO } from './motor.js';
import { valorGuardado } from './nota.js';
import { vigenteDe, etiquetaAplicacion, fechaCorta } from './comparacion.js';

export { icono };
export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const sinAcentos = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
export const movimientoReducido = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const ETIQUETA_COPIAR = { parrafo: 'Copiar en párrafo', lista: 'Copiar en lista', completa: 'Copiar nota completa' };
const FORMATOS = { parrafo: ['parrafo', 'Párrafo'], lista: ['lista', 'Lista'], completa: ['valoracion', 'Completa'] };

export function selectorFormato(formato, opciones = ['parrafo', 'lista']) {
  return `
    <div class="segmentado" role="radiogroup" aria-label="Formato del texto">
      ${opciones.map((valor) => {
        const [ico, texto] = FORMATOS[valor];
        return `<label><input type="radio" name="formato-nota" id="formato-${valor}" value="${valor}"${formato === valor ? ' checked' : ''}>${icono(ico)}${texto}</label>`;
      }).join('')}
    </div>`;
}

export function alCambiarFormato(raiz, actualizar) {
  $$('input[name="formato-nota"]', raiz).forEach((input) =>
    input.addEventListener('change', () => {
      almacen.guardarFormato(input.value);
      actualizar(input.value);
    }));
}

export function botonEstrella(id) {
  const fav = almacen.favoritas().includes(id);
  const nombre = porId[id].corto;
  return `<button class="btn-icono btn-estrella" type="button" data-fav="${id}" aria-pressed="${fav}" aria-label="${fav ? 'Quitar de' : 'Agregar a'} favoritas: ${esc(nombre)}">${icono('estrella')}</button>`;
}

export function chipTipo(e, { detallado = false } = {}) {
  const clase = claseDe(e);
  const nombre = detallado ? TIPOS[e.tipo] : CLASES[clase].nombre;
  const registro = e.registro ? `<span class="chip-tipo chip-registro" title="Instrumento con titular de derechos: se captura el resultado sin reproducir los reactivos.">${esc(TEXTO_REGISTRO)}</span>` : '';
  return `<span class="chip-tipo clase-${clase}" title="${esc(CLASES[clase].ayuda)}"><span class="chip-marca" aria-hidden="true"></span>${esc(nombre)}</span>${registro}`;
}

// Estado del instrumento en la valoración en curso: resultado vigente o sin aplicar.
export function estadoEnValoracion(e) {
  const rs = almacen.resultadosDe(e.id);
  if (!rs.length) return { hecho: false, texto: 'Sin aplicar en esta valoración' };
  const vig = vigenteDe(rs);
  const cuando = etiquetaAplicacion(vig) || (vig.fecha ? fechaCorta(vig.fecha) : '');
  const n = rs.length > 1 ? ` · ${rs.length} aplicaciones` : '';
  return { hecho: true, texto: `En la valoración${cuando ? ` (${cuando})` : ''}: ${valorGuardado(vig)}${n}` };
}

export function filaEscala(e, { conDominio = false, detalle = false, estado = true } = {}) {
  const meta = [conDominio ? dominioDe(e.dominio).nombre : null, e.tiempo].filter(Boolean).join(' · ');
  const st = estado ? estadoEnValoracion(e) : null;
  const indicado = detalle && e.problemas?.length ? `<span class="fila-indicado">Útil en: ${esc(e.problemas.slice(0, 4).join(', '))}</span>` : '';
  return `
    <div class="fila-escala">
      <a class="fila-enlace" href="#/e/${e.id}">
        <span class="fila-texto">
          <span class="fila-nombre">${esc(e.nombre)}</span>
          <span class="fila-desc">${esc(e.descripcion)}</span>
          ${indicado}
          <span class="fila-etiquetas">${chipTipo(e)}<span class="fila-meta">${esc(meta)}</span></span>
          ${st ? `<span class="fila-estado${st.hecho ? ' hecho' : ''}">${icono(st.hecho ? 'completo' : 'pendiente')} ${esc(st.texto)}</span>` : ''}
        </span>
        ${detalle ? `<span class="fila-aplicar" aria-hidden="true">${st?.hecho ? 'Repetir' : 'Aplicar'}</span>` : icono('adelante', 'chev')}
      </a>
      ${botonEstrella(e.id)}
    </div>`;
}

export function tarjetaDominio(d) {
  const n = escalasDe(d.id).length;
  return `
    <a class="tarjeta-dominio${n ? '' : ' vacio'}" href="#/d/${d.id}">
      <span class="ico-dominio">${icono(d.id)}</span>
      <span class="dom-nombre">${esc(d.nombre)}</span>
      <span class="dom-cuenta">${n ? plural(n, 'instrumento', 'instrumentos') : 'Próximamente'}</span>
    </a>`;
}

let temporizadorAviso;
export function aviso(mensaje) {
  const el = $('#aviso');
  el.textContent = mensaje;
  el.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.classList.remove('visible'), 2400);
}

export async function copiar(texto, mensaje = 'Copiado al portapapeles') {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  aviso(mensaje);
}

// Botón que pide un segundo toque para confirmar una acción destructiva.
export function confirmarEnDosToques(boton, { texto, accion, espera = 4000 }) {
  let armado = null;
  const original = boton.innerHTML;
  boton.addEventListener('click', (ev) => {
    if (!armado) {
      ev.preventDefault();
      boton.innerHTML = texto;
      boton.classList.add('armado');
      armado = setTimeout(() => {
        armado = null;
        boton.innerHTML = original;
        boton.classList.remove('armado');
      }, espera);
      return;
    }
    clearTimeout(armado);
    armado = null;
    boton.classList.remove('armado');
    accion(ev);
  });
}
