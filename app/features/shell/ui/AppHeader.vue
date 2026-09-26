<script setup lang="ts">
import LocaleSelect from '@/features/locale/ui/LocaleSelect.vue'
import { isNavActive, MAIN_NAV } from '../data/navigation'
import UserMenu from './UserMenu.vue'

const route = useRoute()
</script>

<template>
  <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
      <NuxtLink
        to="/"
        class="font-semibold tracking-tight"
      >
        {{ $t('app.name') }}
      </NuxtLink>

      <!-- En desktop la navegación va aquí; en móvil, en la barra inferior -->
      <nav
        :aria-label="$t('nav.main')"
        class="hidden items-center gap-1 md:flex"
      >
        <NuxtLink
          v-for="item in MAIN_NAV"
          :key="item.to"
          :to="item.to"
          :aria-current="isNavActive(route.path, item.to) ? 'page' : undefined"
          class="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
        >
          {{ $t(item.labelKey) }}
        </NuxtLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <LocaleSelect />
        <UserMenu />
      </div>
    </div>
  </header>
</template>
