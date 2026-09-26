<script setup lang="ts">
import { isNavActive, MAIN_NAV } from '../data/navigation'
import { NAV_ICONS } from './navIcons'

const route = useRoute()
</script>

<template>
  <nav
    :aria-label="$t('nav.main')"
    class="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
  >
    <ul class="grid grid-cols-5">
      <li
        v-for="item in MAIN_NAV"
        :key="item.to"
      >
        <NuxtLink
          :to="item.to"
          :aria-current="isNavActive(route.path, item.to) ? 'page' : undefined"
          class="flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground transition-colors aria-[current=page]:text-primary"
        >
          <component
            :is="NAV_ICONS[item.icon]"
            class="size-5"
            aria-hidden="true"
          />
          {{ $t(item.labelKey) }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
