# Prompt: Desarrollo de App "Checklist Diario" (Next.js)

## Contexto del proyecto

Necesito desarrollar una aplicación web en **Next.js** que funcione como un checklist de actividades diarias, orientada a usuarias mujeres. La app permite registrar el cumplimiento de actividades diarias (gym, estudio, medicamentos, etc.) y llevar notas personales sobre el estado de ánimo y cómo se desarrolló el día.

El desarrollo se organizará entre tres agentes especializados, que deben coordinarse y respetar las dependencias entre sí:

- `@ui-ux-designer`: diseño de pantallas, componentes y experiencia de usuario.
- `@backend-dev`: arquitectura, base de datos, autenticación y API.
- `@frontend-dev`: maquetado e implementación de componentes visuales con base en los diseños del `@ui-ux-designer` y la API definida por `@backend-dev`.

---

## Stack tecnológico

- **Framework**: Next.js.
- **Base de datos**: PostgreSQL, gestionada a través de **Supabase** (incluyendo autenticación, si se decide usar Supabase Auth).
- **Estilos**: Tailwind CSS para todo el maquetado y componentes visuales.

---

## Objetivo general

Construir una app donde la usuaria pueda:

1. Iniciar sesión (login con autenticación).
2. Ver un calendario mensual.
3. Seleccionar un día para ver/gestionar:
   - **Actividades**: checklist de tareas del día, con posibilidad de marcarlas como completadas.
   - **Notas**: registro de estado de ánimo al despertar, cómo terminó el día, y notas libres.
4. Agregar nuevas actividades (personalizables, no solo predefinidas).
5. Visualizar del lado izquierdo un resumen/listado de actividades (similar al ejemplo de referencia `@app/components/example-calendar/example-calendar.jsx`).
6. Navegar entre meses anteriores y posteriores.
   - Si un mes no tiene registros, no debe mostrar datos vacíos o ficticios (manejar estado "sin información").
7. **Restricción importante**: solo se puede marcar el checklist como completado en el **día actual**. Los días pasados o futuros se muestran en modo lectura (no editable para checks), aunque sí se pueden consultar/editar notas según se defina con `@backend-dev` y `@ui-ux-designer`.

---

## Requerimientos funcionales detallados

### 1. Autenticación
- Login de usuario (email/contraseña como mínimo).
- Sesión persistente (mantener sesión activa).
- Rutas protegidas: solo usuarios autenticados pueden acceder al calendario y checklist.

### 2. Calendario
- Vista mensual.
- Navegación entre meses (anterior/siguiente).
- Indicador visual en los días que tengan actividades/notas registradas.
- Días sin registro no muestran información (ni placeholders ni datos vacíos visibles).
- Al seleccionar un día, se despliega un panel/modal con dos secciones: "Actividades" y "Notas".

### 3. Actividades (Checklist)
- Lista de actividades del día con checkbox.
- Actividades predefinidas (ejemplos): gym, estudiar, tomar medicamento, etc.
- Posibilidad de **agregar nuevas actividades** (botón/acción dedicada), que pueden ser:
  - Recurrentes (se repiten cada día), o
  - Específicas de un día puntual (a definir alcance con `@backend-dev`).
- Solo el día actual permite marcar/desmarcar checks.
- Días pasados/futuros: checklist visible pero no editable (solo lectura).

### 4. Notas diarias
- Registro de **estado de ánimo al despertar**: opciones (mal, regular, bien, excelente).
- Registro de **cómo terminó el día**: opciones (mal, regular, bien, excelente).
- Campo de **nota libre** (texto) para comentarios adicionales del día.
- Posibilidad de ver y editar notas de días anteriores (definir si hay restricción de tiempo para editar).

### 5. Panel lateral (resumen de actividades)
- Mostrar del lado izquierdo un listado/resumen de actividades, tomando como referencia el componente de ejemplo `@app/components/example-calendar/example-calendar.jsx`.
- Debe reflejar el estado (completado/pendiente) de las actividades del día seleccionado.

---

## Tareas por agente

### `@ui-ux-designer`
- Diseñar la pantalla de login.
- Diseñar la vista principal del calendario (mensual), incluyendo:
  - Indicadores visuales de días con registros.
  - Estado visual de días pasados/futuros vs. día actual.
- Diseñar el panel/modal de día seleccionado con las pestañas o secciones "Actividades" y "Notas".
- Diseñar el panel lateral de resumen de actividades (inspirado en `example-calendar.jsx`).
- Diseñar el flujo y formulario para agregar una nueva actividad.
- Diseñar el formulario de notas diarias (selección de estado de ánimo con iconos/escalas, campo de texto libre).
- Definir guía de estilo: paleta de colores, tipografía, componentes reutilizables (botones, checkboxes, badges de estado de ánimo, etc.), pensando en una estética cuidada y agradable para el público objetivo (mujeres).

### `@backend-dev`
- Definir arquitectura general de la app (estructura de carpetas en Next.js, App Router vs Pages Router, etc.).
- Usar **PostgreSQL a través de Supabase** como base de datos, aprovechando sus servicios (DB, Auth, y opcionalmente Storage/Realtime si se requieren).
- Definir modelo de datos:
  - Usuarios (autenticación).
  - Actividades (catálogo de actividades, recurrentes vs. puntuales).
  - Registro diario de actividades (relación usuario-día-actividad-estado).
  - Notas diarias (estado de ánimo inicial, estado de ánimo final, nota libre, fecha, usuario).
- Definir e implementar sistema de autenticación (login, manejo de sesión/tokens).
- Definir y documentar endpoints/API necesarios:
  - CRUD de actividades.
  - Obtener/actualizar checklist de un día específico.
  - Obtener/crear/editar notas de un día específico.
  - Obtener resumen de días con registros por mes (para pintar el calendario).
- Definir reglas de negocio en backend:
  - Validar que solo se puedan marcar checks del día actual (validación también en servidor, no solo en frontend).
  - Manejo de meses sin registros (respuestas vacías controladas).

### `@frontend-dev`
- Implementar el maquetado utilizando **Tailwind CSS**, siguiendo la guía de estilo definida por `@ui-ux-designer`.
- Implementar la pantalla de login conforme al diseño de `@ui-ux-designer` y conectarla a la API de `@backend-dev`.
- Implementar el calendario mensual con navegación entre meses, consumiendo el endpoint de resumen mensual.
- Implementar el panel/modal de día seleccionado con las secciones de "Actividades" y "Notas".
- Implementar el checklist de actividades:
  - Checks habilitados solo para el día actual.
  - Checks deshabilitados (modo lectura) para otros días.
- Implementar el formulario/acción para agregar nuevas actividades.
- Implementar el formulario de notas diarias (estado de ánimo inicial/final, nota libre).
- Implementar el panel lateral de resumen de actividades basado en `@app/components/example-calendar/example-calendar.jsx`, adaptado al diseño final.
- Asegurar manejo correcto de estados vacíos (meses sin registros).

---

## Consideraciones adicionales

- Tecnología base: **Next.js** (especificar versión/App Router si se decide durante la fase de arquitectura), **PostgreSQL/Supabase** como base de datos y **Tailwind CSS** para estilos.
- Priorizar una experiencia mobile-first, ya que es probable que se use principalmente desde celular.
- Mantener componentes reutilizables y desacoplados para facilitar futuras funcionalidades (ej. estadísticas, recordatorios, exportar datos).
- Documentar decisiones de arquitectura y diseño para futuras iteraciones.
