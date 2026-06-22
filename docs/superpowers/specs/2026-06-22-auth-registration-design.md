# Registro, acceso y protección de autenticación

## Objetivo

Extender la pantalla pública `/login` para que una persona pueda iniciar sesión o crear una cuenta con correo y contraseña. El registro exige confirmación por correo, validación de contraseña segura y protección distribuida contra solicitudes repetidas. El cambio conserva Supabase Auth como único sistema de autenticación y reutiliza el sistema visual existente.

## Alcance

- Mantener login y registro en una sola pantalla pública.
- Registrar únicamente correo y contraseña; no solicitar nombre ni teléfono porque el producto y `public.profiles` no los utilizan.
- Exigir confirmación de contraseña en el formulario de registro.
- Exigir confirmación por correo de Supabase antes del primer acceso.
- Aplicar Zod como validación autoritativa en las Server Actions.
- Añadir rate limiting distribuido en PostgreSQL para despliegues serverless en Vercel.
- Mejorar la presentación, accesibilidad y respuesta visual del formulario de login.
- Animar exclusivamente el intercambio entre login y registro con Framer Motion.

No se incluyen recuperación de contraseña, autenticación por teléfono, OAuth, CAPTCHA ni edición del perfil.

## Arquitectura

`app/login/page.jsx` permanece como Server Component y conserva la composición general de la pantalla. Un componente cliente pequeño será propietario del modo activo (`login` o `register`) y de la transición visual. Los formularios enviarán `FormData` directamente a Server Actions mediante `useActionState`; no se añadirá una API interna ni una capa de servicios.

Las reglas de autenticación vivirán en un módulo compartido de esquemas Zod que no contendrá secretos ni dependencias exclusivas del servidor. Las Server Actions volverán a validar todos los datos, consumirán el límite correspondiente y solo entonces llamarán a Supabase Auth.

El rate limit se almacenará en PostgreSQL y se consumirá mediante una función SQL atómica. El servidor derivará el bucket con HMAC-SHA256 a partir de la acción, IP y correo normalizado usando `AUTH_RATE_LIMIT_SECRET`. La base recibirá únicamente el hash opaco. La tabla de contadores tendrá RLS habilitado y ninguna política de acceso directo; la función `security definer` expondrá solo la operación necesaria y aplicará límites fijos por acción.

## Componentes e interfaz

La tarjeta de autenticación tendrá un selector accesible con dos opciones: “Iniciar sesión” y “Crear cuenta”. El control comunicará visualmente y mediante `aria` cuál panel está activo. Al cambiar, Framer Motion aplicará al contenido un fundido con desplazamiento vertical breve de 200–250 ms. La animación no afectará el resto de la página y se reducirá cuando el sistema solicite menos movimiento.

En pantallas móviles, la introducción editorial superior se mostrará en login y se ocultará durante el registro para priorizar los campos y evitar desplazamiento vertical innecesario.

Se reutilizarán `Button`, los tokens de Tailwind y los patrones de foco actuales. Los campos tendrán etiquetas persistentes, atributos `autocomplete`, ayuda asociada mediante `aria-describedby` y errores próximos al campo. La jerarquía usará la paleta ciruela existente, escala de 8 px, contraste WCAG AA y controles de al menos 44 px.

El registro mostrará:

1. Correo electrónico.
2. Contraseña.
3. Confirmar contraseña.
4. Una línea compacta que indica los requisitos pendientes y cambia a “Contraseña segura” cuando todos se cumplen, sin sustituir la validación del servidor.

Después de un registro aceptado, la tarjeta mostrará un estado de éxito que pide revisar el correo y permite volver al login. Al abrir el enlace, la cuenta se confirmará, se cerrará la sesión temporal de Supabase y se regresará al login con el mensaje “Cuenta verificada. Ya puedes iniciar sesión”. No se accederá automáticamente al dashboard.

El login conservará correo y contraseña, con copy más directo y estados de error accesibles. La complejidad de contraseña nueva no se impondrá al login, para no bloquear cuentas existentes con credenciales anteriores.

