# Plan de pruebas — TurnoYa

## 1. Pruebas automáticas
```bash
npm test
```
**Resultado esperado:** `tests 16 · pass 16 · fail 0`.
Los tests usan un "hoy" fijo (martes 17/11/2026, 10:00) y cubren los casos límite: exactamente 24 h, exactamente 2 h, exactamente 14 días, 07:00/08:00/21:00/22:00.

## 2. Pruebas manuales (en el navegador)
Iniciar con `npm start`, abrir `http://localhost:8080` y pulsar **Borrar datos de prueba**. Escribir el nombre "Luca".

| # | Pasos | Resultado esperado | Criterio |
|---|---|---|---|
| M1 | Elegir Fútbol 5, fecha de mañana, tocar las 18 | Aviso verde "Turno confirmado"; la hora queda "Tu turno"; aparece en Mis turnos | CA-10, HU-2 |
| M2 | Cambiar el nombre a "Ana" y mirar la hora 18 | Figura "Ocupado" y no se puede tocar | CA-02 |
| M3 | Con "Ana", elegir Pádel y tocar las 18 | Se confirma (otro recurso) | CA-02 |
| M4 | Con "Luca", reservar Pádel a las 18 el mismo día | Error "Ya tenés otro turno a esa misma hora" | CA-05 |
| M5 | Con "Luca", reservar las 10 y luego las 12; probar una tercera | La tercera falla con "Ya tenés 2 turnos activos…" | CA-04 |
| M6 | Cancelar un turno a más de 24 h | El diálogo dice "gratis"; queda Cancelado y el horario se libera | CA-06 |
| M7 | Reservar para hoy un horario con 2 a 24 h de margen y cancelarlo | El diálogo muestra el 50 % del precio; queda "Cancelado con cargo" | CA-07 |
| M8 | Intentar cancelar un turno que empieza en menos de 2 h | Error "Ya no se puede cancelar…" | CA-08 |
| M9 | Recargar la página | Los turnos siguen ahí | Persistencia |
| M10 | Mirar las horas pasadas de hoy | Aparecen como "Pasó" y no se pueden tocar | RN-03 |

## 3. Registro de resultados
| Fecha | Quién | Automáticas | Manuales | Observaciones |
|---|---|---|---|---|
| 17/11/2026 | Entorno de desarrollo | 16/16 ✅ | M1 y M5 verificados con navegador headless ✅ | Completar M2–M4 y M6–M10 a mano antes de grabar la demo |
