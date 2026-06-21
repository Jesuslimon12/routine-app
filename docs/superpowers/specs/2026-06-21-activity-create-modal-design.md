# Modal de nueva actividad desde el gestor

## Objetivo

Cambiar la acción “Nueva actividad” del drawer de gestión para que abra un modal independiente, manteniendo el drawer visible y abierto detrás. El formulario, su validación y su Server Action permanecerán iguales.

## Interacción

1. La persona abre “Gestionar actividades”.
2. Al presionar “Nueva actividad”, aparece un modal por encima del drawer.
3. Cancelar, cerrar con el botón o usar `Esc` cierra exclusivamente el modal.
4. El drawer permanece abierto y conserva la lista y su posición.
5. Al crear correctamente, el modal se cierra y el drawer muestra el mensaje “Actividad agregada” con la lista actualizada.
6. Si la creación falla, el modal permanece abierto y muestra el error existente del formulario.

Mientras el formulario esté enviándose, no se podrá cerrar ni el modal ni el drawer.

## Componentes

### `ActivityModal`

Será un componente cliente controlado mediante `open`, `onClose`, `onSuccess` y `onPendingChange`. Usará `Dialog`, `DialogBackdrop`, `DialogPanel` y `DialogTitle` de Headless UI, con una capa visual superior a la del drawer.

El modal será responsable únicamente de la superficie, el encabezado, el control de cierre y de alojar `ActivityForm`. No duplicará campos, validación ni llamadas de servidor.

### `ActivityManagerDrawer`

Reemplazará el renderizado condicional en línea del formulario por un estado booleano que controla `ActivityModal`. El botón “Nueva actividad” permanecerá visible en el drawer.

Cuando el formulario termine correctamente, el gestor cerrará el modal y publicará el mensaje de éxito. El estado pendiente continuará formando parte de `busy` para impedir el cierre accidental del drawer.

### `ActivityForm`

Conservará los mismos campos, selector de frecuencia, fecha específica, restricciones HTML, `useActionState`, Server Action y mensajes de error. Solo se ajustará su contenedor visual para que el modal sea quien proporcione borde, superficie y espaciado exterior.

## Datos

No se modificarán el esquema de Supabase, migraciones, consultas, RLS ni Server Actions. La creación seguirá usando `addActivity` y la actualización actual de Next.js.

## Accesibilidad y errores

- Headless UI administrará el bloqueo y restauración de foco entre el modal y el drawer.
- El modal tendrá título accesible y un botón de cierre con nombre explícito.
- `Esc` y el backdrop cerrarán el modal solo cuando no haya un envío pendiente.
- Los controles mantendrán objetivos táctiles mínimos de 44×44 px.
- Los errores permanecerán dentro del formulario y no cerrarán ninguna superficie.
- La animación respetará `prefers-reduced-motion`.

## Verificación

1. “Nueva actividad” abre el modal sin cerrar el drawer.
2. Cancelar, el botón de cierre, `Esc` y el backdrop cierran solo el modal.
3. Un error de validación o servidor mantiene el modal abierto.
4. Una creación exitosa cierra el modal, conserva el drawer abierto y actualiza la lista.
5. Durante el envío no se puede cerrar ninguna de las dos superficies.
6. El foco y el teclado funcionan correctamente con ambos diálogos apilados.
7. El modal funciona a 375 px, escritorio y zoom del 200 %.
8. El build de Next.js termina sin errores.

## Fuera de alcance

- Cambios en los campos o validación del formulario.
- Cambios de base de datos.
- Edición de actividades.
- Cerrar el drawer después de crear.
