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

## Fase 4 (versión 2.2): escalas añadidas el 11/10/2026

| Instrumento | Fuente del punto de corte | Revisión |
|---|---|---|
| MoCA por secciones | Nasreddine, 2005; Aguilar-Navarro, 2018 (México) | Máximos por sección (5, 3, 6, 3, 2, 5, 6) y +1 por escolaridad ≤12 años solo si el total es menor de 30. Reglas con redacción propia; no reproduce láminas, palabras ni frases. |
| MMSE | Guía IMSS-144-08; Reyes de Beaman, 2004; Franco-Marina, 2010 | Corte 24 (≥5 años) o 22 (0 a 4 años); gravedad 19 a 23, 14 a 18 y <14. Solo registro por dominio. |
| Prueba del reloj | Cacho et al., 1999 | Orden ≤6, copia ≤8, suma ≤15. Criterios de números y manecillas resumidos; ante dudas de puntuación, consultar el artículo. |
| FAQ de Pfeffer, GDS de Reisberg, fluencia semántica | Pfeffer, 1982; Reisberg, 1982; cortes de uso clínico | Fluencia ≤10 animales en 1 minuto es orientativo y depende de la escolaridad. |
| GAD-7, CES-D 7, soledad (3 reactivos), LSNS-6 | Spitzer, 2006; Salinas-Rodríguez, 2014; Hughes, 2004; Lubben, 2006 | Cortes publicados. Traducción propia en soledad y LSNS-6 (por confirmar con los autores). |
| Downton, Short FES-I | Downton, 1993; Delbaere, 2010 | Corte ≥3; 7 a 8, 9 a 13 y 14 a 28. |
| MUST, Norton | BAPEN; Norton, 1962 | MUST cambiado a solo registro (BAPEN cobra licencia por calcularlo en apps fuera del Reino Unido). Norton con cuatro niveles de riesgo. |
| Intensidad del dolor, Karnofsky, PPI, ASA | Escalas de dominio público; Morita, 1999; ASA, 2020 | PPI >6: <3 semanas; >4: <6 semanas. ASA sin dirección clínica automática. |
| Maltrato (EGM), VES-13 | Giraldo-Rodríguez, 2013; Saliba, 2001 | EGM solo registro (≥1 respuesta afirmativa); VES-13 ≥3 vulnerable. |

Pendientes de esta fase: confirmar por escrito las condiciones de ASA, LSNS-6 y la escala breve de soledad.

## Fase 5 (versión 2.3): escalas sin permiso ni pago, 11/10/2026

| Instrumento | Fuente | Revisión |
|---|---|---|
| Isaacs | Isaacs y Akhtar, 1972; protocolo del SAS (validación de Pascual, 1990) | 1 minuto o 10 palabras por categoría; corte ≤27 en personas mayores (≤29 en adultos). |
| GPCOG | Brodaty, 2002 | Registro; algoritmo 9 / 5 a 8 con informante (0 a 3 alterado) / 0 a 4. |
| GOHAI | Atchison y Dolan, 1990; Sánchez-García, 2010 | Registro; ≤50 baja, 51 a 56 moderada, 57 a 60 alta. |
| MOS apoyo social | Sherbourne y Stewart, 1991; De la Revilla, 2005 | Global <57; emocional <24; instrumental <12; interacción <12; afectivo <9. Traducción propia (RAND permite traducir). |
| Caprini | Caprini, 2005 (AHRQ, apéndice B.10); Gould, 2012 | Edad 41 a 60 = 1, 61 a 74 = 2, ≥75 = 3; categorías 0, 1 a 2, 3 a 4, ≥5. Sin dosis. |
| LACE | van Walraven, 2010; Cotter, 2012 | Puntos verificados; alto riesgo ≥10; advertencia de discriminación pobre en personas mayores. |
| G8 | Bellera, 2012 | Registro; ≤14 anormal. |
| ESAS-r | Watanabe, 2011; manual de AHS | 9 síntomas 0 a 10; categoría por el síntoma más intenso (1 a 3, 4 a 6, 7 a 10). |
| SPICT, NECPAL | Highet, 2014; Gómez-Batiste, 2013 | Solo registro del resultado. |
| Equivalente de morfina | CDC, 2022 | Factores: codeína 0.15, tramadol 0.2, tapentadol 0.4, morfina 1, hidrocodona 1, oxicodona 1.5, oximorfona 3, metadona 4.7, hidromorfona 5, fentanilo TD 2.4 por mcg/h. No convierte dosis. |

