// Motor de cálculo: convierte las respuestas en puntaje, banda de interpretación y texto para el expediente.

const NIVELES = ['bien', 'leve', 'moderado', 'grave', 'critico'];

export function normalizarEscala(escala) {
  const items = escala.items.map((item) => {
    if (item.tipo !== 'sino') return item;
    const si = item.puntua === 'si' ? 1 : 0;
    return {
      ...item,
      compacto: true,
      opciones: [
        { texto: 'Sí', valor: si },
        { texto: 'No', valor: 1 - si },
      ],
    };
  });
  return { ...escala, items };
}

export function bandaDe(escala, puntaje) {
  return escala.bandas.find((b) => puntaje >= b.min && puntaje <= b.max) || null;
}

export function calcular(escala, respuestas = {}) {
  let puntaje = 0;
  const faltan = [];
  const desglose = [];
  const presentes = [];
  for (const item of escala.items) {
    const idx = respuestas[item.id];
    const opcion = idx == null ? null : item.opciones[idx];
    if (!opcion) {
      faltan.push(item.id);
      continue;
    }
    puntaje += opcion.valor;
    desglose.push({ item, opcion });
    if (item.compacto && opcion.valor > 0) presentes.push(item.texto);
  }
  const completo = faltan.length === 0;
  return {
    puntaje,
    max: escala.max,
    total: escala.items.length,
    contestadas: escala.items.length - faltan.length,
    faltan,
    completo,
    desglose,
    presentes,
    banda: completo ? bandaDe(escala, puntaje) : null,
  };
}

const minusculaInicial = (t) => t.charAt(0).toLowerCase() + t.slice(1);

export function resumenDe(escala, resultado) {
  if (escala.resumen) return escala.resumen(resultado);
  return `${escala.corto}: ${resultado.puntaje}/${resultado.max} (${minusculaInicial(resultado.banda.etiqueta)}).`;
}

// Versión compacta, sin punto final, para la nota en párrafo: «Barthel 90/100 (dependencia moderada)».
export function resumenBreveDe(escala, resultado) {
  if (escala.resumenBreve) return escala.resumenBreve(resultado);
  return `${escala.corto} ${resultado.puntaje}/${resultado.max} (${minusculaInicial(resultado.banda.etiqueta)})`;
}

// Posición del marcador en una barra de bandas de igual ancho (0–1).
export function posicionMarcador(escala, puntaje) {
  const n = escala.bandas.length;
  const i = escala.bandas.findIndex((b) => puntaje >= b.min && puntaje <= b.max);
  if (i < 0) return 0;
  const b = escala.bandas[i];
  const fraccion = b.max === b.min ? 0.5 : (puntaje - b.min) / (b.max - b.min);
  return (i + 0.1 + fraccion * 0.8) / n;
}

export function rangoTexto(banda) {
  return banda.min === banda.max ? `${banda.min}` : `${banda.min} a ${banda.max}`;
}

// Revisa que una escala esté bien definida: bandas sin huecos ni traslapes y que cubran min–max.
export function validarEscala(escala) {
  const errores = [];
  const e = normalizarEscala(escala);
  let min = 0;
  let max = 0;
  for (const item of e.items) {
    if (!item.opciones?.length) errores.push(`${item.id}: sin opciones`);
    const valores = item.opciones.map((o) => o.valor);
    min += Math.min(...valores);
    max += Math.max(...valores);
  }
  if (min !== e.min) errores.push(`min calculado ${min} ≠ declarado ${e.min}`);
  if (max !== e.max) errores.push(`max calculado ${max} ≠ declarado ${e.max}`);
  const bandas = [...e.bandas].sort((a, b) => a.min - b.min);
  if (bandas[0].min !== e.min) errores.push('la primera banda no empieza en el mínimo');
  if (bandas.at(-1).max !== e.max) errores.push('la última banda no termina en el máximo');
  for (let i = 1; i < bandas.length; i++) {
    if (bandas[i].min !== bandas[i - 1].max + 1) errores.push(`hueco o traslape entre ${bandas[i - 1].etiqueta} y ${bandas[i].etiqueta}`);
  }
  for (const b of e.bandas) if (!NIVELES.includes(b.nivel)) errores.push(`nivel desconocido: ${b.nivel}`);
  return errores;
}

const SEXO = { mujer: 'mujer', hombre: 'hombre' };
export const FORMATOS_NOTA = ['parrafo', 'lista'];

// Texto breve de un resultado guardado; reconstruye uno si se guardó con una versión anterior.
function breveGuardado(r, escalasPorId) {
  if (r.breve) return r.breve;
  const nombre = escalasPorId[r.escalaId]?.corto ?? r.escalaId;
  return `${nombre} ${r.puntaje}/${r.max} (${minusculaInicial(r.etiqueta)})`;
}

// formato 'lista': encabezado por dominio y un renglón por escala.
// formato 'parrafo': todo seguido, dominios separados por punto y escalas por punto y coma.
export function notaValoracion(valoracion, escalasPorId, dominios, fecha = new Date(), formato = 'lista') {
  const f = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const p = valoracion.paciente || {};
  const datos = [];
  if (p.sexo && SEXO[p.sexo]) datos.push(SEXO[p.sexo]);
  if (p.edad) datos.push(`${p.edad} años`);
  if (p.escolaridad !== undefined && p.escolaridad !== '') datos.push(`escolaridad ${p.escolaridad} años`);
  const grupos = dominios
    .map((d) => ({ d, rs: valoracion.resultados.filter((r) => escalasPorId[r.escalaId]?.dominio === d.id) }))
    .filter((g) => g.rs.length);

  if (formato === 'parrafo') {
    const partes = [`Valoración geriátrica ${f}.`];
    if (datos.length) partes.push(`Paciente: ${datos.join(', ')}.`);
    for (const { d, rs } of grupos) partes.push(`${d.nombre}: ${rs.map((r) => breveGuardado(r, escalasPorId)).join('; ')}.`);
    return partes.join(' ');
  }

  const lineas = [`VALORACIÓN GERIÁTRICA · ${f}`];
  if (datos.length) lineas.push(`Paciente: ${datos.join(', ')}.`);
  for (const { d, rs } of grupos) {
    lineas.push('', d.nombre.toUpperCase());
    for (const r of rs) lineas.push(`- ${r.resumen}`);
  }
  return lineas.join('\n');
}
