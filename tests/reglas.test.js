import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Agenda, ErrorNegocio, CONFIG } from '../src/reglas.js';

// "Hoy" fijo para que los tests sean repetibles: martes 17/11/2026 a las 10:00
const AHORA = new Date(2026, 10, 17, 10, 0, 0);
const RECURSOS = [
  { id: 'futbol5', nombre: 'Cancha de Fútbol 5', tipo: 'cancha', precio: 12000 },
  { id: 'padel', nombre: 'Cancha de Pádel', tipo: 'cancha', precio: 9000 },
];
const nueva = () => new Agenda({ recursos: RECURSOS, ahora: () => AHORA });
const codigo = (c) => (e) => e instanceof ErrorNegocio && e.codigo === c;
const turno = (extra = {}) => ({ recursoId: 'futbol5', cliente: 'Luca', fecha: '2026-11-20', hora: 18, ...extra });

test('Reserva válida queda confirmada y guarda el precio', () => {
  const t = nueva().crearTurno(turno());
  assert.equal(t.estado, 'confirmado');
  assert.equal(t.precio, 12000);
  assert.equal(t.cargo, 0);
});

test('RN-01: no se reserva fuera del horario de atención', () => {
  const a = nueva();
  assert.throws(() => a.crearTurno(turno({ hora: 7 })), codigo('FUERA_DE_HORARIO'));
  assert.throws(() => a.crearTurno(turno({ hora: 22 })), codigo('FUERA_DE_HORARIO'));
  assert.equal(a.crearTurno(turno({ hora: 8 })).hora, 8);
  assert.equal(a.crearTurno(turno({ hora: 21, fecha: '2026-11-21' })).hora, 21);
});

test('RN-01: los turnos son de una hora exacta', () => {
  assert.throws(() => nueva().crearTurno(turno({ hora: 9.5 })), codigo('DATOS_INVALIDOS'));
});

test('RN-02: no se pueden solapar turnos en el mismo recurso', () => {
  const a = nueva();
  a.crearTurno(turno());
  assert.throws(() => a.crearTurno(turno({ cliente: 'Ana' })), codigo('RECURSO_OCUPADO'));
});

test('RN-02: el mismo horario en otro recurso sí está disponible', () => {
  const a = nueva();
  a.crearTurno(turno());
  assert.equal(a.crearTurno(turno({ cliente: 'Ana', recursoId: 'padel' })).recursoId, 'padel');
});

test('RN-03: no se reserva en el pasado', () => {
  const a = nueva();
  assert.throws(() => a.crearTurno(turno({ fecha: '2026-11-17', hora: 9 })), codigo('TURNO_EN_PASADO'));
  assert.throws(() => a.crearTurno(turno({ fecha: '2026-11-17', hora: 10 })), codigo('TURNO_EN_PASADO'));
  assert.equal(a.crearTurno(turno({ fecha: '2026-11-17', hora: 11 })).hora, 11);
});

test('RN-03: máximo 14 días de anticipación', () => {
  const a = nueva();
  assert.equal(a.crearTurno(turno({ fecha: '2026-12-01', hora: 10 })).fecha, '2026-12-01');
  assert.throws(() => a.crearTurno(turno({ fecha: '2026-12-01', hora: 11, cliente: 'Ana' })), codigo('MUY_ANTICIPADO'));
  assert.throws(() => a.crearTurno(turno({ fecha: '2026-12-15', cliente: 'Bruno' })), codigo('MUY_ANTICIPADO'));
});

test('RN-04: máximo 2 turnos activos por persona, y cancelar libera cupo', () => {
  const a = nueva();
  a.crearTurno(turno({ hora: 10, fecha: '2026-11-25' }));
  const segundo = a.crearTurno(turno({ hora: 12, fecha: '2026-11-25' }));
  assert.throws(() => a.crearTurno(turno({ hora: 14, fecha: '2026-11-25' })), codigo('LIMITE_TURNOS'));
  a.cancelarTurno(segundo.id);
  assert.equal(a.crearTurno(turno({ hora: 14, fecha: '2026-11-25' })).hora, 14);
});

test('RN-04: el nombre no distingue mayúsculas ni espacios sobrantes', () => {
  const a = nueva();
  a.crearTurno(turno({ cliente: 'Luca', hora: 10 }));
  a.crearTurno(turno({ cliente: ' luca ', hora: 12 }));
  assert.throws(() => a.crearTurno(turno({ cliente: 'LUCA', hora: 14 })), codigo('LIMITE_TURNOS'));
});

test('RN-05: una persona no puede tener dos turnos a la misma hora', () => {
  const a = nueva();
  a.crearTurno(turno());
  assert.throws(() => a.crearTurno(turno({ recursoId: 'padel' })), codigo('CLIENTE_OCUPADO'));
});

test('RN-06: cancelar con 24 h o más es gratis y libera el horario', () => {
  const a = nueva();
  const t = a.crearTurno(turno({ fecha: '2026-11-18', hora: 10 })); // faltan exactamente 24 h
  const c = a.cancelarTurno(t.id);
  assert.equal(c.estado, 'cancelado');
  assert.equal(c.cargo, 0);
  assert.equal(a.turnosLibres('futbol5', '2026-11-18').find((h) => h.hora === 10).libre, true);
});

test('RN-06/RN-07: cancelar entre 2 y 24 h tiene cargo del 50%', () => {
  const a = nueva();
  const t = a.crearTurno(turno({ fecha: '2026-11-18', hora: 9 })); // faltan 23 h
  const c = a.cancelarTurno(t.id);
  assert.equal(c.estado, 'cancelado_con_cargo');
  assert.equal(c.cargo, 6000);
  const justo = a.crearTurno(turno({ fecha: '2026-11-17', hora: 12, recursoId: 'padel' })); // faltan exactamente 2 h
  assert.equal(a.cancelarTurno(justo.id).cargo, 4500);
});

test('RN-06: con menos de 2 h ya no se puede cancelar', () => {
  const a = nueva();
  const t = a.crearTurno(turno({ fecha: '2026-11-17', hora: 11 })); // falta 1 h
  assert.throws(() => a.cancelarTurno(t.id), codigo('NO_SE_PUEDE_CANCELAR'));
  assert.equal(a.turnos()[0].estado, 'confirmado');
});

test('Cancelar un turno inexistente o ya cancelado da error', () => {
  const a = nueva();
  assert.throws(() => a.cancelarTurno('T-99'), codigo('TURNO_INEXISTENTE'));
  const t = a.crearTurno(turno());
  a.cancelarTurno(t.id);
  assert.throws(() => a.cancelarTurno(t.id), codigo('TURNO_NO_CANCELABLE'));
});

test('Datos inválidos: nombre vacío, fecha inexistente y recurso desconocido', () => {
  const a = nueva();
  assert.throws(() => a.crearTurno(turno({ cliente: '   ' })), codigo('DATOS_INVALIDOS'));
  assert.throws(() => a.crearTurno(turno({ fecha: '2026-02-31' })), codigo('DATOS_INVALIDOS'));
  assert.throws(() => a.crearTurno(turno({ recursoId: 'golf' })), codigo('RECURSO_INEXISTENTE'));
});

test('turnosLibres lista de 8 a 21 y marca los ocupados', () => {
  const a = nueva();
  a.crearTurno(turno({ hora: 18 }));
  const horas = a.turnosLibres('futbol5', '2026-11-20');
  assert.equal(horas.length, CONFIG.horaCierre - CONFIG.horaApertura);
  assert.equal(horas.find((h) => h.hora === 18).libre, false);
  assert.equal(horas.find((h) => h.hora === 19).libre, true);
});
