# Rediseño focalizado de Mi Rutina Diaria

## Objetivo

Convertir la interfaz actual en una herramienta clara, adulta y práctica para sostener rutinas diarias. El rediseño debe corregir los estados visuales invisibles, priorizar las acciones del día y sustituir la estética genérica de bienestar por una identidad propia, sin cambiar la autenticación, el modelo de datos ni los flujos existentes de Supabase.

## Dirección visual

La dirección será **Bitácora de ritmo personal**: serena, legible y activa. La identidad nace del tiempo, la continuidad y el progreso, no de códigos visuales estereotípicamente femeninos.

- Lienzo mineral claro: `#F7F6FA`.
- Tinta principal: `#24212A`.
- Primario ciruela: `#6D416B`, con variante profunda `#50304F`.
- Progreso verde mineral: `#2F7968`.
- Bordes: `#DDD9E3`.
- Tipografía de interfaz humanista y legible; la tipografía display se limitará a la marca o encabezados editoriales.
- La firma visual será una línea de ritmo aplicada con moderación al progreso y a los días con actividad.
- Se reducirán sombras, radios grandes y tarjetas repetidas. La estructura y el contraste establecerán la jerarquía.

Todos los pares de color usados para texto normal cumplirán WCAG AA. Los estados no dependerán únicamente del color.

## Arquitectura de pantalla

### Login

Se conservará el formulario y la acción de autenticación. El CTA tendrá dominio visual inequívoco; los campos usarán bordes y superficies más ligeros. Se eliminará el texto “Diseñado con amor para tu bienestar” y se reemplazará el tono romántico por copy directo orientado a continuidad personal.

### Dashboard

En escritorio, el contenido principal será el día seleccionado —hoy por defecto cuando sea válido para el mes actual— y su checklist. El calendario pasará a una columna secundaria compacta. El resumen dejará de duplicar actividades y se convertirá en encabezado de progreso del día.

Orden de escritorio:

1. Encabezado con marca, acción “Nueva actividad” y salida secundaria.
2. Encabezado del día y progreso.
3. Checklist y notas como contenido principal.
4. Calendario mensual compacto como navegación secundaria.

Orden móvil:

1. Encabezado compacto.
2. Día y progreso.
3. Checklist.
4. Notas y ánimo.
5. Calendario secundario.

El dashboard vacío ofrecerá una acción concreta para empezar. No mostrará un panel que únicamente ordene seleccionar una fecha.

### Modal de actividad

Se conservará el flujo actual y Headless UI. El selector de frecuencia tendrá estados activo e inactivo inequívocos, “Agregar” será la acción dominante y “Cancelar” será secundaria. Los controles de cierre y las opciones tendrán áreas táctiles mínimas de 44×44 px.

## Componentes y reutilización

Se reutilizarán los componentes existentes y se evitarán nuevas dependencias.

- `Button`: corregirá variantes, contraste y estados interactivos.
- `Calendar`: se compactará, mejorará sus etiquetas accesibles y ampliará objetivos táctiles.
- `DayPanel`: será el núcleo de trabajo diario; conservará actividades y notas.
- `ActivityList`: se retirará del dashboard y se eliminará si no conserva ningún consumidor; el encabezado de `DayPanel` mostrará fecha y progreso sin repetir la lista.
- `AddActivityModal`: conservará la mutación y el diálogo, cambiando únicamente jerarquía y presentación.
- `globals.css`: definirá tokens semánticos compatibles con Tailwind CSS v4 y eliminará la paleta terracota actual.

No se introducirán hooks de un solo uso, librerías de diseño adicionales ni una capa de componentes nueva.

## Estados e interacción

- CTA primario, fecha seleccionada y frecuencia seleccionada deben permanecer visibles en reposo, hover, foco, pulsación, carga y deshabilitado.
- Los elementos táctiles tendrán un área mínima de 44×44 px.
- El progreso diario incluirá cifra y representación visual, con texto comprensible sin depender del color.
- Los estados vacíos tendrán una acción siguiente explícita.
- Los mensajes de carga, éxito y error conservarán semántica accesible.
- Se respetará `prefers-reduced-motion`, incluido el desplazamiento suave.
- El modal mantendrá bloqueo de cierre durante una mutación pendiente.

## Datos y comportamiento

El rediseño no cambiará tablas, políticas RLS, consultas ni Server Actions. `page.js` seguirá obteniendo en paralelo el resumen mensual y los datos diarios. La fecha continuará representándose en la URL mediante `searchParams` asíncronos de Next.js 16.

Cuando no exista una fecha seleccionada y el dashboard muestre el mes actual, el Server Component usará hoy como fecha efectiva. En meses distintos al actual no se seleccionará una fecha automáticamente. No se añadirá una segunda fuente de estado en el cliente.

## Errores y límites

- Los errores de autenticación y creación de actividades continuarán mostrándose en el formulario correspondiente.
- No se ocultan fallos de datos ni se sustituye el manejo existente de errores del servidor.
- El diseño debe soportar nombres largos de actividades mediante salto de línea.
- El contenido no debe producir desplazamiento horizontal a 375 px ni quedar oculto tras elementos fijos.

## Verificación

La implementación se considerará terminada cuando:

1. Los CTA, estados seleccionados y controles activos sean visibles y cumplan contraste AA.
2. No exista duplicación de la lista de actividades.
3. El checklist del día aparezca antes que el calendario en móvil y sea el foco principal en escritorio.
4. Login, dashboard vacío, modal y dashboard con datos sean coherentes entre sí.
5. La interfaz funcione a 375 px, 768 px y escritorio, además de zoom del 200 %.
6. Los flujos sean operables con teclado y los objetivos táctiles alcancen 44×44 px.
7. El build de Next.js finalice sin errores.

## Fuera de alcance

- Cambios en Supabase, autenticación, esquema o reglas RLS.
- Nuevas funciones de hábitos, estadísticas o notificaciones.
- Modo oscuro.
- Una nueva librería de componentes o iconos.
- Reescritura de Server Actions o de la capa de acceso a datos.
