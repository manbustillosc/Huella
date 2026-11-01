// Diagramas de flujo de la valoración preoperatoria (VPO) para cirugía electiva no cardiaca.
// Basados en el «Lineamiento para Valoración Preoperatoria para Cirugía Electiva no Cardiaca» (IMSS, agosto 2026),
// redactados para Huella. Cada nodo puede enlazar a los instrumentos de Huella que menciona.

export const FUENTE_VPO = 'Instituto Mexicano del Seguro Social, Dirección de Prestaciones Médicas. Lineamiento para Valoración Preoperatoria para Cirugía Electiva no Cardiaca. México: IMSS; agosto 2026.';

// Documento contrastado: el PDF que compartió el médico. No se localizó un enlace público; las páginas son las impresas
// en el documento (la portada no se numera).
export const DOCUMENTO_VPO = {
  cita: FUENTE_VPO,
  version: 'Fecha de publicación: agosto 2026. Archivo LINEAMIENTO_VPO_27082026_VF.pdf (23 páginas, creado el 27/08/2026).',
  huella: 'SHA-256 9cff2109…a563bb6d76',
  enlace: 'Sin enlace público localizado: contrastado con el PDF proporcionado por el médico (no incluido en Huella).',
};

// Origen de cada contenido: lineamiento institucional, guía internacional o adaptación propia de Huella.
export const ORIGENES_VPO = {
  lineamiento: 'Lineamiento institucional (IMSS)',
  guia: 'Guía internacional',
  propia: 'Adaptación propia de Huella',
};

