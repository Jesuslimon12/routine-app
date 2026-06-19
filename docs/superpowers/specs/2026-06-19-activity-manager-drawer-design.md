# Gestor de actividades en drawer

## Objetivo

Concentrar la administración de actividades en un drawer accesible y retirar del dashboard las acciones de creación y pausa. El gestor permitirá crear, pausar y reactivar actividades sin eliminar su historial ni alterar retrospectivamente los checklist diarios.

La acción de entrada se llamará **“Gestionar actividades”**, porque el contenido permite modificar actividades y no solo consultarlas.

## Alcance

- Reemplazar el botón “Nueva actividad” del encabezado por “Gestionar actividades”.
- Convertir el drawer de ejemplo existente en un componente controlado y reutilizable.
- Mostrar dentro del drawer las actividades activas y pausadas.
- Mover al drawer el formulario para crear actividades.
- Permitir pausar una actividad desde la fecha actual y reactivarla desde una fecha posterior o igual.
- Conservar los registros diarios y el estado histórico durante cualquier cantidad de ciclos de pausa y reactivación.
- Mantener Supabase Auth, RLS, Server Actions, Headless UI y las dependencias actuales.

No se incluirá edición de nombres, borrado definitivo, ordenamiento manual, búsqueda, filtros adicionales ni acciones de administración dentro del checklist diario.

## Experiencia de usuario

### Entrada al gestor

El encabezado del dashboard mostrará un botón **“Gestionar actividades”**. En pantallas estrechas podrá reducir su texto visual si el espacio lo exige, pero conservará un nombre accesible completo.

Al activarlo se abrirá un drawer desde el lado derecho. Headless UI mantendrá el foco dentro del panel, devolverá el foco al disparador al cerrar y permitirá cerrar con `Esc` cuando no exista una mutación pendiente.

### Contenido del drawer

El drawer presentará, en este orden:

1. Encabezado con título, descripción breve y control de cierre.
2. Botón principal “Nueva actividad”.
3. Formulario de creación, visible solo cuando se solicite.
4. Sección “Activas” con su cantidad total.
5. Sección plegable “Pausadas” con su cantidad total.

Cada actividad activa mostrará nombre, frecuencia y la acción “Pausar”. Cada actividad pausada mostrará nombre, fecha de inicio de la pausa vigente y la acción “Reactivar”.

Los estados vacíos serán explícitos: si no hay actividades activas, el gestor invitará a crear o reactivar una; si no hay pausadas, la sección lo indicará sin introducir otra acción.

### Creación

“Nueva actividad” expandirá el formulario dentro del drawer, encima de las listas. No se abrirá un segundo diálogo. El formulario conservará los campos actuales de nombre, frecuencia y fecha específica.

Al guardar correctamente, el formulario se cerrará, limpiará sus campos y el contenido actualizado se reflejará mediante la invalidación de Next.js. Ante un error, el formulario permanecerá abierto y mostrará el mensaje junto a sus controles.

### Pausa

Al elegir “Pausar”, la misma fila cambiará a un estado de confirmación con el mensaje **“¿Pausar ‘{nombre}’ desde hoy?”** y una aclaración de que el historial anterior se conservará. Las opciones serán “Cancelar” y “Pausar”.

La pausa comenzará en la fecha local efectiva usada por la aplicación. La actividad dejará de aparecer en el checklist de esa fecha y de las posteriores mientras la pausa permanezca abierta. No se eliminará ningún `activity_log`.

### Reactivación

“Reactivar” cerrará la pausa vigente usando la fecha local efectiva. La actividad volverá a aparecer en el checklist desde esa fecha en adelante. Las fechas incluidas en pausas anteriores permanecerán sin la actividad.

La reactivación no requiere confirmación porque es reversible y no elimina información.

## Arquitectura de componentes

### `Drawer.jsx`

El componente de ejemplo dejará de poseer su propio botón, estado y contenido demostrativo. Se convertirá en una pieza presentacional controlada mediante propiedades como `open`, `onClose` y `children`.

El mismo archivo exportará las partes visuales necesarias, como `Drawer`, `DrawerHeader` y `DrawerBody`. Estas partes compartirán el comportamiento accesible de Headless UI sin generar un archivo por cada fragmento.

### `ActivityManagerDrawer.jsx`

Será el límite cliente del gestor. Poseerá el estado de apertura, la expansión del formulario y la confirmación de pausa de una fila. Recibirá del Server Component los datos de actividades necesarios y conectará las acciones de creación, pausa y reactivación.

La presentación de una fila se mantendrá como componente local `ActivityRow` mientras no exista un segundo consumidor. Esto evita una abstracción y un archivo innecesarios.

### `ActivityForm.jsx`

El contenido reutilizable del formulario actual se extraerá de `AddActivityModal.jsx`. Conservará la validación y la Server Action existentes, pero no conocerá ningún diálogo. El gestor decidirá cuándo mostrarlo y cómo responder a un resultado exitoso.

### Dashboard

`page.js` sustituirá `AddActivityModal` por `ActivityManagerDrawer`. `DayPanel` y `ActivityCheckItem` continuarán dedicados al seguimiento diario y no recibirán controles para pausar o reactivar.

`AddActivityModal.jsx` se retirará cuando el formulario haya quedado reutilizado en el drawer y no conserve consumidores.

## Modelo de datos

### Estado actual

`activities.is_active` seguirá representando el estado vigente y permitirá listar rápidamente las actividades activas o pausadas. No será la fuente única para reconstruir una fecha histórica.

