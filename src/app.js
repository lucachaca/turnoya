// TurnoYa - Interfaz. Toda la lógica de negocio vive en reglas.js (ver specs/plan.md).
import { Agenda, CONFIG, ErrorNegocio, inicioTurno } from './reglas.js';

const RECURSOS = [
  { id: 'futbol5', nombre: 'Cancha de Fútbol 5', tipo: 'cancha', precio: 12000 },
  { id: 'padel', nombre: 'Cancha de Pádel', tipo: 'cancha', precio: 9000 },
  { id: 'consultorio', nombre: 'Consultorio Dra. Gómez', tipo: 'consultorio', precio: 15000 },
];
const CLAVE = 'turnoya.v1';
const $ = (id) => document.getElementById(id);
const pesos = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
const pad = (n) => String(n).padStart(2, '0');
const aISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const etiquetaFecha = (iso) => {
  const t = inicioTurno(iso, 0).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE)) ?? {}; } catch { return {}; }
}
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify({ turnos: agenda.turnos(), cliente: estado.cliente })); } catch { /* sin almacenamiento: la app sigue en memoria */ }
}

const guardado = leer();
let agenda = new Agenda({ recursos: RECURSOS, turnos: guardado.turnos ?? [] });
const manana = new Date(); manana.setDate(manana.getDate() + 1);
const estado = { cliente: guardado.cliente ?? '', recursoId: RECURSOS[0].id, fecha: aISO(manana) };

function el(tag, props = {}, ...hijos) {
  const nodo = document.createElement(tag);
  Object.assign(nodo, props);
  nodo.append(...hijos);
  return nodo;
}

let temporizador;
function avisar(texto, tipo) {
  const a = $('aviso');
  a.textContent = texto; a.className = tipo; a.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { a.hidden = true; }, 4500);
}

function intentar(accion, mensajeOk) {
  try {
    const r = accion();
    guardar(); render();
    if (mensajeOk) avisar(mensajeOk(r), 'ok');
  } catch (e) {
    if (e instanceof ErrorNegocio) avisar(e.message, 'error'); else throw e;
  }
}

function renderRecursos() {
  $('recursos').replaceChildren(...agenda.recursos().map((r) => {
    const b = el('button', { type: 'button', className: 'recurso' }, el('strong', {}, r.nombre), el('span', {}, `${r.tipo === 'cancha' ? 'Cancha' : 'Consultorio'} · ${pesos(r.precio)} por hora`));
    b.setAttribute('aria-pressed', String(r.id === estado.recursoId));
    b.addEventListener('click', () => { estado.recursoId = r.id; render(); });
    return b;
  }));
}

function renderGrilla() {
  $('fecha-titulo').textContent = etiquetaFecha(estado.fecha);
  const ahora = new Date();
  const mios = new Set(agenda.turnosDeCliente(estado.cliente)
    .filter((t) => t.estado === 'confirmado' && t.recursoId === estado.recursoId && t.fecha === estado.fecha).map((t) => t.hora));
  $('grilla').replaceChildren(...agenda.turnosLibres(estado.recursoId, estado.fecha).map(({ hora, libre }) => {
    const paso = inicioTurno(estado.fecha, hora) <= ahora;
    let clase = 'libre', leyenda = 'Libre';
    if (mios.has(hora)) { clase = 'mio'; leyenda = 'Tu turno'; }
    else if (!libre) { clase = 'ocupado'; leyenda = 'Ocupado'; }
    else if (paso) { clase = 'pasado'; leyenda = 'Pasó'; }
    const b = el('button', { type: 'button', className: `hora ${clase}` }, el('b', {}, pad(hora)), el('small', {}, leyenda));
    b.setAttribute('aria-label', `${pad(hora)}:00, ${leyenda}`);
    if (clase === 'libre') {
      b.addEventListener('click', () => intentar(
        () => agenda.crearTurno({ recursoId: estado.recursoId, cliente: estado.cliente, fecha: estado.fecha, hora }),
        (t) => `Turno confirmado: ${etiquetaFecha(t.fecha)}, ${pad(t.hora)}:00.`));
    } else { b.disabled = true; }
    return b;
  }));
}

