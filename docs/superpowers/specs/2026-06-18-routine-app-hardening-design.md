# Endurecimiento funcional de Mi Rutina Diaria

## Objetivo

Corregir los fallos funcionales y de integridad detectados en la aplicación sin convertir el MVP en una arquitectura más compleja. El trabajo abarcará estado de interfaz, fechas, validación, autorización, consultas, errores y accesibilidad.

## Alcance

- Corregir los falsos estados de éxito en formularios.
- Evitar que notas y checks de actividades conserven datos al cambiar de fecha.
- Aplicar la zona horaria `America/Mexico_City` a la regla de “hoy”.
- Validar parámetros de URL y entradas de Server Actions.
- Proteger la relación entre usuarios, actividades y registros en aplicación y base de datos.
- Mejorar el manejo de errores sin exponer mensajes internos de Supabase o Postgres.
- Reducir llamadas y consultas innecesarias cuando el cambio sea directo.
- Mejorar el diálogo con la dependencia Headless UI ya instalada.
- Corregir la configuración efectiva de `next/font`.
- Añadir una frontera de error general.
- Incorporar una migración SQL idempotente para instalaciones existentes.

No se migrará el proyecto completo a TypeScript, no se añadirá un framework de formularios o pruebas, no se rediseñará la identidad visual y no se eliminarán recursos que sirven como referencia para agentes.

## Componentes y estado

Los estados devueltos por Server Actions tendrán una señal explícita de éxito. El estado inicial dejará de ser indistinguible de una operación exitosa.

`NoteForm` se recreará cuando cambie la fecha seleccionada, reiniciando estados y valores no controlados sin efectos de sincronización. Los elementos de checklist también tendrán identidad por actividad y fecha para evitar que una actividad recurrente arrastre el estado optimista de otro día.

El modal de actividad usará `Dialog` y sus componentes de Headless UI para cierre con Escape, foco, restauración de foco y semántica accesible. Se conservará el estado local estrictamente necesario para apertura, recurrencia y resultado de la acción.

## Calendario y referencia visual

`app/components/example-calendar/example-calendar.jsx` se conservará porque es una referencia intencional para `.claude/agents/frontend-dev.md`; no se tratará como código muerto.

El calendario productivo reutilizará solo los patrones pertinentes de esa referencia: cabecera de navegación, estados semánticos de las celdas y estructura del grid. Se dividirá en funciones pequeñas dentro del archivo actual mientras no exista reutilización que justifique nuevos archivos. La vista horaria y los menús de vistas no se trasladarán porque no corresponden al producto actual.

Al cambiar de mes se limpiará una fecha seleccionada que no pertenezca al mes de destino. Año, mes y fecha se normalizarán en servidor antes de consultar Supabase.

## Fechas y validación

La fecha de negocio se calculará con `Intl.DateTimeFormat` y la zona `America/Mexico_City`, tanto para renderizado como para la validación de mutaciones. No se añadirá una librería de fechas.

Las validaciones cubrirán:

- email y contraseña requeridos;
- UUID válido para identificadores de actividad;
- fechas ISO reales, no solo cadenas que coincidan con una expresión regular;
- año y mes dentro de rangos razonables;
- nombre de actividad entre 1 y 200 caracteres;
- estados de ánimo permitidos;
- longitud máxima definida para notas.

La base de datos repetirá las restricciones importantes. Las respuestas al cliente serán mensajes genéricos y útiles; los detalles internos no se devolverán en el estado de formularios.

## Autenticación y acceso a datos

El proxy conservará su función de renovación y redirección temprana. Usará claims verificados cuando no necesite un registro de usuario actualizado. La autorización definitiva permanecerá junto a cada lectura o mutación protegida.

Las funciones de datos recibirán un cliente y el usuario verificado cuando eso evite crear clientes repetidos, sin introducir repositorios o servicios adicionales. Las consultas independientes se ejecutarán en paralelo y se seleccionarán solo las columnas consumidas.

## Base de datos y RLS

Se añadirá una migración idempotente bajo `supabase/migrations/`. La migración:

- impedirá que un registro apunte a una actividad de otro usuario mediante una relación compuesta o una política equivalente robusta;
- optimizará políticas RLS usando `(select auth.uid())`;
- mantendrá `WITH CHECK` explícito en inserciones y actualizaciones;
- endurecerá funciones `SECURITY DEFINER` con un `search_path` vacío;
- añadirá el límite de longitud de las notas;
- eliminará únicamente índices cuya redundancia sea exacta y demostrable.

`supabase/schema.sql` se actualizará para que una instalación nueva produzca el mismo estado final. La migración no se ejecutará contra el proyecto remoto porque el workspace no cuenta con una conexión administrativa configurada.

## Errores y verificación

Una frontera `app/error.js` ofrecerá un mensaje recuperable para fallos inesperados. Los estados vacíos existentes se conservarán.

La verificación incluirá:

- build de producción;
- revisión de patrones obsoletos y diff;
- redirección anónima a login;
- apertura del modal sin falso éxito;
- cambio entre dos fechas sin arrastre de nota o checklist;
- navegación entre meses;
- validación de entradas inválidas;
- comprobación estática de que esquema y migración terminan en el mismo modelo de seguridad.

