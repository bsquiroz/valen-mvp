<script setup lang="ts">
import LocaleSelect from '@/features/locale/ui/LocaleSelect.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <!-- Barra mínima; la navegación completa llega en la Fase 3 -->
    <header class="flex items-center justify-between gap-4 border-b px-4 py-3">
      <span class="font-semibold tracking-tight">{{ $t('app.name') }}</span>
      <LocaleSelect />
    </header>
    <div class="flex-1">
      <slot />
    </div>
  </div>
</template>
