# Guion de la demo (45 segundos)

**Antes de grabar:** `npm start`, abrir `http://localhost:8080`, pulsar "Borrar datos de prueba" y poner el navegador a pantalla completa. Grabar con la grabadora de pantalla del sistema (Win+G, Cmd+Shift+5 o la de tu celular). Tené la terminal lista en otra ventana con `npm test`.

| Segundo | Qué mostrar | Qué decir |
|---|---|---|
| 0–5 | La pantalla con el logo y el nombre | "Esta es TurnoYa, hecha con Spec Driven Development." |
| 5–12 | Escribir "Luca", elegir Fútbol 5, tocar una hora libre | "Reservo una cancha y queda confirmada." |
| 12–18 | Cambiar a "Ana" y mostrar la hora "Ocupado" | "Otra persona no puede reservar el mismo horario." |
| 18–26 | Volver a "Luca", reservar una segunda hora y probar una tercera | "Regla de negocio: máximo 2 turnos activos." |
| 26–36 | Cancelar un turno y mostrar el diálogo con el cargo | "Si cancelo con poco tiempo, me avisa el cargo del 50 % antes de confirmar." |
| 36–45 | Mostrar la terminal con `npm test` en verde | "16 tests automáticos verifican cada regla de la spec." |
