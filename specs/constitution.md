# Constitución del proyecto — TurnoYa

Principios que no se negocian. Toda spec, plan, tarea y línea de código debe respetarlos.

## 1. Producto
- **Nombre:** TurnoYa. **Logo:** `assets/logo.svg` (calendario con tilde).
- **Propósito:** que una persona reserve un turno en una cancha o consultorio en menos de un minuto, sin dobles reservas ni sorpresas de precio.
- **Usuario objetivo:** cliente final que reserva por su cuenta desde el celular o la computadora.

## 2. Metodología (Spec Driven Development)
1. **La spec manda.** Primero se escribe `specs/spec.md`; el código se deriva de ella, no al revés.
2. **Cambio de comportamiento = cambio de spec.** Si una regla cambia, se edita la spec antes de tocar el código y los tests.
3. **Cada regla de negocio tiene un ID** (`RN-01`…) y al menos un test que la cite.
4. **Trazabilidad:** spec → plan → tareas → código → test. Ver la tabla en `specs/spec.md`.
5. **Trabajo con IA:** la IA recibe la spec como contexto y no puede inventar reglas que no estén escritas. Si algo es ambiguo, se aclara en la spec y recién después se implementa.

## 3. Técnicos
- Lógica de negocio **pura y aislada** en `src/reglas.js` (sin DOM, sin almacenamiento, sin red).
- La interfaz **no decide reglas**: solo muestra y delega a `Agenda`.
- **Cero dependencias externas** para ejecutar y testear (JavaScript estándar y `node --test`).
- El reloj es **inyectable** para que los tests sean repetibles.
- Los errores de negocio usan códigos estables (`ErrorNegocio.codigo`) y mensajes claros para el usuario.

## 4. Calidad
- Todos los tests deben pasar antes de cada commit (`npm test`).
- Accesible: foco visible, botones con etiqueta, contraste suficiente, respeta modo oscuro y `prefers-reduced-motion`.
- Mensajes en español rioplatense, voz activa, sin culpar al usuario.

## 5. Fuera de alcance (versión 1)
Pagos reales, login con contraseña, notificaciones, panel de administración, base de datos en servidor.
