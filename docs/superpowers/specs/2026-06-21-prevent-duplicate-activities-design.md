# Prevención de actividades duplicadas

## Objetivo

Impedir que una persona cree o edite una actividad hasta convertirla en una copia exacta de otra, sin borrar ni combinar registros existentes y sin impedir actividades con el mismo nombre en fechas diferentes.

## Definición de duplicado

Dos actividades de la misma persona se consideran iguales cuando coinciden en:

- El nombre normalizado con espacios exteriores eliminados y sin distinguir mayúsculas de minúsculas.
- El tipo de programación: todos los días, un día o entre fechas.
- La fecha inicial.
- La fecha final, incluida su ausencia en actividades diarias.

Por ejemplo, `Cita médica` y ` cita médica ` son el mismo nombre. Dos citas médicas con fechas diferentes no son duplicados.

## Flujo

La creación dejará de insertar directamente en `activities` y llamará una función transaccional de PostgreSQL. La función verificará la sesión, validará los datos, serializará creaciones equivalentes y comprobará si ya existe la combinación normalizada antes de insertar.

La edición aplicará la misma comprobación, excluyendo el identificador de la actividad editada. Cuando una edición con sustitución histórica genere una actividad nueva, también se validará la programación efectiva que realmente se insertará.

Si existe una coincidencia, la operación no modificará datos y devolverá un error identificable. El formulario permanecerá abierto y mostrará: **“Ya existe una actividad igual para esas fechas.”**

## Base de datos

Se añadirá una nueva migración independiente, porque la migración de programaciones ya fue aplicada. No se añadirá un índice único que pueda fallar por duplicados históricos ni se eliminarán registros existentes.

La función de creación usará un bloqueo transaccional derivado del usuario, nombre normalizado, tipo y fechas. Así, dos solicitudes simultáneas equivalentes no podrán superar la comprobación al mismo tiempo.

Las funciones serán `security definer`, tendrán `search_path` vacío, obtendrán el usuario mediante `auth.uid()` y restringirán su ejecución al rol `authenticated`.

## Validación

- La validación de nombre, tipo y fechas existente se conserva en la Server Action y se repite en PostgreSQL.
- La comparación de nombre usa `lower(btrim(name))`.
- La comparación de fecha final usa `is not distinct from` para que dos valores nulos se consideren iguales.
- Los errores inesperados conservarán el mensaje general actual.
- Solo el error de duplicado recibirá el mensaje específico para la persona.

## Verificación

1. Crear dos actividades con nombre, tipo y fechas iguales bloquea la segunda.
2. Diferencias únicamente de mayúsculas o espacios también se bloquean.
3. El mismo nombre con fechas diferentes se permite.
4. Tipos de programación diferentes se permiten.
5. Editar una actividad sin cambiar su identidad no se bloquea a sí misma.
6. Editarla para coincidir con otra actividad se bloquea.
7. Dos creaciones simultáneas equivalentes producen una sola actividad.
8. Los duplicados históricos permanecen intactos.
9. RLS y la verificación de sesión continúan protegiendo cada usuario.
10. El build de producción termina sin errores.

## Fuera de alcance

- Fusionar o eliminar duplicados existentes.
- Detectar nombres parecidos mediante similitud lingüística.
- Considerar actividades con fechas distintas como duplicadas.
