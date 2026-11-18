# Especificación — TurnoYa v1.0

> Fuente de verdad del comportamiento del sistema. Ver principios en `constitution.md`.

## 1. Resumen
TurnoYa permite reservar y cancelar turnos de **1 hora** en canchas y consultorios. El sistema garantiza que no haya solapamientos, aplica límites por persona y calcula cargos por cancelación tardía.

## 2. Actores
- **Cliente:** identificado por su nombre (sin distinguir mayúsculas ni espacios sobrantes). Reserva, ve y cancela **sus** turnos.

## 3. Recursos (datos iniciales)
| id | Nombre | Tipo | Precio por hora |
|---|---|---|---|
| `futbol5` | Cancha de Fútbol 5 | cancha | $12.000 |
| `padel` | Cancha de Pádel | cancha | $9.000 |
| `consultorio` | Consultorio Dra. Gómez | consultorio | $15.000 |

## 4. Modelo de datos
**Turno:** `id` (T-1, T-2…), `recursoId`, `cliente`, `fecha` (AAAA-MM-DD), `hora` (entero 8–21), `estado`, `precio`, `cargo`.
**Estados:** `confirmado` → `cancelado` (sin cargo) | `cancelado_con_cargo`.

## 5. Historias de usuario
- **HU-1** Como cliente quiero ver qué horarios están libres de un recurso en una fecha, para elegir.
- **HU-2** Como cliente quiero reservar un horario libre y recibir confirmación inmediata.
- **HU-3** Como cliente quiero ver mis turnos y su estado.
- **HU-4** Como cliente quiero cancelar un turno sabiendo antes si me van a cobrar.

## 6. Reglas de negocio
| ID | Regla | Error (código) |
|---|---|---|
| **RN-01** | Se atiende de 08:00 a 22:00. Los turnos duran 1 hora y empiezan en hora exacta; el último empieza a las 21:00. | `FUERA_DE_HORARIO`, `DATOS_INVALIDOS` |
| **RN-02** | Un recurso no puede tener dos turnos confirmados en la misma fecha y hora. Los turnos cancelados liberan el horario. | `RECURSO_OCUPADO` |
| **RN-03** | No se reserva un horario que ya empezó o pasó. Se reserva hasta 14 días (336 h) antes del inicio. | `TURNO_EN_PASADO`, `MUY_ANTICIPADO` |
| **RN-04** | Cada cliente puede tener como máximo **2 turnos confirmados futuros**. Cancelar libera cupo. | `LIMITE_TURNOS` |
| **RN-05** | Un cliente no puede tener dos turnos confirmados a la misma fecha y hora, aunque sean en recursos distintos. | `CLIENTE_OCUPADO` |
| **RN-06** | Cancelación según tiempo restante: **≥ 24 h** gratis; **entre 2 h y 24 h** con cargo; **< 2 h** no se puede cancelar. | `NO_SE_PUEDE_CANCELAR` |
| **RN-07** | El cargo por cancelación tardía es el **50 %** del precio del turno, redondeado al peso. | — |

**Orden de validación al reservar:** datos → recurso → RN-01 → RN-03 → RN-02 → RN-05 → RN-04.
**Otros errores:** `DATOS_INVALIDOS` (nombre vacío, fecha inexistente, hora no entera), `RECURSO_INEXISTENTE`, `TURNO_INEXISTENTE`, `TURNO_NO_CANCELABLE` (ya estaba cancelado).

## 7. Criterios de aceptación (Dado / Cuando / Entonces)
- **CA-01 (RN-01)** Dado un recurso, cuando el cliente reserva a las 07:00 o a las 22:00, entonces se rechaza con `FUERA_DE_HORARIO`; a las 08:00 y a las 21:00 se acepta.
- **CA-02 (RN-02)** Dado que `futbol5` está reservado el 20/11 a las 18:00, cuando otra persona reserva lo mismo, entonces `RECURSO_OCUPADO`; si reserva `padel` a esa hora, se acepta.
- **CA-03 (RN-03)** Dado que son las 10:00 de hoy, cuando se reserva hoy a las 10:00 o antes, entonces `TURNO_EN_PASADO`; hoy a las 11:00 se acepta. A exactamente 14 días se acepta; una hora más, `MUY_ANTICIPADO`.
- **CA-04 (RN-04)** Dado un cliente con 2 turnos confirmados futuros, cuando intenta un tercero, entonces `LIMITE_TURNOS`; tras cancelar uno, puede reservar.
- **CA-05 (RN-05)** Dado un cliente con turno el 20/11 a las 18:00 en `futbol5`, cuando reserva `padel` a la misma hora, entonces `CLIENTE_OCUPADO`.
- **CA-06 (RN-06)** Dado un turno a exactamente 24 h, cuando se cancela, entonces queda `cancelado`, cargo $0 y el horario se libera.
- **CA-07 (RN-06/07)** Dado un turno de $12.000 a 23 h, cuando se cancela, entonces queda `cancelado_con_cargo` con cargo $6.000. A exactamente 2 h también tiene cargo.
- **CA-08 (RN-06)** Dado un turno a 1 h, cuando se intenta cancelar, entonces `NO_SE_PUEDE_CANCELAR` y el turno sigue confirmado.
- **CA-09 (HU-4)** Antes de cancelar, la interfaz informa si la cancelación es gratis o cuánto se cobrará, y pide confirmación.
- **CA-10 (HU-1)** La grilla muestra 14 horas (08 a 21) con estado: libre, ocupado, pasó o tu turno.

## 8. Trazabilidad regla → tarea → test
| Regla | Tarea (`tasks.md`) | Test (`tests/reglas.test.js`) |
|---|---|---|
| RN-01 | T3 | `RN-01: no se reserva fuera del horario…`, `RN-01: los turnos son de una hora exacta` |
| RN-02 | T4 | `RN-02: no se pueden solapar…`, `RN-02: el mismo horario en otro recurso…` |
| RN-03 | T5 | `RN-03: no se reserva en el pasado`, `RN-03: máximo 14 días…` |
| RN-04 | T6 | `RN-04: máximo 2 turnos activos…`, `RN-04: el nombre no distingue…` |
| RN-05 | T6 | `RN-05: una persona no puede tener dos turnos…` |
| RN-06 | T7 | `RN-06: cancelar con 24 h…`, `RN-06: con menos de 2 h…` |
| RN-07 | T7 | `RN-06/RN-07: cancelar entre 2 y 24 h…` |
