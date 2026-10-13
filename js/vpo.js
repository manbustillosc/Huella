// Diagramas de flujo de la valoración preoperatoria (VPO) para cirugía electiva no cardiaca.
// Basados en el «Lineamiento para Valoración Preoperatoria para Cirugía Electiva no Cardiaca» (IMSS, agosto 2026),
// redactados para Huella. Cada nodo puede enlazar a los instrumentos de Huella que menciona.

export const FUENTE_VPO = 'Instituto Mexicano del Seguro Social, Dirección de Prestaciones Médicas. Lineamiento para Valoración Preoperatoria para Cirugía Electiva no Cardiaca. México: IMSS; agosto 2026.';

const inicio = (texto, extra = {}) => ({ tipo: 'inicio', texto, ...extra });
const paso = (texto, extra = {}) => ({ tipo: 'paso', texto, ...extra });
const alerta = (texto, extra = {}) => ({ tipo: 'alerta', texto, ...extra });
const fin = (texto, extra = {}) => ({ tipo: 'fin', texto, ...extra });
const decision = (texto, ramas, extra = {}) => ({ tipo: 'decision', texto, ramas, ...extra });
const rama = (etiqueta, nodos, tono = '') => ({ etiqueta, nodos, tono });

const SOLICITAR_VPO = paso('Solicitar VPO a Medicina Interna (y a Cardiología si hay enfermedad cardiaca activa).');
const ESCALAS = paso('Aplicar las escalas de riesgo que respondan una decisión clínica según la condición.', {
  escalas: ['dasi', 'rcri', 'ariscat', 'stopbang', 'caprini', 'cfs'],
});
const ENVIAR = fin('Enviar a Cirugía con el resultado de las escalas aplicadas y las recomendaciones pertinentes.');
const NO_VPO = fin('No requiere valoración preoperatoria.', { tono: 'bien' });

