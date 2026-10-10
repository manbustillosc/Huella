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
| `js/rutas.js` | Rutas guiadas («¿Qué deseas valorar?»): pasos y momento por defecto. |
| `js/motor.js` | Tipos de campo, cálculo, estados (sin responder, no aplica, no evaluable), interpretación y texto por escala. |
| `js/nota.js` | Comparación entre momentos (basal, ingreso, actual, egreso) y nota de la valoración. |
| `js/almacen.js` | Guardado local: valoración, respuestas en curso y preferencias. |
| `js/app.js`, `js/vistas/` | Pantallas y navegación. |
| `css/app.css` | Diseño con los colores y tipografías de la marca. |
| `sw.js` | Copia sin conexión. |
| `tests/` | Pruebas de cada escala y de la nota (`node --test tests/*.test.mjs`). |

## Texto para el expediente

En el resultado de cada escala y en **Valoración**, el texto se copia en varios formatos. La app recuerda el último que usaste.

- **Párrafo**: todo seguido, para ahorrar espacio.
  - En una escala: el resumen y las respuestas en una línea; de los reactivos de sí/no solo los que suman puntos (`textoEscala`).
  - En la valoración: cada escala en su versión breve (`resumenBreve`), agrupadas por dominio.
- **Lista**: un renglón por reactivo (escala) o por escala (valoración).
- **Completa** (solo valoración): resultados por dominio, cambios respecto al basal, hallazgos que requieren atención, instrumentos no evaluables y sugerencias separadas de los resultados (`notaValoracion`).

Cuando una escala se guarda en más de un momento (basal, ingreso, actual, egreso), el texto incluye la diferencia respecto al basal y los reactivos que empeoraron.

## Agregar una escala

1. Crear `escalas/<nombre>.js` con el mismo formato que las existentes.
2. Importarla en `escalas/index.js`.
3. Agregar su ruta a `ARCHIVOS` en `sw.js` y subir `VERSION` (aquí y en `js/datos.js`).
4. Correr las pruebas (`node --test tests/*.test.mjs`): revisan estructura, mínimo, máximo, bandas y que `sw.js` incluya todos los archivos.

## Aviso

Apoyo para aplicar e interpretar escalas; no sustituye el juicio clínico. Algunas escalas tienen titular de derechos (por ejemplo MMSE, MoCA, MNA, Zarit, CFS, Braden); para esas se captura solo el puntaje y los puntos de corte, salvo permiso del titular.

## Créditos

- Íconos: [Lucide](https://lucide.dev), licencia ISC (`assets/LICENSE-Lucide.txt`).
- Tipografías: Fraunces e Inter Tight, SIL Open Font License 1.1 (`assets/fonts/`).

© 2026 Manuel Bustillos. Todos los derechos reservados.
