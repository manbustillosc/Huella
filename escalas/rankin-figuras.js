// Figuras de la escala de Rankin modificada: ilustraciones originales de Huella que representan la discapacidad
// de cada grado (0 a 6).
import { figura, cabeza, linea, suelo, caminante } from './figuras.js';

const svg = (nivel, cuerpo, distintivo) => figura('rankin', nivel, cuerpo, distintivo);

export const FIGURAS_RANKIN = {
  // 0 · Sin síntomas.
  0: svg('bien', caminante(28, 8) + suelo,
    '<circle cx="49" cy="15" r="7"/><polyline points="45.5,15 48,17.5 52.5,12.5"/>'),
  // 1 · Sin discapacidad significativa: tiene síntomas, pero hace todas sus actividades habituales.
  1: svg('bien', caminante(28, 7) + suelo,
    '<polyline points="41,16 45,16 47,10 50,22 53,13 55,16 59,16"/>'),
  // 2 · Discapacidad leve: dejó algunas actividades previas, pero se vale por sí misma.
  2: svg('leve', caminante(27, 6) + suelo,
    '<rect x="42" y="12" width="14" height="10" rx="2"/><path d="M46 12v-2h6v2"/><line x1="40" y1="25" x2="58" y2="8"/>'),
  // 3 · Discapacidad moderada: necesita algo de ayuda, pero camina sin ayuda de otra persona (puede usar bastón).
  3: svg('moderado',
    cabeza(26, 14) + linea('27,20', '24,35') + linea('27,21', '32,28', '36,33') + linea('27,21', '22,28', '21,33')
    + linea('24,35', '28,45', '29,55') + linea('24,35', '21,45', '19,55') + linea('36,33', '37,55') + suelo,
    '<path d="M50 23s-8-4.6-8-9.4a4 4 0 0 1 8-1.2 4 4 0 0 1 8 1.2c0 4.8-8 9.4-8 9.4z"/>'),
  // 4 · Discapacidad moderadamente grave: no camina sin ayuda de otra persona ni atiende sus necesidades corporales.
  4: svg('grave',
    cabeza(22, 15) + linea('23,21', '22,36') + linea('23,23', '29,29', '33,29') + linea('23,23', '19,30', '18,35')
    + linea('22,36', '25,46', '25,55') + linea('22,36', '19,46', '18,55') + suelo,
    cabeza(42, 13) + linea('42,19', '42,35') + linea('42,21', '36,28', '33,29') + linea('42,21', '46,28', '47,34')
    + linea('42,35', '45,45', '46,55') + linea('42,35', '39,45', '38,55')),
  // 5 · Discapacidad grave: encamada, con incontinencia, necesita atención constante.
  5: svg('critico',
    linea('6,26', '6,52') + linea('6,40', '50,40', '50,52') + linea('6,47', '50,47')
    + '<rect x="9" y="33" width="11" height="7" rx="3.5"/>' + cabeza(15, 29, 3.8)
    + '<path d="M20 40c3-7 12-8 17-4.5s9 2 12 4.5"/>',
    '<circle cx="49" cy="17" r="10"/><text class="fig-texto" x="49" y="20" text-anchor="middle">24h</text>'),
  // 6 · Muerte.
  6: svg('neutro',
    linea('32,56', '32,30') + '<path d="M32 46c-6 0-10-4-11-9 5 0 10 3 11 9zM32 42c5 0 9-3 10-8-5 0-9 3-10 8z"/>',
    '<path d="M24 16c0 9 4 14 8 14s8-5 8-14l-4 4-4-6-4 6z"/>'),
};
