<script setup lang="ts">
import { LogOut } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useSignOut } from '@/features/auth/ui/useSignOut'
import LocaleSelect from '@/features/locale/ui/LocaleSelect.vue'

// Layout sin navegación para flujos que el usuario debe terminar (el diagnóstico inicial).
// Solo muestra el nombre de la app, el selector de idioma y la opción de cerrar sesión.
const { pending, signOut } = useSignOut()
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <p class="font-semibold tracking-tight">
          {{ $t('app.name') }}
        </p>
        <div class="ml-auto flex items-center gap-2">
          <LocaleSelect />
          <Button
            variant="ghost"
            size="sm"
            class="text-muted-foreground"
            :disabled="pending"
            :aria-label="$t('auth.signOut')"
            @click="signOut"
          >
            <LogOut />
            <span class="hidden sm:inline">{{ $t('auth.signOut') }}</span>
          </Button>
        </div>
      </div>
    </header>
    <main class="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-10">
      <slot />
    </main>
  </div>
</template>
