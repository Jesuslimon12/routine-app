# Selector de fecha personalizado para nueva actividad

## Objetivo

Reemplazar el `input type="date"` del modal “Nueva actividad” por un campo compacto que despliegue un selector de ruedas para día, mes y año. La integración usará JavaScript puro, conservará la Server Action y no modificará la base de datos ni la validación existente.

## Interacción

1. La persona selecciona “Fecha específica” en el formulario.
2. Aparece un campo compacto con icono de calendario y la fecha elegida en español.
3. Al pulsar el campo, se despliegan tres ruedas dentro del flujo del formulario: día, mes y año.
4. Las ruedas admiten clic, arrastre, scroll y teclado.
5. Al cambiar de mes o año, el día se limita automáticamente al último día válido del mes resultante.
6. Pulsar de nuevo el campo cierra el panel sin perder la selección.
7. Al enviar el formulario, la fecha se entrega como `specific_date` en formato local `YYYY-MM-DD`.

La selección inicial será la fecha actual. Los años disponibles se calcularán dinámicamente desde el año actual hasta diez años después, ambos incluidos.

## Componentes

### `DateWheelPicker`

Se creará en `app/components/ui/DateWheelPicker.jsx`, la ubicación de componentes UI ya establecida en el proyecto. Será un Client Component en JavaScript puro y recibirá `value`, `onChange`, `minYear`, `maxYear`, `size`, `disabled`, `locale` y `className`.

El componente contendrá las tres columnas y la lógica de fechas. Usará `framer-motion` para el arrastre, la inercia y las transformaciones de perspectiva. No introducirá hooks personalizados ni abstracciones adicionales.

### `DatePickerField`

Se creará en `app/components/ui/DatePickerField.jsx`. Será responsable del botón compacto, el estado abierto/cerrado, el texto formateado, el icono y el panel expandible. Alojará `DateWheelPicker` y renderizará un `input type="hidden"` con el nombre y valor requeridos por el formulario.

El panel se expandirá dentro del flujo normal, sin portal, popover flotante, modal adicional ni nueva capa de administración de foco.

### `ActivityForm`

Mantendrá en estado local la fecha específica y sustituirá exclusivamente el control nativo por `DatePickerField`. El selector se deshabilitará mientras el formulario esté pendiente. El selector de frecuencia, `useActionState`, la Server Action, los mensajes y los demás campos permanecerán intactos.

## Datos y validación

`DatePickerField` convertirá la fecha seleccionada a `YYYY-MM-DD` usando sus partes locales, sin `toISOString`, para evitar desplazamientos por zona horaria. El input oculto conservará `name="specific_date"` y el requisito de fecha cuando la frecuencia no sea recurrente.

La validación autoritativa seguirá en `addActivity`. No se modificarán el esquema de Supabase, las migraciones, las políticas RLS ni las consultas.

## Diseño responsivo

El campo cerrado reutilizará la altura, borde, superficie, tipografía y foco del resto del formulario. Mostrará un icono de calendario, la fecha seleccionada y un chevron que comunique el estado del panel.

El selector usará espaciado y tamaños compactos en pantallas estrechas para caber dentro del modal a 375 px sin scroll horizontal. En pantallas mayores podrá usar el tamaño medio. El panel mantendrá contraste con la superficie del modal y una banda central para señalar el valor activo.

## Accesibilidad y movimiento

- El botón indicará el estado mediante `aria-expanded` y apuntará al panel con `aria-controls`.
- Cada rueda usará semántica de `spinbutton`, nombre accesible en español, valor actual y límites.
- Las teclas Flecha arriba/abajo, Inicio, Fin, Re Pág y Av Pág cambiarán la selección.
- Los controles respetarán el estado deshabilitado y objetivos táctiles mínimos.
- Las animaciones respetarán `prefers-reduced-motion`; la selección seguirá funcionando sin depender del movimiento.
- Los meses y la fecha visible se formatearán con locale español.

## Dependencias

Se añadirá `framer-motion`, requerida por la implementación de ruedas proporcionada. No se añadirán librerías de formularios, fechas ni componentes adicionales. Se reutilizarán `@heroicons/react`, Tailwind CSS y la función `cn` existentes.

## Verificación

1. “Fecha específica” muestra el campo compacto con la fecha actual.
2. El campo abre y cierra las ruedas sin cerrar el modal.
3. Día, mes y año cambian mediante clic, arrastre, scroll y teclado.
4. Febrero, años bisiestos y meses cortos ajustan el día correctamente.
5. El rango muestra el año actual y los diez años siguientes.
6. El formulario envía `specific_date` como fecha local `YYYY-MM-DD` y conserva los errores existentes.
7. El control queda deshabilitado durante el envío.
8. No existe desbordamiento horizontal a 375 px ni con zoom del 200 %.
9. El diseño funciona en escritorio y respeta reducción de movimiento.
10. `next build` termina sin errores.

## Fuera de alcance

- Cambios a la Server Action o su validación.
- Cambios de esquema, migraciones o RLS.
- Selección de hora, rangos de fechas o recurrencias avanzadas.
- Un popover flotante, portal, modal secundario o bottom sheet.
- Conversión del proyecto a TypeScript.
