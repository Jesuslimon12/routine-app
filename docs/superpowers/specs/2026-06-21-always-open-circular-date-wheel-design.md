# Rueda de fecha visible y circular

## Objetivo

Simplificar la selección de fecha específica en “Nueva actividad”: eliminar el campo compacto desplegable, mostrar directamente las ruedas y aumentar el contraste de sus valores. Las tres columnas serán circulares, de modo que después del último elemento aparezca el primero sin un extremo visible.

## Interacción

Al elegir “Fecha específica”, el formulario mostrará inmediatamente las ruedas de día, mes y año. No habrá botón, campo visual ni estado abierto/cerrado.

Las tres columnas responderán de forma circular a arrastre, scroll y teclado:

- Después del último día aparece el primero del mes actual, y viceversa.
- Después de diciembre aparece enero, y viceversa.
- Después del último año permitido aparece el año actual, y viceversa.

La pista de cada rueda repetirá internamente sus opciones y se recentrará después de cada selección para mantener elementos disponibles en ambas direcciones. Este ajuste no cambiará el valor seleccionado ni producirá un salto visual perceptible.

## Componentes

### `DateWheelPicker`

Continuará en `app/components/ui/DateWheelPicker.jsx`. `WheelColumn` pasará de una lista limitada a una pista circular con copias de los elementos. Traducirá la posición visual a un índice real mediante aritmética modular y recentrará la posición en la copia central después de completar el movimiento.

El scroll, Flecha arriba y Flecha abajo avanzarán o retrocederán con ciclo. Inicio y Fin conservarán su significado accesible: seleccionar el primer o último valor real. Re Pág y Av Pág avanzarán cinco posiciones con el mismo comportamiento circular.

### `ActivityForm`

Renderizará `DateWheelPicker` directamente cuando la actividad use una fecha específica. Incluirá un `input type="hidden"` con `name="specific_date"` y el valor generado por `toDateString`, función ya existente en `app/lib/dates.js`.

### Eliminación de `DatePickerField`

Se eliminará `app/components/ui/DatePickerField.jsx` porque su única responsabilidad era presentar y desplegar el selector. Mantenerlo después de hacer las ruedas permanentemente visibles añadiría una capa sin propósito.

## Apariencia

El valor central seleccionado usará el color de marca oscuro y mayor peso tipográfico. Los valores vecinos usarán el color secundario del sistema, con una opacidad mínima de 60%. Los degradados superior e inferior serán más transparentes para no apagar el texto.

Las ruedas conservarán la banda central, el tamaño compacto y los anchos actuales para caber dentro del modal a 375 px sin desbordamiento horizontal.

## Datos y validación

La fecha inicial seguirá siendo hoy. El rango de años seguirá calculándose desde el año actual hasta diez años después. Al cambiar mes o año, el día se ajustará al último día válido cuando sea necesario.

La Server Action, la validación, el formato `YYYY-MM-DD`, Supabase y las reglas de autorización no cambiarán.

## Accesibilidad y movimiento

- Cada columna conservará `role="spinbutton"`, nombre, valor actual y límites reales.
- El valor accesible reflejará el elemento real, no la copia visual interna.
- El teclado conservará Flechas, Inicio, Fin, Re Pág y Av Pág.
- La reducción de movimiento evitará la animación de recentrado sin impedir el ciclo.
- El estado pendiente deshabilitará las tres columnas.

## Verificación

1. “Fecha específica” muestra las ruedas directamente, sin campo desplegable.
2. No existe ningún control visual duplicado para la fecha.
3. Día, mes y año continúan del último valor al primero y del primero al último.
4. El ciclo funciona con arrastre, scroll y teclado.
5. El texto seleccionado y los valores vecinos tienen contraste claramente mayor.
6. El formulario envía `specific_date` como `YYYY-MM-DD`.
7. Febrero, años bisiestos y meses cortos siguen ajustando el día.
8. No hay desbordamiento horizontal a 375 px.
9. `next build` termina sin errores.

## Fuera de alcance

- Cambios al rango de años.
- Cambios de base de datos, validación o Server Action.
- Selección de hora o rangos de fechas.
- Cambios visuales ajenos al selector de fecha.
