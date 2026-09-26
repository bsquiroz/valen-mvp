<script setup lang="ts">
import LocaleSelect from '@/features/locale/ui/LocaleSelect.vue'
import ThemeSelect from '@/features/theme/ui/ThemeSelect.vue'
</script>

<template>
  <div class="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
    <LocaleSelect class="absolute top-4 right-4" />
    <p class="text-lg font-semibold tracking-tight">
      {{ $t('app.name') }}
    </p>
    <div class="w-full max-w-sm">
      <slot />
    </div>
    <ThemeSelect />
  </div>
</template>
