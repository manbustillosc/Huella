// NPI-Q: registro por dominio (presencia, gravedad y angustia del cuidador). Huella no reproduce las preguntas.
const DOMINIOS_NPI = [
  ['delirios', 'Ideas delirantes'],
  ['alucinaciones', 'Alucinaciones'],
  ['agitacion', 'Agitación o agresividad'],
  ['depresion', 'Depresión o disforia'],
  ['ansiedad', 'Ansiedad'],
  ['euforia', 'Euforia o júbilo'],
  ['apatia', 'Apatía o indiferencia'],
  ['desinhibicion', 'Desinhibición'],
  ['irritabilidad', 'Irritabilidad o labilidad'],
  ['motora', 'Conducta motora aberrante'],
  ['sueno', 'Sueño y conducta nocturna'],
  ['apetito', 'Apetito y alimentación'],
].map(([id, nombre]) => ({ id, nombre }));

const GRAVEDAD = ['Leve', 'Moderada', 'Grave'];
const ANGUSTIA = ['Nada', 'Mínima', 'Leve', 'Moderada', 'Grave', 'Extrema'];

const presente = (r, id) => r[id] === 0;

const campos = DOMINIOS_NPI.flatMap((d) => [
  { id: d.id, texto: d.nombre, textoCorto: d.nombre.toLowerCase(), puntua: false, compacto: true, opciones: [{ texto: 'Sí', valor: 1 }, { texto: 'No', valor: 0 }] },
  {
    id: `${d.id}_g`, texto: `${d.nombre}: gravedad`, textoCorto: 'gravedad', puntua: false,
    opciones: GRAVEDAD.map((t, i) => ({ texto: `${i + 1} · ${t}`, valor: i + 1 })), visibleSi: (r) => presente(r, d.id),
  },
  {
    id: `${d.id}_a`, texto: `${d.nombre}: angustia del cuidador`, textoCorto: 'angustia', puntua: false,
    opciones: ANGUSTIA.map((t, i) => ({ texto: `${i} · ${t}`, valor: i })), visibleSi: (r) => presente(r, d.id),
  },
]);

const SIN = {
  id: 'sin', rango: 'Ninguno presente', etiqueta: 'Sin síntomas neuropsiquiátricos referidos', nivel: 'bien',
  texto: 'El informante no refiere síntomas neuropsiquiátricos en el último mes.', sugerencias: [],
};
const CON = {
  id: 'con', rango: 'Uno o más presentes', etiqueta: 'Síntomas neuropsiquiátricos presentes', nivel: 'moderado', hallazgo: true,
  texto: 'El informante refiere síntomas neuropsiquiátricos. La gravedad y la angustia del cuidador se informan por separado; no hay punto de corte validado para los totales.',
  sugerencias: [
    'Buscar desencadenantes tratables: dolor, delirium, infección, estreñimiento, fármacos, déficit sensorial y cambios en el entorno o la rutina.',
    'Priorizar intervenciones no farmacológicas y orientar al cuidador; reservar los psicofármacos para síntomas graves o de riesgo, con revisión periódica.',
    'Valorar la carga del cuidador (Zarit).',
  ],
};

