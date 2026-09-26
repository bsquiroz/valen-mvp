<script setup lang="ts">
import { LOCALES } from '@/lib/locales'
import { useLocaleStore } from '../store'

const localeStore = useLocaleStore()
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="$t('locale.label')"
    class="inline-flex rounded-md border border-border p-0.5 text-xs font-medium"
  >
    <button
      v-for="locale in LOCALES"
      :key="locale"
      type="button"
      role="radio"
      :lang="locale"
      :aria-checked="localeStore.current === locale"
      :aria-label="$t(`locale.names.${locale}`)"
      class="rounded-sm px-2 py-1 uppercase text-muted-foreground transition-colors hover:text-foreground aria-checked:bg-secondary aria-checked:text-secondary-foreground"
      @click="localeStore.setLocale(locale)"
    >
      {{ locale }}
    </button>
  </div>
</template>
