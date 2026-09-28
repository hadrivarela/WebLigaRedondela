// Lógica de la web pública: carga las jornadas guardadas en DatosJornadas/
// y las presenta como resultados por jornada, clasificación y evolución.

let CONFIG = null;
let JORNADAS = [];

async function init() {
  CONFIG = await cargarConfig();
  JORNADAS = await cargarJornadas();

  document.getElementById('titulo').textContent = CONFIG.torneo || 'Liga de Redondela';
  document.getElementById('organiza').textContent = CONFIG.organiza || '';
  document.getElementById('fecha').textContent = calcularUltimaFecha();

  if (JORNADAS.length === 0) {
    document.querySelector('#sec-jornada .cabecera-jornada').style.display = 'none';
    document.getElementById('contenido-jornada').innerHTML = mensajeVacio();
    document.getElementById('sec-clasi').innerHTML = mensajeVacio();
    document.getElementById('sec-evolucion').innerHTML = mensajeVacio();
    return;
  }

  construirSelectorJornadas();
  pintarJornada(JORNADAS.length - 1);
  pintarClasificacion();
  pintarEvolucion();
}

function mensajeVacio() {
  return `<div class="tarjeta"><p class="vacio">Todavía no hay jornadas cargadas. Usa la <a href="admin.html">herramienta de digitalización</a> para añadir la primera.</p></div>`;
}

