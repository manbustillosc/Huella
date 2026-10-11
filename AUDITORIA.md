# Revisión transversal del catálogo · Fase 3.1

Revisión del 11 de octubre de 2026 sobre las 69 herramientas registradas en `escalas/index.js` (20 dominios, contando la revisión de medicamentos). No se agregaron ni eliminaron instrumentos.

## Método

1. **Revisión automática de las 69 herramientas** (`tests/fase31-auditoria.test.mjs`, se ejecuta en cada publicación):
   - cada herramienta calcula su ejemplo de prueba sin valores indefinidos;
   - las bandas numéricas cubren todo el intervalo del instrumento, sin huecos ni solapamientos;
   - los vínculos entre instrumentos solo usan propiedades conocidas, apuntan a instrumentos registrados y llenan campos que existen;
   - los «siguientes pasos» apuntan a instrumentos registrados.
2. **Revisión manual contra la referencia original** de los instrumentos señalados en la especificación de la fase 3.1.

## Instrumentos revisados manualmente

| Instrumento | Referencia contrastada | Resultado |
|---|---|---|
| NEWS2 y escala 2 de SpO₂ | RCP, 2017 (tabla de puntuación y categorías de respuesta) | Puntos, categorías y frecuencias de monitorización correctos. **Corregido:** la escala 2 ahora exige hipercapnia confirmada por gasometría y una meta de 88 a 92 % prescrita y registrada; ante la duda, escala 1. |
| CAM-ICU y RASS | Ely, 2001; manual oficial; Sessler, 2002 | Algoritmo (1 + 2 + 3 o 4), umbrales (>2 errores de atención, >1 error de pensamiento) y los 10 niveles de la RASS correctos. **Corregido:** la sugerencia de reevaluar la sedación con RASS −4 o −5 estaba mal colocada dentro de un vínculo y nunca se mostraba. |
| EWGSOP2 | Cruz-Jentoft, 2019 (tabla 3 y algoritmo) | Puntos de corte (prensión, 5 levantadas, ASM, ASM/talla², marcha, SPPB, TUG) y secuencia probable → confirmada → grave correctos. Sin cambios. |
| SPPB | Guralnik, 1994; protocolo del NIA | Tiempos de marcha (3 y 4 m), silla y equilibrio correctos; la prueba previa de la silla y el 0 por seguridad están implementados. Sin cambios. |
| Fried | Fried, 2001 | Cortes de fuerza por sexo e IMC, de marcha por sexo y talla, agotamiento y actividad correctos. **Corregido:** la descripción de la población excluida del análisis original (antecedente de evento vascular cerebral, MMSE <18, levodopa/carbidopa, donepezilo o antidepresivos). |
| CDR global | Morris, 1993; O'Bryant, 2008 y 2010 | Rangos del CDR-SB correctos; Huella no calcula el global. **Corregido:** una disminución del estadio muestra una advertencia (no es lo esperable en una enfermedad neurodegenerativa). Lo mismo en FAST. |
| Vivifrail | Folleto oficial del programa | Programas A, B, C1 (camina 10–30 min), C2 (30–45 min) y D, y los cuatro criterios de riesgo de caídas, correctos. Sin cambios. |
| ICOPE | OPS, 2.ª ed., 2025; OMS, 2.ª ed., 2025 | **Corregido:** bibliografía (edición, título, DOI, ISBN, licencia y nota de adaptación) y vigencia de las evaluaciones detalladas reutilizadas (ver README). |
| STOPP/START v3 | O'Mahony, 2023 | 133 STOPP y 57 START en las secciones del artículo; atribución CC BY 4.0. Sin cambios. |
| Beers 2023 | AGS, 2023 | Seis categorías que corresponden a las tablas 2 a 7; no se reproducen las tablas. Sin cambios. |
| CKD-EPI 2021 y Cockcroft-Gault | Inker, 2021; Cockcroft y Gault, 1976; KDIGO 2024 | Fórmulas correctas. **Corregido:** el cambio de la TFG ya no se califica como mejoría o empeoramiento; se informa la diferencia absoluta y relativa, el cambio de categoría y las referencias de KDIGO 2024. |
| DXA y FRAX | OMS; ISCD; FRAX®/FRAXplus® | **Corregido:** T frente a Z, sitios distintos y diferencias aisladas del T-score no se comparan; DMO opcional con sitio, equipo y cambio mínimo significativo; FRAX registra modelo, herramienta y DMO, y no compara condiciones de cálculo distintas. |
| Deglución (EAT-10, FOIS, observación, IDDSI) | Belafsky, 2008; Crary, 2005; tarjeta de referencia IDDSI en español (2025) | Corte del EAT-10 (≥3) y niveles FOIS correctos. **Corregido:** nombres de los niveles IDDSI según la tarjeta oficial en español armonizado (p. ej., «Poco espesa», «Picada y húmeda», «Regular»). |
| Charlson | Charlson, 1987 y 1994 | Pesos e índice combinado correctos. **Corregido:** demencia solo clínicamente establecida, limitaciones documentadas y el cambio del índice ya no se califica como mejoría: se listan las condiciones añadidas o retiradas. |

## Pendientes que requieren revisión clínica o de licencia

- **Versiones en español del INGER (2022):** licencia por confirmar (ver `LICENCIAS.md`).
- **STOP-Bang, PPS y CIRS-G:** confirmación por escrito recomendada (ver `LICENCIAS.md`).
- **STOPP/START v3:** la redacción en español es condensada y propia; conviene que un segundo clínico la coteje criterio por criterio con el apéndice del artículo.
- **Puntos de corte de masa muscular (EWGSOP2) y de fuerza (Fried):** derivados en poblaciones no mexicanas; Huella lo advierte, pero su aplicación local es una decisión clínica.
- **Gijón:** la propia guía del INGER señala que la validez de sus puntos de corte no está establecida.
