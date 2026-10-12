# Huella

Escalas de valoración geriátrica integral del Dr. Manuel Bustillos: se llenan, se interpretan y generan el texto para el expediente.

- Funciona en computadora y celular; se instala como app desde el navegador y sirve sin conexión.
- Todo se calcula en el navegador. No envía datos a ningún servidor.
- La valoración en curso y los episodios cerrados se guardan solo en el dispositivo, sin nombre ni datos de identificación.

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `escalas/` | Una escala por archivo: reactivos, puntos, bandas de interpretación, notas y referencias. |
| `escalas/index.js` | Lista de escalas que muestra la app. |
| `js/dominios.js` | Dominios de valoración, problemas clínicos que cubren y escalas planeadas. |
| `js/rutas.js` | Rutas guiadas («¿Qué deseas valorar?»): núcleo, complementarias, finalidad de cada paso y momento. |
| `js/motor.js` | Tipos y clases de instrumento, tipos de campo, cálculo, estados (sin responder, no aplica, no evaluable), listas con «Ninguno», validaciones cruzadas, interpretación y texto por escala. |
| `js/comparacion.js` | Orden cronológico, referencia, resultado vigente y dirección clínica de cada cambio. |
| `js/medicacion.js`, `js/vistas/medicacion.js` | Revisión de medicamentos: registro, STOPP/START v3 criterio por criterio, revisión manual de Beers 2023 y salidas para la nota. |
| `escalas/stoppstart-datos.js` | Redacción condensada en español de los 190 criterios STOPP/START v3 (CC BY 4.0, con atribución). |
| `escalas/icope.js` | Evaluación básica ICOPE (paso 1): un instrumento por dominio de la capacidad intrínseca y los factores clave del cuadro 3.2, adaptados del manual de la OPS (2025, CC BY-NC-SA 3.0 IGO). |
| `js/icope.js`, `js/vistas/icope.js` | Valoración ICOPE: estado de cada dominio, evaluación detallada sugerida (reutiliza resultados), panel de capacidad intrínseca sin puntaje global, plan y seguimiento. |
| `js/plan.js` | Plan de atención: valoración del médico por problema, prioridad, objetivos, intervenciones, revaloraciones, preferencias de la persona y bitácora de cambios. |
| `js/atencion.js`, `js/vistas/atencion.js`, `js/vistas/plan-ui.js` | Plan de atención geriátrica: lista de problemas (hallazgos de tamizaje derivados, dominios ICOPE alterados y problemas del médico), sugerencias orientativas por dominio, evolución y significado clínico del cambio. |
| `js/episodio.js`, `js/vistas/seguimiento.js` | Episodios (código aleatorio, fechas, cierre, archivo local), gráficas de evolución, estado del plan, exportación e importación en JSON. |
| `js/informes.js`, `js/vistas/informe.js` | Informes: evolución breve, nota completa, resumen por dominio, ICOPE, plan de atención y seguimiento; copiar, imprimir o guardar en PDF, sin firma. |
| `js/vistas/catalogo.js` | Catálogo de futuras herramientas (sin implementar). |
| `js/herramientas.js` | Herramientas con pantalla propia (revisión de medicamentos) para dominios, búsqueda, favoritas y rutas. |
| `js/nota.js` | Nota de la valoración: párrafo, lista y completa (resultados, interpretación, cambios, hallazgos, sugerencias). |
| `js/almacen.js` | Guardado local con escrituras comprobadas y tres estados (guardado, solo esta sesión, no guardado); valoración, episodios archivados sin descartes automáticos, respuestas en curso y preferencias. |
| `js/importacion.js` | Validación estricta de archivos importados: todo o nada, máximo 500 resultados y 2 MB. |
| `js/pendientes.js`, `js/vistas/pendientes.js` | Centro de pendientes, vigencia de los resultados e inicio rápido. |
| `js/app.js`, `js/vistas/` | Pantallas y navegación. |
| `css/app.css` | Diseño con los colores y tipografías de la marca. |
| `sw.js` | Copia sin conexión. |
| `LICENCIAS.md` | Licencia, permisos y atribución de cada instrumento y material de terceros; pendientes y borradores de solicitud. |
| `tests/` | Pruebas de escalas, comparaciones, nota, almacenamiento, importación, rutas, referencias entre módulos y archivos de la PWA (`node --test tests/*.test.mjs`). `referencia-renal.json` contiene valores de una implementación independiente de CKD-EPI 2021 y Cockcroft-Gault. |
| `.github/workflows/publicar.yml` | Ejecuta las pruebas y publica en `main` (GitHub Pages) solo si pasan. |
| `AUDITORIA.md` | Revisión transversal del catálogo de la fase 3.1. |

