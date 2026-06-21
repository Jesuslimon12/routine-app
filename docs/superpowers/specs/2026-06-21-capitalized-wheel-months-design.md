# Meses capitalizados en la rueda de fecha

## Objetivo

Mostrar los nombres de los meses con mayúscula inicial en `DateWheelPicker`: `Enero`, `Febrero`, `Marzo`, etc.

## Diseño

La función existente `getMonthNames` continuará obteniendo los nombres mediante `Intl.DateTimeFormat`. Cada resultado se transformará al generarse, convirtiendo únicamente su primer carácter a mayúscula y conservando el resto del texto.

La transformación se aplicará al valor real entregado a la rueda, no sólo mediante CSS. Así, el texto visible y `aria-valuetext` comunicarán el mismo nombre capitalizado.

## Alcance

- No se modificarán el locale, las fechas ni el comportamiento circular.
- No se añadirá una lista manual de meses.
- No se cambiarán estilos, validación ni envío del formulario.

## Verificación

1. Los doce meses muestran mayúscula inicial.
2. El valor accesible de la rueda usa el mismo texto.
3. `next build` termina sin errores.
