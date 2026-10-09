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
| `js/dominios.js` | Dominios de valoración y escalas planeadas. |
| `js/motor.js` | Cálculo del puntaje, interpretación y texto para el expediente. |
| `js/app.js` | Pantallas y navegación. |
| `css/app.css` | Diseño con los colores y tipografías de la marca. |
| `sw.js` | Copia sin conexión. |
| `tests/` | Pruebas de cada escala (`node --test tests/motor.test.mjs`). |

## Agregar una escala

1. Crear `escalas/<nombre>.js` con el mismo formato que las existentes.
2. Importarla en `escalas/index.js`.
3. Agregar su ruta a `ARCHIVOS` en `sw.js` y subir `VERSION`.
4. Correr las pruebas: revisan que el mínimo, el máximo y las bandas cuadren.

## Aviso

Apoyo para aplicar e interpretar escalas; no sustituye el juicio clínico. Algunas escalas tienen titular de derechos (por ejemplo MMSE, MoCA, MNA, Zarit, CFS); para esas se captura solo el puntaje y los puntos de corte, salvo permiso del titular.

## Créditos

- Íconos: [Lucide](https://lucide.dev), licencia ISC (`assets/LICENSE-Lucide.txt`).
- Tipografías: Fraunces e Inter Tight, SIL Open Font License 1.1 (`assets/fonts/`).

© 2026 Manuel Bustillos. Todos los derechos reservados.