// Fuentes complementarias verificables (guías internacionales). Se citan donde Huella matiza o completa el lineamiento.
export const GUIAS_VPO = {
  acc2024: 'Thompson A, Fleischmann KE, Smilowitz NR, et al. 2024 AHA/ACC/ACS/ASNC/HRS/SCA/SCCT/SCMR/SVM Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery. Circulation. 2024;150(19):e351-e442. doi:10.1161/CIR.0000000000001285.',
  // Reafirmación del 28 de septiembre de 2026: el comité conjunto ACC/AHA la declaró vigente; recomendaciones, texto,
  // figuras, tablas y referencias son idénticos a los de 2024 (solo cambia el año del título). Por eso los textos de
  // Huella siguen citando «AHA/ACC 2024», que es también la edición que cita el lineamiento del IMSS.
  acc2026: 'Thompson A, Fleischmann KE, Smilowitz NR, et al. 2026 AHA/ACC/ACS/ASNC/HRS/SCA/SCCT/SCMR/SVM Guideline for Perioperative Cardiovascular Management for Noncardiac Surgery. Circulation. 2026;154(13):e413-e504. doi:10.1161/CIR.0000000000001472. También en J Am Coll Cardiol. 2026;88(13):1543-1643. doi:10.1016/j.jacc.2026.06.017. Reafirmación de la guía de 2024 sin cambios en sus recomendaciones.',
  acc2014: 'Fleisher LA, Fleischmann KE, Auerbach AD, et al. 2014 ACC/AHA Guideline on Perioperative Cardiovascular Evaluation and Management of Patients Undergoing Noncardiac Surgery. Circulation. 2014;130(24):e278-333. doi:10.1161/CIR.0000000000000106.',
  asa2020: 'American Society of Anesthesiologists. ASA Physical Status Classification System. Última modificación: 13 de diciembre de 2020.',
  hrs2011: 'Crossley GH, Poole JE, Rozner MA, et al. The Heart Rhythm Society (HRS)/American Society of Anesthesiologists (ASA) Expert Consensus Statement on the perioperative management of patients with implantable defibrillators, pacemakers and arrhythmia monitors. Heart Rhythm. 2011;8(7):1114-54. doi:10.1016/j.hrthm.2010.12.023.',
  apsf2024: 'Disque D, Oliver AP, Neelankavil JP. Keeping Pace: 2023 Update on the Perioperative Management of Cardiovascular Implantable Electronic Devices (CIEDs). APSF Newsletter. 2024;39(1).',
};

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
    fuentes: [
      { origen: 'lineamiento', texto: 'Actividades 1 a 7', paginas: '4' },
      { origen: 'lineamiento', texto: 'Algoritmo 1. Valoración preoperatoria', paginas: '8' },
      { origen: 'lineamiento', texto: 'Cuadro 1 (ASA) y cuadro 2 (riesgo del procedimiento)', paginas: '10 y 11' },
      { origen: 'guia', texto: 'Clasificación del estado físico de la ASA (2020): ASA V y modificador «E» de urgencia' },
      { origen: 'guia', texto: 'Guía ACC/AHA 2014 de cirugía no cardiaca: definiciones de cirugía de emergencia, urgente, sensible al tiempo y electiva' },
    ],
    nodos: [
      inicio('Persona con indicación de cirugía electiva no cardiaca.'),
      alerta('Este algoritmo es para cirugía electiva. Si la cirugía es urgente o de emergencia, la clase ASA lleva el modificador «E» y la valoración cambia.', {
        tono: 'info', escalas: ['asa'],
        detalle: [
          'Electiva: se sigue este algoritmo y, si corresponde, la VPO completa.',
          'Urgente (suele operarse entre 6 y 24 h): valoración perioperatoria breve con Anestesiología y Cirugía para estabilizar y corregir lo posible sin retrasar la cirugía.',
          'Emergencia (amenaza para la vida o un órgano; suele operarse en menos de 6 h): atención inmediata; ninguna evaluación debe retrasar el procedimiento vital.',
          'La «E» se agrega a cualquier clase (p. ej., ASA IIIE): la urgencia no es una clase ASA.',
        ],
        origen: 'Adaptación propia de Huella: el lineamiento trata solo la cirugía electiva. Definición de la «E»: ASA, 2020; tiempos orientativos: guía ACC/AHA 2014.',
      }),
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
      alerta('Sin importar la clase ASA, solicita VPO a Medicina Interna si hay fragilidad, deterioro funcional, multimorbilidad, polifarmacia clínicamente relevante, síndromes geriátricos que requieran optimización o capacidad funcional deficiente (DASI, cuadro 3).', {
        escalas: ['cfs', 'dasi'], tono: 'info',
        origen: 'Lineamiento, actividad 5 (p. 4). Umbral del DASI: la guía AHA/ACC 2024 considera baja una puntuación ≤34; el cuadro 3 del lineamiento usa <34. Solo difieren con 34 exactos.',
      }),
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
        rama('ASA V', [
          alerta('ASA V es una persona moribunda que no se espera que sobreviva sin la operación; no es sinónimo de urgencia. Queda fuera de la ruta de cirugía electiva: estabilización y coordinación perioperatoria inmediata con Anestesiología y Cirugía, sin retrasar un procedimiento vital.', {
            detalle: [
              'La urgencia se indica con el modificador «E», que puede acompañar a cualquier clase (p. ej., ASA VE, ASA IIIE).',
              'La decisión de operar y en qué condiciones es del equipo tratante, con la persona o su representante.',
            ],
            origen: 'El algoritmo 1 del lineamiento (p. 8) anota «Urgencia quirúrgica, no requiere VPO». Huella separa la clase ASA de la urgencia según la definición de la ASA (2020).',
          }),
        ], 'alerta'),
        rama('ASA VI', [fin('Notificar al coordinador hospitalario de donación de órganos y tejidos.')]),
      ]),
    ],
    notas: ['La VPO no es una autorización ni una «liberación» para operar: estima el riesgo, identifica lo modificable y deja recomendaciones para antes, durante y después de la cirugía.'],
  },
  {
    id: 'cardio',
    nombre: 'Riesgo cardiovascular',
    resumen: 'Estratificación escalonada: condición cardiaca activa, riesgo del procedimiento, DASI, RCRI y cuándo referir a Cardiología.',
    fuentes: [
      { origen: 'lineamiento', texto: 'Actividades 7 a 10 y 15 a 18', paginas: '4 a 6' },
      { origen: 'lineamiento', texto: 'Algoritmo 2. Valoración preoperatoria por Cardiología', paginas: '9' },
      { origen: 'lineamiento', texto: 'Cuadro 3 (DASI) y cuadro 4 (RCRI)', paginas: '12 y 13' },
      { origen: 'guia', texto: 'Guía AHA/ACC 2024 de cirugía no cardiaca, reafirmada sin cambios en 2026; sección 3.2 (capacidad funcional; DASI ≤34)' },
    ],
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
          paso('Evaluar y documentar la capacidad funcional con el DASI.', {
            escalas: ['dasi'],
            detalle: [
              'Guía AHA/ACC 2024: capacidad funcional baja con <4 MET o DASI ≤34.',
              'Lineamiento (cuadro 3): <34 mayor riesgo; ≥34 menor riesgo. Con 34 exactos los criterios difieren y Huella lo señala.',
              'El umbral de 34 es pronóstico, no una conversión a MET: 34 puntos son ≈6.9 MET estimados con la fórmula de Hlatky.',
              'Un DASI aislado no indica una prueba de esfuerzo; se integra con el RCRI y el tipo de cirugía.',
            ],
            origen: 'Lineamiento, actividad 9 y cuadro 3 (pp. 5 y 12); guía AHA/ACC 2024, sección 3.2.',
          }),
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
    fuentes: [
      { origen: 'lineamiento', texto: 'Cuadro 9 (criterios para solicitar ECG) y cuadro 10 (alteraciones que requieren valoración)', paginas: '18' },
      { origen: 'lineamiento', texto: 'Recomendaciones sobre estudios de rutina (rendimiento del ECG)', paginas: '7' },
      { origen: 'guia', texto: 'Guía AHA/ACC 2024 de cirugía no cardiaca, reafirmada sin cambios en 2026: fuerza de las recomendaciones de ECG preoperatorio' },
    ],
    nodos: [
      decision('¿Síntomas o signos cardiovasculares activos?', [
        rama('Sí', [fin('Pedir ECG de 12 derivaciones.', {
          detalle: ['Si los síntomas sugieren un síndrome coronario agudo o hay inestabilidad hemodinámica, la vía es Urgencias, no la cirugía electiva (diagrama «Riesgo cardiovascular»).'],
          origen: 'Lineamiento, cuadro 9 (p. 18). Guía AHA/ACC 2024: razonable con síntomas cardiovasculares.',
        })]),
        rama('No', [
          decision('¿Enfermedad coronaria, arritmia significativa, enfermedad arterial periférica o cerebrovascular, o cardiopatía estructural?', [
            rama('Sí', [fin('Pedir ECG de 12 derivaciones.', {
              origen: 'Lineamiento, cuadro 9 (p. 18). Guía AHA/ACC 2024: razonable con enfermedad cardiovascular conocida antes de cirugía de riesgo elevado; no se pide de rutina antes de cirugía de bajo riesgo en personas asintomáticas.',
            })]),
            rama('No', [
              decision('¿Cirugía de riesgo intermedio o alto?', [
                rama('Sí', [fin('El lineamiento indica pedir ECG de 12 derivaciones.', {
                  detalle: ['Guía AHA/ACC 2024: en personas asintomáticas sin enfermedad cardiovascular conocida, el ECG antes de cirugía de riesgo elevado es opcional; puede considerarse para tener un trazo basal (recomendación débil). No es obligatorio por la guía.'],
                  origen: 'Lineamiento, cuadro 9 (p. 18), que cita la guía AHA/ACC 2024; la fuerza de la recomendación es de la guía.',
                })]),
                rama('No', [fin('No pedir ECG de rutina: persona asintomática con cirugía de bajo riesgo.', { tono: 'bien', origen: 'Lineamiento, cuadro 9 (p. 18), y guía AHA/ACC 2024: no se recomienda de rutina.' })], 'bien'),
              ], { escalas: ['riesgoqx'] }),
            ], 'bien'),
          ]),
        ], 'bien'),
      ], { detalle: ['Dolor torácico, disnea o palpitaciones no diagnosticados, taquicardia, síncope o soplo cardiaco.'] }),
      decision('Si hay ECG, ¿qué muestra?', [
        rama('Sospecha de síndrome coronario agudo', [
          alerta('Enviar a Urgencias de inmediato: no esperar una valoración por Cardiología programada.', {
            detalle: [
              'Elevación nueva del ST (sugiere lesión miocárdica aguda).',
              'Depresión significativa del ST o alteraciones nuevas de la onda T con dolor torácico o equivalente anginoso, disnea, síncope o inestabilidad hemodinámica.',
            ],
            origen: 'Adaptación propia de Huella: ante sospecha de síndrome coronario agudo la evaluación es inmediata. El cuadro 10 del lineamiento (p. 18) agrupa estos cambios en la valoración por Cardiología.',
          }),
        ], 'alerta'),
        rama('Requiere Urgencias', [
          alerta('Enviar a Urgencias.', { detalle: ['Bloqueo AV de segundo grado Mobitz II, de alto grado o completo (tercer grado).', 'Arritmia nueva con inestabilidad hemodinámica, síncope o síntomas cardiovasculares.'] }),
        ], 'alerta'),
        rama('Requiere Cardiología', [
          paso('Valoración por Cardiología antes de la cirugía electiva.', {
            detalle: [
              'Depresión significativa del ST o alteraciones nuevas de la onda T en una persona sin síntomas y hemodinámicamente estable.',
              'Fibrilación auricular de nueva aparición, con respuesta ventricular rápida o control inadecuado de la frecuencia.',
              'QT o QTc prolongado de forma significativa o nueva, con síncope, arritmia ventricular, antecedentes sugestivos de QT largo o sin causa reversible corregible.',
            ],
            origen: 'Lineamiento, cuadro 10 (p. 18), sin los cambios que sugieren un síndrome coronario agudo, que Huella envía a Urgencias.',
          }),
        ]),
        rama('Sin esas alteraciones', [fin('Continuar la VPO.', { tono: 'bien' })], 'bien'),
      ]),
    ],
    notas: [
      'En personas adultas asintomáticas, cerca del 12 % de los ECG son anormales, pero cambian la conducta en alrededor del 0.6 %.',
      'Lo que indica el lineamiento del IMSS es obligatorio en su ámbito; la guía AHA/ACC 2024 gradúa la fuerza de cada indicación: razonable con síntomas o enfermedad cardiovascular conocida, opcional en personas asintomáticas sin ella antes de cirugía de riesgo elevado y no recomendado de rutina antes de cirugía de bajo riesgo.',
    ],
  },
  {
    id: 'estudios',
    nombre: 'Estudios',
    resumen: 'Qué no pedir de rutina y cuándo sí solicitar laboratorio, radiografía o ecocardiograma.',
    fuentes: [
      { origen: 'lineamiento', texto: 'Actividades 6 y 12 (estudios complementarios)', paginas: '4 y 5' },
      { origen: 'lineamiento', texto: 'Ecocardiograma y pruebas cardiológicas (actividades 15 a 18)', paginas: '6' },
      { origen: 'lineamiento', texto: 'Recomendaciones sobre estudios de rutina', paginas: '7' },
    ],
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
    resumen: 'Cuándo enviar a Cardiología o a la clínica de marcapasos, cómo se protege cada tipo de dispositivo y qué hacer al terminar.',
    fuentes: [
      { origen: 'lineamiento', texto: 'Cuadro 11. Dispositivos de estimulación cardiaca', paginas: '19' },
      { origen: 'guia', texto: 'Consenso HRS/ASA 2011 sobre el manejo perioperatorio de desfibriladores, marcapasos y monitores de arritmias' },
      { origen: 'guia', texto: 'Actualización de la APSF sobre dispositivos electrónicos cardiacos implantables (2024)' },
    ],
    nodos: [
      paso('Ser portador de marcapasos no contraindica la cirugía: el manejo se individualiza según el dispositivo, la dependencia de la estimulación y el procedimiento.', {
        detalle: [
          'Tipo de dispositivo: marcapasos, TRC sin desfibrilador (TRC-P), DAI o DAI con resincronización (DAI-TRC).',
          'Dependencia de la estimulación: ritmo propio insuficiente o ausente sin el dispositivo; para la litotricia, el lineamiento la define como más de 40 % de estimulación ventricular en la telemetría.',
          'Procedimiento: tipo de energía (monopolar, bipolar, radiofrecuencia, litotricia) y distancia del campo quirúrgico al generador y los cables.',
        ],
        origen: 'Lineamiento, cuadro 11 (p. 19); detalle de la evaluación: consenso HRS/ASA 2011.',
      }),
      decision('¿Qué dispositivo tiene?', [
        rama('DAI o DAI-TRC', [
          alerta('Lineamiento: con DAI o DAI-TRC no se usa electrocauterio monopolar mientras las terapias estén activas; enviar a Cardiología o a la clínica de marcapasos para suspenderlas temporalmente y reactivarlas al terminar.', {
            origen: 'Lineamiento, cuadro 11 (p. 19). Las guías lo individualizan según el sitio de la cirugía, como sigue.',
          }),
          decision('¿Electrocauterio monopolar o radiofrecuencia por encima del ombligo?', [
            rama('Sí', [
              paso('Suspender las terapias antitaquicardia durante el procedimiento, con reprogramación o con imán según el plan del equipo de dispositivos. Mientras estén suspendidas: monitorización continua y desfibrilador externo listo.'),
              alerta('Si la persona depende de la estimulación: el imán sobre un DAI suspende las terapias pero no cambia la estimulación a modo asincrónico. Si hace falta modo asincrónico, se programa con el programador.'),
            ]),
            rama('No', [
              paso('Por debajo del ombligo, con electrocauterio bipolar o sin electrocauterio, la interferencia es poco probable y por lo general no hace falta reprogramar: el equipo de dispositivos decide. Tener a la mano imán, programador y desfibrilador externo.'),
            ], 'bien'),
          ], { detalle: ['Por ejemplo, cirugía de tórax, abdomen superior, mama, cuello u hombro.'] }),
        ], 'alerta'),
        rama('Marcapasos o TRC-P', [
          decision('¿Electrocauterio monopolar con el sitio quirúrgico a menos de 30 cm del generador?', [
            rama('Sí', [
              fin('Enviar a valoración y, si hace falta, reprogramación del dispositivo.'),
              paso('Si la persona depende de la estimulación, se busca estimulación asincrónica: con reprogramación o, en muchos marcapasos, con un imán. La respuesta al imán depende del modelo y algunos marcapasos sin cables no responden a él.', {
                origen: 'Consenso HRS/ASA 2011 y actualización de la APSF (2024).',
              }),
            ]),
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
      fin('Al terminar: si se suspendieron terapias o se reprogramó el dispositivo, reactivar las terapias y restablecer la programación habitual, y comprobar el funcionamiento antes de retirar la monitorización. Con un imán, retirarlo devuelve la programación previa.', {
        origen: 'Lineamiento, cuadro 11 (reactivación al concluir); comprobación: consenso HRS/ASA 2011 y actualización de la APSF (2024).',
      }),
    ],
  },
  {
    id: 'despues',
    nombre: 'Después de la VPO',
    resumen: 'Segunda valoración, sesión colegiada y cierre con Cirugía.',
    fuentes: [
      { origen: 'lineamiento', texto: 'Actividades 14 y 20 (segunda valoración y sesión colegiada)', paginas: '6' },
      { origen: 'lineamiento', texto: 'Actividades 21 a 25 (cierre con Cirugía)', paginas: '7' },
    ],
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

// Lista de lo que revisa la VPO por Medicina Interna (actividades 8 a 13 del lineamiento, pp. 5 y 6).
export const FUENTE_LISTA_VPO = { origen: 'lineamiento', texto: 'Actividades 8 a 13', paginas: '5 y 6' };
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
