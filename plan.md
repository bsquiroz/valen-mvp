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
- [ ] Definir el set de tokens semánticos (background, foreground, primary, muted, border, destructive…)
- [ ] Crear `app/assets/css/themes.css` con un tema por defecto y exponerlo con `@theme inline`
- [ ] Diseñar 2–3 temas predefinidos adicionales (nombres y colores)
- [ ] Aplicar el tema en `<html data-theme>` antes del primer render (caché en localStorage)
- [ ] Store de tema en Pinia
- [ ] (Opcional) Regla de lint o script que detecte colores sueltos

## Fase 2 — Supabase: base y auth
- [ ] Crear el proyecto en Supabase y configurar las variables de entorno
- [ ] Inicializar Supabase CLI con migraciones versionadas en el repo
- [ ] Tabla `profiles` (id, display_name, role, theme, locale, timestamps) + trigger al registrarse
- [ ] Políticas RLS para `profiles`
- [ ] Generar los tipos de la base de datos para TypeScript
- [ ] Feature `auth`: registro, login, confirmación de correo, recuperar y cambiar contraseña
- [ ] Middleware de rutas: autenticado, invitado y admin
- [ ] Sincronizar el tema y el idioma con `profiles`

## Fase 3 — Layout y navegación
- [ ] Layout de invitado (auth) y layout de la app (mobile-first)
- [ ] Navegación principal y selector de tema e idioma
- [ ] Página de perfil / ajustes
- [ ] Layout y ruta base del panel de admin

## Fase 4 — Diagnóstico inicial
- [ ] Modelo de datos: preguntas por pilar, respuestas y resultado
- [ ] Flujo del diagnóstico para el usuario
- [ ] Cálculo de puntaje por pilar (selectors en `data/` + tests)
- [ ] Pantalla de resultados con áreas de oportunidad

## Fase 5 — Plan personal
- [ ] Definir cómo el diagnóstico genera la ruta de aprendizaje
- [ ] Modelo de datos del plan del usuario
- [ ] Vista del plan personal

## Fase 6 — Cursos pregrabados
- [ ] **Decidir el hosting de video**
- [ ] Modelo de datos: cursos → módulos → lecciones, por pilar
- [ ] Catálogo de cursos y vista de lección con reproductor
- [ ] Marcar lecciones como completadas
- [ ] Admin: CRUD de cursos, módulos y lecciones

## Fase 7 — Retos y ejercicios
- [ ] Modelo de datos: retos por pilar/lección y su seguimiento
- [ ] Vista de retos y marcarlos como completados
- [ ] Admin: CRUD de retos

## Fase 8 — Sesiones en vivo
- [ ] **Decidir la plataforma (enlace a Zoom/Meet vs. embebido)**
- [ ] Modelo de datos: sesiones por pilar, profesional, fecha y enlace
- [ ] Calendario / listado de próximas sesiones
- [ ] Admin: gestión de sesiones

## Fase 9 — Dashboard de progreso
- [ ] Selectors de progreso por pilar (lecciones, retos, sesiones) + tests
- [ ] Dashboard con el avance de cada pilar

## Fase 10 — Comunidad
- [ ] **Decidir si es propia o externa (Discord/WhatsApp)**
- [ ] Implementar según la decisión

## Fase 11 — Acceso y lanzamiento
- [ ] **Decidir pagos (Stripe vs. acceso manual para la primera generación)**
- [ ] Controlar el acceso de la generación (invitación o flag en `profiles`)
- [ ] Configurar el correo de Supabase (SMTP propio y plantillas en es/en)
- [ ] Deploy (hosting estático para la SPA) y dominio
- [ ] Revisión de seguridad de las políticas RLS
- [ ] Onboarding del primer grupo de usuarios
