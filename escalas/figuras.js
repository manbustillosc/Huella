// Utilidades para las figuras ilustrativas de Huella (CFS, Rankin modificada): ilustraciones originales con trazo
// propio, en SVG estático. Cada figura toma el color de su nivel (clases .nivel-*) para el fondo y el distintivo.

export const figura = (tipo, nivel, cuerpo, distintivo = '') => `<svg class="figura figura-${tipo} nivel-${nivel}" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false">`
  + '<circle class="fig-fondo" cx="32" cy="32" r="31"/>'
  + `<g class="fig-trazo">${cuerpo}</g>`
  + (distintivo ? `<g class="fig-acento">${distintivo}</g>` : '')
  + '</svg>';

export const cabeza = (x, y, r = 4.2) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
export const linea = (...p) => `<polyline points="${p.join(' ')}"/>`;
export const suelo = '<line class="fig-suelo" x1="9" y1="56" x2="55" y2="56"/>';

// Persona caminando de perfil, hacia la derecha. paso: amplitud de la zancada; incl: inclinación del tronco hacia delante.
export function caminante(x, paso = 6, incl = 0) {
  const hombro = [x + incl * 0.6, 20];
  const cadera = [x - incl * 0.2, 34];
  return cabeza(x + incl, 13)
    + linea(hombro.join(','), cadera.join(','))
    + linea(hombro.join(','), `${hombro[0] + paso * 0.5},${hombro[1] + 7}`, `${hombro[0] + paso * 0.8},${hombro[1] + 12}`)
    + linea(hombro.join(','), `${hombro[0] - paso * 0.5},${hombro[1] + 7}`, `${hombro[0] - paso * 0.7},${hombro[1] + 12}`)
    + linea(cadera.join(','), `${cadera[0] + paso * 0.6},${cadera[1] + 10}`, `${cadera[0] + paso},55`)
    + linea(cadera.join(','), `${cadera[0] - paso * 0.4},${cadera[1] + 10}`, `${cadera[0] - paso},55`);
}
