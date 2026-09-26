# Proyecto
MVP de plataforma de desarrollo personal para hombres (ver README.md). Pilares: psicología, finanzas, fitness y relaciones.

# Plan de trabajo
`plan.md` (raíz) es el checklist del MVP. Al completar una tarea, marcarla `[x]` y tacharla con `~~texto~~` en ese mismo cambio. Si surge trabajo nuevo, agregarlo en la fase que corresponda.

# Stack
- Nuxt 4 en modo SPA (`ssr: false`), Vue 3 y TypeScript estricto. Gestor de paquetes: npm.
- Tailwind CSS v4 y shadcn-vue (los componentes viven en `app/components/ui/`).
- Supabase (auth, Postgres y storage) mediante `@nuxtjs/supabase`.
- Pinia para estado global, Zod para validación y `@nuxtjs/i18n`.
- `@nuxt/eslint` para lint y Vitest para tests.

# Arquitectura
Por features, en `app/features/<feature>/`:
- `ui/`: presentación (componentes y composables de vista). No importa Supabase.
- `data/`: tipos, schemas Zod, mappers (DB → dominio) y selectors. Son funciones puras y testeables.
- `api/`: el único lugar que importa `@/lib/supabase`. Devuelve datos ya mapeados por `data/`.

`app/pages/` solo compone las features. Lo compartido entre features va en `app/components/`, `app/composables/` y `app/lib/`.

# Colores y temas
- Prohibido usar colores sueltos: nada de hex, rgb ni hsl en componentes, y nada de clases de la paleta de Tailwind (`bg-blue-500`, `text-gray-700`, etc.).
- Solo se usan tokens semánticos: `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-destructive`, etc.
- Los tokens se definen como CSS variables en `app/assets/css/themes.css`, un bloque por tema (`[data-theme="<name>"]`), y se exponen a Tailwind con `@theme inline`.
- Para agregar un tema, se define el set completo de tokens. Para agregar un token, se define en todos los temas.
- El tema activo se aplica en `<html data-theme>`, se guarda en `profiles.theme` (Supabase) y se cachea en localStorage para aplicarlo antes del primer render.

# Auth y roles
- Login con correo y contraseña de Supabase Auth: registro, confirmación de correo y recuperación de contraseña.
- Roles `user` y `admin` en `profiles.role`. Las rutas de admin llevan un middleware de rol.
- RLS activado en todas las tablas. La seguridad se garantiza en la base de datos, no en el frontend.

# Idioma
- Código en inglés: identificadores, nombres de archivos, tablas y columnas.
- Todo texto visible sale de i18n (`es` por defecto y `en`). No se escriben strings hardcodeados en templates.
- Todo texto nuevo se agrega en ambos locales.

# Convenciones
- Validar los formularios con Zod y parsear las respuestas de `api/` con los mappers de `data/`.
- Diseño mobile-first.
- Los tests de Vitest cubren como mínimo los mappers y selectors de `data/`.
