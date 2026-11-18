# Plan técnico — TurnoYa

Deriva de `spec.md` y respeta `constitution.md`.

## Arquitectura
```
index.html  ──►  src/app.js (interfaz)  ──►  src/reglas.js (Agenda + reglas)
                       │
                       └─► localStorage (persistencia de turnos en el navegador)
tests/reglas.test.js  ──►  src/reglas.js
```
- **`src/reglas.js`**: clase `Agenda` con `crearTurno`, `evaluarCancelacion`, `cancelarTurno`, `turnosLibres`, `turnosDeCliente`. Exporta `CONFIG` (todos los números de la spec en un solo lugar) y `ErrorNegocio`.
- **`src/app.js`**: arma la pantalla, llama a `Agenda` y traduce `ErrorNegocio` en avisos. No contiene reglas.
- **`index.html`**: estructura y estilos. Funciona en claro y oscuro, responsive.

## Decisiones
| Decisión | Motivo |
|---|---|
| JavaScript estándar sin framework | Cero instalación; la lógica es lo importante |
| Reloj inyectable (`ahora`) | Tests repetibles de RN-03 y RN-06 |
| `CONFIG` congelada | Cambiar una regla = cambiar un número |
| `evaluarCancelacion` separada de `cancelarTurno` | La UI informa el cargo **antes** de confirmar (CA-09) |
| Nombre de cliente normalizado (trim + minúsculas) | Evitar saltear RN-04 escribiendo "Luca" y "luca" |
| Persistencia en `localStorage` | Demo sin servidor; el backend queda para v2 |

## Cómo se ejecuta
- Tests: `npm test` (Node 20+).
- App: `npm start` (usa `npx serve`) y abrir `http://localhost:8080`. Hace falta un servidor local porque la app usa módulos ES.

## Evolución (v2)
API REST con base de datos, login real, panel de administración y pagos.
