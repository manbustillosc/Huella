// Pantalla de conversión de unidades: referencia rápida que convierte en vivo.
import {
  GRUPOS_LINEALES, convertirLineal, cAF, fAC, proporcionAMgMl, mgMlAProporcion, FACTORES_GOTEO, mlhAGotas, gotasAMlh,
  UNIDADES_VELOCIDAD, convertirVelocidad, IONES, SALES, contenidoSal, convertirIon, ANALITOS, bunAUrea, ureaABun, fmtConv,
  eagDeA1c, a1cDeEag, mgdlAMmol, mmolAMgdl, ngspAIfcc, ifccANgsp, gmiDeGlucosaMedia, RANGO_TABLA_ADAG, TABLA_EAG, LIMITES_GLUCEMIA,
} from '../unidades.js';

const fmtNum = fmtConv;
import { $, esc, icono } from '../ui.js';

const numero = (v) => {
  const t = String(v ?? '').trim();
  const n = Number(t.replace(',', '.'));
  return t === '' || !Number.isFinite(n) ? null : n;
};
const entrada = (id, etiqueta, valor = '') => `<label class="campo"><span>${esc(etiqueta)}</span><input id="${id}" type="text" inputmode="decimal" autocomplete="off" value="${esc(valor)}"></label>`;
const selector = (id, etiqueta, opciones, actual) => `<label class="campo"><span>${esc(etiqueta)}</span><select id="${id}">${opciones.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(actual) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
const lista = (pares) => `<dl class="conversiones">${pares.map(([t, v]) => `<div><dt>${esc(t)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

const SECCIONES = [
  ['lineales', 'Masa, volumen, concentración y más'],
  ['dosis', 'Dosis y goteo'],
  ['electrolitos', 'Electrolitos'],
  ['laboratorio', 'Laboratorio'],
  ['glucemia', 'HbA1c y glucosa promedio'],
];

function tarjetaLineal(g) {
  return `
    <section class="tarjeta conv" data-lineal="${g.id}" aria-labelledby="t-${g.id}">
      <h2 class="titulo-tarjeta" id="t-${g.id}">${esc(g.nombre)}</h2>
      <div class="campos campos-conv">
        ${entrada(`v-${g.id}`, 'Valor', '1')}
        ${selector(`u-${g.id}`, 'Unidad', g.unidades.map((u) => [u.id, u.texto]), g.base)}
      </div>
      <div class="salida" id="s-${g.id}" aria-live="polite"></div>
    </section>`;
}

function panelLineales() {
  return `
    ${GRUPOS_LINEALES.map(tarjetaLineal).join('')}
    <section class="tarjeta conv" aria-labelledby="t-temp">
      <h2 class="titulo-tarjeta" id="t-temp">Temperatura</h2>
      <div class="campos campos-conv">${entrada('v-c', '°C', '37')}${entrada('v-f', '°F', '')}</div>
    </section>
    <section class="tarjeta conv" aria-labelledby="t-prop">
      <h2 class="titulo-tarjeta" id="t-prop">Diluciones como proporción</h2>
      <p class="discreto">1:1000 = 1 g en 1000 mL = 1 mg/mL. Útil para adrenalina (1:1000 = 1 mg/mL; 1:10 000 = 0.1 mg/mL) y anestésicos locales con adrenalina (1:200 000 = 5 mcg/mL).</p>
      <div class="campos campos-conv">${entrada('v-prop', '1 : …', '1000')}${entrada('v-mgml', 'mg/mL', '')}</div>
      <div class="salida" id="s-prop" aria-live="polite"></div>
    </section>`;
}

function panelDosis() {
  return `
    <section class="tarjeta conv" aria-labelledby="t-vel">
      <h2 class="titulo-tarjeta" id="t-vel">Velocidad de dosis</h2>
      <p class="discreto">Convierte entre unidades de dosis por minuto, hora o día, con o sin peso. Para pasar a mL/h usa la calculadora de <a href="#/infusiones">infusiones</a>, que toma en cuenta la preparación.</p>
      <div class="campos campos-conv">
        ${entrada('v-vel', 'Dosis', '0.1')}
        ${selector('u-vel', 'Unidad', UNIDADES_VELOCIDAD.map((u) => [u.id, u.id]), 'mcg/kg/min')}
        ${entrada('v-vel-peso', 'Peso (kg, opcional)', '')}
      </div>
      <div class="salida" id="s-vel" aria-live="polite"></div>
    </section>
    <section class="tarjeta conv" aria-labelledby="t-goteo">
      <h2 class="titulo-tarjeta" id="t-goteo">Goteo</h2>
      <div class="campos campos-conv">
        ${selector('u-goteo', 'Equipo', FACTORES_GOTEO.map((x) => [x.id, x.texto]), 20)}
        ${entrada('v-mlh', 'mL/h', '100')}
        ${entrada('v-gotas', 'Gotas por minuto', '')}
      </div>
      <p class="discreto" id="s-goteo" aria-live="polite"></p>
    </section>`;
}

function panelElectrolitos() {
  return `
    <section class="tarjeta conv" aria-labelledby="t-ion">
      <h2 class="titulo-tarjeta" id="t-ion">Iones: mg, mmol y mEq</h2>
      <div class="campos campos-conv">
        ${selector('u-ion', 'Ion', IONES.map((x) => [x.id, x.texto]), 'K')}
        ${entrada('v-ion', 'Valor', '1')}
        ${selector('u-ion-de', 'Unidad', [['mEq', 'mEq'], ['mmol', 'mmol'], ['mg', 'mg']], 'mEq')}
      </div>
      <div class="salida" id="s-ion" aria-live="polite"></div>
      <p class="discreto">mEq = mmol × valencia (Na⁺, K⁺, Cl⁻ y HCO₃⁻: 1; Ca²⁺ y Mg²⁺: 2).</p>
    </section>
    <section class="tarjeta conv" aria-labelledby="t-sal">
      <h2 class="titulo-tarjeta" id="t-sal">Sales: contenido por gramo</h2>
      <div class="campos campos-conv">
        ${selector('u-sal', 'Sal', SALES.map((x) => [x.id, x.texto]), 'KCl')}
        ${entrada('v-sal', 'Gramos de sal', '1')}
      </div>
      <div class="salida" id="s-sal" aria-live="polite"></div>
      <div class="tabla-envoltura"><table class="tabla">
        <thead><tr><th scope="col">1 g de</th><th scope="col" class="num-col">mEq</th><th scope="col" class="num-col">mmol</th><th scope="col" class="num-col">mg del ion</th></tr></thead>
        <tbody>${SALES.map((s) => { const c = contenidoSal(s.id, 1); return `<tr><th scope="row">${esc(s.texto)}</th><td class="num-col">${fmtNum(c.mEq)}</td><td class="num-col">${fmtNum(c.mmol)}</td><td class="num-col">${fmtNum(c.mgIon)} ${esc(c.ion.id)}</td></tr>`; }).join('')}</tbody>
      </table></div>
      <p class="discreto">Calculado con la masa molar de cada sal. ${esc(SALES.find((s) => s.nota).nota)} Revisa la concentración de la ámpula que usas (p. ej., gluconato de calcio al 10 % = 100 mg/mL).</p>
    </section>`;
}

function panelLaboratorio() {
  return `
    <section class="tarjeta conv" aria-labelledby="t-lab">
      <h2 class="titulo-tarjeta" id="t-lab">Unidades convencionales ↔ SI</h2>
      <div class="campos campos-conv">
        ${selector('u-lab', 'Analito', ANALITOS.map((a) => [a.id, a.texto]), 'glucosa')}
        ${entrada('v-lab-conv', 'Convencional', '100')}
        ${entrada('v-lab-si', 'SI', '')}
      </div>
      <p class="discreto" id="s-lab" aria-live="polite"></p>
    </section>
    <section class="tarjeta conv" aria-labelledby="t-bun">
      <h2 class="titulo-tarjeta" id="t-bun">Urea y nitrógeno ureico (BUN)</h2>
      <div class="campos campos-conv">${entrada('v-bun', 'BUN (mg/dL)', '20')}${entrada('v-urea', 'Urea (mg/dL)', '')}</div>
      <p class="discreto">Urea = BUN × 2.14.</p>
    </section>
    <section class="tarjeta" aria-labelledby="t-fact">
      <h2 class="titulo-tarjeta" id="t-fact">Factores de conversión</h2>
      <div class="tabla-envoltura"><table class="tabla">
        <thead><tr><th scope="col">Analito</th><th scope="col">Convencional</th><th scope="col">SI</th><th scope="col" class="num-col">Multiplicar por</th></tr></thead>
        <tbody>${ANALITOS.map((a) => `<tr><th scope="row">${esc(a.texto)}</th><td>${esc(a.conv)}</td><td>${esc(a.si)}</td><td class="num-col">${fmtNum(a.factor)}</td></tr>`).join('')}</tbody>
      </table></div>
    </section>`;
}

function panelGlucemia() {
  return `
    <section class="tarjeta conv" aria-labelledby="t-a1c">
      <h2 class="titulo-tarjeta" id="t-a1c">HbA1c ↔ glucosa promedio estimada</h2>
      <p class="discreto">Escribe cualquiera de los cuatro valores; los demás se calculan. Relación del estudio ADAG: glucosa promedio = 28.7 × HbA1c − 46.7 mg/dL.</p>
      <div class="campos campos-conv campos-a1c">
        ${entrada('v-a1c', 'HbA1c (%)', '7')}
        ${entrada('v-ifcc', 'HbA1c (mmol/mol)', '')}
        ${entrada('v-eag', 'Glucosa promedio (mg/dL)', '')}
        ${entrada('v-eag-mmol', 'Glucosa promedio (mmol/L)', '')}
      </div>
      <p class="aviso-inline" id="e-a1c" role="status" hidden></p>
      <p class="resultado-a1c" id="s-a1c" aria-live="polite"></p>
    </section>
    <section class="tarjeta conv" aria-labelledby="t-gmi">
      <h2 class="titulo-tarjeta" id="t-gmi">GMI desde el monitor continuo</h2>
      <p class="discreto">El indicador de manejo de la glucosa (GMI) estima la HbA1c a partir de la glucosa media de un monitor continuo: GMI (%) = 3.31 + 0.02392 × glucosa media (mg/dL).</p>
      <div class="campos campos-conv">${entrada('v-gmi-mgdl', 'Glucosa media del monitor (mg/dL)', '')}${entrada('v-gmi-mmol', 'Glucosa media del monitor (mmol/L)', '')}</div>
      <p class="aviso-inline" id="e-gmi" role="status" hidden></p>
      <p class="resultado-a1c" id="s-gmi" aria-live="polite"></p>
    </section>
    <section class="tarjeta" aria-labelledby="t-tabla-a1c">
      <h2 class="titulo-tarjeta" id="t-tabla-a1c">Tabla de equivalencias</h2>
      <div class="tabla-envoltura"><table class="tabla">
        <thead>
          <tr><th scope="colgroup" colspan="2">HbA1c</th><th scope="colgroup" colspan="2" class="num-col">Glucosa promedio</th></tr>
          <tr><th scope="col">%</th><th scope="col" class="num-col">mmol/mol</th><th scope="col" class="num-col">mg/dL</th><th scope="col" class="num-col">mmol/L</th></tr>
        </thead>
        <tbody>${TABLA_EAG.map((x) => `<tr><th scope="row">${x.a1c}</th><td class="num-col">${Math.round(x.ifcc)}</td><td class="num-col">${Math.round(x.mgdl)}</td><td class="num-col">${x.mmol.toFixed(1)}</td></tr>`).join('')}</tbody>
      </table></div>
      <p class="discreto">Calculada con la ecuación de ADAG y la ecuación maestra IFCC–NGSP.</p>
    </section>
    <section class="tarjeta" aria-labelledby="t-a1c-notas">
      <h2 class="titulo-tarjeta" id="t-a1c-notas">Al interpretar</h2>
      <ul class="lista-notas">
        <li>La glucosa promedio estimada es un promedio poblacional: la de cada persona puede ser mayor o menor con la misma HbA1c (en ADAG, R² 0.84).</li>
        <li>La HbA1c puede no reflejar la glucemia con anemia o hemorragia reciente, transfusión, hemólisis, hemoglobinopatías, enfermedad renal crónica avanzada o diálisis, eritropoyetina o tratamiento de la anemia ferropénica.</li>
        <li>El GMI y la HbA1c del laboratorio pueden diferir en la misma persona; la diferencia no indica un error de ninguno de los dos.</li>
        <li>La conversión entre % y mmol/mol solo cambia la unidad; no cambia el resultado.</li>
      </ul>
      <p class="nota-seguridad">${icono('libro')} <span>Nathan DM et al. Translating the A1C assay into estimated average glucose values. Diabetes Care. 2008;31(8):1473-8 (doi 10.2337/dc08-0545). Bergenstal RM et al. Glucose Management Indicator (GMI). Diabetes Care. 2018;41(11):2275-80 (doi 10.2337/dc18-1581).</span></p>
    </section>`;
}

export const PESTANAS_UNIDADES = SECCIONES.map(([id]) => id);

export function renderUnidades({ pestana }) {
  const panel = { lineales: panelLineales, dosis: panelDosis, electrolitos: panelElectrolitos, laboratorio: panelLaboratorio, glucemia: panelGlucemia }[pestana]();
  return `
    <section class="vista unidades">
      <a class="migas" href="#/d/calculadoras">${icono('atras')} Calculadoras</a>
      <header class="cabecera">
        <p class="ceja">Calculadoras · Calculadora clínica</p>
        <h1>Conversión de unidades</h1>
        <p class="entradilla">Escribe un valor y elige su unidad: Huella lo convierte a las demás. Referencia rápida para masa, volumen, concentración, dosis, goteo, electrolitos, laboratorio y HbA1c.</p>
      </header>
      <nav class="pestanas-med" aria-label="Secciones de conversión">
        ${SECCIONES.map(([id, nombre]) => `<a href="#/unidades/${id}"${id === pestana ? ' aria-current="page" class="activo"' : ''}>${esc(nombre)}</a>`).join('')}
      </nav>
      <div id="panel-unidades">${panel}</div>
    </section>`;
}

export function montarUnidades({ pestana }) {
  const v = (id) => numero($(`#${id}`)?.value);
  const escribir = (id, x) => { const el = $(`#${id}`); if (el) el.value = x == null ? '' : String(fmtNum(x)); };
  const enlazar = (ids, fn) => ids.forEach((id) => $(`#${id}`)?.addEventListener('input', (ev) => fn(ev.target.id)));

  if (pestana === 'lineales') {
    for (const g of GRUPOS_LINEALES) {
      const act = () => {
        const res = convertirLineal(g.id, v(`v-${g.id}`), $(`#u-${g.id}`).value);
        $(`#s-${g.id}`).innerHTML = res.length ? lista(res.filter((r) => r.unidad.id !== $(`#u-${g.id}`).value).map((r) => [r.unidad.texto, esc(fmtNum(r.valor))])) : '';
      };
      enlazar([`v-${g.id}`, `u-${g.id}`], act);
      act();
    }
    enlazar(['v-c', 'v-f'], (id) => {
      if (id === 'v-c') escribir('v-f', v('v-c') == null ? null : cAF(v('v-c')));
      else escribir('v-c', v('v-f') == null ? null : fAC(v('v-f')));
    });
    escribir('v-f', cAF(37));
    const prop = (id) => {
      if (id === 'v-prop') escribir('v-mgml', proporcionAMgMl(v('v-prop')));
      else escribir('v-prop', mgMlAProporcion(v('v-mgml')));
      const mgml = v('v-mgml');
      $('#s-prop').innerHTML = mgml ? lista([['mcg/mL', esc(fmtNum(mgml * 1000))], ['Porcentaje', `${esc(fmtNum(mgml / 10))} %`]]) : '';
    };
    enlazar(['v-prop', 'v-mgml'], prop);
    prop('v-prop');
  }

  if (pestana === 'dosis') {
    const vel = () => {
      const res = convertirVelocidad(v('v-vel'), $('#u-vel').value, v('v-vel-peso'));
      const sinPeso = !(v('v-vel-peso') > 0) && UNIDADES_VELOCIDAD.find((u) => u.id === $('#u-vel').value)?.porKg;
      $('#s-vel').innerHTML = res.length
        ? `${lista(res.filter((r) => r.unidad !== $('#u-vel').value).map((r) => [r.unidad, esc(fmtNum(r.valor))]))}${sinPeso ? '<p class="discreto">Escribe el peso para convertir a dosis totales (sin kg).</p>' : ''}`
        : '';
    };
    enlazar(['v-vel', 'u-vel', 'v-vel-peso'], vel);
    vel();
    const got = (id) => {
      const fac = Number($('#u-goteo').value);
      if (id === 'v-gotas') escribir('v-mlh', v('v-gotas') == null ? null : gotasAMlh(v('v-gotas'), fac));
      else escribir('v-gotas', v('v-mlh') == null ? null : mlhAGotas(v('v-mlh'), fac));
      const mlh = v('v-mlh');
      $('#s-goteo').textContent = mlh ? `${fmtNum(mlh)} mL/h = ${fmtNum(mlh * 24)} mL en 24 h; un litro pasa en ${fmtNum(1000 / mlh)} h.` : '';
    };
    enlazar(['v-mlh', 'v-gotas', 'u-goteo'], got);
    got('v-mlh');
  }

  if (pestana === 'electrolitos') {
    const ion = () => {
      const r = convertirIon($('#u-ion').value, v('v-ion'), $('#u-ion-de').value);
      $('#s-ion').innerHTML = r ? lista([['mEq', esc(fmtNum(r.mEq))], ['mmol', esc(fmtNum(r.mmol))], ['mg', esc(fmtNum(r.mg))]]) : '';
    };
    enlazar(['u-ion', 'v-ion', 'u-ion-de'], ion);
    ion();
    const sal = () => {
      const c = contenidoSal($('#u-sal').value, v('v-sal'));
      $('#s-sal').innerHTML = c ? lista([['mEq de ' + c.ion.id, esc(fmtNum(c.mEq))], ['mmol', esc(fmtNum(c.mmol))], ['mg de ' + c.ion.id, esc(fmtNum(c.mgIon))]]) : '';
    };
    enlazar(['u-sal', 'v-sal'], sal);
    sal();
  }

  if (pestana === 'laboratorio') {
    const lab = (id) => {
      const a = ANALITOS.find((x) => x.id === $('#u-lab').value);
      if (id === 'v-lab-si') escribir('v-lab-conv', v('v-lab-si') == null ? null : v('v-lab-si') / a.factor);
      else escribir('v-lab-si', v('v-lab-conv') == null ? null : v('v-lab-conv') * a.factor);
      $('#s-lab').textContent = `${a.texto}: ${a.conv} × ${fmtNum(a.factor)} = ${a.si}.`;
      $('label:has(#v-lab-conv) span').textContent = `Convencional (${a.conv})`;
      $('label:has(#v-lab-si) span').textContent = `SI (${a.si})`;
    };
    enlazar(['u-lab', 'v-lab-conv', 'v-lab-si'], lab);
    lab('v-lab-conv');
    enlazar(['v-bun', 'v-urea'], (id) => {
      if (id === 'v-bun') escribir('v-urea', v('v-bun') == null ? null : bunAUrea(v('v-bun')));
      else escribir('v-bun', v('v-urea') == null ? null : ureaABun(v('v-urea')));
    });
    escribir('v-urea', bunAUrea(20));
  }

  if (pestana === 'glucemia') {
    // Lee un campo con sus límites: número válido, o null con el mensaje de error.
    const leer = (id, lim, nombre) => {
      const t = String($(`#${id}`)?.value ?? '').trim();
      if (t === '') return { valor: null };
      const n = numero(t);
      if (n == null || /^-/.test(t)) return { valor: null, error: `${nombre}: escribe solo un número positivo.` };
      if (n < lim.min || n > lim.max) return { valor: null, error: `${nombre}: fuera del rango posible (${lim.min} a ${lim.max}).` };
      return { valor: n };
    };
    const mostrarError = (id, msg) => { const e = $(`#${id}`); e.hidden = !msg; e.textContent = msg || ''; };
    const glucemia = (origen) => {
      const L = LIMITES_GLUCEMIA;
      const campos = { 'v-a1c': ['a1c', 'HbA1c (%)'], 'v-ifcc': ['ifcc', 'HbA1c (mmol/mol)'], 'v-eag': ['mgdl', 'Glucosa promedio (mg/dL)'], 'v-eag-mmol': ['mmol', 'Glucosa promedio (mmol/L)'] };
      const [clave, nombre] = campos[origen];
      const r = leer(origen, L[clave], nombre);
      mostrarError('e-a1c', r.error);
      let a1c = null;
      if (r.valor != null) a1c = clave === 'a1c' ? r.valor : clave === 'ifcc' ? ifccANgsp(r.valor) : clave === 'mgdl' ? a1cDeEag(r.valor) : a1cDeEag(mmolAMgdl(r.valor));
      const eag = a1c == null ? null : eagDeA1c(a1c);
      const valores = { 'v-a1c': a1c, 'v-ifcc': a1c == null ? null : ngspAIfcc(a1c), 'v-eag': eag, 'v-eag-mmol': eag == null ? null : mgdlAMmol(eag) };
      for (const [id, x] of Object.entries(valores)) {
        if (id === origen) continue;
        const el = $(`#${id}`);
        el.value = x == null ? '' : id === 'v-a1c' ? x.toFixed(1) : id === 'v-eag-mmol' ? x.toFixed(1) : String(Math.round(x));
      }
      const s = $('#s-a1c');
      if (a1c == null || eag == null || eag <= 0) { s.innerHTML = ''; if (a1c != null && eag <= 0) mostrarError('e-a1c', 'Con ese valor la ecuación da una glucosa promedio de cero o negativa: está fuera de lo que describe.'); return; }
      const fuera = a1c < RANGO_TABLA_ADAG.min || a1c > RANGO_TABLA_ADAG.max;
      const desde = clave === 'a1c' || clave === 'ifcc';
      s.innerHTML = `<strong>HbA1c ${esc(a1c.toFixed(1))} % (${esc(String(Math.round(ngspAIfcc(a1c))))} mmol/mol) ≈ glucosa promedio de ${esc(String(Math.round(eag)))} mg/dL (${esc(mgdlAMmol(eag).toFixed(1))} mmol/L).</strong>${desde ? '' : ' <span class="discreto">HbA1c equivalente según ADAG; si la glucosa media viene de un monitor continuo, usa el GMI.</span>'}${fuera ? ` <span class="aviso-a1c">${icono('alerta')} Fuera del intervalo de la tabla de ADAG (${RANGO_TABLA_ADAG.min} a ${RANGO_TABLA_ADAG.max} %): es una extrapolación.</span>` : ''}`;
    };
    const ids = ['v-a1c', 'v-ifcc', 'v-eag', 'v-eag-mmol'];
    ids.forEach((id) => $(`#${id}`).addEventListener('input', () => glucemia(id)));
    glucemia('v-a1c');
    const gmi = (origen) => {
      const L = LIMITES_GLUCEMIA;
      const esMg = origen === 'v-gmi-mgdl';
      const r = leer(origen, esMg ? L.mgdl : L.mmol, esMg ? 'Glucosa media (mg/dL)' : 'Glucosa media (mmol/L)');
      mostrarError('e-gmi', r.error);
      const mgdl = r.valor == null ? null : esMg ? r.valor : mmolAMgdl(r.valor);
      const otro = $(esMg ? '#v-gmi-mmol' : '#v-gmi-mgdl');
      otro.value = mgdl == null ? '' : esMg ? mgdlAMmol(mgdl).toFixed(1) : String(Math.round(mgdl));
      const g = gmiDeGlucosaMedia(mgdl);
      $('#s-gmi').innerHTML = g == null ? '' : `<strong>GMI ${esc(g.toFixed(1))} % (${esc(String(Math.round(ngspAIfcc(g))))} mmol/mol)</strong> con una glucosa media de ${esc(String(Math.round(mgdl)))} mg/dL.`;
    };
    ['v-gmi-mgdl', 'v-gmi-mmol'].forEach((id) => $(`#${id}`).addEventListener('input', () => gmi(id)));
  }
}