## Texto para el expediente

En el resultado de cada escala y en **Valoración**, el texto se copia en varios formatos. La app recuerda el último que usaste.

- **Párrafo**: todo seguido, para ahorrar espacio.
  - En una escala: el resumen y las respuestas en una línea; de los reactivos de sí/no solo los que suman puntos (`textoEscala`).
  - En la valoración: cada escala en su versión breve (`resumenBreve`), agrupadas por dominio.
- **Lista**: un renglón por reactivo (escala) o por escala (valoración).
- **Completa** (solo valoración): resultados por dominio, cambios respecto al basal, hallazgos que requieren atención, instrumentos no evaluables y sugerencias separadas de los resultados (`notaValoracion`).

## Cronología y comparaciones

- Cada resultado guarda su **momento clínico** (basal, ingreso, actual, egreso) y su **fecha de aplicación**; el basal puede llevar además la fecha a la que corresponde el estado basal.
- Basal, ingreso y egreso admiten un resultado; «actual» y los instrumentos sin momento admiten varias aplicaciones con distinta fecha. Reemplazar siempre pide confirmación.
- El orden es cronológico: el basal primero y después por fecha de aplicación. El resultado vigente es el más reciente por fecha, no por el nombre del momento.
- Cada instrumento declara su `direccionClinica` (`mayor_mejor`, `menor_mejor` o `sin_direccion`). La comparación distingue mejoría, empeoramiento, sin cambio, cambio no interpretable y variación sin significado clínico uniforme, con el valor sin redondear.
- Huella avisa si las fechas no cuadran con los momentos o si una valoración abarca más de 90 días.

## Clases de instrumento

Cada instrumento pertenece a una de seis clases que se distinguen por color y forma en todas las listas: **tamizaje**, **evaluación clínica** (incluye algoritmos diagnósticos y pruebas de desempeño), **estadificación**, **índice pronóstico**, **calculadora** y **lista de verificación**. La marca **registro de resultado** (`registro: true`) indica que el instrumento tiene titular de derechos: Huella captura su resultado sin reproducir los reactivos.

## Conexiones entre instrumentos

- `vinculos`: datos de otra prueba de la misma valoración (por ejemplo, la RASS en el CAM-ICU). Se muestran con su fecha y solo se usan si el médico toca «Usar este dato»; algunos exigen que el dato sea de hoy.
- `siguientes`: siguiente paso sugerido según el resultado (por ejemplo, Mini-Cog positivo → MoCA o RUDAS). Solo es un enlace.
- `alertas`: avisos de seguridad que devuelve `calcular` (por ejemplo, reactivo 9 del PHQ-9). Se destacan en el resultado, se marcan en la valoración y abren los hallazgos de la nota completa.

## Revisión de medicamentos

- Registro de cada medicamento (genérico obligatorio; comercial, dosis, presentación, vía, frecuencia, indicación, duración y observaciones opcionales).
- Función renal tomada de CKD-EPI o Cockcroft-Gault de la misma valoración solo con confirmación, o capturada a mano con su fecha.
- STOPP/START v3: 133 + 57 criterios por sistemas, cada uno sin revisar, se cumple, no se cumple o no evaluable. Sin puntaje.
- Beers 2023: revisión manual de las tablas 2 a 7 con el artículo oficial; Huella no reproduce sus tablas.
- Salidas: medicamentos, criterios revisados, posibles problemas, información pendiente y sugerencias. Nada se suspende ni se ajusta automáticamente.

## Valoración ICOPE

