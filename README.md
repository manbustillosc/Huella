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

## Agregar una escala

1. Crear `escalas/<nombre>.js` con el mismo formato que las existentes.
2. Importarla en `escalas/index.js`.
3. Agregar su ruta a `ARCHIVOS` en `sw.js` y subir `VERSION` (aquí y en `js/datos.js`).
4. Declarar `direccionClinica` y, si aplica, `unidadCambio`, `decimalesCambio` y los textos de mejoría y empeoramiento.
5. Correr las pruebas (`node --test tests/*.test.mjs`): revisan estructura, dirección clínica, mínimo, máximo, bandas, listas de verificación y que `sw.js` incluya todos los archivos.

## Aviso

Apoyo para aplicar e interpretar escalas; no sustituye el juicio clínico. Algunas escalas tienen titular de derechos (por ejemplo MoCA, MNA, Zarit, CFS, Braden, RUDAS, CDR, Cornell, NPI-Q); para esas se captura solo el resultado y los puntos de corte publicados, salvo permiso del titular.

## Créditos

- Íconos: [Lucide](https://lucide.dev), licencia ISC (`assets/LICENSE-Lucide.txt`).
- Tipografías: Fraunces e Inter Tight, SIL Open Font License 1.1 (`assets/fonts/`).

© 2026 Manuel Bustillos. Todos los derechos reservados.
