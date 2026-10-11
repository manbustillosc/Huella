import { SUG } from './_comun.js';

// Prueba del dibujo del reloj con los criterios de aplicación y puntuación de Cacho et al. (1999), a la orden y a la copia.
// Criterios resumidos con redacción propia; ante una duda, el artículo original.
const ESFERA = [
  { texto: '2 · Esfera normal', valor: 2, detalle: 'Circular u ovalada; se aceptan pequeñas distorsiones por temblor.' },
  { texto: '1 · Incompleta o distorsionada', valor: 1, detalle: 'Incompleta, con alguna distorsión significativa o muy asimétrica.' },
  { texto: '0 · Ausente o totalmente distorsionada', valor: 0 },
];
const NUMEROS = [
  { texto: '4 · Todos, en orden', valor: 4, detalle: 'Los 12 números en el orden correcto; como mucho, pequeños errores de posición en menos de 4 números (p. ej., un número en el espacio del número vecino).' },
  { texto: '3.5 · Pequeños errores de posición en 4 números o más', valor: 3.5, detalle: 'Todos presentes y en orden, con pequeños errores de posición en 4 números o más.' },
  { texto: '3 · Error de posición significativo o desorden leve', valor: 3, detalle: 'Todos presentes con un error de posición significativo (un número lejos de su lugar), o algunos números fuera de secuencia (menos de 4).' },
  { texto: '2 · Omisión, adición o gran desorganización', valor: 2, detalle: 'Falta o sobra algún número sin gran distorsión del resto; 4 números o más fuera de secuencia; los 12 en sentido contrario a las manecillas (rotación inversa); los 12 con gran distorsión espacial (fuera de la esfera o en media esfera), o los 12 alineados en una recta (alineación numérica).' },
  { texto: '1 · Faltan o sobran números, con gran distorsión', valor: 1, detalle: 'Números de menos o de más con gran distorsión espacial, o alineación o rotación inversa con números de menos o de más.' },
  { texto: '0 · Ausentes o menos de 6 números', valor: 0 },
];
const MANECILLAS = [
  { texto: '4 · Posición y proporción correctas', valor: 4, detalle: 'Marcan la hora pedida y la de las horas es más corta que la de los minutos.' },
  { texto: '3.5 · Posición correcta, del mismo tamaño', valor: 3.5, detalle: 'Marcan la hora pedida, pero las dos tienen el mismo tamaño.' },
  { texto: '3 · Pequeños errores', valor: 3, detalle: 'Una manecilla en el espacio del número anterior o siguiente, o el minutero más corto que el horario con la hora correcta.' },
  { texto: '2 · Gran distorsión, o no se unen y la hora es correcta', valor: 2, detalle: 'Gran distorsión en la posición (aunque marquen la hora, si los números tienen errores de posición significativos), o manecillas que no se unen en el centro pero marcan la hora correcta.' },
  { texto: '1 · No se unen y la hora es incorrecta, o una sola', valor: 1, detalle: 'Manecillas que no se unen en el centro y marcan una hora incorrecta, o una sola manecilla o un esbozo de las dos.' },
  { texto: '0 · Ausentes o perseveración', valor: 0, detalle: 'Sin manecillas, o perseveración al dibujarlas (efecto de «rueda de carro»).' },
];
const SIGNOS = [
  { id: 'rotacion', texto: 'Rotación inversa (números en sentido contrario)' },
  { id: 'alineacion', texto: 'Alineación numérica (números en una recta)' },
  { id: 'perseveracion', texto: 'Perseveración (números o manecillas repetidos)' },
];
const CORTE = { orden: 6, copia: 8, ambas: 15 };
const conOrden = (r) => r.condicion === 0 || r.condicion === 2;
const conCopia = (r) => r.condicion === 1 || r.condicion === 2;
const f1 = (n) => String(n).replace(/\.0$/, '');

const POSITIVO = {
  id: 'positivo', rango: 'Orden ≤6 · copia ≤8', etiqueta: 'Por debajo del punto de corte', nivel: 'moderado', hallazgo: true,
  texto: 'Puntaje igual o menor que el punto de corte de Cacho et al. (1999): sugiere deterioro cognitivo y amerita una evaluación más amplia. No establece el diagnóstico.',
  sugerencias: [SUG.cognitivaCompleta, SUG.descartarDelirium, SUG.causasReversibles],
};
const NEGATIVO = {
  id: 'negativo', rango: 'Orden >6 · copia >8', etiqueta: 'Por encima del punto de corte', nivel: 'bien',
  texto: 'Puntaje mayor que el punto de corte. No descarta deterioro cognitivo, en especial el leve: si hay queja o sospecha clínica, completa la evaluación.',
  sugerencias: ['Si hay queja cognitiva o sospecha clínica, completar la evaluación (p. ej., MoCA o MMSE).'],
};