- Seis dominios (cognición, capacidad locomotora, vitalidad, visión, audición y capacidad psicológica), cada uno con su estado: conservado, alterado, pendiente o no evaluable. No hay puntaje global ni índice de capacidad intrínseca.
- Paso 1: preguntas de filtro y pruebas del cuadro 3.1; una respuesta afirmativa al filtro (cognición, visión, audición) lleva directo a la evaluación detallada. Los factores clave (apoyo social, quien cuida, incontinencia urinaria) y el riesgo cardiovascular se registran aparte: no son dominios.
- Paso 2: instrumentos disponibles por dominio (Mini-Cog, MoCA o RUDAS; SPPB, velocidad de marcha o TUG; MNA-SF; GDS-15 o PHQ-9), reutilizando lo ya registrado; registro de evaluaciones hechas fuera de Huella (examen ocular, audiometría) y valoración del médico (hallazgo de tamizaje, sospecha clínica, diagnóstico confirmado, descartado, pendiente).
- Paso 3: lo que importa a la persona, prioridad decidida por el médico, objetivos (basal, meta, plazo, responsable, indicador) e intervenciones orientativas del manual que solo se agregan al tocarlas.
- Paso 4: estado de objetivos e intervenciones, fechas de revaloración, evolución entre aplicaciones y bitácora de cambios del plan.
- La prueba de la silla del SPPB puede reutilizarse en la evaluación básica de la movilidad, con confirmación.

## Continencia, sueño, salud sensorial y oral, deglución

- Continencia y eliminación: ICIQ-UI SF (registro, gravedad de Klovning), síntomas urinarios con datos de alarma, diario miccional de 1 a 3 días (promedios e índice de poliuria nocturna de la ICS; un campo vacío no cuenta como cero) y función intestinal con la escala de Bristol en texto (sin imágenes). Ningún formulario asigna el tipo de incontinencia.
- Sueño: ISI, Epworth y STOP-Bang como registro del resultado oficial, y registro clínico del sueño. Huella no sugiere hipnóticos.
- Salud sensorial y oral: agudeza visual (CIE-11), audiometría (grados de la OMS 2021), HHIE-S y OHAT como registro, y revisión bucal breve.
- Deglución: EAT-10 (registro), FOIS, observación clínica y registro de la textura IDDSI indicada por personal capacitado. Un tamizaje positivo se deriva; Huella no indica dietas ni pruebas con agua.

## Salud ósea, fuerza y equilibrio

- FRAX®: solo registro de las probabilidades a 10 años calculadas en la herramienta oficial (fraxplus.org) con el modelo de México, indicando si se usó la DMO. Huella no reconstruye el algoritmo ni aplica umbrales de tratamiento. FRAX® y FRAXplus® son marcas registradas de Osteoporosis Research Ltd.
- Densitometría (DXA): T-scores por sitio (se usa el más bajo) o Z-score según la ISCD; categorías densitométricas de la OMS. La osteoporosis densitométrica se distingue de la clínica (fractura por fragilidad), que establece el médico. Sugiere evaluar caídas y fragilidad.
- Levantarse de la silla en 30 s con los valores del CDC STEADI por edad y sexo (60 a 94 años); no usa los cortes de la prueba de 5 levantadas.
- Equilibrio en 4 etapas (CDC STEADI), que puede reutilizar el equilibrio del SPPB.
- Dinamometría: hasta 3 intentos por mano, mano dominante, equipo; usa el máximo y los cortes del EWGSOP2. La fuerza baja no diagnostica sarcopenia por sí sola. Se reutiliza en el algoritmo EWGSOP2 (máximo) y en Fried (mano dominante, con advertencia de método); ICOPE la ofrece como complementaria.
- Algoritmo EWGSOP2: sarcopenia probable, no confirmada, confirmada o grave según fuerza, masa muscular (ASM o ASM/talla², DXA o BIA) y desempeño; reutiliza la dinamometría, el SPPB, la velocidad de marcha y el TUG.

## Comorbilidad y riesgo hospitalario

- Índice de Charlson con los pesos originales (1987) y, aparte, el índice combinado edad-comorbilidad (1994). No muestra porcentajes de mortalidad: dependen de la cohorte y del horizonte.
- CIRS-G: gravedad de 0 a 4 en 14 sistemas, total, sistemas afectados, índice de gravedad y número de sistemas en nivel 3 y 4. Sin puntos de corte del total; requiere juicio clínico y el manual de Miller y Towers, que Huella no reproduce.
- NEWS2: siete parámetros con las dos escalas de SpO₂ del RCP; puntaje y categoría de riesgo. La frecuencia de monitorización del RCP se muestra como referencia; el escalamiento sigue el protocolo de cada institución.
- LACE no se implementó: se derivó en adultos de Ontario y discriminó mal el reingreso en personas mayores (c = 0.55; Cotter et al., 2012). Queda documentado como pendiente.

## Plan de atención, seguimiento e informes

