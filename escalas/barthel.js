import { REF_INGER_2022, SUG } from './_comun.js';

const SUG_DEPENDENCIA = [SUG.causaFuncional, SUG.rehabilitacion, SUG.cuidador];

export default {
  id: 'barthel',
  nombre: 'Índice de Barthel',
  corto: 'Barthel',
  dominio: 'funcional',
  tipo: 'evaluacion',
  aliases: ['ABVD', 'actividades basicas', 'dependencia', 'Mahoney'],
  problemas: ['dependencia funcional', 'deterioro funcional', 'hospitalización', 'rehabilitación', 'discapacidad', 'declive funcional'],
  descripcion: 'Actividades básicas de la vida diaria (ABVD): 10 actividades, de 0 a 100 puntos.',
  objetivo: 'Valorar el grado de independencia de la persona en 10 actividades básicas de la vida diaria.',
  poblacion: 'Desarrollado en pacientes en rehabilitación (Mahoney y Barthel, 1965). Ampliamente usado en personas mayores en consulta, hospitalización y cuidados de larga estancia; versión en español validada (Baztán, 1993).',
  aplicacion: [
    'Pregunta al paciente o al cuidador cómo realiza cada actividad habitualmente y, si es posible, obsérvalo.',
    'Puntúa lo que la persona hace, no lo que podría hacer.',
    'En hospitalización, registra por separado el estado basal (previo a la enfermedad aguda) y el actual para compararlos.',
  ],
  tiempo: '5 a 10 min',
  momentos: true,
  fuente: true,
  direccionClinica: 'mayor_mejor',
  textoMejoria: 'mejoría funcional en las ABVD',
  textoEmpeoramiento: 'deterioro funcional en las ABVD',
  min: 0,
  max: 100,
  textoEmpeoradas: 'actividades con menor puntaje que en la referencia',
  campos: [
    {
      id: 'comer', texto: 'Comer', textoCorto: 'comer',
      opciones: [
        { texto: 'Independiente', detalle: 'Usa cualquier utensilio y come en un tiempo razonable. La comida puede prepararla o servirla otra persona.', valor: 10 },
        { texto: 'Necesita ayuda', detalle: 'Para cortar la carne o el pan, untar mantequilla, etc., pero come solo.', valor: 5 },
        { texto: 'Dependiente', detalle: 'Depende de otra persona para comer.', valor: 0 },
      ],
    },
    {
      id: 'banarse', texto: 'Bañarse', textoCorto: 'bañarse',
      opciones: [
        { texto: 'Independiente', detalle: 'Se baña completo en regadera o tina; entra y sale sin ayuda ni supervisión.', valor: 5 },
        { texto: 'Dependiente', detalle: 'Necesita ayuda o supervisión.', valor: 0 },
      ],
    },
    {
      id: 'vestirse', texto: 'Vestirse', textoCorto: 'vestirse',
      opciones: [
        { texto: 'Independiente', detalle: 'Se pone y quita la ropa, se abotona y se ata los zapatos sin ayuda.', valor: 10 },
        { texto: 'Necesita ayuda', detalle: 'Realiza al menos la mitad de la tarea en un tiempo razonable.', valor: 5 },
        { texto: 'Dependiente', detalle: 'Necesita ayuda para la mayoría de las tareas.', valor: 0 },
      ],
    },
    {
      id: 'arreglarse', texto: 'Arreglarse (aseo personal)', textoCorto: 'aseo personal',
      opciones: [
        { texto: 'Independiente', detalle: 'Se lava cara y manos, se peina, se lava los dientes, se afeita o maquilla sin ayuda.', valor: 5 },
        { texto: 'Dependiente', detalle: 'Necesita alguna ayuda en alguna de estas actividades.', valor: 0 },
      ],
    },
    {
      id: 'deposicion', texto: 'Control de heces', textoCorto: 'control de heces',
      opciones: [
        { texto: 'Continente', detalle: 'Sin episodios de incontinencia. Si usa enemas o supositorios, se los administra solo.', valor: 10 },
        { texto: 'Incontinencia ocasional', detalle: 'Máximo un episodio por semana, o necesita ayuda con enemas o supositorios.', valor: 5 },
        { texto: 'Incontinente', detalle: 'Más de un episodio por semana.', valor: 0 },
      ],
    },
    {
      id: 'miccion', texto: 'Control de orina', textoCorto: 'control de orina',
      opciones: [
        { texto: 'Continente', detalle: 'Sin episodios de incontinencia. Si usa sonda o colector, se encarga solo de su cuidado.', valor: 10 },
        { texto: 'Incontinencia ocasional', detalle: 'Máximo un episodio en 24 h, o necesita ayuda con la sonda o el colector.', valor: 5 },
        { texto: 'Incontinente', detalle: 'Más de un episodio en 24 h.', valor: 0 },
      ],
    },
    {
      id: 'retrete', texto: 'Uso del retrete', textoCorto: 'uso del retrete',
      opciones: [
        { texto: 'Independiente', detalle: 'Se sienta, se levanta, se limpia y se acomoda la ropa solo.', valor: 10 },
        { texto: 'Necesita ayuda', detalle: 'Para mantener el equilibrio, limpiarse o ponerse y quitarse la ropa.', valor: 5 },
        { texto: 'Dependiente', detalle: 'Necesita ayuda completa.', valor: 0 },
      ],
    },
    {
      id: 'traslado', texto: 'Traslado cama–sillón', textoCorto: 'traslado cama–sillón',
      opciones: [
        { texto: 'Independiente', detalle: 'No necesita ayuda; si usa silla de ruedas, se traslada solo.', valor: 15 },
        { texto: 'Mínima ayuda', detalle: 'Supervisión o una pequeña ayuda física.', valor: 10 },
        { texto: 'Gran ayuda', detalle: 'Ayuda de una persona fuerte o entrenada; se mantiene sentado sin ayuda.', valor: 5 },
        { texto: 'Dependiente', detalle: 'Necesita dos personas o grúa; no se mantiene sentado.', valor: 0 },
      ],
    },
    {
      id: 'deambulacion', texto: 'Desplazamiento (deambulación)', textoCorto: 'desplazamiento',
      opciones: [
        { texto: 'Independiente', detalle: 'Camina al menos 50 m sin ayuda ni supervisión. Puede usar bastón, muletas o prótesis, pero no andadera.', valor: 15 },
        { texto: 'Necesita ayuda o usa andadera', detalle: 'Camina 50 m con ayuda o supervisión de otra persona, o con andadera.', valor: 10 },
        { texto: 'Independiente en silla de ruedas', detalle: 'Propulsa su silla al menos 50 m sin ayuda.', valor: 5 },
        { texto: 'Dependiente', detalle: 'No camina ni propulsa su silla solo.', valor: 0 },
      ],
    },
    {
      id: 'escalones', texto: 'Subir y bajar escaleras', textoCorto: 'escaleras',
      opciones: [
        { texto: 'Independiente', detalle: 'Sube y baja un piso sin supervisión; puede usar barandal o bastón.', valor: 10 },
        { texto: 'Necesita ayuda', detalle: 'Ayuda física o supervisión.', valor: 5 },
        { texto: 'Dependiente', detalle: 'Incapaz de subir y bajar escaleras.', valor: 0 },
      ],
    },
  ],
  bandas: [
    { min: 0, max: 20, etiqueta: 'Dependencia total', nivel: 'critico', hallazgo: true, texto: 'Dependencia total para las actividades básicas de la vida diaria.', sugerencias: [...SUG_DEPENDENCIA, SUG.piel] },
    { min: 21, max: 60, etiqueta: 'Dependencia grave', nivel: 'grave', hallazgo: true, texto: 'Dependencia grave para las actividades básicas de la vida diaria.', sugerencias: [...SUG_DEPENDENCIA, SUG.piel] },
    { min: 61, max: 90, etiqueta: 'Dependencia moderada', nivel: 'moderado', hallazgo: true, texto: 'Dependencia moderada para las actividades básicas de la vida diaria.', sugerencias: SUG_DEPENDENCIA },
    { min: 91, max: 99, etiqueta: 'Dependencia escasa', nivel: 'leve', hallazgo: true, texto: 'Dependencia escasa para las actividades básicas de la vida diaria.', sugerencias: [SUG.causaFuncional] },
    { min: 100, max: 100, etiqueta: 'Independiente', nivel: 'bien', texto: 'Independiente para las actividades básicas de la vida diaria.', sugerencias: [] },
  ],
  notas: [
    'Puntos de corte de Shah et al. (1989), los mismos de la guía del INGER (2022). Otros autores agrupan de forma distinta.',
    'El puntaje no identifica la causa de la dependencia ni si es reversible; la comparación con el estado basal orienta, pero no lo establece.',
    'Efecto techo: poco sensible a cambios en personas con buena funcionalidad. Complementar con Lawton-Brody o con pruebas de desempeño (SPPB).',
    'Desplazamiento: usar andadera corresponde a 10 puntos, como en la versión original y en la del INGER.',
  ],
  referencias: [
    { texto: 'Mahoney FI, Barthel DW. Functional evaluation: the Barthel Index. Md State Med J. 1965;14:61-5.' },
    { texto: 'Shah S, Vanclay F, Cooper B. Improving the sensitivity of the Barthel Index for stroke rehabilitation. J Clin Epidemiol. 1989;42(8):703-9.', doi: '10.1016/0895-4356(89)90065-6' },
    { texto: 'Baztán JJ, et al. Índice de Barthel: instrumento válido para la valoración funcional de pacientes con enfermedad cerebrovascular. Rev Esp Geriatr Gerontol. 1993;28:32-40.' },
    REF_INGER_2022,
  ],
};