## Validación

El esquema de registro exige:

- Correo válido, normalizado y con máximo de 254 caracteres.
- Contraseña de 12 a 128 caracteres.
- Al menos una letra minúscula, una mayúscula, un número y un carácter especial o signo de puntuación.
- Confirmación idéntica a la contraseña.

El esquema de login exige correo válido y contraseña no vacía, con límites defensivos de longitud. Los errores de Zod se convertirán en un objeto estable de errores por campo y un mensaje general; nunca se incluirá la contraseña en la respuesta ni en logs.

## Registro y confirmación

La acción de registro llamará a `supabase.auth.signUp` con correo y contraseña. La configuración de Supabase deberá mantener habilitada la confirmación por correo. Cuando Supabase acepte la solicitud, la UI mostrará el estado de confirmación independientemente de si el correo ya estaba registrado, evitando revelar la existencia de cuentas.

El trigger existente seguirá creando `public.profiles` con `id` y `email`; no requiere cambios de columnas.

## Rate limiting

Los límites de aplicación serán:

- Login: 5 solicitudes por bucket en 15 minutos.
- Registro: 3 solicitudes por bucket en 60 minutos.

El bucket combinará la acción, la dirección IP obtenida de los encabezados de Vercel y el correo normalizado. En desarrollo se usará un identificador local estable cuando no exista IP. La función SQL incrementará o reiniciará el contador en una sola operación para evitar carreras. Al exceder el límite, la acción devolverá un mensaje genérico con el tiempo aproximado de espera y no contactará Supabase Auth.

Los límites nativos de Supabase Auth permanecen activos como segunda capa. Los contadores vencidos podrán conservarse temporalmente; una eliminación acotada de filas expiradas durante consumos posteriores evitará crecimiento indefinido sin añadir cron ni infraestructura.

## Manejo de errores

- Credenciales inválidas en login: mensaje genérico sin distinguir correo inexistente de contraseña incorrecta.
- Registro aceptado o correo ya existente: mismo estado de “revisa tu correo” cuando sea posible.
- Datos inválidos: errores por campo derivados de Zod.
- Rate limit excedido: mensaje general y formulario disponible cuando termine la ventana.
- Falla inesperada de Supabase o PostgreSQL: mensaje recuperable para la persona y detalle técnico solo en el servidor, sin datos sensibles.

## Cambios de datos y configuración

- Añadir Zod a las dependencias de producción.
- Añadir `AUTH_RATE_LIMIT_SECRET` al entorno de Vercel y documentarlo sin exponer su valor.
- Añadir una migración incremental para la tabla y función de rate limit.
- Reflejar la misma estructura en `supabase/schema.sql` para instalaciones nuevas.
- No usar `service_role` ni exponer secretos al navegador.

## Verificación

- Casos unitarios de los esquemas: correo, longitudes, cada categoría de contraseña y coincidencia de confirmación.
- Prueba manual de registro, confirmación por correo y posterior login.
- Prueba del quinto/sexto intento de login y tercer/cuarto intento de registro según sus ventanas.
- Verificación de mensajes que no permitan enumeración de cuentas.
- Navegación completa por teclado, foco visible, etiquetas y anuncios de error/éxito.
- Revisión visual en anchos móvil y escritorio, además de movimiento reducido.
- Compilación de producción con Next.js 16.

## Criterios de aceptación

- Una cuenta válida puede registrarse y recibe el correo de confirmación.
- La cuenta no accede hasta confirmar el correo.
- Las contraseñas que incumplen cualquiera de las reglas son rechazadas por el servidor.
- Login y registro comparten una tarjeta y solo su contenido se anima al alternar.
- Los límites funcionan entre instancias serverless y bloquean antes de llamar a Supabase.
- Login y registro no revelan si un correo ya existe.
- La interfaz mantiene los componentes, tokens, accesibilidad y respuesta adaptable del proyecto.
