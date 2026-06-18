# Reglas de desarrollo y autenticación con Supabase

## Objetivo

Adaptar las reglas de desarrollo del proyecto a su implementación real con Next.js 16, React 19 y Supabase. La autenticación existente se migrará del manejo manual de cookies al patrón SSR oficial de Supabase, manteniendo una arquitectura pequeña y directa.

## Alcance

- Ampliar `AGENTS.md` con principios específicos para este repositorio.
- Sustituir cualquier referencia a BetterAuth por Supabase Auth.
- Migrar la creación de clientes y la renovación de sesión al paquete SSR oficial de Supabase.
- Mantener `proxy.js` como mecanismo de renovación y redirección temprana.
- Verificar la identidad nuevamente en el servidor, cerca de las consultas y mutaciones protegidas.
- Conservar las pantallas y capacidades actuales de inicio y cierre de sesión.

No se rediseñará la interfaz, no se añadirán proveedores OAuth y no se refactorizarán áreas ajenas a autenticación y reglas del proyecto.

## Reglas adaptadas

`AGENTS.md` conservará la advertencia de consultar las guías instaladas de Next.js antes de escribir código. Añadirá estas decisiones:

- Server Components por defecto; Client Components solo por estado, efectos, eventos o APIs del navegador.
- Server Actions para mutaciones iniciadas por formularios; Route Handlers solo para endpoints públicos, webhooks o integraciones que realmente los necesiten.
- Ninguna llamada HTTP a rutas internas desde Server Components.
- `proxy.js`, nunca `middleware.js`, para esta versión de Next.js.
- Consultas directas de Supabase en el servidor y RLS como frontera de datos; sin capas repository/service salvo valor demostrado.
- Supabase Auth como único sistema de autenticación.
- Identidad validada en servidor antes de acceder a datos sensibles; el proxy no se considera la única defensa.
- Validación server-side obligatoria. React Hook Form y Zod se introducirán cuando un formulario compartido o suficientemente complejo compense sus dependencias; los formularios simples pueden usar `FormData` y validación directa.
- Reutilizar código y dependencias existentes antes de crear archivos, hooks, abstracciones o instalar paquetes.

## Arquitectura de autenticación

La integración usará `@supabase/ssr`, además del cliente de Supabase ya instalado:

1. Un cliente servidor leerá y escribirá cookies mediante la API asíncrona `cookies()` de Next.js 16.
2. `proxy.js` creará un cliente SSR ligado a `request` y `response`, renovará tokens cuando corresponda y propagará todas las cookies emitidas por Supabase.
3. El proxy podrá redirigir usuarios anónimos o autenticados para mejorar la navegación, pero las páginas, acciones y consultas protegidas verificarán de nuevo la identidad en el servidor.
4. Las Server Actions de login y logout usarán el cliente servidor oficial y redirigirán después de completar la operación.
5. No se analizará JSON de cookies ni se inferirá autenticación leyendo manualmente access tokens o fechas de expiración.

## Flujo de datos y errores

- Inicio de sesión: formulario → Server Action → Supabase Auth → cookies SSR → redirección.
- Lectura protegida: Server Component/DAL → usuario validado → consulta Supabase bajo RLS.
- Mutación protegida: formulario o interacción → Server Action → usuario validado → mutación Supabase → invalidación o actualización de la ruta.
- Cierre de sesión: Server Action → Supabase Auth → eliminación de cookies → redirección a login.

Los errores de credenciales se mostrarán sin revelar detalles internos. Los errores de configuración fallarán con mensajes claros en servidor. No se ocultarán silenciosamente fallos inesperados de escritura de cookies.

## Verificación

- Ejecutar el build de producción de Next.js.
- Comprobar que un usuario anónimo es enviado a `/login`.
- Comprobar login, persistencia tras recarga, acceso a datos y logout.
- Confirmar que un usuario autenticado no permanece en `/login`.
- Revisar que ninguna ruta protegida dependa únicamente del proxy para autorizar datos.
- Confirmar que no quedan adaptadores manuales ni registros de depuración de cookies o tokens.

