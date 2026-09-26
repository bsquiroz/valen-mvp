<script setup lang="ts">
import AppHeader from '@/features/shell/ui/AppHeader.vue'
import BottomNav from '@/features/shell/ui/BottomNav.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader />
    <!-- Espacio inferior para que la barra de navegación móvil no tape el contenido -->
    <main class="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-24 md:pb-10">
      <slot />
    </main>
    <BottomNav />
  </div>
</template>
