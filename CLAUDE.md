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

El store de Pinia de cada feature vive en `app/features/<feature>/store.ts`.

El shell de la app (header, navegación inferior móvil, menú de usuario) está en `app/features/shell/`. La navegación principal se define en `shell/data/navigation.ts` (máximo 5 ítems por la barra móvil).

`app/pages/` solo compone las features. Lo compartido entre features va en `app/components/`, `app/composables/` y `app/lib/`.

# Colores y temas
- Prohibido usar colores sueltos: nada de hex, rgb ni hsl en componentes, y nada de clases de la paleta de Tailwind (`bg-blue-500`, `text-gray-700`, etc.).
- Solo se usan tokens semánticos: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning` (cada uno con su `-foreground`), `border`, `input` y `ring`. Por ejemplo: `bg-primary text-primary-foreground`, `text-muted-foreground`.
- El verde (`primary`) es el color de marca, pero se usa con moderación: acciones principales, estados activos y foco. Superficies, hover y fondos secundarios usan los neutros.
- Los componentes generados por shadcn-vue se revisan al agregarlos: si traen colores sueltos (`text-white`, etc.), se cambian por tokens.
- La variante `dark:` responde a `data-theme="dark"`, no al sistema operativo.
- Los tokens se definen como CSS variables en `app/assets/css/themes.css`, un bloque por tema (`[data-theme="<name>"]`), y se exponen a Tailwind con `@theme inline`.
- Para agregar un tema, se define el set completo de tokens y se agrega a `THEMES` en `app/features/theme/data/themes.ts`. Para agregar un token, se define en todos los temas. Los pares texto/fondo deben tener un contraste de al menos 4.5:1.
- El tema activo se aplica en `<html data-theme>`, se guarda en `profiles.theme` (Supabase) y se cachea en localStorage para aplicarlo antes del primer render.

# Auth y roles
- Login con correo y contraseña de Supabase Auth: registro, confirmación de correo y recuperación de contraseña.
- Roles `user` y `admin` en `profiles.role`. Las rutas de admin llevan un middleware de rol.
- RLS activado en todas las tablas. La seguridad se garantiza en la base de datos, no en el frontend.
- Cada página declara quién puede entrar con `definePageMeta({ access })`: `public`, `guest` (solo sin sesión), `user` (por defecto) o `admin`. Lo aplica `app/middleware/access.global.ts`.
- Los textos de error de formularios y de Supabase son claves de i18n (`auth.errors.*`), no mensajes literales.

# Base de datos
- Todo cambio de esquema va en una migración en `supabase/migrations/` (nunca a mano en el dashboard).
- Tras cada migración: `npm run db:push` y `npm run db:types` (regenera `app/types/database.types.ts`, no se edita a mano).
- Funciones `security definer` siempre con `set search_path = ''`. Los permisos de columna se restringen con `grant update (...)`.

# Idioma
- Código en inglés: identificadores, nombres de archivos, tablas y columnas.
- Español es el idioma por defecto; no se detecta el idioma del navegador. El usuario lo cambia desde cualquier pantalla con `LocaleSelect` (presente en todos los layouts; todo layout nuevo debe incluirlo). La elección se guarda en localStorage y en `profiles.locale`.
- Todo texto visible sale de i18n (`es` y `en`). No se escriben strings hardcodeados en templates.
- Todo texto nuevo se agrega en ambos locales.

# Convenciones
- Validar los formularios con Zod y parsear las respuestas de `api/` con los mappers de `data/`.
- Diseño mobile-first.
- Los tests de Vitest cubren como mínimo los mappers y selectors de `data/`.

# Comandos
- `npm run dev` / `npm run build`
- `npm run lint` / `npm run lint:fix`
- `npm test` (Vitest, archivos `app/**/*.test.ts`)
- `npm run typecheck`
- Componentes shadcn: `npx shadcn-vue@latest add <componente>` (se generan en `app/components/ui/`)
- Variables de entorno: copiar `.env.example` a `.env` (`NUXT_PUBLIC_SUPABASE_URL`, `NUXT_PUBLIC_SUPABASE_KEY`)
