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

El shell de la app (header, navegación inferior móvil, menú de usuario) está en `app/features/shell/`. La navegación principal se define en `shell/data/navigation.ts` (máximo 5 ítems por la barra móvil). El layout `focus` (sin navegación: solo el selector de idioma y cerrar sesión) se usa en el diagnóstico, que el usuario debe terminar.

`app/pages/` solo compone las features. Lo compartido entre features va en `app/components/`, `app/composables/` y `app/lib/`.

# Colores y temas
- Prohibido usar colores sueltos: nada de hex, rgb ni hsl en componentes, y nada de clases de la paleta de Tailwind (`bg-blue-500`, `text-gray-700`, etc.).
- Solo se usan tokens semánticos: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning` (cada uno con su `-foreground`), `border`, `input`, `ring` y `overlay` (fondo de modales). Por ejemplo: `bg-primary text-primary-foreground`, `text-muted-foreground`.
- El verde (`primary`) es el color de marca, pero se usa con moderación: acciones principales, estados activos y foco. Superficies, hover y fondos secundarios usan los neutros.
- Los componentes generados por shadcn-vue se revisan al agregarlos: si traen colores sueltos (`text-white`, etc.), se cambian por tokens.
- La variante `dark:` responde a `data-theme="dark"`, no al sistema operativo.
- Los tokens se definen como CSS variables en `app/assets/css/themes.css`, un bloque por tema (`[data-theme="<name>"]`), y se exponen a Tailwind con `@theme inline`.
- Para agregar un tema, se define el set completo de tokens y se agrega a `THEMES` en `app/features/theme/data/themes.ts`. Para agregar un token, se define en todos los temas. Los pares texto/fondo deben tener un contraste de al menos 4.5:1.
- El tema activo se aplica en `<html data-theme>`, se guarda en `profiles.theme` (Supabase) y se cachea en localStorage para aplicarlo antes del primer render.

# Auth y roles
- Login con correo y contraseña de Supabase Auth: registro, confirmación de correo y recuperación de contraseña.
- Roles en `profiles.role`: `user`, `admin` y `super_admin`. Las rutas de admin llevan un middleware de rol.
  - `admin` = editor de contenido: gestiona diagnóstico, plan y, más adelante, cursos, retos y sesiones. No ve datos de usuarios (perfiles, respuestas, puntajes, planes) ni gestiona cuentas.
  - `super_admin` (uno solo, índice único): puede todo. Crea, elimina y cambia la contraseña de los admins desde `/admin/admins` mediante la Edge Function `supabase/functions/admin-users` (service role; los admins se crean con el correo ya confirmado).
  - Nadie asigna `super_admin` desde la app: solo por SQL.
  - En la base: `is_admin()` (admin o super_admin) para el contenido, `is_super_admin()` para los datos de usuarios y las cuentas. En el front: `isAdmin()`/`isSuperAdmin()` de `profile/data/profile.ts`.
- RLS activado en todas las tablas. La seguridad se garantiza en la base de datos, no en el frontend.
- Cada página declara quién puede entrar con `definePageMeta({ access })`: `public`, `guest` (solo sin sesión), `user` (por defecto), `admin` o `super_admin`. Lo aplica `app/middleware/access.global.ts`.
- Mientras el usuario no complete el diagnóstico, las páginas `user` redirigen a `/diagnostic` (admins exentos). Las páginas que deben verse igual declaran `diagnosticGate: false`.
- El diagnóstico se responde una sola vez (`complete_diagnostic` rechaza un segundo intento). Solo un desarrollador habilita otro, desde el SQL Editor: `select public.dev_allow_diagnostic_retake('<user_id>');`. El historial y los pasos completados se conservan.
- Los textos de error de formularios y de Supabase son claves de i18n (`auth.errors.*`), no mensajes literales.

# Base de datos
- Todo cambio de esquema va en una migración en `supabase/migrations/` (nunca a mano en el dashboard).
- Tras cada migración: `npm run db:push` y `npm run db:types` (regenera `app/types/database.types.ts`, no se edita a mano).
- Supabase da permisos por defecto a `anon`/`authenticated` en tablas nuevas: cada migración hace `revoke all` y concede solo lo necesario.
- Una sola política permisiva por tabla/rol/acción (combinar condiciones con `or`), y `auth.uid()`/`is_admin()` envueltos en `(select ...)`.
- Editar contenido nunca le quita progreso a un usuario: un paso del plan que ya está en algún plan no se borra, se desactiva (`admin_save_plan_steps` lo impide), y los pasos nuevos, niveles y desactivaciones aplican solo a planes nuevos.
- Cálculos que el usuario no debe poder falsear (puntajes, progreso) se hacen en funciones de la base, no en el cliente. Si además hay una vista previa de admin, ambas llaman a la misma función de cálculo (p. ej. `compute_diagnostic_scores`).
- Contenido traducible en la base: columnas `jsonb` `{"es": "...", "en": "..."}` validadas con `is_localized_text()`; en el front, `localizedTextSchema` y `localize()` de `app/lib/localizedText.ts`.
- Niveles por puntaje: `scoreLevel()` en el front y `public.score_level()` en la base usan los mismos umbrales (<40 bajo, <70 medio); si cambian, cambiar ambos.
- Los pilares (`psychology`, `finance`, `fitness`, `relationships`) son el enum `public.pillar` y `PILLARS` en `app/lib/pillars.ts`.
- Verificar después de migrar: `npx supabase db advisors --linked`. Para probar SQL contra el remoto sin dejar datos: `npx supabase db query --linked -f archivo.sql` dentro de `begin; … rollback;`.
- Un `update`/`delete` que RLS filtra no da error, devuelve 0 filas: en `api/` usar `.select('id')` y tratar 0 filas como fallo.
- Operaciones de admin que requieren atomicidad o reglas entre filas (crear con hijos, reordenar, mínimos) van en RPC `admin_*` con `is_admin()` al inicio.
- Para cuidar las escrituras, las ediciones del usuario y del admin se hacen en un borrador local y se guardan con un botón ("Guardar cambios", "Guardar avance") en una sola llamada: una RPC que recibe el estado o los cambios completos, escribe solo lo que difiere y aplica todo o nada (`admin_save_diagnostic`, `admin_save_plan_steps`, `save_plan_progress`). Nada de una escritura por clic.
- Funciones `security definer` siempre con `set search_path = ''`. Los permisos de columna se restringen con `grant update (...)`.

# Idioma
- Código en inglés: identificadores, nombres de archivos, tablas y columnas.
- Español es el idioma por defecto; no se detecta el idioma del navegador. El usuario lo cambia desde cualquier pantalla con `LocaleSelect` (presente en todos los layouts; todo layout nuevo debe incluirlo). La elección se guarda en localStorage y en `profiles.locale`.
- Todo texto visible sale de i18n (`es` y `en`). No se escriben strings hardcodeados en templates.
- Todo texto nuevo se agrega en ambos locales.

# Convenciones
- Editores de contenido del admin: edición en línea con `LocalizedTextEditor` (ES/EN), `ScoreSelect`, `IconAction` (lápiz/papelera visibles al hover en desktop, siempre en móvil) y `ConfirmDelete` para borrar. Un solo editor abierto a la vez.
- Borradores sin guardar: `UnsavedChangesBar` (barra con Guardar/Descartar) y `useUnsavedChangesGuard` (avisa antes de salir de la página o cerrar la pestaña). Lo creado en el borrador usa `tempId()` de `app/lib/tempId.ts` y se envía con id `null`.
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
