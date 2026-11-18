// TurnoYa - Reglas de negocio (ver specs/spec.md: RN-01 a RN-07)
// Lógica pura, sin DOM ni almacenamiento: se puede testear sola.

export const CONFIG = Object.freeze({
  horaApertura: 8,            // RN-01
  horaCierre: 22,             // RN-01 (el último turno empieza a las 21)
  maxDiasAnticipacion: 14,    // RN-03
  maxTurnosActivos: 2,        // RN-04
  horasCancelacionGratis: 24, // RN-06
  horasMinimasCancelar: 2,    // RN-06
  porcentajeCargoTardio: 50,  // RN-07
});

export class ErrorNegocio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.name = 'ErrorNegocio';
    this.codigo = codigo;
  }
}

const HORA_MS = 60 * 60 * 1000;

function fechaValida(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function inicioTurno(fecha, hora) {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d, hora, 0, 0, 0);
}

const clave = (nombre) => nombre.trim().toLowerCase();

export class Agenda {
  #recursos;
  #turnos;
  #ahora;

  constructor({ recursos = [], turnos = [], ahora = () => new Date() } = {}) {
    this.#recursos = recursos.map((r) => ({ ...r }));
    this.#turnos = turnos.map((t) => ({ ...t }));
    this.#ahora = ahora;
  }

  recursos() { return this.#recursos.map((r) => ({ ...r })); }
  turnos() { return this.#turnos.map((t) => ({ ...t })); }

  #recurso(id) {
    const r = this.#recursos.find((x) => x.id === id);
    if (!r) throw new ErrorNegocio('RECURSO_INEXISTENTE', 'El recurso elegido no existe.');
    return r;
  }

  #siguienteId() {
    const max = this.#turnos.reduce((acc, t) => Math.max(acc, Number(t.id.split('-')[1]) || 0), 0);
    return `T-${max + 1}`;
  }

  // Horas del día con su disponibilidad para un recurso (RN-01, RN-02)
  turnosLibres(recursoId, fecha) {
    this.#recurso(recursoId);
    if (!fechaValida(fecha)) throw new ErrorNegocio('DATOS_INVALIDOS', 'La fecha no es válida.');
    const ocupadas = new Set(
      this.#turnos
        .filter((t) => t.estado === 'confirmado' && t.recursoId === recursoId && t.fecha === fecha)
        .map((t) => t.hora),
    );
    const horas = [];
    for (let h = CONFIG.horaApertura; h < CONFIG.horaCierre; h++) {
      horas.push({ hora: h, libre: !ocupadas.has(h) });
    }
    return horas;
  }

  turnosDeCliente(cliente) {
    if (typeof cliente !== 'string' || !cliente.trim()) return [];
    return this.#turnos
      .filter((t) => clave(t.cliente) === clave(cliente))
      .sort((a, b) => inicioTurno(a.fecha, a.hora) - inicioTurno(b.fecha, b.hora))
      .map((t) => ({ ...t }));
  }

  crearTurno({ recursoId, cliente, fecha, hora }) {
    // Datos básicos
    if (typeof cliente !== 'string' || !cliente.trim()) {
      throw new ErrorNegocio('DATOS_INVALIDOS', 'Ingresá tu nombre para reservar.');
    }
    if (!fechaValida(fecha)) throw new ErrorNegocio('DATOS_INVALIDOS', 'La fecha no es válida.');
    if (!Number.isInteger(hora)) {
      throw new ErrorNegocio('DATOS_INVALIDOS', 'Los turnos son de una hora exacta (por ejemplo 10:00).');
    }
    const recurso = this.#recurso(recursoId);

    // RN-01 horario de atención
    if (hora < CONFIG.horaApertura || hora >= CONFIG.horaCierre) {
      throw new ErrorNegocio(
        'FUERA_DE_HORARIO',
        `Atendemos de ${CONFIG.horaApertura}:00 a ${CONFIG.horaCierre}:00. El último turno empieza a las ${CONFIG.horaCierre - 1}:00.`,
      );
    }

    // RN-03 ventana de reserva
    const ahora = this.#ahora();
    const inicio = inicioTurno(fecha, hora);
    if (inicio <= ahora) {
      throw new ErrorNegocio('TURNO_EN_PASADO', 'No se puede reservar un horario que ya pasó.');
    }
    if (inicio - ahora > CONFIG.maxDiasAnticipacion * 24 * HORA_MS) {
      throw new ErrorNegocio('MUY_ANTICIPADO', `Solo se puede reservar con hasta ${CONFIG.maxDiasAnticipacion} días de anticipación.`);
    }

    const activos = this.#turnos.filter((t) => t.estado === 'confirmado');

    // RN-02 sin solapamientos en el mismo recurso
    if (activos.some((t) => t.recursoId === recursoId && t.fecha === fecha && t.hora === hora)) {
      throw new ErrorNegocio('RECURSO_OCUPADO', 'Ese horario ya está reservado. Elegí otro.');
    }

    // RN-05 una persona no puede estar en dos lugares a la vez
    const delCliente = activos.filter((t) => clave(t.cliente) === clave(cliente));
    if (delCliente.some((t) => t.fecha === fecha && t.hora === hora)) {
      throw new ErrorNegocio('CLIENTE_OCUPADO', 'Ya tenés otro turno a esa misma hora.');
    }

    // RN-04 máximo de turnos activos
    const futuros = delCliente.filter((t) => inicioTurno(t.fecha, t.hora) > ahora);
    if (futuros.length >= CONFIG.maxTurnosActivos) {
      throw new ErrorNegocio('LIMITE_TURNOS', `Ya tenés ${CONFIG.maxTurnosActivos} turnos activos. Cancelá uno para reservar otro.`);
    }

    const turno = {
      id: this.#siguienteId(),
      recursoId,
      cliente: cliente.trim(),
      fecha,
      hora,
      estado: 'confirmado',
      precio: recurso.precio,
      cargo: 0,
    };
    this.#turnos.push(turno);
    return { ...turno };
  }

  // Calcula qué pasaría al cancelar, sin modificar nada (RN-06, RN-07)
  evaluarCancelacion(id) {
    const turno = this.#turnos.find((t) => t.id === id);
    if (!turno) throw new ErrorNegocio('TURNO_INEXISTENTE', 'El turno no existe.');
    if (turno.estado !== 'confirmado') {
      throw new ErrorNegocio('TURNO_NO_CANCELABLE', 'Ese turno ya fue cancelado.');
    }
    const horasRestantes = (inicioTurno(turno.fecha, turno.hora) - this.#ahora()) / HORA_MS;
    if (horasRestantes < CONFIG.horasMinimasCancelar) {
      throw new ErrorNegocio(
        'NO_SE_PUEDE_CANCELAR',
        `Ya no se puede cancelar: faltan menos de ${CONFIG.horasMinimasCancelar} horas.`,
      );
    }
    if (horasRestantes >= CONFIG.horasCancelacionGratis) {
      return { estado: 'cancelado', cargo: 0 };
    }
    return {
      estado: 'cancelado_con_cargo',
      cargo: Math.round((turno.precio * CONFIG.porcentajeCargoTardio) / 100),
    };
  }

  cancelarTurno(id) {
    const resultado = this.evaluarCancelacion(id);
    const turno = this.#turnos.find((t) => t.id === id);
    turno.estado = resultado.estado;
    turno.cargo = resultado.cargo;
    return { ...turno };
  }
}