### Periodos de pausa

Se agregará `activity_pauses` con los siguientes datos:

- `id`: UUID primario.
- `activity_id`: actividad afectada.
- `user_id`: propietario, incluido para reforzar propiedad y RLS.
- `paused_from`: fecha inclusiva en que comienza la pausa.
- `resumed_on`: fecha inclusiva en que la actividad vuelve a estar activa; `null` mientras la pausa siga abierta.
- `created_at`: fecha y hora de auditoría.

Una restricción comprobará que `resumed_on` sea nulo o igual/posterior a `paused_from`. Una clave foránea compuesta asegurará que `activity_id` pertenezca a `user_id`. Un índice único parcial permitirá como máximo una pausa abierta por actividad.

La tabla tendrá RLS habilitado. Las políticas permitirán a usuarios autenticados consultar y modificar únicamente sus propios periodos. Las escrituras normales de pausa y reactivación se realizarán mediante funciones SQL controladas, no confiando en un `user_id` recibido del cliente.

### Transiciones atómicas

La pausa debe actualizar `activities.is_active` e insertar el periodo abierto como una sola operación. La reactivación debe cerrar el periodo abierto y volver a activar la actividad como una sola operación.

Se usarán funciones SQL invocadas mediante Supabase RPC para establecer ambas transiciones de manera atómica. Las funciones derivarán el propietario desde `auth.uid()`, validarán el estado esperado y recibirán la fecha efectiva validada por la Server Action.

### Lectura histórica

`getActivitiesForDay` dejará de excluir globalmente todas las actividades cuyo estado actual sea inactivo. Para la fecha solicitada:

- Aplicará las reglas existentes de recurrencia o fecha específica.
- Excluirá una actividad cuando la fecha caiga en un periodo donde `paused_from <= fecha` y `resumed_on` sea nulo o mayor que la fecha.
- Mantendrá la unión con `activity_logs` para obtener el estado completado del día.

Por tanto, una pausa actual no ocultará la actividad en fechas anteriores y una reactivación no rellenará retroactivamente el intervalo pausado.

## Acceso a datos y Server Actions

El Server Component obtendrá, en paralelo con los datos actuales del dashboard, la lista compacta necesaria por el gestor. Dado que el número de actividades personales se espera pequeño, se prioriza esta lectura directa y predecible sobre crear otro endpoint, una carga cliente o una capa de estado adicional.

Se agregarán Server Actions para pausar y reactivar. Cada acción:

1. Validará el UUID recibido.
2. Verificará la sesión con el cliente Supabase del servidor.
3. Usará la fecha local efectiva de la aplicación.
4. Invocará la función SQL correspondiente.
5. Propagará un resultado seguro de éxito o error.
6. Invalidará la vista mediante la primitiva de Next.js instalada y documentada localmente.

No se confiará en un ID de usuario, una fecha de pausa ni un estado enviados por el navegador.

## Estados, errores y concurrencia

- Cada fila mostrará su propio estado pendiente y deshabilitará sus acciones mientras procesa.
- El formulario deshabilitará sus controles mientras crea una actividad.
- El drawer no se cerrará durante una mutación pendiente para conservar el contexto y el mensaje resultante.
- Los errores de fila se mostrarán junto a la actividad correspondiente con semántica de alerta.
- Una actividad inexistente, ajena al usuario o en un estado distinto del esperado producirá un error controlado y no una transición parcial.
- La restricción de pausa abierta y las funciones SQL impedirán periodos abiertos duplicados ante doble clic o solicitudes concurrentes.
- Los nombres largos podrán ocupar varias líneas sin desplazar las acciones fuera del drawer.

## Accesibilidad y diseño adaptable

- El drawer conservará los atributos, bloqueo de foco y cierre accesible de Headless UI.
- Todos los controles interactivos tendrán un objetivo mínimo de 44×44 px.
- Los estados activo, pausado, pendiente y error no dependerán únicamente del color.
- La confirmación de pausa moverá el foco de forma predecible y permitirá cancelar con teclado.
- El panel ocupará el ancho disponible en móvil y tendrá un ancho máximo legible en escritorio.
- La animación respetará `prefers-reduced-motion`.
- La interfaz funcionará a 375 px, 768 px, escritorio y zoom del 200 % sin desplazamiento horizontal.

## Verificación

No se agregará una dependencia de pruebas para esta función. La implementación se considerará completa cuando:

1. El build de Next.js termine sin errores.
2. El drawer se pueda abrir, recorrer y cerrar completamente con teclado.
3. Crear una actividad la muestre en el gestor y en el checklist aplicable.
4. Pausarla desde hoy la retire desde hoy sin ocultarla en fechas anteriores.
5. Reactivarla la muestre desde el día de reactivación sin rellenar fechas pausadas.
6. Dos ciclos de pausa y reactivación conserven correctamente ambos intervalos.
7. Una solicitud duplicada no cree dos pausas abiertas ni deje `is_active` desincronizado.
8. Un usuario no pueda consultar ni modificar pausas de otro usuario.
9. Los estados vacíos, de carga y error sean visibles y comprensibles.
10. La interfaz sea usable en móvil, escritorio y zoom del 200 %.

## Fuera de alcance

- Borrado físico de actividades o registros.
- Restauración con una fecha retroactiva elegida por el usuario.
- Edición y reordenamiento de actividades.
- Estadísticas, recordatorios o notificaciones.
- Un endpoint HTTP interno o una biblioteca cliente adicional para gestionar el drawer.