export const DIAGRAMAS = [
  {
    id: 'general',
    nombre: 'Quién necesita VPO',
    resumen: 'Algoritmo general: clasificación ASA, riesgo del procedimiento y a quién solicitar la VPO.',
    nodos: [
      inicio('Persona con indicación de cirugía electiva no cardiaca.'),
      paso('Cirugía hace la evaluación integral.', {
        detalle: [
          'Revisa la nota de referencia y hace o revisa la historia clínica.',
          'Identifica comorbilidades y alergias.',
          'Pregunta por medicamentos relevantes: anticoagulantes, antiagregantes e hipoglucemiantes.',
          'Revisa los estudios disponibles.',
          'Define procedimiento, posición, duración y fecha probable, pérdida sanguínea estimada, posibilidad de transfusión e ingreso a UCI.',
          'Explica el procedimiento, sus alternativas y riesgos.',
        ],
      }),
      alerta('Sin importar la clase ASA, solicita VPO a Medicina Interna si hay fragilidad, deterioro funcional, multimorbilidad, polifarmacia clínicamente relevante, síndromes geriátricos que requieran optimización o capacidad funcional deficiente (DASI <34).', { escalas: ['cfs', 'dasi'], tono: 'info' }),
      paso('Clasificar el estado físico con la ASA y el riesgo del procedimiento.', { escalas: ['asa', 'riesgoqx'] }),
      decision('¿Qué clase ASA tiene?', [
        rama('ASA I o II', [
          decision('¿Cirugía de riesgo alto (>5 %)?', [
            rama('Sí', [SOLICITAR_VPO, ESCALAS, ENVIAR]),
            rama('No', [NO_VPO], 'bien'),
          ], { escalas: ['riesgoqx'] }),
        ]),
        rama('ASA III', [
          decision('¿Cirugía de riesgo intermedio o alto (≥1 %)?', [
            rama('Sí', [SOLICITAR_VPO, ESCALAS, ENVIAR]),
            rama('No', [NO_VPO], 'bien'),
          ], { escalas: ['riesgoqx'] }),
        ]),
        rama('ASA IV', [
          paso('Referir a la especialidad que corresponda para controlar la enfermedad sistémica grave.'),
          decision('¿La enfermedad quedó controlada?', [
            rama('Sí', [SOLICITAR_VPO, ESCALAS, ENVIAR]),
            rama('No', [alerta('Mantener el control por la especialidad; la cirugía electiva espera.')], 'alerta'),
          ]),
        ]),
        rama('ASA V', [fin('Urgencia quirúrgica: no requiere VPO.')], 'alerta'),
        rama('ASA VI', [fin('Notificar al coordinador hospitalario de donación de órganos y tejidos.')]),
      ]),
    ],
    notas: ['La VPO no es una autorización ni una «liberación» para operar: estima el riesgo, identifica lo modificable y deja recomendaciones para antes, durante y después de la cirugía.'],
  },
  {
    id: 'cardio',
    nombre: 'Riesgo cardiovascular',
    resumen: 'Estratificación escalonada: condición cardiaca activa, riesgo del procedimiento, DASI, RCRI y cuándo referir a Cardiología.',
    nodos: [
      inicio('Persona con indicación de cirugía electiva no cardiaca.'),
      paso('Identificar el riesgo del procedimiento quirúrgico.', { escalas: ['riesgoqx'] }),
      decision('¿Hay una condición cardiaca activa (descompensada)?', [
        rama('Sí', [
          alerta('Interrumpir la ruta de cirugía electiva y enviar a Urgencias para evaluación y atención inmediata; diferir la cirugía y tratar.', {
            detalle: ['Síndrome coronario agudo.', 'Insuficiencia cardiaca descompensada.', 'Arritmia sintomática con inestabilidad hemodinámica.', 'Síncope de probable origen cardiaco.', 'Valvulopatía grave sintomática.', 'Hipertensión pulmonar grave descompensada.'],
          }),
        ], 'alerta'),
        rama('No', [
          paso('Evaluar la capacidad funcional con el DASI (≥34 puntos equivale a ≥4 MET).', { escalas: ['dasi'] }),
          paso('Calcular el RCRI y registrar que no es una autorización ni predice todos los riesgos.', { escalas: ['rcri'] }),
          decision('¿Requiere valoración directa por Cardiología?', [
            rama('Sí', [
              paso('Referir a Cardiología.', {
                detalle: [
                  'Cardiopatía estructural compleja.',
                  'Intervención coronaria reciente.',
                  'Arritmia clínicamente significativa o con dispositivo.',
                  'Valvulopatía grave o relevante.',
                  'Hipertensión pulmonar grave.',
                  'Dispositivo que requiera interrogación o programación perioperatoria.',
                  'Biomarcador anormal que pueda cambiar el manejo.',
                  'Prueba o intervención cardiológica que pueda modificar el tratamiento o el momento de la cirugía.',
                ],
              }),
              paso('Cardiología solicita ecocardiograma, prueba de isquemia, angiografía u otro estudio solo si el resultado cambiaría la conducta, y define el manejo de la insuficiencia cardiaca, valvulopatía, arritmia, dispositivo, hipertensión pulmonar, antianginosos o antiagregación posterior a intervención coronaria.'),
            ]),
            rama('No', [
              decision('¿Enfermedad cardiovascular crónica estable, síntomas inespecíficos, multimorbilidad o duda?', [
                rama('Sí', [paso('VPO por Medicina Interna, que decide si hace falta referir a Cardiología.')]),
                rama('No', [paso('Continuar la VPO sin valoración cardiológica.')], 'bien'),
              ]),
            ], 'bien'),
          ]),
          paso('Solicitar laboratorio o gabinete solo para establecer el estado de la enfermedad y la conducta terapéutica.'),
          fin('Optimizar el tratamiento y enviar a Cirugía con las recomendaciones.'),
        ], 'bien'),
      ]),
    ],
  },
  {
    id: 'ecg',
    nombre: 'Electrocardiograma',
    resumen: 'Cuándo pedir el ECG y qué hallazgos requieren Cardiología o Urgencias.',
    nodos: [
      decision('¿Síntomas o signos cardiovasculares activos?', [
        rama('Sí', [fin('Pedir ECG de 12 derivaciones.')]),
        rama('No', [
          decision('¿Enfermedad coronaria, arritmia significativa, enfermedad arterial periférica o cerebrovascular, o cardiopatía estructural?', [
            rama('Sí', [fin('Pedir ECG de 12 derivaciones.')]),
            rama('No', [
              decision('¿Cirugía de riesgo intermedio o alto?', [
                rama('Sí', [fin('Pedir ECG de 12 derivaciones.')]),
                rama('No', [fin('No pedir ECG de rutina: persona asintomática con cirugía de bajo riesgo.', { tono: 'bien' })], 'bien'),
              ], { escalas: ['riesgoqx'] }),
            ], 'bien'),
          ]),
        ], 'bien'),
      ], { detalle: ['Dolor torácico, disnea o palpitaciones no diagnosticados, taquicardia, síncope o soplo cardiaco.'] }),
      decision('Si hay ECG, ¿qué muestra?', [
        rama('Requiere Urgencias', [
          alerta('Enviar a Urgencias.', { detalle: ['Bloqueo AV de segundo grado Mobitz II, de alto grado o completo (tercer grado).', 'Arritmia nueva con inestabilidad hemodinámica, síncope o síntomas cardiovasculares.'] }),
        ], 'alerta'),
        rama('Requiere Cardiología', [
          paso('Valoración por Cardiología antes de la cirugía electiva.', {
            detalle: [
              'Cambios nuevos sugestivos de isquemia o lesión: elevación del ST, depresión significativa del ST o alteraciones nuevas de la onda T.',
              'Fibrilación auricular de nueva aparición, con respuesta ventricular rápida o control inadecuado de la frecuencia.',
              'QT o QTc prolongado de forma significativa o nueva, con síncope, arritmia ventricular, antecedentes sugestivos de QT largo o sin causa reversible corregible.',
            ],
          }),
        ]),
        rama('Sin esas alteraciones', [fin('Continuar la VPO.', { tono: 'bien' })], 'bien'),
      ]),
    ],
    notas: ['En personas adultas asintomáticas, cerca del 12 % de los ECG son anormales, pero cambian la conducta en alrededor del 0.6 %.'],
  },
  {
    id: 'estudios',
    nombre: 'Estudios',
    resumen: 'Qué no pedir de rutina y cuándo sí solicitar laboratorio, radiografía o ecocardiograma.',
    nodos: [
      alerta('No pedir de rutina en personas asintomáticas con cirugía electiva de bajo riesgo.', {
        detalle: [
          'Electrocardiograma (anormal en cerca del 12 %; cambia la conducta en alrededor del 0.6 %).',
          'Radiografía de tórax (anormal en cerca del 7 %; cambia la conducta en alrededor del 0.5 %).',
          'Ecocardiograma.',
          'Laboratorio basal: biometría hemática, pruebas de coagulación o química sanguínea.',
        ],
        tono: 'info',
      }),
      decision('¿Hay una indicación clínica específica y el resultado puede modificar el manejo perioperatorio?', [
        rama('Sí', [fin('Solicitar el estudio y documentar en el expediente la justificación de cada uno.')]),
        rama('No', [fin('No solicitarlo.', { tono: 'bien' })], 'bien'),
      ]),
      paso('Ecocardiograma, prueba de isquemia o angiografía: solo si están indicados y el resultado cambiaría la conducta, aun considerando el contexto quirúrgico.'),
    ],
  },
  {
    id: 'dispositivos',
    nombre: 'Marcapasos y DAI',
    resumen: 'Cuándo enviar a Cardiología o a la clínica de marcapasos antes de la cirugía.',
    nodos: [
      paso('Ser portador de marcapasos no contraindica la cirugía: el manejo se individualiza según el dispositivo, la dependencia de la estimulación y el procedimiento.'),
      decision('¿Qué dispositivo tiene?', [
        rama('DAI o DAI-TRC', [
          alerta('El electrocauterio monopolar está contraindicado mientras las terapias del dispositivo estén activas.'),
          fin('Enviar a Cardiología o a la clínica de marcapasos para suspender temporalmente las terapias y reactivarlas al terminar.'),
        ], 'alerta'),
        rama('Marcapasos', [
          decision('¿Electrocauterio monopolar con el sitio quirúrgico a menos de 30 cm del generador?', [
            rama('Sí', [fin('Enviar a valoración y, si hace falta, reprogramación del dispositivo.')]),
            rama('No', [
              decision('¿Litotricia extracorpórea en una persona dependiente de la estimulación (estimulación ventricular >40 %)?', [
                rama('Sí', [fin('Valorar y reprogramar el dispositivo.')]),
                rama('No', [fin('No requiere reprogramación ni envío a la clínica de marcapasos, salvo otra indicación.', { tono: 'bien' })], 'bien'),
              ]),
            ], 'bien'),
          ], { detalle: ['Por ejemplo, cirugía de tórax, mama, cuello u hombro.'] }),
        ]),
      ]),
      paso('Durante la cirugía: con electrocauterio monopolar, aplicaciones intermitentes con pulsos menores de 5 segundos; con electrocauterio bipolar no se requiere reprogramación.'),
    ],
  },
  {
    id: 'despues',
    nombre: 'Después de la VPO',
    resumen: 'Segunda valoración, sesión colegiada y cierre con Cirugía.',
    nodos: [
      decision('¿Hace falta una segunda valoración?', [
        rama('Sí', [fin('Programarla solo para lo que haya que comprobar.')]),
        rama('No', [fin('No programar una segunda valoración.', { tono: 'bien' })], 'bien'),
      ], {
        detalle: [
          'Se inició un tratamiento cuya respuesta hay que comprobar.',
          'Hay un estudio pendiente indispensable.',
          'Hubo un cambio clínico.',
          'Hay que verificar anticoagulación, anemia, glucosa, función renal y electrolitos, o infección.',
          'La cirugía se reprogramó y la condición dejó de ser estable.',
        ],
      }),
      decision('¿Es un caso complejo?', [
        rama('Sí', [paso('Sesión colegiada del equipo interdisciplinario: Cirugía, Medicina Interna, Cardiología y Anestesiología, según el caso.')]),
        rama('No', [paso('Seguir el flujo habitual.')], 'bien'),
      ], { detalle: ['Cirugía de alto riesgo.', 'Condición activa de difícil control.', 'Probable ingreso a UCI en el posoperatorio.', 'Anticoagulación compleja.'] }),
      paso('Cirugía revisa el resultado de la VPO: estratificación del riesgo, recomendaciones, plan de medicamentos y resultados críticos.'),
      paso('Explica riesgos y beneficios y decide el manejo junto con la persona; solicita la programación y el consentimiento informado.'),
      fin('Si la persona no acepta o el procedimiento no procede: hoja de disentimiento o contrarreferencia.'),
    ],
  },
];