const ETIQUETA = { confirmado: 'Confirmado', cancelado: 'Cancelado', cancelado_con_cargo: 'Cancelado con cargo' };

function renderMisTurnos() {
  const contenedor = $('mis-turnos');
  if (!estado.cliente.trim()) { contenedor.replaceChildren(el('p', { className: 'vacio' }, 'Escribí tu nombre para ver y cancelar tus turnos.')); return; }
  const lista = agenda.turnosDeCliente(estado.cliente);
  if (!lista.length) { contenedor.replaceChildren(el('p', { className: 'vacio' }, 'Todavía no tenés turnos. Elegí una hora libre para reservar.')); return; }
  contenedor.replaceChildren(...lista.map((t) => {
    const recurso = RECURSOS.find((r) => r.id === t.recursoId);
    const caja = el('div', { className: `turno ${t.estado}` },
      el('div', { className: 'top' }, el('strong', {}, recurso.nombre), el('span', { className: `estado ${t.estado}` }, ETIQUETA[t.estado])),
      el('div', {}, `${etiquetaFecha(t.fecha)} · ${pad(t.hora)}:00`),
      el('div', { className: 'vacio' }, t.estado === 'cancelado_con_cargo' ? `Cargo por cancelación: ${pesos(t.cargo)}` : `Precio: ${pesos(t.precio)}`));
    if (t.estado === 'confirmado') {
      const b = el('button', { type: 'button', className: 'btn peligro' }, 'Cancelar turno');
      b.addEventListener('click', () => pedirCancelacion(t));
      caja.append(b);
    }
    return caja;
  }));
}

function pedirCancelacion(t) {
  let previa;
  try { previa = agenda.evaluarCancelacion(t.id); } catch (e) { if (e instanceof ErrorNegocio) { avisar(e.message, 'error'); return; } throw e; }
  $('dialogo-texto').textContent = previa.cargo === 0
    ? 'Faltan 24 horas o más: la cancelación es gratis.'
    : `Faltan menos de ${CONFIG.horasCancelacionGratis} horas: se te cobra el ${CONFIG.porcentajeCargoTardio}% (${pesos(previa.cargo)}).`;
  const d = $('dialogo');
  d.showModal();
  $('dialogo-no').onclick = () => d.close();
  $('dialogo-si').onclick = () => {
    d.close();
    intentar(() => agenda.cancelarTurno(t.id), (r) => (r.cargo ? `Turno cancelado. Cargo: ${pesos(r.cargo)}.` : 'Turno cancelado sin costo.'));
  };
}

function render() { renderRecursos(); renderGrilla(); renderMisTurnos(); }

// Entradas
const fecha = $('fecha');
const hoy = new Date(); const tope = new Date(); tope.setDate(tope.getDate() + CONFIG.maxDiasAnticipacion);
fecha.min = aISO(hoy); fecha.max = aISO(tope); fecha.value = estado.fecha;
fecha.addEventListener('change', () => { if (fecha.value) { estado.fecha = fecha.value; render(); } });
$('cliente').value = estado.cliente;
$('cliente').addEventListener('input', (e) => { estado.cliente = e.target.value; guardar(); renderGrilla(); renderMisTurnos(); });
$('reiniciar').addEventListener('click', () => { agenda = new Agenda({ recursos: RECURSOS }); guardar(); render(); avisar('Datos de prueba borrados.', 'ok'); });

$('reglas').replaceChildren(...[
  `Atendemos de ${CONFIG.horaApertura}:00 a ${CONFIG.horaCierre}:00, en turnos de 1 hora.`,
  'Un horario ocupado no se puede reservar dos veces.',
  `Reservá hasta ${CONFIG.maxDiasAnticipacion} días antes. No se reservan horarios que ya pasaron.`,
  `Podés tener ${CONFIG.maxTurnosActivos} turnos activos a la vez, y nunca dos a la misma hora.`,
  `Cancelación gratis hasta ${CONFIG.horasCancelacionGratis} h antes. Entre ${CONFIG.horasCancelacionGratis} h y ${CONFIG.horasMinimasCancelar} h se cobra el ${CONFIG.porcentajeCargoTardio}%. Con menos de ${CONFIG.horasMinimasCancelar} h no se puede cancelar.`,
].map((t) => el('li', {}, t)));

render();
