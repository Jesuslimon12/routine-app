# Centrado adaptable del modal de actividad

## Objetivo

Centrar el modal “Nueva actividad” horizontal y verticalmente en teléfonos, tabletas y escritorio.

## Diseño

El contenedor flexible del modal usará alineación central en todos los breakpoints. Se retirará la alineación inferior aplicada actualmente a pantallas pequeñas.

El contenedor exterior conservará `overflow-y-auto` y su espaciado, de modo que un formulario más alto que la ventana pueda desplazarse sin quedar cortado. No se modificarán el formulario, el drawer, las acciones, los mensajes de error ni los datos.

## Verificación

- El modal aparece centrado a 375 px, 768 px y en escritorio.
- El contenido mantiene margen respecto a los bordes.
- Una ventana de poca altura permite desplazamiento vertical.
- El build de Next.js termina sin errores.
