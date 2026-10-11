# Huella

Escalas de valoración geriátrica integral del Dr. Manuel Bustillos: se llenan, se interpretan y generan el texto para el expediente.

- Funciona en computadora y celular; se instala como app desde el navegador y sirve sin conexión.
- Todo se calcula en el navegador. No envía datos a ningún servidor.
- La valoración en curso se guarda solo en el dispositivo, sin nombre ni datos de identificación.

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
| `js/herramientas.js` | Herramientas con pantalla propia (revisión de medicamentos) para dominios, búsqueda, favoritas y rutas. |
| `js/nota.js` | Nota de la valoración: párrafo, lista y completa (resultados, interpretación, cambios, hallazgos, sugerencias). |
| `js/almacen.js` | Guardado local: valoración, aplicaciones repetidas, respuestas en curso y preferencias. |
| `js/app.js`, `js/vistas/` | Pantallas y navegación. |
| `css/app.css` | Diseño con los colores y tipografías de la marca. |
| `sw.js` | Copia sin conexión. |
| `tests/` | Pruebas de escalas, comparaciones, nota, almacenamiento y rutas (`node --test tests/*.test.mjs`). `referencia-renal.json` contiene valores de una implementación independiente de CKD-EPI 2021 y Cockcroft-Gault. |

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

## Agregar una escala

1. Crear `escalas/<nombre>.js` con el mismo formato que las existentes.
2. Importarla en `escalas/index.js`.
3. Agregar su ruta a `ARCHIVOS` en `sw.js` y subir `VERSION` (aquí y en `js/datos.js`).
4. Declarar `direccionClinica` y, si aplica, `unidadCambio`, `decimalesCambio` y los textos de mejoría y empeoramiento.
5. Correr las pruebas (`node --test tests/*.test.mjs`): revisan estructura, dirección clínica, mínimo, máximo, bandas, listas de verificación y que `sw.js` incluya todos los archivos.

## Aviso

Apoyo para aplicar e interpretar escalas; no sustituye el juicio clínico. Algunas escalas tienen titular de derechos (por ejemplo MoCA, MNA, Zarit, CFS, Braden, RUDAS, CDR, Cornell, NPI-Q); para esas se captura solo el resultado y los puntos de corte publicados, salvo permiso del titular.

## Créditos

- Valoración ICOPE: adaptación del *Manual de atención integrada para las personas mayores*, 2.ª ed. (OPS, 2025; https://doi.org/10.37774/9789275330319), licencia CC BY-NC-SA 3.0 IGO; las partes adaptadas se comparten bajo la misma licencia. Esta publicación es una adaptación de una obra original de la Organización Panamericana de la Salud (OPS). Las opiniones expresadas en esta adaptación son responsabilidad exclusiva de los autores y no representan necesariamente los criterios de la OPS.
- Íconos: [Lucide](https://lucide.dev), licencia ISC (`assets/LICENSE-Lucide.txt`).
- Tipografías: Fraunces e Inter Tight, SIL Open Font License 1.1 (`assets/fonts/`).

© 2026 Manuel Bustillos. Todos los derechos reservados.
