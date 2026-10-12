// Figuras de la Escala Clínica de Fragilidad: ilustraciones originales de Huella, con trazo propio, que representan
// la funcionalidad de cada nivel. No reproducen los pictogramas oficiales de la escala (© Dalhousie University).
// Cada figura usa el color del nivel (clases .nivel-*) para el fondo y el distintivo.

const svg = (nivel, cuerpo, distintivo = '') => `<svg class="figura-cfs nivel-${nivel}" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false">`
  + '<circle class="fig-fondo" cx="32" cy="32" r="31"/>'
  + `<g class="fig-trazo">${cuerpo}</g>`
  + (distintivo ? `<g class="fig-acento">${distintivo}</g>` : '')
  + '</svg>';

const cabeza = (x, y, r = 4.2) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
const linea = (...p) => `<polyline points="${p.join(' ')}"/>`;
const suelo = '<line class="fig-suelo" x1="9" y1="56" x2="55" y2="56"/>';

// Persona caminando de perfil, hacia la derecha. paso: amplitud de la zancada; incl: inclinación del tronco hacia delante.
function caminante(x, paso = 6, incl = 0) {
  const hombro = [x + incl * 0.6, 20];
  const cadera = [x - incl * 0.2, 34];
  return cabeza(x + incl, 13)
    + linea(hombro.join(','), cadera.join(','))
    + linea(hombro.join(','), `${hombro[0] + paso * 0.5},${hombro[1] + 7}`, `${hombro[0] + paso * 0.8},${hombro[1] + 12}`)
    + linea(hombro.join(','), `${hombro[0] - paso * 0.5},${hombro[1] + 7}`, `${hombro[0] - paso * 0.7},${hombro[1] + 12}`)
    + linea(cadera.join(','), `${cadera[0] + paso * 0.6},${cadera[1] + 10}`, `${cadera[0] + paso},55`)
    + linea(cadera.join(','), `${cadera[0] - paso * 0.4},${cadera[1] + 10}`, `${cadera[0] - paso},55`);
}

export const FIGURAS_CFS = {
  // 1 · Muy en forma: en bicicleta (ejercicio regular).
  1: svg('bien',
    '<circle cx="17" cy="45" r="8.5"/><circle cx="47" cy="45" r="8.5"/>'
    + linea('17,45', '29,45', '25,32', '17,45') + linea('25,32', '42,31', '29,45') + linea('42,31', '47,45') + linea('39,27', '44,27')
    + cabeza(38, 13) + linea('24,30', '34,19', '41,27') + linea('24,30', '33,37', '30,45'),
    '<line x1="4" y1="24" x2="11" y2="24"/><line x1="2" y1="31" x2="10" y2="31"/>'),
  // 2 · En forma: camina con paso firme; activa por temporadas.
  2: svg('bien', caminante(30, 9) + suelo,
    '<circle cx="50" cy="15" r="4"/><line x1="50" y1="6" x2="50" y2="8"/><line x1="50" y1="22" x2="50" y2="24"/><line x1="41" y1="15" x2="43" y2="15"/><line x1="57" y1="15" x2="59" y2="15"/>'),
  // 3 · Manejándose bien: camina en su rutina; enfermedades controladas.
  3: svg('bien', caminante(28, 6) + suelo,
    '<rect x="42" y="10" width="14" height="7" rx="3.5" transform="rotate(-35 49 13.5)"/><line x1="47" y1="17.5" x2="51" y2="9.5"/>'),
  // 4 · Fragilidad muy leve: va más despacio y se cansa durante el día.
  4: svg('leve', caminante(28, 4, 4) + suelo,
    '<circle cx="49" cy="15" r="7"/><polyline points="49,11 49,15 52,17"/>'),
  // 5 · Fragilidad leve: lentitud evidente; necesita ayuda en compras, transporte, dinero o labores pesadas.
  5: svg('moderado',
    cabeza(27, 14) + linea('28,20', '25,35') + linea('28,21', '33,28', '37,33') + linea('28,21', '23,28', '22,33')
    + linea('25,35', '29,45', '30,55') + linea('25,35', '22,45', '20,55') + linea('37,33', '38,55') + suelo,
    '<path d="M43 14h12l-1.5 11h-9z"/><path d="M46 14v-2a3 3 0 0 1 6 0v2"/>'),
  // 6 · Fragilidad moderada: ayuda fuera de casa, con escaleras y para bañarse.
  6: svg('moderado',
    cabeza(24, 15) + linea('25,21', '24,36') + linea('25,22', '31,28', '35,29') + linea('24,36', '28,46', '28,55') + linea('24,36', '21,46', '19,55')
    + linea('35,55', '35,29', '44,29', '44,55') + linea('35,42', '44,42') + suelo,
    '<polyline points="45,24 45,19 50,19 50,14 55,14 55,9 60,9"/>'),
  // 7 · Fragilidad grave: dependiente para su cuidado personal.
  7: svg('grave',
    '<circle cx="27" cy="44" r="11"/><circle cx="27" cy="44" r="1.8"/><circle cx="46" cy="53" r="2.6"/>'
    + linea('16,19', '19,33') + linea('19,33', '40,33', '44,50', '48,50') + linea('44,50', '46,50.5')
    + cabeza(26, 12) + linea('26,18', '24,30', '37,30', '41,45', '45,45') + linea('26,20', '31,26', '37,26')),
  // 8 · Fragilidad muy grave: dependencia total, encamada.
  8: svg('critico',
    linea('8,20', '8,52') + linea('56,30', '56,52') + linea('8,36', '56,36') + linea('8,44', '56,44')
    + '<rect x="11" y="29" width="11" height="7" rx="3.5"/>' + cabeza(17, 25, 3.8)
    + '<path d="M22 36c3-8 13-9 19-5s10 2 13 5"/>'),
  // 9 · Enfermedad terminal: esperanza de vida menor de 6 meses, sin otra fragilidad evidente.
  9: svg('critico', caminante(27, 3) + suelo,
    '<path d="M44 9h12M44 27h12M46 9c0 6 8 6 8 9s-8 3-8 9M54 9c0 6-8 6-8 9s8 3 8 9"/>'),
};
