# Plan de trabajo — MVP

Al completar una tarea: marcar `[x]` y tacharla con `~~texto~~`.
Las decisiones de stack y convenciones están en `CLAUDE.md`.

## Fase 0 — Setup del stack
- [x] ~~Configurar `nuxt.config.ts`: `ssr: false`, TypeScript estricto~~
- [x] ~~Instalar y configurar ESLint (`@nuxt/eslint`)~~
- [x] ~~Instalar Tailwind CSS v4 y crear `app/assets/css/main.css`~~
- [x] ~~Inicializar shadcn-vue (`app/components/ui/`)~~
- [x] ~~Instalar Pinia y Zod~~
- [x] ~~Instalar y configurar `@nuxtjs/i18n` (`es` por defecto, `en`) con archivos de locale~~
- [x] ~~Instalar `@nuxtjs/supabase`, crear `app/lib/supabase.ts` y `.env.example`~~
- [x] ~~Instalar y configurar Vitest (con un test de ejemplo)~~
- [x] ~~Crear la estructura base `app/features/`, `app/pages/`, `app/layouts/`~~
- [x] ~~Primer commit~~

## Fase 1 — Sistema de temas
- [x] ~~Definir el set de tokens semánticos (background, foreground, primary, muted, border, destructive…)~~
- [x] ~~Crear `app/assets/css/themes.css` con un tema por defecto y exponerlo con `@theme inline`~~
- [x] ~~Diseñar los temas predefinidos: Claro, Oscuro y Arena~~
- [x] ~~Aplicar el tema en `<html data-theme>` antes del primer render (caché en localStorage)~~
- [x] ~~Store de tema en Pinia~~
- [x] ~~Selector de tema y página temporal de vista previa~~
- [ ] (Opcional) Regla de lint o script que detecte colores sueltos

## Fase 2 — Supabase: base y auth
- [x] ~~Crear el proyecto en Supabase y configurar las variables de entorno~~
- [x] ~~Inicializar Supabase CLI con migraciones versionadas en el repo~~
- [x] ~~Tabla `profiles` (id, display_name, role, theme, locale, timestamps) + trigger al registrarse~~
- [x] ~~Políticas RLS para `profiles`~~
- [x] ~~Generar los tipos de la base de datos para TypeScript~~
- [x] ~~Feature `auth`: registro, login, confirmación de correo, recuperar y cambiar contraseña~~
- [x] ~~Middleware de rutas: autenticado, invitado y admin~~
- [x] ~~Sincronizar el tema y el idioma con `profiles`~~
- [x] ~~Idioma: español por defecto (sin detección del navegador) y selector disponible en toda la app~~
- [x] ~~Configurar Auth en el dashboard: Site URL, Redirect URLs (`http://localhost:3000/**`) y contraseña mínima de 8~~
- [x] ~~Probar el flujo completo en el navegador (registro → confirmación → login → recuperar contraseña)~~
- [x] ~~Crear el primer usuario admin (`update profiles set role = 'admin'` desde el SQL Editor)~~

## Fase 3 — Layout y navegación
- [x] ~~Layout de invitado (auth) y layout de la app (mobile-first)~~
- [x] ~~Navegación principal y selector de tema (el de idioma ya está en ambos layouts)~~
- [x] ~~Página de perfil / ajustes~~
- [x] ~~Layout y ruta base del panel de admin~~
- [x] ~~Roles `admin` (editor de contenido) y `super_admin` (todo); RLS de datos de usuarios solo para el super admin~~
- [x] ~~Super admin: crear, eliminar y cambiar la contraseña de admins (Edge Function `admin-users`)~~
- [x] ~~Probar en el navegador la gestión de admins (crear → iniciar sesión como admin → cambiar contraseña → eliminar)~~
- [x] ~~Páginas placeholder para Mi plan, Cursos, Retos y Sesiones~~

## Fase 4 — Diagnóstico inicial
- [x] ~~Modelo de datos: preguntas por pilar, respuestas y resultado~~
- [x] ~~Flujo del diagnóstico para el usuario~~
- [x] ~~Cálculo de puntaje por pilar (selectors en `data/` + tests)~~
- [x] ~~Pantalla de resultados con áreas de oportunidad~~
- [x] ~~Contenido inicial: 10 preguntas de opción múltiple por pilar (es/en)~~
- [x] ~~Diagnóstico obligatorio hasta completarlo~~
- [x] ~~Diagnóstico de un solo intento; solo un desarrollador habilita repetirlo (`dev_allow_diagnostic_retake`)~~
- [x] ~~Admin: ver preguntas con puntajes y probar el diagnóstico en modo vista previa (sin guardar)~~
- [x] ~~Admin: UI para editar, añadir y eliminar preguntas/respuestas y cambiar puntajes~~
- [x] ~~Admin: reordenar preguntas dentro de su pilar con drag and drop (y teclado ↑ ↓)~~
- [x] ~~Admin: guardar la edición del diagnóstico en Supabase (migración, RPCs de crear/añadir/borrar/reordenar, API con cambios optimistas)~~
- [x] ~~Diagnóstico del usuario: si el admin cambia preguntas mientras responde, se recargan conservando sus respuestas~~
- [ ] Revisar y ajustar el contenido de las preguntas con los profesionales de cada pilar
- [ ] Activar "Leaked password protection" en Supabase Auth (si el plan lo permite)

