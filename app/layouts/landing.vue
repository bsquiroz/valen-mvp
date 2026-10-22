<script setup lang="ts">
import '@fontsource-variable/archivo'
import LandingHeader from '@/features/landing/ui/LandingHeader.vue'

// Layout público de la landing de venta: tipografía Archivo y header propio (con el selector de idioma).
// Usa overflow-x-clip y no overflow-hidden, que rompería el header sticky.
</script>

<template>
  <div class="min-h-dvh overflow-x-clip bg-background font-display text-foreground">
    <LandingHeader />
    <slot />
  </div>
</template>