## Fase 6 (versión 2.5): instrumentos de la guía del INGER, 12/10/2026

Fuente: *Guía de instrumentos de evaluación de la capacidad funcional* (INGER, 2022), texto principal y anexos.

| Instrumento | Revisión |
|---|---|
| MMSE | Cambiado a la versión mexicana del INGER (Reyes de Beaman): forma abreviada con 8 puntos de entrada si la escolaridad es de 3 años o menos y corte ≤24. La guía dice «3 o menos» y «menos de 3»; Huella usa 3 o menos. |
| Fluencia semántica | Menos de −1 DE por edad y escolaridad (anexo 1). La tabla del INGER para 65 años o más coincide con las medias y DE de Chávez-Oliveros (2015). |
| Isaacs | Corte del INGER ≤25 (antes ≤27 del protocolo andaluz, que se conserva como nota). |
| Atenas | 8 reactivos 0 a 3; ≥8 insomnio. Se corrige una errata del formato en «despertares durante la noche». |
| ISAR-HP | Puntos 1, 2, 1 y 1 (educación después de los 14 años invertida); categorías del INGER 0 a 1, 2 a 3 y 4 a 5. |
| HARP | Edad (76 a 84 = 1, ≥85 = 2), actividades instrumentales (0 a 5 = 2) y examen abreviado (≤14 = 1). |
| SPPICEES | Sin puntaje; el reactivo de apoyo social se considera problema cuando no hay cuidador primario. |
| LSA | Nivel × frecuencia × independencia (0 a 120); <56 y <20 según el INGER. Frecuencia 1 = menos de una vez por semana (el formato dice «1 vez a la semana»). |
| Zarit, Gijón, MNA-SF, SARC-F, CES-D 7, LSNS-6, MUST, GPCOG | Cortes revisados: coinciden con la guía del INGER (en Gijón, con su anexo). |
| Norton | El texto principal del INGER describe por error la escala de Barthel (0 a 100); Huella conserva la escala original de 5 a 20. |

## Versión 2.8: tabla de infusiones del HG30, 12/10/2026

Revisión de los mL/h impresos contra la dosis y la preparación de la misma tabla:

| Medicamento | Revisión |
|---|---|
| Propofol | 1 g/100 mL = 10 mg/mL: 5 a 80 mcg/kg/min son 1.5 a 24 mL/h en 50 kg. La tabla imprime el doble (3 a 48 y 120 mL/h), como si la preparación fuera de 5 mg/mL. |
| Midazolam | 30 mg/100 mL: 0.01 a 0.1 mg/kg/h son 1.7 a 16.7 mL/h en 50 kg; el máximo impreso (5 mL/h) corresponde a 0.03 mg/kg/h. |
| Rocuronio | 200 mg/100 mL: en 100 kg, 3 a 8 mcg/kg/min son 9 a 24 mL/h; la tabla repite el rango del vecuronio (12 a 18). |
| Adrenalina | La dosis impresa «0.5 a 1 mcg/kg/min» no coincide con sus mL/h, que corresponden a 0.05 a 1. |
| Dexmedetomidina, vecuronio, dobutamina, vasopresina | Coinciden. |

## Versión 2.7: escala de Rankin modificada, 12/10/2026

| Instrumento | Revisión |
|---|---|
| Rankin modificada | Grados 0 a 5 de van Swieten (1988) y grado 6 (muerte) de los estudios de desenlace; referencias verificadas en PubMed (doi 10.1177/003693305700200504 y 10.1161/01.str.19.5.604). Secuencia de decisión basada en el cuestionario simplificado de Bruno (2010), con redacción propia. 0 a 2 independencia; 3 a 5 dependencia. |