async function cargarConfig() {
  try {
    const r = await fetch('config.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('sin config.json');
    return await r.json();
  } catch (e) {
    return { torneo: 'Liga de Redondela', organiza: '' };
  }
}

// Las jornadas se guardan como DatosJornadas/Jornada1.json, Jornada2.json, ...
// Al ser una web estática no se puede listar la carpeta, así que se prueban
// números consecutivos hasta que uno no exista.
async function cargarJornadas(maxJornadas = 300) {
  const jornadas = [];
  for (let n = 1; n <= maxJornadas; n++) {
    let res;
    try {
      res = await fetch(`DatosJornadas/Jornada${n}.json`, { cache: 'no-store' });
    } catch (e) {
      break;
    }
    if (!res.ok) break;
    try {
      jornadas.push(await res.json());
    } catch (e) {
      break;
    }
  }
  jornadas.sort((a, b) => a.numero - b.numero);
  return jornadas;
}

function calcularUltimaFecha() {
  const fechas = JORNADAS.map(j => j.fecha).filter(Boolean).sort();
  return fechas.length ? fechas[fechas.length - 1] : '—';
}

function formatearFecha(fechaISO) {
  try {
    return new Date(fechaISO + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return fechaISO;
  }
}

function partidoHTML(p) {
  const jugado = Number.isInteger(p.gl) && Number.isInteger(p.gv);
  const marcador = jugado ? `${p.gl} - ${p.gv}` : 'Pendiente';
  return `<div class="partido">
    <div class="equipo izq">${p.local}</div>
    <div class="marcador${jugado ? '' : ' pendiente'}">${marcador}</div>
    <div class="equipo der">${p.visitante}</div>
    <div class="meta">📍 ${p.campo || 'Por confirmar'}</div>
  </div>`;
}

function construirSelectorJornadas() {
  const select = document.getElementById('selector-jornada');
  select.innerHTML = JORNADAS.map((j, i) =>
    `<option value="${i}">Jornada ${j.numero}</option>`).join('');
  select.value = JORNADAS.length - 1;
  select.addEventListener('change', () => pintarJornada(Number(select.value)));
}

function pintarJornada(indice) {
  const j = JORNADAS[indice];
  if (!j) return;
  const fecha = j.fecha ? formatearFecha(j.fecha) : 'Fecha por confirmar';
  const clasiHastaAqui = calcularClasificacion(JORNADAS.slice(0, indice + 1));
  document.getElementById('contenido-jornada').innerHTML = `
    <div class="tarjeta">
      <h2>Jornada ${j.numero} · ${fecha}</h2>
      ${j.partidos.map(partidoHTML).join('')}
    </div>
    <div class="tarjeta">
      <h2>Clasificación tras la jornada ${j.numero}</h2>
      ${tablaClasificacionHTML(clasiHastaAqui)}
    </div>`;
}

function calcularClasificacion(jornadas) {
  const eq = {};
  const equipo = n => eq[n] ??= { nombre: n, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 };
  jornadas.forEach(j => j.partidos.forEach(p => {
    const L = equipo(p.local), V = equipo(p.visitante);
    if (!Number.isInteger(p.gl) || !Number.isInteger(p.gv)) return;
    L.pj++; V.pj++;
    L.gf += p.gl; L.gc += p.gv; V.gf += p.gv; V.gc += p.gl;
    if (p.gl > p.gv)      { L.g++; L.pts += 3; V.p++; }
    else if (p.gl < p.gv) { V.g++; V.pts += 3; L.p++; }
    else                  { L.e++; V.e++; L.pts++; V.pts++; }
  }));
  return Object.values(eq).sort((a, b) =>
    b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf || a.nombre.localeCompare(b.nombre));
}

function tablaClasificacionHTML(clasificacion) {
  if (clasificacion.length === 0) return '<p class="vacio">Sin datos todavía.</p>';
  const filas = clasificacion.map((e, i) => `
    <tr${i === 0 ? ' class="lider primeros"' : ''}>
      <td class="num pos">${i + 1}</td><td><strong>${e.nombre}</strong></td>
      <td class="num">${e.pj}</td><td class="num">${e.g}</td><td class="num">${e.e}</td><td class="num">${e.p}</td>
      <td class="num">${e.gf}</td><td class="num">${e.gc}</td>
      <td class="num">${e.gf - e.gc > 0 ? '+' : ''}${e.gf - e.gc}</td>
      <td class="num"><strong>${e.pts}</strong></td>
    </tr>`).join('');
  return `<table><thead><tr>
      <th>#</th><th>Equipo</th><th class="num">PJ</th><th class="num">G</th><th class="num">E</th><th class="num">P</th>
      <th class="num">GF</th><th class="num">GC</th><th class="num">DIF</th><th class="num">PTS</th>
    </tr></thead><tbody>${filas}</tbody></table>`;
}

function pintarClasificacion() {
  document.getElementById('sec-clasi').innerHTML =
    `<div class="tarjeta"><h2>Clasificación general</h2>${tablaClasificacionHTML(calcularClasificacion(JORNADAS))}</div>`;
}

// Evolución: puntos acumulados de cada equipo tras cada jornada, para poder
// ver de un vistazo cómo ha ido subiendo o bajando cada equipo semana a semana.
function pintarEvolucion() {
  const clasificacionFinal = calcularClasificacion(JORNADAS);
  const equipos = clasificacionFinal.map(e => e.nombre);
  const puntosPorJornada = JORNADAS.map((_, i) => {
    const clasi = calcularClasificacion(JORNADAS.slice(0, i + 1));
    const mapa = {};
    clasi.forEach(e => mapa[e.nombre] = e.pts);
    return mapa;
  });

  const cabecera = JORNADAS.map(j => `<th class="num">J${j.numero}</th>`).join('');
  const filas = equipos.map((nombre, i) => {
    const celdas = puntosPorJornada.map(mapa =>
      `<td class="num">${mapa[nombre] ?? '–'}</td>`).join('');
    return `<tr${i === 0 ? ' class="lider primeros"' : ''}>
      <td class="num pos">${i + 1}</td><td><strong>${nombre}</strong></td>${celdas}
      <td class="num destacado">${clasificacionFinal[i].pts}</td>
    </tr>`;
  }).join('');

  document.getElementById('sec-evolucion').innerHTML = `
    <div class="tarjeta">
      <h2>Evolución de puntos por jornada</h2>
      <div style="overflow-x:auto">
        <table class="evolucion-tabla">
          <thead><tr><th>#</th><th>Equipo</th>${cabecera}<th class="num">Total</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    </div>`;
}

// Navegación por pestañas
const botones = { 'btn-jornada': 'sec-jornada', 'btn-clasi': 'sec-clasi', 'btn-evolucion': 'sec-evolucion' };
Object.entries(botones).forEach(([btn, sec]) => {
  document.getElementById(btn).addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('activo'));
    document.querySelectorAll('section').forEach(s => s.classList.remove('visible'));
    document.getElementById(btn).classList.add('activo');
    document.getElementById(sec).classList.add('visible');
  });
});

init();
