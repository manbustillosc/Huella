// Acerca de: privacidad, uso clínico, tema, instalación y créditos.
import { almacen } from '../almacen.js';
import { VERSION, escalas } from '../datos.js';
import { $, $$, icono, aviso, confirmarEnDosToques } from '../ui.js';

export function renderAcerca() {
  const t = almacen.tema();
  const opcionTema = (valor, texto) => `<label><input type="radio" name="tema" value="${valor}"${t === valor ? ' checked' : ''}> ${texto}</label>`;
  const conLicencia = escalas.filter((e) => e.licencia).map((e) => e.corto).join(', ');
  return `
    <section class="vista acerca">
      <header class="cabecera">
        <p class="ceja">Versión ${VERSION}</p>
        <h1>Acerca de Huella</h1>
      </header>
      <div class="prosa">
        <p>Instrumentos de valoración geriátrica integral del Dr. Manuel Bustillos, geriatra: se aplican, se calculan, se interpretan y generan el texto para el expediente.</p>

        <h2 id="privacidad">${icono('escudo')} Qué se guarda y dónde</h2>
        <p>Todo se calcula en este navegador. Huella no tiene servidor y no envía datos a ningún lugar.</p>
        <ul>
          <li><strong>Valoración en curso</strong> (datos clínicos opcionales, resultados con su fecha y momento clínico, respuestas, y la lista de medicamentos con su revisión STOPP/START y Beers): en el almacenamiento local del navegador. Permanece hasta que toques «Nueva valoración» o borres los datos del sitio. Cada valoración corresponde a un episodio: inicia una nueva para no mezclar resultados de episodios distintos.</li>
          <li><strong>Respuestas en edición</strong>: en el almacenamiento de la pestaña; se borran al cerrarla y nunca se mezclan con otra valoración.</li>
          <li><strong>Preferencias</strong> (favoritas, tema, formato de la nota, instrumentos más usados): en el almacenamiento local.</li>
        </ul>
        <h2>Límites</h2>
        <ul>
          <li>No es un expediente clínico electrónico: no tiene respaldo, cifrado, control de acceso ni bitácora. Los datos pueden perderse si se borra el navegador.</li>
          <li>En una computadora compartida, cualquier persona que use el mismo navegador puede ver la valoración en curso. Al terminar, copia la nota a tu expediente y toca «Nueva valoración», o usa una ventana privada.</li>
          <li>No escribas nombre, expediente ni otros datos que identifiquen a la persona.</li>
        </ul>
        <button class="btn" type="button" id="borrar-todo">${icono('borrar')} Borrar todos los datos de Huella en este navegador</button>

        <h2>Uso clínico</h2>
        <p>Es un apoyo para aplicar e interpretar instrumentos; no sustituye el juicio clínico. Un tamizaje positivo no establece un diagnóstico. Las sugerencias son orientativas y se muestran separadas de los resultados. Los puntos de corte corresponden a las referencias citadas en cada instrumento; los valores continuos se clasifican sin redondear.</p>
        <p>Al comparar aplicaciones, cada instrumento declara si un valor mayor es mejor, si un valor menor es mejor o si el cambio no tiene una dirección clínica uniforme. La comparación describe la diferencia y su dirección; su relevancia clínica, su causa y su reversibilidad requieren valoración.</p>
        <p>Los instrumentos con titular de derechos (${conLicencia}) se incluyen sin reproducir sus reactivos: se registra el puntaje obtenido con la versión oficial o se usan solo sus reglas de puntuación.</p>

        <h2>Tema</h2>
        <div class="selector-tema" role="radiogroup" aria-label="Tema">
          ${opcionTema('auto', 'Automático')}${opcionTema('claro', 'Claro')}${opcionTema('oscuro', 'Oscuro')}
        </div>

        <h2>Instalar en el celular</h2>
        <ul>
          <li><strong>iPhone:</strong> en Safari, toca Compartir y después «Agregar a inicio».</li>
          <li><strong>Android:</strong> en Chrome, abre el menú ⋮ y toca «Instalar app» o «Agregar a la pantalla principal».</li>
        </ul>
        <p>Una vez instalada funciona sin conexión.</p>

        <h2>Fuentes y créditos</h2>
        <p class="discreto">Versiones en español conforme a la Guía de instrumentos de evaluación de la capacidad funcional del Instituto Nacional de Geriatría (2022) cuando aplica, citando la fuente, con fines asistenciales sin ánimo de lucro. Íconos: Lucide (licencia ISC). Tipografías: Fraunces e Inter Tight (SIL Open Font License 1.1).</p>
      </div>
    </section>`;
}

export function montarAcerca(aplicarTema, alCambiar) {
  $$('input[name="tema"]').forEach((input) => input.addEventListener('change', () => {
    almacen.guardarTema(input.value);
    aplicarTema();
  }));
  confirmarEnDosToques($('#borrar-todo'), {
    texto: `${icono('alerta')} Toca otra vez para borrar todo`,
    accion: () => {
      almacen.borrarTodo();
      aplicarTema();
      alCambiar();
      aviso('Datos de Huella borrados de este navegador');
    },
  });
}
