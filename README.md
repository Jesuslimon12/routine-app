# Mi Rutina Diaria

Aplicación web personal para organizar actividades cotidianas y llevar una bitácora de bienestar. Cada persona inicia sesión, consulta su calendario, marca las actividades del día y registra cómo se sintió junto con una nota diaria.

## Funcionalidades

- Registro con contraseña segura, confirmación por correo, inicio y cierre de sesión con Supabase Auth.
- Calendario mensual con indicadores en los días que tienen actividad registrada.
- Lista diaria de actividades programadas todos los días, para una fecha específica o durante un rango.
- Marcado de actividades completadas únicamente para el día actual.
- Registro del estado de ánimo de mañana y tarde.
- Notas diarias de hasta 5,000 caracteres.
- Creación, edición, duplicación, pausa y reactivación de actividades sin alterar su historial anterior.
- Prevención de actividades duplicadas con el mismo nombre y fechas superpuestas.
- Interfaz adaptable para computadoras, tabletas y teléfonos.

## Especificaciones del proyecto

### Tecnologías

| Área | Tecnología |
| --- | --- |
| Framework | Next.js 16 con App Router |
| Interfaz | React 19 y Tailwind CSS 4 |
| Animaciones | Framer Motion 12 |
| Componentes accesibles | Headless UI y Heroicons |
| Autenticación y base de datos | Supabase Auth y PostgreSQL |
| Cliente de Supabase | `@supabase/ssr` y `@supabase/supabase-js` |

### Arquitectura

- Los Server Components cargan la sesión y los datos directamente desde Supabase.
- Las mutaciones de la interfaz se ejecutan mediante Server Actions con validación en el servidor.
- `proxy.js` actualiza las cookies de autenticación y realiza redirecciones optimistas.
- La autorización definitiva se comprueba en el acceso a datos y se refuerza con Row Level Security (RLS).
- Los componentes cliente se limitan a las partes que requieren estado o interacción inmediata.

### Modelo de datos

| Tabla | Responsabilidad |
| --- | --- |
| `profiles` | Perfil asociado a cada usuario de Supabase Auth. |
| `activities` | Actividades diarias, de fecha única o de rango, con fechas de vigencia. |
| `activity_pauses` | Intervalos durante los que una actividad queda pausada. |
| `activity_logs` | Estado de cumplimiento de una actividad por fecha. |
| `daily_notes` | Estados de ánimo y nota personal de cada día. |

Todas las tablas de usuario tienen RLS habilitado. Las políticas restringen las lecturas y escrituras al propietario autenticado; las operaciones de pausa y reactivación se realizan mediante funciones PostgreSQL protegidas.

### Reglas principales

- Cada registro pertenece al usuario autenticado; el identificador nunca se acepta desde el cliente.
- Una actividad diaria aparece desde su fecha inicial salvo durante sus periodos de pausa.
- Una actividad de fecha única solo aparece el día programado; una actividad de rango aparece cada día entre sus fechas inicial y final.
- La edición conserva el historial anterior y aplica la nueva programación desde la fecha efectiva.
- No pueden existir actividades del mismo usuario con el mismo nombre y periodos superpuestos.
- El cumplimiento solo puede modificarse en la fecha actual.
- Cada usuario puede tener un único registro de actividad y una única nota por fecha.
- La zona horaria operativa para las reglas de fecha es `America/Mexico_City`.

## Requisitos

- Node.js compatible con Next.js 16.
- npm.
- Un proyecto de Supabase con autenticación por correo y contraseña.

## Configuración local

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea un archivo `.env.local` en la raíz:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publicable_o_anon
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   AUTH_RATE_LIMIT_SECRET=un_secreto_aleatorio_de_al_menos_32_bytes
   ```

3. En el SQL Editor de Supabase, ejecuta `supabase/schema.sql` para una instalación nueva. Si la base ya existe, aplica en orden los archivos de `supabase/migrations/` que aún no se hayan ejecutado.

4. En Supabase Auth, habilita la confirmación por correo y agrega `http://localhost:3000/auth/confirm` y la URL equivalente de producción a las Redirect URLs permitidas.

5. En Vercel configura `NEXT_PUBLIC_SITE_URL` con el dominio público y `AUTH_RATE_LIMIT_SECRET` con un valor aleatorio privado. No reutilices la clave pública de Supabase como secreto.

6. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

7. Abre [http://localhost:3000](http://localhost:3000).

Los archivos `.env*` están excluidos de Git para evitar publicar credenciales.

## Comandos

| Comando | Uso |
| --- | --- |
| `npm run dev` | Inicia el entorno de desarrollo. |
| `npm run build` | Genera y valida la compilación de producción. |
| `npm run start` | Sirve una compilación ya generada. |
| `npm test` | Ejecuta las pruebas de validación de autenticación. |

## Estructura principal

```text
app/
├── components/          Componentes de interfaz y funcionalidades
├── lib/                 Sesión, acceso a datos, fechas y Server Actions
├── login/               Pantalla y formulario de autenticación
├── error.js             Límite de errores de la aplicación
├── loading.js           Estado de carga
└── page.js              Vista principal autenticada
supabase/
├── migrations/          Cambios incrementales de la base de datos
└── schema.sql            Esquema completo para instalaciones nuevas
proxy.js                  Renovación de sesión y redirecciones
```

## Seguridad

- La sesión se valida en el servidor mediante Supabase.
- RLS permanece habilitado en las tablas con datos personales.
- Las Server Actions validan identificadores, fechas, longitudes y valores permitidos.
- Zod valida en el servidor el correo y las reglas de contraseña del registro.
- Login y registro tienen límites distribuidos por IP y correo antes de llamar a Supabase Auth.
- La clave `service_role` no se utiliza ni debe exponerse en el navegador.
- La clave pública de Supabase solo es segura mientras las políticas RLS permanezcan correctamente configuradas.
