<p align="center"><img src="assets/logo.svg" alt="Logo de TurnoYa" width="120"></p>

# TurnoYa

**Reservá canchas y consultorios en un minuto.** Proyecto final del Módulo 4 de Generación T, construido con **Spec Driven Development (SDD)**: primero se escribió la especificación y después se generó el código a partir de ella.

## Qué hace
- Muestra los horarios libres de cada cancha o consultorio (08:00 a 22:00, turnos de 1 hora).
- Reserva y cancela turnos aplicando reglas de negocio reales: sin solapamientos, máximo 2 turnos activos por persona, ventana de 14 días y cargo del 50 % por cancelación tardía.

## Documentación SDD
| Archivo | Contenido |
|---|---|
| [`specs/constitution.md`](specs/constitution.md) | Principios del proyecto y de la metodología |
| [`specs/spec.md`](specs/spec.md) | Qué hace el sistema: historias, reglas RN-01 a RN-07, criterios de aceptación y trazabilidad |
| [`specs/plan.md`](specs/plan.md) | Arquitectura y decisiones técnicas |
| [`specs/tasks.md`](specs/tasks.md) | Lista de tareas derivadas de la spec |
| [`specs/testing.md`](specs/testing.md) | Pruebas automáticas y manuales |
| [`specs/demo.md`](specs/demo.md) | Guion del video de demostración |

## Cómo ejecutarlo
Requisitos: Node.js 20 o superior (incluye `npm` y `npx`).
```bash
npm test      # 16 tests automáticos
npm start     # abrir http://localhost:8080
```

## Estructura
```
assets/logo.svg      Logo
index.html           Pantalla
src/reglas.js        Reglas de negocio (lógica pura)
src/app.js           Interfaz
tests/               Tests automáticos
specs/               Documentos SDD
```

## Demo
Video: _(pegar acá el enlace al video de 30–60 s)_