export default {
  id: 'reloj',
  nombre: 'Prueba del dibujo del reloj (criterios de Cacho)',
  corto: 'Prueba del reloj',
  dominio: 'cognitivo',
  tipo: 'tamizaje',
  aliases: ['test del reloj', 'dibujo del reloj', 'clock drawing test', 'CDT', 'TDR', 'Cacho', 'reloj a la orden', 'reloj a la copia'],
  problemas: ['deterioro cognitivo', 'demencia', 'función ejecutiva', 'praxis visuoconstructiva', 'enfermedad de Alzheimer'],
  descripcion: 'Dibujo de un reloj a la orden y a la copia: esfera (2), números (4) y manecillas (4) por condición, de 0 a 10, con los criterios de Cacho et al. (1999).',
  objetivo: 'Tamizaje de deterioro cognitivo que explora función ejecutiva, planeación, memoria semántica y praxis visuoconstructiva.',
  poblacion: 'Personas mayores con sospecha de deterioro cognitivo. Validada en España en personas sanas y con enfermedad de Alzheimer leve (Cacho, 1999). La escolaridad baja reduce el puntaje.',
  aplicacion: [
    'Material: hojas en blanco y lápiz o bolígrafo. En la versión de Cacho la persona dibuja también la esfera: no uses un círculo impreso.',
    'A la orden: pídele que dibuje un reloj redondo y grande, con todos sus números, y con las manecillas marcando las once y diez. Puedes repetir la instrucción; no hay límite de tiempo y puede corregir.',
    'A la copia: en otra hoja, muéstrale un reloj dibujado que marque las once y diez y pídele que lo copie lo más exacto posible.',
    'Puntúa cada dibujo por separado: esfera (0 a 2), números (0 a 4) y manecillas (0 a 4). En cada opción se describe qué cuenta.',
    'Si observas rotación inversa, alineación numérica o perseveración, márcalas: según los autores sugieren deterioro cognitivo.',
  ],
  tiempo: '3 a 5 min',
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejor dibujo',
  textoEmpeoramiento: 'peor dibujo',
  decimalesCambio: 1,
  barra: false,
  min: 0,
  max: 10,
  campos: [
    {
      id: 'condicion', texto: 'Condición aplicada', textoCorto: 'condición', puntua: false,
      opciones: [
        { texto: 'A la orden', valor: 0, detalle: 'La más validada (punto de corte 6).' },
        { texto: 'A la copia', valor: 1, detalle: 'Punto de corte 8.' },
        { texto: 'A la orden y a la copia', valor: 2, detalle: 'Recomendada: compara planeación y copia.' },
      ],
    },
    { id: 'o_esfera', texto: 'A la orden · esfera', textoCorto: 'orden, esfera', puntua: false, grupo: 'Reloj a la orden', visibleSi: conOrden, opciones: ESFERA },
    { id: 'o_numeros', texto: 'A la orden · números', textoCorto: 'orden, números', puntua: false, visibleSi: conOrden, opciones: NUMEROS },
    { id: 'o_manecillas', texto: 'A la orden · manecillas', textoCorto: 'orden, manecillas', puntua: false, visibleSi: conOrden, opciones: MANECILLAS },
    { id: 'c_esfera', texto: 'A la copia · esfera', textoCorto: 'copia, esfera', puntua: false, grupo: 'Reloj a la copia', visibleSi: conCopia, opciones: ESFERA },
    { id: 'c_numeros', texto: 'A la copia · números', textoCorto: 'copia, números', puntua: false, visibleSi: conCopia, opciones: NUMEROS },
    { id: 'c_manecillas', texto: 'A la copia · manecillas', textoCorto: 'copia, manecillas', puntua: false, visibleSi: conCopia, opciones: MANECILLAS },
    {
      id: 'signos', tipo: 'checklist', texto: 'Signos cualitativos (en cualquiera de los dibujos)', textoCorto: 'signos cualitativos', opcional: true,
      ayuda: 'Opcional. Marca los que observes.',
      opciones: SIGNOS,
    },
  ],
  bandas: [POSITIVO, NEGATIVO],
  calcular({ v }) {
    const c = v.condicion.valor;
    const orden = c === 0 || c === 2 ? v.o_esfera.valor + v.o_numeros.valor + v.o_manecillas.valor : null;
    const copia = c === 1 || c === 2 ? v.c_esfera.valor + v.c_numeros.valor + v.c_manecillas.valor : null;
    const principal = orden ?? copia;
    const condicion = orden != null ? 'orden' : 'copia';
    const positivo = principal <= CORTE[condicion];
    const lineas = [];
    if (orden != null) lineas.push(`A la orden: ${f1(orden)}/10 (esfera ${v.o_esfera.valor}, números ${f1(v.o_numeros.valor)}, manecillas ${f1(v.o_manecillas.valor)}); punto de corte ≤${CORTE.orden}: ${orden <= CORTE.orden ? 'positivo' : 'negativo'}.`);
    if (copia != null) lineas.push(`A la copia: ${f1(copia)}/10 (esfera ${v.c_esfera.valor}, números ${f1(v.c_numeros.valor)}, manecillas ${f1(v.c_manecillas.valor)}); punto de corte ≤${CORTE.copia}: ${copia <= CORTE.copia ? 'positivo' : 'negativo'}.`);
    if (orden != null && copia != null) {
      const suma = orden + copia;
      lineas.push(`Orden + copia: ${f1(suma)}/20; punto de corte ≤${CORTE.ambas}: ${suma <= CORTE.ambas ? 'positivo' : 'negativo'}.`);
      if (copia - orden >= 2) lineas.push('La copia es claramente mejor que el dibujo a la orden: patrón que sugiere más afectación de la planeación y de la memoria semántica que de la praxis.');
    }
    const signos = Array.isArray(v.signos) ? v.signos : [];
    const textos = SIGNOS.filter((s) => signos.includes(s.id)).map((s) => s.texto.split(' (')[0].toLowerCase());
    if (textos.length) lineas.push(`Signos cualitativos: ${textos.join(', ')}; según los autores sugieren deterioro cognitivo.`);
    return {
      puntaje: principal,
      max: 10,
      mostrar: f1(principal),
      sufijo: `/ 10 · ${condicion === 'orden' ? 'a la orden' : 'a la copia'}`,
      banda: positivo ? POSITIVO : NEGATIVO,
      lineas,
      lineasNota: lineas,
      extras: { orden, copia, condicion, signos },
    };
  },
  resumen(res) {
    const e = res.extras;
    const partes = [];
    if (e.orden != null) partes.push(`a la orden ${f1(e.orden)}/10`);
    if (e.copia != null) partes.push(`a la copia ${f1(e.copia)}/10`);
    return `Prueba del reloj (Cacho): ${partes.join(', ')} (${res.banda.etiqueta.toLowerCase()}).`;
  },
  resumenBreve: (res) => `Reloj ${res.extras.orden != null ? `orden ${f1(res.extras.orden)}/10` : ''}${res.extras.orden != null && res.extras.copia != null ? ', ' : ''}${res.extras.copia != null ? `copia ${f1(res.extras.copia)}/10` : ''} (${res.banda.etiqueta.toLowerCase()})`,
  detalleEnResumen: true,
  comparable(a, b) {
    const ca = a.extras?.condicion;
    const cb = b.extras?.condicion;
    return ca && cb && ca !== cb ? { noInterpretable: 'una aplicación se puntuó a la orden y otra solo a la copia' } : null;
  },
  notas: [
    'Puntos de corte de Cacho et al. (1999): a la orden ≤6 (sensibilidad 92.8 %, especificidad 93.5 % para enfermedad de Alzheimer leve frente a personas sanas); a la copia ≤8 (sensibilidad 73.1 %, especificidad 90.6 %); orden más copia ≤15.',
    'Los puntajes cercanos a 8 o 9 a la orden ayudan a descartar la enfermedad, según los autores.',
    'Hay muchos sistemas de puntuación (Shulman, Sunderland, Mini-Cog y otros) con desempeño parecido; los puntajes no son intercambiables entre sistemas.',
    'La escolaridad baja, el analfabetismo, el déficit visual y la limitación motora reducen el puntaje: interpreta con ese contexto.',
    'Criterios resumidos con redacción propia a partir del artículo original; ante una duda de puntuación, consulta la publicación.',
  ],
  licencia: { texto: 'La prueba del reloj no tiene titular de derechos. Criterios de aplicación y puntuación publicados por Cacho et al. (1999), resumidos con redacción propia.' },
  referencias: [
    { texto: 'Cacho J, García-García R, Arcaya J, Vicente JL, Lantada N. Una propuesta de aplicación y puntuación del test del reloj en la enfermedad de Alzheimer. Rev Neurol. 1999;28(7):648-55.', enlace: 'https://pubmed.ncbi.nlm.nih.gov/10363287/' },
    { texto: 'Shulman KI. Clock-drawing: is it the ideal cognitive screening test? Int J Geriatr Psychiatry. 2000;15(6):548-61.', doi: '10.1002/1099-1166(200006)15:6<548::aid-gps242>3.0.co;2-u' },
  ],
};