- **Inicio**: Atención (en curso, problemas, plan, seguimiento, informes), Valoraciones (ICOPE, rápida, completa, hospitalaria, cognitiva, fragilidad, prequirúrgica y paliativa) y Herramientas (calculadoras, revisión de medicamentos, favoritas, dominios y futuras herramientas).
- **Plan de atención** (`#/plan`): la lista de problemas reúne los hallazgos de tamizaje de los instrumentos (estado derivado), los dominios ICOPE alterados y los problemas que agrega el médico. Estados: hallazgo de tamizaje, sospecha clínica, diagnóstico confirmado por el médico, descartado y pendiente de evaluación. Prioridad alta, intermedia o seguimiento, nunca automática. Objetivos con basal, meta, plazo, responsable, indicador y estado; intervenciones por categoría a partir de sugerencias que solo se agregan al tocarlas; revaloración por problema; lo que importa a la persona (no es un documento de voluntad anticipada).
- **Seguimiento** (`#/seguimiento`): episodio con código aleatorio, fecha de apertura, fechas de evaluación, etiqueta opcional, cierre y reapertura. Gráficas cuando un instrumento tiene dos o más mediciones en el episodio; el cambio cuantitativo se distingue del clínicamente significativo, que solo se califica con los umbrales publicados que declara el instrumento. Estado de objetivos e intervenciones, revaloraciones vencidas y bitácora. Exportación e importación local en JSON con avisos de privacidad; la importación se agrega a los episodios cerrados y nunca reemplaza el episodio en curso.
- **Informes** (`#/informe`): evolución breve, nota geriátrica completa, resumen por dominio, informe ICOPE, plan de atención e informe de seguimiento. Vista previa, copiar, imprimir o guardar en PDF desde el diálogo de impresión. Sin firma ni certificación automática.

## Estabilidad y seguridad clínica (fase 3.1)

- **Guardado comprobado.** Cada escritura se lee de nuevo. La barra lateral muestra «Guardado en este navegador», «Solo disponible durante esta sesión» (sin almacenamiento local) o «No guardado» (la escritura falló); en los dos últimos casos aparece también en la barra superior y en el resultado, con el motivo.
- **Sin pérdidas silenciosas.** Con 30 episodios archivados, Huella no cierra ni importa otro hasta que exportes y borres alguno. Cerrar, abrir, archivar, importar y borrar solo cambian algo si la escritura se comprueba; abrir un episodio sigue un orden que nunca deja un episodio sin copia.
- **Importación estricta.** Todo o nada: estructura, tipos, fechas reales, intervalos de puntaje, unidad, recálculo desde las respuestas, instrumentos conocidos, identificadores únicos, plan, medicación e ICOPE anidados, campos no reconocidos y datos de identificación. Más de 500 resultados o más de 2 MB: rechazo completo con el límite explícito.
- **Comparaciones que no se interpretan.** DXA: T-score frente a Z-score, sitios distintos o diferencias aisladas del T-score; el seguimiento usa la DMO del mismo sitio y equipo con el cambio mínimo significativo del centro. FRAX: modelo, herramienta o uso de DMO distintos. TFG y Charlson: sin dirección automática. CDR y FAST: una disminución del estadio se advierte.
- **ICOPE.** Una evaluación detallada solo cuenta si es de la fecha del tamizaje alterado o posterior, y del episodio; una anterior requiere que el médico confirme que sigue vigente (la confirmación vale solo para ese tamizaje). Estados: vigente, previa confirmada, previa por confirmar, no realizable y pendiente. No hay un plazo de validez uniforme.
- **Pendientes** (`#/pendientes`): instrumentos sin terminar en esta sesión, no evaluables, evaluaciones pendientes (ICOPE y rutas), objetivos abiertos, revaloraciones vencidas y resultados por revisar su vigencia. Solo enlaza; no cambia nada.
- **Vigencia de los resultados.** Reciente (la aplicación más reciente, del episodio y de los últimos 90 días), aplicación anterior, requiere confirmación (anterior a la apertura del episodio) y posiblemente desactualizado (más de 90 días, periodo de referencia de Huella y no criterio de validez del instrumento, o un estado momentáneo —RASS, CAM-ICU, CAM, 4AT, NEWS2— de otro día).
## Escalas cognitivas guiadas y escalas nuevas (versión 2.2)