## Fase 5 — Plan personal
- [x] ~~Definir cómo el diagnóstico genera la ruta de aprendizaje: pilares por prioridad (menor puntaje primero) y pasos según el nivel de cada pilar~~
- [x] ~~Modelo de datos del plan del usuario (`plan_step_templates`, `plan_steps`) con RLS~~
- [x] ~~Generación automática al completar el diagnóstico; al repetirlo se conserva lo completado y se recalcula lo pendiente~~
- [x] ~~Contenido inicial: 5 pasos por pilar con los niveles a los que aplican (es/en)~~
- [x] ~~Vista del plan personal con progreso y pasos marcables; siguiente paso en el inicio~~
- [x] ~~Admin: gestionar los pasos del plan (mismo patrón que el editor del diagnóstico)~~
- [x] ~~Cambiar la ruta no quita progreso: los pasos en uso no se borran, se desactivan; los planes existentes conservan sus pasos~~
- [x] ~~Mi plan: marcar pasos en un borrador local y guardar todo con "Guardar avance" (una sola escritura, `save_plan_progress`)~~
- [x] ~~Editores de admin (diagnóstico y plan) con borrador local y "Guardar cambios" en una sola escritura (`admin_save_diagnostic`, `admin_save_plan_steps`)~~
- [x] ~~Probar en el navegador los editores de admin con borrador (editar varias cosas → Guardar cambios / Descartar)~~
- [ ] Enlazar pasos a lecciones, retos y sesiones cuando existan (`kind` ya previsto)

## Fase 6 — Cursos pregrabados
- [x] ~~**Decidir el hosting de video**: Bunny Stream (red Volume, autenticación por token; los videos se suben en Bunny y en el admin se pega el ID)~~
- [x] ~~Configurar la Video Library de Bunny (red Volume, token authentication, dominios permitidos) y subir videos de prueba~~
- [x] ~~Modelo de datos: pilar → curso → lecciones (proveedor + ID de video) y progreso por usuario~~
- [x] ~~Catálogo de cursos y vista de lección con reproductor (enlace firmado por la Edge Function `lesson-video`)~~
- [x] ~~Marcar lecciones como completadas~~
- [x] ~~Lecciones secuenciales: la siguiente se desbloquea al completar la actual (`lesson_is_unlocked` en la base y en `lesson-video`); completar es definitivo~~
- [x] ~~Admin: cursos y lecciones con borrador y "Guardar cambios" (`admin_save_courses`); lecciones completadas no se borran, se desactivan~~
- [x] ~~Formularios del admin: botón deshabilitado hasta completar lo obligatorio; descripción del curso obligatoria (textarea); duración de lecciones en min:seg~~
- [x] ~~Vista de lección en grilla: mapa del curso (línea de tiempo con completadas, actual y bloqueadas) a la izquierda y video a la derecha; la misma línea de tiempo en la página del curso~~
- [x] ~~Guardar `BUNNY_TOKEN_KEY` en los secrets de Supabase y probar la reproducción en el navegador~~
- [x] ~~Probar en el navegador el catálogo, el avance de lecciones y el editor de cursos~~

## Fase 7 — Retos y ejercicios
- [x] ~~Modelo de datos: retos por pilar con duración en días, inscripción y check-ins diarios (se completa al acumular los días; lo calcula la base)~~
- [x] ~~Vista de retos: catálogo por pilar, "En curso", detalle, check-in del día y racha~~
- [x] ~~Admin: retos con borrador y "Guardar cambios" (`admin_save_challenges`); retos empezados no se borran, se desactivan~~
- [ ] Probar en el navegador los retos (empezar, check-in, completar) y su editor

## Fase 8 — Sesiones en vivo
- [ ] **Decidir la plataforma (enlace a Zoom/Meet vs. embebido)**
- [ ] Modelo de datos: sesiones por pilar, profesional, fecha y enlace
- [ ] Calendario / listado de próximas sesiones
- [ ] Admin: gestión de sesiones

## Fase 9 — Dashboard de progreso
- [x] ~~Selectors de progreso por pilar (plan, lecciones y retos; cada fuente pesa igual) + tests~~
- [x] ~~Dashboard con el avance de cada pilar (tarjeta "Tu progreso" en el inicio)~~
- [ ] Sumar las sesiones en vivo al progreso cuando exista la fase 8
- [ ] Probar en el navegador el dashboard de progreso

## Fase 10 — Comunidad
- [ ] **Decidir si es propia o externa (Discord/WhatsApp)**
- [ ] Implementar según la decisión

## Fase 11 — Acceso y lanzamiento
- [x] ~~Landing pública `/landing` (réplica de `references/Valen Landing.html` con tokens del tema y Archivo; la inscripción lleva al registro)~~
- [ ] Landing: foto real en blanco y negro para el hero
- [ ] Landing: actualizar `LAUNCH` (fecha, cupos tomados, precio) en `features/landing/data/launch.ts` antes de publicar
- [ ] Decidir si `/` sin sesión redirige a `/landing` en lugar de `/auth/login`
- [ ] **Decidir pagos (Stripe vs. acceso manual para la primera generación)**
- [ ] Controlar el acceso de la generación (invitación o flag en `profiles`)
- [ ] Configurar el correo de Supabase (SMTP propio y plantillas en es/en)
- [x] ~~Deploy de la SPA en Netlify (https://mindsetvalen.netlify.app), con las URLs de Supabase Auth y el dominio permitido en Bunny~~
- [ ] Dominio propio (actualizar Site URL y Redirect URLs en Supabase y el dominio permitido en Bunny)
- [ ] Revisión de seguridad de las políticas RLS
- [ ] Onboarding del primer grupo de usuarios
- [x] ~~Botón flotante de sugerencias y bugs (tipo + mensaje, máx. 10 por hora) y bandeja en el admin solo para el super admin~~
- [ ] Probar en el navegador el feedback (enviar desde varias páginas, bandeja, filtros y estados)
