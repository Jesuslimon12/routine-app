# Programación, historial y edición de actividades

## Objetivo

Ampliar las actividades para admitir tres programaciones: todos los días, un día específico y cada día dentro de un rango de fechas. La solución debe conservar el historial, permitir corregir actividades sin reescribir el pasado y reutilizar el selector circular de fecha en un formato compacto para los rangos.

## Tipos de programación

El formulario “Nueva actividad” ofrecerá tres opciones:

1. **Todos los días**: la actividad comienza en la fecha de creación y no tiene fecha final.
2. **Un día**: la actividad aparece solamente en la fecha seleccionada.
3. **Entre fechas**: la actividad aparece cada día desde la fecha inicial hasta la fecha final, ambas incluidas.

Las actividades de un día y entre fechas finalizan automáticamente al terminar su última fecha. Las actividades diarias permanecen vigentes hasta que se pausen o se sustituyan mediante una edición de programación.

## Cumplimiento e historial

Cada fecha programada se evalúa independientemente:

- En la fecha actual, una actividad sin registro se muestra como pendiente.
- Una actividad marcada genera un registro completado para esa fecha.
- Cuando una fecha programada ya pasó sin un registro completado, el historial la muestra como **No realizada**.

No se guardará un motivo ni se crearán registros automáticos para los días no realizados. Su estado se obtiene de la programación y de la ausencia de un registro completado. Esto evita llenar la base de datos con filas que no aportan información adicional.

Una actividad temporal que vuelva a ocurrir posteriormente será una actividad nueva. Por ejemplo, la cita médica de junio y la de julio tendrán identificadores distintos. El gestor podrá ofrecer “Duplicar” para iniciar la nueva actividad con el mismo nombre y elegir sus nuevas fechas, sin modificar el historial anterior.

## Edición

Una actividad que todavía no comenzó podrá editar su nombre y programación sobre el mismo registro.

Cuando la actividad ya tenga fechas transcurridas, una corrección de nombre podrá actualizar el registro existente. Un cambio de tipo o fechas se aplicará desde la fecha actual mediante una sustitución: la programación anterior conservará su periodo histórico y se creará una actividad nueva con la programación corregida. Una actividad finalizada no podrá reabrirse cambiando sus fechas; se duplicará para crear un nuevo periodo.

La interfaz explicará esta diferencia con acciones directas, sin exponer al usuario el detalle de que la edición crea un registro de reemplazo.

## Selector de rango compacto

Al seleccionar **Entre fechas**, el formulario mostrará dos selectores `DateWheelPicker` visibles y apilados:

- **Desde**, para la fecha inicial.
- **Hasta**, para la fecha final.

Se reutilizará el componente existente. Se añadirá una variante compacta para rango, sin crear otro selector ni duplicar su lógica. Esta variante mostrará tres valores verticales en lugar de cinco y reducirá la altura de fila, la separación entre día, mes y año, y el relleno del contenedor. Los objetivos interactivos y el manejo por teclado conservarán su tamaño y funcionamiento accesibles.

Los dos selectores estarán uno debajo del otro. Colocarlos lado a lado no deja ancho suficiente para día, nombre del mes y año en teléfonos. El conjunto debe caber dentro del modal actual a 375 px y ocupar aproximadamente la altura del selector individual actual con su espacio circundante.

La fecha final comenzará igual que la inicial. Si la persona mueve la fecha inicial después de la fecha final, la fecha final se ajustará automáticamente a la nueva fecha inicial. El servidor rechazará cualquier rango cuya fecha final sea anterior a la inicial.

## Modelo de datos

`activities` reemplazará la combinación `is_recurring`/`specific_date` por una programación explícita:

- `schedule_type`: `daily`, `single` o `range`.
- `start_date`: obligatoria para los tres tipos.
- `end_date`: nula para `daily`; igual a `start_date` para `single`; igual o posterior a `start_date` para `range`.

Las restricciones de PostgreSQL garantizarán esas combinaciones. `user_id`, `name`, `is_active`, las pausas y las relaciones de propiedad se conservarán. La migración convertirá actividades diarias existentes usando su fecha de creación en la zona `America/Mexico_City`, y convertirá actividades de fecha específica con inicio y fin iguales a `specific_date`.

`activity_logs` conservará una fila única por usuario, actividad y fecha únicamente cuando se complete una actividad. Los registros existentes permanecerán asociados a la actividad original. Las consultas filtrarán actividades mediante `start_date <= fecha` y, cuando exista, `end_date >= fecha`, además de respetar las pausas de actividades diarias.

RLS continuará habilitado. Las mutaciones obtendrán el usuario desde la sesión verificada y nunca aceptarán un `user_id` del formulario.

## Gestor de actividades

El gestor presentará estados derivados de las fechas:

- **Activas**: actividades diarias vigentes y actividades temporales que incluyen hoy.
- **Próximas**: actividades cuya fecha inicial todavía no llega.
- **Finalizadas**: actividades temporales cuya fecha final ya pasó.
- **Pausadas**: actividades diarias pausadas.

Pausar y reactivar se ofrecerá solamente para actividades de todos los días. Las actividades temporales finalizarán por fecha y tendrán acciones para editar, duplicar o consultar su historial, según corresponda.

## Validación y errores

- El nombre seguirá siendo obligatorio y tendrá el límite actual de 200 caracteres.
- `schedule_type` deberá pertenecer a los tres valores admitidos.
- Las fechas usarán formato local `YYYY-MM-DD`, sin conversiones UTC.
- El servidor validará fechas reales y la relación entre inicio y fin.
- Una actividad solo podrá marcarse en una fecha incluida en su programación y no pausada.
- Los errores mantendrán abierto el modal y se mostrarán dentro del formulario.

## Verificación

1. El formulario permite elegir Todos los días, Un día y Entre fechas.
2. Un día muestra un selector; Entre fechas muestra los dos selectores compactos apilados.
3. Ambos selectores caben sin desbordamiento a 375 px y con zoom del 200 %.
4. Cambiar el inicio después del fin ajusta el fin; el servidor también rechaza rangos inválidos.
5. Una actividad de rango aparece todos los días incluidos y no aparece fuera del rango.
6. Cada día del rango se completa independientemente.
7. Un día pasado sin registro se muestra como No realizada y no genera una fila automática.
8. Editar fechas después de comenzar conserva el historial anterior y aplica la sustitución desde hoy.
9. Duplicar una actividad finalizada crea un identificador y fechas nuevos.
10. Las actividades existentes migran sin perder sus registros ni sus pausas.
11. RLS impide leer o modificar actividades, pausas y registros de otras personas.
12. El build y las pruebas de la aplicación terminan sin errores.

## Fuera de alcance

- Repeticiones semanales, mensuales o reglas de calendario avanzadas.
- Horas, recordatorios y notificaciones.
- Motivos o notas para días no realizados.
- Guardar una fila de historial por cada incumplimiento.
- Reutilizar automáticamente una actividad temporal en meses posteriores.
