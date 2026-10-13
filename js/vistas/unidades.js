// Pantalla de conversión de unidades: referencia rápida que convierte en vivo.
import {
  GRUPOS_LINEALES, convertirLineal, cAF, fAC, proporcionAMgMl, mgMlAProporcion, FACTORES_GOTEO, mlhAGotas, gotasAMlh,
  UNIDADES_VELOCIDAD, convertirVelocidad, IONES, SALES, contenidoSal, convertirIon, ANALITOS, bunAUrea, ureaABun, fmtConv,
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

export const PESTANAS_UNIDADES = SECCIONES.map(([id]) => id);

export function renderUnidades({ pestana }) {
  const panel = { lineales: panelLineales, dosis: panelDosis, electrolitos: panelElectrolitos, laboratorio: panelLaboratorio }[pestana]();
  return `
    <section class="vista unidades">
      <a class="migas" href="#/d/calculadoras">${icono('atras')} Calculadoras</a>
      <header class="cabecera">
        <p class="ceja">Calculadoras · Calculadora clínica</p>
        <h1>Conversión de unidades</h1>
        <p class="entradilla">Escribe un valor y elige su unidad: Huella lo convierte a las demás. Referencia rápida para masa, volumen, concentración, dosis, goteo, electrolitos y laboratorio.</p>
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
}
