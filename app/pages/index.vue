<script setup lang="ts">
// Página temporal para revisar los temas; se reemplaza en la Fase 3
import { Button } from '@/components/ui/button'
import SignOutButton from '@/features/auth/ui/SignOutButton.vue'
import { useProfileStore } from '@/features/profile/store'
import ThemeSelect from '@/features/theme/ui/ThemeSelect.vue'

const profileStore = useProfileStore()
</script>

<template>
  <main class="mx-auto flex max-w-2xl flex-col gap-6 p-4">
    <header class="flex flex-col gap-1">
      <div class="flex items-center justify-between gap-2">
        <h1 class="text-2xl font-semibold">
          {{ profileStore.profile?.displayName ? $t('home.greeting', { name: profileStore.profile.displayName }) : $t('app.welcome') }}
        </h1>
        <SignOutButton />
      </div>
      <p class="text-muted-foreground">
        {{ $t('preview.description') }}
      </p>
    </header>

    <ThemeSelect />

    <section class="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground">
      <h2 class="font-medium">
        {{ $t('preview.card') }}
      </h2>
      <p class="text-sm text-muted-foreground">
        {{ $t('preview.cardBody') }}
      </p>
      <input
        type="text"
        :placeholder="$t('preview.input')"
        class="h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
      <div class="flex flex-wrap gap-2">
        <Button>{{ $t('preview.primary') }}</Button>
        <Button variant="secondary">
          {{ $t('preview.secondary') }}
        </Button>
        <Button variant="outline">
          {{ $t('preview.outline') }}
        </Button>
        <Button variant="destructive">
          {{ $t('preview.destructive') }}
        </Button>
      </div>
      <div class="flex flex-wrap gap-2 text-xs font-medium">
        <span class="rounded-full bg-success px-2 py-0.5 text-success-foreground">{{ $t('preview.success') }}</span>
        <span class="rounded-full bg-warning px-2 py-0.5 text-warning-foreground">{{ $t('preview.warning') }}</span>
        <span class="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{{ $t('theme.label') }}</span>
      </div>
    </section>
  </main>
</template>