// Lista de lo que revisa la VPO por Medicina Interna (actividades 8 a 13 del lineamiento).
export const LISTA_VPO = [
  { texto: 'Estabilidad de las comorbilidades y síntomas cardiopulmonares.' },
  { texto: 'Capacidad funcional con el DASI.', escalas: ['dasi'] },
  { texto: 'Conciliación completa de medicamentos (anticoagulantes, antiagregantes, hipoglucemiantes).', herramienta: 'medicacion' },
  { texto: 'Enfermedad renal, hepática, metabólica, hematológica y respiratoria.', escalas: ['ckdepi'] },
  { texto: 'Riesgo cardiaco con el RCRI.', escalas: ['rcri'] },
  { texto: 'Riesgo pulmonar con ARISCAT y apnea del sueño con STOP-Bang.', escalas: ['ariscat', 'stopbang'] },
  { texto: 'Riesgo de trombosis con Caprini y de sangrado.', escalas: ['caprini'] },
  { texto: 'Riesgo de infección, delirium, fragilidad y desnutrición.', escalas: ['cfs', 'minicog', 'mnasf'] },
  { texto: 'Ajustes al tratamiento según la evaluación; estudios solo con indicación y justificación documentada.' },
];

export const diagramaDe = (id) => DIAGRAMAS.find((d) => d.id === id) || null;

// Todos los instrumentos que mencionan los diagramas (para comprobar que existen en Huella).
export function escalasMencionadas() {
  const ids = new Set();
  const recorrer = (nodos) => nodos.forEach((n) => {
    (n.escalas || []).forEach((x) => ids.add(x));
    (n.ramas || []).forEach((r) => recorrer(r.nodos));
  });
  DIAGRAMAS.forEach((d) => recorrer(d.nodos));
  LISTA_VPO.forEach((x) => (x.escalas || []).forEach((e) => ids.add(e)));
  return [...ids];
}
