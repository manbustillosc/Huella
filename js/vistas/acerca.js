// Acerca de: privacidad, uso clínico, tema, instalación y créditos.
import { almacen } from '../almacen.js';
import { VERSION, escalas } from '../datos.js';
import { $, $$, icono, aviso, confirmarEnDosToques } from '../ui.js';

export function renderAcerca() {
  const t = almacen.tema();
  const opcionTema = (valor, texto) => `<label><input type="radio" name="tema" value="${valor}"${t === valor ? ' checked' : ''}> ${texto}</label>`;
  const conLicencia = escalas.filter((e) => e.registro).map((e) => e.corto).join(', ');
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
          <li><strong>Valoración en curso</strong> (datos clínicos opcionales, resultados con su fecha y momento clínico, respuestas, la lista de medicamentos con su revisión STOPP/START y Beers, y el plan de atención con sus objetivos, intervenciones, preferencias y bitácora): en el almacenamiento local del navegador. Permanece hasta que toques «Nueva valoración» o borres los datos del sitio. Cada valoración corresponde a un episodio con un código aleatorio (p. ej., EP-7KQ3MX): ciérralo en Seguimiento para no mezclar resultados de episodios distintos.</li>
          <li><strong>Episodios archivados</strong> (hasta 30): al cerrar un episodio en Seguimiento se archiva en este navegador con su código aleatorio; los importados se archivan con el estado que traían (abierto o cerrado). Puedes abrirlo, exportarlo o borrarlo; no se sincroniza con ningún servidor. Huella nunca borra un episodio por su cuenta: con 30 archivados, no permite cerrar ni importar otro hasta que exportes y borres alguno.</li>
          <li><strong>Importación</strong>: un archivo se importa completo o no se importa. Se rechaza entero si tiene una estructura o una fecha inválida, un puntaje imposible o que no coincide con sus respuestas, una unidad inconsistente, un instrumento desconocido, identificadores repetidos, campos no reconocidos, datos de identificación o más de 500 resultados.</li>
          <li><strong>Archivos exportados</strong>: la exportación descarga un archivo JSON en tu dispositivo. Contiene información de salud sin identificadores; guárdalo en un lugar seguro y bórralo cuando no lo necesites.</li>
          <li><strong>Respuestas en edición</strong>: en el almacenamiento de la pestaña; se borran al cerrarla y nunca se mezclan con otra valoración.</li>
          <li><strong>Preferencias</strong> (favoritas, tema, formato de la nota, instrumentos más usados): en el almacenamiento local.</li>
        </ul>
        <h2>Estado del guardado</h2>
        <p>Huella comprueba cada escritura leyéndola de nuevo. La barra lateral (y la barra superior cuando algo falla) indica uno de tres estados:</p>
        <ul>
          <li><strong>Guardado en este navegador</strong>: la escritura se comprobó.</li>
          <li><strong>Solo disponible durante esta sesión</strong>: el navegador no permite el almacenamiento local (p. ej., algunas ventanas privadas); lo capturado se pierde al cerrar la pestaña. Exporta el episodio antes de cerrarla.</li>
          <li><strong>No guardado</strong>: la última escritura falló (almacenamiento lleno o bloqueado). Lo capturado sigue en la pestaña; exporta el episodio desde Seguimiento.</li>
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
        <p>El plan de atención parte de los hallazgos de tamizaje de los instrumentos; el estado de cada problema (sospecha, diagnóstico confirmado, descartado o pendiente), la prioridad, los objetivos y las intervenciones los decide el médico. Ninguna intervención sugerida se agrega ni se marca como realizada sola. Los informes no llevan firma ni certificación.</p>
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
        <p class="discreto">La valoración ICOPE es una adaptación del Manual de atención integrada para las personas mayores, 2.ª ed. (Organización Panamericana de la Salud, 2025; <a href="https://doi.org/10.37774/9789275330319" target="_blank" rel="noopener">doi:10.37774/9789275330319</a>), licencia CC BY-NC-SA 3.0 IGO; las partes adaptadas se comparten bajo la misma licencia. Esta publicación es una adaptación de una obra original de la Organización Panamericana de la Salud (OPS). Las opiniones expresadas en esta adaptación son responsabilidad exclusiva de los autores y no representan necesariamente los criterios de la OPS. Huella no usa el logotipo de la OPS ni de la OMS, y no reproduce la tabla optométrica.</p>
        <p class="discreto">Cada instrumento muestra su licencia y su atribución en «Referencias y licencia». El registro completo de licencias, permisos y atribuciones está en el archivo LICENCIAS.md del repositorio.</p>
        <p class="discreto">FRAX® y FRAXplus® son marcas registradas (© Osteoporosis Research Ltd.); Huella solo registra el resultado de la herramienta oficial y no reconstruye su algoritmo. Valores de la silla en 30 s y del equilibrio en 4 etapas: CDC STEADI.</p>
        <p class="discreto">NEWS2: reproducido de Royal College of Physicians. National Early Warning Score (NEWS) 2: Standardising the assessment of acute-illness severity in the NHS. London: RCP, 2017. La redacción de esta traducción no ha sido aprobada específicamente por el Royal College of Physicians; consulta la versión original en inglés antes de su uso clínico.</p>
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