- **MoCA por secciones**: el médico aplica la hoja oficial y Huella va sección por sección (visuoespacial y ejecutiva, identificación, atención, lenguaje, abstracción, recuerdo diferido y orientación) con las reglas de puntuación explicadas con redacción propia, suma, agrega el punto por escolaridad y muestra los subtotales por dominio. También acepta solo el puntaje total, y los resultados guardados antes siguen calculando.
- **MMSE (versión mexicana del INGER, desde la 2.4)**: registro por dominio con reglas propias; con 3 años o menos de escolaridad, 8 puntos de entrada y forma abreviada (sin resta, lectura, escritura ni copia); probable deterioro con 24 o menos; gravedad orientativa con los rangos del IMSS. No reproduce preguntas, palabras, frase, órdenes ni dibujo; el médico puede guardar el formato del anexo 3 de la guía del INGER en «Tu hoja oficial».
- **Prueba del reloj** (Cacho et al., 1999): esfera, números y manecillas a la orden, a la copia o ambas, con criterios detallados; cortes ≤6 a la orden, ≤8 a la copia y ≤15 la suma; signos cualitativos.
- **Nuevas**: FAQ de Pfeffer, GDS de Reisberg, fluencia semántica, GAD-7, CES-D 7, soledad (3 reactivos), Downton, Short FES-I, MUST (registro), Norton, intensidad del dolor (EN/EVA), Karnofsky, PPI (reutiliza la PPS), ASA, Lubben LSNS-6, escala de maltrato (EGM, registro) y VES-13.
- **Hoja oficial del médico**: en MoCA, MMSE y los demás instrumentos con titular, «Tu hoja oficial» guarda una copia en PDF o imagen (hasta 15 MB) que el médico obtuvo de forma legítima, para abrirla en otra pestaña o verla dentro del instrumento. Se guarda solo en ese navegador (IndexedDB `huella-documentos`): no se publica, no se sube a ningún servidor y no se incluye al exportar.
- **Inicio**: búsqueda, favoritas y usadas con frecuencia arriba; luego la valoración en curso, resultados recientes, rutas y, más abajo, ICOPE.
- **Paleta «Salvia clínica»** (verde salvia y terracota) para modo claro y oscuro.

## Escalas sin permiso ni pago (versión 2.3)

- **Cognitivas**: prueba de Isaacs (corte 27 en personas mayores) y GPCOG (registro de los totales de la persona y del informante, con el algoritmo oficial).
- **Otras**: GOHAI (registro), MOS de apoyo social (traducción propia; cortes de De la Revilla, 2005), Caprini (versión de 2005 de la AHRQ; profilaxis sin dosis), LACE (reutiliza el Charlson; advierte su validez limitada en personas mayores), G8 (registro), ESAS-r, SPICT y NECPAL (registro del resultado) y dosis equivalente de morfina oral (MME/día, factores de los CDC 2022; no calcula dosis de rotación).
- **MUST pasa a registro**: BAPEN cobra licencia por calcularlo dentro de apps usadas fuera del Reino Unido.
- Total: 99 instrumentos. Siguen pendientes EQ-5D e IPOS (registro gratuito del médico), ACB (permiso de Regenstrief) y WHOQOL-OLD (no recomendado). Ver `LICENCIAS.md`.

## Ajustes a la guía del INGER (versión 2.4)

- Licencia de la guía de 2022 comprobada: CC BY-NC-ND 4.0, con un aviso contradictorio de «todos los derechos reservados»; sus formatos permiten reproducirse completos con fines asistenciales sin ánimo de lucro citando al INGER (ver `LICENCIAS.md`).
- Fluencia semántica con las normas mexicanas del INGER por edad y escolaridad: menos de −1 DE es probable deterioro (desde los 65 años con los datos de Chávez-Oliveros, 2015; de 31 a 64 con la tabla del anexo 1).
- Prueba de Isaacs con el corte del INGER (25 o menos).

## Instrumentos de la guía del INGER que faltaban (versión 2.5)

- Escala Atenas de insomnio, ISAR-HP, HARP (registra el total del mini examen abreviado), SPPICEES, prueba del susurro, espacio de vida (LSA), recursos sociales OARS (registro de la categoría), inventario de Díaz-Veiga y barreras del entorno físico y la movilidad. Total: 108 instrumentos.
- Quedan fuera WHODAS 2.0 y WHOQOL-OLD (permiso de la OMS), el inventario de ansiedad de Beck (de pago; se usa el GAD-7) y la SpRMBPC (cualitativa, pendiente).