export default {
  id: 'npiq',
  nombre: 'Inventario neuropsiquiátrico, cuestionario breve (NPI-Q)',
  corto: 'NPI-Q',
  dominio: 'delirium',
  tipo: 'evaluacion',
  registro: true,
  aliases: ['Neuropsychiatric Inventory Questionnaire', 'NPI', 'Cummings', 'sintomas conductuales', 'SCPD', 'conducta en demencia'],
  problemas: ['agitación', 'conducta', 'demencia', 'alucinaciones', 'apatía', 'cuidador'],
  descripcion: 'Registro de 12 dominios neuropsiquiátricos con presencia, gravedad (1 a 3) y angustia del cuidador (0 a 5).',
  objetivo: 'Identificar síntomas neuropsiquiátricos en la demencia, su gravedad y la angustia que causan al cuidador, y seguir su evolución.',
  poblacion: 'Personas con demencia, a través de un informante que convive con ellas (Kaufer, 2000); versión española validada por Boada et al. (2002).',
  aplicacion: [
    'El cuestionario oficial lo responde un informante que conoce bien a la persona, sobre el último mes. Huella no reproduce las preguntas.',
    'Para cada dominio presente, registra la gravedad (1 leve, 2 moderada, 3 grave) y la angustia del cuidador (0 nada a 5 extrema).',
    'No anotes el nombre del informante.',
  ],
  tiempo: '5 a 10 min',
  direccionClinica: 'menor_mejor',
  textoMejoria: 'menor gravedad de los síntomas',
  textoEmpeoramiento: 'mayor gravedad de los síntomas',
  barra: false,
  min: 0,
  max: 36,
  siguientes: [
    { id: 'zarit', si: (res) => !res.noEvaluable && res.extras?.angustia > 0, motivo: 'El cuidador refiere angustia: valora su sobrecarga.' },
  ],
  campos,
  bandas: [SIN, CON],
  calcular({ v }) {
    const pres = DOMINIOS_NPI.filter((d) => v[d.id].valor === 1).map((d) => ({ ...d, g: v[`${d.id}_g`].valor, a: v[`${d.id}_a`].valor }));
    const gravedad = pres.reduce((s, x) => s + x.g, 0);
    const angustia = pres.reduce((s, x) => s + x.a, 0);
    const lineas = [];
    if (pres.length) {
      const orden = [...pres].sort((x, y) => y.g - x.g || y.a - x.a);
      const maxG = orden[0].g;
      const predominan = orden.filter((x) => x.g === maxG);
      lineas.push(`${pres.length} de 12 dominios presentes. Gravedad total ${gravedad}/36; angustia del cuidador ${angustia}/60.`);
      lineas.push(`Predomina${predominan.length > 1 ? 'n' : ''}: ${predominan.map((x) => `${x.nombre.toLowerCase()} (${GRAVEDAD[x.g - 1].toLowerCase()})`).join(', ')}.`);
      lineas.push(`Detalle: ${orden.map((x) => `${x.nombre.toLowerCase()} G${x.g}/A${x.a}`).join('; ')}.`);
      const angustiantes = pres.filter((x) => x.a >= 4);
      if (angustiantes.length) lineas.push(`Angustia grave o extrema del cuidador por: ${angustiantes.map((x) => x.nombre.toLowerCase()).join(', ')}.`);
    }
    return {
      banda: pres.length ? CON : SIN,
      puntaje: gravedad,
      max: 36,
      sufijo: '/ 36 de gravedad',
      lineas,
      lineasNota: lineas,
      extras: {
        presentes: pres.map((x) => x.id),
        gravedad,
        angustia,
        detalle: Object.fromEntries(pres.map((x) => [x.id, { g: x.g, a: x.a }])),
      },
    };
  },
  resumen(res) {
    const e = res.extras;
    if (!e.presentes.length) return 'NPI-Q: sin síntomas neuropsiquiátricos referidos (gravedad 0/36; angustia 0/60).';
    return `NPI-Q: ${e.presentes.length} ${e.presentes.length === 1 ? 'dominio presente' : 'dominios presentes'}; gravedad ${e.gravedad}/36; angustia del cuidador ${e.angustia}/60.`;
  },
  resumenBreve(res) {
    const e = res.extras;
    return e.presentes.length
      ? `NPI-Q ${e.presentes.length} ${e.presentes.length === 1 ? 'dominio' : 'dominios'}, gravedad ${e.gravedad}/36, angustia ${e.angustia}/60`
      : 'NPI-Q sin síntomas referidos';
  },
  detalleEnResumen: true,
  cambioExtra(antes, despues) {
    const a = antes.extras;
    const d = despues.extras;
    if (!a?.presentes || !d?.presentes) return [];
    const nombre = (id) => DOMINIOS_NPI.find((x) => x.id === id)?.nombre.toLowerCase() || id;
    const nuevos = d.presentes.filter((id) => !a.presentes.includes(id));
    const resueltos = a.presentes.filter((id) => !d.presentes.includes(id));
    const out = [];
    if (a.angustia !== d.angustia) out.push(`Angustia del cuidador de ${a.angustia} a ${d.angustia} de 60.`);
    if (nuevos.length) out.push(`Síntomas nuevos: ${nuevos.map(nombre).join(', ')}.`);
    if (resueltos.length) out.push(`Síntomas que ya no se refieren: ${resueltos.map(nombre).join(', ')}.`);
    return out;
  },
  notas: [
    'La gravedad (0 a 36) y la angustia del cuidador (0 a 60) se suman por separado y no se combinan. No hay puntos de corte validados.',
    'Depende del informante: refleja lo que observa y cómo le afecta; conviene repetirlo con el mismo informante para comparar.',
    'Las ideas delirantes, las alucinaciones y la agitación de inicio agudo obligan a descartar delirium.',
    'La apatía no es depresión: el NPI-Q las registra en dominios separados.',
  ],
  licencia: { texto: 'NPI-Q © Jeffrey L. Cummings. Reproducción y uso sujetos a permiso del titular (npitest.net); Huella registra solo los resultados por dominio.', enlace: 'https://npitest.net' },
  referencias: [
    { texto: 'Kaufer DI, Cummings JL, Ketchel P, et al. Validation of the NPI-Q, a brief clinical form of the Neuropsychiatric Inventory. J Neuropsychiatry Clin Neurosci. 2000;12(2):233-9.', doi: '10.1176/jnp.12.2.233' },
    { texto: 'Boada M, Cejudo JC, Tàrraga L, López OL, Kaufer D. Neuropsychiatric Inventory Questionnaire (NPI-Q): validación española de una forma abreviada del Neuropsychiatric Inventory (NPI). Neurologia. 2002;17(6):317-23.' },
  ],
};
