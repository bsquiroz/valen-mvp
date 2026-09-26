<script setup lang="ts">
import { THEMES } from '../data/themes'
import { useThemeStore } from '../store'

const themeStore = useThemeStore()
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="$t('theme.label')"
    class="flex flex-wrap gap-2"
  >
    <button
      v-for="theme in THEMES"
      :key="theme"
      type="button"
      role="radio"
      :aria-checked="themeStore.current === theme"
      class="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground aria-checked:border-primary aria-checked:ring-2 aria-checked:ring-ring/40"
      @click="themeStore.setTheme(theme)"
    >
      <!-- Muestra de los colores del tema: el atributo data-theme aplica sus tokens solo a este elemento -->
      <span
        :data-theme="theme"
        class="flex size-5 items-center justify-center rounded-full border border-border bg-background"
      >
        <span class="size-2.5 rounded-full bg-primary" />
      </span>
      {{ $t(`theme.names.${theme}`) }}
    </button>
  </div>
</template>