## Orden de los resultados (versión 2.6)

- En Barthel, Katz, Lawton-Brody, Pfeffer, Mini-Cog, MoCA, MMSE, prueba del reloj, RUDAS, Isaacs, CDR e ICOPE cognición, las respuestas y el texto para el expediente presentan primero lo que la persona logra por completo, luego lo que logra en parte y al final lo que no logra (en Pfeffer y CDR, donde un puntaje menor es mejor, el orden se invierte). Las actividades que nunca ha realizado van al final.
- Los subtotales por dominio (MMSE, MoCA, RUDAS, CDR, reloj, Isaacs y SPPB) siguen el mismo orden, y los resúmenes de Katz y Lawton-Brody nombran primero las actividades que realiza.

## Pruebas y publicación

- `node --test tests/*.test.mjs` ejecuta todas las pruebas, incluidas las de referencias entre módulos, archivos de la PWA y versión.
- GitHub Pages publica la rama `main`. Los cambios se suben a la rama `desarrollo`; la acción *Pruebas y publicación* ejecuta las pruebas, comprueba que la versión de la caché cambió si cambió la app y, solo si todo pasa, avanza `main` (avance rápido). Si algo falla, el sitio publicado no cambia. Los cambios en `.github/workflows` se publican a mano, porque el token de la acción no puede modificar flujos de trabajo.

## Agregar una escala

1. Crear `escalas/<nombre>.js` con el mismo formato que las existentes.
2. Importarla en `escalas/index.js`.
3. Agregar su ruta a `ARCHIVOS` en `sw.js` y subir `VERSION` (aquí y en `js/datos.js`).
4. Declarar `direccionClinica` y, si aplica, `unidadCambio`, `decimalesCambio` y los textos de mejoría y empeoramiento.
   En escalas cognitivas o funcionales, declarar `ordenCapacidad: { campos, mejor: 'alto' | 'bajo', etiquetas? }` para agrupar los reactivos por logro.
5. Correr las pruebas (`node --test tests/*.test.mjs`): revisan estructura, dirección clínica, mínimo, máximo, bandas, listas de verificación y que `sw.js` incluya todos los archivos.

## Aviso

Apoyo para aplicar e interpretar escalas; no sustituye el juicio clínico. Algunas escalas tienen titular de derechos (por ejemplo MoCA, MNA, Zarit, CFS, Braden, RUDAS, CDR, Cornell, NPI-Q, ICIQ-UI SF, ISI, Epworth, STOP-Bang, HHIE-S, OHAT y EAT-10); para esas se captura solo el resultado y los puntos de corte publicados, salvo permiso del titular.

## Créditos

- Valoración ICOPE: adaptación del *Manual de atención integrada para las personas mayores*, 2.ª ed. (OPS, 2025; https://doi.org/10.37774/9789275330319), licencia CC BY-NC-SA 3.0 IGO; las partes adaptadas se comparten bajo la misma licencia. Esta publicación es una adaptación de una obra original de la Organización Panamericana de la Salud (OPS). Las opiniones expresadas en esta adaptación son responsabilidad exclusiva de los autores y no representan necesariamente los criterios de la OPS.
- FRAX® y FRAXplus® son marcas registradas; © Osteoporosis Research Ltd. Huella solo registra el resultado de la herramienta oficial.
- Valores de referencia de la silla en 30 s y criterio del equilibrio en 4 etapas: CDC STEADI (se citan los valores publicados; no se reproducen los materiales).
- NEWS2: reproducido de Royal College of Physicians. National Early Warning Score (NEWS) 2. London: RCP, 2017. La redacción de esta traducción no ha sido aprobada específicamente por el RCP; consulta la versión en inglés antes de su uso clínico.
- Íconos: [Lucide](https://lucide.dev), licencia ISC (`assets/LICENSE-Lucide.txt`).
- Tipografías: Fraunces e Inter Tight, SIL Open Font License 1.1 (`assets/fonts/`).

© 2026 Manuel Bustillos. Todos los derechos reservados sobre el código y los textos propios. Los materiales de terceros conservan su licencia: las adaptaciones de ICOPE (CC BY-NC-SA 3.0 IGO), CAM (CC BY-NC-SA 4.0) e IDDSI (CC BY-SA 4.0) se comparten bajo la misma licencia que su obra original. El registro completo de licencias, permisos y atribuciones está en [LICENCIAS.md](LICENCIAS.md).
